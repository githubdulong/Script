/**
 * 脚本名称：京东购物助手
 * 使用说明：进入APP商品详情页触发，支持京东下单返利和慢慢买、购物党和什么值得买跳转比价领券以及慢慢买接口历史价格。

[Script] 
# > 京东购物助手
购物助手 = type=http-response,pattern=^https:\/\/in\.m\.jd\.com\/product\/.+?\.html,requires-body=1,max-size=-1,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/jd_buy_helper.js
[MITM]
hostname = %APPEND% in.m.jd.com, lite-in.m.jd.com
 
 * 添加脚本后依赖BoxJs使用 https://raw.githubusercontent.com/FoKit/Scripts/main/boxjs/fokit.boxjs.json

 * Surge可填写模块参数使用 https://raw.githubusercontent.com/githubdulong/Script/master/Surge/jd_buy_helper.sgmodule

 */
const $ = new Env("购物助手");
let html = $response.body;

!(async () => {
  if (!html || !html.includes("</html>")) {
    $.log("找不到</html>标签，结束执行");
    $.done({ body: html });
  } else {
    $.log("已开始执行");
    await init_tools(); // 初始化
    if ($.jd_unionId && $.jtt_appid && $.jtt_appkey) {
      await jingfenJingTuiTui(); // 京推推转链
    } else {
      $.msg($.name, ``, `请检查配置是否正确 ❌`);
      $.done({ body: html });
    }
    await get_price_comparison(); // 获取比价信息
    await notice(); // 通知
    await hook_html(); // 注入
  }
})()
  .catch((e) => {
    $.log($.name, ``, `出错了: ${e}❌`);
  })
  .finally(() => {
    $.done({ body: html });
  });

// 初始化
async function init_tools() {
  $.log("初始化开始");

  // 从模块传入参数
  const args = typeof $argument !== 'undefined' ? $argument : "";
  $.log(`传入的参数: ${args}`);
  const argObj = Object.fromEntries(
    args.split("&").map((item) => item.split("=").map(decodeURIComponent))
  );

  // 参数优先级：模块参数 > BoxJs 参数
  $.jd_unionId = argObj["jd_union_id"] || $.getdata("jd_unionId") || "";
  $.jd_positionId = argObj["jd_position_id"] || $.getdata("jd_positionId") || "";
  $.jtt_appid = argObj["jtt_appid"] || $.getdata("jtt_appid") || "";
  $.jtt_appkey = argObj["jtt_appkey"] || $.getdata("jtt_appkey") || "";

  $.log(`jd_unionId: ${$.jd_unionId}`);
  $.log(`jd_positionId: ${$.jd_positionId}`);
  $.log(`jtt_appid: ${$.jtt_appid}`);
  $.log(`jtt_appkey: ${$.jtt_appkey}`);

  $.button = [];
  const helperConfig = {
    zdm: argObj["buy_helper_zdm"] || $.getdata("buy_helper_zdm") || "true",
    mmm: argObj["buy_helper_mmm"] || $.getdata("buy_helper_mmm") || "true",
    gwd: argObj["buy_helper_gwd"] || $.getdata("buy_helper_gwd") || "false",
    copy: argObj["buy_helper_copy"] || $.getdata("buy_helper_copy") || "true",
  };

  if (helperConfig.zdm !== "false") $.button.push("smzdm");
  if (helperConfig.mmm !== "false") $.button.push("mmm");
  if (helperConfig.gwd !== "false") $.button.push("gwd");
  if (helperConfig.copy !== "false") $.button.push("copy");

  $.buy_helper_LR = argObj["buy_helper_LR"] || $.getdata("buy_helper_LR") || "left";

  let url = $request.url;
  $.appType = url.includes("lite-in.m.jd.com") ? "jdtj" : "jd";
  $.sku = url.match(/\/(\d+)\.html/)?.[1] || "";
  $.shortUrl = `https://item.jd.com/${$.sku}.html`;

  $.log("初始化完成");
  $.log(`类型: ${$.appType}`);
  $.log(`商品: ${$.sku}`);
  $.log(`appId: ${$.jtt_appid}`);
  $.log(`appkey: ${$.jtt_appkey}`);
}

