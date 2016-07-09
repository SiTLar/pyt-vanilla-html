var webpack = require("webpack");
var process = require("process");
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var build = process.env["___BUILD___"] || "unstable";
build = "\"" + build + "\"";
module.exports = {
	"target":"web"
	,"entry":{
		"vanilla":"./browser.js"
		,"expanded":"./expandedcss.js"
		,"compact":"./compactcss.js"
	}
	,"output":{
		"filename":"[name].js"
	}
	,"plugins":[
		new webpack.DefinePlugin({
		"___BUILD___":build
		})
		,new ExtractTextPlugin("css/[name].css")
	]
	,"module": {
		"loaders": [
		    {
			"test":   /\.css$/
			,"loader": ExtractTextPlugin.extract("style-loader", "css-loader!postcss-loader")
		    }
		]
	}
	,"postcss": function () {
		return [require('autoprefixer'), require('precss')];
	}
};
