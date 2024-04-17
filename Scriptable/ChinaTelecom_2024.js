// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: phone-volume;
/**
 * 组件作者: 95度茅台
 * 组件名称: 中国电信_2
 * Version 1.0.5
 * 2023-10-30 16:30
 */

await main()
async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_telecom');
  
  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr ] = [
    'setting.json',
    'cache_image',
    'cache_string',
  ].map(getCachePath);
  
  /**
   * 读取储存的设置
   * @returns {object} - 设置对象
   */
  const getBotSettings = (file) => {
    if (fm.fileExists(file)) {
      return { balanceColor } = JSON.parse(fm.readString(file));
    }
    return null;
  };
  const setting = await getBotSettings(settingPath);
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (settings) => {
    fm.writeString(settingPath, JSON.stringify(settings, null, 2));
    console.log(JSON.stringify(
      settings, null, 2
    ))
  };
  
  /**  
  * 弹出通知
  * @param {string} title
  * @param {string} body
  * @param {string} url
  * @param {string} sound
  */
  const notify = async (title, body, url) => {
    let n = new Notification();
    n.title = title
    n.body = body
    n.sound = 'alert'
    if (url) {n.openURL = url}
    return await n.schedule();
  };
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImagePath = () => {
    const bgPath = fm.joinPath(fm.documentsDirectory(), '95duBackground');
    return fm.joinPath(bgPath, Script.name() + '.jpg');
  };
  
  /**
   * 获取图片、string并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
   */
  const useFileManager = ({ cacheTime } = {}) => {
    return {
      readString: (name) => {
        const filePath = fm.joinPath(cacheStr, name);  
        const fileExists =  fm.fileExists(filePath);
        if (fileExists && hasExpired(filePath) > cacheTime) {
          fm.remove(filePath);
          return null;
        }
        return fileExists ? fm.readString(filePath) : null;
      },
      writeString: (name, content) => fm.writeString(fm.joinPath(cacheStr, name), content),
      // cache image
      readImage: (name) => {
        const filePath = fm.joinPath(cacheImg, name);
        const fileExists =  fm.fileExists(filePath);
        if (fileExists && hasExpired(filePath) > cacheTime) {
          fm.remove(filePath);
          return null;
        }
        return fileExists ? fm.readImage(filePath) : null;
      },
      writeImage: (name, image) => fm.writeImage(fm.joinPath(cacheImg, name), image),
    };
    
    function hasExpired(filePath) {
      const createTime = fm.creationDate(filePath).getTime();
      return (Date.now() - createTime) / (60 * 60 * 1000)
    }
  };
  
  /**
   * 获取网络图片并使用缓存
   * @param {Image} url
   */
  const getCacheImage = async (name, url) => {
    const cache = useFileManager({ cacheTime : 240 });
    const image = cache.readImage(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.writeImage(name, img);
    return img;
  };
    
  /**
   * 获取缓存的 JSON 字符串
   * @param {string} jsonName
   * @param {string} jsonUrl
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, jsonUrl) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime });
    const jsonString = cache.readString(jsonName);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
    
    let response = await makeReq(jsonUrl);
    if (response?.serviceResultCode == 0 && setting.cookie) {
      const jsonFile = JSON.stringify(response);
      cache.writeString(jsonName, jsonFile);
    } else {
      await updateCookie(setting.loginUrl);
      response = await makeReq(jsonUrl);
    }
    return response;
  };
  
  /**
   * Get boxjs Data
   * Dependency: Quantumult-X / Surge
   */
  const getBoxjsData = async () => {
    try {
      const response = await new Request('http://boxjs.com/query/data/china_telecom_loginUrl').loadJSON();
      const loginUrl = response?.val;
      if (loginUrl) {
        setting.loginUrl = loginUrl;
        writeSettings(setting);
        return await updateCookie(loginUrl);
      }
    } catch (e) {
      notify('获取 Boxjs 数据失败⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
      return null;
    }
  };
  
  /**
   * 从用户套餐页面获取数据，并进行处理
   * @returns {Promise<Object>} - 包含处理后的语音、流量和余额信息的对象
   */
  const updateCookie = async (loginUrl) => {
    if (loginUrl) {
      const url = loginUrl.match(/(http.+)&sign/)?.[1] || loginUrl;
      const req = await new Request(url);
      await req.load();  
      const cookie = req.response.headers['Set-Cookie'];
      if (cookie) {
        setting.cookie = cookie;
        writeSettings(setting);
        notify('中国电信', '天翼账号中心 Cookie 更新成功');
        return cookie;
      }
    }
  };
  
  const makeReq = async (url) => {
    let cookie = setting.cookie;
    if (!cookie) {
      cookie = setting.loginUrl 
      ? await updateCookie(setting.loginUrl) 
      : await getBoxjsData();
    }
    const request = new Request(url);
    request.method = 'GET';
    request.headers = {
      Cookie: cookie
    };
    try {
      return await request.loadJSON();
    } catch (e) {
      console.log(e);
    }
  };
  
  const formatFlows = (balance) => {
    if (balance < 1) {
      return `${(balance * 1024).toFixed(1)} MB`;
    } else {
      return `${balance} GB`;
    }
  };
  
  const fetchPackage = async () => {
    const package = await getCacheString('package_detail.json', 'https://e.dlife.cn/user/package_detail.do');
    return package || {};
  };
  
  let voiceTotal = 0;
  let voiceBalance = 0;
  let totalFlow = 0;
  let balanceFlow = 0;
  
  const package = await fetchPackage();
  // 遍历 items 数组
  package?.items?.forEach(data => {
    data?.items?.forEach(item => {
      const { ratableAmount: amount, ratableResourcename: name } = item;
      if (item.unitTypeId == 1) {
        voiceTotal += parseFloat(item.ratableAmount);
        voiceBalance += parseFloat(item.balanceAmount);
      } else if (item.unitTypeId == 3 && amount < 999999990000 && (setting.orient ? name.includes('定向') : !name.includes('定向'))) {
        totalFlow += parseFloat(item.ratableAmount);
        balanceFlow += parseFloat(item.balanceAmount);
      } 
    });
  });
  
  // 语音
  const voice = voiceTotal > 0 ? (voiceBalance / voiceTotal * 100).toFixed(1) : 0;
  
  // 流量
  const flowTotal = (totalFlow / 1048576).toFixed(2);
  const flowBalance = (balanceFlow / 1048576).toFixed(2);
  const flow = flowTotal > 0 ? ((flowBalance / flowTotal) * 100).toFixed(1) : 0;
  // 格式化流量
  const flowBalFormat = formatFlows(flowTotal) || 0;
  
  // 余额
  const fetchBalance = async () => {
    const balances = await getCacheString('balance.json', 'https://e.dlife.cn/user/balance.do');  
    return balances || {}
  };
  
  const bal = await fetchBalance();
  const balanceAvailable = (bal?.totalBalanceAvailable / 100).toFixed(2) || 0;
  
  /**
   * Get dayNumber
   * Daily dosage
   */
  const date = Date.now();
  const dayNumber = Math.floor(date / 1000 / 60 / 60 / 24);
  if (dayNumber !== setting.dayNumber) {
    writeSettings({ 
      ...setting,
      dayNumber,
      flow,
      flowBalance,
      voice,
      voiceBalance
    });
    return null;
  };
  
  const [ flow1st, flow2nd, voice1st, voice2nd ] = [ setting.flow, flow, voice, setting.voice ];
  
  const StepFin = 100;
  const barWidth = 15;
  const barHeigth = 111
  
  //=========> Color <=========//
  const widgetBgColor = Color.dynamic(
    new Color("#fefefe"), 
    new Color("#1C1C1E")
  );
  const stackBgColor = Color.dynamic(
    new Color("#dfdfdf"), 
    new Color("#444444")
  );
  const barBgColor = Color.dynamic(
    new Color("#dfdfdf"), 
    new Color("#cfcfcf")
  );
  const MainTextColor = Color.dynamic(
    new Color("#000000"), 
    new Color("#ffffff")
  );
  const SubTextColor = Color.dynamic(  
    new Color("#666666"), 
    new Color("#aaaaaa")
  );
  
  // Small Widget Color
  const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
  const barColor = Color.dynamic(
    new Color('#CFCFCF'), 
    new Color('#7A7A7A')
  );

  const getColor = (value, isOpaque = false) => {
    const colorMap = new Map([
      [ 10, isOpaque ? new Color("#F7B50075") : new Color("#FF0000") ],
      [ 20, isOpaque ? new Color("#BE62F375") : new Color("#F7B500") ],
      [ 40, isOpaque ? new Color("#0099FF75") : new Color("#FFA500") ],
      [ 50, isOpaque ? new Color("#FFA50075") : new Color("#BE62F3") ],
      [ 65, isOpaque ? new Color("#FFA50075") : new Color("#0099FF") ],
      [ 75, isOpaque ? new Color("#FFA50075") : new Color("#44CB9C") ]
    ]);
  
    for (let [thresholdBetween, color] of colorMap) {
      if (value <= thresholdBetween) return color;
    }
    return isOpaque ? new Color("#FFA50075") : new Color("#00C400");
  };
  
  //=========> config <=========//
  const screenSize = Device.screenSize().height;
  const payment = 'alipays://platformapi/startapp?appId=2021001107610820&page=pages%2Ftop-up%2Fhome%2Findex';
  
  const df = new DateFormatter();
  df.dateFormat = 'ddHHmm'
  const day1st = df.string(new Date());
  
  const image = await getCacheImage('logo.png', 'https://gitcode.net/4qiao/scriptable/raw/master/img/icon/TelecomLogo.png');
  const image1 = await getCacheImage('logo1.png', 'https://gitcode.net/4qiao/framework/raw/master/img/icon/telecom_1.png');
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = await getBgImagePath();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage))
    } else if (setting.solidColor) {
      const gradient = new LinearGradient();
      const color = setting.gradient.length > 0 ? setting.gradient : [setting.rangeColor];
      const randomColor = color[Math.floor(Math.random() * color.length)];
      
      // 渐变角度
      const angle = setting.angle;
      const radianAngle = ((360 - angle) % 360) * (Math.PI / 180);
      const x = 0.5 + 0.5 * Math.cos(radianAngle);
      const y = 0.5 + 0.5 * Math.sin(radianAngle);
      gradient.startPoint = new Point(1 - x, y);
      gradient.endPoint = new Point(x, 1 - y);
      
      gradient.locations = [0, 1];
      gradient.colors = [
        new Color(randomColor, setting.transparency),
        new Color('#00000000')
      ];
      widget.backgroundGradient = gradient;
    } else {
      widget.backgroundColor = widgetBgColor;
    }
  };
  
  /**
   * Create Medium Widget
   * @param { string } string
   * @param { image } image
   */
  const createWidget = async () => {
    const widget = new ListWidget();
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
    await setBackground(widget);
    
    widget.setPadding(15, 15, 15, 15)
    const topStack = widget.addStack();
    topStack.layoutHorizontally();
    topStack.centerAlignContent();
    topStack.size = new Size(0, screenSize < 926 ? 25 : 28);
    
    const leftStack = topStack.addStack();
    leftStack.addSpacer();
    const logoImage = 
    leftStack.addImage(image);
    logoImage.tintColor = new Color('#2B83F1');
    logoImage.centerAlignImage();
    leftStack.addSpacer();
    topStack.addSpacer(50);
    
    const rightStack = topStack.addStack();
    rightStack.addSpacer();
    const balanceText = rightStack.addText(balanceAvailable);
    balanceText.textColor = new Color(balanceColor);
    balanceText.font = new Font('Georgia-Bold', screenSize < 926 ? 25 : 26);
    balanceText.url = payment;
    rightStack.addSpacer();
    widget.addSpacer(screenSize < 926 ? 3 : 5);
    
    /** 
     * Stacks and Bar
     * @param { string } string
     */
    const Content = widget.addStack();
    Content.setPadding(2, 2, 2, 2);
    Content.layoutHorizontally();
    
    const Stack1 = Content.addStack();
    Stack1.layoutVertically();
    Stack1.backgroundColor = stackBgColor;
    Stack1.size = new Size(0, barHeigth);
    Stack1.cornerRadius = 8;
    Stack1.addSpacer(12);
    
    const Stack1Head = Stack1.addStack();
    Stack1Head.addSpacer();
    const flowTitleText = Stack1Head.addText('剩余流量');
    flowTitleText.textColor = SubTextColor;
    flowTitleText.font = Font.mediumSystemFont(12);
    Stack1Head.addSpacer();
    Stack1.addSpacer(3);
    
    const flowStack = Stack1.addStack();
    flowStack.addSpacer();
    const flowText = flowStack.addText(flowBalFormat);
    flowText.textColor = MainTextColor
    flowText.font = Font.boldSystemFont(16);
    flowStack.addSpacer();
    
    const usedFlowStack = Stack1.addStack();
    usedFlowStack.addSpacer();
    if (day1st > '010000' && day1st < '010100') {
      usedFlowText = usedFlowStack.addText(`- ${(flowBalance - flowBalance).toFixed(2)}`);
    } else {
      usedFlowText = usedFlowStack.addText(`- ${(setting.flowBalance - flowBalance).toFixed(2)}`);
    }
    usedFlowText.textColor  = SubTextColor;
    usedFlowText.font = Font.boldSystemFont(13);
    usedFlowStack.addSpacer();
    Stack1.addSpacer(5);
    
    const Stack1Pct = Stack1.addStack();
    Stack1Pct.layoutHorizontally();
    Stack1Pct.centerAlignContent();
    Stack1Pct.addSpacer();
    
    const percentText1 = Stack1Pct.addText(flow);
    percentText1.textColor = MainTextColor
    percentText1.font = Font.boldSystemFont(28);
    const percentSymbol1 = Stack1Pct.addText(' %');
    percentSymbol1.textColor = SubTextColor
    percentSymbol1.font = Font.systemFont(26);
    Stack1Pct.addSpacer();
    Stack1.addSpacer();
    Content.addSpacer();
    
    // Progress bar 1
    const BarContent1 = Content.addStack();
    const progressBar1st = BarContent1.addImage(creatProgress(flow2nd, flow1st));
    progressBar1st.cornerRadius = 6
    progressBar1st.imageSize = new Size(barWidth, barHeigth);
    Content.addSpacer();
   
    // Progress bar 2
    const BarContent2 = Content.addStack();
    const progressBar2nd = BarContent2.addImage(creatProgress(voice1st, voice2nd));
    progressBar2nd.cornerRadius = 6
    progressBar2nd.imageSize = new Size(barWidth, barHeigth);
    Content.addSpacer();
    
    const Stack2 = Content.addStack();
    Stack2.layoutVertically();
    Stack2.backgroundColor = stackBgColor;
    Stack2.size = new Size(0, barHeigth);
    Stack2.cornerRadius = 8;
    Stack2.addSpacer(12);
    
    const Stack2Head = Stack2.addStack();
    Stack2Head.addSpacer();
    const voiceTitleText = Stack2Head.addText('剩余语音');
    voiceTitleText.textColor = SubTextColor
    voiceTitleText.font = Font.mediumSystemFont(12);
    Stack2Head.addSpacer();
    Stack2.addSpacer(3);
     
    const voiceStack = Stack2.addStack();
    voiceStack.addSpacer();
    const voiceText = voiceStack.addText(voiceBalance + ' Min');
    voiceText.textColor = MainTextColor
    voiceText.font = Font.boldSystemFont(16);
    voiceStack.addSpacer();
    
    const voiceUsedStack = Stack2.addStack();
    voiceUsedStack.addSpacer();
    if (day1st > '010000' && day1st < '010100') {
      voiceUsedText = voiceUsedStack.addText(`- ${voiceBalance - voiceBalance}`);
    } else {
      voiceUsedText = voiceUsedStack.addText(`- ${setting.voiceBalance - voiceBalance}`);
    }
    voiceUsedText.textColor  = SubTextColor
    voiceUsedText.font = Font.boldSystemFont(13);
    voiceUsedStack.addSpacer();
    Stack2.addSpacer(5);
    
    const Stack2Pct = Stack2.addStack();
    Stack2Pct.layoutHorizontally();
    Stack2Pct.centerAlignContent();
    Stack2Pct.addSpacer();
    
    const percentText2 = Stack2Pct.addText(voice);
    percentText2.textColor = MainTextColor;
    percentText2.font = Font.boldSystemFont(28);
    const percentSymbol2 = Stack2Pct.addText(' %');
    percentSymbol2.textColor = SubTextColor
    percentSymbol2.font = Font.systemFont(26);
    Stack2Pct.addSpacer();
    Stack2.addSpacer();
    
    if (!config.runsInWidget) {  
      await widget.presentMedium();
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
  };
    
  /**
   * Create Progress 
   * 中号组件柱状进度条
   */
  const creatProgress = (barValue1, barValue2) => {
    barValue1 = Math.round(barValue1);
    barValue2 = Math.round(barValue2);
    
    const context = new DrawContext();
    context.size = new Size(barWidth, barHeigth);
    context.opaque = false
    context.respectScreenScale = true
    
    const BarColor1 = getColor(barValue1);
    const BarColor2 = getColor(barValue2, true);
    
    // background
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, barWidth, barHeigth), 4, 4);
    context.addPath(path);
    context.setFillColor(barBgColor);
    context.fillPath();
    
    context.setFillColor(BarColor2);
    const path2 = new Path();
    const path2BarHeigth = (barHeigth * (barValue2 / StepFin) > barHeigth) ? barHeigth : barHeigth * (barValue2 / StepFin);
    path2.addRoundedRect(new Rect(0, barHeigth, barWidth, -path2BarHeigth), 2, 2);
    context.addPath(path2);
    context.fillPath();
    
    context.setFillColor(BarColor1);
    const path1 = new Path();
    const path1BarHeigth = (barHeigth * (barValue1 / StepFin) > barHeigth) ? barHeigth : barHeigth * (barValue1 / StepFin);
    path1.addRoundedRect(new Rect(0, barHeigth, barWidth, -path1BarHeigth), 2, 2);
    context.addPath(path1);
    context.fillPath();
    context.setFont(Font.boldSystemFont(barValue1 > 99 ? 6 : 8));
    context.setTextAlignedCenter();
    
    if (barValue1 < 90) {
      context.setTextColor(new Color("#666666"));
      context.drawTextInRect('%', new Rect(0, 3, barWidth, barHeigth));
    } else {
      context.setTextColor(new Color("#FFFFFF"));
      context.drawTextInRect('%', new Rect(0, barHeigth - 15, barWidth, barHeigth));
    };
    
    if (barValue1 <= 10) {
      PosCorr = -15
      context.setTextColor(  
        Color.black()
      );
    } else {
      PosCorr = 2
      context.setTextColor(
        Color.white()
      );
    };
    
    context.drawTextInRect(
      barValue1.toString(),
      new Rect(0, barHeigth - path1BarHeigth + PosCorr, barWidth, path1BarHeigth - PosCorr)
    );
    return context.getImage();
  };

  /**
   * Create Small Widget
   * @param { string } string
   * @param { image } image
   */
  const createSmallWidget = async () => {
    const widget = new ListWidget();
    await setBackground(widget);
    widget.setPadding(6, 0, 0, 0);
    if (balanceAvailable < 0) {
      widget.url = payment
    }

    const width = 128
    const height = 8
    const radius = height / 2
    
    if (setting.logoSwitch) {
      const logoImage = widget.addImage(image1);
      logoImage.centerAlignImage();
      logoImage.imageSize = new Size(screenSize < 926 ? 120 : 130, screenSize < 926 ? 37 : 40);
    } else {
      const logoImage = widget.addImage(image);
      logoImage.centerAlignImage();
      logoImage.imageSize = new Size(screenSize < 926 ? 110 : 115, screenSize < 926 ? 32 : 35);
      logoImage.tintColor = new Color('#2B83F1');
    }
    const balText = widget.addText('¥\u0020' + balanceAvailable);    
    balText.textColor = Color.orange();
    balText.font = new Font("Georgia-Bold", 22);
    balText.centerAlignText();
    widget.addSpacer(5);
    
    getwidget(voiceTotal, voiceBalance, `${voiceBalance} 分钟 » ${voice}%`, getColor(voice));
    getwidget(totalFlow, balanceFlow, `${flowBalFormat} » ${flow}%`, getColor(flow));
    
    function getwidget(Total, haveGone, str, progressColor) {
      const title = widget.addText(str);
      title.centerAlignText();
      title.textColor = textColor;
      title.font = Font.mediumSystemFont(13); //小组件字体大小
      widget.addSpacer(1);
      
      const drawImage = widget.addImage(creatProgress(Total, haveGone, progressColor));
      drawImage.centerAlignImage();
      drawImage.imageSize = new Size(width, height);
      widget.addSpacer(6);
    };
    
    function creatProgress(Total, haveGone, progressColor) {
      const context = new DrawContext();
      context.size = new Size(width, height);
      context.opaque = false
      context.respectScreenScale = true
      context.setFillColor(barColor);
      
      const path = new Path();
      path.addRoundedRect(new Rect(0, 0, width, height), radius, radius);
      context.addPath(path);
      context.fillPath();
      context.setFillColor(haveGone < 0.3 ? widgetBgColor : progressColor);
      
      const path1 = new Path();
      path1.addRoundedRect(new Rect(0, 0, width * haveGone / Total, height), radius, radius);
      context.addPath(path1);
      context.fillPath();
      return context.getImage();
    };
    return widget;
  };
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return await ctx.getImage();
  };
  
  /*
   * Name: MyWidget
   * Author: John Smith
   * Date: 2022/11/11
   * Version: 1.1
   * Description: This is a widget that displays some information.
   */
  const runWidget = async () => {
    const isSmallWidget =  config.widgetFamily === 'small'
    if (config.runsInWidget && isSmallWidget) {
      const widget = await createSmallWidget();
      Script.setWidget(widget);
      Script.complete();
    } else {
      await createWidget();
    }
  };
  await runWidget();
}
module.exports = { main }