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
	,"getTimeline": function(token, timelien) {return get(token, "timelines/"+ timeline) }
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
