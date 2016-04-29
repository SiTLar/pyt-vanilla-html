"use strinct";
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
define("./router",[],function(){
	function _Router(v){
		this.cView = v;
	};
	_Router.prototype = {
		"route":function(contexts, path){
			var cView = this.cView;
			if (cView.doc.title == "") cView.doc.title = "Feeds";
			var arrPath = path.split("/");
			var step = gRoutes;
			for(var idx = 0; idx < arrPath.length; idx++){
				var txtStep = arrPath[idx];
				if (txtStep == "")continue;
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
				var context = contexts[gConfig.leadDomain];
				if (!is(context))context = contexts[Object.keys(contexts)[0]];
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
			var arrPath = path.split("/");
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
						,mainContext.gMe.users.username
						,mainContext.gMe);
				});
				cView.Router.timeline(contexts, "home" ).then(resolve,reject);
			});
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
			return new cView.Utils._Promise(function(resolve,reject){
				new cView.Utils._Promise.all([ context.api.getUser(context.token,path),context.p ])
				.then(function(res){ 
					cView.Common.loadGlobals(res[0], context);
					var body = cView.doc.getElementById("container");
					body.cNodes["pagetitle"].innerHTML = path;
					cView.doc.title = "@"+path.split("/")[0]+ "'s  " + path.split("/")[1] + " ("+context.domain+")";
					fn.call(cView, res[0],context); 
					resolve();
				},reject);
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
							,feed.username 
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
			var context = Object.keys(contexts).map(function(d){ return contexts[d];})[0];
			return cView.Utils._Promise.all( [
				context.api.getPost(context.token, path, ["comments"])
				,context.p
			]).then( function (res){
				cView.Common.loadGlobals(res[0], context);
				var post = res[0].posts;
				if(Array.isArray(post))post = post[0];
				post.domain = context.domain;
				cView.Drawer.drawPost(post,context);
				if(JSON.parse(cView.localStorage.getItem("rt"))) context.rtSubPost(res[0]) ;
			});
		}
		,"timeline":function(contexts, path){
			var cView = this.cView;
			var arrContent = new Array();
			var prConts = new Array();
			var prContxt = new Array();
			var domains = Object.keys(contexts);
			domains.forEach(function(domain){ 
				var context = contexts[domain];
				prContxt.push(context.p);
				prConts.push(context.api.getTimeline(context.token,path, cView.skip));
			});
			var prAllC = cView.Utils._Promise.all(prConts);
			var prAllT = cView.Utils._Promise.all(prContxt);
			return cView.Utils._Promise.all([prAllC,prAllT]).then( function (res){
				var posts = new Array();
				cView.doc.getElementById("loading-msg").innerHTML = "Building page";
				res[0].forEach(function(data,idx){
					var context = contexts[domains[idx]];
					cView.Common.loadGlobals( data, context);
					if(typeof data.posts !== "undefined" ){
						data.posts.forEach(function(post){
							post.domain = domains[idx];
						});
						posts = posts.concat(data.posts);
					}
					if(JSON.parse(cView.localStorage.getItem("rt"))) 
						context.rtSubTimeline(data);
				});
				posts.sort(function(a,b){return b.updatedAt - a.updatedAt;}); 
				cView.doc.getElementById("container").cNodes["pagetitle"].innerHTML = path;
				cView.doc.title +=": " + path;
				cView.Drawer.drawTimeline(posts,contexts);
				cView.Drawer.updateReqs();
			});
		}
	}
return _Router;
});

