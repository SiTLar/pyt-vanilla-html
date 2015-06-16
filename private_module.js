'use strict';
/*
var cfg = {"keyurl":"http://moimosk.ru/cgi/secret?","authurl": gConfig.serverURL,'sk':16 };
*/
var CryptoPrivate = function(cfg){
	this.cfg = cfg;
	if(typeof cfg.authurl === 'undefined' ) throw new Error("authurl is not defined");
	var sSymKeys = window.sessionStorage.getItem("crypto_keys");
	if (sSymKeys != "undefined")if (sSymKeys) var gSymKeys = JSON.parse(window.sessionStorage.getItem("crypto_keys"));
	if(!this.gSymKeys)this.loadKeys(gSymKeys);
}
CryptoPrivate.prototype = {
	constructor: CryptoPrivate,
	gSymKeys: undefined, 
	decipher: undefined, 
	cfg: undefined,
	username: undefined,
	password: undefined,
	constants:{'kidlength':btoa(openpgp.crypto.hash.sha256('1')).length},

	decrypt: function(data){
		var idL = this.cfg.encId.length;
		if (data.slice(0,idL) != this.cfg.encId) return {'error':'0'};
		if(typeof this.decipher === 'undefined') return {'error':'4'};
		var key = this.decipher[data.slice(idL,  this.constants.kidlength+idL)];
		if(typeof key === 'undefined') return {'error':'3'};
		return StringView.makeFromBase64(openpgp.crypto.cfb.decrypt("aes256", atob(key), atob(data.slice(idL+this.constants.kidlength) ))).toString();

	},
	encrypt: function(id, data){
		var init  = openpgp.crypto.getPrefixRandom("aes256");
		var key_idx = Math.floor(Math.random()*this.cfg.sk);
		if (typeof this.gSymKeys[id] === 'undifined') return {'error':'1'};
		var sym_key =  atob(this.gSymKeys[id].aKeys[key_idx].key);

		/*var init  = new Uint8Array(16);
		  window.crypto.getRandomValues(init); 
		 */
		return this.cfg.encId +this.gSymKeys[id].aKeys[key_idx].id+btoa(openpgp.crypto.cfb.encrypt( init,"aes256", new StringView(data).toBase64(), sym_key));

	},
	setPassword: function (pass){
		this.password = openpgp.crypto.hash.sha256(pass);
	},
	logout: function(){
		sessionStorage.removeItem("key_pub");
		sessionStorage.removeItem("key_private");
		sessionStorage.removeItem("crypto_write_token");
		sessionStorage.removeItem("crypto_keys");
		this.username = undefined;
		this.password = undefined;

	},
	register: function(){
		var caller = this;
		var init  = openpgp.crypto.getPrefixRandom("aes256");
		var keyPuA = window.sessionStorage.getItem("key_pub");
		var keyPrA = window.sessionStorage.getItem("key_private");
		var my_passphrase = ""; // Key Pairs is always protected with a caller.password to safety.
		return new Promise(function(resolve,reject){
			if((typeof caller.password === 'undefined')|| (typeof caller.username === 'undefined')){
				reject();
				return;
			}
			if (!keyPuA)openpgp.generateKeyPair({numBits: 1024, userId: caller.username, passphrase: my_passphrase,unlocked: true }).then (function (a){
				window.sessionStorage.setItem("key_pub", a.publicKeyArmored);
				window.sessionStorage.setItem("key_private", a.privateKeyArmored);
				keyPuA = a.publicKeyArmored;
				keyPrA = a.privateKeyArmored;
				go();
			});else go();

			function go(){
				var oReq = new XMLHttpRequest();
				oReq.onload = function(){
					if(oReq.status < 400){
						var res = JSON.parse(oReq.response);
						var oReqS = new XMLHttpRequest();
						oReqS.open("POST", caller.cfg.keyurl+'register');
						oReqS.onload = function(){
							if(oReqS.status < 400){ 
								var msgEnc = openpgp.message.readArmored(oReqS.response);
								var dkey = openpgp.key.readArmored(keyPrA);
								openpgp.decryptMessage(dkey.keys[0],msgEnc)
								.then(function(msg){
									window.sessionStorage.setItem("crypto_write_token",msg);
									caller.update().then( resolve()); 
								});
								var oReqD = new XMLHttpRequest();
								oReqD.open('delete',caller.cfg.authurl+'posts/'+res.posts.id);
								oReqD.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
								oReqD.send();

							}else reject();
						}
						oReqS.setRequestHeader("Content-type","text/plain");
						oReqS.send(res.posts.id);
					}else reject();
				};
				

				oReq.open("post",caller.cfg.authurl+'posts' ,true);
				oReq.setRequestHeader("X-Authentication-Token", window.localStorage.getItem("token"));
				oReq.setRequestHeader("Content-type","application/json");
				var post = new Object();
				post.body = keyPuA ;
				var postdata = new Object();
				postdata.post = post;
				postdata.meta = new Object();
				postdata.meta.feeds = caller.username; 
				oReq.send(JSON.stringify(postdata));
			}
		});
	 },
	initPrivate: function(grName){
		var caller = this;
		var arrKeys = new Array(caller.cfg.sk);
		var id;
		var grIdRaw = '';
		for(var idx = 0; idx < caller.cfg.sk; idx++){
			var key = openpgp.crypto.generateSessionKey('blowfish');
			id = btoa(openpgp.crypto.hash.sha256(key));
			arrKeys[idx]= {'id':id, 'key':btoa(key)};
			grIdRaw += key;
		}
		id = caller.username+"-"+btoa(openpgp.crypto.hash.sha256(grIdRaw));
		var priv = new Object();
		priv.aKeys = arrKeys;
		priv.name = new StringView(grName).toBase64();
		priv.id = id;
		if (typeof caller.gSymKeys === 'undefined') caller.gSymKeys = new Object();
		caller.gSymKeys[id] = priv;
		if (typeof caller.decipher === 'undefined') caller.decipher = new Object();
		priv.aKeys.forEach(function(key){
			caller.decipher[key.id] = key.key;
		});
		return new Promise(function(resolve,reject){
			caller.update().then(resolve,reject);
		});
	 
	 },
	getUserPub: function(victim){
		var caller = this;
		return new Promise(function(resolve,reject){
			var oReq = new XMLHttpRequest();
			oReq.open('GET', caller.cfg.keyurl+'@'+victim);
			oReq.onload = function(){
				if(oReq.status < 400){ 
					resolve(oReq.response);
				}else reject(oReq.status);
			}
			oReq.send();
		});
	 
	 },
	readMsg: function(msgEnc){
		var caller = this;
		return new Promise(function(resolve,reject){
			var keyPrA = window.sessionStorage.getItem("key_private");
			if(!keyPrA) {
				getUserPriv().then(function(){caller.readMsg.then(resolve,reject)},reject);
				return;
			}
			var dkey = openpgp.key.readArmored(keyPrA);
			openpgp.decryptMessage(dkey.keys[0],openpgp.message.readArmored(msgEnc)).then(function(msg){resolve(msg);}, reject);
		});
	},
	genMsg: function(victim,data){
		var caller = this;
		return new Promise(function(resolve,reject){
			caller.getUserPub(victim).then(function(arKey){
				var key = openpgp.key.readArmored(arKey).keys[0];
				openpgp.encryptMessage(key,data).then(resolve);
			}, reject);
		});
	
	},
	addKeys: function(keys){
		if (!keys||(keys == "null")) return;
		var caller = this;
		if (typeof caller.gSymKeys === 'undefined') caller.gSymKeys = new Object();
		console.log(typeof caller.gSymKeys[keys.id]);
		if((typeof caller.gSymKeys[keys.id]) != "undefined" )return;
		caller.gSymKeys[keys.id] = keys;
		if (typeof caller.decipher === 'undefined') caller.decipher = new Object();
		keys.aKeys.forEach(function(key){ caller.decipher[key.id] = key.key; });
		caller.update();

	},
	loadKeys: function(keys){
		if (!keys||(keys == "null")) return;
		var caller = this;
		caller.gSymKeys = keys;
		if (typeof caller.decipher === 'undefined') caller.decipher = new Object();
		for(var pid in caller.gSymKeys)
			caller.gSymKeys[pid].aKeys.forEach(function(key){ caller.decipher[key.id] = key.key; });
		window.sessionStorage.setItem("crypto_keys",JSON.stringify(caller.gSymKeys));

	},
	getUserPriv: function(){
		var caller = this;
		return new Promise(function(resolve,reject){
			if((typeof caller.password === 'undefined')|| (typeof caller.username === 'undefined')){
				reject();
				return;
			}
			var oReq = new XMLHttpRequest();
			oReq.open('GET', caller.cfg.keyurl+'data' );
			oReq.onload = function(){
				if(oReq.status < 400){ 
					var secret = openpgp.crypto.cfb.decrypt("aes256",caller.password , atob(oReq.response));
					secret = JSON.parse(secret);
					window.sessionStorage.setItem("key_private", secret.prkey);
					caller.loadKeys(secret.symkeys);
					resolve();
				}else reject();
			
			}
			oReq.setRequestHeader("X-Authentication-User",caller.username);
			oReq.send();
		});
	 },
	requestToken: function(){
		var caller = this;
		return new Promise(function(resolve,reject){
			var keyPrA = window.sessionStorage.getItem("key_private");
			if(!keyPrA) {
				getUserPriv().then(function(){caller.requestToken( resolve,reject)},reject);
				return;
			}
			if((typeof caller.password === 'undefined') || (typeof caller.username === 'undefined')){
				reject();
				return;
			}
			var oReq = new XMLHttpRequest();
			oReq.open('GET', caller.cfg.keyurl+'token' );
			oReq.onload = function(){
				if(oReq.status < 400){ 
					var msgEnc = openpgp.message.readArmored(oReq.response);
					var dkey = openpgp.key.readArmored(keyPrA);
					openpgp.decryptMessage(dkey.keys[0],msgEnc
						).then(function(msg){
							window.sessionStorage.setItem("crypto_write_token",msg);
							resolve();
						});
				}else reject();
			}
			oReq.setRequestHeader("X-Authentication-User",caller.username);
			oReq.send();
		});
	 },
	update: function(){
		var caller = this;
		var keyPrA = window.sessionStorage.getItem("key_private");
		return new Promise(function(resolve,reject){
			if((typeof caller.password === 'undefined')|| (typeof caller.username === 'undefined')){
				reject();
				return;
			}
			var init  = openpgp.crypto.getPrefixRandom("aes256");
			var oReq = new XMLHttpRequest();
			oReq.open("POST", caller.cfg.keyurl+'update' );
			oReq.onload = function(){
				if(oReq.status < 400){ 
						resolve();
				}else reject();
			}
			var token = window.sessionStorage.getItem("crypto_write_token");
			if(!token ) {
				caller.requestToken().then(doReq,reject);
			}else doReq();
			function doReq(){
				token = window.sessionStorage.getItem("crypto_write_token");
				oReq.setRequestHeader("X-Authentication-Token",btoa(openpgp.crypto.hash.sha256(token)));
				oReq.setRequestHeader("X-Authentication-User",caller.username);
				oReq.send(btoa(openpgp.crypto.cfb.encrypt( init,"aes256", JSON.stringify({'prkey':keyPrA,'symkeys':caller.gSymKeys }),caller.password )));
				window.sessionStorage.setItem("crypto_keys",JSON.stringify(caller.gSymKeys) );
			}
		});

	}
}
