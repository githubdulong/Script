/*

更新时间：2024.03.10
更新内容：优化脚本，修复Bug

Surge配置
https://raw.githubusercontent.com/githubdulong/Script/master/Surge/autotf.sgmodule
Boxjs订阅
https://raw.githubusercontent.com/githubdulong/Script/master/boxjs.json

 */

if (typeof $request !== 'undefined' && $request) {
    let url = $request.url;
    let key = url.replace(/(.*accounts\/)(.*)(\/apps)/, '$2');
		let headers = Object.fromEntries(Object.entries($request.headers).map(([key, value]) => [key.toLowerCase(), value]));
    let session_id = headers['x-session-id'];
    let session_digest = headers['x-session-digest'];
    let request_id = headers['x-request-id'];

    console.log(`信息获取：Key: ${key}, Session ID: ${session_id}, Session Digest: ${session_digest}, Request ID: ${request_id}`);

    $persistentStore.write(key, 'key');
    $persistentStore.write(session_id, 'session_id');
    $persistentStore.write(session_digest, 'session_digest');
    $persistentStore.write(request_id, 'request_id');

    if ($persistentStore.read('request_id') !== null) {
        $notification.post('信息获取成功', '请编辑参数把信息获取改为#以注释该脚本', '');
    } else {
        $notification.post('信息获取失败', '请检查网络或配置', '');
    }
    $done({});
} else {
    !(async () => {
        let ids = $persistentStore.read('APP_ID');
        if (!ids) {
            notifyAndDisable();
        } else {
            ids = ids.split(',');
            for (let i = 0; i < ids.length; i++) {
                await autoPost(ids[i], ids);
                ids = $persistentStore.read('APP_ID') ? $persistentStore.read('APP_ID').split(',') : [];
            }
            if (ids.length === 0) {
                notifyAndDisable();
            } else {
                console.log('还有未处理的APP_ID，脚本继续执行。');
                $done();
            }
        }
    })();
}

async function autoPost(ID, ids) {
    let Key = $persistentStore.read('key');
    let testurl = `https://testflight.apple.com/v3/accounts/${Key}/ru/`;
    let header = {
        'X-Session-Id': $persistentStore.read('session_id'),
        'X-Session-Digest': $persistentStore.read('session_digest'),
        'X-Request-Id': $persistentStore.read('request_id')
    };

    for (let retries = 3; retries > 0; retries--) {
        try {
            let response = await httpRequestWithTimeout(testurl + ID, header);
            if (response && response.data && response.data.status !== 'FULL') {
                console.log(`${ID}: 加入成功`);
                updateIDList(ID);
                $notification.post(`${ID}加入成功 🎉`, ids.length > 1 ? '还有未处理的APP_ID，脚本继续执行。' : '', '');
                break;
            } else {
                console.log(`${ID}: TestFlight应用已满`);
                break;
            }
        } catch (error) {
            console.log(`${ID}: 尝试失败，剩余重试次数: ${retries - 1}，错误: ${error}`);
            if (retries <= 1) {
                console.log(`${ID}: 重试结束，未能成功。`);
            }
        }
    }
}

async function httpRequestWithTimeout(url, headers) {
    const timeout = 5000; // 设置5秒超时
    return new Promise((resolve, reject) => {
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            reject('请求超时');
        }, timeout);

        $httpClient.get({url, headers}, (error, response, data) => {
            clearTimeout(timer);
            if (!timedOut) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(data));
                }
            }
        });
    });
}

function updateIDList(ID) {
    let currentIds = $persistentStore.read('APP_ID').split(',');
    let updatedIds = currentIds.filter(item => item !== ID);
    $persistentStore.write(updatedIds.join(','), 'APP_ID');
}

function notifyAndDisable() {
    $notification.post('所有TF已加入完毕 🎉', '模块已自动关闭', '');
    $done($httpAPI('POST', '/v1/modules', {'公测监控': false}));
}