"use strict";

define("./addons/sidebar", [],function(){
function isLogged (cView){
	var domains = Object.keys(cView.contexts);
	return domains.some(function(domain){
		return cView.contexts[domain].token;
	});
}
function always(){return true;};
function genLinks (cView, a, head,tail){
	var linkHead = (typeof head !== "undefined")?head:"";
	var linkTail = (typeof tail !== "undefined")?tail:"";
	var div = cView.doc.createElement("div");
	var ahref = cView.doc.createElement("a");
	ahref.href = linkHead +a[0]+linkTail;
	ahref.innerHTML = a[1];
	div.appendChild(ahref);
	return div;
}

function populateSidebar(cView, nodeSidebar, elements){
	elements.forEach(function(elmt){
		if(!elmt.test(cView))return;
		var node = cView.gNodes["sidebar-emt"].cloneAll();
		node.cNodes["sb-emt-title"].innerHTML = elmt.title;
		elmt.content(cView).forEach(node.cNodes["sb-emt-content"].appendChild, node.cNodes["sb-emt-content"]);
		nodeSidebar.appendChild(node);
	});
}
var payload = [
	{"title":"Account"
		,"content":function(cView){
			if(!isLogged(cView)) return [cView.gNodes["sidebar-acc-anon"].cloneAll()]; 
			var domains = Object.keys(cView.contexts);
			var nodeMainAcc = cView.gNodes["sidebar-acc"].cloneAll();
			var mainContext;
			if(( typeof cView.contexts[gConfig.leadDomain] !== "undefined" )
			&& cView.contexts[gConfig.leadDomain].token) 
				mainContext = cView.contexts[gConfig.leadDomain];
			else domains.some(function(domain){
				var context = cView.contexts[domain];
				if(!context.token) return false;
				 mainContext = context;
				return true; 
			});
			mainContext.p.then(function(){
				var mainLogin = mainContext.gMe.users;
				nodeMainAcc.getNode(["c", "main-avatar"],["c","img"]).src = mainLogin.profilePictureMediumUrl;
				nodeMainAcc.getNode(["c", "info"]).innerHTML = mainLogin.link;
				nodeMainAcc.getNode(["c", "settings"], ["c", "edit-acc"]).href = gConfig.front + "settings/accounts"
			});
			return [nodeMainAcc];
		}
		,"test":always  
	}
	,{"title":"Search"
		,"content":function(cView){
			var input = cView.gNodes["search-input"].cloneAll();
			input.getElementsByTagName("form")[0].action = gConfig.front+"search";
			var arrSkipDomains = (new Array()).concat(cView.localStorage.getItem("skip_domains"));
			Object.keys(cView.contexts).forEach(function(domain){
				if(arrSkipDomains.indexOf(domain) != -1) return;
				var el = cView.doc.createElement("input");
				el.type = "hidden";
				el.value = domain;
				el.name = "d";
				input.getElementsByClassName("search-domains")[0].appendChild(el);

			});

			return [input].concat( 
				Object.keys(cView.contexts).map(
					function(domain){ 
						return [gConfig.domains[domain].search, domain]; 
					}
				).map(function(url){return genLinks(cView, url);})
			);
		}
		,"test":always  
	
	}
	,{"title":"Filters"
		,"content":function(cView){
			var linkHead = gConfig.front+"filter/";
			return [ ["me","My posts"]
				,["discussions","My discussions"]
				,["direct","Direct messages"]
			].map(function(a){return genLinks(cView, a,linkHead);});
		}
		,"test":isLogged	
	}
	,{"title":"Help"
		,"content":function(cView){
			var nodeBuild = cView.doc.createElement("div");
			nodeBuild.innerHTML = "<span class=\"sb-info\">"+___BUILD___+"</span>";
			return [ ["https://myfeed.rocks/about", "What's going on?"]
				,[gConfig.front+"as/FreeFeed/vanillaweb", "Feedback"]
				,["https://freefeed.net/about","FreeFeed"]
				,["https://myfeed.rocks/about#author","Author"]
			].map(function(a){
				var div = cView.doc.createElement("div");
				var ahref = cView.doc.createElement("a");
				ahref.href = a[0];
				ahref.innerHTML = a[1];
				div.appendChild(ahref);
				return div;
			}).concat(nodeBuild );
		}	
		,"test":always  
	}
	,{"title":"Groups"
		,"content":function(cView){
			var domains = Object.keys(cView.contexts);
			var groups = new Array();
			domains.forEach(function(domain){
				var context = cView.contexts[domain];
				var ids = new Object();
				context.ids.forEach(function(id){
					if (typeof  context.logins[id].data.users.subscriptions === "undefined")
						return;
					var subscriptions = new Object();
					context.logins[id].data.subscriptions.forEach(function(sub){
						subscriptions[sub.id]=sub;
					});
					context.logins[id].data.users.subscriptions.forEach(function(subid){
						var sub = subscriptions[subid];
						var group = context.gUsers[sub.user];
						if( (typeof group !== "undefined")
							&&(group.type == "group") 
							&& (sub.name == "Posts")){
							if(typeof group.updatedAt === "undefined")
								group.updatedAt = 0;
							if(ids[sub.user] !== true){
								groups.push({ 
									"link":group.link
									,"time":Number(group.updatedAt)
								});
								ids[sub.user] = true;
							}
						}
					});
				});
			});
			groups.sort(function(a,b){return b.time - a.time;});
			var length = groups.length;
			length = length <5 ? length:5;
			var out = new Array();
			for (var idx = 0; idx < length; idx++){
				var div = cView.doc.createElement("div");
				div.innerHTML = groups[idx].link + "<br/>" 
				+ "<span class=\"sb-info\">" 
				+cView.Utils.relative_time( groups[idx].time) 
				+ "</span>";
				out.push(div);
			}
			div = cView.doc.createElement("div");
			div.innerHTML = "<span class=\"sb-info\"><a href=\""
				+gConfig.front + "groups\" >All groups</a></span>"
			return out.concat(div);
		}
		,"test":isLogged	
	}
];
return function(cView){
	return{
		"run":function(){
			populateSidebar(
				cView
				,cView.doc.getElementById("sidebar")
				,payload
			);
		}
		,"settings":function(){return cView.doc.createElement("span");}
	}
}
});
