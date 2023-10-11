/**
 * 脚本名称：建行生活
 * 活动入口：建行生活APP -> 首页 -> 会员有礼 -> 签到
 * 脚本说明：连续签到领优惠券礼包（打车、外卖优惠券），配置重写手动签到一次即可获取签到数据，默认领取外卖券，可在 BoxJS 配置奖品。兼容 Node.js 环境，变量名称 JHSH_BODY、JHSH_GIFT，多账号分割符 "|"。
 * 仓库地址：https://github.com/FoKit/Scripts
 * 更新时间：2023-08-20
/*
--------------- BoxJS & 重写模块 --------------

https://raw.githubusercontent.com/FoKit/Scripts/main/boxjs/fokit.boxjs.json
https://raw.githubusercontent.com/FoKit/Scripts/main/rewrite/get_jhsh_cookie.sgmodule

------------------ Surge 配置 -----------------

[MITM]
hostname = yunbusiness.ccb.com

[Script]
建行数据 = type=http-request,pattern=^https:\/\/yunbusiness\.ccb\.com\/clp_coupon\/txCtrl\?txcode=A3341A040,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/jhsh_checkIn.js

建行生活 = type=cron,cronexp=17 7 * * *,timeout=60,script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/jhsh_checkIn.js,script-update-interval=0

------------------ Loon 配置 ------------------

[MITM]
hostname = yunbusiness.ccb.com

[Script]
http-request ^https:\/\/yunbusiness\.ccb\.com\/clp_coupon\/txCtrl\?txcode=A3341A040 tag=建行数据, script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/jhsh_checkIn.js,requires-body=1

cron "17 7 * * *" script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/jhsh_checkIn.js,tag = 建行生活,enable=true

-------------- Quantumult X 配置 --------------

[MITM]
hostname = yunbusiness.ccb.com

[rewrite_local]
^https:\/\/yunbusiness\.ccb\.com\/clp_coupon\/txCtrl\?txcode=A3341A040 url script-request-body https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/jhsh_checkIn.js

[task_local]
17 7 * * * https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/jhsh_checkIn.js, tag=建行生活, enabled=true

------------------ Stash 配置 -----------------

cron:
  script:
    - name: 建行生活
      cron: '17 7 * * *'
      timeout: 10

http:
  mitm:
    - "yunbusiness.ccb.com"
  script:
    - match: ^https:\/\/yunbusiness\.ccb\.com\/clp_coupon\/txCtrl\?txcode=A3341A040
      name: 建行生活
      type: request
      require-body: true

script-providers:
  建行生活:
    url: https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/jhsh_checkIn.js
    interval: 86400

*/

const $ = new Env('建行生活');
const gift_key = 'JHSH_GIFT';
const body_key = 'JHSH_BODY';
const notify = $.isNode() ? require('./sendNotify') : '';
let giftType = ($.isNode() ? process.env.JHSH_GIFT : $.getdata(gift_key)) || '2';
let bodyStr = ($.isNode() ? process.env.JHSH_BODY : $.getdata(body_key)) || '';
let bodyArr = bodyStr ? bodyStr.split("|") : [], message = '';
let giftMap = {
  "1": "打车",
  "2": "外卖"
};
$.is_debug = ($.isNode() ? process.env.IS_DEDUG : $.getdata('is_debug')) || 'false';

