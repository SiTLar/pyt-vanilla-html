var Drawer = require("./draw.js");
global.Actions = require("./actions_srv.js");
var document = require("./dom_document.js")
var fs = require("fs");
var XMLHttpRequest =  require("xhr2");
global.window = new Object();
global.gUsers = new Object();
global.gUsersQ = new Object();
gUsers.byName = new Object();
global.gNodes = new Object();
global.gMe = undefined;//new Object();
global.gComments = new Object();
global.gAttachments  = new Object();
global.gFeeds = new Object();
global.autolinker = new Object();
global.gRt = new Object();
var gPrivTimeline = {"done":0,"postsById":{},"oraphed":{count:0},"noKey":{},"noDecipher":{},nCmts:0,"posts":[] };
var matrix  = new Object();
eval(fs.readFileSync('templates.json')+'');
eval(fs.readFileSync('config.json')+'');
module.exports = function(){
	window.localStorage ={
		setItem: function(){return;}
		,getItem: function(){return null;}
		,removeItem: function(){return null;}
	};
	window.sessionStorage = window.localStorage;
	window.setTimeout = function(){};
	global.gConfig = gConfig;
	genNodes(templates.nodes).forEach( function(node){ gNodes[node.className] = node; });
	Drawer.init(document, gNodes);
	fs.readFile("./data.json", function (err, content){
		
		Drawer.draw(JSON.parse(content));
		document.head.innerHTML = ' <link rel="stylesheet" type="text/css" href="/static/main.css" media="screen"/>';
		fs.writeFileSync("./out.html", document.toString());
	});
}
function genNodes(templates){
	var nodes = new Array();
	//oTemplates = JSON.parse(templates);
	templates.forEach(function(template){
		if (!template.t)template.t = "div";
		var node = document.createElement(template.t); 
		node.cloneAll = function(){
			var newNode = this.cloneNode(true); 
			Drawer.genCNodes(newNode, this);
			return newNode;
		};
		if(template.c)node.className = template.c; 
		if(template.children)
		genNodes(template.children).forEach(function(victim){
			node.appendChild(victim);
		});
		if(template.txt) node.innerHTML = template.txt;
		if(template.e) node.e = template.e;
		if(template.p) for( var p in template.p) node[p] =  template.p[p];
		nodes.push(node);
	} );
	return nodes;
}
function getContent(url){
	return new Promise(function(resolve,reject){
		var oReq = new XMLHttpRequest();
		oReq.onload = function(){
			if(oReq.status < 400) 
				resolve(JSON.parse(oReq.response));
			else{
				if (oReq.status==401)
					{
						deleteCookie("token");
						try {localStorage.removeItem("gMe");}catch(e){
						
							window.localStorage ={
								setItem: function(){return;}
								,getItem: function(){return null;}
								,removeItem: function(){return null;}
							};
							window.sessionStorage = window.localStorage;
						};
						location.reload();
					}
				if(auth())
					document.getElementsByTagName("body")[0].appendChild(gNodes["controls-user"].cloneAll());
				var nodeError = document.createElement("div");
				nodeError.className = "error-node";
				nodeError.innerHTML = "Error #"+ oReq.status + ": " + oReq.statusText;
				try{ 
					var res = JSON.parse(this.response);
					nodeError.innerHTML += "<br>"+res.err;
				}catch(e){};
				document.getElementsByTagName("body")[0].appendChild(nodeError);
				reject();
			}
		};
		
		oReq.open("get",url,true);
		oReq.setRequestHeader("X-Authentication-Token", gConfig.token);
		oReq.send();
	});
}

