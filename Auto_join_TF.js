/*

更新时间：2024.03.12 17:03
更新内容：优化脚本，修复Bug，增加自动获取APP_ID逻辑

Surge配置
https://raw.githubusercontent.com/githubdulong/Script/master/Surge/autotf.sgmodule
Boxjs订阅
https://raw.githubusercontent.com/githubdulong/Script/master/boxjs.json

 */

if (typeof $request !== 'undefined' && $request) {
    let url = $request.url;

    if (/^https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/apps$/.test(url)) {
        let headers = Object.fromEntries(Object.entries($request.headers).map(([key, value]) => [key.toLowerCase(), value]));
        let session_id = headers['x-session-id'];
        let session_digest = headers['x-session-digest'];
        let request_id = headers['x-request-id'];

        $persistentStore.write(session_id, 'session_id');
        $persistentStore.write(session_digest, 'session_digest');
        $persistentStore.write(request_id, 'request_id');

        $notification.post('信息获取成功', '请继续获取APP_ID后编辑参数停用该脚本', '');
        console.log(`信息获取成功: session_id=${session_id}, session_digest=${session_digest}, request_id=${request_id}`);
    } else if (/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/.test(url)) {
        const appIdMatch = url.match(/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/);
        if (appIdMatch && appIdMatch[1]) {
            let appId = appIdMatch[1];
            let existingAppIds = $persistentStore.read('APP_ID');
            let appIdSet = new Set(existingAppIds ? existingAppIds.split(',') : []);
            if (!appIdSet.has(appId)) {
                appIdSet.add(appId);
                $persistentStore.write(Array.from(appIdSet).join(','), 'APP_ID');
                $notification.post('已捕获APP_ID', '', `已捕获并存储APP_ID: ${appId}`);
                console.log(`已捕获并存储APP_ID: ${appId}`);
            } else {
                $notification.post('APP_ID重复', '', `APP_ID: ${appId} 已存在，无需重复添加。`);
                console.log(`APP_ID: ${appId} 已存在，无需重复添加。`);
            }
        } else {
            console.log('未捕获到有效的TestFlight APP_ID');
        }
    }

    $done({});
} else {
    !(async () => {
        let ids = $persistentStore.read('APP_ID');
        if (ids == null || ids == '') {
            console.log('未检测到APP_ID');
            $done();
        } else {
            ids = ids.split(',');
            for await (const ID of ids) {
                await autoPost(ID, ids);
            }
            if (ids.length === 0) {
                $notification.post('所有TestFlight已加入完毕 🎉', '模块已自动关闭', '');
                $done($httpAPI('POST', '/v1/modules', {'公测监控': false}));
            } else {
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

    return new Promise(resolve => {
        $httpClient.get({url: testurl + ID, headers: header}, (error, response, data) => {
            if (error === null && response.status === 200) {
                let jsonData = JSON.parse(data);
                if (jsonData.data.status === 'FULL') {
                    console.log(`${ID} 测试已满`);
                    resolve();
                } else {
                    $httpClient.post({url: testurl + ID + '/accept', headers: header}, (error, response, body) => {
                        if (!error && response.status === 200) {
                            let jsonBody = JSON.parse(body);
                            console.log(`${jsonBody.data.name} TestFlight加入成功`);
                            ids.splice(ids.indexOf(ID), 1);
                            $persistentStore.write(ids.join(','), 'APP_ID');
                            if (ids.length > 0) {
                                $notification.post(jsonBody.data.name + ' TestFlight加入成功', '', `继续执行APP ID：${ids.join(',')}`);
                            } else {
                                $notification.post(jsonBody.data.name + ' TestFlight加入成功', '', '所有APP ID处理完毕');
                            }
                            resolve();
                        } else {
                            console.log(`${ID} 加入失败: ${error}`);
                            ids.splice(ids.indexOf(ID), 1); 
                            $persistentStore.write(ids.join(','), 'APP_ID'); 
                            $notification.post('APP_ID 加入失败', '', `${ID} 已被移除`);
                            resolve();
                        }
                    });
                }
            } else {
                console.log(`${ID} 请求失败: ${error}`);
                ids.splice(ids.indexOf(ID), 1); 
                $persistentStore.write(ids.join(','), 'APP_ID'); 
                $notification.post('APP_ID 请求失败', '', `${ID} 已被移除`);
                resolve();
            }
        });
    });
}