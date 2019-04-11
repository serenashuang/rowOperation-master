var express = require('express');

// START OF CHANGE
var session = require('express-session');
var passport = require('passport'); 
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');


var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk
var unirest = require('unirest');
var https = require('https');
var Q = require('q');
var deferred = Q.defer();
//var ibmdb = require('ibm_db');

// END OF CHANGE

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// read settings.js
var settings = require('./settings.js');

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

// create a new express server
var app = express();
//CHANGE ME Uncomment the following section if running locally
/*https.createServer({
  key: fs.readFileSync('key.pem'),
   cert: fs.readFileSync('cert.pem')
}, app).listen(9439);*/

// START OF CHANGE
app.use(cookieParser());
app.use(session({resave: 'true', saveUninitialized: 'true' , secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session()); 

app.use('/api/speech-to-text/', require('./speech/stt-token.js'));
app.use('/api/text-to-speech/', require('./speech/tts-token.js'));

passport.serializeUser(function(user, done) {
	   done(null, user);
}); 

passport.deserializeUser(function(obj, done) {
	   done(null, obj);
});         

var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;

var Strategy = new OpenIDConnectStrategy({
                 authorizationURL : settings.authorization_url,
                 tokenURL : settings.token_url,
                 clientID : settings.client_id,
                 scope: 'openid',
                 response_type: 'code',
                 clientSecret : settings.client_secret,
                 callbackURL : settings.callback_url,
                 skipUserProfile: true,
                 issuer: settings.issuer_id}, 
         function(iss, sub, profile, accessToken, refreshToken, params, done)  {
	        process.nextTick(function() {
                profile.accessToken = accessToken;
		profile.refreshToken = refreshToken;
		done(null, profile);
	      	})
}); 

passport.use(Strategy); 

app.get('/', function(req, res) {	
  res.redirect('/chat.html');
/*	if (!req.isAuthenticated()) {
/*		res.redirect('/login');
	} else {
		res.redirect('/clientRedirect');
	}*/
	
});

app.get('/login', passport.authenticate('openidconnect', {})); 

function ensureAuthenticated(req, res, next) {
	if (!req.isAuthenticated()) {
		req.session.originalUrl = req.originalUrl;

		
		res.redirect('/login');
	} else {

		return next();
	}
}

// handle callback, if authentication succeeds redirect to
// original requested url, otherwise go to /failure

app.get('/start',function(req, res) {
	var redirect_url = req.session.originalUrl;
	console.log("redirect url:" + redirect_url );
	passport.authenticate('openidconnect', {
		successRedirect: redirect_url,
		failureRedirect: '/failure',
	})(req,res);
});

app.get('/auth/sso/callback',function(req,res){
     console.log("sso callback is in");
     passport.authenticate('openidconnect',{
         successRedirect: '/clientRedirect',
		failureRedirect: '/failure',
     })(req,res);
});

app.get('/clientRedirect',function(req,res){
	var name = req.user._json.cn;
	var email = req.user._json.emailAddress;
	console.log("login email is:"+email);
	console.log("login name is:"+name);
	res.redirect('/chat.html?name='+name+'&email='+email);
})

app.get('/failure', function(req, res) {
	res.send('login failed'); });

app.get('/hello', ensureAuthenticated, function(req, res) {
	var claims = req.user['_json'];
	console.log(claims);
        var html ="<p>Hello " + claims.firstName + " " + claims.lastName + ": </p>";

        html += "<pre>" + JSON.stringify(req.user, null, 4) + "</pre>";
        html += "<hr> <a href=\"/\">home</a>";
	//res.send('Hello '+ claims.given_name + ' ' + claims.family_name + ', your email is ' + claims.email + '<br /> <a href=\'/\'>home</a>');

        res.send(html);
        });


app.get('/logout', function(req,res) {
       req.session.destroy();
       req.logout();
    fs.readFile("public/slo.html", function(err,data) {
        res.writeHead(200, {'Content-Type':'text/html'});
        res.write(data);
        res.end();
     });
});


// END OF CHANGE

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

app.use(express.static(__dirname + '/'));
// get the app environment from Cloud Foundry
// CHANGE ME Comment out following line if running locally
 var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
// CHANGE ME Comment out following line if running locally


//********add by amy********************
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // routes

// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
   username: 'a58b7a26-900c-4204-898b-0de5ab3a3b64',
  password: 'P8gpNblMeelF',
  url: 'https://gateway.watsonplatform.net/assistant/api',
  version_date: '2016-10-21',
  version: 'v1'
});

app.post('/api/message', function(req, res) {
	  var payload = {
	    workspace_id: '240cab53-da3f-4061-8a24-af8d160996e4',
	    context: req.body.context || {},
	    input: req.body.input || {}
	  };

	  // Send the input to the conversation service
	  conversation.message(payload, function(err, data) {
	    if (err) {
	      return res.status(err.code || 500).json(err);
	    }
	    return res.json(data);//updateMessage(payload, data)
	  });
});

