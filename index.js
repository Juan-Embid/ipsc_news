const axios = require('axios')
const cheerio = require('cheerio')
const fs = require("fs").promises;

// [] que se imprima fecha y descripcion
// [] que lea de archivo y escriba en archivo el id

var savedData = [];
const DELAY = 10 * 60; // seconds
const url = "https://fmto.net/noticias/ipsc"
const filename = "./idArticles.json";

const writeFile = () => fs.writeFile(filename, JSON.stringify(savedData), 'utf-8').catch(err => console.log(err));

async function asyncReadFile() {
    try {
        const contents = await fs.readFile(filename, 'utf-8');
        return JSON.parse(contents) || [];
    } catch (err) {
        console.log(err.name);
        return [];
    }
}

axios.defaults.validateStatus = function () {
    return true;
};

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));


async function sendTelegram(article) {
    const apiKey = "5707930390:AAHNP3HyFkQ28c32OKuNkfQzYFO_YOpcG9g";
    const channelName = "@ipsc_news";

    /*     var text = `*Nueva Noticia!*
    [${article.name}](${article.url})
    ` */
    // console.log(article.url)
    let text = `[${article.name}](${article.url})\n\n${article.description}`
    if (text.length >= 1024) {
        text = text.substring(0, 1021) + '...'
    }
    //  https://api.telegram.org/bot[]/sendMessage?chat_id=[https://t.me/ipsc_fmto_bot]&text=[hola]
    let url = `https://api.telegram.org/bot${apiKey}/sendMediaGroup`

    article.files[article.files.length - 1] = {
        ...article.files[article.files.length - 1],
        parse_mode: 'Markdown',
        caption: text
    }

    // console.log(article)
    const data = {
        'chat_id': channelName,
        'media': [
            ...article.files
        ]
    }
    const response = await axios.post(url, data);
    if(response.status !== 200) console.log(response.status, response.data)
    else console.log(`Article ${article.id} sent to telegram with status ${response.status}`)
    // console.log(response.status)
    // console.log(response.data)

}

async function onNewArticle(article) {
    writeFile();
    sendTelegram(article)
    console.log(`New Article ${article.id}`)
}

async function getArticles() {
    try {


        const response = await axios.get(url, {})

        if (response.status !== 200) {
            console.log(response.status)
            await sleep(5);
            return;
        }
        const $ = cheerio.load(response.data)
        const articles = $("div.article")
        console.log(`Successfully fetched ${articles.length} articles`)
        articles.each(function () {
            const title = $(this).find("div.article-header > h2 > a")
            const url = `https://fmto.net${title.attr('href')}`
            const name = title.text()
            const id = url.split('ipsc/')[1].split('-')[0]

            // const dateTimeText = dateTime.text()
            // document.querySelector("#tm-content > div.uk-grid.tm-leading-article > div > article > div.tm-article-date.uk-text-center.uk-align-left.uk-visible-large > div:nth-child(1) > span")
            let description = '';
            $(this).find('div.article-introtext > p').each(function () {
                description += $(this).text().trim() + '\n';
            });

            const files = []
            $(this).find('a.at_url').each(function () {
                files.push({
                    type: "document",
                    media: $(this).attr('href')
                });
            });
            // console.log(files)
            // console.log(description)
            // console.log('---------------------------------------')
            // console.log(id, savedData)
            if (savedData.indexOf(id) < 0) {
                // New article
                savedData.push(id)
                onNewArticle({
                    id,
                    url,
                    title,
                    name,
                    description,
                    files: files
                })
            }
        })
    } catch (error) {
        console.log(error)
    }
}

async function main() {
    console.log('Bot started')

    savedData = await asyncReadFile();
    console.log('State loaded')
    while (true) {
        try {
            await getArticles();
            await sleep(DELAY); // 5 secs
        }
        catch (err) {
            console.log(err)
        }
    }
}

main()