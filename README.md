#!name=Task
#!desc=Task定时脚本
#!system=ios

[Script]

# App价格版本监控，填ID
// App商店监控 = type=cron,cronexp=0 0 * * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Neurogram-R/AppMonitor.js,script-update-interval=0
# > TestFlight公测监控，填appkey
// TF公测监控 = script-path=https://raw.githubusercontent.com/songyangzz/QuantumultX/master/testflight.js,tag=TestFlight公测监控,type=cron,cronexp=0 0 * * * *
# > 每日一言
每日一言 = script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Meeta/Surge/Scripting/Calendar.js,tag=一言+历史上的今天,type=cron,cronexp=0 0 8 * * *
# 签到脚本
# > 京东
京东领京豆 = type=cron,cronexp=0 0 0 * * *,script-path=https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js,script-update-interval=0
# 人人视频
人人视频签到 = script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/rrtv/rrtv.js,script-update-interval=0,cronexp=15 2 0 * * *,type=cron
# 喜马拉雅
喜马拉雅签到 = type=cron,cronexp=40 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/ximalaya/ximalaya.js,script-update-interval=0
# 人人字幕组
人人字幕组签到 = type=cron,cronexp=50 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/zimuzu/zimuzu.js,script-update-interval=0
# 中国电信套餐，天翼账号中心
中国电信套餐 = type=cron,cronexp= 0 0 9 * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/telecomInfinity.js,script-update-interval=0
# 微信小程序-活动抽奖
微信活动抽奖 = type=cron,cronexp=0 6 0 * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/WeChatLottery_new.js
# DlerCloud墙洞机场
DlerCloud机场签到 = type=cron,cronexp=0 0 8 * * *,script-path=https://raw.githubusercontent.com/Darren-X1/S/master/dlercloud.js,script-update-interval=0
# 天气预报
天气预报 = type=cron,cronexp=0 8-20/4 * * *,script-path=mutu/weather_pro.js,script-update-interval=0
# 饿了么
饿了么签到 = script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/elemSign.js,script-update-interval=0,cronexp=35 2 0 * * *,type=cron
# 网易云音乐
网易云音乐签到 = type=cron,cronexp=0 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/neteasemusic/neteasemusic.js,script-update-interval=0
# 趣头条
趣头条领金币 = type=cron,cronexp=20 1 0/1 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/qtt/qtt.js,script-update-interval=0