app.post('/api/sendEmail',function(req, response){

    console.log("send mail in");
    console.log(req.body);  
    var emailBody ={
        "contact": req.body.mailSender,
			"recipients": [
				{"recipient": req.body.mailReciver }
			],
			"cc": [
				{"recipient": req.body.mailSender }
			],	
			"subject": req.body.mailSubject,
			"message": req.body.mailContent
    };

    var opt = {
      host:'bluemail.w3ibm.mybluemix.net',
      method:'POST',
      path:'/rest/v2/emails',
      headers:{
	            'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(emailBody))
	          },
	  auth: settings.blueMail_userName+":"+ settings.blueMail_passWord
     };

	var body = '';
    var req = https.request(opt, function(res) {
      console.log("Got response from BlueMail service: " + res.statusCode);
      res.setEncoding('utf8');
	  res.on('data',function(d){
      body += d;
      }).on('end', function(){
        console.log(res.headers);
        body["status"] = res.statusCode;
        console.log(body);
        response.writeHead(res.statusCode,{
		  "Content-Type":"application/json",
		  "Access-Control-Allow-Origin":"*",
		  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
          "access-control-allow-headers": "Origin, content-type, accept"});  
	    response.write(JSON.stringify(res.statusCode));
	    response.end();});
      }).on('error', function(e) {
      console.log("Got error: " + e.message);
    });
	req.write(JSON.stringify(emailBody));
    req.end();
});

app.post('/writeFile',function(req, response){
    console.log('app.js write file in!');
    var writeFileDir = "C:\\hackathonANZ";
    var fileName = req.body.fileName;
    var data= req.body.jobData;

    var files = [];  
    if(fs.existsSync(writeFileDir)) {  
        files = fs.readdirSync(writeFileDir);  
        files.forEach(function(file, index) {  
            var curPath = writeFileDir + "/" + file;  
            fs.unlinkSync(curPath);  
             
        });  
        //fs.rmdirSync(writeFileDir);  
     }else{
       fs.mkdir(writeFileDir,function(err){
         if(err){
          console.log("error when creating dir");
         }
       });
     }

    /* fs.mkdir(writeFileDir, function(err){
        if(err){
             console.log("error happen when creating dir!");
        }else{
             console.log("create dir successfully!");
        }
      });
  */

     fs.writeFile(writeFileDir+'\\'+fileName+".txt",data,function(err){
        if(err){
        	console.log('write file error, data is:'+ data);
        	response.writeHead('400',{
		  "Content-Type":"application/json",
		  "Access-Control-Allow-Origin":"*",
		  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
          "access-control-allow-headers": "Origin, content-type, accept"});
        	response.write('400');
        	response.end();
        }else{
        	console.log('write file success, data is:'+ data);
        	response.writeHead('200',{
		  "Content-Type":"application/json",
		  "Access-Control-Allow-Origin":"*",
		  "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
          "access-control-allow-headers": "Origin, content-type, accept"});
        	response.write('200');
        	response.end();
        }

     })
});

function updateMessage(input, response) {
  console.log('conversation response:'+JSON.stringify(response));
  var responseText = null;
  if (!response.output) {
    response.output = {};
  } else {
	 if(response.intents.length == 0){
	 	return response;
	 }else{
		var intent = response.intents[0];
		var entity = response.entities[0];
	    // Depending on the confidence of the response the app can return different messages.
	    // The confidence will vary depending on how well the system is trained. The service will always try to assign
	    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
	    // user's intent . In these cases it is usually best to return a disambiguation message
	    // ('I did not understand your intent, please rephrase your question', etc..)
	    if (intent.confidence >= 0.75 || (entity && (entity.confidence >= 0.75))) {
	    	if(intent.confidence >= 0.75 && intent.intent == 'fuction' && (!entity) && input.input.text.toLowerCase().indexOf('request') > -1){
	    		response.output.text = 'I understand you want to know something about request, Oneteam could</br> <a onclick="requestSend()">1. submit a request(request access)</a></br><a onclick="replaceSend()">2. replace request</a></br><a onclick="updateSend()">3. update request</a></br><a onclick="deleteSend()">4. delete request</a></br><a onclick="transferSend()">5. transfer request</a></br><a onclick="approveSend()">6. approve request</a></br> which one you want to select？';
	    	}
	    }else if(input.input.text.toLowerCase().indexOf('access') > -1){
	    	response.output.text = 'I understand you want to know something about access, Oneteam could</br> <a onclick="requestSend()">1. request access</a></br><a onclick="replaceSend()">2. replace access</a></br><a onclick="updateSend()">3. update access</a></br><a onclick="deleteSend()">4. delete access</a></br><a onclick="transferSend()">5. transfer access</a></br><a onclick="approveSend()">6. approve access</a></br> which one you want to select？';
	    }else if(input.input.text.toLowerCase().indexOf('request') > -1){
	    	response.output.text = 'I understand you want to know something about request, Oneteam could</br> <a onclick="requestSend()">1. submit a request(request access)</a></br><a onclick="replaceSend()">2. replace request</a></br><a onclick="updateSend()">3. update request</a></br><a onclick="deleteSend()">4. delete request</a></br><a onclick="transferSend()">5. transfer request</a></br><a onclick="approveSend()">6. approve request</a></br> which one you want to select？';
	    }else {
	      response.output.text = 'I cannot answer you this question right now, if your issue is urgent, please use send mail function to send the detail to our admin, we will handle it ASAP.Your question has been recorded,I will train my self to answer this question next time.Thank you！';
	    }
  		return response;
	 }
  }
}



//************************************************************************


app.listen(appEnv.port, function() {

// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
// CHANGE ME  
 });