if (isGetCookie = typeof $request !== `undefined`) {
  GetCookie();
  $.done();
} else {
  !(async () => {
    if (!bodyArr[0]) {
      $.msg($.name, '❌ 请先获取建行生活Cookie。');
      return;
    }
    console.log(`共有[${bodyArr.length}]个建行生活账号\n`);
    for (let i = 0; i < bodyArr.length; i++) {
      if (bodyArr[i]) {
        $.index = i + 1;
        $.info = JSON.parse(bodyArr[i])
        $.giftList = [];
        $.giftList2 = [];
        $.getGiftMsg = "";
        $.isGetGift = false;
        console.log(`===== 账号[${$.info?.USR_TEL || $.index}]开始签到 =====\n`);
        if (!$.info?.MID) {
          message += `🎉 账号 [${hideSensitiveData($.info?.USR_TEL, 3, 4) || $.index}] 缺少MID参数，请重新获取Cookie。\n`;
          continue;
        }
        await main();
        if ($.giftList.length > 0) {
          for (let j = 0; j < $.giftList.length; j++) {
            if ($.isGetGift) break;
            let item = $.giftList[j]
            $.couponId = item?.couponId;
            $.nodeDay = item?.nodeDay;
            $.couponType = item?.couponType;
            $.dccpBscInfSn = item?.dccpBscInfSn;
            $.continue = false;
            console.log(`尝试领取[${giftMap[giftType]}]券`);
            for (let k = 1; k <= 3; k++) {
              if (!$.continue) {
                if (k >= 2) console.log(`领取失败，重试一次`);
                await $.wait(1000 * 5);
                await getGift();
                if ($.isGetGift) break;
              }
            }
          };
          if (!$.isGetGift) {
            $.getGiftMsg = `请打开app查看优惠券到账情况。\n`;
          }
          message += "，" + $.getGiftMsg;
        }
        await $.wait(1000 * 3);
      }
    }
    if (message) {
      message = message.replace(/\n+$/, '');
      if ($.isNode()) {
        await notify.sendNotify($.name, message);
      } else {
        $.msg($.name, '', message);
      }
    }
  })()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
}


// 获取签到数据
function GetCookie() {
  if ($request && $request.url.indexOf("A3341A040") > -1) {
    $.body = JSON.parse($request.body);
    if (bodyStr.indexOf('MID') == -1) {
      bodyStr = '';
      $.setdata(bodyStr, body_key);
      console.log(`用户数据缺失字段，已清空用户数据，请重新获取Cookie。`);
    }
    if (bodyStr.indexOf($.body?.USR_TEL) == -1) {
      $.body['MID'] = $request.headers['MID'] || $request.headers['Mid'] || $request.headers['mid'];
      $.body = JSON.stringify($.body);
      console.log(`开始新增用户数据 ${$.body}`);
      bodyArr.push($.body);
      $.setdata(bodyArr.join('|'), body_key);
      $.msg($.name, ``, `🎉 建行生活签到数据获取成功。`);
    } else {
      console.log('数据已存在，不再写入。');
    }
  }
}


