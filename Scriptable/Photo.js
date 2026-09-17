// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: images;
/**
 * 日历照片墙
 * 添加到桌面前需先在UI运行选择指定图片或在iCloud创建WidgetPhotos文件夹轮巡图片
 * 有特殊字体，可下载相关字体或者清空字体配置
 *
 * @author Honye
 *
 * @version 1.2.2
 */


/**
 * @returns {Record<'small'|'medium'|'large'|'extraLarge', number>}
 */
const widgetSize = () => {
  const phones = {
    /** 16 Pro Max */
    956: { small: 170, medium: 364, large: 382 },
    /** 16 Pro */
    874: { small: 162, medium: 344, large: 366 },
    /** 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max */
    932: { small: 170, medium: 364, large: 382 },
    /** 13 Pro Max, 12 Pro Max */
    926: { small: 170, medium: 364, large: 382 },
    /** 11 Pro Max, 11, XS Max, XR */
    896: { small: 169, medium: 360, large: 379 },
    /** Plus phones */
    736: { small: 157, medium: 348, large: 357 },
    /** 16, 15 Pro, 15, 14 Pro */
    852: { small: 158, medium: 338, large: 354 },
    /** 13, 13 Pro, 12, 12 Pro */
    844: { small: 158, medium: 338, large: 354 },
    /** 13 mini, 12 mini / 11 Pro, XS, X */
    812: { small: 155, medium: 329, large: 345 },
    /** SE2 and 6/6S/7/8 */
    667: { small: 148, medium: 321, large: 324 },
    /** iPad Pro 2 */
    1194: { small: 155, medium: 342, large: 342, extraLarge: 715.5 },
    /** iPad 6 */
    1024: { small: 141, medium: 305.5, large: 305.5, extraLarge: 634.5 }
  };
  let { width, height } = Device.screenSize();
  if (width > height) height = width;

  if (phones[height]) return phones[height]

  if (config.runsInWidget) {
    const pc = { small: 164, medium: 344, large: 344 };
    return pc
  }

  // in app screen fixed 375x812 pt
  return { small: 155, medium: 329, large: 329 }
};

/**
 * @param {number} num
 */
const vmin = (num, widgetFamily) => {
  const family = widgetFamily || config.widgetFamily;
  if (!family) throw new Error('`vmin` only work in widget')
  const size = widgetSize();
  const width = size[family === 'large' ? 'medium' : family];
  const height = family === 'medium'
    ? size.small
    : family === 'extraLarge' ? size.large : size[family];
  return num * Math.min(width, height) / 100
};

/**
 * 多语言国际化
 * @param {{[language: string]: string} | [en:string, zh:string]} langs
 */
const i18n = (langs) => {
  const language = Device.language();
  if (Array.isArray(langs)) {
    langs = {
      en: langs[0],
      zh: langs[1],
      others: langs[0]
    };
  } else {
    langs.others = langs.others || langs.en;
  }
  return langs[language] || langs.others
};

/**
 * @param {...string} paths
 */
const joinPath = (...paths) => {
  const fm = FileManager.local();
  return paths.reduce((prev, curr) => {
    return fm.joinPath(prev, curr)
  }, '')
};

/**
 * 规范使用 FileManager。每个脚本使用独立文件夹
 *
 * 注意：桌面组件无法写入 cacheDirectory 和 temporaryDirectory
 * @param {object} options
 * @param {boolean} [options.useICloud]
 * @param {string} [options.basePath]
 */
const useFileManager = (options = {}) => {
  const { useICloud, basePath } = options;
  const fm = useICloud ? FileManager.iCloud() : FileManager.local();
  const paths = [fm.documentsDirectory(), Script.name()];
  if (basePath) {
    paths.push(basePath);
  }
  const cacheDirectory = joinPath(...paths);
  /**
   * 删除路径末尾所有的 /
   * @param {string} filePath
   */
  const safePath = (filePath) => {
    return fm.joinPath(cacheDirectory, filePath).replace(/\/+$/, '')
  };
  /**
   * 如果上级文件夹不存在，则先创建文件夹
   * @param {string} filePath
   */
  const preWrite = (filePath) => {
    const i = filePath.lastIndexOf('/');
    const directory = filePath.substring(0, i);
    if (!fm.fileExists(directory)) {
      fm.createDirectory(directory, true);
    }
  };

  const writeString = (filePath, content) => {
    const nextPath = safePath(filePath);
    preWrite(nextPath);
    fm.writeString(nextPath, content);
  };

  /**
   * @param {string} filePath
   * @param {*} jsonData
   */
  const writeJSON = (filePath, jsonData) => writeString(filePath, JSON.stringify(jsonData));
  /**
   * @param {string} filePath
   * @param {Image} image
   */
  const writeImage = (filePath, image) => {
    const nextPath = safePath(filePath);
    preWrite(nextPath);
    return fm.writeImage(nextPath, image)
  };

  /**
   * 文件不存在时返回 null
   * @param {string} filePath
   * @returns {string|null}
   */
  const readString = (filePath) => {
    const fullPath = fm.joinPath(cacheDirectory, filePath);
    if (fm.fileExists(fullPath)) {
      return fm.readString(
        fm.joinPath(cacheDirectory, filePath)
      )
    }
    return null
  };

  /**
   * @param {string} filePath
   */
  const readJSON = (filePath) => JSON.parse(readString(filePath));

  /**
   * @param {string} filePath
   * @returns {Image|null}
   */
  const readImage = (filePath) => {
    const fullPath = safePath(filePath);
    if (fm.fileExists(fullPath)) {
      return fm.readImage(fullPath)
    }
    return null
  };

  return {
    cacheDirectory,
    writeString,
    writeJSON,
    writeImage,
    readString,
    readJSON,
    readImage
  }
};

/** 规范使用文件缓存。每个脚本使用独立文件夹 */
const useCache = () => useFileManager({ basePath: 'cache' });

// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-gray; icon-glyph: cube;
/* 公历转农历代码思路：
1、建立农历年份查询表
2、计算输入公历日期与公历基准的相差天数
3、从农历基准开始遍历农历查询表，计算自农历基准之后每一年的天数，并用相差天数依次相减，确定农历年份
4、利用剩余相差天数以及农历每个月的天数确定农历月份
5、利用剩余相差天数确定农历哪一天 */

