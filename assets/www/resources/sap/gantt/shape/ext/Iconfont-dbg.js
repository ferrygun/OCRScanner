/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Text", "sap/gantt/misc/Utility", "sap/gantt/misc/Format", "sap/ui/core/Core", "sap/ui/core/IconPool"
], function (Text, Utility, Format, Core, IconPool) {
	"use strict";
	
	/**
	 * Creates and initializes a new Iconfont class.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Iconfont shape class using SVG tag 'text'. This shape is usually used to display icons in Gantt chart.
	 * 
	 * @extend sap.gantt.shape.Text
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.Iconfont
	 */
	var Iconfont = Text.extend("sap.gantt.shape.ext.Iconfont", /** @lends sap.gantt.shape.ext.Iconfont.prototype */ {
		metadata: {
			properties: {
				name: {type: "string"},
				collectionName: {type: "string"}
			}
		}
	});

	/**
	 * Gets the value of property <code>text</code>.
	 * 
	 * <p>
	 * The text string of iconfont is read via {@link sap.ui.IconPool.getIconInfo} passing Name and CollectionName as parameters.
	 * To use the SAP openui5 predefined icons, don't set the property CollectionName.
	 * To use the icons in other collections, you need register first. 
	 * For example, after calling function sap.ushell.iconfonts.registerFiori2IconFont, then you can use the icon collection with names "BusinessSuiteInAppSymbols", "Fiori2"...
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>text</code>.
	 * @public
	 */
	Iconfont.prototype.getText = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("text")) {
			return this._configFirst("text", oData);
		}
		var sName = this.getName(oData, oRowInfo),
			sCollectionName = this.getCollectionName(oData, oRowInfo);
		if (sCollectionName === "") {
			sCollectionName = undefined;
		}
		var oIconInfo = IconPool.getIconInfo(sName, sCollectionName);
		if (oIconInfo) {
			return oIconInfo.content;
		}
	};
	/**
	 * Gets the value of property <code>name</code>.
	 * 
	 * <p>
	 * The name of iconfont as mentioned in property <code>text</code>
	 * @param {object} oData Shape data.
	 * @return {string} Value of property <code>name</code>.
	 * @public
	 */
	Iconfont.prototype.getName = function (oData) {
		return this._configFirst("name", oData);
	};
	/**
	 * Gets the value of property <code>collectionName</code>.
	 * 
	 * <p>
	 * The collectionName of iconfont as mentioned in property <code>text</code>
	 * @param {object} oData Shape data.
	 * @return {string} Value of property <code>collectionName</code>.
	 * @public
	 */
	Iconfont.prototype.getCollectionName = function (oData) {
		return this._configFirst("collectionName", oData);
	};
	/**
	 * Gets the value of property <code>fontFamily</code>.
	 * 
	 * <p>
	 * Font family of Iconfont.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of property <code>fontFamily</code>.
	 * @public
	 */
	Iconfont.prototype.getFontFamily = function (oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("fontFamily")) {
			return this._configFirst("fontFamily", oData);
		}
		var sName = this.getName(oData, oRowInfo);
		var sCollectionName = this.getCollectionName(oData, oRowInfo);
		if (sCollectionName === "") {
			sCollectionName = undefined;
		}
		var oIconInfo = IconPool.getIconInfo(sName, sCollectionName);
		if (oIconInfo) {
			return oIconInfo.fontFamily;
		}
	};
	return Iconfont;
}, true);
