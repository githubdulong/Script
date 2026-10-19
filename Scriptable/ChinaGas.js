/**
 * 组件名称: 中燃在线 (China Gas)
 * 版本号: v1.8.7
 * 依赖框架: DmYY
 * 使用说明: 根据 UI 账户设置教程
 */

if (typeof require === 'undefined') require = importModule;
const { DmYY, Runing } = require('./DmYY');

class Widget extends DmYY {
  version = '1.8.7';

  SCALE = 1;
  gasData = null;
  isOffline = false;

  constructor(arg) {
    super(arg);
    this.name = '中燃在线';
    this.en = 'ChinaGas';
    this.logo = 'https://raw.githubusercontent.com/anker1209/Scriptable/main/icon/gas.png';
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
      const file = this.fm.joinPath(this.cachePath, key);
      this.fm.writeString(file, content);
    } catch (_) {}
  }

  readStorage(key) {
    return this.loadCache(key);
  }

  writeStorage(key, content) {
    return this.saveCache(key, content);
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
    this.settings.balanceColor = this.settings.balanceColor || '#10B981';
    this.settings.interval = this.settings.interval || '360';
    this.settings.balanceLimit = this.settings.balanceLimit || '500';
    if (this.settings.useGradientBar === undefined) {
      this.settings.useGradientBar = 'true';
    }

    this.SCALE = this.getWidgetScaleFactor();
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

  getColor() {
    if (this.settings && this.settings.lightColor && this.settings.darkColor) {
      return Color.dynamic(
        new Color(this.settings.lightColor),
        new Color(this.settings.darkColor)
      );
    }
    return Color.dynamic(new Color('#111827'), new Color('#F9FAFB'));
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

  /**
   * 计算当前余额占基准的比例
   */
  getBalanceRatio() {
    const d = this.gasData || {};
    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    if (isOwe) return 0;
    const bal = parseFloat(d.countMoney || d.newCountMoney || '0');
    if (isNaN(bal) || bal <= 0) return 0;
    const maxLimit = parseFloat(this.settings.balanceLimit) || 500;
    return Math.max(0, Math.min(1.0, bal / maxLimit));
  }

  /**
   * 动态计算胶囊点亮格数（以预设满额为基准）
   */
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

  /**
   * 动态色阶渐变算法（绿 -> 青 -> 黄 -> 橙 -> 红 5 大色阶）
   */
  getBarColors(ratio, isOwe) {
    if (this.settings.useGradientBar === 'false') {
      const single = this.settings.themeColor || '#FF9500';
      return { start: single, end: single };
    }

    if (isOwe) {
      return { start: '#EF4444', end: '#DC2626' };
    }

    if (ratio >= 0.8) {
      return { start: '#10B981', end: '#34D399' };
    } else if (ratio >= 0.6) {
      return { start: '#06B6D4', end: '#22D3EE' };
    } else if (ratio >= 0.4) {
      return { start: '#EAB308', end: '#FACC15' };
    } else if (ratio >= 0.2) {
      return { start: '#F97316', end: '#FB923C' };
    } else {
      return { start: '#EF4444', end: '#F87171' };
    }
  }

  /**
   * 颜色平滑线性插值
   */
  interpolateColor(color1Hex, color2Hex, factor) {
    try {
      const c1 = parseInt(color1Hex.replace('#', ''), 16);
      const c2 = parseInt(color2Hex.replace('#', ''), 16);
      const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
      const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
      const r = Math.round(r1 + (r2 - r1) * factor);
      const g = Math.round(g1 + (g2 - g1) * factor);
      const b = Math.round(b1 + (b2 - b1) * factor);
      return new Color('#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
    } catch (_) {
      return new Color(color1Hex);
    }
  }

  /**
   * 绘制科技感胶囊进度条（支持多色阶渐变与平滑单元插值）
   */
  getCardBgColor() {
    return Color.dynamic(new Color('#F4F5F7'), new Color('#1A2333'));
  }

  drawCapsuleBar(width, height, totalSegments = 10, activeSegments = 7, colors) {
    const dc = new DrawContext();
    dc.size = new Size(width, height);
    dc.opaque = false;
    dc.respectScreenScale = true;

    const gap = 3.5;
    const segWidth = (width - gap * (totalSegments - 1)) / totalSegments;
    const corner = height / 2;

    const bgCol = Color.dynamic(new Color('#E5E7EB'), new Color('#252F40'));

    const startHex = (colors && colors.start) || '#FF9500';
    const endHex = (colors && colors.end) || startHex;

    for (let i = 0; i < totalSegments; i++) {
      const x = i * (segWidth + gap);
      const path = new Path();
      path.addRoundedRect(new Rect(x, 0, segWidth, height), corner, corner);
      dc.addPath(path);

      if (i < activeSegments) {
        const factor = activeSegments > 1 ? (i / (activeSegments - 1)) : 0;
        dc.setFillColor(this.interpolateColor(startHex, endHex, factor));
      } else {
        dc.setFillColor(bgCol);
      }
      dc.fillPath();
    }

    return dc.getImage();
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

  /**
   * 小尺寸组件 (Small) - 饱满紧凑对齐
   */
  async renderSmall(w) {
    const pX = 14 * this.SCALE;
    const pY = 12 * this.SCALE;
    w.setPadding(pY, pX, pY, pX);
    w.backgroundColor = Color.dynamic(new Color('#FFFFFF'), new Color('#111827'));

    const d = this.gasData || {};
    const themeColor = new Color(this.settings.themeColor || '#FF9500');
    const balanceColor = new Color(this.settings.balanceColor || '#10B981');
    const subColor = Color.dynamic(new Color('#6B7280'), new Color('#9CA3AF'));

    const body = w.addStack();
    body.layoutVertically();

    const header = body.addStack();
    header.centerAlignContent();

    const flame = SFSymbol.named('flame.fill');
    flame.applyHeavyWeight();
    const icon = header.addImage(flame.image);
    icon.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
    icon.tintColor = themeColor;
    header.addSpacer(5);

    const title = header.addText(this.settings.alias || '中燃在线');
    title.font = Font.boldSystemFont(13 * this.SCALE);
    title.textColor = this.widgetColor;

    header.addSpacer();

    const statePill = header.addStack();
    statePill.centerAlignContent();
    statePill.backgroundColor = this.getCardBgColor();
    statePill.cornerRadius = 6 * this.SCALE;
    statePill.setPadding(2 * this.SCALE, 6 * this.SCALE, 2 * this.SCALE, 6 * this.SCALE);
    const stateText = statePill.addText(this.isOffline ? '离线' : '● 正常');
    stateText.font = Font.semiboldSystemFont(9.5 * this.SCALE);
    stateText.textColor = this.isOffline ? themeColor : balanceColor;

    body.addSpacer();

    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    const labelRow = body.addStack();
    labelRow.centerAlignContent();
    const balLabel = labelRow.addText(isOwe ? '燃气欠费' : '账户余额');
    balLabel.font = Font.mediumSystemFont(11 * this.SCALE);
    balLabel.textColor = isOwe ? new Color('#EF4444') : subColor;

    body.addSpacer(2 * this.SCALE);

    const valRow = body.addStack();
    valRow.centerAlignContent();
    const valText = valRow.addText(`¥ ${this.formatMoney(d.countMoney || d.newCountMoney || '0.00')}`);
    valText.font = Font.boldRoundedSystemFont(27 * this.SCALE);
    valText.textColor = isOwe ? new Color('#EF4444') : balanceColor;
    valText.lineLimit = 1;
    valText.minimumScaleFactor = 0.6;

    body.addSpacer(6 * this.SCALE);

    const ratio = this.getBalanceRatio();
    const activeSegs = this.getCapsuleActiveCount(10);
    const barColors = this.getBarColors(ratio, isOwe);
    const capsuleImg = body.addImage(this.drawCapsuleBar(130 * this.SCALE, 5.5 * this.SCALE, 10, activeSegs, barColors));
    capsuleImg.imageSize = new Size(130 * this.SCALE, 5.5 * this.SCALE);

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
    gImg.tintColor = themeColor;
    fRow1.addSpacer(3);

    const mText = fRow1.addText(`抄表: ${d.lastRecord || '0'} m³`);
    mText.font = Font.systemFont(9.5 * this.SCALE);
    mText.textColor = subColor;
    fRow1.addSpacer();

    const timeText = fRow1.addText(d._fetchTime || '刚刚');
    timeText.font = Font.systemFont(9.5 * this.SCALE);
    timeText.textColor = subColor;

    footerCard.addSpacer(3 * this.SCALE);

    const fRow2 = footerCard.addStack();
    fRow2.centerAlignContent();
    const idIcon = SFSymbol.named('creditcard');
    const idImg = fRow2.addImage(idIcon.image);
    idImg.imageSize = new Size(11 * this.SCALE, 11 * this.SCALE);
    idImg.tintColor = new Color('#3B82F6');
    fRow2.addSpacer(3);

    const custCodeText = fRow2.addText(`户号: ${this.formatCustCode(d.custCode, true)}`);
    custCodeText.font = Font.systemFont(9.5 * this.SCALE);
    custCodeText.textColor = subColor;
    fRow2.addSpacer();

    const nameText = fRow2.addText(d.custName || '中国燃气');
    nameText.font = Font.systemFont(9.5 * this.SCALE);
    nameText.textColor = subColor;

    return w;
  }

  /**
   * 中尺寸组件 (Medium) - 左右反差色双拼布局，划线分割，卡片阴影色统一
   */
  async renderMedium(w) {
    const pX = 16 * this.SCALE;
    const pY = 12 * this.SCALE;
    w.setPadding(0, 0, 0, 0);

    const cardBg = this.getCardBgColor();
    const widgetBg = Color.dynamic(new Color('#FFFFFF'), new Color('#111827'));
    w.backgroundColor = cardBg;

    const d = this.gasData || {};
    const themeColor = new Color(this.settings.themeColor || '#FF9500');
    const balanceColor = new Color(this.settings.balanceColor || '#10B981');
    const subColor = Color.dynamic(new Color('#6B7280'), new Color('#9CA3AF'));

    const body = w.addStack();
    body.layoutHorizontally();

    const left = body.addStack();
    left.layoutVertically();
    left.backgroundColor = widgetBg;
    left.setPadding(pY, pX, pY, 12 * this.SCALE);
    left.size = new Size(172 * this.SCALE, 0);

    const lHeader = left.addStack();
    lHeader.centerAlignContent();
    const flame = SFSymbol.named('flame.fill');
    flame.applyHeavyWeight();
    const fImg = lHeader.addImage(flame.image);
    fImg.imageSize = new Size(16 * this.SCALE, 16 * this.SCALE);
    fImg.tintColor = themeColor;
    lHeader.addSpacer(5);
    const lTitle = lHeader.addText(this.settings.alias || '中燃在线');
    lTitle.font = Font.boldSystemFont(13 * this.SCALE);
    lTitle.textColor = this.widgetColor;

    left.addSpacer();

    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    const balLabel = left.addText(isOwe ? '燃气欠费 (元)' : '可用气费余额 (元)');
    balLabel.font = Font.mediumSystemFont(11 * this.SCALE);
    balLabel.textColor = isOwe ? new Color('#EF4444') : subColor;

    left.addSpacer(2 * this.SCALE);

    const valRow = left.addStack();
    valRow.centerAlignContent();
    const valText = valRow.addText(`¥ ${this.formatMoney(d.countMoney || d.newCountMoney || '0.00')}`);
    valText.font = Font.boldRoundedSystemFont(28 * this.SCALE);
    valText.textColor = isOwe ? new Color('#EF4444') : balanceColor;
    valText.lineLimit = 1;
    valText.minimumScaleFactor = 0.6;

    left.addSpacer(7 * this.SCALE);

    const ratio = this.getBalanceRatio();
    const activeSegs = this.getCapsuleActiveCount(10);
    const barColors = this.getBarColors(ratio, isOwe);
    const capsuleImg = left.addImage(this.drawCapsuleBar(148 * this.SCALE, 7 * this.SCALE, 10, activeSegs, barColors));
    capsuleImg.imageSize = new Size(148 * this.SCALE, 7 * this.SCALE);

    left.addSpacer();

    const stateRow = left.addStack();
    stateRow.centerAlignContent();
    const dot = stateRow.addText('● ');
    dot.font = Font.systemFont(8 * this.SCALE);
    dot.textColor = isOwe ? new Color('#EF4444') : balanceColor;

    const stateText = stateRow.addText(isOwe ? '账户已欠费 · 请及时充值' : '管网连接正常 · 气压稳定');
    stateText.font = Font.systemFont(10 * this.SCALE);
    stateText.textColor = subColor;

    const divider = body.addStack();
    divider.size = new Size(1, 0);
    divider.backgroundColor = Color.dynamic(new Color('#E5E7EB'), new Color('#252F40'));

    const right = body.addStack();
    right.layoutVertically();
    right.setPadding(pY, 14 * this.SCALE, pY, pX);

    const rTop = right.addStack();
    rTop.centerAlignContent();
    const syncSymbol = SFSymbol.named('arrow.triangle.2.circlepath');
    const syncImg = rTop.addImage(syncSymbol.image);
    syncImg.imageSize = new Size(10 * this.SCALE, 10 * this.SCALE);
    syncImg.tintColor = subColor;
    rTop.addSpacer(3);
    const syncTime = rTop.addText(d._fetchTime ? `更新时间 ${d._fetchTime}` : '实时同步');
    syncTime.font = Font.systemFont(10 * this.SCALE);
    syncTime.textColor = subColor;
    rTop.addSpacer();

    right.addSpacer();

    this.createTechRow(right, 'person.crop.rectangle', '客户户号', `${d.custName || '--'} (${this.formatCustCode(d.custCode)})`, themeColor, subColor);
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

    const sym = SFSymbol.named(iconName);
    const img = row.addImage(sym.image);
    img.imageSize = new Size(13 * this.SCALE, 13 * this.SCALE);
    img.tintColor = iconCol;
    row.addSpacer(4);

    const lText = row.addText(label);
    lText.font = Font.systemFont(10.5 * this.SCALE);
    lText.textColor = subCol;
    row.addSpacer(6);

    const vText = row.addText(valStr);
    vText.font = Font.semiboldSystemFont(11 * this.SCALE);
    vText.textColor = this.widgetColor;
    vText.lineLimit = 1;
    vText.minimumScaleFactor = 0.7;
    row.addSpacer();
  }

  /**
   * 大尺寸组件 (Large) - 颜色同步支持渐变或自定义单色
   */
  async renderLarge(w) {
    const pX = 16 * this.SCALE;
    const pY = 14 * this.SCALE;
    w.setPadding(pY, pX, pY, pX);
    w.backgroundColor = Color.dynamic(new Color('#FFFFFF'), new Color('#111827'));

    const widgetW = this.getWidgetLargeWidth();
    const contentW = widgetW - 2 * pX;

    const d = this.gasData || {};
    const themeColor = new Color(this.settings.themeColor || '#FF9500');
    const balanceColor = new Color(this.settings.balanceColor || '#10B981');
    const subColor = Color.dynamic(new Color('#6B7280'), new Color('#9CA3AF'));

    const body = w.addStack();
    body.layoutVertically();

    const header = body.addStack();
    header.centerAlignContent();
    header.size = new Size(contentW, 0);

    const flame = SFSymbol.named('flame.fill');
    flame.applyHeavyWeight();
    const fImg = header.addImage(flame.image);
    fImg.imageSize = new Size(20 * this.SCALE, 20 * this.SCALE);
    fImg.tintColor = themeColor;
    header.addSpacer(6);

    const title = header.addText(this.settings.alias || '中国燃气在线监控');
    title.font = Font.boldSystemFont(15 * this.SCALE);
    title.textColor = this.widgetColor;
    header.addSpacer();

    const tagBadge = header.addStack();
    tagBadge.centerAlignContent();
    tagBadge.backgroundColor = this.getCardBgColor();
    tagBadge.cornerRadius = 6 * this.SCALE;
    tagBadge.setPadding(3 * this.SCALE, 8 * this.SCALE, 3 * this.SCALE, 8 * this.SCALE);

    const tag = tagBadge.addText(this.isOffline ? '离线模式' : `更新时间 ${d._fetchTime || '刚刚'}`);
    tag.font = Font.semiboldSystemFont(10 * this.SCALE);
    tag.textColor = this.isOffline ? themeColor : balanceColor;

    body.addSpacer();

    const card = body.addStack();
    card.layoutVertically();
    card.size = new Size(contentW, 0);
    card.backgroundColor = this.getCardBgColor();
    card.cornerRadius = 14 * this.SCALE;
    card.setPadding(12 * this.SCALE, 16 * this.SCALE, 12 * this.SCALE, 16 * this.SCALE);

    const isOwe = d.oweMoney && parseFloat(d.oweMoney) > 0;
    const cLabel = card.addText(isOwe ? '账户欠费总额 (元)' : '当前账户可用气费余额 (元)');
    cLabel.font = Font.mediumSystemFont(11.5 * this.SCALE);
    cLabel.textColor = isOwe ? new Color('#EF4444') : subColor;

    card.addSpacer(3 * this.SCALE);

    const cValRow = card.addStack();
    cValRow.centerAlignContent();
    const val = cValRow.addText(`¥ ${this.formatMoney(d.countMoney || d.newCountMoney || '0.00')}`);
    val.font = Font.boldRoundedSystemFont(33 * this.SCALE);
    val.textColor = isOwe ? new Color('#EF4444') : balanceColor;

    card.addSpacer(7 * this.SCALE);

    const barW = Math.max(260 * this.SCALE, contentW - 32 * this.SCALE);

    const ratio = this.getBalanceRatio();
    const activeSegs = this.getCapsuleActiveCount(14);
    const barColors = this.getBarColors(ratio, isOwe);
    const capsule = card.addImage(this.drawCapsuleBar(barW, 8 * this.SCALE, 14, activeSegs, barColors));
    capsule.imageSize = new Size(barW, 8 * this.SCALE);

    body.addSpacer();

    const grid = body.addStack();
    grid.layoutHorizontally();
    grid.size = new Size(contentW, 0);

    const gap = 8 * this.SCALE;
    const colW = Math.floor((contentW - 2 * gap) / 3);
    const colW3 = contentW - 2 * gap - 2 * colW;

    const cardA = grid.addStack();
    cardA.layoutVertically();
    cardA.backgroundColor = this.getCardBgColor();
    cardA.cornerRadius = 10 * this.SCALE;
    cardA.setPadding(9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE);
    cardA.size = new Size(colW, 0);

    const aHead = cardA.addStack();
    aHead.centerAlignContent();
    const aIcon = SFSymbol.named('speedometer');
    const aImg = aHead.addImage(aIcon.image);
    aImg.imageSize = new Size(12 * this.SCALE, 12 * this.SCALE);
    aImg.tintColor = new Color('#3B82F6');
    aHead.addSpacer(3 * this.SCALE);
    const aTitle = aHead.addText('上次抄表读数');
    aTitle.font = Font.systemFont(10 * this.SCALE);
    aTitle.textColor = subColor;
    aTitle.lineLimit = 1;

    cardA.addSpacer(4 * this.SCALE);
    const aVal = cardA.addText(`${d.lastRecord || '0'} m³`);
    aVal.font = Font.boldRoundedSystemFont(16 * this.SCALE);
    aVal.textColor = this.widgetColor;
    aVal.lineLimit = 1;
    aVal.minimumScaleFactor = 0.8;

    grid.addSpacer(gap);

    const cardB = grid.addStack();
    cardB.layoutVertically();
    cardB.backgroundColor = this.getCardBgColor();
    cardB.cornerRadius = 10 * this.SCALE;
    cardB.setPadding(9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE);
    cardB.size = new Size(colW, 0);

    const bHead = cardB.addStack();
    bHead.centerAlignContent();
    const bIcon = SFSymbol.named('calendar.badge.clock');
    const bImg = bHead.addImage(bIcon.image);
    bImg.imageSize = new Size(12 * this.SCALE, 12 * this.SCALE);
    bImg.tintColor = new Color('#8B5CF6');
    bHead.addSpacer(3 * this.SCALE);
    const bTitle = bHead.addText('抄表核算日期');
    bTitle.font = Font.systemFont(10 * this.SCALE);
    bTitle.textColor = subColor;
    bTitle.lineLimit = 1;

    cardB.addSpacer(4 * this.SCALE);
    const bVal = cardB.addText(d.lastRecordTime || '近期已核算');
    bVal.font = Font.boldRoundedSystemFont(13.5 * this.SCALE);
    bVal.textColor = this.widgetColor;
    bVal.lineLimit = 1;
    bVal.minimumScaleFactor = 0.8;

    grid.addSpacer(gap);

    const cardC = grid.addStack();
    cardC.layoutVertically();
    cardC.backgroundColor = this.getCardBgColor();
    cardC.cornerRadius = 10 * this.SCALE;
    cardC.setPadding(9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE, 9 * this.SCALE);
    cardC.size = new Size(colW3, 0);

    const cHead = cardC.addStack();
    cHead.centerAlignContent();
    const cIcon = SFSymbol.named('waveform.path.ecg');
    const cImg = cHead.addImage(cIcon.image);
    cImg.imageSize = new Size(12 * this.SCALE, 12 * this.SCALE);
    const statusCol = isOwe ? new Color('#EF4444') : (this.isOffline ? themeColor : balanceColor);
    cImg.tintColor = statusCol;
    cHead.addSpacer(3 * this.SCALE);
    const cTitle = cHead.addText('管网监控状态');
    cTitle.font = Font.systemFont(10 * this.SCALE);
    cTitle.textColor = subColor;
    cTitle.lineLimit = 1;

    cardC.addSpacer(4 * this.SCALE);
    const cStatusRow = cardC.addStack();
    cStatusRow.centerAlignContent();
    const cDot = cStatusRow.addText('● ');
    cDot.font = Font.systemFont(7 * this.SCALE);
    cDot.textColor = statusCol;

    const cValText = isOwe ? '账户欠费' : (this.isOffline ? '离线保持' : '气压稳定');
    const cVal = cStatusRow.addText(cValText);
    cVal.font = Font.boldSystemFont(12 * this.SCALE);
    cVal.textColor = this.widgetColor;
    cVal.lineLimit = 1;
    cVal.minimumScaleFactor = 0.8;

    body.addSpacer();

    const listCard = body.addStack();
    listCard.layoutVertically();
    listCard.size = new Size(contentW, 0);
    listCard.backgroundColor = this.getCardBgColor();
    listCard.cornerRadius = 10 * this.SCALE;
    listCard.setPadding(10 * this.SCALE, 14 * this.SCALE, 10 * this.SCALE, 14 * this.SCALE);

    this.createTechRow(listCard, 'person.crop.rectangle', '客户姓名', d.custName || '--', themeColor, subColor);
    listCard.addSpacer(6 * this.SCALE);
    this.createTechRow(listCard, 'number', '燃气户号', this.formatCustCode(d.custCode), themeColor, subColor);
    listCard.addSpacer(6 * this.SCALE);
    this.createTechRow(listCard, 'building.2', '服务单位', this.formatCompName(d.compName, true), new Color('#10B981'), subColor);
    listCard.addSpacer(6 * this.SCALE);
    this.createTechRow(listCard, 'phone.badge.waveform', '全国客服热线', '95007', new Color('#F59E0B'), subColor);

    return w;
  }

  renderGuideWidget(w) {
    w.setPadding(16, 16, 16, 16);
    w.backgroundColor = Color.dynamic(new Color('#FFFFFF'), new Color('#111827'));
    const center = w.addStack();
    center.layoutVertically();
    center.centerAlignContent();

    const title = center.addText('China Gas');
    title.font = Font.boldSystemFont(15);
    title.textColor = new Color('#FF9500');

    center.addSpacer(8);

    const tip = center.addText('未检测到凭证配置');
    tip.font = Font.boldSystemFont(12);
    tip.textColor = this.widgetColor;

    center.addSpacer(4);

    const desc = center.addText('请点击打开组件，在【账户设置】中输入参数或使用剪贴板智能解析。');
    desc.font = Font.systemFont(11);
    desc.textColor = new Color('#9CA3AF');
    desc.centerAlignText();

    return w;
  }

  renderErrorWidget(w) {
    w.setPadding(16, 16, 16, 16);
    w.backgroundColor = Color.dynamic(new Color('#FFFFFF'), new Color('#111827'));
    const center = w.addStack();
    center.layoutVertically();
    center.centerAlignContent();

    const title = center.addText('数据连接失败');
    title.font = Font.boldSystemFont(14);
    title.textColor = new Color('#EF4444');

    center.addSpacer(6);

    const msg = center.addText('网络超时且无离线缓存，请检查网络或重新配置凭证。');
    msg.font = Font.systemFont(11);
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
            name: 'open_wechat',
            val: 'open_wechat',
            title: '快捷打开微信',
            desc: '跳转微信打开中燃小程序',
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
    return this.renderAppView([
      {
        title: '显示设置',
        menu: [
          {
            icon: { name: 'slider.horizontal.3', color: '#FF9500' },
            type: 'switch',
            title: '进度条余额渐变色',
            desc: '根据余额多少动态变换绿-青-黄-橙-红5大色阶',
            val: 'useGradientBar',
            default: true,
          },
          {
            icon: { name: 'paintpalette.fill', color: '#F59E0B' },
            type: 'color',
            title: '自定义品牌强调色(单色)',
            desc: '关闭渐变色时生效，进度条采用此单色',
            defaultValue: '#FF9500',
            val: 'themeColor',
          },
          {
            icon: { name: 'number.square.fill', color: '#3B82F6' },
            type: 'switch',
            title: '隐藏户号脱敏 (512****03)',
            val: 'maskCustCode',
          },
          {
            icon: { name: 'building.2', color: '#10B981' },
            type: 'switch',
            title: '隐藏服务单位脱敏 (中国燃气)',
            val: 'maskCompName',
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
            icon: { name: 'flame.fill', color: '#10B981' },
            type: 'color',
            title: '余额充沛主题色',
            defaultValue: '#10B981',
            val: 'balanceColor',
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
              alert.message = '确定将所有显示配置（渐变色、脱敏、主题色、满额基准等）恢复为初始默认值吗？';
              alert.addAction('确认重置');
              alert.addCancelAction('取消');
              const res = await alert.presentAlert();
              if (res === 0) {
                this.settings.useGradientBar = 'true';
                this.settings.themeColor = '#FF9500';
                this.settings.balanceColor = '#10B981';
                this.settings.maskCustCode = 'false';
                this.settings.maskCompName = 'false';
                this.settings.balanceLimit = '500';
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
        const alert = new Alert();
        alert.title = `检测到新版本 v${remoteVersion}`;
        alert.message = `当前版本：v${this.version}\n最新版本：v${remoteVersion}\n\n请选择操作：`;
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
