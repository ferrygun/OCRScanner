/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

sap.ui.define([
	'jquery.sap.global', './P13nPanel'
], function(jQuery, P13nPanel) {
	"use strict";

	/**
	 * Constructor for a new P13nSelectionPanel.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The P13nSelectionPanel control is used to define selection settings like the visibility or the order of items.
	 * @extends sap.ui.mdc.experimental.P13nPanel
	 * @author SAP SE
	 * @version 1.52.4
	 * @constructor
	 * @private
	 * @since 1.48.0
	 * @alias sap.ui.mdc.experimental.P13nSelectionPanel
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var P13nSelectionPanel = P13nPanel.extend("sap.ui.mdc.experimental.P13nSelectionPanel", /** @lends sap.ui.mdc.experimental.P13nSelectionPanel.prototype */
	{
		metadata: {
			library: "sap.ui.mdc"
		}
	});

	return P13nSelectionPanel;

}, /* bExport= */true);
