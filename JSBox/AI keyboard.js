/*

AI键盘 修改自@Neurogram
	•	支持编辑工具
	•	支持附加或覆盖生成结果的提示
	•	支持自定义角色
	•	支持提示模板
	•	支持多轮对话
	•	支持显示提示的长度
	•	支持显示使用的 Token 提醒
	•	支持按压“助手”切换 Ai 模型
	•	支持连点三次切换“开喷、吐槽”模式，开喷模式支持单击或按压开启单发或连发模式

教程：点击这里查看手册 https://neurogram.notion.site/ChatGPT-Keyboard-af8f7c74bc5c47989259393c953b8017

*/

// --- AI 选填配置区 ---
const ai_configs = {
    "Grok": {
        api_keys: ["sk-3aij4Txxoo", "YOUR_GROK_API_KEY_2"], //Grok
        proxy_urls: ["https://api.milltea.com"], //代理地址
        models: ["grok-3-fast-beta", "mixtral-8x7b-32768"], //模型
        api_endpoint_template: "{proxy_url}/v1/chat/completions",
        type: "openai_compatible"
    },
    "ChatGPT": {
        api_keys: ["sk-k9KMxxoo",  "YOUR_CHATGPT_API_KEY_2"], //ChatGPT
        proxy_urls: ["https://api.openai.com﻿", "YOUR_CHATGPT_PROXY_URL"],
        models: ["gpt-4o", "gpt-3.5-turbo"],
        api_endpoint_template: "{proxy_url}/v1/chat/completions",
        type: "openai_compatible"
    },
    "DeepSeek": {
        api_keys: ["YOUR_DEEPSEEK_API_KEY_1"], //DeepSeek
        proxy_urls: ["https://api.deepseek.com"],
        models: ["deepseek-chat", "deepseek-coder"],
        api_endpoint_template: "{proxy_url}/v1/chat/completions",
        type: "openai_compatible"
    },
    "Gemini": {
        api_keys: ["YOUR_GEMINI_API_KEY_1"], //Gemini
        proxy_urls: ["https://generativelanguage.googleapis.com"],
        models: ["gemini-1.5-pro-latest", "gemini-pro"],
        api_endpoint_template: "{proxy_url}/v1beta/models/{model}:generateContent?key={api_key}",
        type: "gemini"
    }
};
// --- UI 布局配置区 ---
const user_gesture = {
    tap: 1,
    long_press: 0
}
const usage_toast = true // 显示使用量
const keyboard_sound = true // 是否开启键盘声音
const keyboard_vibrate = 0 // -1: 无振动, 0~2: 振动强度
const edit_tool_columns = 5 // 编辑工具默认列数
const chatgpt_role_columns = 3 // ChatGPT 角色默认列数
const keyboard_spacing = 6 // 按键间隔
const keyboard_height = 41 // 按键高度
const keyboard_total_height = 265 //键盘总高度 0为系统默认
$keyboard.barHidden = true //是否隐藏JSBox 键盘底部工具栏
const heartbeat = 1 // -1:  无回复等待反馈, 0~2: 心跳强度
const heartbeat_interval = 1.2 //  心跳间隔（秒）

// --- 其他配置，不懂勿动 ---

