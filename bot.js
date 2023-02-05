const tmi = require('tmi.js');
const fs = require("fs");
const openai_r = require("openai");
const Configuration = openai_r.Configuration;
const OpenAIApi = openai_r.OpenAIApi;

const api_key = "[OPENAI API KEY]";
const configuration = new Configuration({
    apiKey: api_key,
});
const openai = new OpenAIApi(configuration);


// Define configuration options
const opts = {
  identity: {
    username: '[BOT Username]',
    password: '[BOT OAUTH TOKEN]'
    },
  channels: [
    '[CHANNEL BOT SHOULD JOIN]'
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot
  // Remove whitespace from chat message
  const commandName = msg.trim();
  const args = msg.slice(1).split(' ');
  const command = args.shift().toLowerCase();

  // Log messages to file, also emit to console for fun
  console.log(context['display-name']+":"+msg);
  fs.appendFile('chatlog.txt', context['display-name']+":"+msg+"\n", function() {});
  
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

async function do_say(){
    console.log("Lets say something...");
    // collect logs and create a prompt for GPT-3
    let content = fs.readFileSync("chatlog.txt", 'utf8');
    content = content.length > 2000 ? content.substring(content.length-2000, content.length) : content;
    // now we want some kind of prompt... customize to your liking, preferrably custom per channel
    let prompt = "Play as a regular chatter in chat.Generate a funny and short response in the style of twitch chat. Respond to any user or start a new topic.\n";
    prompt += content + "[BOT USERNAME]:";

    await go_crazy(prompt);
}
setTimeout(do_say, 25000);


async function go_crazy (prompt){
    try {
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            temperature: 0.8,
            max_tokens: 60
        });

        let msg = completion.data.choices[0].text;
        // response can contain generated responses for many different users
        if(msg.includes("\n"))
            msg = msg.substring(0,msg.indexOf("\n"));
        console.log("-------------------");
        console.log("Generated response:");
        console.log("[BOT USERNAME]:"+msg);
        console.log("-------------------");

        client.say("[CHANNEL NAME]", msg);
    } catch(error) {
        // Consider adjusting the error handling logic for your use case
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(`Error with OpenAI API request: ${error.message}`);
        }
    }
setTimeout(do_say, 60000);
}




