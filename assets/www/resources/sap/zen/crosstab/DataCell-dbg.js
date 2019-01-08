/*!
 * (c) Copyright 2010-2018 SAP SE or an SAP affiliate company.
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.zen.crosstab.DataCell.
jQuery.sap.declare("sap.zen.crosstab.DataCell");
jQuery.sap.require("sap.zen.crosstab.library");
jQuery.sap.require("sap.ui.core.Control");


/**
 * Constructor for a new DataCell.
 * 
 * Accepts an object literal <code>mSettings</code> that defines initial 
 * property values, aggregated and associated objects as well as event handlers. 
 * 
 * If the name of a setting is ambiguous (e.g. a property has the same name as an event), 
 * then the framework assumes property, aggregation, association, event in that order. 
 * To override this automatic resolution, one of the prefixes "aggregation:", "association:" 
 * or "event:" can be added to the name of the setting (such a prefixed name must be
 * enclosed in single or double quotes).
 *
 * The supported settings are:
 * <ul>
 * <li>Properties
 * <ul>
 * <li>{@link #getText text} : string</li>
 * <li>{@link #getArea area} : object</li>
 * <li>{@link #getRow row} : int</li>
 * <li>{@link #getCol col} : int</li>
 * <li>{@link #getTableRow tableRow} : int</li>
 * <li>{@link #getTableCol tableCol} : int</li></ul>
 * </li>
 * <li>Aggregations
 * <ul></ul>
 * </li>
 * <li>Associations
 * <ul></ul>
 * </li>
 * <li>Events
 * <ul></ul>
 * </li>
 * </ul> 

 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * Add your documentation for the new DataCell
 * @extends sap.ui.core.Control
 * @version 1.52.4
 *
 * @constructor
 * @public
 * @name sap.zen.crosstab.DataCell
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.ui.core.Control.extend("sap.zen.crosstab.DataCell", { metadata : {

	publicMethods : [
		// methods
		"addStyle"
	],
	library : "sap.zen.crosstab",
	properties : {
		"text" : {type : "string", group : "Misc", defaultValue : null},
		"area" : {type : "object", group : "Misc", defaultValue : null},
		"row" : {type : "int", group : "Misc", defaultValue : null},
		"col" : {type : "int", group : "Misc", defaultValue : null},
		"tableRow" : {type : "int", group : "Misc", defaultValue : null},
		"tableCol" : {type : "int", group : "Misc", defaultValue : null}
	}
}});


/**
 * Creates a new subclass of class sap.zen.crosstab.DataCell with name <code>sClassName</code> 
 * and enriches it with the information contained in <code>oClassInfo</code>.
 * 
 * <code>oClassInfo</code> might contain the same kind of informations as described in {@link sap.ui.core.Element.extend Element.extend}.
 *   
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class  
 * @param {function} [FNMetaImpl] constructor function for the metadata object. If not given, it defaults to sap.ui.core.ElementMetadata.
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.zen.crosstab.DataCell.extend
 * @function
 */


/**
 * Getter for property <code>text</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>text</code>
 * @public
 * @name sap.zen.crosstab.DataCell#getText
 * @function
 */

/**
 * Setter for property <code>text</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sText  new value for property <code>text</code>
 * @return {sap.zen.crosstab.DataCell} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.crosstab.DataCell#setText
 * @function
 */


/**
 * Getter for property <code>area</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {object} the value of property <code>area</code>
 * @public
 * @name sap.zen.crosstab.DataCell#getArea
 * @function
 */

/**
 * Setter for property <code>area</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {object} oArea  new value for property <code>area</code>
 * @return {sap.zen.crosstab.DataCell} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.crosstab.DataCell#setArea
 * @function
 */


/**
 * Getter for property <code>row</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {int} the value of property <code>row</code>
 * @public
 * @name sap.zen.crosstab.DataCell#getRow
 * @function
 */

/**
 * Setter for property <code>row</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {int} iRow  new value for property <code>row</code>
 * @return {sap.zen.crosstab.DataCell} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.crosstab.DataCell#setRow
 * @function
 */


/**
 * Getter for property <code>col</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {int} the value of property <code>col</code>
 * @public
 * @name sap.zen.crosstab.DataCell#getCol
 * @function
 */

/**
 * Setter for property <code>col</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {int} iCol  new value for property <code>col</code>
 * @return {sap.zen.crosstab.DataCell} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.crosstab.DataCell#setCol
 * @function
 */


/**
 * Getter for property <code>tableRow</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {int} the value of property <code>tableRow</code>
 * @public
 * @name sap.zen.crosstab.DataCell#getTableRow
 * @function
 */

/**
 * Setter for property <code>tableRow</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {int} iTableRow  new value for property <code>tableRow</code>
 * @return {sap.zen.crosstab.DataCell} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.crosstab.DataCell#setTableRow
 * @function
 */


/**
 * Getter for property <code>tableCol</code>.
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {int} the value of property <code>tableCol</code>
 * @public
 * @name sap.zen.crosstab.DataCell#getTableCol
 * @function
 */

