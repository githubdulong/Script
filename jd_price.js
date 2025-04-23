/*
 * 脚本名称：京东比价 折线图
 * 使用说明：进入APP商品详情页面触发。
 * 支持版本：App V15.0.80（自行测试）
 * 脚本作者：小白脸
 * 特别鸣谢：数据逆向@苍井灰灰
 
[Script]
慢慢买 CK = type=http-request,pattern=^https?:\/\/apapia-sqk-weblogic\.manmanbuy\.com/baoliao\/center\/menu,requires-body=1,max-size=0,binary-body-mode=0,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/MmmCK.js
京东比价 = type=http-response,pattern=^https:\/\/in\.m\.jd\.com\/product\/graphext\/\d+\.html,requires-body=1,max-size=0,binary-body-mode=0,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/jd_price.js,timeout=30
[MITM]
hostname = %APPEND% in.m.jd.com, apapia-sqk-weblogic.manmanbuy.com
*/

const { $log, $msg, $prs, $http, md5, jsonToCustomString, jsonToQueryString } =
  init();

const priceHistoryTable = (data) => {
  const themeDetection = `
    <script>
      const setTimeBasedTheme = () => {
      const rootElement = document.documentElement;
        
        if (isDark) {
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

const Table = (result) => {
  const toDate = (t = Date.now()) => {
    const d = new Date(t - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().split("T")[0];
  };

  const getJdData = (data) => {
    return data.flatMap(({ ShowName, Difference, Price, Date }) => {
      const re = /历史最高|常购价/;
      if (re.test(ShowName)) return [];

      return [
        {
          name: ShowName,
          date: Date || toDate(),
          price: Price,
          status: Difference.replace("-", "●"),
        },
      ];
    });
  };

  const { ListPriceDetail } = result.priceRemark;
  return priceHistoryTable({
    groupName: "历史比价",
    atts: getJdData(ListPriceDetail),
  });
};

const JdLine = (data) => {
  return `
<script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js"></script>
    <style>
        /* 基础样式 */
        .price-trend {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px 2px;
            transition: background-color 0.3s;
        }

        .price-trend__chart {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            padding: 15px 2px;
            margin-bottom: 20px;
            transition: background-color 0.3s;
        }

        .price-trend__title {
            margin: 0 0 15px;
            text-align: left;
            color: #333;
            transition: color 0.3s;
            font-size: 1rem;
            font-weight: 600;
            padding-bottom: 8px;
            border-bottom: 2px solid #eaeaea;
            position: relative;
        }

        .price-trend--dark .price-trend__title {
            color: #fff;
            border-bottom-color: #333;
        }

        .price-trend__canvas {
            width: 100%;
            height: 400px;
        }

        /* 暗色主题 */
        .price-trend--dark {
            background-color: #1a1a1a;
            color: #fff;
        }

        .price-trend--dark .price-trend__chart {
            background-color: #242424;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .price-trend--dark .price-trend__title {
            color: #fff;
        }

        /* 移动端适配 */
        @media (max-width: 600px) {
            .price-trend {
                padding: 10px;
            }

            .price-trend__canvas {
                height: 400px;
            }
        }
    </style>

    <div class="price-trend">
        <div class="price-trend__chart">
            <h2 class="price-trend__title">价格走势</h2>
            <div class="price-trend__canvas" id="chart-container"></div>
        </div>
    </div>

    <script>
        const priceChart = document.querySelector('.price-trend');
        priceChart.classList.toggle('price-trend--dark', isDark);

        const chartDom = document.getElementById('chart-container');
        const myChart = echarts.init(chartDom);
        const eventInfo = document.getElementById('event-info');

        const {
            trendData: { info, currentPrice },
        } = ${JSON.stringify(data)};
        const DATA = info.reverse().slice(1);
        const uniquePrices = [...new Set(DATA.map(item => Math.floor(item.actualPrice)))].sort((a, b) => a - b);

        // 生成数据
        const generateData = (start) => {
            return DATA.slice(0, start).map(({ date, originalPrice, actualPrice, discounts }, i) => {
                const title = date.split(" ")[0] + "<br>现价: ¥" + currentPrice;
                const message = discounts
                    ? title + "<br>原价: ¥" + Math.floor(originalPrice) + "<br>售价: ¥" + Math.floor(actualPrice) + "<br>" + discounts
                    : title + "<br>售价: ¥" + Math.floor(actualPrice);

                return {
                    value: [++i, uniquePrices.indexOf(Math.floor(actualPrice)) + 1],
                    message,
                };
            });
        };

        const getDateRanges = (input) => {
            if (!isNaN(input)) return input;

            const map = {
                '618价': "06-18",
                '双11价': "11-11"
            }
            const day = DATA.findIndex(item => item.date.includes(map[input])) + 1;
            return day !== -1 && day;
        }

        const series = [360, 180, 60, 30, "618价", "双11价"].flatMap((input) => {
            const days = getDateRanges(input)

            return days ? [{
                name: isNaN(input) ? input : (days + "天"),
                type: 'line',
                data: generateData(days),
                smooth: true,
                symbolSize: 0,
                lineStyle: {
                    width: 1,
                    join: 'round'
                },
                itemStyle: {
                    borderWidth: 1,
                },
                emphasis: {
                    scale: true,
                    symbolSize: 1,
                    focus: 'series',
                    itemStyle: {
                        borderWidth: 6,
                    }
                },
                areaStyle: {
                    opacity: 0.1,
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: isDark ? '#f4e925' : '#37A2DA'
                        },
                        {
                            offset: 1,
                            color: 'rgba(255,255,255,0.1)'
                        }
                    ])
                }
            }] : [];
        })

        // 配置项
        const option = {
            backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
            color: isDark ?
                [
                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#f4e925' },
                        { offset: 1, color: '#f4e92577' }
                    ]),
                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#00ffb3' },
                        { offset: 1, color: '#00ffb377' }
                    ]),
                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#00ffff' },
                        { offset: 1, color: '#00ffff77' }
                    ]),
                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#ff7070' },
                        { offset: 1, color: '#ff707077' }
                    ]),
                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#c23531' },
                        { offset: 1, color: '#c2353177' }
                    ]),
                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#61a0a8' },
                        { offset: 1, color: '#61a0a877' }
                    ])
                ] :
                ['#37A2DA', '#32C5E9', '#67E0E3', '#9FE6B8', '#FFDB5C', '#FF9F7F'],
            tooltip: {
                trigger: 'axis',
                confine: true,
                formatter(params) {
                    const { value, message } = params[0].data;
                    return message ?? value
                },
                backgroundColor: isDark ? 'rgba(50,50,50,0.9)' : '#fff',
                textStyle: {
                    color: isDark ? '#fff' : '#333',
                    fontSize: 9,
                },
                borderColor: isDark ? '#333' : '#ccc'
            },
            legend: {
                selectedMode: 'single',
                bottom: "0px",
                itemWidth: 8,        
                itemHeight: 8,       
                itemGap: 15,  
                textStyle: {
                    color: isDark ? '#e0e0e0' : '#333',
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '10%',
                top: '5%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                max({ max }) {
                    return max;
                },
                interval:  Math.ceil(series[0].data.length / 6),
                min: 1,
                axisLabel: {
                    color: isDark ? '#e0e0e0' : '#333',
                    fontSize: 9,
                    formatter(value) {
                        const { date } = DATA[value - 1]
                        return date.split(" ")[0].split("-").slice(1).join("-");
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: isDark ? '#333' : '#ccc'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: isDark ? '#333' : '#eee'
                    }
                }
            },
            yAxis: {
                type: 'value',
                max() {
                  const { length } = uniquePrices;
                  return length <= 3 ? +length + 1 : length;
                },
                min: 0,
                interval: 1,
                axisPointer: {
                    show: false,
                },
                axisLabel: {
                    color: isDark ? '#e0e0e0' : '#333',
                                        fontSize: 9,
                    formatter(value) {
                        return value && (uniquePrices[value - 1] ?? "MAX");
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: isDark ? '#333' : '#ccc'
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: isDark ? '#333' : '#eee'
                    }
                }
            },
            series,
        };


        // 应用配置项
        myChart.setOption(option);

        //监听折线图切换 歪门斜道的法子
