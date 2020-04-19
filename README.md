#!name=Task
#!desc=Task定时签到脚本
#!system=ios

[Script]

# App价格版本监控
# 需要填appid
AppMonitor.js = type=cron,cronexp=0 0 * * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Neurogram-R/AppMonitor.js,script-update-interval=0
# > TestFlight公测监控 (By @syzzzf)
# 需要自己填appkey
testflight.js = script-path=https://raw.githubusercontent.com/songyangzz/QuantumultX/master/testflight.js,tag=TestFlight公测监控,type=cron,cronexp=0 0 * * * *
# > 一言
Calendar.js = script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Meeta/Surge/Scripting/Calendar.js,tag=一言+历史上的今天,type=cron,cronexp=0 0 8 * * *
# 签到脚本
# > NobyDa
# > 京东
JD_DailyBonus.js = type=cron,cronexp=0 0 0 * * *,script-path=https://raw.githubusercontent.com/NobyDa/Script/master/JD-DailyBonus/JD_DailyBonus.js,script-update-interval=0
# 浏览器访问并登录: https://music.163.com/m/login
neteasemusic.js = type=cron,cronexp=0 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/neteasemusic/quanx/neteasemusic.js,script-update-interval=0
# 网易新闻
# 打开 APP 然后手动签到 1 次
neteasenews.js = type=cron,cronexp=5 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/neteasenews/neteasenews.js,script-update-interval=0
# 人人视频
# 打开 APP, 访问下`个人中心`
rrtv.js = type=cron,cronexp=15 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/rrtv/rrtv.js,script-update-interval=0
# 喜马拉雅
# 打开 APP, 访问下右下角`账号`
ximalaya.js = type=cron,cronexp=40 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/ximalaya/ximalaya.js,script-update-interval=0
# 字幕组
# 网页:打开浏览器访问: http://www.rrys2019.com, App: 打开 APP 即可
zimuzu.js = type=cron,cronexp=50 1 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/zimuzu/zimuzu.js,script-update-interval=0
# 美团外卖
# 打开 APP , 进入签到页面, 系统提示: `获取刷新链接: 成功`,然后手动签到 1 次
wmmeituan.js = type=cron,cronexp=35 2 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/wmmeituan/wmmeituan.js,script-update-interval=0
# 美团
# 打开 APP , 然后手动签到 1 次, (`首页` > `红包签到`)
meituan.js = type=cron,cronexp=40 2 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/meituan/meituan.js,script-update-interval=0
# WPS
# 打开 APP 我 > 签到 (右上角, 不用手动签到)
# 打开 `我的WPS会员` 小程序 (手动签到)
wps.js = type=cron,cronexp=35 3 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/wps/wps.js,script-update-interval=0
# 苏宁易购
# 首页 > 签到有礼
# 首页 > 领取红包
# 首页  > 天天低价
suning.js = type=cron,cronexp=50 3 0 * * *,script-path=https://raw.githubusercontent.com/chavyleung/scripts/master/suning/suning.js,script-update-interval=0
# 中国电信套餐 (By @uchvk& @Macsuny)
# 下载安装 天翼账号中心 登录
telecomInfinity.js = type=cron,cronexp=50 4 0 * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/telecomInfinity.js,script-update-interval=0
# 微信小程序-来客有礼 (By @Macsuny)
# 微信搜索’来客有礼‘小程序,登陆京东账号，点击’领京豆->翻牌‘
lkyl.js = type=cron,cronexp=30 5 0 * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/lkyl.js,script-update-interval=0
# 微信小程序-活动抽奖 (By @makexp & @zZPiglet)
#打开微信小程序 进入“活动抽奖”，手动签到一次或点击“已签到”
WeChatLottery_new.js = type=cron,cronexp=0 6 0 * * *,script-path=https://raw.githubusercontent.com/nzw9314/QuantumultX/master/Task/WeChatLottery_new.js
# > Dler Cloud墙洞 签到
dlercloud.js = type=cron,cronexp=0 8-20/4 * * *,script-path=https://raw.githubusercontent.com/Darren-X1/S/master/dlercloud.js,script-update-interval=0
# > 天气预报 一周
weather_pro.js = type=cron,cronexp=0 8-20/4 * * *,script-path=mutu/weather_pro.js,cronexp=0 8-20/4 * * *,script-update-interval=0
