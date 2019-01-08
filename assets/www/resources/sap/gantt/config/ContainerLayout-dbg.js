/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.global', 'sap/ui/core/Element', 'sap/ui/core/Orientation'
], function (jQuery, Element, Orientation) {
	"use strict";
	/**
	 * Creates and initializes a new container layout
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Defines the container layout. The container layout determines the layout of a Gantt chart container such as the CSS size, orientation, toolbar, and tree table size. 
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.ContainerLayout
	 */
	var ContainerLayout = Element.extend("sap.gantt.config.ContainerLayout", /** @lends sap.gantt.config.ContainerLayout.prototype */ {
		metadata: {
			properties: {
				/**
				 * Unique key of the container layout
				 */
				key: {type: "string", defaultValue: sap.gantt.config.DEFAULT_CONTAINER_SINGLE_LAYOUT_KEY},
				/*
				 * Description of the container layout
				 */
				text: {type: "string", defaultValue: sap.ui.getCore().getLibraryResourceBundle("sap.gantt").getText("XLST_SINGLE_LAYOUT")},
				/**
				 * Orientation of the Gantt chart container. See {@link sap.ui.core.Oritentation}
				 */
				orientation: {type: "sap.ui.core.Orientation", defaultValue: Orientation.Vertical},
				/**
				 * Active mode key. See {@link sap.gantt.config.Mode}
				 */
				activeModeKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_MODE_KEY},
				/**
				 * Toolbar scheme key. See {@link sap.gantt.config.ToolbarScheme}
				 */
				toolbarSchemeKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_CONTAINER_TOOLBAR_SCHEME_KEY},
				/**
				 * CSS size of the selection panel. See {@link sap.ui.core.CSSSize}
				 */
				selectionPanelSize: {type: "sap.ui.core.CSSSize", defaultValue: "30%"},
				/**
				 * Array of the Gantt chart layout. See {@link sap.gantt.config.GanttChartLayout}
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.GanttChartLayout[]</code>. Otherwise some properties you set may not function properly.
				 */
				ganttChartLayouts: {type: "object[]", defaultValue: []}
			}
		}
	});
	
	return ContainerLayout;
}, true);