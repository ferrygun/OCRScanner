/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.scfld.md.ApplicationFacade");
/**
* @class llll This class represents a Master Detail App. It provides access to generic services.
* Note that the App does not create an instance of this class on its own.
* The App will get access to this instance in its implementation of &lt;identity&gt;.Configuration.getApplicationParameters(oApplicationFacade).
* It is recommended that the app stores the reference to this instance in an appropriate variable .
* @name sap.ca.scfld.md.ApplicationFacade
* @extends sap.ui.base.Object
* @public
*/
sap.ui.base.Object.extend("sap.ca.scfld.md.ApplicationFacade",{


	constructor : function (oApplicationImplementation) {
		this.oApplicationImplementation = oApplicationImplementation;
	},

	/**
	* Use this method to access the resource bundle of the App
	* @returns the resource bundle of this App
	* @public
	* @function
	* @name sap.ca.scfld.md.ApplicationFacade#getResourceBundle
	* @memberOf sap.ca.scfld.md.ApplicationFacade
	*/
	getResourceBundle : function () {
		return this.oApplicationImplementation.getResourceBundle();
	},

	/**
	* Return a specific ODataModel based on its name as defined in the configuration.</br>
	* Note that there is a special logic in case the specified name is <i>i18n</i>. In this case the
	* resource model for this App is returned.
	* @param {string} sName the name of the ODataModel to retrieve, or undefined for the default model
	* @returns {sap.ui.model.Model} the requested ODataModel. Actually this will be an
	* instance of <code>sap.ui.model.odata.ODataModel</code>. The only exception is, when <code>sName == 'i18n'</code>.
	* In this case it is an instance of <code>sap.ui.model.resource.ResourceModel</code>.
	* @public
	* @name sap.ca.scfld.md.ApplicationFacade#getODataModel
	* @function
	*/
	getODataModel : function (sName) {
		return this.oApplicationImplementation.getODataModel(sName);
	},

	/**
	* Utility function to determine if we are running the application against
	* some mock data
	*
	* @returns {boolean} A flag depending on the <code>responderOn</code> uri
	*          parameter
	* @public
	* @name sap.ca.scfld.md.ApplicationFacade#isMock
	* @function
	*/
	isMock : function () {
		return this.oApplicationImplementation.isMock();
	},

	/**
	* Store a sap.ui.model instance in a global hashmap for the application.
	* This is used to allow apps to share models between different views.
	* The models will not be assigned to the views automatically but can be retrieved and assigned manually.
	* This is mainly made to have dirty hacks like settings model on sap.ui.getCore() or reading data from the oSplitContainer
	* @param {string} sName The name for the model (must be non null)
	* @param {sap.ui.model.Model} oModel the model to store
	* @public
	* @name sap.ca.scfld.md.ApplicationFacade#setApplicationModel
	* @function
	*/
	setApplicationModel : function (sName, oModel) {
		this.oApplicationImplementation.setApplicationModel(sName, oModel);
	},

	/**
	* Retrieve a model stored in the global hashmap based on its name
	* @param {string} sName the string of the model to retrieve
	* @public
	* @name sap.ca.scfld.md.ApplicationFacade#getApplicationModel
	* @function
	*/
	getApplicationModel : function (sName) {
		return this.oApplicationImplementation.getApplicationModel(sName);
	},

	/**
	* returns the scaffolding language model
	* @public
	* @name sap.ca.scfld.md.ApplicationFacade#getUiLibResourceModel
	* @returns {object} the scaffolding language model
	* @function
	*/
	getUiLibResourceModel : function () {
		return this.oApplicationImplementation.getUiLibResourceBundle();
	},

	/**
	* Registers a function to be called directly after a refresh was performed on the Master List of a master-detail app.
	* The function will be called for all master list refreshes regardless if they were triggered manually by clicking
	*"refresh" or automatically during a back end search
	* @param  {function} fHandler The function that has to be called at a master list refresh
	* @param  {object} oListener is the object that provides the handler function
	* @public
	* @name sap.ca.scfld.md.ApplicationFacade#registerOnMasterListRefresh
	* @function
	*/
	registerOnMasterListRefresh : function (fHandler, oListener) {
		return this.oApplicationImplementation.attachEvent("_scfldOnMasterListRefresh", fHandler, oListener);
	},

	/**
	* Deregisters a function that was previously registered with method "registerOnMasterListRefresh". The method
	* parameters have to be the same as during the registration
	* @param {function} fHandler The function that has to be called at a master list refresh
	* @param {object} oListener is the object that provides the handler function
	* @public
	* @name sap.ca.scfld.md.ApplicationFacade#deRegisterOnMasterListRefresh
	* @function
	*/
	deRegisterOnMasterListRefresh : function (fHandler, oListener) {
		return this.oApplicationImplementation.detachEvent("_scfldOnMasterListRefresh", fHandler, oListener);
	}

});
