/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function(jQuery, Element) {
	"use strict";

	/**
	 * The ColumnWrapper can be used to wrap a chart.
	 * 
	 * @class Chart Wrapper
	 * @extends sap.ui.core.Element
	 * @author SAP
	 * @version 1.34.0-SNAPSHOT
	 * @private
	 * @since 1.34.0
	 * @alias sap.ui.comp.personalization.ColumnWrapper
	 */
	var ColumnWrapper = Element.extend("sap.ui.comp.personalization.ColumnWrapper",
	/** @lends sap.ui.comp.personalization.ColumnWrapper */
	{
		constructor: function(sId, mSettings) {
			Element.apply(this, arguments);
		},
		metadata: {
			library: "sap.ui.comp",
			properties: {
				/**
				 * Defines label to be displayed for the column.
				 */
				label: {
					type: "string"
				},

				/**
				 * Defines tooltip of column.
				 */
				tooltip: {
					type: "string"
				},

				/**
				 * Defines selection of column.
				 */
				selected: {
					type: "boolean",
					defaultValue: false
				},

				/**
				 * Defines the type of column. Supported values are: "dimension", "measure" and "notDimeasure".
				 */
				aggregationRole: {
					type: "sap.ui.comp.personalization.AggregationRole"
				},

				/**
				 * Defines the role of column. Supported values are: "axis1", "axis2" or "axis3" in case of measure and "category" or "series" in case
				 * of dimension.
				 */
				role: {
					type: "string"
				},

				/**
				 * Defines the href of link.
				 * 
				 * @since 1.46.0
				 */
				href: {
					type: "string",
					defaultValue: null
				},

				/**
				 * Defines the target of link.
				 * 
				 * @since 1.46.0
				 */
				target: {
					type: "string",
					defaultValue: null
				},

				/**
				 * Defines the press event of link.
				 * 
				 * @since 1.46.0
				 */
				press: {
					type: "object",
					defaultValue: null
				},
				/**
				 * Indicates if the column is sorted.
				 * 
				 * @since 1.48.0
				 */
				sorted: {
					type: "boolean",
					defaultValue: false
				},
				/**
				 * Defines the sort order of the column.
				 * 
				 * @since 1.48.0
				 */
				sortOrder: {
					type: "string",
					defaultValue: "Ascending"
				}
			}
		}
	});

	return ColumnWrapper;

}, /* bExport= */true);
