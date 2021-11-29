/*
JD | TB Price comparison
by Small
date 2021-06-25
Thanks @yichahucha

QX:
^https?://api\.m\.jd\.com/client\.action\?functionId=(wareBusiness|serverConfig|basicConfig) url script-response-body https://service.2ti.st/QuanX/Script/jd_tb_price/main.js

^http://.+/amdc/mobileDispatch url script-request-body https://service.2ti.st/QuanX/Script/jd_tb_price/main.js
^https?://trade-acs\.m\.taobao\.com/gw/mtop\.taobao\.detail\.getdetail url script-response-body https://service.2ti.st/QuanX/Script/jd_tb_price/main.js

Surge4:
http-response ^https?://api\.m\.jd\.com/client\.action\?functionId=(wareBusiness|serverConfig|basicConfig) requires-body=1,script-path=https://service.2ti.st/QuanX/Script/jd_tb_price/main.js

http-request ^http://.+/amdc/mobileDispatch requires-body=1,script-path=https://service.2ti.st/QuanX/Script/jd_tb_price/main.js
http-response ^https?://trade-acs\.m\.taobao\.com/gw/mtop\.taobao\.detail\.getdetail requires-body=1,script-path=https://service.2ti.st/QuanX/Script/jd_tb_price/main.js

Surge & QX MITM = api.m.jd.com, trade-acs.m.taobao.com
*/

const ScriptName = "京东|淘宝 比价";
const $ = new Env(ScriptName);

const ScriptIdentifier = "jd_tb_price";
const ScriptVersion = 7;
const ScriptUrl = `https://service.2ti.st/QuanX/Script/${ScriptIdentifier}`

const res = $request;
//const resp = isundefined($response) ? null : $response;
let resp = null;
try{
  resp =$response
}catch(err){
  console.log(err)
};
let Status = {
    Enable: 1,
    Disable: 2
};

let Type = {
    Init: 1,
    Default: 2,
    HandleFun: 3
};

let MatchType = {
    None: 1,
    RegExp: 2,
    Contains: 3,
    FullMatch: 4
}

const Jobs = [
    //JD
    {
        name: "serverConfig",
        status: Status.Enable,
        type: Type.HandleFun,
        matchType: MatchType.Contains,
        keyword: "serverConfig",
        fun: handleServerConfig
    },
    {
        name: "wareBusiness",
        status: Status.Enable,
        type: Type.HandleFun,
        matchType: MatchType.Contains,
        keyword: "wareBusiness",
        fun: handleWareBusiness
    },
    {
        name: "basicConfig",
        status: Status.Enable,
        type: Type.HandleFun,
        matchType: MatchType.Contains,
        keyword: "basicConfig",
        fun: handleBasicConfig
    },
    //TB
    {
        name: "mobileDispatch",
        status: Status.Enable,
        type: Type.HandleFun,
        matchType: MatchType.Contains,
        keyword: "/amdc/mobileDispatch",
        fun: handleMobileDispatch
    },
    {
        name: "getdetail",
        status: Status.Enable,
        type: Type.HandleFun,
        matchType: MatchType.Contains,
        keyword: "/gw/mtop.taobao.detail.getdetail",
        fun: handleGetdetail
    }
];

initScript();

// Handle JD API ServerConfig
function handleServerConfig() {
    $.log("Start Handle ServerConfig Job");
    let body = JSON.parse(resp.body);
    delete body.serverConfig.httpdns;
    delete body.serverConfig.dnsvip;
    delete body.serverConfig.dnsvip_v6;
    $.log("Success Handle ServerConfig Job");
    $.done({ body: JSON.stringify(body) });
}

