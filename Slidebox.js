var obj = {
  "data": {
    "env": {
      "projectId": "slidebox-ios-prod",
      "region": "us-central1",
      "function": "api_v1",
      "realm": "prod"
    },
    "appStoreRecord": {
      "purchases": [
        {
          "productId": "co.slidebox.iap.apple.fullversion"
        }
      ],
      "subscriptions": [
      ],
      "validatedTimestampMs": "1616836532860",
      "bundleId": "co.slidebox.Slidebox"
    }
  }
};
$done({body: JSON.stringify(obj)});