/*

ChatGPT键盘 修改自@Neurogram
	•	支持编辑工具
	•	支持附加或覆盖生成结果的提示
	•	支持自定义角色
	•	支持提示模板
	•	支持多轮对话
	•	支持显示提示的长度
	•	支持显示使用的 Token 提醒
	•	支持连点三次切换“开喷、吐槽”模式，开喷模式支持单击或按压开启单发或连发模式

教程：点击这里查看手册 https://neurogram.notion.site/ChatGPT-Keyboard-af8f7c74bc5c47989259393c953b8017

*/
const api_key = " " //  填写 key
const openai_proxy_url = " "; // 可选的第三方代理地址，留空或注释掉以禁用代理
const model = "gpt-4"
const user_gesture = { // Generated results: 0: auto-wrap 1: overwrite selected/all prompts
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

const role_data = { // "Role Name": ["System Content", "Prompts Template"]
    "助手": ["你是一个热心且乐于助人的Ai助手，提供帮助和建议。", ""],
    "续写": ["", "用相同语言继续创作或完成内容。"],
    "译为中文": ["将所给内容翻译成中文。", ""],
    "总结": ["", "用相同语言总结内容，提炼出关键信息。"],
    "润色": ["", "用相同语言对内容进行润色或优化。"],
    "译为英文": ["将所给内容翻译成美式英语。", ""],
    "扩展": ["", "你是一名高级网络工程师兼自动化脚本专家，精通 Surge、JSBox、JavaScript 和 API 调用，且具有极强的逻辑分析与优化能力。请从专业技术视角出发，基于以下内容，进行详细推演、拓展、优化或修复建议，以利于高效实现目标功能：\n\n{USER_CONTENT}"],
    "吐槽": ["", "使用相同语言启动强烈的怼人模式，进行尖锐的反击讽刺与吐槽。"], // 连续点击三次切换模式
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

// --- MODIFICATION 3 START: Persist sprayButtonMode ---
const spray_mode_cache_key = "chatgpt_keyboard_spray_mode_v1"; 
let sprayButtonMode = $cache.get(spray_mode_cache_key) || "吐槽"; 
// --- MODIFICATION 3 END ---

let lastSprayButtonTapTime = 0
const tripleTapInterval = 500 

const view = {
    props: {
        title: "ChatGPT",
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
                        // bgcolor is now set dynamically in dataPush for the special button
                        font: $font(14)
                    },
                    layout: $layout.fill,
                    events: {
                        // --- MODIFIED tapped function (Bug fix + Persist state) ---
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
                                        $cache.set(spray_mode_cache_key, sprayButtonMode); // Save current mode
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

                                // Action based on the button's title when it was tapped
                                if (originalButtonTitle === "开喷") {
                                    if (keyboard_sound) $keyboard.playInputClick();
                                    if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate);
                                    fetchTextAndSend(); // Perform "开喷" action
                                } else if (originalButtonTitle === "吐槽") {
                                    // handler() itself will play sound & vibrate
                                    handler(sender, "tap"); // Perform "吐槽" action
                                }
                            } else {
                                // For any other button, reset the tap count for the special button
                                sprayButtonTapCount = 0;
                                handler(sender, "tap");
                            }
                        },
                        // --- END OF MODIFIED tapped function ---
                        longPressed: function (info, indexPath, data) {
                            if (trollTimer) {
                                clearInterval(trollTimer);
                                trollTimer = null;
                            }
                            const buttonTitle = info.sender.title;
                            // Long press "开喷" only works if button currently shows "开喷" AND internal mode is "开喷"
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
                    title: " JSBox'ChatGPT 键盘",
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
if ($app.env === $env.keyboard) {
    $ui.render({ props: { navBarHidden: true } })
    $delay(0, () => {
        $ui.controller.view = $ui.create(view)
        $ui.controller.view.layout(view.layout)
    })
} else {
    $ui.render(view)
}

// --- MODIFIED dataPush function (Icon-only edit tools + Stateful "吐槽" button appearance) ---
function dataPush(data) {
    let key_title = [];
    for (let i = 0; i < data.length; i++) {
        const configName = data[i]; // Name from edit_tool or role_data
        let displayTitle = configName;
        let displayBgColor = $color("#FFFFFF", "#6B6B6B"); // Default color

        if (i < edit_tool_amount) { // Is an edit tool button
            displayTitle = ""; // Remove text for edit tools
        } else { // Is a role button
            // Handle stateful "吐槽" button, its appearance depends on sprayButtonMode
            if (configName === "吐槽") { 
                displayTitle = sprayButtonMode; // Its title is the current persisted/loaded mode ("开喷" or "吐槽")
                if (sprayButtonMode === "开喷") {
                    displayBgColor = $color("#FFF0F0", "#806B6B"); // Special color for "开喷" state
                } else { // sprayButtonMode is "吐槽"
                    displayBgColor = $color("#FFFFFF", "#6B6B6B"); // Default color for "吐槽" state
                }
            } else if (configName === "开喷") {
                // This handles if a role is literally named "开喷" in role_data (distinct from "吐槽" button's state)
                // For consistency, it should also get the "开喷" color.
                displayBgColor = $color("#FFF0F0", "#806B6B");
            }
            // For other role buttons, displayTitle remains configName and displayBgColor remains default.
        }

        key_title.push({
            button: {
                title: displayTitle,
                symbol: i < edit_tool_amount ? edit_tool[configName] : "",
                info: { action: i < edit_tool_amount ? configName : "" },
                bgcolor: displayBgColor // Use the determined background color
            }
        });
    }
    return key_title;
}
// --- END OF MODIFIED dataPush function ---

function handler(sender, gesture) {
    if (keyboard_sound) $keyboard.playInputClick()
    if (keyboard_vibrate != -1) $device.taptic(keyboard_vibrate)
    if ($app.env != $env.keyboard) return $ui.warning("请在键盘内运行")
    if (sender.info.action) return edit(sender.info.action, gesture)
    gpt(sender.title, gesture) // Pass current button title to gpt
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

async function gpt(role, gesture) { // 'role' here is the button's current title
    if (generating) return $ui.warning("正在生成中");

    // This check might be less relevant now since "开喷" action is directly handled by fetchTextAndSend
    // and gpt() will be called with role "吐槽" if that button is tapped.
    // However, keeping it doesn't harm if sprayButtonMode is also checked.
    if (role === "开喷" && sprayButtonMode === "开喷") {
        // This situation (gpt called with "开喷" title when in "开喷" mode)
        // shouldn't happen with the revised tapped logic, as fetchTextAndSend is called directly.
        // If it ever does, returning might be safe.
        return;
    }

    let user_content = await get_content(0);
    if (!user_content && !multi_turn) return $ui.warning("未找到提示");
    generating = true;

    let messages = [];

    if (multi_turn) {
        if ($keyboard.selectedText) $keyboard.moveCursor(1);

        if (!user_content.match(/⚙️ 系统:[^🔚]+/)) {
            $ui.warning("未找到对话");
            $keyboard.insert(`\n⚙️ 系统:\n${role_data[role] ? role_data[role][0] || "-" : "-"}🔚\n\n👨‍💻 用户:\n`); // Use role_data[role] if role exists
            generating = false;
            return;
        }

        let contents = user_content.match(/(👨‍💻 用户|🤖 助手):\n([^🔚]+)/g);

        if (contents) {
            for (let i in contents) {
                if (contents[i].match(/👨‍💻 用户:\n([^🔚]+)/)) messages.push({ "role": "user", "content": contents[i].match(/👨‍💻 用户:\n([^🔚]+)/)[1] });
                if (contents[i].match(/🤖 助手:\n([^🔚]+)/)) messages.push({ "role": "assistant", "content": contents[i].match(/🤖 助手:\n([^🔚]+)/)[1] });
            }
        }

        if (!contents || messages[messages.length - 1].role != "user") {
            $ui.warning("未找到内容");
            generating = false;
            return;
        }

        let system_content_match = user_content.match(/⚙️ 系统:\n([^🔚]+)/);
        if (system_content_match && system_content_match[1] != "-") {
             messages = [{ "role": "system", "content": system_content_match[1] }].concat(messages);
        }
    }

    if (!multi_turn) {
        if (!user_gesture[gesture]) {
            $keyboard.moveCursor(1);
            $keyboard.insert("\n");
        }

        if (user_gesture[gesture] && !$keyboard.selectedText) delete_content(user_content.length);
        
        // Use role_data for the given role (button title)
        if (role_data[role] && role_data[role][0]) {
            messages.push({ "role": "system", "content": role_data[role][0] });
        }

        let preset_prompt = role_data[role] ? role_data[role][1] : "";
        if (preset_prompt && !preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt + "\n" + user_content;
        if (preset_prompt && preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt.replace(/{USER_CONTENT}/g, user_content);

        messages.push({ "role": "user", "content": user_content });
    }

    if (heartbeat != -1) {
        timer = $timer.schedule({
            interval: heartbeat_interval,
            handler: async () => {
                $device.taptic(heartbeat);
                $("footer").symbol = "ellipsis.bubble.fill";
                await $wait(0.2);
                $device.taptic(heartbeat);
                $("footer").symbol = "ellipsis.bubble";
            }
        });
    }

    if (heartbeat == -1) {
        timer = $timer.schedule({
            interval: heartbeat_interval / 2,
            handler: async () => {
                if (generating_icon) {
                    generating_icon = 0;
                    $("footer").symbol = "ellipsis.bubble";
                } else {
                    generating_icon = 1;
                    $("footer").symbol = "ellipsis.bubble.fill";
                }
            }
        });
    }

    let api_url = openai_proxy_url ? openai_proxy_url + "/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";

    let openai = await $http.post({
        url: api_url,
        header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`
        },
        body: {
            "model": model,
            "messages": messages
        }
    });

    timer.invalidate();
    set_bubble();
    generating = false;
    generating_icon = 0;
    if (openai.data.error) return $ui.error(openai.data.error.message);

    if (!multi_turn) $keyboard.insert(openai.data.choices[0].message.content);
    if (multi_turn) $keyboard.insert(`🔚\n\n🤖 助手:\n${openai.data.choices[0].message.content}🔚\n\n👨‍💻 用户:\n`);

    if (!usage_toast) return;
    let usage = openai.data.usage;
    $ui.toast(`用量: P${usage.prompt_tokens} + C${usage.completion_tokens} = T${usage.total_tokens}`);
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
    $("footer").symbol = multi_turn ? "bubble.left.and.bubble.right" : "bubble.left"
}

async function fetchTextAndSend() {
    $http.get({
        url: "https://yyapi.a1aa.cn/api.php?level=max", //开喷接口
        handler: async function(resp) {
            if (resp.error) {
                $ui.error("获取文本失败: " + resp.error.message);
                // Restore footer symbol if error, similar to gpt function's error handling
                if (timer) timer.invalidate();
                set_bubble();
                generating = false; // Assuming fetchTextAndSend might also set generating
                generating_icon = 0;
                return;
            }
            var text = resp.data;
            $keyboard.insert(text);
            // Consider if $keyboard.send() is always desired here or should be conditional
            // For now, keeping original behavior.
            $keyboard.send(); // Original script had this, but it might be too aggressive.
                               // Usually, user types and then presses send.
                               // For "开喷", perhaps it's intended.

            // Visual feedback similar to gpt() completion, but simpler as it's not a timer loop
            if (heartbeat != -1) { // Quick feedback
                $device.taptic(heartbeat);
            }
            $("footer").symbol = "paperplane.fill"; // Indicate sent/done
            await $wait(0.5); // Show feedback briefly
            set_bubble(); // Restore normal footer symbol
        }
    });
}
