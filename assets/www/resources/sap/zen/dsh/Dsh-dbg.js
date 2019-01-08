/*!
 * (c) Copyright 2010-2018 SAP SE or an SAP affiliate company.
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.zen.dsh.Dsh.
jQuery.sap.declare("sap.zen.dsh.Dsh");
jQuery.sap.require("sap.zen.dsh.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new Dsh.
 * 
 * Accepts an object literal <code>mSettings</code> that defines initial 
 * property values, aggregated and associated objects as well as event handlers. 
 * 
 * If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
 * then the framework assumes property, aggregation, association, event in that order. 
 * To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
 * or "event:" can be added to the name of the setting (such a prefixed name must be
 * enclosed in single or double quotes).
 *
 * The supported settings are:
 * <ul>
 * <li>Properties
 * <ul>
 * <li>{@link #getDshAppName dshAppName} : string (default: '0ANALYSIS')</li>
 * <li>{@link #getRepoPath repoPath} : string</li>
 * <li>{@link #getWidth width} : sap.ui.core.CSSSize</li>
 * <li>{@link #getHeight height} : sap.ui.core.CSSSize</li>
 * <li>{@link #getDeployment deployment} : string (default: 'bw')</li>
 * <li>{@link #getProtocol protocol} : string</li>
 * <li>{@link #getClient client} : string</li>
 * <li>{@link #getLanguage language} : string</li>
 * <li>{@link #getSemanticMappings semanticMappings} : object</li>
 * <li>{@link #getAppComponent appComponent} : object</li>
 * <li>{@link #getDeferCreation deferCreation} : boolean (default: false)</li>
 * <li>{@link #getSystemAlias systemAlias} : string</li></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul></ul>
 * </li>
 * </ul> 

 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Control for embedding a Design Studio application full-screen in an S/4 HANA Fiori application
 * @extends sap.ui.core.Control
 * @version 1.52.4
 *
 * @constructor
 * @public
 * @since 1.44
 * @name sap.zen.dsh.Dsh
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.zen.dsh.Dsh", { metadata : {

	publicMethods : [
		// methods
		"addParameter", "executeScript", "getDataSource", "getComponent", "getPage", "createPage", "initializeAppStateData", "initializeAppState"
	],
	library : "sap.zen.dsh",
	properties : {
		"dshAppName" : {type : "string", group : "Misc", defaultValue : '0ANALYSIS'},
		"repoPath" : {type : "string", group : "Misc", defaultValue : null},
		"width" : {type : "sap.ui.core.CSSSize", group : "Misc", defaultValue : null},
		"height" : {type : "sap.ui.core.CSSSize", group : "Misc", defaultValue : null},
		"deployment" : {type : "string", group : "Misc", defaultValue : 'bw'},
		"protocol" : {type : "string", group : "Misc", defaultValue : null},
		"client" : {type : "string", group : "Misc", defaultValue : null},
		"language" : {type : "string", group : "Misc", defaultValue : null},
		"semanticMappings" : {type : "object", group : "Misc", defaultValue : null},
		"appComponent" : {type : "object", group : "Misc", defaultValue : null},
		"deferCreation" : {type : "boolean", group : "Misc", defaultValue : false},
		"systemAlias" : {type : "string", group : "Misc", defaultValue : null}
	}
}});


/**
 * Creates a new subclass of class sap.zen.dsh.Dsh with name <code>sClassName</code> 
 * and enriches it with the information contained in <code>oClassInfo</code>.
 * 
 * <code>oClassInfo</code> might contain the same kind of informations as described in {@link sap.ui.core.Element.extend Element.extend}.
 *   
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class  
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.zen.dsh.Dsh.extend
 * @function
 */


/**
 * Getter for property <code>dshAppName</code>.
 * Name of the Design Studio application to be opened.
 *
 * Default value is <code>0ANALYSIS</code>
 *
 * @return {string} the value of property <code>dshAppName</code>
 * @public
 * @name sap.zen.dsh.Dsh#getDshAppName
 * @function
 */

/**
 * Setter for property <code>dshAppName</code>.
 *
 * Default value is <code>0ANALYSIS</code> 
 *
 * @param {string} sDshAppName  new value for property <code>dshAppName</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setDshAppName
 * @function
 */