// Handle JD API WareBusiness
function handleWareBusiness() {
    $.log("Start Handle WareBusiness Job");
    let body = JSON.parse(resp.body);
    let floors = body.floors;
    const commodity_info = floors[floors.length - 1];
    const skuId = commodity_info.data.wareInfo.skuId;
    $.log("skuId:" + skuId);
    handleRequest(skuId, "JD", text => {
        const obj = {
            "bId": "eCustom_flo_199",
            "cf": {
                "bgc": "#ffffff",
                "spl": "empty"
            },
            "data": {
                "ad": {
                    "adword": text,
                    "textColor": "#fe0000",
                    "color": "#f23030",
                    "text-align": "justify",
                    "word-break": "break-all",
                    "newALContent": true,
                    "hasFold": true,
                    "class": "com.jd.app.server.warecoresoa.domain.AdWordInfo.AdWordInfo",
                    "adLinkContent": "",
                    "adLink": ""
                }
            },
            "mId": "bpAdword",
            "refId": "eAdword_0000000028",
            "sortId": 13
        };

        let bestIndex = 0;
        for (let index = 0; index < floors.length; index++) {
            const element = floors[index];
            if (element.mId === obj.mId) {
                bestIndex = index + 1;
                break;
            } else {
                if (element.sortId > obj.sortId) {
                    bestIndex = index;
                    break;
                }
            }
        }

        floors.insert(bestIndex, obj);
        $.done({ body: JSON.stringify(body) });
    });
}

// Handle JD API BasicConfig
function handleBasicConfig() {
    $.log("Start Handle BaseConfig");
    let body = JSON.parse(resp.body);
    let JDHttpToolKit = body.data.JDHttpToolKit;
    if (JDHttpToolKit) {
        delete body.data.JDHttpToolKit.httpdns;
        delete body.data.JDHttpToolKit.dnsvipV6;
    }
    $.done({ body: JSON.stringify(body) });
}

// Handle TB API MobileDispatch
function handleMobileDispatch() {
    $.log("Start Handle MobileDispatch");
    if (isUndefined(resp) || isNull(resp)) {
        $.log("MobileDispatch handle request");
        let headers = res.headers;
        let body = res.body;
        if (headers["User-Agent"].indexOf("%E6%B7%98%E5%AE%9D") != -1) {
            let json = Qs2Json(body);
            let domain = json.domain.split(" ");
            let i = domain.length;
            while (i--) {
                const block = "trade-acs.m.taobao.com";
                const element = domain[i];
                if (element == block) {
                    domain.splice(i, 1);
                }
            }
            json.domain = domain.join(" ");
            body = Json2Qs(json);
        }
        $.done({ body });
    } else {
        $.log("MobileDispatch handle response");
        const base64 = new Base64();
        let body = resp.body;
        let obj = JSON.parse(base64.decode(body));
        let dns = obj.dns;
        if (dns && dns.length > 0) {
            let i = dns.length;
            while (i--) {
                const element = dns[i];
                let host = "trade-acs.m.taobao.com";
                if (element.host == host) {
                    element.ips = [];
                }
            }
        }
        body = base64.encode(JSON.stringify(obj));
        $.done({ body });
    }
}

// Handle TB API Getdetail
function handleGetdetail() {
    $.log("Start Handle Getdetail");
    let body = JSON.parse(resp.body);
    const skuId = body.data.item.itemId;
    $.log("skuId:" + skuId);
    handleRequest(skuId, "TB", text => {
        if (body.data.apiStack) {
            let apiStack = body.data.apiStack[0];
            let value = JSON.parse(apiStack.value);

            let data = null;

            if (value.global) {
                data = value.global.data;
            } else {
                data = value;
            }

            //Title
            try {
                let guaranteeBarVO = data.componentsVO.guaranteeBarVO;
                let textList = guaranteeBarVO.guaranteeItems[0].textList;
                textList.unshift("价格详情");
            } catch (e) {
                $.logErr(e, "handleGetdetail handle title error");
            }


            //Body
            try {
                let tradeConsumerProtection = data.tradeConsumerProtection;
                let consumerProtection = data.consumerProtection;


                if (tradeConsumerProtection) {
                    setTBItems(tradeConsumerProtection.tradeConsumerService.service.items, createTBItem("价格详情", text));
                    for (let t of text.split("\n")) {
                        if (t === "") continue;
                        pushTBItems(tradeConsumerProtection.tradeConsumerService.nonService.items, createTBItem(t));
                    }
                }

                setTBItems(consumerProtection.items, createTBItem("价格详情", text));
                if (consumerProtection.serviceProtection)
                    setTBItems(consumerProtection.serviceProtection.basicService.services, createTBItem("价格详情", [text]));

            } catch (e) {
                $.logErr(e, "handleGetdetail handle body error");
            }

            apiStack.value = JSON.stringify(value);
        }
        $.done({ body: JSON.stringify(body) });
    });
}

