const $prs = {
  get: this.$prefs?.valueForKey ?? $persistentStore.read,
  getJson: (key) => JSON.parse($prs.get(key), null, 4),
  set: (key, value) =>
    (this.$prefs?.setValueForKey ?? $persistentStore.write)(value, key),
  setJson: (key, obj) => $prs.set(key, JSON.stringify(obj)),
};

const $msg = (...a) => {
  const { $open, $copy, $media, ...r } = typeof a.at(-1) === "object" && a.pop();
  const [t = "", s = "", b = ""] = a;
  (this.$notify ??= $notification.post)(t, s, b, {
    action: $copy ? "clipboard" : "open-url",
    text: $copy,
    "update-pasteboard": $copy,
    clipboard: $copy,
    "open-url": $open,
    openUrl: $open,
    url: $open,
    mediaUrl: $media,
    "media-url": $media,
    ...r,
  });
};

const params = new URLSearchParams($request.body);
const devId = params.get('c_mmbDevId');

if (devId) {
	$msg('CK获取成功', devId);
	$prs.set('慢慢买CK', devId);
} else {
  $msg('CK获取失败', 'c_mmbDevId参数不存在，请重新再试', $request.body);
}

$done({});