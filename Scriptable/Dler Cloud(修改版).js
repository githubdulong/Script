/*
 * Author: evilbutcher Neurogram
 * Github: https://github.com/evilbutcher
 * 本脚本使用了@Gideon_Senku的Env.scriptable，感谢！
 * 感谢@MuTu88帮忙测试！
 * 自动更新打开后会运行覆盖脚本内已有修改，多种解决方案：
 * 一、配置Config文件，请参考https://github.com/evilbutcher/Scriptables/blob/master/Config.js，下载后导入Scriptable，脚本运行会❗️优先❗️调取Config文件中信息，此方法只能显示❗️一个❗️机场。
 * 二、【推荐】Scriptable的iCloud文件夹内，配置checkin.json文件(注意文件名)，具体格式参考https://github.com/evilbutcher/Scriptables/blob/master/checkin_example.json，可以通过创建桌面小组件时填入不同参数如“c1”、“c2”等实现读取多个机场信息。
 * 三、脚本内配置，在下方注释写有填写签到标题的引号内，填写对应的签到信息，注意，此方法一旦更新脚本，所做的更改就会被远程文件覆盖。
 * 脚本运行后，会在iCloud/Scriptable文件夹内写入一个recordcheckintime.txt，用于记录签到时间，脚本逻辑每天签到一次。
 */
const goupdate = false; //默认关闭，需要时打开，更新后会覆盖脚本已有的签到信息，建议使用Config或Scriptable的iCloud文件夹存入checkin.json文件的方式
const $ = importModule("Env");
$.autoLogout = false; //退出登录后再签到
try {
  const para = args.widgetParameter || "c1";
  const fileName = "checkin.json";
  const res = JSON.parse($.read(fileName));
  var checkintitle = res[para].title || ""; //填写签到标题
  var checkinloginurl = res[para].url || ""; //填写签到登陆链接
  var checkinemail = res[para].email || ""; //填写签到邮箱
  var checkinpwd = res[para].password || ""; //填写签到密码
} catch (e) {
  log("获取JSON文件失败");
}
const size = 12; //字体大小
const isDark = Device.isUsingDarkAppearance();
const bgColor = new LinearGradient();
bgColor.colors = isDark
  ? [new Color("#1c1c1c"), new Color("#29323c")]
  : [new Color("#030079"), new Color("#000000")];
bgColor.locations = [0.0, 1.0];
function addTextToListWidget(text, listWidget) {
  let item = listWidget.addText(text);
  item.textColor = isDark ? Color.white() : Color.white();
  item.textSize = size;
}
function addTitleTextToListWidget(text, listWidget) {
  let item = listWidget.addText(text);
  item.textColor = isDark ? Color.white() : Color.white();
  item.applyHeadlineTextStyling();
}

const scripts = [
  {
    moduleName: "Checkin",
    url:
      "https://raw.githubusercontent.com/evilbutcher/Scriptables/master/Dler%20Cloud.js",
  },
];

!(async () => {
  init();
  getinfo();
  await launch();
  log($.checkintitle);
  log($.checkinMsg);
  log($.todayUsed);
  log($.usedData);
  log($.restData);
  let widget = createWidget(
    $.checkintitle,
    $.checkinMsg,
    $.todayUsed,
    $.usedData,
    $.restData
  );
  Script.setWidget(widget);
  Script.complete();
})()
  .catch((err) => {
    $.msg("Checkin运行出现错误❌\n" + err);
  })
  .finally(update());

function getinfo() {
  try {
    const con = importModule("Config");
    $.checkintitle = con.checkintitle();
    $.checkinloginurl = con.checkinloginurl();
    $.checkinemail = con.checkinemail();
    $.checkinpwd = con.checkinpwd();
    if (
      $.checkintitle == "" ||
      $.checkinloginurl == "" ||
      $.checkinemail == "" ||
      $.checkinpwd == ""
    ) {
      log("配置文件内签到信息不完整");
      throw new Error(err)
    }
    log("将使用配置文件内签到信息");
  } catch (err) {
    $.checkintitle = checkintitle;
    $.checkinloginurl = checkinloginurl;
    $.checkinemail = checkinemail;
    $.checkinpwd = checkinpwd;
    log("将使用脚本内签到信息");
    if (
      $.checkintitle == "" ||
      $.checkinloginurl == "" ||
      $.checkinemail == "" ||
      $.checkinpwd == ""
    ) {
      $.msg("请检查填入的签到信息是否完整");
    }
  }
}

