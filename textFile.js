const axios = require('axios')
const cheerio = require('cheerio')
const fs = require("fs").promises;

// [] que se imprima fecha y descripcion
// [] que lea de archivo y escriba en archivo el id

var data = "0"
var status = true
const savedData = []
const url = "https://fmto.net/noticias/ipsc"

async function writeFile(filename, data) {
    try {
        text = " " + data
        await fs.appendFile(filename, text, 'utf-8');
    } catch (err) {
        console.log(err);
    }
}

async function asyncReadFile(filename) {
    try {
        const contents = await fs.readFile(filename, 'utf-8');
        const arr = contents.split(" ");
        return arr;
    } catch (err) {
        console.log(err);
    }
}

axios.defaults.validateStatus = function () {
    return true;
};

const sleep = (seconds) => new Promise((resolve) =>setTimeout(resolve, seconds * 1000));


async function sendTelegram(article) {
    const apiKey = "5707930390:AAHNP3HyFkQ28c32OKuNkfQzYFO_YOpcG9g";
    const channelName = "@ipsc_news";

    var text = `*Nueva Noticia!* 
[${article.name}](${article.url})
`
    //  https://api.telegram.org/bot[]/sendMessage?chat_id=[https://t.me/ipsc_fmto_bot]&text=[hola]
    var url = `https://api.telegram.org/bot${apiKey}/sendMessage?chat_id=${channelName}&parse_mode=Markdown&text=${encodeURIComponent(text)}`

    const response = await axios.get(url, {
        // headers: {
        //     // "Content-Type": "application/json",
        //     "cache-control": "no-cache"
        // }
    });
      
    console.log(`Article ${article.id} sent to telegram`)
    // console.log(response.status)
    // console.log(response.data)

}

async function onNewArticle(article){
    savedData.push(article.id)
    if(status == true){
        sendTelegram(article)
        status = false
    }
    console.log(`New Article ${article.id}`)

}

async function getArticles(){

    const response = await axios.get(url, {})

    if(response.status !== 200){
        console.log(response.status)
        await sleep(5000);
        return;
    }

    const $ = cheerio.load(response.data)
    const articles = $(".uk-article.tm-article")
    articles.each(function() {
        const url = $(this).attr('data-permalink')
        const title = $(this).find("h1.uk-article-title > a")
        const name = title.text()
        const id = url.split('ipsc/')[1].split('-')[0]
        data = id
/*         const dateTime = $(this).find("uk-hidden-large > time")
        const dateTimeText = dateTime.text()
        const textDesc = $(this).find("tm-article-container.uk-flex.uk-flex-column > p")
        const description = textDesc.text(); */

        if(savedData.indexOf(id)<0){
            // New article
            onNewArticle({
                id,
                url,
                title,
                name/* ,
                dateTimeText,
                description */
            })
        }
    })
}


async function main () {
    var filename = "idArticles"

    while(true){
        try{
            const array = await asyncReadFile(filename)

            for (const element of array) {
                if(element == data){
                    status = false
                    break
                }
            }
            
            if(status == true){
                writeFile(filename, data);  
            }  
            console.log("aqui")
            await getArticles();
            await sleep(5000); // 5 secs
            console.log("alla")
        }
        catch{
        }
    }
}

main()