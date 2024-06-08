/*
去广告by@xream 解锁会员 by@ios151
*/
let body;
try {
  body = JSON.parse($response.body.replace(/"isNsfw":true/g, '"isNsfw":false'));
  
  // 去广告
  if (body.data?.children?.commentsPageAds) {
    body.data.children.commentsPageAds = [];
  } 
  for (const [k, v] of Object.entries(body.data)) {
    if (v?.elements?.edges) {
      body.data[k].elements.edges = v.elements.edges.filter(
        i =>
          !['AdPost'].includes(i?.node?.__typename) &&
          !i?.node?.cells?.some(j => j?.__typename === 'AdMetadataCell') &&
          !i?.node?.adPayload
      );
    }
  }
  
  // 解锁会员
  body = JSON.stringify(body)
    .replace(/"isPremiumMember":false/g, '"isPremiumMember":true')
    .replace(/"isSubscribed":false/g, '"isSubscribed":true')
    .replace(/"isEmployee":false/g, '"isEmployee":true')
    .replace(/"skus": \[\]/g, '"skus": [{"kind":"Premium","subscriptionType":"Premium","name":"Premium Subscription","description":"Mobile Annual Premium Subscription","duration":{"amount":1,"unit":"YEAR"},"id":"1","quantity":"1","renewInterval":"YEAR","requiredPaymentProviders":["APPLE_INAPP","GOOGLE_INAPP"],"externalProductId":"com.reddit.premium_2","promos":[],"tags":[]}]')
    .replace(
      /({)/,
      '$1"has_gold_subscription":true, "pref_autoplay":false, "has_subscribed_to_premium":true, "has_visited_new_profile":true, "pref_video_autoplay":false, "features":{"promoted_trend_blanks":false}, "is_mod":true, "user_is_subscriber":true, "hide_ads":true, "isPremiumMember":true, "is_gold":true, "isBrandAffiliate": true, "has_ios_subscription":true, "seen_premium_adblock_modal":true, "has_external_account":true,'
    );

} catch (e) {
  console.log(e);
} finally {
  $done(body ? { body: body } : {});
}