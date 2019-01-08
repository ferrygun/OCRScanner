/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element'
], function(jQuery, Element) {
	"use strict";

	/**
	 * The SelectionWrapper can be used to wrap a chart.
	 * 
	 * @class Selection Wrapper
	 * @extends sap.ui.core.Element
	 * @author SAP
	 * @version 1.46.0-SNAPSHOT
	 * @private
	 * @since 1.46.0
	 * @alias sap.ui.comp.personalization.SelectionWrapper
	 */
	var SelectionWrapper = Element.extend("sap.ui.comp.personalization.SelectionWrapper",
	/** @lends sap.ui.comp.personalization.SelectionWrapper */
	{
		constructor: function(sId, mSettings) {
			Element.apply(this, arguments);
		},
		metadata: {
			library: "sap.ui.comp",
			aggregations: {
				/**
				 * Defines columns.
				 */
				columns: {
					type: "sap.ui.comp.personalization.ColumnWrapper",
					multiple: true,
					singularName: "column"
				}
			}
		}
	});

	return SelectionWrapper;

}, /* bExport= */true);
