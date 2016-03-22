"use strinct";
define(["./utils"],function(utils){
function get(token, url){
	return new utils._Promise(function(resolve,reject){
		utils.xhrReq(
			{ 	"url":gConfig.serverURL +url
				,"token":token 
			}
			,function(res){ resolve(JSON.parse(res));}
			,reject
		);
});}

return {
	"get": get
	,"getTimeline": function(token, timeline) {return get(token, "timelines/"+ timeline) }
	,"getPost": function(token, path) {return get(token, "posts/"+ path.split("/")[1]) }
	,"getUser": function(token, req) {return get(token, "users/" + req ) }
	,"get": function(token, timelien) {return get(token, timeline) }
	,"_getWhoami": function(token){
	return new utils._Promise(function(resolve,reject){
		utils.xhrReq( 
			{ 
				"url":gConfig.serverURL +"users/whoami"
				,"token":token 
			} 
			,function(res){ resolve(JSON.parse(res));}
			,reject
		);
	});}
}
})
