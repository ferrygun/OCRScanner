/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', './ToolbarGroup'
], function (jQuery, ToolbarGroup) {
	"use strict";

	var ZoomControlType = sap.gantt.config.ZoomControlType;

	/**
	 * Creates and initializes a new time zoom group
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * You can define time zooming related toolbar items in the Gantt chart toolbar. 
	 * @extends sap.gantt.config.ToolbarGroup
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.TimeZoomGroup
	 */
	var TimeZoomGroup = ToolbarGroup.extend("sap.gantt.config.TimeZoomGroup", /** @lends sap.gantt.config.LayoutGroup.prototype */ {
		metadata: {
			properties: {
				/**
				 * Enables the Slider control for the time zooming function.
				 * @deprecated As of version 1.44, replaced by zoomControlType
				 */
				showZoomSlider: {type: "boolean", defaultValue: true},
				/**
				 * Enables zoom in and zoom out buttons for the time zooming function.
				 * @deprecated As of version 1.44, replaced by zoomControlType
				 */
				showZoomButtons: {type: "boolean", defaultValue: true},
				/**
				 * Defines the control type to set the zoom rate.
				 */
				zoomControlType: {type: "sap.gantt.config.ZoomControlType", defaultValue: sap.gantt.config.ZoomControlType.SliderWithButtons},
				/**
				 * Sets the step when the zoom control type is sap.gantt.config.ZoomControlType.SliderWithButtons or sap.gantt.config.ZoomControlType.SliderOnly.
				 */
				stepCountOfSlider: {type: "int", defaultValue: 10},
				/**
				 * Array of plain objects which has "key" and "text" properties, or array of sap.ui.core.Item used to configure the items in the Select control 
				 * when the zoom control type is sap.gantt.config.ZoomControlType.Select.
				 * 
				 */
				infoOfSelectItems: {type: "object[]"}
			}
		}
	});

	TimeZoomGroup.prototype.getZoomControlType = function() {
		//for backward compatibility
		var defaultZoomControlType = ZoomControlType.SliderWithButtons;
		var currentZoomControlType = this.getProperty("zoomControlType");
		if (currentZoomControlType == defaultZoomControlType) {
			return this._getZoomControlTypeByDeprecatedProperties();
		}
		
		return currentZoomControlType;
	};
	
	TimeZoomGroup.prototype._getZoomControlTypeByDeprecatedProperties = function() {
		var bShowZoomSlider = this.getShowZoomSlider();
		var bShowZoomButtons = this.getShowZoomButtons();
		if (bShowZoomSlider && bShowZoomButtons) {
			return ZoomControlType.SliderWithButtons;
		}
		if (bShowZoomSlider && !bShowZoomButtons) {
			return ZoomControlType.SliderOnly;
		}
		if (!bShowZoomSlider && bShowZoomButtons) {
			return ZoomControlType.ButtonsOnly;
		}
		if (!bShowZoomSlider && !bShowZoomButtons) {
			return ZoomControlType.None;
		}
		return ZoomControlType.SliderWithButtons;
	};
	
	return TimeZoomGroup;
}, true);