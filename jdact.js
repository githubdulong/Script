// #大赢家提现 提前点亮
// ^https:\/\/api\.m\.jd\.com\/api\?functionId=makemoneyshop_exchangequery url response-body "exchangeStatus":\d, response-body "exchangeStatus":1,
// #城城分现金提现 提前点亮
// ^https:\/\/api\.m\.jd\.com\/client\.action$ url response-body "wechatStatus":"\d", response-body "wechatStatus":"3",
let body= $response.body;
if (body.indexOf("exchangeStatus") != -1) {
    body = body.replace(/"exchangeStatus":\d/g, `"exchangeStatus":1`)
} else if (body.indexOf("wechatStatus") != -1) {
    body = body.replace(/"wechatStatus":"\d"/g, `"wechatStatus":"3"`)
}
$done({body: body});