myChart.on('legendselectchanged', ({ name }) => {
  const max = series.find(i => i.name === name).data.length;
  myChart.setOption({
    xAxis: {
        interval: Math.ceil(max / 6),
      },
  });
  
   throw "";
});
    
        // 监听窗口大小变化，调整图表大小
        window.addEventListener('resize', function () {
            myChart.resize();

            // 根据窗口宽度调整X轴标签旋转角度
            if (window.innerWidth < 500) {
                myChart.setOption({
                    xAxis: {
                        axisLabel: {
                            rotate: 45
                        }
                    }
                });
            } else {
                myChart.setOption({
                    xAxis: {
                        axisLabel: {
                            rotate: 0
                        }
                    }
                });
            }
        });

        // 添加触摸事件支持
        chartDom.addEventListener('touchstart', function (e) {
            // 防止滚动冲突
            e.preventDefault();
        });
    </script>`;
};



const getMMdata = (id) => {
  const getmmCK = () => {
    const ck = $prs.get("慢慢买CK");
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
    $http(reqOpts({ url, buildBody }))
      .then((resp) => {
				const body = resp.json();
        if (!url.endsWith("trendData") && body.code !== 2000) throw new Error(`${url}：${body.msg}`);
        return body;
      });

  return  apiCall(
            "https://apapia-history-weblogic.manmanbuy.com/basic/getItemBasicInfo",
        (set) =>
          set({
            methodName: "getHistoryInfoJava",
            searchKey: `https://item.jd.com/${id}.html`,
          })
      )
    .then(({ result: { spbh, url } }) =>
      apiCall(
        "https://apapia-history-weblogic.manmanbuy.com/app/share",
        (set) =>
          set({
            methodName: "trendJava",
            spbh,
            url,
          })
      )
    )
    .then(({ data }) =>
      apiCall(
        "https://apapia-history-weblogic.manmanbuy.com/h5/share/trendData",
        () => data.split("?")[1]
      )
    )
};