const role_data = {
    "助手": ["", "你是一个热心且乐于助人的Ai助手，提供帮助和建议。", ""],
    "续写": ["", "用相同语言继续创作或完成内容。"],
    "译为中文": ["将所给内容翻译成中文。", ""],
    "总结": ["", "用相同语言总结内容，提炼出关键信息。"],
    "润色": ["", "用相同语言对内容进行润色或优化。"],
    "译为英文": ["将所给内容翻译成美式英语。", ""],
    "扩展": ["", "你是一名高级网络工程师兼自动化脚本专家，精通 Surge、JSBox、JavaScript 和 API 调用，且具有极强的逻辑分析与优化能力。请从专业技术视角出发，基于以下内容，进行详细推演、拓展、优化或修复建议，以利于高效实现目标功能：\n\n{USER_CONTENT}"],
    "吐槽": ["", "使用相同语言启动强烈的怼人模式，进行尖锐的反击讽刺与吐槽。"],
    "译为日文": ["将所给内容翻译成日语。", ""]
}
const edit_tool = {
    "Start": "arrow.left.to.line",
    "Left": "arrow.left",
    "Right": "arrow.right",
    "End": "arrow.right.to.line",
    "Return": "return",
    "Copy": "doc.on.doc",
    "Paste": "doc.on.clipboard",
    "Cut": "scissors",
    "Empty": "trash",
    "Dismiss": "keyboard.chevron.compact.down"
}
const PREF_CURRENT_AI_SERVICE = "current_ai_service_name_v3";
const PREF_AI_CONFIG_INDICES = "current_ai_config_indices_v1";

let current_ai_service_name = $cache.get(PREF_CURRENT_AI_SERVICE) || Object.keys(ai_configs)[0];
if (!ai_configs[current_ai_service_name]) {
    current_ai_service_name = Object.keys(ai_configs)[0];
}

let current_config_indices = $cache.get(PREF_AI_CONFIG_INDICES) || {};
Object.keys(ai_configs).forEach(serviceName => {
    if (!current_config_indices[serviceName]) {
        current_config_indices[serviceName] = { key_idx: 0, proxy_idx: 0, model_idx: 0 };
    }
});


function getCurrentAiConfig() {
    const service_config = ai_configs[current_ai_service_name];
    const indices = current_config_indices[current_ai_service_name];

    if (!service_config) {
        $ui.error(`AI 服务 "${current_ai_service_name}" 未配置.`);
        current_ai_service_name = Object.keys(ai_configs)[0];
        $cache.set(PREF_CURRENT_AI_SERVICE, current_ai_service_name);
        if (!current_config_indices[current_ai_service_name]) {
             current_config_indices[current_ai_service_name] = { key_idx: 0, proxy_idx: 0, model_idx: 0 };
             $cache.set(PREF_AI_CONFIG_INDICES, current_config_indices);
        }
        return getCurrentAiConfig();
    }

    const api_key = service_config.api_keys[indices.key_idx % service_config.api_keys.length];
    const proxy_url_base = service_config.proxy_urls[indices.proxy_idx % service_config.proxy_urls.length];
    const model = service_config.models[indices.model_idx % service_config.models.length];

    let api_url = service_config.api_endpoint_template
        .replace("{proxy_url}", proxy_url_base)
        .replace("{model}", model);

    if (service_config.type === "gemini") {
        api_url = api_url.replace("{api_key}", api_key);
    }

    return {
        name: current_ai_service_name,
        api_key: api_key,
        model: model,
        api_url: api_url,
        type: service_config.type,
        raw_proxy_url: proxy_url_base
    };
}

const edit_tool_amount = Object.keys(edit_tool).length
let dialogue = $cache.get("dialogue")
let multi_turn = false
if (dialogue) multi_turn = dialogue.mode
$app.theme = "auto"
let generating = false
let timer = ""
let generating_icon = 0
let trollTimer = null
let sprayButtonTapCount = 0

const spray_mode_cache_key = "chatgpt_keyboard_spray_mode_v1";
let sprayButtonMode = $cache.get(spray_mode_cache_key) || "吐槽";

let lastSprayButtonTapTime = 0
const tripleTapInterval = 500

