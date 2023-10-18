/******************************************
 * @name 网上国网🌏
 * @channel https://t.me/yqc_123/
 * @feedback https://t.me/yqc_777/
 * @author 𝒀𝒖𝒉𝒆𝒏𝒈
 * @update 20231017
 * @version 1.0.1
 ******************************************/
const $ = new Env('网上国网') // 建议一天查询一次即可, 无需频繁查询
const baseURL = 'https://www.95598.cn'
const domain = 'http://172.233.81.206:7788' // 感谢tg群友@woxihuanniya提供的服务器
// const domain = 'http://192.168.1.20:7788' // 本地
var requestCyu = null // keyCode和publicKey
var requestBizrt = $.getdata('95598_bizrt') ? JSON.parse($.getdata('95598_bizrt')) : null // 登录信息
var authorizeCode = ''
var requestToken = null // accessToken
var bindInfo = $.getdata('95598_bindInfo') ? JSON.parse($.getdata('95598_bindInfo')) : null // 绑定信息
// ------------------------------------------------------
// 配置参数
var username = $.getdata('95598_username') || ''
var password = $.getdata('95598_password') || ''
var recentElcFee = $.getdata('95598_recent_elc_fee') // 是否查看近7天用电量
// ------------------------------------------------------
// 通知信息
var subTitle = ''
var Message = ''
// ------------------------------------------------------
// 面板专用
var surgePanelConfig = $.getdata('95598_surge_panel_config') || `{'title':'','content':'','icon':'','icon-color':''}` // Surge面板配置 -- 感谢@小白脸和@MuTu888两位佬的帮助
surgePanelConfig = surgePanelConfig ? JSON.parse(surgePanelConfig.replace(/\'/g, '"')) : null
// console.log(`✔️ 配置参数: ${JSON.stringify(surgePanelConfig)} !`)
var panelParams = null
// ------------------------------------------------------
!(async () => {
    if (!username || !password) {
        $.msg('网上国网', '请先配置网上国网账号密码!', '点击前往BoxJs配置', { 'open-url': '' })
        return
    }
    await getCode()
    if (requestBizrt) {
        var { token, userInfo } = requestBizrt
        console.log(`✔️ 已登录: ${token} !`)
        console.log(`✔️ 用户信息: ${JSON.stringify(userInfo[0])} !`)
    } else {
        await refreshToken()
    }
    // 测试用
    if (!requestToken) {
        // TODO:accessToken是否无感刷新的接口
        await refreshAccessToken()
    }
    if (!bindInfo) {
        await getBindInfo()
    } else {
        console.log(`✔️ 已绑定: ${JSON.stringify(bindInfo)} !`)
    }
    await getElcFee()
    // 近7天用电量
    if (recentElcFee.toString() === 'true') await getRecentElcFee()
    // 每月1号查询上个月用电量
    var day = $.time('dd', new Date().getTime())
    if (day === '01') await getLastMonthElcFee()
    // 通知
    $.msg(`网上国网`, subTitle, Message)
})()
    .catch((e) => $.log('', `❌ ${e}!`, ''))
    .finally(() => {
        var opts = {}
        if (panelParams) {
            var { totalPq, sumMoney, prepayBal, dayNum, date } = panelParams
            opts = {
                // 进阶知识:
                // content: 账户余额还有{sumMoney}元 ❗注意: 使用{}作为模板引擎的匹配符
                // 可用字段
                // totalPq, // 本月用电量
                // sumMoney, // 账户余额
                // prepayBal, // 预存电费
                // dayNum // 预计可用天数
                // date // 截至日期
                title: surgePanelConfig?.title || '网上国网',
                content: surgePanelConfig?.content
                    ? surgePanelConfig['content'].replace(
                          /{([^}]+)}/g,
                          (match, key) => ({ totalPq, sumMoney, prepayBal, dayNum, date }[key])
                      )
                    : subTitle,
                icon: surgePanelConfig?.icon || 'command.circle.fill',
                'icon-color':
                    surgePanelConfig && surgePanelConfig.hasOwnProperty('icon-color')
                        ? surgePanelConfig['icon-color']
                        : '#FFD700'
            }
        }
        // console.log(`✔️ 面板信息: ${JSON.stringify(opts, null, 2)} !`)
        $.done(opts)
    })
// 获取keyCode和publicKey
async function getCode() {
    var params = {
        url: '/api/oauth2/outer/c02/f02',
        method: 'post',
        headers: {}
    }
    try {
        var opts1 = await getEncryptData(params) // 加密
        var { body: encRes } = await $.http.post(opts1) // 请求
        var opts2 = {
            config: {
                ...params,
                headers: {
                    encryptKey: opts1.encryptKey
                }
            },
            data: encRes
        }
        var result = await getDecryptData(opts2) // 解密
        requestCyu = result
        var { keyCode, publicKey } = result
        console.log(`✔️ 获取keyCode成功: ${keyCode} !`)
        console.log(`✔️ 获取publicKey成功: ${publicKey} !`)
    } catch (e) {
        throw e
    }
}
// 获取验证码
async function getVerifyCode(key) {
    var params = {
        url: '/api/osg-web0004/open/c44/f01',
        method: 'post',
        data: { loginKey: key },
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var { code: base64 } = await getDecryptData(opts2)
        console.log(`✔️ 获取图片成功: ${base64} !`)
        var code = await recognizeCode(base64)
        console.log(`✔️ 识别图片成功: ${code} !`)
        return code
    } catch (e) {
        throw e
    }
}
// 识别验证码
async function recognizeCode(base64) {
    var res = await $.http.post({
        url: domain + '/api/recognize',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ yuheng: base64 })
    })
    var { data } = JSON.parse(res.body)
    if (data.length !== 4) {
        throw '验证码识别失败, 请重试!'
    } else {
        return data
    }
}
// 登录接口
async function doLogin(key, verifyCode) {
    var params = {
        url: '/api/osg-web0004/open/c44/f02',
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey
        },
        data: {
            loginKey: key,
            code: verifyCode,
            params: {
                uscInfo: {
                    devciceIp: '',
                    tenant: 'state_grid',
                    member: '0902',
                    devciceId: ''
                },
                quInfo: {
                    optSys: 'android',
                    pushId: '000000',
                    addressProvince: '110100',
                    password: password,
                    addressRegion: '110101',
                    account: username,
                    addressCity: '330100'
                }
            },
            Channels: 'web'
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        delete params.data
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var result = await getDecryptData(opts2)
        var { bizrt } = result
        // 20231017 -> 显示默认户主
        bizrt.userInfo[0].powerUserList = bizrt.userInfo[0].powerUserList.filter((item) => item.isDefault == '1')
        $.setdata(JSON.stringify(bizrt), '95598_bizrt')
        requestBizrt = bizrt
        var { token, userInfo } = bizrt
        console.log(`✔️ 登录成功: ${token} !`)
        console.log(`✔️ 用户信息: ${JSON.stringify(userInfo[0])} !`)
    } catch (e) {
        throw e
    }
}
// 重新登录
async function refreshToken() {
    var key = Math.random()
    var code = await getVerifyCode(key)
    await doLogin(key, code)
}
// 获取authcode
async function getAuthcode() {
    var params = {
        url: '/api/oauth2/oauth/authorize',
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey,
            token: requestBizrt.token
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        opts1.body = opts1.body.replace(/^\"|\"$/g, '')
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var result = await getDecryptData(opts2)
        var { redirect_url } = result
        authorizeCode = redirect_url.split('?code=')[1]
        console.log(`✔️ 获取code成功: ${authorizeCode} !`)
    } catch (e) {
        throw e
    }
}
// 获取accessToken
async function getAccessToken() {
    var params = {
        url: '/api/oauth2/outer/getWebToken',
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey,
            token: requestBizrt.token,
            authorizecode: authorizeCode
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var result = await getDecryptData(opts2)
        requestToken = result
        var { access_token, refresh_token } = result
        console.log(`✔️ 获取accessToken成功: ${access_token} !`)
    } catch (e) {
        throw e
    }
}
// 刷新accessToken
async function refreshAccessToken() {
    await getAuthcode()
    await getAccessToken()
}
// 校验
async function verifyBind() {
    var params = {
        url: '/api/osg-open-uc0001/member/c8/f72',
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey,
            token: requestBizrt.token,
            acctoken: requestToken.access_token
        },
        data: {
            uscInfo: {
                tenant: 'state_grid',
                member: '0902',
                devciceId: '',
                devciceIp: ''
            },
            quInfo: {
                token: requestBizrt.token,
                userId: requestBizrt.userInfo[0].userId,
                fileId: requestBizrt.userInfo[0].photo
            }
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var result = await getDecryptData(opts2)
        console.log(`✔️ 验证绑定成功: ${JSON.stringify(result)} !`)
    } catch (e) {
        throw e
    }
}
// 查询绑定信息 -- TODO:查询多个绑定信息
async function getBindInfo() {
    await verifyBind()
    var params = {
        url: `/api/osg-open-uc0001/member/c9/f02`,
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey,
            token: requestBizrt.token,
            acctoken: requestToken.access_token
        },
        data: {
            serviceCode: '01010049',
            source: '0902',
            target: '-1',
            uscInfo: {
                member: '0902',
                devciceIp: '',
                devciceId: '',
                tenant: 'state_grid'
            },
            quInfo: {
                userId: requestBizrt.userInfo[0].userId
            },
            token: requestBizrt.token,
            Channels: 'web'
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var { bizrt } = await getDecryptData(opts2)
        // 显示默认户主
        bizrt.powerUserList = bizrt.powerUserList.filter((item) => item.isDefault === '1')
        console.log(`✔️ 查询绑定信息成功: ${JSON.stringify(bizrt)} !`)
        $.setdata(JSON.stringify(bizrt), '95598_bindInfo')
        bindInfo = bizrt
    } catch (e) {
        throw e
    }
}
// 查询电费 -- TODO:查询多个电费
async function getElcFee() {
    var params = {
        url: '/api/osg-open-bc0001/member/c05/f01',
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey,
            token: requestBizrt.token,
            acctoken: requestToken.access_token
        },
        data: {
            data: {
                srvCode: '',
                serialNo: '',
                channelCode: '0902',
                funcCode: 'WEBA1007200',
                acctId: requestBizrt.userInfo[0].userId,
                userName: requestBizrt.userInfo[0].loginAccount,
                promotType: '1',
                promotCode: '1',
                userAccountId: requestBizrt.userInfo[0].userId,
                list: [
                    {
                        consNoSrc: bindInfo.powerUserList[0].consNo_dst,
                        proCode: bindInfo.powerUserList[0].proNo,
                        sceneType: bindInfo.powerUserList[0].constType,
                        consNo: bindInfo.powerUserList[0].consNo,
                        orgNo: bindInfo.powerUserList[0].orgNo
                    }
                ]
            },
            serviceCode: '0101143',
            source: 'SGAPP',
            target: bindInfo.powerUserList[0].proNo
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var result = await getDecryptData(opts2)
        console.log(`✔️ 查询电费成功: ${JSON.stringify(result)} !`)
        var { list } = result
        var {
            date, // 截至日期
            totalPq, // 上月总用电量
            sumMoney, // 账户余额
            prepayBal, // 预存电费
            dayNum // 预计可用天数
        } = list[0]
        panelParams = { totalPq, sumMoney, prepayBal, dayNum, date }
        var {
            nickname, // 用户名
            mobile_dst // 脱敏手机号
        } = requestBizrt.userInfo[0]
        var {
            orgName, // 脱敏供电单位
            elecAddr_dst, // 脱敏具体地址
            consName_dst, // 脱敏主户名
            consNo_dst // 用电户号
        } = bindInfo.powerUserList[0]
        // subTitle = `${totalPq && `本月用电: ${totalPq}`}` + `${sumMoney && `\t账户余额: ${sumMoney}`}`
        // Message =
        //     `${date && `截至日期: ${date}`}` +
        //     `${prepayBal && `\n预存电费: ${prepayBal}`}` +
        //     `${dayNum && `\n预计可用天数: ${dayNum}`}` +
        //     `${nickname && `\n用户名: ${nickname}`}` +
        //     `${mobile_dst && `\n手机号: ${mobile_dst}`}` +
        //     `${orgName && `\n供电单位: ${orgName}`}` +
        //     `${elecAddr_dst && `\n具体地址: ${elecAddr_dst}`}` +
        //     `${consName_dst && `\n主户名: ${consName_dst}`}` +
        //     `${consNo_dst && `\n用电户号: ${consNo_dst}`}`
        if (totalPq) {
            subTitle += `上月用电: ${totalPq}度`
        }
        if (sumMoney) {
            subTitle += `  账户余额: ${sumMoney}元`
        }
        if (date) {
            Message += `截至日期: ${date}`
        }
        if (prepayBal) {
            Message += `\n预存电费: ${prepayBal}元`
        }
        if (dayNum) {
            Message += `\n预计可用: ${dayNum}天`
        }
        if (consNo_dst && consName_dst) {
            Message += `\n户号信息: ${consNo_dst} | ${consName_dst}`;
}
        if (orgName) {
            Message += `\n供电单位: ${orgName}`
        }
        if (elecAddr_dst) {
            Message += `\n用电地址: ${elecAddr_dst}`
        }
    } catch (e) {
        throw e
    }
}
// 近期用电量(7/30)
async function getRecentElcFee() {
    var yesterday = $.time('yyyy-MM-dd', new Date().getTime() - 24 * 60 * 60 * 1000)
    var recentday = $.time('yyyy-MM-dd', new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
    var year = $.time('yyyy', new Date().getTime())
    var params = {
        url: `/api/osg-web0004/member/c24/f01`,
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey,
            token: requestBizrt.token,
            acctoken: requestToken.access_token
        },
        data: {
            params1: {
                // QUES: 是否固定
                serviceCode: {
                    order: '0101154',
                    uploadPic: '0101296',
                    pauseSCode: '0101250',
                    pauseTCode: '0101251',
                    listconsumers: '0101093',
                    messageList: '0101343',
                    submit: '0101003',
                    sbcMsg: '0101210',
                    powercut: '0104514',
                    BkAuth01: 'f15',
                    BkAuth02: 'f18',
                    BkAuth03: 'f02',
                    BkAuth04: 'f17',
                    BkAuth05: 'f05',
                    BkAuth06: 'f16',
                    BkAuth07: 'f01',
                    BkAuth08: 'f03'
                },
                source: 'SGAPP',
                target: '32101',
                uscInfo: {
                    member: '0902',
                    devciceIp: '',
                    devciceId: '',
                    tenant: 'state_grid'
                },
                quInfo: {
                    userId: requestBizrt.userInfo[0].userId
                },
                token: requestBizrt.token
            },
            params3: {
                data: {
                    acctId: requestBizrt.userInfo[0].userId,
                    consNo: bindInfo.powerUserList[0].consNo_dst,
                    consType: '01',
                    endTime: yesterday,
                    orgNo: bindInfo.powerUserList[0].orgNo,
                    queryYear: year,
                    proCode: bindInfo.powerUserList[0].proNo,
                    serialNo: '',
                    srvCode: '',
                    startTime: recentday,
                    userName: requestBizrt.userInfo[0].loginAccount,
                    funcCode: 'WEBALIPAY_01',
                    channelCode: '0902',
                    clearCache: '11',
                    promotCode: '1',
                    promotType: '1'
                },
                serviceCode: 'BCP_000026',
                source: 'app',
                target: bindInfo.powerUserList[0].proNo
            },
            params4: '010103'
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var result = await getDecryptData(opts2)
        console.log(`✔️ 获取近期用电量成功: ${JSON.stringify(result)} !`)
var { sevenEleList, totalPq } = result
if (sevenEleList.length > 0 && totalPq !== "-") {
    totalPq = parseFloat(totalPq); // Convert totalPq to a number
    Message += `\n\n最近用电:${totalPq.toFixed(2)} kW/h`
    sevenEleList.map((item, index) => {
        if (item?.thisVPq && item.dayElePq !== "-") {
            item.dayElePq = parseFloat(item.dayElePq); // Convert dayElePq to a number
            Message += `\n${item.day}: ${item.dayElePq.toFixed(2)} 度 ⚡️`
        }
    })
}
} catch (e) {
    throw e
}
}
// 上个月用电量
async function getLastMonthElcFee() {
    const getLastMonth = () => {
        var date = new Date()
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        if (month === 1) {
            year = year - 1
            month = 12
        } else {
            month = month - 1
        }
        return `${year}-${month < 10 ? '0' + month : month}`
    }
    var params = {
        url: `/api/osg-open-bc0001/member/c03/f07`,
        method: 'post',
        headers: {
            keyCode: requestCyu.keyCode,
            publicKey: requestCyu.publicKey,
            token: requestBizrt.token,
            acctoken: requestToken.access_token
        },
        data: {
            data: {
                acctId: requestBizrt.userInfo[0].userId,
                channelCode: '0902',
                funcCode: 'WEBALIPAY_01',
                list: [
                    {
                        consNo: bindInfo.powerUserList[0].consNo,
                        orgNo: bindInfo.powerUserList[0].proNo,
                        sceneType: '01',
                        consType: '0',
                        provinceCode: bindInfo.powerUserList[0].proNo
                    }
                ],
                promotCode: '1',
                promotType: '1',
                queryDate: getLastMonth(),
                serialNo: '',
                srvCode: '',
                userAccountId: requestBizrt.userInfo[0].userId,
                userName: ''
            },
            serviceCode: '0101143',
            source: 'app',
            target: '32101'
        }
    }
    try {
        var opts1 = await getEncryptData(params)
        var { body: encRes } = await $.http.post(opts1)
        var opts2 = {
            config: {
                ...params
            },
            data: encRes
        }
        var result = await getDecryptData(opts2)
        console.log(`✔️ 查询上个月用电量成功: ${JSON.stringify(result)} !`)
        const {
            totalAmt, // 花费金额
            totalPq // 用电量
        } = result
        // Message += `${totalAmt && `\n上个月花费金额: ${totalAmt}`}` + `\t${totalPq && `上个月用电量: ${totalPq}`}`
        if(totalAmt) Message += `\n上个月花费金额: ${totalAmt}`
        if(totalPq) Message += `  上个月用电量: ${totalPq}`
    } catch (e) {
        throw e
    }
}
// ------------------------------------------------------
// 考虑该应用的安全性, 加解密暂不公开
function getEncryptData(params) {
    return new Promise((resolve, reject) => {
        $.post(
            {
                url: domain + '/api/encrypt',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ yuheng: params })
            },
            (err, resp, data) => {
                if (err) {
                    reject(err)
                } else {
                    var resp = JSON.parse(data).data
                    resp.url = baseURL + resp.url
                    resp.body = JSON.stringify(resp.data)
                    delete resp.data
                    resolve(resp)
                }
            }
        )
    })
}
function getDecryptData(params) {
    return new Promise((resolve, reject) => {
        $.post(
            {
                url: domain + '/api/decrypt',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ yuheng: params })
            },
            (err, resp, data) => {
                if (err) {
                    reject(err)
                } else {
                    var resp = JSON.parse(data).data
                    console.log(resp, '--------------------')
                    var { code, message, data } = resp
                    if (code.toString() === '1') {
                        resolve(data)
                    } else {
                        // token失效
                        if (/无效|失效|过期|重新获取/.test(message)) {
                            $.setdata('', '95598_bizrt')
                            $.setdata('', '95598_bindInfo')
                            console.log(`✔️ 清理登录信息成功, 请重新运行脚本!`)
                        }
                        reject(message)
                    }
                }
            }
        )
    })
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,a)=>{s.call(this,t,(t,s,r)=>{t?a(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}getEnv(){return"undefined"!=typeof $environment&&$environment["surge-version"]?"Surge":"undefined"!=typeof $environment&&$environment["stash-version"]?"Stash":"undefined"!=typeof module&&module.exports?"Node.js":"undefined"!=typeof $task?"Quantumult X":"undefined"!=typeof $loon?"Loon":"undefined"!=typeof $rocket?"Shadowrocket":void 0}isNode(){return"Node.js"===this.getEnv()}isQuanX(){return"Quantumult X"===this.getEnv()}isSurge(){return"Surge"===this.getEnv()}isLoon(){return"Loon"===this.getEnv()}isShadowrocket(){return"Shadowrocket"===this.getEnv()}isStash(){return"Stash"===this.getEnv()}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const a=this.getdata(t);if(a)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,a)=>e(a))})}runScript(t,e){return new Promise(s=>{let a=this.getdata("@chavy_boxjs_userCfgs.httpapi");a=a?a.replace(/\n/g,"").trim():a;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[i,o]=a.split("@"),n={url:`http://${o}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":i,Accept:"*/*"},timeout:r};this.post(n,(t,e,a)=>s(a))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e);if(!s&&!a)return{};{const a=s?t:e;try{return JSON.parse(this.fs.readFileSync(a))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),a=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):a?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const a=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of a)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,a)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[a+1])>>0==+e[a+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,a]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,a,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,a,r]=/^@(.*?)\.(.*?)$/.exec(e),i=this.getval(a),o=a?"null"===i?null:i||"{}":"{}";try{const e=JSON.parse(o);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),a)}catch(e){const i={};this.lodash_set(i,r,t),s=this.setval(JSON.stringify(i),a)}}else s=this.setval(t,e);return s}getval(t){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.read(t);case"Quantumult X":return $prefs.valueForKey(t);case"Node.js":return this.data=this.loaddata(),this.data[t];default:return this.data&&this.data[t]||null}}setval(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":return $persistentStore.write(t,e);case"Quantumult X":return $prefs.setValueForKey(t,e);case"Node.js":return this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0;default:return this.data&&this.data[e]||null}}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){switch(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"],delete t.headers["content-type"],delete t.headers["content-length"]),t.params&&(t.url+="?"+this.queryStr(t.params)),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:a,statusCode:r,headers:i,rawBody:o}=t,n=s.decode(o,this.encoding);e(null,{status:a,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:a,response:r}=t;e(a,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";switch(t.body&&t.headers&&!t.headers["Content-Type"]&&!t.headers["content-type"]&&(t.headers["content-type"]="application/x-www-form-urlencoded"),t.headers&&(delete t.headers["Content-Length"],delete t.headers["content-length"]),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,a)=>{!t&&s&&(s.body=a,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,a)});break;case"Quantumult X":t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:a,headers:r,body:i,bodyBytes:o}=t;e(null,{status:s,statusCode:a,headers:r,body:i,bodyBytes:o},i,o)},t=>e(t&&t.error||"UndefinedError"));break;case"Node.js":let a=require("iconv-lite");this.initGotEnv(t);const{url:r,...i}=t;this.got[s](r,i).then(t=>{const{statusCode:s,statusCode:r,headers:i,rawBody:o}=t,n=a.decode(o,this.encoding);e(null,{status:s,statusCode:r,headers:i,rawBody:o,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&a.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let a={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in a)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?a[e]:("00"+a[e]).substr((""+a[e]).length)));return t}queryStr(t){let e="";for(const s in t){let a=t[s];null!=a&&""!==a&&("object"==typeof a&&(a=JSON.stringify(a)),e+=`${s}=${a}&`)}return e=e.substring(0,e.length-1),e}msg(e=t,s="",a="",r){const i=t=>{switch(typeof t){case void 0:return t;case"string":switch(this.getEnv()){case"Surge":case"Stash":default:return{url:t};case"Loon":case"Shadowrocket":return t;case"Quantumult X":return{"open-url":t};case"Node.js":return}case"object":switch(this.getEnv()){case"Surge":case"Stash":case"Shadowrocket":default:{let e=t.url||t.openUrl||t["open-url"];return{url:e}}case"Loon":{let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}case"Quantumult X":{let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,a=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":a}}case"Node.js":return}default:return}};if(!this.isMute)switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":default:$notification.post(e,s,a,i(r));break;case"Quantumult X":$notify(e,s,a,i(r));break;case"Node.js":}if(!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),a&&t.push(a),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){switch(this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:this.log("",`❗️${this.name}, 错误!`,t);break;case"Node.js":this.log("",`❗️${this.name}, 错误!`,t.stack)}}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;switch(this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),this.getEnv()){case"Surge":case"Loon":case"Stash":case"Shadowrocket":case"Quantumult X":default:$done(t);break;case"Node.js":process.exit(1)}}}(t,e)}