/**
 * Getter for property <code>repoPath</code>.
 * Path to application specified by dshAppName
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>repoPath</code>
 * @public
 * @name sap.zen.dsh.Dsh#getRepoPath
 * @function
 */

/**
 * Setter for property <code>repoPath</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sRepoPath  new value for property <code>repoPath</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setRepoPath
 * @function
 */


/**
 * Getter for property <code>width</code>.
 * Desired width of the Design Studio Control
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.CSSSize} the value of property <code>width</code>
 * @public
 * @name sap.zen.dsh.Dsh#getWidth
 * @function
 */

/**
 * Setter for property <code>width</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.CSSSize} sWidth  new value for property <code>width</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setWidth
 * @function
 */


/**
 * Getter for property <code>height</code>.
 * Desired height of the Design Studio Control
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.CSSSize} the value of property <code>height</code>
 * @public
 * @name sap.zen.dsh.Dsh#getHeight
 * @function
 */

/**
 * Setter for property <code>height</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.CSSSize} sHeight  new value for property <code>height</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setHeight
 * @function
 */


/**
 * Getter for property <code>deployment</code>.
 *
 * Default value is <code>bw</code>
 *
 * @return {string} the value of property <code>deployment</code>
 * @public
 * @name sap.zen.dsh.Dsh#getDeployment
 * @function
 */

/**
 * Setter for property <code>deployment</code>.
 *
 * Default value is <code>bw</code> 
 *
 * @param {string} sDeployment  new value for property <code>deployment</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setDeployment
 * @function
 */


/**
 * Getter for property <code>protocol</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>protocol</code>
 * @public
 * @name sap.zen.dsh.Dsh#getProtocol
 * @function
 */

/**
 * Setter for property <code>protocol</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sProtocol  new value for property <code>protocol</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setProtocol
 * @function
 */


/**
 * Getter for property <code>client</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>client</code>
 * @public
 * @name sap.zen.dsh.Dsh#getClient
 * @function
 */

/**
 * Setter for property <code>client</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sClient  new value for property <code>client</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setClient
 * @function
 */


/**
 * Getter for property <code>language</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>language</code>
 * @public
 * @name sap.zen.dsh.Dsh#getLanguage
 * @function
 */

/**
 * Setter for property <code>language</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sLanguage  new value for property <code>language</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setLanguage
 * @function
 */


/**
 * Getter for property <code>semanticMappings</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>semanticMappings</code>
 * @public
 * @name sap.zen.dsh.Dsh#getSemanticMappings
 * @function
 */

/**
 * Setter for property <code>semanticMappings</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oSemanticMappings  new value for property <code>semanticMappings</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setSemanticMappings
 * @function
 */


/**
 * Getter for property <code>appComponent</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>appComponent</code>
 * @public
 * @name sap.zen.dsh.Dsh#getAppComponent
 * @function
 */

/**
 * Setter for property <code>appComponent</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oAppComponent  new value for property <code>appComponent</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setAppComponent
 * @function
 */


/**
 * Getter for property <code>deferCreation</code>.
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>deferCreation</code>
 * @public
 * @name sap.zen.dsh.Dsh#getDeferCreation
 * @function
 */

/**
 * Setter for property <code>deferCreation</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bDeferCreation  new value for property <code>deferCreation</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setDeferCreation
 * @function
 */


/**
 * Getter for property <code>systemAlias</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>systemAlias</code>
 * @public
 * @name sap.zen.dsh.Dsh#getSystemAlias
 * @function
 */

/**
 * Setter for property <code>systemAlias</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sSystemAlias  new value for property <code>systemAlias</code>
 * @return {sap.zen.dsh.Dsh} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.Dsh#setSystemAlias
 * @function
 */


/**
 *
 * @name sap.zen.dsh.Dsh#addParameter
 * @function
 * @param {string} sName
 * @param {string} sValue
 * @type string
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */


/**
 *
 * @name sap.zen.dsh.Dsh#executeScript
 * @function
 * @param {string} sScript
 * @type void
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */


/**
 *
 * @name sap.zen.dsh.Dsh#getDataSource
 * @function
 * @param {string} sName
 * @type object
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */


/**
 *
 * @name sap.zen.dsh.Dsh#getComponent
 * @function
 * @param {string} sName
 * @type object
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */


