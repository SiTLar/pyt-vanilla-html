'use strict';
var shortid = require("shortid");
(function(){

 var gIdCount = 0;
 var arrSkipKeys = ["tagName", "className","innerHTML"];
 function EventHost(){};
 EventHost.prototype = {
 	constructor: EventHost
	,toString: function(){
		var that = this;
		var out = new Object();
		Object.keys(that).forEach(function(id){
			out[id] = new Object();
			Object.keys(that[id]).forEach(function(ev){
				out[id][ev] = new Array();
				that[id][ev].forEach(function(eh){out[id][ev].push(eh())});
			});
		});
		return JSON.stringify(out);
	}
 }
 function Element (tag){
	this.tagName = tag;
	this.childNodes = new Array();
	this.style = new Object();
	this.eventHost = new EventHost();
 };
Element.prototype = {
 	constructor: Element
	,tagName: ""
	,className:""
	,childNodes: Array
	,innerHTML: ""
	,eventHost: null
	,style: null 
	,appendChild: function(newChild){
		if(newChild)this.childNodes.push(newChild);
		newChild.parentNode = this;
		if (this.childNodes.length == 1)this.firstChild = newChild;
		return newChild;
	}
	,insertBefore: function(newChild, child){
		var index  = this.childNodes.indexOf(child);
		if (index <= 0) index = 0; 
		else index--;
		this.childNodes.splice(index,0,newChild);
		newChild.parentNode = this;
		if (!index)this.firstChild = newChild;
		return newChild;
	}
	,removeChild: function(child){
		var index  = this.childNodes.indexOf(child);
		if (index < 0 )return null;
		var oraph = this.childNodes.splice(index,1)[0];
		if (this.childNodes.length > 0)this.firstChild = this.childNodes[0];
		else this.firstChild = null;
		return oraph;
	}
	,replaceChild: function(newChild, child){
		var index  = this.childNodes.indexOf(child);
		if (index < 0) return null;
		this.childNodes.splice(index,1,newChild);
		newChild.parentNode = this;
		if (!index)this.firstChild = newChild;
		return child;
	}
	,cloneNode: function(deep){
		var that = this;
		var out = new Element(that.tagName);
		out.className = that.className;
		if (deep == true){
			out.innerHTML = that.innerHTML;
			Object.keys(that).forEach(function(key){
				if((typeof that[key] == "string")||(typeof that[key] == "boolean")){
					out[key] = that[key];
				}
			});
			Object.keys(that.style).forEach(function(key){
				out.style[key] = that.style[key];
			});
			that.childNodes.forEach(
				function(child){out.appendChild(child.cloneNode(true));}
			);
		}
		return out;
	}
	,getElementById: function(name){
		if (this.id == name) return this;
		var out;
		if (this.childNodes.some(
			function(child){
				return out = child.getElementById(name) ;
		}))return out;
		else return null;
		
	}
	,getElementsByTagName: function(name){
		var out = new Array();
		if (this.tagName == name)out.push(this);
		return this.childNodes.reduce(
			function(out, child){
				return out.concat(child.getElementsByTagName(name));
		},out);
	}
	,getElementsByClassName: function(name){
		var out = new Array();
		if (this.className == name)out.push(this);
		return this.childNodes.reduce(
			function(out, child){
				return out.concat(child.getElementsByClassName(name));
		},out);
	}
	,addEventListener: function(e, handler){
		if (typeof this.id === "undefined") this.id = "eh-" + shortid.generate();
		if (typeof this.eventHost[this.id] === "undefined") 
			this.eventHost[this.id] = new Object();
		if (typeof this.eventHost[this.id][e] === "undefined") 
			this.eventHost[this.id][e] = new Array();
		this.eventHost[this.id][e].push(handler);
	}
	,removeEventListener: function(e, handler){
		if ((this.id == "")
			|| (typeof this.eventHost[this.id] === "undefined") 
			|| (typeof this.eventHost[this.id][e] === "undefined") 
		)
			return;
		var index =  this.eventHost[this.id][e].indexOf(handler);
		if (index < 0) return;
		this.eventHost[this.id][e].splice(index,1);
	}
	,writeStyle: function(){
		var that = this;
		return Object.keys(that.style).reduce(function(out, prop){
			return out + prop + ": " + that.style[prop] + "; ";
		},"");	
	}
	,collectEventHandling: function(){
		var that = this;
		that.childNodes.forEach(function(child){
			child.collectEventHandling();
			Object.keys(child.eventHost).forEach(function(key){
				that.eventHost[key] = child.eventHost[key]; 
			});
		});
	}
	,toString: function(){
		var that = this;
		var style =  this.writeStyle();
		var attributes = Object.keys(that).reduce(function(total,key){
			if((key == "hidden")&& !that[key]) return total;
			if((typeof that[key] == "string")
				&& !(arrSkipKeys.some(function(a){return a == key}))) 
				return total + " " + key + '="' + that[key]+'"';
			else if(typeof that[key] == "boolean")  return total + " " + key + "="+ that[key];
			else return total;
		},"");
		return "<" + this.tagName 
			+ (this["className"] != ""?(' class="' + this.className + '"' ) : "")
			+ attributes
			+ (style != ""?(' style="' + style + '"'):"")
			+ ">"
			+ this.innerHTML
			+ this.childNodes.reduce(
				function(out, child){ return out + child.toString();}
			,"")
			+ "</" + this.tagName + ">";
	}
 }	
Object.defineProperty( Element.prototype, "nextSibling"
	,{
		enumerable: false
		,get: function(){
			if ( typeof this.parentNode === "undefined") return null;
			var idx = this.parentNode.childNodes.indexOf(this) + 1;
			if (idx == this.parentNode.childNodes.length) return null;
			else return this.parentNode.childNodes[idx];
		}
	}
);
 var Document = function(){
	Element.call(this, "html");
	this.head = new Element("head");
	this.events = new Element("script");
	this.head.appendChild(this.events);
	this.body = new Element("body")
	this.appendChild(this.head);
	this.appendChild(this.body);

 };
 Document.prototype = Object.create(Element.prototype, {
	 createElement :  {value: function(tag){
	 	return new Element(tag);
	} }
	,toString : { value: function(){
		this.collectEventHandling();
		this.events.innerHTML = "window.gEvents = " + this.eventHost.toString()+ ";\n";
		if(typeof this.title !== "undefined"){
			var title = this.createElement("title");
			title.innerHTML = this.title;
			this.head.appendChild(title);
			delete this.title;
		}
		return Element.prototype.toString.call(this);
	}}

 } );
 Document.prototype.constructor = Document;
 module.exports =  Document;
})();
