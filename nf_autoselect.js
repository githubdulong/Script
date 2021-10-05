/* 脚本经本人测试已经可以正常运行，但仍可能存在bug，使用过程中遇到障碍请联系Telegram：https://t.me/okmytg
脚本说明：
 1:本脚本修改自 @Helge_0x00 
 2:panel脚本依赖cron脚本传送数据，你应当手动运行一次cron脚本以获取节点列表
 3:为了节省效能，请尽量精简策略组
 4:点击panel时切换至下一个可解锁节点，节点列表为空时，仅执行状态检测
 5:panel脚本允许自动更新，自动更新将刷新策略组信息，并可以自动选择更优选项
 6:检测数据有一定概率会出错，且网飞数据会有所变动，因此你可能遇到切换至非全解锁节点，此时切换至下一个即可，毕竟这是概率较小的事件，大部分检测都是正确的，亦可手动执行一次cron脚本，节点列表将得到更新与修正
 6:可用的自定义参数：
 icon1 color1:全解锁时的图标及颜色
 icon2 color2:仅自制时的图标及颜色
 icon3 color3:无可用节点的图标及颜色
 netflixGroup：网飞策略组名称
*/


const FILM_ID = 81215567
const AREA_TEST_FILM_ID = 80018499
let params = getParams($argument)

;(async () => {
let netflixGroup = params.netflixGroup
//将策略组名称创建为持久化数据
$persistentStore.write(netflixGroup,"NFGroupName");

let proxy = await httpAPI("/v1/policy_groups");
let groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(netflixGroup)+"")).policy;
let first = groupName;
var proxyName= [];//netflix节点组名称
let arr = proxy[""+netflixGroup+""];
for (let i = 0; i < arr.length; ++i) {
proxyName.push(arr[i].name);
}
let allGroup = [];
for (var key in proxy){
   allGroup.push(key)
    }

var fullUnlock=[];
var onlyOriginal=[];

//读取持久化数据
fullUnlock = $persistentStore.read("fullUnlockNetflix").split(",");
onlyOriginal= $persistentStore.read("onlyOriginalNetflix").split(",");

//打印测试结果
console.log("全解锁:"+fullUnlock.sort())
console.log("仅自制:"+onlyOriginal.sort())

/**
   * 过滤选择列表
   */


//删除策略组外节点并更新持久化数据
var select=[];
//清除空值
if(fullUnlock.toString().length==0){
fullUnlock.splice(fullUnlock.indexOf(fullUnlock[0]), 1)
}
if(onlyOriginal.toString().length==0){
onlyOriginal.splice(onlyOriginal.indexOf(onlyOriginal[0]), 1)
}

console.log(fullUnlock.length+" | "+ onlyOriginal.length)

if(fullUnlock.length>0){
	for (let i = 0; i < fullUnlock.length; ++i) {
	if(proxyName.includes(fullUnlock[i])==false){
		fullUnlock.splice(fullUnlock.indexOf(fullUnlock[i]), 1)
		}
	}
	select = fullUnlock
	$persistentStore.write(select.sort().toString(),"fullUnlockNetflix");
}else if(fullUnlock.length==0&&onlyOriginal.length>0){
	for (let i = 0; i < onlyOriginal.length; ++i) {
	if(proxyName.includes(onlyOriginal[i])==false){
		onlyOriginal.splice(onlyOriginal.indexOf(onlyOriginal[i]), 1)
		}
	}
	select = onlyOriginal
	$persistentStore.write(select.sort().toString(),"onlyOriginalNetflix")
}

console.log("选择列表:"+select.sort())

//手动切换

if($trigger == "button"){

//当前节点
groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(netflixGroup)+"")).policy;
console.log("当前节点:"+groupName)

let index = select.indexOf(groupName)+1;

if(index>=select.length){
	index=0
}
console.log("目标节点:"+ select[index])

$surge.setSelectGroupPolicy(netflixGroup, select[index]);

await timeout(1000).catch(() => {})

}


/**
   * 自动刷新
   */

