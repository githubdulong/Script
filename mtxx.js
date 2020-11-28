/*
#美图秀秀 v9.0.51版本（by-黑黑酱）
QX:
^https:\/\/api\.xiuxiu\.meitu\.com\/v1\/user\/show\.json url script-response-body mtxx.js

MITM = api.xiuxiu.meitu.com
*/

var obj = JSON.parse($response.body); 
// 

obj ={
  "degrade": 0,
  "ret": 0,
  "error_code": 0,
  "error": "Ok",
  "msg": "成功",
  "data": {
    "uid": 1794626726,
    "mt_num": 0,
    "type": 0,
    "screen_name": "黑黑酱",
    "core": false,
    "avatar_url": "http://maavatar1.meitudata.com/5fbde7a5c10621905.jpg",
    "gender": "f",
    "birthday": 1006531200,
    "country_id": 810000,
    "province_id": 0,
    "city_id": 0,
    "fan_count": 1,
    "follower_count": 1,
    "feed_favorites_count": 0,
    "favorites_count": 0,
    "desc": "",
    "create_time": 1605878597,
    "last_update_time": 0,
    "is_invited": 0,
    "landmark_count": "0",
    "landmark_ranking": "0",
    "have_unlock_landmark": 0,
    "friendship_status": 0,
    "feed_count": 0,
    "feed_like_count": 0,
    "magazine_count": 0,
    "in_blacklist": 0,
    "age": 19,
    "constellation": "",
    "identity_type": 0,
    "identity_status": 0,
    "identity_desc": "",
    "identity_time": 0,
    "portal_type": 0,
    "portal_icon": "",
    "portal_url": "",
    "background_url": "https://xximg1.meitudata.com/6531090538999579649.png",
    "is_preset": 0,
    "be_like_count": 0,
    "be_favorites_count": 0,
    "pendants": [],
    "level": 0,
    "show_producer_level": 2,
    "template_feed_count": 0,
    "is_live": 0,
    "has_permission": 0,
    "has_shop_permission": 0,
    "is_authorize": 1,
    "card_item": [],
    "identity_card": "",
    "identity_new_status": 0,
    "identity_schema": "https://titan-h5.meitu.com/xiu-h5/authcard/index.html",
    "vip_type": 1,
    "show_shopping_cart": 0,
    "free_trial": 1
  }
}

$done({body:JSON.stringify(obj)});
// 
