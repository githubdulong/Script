/*
Surge Panel：https://raw.githubusercontent.com/githubdulong/Script/master/Surge/Oil.sgmodule

今日油价，仅限Surge Panel使用
*/

const params = getParams($argument);
const provinceName = params.provname || "湖南";
const apiKey = params.apikey;  // 使用模块参数填写Apikey.申请地址：https://www.tianapi.com/apiview/104 (该接口普通会员每天赠送100次调用额度);

const apiUrls = [
    `https://apis.tianapi.com/oilprice/index?key=${apiKey}&prov=${encodeURIComponent(provinceName)}`,
    `https://apis.tianapi.com/oilprice/index?key=231de491563c35731436829ac52aad43&prov=${encodeURIComponent(provinceName)}`,
    `https://apis.tianapi.com/oilprice/index?key=a2bc7a0e01be908881ff752677cf94b7&prov=${encodeURIComponent(provinceName)}`,
    `https://apis.tianapi.com/oilprice/index?key=1bcc67c0114bc39a8818c8be12c2c9ac&prov=${encodeURIComponent(provinceName)}`,
    `https://apis.tianapi.com/oilprice/index?key=3c5ee42145c852de4147264f25b858dc&prov=${encodeURIComponent(provinceName)}`,
    `https://apis.tianapi.com/oilprice/index?key=d718b0f7c2b6d71cb3a9814e90bf847f&prov=${encodeURIComponent(provinceName)}`
];
let currentIndex = 0;

function testNextUrl() {
    if (currentIndex >= apiUrls.length) {
        console.log("所有URL都失败了");
        $done();
        return;
    }

    const apiUrl = apiUrls[currentIndex];

    $httpClient.get(apiUrl, (error, response, data) => {
        if (error) {
            console.log(`URL ${currentIndex + 1} 出错: ${error}`);
            currentIndex++;
            testNextUrl();
        } else {
            handleResponse(data);
        }
    });
}

function handleResponse(data) {
    const oilPriceData = JSON.parse(data);
    if (oilPriceData.code === 200) {
        const oilPriceInfo = oilPriceData.result;
        const message = `0#柴油:${oilPriceInfo.p0}元 | 92汽油:${oilPriceInfo.p92}元\n95汽油:${oilPriceInfo.p95}元 | 98汽油:${oilPriceInfo.p98}元`;

                // 获取 http://m.qiyoujiage.com 网页 HTML 内容并提取 tishiContent

        $httpClient.get('http://m.qiyoujiage.com/', (error, response, data) => {
            if (error) {
                console.log(`获取HTML内容出错: ${error}`);
            } else {
                // 使用正则表达式从HTML中提取 var tishiContent 的内容
                const tishiMatch = data.match(/var\s+tishiContent\s*=\s*"(.*?)"/);
                if (tishiMatch) {
                    let tishiContent = tishiMatch[1];

                    const dateMatch = tishiContent.match(/(\d{1,2})月(\d{1,2})日/);
                    let formattedDate = "未知日期";
                    let logDate = "未知日期"; 
                    if (dateMatch) {
                        let [month, day] = [parseInt(dateMatch[1]), parseInt(dateMatch[2])];
                        logDate = `${month}月${day}日`;
                        formattedDate = `${month.toString().padStart(2, '0')}-${(day + 1).toString().padStart(2, '0')}`;
                    }

                    let adjustmentSymbols = "";
                    const adjustmentMatch = tishiContent.match(/(下调|下跌|上调|上涨)/);
                    let adjustmentAction = adjustmentMatch[1];
                    adjustmentSymbols = (adjustmentAction.includes("下")) ? "\u25BC\u25B3" : "\u25BD\u25B2";

                    const priceRangeMatch = tishiContent.match(/(\d+\.\d+)元\/升-(\d+\.\d+)元\/升/);
                    let priceAdjustment = "0.00~0.00元";
                    if (priceRangeMatch) {
                        priceAdjustment = `${priceRangeMatch[1]}~${priceRangeMatch[2]}`;
                    }

                    // 日志记录部分
                    const currentTime = new Date().toISOString().replace('T', ' ').split('.')[0];
                    console.log(`${currentTime} 今日油价：\n${message}\n`);
                    console.log(`${currentTime} 油价预告：\n下次油价${logDate}24点开始调整\n目前预计${adjustmentAction}油价(${priceRangeMatch[1]}元/升-${priceRangeMatch[2]}元/升)，大家相互转告油价开始${adjustmentAction === '上调' ? '涨了' : '降了'}。\n`);
                    console.log(`${currentTime} [Script Completed]`);

                    const body = {
                        title: `${params.title} | ${formattedDate} ${adjustmentSymbols} ${priceAdjustment}`, 
                        content: `${message}`,
                        provname: params.provname,
                        icon: params.icon,
                        "icon-color": params.color
                    };
                    $done(body);
                } else {
                    console.log("提取`tishiContent`失败");
                    currentIndex++;
                    testNextUrl();
                }
            }
        });
    } else {
        console.log(`请求失败，错误信息：${oilPriceData.msg}`);
        currentIndex++;
        testNextUrl();
    }
}

function getParams(param) {
    return Object.fromEntries(
        param
            .split("&")
            .map((item) => item.split("="))
            .map(([k, v]) => [k, decodeURIComponent(v)])
    );
}

testNextUrl();