function pushTBItems(items, item) {
    items.push(item);
}

function setTBItems(items, item) {
    items.unshift(item);
}

function createTBItem(title, desc) {
    return {
        title: title,
        name: title,
        type: 0,
        icon: "https://s2.ax1x.com/2020/02/16/3STeIJ.png",
        desc: desc
    }
}

function createTBCard(title, text) {
    return {
        bgIcon: "https://img.alicdn.com/imgextra/i4/O1CN011N7vad1qNigfsKeBP_!!6000000005484-2-tps-710-60.png?getAvatar=avatar",
        icon: "https://s2.ax1x.com/2020/02/16/3STeIJ.png",
        text: text,
        textColor: "#FF3000",
        title: title
    }
}


function handleRequest(id, type, callback, errorCallback) {
    request_history_price(id, type, data => {
        try {
            let text = handleBijiago(data);
            callback(text);
        } catch (e) {
            $.logErr(e, "request_history_price Callback Error");
            $.done({ body: JSON.stringify(JSON.parse(resp.body)) });
        }
    });
}

function handleBijiago(data) {

    if (!data.success)
        return data.msg;

    let obj = data.data;
    let store = {};

    if (obj['store'].length == 0) {
        return "";
    }
    
    if (obj['store'].length == 1) {
        store = obj['store'][0];
    }
    else if (obj['store'].length > 1) {
        store = obj['store'][1];
    }

    let tips = "无tips";
    if (obj.hasOwnProperty("analysis")) {
        if (obj['analysis'].hasOwnProperty("tip")) {
            tips = obj['analysis']['tip'];
        }
    }

    let historyObj = {
        tips: {
            "type": "text",
            "title": "Tips:",
            "text": tips,
        },
        range: {
            "type": "text",
            "title": "价格区间",
            "text": store.hasOwnProperty("price_range") ? store['price_range'] : "",
        },
        now: {
            "type": "price",
            "title": "当前价",
            "price": Math.round(parseFloat(store['last_price']) / 100),
            "date": "-"
        },
        highest: {
            "type": "price",
            "title": "最高价",
            "price": Math.round(parseFloat(store['highest'])),
            "date": time2str(store['max_stamp'] * 1000)
        },
        lowest: {
            "type": "price",
            "title": "最低价",
            "price": Math.round(parseFloat(store['lowest'])),
            "date": time2str(parseInt(store['min_stamp']) * 1000)
        },
        day30: {
            "type": "price",
            "title": "三十天",
            "price": -1,
            "date": "-"
        },
        _618: {
            "type": "price",
            "title": "六一八",
            "price": -1,
            "date": "-"
        },
        _1111: {
            "type": "price",
            "title": "双十一",
            "price": -1,
            "date": "-"
        }
    }

    let beginDayTime = new Date(store['short_day_line_begin_time']);
    let dayNum = getDaysBetween(beginDayTime, new Date());
    let days = store['short_day_line'];

    for (let i = 0; i < 30 - dayNum && i < days.length; ++i) {
        let price = days[i];
        if (i == 0) {
            historyObj.day30['price'] = Math.round(price);
            historyObj.day30['date'] = time2str(dateAddDays(beginDayTime, i));
        }
        if (price < historyObj.day30['price']) {
            historyObj.day30['price'] = Math.round(price);
            historyObj.day30['date'] = time2str(dateAddDays(beginDayTime, i));
        }
    }

    for (let promo_day of obj['analysis']['promo_days']) {
        let show = promo_day['show'];
        let price = Math.round(promo_day['price']);
        let date = promo_day['date'];
        if (promo_day['show'].indexOf("618价格") != -1) {
            historyObj._618['price'] = price;
            historyObj._618['date'] = date;
        } else if (promo_day['show'].indexOf("双11价格") != -1) {
            historyObj._1111['price'] = price;
            historyObj._1111['date'] = date;
        } else
            historyObj.set(show, {
                "type": "price",
                "title": show,
                "price": price,
                "date": date
            });
    }

    let result = '';

    for (var key in historyObj) {
        let nowItem = historyObj.now;
        let item = historyObj[key];

        if (item.type == "price") {
            let diff = priceDiff(nowItem.price, item.price);
            result += `${space(item.title, 3 + 4)}${space(item.price, 10)}${space(item.date, 14)}${diff}\n`;
        } else if (item.type == "text") {
            result += `${item.title} ${item.text}\n`;
        }
    }

    return result;
}

