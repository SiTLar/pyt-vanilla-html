var webpack = require('webpack');

module.exports = {
	"target":"node"
	,"entry": "./server_render.js"
	,"output":{
		"libraryTarget":"commonjs2"
		,"filename":"vanilla_srv.js"
	}
	,"plugins":[
		new webpack.optimize.UglifyJsPlugin({
		    mangle: {
			except: ["cView", 'exports', 'require']
		    }
		})
	]
};
