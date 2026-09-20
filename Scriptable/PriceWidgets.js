// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: hand-holding-usd;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: hand-holding-usd;

/**
 * =====================================================================
 * 【资产看板 PriceWidgets】
 * 版本：v2.2.8
 * 日期：2026-09-20
 * 
 * 核心功能：
 * 1. 【全品类资产覆盖】
 *    - 加密货币：BTC, ETH, SOL 等主流代币
 *    - 美股外盘：AAPL, TSLA, NVDA 等知名上市公司
 *    - 中国A股：600519(茅台), 000001, sh000001(上证指数) 等
 *    - 公募基金：001186, 161725 等6位基金代码
 *    - 贵金属：国内上海金(AU9999/AUTD)、上海银(AGTD)、现货黄金(XAU)、现货白银(XAG)
 *    - 全国油价：支持 92、95、98 汽油与 0 号柴油
 * =====================================================================
 */

if (typeof require === 'undefined') require = importModule;
const { DmYY, Runing } = require('./DmYY');

// @组件代码开始
class Widget extends DmYY {
  constructor(arg) {
    super(arg);
    this.en = ' btc';
    this.name = '资产看板';
    config.runsInApp &&
      this.registerAction(
        '关注种类',
        async () => {
          return this.setAlertInput(
            '关注种类',
            '支持各类资产代码(英文逗号隔开)：\n• 虚拟币：BTC, ETH, SOL\n• 美股：AAPL, TSLA, NVDA\n• A股：600519(茅台), 000001, sh000001(上证)\n• 国内金银：AU9999, AUTD, AGTD\n• 国际金银：XAU, XAG\n• 基金：001186, 161725\n• 国内油价：92, 95, 98, 0 (或 92#, 95#, 98#, 0#柴油)',
            {
              btcType: 'BTC,AAPL,600519,AU9999,95',
            }
          );
        },
        { name: 'centsign.circle', color: '#feda31' }
      );
    config.runsInApp &&
      this.registerAction(
        '油价设置',
        async () => {
          return this.setAlertInput(
            '油价设置',
            '设置天行数据 APIKEY 与所在省份：\n申请地址：https://www.tianapi.com/apiview/104 (普通会员每日赠送100次)\n省份如：广东、北京、上海、浙江、江苏等',
            {
              oilKey: '',
              oilProvince: '广东',
            }
          );
        },
        { name: 'fuelpump.circle', color: '#f97316' }
      );
    config.runsInApp &&
      this.registerAction(
        '展示范围',
        async () => {
          return this.setAlertInput(
            '展示范围',
            '选择小组件展示的资产范围(支持多个,逗号隔开)：\nall: 全部 (默认)\ncn: 仅国内 (A股/国内金银/基金/油价)\nintl: 仅国际 (虚拟币/美股/港股/伦敦金银)\ncrypto: 仅虚拟币\nstock: 仅股票与指数\nfund: 仅基金\nmetal: 仅贵金属\noil: 仅国内油价\n例：oil 或 cn,oil',
            {
              filterType: 'all',
            }
          );
        },
        { name: 'line.horizontal.3.decrease.circle', color: '#a855f7' }
      );
    config.runsInApp &&
      this.registerAction(
        '随机展示',
        async () => {
          return this.setAlertInput(
            '随机展示',
            '开启后每次刷新在【展示范围】资产中真正随机轮播（小/中/大号组件均生效）：\n• 小号：随机展示 1 个资产\n• 中号：随机抽取 3 个资产\n• 大号：随机抽取 6 个资产\n输入 1 开启，0 关闭',
            {
              randomDisplay: '0',
            }
          );
        },
        { name: 'shuffle', color: '#38bdf8' }
      );
    config.runsInApp && this.registerAction('基础设置', this.setWidgetConfig);
  }


