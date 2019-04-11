var Stt = (function(){
	   

    var recording=false;
    var stream;
    var mediaRecorder;
    var audio;
    var blob;
    var index = 1;
    var transcript;
    init();

	return {
		speechToText: speechToText,
    recordSpeech: recordSpeech,
    textToSpeech: textToSpeech,

    showTranscript: function (){
      console.log("showTranscript:"+transcript);
      return transcript;
    }

	};
    
    function init(){
         var chunks=[];

         if (navigator.mediaDevices.getUserMedia) {
            console.log('getUserMedia supported.');
            var constraints = { audio: true };
            navigator.mediaDevices.getUserMedia(constraints).
            then(function(stream){
               mediaRecorder = new MediaRecorder(stream);
               document.getElementById("mic-image").removeAttribute("hidden");
               console.log('mediaRecorder init!');
                mediaRecorder.onstop = function(e) {
                  console.log("data available after MediaRecorder.stop() called.");
                  document.getElementById("refreshImageID").style.visibility = "visible";
                  /*var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
                  console.log(clipName);
                  var clipContainer = document.createElement('article');
                  var clipLabel = document.createElement('p');*/
                  audio = document.createElement('audio');
                 /* var deleteButton = document.createElement('button');*/
     
                  // clipContainer.classList.add('clip');
                  audio.setAttribute('controls', '');
                  /*deleteButton.textContent = 'Delete';
                  deleteButton.className = 'delete';*/

                  /*if(clipName === null) {
                    clipLabel.textContent = 'My unnamed clip';
                  } else {
                    clipLabel.textContent = clipName;
                  }*/

                  /*clipContainer.appendChild(audio);
                  clipContainer.appendChild(clipLabel);
                  clipContainer.appendChild(deleteButton);
                  soundClips.appendChild(clipContainer);*/
                  var _html = '<p class="weixinAudio'+index+'">\n' +
                      '\t\t\t<audio style="height:20px!important"src=""  id="media"  preload></audio>\n' +
                      '\t\t\t<span id="audio_area" class="db audio_area">\n' +
                      '\t\t\t<span class="audio_wrp db">\n' +
                      '\t\t\t<span class="audio_play_area">\n' +
                      '\t\t\t\t<i class="icon_audio_default"></i>\n' +
                      '\t\t\t\t<i class="icon_audio_playing"></i>\n' +
                      '            </span>\n' +
                      '\t\t\t<span id="audio_length" class="audio_length tips_global"></span>\n' +
                      /*'\t\t\t<span class="db audio_info_area">\n' +
                      '                <strong class="db audio_title">Recording </strong>\n' +
                      '                <span class="audio_source tips_global">playback</span>\n' +
                      '\t\t\t</span>\n' +*/
                      '\t\t\t<span id="audio_progress" class="progress_bar" style="width: 0%;"></span>\n' +
                      '\t\t\t</span>\n' +
                      '\t\t\t</span>\n' +
                      '\t\t</p>';
                  //ocument.getElementById('mCSB_1_container').appendChild(_html);
                  $("#mCSB_1_container").append(_html);
                  audio.controls = true;
                  blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
                  
                  var audioURL = window.URL.createObjectURL(blob);
                  //console.log("audio url:"+audioURL);
                  //audio.src = audioURL;
                  //var audioDiv = buildAudioElement(audioURL);
                    setTimeout(function () {
                        $(".weixinAudio"+index).weixinAudio({
                            src:audioURL
                        });
                        index++;
                    },1000)

                }

               mediaRecorder.ondataavailable = function(e) {
                chunks.pop();
                chunks.push(e.data);
                speechFileToText();

               }

            }).catch(function(err){
                console.log("error happen:"+err);
            });

         } else {
            console.log('getUserMedia not supported on your browser!');
         }

    }

  
  function recordSpeech(){
    console.log("record speech :");
    if(recording===false){
            recording = true;
            console.log("***start speaking***");
            mediaRecorder.start();   
            console.log(mediaRecorder.state);
            document.getElementById("mic-image").style.backgroundColor="red";
            document.getElementById("mic-image").style.color="white";
     }else{
            console.log("***stop speaking***");
            document.getElementById("mic-image").style.backgroundColor="white";
            document.getElementById("mic-image").style.color="#9855d4";
            recording = false;
            mediaRecorder.stop(); 
            /*stream.stop();*/
      }
  }

  function speechFileToText(){

      fetch('/api/speech-to-text/token')
            .then(function(response) {
                return response.text();
            }).then(function (token) {

             stream = WatsonSpeech.SpeechToText.recognizeFile({
                 token: token,
                 data: blob,  
                 outputElement: '#audioMessage' ,// CSS selector or DOM Element  
                 play: false,              // Number of seconds to wait before closing input stream
                 format: true,                      // Inhibits errors
                 realtime: true              
            });
              
              stream.on('data',function(data){
                transcript=data.alternatives[0].transcript;
                var context= Api.getResponsePayload().context;
                if(data.final==true){
                  Api.sendRequest(transcript, context,false);
                  ConversationPanel.scrollToChatBottom();
                }                
                console.log("data:"+JSON.stringify(data));
                console.log("parse data:"+data.alternatives[0].transcript);
                
              });

             stream.on('error', function(err) {
               console.log(err);
            });
       
            }).catch(function(error) {
              console.log(error);
            });
  }

  function textToSpeech(content){
    console.log("text to speech in!");
     fetch('/api/text-to-speech/token')
    .then(function(response) {
      return response.text();
    }).then(function (token) {
      console.log("text to speech in:");
      WatsonSpeech.TextToSpeech.synthesize({
        text: content,
        token: token
      });
      /*.on('error', function(err) {
        console.log('audio error: ', err);
      });*/
    });

  }

	function speechToText(){
		if(recording===false){
			console.log("***start speaking***");
            mediaRecorder.start();   
            console.log(mediaRecorder.state);
            
            /*
			fetch('/api/speech-to-text/token')
            .then(function(response) {
                return response.text();
            }).then(function (token) {

            recording = true;

            stream = WatsonSpeech.SpeechToText.recognizeMicrophone({
            	 token: token,
                 continuous: false,  
                 outputElement: '#textInput' ,// CSS selector or DOM Element
                 inactivity_timeout: 5,              // Number of seconds to wait before closing input stream
                 format: false,                      // Inhibits errors
                 keepMicrophone: true
            });
            
            document.getElementById("mic-image").style.backgroundColor="red";
            document.getElementById("mic-image").style.color="white";
            stream.on('error', function(err) {
               console.log(err);
            });
       
            }).catch(function(error) {
              console.log(error);
            });*/
	    }else{
	    	console.log("***stop speaking***");
            document.getElementById("mic-image").style.backgroundColor="white";
            document.getElementById("mic-image").style.color="#9855d4";
	    	recording = false;
            mediaRecorder.start(); 
            /*stream.stop();*/
	    }
	}
       

}());