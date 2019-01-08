jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.declare("sap.zen.dsh.fioriwrapper.Component");
sap.ui.core.UIComponent.extend("sap.zen.dsh.fioriwrapper.Component", {
	metadata : {
		"manifest" : "json"
	}}
);

sap.zen.dsh.fioriwrapper.Component.prototype.createContent = function () {
	jQuery.sap.require("sap.zen.dsh.Dsh");
	jQuery.sap.require("sap.ui.generic.app.navigation.service.NavigationHandler");
	sap.zen.dsh.scriptLoaded = true;
	var appName = "";
	var config = this.getMetadata().getConfig();
	var mappings = {};
	var reversed_mappings;
	var nav_params = {};
	var targetSystemAlias;
	
	function addMappedValuesToObject(oMapping, oValueHolder, sValue) {
		if (Array.isArray(oMapping)) {
			for (var entry in oMapping) {
				oValueHolder[oMapping[entry]] = sValue;
			}
		}
		else {
			oValueHolder[oMapping] = sValue;
		}
	}
	
	if (config) {
		if (config.semanticObjectMappings) {
			mappings = config.semanticObjectMappings;
			reversed_mappings = {}; 
			for (var key in mappings) {
				if (mappings.hasOwnProperty(key)) {
					addMappedValuesToObject(mappings[key], reversed_mappings, key);
				}
			}
		}
		if (config.appName) {
			appName = config.appName;
		}
		if (config.systemAlias) {
			targetSystemAlias = config.systemAlias;
		}
	}
	
    //startup parameters for appName targetSystemAlias override the configured settings 
	if (this.getComponentData().startupParameters) {        
		if (this.getComponentData().startupParameters.appName) 
			appName= this.getComponentData().startupParameters.appName;
		if (this.getComponentData().startupParameters["sap-system"]) {
			targetSystemAlias = this.getComponentData().startupParameters["sap-system"];
		}
	}

    var oDsh = new sap.zen.dsh.Dsh({
    	id:"dsh"+appName,
    	height:"100%",
    	width:"100%",
    	deployment: "bw",
    	dshAppName : appName,
    	repoPath : config.repoPath || "",
    	semanticMappings : mappings,
    	appComponent : this,
    	systemAlias : targetSystemAlias,
    	deferCreation : true
    });    

	if (this.getComponentData().startupParameters) {
		for (var param in this.getComponentData().startupParameters) {
			if (this.getComponentData().startupParameters.hasOwnProperty(param) && param !== "newBW") {
				var paramValue = this.getComponentData().startupParameters[param][0];
				oDsh.addParameter(param, paramValue);
				if (mappings && mappings.hasOwnProperty(param)) {
					addMappedValuesToObject(mappings[param], nav_params, paramValue);
				}
				else
				{
					nav_params[param] = paramValue;
				}
			}
		}
	}

    var oNavigationHandler = new sap.ui.generic.app.navigation.service.NavigationHandler(this);
    var oParseNavigationPromise = oNavigationHandler.parseNavigation();

    oParseNavigationPromise.always(function(oStartupData){
		oDsh.initializeAppStateData.call(oDsh, oStartupData, nav_params);
		if (config.navigationSourceObjects) {
			oDsh.addParameter("NAV_SOURCES", JSON.stringify(config.navigationSourceObjects));
		}
		if (reversed_mappings) {
			oDsh.addParameter("NAV_SEMANTIC_MAPPINGS", JSON.stringify(reversed_mappings));
		}

        oDsh.createPage();
    });
	
	return oDsh;
}