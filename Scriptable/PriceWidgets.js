
/**
 * =====================================================================
 * 【资产看板 PriceWidgets】
 * 版本：v2.6.1
 * 日期：2026-09-21
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
            '关注种类 (分类填入)',
            '按资产类别分栏填入代码(逗号隔开)，不关注的类别留空：',
            {
              cryptoSymbols: '虚拟币 (如: BTC, ETH, SOL)',
              usStockSymbols: '美股 (如: AAPL, TSLA, NVDA)',
              cnStockSymbols: 'A股/港股 (如: 600519, 000951, 00700)',
              metalSymbols: '贵金属 (如: AU9999, AG9999, XAU, XAG)',
              fundSymbols: '公募基金 (如: 001186, 161725)',
              oilSymbols: '国内油价 (如: 92, 95, 98, 0)',
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
        '随机展示',
        async () => {
          return this.setAlertInput(
            '随机展示',
            '开启后每次刷新在已关注资产中真正随机轮播（小/中/大号组件均生效）：\n• 小号：随机展示 1 个资产\n• 中号：随机抽取 3 个资产\n• 大号：随机抽取 6 个资产\n输入 1 开启，0 关闭',
            {
              randomDisplay: '0',
            }
          );
        },
        { name: 'shuffle', color: '#38bdf8' }
      );
    config.runsInApp &&
      this.registerAction(
        '运行日志',
        async () => {
          if (!this.lastReportText) {
            await this.init();
          }
          const alert = new Alert();
          alert.title = '📋 资产看板运行日志';
          alert.message = this.lastReportText || '暂无日志记录';
          alert.addAction('拷贝报告');
          alert.addCancelAction('关闭');
          const idx = await alert.presentAlert();
          if (idx === 0 && this.lastReportText) {
            Pasteboard.copy(this.lastReportText);
          }
        },
        { name: 'doc.text.magnifyingglass', color: '#10B981' }
      );
    config.runsInApp && this.registerAction('基础设置', this.setWidgetConfig);
  }

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
      const isInteger = (val % 1 === 0);
      return val.toLocaleString('en-US', {
        minimumFractionDigits: isInteger ? 0 : 2,
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

  formatTime = (timestamp) => {
    if (!timestamp) return '无历史记录';
    const d = new Date(Number(timestamp));
    const pad = (n) => (n < 10 ? `0${n}` : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  log = (msg, type = 'INFO') => {};

  printDiagnosticReport = () => {
    const d = this.logDetails || {};
    const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    const lines = [
      '',
      divider,
      '📊【资产看板 PriceWidgets 运行诊断日志】',
      divider,
      `📱 运行环境: ${d.runMode || (config.runsInWidget ? '桌面小组件 (Widget)' : 'Scriptable App 内部')}`,
      `⚙️ 刷新间隔: 设置为 ${d.dataCacheMinutes || 30} 分钟 (refreshAfterDate)`,
      `🕒 历史数据: 上次成功更新于 ${d.lastUpdatedStr || '无'} (距今 ${d.elapsedMinutes || '0'} 分钟)`,
      `📦 读取策略: ${d.dataSourceType || '未知'}`,
      `📈 呈现资产: 成功装载 ${d.finalCount || 0} 个监控标的`,
      `⏱ 总耗时: ${d.totalDuration || 0} ms`,
    ];

    if (d.networkTasks && d.networkTasks.length > 0) {
      lines.push('─────────────────────────────────────');
      lines.push('🌐 网络并发请求明细:');
      d.networkTasks.forEach((t) => {
        lines.push(`   • [${t.name}] 耗时 ${t.cost}ms ➔ ${t.status}`);
      });
      if (d.networkTotalTime > 0) {
        lines.push(`   ⚡️ 并发总网络耗时: ${d.networkTotalTime} ms (并行执行耗时由最慢单项决定)`);
      }
    }

    lines.push('─────────────────────────────────────');
    if (d.errors && d.errors.length > 0) {
      lines.push('⚠️ 异常与报错提示:');
      d.errors.forEach((err) => {
        lines.push(`   ❌ ${err}`);
      });
    } else {
      lines.push('✅ 运行状态: 完美执行，全链路无任何报错');
    }
    lines.push(divider);
    lines.push('');

    const fullReport = lines.join('\n');
    this.lastReportText = fullReport;
    console.log(fullReport);
  };

  init = async () => {
    const startTime = Date.now();
    const lastTime = this.settings.lastUpdatedTime || 0;
    const dataCacheMinutes = parseInt(this.settings.refreshAfterDate) || 30;
    const timeDiffMs = lastTime ? Date.now() - lastTime : 0;
    const elapsedMinutes = lastTime ? (timeDiffMs / (60 * 1000)).toFixed(1) : '初次运行';
    const isExpired = !lastTime || timeDiffMs > dataCacheMinutes * 60 * 1000;
    const runMode = config.runsInWidget ? '桌面小组件 (WidgetKit)' : 'Scriptable App 内部运行';

    this.logDetails = {
      runMode,
      dataCacheMinutes,
      lastUpdatedStr: this.formatTime(lastTime),
      elapsedMinutes,
      isExpired,
      dataSourceType: '',
      networkTotalTime: 0,
      networkTasks: [],
      errors: [],
      finalCount: 0,
      totalDuration: 0,
    };

    // 桌面小组件且缓存未过期时，直接读取本地缓存秒开
    if (this.settings.dataSource && this.settings.dataSource.length && !isExpired && !config.runsInApp) {
      this.dataSource = this.settings.dataSource;
      this.logDetails.dataSourceType = `读取本地有效缓存数据 (距更新 ${elapsedMinutes} 分钟前，跳过网络秒开)`;
      this.logDetails.finalCount = this.dataSource.length;
      this.logDetails.totalDuration = Date.now() - startTime;
      this.printDiagnosticReport();
      return;
    }

    try {
      await this.cacheData();
    } catch (e) {
      const errMsg = `cacheData 异常: ${e.message || e}`;
      if (this.logDetails) this.logDetails.errors.push(errMsg);
    }

    // 核心保底机制：若因网络波动/超时未获取到最新数据，坚决使用旧缓存展示，杜绝小组件超时红字
    if ((!this.dataSource || !this.dataSource.length) && this.settings.dataSource && this.settings.dataSource.length) {
      this.dataSource = this.settings.dataSource;
      this.logDetails.dataSourceType = `⚠️ 网络请求无有效数据，自动回退读取上次本地有效缓存 (${this.logDetails.lastUpdatedStr})`;
    } else if (this.dataSource && this.dataSource.length) {
      if (!this.logDetails.dataSourceType) {
        this.logDetails.dataSourceType = '网络并发拉取最新实时数据';
      }
    }

    this.logDetails.finalCount = this.dataSource ? this.dataSource.length : 0;
    this.logDetails.totalDuration = Date.now() - startTime;
    this.printDiagnosticReport();
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

  // 雪球官方 Logo（高清透明底色，用于未收录股票的优雅官方保底）
  xueqiuLogoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpFNjIyMEU4ODQzNzIxMUUyQTQxRUMzRTA5MkEzOEYzQSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpFNjIyMEU4OTQzNzIxMUUyQTQxRUMzRTA5MkEzOEYzQSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkU2MjIwRTg2NDM3MjExRTJBNDFFQzNFMDkyQTM4RjNBIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkU2MjIwRTg3NDM3MjExRTJBNDFFQzNFMDkyQTM4RjNBIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+LePrjgAACD1JREFUeNrMW2ts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';

  getXueqiuLogo = () => {
    try {
      return Image.fromData(Data.fromBase64String(this.xueqiuLogoBase64));
    } catch (e) {
      return null;
    }
  };

  // 股票/指数 -> STK
  // 虚拟币   -> CRY
  // 黄金     -> GLD
  // 白银     -> SLV
  // 油价     -> OIL
  // 基金     -> FND
  getCategoryTag = (market) => {
    const type = market.type || 'stock';
    const sym = (market.symbol || '').toUpperCase();
    const name = market.name || '';

    if (type === 'oil') return 'OIL';
    if (type === 'fund') return 'FND';
    if (type === 'crypto') return 'CRY';
    if (type === 'metal') {
      const isSilver = sym.includes('AG') || sym.includes('SILVER') || name.includes('银');
      return isSilver ? 'SLV' : 'GLD';
    }
    if (type === 'stock') return 'STK';
    return 'STK';
  };

  // 获取分类徽章的主题颜色
  getCategoryTagColor = (tag) => {
    switch (tag) {
      case 'STK':
        return { bg: new Color('#EF4444', 0.12), text: new Color('#DC2626', 0.88) };
      case 'CRY':
        return { bg: new Color('#F59E0B', 0.12), text: new Color('#D97706', 0.88) };
      case 'GLD':
        return { bg: new Color('#EAB308', 0.15), text: new Color('#CA8A04', 0.90) };
      case 'SLV':
        return { bg: new Color('#64748B', 0.14), text: new Color('#475569', 0.90) };
      case 'OIL':
        return { bg: new Color('#EA580C', 0.12), text: new Color('#C2410C', 0.88) };
      case 'FND':
        return { bg: new Color('#3B82F6', 0.12), text: new Color('#2563EB', 0.88) };
      default:
        return { bg: new Color('#0284C7', 0.12), text: new Color('#0284C7', 0.88) };
    }
  };

  // 判断是否处于深色/暗黑模式
  isDarkModeActive = () => {
    try {
      if (typeof Device !== 'undefined' && Device.isUsingDarkAppearance()) return true;
      if (typeof Color !== 'undefined' && Color.dynamic) {
        const testColor = Color.dynamic(new Color('#FFFFFF'), new Color('#000000'));
        if (testColor.hex && testColor.hex.toLowerCase() === '000000') return true;
      }
    } catch (e) {}
    return false;
  };

  // 全自动图标规整管道：
  // 1. 自动扫描去除任何图源周围自带的多余透明留白（Bounding Box）
  // 2. 严格按最长边等比缩放并居中投影至 targetSize (28x28)，保证所有品牌 Logo 大小绝对规整统一
  // 3. 暗黑模式下，自动识别纯黑/极深色剪影（如 Apple Logo），无损反转为纯净银白 #FFFFFF，浅色模式保持深黑
  processAndNormalizeIcon = async (img, targetSize = 28) => {
    try {
      if (!img) return img;
      const isDark = this.isDarkModeActive();
      const webview = new WebView();
      const js = `const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const w = img.width;
          const h = img.height;
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, w, h);
          const d = imgData.data;

          let minX = w, maxX = 0, minY = h, maxY = 0;
          let hasVisible = false;
          let darkCount = 0;
          let visibleCount = 0;

          // 1. 扫描可见像素，精确获取真实图形物理边界与深色占比
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const idx = (y * w + x) * 4;
              const a = d[idx + 3];
              if (a > 15) {
                hasVisible = true;
                visibleCount++;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                const lum = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
                if (lum < 80) darkCount++;
              }
            }
          }

          if (!hasVisible) {
            minX = 0; maxX = w - 1; minY = 0; maxY = h - 1;
          }

          const cropW = maxX - minX + 1;
          const cropH = maxY - minY + 1;
          const target = ${targetSize} * 3; // 3x 高清视网膜渲染 (84x84)
          const outCanvas = document.createElement('canvas');
          outCanvas.width = target;
          outCanvas.height = target;
          const outCtx = outCanvas.getContext('2d');

          // 2. 严格按有效图案最长边等比缩放并完全居中
          const scale = Math.min(target / cropW, target / cropH);
          const drawW = cropW * scale;
          const drawH = cropH * scale;
          const offsetX = (target - drawW) / 2;
          const offsetY = (target - drawH) / 2;

          outCtx.drawImage(img, minX, minY, cropW, cropH, offsetX, offsetY, drawW, drawH);

          // 3. 暗黑模式下纯黑/深色剪影反白（深色像素占比 > 60% 时自动转白）
          if (${isDark} && visibleCount > 0 && (darkCount / visibleCount) > 0.6) {
            const finalData = outCtx.getImageData(0, 0, target, target);
            const fd = finalData.data;
            for (let i = 0; i < fd.length; i += 4) {
              if (fd[i + 3] > 15) {
                const lum = 0.299 * fd[i] + 0.587 * fd[i + 1] + 0.114 * fd[i + 2];
                if (lum < 80) {
                  fd[i] = 255;
                  fd[i + 1] = 255;
                  fd[i + 2] = 255;
                }
              }
            }
            outCtx.putImageData(finalData, 0, 0);
          }

          completion(outCanvas.toDataURL());
        };
        img.src = 'data:image/png;base64,' + '${Data.fromPNG(img).toBase64String()}';`;
      let res = await webview.evaluateJavaScript(js, true);
      res = res.replace(/^data:image\/[a-zA-Z0-9]+;base64,/, '');
      return Image.fromData(Data.fromBase64String(res));
    } catch (e) {
      return img;
    }
  };

  // 本地文件缓存加载（网络请求成功存入本地沙盒，下次秒读，不包含任何擅自删缓存的逻辑）
    // 归一化图标加载（带磁盘文件缓存：首次处理后存盘，以后直接秒读，彻底避免每次重复启动 WebView 导致卡顿与超时）
  getNormalizedItemIcon = async (market, targetSize = 28) => {
    try {
      if (!this.FILE_MGR.fileExists(this.cacheImage)) {
        this.FILE_MGR.createDirectory(this.cacheImage, true);
      }
      const sym = (market.symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      const type = market.type || 'stock';
      const isDark = this.isDarkModeActive();
      const safeKey = `norm_${type}_${sym}_${targetSize}_${isDark ? 'dark' : 'light'}`;
      const filePath = this.FILE_MGR.joinPath(this.cacheImage, `${safeKey}.png`);

      if (this.FILE_MGR.fileExists(filePath)) {
        return Image.fromFile(filePath);
      }

      const rawImg = await this.getItemImage(market);
      if (!rawImg) return null;
      const normalized = await this.processAndNormalizeIcon(rawImg, targetSize);
      if (normalized) {
        this.FILE_MGR.writeImage(filePath, normalized);
        return normalized;
      }
      return rawImg;
    } catch (e) {
      return await this.getItemImage(market);
    }
  };

  loadIconWithCache = async (cacheKey, iconUrl) => {
    try {
      if (!this.FILE_MGR.fileExists(this.cacheImage)) {
        this.FILE_MGR.createDirectory(this.cacheImage, true);
      }
      const safeKey = cacheKey.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const filePath = this.FILE_MGR.joinPath(this.cacheImage, `${safeKey}.png`);
      if (this.FILE_MGR.fileExists(filePath)) {
        return Image.fromFile(filePath);
      }
      if (!iconUrl) return null;
      const req = new Request(iconUrl);
      req.timeoutInterval = 4;
      const img = await req.loadImage();
      if (img) {
        this.FILE_MGR.writeImage(filePath, img);
        return img;
      }
    } catch (e) {}
    return null;
  };

  createBadgeImage = (symbolName, tintColorHex, targetSize = 250) => {
    const ctx = new DrawContext();
    ctx.size = new Size(targetSize, targetSize);
    ctx.opaque = false;
    ctx.respectScreenScale = false;
    try {
      const sym = SFSymbol.named(symbolName);
      if (sym) {
        sym.applyFont(Font.systemFont(targetSize * 0.85));
        const icon = sym.image;
        ctx.tintColor = new Color(tintColorHex, 1);
        const origW = icon.size.width;
        const origH = icon.size.height;
        const scale = Math.min(targetSize / origW, targetSize / origH);
        const drawW = origW * scale;
        const drawH = origH * scale;
        const x = (targetSize - drawW) / 2;
        const y = (targetSize - drawH) / 2;
        ctx.drawImageInRect(icon, new Rect(x, y, drawW, drawH));
        return ctx.getImage();
      }
    } catch (e) {}
    return ctx.getImage();
  };

  getItemImage = async (market) => {
    const sym = (market.symbol || '').toUpperCase();
    const cleanSym = sym.replace(/[^A-Z0-9]/g, '');
    const type = market.type;

    // 1. 加密货币：CoinGecko 原生纯透明图片（BTC, ETH, SOL 等）
    if (market.image && typeof market.image === 'string' && market.image.startsWith('http')) {
      const cached = await this.loadIconWithCache(`crypto_${cleanSym}`, market.image);
      if (cached) return cached;
    }

    // 2. 全国油价：壳牌（Shell 经典彩色贝壳）官方标准 64x64 纯透明 Logo
    if (type === 'oil') {
      const cached = await this.loadIconWithCache(
        'oil_shell_official',
        'https://companiesmarketcap.com/img/company-logos/64/SHEL.png'
      );
      if (cached) return cached;
      return this.createBadgeImage('fuelpump.fill', '#EA580C');
    }

    // 3. 贵金属：Tether Gold 纯金币与 Kinesis Silver 纯银币（均为原生纯透明无底色）
    if (type === 'metal') {
      const isSilver = sym.includes('AG') || (market.name || '').includes('银');
      const url = isSilver
        ? 'https://coin-images.coingecko.com/coins/images/29789/large/kag-currency-ticker.png'
        : 'https://coin-images.coingecko.com/coins/images/10481/large/Tether_Gold.png';
      const cached = await this.loadIconWithCache(isSilver ? 'metal_silver_kag' : 'metal_gold_xaut', url);
      if (cached) return cached;
      return this.createBadgeImage('sparkles', isSilver ? '#94A3B8' : '#D97706');
    }

    // 4. 股票与指数：
    if (type === 'stock') {
      const idStr = String(market.id || '').trim();
      const symStr = String(market.symbol || '').trim();
      let stockUrl = '';
      let stockKey = '';

      // (1) 美股：所有美股品牌（AAPL, TSLA, NVDA, MSFT, META, GOOG, AMZN 等）直连官方 Logo
      if (idStr.toLowerCase().startsWith('us') || market.currency === '$' || sym === 'AAPL' || sym === 'TSLA' || sym === 'NVDA' || sym === 'MSFT' || sym === 'META') {
        let ticker = idStr.replace(/^us/i, '').replace(/\..*$/, '');
        if (!ticker) ticker = symStr.replace(/\..*$/, '');
        ticker = ticker.replace(/[^a-zA-Z]/g, '').toUpperCase();
        if (ticker.length >= 1 && ticker.length <= 5) {
          stockKey = `stock_us_${ticker}`;
          stockUrl = `https://companiesmarketcap.com/img/company-logos/64/${ticker}.png`;
        }
      }

      // (2) A 股与港股：所有知名品牌直连 CompaniesMarketCap 官方透明 Logo
      if (!stockUrl) {
        const numCode = idStr.replace(/^[a-zA-Z_]+/g, '') || symStr.replace(/^[a-zA-Z_]+/g, '');
        if (/^\d{6}$/.test(numCode)) {
          const suffix = numCode.startsWith('6') ? 'SS' : 'SZ';
          stockKey = `stock_a_${numCode}`;
          stockUrl = `https://companiesmarketcap.com/img/company-logos/64/${numCode}.${suffix}.png`;
        } else if (/^\d{4,5}$/.test(numCode) || idStr.toLowerCase().startsWith('hk')) {
          const hkNum = numCode.replace(/^0+/, '').padStart(4, '0');
          if (hkNum === '0700') {
            stockKey = 'stock_hk_0700_tcehy';
            stockUrl = 'https://companiesmarketcap.com/img/company-logos/64/TCEHY.png';
          } else if (hkNum === '9988') {
            stockKey = 'stock_hk_9988_baba';
            stockUrl = 'https://companiesmarketcap.com/img/company-logos/64/BABA.png';
          } else {
            stockKey = `stock_hk_${hkNum}`;
            stockUrl = `https://companiesmarketcap.com/img/company-logos/64/${hkNum}.HK.png`;
          }
        }
      }

      if (stockUrl) {
        const cached = await this.loadIconWithCache(stockKey, stockUrl);
        if (cached) return cached;
      }

      // (3) 未被 CMC 收入的股票（如中国重汽 000951 等）：100% 自动优雅采用雪球官方高清透明 Logo
      const xqLogo = this.getXueqiuLogo();
      if (xqLogo) return xqLogo;
    }

    // 5. 公募基金：天天基金/理财纯透明图腾
    if (type === 'fund') {
      return this.createBadgeImage('chart.pie.fill', '#3B82F6');
    }

    // 6. 离线/保底：原生 SFSymbol 纯透明无底色
    return this.createBadgeImage('bitcoinsign.circle', '#F59E0B');
  };

  fetchOilData = async (provName, oilKey) => {
    let p0 = '', p89 = '', p92 = '', p95 = '', p98 = '';
    let adjustDate = '', changeAmount = 0;
    const cleanProv = (provName || '广东').replace(/省|市/g, '');

    if (oilKey) {
      try {
        const url = `https://apis.tianapi.com/oilprice/index?key=${oilKey}&prov=${encodeURIComponent(cleanProv)}`;
        const req = new Request(url);
        req.timeoutInterval = 4;
        const res = await req.loadJSON();
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
      const req = new Request(webUrl);
      req.timeoutInterval = 4;
      req.headers = { 'User-Agent': 'Mozilla/5.0' };
      const webRes = await req.loadString();
      if (webRes) {
        const match92 = webRes.match(/92号汽油<\/dt>\s*<dd>([\d\.]+)/);
        const match95 = webRes.match(/95号汽油<\/dt>\s*<dd>([\d\.]+)/);
        const match98 = webRes.match(/98号汽油<\/dt>\s*<dd>([\d\.]+)/);
        const match0 = webRes.match(/0号柴油<\/dt>\s*<dd>([\d\.]+)/);

        if (match92 && !p92) p92 = match92[1];
        if (match95 && !p95) p95 = match95[1];
        if (match98 && !p98) p98 = match98[1];
        if (match0 && !p0) p0 = match0[1];

        let rawTip = '';
        const varMatch = webRes.match(/var\s+tishiContent\s*=\s*["']([^"']+)["']/);
        if (varMatch) {
          rawTip = varMatch[1];
        } else {
          const divMatch = webRes.match(/class=["']tishi["'][^>]*>([\s\S]*?)<\/div>/);
          if (divMatch) rawTip = divMatch[1];
        }

        if (rawTip) {
          const cleanText = rawTip.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
          const dateMatch = cleanText.match(/(\d+月\d+日(?:\d+时)?)/);
          if (dateMatch) adjustDate = dateMatch[1];

          let isUp = true;
          if (cleanText.includes('下调') || cleanText.includes('跌')) isUp = false;

          const rangeMatch = cleanText.match(/([\d\.]+)元\/升(?:-([\d\.]+)元\/升)?/);
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
      adjustDate: adjustDate ? `${adjustDate}调价` : '待发改委公布',
      changeAmount,
    };
  };

  cacheData = async (params) => {
    try {
      const s = this.settings || {};
      const c_crypto = (s.cryptoSymbols || '').split(',').map((x) => x.trim()).filter(Boolean);
      const c_us = (s.usStockSymbols || '').split(',').map((x) => x.trim()).filter(Boolean);
      const c_cn = (s.cnStockSymbols || '').split(',').map((x) => x.trim()).filter(Boolean);
      const c_metal = (s.metalSymbols || '').split(',').map((x) => x.trim()).filter(Boolean);
      const c_fund = (s.fundSymbols || '').split(',').map((x) => x.trim()).filter(Boolean);
      const c_oil = (s.oilSymbols || '').split(',').map((x) => x.trim()).filter(Boolean);

      const hasCategorySettings = (
        c_crypto.length > 0 || c_us.length > 0 || c_cn.length > 0 ||
        c_metal.length > 0 || c_fund.length > 0 || c_oil.length > 0
      );

      const isOilFiltered = c_oil.length > 0;

      const cryptoKeys = [];
      const tencentKeys = [];
      const sgeKeys = [];
      const oilKeys = [];
      let orderedItems = [];

      if (hasCategorySettings) {
        // 【分栏设置优先】：100% 严格按用户填入的项目抓取，用户留空的分类绝对不加！绝不产生未填写资产！
        for (const item of c_crypto) {
          cryptoKeys.push(item);
          orderedItems.push({ key: item, type: 'crypto' });
        }
        for (const item of c_us) {
          const up = item.toUpperCase();
          const qKey = up.startsWith('US') ? up : `us${up}`;
          tencentKeys.push(qKey);
          orderedItems.push({ key: qKey, origin: item, type: 'usStock' });
        }
        for (const item of c_cn) {
          const up = item.toUpperCase();
          const clean = up.replace(/[^A-Z0-9]/g, '');
          let qKey = item;
          if (/^(SH|SZ|HK|BJ)/.test(clean)) {
            qKey = item;
          } else if ((clean.length === 4 || clean.length === 5) && /^\d+$/.test(clean)) {
            qKey = `hk${clean.padStart(5, '0')}`;
          } else if (clean.length === 6 && /^\d+$/.test(clean)) {
            if (/^(60|68|90|11)/.test(clean)) qKey = `sh${clean}`;
            else if (/^(00|30|20|12)/.test(clean)) qKey = `sz${clean}`;
            else if (/^(8|4)/.test(clean)) qKey = `bj${clean}`;
            else qKey = `sh${clean}`;
          }
          tencentKeys.push(qKey);
          orderedItems.push({ key: qKey, origin: item, type: 'cnStock' });
        }
        for (const item of c_metal) {
          const up = item.toUpperCase();
          const clean = up.replace(/[^A-Z0-9]/g, '');
          if (clean.includes('AG9999') || clean.includes('AG99') || up.includes('白银9999')) {
            sgeKeys.push('SGE_AG9999');
            orderedItems.push({ key: 'SGE_AG9999', origin: item, type: 'metal' });
          } else if (clean.includes('AU9999') || clean.includes('AU99') || clean.includes('9999') || up.includes('国内黄金') || up.includes('上海金')) {
            sgeKeys.push('SGE_AU9999');
            orderedItems.push({ key: 'SGE_AU9999', origin: item, type: 'metal' });
          } else if (clean.includes('AGTD') || clean.includes('AG') || up.includes('白银延期') || up.includes('国内白银')) {
            sgeKeys.push('SGE_AGTD');
            orderedItems.push({ key: 'SGE_AGTD', origin: item, type: 'metal' });
          } else if (clean.includes('AUTD') || clean.includes('TD') || up.includes('黄金延期')) {
            sgeKeys.push('SGE_AUTD');
            orderedItems.push({ key: 'SGE_AUTD', origin: item, type: 'metal' });
          } else if (clean === 'XAU' || clean === 'GOLD' || up.includes('现货黄金') || up.includes('伦敦金')) {
            tencentKeys.push('hf_XAU');
            orderedItems.push({ key: 'hf_XAU', origin: item, type: 'metal' });
          } else if (clean === 'XAG' || clean === 'SILVER' || up.includes('现货白银') || up.includes('伦敦银')) {
            tencentKeys.push('hf_XAG');
            orderedItems.push({ key: 'hf_XAG', origin: item, type: 'metal' });
          } else {
            sgeKeys.push(item);
            orderedItems.push({ key: item, origin: item, type: 'metal' });
          }
        }
        for (const item of c_fund) {
          const clean = item.replace(/[^0-9]/g, '');
          if (clean) {
            tencentKeys.push(`s_jj${clean}`);
            orderedItems.push({ key: clean, qKey: `s_jj${clean}`, origin: item, type: 'fund' });
          }
        }
        for (const item of c_oil) {
          oilKeys.push(item);
          orderedItems.push({ key: item, type: 'oil' });
        }
      } else {
        // 【兼容模式 / 仅有 btcType 模式】：纯粹解析用户在 btcType 中填入的内容
        // 若用户完全未作任何设置（全新状态），仅兜底原版纯粹的 'BTC,ETH,BNB'，绝无任何股票/乱加项！
        const rawList = (params || s.btcType || 'BTC,ETH,BNB')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        const cryptoSet = new Set([
          'BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'USDC', 'XRP', 'DOGE', 'TON', 'ADA',
          'AVAX', 'TRX', 'LINK', 'DOT', 'MATIC', 'NEAR', 'APT', 'SUI', 'PEPE',
          'SHIB', 'LTC', 'BCH', 'UNI', 'FIL', 'OKB', 'CRO', 'ATOM', 'XLM', 'XMR'
        ]);

        for (const item of rawList) {
          const upper = item.toUpperCase();
          const cleanCode = upper.replace(/[^A-Z0-9]/g, '');

          const isOil = /^(92|95|98|0|89)$/.test(cleanCode) ||
            /^(92#|95#|98#|0#|89#|92号|95号|98号|0号|89号|0号柴油|柴油|汽油|OIL92|OIL95|OIL98|OIL0)$/i.test(item);

          const isSgeMetal = /^(AU9999|AU99\.99|AUTD|AU\(T\+D\)|AGTD|AG\(T\+D\)|AG9999|AG99\.99)$/i.test(item) ||
            cleanCode === 'AU9999' || cleanCode === 'AUTD' || cleanCode === 'AGTD' || cleanCode === 'AG9999' ||
            ['上海金', '国内黄金', '国内白银', '白银9999', '沪金', '沪银'].includes(upper);

          if (isOil) {
            oilKeys.push(item);
            orderedItems.push({ key: item, type: 'oil' });
          } else if (isSgeMetal) {
            if (cleanCode.includes('AG9999') || cleanCode.includes('AG99') || upper.includes('白银9999')) {
              sgeKeys.push('SGE_AG9999');
              orderedItems.push({ key: 'SGE_AG9999', origin: item, type: 'metal' });
            } else if (cleanCode.includes('AU9999') || cleanCode.includes('AU99') || cleanCode.includes('9999') || upper.includes('国内黄金') || upper.includes('上海金')) {
              sgeKeys.push('SGE_AU9999');
              orderedItems.push({ key: 'SGE_AU9999', origin: item, type: 'metal' });
            } else if (cleanCode.includes('AG')) {
              sgeKeys.push('SGE_AGTD');
              orderedItems.push({ key: 'SGE_AGTD', origin: item, type: 'metal' });
            } else {
              sgeKeys.push('SGE_AUTD');
              orderedItems.push({ key: 'SGE_AUTD', origin: item, type: 'metal' });
            }
          } else if (/^(SH|SZ|HK|BJ)/i.test(item)) {
            tencentKeys.push(item);
            orderedItems.push({ key: item, type: 'tencent' });
          } else if (/^(S_JJ)/i.test(item)) {
            tencentKeys.push(item);
            orderedItems.push({ key: item.replace(/^s_jj/i, ''), qKey: item, type: 'fund' });
          } else if ((cleanCode.length === 4 || cleanCode.length === 5) && /^\d+$/.test(cleanCode)) {
            const hkCode = `hk${cleanCode.padStart(5, '0')}`;
            tencentKeys.push(hkCode);
            orderedItems.push({ key: hkCode, origin: item, type: 'cnStock' });
          } else if (/^\d{6}$/.test(item)) {
            if (/^(60|68|90|11)/.test(item)) {
              tencentKeys.push(`sh${item}`);
              orderedItems.push({ key: `sh${item}`, origin: item, type: 'cnStock' });
            } else if (/^(00|30|20|12)/.test(item)) {
              tencentKeys.push(`sz${item}`);
              orderedItems.push({ key: `sz${item}`, origin: item, type: 'cnStock' });
            } else if (/^(8|4)/.test(item)) {
              tencentKeys.push(`bj${item}`);
              orderedItems.push({ key: `bj${item}`, origin: item, type: 'cnStock' });
            } else {
              tencentKeys.push(`s_jj${item}`);
              orderedItems.push({ key: item, qKey: `s_jj${item}`, origin: item, type: 'fund' });
            }
          } else if (['GOLD', 'XAU', '现货黄金', '伦敦金'].includes(upper)) {
            tencentKeys.push('hf_XAU');
            orderedItems.push({ key: 'hf_XAU', origin: item, type: 'metal' });
          } else if (['SILVER', 'XAG', '现货白银', '伦敦银'].includes(upper)) {
            tencentKeys.push('hf_XAG');
            orderedItems.push({ key: 'hf_XAG', origin: item, type: 'metal' });
          } else if (cryptoSet.has(upper)) {
            cryptoKeys.push(item);
            orderedItems.push({ key: item, type: 'crypto' });
          } else if (/^[A-Za-z]{1,5}$/.test(item)) {
            tencentKeys.push(`us${upper}`);
            orderedItems.push({ key: `us${upper}`, origin: item, type: 'usStock' });
          } else {
            cryptoKeys.push(item);
            orderedItems.push({ key: item, type: 'crypto' });
          }
        }
      }

      // 并发网络请求：使用 Promise.allSettled 同时拉取油价、金银、股票与币圈数据，彻底消除串行排队延迟！
      const oilMap = {};
      const sgeMap = {};
      const tencentMap = {};
      const cryptoMap = {};
      const tasks = [];

      // 1. 国内油价任务 (超时 4s)
      const shouldFetchOil = oilKeys.length > 0 || isOilFiltered;
      if (shouldFetchOil) {
        tasks.push(
          (async () => {
            const t0 = Date.now();
            try {
              const finalKey = (s.oilKey || '').trim();
              const finalProv = (s.oilProvince || '广东').trim();
              const oilRes = await this.fetchOilData(finalProv, finalKey);

              const makeOilItem = (subCode, subName, priceStr) => {
                const priceVal = parseFloat(priceStr) || 0;
                const amt = oilRes.changeAmount || 0;
                const pct = priceVal > 0 ? (amt / priceVal) * 100 : 0;
                const changeStr = amt !== 0 ? (amt > 0 ? `+${amt.toFixed(2)}` : `${amt.toFixed(2)}`) : '0.00';
                const nextPrice = priceVal > 0 && amt !== 0 ? (priceVal + amt).toFixed(2) : priceVal.toFixed(2);

                return {
                  id: `oil_${subCode}`,
                  name: `${finalProv}${subName}`,
                  symbol: `${subCode}#`,
                  current_price: this.formatPrice(priceStr, 2, 2),
                  high_24h: nextPrice,
                  low_24h: priceVal.toFixed(2),
                  adjust_date: oilRes.adjustDate,
                  price_change_percentage_24h: pct,
                  expected_change_amount: changeStr,
                  last_updated: '',
                  currency: '¥',
                  region: 'cn',
                  type: 'oil',
                  url: `http://m.qiyoujiage.com/${this.provincePinyinMap[finalProv] || 'guangdong'}.shtml`,
                };
              };

              let gotP = [];
              if (oilRes.p92) { oilMap['92'] = makeOilItem('92', '92号汽油', oilRes.p92); gotP.push(`92: ${oilRes.p92}`); }
              if (oilRes.p95) { oilMap['95'] = makeOilItem('95', '95号汽油', oilRes.p95); gotP.push(`95: ${oilRes.p95}`); }
              if (oilRes.p98) { oilMap['98'] = makeOilItem('98', '98号汽油', oilRes.p98); gotP.push(`98: ${oilRes.p98}`); }
              if (oilRes.p0) { oilMap['0'] = makeOilItem('0', '0号柴油', oilRes.p0); gotP.push(`0号: ${oilRes.p0}`); }

              const cost = Date.now() - t0;
              const statusStr = gotP.length ? `成功 (${gotP.join(', ')} | ${oilRes.adjustDate})` : '未解析到价格';
              if (this.logDetails) this.logDetails.networkTasks.push({ name: '国内油价', cost, status: statusStr });
            } catch (e) {
              const cost = Date.now() - t0;
              const errStr = `油价获取失败: ${e.message || e}`;
              if (this.logDetails) {
                this.logDetails.networkTasks.push({ name: '国内油价', cost, status: `❌ ${errStr}` });
                this.logDetails.errors.push(errStr);
              }
            }
          })()
        );
      }

      // 2. 国内金银任务 (新浪 SGE，超时 4s)
      if (sgeKeys.length) {
        tasks.push(
          (async () => {
            const t0 = Date.now();
            try {
              const reqUrl = `http://hq.sinajs.cn/list=${sgeKeys.join(',')}`;
              const sgeReq = new Request(reqUrl);
              sgeReq.timeoutInterval = 4;
              sgeReq.headers = { 'Referer': 'https://finance.sina.com.cn' };
              const sgeRes = await sgeReq.loadString();
              const lines = sgeRes.split(';').map((s) => s.trim()).filter(Boolean);
              let parsedCount = 0;
              for (const line of lines) {
                const [k, v] = line.split('=');
                if (!v) continue;
                const content = v.replace(/^"/, '').replace(/"$/, '');
                if (!content) continue;
                const arr = content.split(',');
                const code = arr[0] || '';
                const name = arr[1] || arr[2] || '贵金属';
                let price = parseFloat(arr[3]) || 0;
                let prevClose = parseFloat(arr[4]) || 0;
                if (!price) price = parseFloat(arr[5]) || parseFloat(arr[9]) || 0;
                if (!prevClose) prevClose = parseFloat(arr[9]) || parseFloat(arr[5]) || price;
                const pct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

                let sgeUrl = 'https://wap.eastmoney.com/quote/stock/118.AU9999.html';
                const upperCode = code.toUpperCase();
                if (upperCode.includes('AG9999') || upperCode.includes('AG99')) {
                  sgeUrl = 'https://wap.eastmoney.com/quote/stock/118.AGTD.html';
                } else if (upperCode.includes('AG')) {
                  sgeUrl = 'https://wap.eastmoney.com/quote/stock/118.AGTD.html';
                } else if (upperCode.includes('TD')) {
                  sgeUrl = 'https://wap.eastmoney.com/quote/stock/118.AUTD.html';
                }
                const itemObj = {
                  id: code,
                  name: name.replace(/\s+/g, ''),
                  symbol: code.toUpperCase(),
                  current_price: this.formatPrice(price),
                  high_24h: this.formatPrice(arr[5] || price),
                  low_24h: this.formatPrice(arr[6] || price),
                  price_change_percentage_24h: pct,
                  last_updated: '',
                  currency: '¥',
                  region: 'cn',
                  type: 'metal',
                  url: sgeUrl,
                };
                sgeMap[code.toUpperCase()] = itemObj;
                sgeMap[`SGE_${code.toUpperCase()}`] = itemObj;
                parsedCount++;
              }
              const cost = Date.now() - t0;
              if (this.logDetails) this.logDetails.networkTasks.push({ name: '新浪贵金属(SGE)', cost, status: `成功解析 ${parsedCount} 个品种` });
            } catch (e) {
              const cost = Date.now() - t0;
              const errStr = `贵金属请求失败: ${e.message || e}`;
              if (this.logDetails) {
                this.logDetails.networkTasks.push({ name: '新浪贵金属(SGE)', cost, status: `❌ ${errStr}` });
                this.logDetails.errors.push(errStr);
              }
            }
          })()
        );
      }

      // 3. 腾讯财经任务 (A股/港股/美股/基金/现货金银，超时 4s)
      if (tencentKeys.length) {
        tasks.push(
          (async () => {
            const t0 = Date.now();
            try {
              const tencentUrl = `http://qt.gtimg.cn/utf8/q=${tencentKeys.join(',')}`;
              const req = new Request(tencentUrl);
              req.timeoutInterval = 4;
              const tencentRes = await req.loadString();
              const lines = tencentRes.split(';').map((s) => s.trim()).filter(Boolean);
              let parsedCount = 0;
              for (const line of lines) {
                const [k, v] = line.split('=');
                if (!v) continue;
                const key = k.replace('v_', '');
                const content = v.replace(/^"/, '').replace(/"$/, '');
                if (key.startsWith('s_jj')) {
                  const arr = content.split('~');
                  const code = (arr[0] || key.replace('s_jj', '')).toUpperCase();
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
                  tencentMap[`s_jj${code}`] = tencentMap[code];
                  parsedCount++;
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
                  parsedCount++;
                } else {
                  const arr = content.split('~');
                  const lowerKey = key.toLowerCase();
                  const isCN = lowerKey.startsWith('sh') || lowerKey.startsWith('sz') || lowerKey.startsWith('bj');
                  const isHK = lowerKey.startsWith('hk');
                  const codeOnly = arr[2] || key;
                  const displaySymbol = codeOnly.replace(/^US/i, '').replace(/\..*$/, '').toUpperCase();
                  const stockItem = {
                    id: key,
                    name: arr[1] || key,
                    symbol: displaySymbol,
                    current_price: this.formatPrice(arr[3]),
                    high_24h: this.formatPrice(arr[33] || arr[4]),
                    low_24h: this.formatPrice(arr[34] || arr[5]),
                    price_change_percentage_24h: parseFloat(arr[32]) || 0,
                    last_updated: arr[30] || '',
                    currency: isCN ? '¥' : isHK ? 'HK$' : '$',
                    region: (isCN || isHK) ? 'cn' : 'intl',
                    type: 'stock',
                    url: `https://gu.qq.com/${key}`,
                  };
                  tencentMap[key] = stockItem;
                  tencentMap[lowerKey] = stockItem;
                  tencentMap[key.toUpperCase()] = stockItem;
                  tencentMap[codeOnly] = stockItem;
                  parsedCount++;
                }
              }
              const cost = Date.now() - t0;
              if (this.logDetails) this.logDetails.networkTasks.push({ name: '腾讯财经(股票/基金)', cost, status: `成功解析 ${parsedCount} 个标的` });
            } catch (e) {
              const cost = Date.now() - t0;
              const errStr = `腾讯财经请求失败: ${e.message || e}`;
              if (this.logDetails) {
                this.logDetails.networkTasks.push({ name: '腾讯财经(股票/基金)', cost, status: `❌ ${errStr}` });
                this.logDetails.errors.push(errStr);
              }
            }
          })()
        );
      }

      // 4. 加密货币任务 (CoinGecko，超时 5s，带安全容错)
      if (cryptoKeys.length) {
        tasks.push(
          (async () => {
            const t0 = Date.now();
            try {
              const ids = await this.transforBtcType(cryptoKeys.join(','));
              let response;
              try {
                const req = new Request(`${this.endpoint}/coins/markets?vs_currency=usd&ids=${ids}`);
                req.timeoutInterval = 5;
                response = await req.loadJSON();
              } catch (err) {
                response = null;
              }
              if (!Array.isArray(response) || !response.length) {
                response = await this.getAllJson();
              }
              let parsedCount = 0;
              if (Array.isArray(response)) {
                response.forEach((it) => {
                  const sym = (it.symbol || '').toUpperCase();
                  const cryptoItem = {
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
                  cryptoMap[sym] = cryptoItem;
                  cryptoMap[it.id] = cryptoItem;
                  cryptoMap[(it.symbol || '').toLowerCase()] = cryptoItem;
                  parsedCount++;
                });
              }
              const cost = Date.now() - t0;
              if (this.logDetails) this.logDetails.networkTasks.push({ name: 'CoinGecko虚拟币', cost, status: `成功解析 ${parsedCount} 个币种` });
            } catch (e) {
              const cost = Date.now() - t0;
              const errStr = `虚拟币请求失败: ${e.message || e}`;
              if (this.logDetails) {
                this.logDetails.networkTasks.push({ name: 'CoinGecko虚拟币', cost, status: `❌ ${errStr}` });
                this.logDetails.errors.push(errStr);
              }
            }
          })()
        );
      }

      // 并行等待所有任务完成（最慢仅耗时一个最长接口，绝不累加）
      if (tasks.length) {
        const netStart = Date.now();
        await Promise.allSettled(tasks);
        if (this.logDetails) {
          this.logDetails.networkTotalTime = Date.now() - netStart;
        }
      }

      // 5. 按照用户的配置顺序精确拼装列表
      const list = [];
      const seenIds = new Set();

      for (const it of orderedItems) {
        let match = null;
        const key = it.key;
        const up = (it.origin || key).toUpperCase();
        const clean = up.replace(/[^A-Z0-9]/g, '');

        if (it.type === 'oil') {
          if (clean === '98' || key.includes('98')) match = oilMap['98'];
          else if (clean === '95' || key.includes('95')) match = oilMap['95'];
          else if (clean === '92' || key.includes('92')) match = oilMap['92'];
          else if (clean === '0' || key.includes('0') || key.includes('柴油')) match = oilMap['0'];
        } else if (it.type === 'crypto') {
          match = cryptoMap[key.toUpperCase()] || cryptoMap[key.toLowerCase()] || cryptoMap[key];
        } else if (it.type === 'metal') {
          match = sgeMap[key] || sgeMap[key.toUpperCase()] || tencentMap[key];
        } else if (it.type === 'fund') {
          match = tencentMap[it.qKey] || tencentMap[key];
        } else {
          match = tencentMap[key] || tencentMap[key.toLowerCase()] || tencentMap[key.toUpperCase()] ||
            sgeMap[key] || sgeMap[key.toUpperCase()] || cryptoMap[key.toUpperCase()];
        }

        if (match && !seenIds.has(match.id)) {
          seenIds.add(match.id);
          list.push(match);
        }
      }

      const finalDataSource = list;
      if (finalDataSource && finalDataSource.length > 0) {
        this.dataSource = finalDataSource;
        this.settings.dataSource = finalDataSource;
        this.settings.lastUpdatedTime = Date.now();
        this.saveSettings(false);
      } else if (this.settings.dataSource && this.settings.dataSource.length) {
        // 容错兜底：若本次所有接口均异常，保留旧数据展示，不覆盖
        this.dataSource = this.settings.dataSource;
      }
      return this.dataSource;
    } catch (e) {
      console.log(e);
      return this.dataSource || [];
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
      const req = new Request(`${this.endpoint}/coins/markets?vs_currency=usd&ids=`);
      req.timeoutInterval = 4;
      const response = await req.loadJSON();
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

  getSmallBg = async (rawImg, idOrSym = 'default') => {
    try {
      if (!rawImg) return null;
      if (!this.FILE_MGR.fileExists(this.cacheImage)) {
        this.FILE_MGR.createDirectory(this.cacheImage, true);
      }
      const safeKey = String(idOrSym).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
      const bgFilePath = this.FILE_MGR.joinPath(this.cacheImage, `bg_${safeKey}.png`);

      // 关键优化：小号水印背景直接读取磁盘缓存，彻底避免每次重复启动 WebView 导致卡顿与超时！
      if (this.FILE_MGR.fileExists(bgFilePath)) {
        return Image.fromFile(bgFilePath);
      }

      const webview = new WebView();
      let js = `const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvasSize = 250;
          canvas.width = canvasSize;
          canvas.height = canvasSize;
          ctx.globalAlpha = 0.3;

          // 精确复刻原版水印：drawSize=canvasSize, offset=-canvasSize/2+50=-75
          const drawSize = canvasSize;
          const offset = -canvasSize / 2 + 50;
          ctx.drawImage(
            img,
            offset,
            offset,
            drawSize,
            drawSize
          );
          const uri = canvas.toDataURL();
          completion(uri);
        };
        img.src = 'data:image/png;base64,${Data.fromPNG(rawImg).toBase64String()}';`;
      let image = await webview.evaluateJavaScript(js, true);
      image = image.replace(/^data\:image\/\w+;base64,/, '');
      const finalImg = Image.fromData(Data.fromBase64String(image));
      if (finalImg) {
        this.FILE_MGR.writeImage(bgFilePath, finalImg);
        return finalImg;
      }
      return rawImg;
    } catch (e) {
      return rawImg;
    }
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
    if (!this.dataSource || !this.dataSource.length) return [];
    if (this.settings.randomDisplay === '1' && this.dataSource.length > 1) {
      return this.shuffle(this.dataSource);
    }
    return this.dataSource;
  };

  renderSmall = async (widget) => {
    const list = this.getFilteredDataSource();
    if (!list || !list.length) {
      widget.setPadding(16, 16, 16, 16);
      const tip = widget.addText('未找到对应资产\n请检查关注种类与范围');
      tip.font = Font.systemFont(12);
      tip.textColor = Color.gray();
      return widget;
    }

    const market = list[0] || {};
    widget.url = market.url || 'https://www.coingecko.com/zh';

    const rawImage = await this.getItemImage(market);
    const backgroundImg = await this.getSmallBg(rawImage, market.id || market.symbol);
    widget.backgroundColor = this.backGroundColor;
    widget.backgroundImage = backgroundImg;
    widget.setPadding(12, 12, 12, 12);

    const topHeader = widget.addStack();
    topHeader.layoutHorizontally();
    topHeader.centerAlignContent();
    topHeader.addSpacer();

    const categoryTag = this.getCategoryTag(market);
    const tagStyle = this.getCategoryTagColor(categoryTag);
    const tagStack = topHeader.addStack();
    tagStack.setPadding(1, 3.5, 1, 3.5);
    tagStack.cornerRadius = 3;
    tagStack.backgroundColor = tagStyle.bg;
    const tagText = tagStack.addText(categoryTag);
    tagText.textColor = tagStyle.text;
    tagText.font = Font.boldSystemFont(8);

    topHeader.addSpacer(5);

    const coin = topHeader.addText(market.symbol ? market.symbol.toUpperCase() : '');
    coin.font = Font.semiboldSystemFont(22);
    coin.textColor = this.widgetColor;
    coin.lineLimit = 1;
    coin.minimumScaleFactor = 0.5;

    const isOil = market.type === 'oil';
    const name = widget.addText(market.name || '');
    name.font = Font.systemFont(10);
    name.textColor = Color.gray();
    name.rightAlignText();
    name.lineLimit = 1;
    widget.addSpacer();

    const changeVal = Number(market.price_change_percentage_24h) || 0;
    const trendTextStr = isOil
      ? (market.expected_change_amount && market.expected_change_amount !== '0.00'
          ? `预计${market.expected_change_amount}`
          : '预计调价0.00')
      : `${changeVal.toFixed(2)}%`;

    const trend = widget.addText(trendTextStr);
    trend.font = Font.mediumSystemFont(14);
    trend.textColor = this.getTrendColor(market, false);
    trend.rightAlignText();
    trend.lineLimit = 1;

    const curSym = market.currency || '$';
    const price = widget.addText(`${curSym} ${market.current_price || '0'}`);
    price.font = Font.semiboldSystemFont(24);
    price.textColor = this.widgetColor;
    price.rightAlignText();
    price.lineLimit = 1;
    price.minimumScaleFactor = 0.1;

    const history = widget.addText(
      isOil
        ? (market.adjust_date || '发改委定价')
        : `H: ${market.high_24h || '0'}, L: ${market.low_24h || '0'}`
    );
    history.font = Font.systemFont(9.5);
    history.textColor = Color.gray();
    history.rightAlignText();
    history.lineLimit = 1;
    history.minimumScaleFactor = 0.1;
    return widget;
  };

  rowCell = async (rowStack, market) => {
    rowStack.url = market.url || 'https://www.coingecko.com/zh';
    rowStack.layoutHorizontally();
    const image = await this.getNormalizedItemIcon(market, 28);
    const iconImage = rowStack.addImage(image);
    iconImage.imageSize = new Size(28, 28);

    rowStack.addSpacer(10);

    const centerStack = rowStack.addStack();
    centerStack.layoutVertically();

    const topCenterStack = centerStack.addStack();
    topCenterStack.layoutHorizontally();
    topCenterStack.centerAlignContent();

    const titleText = topCenterStack.addText((market.symbol || '').toUpperCase());
    titleText.textColor = this.widgetColor;
    titleText.font = this.provideFont('semibold', 15);
    titleText.lineLimit = 1;

    topCenterStack.addSpacer(6);

    const categoryTag = this.getCategoryTag(market);
    const tagStyle = this.getCategoryTagColor(categoryTag);
    const tagStack = topCenterStack.addStack();
    tagStack.setPadding(1.5, 4, 1.5, 4);
    tagStack.cornerRadius = 3;
    tagStack.backgroundColor = tagStyle.bg;
    const tagText = tagStack.addText(categoryTag);
    tagText.textColor = tagStyle.text;
    tagText.font = Font.boldSystemFont(8);

    topCenterStack.addSpacer();

    const curSym = market.currency || '$';
    const priceText = topCenterStack.addText(`${curSym} ${market.current_price || '0'}`);
    priceText.textColor = this.widgetColor;
    priceText.font = this.provideFont('medium', 14);
    priceText.rightAlignText();
    priceText.lineLimit = 1;

    const bottomCenterStack = centerStack.addStack();
    bottomCenterStack.layoutHorizontally();

    const isOil = market.type === 'oil';
    const subText = bottomCenterStack.addText(market.name || '');
    subText.textColor = Color.gray();
    subText.font = this.provideFont('regular', 10);
    subText.lineLimit = 1;

    bottomCenterStack.addSpacer();

    const historyText = bottomCenterStack.addText(
      isOil
        ? (market.adjust_date || '发改委定价')
        : `H: ${market.high_24h || '0'}, L: ${market.low_24h || '0'}`
    );
    historyText.textColor = Color.gray();
    historyText.font = this.provideFont('regular', 10);
    historyText.rightAlignText();
    historyText.lineLimit = 1;

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
    rateText.font = this.provideFont('medium', 13);
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
    if (!list || !list.length) {
      const tip = containerStack.addText('未找到对应资产，请检查关注种类与范围');
      tip.font = Font.systemFont(12);
      tip.textColor = Color.gray();
      return widget;
    }
    const maxLen = Math.min(list.length, 3);
    for (let index = 0; index < maxLen; index++) {
      const item = list[index];
      if (!item) continue;
      const rowCellStack = containerStack.addStack();
      await this.rowCell(rowCellStack, item);
      if (index < maxLen - 1) containerStack.addSpacer();
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


    return widget;
  }
}

// @组件代码结束
await Runing(Widget, '', false); //远程开发环境

//version:1.0.0