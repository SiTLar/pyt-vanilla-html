var webpack = require("webpack");
var process = require("process");
var build = process.env["___BUILD___"] || "unstable";
build = "\"" + build + "\"";
module.exports = {
	"target":"web"
	,"entry": "./browser.js"
	,"output":{
		"filename":"vanilla.js"
	}
	,"plugins":[
		new webpack.DefinePlugin({
		"___BUILD___":build
		})
	]


};
