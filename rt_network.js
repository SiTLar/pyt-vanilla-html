"use strict";

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
	, timeout: 6000
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
			oReq.onload = function (){
				if(oReq.status < 400){
					var res = JSON.parse(oReq.response.slice(oReq.response.indexOf("{")));
					rt.wSocket = new WebSocket(gConfig.rt.replace("https","wss")+"?token="+rt.token+"&transport=websocket&sid=" + res.sid);
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
							console.log("connected");
							resolve(); 
						};
					};
				} else {
					rt.pingTimeout = setTimeout(rt.reconnect, rt.timeout, rt);
					console.log(oReq);
					reject();
				}
			}
			oReq.open("get",gConfig.rt+"?token="+rt.token+"&transport=polling&t="+Date.now(), true);
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
		rt.pingTimeout = setTimeout(rt.reconnect, rt.timeout, rt);
	}
	, reconnect: function (rt){
		console.log("Reconnecting");
		rt.close();
		rt.connect().then( function(){rt.subscriptions.forEach(function(t){rt.subscribe(t);})});
	}
	, message: function(msg){
		var rt = this;
		if (msg.data == "3"){
			clearTimeout(rt.pingTimeout);
			return;
		}
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
		rt.subscriptions.push(timeline);
		if(rt.ready == undefined)return;
		rt.ready.then(function(){
			rt.wSocket.send("42"+JSON.stringify(["subscribe", {"timeline":[timeline]}]));
		});
	}
} 
