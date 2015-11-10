'use strict';
var shortid = require("shortid");
(function(){

 var gIdCount = 0;
 var arrSkipKeys = ["tagName", "className","innerHTML"];
 function Element (tag){
	this.tagName = tag;
	this.childNodes = new Array();
	this.style = new Object();
	this.eventHost = new Object();
	//this.id = "eh-" + shortid.generate();
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
		this.transferEvents(newChild);
		return newChild;
	}
	,insertBefore: function(newChild, child){
		var index  = this.childNodes.indexOf(child);
		if (index <= 0) index = 0; 
		else index--;
		this.childNodes.splice(index,0,newChild);
		newChild.parentNode = this;
		if (!index)this.firstChild = newChild;
		this.transferEvents(newChild);
		return newChild;
	}
	,removeChild: function(child){
		var index  = this.childNodes.indexOf(child);
		if (index < 0 )return null;
		var oraph = this.childNodes.splice(index,1)[0];
		if (this.childNodes.length > 0)this.firstChild = newChild;
		else this.firstChild = null;
		return oraph;
	}
	,replaceChild: function(newChild, child){
		var index  = this.childNodes.indexOf(child);
		if (index < 0) return null;
		this.childNodes.splice(index,1,newChild);
		newChild.parentNode = this;
		if (!index)this.firstChild = newChild;
		this.transferEvents(newChild);
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
		//if (typeof this.id === "undefined") this.id = "eh-" + shortid.generate();
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
			console.log(this.eventHost);
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
	,transferEvents: function(newChild){
		var that = this;
		Object.keys(newChild.eventHost).forEach(function(key){
			that.eventHost[key] = newChild.eventHost[key];
		});
		newChild.eventHost =  that.eventHost;
	}
	,toString: function(){
		var that = this;
		var style =  this.writeStyle();
		var attributes = Object.keys(that).reduce(function(total,key){
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
		this.events.innerHTML = "gEvents = " + JSON.stringify(this.eventHost);
		return Element.prototype.toString.call(this);
	}}

	,writeEventHandling : {value: function(){}}
 } );
 Document.prototype.constructor = Document;
 module.exports =  Document;
})();
