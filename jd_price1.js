在不影响任何功能的情况下，能否帮我优化下代码。让更加流畅美观。不要修改变量名，不要删减功能。谢谢

/**
 * 京东购物助手，京推推转链+比价图表
 * 
 * 更新内容：
 * 2015-05-16 22:59
 * 更新接口
 *
 * 2025-05-01 14:53
 * 优化代码逻辑
 * 
 * 2025-04-24 15:19
 * 比价图表适配暗黑模式，UI细节处理
 * 
 * 2025-04-22 12:11
 * 增加京推推商品返利转链
 * 增加比价折线图表格显示
 * 比价代码@苍井灰灰
 * 
 * Surge模块设置参数，详见模块注释内容
 * 模块链接：https://raw.githubusercontent.com/githubdulong/Script/master/Surge/JD_Helper.sgmodule
 */

const path1 = "/product/graphext/";
const path2 = "/baoliao/center/menu";
const manmanbuy_key = "manmanbuy_val";
const url = $request.url;
const $ = new Env("京东助手");

const getMMdata = async (id) => {
  const $http = (op, t = 4) => {
    const { promise, resolve, reject } = Promise.withResolvers();
    const HTTPError = (e, req, res) =>
      Object.assign(new Error(e), {
        name: "HTTPError",
        request: req,
        response: res,
      });

    const handleRes = ({ bodyBytes, ...res }) => {
      res.status ??= res.statusCode;
      res.json = () => JSON.parse(res.body);
      if (res.headers?.["binary-mode"] && bodyBytes) res.body = new Uint8Array(bodyBytes);

      res.error || res.status < 200 || res.status > 307
        ? reject(HTTPError(res.error, op, res))
        : resolve(res);
    };

    const timer = setTimeout(
      () => reject(HTTPError("timeout", op)),
      op.$timeout ?? t * 1000
    );
    this.$httpClient?.[op.method || "get"](op, (error, resp, body) => {
      handleRes({ error, ...resp, body });
    });
    this.$task?.fetch({ url: op, ...op }).then(handleRes, handleRes);

    return promise.finally(() => clearTimeout(timer));
  };

  const getmmCK = () => {
    const ck = $.getdata("慢慢买CK");
    if (ck) return ck;
    throw new Error("未获取 ck，请先打开【慢慢买】APP→我的，获取 ck");
  };

  const reqOpts = ({ url, buildBody, ...op }) => {
    const opt = {
      method: "post",
      url,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 - mmbWebBrowse - ios",
      },
      ...op,
    };
    const cb = (args) => {
      const reqBody = {
        t: Date.now().toString(),
        c_appver: "4.8.3.1",
        c_mmbDevId: getmmCK(),
        ...args,
      };
      reqBody.token = md5(
        encodeURIComponent(
          "3E41D1331F5DDAFCD0A38FE2D52FF66F" +
            jsonToCustomString(reqBody) +
            "3E41D1331F5DDAFCD0A38FE2D52FF66F"
        )
      ).toUpperCase();
      return jsonToQueryString(reqBody);
    };
    return { ...opt, body: buildBody(cb) };
  };

  const apiCall = (url, buildBody) =>
    $http(reqOpts({ url, buildBody })).then((resp) => {
      const body = resp.json();
      const { code, msg } = body;
      if (code && code !== 2000 && code !== 6001) throw new Error(`${url} ${msg}`);
      return body;
    });

  const {
    result: { spbh, url },
  } = await apiCall(
    "https://apapia-history-weblogic.manmanbuy.com/basic/getItemBasicInfo",
    (set) =>
      set({
        methodName: "getHistoryInfoJava",
        searchKey: `https://item.jd.com/${id}.html`,
      })
  );

  const {
    result: { trend: jiagequshiyh },
    msg,
  } = await apiCall(
    "https://apapia-history-weblogic.manmanbuy.com/history/v2/getHistoryTrend",
    (set) =>
      set({
        methodName: "getHistoryTrend2021",
        spbh,
        url,
      })
  );

  if (!jiagequshiyh) return { msg };

  const {
    remark: { ListPriceDetail },
  } = await apiCall(
    "https://apapia-history-weblogic.manmanbuy.com/history/priceRemark",
    (set) =>
      set({
        methodName: "priceRemarkJava",
        jiagequshiyh,
      })
  );

  return {
    ListPriceDetail,
    jiagequshiyh,
  };
};

