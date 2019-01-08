/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function (jQuery, Element) {
	"use strict";
	/**
	 * Creates and initializes a new hierarchy column
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines the column attribute which is used in the hierarchy column
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.HierarchyColumn
	 */
	var HierarchyColumn = Element.extend("sap.gantt.config.HierarchyColumn", /** @lends sap.gantt.config.HierarchyColumn.prototype */ {
		metadata: {
			properties: {
				/**
				 * Unique key of the hierarchy column
				 */
				key: {type: "string", defaultValue: null},
				/**
				 * Title is used as the title of the column header in the tree table
				 */
				title: {type: "string", defaultValue: null},
				/**
				 * Content type of the column
				 */
				contentType: {type: "string", defaultValue: null},
				/**
				 * Specifies the attribute by which the tree table sorts items in the column
				 */
				sortAttribute: {type: "string", defaultValue: null},
				/**
				 * Specifies the attribute by which the tree table filter items in the column
				 */
				filterAttribute: {type: "string", defaultValue: null},
				/**
				 * Attribute
				 */
				attribute: {type: "string", defaultValue: null}, // optional.
				/**
				 * Attributes. Array of {@link sap.gantt.config.ColumnAttribute}
				 */
				attributes: {type: "object[]", defaultValue: []}, //optional. array of objects. new file columnAttribute to describe object: object type, attribute
				/**
				 * Column Width
				 */
				width: {type: "sap.ui.core.CSSSize"}
			}
		}
	});

	return HierarchyColumn;
}, true);