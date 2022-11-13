/*
@ 小白脸

⚠️只兼容 Surge 只兼容 Surge 只兼容 Surge⚠️
因测试Cookie 容易过期，故使用账户密码模拟登录方式，理论上 app 机制不更改一直不会挂；
  食用方法：自行保存到本地，脚本内填写账号（只支持手机或邮箱账户）、密码后设置 cron 运行即可；
参考：
[Script]
威锋签到 = type=cron,script-path=weifeng.js,timeout=t,cronexp=0 8 * * *,wake-system=1,timeout=15

*/

const a = ''; //账号
const b = ''; //密码
//获取请求对象
var person = new Person();



!(async () => {
  try {
    let singIn = await signin();
		let inform = await infon();
		let txt,text;
		txt = `${singIn}，已连续签到${inform.signInTotalCount}天`;
     text = 
		`ID:${inform.userBaseInfo.userName}   等级:Lv${inform.userBaseInfo.level}   金币:${inform.weTicket}\n今天是你加入威锋的${inform.joinDays}天`
		$notification.post('威锋论坛',txt,text);
  } catch (e) {
    console.log("Error: " + e); $notification.post(e + '', '', '');
  }
  $done();
})();

function post(POST) {
  return new Promise((resolve, reject) => {
    $httpClient.post(POST, (err, resp, data) => {
      (err || resp.status !== 200) ? reject(err) : resolve(data);
    });
  });
}

function get(get) {
  return new Promise((resolve, reject) => {
    $httpClient.get(get, (err, resp, data) => {
      (err || resp.status !== 200) ? reject(err) : resolve(data);
    });
  });
}

async function ck() {
  let k = person.pp('signins')
	 k.body = `account=${a}&password=${b}`;
  let land = JSON.parse(await post(k));
  if (land.status.code === 0) {
    let token = land.data.accessToken;
    // 存储token
    setToken(token);
    return token;
  } else {
    throw land.status.message
  }
}

function getToken() {
  // 通过账号密码当唯一值，读取该账号密码的token
  return $persistentStore.read(`wf-token-${a}-${b}`);
}

function setToken(token) {
  // 通过账号密码当唯一值，写入该账号密码的token
  $persistentStore.write(token, `wf-token-${a}-${b}`)
}

async function signin() {
  // 获取token，如果没有则去请求，再存储token
	// Token开启全局访问
  Token = getToken() || await ck();
	let wf = person.pp('signin');
  wf.headers['x-access-token'] = Token;
  // 登录操作
  const data = await post(wf);
  let sig = JSON.parse(data);
  var code = `${sig.status.code}`.match(/\b(0|1021)\b/);
  if (code) {
    var _sign = sig.status.message;
  } else {
    $notification.post(sig.status.message, '正在更换ck', '请稍等');
    // token失效重新设置token为空，然后调用自己本身
    setToken('');
    return signin();
  }
  return _sign.replace(/.+/,
		(x) => {
			return x === 'success' ? '签到成功✅' : `${x}⚠️`
		}
		)
}

async function infon(){
		let home = person.pp('homePageInfo');
		home.headers['x-access-token'] = Token;
		  let inform = JSON.parse(await get(home)).data;
			return inform
			}
			

function Person() {
	
    this.running = `M0hhBBSkMGg71/hbUpHuOd4i4/1ZzT9LZbOzF+1dkKswn9Ib0qJkcOAnkXDwTcY4QJx6M5+lDT6y6+tQg6wGZoV/+zUcGczM3wEm0y0uB1naLlMjg+qumDkwYtey/XzovWzIs3eIwTcTTnlrMzlpB8oZ+kGBYiu9TOHfmLZUJ9jgW2FZ5c7W5ibg3uq606PxKmyVIqxJWAniJxdqEbf37601Ec031FSLZPN8TEPodEJkpkCbY6/QqD8LfQOtiipAAJi11HaK1yM78Wp+F31bPMK+YlwQS4NzibV0gA+SPp84ET23JxzgEELL/jZiAqeZMixKaHPp3clnAKf2CTYNnhQ1Y3PBcDbD4pZMVtUwRh9cMcWxFhct8T4/D+eO2/7IzJda8bwvy75AaDev3PtU2A==`;
			//签到
			this.signin = {
				url : 'https://api.wfdata.club/v1/attendance/userSignIn',
				headers : {'x-request-id':       'UUhIl4ogsHmoE6MZNCc99B1mIRrrNqjukn0zzekcN3un0vaaH7FNHvgXi3qDMO9D'}
			};
			//登陆
			this.signins = { 
				url : 'https://api.wfdata.club/v1/auth/signin',
				headers : {'x-request-id': ` /9ESQHOIeA8UQktLh6vDlMb+HHLyk+SJby4LdkK/iM0Pe68+gz9IvcQMwyk2MTDS`}
	   	};
			//查看个人信息
			this.homePageInfo = {
				url : 'https://api.wfdata.club/v1/user/homePageInfo',
				headers : {'x-request-id': 'ItdBL/7kPKkupGrKMKmKGedj/8Im0nDDPet4XuY92NjR83Ey/LnrfGe80vLHxfMV'}
			};
					
			this.pp = (x,y) => {
         this[x]['headers']['x-running-env'] = this.running;
				 return this[x];
			}			
}