// 模块导入工具类
class $ {
  static async imports(...input) {
    return await Promise.all(input.map(i => this.import(...i)));
  }

  static async import(...args) {
    const url = this.#cdn(args.pop());
    const rule = args[0];

    try {
      const module = await import(url);
      const exp = "default" in module ? module.default : module;
      const expName = typeof exp.name === "string" ? exp.name : "default";
      this.#mountFunction(rule, exp, expName);
      console.log(`✅ ${url} 加载成功`);
    } catch (error) {
      console.log(`❌ 模块加载失败: ${url}`, error);
      throw error;
    }
  }
  static #cdn(path) {
    const { host } = new URL(path);
    if (!host.includes("github")) return path;
    return path
      .replace(host, `fastly.jsdelivr.net/gh`)
      .replace(/refs.+(?=main)/, "")
      .replace(/\/blob\//, "@")
      .replace(/\/main/, "@main")
      .replace(/\/master/, "@master");
  }
  static #mountFunction(rule, exp, expName, depth = 0) {
    if (typeof exp === "object" && depth === 0) {
      if (typeof rule === "string" && rule.includes("* as"))
        return (this[rule.split(" ").at(-1)] = exp);

      Object.entries(exp).forEach(([k, v]) => {
        this.#mountFunction(rule, v, k, depth + 1);
      });
    } else if (!rule) {
      this[expName] = exp;
    } else if (typeof rule === "string") {
      this[rule.split(" ").at(-1)] = exp;
    } else if (typeof rule === "function") {
      const result = rule({ name: expName, fn: exp });
      result.stop || (this[result.name ?? expName] = result.fn ?? exp);
    } else if (Array.isArray(rule)) {
      rule.forEach(n => {
        if (n.includes(expName)) this[n.split(" ").at(-1)] = exp;
      });
    }
  }
}
// LRU缓存类
class LRUCache {
  #cache;
  constructor(capacity, cache) {
    this.capacity = capacity;
    this.#cache = new Map(cache || []);
  }

  has(key) {
    return this.#cache.has(key);
  }

  get(key) {
    if (!this.#cache.has(key)) return;
    const value = this.#cache.get(key);
    this.#cache.delete(key);
    this.#cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.#cache.has(key)) {
      this.#cache.delete(key);
    } else if (this.#cache.size >= this.capacity) {
      this.#cache.delete(this.#cache.keys().next().value);
    }

    this.#cache.set(key, value);
  }

  toArray() {
    return this.#cache.entries().toArray();
  }
}
// 自定义错误类
class CustomError extends Error {
  constructor(...args) {
    super(args.pop());
    if (args[0]) this.name = args[0] + "Error";
  }
}
// 生成虚拟GUID·缓存Mac地址
const getMAc = key => {
  const generateHexPair = () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0");

  let uniqueId = $.cache.get(key);

  if (!uniqueId) {
    uniqueId = Array.from({ length: 6 }, generateHexPair)
      .join("")
      .toUpperCase();

    $.cache.set(key, uniqueId);
  }

  return uniqueId;
};
// 计算容量
const formatSize = (size, unit = "B") => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const currentIndex = Math.max(0, units.indexOf(unit.toUpperCase()));
  let bytes = size * 1024 ** currentIndex;
  let unitIndex = 0;
  while (bytes >= 1024 && unitIndex < units.length - 1) {
    bytes /= 1024;
    unitIndex++;
  }
  const formattedSize =
    bytes < 10
      ? bytes.toFixed(2)
      : bytes < 100
      ? bytes.toFixed(1)
      : Math.round(bytes).toString();
  return `${formattedSize} ${units[unitIndex]}`;
};
// 共享状态·全局配置
const sharedState = {
  GUID: "AppleMac",
  LOGIN_KEY: "AppleLogin",
  VERSION_KEY: "AppVersions",
  MAX_APP_CACHE: 50,
  CONCURRENCY_CONFIG: {
    concurrencyLimit: 5,
    maxRetry: 2,
    waitTime: 0.5,
  },
};

/**
 * 第三方服务抽象基类
 * 提供通用的接口发现和数据获取能力
 * @description 为所有第三方服务提供统一的基础功能
 */