/**
 * Setter for property <code>tableCol</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {int} iTableCol  new value for property <code>tableCol</code>
 * @return {sap.zen.crosstab.DataCell} <code>this</code> to allow method chaining
 * @public
 * @name sap.zen.crosstab.DataCell#setTableCol
 * @function
 */


/**
 *
 * @name sap.zen.crosstab.DataCell#addStyle
 * @function
 * @param {string} sSStyle
 * @type void
 * @public
 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
 */

// Start of sap\zen\crosstab\DataCell.js
///**
// * This file defines behavior for the control, 
// */
jQuery.sap.require("sap.zen.crosstab.CellStyleHandler");
jQuery.sap.require("sap.zen.crosstab.rendering.RenderingConstants");
jQuery.sap.require("sap.zen.crosstab.utils.Utils");

sap.zen.crosstab.DataCell.prototype.init = function () {
	"use strict";
	this.aStyles = [];
	this.bLoading = false;
	this.bIsEntryEnabled = false;
	this.sUnit = "";
	this.sPassiveCellType = sap.zen.crosstab.rendering.RenderingConstants.PASSIVE_CELL_TYPE_NORMAL;
	this.iNumberOfLineBreaks = 0;
};

sap.zen.crosstab.DataCell.prototype.getCellType = function() {
	return sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_CELL;
};

sap.zen.crosstab.DataCell.prototype.isHeaderCell = function() {
	return false;
};

sap.zen.crosstab.DataCell.prototype.getCssClassNames = function (bIsIE8, bIsRtl, bIsMsIE) {
	return sap.zen.crosstab.CellStyleHandler.getCssClasses(this.aStyles, bIsIE8, bIsRtl, bIsMsIE);
};

sap.zen.crosstab.DataCell.prototype.getStyleIdList = function () {
	return this.aStyles;
};

sap.zen.crosstab.DataCell.prototype.setStyleIdList = function (aNewStyles) {
	this.aStyles = aNewStyles;
};

sap.zen.crosstab.DataCell.prototype.addStyle = function (sStyle) {
	var iStyleId = sap.zen.crosstab.CellStyleHandler.getStyleId(sStyle,
			sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_CELL);
	if (this.aStyles.indexOf(iStyleId) === -1) {
		this.aStyles.push(iStyleId);
	}
};

sap.zen.crosstab.DataCell.prototype.removeStyle = function (sStyle) {
	var iStyleId = sap.zen.crosstab.CellStyleHandler.getStyleId(sStyle,
			sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_CELL);
	var iIndex = this.aStyles.indexOf(iStyleId);
	if (iIndex !== -1) {
		this.aStyles.splice(iIndex, 1);
	}
};

sap.zen.crosstab.DataCell.prototype.hasStyle = function (sStyle) {
	var iStyleId = sap.zen.crosstab.CellStyleHandler.getStyleId(sStyle,
			sap.zen.crosstab.rendering.RenderingConstants.TYPE_DATA_CELL);
	var iIndex = this.aStyles.indexOf(iStyleId);
	if (iIndex === -1) {
		return false;
	} else {
		return true;
	}
};

sap.zen.crosstab.DataCell.prototype.getColSpan = function () {
	return 1;
};

sap.zen.crosstab.DataCell.prototype.getRowSpan = function () {
	return 1;
};

sap.zen.crosstab.DataCell.prototype.getEffectiveColSpan = function () {
	return 1;
};

sap.zen.crosstab.DataCell.prototype.getEffectiveRowSpan = function () {
	return 1;
};

sap.zen.crosstab.DataCell.prototype.isLoading = function () {
	return this.bLoading;
};

sap.zen.crosstab.DataCell.prototype.setLoading = function (bLoading) {
	this.bLoading = bLoading;
};

sap.zen.crosstab.DataCell.prototype.isSelectable = function () {
	return false;
};

sap.zen.crosstab.DataCell.prototype.getUnescapedText = function () {
	return sap.zen.crosstab.utils.Utils.unEscapeDisplayString(this.getText());
};

sap.zen.crosstab.DataCell.prototype.setEntryEnabled = function (bIsEntryEnabled) {
	this.bIsEntryEnabled = bIsEntryEnabled;
};

sap.zen.crosstab.DataCell.prototype.isEntryEnabled = function () {
	return this.bIsEntryEnabled;
};

sap.zen.crosstab.DataCell.prototype.setUnit = function (sUnit) {
	this.sUnit = sUnit;
};

sap.zen.crosstab.DataCell.prototype.getUnit = function () {
	return this.sUnit;
};

sap.zen.crosstab.DataCell.prototype.getPassiveCellType = function () {
	return this.sPassiveCellType;
};

sap.zen.crosstab.DataCell.prototype.setPassiveCellType = function (sPCellType) {
	this.sPassiveCellType = sPCellType;
};

sap.zen.crosstab.DataCell.prototype.setNumberOfLineBreaks = function (iNumberOfLineBreaks) {
	this.iNumberOfLineBreaks = iNumberOfLineBreaks;
};

sap.zen.crosstab.DataCell.prototype.getNumberOfLineBreaks = function () {
	return this.iNumberOfLineBreaks;
};