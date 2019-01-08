/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/mdc/experimental/P13nItem'
], function(P13nItem) {
	"use strict";

	/**
	 * Constructor for a new P13nColumnItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for <code>items</code> aggregation in <code>P13nColumnPanel</code> control.
	 * @extends sap.ui.mdc.experimental.P13nItem
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.46.0
	 * @alias sap.ui.mdc.experimental.P13nColumnItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nColumnItem = P13nItem.extend("sap.ui.mdc.experimental.P13nColumnItem", /** @lends sap.ui.mdc.experimental.P13nColumnItem.prototype */
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
				}
			}
		}
	});

	return P13nColumnItem;

}, /* bExport= */true);
