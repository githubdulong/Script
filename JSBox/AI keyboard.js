/*

AI键盘 修改自@Neurogram
	•	支持编辑工具
	•	支持附加或覆盖生成结果的提示
	•	支持自定义角色
	•	支持提示模板
	•	支持多轮对话
	•	支持显示提示的长度
	•	支持显示使用的 Token 提醒
	•	支持按压"助手"切换 Ai 模型
	•	支持按压"翻译文本"切换目标语言
	•	支持长按任意普通健代替 Ai 回复加发送（对话模式除外）
	•	支持连点三次切换"开喷、吐槽"模式，开喷模式支持单击或按压开启单发或连发模式（判断连按间隔0.3s）

教程：点击这里查看手册 https://neurogram.notion.site/ChatGPT-Keyboard-af8f7c74bc5c47989259393c953b8017

*/

// --- AI 选填配置区 ---

const ai_configs = {
    "Grok": {
        api_keys: ["YOUR_GROK_API_KEY_1", "YOUR_GROK_API_KEY_2"],// Grok Token
        proxy_urls: ["https://api.milltea.com"],// 代理地址
        models: ["grok-3-fast-beta", "mixtral-8x7b-32768"],// 模型
        api_endpoint_template: "{proxy_url}/v1/chat/completions",
        type: "openai_compatible"
    },
    "ChatGPT": {
        api_keys: ["YOUR_CHATGPT_API_KEY_1",  "YOUR_CHATGPT_API_KEY_2"],// ChatGPT
        proxy_urls: ["https://api.openai.com", "YOUR_CHATGPT_PROXY_URL"],
        models: ["gpt-4o", "gpt-3.5-turbo"],
        api_endpoint_template: "{proxy_url}/v1/chat/completions",
        type: "openai_compatible"
    },
    "DeepSeek": {
        api_keys: ["YOUR_DEEPSEEK_API_KEY_1"],// DeepSeek
        proxy_urls: ["https://api.deepseek.com"],
        models: ["deepseek-chat", "deepseek-coder"],
        api_endpoint_template: "{proxy_url}/v1/chat/completions",
        type: "openai_compatible"
    },
    "Gemini": {
        api_keys: ["YOUR_GEMINI_API_KEY_1"],// Gemini
        proxy_urls: ["https://generativelanguage.googleapis.com"],
        models: ["gemini-1.5-pro-latest", "gemini-pro"],
        api_endpoint_template: "{proxy_url}/v1beta/models/{model}:generateContent?key={api_key}",
        type: "gemini"
    }
};

// --- UI 布局配置区 ---

const usage_toast = true // 是否开启使用量显示
const keyboard_sound = true // 是否开启键盘声音
const keyboard_vibrate = 0 // -1:无振动, 0~2: 振动强度
const edit_tool_columns = 5 // 编辑工具默认列数
const chatgpt_role_columns = 3 // Ai角色默认列数
$keyboard.barHidden = true // 是否隐藏JSBox键盘底部工具栏
const heartbeat = 1 // -1: 无回复等待反馈, 0~2: 心跳强度
const heartbeat_interval = 1.2 // 心跳间隔（秒）

// --- 其他配置 不懂勿动 ---

function getAdaptiveLayoutParams() {
    const screenWidthPt = $device.info.screen.width;
    const minScreenWidth = 320; 
    const maxScreenWidth = 450;

    function interpolateValue(currentWidth, minWidth, maxWidth, minValue, maxValue) {
        if (currentWidth <= minWidth) return minValue;
        if (currentWidth >= maxWidth) return maxValue;
        const ratio = (currentWidth - minWidth) / (maxWidth - minWidth);
        return minValue + ratio * (maxValue - minValue);
    }

    let spacing = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 4, 7); 
    
    let buttonFontSize = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 12, 15); 
    
    let footerFontSize = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 9, 12);
    let footerHeight = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 18, 24);
    
    let totalHeight = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 220, 295);

    spacing = Math.round(spacing);
    buttonFontSize = Math.round(buttonFontSize);
    footerFontSize = Math.round(footerFontSize);
    footerHeight = Math.round(footerHeight);
    totalHeight = Math.round(totalHeight); 

    const numKeyRows = 5; 
    
    let keyHeight = (totalHeight - footerHeight - (numKeyRows + 1) * spacing) / numKeyRows;
    keyHeight = Math.round(keyHeight);

    if (keyHeight <= 0) { 
        keyHeight = Math.max(buttonFontSize + 10, 35); 
    }

    return {
        spacing: spacing,
        keyHeight: keyHeight,
        totalHeight: totalHeight,
        buttonFontSize: buttonFontSize, 
        footerFontSize: footerFontSize,
        footerHeight: footerHeight
    };
}

