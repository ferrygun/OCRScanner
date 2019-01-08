/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2014 SAP SE. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.ca.ui.CustomerControlListItem.
jQuery.sap.declare("sap.ca.ui.CustomerControlListItem");
jQuery.sap.require("sap.ca.ui.library");
jQuery.sap.require("sap.m.CustomListItem");


/**
 * Constructor for a new CustomerControlListItem.
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
 * <li>{@link #getShowSalesArea showSalesArea} : boolean (default: false)</li>
 * <li>{@link #getCustomerID customerID} : string (default: 'CustomerID')</li>
 * <li>{@link #getCustomerName customerName} : string (default: 'CustomerName')</li>
 * <li>{@link #getSalesOrganizationName salesOrganizationName} : string (default: 'SalesOrganizationName')</li>
 * <li>{@link #getDistributionChannelName distributionChannelName} : string (default: 'DistributionChannelName')</li>
 * <li>{@link #getDivisionName divisionName} : string (default: 'DivisionName')</li></ul>
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
 * 
 * In addition, all settings applicable to the base type {@link sap.m.CustomListItem#constructor sap.m.CustomListItem}
 * can be used as well.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Extends the ObjectListItem to display a line in the customer context control.
 * @extends sap.m.CustomListItem
 * @version 1.52.0
 *
 * @constructor
 * @public
 * @deprecated Since version 1.24.3. 
 * This control is not required anymore as per central UX requirements.
 * Please use Contextual Filter design instead!
 * This control will not be supported anymore.
 * @name sap.ca.ui.CustomerControlListItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.m.CustomListItem.extend("sap.ca.ui.CustomerControlListItem", { metadata : {

	deprecated : true,
	library : "sap.ca.ui",
	properties : {

		/**
		 * Display or not the customers sales area as well as its name and id.
		 */
		"showSalesArea" : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 * The ID of the customer
		 */
		"customerID" : {type : "string", group : "Misc", defaultValue : 'CustomerID'},

		/**
		 * The name of the customer
		 */
		"customerName" : {type : "string", group : "Misc", defaultValue : 'CustomerName'},

		/**
		 * The sales organization name
		 */
		"salesOrganizationName" : {type : "string", group : "Misc", defaultValue : 'SalesOrganizationName'},

		/**
		 * The distribution channel name
		 */
		"distributionChannelName" : {type : "string", group : "Misc", defaultValue : 'DistributionChannelName'},

		/**
		 * The division name
		 */
		"divisionName" : {type : "string", group : "Misc", defaultValue : 'DivisionName'}
	}
}});


/**
 * Creates a new subclass of class sap.ca.ui.CustomerControlListItem with name <code>sClassName</code> 
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
 * @name sap.ca.ui.CustomerControlListItem.extend
 * @function
 */


/**
 * Getter for property <code>showSalesArea</code>.
 * Display or not the customers sales area as well as its name and id.
 *
 * Default value is <code>false</code>
 *
 * @return {boolean} the value of property <code>showSalesArea</code>
 * @public
 * @name sap.ca.ui.CustomerControlListItem#getShowSalesArea
 * @function
 */

/**
 * Setter for property <code>showSalesArea</code>.
 *
 * Default value is <code>false</code> 
 *
 * @param {boolean} bShowSalesArea  new value for property <code>showSalesArea</code>
 * @return {sap.ca.ui.CustomerControlListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.CustomerControlListItem#setShowSalesArea
 * @function
 */


/**
 * Getter for property <code>customerID</code>.
 * The ID of the customer
 *
 * Default value is <code>CustomerID</code>
 *
 * @return {string} the value of property <code>customerID</code>
 * @public
 * @name sap.ca.ui.CustomerControlListItem#getCustomerID
 * @function
 */

/**
 * Setter for property <code>customerID</code>.
 *
 * Default value is <code>CustomerID</code> 
 *
 * @param {string} sCustomerID  new value for property <code>customerID</code>
 * @return {sap.ca.ui.CustomerControlListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.CustomerControlListItem#setCustomerID
 * @function
 */


/**
 * Getter for property <code>customerName</code>.
 * The name of the customer
 *
 * Default value is <code>CustomerName</code>
 *
 * @return {string} the value of property <code>customerName</code>
 * @public
 * @name sap.ca.ui.CustomerControlListItem#getCustomerName
 * @function
 */

