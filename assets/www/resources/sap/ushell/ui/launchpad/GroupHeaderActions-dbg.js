/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.GroupHeaderActions.
sap.ui.define(['sap/ui/core/Control','sap/ushell/library'],
	function(Control, library) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/GroupHeaderActions.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Add your documentation for the newui/launchpad/GroupHeaderActions
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.GroupHeaderActions
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var GroupHeaderActions = Control.extend("sap.ushell.ui.launchpad.GroupHeaderActions", /** @lends sap.ushell.ui.launchpad.GroupHeaderActions.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		isOverflow : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		tileActionModeActive : {type : "boolean", group : "Misc", defaultValue : false}
	},
	aggregations : {

		/**
		 */
		content : {type : "sap.ui.core.Control", multiple : true, singularName : "content"}, 

		/**
		 */
		overflowCtrl : {type : "sap.ui.core.Control", multiple : true, singularName : "overflowCtrl"}
	},
	events : {

		/**
		 */
		afterRendering : {}
	}
}});

/*global jQuery, sap*/

/**
 * @name sap.ushell.ui.launchpad.GroupHeaderActions
 *
 * @private
 */

    GroupHeaderActions.prototype.onAfterRendering = function () {
        this.fireAfterRendering();
    };

    GroupHeaderActions.prototype._getActionOverflowControll = function () {
        var that = this;

        return [new sap.m.Button({
            icon: 'sap-icon://overflow',
            type: 'Transparent',
            press: function (oEvent) {

                var oActionSheet = new sap.m.ActionSheet({
                    placement: sap.m.PlacementType.Auto
                });

                that.getContent().forEach(function (oButton) {
                    var cButton = oButton.clone();
                    cButton.setModel(oButton.getModel());
                    cButton.setBindingContext(oButton.getBindingContext());
                    oActionSheet.addButton(cButton);
                });
                oActionSheet.openBy(oEvent.getSource());
            }
        }).addStyleClass('sapUshellHeaderActionButton')];
    };



	return GroupHeaderActions;

});
