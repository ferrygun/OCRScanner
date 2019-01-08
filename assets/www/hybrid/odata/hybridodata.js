/* hybrid oData Customization
 * 
 * This script has to be happened after hybrid capacity bootstrap, as long as there is ODataModel to be converted to hybridODataModel
 */

sap.hybrid.OData = {
	metadata : null,
	configs : null
};

sap.hybrid.onDeviceoDataConfigs = function() {
	// source parent app has odata
	if (sap.hybrid.OData.metadata.format) {
		// fiori extension
		if (sap.hybrid.OData.metadata.format === "sap.ca.serviceConfigs") {
			// scaffolding services
			sap.hybrid.OData.configs = { "sap.ca.serviceConfigs" : sap.hybrid.OData.metadata.services };
		} else {
			sap.hybrid.OData.configs = { "serviceConfig" : sap.hybrid.OData.metadata.services[0] };
		}
	} else {
		// non-extension app
		sap.hybrid.OData.configs = sap.hybrid.OData.metadata.services;
	}
};

sap.hybrid.SMPODataServices = function() {
	if (sap.hybrid.OData.metadata && sap.hybrid.OData.metadata.proxy === "smpodata") {
		sap.hybrid.OData.metadata.services[0].serviceUrl = sap.hybrid.SMP.AppContext.applicationEndpointURL + "/";

		var endpointArray = sap.hybrid.SMP.AppContext.applicationEndpointURL.split("/");
		for (var i=1; i<sap.hybrid.OData.metadata.services.length; i++) {
			endpointArray[endpointArray.length-1] = sap.hybrid.OData.metadata.services[i].name;
			sap.hybrid.OData.metadata.services[i].serviceUrl = endpointArray.join("/");
		}

		sap.hybrid.onDeviceoDataConfigs();

		if (sap.hybrid.SMP.offlineStoreDef) {
			sap.hybrid.OpenSMPOfflineOData();
		} else {
			sap.hybrid.startApp();
		}
	} else {
		sap.hybrid.startApp();
	}
};

sap.hybrid.initSMPOfflineOData = function(data) {
	if (sap.hybrid.AppDescriptor && sap.hybrid.AppDescriptor.offline && 
			sap.hybrid.AppDescriptor.mobile && sap.hybrid.AppDescriptor.mobile.definingRequests) {
		//check if cordova network component loaded
		if(data.smp.features.network){
			//set current connection status
			if (navigator.connection.type != Connection.NONE) {
				sap.hybrid.SMP.isOnline = true;
			}
			//add network listener
			document.addEventListener("online", 
				function(){
					console.log("device Online");
					sap.hybrid.SMP.isOnline = true;
				}, false);
	        document.addEventListener("offline", 
	        	function(){
		        	console.log("device Offline");
		        	sap.hybrid.SMP.isOnline = false;
	        	}, false);
	        
			sap.hybrid.SMP.offlineStoreDef = {};
			for (var p in sap.hybrid.AppDescriptor.mobile.definingRequests) {
				sap.hybrid.SMP.offlineStoreDef[p] = sap.hybrid.AppDescriptor.mobile.definingRequests[p].path;
			}
		} else {
			alert("Cordova network plugin is not selected. \n Offline function is disabled.")
		}
	}
};

sap.hybrid.OpenSMPOfflineOData = function() {
	// load offline odata lib
	jQuery.getScript("./hybrid/odata/offlineStore.js").done( function() {
		sap.hybrid.OData.offlineStore.openAppOfflineStore(sap.hybrid.SMP.AppContext, sap.hybrid.SMP.offlineStoreDef);
	});
};

/********************************************************************
 * synchronize data between smp server and offline store
 * @param{function} successCallback user success callback function
 * @param{function} errorCallback user error callback function
 * @param{boolean} bFlushing, if only flush store data or not. By default 
 * after flush data to server, offline store will pull data back from server side by refresh()
 * ******************************************************************/
sap.hybrid.synAppOfflineStore = function(successCallback, errorCallback, bFlushing) {
	if(sap.hybrid.SMP.isOnline){
		//set refreshing flag
		if(bFlushing){
			//only flush store
			sap.hybrid.OData.offlineStore.appOfflineStore.refreshing = false;
		} else {
			sap.hybrid.OData.offlineStore.appOfflineStore.refreshing = true;
		}
		sap.hybrid.OData.offlineStore.appOfflineStore.successCallback = successCallback;
		sap.hybrid.OData.offlineStore.appOfflineStore.errorCallback = errorCallback;
		sap.hybrid.OData.offlineStore.flushAppOfflineStore();
	}
};

/********************************************************************
 * get network status
 * @return {boolean} application is online or not
 ********************************************************************/
sap.hybrid.isApplicationOnline = function(){
	return sap.hybrid.SMP.isOnline;
};

/********************************************************************
 * get kapsel logon context object
 * @return {object} kapsel logon context
 ********************************************************************/
sap.hybrid.getKapselContext = function(){
	return sap.hybrid.SMP.AppContext;
};

/********************************************************************
 * get offline store object
 * @return {object} offline store object
 ********************************************************************/
sap.hybrid.getOfflineStore = function(){
	return sap.hybrid.OData.offlineStore.appOfflineStore.store;
};

sap.hybrid.AuthODataAcess = {
	logon : function (url, usr, pwd, onLogonSuccess, onUnauthorized, onLogonError){
		$.ajax({
			type: "GET",
			async: false,
			url: url,
			username: usr,
			password: pwd,
			beforeSend: function(request) {
				if (usr !== null || pwd !== null) {
					request.setRequestHeader("Authorization", "Basic " + btoa(usr + ":" + pwd));
				}
			},
			error: function(e) {
				if (e.status === 401) {
					onUnauthorized(e);
				} else if (onLogonError) {
					onLogonError(e);
				} else {
					alert("Logon Error:" + e.statusText);
				}
			},
			success: onLogonSuccess
		});
	},
	
	openLogonDialog : function (sServiceUrl) {
		var logonDialog = new sap.m.Dialog();
		logonDialog.setTitle("Basic Authentication");

		var vbox = new sap.m.VBox();
		var _userInput = new sap.m.Input();
		_userInput.setPlaceholder("Username");
		var _pwdInput = new sap.m.Input();
		_pwdInput.setPlaceholder("Password");
		_pwdInput.setType(sap.m.InputType.Password);
		vbox.addItem(_userInput);
		vbox.addItem(_pwdInput);
		logonDialog.addContent(vbox);

		logonDialog.addButton(new sap.m.Button({text: "OK", press:function(){
			var username = _userInput.getValue();
			var password = _pwdInput.getValue();

			sap.hybrid.AuthODataAcess.logon(sServiceUrl, username, password, function (){
				logonDialog.close();
				sap.hybrid.startApp();
			}, function (){
				alert("Username or Password is incorrect!");
				_userInput.setValue("");
				_pwdInput.setValue("");
			}, function (e){
				//alert(e.statusText);
			});
		}}));
		logonDialog.addButton(new sap.m.Button({text: "Cancel", press: function() {logonDialog.close();}}));
		logonDialog.open();
	},

	triggeriOSAuth : function(url) {
		this.androidDialogAuth(url); // iOS default auth dialog doesn't show up hence custom dialog
	},

	androidDialogAuth : function(url) {
		sap.hybrid.AuthODataAcess.logon(url, null, null, function (){
			sap.hybrid.startApp();
		}, function (){
			sap.hybrid.AuthODataAcess.openLogonDialog(url);
		}, null);
	}
};