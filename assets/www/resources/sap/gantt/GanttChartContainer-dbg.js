/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"./library", "sap/ui/core/Control", "sap/ui/layout/Splitter", "sap/ui/layout/SplitterLayoutData", "sap/ui/core/Orientation",
	"./legend/LegendContainer", "./control/Toolbar", "./control/AssociateContainer",
	"./config/TimeHorizon", "./misc/Utility"
], function (library, Control, Splitter, SplitterLayoutData, Orientation, LegendContainer, Toolbar, AssociateContainer,
	TimeHorizon, Utility) {
	"use strict";

	/**
	 * Creates and initializes a new Gantt chart container.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * A container that holds one or more <code>GanttChartBase</code> instances.
	 *
	 * <p> This class has several built-in several controls to support <code>GanttChartBase</code> instances:
	 *  <ul>
	 * 		<li>A toolbar above all Gantt Charts. Many built-in controls can be enabled or disabled using configuration property <code>toolbarScheme</code>. Built-in functions include:
	 *			<ul>
	 *				<li>ComboBox for container selection</li>
	 *				<li>Buttons for Add View, Delete View, and Switch Splitter Orientation</li>
	 *				<li>Expand/Collapse groups for expandable charts</li>
	 *				<li>A zooming slider</li>
	 *				<li>A legend button</li>
	 *				<li>A Settings button</li>
	 *			</ul>
	 *			If nothing is added to the toolbar, the toolbar is hidden automatically. For more information about the functions and configuration, 
	 *			see the API documentation of <code>sap.gantt.config.ToolbarScheme.</code>
	 *		</li>
	 *		<li>A Splitter containing aggregation <code>ganttCharts</code></li>
	 *  </ul>
	 * </p>
	 *
	 * @extend sap.ui.core.Control
	 * 
	 * @author SAP SE
	 * @version 1.52.4
	 * 
	 * @constructor
	 * @public
	 * @alias sap.gantt.GanttChartContainer
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var GanttChartContainer = Control.extend("sap.gantt.GanttChartContainer", /** @lends sap.gantt.GanttChartContainer.prototype */ {
		metadata: {
			library: "sap.gantt",
			properties: {
				/**
				 * Width of the control
				 */
				width: {type: "sap.ui.core.CSSSize", defaultValue: "100%"},

				/**
				 * Height of the control
				 */
				height: {type: "sap.ui.core.CSSSize", defaultValue: "100%"},

				/**
				 * Switch to enable and disable scroll synchronization by time on instances of aggregation <code>ganttCharts</code>.
				 */
				enableTimeScrollSync: {type: "boolean", defaultValue: true},

				/**
				 * Switch to enable and disable the cursor line that follows the cursor.
				 *
				 * When this value is set, it overrides the corresponding value on instances of aggregation <code>ganttCharts</code>.
				 */
				enableCursorLine: {type: "boolean", defaultValue: true},

				/**
				 * Switch to enable and disable the present time indicator.
				 *
				 * When this value is set, it overrides the corresponding value on instances of aggregation <code>ganttCharts</code>.
				 */
				enableNowLine: {type: "boolean", defaultValue: true},

				/**
				 * Switch to enable and disable vertical lines representing intervals along the time axis.
				 *
				 * When this value is set, it overrides the corresponding value on instances of aggregation <code>ganttCharts</code>.
				 */
				enableVerticalLine: {type: "boolean", defaultValue: true},

				/**
				 * Switch to enable and disable adhoc lines representing milestones and events along the time axis.
				 *
				 * When this value is set, it overrides the corresponding value on instances of aggregation <code>ganttCharts</code>.
				 */
				enableAdhocLine: {type: "boolean", defaultValue: true},

				/**
				 * Definitions of paint servers used for advanced shape features around SVG fill, stroke, and filter attributes.
				 * 
				 * If this property is provided, the paint server definition of the SVG is rendered. Method <code>getDefString()</code> should be
				 * implemented by all paint server classes that are passed in in this property. It is easier to assign a common paint server definition
				 * in this class instead of in separate instances of <code>sap.gantt.GanttChartBase</code>. Then the definition is 
				 * rendered only once.
				 * We recommend that you set the type of this argument to <code>sap.gantt.def.SvgDefs</code>. Otherwise some properties you set may not function properly.
				 */
				svgDefs: {type: "object", defaultValue: null},

				/**
				 * List of available modes. To apply modes to the toolbar and shapes, further configuration is needed. (specifically, 
				 * in property <code>toolbarSchemes</code>, and properties <code>toolbarSchemes</code> and <code>shapes</code> in 
				 * the <code>GanttChartBase</code> class)If not provided, a default configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Mode[]</code>. Otherwise some properties you set may not function properly.
				 */
				modes: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_MODES},

				/**
				 * List of available toolbar schemes. If not provided, a default configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ToolbarScheme[]</code>. Otherwise some properties you set may not function properly.
				 */
				toolbarSchemes: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_CONTAINER_TOOLBAR_SCHEMES},

				/**
				 * List of available hierarchies. If not provided, a default configuration is provided.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.Hierarchy[]</code>. Otherwise some properties you set may not function properly.
				 */
				hierarchies: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_HIERARCHYS},

				/**
				 * Configuration of container layouts.
				 * 
				 * This configuration affects the data source selection ComboBox in the Container Toolbar. When the selection
				 * changes, the <code>ganttChartChangeRequested</code> event that is triggered includes the corresponding layout key.
				 * We recommend that you set the type of this argument to <code>sap.gantt.config.ContainerLayout[]</code>. Otherwise some properties you set may not function properly.
				 */
				containerLayouts: {type: "object[]", defaultValue: sap.gantt.config.DEFAULT_CONTAINER_LAYOUTS},

				/**
				 * Current container layout key.
				 * 
				 * This is a key configured in configuration property <code>containerLayouts</code>.
				 */
				containerLayoutKey: {type: "string", defaultValue: sap.gantt.config.DEFAULT_CONTAINER_SINGLE_LAYOUT_KEY},

				/**
				 * Define the amount of units to change the time zoom slider.
				 *
				 * See {@link sap.m.Slider#setStep}
				 * @deprecated As of version 1.44, please set the property 'stepCountOfSlider' in sap.gantt.config.TimeZoomGroup.
				 */
				sliderStep: {type: "int", defautValue: undefined},

				/**
				 * Define the maximum number of Gantt charts to be displayed on the same screen. 
				 * When this number is reached, the "Add Gantt Chart" button is grayed out. 
				 */
				maxNumOfGanttCharts: {type: "int", defaultValue: 3}
			},
			aggregations: {
				
				/**
				 * Legend shown when the legend button is clicked.
				 * 
				 * This aggregation is used only when the Legend button is configured to be shown in the container toolbar.
				 */
				legendContainer: {type: "sap.gantt.legend.LegendContainer", multiple: false, visibility: "public"},

				/**
				 * Controls to be placed in the container toolbar.
				 * 
				 * <p>This aggregation is used only when the custom toolbar item group is configured to be shown in the container toolbar.
				 * Different from the built-in buttons that are configured to be shown or hidden, these controls are free controls created 
				 * by the application, but are only placed in the container toolbar by <code>sap.gantt.GanttChartContainer</code>.</p>
				 * 
				 * <p>If the source selection group is enabled and you want your application to use a container layout pre-configured 
				 * for a specific source, you can implement your custom toolbar items in the event handler of event <code>ganttChartChangeRequested</code>.</p>
				 */
				customToolbarItems: {type: "sap.ui.core.Control", multiple: true, visibility: "public",
					singularName: "customToolbarItem", bindable: "bindable"},

				/**
				 * Gantt chart instances.
				 * 
				 * <p>If the source selection group is enabled and you want your application to use a container layout pre-configured 
				 * for a specific source, you can implement your custom toolbar items in the event handler of event <code>ganttChartChangeRequested</code>.</p>
				 * <p>Provide a Gantt chart in compliance with the container layout setting.
				 * GanttChartContainer is designed to support Gantt chart layouts that include multiple views.</p>
				 */
				ganttCharts: {type: "sap.gantt.GanttChartBase", multiple: true, visibility: "public", singularName: "ganttChart", bindable: "bindable"},

				_toolbar: {type: "sap.gantt.control.Toolbar", multiple: false, visibility: "hidden"}
			},
			events: {
				
				/**
				 * Event fired when any change occurs in the toolbar that requests the application to change aggregation <code>ganttCharts</code>. 
				 * 
				 * <p>Possible triggers are:
				 * <ul>
				 * 	<li>The source selection group changes in the container toolbar.</li>
				 * 	<li>The layout group button is clicked in the container toolbar.</li>
				 * 	<li>The source selection group changes in the Gantt chart toolbar.</li>
				 * </ul>
				 * </p>
				 */
				ganttChartChangeRequested: {
					parameters: {
						/**
						 * Action that caused the change.
						 * 
						 * <p>Possible action values are:
						 * <ul>
						 * 	<li><code>'switchGanttChart'</code>: The source selection group of one Gantt chart toolbar is changed.</li>
						 * 	<li><code>'addGanttChart'</code>: The Add Gantt chart dropdown menu is selected.</li>
						 *  <li><code>'lessGanttChart'</code>: The Less Gantt chart dropdown menu is selected.</li>
						 *  <li><code>'switchContainerLayout'</code>: The source selection group of the Container toolbar is changed.</li>
						 * </ul>
						 * </p>
						 */
						action: {type: "string"},
						
						/**
						 * Provided for actions <code>'switchGanttChart'</code> and <code>'lessGanttChart'</code>.
						 */
						ganttChartIndex: {type: "int"},
						
						/**
						 * Provided for actions <code>'switchGanttChart'</code>, <code>'addGanttChart'</code> and <code>'lessGanttChart'</code>.
						 */
						hierarchyKey: {type: "string"},
						
						/**
						 * Provided for action <code>'switchGanttChart'</code>.
						 */
						oldHierarchyKey: {type: "string"},
						
						/**
						 * Provided for action <code>'switchContainerLayout'</code>.
						 */
						containerLayoutKey: {type: "string"}
					}
				},
				
				/**
				 * Event fired when the custom settings are changed.
				 * 
				 * The Custom settings are application-injected settings that can be configured in the Settings dialog box. This event allows the application to handle these settings.
				 * Only check boxes are supported.
				 */
				customSettingChange: {
					parameters: {
						/**
						 * ID of the custom setting
						 */
						id: {type: "string"},
						
						/**
						 * The value of the custom setting
						 */
						value: {type: "boolean"}
					}
				},
				
				/**
				 * Event fired when toggle node of the tree table.
				 */
				treeTableToggleEvent: {
					parameters: {
						/**
						 * The index of the expanded/collapsed row.
						 */
						rowIndex: {type: "int"},
						/**
						 * The binding context of the selected row.
						 */
						rowContext: {type: "object"},
						/**
						 * flag whether the node has been expanded or collapsed.
						 */
						expanded: {type: "boolean"}
					}
				}
			}
		}
	});

	GanttChartContainer.prototype.init = function () {
		jQuery.sap.measure.start("GanttChartContainer Init","GanttPerf:GanttChartContainer Init function");
		
		this._bInitHorizonApplied = false;

		this._oToolbar = new Toolbar({
			type: sap.gantt.control.ToolbarType.Global,
			sourceId: sap.gantt.config.DEFAULT_CONTAINER_SINGLE_LAYOUT_KEY
		});
		this.setAggregation("_toolbar", this._oToolbar);
		this._oToolbar.attachSourceChange(this._onToolbarSourceChange, this);
		this._oToolbar.attachLayoutChange(this._onToolbarLayoutChange, this);
		this._oToolbar.attachExpandChartChange(this._onToolbarExpandChartChange, this);
		this._oToolbar.attachZoomStopChange(this._onToolbarZoomStopChange, this);
		this._oToolbar.attachSettingsChange(this._onToolbarSettingsChange, this);
		this._oToolbar.data("holder", this);

		this._oSplitter = new Splitter({
			width: "100%",
			height: "100%",
			orientation: Orientation.Vertical
		});

		this._oModesConfigMap = {};
		this._oModesConfigMap[sap.gantt.config.DEFAULT_MODE_KEY] = sap.gantt.config.DEFAULT_MODE;
		
		this._oToolbarSchemeConfigMap = {};
		this._oToolbarSchemeConfigMap[sap.gantt.config.DEFAULT_CONTAINER_TOOLBAR_SCHEME_KEY] = sap.gantt.config.DEFAULT_CONTAINER_TOOLBAR_SCHEME;
		this._oToolbarSchemeConfigMap[sap.gantt.config.DEFAULT_GANTTCHART_TOOLBAR_SCHEME_KEY] = sap.gantt.config.DEFAULT_GANTTCHART_TOOLBAR_SCHEME;
		this._oToolbarSchemeConfigMap[sap.gantt.config.EMPTY_TOOLBAR_SCHEME_KEY] = sap.gantt.config.EMPTY_TOOLBAR_SCHEME;

		this._oHierarchyConfigMap = {};
		this._oHierarchyConfigMap[sap.gantt.config.DEFAULT_HIERARCHY_KEY] = sap.gantt.config.DEFAULT_HIERARCHY;
		
		this._oContainerLayoutConfigMap = {};
		this._oContainerLayoutConfigMap[sap.gantt.config.DEFAULT_CONTAINER_SINGLE_LAYOUT_KEY] = sap.gantt.config.DEFAULT_CONTAINER_SINGLE_LAYOUT;
		this._oContainerLayoutConfigMap[sap.gantt.config.DEFAULT_CONTAINER_DUAL_LAYOUT_KEY] = sap.gantt.config.DEFAULT_CONTAINER_DUAL_LAYOUT;

		jQuery.sap.measure.end("GanttChartContainer Init");
	};

	GanttChartContainer.prototype.applySettings = function (mSettings, oScope) {
		var retVal = Control.prototype.applySettings.apply(this, arguments);
		if (this.getContainerLayouts() && this.getContainerLayoutKey()) {
			this.switchOrientation(null, true);
		}
		return retVal;
	};

	GanttChartContainer.prototype.setModes = function (aModes) {
		this.setProperty("modes", aModes);
		this._oToolbar.setModes(aModes);
		// build a map for easy look up
		this._oModesConfigMap = {};
		if (aModes) {
			for (var i = 0; i < aModes.length; i++) {
				this._oModesConfigMap[aModes[i].getKey()] = aModes[i];
			}
		}
		return this;
	};
	
	GanttChartContainer.prototype.setTimeZoomRate = function (fTimeZoomRate) {
		var aGanttCharts = this.getGanttCharts();
		var i, oGanttChart;
		for (i = 0; i < aGanttCharts.length; i++) {
			oGanttChart = aGanttCharts[i];
			oGanttChart.setTimeZoomRate(fTimeZoomRate);
		}
		return this;
	};
	
	GanttChartContainer.prototype.setTimeZoomStop = function (oTimeZoomStop) {
		var aGanttCharts = this.getGanttCharts();
		var i, oGanttChart;
		for (i = 0; i < aGanttCharts.length; i++) {
			oGanttChart = aGanttCharts[i];
			oGanttChart.setTimeZoomStop(oTimeZoomStop);
		}
		return this;
	};

	GanttChartContainer.prototype.setToolbarSchemes = function (aToolbarSchemes) {
		this.setProperty("toolbarSchemes", aToolbarSchemes);
		this._oToolbar.setToolbarSchemes(aToolbarSchemes);
		// build a map for easy look up
		this._oToolbarSchemeConfigMap = {};
		if (aToolbarSchemes) {
			for (var i = 0; i < aToolbarSchemes.length; i++) {
				this._oToolbarSchemeConfigMap[aToolbarSchemes[i].getKey()] = aToolbarSchemes[i];
			}
		}
		return this;
	};
	
	GanttChartContainer.prototype.setHierarchies = function (aHierarchies) {
		this.setProperty("hierarchies", aHierarchies);
		this._oToolbar.setHierarchies(aHierarchies);
		// build a map for easy look up
		this._oHierarchyConfigMap = {};
		if (aHierarchies) {
			for (var i = 0; i < aHierarchies.length; i++) {
				this._oHierarchyConfigMap[aHierarchies[i].getKey()] = aHierarchies[i];
			}
		}
		return this;
	};
	
	GanttChartContainer.prototype.setContainerLayouts = function (aContainerLayouts) {
		this.setProperty("containerLayouts", aContainerLayouts);
		this._oToolbar.setContainerLayouts(aContainerLayouts);
		// build a map for easy look up
		this._oContainerLayoutConfigMap = {};
		if (aContainerLayouts) {
			for (var i = 0; i < aContainerLayouts.length; i++) {
				this._oContainerLayoutConfigMap[aContainerLayouts[i].getKey()] = aContainerLayouts[i];
			}
		}
		if (this.getContainerLayoutKey()) {
			this.switchOrientation(null, true);
		}
		return this;
	};

	GanttChartContainer.prototype.setEnableCursorLine = function (bEnableCursorLine) {
		this.setProperty("enableCursorLine", bEnableCursorLine);
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			aGanttCharts[i].setEnableCursorLine(bEnableCursorLine);
		}
		this.getAggregation("_toolbar").setEnableCursorLine(bEnableCursorLine);
		return this;
	};

	GanttChartContainer.prototype.setEnableNowLine = function (bEnableNowLine) {
		this.setProperty("enableNowLine", bEnableNowLine);
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			aGanttCharts[i].setEnableNowLine(bEnableNowLine);
		}
		this.getAggregation("_toolbar").setEnableNowLine(bEnableNowLine);
		return this;
	};

	GanttChartContainer.prototype.setEnableVerticalLine = function (bEnableVerticalLine) {
		this.setProperty("enableVerticalLine", bEnableVerticalLine);
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			aGanttCharts[i].setEnableVerticalLine(bEnableVerticalLine);
		}
		this.getAggregation("_toolbar").setEnableVerticalLine(bEnableVerticalLine);
		return this;
	};

	GanttChartContainer.prototype.setEnableAdhocLine = function (bEnableAdhocLine) {
		this.setProperty("enableAdhocLine", bEnableAdhocLine);
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			aGanttCharts[i].setEnableAdhocLine(bEnableAdhocLine);
		}
		this.getAggregation("_toolbar").setEnableAdhocLine(bEnableAdhocLine);
		return this;
	};

	GanttChartContainer.prototype.setEnableTimeScrollSync = function (bEnableTimeScrollSync) {
		this.setProperty("enableTimeScrollSync", bEnableTimeScrollSync);
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			aGanttCharts[i].detachHorizontalScroll(this._onGanttChartHSBScroll, this);
			if (bEnableTimeScrollSync) {
				aGanttCharts[i].attachHorizontalScroll(this._onGanttChartHSBScroll, this);
			}
		}
		this.getAggregation("_toolbar").setEnableTimeScrollSync(bEnableTimeScrollSync);
		return this;
	};
	

	GanttChartContainer.prototype.setContainerLayoutKey = function (sContainerLayoutKey) {
		if (this.getProperty("containerLayoutKey") === sContainerLayoutKey) {
			return this;
		}
		this.setProperty("containerLayoutKey", sContainerLayoutKey);

		this._oToolbar.setSourceId(sContainerLayoutKey);

		if (this.getContainerLayouts()) {
			this.switchOrientation(null, true);
		}
		return this;
	};

	GanttChartContainer.prototype.setLegendContainer = function (oLegendContainer) {
		this.setAggregation("legendContainer", oLegendContainer);
		if (oLegendContainer){
			this._oToolbar.setLegend(new AssociateContainer({
				content: oLegendContainer.getId()
			}));
		}
		return this;
	};

	GanttChartContainer.prototype.addGanttChart = function (oGanttChart, bReadConfig) {
		if (this.getGanttCharts().length < this.getMaxNumOfGanttCharts()) {
			this.addAggregation("ganttCharts", oGanttChart);
			this._insertGanttChart(oGanttChart, bReadConfig);
		}
	};

	GanttChartContainer.prototype.insertGanttChart = function (oGanttChart, iIndex) {
		if (this.getGanttCharts().length < this.getMaxNumOfGanttCharts()) {
			this.insertAggregation("ganttCharts", oGanttChart, iIndex);
			this._insertGanttChart(oGanttChart, false, iIndex);
		}
	};

	GanttChartContainer.prototype.removeGanttChart = function (vGanttChart) {
		this._removeGanttChart(vGanttChart);
		this.removeAggregation("ganttCharts", vGanttChart);
	};

	GanttChartContainer.prototype.removeAllGanttCharts = function () {
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			this._removeGanttChart(aGanttCharts[i]);
		}
		this.removeAllAggregation("ganttCharts");
	};

	GanttChartContainer.prototype._insertGanttChart = function (oGanttChart, bReadConfig, iIndex) {
		jQuery.sap.measure.start("GanttChartContainer _insertGanttChart","GanttPerf:GanttChartContainer _insertGanttChart function");
		if (!oGanttChart) {
			return;
		}

		var bReadSPConfig = true;
		// if initial, apply layout settings for selection panel, otherwise, just keep the same with other contents
		var sSelectionPanelSize = "30%";
		var oFirstGanttChart = this.getGanttCharts()[0];
		if (this._oSplitter.getContentAreas().length > 0) {
			bReadSPConfig = false;
			var oFirstViewSplitter = oFirstGanttChart._oSplitter;
			if (oFirstViewSplitter && oFirstViewSplitter.getContentAreas().length > 0) {
				var oLayoutData = oFirstViewSplitter.getContentAreas()[0].getLayoutData();
				sSelectionPanelSize = oLayoutData ? oLayoutData.getSize() : sSelectionPanelSize;
			}
		}
		oGanttChart.setSelectionPanelSize(sSelectionPanelSize);
		oGanttChart.getAxisTimeStrategy().setZoomLevel(this._oToolbar.getZoomLevel());
		oGanttChart.getAxisTimeStrategy().setZoomLevels(this._oToolbar.getZoomLevels());
		oGanttChart.getAxisTimeStrategy().setTimeLineOption(oFirstGanttChart.getAxisTimeStrategy().getTimeLineOption());
		oGanttChart.getAxisTimeStrategy().setVisibleHorizon(oFirstGanttChart.getAxisTimeStrategy().getVisibleHorizon());

		// wrap association container
		var oAssociateContainer = new AssociateContainer({
			content: oGanttChart.getId(),
			layoutData: new SplitterLayoutData({
				size: "auto"
			})
		});
		if (iIndex !== 0 && !iIndex) {
			this._oSplitter.addContentArea(oAssociateContainer);
		} else {
			this._oSplitter.insertContentArea(oAssociateContainer, iIndex);
		}
		this._adjustSplitterLayoutData(bReadSPConfig, bReadConfig);
		this._oSplitter.triggerResize(true);
		// attach events
		if (this.getEnableTimeScrollSync()) {
			oGanttChart.attachHorizontalScroll(this._onGanttChartHSBScroll, this);
		}

		oGanttChart.attachEvent("_visibleHorizonUpdate", this._onGanttChartVisibleHorizonUpdate, this);
		oGanttChart.attachEvent("_timePeriodZoomStatusChange", this._onGanttChartTimePeriodZoomStatusChange, this);
		oGanttChart.attachEvent("_timePeriodZoomOperation", this._onGanttChartTimePeriodZoomOperation, this);
		oGanttChart.attachSplitterResize(this._onViewSplitterResize, this);
		oGanttChart.attachGanttChartSwitchRequested(this._onGanttChartSwitchRequested, this);
		oGanttChart.attachChartDragEnter(this._onChartDragEnter, this);
		oGanttChart.attachChartDragLeave(this._onChartDragLeave, this);
		oGanttChart.attachShapeDragEnd(this._onShapeDragEnd, this);
		oGanttChart.attachTreeTableToggleEvent(this._onTreeTableToggle, this);
		oGanttChart.attachEvent("_zoomInfoUpdated", this._onZoomInfoUpdated, this);
		jQuery.sap.measure.end("GanttChartContainer _insertGanttChart");
	};

	GanttChartContainer.prototype._onGanttChartVisibleHorizonUpdate = function(oEvent){
		//if the time scroll sync is enabled, the whole sync between multiple views will be handled in _onGanttChartHSBScroll,
		//so, here there is no need to care about it.
		if (!this.getEnableTimeScrollSync()){
			var oParameter = oEvent.getParameters();
			var aGanttCharts = this.getGanttCharts();
			var sSyncFunctionName;

			if (oParameter.reasonCode === "mouseWheelZoom"){
				sSyncFunctionName = "syncMouseWheelZoom";
			}

			if(sSyncFunctionName){
				for (var i = 0; i < aGanttCharts.length; i++){
					if (oEvent.getSource().getId() === aGanttCharts[i].getId()){
						continue;
					}

					aGanttCharts[i][sSyncFunctionName](oParameter.eventData);
				}
			}
		}
	};

	GanttChartContainer.prototype._onGanttChartTimePeriodZoomStatusChange = function(oEvent){
		var oParameter = oEvent.getParameters();
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++){
			if (oEvent.getSource().getId() === aGanttCharts[i].getId()){
				continue;
			}

			aGanttCharts[i].syncTimePeriodZoomStatus(oParameter.isActive);
		}
	};

	GanttChartContainer.prototype._onGanttChartTimePeriodZoomOperation = function (oEvent){
		var bTimeScrollSync = this.getEnableTimeScrollSync();
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++){
			if (oEvent.getSource().getId() === aGanttCharts[i].getId()){
				continue;
			}
			var sOrientation = this._oSplitter.getOrientation();
			aGanttCharts[i].syncTimePeriodZoomOperation(oEvent, bTimeScrollSync, sOrientation);
		}
	};

	/**
	 * check the layout size for gantt charts. This method makes sure a splitter bar has two content areas with
	 * one "auto" layout and one "non-auto" layout.
	 *
	 * @param {boolean} [bReadSPConfig] Appliy configured selection panel ratio.
	 * @param {boolean} [bReadConfig] Apply configured layout ratio to gantt charts.
	 * @private
	 */
	GanttChartContainer.prototype._adjustSplitterLayoutData = function (bReadSPConfig, bReadConfig) {

		//when change hierarchy of the container, apply selection panel size settings for each gantt chart
		if (bReadSPConfig) {
			this._setSelectionPanelLayoutByConfiguration();
		}

		var aContents = this._oSplitter.getContentAreas();
		var that = this;
		if (aContents) {
			aContents.forEach(function(oContent, index){
				if (oContent.getLayoutData()) {
					if (index % 2 == 0) {
						var iLayoutRatio = Math.floor(1 / aContents.length * 100);
						var sLayoutSize = oContent.getLayoutData().getSize();

						if (bReadConfig) {
							sLayoutSize = that.getConfiguredGanttChartLayoutSize(that.getGanttCharts()[index]);
						} else {
							sLayoutSize = iLayoutRatio + "%";
						}

						//make sure the even content area has a layout size that is not "auto"
						if (sLayoutSize == "auto" || (bReadConfig && (sLayoutSize == "100%" || aContents.length == 1))) {
							oContent.getLayoutData().setSize(iLayoutRatio + "%");
						} else {
							oContent.getLayoutData().setSize(sLayoutSize);
						}
					} else {
						if (oContent.getLayoutData().getSize() !== "auto") {
							oContent.getLayoutData().setSize("auto");
						}
					}
				}
			});
		}
	};
	GanttChartContainer.prototype.getConfiguredGanttChartLayoutSize = function (oGanttChart) {
			var oContainerLayoutConfig = this._oContainerLayoutConfigMap[this.getContainerLayoutKey()];
			var sGanttChartSize = "auto";
			if (oContainerLayoutConfig) {
				var aGanttChartLayouts = oContainerLayoutConfig.getGanttChartLayouts();
				if (aGanttChartLayouts) {
					for (var i = 0; i < aGanttChartLayouts.length; i++) {
						if (aGanttChartLayouts[i] && oGanttChart 
								&& aGanttChartLayouts[i].getHierarchyKey() === oGanttChart.getHierarchyKey()) {
							sGanttChartSize = aGanttChartLayouts[i].getGanttChartSize() ? 
									aGanttChartLayouts[i].getGanttChartSize() : sGanttChartSize;
							break;
						}
					}
				}
			}
			return sGanttChartSize;
	};

	GanttChartContainer.prototype.getConfiguredSelectionPanelLayoutSize = function () {
		var sSelectionPanelSize = "30%";
		var oContainerLayoutConfig = this._oContainerLayoutConfigMap[this.getContainerLayoutKey()];
		if (oContainerLayoutConfig) {
			var sConfiguredSelectionPanelSize = oContainerLayoutConfig.getSelectionPanelSize();
			sSelectionPanelSize = (sConfiguredSelectionPanelSize && sConfiguredSelectionPanelSize !== "auto") ? 
					sConfiguredSelectionPanelSize : sSelectionPanelSize;
		}
		return sSelectionPanelSize;
	};

	GanttChartContainer.prototype._setSelectionPanelLayoutByConfiguration = function (bReadConfig) {
		var sSelectionPanelSize = this.getConfiguredSelectionPanelLayoutSize();
		var aGanttCharts = this.getGanttCharts();
		if (aGanttCharts && sSelectionPanelSize) {
			aGanttCharts.forEach(function(oGanttChart, index){
				oGanttChart.setSelectionPanelSize(sSelectionPanelSize);
			});
		}
	};

	GanttChartContainer.prototype._removeGanttChart = function (vGanttChart) {
		var oGanttChart = vGanttChart;
		if ((typeof vGanttChart) === "number") {
			oGanttChart = this.getGanttCharts()[vGanttChart];
		}
		if (oGanttChart) {
			// remove associated container
			this._oSplitter.removeContentArea(oGanttChart._oAC);
			this._adjustSplitterLayoutData();
			this._oSplitter.triggerResize(true);
			// detach events
			oGanttChart.detachHorizontalScroll(this._onGanttChartHSBScroll, this);
			oGanttChart.detachSplitterResize(this._onViewSplitterResize, this);
			oGanttChart.detachGanttChartSwitchRequested(this._onGanttChartSwitchRequested, this);
			oGanttChart.detachChartDragEnter(this._onChartDragEnter, this);
			oGanttChart.detachChartDragLeave(this._onChartDragLeave, this);
			oGanttChart.detachShapeDragEnd(this._onShapeDragEnd, this);
			oGanttChart.detachTreeTableToggleEvent(this._onTreeTableToggle, this);
		}
	};

	GanttChartContainer.prototype.onBeforeRendering = function () {
		this._detachEvents();
		//View switch will initial global toolbar, need to reset the correct setting status to global toolbar
		this._oToolbar.setEnableTimeScrollSync(this.getEnableTimeScrollSync());
		this._oToolbar.setEnableCursorLine(this.getEnableCursorLine());
		this._oToolbar.setEnableNowLine(this.getEnableNowLine());
		this._oToolbar.setEnableVerticalLine(this.getEnableVerticalLine());
		this._oToolbar.setEnableAdhocLine(this.getEnableAdhocLine());

		var aGanttCharts = this.getGanttCharts();
		// Views need to respect the setting in Gantt, especially when changing
		// hierarchy layout, which triggered binding updated
		for (var i = 0; i < aGanttCharts.length; i++) {
			var oGanttChart = aGanttCharts[i];
			oGanttChart.setEnableCursorLine(this.getEnableCursorLine());
			oGanttChart.setEnableNowLine(this.getEnableNowLine());
			oGanttChart.setEnableVerticalLine(this.getEnableVerticalLine());
			oGanttChart.setEnableAdhocLine(this.getEnableAdhocLine());
		}
	};

	GanttChartContainer.prototype._detachEvents = function () {};

	GanttChartContainer.prototype.onAfterRendering = function () {
		this._attachEvents();
	};

	
	GanttChartContainer.prototype._attachEvents = function () {
	};
	
	GanttChartContainer.prototype._detachToolbarEvents = function () {
		this._oToolbar.detachSourceChange(this._onToolbarSourceChange, this);
		this._oToolbar.detachLayoutChange(this._onToolbarLayoutChange, this);
		this._oToolbar.detachExpandChartChange(this._onToolbarExpandChartChange, this);
		this._oToolbar.detachZoomStopChange(this._onToolbarZoomStopChange, this);
		this._oToolbar.detachSettingsChange(this._onToolbarSettingsChange, this);
	};

	GanttChartContainer.prototype._onGanttChartHSBScroll = function(oEvent){
		var oParameter = oEvent.getParameters();
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++){
			if (oEvent.getSource().getId() === aGanttCharts[i].getId()){
				continue;
			}

			aGanttCharts[i].syncVisibleHorizon(new TimeHorizon({
				startTime: oParameter.startTime,
				endTime: oParameter.endTime
			}), oParameter.visibleWidth);
		}
	};

	GanttChartContainer.prototype._onViewSplitterResize = function (oEvent) {
		if (this._oSplitter.getOrientation() === Orientation.Vertical) {
			this._syncSelectionPanelSizeBetweenViews(oEvent);
		}
	};
	
	GanttChartContainer.prototype._onZoomInfoUpdated = function (oEvent) {
		var oSourceGantt = oEvent.getSource();
		var bZoomLevelChanged = oEvent.getParameter("zoomLevelChanged");

		if (bZoomLevelChanged){
			this._oToolbar.updateZoomLevel(oSourceGantt.getAxisTime().getZoomStrategy().getZoomLevel());
		}
	};

	
	GanttChartContainer.prototype._syncSelectionPanelSizeBetweenViews = function (oEvent) {
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			if (oEvent.getSource().getId() === aGanttCharts[i].getId() && aGanttCharts.length > 1) {
				continue;
			}
			var selectionPanelSize = oEvent.getParameter("newSizes")[0];
			var ganttChartSize = oEvent.getParameter("newSizes")[1];
			
			if (selectionPanelSize >= 0 && (selectionPanelSize + ganttChartSize) !== 0) {
				var selectionPanelSizeInPercentage = (100 * selectionPanelSize / (selectionPanelSize + ganttChartSize)).toFixed(0);
				aGanttCharts[i].setSelectionPanelSize(selectionPanelSizeInPercentage + "%", true);
			}
		}
	};

	GanttChartContainer.prototype._onGanttChartSwitchRequested = function (oEvent) {

		oEvent.getSource().notifySourceChange();

		//this._oGanttChart.resetRowStatusMap();
		this.fireGanttChartChangeRequested({
			action: "switchGanttChart",
			hierarchyKey: oEvent.getParameter("hierarchyKey"),
			oldHierarchyKey: oEvent.getParameter("oldHierarchyKey"),
			oldMode: oEvent.getParameter("oldMode"),
			ganttChartIndex: this.getGanttCharts().indexOf(oEvent.getSource())
		});
	};
	
	GanttChartContainer.prototype._onTreeTableToggle = function (oEvent) {
		this.fireTreeTableToggleEvent({
			rowIndex: oEvent.getParameter("rowIndex"),
			rowContext: oEvent.getParameter("rowContext"),
			expanded: oEvent.getParameter("expanded")
		});
	};
	
	GanttChartContainer.prototype._onToolbarLayoutChange = function (oEvent){
		var sEventId = oEvent.getParameter("id");
		var oEventValue = oEvent.getParameter("value");
		switch (sEventId) {
			case "orientation":
				this.switchOrientation(oEventValue);
				break;
			case "add":
				this.fireGanttChartChangeRequested({
					action: "addGanttChart",
					hierarchyKey: oEventValue.hierarchyKey,
					ganttChartIndex: this.getGanttCharts().length
				});
				break;
			case "less":
				this.fireGanttChartChangeRequested({
					action: "lessGanttChart",
					hierarchyKey: oEventValue.hierarchyKey,
					ganttChartIndex: oEventValue.ganttChartIndex
				});
				break;
			default:
				break;
		}
	};

	GanttChartContainer.prototype._onToolbarSourceChange = function (oEvent) {
		var aGanttCharts = this.getGanttCharts();
		for (var i = 0; i < aGanttCharts.length; i++) {
			aGanttCharts[i].notifySourceChange();
		}

		this.setContainerLayoutKey(oEvent.getParameter("id"));
		this.fireGanttChartChangeRequested({
			action: "switchContainerLayout",
			containerLayoutKey: oEvent.getParameter("id")
		});
	};

	GanttChartContainer.prototype._onToolbarExpandChartChange = function (oEvent) {
		var bExpanded = oEvent.getParameter("isExpand"),
			aChartSchemes = oEvent.getParameter("expandedChartSchemes");
		var aGanttCharts = this.getGanttCharts();

		for (var i = 0; i < aGanttCharts.length; i++) {
			aGanttCharts[i].handleExpandChartChange(bExpanded, aChartSchemes, null /**selected Indices*/);
		}

	};

	GanttChartContainer.prototype._onToolbarZoomStopChange = function (oEvent) {
		var aGanttCharts = this.getGanttCharts();

		aGanttCharts.forEach(function (oGanttChart){
			oGanttChart.getAxisTimeStrategy().updateStopInfo({
				index: oEvent.getParameter("index"),
				selectedItem: oEvent.getParameter("selectedItem")
			});
		});
	};
	
	GanttChartContainer.prototype._onChartDragEnter = function (oEvent) {
		//do the following only when the mouse is still down
		var oSourceEvent = oEvent.getParameter("originEvent");
		var oGanttChart = oEvent.getSource();
		if (oSourceEvent.button === 0 && oSourceEvent.buttons !== 0 && this._oDraggingSource !== undefined) {
			oGanttChart.setDraggingData(this._oDraggingSource);
			this._oDraggingSource = undefined;
		}else {
			this._oDraggingSource = undefined;
			oGanttChart.setDraggingData(this._oDraggingSource);
		}
	};

	GanttChartContainer.prototype._onChartDragLeave = function (oEvent) {
		var oParam = oEvent.getParameters();
		if (oParam.draggingSource !== undefined) {
			//drag out of chart
			this._oDraggingSource = oParam.draggingSource;
		}else {
			this._oDraggingSource = undefined;
		}
	};

	GanttChartContainer.prototype._onShapeDragEnd = function (oEvent) {
		this._oDraggingSource = undefined;

		// On multiple Gantt scenario, when dragging a shape from one to another, 
		// Shape selection is wrong on the source Gantt after D&D
		// So explicitly set event status to shapeDragEnd on both Gantt instances fix the issue.
		this.getGanttCharts().forEach(function(oItem){
			var oChart = oItem.getAggregation("_chart");
			// Need ensure on GanttChart instance
			if (oChart && oChart._setEventStatus) {
				oChart._setEventStatus("shapeDragEnd");
			}
		});
	};

	GanttChartContainer.prototype._onToolbarSettingsChange = function(oEvent){
		var oParameters = oEvent.getParameters();
		for (var i = 0; i < oParameters.length; i++) {
			switch (oParameters[i].id)	{
				case sap.gantt.config.SETTING_ITEM_ENABLE_TIME_SCROLL_SYNC_KEY:
					if (this.getEnableTimeScrollSync() !== oParameters[i].value) {
						this.setEnableTimeScrollSync(oParameters[i].value);
					}
					break;
				case sap.gantt.config.SETTING_ITEM_ENABLE_CURSOR_LINE_KEY:
					if (this.getEnableCursorLine() !== oParameters[i].value) {
						this.setEnableCursorLine(oParameters[i].value);
					}
					break;
				case sap.gantt.config.SETTING_ITEM_ENABLE_NOW_LINE_KEY:
					if (this.getEnableNowLine() !== oParameters[i].value) {
						this.setEnableNowLine(oParameters[i].value);
					}
					break;
				case sap.gantt.config.SETTING_ITEM_ENABLE_VERTICAL_LINE_KEY:
					if (this.getEnableVerticalLine() !== oParameters[i].value) {
						this.setEnableVerticalLine(oParameters[i].value);
					}
					break;
				case sap.gantt.config.SETTING_ITEM_ENABLE_ADHOC_LINE_KEY:
					if (this.getEnableAdhocLine() !== oParameters[i].value) {
						this.setEnableAdhocLine(oParameters[i].value);
					}
					break;
				default:
					this.fireCustomSettingChange(oParameters[i]);
			}
		}
	};

	/**
	 * Switches the splitter orientation.
	 * 
	 * @param {string} [vOrientation] Target orientation. If not provided, this method inverts the orientation.
	 * @param {boolean} [bReadConfig] If this value is provided, it overrides the target orientation from the current configuration indicated by property <code>containerLayoutKey</code>.
	 * @returns {object} - <code>this</code>
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.switchOrientation = function (vOrientation, bReadConfig) {
		// init target orientation by switch current orientation
		var sOrientation = this._oSplitter.getOrientation() === Orientation.Horizontal ?
				Orientation.Vertical :
				Orientation.Horizontal;
		// over-write target orientation by input
		sOrientation = vOrientation ? vOrientation : sOrientation;


		if (bReadConfig) { // if bReadConfig, over-write target orientation by config 
			var sContainerLayoutKey = this.getContainerLayoutKey();
			if (this._oContainerLayoutConfigMap[sContainerLayoutKey]) {
				sOrientation = this._oContainerLayoutConfigMap[sContainerLayoutKey].getOrientation();
			}
		}
		this._oSplitter.setOrientation(sOrientation);
		this._adjustSplitterLayoutData(bReadConfig, bReadConfig);
		this._oSplitter.triggerResize(true);
		return this;
	};

	/**
	 * Returns the current effective toolbar scheme key.
	 * 
	 * @returns {string} - Toolbar scheme key.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.getToolbarSchemeKey = function () {
		return this._oToolbar.getToolbarSchemeKey();
	};
	
	/**
	 * Selects in-row shapes and returns a success code.
	 * 
	 * @param {int} [iGanttChart] Index of the Gantt chart containing the shapes that you want to select
	 * @param {array} [aIds] L of the shape IDs that you want to select
	 * @param {boolean} [isExclusive] Whether all other selected shapes are to be deselected
	 * @returns {boolean} - If any selection change is applied, returns true.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.selectShapes = function(iGanttChart, aIds, isExclusive) {
		var aGanttCharts = this.getGanttCharts(),
			bRetVal = false,
			oGanttChart;
		
		if (iGanttChart != undefined && iGanttChart < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChart];
			bRetVal = oGanttChart.selectShapes(aIds, isExclusive);
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				if (oGanttChart.selectShapes(aIds, isExclusive)) {
					bRetVal = true;
				}
			}
		}
		return bRetVal;
	};

	/**
	 * Deselects in-row shapes and returns a success code.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the shapes that you want to deselect
	 * @param {array} [aIds] List of the shapes that you want to deselect
	 * @returns {boolean} - If any selection change is applied, returns true.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.deselectShapes = function(iGanttChartIndex, aIds) {
		var aGanttCharts = this.getGanttCharts(),
			bRetVal = false,
			oGanttChart;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < this.getGanttCharts().length) {
			oGanttChart = this.getGanttCharts()[iGanttChartIndex];
			bRetVal = oGanttChart.deselectShapes(aIds);
		}else {
			for (var iGanttChart in aGanttCharts) {
				oGanttChart = aGanttCharts[iGanttChart];
				if (oGanttChart.deselectShapes(aIds)) {
					bRetVal = true;
				}
			}
		}
		return bRetVal;
	};

	/**
	 * Selects relationships and returns a success code.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the relationships that you want to select
	 * @param {array} [aIds] List of the relationships that you want to select
	 * @param {boolean} [isExclusive] Whether all other selected relationships are to be deselected
	 * @returns {boolean} - If any selection change is applied, returns true.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.selectRelationships = function(iGanttChartIndex, aIds, isExclusive) {
		var aGanttCharts = this.getGanttCharts(),
			bRetVal = false,
			oGanttChart;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			bRetVal = oGanttChart.selectRelationships(aIds, isExclusive);
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				if (oGanttChart.selectRelationships(aIds, isExclusive)) {
					bRetVal = true;
				}
			}
		}
		return bRetVal;
	};

	/**
	 * Deselects relationships and returns a success code.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the relationships that you want to deselect
	 * @param {array} [aIds] List of the relationships that you want to deselect
	 * @returns {boolean} - If any selection change is applied, returns true.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.deselectRelationships = function(iGanttChartIndex, aIds) {
		var aGanttCharts = this.getGanttCharts(),
			bRetVal = false,
			oGanttChart;

		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			bRetVal = oGanttChart.deselectRelationships(aIds);
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				if (oGanttChart.deselectRelationships(aIds)) {
					bRetVal = true;
				}
			}
		}

		return bRetVal;
	};

	/**
	 * Selects rows and returns a success code.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the rows that you want to select
	 * @param {array} [aIds] List of the rows that you want to select
	 * @param {boolean} [isExclusive] Whether all other selected rows are to be deselected
	 * @returns {boolean} - If any selection change is applied, returns true.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.selectRows = function(iGanttChartIndex, aIds, isExclusive) {
		var bRetVal = false,
			aGanttCharts = this.getGanttCharts(),
			oGanttChart;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			bRetVal = oGanttChart.selectRows(aIds, isExclusive);
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				if (oGanttChart.selectRows(aIds, isExclusive)) {
					bRetVal = true;
				}
			}
		}

		return bRetVal;
	};

	/**
	 * Deselects rows and returns a success code.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the rows that you want to deselect
	 * @param {array} [aIds] List of the rows that you want to deselect
	 * @returns {boolean} - If any selection change is applied, returns true.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.deselectRows = function(iGanttChartIndex, aIds) {
		var bRetVal = false,
			aGanttCharts = this.getGanttCharts(),
			oGanttChart;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			bRetVal = oGanttChart.deselectRows(aIds);
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				if (oGanttChart.deselectRows(aIds)) {
					bRetVal = true;
				}
			}
		}
		return bRetVal;
	};
	
	/**
	 * Selects rows and all shapes contained in these rows.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the rows and shapes that you want to select
	 * @param {array} [aIds] Row UIDs
	 * @param {boolean} [bIsExclusive] Whether reset all other selected rows and shapes are to be reset
	 * @returns {boolean} - If any selection change is applied, returns true.
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.selectRowsAndShapes = function(iGanttChartIndex, aIds, bIsExclusive) {
		var bRetVal = false,
			aGanttCharts = this.getGanttCharts(),
			oGanttChart;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			bRetVal = oGanttChart.selectRowsAndShapes(aIds, bIsExclusive);
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				if (oGanttChart.selectRowsAndShapes(aIds, bIsExclusive)) {
					bRetVal = true;
				}
			}
		}
		return bRetVal;
	};

	/**
	 * Gets the selected in-row shapes.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the selected shapes that you want to get
	 * @return {array} Returns all selected shapes in the chart
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.getSelectedShapes = function(iGanttChartIndex) {
		var aRetVal = [],
			aGanttCharts = this.getGanttCharts(),
			oGanttChart,
			oSelectedShapes;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			oSelectedShapes = oGanttChart.getSelectedShapes();
			if (oSelectedShapes !== undefined) {
				aRetVal.push({"ganttChartIndex": iGanttChartIndex, "selectedShapes": oSelectedShapes});
			}
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				oSelectedShapes = oGanttChart.getSelectedShapes();
				if (oSelectedShapes !== undefined) {
					aRetVal.push({"ganttChartIndex": i, "selectedShapes": oSelectedShapes});
				}
			}
		}
		
		return aRetVal;
	};

	/**
	 * Gets the selected rows.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the selected rows that you want to get
	 * @return {array} Returns all selected rows
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.getSelectedRows = function(iGanttChartIndex) {
		var aRetVal = [],
			aGanttCharts = this.getGanttCharts(),
			oGanttChart, aRows;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			aRows = oGanttChart.getSelectedRows();
			if (aRows !== undefined && aRows.length > 0) {
				aRetVal.push({"ganttChartIndex": iGanttChartIndex, "selectedRows": aRows});
			}
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				aRows = oGanttChart.getSelectedRows();
				if (aRows !== undefined) {
					aRetVal.push({"ganttChartIndex": i, "selectedRows": aRows});
				}
			}
		}
		
		return aRetVal;
	};
	
	/**
	 * Gets the selected relationships.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing the selected relationships that you want to get
	 * @return {array} Returns all selected relationships in the chart
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.getSelectedRelationships = function(iGanttChartIndex) {
		var aRetVal = [],
			aGanttCharts = this.getGanttCharts(),
			oGanttChart, aRelationships;

		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			aRelationships = oGanttChart.getSelectedRelationships();
			if (aRelationships !== undefined) {
				aRetVal.push({"ganttChartIndex": iGanttChartIndex, "selectedRelationships": aRelationships});
			}
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				aRelationships = oGanttChart.getSelectedRelationships();
				if (aRelationships !== undefined) {
					aRetVal.push({"ganttChartIndex": i, "selectedRelationships": aRelationships});
				}
			}
		}
		
		return aRetVal;
	};
	
	/**
	 * Gets all selected rows and shapes, including relationships.
	 * 
	 * @param {int} [iGanttChartIndex] Index of the Gantt chart containing that you want to get
	 * @return {object} The returned object contains "rows" for all selected rows, "shapes" for all selected shapes, and "relationships" for all selected relationships
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	GanttChartContainer.prototype.getAllSelections = function(iGanttChartIndex) {
		var aRetVal = [],
			aGanttCharts = this.getGanttCharts(),
			oGanttChart, oSelections;
		
		if (iGanttChartIndex != undefined && iGanttChartIndex < aGanttCharts.length) {
			oGanttChart = aGanttCharts[iGanttChartIndex];
			oSelections = oGanttChart.getAllSelections();
			if (oSelections !== undefined) {
				aRetVal.push({"ganttChartIndex": iGanttChartIndex, "allSelection": oSelections});
			}
		}else {
			for (var i = 0; i < aGanttCharts.length; i++) {
				oGanttChart = aGanttCharts[i];
				oSelections = oGanttChart.getAllSelections();
				if (oSelections !== undefined) {
					aRetVal.push({"ganttChartIndex": i, "allSelection": oSelections});
				}
			}
		}
		
		return aRetVal;
	};

	GanttChartContainer.prototype.exit = function () {
		this._detachEvents();
		this._oToolbar.destroy();
		this._oSplitter.destroy();
	};

	["addCustomToolbarItem", "insertCustomToolbarItem", "removeCustomToolbarItem", "indexOfCustomToolbarItem", "removeAllCustomToolbarItems", "destroyCustomToolbarItems", "getCustomToolbarItems"]
	.forEach(function (sMethod) {
		GanttChartContainer.prototype[sMethod] = function () {
			return this._oToolbar[sMethod].apply(this._oToolbar, arguments);
		};
	});
	return GanttChartContainer;
}, true);
