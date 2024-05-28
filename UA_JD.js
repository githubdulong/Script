// ==UserScript==
// @name         Auto Switch UserAgent
// @name:zh-CN   UA自由切
// @namespace    https://greasyfork.org/zh-CN/scripts/490764
// @version      0.2.1
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
 
    // 内置常用 UA 列表
    const builtInUaList = {
    // 主要浏览器的UA
    'ie_win': 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'chrome_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
    'edge_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 Edg/96.0.1054.29',
    'firefox_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:95.0) Gecko/20100101 Firefox/95.0',
    'safari_win': null, // Windows 系统没有 Safari 浏览器
    'opera_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.56',
 
    'ie_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
    'chrome_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
    'edge_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 Edg/96.0.1054.29',
    'firefox_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.0; rv:95.0) Gecko/20100101 Firefox/95.0',
    'safari_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'opera_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.56',
 
    'chrome_linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36',
    'firefox_linux': 'Mozilla/5.0 (X11; Linux x86_64; rv:95.0) Gecko/20100101 Firefox/95.0',
    'safari_linux': null, // Linux 系统没有 Safari 浏览器
    'opera_linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 OPR/82.0.4227.56',
 
    'chrome_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36',
    'firefox_android': 'Mozilla/5.0 (Android 12; Mobile; rv:95.0) Gecko/95.0 Firefox/95.0',
    'safari_android': null, // Android 系统没有 Safari 浏览器
    'opera_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 OPR/82.0.4227.56',
 
    'chrome_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15',
    'firefox_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/35.0 Mobile/15E148 Safari/605.1.15',
    'safari_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15',
    'opera_iphone': null, // iPhone 系统没有 Opera 浏览器
 
    // 主流APP的UA
    'qq_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 QQBrowser/10.8.4326.400',
    'qq_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 QQBrowser/10.8.4326.400',
    'qq_linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 QQBrowser/10.8.4326.400',
    'qq_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 QQBrowser/10.8.4326.400',
    'qq_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 QQ/8.8.50.601',
 
    'wechat_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 WeChat/3.8.0.181 MicroMessenger/202207150100',
    'wechat_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 WeChat/3.8.0.181 MicroMessenger/202207150100',
    'wechat_linux': null, // Linux 系统没有微信
    'wechat_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 MicroMessenger/202207150100 NetType/WIFI Language/zh_CN',
    'wechat_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.16(0x18001028) NetType/WIFI Language/zh_CN',
 
    'weibo_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 Weibo (2012112000)/8.8.5',
    'weibo_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 Weibo (2012112000)/8.8.5',
    'weibo_linux': null, // Linux 系统没有微博
    'weibo_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 Weibo (2012112000)/12.2.5',
    'weibo_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 Weibo (2012112000)/12.2.5',
 
    'baidu_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baidu_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baidu_linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baidu_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 baidubrowser/12.45.21.0',
    'baidu_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 baidubrowser/12.45.21.0',
 
    'baidupan_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baidupan_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baidupan_linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baidupan_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 baidubrowser/12.45.21.0',
    'baidupan_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 baidubrowser/12.45.21.0',
 
    'baiduwk_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baiduwk_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baiduwk_linux': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 baidubrowser/12.45.21.0',
    'baiduwk_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 baidubrowser/12.45.21.0',
    'baiduwk_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 baidubrowser/12.45.21.0',
 
    'zhihu_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 zhihu/8.28.0',
    'zhihu_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 zhihu/8.28.0',
    'zhihu_linux': null, // Linux 系统没有知乎
    'zhihu_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 zhihu/8.28.0',
    'zhihu_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 zhihu/8.28.0',
 
    'bilibili_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 bilibili/8.28.0',
    'bilibili_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 bilibili/8.28.0',
    'bilibili_linux': null, // Linux 系统没有哔哩哔哩
    'bilibili_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 bilibili/8.28.0',
    'bilibili_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 bilibili/8.28.0',
 
    'smzdm_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 smzdm/8.28.0',
    'smzdm_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 smzdm/8.28.0',
    'smzdm_linux': null, // Linux 系统没有什么值得买
    'smzdm_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 smzdm/8.28.0',
    'smzdm_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 smzdm/8.28.0',
 
    'xiaohongshu_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 xiaohongshu/8.28.0',
    'xiaohongshu_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 xiaohongshu/8.28.0',
    'xiaohongshu_linux': null, // Linux 系统没有小红书
    'xiaohongshu_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 xiaohongshu/8.28.0',
    'xiaohongshu_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 xiaohongshu/8.28.0',
 
    'csdn_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 csdn/8.28.0',
    'csdn_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 csdn/8.28.0',
    'csdn_linux': null, // Linux 系统没有 CSDN
    'csdn_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 csdn/8.28.0',
    'csdn_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 csdn/8.28.0',
 
    'facebook_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 facebook/8.28.0',
    'facebook_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 facebook/8.28.0',
    'facebook_linux': null, // Linux 系统没有 Facebook
    'facebook_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 facebook/8.28.0',
    'facebook_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 facebook/8.28.0',
 
    'instagram_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 instagram/8.28.0',
    'instagram_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 instagram/8.28.0',
    'instagram_linux': null, // Linux 系统没有 Instagram
    'instagram_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 instagram/8.28.0',
    'instagram_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 instagram/8.28.0',
 
    'twitter_win': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 twitter/8.28.0',
    'twitter_mac': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36 twitter/8.28.0',
    'twitter_linux': null, // Linux 系统没有 Twitter
    'twitter_android': 'Mozilla/5.0 (Linux; Android 12; SM-G991B Build/SP1A.210812.016; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36 twitter/8.28.0',
    'twitter_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/605.1.15 twitter/8.28.0',

    };
 
    // 内置替换规则
    const builtInUrlUaMap = {
    '*.weixin.qq.com': 'wechat_android', // 微信
    '*.qq.com': 'qq_android', // QQ
    '*.weibo.com': 'weibo_android', // 微博
    'pan.baidu.com': 'baidu_android', // 百度网盘
    'wenku.baidu.com': 'baidu_android', // 百度文库
    '*.baidu.com': 'baidu_android', // 百度
    '*.zhihu.com': 'zhihu_android', // 知乎
    '*.bilibili.com': 'bilibili_android', // 哔哩哔哩
    '*.smzdm.com': 'smzdm_android', // 什么值得买
    '*.xiaohongshu.com': 'xiaohongshu_android', // 小红书
    '*.csdn.net': 'csdn_android', // CSDN
    '*.facebook.com': 'facebook_android', // Facebook
    '*.instagram.com': 'instagram_android', // Instagram
    '*.twitter.com': 'twitter_android', // Twitter
    };
 
    // 自定义 UA 列表
    const customUaList = {
    'jd_iphone': 'jdapp;iPhone;11.0.0;15.1;JD4iPhone/11.0.0 CFNetwork/1331.0.7 Darwin/21.4.0',
    'jdjsb_iphone': 'jdltapp;iPhone;3.3.8;14.5;;network/wifi;hasUPPay/0;pushNoticeIsOpen/0;lang/zh_CN;model/iPhone11,8;addressid/1577930106;hasOCPay/0;appBuild/1063;supportBestPay/0;pv/2.9;apprpd/Allowance_Registered;ref/JDLTTaskCenterViewController;psq/8;ads/;psn/|4;jdv/0|;adk/;app_device/IOS;pap/JA2020_3112531|3.3.8|IOS 14.5;Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    'jdjr_iphone': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148/application=JDJR-App&deviceId=4354534334832364d234532423d243145343-d293432414d2433383832363544444643424&eufv=1&clientType=ios&iosType=iphone&clientVersion=6.3.50&HiClVersion=6.3.50&isUpdate=0&osVersion=15.5&osName=iOS&screen=896414&src=App Store&netWork=2&netWorkType=4&CpayJS=UnionPay/1.0 JDJR&stockSDK=stocksdk-iphone_4.1.0&sPoint=&jdPay=(#@jdPaySDK*#@jdPayChannel=jdfinance&jdPayChannelVersion=6.3.50&jdPaySdkVersion=4.00.37.00&jdPayClientName=iOS*#@jdPaySDK*#@)',
    'jx_iphone': 'jdpingou;iPhone;4.7.0;14.5;fec5b553097ab5ad978a892b9e9bd7ef61294408;network/2g,3g;model/iPhone11,6;appBuild/100518;ADID/00000000-0000-0000-0000-000000000000;supportApplePay/1;hasUPPay/0;pushNoticeIsOpen/0;hasOCPay/0;supportBestPay/0;session/91;pap/JA2019_3111789;brand/apple;supportJDSHWK/1;Mozilla/5.0 (iPhone; CPU iPhone OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    };
 
    // 自定义替换规则
    const customUrlUaMap = {
    '*.m.jd.com': 'jd_iphone', // 京东
    'gold.jd.com': 'jdjsb_iphone', // 京东极速版
    '*.jr.jd.com': 'jdjr_iphone', // 京东金融
    '*.m.jingxi.com': 'jx_iphone', // 京喜
    };
 
    // 合并 UA 列表和替换规则
    const uaList = Object.assign({}, builtInUaList, customUaList);
    const urlUaMap = Object.assign({}, builtInUrlUaMap, customUrlUaMap);
 
    // 获取当前网址或域
    const currentUrl = window.location.href;
    const currentDomain = window.location.hostname;
 
    // 匹配替换规则
    let matchedUaKey = null;
    for (const subdomain in urlUaMap) {
        const regex = new RegExp(subdomain.replace(/\./g, '\\.').replace(/\*/g, '.*'));
        if (regex.test(currentUrl) || regex.test(currentDomain)) {
            matchedUaKey = urlUaMap[subdomain];
            break;
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
 
    // 添加“状态”按钮
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
 
    // 添加“状态”面板
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
 
    // 显示“状态”面板
    function showStatusPanel() {
        statusPanel.style.display = 'block';
        statusPanel.innerHTML = `
            <p>${languagePack[getLanguage()].name}: ${languagePack[getLanguage()].description}</p>
            <p>${languagePack[getLanguage()].ua}: ${matchedUaKey ? uaList[matchedUaKey] : languagePack[getLanguage()].noMatch}</p>
            <p>${languagePack[getLanguage()].key}: ${matchedUaKey ? matchedUaKey : languagePack[getLanguage()].noMatch}</p>
            <button onclick="hideStatusPanel()">${languagePack[getLanguage()].close}</button>
        `;
    }
 
    // 隐藏“状态”面板
    function hideStatusPanel() {
        statusPanel.style.display = 'none';
    }
 
    // 获取语言
    function getLanguage() {
        const browserLanguage = navigator.language || navigator.userLanguage;
        return languagePack[browserLanguage] ? browserLanguage : 'en';
    }
})();