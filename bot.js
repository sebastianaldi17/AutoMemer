// https://www.reddit.com/r/dankmemes/top/.json?t=day

const Axios = require('axios');
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')
const Discord = require('discord.js');
const client = new Discord.Client();

let memes = []
let memeIndex = 0
let memeInterval = 1000 * parseInt(process.env.SECONDS)
let memeChannel = ""
let searchInterval = 5000
let searching = false

// Disabled because tokopedia cannot be accessed from the USA/EU
// function tokopediaSearch(keywords, channel) {
//     // Last working: 16 December 2020
//     console.log(keywords)
//     let combined = keywords.concat('+')
//     let url = `https://www.tokopedia.com/search?st=product&q=${combined}`
//     Axios.get(url)
//     .then(response => {
//         console.log(response.statusText)
//         channel.send("Scrapping web...")
//         .then(message => {
//             const html = response.data
//             const $ = cheerio.load(html)
//             const products = $('.css-18c4yhp')
//             const prices = $('.css-rhd610')
//             let string = ''
//             for(let i = 0; i < Math.min(products.length, 5); i++) {
//                 console.log(products[i].children[0].data)
//                 console.log(prices[i].children[0].data)
//                 string += `${products[i].children[0].data} - ${prices[i].children[0].data} \n`
//             }
//             if(string.length > 0) message.edit(string)
//             else message.edit('No match found.')
//         })
//         .catch(error => {
//             console.log(error)
//             channel.send("An error has occured while trying to send the results.")
//         })
//     })
//     .catch(error => {
//         channel.send('An error has occured while scrapping the data from Tokopedia.')
//         console.log(error)
//     })
// }

// For Shopee, the initial request only returns the html. The JS must be run to fetch the data (which is why we need to use puppeteer)
// https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-on-heroku
async function shopeeSearch(keywords, channel) {
    let messageID = ''
    channel.send("Pleaase wait while we fetch results...")
    .then(message => {
        messageID = message
    })
    let combined = keywords.join('%20')
    let url = `https://shopee.co.id/search?keyword=${combined}`
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitForTimeout(4000)
    const html = await page.content()

    const $ = cheerio.load(html)
    const products = $('._1NoI8_')
    const prices = $('._1xk7ak')

    let results = ''

    for(let i = 0; i < Math.min(products.length, 5); i++) {
        results += `${products[i].children[0].data} - Rp.${prices[i].children[0].data} \n`
    }
    browser.close()
    if(messageID !== '') {
        messageID.edit(results)
    } else {
        channel.send(results)
    }
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
    client.user.setActivity('!help for commands')
    memeChannel = client.channels.cache.get(process.env.CHANNEL_ID)
    refreshMemes()
    setInterval(sendMeme, memeInterval)
});

client.on('message', message => {
    if(message.author.bot) return
    let contents = message.content.split(' ')
    if(contents[0] === '!shopee') {
        if(contents.length <= 1) {
            message.reply("Please input search terms")
            return
        }
        if(searching) {
            message.reply('You can only search every 5 seconds (to avoid spamming)!')
            return
        }
        searching = true
        setTimeout(() => {searching = false}, searchInterval)
        contents.shift()
        shopeeSearch(contents, message.channel)
    } else if(contents[0] === '!help') {
        message.channel.send('!shopee <keywords> - Searches product at Shopee Indonesia')
    }
});

client.login(process.env.BOT_TOKEN); //BOT_TOKEN is the Client Secret