function init() {
  $.nowtime = new Date().getTime();
  log($.nowtime);
  if ($.isFileExists("recordcheckintime.txt") == true) {
    var recordtime = $.read("recordcheckintime.txt");
    log(recordtime);
    if ($.nowtime - recordtime > 864) {
      $.cancheckin = true;
      $.write("recordcheckintime.txt", JSON.stringify($.nowtime));
    } else {
      $.cancheckin = false;
    }
  } else {
    $.write("recordcheckintime.txt", JSON.stringify($.nowtime));
    log("初始时间已写入");
    $.cancheckin = true;
  }
}

async function launch() {
  let title = $.checkintitle;
  let url = $.checkinloginurl;
  let email = $.checkinemail;
  let password = $.checkinpwd;
  if ($.autoLogout == true) {
    let logoutPath =
      url.indexOf("auth/login") != -1 ? "user/logout" : "user/logout.php";
    var logouturl = {
      url: url.replace(/(auth|user)\/login(.php)*/g, "") + logoutPath,
    };
    log(logouturl);
    await $.getStr(logouturl);
    await login(url, email, password, title);
    if ($.loginok == true) {
      if ($.cancheckin == true) {
        await checkin(url, email, password, title);
        if ($.checkinok == true) {
          await dataResults(url, $.checkindatamsg, title);
        }
      } else {
        await dataResults(url, "签到完成🎉", title);
      }
    }
  } else {
    if ($.cancheckin == true) {
      await checkin(url, email, password, title);
      if ($.checkinok == true) {
        await dataResults(url, $.checkindatamsg, title);
      } else {
        await login(url, email, password, title);
        if ($.loginok == true) {
          await checkin(url, email, password, title);
          await dataResults(url, "签到完成🎉", title);
        }
      }
    } else {
      await dataResults(url, "签到完成🎉", title);
      if ($.getdata == false) {
        await login(url, email, password, title);
        if ($.loginok == true) {
          await dataResults(url, "签到完成🎉", title);
        }
      }
    }
  }
}

async function login(url, email, password, title) {
  let loginPath =
    url.indexOf("auth/login") != -1 ? "auth/login" : "user/_login.php";
  let table = {
    url:
      url.replace(/(auth|user)\/login(.php)*/g, "") +
      loginPath +
      `?email=${email}&passwd=${password}&rumber-me=week`,
  };
  log(table);
  await $.post(table, async (response, data) => {
    if (
      JSON.parse(data).msg.match(
        /邮箱不存在|邮箱或者密码错误|Mail or password is incorrect/
      )
    ) {
      $.msg(title + "邮箱或者密码错误");
      $.loginok = false;
      log("登陆失败");
    } else {
      $.loginok = true;
      log("登陆成功");
    }
  });
}

