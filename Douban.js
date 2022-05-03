/*
    Douban Movie Add-ons for Surge by Neurogram

        - 豆瓣电影移动版网页增强
        - 快捷跳转 茶杯狐 搜索
        - 展示在映流媒体平台
        - 快捷收藏电影至 Airtable

    使用说明

        [Script]
        // 茶杯狐、555影视
        http-response ^https://m.douban.com/movie/subject/.+ script-path=Douban.js,requires-body=true,max-size=307200

        // Airtable 收藏
        http-request ^https://m.douban.com/movie/subject/.+\?seen=\d script-path=Douban.js

        [MITM]
        hostname = m.douban.com

        收藏功能，需自行修改代码，点击 想看 / 看过 触发收藏
   
    Author:
        Telegram: Neurogram
        GitHub: Neurogram-R
*/

let url = $request.url
let movieId = url.match(/subject\/(\d+)/)
let seen = url.match(/\?seen=(\d)$/)
let collect = false  //收藏功能，默认关闭，需自行配置
let region = "HK" //流媒体区域
let tmdb_api_key = "k_u9dhfwo6" // TMDB API KEY

if (!seen) douban_addons()
if (seen) collect_movie()

async function douban_addons() {
    let body = $response.body
    let title = body.match(/"sub-title">([^<]+)/)
    if (!title) $done({})
    if (collect) body = body.replace(/<a.+pbtn.+wish.+>/, `<a href="${url}?seen=0">`)
    if (collect) body = body.replace(/<a.+pbtn.+collect.+>/, `<a href="${url}?seen=1">`)
        
        let mweb = [`<a href="https://www.cupfox.com/search?key=${title[1]}"><img src="https://files.catbox.moe/c8vszl.png" height="25" width="25" style="vertical-align: text-top;" /></a>`]
        mweb.push(`<a href="https://www.o8tv.com/vodsearch/-------------.html?wd=${title[1]}&submit="><img src="https://files.catbox.moe/27bzxu.png" height="25" width="34.78" style="vertical-align: text-top;" /></a>`)
                
    let douban_options = {
        url: `https://frodo.douban.com/api/v2/movie/${movieId[1]}?apiKey=0ac44ae016490db2204ce0a042db2916`,
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.3(0x18000323) NetType/WIFI Language/en",
            "Referer": "https://servicewechat.com/wx2f9b06c1de1ccfca/82/page-frame.html"
        }
    }

    let douban_result = await send_request(douban_options, "get")

    if ((douban_result.type == "movie" || douban_result.type == "tv") && douban_result.original_title && tmdb_api_key) {

        let tbdb_query_options = {
            url: `https://api.themoviedb.org/3/search/${douban_result.type}?api_key=${tmdb_api_key}&query=${encodeURIComponent(douban_result.original_title.replace(/Season \d+$/, ""))}&page=1`
        }
        let tmdb_query = await send_request(tbdb_query_options, "get")

        if (tmdb_query.results[0]) {

            let providers_query_options = {
                url: `https://api.themoviedb.org/3/${douban_result.type}/${tmdb_query.results[0].id}/watch/providers?api_key=${tmdb_api_key}`
            }

            let tmdb_providers = await send_request(providers_query_options, "get")

            if (tmdb_providers.results[region]) {
                if (tmdb_providers.results[region].flatrate) {
                    for (var i in tmdb_providers.results[region].flatrate) {
                        mweb.push(`<a href=""><img src="https://image.tmdb.org/t/p/original${tmdb_providers.results[region].flatrate[i].logo_path}" height="25" width="25" style="vertical-align: text-top;" /></a>`)
                    }
                }
            }

        }

    }

    body = body.replace(/("sub-title">.+?)(<\/div>)/, `$1${mweb.join("\n")}$2`)

    $done({ body })

}

async function collect_movie() {
    let options = {
        url: `https://frodo.douban.com/api/v2/movie/${movieId[1]}?apiKey=0ac44ae016490db2204ce0a042db2916`,
        headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.3(0x18000323) NetType/WIFI Language/en",
            "Referer": "https://servicewechat.com/wx2f9b06c1de1ccfca/82/page-frame.html"
        }
    }

    let douban_result = await send_request(options, "get")

    if (douban_result.msg == "movie_not_found") {
        $notification.post('豆瓣电影', data.msg, "");
        $done({ url: url.replace(/\?seen=\d/, "") })
    }

    let casts = ""
    for (var i = 0; i < douban_result.actors.length; i++) {
        casts = casts + douban_result.actors[i].name + " / "
    }
    let directors = ""
    for (var k = 0; k < douban_result.directors.length; k++) {
        directors = directors + douban_result.directors[k].name + " / "
    }
    let title = douban_result.title + "  " + douban_result.original_title
    let table = {
        url: "https://api.airtable.com/v0/BASE_ID/Douban",
        headers: {
            Authorization: "Bearer API_KEY"
        },
        body: {
            records: [
                {
                    "fields": {
                        "Title": title,
                        "Description": douban_result.intro,
                        "Poster": [
                            {
                                "url": douban_result.pic.large
                            }
                        ],
                        "Seen": seen[1] == 1 ? true : false,
                        "Actors": casts.replace(/\s\/\s$/, ""),
                        "Director": directors.replace(/\s\/\s$/, ""),
                        "Genre": douban_result.genres.toString(),
                        "Douban": "https://movie.douban.com/subject/" + movieId[1],
                        "Rating": douban_result.rating.value,
                        "Year": douban_result.year
                    }
                }
            ]
        }
    }

    let airtable_collect = await send_request(table, "post")

    if (!airtable_collect.records) {
        $notification.post('收藏失败', airtable_collect.error.type, airtable_collect.error.message);
        $done({ url: url.replace(/\?seen=\d/, "") })
    }

    $notification.post('豆瓣电影', title + " 收藏成功", "");
    $done({ url: url.replace(/\?seen=\d/, "") })
}

function send_request(options, method) {
    return new Promise((resolve, reject) => {

        if (method == "get") {
            $httpClient.get(options, function (error, response, data) {
                if (error) return reject('Error')
                resolve(JSON.parse(data))
            })
        }

        if (method == "post") {
            $httpClient.post(options, function (error, response, data) {
                if (error) return reject('Error')
                resolve(JSON.parse(data))
            })
        }
    })
}
