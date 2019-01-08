/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/core/Element', 'sap/m/Popover'
], function(Element, Popover) {
	"use strict";

	/**
	 * Constructor for a new FieldHelpBase.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Base type for <code>fieldFelp</code> aggregation in <code>Field</code> controls.
	 * @extends sap.ui.core.Element
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.50.0
	 * @alias sap.ui.mdc.experimental.FieldHelpBase
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FieldHelpBase = Element.extend("sap.ui.mdc.experimental.FieldHelpBase", /** @lends sap.ui.mdc.experimental.FieldHelpBase.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * The key of the selected item
				 *
				 * <b>Note:</b> This has only effects for FildHelps supporting keys.
				 */
				selectedKey: {
					type: "string",
					defaultValue: ""
				},
				/**
				 * The value for what the help should filter
				 *
				 * <b>Note:</b> This has only effects for FildHelps supporting filtering.
				 */
				filterValue: {
					type: "string",
					defaultValue: ""
				}
			},
			aggregations: {
				/**
				 * internal popover
				 */
				_popover: {
					type: "sap.m.Popover",
					multiple: false,
					visibility: "hidden"
				}
			},
			events: {
				/**
				 * This event is fired when a value is selected in the valueHelp
				 */
				select: {
					parameters: {

						/**
						 * The selected <code>value</code>.
						 */
						value: { type: "any" },

						/**
						 * The selected <code>additionalValue</code>.
						 */
						additionalValue: { type: "any" },

						/**
						 * The selected <code>key</code>.
						 */
						key: { type: "string" }
					}
				},
				/**
				 * This event is fired when a value is navigated in the valueHelp
				 */
				navigate: {
					parameters: {

						/**
						 * The navigated <code>value</code>.
						 */
						value: { type: "any" },

						/**
						 * The navigated <code>additionalValue</code>.
						 */
						additionalValue: { type: "any" },

						/**
						 * The navigated <code>key</code>.
						 */
						key: { type: "string" }
					}
				},
				/**
				 * This event is fired when the data of the FieldHelp has changed
				 *
				 * This is needed to determine the text of a key
				 */
				dataUpdate: {
				}
			}
		}
	});

	// define empty to add it to inherited FieldHelps, maybe later it might be filled and other fFielfHelps must not changed.
	FieldHelpBase.prototype.init = function() {

//		this._createPopover();

	};

	// define empty to add it to inherited FieldHelps, maybe later it might be filled and other fFielfHelps must not changed.
	FieldHelpBase.prototype.exit = function() {

	};

	FieldHelpBase.prototype.setSelectedKey = function(sKey) {

		this.setProperty("selectedKey", sKey, true); // do not invalidate while FieldHelp

	};

	FieldHelpBase.prototype.setFilterValue = function(sFilterValue) {

		this.setProperty("filterValue", sFilterValue, true); // do not invalidate while FieldHelp

	};

	/**
	 * Opens the FieldHelp on the parent <code>Field</code> control
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.open = function() {

		var oPopover = this._getPopover();
		var oField = this.getParent();

		if (oField && !oPopover.isOpen()) {
			var iWidth = oField.$().outerWidth();
			oPopover.setContentMinWidth(iWidth + "px");
			oPopover.openBy(oField);
		}

	};

	/**
	 * closes the FieldHelp
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.close = function() {

		var oPopover = this.getAggregation("_popover");

		if (oPopover) {
			oPopover.close();
		}

	};

	/**
	 * toggles the open state of the FieldHelp on the parent <code>Field</code> control
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.toggleOpen = function() {

		var oPopover = this._getPopover();

		if (oPopover.isOpen()) {
			this.close();
		} else {
			this.open();
		}

	};

	/**
	 * creates the internal Popover
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @return {sap.m.Popover} Popover
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._createPopover = function() {

		var oPopover = new sap.m.Popover(this.getId() + "-pop", {
			placement: sap.m.PlacementType.Bottom,
			showHeader: false,
			showArrow: false,
			afterOpen: this._handleAfterOpen.bind(this)
		});

		this.setAggregation("_popover", oPopover, true);

		return oPopover;

	};

	/**
	 * returns the internal Popover. If the Popover not exist it will be created
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @return {sap.m.Popover} Popover
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._getPopover = function() {

		var oPopover = this.getAggregation("_popover");

		if (!oPopover) {
			oPopover = this._createPopover();
		}

		return oPopover;

	};

	/**
	 * Executed after the Popup has opened
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._handleAfterOpen = function() {
	};

	/**
	 * Determines if the field help should be opened if something is typed into the field
	 *
	 * @return {boolean} if true the field help should open by typing
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.openByTyping = function() {

		return false;

	};

	/**
	 * Determines if the field should be rendered as link
	 *
	 * @return {boolean} if true the field should be rendered as link
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.showLink = function() {

		return false;

	};

//	/**
//	 * Determines if the focus should stay on the field if the help is open
//	 *
//	 * @return {boolean} if true the focus stays on the field
//	 * @public
//	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
//	 */
//	FieldHelpBase.prototype.getFocusOnField = function() {
//
//		return false;
//
//	};

	/**
	 * triggers navigation in the fieldHelp
	 *
	 * @param {int} iStep number of steps for navigation (e.g. 1 means next item, -1 means previous item)
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.navigate = function(iStep) {
		// to be implements by the concrete FieldHelp
	};

	/**
	 * Determines the text for an given key
	 *
	 * @param {string} sKey key
	 * @return {string} text for key
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.getTextForKey = function(sKey) {
		// to be implements by the concrete FieldHelp
		return "";
	};

	/**
	 * Determines the key for an given text
	 *
	 * <b>Note:</b> As this must not unique the result key may be just one for one of the matching texts
	 *
	 * @param {string} sText text
	 * @return {string} key for text
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.getKeyForText = function(sText) {
		// to be implements by the concrete FieldHelp
		return "";
	};

	/**
	 * Sets the content of the FieldHelp
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @param {string} oContent content control to be placed at the Popover
	 * @return {sap.ui.mdc.experimental.FieldHelpBase} Reference to <code>this</code> to allow method chaining
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._setContent = function(oContent) {

		var oPopover = this._getPopover();
		oPopover.removeAllContent();
		oPopover.addContent(oContent);
		return this;

	};

	return FieldHelpBase;

}, /* bExport= */true);
