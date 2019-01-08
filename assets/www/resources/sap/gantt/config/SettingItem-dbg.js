/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Element", "./ToolbarGroup"
], function (Element, ToolbarGroup) {
	"use strict";

	/**
	 * Creates and initializes a new setting item.
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The SettingItem control allows you to create a setting item in the toolbar, which is presented as a checkbox with a label.
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.SettingItem
	 */
	var SettingItem = Element.extend("sap.gantt.config.SettingItem", /** @lends sap.gantt.config.SettingItem.prototype */ {
		library : "sap.gantt",
		metadata: {
			properties: {
				/**
				 * Indicates whether the checkbox is selected or not
				 */
				checked: {type: "boolean", defaultValue: false},
				/**
				 * Identifier of an event when the checkbox is toggled
				 */
				key: {type: "string", defaultValue: null},
				/**
				 * Aria label of the checkbox
				 */
				displayText: {type: "string", defaultValue: null}
			}
		}
	});

	return SettingItem;

}, /* bExport= */ true);
