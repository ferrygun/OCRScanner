/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.filterbar.FilterGroupItem.
sap.ui.define(['./FilterItem', 'sap/ui/comp/library'], 
	function(FilterItem, library) {
	"use strict";

	/**
	 * Constructor for a new FilterBar/FilterGroupItem.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Represents a filter belonging to a group other than basic.
	 * @extends sap.ui.comp.filterbar.FilterItem
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.filterbar.FilterGroupItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FilterGroupItem = FilterItem.extend("sap.ui.comp.filterbar.FilterGroupItem", /** @lends sap.ui.comp.filterbar.FilterGroupItem.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			properties: {

				/**
				 * Title of the group.
				 */
				groupTitle: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Name of the group.
				 */
				groupName: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to true, this filter is visible on the filter bar by default. Mapped against the <code>visibleInFilterBar</code> property.
				 * 
				 * @since 1.24.0
				 * @deprecated Since version 1.26.1. Replaced by property <code>visibleInFilterBar</code>
				 */
				visibleInAdvancedArea: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}
			}
		}
	});

	FilterGroupItem.prototype.init = function() {
		this.setVisibleInAdvancedArea(false);
		this._setParameter(false);
	};

	/**
	 * Setter for parameter indicator.
	 * 
	 * @private
	 * @param {bool} bValue Indicator if this is a parameter.
	 */
	FilterGroupItem.prototype._setParameter = function(bValue) {
		this._bIsParameter = bValue;
	};

	/**
	 * Setter for group title.
	 * 
	 * @public
	 * @param {string} sValue Group title
	 */
	FilterGroupItem.prototype.setGroupTitle = function(sValue) {
		this.setProperty("groupTitle", sValue);

		this.fireChange({
			propertyName: "groupTitle"
		});
	};

	/**
	 * Setter for visibility of filters in the filter bar.
	 * 
	 * @private
	 * @param {boolean} bValue State of visibility
	 */
	FilterGroupItem.prototype.setVisibleInAdvancedArea = function(bValue) {
		this.setVisibleInFilterBar(bValue);
	};

	/**
	 * Getter for visibility of filters in the filter bar.
	 * 
	 * @private
	 * @returns {boolean} bValue State of visibility
	 */
	FilterGroupItem.prototype.getVisibleInAdvancedArea = function() {
		return this.getVisibleInFilterBar();
	};

	/**
	 * Destroys this element.
	 * 
	 * @public
	 */
	FilterGroupItem.prototype.destroy = function() {
		FilterItem.prototype.destroy.apply(this, arguments);
	};

	return FilterGroupItem;

}, /* bExport= */true);
