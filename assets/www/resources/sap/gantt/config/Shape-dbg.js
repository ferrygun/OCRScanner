/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	
	/**
	 * Creates and initializes a shape configuration.
	 * 
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given 
	 * @param {object} [mSettings] Initial settings for the new control
	 * 
	 * @class
	 * Configuration object for Shape.
	 * 
	 * <p>
	 * This configuration specifies the Shape class used to represent specific data and how the Shape class is constructed.
	 * Some properties of Shape can be directly configured by setting property <code>shapeProperties</code>.
	 * 
	 * A Shape class may come from the shape library provided in namespace <code>sap.gantt.shape</code> or from any extended shape you've created.
	 * Shape classes are instantiated according to the structure described in this configuration class inside <code>sap.gantt.Gantt</code>.
	 * The aggregation structure is described by properties <code>groupAggregation</code>, <code>clippathAggregation</code>, and <code>selectedClassName</code>.
	 * 
	 * The root shape is called 'top shape'. Some properties are only top shape relevant such as <code>key</code>, <code>level</code>, and <code>selectedClassName</code>.
	 * </p>
	 * 
	 * @extends sap.ui.core.Element
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.Shape
	 */
	var Shape = Element.extend("sap.gantt.config.Shape", /** @lends sap.gantt.config.Shape.prototype */ {
		metadata: {
			properties: {
				/**
				 * Primary key of the shape configuration. This property can be referenced from other configuration object, such as
				 * <code>sap.gantt.config.ChartScheme</code>. This property is only relevant to top Shape configuration.
				 */
				key: {type: "string", defaultValue: null},
				
				/**
				 * Specifies the shape class to be used for data representation. Both shapes from <code>sap.gantt.shape</code> and extended
				 * shapes can be used here.
				 */
				shapeClassName: {type: "string", defaultValue: null},
				
				/**
				 * Specifies the name of the data name to be represented. This is for the top shape only.
				 */
				shapeDataName: {type: "string", defaultValue: null},
				
				/**
				 * Specifies the key of modes in which the shape is drawn. If you leave this property empty, the shape is drawn in all modes.
				 */
				modeKeys: {type: "string[]", defaultValue: []},
				
				/**
				 * Level of shapes. Shapes closer to the top shape have a smaller value in level. This property is only relevant to top shape configuration
				 * (non aggregated shape configuration).
				 */
				level: {type: "string", defaultValue: null},
				
				/**
				 * Pre-configured values for Shape. The values specified in this object have a higher priority than values coded in the Shape class.
				 */
				shapeProperties: {type: "object", defaultValue: sap.gantt.config.DEFAULT_EMPTY_OBJECT},
				
				/**
				 * Aggregation shapes for sap.gantt.shape.Group class.
				 * This aggregation is only valid for shape classes with tag='g'.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Shape[]</code>. Otherwise some properties you set may not function properly.
				 */
				groupAggregation: {type: "object[]"},
				
				
				/**
				 * Aggregation path classes for sap.gantt.shape.Clippath class.
				 * This aggregation is only valid for shape classes with tag='clippath'. 
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Shape[]</code>. Otherwise some properties you set may not function properly.
				 */
				clippathAggregation: {type: "object[]"},
				
				/**
				 * Aggregation class for drawing selection of this shape. If nothing is assigned to this property, <code>sap.gantt.Gantt</code>
				 * instantiates the default selected shape class. 
				 */
				selectedClassName: {type: "string", defaultValue: null},
				
				/**
				 * Switch of shape's checkbox value in list legend, its value can be "noShow", "checked" and "unchecked".
				 */
				switchOfCheckBox: {type: "string", defaultValue: "noShow"},
				
				/**
				 * Aggregation class for drawing shadow when resizing this shape. If nothing is assigned to this property, <code>sap.gantt.Gantt</code>
				 * instantiates the default shadow shape class. 
				 */
				resizeShadowClassName: {type: "string", defaultValue: null}
			}
		}
	});
	
	/**
	 * Checks if a property is pre-configured in <code>shapeProperties</code>.
	 * 
	 * <p>This method together with method <code>getShapeProperty()</code> is frequently used in <code>sap.gantt.shape</code> classes 
	 * to make sure the principle of 'configuration first' is applied.
	 * .</p>
	 * 
	 * @public
	 * @param {string} sPropertyName - Name of the shape property.
	 * @returns {boolean} - Whether the property is pre-configured.
	 */
	Shape.prototype.hasShapeProperty = function (sPropertyName){
		return  this.getShapeProperties().hasOwnProperty(sPropertyName);
	};
	
	/**
	 * Get a pre-configured property from <code>shapeProperties</code>.
	 * 
	 * <p>This method together with method <code>hasShapeProperty</code> is frequently used in <code>sap.gantt.shape</code> classes 
	 * to make sure the principle of 'configuration first' is applied.
	 * .</p>
	 * 
	 * @public
	 * @param {string} sPropertyName - Name of the shape property.
	 * @returns {string} - Pre-configured value.
	 */
	Shape.prototype.getShapeProperty = function (sPropertyName) {
		return  this.getShapeProperties()[sPropertyName];
	};
	
	return Shape;
}, true);