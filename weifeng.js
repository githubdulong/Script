/*

脚本名称：威锋论坛签到+任务

更新时间：2022-11-19
脚本作者：@小白脸

食用方法：通过BoxJs配置威锋论坛账号、密码、个人动态（不支持第三方登录）脚本理论上支持Quantumult X、Surge、Loon和青龙Node.js环境运行。环境变量：feng_username、feng_password

BoxJs订阅：https://raw.githubusercontent.com/githubdulong/Script/master/boxjs.json

************************
[Surge]说明：
************************

[Script]
威锋论坛 = type=cron,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/weifeng.js,cronexp=0 8 * * *,wake-system=1,timeout=15

************************
[Quantumult_X]说明
************************

[task_local]
0 8 * * * https://raw.githubusercontent.com/githubdulong/Script/master/weifeng.js, tag=威锋论坛, img-url=https://raw.githubusercontent.com/anker1209/icon/main/wflt.png, enabled=true

*/

const $ = new Env('威锋论坛');
const notify = $.isNode() ? require('./sendNotify') : '';
const userName = $.getdata('feng_username') || ($.isNode() ? process.env.feng_username : '');
const password = $.getdata('feng_password') || ($.isNode() ? process.env.feng_password : '');
const TXT = $.getdata('feng_txt') || '打卡😂';

//获取请求对象
var person = new Person();

!(async () => {
  let singIn = await signin();
  let Task = await task();
  let inform = await infon();
  let txt = `${singIn}，已连续签到${inform.signInTotalCount}天`;
  let text = `ID:${inform.userBaseInfo.userName}   等级:Lv${inform.userBaseInfo.level}   威币:${inform.weTicket}  ${Task}\n今天是你加入威锋的${inform.joinDays}天`;
  $.msg($.name, txt, text);
  if ($.isNode()) await notify.sendNotify($.name, txt + text + '\n');
})()
  .catch((e) => {
    $.log(`❌ ${$.name}, 出错了: ${e}`)
  })
  .finally(() => {
    $.done();
  })

function http_post(opt) {
  return new Promise(resolve => {
    $.post(opt, (err, resp, data) => {
      if (err || resp.status !== 200) {
        $.log(err)
      } else {
        resolve(data);
      }
    })
  })
}

function http_get(opt) {
  return new Promise(resolve => {
    $.get(opt, (err, resp, data) => {
      if (err || resp.status !== 200) {
        $.log(err)
      } else {
        resolve(data);
      }
    })
  })
}

async function ck() {
  if (!userName && !password) {
    $.msg($.name, '未配置账号密码，结束运行。')
    if ($.isNode()) await notify.sendNotify($.name, '未配置账号密码环境变量，结束运行。');
    $.done();
  }
  let k = person.pp('signins')
  let land = JSON.parse(await http_post(k));
  if (land.status.code === 0) {
    let token = land.data.accessToken;
    // 存储token
    $.setdata(token, 'feng_token');
    return token;
  } else {
    throw land.status.message
  }
}

async function signin() {
  // 获取token，如果没有则去请求，再存储token
  // Token开启全局访问
  Token = $.getdata('feng_token') || await ck();
  let wf = person.pp('signin', Token);
  // 登录操作
  const data = await http_post(wf);
  let sig = JSON.parse(data);
  var code = `${sig.status.code}`.match(/\b(0|1021)\b/);
  if (code) {
    var _sign = sig.status.message;
  } else {
    $.msg(sig.status.message, '正在更新Token，请稍等。');
    // token失效重新设置token为空，然后调用自己本身
    $.setdata('', 'feng_token')
    return signin();
  }
  return _sign.replace(/.+/,
    (x) => {
      return x === 'success' ? '✅ 签到成功' : `⚠️ ${x}`
    }
  )
}

async function infon() {
  let home = person.pp('homePageInfo', Token);
  let inform = JSON.parse(await http_get(home, 'get')).data;
  return inform
}