// 签到主函数
function main() {
  let opt = {
    url: `https://yunbusiness.ccb.com/clp_coupon/txCtrl?txcode=A3341A040`,
    headers: {
      "MID": $.info?.MID,
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/CloudMercWebView/UnionPay/1.0 CCBLoongPay",
      "Accept": "application/json,text/javascript,*/*",
      "content-type": "application/json"
    },
    body: `{"ACT_ID":"${$.info.ACT_ID}","MEB_ID":"${$.info.MEB_ID}","USR_TEL":"${$.info.USR_TEL}","REGION_CODE":"${$.info.REGION_CODE}","chnlType":"${$.info.chnlType}","regionCode":"${$.info.regionCode}"}`
  }
  return new Promise(resolve => {
    // console.log(opt);
    $.post(opt, async (err, resp, data) => {
      try {
        err && $.log(err);
        if (data) {
          debug(data);
          data = JSON.parse(data);
          let text = '';
          if (data.errCode == 0) {
            text = `🎉 账号 [${hideSensitiveData($.info?.USR_TEL, 3, 4) || $.index}] 签到成功`;
            console.log(text);
            message += text;
            if (data?.data?.IS_AWARD == 1) {
              $.GIFT_BAG = data?.data?.GIFT_BAG;
              $.GIFT_BAG.forEach(item => {
                let body = { "couponId": item.couponId, "nodeDay": item.nodeDay, "couponType": item.couponType, "dccpBscInfSn": item.dccpBscInfSn };
                if (new RegExp(`${giftMap[giftType]}`).test(item?.couponName)) {
                  if (/信用卡/.test(item?.couponName)) {
                    $.giftList.unshift(body);
                  } else {
                    $.giftList.push(body);
                  }
                } else {
                  $.giftList2.push(body);
                }
              })
              $.giftList = [...$.giftList, ...$.giftList2];
            } else if (data?.data?.NEST_AWARD_DAY >= 1) {
              text = `继续签到${data.data.NEST_AWARD_DAY}天可领取${giftMap[giftType]}券`;
              message += `，${text}\n`;
              console.log(text);
            } else {
              console.log(`暂无可领取的奖励`);
              message += "\n";
            }
          } else {
            console.log(JSON.stringify(data));
            text = `❌ 账号 [${hideSensitiveData($.info?.USR_TEL, 3, 4) || $.index}] 签到失败，${data.errMsg}\n`;
            console.log(text);
            message += text;
          }
        } else {
          $.log("服务器返回了空数据");
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    })
  })
}


// 领取奖励
async function getGift() {
  let opt = {
    url: `https://yunbusiness.ccb.com/clp_coupon/txCtrl?txcode=A3341C082`,
    headers: {
      "MID": $.info?.MID,
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/CloudMercWebView/UnionPay/1.0 CCBLoongPay",
      "Accept": "application/json,text/javascript,*/*"
    },
    body: `{"mebId":"${$.info.MEB_ID}","actId":"${$.info.ACT_ID}","nodeDay":${$.nodeDay},"couponType":${$.couponType},"nodeCouponId":"${$.couponId}","dccpBscInfSn":"${$.dccpBscInfSn}","chnlType":"${$.info.chnlType}","regionCode":"${$.info.regionCode}"}`
  }
  return new Promise(resolve => {
    debug(opt.url);
    debug(opt.headers);
    debug(opt.body);
    $.post(opt, async (err, resp, data) => {
      try {
        err && $.log(err);
        if (data) {
          debug(data);
          data = JSON.parse(data);
          if (data.errCode == 0) {
            $.isGetGift = true;
            $.getGiftMsg = `获得签到奖励：${data?.data?.title}（${data?.data?.subTitle}）\n`;
            console.log($.getGiftMsg);
          } else {
            $.continue = true;
            console.log(JSON.stringify(data));
          }
        } else {
          $.log("服务器返回了空数据");
        }
      } catch (error) {
        $.log(error);
      } finally {
        resolve();
      }
    })
  })
}

// 数据脱敏
function hideSensitiveData(string, head_length = 2, foot_length = 2) {
  let star = '';
  for (var i = 0; i < string.length - head_length - foot_length; i++) {
    star += '*';
  }
  return string.substring(0, head_length) + star + string.substring(string.length - foot_length);
}


// DEBUG
function debug(text) {
  if ($.is_debug === 'true') {
    if (typeof text == "string") {
      console.log(text);
    } else if (typeof text == "object") {
      console.log($.toStr(text));
    }
  }
}


// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), a = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { if (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: i, statusCode: r, headers: o, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: i, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: i, response: r } = t; e(i, r, r && s.decode(r.rawBody, this.encoding)) }) } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) }); else if (this.isQuanX()) t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t && t.error || "UndefinedError")); else if (this.isNode()) { let i = require("iconv-lite"); this.initGotEnv(t); const { url: r, ...o } = t; this.got[s](r, o).then(t => { const { statusCode: s, statusCode: r, headers: o, rawBody: a } = t, n = i.decode(a, this.encoding); e(null, { status: s, statusCode: r, headers: o, rawBody: a, body: n }, n) }, t => { const { message: s, response: r } = t; e(s, r, r && i.decode(r.rawBody, this.encoding)) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, i = t["update-pasteboard"] || t.updatePasteboard; return { "open-url": e, "media-url": s, "update-pasteboard": i } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), this.isSurge() || this.isQuanX() || this.isLoon() ? $done(t) : this.isNode() && process.exit(1) } }(t, e) }