function request_history_price(id, type, callback) {

    let item_url = "";

    if (type === "JD") {
        item_url = `https://item.jd.com/${id}.html`;
    } else if (type === "TB") {
        item_url = `https://detail.tmall.com/item.htm?id=${id}`;
    }

    const option = {
        url: `https://browser.bijiago.com/extension/price_towards?url=${encodeURIComponent(item_url)}&format=jsonp&union=union_bijiago&from_device=bijiago&version=${new Date().getTime()}`,
        headers: {
            'Connection': 'keep-alive',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
            'sec-ch-ua-mobile': '?0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
            'Accept': '*/*',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'no-cors',
            'Sec-Fetch-Dest': 'script',
            'Referer': item_url,
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cookie': `gwdang_permanent_id=${genUUID()};`
        },
        timeout: 2000
    };

    $.get(option, (err, rsp, data) => {
        let result = {
            success: true,
            msg: "Success",
            data: JSON.parse(data)
        };

        if (err) {
            result.success = false;
            result.msg = "获取价格信息失败";
            result.data = err;
        }

        if (!result.success) {
            $.log(`Error:${result}`);
            $.msg("Error", result.msg, err);
        }

        callback(result);
    });
}

function Qs2Json(url) {
    var search = url.substring(url.lastIndexOf("?") + 1);
    var obj = {};
    var reg = /([^?&=]+)=([^?&=]*)/g;
    search.replace(reg, function (rs, $1, $2) {
        var name = decodeURIComponent($1);
        var val = decodeURIComponent($2);
        val = String(val);
        obj[name] = val;
        return rs;
    });
    return obj;
}

function Json2Qs(json) {
    var temp = [];
    for (var k in json) {
        temp.push(k + "=" + json[k]);
    }
    return temp.join("&");
}

function time2str(date = +new Date()) {
    return new Date(date).toJSON().substr(0, 19).replace('T', ' ').split(' ')[0].replace(/\./g, '-');
}

function getDaysBetween(startDate, endDate) {
    if (startDate > endDate) {
        return 0;
    }
    if (startDate == endDate) {
        return 1;
    }
    var days = (endDate - startDate) / (1 * 24 * 60 * 60 * 1000);
    return Math.round(days);
}

function dateAddDays(date, dayCount) {
    return new Date((date / 1000 + (86400 * dayCount)) * 1000);
}

function dayDiff(date) {
    return parseInt((new Date() - new Date(date)) / (1000 * 60 * 60 * 24) + '')
}

function priceDiff(now, old) {
    if (typeof old !== 'number')
        return '-'
    let diff = old - now;
    if (diff === 0)
        return '-'
    return diff > 0 ? `↓${Math.round(diff)}` : `↑${Math.round(Math.abs(diff))}`;
}

function space(str, len) {
    let blank = "";
    for (let i = 0; i < len - String(str).length; i++) {
        blank += " ";
    }
    return str + blank;
}

Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};

