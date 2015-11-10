System.config({
  baseURL: "/static/",
  defaultJSExtensions: true,
  transpiler: "babel",
  paths: {},
  bundles: {
    "build.js": [
      "lib/main.js",
      "lib/utils.js",
      "lib/Autolinker.min.js",
      "lib/draw.js"
    ]
  }
});