async function checkin(url, email, password, title) {
  let checkinPath =
    url.indexOf("auth/login") != -1 ? "user/checkin" : "user/_checkin.php";
  var checkinreqest = {
    url: url.replace(/(auth|user)\/login(.php)*/g, "") + checkinPath,
  };
  log(checkinreqest);
  await $.post(checkinreqest, async (response, data) => {
    if (data.match(/\"msg\"\:/)) {
      $.checkinok = true;
      $.checkindatamsg = JSON.parse(data).msg;
      log("签到成功");
    } else {
      $.checkinok = false;
      log("签到失败");
    }
  });
}

async function dataResults(url, checkinMsg, title) {
  let userPath = url.indexOf("auth/login") != -1 ? "user" : "user/index.php";
  var datarequest = {
    url: url.replace(/(auth|user)\/login(.php)*/g, "") + userPath,
  };
  log(datarequest);
  await $.getStr(datarequest, async (response, data) => {
    if (data.match(/login|请填写邮箱|登陆/)) {
      $.getdata = false;
    } else {
      let resultData = "";
      let result = [];
      if (data.match(/theme\/malio/)) {
        let flowInfo = data.match(/trafficDountChat\s*\(([^\)]+)/);
        if (flowInfo) {
          let flowData = flowInfo[1].match(/\d[^\']+/g);
          let usedData = flowData[0];
          let todatUsed = flowData[1];
          let restData = flowData[2];
          $.todayUsed = `今日已用：${flowData[1]}`;
          $.usedData = `本月已用：${flowData[0]}`;
          $.restData = `套餐余量：${flowData[2]}`;
          result.push(
            `今日：${todatUsed}\n已用：${usedData}\n剩余：${restData}`
          );
        }
        let userInfo = data.match(/ChatraIntegration\s*=\s*({[^}]+)/);
        if (userInfo) {
          let user_name = userInfo[1].match(/name.+'(.+)'/)[1];
          let user_class = userInfo[1].match(/Class.+'(.+)'/)[1];
          let class_expire = userInfo[1].match(/Class_Expire.+'(.+)'/)[1];
          let money = userInfo[1].match(/Money.+'(.+)'/)[1];
          result.push(
            `用户名：${user_name}\n用户等级：lv${user_class}\n余额：${money}\n到期时间：${class_expire}`
          );
        }
        if (result.length != 0) {
          resultData = result.join("\n\n");
        }
      } else {
        let todayUsed = data.match(/expire\"\,\s\".*?\"/);
        if (todayUsed) {
          var day = JSON.stringify(todayUsed).slice(14, -4);
          var time = day.replace(/-/g, "/");
          var expire = new Date(time).getTime();
          var left = ((expire - $.nowtime) / 86400000).toFixed(0);
          result.push(`剩余天数：${left}天`);
          $.todayUsed = `剩余天数：${left}天`;
        } else {
          $.todayUsed = `剩余天数获取失败`;
          result.push(`剩余天数获取失败`);
        }
        let usedData = data.match(
          /(Used Transfer|>过去已用|>已用|>总已用|\"已用)[^B]+/
        );
        if (usedData) {
          usedData = flowFormat(usedData[0]);
          result.push(`已用：${usedData}`);
          $.usedData = `本月已用：${usedData}`;
        } else {
          $.usedData = `本月已用获取失败`;
          result.push(`本月已用获取失败`);
        }
        let restData = data.match(
          /(Remaining Transfer|>剩余流量|>流量剩余|>可用|\"剩余)[^B]+/
        );
        if (restData) {
          restData = flowFormat(restData[0]);
          result.push(`余量：${restData}`);
          $.restData = `套餐余量：${restData}`;
        } else {
          $.restData = `套餐余量获取失败`;
          result.push(`套餐余量获取失败`);
        }
        resultData = result.join("\n");
      }
      $.checkinMsg = checkinMsg;
      log(title + "\n" + checkinMsg + "\n" + resultData);
    }
  });
}

function flowFormat(data) {
  data = data.replace(/\d+(\.\d+)*%/, "");
  let flow = data.match(/\d+(\.\d+)*\w*/);
  return flow[0] + "B";
}

function createWidget(checkintitle, checkinMsg, todayUsed, usedData, restData) {
  const w = new ListWidget();
  w.backgroundGradient = bgColor;
  w.addSpacer();
  w.spacing = 5

  const emoji = w.addText(`💋`);
  emoji.textSize = 30;

  addTitleTextToListWidget(checkintitle, w);
  addTextToListWidget(checkinMsg, w);
  addTextToListWidget(todayUsed, w);
  addTextToListWidget(usedData, w);
  addTextToListWidget(restData, w);
  
  w.addSpacer();
  w.spacing = 5
  w.presentSmall();
  return w;
}

//更新代码
function update() {
  if (goupdate == true) {
    log("🔔更新脚本开始!");
    scripts.forEach(async (script) => {
      await $.getFile(script);
    });
    log("🔔更新脚本结束!");
  }
}
