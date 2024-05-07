const config = getBoxjs();

const body = {
  mock_type: "generic",
	timeout: config.TIMEOUT ?? 380,
	script_text: `(${main.toString()})('${JSON.stringify(config)}')`,
};

const opts = [
	"POST",
	`/v1/scripting/evaluate`,
	body,
]

monitorDownloadSpeed(opts);

function main(config) {
	// 读取上次更新时间的缓存信息
	const CACHE = JSON.parse($persistentStore.read("last_update_time") || "{}");

	// 设定一些默认基础配置已供调试
	const {
		// 监控的服务器主机地址
		HOST = "iosapps.itunes.apple.com",
		// 设置监测的最小速度要求（单位MB/S）
		MINSPEED = 12,
		// 设置监控时间（单位秒
		TOTALTIME = 15,
		// 设置查询间隔（单位秒）
		INTERVAL = 1,
		// 设置更新时间 (单位自定义: s ms min h)
		INITTIEME = tomilli("30min"),
		// 设置监测的策略组名称
		GROUP = "Download",
		//debug开关
		isDebug = true,
	} = new Proxy(JSON.parse(config),{
		get(...args){
			const value = Reflect.get(...args)
			if (args[1] === "INITTIME") {
				return tomilli(value)
			}
			
			if(args[1] === "GROUP" && !value) {
				throw new Error("未填写策略组")
			}

			return value;
		}
	})
	
	// 创建一个调试器实例，带有debug开关
	const DEBUG = LogLevelPrefixes(isDebug,"debug");

	//初始化DECISIONS和GROUPS变量
	let {
		DECISIONS, //当前策略
		GROUPS, //当前策略组
	} = extractGroupDecisions();

	(async () => {
		CACHE[HOST] ||= {};
		if (CACHE[HOST].switch) return $done();

		CACHE[HOST].switch = 1;
		$persistentStore.write(JSON.stringify(CACHE), "last_update_time");

		init();
		await setIntervalTaskRunner();
	})()
		.catch(handleError)
		.finally(() => $done());

	function setIntervalTaskRunner() {
		const totalTimeMs = TOTALTIME * 1000;
		const intervalMs = INTERVAL * 1000;
		let elapsed = 0;

		return new Promise((_, reject) => {
			const intervalId = setInterval(async () => {
				const { isConnected, speed } = await getSpeed();
				DEBUG.json({
					连通性: isConnected,
					当前策略: DECISIONS,
				});
				DEBUG.func(() => "速度: " + speed_unit(speed));
				try {					SpeedMeasurements().add(speed);
					if (elapsed >= totalTimeMs) {
						throw "速度未达标，切换策略";
					}
					elapsed += intervalMs;

					if (!isConnected) {
						await getNetworkOk();
					}

					if (speed >= MINSPEED * 1048576) {
						throw "速度达标，结束脚本";
					}
				} catch (e) {
					clearInterval(intervalId);
mixSpeed(SpeedMeasurements().averageSpeed);
					reject(e);
				}
			}, intervalMs);
		});
	}

	function init() {
		const isRestarted = () => {
			if (CACHE.isRestarted) {
				  CACHE.isRestarted = false;
				  return true;
			}
		}
		
		  const oldTime = CACHE.lastRouteSwitchTime ?? 0;

		if (isRestarted() || Date.now() - oldTime > INITTIEME) {

						
			DECISIONS = GROUPS[0];
			$surge.setSelectGroupPolicy(GROUP, DECISIONS);
			CACHE[HOST] = {};
			return;
		}

		if (CACHE[HOST]?.max?.max_end) {
			throw "已是最优策略，结束脚本";
		}
	}

	function handleError(err) {
		const msg = err.toString();
		DEBUG(msg);
		DEBUG.json(CACHE);
		if (msg.includes("切换策略")) {
			shouldSwitchStrategy();
		} 
		CACHE[HOST].switch = 0;
		$persistentStore.write(JSON.stringify(CACHE), "last_update_time");
	}

	function shouldSwitchStrategy() {
		if (DECISIONS === GROUPS.at(-1)) {
			CACHE[HOST].max.max_end = true;
			const { max_policy } = CACHE[HOST].max;
			if (max_policy === DECISIONS) return;
			$surge.setSelectGroupPolicy(GROUP, max_policy);
		} else {
			$surge.setSelectGroupPolicy(
				GROUP,
				GROUPS[GROUPS.indexOf(DECISIONS) + 1]
			);
		}

		CACHE.lastRouteSwitchTime = Date.now();

		$notification.post(
			`🎉 策略切换成功 监控时间${TOTALTIME}秒`,
			`当前速度 ➟ ${speed_unit(
				SpeedMeasurements().arr.at(-1)
			)} ➟ ${MINSPEED} MB/S`,
			`${HOST}平均 下载速度低余${MINSPEED} MB/S 已自动切换至${
				extractGroupDecisions().DECISIONS
			}策略`,
			{ "auto-dismiss": 60 }
		);
	}

	async function getNetworkOk() {
		const { requests: data } = await httpAPI("v1/requests/recent");
		const msg = data.find(({ URL }) => URL.startsWith(HOST));

		if (msg?.remark === "Connection refused") {
			throw "节点链接失败,切换策略";
		}

		throw "连接已断开，结束脚本";
	}

	async function getSpeed() {
		const { requests: data } = await httpAPI("v1/requests/active");

		let isConnected = false;

		const speed = data.reduce((acc, obj) => {
			if (obj.URL.startsWith(HOST)) {
				isConnected = true;
				acc += obj.inCurrentSpeed;
			}
			return acc;
		}, 0);

		return { isConnected, speed };
	}

	function extractGroupDecisions() {
		const { groups, decisions } = $surge.selectGroupDetails();
		return {
			DECISIONS: decisions[GROUP],
			GROUPS: groups[GROUP],
		};
	}

	function speed_unit(speed) {
		for (units of ["B/S", "KB/S", "MB/S", "GB/S", "TB/S"]) {
			if (speed < 1000 || !(speed = parseFloat(speed / 1024)))
				return `${(+speed).toFixed(2)} ${units}`;
		}
	}

	function tomilli(String) {
		if (!String) return void 0;
		const obj = {
			ms: 1,
			s: 1000,
			min: 60 * 1000,
			h: 60 * 60 * 1000,
		};
		const [, num, unit] = String.match(/([\d\.]+)(ms|s|min|h)/);
		return num * obj[unit];
	}

	function mixSpeed(speed) {
		const max = CACHE[HOST]?.max || {};
		max.max_speed ??= 0;
		if (speed > max.max_speed)
			CACHE[HOST].max = {
				max_speed: speed,
				max_policy: DECISIONS,
				max_end: false,
			};
	}

	function SpeedMeasurements() {
		SpeedMeasurements.obj ||= {
			arr: [],
			add(num){
				this.arr.push(num)
			},
			get averageSpeed() {
				const filteredArr = this.arr.filter(
					(element) => !isNaN(element)
				);
				return filteredArr.length
					? filteredArr.reduce((acc, val) => acc + val) /
							filteredArr.length
					: 0;
			},
		};

		return SpeedMeasurements.obj;
	}

	function LogLevelPrefixes(isEnabled, prefix) {
  prefix = prefix ? `[${prefix.toUpperCase()}] ` : "";

  const generateLogFunctions = isEnabled
    ? (formatter) => (...args) => console.log(prefix + args.map(formatter).join(" "))
    : () => () => {};

  const loggingFunctions = {
    text: generateLogFunctions((arg) => arg ?? String(arg)),
    json: generateLogFunctions((arg) => JSON.stringify(arg, null, 4)),
    func: generateLogFunctions((fn) => fn()),
  };

  const enhancedLogMethod = (...msg) => loggingFunctions.text(...msg);

  Object.assign(enhancedLogMethod, loggingFunctions);

  return enhancedLogMethod;
}

	function httpAPI(path, method = "GET", body = null) {
		return new Promise((resolve) => {
			$httpAPI(method, path, body, (result) => {
				resolve(result);
			});
		});
	}
}

