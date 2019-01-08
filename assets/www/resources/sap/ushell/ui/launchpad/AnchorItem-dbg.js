/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.AnchorItem.
sap.ui.define(['sap/ui/core/Control','sap/ushell/library'],
	function(Control, library) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/AnchorItem.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Add your documentation for the newui/launchpad/AnchorItem
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.AnchorItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var AnchorItem = Control.extend("sap.ushell.ui.launchpad.AnchorItem", /** @lends sap.ushell.ui.launchpad.AnchorItem.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		title : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		selected : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		groupId : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		defaultGroup : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		index : {type : "int", group : "Misc", defaultValue : null},

		/**
		 */
		visible : {type : "boolean", group : "Misc", defaultValue : null},

		/**
		 */
		isGroupVisible : {type : "boolean", group : "Misc", defaultValue : true},

		/**
		 */
		isGroupRendered : {type : "boolean", group : "Misc", defaultValue : false},

        /**
         */
        isGroupDisabled: {type : "boolean", group : "Misc", defaultValue : false},

        /**
         */
        locked: {type : "boolean", group : "Misc", defaultValue : false}
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

/*global jQuery, sap*/
/**
 * @name sap.ushell.ui.launchpad.AnchorItem
 *
 * @private
 */
    AnchorItem.prototype.onAfterRendering = function () {
        this.fireAfterRendering();
    };

    AnchorItem.prototype.setTitle = function (sTitle) {
        this.setProperty("title", sTitle, true);        // set property, but suppress rerendering
        this.$().find(".sapUshellAnchorItemInner").text(sTitle);
    };

    AnchorItem.prototype.setGroupId = function (v) {
        this.setProperty("groupId", v, true);        // set property, but suppress rerendering
    };

    AnchorItem.prototype.setSelected = function (bSelected) {
        bSelected = !!bSelected;
        this.setProperty("selected", bSelected, true);
        if (bSelected) {
            var jqSelected = jQuery(".sapUshellAnchorItemSelected");
            jqSelected.each( function () {
                jQuery(this).toggleClass("sapUshellAnchorItemSelected", false);
                jQuery(this).attr("aria-selected", false);
            });
        }
        this.$().attr("aria-selected", bSelected);
        this.$().toggleClass("sapUshellAnchorItemSelected", bSelected);

    };

    AnchorItem.prototype.setIsGroupRendered = function (bRendered) {
        bRendered = !!bRendered;
        this.setProperty("isGroupRendered", bRendered, true);
        if (bRendered) {
            this.removeStyleClass("sapUshellAnchorItemNotRendered");
        } else {
            this.addStyleClass("sapUshellAnchorItemNotRendered");
        }
    };

    AnchorItem.prototype.setIsGroupVisible = function (bVisible) {
        bVisible = !!bVisible;
        this.setProperty("isGroupVisible", bVisible, true);
        this.toggleStyleClass("sapUshellShellHidden", !bVisible);
    };

    AnchorItem.prototype.setIsGroupDisabled = function (bVisible) {
        bVisible = !!bVisible;
        this.setProperty('isGroupDisabled', bVisible, true);
        this.$().find('.sapUshellAnchorItemInner').toggleClass('sapUshellAnchorItemDisabled', bVisible);
    };

    // browser events
    AnchorItem.prototype.onclick = function () {
        this.firePress();
    };

	return AnchorItem;
});
