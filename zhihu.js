//zhihu.js

let srcUrl = $request.url;

let urlRegex = /^https:\/\/link\.zhihu\.com\/\?target=(.*)$/;
let encodeUrl = srcUrl.match(urlRegex)[1];
let dstUrl = decodeURIComponent(encodeUrl);

$done({
  response: {
    status: 302,
    headers: {
      Location: dstUrl,
    },
  },
});
