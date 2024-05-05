var intervals = 0.3;  // 设置默认间隔时间为0.3秒
var isStartHongzha = false;  // 轰炸状态标志
var settime;  // 定时器变量

$ui.render({
  views: [{
    type: "input",
    props: {
      type: $kbType.number,
      font: $font(12),
      darkKeyboard: true,
      placeholder: "泼妇骂街间隔时长0.3秒"
    },
    layout: function (make, view) {
      make.centerY.equalTo(view.super).offset(-40);
      make.centerX.equalTo(view.super);
      make.size.equalTo($size(150, 32));
    },
    events: {
      changed: function (sender) {
        intervals = parseFloat(sender.text);  // 更新间隔时间
      }
    }
  },
  {
    type: "button",
    props: {
      radius: 32,
      font: $font(12),
      bgcolor: $color("red"),
      titleColor: $color("white"),
      title: "开始辱骂"
    },
    layout: function (make, view) {
      make.size.equalTo($size(64, 64));
      make.centerY.equalTo(view.super).offset(40);
      make.centerX.equalTo(view.super);
    },
    events: {
      tapped: function (sender) {
        if (isStartHongzha) {
          clearInterval(settime);
        } else {
          hongzha();
        }
        isStartHongzha = !isStartHongzha;
        sender.title = isStartHongzha ? "结束辱骂" : "开始辱骂";
        sender.bgcolor = isStartHongzha ? $color("black") : $color("red");
      }
    }
  }]
});

function hongzha() {
  settime = setInterval(() => {
    fetchTextAndSend();  // 从接口获取文本并发送
  }, intervals * 1000);
}

function fetchTextAndSend() {
  $http.get({
    url: "https://yyapi.a1aa.cn/api.php?level=max",
    handler: function(resp) {
      var text = resp.data;  // 获取API返回的数据
      $keyboard.insert(text);  // 插入文本到键盘
      $keyboard.send();  // 发送键盘内容
    }
  });
}