function Base64() {
    // private property
    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    // public method for encoding
    this.encode = function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = _utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }
        return output;
    }
    // public method for decoding
    this.decode = function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = _utf8_decode(output);
        return output;
    }
    // private method for UTF-8 encoding
    _utf8_encode = function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }
        return utftext;
    }
    // private method for UTF-8 decoding
    _utf8_decode = function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
}

function initScript() {
    try {
        checkVersion(handleJobs);
    } catch (e) {
        $.logErr(e, "initScript Error");
        $.done();
    }
}

function handleJobs() {
    try {
        let url = res.url;

        let enable_jobs = [];

        //Handle enable job
        for (let job of Jobs) {
            if (job.status === Status.Enable) {
                enable_jobs.push(job);
            }
        }

        //Init None
        for (let job of Jobs) {
            if (job.type !== Type.Init) continue;
            if (job.matchType !== MatchType.None) continue;
            handleJob(job);
        }

        //Init Match
        for (let job of Jobs) {
            if (job.type !== Type.Init) continue;
            if (job.matchType === MatchType.None) continue;
            if (isMatch(job, url)) {
                handleJob(job);
            }
        }

        //Handle Fun
        let isMatchHandleFun = false;
        for (let job of Jobs) {
            if (job.type !== Type.HandleFun) continue;
            if (job.matchType === MatchType.None) continue;
            if (isMatch(job, url)) {
                isMatchHandleFun = true;
                handleJob(job);
            }
        }

        //Handle Default
        if (!isMatchHandleFun) {
            for (let job of Jobs) {
                if (job.type !== Type.Default) continue;
                if (isMatch(job, url)) {
                    handleJob(job);
                }
            }
        }
    } catch (e) {
        $.logErr(e, "handleJobs Error");
        $.done();
    }
}

function isMatch(job, url) {
    if (job.matchType === MatchType.None) {
        return true;
    } else if (job.matchType === MatchType.RegExp) {
        return url.search(job.keyword) !== -1;
    } else if (job.matchType === MatchType.Contains) {
        return url.indexOf(job.keyword) !== -1;
    } else if (job.matchType === MatchType.FullMatch) {
        return job.keyword === url;
    }
    return false;
}

function handleJob(job) {
    try {
        $.log(`[Handle Job:${job.name}] Start Handle Job`);

        job.fun();

        $.log(`[Handle Job:${job.name}] Success Handle Job`);
    } catch (e) {
        $.logErr(e, `[Handle Job:${job.name}] Handle Job Error`);
        $.done();
    }
}

function checkVersion(callback = () => { }) {
    let checkVersionKey = `time_${ScriptIdentifier}_checkVersion_lastTime`;
    let nowTime = new Date().getTime();
    let isRun = true;
    let lastTime = $.getdata(checkVersionKey);

    if (lastTime) {
        lastTime = parseInt(lastTime);
        $.log("check Version lastTime:" + lastTime);
        if ((nowTime - lastTime) / 1 / 24 / 60 / 60 / 1000 > 1) {
            isRun = true;
        } else {
            isRun = false;
        }
    } else {
        isRun = true;
    }

    if (isRun) {
        $.log("check Version run");
        $.setdata(String(nowTime), checkVersionKey);
        $.get({ url: `${ScriptUrl}/config.json`, timeout: 3000 }, (err, resp, data) => {

            if (err) {
                $.log("check Version Error:" + err);
                return;
            }

            try {
                let obj = JSON.parse(data);
                if (ScriptVersion !== obj.version)
                    $.msg(`脚本:${ScriptName} 发现新版本`, `版本号：${obj.version}`, `更新内容：${obj.msg}`);
            } catch (e) {
                $.logErr(e, resp);
            } finally {
                callback();
            }
        })
    } else {
        callback();
    }
}

function genUUID() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
 
    var uuid = s.join("");
    return uuid;
}

function isUndefined(obj) {
    return typeof obj === "undefined";
}

function isNull(obj) {
    return obj === null;
}

function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: i, ...r } = t; this.got[s](i, r).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }