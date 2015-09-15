'use strict';
var util = require('util');
(function(){

 var gIdCount = 0;
 var gEventHandling = new Object();
 function Element (tag){
	this.tagName = tag;
	this.parentNode = null;
	this.childNodes = new Array();
	this.style = new Object();
 };
Element.prototype = {
 	constructor: Element
	,tagName: ""
	,childNodes: Array
	,innerHTML: ""
	,className: ""
	,parentNode: null
	,id: ""
	,style: {}
	,appendChild: function(newChild){
		if(newChild)this.childNodes.push(newChild);
		newChild.parentNode = this;
		return newChild;
	}
	,insertBefore: function(newChild, child){
		var index  = this.childNodes.indexOf(child);
		if (index <= 0) index = 0; 
		else index--;
		this.childNodes.splice(index,0,newChild);
		newChild.parentNode = this;
		return newChild;
	}
	,removeChild: function(child){
		var index  = this.childNodes.indexOf(child);
		if (index < 0 )return null;
		return this.childNodes.splice(index,1)[0];
	}
	,replaceChild: function(newChild, child){
		var index  = this.childNodes.indexOf(child);
		if (index <= 0) return null;
		this.childNodes.splice(index,1,newChild);
		newChild.parentNode = this;
		return child;
	}
	,cloneNode: function(deep){
		var out = new Element(this.tagName);
		out.className = this.className;
		if (deep == true){
			out.innerHTML = this.innerHTML;
			Object.keys(this.style).forEach(function(key){
				out.style[key] = this.style[key];
			});
			out.childNodes = this.childNodes.map(
				function(child){return child.cloneNode(true);}
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
		if (this.id == "") this.id = "eh-" + gIdCount++;
		if (typeof gEventHandling[this.id] === "undefined") 
			gEventHandling[this.id] = new Object();
		if (typeof gEventHandling[this.id][e] === "undefined") 
			gEventHandling[this.id][e] = new Array();
		gEventHandling[this.id][e].push(handler);
	}
	,removeEventListener: function(e, handler){
		if ((this.id == "")
			|| (typeof gEventHandling[this.id] === "undefined") 
			|| (typeof gEventHandling[this.id][e] === "undefined") 
		)
			return;
		var index =  gEventHandling[this.id][e].indexOf(handler);
		if (index < 0) return;
		gEventHandling[this.id][e].splice(index,1);
	}
	,writeStyle: function(){
		var that = this;
		return Object.keys(this.style).reduce(function(out, prop){
			return out + prop + ": " + that[prop] + "; ";
		},"");	
	}
	,toString: function(){
		var style =  this.writeStyle();

		return "<" + this.tagName + " "
			+ (this.className !=""? ('class="' + this.className + '" '):"")
			+ (this.id != ""?("id="+this.id):"") 
			+ (style != ""?(' style="' + style + '"'):"")
			+ (this.value?(' value="'+this.value+'"'):"") 
			+ " >"
			+ this.innerHTML
			+ this.childNodes.reduce(
				function(out, child){ return out + child.toString();}
			,"")
			+ "</" + this.tagName + ">";
	}
 }	
 var Document = function(){
	Element.call(this, "html");
	this.appendChild(this.head);

	this.appendChild(this.body);

 };
 Document.prototype = Object.create(Element.prototype, {
	 head : {value: new Element("head")}
	 ,body : {value:new Element("body") }
	 ,createElement :  {value: function(tag){return new Element(tag);}}
	 ,writeEventHandling : {value: function(){}}
 } );
 Document.prototype.constructor = Document;
 module.exports = new Document();
})();
