/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2014 SAP SE. All rights reserved
 */

/* ----------------------------------------------------------------------------------
 * Hint: This is a derived (generated) file. Changes should be done in the underlying 
 * source files only (*.control, *.js) or they will be lost after the next generation.
 * ---------------------------------------------------------------------------------- */

// Provides control sap.ca.ui.charts.BarListItem.
jQuery.sap.declare("sap.ca.ui.charts.BarListItem");
jQuery.sap.require("sap.ca.ui.library");
jQuery.sap.require("sap.m.ListItemBase");


/**
 * Constructor for a new charts/BarListItem.
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
 * <li>{@link #getAxis axis} : string</li>
 * <li>{@link #getGroup group} : string</li>
 * <li>{@link #getValue value} : string</li></ul>
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
 * 
 * In addition, all settings applicable to the base type {@link sap.m.ListItemBase#constructor sap.m.ListItemBase}
 * can be used as well.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given 
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * The display list item consists of a label and a value.
 * @extends sap.m.ListItemBase
 *
 * @author SAP SE
 * @version 1.52.0
 *
 * @constructor
 * @public
 * @deprecated Since version 1.24. 
 * 
 * Sap.ca charts have been replaced with sap.viz and vizFrame in 1.24.
 * The UI5 control "sap.viz.ui5.controls.VizFrame" serves as a single point of entry for all the new charts.
 * Now that 1.24 is available you are asked to use sap.viz charts and the VizFrame instead!
 * This control will not be supported anymore from 1.24.
 * @name sap.ca.ui.charts.BarListItem
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
sap.m.ListItemBase.extend("sap.ca.ui.charts.BarListItem", { metadata : {

	deprecated : true,
	library : "sap.ca.ui",
	properties : {

		/**
		 * List item label
		 */
		"axis" : {type : "string", group : "Misc", defaultValue : null},

		/**
		 * List item label
		 */
		"group" : {type : "string", group : "Misc", defaultValue : null},

		/**
		 * List item value
		 */
		"value" : {type : "string", group : "Data", defaultValue : null}
	}
}});


/**
 * Creates a new subclass of class sap.ca.ui.charts.BarListItem with name <code>sClassName</code> 
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
 * @name sap.ca.ui.charts.BarListItem.extend
 * @function
 */


/**
 * Getter for property <code>axis</code>.
 * List item label
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>axis</code>
 * @public
 * @name sap.ca.ui.charts.BarListItem#getAxis
 * @function
 */

/**
 * Setter for property <code>axis</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sAxis  new value for property <code>axis</code>
 * @return {sap.ca.ui.charts.BarListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BarListItem#setAxis
 * @function
 */


/**
 * Getter for property <code>group</code>.
 * List item label
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>group</code>
 * @public
 * @name sap.ca.ui.charts.BarListItem#getGroup
 * @function
 */

/**
 * Setter for property <code>group</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sGroup  new value for property <code>group</code>
 * @return {sap.ca.ui.charts.BarListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BarListItem#setGroup
 * @function
 */


/**
 * Getter for property <code>value</code>.
 * List item value
 *
 * Default value is empty/<code>undefined</code>
 *
 * @return {string} the value of property <code>value</code>
 * @public
 * @name sap.ca.ui.charts.BarListItem#getValue
 * @function
 */

/**
 * Setter for property <code>value</code>.
 *
 * Default value is empty/<code>undefined</code> 
 *
 * @param {string} sValue  new value for property <code>value</code>
 * @return {sap.ca.ui.charts.BarListItem} <code>this</code> to allow method chaining
 * @public
 * @name sap.ca.ui.charts.BarListItem#setValue
 * @function
 */

// Start of sap/ca/ui/charts/BarListItem.js
/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
///**
// * This file defines behavior for the control,
// */
//sap.m.DisplayListItem.prototype.init = function(){
//   // do something for initialization...
//};
