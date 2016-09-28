"use strict";
define("./addons/linkcups",["../utils"],function(utils){
var cView;

function linkCups (nodePost){
	var cmtsHC = nodePost.getElementsByClassName("comment");
	var loadIdx = cmtsHC.length;
	var idx;
	for(idx = 0; idx < cmtsHC.length; idx++){
		if(cmtsHC[idx].classList.contains("comments-load")){
			loadIdx = idx;
			break;
		}
	}

	idx = cmtsHC.length;
	while(idx--){
		if( (cmtsHC[idx].hidden === true )|| (cmtsHC[idx].cups === true)) continue;
		cmtsHC[idx].cups = true;
		var cups = new Object();
		var content = cmtsHC[idx].getElementsByClassName("long-text")[0];
		if(typeof content === "undefined") continue;
		var matches = content.innerHTML.match(/[\^\u8593]+/);
		if(Array.isArray(matches))matches.forEach(function(match){
			var target =  idx-match.length;
			if( ( (idx > loadIdx)&&( (target) <= loadIdx) )||cmtsHC[target].hidden )
				return;
			cups[match] = cmtsHC[target];
		});
		Object.keys(cups).forEach(function(cup){
			var re = new RegExp(cup.replace(/\^/g,"\\x5e"),"g");
			content.innerHTML = content.innerHTML.replace(re
				,"<span class=\"cups_"
					+cup.length
					+"\">$&</span>"
			);
			var spans = cmtsHC[idx].getElementsByClassName("cups_"+ cup.length);
			for(var s = 0; s < spans.length; s++)
				addHighlightEvts(spans[s],cups[cup]);
		});
	}
}
function addHighlightEvts (host, target){
	function on(){host.classList.add("highlighted");target.classList.add("highlighted");}
	function off(){host.classList.remove("highlighted");target.classList.remove("highlighted");}
	host.addEventListener("mouseover",on );
	host.addEventListener("mouseout", off);
	host.addEventListener("click",function(){on();setTimeout(off, 1000)});
}
var handlers = {
	"evtNewNode":function(e){
		var arrNodes = e.detail;
		if(!arrNodes)return;
		var posts = new Object();
		arrNodes = Array.isArray(arrNodes)?arrNodes:[arrNodes];
		arrNodes.forEach(function(node){
			switch(node.classList[0]){
			case "post":
				posts[node.id] = node;
				break;
			case "comment":
				var post = node.getNode(["p","post"]);
				posts[post.id] = post;
				break;
			}
		});
		Object.keys(posts).forEach(function(id){linkCups(posts[id])});
	}
	,"evtUpdNode":function(e){
		var node = e.detail;
		if(!node||(node.classList[0] !== "comment"))
			return;
		node.cups = false;
		linkCups(node.getNode(["p","post"]));

	}

}
return function(cV){
	cView = cV;
	cView["addons-linkcups"] = handlers;
	return {
		"run": function (){
			var nodesPosts = document.getElementsByClassName("post");
			for ( idx = 0; idx < nodesPosts.length; idx++)
				linkCups(nodesPosts[idx]);

			window.addEventListener("newNode", handlers.evtNewNode);
			window.addEventListener("updNode", handlers.evtUpdNode);
			return utils._Promise.resolve();
		}
		,"settings":function(){return cView.doc.createElement("span");}
	}
};
});
