var process = require("process");
var webpack = require("webpack");
var request = require("then-request");
var fs = require("fs");
var Promise = require("promise");
var write = Promise.denodeify(fs.writeFile);
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
var WebpackBeforeBuildPlugin = require('before-build-webpack');
var build = process.env["___BUILD___"] || "unstable";
build = "\"" + build + "\"";

// "https://cdn.rawgit.com/FortAwesome/Font-Awesome/blob/master/src/icons.yml";
module.exports = {
	"target":"web"
	,"mode": "none"
	,performance: { hints: false }
	,"entry":{
		"vanilla":"./browser.js"
		,"expanded":"./expandedcss.js"
		,"compact":"./compactcss.js"
	}
	,"output":{
		"publicPath": "./"
		,"path": __dirname
		,"filename":"[name].js"
	}
	,"plugins":[
		new webpack.DefinePlugin({
		"___BUILD___":build
		})
		,new MiniCssExtractPlugin({"filename":"[name].css"})
		,new WebpackBeforeBuildPlugin(function(compiler, callback) {
			var icons = request("GET", "https://cdn.rawgit.com/FortAwesome/Font-Awesome/4722e3ea/src/icons.yml").then(function(res){
				return write("icons.yml", res.getBody(), "utf8");
			}).then(()=>{console.log("icos")});
			var tlds = require("./loadtlds").then(()=>{console.log("tlds")});

			Promise.all([tlds, icons]).then(()=>{console.log("success"); callback();});
		}
		/* , ['run', 'watch-run', 'done']*/
		)

	]
	,"module": {
		"rules": [
		   /* {
		    	"test": /\.json$/
			,"use":[ {"loader": "compact-json-loader"}]
		    },*/{
			"test":   /\.css$/
			,"use":[ { "loader": MiniCssExtractPlugin.loader}
				,{ "loader": "css-loader"}
				/*,{ "loader": "postcss-loader"
					, "options": { parser: 'sugarss',
							plugins: {
								'postcss-import': {},
								'postcss-preset-env': {},
								'cssnano': {}
							}
						}
				}*/
			]
		    },{
		    	test: /\.yml$/
			,use: 'yml-loader'
		    }
		]
	}
	/*
	,"postcss": function () {
		return [require('autoprefixer'), require('precss')];
	}
	*/
};