const ThirdPartyService = class {
  /**
   * 抽象属性：子类必须实现的类型标识
   * @returns {string} 服务类型标识
   */
  static get type() {
    throw new Error(
      `抽象属性 type 定义接口类型 必须在子类 ${this.name} 中实现`
    );
  }

  /**
   * 获取所有可用的第三方接口列表
   * 接口命名规范：_get + InterfacesName + type
   * @description 返回当前支持的所有第三方接口标识符
   * @param {number} [limit=Number.MAX_SAFE_INTEGER] - 限制返回的接口数量，默认返回所有接口
   * @returns {Array<string>} - 可用的第三方接口标识符数组
   */
  static getAvailableInterfaces(limit = Number.MAX_SAFE_INTEGER) {
    const methods = Object.getOwnPropertyNames(this);
    const excludeMethod = `_getApp${this.type}List`;
    const regex = new RegExp(`^_get(.+)${this.type}$`);

    // 筛选符合模式的私有方法名并提取接口名称
    return methods
      .flatMap(method => {
        if (
          method.startsWith("_get") &&
          method.endsWith(this.type) &&
          method !== excludeMethod
        ) {
          return method.replace(regex, "$1");
        }
        return [];
      })
      .slice(0, limit);
  }

  /**
   * 动态搜索并调用第三方接口
   * @description 根据接口名称动态调用对应的私有方法
   * @param {string} selset - 接口名称 (如 "Timbrd", "Bilin")
   * @param {...any} args - 传递给具体方法的参数
   * @returns {Promise<any>} - 接口调用结果
   */
  static async searchInterface(selset, ...args) {
    const methodName = `_get${
      selset.charAt(0).toUpperCase() + selset.slice(1)
    }${this.type}`;

    if (this[methodName]) {
      return await this[methodName](...args);
    } else {
      throw new Error(`第三方接口 ${selset} 暂未实现`);
    }
  }

  /**
   * 通用第三方数据获取方法
   * @param {string|onject} req - 请求URL|请求对象
   * @param {string} id - 应用ID或查询参数
   * @param {Function} dataExtractor - 数据提取函数
   * @returns {Promise<Object>} - 格式化后的数据信息
   */
  static async _fetchThirdPartyData(req, id, dataExtractor) {
    try {
      const { body } = await $.http(req, 8);
      const data = dataExtractor(body);

      return {
        appId: id,
        data,
        total: data.length,
      };
    } catch (error) {
      throw new Error(`${req?.url ?? req} 接口请求失败: ${error.message}`);
    }
  }
};

/**
 * 版本查询服务
 * 专门处理应用版本相关查询
 * 重写基类抽象属性 type，返回 "Versions"
 * 接口命名规范：_get + InterfacesName + type
 * @description 继承自 ThirdPartyService，提供应用版本查询功能
 */
const VersionService = class extends ThirdPartyService {
  static type = "Versions";

  /**
   * 获取应用版本列表
   * @description 根据应用ID和选择的第三方接口获取应用版本列表
   * @param {string} id - 应用ID
   * @param {string} selset - 选择的第三方接口标识
   * @returns {Promise<[number, number][]>>} - 应用版本列表信息，每个元素为 [版本ID, 版本号]
   */
  static async getAppVersionList(id, selset) {
    return await this.searchInterface(selset, id);
  }

  /**
   * 并发获取应用版本列表
   * @description 并发调用所有可用的版本接口，返回第一个成功的结果
   * @param {string} id - 应用ID
   * @param {number} [num=Number.MAX_SAFE_INTEGER] - 限制返回的接口数量，默认返回所有接口
   * @returns {Promise<Object>} - 第一个成功的版本接口调用结果
   * @throws {Error} - 当所有接口都失败时抛出错误
   */
  static async concurrentGetVersionList(id, num = Number.MAX_SAFE_INTEGER) {
    const availableInterfaces = this.getAvailableInterfaces(num);

    if (availableInterfaces.length === 0) {
      throw new Error(`没有可用的版本接口`);
    }

    return Promise.any(
      availableInterfaces.map(interfaceName =>
        this.getAppVersionList(id, interfaceName)
      )
    );
  }

  /**
   * 通过 timbrd 接口获取应用版本列表（私有方法）
   * @param {string} id - 应用ID
   * @returns {Promise<Object>} - 应用版本列表
   */
  static async _getTimbrdVersions(id) {
    const url = `https://api.timbrd.com/apple/app-version/index.php?id=${id}`;
    return this._fetchThirdPartyData(url, id, body =>
      JSON.parse(body)
        .reverse()
        .map(({ external_identifier, bundle_version }) => [
          external_identifier,
          bundle_version,
        ])
    );
  }

  /**
   * 通过 bilin 接口获取应用版本列表（私有方法）
   * @param {string} id - 应用ID
   * @returns {Promise<Object>} - 应用版本列表
   */
  static async _getBilinVersions(id) {
    const url = `https://apis.bilin.eu.org/history/${id}`;
    return this._fetchThirdPartyData(url, id, body =>
      body.data.map(({ external_identifier, bundle_version }) => [
        external_identifier,
        bundle_version,
      ])
    );
  }
};

