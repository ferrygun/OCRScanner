/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/ui/base/Object"
], function (Object) {
	"use strict";

	/**
	 * Creates and initializes a new drawer.
	 * 
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * 
	 * @class 
	 * Base class for all d3 drawers.
	 * 
	 * <p>In sap.gantt, most d3 logics are wrapped by Drawer classes. This helps to segregate d3 data binding and rendering logic for SVG from genraral UI5 classes.
	 * For now Drawer concept are not open for application development. 
	 * They are instantiated, used and destroyed inside <code>sap.gantt.Gantt</code> and <code>sap.gantt.GanttWithTable</code>.</p>
	 * 
	 * @extend sap.ui.base.Object
	 * @abstract
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @private
	 * @alias sap.gantt.drawer.Drawer
	 */
	var Drawer = Object.extend("sap.gantt.drawer.Drawer", /* @lends sap.gantt.drawer.Drawer */ {
		metadata: {
			"abstract": true
		}
	});

	/**
	 * Provide drawing logic.
	 * 
	 * <p>Every subclasses should implement this method.</p>
	 *
	 * @private
	 * @function
	 * @param {array} aSvgNode d3 Nodes selected by d3 selector. Current drawer is supposed to draw on all the svg nodes passed in by this parameter.
	 */

	/**
	 * Provide destroying logic.
	 * 
	 * <p>Every subclasses should implement this method. 
	 * Events on SVG elements if exist are recommended to be removed in this methods.</p>
	 *
	 * @private
	 * @function
	 * @param {array} aSvgNode d3 Nodes selected by d3 selector.
	 * Current drawer is supposed to draw on all the svg nodes passed in by this parameter.
	 */

	return Drawer;
}, true);
