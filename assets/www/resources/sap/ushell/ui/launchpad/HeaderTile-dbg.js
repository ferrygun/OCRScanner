/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.HeaderTile.
sap.ui.define(['sap/ushell/library','./Tile'],
	function(library, Tile) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/HeaderTile.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * A HeaderTile acts as a separator inside a TileContainer.
 * @extends sap.ushell.ui.launchpad.Tile
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.HeaderTile
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var HeaderTile = Tile.extend("sap.ushell.ui.launchpad.HeaderTile", /** @lends sap.ushell.ui.launchpad.HeaderTile.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		headerLevel : {type : "sap.m.HeaderLevel", group : "Appearance", defaultValue : sap.m.HeaderLevel.H3},

		/**
		 */
		headerText : {type : "string", group : "Appearance", defaultValue : null}
	}
}});

/**
 * @name sap.ushell.ui.launchpad.HeaderTile
 *
 * @private
 */
//sap.ushell.HeaderTile.prototype.init = function(){
//   // do something for initialization...
//};


	return HeaderTile;

});
