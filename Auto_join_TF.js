let ID = $persistentStore.read('APP_ID')
let Key = $persistentStore.read('key')
let testurl = "https://testflight.apple.com/v3/accounts/" + Key + "/ru/"
let header = {
    "X-Session-Id": `${$persistentStore.read('session_id')}`,
    "X-Session-Digest": `${$persistentStore.read('session_digest')}`,
    "X-Request-Id": `${$persistentStore.read('request_id')}`
}
$httpClient.get({url: testurl + ID,headers: header}, function(error, resp, data) {
    if (error === null) {
        let jsonData = JSON.parse(data)
        if (jsonData.data.status == "FULL") {
            $done(console.log(jsonData.data.message))
        } else {
            $httpClient.post({url: testurl + ID + "/accept",headers: header}, function(error, resp, body) {
                let jsonBody = JSON.parse(body)
                $notification.post(jsonBody.data.name, "TestFlight加入成功", "")
                console.log(jsonBody.data.name + " TestFlight加入成功")
                $done($httpAPI('POST', '/v1/modules', {'❏ 自动测试': 'false'}))
            });
        }
    } else {
        if (error =="The request timed out.") {
            $done()
        } else {
            $notification.post('自动加入TF', error,'')
            console.log(error)
            $done()
        }
    }
});