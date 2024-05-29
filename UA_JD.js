// ==UserScript==
// @name         Auto Switch JD UserAgent
// @name:zh-CN   UA_JD自由切换
// @namespace    魔改：https://greasyfork.org/zh-CN/scripts/490764
// @version      1.0
// @description  Use different User Agents based on different URLs or domains.
// @description:zh-CN 根据不同的网址或域名，使用不同的 User Agent。
// @author       咕德
// @license      MIT
// @icon         data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEwIiBoZWlnaHQ9IjQwNCIgdmlld0JveD0iMCAwIDQxMCA0MDQiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0zOTkuNjQxIDU5LjUyNDZMMjE1LjY0MyAzODguNTQ1QzIxMS44NDQgMzk1LjMzOCAyMDIuMDg0IDM5NS4zNzggMTk4LjIyOCAzODguNjE4TDEwLjU4MTcgNTkuNTU2M0M2LjM4MDg3IDUyLjE4OTYgMTIuNjgwMiA0My4yNjY1IDIxLjAyODEgNDQuNzU4NkwyMDUuMjIzIDc3LjY4MjRDMjA2LjM5OCA3Ny44OTI0IDIwNy42MDEgNzcuODkwNCAyMDguNzc2IDc3LjY3NjNMMzg5LjExOSA0NC44MDU4QzM5Ny40MzkgNDMuMjg5NCA0MDMuNzY4IDUyLjE0MzQgMzk5LjY0MSA1OS41MjQ2WiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyKSIvPgo8cGF0aCBkPSJNMjkyLjk2NSAxLjU3NDRMMTU2LjgwMSAyOC4yNTUyQzE1NC41NjMgMjguNjkzNyAxNTIuOTA2IDMwLjU5MDMgMTUyLjc3MSAzMi44NjY0TDE0NC4zOTUgMTc0LjMzQzE0NC4xOTggMTc3LjY2MiAxNDcuMjU4IDE4MC4yNDggMTUwLjUxIDE3OS40OThMMTg4LjQyIDE3MC43NDlDMTkxLjk2NyAxNjkuOTMxIDE5NS4xNzIgMTczLjA1NSAxOTQuNDQzIDE3Ni42MjJMMTgzLjE4IDIzMS43NzVDMTgyLjQyMiAyMzUuNDg3IDE4NS45MDcgMjM4LjY2MSAxODkuNTMyIDIzNy41NkwyMTIuOTQ3IDIzMC40NDZDMjE2LjU3NyAyMjkuMzQ0IDIyMC4wNjUgMjMyLjUyNyAyMTkuMjk3IDIzNi4yNDJMMjAxLjM5OCAzMjIuODc1QzIwMC4yNzggMzI4LjI5NCAyMDcuNDg2IDMzMS4yNDkgMjEwLjQ5MiAzMjYuNjAzTDIxMi41IDMyMy41TDMyMy40NTQgMTAyLjA3MkMzMjUuMzEyIDk4LjM2NDUgMzIyLjEwOCA5NC4xMzcgMzE4LjAzNiA5NC45MjI4TDI3OS4wMTQgMTAyLjQ1NEMyNzUuMzQ3IDEwMy4xNjEgMjcyLjIyNyA5OS43NDYgMjczLjI2MiA5Ni4xNTgzTDI5OC43MzEgNy44NjY4OUMyOTkuNzY3IDQuMjczMTQgMjk2LjYzNiAwLjg1NTE4MSAyOTIuOTY1IDEuNTc0NFoiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcikiLz4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQwX2xpbmVhciIgeDE9IjYuMDAwMTciIHkxPSIzMi45OTk5IiB4Mj0iMjM1IiB5Mj0iMzQ0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIHN0b3AtY29sb3I9IiM0MUQxRkYiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjQkQzNEZFIi8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhciIgeDE9IjE5NC42NTEiIHkxPSI4LjgxODE4IiB4Mj0iMjM2LjA3NiIgeTI9IjI5Mi45ODkiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0ZGRUE4MyIvPgo8c3RvcCBvZmZzZXQ9IjAuMDgzMzMzMyIgc3RvcC1jb2xvcj0iI0ZGREQzNSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRkE4MDAiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
 
    // 语言包
    const languagePack = {
        'en': {
            name: 'Auto Switch UserAgent',
            description: 'Automatically switch User Agent based on different URLs or domains, and support multilingual display.',
            status: 'Status',
            ua: 'Current UA:',
            key: 'Key in uaList:',
            close: 'Close',
            noMatch: 'No matching UA found in the list'
        },
        'zh-CN': {
            name: 'UA自由切',
            description: '根据不同的网址或域自动切换 User Agent，支持多语言显示。',
            status: '状态',
            ua: '当前 UA：',
            key: 'uaList 中的 Key：',
            close: '关闭',
            noMatch: '在清单中未匹配到 UA'
        }
    };
 
    // 内置JD UA 列表
    const builtInUaList = {
        'jd_iphone': 'jdapp;iPhone;11.0.0;15.1;JD4iPhone/11.0.0 CFNetwork/1331.0.7 Darwin/21.4.0',
        'jdjsb_iphone': 'jdltapp;iPhone;3.3.8;14.5;;network/wifi;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;model/iPhone11,8;addressid/1577930106;hasOCPay/0;appBuild/1063;supportBestPay/0;pv/2.9;apprpd/Allowance_Registered;ref/JDLTTaskCenterViewController;psq/8;ads/;psn/|4;jdv/0|;adk/;app_device/IOS;pap/JA2020_3112531|3.3.8|IOS 14.5;Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
        'jdjr_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/application=JDJR-App&deviceId=4354534334832364d234532423d243145343-d293432414d2433383832363544444643424&eufv=1&clientType=ios&iosType=iphone&clientVersion=6.3.50&HiClVersion=6.3.50&isUpdate=0&osVersion=15.5&osName=iOS&screen=896414&src=App Store&netWork=2&netWorkType=4&CpayJS=UnionPay/1.0 JDJR&stockSDK=stocksdk-iphone_4.1.0&sPoint=&jdPay=(#@jdPaySDK*#@jdPayChannel=jdfinance&jdPayChannelVersion=6.3.50&jdPaySdkVersion=4.00.37.00&jdPayClientName=iOS*#@jdPaySDK*#@)',
        'jx_iphone': 'jdpingou;iPhone;4.7.0;14.5;fec5b553097ab5ad978a892b9e9bd7ef61294408;network/2g,3g;model/iPhone11,6;appBuild/100518;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/0;hasOCPay/0;supportBestPay/0;session/91;pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    };
 
    // 内置替换规则
    const builtInUrlUaMap = {
        '*.m.jd.com': 'jd_iphone', // 京东
        'gold.jd.com': 'jdjsb_iphone', // 京东极速版
        '*.jr.jd.com': 'jdjr_iphone', // 京东金融
        '*.m.jingxi.com': 'jx_iphone', // 京喜
    };
 
    // 自定义 UA 列表
    const customUaList = {
            };
 
    // 自定义替换规则
    const customUrlUaMap = {
    };
 
    // 黑名单和白名单
    const blackList = ['*'];
    const whiteList = ['*.m.jd.com', 'gold.jd.com', '*.jr.jd.com', '*.m.jingxi.com'];
 
    // 合并 UA 列表和替换规则
    const uaList = Object.assign({}, builtInUaList, customUaList);
    const urlUaMap = Object.assign({}, builtInUrlUaMap, customUrlUaMap);
 
    // 获取当前网址或域
    const currentUrl = window.location.href;
    const currentDomain = window.location.hostname;
 
    // 检查是否在白名单中
    function isInWhiteList(url, domain) {
        return whiteList.some(subdomain => {
            const regex = new RegExp(subdomain.replace(/\./g, '\\.').replace(/\*/g, '.*'));
            return regex.test(url) || regex.test(domain);
        });
    }
 
    // 检查是否在黑名单中
    function isInBlackList(url, domain) {
        return blackList.some(subdomain => {
            const regex = new RegExp(subdomain.replace(/\./g, '\\.').replace(/\*/g, '.*'));
            return regex.test(url) || regex.test(domain);
        });
    }
 
    // 匹配替换规则
    let matchedUaKey = null;
    if (isInWhiteList(currentUrl, currentDomain) || !isInBlackList(currentUrl, currentDomain)) {
        for (const subdomain in urlUaMap) {
            const regex = new RegExp(subdomain.replace(/\./g, '\\.').replace(/\*/g, '.*'));
            if (regex.test(currentUrl) || regex.test(currentDomain)) {
                matchedUaKey = urlUaMap[subdomain];
                break;
            }
        }
    }
 
    // 设置 User Agent
    if (matchedUaKey) {
        Object.defineProperty(navigator, 'userAgent', {
            get: function () {
                return uaList[matchedUaKey];
            }
        });
    }
 
    // 添加"状态"按钮和面板（仅在白名单中显示）
    if (isInWhiteList(currentUrl, currentDomain)) {
        const statusButton = document.createElement('button');
        statusButton.textContent = languagePack[getLanguage()].status;
        statusButton.style.position = 'fixed';
        statusButton.style.top = '0';
        statusButton.style.right = '0';
        statusButton.style.zIndex = '9999';
        statusButton.addEventListener('click', function () {
            showStatusPanel();
        });
        document.body.appendChild(statusButton);
 
        const statusPanel = document.createElement('div');
        statusPanel.style.position = 'fixed';
        statusPanel.style.top = '0';
        statusPanel.style.right = '0';
        statusPanel.style.zIndex = '99999';
        statusPanel.style.padding = '10px';
        statusPanel.style.backgroundColor = '#fff';
        statusPanel.style.border = '1px solid #000';
        statusPanel.style.display = 'none';
        document.body.appendChild(statusPanel);
 
        function showStatusPanel() {
            statusPanel.style.display = 'block';
            statusPanel.innerHTML = `
                <p>${languagePack[getLanguage()].name}: ${languagePack[getLanguage()].description}</p>
                <p>${languagePack[getLanguage()].ua}: ${matchedUaKey ? uaList[matchedUaKey] : languagePack[getLanguage()].noMatch}</p>
                <p>${languagePack[getLanguage()].key}: ${matchedUaKey ? matchedUaKey : languagePack[getLanguage()].noMatch}</p>
                <button onclick="hideStatusPanel()">${languagePack[getLanguage()].close}</button>
            `;
        }
 
        function hideStatusPanel() {
            statusPanel.style.display = 'none';
        }
    }
 
    // 获取语言
    function getLanguage() {
        const browserLanguage = navigator.language || navigator.userLanguage;
        return languagePack[browserLanguage] ? browserLanguage : 'en';
    }
})();
