/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global",
	"../library",
	"sap/m/MultiEditField",
	"./ControlHelper",
	"./LabelProvider",
	"sap/ui/core/Item"
], function(jQuery, library, MultiEditField, ControlHelper, LabelProvider, Item) {
	"use strict";

	/**
	 * Constructor for a new <code>sap.ui.comp.smartmultiedit.Field</code>.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class The Field provides access to pre-defined items within a select box. See sap.m.MultiEditField.
	 * In addition, the Field is handling metadata for a given OData property name to enable multi-editing for several contexts.
	 * The handling of the contexts is done by the <code>sap.ui.comp.smartmultiedit.Container</code> control.
	 * @extends sap.m.MultiEditField
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @public
	 * @experimental since 1.52.0
	 * @since 1.52.0
	 * @sap-restricted sap.ui.comp.smartmultiedit.Field
	 * @alias sap.ui.comp.smartmultiedit.Field
	 */
	var Field = MultiEditField.extend("sap.ui.comp.smartmultiedit.Field", /** @lends sap.ui.comp.smartmultiedit.Field.prototype **/ {
		metadata: {
			library: "sap.ui.comp",
			designTime: true,
			properties: {
				/**
				 * The OData property name to fetch metadata for.
				 * Please note that this is not a dynamic UI5 property!
				 */
				propertyName: {
					type: "string",
					group: "Misc",
					defaultValue: null,
					bindable: false
				}
			},
			aggregations: {},
			events: {},
			associations: {}
		},
		fragment: "sap.m.MultiEditField"
	});

	Field.prototype.init = function() {
		MultiEditField.prototype.init.apply(this);
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");

		this._getBoolTrueItem = jQuery.sap.getter(new Item({
			key: "_sap_ui_comp_smartmultiedit_true",
			text: this._oRb.getText("SMARTFIELD_CB_YES")
		}));
		this._getBoolFalseItem = jQuery.sap.getter(new Item({
			key: "_sap_ui_comp_smartmultiedit_false",
			text: this._oRb.getText("SMARTFIELD_CB_NO")
		}));

		this._oControlHelper = new ControlHelper({
			fieldInstance: this
		});
		this._oControlHelper.enrichBeforeFactory();

		this.attachEvent("_valueHelpRequest", this._onValueHelpRequest, this);
	};

	Field.prototype.exit = function() {
		MultiEditField.prototype.exit.apply(this);

		this._oControlHelper.destroy();

		if (this._oControlFactory) {
			this._oControlFactory.destroy();
		}

		if (this._oLabelProvider) {
			this._oLabelProvider.destroy();
		}

		this._getBoolTrueItem().destroy();
		this._getBoolFalseItem().destroy();
	};

	/**
	 * Returns the raw value for the OData property that is determined by the propertyName property.
	 * If the 'Keep existing value' item is selected, an empty plain object is returned.
	 *
	 * @returns {object} An object containing the property name and the raw value, i.e. non-formatted value.
	 * @public
	 */
	Field.prototype.getRawValue = function() {
		var oResult = {},
			vValue,
			oSelectedItem = this.getSelectedItem(),
			sPropertyName = this.getPropertyName();

		if (oSelectedItem === this._getBoolTrueItem()) {
			vValue = true;
		} else if (oSelectedItem === this._getBoolFalseItem()) {
			vValue = false;
		} else if (this.isBlankSelected()) {
			vValue = null;
		} else if (oSelectedItem) {
			vValue = oSelectedItem.data("value");
		}

		// We have to explicitly check undefined, as vValue can contain values that are evaluated to false
		// --> a simple "!vValue" is not possible here
		if (!this.isKeepExistingSelected() && typeof vValue !== "undefined") {
			oResult[sPropertyName] = vValue;
		}

		return oResult;
	};

	/**
	 * Initializes the Field based on the property name.
	 * The function returns a Promise that is resolved if metadata handling is done and the instance is ready to be rendered.
	 *
	 * @param {string} entitySetName The name of the entity set of the parent container.
	 * @returns {Promise} A promise that is resolved when all <code>sap.ui.model.Context</code> are copied and updated.
	 * @protected
	 */
	Field.prototype.initialize = function(entitySetName) {
		return new Promise(function(resolve) {
			var oLabel;

			if (!this._oControlFactory) {
				this._oControlFactory = this._oControlHelper.createFactory({
					entitySet: entitySetName,
					propertyName: this.getPropertyName()
				});
			}

			// This has to be called after the factory has been created.
			this._oControlHelper.enrichAfterFactory();

			// By calling the _init function, the factory resolves all property metadata we need, including the OData type.
			// We can save us some metadata handling by reusing this method.
			this._oControlFactory._init(this._oControlFactory._oMeta);

			// Do label handling only when the label instance is available
			oLabel = this.getAssociation("ariaLabelledBy");
			if (oLabel && !this._oLabelProvider) {
				this._oLabelProvider = new LabelProvider({
					fieldInstance: this,
					labelInstance: sap.ui.getCore().byId(oLabel),
					metaDataProperty: this._oControlFactory._oMetaData.property.property
				});
			}

			this._oControlHelper.addControlInitialization(this._oControlFactory).then(function() {
				this._updateItems();
				resolve();
			}.bind(this));
		}.bind(this));
	};

	/**
	 * Triggers value selection if the Field has been initialized.
	 * @private
	 */
	Field.prototype._onValueHelpRequest = function() {
		if (this._oControlHelper) {
			this._oControlHelper.triggerValueSelection();
		}
	};

	/**
	 * Adds items that are needed for value handling for the current control type, while also removing irrelevant items.
	 *
	 * @private
	 */
	Field.prototype._updateItems = function() {
		var sType = this._oControlHelper.getControlName();

		if (sType === "sap.m.CheckBox") {
			this.setProperty("showValueHelp", false, true);
			this.addAggregation("items", this._getBoolTrueItem(), true);
			this.addAggregation("items", this._getBoolFalseItem(), true);
			this.setProperty("selectedItem", this._getKeepAll(), true);
			this.invalidate();
		}
	};

	return Field;
});
