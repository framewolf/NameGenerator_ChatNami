const apiKey = ""
const serverless = require('serverless-http');
const { Configuration, OpenAIApi } = require("openai");
const express = require('express')
const app = express()
var cors = require('cors')

const configuration = new Configuration({
  apiKey: apiKey,
});
const openai = new OpenAIApi(configuration);

//CORS 이슈 해결
let corsOptions = {
  // 오리진에서 받는 요청만 받음
  origin: 'https://chatnami.pages.dev',
  credentials: true
}
app.use(cors(corsOptions));

//POST요청 받을 수 있게 만듦
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

// POST method route
app.post('/nameGenerate', async function (req, res) {
  let { object, purpose, userMessages, assistantMessages } = req.body;
  console.log(userMessages);
  console.log(assistantMessages);
  let messages = [
    { role: "system", content: "Hello, ChatGPT. You are going to play the role of name generator for programmers, named ChatNami. When i tell you about the purpose of a function or variable, you answer by generating 10 names of the function or variable for that purpose. You can use both Korean and English, and you can answer requests in Korean. For your responses, I would like you to say  just a list of 10 names without explanation of the names." },
    { role: "user", content: "Hello, ChatGPT. You are going to play the role of name generator for programmers, named ChatNami. When i tell you about the purpose of a function or variable, you answer by generating 10 names of the function or variable for that purpose. You can use both Korean and English, and you can answer requests in Korean. For your responses, I would like you to say  just a list of 10 names without explanation of the names." },
    { role: "assistant", content: "Sure, I can do that. Please go ahead and tell me the purpose of the function or variable in Korean. i will answer by generating 10 names of the function or variable for that purpose." },
  ]

  while (userMessages.length != 0 || assistantMessages.length != 0) {
    if (userMessages.lengt != 0) {
      messages.push(
        //자바스크립트에서 pop()은 오른쪽에서 제거, shift는 왼쪽에서 제거임
        //정규표현식 이용하여 개행문자 등을 날림
        //숫자 등이 들어가면 깨지는 경우가 있어서 string으로 감싸줌
        //json은 문자에 다 ""
        JSON.parse('{"role": "user", "content": "' + String(userMessages.shift()).replace(/\n/g, "") + '"}')
      )
    }
    if (assistantMessages.length != 0) {
      messages.push(
        JSON.parse('{"role": "assistant", "content": "' + String(assistantMessages.shift()).replace(/\n/g, "") + '"}')
      )
    }

  }
  //gpt api응답 씹혔을시 재요청. 3번까지 가능
  const maxRetries = 3;
  let retries = 0;
  let completion
  while (retries < maxRetries) {
    try {
      completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messages
      });
      break;
    } catch (error) {
      retries++;
      console.log(error);
      console.log('Error fetching data, retrying (' + retries + '/' + maxRetries + ')...')
    }
  }

  let name = completion.data.choices[0].message['content']
  res.json({ "assistant": name });
});

module.exports.handler = serverless(app);