async function task() {
  let share = person.pp('share', Token);
  let publish = person.pp('publish', Token);
	    publish.body = `{"threadType":"Dynamic","content":"<p>${TXT}<\/p>"}`
  for (var i = 0; i < 6; i++) {
    i === 5 ? await http_post(publish)
      : await http_post(share);
  }

  let Award = person.pp('award', Token);
  for (let i of ['13', '14']) {
    Award.body = `task=share&taskId=${i}`;
    console.log(JSON.parse(await http_post(Award)).status.message);
  }
  return '任务已完成'
}


function Person() {

  this.running = `M0hhBBSkMGg71/hbUpHuOd4i4/1ZzT9LZbOzF+1dkKswn9Ib0qJkcOAnkXDwTcY4QJx6M5+lDT6y6+tQg6wGZoV/+zUcGczM3wEm0y0uB1naLlMjg+qumDkwYtey/XzovWzIs3eIwTcTTnlrMzlpB8oZ+kGBYiu9TOHfmLZUJ9jgW2FZ5c7W5ibg3uq606PxKmyVIqxJWAniJxdqEbf37601Ec031FSLZPN8TEPodEJkpkCbY6/QqD8LfQOtiipAAJi11HaK1yM78Wp+F31bPMK+YlwQS4NzibV0gA+SPp84ET23JxzgEELL/jZiAqeZMixKaHPp3clnAKf2CTYNnhQ1Y3PBcDbD4pZMVtUwRh9cMcWxFhct8T4/D+eO2/7IzJda8bwvy75AaDev3PtU2A==`;
  // 签到
  this.signin = {
    url: 'https://api.wfdata.club/v1/attendance/userSignIn',
    headers: { 'x-request-id': 'UUhIl4ogsHmoE6MZNCc99B1mIRrrNqjukn0zzekcN3un0vaaH7FNHvgXi3qDMO9D' }
  };
  // 登陆
  this.signins = {
    url: 'https://api.wfdata.club/v1/auth/signin',
    headers: { 'x-request-id': ` /9ESQHOIeA8UQktLh6vDlMb+HHLyk+SJby4LdkK/iM0Pe68+gz9IvcQMwyk2MTDS` },
    body: `account=${userName}&password=${password}`
  };
  // 查看个人信息
  this.homePageInfo = {
    url: 'https://api.wfdata.club/v1/user/homePageInfo',
    headers: { 'x-request-id': 'ItdBL/7kPKkupGrKMKmKGedj/8Im0nDDPet4XuY92NjR83Ey/LnrfGe80vLHxfMV' }
  };
  // 任务1
  this.share = {
    url: 'https://api.wfdata.club/v1/thread/share',
    headers: { 'x-request-id': `/R2ZHSmGTziyeazINmiY5VpSJVIoIHvZkBKufI5ujVht1gLM8W/Z3CGaxTVWEkYf` },
    body: 'tid=1'
  };
  // 任务2 （boxjs填写个人心情动态）
  this.publish = {
    url: 'https://api.wfdata.club/v2/thread/publish',
    headers: {
      'X-Request-id':
        'D+6OXXW6hNqyUIwPjEYG6V3esfq6wfreTqLog2u0F1AYkzhRIM29erRFGwNsFA6q'
    }
  };
  // 交任务
  this.award = {
    url: 'https://api.wfdata.club/v1/task/award',
    headers: { 'x-request-id': 'LllYnOgUbzlLSTFSk9uUB2H7pL6/Jk3q7lSHWZKVWJqme6W0syRx7MFWGpkQN35f' }
  }
  this.pp = (x, y) => {
    this[x]['headers']['x-running-env'] = this.running;
    if (y) this[x]['headers']['x-access-token'] = y;
    return this[x];
  }
}


// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),a=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:a}=t,n=i.decode(a,this.encoding);e(null,{status:s,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.isSurge()||this.isQuanX()||this.isLoon()?$done(t):this.isNode()&&process.exit(1)}}(t,e)}