/* 检查选择列表 */
console.log(select.length)
if(select.length==0){
	$notification.post("节点列表获取失败", "未获取到节点列表，请手动运行一次NetflixChecker脚本", "")
}
//测试当前选择

//当前节点
groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(netflixGroup)+"")).policy;
console.log("当前节点:"+groupName)

let { status, regionCode, policyName } = await testPolicy(groupName);
let newStatus=status
let reg = regionCode

console.log("节点状态:"+status)

//当前节点不可全解锁时，执行自动切换，若列表为空，仅执行测试
if(status!= 2){
	if(select.length>0){
	//遍历选择列表，找到第一个更优节点
		for (let i = 0; i < select.length; ++i) {
		$surge.setSelectGroupPolicy(netflixGroup, select[i]);
		await timeout(1000).catch(() => {})
		groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(netflixGroup)+"")).policy;
		console.log("当前节点:"+groupName)
		let { status, regionCode, policyName } = await testPolicy(groupName);
		console.log("节点状态:"+status)
		if(status>newStatus){
			newStatus=status
			reg = regionCode
			break;
			}
		}
	}else {
	groupName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(netflixGroup)+"")).policy;
	console.log("当前节点:"+groupName)
	let { status, regionCode, policyName } = await testPolicy(groupName);
	console.log("节点状态:"+status)
	newStatus=status
	reg = regionCode
	}
}

	status=newStatus
	regionCode=reg

//获取根节点名
let rootName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(netflixGroup)+"")).policy;
while(allGroup.includes(rootName)==true){
	rootName = (await httpAPI("/v1/policy_groups/select?group_name="+encodeURIComponent(rootName)+"")).policy;
}

/**
   * 面板显示
   */

let title = "Netflix ➟ " + rootName;

let panel = {
  title: `${title}`,
}

  
  if (status==2) {
    panel['content'] = `已完整解锁Netflix  区域:${regionCode}`
    panel['icon'] = params.icon1
	 panel['icon-color'] = params.color1
  } else if (status==1) {
      panel['content'] = `仅解锁Netflix自制剧`
      panel['icon'] = params.icon2
	   panel['icon-color'] = params.color2
    }else {
 		$surge.setSelectGroupPolicy(netflixGroup, first);
  		panel['content'] = `该节点未解锁Netflix`
  		panel['icon'] = params.icon3
	 	panel['icon-color'] = params.color3
		return
	}



console.log(panel)

    $done(panel)


})();





function httpAPI(path = "", method = "GET", body = null) {
    return new Promise((resolve) => {
        $httpAPI(method, path, body, (result) => {
            resolve(result);
        });
    });
};

async function testPolicy(policyName) {
  try {
    const regionCode = await Promise.race([testFilm(FILM_ID), timeout(3000)])
    return { status: 2, regionCode, policyName }
  } catch (error) {
    if (error === 'Not Found') {
      return { status: 1, policyName }
    }
    if (error === 'Not Available') {
      return { status: 0, policyName }
    }
    console.log(error)
    return { status: -1, policyName }
  }
}

/**
 * 测试是否解锁
 */
function testFilm(filmId) {
  return new Promise((resolve, reject) => {
    let option = {
      url: `https://www.netflix.com/title/${filmId}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
      },
    }
    $httpClient.get(option, function (error, response, data) {
      if (error != null) {
        reject(error)
        return
      }

      if (response.status === 403) {
        reject('Not Available')
        return
      }

      if (response.status === 404) {
        reject('Not Found')
        return
      }

      if (response.status === 200) {
        let url = response.headers['x-originating-url']
        let region = url.split('/')[3]
        region = region.split('-')[0]
        if (region == 'title') {
          region = 'us'
        }
        resolve(region.toUpperCase())
        return
      }

      reject('Error')
    })
  })
}

function timeout(delay = 5000) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject('Timeout')
    }, delay)
  })
}

function getParams(param) {
  return Object.fromEntries(
    $argument
      .split("&")
      .map((item) => item.split("="))
      .map(([k, v]) => [k, decodeURIComponent(v)])
  );
}
