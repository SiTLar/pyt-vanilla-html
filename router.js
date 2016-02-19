"use strinct";
var gRoutes = require("json!./routes.json");
function is(val){return typeof val !== "undefined";};
var chk = {
	"token":function(contexts){return is(context.token)?0:"token";}
	,"singleContext":function(contexts){contexts.splice(1); return 0;}
}
define([],function(){
	function _Router(v){
		this.cView = v;
	};
	_Router.prototype = {
		"route":function(contexts, path){
			var cView = this.cView;
			var arrPath = path.split("/");
			var routes = gRoutes;
			for(var idx = 0; idx < arrPath.length; idx++){
				var step = arrPath[idx];
				if (is(step.req) && chk[step.req](contexts))
					return  chk[step.req](contexts);

				if(is(step.reroute))
					return cView[step.reroute[0]][step.reroute[1]](contexts, path);
				if (is(routes.vals[step])) routes = routes.vals[step];
				else if (is(routes.default)) routes = routes.default;
			}
			if(is(step.dest))
				return cView[step.dest[0]][step.dest[1]](contexts, path);
			return 404;
			

		}
		,"directs":function(contexts){
			return this.timeline(contexts, "/filter/directs/");
		}
		,"routeContext":function(contexts, path){
			var arrPath = path.split("/");
			var context = contexts[arrPath[2]];
			return this.route([context], arrPath.slice(3).join("/") );
		}
		,"routeHome":function(contexts){
			return this.route(contexts, "/home" );
		}
		,"subscribers":function(contexts, path){
			var cView = contexts[0].cView;
			contexts[0].api.get(path, cView.Drawer.drawSubsc);
			return 0;
		}
		,"subscriptions":function(contexts, path){
			var cView = contexts[0].cView;
			contexts[0].api.get(path, cView.Drawer.drawSubs);
			return 0;
		}
		,"timeline":function(contexts, path){
			var cView = contexts[0].cView;
			var count = contexts.length;
			var arrContent = new Array(count);
			function collect(cont, pos){
				arrContent[pos] = cont; 
				if (--count)return;
				var posts = new Array();
				arrContent.forEach(function(data,idx){
					cView.Utils.loadGlobals(data, contexts[idx]);
					posts = posts.concat(data.posts);
					posts.sort(function(a,b){return a.updatedAt - b.updatedAt;}); 
				});
				cView.draw(posts,contexts)
			}
			contexts.forEach(function(context){ context.api.get(path, collect);});
			return 0; 
		}
	
	}
return _Router;
});

