/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/mdc/experimental/P13nItem'
], function(P13nItem) {
	"use strict";

	/**
	 * Constructor for a new P13nFilterItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for <code>items</code> aggregation in <code>P13nColumnPanel</code> control.
	 * @extends sap.ui.mdc.experimental.P13nItem
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.46.0
	 * @alias sap.ui.mdc.experimental.P13nFilterItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nFilterItem = P13nItem.extend("sap.ui.mdc.experimental.P13nFilterItem", /** @lends sap.ui.mdc.experimental.P13nFilterItem.prototype */
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
				 * Defines the position of the columns.
				 */
				position: {
					type: "int"
				},
				/**
				 * Defines if the item is mandatory
				 */
				required: {
					type: "boolean"
				},
				/**
				 * Defines the control.
				 */
				control: {
					type: "sap.ui.core.Control"
				}
			}
		}
	});

	return P13nFilterItem;

}, /* bExport= */true);
