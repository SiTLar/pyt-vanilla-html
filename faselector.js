"use strict";
define("./faselector", [],function(){
var nodesT = new Object();
var cView;
var template = [
	{"c":"selector-fa-dialog", "cl":["user-popup"], "p":{"id":"selector-fa-dialog"}
	,"el":[
		{"c":"selector-fa-bar"
		,"el":[
			{"c":"selector-fa-title", "txt":"Select an icon"}
			,{"c":"up-close","e":{"click":["Actions","upClose"]}
			,"el":[
				{"t":"a"
				,"el":[
					{"c":"fa fa-times","t":"i"}
				]}
			]}
		]}
		,{"c":"selector-fa-container"}
	]}
	,{"c":"selector-fa-item"
	,"el":[
		{"c":"a", "t":"a", "e":{"click":["selector-fa","select-icon"]}
		,"el":[
			{"c":"i", "t":"i"}
		]}
	]}
];
var handlers = {
	"select-icon":function(e){
		var target = e.target.getNode(["p","selector-fa-item"]);
		target.cb(target["item-name"]);
	}

}
var icons = require("./icons.yml").icons
	.filter(function(icon){return icon.created <= 4.3;})
	.map(function(icon){return icon.id;});
function _FaSelector(v){
	
	this.icons = icons;
	v["selector-fa"] = handlers;
	cView = v;
	v.Common.genNodes(template).forEach(function(node){
		nodesT[node.classList[0]] = node;
	});
}
_FaSelector.prototype = {
	constructor: _FaSelector
	,"makeSelector": function(cb){
		var that = this;
		var node = nodesT["selector-fa-dialog"].cloneAll();
		that.icons.forEach(function(name){
			var el = nodesT["selector-fa-item"].cloneAll(); 
			el.getNode(["c","a"],["c","i"]).className = "fa fa-" + name;
			el["item-name"] = name;
			el.cb = cb;
			node.cNodes["selector-fa-container"].appendChild(el);
		});
		return node;
	}
}
return _FaSelector;
});
