/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.SceneTree.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control"
], function(jQuery, library, Control) {
	"use strict";

	/**
	 * Constructor for a new Widget.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Provides UI that is typically docked as an overlay in the rendering target
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.tools.Widget
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Widget = Control.extend("sap.ui.vk.tools.Widget", /** @lends sap.ui.vk.tools.Widget.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools"
		}
	});

	return Widget;

}, /* bExport= */ true);