/**
 *
 * @name sap.zen.dsh.Dsh#getPage
 * @function
 * @type object
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */


/**
 *
 * @name sap.zen.dsh.Dsh#createPage
 * @function
 * @type void
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */


/**
 * Initialize cross-application navigation state directly with AppStateData. e.g., when calculated by sap.ui.generic.app.navigation.service.NavigationHandler
 *
 * @name sap.zen.dsh.Dsh#initializeAppStateData
 * @function
 * @param {object} oOStateData
 *         The AppStateData to apply
 * @param {object} oONavParams
 *         Simple Javascript object containing name-value pairs of additional navigation state to be mixed in
 * @type void
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */


/**
 * Initialize cross-application navigation state with an AppState object
 *
 * @name sap.zen.dsh.Dsh#initializeAppState
 * @function
 * @param {object} oOStartupAppState
 *         The AppState object from which to retrieve and apply Application State.
 * @param {object} oONavParams
 *         Simple Javascript object containing name-value pairs of additional navigation state to be mixed in
 * @type void
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */

// Start of sap\zen\dsh\Dsh.js
sap.ui.getCore().loadLibrary("sap.viz");
$.sap.require('sap.ui.thirdparty.URI');

/**
 * This file defines behavior for the control,
 */
window.DSH_deployment = true; 
var sapbi_ajaxHandler = sapbi_ajaxHandler || {};
window.sapbi_page = window.sapbi_page || {};
sapbi_page.getParameter = sapbi_page.getParameter || function(){return "";};
var sapbi_MIMES_PIXEL = sapbi_MIMES_PIXEL || "";
sapbi_page.staticMimeUrlPrefix = sap.ui.resource("sap.zen.dsh","rt/");

if (!window.sap) {
	window.sap = {};
}

if (!sap.zen) {
	sap.zen = {};
}

sap.zen.doReplaceDots = true;

sap.zen.dsh.Dsh.prototype.init = function() {
	this.initial = true;
	this.parameters = {};
	this.dshBaseUrl = URI(sap.ui.resource("sap.zen.dsh","rt/")).absoluteTo(window.location.pathname).toString();
	this.dshBaseAppUrlBW = "/sap/bw/Mime";
};

sap.zen.dsh.Dsh.prototype.doInit = function() {
	//0ANALYSIS will always come from our library for now.  This will be cleaned up later.
	if (this.getDshAppName() === "0ANALYSIS" || this.getDshAppName() === "0ANALYTIC_GRID") {
		this.setRepoPath(URI(sap.ui.resource("sap.zen.dsh","applications/")).absoluteTo(window.location.pathname).toString());
	}
	
	if (this.getRepoPath() !== "") {
		this.repositoryUrl = this.getRepoPath();
	}
	
	if(!this.initial){
		return;
	}
    this.initial = false;

    jQuery.sap.require("sap.zen.dsh.rt.all");

    /*
     * load modules required in Debug Mode
     * 	- load jszip synchron
     * 	- load xlsx synchron
     */
    if (jQuery.sap.debug() === "true") {
		jQuery.sap.require("sap.zen.dsh.rt.zen_rt_firefly.js.jszip");
		jQuery.sap.require("sap.zen.dsh.rt.zen_rt_firefly.js.xlsx");
    }
    
	var that = this;
	if (!this.getDeferCreation()) {
		setTimeout(function(){
			that.doIt();
		}, 0);
	}
};

sap.zen.dsh.Dsh.prototype.createPage = function() {
	this.doIt();
}

