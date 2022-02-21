/*
py:@gmomotsly

[MITM]
hostname = *.bilibili.com

Surge：
[Script]
# 获取 cookie
哔哩哔哩 = type=http-request,pattern=https://api.bilibili.com/x/web-interface/nav,debug=true,script-path=bilibili.js

# 每日定时运行
每天07,14,21点分别运行一次
bilibili = type=cron,cronexp="0 7,14,21 * * *",wake-system=1,debug=true,script-path=bilibili.js

圈X：
# 获取 cookie
^https://api.bilibili.com/x/web-interface/nav url script-request-header bilibili.js

# 每日定时运行
每天07,14,21点分别运行一次
7,14,21 0 * * * bilibili.js, tag=哔哩哔哩, img-url=https://raw.githubusercontent.com/anker1209/icon/main/bilibili.png, enabled=true

用浏览器打开www.bilibili.com并登录  然后点击头像进入个人主页 如果不能获取cookie请刷新(此步骤必须打开MitM)


*/

const check = (key) =>
  !config.hasOwnProperty(key) ||
  !config[key].hasOwnProperty("time") ||
  format(new Date().toDateString()) > config[key].time;
// prettier-ignore
const cookie2object = (cookie) => {var obj = {};var arr = cookie.split("; ");arr.forEach(function (val) {var brr = val.split("=");obj[brr[0]] = brr[1];});return obj;};

const format = (date = new Date(), fmt = "yyyy-MM-dd hh:mm:ss") => {
  date = new Date(date);
  var o = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "h+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt))
    fmt = fmt.replace(
      RegExp.$1,
      (date.getFullYear() + "").substr(4 - RegExp.$1.length)
    );
  for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt))
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length)
      );
  return fmt;
};

// prettier-ignore
function ENV() { const e = "undefined" != typeof $task, t = "undefined" != typeof $loon, s = "undefined" != typeof $httpClient && !t, i = "function" == typeof require && "undefined" != typeof $jsbox; return { isQX: e, isLoon: t, isSurge: s, isNode: "function" == typeof require && !i, isJSBox: i, isRequest: "undefined" != typeof $request, isScriptable: "undefined" != typeof importModule } }
// prettier-ignore
function HTTP(e = { baseURL: "" }) { const { isQX: t, isLoon: s, isSurge: i, isScriptable: n, isNode: o } = ENV(), r = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*)/; const u = {}; return ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "PATCH"].forEach(l => u[l.toLowerCase()] = (u => (function (u, l) { l = "string" == typeof l ? { url: l } : l; const h = e.baseURL; h && !r.test(l.url || "") && (l.url = h ? h + l.url : l.url); const a = (l = { ...e, ...l }).timeout, c = { onRequest: () => { }, onResponse: e => e, onTimeout: () => { }, ...l.events }; let f, d; if (c.onRequest(u, l), t) f = $task.fetch({ method: u, ...l }); else if (s || i || o) f = new Promise((e, t) => { (o ? require("request") : $httpClient)[u.toLowerCase()](l, (s, i, n) => { s ? t(s) : e({ statusCode: i.status || i.statusCode, headers: i.headers, body: n }) }) }); else if (n) { const e = new Request(l.url); e.method = u, e.headers = l.headers, e.body = l.body, f = new Promise((t, s) => { e.loadString().then(s => { t({ statusCode: e.response.statusCode, headers: e.response.headers, body: s }) }).catch(e => s(e)) }) } const p = a ? new Promise((e, t) => { d = setTimeout(() => (c.onTimeout(), t(`${u} URL: ${l.url} exceeds the timeout ${a} ms`)), a) }) : null; return (p ? Promise.race([p, f]).then(e => (clearTimeout(d), e)) : f).then(e => c.onResponse(e)) })(l, u))), u }
// prettier-ignore
function API(e = "untitled", t = !1) { const { isQX: s, isLoon: i, isSurge: n, isNode: o, isJSBox: r, isScriptable: u } = ENV(); return new class { constructor(e, t) { this.name = e, this.debug = t, this.http = HTTP(), this.env = ENV(), this.node = (() => { if (o) { return { fs: require("fs") } } return null })(), this.initCache(); Promise.prototype.delay = function (e) { return this.then(function (t) { return ((e, t) => new Promise(function (s) { setTimeout(s.bind(null, t), e) }))(e, t) }) } } initCache() { if (s && (this.cache = JSON.parse($prefs.valueForKey(this.name) || "{}")), (i || n) && (this.cache = JSON.parse($persistentStore.read(this.name) || "{}")), o) { let e = "root.json"; this.node.fs.existsSync(e) || this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.root = {}, e = `${this.name}.json`, this.node.fs.existsSync(e) ? this.cache = JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)) : (this.node.fs.writeFileSync(e, JSON.stringify({}), { flag: "wx" }, e => console.log(e)), this.cache = {}) } } persistCache() { const e = JSON.stringify(this.cache, null, 2); s && $prefs.setValueForKey(e, this.name), (i || n) && $persistentStore.write(e, this.name), o && (this.node.fs.writeFileSync(`${this.name}.json`, e, { flag: "w" }, e => console.log(e)), this.node.fs.writeFileSync("root.json", JSON.stringify(this.root, null, 2), { flag: "w" }, e => console.log(e))) } write(e, t) { if (this.log(`SET ${t}`), -1 !== t.indexOf("#")) { if (t = t.substr(1), n || i) return $persistentStore.write(e, t); if (s) return $prefs.setValueForKey(e, t); o && (this.root[t] = e) } else this.cache[t] = e; this.persistCache() } read(e) { return this.log(`READ ${e}`), -1 === e.indexOf("#") ? this.cache[e] : (e = e.substr(1), n || i ? $persistentStore.read(e) : s ? $prefs.valueForKey(e) : o ? this.root[e] : void 0) } delete(e) { if (this.log(`DELETE ${e}`), -1 !== e.indexOf("#")) { if (e = e.substr(1), n || i) return $persistentStore.write(null, e); if (s) return $prefs.removeValueForKey(e); o && delete this.root[e] } else delete this.cache[e]; this.persistCache() } notify(e, t = "", l = "", h = {}) { const a = h["open-url"], c = h["media-url"]; if (s && $notify(e, t, l, h), n && $notification.post(e, t, l + `${c ? "\n多媒体:" + c : ""}`, { url: a }), i) { let s = {}; a && (s.openUrl = a), c && (s.mediaUrl = c), "{}" === JSON.stringify(s) ? $notification.post(e, t, l) : $notification.post(e, t, l, s) } if (o || u) { const s = l + (a ? `\n点击跳转: ${a}` : "") + (c ? `\n多媒体: ${c}` : ""); if (r) { require("push").schedule({ title: e, body: (t ? t + "\n" : "") + s }) } else console.log(`${e}\n${t}\n${s}\n\n`) } } log(e) { this.debug && console.log(`[${this.name}] LOG: ${this.stringify(e)}`) } info(e) { console.log(`[${this.name}] INFO: ${this.stringify(e)}`) } error(e) { console.log(`[${this.name}] ERROR: ${this.stringify(e)}`) } wait(e) { return new Promise(t => setTimeout(t, e)) } done(e = {}) { s || i || n ? $done(e) : o && !r && "undefined" != typeof $context && ($context.headers = e.headers, $context.statusCode = e.statusCode, $context.body = e.body) } stringify(e) { if ("string" == typeof e || e instanceof String) return e; try { return JSON.stringify(e, null, 2) } catch (e) { return "[object Object]" } } }(e, t) }

