"use strict";
var gRoutes = require("json!./routes.json");
function is(val){return typeof val !== "undefined";};
var chk = {
	"token":function(contexts){
		Object.keys(contexts).forEach(function(domain){
			if (!contexts[domain].token)
				delete contexts[domain];
		});
		return  Object.keys(contexts).length?null:"token";
	}
	,"leadContext":function(contexts){
		if (Object.keys(contexts).length > 1){
			var leadContext = new Object();
			leadContext[gConfig.leadDomain] = contexts[gConfig.leadDomain];
			contexts = leadContext;
		}
		return null;
	}
}
function some(_Promise,arr ){
	return new _Promise(function(resolve, reject){
		var count = arr.length;
		var failed = true;
		if(!count)resolve();
		var reses = new Array(count);
		var failes = new Array(count);
		function alldone(ok, data,idx){
			if (ok) {
				failed = false;
				reses[idx] = data;
			}else failes[idx] = data;
			if (--count)return;
			(!failed)?resolve(reses):reject(failes);
		}

		arr.forEach(function(item, idx){
			function success(res){alldone(true, res,idx);};
			function fail(res){alldone(false, res ,idx);};
			if( typeof item.then !== "function")item = _Promise.resolve(item);
			item.then(success, fail);
		});	
	
	});
}

