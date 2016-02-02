"use strict";

define( [],function(){
function _MUtils(v){
	this.cView = v;
}
_MUtils.prototype = {
	constructor: _MUtils
	,"digest":function(oData){
		var digest = _MUtils.prototype.digest;
		var oOut = new Object();
		var convs = {
			"attachment_file_name":{"out":"fileName","a":"copy"}
			,"attachments":{"out":""}
			,"avatar_url":{"out":"profilePictureMediumUrl","a":"copy"}
			,"comments":{"out":""}
			,"comments_count":{"out":""}
			,"created_at":{"out":"createdAt","a":"mutate","f":Date.parse}
			,"description":{"out":"","a":"copy"}
			,"display_name":{"out":"screenName","a":"copy"}
			//,"embeds":{"out":""}
			,"entries":{"out":"posts"}
			,"fresh_at":{"out":"updatedAt","a":"mutate","f":Date.parse}
			,"id":{"out":"","a":"copy"}
			,"is_public":{"out":"isPrivate","a":"mutate","f":function(fPub){ return !fPub; }}
			,"likes":{"out":"","a":"copy"}
			,"more_likes":{"out":"omittedLikes","a":"copy"}
			,"name":{"out":"username","a":"copy"}
			,"original_url":{"out":"url","a":"copy"}
			//,"post_id":{"out":"","a":"copy"}
			,"published_at":{"out":"updatedAt","a":"mutate","f":Date.parse}
			,"river":{"out":"timelines"}
			,"status":{"out":"isPrivate","a":"mutate","f":function(val){
				return ["public","disallow-robots","protected"].some(val)?"0":"1";
			}}
			,"text":{"out":"body","a":"copy"}
			,"thumb_url":{"out":"thumbnailUrl","a":"copy"}
			,"updated_at":{"out":"updatedAt","a":"copy"}
			,"user_id":{"out":"createdBy","a":"copy"}
			,"uuid":{"out":"id","a":"copy"}
		}
		Object.keys(oData).forEach(function(key){
			var val = oData[key];
			var conv = convs[key];
			if(typeof conv !== "undefined"){
				if (conv.out == "")conv.out = key;
				switch(conv.a){
				case "copy":
					oOut[conv.out] = val;
					break;
				case "mutate":
					oOut[conv.out] = conv.f(val);
					break;
				default: 
					oOut[conv.out] = Array.isArray(val)?val.map(digest):digest(val);
				}
				if (typeof conv.complete === "function" )
					conv.complete(oOut[conv.out]);
			}
		});
		return oOut;

	}
};
return _MUtils;
});
