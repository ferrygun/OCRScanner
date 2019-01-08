/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.TileState.
sap.ui.define([
		'sap/m/Text',
		'sap/ui/core/Control',
		'sap/ui/core/IconPool',
		'sap/ushell/library'
	], function(Text, Control, IconPool, library) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/TileState.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * The tile state control that displays loading indicator, while tile view is loading and failed status in case tile view is not available.
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.TileState
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var TileState = Control.extend("sap.ushell.ui.launchpad.TileState", /** @lends sap.ushell.ui.launchpad.TileState.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 * The load status.
		 */
		state : {type : "string", group : "Misc", defaultValue : 'Loaded'}
	}
}});

/*global jQuery, sap */
/**
 * @name sap.ushell.ui.launchpad.TileState
 *
 * @private
 */

TileState.prototype.init = function () {
    this._rb = sap.ushell.resources.i18n;

    this._sFailedToLoad = this._rb.getText("cannotLoadTile");

    this._oWarningIcon = new sap.ui.core.Icon(this.getId() + "-warn-icon", {
        src : "sap-icon://notification",
        size : "1.37rem"
    });

    this._oWarningIcon.addStyleClass("sapSuiteGTFtrFldIcnMrk");
};

TileState.prototype.exit = function () {
    this._oWarningIcon.destroy();
};

TileState.prototype.setState = function(oState, isSuppressed) {
    this.setProperty("state", oState, isSuppressed);
    return this;
};


	return TileState;

});