function mixedTimelines (cView, contexts, prAllT,prAllC){
	return cView.Utils._Promise.all([prAllT,prAllC]).then( function (res){
		var domains = Object.keys(contexts);
		var posts = new Array();
		cView.doc.getElementById("loading-msg").innerHTML = "Building page";
		res[0].forEach(function(data,idx){
			if(typeof data === "undefined" )return;
			var context = contexts[domains[idx]];
			cView.Common.loadGlobals( data, context);
			if(typeof data.posts !== "undefined" ){
				data.posts.forEach(function(post){
					post.domain = domains[idx];
				});
				posts = posts.concat(data.posts);
			}
			context.timelineId = data.timelines.id;
			if(JSON.parse(cView.localStorage.getItem("rt"))) 
				context.rtSubTimeline(data);
		});
		posts = undup(cView, posts);
		posts.sort(function(a,b){return b.updatedAt - a.updatedAt;}); 
		cView.Drawer.drawTimeline(posts,contexts);
		cView.Drawer.updateReqs();
	});
}
function undup (cView, posts){
	posts.forEach(function(post,idx){
		post.sign = cView.hasher.of(post.body);
	});
	//var hashes = posts.map(function(post){return hash.of(post.body);});
	var duplicates = new Object();
	for(var idx = 0; idx < posts.length-1; idx++){
		if(posts[idx].body.length < cView.minBody) continue;
		for(var v = idx+1; v < posts.length; v++){
			if(posts[v].body.length < cView.minBody) continue;
			if( cView.hasher.similarity(posts[idx].sign,posts[v].sign)>cView.threshold){
				var dups;
				if (is(duplicates[idx]))dups = duplicates[idx];
				else if (is(duplicates[v]))dups = duplicates[v];
				else dups = new Object();
				dups[idx] = true;
				dups[v] = true;
				duplicates[idx] = duplicates[v] = dups;
			}
		}
	}
	Object.keys(duplicates).forEach(function(idx){
		idx = parseInt(idx);
		if (!is(duplicates[idx]))return;
		posts.push(
			cView.Common.metapost(
				Object.keys( duplicates[idx]).map(function(v){
					return posts[parseInt(v)];
				}).filter(function(post){return post != null;})
			)
		);
		Object.keys(duplicates[idx])
		.forEach(function(v){
			v = parseInt(v);
			delete duplicates[v];	
			posts[v] = null;
		});
	});
	return posts.filter(function(post){return post != null;});
}
define("./router",[],function(){
	function _Router(v){
		this.cView = v;
	};
	_Router.prototype = {
		"route":function(contexts, path){
			var cView = this.cView;
			if (cView.doc.title == "") cView.doc.title = "Feeds";
			if (path.indexOf("#") != -1 )
				path = path.substr(0,path.indexOf("#"));
			var arrPath = path.split("/").filter(function(str){return str != "";});
			var step = gRoutes;
			for(var idx = 0; idx < arrPath.length; idx++){
				var txtStep = arrPath[idx];
				if (is(step.req) && chk[step.req](contexts))
					return new cView.Utils._Promise.reject(chk[step.req](contexts));

				if(is(step.reroute))
					return cView[step.reroute[0]][step.reroute[1]](contexts, path);
				if (is(step.vals) && is(step.vals[txtStep]))
					step = step.vals[txtStep];
				else if (is(step.default)) step = step.default;
			}
			if (is(step.default)) step = step.default;
			if(is(step.dest)){
				cView.doc.getElementById("loading-msg").innerHTML = "Loading content";
				if((step.dest.length == 3)&& chk[step.dest[2]](contexts) )
					return new cView.Utils._Promise.reject(chk[step.dest[2]](contexts));
				return cView[step.dest[0]][step.dest[1]](contexts, path);
			}
			return new cView.Utils._Promise.reject();
		}
		,"directs":function(contexts){
			var cView = this.cView;
			return new cView.Utils._Promise(function(resolve,reject){
				var nodeAddPost = cView.gNodes["new-post"].cloneAll();
				var body = cView.doc.getElementById("container");
				body.appendChild(nodeAddPost);
				var domains = Object.keys(contexts);
				var context = contexts[gConfig.leadDomain];
				if (!is(context))context = contexts[domains[0]];
				context.p.then(function () {
					cView.Drawer.genDirectTo(nodeAddPost
						,context.gMe);
				});
				cView.Router.timeline(contexts, "filter/directs").then(function(){
					body.cNodes["pagetitle"].innerHTML = "Direct messages";
					cView.doc.title += ": Direct messages";
					resolve();
				},reject);
			});
		}
		,"routeContext":function(contexts, path){
			var cView = this.cView;
			var arrPath = path.split("/").filter(function(str){return str != "";});
			var singleContext = new Object();
			singleContext[arrPath[1]] = contexts[arrPath[1]];
			cView.doc.title = arrPath[1];
			var newPath = arrPath.slice(2).join("/"); 
			return this.route(singleContext, (newPath != "")?newPath:"home");
		}
		,"routeHome":function(contexts){
			var cView = this.cView;
			return new cView.Utils._Promise(function(resolve,reject){
				var nodeAddPost = cView.gNodes["new-post"].cloneAll();
				var body = cView.doc.getElementById("container");
				body.appendChild(nodeAddPost);
				var domains = Object.keys(contexts);
				var mainContext = (domains.indexOf(gConfig.leadDomain) != -1)? 
					contexts[gConfig.leadDomain]:contexts[domains[0]];
				mainContext.p.then(function () {
					cView.Drawer.genPostTo(nodeAddPost
						,null
						,mainContext.gMe);
				});
				cView.Router.timeline(contexts, "home" ).then(resolve,reject);
			});
		}
		,"routeMe": function(contexts, path){
			var cView = this.cView;
			var nodeAddPost = cView.gNodes["new-post"].cloneAll();
			var domains = Object.keys(contexts);
			var body = cView.doc.getElementById("container");
			var mainContext = (domains.indexOf(gConfig.leadDomain) != -1)? 
				contexts[gConfig.leadDomain]:contexts[domains[0]];
			mainContext.p.then(function () {
				cView.Drawer.genPostTo(nodeAddPost
					,null
					,mainContext.gMe);
			});
			body.appendChild(nodeAddPost);
			cView.doc.getElementById("container").cNodes["pagetitle"].innerHTML = path;
			cView.doc.title +=": " + path;
			var prContxt = new Array();
			var prConts = new Array();
			domains.forEach(function(domain){
				var context = contexts[domain];
				prContxt.push(context.p);
				prConts.push(context.api.getTimeline(
					context.token
					,context.gMe.users.username
					,cView.skip
				));
			});
			var prAllT = cView.Utils._Promise.all(prConts);
			var prAllC = cView.Utils._Promise.all(prContxt);
			return mixedTimelines (cView, contexts, prAllT,prAllC);
		}
		,"subscribers":function(contexts, path){
			var cView = this.cView;
			return cView.Router.subs(contexts, path, cView.Drawer.drawSubs); 
		}
		,"subscriptions":function(contexts, path){
			var cView = this.cView;
			return cView.Router.subs(contexts, path, cView.Drawer.drawFriends); 
		} 
		,"subs":function(contexts, path, fn){
			var cView = this.cView;
			var context = contexts[Object.keys(contexts)[0]];
			return cView.Utils._Promise.all([ context.api.getSubs(context.token,path),context.p ])
			.then(function(res){ 
				cView.Common.loadGlobals(res[0], context);
				var body = cView.doc.getElementById("container");
				body.cNodes["pagetitle"].innerHTML = path;
				cView.doc.title = "@"+path.split("/")[0]+ "'s  " + path.split("/")[1] + " ("+context.domain+")";
				fn.call(cView, res[0],context); 
			});
		}
		,"groups":function(contexts, path){
			var cView = this.cView;
			return cView.Utils._Promise.all(Object.keys(contexts).map(function(domain){
				return contexts[domain].p;
			})).then(function(res){
				var body = cView.doc.getElementById("container");
				body.cNodes["pagetitle"].innerHTML = path;
				cView.doc.title = "My groups";
				cView.Drawer.drawGroups();
			});
		}
		,"unmixed":function(contexts, path){
			var cView = this.cView;
			return new cView.Utils._Promise(function(resolve,reject){
				var body = cView.doc.getElementById("container");
				var nodeDummy = body.appendChild(cView.doc.createElement("div"));
				var domains = Object.keys(contexts);
				var domain = (domains.indexOf(gConfig.leadDomain) != -1)?  gConfig.leadDomain :domains[0];
				var cs = new Object();
				cs[domain] = contexts[domain];
				var context = cs[domain];
				var username = path.split("/")[0];
				cView.Router.timeline(cs, path).then(function(){ 
					var feed =  context.gUsers.byName[username];
					if(feed.type == "user")cView.noBlocks = true;
					//cView.Common.addUser.call(context, feed);
					cView.doc.title = "@"+feed.username + ", a " + context.domain + " feed.";
					cView.Utils.setChild(body, "details", cView.Drawer.genUserDetails(feed.username, context));
					if (context.ids)
						cView.Utils.setChild(body, "up-controls", cView.Drawer.genUpControls(feed));
					var names = new Array();
					context.ids.forEach( function(id){
						names.push(context.gUsers[id].username);
					});
					if (names.indexOf(feed.username)!= -1) {
						var nodeAddPost = cView.gNodes["new-post"].cloneAll();
						body.replaceChild(nodeAddPost, nodeDummy);
						cView.Drawer.genPostTo( 
							nodeAddPost 
							,null
							,context.logins[context.gUsers.byName[feed.username].id].data
						);
					}
					if ((feed.type == "group") && feed.friend){
						var nodeAddPost = cView.gNodes["new-post"].cloneAll();
						body.replaceChild(nodeAddPost, nodeDummy);
						cView.Drawer.genPostTo( 
							nodeAddPost 
							,feed.username 
							,context.gMe
						);
					}
					resolve();
				},reject);
			});
		}
		,"singlePost":function(contexts,path){
			var cView = this.cView;
			cView.noBlocks = true;
			var context = Object.keys(contexts).map(function(d){ return contexts[d];})[0];
			return cView.Utils._Promise.all( [
				context.api.getPost(context.token, path, ["comments"])
				,context.p
			]).then( function (res){
				cView.doc.getElementById("loading-msg").innerHTML = "Building page";
				cView.Common.loadGlobals(res[0], context);
				var post = res[0].posts;
				if(Array.isArray(post))post = post[0];
				post.domain = context.domain;
				cView.Drawer.drawPost(post,context);
				if(JSON.parse(cView.localStorage.getItem("rt"))) context.rtSubPost(res[0]) ;
				if(is(res[0].timelines))
					context.timelineId = res[0].timelines.id;
			});
		}
		,"routeSearch":function(contextsIn){
			var cView = this.cView;
			var search = cView.search.match(/qs=([^&]+)/);
			var domains = new Array();
			var reDomains = /d=([^&]+)/g;
			var match = null;
			while((match = reDomains.exec(cView.search)) !== null)
				domains.push(match[1]);
			if (!domains.length){
				var arrSkipDomains = (new Array()).concat(JSON.parse(cView.localStorage.getItem("skip_domains")));
				domains =Object.keys(contextsIn).filter(function(domain){
					return arrSkipDomains.indexOf(domain) == -1;
				});
			}

			if(!search){ 
				cView.Drawer.drawSearch({"query":"","domains":domains});
				return cView.Utils._Promise.resolve();
			}
			var contextsOut = new Object();
			Object.keys(contextsIn).forEach(function(domain){
				if(domains.indexOf(domain) != -1) 
					contextsOut[domain] = contextsIn[domain];
			});
			if(!Object.keys(contextsOut).length){
				contextsOut = contextsIn;
				domains = Object.keys(contextsIn);
			}

			return this.timeline(
				contextsOut
				,search[1]
				,"getSearch"
			).then(function(){
				cView.Drawer.drawSearch({
					"query":decodeURIComponent(search[1].replace(/\+/g, " "))
					,"domains":domains
				})
			});
		}
		,"timeline":function(contexts, path, source ){
			var cView = this.cView;
			source = (typeof source !== "undefined")?source:"getTimeline";
			var arrContent = new Array();
			var prConts = new Array();
			var prContxt = new Array();
			var domains = Object.keys(contexts);
			domains.forEach(function(domain){ 
				var context = contexts[domain];
				prContxt.push(context.p);
				prConts.push(context.api[source](context.token,path, cView.skip));
			});
			var prAllT = some(cView.Utils._Promise, prConts);
			var prAllC = cView.Utils._Promise.all(prContxt);
			cView.doc.getElementById("container").cNodes["pagetitle"].innerHTML = path;
			cView.doc.title +=": " + path;
			return mixedTimelines(cView, contexts, prAllT,prAllC);
		}
	}
return _Router;
});