// 农历1949-2100年查询表
const lunarYearArr = [
  0x0b557, // 1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520 // 2100
];
const lunarMonth = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
const lunarDay = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '初', '廿'];
const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 公历转农历函数
function sloarToLunar (sy, sm, sd) {
  // 输入的月份减1处理
  sm -= 1;

  // 计算与公历基准的相差天数
  // Date.UTC()返回的是距离公历1970年1月1日的毫秒数,传入的月份需要减1
  let daySpan = (Date.UTC(sy, sm, sd) - Date.UTC(1949, 0, 29)) / (24 * 60 * 60 * 1000) + 1;
  let ly, lm, ld;
  // 确定输出的农历年份
  for (let j = 0; j < lunarYearArr.length; j++) {
    daySpan -= lunarYearDays(lunarYearArr[j]);
    if (daySpan <= 0) {
      ly = 1949 + j;
      // 获取农历年份确定后的剩余天数
      daySpan += lunarYearDays(lunarYearArr[j]);
      break
    }
  }

  // 确定输出的农历月份
  for (let k = 0; k < lunarYearMonths(lunarYearArr[ly - 1949]).length; k++) {
    daySpan -= lunarYearMonths(lunarYearArr[ly - 1949])[k];
    if (daySpan <= 0) {
      // 有闰月时，月份的数组长度会变成13，因此，当闰月月份小于等于k时，lm不需要加1
      if (hasLeapMonth(lunarYearArr[ly - 1949]) && hasLeapMonth(lunarYearArr[ly - 1949]) <= k) {
        if (hasLeapMonth(lunarYearArr[ly - 1949]) < k) {
          lm = k;
        } else if (hasLeapMonth(lunarYearArr[ly - 1949]) === k) {
          lm = '闰' + k;
        } else {
          lm = k + 1;
        }
      } else {
        lm = k + 1;
      }
      // 获取农历月份确定后的剩余天数
      daySpan += lunarYearMonths(lunarYearArr[ly - 1949])[k];
      break
    }
  }

  // 确定输出农历哪一天
  ld = daySpan;

  // 将计算出来的农历月份转换成汉字月份，闰月需要在前面加上闰字
  if (hasLeapMonth(lunarYearArr[ly - 1949]) && (typeof (lm) === 'string' && lm.indexOf('闰') > -1)) {
    lm = `闰${lunarMonth[/\d/.exec(lm) - 1]}`;
  } else {
    lm = lunarMonth[lm - 1];
  }

  // 将计算出来的农历年份转换为天干地支年
  ly = getTianGan(ly) + getDiZhi(ly);

  // 将计算出来的农历天数转换成汉字
  if (ld < 11) {
    ld = `${lunarDay[10]}${lunarDay[ld - 1]}`;
  } else if (ld > 10 && ld < 20) {
    ld = `${lunarDay[9]}${lunarDay[ld - 11]}`;
  } else if (ld === 20) {
    ld = `${lunarDay[1]}${lunarDay[9]}`;
  } else if (ld > 20 && ld < 30) {
    ld = `${lunarDay[11]}${lunarDay[ld - 21]}`;
  } else if (ld === 30) {
    ld = `${lunarDay[2]}${lunarDay[9]}`;
  }

  // console.log(ly, lm, ld);

  return {
    lunarYear: ly,
    lunarMonth: lm,
    lunarDay: ld
  }
}

// 计算农历年是否有闰月，参数为存储农历年的16进制
// 农历年份信息用16进制存储，其中16进制的最后1位可以用于判断是否有闰月
function hasLeapMonth (ly) {
  // 获取16进制的最后1位，需要用到&与运算符
  if (ly & 0xf) {
    return ly & 0xf
  } else {
    return false
  }
}

// 如果有闰月，计算农历闰月天数，参数为存储农历年的16进制
// 农历年份信息用16进制存储，其中16进制的第1位（0x除外）可以用于表示闰月是大月还是小月
function leapMonthDays (ly) {
  if (hasLeapMonth(ly)) {
    // 获取16进制的第1位（0x除外）
    return (ly & 0xf0000) ? 30 : 29
  } else {
    return 0
  }
}

// 计算农历一年的总天数，参数为存储农历年的16进制
// 农历年份信息用16进制存储，其中16进制的第2-4位（0x除外）可以用于表示正常月是大月还是小月
function lunarYearDays (ly) {
  let totalDays = 0;

  // 获取正常月的天数，并累加
  // 获取16进制的第2-4位，需要用到>>移位运算符
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    const monthDays = (ly & i) ? 30 : 29;
    totalDays += monthDays;
  }
  // 如果有闰月，需要把闰月的天数加上
  if (hasLeapMonth(ly)) {
    totalDays += leapMonthDays(ly);
  }

  return totalDays
}

// 获取农历每个月的天数
// 参数需传入16进制数值
function lunarYearMonths (ly) {
  const monthArr = [];

  // 获取正常月的天数，并添加到monthArr数组中
  // 获取16进制的第2-4位，需要用到>>移位运算符
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    monthArr.push((ly & i) ? 30 : 29);
  }
  // 如果有闰月，需要把闰月的天数加上
  if (hasLeapMonth(ly)) {
    monthArr.splice(hasLeapMonth(ly), 0, leapMonthDays(ly));
  }

  return monthArr
}

// 将农历年转换为天干，参数为农历年
function getTianGan (ly) {
  let tianGanKey = (ly - 3) % 10;
  if (tianGanKey === 0) tianGanKey = 10;
  return tianGan[tianGanKey - 1]
}

// 将农历年转换为地支，参数为农历年
function getDiZhi (ly) {
  let diZhiKey = (ly - 3) % 12;
  if (diZhiKey === 0) diZhiKey = 12;
  return diZhi[diZhiKey - 1]
}

/**
 * @file Scriptable WebView JSBridge native SDK
 * @version 1.0.3
 * @author Honye
 */

/**
 * @typedef Options
 * @property {Record<string, () => void>} methods
 */

const sendResult = (() => {
  let sending = false;
  /** @type {{ code: string; data: any }[]} */
  const list = [];

  /**
   * @param {WebView} webView
   * @param {string} code
   * @param {any} data
   */
  return async (webView, code, data) => {
    if (sending) return

    sending = true;
    list.push({ code, data });
    const arr = list.splice(0, list.length);
    for (const { code, data } of arr) {
      const eventName = `ScriptableBridge_${code}_Result`;
      const res = data instanceof Error ? { err: data.message } : data;
      await webView.evaluateJavaScript(
        `window.dispatchEvent(
          new CustomEvent(
            '${eventName}',
            { detail: ${JSON.stringify(res)} }
          )
        )`
      );
    }
    if (list.length) {
      const { code, data } = list.shift();
      sendResult(webView, code, data);
    } else {
      sending = false;
    }
  }
})();

/**
 * @param {WebView} webView
 * @param {Options} options
 */
const inject = async (webView, options) => {
  const js =
`(() => {
  const queue = window.__scriptable_bridge_queue
  if (queue && queue.length) {
    completion(queue)
  }
  window.__scriptable_bridge_queue = null

  if (!window.ScriptableBridge) {
    window.ScriptableBridge = {
      invoke(name, data, callback) {
        const detail = { code: name, data }

        const eventName = \`ScriptableBridge_\${name}_Result\`
        const controller = new AbortController()
        window.addEventListener(
          eventName,
          (e) => {
            callback && callback(e.detail)
            controller.abort()
          },
          { signal: controller.signal }
        )

        if (window.__scriptable_bridge_queue) {
          window.__scriptable_bridge_queue.push(detail)
          completion()
        } else {
          completion(detail)
          window.__scriptable_bridge_queue = []
        }
      }
    }
    window.dispatchEvent(
      new CustomEvent('ScriptableBridgeReady')
    )
  }
})()`;

  const res = await webView.evaluateJavaScript(js, true);
  if (!res) return inject(webView, options)

  const methods = options.methods || {};
  const events = Array.isArray(res) ? res : [res];
  // 同时执行多次 webView.evaluateJavaScript Scriptable 存在问题
  // 可能是因为 JavaScript 是单线程导致的
  const sendTasks = events.map(({ code, data }) => {
    return (() => {
      try {
        return Promise.resolve(methods[code](data))
      } catch (e) {
        return Promise.reject(e)
      }
    })()
      .then((res) => sendResult(webView, code, res))
      .catch((e) => {
        console.error(e);
        sendResult(webView, code, e instanceof Error ? e : new Error(e));
      })
  });
  await Promise.all(sendTasks);
  inject(webView, options);
};

/**
 * @param {WebView} webView
 * @param {object} args
 * @param {string} args.html
 * @param {string} [args.baseURL]
 * @param {Options} options
 */
const loadHTML = async (webView, args, options = {}) => {
  const { html, baseURL } = args;
  await webView.loadHTML(html, baseURL);
  inject(webView, options).catch((err) => console.error(err));
};

/**
 * 轻松实现桌面组件可视化配置
 *
 * - 颜色选择器及更多表单控件
 * - 快速预览
 *
 * GitHub: https://github.com/honye
 *
 * @version 1.7.1
 * @author Honye
 */

const fm = FileManager.local();
const fileName = 'settings.json';

const toast = (message) => {
  const notification = new Notification();
  notification.title = Script.name();
  notification.body = message;
  notification.schedule();
};

const isUseICloud = () => {
  const ifm = useFileManager({ useICloud: true });
  const filePath = fm.joinPath(ifm.cacheDirectory, fileName);
  return fm.fileExists(filePath)
};

