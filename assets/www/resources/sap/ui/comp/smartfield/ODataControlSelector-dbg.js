/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Selector for controls that are hosted by <code>sap.ui.comp.smartfield.SmartField</code>.
 *
 * @private
 * @name sap.ui.comp.smartfield.ODataControlSelector
 * @author SAP SE
 * @version 1.52.4
 * @since 1.28.0
 * @param {jQuery} jQuery a reference to the jQuery implementation.
 * @returns {sap.ui.comp.smartfield.ODataControlSelector} new control selector instance.
 */
sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.entityType the OData entity type definition.
	 * @param {object} oMetaData.annotations the OData annotations.
	 * @param {string} oMetaData.path the binding path.
	 * @param {sap.ui.core.Control} oParent the parent control.
	 * @param {sap.ui.comp.smartfield.ODataTypes} oTypes types utility.
	 */
	var ODataControlSelector = function(oMetaData, oParent, oTypes) {
		this._oMetaData = oMetaData;
		this._oParent = oParent;
		this._oTypes = oTypes;
	};

	/**
	 * Checks whether a combo-box should be displayed.
	 *
	 * @param {boolean} bConfigOnly if set to <code>true</code>, only the control configuration will be checked.
	 * @returns {object} a flag indicating whether a combo-box should be displayed and the value list annotation to use the control to be created
	 *          regardless of whether a combo-box has to be created or not.
	 * @public
	 */
	ODataControlSelector.prototype.checkComboBox = function(bConfigOnly) {
		var oResult = {};

		// no annotation means no combo box in any case.
		if (this._oMetaData.annotations.valuelist) {
			oResult.valuelistType = this._oMetaData.annotations.valuelistType;
			oResult.annotation = this._oMetaData.annotations.valuelist;
		}

		if (!oResult.annotation) {
			return oResult;
		}

		// currently there is no replacement for <code>sap:semantics</code> with value <code>fixed-values</code>.
		if ((oResult.valuelistType === "fixed-values") && !bConfigOnly) {
			oResult.combobox = true;
		}

		// check configuration to find out whether a combo box should be created.
		if (!oResult.combobox) {
			oResult.annotation = this._oMetaData.annotations.valuelist;
			oResult.combobox = this._checkConfig("dropDownList");
		}

		return oResult;
	};

	/**
	 * Checks whether a <code>sap.m.Selection</code> should be displayed.
	 *
	 * @returns {object} a flag indicating whether a combo-box should be displayed and the value list annotation to use the control to be created
	 *          regardless of whether a <code>sap.m.Selection</code> has to be created or not.
	 * @public
	 */
	ODataControlSelector.prototype.checkSelection = function() {
		var oResult = {};

		// no annotation means no combo box in any case.
		if (this._oMetaData.annotations.valuelist) {
			oResult.annotation = this._oMetaData.annotations.valuelist;
			oResult.selection = this._checkConfig("selection");
		}

		return oResult;
	};

	/**
	 * Returns <code>true</code>, if a check box has to be rendered. The prerequisite is a property of Edm.type string with a maximum length of 1.
	 * Additionally the control has to be configured as a check box.
	 *
	 * @returns {boolean} <code>true</code>, if a check box has to be rendered, <code>false</code> otherwise.
	 * @public
	 */
	ODataControlSelector.prototype.checkCheckBox = function() {
		var oBind, iMaxLength;

		if (this._oMetaData.property && this._oMetaData.property.property && this._oMetaData.property.property.type === "Edm.String") {
			oBind = this._oParent.getBindingInfo("value");
			iMaxLength = this._oTypes.getMaxLength(this._oMetaData.property, oBind);

			if (iMaxLength === 1) {
				if (this._checkConfig("checkBox")) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Checks whether a <code>sap.m.DatePicker</code> has to be created. The <code>display-format</code> is evaluated and the control
	 * configuration.
	 *
	 * @returns {boolean} <code>true</code>, if a <code>sap.m.DatePicker</code> has to be created, <code>false</code> otherwise.
	 * @public
	 */
	ODataControlSelector.prototype.checkDatePicker = function() {

		// check the display-format annotation.
		// this method is only invoked for Edm.DateTime,
		// so no need exists to replace it with V4 annotations,
		// as Edm.DateTime is "pruned" in V4.
		if (this._oMetaData.property && this._oMetaData.property.property && this._oMetaData.property.property["sap:display-format"] === "Date") {
			return true;
		}

		// check the control configuration.
		return this._checkConfig("datePicker");
	};

	/**
	 * Checks whether a configuration exists for the given SmartField. If this is the case the controlType property is a validated.
	 *
	 * @param {string} sType the value of the type property to be checked against.
	 * @returns {boolean} <code>true</code>, if a configuration exists and the controlType property has the given value, <code>false</code>
	 *          otherwise.
	 * @private
	 */
	ODataControlSelector.prototype._checkConfig = function(sType) {
		var oConfig = this._oParent.getConfiguration();

		if (oConfig) {
			return oConfig.getControlType() === sType;
		}

		return false;
	};

	/**
	 * Returns the name of a method to create a control.
	 *
	 * @param {boolean} bBlockSmartLinkCreation if true, SmartLink will not be created
	 * @returns {string} the name of the factory method to create the control.
	 * @public
	 */
	ODataControlSelector.prototype.getCreator = function(bBlockSmartLinkCreation) {
		var bContextEditable = true,
			oConfig;

		var mMethods = {
			"Edm.Decimal": "_createEdmNumeric",
			"Edm.Double": "_createEdmNumeric",
			"Edm.Float": "_createEdmNumeric",
			"Edm.Single": "_createEdmNumeric",
			"Edm.Int16": "_createEdmNumeric",
			"Edm.Int32": "_createEdmNumeric",
			"Edm.Int64": "_createEdmNumeric",
			"Edm.Byte": "_createEdmNumeric",
			"Edm.DateTimeOffset": "_createEdmDateTimeOffset",
			"Edm.DateTime": "_createEdmDateTime",
			"Edm.Boolean": "_createEdmBoolean",
			"Edm.String": "_createEdmString",
			"Edm.Time": "_createEdmTime"
		};

		// check for unit of measure being displayed as object status.
		if (this._isUOMDisplayObjectStatus()) {
			return "_createEdmUOMObjectStatus";
		}

		// check for unit of measure being displayed as object number.
		if (this._isUOMDisplay()) {
			return "_createEdmUOMObjectNumber";
		}

		// context editable in smart form is on parent's parent in UOM for unit.
		oConfig = this._oParent.data("configdata");

		if (oConfig && oConfig.configdata && oConfig.configdata.isUOM) {
			if (oConfig.configdata.getContextEditable) {
				bContextEditable = oConfig.configdata.getContextEditable();
			}
		}

		// check for display mode.
		if (!this._oParent.getEditable() || !this._oParent.getEnabled() || !this._oParent.getContextEditable() || !bContextEditable) {
			if (this._oMetaData.annotations) {

				// ObjectIdentifier + SmartLink
				if (this.useObjectIdentifier(this.checkDatePicker()) && this._oMetaData.annotations.text && this._oMetaData.annotations.semanticKeys && this._oMetaData.annotations.semanticKeys.semanticKeyFields && this._oMetaData.annotations.semanticKeys.semanticKeyFields.indexOf(this._oMetaData.path) > -1) {
					return "_createEdmDisplay";
				}

				// SmartLink
				if (this._oMetaData.annotations.semantic && !bBlockSmartLinkCreation) {
					return "_createEdmSemantic";
				}

				if (this._oMetaData.annotations.uom) {
					return "_createEdmUOMDisplay";
				}

				if (this._isObjectStatusProposed()) {
					return "_createObjectStatus";
				}

				return (this._oMetaData.property && this._oMetaData.property.property && this._oMetaData.property.property.type === "Edm.Boolean") ? "_createEdmBoolean" : "_createEdmDisplay";
			}
		}

		// check for unit of measure.
		if (this._oMetaData.annotations && this._oMetaData.annotations.uom) {
			return "_createEdmUOM";
		}

		if (this._oMetaData.property && this._oMetaData.property.property) {

			// check by EdmType.
			return mMethods[this._oMetaData.property.property.type] || "_createEdmString";
		}

		return null;
	};

	/**
	 * Checks whether the complete unit of measure is in display mode.
	 *
	 * @returns {boolean} <code>true</code>, if the complete unit of measure is in display mode, <code>false</code> otherwise
	 * @private
	 */
	ODataControlSelector.prototype._isUOMDisplay = function() {

		if (this._oMetaData.annotations.uom) {

			if (this._isObjectNumberProposed()) {
				if (!this._oParent.getContextEditable() || (!this._oParent.getEditable() && !this._oParent.getUomEditable()) || (!this._oParent.getEnabled() && !this._oParent.getUomEnabled())) {
					return true;
				}

				// check field-control: unit and measure should be read-only!!!!
				if (this._oParent.getUomEditState() === 0) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Checks whether the complete unit of measure is in display mode and an object status control has to be displayed.
	 *
	 * @returns {boolean} <code>true</code>, if the complete unit of measure is in display mode and an object status control has to be displayed,
	 *          <code>false</code> otherwise
	 * @private
	 */
	ODataControlSelector.prototype._isUOMDisplayObjectStatus = function() {

		if (this._oMetaData.annotations.uom) {

			if (this._isObjectStatusProposed()) {

				if (!this._oParent.getContextEditable() || (!this._oParent.getEditable() && !this._oParent.getUomEditable()) || (!this._oParent.getEnabled() && !this._oParent.getUomEnabled())) {
					return true;
				}

				// check field-control: unit and measure should be read-only!!!!
				if (this._oParent.getUomEditState() === 0) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Checks whether an ObjectStatus is proposed.
	 *
	 * @returns {boolean} <code>true</code>, if ObjectStatus is proposed, <code>false</code> otherwise
	 * @private
	 */
	ODataControlSelector.prototype._isObjectStatusProposed = function() {
		var oProposal = this._oParent.getControlProposal(), oStatus;

		if (oProposal) {
			oStatus = oProposal.getObjectStatus();

			if (oStatus) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Checks whether the object number control has been proposed.
	 *
	 * @returns {boolean} <code>true</code>, the object number control has been proposed, <code>false</code> otherwise
	 * @private
	 */
	ODataControlSelector.prototype._isObjectNumberProposed = function() {
		var oProposal;

		if (this._oParent.data("suppressUnit") !== "true") {
			oProposal = this._oParent.getControlProposal();

			if (oProposal && oProposal.getControlType() === "ObjectNumber") {
				return true;
			}

			if (this._oParent.getProposedControl() === "ObjectNumber") {
				return true;
			}
		}

		return false;
	};

	/**
	 * Checks whether the <code>sap.m.ObjectIdentifier</code> control has to be created.
	 *
	 * @param {boolean} bDatePicker flag indicating whether a data picker has to be displayed
	 * @param {boolean} bMasked flag indicating whether a masked input field has to be displayed
	 * @returns {boolean} <code>true</code>, if <code>sap.m.ObjectIdentifier</code> control has to be created, <code>false</code> otherwise
	 * @public
	 */
	ODataControlSelector.prototype.useObjectIdentifier = function(bDatePicker, bMasked) {
		var oProposal;

		if (this._oMetaData && this._oMetaData.property && this._oMetaData.property.property && this._oMetaData.property.property.type === "Edm.String") {

			if (!bDatePicker && !bMasked) {
				oProposal = this._oParent.getControlProposal();

				if (oProposal && oProposal.getControlType() === "ObjectIdentifier") {
					return true;
				}

				if (this._oParent.getProposedControl() === "ObjectIdentifier") {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	ODataControlSelector.prototype.destroy = function() {
		this._oParent = null;
		this._oMetaData = null;
		this._oTypes = null;
	};

	return ODataControlSelector;

}, /* bExport= */true);