const firstRoleName = Object.keys(role_data)[0];


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const view = {
    props: {
        title: "AI keyboard",
        navBarHidden: $app.env == $env.keyboard,
        pageSheet: $app.env == $env.keyboard,
    },
    views: [{
        type: "matrix",
        props: {
            spacing: keyboard_spacing,
            bgcolor: $color("clear"),
            data: dataPush(Object.keys(edit_tool).concat(Object.keys(role_data))),
            template: {
                props: {},
                views: [{
                    type: "button",
                    props: {
                        id: "button",
                        radius: 10,
                        titleColor: $color("black", "white"),
                        tintColor: $color("black", "white"),
                        font: $font(14)
                    },
                    layout: $layout.fill,
                    events: {
                        tapped: function (sender, indexPath, data) {
                            if (trollTimer) {
                                clearInterval(trollTimer);
                                trollTimer = null;
                            }

                            const originalButtonTitle = sender.title;

                            if (originalButtonTitle === "开喷" || originalButtonTitle === "吐槽") {
                                const currentTime = Date.now();
                                let isTripleTapSuccess = false;

                                if (currentTime - lastSprayButtonTapTime < tripleTapInterval) {
                                    sprayButtonTapCount++;
                                    if (sprayButtonTapCount === 3) {
                                        isTripleTapSuccess = true;
                                        sprayButtonMode = (sprayButtonMode === "开喷") ? "吐槽" : "开喷";
                                        sender.title = sprayButtonMode;
                                        sender.bgcolor = (sprayButtonMode === "开喷") ? $color("#FFF0F0", "#806B6B") : $color("#FFFFFF", "#6B6B6B");
                                        $ui.toast(`已切换至“${sprayButtonMode}”模式`);
                                        $cache.set(spray_mode_cache_key, sprayButtonMode);
                                        sprayButtonTapCount = 0;
                                        lastSprayButtonTapTime = 0;
                                        return;
                                    }
                                } else {
                                    sprayButtonTapCount = 1;
                                }
                                lastSprayButtonTapTime = currentTime;

                                if (!isTripleTapSuccess) {
                                    $delay(tripleTapInterval + 100, () => {
                                        if (Date.now() - lastSprayButtonTapTime >= tripleTapInterval && sprayButtonTapCount > 0 && sprayButtonTapCount < 3) {
                                            sprayButtonTapCount = 0;
                                        }
                                    });
                                }

                                if (originalButtonTitle === "开喷") {
                                    if (keyboard_sound) $keyboard.playInputClick();
                                    if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                    fetchTextAndSend();
                                } else if (originalButtonTitle === "吐槽") {
                                    handler(sender, "tap");
                                }
                            } else {
                                sprayButtonTapCount = 0;
                                handler(sender, "tap");
                            }
                        },
                        longPressed: function (info, indexPath, data) {
                            if (trollTimer) {
                                clearInterval(trollTimer);
                                trollTimer = null;
                            }
                            const buttonTitle = info.sender.title;
                            const isMainAssistantButton = (buttonTitle === firstRoleName && !info.sender.info.action);

                            if (isMainAssistantButton) {
                                const availableAIs = Object.keys(ai_configs);
                                $ui.menu({
                                    items: availableAIs.map(aiName => `${aiName}${aiName === current_ai_service_name ? " \u23CE" : ""}`),
                                    handler: function(title, idx) {
                                        const selectedAiName = availableAIs[idx];
                                        if (selectedAiName !== current_ai_service_name) {
                                            current_ai_service_name = selectedAiName;
                                            $cache.set(PREF_CURRENT_AI_SERVICE, current_ai_service_name);
                                            if (!current_config_indices[current_ai_service_name]) {
                                                current_config_indices[current_ai_service_name] = { key_idx: 0, proxy_idx: 0, model_idx: 0 };
                                                $cache.set(PREF_AI_CONFIG_INDICES, current_config_indices);
                                            }
                                            $ui.toast(`已切换到 ${current_ai_service_name}`);
                                            updateFooterTitle();
                                        }
                                    }
                                });
                                return;
                            }

                            if (buttonTitle === "开喷" && sprayButtonMode === "开喷") {
                                if (keyboard_sound) $keyboard.playInputClick();
                                if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                if (trollTimer) {
                                    clearInterval(trollTimer);
                                    trollTimer = null;
                                }
                                trollTimer = setInterval(() => {
                                    fetchTextAndSend();
                                }, 1000);
                                $ui.toast("长按连续开喷中，再次点击停止");
                            } else {
                                handler(info.sender, "long_press");
                            }
                        }
                    }
                }]
            },
            footer: {
                type: "button",
                props: {
                    id: "footer",
                    height: 20,
                    title: `JSBox'Ai (${current_ai_service_name})`,
                    titleColor: $color("#AAAAAA"),
                    bgcolor: $color("clear"),
                    symbol: multi_turn ? "bubble.left.and.bubble.right" : "bubble.left",
                    tintColor: $color("#AAAAAA"),
                    align: $align.center,
                    font: $font(10)
                },
                events: {
                    tapped: async (sender) => {
                        if (trollTimer) {
                            clearInterval(trollTimer);
                            trollTimer = null;
                        }
                        const popover = $ui.popover({
                            sourceView: sender,
                            sourceRect: sender.bounds,
                            directions: $popoverDirection.any,
                            size: $size(320, 200),
                            views: [
                                {
                                    type: "scroll",
                                    layout: function (make, view) {
                                        make.edges.insets($insets(10, 10, 10, 10))
                                    },
                                    views: [{
                                        type: "label",
                                        props: {
                                            text: await get_content(1),
                                            font: $font(15),
                                            lines: 0
                                        },
                                        layout: function (make, view) {
                                            make.width.equalTo(300)
                                        },
                                        events: {
                                            tapped: () => {
                                                popover.dismiss()
                                            }
                                        }
                                    }]
                                }
                            ]
                        })
                    },
                    longPressed: function (info) {
                        if (trollTimer) {
                            clearInterval(trollTimer);
                            trollTimer = null;
                        }
                        multi_turn = multi_turn ? false : true
                        set_bubble()
                        $ui.toast("对话模式" + (multi_turn ? " 开" : " 关"))
                        $cache.set("dialogue", { mode: multi_turn })
                    }
                }
            }
        },
        layout: $layout.fill,
        events: {
            itemSize: function (sender, indexPath) {
                let keyboard_columns = indexPath.item < edit_tool_amount ? edit_tool_columns : chatgpt_role_columns
                return $size(($device.info.screen.width - (keyboard_columns + 1) * keyboard_spacing) / keyboard_columns, keyboard_height);
            }
        }
    }],
    layout: (make, view) => {
        make.width.equalTo(view.super)
        if (keyboard_total_height){
            make.height.equalTo(keyboard_total_height)
        } else {
            make.height.equalTo(view.super)
        }
    }
}

