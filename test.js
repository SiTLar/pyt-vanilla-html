var doc = require("./dom_document.js")
var util = require('util');
var body = doc.getElementsByTagName("body")
//console.log(util.inspect(doc, { showHidden: true, depth: null, colors: true }));
var node = doc.createElement("div");
node.innerHTML = "e;lje;o";
var cNode = doc.createElement("div");
cNode.innerHTML = "769246";
node.appendChild(cNode);
doc.body.appendChild(node);
console.log(doc.toString());
