/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.scfld.md.ConfigurationBase");
jQuery.sap.require("sap.ca.scfld.md.ApplicationFacade");
jQuery.sap.require("sap.ca.scfld.md.app.ConnectionManager");
jQuery.sap.require("sap.ca.scfld.md.app.ApplicationImplementation");
jQuery.sap.require("sap.ca.scfld.md.app.Application");

/**
 * @class
 * @name sap.ca.scfld.md.ConfigurationBase
 * @extends sap.ui.base.ManagedObject
 * @public
 */
sap.ui.base.ManagedObject.extend("sap.ca.scfld.md.ConfigurationBase", {
	metadata : {
		properties : {
			"identifier" : "string"
		},
		publicMethods : ["setApplicationFacade"]
	},

	_setApplicationFacade : function (oApplicationFacade) {
		this.oApplicationFacade = oApplicationFacade;
		this.setApplicationFacade(oApplicationFacade);
	},


	/**
	* Override this method when you want to store a reference to the <code>ApplicationFacade</code> in some place where you can
	* access it. Note that all controllers inheriting from the <code>ScfldMaster/BaseMaster/Detail/FullscreenController</code> automatically
	* possess an attribute <code>oApplicationFacade</code>. </br>
	* However, it may be useful to have access to the facade e.g. in a class providing formatters.
	* @param {Object} oApplicationFacade the application facade for this App
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#setApplicationFacade
	* @function
	* @memberOf sap.ca.scfld.md.ConfigurationBase
	* */
	setApplicationFacade : function (oApplicationFacade) {

	},
	/**
	* @deprecated
	* This Method is deprecated. Use the corresponding method of ApplicationFacade instead.
	* @returns {boolean} true if the application runs on mock data, i.e. was started with URL parameter "responderOn=true"
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#isMock
	* @function
	*/
	// will be removed soon. Use method in ApplicationFacade
	isMock : function () {
		// The "reponder" URL parameter defines if the app shall run with mock
		// data
		var responderOn = jQuery.sap.getUriParameters().get("responderOn");

		// set the flag for later usage
		return (responderOn === "true");
	},

	/**
	* Override this method when the application wants to use a master list which allows for multi
	* selection.
	* The application needs to implement proper selection handling by itself if multi selection
	* is used.
	*
	* @returns {boolean} true if the application allows to use the master list with multi selection.
	* Default is <code>false</code>.
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#keepMultiSelection
	* @function
	* @memberOf sap.ca.scfld.md.ConfigurationBase
	* @see sap.m.ListMode.MultiSelect
	* @since 1.25.1
	*/
	keepMultiSelection : function () {
		return false;
	},

	/**
	* Specifies the list of attributes that identify a list item
	* Needs to be overwritten by the app
	* @returns {array} the list of attributes (strings) of a master list item that identify one entry.
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#getMasterKeyAttributes
	* @function
	*/
	getMasterKeyAttributes : function () {
		return null;
	},

	/**
	* Getter for the service list to be used as source for the Connection Manager
	* Needs to be overwritten by the app
	* @returns {object} the list of ODataModel to instantiate with their corresponding url / mock url
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#getServiceList
	* @function
	*/
	getServiceList : function () {
		return null;
	},

	/**
	* Getter for the list of parameters to be excluded from appending to the URL for the Services
	* Needs to be overwritten by the app if parameters need to be excluded from the service call
	* @returns {array} the list of parameters to be excluded from appending to the URL for the Service
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#getExcludedQueryStringParameters
	* @function
	*/
	getExcludedQueryStringParameters : function () {
		return null;
	},

	/**
	* returns the language key of the detail views title defined in the apps language model
	* Needs to be overwritten by the app in case the default key name doesn't match the apps title key
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#getDetailTitleKey
	* @function
	*/
	getDetailTitleKey : function () {
		return "DETAIL_TITLE";
	},

	/**
	* returns the language key of the empty views default text to be shown in cases where empty view is implicitly
	* displayed by the scaffolding
	* @public
	* @name sap.ca.scfld.md.ConfigurationBase#getDefaultEmptyMessageKey
	* @function
	*/
	getDefaultEmptyMessageKey : function () {
		return "NO_ITEMS_AVAILABLE";
	},

	/**
	* Indicates whether stable IDs should be generated for scaffolding buttons.
	* Override this method if the application wants to use stable IDs.
	*
	* @returns {boolean} true if the application uses stable IDs.
	* Default is <code>false</code>.
	* @name sap.ca.scfld.md.ConfigurationBase#isUsingStableIds
	* @function
	* @memberOf sap.ca.scfld.md.ConfigurationBase
	* @since 1.27.1
	* @public
	*/
	isUsingStableIds : function () {
		return false;
	}
});
