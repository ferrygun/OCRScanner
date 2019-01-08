/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/gantt/shape/Shape"
], function (Shape) {
	"use strict";

	/**
	 * Creates and initializes a new SVG graphic object according to shape data.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class 
	 * Base class for all SVG definitions. It is different from the svgDefs in <code>GanttChartBase</code>.
	 * It is a container shape and related to shape data.
	 * 
	 * <p>
	 * SVG uses the 'defs' tag to represent graphic objects that can be reused at a later time.
	 * See {@link http://www.w3.org/TR/SVG/struct.html#DefsElement 'defs' in SVG}.
	 * Currently <code>sap.gantt</code> provides defs like TextRepeat. Applications can also 
	 * extend this base class to support more functionality.
	 * </p>
	 * 
	 * @extend sap.gantt.shape.Shape
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.Definitions
	 */
	var Definitions = Shape.extend("sap.gantt.shape.Definitions", /** @lends sap.gantt.shape.Definitions.prototype */{
		metadata: {
			properties: {
				tag: {type: "string", defaultValue: "defs"},
				childTagName: {type: "string"}, //pattern|gradient|xxxx
				/**
				 * Definition string. Subclasses can implement their own getters of this property to override the one in this class.
				 */
				content: {type: "string", defaultValue: ""},
				/**
				 * Unique id for definition.
				 */
				referenceId: {type: "string"}
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
	 * @name sap.gantt.shape.Definitions.prototype.getTag
	 * @function
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>tag</code> property.
	 * @public
	 */

	/**
	 * Gets the value of the <code>childTagName</code> property.
	 * 
	 * The 'defs' element is a container element for referenced elements. The content model for 'defs' is 
	 * the same as that for the 'g' element; thus, any element that can be a child of a 'g' can also be a child 
	 * of a 'defs'. The 'childTagName' is the name of any child element of 'defs'.See {@link http://www.w3.org/TR/SVG/struct.html#DefsElement SVG 1.1 specification for defs}.<br/>
	 * 
	 * @param {object} oData Shape data.
	 * @param {object} oRowInfo Information about the row and the row data.
	 * @return {string} Value of the <code>childTagName</code> property.
	 * @public
	 */
	Definitions.prototype.getChildTagName = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("childTagName")) {
			return this._configFirst("childTagName", oData);
		}
	};

	Definitions.prototype.getContent = function(oData, oRowInfo) {
		if (this.mShapeConfig.hasShapeProperty("content")) {
			return this._configFirst("content", oData);
		}
		return null;
	};

	Definitions.prototype.getReferenceId = function(oData, oRowInfo) {
		return this.getParentReferenceId(oData, oRowInfo);
	};

	return Definitions;
}, true);