const name = $script.name == "Untitled" ? "bilibili" : $script.name;
const $ = API(name);

console.log(name + " " + format($script.startTime));

const config = {
  cookie: {},
  cards: [],
  headers: {
    accept: "*/*",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.80 Safari/537.36",
    "accept-language": "zh-CN,zh;q=0.9",
    "sec-ch-ua":
      '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
  },
};

async function me() {
  // https://api.bilibili.com/x/member/web/exp/log
  console.log(`#### 用户信息`);

  await $.http
    .get({
      url: `https://api.bilibili.com/x/web-interface/nav`,
      headers: {
        ...config.headers,
        Host: "api.bilibili.com",
        Origin: "https://www.bilibili.com",
        Referer: "https://space.bilibili.com/" + config.cookie.DedeUserID,
        "Referrer-Policy": "no-referrer-when-downgrade",
      },
      body: null,
    })
    .then((response) => {
      // console.log("headers " + JSON.stringify(response.headers));
      // console.log("data " + JSON.stringify(response.body));
      const data = JSON.parse(response.body);

      if (data.code) {
        console.log(
          "- 获得用户信息失败(请更新cookie) " + JSON.stringify(data.data)
        );
        $notification.post(name, "cookie in expires", JSON.stringify(data));
        $persistentStore.write(null, name + "_user");
        return false;
      } else {
        console.log("- 已通过 cookie 获得用户信息");

        config.user = {
          ...data.data,
          num: (config.user.num || 0) + 1,
          time: format($script.startTime),
        };
        $persistentStore.write(JSON.stringify(config.user), name + "_user");

        return true;
      }
    });

  config.user.mext_exp =
    config.user.level_info.next_exp - config.user.level_info.current_exp;
  config.user.next_day = Math.ceil(config.user.mext_exp / 15);
  config.user.v6_exp = 28800 - config.user.level_info.current_exp;
  config.user.v6_day = Math.ceil(config.user.v6_exp / 15);

  console.log("- 用户名称: " + config.user.uname);
  console.log("- 用户ID: " + config.user.mid);
  console.log("- 用户硬币: " + config.user.money);
  console.log("- 用户B币: " + config.user.wallet.bcoin_balance);
  console.log("- 用户等级: " + config.user.level_info.current_level);
  console.log(
    `- 当前经验:${config.user.level_info.current_exp}/${config.user.level_info.next_exp}`
  );

  console.log(`- 升级还需经验: ${config.user.mext_exp}`);

  console.log(
    `- 距离下级还需: ${config.user.next_day}天(登录+5 观看+5 分享+5)`
  );

  console.log(
    `- 距离满级(6级)还需: ${config.user.v6_day}天(登录+5 观看+5 分享+5)`
  );

  console.log(`- 最多投币: ${(config.user.money - 1) / 4} 天`);

  console.log(
    "- 距离满级(6级)最快还需: " +
      Math.ceil((config.user.v6_exp - config.user.money * 10) / 65) +
      "天(登录+5 观看+5 分享+5 投币+5*10)"
  );

  return true;
}

