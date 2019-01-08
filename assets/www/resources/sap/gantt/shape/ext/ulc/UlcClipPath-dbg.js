/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/ClipPath"
], function(ClipPath){
	"use strict";
	
	/**
	 * Creates and initializes a fragment of the Utilization Line Chart.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings of the new control
	 * 
	 * @class 
	 * This shape is a container of {@link sap.gantt.shape.ext.ulc.UlcClipingPath}.
	 * 
	 * @extends sap.gantt.shape.ClipPath
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.ulc.UlcClipPath
	 */
	var UlcClipPath = ClipPath.extend("sap.gantt.shape.ext.ulc.UlcClipPath", /** @lends sap.gantt.shape.ext.ulc.UlcClipPath.prototype */ {});

	/**
	 * Gets the value of property <code>htmlClass</code>.
	 * 
	 * Customized HTML classes. To provide multiple classes, separate them using space. Note that each UlcClipPath must have a unique 
	 * HTML class or a unique set of HTML classes. The 'clip-path' property of UlcOverClipRectangle and UlcUnderClipRectangle identifies HTML classes.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and row data.
	 * @return {string} Value of property <code>htmlClass</code>.
	 * @public
	 */
	UlcClipPath.prototype.getHtmlClass = function (oData, oRowInfo){
		if (this.mShapeConfig.hasShapeProperty("htmlClass")){
			return this._configFirst("htmlClass", oData);
		}
		
		var uid = oRowInfo.uid;
		var pattern = new RegExp("\\[|\\]|:|\\|", "g");
		var newUid = uid.replace(pattern, "_");
		
		return newUid + "_" +  oData.id + "_" + oData.dimension;
	};

	return UlcClipPath;
}, true);