// 认证服务·登录Apple账号
const AuthService = class {
  /**
   * 登录Apple账号
   * 缓存登录响应
   * @description 登录Apple账号，获取登录响应数据
   * @param {Object} op - 登录参数
   * @param {string} op.appleId - Apple账号
   * @param {string} op.password - Apple账号密码
   * @param {string} [op.code] - 验证码，登录时需要提供
   * @returns {Promise<Object>} - 登录成功后的响应数据
   */
  static async #login({ appleId, password, code }) {
    const dataJson = {
      attempt: code ? 2 : 4,
      createSession: "true",
      guid: getMAc(sharedState.GUID),
      rmp: 0,
      why: "signIn",
      appleId,
      password: `${password}${code ?? ""}`,
    };
    const body = $.plist.build(dataJson);
    const url = `https://auth.itunes.apple.com/auth/v1/native/fast?guid=${dataJson.guid}`;
    const resp = await $.http.post({ url, body, timeout: 6 });
    const parsedResp = $.plist.parse(resp.body);

    this.validate(parsedResp);
    $.log("✅登录成功", parsedResp?.accountInfo);
    const cacheLoginResp = JSON.parse(
      $.cache.get(sharedState.LOGIN_KEY) || "{}"
    );

    const { "set-cookie": Cookie } = resp.headers;
    const storeFront = resp.headers["x-set-apple-store-front"]?.split("-")?.[0];
    Object.assign(cacheLoginResp, parsedResp, { password, Cookie, storeFront });
    $.cache.setJson(sharedState.LOGIN_KEY, cacheLoginResp);
    return { ...parsedResp, storeFront };
  }

  /**
   * 加载缓存登录响应
   * @description 从缓存中加载登录响应，如果不存在则进行登录并缓存
   * @param {Object} op - 登录参数
   * @param {string} op.appleId - Apple账号 当登录账号与缓存账号不一致时，会切换账号重新登录
   * @returns {Promise<Object>} - 登录成功后的响应数据
   */
  static async login(op) {
    const loginResp = JSON.parse($.cache.get(sharedState.LOGIN_KEY) || null);

    if (op && !loginResp) return await this.#login(op);

    if (op && op.appleId !== loginResp.accountInfo?.appleId) {
      $.log("登录账号与缓存账号不一致, 切换账号登录");
      $.cache.remove(sharedState.LOGIN_KEY);
      return await this.#login(op);
    }

    if (op && op.password !== loginResp.password) {
      $.log("密码变化，尝试重新登陆");
      return await this.#login(op);
    }

    this.validate(loginResp);
    op && $.log("✅已登录", loginResp.accountInfo);
    return loginResp;
  }

  /**
   * 刷新登录Cookie
   * @description 刷新当前登录的Cookie，延长登录有效期
   * @returns {Promise<Object>} - 刷新成功后的响应数据
   */
  static async refreshCookie() {
    const { accountInfo = {}, password } = JSON.parse(
      $.cache.get(sharedState.LOGIN_KEY) || "{}"
    );
    const { appleId } = accountInfo;
    if (!appleId || !password) {
      throw new CustomError("Login", "❌未登录,刷新Cookie失败,请重新登录");
    }
    return await this.#login({ appleId, password });
  }
  /**
   * 重置登录状态和缓存数据
   * @description 清除登录相关的缓存数据和GUID缓存
   * @returns {Object} - 重置结果信息
   */
  static reset() {
    try {
      // 清除登录缓存
      $.cache.remove(sharedState.LOGIN_KEY);
      // 清除GUID缓存（MAC地址）
      $.cache.remove(sharedState.GUID);

      $.log("✅重置成功，已清除登录缓存和GUID缓存");

      return {
        success: true,
        message: "重置成功，已清除登录信息和GUID缓存",
        clearedKeys: [sharedState.LOGIN_KEY, sharedState.GUID],
      };
    } catch (error) {
      throw new CustomError("Reset", `❌重置失败: ${error.message}`);
    }
  }

  /**
   * 验证登录响应
   * @param {Object} loginResp - 登录响应数据
   * @throws {Error} - 如果登录响应无效，抛出错误
   */
  static validate(loginResp) {
    if (!loginResp) throw new CustomError("Login", "❌未登录, 请先登录");

    if (!loginResp.accountInfo && !loginResp.customerMessage) {
      throw new CustomError("Login", "❌缓存数据异常， 请重新登陆");
    }

    if (Object.hasOwn(loginResp, "failureType")) {
      const { failureType, customerMessage } = loginResp;
      throw new CustomError("Login", [
        "❌登录失败",
        failureType,
        customerMessage,
      ]);
    }

    return true;
  }
};

