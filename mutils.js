"use strict";

define( [],function(){
function _MUtils(v){
	this.cView = v;
}
_MUtils.prototype = {
	constructor: _MUtils
	,"digest":function(input){
		var aComments = new Array();
		var aAttachments = new Array();
		var convs = {
			"attachment_file_name":{"out":"fileName","a":"copy"}
			,"attachments":{"out":""
				,"post":function(atts){ 
					return atts.map(function(att){
						att.mediaType="image";
						aAttachments.push(att); 
						return att.id;
					});
				} 
			}
			,"avatar_url":{"out":"profilePictureMediumUrl","a":"mutate", "f":addHost}
			,"comments":{"out":"", "post":function(cmts){ 
				return cmts.map(function(cmt){aComments.push(cmt); return cmt.id;})
			} }
			,"comments_count":{"out":"","a":"copy"}
			,"created_at":{"out":"createdAt","a":"mutate","f":Date.parse}
			,"description":{"out":"","a":"copy"}
			,"display_name":{"out":"screenName","a":"copy"}
			//,"embeds":{"out":""}
			,"entries":{"out":"posts", "post":function(posts){
				posts.forEach(function(post){
					post.omittedComments = post.comments_count - post.comments.length;
					post.orig = "mokum.place"
				});
				return posts;
			}} 
			,"fresh_at":{"out":"updatedAt","a":"mutate","f":Date.parse}
			,"groups":{"out":"users", "pre":obj2arr}
			,"id":{"out":"","a":"copy"}
			,"is_public":{"out":"isPrivate","a":"mutate","f":function(fPub){ return !fPub; }}
			,"likes":{"out":"","a":"copy"}
			,"more_likes":{"out":"omittedLikes","a":"copy"}
			,"name":{"out":"username","a":"copy"}
			,"original_url":{"out":"url","a":"mutate", "f":addHost}
			//,"post_id":{"out":"","a":"copy"}
			,"published_at":{"out":"createdAt","a":"mutate","f":Date.parse}
			,"river":{"out":"timelines"}
			,"status":{"out":"isPrivate","a":"mutate","f":function(val){
				return ["public","disallow-robots","protected"].indexOf(val) != -1 ?"0":"1";
			}}
			,"text":{"out":"body","a":"copy"}
			,"thumb_url":{"out":"thumbnailUrl","a":"mutate", "f":addHost}
			,"updated_at":{"out":"updatedAt","a":"mutate","f":Date.parse}
			,"user_id":{"out":"createdBy","a":"copy"}
			,"users":{"out":"", "pre":obj2arr}
			,"uuid":{"out":"id","a":"copy"}
		}
		var out = convert(input);
		out["comments"] = aComments;
		out["attachments"] = aAttachments;
		return out;
		function convert(oData){
			var oOut = new Object();
			Object.keys(oData).forEach(function(key){
				var val = oData[key];
				var conv = convs[key];
				if(typeof conv !== "undefined"){
					if (typeof conv.pre === "function" )
						val = conv.pre(val);
					if (conv.out == "")conv.out = key;
					switch(conv.a){
					case "copy":
						oOut[conv.out] = val;
						break;
					case "mutate":
						oOut[conv.out] = conv.f(val);
						break;
					default: 
						if (Array.isArray(val)){
							if (Array.isArray( oOut[conv.out]))
								oOut[conv.out] = val.map(convert).concat(oOut[conv.out]);
							else oOut[conv.out] = val.map(convert);
						}else oOut[conv.out] = convert(val);
					}
					if (typeof conv.post === "function" )
						oOut[conv.out] = conv.post(oOut[conv.out]);
				}
			});
			return oOut;
		}
		function obj2arr(obj){
			return Object.keys(obj).map(function(key){
				return obj[key];
			});
		}
		function addHost(url){
			if(url.charAt(1) == "/")return url;
			return "//mokum.place" + url;
		}

	}
};
return _MUtils;
});
