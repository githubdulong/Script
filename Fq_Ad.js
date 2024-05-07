/**
 * 模块链接: https://raw.githubusercontent.com/githubdulong/Script/master/Surge/FQ_AD.sgmodule
 * 更新时间：2024.05.07
 */

const body = JSON.parse($response.body);
console.log("原始资源列表:", JSON.stringify(body.resources));
const filteredResources = body.resources.filter(v => {
    const isAd = v.url.includes("/ad");
    if (isAd) {
        console.log("过滤广告资源:", v.url);
    }
    return !isAd;
});
body.resources = filteredResources;
console.log("过滤后资源列表:", JSON.stringify(filteredResources));
$done({body: JSON.stringify(body)});