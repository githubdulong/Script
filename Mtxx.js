/*
QX
[rewrite_local]
^https?://(api|h5).xiuxiu.meitu.com/(v1/user/show.json|v1/vip/vip_show.json|v1/vip/prompt/query.json|v1/h5/vip/sub_detail.json|v1/h5/user/self_show.json|v1/h5/vip/user_detail.json|v1/vip/prompt/query.json|v1/vip/prompt/query.json) url script-response-body https://raw.githubusercontent.com/githubdulong/Script/master/Mtxx.js
[MITM]
hostname: api.xiuxiu.meitu.com, h5.xiuxiu.meitu.com
Surge
[Script]
美图秀秀 = requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/Mtxx.js,type=http-response,pattern=^https?://(api|h5).xiuxiu.meitu.com/(v1/user/show.json|v1/vip/vip_show.json|v1/vip/prompt/query.json|v1/h5/vip/sub_detail.json|v1/h5/user/self_show.json|v1/h5/vip/user_detail.json|v1/vip/prompt/query.json|v1/vip/prompt/query.json)
[MITM]
hostname: api.xiuxiu.meitu.com, h5.xiuxiu.meitu.com

原脚本：https://iosgs.xyz/gzFile/quanX/mtxx.conf
*/

var obj = JSON.parse($response.body);

obj.data.vip_type=1;
obj.data.expire_days=-9999999999;
obj.data.screen_name="MuTu";
obj.data.is_expire=0;
obj.data.in_valid_time=5576488923;
obj.data.is_valid_user=1;
obj.data.valid_time=5576488923;
obj.data.home_prompt="尊贵的粉钻会员";
obj.data.home_btn_prompt="已订阅";

$done({ body: JSON.stringify(obj) });