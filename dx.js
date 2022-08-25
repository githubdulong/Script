const body = "phone=15288888888&submit=";
const headers = {"Connection":"keep-alive","Accept-Encoding":"gzip, deflate","Upgrade-Insecure-Requests":"1","Content-Type":"application\/x-www-form-urlencoded","Origin":"http:\/\/woshi.gjds.vip","User-Agent":"Mozilla\/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit\/605.1.15 (KHTML, like Gecko) Version\/14.0.3 Mobile\/15E148 Safari\/604.1","Cookie":"PHPSESSID=hguq6tmhg0p5krsnhcjj1059h2; Hm_lvt_6c01aec8fd048ea39d1445d07bfd0545=1660906874,1660917476,1660937190,1661056733","Host":"woshi.gjds.vip","Referer":"http:\/\/woshi.gjds.vip\/user\/","Accept-Language":"zh-cn","Accept":"text\/html,application\/xhtml+xml,application\/xml;q=0.9,*\/*;q=0.8","Content-Length":"25"};
const url = "http://woshi.gjds.vip/user/index.php";


const request = {
    url: url,
    headers: headers,
    body: body
};

$httpClient.post(request,(err, resp, data)=>{
      console.log(JSON.stringify(data))
      $done({})
});