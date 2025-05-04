/*
------------------------------------------
# Raycast 解锁
# 测试版本：1.0.2
# 更新日期：2025.05.04 13:33

# 登录账户后先试用订阅（选择高级版本试用，记得试用后立马取消订阅）

注意事项：
# 如果选择试用普通版 pro 订阅就只会解锁 Pro 订阅，需另行搭配通杀脚本解锁 Ai 模型订阅。如果选择试用高级版订阅（包含 Ai 模型）就会解锁高级版本订阅。
# 解锁账户订阅，如果更换账户将失去订阅。
# 该脚本仅供调试使用，请于24小时内删除，切勿传播。
------------------------------------------
[Script]
Raycast_pro = type=http-response,pattern=^https:\/\/backend\.raycast\.com\/api\/v1\/(me|ai\/models|me\/sync.*)$,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/githubdulong/Script/master/raycast_pro_patch.js

[MITM]
hostname = %APPEND% backend.raycast.com
*/

console.log("[Raycast] Script started for URL: " + $request.url);

try {
    let body = $response.body;
    if (!body) {
        console.log("[Raycast] No response body for URL: " + $request.url);
        $done({});
    } else {
        console.log("[Raycast] Original body: " + body);
        let obj = JSON.parse(body);

        let modified = false;
        function replacePeriodEnd(data) {
            if (typeof data !== "object" || data === null) return;
            for (let key in data) {
                if (key === "current_period_end") {
                    data[key] = 4102444800;
                    modified = true;
                    console.log("[Raycast] Set current_period_end to 4102444800 for key: " + key);
                } else if (typeof data[key] === "object") {
                    replacePeriodEnd(data[key]);
                }
            }
        }

        if ($request.url.includes("/api/v1/me") && !$request.url.includes("/sync")) {
            console.log("[Raycast] Processing /api/v1/me");
            if (obj.mobile_subscription && "current_period_end" in obj.mobile_subscription) {
                obj.mobile_subscription.current_period_end = 4102444800;
                modified = true;
                console.log("[Raycast] Set mobile_subscription.current_period_end to 4102444800 in /api/v1/me");
            } else {
                console.log("[Raycast] mobile_subscription or current_period_end not found in /api/v1/me");
            }
        }


        if ($request.url.includes("/api/v1/ai/models") || $request.url.includes("/api/v1/me/sync")) {
            console.log("[Raycast] Processing " + ($request.url.includes("/ai/models") ? "/api/v1/ai/models" : "/api/v1/me/sync"));
            replacePeriodEnd(obj);
            if (!modified) {
                console.log("[Raycast] No current_period_end found in " + ($request.url.includes("/ai/models") ? "/api/v1/ai/models" : "/api/v1/me/sync"));
            }
        }

        body = JSON.stringify(obj);
        console.log("[Raycast] Modified body: " + body);
        $done({ body });
    }
} catch (e) {
    console.log("[Raycast] Error: " + e.message);
    $done({ body: $response.body });
}