// 商店服务·下载·购买
const StoreService = class {
  /**
   * 搜索应用
   * @param {string} term - 搜索关键词
   * @param {number} [limit=10] - 返回结果数量限制，默认10个
   * @param {string} [country='CN'] - 搜索的国家/地区，默认中国
   * @returns {Promise<Array>} - 搜索结果数组
   */
  static async searchApps({
    term,
    limit = 10,
    country = "CN",
    entity = "software",
  }) {
    // 构建搜索 URL
    const searchUrl = new URL("https://itunes.apple.com/search");
    searchUrl.searchParams.set("term", term.trim());
    searchUrl.searchParams.set("country", country.toLowerCase());
    searchUrl.searchParams.set("entity", entity);
    searchUrl.searchParams.set("explicit", "yes");
    searchUrl.searchParams.set("limit", limit.toString());

    // 发送请求
    const { body } = await $.http(searchUrl.toString(), 8);
    return body;
  }

  /**
   * 获取APP信息
   * 如果未购买应用 会尝试购买应用 购买失败会抛出错误
   * @param {number} salableAdamId - 应用的Adam ID
   * @param {number} [externalVersionId] - 应用的外部版本 ID，可选参数，不传则返回最新版本
   * @returns {Promise<Object>} - 应用信息
   */
  static async getAppInfo(salableAdamId, externalVersionId) {
    const { dsPersonId, Cookie } = await this.getValidatedAuth();

    const dataJson = {
      creditDisplay: "",
      guid: getMAc(sharedState.GUID),
      salableAdamId,
      externalVersionId,
    };
    const resp = await $.http.post({
      url: `https://p25-buy.itunes.apple.com/WebObjects/MZFinance.woa/wa/volumeStoreDownloadProduct?guid=${dataJson.guid}`,
      body: $.plist.build(dataJson),
      timeout: 6,
      headers: {
        Cookie,
        "X-Dsid": dsPersonId,
        "iCloud-DSID": dsPersonId,
      },
    });

    const appInfo = $.plist.parse(resp.body);
    try {
      this.validateAppInfo(appInfo);
      return await this.formatAppInfo(appInfo);
    } catch (error) {
      if (
        error.name === "AppInfoError" &&
        error.message.includes("2042") &&
        error.message.includes("2034")
      ) {
        await AuthService.refreshCookie();
        return await this.getAppInfo(salableAdamId, externalVersionId);
      }

      if (error.name === "AppInfoError" && error.message.includes("9610")) {
        await this.purchaseApp(salableAdamId);
        return await this.getAppInfo(salableAdamId, externalVersionId);
      }

      throw error;
    }
  }

  /**
   * 获取验证后的登录响应
   * @description 从缓存中获取登录响应并验证其有效性
   * @throws {Error} - 如果登录响应无效，抛出错误
   * @returns {Object} - 登录成功后的响应数据
   */
  static async getValidatedAuth() {
    return await AuthService.login();
  }

  /**
   * 校验应用信息
   * @param {Object} appInfo - 应用信息
   * @throws {Error} - 如果应用信息无效，抛出错误
   */
  static validateAppInfo(appInfo) {
    if (!appInfo) throw new CustomError("AppInfo", "❌应用信息为空");
    if (Object.hasOwn(appInfo, "failureType")) {
      const { failureType, customerMessage } = appInfo;
      throw new CustomError("AppInfo", [
        "❌获取应用信息失败",
        failureType,
        customerMessage,
      ]);
    }
    if (!appInfo?.songList?.length) {
      throw new CustomError("AppInfo", "❌这个版本号的应用信息为空");
    }

    return true;
  }

  /**
   * 批量查询应用版本号
   * @param {string} direction - 查询方向，'next' 表示查询更旧的版本，'prev' 表示查询更新的版本
   * @param {number} salableAdamId - 要查询的应用ID
   * @param {number} startVersionId - 查询的起点版本ID 默认为
   * @param {number} count - 要查询的数量，默认-1返回全部
   * @returns {Promise<Array<Object>>} - 版本信息列表
   */
  static async getVersions({
    direction,
    count = -1,
    salableAdamId,
    startVersionId,
  }) {
    // 初始化 从缓存中获取应用版本列表 如果缓存中不存在则从请求获取
    const { cachedVersionsAll, versionList } = await this.getAppVersionCache(
      salableAdamId,
      startVersionId
    );

    //不分页
    if (count === -1)
      return {
        data: versionList.entries().toArray(),
        total: versionList.size,
      };

    //分页
    let index = versionList.keys().toArray().indexOf(startVersionId);
    if (index === -1) index = 0;
    if (direction === "prev") index -= count;
    if (index < 0) index = 0;

    $.http.useReq(req => Object.assign(req, { timeout: 11 }));
    const page = versionList.entries().drop(index).take(count).toArray();

    const tasks = page.map(([extVersionId, cachebuildVersion]) => async () => {
      try {
        if (versionList.get(extVersionId))
          return [extVersionId, cachebuildVersion];
        const { buildVersion } = await StoreService.getAppInfo(
          salableAdamId,
          extVersionId
        );
        versionList.set(extVersionId, buildVersion);
        return [extVersionId, buildVersion];
      } catch ({ message }) {
        throw [extVersionId, message];
      }
    });

    const { fulfilled, rejected } = await $.taskProcessor.runTasks({
      tasks,
      ...sharedState.CONCURRENCY_CONFIG,
    });
    cachedVersionsAll.put(salableAdamId, versionList.entries().toArray());
    $.cache.set(
      sharedState.VERSION_KEY,
      JSON.stringify(cachedVersionsAll.toArray())
    );

    return {
      data: [...fulfilled, ...rejected],
      total: versionList.size,
    };
  }

  /**
   * 获取应用版本缓存
   * 合并三方接口数据
   * @description 从缓存中获取应用版本列表，如果不存在则从请求获取
   * @param {number} salableAdamId - 应用的Adam ID
   * @param {number} startVersionId - 应用的外部版本 ID，可选参数，不传则返回最新版本
   * @returns {cachedVersionsAll} - 所有app版本列表，缓存中不存在则返回空数组
   * @returns {versionList} - 当前应用版本列表(Map 类型，键为外部版本ID，值为null或者版本标识符)，缓存中不存在则拉取请求返回版本列表
   */
  static async getAppVersionCache(salableAdamId, startVersionId) {
    const cachedVersionsAll = new LRUCache(
      sharedState.MAX_APP_CACHE,
      JSON.parse($.cache.get(sharedState.VERSION_KEY) ?? "[]")
    );

    //如果缓存中不存在该应用的版本列表，则从请求获取 官方，三方接口数据
    if (!cachedVersionsAll.has(salableAdamId)) {
      const [processedVersions, legacyVersions] = await Promise.all([
        this.#processVersionIdList(salableAdamId, startVersionId),
        VersionService.concurrentGetVersionList(salableAdamId).catch(
          ({ errors = [], error }) => {
            $.log(...errors, error);
            return { total: 0, data: [] };
          }
        ),
      ]);

      if (processedVersions.length >= legacyVersions.total) {
        // 合并数据源
        processedVersions.forEach(p => {
          const legacy = legacyVersions.data.find(i => i[0] === p[0]);
          if (legacy && p[1] === "????") p[1] = legacy[1];
        });
        cachedVersionsAll.put(salableAdamId, processedVersions);
      } else {
        cachedVersionsAll.put(salableAdamId, legacyVersions.data);
      }
    }

    $.cache.set(
      sharedState.VERSION_KEY,
      JSON.stringify(cachedVersionsAll.toArray())
    );

    return {
      cachedVersionsAll,
      versionList: new Map(cachedVersionsAll.get(salableAdamId)),
    };
  }

  /**
   * 初始化版本ID列表，确保至少包含一个版本ID
   * @param {number} salableAdamId - 应用的Adam ID
   * @param {string} startVersionId - 应用的外部版本 ID，可选参数，不传则返回最新版本
   * @returns {Array} - 格式化后的版本ID数组，每个元素为[id, null]格式
   */
  static async #processVersionIdList(salableAdamId, startVersionId) {
    const { externalVersionIdList, externalVersionId, displayVersion } =
      await this.getAppInfo(salableAdamId, startVersionId);

    if (!externalVersionIdList.length) {
      return [[externalVersionId, displayVersion]];
    }

    return externalVersionIdList.reverse().map(id => [id, "????"]);
  }

  /**
   * 购买应用
   * @param {number} salableAdamId - 应用的Adam ID
   * @returns {Promise<string>} - 购买成功的应用软件ID
   * @throws {CustomError} - 如果购买失败，抛出错误
   */
  static async purchaseApp(salableAdamId) {
    const { dsPersonId, passwordToken, storeFront, Cookie } =
      await AuthService.refreshCookie();

    const dataJson = {
      appExtVrsId: "0",
      buyWithoutAuthorization: "true",
      guid: getMAc(sharedState.GUID),
      hasAskedToFulfillPreorder: "true",
      hasDoneAgeCheck: "true",
      price: "0",
      pricingParameters: "STDQ",
      productType: "C",
      salableAdamId,
    };
    const body = $.plist.build(dataJson);
    const url =
      "https://buy.itunes.apple.com/WebObjects/MZFinance.woa/wa/buyProduct";
    const headers = {
      Cookie,
      "X-Token": passwordToken,
      "X-Dsid": dsPersonId,
      "iCloud-DSID": dsPersonId,
      "X-Apple-Store-Front": storeFront,
    };
    const resp = await $.http.post({ url, body, headers }, 6);
    const { failureType, customerMessage, jingleDocType } = $.plist.parse(
      resp.body
    );

    switch (failureType) {
      case "5002":
        throw new CustomError("buy", "[发生未知错误] 已购买过");
      case "2040":
        throw new CustomError("buy", "[购买失败] 已购买过，已下架了");
      case "2059":
        throw new CustomError("buy", "[购买失败] 未买过，已下架，地区未上架");
      case "1010":
        throw new CustomError("buy", "[无效 Store] 该地区未上架");
      case "2034":
        throw new CustomError("buy", "[未登录到 iTunes Store] CK过期");
      case "2042":
        throw new CustomError("buy", "[未登录到 iTunes Store] CK为空或者过期");
      case "2019":
        throw new CustomError("buy", "[购买失败] 无法直接购买付费软件");
      case "9610":
        throw new CustomError("buy", "[未找到许可] 没购买过或应用ID错误");
      default:
        if (failureType || failureType === "")
          throw new CustomError("buy", `[购买失败] ${customerMessage}`);
    }

    if (jingleDocType) {
      $.log("购买成功", "软件ID:", salableAdamId);
      return salableAdamId;
    }
  }

  /**
   * 格式化应用信息
   * @param {Object} appInfo - 应用信息对象
   * @property {string} name - 应用名称
   * @property {string} appId - 应用唯一标识符
   * @property {string} url - 应用下载链接
   * @property {string} sinf - 应用授权信息
   * @property {string} bundleId - 应用包标识符
   * @property {string} displayVersion - 用户可见版本号
   * @property {string} buildVersion - 内部构建版本号
   * @property {number} externalVersionId - 外部版本标识符
   * @property {Array<number>} externalVersionIdList - 外部版本标识符列表
   * @property {number} fileSize - 文件大小
   * @property {Object} metadata - iTunesMetadata.plist 文件内容
   * @property {string} currency - 货币单位
   */
  static async formatAppInfo(appInfo) {
    const {
      metrics: { currency },
    } = appInfo;

    const {
      songId: appId,
      URL: url,
      "artwork-urls": {
        default: { url: icon },
      },
      sinfs: [{ sinf }],
      "asset-info": { "file-size": fileSize },
      metadata,
    } = appInfo.songList[0];

    const {
      bundleDisplayName: name,
      softwareVersionBundleId: bundleId,
      bundleShortVersionString: displayVersion,
      bundleVersion: buildVersion,
      softwareVersionExternalIdentifier: externalVersionId,
      softwareVersionExternalIdentifiers: externalVersionIdList,
      rating: { label: minimumOsVersion },
    } = metadata;

    const {
      accountInfo: { appleId },
    } = await this.getValidatedAuth();

    Object.assign(appInfo, { appleId });

    // 调试信息输出;
    //$.log("应用名称:", name);
    // $.log("软件下载链接:", url);
    // $.log("应用图标:", icon);
    // $.log("应用ID:", appId);
    // $.log("软件授权信息:", sinf);
    // $.log("应用包标识符:", bundleId);
    // $.log("用户版本号:", displayVersion);
    // $.log("内部版本号:", buildVersion);
    // $.log("版本标识符:", externalVersionId);
    // $.log("版本标识符列表:", externalVersionIdList);
    // $.log("文件大小:", fileSize);
    // $.log("iTunesMetadata.plist 文件", metadata);
    // $.log("货币:", currency);
    // $.log("最低支持系统版本:", minimumOsVersion);
    return {
      name,
      appId,
      url,
      icon,
      sinf,
      bundleId,
      displayVersion,
      buildVersion,
      externalVersionId,
      externalVersionIdList,
      fileSize,
      metadata: $.plist.build(metadata),
      minimumOsVersion: minimumOsVersion.replace("+", ""),
      currency,
    };
  }
};

