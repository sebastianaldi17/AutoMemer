// https://www.reddit.com/r/dankmemes/top/.json?t=day

const Axios = require('axios');
const cheerio = require('cheerio')
const Discord = require('discord.js');
const client = new Discord.Client();

let memes = []
let memeIndex = 0
let memeInterval = 1000 * parseInt(process.env.SECONDS)
let memeChannel = ""

function tokopediaSearch(keywords, channel) {
    // Last working: 16 December 2020
    console.log(keywords)
    let combined = keywords.concat('+')
    let url = `https://www.tokopedia.com/search?st=product&q=${combined}`
    Axios.get(url)
    .then(response => {
        console.log(response.statusText)
        channel.send("Scrapping web...")
        .then(message => {
            const html = response.data
            const $ = cheerio.load(html)
            const products = $('.css-18c4yhp')
            const prices = $('.css-rhd610')
            let string = ''
            for(let i = 0; i < Math.min(products.length, 5); i++) {
                console.log(products[i].children[0].data)
                console.log(prices[i].children[0].data)
                string += `${products[i].children[0].data} - ${prices[i].children[0].data} \n`
            }
            if(string.length > 0) message.edit(string)
            else message.edit('No match found.')
        })
        .catch(error => {
            console.log(error)
            channel.send("An error has occured while trying to send the results.")
        })
    })
    .catch(error => {
        channel.send('An error has occured while scrapping the data from Tokopedia.')
        console.log(error)
    })
}

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
        console.log("First level error")
        console.log(err)
        memeChannel.send(memes[memeIndex][1])
            .catch((err2) => {
                console.log("Second level error")
                console.log(err2)
            })
            .then(() => {
                memeIndex += 1
            })
    })
        .then(() => {
            memeIndex += 1
        })
    if (memeIndex >= memes.length) {
        refreshMemes()
    }
}

client.on('ready', () => {
    console.log('AutoMemer online.');
    client.user.setActivity('!tokped <keywords>')
    memeChannel = client.channels.cache.get(process.env.CHANNEL_ID)
    refreshMemes()
    setInterval(sendMeme, memeInterval)
});

client.on('message', message => {
    if(message.author.bot) return
    let contents = message.content.split(' ')
    if(contents[0] === '!tokped') {
        if(contents.length > 1) {
            tokopediaSearch(contents.slice(1), message.channel)
        } else {
            message.channel.send('Please insert additional keywords.')
        }
    } else if(contents[0] === '!help') {
        message.channel.send('!tokped <keywords> - Searches product at Tokopedia')
    }
});

client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret