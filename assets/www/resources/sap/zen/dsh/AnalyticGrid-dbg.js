/*!
 * (c) Copyright 2010-2018 SAP SE or an SAP affiliate company.
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.zen.dsh.AnalyticGrid.
jQuery.sap.declare("sap.zen.dsh.AnalyticGrid");
jQuery.sap.require("sap.zen.dsh.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new AnalyticGrid.
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
 * <li>{@link #getWidth width} : sap.ui.core.CSSSize</li>
 * <li>{@link #getHeight height} : sap.ui.core.CSSSize</li>
 * <li>{@link #getSelection selection} : object</li>
 * <li>{@link #getQueryName queryName} : string</li>
 * <li>{@link #getSystemAlias systemAlias} : string</li>
 * <li>{@link #getState state} : string</li></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul>
 * <li>{@link sap.zen.dsh.AnalyticGrid#event:stateChange stateChange} : fnListenerFunction or [fnListenerFunction, oListenerObject] or [oData, fnListenerFunction, oListenerObject]</li>
 * <li>{@link sap.zen.dsh.AnalyticGrid#event:selectionChange selectionChange} : fnListenerFunction or [fnListenerFunction, oListenerObject] or [oData, fnListenerFunction, oListenerObject]</li></ul>
 * </li>
 * </ul> 

 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Control for embedding a Design Studio Analytic Grid in an S/4 HANA Fiori application
 * @extends sap.ui.core.Control
 * @version 1.52.4
 *
 * @constructor
 * @public
 * @since 1.46
 * @experimental Since version 1.46. 
 * API is incomplete and may change incompatibly
 * @name sap.zen.dsh.AnalyticGrid
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.zen.dsh.AnalyticGrid", { metadata : {

	library : "sap.zen.dsh",
	properties : {
		"width" : {type : "sap.ui.core.CSSSize", group : "Appearance", defaultValue : null},
		"height" : {type : "sap.ui.core.CSSSize", group : "Appearance", defaultValue : null},
		"selection" : {type : "object", group : "Data", defaultValue : null},
		"queryName" : {type : "string", group : "Data", defaultValue : null},
		"systemAlias" : {type : "string", group : "Data", defaultValue : null},
		"state" : {type : "string", group : "Data", defaultValue : null}
	},
	events : {
		"stateChange" : {}, 
		"selectionChange" : {}
	}
}});


/**
 * Creates a new subclass of class sap.zen.dsh.AnalyticGrid with name <code>sClassName</code> 
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
 * @name sap.zen.dsh.AnalyticGrid.extend
 * @function
 */

sap.zen.dsh.AnalyticGrid.M_EVENTS = {'stateChange':'stateChange','selectionChange':'selectionChange'};


/**
 * Getter for property <code>width</code>.
 * Desired width of the AnalyticGrid control
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.CSSSize} the value of property <code>width</code>
 * @public
 * @name sap.zen.dsh.AnalyticGrid#getWidth
 * @function
 */

/**
 * Setter for property <code>width</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.CSSSize} sWidth  new value for property <code>width</code>
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#setWidth
 * @function
 */


/**
 * Getter for property <code>height</code>.
 * Desired width of the AnalyticGrid control
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {sap.ui.core.CSSSize} the value of property <code>height</code>
 * @public
 * @name sap.zen.dsh.AnalyticGrid#getHeight
 * @function
 */

/**
 * Setter for property <code>height</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {sap.ui.core.CSSSize} sHeight  new value for property <code>height</code>
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#setHeight
 * @function
 */


/**
 * Getter for property <code>selection</code>.
 * A SelectionVariant specifying the initial selection state used by the AnalyticGrid. Depending on the specific query and selection variant state, this will result in setting one or more variables' values and setting one or more filters on the datasource.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>selection</code>
 * @public
 * @name sap.zen.dsh.AnalyticGrid#getSelection
 * @function
 */

/**
 * Setter for property <code>selection</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oSelection  new value for property <code>selection</code>
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#setSelection
 * @function
 */


/**
 * Getter for property <code>queryName</code>.
 * Name of the Query to bind the AnalyticGrid to.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>queryName</code>
 * @public
 * @name sap.zen.dsh.AnalyticGrid#getQueryName
 * @function
 */

/**
 * Setter for property <code>queryName</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sQueryName  new value for property <code>queryName</code>
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#setQueryName
 * @function
 */


/**
 * Getter for property <code>systemAlias</code>.
 * Target System alias for data connectivity
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>systemAlias</code>
 * @public
 * @name sap.zen.dsh.AnalyticGrid#getSystemAlias
 * @function
 */

/**
 * Setter for property <code>systemAlias</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sSystemAlias  new value for property <code>systemAlias</code>
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#setSystemAlias
 * @function
 */


/**
 * Getter for property <code>state</code>.
 * A string representing the current state of the analytic grid, including data selection and navigation state. Intended to be used for saving and recreating inner application state in navigation scenarios, for example.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>state</code>
 * @public
 * @name sap.zen.dsh.AnalyticGrid#getState
 * @function
 */

/**
 * Setter for property <code>state</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sState  new value for property <code>state</code>
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#setState
 * @function
 */


/**
 * Event is triggered when the state of the AnalyticGrid is changed.
 *
 * @name sap.zen.dsh.AnalyticGrid#stateChange
 * @event
 * @param {sap.ui.base.Event} oControlEvent
 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
 * @param {object} oControlEvent.getParameters
 * @param {string} oControlEvent.getParameters.state Serialized state string.
 * @public
 */
 
/**
 * Attach event handler <code>fnFunction</code> to the 'stateChange' event of this <code>sap.zen.dsh.AnalyticGrid</code>.<br/>.
 * When called, the context of the event handler (its <code>this</code>) will be bound to <code>oListener<code> if specified
 * otherwise to this <code>sap.zen.dsh.AnalyticGrid</code>.<br/> itself. 
 *  
 * Event is triggered when the state of the AnalyticGrid is changed.
 *
 * @param {object}
 *            [oData] An application specific payload object, that will be passed to the event handler along with the event object when firing the event.
 * @param {function}
 *            fnFunction The function to call, when the event occurs.  
 * @param {object}
 *            [oListener] Context object to call the event handler with. Defaults to this <code>sap.zen.dsh.AnalyticGrid</code>.<br/> itself.
 *
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#attachStateChange
 * @function
 */

/**
 * Detach event handler <code>fnFunction</code> from the 'stateChange' event of this <code>sap.zen.dsh.AnalyticGrid</code>.<br/>
 *
 * The passed function and listener object must match the ones used for event registration.
 *
 * @param {function}
 *            fnFunction The function to call, when the event occurs.
 * @param {object}
 *            oListener Context object on which the given function had to be called.
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#detachStateChange
 * @function
 */

/**
 * Fire event stateChange to attached listeners.
 * 
 * Expects following event parameters:
 * <ul>
 * <li>'state' of type <code>string</code> Serialized state string.</li>
 * </ul>
 *
 * @param {Map} [mArguments] the arguments to pass along with the event.
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @protected
 * @name sap.zen.dsh.AnalyticGrid#fireStateChange
 * @function
 */


/**
 * Event is triggered when the selection is changed.
 *
 * @name sap.zen.dsh.AnalyticGrid#selectionChange
 * @event
 * @param {sap.ui.base.Event} oControlEvent
 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
 * @param {object} oControlEvent.getParameters
 * @param {object} oControlEvent.getParameters.selection A SelectionVariant specifying the current selection state of the AnalyticGrid.
 * @public
 */
 
/**
 * Attach event handler <code>fnFunction</code> to the 'selectionChange' event of this <code>sap.zen.dsh.AnalyticGrid</code>.<br/>.
 * When called, the context of the event handler (its <code>this</code>) will be bound to <code>oListener<code> if specified
 * otherwise to this <code>sap.zen.dsh.AnalyticGrid</code>.<br/> itself. 
 *  
 * Event is triggered when the selection is changed.
 *
 * @param {object}
 *            [oData] An application specific payload object, that will be passed to the event handler along with the event object when firing the event.
 * @param {function}
 *            fnFunction The function to call, when the event occurs.  
 * @param {object}
 *            [oListener] Context object to call the event handler with. Defaults to this <code>sap.zen.dsh.AnalyticGrid</code>.<br/> itself.
 *
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#attachSelectionChange
 * @function
 */

