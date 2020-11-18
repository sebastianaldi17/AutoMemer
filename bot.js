// https://www.reddit.com/r/dankmemes/top/.json?t=day

const Axios = require('axios');
const Discord = require('discord.js');
const client = new Discord.Client();

let memes = []
let memeIndex = 0
let memeInterval = 1000 * parseInt(process.env.SECONDS)
let memeChannel = ""

function refreshMemes() {
    memes = []
    memeIndex = 0
    Axios.get('https://www.reddit.com/r/dankmemes/top/.json?t=day?limit=25')
    .then((response) => {
        let results = response.data.data
        let children = results.children
        children.forEach(element => {
            memes.push([element.data.url, 'Link: https://www.reddit.com' + element.data.permalink])
        });
        sendMeme()
    })
    .catch((err) => {
        console.log(err)
    })
}

function sendMeme() {
    memeChannel.send(memes[memeIndex][1], {
        files: [memes[memeIndex][0]]
    }).catch((err) => {
        console.log(err)
        memeChannel.send(memes[memeIndex][1])
        .catch((err2) => {
            console.log("Second degree error")
            console.log(err2)
        })
    })
    memeIndex += 1
    if(memeIndex >= memes.length) {
        refreshMemes()
    }
}

client.on('ready', () => {
    console.log('AutoMemer online.');
    memeChannel = client.channels.cache.get(process.env.CHANNEL_ID)
    refreshMemes()
    setInterval(sendMeme, memeInterval)
});

client.on('message', message => {
    if (message.content === 'ping') {
        message.reply('pong');
    }
});

client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret