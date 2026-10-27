// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: yellow; icon-glyph: fire;
/**
 * 组件名称: 中燃在线 (China Gas)
 * 版本号: v2.7.7
 * 依赖框架: DmYY
 * 使用说明: 根据 UI 账户设置教程
 * 其他说明: UI 套用请说明来源，其他地区修改接口即可
 */

if (typeof require === 'undefined') require = importModule;
const { DmYY, Runing } = require('./DmYY');

class Widget extends DmYY {
  version = '2.7.7';

  SCALE = 1;
  gasData = null;
  isOffline = false;

  constructor(arg) {
    super(arg);
    this.name = '中燃在线';
    this.en = 'ChinaGas';
    this.logo = 'https://raw.githubusercontent.com/githubdulong/Script/master/Images/ChinaGas_logo.png';
    this.fm = FileManager.local();
    this.cachePath = this.fm.joinPath(this.fm.documentsDirectory(), 'ChinaGas_Cache');

    if (typeof this.Run === 'function') {
      this.Run();
    }
  }

  loadCache(key) {
    try {
      const file = this.fm.joinPath(this.cachePath, key);
      if (this.fm.fileExists(file)) {
        return this.fm.readString(file);
      }
    } catch (_) {}
    return null;
  }

  saveCache(key, content) {
    try {
      if (!this.fm.fileExists(this.cachePath)) {
        this.fm.createDirectory(this.cachePath, true);
      }
      if (!this.fm.fileExists(this.cachePath)) {
        console.warn('[ChinaGas] 缓存目录创建失败: ' + this.cachePath);
        return false;
      }
      const file = this.fm.joinPath(this.cachePath, key);
      this.fm.writeString(file, content);
      return true;
    } catch (e) {
      console.warn('[ChinaGas] 写入缓存失败 ' + key + ': ' + e);
      return false;
    }
  }

  clearStorage() {
    try {
      if (this.fm.fileExists(this.cachePath)) {
        this.fm.remove(this.cachePath);
      }
    } catch (_) {}
  }

  async init() {
    this.settings.alias = this.settings.alias || '中燃在线';
    this.settings.themeColor = this.settings.themeColor || '#FF9500';
    if (this.settings.balanceTextColor !== undefined) {
      delete this.settings.balanceTextColor;
      this.saveSettings(false);
    }
    if (this.settings.balanceColor !== undefined) {
      delete this.settings.balanceColor;
      this.saveSettings(false);
    }
    this.settings.interval = this.settings.interval || '360';
    this.settings.balanceLimit = this.settings.balanceLimit || '500';
    // 只保留三种稳定款式；旧版曾存过 gradient，已废弃，回落到一体无缝条
    const VALID_STYLES = ['square', 'capsule', 'smooth'];
    if (!VALID_STYLES.includes(this.settings.progressStyle)) {
      this.settings.progressStyle = this.settings.progressStyle === 'gradient' ? 'smooth' : 'square';
    }
    if (this.settings.useGradientBar === undefined) {
      this.settings.useGradientBar = 'true';
    }
    if (this.settings.useGradientBalance === undefined) {
      this.settings.useGradientBalance = 'true';
    }
    if (this.settings.maskCustCode === undefined) {
      this.settings.maskCustCode = 'false';
    }
    if (this.settings.maskCompName === undefined) {
      this.settings.maskCompName = 'false';
    }

    const uiScale = parseFloat(this.settings.uiScale);
    this.SCALE = this.getWidgetScaleFactor() * (isFinite(uiScale) && uiScale > 0 ? uiScale : 1);
    await this.fetchGasInfo(false);
  }

  getWidgetScaleFactor() {
    try {
      const deviceSize = Device.screenSize();
      const screenData = [
        { width: 440, height: 956, scale: 1.0 },
        { width: 430, height: 932, scale: 0.98 },
        { width: 428, height: 926, scale: 0.97 },
        { width: 414, height: 896, scale: 0.95 },
        { width: 402, height: 874, scale: 0.93 },
        { width: 393, height: 852, scale: 0.90 },
        { width: 390, height: 844, scale: 0.89 },
        { width: 375, height: 812, scale: 0.85 },
      ];
      const match = screenData.find(
        d => (d.width === deviceSize.width && d.height === deviceSize.height) ||
             (d.width === deviceSize.height && d.height === deviceSize.width)
      );
      return match ? match.scale : 0.95;
    } catch (_) {
      return 0.95;
    }
  }

  getWidgetSmallWidth() {
    try {
      const deviceSize = Device.screenSize();
      const screenW = Math.round(Math.min(deviceSize.width, deviceSize.height));
      const screenH = Math.round(Math.max(deviceSize.width, deviceSize.height));
      const sizes = [
        { w: 440, h: 956, smallW: 170 },
        { w: 430, h: 932, smallW: 170 },
        { w: 428, h: 926, smallW: 170 },
        { w: 414, h: 896, smallW: 169 },
        { w: 414, h: 736, smallW: 159 },
        { w: 402, h: 874, smallW: 162 },
        { w: 393, h: 852, smallW: 158 },
        { w: 390, h: 844, smallW: 158 },
        { w: 375, h: 812, smallW: 155 },
        { w: 375, h: 667, smallW: 148 },
        { w: 360, h: 780, smallW: 155 },
      ];
      const match = sizes.find(s => Math.abs(s.w - screenW) <= 3 && Math.abs(s.h - screenH) <= 3);
      if (match) return match.smallW;

      if (screenW >= 420) return 170;
      if (screenW >= 398) return 162;
      if (screenW >= 385) return 158;
      return 155;
    } catch (_) {
      return 158;
    }
  }

  getWidgetLargeWidth() {
    try {
      const deviceSize = Device.screenSize();
      const screenW = Math.round(Math.min(deviceSize.width, deviceSize.height));
      const screenH = Math.round(Math.max(deviceSize.width, deviceSize.height));
      const sizes = [
        { w: 440, h: 956, largeW: 368 },
        { w: 430, h: 932, largeW: 364 },
        { w: 428, h: 926, largeW: 364 },
        { w: 414, h: 896, largeW: 360 },
        { w: 414, h: 736, largeW: 348 },
        { w: 402, h: 874, largeW: 348 },
        { w: 393, h: 852, largeW: 338 },
        { w: 390, h: 844, largeW: 338 },
        { w: 375, h: 812, largeW: 329 },
        { w: 375, h: 667, largeW: 321 },
        { w: 360, h: 780, largeW: 348 },
      ];
      const match = sizes.find(s => Math.abs(s.w - screenW) <= 3 && Math.abs(s.h - screenH) <= 3);
      if (match) return match.largeW;

      if (screenW >= 435) return 368;
      if (screenW >= 420) return 364;
      if (screenW >= 405) return 355;
      if (screenW >= 398) return 348;
      if (screenW >= 385) return 338;
      return 329;
    } catch (_) {
      return 338;
    }
  }

  drawGlowDot(hexColor, size = 36) {
    const ctx = new DrawContext();
    ctx.size = new Size(size, size);
    ctx.opaque = false;
    ctx.respectScreenScale = true;

    const drawLayer = (ratio, color, alpha) => {
      const d = size * ratio;
      const offset = (size - d) / 2;
      ctx.setFillColor(new Color(color, alpha));
      ctx.fillEllipse(new Rect(offset, offset, d, d));
    };

    drawLayer(1.00, hexColor, 0.26);
    drawLayer(0.74, hexColor, 0.55);
    drawLayer(0.52, hexColor, 1.00);
    drawLayer(0.30, '#FFFFFF', 1.00);

    return ctx.getImage();
  }

  getColor() {
    const light = (this.settings && this.settings.lightColor) || '#000000';
    const dark = (this.settings && this.settings.darkColor) || '#FFFFFF';
    return Color.dynamic(new Color(light), new Color(dark));
  }

  getWidgetBgColor() {
    const light = (this.settings && this.settings.lightBgColor) || '#FFFFFF';
    const dark = (this.settings && this.settings.darkBgColor) || '#000000';
    return Color.dynamic(new Color(light), new Color(dark));
  }

  async fetchGasInfo(force = false) {
    const custCode = (this.settings.custCode || '').trim();
    const custName = (this.settings.custName || '').trim();
    const userId = (this.settings.userId || '').trim();
    const xMasAppInfo = (this.settings.xMasAppInfo || '').trim();

    const cacheKey = `gas_cache_${custCode || 'default'}.json`;
    const intervalMin = parseInt(this.settings.interval) || 360;

    let cachedData = null;
    const cacheStr = this.loadCache(cacheKey);
    if (cacheStr) {
      try {
        cachedData = JSON.parse(cacheStr);
      } catch (_) {
        cachedData = null;
      }
    }

    if (!custCode || !xMasAppInfo) {
      if (cachedData) {
        this.gasData = cachedData;
        this.isOffline = true;
      } else {
        this.gasData = null;
      }
      return;
    }

    if (!force && cachedData && cachedData._updateTimestamp) {
      const elapsedMin = Math.floor((Date.now() - cachedData._updateTimestamp) / 1000 / 60);
      if (elapsedMin >= 0 && elapsedMin < intervalMin) {
        console.log(`[ChinaGas] 命中沙盒缓存：上次更新于 ${elapsedMin} 分钟前（数据读取间隔: ${intervalMin} 分钟），直接读取本地数据，跳过网络请求`);
        this.gasData = cachedData;
        this.isOffline = false;
        return;
      }
      console.log(`[ChinaGas] 本地数据已超出读取周期（已过 ${elapsedMin} 分钟，设定间隔: ${intervalMin} 分钟），正在联网拉取最新数据...`);
    }

    const url = 'https://zrds.95007.com/crm_controller/user/findCustInfoByCustCodeAndCustName';
    const now = Date.now();
    const bodyStr = [
      `custCode=${encodeURIComponent(custCode)}`,
      `custName=${encodeURIComponent(custName)}`,
      `timeStamp=${now}`,
      `signature=gas_sig_${now}`
    ].join('&');

    try {
      const res = await this.$request.post(url, {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'userId': userId,
          'x-mas-app-info': xMasAppInfo,
          'accessFrom': 'yphpaymp',
          'platform': 'mp-weixin'
        },
        body: bodyStr,
        timeoutInterval: 10
      });

      if (res && res.status === '1' && res.data) {
        this.gasData = typeof res.data === 'object' ? res.data : {};
        let comp = this.gasData.compName || this.gasData.companyName || this.gasData.orgName || this.gasData.filialeName || this.gasData.branchName || this.gasData.unitName;
        if (!comp) {
          comp = this.detectCompanyName(this.gasData) || this.detectCompanyName(res);
        }
        if (comp) {
          this.gasData.compName = comp;
        }

        const dateObj = new Date();
        this.gasData._fetchTime = dateObj.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        this.gasData._fetchDate = dateObj.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
        this.gasData._updateTimestamp = Date.now();

        this.saveCache(cacheKey, JSON.stringify(this.gasData));
        this.recordDailyBalance();
        this.isOffline = false;
        console.log(`[ChinaGas] 成功获取最新燃气数据并写入沙盒，更新时间: ${this.gasData._fetchTime}`);
      } else {
        throw new Error((res && (res.message || res.msg)) || '接口返回异常状态');
      }
    } catch (e) {
      console.warn('[ChinaGas] 联网请求失败或微信凭据异常，安全回退本地缓存: ' + e);
      if (cachedData) {
        this.gasData = cachedData;
        this.isOffline = true;
      } else {
        this.gasData = null;
      }
    }
  }

  async parseClipboardCurl() {
    const paste = Pasteboard.paste();
    if (!paste || !paste.trim()) {
      const a = new Alert();
      a.title = '剪贴板为空';
      a.message = '请先在 Surge / Loon 抓包软件中复制请求 cURL 或请求头，再点击此功能。';
      a.addAction('知道了');
      await a.presentAlert();
      return;
    }

    const str = paste.trim();
    let modified = false;

    const userMatch = str.match(/(?:userId|userid)['":\s=]+([0-9a-zA-Z_-]+)/i);
    if (userMatch && userMatch[1]) {
      this.settings.userId = userMatch[1].trim();
      modified = true;
    }

    const tokenMatch = str.match(/x-mas-app-info['":\s=]+([^'"\r\n&]+)/i);
    if (tokenMatch && tokenMatch[1]) {
      this.settings.xMasAppInfo = tokenMatch[1].trim();
      modified = true;
    }

    const custMatch = str.match(/(?:custCode|custcode)['":\s=]+([0-9]{6,12})/i);
    if (custMatch && custMatch[1]) {
      this.settings.custCode = custMatch[1].trim();
      modified = true;
    }

    const nameRegex = /(?:custName|custname)['":\s=]+([^'"&\r\n\s]+)/gi;
    let nMatch;
    while ((nMatch = nameRegex.exec(str)) !== null) {
      let rawName = nMatch[1].trim();
      if (!/^https?:\/\//i.test(rawName) && !/^HTTP\/\d/i.test(rawName) && rawName !== 'undefined' && rawName !== 'null') {
        try {
          rawName = decodeURIComponent(rawName);
        } catch (_) {}
        this.settings.custName = rawName;
        modified = true;
        break;
      }
    }

    const compMatch = str.match(/(?:compName|companyName|company|corpName)['":\s=]+([^'"&\r\n]+)/i);
    if (compMatch && compMatch[1]) {
      let rawComp = compMatch[1].trim();
      try {
        rawComp = decodeURIComponent(rawComp);
      } catch (_) {}
      this.settings.customCompName = rawComp;
      modified = true;
    }

    const a = new Alert();
    if (modified) {
      this.saveSettings(false);
      await this.fetchGasInfo(true);
      a.title = '凭据解析成功';
      a.message = `已自动提取并保存：\n• 用户ID: ${this.settings.userId || '未找到'}\n• 燃气户号: ${this.settings.custCode || '未找到'}\n• 户名: ${this.settings.custName || '未找到'}\n• 登录凭据: 已更新\n• 服务单位: ${this.settings.customCompName || '自动获取'}`;
    } else {
      a.title = '未识别到中燃请求参数';
      a.message = '未能从剪贴板解析出有效凭据，请确认复制的是 zrds.95007.com 的请求。';
    }
    a.addAction('确定');
    await a.presentAlert();
    this.reopenScript();
  }

  formatMoney(num) {
    const val = parseFloat(num);
    return isNaN(val) ? '0.00' : val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  detectCompanyName(obj) {
    if (!obj || typeof obj !== 'object') return '';
    try {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string' && (v.includes('燃气') || v.includes('中燃') || v.includes('公司')) && !v.includes('http') && v.length < 50) {
          return v.trim();
        }
      }
    } catch (_) {}
    return '';
  }

  formatCustCode(code, isShort = false) {
    if (!code) return '--';
    if (this.settings.maskCustCode === 'true') {
      if (code.length >= 8) {
        return code.slice(0, 3) + '****' + code.slice(-2);
      }
      return '****' + code.slice(-2);
    }
    if (isShort) {
      return code.length > 5 ? code.slice(-5) : code;
    }
    return code;
  }

  formatCompName(name, isFull = false) {
    const raw = (name || (this.gasData && this.gasData.compName) || this.settings.customCompName || '').trim();
    if (this.settings.maskCompName === 'true') {
      return '中国燃气';
    }
    if (!raw || raw === 'undefined' || raw === 'null') {
      return '中国燃气';
    }
    if (isFull) {
      return raw;
    }
    return raw.replace(/城市燃气发展有限公司|燃气发展有限公司|有限责任公司|有限公司/g, '');
  }

  recordDailyBalance() {
    try {
      const d = this.gasData || {};
      const owe = parseFloat(d.oweMoney || '0');
      if (owe > 0) return;
      const bal = parseFloat(d.countMoney || d.newCountMoney || '0');
      if (!isFinite(bal) || bal < 0) return;

      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      let hist = {};
      const raw = this.loadCache('gas_balance.json');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') hist = parsed;
        } catch (_) {}
      }
      hist[key] = Math.round(bal * 100) / 100;

      const keys = Object.keys(hist).sort();
      if (keys.length > 7) {
        keys.slice(0, keys.length - 7).forEach(k => { delete hist[k]; });
      }
      const ok = this.saveCache('gas_balance.json', JSON.stringify(hist));
      if (ok) {
        console.log(`[ChinaGas] 余额快照已记录 ${key} = ${hist[key]}（共 ${Object.keys(hist).length} 天）`);
      }
    } catch (e) {
      console.warn('[ChinaGas] 余额快照记录异常: ' + e);
    }
  }

  getYesterdayUsage() {
    try {
      const d = this.gasData || {};
      const owe = parseFloat(d.oweMoney || '0');
      if (owe > 0) return null;
      const cur = parseFloat(d.countMoney || d.newCountMoney || '0');
      if (!isFinite(cur) || cur <= 0) return null;

      const now = new Date();

      let prev = null;

      const y = new Date(now.getTime() - 86400000);
      const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;

      const raw = this.loadCache('gas_balance.json');
      if (raw) {
        try {
          const hist = JSON.parse(raw);
          if (hist && hist[yKey] !== undefined) {
            prev = parseFloat(hist[yKey]);
          }
        } catch (_) {}
      }

      if (prev === null || !isFinite(prev)) {
        const manual = parseFloat(this.settings.yestBal);
        if (isFinite(manual) && manual > 0) prev = manual;
      }

      if (prev === null || !isFinite(prev)) return null;

      const diff = prev - cur;
      if (Math.abs(diff) < 0.005) return 0;
      return Math.round(diff * 100) / 100;
    } catch (_) {
      return null;
    }
  }

  getYesterdayUsageInfo() {
    if (this.settings.showYestUsage !== 'true') return null;
    const v = this.getYesterdayUsage();
    if (v === null) return null;
    if (v > 0) return { text: v.toFixed(2), isRecharge: false, isZero: false, arrow: '\u2198' };
    if (v < 0) {
      const a = Math.abs(v);
      return { text: String(Math.round(a * 100) / 100), isRecharge: true, isZero: false, arrow: '\u2197' };
    }
    return { text: '0.00', isRecharge: false, isZero: true, arrow: '\u2192' };
  }

  getUsageColor(info) {
    if (info.isZero) return new Color('#FFB300');
    if (info.isRecharge) return new Color('#00D26A');
    return new Color('#EF4444');
  }

  limitUsageDigits(info, maxInt) {
    if (!info) return '';
    const raw = String(info.text);
    const dot = raw.indexOf('.');
    const intPart = dot < 0 ? raw : raw.slice(0, dot);
    if (intPart.length >= maxInt) return info.arrow + ' ' + intPart;
    return info.arrow + ' ' + raw;
  }

  getBalanceRatio() {
    const d = this.gasData || {};
    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    if (isOwe) return 0;
    const bal = parseFloat(d.countMoney || d.newCountMoney || '0');
    if (isNaN(bal) || bal <= 0) return 0;
    const maxLimit = parseFloat(this.settings.balanceLimit) || 500;
    return Math.max(0, Math.min(1.0, bal / maxLimit));
  }

  getCapsuleActiveCount(totalSegments = 10) {
    const d = this.gasData || {};
    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    if (isOwe) {
      return 1;
    }
    const ratio = this.getBalanceRatio();
    if (ratio <= 0) return 0;
    return Math.max(1, Math.round(ratio * totalSegments));
  }

  getBandStops() {
    return ['#B82020', '#F08A1D', '#F5D627', '#F5D627', '#89C853', '#26A67A'];
  }

  getGlowHex(isOwe) {
    // 光晕指示点始终跟随账户状态色带，不受进度条渐变色开关影响
    if (isOwe) return '#B82020';
    if (this.isOffline) return '#0EA5E9';
    return this.sampleBandHex(this.getBalanceRatio());
  }

  getBalanceTextColor(isOwe) {
    if (isOwe) return new Color('#EF4444');
    if (this.settings.useGradientBalance === 'false') {
      return this.widgetColor || this.getColor();
    }
    const ratio = this.getBalanceRatio();
    return this.colorAt(this.getBarColors(ratio, false), ratio);
  }

  sampleBandHex(t) {
    const stops = this.getBandStops();
    // NaN / 非数字一律当作 0，防止索引变 NaN 后取到 undefined 而抛 TypeError
    let n = parseFloat(t);
    if (!isFinite(n)) n = 0;
    const x = Math.max(0, Math.min(1, n)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(x));
    const f = x - i;
    const c1 = parseInt(stops[i].replace('#', ''), 16);
    const c2 = parseInt(stops[i + 1].replace('#', ''), 16);
    const ch = (shift) => Math.round(((c1 >> shift) & 255) + (((c2 >> shift) & 255) - ((c1 >> shift) & 255)) * f);
    return '#' + ((1 << 24) + (ch(16) << 16) + (ch(8) << 8) + ch(0)).toString(16).slice(1).toUpperCase();
  }

  sampleBand(t) {
    return new Color(this.sampleBandHex(t));
  }

  getBarColors(ratio, isOwe) {
    if (isOwe || ratio <= 0) {
      return { single: '#B82020', gradient: false };
    }

    if (this.settings.useGradientBar === 'false') {
      const single = this.settings.themeColor || '#FF9500';
      return { single: single, gradient: false };
    }

    return { gradient: true, stops: this.getBandStops() };
  }

  // 所有进度条样式必须走这里，不得直接调 sampleBand，否则关闭渐变开关会失效
  colorAt(colors, t) {
    if (!colors || colors.gradient === false) {
      const single = (colors && colors.single) || this.settings.themeColor || '#FF9500';
      return new Color(single);
    }
    return this.sampleBand(t);
  }

  getCardBgColor() {
    const userDarkBg = ((this.settings && this.settings.darkBgColor) || '').trim().toUpperCase();
    let darkCardHex = '#1C1C1E';
    if (userDarkBg === '#1C1C1E' || userDarkBg === '1C1C1E' || userDarkBg === '#1E1E20' || userDarkBg === '#202022') {
      darkCardHex = '#242426';
    } else if (userDarkBg === '#2C2C2E' || userDarkBg === '2C2C2E') {
      darkCardHex = '#343438';
    }
    return Color.dynamic(new Color('#F4F5F7'), new Color(darkCardHex));
  }

  getProgressBarBgColor() {
    const userDarkBg = ((this.settings && this.settings.darkBgColor) || '').trim().toUpperCase();
    let darkHex = '#2C2C2E';
    if (userDarkBg === '#1C1C1E' || userDarkBg === '1C1C1E' || userDarkBg === '#1E1E20' || userDarkBg === '#202022') {
      darkHex = '#353538';
    } else if (userDarkBg === '#2C2C2E' || userDarkBg === '2C2C2E') {
      darkHex = '#3E3E42';
    }
    return Color.dynamic(new Color('#E5E7EB'), new Color(darkHex));
  }

  addProgressBar(parent, width, height, totalSegments = 10, colors, ratio, thin) {
    const style = this.settings.progressStyle || 'square';
    const validRatio = Math.max(0, Math.min(1.0, ratio !== undefined ? ratio : this.getBalanceRatio()));

    if (style === 'capsule') {
      const activeSegs = this.getCapsuleActiveCount(totalSegments);
      return this.addCapsuleBar(parent, width, height, totalSegments, activeSegs, colors);
    } else if (style === 'smooth') {
      return this.addSmoothBar(parent, width, height, colors, validRatio, thin);
    } else {
      return this.addSquareBar(parent, width, height, totalSegments, colors, validRatio);
    }
  }

  addSquareBar(parent, width, height, totalSegments = 10, colors, ratio) {
    let segWidth, blockH;
    if (totalSegments <= 10) {
      segWidth = width < 135 ? Math.round(10 * this.SCALE) : Math.round(11 * this.SCALE);
      blockH = segWidth;
    } else {
      blockH = Math.round(height * 1.25);
      segWidth = Math.floor((width - 3.5 * this.SCALE * (totalSegments - 1)) / totalSegments);
    }

    const totalSegsW = segWidth * totalSegments;
    const gap = totalSegments > 1 ? Math.max(2, (width - totalSegsW) / (totalSegments - 1)) : 0;
    const actualTotalW = totalSegsW + gap * (totalSegments - 1);

    const bar = parent.addStack();
    bar.layoutHorizontally();
    bar.centerAlignContent();
    bar.size = new Size(actualTotalW, blockH);
    bar.setPadding(0, 0, 0, 0);

    const corner = Math.max(2.5 * this.SCALE, Math.round(blockH * 0.22));
    const bgCol = this.getProgressBarBgColor();

    const exact = Math.max(0, Math.min(totalSegments, ratio * totalSegments));

    for (let i = 0; i < totalSegments; i++) {
      const seg = bar.addStack();
      seg.size = new Size(segWidth, blockH);
      seg.cornerRadius = corner;
      seg.setPadding(0, 0, 0, 0);

      const segProgress = Math.max(0, Math.min(1.0, exact - i));
      const segColor = this.colorAt(colors, (i + 0.5) / totalSegments);

      if (segProgress >= 0.98) {
        seg.backgroundColor = segColor;
      } else if (segProgress > 0.05) {
        seg.layoutHorizontally();
        seg.centerAlignContent();
        seg.backgroundColor = bgCol;

        const fillW = Math.max(1, Math.round(segWidth * segProgress));
        const fill = seg.addStack();
        fill.size = new Size(fillW, blockH);
        fill.cornerRadius = corner;
        fill.backgroundColor = segColor;
        fill.setPadding(0, 0, 0, 0);

        seg.addSpacer();
      } else {
        seg.backgroundColor = bgCol;
      }

      if (i < totalSegments - 1) {
        bar.addSpacer(gap);
      }
    }
    return bar;
  }

  addCapsuleBar(parent, width, height, totalSegments = 10, activeSegments = 7, colors) {
    const bar = parent.addStack();
    bar.layoutHorizontally();
    bar.centerAlignContent();
    bar.size = new Size(width, height);

    const gap = 3.5 * this.SCALE;
    const segWidth = (width - gap * (totalSegments - 1)) / totalSegments;
    const corner = height / 2;

    const bgCol = this.getProgressBarBgColor();

    for (let i = 0; i < totalSegments; i++) {
      const seg = bar.addStack();
      seg.size = new Size(segWidth, height);
      seg.cornerRadius = corner;
      seg.setPadding(0, 0, 0, 0);

      if (i < activeSegments) {
        seg.backgroundColor = this.colorAt(colors, (i + 0.5) / totalSegments);
      } else {
        seg.backgroundColor = bgCol;
      }

      if (i < totalSegments - 1) {
        bar.addSpacer(gap);
      }
    }
    return bar;
  }

  addSmoothBar(parent, width, height, colors, ratio, thin) {
    const slotH = Math.max(1, Math.round(height));
    const barW = Math.max(slotH, Math.round(width));
    const barH = Math.max(1, Math.round(thin ? slotH * 0.72 : slotH));

    const slot = parent.addStack();
    slot.layoutHorizontally();
    slot.centerAlignContent();
    slot.size = new Size(barW, slotH);
    slot.setPadding(0, 0, 0, 0);

    const bar = slot.addStack();
    bar.layoutHorizontally();
    bar.centerAlignContent();
    bar.size = new Size(barW, barH);
    bar.setPadding(0, 0, 0, 0);
    bar.cornerRadius = barH / 2;
    bar.backgroundColor = this.getProgressBarBgColor();

    const validRatio = Math.max(0, Math.min(1, ratio));
    const activeWidth = Math.max(barH, Math.round(barW * validRatio));

    const img = bar.addImage(
      this.drawSmoothGradient(activeWidth, barH, colors, barH / 2, activeWidth)
    );
    img.imageSize = new Size(activeWidth, barH);
    img.respectSizingMode = true;

    bar.addSpacer();
    return slot;
  }

  drawSmoothGradient(activeW, h, colors, cornerRadius, totalW) {
    const W = totalW || activeW;
    const dc = new DrawContext();
    dc.size = new Size(W, h);
    dc.opaque = false;
    dc.respectScreenScale = true;

    const r = Math.max(0, Math.min(cornerRadius, h / 2));
    const solid = !colors || colors.gradient === false;
    const solidColor = solid ? this.colorAt(colors, 0.5) : null;

    const COL_STEP = 1;
    const rows = Math.max(1, Math.round(h * 2));
    const ROW_STEP = h / rows;
    const cols = Math.max(1, Math.ceil(W / COL_STEP));

    const capsuleInset = (yy, yTop, yBot, rad) => {
      if (yy < yTop + rad) {
        const dy = yTop + rad - yy;
        return rad - Math.sqrt(Math.max(0, rad * rad - dy * dy));
      }
      if (yy > yBot - rad) {
        const dy = yy - (yBot - rad);
        return rad - Math.sqrt(Math.max(0, rad * rad - dy * dy));
      }
      return 0;
    };

    const fillRad = Math.min(r, activeW / 2);

    for (let ri = 0; ri < rows; ri++) {
      const y = ri * ROW_STEP;
      if (y >= h) break;
      const rowH = Math.min(ROW_STEP, h - y);
      if (rowH <= 0) continue;

      const ySample = Math.min(y + ROW_STEP, h);
      const fIn = capsuleInset((y + ySample) / 2, 0, h, fillRad);
      const fillL = Math.max(0, fIn);
      const fillR = Math.max(fillL, activeW - fIn);
      if (fillR <= fillL) continue;

      for (let ci = 0; ci < cols; ci++) {
        const gx0 = ci * COL_STEP;
        const gx1 = Math.min(gx0 + COL_STEP, W);
        const fx0 = Math.max(gx0, fillL);
        const fx1 = Math.min(gx1, fillR);
        if (fx1 <= fx0) continue;

        const t = this.colorRatioAt(fx0, fx1, activeW);
        dc.setFillColor(solid ? solidColor : this.colorAt(colors, t));
        dc.fillRect(new Rect(fx0, y, fx1 - fx0, rowH));
      }
    }

    return dc.getImage();
  }

  colorRatioAt(x0, x1, activeW) {
    if (!(activeW > 0)) return 0;
    const t = (x0 + x1) / 2 / activeW;
    return t < 0 ? 0 : (t > 1 ? 1 : t);
  }

  colorRatioAt(x0, x1, activeW) {
    if (!(activeW > 0)) return 0;
    const t = (x0 + x1) / 2 / activeW;
    return t < 0 ? 0 : (t > 1 ? 1 : t);
  }

  async render() {
    await this.init();
    const widget = new ListWidget();
    await this.getWidgetBackgroundImage(widget);
    this.widgetColor = this.getColor();

    const intervalMin = parseInt(this.settings.interval) || 360;
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * intervalMin);

    if (!this.settings.custCode || !this.settings.xMasAppInfo) {
      return this.renderGuideWidget(widget);
    }

    if (!this.gasData) {
      return this.renderErrorWidget(widget);
    }

    if (this.widgetFamily === 'medium') {
      return await this.renderMedium(widget);
    } else if (this.widgetFamily === 'large') {
      return await this.renderLarge(widget);
    } else {
      return await this.renderSmall(widget);
    }
  }

  async renderSmall(w) {
    const pX = 14 * this.SCALE;
    const pY = 12 * this.SCALE;
    w.setPadding(pY, pX, pY, pX);
    w.backgroundColor = this.getWidgetBgColor();

    const d = this.gasData || {};
    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    const balanceColor = this.getBalanceTextColor(isOwe);
    const subColor = Color.dynamic(new Color('#6B7280'), new Color('#9CA3AF'));

    const body = w.addStack();
    body.layoutVertically();

    const header = body.addStack();
    header.centerAlignContent();

    const logoImg = await this.getLogoImage();
    if (logoImg) {
      const icon = header.addImage(logoImg);
      icon.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
      icon.cornerRadius = 3 * this.SCALE;
    } else {
      const flame = SFSymbol.named('flame.fill');
      flame.applyHeavyWeight();
      const icon = header.addImage(flame.image);
      icon.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
      icon.tintColor = new Color('#FF5722');
    }
    header.addSpacer(5);

    const title = header.addText(this.settings.alias || '中燃在线');
    title.font = Font.boldSystemFont(14 * this.SCALE);
    title.textColor = this.widgetColor;

    header.addSpacer();

    const statePill = header.addStack();
    statePill.centerAlignContent();
    statePill.backgroundColor = this.getCardBgColor();
    statePill.cornerRadius = 6 * this.SCALE;
    statePill.setPadding(2 * this.SCALE, 6 * this.SCALE, 2 * this.SCALE, 6 * this.SCALE);

    const isOweDot = d.oweMoney && parseFloat(d.oweMoney) > 0;
    const dotHex = this.getGlowHex(isOweDot);
    const glowImg = statePill.addImage(this.drawGlowDot(dotHex, Math.round(36 * this.SCALE)));
    glowImg.imageSize = new Size(13 * this.SCALE, 13 * this.SCALE);

    statePill.addSpacer(2 * this.SCALE);

    const stateText = statePill.addText(isOweDot ? '欠费' : (this.isOffline ? '离线' : '正常'));
    stateText.font = Font.systemFont(10.5 * this.SCALE);
    stateText.textColor = subColor;

    body.addSpacer();

    const labelRow = body.addStack();
    labelRow.centerAlignContent();
    const balLabel = labelRow.addText(isOwe ? '燃气欠费' : '账户余额');
    balLabel.font = Font.mediumSystemFont(12 * this.SCALE);
    balLabel.textColor = isOwe ? new Color('#EF4444') : subColor;

    body.addSpacer(2 * this.SCALE);

    const valRow = body.addStack();
    valRow.centerAlignContent();
    const symText = valRow.addText('¥ ');
    symText.font = Font.boldRoundedSystemFont(23 * this.SCALE);
    symText.textColor = isOwe ? new Color('#EF4444') : balanceColor;

    const valText = valRow.addText(this.formatMoney(d.countMoney || d.newCountMoney || '0.00'));
    valText.font = Font.boldRoundedSystemFont(26 * this.SCALE);
    valText.textColor = isOwe ? new Color('#EF4444') : balanceColor;
    valText.lineLimit = 1;
    valText.minimumScaleFactor = 0.6;

    const usageS = this.getYesterdayUsageInfo();
    if (usageS) {
      const uWrap = valRow.addStack();
      uWrap.layoutVertically();
      uWrap.setPadding(0, 3 * this.SCALE, 0, 0);
      uWrap.addSpacer(8 * this.SCALE);
      const uTxt = uWrap.addText(this.limitUsageDigits(usageS, 3));
      uTxt.font = Font.systemFont(11 * this.SCALE);
      uTxt.textColor = this.getUsageColor(usageS);
      uTxt.lineLimit = 1;
      uTxt.minimumScaleFactor = 0.7;
      uTxt.rightAlignText();
    }

    body.addSpacer(6 * this.SCALE);

    const ratio = this.getBalanceRatio();
    const barColors = this.getBarColors(ratio, isOwe);
    const smallW = this.getWidgetSmallWidth();
    const contentW = (smallW - 2 * 14) * this.SCALE;
    this.addProgressBar(body, contentW, 6.5 * this.SCALE, 10, barColors, ratio);

    body.addSpacer();

    const footerCard = body.addStack();
    footerCard.layoutVertically();
    footerCard.backgroundColor = this.getCardBgColor();
    footerCard.cornerRadius = 8 * this.SCALE;
    footerCard.setPadding(6 * this.SCALE, 8 * this.SCALE, 6 * this.SCALE, 8 * this.SCALE);

    const fRow1 = footerCard.addStack();
    fRow1.centerAlignContent();
    const gIcon = SFSymbol.named('gauge.badge.plus');
    const gImg = fRow1.addImage(gIcon.image);
    gImg.imageSize = new Size(11 * this.SCALE, 11 * this.SCALE);
    gImg.tintColor = new Color('#3B82F6');
    fRow1.addSpacer(3);

    const mLabel = fRow1.addText('抄表: ');
    mLabel.font = Font.systemFont(10.5 * this.SCALE);
    mLabel.textColor = subColor;
    const mText = fRow1.addText(`${d.lastRecord || '0'} m³`);
    mText.font = Font.systemFont(10.5 * this.SCALE);
    mText.textColor = this.widgetColor;
    fRow1.addSpacer();

    let meterDate = '--';
    if (d.lastRecordTime) {
      const p = String(d.lastRecordTime).match(/(\d{4})[\-\/\.](\d{1,2})[\-\/\.](\d{1,2})/);
      if (p) meterDate = `${p[2]}-${p[3]}`;
      else {
        const m = String(d.lastRecordTime).match(/(\d{1,2})[\-\/\.](\d{1,2})/);
        meterDate = m ? `${m[1]}-${m[2]}` : String(d.lastRecordTime);
      }
    }
    const meterDateText = fRow1.addText(meterDate);
    meterDateText.font = Font.systemFont(10.5 * this.SCALE);
    meterDateText.textColor = this.widgetColor;

    footerCard.addSpacer(3 * this.SCALE);

    const fRow2 = footerCard.addStack();
    fRow2.centerAlignContent();
    const idIcon = SFSymbol.named('creditcard');
    const idImg = fRow2.addImage(idIcon.image);
    idImg.imageSize = new Size(11 * this.SCALE, 11 * this.SCALE);
    idImg.tintColor = new Color('#F59E0B');
    fRow2.addSpacer(3);

    const ccLabel = fRow2.addText('户号: ');
    ccLabel.font = Font.systemFont(10.5 * this.SCALE);
    ccLabel.textColor = subColor;
    const custCodeText = fRow2.addText(this.formatCustCode(d.custCode, true));
    custCodeText.font = Font.systemFont(10.5 * this.SCALE);
    custCodeText.textColor = this.widgetColor;
    fRow2.addSpacer();

    const syncIcon = SFSymbol.named('clock.arrow.circlepath');
    const syncImg = fRow2.addImage(syncIcon.image);
    syncImg.imageSize = new Size(10 * this.SCALE, 10 * this.SCALE);
    syncImg.tintColor = subColor;
    fRow2.addSpacer(2);

    const timeText = fRow2.addText(d._fetchTime || '刚刚');
    timeText.font = Font.systemFont(10.5 * this.SCALE);
    timeText.textColor = this.widgetColor;

    return w;
  }

  async renderMedium(w) {
    const pX = 16 * this.SCALE;
    const pY = 12 * this.SCALE;
    w.setPadding(0, 0, 0, 0);

    const cardBg = this.getCardBgColor();
    const widgetBg = this.getWidgetBgColor();
    w.backgroundColor = cardBg;

    const d = this.gasData || {};
    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    const balanceColor = this.getBalanceTextColor(isOwe);
    const subColor = Color.dynamic(new Color('#6B7280'), new Color('#9CA3AF'));

    const body = w.addStack();
    body.layoutHorizontally();

    const left = body.addStack();
    left.layoutVertically();
    left.backgroundColor = widgetBg;
    left.setPadding(pY, 14 * this.SCALE, pY, 14 * this.SCALE);
    left.size = new Size(172 * this.SCALE, 0);

    const lHeader = left.addStack();
    lHeader.centerAlignContent();
    const logoImg = await this.getLogoImage();
    if (logoImg) {
      const fImg = lHeader.addImage(logoImg);
      fImg.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
      fImg.cornerRadius = 3 * this.SCALE;
    } else {
      const flame = SFSymbol.named('flame.fill');
      flame.applyHeavyWeight();
      const fImg = lHeader.addImage(flame.image);
      fImg.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
      fImg.tintColor = new Color('#FF5722');
    }
    lHeader.addSpacer(5);
    const lTitle = lHeader.addText(this.settings.alias || '中燃在线');
    lTitle.font = Font.boldSystemFont(14 * this.SCALE);
    lTitle.textColor = this.widgetColor;

    left.addSpacer();

    const balLabel = left.addText(isOwe ? '账户燃气欠费' : '账户气费余额');
    balLabel.font = Font.mediumSystemFont(12 * this.SCALE);
    balLabel.textColor = isOwe ? new Color('#EF4444') : subColor;

    left.addSpacer(2 * this.SCALE);

    const valRow = left.addStack();
    valRow.centerAlignContent();
    const symText = valRow.addText('¥ ');
    symText.font = Font.boldRoundedSystemFont(23 * this.SCALE);
    symText.textColor = isOwe ? new Color('#EF4444') : balanceColor;

    const valText = valRow.addText(this.formatMoney(d.countMoney || d.newCountMoney || '0.00'));
    valText.font = Font.boldRoundedSystemFont(26 * this.SCALE);
    valText.textColor = isOwe ? new Color('#EF4444') : balanceColor;
    valText.lineLimit = 1;
    valText.minimumScaleFactor = 0.6;

    const usageM = this.getYesterdayUsageInfo();
    if (usageM) {
      const uWrapM = valRow.addStack();
      uWrapM.layoutVertically();
      uWrapM.setPadding(0, 3 * this.SCALE, 0, 0);
      uWrapM.addSpacer(8 * this.SCALE);
      const uTxtM = uWrapM.addText(this.limitUsageDigits(usageM, 3));
      uTxtM.font = Font.systemFont(11 * this.SCALE);
      uTxtM.textColor = this.getUsageColor(usageM);
      uTxtM.lineLimit = 1;
      uTxtM.minimumScaleFactor = 0.7;
      uTxtM.rightAlignText();
    }

    left.addSpacer(7 * this.SCALE);

    const ratio = this.getBalanceRatio();
    const barColors = this.getBarColors(ratio, isOwe);
    this.addProgressBar(left, 144 * this.SCALE, 11 * this.SCALE, 10, barColors, ratio, true);

    left.addSpacer();

    const stateRow = left.addStack();
    stateRow.centerAlignContent();

    const mDotHex = this.getGlowHex(isOwe);
    const mGlowImg = stateRow.addImage(this.drawGlowDot(mDotHex, Math.round(36 * this.SCALE)));
    mGlowImg.imageSize = new Size(13 * this.SCALE, 13 * this.SCALE);

    stateRow.addSpacer(3 * this.SCALE);

    const stateText = stateRow.addText(isOwe ? '账户已欠费 · 请及时充值' : (this.isOffline ? '离线保持 · 数据为上次缓存' : '管网连接正常 · 气压稳定'));
    stateText.font = Font.systemFont(11 * this.SCALE);
    stateText.textColor = subColor;

    const divider = body.addStack();
    divider.size = new Size(1, 0);
    divider.backgroundColor = Color.dynamic(new Color('#E5E7EB'), new Color('#2C2C2E'));

    const right = body.addStack();
    right.layoutVertically();
    right.setPadding(pY, 14 * this.SCALE, pY, pX);

    const rTop = right.addStack();
    rTop.centerAlignContent();
    const syncBox = rTop.addStack();
    syncBox.size = new Size(13 * this.SCALE, 13 * this.SCALE);
    syncBox.centerAlignContent();
    const syncSymbol = SFSymbol.named('arrow.triangle.2.circlepath');
    const syncImg = syncBox.addImage(syncSymbol.image);
    syncImg.imageSize = new Size(11 * this.SCALE, 11 * this.SCALE);
    syncImg.tintColor = subColor;
    rTop.addSpacer(4);
    const stLabel = rTop.addText(d._fetchTime ? '更新时间 ' : '');
    stLabel.font = Font.systemFont(11 * this.SCALE);
    stLabel.textColor = subColor;
    const syncTime = rTop.addText(d._fetchTime || '实时同步');
    syncTime.font = Font.systemFont(11 * this.SCALE);
    syncTime.textColor = this.widgetColor;
    rTop.addSpacer();

    right.addSpacer();

    this.createTechRow(right, 'person.crop.rectangle', '客户户号', `${d.custName || '--'} (${this.formatCustCode(d.custCode, true)})`, new Color('#F59E0B'), subColor);
    right.addSpacer();

    this.createTechRow(right, 'speedometer', '上次抄表', `${d.lastRecord || '0'} m³`, new Color('#3B82F6'), subColor);
    right.addSpacer();

    this.createTechRow(right, 'calendar.badge.clock', '抄表日期', d.lastRecordTime || '近期已抄表', new Color('#8B5CF6'), subColor);
    right.addSpacer();

    this.createTechRow(right, 'building.2', '服务单位', this.formatCompName(d.compName, false), new Color('#10B981'), subColor);

    return w;
  }

  createTechRow(parent, iconName, label, valStr, iconCol, subCol) {
    const row = parent.addStack();
    row.centerAlignContent();

    const iconBox = row.addStack();
    iconBox.size = new Size(13 * this.SCALE, 13 * this.SCALE);
    iconBox.centerAlignContent();
    const sym = SFSymbol.named(iconName);
    const img = iconBox.addImage(sym.image);
    img.imageSize = new Size(12 * this.SCALE, 12 * this.SCALE);
    img.tintColor = iconCol;
    row.addSpacer(4);

    const lText = row.addText(label);
    lText.font = Font.systemFont(11.5 * this.SCALE);
    lText.textColor = subCol;
    row.addSpacer(6);

    const vText = row.addText(valStr);
    vText.font = Font.semiboldSystemFont(12 * this.SCALE);
    vText.textColor = this.widgetColor;
    vText.lineLimit = 1;
    vText.minimumScaleFactor = 0.7;
    row.addSpacer();
  }

  async renderLarge(w) {
    const pX = 16 * this.SCALE;
    const pY = 14 * this.SCALE;
    w.setPadding(pY, pX, pY, pX);
    w.backgroundColor = this.getWidgetBgColor();

    const widgetW = this.getWidgetLargeWidth();
    const contentW = widgetW - 2 * pX;

    const d = this.gasData || {};
    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    const balanceColor = this.getBalanceTextColor(isOwe);
    const subColor = Color.dynamic(new Color('#6B7280'), new Color('#9CA3AF'));

    const body = w.addStack();
    body.layoutVertically();

    const header = body.addStack();
    header.centerAlignContent();
    header.size = new Size(contentW, 0);

    const logoImg = await this.getLogoImage();
    if (logoImg) {
      const fImg = header.addImage(logoImg);
      fImg.imageSize = new Size(20 * this.SCALE, 20 * this.SCALE);
      fImg.cornerRadius = 4 * this.SCALE;
    } else {
      const flame = SFSymbol.named('flame.fill');
      flame.applyHeavyWeight();
      const fImg = header.addImage(flame.image);
      fImg.imageSize = new Size(20 * this.SCALE, 20 * this.SCALE);
      fImg.tintColor = new Color('#FF5722');
    }
    header.addSpacer(6);

    const title = header.addText(this.settings.alias || '中国燃气在线监控');
    title.font = Font.boldSystemFont(16 * this.SCALE);
    title.textColor = this.widgetColor;
    header.addSpacer();

    const tagBadge = header.addStack();
    tagBadge.centerAlignContent();
    tagBadge.backgroundColor = this.getCardBgColor();
    tagBadge.cornerRadius = 6 * this.SCALE;
    tagBadge.setPadding(3 * this.SCALE, 8 * this.SCALE, 3 * this.SCALE, 8 * this.SCALE);

    if (!this.isOffline) {
      const syncSym = SFSymbol.named('arrow.triangle.2.circlepath');
      const syncImg = tagBadge.addImage(syncSym.image);
      syncImg.imageSize = new Size(10 * this.SCALE, 10 * this.SCALE);
      syncImg.tintColor = subColor;
      tagBadge.addSpacer(3 * this.SCALE);
    }

    const tag = tagBadge.addText(this.isOffline ? '离线模式' : `更新时间 ${d._fetchTime || '刚刚'}`);
    tag.font = Font.semiboldSystemFont(11 * this.SCALE);
    tag.textColor = this.isOffline ? new Color('#0EA5E9') : subColor;

    body.addSpacer();

    const card = body.addStack();
    card.layoutVertically();
    card.size = new Size(contentW, 0);
    card.backgroundColor = this.getCardBgColor();
    card.cornerRadius = 14 * this.SCALE;
    card.setPadding(12 * this.SCALE, 16 * this.SCALE, 12 * this.SCALE, 16 * this.SCALE);

    const cLabel = card.addText(isOwe ? '账户欠费总额' : '当前账户可用气费余额');
    cLabel.font = Font.mediumSystemFont(12.5 * this.SCALE);
    cLabel.textColor = isOwe ? new Color('#EF4444') : subColor;

    card.addSpacer(3 * this.SCALE);

    const cValRow = card.addStack();
    cValRow.centerAlignContent();
    const cSym = cValRow.addText('¥ ');
    cSym.font = Font.boldRoundedSystemFont(29 * this.SCALE);
    cSym.textColor = isOwe ? new Color('#EF4444') : balanceColor;

    const val = cValRow.addText(this.formatMoney(d.countMoney || d.newCountMoney || '0.00'));
    val.font = Font.boldRoundedSystemFont(32 * this.SCALE);
    val.textColor = isOwe ? new Color('#EF4444') : balanceColor;
    val.lineLimit = 1;
    val.minimumScaleFactor = 0.75;

    const usageL = this.getYesterdayUsageInfo();
    if (usageL) {
      const uWrapL = cValRow.addStack();
      uWrapL.layoutVertically();
      uWrapL.setPadding(0, 4 * this.SCALE, 0, 0);
      uWrapL.addSpacer(8 * this.SCALE);
      const uTxtL = uWrapL.addText(usageL.arrow + ' ' + usageL.text);
      uTxtL.font = Font.systemFont(14 * this.SCALE);
      uTxtL.textColor = this.getUsageColor(usageL);
      uTxtL.lineLimit = 1;
      uTxtL.minimumScaleFactor = 1;
    }

    card.addSpacer(7 * this.SCALE);

    const barW = Math.max(260 * this.SCALE, contentW - 32 * this.SCALE);

    const ratio = this.getBalanceRatio();
    const barColors = this.getBarColors(ratio, isOwe);
    this.addProgressBar(card, barW, 8 * this.SCALE, 14, barColors, ratio);

    body.addSpacer();

    const grid = body.addStack();
    grid.layoutHorizontally();
    grid.size = new Size(contentW, 0);

    const gap = 8 * this.SCALE;
    const colW = Math.floor((contentW - 2 * gap) / 3);
    const realGap = (contentW - 3 * colW) / 2;
    const innerW = colW - 18 * this.SCALE;
    const cardH = 54 * this.SCALE;

    const cardA = grid.addStack();
    cardA.layoutVertically();
    cardA.backgroundColor = this.getCardBgColor();
    cardA.cornerRadius = 10 * this.SCALE;
    cardA.setPadding(9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE);
    cardA.size = new Size(colW, cardH);

    const aHead = cardA.addStack();
    aHead.centerAlignContent();
    aHead.size = new Size(innerW, 0);
    aHead.addSpacer();
    const aIcon = SFSymbol.named('speedometer');
    const aImg = aHead.addImage(aIcon.image);
    aImg.imageSize = new Size(12 * this.SCALE, 12 * this.SCALE);
    aImg.tintColor = new Color('#3B82F6');
    aHead.addSpacer(3 * this.SCALE);
    const aTitle = aHead.addText('上次抄表读数');
    aTitle.font = Font.systemFont(10 * this.SCALE);
    aTitle.textColor = subColor;
    aTitle.lineLimit = 1;
    aTitle.minimumScaleFactor = 0.7;
    aHead.addSpacer();

    cardA.addSpacer(4 * this.SCALE);
    const aValRow = cardA.addStack();
    aValRow.centerAlignContent();
    aValRow.size = new Size(innerW, 0);
    const aVal = aValRow.addText(`${d.lastRecord || '0'} m³`);
    aVal.font = Font.boldRoundedSystemFont(14 * this.SCALE);
    aVal.textColor = this.widgetColor;
    aVal.lineLimit = 1;
    aVal.minimumScaleFactor = 0.95;
    aVal.centerAlignText();
    aVal.size = new Size(innerW, 0);

    grid.addSpacer(realGap);

    const cardB = grid.addStack();
    cardB.layoutVertically();
    cardB.backgroundColor = this.getCardBgColor();
    cardB.cornerRadius = 10 * this.SCALE;
    cardB.setPadding(9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE);
    cardB.size = new Size(colW, cardH);

    const bHead = cardB.addStack();
    bHead.centerAlignContent();
    bHead.size = new Size(innerW, 0);
    bHead.addSpacer();
    const bIcon = SFSymbol.named('calendar.badge.clock');
    const bImg = bHead.addImage(bIcon.image);
    bImg.imageSize = new Size(12 * this.SCALE, 12 * this.SCALE);
    bImg.tintColor = new Color('#8B5CF6');
    bHead.addSpacer(3 * this.SCALE);
    const bTitle = bHead.addText('抄表核算日期');
    bTitle.font = Font.systemFont(10 * this.SCALE);
    bTitle.textColor = subColor;
    bTitle.lineLimit = 1;
    bTitle.minimumScaleFactor = 0.7;
    bHead.addSpacer();

    cardB.addSpacer(4 * this.SCALE);
    const bValRow = cardB.addStack();
    bValRow.centerAlignContent();
    bValRow.size = new Size(innerW, 0);
    const bVal = bValRow.addText(d.lastRecordTime || '近期已核算');
    bVal.font = Font.boldRoundedSystemFont(14 * this.SCALE);
    bVal.textColor = this.widgetColor;
    bVal.lineLimit = 1;
    bVal.minimumScaleFactor = 0.95;
    bVal.centerAlignText();
    bVal.size = new Size(innerW, 0);

    grid.addSpacer(realGap);

    const cardC = grid.addStack();
    cardC.layoutVertically();
    cardC.backgroundColor = this.getCardBgColor();
    cardC.cornerRadius = 10 * this.SCALE;
    cardC.setPadding(9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE);
    cardC.size = new Size(colW, cardH);

    const cHead = cardC.addStack();
    cHead.centerAlignContent();
    cHead.size = new Size(innerW, 0);
    cHead.addSpacer();
    const cIcon = SFSymbol.named('waveform.path.ecg');
    const cImg = cHead.addImage(cIcon.image);
    cImg.imageSize = new Size(12 * this.SCALE, 12 * this.SCALE);
    const statusCol = isOwe ? new Color('#EF4444') : (this.isOffline ? new Color('#0EA5E9') : new Color('#10B981'));
    cImg.tintColor = statusCol;
    cHead.addSpacer(3 * this.SCALE);
    const cTitle = cHead.addText('管网监控状态');
    cTitle.font = Font.systemFont(10 * this.SCALE);
    cTitle.textColor = subColor;
    cTitle.lineLimit = 1;
    cTitle.minimumScaleFactor = 0.7;
    cHead.addSpacer();

    cardC.addSpacer(4 * this.SCALE);
    const cStatusRow = cardC.addStack();
    cStatusRow.centerAlignContent();
    cStatusRow.size = new Size(innerW, 0);
    cStatusRow.addSpacer();

    const lDotHex = this.getGlowHex(isOwe);
    const lGlowImg = cStatusRow.addImage(this.drawGlowDot(lDotHex, Math.round(36 * this.SCALE)));
    lGlowImg.imageSize = new Size(13 * this.SCALE, 13 * this.SCALE);

    cStatusRow.addSpacer(3 * this.SCALE);

    const cValText = isOwe ? '账户欠费' : (this.isOffline ? '离线保持' : '气压稳定');
    const cVal = cStatusRow.addText(cValText);
    cVal.font = Font.boldRoundedSystemFont(12 * this.SCALE);
    cVal.textColor = this.widgetColor;
    cVal.lineLimit = 1;
    cVal.minimumScaleFactor = 0.95;
    cStatusRow.addSpacer();

    body.addSpacer();

    const listCard = body.addStack();
    listCard.layoutVertically();
    listCard.size = new Size(contentW, 0);
    listCard.backgroundColor = this.getCardBgColor();
    listCard.cornerRadius = 10 * this.SCALE;
    listCard.setPadding(10 * this.SCALE, 14 * this.SCALE, 10 * this.SCALE, 14 * this.SCALE);

    this.createTechRow(listCard, 'person.crop.rectangle', '客户姓名', d.custName || '--', new Color('#F59E0B'), subColor);
    listCard.addSpacer(6 * this.SCALE);
    this.createTechRow(listCard, 'number', '燃气户号', this.formatCustCode(d.custCode), new Color('#F59E0B'), subColor);
    listCard.addSpacer(6 * this.SCALE);
    this.createTechRow(listCard, 'building.2', '服务单位', this.formatCompName(d.compName, true), new Color('#10B981'), subColor);
    listCard.addSpacer(6 * this.SCALE);
    this.createTechRow(listCard, 'phone.badge.waveform', '全国客服热线', '95007', new Color('#EF5350'), subColor);

    return w;
  }

  renderGuideWidget(w) {
    w.setPadding(16, 16, 16, 16);
    w.backgroundColor = this.getWidgetBgColor();
    const center = w.addStack();
    center.layoutVertically();
    center.centerAlignContent();

    const title = center.addText('China Gas');
    title.font = Font.boldSystemFont(16);
    title.textColor = new Color('#FF9500');

    center.addSpacer(8);

    const tip = center.addText('未检测到凭证配置');
    tip.font = Font.boldSystemFont(13);
    tip.textColor = this.widgetColor;

    center.addSpacer(4);

    const desc = center.addText('请点击打开组件，在【账户设置】中输入参数或使用剪贴板智能解析。');
    desc.font = Font.systemFont(12);
    desc.textColor = new Color('#9CA3AF');
    desc.centerAlignText();

    return w;
  }

  renderErrorWidget(w) {
    w.setPadding(16, 16, 16, 16);
    w.backgroundColor = this.getWidgetBgColor();
    const center = w.addStack();
    center.layoutVertically();
    center.centerAlignContent();

    const title = center.addText('数据连接失败');
    title.font = Font.boldSystemFont(15);
    title.textColor = new Color('#EF4444');

    center.addSpacer(6);

    const msg = center.addText('网络超时且无离线缓存，请检查网络或重新配置凭证。');
    msg.font = Font.systemFont(12);
    msg.textColor = new Color('#9CA3AF');
    msg.centerAlignText();

    return w;
  }

  async promptInput(title, desc, key, placeholder) {
    const a = new Alert();
    a.title = String(title || '');
    a.message = String(desc || '');
    const cur = String(this.settings[key] || '');
    a.addTextField(String(placeholder || ''), cur);
    a.addAction('确定');
    a.addCancelAction('取消');
    const res = await a.presentAlert();
    if (res === 0) {
      this.settings[key] = String(a.textFieldValue(0) || '').trim();
      this.saveSettings(false);
    }
  }

  async showHelpGuide() {
    const a = new Alert();
    a.title = '中燃抓包指引';
    a.message = [
      '1. 开启手机抓包软件 (Surge / Loon / Quantumult X)；',
      '2. 打开微信进入【中燃在线】小程序并点击查询或我的；',
      '3. 筛选主机包含 zrds.95007.com 的请求；',
      '4. 复制该请求的 cURL 或请求头；',
      '5. 返回此处点击【剪贴板一键智能解析】即可全自动填入。'
    ].join('\n\n');
    a.addAction('我知道了');
    await a.presentAlert();
  }

  setAccountConfig = async () => {
    return this.renderAppView([
      {
        title: '账户凭证与抓包配置',
        menu: [
          {
            icon: { name: 'questionmark.circle', color: '#3B82F6' },
            type: 'input',
            name: 'help_guide',
            val: 'help_guide',
            title: '抓包指引与帮助',
            desc: '查看如何抓包获取中燃凭证',
            onClick: async () => {
              await this.showHelpGuide();
            }
          },
          {
            icon: { name: 'doc.on.clipboard', color: '#10B981' },
            type: 'input',
            name: 'parse_clipboard',
            val: 'parse_clipboard',
            title: '剪贴板一键智能解析',
            desc: '复制抓包后点击自动提取所有参数',
            onClick: async () => {
              await this.parseClipboardCurl();
            }
          },
          {
            icon: { name: 'message.fill', color: '#07C160' },
            type: 'input',
            name: 'open_zrxcx',
            val: 'open_zrxcx',
            title: '打开微信搜索（中燃在线）',
            desc: '跳转微信搜索页，手动点开小程序',
            onClick: () => {
              Safari.open('weixin://');
            }
          },
          {
            icon: { name: 'number', color: '#F59E0B' },
            type: 'input',
            title: '燃气户号 (custCode)',
            desc: this.settings.custCode ? `当前: ${this.settings.custCode}` : '未配置 (点击输入)',
            val: 'custCode',
            onClick: async () => {
              await this.promptInput('燃气户号', '请输入 10 位燃气客户编号 (如 5127876503)', 'custCode', '5127876503');
              this.reopenScript();
            }
          },
          {
            icon: { name: 'person.crop.rectangle', color: '#8B5CF6' },
            type: 'input',
            title: '客户姓名 (custName)',
            desc: this.settings.custName ? `当前: ${this.settings.custName}` : '未配置 (点击输入)',
            val: 'custName',
            onClick: async () => {
              await this.promptInput('客户姓名', '请输入带星号的客户姓名 (如 *MuTu哥哥)', 'custName', 'MuTu哥哥');
              this.reopenScript();
            }
          },
          {
            icon: { name: 'person.fill', color: '#06B6D4' },
            type: 'input',
            title: '微信用户 ID (userId)',
            desc: this.settings.userId ? `当前: ${this.settings.userId}` : '未配置 (点击输入)',
            val: 'userId',
            onClick: async () => {
              await this.promptInput('User ID', '请输入小程序请求头中的 userId (如 12560306)', 'userId', '12560306');
              this.reopenScript();
            }
          },
          {
            icon: { name: 'building.2.fill', color: '#10B981' },
            type: 'input',
            title: '服务单位 (compName)',
            desc: this.settings.customCompName ? `当前: ${this.settings.customCompName}` : '自动识别/默认 (点击输入实际单位)',
            val: 'customCompName',
            onClick: async () => {
              await this.promptInput('服务单位', '请输入实际所属服务单位 (如：长沙中燃城市燃气发展有限公司)', 'customCompName', '长沙中燃城市燃气发展有限公司');
              this.reopenScript();
            }
          },
          {
            icon: { name: 'key.fill', color: '#EC4899' },
            type: 'input',
            title: '登录凭证 (x-mas-app-info)',
            desc: this.settings.xMasAppInfo ? '已配置 (点击修改)' : '未配置 (点击输入)',
            val: 'xMasAppInfo',
            onClick: async () => {
              await this.promptInput('x-mas-app-info 凭据', '请粘贴抓包中的完整 x-mas-app-info', 'xMasAppInfo', 'aaahg...');
              this.reopenScript();
            }
          },
          {
            icon: { name: 'tag.fill', color: '#F97316' },
            type: 'input',
            title: '组件别名',
            desc: this.settings.alias || '中燃在线',
            val: 'alias',
            onClick: async () => {
              await this.promptInput('组件别名', '如：我家燃气、父母家、店面', 'alias', '我家燃气');
              this.reopenScript();
            }
          }
        ]
      }
    ]);
  };

  setShowConfig = async () => {
    const styleMap = {
      square: '圆角方块阵',
      capsule: '经典微胶囊',
      smooth: '一体无缝条',
    };
    const curKey = this.settings.progressStyle || 'square';
    const curLabel = styleMap[curKey] || '圆角方块阵';
    const yestOn = this.settings.showYestUsage === 'true';
    const yestDesc = yestOn
      ? (this.settings.yestBal ? `基准 ${this.settings.yestBal} 元` : '点我填昨日余额')
      : '未开启';

    return this.renderAppView([
      {
        title: '显示设置',
        menu: [
          {
            icon: { name: 'chart.bar.fill', color: '#3B82F6' },
            title: '进度条视觉款式',
            desc: `当前: ${curLabel}`,
            val: 'progressStyleItem',
            name: 'progressStyleItem',
            onClick: async () => {
              const alert = new Alert();
              alert.title = '选择进度条视觉款式';
              alert.message = '请选择小组件在桌面展示的进度条风格：';
              const styles = [
                { key: 'square', label: '圆角方块阵' },
                { key: 'capsule', label: '经典微胶囊' },
                { key: 'smooth', label: '一体无缝条' },
              ];
              styles.forEach(item => {
                const checked = (this.settings.progressStyle || 'square') === item.key ? '  ✓' : '';
                alert.addAction(item.label + checked);
              });
              alert.addCancelAction('取消');
              const res = await alert.presentSheet();
              if (res >= 0 && res < styles.length) {
                this.settings.progressStyle = styles[res].key;
                this.saveSettings(false);
                this.reopenScript();
              }
            }
          },
          {
            icon: { name: 'paintpalette.fill', color: '#F59E0B' },
            type: 'color',
            title: '进度条强调色(单色)',
            desc: '关闭进度条渐变时生效；欠费或余额为 0 时仍强制深红',
            defaultValue: '#FF9500',
            val: 'themeColor',
          },
          {
            icon: { name: 'speedometer', color: '#8B5CF6' },
            type: 'input',
            placeholder: '500',
            title: '满额基准额度 (元)',
            desc: '进度条 100% 对应的金额基准，默认500元',
            val: 'balanceLimit',
          },
          {
            icon: { name: 'arrow.up.left.and.arrow.down.right', color: '#EC4899' },
            type: 'input',
            placeholder: '1.0',
            title: '整体缩放比例',
            desc: `当前: ${this.settings.uiScale || '1.0'} (0.7 ~ 1.6)`,
            val: 'uiScale',
          },
          {
            icon: { name: 'slider.horizontal.3', color: '#FF9500' },
            type: 'switch',
            title: '进度条颜色渐变',
            desc: '开启按余额变换红-橙-黄-黄绿-薄荷绿 5 大色阶；关闭则用上方强调色',
            val: 'useGradientBar',
            defaultValue: 'true',
          },
          {
            icon: { name: 'paintbrush.fill', color: '#10B981' },
            type: 'switch',
            title: '余额颜色渐变',
            desc: '开启时余额数字跟随色带；关闭时使用标题文字色（浅色模式为黑色）',
            val: 'useGradientBalance',
            defaultValue: 'true',
          },
          {
            icon: { name: 'number.square.fill', color: '#3B82F6' },
            type: 'switch',
            title: '隐藏户号脱敏 (512****03)',
            val: 'maskCustCode',
            defaultValue: 'false',
          },
          {
            icon: { name: 'building.2', color: '#10B981' },
            type: 'switch',
            title: '隐藏服务单位脱敏 (中国燃气)',
            val: 'maskCompName',
            defaultValue: 'false',
          },
          {
            icon: { name: 'minus.circle.fill', color: '#EF4444' },
            type: 'switch',
            title: '显示昨日消耗数字',
            desc: `点击设置 · ${yestDesc}`,
            val: 'showYestUsage',
            defaultValue: 'false',
            onClick: async () => {
              await this.promptYestUsage();
            }
          },
          {
            icon: { name: 'arrow.counterclockwise', color: '#EF4444' },
            title: '重置默认状态',
            desc: '恢复显示配置、色阶渐变与额度为出厂默认值',
            val: 'reset_show_config',
            name: 'reset_show_config',
            onClick: async () => {
              const alert = new Alert();
              alert.title = '重置显示配置';
              alert.message = '确定将本页所有显示配置恢复为初始默认值吗？\n\n将重置：\n• 进度条样式\n• 两个渐变开关（均恢复开启）\n• 进度条强调色 → #FF9500（橙）\n• 脱敏开关\n• 满额基准、缩放比例\n• 昨日消耗显示（关闭并清空基准）';
              alert.addAction('确认重置');
              alert.addCancelAction('取消');
              const res = await alert.presentAlert();
              if (res === 0) {
                this.settings.useGradientBar = 'true';
                this.settings.useGradientBalance = 'true';
                this.settings.themeColor = '#FF9500';
                this.settings.maskCustCode = 'false';
                this.settings.maskCompName = 'false';
                this.settings.progressStyle = 'square';
                this.settings.balanceLimit = '500';
                this.settings.uiScale = '1';
                this.settings.showYestUsage = 'false';
                this.settings.yestBal = '';
                this.saveSettings(false);
                const s = new Alert();
                s.title = '重置成功';
                s.message = '显示配置已恢复为默认状态！';
                s.addAction('确定');
                await s.presentAlert();
                this.reopenScript();
              }
            }
          }
        ]
      }
    ]);
  };

  async promptYestUsage() {
    const isOn = this.settings.showYestUsage === 'true';
    const a = new Alert();
    a.title = '显示昨日消耗数字';
    a.message = isOn
      ? '当前已开启。可修改昨日基准余额，或直接关闭此功能。'
      : '开启后会在余额右侧显示昨日消耗。昨日余额可不填，次日联网后自动采集。';
    a.addTextField('昨日基准余额（可留空）', this.settings.yestBal || '');
    a.addAction('保存基准并开启');
    a.addAction(isOn ? '关闭此功能' : '先不开，仅存基准');
    a.addCancelAction('取消');
    const r = await a.presentAlert();
    if (r === 2 || r < 0) return;

    const raw = (a.textFieldValue(0) || '').trim();
    const v = parseFloat(raw);
    this.settings.yestBal = (isFinite(v) && v > 0) ? String(v) : '';

    if (r === 0) {
      this.settings.showYestUsage = 'true';
    } else if (r === 1 && isOn) {
      this.settings.showYestUsage = 'false';
    }
    this.saveSettings(false);

    const tip = new Alert();
    tip.title = '设置已更新';
    tip.message = `开关状态：${this.settings.showYestUsage === 'true' ? '已开启' : '已关闭'}\n昨日基准：${this.settings.yestBal ? this.settings.yestBal + ' 元' : '未填（次日自动采集）'}`;
    tip.addAction('好');
    await tip.presentAlert();
    this.reopenScript();
  }

  isNewerVersion(v1, v2) {
    if (!v1 || !v2) return false;
    const p1 = String(v1).split('.').map(Number);
    const p2 = String(v2).split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return true;
      if (num1 < num2) return false;
    }
    return false;
  }

  async fetchUpdateNotes(remoteVersion) {
    try {
      const req = new Request('https://api.github.com/repos/githubdulong/Script/commits?path=Scriptable/ChinaGas.js&per_page=10');
      req.timeoutInterval = 8;
      req.headers = { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Scriptable-ChinaGas' };
      const list = await req.loadJSON();
      if (!Array.isArray(list) || !list.length) return '';
      const target = list.find(c => String((c.commit && c.commit.message) || '').includes(remoteVersion)) || list[0];
      const raw = String((target.commit && target.commit.message) || '').trim();
      if (!raw) return '';
      const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);
      const subject = lines.shift() || '';
      const body = lines
        .map(s => s.replace(/^[-*•]\s*/, '').trim())
        .filter(s => s && !/^co-authored-by:/i.test(s));
      const items = body.length ? body : (subject ? [subject] : []);
      if (!items.length) return '';
      const shown = items.slice(0, 8).map(s => `• ${s}`).join('\n');
      const more = items.length > 8 ? `\n… 另有 ${items.length - 8} 条未显示` : '';
      const iso = String((target.commit && target.commit.author && target.commit.author.date) || '');
      let date = '';
      if (iso) {
        const dt = new Date(iso);
        if (!isNaN(dt.getTime())) {
          const pad = n => String(n).padStart(2, '0');
          date = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        }
      }
      return { text: shown + more, date };
    } catch (_) {
      return '';
    }
  }

  async getLogoImage() {
    if (this._logoImg !== undefined) return this._logoImg;
    const fm = FileManager.iCloud();
    const cachePath = fm.documentsDirectory() + '/images/ChinaGas/logo_cache.png';
    try {
      if (fm.fileExists(cachePath)) {
        const age = (Date.now() - fm.modificationDate(cachePath).getTime()) / 3600000;
        if (age < 168) {
          this._logoImg = fm.readImage(cachePath);
          if (this._logoImg) return this._logoImg;
        }
      }
    } catch (e) {}
    try {
      const req = new Request(this.logo);
      req.timeoutInterval = 10;
      const img = await req.loadImage();
      if (img) {
        this._logoImg = img;
        try {
          if (!fm.isFileStoredIniCloud(cachePath)) fm.createDirectory(fm.documentsDirectory() + '/images/ChinaGas', true);
          fm.writeImage(cachePath, img);
        } catch (e) {}
        return img;
      }
    } catch (e) {}
    this._logoImg = null;
    return null;
  }

  async checkAndUpdateScript() {
    const downloadUrl = 'https://raw.githubusercontent.com/githubdulong/Script/master/Scriptable/ChinaGas.js';
    const scriptName = Script.name() + '.js';

    try {
      const req = new Request(downloadUrl);
      req.timeoutInterval = 12;
      const newScriptContent = await req.loadString();

      if (!newScriptContent || !newScriptContent.includes('Widget')) {
        throw new Error('获取到的脚本内容异常，请检查网络或更新链接');
      }

      const versionMatch = newScriptContent.match(/version\s*=\s*['"]([0-9.]+)['"]/) || newScriptContent.match(/\*\s*版本号:\s*v?([0-9.]+)/);
      const remoteVersion = versionMatch ? versionMatch[1] : '';

      this.settings.lastUpdateCheckTime = Date.now();
      this.saveSettings(false);

      if (this.isNewerVersion(remoteVersion, this.version)) {
        const noteInfo = await this.fetchUpdateNotes(remoteVersion);
        let detail = `当前版本：v${this.version}\n最新版本：v${remoteVersion}`;
        if (noteInfo && noteInfo.text) {
          detail += `\n\n【更新内容】\n${noteInfo.text}`;
          if (noteInfo.date) detail += `\n\n ${noteInfo.date}`;
        } else {
          detail += `\n\n【更新内容】\n暂未获取到说明，可前往仓库查看`;
        }
        detail += `\n\n请选择操作：`;
        const alert = new Alert();
        alert.title = `检测到新版本 v${remoteVersion}`;
        alert.message = detail;
        alert.addAction('立即更新');
        alert.addAction('忽略此版');
        alert.addCancelAction('取消');

        const response = await alert.presentAlert();
        if (response === 0) {
          const fm = FileManager[
            module.filename.includes('Documents/iCloud~') ? 'iCloud' : 'local'
          ]();
          const scriptPath = fm.documentsDirectory() + `/${scriptName}`;
          fm.writeString(scriptPath, newScriptContent);

          delete this.settings.ignoredVersion;
          delete this.settings.notifiedVersion;
          this.saveSettings(false);

          const successAlert = new Alert();
          successAlert.title = '更新成功';
          successAlert.message = `脚本已更新至 v${remoteVersion}，请重新打开运行！`;
          successAlert.addAction('确定');
          await successAlert.present();
          this.reopenScript();
        } else if (response === 1) {
          this.settings.ignoredVersion = remoteVersion;
          this.saveSettings(false);

          const ignoreAlert = new Alert();
          ignoreAlert.title = '已忽略此版本';
          ignoreAlert.message = `已忽略 v${remoteVersion} 的日常更新提醒。若日后需要更新，仍可随时在此点击"脚本更新"。`;
          ignoreAlert.addAction('确定');
          await ignoreAlert.present();
        }
      } else {
        if (this.settings.ignoredVersion) {
          delete this.settings.ignoredVersion;
          delete this.settings.notifiedVersion;
          this.saveSettings(false);
        }
        const noUpdateAlert = new Alert();
        noUpdateAlert.title = '无需更新';
        noUpdateAlert.message = `当前已是最新版本 (v${this.version})。`;
        noUpdateAlert.addAction('确定');
        await noUpdateAlert.present();
      }
    } catch (e) {
      const errAlert = new Alert();
      errAlert.title = '更新检查失败';
      errAlert.message = e.message || String(e);
      errAlert.addAction('确定');
      await errAlert.present();
    }
  }

  Run() {
    if (config.runsInApp) {
      this.registerAction({
        title: '组件配置',
        menu: [
          {
            icon: { name: 'arrow.triangle.2.circlepath', color: '#10B981' },
            type: 'input',
            title: '脚本更新',
            desc: '检测 GitHub 官方仓库最新版本',
            name: 'update',
            val: 'update',
            onClick: async () => {
              await this.checkAndUpdateScript();
            },
          },
          {
            icon: { name: 'clock.arrow.2.circlepath', color: '#3B82F6' },
            type: 'input',
            placeholder: '360',
            title: '刷新时间',
            desc: '数据刷新时间，单位：分钟，默认360分钟',
            val: 'interval',
          },
          {
            icon: { name: 'arrow.clockwise', color: '#FF9500' },
            name: 'force_refresh',
            title: '立即刷新',
            desc: '强制跳过缓存间隔，立即向中燃拉取最新数据',
            val: 'force_refresh',
            onClick: async () => {
              await this.fetchGasInfo(true);
              const s = new Alert();
              s.title = this.isOffline ? '获取异常' : '刷新成功';
              s.message = this.isOffline ? '在线拉取未成功，已继续保留使用沙盒离线数据。' : `已拉取最新数据！当前余额: ¥ ${this.formatMoney(this.gasData.countMoney)}`;
              s.addAction('确定');
              await s.presentAlert();
              this.reopenScript();
            }
          },
          {
            icon: { name: 'trash', color: '#EF4444' },
            name: 'reset_cache',
            title: '清除缓存',
            desc: '清空本地所有历史缓存数据',
            val: 'reset_cache',
            onClick: async () => {
              const alert = new Alert();
              alert.title = '清除缓存';
              alert.message = '将清空本地所有燃气历史缓存数据。确定清除吗？';
              alert.addAction('确认清除');
              alert.addCancelAction('取消');
              const res = await alert.presentAlert();
              if (res === 0) {
                this.clearStorage();
                const s = new Alert();
                s.title = '清除成功';
                s.message = '缓存已清空，请重新进入或刷新拉取！';
                s.addAction('确定');
                await s.presentAlert();
                this.reopenScript();
              }
            }
          },
        ]
      });

      this.registerAction({
        title: '',
        menu: [
          {
            icon: { name: 'person.crop.circle', color: '#3B82F6' },
            name: 'account',
            title: '账户设置',
            type: 'input',
            onClick: () => {
              return this.setAccountConfig();
            }
          },
          {
            icon: { name: 'slider.horizontal.3', color: '#8B5CF6' },
            name: 'show',
            title: '显示配置',
            type: 'input',
            onClick: () => {
              return this.setShowConfig();
            }
          }
        ]
      });

      this.registerAction({
        title: '',
        menu: [
          {
            icon: { name: 'gearshape.fill', color: '#096dd9' },
            name: 'basic',
            title: '基础设置',
            type: 'input',
            onClick: () => {
              return this.setWidgetConfig();
            }
          },
          {
            icon: { name: 'arrow.triangle.2.circlepath.circle.fill', color: '#10B981' },
            name: 'reload',
            title: '重载组件',
            type: 'input',
            onClick: () => {
              this.reopenScript();
            }
          }
        ]
      });
    }
  }
}

await Runing(Widget, args.widgetParameter, false);
