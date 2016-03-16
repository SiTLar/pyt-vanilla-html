"use strinct";
var gRoutes = require("json!./routes.json");
function is(val){return typeof val !== "undefined";};
var chk = {
	"token":function(contexts){
		Object.keys(contexts).forEach(function(domain){
			if (typeof contexts[domain].token === "undefined")
				delete contexts[domain];
		});
		return  Object.keys(contexts).length?null:"token";
	}
	,"frfContext":function(contexts){
		if (Object.keys(contexts).length > 1){
			var frfContext = new Object();
			frfContext[gConfig.frfDomain] = contexts[gConfig.frfDomain];
			contexts = frfContext;
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
			if (cView.doc.title == "") cView.doc.title = "Feeds: ";
			var arrPath = path.split("/");
			var step = gRoutes;
			for(var idx = 0; idx < arrPath.length; idx++){
				var txtStep = arrPath[idx];
				if (is(step.req) && chk[step.req](contexts))
					return new cView.Utils._Promise(function(resolve,reject){reject(chk[step.dest[2]](contexts))});

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
					return new cView.Utils._Promise(function(resolve,reject){reject(chk[step.dest[2]](contexts))});
				return cView[step.dest[0]][step.dest[1]](contexts, path);
			}
			return new cView.Utils._Promise(function(resolve,reject){reject(chk[step.dest[2]](contexts))});
		}
		,"directs":function(contexts){
			var cView = this.cView;
			return new cView.Utils._Promise(function(resolve,reject){
				var nodeAddPost = cView.gNodes["new-post"].cloneAll();
				var body = cView.doc.getElementById("container");
				body.appendChild(nodeAddPost);
				contexts[gConfig.frfDomain].p.then(function () {
					cView.Drawer.genDirectTo(nodeAddPost
						,contexts[gConfig.frfDomain].gMe);
				});
				cView.Router.timeline(contexts, "filter/directs/").then(function(){
					body.cNodes["pagetitle"].innerHTML = "Direct messages";
					cView.doc.title = "Feeds: Direct messages";
					resolve();
				},reject);
			});
		}
		,"routeContext":function(contexts, path){
			var arrPath = path.split("/");
			var context = contexts[arrPath[1]];
			return this.route([context], arrPath.slice(2).join("/") );
		}
		,"routeHome":function(contexts){
			var cView = this.cView;
			return new cView.Utils._Promise(function(resolve,reject){
				var nodeAddPost = cView.gNodes["new-post"].cloneAll();
				var body = cView.doc.getElementById("container");
				body.appendChild(nodeAddPost);
				contexts[gConfig.frfDomain].p.then(function () {
					cView.Drawer.genPostTo(nodeAddPost
						,contexts[gConfig.frfDomain].gMe.users.username
						,contexts[gConfig.frfDomain].gMe);
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
				(new cView.Utils._PromiseAll([
					context.api.getUser(context.token, path)
					,context.p
				])).then(function(res){ 
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
				cView.Router.timeline(contexts, path).then(function(){ 
					context = contexts[Object.keys(contexts)[0]];
					var feed = context.gUsers.byName[path.split("/")[0]];
					cView.doc.title = "@"+feed.username + ", a " + context.domain + " feed.";
					cView.Utils.setChild(body, "details", cView.Drawer.genUserDetails(feed.username, context));
					if (context.ids)
						cView.Utils.setChild(body, "up-controls", cView.Drawer.genUpControls(feed));
					var names = new Array();
					context.ids.forEach(function(id){ 
						names.push(context.gUsers[id].username); 
					});
					if ( (names.indexOf(feed.username)!= -1) || ((feed.type == "group") && feed.friend)){
						body.appendChild(cView.gNodes["new-post"].cloneAll());
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
		,"singlePost":function(context,path){
			var cView = this.cView;
			return new cView.Utils._Promise(function(resolve,reject){
				(new cView.Utils._PromiseAll([,context.p)).then( function (res){
					cView.Common.loadGlobals(data, contexts[domains[idx]]);
				});
			});
		}
		,"timeline":function(contexts, path){
			var cView = this.cView;
			return new cView.Utils._Promise(function(resolve,reject){
				var arrContent = new Array();
				var prConts = new Array();
				var prContxt = new Array();
				var domains = new Array();
				Object.keys(contexts).forEach(function(domain){ 
					var context = contexts[domain];
					domains.push(domain);
					prContxt.push(context.p);
					prConts.push(context.api.getTimeline(context.token, path));
				});
				var prAllC =  new cView.Utils._PromiseAll(prConts);
				var prAllL =  new cView.Utils._PromiseAll(prContxt);
				(new cView.Utils._PromiseAll([prAllC,prAllL])).then( function (res){
					var posts = new Array();
					cView.doc.getElementById("loading-msg").innerHTML = "Building page";
					res[0].forEach(function(data,idx){
						cView.Common.loadGlobals(data, contexts[domains[idx]]);
						data.posts.forEach(function(post){
							post.domain = domains[idx];
						});
						posts = posts.concat(data.posts);
					});
					posts.sort(function(a,b){return b.updatedAt - a.updatedAt;}); 
					cView.doc.getElementById("container").cNodes["pagetitle"].innerHTML = path;
					cView.doc.title += path;
					cView.Drawer.drawTimeline(posts,contexts);
					cView.Drawer.updateReqs();
					resolve();
				},reject);
			});


		}
	
	}
return _Router;
});

