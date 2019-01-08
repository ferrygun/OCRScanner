jQuery.sap.require("sap.m.BusyDialog");
jQuery.sap.require("sap.ui.thirdparty.datajs");

sap.hybrid.OData.offlineStore = {
	appOfflineStore : {},

	/********************************************************************
	 * Creates a new OfflineStore object.
	 * Need to be online in the first time when the store is created.
	 * The store will be available for offline access only after it is open successfully.
	 * @param{Object} appContext SMP/HCPms logon input context
	 * @param{Object} reqObj offline store definition object
	 ********************************************************************/
	openAppOfflineStore : function(appContext, reqObj) {
	    console.log("open AppOffline Store");
	    if (!this.appOfflineStore.store) {
			this.appOfflineStore.startTime = new Date();
			
			var properties = {
				"name": "FApplicationOfflineStore",
				"host": appContext.registrationContext.serverHost,
				"port": appContext.registrationContext.serverPort,
				"https": appContext.registrationContext.https,
				"serviceRoot": appContext.applicationEndpointURL + "/",
				"definingRequests" : reqObj
			};
			
			var that = this;
			this.appOfflineStore.store = sap.OData.createOfflineStore(properties);
			
			var busyDL = new sap.m.BusyDialog();
			busyDL.setTitle("Open Offline Store");
			busyDL.setText("creating application offline store...");
			busyDL.open();
			
			this.appOfflineStore.store.open(
				function(){
					var endTime = new Date();
					var duration = (endTime - that.appOfflineStore.startTime)/1000;
					console.log("Offline Store opened in  " + duration + " seconds");
					
					busyDL.close();
					
					//set offline client
					sap.OData.applyHttpClient();
					
					//start applciation here
					sap.hybrid.startApp();
					
					that.appOfflineStore.appIsLoaded = true;
				}, 
				function(e){
					busyDL.close();
					console.log ("Failed to open offline store.");
					console.log("An error occurred: " + JSON.stringify(e));
					alert("Failed to open offline store.");
				});
	    }
	},

	/********************************************************************
	 * refresh offline store, synchronize data from server
	 * need to be online
	 ********************************************************************/
	refreshAppOfflineStore : function() {
		console.log("refresh AppOfflineStore.");
		if (!this.appOfflineStore.store) {
			console.log("The kapsel offline store must be open before it can be refreshed");
			return;
		}
		var that = this;
		if (sap.hybrid.SMP.isOnline) {
			this.appOfflineStore.startTimeRefresh = new Date();
			console.log("offline store refresh called");
			this.appOfflineStore.store.refresh(
				function(){
					var endTime = new Date();
					var duration = (endTime - that.appOfflineStore.startTimeRefresh)/1000;
					console.log("Store refreshed in  " + duration + " seconds");
					//reset
					that.appOfflineStore.refreshing = false;
					//call user's callback
					if(that.appOfflineStore.successCallback){
						that.appOfflineStore.successCallback();
						that.appOfflineStore.successCallback = null;
					}
				}, 
				function(e){
					console.log ("failed to refresh offline store.");
					//reset flag
					that.appOfflineStore.refreshing = false;
					console.log("An error occurred: " + JSON.stringify(e));
					
					//call user's callback
					if(that.appOfflineStore.errorCallback){
						that.appOfflineStore.errorCallback(e);
						that.appOfflineStore.errorCallback = null;
					}
				});
		}
	},

	/********************************************************************
	 * flush offline store, push changed data to server, need to be online
	 * if appOfflineStore.refreshing is set to true, 
	 * application will continue to call refreshAppOfflineStore() to refresh the offline store.
	 * ********************************************************************/
	flushAppOfflineStore : function() {
		console.log("flush AppOfflineStore.");
		if (!this.appOfflineStore.store) {
			console.log("The kapsel offline store must be open before it can be flushed");
			return;
		}
		
		var that = this;
		if (sap.hybrid.SMP.isOnline) {
			this.appOfflineStore.startTimeRefresh = new Date();
			console.log("offline store flush called");
			this.appOfflineStore.store.flush(
				function(){
					var endTime = new Date();
					var duration = (endTime - that.appOfflineStore.startTimeRefresh)/1000;
					console.log("Store flushed in  " + duration + " seconds");

				    if(that.appOfflineStore.refreshing) {
						that.refreshAppOfflineStore();
				    } else {
				    	//call user's callback
						if(that.appOfflineStore.successCallback){
							that.appOfflineStore.successCallback();
							that.appOfflineStore.successCallback = null;
						}
				    }
				}, 
				function(e){
					console.log ("Failed to flush offline store.");
					console.error("An error occurred: " + JSON.stringify(e));
					
					if (that.appOfflineStore.refreshing) {
						that.refreshAppOfflineStore();
				    } else {
				    	//call user's callback
						if(that.appOfflineStore.errorCallback){
							that.appOfflineStore.errorCallback(e);
							that.appOfflineStore.errorCallback = null;
						}
				    }
				});
		}
	}
};