sap.zen.dsh.Dsh.prototype.doIt = function() {
	this.doInit();
	sap.zen.dsh.scriptLoaded= true; 
	
	var that = this;
	{
		var language = that.getLanguage();
		if(!language){
			var oConfig = sap.ui.getCore().getConfiguration();

			language = oConfig.getLocale().getSAPLogonLanguage();

			if (!language) {
				language = window.navigator.userLanguage || window.navigator.language;
			}
		} 
		
		var client = that.getClient();
		if(!client && document.cookie){
			var match = /(?:sap-usercontext=)*sap-client=(\d{3})/.exec(document.cookie);
			if (match && match[1])
			{
				client = match[1];
			}
		} 

		var deployment = that.getDeployment();
		if(!deployment || deployment.length===0){
			deployment = "bw";
		}

		var app = that.getDshAppName();

		// ensure valid URL parameters are contained within parameters
		var loStartupParameters = this.getStartupParameters();
		if (loStartupParameters) {
			for (var lStartupParameter in loStartupParameters) {
				if (this.isDshParameter(lStartupParameter)) {
					if (!this.doesParameterExist(lStartupParameter)) {
						this.addParameter(lStartupParameter, loStartupParameters[lStartupParameter][0]);
					}
				}
			}
		}
		// add all parameters to urlParams
		var urlParams = sap.firefly.XHashMapOfStringByString.create();		
		for (var key in this.parameters) {
			urlParams.put(key, this.parameters[key]);
		}


		var designStudio = new sap.zen.DesignStudio();
		designStudio.setHost(document.location.hostname);
		designStudio.setPort(document.location.port);
		designStudio.setProtocol(document.location.protocol.split(":")[0]);
		designStudio.setClient(client);
		designStudio.setLanguage(language);
		if (this.repositoryUrl) {
			designStudio.setRepositoryUrl(this.repositoryUrl);
		}
		designStudio.setApplicationPath(this.dshBaseAppUrlBW);
		designStudio.setApplicationName(app);			
		designStudio.setUrlParameter(urlParams);
		designStudio.setSdkLoaderPath("");
		designStudio.setHanaMode(true);
		designStudio.setDshControlId(that.getId());
		designStudio.setStaticMimesRootPath(this.dshBaseUrl);
		designStudio.setSystemAlias(this.getSystemAlias());
		if (deployment === "bw2" || deployment === "bw") {
			designStudio.setNewBW(true);
		}
		designStudio.setRightToLeft(sap.ui.getCore().getConfiguration().getRTL());

		this._page = designStudio.createPage();	
		
		window[this._page.getPageIdForScripting()] = this._page;
		
		sapbi_page = sapbi_page || {};
		sapbi_page.staticMimeUrlPrefix = this.dshBaseUrl;
		sapbi_page.getParameter = function(){return "";};
		sapbi_MIMES_PIXEL = "";

		//set appComponent on frontend sapbi_page, in case it is passed in.
		if (this.getAppComponent()) {
			sapbi_page.appComponent = this.getAppComponent();
		}
		
		var customCSS = this._page.getApplicationPropertiesComponent().getCustomCSSName();
		if (customCSS) {
			var fileref = document.createElement('link');
			fileref.setAttribute("type", "text/css");
			fileref.setAttribute("rel", "stylesheet");
			fileref.setAttribute("href", URI(this._page.getRelativePathToApp() + customCSS).normalize().toString());
			document.getElementsByTagName("head")[0].appendChild(fileref);
		}
	}
};

sap.zen.dsh.Dsh.prototype.onAfterRendering = function(){
	this.doInit(); 
};

sap.zen.dsh.Dsh.prototype.logoff = function(){
	if (this._page && !this.loggedOff){
			this.loggedOff = true;
			window.buddhaHasSendLock++;
			this._page.exec("APPLICATION.logoff();");
	}
}

sap.zen.dsh.Dsh.prototype.exit = function(){
	this.logoff();

	var oRootAbsLayout = sap.ui.getCore().byId(this.sId + "ROOT_absolutelayout");
	
	if (oRootAbsLayout) {
		oRootAbsLayout.destroy();
	}
};

sap.zen.dsh.Dsh.prototype.addParameter = function(name, value) {
	this.parameters[name] = value;
};

sap.zen.dsh.Dsh.prototype.doesParameterExist = function(name) {
	if (this.parameters[name]) {
		return true;
	}
	return false;
};

sap.zen.dsh.Dsh.prototype.getStartupParameters = function() {
	if (this.getAppComponent()) {
		if (this.getAppComponent().getComponentData()) {
			return this.getAppComponent().getComponentData().startupParameters;
		}
	}
	return null;
}

sap.zen.dsh.Dsh.prototype.isDshParameter = function(name) {
	if (name === "XQUERY" || name === "XVISIBLEPROMPTS" || name === "XDATALIMIT_ROWS" || name === "XDATALIMIT_COLS") {
		return true;
	}
	return false;
}

sap.zen.dsh.Dsh.prototype.executeScript = function(script){
	this.page.exec(script);
};

