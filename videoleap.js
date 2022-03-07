/*
圈x：
[rewrite_local]
https?:\/\/api\.lightricks\.com\/subscription\?bundle=com\.lightricks\.Enlight-Video url script-echo-response videoleap.js

Surge：
[Script]
videoleap = type=http-response,pattern=https?:\/\/api\.lightricks\.com\/subscription\?bundle=com\.lightricks\.Enlight-Video,script-path=videoleap.js

[mitm] 

hostname=api.lightricks.com

*/





var obj = JSON.parse($response.body);
{
obj.latestProductId = ”com.lightricks.EnlightVideo_V2.PA.1Y.SA_1Y.SA_TRIAL.1W“,
obj.latestPurchaseDateMs = 1646371461000,
obj.originalPurchaseDateMs = 1646371462000,
obj.nextProductId = ”com.lightricks.EnlightVideo_V2.PA.1Y.SA_1Y.SA_TRIAL.1W“,
obj.isAutoRenewEnabled = true,
obj.expirationIntent = null,
obj.isExpired = false,
obj.latestExpirationDateMs = 3946976261000,
obj.fullRefundDateMs = null,
$done({body: JSON.stringify(obj)});