const adaptiveParams = getAdaptiveLayoutParams();

const user_gesture = {
    tap: 1,
    long_press: 0
}

const role_data = {
    "助手": ["", "你是一个热心且乐于助人的Ai助手，提供帮助和建议。", ""],
    "续写": ["", "用相同语言继续创作或完成内容。"],
    "翻译文本": ["将所给内容翻译成指定语言。", ""],
    "总结": ["", "用相同语言总结内容，提炼出关键信息。"],
    "润色": ["", "用相同语言对内容进行润色或优化。"],
    "百度搜索": ["", ""],
    "扩展": ["", "你是一名高级网络工程师兼自动化脚本专家，精通 Surge、JSBox、JavaScript 和 API 调用，且具有极强的逻辑分析与优化能力。请从专业技术视角出发，基于以下内容，进行详细推演、拓展、优化或修复建议，以利于高效实现目标功能：\n\n{USER_CONTENT}"],
    "吐槽": ["", "使用相同语言启动强烈的怼人模式，进行尖锐的反击讽刺与吐槽。"],
    "谷歌搜索": ["", ""]
};

const translateTargets = {
    "en": { name: "英语", prompt: "Translate the following text to English (American English preferably, if not specified otherwise)." },
    "zh-Hans": { name: "中文", prompt: "将以下文本翻译成中文（简体）。" },
    "ja": { name: "日语", prompt: "将以下文本翻译成日语。" },
    "th": { name: "泰语", prompt: "将以下文本翻译成泰语。" },
    "hxw": { name: "火星文", prompt: "将以下文本转换成火星文风格，请使用网络上流行的、非主流的、有趣的字符或表达方式。" }
};
const PREF_TRANSLATE_TARGET_KEY = "current_translate_target_key_v4";
let currentSelectedTranslateTargetKey = $cache.get(PREF_TRANSLATE_TARGET_KEY) || "zh-Hans";

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
let sprayActionTimeoutId = null; 
const sprayActionDelay = 300;   


