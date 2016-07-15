"use strict";

//var settings = require("json!./addons.json");

define("./addons", [ "./utils"
	,"./addons/sidebar"
	,"./addons/likecomm"
	,"./addons/srvsave"
]
,function( utils
	,sidebar
	,likeComm
) {
	var addons = utils.args2Arr.apply(this,arguments);
	addons.shift();
return{
	"commit":function(cView){
		addons.forEach(function (addon){
			addon = addon(cView);
			addon.run();
			cView.addons.all.push(addon);
		});
		cView.addons.ok();

	}
}
});
