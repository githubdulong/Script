//修改来源 https://raw.githubusercontent.com/xream/scripts/main/surge/modules/kill-active-requests/index.sgmodule

const isPanel = () => typeof $input != 'undefined' && $input.purpose === 'panel'
const isRequest = () => typeof $request !== 'undefined'

let arg
if (typeof $argument != 'undefined') {
  arg = Object.fromEntries($argument.split('&').map(item => item.split('=')))
}

if (/^\d+$/.test(arg?.TIMEOUT)) {
  console.log(`超时参数 ${arg?.TIMEOUT} 秒`)
  setTimeout(() => {
    console.log(`超时 ${arg?.TIMEOUT - 1}`)
    $done({
      response: {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `超时 ${arg?.TIMEOUT - 1} 秒` }),
      },
    })
  }, (arg?.TIMEOUT - 1) * 1000)
}

let result = {}
!(async () => {
  if (isPanel()) {
    if ($trigger === 'button') {
      const { requests = [] } = await httpAPI('/v1/requests/active', 'GET') || {}
      let count = 0
      for (const { id } of requests) {
        const res = await httpAPI('/v1/requests/kill', 'POST', { id })
        if (res?.status === 'success') {
          count++
        }
      }
      const message = `🅰 活跃请求${requests.length}个\n🅂 成功打断${count}个`
  $notification.post('', '', message, { 'auto-dismiss': 2 })
      await kill()
    }
    const { requests = [] } = await httpAPI('/v1/requests/active', 'GET') || {}
    result = { title: `活跃请求数: ${requests.length}`, content: '点击一键打断', ...arg }
  } else if (isRequest()) {
    const params = parseQueryString($request.url)
    if (params?.REQ_RULE) {
      const { requests = [] } = await httpAPI('/v1/requests/active', 'GET') || {}
      let count = 0
      for (const { id, rule, url, URL } of requests) {
        const re = new RegExp(params?.REQ_RULE)
        if(re.test(rule)) {
          console.log(`${url || URL}, ${rule} 匹配规则 ${params?.REQ_RULE}`)
          count++
          await httpAPI('/v1/requests/kill', 'POST', { id })
        }
      }
      if (arg?.REQ_NOTIFY == 1) {
        const message = `🅰 活跃请求${requests.length}个\n🅂 成功打断${count}个`
  $notification.post('', '', message, { 'auto-dismiss': 2 })
      }
      result = {
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ count, rule: params?.REQ_RULE }),
        },
      }
    } else {
      const { requests = [] } = await httpAPI('/v1/requests/active', 'GET') || {}
      await kill()
      if(arg?.REQ_NOTIFY == 1) {
        const message = `🅰 活跃请求${requests.length}个\n🅂 成功打断${count}个`
  $notification.post('', '', message, { 'auto-dismiss': 2 })
      }
      result = {
        response: {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
          body: `<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script>
          window.onload = () => {
            const btn = document.getElementById("btn");
            btn.disabled = true;
            btn.innerHTML = "刷新中...";
            setTimeout(function() {
              btn.disabled = false;
              btn.innerHTML = "刷新";
            }, 1000);
          }
      </script></head><body><h1>找到 ${requests.length} 个活跃请求</h1><h2>已尝试打断</h2><button id="btn" onclick="location.reload()">刷新</button></body></html>`,
        },
      }
    }
  } else if(arg?.TYPE == 'CRON' && arg?.CRON_RULE) {
    const { requests = [] } = await httpAPI('/v1/requests/active', 'GET') || {}
    let count = 0
    for await (const { id, rule, url, URL } of requests) {
      const re = new RegExp(arg?.CRON_RULE)
      if(re.test(rule)) {
        console.log(`${url || URL}, ${rule} 匹配规则 ${arg?.CRON_RULE}`)
        count++
        await httpAPI('/v1/requests/kill', 'POST', { id })
      }
    }
    if (arg?.CRON_NOTIFY == 1) {
      $notification.post('定时任务', '打断请求', `${count} 个`)
    }
  } else {
    let wifi = $network.wifi && $network.wifi.bssid
    if (wifi) {
      $persistentStore.write(wifi, 'last_network')
    } else {
      wifi = $persistentStore.read('last_network')
      if (wifi) {
        const { requests = [] } = await httpAPI('/v1/requests/active', 'GET') || {}
        await kill()
        if (arg?.EVENT_NOTIFY == 1) {
          $notification.post('网络变化', '打断请求', `${requests.length} 个`)
        }
      }
      $persistentStore.write('', 'last_network')
    }
  }
})()
  .catch(e => {
    console.log(e)
    const msg = `${e.message || e}`
    if (isPanel()) {
      result = { title: '❌', content: msg, ...arg }
    } else if (isRequest()) {
      result = {
        response: {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: msg }),
        },
      }
    } else {
      $notification.post('网络变化', `❌ 打断请求`, msg)
    }
  })
  .finally(() => $done(result))

async function kill() {
  await httpAPI('/v1/dns/flush', 'POST')
  const beforeMode = (await httpAPI('/v1/outbound', 'GET')).mode
  const newMode = { direct: 'proxy', proxy: 'direct', rule: 'proxy' }
  await httpAPI('/v1/outbound', 'POST', { mode: newMode[beforeMode] })
  await httpAPI('/v1/outbound', 'POST', { mode: newMode[newMode[beforeMode]] })
  await httpAPI('/v1/outbound', 'POST', { mode: beforeMode })
  if ((await httpAPI('/v1/outbound', 'GET')).mode != beforeMode) {
    console.log(`再切一次: ${beforeMode}`)
    await httpAPI('/v1/outbound', 'POST', { mode: beforeMode })
  }
}

function httpAPI(path = '', method = 'POST', body = null) {
  return new Promise(resolve => {
    $httpAPI(method, path, body, result => {
      resolve(result)
    })
  })
}

function parseQueryString(url) {
  const queryString = url.split('?')[1]
  const regex = /([^=&]+)=([^&]*)/g
  const params = {}
  let match
  while ((match = regex.exec(queryString))) {
    params[decodeURIComponent(match[1])] = decodeURIComponent(match[2])
  }
  return params
}