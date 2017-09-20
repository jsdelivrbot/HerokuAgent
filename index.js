var prompt = require('prompt-sync')();
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var MyCoolAgent = require('./MyCoolAgent');

var openConvs = {};


var express = require('express');
var app     = express();

app.set('port', (process.env.PORT || 5000));

//For avoidong Heroku $PORT error
app.get('/', function(request, response) {
    var result = 'App is running'
    response.send(result);
}).listen(app.get('port'), function() {
    console.log('App is running, server is listening on port ', app.get('port'));
});


var https = require('https');

setInterval(function() {
    https.get("https://marco-agent.herokuapp.com/");
}, 600000); // every 5 minutes (300000) every 10 minutes (600000)


// Set up Conversation service wrapper.
var conversation = new ConversationV1({
  username: '473cf2b7-41d3-4a70-aa4c-80ebc17c7d93', // replace with username from service key
  password: '7mjTO30r2wzE', // replace with password from service key
  path: { 
    //workspace_id: '8d7c14df-5198-4deb-a634-d68456e43d99' // welcome conversation
    workspace_id: 'a3996be7-8052-48ce-a01c-e01d51d39984' // AWP Demo
    //workspace_id: '09a00409-65f0-48b4-ab7c-8ff6da87b6fc' // my example
  }, // replace with workspace ID
  version_date: '2016-07-11'
});

var echoAgent = new MyCoolAgent({
  accountId: '64096141',
  username: 'MD_Bot',
  password: 'Password123!!!'
});

var context = {};
var dialogID = "";

// Start conversation with empty message.
//conversation.message({}, processResponse);

// Process the conversation response.
function processResponse(err, response) {
  if (err) {
    console.error(err); // something went wrong
    return;
  }

  context = response.context;

  // If an intent was detected, log it out to the console.
  if (response.intents.length > 0) {
    console.log('Detected intent: #' + response.intents[0].intent);
  }

  // Display the output from dialog, if any.

  if (response.output.text.length != 0) {

for (var i = 0; i < response.output.text.length; i++) {

      console.log(response.output.text[i]);
     


      
      echoAgent.publishEvent({
            dialogId: dialogID,
            event: {
                type: 'ContentEvent', 
                contentType: 'text/plain', 
                message: response.output.text[i]
            }
        });

	if (response.output.text[i] === "Just a second. I'm transferring the conversation to one human Agent") {
        console.log("Need to transfer to agents."); 
        leaveChat();       
      }
  }

}
  // Display the full response for logs
  //console.log(response);

}

echoAgent.on('MyCoolAgent.ContentEvnet',(contentEvent)=>{
    if (contentEvent.message.startsWith('#close')) {
        echoAgent.updateConversationField({
            conversationId: contentEvent.dialogId,
            conversationField: [{
                    field: "ConversationStateField",
                    conversationState: "CLOSE"
                }]
        });
    } else {
        dialogID = contentEvent.dialogId;
        conversation.message({
          input: { text: contentEvent.message },
          context : context
        },processResponse);

        console.log("sending message: " + contentEvent.message);
    }
});


function leaveChat() {
  echoAgent.updateConversationField({
    conversationId: dialogID,
    conversationField: [
      {
        field: "ParticipantsChange",
        type: "REMOVE",
        role: "ASSIGNED_AGENT"
      },
       {
          field: "Skill",
          type: "UPDATE",
          skill: "311553310"
      }
    ]
  }, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("transfered completed");
    }
  });
}
