/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.Panel.
sap.ui.define(['sap/m/Panel','sap/ushell/library','sap/ushell/override'],
	function(Panel1, library, override) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/Panel.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * The Panel control is a container for controls with header text, header controls, or a header bar.
 * @extends sap.m.Panel
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.Panel
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var Panel = Panel1.extend("sap.ushell.ui.launchpad.Panel", /** @lends sap.ushell.ui.launchpad.Panel.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		translucent : {type : "boolean", group : "Misc", defaultValue : false}
	},
	aggregations : {

		/**
		 */
		headerContent : {type : "sap.ui.core.Control", multiple : true, singularName : "headerContent"}, 

		/**
		 */
		headerBar : {type : "sap.m.Bar", multiple : false}
	}
}});

/**
 * @name sap.ushell.ui.launchpad.Panel
 *
 * @private
 */
Panel.prototype.updateAggregation = override.updateAggregation;


	return Panel;

});
