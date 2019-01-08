/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/mdc/experimental/P13nItem'
], function(P13nItem) {
	"use strict";

	/**
	 * Constructor for a new P13nSortItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for <code>items</code> aggregation in <code>P13nColumnPanel</code> control.
	 * @extends sap.ui.mdc.experimental.P13nItem
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.46.0
	 * @alias sap.ui.mdc.experimental.P13nSortItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nSortItem = P13nItem.extend("sap.ui.mdc.experimental.P13nSortItem", /** @lends sap.ui.mdc.experimental.P13nSortItem.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * Defines visibility of the item.
				 */
				selected: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Defines position of the item.
				 */
				position: {
					type: "int"
				},
				/**
				 * Defines sort order of the item.
				 */
				sortOrder: {
					type: "string"
				}
			}
		}
	});

	return P13nSortItem;

}, /* bExport= */true);
