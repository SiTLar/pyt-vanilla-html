"use strict"

define([],function(){
	function _Context(domain, v){
		this.domain = domain;
		this.cView = v;
		v.contexts[domain] = this;
	}
	_Context.prototype = {
		constructor:_Context
		,"gUsers": { "byName":{}}
		,"gUsersQ": {}
		,"gComments": {}
		,"gAttachments": {}
		,"gFeeds": {}
		,"gRt": {}
		,"initRt": function(){
			var cView = this;
			var bump = cView.localStorage.getItem("rtbump");
			this.gRt = new RtUpdate(this.token, bump);
			this.gRt.subscribe(this.rtSub);
		}
		,get "gMe"(){
			var ids = Object.keys(this.logins);
			if(ids.length == 1)return this.logins[ids[0]].data;
			if((this.mainId == "")||(ids.length == 0))return null;
			return this.logins[this.mainId].data;
		}
		,get "ids"(){
			var ids = Object.keys(this.logins);
			if (!ids.length) return null;
			return ids;
		}
	}
	function _cView(){}
	_cView.prototype = {
		constructor: _cView
		,"contexts":{ }
		,"gEmbed": {}
		,"gNodes": {}
		,"logins": []
		,"mainId": ""
		,"rtSub" : {}
	};
	function init(){};
	return {
		"cView":_cView
		,"context":_Context
		,"init":init
		,"router":router
	}
});