function dataPush(data) {
    let key_title = [];
    for (let i = 0; i < data.length; i++) {
        const configName = data[i];
        let displayTitle = configName;
        let displayBgColor = $color("#FFFFFF", "#6B6B6B");

        if (i < edit_tool_amount) {
            displayTitle = "";
        } else {
            if (configName === "吐槽") {
                displayTitle = sprayButtonMode;
                if (sprayButtonMode === "开喷") {
                    displayBgColor = $color("#FFF0F0", "#806B6B");
                } else {
                    displayBgColor = $color("#FFFFFF", "#6B6B6B");
                }
            } else if (configName === "开喷") {
                displayBgColor = $color("#FFF0F0", "#806B6B");
            }
        }

        key_title.push({
            button: {
                title: displayTitle,
                symbol: i < edit_tool_amount ? edit_tool[configName] : "",
                info: { action: i < edit_tool_amount ? configName : "" },
                bgcolor: displayBgColor
            }
        });
    }
    return key_title;
}

function handler(sender, gesture) {
    if (keyboard_sound) $keyboard.playInputClick()
    if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate)
    if ($app.env != $env.keyboard) return $ui.warning("请在键盘内运行")
    if (sender.info.action) return edit(sender.info.action, gesture)
    gpt(sender.title, gesture)
}

