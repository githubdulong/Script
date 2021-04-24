/*
Surge配置参考注释，转载来自@mieqq
----------------------------------------
先将带有流量信息的订阅链接encode，用encode后的链接替换"url="后面的xxx，"reset_day="后面的数字替换成流量每月重置的日期，如1号就写1，8号就写8。
如需显示多个机场的信息，可以参照上述方法创建多个策略组以显示不同机场的信息，将Name替换成机场名字即可，脚本只需要一个。
示例↓↓↓
----------------------------------------
[Proxy Group]
机场1 = select, policy-path=http://sub.info?url=xxx&reset_day=1

机场2 = select, policy-path=http://sub.info?url=xxx&reset_day=8

[Script]
机场信息 = type=http-request,pattern=http://sub\.info,script-path= http://sub\.info,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/sub_info.js
----------------------------------------
*/

(async () => {
  let params = getUrlParams($request.url);
  let reset_day = parseInt(params["due_day"] ||params["reset_day"]);
  
  let info = await getUserInfo(params.url);
  let usage = getDataUsage(info);
  let used = bytesToSize(usage.download + usage.upload);
  let total = bytesToSize(usage.total);
  let expire = usage.expire || params.expire;
  let http = "http, localhost, 6152";
  let body = `${used} | ${total}=${http}`;
  if (reset_day) {
    let days = getRmainingDays(reset_day);
    body += `\n流量重置: ${days}天=${http}`;
  }
  if (expire) {
    expire = formatTimestamp(expire*1000);
    body += `\n机场到期: ${expire}=${http}`;
  }
  
    $done({response: {body}});
})();

function getUrlParams(url) {
  return Object.fromEntries(
    url.slice(url.indexOf('?') + 1).split('&')
   .map(item => item.split("="))
   .map(([k, v]) => [k, decodeURIComponent(v)])
  );   
}

function getUserInfo(url) {
  let headers = {"User-Agent" :"Quantumult X"}
  let request = {headers, url}
  return new Promise(resolve => $httpClient.head(request, (err, resp) => 
resolve(resp.headers["subscription-userinfo"] || resp.headers["Subscription-userinfo"] || resp.headers["Subscription-Userinfo"])));
}

function getDataUsage(info) {
  return Object.fromEntries(
    info.match(/\w+=\d+/g).map(item => item.split("="))
    .map(([k, v]) => [k,parseInt(v)])
  );
}

function getRmainingDays(reset_day) {
  let now = new Date();
  let today = now.getDate();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  let daysInMonth = new Date(year, month, 0).getDate();
  if (reset_day > today) daysInMonth = 0;
  
  return daysInMonth - today + reset_day;
}

function bytesToSize(bytes) {
    bytes = parseInt(bytes);
    if (bytes === 0) return '0B';
    let k = 1024;
    sizes = ['B','KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
}

function formatTimestamp( timestamp ) {
    let dateObj = new Date( timestamp );
    let year = dateObj.getFullYear();
    let month = dateObj.getMonth() + 1;
    month = month < 10 ? '0' + month : month
    let day = dateObj.getDate();
    day = day < 10 ? '0' + day : day
    return year +"年"+ month +"月" + day + "日";
}
