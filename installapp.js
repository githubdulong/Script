const { name,displayVersion,id,bundleId } = Object.fromEntries(new URL(decodeURIComponent(decodeURIComponent($request.url))).searchParams);

const url = `http://localhost:8000/${name}@${displayVersion}@${id}.ipa`;


const body = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>items</key>
	<array>
		<dict>
			<key>assets</key>
			<array>
				<dict>
					<key>kind</key>
					<string>software-package</string>
					<key>url</key>
					<string>${url}</string>
				</dict>
				<dict>
					<key>kind</key>
					<string>display-image</string>
					<key>needs-shine</key>
					<true/>
					<key>url</key>
					<string></string>
				</dict>
			</array>
			<key>metadata</key>
			<dict>
				<key>bundle-identifier</key>
				<string>${bundleId}</string>
				<key>bundle-version</key>
				<string>${displayVersion}</string>
				<key>kind</key>
				<string>software</string>
				<key>title</key>
				<string>${name}</string>
			</dict>
		</dict>
	</array>
</dict>
</plist>`

$done({response: {body}})