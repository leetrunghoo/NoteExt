document.addEventListener('DOMContentLoaded', function () {
    var cStorageArea = chrome.storage.sync;
    var cStorageAreaLocal = chrome.storage.local;
    var btnAddNote = document.getElementById('btnAddNote');
    var btnRecord = document.getElementById('btnRecord');
    var btnStop = document.getElementById('btnStop');
    var btnSaveNoteText = document.getElementById('btnSaveNoteText');
    var btnCancelNoteText = document.getElementById('btnCancelNoteText');
    var audio = document.getElementById('audio');
    var listNotes = document.getElementById('listNotes');
    var txtNote = document.getElementById('txtNote');
    var txtNoteText = document.getElementById('txtNoteText');
    var deleteNote = document.getElementsByClassName('deleteNote');
    var arrCurrentNotes = [];
    var arrCurrentRecords = [];
    var recordObj_tmp;

    $('.modal-trigger').leanModal({
        dismissible: false // Modal can't be dismissed by clicking outside of the modal
    }
    );

    function addNote2UI(note) {
        var li = document.createElement("li");
        li.className = "collection-item note";
        li.innerHTML = '<div class="title truncate">' + note.text + '</div>' + note.date + '<a href="#!" class="secondary-content deleteNote"><i class="mdi-action-delete"></i></a>';
        listNotes.appendChild(li);
    }

    function addRecord2UI(record) {
        console.log(record);
        var li = document.createElement("li");
        li.className = 'collection-item record';
        li.innerHTML = '<div class="title truncate">' + record.text + '</div><audio controls="" ></audio><br/>' + record.date + '<a href="#!" class="secondary-content deleteRecord"><i class="mdi-action-delete"></i></a>';
        listNotes.appendChild(li);
        var recordAudio = li.children[1];
        recordAudio.src = record.recordData;
    }

    function saveNotes2Storage(arrCurrentNotes) {
        cStorageArea.set({
            'notes': arrCurrentNotes
        }, function () {
            console.log('current notes are saved');
        });
    }

    function saveRecords2Storage(arrRecords) {
        cStorageAreaLocal.set({
            'records': arrRecords
        }, function () {
            console.log('current records are saved');
        });
    }

    // load old notes
    cStorageArea.get("notes", function (data) {
        if (data.notes && data.notes.length > 0) {
            for (i in data.notes) {
                var note = data.notes[i];
                console.log('note', note);
                arrCurrentNotes.push(note);
                addNote2UI(note);
            }
        }
    });

    // load old record
    cStorageAreaLocal.get("records", function (data) {
        console.log('records', data);
        if (data.records && data.records.length > 0) {
            for (i in data.records) {
                var record = data.records[i];
                console.log('record', record);
                arrCurrentRecords.push(record);
                addRecord2UI(record);
            }
        }
    });

    // add note!
    btnAddNote.addEventListener('click', function () {
        if (!txtNote.value) {
            alert('Please enter note :)');
            return;
        }

        var note = newNoteObj(getTime(), txtNote.value);
        // Save it using the Chrome extension storage API.
        arrCurrentNotes.push(note);
        saveNotes2Storage(arrCurrentNotes);
        // add note to UI
        addNote2UI(note);
        txtNote.value = "";
    }, false);

    // delete note
    $("#listNotes").on("click", ".deleteNote", function () {
        var i = $(".note").index($(this).parent());
        arrCurrentNotes.splice(i, 1);
        saveNotes2Storage(arrCurrentNotes);
        $(this).parent().remove();
    });
    // delete record
    $("#listNotes").on("click", ".deleteRecord", function () {
        var i = $(".record").index($(this).parent());
        arrCurrentRecords.splice(i, 1);
        saveRecords2Storage(arrCurrentRecords);
        $(this).parent().remove();
    });


    // record
    var audioStream;
    var recorder;
    var isRecording = false;

    btnRecord.onclick = function () {
        navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
        if (!isRecording) {
            var mediaConstraints = {
                audio: true
            };
            navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);

            function onMediaSuccess(stream) {
                if (!audioStream) {
                    if (window.IsChrome) {
                        stream = new window.MediaStream(stream.getAudioTracks());
                    }
                    audioStream = stream;

                    // "audio" is a default type
                    recorder = RecordRTC(stream, {
                        type: 'audio',
                        bufferSize: 16384,
                        sampleRate: 44100,
                        leftChannel: false,
                        disableLogs: false
                    });
                    recorder.startRecording();
                } else {
                    audio.src = URL.createObjectURL(audioStream);
                    audio.muted = true;
                    audio.play();
                    if (recorder) {
                        recorder.startRecording();
                    }
                }
                isRecording = true;
            }

            function onMediaError(e) {
                console.error('media error', e);
                $('#modalRecording').closeModal();
                alert('please check "Use recording feature" in Option Page');
            }
        } else {
            stopRecording();
        }
    };

    btnStop.onclick = stopRecording;

    function stopRecording() {
        audio.src = '';
        isRecording = false;
        if (recorder) {
            recorder.stopRecording(function (url) {
                audio.src = url;
                audio.muted = false;
                audio.play();
                recorder.getDataURL(function (dataURL) {
                    recordObj_tmp = newRecordObj(getTime(), "", dataURL);
                    $('#modalNoteText').openModal();
                });
            });
        }
    }

    // add record!
    btnSaveNoteText.onclick = function () {
        if (!txtNoteText.value) {
            alert('Please enter note :)');
            return;
        }
        recordObj_tmp.text = txtNoteText.value;
        arrCurrentRecords.push(recordObj_tmp);
        // Save it using the Chrome extension storage API.
        saveRecords2Storage(arrCurrentRecords);
        // add to UI
        addRecord2UI(recordObj_tmp);
        txtNoteText.value = "";
        $('#modalNoteText').closeModal();
        $('#modalRecording').closeModal();
    };
    
    btnCancelNoteText.onclick = function() {
        $('#modalNoteText').closeModal();
        $('#modalRecording').closeModal();
    };

});

chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
    }
});

function getTime() {
    var date = new Date().toString();
    date = date.split("GMT")[0];
    return date;
}

function newNoteObj(date, text) {
    return {
        date: date,
        text: text
    };
}


function newRecordObj(date, text, recordData) {
    var obj = newNoteObj(date, text);
    obj.recordData = recordData;
    return obj;
}