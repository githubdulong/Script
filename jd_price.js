/*
 * 脚本名称：京东比价
 * 使用说明：进入APP商品详情页面触发。
 * 支持版本：App V15.0.80（自行测试）
 * 脚本作者：小白脸
 
[Script]
京东比价 = type=http-response,pattern=^https:\/\/in\.m\.jd\.com\/product\/graphext\/\d+\.html,requires-body=1,max-size=0,binary-body-mode=0,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/jd_price.js,timeout=60
 
[MITM]
hostname = %APPEND% in.m.jd.com

*/

intCryptoJS();

Promise.withResolvers ||= function () {
  let resolve, reject;
  const promise = new this((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const http = (op) => {
  const { promise, resolve, reject } = Promise.withResolvers();

  this.$httpClient?.[op.method || "get"](op, (err, resp, data) =>
    err ? reject(err) : resolve(JSON.parse(data))
  );

  this.$task?.fetch(op).then(
    ({ body }) => resolve(JSON.parse(body)),
    ({ error }) => reject(error)
  );

  const timer = setTimeout(() => {
    reject(new Error("你超时了呀，我来盲猜一波，你没开直连"));
  }, 4 * 1000);

  return promise.finally(() => clearTimeout(timer));
};

const $prs = {
  get: this.$prefs?.valueForKey ?? $persistentStore.read,
  getJson: (key) => JSON.parse($prs.get(key), null, 4),
  set: (key, value) =>
    (this.$prefs?.setValueForKey ?? $persistentStore.write)(value, key),
  setJson: (key, obj) => $prs.set(key, JSON.stringify(obj)),
};

const $msg = (...a) => {
  const { $open, $copy, $media, ...r } = typeof a.at(-1) === "object" && a.pop();
  const [t = "", s = "", b = ""] = a;
  (this.$notify ??= $notification.post)(t, s, b, {
    action: $copy ? "clipboard" : "open-url",
    text: $copy,
    "update-pasteboard": $copy,
    clipboard: $copy,
    "open-url": $open,
    openUrl: $open,
    url: $open,
    mediaUrl: $media,
    "media-url": $media,
    ...r,
  });
};

const toDate = (t) => {
  const d = new Date(t - new Date().getTimezoneOffset() * 60000);
  return d.toISOString().split("T")[0];
};

const parseNumber = (input) => {
  const cleaned = `${input}`.replace(/[^0-9.-]/g, "");
  return parseFloat(cleaned);
};

const formatNumber = (num) => (Number.isInteger(num) ? num : num.toFixed(2));

const comparePrices = (a, b) => {
  const diff = formatNumber(parseNumber(a) - parseNumber(b));

  if (diff > 0) return `↑${diff}`;
  if (diff < 0) return `↓${-diff}`;
  return "●";
};

const priceHistoryTable = (data) => {
  if (data.err) return `<h2>${data.msg}</h2>`;

  const themeDetection = `
    <script>
      const setTimeBasedTheme = () => {
        const currentHour = new Date().getHours();
        const rootElement = document.documentElement;
        
        const isDarkTime = currentHour >= 19 || currentHour < 7;
        
        if (isDarkTime) {
          rootElement.setAttribute('data-theme', 'dark');
        } else {
          rootElement.setAttribute('data-theme', 'light');
        }
      }
      document.addEventListener('DOMContentLoaded', setTimeBasedTheme);
    </script>
  `;

  const css = `<style>
    /* Theme variables */
    :root {
      --background-color: #fff;
      --text-color: #262626;
      --secondary-text-color: #8c8c8c;
      --header-bg: #fafafa;
      --border-color: #f0f0f0;
      --hover-bg: #fafafa;
      --box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      --table-border: 2px solid #f5f5f5;
    }
    
    /* Dark theme variables */
    [data-theme="dark"] {
      --background-color: #1f1f1f;
      --text-color: #e6e6e6;
      --secondary-text-color: #a6a6a6;
      --header-bg: #2a2a2a;
      --border-color: #303030;
      --hover-bg: #2a2a2a;
      --box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      --table-border: 2px solid #303030;
    }

    .price-container {
      width: 100%;
      background: var(--background-color);
      transition: background 0.3s ease;
    }

    .price-table {
      width: 92%;
      margin: 0 auto;
      border-collapse: collapse;
      font-size: 13px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: var(--box-shadow);
      color: var(--text-color);
      transition: color 0.3s ease, box-shadow 0.3s ease;
    }

    .price-table th,
    .price-table td {
      padding: 14px 12px;
      text-align: center;
      border: 1px solid var(--border-color);
      transition: border 0.3s ease;
    }

    .table-header {
      background: var(--header-bg);
      border-bottom: var(--table-border);
      text-align: left;
      padding-left: 16px;
      transition: background 0.3s ease, border-bottom 0.3s ease;
    }

    .table-header h2 {
      margin: 0;
      text-align: left;
      font-size: 16px;
      font-weight: 500;
      color: var(--text-color);
      transition: color 0.3s ease;
    }

    .price-table th {
      background: var(--header-bg);
      color: var(--secondary-text-color);
      font-weight: normal;
      font-size: 13px;
      transition: background 0.3s ease, color 0.3s ease;
    }

    .price-table td {
      vertical-align: middle;
      transition: all 0.3s ease;
    }

    .price-table tr:hover td {
      background: var(--hover-bg);
      transition: background 0.3s ease;
    }

    .price-table td:first-child {
      color: var(--text-color);
      font-weight: 500;
      transition: color 0.3s ease;
    }

    .price-table td:nth-child(2) {
      color: var(--secondary-text-color);
      transition: color 0.3s ease;
    }

    .price-up td:nth-child(3),
    .price-up td:last-child {
      color: #ff4d4f;
    }

    .price-down td:nth-child(3),
    .price-down td:last-child {
      color: #52c41a;
    }

    .price-same td:nth-child(3),
    .price-same td:last-child {
      color: var(--secondary-text-color);
      transition: color 0.3s ease;
    }

    .price-table td:nth-child(3) {
      font-weight: 500;
      font-size: 14px;
    }

    .price-table td:last-child {
      font-size: 12px;
    }
  </style>`;

  let html = `
    ${css}
    ${themeDetection}
    <div class="price-container">
      <table class="price-table">
        <tr>
          <th colspan="4" class="table-header">
            <h2>${data.groupName}</h2>
          </th>
        </tr>
        <tr>
          <th>类型</th>
          <th>日期</th>
          <th>价格</th>
          <th>状态</th>
        </tr>`;

  data.atts.forEach((row) => {
    const statusClass = row.status?.includes("↑")
      ? "price-up"
      : row.status.includes("↓")
      ? "price-down"
      : "price-same";

    const td = Object.keys(row)
      .map((item) => `<td>${row[item]}</td>`)
      .join("");

    html += `
      <tr class="${statusClass}">
       ${td}
      </tr>`;
  });

  html += `</table></div>`;
  return html;
};

const getJdData = (body) => {
  const { jiagequshiyh } = body.single;
  const jiageStr = jiagequshiyh.replace(/,\s*\]/g, ']');
  const jiageData = JSON.parse(`[${jiageStr}]`).reverse().slice(0, 360);

  const { result } = jiageData.reduce(
    (acc, cur, index, arr) => {
      return acc
        .getMinNumber(cur)
        .getToday(index)
        .getLowestPrice(index, arr)
        .getHolidays(cur)
        .getHistPrices(++index);
    },
    {
      map: new Map([
        ["当前到手价", []],
        ["历史最低价", []],
        ["六一八价格", []],
        ["双十一价格", []],
      ]),

      price: Number.MAX_SAFE_INTEGER,
      todayPrice: null,
      time: null,

      get result() {
        return [...this.map].flatMap(([name, [date, price, status]]) =>
          date ? [{ name, date, price, status }] : []
        );
      },

      getToday(i) {
        if (i === 0) {
          this.todayPrice = this.price;
          this.storePriceInfo("当前到手价");
        }

        return this;
      },
      getLowestPrice(i, arr) {
        if (i === arr.length - 1) this.storePriceInfo("历史最低价");

        return this;
      },
      getHolidays([time, price]) {
        const holidays = ["11-11", "06-18"];
        const date = toDate(time);
        const holiday = holidays.find((h) => date.endsWith(h));
        if (holiday) {
          const title = holiday === "11-11" ? "双十一价格" : "六一八价格";
          this.storePriceInfo(`${title}`, date, `¥${price.toFixed(2)}`);
        }

        return this;
      },
      getHistPrices(i) {
        if ([30, 60, 90, 180, 360].includes(i))
          this.storePriceInfo(`${i}天最低`);

        return this;
      },
      getMinNumber([time, price]) {
        if (price < parseNumber(this.price)) {
          this.price = `¥${price.toFixed(2)}`;
          this.time = toDate(time);
        }

        return this;
      },
      storePriceInfo(key, date = this.time, price = this.price) {
        const value = [date, price, comparePrices(this.todayPrice, price)];
        this.map.set(key, value);
      },
    }
  );

  return result;
};

const getmmCK = () => {
  const ck =  $prs.get("慢慢买CK");
  if (ck) return ck;
  throw new Error("未获取ck，请先打开【慢慢买】APP--我的, 获取ck");
};

const getPriceData = async () => {
  const op = (share_url) => {
  const rest_body = {
    methodName: "getHistoryTrend",
    p_url: encodeURIComponent(share_url),
    t: Date.now().toString(),
    c_appver: "4.8.3.1",
    c_mmbDevId: getmmCK(),
  };
  rest_body.token = md5(
    encodeURIComponent(
      "3E41D1331F5DDAFCD0A38FE2D52FF66F" +
        jsonToCustomString(rest_body) +
        "3E41D1331F5DDAFCD0A38FE2D52FF66F"
    )
  ).toUpperCase();
  return {
		method: "post",
    url: "https://apapia-history.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 13_1_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 - mmbWebBrowse - ios",
    },
    body: jsonToQueryString(rest_body),
  };
};
  
  const body = await http(op(`https://item.m.jd.com/product/${$request.url.match(
      /\d+/
    )}.html`));

  if (body.err) return body;

  return {
    groupName: "历史比价",
    atts: getJdData(body),
  };
};

getPriceData()
  .then((priceData) => {
    let { body, headers } = $response;
    const tableHTML = priceHistoryTable(priceData);

    body = body.replace("<body>", `<body>${tableHTML}`);

    $done({ body, headers });
  })
  .catch((e) => {
    console.log(e.toString());
    console.log(e.stack)
    $msg(e.toString());
    $done({});
  });
  
  
function parseQueryString(queryString) {const jsonObject = {};const pairs = queryString.split('&');pairs.forEach(pair => {const [key, value] = pair.split('=');jsonObject[decodeURIComponent(key)] = decodeURIComponent(value || '');});return jsonObject;}

  
function jsonToQueryString(jsonObject) {return Object.keys(jsonObject).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(jsonObject[key])}`).join('&');}


function jsonToCustomString(jsonObject){return Object.keys(jsonObject).filter(key=>jsonObject[key]!==''&&key.toLowerCase()!=='token').sort().map(key=>`${key.toUpperCase()}${jsonObject[key].toUpperCase()}`).join('');}


function intCryptoJS(){CryptoJS=function(t,r){var n;if("undefined"!=typeof window&&window.crypto&&(n=window.crypto),"undefined"!=typeof self&&self.crypto&&(n=self.crypto),"undefined"!=typeof globalThis&&globalThis.crypto&&(n=globalThis.crypto),!n&&"undefined"!=typeof window&&window.msCrypto&&(n=window.msCrypto),!n&&"undefined"!=typeof global&&global.crypto&&(n=global.crypto),!n&&"function"==typeof require)try{n=require("crypto")}catch(t){}var e=function(){if(n){if("function"==typeof n.getRandomValues)try{return n.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof n.randomBytes)try{return n.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")},i=Object.create||function(){function t(){}return function(r){var n;return t.prototype=r,n=new t,t.prototype=null,n}}(),o={},a=o.lib={},s=a.Base={extend:function(t){var r=i(this);return t&&r.mixIn(t),r.hasOwnProperty("init")&&this.init!==r.init||(r.init=function(){r.$super.init.apply(this,arguments)}),r.init.prototype=r,r.$super=this,r},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var r in t)t.hasOwnProperty(r)&&(this[r]=t[r]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},c=a.WordArray=s.extend({init:function(t,r){t=this.words=t||[],this.sigBytes=null!=r?r:4*t.length},toString:function(t){return(t||f).stringify(this)},concat:function(t){var r=this.words,n=t.words,e=this.sigBytes,i=t.sigBytes;if(this.clamp(),e%4)for(var o=0;o<i;o++){var a=n[o>>>2]>>>24-o%4*8&255;r[e+o>>>2]|=a<<24-(e+o)%4*8}else for(var s=0;s<i;s+=4)r[e+s>>>2]=n[s>>>2];return this.sigBytes+=i,this},clamp:function(){var r=this.words,n=this.sigBytes;r[n>>>2]&=4294967295<<32-n%4*8,r.length=t.ceil(n/4)},clone:function(){var t=s.clone.call(this);return t.words=this.words.slice(0),t},random:function(r){var n,i=[],o=function(r){r=r;var n=987654321,e=4294967295;return function(){var i=((n=36969*(65535&n)+(n>>16)&e)<<16)+(r=18e3*(65535&r)+(r>>16)&e)&e;return i/=4294967296,(i+=.5)*(t.random()>.5?1:-1)}},a=!1;try{e(),a=!0}catch(t){}for(var s,u=0;u<r;u+=4)a?i.push(e()):(s=987654071*(n=o(4294967296*(s||t.random())))(),i.push(4294967296*n()|0));return new c.init(i,r)}}),u=o.enc={},f=u.Hex={stringify:function(t){for(var r=t.words,n=t.sigBytes,e=[],i=0;i<n;i++){var o=r[i>>>2]>>>24-i%4*8&255;e.push((o>>>4).toString(16)),e.push((15&o).toString(16))}return e.join("")},parse:function(t){for(var r=t.length,n=[],e=0;e<r;e+=2)n[e>>>3]|=parseInt(t.substr(e,2),16)<<24-e%8*4;return new c.init(n,r/2)}},h=u.Latin1={stringify:function(t){for(var r=t.words,n=t.sigBytes,e=[],i=0;i<n;i++){var o=r[i>>>2]>>>24-i%4*8&255;e.push(String.fromCharCode(o))}return e.join("")},parse:function(t){for(var r=t.length,n=[],e=0;e<r;e++)n[e>>>2]|=(255&t.charCodeAt(e))<<24-e%4*8;return new c.init(n,r)}},p=u.Utf8={stringify:function(t){try{return decodeURIComponent(escape(h.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return h.parse(unescape(encodeURIComponent(t)))}},d=a.BufferedBlockAlgorithm=s.extend({reset:function(){this._data=new c.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=p.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(r){var n,e=this._data,i=e.words,o=e.sigBytes,a=this.blockSize,s=o/(4*a),u=(s=r?t.ceil(s):t.max((0|s)-this._minBufferSize,0))*a,f=t.min(4*u,o);if(u){for(var h=0;h<u;h+=a)this._doProcessBlock(i,h);n=i.splice(0,u),e.sigBytes-=f}return new c.init(n,f)},clone:function(){var t=s.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),l=(a.Hasher=d.extend({cfg:s.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){d.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(r,n){return new t.init(n).finalize(r)}},_createHmacHelper:function(t){return function(r,n){return new l.HMAC.init(t,n).finalize(r)}}}),o.algo={});return o}(Math);!function(t){var r=CryptoJS,n=r.lib,e=n.WordArray,i=n.Hasher,o=r.algo,a=[];!function(){for(var r=0;r<64;r++)a[r]=4294967296*t.abs(t.sin(r+1))|0}();var s=o.MD5=i.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(t,r){for(var n=0;n<16;n++){var e=r+n,i=t[e];t[e]=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8)}var o=this._hash.words,s=t[r+0],p=t[r+1],d=t[r+2],l=t[r+3],y=t[r+4],v=t[r+5],g=t[r+6],w=t[r+7],_=t[r+8],m=t[r+9],B=t[r+10],b=t[r+11],C=t[r+12],S=t[r+13],x=t[r+14],A=t[r+15],H=o[0],z=o[1],M=o[2],D=o[3];z=h(z=h(z=h(z=h(z=f(z=f(z=f(z=f(z=u(z=u(z=u(z=u(z=c(z=c(z=c(z=c(z,M=c(M,D=c(D,H=c(H,z,M,D,s,7,a[0]),z,M,p,12,a[1]),H,z,d,17,a[2]),D,H,l,22,a[3]),M=c(M,D=c(D,H=c(H,z,M,D,y,7,a[4]),z,M,v,12,a[5]),H,z,g,17,a[6]),D,H,w,22,a[7]),M=c(M,D=c(D,H=c(H,z,M,D,_,7,a[8]),z,M,m,12,a[9]),H,z,B,17,a[10]),D,H,b,22,a[11]),M=c(M,D=c(D,H=c(H,z,M,D,C,7,a[12]),z,M,S,12,a[13]),H,z,x,17,a[14]),D,H,A,22,a[15]),M=u(M,D=u(D,H=u(H,z,M,D,p,5,a[16]),z,M,g,9,a[17]),H,z,b,14,a[18]),D,H,s,20,a[19]),M=u(M,D=u(D,H=u(H,z,M,D,v,5,a[20]),z,M,B,9,a[21]),H,z,A,14,a[22]),D,H,y,20,a[23]),M=u(M,D=u(D,H=u(H,z,M,D,m,5,a[24]),z,M,x,9,a[25]),H,z,l,14,a[26]),D,H,_,20,a[27]),M=u(M,D=u(D,H=u(H,z,M,D,S,5,a[28]),z,M,d,9,a[29]),H,z,w,14,a[30]),D,H,C,20,a[31]),M=f(M,D=f(D,H=f(H,z,M,D,v,4,a[32]),z,M,_,11,a[33]),H,z,b,16,a[34]),D,H,x,23,a[35]),M=f(M,D=f(D,H=f(H,z,M,D,p,4,a[36]),z,M,y,11,a[37]),H,z,w,16,a[38]),D,H,B,23,a[39]),M=f(M,D=f(D,H=f(H,z,M,D,S,4,a[40]),z,M,s,11,a[41]),H,z,l,16,a[42]),D,H,g,23,a[43]),M=f(M,D=f(D,H=f(H,z,M,D,m,4,a[44]),z,M,C,11,a[45]),H,z,A,16,a[46]),D,H,d,23,a[47]),M=h(M,D=h(D,H=h(H,z,M,D,s,6,a[48]),z,M,w,10,a[49]),H,z,x,15,a[50]),D,H,v,21,a[51]),M=h(M,D=h(D,H=h(H,z,M,D,C,6,a[52]),z,M,l,10,a[53]),H,z,B,15,a[54]),D,H,p,21,a[55]),M=h(M,D=h(D,H=h(H,z,M,D,_,6,a[56]),z,M,A,10,a[57]),H,z,g,15,a[58]),D,H,S,21,a[59]),M=h(M,D=h(D,H=h(H,z,M,D,y,6,a[60]),z,M,b,10,a[61]),H,z,d,15,a[62]),D,H,m,21,a[63]),o[0]=o[0]+H|0,o[1]=o[1]+z|0,o[2]=o[2]+M|0,o[3]=o[3]+D|0},_doFinalize:function(){var r=this._data,n=r.words,e=8*this._nDataBytes,i=8*r.sigBytes;n[i>>>5]|=128<<24-i%32;var o=t.floor(e/4294967296),a=e;n[15+(i+64>>>9<<4)]=16711935&(o<<8|o>>>24)|4278255360&(o<<24|o>>>8),n[14+(i+64>>>9<<4)]=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),r.sigBytes=4*(n.length+1),this._process();for(var s=this._hash,c=s.words,u=0;u<4;u++){var f=c[u];c[u]=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8)}return s},clone:function(){var t=i.clone.call(this);return t._hash=this._hash.clone(),t}});function c(t,r,n,e,i,o,a){var s=t+(r&n|~r&e)+i+a;return(s<<o|s>>>32-o)+r}function u(t,r,n,e,i,o,a){var s=t+(r&e|n&~e)+i+a;return(s<<o|s>>>32-o)+r}function f(t,r,n,e,i,o,a){var s=t+(r^n^e)+i+a;return(s<<o|s>>>32-o)+r}function h(t,r,n,e,i,o,a){var s=t+(n^(r|~e))+i+a;return(s<<o|s>>>32-o)+r}r.MD5=i._createHelper(s),r.HmacMD5=i._createHmacHelper(s)}(Math),function(){var t=CryptoJS,r=t.lib.WordArray;t.enc.Base64={stringify:function(t){var r=t.words,n=t.sigBytes,e=this._map;t.clamp();for(var i=[],o=0;o<n;o+=3)for(var a=(r[o>>>2]>>>24-o%4*8&255)<<16|(r[o+1>>>2]>>>24-(o+1)%4*8&255)<<8|r[o+2>>>2]>>>24-(o+2)%4*8&255,s=0;s<4&&o+.75*s<n;s++)i.push(e.charAt(a>>>6*(3-s)&63));var c=e.charAt(64);if(c)for(;i.length%4;)i.push(c);return i.join("")},parse:function(t){var n=t.length,e=this._map,i=this._reverseMap;if(!i){i=this._reverseMap=[];for(var o=0;o<e.length;o++)i[e.charCodeAt(o)]=o}var a=e.charAt(64);if(a){var s=t.indexOf(a);-1!==s&&(n=s)}return function(t,n,e){for(var i=[],o=0,a=0;a<n;a++)if(a%4){var s=e[t.charCodeAt(a-1)]<<a%4*2,c=e[t.charCodeAt(a)]>>>6-a%4*2;i[o>>>2]|=(s|c)<<24-o%4*8,o++}return r.create(i,o)}(t,n,i)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}();};
function md5(word){return CryptoJS.MD5(word).toString();}