  fixLegacyUrls = (list) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item || !item.symbol) continue;
      const sym = (item.symbol || '').toUpperCase();
      if (!item.url || item.url === 'https://finance.sina.com.cn') {
        if (sym.includes('9999') || sym === 'AU9999') {
          item.url = 'https://wap.eastmoney.com/quote/stock/118.AU9999.html';
        } else if (sym.includes('AUTD') || sym === 'AUTD') {
          item.url = 'https://wap.eastmoney.com/quote/stock/118.AUTD.html';
        } else if (sym.includes('AGTD') || sym === 'AGTD') {
          item.url = 'https://wap.eastmoney.com/quote/stock/118.AGTD.html';
        } else if (sym.includes('XAU') || sym === 'GOLD') {
          item.url = 'https://wap.eastmoney.com/quote/stock/122.XAU.html';
        } else if (sym.includes('XAG') || sym === 'SILVER') {
          item.url = 'https://wap.eastmoney.com/quote/stock/122.XAG.html';
        }
      }
    }
  };

  format = (str) => {
    return parseInt(str) >= 10 ? str : `0${str}`;
  };

  formatPrice = (num, minDec, maxDec) => {
    const val = Number(num);
    if (isNaN(val)) return '' + (num || '0');
    if (minDec !== undefined && maxDec !== undefined) {
      return val.toLocaleString('en-US', {
        minimumFractionDigits: minDec,
        maximumFractionDigits: maxDec,
      });
    }
    if (val >= 1000) {
      return val.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (val >= 1) {
      return val.toFixed(2);
    }
    if (val >= 0.01) {
      return val.toFixed(4);
    }
    return val.toFixed(6);
  };

  endpoint = 'https://api.coingecko.com/api/v3';
  nomicsEndpoint = 'https://api.nomics.com/v1';

  dataSource = [];

  provincePinyinMap = {
    北京: 'beijing', 天津: 'tianjin', 河北: 'hebei', 山西: 'shanxi',
    内蒙古: 'neimenggu', 辽宁: 'liaoning', 吉林: 'jilin', 黑龙江: 'heilongjiang',
    上海: 'shanghai', 江苏: 'jiangsu', 浙江: 'zhejiang', 安徽: 'anhui',
    福建: 'fujian', 江西: 'jiangxi', 山东: 'shandong', 河南: 'henan',
    湖北: 'hubei', 湖南: 'hunan', 广东: 'guangdong', 广西: 'guangxi',
    海南: 'hainan', 重庆: 'chongqing', 四川: 'sichuan', 贵州: 'guizhou',
    云南: 'yunnan', 西藏: 'xizang', 陕西: 'shaanxi', 甘肃: 'gansu',
    青海: 'qinghai', 宁夏: 'ningxia', 新疆: 'xinjiang',
  };

  init = async () => {
    const now = Date.now();
    const lastTime = this.settings.lastUpdatedTime || 0;
    const dataCacheMinutes = parseInt(this.settings.refreshAfterDate) || 30;
    const isExpired = now - lastTime > dataCacheMinutes * 60 * 1000;

    if (this.settings.dataSource && this.settings.dataSource.length && !isExpired && !config.runsInApp) {
      this.dataSource = this.settings.dataSource;
      this.fixLegacyUrls(this.dataSource);
      return;
    }

    await this.cacheData(this.settings.btcType || 'BTC,AAPL,600519,AU9999,95');
  };

  getTrendColor = (market, isBackground = false) => {
    const change = Number(market.price_change_percentage_24h) || 0;
    const isUp = change >= 0;
    const isCN = market.region === 'cn';

    const redColor = isBackground ? new Color('#EF4444', 0.82) : new Color('#EF4444');
    const greenColor = isBackground ? new Color('#10B981', 0.82) : new Color('#10B981');

    if (change === 0 && market.type === 'oil') {
      return isBackground ? new Color('#64748B', 0.82) : new Color('#64748B');
    }

    if (isCN) {
      return isUp ? redColor : greenColor;
    } else {
      return isUp ? greenColor : redColor;
    }
  };

  createBadgeImage = (symbolName, bgColorHex) => {
    const ctx = new DrawContext();
    ctx.size = new Size(250, 250);
    ctx.opaque = false;
    ctx.respectScreenScale = false;
    ctx.setFillColor(new Color(bgColorHex, 1));
    ctx.fillEllipse(new Rect(0, 0, 250, 250));
    try {
      const sym = SFSymbol.named(symbolName);
      if (sym) {
        sym.applyFont(Font.boldSystemFont(150));
        const icon = sym.image;
        ctx.tintColor = Color.white();
        ctx.drawImageInRect(icon, new Rect(35, 35, 180, 180));
        return ctx.getImage();
      }
    } catch (e) {}
    return ctx.getImage();
  };

  getItemImage = async (market) => {
    if (market.type === 'oil') {
      const sym = (market.symbol || '').toUpperCase();
      if (sym.includes('98')) {
        return this.createBadgeImage('fuelpump.fill', '#7C3AED');
      }
      if (sym.includes('95')) {
        return this.createBadgeImage('fuelpump.fill', '#2563EB');
      }
      if (sym.includes('92')) {
        return this.createBadgeImage('fuelpump.fill', '#059669');
      }
      return this.createBadgeImage('drop.fill', '#475569');
    }
    if (market.image && typeof market.image === 'string' && market.image.startsWith('http')) {
      return this.renderImage(market.image);
    }
    const sym = (market.symbol || '').toUpperCase();
    if (sym === 'AAPL') {
      return this.createBadgeImage('applelogo', '#334155');
    }
    if (sym === 'TSLA') {
      return this.createBadgeImage('bolt.car.fill', '#475569');
    }
    if (sym === 'NVDA') {
      return this.createBadgeImage('cpu.fill', '#059669');
    }
    if (sym === 'MSFT') {
      return this.createBadgeImage('square.grid.2x2.fill', '#0284C7');
    }
    if (sym === 'GOOG' || sym === 'GOOGL') {
      return this.createBadgeImage('globe.americas.fill', '#EA580C');
    }
    if (market.type === 'stock') {
      const isUS = (market.id || '').startsWith('us') || market.currency === '$';
      const isHK = (market.id || '').startsWith('hk') || market.currency === 'HK$';
      const color = isUS ? '#475569' : isHK ? '#6366F1' : '#DC2626';
      return this.createBadgeImage('chart.line.uptrend.xyaxis', color);
    }
    if (market.type === 'fund') {
      return this.createBadgeImage('chart.pie.fill', '#3B82F6');
    }
    if (market.type === 'metal') {
      const isSilver = sym.includes('XAG') || sym.includes('AG') || (market.name || '').includes('银');
      return this.createBadgeImage('sparkles', isSilver ? '#94A3B8' : '#D97706');
    }
    return this.createBadgeImage('bitcoinsign.circle', '#F59E0B');
  };

  fetchOilData = async (provName, oilKey) => {
    let p0 = '', p89 = '', p92 = '', p95 = '', p98 = '';
    let adjustDate = '', changeAmount = 0;
    const cleanProv = (provName || '广东').replace(/省|市/g, '');

    if (oilKey) {
      try {
        const url = `https://apis.tianapi.com/oilprice/index?key=${oilKey}&prov=${encodeURIComponent(cleanProv)}`;
        const res = await this.$request.get(url, 'JSON');
        if (res && res.code === 200 && res.result) {
          p0 = res.result.p0 || '';
          p89 = res.result.p89 || '';
          p92 = res.result.p92 || '';
          p95 = res.result.p95 || '';
          p98 = res.result.p98 || '';
        }
      } catch (e) {}
    }

    try {
      const pinyin = this.provincePinyinMap[cleanProv] || 'guangdong';
      const webUrl = `http://m.qiyoujiage.com/${pinyin}.shtml`;
      const webRes = await this.$request.get(webUrl, 'STRING');
      if (webRes) {
        const match92 = webRes.match(/92号汽油<\/dt>\s*<dd>([\d\.]+)/);
        const match95 = webRes.match(/95号汽油<\/dt>\s*<dd>([\d\.]+)/);
        const match98 = webRes.match(/98号汽油<\/dt>\s*<dd>([\d\.]+)/);
        const match0 = webRes.match(/0号柴油<\/dt>\s*<dd>([\d\.]+)/);
        const matchTip = webRes.match(/<div class="tishi">([\s\S]*?)<\/div>/);

        if (match92 && !p92) p92 = match92[1];
        if (match95 && !p95) p95 = match95[1];
        if (match98 && !p98) p98 = match98[1];
        if (match0 && !p0) p0 = match0[1];

        if (matchTip) {
          const rawText = matchTip[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
          const dateMatch = rawText.match(/下次油价(\d+月\d+日(?:\d+时)?)/);
          if (dateMatch) adjustDate = dateMatch[1];

          let isUp = true;
          const dirMatch = rawText.match(/预计(上调|下调|搁浅)/);
          if (dirMatch && dirMatch[1] === '下调') isUp = false;

          const rangeMatch = rawText.match(/([\d\.]+)元\/升(?:-([\d\.]+)元\/升)?/);
          if (rangeMatch) {
            const low = parseFloat(rangeMatch[1]) || 0;
            const high = rangeMatch[2] ? parseFloat(rangeMatch[2]) : low;
            const avg = (low + high) / 2;
            changeAmount = isUp ? avg : -avg;
          }
        }
      }
    } catch (e) {}

    return {
      prov: cleanProv,
      p0, p89, p92, p95, p98,
      adjustDate: adjustDate ? `${adjustDate}调价` : '发改委定价',
      changeAmount,
    };
  };

  cacheData = async (params) => {
    try {
      const rawList = (params || 'BTC,AAPL,600519,AU9999,95')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const isOilFiltered = (this.settings.filterType || '').toLowerCase().includes('oil');

      const cryptoSet = new Set([
        'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'DOGE', 'TON', 'ADA',
        'AVAX', 'TRX', 'LINK', 'DOT', 'MATIC', 'NEAR', 'APT', 'SUI', 'PEPE',
        'SHIB', 'LTC', 'BCH', 'UNI', 'FIL', 'OKB', 'CRO', 'ATOM', 'XLM', 'XMR'
      ]);

      const tencentKeys = [];
      const cryptoKeys = [];
      const sgeKeys = [];
      const oilKeys = [];

      for (const item of rawList) {
        const upper = item.toUpperCase();
        const cleanCode = upper.replace(/[^A-Z0-9]/g, '');

        if (/^(92|95|98|0|89)$/.test(cleanCode) ||
            /^(92#|95#|98#|0#|89#|92号|95号|98号|0号|89号|0号柴油|柴油|汽油|OIL92|OIL95|OIL98|OIL0)$/i.test(item)) {
          oilKeys.push(item);
        } else if (/^(AU9999|AU99\.99|AUTD|AU\(T\+D\)|AGTD|AG\(T\+D\))$/i.test(item) ||
            ['AU9999', 'AU99.99', 'AUTD', 'AGTD', '上海金', '国内黄金', '国内白银'].includes(upper)) {
          if (cleanCode.includes('9999') || cleanCode.includes('999') || item.includes('国内黄金') || item.includes('上海金')) {
            sgeKeys.push('SGE_AU9999');
          } else if (cleanCode.includes('AG')) {
            sgeKeys.push('SGE_AGTD');
          } else {
            sgeKeys.push('SGE_AUTD');
          }
        } else if (/^(SH|SZ|HK|US|HF_|GDS_)/i.test(item)) {
          tencentKeys.push(item);
        } else if (/^\d{6}$/.test(item)) {
          if (/^(60|68|90|11)/.test(item)) {
            tencentKeys.push(`sh${item}`);
          } else if (/^(00|30|20|12)/.test(item)) {
            tencentKeys.push(`sz${item}`);
          } else if (/^(8|4)/.test(item)) {
            tencentKeys.push(`bj${item}`);
          } else {
            tencentKeys.push(`s_jj${item}`);
          }
        } else if (['GOLD', 'XAU', '现货黄金', '伦敦金'].includes(upper)) {
          tencentKeys.push('hf_XAU');
        } else if (['SILVER', 'XAG', '现货白银', '伦敦银'].includes(upper)) {
          tencentKeys.push('hf_XAG');
        } else if (cryptoSet.has(upper)) {
          cryptoKeys.push(item);
        } else if (/^[A-Za-z]{1,5}$/.test(item)) {
          tencentKeys.push(`us${upper}`);
        } else {
          cryptoKeys.push(item);
        }
      }

      const oilMap = {};
      const shouldFetchOil = oilKeys.length > 0 || isOilFiltered;

      if (shouldFetchOil) {
        try {
          const finalKey = (this.settings.oilKey || '').trim();
          const finalProv = (this.settings.oilProvince || '广东').trim();

          const oilRes = await this.fetchOilData(finalProv, finalKey);

          const makeOilItem = (subCode, subName, priceStr) => {
            const priceVal = parseFloat(priceStr) || 0;
            const amt = oilRes.changeAmount || 0;
            const pct = priceVal > 0 ? (amt / priceVal) * 100 : 0;
            const changeStr = amt !== 0 ? (amt > 0 ? `+${amt.toFixed(2)}` : `${amt.toFixed(2)}`) : '0.00';

            const nextPrice = priceVal > 0 && amt !== 0 ? (priceVal + amt).toFixed(2) : priceVal.toFixed(2);
            const highDisplay = nextPrice;
            const lowDisplay = priceVal.toFixed(2);

            return {
              id: `oil_${subCode}`,
              name: `${oilRes.prov}${subName}`,
              symbol: `${subCode}#`,
              current_price: this.formatPrice(priceStr, 2, 2),
              high_24h: highDisplay,
              low_24h: lowDisplay,
              adjust_date: oilRes.adjustDate,
              price_change_percentage_24h: pct,
              expected_change_amount: changeStr,
              last_updated: '',
              currency: '¥',
              region: 'cn',
              type: 'oil',
              url: `http://m.qiyoujiage.com/${this.provincePinyinMap[oilRes.prov] || 'guangdong'}.shtml`,
            };
          };

          if (oilRes.p92) oilMap['92'] = makeOilItem('92', '92号汽油', oilRes.p92);
          if (oilRes.p95) oilMap['95'] = makeOilItem('95', '95号汽油', oilRes.p95);
          if (oilRes.p98) oilMap['98'] = makeOilItem('98', '98号汽油', oilRes.p98);
          if (oilRes.p0) oilMap['0'] = makeOilItem('0', '0号柴油', oilRes.p0);
        } catch (e) {
          console.log(e);
        }
      }

      const tencentMap = {};
      if (tencentKeys.length) {
        try {
          const tencentUrl = `https://web.sqt.gtimg.cn/utf8/q=${tencentKeys.join(',')}`;
          const tencentRes = await this.$request.get(tencentUrl, 'STRING');
          const lines = tencentRes.split(';').map((s) => s.trim()).filter(Boolean);
          for (const line of lines) {
            const [k, v] = line.split('=');
            if (!v) continue;
            const key = k.replace('v_', '');
            const content = v.replace(/^"/, '').replace(/"$/, '');
            if (key.startsWith('s_jj')) {
              const arr = content.split('~');
              const code = arr[0] || key.replace('s_jj', '');
              tencentMap[code] = {
                id: code,
                name: arr[1] || '基金',
                symbol: code,
                current_price: this.formatPrice(arr[3], 4, 4),
                high_24h: this.formatPrice(arr[4], 4, 4),
                low_24h: '-',
                price_change_percentage_24h: parseFloat(arr[5]) || 0,
                last_updated: arr[2] || '',
                currency: '¥',
                region: 'cn',
                type: 'fund',
                url: `https://fund.eastmoney.com/${code}.html`,
              };
            } else if (key.startsWith('hf_')) {
              const arr = content.split(',');
              const cleanCode = key.replace('hf_', '').toUpperCase();
              let metalUrl = 'https://wap.eastmoney.com/quote/stock/122.XAU.html';
              if (cleanCode.includes('XAG') || cleanCode.includes('SILVER') || cleanCode.includes('银')) {
                metalUrl = 'https://wap.eastmoney.com/quote/stock/122.XAG.html';
              }
              tencentMap[key] = {
                id: key,
                name: arr[13] || '现货贵金属',
                symbol: cleanCode,
                current_price: this.formatPrice(arr[0]),
                high_24h: this.formatPrice(arr[4]),
                low_24h: this.formatPrice(arr[5]),
                price_change_percentage_24h: parseFloat(arr[1]) || 0,
                last_updated: arr[6] || '',
                currency: '$',
                region: 'intl',
                type: 'metal',
                url: metalUrl,
              };
            } else {
              const arr = content.split('~');
              const lowerKey = key.toLowerCase();
              const isCN = lowerKey.startsWith('sh') || lowerKey.startsWith('sz') || lowerKey.startsWith('bj');
              const isHK = lowerKey.startsWith('hk');
              const codeOnly = arr[2] || key;
              const displaySymbol = codeOnly.replace(/^US/i, '').toUpperCase();
              const stockItem = {
                id: key,
                name: arr[1] || key,
                symbol: displaySymbol,
                current_price: this.formatPrice(arr[3]),
                high_24h: this.formatPrice(arr[33] || arr[4]),
                low_24h: this.formatPrice(arr[34] || arr[5]),
                price_change_percentage_24h: parseFloat(arr[32] || arr[5]) || 0,
                last_updated: '',
                currency: isCN ? '¥' : isHK ? 'HK$' : '$',
                region: isCN ? 'cn' : 'intl',
                type: 'stock',
                url: `https://gu.qq.com/${key}`,
              };
              tencentMap[key] = stockItem;
              if (codeOnly) tencentMap[codeOnly] = stockItem;
            }
          }
        } catch (e) {
          console.log(e);
        }
      }

      const sgeMap = {};
      if (sgeKeys.length) {
        try {
          const reqUrl = `http://hq.sinajs.cn/list=${sgeKeys.join(',')}`;
          const sgeReq = new Request(reqUrl);
          sgeReq.headers = { 'Referer': 'https://finance.sina.com.cn' };
          const sgeRes = await sgeReq.loadString();
          const lines = sgeRes.split(';').map((s) => s.trim()).filter(Boolean);
          for (const line of lines) {
            const [k, v] = line.split('=');
            if (!v) continue;
            const content = v.replace(/^"/, '').replace(/"$/, '');
            if (!content) continue;
            const arr = content.split(',');
            const code = arr[0] || '';
            const name = arr[1] || arr[2] || '上海金';
            const price = parseFloat(arr[3]) || 0;
            const prevClose = parseFloat(arr[4]) || 0;
            const pct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
            let sgeUrl = 'https://wap.eastmoney.com/quote/stock/118.AU9999.html';
            const upperCode = code.toUpperCase();
            if (upperCode.includes('AG')) {
              sgeUrl = 'https://wap.eastmoney.com/quote/stock/118.AGTD.html';
            } else if (upperCode.includes('TD')) {
              sgeUrl = 'https://wap.eastmoney.com/quote/stock/118.AUTD.html';
            }
            const itemObj = {
              id: code,
              name: name.replace(/\s+/g, ''),
              symbol: code,
              current_price: this.formatPrice(price),
              high_24h: this.formatPrice(arr[5]),
              low_24h: this.formatPrice(arr[6]),
              price_change_percentage_24h: pct,
              last_updated: '',
              currency: '¥',
              region: 'cn',
              type: 'metal',
              url: sgeUrl,
            };
            sgeMap[code.toUpperCase()] = itemObj;
            sgeMap[`SGE_${code.toUpperCase()}`] = itemObj;
          }
        } catch (e) {
          console.log(e);
        }
      }

      const cryptoMap = {};
      if (cryptoKeys.length) {
        try {
          const ids = await this.transforBtcType(cryptoKeys.join(','));
          let response = await this.$request.get(
            `${this.endpoint}/coins/markets?vs_currency=usd&ids=${ids}`,
            'STRING'
          );
          response = JSON.parse(response);
          if (!Array.isArray(response) || !response.length) {
            response = await this.getAllJson();
          }
          if (Array.isArray(response)) {
            response.forEach((it) => {
              const sym = it.symbol.toUpperCase();
              cryptoMap[sym] = {
                id: it.id,
                name: it.name,
                image: it.image,
                symbol: sym,
                current_price: this.formatPrice(it.current_price),
                high_24h: this.formatPrice(it.high_24h),
                low_24h: this.formatPrice(it.low_24h),
                price_change_percentage_24h: it.price_change_percentage_24h || 0,
                last_updated: it.last_updated,
                currency: '$',
                region: 'intl',
                type: 'crypto',
                url: `https://www.coingecko.com/zh/${encodeURIComponent('数字货币')}/${it.id}`,
              };
              cryptoMap[it.id.toUpperCase()] = cryptoMap[sym];
            });
          }
        } catch (e) {
          console.log(e);
        }
      }

      const list = [];
      for (const item of rawList) {
        const upper = item.toUpperCase();
        const clean = upper.replace(/[^A-Z0-9]/g, '');

        if (clean.includes('98') && oilMap['98']) {
          list.push(oilMap['98']);
          continue;
        } else if (clean.includes('95') && oilMap['95']) {
          list.push(oilMap['95']);
          continue;
        } else if (clean.includes('92') && oilMap['92']) {
          list.push(oilMap['92']);
          continue;
        } else if ((clean === '0' || upper.includes('柴油')) && oilMap['0']) {
          list.push(oilMap['0']);
          continue;
        }

        if (clean.includes('9999') || clean.includes('999') || upper.includes('国内黄金') || upper.includes('上海金')) {
          if (sgeMap['AU9999'] || sgeMap['SGE_AU9999']) {
            list.push(sgeMap['AU9999'] || sgeMap['SGE_AU9999']);
            continue;
          }
        } else if (clean.includes('AUTD') || clean.includes('黄金延期')) {
          if (sgeMap['AUTD'] || sgeMap['SGE_AUTD']) {
            list.push(sgeMap['AUTD'] || sgeMap['SGE_AUTD']);
            continue;
          }
        } else if (clean.includes('AGTD') || clean.includes('白银延期') || upper.includes('国内白银')) {
          if (sgeMap['AGTD'] || sgeMap['SGE_AGTD']) {
            list.push(sgeMap['AGTD'] || sgeMap['SGE_AGTD']);
            continue;
          }
        }

        if (tencentMap[item]) {
          list.push(tencentMap[item]);
        } else if (tencentMap[`sh${item}`]) {
          list.push(tencentMap[`sh${item}`]);
        } else if (tencentMap[`sz${item}`]) {
          list.push(tencentMap[`sz${item}`]);
        } else if (tencentMap[`bj${item}`]) {
          list.push(tencentMap[`bj${item}`]);
        } else if (tencentMap[`us${upper}`]) {
          list.push(tencentMap[`us${upper}`]);
        } else if (tencentMap[`s_jj${item}`]) {
          list.push(tencentMap[`s_jj${item}`]);
        } else if (['GOLD', 'XAU', '现货黄金', '伦敦金'].includes(upper) && tencentMap['hf_XAU']) {
          list.push(tencentMap['hf_XAU']);
        } else if (['SILVER', 'XAG', '现货白银', '伦敦银'].includes(upper) && tencentMap['hf_XAG']) {
          list.push(tencentMap['hf_XAG']);
        } else if (cryptoMap[upper]) {
          list.push(cryptoMap[upper]);
        }
      }

      if (isOilFiltered) {
        ['92', '95', '98', '0'].forEach((key) => {
          if (oilMap[key] && !list.some((it) => it.id === `oil_${key}`)) {
            list.push(oilMap[key]);
          }
        });
      }

      if (list.length) {
        this.dataSource = list;
        this.settings.dataSource = this.dataSource;
        this.settings.lastUpdatedTime = Date.now();
        this.saveSettings(false);
      } else if (this.settings.dataSource && this.settings.dataSource.length) {
        this.dataSource = this.settings.dataSource;
      }
    } catch (e) {
      console.log(e);
      if (this.settings.dataSource && this.settings.dataSource.length) {
        this.dataSource = this.settings.dataSource;
      }
    }
  };

  transforBtcType = async (params) => {
    let btcType;
    if (params) btcType = params.split(',');

    const btcAll = await this.getAllJson();
    if (!Array.isArray(btcAll)) return '';

    if (!btcType) {
      return btcAll
        .slice(0, 8)
        .map((item) => item.id)
        .join(',');
    }

    return btcType
      .map((item) => {
        const target = item.trim().toUpperCase();
        const result =
          btcAll.find(
            (btc) =>
              (btc.symbol && btc.symbol.toUpperCase() === target) ||
              (btc.id && btc.id.toUpperCase() === target)
          ) || {};
        return result.id;
      })
      .filter((item) => !!item)
      .join(',');
  };

  getAllJson = async () => {
    const cachePath = this.FILE_MGR.joinPath(
      this.FILE_MGR.libraryDirectory(),
      `${Script.name()}/datas`
    );
    const filename = `${cachePath}/BTC.json`;
    if (!this.FILE_MGR.fileExists(cachePath))
      this.FILE_MGR.createDirectory(cachePath, true);

    let needFetch = true;
    if (this.FILE_MGR.fileExists(filename)) {
      const modDate = this.FILE_MGR.modificationDate(filename);
      if (modDate && Date.now() - modDate.getTime() < 24 * 60 * 60 * 1000) {
        needFetch = false;
      }
    }

    if (!needFetch) {
      try {
        const data = Data.fromFile(filename).toRawString();
        return JSON.parse(data);
      } catch (e) {
        needFetch = true;
      }
    }

    try {
      const response = await this.$request.get(
        `${this.endpoint}/coins/markets?vs_currency=usd&ids=`
      );
      if (Array.isArray(response) && response.length) {
        const data = Data.fromString(JSON.stringify(response));
        this.FILE_MGR.write(filename, data);
        return response;
      }
    } catch (e) {
      console.log(e);
    }

    if (this.FILE_MGR.fileExists(filename)) {
      const data = Data.fromFile(filename).toRawString();
      return JSON.parse(data);
    }
    return [];
  };

  renderImage = async (uri) => {
    return this.$request.get(uri, 'IMG');
  };

  notSupport(w) {
    const stack = w.addStack();
    stack.addText('暂无对应数据');
    return w;
  }

  getSmallBg = async (url) => {
    const webview = new WebView();
    let js = `const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const { width, height } = img
        canvas.width = width
        canvas.height = height
        ctx.globalAlpha = 0.3
        ctx.drawImage(
          img,
          -width / 2 + 50,
          -height / 2 + 50,
          width,
          height
        )
        const uri = canvas.toDataURL()
        completion(uri);
      };
      img.src = 'data:image/png;base64,${Data.fromPNG(url).toBase64String()}'`;
    let image = await webview.evaluateJavaScript(js, true);
    image = image.replace(/^data\:image\/\w+;base64,/, '');
    return Image.fromData(Data.fromBase64String(image));
  };

  shuffle = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  getFilteredDataSource = () => {
    const rawFilter = (this.settings.filterType || 'all').trim();
    let filtered = this.dataSource;
    if (rawFilter && rawFilter.toLowerCase() !== 'all' && rawFilter !== '全部') {
      const filters = rawFilter
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      filtered = this.dataSource.filter((item) => {
        const type = (item.type || '').toLowerCase();
        const region = (item.region || '').toLowerCase();
        return filters.some((f) => {
          if (f === 'oil' || f === '油价') return type === 'oil';
          if (f === 'cn' || f === '国内') return region === 'cn';
          if (f === 'intl' || f === 'global' || f === '国际') return region === 'intl';
          return type === f;
        });
      });
    }

    if (this.settings.randomDisplay === '1' && filtered.length > 1) {
      return this.shuffle(filtered);
    }
    return filtered;
  };

  renderSmall = async (widget) => {
    const list = this.getFilteredDataSource();
    if (!list.length) {
      widget.setPadding(16, 16, 16, 16);
      const tip = widget.addText('未找到对应资产\n请检查关注种类与范围');
      tip.font = Font.systemFont(12);
      tip.textColor = Color.gray();
      return widget;
    }

    const market = list[0] || {};
    widget.url = market.url || 'https://www.coingecko.com';

    const image = await this.getItemImage(market);
    const backgroundImg = await this.getSmallBg(image);
    widget.backgroundColor = this.backGroundColor;
    widget.backgroundImage = backgroundImg;
    widget.setPadding(12, 12, 12, 12);

    const topHeader = widget.addStack();
    topHeader.layoutHorizontally();
    topHeader.centerAlignContent();
    topHeader.addSpacer();

    const isCN = market.region === 'cn';
    const tagStack = topHeader.addStack();
    tagStack.setPadding(1.5, 4, 1.5, 4);
    tagStack.cornerRadius = 3;
    tagStack.backgroundColor = isCN ? new Color('#EF4444', 0.12) : new Color('#0284C7', 0.12);
    const tagText = tagStack.addText(isCN ? 'CN' : 'INTL');
    tagText.textColor = isCN ? new Color('#DC2626', 0.88) : new Color('#0284C7', 0.88);
    tagText.font = Font.boldSystemFont(8);

    topHeader.addSpacer(5);

    const coin = topHeader.addText(market.symbol ? market.symbol.toUpperCase() : '');
    coin.font = Font.heavySystemFont(22);
    coin.textColor = this.widgetColor;
    coin.lineLimit = 1;
    coin.minimumScaleFactor = 0.5;

    const isOil = market.type === 'oil';
    const name = widget.addText(market.name || '');
    name.font = Font.systemFont(10);
    name.textColor = Color.gray();
    name.rightAlignText();
    widget.addSpacer();

    const changeVal = Number(market.price_change_percentage_24h) || 0;
    const trendTextStr = isOil
      ? (market.expected_change_amount && market.expected_change_amount !== '0.00'
          ? `预计${market.expected_change_amount}`
          : '预计调价0.00')
      : `${changeVal.toFixed(2)}%`;

    const trend = widget.addText(trendTextStr);
    trend.font = Font.semiboldSystemFont(15);
    trend.textColor = this.getTrendColor(market, false);

    trend.rightAlignText();
    const curSym = market.currency || '$';
    const price = widget.addText(`${curSym} ${market.current_price || '0'}`);
    price.font = Font.boldSystemFont(28);
    price.textColor = this.widgetColor;
    price.rightAlignText();
    price.lineLimit = 1;
    price.minimumScaleFactor = 0.1;

    const history = widget.addText(
      isOil
        ? (market.adjust_date || '发改委定价')
        : `H: ${market.high_24h || '0'}, L: ${market.low_24h || '0'}`
    );
    history.font = Font.systemFont(9);
    history.textColor = Color.gray();
    history.rightAlignText();
    history.lineLimit = 1;
    history.minimumScaleFactor = 0.1;
    return widget;
  };

  rowCell = async (rowStack, market) => {
    rowStack.url = market.url || 'https://www.coingecko.com';
    rowStack.layoutHorizontally();
    const image = await this.getItemImage(market);
    const iconImage = rowStack.addImage(image);
    iconImage.imageSize = new Size(28, 28);
    iconImage.cornerRadius = 14;

    rowStack.addSpacer(10);

    const centerStack = rowStack.addStack();
    centerStack.layoutVertically();

    const topCenterStack = centerStack.addStack();
    topCenterStack.layoutHorizontally();
    topCenterStack.centerAlignContent();

    const titleText = topCenterStack.addText(market.symbol || '');
    titleText.textColor = this.widgetColor;
    titleText.font = this.provideFont('semibold', 16);

    topCenterStack.addSpacer(6);

    const isCN = market.region === 'cn';
    const tagStack = topCenterStack.addStack();
    tagStack.setPadding(1.5, 4, 1.5, 4);
    tagStack.cornerRadius = 3;
    tagStack.backgroundColor = isCN ? new Color('#EF4444', 0.12) : new Color('#0284C7', 0.12);
    const tagText = tagStack.addText(isCN ? 'CN' : 'INTL');
    tagText.textColor = isCN ? new Color('#DC2626', 0.88) : new Color('#0284C7', 0.88);
    tagText.font = Font.boldSystemFont(8);

    topCenterStack.addSpacer();

    const curSym = market.currency || '$';
    const priceText = topCenterStack.addText(`${curSym} ${market.current_price || '0'}`);
    priceText.textColor = this.widgetColor;
    priceText.font = this.provideFont('semibold', 15);
    priceText.rightAlignText();

    const bottomCenterStack = centerStack.addStack();
    bottomCenterStack.layoutHorizontally();

    const isOil = market.type === 'oil';
    const subText = bottomCenterStack.addText(market.name || '');
    subText.textColor = Color.gray();
    subText.font = this.provideFont('semibold', 10);

    bottomCenterStack.addSpacer();

    const historyText = bottomCenterStack.addText(
      isOil
        ? (market.adjust_date || '发改委定价')
        : `H: ${market.high_24h || '0'}, L: ${market.low_24h || '0'}`
    );
    historyText.textColor = Color.gray();
    historyText.font = this.provideFont('semibold', 10);
    historyText.rightAlignText();

    rowStack.addSpacer(8);

    const rateStack = rowStack.addStack();
    rateStack.size = new Size(72, 28);
    rateStack.centerAlignContent();
    rateStack.cornerRadius = 4;
    const changeVal = Number(market.price_change_percentage_24h) || 0;
    rateStack.backgroundColor = this.getTrendColor(market, true);

    const btnText = isOil
      ? (market.expected_change_amount || '0.00')
      : ((changeVal >= 0 ? '+' : '') + changeVal.toFixed(2) + '%');

    const rateText = rateStack.addText(btnText);
    rateText.textColor = new Color('#fff', 0.95);
    rateText.font = this.provideFont('semibold', 13);
    rateText.minimumScaleFactor = 0.01;
    rateText.lineLimit = 1;
  };

  renderLarge = async (widget) => {
    widget.setPadding(12, 12, 12, 12);
    const containerStack = widget.addStack();
    containerStack.layoutVertically();
    const list = this.getFilteredDataSource();
    if (!list.length) {
      const tip = containerStack.addText('未找到对应资产，请检查关注种类与范围');
      tip.font = Font.systemFont(12);
      tip.textColor = Color.gray();
      return widget;
    }
    const maxLen = Math.min(list.length, 6);
    for (let index = 0; index < maxLen; index++) {
      const item = list[index];
      const rowCellStack = containerStack.addStack();
      await this.rowCell(rowCellStack, item);
      if (index !== maxLen - 1) containerStack.addSpacer();
    }
    return widget;
  };

  renderMedium = async (widget) => {
    widget.setPadding(12, 12, 12, 12);
    const containerStack = widget.addStack();
    containerStack.layoutVertically();
    const list = this.getFilteredDataSource();
    if (!list.length) {
      const tip = containerStack.addText('未找到对应资产，请检查关注种类与范围');
      tip.font = Font.systemFont(12);
      tip.textColor = Color.gray();
      return widget;
    }
    const maxLen = Math.min(list.length, 3);
    for (let index = 0; index < maxLen; index++) {
      const item = list[index];
      const rowCellStack = containerStack.addStack();
      await this.rowCell(rowCellStack, item);
      if (index !== maxLen - 1) containerStack.addSpacer();
    }
    return widget;
  };

  async render() {
    await this.init();
    const widget = new ListWidget();
    if (this.widgetFamily === 'small') await this.renderSmall(widget);
    await this.getWidgetBackgroundImage(widget);
    if (this.widgetFamily === 'medium') await this.renderMedium(widget);
    if (this.widgetFamily === 'large') await this.renderLarge(widget);

    delete this.settings.refreshAfterDate;

    return widget;
  }
}

// @组件代码结束
await Runing(Widget, '', false); //远程开发环境

//version:1.0.0