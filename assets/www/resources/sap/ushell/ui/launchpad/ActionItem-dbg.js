/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.ActionItem.
sap.ui.define(['sap/m/Button','sap/ushell/library'],
	function(Button, library) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/ActionItem.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * @extends sap.m.Button
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.ActionItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var ActionItem = Button.extend("sap.ushell.ui.launchpad.ActionItem", /** @lends sap.ushell.ui.launchpad.ActionItem.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 * type of button to create
		 */
		actionType : {type : "string", group : "Appearance", defaultValue : 'standard'}
	},
	events : {

		/**
		 */
		press : {}, 

		/**
		 */
		afterRendering : {}
	}
}});

    /*global sap */
    /*jslint nomen: true*/
    /**
     * @name sap.ushell.ui.launchpad.ActionItem
     *
     * @private
     */
    ActionItem.prototype.init = function () {
        if (Button.prototype.init) {
            Button.prototype.init.apply(this, arguments);
        }
        this.sOrigType = undefined;
    };

    ActionItem.prototype.setActionType = function (sType) {
        if (!this.sOrigType) {
            this.sOrigType = this.getType();
        }
        if (sType === 'action') {
            this.setType(sap.m.ButtonType.Unstyled);
            this.addStyleClass("sapUshellActionItem");
        } else {
            this.sOrigType ? this.setType(this.sOrigType) : this.setType(sap.m.ButtonType.Standard);
            this.removeStyleClass("sapUshellActionItem");
        }
        this.setProperty('actionType', sType, true);
    };


	return ActionItem;

});
