/* hybrid capacity bootstrap
 * 
 * This has to be happened after sapui5 bootstrap, and before first application page is loaded 
 */

sap.hybrid = {
	Cordova : false,
	AppDescriptor : null,
	SMP : {
		AppContext : null,
		offlineStoreDef : null
	},

	setCordova : function() {
		sap.hybrid.Cordova = true;
	},

	getPlatform : function() {
		var av = navigator.appVersion;
		if(av.indexOf("Android") >= 0){
			return "android";
		} else if(av.indexOf("iPhone") >= 0) {
			return "ios";
		}
	},

	oDataProcInCordovaApp : function(data) {
		sap.hybrid.OData.metadata = data.data;

		// if there is kapsel logon
		if (data.smp.features.logon) {
			// load logon lib
			jQuery.getScript("./hybrid/kapsel/logon.js").done( function() {
				// start SMP/HCPms logon
				sap.hybrid.kapsel.doLogonInit(data.smp.context, data.smp.appid);
			}).fail( function() {
				console.log("failed to load logon.js");
			});
		} else {
			// non-kapsel cordova app.
			if (sap.hybrid.OData.metadata) {
				sap.hybrid.onDeviceoDataConfigs();

				// trigger odata auth process 
				var url = sap.hybrid.OData.metadata.services[0].serviceUrl;
				if (sap.hybrid.getPlatform() === "ios") {
					sap.hybrid.AuthODataAcess.triggeriOSAuth(url);
				} else {
					sap.hybrid.AuthODataAcess.androidDialogAuth(url);
				}
			} else {
				sap.hybrid.startApp();
			}
		}
	},

	bindImageReroute : function(mime) {
		var formatter = function(path) {
			var aPath = path.split("/");
			if (!aPath[0]) {
				aPath.shift();
			}
			if (!aPath[aPath.length -1]) {
				aPath.pop();
			}
			return aPath.join("/");
		};

		window.addEventListener("error", function(e){
			if (e && e.target && e.target.nodeName && e.target.nodeName.toLowerCase() == "img") {
				if (e.target.src.indexOf("file:///") === 0) {
					var src = e.target.src;
					var prestring = "file:///" + formatter(mime.path);
					e.target.src = formatter(mime.root) + src.substring(prestring.length);
				}
			}
		}, true);
	},

	bootStrap : function() {
		if (sap.hybrid.Cordova) {
			// cordova bootstrap. bind to cordova event
			document.addEventListener("deviceready", function() {
				// load odata library
				jQuery.getScript("./hybrid/odata/hybridodata.js").done( function() {
					// load mobile.json
					jQuery.getJSON("mobile.json").done( function(data) {
						if (data.mime && data.mime.path && data.mime.root) {
							sap.hybrid.bindImageReroute(data.mime);
						}

						jQuery.getJSON("./manifest.json").done( function(manifestData) {
							if (manifestData["sap.app"].offline && manifestData["sap.mobile"]) {
								sap.hybrid.AppDescriptor = {
									offline : manifestData["sap.app"].offline,
									mobile : manifestData["sap.mobile"]
								};
							}
							sap.hybrid.initSMPOfflineOData(data);

							sap.hybrid.oDataProcInCordovaApp(data);
						}).fail( function() {
							console.log("manifest.json of parent app is not found");
							sap.hybrid.oDataProcInCordovaApp(data);
						});
					}).fail( function() {
						console.log("failed to load mobile.json");
					});
				}).fail( function() {
					console.log("failed to load hybridodata.js");
				});
			}, false);
		} else {
			console.log("cordova is not loaded");
		}
	}
};