/**
 * 统一响应格式处理器
 * @param {boolean} success - 是否成功
 * @param {any} data - 响应数据
 * @param {string} error - 错误信息
 * @returns {Object} 统一格式的响应对象
 */
const createResponse = (success, data = null, error = null) => ({
  success,
  data,
  error,
  timestamp: new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
});

/**
 * 参数验证工具函数
 * @param {boolean} condition - 验证条件
 * @param {string} message - 错误信息
 * @throws {Error} 当条件不满足时抛出错误
 */
const validate = (condition, message) => {
  if (!condition) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    //预加载 TaskProcessor
    const isTaskProcessor = $.import(
      ({ fn: TaskProcessor }) => ({
        name: "taskProcessor",
        fn: new TaskProcessor(),
      }),
      "https://raw.githubusercontent.com/xiaobailian67/Surge/refs/heads/main/TaskProcessor.js"
    );

    await $.imports(
      ["* as plist", "https://esm.sh/plist"],
      [
        "express",
        "https://raw.githubusercontent.com/xiaobailian67/Surge/refs/heads/main/SimpleExpressBeta.js",
      ],
      [
        ({ name, fn }) => ({ name: name.slice(1), fn }),
        "https://raw.githubusercontent.com/xiaobailian67/Surge/refs/heads/main/utils.js",
      ]
    );

    $.http.useReq(req => {
      Object.assign(req.headers, {
        "User-Agent":
          "Configurator/2.15 (Macintosh; OS X 11.0.0; 16G29) AppleWebKit/2603.3.8",
        "Content-Type": "application/x-www-form-urlencoded",
      });
      return req;
    });

    $.http.useRes(res => {
      res.headers = Object.fromEntries(
        Object.entries(res.headers).map(([k, v]) => [k.toLowerCase(), v])
      );
      return res;
    });

    const app = new $.express($request);

    // 添加中间件
    app.use($.express.json());
    app.use($.express.logger());

    // 根路径 - API 信息
    app.get("/", (req, res, next) => {
      const data = {
        name: "Apple Store API",
        version: "1.0.0",
        description: "苹果商店应用信息和购买接口",
        endpoints: {
          "POST /auth/login": {
            description: "用户登录",
            body: {
              appleId: "Apple账号 (必需)",
              password: "Apple账号密码 (必需)",
              code: "验证码 (可选，二次验证时需要)",
            },
          },
          "POST /auth/refresh": {
            description: "刷新 token",
            body: "无参数",
          },
          "POST /auth/reset": {
            description: "重置登录状态和GUID缓存",
            body: "无参数",
          },
          "GET /apps/:id": {
            description: "获取应用信息（含下载地址）",
            params: {
              id: "应用ID (必需)",
            },
            query: {
              appVerId: "应用版本ID (可选，不传则返回最新版本)",
            },
          },
          "GET /apps/:id/versions": {
            description: "官方获取应用历史版本，已合并三方数据",
            params: {
              id: "应用ID (必需)",
            },
            query: {
              direction: "查询方向 (可选，默认'next'，可选值：'next'|'prev')",
              count: "返回数量 (可选，默认-1，返回全部，分页范围1-20)",
              appVerId: "起始版本ID (可选，不传则从最新版本开始)",
            },
          },
          "GET /apps/:id/versions/legacy": {
            description: "第三方应用历史版本",
            params: {
              id: "应用ID (必需)",
            },
            query: {
              selset:
                "第三方接口名称 (可选，默认 '并发返回最快的'，可选值：'Timbrd'|'Bilin')",
            },
          },
          "POST /apps/:id/purchase": {
            description: "购买应用",
            params: {
              id: "应用ID (必需)",
            },
            body: "无参数",
          },
          "GET /apps/search/:term": {
            description: "搜索应用",
            params: {
              term: "搜索关键词 (必需)",
            },
            query: {
              limit: "返回结果数量 (可选，默认10，范围1-20)",
              country: "搜索的国家/地区 (可选，默认'CN')",
            },
          },
        },
        responseFormat: {
          success: {
            success: true,
            data: "响应数据",
            message: "成功信息 (可选)",
          },
          error: {
            success: false,
            data: null,
            message: "错误信息",
          },
        },
      };
      res.json(createResponse(true, data));
    });

    // 登录接口
    app.post("/auth/login", async (req, res, next) => {
      const { appleId, password, code } = req.body;
      validate(appleId && password, "缺少必要参数: appleId 和 password");

      const result = await AuthService.login({ appleId, password, code });
      const data = {
        message: "登录成功",
        loginData: result,
      };
      res.json(createResponse(true, data));
    });

    // 刷新Cookie接口
    app.post("/auth/refresh", async (req, res, next) => {
      await AuthService.refreshCookie();
      const data = {
        message: "Cookie 刷新成功",
      };
      res.json(createResponse(true, data));
    });

    // 重置登录状态和缓存接口
    app.post("/auth/reset", async (req, res, next) => {
      const result = AuthService.reset();
      res.json(createResponse(true, result));
    });

    // 获取应用信息接口 - 可用于下载APP
    app.get("/apps/:id", async (req, res, next) => {
      const { id } = req.params;
      const { appVerId } = req.query;

      validate(!isNaN(id), "无效的应用 ID");

      const appInfo = await StoreService.getAppInfo(parseInt(id), appVerId);
      const data = {
        appId: id,
        appInfo: appInfo,
      };
      res.json(createResponse(true, data));
    });

    // 官方获取应用历史版本信息接口
    app.get("/apps/:id/versions", async (req, res, next) => {
      const { id } = req.params;
      const { direction = "next", count = -1, appVerId } = req.query;

      validate(!isNaN(id), "无效的应用 ID");
      validate(!isNaN(count) && count >= -1 && count <= 20, "分页数量只能1-20");

      await isTaskProcessor;
      const versions = await StoreService.getVersions({
        direction,
        count: parseInt(count),
        salableAdamId: parseInt(id),
        startVersionId: appVerId ? parseInt(appVerId) : undefined,
      });

      const data = {
        appId: id,
        ...versions,
        direction,
        count: parseInt(count),
        appVerId,
      };
      res.json(createResponse(true, data));
    });

    // 三方获取应用历史版本信息接口
    app.get("/apps/:id/versions/legacy", async (req, res, next) => {
      const { id } = req.params;
      const { selset } = req.query;

      validate(!isNaN(id), "无效的应用 ID");

      const data = selset
        ? await VersionService.getAppVersionList(id, selset)
        : await VersionService.concurrentGetVersionList(id).catch(
            ({ errors = [], error }) => {
              throw errors.length ? errors.map(e => e.message) : error;
            }
          );

      res.json(createResponse(true, data));
    });

    // 购买APP接口
    app.post("/apps/:id/purchase", async (req, res, next) => {
      const { id } = req.params;

      validate(!isNaN(id), "无效的应用 ID");

      const result = await StoreService.purchaseApp(id);
      const data = {
        appId: id,
        message: "购买请求已提交",
        purchaseResult: result,
      };
      res.json(createResponse(true, data));
    });

    // 搜索APP接口
    app.get("/apps/search/:term", async (req, res, next) => {
      const { term } = req.params;
      const { limit = 10, country } = req.query;

      // // 参数验证
      validate(term, "缺少必要参数: term");
      validate(limit > 0 && limit <= 20, "结果数量限制必须在1-20之间");

      const searchResult = await StoreService.searchApps({
        term,
        country,
        limit: parseInt(limit),
      });

      const data = {
        searchTerm: term,
        explicit: true,
        ...searchResult,
      };
      res.json(createResponse(true, data));
    });

    // 添加错误处理中间件
    app.use((err, req, res, next) => {
      $.log("API Error:", err);

      res
        .status(err.status || 500)
        .json(createResponse(false, null, err.message || "未知错误"));
    });

    const response = await app.run();
    $done({ response });
  } catch (error) {
    console.log(error.toString());
    console.log(error.stack);
    $done();
  }
};

main();