const Render = {
  inject(html) {
    const { body } = $response;
    $response.body = body.replace("<body>", `<body>${html}`);
    return this;
  },
  done() {
    const { body, headers } = $response;
    $done({ body, headers });
  },
};

const main = async () => {
  try {
    const ID = $request.url.match(/\d+/);
    const { msg, code, result } = await getMMdata(ID);
    if (code !== 2000) {
      Render.inject(`<h2>${msg}</h2>`).done();
      return;
    }
    
    const hour = new Date().getHours();
    const isDark = hour >= 20 || hour < 6;

    Render
    .inject(Table(result))
    .inject(JdLine(result))
    .inject(`<script>isDark=${isDark}</script>`)
    .done();
  } catch (e) {
    $log(e);
    $msg(e);
    $done({});
  }
};

main();




function init(){CryptoJS=function(t,r){var n;if("undefined"!=typeof window&&window.crypto&&(n=window.crypto),"undefined"!=typeof self&&self.crypto&&(n=self.crypto),"undefined"!=typeof globalThis&&globalThis.crypto&&(n=globalThis.crypto),!n&&"undefined"!=typeof window&&window.msCrypto&&(n=window.msCrypto),!n&&"undefined"!=typeof global&&global.crypto&&(n=global.crypto),!n&&"function"==typeof require)try{n=require("crypto")}catch(t){}var e=function(){if(n){if("function"==typeof n.getRandomValues)try{return n.getRandomValues(new Uint32Array(1))[0]}catch(t){}if("function"==typeof n.randomBytes)try{return n.randomBytes(4).readInt32LE()}catch(t){}}throw new Error("Native crypto module could not be used to get secure random number.")},i=Object.create||function(){function t(){}return function(r){var n;return t.prototype=r,n=new t,t.prototype=null,n}}(),o={},a=o.lib={},s=a.Base={extend:function(t){var r=i(this);return t&&r.mixIn(t),r.hasOwnProperty("init")&&this.init!==r.init||(r.init=function(){r.$super.init.apply(this,arguments)}),r.init.prototype=r,r.$super=this,r},create:function(){var t=this.extend();return t.init.apply(t,arguments),t},init:function(){},mixIn:function(t){for(var r in t)t.hasOwnProperty(r)&&(this[r]=t[r]);t.hasOwnProperty("toString")&&(this.toString=t.toString)},clone:function(){return this.init.prototype.extend(this)}},c=a.WordArray=s.extend({init:function(t,r){t=this.words=t||[],this.sigBytes=null!=r?r:4*t.length},toString:function(t){return(t||f).stringify(this)},concat:function(t){var r=this.words,n=t.words,e=this.sigBytes,i=t.sigBytes;if(this.clamp(),e%4)for(var o=0;o<i;o++){var a=n[o>>>2]>>>24-o%4*8&255;r[e+o>>>2]|=a<<24-(e+o)%4*8}else for(var s=0;s<i;s+=4)r[e+s>>>2]=n[s>>>2];return this.sigBytes+=i,this},clamp:function(){var r=this.words,n=this.sigBytes;r[n>>>2]&=4294967295<<32-n%4*8,r.length=t.ceil(n/4)},clone:function(){var t=s.clone.call(this);return t.words=this.words.slice(0),t},random:function(r){var n,i=[],o=function(r){r=r;var n=987654321,e=4294967295;return function(){var i=((n=36969*(65535&n)+(n>>16)&e)<<16)+(r=18e3*(65535&r)+(r>>16)&e)&e;return i/=4294967296,(i+=.5)*(t.random()>.5?1:-1)}},a=!1;try{e(),a=!0}catch(t){}for(var s,u=0;u<r;u+=4)a?i.push(e()):(s=987654071*(n=o(4294967296*(s||t.random())))(),i.push(4294967296*n()|0));return new c.init(i,r)}}),u=o.enc={},f=u.Hex={stringify:function(t){for(var r=t.words,n=t.sigBytes,e=[],i=0;i<n;i++){var o=r[i>>>2]>>>24-i%4*8&255;e.push((o>>>4).toString(16)),e.push((15&o).toString(16))}return e.join("")},parse:function(t){for(var r=t.length,n=[],e=0;e<r;e+=2)n[e>>>3]|=parseInt(t.substr(e,2),16)<<24-e%8*4;return new c.init(n,r/2)}},h=u.Latin1={stringify:function(t){for(var r=t.words,n=t.sigBytes,e=[],i=0;i<n;i++){var o=r[i>>>2]>>>24-i%4*8&255;e.push(String.fromCharCode(o))}return e.join("")},parse:function(t){for(var r=t.length,n=[],e=0;e<r;e++)n[e>>>2]|=(255&t.charCodeAt(e))<<24-e%4*8;return new c.init(n,r)}},p=u.Utf8={stringify:function(t){try{return decodeURIComponent(escape(h.stringify(t)))}catch(t){throw new Error("Malformed UTF-8 data")}},parse:function(t){return h.parse(unescape(encodeURIComponent(t)))}},d=a.BufferedBlockAlgorithm=s.extend({reset:function(){this._data=new c.init,this._nDataBytes=0},_append:function(t){"string"==typeof t&&(t=p.parse(t)),this._data.concat(t),this._nDataBytes+=t.sigBytes},_process:function(r){var n,e=this._data,i=e.words,o=e.sigBytes,a=this.blockSize,s=o/(4*a),u=(s=r?t.ceil(s):t.max((0|s)-this._minBufferSize,0))*a,f=t.min(4*u,o);if(u){for(var h=0;h<u;h+=a)this._doProcessBlock(i,h);n=i.splice(0,u),e.sigBytes-=f}return new c.init(n,f)},clone:function(){var t=s.clone.call(this);return t._data=this._data.clone(),t},_minBufferSize:0}),l=(a.Hasher=d.extend({cfg:s.extend(),init:function(t){this.cfg=this.cfg.extend(t),this.reset()},reset:function(){d.reset.call(this),this._doReset()},update:function(t){return this._append(t),this._process(),this},finalize:function(t){return t&&this._append(t),this._doFinalize()},blockSize:16,_createHelper:function(t){return function(r,n){return new t.init(n).finalize(r)}},_createHmacHelper:function(t){return function(r,n){return new l.HMAC.init(t,n).finalize(r)}}}),o.algo={});return o}(Math);!function(t){var r=CryptoJS,n=r.lib,e=n.WordArray,i=n.Hasher,o=r.algo,a=[];!function(){for(var r=0;r<64;r++)a[r]=4294967296*t.abs(t.sin(r+1))|0}();var s=o.MD5=i.extend({_doReset:function(){this._hash=new e.init([1732584193,4023233417,2562383102,271733878])},_doProcessBlock:function(t,r){for(var n=0;n<16;n++){var e=r+n,i=t[e];t[e]=16711935&(i<<8|i>>>24)|4278255360&(i<<24|i>>>8)}var o=this._hash.words,s=t[r+0],p=t[r+1],d=t[r+2],l=t[r+3],y=t[r+4],v=t[r+5],g=t[r+6],w=t[r+7],_=t[r+8],m=t[r+9],B=t[r+10],b=t[r+11],C=t[r+12],S=t[r+13],x=t[r+14],A=t[r+15],H=o[0],z=o[1],M=o[2],D=o[3];z=h(z=h(z=h(z=h(z=f(z=f(z=f(z=f(z=u(z=u(z=u(z=u(z=c(z=c(z=c(z=c(z,M=c(M,D=c(D,H=c(H,z,M,D,s,7,a[0]),z,M,p,12,a[1]),H,z,d,17,a[2]),D,H,l,22,a[3]),M=c(M,D=c(D,H=c(H,z,M,D,y,7,a[4]),z,M,v,12,a[5]),H,z,g,17,a[6]),D,H,w,22,a[7]),M=c(M,D=c(D,H=c(H,z,M,D,_,7,a[8]),z,M,m,12,a[9]),H,z,B,17,a[10]),D,H,b,22,a[11]),M=c(M,D=c(D,H=c(H,z,M,D,C,7,a[12]),z,M,S,12,a[13]),H,z,x,17,a[14]),D,H,A,22,a[15]),M=u(M,D=u(D,H=u(H,z,M,D,p,5,a[16]),z,M,g,9,a[17]),H,z,b,14,a[18]),D,H,s,20,a[19]),M=u(M,D=u(D,H=u(H,z,M,D,v,5,a[20]),z,M,B,9,a[21]),H,z,A,14,a[22]),D,H,y,20,a[23]),M=u(M,D=u(D,H=u(H,z,M,D,m,5,a[24]),z,M,x,9,a[25]),H,z,l,14,a[26]),D,H,_,20,a[27]),M=u(M,D=u(D,H=u(H,z,M,D,S,5,a[28]),z,M,d,9,a[29]),H,z,w,14,a[30]),D,H,C,20,a[31]),M=f(M,D=f(D,H=f(H,z,M,D,v,4,a[32]),z,M,_,11,a[33]),H,z,b,16,a[34]),D,H,x,23,a[35]),M=f(M,D=f(D,H=f(H,z,M,D,p,4,a[36]),z,M,y,11,a[37]),H,z,w,16,a[38]),D,H,B,23,a[39]),M=f(M,D=f(D,H=f(H,z,M,D,S,4,a[40]),z,M,s,11,a[41]),H,z,l,16,a[42]),D,H,g,23,a[43]),M=f(M,D=f(D,H=f(H,z,M,D,m,4,a[44]),z,M,C,11,a[45]),H,z,A,16,a[46]),D,H,d,23,a[47]),M=h(M,D=h(D,H=h(H,z,M,D,s,6,a[48]),z,M,w,10,a[49]),H,z,x,15,a[50]),D,H,v,21,a[51]),M=h(M,D=h(D,H=h(H,z,M,D,C,6,a[52]),z,M,l,10,a[53]),H,z,B,15,a[54]),D,H,p,21,a[55]),M=h(M,D=h(D,H=h(H,z,M,D,_,6,a[56]),z,M,A,10,a[57]),H,z,g,15,a[58]),D,H,S,21,a[59]),M=h(M,D=h(D,H=h(H,z,M,D,y,6,a[60]),z,M,b,10,a[61]),H,z,d,15,a[62]),D,H,m,21,a[63]),o[0]=o[0]+H|0,o[1]=o[1]+z|0,o[2]=o[2]+M|0,o[3]=o[3]+D|0},_doFinalize:function(){var r=this._data,n=r.words,e=8*this._nDataBytes,i=8*r.sigBytes;n[i>>>5]|=128<<24-i%32;var o=t.floor(e/4294967296),a=e;n[15+(i+64>>>9<<4)]=16711935&(o<<8|o>>>24)|4278255360&(o<<24|o>>>8),n[14+(i+64>>>9<<4)]=16711935&(a<<8|a>>>24)|4278255360&(a<<24|a>>>8),r.sigBytes=4*(n.length+1),this._process();for(var s=this._hash,c=s.words,u=0;u<4;u++){var f=c[u];c[u]=16711935&(f<<8|f>>>24)|4278255360&(f<<24|f>>>8)}return s},clone:function(){var t=i.clone.call(this);return t._hash=this._hash.clone(),t}});function c(t,r,n,e,i,o,a){var s=t+(r&n|~r&e)+i+a;return(s<<o|s>>>32-o)+r}function u(t,r,n,e,i,o,a){var s=t+(r&e|n&~e)+i+a;return(s<<o|s>>>32-o)+r}function f(t,r,n,e,i,o,a){var s=t+(r^n^e)+i+a;return(s<<o|s>>>32-o)+r}function h(t,r,n,e,i,o,a){var s=t+(n^(r|~e))+i+a;return(s<<o|s>>>32-o)+r}r.MD5=i._createHelper(s),r.HmacMD5=i._createHmacHelper(s)}(Math),function(){var t=CryptoJS,r=t.lib.WordArray;t.enc.Base64={stringify:function(t){var r=t.words,n=t.sigBytes,e=this._map;t.clamp();for(var i=[],o=0;o<n;o+=3)for(var a=(r[o>>>2]>>>24-o%4*8&255)<<16|(r[o+1>>>2]>>>24-(o+1)%4*8&255)<<8|r[o+2>>>2]>>>24-(o+2)%4*8&255,s=0;s<4&&o+.75*s<n;s++)i.push(e.charAt(a>>>6*(3-s)&63));var c=e.charAt(64);if(c)for(;i.length%4;)i.push(c);return i.join("")},parse:function(t){var n=t.length,e=this._map,i=this._reverseMap;if(!i){i=this._reverseMap=[];for(var o=0;o<e.length;o++)i[e.charCodeAt(o)]=o}var a=e.charAt(64);if(a){var s=t.indexOf(a);-1!==s&&(n=s)}return function(t,n,e){for(var i=[],o=0,a=0;a<n;a++)if(a%4){var s=e[t.charCodeAt(a-1)]<<a%4*2,c=e[t.charCodeAt(a)]>>>6-a%4*2;i[o>>>2]|=(s|c)<<24-o%4*8,o++}return r.create(i,o)}(t,n,i)},_map:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="}}();
  
function md5(word){return CryptoJS.MD5(word).toString();}
  
function jsonToQueryString(jsonObject) {return Object.keys(jsonObject).map(key => `${encodeURIComponent(key)}=${encodeURIComponent(jsonObject[key])}`).join('&');}


function jsonToCustomString(jsonObject){return Object.keys(jsonObject).filter(key=>jsonObject[key]!==''&&key.toLowerCase()!=='token').sort().map(key=>`${key.toUpperCase()}${jsonObject[key].toUpperCase()}`).join('');}

  Promise.withResolvers ||= function () {
    let resolve, reject;
    const promise = new this((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

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
      if (res.headers?.["binary-mode"] && bodyBytes)
        res.body = new Uint8Array(bodyBytes);

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

  const $prs = {
    get: this.$prefs?.valueForKey ?? $persistentStore.read,
    getJson: (key) => JSON.parse($prs.get(key), null, 4),
    set: (key, value) =>
      (this.$prefs?.setValueForKey ?? $persistentStore.write)(value, key),
    setJson: (key, obj) => $prs.set(key, JSON.stringify(obj)),
  };

  const $msg = (...a) => {
    const { $open, $copy, $media, ...r } =
      typeof a.at(-1) === "object" && a.pop();
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

  const $log = new Proxy(
    (...args) =>
      args.forEach((i) =>
        console.log(
          i?.stack
            ? `${i.toString()}\n${i.stack}`
            : typeof i === "object"
            ? JSON.stringify(i, null, 4)
            : String(i)
        )
      ),
    {
      get(target) {
        if (!target.init) {
          target.time = (id) => (target.time[id] = Date.now());
          target.timeEnd = (id) => target(Date.now() - target.time[id]);
          target.show =
            (...a) =>
            (b) =>
              b && target(...a);
          target.init = true;
        }

        return Reflect.get(...arguments);
      },
    }
  );

  return {
    $log,
    $msg,
    $prs,
    $http,
    md5,
    jsonToCustomString,
    jsonToQueryString,
  };
};