async function edit(action, gesture) {
    let before = $keyboard.textBeforeInput ? $keyboard.textBeforeInput.length : 0
    let after = $keyboard.textAfterInput ? $keyboard.textAfterInput.length : 0

    if (action == "Start") return $keyboard.moveCursor(-before)
    if (action == "Left") return $keyboard.moveCursor(-1)
    if (action == "Right") return $keyboard.moveCursor(1)
    if (action == "End") return $keyboard.moveCursor(after)
    if (action == "Return") return $keyboard.insert("\n")
    if (action == "Paste") return $keyboard.insert($clipboard.text || "")
    if (action == "Dismiss") return gesture == "tap" ? $app.close() : $keyboard.dismiss()
    if (action == "Empty" && gesture == "tap") return $keyboard.delete()

    let content = await get_content(0)
    if (action != "Empty") $clipboard.text = content

    if (action == "Copy") return $ui.success("完成")

    if (action == "Cut" || action == "Empty") {
        if (!$keyboard.selectedText) {
            $keyboard.moveCursor(after)
            delete_content(content.length)
        }
        if ($keyboard.selectedText) $keyboard.delete()
    }
}

async function gpt(role, gesture) {
    if (generating) return $ui.warning("正在生成中");

    if (role === "开喷" && sprayButtonMode === "开喷") {
        return;
    }

    let user_content = await get_content(0);
    if (!user_content && !multi_turn) return $ui.warning("未找到提示");
    generating = true;

    let messages = [];
    const systemMarker = "⚙️ 系统:\n";
    const userMarker = "👨‍💻 用户:\n";
    const assistantMarker = "🤖 助手:\n";
    const endMarker = "🔚";

    if (multi_turn) {
        let currentFullText = user_content.trim();

        const sysPromptRegexText = `^\\s*${escapeRegExp(systemMarker)}([^${escapeRegExp(endMarker)}]*)(${escapeRegExp(endMarker)})?`;
        const sysPromptRegex = new RegExp(sysPromptRegexText, "m");

        const sysMatch = currentFullText.match(sysPromptRegex);
        let systemContentProvided = false;

        if (sysMatch) {
            const systemPromptText = sysMatch[1] ? sysMatch[1].trim() : "";
            if (systemPromptText && systemPromptText !== "-") {
                messages.push({ role: "system", content: systemPromptText });
            }
            systemContentProvided = true;
            currentFullText = currentFullText.substring(sysMatch[0].length).trim();
        }

        const turnRegexText = `(?:${escapeRegExp(userMarker)}|${escapeRegExp(assistantMarker)})([^${escapeRegExp(endMarker)}]*)(${escapeRegExp(endMarker)})`;
        const turnRegex = new RegExp(turnRegexText, "g");
        let match;
        let lastTurnEndIndex = 0;
        let tempTextForTurns = currentFullText;

        while ((match = turnRegex.exec(tempTextForTurns)) !== null) {
            const markerText = match[0].startsWith(userMarker) ? userMarker : assistantMarker;
            const content = match[1] ? match[1].trim() : "";
            if (content) {
                messages.push({ role: markerText === userMarker ? "user" : "assistant", content });
            }
            lastTurnEndIndex = match.index + match[0].length;
        }

        let currentUserNewInput = tempTextForTurns.substring(lastTurnEndIndex).trim();
        if (currentUserNewInput.startsWith(userMarker)) {
            currentUserNewInput = currentUserNewInput.substring(userMarker.length).trim();
        } else if (currentUserNewInput.startsWith(assistantMarker)) {
            currentUserNewInput = "";
        }


        if (!systemContentProvided && messages.length === 0 && currentUserNewInput) {
            messages.push({ role: "user", content: currentUserNewInput });
            $keyboard.delete();
            $keyboard.insert(`\n${systemMarker}-${endMarker}\n\n${userMarker}${currentUserNewInput}`);
        } else if (currentUserNewInput) {
            messages.push({ role: "user", content: currentUserNewInput });
        }

        const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
        const hasUserMessageWithContent = messages.some(m => m.role === "user" && m.content && m.content.trim() !== "");

        if (!hasUserMessageWithContent || (lastMsg && lastMsg.role !== "user") || (lastMsg && !lastMsg.content)) {
            if (messages.length === 0 && systemContentProvided && !currentUserNewInput) {
                // 允许用户在系统提示后输入
            } else {
                $ui.warning("请输入对话内容");
                generating = false;
                return;
            }
        }
    } else {

        if (!user_gesture[gesture]) {
            $keyboard.moveCursor(1);
            $keyboard.insert("\n");
        }
        if (user_gesture[gesture] && !$keyboard.selectedText) delete_content(user_content.length);

        if (role_data[role] && role_data[role][0]) {
            messages.push({ "role": "system", "content": role_data[role][0] });
        }
        let preset_prompt = role_data[role] ? role_data[role][1] : "";
        if (preset_prompt && !preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt + "\n" + user_content;
        if (preset_prompt && preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt.replace(/{USER_CONTENT}/g, user_content);
        messages.push({ "role": "user", "content": user_content });
    }

    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system' && (!messages[0].content || messages[0].content.trim()==='-'))) {
        $ui.warning("请输入有效的用户指令。");
        generating = false;
        return;
    }

    if (heartbeat != -1) {
        timer = $timer.schedule({
            interval: heartbeat_interval,
            handler: async () => {
                $device.taptic(heartbeat);
                if($("footer")) $("footer").symbol = "ellipsis.bubble.fill";
                await $wait(0.2);
                $device.taptic(heartbeat);
                if($("footer")) $("footer").symbol = "ellipsis.bubble";
            }
        });
    } else {
        timer = $timer.schedule({
            interval: heartbeat_interval / 2,
            handler: async () => {
                generating_icon = generating_icon ? 0 : 1;
                if($("footer")) $("footer").symbol = generating_icon ? "ellipsis.bubble.fill" : "ellipsis.bubble";
            }
        });
    }

    const current_ai = getCurrentAiConfig();
    let request_body;
    let request_headers = { "Content-Type": "application/json" };

    if (current_ai.type === "openai_compatible") {
        request_headers["Authorization"] = `Bearer ${current_ai.api_key}`;
        request_body = {
            "model": current_ai.model,
            "messages": messages.filter(m => m.content && m.content.trim() !== "")
        };
    } else if (current_ai.type === "gemini") {
        let gemini_messages = [];
        let system_instruction_gemini = null;
        for (const msg of messages) {
            if (!msg.content || msg.content.trim() === "") continue;

            if (msg.role === "system") {
                if (!system_instruction_gemini) {
                    system_instruction_gemini = { parts: [{ text: msg.content }] };
                } else {
                    system_instruction_gemini.parts[0].text += "\n" + msg.content;
                }
                continue;
            }
            gemini_messages.push({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }]
            });
        }
        request_body = { "contents": gemini_messages };
        if (system_instruction_gemini) {
            request_body.systemInstruction = system_instruction_gemini;
        }
        if (gemini_messages.length === 0) {
            $ui.warning("Gemini 需要有效的用户输入。");
            generating = false;
            if(timer) timer.invalidate();
            set_bubble();
            return;
        }
    } else {
        $ui.error(`不支持的 AI 类型: ${current_ai.type}`);
        generating = false;
        if(timer) timer.invalidate();
        set_bubble();
        return;
    }

    let response;
    try {
        response = await $http.post({
            url: current_ai.api_url,
            header: request_headers,
            body: request_body
        });
    } catch (err) {
        console.error("API Request Error:", err);
        $ui.error(`请求失败: ${err.message || '未知网络错误'}`);
        if(timer) timer.invalidate();
        set_bubble();
        generating = false;
        generating_icon = 0;
        return;
    }

    if(timer) timer.invalidate();
    set_bubble();
    generating = false;
    generating_icon = 0;

    let response_text = "";
    let error_message = "";

    if (response.data) {
        if (current_ai.type === "openai_compatible") {
            if (response.data.error) error_message = response.data.error.message;
            else if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
                response_text = response.data.choices[0].message.content;
            } else error_message = "OpenAI 兼容 API 返回结构无效";

            if (!error_message && usage_toast && response.data.usage) {
                let usage = response.data.usage;
                $ui.toast(`${current_ai.name} 用量: P${usage.prompt_tokens} + C${usage.completion_tokens} = T${usage.total_tokens}`);
            } else if (!error_message && usage_toast) {
                 $ui.toast(`${current_ai.name} 完成`);
            }
        } else if (current_ai.type === "gemini") {
            if (response.data.error) error_message = `Gemini API 错误: ${response.data.error.message}`;
            else if (response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content && response.data.candidates[0].content.parts && response.data.candidates[0].content.parts[0]) {
                response_text = response.data.candidates[0].content.parts[0].text;
            } else if (response.data.promptFeedback && response.data.promptFeedback.blockReason) {
                 error_message = `内容被 Gemini 阻止: ${response.data.promptFeedback.blockReason}`;
            } else {
                console.error("Gemini API 返回无效结构:", JSON.stringify(response.data));
                error_message = "Gemini API 返回无效结构";
            }
            if (!error_message && usage_toast) {
                $ui.toast(`${current_ai.name} 完成`);
            }
        }
    } else if (response.error) {
        error_message = `请求错误: ${response.error.localizedDescription || "未知错误"}`;
    } else {
        error_message = "请求失败，未收到有效数据。";
    }

    if (error_message) {
        $ui.error(error_message);
        return;
    }

    if (!multi_turn) {
        $keyboard.insert(response_text);
    } else {

        const textToInsert = `\n${assistantMarker}${response_text.trim()}${endMarker}\n\n${userMarker}`;
        $keyboard.insert(textToInsert);
    }
}

