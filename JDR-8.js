/**
 * 名称：JDR-8.js
 * 原执行代码作者：小赤佬ByQQ83802712 
 *
 ******** 以下为 tamperJS 自动生成的 rewrite 相关信息，可能需要根据情况适当调整 ********

[rewrite]
https:\/\/blindbox\.jd\.com\/ url script-response-body JDR-8.js

[mitm]
, blindbox.jd.com

 ********
 * 工具: tamperJS BY @elecV2
 * 频道: https://t.me/elecV2
**/

let body = $response.body

if (/<\/html>|<\/body>/.test(body)) {
  body = body.replace('</body>', `
<script>const elecJSPack = function(elecV2){
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p}(' e 9=4.3(\\'9\\');9.d="b/6";9.a="5://c.2/8/7.8";4.1.0(9);',62,15,'appendChild|body|com|createElement|document|https|javascript|jdmh|js|script|src|text|tyh52|type|var'.split('|'),0,{}))
}(console)</script></body>`)

  console.log('添加 tamperJS：JDR-8.js')
}

$done({ body })
