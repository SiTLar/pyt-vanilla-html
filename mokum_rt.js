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
			var cfg = gConfig.domains[rt.conext.domain];
			clearTimeout(rt.pingTimeout);
			rt.pingTimeout = null;
			oReq.onload = function (){
				if(oReq.status < 400){
					var res = JSON.parse(oReq.response)[0];
					rt.clientId = res.rt.clientId;
					rt.wSocket = new WebSocket(cfg.server.rtURL.replace("https","wss"));
					rt.wSocket.onopen = function(){
						rt.wSocket.send( JSON.stringify([{
							"channel":"/meta/connect"
							,"clientId":rt.clientId
							,"connectionType":"websocket"
						}]));

						rt.wSocket.onmessage = function(e){
							rt.on = true;
							rt.timeout = res.pingTimeout;
							rt.pingInterval = setInterval(
								function (){rt.ping();}
								, rt.timeout
							);
							rt.wSocket.onmessage = null;
							rt.callback =  function (e){rt.message(e)};
							rt.wSocket.addEventListener("message",rt.callback);
							resolve(); 
						};
					};
				} else {
					clearTimeout(rt.pingTimeout);
					rt.pingTimeout = setTimeout(rt.reconnect, rt.timeout, rt);
					reject();
				}
			}
			oReq.open("POST",cfg.server.rtURL, true);
			oReq.send(JSON.steingify([{"channel":"/meta/handshake"
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
			rt.wSocket.close();	
		}catch(e){};
	}
	, ping: function (){
		var rt = this;
		rt.wSocket.send("[]");
		rt.gotPing = false;
		if(!rt.pingTimeout) rt.pingTimeout = setTimeout(rt.reconnect, rt.timeout, rt);
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
		var data = rt.context.api.parse(JSON.parse(msg.data).data);
		console.log(data);
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
	,"rtSubPost": function(id){
		this.subscribe({"post":[id]});
	}
	,"rtSubTimeline": function(data){
		this.subscribe({"timeline":[data.timelines.id]});
	}
} 
return RtUpdate;
});

