"use strict";
define("RtUpdate", ["./rt_actions"], function(RtHandler){
var RtUpdate = function (token, bump){
	var rt = this;
	rt.token = token;
	rt.connect();
	rt.handlers = new RtHandler(bump);
	rt.subscriptions = new Array();
}
RtUpdate.prototype = {
	  constructor: RtUpdate
	, on: false
	, timeout: 60000
	, pingInterval: undefined
	, pingTimeout: undefined
	, wSocket: undefined
	, token: undefined
	, ready: undefined
	, subscriptions: Array
	, handlers: Object
	, callback: undefined
	, connect: function(){
		var rt= this;
		rt.ready = new Promise(function(resolve,reject){
			var oReq = new XMLHttpRequest();
			clearTimeout(rt.pingTimeout);
			rt.pingTimeout = undefined;
			oReq.onload = function (){
				if(oReq.status < 400){
					var res = JSON.parse(oReq.response.slice(oReq.response.indexOf("{")));
					rt.wSocket = new WebSocket(gConfig.rtURL.replace("https","wss")+"?token="+rt.token+"&transport=websocket&sid=" + res.sid);
					rt.wSocket.onopen = function(){
						rt.wSocket.send("2probe"); 
						rt.wSocket.onmessage = function(e){
							if(e.data == "3probe")rt.wSocket.send("5");
							rt.on = true;
							rt.timeout = res.pingTimeout;
							rt.pingInterval = setInterval(function (){rt.ping();}, res.pingInterval);
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
			oReq.open("get",gConfig.rtURL+"?token="+rt.token+"&transport=polling&t="+Date.now(), true);
			oReq.send();	
		});
		return rt.ready;
	}
	, close: function(){
		var rt = this;
		if(typeof rt.callback !== "undefined")		
			rt.wSocket.removeEventListener("message", rt.callback);
		try{
			clearInterval(rt.pingInterval);
			rt.wSocket.close();	
		}catch(e){};
	}
	, ping: function (){
		var rt = this;
		rt.wSocket.send("2");
		rt.gotPing = false;
		if(rt.pingTimeout == undefined) rt.pingTimeout = setTimeout(rt.reconnect, rt.timeout, rt);
	}
	, reconnect: function (rt){
		rt.close();
		rt.connect().then(function(){rt.subscribe();});
	}
	, message: function(msg){
		var rt = this;
		if (msg.data == "3"){
			clearTimeout(rt.pingTimeout);
			rt.pingTimeout = undefined;
			return;
		}
		var idxPayload = msg.data.indexOf("[");
		if (idxPayload == -1) return;
		var type = msg.data.slice(0,idxPayload);
		var data = JSON.parse(msg.data.slice(idxPayload));
		if (Array.isArray(data) &&  (typeof rt.handlers[data[0]] !== "undefined")) rt.handlers[data[0]](data[1]);
	}
	, handle: function (msg,f){
		var rt = this;
		rt.handlers[msg] = f;
	}
	, subscribe: function (timeline){
		var rt = this;
		function sendSubReq(sub){
			rt.wSocket.send("42"+JSON.stringify(["subscribe", sub]));
		}
		if(rt.ready == undefined)return;
		if (timeline == undefined) 
			rt.ready.then(function(){rt.subscriptions.forEach(sendSubReq);});
		else{
			rt.subscriptions.push(timeline);
			rt.ready.then(function(){sendSubReq(timeline);});
		}
	}
} 
return RtUpdate;
});

