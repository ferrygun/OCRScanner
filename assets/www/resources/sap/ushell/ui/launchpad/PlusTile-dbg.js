/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.PlusTile.
sap.ui.define(['sap/ushell/library','./Tile'],
	function(library, Tile) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/PlusTile.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * A specialized tile showing a plus icon.
 * @extends sap.ushell.ui.launchpad.Tile
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.PlusTile
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var PlusTile = Tile.extend("sap.ushell.ui.launchpad.PlusTile", /** @lends sap.ushell.ui.launchpad.PlusTile.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		groupId : {type : "string", group : "Misc", defaultValue : ''}
	},
	events : {

		/**
		 * Fired when user clicks on the tile
		 */
		press : {}
	}
}});

/*global jQuery, sap*/
/**
 * @name sap.ushell.ui.launchpad.PlusTile
 *
 * @private
 */
    PlusTile.prototype.init = function () {
        this.oIcon = new sap.ui.core.Icon({
            src : 'sap-icon://add',
            tooltip : sap.ushell.resources.i18n.getText("openAppFinder_tooltip")
        });
    };

    PlusTile.prototype.exit = function () {
        if (this.oIcon) {
            this.oIcon.destroy();
        }
    };

    PlusTile.prototype.onclick = function () {
        var groupModelObject =  this.getParent().getBindingContext().getObject();
        if (!groupModelObject.object) {
            //if group is not yet created on the sever side, we can't add tiles to it
            return;
        }

        this.firePress();
    };

    PlusTile.prototype.onsapspace = function () {
        this.firePress();
    };

    PlusTile.prototype.onsapenter = function () {
        this.firePress();
    };

    // Override setters to avoid rerenderings
    PlusTile.prototype.setGroupId = function (v) {
        this.setProperty("groupId", v, true);        // set property, but suppress rerendering
        return this;
    };


	return PlusTile;

});
