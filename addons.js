"use strict";

//var settings = require("json!./addons.json");

define("./addons", [ "./utils"
	,"./addons/sidebar"
	,"./addons/likecomm"
	,"./addons/srvsave"
	,"./addons/translate"
	,"./addons/linkcups"
]
,function( utils ) {
	var addons = utils.args2Arr.apply(this,arguments);
	addons.shift();
return{
	"commit":function(cView){
		return cView.Utils._Promise.all(addons.map(function (addon){
			addon = addon(cView);
			cView.addons.all.push(addon);
			return addon.run();
		})).then(cView.addons.ok);

	}
}
});
