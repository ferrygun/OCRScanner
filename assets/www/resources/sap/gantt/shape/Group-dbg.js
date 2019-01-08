/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape"
], function (Shape) {
	"use strict";

	/**
	 * Creates and initializes a new Group class.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Group shape class using SVG tag 'group'. It is a container shape. Any other shapes can be aggregated under a group.
	 * 
	 * <p>
	 * See {@link http://www.w3.org/TR/SVG/struct.html#Groups SVG specification 1.1 for 'group' element} for
	 * more information about the HTML tag.<br/><br/>
	 * </p>
	 * 
	 * @extend sap.gantt.shape.Shape
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.Group
	 */
	var Group = Shape.extend("sap.gantt.shape.Group", /** @lends sap.gantt.shape.Group.prototype */ {
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "g"},
				RLSAnchors: {type: "object"}
			},
			aggregations: {
				
				/**
				 * 
				 */
				shapes: {type: "sap.gantt.shape.Shape", multiple: true, singularName: "shape"}
			}
		}
	});

	/**
	 * Gets the value of the <code>tag</code> property.
	 * 
	 * SVG tag name of the shape.
	 * See {@link http://www.w3.org/TR/SVG/shapes.html SVG 1.1 specification for shapes}.<br/>
	 * <b>Note:</b> We do not recommend that you change this value using a configuration or coding.
	 * 
	 * @name sap.gantt.shape.Group.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>tag</code> property.
	 * @public
	 */

	/**
	 * To enable connections between in-row shapes, a custom Group class has to be implemented that extends <code>sap.gantt.shape.Group</code>.
	 * Additionally, the <code>getRLSAnchors</code> method has to be implemented for the Relationship class to know the coordinates of the connection points.
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowObjectInfo Information about the row and the row data.
	 * @return {object} Coordinates of the "from" shape (start) and "to" shape (end)
	 * @public
	 */
	Group.prototype.getRLSAnchors = function (oData, oRowObjectInfo){
		return this._configFirst("RLSAnchors", oData);
	};

	/**
	 * Generate a referenceId according to shape data.
	 * 
	 * <p>
	 * 'referenceId' is used to identify Definitions shapes. Aggregation shapes of a Group shape
	 * can retrieve the 'referenceId' by their getParentReferenceId method and then consume the
	 * corresponding Definition shape.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information of the row and row data.
	 * @return {string} Value of the <code>referenceId</code> property.
	 * @public
	 */
	Group.prototype.genReferenceId = function (oData, oRowObjectInfo) {
		return this._configFirst("referenceId", oData);
	};

	return Group;
}, true);