// 获取模块或插件传入参数
let args =
  typeof $argument === "string"
    ? $argument
    : typeof $argument === "object" && $argument !== null
      ? Object.entries($argument)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join("&")
      : "";
$.log(`读取参数: ${args}`);
const argObj = Object.fromEntries(
  args.split("&").map((item) => item.split("=").map(decodeURIComponent))
);
const isEmpty = (val) => !val || val === "null";

// 参数优先级：模块参数 > BoxJs 本地存储
$.jd_unionId = !isEmpty(argObj["jd_union_id"])
  ? argObj["jd_union_id"]
  : $.getdata("jd_unionId") || "";
$.jd_positionId = !isEmpty(argObj["jd_position_id"])
  ? argObj["jd_position_id"]
  : $.getdata("jd_positionId") || "";
$.jtt_appid = !isEmpty(argObj["jtt_appid"])
  ? argObj["jtt_appid"]
  : $.getdata("jtt_appid") || "";
$.jtt_appkey = !isEmpty(argObj["jtt_appkey"])
  ? argObj["jtt_appkey"]
  : $.getdata("jtt_appkey") || "";
$.disableNotice = argObj["disable_notice"] === "false" ? false : true;
const defaultThemeTime = "7-19";
$.themeTime = !isEmpty(argObj["theme_time"])
  ? argObj["theme_time"]
  : $.getdata("theme_time") || defaultThemeTime;

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await $.get({ url, timeout: 30000, ...options });
    } catch (error) {
      $.log(`请求失败，第 ${i + 1} 次重试: ${error}`);
      if (i === maxRetries - 1) throw error;
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

if (url.includes(path2)) {
  const reqbody = $request.body;
  $.setdata(reqbody, manmanbuy_key);
  $.msg($.name, "获取ck成功🎉", reqbody);
}

if (url.includes(path1)) {
  intCryptoJS();
  $.manmanbuy = getck();
  let url = $request.url;
  $.appType = url.includes("lite-in.m.jd.com") ? "jdtj" : "jd";

  (async () => {
    const match = url.match(/product\/graphext\/(\d+)\.html/);
    if (!match) {
      $done({});
      return;
    }

    const shareUrl = `https://item.jd.com/${match[1]}.html`;
    const id = match[1];
    try {
      if ($.disableNotice && $.jd_unionId && $.jtt_appid && $.jtt_appkey) {
        $.sku = match[1];
        await jingfenJingTuiTui();
        await notice();
      } else if (!$.disableNotice) {
        $.log("已禁用京推推返利和通知，仅显示比价图表");
      }

      const basicRes = await getItemBasicInfo_v1(shareUrl); // V1
      const basic = checkRes(basicRes, '获取 spbh');

      const shareRes = await share(basic.spbh, basic.url);
      const shareLink = checkRes(shareRes, '分享商品');

      const trendId = shareLink.split('?')[1] || '';
      const trendRes = await trendData(trendId);
      const trend = checkRes(trendRes, '获取价格趋势');

      const { ListPriceDetail, msg } = await getMMdata(id);
      if (!ListPriceDetail) throw msg;
      const exclude = new Set(["常购价格", "历史最高价"]);
      const list = ListPriceDetail.filter((i) => !exclude.has(i.Name));

      const html = buildPriceTableHTML(list);
      const newBody = $response.body.replace(
        /<body[^>]*>/,
        (match) => `${match}\n${html}`
      );
      $done({ body: newBody });
    } catch (err) {
      console.warn(err.message || err);
      $done({});
    }
  })();
}

/** 京推推转链 */
async function jingfenJingTuiTui() {
  $.log("转链开始");
  return new Promise((resolve) => {
    const options = {
      url: `http://japi.jingtuitui.com/api/universal?appid=${$.jtt_appid}&appkey=${$.jtt_appkey}&v=v3&unionid=${$.jd_unionId}&positionid=${$.jd_positionId}&content=https://item.jd.com/${$.sku}.html`,
      timeout: 20000,
      headers: { "Content-Type": "application/json;charset=utf-8" },
    };

    $.get(options, (err, resp, data) => {
      if (err) {
        $.log("京推推 universal 请求失败：" + $.toStr(err));
        $.logErr("转链过程中的错误: " + err);
      } else {
        try {
          data = JSON.parse(data);
          if (data["return"] == 0) {
            const linkData = data?.result?.link_date?.[0] || {};
            const { chain_link, goods_info } = linkData;
            if (goods_info) {
              const {
                skuName = chain_link,
                imageInfo,
                commissionInfo,
                priceInfo,
              } = goods_info;
              $.commissionShare = commissionInfo.commissionShare;
              $.commission = commissionInfo.couponCommission;
              $.price = priceInfo.lowestPrice;
              $.skuName = skuName;
              $.skuImg = imageInfo.imageList?.[0]?.url;
            }
            $.shortUrl = chain_link || "";
            $.log("转链完成，短链地址：" + $.shortUrl);
          } else {
            $.log("转链返回异常：" + JSON.stringify(data));
          }
        } catch (e) {
          $.logErr("JSON 解析失败: " + e.message);
        }
      }
      resolve();
    });
  });
}

/** 发送通知 */
async function notice() {
  $.log("发送通知");
  $.title = $.skuName || "商品信息";
  $.opts = { "auto-dismiss": 30 };
  $.desc = $.desc || "";
  if (/u\.jd\.com/.test($.shortUrl)) {
    $.desc += `预计返利: ¥${(($.price * $.commissionShare) / 100).toFixed(2)}  ${$.commissionShare}%`;

    // 根据平台生成跳转链接
    if ($.appType === "jdtj") {
      $.jumpUrl = `openjdlite://virtual?params=${encodeURIComponent('{"category":"jump","des":"m","url":"' + $.shortUrl + '"}')}`;
    } else {
      $.jumpUrl = `openApp.jdMobile://virtual?params=${encodeURIComponent('{"category":"jump","des":"m","sourceValue":"babel-act","sourceType":"babel","url":"' + $.shortUrl + '"}')}`;
    }
    $.opts["$open"] = $.jumpUrl;
  } else {
    $.desc += "\n预计返利: 暂无";
    $.log("无佣金商品");
  }
  if ($.skuImg) $.opts["$media"] = $.skuImg;
  $.msg($.title, $.subt, $.desc, $.opts);
}

function checkRes(res, desc = "") {
  if (res.code !== 2000 || (!res.result && !res.data)) {
    $.log("温馨提示: " + res.msg);
    throw new Error(`慢慢买提示您：${res.msg || `${desc}失败`}`);
  }
  return res.result || res.data;
}

function buildPriceTableHTML(priceList) {
  if (!Array.isArray(priceList) || priceList.length === 0) {
    console.warn("priceList is empty or invalid, returning empty table");
    return `<div class="price-container">
                  <table class="price-table">
                    <thead><tr><th>类型</th><th>日期</th><th>价格</th><th>差价</th></tr></thead>
                    <tbody><tr><td colspan="4">暂无数据</td></tr></tbody>
                  </table>
                </div>`;
  }

  const rows = priceList
    .map((item) => {
      let { Name: name, Date: date, Price: price = "", Difference: diff = "" } = item;
      date =
        name === "当前到手价"
          ? typeof $.time === "function"
            ? $.time("yyyy-MM-dd")
            : new Date().toISOString().split("T")[0]
          : date || "-";
      let diffClass = diff.startsWith("↑") ? "up" : diff.startsWith("↓") ? "down" : "";
      return `<tr><td>${name}</td><td>${date}</td><td>${price}</td><td class="price-diff ${diffClass}">${diff}</td></tr>`;
    })
    .join("");

  const chartData = priceList
    .filter((i) => i.Price && !isNaN(parseFloat(String(i.Price).replace(/[¥\s]/g, ""))))
    .map((i) => ({
      date:
        i.Name === "当前到手价"
          ? typeof $.time === "function"
            ? $.time("yyyy-MM-dd")
            : new Date().toISOString().split("T")[0]
          : i.Date || "-",
      price: parseFloat(String(i.Price).replace(/[¥\s]/g, "")),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = chartData.map((i) => i.date);
  const prices = chartData.map((i) => i.price);

  return `
<div class="price-container">
  <table class="price-table">
    <thead><tr><th>类型</th><th>日期</th><th>价格</th><th>差价</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <canvas id="priceChart" height="100"></canvas>
</div>
<style>
body, table {
    font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

/* 主题变量 */
:root {
    --background-color: #FEFEFE;
    --text-color: #333;
    --border-color: #EEE;
    --shadow-color: rgba(0,0,0,0.05);
}

/* 暗黑模式变量 */
[data-theme="dark"] {
    --background-color: #1a1a1a;
    --text-color: #f0f0f0;
    --border-color: #444;
    --shadow-color: rgba(0,0,0,0.2);
}

.price-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 10px;
    font-size: 13px;
    font-weight: bold;
    background: var(--background-color);
    color: var(--text-color);
    border-radius: 0;
    overflow: hidden;
    box-shadow: none;
    transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
}

.price-table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    border-radius: 8px;
    overflow: hidden;
}

.price-table thead tr {
    background: linear-gradient(to right, #ff6666, #e61a23);
}

.price-table th {
    background: none;
    color: #fff;
    padding: 12px;
    text-align: left;
    font-weight: bold;
    border: none;
}

.price-table td {
    padding: 12px;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-color);
    transition: color 0.3s ease;
}

.price-diff.up {
    color: #C91623;
}

.price-diff.down {
    color: #00aa00;
}
</style>
<script>
const setTimeBasedTheme = () => {
    const themeTime = "${$.themeTime}".split("-");
    let start = parseInt(themeTime[0]) || 7;
    let end = parseInt(themeTime[1]) || 19;
    const currentHour = new Date().getHours();
    const isDarkTime = currentHour < start || currentHour >= end;
    document.documentElement.setAttribute('data-theme', isDarkTime ? 'dark' : 'light');
    console.log('Theme set to:', document.documentElement.getAttribute('data-theme'));
};

// 图表初始化函数
const initializeChart = () => {
    const canvas = document.getElementById('priceChart');
    if (!canvas) {
        console.error('Canvas element not found for priceChart');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Canvas context not found for priceChart');
        return;
    }

    if (window.priceChartInstance) {
        window.priceChartInstance.destroy();
    }

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    console.log('isDarkMode:', isDarkMode);

    // 获取 CSS 变量 --text-color
    const themeTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    console.log('themeTextColor from CSS:', themeTextColor);

    // 图表配置
    window.priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ${JSON.stringify(labels)},
            datasets: [{
                label: '价格趋势',
                data: ${JSON.stringify(prices)},
                borderColor: '#e61a23',
                backgroundColor: 'rgba(230,26,35,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        boxWidth: 12,
                        font: { size: 12 },
                        color: themeTextColor
                    }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? '#444' : '#fff',
                    titleColor: themeTextColor,
                    bodyColor: themeTextColor,
                    callbacks: {
                        label: ctx => '¥' + ctx.raw
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '日期（1年）',
                        align: 'start',
                        color: themeTextColor,
                        font: { size: 12 }
                    },
                    ticks: {
                        autoSkip: false,
                        color: themeTextColor,
                        font: { size: 12 }
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '价格（元）',
                        color: themeTextColor,
                        font: { size: 12 }
                    },
                    ticks: {
                        color: themeTextColor,
                        font: { size: 12 }
                    },
                    grid: {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    },
                    beginAtZero: false
                }
            }
        }
    });
};

// 初始化主题和图表
document.addEventListener('DOMContentLoaded', () => {
    setTimeBasedTheme();
    initializeChart();

    // 动态监听主题变化
    const observer = new MutationObserver(() => {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const newThemeTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
        if (window.priceChartInstance) {
            window.priceChartInstance.options.plugins.legend.labels.color = newThemeTextColor;
            window.priceChartInstance.options.scales.x.title.color = newThemeTextColor;
            window.priceChartInstance.options.scales.x.ticks.color = newThemeTextColor;
            window.priceChartInstance.options.scales.y.title.color = newThemeTextColor;
            window.priceChartInstance.options.scales.y.ticks.color = newThemeTextColor;
            window.priceChartInstance.options.plugins.tooltip.titleColor = newThemeTextColor;
            window.priceChartInstance.options.plugins.tooltip.bodyColor = newThemeTextColor;
            window.priceChartInstance.options.plugins.tooltip.backgroundColor = isDarkMode ? '#444' : '#fff';
            window.priceChartInstance.update();
        }
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
</script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>`;
}

function get_options(extraParams = {}, url) {
  const sourceParams = $.manmanbuy;
  const SECRET_KEY = "3E41D1331F5DDAFCD0A38FE2D52FF66F";
  const baseParams = {
    t: "",
    jsoncallback: "?",
    c_individ: "",
    c_appver: "",
    c_ostype: "",
    c_osver: "",
    c_devid: "",
    c_mmbDevId: "",
    c_systemDevId: "",
    c_fixDevId: "",
    c_devmodel: "",
    c_brand: "",
    c_operator: "",
    c_engine: "",
    c_session: "",
    c_ddToken: "",
    c_ctrl: "",
    c_win: "",
    c_dp: "",
    c_safearea: "",
    c_firstchannel: "",
    c_firstquerendate: "",
    c_fristversion: "",
    c_channel: "",
    c_uuid: "",
    c_ssid: "",
    c_did: "",
    c_theme: "",
    c_jpush: "",
    c_mmbncid: "",
    sm_deviceid: "",
  };

  const mergedParams = {
    ...baseParams,
    ...Object.fromEntries(
      Object.entries(sourceParams).filter(([key]) => key in baseParams)
    ),
    t: Date.now().toString(),
    ...extraParams,
  };

  const requestBody = { ...mergedParams };
  requestBody.token = md5(
    encodeURIComponent(SECRET_KEY + jsonToCustomString(requestBody) + SECRET_KEY)
  ).toUpperCase();

  return {
    url,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 - mmbWebBrowse - ios",
    },
    body: jsonToQueryString(requestBody),
  };
}

async function SiteCommand_parse(searchKey) {
  const url = "https://apapia-common.manmanbuy.com/SiteCommand/parse";
  const payload = { methodName: "commonMethod", searchKey };
  const opt = get_options(payload, url);
  return await httpRequest(opt);
}

// spbh jf_url V1
async function getItemBasicInfo_v1(link) {
  const url = "https://apapia-history-weblogic.manmanbuy.com/basic/getItemBasicInfo";
  const payload = { methodName: "getHistoryInfoJava", searchKey: link };
  const opt = get_options(payload, url);
  return await httpRequest(opt);
}

// spbh jf_url V2
async function getItemBasicInfo(stteId, link) {
  const url = "https://apapia-history-weblogic.manmanbuy.com/basic/v2/getItemBasicInfo";
  const payload = { methodName: "getHistoryInfoJava", searchKey: link, stteId };
  const opt = get_options(payload, url);
  return await httpRequest(opt);
}

async function share(spbh, jf_url) {
  const url = "https://apapia-history-weblogic.manmanbuy.com/app/share";
  const payload = { methodName: "trendJava", spbh, url: jf_url };
  const opt = get_options(payload, url);
  return await httpRequest(opt);
}

async function trendData(body) {
  const opt = {
    url: "https://apapia-history-weblogic.manmanbuy.com/h5/share/trendData",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 - mmbWebBrowse - ios",
    },
    body,
  };
  return await httpRequest(opt);
}

function getck() {
  const ck = $.getdata(manmanbuy_key);
  if (!ck) {
    $.msg($.name, "请先打开【慢慢买】APP", "请确保已成功获取ck");
    return null;
  }
  const Params = parseQueryString(ck);
  if (!Params?.c_mmbDevId) {
    $.msg($.name, "数据异常", "请联系脚本作者检查ck格式");
    return null;
  }
  $.log("慢慢买CK：", Params.c_mmbDevId);
  return Params;
}

async function httpRequest(options) {
  try {
    options = options.url ? options : { url: options };
    const _method = options?._method || ("body" in options ? "post" : "get");
    const _respType = options?._respType || "body";
    const _timeout = options?._timeout || 240000;
    const _http = [
      new Promise((_, reject) =>
        setTimeout(() => reject(`⛔️ 请求超时: ${options["url"]}`), _timeout)
      ),
      new Promise((resolve, reject) => {
        $[_method.toLowerCase()](options, (error, response, data) => {
          error && $.log($.toStr(error));
          if (_respType !== "all") {
            resolve($.toObj(response?.[_respType], response?.[_respType]));
          } else {
            resolve(response);
          }
        });
      }),
    ];
    return await Promise.race(_http);
  } catch (err) {
    $.logErr(err);
  }
}

function getParam(queryStr, paramName) {
  const params = new URLSearchParams(queryStr);
  return params.get(paramName);
}

function parseQueryString(queryString) {
  const jsonObject = {};
  const pairs = queryString.split("&");
  pairs.forEach((pair) => {
    const [key, value] = pair.split("=");
    jsonObject[decodeURIComponent(key)] = decodeURIComponent(value || "");
  });
  return jsonObject;
}

function jsonToQueryString(jsonObject) {
  return Object.keys(jsonObject)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(jsonObject[key])}`)
    .join("&");
}

function jsonToCustomString(jsonObject) {
  return Object.keys(jsonObject)
    .filter((key) => jsonObject[key] !== "" && key.toLowerCase() !== "token")
    .sort()
    .map((key) => `${key.toUpperCase()}${jsonObject[key].toUpperCase()}`)
    .join("");
}
