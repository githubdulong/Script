/*
更新时间：2024.05.14 15:48
更新内容：404状态码判断更改为模块参数自定义选择保留或移除

Surge配置
https://raw.githubusercontent.com/githubdulong/Script/master/Surge/AUTOTF.sgmodule
Boxjs订阅
https://raw.githubusercontent.com/githubdulong/Script/master/boxjs.json
*/

// 解析传入的参数
let args = {};
if ($argument) {
    $argument.split('&').forEach(arg => {
        let [key, value] = arg.split('=');
        args[key] = value;
    });
}

let handle404 = args['HANDLE_404'] === '1';

if (typeof $request !== 'undefined' && $request) {
    let url = $request.url;

    let keyPattern = /^https:\/\/testflight\.apple\.com\/v3\/accounts\/(.*?)\/apps/;
    let key = url.match(keyPattern) ? url.match(keyPattern)[1] : null;
    const handler = (appIdMatch) => {
        if (appIdMatch && appIdMatch[1]) {
            let appId = appIdMatch[1];
            let existingAppIds = $persistentStore.read('APP_ID');
            let appIdSet = new Set(existingAppIds ? existingAppIds.split(',') : []);
            if (!appIdSet.has(appId)) {
                appIdSet.add(appId);
                $persistentStore.write(Array.from(appIdSet).join(','), 'APP_ID');
                $notification.post('已捕获APP_ID', '', `已捕获并存储APP_ID: ${appId}`, {"auto-dismiss": 2});
                console.log(`已捕获并存储APP_ID: ${appId}`);
            } else {
                $notification.post('APP_ID重复', '', `APP_ID: ${appId} 已存在，无需重复添加。`, {"auto-dismiss": 2});
                console.log(`APP_ID: ${appId} 已存在，无需重复添加。`);
            }
        } else {
            console.log('未捕获到有效的TestFlight APP_ID');
        }
    };
    if (/^https:\/\/testflight\.apple\.com\/v3\/accounts\/.*\/apps$/.test(url) && key) {
        let headers = Object.fromEntries(Object.entries($request.headers).map(([key, value]) => [key.toLowerCase(), value]));
        let session_id = headers['x-session-id'];
        let session_digest = headers['x-session-digest'];
        let request_id = headers['x-request-id'];

        $persistentStore.write(session_id, 'session_id');
        $persistentStore.write(session_digest, 'session_digest');
        $persistentStore.write(request_id, 'request_id');
        $persistentStore.write(key, 'key');

        let existingAppIds = $persistentStore.read('APP_ID');
        if (!existingAppIds) {
            $notification.post('信息获取成功 🎉', '', '请获取APP_ID后编辑模块参数停用该脚本', {"auto-dismiss": 10});
        }
        console.log(`信息获取成功: session_id=${session_id}, session_digest=${session_digest}, request_id=${request_id}, key=${key}`);
    } else if (/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/.test(url)) {
        const appIdMatch = url.match(/^https:\/\/testflight\.apple\.com\/join\/([A-Za-z0-9]+)$/);
        handler(appIdMatch);
    } else if (/v3\/accounts\/.*\/ru/.test(url)) {
        const appIdMatch = url.match(/v3\/accounts\/.*\/ru\/(.*)/);
        handler(appIdMatch);
    }

    $done({});
} else {
    !(async () => {
        let ids = $persistentStore.read('APP_ID');
        if (!ids) {
            console.log('未检测到APP_ID');
            $done();
        } else {
            ids = ids.split(',');
            for await (const ID of ids) {
                await autoPost(ID, ids);
            }
            if (ids.length === 0) {
                $notification.post('所有TestFlight已加入完毕 🎉', '', '模块已自动关闭停止运行', {"sound": true});
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

    return new Promise((resolve) => {
        $httpClient.get({ url: testurl + ID, headers: header }, (error, response, data) => {
            if (error) {
                console.log(`${ID} 网络请求失败: ${error}，保留 APP_ID`);
                resolve();
                return;
            }

            if (response.status === 500) {
                console.log(`${ID} 服务器错误: 状态码 500，保留 APP_ID`);
                resolve();
                return;
            }

            if (response.status === 404) {
                if (handle404) {
                    console.log(`${ID} 链接无效: 状态码 404，自动移除APP_ID`);
                    ids.splice(ids.indexOf(ID), 1);
                    $persistentStore.write(ids.join(','), 'APP_ID');
                    $notification.post('链接无效', '', `${ID} 状态码 404，已自动移除`, {"auto-dismiss": 2});
                } else {
                    console.log(`${ID} 链接无效: 状态码 404，请在BoxJs或模块参数移除APP_ID`);
                    $notification.post('链接无效', '', `${ID} 状态码 404，请在BoxJs或模块参数移除APP_ID`, {"auto-dismiss": 2});
                }
                resolve();
                return;
            }

            if (response.status !== 200) {
                console.log(`${ID} 不是有效链接: 状态码 ${response.status}，移除 APP_ID`);
                ids.splice(ids.indexOf(ID), 1);
                $persistentStore.write(ids.join(','), 'APP_ID');
                $notification.post('不是有效的TestFlight链接', '', `${ID} 已被移除`, {"auto-dismiss": 2});
                resolve();
                return;
            }

            let jsonData;
            try {
                jsonData = JSON.parse(data);
            } catch (parseError) {
                console.log(`${ID} 响应解析失败: ${parseError}，保留 APP_ID`);
                resolve();
                return;
            }

            if (!jsonData || !jsonData.data) {
                console.log(`${ID} 无法接受邀请: 保留 APP_ID`);
                resolve();
                return;
            }

            if (jsonData.data.status === 'FULL') {
                console.log(`${ID} 测试已满: 保留 APP_ID`);
                resolve();
                return;
            }

            $httpClient.post({ url: testurl + ID + '/accept', headers: header }, (error, response, body) => {
                if (!error && response.status === 200) {
                    let jsonBody;
                    try {
                        jsonBody = JSON.parse(body);
                    } catch (parseError) {
                        console.log(`${ID} 加入请求响应解析失败: ${parseError}，保留 APP_ID`);
                        resolve();
                        return;
                    }

                    console.log(`${jsonBody.data.name} TestFlight加入成功`);
                    ids.splice(ids.indexOf(ID), 1);
                    $persistentStore.write(ids.join(','), 'APP_ID');
                    if (ids.length > 0) {
                        $notification.post(jsonBody.data.name + ' TestFlight加入成功', '', `继续执行APP         ID: ${ids.join(',')}`, {"sound": true});
                    } else {
                        $notification.post(jsonBody.data.name + ' TestFlight加入成功', '', '所有APP ID处理完毕', {"sound": true});
                    }
                } else {
                    console.log(`${ID} 加入失败: ${error || `状态码 ${response.status}`}，保留 APP_ID`);
                }
                resolve();
            });
        });
    });
}