/**
 * Setter for property <code>customerName</code>.
 *
 * Default value is <code>CustomerName</code> 
 *
 * @param {string} sCustomerName  new value for property <code>customerName</code>
 * @return {sap.ca.ui.CustomerControlListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.CustomerControlListItem#setCustomerName
 * @function
 */


/**
 * Getter for property <code>salesOrganizationName</code>.
 * The sales organization name
 *
 * Default value is <code>SalesOrganizationName</code>
 *
 * @return {string} the value of property <code>salesOrganizationName</code>
 * @public
 * @name sap.ca.ui.CustomerControlListItem#getSalesOrganizationName
 * @function
 */

/**
 * Setter for property <code>salesOrganizationName</code>.
 *
 * Default value is <code>SalesOrganizationName</code> 
 *
 * @param {string} sSalesOrganizationName  new value for property <code>salesOrganizationName</code>
 * @return {sap.ca.ui.CustomerControlListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.CustomerControlListItem#setSalesOrganizationName
 * @function
 */


/**
 * Getter for property <code>distributionChannelName</code>.
 * The distribution channel name
 *
 * Default value is <code>DistributionChannelName</code>
 *
 * @return {string} the value of property <code>distributionChannelName</code>
 * @public
 * @name sap.ca.ui.CustomerControlListItem#getDistributionChannelName
 * @function
 */

/**
 * Setter for property <code>distributionChannelName</code>.
 *
 * Default value is <code>DistributionChannelName</code> 
 *
 * @param {string} sDistributionChannelName  new value for property <code>distributionChannelName</code>
 * @return {sap.ca.ui.CustomerControlListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.CustomerControlListItem#setDistributionChannelName
 * @function
 */


/**
 * Getter for property <code>divisionName</code>.
 * The division name
 *
 * Default value is <code>DivisionName</code>
 *
 * @return {string} the value of property <code>divisionName</code>
 * @public
 * @name sap.ca.ui.CustomerControlListItem#getDivisionName
 * @function
 */

/**
 * Setter for property <code>divisionName</code>.
 *
 * Default value is <code>DivisionName</code> 
 *
 * @param {string} sDivisionName  new value for property <code>divisionName</code>
 * @return {sap.ca.ui.CustomerControlListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.CustomerControlListItem#setDivisionName
 * @function
 */

// Start of sap/ca/ui/CustomerControlListItem.js
/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
//
// This file defines behavior for the control
//
jQuery.sap.declare("sap.ca.ui.CustomerControlListItem");
jQuery.sap.require("sap.m.Label");
jQuery.sap.require("sap.m.Text");
jQuery.sap.require("sap.m.ObjectIdentifier");
jQuery.sap.require("sap.ca.ui.utils.resourcebundle");
jQuery.sap.require("sap.ca.ui.model.format.FormattingLibrary");

sap.ca.ui.CustomerControlListItem.prototype._getFormattedObjectIdentifier = function () {
    var sName = this.getCustomerName();
    var sId = this.getCustomerID();
    var sFullName;
    // if the id evaluates to 0, then don't display it, just the name
    if (parseInt(sId, 10) !== 0) {
        sFullName = sap.ca.ui.model.format.FormattingLibrary.commonIDFormatter(sName, sId);
    } else {
        sFullName = sName;
    }
    return sFullName;
};

/**
 * Lazy loads _objectIdentifierControl aggregation.
 *
 * @private
 */
sap.ca.ui.CustomerControlListItem.prototype._getObjectIdentifierControl = function () {
    var oObjectIdentifierControl,
        oContent = this._oContent;

    if (oContent) {
        var items = oContent.getItems();
        if (items && items.length > 0) {
            oObjectIdentifierControl = items[0];
        }
    }

    return oObjectIdentifierControl;
};


/**
 * Update the text of _objectIdentifierControl aggregation.
 *
 * @private
 */
sap.ca.ui.CustomerControlListItem.prototype._updateObjectIdentifierControlText = function () {
    var oObjectIdentifierControl = this._getObjectIdentifierControl();
    if (oObjectIdentifierControl) {
        oObjectIdentifierControl.setTitle(this._getFormattedObjectIdentifier(), false);
    }
};

