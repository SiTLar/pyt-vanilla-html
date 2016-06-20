var webpack = require('webpack');
var build = "\"fsaefawefewa\"";
module.exports = {
	"target":"web"
	,"entry": "./browser.js"
	,"output":{
		"filename":"vanilla.js"
	}
/*	,"plugins":[
		new webpack.DefinePlugin({
		"___BUILD___":build
		})
	]

*/
};
