!(async () => {
if ($persistentStore.read('APP_ID') == null && $persistentStore.read('APP_ID2') == null) {
    $notification.post('模块已关闭','原因：APP_ID未手动配置/已经完成所有TF加入','配置完成请重新打开脚本模块')
    $done($httpAPI('POST', '/v1/modules', {'❏ 自动测试': 'false'}))
} else if ($persistentStore.read('APP_ID') == null) {
    if (await autoPost($persistentStore.read('APP_ID2')) == undefined) {
      $done()
    } else {
      $persistentStore.write(null, 'APP_ID2')
      $done($httpAPI('POST', '/v1/modules', {'❏ 自动测试': 'false'}))
    }
} else if ($persistentStore.read('APP_ID2') == null) {
    if (await autoPost($persistentStore.read('APP_ID')) == undefined) {
      $done()
    } else {
      $persistentStore.write(null, 'APP_ID')
      $done($httpAPI('POST', '/v1/modules', {'❏ 自动测试': 'false'}))
    }
} else {
    if (await autoPost($persistentStore.read('APP_ID')) == undefined) {
      $done()
    } else {
      $persistentStore.write(null, 'APP_ID')
    }
    if (await autoPost($persistentStore.read('APP_ID2')) == undefined) {
      $done()
    } else {
      $persistentStore.write(null, 'APP_ID2')
    }
}
})();

function autoPost(APP_ID) {
  let ID = APP_ID
  let Key = $persistentStore.read('key')
  let testurl = "https://testflight.apple.com/v3/accounts/" + Key + "/ru/"
  let header = {
    "X-Session-Id": `${$persistentStore.read('session_id')}`,
    "X-Session-Digest": `${$persistentStore.read('session_digest')}`,
    "X-Request-Id": `${$persistentStore.read('request_id')}`
  }
  return new Promise(function(resolve) {
    $httpClient.get({url: testurl + ID,headers: header}, function(error, resp, data) {
      if (error === null) {
        let jsonData = JSON.parse(data)
        if (jsonData.data.status == "FULL") {
          console.log(ID + ' ' + jsonData.data.message)
          resolve();
        } else {
          $httpClient.post({url: testurl + ID + "/accept",headers: header}, function(error, resp, body) {
            let jsonBody = JSON.parse(body)
            $notification.post(jsonBody.data.name, "TestFlight加入成功", "")
            console.log(ID + ' ' + jsonBody.data.name + " TestFlight加入成功")
            resolve('SUCCESS');
          });
        }
      } else {
        if (error =="The request timed out.") {
          resolve();
        } else {
          $notification.post('自动加入TF', error,'')
          console.log(ID + ' ' + error)
          resolve();
        }
      }
    })
  })
}