"use strinct";
define("./addons/translate",["../utils"],function(utils){
var cView;
var apiKey;
var nodesT = new Object();
var template = [
{"c":"settings"
, "children":[
	{"t":"h1", "txt":"&#35695; Translations"}
	,{"t":"p", "txt":"To use translations, you should obtain an API key from <a href=\"https://tech.yandex.com/key/form.xml?service=trnslr\">Yandex.Translate</a>"}
	,{"c":"sr-info", "txt":"No key set yet"}
	,{"t":"form", "e":{"submit":["addons-translate","setAPIKey"]}
	,"children":[
		{"c":"big-txt-input", "t":"input" ,"p":{"name":"api-key", "placeholder":"paste your key here"} }
		,{"t":"input", "p":{"type":"submit", "value":"use that key"}}
	]}
]}
,{"c":"control", "cl":["inline-control"]
,"children":[
	,{"c":"spacer","t":"span","txt":"-"}
	,{"c":"translate","t":"a","txt":"Translate","e":{"click":["addons-translate","translatePost"]}}
]}
,{"c":"display", "cl":["like-comm"], "t":"a", "e":{"click":["addons-like-comm","show"]}}
];
var handlers = {
	"translatePost": function(e){
		var host = e.target.getNode(["p","post"]);
		var label = cView.doc.createElement("span");
		label.innerHTML = "Translated";
		host.translated = true;

		e.target.parentNode.replaceChild(label, e.target);
		translate(host.getElementsByClassName("long-text"));
	}
	,"evtNewNode": function (e){
		var node = e.detail;
		if(!node)return;
		if (node.classList[0] == "post")
			return node.getElementsByClassName(["controls"])[0].appendChild(nodesT["control"].cloneAll());
		var nodePost = node.getNode(["p","post"]);
		if (nodePost.translated === true)
			translate(node.getElementsByClassName("long-text"));
	}
	,"evtUpdNode": function (e){
		var node = e.detail;
		if(!node)return;
		var nodePost = node.getNode(["p","post"]);
		if(nodePost.translated !== true) return;
		var victim;
		if (node.classList[0] == "post")
			victim = nodePost.getNode(["c","post-body"],["c","post-cont"]);
		else victim = node;
		translate(victim.getElementsByClassName("long-text"));
	}
	,"setAPIKey": function (e){
		e.preventDefault();
		e.stopImmediatePropagation();
		var key = utils.getInputsByName(e.target)["api-key"].value;
		var node = e.target.getNode(["p","settings"],["c","sr-info"]);
		node.hidden = false;
		node.className = "sr-info";
		node.innerHTML = "Checking the key";
		utils.xhr({
			"url":"https://translate.yandex.net/api/v1.5/tr.json/detect?hint=en&text=test&key="+key
		}).then(function(){
			node.innerHTML = "The key is OK";
			cView.localStorage.setItem("addons-translate-apikey", key);
		},function(){
			node.innerHTML = "The key seams to be invalide";
			node.className = "msg-error";
		});


	
	}
}
function makeSettings(){
	var node = nodesT["settings"].cloneAll();
	var key = cView.localStorage.getItem("addons-translate-apikey");
	if(key){
		utils.getInputsByName(node)["api-key"].value = key;
		node.cNodes["sr-info"].hidden = true;
	} 
	return node;
}
function translate (nodesHC){
	var cView = this.cView;
	var url = "https://translate.yandex.net/api/v1.5/tr.json/translate?"
		+"lang=en"
		+"&format=html"
		+"&options=1"
		+"&key=" + apiKey;

	var payload = "";
	var nodes = new Array(nodesHC.length); 
	var amp = "";
	var msg = '<p><a style="color: inherit;" href="http://translate.yandex.com/">Powered by Yandex.Translate</a></p>';
	for(var idx = 0; idx < nodesHC.length; idx++ ){
		nodes[idx] = nodesHC[idx];
		var node = nodes[idx];
		node.translated = true;
		var test = node.getElementsByClassName("folded")[0];
		if(typeof test !== "undefined" ){
			nodes[idx] = test;
			node = test;
		}
		payload += amp+"text=" + encodeURIComponent(node.innerHTML); 
		amp = "&";
	}
	utils.xhr({
		"url":url
		,"data":payload
		,"method":"post"
		,"headers":{"Content-Type": "application/x-www-form-urlencoded"}
	}).then(function(res){
		JSON.parse(res).text.forEach(function(txt,idx){
			nodes[idx].innerHTML += msg + txt;
		});
	});
}
return function(cV){
	cView = cV;
	cView["addons-translate"] = handlers;
	cView.Common.genNodes(template).forEach(function(node){
		nodesT[node.classList[0]] = node;
	});
	return {
		"run": function (){
			var key = cView.localStorage.getItem("addons-translate-apikey");
			if(!key) return utils._Promise.resolve();
			apiKey = key;

			cView.Common.genNodes(template).forEach(function(node){
				nodesT[node.classList[0]] = node;
			});
			var postCtrls = cView.doc.getElementsByClassName("post-controls");
			for (var idx = 0; idx < postCtrls.length; idx++)
				postCtrls[idx].cNodes["controls"].appendChild(nodesT["control"].cloneAll());
			
			
			function unfoldC (res){
				var nodePost = cView.doc.getElementById( res.posts.domain + "-post-" + res.posts.id);
				if(nodePost.translated === true) 
					translate(nodePost.getNode(["c","comments"]).getElementsByClassName("long-text"));
				return res;
			};
			var nodes = cView.doc.getElementsByClassName("comments-load");
			var arrNodes = new Array();
			for(var idx = 0; idx < nodes.length; idx++)
				arrNodes.push(nodes[idx].cNodes["a"]);
			utils.injectHandler("click", cView.Actions, "unfoldComm", unfoldC, arrNodes);
			
			function unfoldR (victim){
				if (victim.translated === true)
					translate([victim]);
				return victim;
			}
			var nodes = cView.doc.getElementsByClassName("unfold-readmore");
			arrNodes = new Array();
			for(idx = 0; idx < nodes.length; idx++)
				arrNodes.push(nodes[idx]);
			utils.injectHandler("click", cView.Actions, "unfoldReadMore", unfoldR, arrNodes);

			window.addEventListener("newNode", handlers.evtNewNode);
			window.addEventListener("updNode", handlers.evtUpdNode);
			return utils._Promise.resolve();
		}
		,"settings": function(){return makeSettings(cView);}
	}
};
});