const firstRoleName = Object.keys(role_data)[0];

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function get_content_for_new_buttons() {
    let inputText = await get_content(0); 
    let trimmedInputText = (inputText || "").trim();

    if (trimmedInputText) {
        return trimmedInputText;
    }

    let clipboardText = ($clipboard.text || "").trim();
    if (clipboardText) {
        return clipboardText;
    }
    return "";
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
            spacing: adaptiveParams.spacing,
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
                        font: $font(adaptiveParams.buttonFontSize)
                    },
                    layout: $layout.fill,
                    events: {
                        tapped: async function (sender, indexPath, data) {
                            if (trollTimer) {
                                clearInterval(trollTimer);
                                trollTimer = null;
                            }

                            const buttonOriginalKey = sender.info.originalKey;

                            if (buttonOriginalKey === "吐槽") { 
                                const currentTime = Date.now();

                                if (sprayActionTimeoutId) {
                                    clearTimeout(sprayActionTimeoutId);
                                    sprayActionTimeoutId = null;
                                }

                                if (currentTime - lastSprayButtonTapTime < tripleTapInterval) {
                                    sprayButtonTapCount++;
                                } else {
                                    sprayButtonTapCount = 1;
                                }
                                lastSprayButtonTapTime = currentTime;

                                if (sprayButtonTapCount >= 3) { 
                                    sprayButtonMode = (sprayButtonMode === "开喷") ? "吐槽" : "开喷";
                                    sender.title = sprayButtonMode; 
                                    sender.bgcolor = (sprayButtonMode === "开喷") ? $color("#FFF0F0", "#806B6B") : $color("#FFFFFF", "#6B6B6B");
                                    
                                    $ui.toast(`已切换至"${sprayButtonMode}"模式`);
                                    $cache.set(spray_mode_cache_key, sprayButtonMode);

                                    sprayButtonTapCount = 0; 
                                    lastSprayButtonTapTime = 0; 

                                    if (keyboard_sound) $keyboard.playInputClick();
                                    if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                    return; 
                                }

                                if (sprayButtonTapCount === 1) {
                                    const modeWhenClicked = sprayButtonMode; 
                                    sprayActionTimeoutId = setTimeout(() => {
                                        if (sprayButtonMode === modeWhenClicked && sprayButtonTapCount === 1) {
                                            if (modeWhenClicked === "开喷") {
                                                if (keyboard_sound) $keyboard.playInputClick();
                                                if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                                fetchTextAndSend(); 
                                            } else { 
                                                if (keyboard_sound) $keyboard.playInputClick();
                                                if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                                handler(sender, "tap"); 
                                            }
                                            sprayButtonTapCount = 0; 
                                            lastSprayButtonTapTime = 0;
                                        }
                                        sprayActionTimeoutId = null; 
                                    }, sprayActionDelay);
                                }
                            } else if (buttonOriginalKey === "百度搜索") {
                                sprayButtonTapCount = 0; lastSprayButtonTapTime = 0; if (sprayActionTimeoutId) { clearTimeout(sprayActionTimeoutId); sprayActionTimeoutId = null; }
                                if (keyboard_sound) $keyboard.playInputClick();
                                if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                await performSearch("baidu");
                            } else if (buttonOriginalKey === "谷歌搜索") {
                                sprayButtonTapCount = 0; lastSprayButtonTapTime = 0; if (sprayActionTimeoutId) { clearTimeout(sprayActionTimeoutId); sprayActionTimeoutId = null; }
                                if (keyboard_sound) $keyboard.playInputClick();
                                if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                await performSearch("google");
                            } else { 
                                sprayButtonTapCount = 0;
                                lastSprayButtonTapTime = 0;
                                if (sprayActionTimeoutId) {
                                    clearTimeout(sprayActionTimeoutId);
                                    sprayActionTimeoutId = null;
                                }
                                handler(sender, "tap");
                            }
                        },
                        longPressed: function (info, indexPath, data) {
                            if (trollTimer) {
                                clearInterval(trollTimer);
                                trollTimer = null;
                            }
                            if (sprayActionTimeoutId) {
                                clearTimeout(sprayActionTimeoutId);
                                sprayActionTimeoutId = null;
                            }
                            sprayButtonTapCount = 0;
                            lastSprayButtonTapTime = 0;
                            
                            const buttonOriginalKey = info.sender.info.originalKey;
                            const isMainAssistantButton = (buttonOriginalKey === firstRoleName && !info.sender.info.action); 

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

                            if (buttonOriginalKey === "翻译文本") {
                                const menuItems = Object.keys(translateTargets).map(key => {
                                    return translateTargets[key].name + (key === currentSelectedTranslateTargetKey ? " \u23CE" : "");
                                });
                                $ui.menu({
                                    items: menuItems,
                                    handler: function(selectedName, idx) {
                                        const selectedKey = Object.keys(translateTargets)[idx];
                                        if (selectedKey !== currentSelectedTranslateTargetKey) {
                                            currentSelectedTranslateTargetKey = selectedKey;
                                            $cache.set(PREF_TRANSLATE_TARGET_KEY, currentSelectedTranslateTargetKey);
                                            $ui.toast(`翻译目标已设为: ${translateTargets[selectedKey].name}`);
                                        }
                                    }
                                });
                                return;
                            }
                            
                            if (buttonOriginalKey === "吐槽" && sprayButtonMode === "开喷") {
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
                    height: adaptiveParams.footerHeight,
                    title: `JSBox'Ai (${current_ai_service_name})`,
                    titleColor: $color("#AAAAAA"),
                    bgcolor: $color("clear"),
                    symbol: multi_turn ? "bubble.left.and.bubble.right" : "bubble.left",
                    tintColor: $color("#AAAAAA"),
                    align: $align.center,
                    font: $font(adaptiveParams.footerFontSize)
                },
                events: {
                    tapped: async (sender) => {
                        if (trollTimer) { clearInterval(trollTimer); trollTimer = null; }
                        if (sprayActionTimeoutId) { clearTimeout(sprayActionTimeoutId); sprayActionTimeoutId = null; }
                        sprayButtonTapCount = 0; lastSprayButtonTapTime = 0;
                        
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
                        if (trollTimer) { clearInterval(trollTimer); trollTimer = null; }
                        if (sprayActionTimeoutId) { clearTimeout(sprayActionTimeoutId); sprayActionTimeoutId = null; }
                        sprayButtonTapCount = 0; lastSprayButtonTapTime = 0;

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
                const availableWidth = sender.frame.width > 0 ? sender.frame.width : $device.info.screen.width;
                let keyboard_columns = indexPath.item < edit_tool_amount ? edit_tool_columns : chatgpt_role_columns;
                let item_width;
                if (keyboard_columns === chatgpt_role_columns) { 
                    item_width = Math.floor((availableWidth - (keyboard_columns + 1) * adaptiveParams.spacing - 1) / keyboard_columns); 
                } else { 
                    item_width = (availableWidth - (keyboard_columns + 1) * adaptiveParams.spacing) / keyboard_columns;
                }
                return $size(item_width, adaptiveParams.keyHeight);
            }
            
        }
    }],
    layout: (make, view) => {
        make.width.equalTo(view.super)
        if (adaptiveParams.totalHeight && adaptiveParams.totalHeight > 0){
            make.height.equalTo(adaptiveParams.totalHeight)
        } else {
            if ($app.env === $env.keyboard && $keyboard.height > 0) {
                make.height.equalTo($keyboard.height)
            } else {
                 make.height.equalTo(view.super)
            }
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
            }
        }

        key_title.push({
            button: {
                title: displayTitle,
                symbol: i < edit_tool_amount ? edit_tool[configName] : "",
                info: { action: i < edit_tool_amount ? configName : "" , originalKey: configName },
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
    gpt(sender.info.originalKey || sender.title, gesture) 
}

async function performSearch(engine) {
    if (generating) return $ui.warning("请等待当前任务完成");
    let query = await get_content_for_new_buttons(); 

    if (!query || query.trim() === "") {
        return $ui.warning("请输入或粘贴搜索内容");
    }
    generating = true;
    let searchUrl = "";
    const encodedQuery = encodeURIComponent(query);

    if (engine === "baidu") {
        searchUrl = `https://www.baidu.com/s?wd=${encodedQuery}`;
    } else if (engine === "google") {
        searchUrl = `https://www.google.com/search?q=${encodedQuery}`;
    } else {
        generating = false;
        return $ui.error("未知的搜索引擎");
    }
    $app.openURL(searchUrl);
    $delay(0.5, () => generating = false);
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
    
    if (role === "吐槽" && sprayButtonMode === "开喷") { 
        return; 
    }
    
    let user_content;
    
    let translation_source_info = {
        from_selection: false,
        original_all_text_length_to_delete: 0,
        is_translation_from_input_field: false 
    };

    if (role === "翻译文本") {
        const raw_selected_text = $keyboard.selectedText; 
        const raw_all_text = await $keyboard.getAllText(); 

        user_content = await get_content_for_new_buttons(); 

        if (raw_selected_text && raw_selected_text.trim() === user_content) {
            translation_source_info.from_selection = true;
            translation_source_info.is_translation_from_input_field = true;
        } else if (!raw_selected_text && raw_all_text && raw_all_text.trim() === user_content) {
            translation_source_info.original_all_text_length_to_delete = raw_all_text.length;
            translation_source_info.is_translation_from_input_field = true;
        }
    } else {
        user_content = await get_content(0); 
    }
    
    
    if (!user_content && !multi_turn && role !== "翻译文本") {
         const nonTranslateRolesRequireContent = ["助手", "续写", "总结", "润色", "扩展", "吐槽"];
         if (nonTranslateRolesRequireContent.includes(role)) {
            return $ui.warning("未找到提示");
         }
    }
    if (role === "翻译文本" && (!user_content || user_content.trim() === "")) {
        return $ui.warning("请输入或粘贴需要翻译的内容");
    }

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
        
        const needsWarningCheck = !hasUserMessageWithContent || (lastMsg && lastMsg.role !== "user") || (lastMsg && !lastMsg.content);
        const isAllowedEmptyInputCaseInMultiTurn = messages.length === 0 && systemContentProvided && !currentUserNewInput;

        if (needsWarningCheck && !isAllowedEmptyInputCaseInMultiTurn) {
            $ui.warning("请输入对话内容");
            generating = false;
            return;
        }
    } else { 
        if (role === "翻译文本") {
            const targetLangConfig = translateTargets[currentSelectedTranslateTargetKey];
            if (targetLangConfig) {
                messages.push({ "role": "system", "content": targetLangConfig.prompt });
            } else {
                messages.push({ "role": "system", "content": "Translate the text."});
            }
            messages.push({ "role": "user", "content": user_content });
        } else { 
            if (!user_gesture[gesture]) { 
                $keyboard.moveCursor(1);
                $keyboard.insert("\n");
            }
            if (user_gesture[gesture] && !$keyboard.selectedText) { 
                 delete_content(user_content.length); 
            }

            if (role_data[role] && role_data[role][0]) {
                messages.push({ "role": "system", "content": role_data[role][0] });
            }
            let preset_prompt = role_data[role] ? role_data[role][1] : "";
            
            if (preset_prompt && !preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt + "\n" + user_content;
            if (preset_prompt && preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt.replace(/{USER_CONTENT}/g, user_content);
            messages.push({ "role": "user", "content": user_content });
        }
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
        if (role === "翻译文本") {
            if (translation_source_info.is_translation_from_input_field) {
                if (translation_source_info.from_selection) {
                    $keyboard.delete(); 
                } else if (translation_source_info.original_all_text_length_to_delete > 0) {
                    await delete_content(translation_source_info.original_all_text_length_to_delete);
                }
            }
            $keyboard.insert(response_text);
        } else { 
            $keyboard.insert(response_text);
        }
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
        url: "https://yyapi.a1aa.cn/api.php?level=max",//开喷接口
        handler: async function(resp) {
            if (resp.error) {
                $ui.error("获取文本失败: " + resp.error.message);
                if (timer) timer.invalidate(); 
                set_bubble(); 
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
    if (adaptiveParams.totalHeight && adaptiveParams.totalHeight > 0 && $app.env === $env.keyboard) {
        $keyboard.height = adaptiveParams.totalHeight;
    }

    if ($app.env === $env.keyboard) {
        $ui.render({ props: { navBarHidden: true } }); 
        $delay(0, () => { 
            const mainView = $ui.create(view);
            $ui.controller.view = mainView; 
            mainView.layout(view.layout); 
            
            const tucaoButtonIdentifierInInit = "吐槽"; 
            const allButtonKeysForInit = Object.keys(edit_tool).concat(Object.keys(role_data));
            const tucaoInitIndex = allButtonKeysForInit.indexOf(tucaoButtonIdentifierInInit);

            if (tucaoInitIndex !== -1) {
                let matrixView;
                if (mainView.views && mainView.views[0] && mainView.views[0].type === "matrix") { 
                    matrixView = mainView.views[0];
                } else {
                    matrixView = mainView.get("matrix"); 
                }
                
                if (matrixView) {
                     const buttonCellView = matrixView.cell($indexPath(0, tucaoInitIndex));
                     if (buttonCellView) {
                         const btnToUpdate = buttonCellView.get("button");
                         if (btnToUpdate) {
                             btnToUpdate.title = sprayButtonMode;
                             btnToUpdate.bgcolor = (sprayButtonMode === "开喷") ? $color("#FFF0F0", "#806B6B") : $color("#FFFFFF", "#6B6B6B");
                         }
                     }
                }
            }
        });
    } else {
        $ui.render(view);
    }
}

initializeKeyboard();

