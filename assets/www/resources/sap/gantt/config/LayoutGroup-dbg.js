/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', './ToolbarGroup'
], function (jQuery, ToolbarGroup) {
	"use strict";
	/**
	 * Creates and initializes a new layout group
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * You can specify the Gantt chart layout-related toolbar items in the Gantt chart toolbar 
	 * @extends sap.gantt.config.ToolbarGroup
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.LayoutGroup
	 */
	var LayoutGroup = ToolbarGroup.extend("sap.gantt.config.LayoutGroup", /** @lends sap.gantt.config.LayoutGroup.prototype */ {
		metadata: {
			properties: {
				/**
				 * Determines the button type. See {@link sap.m.ButtonType}
				 * true stands for {@link sap.m.ButtonType.Emphasized}
				 * false stands for {@link sap.m.ButtonType.Default}
				 * @deprecated Since version 1.50
				 */
				enableRichStyle: {type: "boolean", defaultValue: true},
			}
		}
	});
	
	return LayoutGroup;
}, true);