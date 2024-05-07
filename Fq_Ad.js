const body = JSON.parse($response.body);
body.resources = body.resources.filter(v => !v.url.includes("/ad"));
$done({body: JSON.stringify(body)});