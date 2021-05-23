/*
转自越南老哥作品 @hiepkimcdtk55

* MIX解锁订阅功能
* 配置好脚本、点击三天试用、恢复购买、取消订阅。
=======Quantumult X=======

[rewrite_local]
^https:\/\/bmall\.camera360\.com\/api\/mix\/recovery$ url script-response-body https://raw.githubusercontent.com/githubdulong/Script/master/mix.js

[MITM]
hostname = bmall.camera360.com

========Surge==========

[Script]
camera360-Mix = requires-body=1,script-path= https://raw.githubusercontent.com/githubdulong/Script/master/mix.js,type=http-response,pattern= ^https:\/\/bmall\.camera360\.com\/api\/mix\/recovery$

[MITM]
hostname = bmall.camera360.com
*/

let body= $response.body;
var obj = JSON.parse(body);
if (body.indexOf("expires") !=-1) {;
  obj["data"]["orderList"][0]["expires_date"] = "2099-10-19 05:14:18 Etc/GMT";
  obj["data"]["orderList"][0]["expires_date_pst"] = "2099-10-18 22:14:18 America/Los_Angeles";
  obj["data"]["orderList"][0]["expires_date_ms"] = "4096019658000";
  }
$done({body: JSON.stringify(obj)});
