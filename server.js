const dialogflow = require("@google-cloud/dialogflow").v2beta1;
const uuid = require("uuid");
const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config();
const app = express();
const PORT = process.env.PORT||5000;

// A unique identifier for the given session
const sessionId = uuid.v4();
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
//--MIDDLEWARE FOR CORS--//
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});


app.post("/send-msg", (req, res) => {
  runSample(req.body.MSG).then((data) => {
    res.send({ Reply: data });
  });
});

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} msg the user query
 * @param {string} projectId The project to be used
 */
async function runSample(msg, projectId = "chat-bot-ifpb") {
  // Create a new session
  const sessionClient = new dialogflow.SessionsClient({
    keyFilename: process.env.keyFilename,
  });
  const sessionPath = sessionClient.projectAgentSessionPath(
    projectId,
    sessionId
  );
const knowledgeBaseId = process.env.knowledgeBaseId;
  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        // The query to send to the dialogflow agent
        text: msg,
        // The language used by the client (en-US)
        languageCode: "en-US",
      },
    },
    queryParams: {
      knowledgeBaseNames: [
        `projects/${projectId}/knowledgeBases/${knowledgeBaseId}`,
      ],
    },
  };
console.log(request)
  // Send request and log result
  const responses = await sessionClient.detectIntent(request);
 // console.log(responses)
  console.log("Detected intent");
  const result = responses[0].queryResult;
  console.log(`  Query: ${result.queryText}`);
  console.log(`  Response: ${result.fulfillmentText}`);
  //handle knowledge answers
if (result.knowledgeAnswers && result.knowledgeAnswers.answers.length > 0) {
  console.log("Knowledge Answers:");
  result.knowledgeAnswers.answers.forEach((answer) => {
    console.log(`  - Answer: ${answer.answer}`);
    console.log(`  - Match Confidence: ${answer.matchConfidence}`);
  });
}

  if (result.intent) {
    console.log(`  Intent: ${result.intent.displayName}`);
  } else {
    console.log("  No intent matched.");
  }
  return result.fulfillmentText;
}

app.listen(PORT, () => {
  console.log('running on port '+PORT)
})
