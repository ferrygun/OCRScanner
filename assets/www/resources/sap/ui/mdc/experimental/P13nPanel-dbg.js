/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'jquery.sap.global', 'sap/m/library', 'sap/ui/core/XMLComposite', './P13nPanelFormatter', 'sap/ui/model/ChangeReason'
], function(jQuery, MLibrary, XMLComposite, P13nPanelFormatter, ChangeReason) {
	"use strict";

	/**
	 * Constructor for a new P13nPanel.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The P13nPanel control is used to define selection settings like the visibility or the order of items.
	 * @extends sap.ui.code.XMLComposite
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @abstract
	 * @private
	 * @since 1.48.0
	 * @alias sap.ui.mdc.experimental.P13nPanel
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nPanel = XMLComposite.extend("sap.ui.mdc.experimental.P13nPanel", /** @lends sap.ui.mdc.experimental.P13nPanel.prototype */
	{
		formatter: P13nPanelFormatter,

		metadata: {
			"abstract": true,
			library: "sap.ui.mdc",
			defaultAggregation: "items",
			aggregations: {
				/**
				 * Defines personalization items.
				 */
				items: {
					type: "sap.ui.mdc.experimental.P13nItem",
					multiple: true,
					singularName: "item"
				}
			}
		}
	});

	// ----------------------- Overwrite Method -----------------

	P13nPanel.prototype.init = function() {
		this._bInternalModelToBeUpdated = true;
		// Create a resource bundle for language specific texts
		this.setModel(new sap.ui.model.resource.ResourceModel({
			bundleUrl: sap.ui.getCore().getLibraryResourceBundle("sap.m").oUrlInfo.url
		// bundleName: 'sap.m'
		}), "i18n");

		// this._getManagedObjectModel().bindList("/items", null, [], []).attachChange(this._updateCounts, this);
	};

	P13nPanel.prototype.addItem = function(oItem) {
		this._bInternalModelToBeUpdated = true;
		this.addAggregation("items", oItem);
		return this;
	};

	P13nPanel.prototype.insertItem = function(oItem, iIndex) {
		this._bInternalModelToBeUpdated = true;
		this.insertAggregation("items", oItem, iIndex);
		return this;
	};

	P13nPanel.prototype.updateItems = function(sReason) {
		this.updateAggregation("items");
		if (sReason === ChangeReason.Change) {
			this._bInternalModelToBeUpdated = true;
		}
	};

	P13nPanel.prototype.removeItem = function(oItem) {
		this._bInternalModelToBeUpdated = true;
		return this.removeAggregation("items", oItem);
	};

	P13nPanel.prototype.removeAllItems = function() {
		this._bInternalModelToBeUpdated = true;
		return this.removeAllAggregation("items");
	};

	P13nPanel.prototype.destroyItems = function() {
		this._bInternalModelToBeUpdated = true;
		this.destroyAggregation("items");
		return this;
	};

	// ----------------------- Private Methods -----------------------------------------
	/**
	 * @private
	 */
	P13nPanel.prototype.onSearchFieldLiveChange = function(oEvent) {
		this._filterTableItems();
	};

	/**
	 * @private
	 */
	P13nPanel.prototype._filterTableItems = function() {
		var aFilters = [];
		var sSearchText = this._getSearchText();
		if (sSearchText) {
			aFilters.push(new sap.ui.model.Filter([
				new sap.ui.model.Filter("text", sap.ui.model.FilterOperator.Contains, sSearchText), new sap.ui.model.Filter("tooltip", sap.ui.model.FilterOperator.Contains, sSearchText)
			], false));
		}
		this._getTable().getBinding("items").filter(aFilters);
	};

	P13nPanel.prototype._getTable = function() {
		return sap.ui.getCore().byId(this.getId() + "--IDTable") || null;
	};

	P13nPanel.prototype._getSearchField = function() {
		return sap.ui.getCore().byId(this.getId() + "--IDSearchField") || null;
	};

	P13nPanel.prototype._getSearchText = function() {
		var oSearchField = this._getSearchField();
		return oSearchField ? oSearchField.getValue() : "";
	};

	P13nPanel.prototype._isFilteredBySearchText = function() {
		return !!this._getSearchText().length;
	};

	return P13nPanel;

}, /* bExport= */true);
