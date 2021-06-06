let obj = JSON.parse($response.body)

obj.subscriber.subscriptions = {
  "com.circles.fin.premium.yearly": {
    "billing_issues_detected_at": null,
    "expires_date": "2030-02-18T07:52:54Z",
    "is_sandbox": false,
    "original_purchase_date": "2020-02-11T07:52:55Z",
    "period_type": "normal",
    "purchase_date": "2020-02-11T07:52:54Z",
    "store": "app_store",
    "unsubscribe_detected_at": null
  }
};
obj.subscriber.entitlements = {
  "membership": {
    "expires_date": "2030-02-18T07:52:54Z",
    "product_identifier": "com.circles.fin.premium.yearly",
    "purchase_date": "2020-02-11T07:52:54Z"
  }
};

$done({
  body: JSON.stringify(obj)
})