async function dynamic() {
  console.log(`#### 更新动态`);

  if (check("watch") || check("share")) {
    console.log(`- 观看(登录)任务:${check("watch")}`);
    console.log(`- 分享任务:${check("share")}`);

    return await $.http
      .get({
        url: `https://api.vc.bilibili.com/dynamic_svr/v1/dynamic_svr/dynamic_new?uid=${config.user.mid}&type_list=8&from=&platform=web`,
        headers: {
          ...config.headers,
          accept: "application/json, text/plain, */*",
          origin: "https://t.bilibili.com",
          referer: "https://t.bilibili.com",
          dnt: 1,
        },
      })
      .then((response) => {
        const data = JSON.parse(response.body);

        if (data.data.cards) {
          console.log(`- 刷新视频动态成功 ${data.data.cards.length} 个`);
          config.cards = data.data.cards;
        } else {
          console.log(`- 刷新视频动态失败 ${response.bod}`);
        }
      });
  } else {
    config.done = true;
    console.log(`- 今日任务已完成`);
    await me();
  }
}

async function watch(aid, bvid, cid) {
  console.log(`#### 观看(登录)任务`);

  if (check("watch")) {
    console.log(`- 正在观看(登录)(${bvid}) ${config.watch?.time || ""}`);

    return await $.http
      .post({
        url: `https://api.bilibili.com/x/click-interface/web/heartbeat`,
        headers: {
          ...config.headers,
          accept: "application/json, text/javascript, */*; q=0.01",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          referrer: `https://www.bilibili.com/video/${bvid}`,
        },
        body: `aid=${aid}&cid=${cid}&bvid=${bvid}&mid=${config.user.mid}&csrf=${
          config.cookie.bili_jct
        }&played_time=1&real_played_time=1&realtime=1&start_ts=${
          Date.parse(new Date()) / 1000
        }&type=3&dt=2&play_type=0&from_spmid=0&spmid=0&auto_continued_play=0&refer_url=https%3A%2F%2Ft.bilibili.com%2F&bsource=`,
      })
      .then(
        (response) => {
          const data = JSON.parse(response.body);
          if (data.code == 0) {
            console.log(`- 累计观看(登录)次数 ${(config.watch.num || 0) + 1}`);

            config.watch = {
              num: (config.watch.num || 0) + 1,
              time: format($script.startTime),
            };

            $persistentStore.write(
              JSON.stringify(config.watch),
              name + "_watch"
            );

            return true;
          } else {
            console.log("headers " + JSON.stringify(response.headers));
            console.log("data " + JSON.stringify(response.body));
            console.log("观看(登录)失败");
            return false;
          }
        },
        (err) => {
          console.log(`- headers ${JSON.stringify(response.headers)}`);
          console.log(`- data ${JSON.stringify(response.body)}`);
          console.log(`- 观看(登录)失败`);
          return false;
        }
      );
  } else {
    console.log(`- 今天已经观看 ${config.share.time}`);
    return false;
  }
}

