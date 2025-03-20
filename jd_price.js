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

const http = (op) => {
  const { promise, resolve, reject } = Promise.withResolvers();

  this.$httpClient?.get(op, (err, resp, data) =>
    err ? reject(err) : resolve(JSON.parse(data))
  );

  this.$task?.fetch(op).then(({ body }) => resolve(JSON.parse(body)), reject);

  return promise;
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
  const jiageData = JSON.parse(`[${jiagequshiyh}]`).reverse().slice(0, 360);

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

const getPriceData = async () => {
  const body = await http({
    url: "https://apapia-history.manmanbuy.com/ChromeWidgetServices/WidgetServices.ashx",
    headers: {
      "user-agent": "CFNetwork/3826.500.101 Darwin/24.4.0",
    },
    body: `methodName=getHistoryTrend&p_url=https://item.m.jd.com/product/${$request.url.match(
      /\d+/
    )}.html"`,
  });

  if (body.err) return body;

  return {
    groupName: "历史比价",
    atts: getJdData(body),
  };
};

getPriceData().then((priceData) => {
  let { body, headers } = $response;
  const tableHTML = priceHistoryTable(priceData);

  body = body.replace("<body>", `<body>${tableHTML}`);

  $done({ body, headers });
});
