"use strict";
define("./sidebar", [],function(){
return [
	{"title":"Filters"
		,"content":function(){
			var linkHead = "<a href=\""+gConfig.front+"filter/";
			return linkHead + [ "me\">My posts"
				,"discussions\">My discussions"
				,"direct\">Direct messages"
			].join("</a><br/>"+ linkHead)+ "</a>";
		}
	
	}
	,{"title":"Help"
		,"content":function(){
			return "<a href=\"https://myfeed.rocks/about.html\" >Getting around</a>"
			+"<br/><a href=\""+gConfig.front+"as/FreeFeed/vanillaweb\" >Feedback</a>"
			+"<br/><a href=\"https://freefeed.net/about \">FreeFeed</a>"
			+"<br/><a href=\"https://myfeed.rocks/about.html#author\">Author</a>"
			+"<br/><span class=\"sb-info\">"+___BUILD___+"</span>";
		}	
	}
	,{"title":"Groups"
		,"content":function(cView){
			var domains = Object.keys(cView.contexts);
			var groups = new Array();
			domains.forEach(function(domain){
				var context = cView.contexts[domain];
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
						if( (group.type == "group") && (sub.name == "Posts"))
							groups.push({ 
								"link":group.link
								,"time":Number(group.updatedAt)
							});
					});
				});
			});
			groups.sort(function(a,b){return a.time<b.time});
			var length = groups.length;
			length = length <5 ? length:5;
			var out = "";
			for (var idx = 0; idx < length; idx++) 
				out +="<div>"+ groups[idx].link + "<br/>" 
				+ "<span class=\"sb-info\">" 
				+cView.Utils.relative_time( groups[idx].time) 
				+ "</span></div>";
			return out;
		}
	}
]});