async function get_content(length) {
    let content = $keyboard.selectedText || await $keyboard.getAllText()
    if (length) content = `长度: ${content.replace(/(⚙️ 系统|👨‍💻 用户|🤖 助手):\n|🔚/g, "").replace(/\n+/g, "\n").length}\n\n${content}`
    return content
}

function delete_content(times) {
    for (let i = 0; i < times; i++) {
        $keyboard.delete()
    }
}

function set_bubble() {
    const footer = $("footer");
    if (footer) {
        footer.symbol = multi_turn ? "bubble.left.and.bubble.right" : "bubble.left"
    }
}

function updateFooterTitle() {
    const footer = $("footer");
    if (footer) {
        footer.title = `JSBox'Ai (${current_ai_service_name})`;
    }
}

async function fetchTextAndSend() {
    $http.get({
        url: "https://yyapi.a1aa.cn/api.php?level=max", //开喷接口
        handler: async function(resp) {
            if (resp.error) {
                $ui.error("获取文本失败: " + resp.error.message);
                if (timer) timer.invalidate();
                set_bubble();
                generating = false;
                generating_icon = 0;
                return;
            }
            var text = resp.data;
            $keyboard.insert(text);
            $keyboard.send();
            if (heartbeat != -1) {
                $device.taptic(heartbeat);
            }
            const footer = $("footer");
            if (footer) {
                footer.symbol = "paperplane.fill";
                await $wait(0.5);
            }
            set_bubble();
        }
    });
}

function initializeKeyboard() {
    if ($app.env === $env.keyboard) {
        $ui.render({ props: { navBarHidden: true } });
        $delay(0, () => {
            $ui.controller.view = $ui.create(view);
            $ui.controller.view.layout(view.layout);
        });
    } else {
        $ui.render(view);
    }
}

initializeKeyboard();
