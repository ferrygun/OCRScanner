/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Rectangle"
], function (Rectangle) {
	"use strict";
	
	/**
	 * Creates a Calendar shape which consumes pattern from Calendar in 'def' package.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Calendar shape.
	 * 
	 * <p>
	 * The Calendar shape must be used in combination with Calendar def class {@link sap.gantt.def.cal.Calendar} which draws SVG 'defs' tag.
	 * </p>
	 * 
	 * @extends sap.gantt.shape.Rectangle
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.cal.Calendar
	 */
	var Calendar = Rectangle.extend("sap.gantt.shape.cal.Calendar", /** @lends sap.gantt.shape.cal.Calendar.prototype */ {
		metadata: {
			properties: {
				isBulk: {type: "boolean", defaultValue: true},
				enableSelection: {type: "boolean", defaultValue: false},
				
				calendarName: {type: "string", defaultValue: "nwt"}
			}
		}
	});
	
	Calendar.prototype.init = function() {
		Rectangle.prototype.init.apply(this, arguments);
		var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.gantt");
		this.setProperty("ariaLabel", oRb.getText("ARIA_CALENDAR"));
	};
	
	
	/**
	 * Gets the value of property <code>calendarName</code>.
	 * 
	 * <p>
	 * Calendar key.
	 * 
	 * This property is used to generate referencing string to compose the <code>fill</code> property. This property is must provided.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>calendarName</code>.
	 * @public
	 */
	Calendar.prototype.getCalendarName = function (oData) {
		return this._configFirst("calendarName", oData);
	};
	
	/**
	 * Gets current value of property <code>isBulk</code>.
	 * 
	 * General recommendation is don't configure or code against this property.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>isBulk</code>.
	 * @public
	 */
	Calendar.prototype.getIsBulk = function (oData) {
		if (this.mShapeConfig.isBulk) {
			return this._configFirst("isBulk", oData);
		}
		
		return true;
	};
	
	/**
	 * Gets current value of property <code>enableSelection</code>.
	 * 
	 * General recommendation is don't configure or code against this property. Calendar is treated as a bulk shape filled with pattern occupying visible chart area.
	 * Application should implement their own shape if a select able calendar is expected.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {boolean} Value of property <code>enableSelection</code>.
	 * @public
	 */
	Calendar.prototype.getEnableSelection = function (oData) {
		if (this.mShapeConfig.enableSelection) {
			return this._configFirst("enableSelection", oData);
		}
		
		return false;
	};
	
	/**
	 * Gets current value of property <code>x</code>.
	 * 
	 * General recommendation is don't configure or code against this property. Calendar is treated as a bulk shape filled with pattern occupying visible chart area.
	 * Application should implement their own shape if a select able calendar is expected.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>x</code>.
	 * @public
	 */
	Calendar.prototype.getX = function (oData) {
		if (this.mShapeConfig.x) {
			return this._configFirst("x", oData);
		}

		return this.mChartInstance._oStatusSet.aViewBoundary[0];
	};
	
	/**
	 * Gets current value of property <code>y</code>.
	 * 
	 * General recommendation is don't configure or code against this property. Calendar is treated as a bulk shape filled with pattern occupying visible chart area.
	 * Application should implement their own shape if a select able calendar is expected.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>y</code>.
	 * @public
	 */
	Calendar.prototype.getY = function (oData, oRowInfo) {
		if (this.mShapeConfig.y) {
			return this._configFirst("y", oData);
		}
		
		return oRowInfo.y;
	};
	
	/**
	 * Gets current value of property <code>width</code>.
	 * 
	 * General recommendation is don't configure or code against this property. Calendar is treated as a bulk shape filled with pattern occupying visible chart area.
	 * Application should implement their own shape if a select able calendar is expected.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>width</code>.
	 * @public
	 */
	Calendar.prototype.getWidth = function (oData) {
		if (this.mShapeConfig.width) { 
			return this._configFirst("width", oData);
		}
		
		var oStatusSet = this.mChartInstance._oStatusSet;
		if (oStatusSet) {
			return oStatusSet.aViewBoundary[1] - oStatusSet.aViewBoundary[0];
		} else {
			return 0;
		}

	};
	
	/**
	 * Gets current value of property <code>height</code>.
	 * 
	 * General recommendation is don't configure or code against this property. Calendar is treated as a bulk shape filled with pattern occupying visible chart area.
	 * Application should implement their own shape if a select able calendar is expected.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {number} Value of property <code>height</code>.
	 * @public
	 */
	Calendar.prototype.getHeight = function (oData, oRowInfo) {
		if (this.mShapeConfig.height) {
			return this._configFirst("height", oData);
		}
		
		return oRowInfo.rowHeight;
	};
	/**
	 * Gets current value of property <code>fill</code>.
	 * 
	 * General recommendation is don't configure or code against this property. Calendar is treated as a bulk shape filled with pattern occupying visible chart area.
	 * Application should implement their own shape if a select able calendar is expected.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of property <code>fill</code>.
	 * @public
	 */
	
	Calendar.prototype.getFill = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("fill")) {
			return this._configFirst("fill", oData);
		}
		
		var sCalendarName = this.getCalendarName(oData, oRowInfo);
		var oPaintServerDef = this.mChartInstance.getCalendarDef();
		if (oPaintServerDef) {
			return oPaintServerDef.getRefString(sCalendarName);	
		}
	};
	
	return Calendar;
}, true);
