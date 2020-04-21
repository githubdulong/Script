#!name=Task
#!desc=Task定时签到脚本
#!system=ios

[Script]

# App价格版本监控，填ID
// AppMonitor.js = type=cron,cronexp=0 0 * * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Neurogram-R/AppMonitor.js,script-update-interval=0
# > TestFlight公测监控，填appkey
// testflight.js = script-path=https://raw.githubusercontent.com/songyangzz/QuantumultX/master/testflight.js,tag=TestFlight公测监控,type=cron,cronexp=0 0 * * * *
# > 每日一言
Calendar.js = script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Meeta/Surge/Scripting/Calendar.js,tag=一言+历史上的今天,type=cron,cronexp=0 0 8 * * *
# 签到脚本
# > 京东
JD_DailyBonus.js = type=cron,cronexp=0 0 0 * * *,script-path=https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js,script-update-interval=0
# 人人视频
rrtv.js = script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/rrtv/rrtv.js,script-update-interval=0,cronexp=15 2 0 * * *,type=cron
# 喜马拉雅
ximalaya.js = type=cron,cronexp=40 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/ximalaya/ximalaya.js,script-update-interval=0
# 人人字幕组
zimuzu.js = type=cron,cronexp=50 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/zimuzu/zimuzu.js,script-update-interval=0
# 中国电信套餐，天翼账号中心
telecomInfinity.js = type=cron,cronexp=50 4 0 * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/telecomInfinity.js,script-update-interval=0
# 微信小程序-活动抽奖
WeChatLottery_new.js = type=cron,cronexp=0 6 0 * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/WeChatLottery_new.js
# DlerCloud墙洞机场
dlercloud.js = type=cron,cronexp=0 8-20/4 * * *,script-path=https://raw.githubusercontent.com/Darren-X1/S/master/dlercloud.js,script-update-interval=0
# 天气预报
weather_pro.js = type=cron,cronexp=0 8-20/4 * * *,script-path=mutu/weather_pro.js,cronexp=0 8-20/4 * * *,script-update-interval=0
# 饿了么
current_user$,type=http-request
elemSign.js = script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/elemSign.js,script-update-interval=0,cronexp=35 2 0 * * *,type=cron
# 网易云音乐
neteasemusic.js = script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/neteasemusic/neteasemusic.js,script-update-interval=0,cronexp=30 1 0 * * *,type=cron