// 京推推转链
async function jingfenJingTuiTui() {
  $.log('转链开始');
  return new Promise((resolve) => {
    const options = {
      url: `http://japi.jingtuitui.com/api/universal?appid=${$.jtt_appid}&appkey=${$.jtt_appkey}&v=v3&unionid=${$.jd_unionId}&positionid=${$.jd_positionId}&content=https://item.jd.com/${$.sku}.html`,
      timeout: 100 * 1000,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
    }
    $.get(options, async (err, resp, data) => {
      try {
        if (err) {
          $.log(`京推推 universal 请求失败：${$.toStr(err)}\n`);
        } else {
          data = JSON.parse(data);
          if (data['return'] == 0) {
            const { chain_link, goods_info } = data?.result?.link_date?.[0];
            const { skuName = chain_link, imageInfo, commissionInfo, priceInfo } = goods_info || {};
            $.commissionShare = commissionInfo.commissionShare;  // 佣金比例
            $.commission = commissionInfo.couponCommission;  // 券后佣金
            $.shortUrl = chain_link;  // 二合一短链
            $.price = priceInfo.lowestPrice;  // 商品原价
            $.skuName = skuName;  // 商品名称
            $.skuImg = imageInfo.imageList[0].url;  // 商品主图
            $.log(`短链地址 ${$.shortUrl}`);
            $.log('转链完成');
          } else {
            console.log($.toStr(data));
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    })
  })
}

// 获取比价信息
async function get_price_comparison() {
  return new Promise((resolve) => {
    const options = {
      url: "https://appia-history.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx", // 新接口参考灰灰
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
      },
      body: 'methodName=getHistoryTrend&p_url=' + encodeURIComponent(`https://item.m.jd.com/product/${$.sku}.html`)
    };
    $.post(options, (error, response, data) => {
      try {
        data = JSON.parse(data);
        if (data?.ok == 1 && data?.single && data?.PriceRemark?.ListPriceDetail) {
          // 获取历史最低价和历史最低日期
          const ListPriceDetail = data?.PriceRemark?.ListPriceDetail;

          // 使用 find() 方法找到历史最低对象
          const lower_data = ListPriceDetail.find(item => item.ShowName == "历史最低");
          if (lower_data) {
            const { extraPrice, Price, Difference, Date } = lower_data; // 提取最低价、价格差值和日期信息
            $.Difference = Difference;  // 价格差值
            $.desc = `历史最低: ${Price || `¥${extraPrice}`} (${Date})`; // 确保 $.desc 已初始化
          } else {
            $.desc = `历史最低: 暂无`; // 如果未找到历史最低价，初始化 $.desc
          }
          $.price = data?.recentlyZK?.currentprice || $.price;  // 当前到手价
          $.skuName = data?.single?.title || $.skuName;  // 商品标题
          $.skuImg = data?.single?.smallpic || $.skuImg;  // 商品图片
        } else {
          $.desc = `历史最低: 暂无`; // 如果获取比价信息失败，初始化 $.desc
          $.log(`获取比价信息失败`);
        }
      } catch (e) {
        $.logErr(e, response);
      } finally {
        resolve();
      }
    });
  });
}

// 通知
async function notice() {
  $.log(`发送通知`);
  $.title = $.skuName;

  // 定义 opts 对象
  $.opts = {
    'auto-dismiss': 30  // 30 秒自动删除通知
  };

  // 确保 $.desc 已初始化
  if (!$.desc) {
    $.desc = ""; // 如果 $.desc 未初始化，设置为空字符串
  }

  if (/u\.jd\.com/.test($.shortUrl)) {
    $.desc += `\n预计返利: ¥${($.price * $.commissionShare / 100).toFixed(2)}  ${$.commissionShare}%`;
    $.desc += `\n当前到手: ¥${$.price}${$.Difference ? `  ${$.Difference}` : ``}`;

    // 生成跳转链接
    switch ($.appType) {
      case "jdtj":
        $.jumpUrl = `openjdlite://virtual?params=${encodeURIComponent(
          `{"category":"jump","des":"m","url":"${$.shortUrl}"}`
        )}`;
        break;
      default:
        $.jumpUrl = `openApp.jdMobile://virtual?params=${encodeURIComponent(
          `{"category":"jump","des":"m","sourceValue":"babel-act","sourceType":"babel","url":"${$.shortUrl}"}`
        )}`;
        break;
    }

    // 添加跳转链接
    if ($.jumpUrl) $.opts['$open'] = $.jumpUrl;

  } else {
    $.desc += `\n预计返利: 暂无`;
    $.log(`无佣金商品`);
  }

  // 添加媒体图片
  if ($.skuImg) $.opts['$media'] = $.skuImg;

  // 修复 Loon 在 iOS 16 带有媒体导致无法正常通知的 bug
  if ($.isLoon()) {
    $.opts = $loon.split(' ')[1].split('.')[0] === '16' ? { ...$.opts, '$media': undefined } : $.opts;
  }

  // 发送通知
  $.msg($.title, $.subt, $.desc, $.opts);
}

// 注入html
async function hook_html() {
  $.log("开始注入html");

  const buttons = [
    {
      key: "mmm",
      icon: "https://raw.githubusercontent.com/FoKit/Scripts/main/images/icon/mmm.png",
    },
    {
      key: "smzdm",
      icon: "https://raw.githubusercontent.com/FoKit/Scripts/main/images/icon/zdm.png",
    },
    {
      key: "gwd",
      icon: "https://raw.githubusercontent.com/FoKit/Scripts/main/images/icon/gwd.png",
    },
    {
      key: "jf",
      icon: "https://raw.githubusercontent.com/FoKit/Scripts/main/images/icon/jf.png",
    },
    {
      key: "copy",
      icon: "https://raw.githubusercontent.com/FoKit/Scripts/main/images/icon/copy.png",
    },
  ].filter((item) => $.button.includes(item.key) && $.sku);

  $.hook = `
  <style>
    html,
    body {
        -webkit-user-select: auto !important;
        user-select: auto !important;
    }

    #tools {
        position: fixed;
        z-index: 99999;
        border: none;
        top: 40%;
    }

    #tools.right {
        right: 0;
    }

    #tools.left {
        left: 0;
    }

    #tools button {
        background-color: #fff;
        padding: 3px 8px;
        display: block;
        margin-bottom: 5px;
        box-shadow: -2px 1px 8px #888888;
        border: 1px;
    }

    #tools img {
        width: 25px;
        height: 25px;
        border-radius: 50%;
        overflow: hidden;
        position: relative;
    }

    #tools.right button {
        border-radius: 50px 0 0 50px;
    }

    #tools.right button img {
        left: -5px;
    }

    #tools.left button {
        border-radius: 0 50px 50px 0;
    }

    #tools.left button img {
        right: -5px;
    }

    /* 半透明黑色背景 */
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 999;
      display: none;
    }

    /* 圆角提示框 */
    .custom-alert {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      display: none;
    }
  </style>

  <div id="tools" class="${$.buy_helper_LR}">
    ${buttons
      .map((item) => {
        return `<button id="${item.key}"><img src="${item.icon}"/></button>`;
      })
      .join(`\n`)}
  </div>

  <script>
    // 值得买
    const zdmbtn = document.querySelector('#smzdm')
    zdmbtn && zdmbtn.addEventListener('click', async () => {
      const link = "https://item.jd.com/${$.sku}.html";
      try {
        await navigator.clipboard.writeText(link);
        console.log('复制成功: ' + link);
        window.location.href = 'smzdm://';
      } catch (err) {
        console.error('复制失败: ', err);
      }
    });

    // 慢慢买
    const mmmbtn = document.querySelector('#mmm')
    mmmbtn && mmmbtn.addEventListener('click', async () => {
      const link = "https://item.jd.com/${$.sku}.html";
      try {
        await navigator.clipboard.writeText(link);
        console.log('复制成功: ' + link);
        window.location.href = 'manmanbuy://';
      } catch (err) {
        console.error('复制失败: ', err);
      }
    });

    // 购物党
    const gwdbtn = document.querySelector('#gwd')
    gwdbtn && gwdbtn.addEventListener('click', async () => {
      const link = "https://item.jd.com/${$.sku}.html";
      try {
        await navigator.clipboard.writeText(link);
        console.log('复制成功: ' + link);
        window.location.href = 'gwdang://';
      } catch (err) {
        console.error('复制失败: ', err);
      }
    });

    // 复制短链
    const cpbtn = document.querySelector('#copy')
    cpbtn && cpbtn.addEventListener('click', async () => {
      const link = "${$.shortUrl}";
      try {
        await navigator.clipboard.writeText(link);
        window.alert(link);
        console.log('复制成功: ' + link);
      } catch (err) {
        console.error('复制失败: ', err);
      }
    });
  </script>
  </html>`;
  html = html.replace(/(<\/html>)/g, $.hook);
  $.log("注入html完成");
  $.done({ body: html });
}


// prettier-ignore
function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise(((e, i) => { s.call(this, t, ((t, s, o) => { t ? i(t) : e(s) })) })) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.logLevels = { debug: 0, info: 1, warn: 2, error: 3 }, this.logLevelPrefixs = { debug: "[DEBUG] ", info: "[INFO] ", warn: "[WARN] ", error: "[ERROR] " }, this.logLevel = "info", this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } getEnv() { return "undefined" != typeof $environment && $environment["surge-version"] ? "Surge" : "undefined" != typeof $environment && $environment["stash-version"] ? "Stash" : "undefined" != typeof module && module.exports ? "Node.js" : "undefined" != typeof $task ? "Quantumult X" : "undefined" != typeof $loon ? "Loon" : "undefined" != typeof $rocket ? "Shadowrocket" : void 0 } isNode() { return "Node.js" === this.getEnv() } isQuanX() { return "Quantumult X" === this.getEnv() } isSurge() { return "Surge" === this.getEnv() } isLoon() { return "Loon" === this.getEnv() } isShadowrocket() { return "Shadowrocket" === this.getEnv() } isStash() { return "Stash" === this.getEnv() } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null, ...s) { try { return JSON.stringify(t, ...s) } catch { return e } } getjson(t, e) { let s = e; if (this.getdata(t)) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise((e => { this.get({ url: t }, ((t, s, i) => e(i))) })) } runScript(t, e) { return new Promise((s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let o = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); o = o ? 1 * o : 20, o = e && e.timeout ? e.timeout : o; const [r, a] = i.split("@"), n = { url: `http://${a}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: o }, headers: { "X-Key": r, Accept: "*/*" }, timeout: o }; this.post(n, ((t, e, i) => s(i))) })).catch((t => this.logErr(t))) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), o = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, o) : i ? this.fs.writeFileSync(e, o) : this.fs.writeFileSync(t, o) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let o = t; for (const t of i) if (o = Object(o)[t], void 0 === o) return s; return o } lodash_set(t, e, s) { return Object(t) !== t || (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce(((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}), t)[e[e.length - 1]] = s), t } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), o = s ? this.getval(s) : ""; if (o) try { const t = JSON.parse(o); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, o] = /^@(.*?)\.(.*?)$/.exec(e), r = this.getval(i), a = i ? "null" === r ? null : r || "{}" : "{}"; try { const e = JSON.parse(a); this.lodash_set(e, o, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const r = {}; this.lodash_set(r, o, t), s = this.setval(JSON.stringify(r), i) } } else s = this.setval(t, e); return s } getval(t) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.read(t); case "Quantumult X": return $prefs.valueForKey(t); case "Node.js": return this.data = this.loaddata(), this.data[t]; default: return this.data && this.data[t] || null } } setval(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": return $persistentStore.write(t, e); case "Quantumult X": return $prefs.setValueForKey(t, e); case "Node.js": return this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0; default: return this.data && this.data[e] || null } } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.cookie && void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar))) } get(t, e = (() => { })) { switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, ((t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) })); break; case "Quantumult X": this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = t; e(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let s = require("iconv-lite"); this.initGotEnv(t), this.got(t).on("redirect", ((t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } })).then((t => { const { statusCode: i, statusCode: o, headers: r, rawBody: a } = t, n = s.decode(a, this.encoding); e(null, { status: i, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (t => { const { message: i, response: o } = t; e(i, o, o && s.decode(o.rawBody, this.encoding)) })); break } } post(t, e = (() => { })) { const s = t.method ? t.method.toLocaleLowerCase() : "post"; switch (t.body && t.headers && !t.headers["Content-Type"] && !t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), void 0 === t.followRedirect || t.followRedirect || ((this.isSurge() || this.isLoon()) && (t["auto-redirect"] = !1), this.isQuanX() && (t.opts ? t.opts.redirection = !1 : t.opts = { redirection: !1 })), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient[s](t, ((t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status ? s.status : s.statusCode, s.status = s.statusCode), e(t, s, i) })); break; case "Quantumult X": t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then((t => { const { statusCode: s, statusCode: i, headers: o, body: r, bodyBytes: a } = t; e(null, { status: s, statusCode: i, headers: o, body: r, bodyBytes: a }, r, a) }), (t => e(t && t.error || "UndefinedError"))); break; case "Node.js": let i = require("iconv-lite"); this.initGotEnv(t); const { url: o, ...r } = t; this.got[s](o, r).then((t => { const { statusCode: s, statusCode: o, headers: r, rawBody: a } = t, n = i.decode(a, this.encoding); e(null, { status: s, statusCode: o, headers: r, rawBody: a, body: n }, n) }), (t => { const { message: s, response: o } = t; e(s, o, o && i.decode(o.rawBody, this.encoding)) })); break } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } queryStr(t) { let e = ""; for (const s in t) { let i = t[s]; null != i && "" !== i && ("object" == typeof i && (i = JSON.stringify(i)), e += `${s}=${i}&`) } return e = e.substring(0, e.length - 1), e } msg(e = t, s = "", i = "", o) { const r = t => { const { $open: e, $copy: s, $media: i, $mediaMime: o } = t; switch (typeof t) { case void 0: return t; case "string": switch (this.getEnv()) { case "Surge": case "Stash": default: return { url: t }; case "Loon": case "Shadowrocket": return t; case "Quantumult X": return { "open-url": t }; case "Node.js": return }case "object": switch (this.getEnv()) { case "Surge": case "Stash": case "Shadowrocket": default: { const r = {}; let a = t.openUrl || t.url || t["open-url"] || e; a && Object.assign(r, { action: "open-url", url: a }); let n = t["update-pasteboard"] || t.updatePasteboard || s; if (n && Object.assign(r, { action: "clipboard", text: n }), i) { let t, e, s; if (i.startsWith("http")) t = i; else if (i.startsWith("data:")) { const [t] = i.split(";"), [, o] = i.split(","); e = o, s = t.replace("data:", "") } else { e = i, s = (t => { const e = { JVBERi0: "application/pdf", R0lGODdh: "image/gif", R0lGODlh: "image/gif", iVBORw0KGgo: "image/png", "/9j/": "image/jpg" }; for (var s in e) if (0 === t.indexOf(s)) return e[s]; return null })(i) } Object.assign(r, { "media-url": t, "media-base64": e, "media-base64-mime": o ?? s }) } return Object.assign(r, { "auto-dismiss": t["auto-dismiss"], sound: t.sound }), r } case "Loon": { const s = {}; let i = t.openUrl || t.url || t["open-url"] || e; i && Object.assign(s, { openUrl: i }); let o = t.mediaUrl || t["media-url"]; return o && Object.assign(s, { mediaUrl: o }), s } case "Quantumult X": { const i = {}; let o = t["open-url"] || t.url || t.openUrl || e; o && Object.assign(i, { "open-url": o }); let r = t["media-url"] || t.mediaUrl; r && Object.assign(i, { "media-url": r }); let a = t["update-pasteboard"] || t.updatePasteboard || s; return a && Object.assign(i, { "update-pasteboard": a }), i } case "Node.js": return }default: return } }; if (!this.isMute) switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": default: $notification.post(e, s, i, r(o)); break; case "Quantumult X": $notify(e, s, i, r(o)); break; case "Node.js": break }if (!this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } debug(...t) { this.logLevels[this.logLevel] <= this.logLevels.debug && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.debug}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } info(...t) { this.logLevels[this.logLevel] <= this.logLevels.info && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.info}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } warn(...t) { this.logLevels[this.logLevel] <= this.logLevels.warn && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.warn}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } error(...t) { this.logLevels[this.logLevel] <= this.logLevels.error && (t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(`${this.logLevelPrefixs.error}${t.map((t => t ?? String(t))).join(this.logSeparator)}`)) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.map((t => t ?? String(t))).join(this.logSeparator)) } logErr(t, e) { switch (this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: this.log("", `❗️${this.name}, 错误!`, e, t); break; case "Node.js": this.log("", `❗️${this.name}, 错误!`, e, void 0 !== t.message ? t.message : t, t.stack); break } } wait(t) { return new Promise((e => setTimeout(e, t))) } done(t = {}) { const e = ((new Date).getTime() - this.startTime) / 1e3; switch (this.log("", `🔔${this.name}, 结束! 🕛 ${e} 秒`), this.log(), this.getEnv()) { case "Surge": case "Loon": case "Stash": case "Shadowrocket": case "Quantumult X": default: $done(t); break; case "Node.js": process.exit(1) } } }(t, e) }
