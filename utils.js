"use strinct";
define([], function(){
function args2Arr(){
	//.length is just an integer, this doesn't leak
	//the arguments object itself
	var args = new Array(arguments.length);
	for(var i = 0; i < args.length; ++i) {
	//i is always valid index in the arguments object
		args[i] = arguments[i];
	}
	return args;
}
function _PromiseAll(arr){
	var that = this;
	Object.keys(that.defaults).forEach(function(key){
		that[key] = JSON.parse(JSON.stringify(that.defaults[key]))
	});
	that.count = arr.length;
	arr.forEach(function(promise, idx){
		function success(res){that.success(res,idx);};
		function fail(res){that.fail(res);};
		promise.then(success, fail);
	});	
}
_PromiseAll.prototype = {
	constructor: _PromiseAll
	,"defaults":{
		"count": 0
		,"compleated":false
		,"failed":false
		,"fails": []
		,"reses": []
		,"resolves": []
		,"rejects": []
		,"thens":[]
	}
	,"success": function(data,idx){
		this.reses[idx] = data;
		if (--this.count)return;
		this.compleated = true;
		this.done();
	}
	,"fail": function(res){
		this.failed = true;
		this.drop(res);
	}
	,"done": function(){
		if(this.failed) return;
		while(this.thens.length)
			this.thens.pop()(this.reses);
	}
	,"drop": function(res){
		while(this.rejects.length)
			this.rejects.pop()(res);
	}
	,"then":function(resolve, reject){
		if (typeof reject === "function"){
			if(this.failed) return reject(this.fails);
			else this.rejects.push(reject);
		}
		if(this.failed) return;
		if(this.reses.length)resolve(this.reses);
		else this.thens.push(resolve);
	}

}
function _Promise(cb){
	var that = this ;
	Object.keys(that.defaults).forEach(function(key){
		that[key] = JSON.parse(JSON.stringify(that.defaults[key]))
	});
	function resolve(res){that.resolve(res);}
	function reject(res){that.reject(res);}
	setTimeout(function (){cb(resolve,reject)});
}
_Promise.prototype = {
	constructor:_Promise
	,"defaults":{
		"resolves":[]
		,"rejects":[]
		,"done":false
	}
	,"then":function(resolve, reject){
		if (typeof reject === "function"){
			if(typeof this.fail !== "undefined") 
				return reject(this.fail);
			else this.rejects.push(reject);
		}
		if(this.done )resolve(this.res);
		else this.resolves.push(resolve);
	}
	,"resolve":function(res){
		this.done = true;
		this.res = res;
		while(this.resolves.length)
			(this.resolves.pop())(this.res);
	}
	,"reject":function(res){
		this.fail = res;
		while(this.rejects.length)
			this.rejects.pop()(this.fail);
	}
}
return {
	/*source: http://stackoverflow.com/a/7516652 */
	"relative_time": function(date) {
		var cView = this.cView;
	/*	if (!date_str) {return;}
		//date_str = $.trim(date_str);
		date_str = date_str.replace(/\.\d\d\d+/,""); // remove the milliseconds
		date_str = date_str.replace(/-/,"/").replace(/-/,"/"); //substitute - with /
		date_str = date_str.replace(/T/," ").replace(/Z/," UTC"); //remove T and substitute Z with UTC
		date_str = date_str.replace(/([\+\-]\d\d)\:?(\d\d)/," $1$2"); // +08:00 -> +0800*/
		var parsed_date = new Date(date);
		var relative_to = (arguments.length > 1) ? arguments[1] : new Date(); //defines relative to what ..default is now
		var delta = parseInt((relative_to.getTime()-parsed_date)/1000);
		delta=(delta<2)?2:delta;
		var r = '';
		if (delta < 60) {
			r = delta + ' seconds ago';
		} else if(delta < 120) {
			r = 'a minute ago';
		} else if(delta < (45*60)) {
			r = (parseInt(delta / 60, 10)).toString() + ' minutes ago';
		} else if(delta < (2*60*60)) {
			r = 'an hour ago';
		} else if(delta < (24*60*60)) {
			r = '' + (parseInt(delta / 3600, 10)).toString() + ' hours ago';
		} else if(delta < (48*60*60)) {
			r = 'a day ago';
		} else if (delta < (24*60*60*30)) {
			r = (parseInt(delta / 86400, 10)).toString() + ' days ago';
		} else{
			r = (parseInt(delta / 2592000, 10)).toString() + ' months ago';
		}
		return 'about ' + r;
	}
	/**********************************************/
	,"args2Arr": function(){return args2Arr.apply(this, arguments);}
	,"xhrReq": function(o, callback, fail ){
		fail = typeof fail !== "undefined" ? fail : function(){return;};
		var method = typeof o.method  !== "undefined"? o.method : "get";
		var oReq = new XMLHttpRequest();
		oReq.open(method ,o.url , true);
		if(typeof o.token !== "undefined" )
			oReq.setRequestHeader("X-Authentication-Token",o.token);
		if(typeof o.headers !== "undefined" ) Object.keys(o.headers).forEach(function (header){
			oReq.setRequestHeader(header,o.headers[o.headers])
		});
		oReq.onload = function(){
			if(oReq.status < 400) callback(oReq.response);
			else fail({"code":oReq.status, "data":oReq.response});
		}
		if (typeof o.data  !== "undefined")  oReq.send(data);
		else  oReq.send();
	}
	,"getNode":function(node){
		var arrPath =  args2Arr.apply(this,arguments);
		arrPath.shift();
		arrPath.forEach(function(step){
			if (node.className == step[1])return;
			var className = step[1];
			switch(step[0]){
			case "p":
				do node = node.parentNode; 
				while(node.classList[0] != className);
				break;
			case "c":
				node = node.cNodes[className];
				break;
			}
		});
		return node;

	}
	,"getInputsByName": function(node){
		var oInputs = new Object();
		var nodes = node.getElementsByTagName("input");
		for(var idx = 0; idx < nodes.length; idx++){
			var input = nodes[idx];
			oInputs[input.name] = input;
		}
		return oInputs;
	}
	,"setChild": function (node,name, newNode){
		if(typeof node.cNodes === "undefined")
			node.cNodes = new Object();
		if(typeof node.cNodes[name] !== "undefined") 
			node.replaceChild(newNode, node.cNodes[name]);
		else node.appendChild(newNode);
		node.cNodes[name] = newNode;
		return newNode;
	}
	,"chkOverflow":function(victim){
		var test = victim.cloneNode(true);
		test.style.opacity = 0;
		test.style.position = "absolute";
		test.style.display = "block";
		victim.parentNode.appendChild(test);
		test.style.width = victim.clientWidth;
		var ret = victim.clientHeight < test.clientHeight;
		victim.parentNode.removeChild(test);
		return ret;
	}
	,"_Promise": _Promise
	,"_PromiseAll":_PromiseAll
}
});