function monitorDownloadSpeed(opts) {
	// 读取上次更新时间的缓存信息
	let CACHE = JSON.parse($persistentStore.read("last_update_time") || "{}");
	CACHE[config.HOST] ||= {};

	$httpAPI("GET", "/v1/events", null, ({ events }) => {
		const { date: startTime } = events.at(-1);
		const oldTime = CACHE.startTime;

		if (!oldTime) {
			saveUpdateTime(startTime);
		} else if (oldTime !== startTime) {
			CACHE = { isRestarted: true };
			saveUpdateTime(startTime);
		}

		if (!CACHE[config.HOST]?.switch) {
			//利用HTTP API运行
			$httpAPI(...opts);
		}

	  return $done({ matched: true });
	});

	//更新时间并保存
	function saveUpdateTime(startTime) {
		CACHE.startTime = startTime;		$persistentStore.write(JSON.stringify(CACHE), "last_update_time");
	}
}

function getBoxjs() {
	const HOST = this.$request && $request.hostname;
	if (!HOST) return {};
	
	//获取本地存储
	const {default_config,configList} = JSON.parse($persistentStore.read("Xiao_download") || "{}");

const result = filterObjectProperties(
	default_config,
	parseQueryString(configList),
	)

  return {
		...result[0],
	  ...(result[1][HOST] ?? {}),
		...{HOST},
	}
}


function filterObjectProperties(...objs) {
  return objs.map(obj => {
		if (!obj) return {};
    const filteredObj = {};
    Object.keys(obj).forEach(key => {
			const value = obj[key];
      if (value !== "" && value !== null && value !== void 0) {
        filteredObj[key] = value;
      }
    });
    return filteredObj;
  });
}


function parseQueryString(querys) {
  if (!querys) return;
  const newObj = {};

  querys.split("\n").forEach(query => {
    const arrAy = query.split("&");
    const index = arrAy.findIndex(q => q.includes("HOST="));
    if (index === -1) return;
    
    const host = arrAy.splice(index, 1)[0].split("=")[1];

    const result = arrAy.reduce((acc, curr) => {
      const [k, v] = curr.split("=");
      acc[host][k] = v;
      return acc;
    }, {[host]:{}});

    Object.assign(newObj, result);
  });

  return Object.keys(newObj).length
  ? newObj
  : null;
}