/**
 * Detach event handler <code>fnFunction</code> from the 'selectionChange' event of this <code>sap.zen.dsh.AnalyticGrid</code>.<br/>
 *
 * The passed function and listener object must match the ones used for event registration.
 *
 * @param {function}
 *            fnFunction The function to call, when the event occurs.
 * @param {object}
 *            oListener Context object on which the given function had to be called.
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.dsh.AnalyticGrid#detachSelectionChange
 * @function
 */

/**
 * Fire event selectionChange to attached listeners.
 * 
 * Expects following event parameters:
 * <ul>
 * <li>'selection' of type <code>object</code> A SelectionVariant specifying the current selection state of the AnalyticGrid.</li>
 * </ul>
 *
 * @param {Map} [mArguments] the arguments to pass along with the event.
 * @return {sap.zen.dsh.AnalyticGrid} <code>this</code> to allow method chaining
 * @protected
 * @name sap.zen.dsh.AnalyticGrid#fireSelectionChange
 * @function
 */

// Start of sap\zen\dsh\AnalyticGrid.js
/**
 * This file defines behavior for the control,
 */
$.sap.require('sap.ui.thirdparty.URI');

window.DSH_deployment = true; 
var sapbi_ajaxHandler = sapbi_ajaxHandler || {};
window.sapbi_page = window.sapbi_page || {};
sapbi_page.getParameter = sapbi_page.getParameter || function(){return "";};
var sapbi_MIMES_PIXEL = sapbi_MIMES_PIXEL || "";

if (!window.sap) {
	window.sap = {};
}

if (!sap.zen) {
	sap.zen = {};
}

sap.zen.doReplaceDots = true;

sap.zen.dsh.AnalyticGrid.prototype.init = function() {
	this.parameters = {};
	this.dshBaseUrl = URI(sap.ui.resource("sap.zen.dsh","rt/")).absoluteTo(window.location.pathname).toString();
    sapbi_page.staticMimeUrlPrefix = this.dshBaseUrl;
    this.repositoryUrl = URI(sap.ui.resource("sap.zen.dsh","applications/")).absoluteTo(window.location.pathname).toString();
};

sap.zen.dsh.AnalyticGrid.prototype._initializeInternal = function() {
	if(this.initialized) {
		this.page.forceFullNonDeltaRender();
		return;
	}
    this.initialized = true;

	this._addParameter("XQUERY", this.getQueryName());

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
    
    if (this.getState()) {
    	this._initializeInnerAppState(this.getState());
    } else {
	    this._initializeSelectionVariant(this.getSelection());
    }
    var that = this;
	setTimeout(function(){
		that._createPage();
	}, 0);
};

sap.zen.dsh.AnalyticGrid.prototype._createPage = function() {
	sap.zen.dsh.scriptLoaded= true; 
	
	var that = this;
	var oConfig = sap.ui.getCore().getConfiguration();

	var language = oConfig.getLocale().getSAPLogonLanguage();

	if (!language) {
		language = window.navigator.userLanguage || window.navigator.language;
	}
	
	var client = "";
	if(document.cookie) {
		var match = /(?:sap-usercontext=)*sap-client=(\d{3})/.exec(document.cookie);
		if (match && match[1])
		{
			client = match[1];
		}
	} 
	
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
	designStudio.setApplicationPath(this.repositoryUrl + "0ANALYTIC_GRID");
	designStudio.setApplicationName("0ANALYTIC_GRID");			
	designStudio.setUrlParameter(urlParams);
	designStudio.setSdkLoaderPath("");
	designStudio.setHanaMode(true);
	designStudio.setDshControlId(that.getId());
	designStudio.setStaticMimesRootPath(this.dshBaseUrl);
	designStudio.setSystemAlias(this.getSystemAlias());
	designStudio.setNewBW(true);

	this.page = designStudio.createPage();	
	//Still needed for now, should be removed ASAP
	window[that.getId()+"Buddha"] = this.page;
	
	sapbi_page = sapbi_page || {};
	sapbi_page.staticMimeUrlPrefix = this.dshBaseUrl;
	sapbi_page.getParameter = function(){return "";};
	sapbi_MIMES_PIXEL = "";
};

