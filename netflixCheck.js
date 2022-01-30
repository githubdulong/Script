//let params = getParams($argument)
const BASE_URL = 'https://www.netflix.com/title/'

const FILM_ID = 81215567
const AREA_TEST_FILM_ID = 80018499

;(async () => {
  let result = {
    title: "𝗡𝗘𝗧𝗙𝗟𝗜𝗫",
    icon: "bolt.slash.circle",
	  'icon-color':"#801DAE",
    content: '测试失败 请检查网络设置',
  }
  await test(FILM_ID)
    .then((code) => {
      if (code === 'Not Found') {
        return test(AREA_TEST_FILM_ID)
      }
      result['Title'] ="𝗡𝗘𝗧𝗙𝗟𝗜𝗫"
      result['icon'] = "play.circle"
	    result['icon-color'] = '#00BC12'
      //result['icon'] = params.icon1
	    //result['icon-color'] = params.color1
      result['content'] = '已解锁奈飞' + ' ➟ 区域 ' + code.toUpperCase()
      return Promise.reject('BreakSignal')
    })
    .then((code) => {
      if (code === 'Not Found') {
        return Promise.reject('Not Available')
      }
      result['Title'] ="𝗡𝗘𝗧𝗙𝗟𝗜𝗫"
      result['icon'] = "pause.circle"
	    result['icon-color'] = "#FFB61E"
      //result['icon'] = params.icon2
	    //result['icon-color'] = params.color2
      result['content'] = '仅支持自制剧' + ' ➟ 区域 ' + code.toUpperCase()
      return Promise.reject('BreakSignal')
    })
    .catch((error) => {
      if (error === 'Not Available') {
        result['Title'] ="𝗡𝗘𝗧𝗙𝗟𝗜𝗫"
        result['icon'] = "stop.circle"
	      result['icon-color'] = "#FF2121"
        //result['icon'] = params.icon3
	      //result['icon-color'] = params.color3
        result['content'] = '该节点未解锁奈飞'
        return
      }
    })
    .finally(() => {
      $done(result)
    })
})()

function test(filmId) {
  return new Promise((resolve, reject) => {
    let option = {
      url: BASE_URL + filmId,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
      },
    }
    $httpClient.get(option, function (error, response, data) {
      if (error != null) {
        reject('Error')
        return
      }

      if (response.status === 403) {
        reject('Not Available')
        return
      }

      if (response.status === 404) {
        resolve('Not Found')
        return
      }

      if (response.status === 200) {
        let url = response.headers['x-originating-url']
        let region = url.split('/')[3]
        region = region.split('-')[0]
        if (region == 'title') {
          region = 'us'
        }
        resolve(region)
        return
      }

      reject('Error')
    })
  })
}

function getParams(param) {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}
