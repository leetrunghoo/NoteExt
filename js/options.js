var flagCheck = localStorage.getItem("chkRecording");
var chkRecording = document.getElementById('chkRecording');

if (!flagCheck) {
    chkRecording.onclick = function () {
        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia;

        var mediaConstraints = {
            audio: true
        };
        navigator.getUserMedia(mediaConstraints, onMediaSuccess, onMediaError);

        function onMediaSuccess(stream) {
            console.log('Great! Now we can record your voice :D');
            chkRecording.disabled = 'disabled';
            localStorage.setItem("chkRecording", true);
        }

        function onMediaError(e) {
            console.error('media error', e);
        }
    }
} else {
    chkRecording.disabled = 'disabled';
    chkRecording.checked = 'checked';
}