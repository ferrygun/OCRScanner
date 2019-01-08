/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Path", "sap/gantt/misc/Utility", "sap/gantt/misc/Format"
], function(Path, Utility, Format){
	"use strict";
	
	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is used to define path data inside {@link sap.gantt.shape.ext.ulc.UlcClipPath}.
	 * 
	 * @extends sap.gantt.shape.Path
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ulc.UlcClipingPath
	 */
	var UlcClipingPath = Path.extend("sap.gantt.shape.ext.ulc.UlcClipingPath", /** @lends sap.gantt.shape.ext.ulc.UlcClipingPath.prototype */ {});

	/**
	 * Gets the value of property <code>d</code>.
	 * 
	 * <p>
	 * 'd' attribute of path element.
	 * See {@link http://www.w3.org/TR/SVG/paths.html#DAttribute SVG 1.1 specification for 'd' attribute of 'path'}.
	 * The 'd' attribute has powerful usages. See {@link http://www.w3.org/TR/SVG/paths.html#PathDataBNF BNF grammar} for detail.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>d</code> or null if the generated d is invalid according to the given data.
	 * @public
	 */
	UlcClipingPath.prototype.getD = function(oData, oRowInfo){
		var retVal = "";
		if (this.mShapeConfig.hasShapeProperty("d")){
			retVal = this._configFirst("d", oData);
		} else {
			if (oData.values) {
				for (var i = 0; i < oData.values.length; i++) {
					var oAxisTime = this.getAxisTime();
					var xPos1 = oAxisTime.timeToView(Format.abapTimestampToDate(oData.values[i].from));
					var xPos2 = oAxisTime.timeToView(Format.abapTimestampToDate(oData.values[i].to));
					var ratio = oData.values[i].value;
					if (isNaN(ratio)){
						ratio = 0;
					}
					var maxVisibleRatio = 25;
					if (this.mShapeConfig.hasShapeProperty("maxVisibleRatio")){
						maxVisibleRatio = this._configFirst("maxVisibleRatio", oData);
					}
					if (ratio > (100 + maxVisibleRatio)) {
						ratio = 100 + maxVisibleRatio;
					}
					var yPos = oRowInfo.y + oRowInfo.rowHeight  - oRowInfo.rowHeight  * (ratio / (100 + maxVisibleRatio));
					var lowY = oRowInfo.y + oRowInfo.rowHeight ;
					
					retVal = retVal +
							(oData.values[i].firstOne ? " M " + xPos1 + " " + lowY : "") +
							" L " + xPos1 + " " + yPos + " L " + xPos2 + " " + yPos +
							(oData.values[i].lastOne ? " L " + xPos2 + " " + lowY : "");
				}
			}
		}
		
		if(this.isValid(retVal)) {
			return retVal;
		} else {
			jQuery.sap.log.warning("UlcClipingPath shape generated invalid d: " + retVal + " from the given data: " + oData);
			return null;
		}
	};

	return UlcClipingPath;
}, true);