sap.zen.dsh.Dsh.prototype.getDataSource = function(name){
	return this.page.getDataSource(name);
};

sap.zen.dsh.Dsh.prototype.getComponent = function(name){
	return this.page.getComponent(name);
};

sap.zen.dsh.Dsh.prototype.getPage = function(){
	return this.page;
};

sap.zen.dsh.Dsh.prototype.getMapping = function(sName){
	if (this.getSemanticMappings() && this.getSemanticMappings()[sName]) {
		return this.getSemanticMappings()[sName];
	}
	return sName;
}

sap.zen.dsh.Dsh.prototype.initializeAppStateData = function(oStateData, oNavParams) {
	function addMappedValuesToObject(oMapping, oValueHolder, sValue) {
		if (Array.isArray(oMapping)) {
			for (var entry in oMapping) {
				if (!oValueHolder.hasOwnProperty(oMapping[entry])) {
					oValueHolder[oMapping[entry]] = sValue;
				}
			}
		}
		else {
			if (!oValueHolder.hasOwnProperty(oMapping)) {
				oValueHolder[oMapping] = sValue;
			}
		}
	}

	oNavParams = oNavParams || {};
	if (oStateData && oStateData.customData && oStateData.customData.bookmarkedAppState) {
		this.addParameter("NAV_INITIAL_STATE", oStateData.customData.bookmarkedAppState);
	}
	
	if (oStateData && oStateData.selectionVariant) {
		//We either have a real selectionVariant as js object here, or we have 
		//it in string format.  If string format, then there is also an oSelectionVariant, 
		//see sap.ui.generic.app.navigation.service.SelectionVariant
		var oSelectionVariant = oStateData.selectionVariant;
		if (typeof oSelectionVariant !== "object" && typeof oStateData.oSelectionVariant === "object" && oStateData.oSelectionVariant.toJSONObject) {
				oSelectionVariant = oStateData.oSelectionVariant.toJSONObject();
		}
		var aParameters = oSelectionVariant.Parameters;
		var aSelectOptions = oSelectionVariant.SelectOptions;
		
		//Nav Parameters are NOT mapped <--> semantic objects.
		if (aParameters) {
			for (var parameterNum = 0; parameterNum < aParameters.length; parameterNum++) {
				var oParameter = aParameters[parameterNum];

				// do not add allowed URL parameters to navigation parameters
				if (this.isDshParameter(oParameter.PropertyName)) {
					continue;
				}
				
				oNavParams[oParameter.PropertyName] = oParameter.PropertyValue;
			} 
		}

		if (aSelectOptions) {
			for (var i = 0; i < aSelectOptions.length; ++i) {
				var oSelectOption = aSelectOptions[i];
				
				// do not add allowed URL parameters to navigation parameters
				if (this.isDshParameter(oSelectOption.PropertyName)) {
					continue;
				}
				
				var aRanges = oSelectOption.Ranges;
				var aFilters = [];

				for (var j = 0; j < aRanges.length; ++j) {
					var filterValue;
					var oRange = aRanges[j];

					//Skip if this value uses an unsupported operation
					if (["EQ","BT","GE","LE","GT","LT"].indexOf(oRange.Option) == -1) {
						continue;
					}

					//For simple equals inclusions, use string instead of object. 
					if (oRange.Sign === "I" && oRange.Option === "EQ") {
						filterValue = oRange.Low;
					} else {
						filterValue = {
							exclude : oRange.Sign === "E" || undefined,
							operation : oRange.Option,
							from : oRange.Low,
							to : oRange.High
						};
					}
					aFilters.push(filterValue);
				}
				if (aFilters.length > 0) {
					addMappedValuesToObject(this.getMapping(oSelectOption.PropertyName), oNavParams, aFilters);
				}
			}
		}
	}
	if (!jQuery.isEmptyObject(oNavParams)) {
		this.addParameter("NAV_PARAMS", JSON.stringify(oNavParams));
	}
}

sap.zen.dsh.Dsh.prototype.initializeAppState = function(oStartupAppState, oNavParams){
	if (oStartupAppState) {
		var oStateData = {};
		//Do stuff with state
		if (oStartupAppState.getData && typeof oStartupAppState.getData === "function" ) {
			oStateData = oStartupAppState.getData();
		}
		this.initializeAppStateData(oStateData, oNavParams);
	}
};

