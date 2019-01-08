/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.CheckEye.
sap.ui.define([
	"jquery.sap.global", "sap/ui/commons/CheckBox", "./library"
], function(jQuery, CheckBox, library) {
	"use strict";



	/**
	 * Constructor for a new CheckEye.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Provides a custom 'eye' checkbox for a Scene Tree, used to toggle the visibility of nodes in a scene.
	 * @extends sap.m.CheckBox
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @since 1.16.0
	 * @alias sap.ui.vk.CheckEye
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var CheckEye = CheckBox.extend("sap.ui.vk.CheckEye", /** @lends sap.ui.vk.CheckEye.prototype */ { metadata: {

		library: "sap.ui.vk",
		properties: {
		}
	},

	onAfterRendering: function() {
		var $this = this.$();
		$this.removeClass("sapUiCb");
		$this.removeClass("sapUiCbChk");
		$this.removeClass("sapUiCbInteractive");
		$this.removeClass("sapUiCbStd");
		$this.addClass("sapUiVkCheckEye");
	},

	renderer: {

	}

	});

	return CheckEye;

}, /* bExport= */ true);