/**
 * Lazy loads _salesArea aggregation.
 *
 * @private
 */
sap.ca.ui.CustomerControlListItem.prototype._getSalesArea = function () {
    var oSalesArea,
        oContent = this._oContent;

    if (oContent) {
        var items = oContent.getItems();
        if (items && items.length > 2) {
            oSalesArea = items[2];
        }
    }

    return oSalesArea;
};

/**
 * Get the value to use for the _salesArea aggregation text.
 *
 * @private
 */
sap.ca.ui.CustomerControlListItem.prototype._getFormattedSalesAreaText = function () {
    return this.getSalesOrganizationName() + ", " + this.getDistributionChannelName() + ", " + this.getDivisionName();
};

/**
 * Update the text of _salesArea aggregation.
 *
 * @private
 */
sap.ca.ui.CustomerControlListItem.prototype._updateSalesAreaText = function () {
    var oSalesArea = this._getSalesArea();
    if (oSalesArea) {
        oSalesArea.setText(this._getFormattedSalesAreaText(), false);
    }
};

/**
 *  Add the SalesArea controls to the content
 *
 *@private
 */
sap.ca.ui.CustomerControlListItem.prototype._addSalesArea = function () {
    if (this._oContent) {
        var oLabel = new sap.m.Label({text: sap.ca.ui.utils.resourcebundle.getText("CustomerContext.SalesArea")});
        var oText = new sap.m.Text({text: this._getFormattedSalesAreaText()});
        this._oContent.addItem(oLabel);
        this._oContent.addItem(oText);
    }
};

sap.ca.ui.CustomerControlListItem.prototype.getContent = function () {
    if (typeof this._oContent === 'undefined') {
        this._oContent = new sap.m.VBox();
        this._oContent.addStyleClass("sapCaUiCustomerContextListItem");
        // This style is to mimic the former style that was induced by the use of the sap.m.Table ; used for the font size.
        this._oContent.addStyleClass("sapMListTblCell");
        var oObjectIdentifier = new sap.m.ObjectIdentifier({title: this._getFormattedObjectIdentifier()});
        this._oContent.addItem(oObjectIdentifier);

        if (this.getShowSalesArea()) {
            this._addSalesArea();
        }
    }

    return [this._oContent];
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Properties
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

sap.ca.ui.CustomerControlListItem.prototype.setShowSalesArea = function (sValue) {
    // always suppress rerendering
    var items,
        oContent = this._oContent;
    if (oContent) {
        items = oContent.getItems();
    }

    this.setProperty("showSalesArea", sValue, true);

    if (items) {
        var bShowSalesArea = this.getShowSalesArea();
        if (bShowSalesArea && items.length === 1) {
            this._addSalesArea();
        } else if (!bShowSalesArea && items.length === 3) {
            var oSalesAreaLabel = items[1];
            var oSalesAreaText = items[2];
            oContent.removeItem(oSalesAreaText);
            oContent.removeItem(oSalesAreaLabel);
            oSalesAreaLabel.destroy();
            oSalesAreaText.destroy();
        }
    }
    return this;
};

sap.ca.ui.CustomerControlListItem.prototype.setCustomerID = function (sValue) {
    // always suppress rerendering
    this.setProperty("customerID", sValue, true);
    this._updateObjectIdentifierControlText();
    return this;
};

sap.ca.ui.CustomerControlListItem.prototype.setCustomerName = function (sValue) {
    // always suppress rerendering
    this.setProperty("customerName", sValue, true);
    this._updateObjectIdentifierControlText();
    return this;
};

sap.ca.ui.CustomerControlListItem.prototype.setSalesOrganizationName = function (sValue) {
    // always suppress rerendering
    this.setProperty("salesOrganizationName", sValue, true);
    this._updateSalesAreaText();
    return this;
};

sap.ca.ui.CustomerControlListItem.prototype.setDistributionChannelName = function (sValue) {
    // always suppress rerendering
    this.setProperty("distributionChannelName", sValue, true);
    this._updateSalesAreaText();
    return this;
};

sap.ca.ui.CustomerControlListItem.prototype.setDivisionName = function (sValue) {
    // always suppress rerendering
    this.setProperty("divisionName", sValue, true);
    this._updateSalesAreaText();
    return this;
};

