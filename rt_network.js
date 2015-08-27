"use strict";

var RtUpdate = function (token){
	var rt = this;
	rt.token = token;
	rt.handlers = new RtHandler();
	rt.ready = new Promise(function(resolve,reject){
		var oReq = new XMLHttpRequest();
		oReq.onload = function (){
			if(oReq.status < 400){
				var res = JSON.parse(oReq.response.slice(oReq.response.indexOf("{")));
				rt.wSocket = new WebSocket(gConfig.rt.replace("https","wss")+"?token="+token+"&transport=websocket&sid=" + res.sid);
				rt.wSocket.onopen = function(){
					rt.connected = true;
					rt.wSocket.send("2probe"); 
					rt.wSocket.onmessage = function(e){
						if(e.data == "3probe")rt.wSocket.send("5");
						setInterval(function (){rt.ping();}, res.pingInterval);
						rt.wSocket.onmessage = null;
						rt.wSocket.addEventListener("message", function (e){rt.message(e)});
						resolve(); 
					};
				};
			} else console.log(oReq);
		}
		oReq.open("get",gConfig.rt+"?token="+token+"&transport=polling&t="+Date.now(), true);
		oReq.send();	
	});
}
RtUpdate.prototype = {
	  constructor: RtUpdate
	, connected: false
	, wSocket: undefined
	, token: undefined
	, ready: undefined
	, handlers: Object
	, ping: function (){
		var rt = this;
		rt.wSocket.send("2");
	}
	, message: function(msg){
		var rt = this;
		var idxPayload = msg.data.indexOf("[");
		if (idxPayload == -1) return;
		var type = msg.data.slice(0,idxPayload);
		var data = JSON.parse(msg.data.slice(idxPayload));
		console.log(msg);	
		if (Array.isArray(data) &&  (typeof rt.handlers[data[0]] !== "undefined")) rt.handlers[data[0]](data[1]);
	}
	, handle: function (msg,f){
		var rt = this;
		rt.handlers[msg] = f;
	}
	, subscribe: function (timeline){
		var rt = this;
		if(rt.ready == undefined)return;
		rt.ready.then(function(){
			rt.wSocket.send("42"+JSON.stringify(["subscribe", {"timeline":[timeline]}]));
		});
	}
} 
