/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"./ToolbarGroup", "./SettingItem"
], function (ToolbarGroup, SettingItem) {
	"use strict";
	
	/**
	 * Creates and initializes a new setting group.
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The SettingGroup control allows you to specify the number of setting items to display in the Setting window.
	 * @extends sap.gantt.config.ToolbarGroup
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.SettingGroup
	 */
	var SettingGroup = ToolbarGroup.extend("sap.gantt.config.SettingGroup", /** @lends sap.gantt.config.SettingGroup.prototype */ {
		library : "sap.gantt",
		metadata: {
			properties: {
				/**
				 * Association to the setting item. See {@link sap.gantt.config.SettingItem}
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.SettingItem[]</code>. Otherwise some properties you set may not function properly.
				 */
				items: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_TOOLBAR_SETTING_ITEMS}
			}
		}
	});

	return SettingGroup;
}, /* bExport= */ true);
