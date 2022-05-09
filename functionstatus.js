/*
by:@moioooo

[Panel]
# > Panel
策略面板 = script-name=功能开关, update-interval=30
[Script]
# > 策略面板
功能开关 = type=generic,timeout=15,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/functionstatus.js

*/
!(async () => {
let traffic = (await httpAPI("/v1/traffic","GET"));
let dateNow = new Date();
let dateTime = Math.floor(traffic.startTime*1000);
let startTime = timeTransform(dateNow,dateTime);
let mitm_status = (await httpAPI("/v1/features/mitm","GET"));
let rewrite_status = (await httpAPI("/v1/features/rewrite","GET"));
let scripting_status = (await httpAPI("/v1/features/scripting","GET"));
let icon_s = mitm_status.enabled&&rewrite_status.enabled&&scripting_status.enabled;
// 刷新DNS
if ($trigger == "button") await httpAPI("/v1/dns/flush");
// 重载配置+刷新DNS
//if ($trigger == "button") {
//await httpAPI("/v1/profiles/reload");
//$notification.post("配置重载","配置重载成功","")
//};
$done({
    title:"𝗦𝗨𝗥𝗚𝗘  已运行"+startTime, //标题
    content:"MitM "+icon_status(mitm_status.enabled)+"  Rewrite "+icon_status(rewrite_status.enabled)+"  Scripting "+icon_status(scripting_status.enabled),
    icon: icon_s?"power.circle":"exclamationmark.circle", //图标
   "icon-color":icon_s?"#FF2121":"#FF7500" //颜色
});
})();
function icon_status(status){
  if (status){
    return "\u2611"; //小图标“勾”
  } else {
      return "\u2612" //小图标“叉”
    }
}
function timeTransform(dateNow,dateTime) {
let dateDiff = dateNow - dateTime;
let days = Math.floor(dateDiff / (24 * 3600 * 1000));//计算出相差天数
let leave1=dateDiff%(24*3600*1000)    //计算天数后剩余的毫秒数
let hours=Math.floor(leave1/(3600*1000))//计算出小时数
//计算相差分钟数
let leave2=leave1%(3600*1000)    //计算小时数后剩余的毫秒数
let minutes=Math.floor(leave2/(60*1000))//计算相差分钟数
//计算相差秒数
let leave3=leave2%(60*1000)      //计算分钟数后剩余的毫秒数
let seconds=Math.round(leave3/1000)

if(days==0){
  if(hours==0){
    if(minutes==0)return(`${seconds}秒`);
      return(`${minutes}分${seconds}秒`)
    }
    return(`${hours}时${minutes}分${seconds}秒`)
  }else {
        return(`${days}天${hours}时${minutes}分`)
	}
}
function httpAPI(path = "", method = "POST", body = null) {
  return new Promise((resolve) => {
    $httpAPI(method, path, body, (result) => {
      resolve(result);
    });
  });
}