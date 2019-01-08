/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/ui/core/Element'
], function(Element) {
	"use strict";

	/**
	 * Constructor for a new P13nItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Base type for <code>items</code> aggregation in <code>P13nXXXPanel</code> controls.
	 * @extends sap.ui.core.Element
	 * @version 1.52.4
	 * @constructor
	 * @abstract
	 * @private
	 * @since 1.48.0
	 * @alias sap.ui.mdc.experimental.P13nItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nItem = Element.extend("sap.ui.mdc.experimental.P13nItem", /** @lends sap.ui.mdc.experimental.P13nItem.prototype */
	{
		metadata: {
			"abstract": true,
			library: "sap.ui.mdc",
			properties: {
				/**
				 * The unique key of the item.
				 */
				columnKey: {
					type: "string",
					defaultValue: undefined
				},
				/**
				 * The text to be displayed for the item.
				 */
				text: {
					type: "string",
					defaultValue: undefined
				},
				/**
				 * The tooltip to be displayed for the item.
				 */
				tooltip: {
					type: "string",
					defaultValue: undefined
				}
			}
		}
	});

	return P13nItem;

}, /* bExport= */true);
