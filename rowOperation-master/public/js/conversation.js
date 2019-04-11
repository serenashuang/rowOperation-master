// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

var ConversationPanel = (function() {

    var chatRecord = [];
    var myDate = new Date();
    var count = 1
    var countModal = 1
    var getStatusEndpoint = '/api/getStatus/';
    var settings = {
        selectors: {
            chatBox: '#scrollingChat',
            fromUser: '.from-user',
            fromWatson: '.from-watson',
            latest: '.latest'
        },
        authorTypes: {
            user: 'user',
            watson: 'watson'
        }
    };

    // Publicly accessible methods defined
    return {
        init: init,
        inputKeyDown: inputKeyDown,
        scrollToChatBottom: scrollToChatBottom
    };

    // Initialize the module
    function init() {
           localStorage.setItem("gt", "0");
        chatUpdateSetup();
        Api.sendRequest('', null);
        setupInputBox();

    }


    function getAppByCode(appCode, context) {
        var payloadToWatson = {};
        if (appCode) {
            payloadToWatson.input = {
                text: appCode
            };
        }
        if (context) {
            payloadToWatson.context = context;
        }

        var http = new XMLHttpRequest();
        http.open('POST', 'judge/oneteam_robot_database_appCode' + '?appCode=' + appCode, true);
        http.setRequestHeader('Content-type', 'application/json');
        http.onreadystatechange = function() {
            if (http.readyState === 4 && http.status === 200 && http.responseText) {
                var responseJson = JSON.parse(http.responseText);
                if(responseJson.output.text[0] == 'false'){
                        responseJson.output.text[0] = 'Seems I can not find your application or you do not want to see your specific application,what else can I do for you?';
                        var responseText = JSON.stringify(responseJson);
                        Api.setResponsePayload(responseText);
                    }else{
                        Api.setResponsePayload(http.responseText);
                    }
            }
        };

        var params = JSON.stringify(payloadToWatson);
        // Stored in variable (publicly visible through Api.getRequestPayload)
        // to be used throughout the application
        //if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
            //Api.setRequestPayload(params);
        //}

        // Send request
        http.send(params);
        localStorage.setItem("gt", "0");
    }

    function getAppByName(appName, context) {
        var payloadToWatson = {};
        if (appName) {
            payloadToWatson.input = {
                text: appName
            };
        }
        if (context) {
            payloadToWatson.context = context;
        }

        var http = new XMLHttpRequest();
        http.open('POST', 'judge/oneteam_robot_database_name' + '?appName=' + appName, true);
        http.setRequestHeader('Content-type', 'application/json');
        http.onreadystatechange = function() {
            if (http.readyState === 4 && http.status === 200 && http.responseText) {
                var responseJson = JSON.parse(http.responseText);
                if(responseJson.output.text[0] == 'false'){
                    getAppByCode(appName, context);
                    }else{
                        Api.setResponsePayload(http.responseText);
                    }
            }
        };

        var params = JSON.stringify(payloadToWatson);
        // Stored in variable (publicly visible through Api.getRequestPayload)
        // to be used throughout the application
        if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
            Api.setRequestPayload(params);
        }

        // Send request
        http.send(params);
    }




    // Set up callbacks on payload setters in Api module
    // This causes the displayMessage function to be called when messages are sent / received
    function chatUpdateSetup() {
        console.log("conversation chatUpdateSetup");
        var currentRequestPayloadSetter = Api.setRequestPayload;
        Api.setRequestPayload = function(newPayloadStr) {
            console.log("conversation chatUpdateSetup setRequestPayload");
            currentRequestPayloadSetter.call(Api, newPayloadStr);
            displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);

            // loading and canoot type until it got response
        
      
            document.getElementById("textInput").readOnly = true;
            document.getElementById("refreshImageID").style.visibility = "visible";
        };

        var currentResponsePayloadSetter = Api.setResponsePayload;
        Api.setResponsePayload = function(newPayloadStr,ifAudioInput) {
            console.log("conversation chatUpdateSetup setResponsePayload");
            console.log("ifAudioInput:"+ifAudioInput);
            var watsonResponse = JSON.parse(newPayloadStr);
            if(ifAudioInput==false){
                 watsonResponse.output.text = "Your question is:"+ watsonResponse.input.text+ "Answer is:"+watsonResponse.output.text;//+"<br>"
            }         
            currentResponsePayloadSetter.call(Api, newPayloadStr,false);
            displayMessage(watsonResponse, settings.authorTypes.watson);
            document.getElementById("refreshImageID").style.visibility = "hidden";
            console.log("response is:"+newPayloadStr);
        };
    }

    // Set up the input box to underline text as it is typed
    // This is done by creating a hidden dummy version of the input box that
    // is used to determine what the width of the input text should be.
    // This value is then used to set the new width of the visible input box.
    function setupInputBox() {
        var input = document.getElementById('textInput');
        var dummy = document.getElementById('textInputDummy');
        var minFontSize = 14;
        var maxFontSize = 16;
        var minPadding = 4;
        var maxPadding = 6;

        // If no dummy input box exists, create one
        if (dummy === null) {
            var dummyJson = {
                'tagName': 'div',
                'attributes': [{
                    'name': 'id',
                    'value': 'textInputDummy'
                }]
            };

            dummy = Common.buildDomElement(dummyJson);
            document.body.appendChild(dummy);
        }

        function adjustInput() {
            if (input.value === '') {
                // If the input box is empty, remove the underline
                input.classList.remove('underline');
                input.setAttribute('style', 'width:' + '100%');
                input.style.width = '100%';
            } else {
                // otherwise, adjust the dummy text to match, and then set the width of
                // the visible input box to match it (thus extending the underline)
                input.classList.add('underline');
                var txtNode = document.createTextNode(input.value);
                ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height',
                    'text-transform', 'letter-spacing'
                ].forEach(function(index) {
                    dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
                });
                dummy.textContent = txtNode.textContent;

                var padding = 0;
                var htmlElem = document.getElementsByTagName('html')[0];
                var currentFontSize = parseInt(window.getComputedStyle(htmlElem, null).getPropertyValue('font-size'), 10);
                if (currentFontSize) {
                    padding = Math.floor((currentFontSize - minFontSize) / (maxFontSize - minFontSize) * (maxPadding - minPadding) + minPadding);
                } else {
                    padding = maxPadding;
                }

                var widthValue = (dummy.offsetWidth + padding) + 'px';
                input.setAttribute('style', 'width:' + widthValue);
                input.style.width = widthValue;
            }
        }

        // Any time the input changes, or the window resizes, adjust the size of the input box
        input.addEventListener('input', adjustInput);
        window.addEventListener('resize', adjustInput);

        // Trigger the input event once to set up the input box and dummy element
        Common.fireEvent(input, 'input');
    }

    // Display a user or Watson message that has just been sent/received
    function displayMessage(newPayload, typeValue) {
        console.log("conversation displayMessage in");
        var isUser = isUserMessage(typeValue);
        var textExists = (newPayload.input && newPayload.input.text) || (newPayload.output && newPayload.output.text);
        if (isUser !== null && textExists) {
            // Create new message DOM element
            if(newPayload["output"]!=undefined){
                console.log("read the answer if got response!");
                
                if(newPayload.output.text.indexOf('Job A is triggered')>-1|| newPayload.output.text.indexOf('Job B is triggered')>-1 ||
                    newPayload.output.text[0].indexOf('Job A is triggered')>-1 || newPayload.output.text[0].indexOf('Job B is triggered')>-1){
                   var text="";
                   var jobName="";
                   var jobParam={};
                   var jobData = getQueryString('email');
                   if(newPayload.output.text[0].indexOf('Job A')>-1 || newPayload.output.text.indexOf('Job A is triggered')>-1 ){
                     text = 'Job A';
                     jobName = text.replace(/\s/ig,'');
  
                    }else{
                     text = 'Job B';
                     jobName = text.replace(/\s/ig,'');
                    }
                    var jobParam = {'fileName':jobName,'jobData':jobData};
                    $.post("/writeFile", jobParam,function(res){
                      console.log('writeFile response:'+res);
                      if(res=='200'){
                        console.log('write file successfully!');
                      }else if(res=='400'){
                        console.log('write file failed!');
                      }
                    });
                };
                if (Object.prototype.toString.call(newPayload.output.text) !== '[object Array]') {
                          newPayload.output.text = [newPayload.output.text];
                  }
                var readStr="";
                if(newPayload.output.text[0]!=""){
                   readStr=newPayload.output.text[0].replace(/&&/ig,' ');
                   console.log("text[0]*****"+newPayload.output.text[0]);
                }else if(newPayload.output.text!=""){
                    console.log("text*****"+newPayload.output.text);
                   readStr = newPayload.output.text;
                }
                 
                if(readStr.indexOf('Job A')>-1 && readStr.indexOf('Job B')>-1){
                    readStr = readStr.replace(/Job B/ig, 'or Job B');
                }
              /*  Stt.textToSpeech(readStr);*/
                if(newPayload.output.text[0].indexOf("Answer is")>-1 && newPayload.output.text[0].indexOf("Your question is")>-1){
                    newPayload.output.text = newPayload.output.text[0].replace(/Answer is/i, "<br> Answer is");
                    console.log('answer is:'+newPayload.output.text[0]);
                    
                }
            }
            var messageDivs = buildMessageDomElements(newPayload, isUser);

            
            var chatBoxElement = document.querySelector(settings.selectors.chatBox);
            var previousLatest = chatBoxElement.querySelectorAll((isUser ? settings.selectors.fromUser : settings.selectors.fromWatson) + settings.selectors.latest);

            // Previous "latest" message is no longer the most recent
            if (previousLatest) {
                Common.listForEach(previousLatest, function(element) {
                    element.classList.remove('latest');

                });
            }

            messageDivs.forEach(function(currentDiv) {

                document.getElementById("mCSB_1_container").appendChild(currentDiv);
                // Class to start fade in animation
                currentDiv.classList.add('load');
                chatRecord.push(messageDivs[0].textContent) // push chatrecord in array


            });
           
            // Move chat to the most recent messages when new messages are added
            scrollToChatBottom();
            // all infomation shown hidde the loading gif
            document.getElementById("textInput").readOnly = false;
            document.getElementById("refreshImageID").style.visibility = "hidden";
            // first time comein display loading image
            document.getElementsByClassName("loadingChat")[0].style.display = "none";
        }
    }


    // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
    // Returns true if user, false if Watson, and null if neither
    // Used to keep track of whether a message was from the user or Watson
    function isUserMessage(typeValue) {
        if (typeValue === settings.authorTypes.user) {
            return true;
        } else if (typeValue === settings.authorTypes.watson) {
            return false;
        }
        return null;
    }


    //outputimage
    function outputImage(b, a) {
        var dialog = document.createElement("div");
        var url = document.createElement("a");
        var img = document.createElement("img")
        dialog.style.height = "auto";
        dialog.style.width = "20.56rem";
        dialog.style.margin = "0.3125rem";
        dialog.style.padding = "0 2.2rem";
        url.innerHTML = 'link';
        url.href = b;
        url.target = "_blank";
        img.src = a;
        img.style.maxWidth = "100%";
        img.style.height = "auto"
        img.className = "imgInfo" + count

        document.getElementById("mCSB_1_container").appendChild(dialog);
        dialog.appendChild(url);
        dialog.appendChild(img);

        // enlarge image
        var btn = document.getElementsByClassName("imgInfo" + count)[0];
        btn.addEventListener("click", function() {
            var btnImg = btn.src
            window.open(btnImg, "newwindow2", "height=600, width=1000,top=0, left=100, toolbar=no, menubar=no, scrollbars=no, resizable=no,location=no, status=no")

        }, false)
        count++;

    }

   
    // Constructs new DOM element from a message payload
    function buildMessageDomElements(newPayload, isUser) {
        var textArray = isUser ? newPayload.input.text : newPayload.output.text;
        var emailGuild = '';
        if(!isUser){
            for(var i = 0; i < newPayload.entities.length; i++){
                if(newPayload.entities[i].entity == 'Domain')
                        emailGuild = newPayload.entities[i].value;
           }
        }
        //var emailGuild = !isUser&&newPayload.entities[0] ? newPayload.entities[0].value : '';
        var emailContent = isUser ? '' : newPayload.input.text;
        var readContent = isUser ? '' : newPayload.output.text;
        var emailAddress = getQueryString("email");
        if (Object.prototype.toString.call(textArray) !== '[object Array]') {
            textArray = [textArray];
        }
        var messageArray = [];
        textArray.forEach(function(currentText) {
            if(!isUser && (currentText.indexOf("How can I help you")>-1 && (currentText.indexOf("Hello")>-1 || currentText.indexOf("hello")>-1))){
                var name = getQueryString("name");
                currentText = currentText.replace(/Hello/i,"Hello "+name);
            }
            if(currentText.indexOf("&&")>0){
               currentText.split("&&").forEach(function(showText){
                if (showText && ((showText.indexOf("What can I do for you")<0) && (showText.indexOf(":")<0))) {
                    showText = showText.trim();
                  var messageJson = {
                    'tagName': 'div',
                    'classNames': ['segments'],
                    'children': [{
                        'tagName': 'div',
                        'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
                        'children': [{
                            'tagName': 'div',
                            'classNames': ['message-inner'],
                            'children': [{
                                'tagName': 'p',
                                'children':[{
                                    'tagName':'a',
                                    'text':showText,
                                    'attributes':[{
                                        'name':'onclick',
                                        'value':'clickLink("'+showText+'")'
                                    }]
                                }]
                            }]
                        }]
                    }]
                  };
                  messageArray.push(Common.buildDomElement(messageJson));
                }else{
                     showText = showText.trim();
                     var messageJson = {
                    'tagName': 'div',
                    'classNames': ['segments'],
                    'children': [{
                        'tagName': 'div',
                        'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
                        'children': [{
                            'tagName': 'div',
                            'classNames': ['message-inner'],
                            'children': [{
                                'tagName': 'p',
                                'text': showText
                            }]
                        }]
                    }]
                  };
                  messageArray.push(Common.buildDomElement(messageJson));
                }
              });
            }else{
                 if (currentText) {
                    var tmp = "";
                    var messageJson = {
                    'tagName': 'div',
                    'classNames': ['segments'],
                    'children': [{
                        'tagName': 'div',
                        'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
                        'children': [{
                            'tagName': 'div',
                            'classNames': ['message-inner'],
                            'children': [{
                                'tagName': 'p',
                                'text': currentText + tmp
                            }]
                        }]
                    }]
                  };

                  messageArray.push(Common.buildDomElement(messageJson));
                }
            }
            

        });

        return messageArray;
    }

    function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
     } 

     

    // Scroll to the bottom of the chat window (to the most recent messages)
    // Note: this method will bring the most recent user message into view,
    //   even if the most recent message is from Watson.
    //   This is done so that the "context" of the conversation is maintained in the view,
    //   even if the Watson message is long.
    function scrollToChatBottom() {
        console.log("scrollToChatBottom");
        var scrollingChat = document.querySelector('#scrollingChat');

        // Scroll to the latest message sent by the user
        var scrollEl = scrollingChat.querySelector(settings.selectors.fromUser + settings.selectors.latest);


        if (scrollEl) {
            scrollingChat.scrollTop = scrollEl.offsetTop;

        }
        $(".content").mCustomScrollbar("scrollTo", "last");

    }

    // Handles the submission of input
    function inputKeyDown(event, inputBox) {
        // Submit on enter key, dis-allowing blank messages
        if (event.keyCode === 13 && inputBox.value) {
            // Retrieve the context from the previous server response
            var context;
            var latestResponse = Api.getResponsePayload();
            if (latestResponse) {
                context = latestResponse.context;
            }

            // Send the user message
            var gt = localStorage.getItem("gt");
            if (gt == "request") {
                getAppByName(inputBox.value, context);
            }else {
                Api.sendRequest(inputBox.value, context);
            }

            // Clear input box for further messages
            inputBox.value = '';
            Common.fireEvent(inputBox, 'input');
            ++countModal;
        } //display a modal to ask customer the answer
        // else if(countModal!=1){
        //     alert("ok")
        //     inputBox.value = '';
        //     Common.fireEvent(inputBox, 'input');
        // }


    }

    // function SaveRecord(){    
    //     alert(1)
    //     var a_n = window.event.screenX - window.screenLeft;    
    //     var a_b = a_n > document.documentElement.scrollWidth-20;    
    //     if(a_b && window.event.clientY< 0 || window.event.altKey){    
    //          alert(chatRecord); 
    //     }
    // }





}());
