'use strict';

let sttUsername = "e71aa345-e9be-4c19-80e0-4ed4606434a2" ;//process.env.SPEECH_TO_TEXT_USERNAME || '<username>';
let sttPassword = "o0fhCtKciiqu";//process.env.SPEECH_TO_TEXT_PASSWORD || '<password>';

let sttInform = 0; // Only inform user once

let express = require('express'),
  router = express.Router(), // eslint-disable-line new-cap
  vcapServices = require('vcap_services'),
  extend = require('util')._extend,
  watson = require('watson-developer-cloud');

// set up an endpoint to serve speech-to-text auth tokens

// For local development, replace username and password or set env properties
let sttConfig = extend({
  version: 'v1',
  url: 'https://stream.watsonplatform.net/speech-to-text/api',
  username: sttUsername,
  password: sttPassword
}, vcapServices.getCredentials('speech_to_text'));

let sttAuthService = new watson.AuthorizationV1(sttConfig);
console.log("sttConfig.username:"+sttConfig.username);
// Inform user that STT is not configured properly or at all
if ( !sttConfig.username || sttConfig.username === '<username>' || !sttConfig.password || sttConfig.password === '<password>' ) {
  if (sttInform === 0){
    console.log('WARNING: The app has not been configured with a SPEECH_TO_TEXT_USERNAME and/or a SPEECH_TO_TEXT_PASSWORD environment variable. If you wish to have speech to text in your working application, please refer to the https://github.ibm.com/dlthomas/hello-watson README documentation on how to set these variables.');
    sttInform ++;
  }
}

router.get('/token', function(req, res) {
  sttAuthService.getToken({url: sttConfig.url}, function(err, token) {
    if ( !sttUsername || sttUsername === '<username>' || !sttPassword || sttPassword === '<password>' ) {
      // If User isn't using STT - limit errors in console and development tools
    }
    else if (err) {
      console.log('Error retrieving token: ', err);
      res.status(500).send('Error retrieving token');
      return;
    }
    res.send(token);
  });
});

module.exports = router;