sap.zen.dsh.AnalyticGrid.prototype.onAfterRendering = function(){
	this._initializeInternal(); 
};

sap.zen.dsh.AnalyticGrid.prototype._logoff = function(){
	if (!this.loggedOff) {
		this.loggedOff = true;
		this._executeScript("APPLICATION.logoff();");
	}
}

sap.zen.dsh.AnalyticGrid.prototype.exit = function(){
	this._logoff();

	var oRootAbsLayout = sap.ui.getCore().byId(this.sId + "ROOT_absolutelayout");
	
	if (oRootAbsLayout) {
		oRootAbsLayout.destroy();
	}
};

sap.zen.dsh.AnalyticGrid.prototype._addParameter = function(name, value) {
	this.parameters[name] = value;
};

sap.zen.dsh.AnalyticGrid.prototype._executeScript = function(script){
	this.page.getWindow().increaseLock();
	this.page && this.page.exec && this.page.exec(script);
};

sap.zen.dsh.AnalyticGrid.prototype.setSelection = function(oSelectionVariant) {
	this.setProperty("selection", oSelectionVariant, true);
	if (this.initialized) {
		var oNavParams = this._buildNavParamObject(oSelectionVariant);
		
		this.page.navigationParamObject = JSON.stringify(oNavParams);
		this._executeScript("GLOBAL_SCRIPT_ACTIONS.ApplyNavigationParameters();");
	}
	return this;
}

sap.zen.dsh.AnalyticGrid.prototype.fireSelectionChange = function(mParameters) {
	this.setProperty("selection", mParameters.selection, true);
	return this.fireEvent("selectionChange", mParameters);
}

sap.zen.dsh.AnalyticGrid.prototype._buildNavParamObject = function(oSelectionVariant) {
	function addValuesToObject(sObject, oValueHolder, sValue) {
		if (!oValueHolder.hasOwnProperty(sObject)) {
			oValueHolder[sObject] = sValue;
		}
	}

	var oNavParams = {};
	
	if (oSelectionVariant) {
		var aParameters = oSelectionVariant.Parameters;
		var aSelectOptions = oSelectionVariant.SelectOptions;
		
		//Nav Parameters are NOT mapped <--> semantic objects.
		if (aParameters) {
			for (var parameterNum = 0; parameterNum < aParameters.length; parameterNum++) {
				var oParameter = aParameters[parameterNum];

				oNavParams[oParameter.PropertyName] = oParameter.PropertyValue;
			} 
		}

		if (aSelectOptions) {
			for (var i = 0; i < aSelectOptions.length; ++i) {
				var oSelectOption = aSelectOptions[i];
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
					addValuesToObject(oSelectOption.PropertyName, oNavParams, aFilters);
				}
			}
		}
	}
	return oNavParams;
}

sap.zen.dsh.AnalyticGrid.prototype._initializeSelectionVariant = function(oSelectionVariant) {
	var oNavParams = this._buildNavParamObject(oSelectionVariant);
	
	if (!jQuery.isEmptyObject(oNavParams)) {
		this._addParameter("NAV_PARAMS", JSON.stringify(oNavParams));
	}
}


sap.zen.dsh.AnalyticGrid.prototype._initializeInnerAppState = function(sState) {
	if (sState) {
		this._addParameter("NAV_INITIAL_STATE", sState);
	}
}

sap.zen.dsh.AnalyticGrid.prototype.setState = function (sState) {
	this.setProperty("state", sState, true);
	if (this.initialized) {
		this.page.getWindow().getContext("BookmarkInternal").applyApplicationState(sState, true);
		this.page.forceFullNonDeltaRender();
	}
	return this;
}

sap.zen.dsh.AnalyticGrid.prototype.fireStateChange = function(mParameters) {
	this.setProperty("state", mParameters.state, true);
	return this.fireEvent("stateChange", mParameters);
}