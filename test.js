const axios = require('axios')
const cheerio = require('cheerio')
const fs = require("fs").promises;

axios.defaults.validateStatus = function () {
    return true;
};


async function sendTelegram(article) {
    const apiKey = "5707930390:AAHNP3HyFkQ28c32OKuNkfQzYFO_YOpcG9g";
    const channelName = "@ipsc_news";

    let text = `xd`
    if(text.length>= 1024){
        text = text.substr(0, 1021) + '...'
    }
    //  https://api.telegram.org/bot[]/sendMessage?chat_id=[https://t.me/ipsc_fmto_bot]&text=[hola]
    var url = `https://api.telegram.org/bot${apiKey}/sendMediaGroup`
    var data = {
        'chat_id': channelName,
        'media': [
            {
                type: "document",
                media: 'https://fmto.net/attachments/article/1391/Inscripcion_para_SABADO%20PREMACH%20Y%20PARA%20EQUIPOS.pdf',
            },
            {
                type: "document",
                media: 'https://fmto.net/attachments/article/1442/Inscripcion_DOMINGO.pdf',
                parse_mode:'Markdown',
                caption: text,
            }
        ]
    }
    const response = await axios.post(url, data);
    console.log(response.data)
    console.log(response.status)
      
    console.log(`Article  sent to telegram`)
    // console.log(response.status)
    // console.log(response.data)

}
sendTelegram()