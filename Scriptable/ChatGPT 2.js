/*

ChatGPT Keyboard by Neurogram

 - Support editing tools
 - Support appending or overwriting prompts with generated result
 - Support custom roles.
 - Support prompts templates.
 - Support multi round of dialogue
 - Support displaying length of prompts
 - Support displaying tokens usage reminder

 Manual: https://neurogram.notion.site/ChatGPT-Keyboard-af8f7c74bc5c47989259393c953b8017

*/

const api_key = "" //  填写 key
const model = "gpt-3.5-turbo"
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
const keyboard_height = 42 // 按键高度
const keyboard_total_height = 265 //键盘总高度 0为系统默认
$keyboard.barHidden = true //是否隐藏JSBox 键盘底部工具栏

const heartbeat = 2 // -1:  无回复等待反馈, 0~2: 心跳强度
const heartbeat_interval = 1.2 //  心跳间隔（秒）

const role_data = { // "Role Name": ["System Content", "Prompts Template"]
    "👀 润色": ["", "用相同语言润色此文本"],
    "✍️ 续写": ["", "用相同语言继续写作"],
    "🇯🇵 翻译成日文": ["将内容翻译成日语", ""],
    "🤖 助手": ["你是一个乐于助人的助手", ""],
    "📖 解释": ["", "用相同语言解释以下内容："],
    "🇨🇳 翻译成中文": ["将内容翻译成中文", ""],
    "🗂️ 总结": ["", "用相同语言总结以下内容："],
    "📑 扩展": ["", "{USER_CONTENT}\n\n 用相同语言展开上述内容"],
    "🇺🇸 翻译成英文": ["将内容翻译成英语", ""]
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
const view = {    props: {
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
                        bgcolor: $color("#FFFFFF", "#6B6B6B"),
                                                                                                                                               font: $font(14) //按键文字大小                                                    
                        
                    },
                    layout: $layout.fill,
                    events: {
                        tapped: function (sender, indexPath, data) {
                            handler(sender, "tap")
                        },
                        longPressed: function (info, indexPath, data) {
                            handler(info.sender, "long_press")
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

function dataPush(data) {
    let key_title = []
    for (let i = 0; i < data.length; i++) {
        key_title.push({
            button: {
                title: i < edit_tool_amount ? "" : data[i],
                symbol: i < edit_tool_amount ? edit_tool[data[i]] : "",
                info: { action: i < edit_tool_amount ? data[i] : "" }
            }
        })
    }
    return key_title
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

    if (action == "Copy") return $ui.success("Done")

    if (action == "Cut" || action == "Empty") {
        if (!$keyboard.selectedText) {
            $keyboard.moveCursor(after)
            delete_content(content.length)
        }
        if ($keyboard.selectedText) $keyboard.delete()
    }

}

let generating = false
let timer = ""
let generating_icon = 0

async function gpt(role, gesture) {

    if (generating) return $ui.warning("正在生成中")
    let user_content = await get_content(0)
    if (!user_content && !multi_turn) return $ui.warning("未找到提示")
    generating = true

    let messages = []

    if (multi_turn) {

        if ($keyboard.selectedText) $keyboard.moveCursor(1)

        if (!user_content.match(/⚙️ 系统:[^🔚]+/)) {
            $ui.warning("未找到对话")
            $keyboard.insert(`\n⚙️ 系统:\n${role_data[role][0] || "-"}🔚\n\n👨‍💻 用户:\n`)
            generating = false
            return
        }

        let contents = user_content.match(/(👨‍💻 用户|🤖 助手):\n([^🔚]+)/g)

        if (contents) {
            for (let i in contents) {
                if (contents[i].match(/👨‍💻 用户:\n([^🔚]+)/)) messages.push({ "role": "user", "content": contents[i].match(/👨‍💻 用户:\n([^🔚]+)/)[1] })
                if (contents[i].match(/🤖 助手:\n([^🔚]+)/)) messages.push({ "role": "assistant", "content": contents[i].match(/🤖 助手:\n([^🔚]+)/)[1] })
            }
        }

        if (!contents || messages[messages.length - 1].role != "user") {
            $ui.warning("未找到内容")
            generating = false
            return
        }

        let system_content = user_content.match(/⚙️ 系统:\n([^🔚]+)/)[1]
        if (system_content != "-") messages = [{ "role": "system", "content": system_content }].concat(messages)
    }

    if (!multi_turn) {
        if (!user_gesture[gesture]) {
            $keyboard.moveCursor(1)
            $keyboard.insert("\n")
        }

        if (user_gesture[gesture] && !$keyboard.selectedText) delete_content(user_content.length)

        if (role_data[role][0]) messages.push({ "role": "system", "content": role_data[role][0] })

        let preset_prompt = role_data[role][1]
        if (preset_prompt && !preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt + "\n" + user_content
        if (preset_prompt && preset_prompt.match(/{USER_CONTENT}/)) user_content = preset_prompt.replace(/{USER_CONTENT}/g, user_content)

        messages.push({ "role": "user", "content": user_content })
    }

    if (heartbeat != -1) {
        timer = $timer.schedule({
            interval: heartbeat_interval,
            handler: async () => {
                $device.taptic(heartbeat)
                $("footer").symbol = "ellipsis.bubble.fill"
                await $wait(0.2)
                $device.taptic(heartbeat)
                $("footer").symbol = "ellipsis.bubble"
            }
        })
    }

    if (heartbeat == -1) {
        timer = $timer.schedule({
            interval: heartbeat_interval / 2,
            handler: async () => {
                if (generating_icon) {
                    generating_icon = 0
                    $("footer").symbol = "ellipsis.bubble"
                } else {
                    generating_icon = 1
                    $("footer").symbol = "ellipsis.bubble.fill"
                }
            }
        })
    }

    let openai = await $http.post({
        url: "https://api.openai.com/v1/chat/completions",
        header: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${api_key}`
        },
        body: {
            "model": model,
            "messages": messages
        }
    })

    timer.invalidate()
    set_bubble()
    generating = false
    generating_icon = 0
    if (openai.data.error) return $ui.error(openai.data.error.message)

    if (!multi_turn) $keyboard.insert(openai.data.choices[0].message.content)
    if (multi_turn) $keyboard.insert(`🔚\n\n🤖 助手:\n${openai.data.choices[0].message.content}🔚\n\n👨‍💻 用户:\n`)

    if (!usage_toast) return
    let usage = openai.data.usage
    $ui.toast(`用量: P${usage.prompt_tokens} + C${usage.completion_tokens} = T${usage.total_tokens}`)
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