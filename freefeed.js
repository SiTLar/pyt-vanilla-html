"use strinct";
define(["./utils", "./freefeed_rt"],function(utils, RtUpdate ){

return function(config){
	function get(token, url){
		return 	utils.xhrReq( {"url":config.serverURL +url ,"token":token });
	}
	return{
		"protocol":{
			"get": get
			,"getTimeline": function(token, timeline, skip) {
				return get(token, "timelines/"+ timeline + "?offset="+skip); 
			}
			,"getPost": function(token, path, arrOptions) {
				var id = path.split("/")[1];
				var likes = "0";
				var cmts = "0";
				if(Array.isArray(arrOptions))arrOptions.forEach(function(option){
					switch(option){
					case "likes":
						likes = "all";
						break;
					case "comments":
						cmts = "all";
					}
				});
				var suffix = "?maxComments=" + cmts + "&maxLikes=" + likes;
				return get(token, "posts/"+ id + suffix);
			}
			,"sendPost": function(token, postdata){
				return utils.xhrReq(
					{ 	"url": config.serverURL + "posts"
						,"token": token 
						,"method": "post"
						,"data": JSON.stringify(postdata)
						,"headers":{"Content-type":"application/json"}
					}
				);
			}
			,"editPost": function(token, id, postdata){
				return utils.xhrReq(
					{ 	"url": config.serverURL + "posts/"+id
						,"token": token 
						,"method": "put"
						,"data": JSON.stringify(postdata)
						,"headers":{"Content-type":"application/json"}
					}
				);
			}
			,"deletePost": function(token, id){
				return utils.xhrReq(
					{ 	"url": config.serverURL + "posts/"+id
						,"token": token 
						,"method": "delete"
					}
				);
			}
			,"switchCmts": function(token, id, action){
				return utils.xhrReq(
					{	"url":config.serverURL 
							+"posts/" + post.id 
							+ (action?"/disableComments":"/enableComments")
						,"token":token
						,"method":"post"
					}
				);	
			}
			,"sendHide": function(token, id, action){
				return utils.xhrReq(
					{ 	"url": config.serverURL 
							+ "posts/" + id + "/" 
							+ (action?"hide":"unhide")
						,"token": token 
						,"method": "post"
					}
				);
			}
			,"getUser": function(token, req) {return get(token, "users/" + req );}
			,"getSubs": function(token, req) {return get(token, "users/" + req );}
			,"doBan": function(token, username, action){
				return utils.xhrReq(
					{ 	"url": config.serverURL 
							+ "users/" + username + "/" 
							+ (action?"ban":"unban")
						,"token": token 
						,"method": "post"
					}
				);
			}
			,"get": function(token, timeline) {return get(token, timeline);}
			,"updProfile" : function(token, id, data){
				return utils.xhrReq(
					{ 	"url": config.serverURL + "users/" + id
						,"token": token 
						,"method": "put"
						,"data": JSON.stringify(data)
						,"headers":{"Content-type":"application/json"}
					}
				);
			}
			,"chngAvatar": function (token, file){
				var data = new FormData();
				data.append( "file",file) ;
				return utils.xhrReq(
					{ 	"url": config.serverURL + "users/updateProfilePicture"
						,"token": token 
						,"method": "post"
						,"data": data
					}
				);
			}
			,"_getWhoami": function(token){
				return utils.xhrReq( { "url":config.serverURL +"users/whoami" ,"token":token });
			}
			,"login":function(username, password){
				var data = "username="+utils.encodeURIForm(username)
				+ "&password="+utils.encodeURIForm(password);
				return utils.xhrReq(
					{ 	"url": config.serverURL + "session"
						,"headers":{"Content-type":"application/x-www-form-urlencoded"}
						,"method": "post"
						,"data":data
					}
				);
			}
			,"sendLike": function(token, id, action){
				return utils.xhrReq(
					{ 	"url": config.serverURL 
							+ "posts/" + id + "/" 
							+ (action?"like":"unlike")  
						,"token": token 
						,"method": "post"
					}
				);
			}
			,"sendComment": function(token, postdata){
				return utils.xhrReq(
					{ 	"url": config.serverURL + "comments"
						,"token": token 
						,"method": "post"
						,"data": JSON.stringify(postdata)
						,"headers":{"Content-type":"application/json"}
					}
				);
			}
			,"editComment": function(token, id, postdata){
				return utils.xhrReq(
					{ 	"url": config.serverURL + "comments/"+id
						,"token": token 
						,"method": "put"
						,"data": JSON.stringify(postdata)
						,"headers":{"Content-type":"application/json"}
					}
				);
			}
			,"deleteComment": function(token, id){
				return utils.xhrReq(
					{ 	"url": config.serverURL + "comments/"+id
						,"token": token 
						,"method": "delete"
					}
				);
			}
			,"reqSub": function(token,username ){
				return utils.xhrReq(
					{ 	"url": config.serverURL 
							+ "users/" + username 
							+ "/sendRequest/" 
						,"token": token 
						,"method": "post"
					}
				);
			}
			,"evtSub": function(token,username, subscribed ){
				return utils.xhrReq(
					{ 	"url": config.serverURL 
							+ "users/" + username 
							+ (subscribed?"/unsubscribe":"/subscribe") 
						,"token": token 
						,"method": "post"
					}
				);
			}
			,"reqResp": function(token, user, action){
				return utils.xhrReq(
					{ 	"url": config.serverURL 
							+ "users/" 
							+ action + "/" 
							+ user
						,"token": token 
						,"method": "post"
					}
				);
			}
			,"sendAttachment": function(token,file, filename){
				var data = new FormData();
				data.append( "name", "attachment[file]");
				data.append( "attachment[file]",file, filename);
				return utils.xhrReq(
					{ 	"url": config.serverURL + "attachments"
						,"token": token 
						,"method": "post"
						,"data": data
					}
				);
			}
		}
		,"parse":function (res){
			return JSON.parse(res);
		}
		,"oRT":RtUpdate
	};
};
});
