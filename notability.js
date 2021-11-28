/*

QX 1.0.5+ :
[rewrite_local]
^https?:\/\/notability\.com\/subscriptions url script-response-body https://raw.githubusercontent.com/ddgksf2013/Cuttlefish/master/Crack/notability.js

[MITM]
hostname = notability.com

Surge 4.0 :
[Script]
notability = type=http-response,pattern=^https?:\/\/notability\.com\/subscriptions,requires-body=true,max-size=0,script-path=https://raw.githubusercontent.com/ddgksf2013/Cuttlefish/master/Crack/notability.js

[MITM]
hostname = notability.com
*/

 
let obj = JSON.parse($response.body);
obj = {
  "data": {
    "processAppleReceipt": {
      "__typename": "SubscriptionResult",
      "error": 0,
      "subscription": {
        "__typename": "AppStoreSubscription",
        "status": "active",
        "originalPurchaseDate": "2021-11-02T08:04:39.000Z",
        "originalTransactionId": "7",
        "expirationDate": "2099-09-09T09:04:39.000Z",
        "productId": "com.gingerlabs.Notability.premium_subscription",
        "tier": "premium",
        "refundedDate": null,
        "refundedReason": null,
        "user": null
      }
    }
  }
};
$done({body: JSON.stringify(obj)});