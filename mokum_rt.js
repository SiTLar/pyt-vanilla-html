"use strict";
define("RtUpdate", ["./rt_actions", "./utils"], function(RtHandler, utils){
var RtUpdate = function (context, bump){
	var rt = this;
	Object.keys(rt.defaults).forEach(function(key){
		rt[key] = JSON.parse(JSON.stringify(rt.defaults[key]));
	});
	rt.context = context;
	rt.handlers = new RtHandler(bump);
	rt.subscriptions = new Array();
}
RtUpdate.prototype = {
	  constructor: RtUpdate
	, defaults:{
		 on: false
		, timeout: 60000
		, pingInterval: null
		, pingTimeout: null
		, wSocket: null
		, ready: null
		, subscriptions:[] 
		, handlers: {}
		, callback: null
	}
	, connect: function(){
		var rt = this;
		rt.ready = new utils._Promise(function(resolve,reject){
			var oReq = new XMLHttpRequest();
			var cfg = gConfig.domains[rt.context.domain];
			clearTimeout(rt.pingTimeout);
			rt.pingTimeout = null;
			//console.log("Connecting");
			oReq.onload = function (){
				if(oReq.status < 400){
					var res = JSON.parse(oReq.response)[0];
					rt.clientId = res.clientId;
					rt.wSocket = new WebSocket(cfg.server.rtURL.replace("https","wss"));
					rt.wSocket.onopen = function(){
						rt.connectPing();
						rt.callback =  function (e){rt.message(e)};
						rt.wSocket.addEventListener("message",rt.callback);
						rt.timeout = res.advice.timeout*2;
						rt.on = true;
						rt.connectInterval = setInterval(
							function (){rt.connectPing();}
							,rt.timeout/2
						);
						rt.pingInterval = setInterval(
							function (){rt.ping();}
							,rt.timeout/4
						);
						resolve(); 
					};
				} else {
					clearTimeout(rt.pingTimeout);
					rt.pingTimeout = setTimeout(rt.reconnect, rt.timeout, rt);
					reject();
				}
			}
			oReq.open("POST",cfg.server.rtURL, true);
			oReq.setRequestHeader('Content-Type', 'application/json');
			oReq.send(JSON.stringify([{"channel":"/meta/handshake"
				,"version":"1.0"
				,"supportedConnectionTypes":["websocket"]
			}]));	
		});
		return rt.ready;
	}
	, close: function(){
		var rt = this;
		if(rt.callback)		
			rt.wSocket.removeEventListener("message", rt.callback);
		try{
			clearInterval(rt.pingInterval);
			clearInterval(rt.connectInterval);
			rt.wSocket.close();	
		}catch(e){};
	}
	, ping: function (){
		var rt = this;
		rt.wSocket.send("[]");
		rt.gotPing = false;
		if(!rt.pingTimeout) rt.pingTimeout = setTimeout(rt.reconnect, rt.timeout, rt);
	}
	, connectPing: function(){
		var rt = this;
		rt.wSocket.send( JSON.stringify([{
			"channel":"/meta/connect"
			,"clientId":rt.clientId
			,"connectionType":"websocket"
		}]));
	}
	, reconnect: function (rt){
		rt.close();
		rt.connect().then(function(){rt.subscribe();});
	}
	, message: function(msg){
		var rt = this;
		if (msg.data == "[]"){
			clearTimeout(rt.pingTimeout);
			rt.pingTimeout = null;
			return;
		}

		var idxPayload = msg.data.indexOf("[");
		if (idxPayload == -1) return;
		//var data = rt.context.api.parse(JSON.parse(msg.data).data);
		msg = JSON.parse(msg.data);
		//console.log(msg);	
		if(typeof msg[0].data === "undefined") return;
		var data = msg[0].data;
		if(typeof data.deleted !== "undefined"){
			rt.handlers["post:destroy"]({"meta":{"postId":data.deleted}}, rt.context);	
			return;
		}
		rt.process(data);
	}
	,"process": function(data){
		var rt = this;
		var cView = document.cView;
		data = rt.context.api.parse(data);
		var postId = [rt.context.domain,"post" ,data.posts.id].join("-");
		var nodePost = document.getElementById(postId);
		if (!nodePost){
			rt.handlers["post:new"](data, rt.context);
			return;
		}
		var newPost = data.posts;
		var myPost = nodePost.rawData;
		cView.Common.loadGlobals(data, rt.context);

		myPost.body = newPost.body;

		nodePost.getNode(["c","post-body"],["c","post-cont"]).innerHTML = rt.context.digestText(myPost.body);
		myPost.likes = newPost.likes;
		myPost.omittedLikes = newPost.omittedLikes;
		cView.Drawer.genLikes(nodePost);
		nodePost.rawData.updatedAt = Date.now();

		if(Array.isArray(newPost.comments))newPost.comments.forEach(function(cmt){
			var commentId = [rt.context.domain,"cmt" ,cmt].join("-");
			var nodeCmt = document.getElementById(commentId);
			if (nodeCmt)
				nodeCmt.parentNode.replaceChild(
					cView.Drawer.genComment.call(rt.context,cmt)
					,nodeCmt
				);
		});
			
		if(Array.isArray(myPost.comments)
		&&((myPost.comments.length+myPost.omittedComments) 
		< (newPost.comments.length+newPost.omittedComments))){
			newPost.comments.forEach(function(id){
				if(myPost.comments.indexOf(id) == -1 ){
					var cmt = data.comments.find(function(cmt){return cmt.id == id;});
					cmt.postId = newPost.id;
					rt.handlers["comment:new"]({
						"users":data.users
						,"comments":cmt
					},rt.context);
				}
			});	
		}

		//if ()

		//rt.handlers.unshiftPost(data, rt.context);
	}
	, subscribe: function (timeline){
		var rt = this;
		function sendSubReq(sub){
			rt.wSocket.send(JSON.stringify(	[{
					"channel":"/meta/subscribe"
					,"clientId":rt.clientId
					,"subscription":sub
				}]
			));
		}
		if(!rt.ready)rt.ready = rt.connect();
		if (typeof timeline === "undefined") 
			rt.ready.then(function(){rt.subscriptions.forEach(sendSubReq);});
		else{
			rt.subscriptions.push(timeline);
			rt.ready.then(function(){sendSubReq(timeline);});
		}
	}
	,"rtSubPost": function(data){
		this.subscribe("/rivers/" + data.timelines.id);
	}
	,"rtSubTimeline": function(data){
		this.subscribe("/rivers/" + data.timelines.id);
	}
} 
return RtUpdate;
});

