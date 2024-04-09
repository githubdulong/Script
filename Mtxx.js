/*

by：https://iosgs.xyz/gzFile/quanX/mtxx.conf

【Quantumult_X】

[rewrite_local]
^https?://(api|h5).xiuxiu.meitu.com/(?!(v1/feed/)) url script-response-body https://raw.githubusercontent.com/githubdulong/Script/master/Mtxx.js

[MITM]
hostname: api.xiuxiu.meitu.com, h5.xiuxiu.meitu.com

************************************************

【Surge】
[Script]
美图秀秀 = type=http-response,requires-body=1,max-size=0,pattern=^https?://(api|h5).xiuxiu.meitu.com/(?!(v1/feed/)),script-path=https://raw.githubusercontent.com/githubdulong/Script/master/Mtxx.js

[MITM]
hostname: api.xiuxiu.meitu.com, h5.xiuxiu.meitu.com

*/

var obj = JSON.parse($response.body);

if (obj && obj.data) {
    obj.data.vip_type = 1;
    obj.data.expire_days = -9999999999;
    obj.data.is_expire = 0;
    obj.data.in_valid_time = 5576488923;
    obj.data.is_valid_user = 1;
    obj.data.valid_time = 5576488923;
    obj.data.home_prompt = "粉钻会员 2100年1月1日到期";
    obj.data.home_btn_prompt = "已解锁";
} else {
    console.log("obj or obj.data is undefined");
}

$done({ body: JSON.stringify(obj) });