/**
 * @returns {Promise<Settings>}
 */
const readSettings = async () => {
  const useICloud = isUseICloud();
  console.log(`[info] use ${useICloud ? 'iCloud' : 'local'} settings`);
  const fm = useFileManager({ useICloud });
  const settings = fm.readJSON(fileName);
  return settings
};

/**
 * @param {Record<string, unknown>} data
 * @param {{ useICloud: boolean; }} options
 */
const writeSettings = async (data, { useICloud }) => {
  const fm = useFileManager({ useICloud });
  fm.writeJSON(fileName, data);
};

const removeSettings = async (settings) => {
  const cache = useFileManager({ useICloud: settings.useICloud });
  fm.remove(
    fm.joinPath(cache.cacheDirectory, fileName)
  );
};

const moveSettings = (useICloud, data) => {
  const localFM = useFileManager();
  const iCloudFM = useFileManager({ useICloud: true });
  const [i, l] = [
    fm.joinPath(iCloudFM.cacheDirectory, fileName),
    fm.joinPath(localFM.cacheDirectory, fileName)
  ];
  try {
    // 移动文件需要创建父文件夹，写入操作会自动创建文件夹
    writeSettings(data, { useICloud });
    if (useICloud) {
      if (fm.fileExists(l)) fm.remove(l);
    } else {
      if (fm.fileExists(i)) fm.remove(i);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} NormalFormItem
 * @property {string} name
 * @property {string} label
 * @property {'text'|'number'|'color'|'select'|'date'|'cell'} [type]
 *  - HTML <input> type 属性
 *  - `'cell'`: 可点击的
 * @property {'(prefers-color-scheme: light)'|'(prefers-color-scheme: dark)'} [media]
 * @property {{ label: string; value: unknown }[]} [options]
 * @property {unknown} [default]
 */
/**
 * @typedef {Pick<NormalFormItem, 'label'|'name'> & { type: 'group', items: FormItem[] }} GroupFormItem
 */
/**
 * @typedef {Omit<NormalFormItem, 'type'> & { type: 'page' } & Pick<Options, 'formItems'|'onItemClick'>} PageFormItem 单独的页面
 */
/**
 * @typedef {NormalFormItem|GroupFormItem|PageFormItem} FormItem
 */
/**
 * @typedef {object} CommonSettings
 * @property {boolean} useICloud
 * @property {string} [backgroundImage] 背景图路径
 * @property {string} [backgroundColorLight]
 * @property {string} [backgroundColorDark]
 */
/**
 * @typedef {CommonSettings & Record<string, unknown>} Settings
 */
/**
 * @typedef {object} Options
 * @property {(data: {
 *  settings: Settings;
 *  family?: typeof config.widgetFamily;
 * }) => ListWidget | Promise<ListWidget>} render
 * @property {string} [head] 顶部插入 HTML
 * @property {FormItem[]} [formItems]
 * @property {(item: FormItem) => void} [onItemClick]
 * @property {string} [homePage] 右上角分享菜单地址
 * @property {(data: any) => void} [onWebEvent]
 */
/**
 * @template T
 * @typedef {T extends infer O ? {[K in keyof O]: O[K]} : never} Expand
 */

const previewsHTML =
`<div class="actions">
  <button class="preview" data-size="small"><i class="iconfont icon-yingyongzhongxin"></i>${i18n(['Small', '预览小号'])}</button>
  <button class="preview" data-size="medium"><i class="iconfont icon-daliebiao"></i>${i18n(['Medium', '预览中号'])}</button>
  <button class="preview" data-size="large"><i class="iconfont icon-dantupailie"></i>${i18n(['Large', '预览大号'])}</button>
</div>`;

const copyrightHTML =
`<footer>
  <div class="copyright">© UI powered by <a href="javascript:invoke('safari','https://www.imarkr.com');">iMarkr</a></div>
</footer>`;

/**
 * @param {Expand<Options>} options
 * @param {boolean} [isFirstPage]
 * @param {object} [others]
 * @param {Settings} [others.settings]
 * @returns {Promise<ListWidget|undefined>} 仅在 Widget 中运行时返回 ListWidget
 */
const present = async (options, isFirstPage, others = {}) => {
  const {
    formItems = [],
    onItemClick,
    render,
    head,
    homePage = 'https://www.imarkr.com',
    onWebEvent
  } = options;
  const cache = useCache();

  const settings = others.settings || await readSettings() || {};

  /**
   * @param {Parameters<Options['render']>[0]} param
   */
  const getWidget = async (param) => {
    const widget = await render(param);
    const { backgroundImage, backgroundColorLight, backgroundColorDark } = settings;
    if (backgroundImage && fm.fileExists(backgroundImage)) {
      widget.backgroundImage = fm.readImage(backgroundImage);
    }
    if (!widget.backgroundColor || backgroundColorLight || backgroundColorDark) {
      widget.backgroundColor = Color.dynamic(
        new Color(backgroundColorLight || '#ffffff'),
        new Color(backgroundColorDark || '#242426')
      );
    }
    return widget
  };

  if (config.runsInWidget) {
    const widget = await getWidget({ settings });
    Script.setWidget(widget);
    return widget
  }

  // ====== web start =======
  const style =
`:root {
  --color-primary: #007aff;
  --text-color: #1e1f24;
  --text-secondary: #8b8d98;
  --divider-color: #eff0f3;
  --card-background: #fff;
  --card-radius: 10px;
  --bg-input: #f9f9fb;
}
* {
  -webkit-user-select: none;
  user-select: none;
}
:focus-visible {
  outline-width: 2px;
}
body {
  margin: 10px 0;
  -webkit-font-smoothing: antialiased;
  font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
  accent-color: var(--color-primary);
  color: var(--text-color);
}
input, textarea {
  -webkit-user-select: auto;
  user-select: auto;
}
input:where([type="date"], [type="time"], [type="datetime-local"], [type="month"], [type="week"]) {
  accent-color: var(--text-color);
  white-space: nowrap;
}
select {
  accent-color: var(--text-color);
}
body {
  background: #f2f2f7;
}
button {
  font-size: 16px;
  background: var(--card-background);
  color: var(--text-color);
  border-radius: 8px;
  border: none;
  padding: 0.5em;
}
button .iconfont {
  margin-right: 6px;
}
.list {
  margin: 15px;
}
.list__header {
  margin: 0 20px;
  color: var(--text-secondary);
  font-size: 13px;
}
.list__body {
  margin-top: 10px;
  background: var(--card-background);
  border-radius: var(--card-radius);
  border-radius: 12px;
  overflow: hidden;
}
.form-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  column-gap: 1em;
  font-size: 16px;
  min-height: 2em;
  padding: 0.5em 20px;
  position: relative;
}
.form-item[media*="prefers-color-scheme"] {
  display: none;
}
.form-item--link .icon-arrow_right {
  color: #86868b;
}
.form-item + .form-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20px;
  right: 0;
  border-top: 0.5px solid var(--divider-color);
}
.form-item__input-wrapper {
  flex: 1;
  text-align: right;
  box-sizing: border-box;
  padding: 2px;
  margin-right: -2px;
  overflow: hidden;
}
.form-item__input {
  max-width: calc(100% - 4px);
}
.form-item .iconfont {
  margin-right: 4px;
}
.form-item input,
.form-item textarea,
.form-item select {
  font-size: 14px;
  text-align: right;
}
.form-item input[type=text],
.form-item textarea {
  width: 11em;
}
.form-item textarea {
  text-align: start;
}
.form-item input:not([type=color]),
.form-item textarea,
.form-item select {
  border-radius: 99px;
  background-color: var(--bg-input);
  border: none;
  color: var(--text-color);
}
.form-item input[type="checkbox"] {
  width: 1.25em;
  height: 1.25em;
}
input[type="number"] {
  width: 4em;
}
input[type="date"] {
  min-width: 6.4em;
}
input[type='checkbox'][role='switch'] {
  margin: 0;
  position: relative;
  display: inline-block;
  appearance: none;
  width: 40px;
  height: 25px;
  border-radius: 25px;
  background: var(--bg-input);
  transition: 0.3s ease-in-out;
}
input[type='checkbox'][role='switch']::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04), 0 2px 6px 0 rgba(0, 0, 0, 0.15), 0 2px 1px 0 rgba(0, 0, 0, 0.06);
  transition: 0.3s ease-in-out;
}
input[type='checkbox'][role='switch']:checked {
  background: var(--color-primary);
}
input[type='checkbox'][role='switch']:checked::before {
  transform: translateX(16px);
}
.actions {
  margin: 15px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 12px;
}
.copyright {
  margin: 15px;
  margin-inline: 18px;
  font-size: 12px;
  color: var(--text-secondary);
}
.copyright a {
  color: var(--text-color);
  text-decoration: none;
}
.preview.loading {
  pointer-events: none;
}
.icon-loading {
  display: inline-block;
  animation: 1s linear infinite spin;
}
@keyframes spin {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(1turn);
  }
}
@media (prefers-color-scheme: light) {
  .form-item[media="(prefers-color-scheme: light)"] {
    display: flex;
  }
}
@media (prefers-color-scheme: dark) {
  :root {
    --text-color: #eeeef0;
    --text-secondary: #6c6e79;
    --divider-color: #222325;
    --card-background: #19191b;
    --bg-input: #303136;
  }
  body {
    background: #111113;
  }
  input[type='checkbox'][role='switch']::before {
    background-color: rgb(206, 206, 206);
  }
  .form-item[media="(prefers-color-scheme: dark)"] {
    display: flex;
  }
}`;

  const js =
`(() => {
  const settings = ${JSON.stringify({
    ...settings,
    useICloud: isUseICloud()
  })}
  const formItems = ${JSON.stringify(formItems)}

  window.invoke = (code, data, cb) => {
    ScriptableBridge.invoke(code, data, cb)
  }

  const formData = {}

  const createFormItem = (item) => {
    const value = settings[item.name] ?? item.default ?? null
    formData[item.name] = value;
    const label = document.createElement("label");
    label.className = "form-item";
    if (item.media) {
      label.setAttribute('media', item.media)
    }
    const div = document.createElement("div");
    div.innerText = item.label;
    label.appendChild(div);
    if (/^(select|multi-select)$/.test(item.type)) {
      const wrapper = document.createElement('div')
      wrapper.className = 'form-item__input-wrapper'
      const select = document.createElement('select')
      select.className = 'form-item__input'
      select.name = item.name
      select.multiple = item.type === 'multi-select'
      const map = (options, parent) => {
        for (const opt of (options || [])) {
          if (opt.children?.length) {
            const elGroup = document.createElement('optgroup')
            elGroup.label = opt.label
            map(opt.children, elGroup)
            parent.appendChild(elGroup)
          } else {
            const option = document.createElement('option')
            option.value = opt.value
            option.innerText = opt.label
            option.selected = Array.isArray(value) ? value.includes(opt.value) : (value === opt.value)
            parent.appendChild(option)
          }
        }
      }
      map(item.options || [], select)
      select.addEventListener('change', ({ target }) => {
        let { value } = target
        if (item.type === 'multi-select') {
          value = Array.from(target.selectedOptions).map(({ value }) => value)
        }
        formData[item.name] = value
        invoke('changeSettings', formData)
      })
      wrapper.appendChild(select)
      label.appendChild(wrapper)
    } else if (
      item.type === 'cell' ||
      item.type === 'page'
    ) {
      label.classList.add('form-item--link')
      const icon = document.createElement('i')
      icon.className = 'iconfont icon-arrow_right'
      label.appendChild(icon)
      label.addEventListener('click', () => {
        const { name } = item
        switch (name) {
          case 'backgroundImage':
            invoke('chooseBgImg')
            break
          case 'clearBackgroundImage':
            invoke('clearBgImg')
            break
          case 'reset':
            reset()
            break
          default:
            invoke('itemClick', item)
        }
      })
    } else {
      const input = document.createElement(item.type ==='textarea' ? 'textarea' : "input")
      input.className = 'form-item__input'
      input.name = item.name
      input.type = item.type || "text";
      input.enterKeyHint = item.type ==='textarea' ? 'enter' : 'done'
      if (item.type === 'textarea') input.rows = '1'
      input.value = value
      // Switch
      if (item.type === 'switch') {
        input.type = 'checkbox'
        input.role = 'switch'
        input.checked = value
        if (item.name === 'useICloud') {
          input.addEventListener('change', (e) => {
            invoke('moveSettings', e.target.checked)
          })
        }
      }
      if (item.type === 'number') {
        input.inputMode = 'decimal'
      }
      if (input.type === 'text' || input.type === 'textarea') {
        input.size = 12
      }
      input.addEventListener("change", (e) => {
        formData[item.name] =
          item.type === 'switch'
          ? e.target.checked
          : item.type === 'number'
          ? Number(e.target.value)
          : e.target.value;
        invoke('changeSettings', formData)
      });
      label.appendChild(input);
    }
    return label
  }

  const createList = (list, title) => {
    const fragment = document.createDocumentFragment()

    let elBody;
    for (const item of list) {
      if (item.type === 'group') {
        const grouped = createList(item.items, item.label)
        fragment.appendChild(grouped)
      } else {
        if (!elBody) {
          const groupDiv = fragment.appendChild(document.createElement('div'))
          groupDiv.className = 'list'
          if (title) {
            const elTitle = groupDiv.appendChild(document.createElement('div'))
            elTitle.className = 'list__header'
            elTitle.textContent = title
          }
          elBody = groupDiv.appendChild(document.createElement('div'))
          elBody.className = 'list__body'
        }
        const label = createFormItem(item)
        elBody.appendChild(label)
      }
    }
    return fragment
  }

  const fragment = createList(formItems)
  document.getElementById('settings').appendChild(fragment)

  for (const btn of document.querySelectorAll('.preview')) {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget
      target.classList.add('loading')
      const icon = e.currentTarget.querySelector('.iconfont')
      const className = icon.className
      icon.className = 'iconfont icon-loading'
      invoke(
        'preview',
        e.currentTarget.dataset.size,
        () => {
          target.classList.remove('loading')
          icon.className = className
        }
      )
    })
  }

  const setFieldValue = (name, value) => {
    const input = document.querySelector(\`.form-item__input[name="\${name}"]\`)
    if (!input) return
    if (input.type === 'checkbox') {
      input.checked = value
    } else {
      input.value = value
    }
  }

  const reset = (items = formItems) => {
    for (const item of items) {
      if (item.type === 'group') {
        reset(item.items)
      } else if (item.type === 'page') {
        continue;
      } else {
        setFieldValue(item.name, item.default)
      }
    }
    invoke('removeSettings', formData)
  }
})()`;

  const html =
`<html>
  <head>
    <meta name='viewport' content='width=device-width, user-scalable=no'>
    <link rel="stylesheet" href="//at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
    <style>${style}</style>
  </head>
  <body>
  ${head || ''}
  <section id="settings"></section>
  ${isFirstPage ? (previewsHTML + copyrightHTML) : ''}
  <script>${js}</script>
  </body>
</html>`;

  const webView = new WebView();
  const methods = {
    async preview (data) {
      const widget = await getWidget({ settings, family: data });
      widget[`present${data.replace(data[0], data[0].toUpperCase())}`]();
    },
    safari (data) {
      Safari.openInApp(data, true);
    },
    changeSettings (data) {
      Object.assign(settings, data);
      writeSettings(settings, { useICloud: settings.useICloud });
    },
    moveSettings (data) {
      settings.useICloud = data;
      moveSettings(data, settings);
    },
    removeSettings (data) {
      Object.assign(settings, data);
      clearBgImg();
      removeSettings(settings);
    },
    chooseBgImg (data) {
      chooseBgImg();
    },
    clearBgImg () {
      clearBgImg();
    },
    async itemClick (data) {
      if (data.type === 'page') {
        // `data` 经传到 HTML 后丢失了不可序列化的数据，因为需要从源数据查找
        const item = (() => {
          const find = (items) => {
            for (const el of items) {
              if (el.name === data.name) return el

              if (el.type === 'group') {
                const r = find(el.items);
                if (r) return r
              }
            }
            return null
          };
          return find(formItems)
        })();
        await present(item, false, { settings });
      } else {
        await onItemClick?.(data, { settings });
      }
    },
    native (data) {
      return onWebEvent?.(data)
    }
  };
  await loadHTML(
    webView,
    { html, baseURL: homePage },
    { methods }
  );

  const clearBgImg = () => {
    const { backgroundImage } = settings;
    delete settings.backgroundImage;
    if (backgroundImage && fm.fileExists(backgroundImage)) {
      fm.remove(backgroundImage);
    }
    writeSettings(settings, { useICloud: settings.useICloud });
    toast(i18n(['Cleared success!', '背景已清除']));
  };

  const chooseBgImg = async () => {
    try {
      const image = await Photos.fromLibrary();
      cache.writeImage('bg.png', image);
      const imgPath = fm.joinPath(cache.cacheDirectory, 'bg.png');
      settings.backgroundImage = imgPath;
      writeSettings(settings, { useICloud: settings.useICloud });
    } catch (e) {
      console.log('[info] 用户取消选择图片');
    }
  };

  webView.present();
  // ======= web end =========
};

/**
 * @param {Options} options
 */
const withSettings = async (options) => {
  const { formItems, onItemClick, ...restOptions } = options;
  return present({
    formItems: [
      {
        label: i18n(['Common', '通用']),
        type: 'group',
        items: [
          {
            label: i18n(['Sync with iCloud', '云盘同步']),
            type: 'switch',
            name: 'useICloud',
            default: false
          },
          {
            label: i18n(['Background', '个性背景']),
            type: 'page',
            name: 'background',
            formItems: [
              {
                label: i18n(['Background', '个性背景']),
                type: 'group',
                items: [
                  {
                    name: 'backgroundColorLight',
                    type: 'color',
                    label: i18n(['Background color', '背景色']),
                    media: '(prefers-color-scheme: light)',
                    default: '#ffffff'
                  },
                  {
                    name: 'backgroundColorDark',
                    type: 'color',
                    label: i18n(['Background color', '背景色']),
                    media: '(prefers-color-scheme: dark)',
                    default: '#242426'
                  },
                  {
                    label: i18n(['Background image', '背景图']),
                    type: 'cell',
                    name: 'backgroundImage'
                  }
                ]
              },
              {
                type: 'group',
                items: [
                  {
                    label: i18n(['Clear background image', '清除背景图']),
                    type: 'cell',
                    name: 'clearBackgroundImage'
                  }
                ]
              }
            ]
          },
          {
            label: i18n(['Reset', '恢复背景']),
            type: 'cell',
            name: 'reset'
          }
        ]
      },
      {
        label: i18n(['Settings', '设置']),
        type: 'group',
        items: formItems
      }
    ],
    onItemClick: (item, ...args) => {
      onItemClick?.(item, ...args);
    },
    ...restOptions
  }, true)
};

const preference = {
  titleFont: 'DFPKanTingLiuW9-GB',
  text: 'MOMO\nMIANMIAN',
  textColor: '#1e1f24',
  textColorDark: '#ffffff',
  secondaryColor: '#80828d',
  secondaryColorDark: '#b3b3bd',
  imageRadius: 6,
  useSlideshow: false,
  photoFolder: 'WidgetPhotos',
  randomLayout: false
};

// 扫描 iCloud 文档目录下的子文件夹列表
const getICloudFolders = () => {
  try {
    const fm = FileManager.iCloud();
    const root = fm.documentsDirectory();
    const files = fm.listContents(root);
    const dirs = files.filter(name => !name.startsWith('.') && fm.isDirectory(fm.joinPath(root, name)));
    if (!dirs.includes('WidgetPhotos')) {
      dirs.unshift('WidgetPhotos');
    }
    return dirs.map(d => ({ label: `📁 ${d}`, value: d }));
  } catch (e) {
    return [{ label: '📁 WidgetPhotos', value: 'WidgetPhotos' }];
  }
};

const rpt = (n) => vmin(n * 100 / 329, config.widgetFamily);
const cache = useCache();

const getPhoto = async (filename) => {
  const image = cache.readImage(filename);
  return image
};

const $12Animals = {
  子: '鼠',
  丑: '牛',
  寅: '虎',
  卯: '兔',
  辰: '龙',
  巳: '蛇',
  午: '马',
  未: '羊',
  申: '猴',
  酉: '鸡',
  戌: '狗',
  亥: '猪'
};

// 获取图片文件夹路径
function getPhotosDirectory() {
  const fm = FileManager.iCloud();
  const folderName = preference.photoFolder || 'WidgetPhotos';
  const dir = fm.joinPath(fm.documentsDirectory(), folderName);
  if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
  return dir;
}

// 随机获取指定数量的图片
async function getRandomPhotos(count) {
  const fm = FileManager.iCloud();
  const dir = getPhotosDirectory();
  const validExtensions = ['.jpg', '.JPG', '.png', '.PNG'];
  
  // 过滤有效的图片文件
  const files = fm.listContents(dir).filter(file => 
    validExtensions.some(ext => file.endsWith(ext))
  );

  if (files.length < count) {
    console.log("图片数量不足，请上传更多图片！");
    return [];
  }

  // 随机选择不重复的图片
  const selected = new Set();
  while (selected.size < count) {
    const randomIndex = Math.floor(Math.random() * files.length);
    selected.add(files[randomIndex]);
  }

  return Array.from(selected).map(file => fm.readImage(`${dir}/${file}`));
}

/**
 * @param {number} index
 */
const choosePhoto = async (index) => {
  const image = await Photos.fromLibrary();
  const filename = `photo_${index}`;
  cache.writeImage(filename, image);
};

// ==================== 安全获取图片辅助函数 ====================
const getSafePhotos = async (count) => {
  const { useSlideshow } = preference;
  const list = [];
  if (useSlideshow) {
    try {
      const randoms = await getRandomPhotos(count);
      if (randoms && randoms.length > 0) {
        list.push(...randoms);
      }
    } catch (e) {
      console.log('获取轮巡图片失败: ' + e);
    }
  }

  // 补齐指定图
  for (let i = 1; i <= 4; i++) {
    try {
      const img = await getPhoto(`photo_${i}`);
      if (img) list.push(img);
    } catch (e) {}
  }

  // 如果完全没有任何图，生成优雅的占位图防止崩溃
  if (list.length === 0) {
    const draw = new DrawContext();
    draw.size = new Size(100, 100);
    draw.setFillColor(new Color('#3a3a3c'));
    draw.fill(new Rect(0, 0, 100, 100));
    list.push(draw.getImage());
  }

  // 循环填满所需数量
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(list[i % list.length]);
  }
  return result;
};

// ==================== 多风格照片墙排版引擎 ====================

/**
 * 渲染照片单元
 * @param {WidgetStack} container 
 * @param {Image[]} images 
 * @param {number} groupWidth 
 * @param {number} groupHeight 
 * @param {number} cornerRadius 
 * @param {number} gap 
 * @param {boolean} forceRandom 是否启用随机排版
 */
const renderPhotoGroup = (container, images, groupWidth, groupHeight, cornerRadius, gap = 4, forceRandom = false) => {
  const group = container.addStack();
  group.size = new Size(groupWidth, groupHeight);
  group.centerAlignContent();

  const addImg = (stack, img, w, h) => {
    stack.size = new Size(w, h);
    stack.cornerRadius = cornerRadius;
    const item = stack.addImage(img);
    item.imageSize = new Size(w, h);
    item.applyFillingContentMode();
    return item;
  };

  // 风格 0: 经典排版（双竖条 + 上下双框，支持列随机）
  const renderStyle0 = () => {
    group.layoutHorizontally();
    const gapX = gap;
    const gapY = gap;
    const availableW = groupWidth - gapX * 2;
    const w1 = Math.floor(availableW * (80 / 285));
    const w2 = w1;
    const w3 = Math.max(1, availableW - w1 - w2);

    const availableH = groupHeight - gapY;
    let hTopRatio = 121 / 221;
    if (forceRandom && Math.random() > 0.5) hTopRatio = 100 / 221;
    const hTop = Math.floor(availableH * hTopRatio);
    const hBottom = Math.max(1, availableH - hTop);

    let pattern = 0;
    if (forceRandom) pattern = Math.floor(Math.random() * 3);

    const drawSingle = (img, w) => {
      const s = group.addStack();
      addImg(s, img, w, groupHeight);
    };

    const drawDouble = (imgT, imgB, w) => {
      const col = group.addStack();
      col.layoutVertically();
      col.size = new Size(w, groupHeight);
      const sT = col.addStack();
      addImg(sT, imgT, w, hTop);
      col.addSpacer(gapY);
      const sB = col.addStack();
      addImg(sB, imgB, w, hBottom);
    };

    if (pattern === 1) {
      drawDouble(images[2], images[3], w3);
      group.addSpacer(gapX);
      drawSingle(images[0], w1);
      group.addSpacer(gapX);
      drawSingle(images[1], w2);
    } else if (pattern === 2) {
      drawSingle(images[0], w1);
      group.addSpacer(gapX);
      drawDouble(images[2], images[3], w3);
      group.addSpacer(gapX);
      drawSingle(images[1], w2);
    } else {
      drawSingle(images[0], w1);
      group.addSpacer(gapX);
      drawSingle(images[1], w2);
      group.addSpacer(gapX);
      drawDouble(images[2], images[3], w3);
    }
  };

  // 风格 1: 大焦点主图 + 双竖条画廊（主次分明）
  const renderStyle1 = () => {
    group.layoutHorizontally();
    const gapX = gap;
    const availableW = groupWidth - gapX * 2;
    const mainW = Math.floor(availableW * 0.52);
    const subW = Math.floor((availableW - mainW) / 2);
    const isMainLeft = Math.random() > 0.5;

    const drawMain = (img) => {
      const s = group.addStack();
      addImg(s, img, mainW, groupHeight);
    };
    const drawSub = (img) => {
      const s = group.addStack();
      addImg(s, img, subW, groupHeight);
    };

    if (isMainLeft) {
      drawMain(images[0]);
      group.addSpacer(gapX);
      drawSub(images[1]);
      group.addSpacer(gapX);
      drawSub(images[2]);
    } else {
      drawSub(images[1]);
      group.addSpacer(gapX);
      drawSub(images[2]);
      group.addSpacer(gapX);
      drawMain(images[0]);
    }
  };

  // 风格 2: 黄金四宫格 / 错落田字格
  const renderStyle2 = () => {
    group.layoutHorizontally();
    const gapX = gap;
    const gapY = gap;
    const colW = Math.floor((groupWidth - gapX) / 2);
    const availableH = groupHeight - gapY;

    const ratio1 = Math.random() > 0.5 ? 0.58 : 0.5;
    const ratio2 = ratio1 === 0.5 ? 0.5 : (1 - ratio1);

    const hLTop = Math.floor(availableH * ratio1);
    const hLBottom = availableH - hLTop;
    const hRTop = Math.floor(availableH * ratio2);
    const hRBottom = availableH - hRTop;

    const colL = group.addStack();
    colL.layoutVertically();
    colL.size = new Size(colW, groupHeight);
    const sLT = colL.addStack();
    addImg(sLT, images[0], colW, hLTop);
    colL.addSpacer(gapY);
    const sLB = colL.addStack();
    addImg(sLB, images[1], colW, hLBottom);

    group.addSpacer(gapX);

    const colR = group.addStack();
    colR.layoutVertically();
    colR.size = new Size(colW, groupHeight);
    const sRT = colR.addStack();
    addImg(sRT, images[2], colW, hRTop);
    colR.addSpacer(gapY);
    const sRB = colR.addStack();
    addImg(sRB, images[3], colW, hRBottom);
  };

  // 风格 3: 杂志封面画册风（全宽大横条 + 三并排竖图）
  const renderStyle3 = () => {
    group.layoutVertically();
    const gapY = gap;
    const gapX = gap;
    const bannerH = Math.floor((groupHeight - gapY) * 0.42);
    const rowH = groupHeight - gapY - bannerH;
    const subW = Math.floor((groupWidth - gapX * 2) / 3);
    const isBannerTop = Math.random() > 0.5;

    const drawBanner = (img) => {
      const s = group.addStack();
      addImg(s, img, groupWidth, bannerH);
    };

    const drawRow = (img1, img2, img3) => {
      const row = group.addStack();
      row.layoutHorizontally();
      row.size = new Size(groupWidth, rowH);
      const s1 = row.addStack();
      addImg(s1, img1, subW, rowH);
      row.addSpacer(gapX);
      const s2 = row.addStack();
      addImg(s2, img2, subW, rowH);
      row.addSpacer(gapX);
      const s3 = row.addStack();
      addImg(s3, img3, subW, rowH);
    };

    if (isBannerTop) {
      drawBanner(images[0]);
      group.addSpacer(gapY);
      drawRow(images[1], images[2], images[3]);
    } else {
      drawRow(images[1], images[2], images[3]);
      group.addSpacer(gapY);
      drawBanner(images[0]);
    }
  };

  // 风格 4: 瀑布流双列三图（单长竖图 + 双横图）
  const renderStyle4 = () => {
    group.layoutHorizontally();
    const gapX = gap;
    const gapY = gap;
    const leftW = Math.floor((groupWidth - gapX) * 0.42);
    const rightW = groupWidth - gapX - leftW;
    const halfH = Math.floor((groupHeight - gapY) / 2);
    const otherH = groupHeight - gapY - halfH;
    const isLeftSingle = Math.random() > 0.5;

    const drawSingle = (img, w) => {
      const s = group.addStack();
      addImg(s, img, w, groupHeight);
    };

    const drawDouble = (img1, img2, w) => {
      const col = group.addStack();
      col.layoutVertically();
      col.size = new Size(w, groupHeight);
      const s1 = col.addStack();
      addImg(s1, img1, w, halfH);
      col.addSpacer(gapY);
      const s2 = col.addStack();
      addImg(s2, img2, w, otherH);
    };

    if (isLeftSingle) {
      drawSingle(images[0], leftW);
      group.addSpacer(gapX);
      drawDouble(images[1], images[2], rightW);
    } else {
      drawDouble(images[1], images[2], rightW);
      group.addSpacer(gapX);
      drawSingle(images[0], leftW);
    }
  };

    // 特效渲染辅助：为切片赋予折面立体阴影、虚面磨砂或浮雕高光
  const applyBlindsEffect = (ctx, w, h, effectType, index) => {
    if (effectType === 'fold') {
      // 折面立面光影（模拟百叶窗折角 15°立体屏风感）
      // 在单侧绘制细腻柔和的微阴影
      const shadowW = Math.min(16, Math.floor(w * 0.28));
      const steps = 8;
      for (let s = 0; s < steps; s++) {
        const alpha = 0.28 * (1 - s / steps);
        ctx.setFillColor(new Color('#000000', alpha));
        // 交替向左折或向右折
        const xPos = (index % 2 === 0) ? (w - shadowW + s * (shadowW / steps)) : (s * (shadowW / steps));
        ctx.fill(new Rect(xPos, 0, shadowW / steps + 1, h));
      }
    } else if (effectType === 'frosted' && index === 1) {
      // 虚面磨砂（挑选一根副条加上柔和的朦胧磨砂雾化质感）
      ctx.setFillColor(new Color('#ffffff', 0.38));
      ctx.fill(new Rect(0, 0, w, h));
    } else if (effectType === 'emboss') {
      // 浮雕微立体（边缘高光与投影）
      ctx.setFillColor(new Color('#ffffff', 0.25));
      ctx.fill(new Rect(0, 0, 2, h)); // 左侧柔白微高光
      ctx.setFillColor(new Color('#000000', 0.20));
      ctx.fill(new Rect(w - 2, 0, 2, h)); // 右侧微柔阴影
    }
  };

  // 风格 5: 垂直百叶窗（支持粗细混搭、折面立体、虚面磨砂、浮雕高光）
  const renderStyle5 = () => {
    group.layoutHorizontally();
    const gapX = gap;

    const rhythms = [
      [0.50, 0.25, 0.25],
      [0.22, 0.56, 0.22],
      [0.20, 0.32, 0.48],
      [0.48, 0.32, 0.20],
      [1/3, 1/3, 1/3]
    ];
    const selectedRhythm = rhythms[Math.floor(Math.random() * rhythms.length)];
    const sliceCount = selectedRhythm.length;
    const availableW = groupWidth - gapX * (sliceCount - 1);

    const widths = selectedRhythm.map(r => Math.floor(availableW * r));
    const diffW = availableW - widths.reduce((a, b) => a + b, 0);
    widths[widths.length - 1] += diffW;

    // 特效选择：'none' | 'fold'(折面) | 'frosted'(虚面) | 'emboss'(浮雕) | 'shift'(阶梯微错位)
    const effects = ['fold', 'frosted', 'emboss', 'shift', 'none'];
    const currentEffect = effects[Math.floor(Math.random() * effects.length)];

    const baseImg = images[0];
    const imgW = baseImg.size.width;
    const imgH = baseImg.size.height;

    const scale = Math.max(groupWidth / imgW, groupHeight / imgH);
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;
    const baseOffsetX = (groupWidth - scaledW) / 2;
    const baseOffsetY = (groupHeight - scaledH) / 2;

    let currentX = 0;
    for (let i = 0; i < sliceCount; i++) {
      const w = widths[i];
      const s = group.addStack();

      // 阶梯微错位处理
      let yOffset = 0;
      if (currentEffect === 'shift') {
        yOffset = (i === 1) ? 7 : (i === 2 ? -4 : 0);
      }

      const ctx = new DrawContext();
      ctx.opaque = false;
      ctx.respectScreenScale = true;
      ctx.size = new Size(w, groupHeight);
      ctx.drawImageInRect(baseImg, new Rect(baseOffsetX - currentX, baseOffsetY + yOffset, scaledW, scaledH));

      // 叠加特效光影/虚面/浮雕
      applyBlindsEffect(ctx, w, groupHeight, currentEffect, i);

      const slicedImg = ctx.getImage();
      addImg(s, slicedImg, w, groupHeight);
      currentX += w + gapX;

      if (i < sliceCount - 1) {
        group.addSpacer(gapX);
      }
    }
  };

  // 风格 6: 水平百叶窗（支持粗细混搭、折面横条阴影、浮雕立体、虚面磨砂）
  const renderStyle6 = () => {
    group.layoutVertically();
    const gapY = gap;

    const rhythms = [
      [0.52, 0.24, 0.24],
      [0.22, 0.56, 0.22],
      [0.24, 0.24, 0.52],
      [1/3, 1/3, 1/3]
    ];
    const selectedRhythm = rhythms[Math.floor(Math.random() * rhythms.length)];
    const sliceCount = selectedRhythm.length;
    const availableH = groupHeight - gapY * (sliceCount - 1);

    const heights = selectedRhythm.map(r => Math.floor(availableH * r));
    const diffH = availableH - heights.reduce((a, b) => a + b, 0);
    heights[heights.length - 1] += diffH;

    const effects = ['fold', 'frosted', 'emboss', 'none'];
    const currentEffect = effects[Math.floor(Math.random() * effects.length)];

    const baseImg = images[0];
    const imgW = baseImg.size.width;
    const imgH = baseImg.size.height;

    const scale = Math.max(groupWidth / imgW, groupHeight / imgH);
    const scaledW = imgW * scale;
    const scaledH = imgH * scale;
    const baseOffsetX = (groupWidth - scaledW) / 2;
    const baseOffsetY = (groupHeight - scaledH) / 2;

    let currentY = 0;
    for (let i = 0; i < sliceCount; i++) {
      const h = heights[i];
      const s = group.addStack();

      const ctx = new DrawContext();
      ctx.opaque = false;
      ctx.respectScreenScale = true;
      ctx.size = new Size(groupWidth, h);
      ctx.drawImageInRect(baseImg, new Rect(baseOffsetX, baseOffsetY - currentY, scaledW, scaledH));

      // 水平特效
      if (currentEffect === 'fold') {
        const shadowH = Math.min(12, Math.floor(h * 0.3));
        for (let step = 0; step < 6; step++) {
          const alpha = 0.26 * (1 - step / 6);
          ctx.setFillColor(new Color('#000000', alpha));
          ctx.fill(new Rect(0, h - shadowH + step * (shadowH / 6), groupWidth, shadowH / 6 + 1));
        }
      } else if (currentEffect === 'frosted' && i === 1) {
        ctx.setFillColor(new Color('#ffffff', 0.35));
        ctx.fill(new Rect(0, 0, groupWidth, h));
      } else if (currentEffect === 'emboss') {
        ctx.setFillColor(new Color('#ffffff', 0.22));
        ctx.fill(new Rect(0, 0, groupWidth, 2));
        ctx.setFillColor(new Color('#000000', 0.18));
        ctx.fill(new Rect(0, h - 2, groupWidth, 2));
      }

      const slicedImg = ctx.getImage();
      addImg(s, slicedImg, groupWidth, h);
      currentY += h + gapY;

      if (i < sliceCount - 1) {
        group.addSpacer(gapY);
      }
    }
  };

  // 未启用随机排版：100% 走经典原版风格
  if (!forceRandom) {
    return renderStyle0();
  }

  // 开启随机排版：从 7 种排版形态（含垂直与水平百叶窗）中随机抽取
  const styleChoice = Math.floor(Math.random() * 7);
  switch (styleChoice) {
    case 0:
      renderStyle0();
      break;
    case 1:
      renderStyle1();
      break;
    case 2:
      renderStyle2();
      break;
    case 3:
      renderStyle3();
      break;
    case 4:
      renderStyle4();
      break;
    case 5:
      renderStyle5();
      break;
    case 6:
      renderStyle6();
      break;
    default:
      renderStyle0();
  }
};

// ==================== 小号组件 ====================
const createSmallWidget = async () => {
  const radius = preference.imageRadius > 0 ? preference.imageRadius : 6;
  const widget = new ListWidget();
  widget.backgroundColor = Color.dynamic(new Color('#ffffff'), new Color('#19191b'));
  
  const padding = 10;
  widget.setPadding(padding, padding, padding, padding);

  const size = widgetSize();
  const w = size.small || 155;
  const contentW = w - padding * 2;
  const contentH = w - padding * 2;

  const images = await getSafePhotos(4);
  renderPhotoGroup(widget, images, contentW, contentH, radius, 3, preference.randomLayout);
  return widget;
};

// ==================== 中号组件 ====================
const createMediumWidget = async () => {
  const radius = preference.imageRadius > 0 ? preference.imageRadius : 6;
  const widget = new ListWidget();
  widget.backgroundColor = Color.dynamic(new Color('#ffffff'), new Color('#19191b'));

  const size = widgetSize();
  const w = size.medium || 329;
  const h = size.small || 155;

  const paddingX = 10;
  const paddingY = 8;
  widget.setPadding(paddingY, paddingX, paddingY, paddingX);

  const contentW = w - paddingX * 2;
  const contentH = h - paddingY * 2;

  const groupGap = 4;
  const singleGroupW = Math.floor((contentW - groupGap) / 2);

  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();
  mainStack.centerAlignContent();

  const images = await getSafePhotos(8);

  // 第 1 组照片墙
  renderPhotoGroup(mainStack, images.slice(0, 4), singleGroupW, contentH, radius, 4, preference.randomLayout);

  mainStack.addSpacer(groupGap);

  // 第 2 组照片墙
  renderPhotoGroup(mainStack, images.slice(4, 8), singleGroupW, contentH, radius, 4, preference.randomLayout);

  return widget;
};
// ==================== 大号组件 ====================
const createLargeWidgetOriginal = async () => {
  const { text, titleFont, imageRadius, useSlideshow } = preference;
  const textColor = Color.dynamic(
    new Color(preference.textColor),
    new Color(preference.textColorDark)
  );
  const secondaryColor = Color.dynamic(
    new Color(preference.secondaryColor),
    new Color(preference.secondaryColorDark)
  );
  const widget = new ListWidget();
  widget.backgroundColor = Color.dynamic(new Color('#fff'), new Color('#19191b'));
  widget.setPadding(0, rpt(16), 0, 0);

  const head = widget.addStack();
  const title = head.addText(text);
  title.font = titleFont ? new Font(titleFont, rpt(28)) : Font.boldSystemFont(rpt(28));
  title.textColor = textColor;

  const now = new Date();
  head.addSpacer();
  head.centerAlignContent();
  const rightWrap = head.addStack();
  // rightWrap 宽需和 right 的宽一致
  rightWrap.size = new Size(rpt(138), -1);
  // 此处大小是下面 cornerRadius 的两倍
  rightWrap.addSpacer(rpt(24));
  const right = rightWrap.addStack();
  right.size = new Size(rpt(138), -1);
  right.backgroundColor = Color.dynamic(new Color('#F3F1F8'), new Color('#282829'));
  right.cornerRadius = rpt(12);
  right.centerAlignContent();
  right.setPadding(0, 0, 0, rpt(24))

  const date = right.addText(`${now.getDate()}`.padStart(2, '0'));
  date.font = new Font('DIN Alternate', rpt(38));
  date.textColor = textColor;
  right.addSpacer(rpt(6));
  const rr = right.addStack();
  rr.layoutVertically();

  const secondaryTextSize = rpt(10);
  const { lunarYear, lunarMonth, lunarDay } = sloarToLunar(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  const monthDf = new DateFormatter();
  monthDf.locale = 'zh-CN';
  monthDf.dateFormat = 'MMMM';
  const weekDf = new DateFormatter();
  weekDf.locale = 'zh-CN';
  weekDf.dateFormat = 'E';
  const monthWeek = rr.addText(`${monthDf.string(now)}｜${weekDf.string(now)}`);
  monthWeek.font = Font.systemFont(secondaryTextSize);
  monthWeek.textColor = secondaryColor;
  rr.addSpacer(rpt(4));
  const l = rr.addText(`${$12Animals[lunarYear[1]]}年${lunarMonth}月${lunarDay}`);
  l.font = Font.systemFont(secondaryTextSize);
  l.textColor = secondaryColor;

  widget.addSpacer(rpt(12));
  const photos = widget.addStack();
  photos.layoutHorizontally();
  photos.centerAlignContent();

  const addOne = async (filename) => {
    const size = new Size(rpt(80), rpt(152));
    const stack = photos.addStack();
    stack.size = size;
    stack.cornerRadius = imageRadius;

    const image = stack.addImage(useSlideshow ? filename : await getPhoto(filename));
    image.imageSize = size;
    image.applyFillingContentMode();
    return image
  };
  
  const photo = await getRandomPhotos(4);
  
  await addOne(useSlideshow ? photo[0] : 'photo_1');

  photos.addSpacer(rpt(4));
  await addOne(useSlideshow ? photo[1] : 'photo_2');

  photos.addSpacer(rpt(8));
  const photosRight = photos.addStack();
  photosRight.layoutVertically();

  const third = photosRight.addStack();
  const thirdSize = new Size(rpt(125), rpt(121));
  third.size = thirdSize;
  third.cornerRadius = imageRadius;
  const thirdImage = third.addImage(useSlideshow ? photo[2] : await getPhoto('photo_3'));
  thirdImage.imageSize = thirdSize;
  thirdImage.applyFillingContentMode();

  photosRight.addSpacer(rpt(4));
  const fourth = photosRight.addStack();
  const fourthSize = new Size(rpt(125), rpt(100));
  fourth.size = fourthSize;
  fourth.cornerRadius = imageRadius;
  const fourthImage = fourth.addImage(useSlideshow ? photo[3] : await getPhoto('photo_4'));
  fourthImage.imageSize = fourthSize;
  fourthImage.applyFillingContentMode();
  return widget
};

// 调度分流入口
const createWidget = async () => {
  const family = config.widgetFamily;
  if (family === 'small') {
    return await createSmallWidget();
  }
  if (family === 'medium') {
    return await createMediumWidget();
  }
  // 大号及默认环境完全走原版逻辑
  return await createLargeWidgetOriginal();
};

await withSettings({
  formItems: [
    {
      label: i18n(['Title', '标题文本']),
      name: 'text',
      type: 'textarea',
      default: preference.text
    },
    {
      label: i18n(['Title Font', '标题字体']),
      name: 'titleFont',
      default: preference.titleFont
    },
    {
      label: i18n(['Text Color', '标题颜色']),
      name: 'textColor',
      type: 'color',
      media: '(prefers-color-scheme: light)',
      default: preference.textColor
    },
    {
      label: i18n(['Text Color', '标题颜色']),
      name: 'textColorDark',
      type: 'color',
      media: '(prefers-color-scheme: dark)',
      default: preference.textColorDark
    },
    {
      label: i18n(['Secondary Color', '副文颜色']),
      name: 'secondaryColor',
      type: 'color',
      media: '(prefers-color-scheme: light)',
      default: preference.secondaryColor
    },
    {
      label: i18n(['Secondary Color', '副文颜色']),
      name: 'secondaryColorDark',
      type: 'color',
      media: '(prefers-color-scheme: dark)',
      default: preference.secondaryColorDark
    },
    {
      label: i18n(['Image Radius', '图片圆角']),
      name: 'imageRadius',
      type: 'number',
      default: preference.imageRadius
    },
    {
      label: i18n(['Image Slideshow', '图片轮循']),
      type: 'switch',
      name: 'useSlideshow',
      default: false
    },
    {
      label: i18n(['Photo Folder', '相册文件']),
      name: 'photoFolder',
      type: 'select',
      options: getICloudFolders(),
      default: preference.photoFolder
    },
    {
      label: i18n(['Random Layout', '随机排版']),
      type: 'switch',
      name: 'randomLayout',
      default: false
    },
    {
      label: i18n(['Choose Photo', '图片']),
      name: 'photos',
      type: 'group',
      items: [
        {
          label: i18n(['Photo 1', '指定图一']),
          name: 'photo1',
          type: 'cell'
        },
        {
          label: i18n(['Photo 2', '指定图二']),
          name: 'photo2',
          type: 'cell'
        },
        {
          label: i18n(['Photo 3', '指定图三']),
          name: 'photo3',
          type: 'cell'
        },
        {
          label: i18n(['Photo 4', '指定图四']),
          name: 'photo4',
          type: 'cell'
        }
      ]
    }
  ],
  onItemClick: ({ name }) => {
    const match = name.match(/photo(\d+)$/);
    if (match) {
      choosePhoto(Number(match[1]));
    }
  },
  render: async ({ family, settings }) => {
    if (family) config.widgetFamily = family;
    Object.assign(preference, settings);
    const widget = await createWidget();
    return widget
  }
});