async function share(aid, bvid) {
  console.log(`#### 分享任务`);

  if (check("share")) {
    console.log(`- 正在分享(${aid},${bvid}) ${config.share?.time || ""}`);

    return await $.http
      .post({
        url: `https://api.bilibili.com/x/web-interface/share/add`,
        headers: {
          ...config.headers,
          accept: "application/json, text/plain, */*",
          Host: "api.bilibili.com",
          Origin: "https://www.bilibili.com",
          "content-type": "application/x-www-form-urlencoded",
          referrer: "https://www.bilibili.com/video/" + bvid,
        },
        body: `aid=${aid}&csrf=${config.cookie.bili_jct}`,
      })
      .then((response) => {
        const data = JSON.parse(response.body);
        // console.log(`分享结果 ${response.body}`);

        if (data.code == 0) {
          config.share = {
            num: (config.share.num || 0) + 1,
            time: format($script.startTime),
          };

          return $persistentStore.write(
            JSON.stringify(config.share),
            name + "_share"
          );
        } else {
          console.log(`- headers ${JSON.stringify(response.headers)}`);
          console.log(`- data ${JSON.stringify(response.body)}`);
          console.log(`- 分享失败`);
          return false;
        }
      });
  } else {
    console.log(`- 今天已经分享 ${config.share.time}`);
    return false;
  }
}

function coin() {
  fetch("https://api.bilibili.com/x/web-interface/coin/add", {
    headers: {
      ...config.headers,
      accept: "application/json, text/plain, */*",
      "content-type": "application/x-www-form-urlencoded",
    },
    referrer: "https://www.bilibili.com/video/BV1GS4y1C7Zn",
    referrerPolicy: "no-referrer-when-downgrade",
    body: "aid=723929023&csrf=27ae456d34f62042234e4ae35f1ee41b",
    method: "POST",
    mode: "cors",
    credentials: "include",
  });
}

async function fav() {
  fetch(
    "https://api.bilibili.com/x/v3/fav/resource/ids?media_id=66764025&platform=web",
    {
      headers: {
        accept: "*/*",
        "accept-language": "zh-CN,zh;q=0.9",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
      },
      referrer: "https://www.bilibili.com/",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "include",
    }
  );
}

!(async () => {
  if ("object" == typeof $request) {
    console.log("正在获得 cookie");
    config.user = {};
    config.watch = {};
    config.share = {};
    config.headers.Cookie = $request.headers.Cookie;
    console.log(
      $persistentStore.write(JSON.stringify(config.headers), name + "_headers")
        ? "获得 cookie 成功"
        : "获得 cookie 失败"
    );
  } else {
    config.headers = JSON.parse(
      $persistentStore.read(name + "_headers") || "{}"
    );
    config.user = JSON.parse($persistentStore.read(name + "_user") || "{}");
    config.watch = JSON.parse($persistentStore.read(name + "_watch") || "{}");
    config.share = JSON.parse($persistentStore.read(name + "_share") || "{}");
  }
  config.cookie = cookie2object(config.headers.Cookie);

  console.log("cookie " + JSON.stringify(config.cookie));

  if (config.cookie && (await me())) {
    await dynamic();

    if (config.cards.length) {
      item = config.cards[Math.floor(Math.random() * config.cards.length)];
      card = JSON.parse(item.card);

      await watch(item.desc.rid, item.desc.bvid, card.cid);
      await share(item.desc.rid, item.desc.bvid);
    }

    await dynamic();

    let title = `${name} 每日任务 ${config.user.num}/${config.watch.num}/${
      config.share.num
    }${config.done ? "" : "未完成"}`;
    console.log(`#### ${title}`);

    let u = `登录时间: ${config.user.time}`;
    let w = `观看时间: ${config.watch.time}`;
    let s = `分享时间: ${config.share.time}`;

    console.log(`- ${u}`);
    console.log(`- ${w}`);
    console.log(`- ${s}`);

    $.notify(title, `📅  ${format($script.startTime)}`, `${u}\n${w}\n${s}`);

    return {
      title: `${name} [${config.user.uname}]`,
      content:
        `更新时间: ${format($script.startTime)}\n` +
        `任务:登录(观看)${check("watch") ? "" : "+10exp"} 分享${
          check("share") ? "" : "+5exp"
        }\n` +
        `经验:${config.user.level_info.current_exp}/${config.user.level_info.next_exp}/28800\n` +
        `等级:${config.user.level_info.current_level} ==> ${
          config.user.next_day
        }/${config.user.v6_day}/${Math.ceil(
          (config.user.v6_exp - config.user.money * 10) / 65
        )}/天`,
    };
  } else {
    $.notify(
      `${name} 任务失败`,
      `📅 ${format($script.startTime)}`,
      "无法获取 cookie 请先打开 MitM 以便获取 cookie"
    );

    return {
      title: `${name} 任务失败 📅 ${format($script.startTime)}`,
      content: `无法获取 cookie 请先打开 MitM 以便获取 cookie`,
    };
  }
})()
  .then((data) => $.done(data))
  .catch((err) => $.error(err))
  .finally(() => $.done());
