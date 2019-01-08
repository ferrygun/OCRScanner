/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides control sap.gantt.shape.ext.rls.SelectedRelationship.
sap.ui.define([
	"sap/gantt/shape/ext/rls/Relationship"
], function (Relationship) {
	"use strict";

	/**
	 * Creates and initializes a SelectedRelationship object
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * <p>
	 *     Provides an implementation of shape for drawing relationships with red and wider lines when they are selected. 
	 * </p>
	 *
	 *
	 * @extends sap.gantt.shape.ext.rls.Relationship
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.shape.ext.rls.SelectedRelationship
	 */
	var SelectedRelationship = Relationship.extend("sap.gantt.shape.ext.rls.SelectedRelationship", {
		metadata: {
			properties: {
				/**
				 * Line color of the relationship.
				 */
				stroke: {type: "string"},
				/**
				 * Width of the relationship line.
				 */
				strokeWidth: {type: "int"}
			}
		}
	});
	
	/**
	 * Gets the value of <code>stroke</code>.
	 * 
	 * <p>
	 * See {@link sap.gantt.shape.Shape#getStroke} for a detailed description of <code>stroke</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @return {string} Hard coded value: "red".
	 * @public
	 */
	// For now, we cannot set the stroke by using default value because shape class for selected state doesn't support shapeProperties configuration.
	SelectedRelationship.prototype.getStroke = function (oData) {
		return "red";
	};
	/**
	 * Gets the value of <code>fill</code>.
	 * 
	 * <p> 
	 * See {@link sap.gantt.shape.Shape#getFill} for a detailed description of <code>fill</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @return {string} Hard coded value: "red".
	 * @public
	 */
	SelectedRelationship.prototype.getFill = function (oData) {
		return "red";
	};
	/**
	 * Gets the value of <code>strokeWidth</code>.
	 * 
	 * <p>
	 * See {@link sap.gantt.shape.Shape#getStrokeWidth} for a detailed description of <code>strokeWidth</code>.
	 * </p>
	 * 
	 * @param {object} oData Shape data.
	 * @return {int} Hard coded value: 2.
	 * @public
	 */
	// For now, we cannot set the strokeWidth by using default value because shape class for selected state doesn't support shapeProperties configuration.
	SelectedRelationship.prototype.getStrokeWidth = function (oData) {
		return 2;
	};

	return SelectedRelationship;
}, true);
