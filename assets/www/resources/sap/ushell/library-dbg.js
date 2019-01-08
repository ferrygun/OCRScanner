/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

/**
 * Initialization Code and shared classes of library sap.ushell.
 */
sap.ui.define([
		'sap/m/library',
		'sap/ui/core/Core',
		'sap/ui/core/library',
		'sap/ui/layout/library'
	], function(library3, Core, library1, library2) {
	"use strict";

/**
 * SAP library: sap.ushell
 *
 * @namespace
 * @name sap.ushell
 * @public
 */


// library dependencies
// delegate further initialization of this library to the Core
sap.ui.getCore().initLibrary({
	name : "sap.ushell",
	dependencies : ["sap.ui.core","sap.ui.layout","sap.m"],
	types: [
		"sap.ushell.ui.launchpad.ViewPortState",
		"sap.ushell.ui.tile.State",
		"sap.ushell.ui.tile.StateArrow"
	],
	interfaces: [],
	controls: [
		"sap.ushell.components.factsheet.controls.PictureTile",
		"sap.ushell.components.factsheet.controls.PictureViewer",
		"sap.ushell.components.factsheet.controls.PictureViewerItem",
		"sap.ushell.ui.appfinder.AppBox",
		"sap.ushell.ui.footerbar.AboutButton",
		"sap.ushell.ui.footerbar.AddBookmarkButton",
		"sap.ushell.ui.footerbar.ContactSupportButton",
		"sap.ushell.ui.footerbar.EndUserFeedback",
		"sap.ushell.ui.footerbar.HideGroupsButton",
		"sap.ushell.ui.footerbar.JamDiscussButton",
		"sap.ushell.ui.footerbar.JamShareButton",
		"sap.ushell.ui.footerbar.LogoutButton",
		"sap.ushell.ui.footerbar.SettingsButton",
		"sap.ushell.ui.footerbar.UserPreferencesButton",
		"sap.ushell.ui.launchpad.ActionItem",
		"sap.ushell.ui.launchpad.AnchorItem",
		"sap.ushell.ui.launchpad.AnchorNavigationBar",
		"sap.ushell.ui.launchpad.DashboardGroupsContainer",
		"sap.ushell.ui.launchpad.EmbeddedSupportErrorMessage",
		"sap.ushell.ui.launchpad.Fiori2LoadingDialog",
		"sap.ushell.ui.launchpad.GroupHeaderActions",
		"sap.ushell.ui.launchpad.GroupListItem",
		"sap.ushell.ui.launchpad.HeaderTile",
		"sap.ushell.ui.launchpad.LinkTileWrapper",
		"sap.ushell.ui.launchpad.LoadingDialog",
		"sap.ushell.ui.launchpad.Panel",
		"sap.ushell.ui.launchpad.PlusTile",
		"sap.ushell.ui.launchpad.Tile",
		"sap.ushell.ui.launchpad.TileContainer",
		"sap.ushell.ui.launchpad.TileState",
		"sap.ushell.ui.launchpad.ViewPortContainer",
		"sap.ushell.ui.tile.DynamicTile",
		"sap.ushell.ui.tile.ImageTile",
		"sap.ushell.ui.tile.StaticTile",
		"sap.ushell.ui.tile.TileBase"
	],
	elements: [],
	version: "1.52.4",
	extensions: {
		"sap.ui.support" : {
			diagnosticPlugins: [
				"sap/ushell/support/plugins/flpConfig/FlpConfigurationPlugin"
			]
		}
	}
});

/**
 * Denotes states for control parts and translates into standard SAP color codes
 *
 * @enum {string}
 * @public
 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ushell.ui.launchpad.ViewPortState = {

	/**
	 * indicates state when only left content is in the viewport
	 * @public
	 */
	Left : "Left",

	/**
	 * Indicates a state that is neutral, e.g. for standard display (Grey color)
	 * @public
	 */
	Center : "Center",

	/**
	 * Alias for "Error"
	 * @public
	 */
	Right : "Right",

	/**
	 * Indicates a state that is negative, e.g. marking an element that has to get attention urgently or indicates negative values (Red color)
	 * @public
	 */
	LeftCenter : "LeftCenter",

	/**
	 * Alias for "Success"
	 * @public
	 */
	CenterLeft : "CenterLeft",

	/**
	 * Indicates a state that is positive, e.g. marking a task successfully executed or a state where all is good (Green color)
	 * @public
	 */
	RightCenter : "RightCenter",

	/**
	 * Alias for "Warning"
	 * @public
	 */
	CenterRight : "CenterRight"

};
/**
 * Denotes states for control parts and translates into standard SAP color codes
 *
 * @enum {string}
 * @public
 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ushell.ui.tile.State = {

	/**
	 * Alias for "None"
	 * @public
	 */
	Neutral : "Neutral",

	/**
	 * Indicates a state that is neutral, e.g. for standard display (Grey color)
	 * @public
	 */
	None : "None",

	/**
	 * Alias for "Error"
	 * @public
	 */
	Negative : "Negative",

	/**
	 * Indicates a state that is negative, e.g. marking an element that has to get attention urgently or indicates negative values (Red color)
	 * @public
	 */
	Error : "Error",

	/**
	 * Alias for "Success"
	 * @public
	 */
	Positive : "Positive",

	/**
	 * Indicates a state that is positive, e.g. marking a task successfully executed or a state where all is good (Green color)
	 * @public
	 */
	Success : "Success",

	/**
	 * Alias for "Warning"
	 * @public
	 */
	Critical : "Critical",

	/**
	 * Indicates a state that is critical, e.g. marking an element that needs attention (Orange color)
	 * @public
	 */
	Warning : "Warning"

};
/**
 * The state of an arrow as trend direction indicator, pointing either up or down
 * @private
 *
 * @enum {string}
 * @public
 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ushell.ui.tile.StateArrow = {

	/**
	 * The trend direction indicator is invisible
	 * @public
	 */
	None : "None",

	/**
	 * The trend direction indicator points up
	 * @public
	 */
	Up : "Up",

	/**
	 * The trend direction indicator points down
	 * @public
	 */
	Down : "Down"

};
// shared.js is automatically appended to library.js
//
// hiding (generated) types that are marked as @public by default
/**
 * @name sap.ushell.ui.tile.StateArrow
 * @private
 */
/**
 * @name sap.ushell.ui.tile.State
 * @private
 */

return sap.ushell;

}, /* bExport= */ true);
