/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smartchart.SmartChart.
sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/library', 'sap/chart/Chart', 'sap/chart/library', 'sap/chart/data/Dimension', 'sap/chart/data/Measure', 'sap/m/SegmentedButton', 'sap/m/Button', 'sap/m/Text', 'sap/m/FlexItemData', 'sap/ui/core/Item', 'sap/m/OverflowToolbar', 'sap/m/OverflowToolbarButton', 'sap/m/ToolbarSeparator', 'sap/m/ToolbarDesign', 'sap/m/ToolbarSpacer', 'sap/m/VBox', 'sap/m/VBoxRenderer', 'sap/ui/comp/providers/ChartProvider', 'sap/ui/comp/smartfilterbar/FilterProvider', 'sap/ui/comp/smartvariants/SmartVariantManagement', 'sap/ui/model/Filter', 'sap/ui/model/FilterOperator', 'sap/ui/comp/personalization/Util', 'sap/ui/Device', 'sap/ui/comp/odata/ODataModelUtil', 'sap/ui/comp/odata/MetadataAnalyser', "sap/m/P13nFilterItem", "sap/viz/ui5/controls/VizTooltip", "sap/ui/comp/state/UIState", "sap/m/SelectionDetails", "sap/m/SelectionDetailsItem", "sap/m/SelectionDetailsItemLine", "sap/m/Title"
], function(jQuery, library, Chart, ChartLibrary, Dimension, Measure, SegmentedButton, Button, Text, FlexItemData, Item, OverflowToolbar, OverflowToolbarButton, ToolbarSeparator, ToolbarDesign, ToolbarSpacer, VBox, VBoxRenderer, ChartProvider, FilterProvider, SmartVariantManagement, Filter, FilterOperator, PersoUtil, Device, ODataModelUtil, MetadataAnalyser, P13nFilterItem, VizTooltip, UIState, SelectionDetails, SelectionDetailsItem, SelectionDetailsItemLine, Title) {
	"use strict";

	/**
	 * Constructor for a new smartchart/SmartChart.
	 *
	 * @param {string} [sId] ID for the new control that is generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The SmartChart control creates a chart based on OData metadata and the configuration specified. The entitySet property must be specified
	 *        to use the control. This property is used to fetch fields from OData metadata, from which the chart UI will be generated. It can also be
	 *        used to fetch the actual chart data.<br>
	 *        Based on the chartType property, this control will render the corresponding chart.<br>
	 *        <b>Note:</b> Most of the attributes are not dynamic and cannot be changed once the control has been initialized.
	 * @extends sap.m.VBox
	 * @author SAP SE
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartchart.SmartChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartChart = VBox.extend("sap.ui.comp.smartchart.SmartChart", /** @lends sap.ui.comp.smartchart.SmartChart.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * The entity set name from which to fetch data and generate the columns.<br>
				 * <b>Note</b> This is not a dynamic property.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * ID of the corresponding SmartFilter control. If specified, the SmartChart control searches for the SmartFilter control (also in the
				 * closest parent view) and attaches to the relevant events of the SmartFilter control to fetch data, show overlay etc.
				 */
				smartFilterId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that must be ignored in the OData metadata by the SmartChart control.<br>
				 * <b>Note:</b> No validation is done. Please ensure that you do not add spaces or special characters.
				 */
				ignoredFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that must be always requested by the backend system.<br>
				 * This property is mainly meant to be used if there is no PresentationVariant annotation.<br>
				 * If both this property and the PresentationVariant annotation exist, the select request sent to the backend would be a combination
				 * of both.<br>
				 * <b>Note:</b> No validation is done. Please ensure that you do not add spaces or special characters. Also, setting this property
				 * during runtime, will delete the current drill-stack and lead to a loss of the drill history.
				 */
				requestAtLeastFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that is not shown in the personalization dialog.<br>
				 * <b>Note:</b> No validation is done. Please ensure that you do not add spaces or special characters.
				 */
				ignoreFromPersonalisation: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the type of chart to be created by the SmartChart control.
				 */
				chartType: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that is not shown in the list of available chart types.<br>
				 * <b>Note:</b> No validation is done. Please ensure that you do not add spaces or special characters.
				 */
				ignoredChartTypes: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code>, variants are used. As a prerequisite, you need to specify the persistencyKey property.
				 */
				useVariantManagement: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If set to <code>true</code>, personalized chart settings are defined. If you want to persist the chart personalization, you need
				 * to specify the persistencyKey property.
				 */
				useChartPersonalisation: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies header text that is shown in the chart.
				 */
				header: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Key used to access personalization data.
				 */
				persistencyKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Retrieves or applies the current variant.
				 */
				currentVariantId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code>, this enables automatic binding of the chart using the chartBindingPath (if it exists) or entitySet
				 * property. This happens right after the <code>initialise</code> event has been fired.
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Specifies the path that is used during the binding of the chart. If not specified, the entitySet property is used instead. (used
				 * only if binding is established internally/automatically - See enableAutoBinding)
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Controls the visibility of the Drill Up and Drill Down buttons.
				 */
				showDrillButtons: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Controls the visibility of the Zoom In and Zoom Out buttons.
				 *
				 * @since 1.36
				 */
				showZoomButtons: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Controls the visibility of the Navigation button
				 *
				 * @since 1.36
				 */
				showSemanticNavigationButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				// false
				},
				/**
				 * Controls the visibility of the Variant Management.
				 *
				 * @since 1.38
				 */
				showVariantManagement: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Controls the visibility of the chart print button.
				 *
				 * @since 1.39
				 */
				/*
				 * showPrintButton: { type: "boolean", group: "Misc", defaultValue: true // false },
				 */
				/**
				 * Controls the visibility of the chart download button.
				 *
				 * @since 1.39
				 */
				showDownloadButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},
				/**
				 * Controls the visibility of the Details button. If set to <code>true</code>, the datapoint tooltip will be disabled as the
				 * information of selected datapoints will be found in the details popover. This will also set the drill-down button to invisible.
				 *
				 * @since 1.38
				 */
				showDetailsButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Controls the visibility of the Breadcrumbs control for drilling up within the visible dimensions. If set to <code>true</code>,
				 * the toolbar header will be replaced by the Breadcrumbs control. This will also set the drill-up button to invisible.
				 *
				 * @since 1.38
				 */
				showDrillBreadcrumbs: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},
				/**
				 * Controls the visibility of the chart tooltip. If set to <code>true </code>, an instance of sap.viz.ui5.controls.VizTooltip will
				 * be created and shown when hovering over a data point.
				 *
				 * @since 1.38
				 */
				showChartTooltip: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				// false
				},
				/**
				 * Controls the visibility of the Navigation button
				 *
				 * @since 1.36
				 */
				showLegendButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Set chart's legend properties.
				 *
				 * @since 1.36
				 */
				legendVisible: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Chart selection mode. Supported values are {@link sap.chart.SelectionMode.Single} or {@link sap.chart.SelectionMode.Multi}, case
				 * insensitive, always return in upper case. Unsupported values will be ignored.
				 *
				 * @since 1.36
				 */
				selectionMode: {
					type: "sap.chart.SelectionMode",
					group: "Misc",
					defaultValue: sap.chart.SelectionMode.Multi
				},

				/**
				 * Controls the visibility of the FullScreen button.
				 *
				 * @since 1.36
				 */
				showFullScreenButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Controls the usage either of an instance of sap.viz.ui5.controls.VizTooltip or sap.viz.ui5.controls.Popover. If set to
				 * <code>true</code>, the tooltip will be displayed, the popover otherwise.
				 *
				 * @since 1.36
				 */
				useTooltip: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Controls the visualization for chart type selection. If set to <code>true</code>, the list of available chart types will be
				 * displayed. If set to <code>false</code> and there are three or fewer available chart types, the chart types will be displayed as
				 * separate buttons in the toolbar. If there are more than three chart types, a list will be shown.
				 *
				 * @deprecated As of version 1.48.0. Setting the property to <code>false</code> will have no effect on the visualization of chart
				 *             type selection anymore. <code>SmartChart</code> will always show a list of chart types, regardless of how many are
				 *             available.
				 * @since 1.38
				 */
				useListForChartTypeSelection: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Controls the visibility of the chart type selection button.
				 *
				 * @since 1.48
				 */
				showChartTypeSelectionButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},
				/**
				 * Defines the custom text that will be displayed in case no data is found for the current binding.
				 *
				 * @since 1.46
				 */
				noData: {
					type: "string",
					group: "Misc",
					defaultValue: ""
				}
			},
			associations: {
				/**
				 * Identifies the SmartVariant control which should be used for the personalization. Will be ignored if the advanced mode is set.
				 *
				 * @since 1.38
				 */
				smartVariant: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			aggregations: {

				/**
				 * A custom toolbar that can be specified by the user to define their own buttons, icons, etc. If this is added, the SmartChart
				 * control does not create its own toolbar, but uses this one instead. However, if default actions, such as showSemanticNavigation,
				 * showFullScreenButton etc. are set, these actions are added at the left-hand side of the toolbar.
				 */
				toolbar: {
					type: "sap.m.Toolbar",
					multiple: false
				},

				/**
				 * The Semantic Object Controller allows the user to specify and overwrite functionality for semantic object navigation.
				 *
				 * @since 1.36
				 */
				semanticObjectController: {
					type: "sap.ui.comp.navpopover.SemanticObjectController",
					multiple: false
				},
				/**
				 * Actions on item level which can be specified for the selection details popover.
				 *
				 * @experimental Since 1.48 since 1.48
				 */
				selectionDetailsItemActions: {
					type: "sap.ui.core.Item",
					multiple: true
				},
				/**
				 * Actions on footer level which can be specified for the selection details popover.
				 *
				 * @experimental Since 1.48 since 1.48
				 */
				selectionDetailsActions: {
					type: "sap.ui.core.Item",
					multiple: true
				},
				/**
				 * Actions on group level which can be specified for the selection details popover.
				 *
				 * @experimental Since 1.48 since 1.48
				 */
				selectionDetailsActionGroups: {
					type: "sap.ui.core.Item",
					multiple: true
				}
			},
			events: {
				/**
				 * This event is fired once the control has been initialized.
				 */
				initialise: {},

				/**
				 * This event is fired right before the <code>SmartChart</code> control triggers the binding / rebinding of the inner chart.<br>
				 * <b>Note:</b> In certain cases the inner chart triggers a rebinding by itself. In these cases, the event is not fired.
				 *
				 * @name sap.ui.comp.smartchart.SmartChart#beforeRebindChart
				 * @event
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {JSON} oControlEvent.getParameters.bindingParams The bindingParams object contains filters, sorters, and other
				 *        binding-related information for the chart
				 * @param {boolean} oControlEvent.getParameters.bindingParams.preventChartBind If set to <code>true</code> by the listener, binding
				 *        is prevented
				 * @param {sap.ui.model.Filter[]} oControlEvent.getParameters.bindingParams.filters The combined filter array containing a set of
				 *        sap.ui.model.Filter instances of the SmartChart and SmartFilter controls; can be modified by users to influence filtering
				 * @param {sap.ui.model.Sorter[]} oControlEvent.getParameters.bindingParams.sorter An array containing a set of sap.ui.model.Sorter
				 *        instances of the SmartChart control (personalization); can be modified by users to influence sorting
				 * @param {Number} oControlEvent.getParameters.bindingParams.length The maximal number of items that is displayed for the
				 *        <code>SmartChart</code> control
				 * @public
				 */
				beforeRebindChart: {

				},

				/**
				 * This event is fired when data is received after binding. This event is fired if the binding for the chart is done by the SmartChart
				 * control itself.
				 */
				dataReceived: {},

				/**
				 * This event is fired after the variant management in the SmartChart control has been initialized.
				 */
				afterVariantInitialise: {},

				/**
				 * This event is fired after a variant has been saved. This event can be used to retrieve the ID of the saved variant.
				 */
				afterVariantSave: {
					parameters: {
						/**
						 * ID of the currently selected variant
						 */
						currentVariantId: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired after a variant has been applied.
				 */
				afterVariantApply: {
					parameters: {
						/**
						 * ID of the currently selected variant
						 */
						currentVariantId: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired right before the overlay is shown.
				 *
				 * @event
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {object} oControlEvent.getParameters.overlay Overlay object that contains information related to the overlay of the chart
				 * @param {boolean} oControlEvent.getParameters.overlay.show If set to code>false</code> by the listener, overlay is not shown
				 * @public
				 */
				showOverlay: {},

				/**
				 * This event is fired right after the full screen mode of the SmartChart control has been changed.
				 *
				 * @since 1.46
				 */
				fullScreenToggled: {
					parameters: {
						/**
						 * If <code>true</code> the control is in full screen mode
						 */
						fullScreen: {
							type: "boolean"
						}
					}
				},
				/**
				 * This event is fired when any action in the selection details popover is pressed.
				 *
				 * @experimental Since 1.48
				 * @since 1.48
				 */
				selectionDetailsActionPress: {
					parameters: {

						/**
						 * The action that has to be processed once the action has been pressed
						 */
						action: {
							type: "sap.ui.core.Item"
						},
						/**
						 * If the action is pressed on one of the {@link sap.m.SelectionDetailsItem items}, the parameter contains the
						 * {@link sap.ui.model.Context context} of the pressed {@link sap.m.SelectionDetailsItem item}. If a custom action or action
						 * group of the SelectionDetails popover is pressed, this parameter contains all {@link sap.ui.model.Context contexts} of the
						 * {@link sap.m.SelectionDetailsItem items}.
						 */
						itemContexts: {
							type: "sap.ui.model.Context"
						},
						/**
						 * The action level of action buttons. The available levels are Item, List and Group
						 */
						level: {
							type: "sap.m.SelectionDetailsActionLevel"
						}
					}
				},
				/**
				 * This event is fired when <code>SmartChart</code> control data changes, due to changes in the personalization dialog or drill
				 * operations.<br>
				 * The data can be changed via sorters, filters or drill-ups/drill-downs.
				 */
				chartDataChanged: {
					parameters: {
						/**
						 * Object which contains a boolean flag for dimeasure, filter, sort. If set to <code>true</code>, it has been changed.
						 */
						changeTypes: {
							type: "object"
						}
					}

				}
			}
		},

		renderer: VBoxRenderer.render
	});

	SmartChart.prototype.init = function() {
		sap.m.FlexBox.prototype.init.call(this);
		this.addStyleClass("sapUiCompSmartChart");
		this.setFitContainer(true);
		this._bUpdateToolbar = true;
		this._oChartTypeModel = null;

		this.setHeight("100%");

		var oModel = new sap.ui.model.json.JSONModel({
			items: []
		});
		this.setModel(oModel, "$smartChartTypes");

		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");

		this._processResizeHandler(true);

		if (!this.getLayoutData()) {
			this.setLayoutData(new sap.m.FlexItemData({
				growFactor: 1,
				baseSize: "50em"
			}));
		}
	};

	SmartChart.prototype._getVariantManagementControl = function(oSmartVariantId) {
		var oSmartVariantControl = null;
		if (oSmartVariantId) {
			if (typeof oSmartVariantId === 'string') {
				oSmartVariantControl = sap.ui.getCore().byId(oSmartVariantId);
			} else {
				oSmartVariantControl = oSmartVariantId;
			}

			if (oSmartVariantControl) {
				if (!(oSmartVariantControl instanceof SmartVariantManagement)) {
					jQuery.sap.log.error("Control with the id=" + typeof oSmartVariantId.getId == "function" ? oSmartVariantId.getId() : oSmartVariantId + " not of expected type");
					return null;
				}
			}
		}

		return oSmartVariantControl;
	};

	/**
	 * instantiates the SmartVariantManagementControl
	 *
	 * @private
	 */
	SmartChart.prototype._createVariantManagementControl = function() {

		// Do not create variant management when it is not needed!
		if (this._oVariantManagement || (!this.getUseVariantManagement() && !this.getUseChartPersonalisation()) || !this.getPersistencyKey()) {
			return;
		}

		// always create VariantManagementControl, in case it is not used, it will take care of persisting the personalisation
		// without visualization
		var oPersInfo = new sap.ui.comp.smartvariants.PersonalizableInfo({
			type: "chart",
			keyName: "persistencyKey",
			dataSource: this.getEntitySet()
		});

		oPersInfo.setControl(this);

		var sSmartVariantId = this.getSmartVariant();
		if (sSmartVariantId) {
			this._oVariantManagement = this._getVariantManagementControl(sSmartVariantId);
		} else if (this._oSmartFilter && this._oSmartFilter.data("pageVariantPersistencyKey")) {
			sSmartVariantId = this._oSmartFilter.getSmartVariant();
			if (sSmartVariantId) {
				this._oVariantManagement = this._getVariantManagementControl(sSmartVariantId);
			}
		} else {
			this._oVariantManagement = new SmartVariantManagement(this.getId() + "-variant", {
				showShare: true
			});
		}

		if (this._oVariantManagement) {

			if (!this._oVariantManagement.isPageVariant()) {
				this._oVariantManagement.setVisible(this.getShowVariantManagement());
			}

			this._oVariantManagement.addPersonalizableControl(oPersInfo);

			// Current variant could have been set already (before initialise) by the SmartVariant, in case of GLO/Industry specific variant
			// handling
			this._oVariantManagement.attachSave(this._variantSaved, this);
			this._oVariantManagement.attachAfterSave(this._variantAfterSave, this);

			this._oVariantManagement.initialise(this._variantInitialised, this);
		}
	};

	/**
	 * event handler for variantmanagement save event
	 *
	 * @private
	 */
	SmartChart.prototype._variantInitialised = function() {
		if (!this._oCurrentVariant) {
			this._oCurrentVariant = "STANDARD";
		}
		this.fireAfterVariantInitialise();
		/*
		 * If VariantManagement is disabled (no LRep connectivity) trigger the binding
		 */
		if (this._oVariantManagement && !this._oVariantManagement.getEnabled()) {
			this._checkAndTriggerBinding();
		}
	};

	SmartChart.prototype._variantSaved = function() {
		if (this._oPersController) {
			this._oPersController.setPersonalizationData(this._oCurrentVariant);
		}
	};

	SmartChart.prototype._variantAfterSave = function() {
		this.fireAfterVariantSave({
			currentVariantId: this.getCurrentVariantId()
		});
	};

	SmartChart.prototype.setUseChartPersonalisation = function(bUseChartPersonalisation) {
		this.setProperty("useChartPersonalisation", bUseChartPersonalisation, true);
		this._bUpdateToolbar = true;
	};

	SmartChart.prototype.setUseTooltip = function(bUseTooltip) {
		this.setProperty("useTooltip", bUseTooltip, true);
		this._createTooltipOrPopover();
	};

	SmartChart.prototype._createTooltipOrPopover = function() {
		// only show tooltip, when enabled via showChartTooltip
		if (this.getUseTooltip() && this.getShowChartTooltip()) {
			// this._createTooltip();
			this._toggleChartTooltipVisibility(true);
		} else {
			this._createPopover();
		}
	};

	SmartChart.prototype._createPopover = function() {
		if (this._oChart) {
			if (!this._oPopover) {
				// assign Popover to chart
				jQuery.sap.require("sap.viz.ui5.controls.Popover");
				this._oPopover = new sap.viz.ui5.controls.Popover({});
			}
			// Make this dynamic for the setter call
			this._oPopover.connect(this._oChart.getVizUid());
		}
	};

	SmartChart.prototype._destroyPopover = function() {
		if (this._oPopover) {
			this._oPopover.destroy();
			this._oPopover = null;
		}
	};

	SmartChart.prototype.setUseVariantManagement = function(bUseVariantManagement) {
		this.setProperty("useVariantManagement", bUseVariantManagement, true);
		if (this._oPersController) {
			this._oPersController.setResetToInitialTableState(!bUseVariantManagement);
		}
		this._bUpdateToolbar = true;
	};

	SmartChart.prototype.setToolbar = function(oToolbar) {
		if (this._oToolbar) {
			this.removeItem(this._oToolbar);
		}
		this._oToolbar = oToolbar;
		this._bUpdateToolbar = true;
	};

	SmartChart.prototype.getToolbar = function() {
		return this._oToolbar;
	};

	SmartChart.prototype.setHeader = function(sText) {
		this.setProperty("header", sText, true);
		this._refreshHeaderText();
	};

	/**
	 * sets the header text
	 *
	 * @private
	 */
	SmartChart.prototype._refreshHeaderText = function() {
		if (!this._headerText) {
			this._bUpdateToolbar = true;
			return;
		}
		var sText = this.getHeader();
		this._headerText.setText(sText);
	};

	/**
	 * creates the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._createToolbar = function() {
		// If no toolbar exists --> create one
		if (!this._oToolbar) {
			this._oToolbar = new OverflowToolbar({
				design: ToolbarDesign.Transparent,
				height: "auto"
			});
			this._oToolbar.addStyleClass("sapUiCompSmartChartToolbar");
		}
		this._oToolbar.setLayoutData(new sap.m.FlexItemData({
			shrinkFactor: 0
		}));
		this.insertItem(this._oToolbar, 0);
	};

	/**
	 * creates the toolbar content
	 *
	 * @private
	 */
	SmartChart.prototype._createToolbarContent = function() {
		// insert the items in the custom toolbar in reverse order => insert always at position 0
		this._addVariantManagementToToolbar();
		this._addSeparatorToToolbar();
		this._addHeaderToToolbar();

		// this._addDrillBreadcrumbs();

		// add spacer to toolbar
		this._addSpacerToToolbar();

		this._addSemanticNavigationButton();

		this._addDetailsButton();

		// Add Drill buttons
		this._addDrillUpDownButtons();

		// Add Legend button
		this._addLegendButton();

		// Add Zoom buttons
		this._addZoomInOutButtons();

		// this._addPrintButton();

		this._addDownloadButton();

		// Add Personalisation Icon
		this._addPersonalisationToToolbar();

		// Add Fullscreen Button
		this._addFullScreenButton();

		// Add Chart Type Button
		this._addChartTypeToToolbar();

		// Seems like toolbar only contains spacer and is actually not needed - remove it
		if (this._oToolbar && (this._oToolbar.getContent().length === 0 || (this._oToolbar.getContent().length === 1 && this._oToolbar.getContent()[0] instanceof ToolbarSpacer))) {
			this.removeItem(this._oToolbar);
			this._oToolbar.destroy();
			this._oToolbar = null;
		}
	};

	SmartChart.prototype.setShowVariantManagement = function(bFlag) {
		this.setProperty("showVariantManagement", bFlag);

		if (this._oVariantManagement && this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.setVisible(bFlag);
		}
	};

	SmartChart.prototype.setShowDetailsButton = function(bFlag) {

		this.setProperty("showDetailsButton", bFlag);

		// Handle visibility of details button and chart tooltips
		if (this._oSelectionDetails) {
			this._oSelectionDetails.setVisible(bFlag);
			// Btn only exists together with selectionDetails control
			if (this._oDrillDownTextButton) {
				this._oDrillDownTextButton.setVisible(bFlag);
			}
			this._setBehaviorTypeForDataSelection();
		}
		// Handle visibility of drill up button
		if (this._oDrillDownButton) {
			this._oDrillDownButton.setVisible(!bFlag);
		}
	};

	SmartChart.prototype.setShowChartTypeSelectionButton = function(bFlag) {
		this.setProperty("showChartTypeSelectionButton", bFlag);

		if (this._oChartTypeButton) {
			this._oChartTypeButton.setVisible(bFlag);
		}
	};

	SmartChart.prototype.setShowDownloadButton = function(bFlag) {
		this.setProperty("showDownloadButton", bFlag);
		// Handle the visibility of the download button
		if (this._oDownloadButton) {
			this._oDownloadButton.setVisible(bFlag);
		}

	};

	SmartChart.prototype.setShowDrillBreadcrumbs = function(bFlag) {

		this.setProperty("showDrillBreadcrumbs", bFlag);

		// Handle visibility of breadcrumbs
		if (this._oDrillBreadcrumbs) {
			this._oDrillBreadcrumbs.setVisible(bFlag);
		}
		// Handle visibility of drill up button
		if (this._oDrillUpButton) {
			this._oDrillUpButton.setVisible(!bFlag);
		}
	};

	SmartChart.prototype.setShowChartTooltip = function(bFlag) {
		this.setProperty("showChartTooltip", bFlag);
		this._toggleChartTooltipVisibility(bFlag);
	};

	SmartChart.prototype._setBehaviorTypeForDataSelection = function() {
		// Currently this property can only be set once during init time and is not dynamic.
		if (this.getShowDetailsButton()) {
			// If we use details button, noHoverBehavior has to be set in order to enable details event
			this._oChart.setVizProperties({
				"interaction": {
					"behaviorType": "noHoverBehavior"
				}
			});
		} else {
			// If we don't use details button, behaviorType has to be deleted again
			if (this._oChart.getVizProperties().interaction.behaviorType) {
				// Get current interaction vizProperties and delete behaviorType
				var oInteractionProps = this._oChart.getVizProperties().interaction;
				delete oInteractionProps.behaviorType;
				// Set modified interaction props on inner chart
				this._oChart.setVizProperties({
					"interaction": oInteractionProps
				});
			}
		}
	};

	/**
	 * adds breadcrumbs to the toolbar for drilling up in the selected dimensions
	 *
	 * @private
	 */
	SmartChart.prototype._addDrillBreadcrumbs = function() {

		if (!this._oDrillBreadcrumbs) {
			jQuery.sap.require("sap.m.Breadcrumbs");
			jQuery.sap.require("sap.m.Link");

			this._oDrillBreadcrumbs = new sap.m.Breadcrumbs(this.getId() + "-drillBreadcrumbs", {
				visible: this.getShowDrillBreadcrumbs()
			}).addStyleClass("sapUiCompSmartChartBreadcrumbs");

			this.insertItem(this._oDrillBreadcrumbs, 1);
			this._updateDrillBreadcrumbs();

			// Attach to the drill events in order to update the breadcrumbs
			this._oChart.attachDrilledUp(function(oEvent) {
				this._updateDrillBreadcrumbs();
				// Drill-Stack filters are not part of filter panel any more
				// this._updatePersFilters();
			}.bind(this));

			this._oChart.attachDrilledDown(function(oEvent) {
				this._updateDrillBreadcrumbs();
				// Drill-Stack filters are not part of filter panel any more
				// this._updatePersFilters();
			}.bind(this));
		}
	};
	/**
	 * updates selection filters for usage within filter panel of settings dialog
	 *
	 * @private
	 */
	/*
	 * SmartChart.prototype._updatePersFilters = function() { if (this._oPersController) { // Set filters extracted from drill-stack on ChartWrapper
	 * this._oPersController.getTable().setExternalFilters(this._extractDrillStackFilters()); } };
	 */
	/**
	 * extracts all selection filters from current drill-stack and processes them for personalization controller.
	 *
	 * @returns {Array} An array of P13nFilterItems
	 * @private
	 */
	/*
	 * SmartChart.prototype._extractDrillStackFilters = function() { var aDrillStack = this.getChart().getDrillStack(); var aStackFilters = []; var
	 * fTakeFilters = function(oFilter) { if (!oFilter) { return; } if (oFilter && oFilter.sPath && oFilter.sOperator) { var oFilterItem = new
	 * P13nFilterItem({ operation: oFilter.sOperator, value1: oFilter.oValue1, value2: oFilter.oValue2, columnKey: oFilter.sPath });
	 * aStackFilters.push(oFilterItem); } // check for nested filters if (oFilter.aFilters) { oFilter.aFilters.forEach(function(oFilter_) {
	 * fTakeFilters(oFilter_); }); } }; // Create a sap.m.P13nFilterItem for each filter inside the drillstack;
	 * aDrillStack.forEach(function(oStackEntry, index, aDrillStack) { fTakeFilters(oStackEntry.filter); }); return aStackFilters; };
	 */

	/**
	 * returns all selection filters of current drill-stack
	 *
	 * @returns {sap.ui.model.Filter[]} An array of drill-stack filters
	 */
	SmartChart.prototype.getDrillStackFilters = function() {

		var aDrillStack = this.getChart().getDrillStack();
		var aStackFilters = [];

		var fTakeFilters = function(oFilter) {
			if (!oFilter) {
				return;
			}
			if (oFilter && oFilter.sPath && oFilter.sOperator) {

				aStackFilters.push(oFilter);
			}
			// check for nested filters
			if (oFilter.aFilters) {
				oFilter.aFilters.forEach(function(oFilter_) {
					fTakeFilters(oFilter_);
				});
			}
		};

		aDrillStack.forEach(function(oStackEntry) {
			fTakeFilters(oStackEntry.filter);
		});

		return aStackFilters;
	};
	/**
	 * returns all currently applied dimensions which are part of the chart's stack.
	 *
	 * @returns {String[]} array of drill-stack dimensions
	 * @private
	 */
	SmartChart.prototype._getDrillStackDimensions = function() {
		var aDrillStack = this.getChart().getDrillStack();
		var aStackDimensions = [];

		aDrillStack.forEach(function(oStackEntry) {
			// loop over nested dimension arrays
			oStackEntry.dimension.forEach(function(sDimension) {
				if (sDimension != null && sDimension != "" && aStackDimensions.indexOf(sDimension) == -1) {
					aStackDimensions.push(sDimension);
				}
			});
		});

		return aStackDimensions;
	};
	/**
	 * updates the breadcrumbs control when drilled up or down within the dimensions
	 *
	 * @private
	 */
	SmartChart.prototype._updateDrillBreadcrumbs = function() {

		// Get access to drill history
		var aVisibleDimensionsRev = this._oChart.getDrillStack();

		// Clear aggregation before we rebuild it
		if (this._oDrillBreadcrumbs && this._oDrillBreadcrumbs.getLinks()) {
			this._oDrillBreadcrumbs.removeAllLinks();
		}
		// When chart is bound to non-aggregated entity there is no drill-stack existing
		if (aVisibleDimensionsRev) {
			// Reverse array to display right order of crumbs
			aVisibleDimensionsRev.reverse();
			aVisibleDimensionsRev.forEach(function(dim, index, array) {

				// Check if stack entry has dimension names and if a dimension is existing for this name
				if (dim.dimension.length > 0 && typeof this._oChart.getDimensionByName(dim.dimension[dim.dimension.length - 1]) != 'undefined') {
					//show breadcrumbs
					if (this.getShowDrillBreadcrumbs()) {
						this._oDrillBreadcrumbs.setVisible(true);
					}
					// use the last entry of each drill-stack entry to built up the drill-path
					var sDimLabel = this._oChart.getDimensionByName(dim.dimension[dim.dimension.length - 1]).getLabel();

					// Set current drill position in breadcrumb control
					if (index == 0) {

						this._oDrillBreadcrumbs.setCurrentLocationText(sDimLabel);
					} else {

						var oCrumb = new sap.m.Link({
							text: sDimLabel,
							press: function(oEvent) {
								var iLinkIndex = this._oDrillBreadcrumbs.indexOfLink(oEvent.getSource());
								this._oChart.drillUp(iLinkIndex + 1); // plus the position before this link regarding the visualization in breadcrumbs
								// get rid of entries in the details model
								this._oChart.fireDeselectData(oEvent);
								// don't forget to update the bread crumbs control itself
								this._updateDrillBreadcrumbs();

							}.bind(this)
						});

						this._oDrillBreadcrumbs.insertLink(oCrumb);
					}
				} else {
					//Show no text on breadcrumb if stack contains only one entry with no dimension at all (all dims are shown)
					if (index == 0) {
						//hide breadcrumbs
						this._oDrillBreadcrumbs.setVisible(false);
					}
				}
			}.bind(this));
		}

	};

	/**
	 * adds the details button to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addDetailsButton = function() {

		this._oSelectionDetails = new SelectionDetails(this.getId() + "-selectionDetails", {
			visible: this.getShowDetailsButton()
		});
		this._oSelectionDetails.registerSelectionDetailsItemFactory([

		], function(aDisplayData, aData, oContext, oData) {
			var aLines = [];
			for (var i = 0; i < aDisplayData.length; i++) {
				aLines.push(new SelectionDetailsItemLine({
					label: aDisplayData[i].label,
					value: aDisplayData[i].value,
					unit: aDisplayData[i].unit
				}));
			}
			return new SelectionDetailsItem({
				enableNav: (function() {
					// Check if we have semantic objects before enabling navigation
					if (this._determineSemanticObjectsforDetailsPopover(aData, oContext).length > 0) {
						return true;
					} else {
						return false;
					}
				}.bind(this)()),
				lines: aLines
			}).setBindingContext(oContext);
		}.bind(this));

		// Attach to navigation event of selectionDetails
		// for semantic object navigation
		this._oSelectionDetails.attachNavigate(function(oEvent) {
			// Destroy content on navBack of selectionDetails
			// This either is the semanticNavContainer or the semanticNavItemList
			if (oEvent.getParameter("direction") === "back") {
				oEvent.getParameter("content").destroy();
			} else {
				// Forward navigation to semantic objects
				this._navigateToSemanticObjectDetails(oEvent);
			}

		}.bind(this));

		this._oSelectionDetails.attachActionPress(function(oEvent) {
			// extract binding information of each item
			var aItemContexts = [];
			oEvent.getParameter("items").forEach(function(oItem) {
				aItemContexts.push(oItem.getBindingContext());
			});
			// Re-arrange event object and navigate to outer press handler
			this.fireSelectionDetailsActionPress({
				id: oEvent.getParameter("id"),
				action: oEvent.getParameter("action"),
				itemContexts: aItemContexts,
				level: oEvent.getParameter("level")
			});
		}.bind(this));

		// Attach to sap.chart.Charts private _selectionDetails event
		this._oSelectionDetails.attachSelectionHandler("_selectionDetails", this._oChart);

		// Update of selectionDetails action aggregations
		this._oSelectionDetails.attachBeforeOpen(function(oEvent) {

			// Update item actions
			var aSelectionItems = this._oSelectionDetails.getItems();

			aSelectionItems.forEach(function(oItem) {
				var oActionClones = this._getDetailsActionsClones();
				oActionClones.selectionDetailsItemActions.forEach(function(oAction) {
					oItem.addAction(oAction);
				});
			}.bind(this));

			// Update list actions
			var oActionClones = this._getDetailsActionsClones().selectionDetailsActions;
			this._oSelectionDetails.removeAllActions();
			oActionClones.forEach(function(oAction) {
				this._oSelectionDetails.addAction(oAction);
			}.bind(this));

			// Update group actions
			var oGroupActionClones = this._getDetailsActionsClones().selectionDetailsActionGroups;
			this._oSelectionDetails.removeAllActionGroups();
			oGroupActionClones.forEach(function(oActionGroup) {
				this._oSelectionDetails.addActionGroup(oActionGroup);
			}.bind(this));

		}.bind(this));

		this._oSelectionDetails.attachBeforeClose(function(oEvent) {
			// Needs to be destroyed to re-navigate later.
			if (this._oNavigationContainer) {
				this._oNavigationContainer.destroy();
			}

		}.bind(this));

		// Add to SmartChart toolbar
		this._oToolbar.addContent(this._oSelectionDetails);

		// Add drill down text button as well
		this._addDrillDownTextButton();
	};
	/**
	 * Creates clones of each outer aggregation for selectionDetails control delegation of actions.
	 *
	 * @returns {{selectionDetailsItemActions: Array, selectionDetailsActions: Array, selectionDetailsActionGroups: Array}}
	 * @private
	 */
	SmartChart.prototype._getDetailsActionsClones = function() {

		var oDetailsActions = {
			selectionDetailsItemActions: [],
			selectionDetailsActions: [],
			selectionDetailsActionGroups: []
		};

		// Clone itemActions
		this.getSelectionDetailsItemActions().forEach(function(oItem) {
			oDetailsActions.selectionDetailsItemActions.push(oItem.clone());
		});

		// Clone actions
		this.getSelectionDetailsActions().forEach(function(oItem) {
			oDetailsActions.selectionDetailsActions.push(oItem.clone());
		});

		// Clone itemActions
		this.getSelectionDetailsActionGroups().forEach(function(oItem) {
			oDetailsActions.selectionDetailsActionGroups.push(oItem.clone());
		});

		return oDetailsActions;
	};
	/**
	 * adds a print button to the toolbar
	 */
	/*
	 * SmartChart.prototype._addPrintButton = function() { if (!this._oPrintButton && this.getShowPrintButton()) { this._oPrintButton = new
	 * Button(this.getId() + "-btnPrint", { type: "Transparent", tooltip: "Print Chart", icon: "sap-icon://print", layoutData: new
	 * sap.m.OverflowToolbarLayoutData({ priority: sap.m.OverflowToolbarPriority.NeverOverflow }), enabled: true, press: function(oEvent) {
	 * this._printChart(oEvent); }.bind(this) }); this._oToolbar.addContent(this._oPrintButton); } };
	 */

	/**
	 * adds a download button to the toolbar
	 */
	SmartChart.prototype._addDownloadButton = function() {
		if (!this._oDownloadButton) {
			this._oDownloadButton = new OverflowToolbarButton(this.getId() + "btnDownload", {
				type: "Transparent",
				text: this._oRb.getText("CHART_DOWNLOADBTN_TEXT"),
				tooltip: this._oRb.getText("CHART_DOWNLOADBTN_TOOLTIP"),
				icon: "sap-icon://download",
				visible: this.getShowDownloadButton(),
				press: function(oEvent) {
					// Check for browser
					if (window.navigator && window.navigator.msSaveOrOpenBlob) {
						// Handle IE, User can either open or save the svg
						// Create a blob object containing the chart svg data
						var svgBlob = new window.Blob([
							this._getVizFrame().exportToSVGString()
						], {
							'type': "image/svg+xml"
						});
						window.navigator.msSaveOrOpenBlob(svgBlob);
					} else {

						this._downloadChartPNG();
					}
				}.bind(this)
			});
			this._oToolbar.addContent(this._oDownloadButton);
		}
	};

	/**
	 * opens an image of the currently displayed chart in a new tab and show browsers print dialog
	 */
	/*
	 * SmartChart.prototype._printChart = function() { // Create a blob object containing the chart svg data var svgBlob = new window.Blob([
	 * this._getVizFrame().exportToSVGString() ], { 'type': "image/svg+xml" }); // Check for browser if (window.navigator &&
	 * window.navigator.msSaveOrOpenBlob) { // Handle IE, User can either open or save the svg window.navigator.msSaveOrOpenBlob(svgBlob); } else { //
	 * Firefox, Chrome // Create a local url for the blob in order to have same origin. var url = window.URL.createObjectURL(svgBlob); // Open new
	 * window showing the svg image var svgWindow = window.open(url, "svg_win"); // We need to use own var as window.onfocus is not working correctly
	 * after print dialog is closed var tabIsFocused = false; // check if print is finished or cancelled setInterval(function() { if (tabIsFocused ===
	 * true) { svgWindow.close(); } }, 1); // Do the print svgWindow.onload = function() { // TODO: Should work on all Apple devices, but wee need to
	 * handle Android separately if (sap.ui.Device.os.name === "Android") { // do something } else { svgWindow.print(); // Print was done or cancelled
	 * tabIsFocused = true; } }; } };
	 */

	/**
	 * downloads a svg file of the currently displayed chart
	 */
	SmartChart.prototype._downloadChartSVG = function() {
		// Download a file
		var fileName = this.getHeader();
		var dl = document.createElement('a');
		dl.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(this._getVizFrame().exportToSVGString()));
		dl.setAttribute('download', fileName ? fileName : 'Chart' + '.svg');
		dl.click();
	};

	/**
	 * downloads the chart as png file
	 */
	SmartChart.prototype._downloadChartPNG = function() {
		// Not working for IE, in this case we create a blob and call the IE notification bar for downloading the SVG
		// Create Image and then download (Chrome)
		var fileName = this.getHeader();
		var chartSVG = this._getVizFrame().exportToSVGString();
		var canvas = document.createElement('canvas'); // Not shown on page
		var context = canvas.getContext('2d');
		var loader = new Image(); // Not shown on page

		// getId() because vizFrame content changes id when selecting another chart type
		loader.width = canvas.width = document.getElementById(this._oChart.getId()).offsetWidth;
		loader.height = canvas.height = document.getElementById(this._oChart.getId()).offsetHeight;

		loader.onload = function() {
			context.drawImage(loader, 0, 0);

			var dl = document.createElement('a');
			dl.setAttribute('href', canvas.toDataURL());
			dl.setAttribute('download', fileName ? fileName : 'Chart' + '.png');
			dl.click();
		};
		loader.setAttribute('crossOrigin', 'anonymous');
		loader.src = 'data:image/svg+xml,' + encodeURIComponent(chartSVG);
	};

	/**
	 * adds the full-screen button to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addFullScreenButton = function() {
		var oFullScreenButton;
		if (this.getShowFullScreenButton()) {
			oFullScreenButton = new OverflowToolbarButton(this.getId() + "-btnFullScreen", {
				type: "Transparent",
				press: function() {
					this._toggleFullScreen(!this.bFullScreen);
				}.bind(this)
			});
			this.oFullScreenButton = oFullScreenButton;
			this._renderFullScreenButton();
			this._oToolbar.addContent(oFullScreenButton);
		}
	};

	/**
	 * adds the zoom-in / zoom-out buttons to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addZoomInOutButtons = function() {

		var that = this;
		this._oZoomInButton = new OverflowToolbarButton(this.getId() + "-btnZoomIn", {
			type: "Transparent",
			text: this._oRb.getText("CHART_ZOOMINBTN_TEXT"),
			tooltip: this._oRb.getText("CHART_ZOOMINBTN_TOOLTIP"),
			icon: "sap-icon://zoom-in",
			press: function() {
				if (that._oChart) {
					that._oChart.zoom({
						direction: "in"
					});
				}
			},
			visible: this.getShowZoomButtons()
		});

		this._oZoomOutButton = new OverflowToolbarButton(this.getId() + "-btnZoomOut", {
			type: "Transparent",
			text: this._oRb.getText("CHART_ZOOMOUTBTN_TEXT"),
			tooltip: this._oRb.getText("CHART_ZOOMOUTBTN_TOOLTIP"),
			icon: "sap-icon://zoom-out",
			press: function() {
				if (that._oChart) {
					that._oChart.zoom({
						direction: "out"
					});
				}
			},
			visible: this.getShowZoomButtons()
		});

		this._oToolbar.addContent(this._oZoomInButton);
		this._oToolbar.addContent(this._oZoomOutButton);
	};

	/**
	 * Sets the zoom-in / zoom-out buttons visibility state.
	 *
	 * @param {boolean} bFlag true to display the zoom-in / zoom-out buttons
	 */
	SmartChart.prototype.setShowZoomButtons = function(bFlag) {

		this.setProperty("showZoomButtons", bFlag);

		if (this._oZoomInButton) {
			this._oZoomInButton.setVisible(bFlag);
		}
		if (this._oZoomOutButton) {
			this._oZoomOutButton.setVisible(bFlag);
		}
	};

	/**
	 * Sets the full screen button visibility state.
	 *
	 * @param {boolean} bFlag true to display the fullscreen button
	 */
	SmartChart.prototype.setShowFullScreenButton = function(bFlag) {
		this.setProperty("showFullScreenButton", bFlag);
		if (this.oFullScreenButton) {
			this.oFullScreenButton.setVisible(bFlag);
		}
	};
	/**
	 * Sets the chart legend visibility state.
	 *
	 * @param {boolean} bFlag true to display the chart legend
	 */
	SmartChart.prototype.setLegendVisible = function(bFlag) {

		this.setProperty("legendVisible", bFlag);

		this._setLegendVisible(bFlag);
	};

	/**
	 * Sets the chart legend visibility state.
	 *
	 * @param {boolean} bFlag true to display the chart legend
	 * @private
	 */
	SmartChart.prototype._setLegendVisible = function(bFlag) {

		var oVizFrame = this._getVizFrame();
		if (oVizFrame) {
			oVizFrame.setLegendVisible(bFlag);
		}

	};

	/**
	 * Returns the charts _vizFrame aggregation.
	 *
	 * @returns {object} charts _vizFrame aggregation object
	 * @private
	 */
	SmartChart.prototype._getVizFrame = function() {

		var oVizFrame = null;
		if (this._oChart) {
			oVizFrame = this._oChart.getAggregation("_vizFrame");
		}

		return oVizFrame;
	};

	/**
	 * adds the legend button to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addLegendButton = function() {

		var that = this;
		this._oLegendButton = new OverflowToolbarButton(this.getId() + "-btnLegend", {
			type: "Transparent",
			text: this._oRb.getText("CHART_LEGENDBTN_TEXT"),
			tooltip: this._oRb.getText("CHART_LEGENDBTN_TOOLTIP"),
			icon: "sap-icon://legend",
			press: function() {
				that.setLegendVisible(!that.getLegendVisible());
			},
			visible: this.getShowLegendButton()
		});

		this._oToolbar.addContent(this._oLegendButton);
	};

	/**
	 * Sets the legend button visibility state.
	 *
	 * @param {boolean} bFlag true to display the legend button
	 */
	SmartChart.prototype.setShowLegendButton = function(bFlag) {

		this.setProperty("showLegendButton", bFlag);

		if (this._oLegendButton) {
			this._oLegendButton.setVisible(bFlag);
		}
	};

	/**
	 * Sets the semantic navigation button visibility state.
	 *
	 * @param {boolean} bFlag true to display the semantic navigation button
	 */
	SmartChart.prototype.setShowSemanticNavigationButton = function(bFlag) {

		this.setProperty("showSemanticNavigationButton", bFlag);

		if (this._oSemanticalNavButton) {
			this._oSemanticalNavButton.setVisible(bFlag);
		} else {
			/* eslint-disable no-lonely-if */
			if (bFlag) {
				this._addSemanticNavigationButton();
			}
			/* eslint-enable no-lonely-if */
		}
	};

	/**
	 * adds the semantical navigation button to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addSemanticNavigationButton = function() {
		var that = this, aSemanticObjects;

		if (!this._oSemanticalNavButton && this.getShowSemanticNavigationButton() && this._oToolbar) {
			this._oSemanticalNavButton = new Button(this.getId() + "-btnNavigation", {
				type: "Transparent",
				text: this._oRb.getText("CHART_SEMNAVBTN"),
				tooltip: this._oRb.getText("CHART_SEMNAVBTN_TOOLTIP"),
				visible: this.getShowSemanticNavigationButton(),
				enabled: false
			});

			jQuery.sap.require("sap.ui.comp.navpopover.NavigationPopoverHandler");

			var oNavHandler = new sap.ui.comp.navpopover.NavigationPopoverHandler({
				control: this._oSemanticalNavButton
			});

			var oSemanticObjectController = this.getSemanticObjectController();
			if (oSemanticObjectController) {
				oNavHandler.setSemanticObjectController(oSemanticObjectController);
			}

			this._oSemanticalNavButton.attachPress(function(oEvent) {

				if (aSemanticObjects && (aSemanticObjects.length > 0)) {

					if (aSemanticObjects.length === 1) {
						var oSemanticObjects = MetadataAnalyser.getSemanticObjectsFromProperty(aSemanticObjects[0]);
						if (oSemanticObjects) {
							oNavHandler.setFieldName(aSemanticObjects[0].name);
							oNavHandler.setSemanticObject(oSemanticObjects.defaultSemanticObject);
							oNavHandler.setAdditionalSemanticObjects(oSemanticObjects.additionalSemanticObjects);
							oNavHandler.openPopover();
						}
					} else {
						that._semanticObjectList(aSemanticObjects, oNavHandler);
					}
				}
			});
			if (this._oChart) {

				this._oChart.attachDeselectData(function() {
					aSemanticObjects = that._setSelectionDataPointHandling(oNavHandler);
				});

				this._oChart.attachSelectData(function() {
					aSemanticObjects = that._setSelectionDataPointHandling(oNavHandler);
				});
			}

			var iSpacerIdx = this._indexOfSpacerOnToolbar();
			this._oToolbar.insertContent(this._oSemanticalNavButton, iSpacerIdx + 1);
		}
	};
	/**
	 * sets the selectionMode for datapoint selection.
	 *
	 * @param {sap.chart.SelectionMode} selectionMode SINGLE, MULTI or NONE
	 */
	SmartChart.prototype.setSelectionMode = function(selectionMode) {
		this.setProperty("selectionMode", selectionMode);
		if (this._oChart) {
			this._oChart.setSelectionMode(selectionMode);
		}
	};

	/**
	 * Sets the handling of selected data points in order to resolve a semantical object when semantic navigation button is pressed
	 *
	 * @param {sap.ui.comp.navpopover.NavigationPopoverHandler} oNavHandler The navigation handler for the semantical object navigation
	 * @returns {array} The semantic objects for selected data points
	 * @private
	 */
	SmartChart.prototype._setSelectionDataPointHandling = function(oNavHandler) {
		var aSemanticObjects = this._setSelectionDataPoint(oNavHandler);
		if (aSemanticObjects && aSemanticObjects.length > 0) {
			this._oSemanticalNavButton.setEnabled(true);
		} else {
			this._oSemanticalNavButton.setEnabled(false);
		}

		return aSemanticObjects;
	};

	/**
	 * Sets the semantical object context for each selected data point when details button is used
	 *
	 * @param {object} oEvent The event arguments
	 * @returns {array} The semantic objects for selected data points
	 * @private
	 */
	SmartChart.prototype._setSemanticObjectsContext = function(oEvent) {
		var oDataContext, oData, aSemanticObjects = null;

		// Get binding context
		// selectionDetails implementation
		oDataContext = oEvent.getParameter("item").getBindingContext();

		if (oDataContext) {
			// Get data object from context
			oData = oDataContext.getObject();
			if (oData) {
				// Retrieve semantical objects
				aSemanticObjects = this._determineSemanticObjectsforDetailsPopover(oData, oDataContext);
			}
		}
		return aSemanticObjects;
	};

	/**
	 * Sets the semantical object context for each selected data point when semantical nav button is used
	 *
	 * @param {sap.ui.comp.navpopover.NavigationPopoverHandler} oNavHandler The navigation handler for the semantical object navigation
	 * @returns {array} The semantic objects for selected data points
	 * @private
	 */
	SmartChart.prototype._setSelectionDataPoint = function(oNavHandler) {
		var oDataContext, oData, aSemanticObjects = null, aDataContext;

		var aSelectedDataPoints = this._oChart.getSelectedDataPoints();

		if (!aSelectedDataPoints || !aSelectedDataPoints.dataPoints || (aSelectedDataPoints.dataPoints.length === 0)) {
			return aSemanticObjects;
		}

		if (aSelectedDataPoints.dataPoints.length === 1) {
			oDataContext = aSelectedDataPoints.dataPoints[0].context;
			if (oDataContext) {
				oData = oDataContext.getObject();

				if (oData) {
					aSemanticObjects = this._determineSemanticObjects(oData, oDataContext);
					if (aSemanticObjects && (aSemanticObjects.length > 0)) {
						oNavHandler.setBindingContext(oDataContext);
					}
				}
			}

			return aSemanticObjects;
		}

		aDataContext = [];
		for (var i = 0; i < aSelectedDataPoints.dataPoints.length; i++) {
			oDataContext = aSelectedDataPoints.dataPoints[i].context;
			if (oDataContext) {
				oData = oDataContext.getObject();

				if (oData) {
					aDataContext.push(oData);
				}
			}
		}

		if (aDataContext && aDataContext.length > 0) {
			aSemanticObjects = this._condensBasedOnSameValue(aDataContext);
			if (aSemanticObjects && aSemanticObjects.length > 0) {
				oNavHandler.setBindingContext(aSelectedDataPoints.dataPoints[aSelectedDataPoints.dataPoints.length - 1].context);
			}
		}

		return aSemanticObjects;
	};

	/**
	 * Condenses data point contexts which are based on same values.
	 *
	 * @param {array} aData The data contexts of selected data points
	 * @returns {array} The semantic objects for selected data points
	 * @private
	 */
	SmartChart.prototype._condensBasedOnSameValue = function(aData) {

		var aSemObj = null, aResultSemObj, oSemObj, sName;

		// expectation: all datapoint have the same semantical objects
		aSemObj = this._determineSemanticObjects(aData[0]);

		if (aSemObj && aSemObj.length > 0) {
			for (var i = 0; i < aSemObj.length; i++) {
				oSemObj = aSemObj[i];
				sName = oSemObj.name;

				if (this._bAllValuesAreEqual(aData, sName)) {
					if (!aResultSemObj) {
						aResultSemObj = [];
					}

					aResultSemObj.push(oSemObj);
				}
			}
			aSemObj = aResultSemObj;
		}
		return aSemObj;
	};
	/**
	 * Checks if all values of a data point context are equal.
	 *
	 * @param {array} aData The data contexts of selected data points
	 * @param {string} sFieldName The field name against whose value should be checked
	 * @returns {boolean} True if all values are equals, false otherwise
	 * @private
	 */
	SmartChart.prototype._bAllValuesAreEqual = function(aData, sFieldName) {
		var oData, sValue;
		for (var i = 0; i < aData.length; i++) {
			oData = aData[i];

			if (i === 0) {
				sValue = oData[sFieldName];
				continue;
			}
			if (sValue != oData[sFieldName]) {
				return false;
			}
		}
		return true;
	};

	/**
	 * Creates a semantical object list for selected data points which resolve in more than one semantical object when semantical nav button is used.
	 *
	 * @param {array} aSemanticObjects The semantical objects for a selected data point
	 * @param {sap.ui.comp.navpopover.NavigationPopoverHandler} oNavHandler The navigation handler for the semantical object navigation
	 * @private
	 */
	SmartChart.prototype._semanticObjectList = function(aSemanticObjects, oNavHandler) {

		var oPopover, oList, oListItem, oSemanticObject;

		if (this._oChart) {

			oList = new sap.m.List({
				mode: sap.m.ListMode.SingleSelectMaster,
				selectionChange: function(oEvent) {
					if (oEvent && oEvent.mParameters && oEvent.mParameters.listItem) {
						var oSemanticObjects = oEvent.mParameters.listItem.data("semObj");
						if (oSemanticObjects) {
							oNavHandler.setFieldName(oEvent.mParameters.listItem.data("fieldName"));
							oNavHandler.setSemanticObject(oSemanticObjects.defaultSemanticObject);
							oNavHandler.setAdditionalSemanticObjects(oSemanticObjects.additionalSemanticObjects);
							// control is set to this._oSemanticalNavButton
							oNavHandler.openPopover();
						}
					}
					oPopover.close();
				}
			});

			for (var i = 0; i < aSemanticObjects.length; i++) {
				oSemanticObject = aSemanticObjects[i];
				oListItem = new sap.m.StandardListItem({
					title: oSemanticObject.fieldLabel,
					type: sap.m.ListType.Active
				});

				oListItem.data("semObj", MetadataAnalyser.getSemanticObjectsFromProperty(oSemanticObject));
				oListItem.data("fieldName", oSemanticObject.name);
				oList.addItem(oListItem);
			}

			oPopover = new sap.m.ResponsivePopover({
				title: this._oRb.getText("CHART_SEMNAVBTN"),
				showHeader: false,
				contentWidth: "12rem",
				placement: sap.m.PlacementType.Left
			});

			oPopover.addContent(oList);
			oPopover.openBy(this._oSemanticalNavButton);
		}
	};

	/**
	 * Creates a semantical object list for selected data points which resolve in more than one semantical object when details button is used.
	 *
	 * @param {array} aSemanticObjects The semantical objects for a selected data point
	 * @param {object} oContext The binding context of the pressed list item
	 * @returns {sap.m.List} list containing items for the semantical objects for a selected data point
	 * @private
	 */
	SmartChart.prototype._semanticObjectListForDetails = function(aSemanticObjects, oContext) {

		var oList, oListItem, oSemanticObject;
		var that = this;

		if (this._oChart) {

			oList = new sap.m.List({
				mode: sap.m.ListMode.SingleSelectMaster,
				rememberSelections: false,
				itemPress: function(oEvent) {
					if (oEvent && oEvent.mParameters && oEvent.mParameters.listItem) {
						var oSemanticObjects = oEvent.mParameters.listItem.data("semObj");
						if (oSemanticObjects) {
							// TODO: Provide own function for this and also use it in _navigateToSemanticObjectDetails
							var oNavigationHandler = new sap.ui.comp.navpopover.NavigationPopoverHandler({
								fieldName: oEvent.mParameters.listItem.data("fieldName"),
								control: oEvent.mParameters.listItem,
								semanticObject: oSemanticObjects.defaultSemanticObject,
								additionalSemanticObjects: oSemanticObjects.additionalSemanticObjects
							});

							oNavigationHandler._getNavigationContainer().then(function(oNavigationContainer) {

								that._oNavigationContainer = oNavigationContainer;
								oNavigationContainer.attachAvailableActionsPersonalizationPress(that._onAvailableActionsPersonalizationPress, that);
								this._oSelectionDetails.navTo("", oNavigationContainer);

							}.bind(this), function(oError) {
								jQuery.sap.log.error("NavigationContainer could not be determined");
							});
						}
					}
				}.bind(this)
			});

			// Get semantic objects and only create list item when navigation targets are available.
			sap.ui.comp.navpopover.SemanticObjectController.getDistinctSemanticObjects().then(function(oSemanticObjects) {
				for (var i = 0; i < aSemanticObjects.length; i++) {
					oSemanticObject = aSemanticObjects[i];
					if (sap.ui.comp.navpopover.SemanticObjectController.hasDistinctSemanticObject(oSemanticObject["com.sap.vocabularies.Common.v1.SemanticObject"].String, oSemanticObjects)) {

						oListItem = new sap.m.StandardListItem({
							title: oSemanticObject.fieldLabel,
							type: sap.m.ListType.Navigation
						});

						oListItem.setBindingContext(oContext);
						oListItem.data("semObj", MetadataAnalyser.getSemanticObjectsFromProperty(oSemanticObject));
						oListItem.data("fieldName", oSemanticObject.name);
						oList.addItem(oListItem);
					}
				}
			});

			return oList;
		}
	};

	SmartChart.prototype._onAvailableActionsPersonalizationPress = function(oEvent) {
		var oNavigationContainer = oEvent.getSource();
		// set modal to keep selectionDetails popover open during link personalization
		this._oSelectionDetails.setPopoverModal(true);

		oNavigationContainer.openSelectionDialog(false, true, undefined, true, undefined).then(function() {
			this._oSelectionDetails.setPopoverModal(false);
		}.bind(this));
	};

	/**
	 * Determines the semantical object for a given context of a selected data point.
	 *
	 * @param{object} mData data of a selected data point object
	 * @param{object} oDataContext binding context of a selected data point
	 * @returns {array} semantical objects
	 */
	SmartChart.prototype._determineSemanticObjects = function(mData, oDataContext) {
		var n, oField, aSematicObjects = [];
		if (mData) {
			for (n in mData) {
				if (n) {
					oField = this._getField(n);
					if (oField && oField.isDimension && oField.isSemanticObject) {
						aSematicObjects.push(oField);
					}
				}
			}
		}
		if (aSematicObjects) {
			aSematicObjects.sort(function(a, b) {
				return a.fieldLabel.localeCompare(b.fieldLabel);
			});
		}
		return aSematicObjects;
	};
	/**
	 * Determines the semantical object for a given context of a selected data point.
	 *
	 * @param{object} mData data of a selected data point object
	 * @param{object} oDataContext binding context of a selected data point
	 * @returns {array} semantical objects
	 */
	SmartChart.prototype._determineSemanticObjectsforDetailsPopover = function(mData, oDataContext) {

		var n, oField, aSematicObjects = [];
		if (mData) {
			for (n in mData) {
				if (n) {
					oField = this._getField(n);
					if (oField && oField.isDimension && oField.isSemanticObject) {
						aSematicObjects.push(oField);
					}
				}
			}
		}
		if (aSematicObjects) {
			aSematicObjects.sort(function(a, b) {
				return a.fieldLabel.localeCompare(b.fieldLabel);
			});
		}
		return aSematicObjects;
	};

	/**
	 * Adds the drill-up and drill-down button to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addDrillUpDownButtons = function() {

		if (this.getShowDrillButtons()) {

			var that = this;

			this._oDrillUpButton = new OverflowToolbarButton(this.getId() + "-btnDrillUp", {
				type: "Transparent",
				tooltip: this._oRb.getText("CHART_DRILLUPBTN_TOOLTIP"),
				text: this._oRb.getText("CHART_DRILLUPBTN_TEXT"),
				icon: "sap-icon://drill-up",
				press: function() {
					if (that._oChart) {
						that._oChart.drillUp();
					}
				},
				visible: !this.getShowDrillBreadcrumbs()
			});

			this._oDrillDownButton = new OverflowToolbarButton(this.getId() + "-btnDrillDown", {
				type: "Transparent",
				tooltip: this._oRb.getText("CHART_DRILLDOWNBTN_TOOLTIP"),
				text: this._oRb.getText("CHART_DRILLDOWNBTN_TEXT"),
				icon: "sap-icon://drill-down",
				press: function(oEvent) {
					that._drillDown(oEvent);
				},
				visible: !this.getShowDetailsButton()

			});
			this._oToolbar.addContent(this._oDrillUpButton);
			this._oToolbar.addContent(this._oDrillDownButton);
		}
	};
	/**
	 * Adds the drill-down text button to the toolbar This button only is visible together with selectionDetails control.
	 *
	 * @private
	 */
	SmartChart.prototype._addDrillDownTextButton = function() {

		this._oDrillDownTextButton = new Button(this.getId() + "-btnDrillDownText", {
			type: "Transparent",
			text: this._oRb.getText("CHART_DRILLDOWNBTN_TEXT"),
			tooltip: this._oRb.getText("CHART_DRILLDOWNBTN_TOOLTIP"),
			layoutData: new sap.m.OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.NeverOverflow
			}),
			enabled: true,
			visible: this.getShowDetailsButton(),// show only when selectionDetails is used
			press: function(oEvent) {
				this._drillDown(oEvent);
			}.bind(this)
		});

		this._oToolbar.addContent(this._oDrillDownTextButton);
	};

	/**
	 * Sets the drill-up button and drill-down button visibility state
	 *
	 * @param {boolean} bFlag true to display the drill-up and drill-down buttons, false otherwise
	 */
	SmartChart.prototype.setShowDrillButtons = function(bFlag) {

		this.setProperty("showDrillButtons", bFlag);

		if (this._oDrillUpButton) {
			this._oDrillUpButton.setVisible(bFlag);
		}
		if (this._oDrillDownButton) {
			this._oDrillDownButton.setVisible(bFlag);
		}
	};

	/**
	 * Triggers a search in the drill-down popover
	 *
	 * @param {object} oEvent The event arguments
	 * @param {sap.m.List} oList The list to search in
	 * @private
	 */
	SmartChart.prototype._triggerSearchInPopover = function(oEvent, oList) {

		var parameters, i, sTitle, sTooltip, sValue, aItems;

		if (!oEvent || !oList) {
			return;
		}

		parameters = oEvent.getParameters();
		if (!parameters) {
			return;
		}

		sValue = parameters.newValue ? parameters.newValue.toLowerCase() : "";

		if (this._oChart) {
			aItems = oList.getItems();
			for (i = 0; i < aItems.length; i++) {

				sTooltip = aItems[i].getTooltip();
				sTitle = aItems[i].getTitle();

				if ((sTitle && (sTitle.toLowerCase().indexOf(sValue) > -1)) || (sTooltip && (sTooltip.toLowerCase().indexOf(sValue) > -1))) {
					aItems[i].setVisible(true);
				} else {
					aItems[i].setVisible(false);
				}
			}
		}
	};

	/**
	 * Opens the drill-down popover and shows a list of available dimensions for drilling in.
	 *
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartChart.prototype._drillDown = function(oEvent) {

		var that = this, oPopover, aIgnoreDimensions, aDimensions, oDimension, oListItem, oList, oSubHeader, oSearchField, i, sTooltip;

		if (this._oChart) {

			oList = new sap.m.List({
				mode: sap.m.ListMode.SingleSelectMaster,
				selectionChange: function(oEvent) {
					if (oEvent && oEvent.mParameters && oEvent.mParameters.listItem) {

						if (oEvent.mParameters.listItem.getType() === sap.m.ListType.Inactive) {
							return;
						}

						var oDimension = oEvent.mParameters.listItem.data("dim");
						if (oDimension) {
							that._oChart.drillDown(oDimension);
						}
					}

					oPopover.close();
				}
			});

			oSubHeader = new sap.m.Bar();
			oSearchField = new sap.m.SearchField({
				placeholder: this._oRb.getText("CHART_DRILLDOWN_SEARCH")
			});
			oSearchField.attachLiveChange(function(oEvent) {
				that._triggerSearchInPopover(oEvent, oList);
			});
			oSubHeader.addContentRight(oSearchField);

			oPopover = new sap.m.ResponsivePopover({
				title: this._oRb.getText("CHART_DRILLDOWN_TITLE"),
				contentWidth: "25rem",
				contentHeight: "20rem",
				placement: sap.m.PlacementType.Bottom,
				subHeader: oSubHeader
			});

			oPopover.addContent(oList);

			// Get currently applied dimensions from drill-stack
			aIgnoreDimensions = this._getDrillStackDimensions();
			aDimensions = this._getSortedDimensions();

			if (aDimensions.length < 7) {
				oSubHeader.setVisible(false);
			}

			for (i = 0; i < aDimensions.length; i++) {

				if (aIgnoreDimensions.indexOf(aDimensions[i].getName()) > -1) {
					continue;
				}

				oDimension = aDimensions[i];
				oListItem = new sap.m.StandardListItem({
					title: oDimension.getLabel(),
					type: sap.m.ListType.Active
				});

				oListItem.data("dim", oDimension);

				sTooltip = this._getFieldTooltip(oDimension.name);
				if (sTooltip) {
					oListItem.setTooltip(sTooltip);
				}

				if (aIgnoreDimensions.indexOf(aDimensions[i].getName()) > -1) {
					oListItem.setType(sap.m.ListType.Inactive);
				}

				oList.addItem(oListItem);
			}
			oPopover.openBy(oEvent.getSource());
		}
	};

	/**
	 * Navigates to the semantic object directly or to a list of available semantic objects of one details entry within the details popover
	 *
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartChart.prototype._navigateToSemanticObjectDetails = function(oEvent) {

		// update semantic objects based on details item press
		var aSemanticObjects = this._setSemanticObjectsContext(oEvent);

		if (aSemanticObjects && (aSemanticObjects.length > 0)) {

			if (aSemanticObjects.length === 1) {
				var oSemanticObjects = MetadataAnalyser.getSemanticObjectsFromProperty(aSemanticObjects[0]);
				if (oSemanticObjects) {

					var oNavigationHandler = new sap.ui.comp.navpopover.NavigationPopoverHandler({
						fieldName: aSemanticObjects[0].name,
						control: oEvent.getParameter("item"), // Pass pressed item to use its binding context
						semanticObject: oSemanticObjects.defaultSemanticObject,
						additionalSemanticObjects: oSemanticObjects.additionalSemanticObjects
					});

					oNavigationHandler._getNavigationContainer().then(function(oNavigationContainer) {
						this._oNavigationContainer = oNavigationContainer;

						// Attach link personalization handling
						oNavigationContainer.attachAvailableActionsPersonalizationPress(this._onAvailableActionsPersonalizationPress, this);

						// Navigate to semantic details page
						this._oSelectionDetails.navTo("", oNavigationContainer);

					}.bind(this), function(oError) {
						jQuery.sap.log.error("NavigationContainer could not be determined");
					});
				}
			} else {
				var oContext = oEvent.getParameter("item").getBindingContext();
				// Call this function if we use the details section instead of the button for semantic navigation
				var oList = this._semanticObjectListForDetails(aSemanticObjects, oContext);
				this._oSelectionDetails.navTo(this._oRb.getText("CHART_SEMNAVBTN"), oList);
			}
		}

	};

	/**
	 * adds the header line to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addHeaderToToolbar = function() {

		if (this.getHeader() && this._oToolbar) {
			if (!this._headerText) {
				this._headerText = new Title({});
				this._headerText.addStyleClass("sapMH4Style");
				this._headerText.addStyleClass("sapUiCompSmartChartHeader");
			}
			this._refreshHeaderText();
			this._oToolbar.insertContent(this._headerText, 0);
		} else if (this._headerText && this._oToolbar) {
			this._oToolbar.removeContent(this._headerText);
		}
	};

	/**
	 * adds a separator between header and variantmanagement to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addSeparatorToToolbar = function() {

		if (this.getHeader() && this.getUseVariantManagement() && this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oSeparator = new ToolbarSeparator();
			this._oToolbar.insertContent(this._oSeparator, 0);
			// Also set the height to 3rem when no height is explicitly specified
			if (!this._oToolbar.getHeight()) {
				this._oToolbar.setHeight("auto");
			}
		} else if (this._oSeparator) {
			this._oToolbar.removeContent(this._oSeparator);
		}
	};

	/**
	 * adds the VarientManagement to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addVariantManagementToToolbar = function() {

		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {

			if (this.getUseVariantManagement()) {
				this._oToolbar.insertContent(this._oVariantManagement, 0);
			} else if (this._oVariantManagement) {
				this._oToolbar.removeContent(this._oVariantManagement);
			}
		}
	};

	/**
	 * adds a spacer to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addSpacerToToolbar = function() {
		if (this._indexOfSpacerOnToolbar() === -1) {
			this._oToolbar.addContent(new ToolbarSpacer());
		}
	};

	SmartChart.prototype._indexOfSpacerOnToolbar = function() {
		var aItems = this._oToolbar.getContent(), i, iLength;
		if (aItems) {
			iLength = aItems.length;
			i = 0;
			for (i; i < iLength; i++) {
				if (aItems[i] instanceof ToolbarSpacer) {
					return i;
				}
			}
		}
		return -1;
	};

	/**
	 * adds the Personalisation button to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addPersonalisationToToolbar = function() {
		if (this.getUseChartPersonalisation()) {
			if (!this._oChartPersonalisationButton) {
				this._oChartPersonalisationButton = new OverflowToolbarButton(this.getId() + "-btnPersonalisation", {
					type: "Transparent",
					icon: "sap-icon://action-settings",
					text: this._oRb.getText("CHART_PERSOBTN_TEXT"),
					tooltip: this._oRb.getText("CHART_PERSOBTN_TOOLTIP"),
					press: function(oEvent) {
						this._oPersController.openDialog({
							dimeasure: {
								visible: true,
								payload: {
									availableChartTypes: this._getAvailableChartTypes()
								}
							},
							sort: {
								visible: true
							},
							filter: {
								visible: true
							}
						});
					}.bind(this)
				});
			}
			this._oToolbar.addContent(this._oChartPersonalisationButton);
		} else if (this._oChartPersonalisationButton) {
			this._oToolbar.removeContent(this._oChartPersonalisationButton);
		}
	};

	/**
	 * Adds the chart type button to the toolbar
	 *
	 * @private
	 */
	SmartChart.prototype._addChartTypeToToolbar = function() {
		// Use a OverflowToolbarButton regarding new UX re-design
		this._oChartTypeButton = this._createChartTypeButton();
		this._oToolbar.addContent(this._oChartTypeButton);
	};

	/**
	 * Creates a OverflowToolbarButton for selecting a specific chart type.
	 *
	 * @returns {sap.m.SegementedButton} The segmented button for chart type selection
	 * @private
	 */
	SmartChart.prototype._createChartTypeButton = function() {
		// Create a button for selecting chart types
		var oChartTypeButton = new OverflowToolbarButton(this.getId() + "-btnChartType", {
			visible: this.getShowChartTypeSelectionButton(),
			type: "Transparent",
			layoutData: new sap.m.OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.NeverOverflow
			}),
			press: function(oEvent) {
				this._displayChartTypes(oEvent);
			}.bind(this)
		});
		// Initial enrichment of button
		this._enrichPassedButton(oChartTypeButton, this._oChart.getChartType());

		return oChartTypeButton;
	};

	/**
	 * Displays a popover which shows all available chart types
	 *
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartChart.prototype._displayChartTypes = function(oEvent) {

		var that = this, oPopover, oList, oSubHeader, oSearchField, bDoNotUpdate = false;

		if (this._bAvailableChartListIsOpen) {
			return;
		}

		if (this._oChart && oEvent) {
			var oButton = oEvent.getSource();

			var oItemTemplate = new sap.m.StandardListItem({
				title: "{$smartChartTypes>text}",
				icon: "{$smartChartTypes>icon}",
				selected: "{$smartChartTypes>selected}"
			});

			oList = new sap.m.List({
				mode: sap.m.ListMode.SingleSelectMaster,
				items: {
					path: "$smartChartTypes>/items",
					template: oItemTemplate
				},
				selectionChange: function(oEvent) {
					if (oEvent && oEvent.mParameters && oEvent.mParameters.listItem) {
						var oBinding = oEvent.mParameters.listItem.getBinding("title");
						if (oBinding) {
							var oCtx = oBinding.getContext();
							if (oCtx) {
								var oObj = oCtx.getObject();
								if (oObj && oObj.key) {
									// Set the chart type on the inner chart
									that._setChartType(oObj.key);
									// update the chart type buttons icon and tooltip
									that._enrichPassedButton(that._oChartTypeButton, that._oChart.getChartType());
								}
							}
						}
					}
					bDoNotUpdate = true;
					oPopover.close();
				}
			});

			oSubHeader = new sap.m.Bar();
			oSearchField = new sap.m.SearchField({
				placeholder: this._oRb.getText("CHART_TYPE_SEARCH")
			});
			oSearchField.attachLiveChange(function(oEvent) {
				that._triggerSearchInPopover(oEvent, oList);
			});
			oSubHeader.addContentRight(oSearchField);

			oPopover = new sap.m.ResponsivePopover({
				placement: sap.m.PlacementType.Bottom,
				subHeader: oSubHeader,
				showHeader: false,
				contentWidth: "25rem"
			});

			oPopover.attachAfterClose(function(oEvent) {
				if (!bDoNotUpdate) {
					// that._updateVisibilityOfChartTypes(that._oChartTypeButton);
				}
				that._bAvailableChartListIsOpen = false;
			});

			oPopover.setModel(this.getModel("$smartChartTypes"), "$smartChartTypes");

			oPopover.addContent(oList);

			if (oList.getItems().length < 7) {
				oSubHeader.setVisible(false);
			}

			this._bAvailableChartListIsOpen = true;
			oPopover.openBy(oButton);
		}
	};

	var mMatchingIcon = {
		"bar": "sap-icon://horizontal-bar-chart",
		"bullet": "sap-icon://horizontal-bullet-chart",
		"bubble": "sap-icon://bubble-chart",
		"column": "sap-icon://vertical-bar-chart",
		"combination": "sap-icon://business-objects-experience",
		"dual_bar": "sap-icon://horizontal-bar-chart",
		"dual_column": "sap-icon://vertical-bar-chart",
		"dual_combination": "sap-icon://business-objects-experience",
		"dual_horizontal_combination": "sap-icon://business-objects-experience",
		"dual_horizontal_stacked_combination": "sap-icon://business-objects-experience",
		"dual_line": "sap-icon://line-chart",
		"dual_stacked_bar": "sap-icon://full-stacked-chart",
		"dual_stacked_column": "sap-icon://vertical-stacked-chart",
		"dual_stacked_combination": "sap-icon://business-objects-experience",
		"donut": "sap-icon://donut-chart",
		"heatmap": "sap-icon://heatmap-chart",
		"horizontal_stacked_combination": "sap-icon://business-objects-experience",
		"line": "sap-icon://line-chart",
		"pie": "sap-icon://pie-chart",
		"scatter": "sap-icon://scatter-chart",
		"stacked_bar": "sap-icon://full-stacked-chart",
		"stacked_column": "sap-icon://vertical-stacked-chart",
		"stacked_combination": "sap-icon://business-objects-experience",
		"treemap": "sap-icon://Chart-Tree-Map", // probably has to change
		"vertical_bullet": "sap-icon://vertical-bullet-chart",
		"100_dual_stacked_bar": "sap-icon://full-stacked-chart",
		"100_dual_stacked_column": "sap-icon://vertical-stacked-chart",
		"100_stacked_bar": "sap-icon://full-stacked-chart",
		"100_stacked_column": "sap-icon://full-stacked-column-chart",
		"waterfall": "sap-icon://vertical-waterfall-chart",
		"horizontal_waterfall": "sap-icon://horizontal-waterfall-chart"
	};

	/**
	 * Returns a matching icon for a specific chart type
	 *
	 * @param {string} sCharType The chart type
	 * @returns{string} sIcon The icon url
	 * @private
	 */
	SmartChart.prototype._getMatchingIcon = function(sCharType) {
		var sIcon = mMatchingIcon[sCharType];
		if (!sIcon) {
			sIcon = "";
		}

		return sIcon;
	};

	/**
	 * Enriches a passed button with the needed information of the selcted chart type
	 *
	 * @param {sap.m.OverflowToolbarButton} oButton The button which shall be enriched
	 * @param {string} sKey The key of an available chart type
	 * @param {string} sText The text of an available chart type
	 * @private
	 */
	SmartChart.prototype._enrichPassedButton = function(oButton, sKey, sText) {

		if (!oButton) {
			return;
		}

		if (sText === undefined) {

			sText = sKey;
			var oKey = this._retrieveChartTypeDescription(sKey);
			if (oKey && oKey.text) {
				sText = oKey.text;
			}
		}

		oButton.data("chartType", sKey);

		var sSelectedChartTypeIcon = this._getMatchingIcon(sKey);
		oButton.setIcon(sSelectedChartTypeIcon ? sSelectedChartTypeIcon : "sap-icon://vertical-bar-chart");

		var sTextKey = (this._oChart.getChartType() === sKey) ? "CHART_TYPE_TOOLTIP" : "CHART_TYPE_UNSEL_TOOLTIP";
		oButton.setTooltip(this._oRb.getText(sTextKey, [
			sText
		]));
	};

	/**
	 * Updates the available chart types model
	 *
	 * @private
	 */
	SmartChart.prototype._updateAvailableChartType = function() {
		var that = this, oModel, mData, aItems = [];

		oModel = this.getModel("$smartChartTypes");
		if (!oModel) {
			return;
		}

		mData = {
			items: aItems
		};

		var sSelectedChartType = this._oChart.getChartType();

		this._getAvailableChartTypes().forEach(function(chartType) {

			var oItem = {
				key: chartType.key,
				text: chartType.text,
				icon: that._getMatchingIcon(chartType.key),
				selected: sSelectedChartType === chartType.key
			};
			aItems.push(oItem);
		});

		oModel.setData(mData);

		if (this._oSegmentedButton) {
			this._updateVisibilityOfChartTypes(this._oSegmentedButton);
		}
	};

	/**
	 * creates the personalization controller if not yet done
	 *
	 * @private
	 */
	SmartChart.prototype._createPersonalizationController = function() {
		if (this._oPersController) {
			return;
		}

		var oSettings = this.data("p13nDialogSettings");
		if (typeof oSettings === "string") {
			try {
				oSettings = JSON.parse(oSettings);
			} catch (e) {
				oSettings = null;
				// Invalid JSON!
			}
		}

		oSettings = this._setIgnoreFromPersonalisationToSettings(oSettings);

		oSettings = oSettings || {};

		jQuery.sap.require("sap.ui.comp.personalization.Controller");
		var oChartWrapper = PersoUtil.createChartWrapper(this._oChart, this._oChart.data("p13nData"), this._aColumnKeysOrdered);
		if (this.$() && this.$().closest(".sapUiSizeCompact").length > 0) {
			this._oChart.addStyleClass("sapUiSizeCompact");
		}

		this._oPersController = new sap.ui.comp.personalization.Controller({
			table: oChartWrapper,
			setting: oSettings,
			resetToInitialTableState: !this.getUseVariantManagement(),
			afterP13nModelDataChange: this._personalisationModelDataChange.bind(this)
		});

		this._oPersController.attachDialogConfirmedReset(function() {
			if (this._oDrillBreadcrumbs) {
				this._updateDrillBreadcrumbs();
			}
			// Update the chartTypeButton
			var oChartTypeButton = sap.ui.getCore().byId(this.getId() + "-btnChartType");
			if (oChartTypeButton) {
				this._enrichPassedButton(oChartTypeButton, this._oChart.getChartType());
			}
		}.bind(this));
	};

	/**
	 * adds the ignoreFromPersonalisation fields to the given setting
	 *
	 * @param {object} oSettings the former settings object
	 * @private
	 * @returns {object} the changed settings object
	 */
	SmartChart.prototype._setIgnoreFromPersonalisationToSettings = function(oSettings) {
		var aIgnoreFields = PersoUtil.createArrayFromString(this.getIgnoreFromPersonalisation());
		if (aIgnoreFields.length) {
			if (!oSettings) {
				oSettings = {};
			}

			var fSetArray = function(sSubName) {
				if (!oSettings[sSubName]) {
					oSettings[sSubName] = {};
				}
				oSettings[sSubName].ignoreColumnKeys = aIgnoreFields;
			};

			fSetArray("dimeasure");
			fSetArray("filter");
			fSetArray("sort");
		}
		return oSettings;
	};

	/**
	 * eventhandler for personalisation changed
	 *
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartChart.prototype._personalisationModelDataChange = function(oEvent) {
		this._oCurrentVariant = oEvent.getParameter("persistentData");
		var oChangeInfo = oEvent.getParameter("changeType");
		var changeStatus = this._getChangeStatus(oChangeInfo);

		if (changeStatus === sap.ui.comp.personalization.ChangeType.Unchanged) {
			return;
		}

		// Only fire chartDataChanged when type as not Unchanged
		this._fireChartDataChanged(oChangeInfo);

		if (!this._bApplyingVariant) {
			if (!this.getUseVariantManagement()) {
				this._persistPersonalisation();
			} else if (this._oVariantManagement) {
				this._oVariantManagement.currentVariantSetModified(true);
			}
		}

		if (changeStatus === sap.ui.comp.personalization.ChangeType.TableChanged) {
			if (this._oCurrentVariant.dimeasure && this._oCurrentVariant.dimeasure.chartTypeKey) {
				this._updateAvailableChartType();
				// Update chartType button when type was changed in P13n
				if (this._oChartTypeButton) {
					this._enrichPassedButton(this._oChartTypeButton, this._oChart.getChartType());
				}
			}
			if (this._oSemanticalNavButton) {
				this._oSemanticalNavButton.setEnabled(false);
			}
		} else if (changeStatus === sap.ui.comp.personalization.ChangeType.ModelChanged && this._bIsChartBound) {
			// Check if chart was bound already &&:
			// If a SmartFilter is associated with SmartChart - trigger search on the SmartFilter
			if (this._oSmartFilter) {
				this._oSmartFilter.search();
			} else {
				// Rebind Chart only if data was set on it once or no smartFilter is attached!
				this._reBindChart();
			}
		}
		// Reflect changes from the Personalization Controller to the Breadcrumbs control
		if (this._oDrillBreadcrumbs) {
			this._updateDrillBreadcrumbs();
		}
	};

	SmartChart.prototype._fireChartDataChanged = function(oChangeStatus) {
		var oChangeTypes = {
			dimeasure: false,
			filter: false,
			sort: false
		};
		// Map changeStatus to change types and then fire public event
		for ( var sChangeType in oChangeStatus) {
			if (oChangeStatus[sChangeType] !== "Unchanged") {
				oChangeTypes[sChangeType] = true;
			}
		}

		this.fireChartDataChanged({
			changeTypes: oChangeTypes
		});
	};

	/**
	 * returns the current filter and sorting options from the table personalisation/variants
	 *
	 * @private
	 * @param {object} oChangeInfo The change info given by the personalization controller
	 * @returns {sap.ui.comp.personalization.ChangeType} the merged change status
	 */
	SmartChart.prototype._getChangeStatus = function(oChangeInfo) {
		if (!oChangeInfo) {
			// change info not provided return ModelChanged to indicate that we need to update everything internally
			return sap.ui.comp.personalization.ChangeType.ModelChanged;
		}

		if (oChangeInfo.sort === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeInfo.filter === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeInfo.dimeasure === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeInfo.group === sap.ui.comp.personalization.ChangeType.ModelChanged) {
			// model has changed and was not applied to table
			return sap.ui.comp.personalization.ChangeType.ModelChanged;
		}

		if (oChangeInfo.sort === sap.ui.comp.personalization.ChangeType.TableChanged || oChangeInfo.filter === sap.ui.comp.personalization.ChangeType.TableChanged || oChangeInfo.dimeasure === sap.ui.comp.personalization.ChangeType.TableChanged || oChangeInfo.group === sap.ui.comp.personalization.ChangeType.TableChanged) {
			// change was already applied to table
			return sap.ui.comp.personalization.ChangeType.TableChanged;
		}

		return sap.ui.comp.personalization.ChangeType.Unchanged;
	};

	/**
	 * The entity set name in the OData metadata against which the chart must be bound.
	 *
	 * @param {string} sEntitySetName The entity set
	 * @public
	 */
	SmartChart.prototype.setEntitySet = function(sEntitySetName) {
		this.setProperty("entitySet", sEntitySetName);
		this._initialiseMetadata();
	};

	/**
	 * It could happen that the entity type information is set already in the view, but there is no model attached yet. This method is called once the
	 * model is set on the parent and can be used to initialise the metadata, from the model, and finally create the chart controls.
	 *
	 * @private
	 */
	SmartChart.prototype.propagateProperties = function() {
		VBox.prototype.propagateProperties.apply(this, arguments);
		this._initialiseMetadata();
	};

	/**
	 * Initialises the OData metadata necessary to create the chart
	 *
	 * @private
	 */
	SmartChart.prototype._initialiseMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(this, this._onMetadataInitialised);
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 *
	 * @private
	 */
	SmartChart.prototype._onMetadataInitialised = function() {
		this._bMetaModelLoadAttached = false;
		if (!this.bIsInitialised) {
			this._createChartProvider();
			if (this._oChartProvider) {
				this._oChartViewMetadata = this._oChartProvider.getChartViewMetadata();
				if (this._oChartViewMetadata) {

					// Indicates the control is initialised and can be used in the initialise event/otherwise!
					this.bIsInitialised = true;
					this._listenToSmartFilter();
					this._createVariantManagementControl(); // creates VariantMngmntCtrl if useVariantManagement OR useChartPersonalisation is true.
					// Control is only added to toolbar if useVariantManagement is set otherwise it acts as
					// hidden persistance helper
					this._assignData();

					this._createContent();

					this._createToolbarContent();

					this._createPersonalizationController();

					this.fireInitialise();
					// Trigger initial binding if no Variant exists -or- if it is already initialised
					if (!this._oVariantManagement || (this._oVariantManagement && this._bVariantInitialised)) {
						this._checkAndTriggerBinding();
					}
				}
			}
		}
	};

	/**
	 * Check if control needs to be bound and trigger binding accordingly.
	 *
	 * @private
	 */
	SmartChart.prototype._checkAndTriggerBinding = function() {
		if (!this._bAutoBindingTriggered) {
			this._bAutoBindingTriggered = true;
			if (this.getEnableAutoBinding()) {
				if (this._oSmartFilter) {
					this._oSmartFilter.search();
				} else {
					this._reBindChart();
				}
			}
		}
	};

	/**
	 * Creates an instance of the chart provider
	 *
	 * @private
	 */
	SmartChart.prototype._createChartProvider = function() {
		var oModel, sEntitySetName;
		sEntitySetName = this.getEntitySet();
		oModel = this.getModel();

		// The SmartChart might also needs to work for non ODataModel models; hence we now create the chart independent
		// of ODataModel.
		if (oModel && !this._bChartCreated) {
			this._aAlwaysSelect = [];
			this._aInitialSorters = [];
			this._createToolbar();
			this._createChart();
			this._addDrillBreadcrumbs();
			this._bChartCreated = true;
		}
		if (oModel && sEntitySetName) {
			this._oChartProvider = new ChartProvider({
				entitySet: sEntitySetName,
				ignoredFields: this.getIgnoredFields(),
				dateFormatSettings: this.data("dateFormatSettings"),
				defaultDropDownDisplayBehaviour: this.data("defaultDimensionDisplayBehaviour"),
				skipAnnotationParse: this.data("skipAnnotationParse"),
				chartQualifier: this.data("chartQualifier"),
				presentationVariantQualifier: this.data("presentationVariantQualifier"),
				model: oModel,
				chartLibrary: ChartLibrary
			});
		}
	};

	/**
	 * Listen to changes on the corresponding SmartFilter (if any)
	 *
	 * @private
	 */
	SmartChart.prototype._listenToSmartFilter = function() {
		var sSmartFilterId = null;
		// Register for SmartFilter Search
		sSmartFilterId = this.getSmartFilterId();

		this._oSmartFilter = this._findControl(sSmartFilterId);

		if (this._oSmartFilter) {
			this._oSmartFilter.attachSearch(this._reBindChart, this);
			this._oSmartFilter.attachFilterChange(this._filterChangeEvent, this);
		}
	};

	SmartChart.prototype._filterChangeEvent = function() {
		if (this._bIsChartBound && this._oSmartFilter && !this._oSmartFilter.getLiveMode() && !this._oSmartFilter.isDialogOpen()) {
			this._showOverlay(true);
		}
	};

	SmartChart.prototype._renderOverlay = function(bShow) {

		if (this._oChart) {

			var $this = this._oChart.$(), $overlay = $this.find(".sapUiCompSmartChartOverlay");
			if (bShow && $overlay.length === 0) {
				$overlay = jQuery("<div>").addClass("sapUiOverlay sapUiCompSmartChartOverlay").css("z-index", "1");
				$this.append($overlay);
			} else if (!bShow) {
				$overlay.remove();
			}
		}
	};
	/**
	 * sets the ShowOverlay property on the inner chart, fires the ShowOverlay event
	 *
	 * @param {boolean} bShow true to display the overlay, otherwise false
	 */
	SmartChart.prototype.showOverlay = function(bShow) {
		this._showOverlay(bShow);
	};

	/**
	 * sets the ShowOverlay property on the inner chart, fires the ShowOverlay event
	 *
	 * @param {boolean} bShow true to display the overlay, otherwise false
	 * @private
	 */
	SmartChart.prototype._showOverlay = function(bShow) {
		if (bShow) {
			var oOverlay = {
				show: true
			};
			this.fireShowOverlay({
				overlay: oOverlay
			});
			bShow = oOverlay.show;
		}
		// Flag is used in adjustHeight because setHeight call on inner chart lets overlay disappear.
		this._hasOverlay = bShow;
		this._renderOverlay(bShow);
	};

	/**
	 * searches for a certain control by its ID
	 *
	 * @param {string} sId the control's ID
	 * @returns {sap.ui.core.Control} The control found by the given Id
	 * @private
	 */
	SmartChart.prototype._findControl = function(sId) {
		var oResultControl, oView;
		if (sId) {
			// Try to get SmartFilter from Id
			oResultControl = sap.ui.getCore().byId(sId);

			// Try to get SmartFilter from parent View!
			if (!oResultControl) {
				oView = this._getView();

				if (oView) {
					oResultControl = oView.byId(sId);
				}
			}
		}

		return oResultControl;
	};

	/**
	 * searches for the controls view
	 *
	 * @returns {sap.ui.core.mvc.View} The found parental View
	 * @private
	 */
	SmartChart.prototype._getView = function() {
		if (!this._oView) {
			var oObj = this.getParent();
			while (oObj) {
				if (oObj instanceof sap.ui.core.mvc.View) {
					this._oView = oObj;
					break;
				}
				oObj = oObj.getParent();
			}
		}
		return this._oView;
	};
	/**
	 * updates the inResultDimension property on inner sap.chart.Chart. A concatenation of inResultDimension, requestAtLeast and PresentationVariant
	 * is created. called via _rebindChart and setRequestAtLeastFields.
	 *
	 * @private
	 */
	SmartChart.prototype._updateInResultDimensions = function() {
		var aUniqueInResultDimensions = this._getInResultDimensionTotal();

		// make sure that we only set inResultDims when they have changed to previous setting
		var fnCompareWithCurrentInResult = function(aNewInResult) {
			var aCurrentInResult = this.getChart().getInResultDimensions();

			// compare length first to save up some time
			if (aCurrentInResult.length != aNewInResult.length) {
				return false;
			}
			for (var i = 0, l = aCurrentInResult.length; i < l; i++) {

				if (aCurrentInResult[i] != aNewInResult[i]) {
					// Only comparing strings here, not working for objects
					return false;
				}
			}
			//True when both arrays contain the same strings
			return true;
		}.bind(this);

		// if the new InResult array has values and is different then the one already set
		if (aUniqueInResultDimensions.length > 0 && !fnCompareWithCurrentInResult(aUniqueInResultDimensions)) {
			this.getChart().setInResultDimensions(aUniqueInResultDimensions);
		}
	};

	/**
	 * This can be used to trigger binding on the chart used in the SmartChart
	 *
	 * @protected
	 */
	SmartChart.prototype.rebindChart = function() {
		this._reBindChart();
	};

	/**
	 * Re-binds the chart
	 *
	 * @private
	 */
	SmartChart.prototype._reBindChart = function() {
		var mChartPersonalisationData, aSmartFilters, aProcessedFilters = [], aFilters, oExcludeFilters, aSorters, mParameters = {}, mBindingParams = {
			preventChartBind: false
		};

		mChartPersonalisationData = this._getChartPersonalisationData() || {};

		aFilters = mChartPersonalisationData.filters;
		oExcludeFilters = mChartPersonalisationData.excludeFilters;
		aSorters = mChartPersonalisationData.sorters;

		// Get Filters and parameters from SmartFilter
		if (this._oSmartFilter) {
			aSmartFilters = this._oSmartFilter.getFilters();
			mParameters = this._oSmartFilter.getParameters() || {};
		}

		// If filters from SmartFilter exist --> process them first with SmartChart exclude filters
		// since we need to manually AND multiple multi filters!
		if (aSmartFilters && aSmartFilters.length) {
			if (oExcludeFilters) {
				aProcessedFilters = [
					new sap.ui.model.Filter([
						aSmartFilters[0], oExcludeFilters
					], true)
				];
			} else {
				aProcessedFilters = aSmartFilters;
			}
		} else if (oExcludeFilters) {
			aProcessedFilters = [
				oExcludeFilters
			];
		}
		// Combine the resulting processed filters with SmartChart include filters
		if (aFilters) {
			aFilters = aProcessedFilters.concat(aFilters);
		} else {
			aFilters = aProcessedFilters;
		}

		// updateInResultDimensions before re-binding the chart
		this._updateInResultDimensions();

		// Enable some default parameters
		mParameters["entitySet"] = this.getEntitySet();
		if (!aSorters) {
			aSorters = [];
		}

		mBindingParams.filters = aFilters;
		mBindingParams.sorter = aSorters;
		mBindingParams.parameters = mParameters;

		// fire event to enable user modification of certain binding options (Ex: Filters)
		this.fireBeforeRebindChart({
			bindingParams: mBindingParams
		});

		if (!mBindingParams.preventChartBind) {
			aSorters = mBindingParams.sorter;
			aFilters = mBindingParams.filters;
			mParameters = mBindingParams.parameters;
			this._oChart.setBusy(true);

			this._bDataLoadPending = true;

			var oData = {
				path: this.getChartBindingPath() || ("/" + this.getEntitySet()),
				parameters: mParameters,
				filters: aFilters,
				sorter: aSorters,
				events: {
					dataReceived: function(mEventParams) {

						// AnalyticalBinding fires dataReceived too early
						if (mEventParams && mEventParams.getParameter && mEventParams.getParameter("__simulateAsyncAnalyticalBinding")) {
							return;
						}

						this._onDataLoadComplete(mEventParams, true);
						// notify any listeners
						this.fireDataReceived(mEventParams);
					}.bind(this),
					change: this._onDataLoadComplete.bind(this)
				}
			};

			if (mBindingParams.length) {
				oData.length = Math.min(mBindingParams.length, 100);
			} else {
				var iMaxItems = this._oChartProvider.getMaxItems();

				if (iMaxItems > 0) {
					oData.length = iMaxItems;
				}
			}

			this._oChart.bindData(oData);

			this._showOverlay(false);

			// Flag to indicate if Chart was bound (data fetch triggered) at least once
			this._bIsChartBound = true;
		}
	};

	SmartChart.prototype._onDataLoadComplete = function(mEventParams, bForceUpdate) {

		if (this._oSemanticalNavButton) {
			this._oSemanticalNavButton.setEnabled(false);
		}

		if (this._bDataLoadPending || bForceUpdate) {
			this._bDataLoadPending = false;

			this._updateAvailableChartType();
			this._oChart.setBusy(false);
		}
	};

	SmartChart.prototype._assignData = function() {
		if (this._oChartViewMetadata && this._oChart) {
			if (this._oChartViewMetadata.measureFields && (this._oChartViewMetadata.measureFields.length > 0)) {
				this._oChart.setVisibleMeasures(this._oChartViewMetadata.measureFields);
			}

			if (this._oChartViewMetadata.dimensionFields && (this._oChartViewMetadata.dimensionFields.length > 0)) {
				this._oChart.setVisibleDimensions(this._oChartViewMetadata.dimensionFields);
			}

			if (!this.getChartType() && this._oChartViewMetadata.chartType) {
				this._setChartType(this._oChartViewMetadata.chartType);
			}
		}
	};

	SmartChart.prototype._createP13nObject = function(oField) {

		// add to initial sorters
		if (oField.sortable && oField.sorted) {
			var oSortItem = {
				columnKey: oField.name,
				operation: oField.sortOrder
			};

			// rebind to apply initial sorting
			this._aInitialSorters.push(oSortItem);
		}

		return {
			columnKey: oField.name,
			leadingProperty: oField.name, // used to fetch data, by adding this to $select param of OData request
			additionalProperty: oField.additionalProperty, // additional data to fetch in $select
			sortProperty: oField.sortable ? oField.name : undefined,
			filterProperty: oField.filterable ? oField.name : undefined,
			type: oField.filterType,
			maxLength: oField.maxLength,
			precision: oField.precision,
			scale: oField.scale,
			isMeasure: oField.isMeasure,
			isDimension: oField.isDimension,
			aggregationRole: oField.aggregationRole,
			label: oField.fieldLabel,
			tooltip: oField.quickInfo,
			sorted: oField.sorted,
			sortOrder: oField.sortOrder
		};

	};

	/**
	 * Creates the content based on the metadata/configuration
	 *
	 * @private
	 */
	SmartChart.prototype._createContent = function() {

		jQuery.sap.require("sap.ui.comp.util.FormatUtil");

		var i, iLen = 0, oField, oChartObject, mProperties, aSortFilterableItems = [], oP13nDataObj, that = this;
		var aDataPoints = [];
		this._aColumnKeysOrdered = [];

		//chart annotation overrules the entity type ordering
		jQuery.extend(this._aColumnKeysOrdered, this._oChartViewMetadata.dimensionFields);
		this._aColumnKeysOrdered = this._aColumnKeysOrdered.concat(this._oChartViewMetadata.measureFields);

		iLen = this._oChartViewMetadata.fields.length;
		for (i = 0; i < iLen; i++) {

			oChartObject = null;

			oField = this._oChartViewMetadata.fields[i];

			if (this._aColumnKeysOrdered.indexOf(oField.name) === -1) {
				this._aColumnKeysOrdered.push(oField.name);
			}

			// Only create P13n data when there is no dimension/measure existing for this field
			// Custom dimensions/measures have to provide their own P13n data as JSON
			if (this.getChart().getDimensionByName(oField.name) === undefined && this.getChart().getMeasureByName(oField.name) === undefined) {
				oP13nDataObj = this._createP13nObject(oField);

				mProperties = {
					name: oField.name,
					label: oField.fieldLabel
				};
			}
			// Check if should always be in Result of query
			if (oField.inResult) {
				this._aAlwaysSelect.push(oField.name);
			}

			if (oField.isDimension) {
				// Check if dimension was already set from outside
				if (this.getChart().getDimensionByName(oField.name) === undefined) {
					oChartObject = new Dimension(mProperties);
					this._oChart.addDimension(oChartObject);

					if (oField.description) {
						oChartObject.setTextProperty(oField.description);

						/* eslint-disable no-loop-func */
						oChartObject.setTextFormatter(function(sKey, sText) {
							var sName = this.getIdentity();
							var sDisplayBehaviour = that._getDisplayBehaviour(sName);
							return sap.ui.comp.util.FormatUtil.getFormattedExpressionFromDisplayBehaviour(sDisplayBehaviour, sKey, sText);
						});
						/* eslint-enable no-loop-func */
					} else if (oField.dateFormatter) {
						oChartObject.setTextFormatter(oField.dateFormatter);
					}
				} else {
					// If dimension was existing already, then parse the p13n JSON to object.
					var oP13nData = this.getChart().getDimensionByName(oField.name).data("p13nData");
					if (oP13nData) {
						// Check if p13nData is a String (defined in XML view ) or already an object (defined in JavaScript)
						this.getChart().getDimensionByName(oField.name).data("p13nData", typeof oP13nData === "string" ? JSON.parse(oP13nData) : oP13nData);
					}
				}

			} else if (oField.isMeasure) {
				// Check if measure was already set from outside
				if (this.getChart().getMeasureByName(oField.name) === undefined) {
					oChartObject = new Measure(mProperties);
					this._oChart.addMeasure(oChartObject);

					if (oField.dataPoint) {
						// remember data point to for semantics
						aDataPoints.push({
							dataPoint: oField.dataPoint,
							measure: oChartObject
						});
					}

					if (oField.unit) {
						oChartObject.setUnitBinding(oField.unit);
					}
				} else {
					// If measure was existing already, then parse the p13n JSON to object.
					var oP13nData = this.getChart().getMeasureByName(oField.name).data("p13nData");
					if (oP13nData) {
						// Check if p13nData is a String (defined in XML view ) or already an object (defined in JavaScript)
						this.getChart().getMeasureByName(oField.name).data("p13nData", typeof oP13nData === "string" ? JSON.parse(oP13nData) : oP13nData);
					}
				}

			} else if (oField.sortable || oField.filterable) {
				aSortFilterableItems.push(oP13nDataObj);
			}

			if (oChartObject) {
				if (oField.role) {
					oChartObject.setRole(oField.role);
				}
				oChartObject.data("p13nData", oP13nDataObj);
			}
		}

		if (this._oChart) {
			this._oChart.data("p13nData", aSortFilterableItems);
		}

		// enrich from data points when all measures are there
		if (aDataPoints.length > 0) {
			this._enrichFromDataPoints(aDataPoints);
		}
	};

	SmartChart.prototype._getDisplayBehaviour = function(sName) {

		var oField = this._getField(sName);
		if (oField) {
			return oField.displayBehaviour;
		}

		return "";
	};

	SmartChart.prototype._getField = function(sName) {
		var oField, i, iLen;

		if (sName && this._oChartViewMetadata && this._oChartViewMetadata.fields) {
			iLen = this._oChartViewMetadata.fields.length;
			for (i = 0; i < iLen; i++) {
				oField = this._oChartViewMetadata.fields[i];
				if (oField.name === sName) {
					return oField;
				}
			}
		}

		return null;
	};
	/**
	 * Creates a Chart based on the configuration, if necessary. This also prepares the methods to be used based on the chart type.
	 *
	 * @private
	 */
	SmartChart.prototype._createChart = function() {
		var aContent = this.getItems(), iLen = aContent ? aContent.length : 0, oChart;
		// Check if a Chart already exists in the content (Ex: from view.xml)
		while (iLen--) {
			oChart = aContent[iLen];
			if (oChart instanceof Chart) {
				break;
			}
			oChart = null;
		}
		// If a Chart exists use it, else create one!
		if (oChart) {
			this._oChart = oChart;
		} else {
			this._oChart = new Chart({
				uiConfig: {
					applicationSet: 'fiori'
				},
				// Needs to be set in order to visualize busy indicator when binding happens very fast
				busyIndicatorDelay: 0,
				vizProperties: {
					title: {
						text: ''
					},
					plotArea: {
						dataLabel: {
							// visible: true,
							hideWhenOverlap: false
						}
					},
					general: {
						groupData: false
					},
					categoryAxis: {
						layout: {
							autoHeight: true,
							autoWidth: true
						}
					}
				},
				selectionMode: this.getSelectionMode(),
				width: "100%"
			});

			this._toggleChartTooltipVisibility(this.getShowChartTooltip());
			this._setBehaviorTypeForDataSelection();
			this.insertItem(this._oChart, 2);
		}
		//Check for legend visibility, once vizFrame is created.
		this.setLegendVisible(this.getLegendVisible());

		if (!this._oChart.getLayoutData()) {
			var oFlexItemData = {
				growFactor: 1
			};

			var oLayoutData = this.getLayoutData();
			var sSmartChartBaseSize = null;
			if (oLayoutData && oLayoutData.getBaseSize) {
				sSmartChartBaseSize = oLayoutData.getBaseSize();
			}

			if (sSmartChartBaseSize) {
				oFlexItemData.baseSize = "100%";
			}

			this._oChart.setLayoutData(new sap.m.FlexItemData(oFlexItemData));
		}
		if (this.getChartType()) {
			this._setChartType(this.getChartType());
		}
		// Attach in order to re-set overlay when framework fires rerender events (like VariantManagement when saving a variant)
		this._oChart.attachRenderComplete(function() {
			// If overlay is active, it need to be set again because of setHeight on oChart
			if (this._hasOverlay) {
				setTimeout(function() {
					this._showOverlay(true);
				}.bind(this), 0);
			}
		}.bind(this));

		this._createTooltipOrPopover();
	};

	SmartChart.prototype._toggleChartTooltipVisibility = function(bFlag) {

		if (this._oChart) {
			if (bFlag) {
				if (!this._vizTooltip) {
					this._vizTooltip = new VizTooltip();
				}
				// Make this dynamic for setter calls
				this._vizTooltip.connect(this.getChart().getVizUid());
			} else {
				if (this._vizTooltip) {
					this._vizTooltip.destroy();
				}
			}
		}
	};

	/**
	 * updates the formatter of vizPopover / vizTooltip based on current chartType PERCENT formatter for all 100% chartTypes STANDARDFLOAT formatter
	 * otherwise.
	 *
	 * @private
	 */
	SmartChart.prototype._updateVizTooltipFormatter = function() {
		// Needs to be called when tooltip gets enabled and when chartType changes!
		if (this._vizTooltip) {
			if (this.getChart().getChartType().match(/100/) !== null) {
				this._vizTooltip.setFormatString(sap.viz.ui5.format.ChartFormatter.DefaultPattern.PERCENT);
			} else {
				this._vizTooltip.setFormatString(sap.viz.ui5.format.ChartFormatter.DefaultPattern.STANDARDFLOAT);
			}
		}
	};

	/**
	 * Returns the chart object used internally.<br>
	 * <b>Note:</b> Direct changes made to the inner {@link sap.chart.Chart chart} object or its {@link sap.viz.ui5.controls.VizFrame vizFrame} might
	 * lead to inconsistencies and side effects during runtime, as the <code>SmartChart</code> control doesn't listen to all changes made to the
	 * inner {@link sap.chart.Chart chart} instance. To avoid this, please use the API provided by the <code>SmartChart</code> control itself.
	 *
	 * @returns {object} The inner chart object
	 * @public
	 */
	SmartChart.prototype.getChart = function() {
		return this._oChart;
	};

	SmartChart.prototype._getChartTypes = function() {
		var mChartTypes;
		try {
			mChartTypes = sap.chart.api.getChartTypes();
		} catch (ex) {
			mChartTypes = {};
			jQuery.sap.log.error("sap.chart.api..getChartTypes throws an exception.\n" + ex.toString());
		}

		return mChartTypes;
	};

	SmartChart.prototype._getAvailableChartTypes = function() {
		var i, sKey, aAvailableChartTypes = [], aChartTypes, mChartTypes = {}, aIgnoredChartTypes;

		if (this._oChart) {

			aIgnoredChartTypes = PersoUtil.createArrayFromString(this.getIgnoredChartTypes());

			mChartTypes = this._getChartTypes();
			aChartTypes = this._oChart.getAvailableChartTypes().available;
			if (aChartTypes) {
				for (i = 0; i < aChartTypes.length; i++) {
					sKey = aChartTypes[i].chart;
					if (aIgnoredChartTypes.indexOf(sKey) < 0) {
						aAvailableChartTypes.push({
							key: sKey,
							text: mChartTypes[sKey]
						});
					}
				}
			}
		}

		return aAvailableChartTypes;
	};

	SmartChart.prototype._getAllChartTypes = function() {
		var sKey, aAllChartTypes = [], mChartTypes, aIgnoredChartTypes;

		aIgnoredChartTypes = PersoUtil.createArrayFromString(this.getIgnoredChartTypes());

		mChartTypes = this._getChartTypes();

		for (sKey in mChartTypes) {
			if (sKey) {
				if (aIgnoredChartTypes.indexOf(sKey) < 0) {
					aAllChartTypes.push({
						key: sKey,
						text: mChartTypes[sKey]
					});
				}
			}
		}

		return aAllChartTypes;
	};

	SmartChart.prototype._retrieveChartTypeDescription = function(sCharType) {
		var mChartTypes = this._getChartTypes();
		return ({
			key: sCharType,
			text: mChartTypes[sCharType]
		});
	};

	SmartChart.prototype._setChartType = function(sChartType) {

		if (this._oChart) {
			var sHeight = this._oChart.getHeight();
			this._oChart.setChartType(sChartType);

			// clear selected detail entries
			this._aDetailsEntries = [];
			this._updateVizTooltipFormatter();

			// toggle the unit bindings of each measure based on chart type
			this._toggleMeasureUnitBinding(sChartType, this._oChart.getMeasures());
			// to be save set the Height again as it sometimes shrinked
			this._oChart.setHeight(sHeight);
		}
	};

	SmartChart.prototype._toggleMeasureUnitBinding = function(sChartType, aMeasures) {

		if (typeof aMeasures != 'undefined' && aMeasures instanceof Array) {

			if (sChartType.substring(0, 4) === "100_") {
				// Delete all unit bindings when chartType is percentage type
				aMeasures.forEach(function(oMeasure) {
					oMeasure.setUnitBinding();
				});
			} else {

				if (this._oChartProvider) {
					// Bring back the unit bindings for each measure from the metadata fields.
					var aFieldMetadata = this._oChartProvider._aODataFieldMetadata;

					aMeasures.forEach(function(oMeasure) {
						// Run until we found the correct field
						for (var i = aFieldMetadata.length - 1; i >= 0; i--) {
							if (aFieldMetadata[i].name == oMeasure.getName()) {
								if (aFieldMetadata[i]["Org.OData.Measures.V1.ISOCurrency"] && aFieldMetadata[i]["Org.OData.Measures.V1.ISOCurrency"].Path) {
									oMeasure.setUnitBinding(aFieldMetadata[i]["Org.OData.Measures.V1.ISOCurrency"].Path);
								}
								break;
							}
						}
					});
				}
			}
		}
	};

	SmartChart.prototype._getDimensions = function() {
		var aDimensions = [];

		if (this._oChart) {
			aDimensions = this._oChart.getDimensions();
		}

		return aDimensions;
	};

	SmartChart.prototype._getVisibleDimensions = function() {
		var aVisibleDimensions = [];

		if (this._oChart) {
			aVisibleDimensions = this._oChart.getVisibleDimensions();
		}

		return aVisibleDimensions;
	};

	SmartChart.prototype._getMeasures = function() {
		var aMeasures = [];

		if (this._oChart) {
			aMeasures = this._oChart.getMeasures();
		}

		return aMeasures;
	};

	SmartChart.prototype._getVisibleMeasures = function() {
		var aVisibleMeasures = [];

		if (this._oChart) {
			aVisibleMeasures = this._oChart.getVisibleMeasures();
		}

		return aVisibleMeasures;
	};

	SmartChart.prototype._getSortedDimensions = function() {
		var aDimensions = [];
		if (this._oChart) {
			aDimensions = this._oChart.getDimensions();
			if (aDimensions) {
				aDimensions.sort(function(a, b) {
					if (a.getLabel() && b.getLabel()) {
						return a.getLabel().localeCompare(b.getLabel());
					}
				});
			}
		}
		return aDimensions;
	};

	/**
	 * Interface function for the SmartVariantManagement control that returns the currently used variant data.
	 *
	 * @public
	 * @returns {json} The currently used variant
	 */
	SmartChart.prototype.fetchVariant = function() {
		if (this._oCurrentVariant === "STANDARD" || this._oCurrentVariant === null) {
			return {};
		}

		return this._oCurrentVariant;
	};

	/**
	 * Interface function for SmartVariantManagement control that applies the current variant.
	 *
	 * @param {Object} oVariantJSON The variant JSON
	 * @param {string} sContext Describes the context in which the variant has been applied
	 * @public
	 */
	SmartChart.prototype.applyVariant = function(oVariantJSON, sContext) {
		this._oCurrentVariant = oVariantJSON;
		if (this._oCurrentVariant === "STANDARD") {
			this._oCurrentVariant = null;
		}

		// Set instance flag to indicate that we are currently in the process of applying the changes
		this._bApplyingVariant = true;

		if (this._oPersController) {
			if (this._oCurrentVariant === null || jQuery.isEmptyObject(this._oCurrentVariant)) {
				this._oPersController.resetPersonalization(sap.ui.comp.personalization.ResetType.ResetFull);
			} else {
				this._oPersController.setPersonalizationData(this._oCurrentVariant);
			}
		}

		// Clear apply variant flag!
		this._bApplyingVariant = false;

		this.fireAfterVariantApply({
			currentVariantId: this.getCurrentVariantId()
		});
	};

	/**
	 * Interface function for SmartVariantManagment control. It indicates, that the variant management is fully initialized.
	 *
	 * @internal
	 */
	SmartChart.prototype.variantsInitialized = function() {
		this._bVariantInitialised = true;
		this._checkAndTriggerBinding();
	};

	/**
	 * The method returns the current UI state of SmartChart control.
	 *
	 * @returns {sap.ui.comp.state.UIState} Current UI state
	 * @public
	 */
	SmartChart.prototype.getUiState = function() {
		var oUIStateP13n = this._oPersController ? this._oPersController.getDataSuiteFormatSnapshot() : null;
		return new UIState({
			presentationVariant: {
				// PresentationVariantID: jQuery.sap.uid(),
				ContextUrl: "", // TODO
				MaxItems: this._oChartProvider ? this._oChartProvider.getMaxItems() : undefined,
				SortOrder: oUIStateP13n ? oUIStateP13n.SortOrder : [],
				GroupBy: oUIStateP13n ? oUIStateP13n.GroupBy : [],
				Total: oUIStateP13n ? oUIStateP13n.Total : [],
				RequestAtLeast: this._getInResultDimensionTotal(),
				Visualizations: oUIStateP13n ? oUIStateP13n.Visualizations : []
			},
			selectionVariant: {
				SelectOptions: oUIStateP13n ? oUIStateP13n.SelectOptions : []
			},
			variantName: this.getCurrentVariantId()
		});
	};

	/**
	 * The method replaces the current UI state of SmartChart control with
	 * the data represented in <code>uiState</code>.
	 *
	 * @param {sap.ui.comp.state.UIState} oUIState the new representation of UI state
	 * @public
	 */
	SmartChart.prototype.setUiState = function(oUIState) {
		if (!oUIState.getPresentationVariant() && !oUIState.getPresentationVariant().Visualizations.some(function(oVisualization) {
			return oVisualization.Type === "Chart";
		})) {
			jQuery.sap.log.error("sap.ui.comp.smartchart.SmartChart.prototype.setDataSuiteFormatSnapshot: 'Visualizations' array should contain at least one 'Chart' entry");
			return;
		}
		if (this._oPersController) {
			var oPersistentDataVariant = (this._oVariantManagement && oUIState.getVariantName()) ? this._oVariantManagement.getVariantContent(this, oUIState.getVariantName()) : {};
			this._oPersController.setDataSuiteFormatSnapshot(jQuery.extend(true, {}, oUIState.getPresentationVariant(), oUIState.getSelectionVariant()), oPersistentDataVariant);
		}

		// TODO what is about MaxItems? How should it be set into oChart? Do we need a rebind for it?
		// TODO Do we need a rebind after 'InResult' is set?
		if (oUIState.getPresentationVariant()) {
			this._oChart.setInResultDimensions(oUIState.getPresentationVariant().RequestAtLeast);
		}
	};

	SmartChart.prototype.setRequestAtLeastFields = function(sRequestAtLeastFields) {
		this.setProperty("requestAtLeastFields", sRequestAtLeastFields);
		if (this._oChart) {
			this._updateInResultDimensions();
		}
	};

	SmartChart.prototype._getInResultDimensionTotal = function() {
		var aInResultDimensions = [];

		// From requestAtLeast property
		if (this.getRequestAtLeastFields()) {
			aInResultDimensions = this.getRequestAtLeastFields().split(",");
		}
		// From presentationVariant
		aInResultDimensions = aInResultDimensions.concat(this._aAlwaysSelect);
		// From inner chart inResultDimension property
		if (this.getChart()) {
			aInResultDimensions = aInResultDimensions.concat(this.getChart().getInResultDimensions());
		}
		// Get rid of double entries
		return aInResultDimensions.filter(function(elem, index, self) {
			return index == self.indexOf(elem);
		});
	};

	SmartChart.prototype._getFieldTooltip = function(sKey) {
		var oField = this._getFieldByKey(sKey);
		if (oField) {
			return oField.quickInfo;
		}

		return "";
	};
	SmartChart.prototype._getFieldByKey = function(sKey) {

		var i, oField = null;

		if (this._oChartViewMetadata && this._oChartViewMetadata.fields) {
			for (i = 0; i < this._oChartViewMetadata.fields.length; i++) {

				oField = this._oChartViewMetadata.fields[i];
				if (sKey === oField.name) {
					return oField;
				}
			}

			return null;
		}
	};

	/**
	 * Returns the column for the given column key
	 *
	 * @param {array} aArray list of chart objects
	 * @param {string} sKey - the column key for the required column
	 * @returns {object} The found column or null
	 * @private
	 */
	SmartChart.prototype._getByKey = function(aArray, sKey) {
		var i, iLength, oCharObj, oCustomData;

		if (aArray) {
			iLength = aArray.length;
			for (i = 0; i < iLength; i++) {
				oCharObj = aArray[i];
				oCustomData = oCharObj.data("p13nData");
				if (oCustomData && oCustomData.columnKey === sKey) {
					return oCharObj;
				}
			}
		}

		return null;
	};

	SmartChart.prototype._getDimensionByKey = function(sKey) {
		if (this._oChart) {
			return this._getByKey(this._oChart.getDimensions(), sKey);
		}

		return null;
	};

	SmartChart.prototype._getMeasureByKey = function(sKey) {
		if (this._oChart) {
			return this._getByKey(this._oChart.getMeasures(), sKey);
		}

		return null;
	};

	SmartChart.prototype._getChartObjByKey = function(sKey) {
		var oChartObj = this._getDimensionByKey(sKey);
		if (!oChartObj) {
			oChartObj = this._getMeasureByKey(sKey);
		}

		return oChartObj;
	};

	/**
	 * Retrieves the path for the specified property and column key from the array of table columns
	 *
	 * @param {string} sColumnKey - the column key specified on the table
	 * @param {string} sProperty - the property path that needs to be retrieved from the column
	 * @returns {string} The path that can be used by sorters, filters etc.
	 * @private
	 */
	SmartChart.prototype._getPathFromColumnKeyAndProperty = function(sColumnKey, sProperty) {
		var sPath = null, oChartObj, oCustomData;
		oChartObj = this._getChartObjByKey(sColumnKey);

		// Retrieve path from the property
		if (oChartObj) {
			oCustomData = oChartObj.data("p13nData");
			if (oCustomData) {
				sPath = oCustomData[sProperty];
			}
		}

		return sPath;
	};

	/**
	 * returns the current filter and sorting options from the table personalisation/variants
	 *
	 * @private
	 * @returns {object} current variant's filter and sorting options
	 */
	SmartChart.prototype._getChartPersonalisationData = function() {
		if (!this._oCurrentVariant) {
			return null;
		}
		var aSorters = [], aFilters = [], aExcludeFilters = [], oExcludeFilters, aSortData, sPath;

		// Sort handling
		if (this._oCurrentVariant.sort) {
			aSortData = this._oCurrentVariant.sort.sortItems;
		} else {
			aSortData = this._aInitialSorters;
		}

		if (aSortData) {
			aSortData.forEach(function(oModelItem) {
				var bDescending = oModelItem.operation === "Descending";
				sPath = oModelItem.columnKey;
				aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));

			}, this);
		}

		// Filter Handling
		if (this._oCurrentVariant.filter) {
			this._oCurrentVariant.filter.filterItems.forEach(function(oModelItem) {
				var oValue1 = oModelItem.value1, oValue2 = oModelItem.value2;
				// Filter path has be re-calculated below
				sPath = oModelItem.columnKey;

				if (oValue1 instanceof Date && this._oChartProvider && this._oChartProvider.getIsUTCDateHandlingEnabled()) {
					oValue1 = FilterProvider.getDateInUTCOffset(oValue1);
					oValue2 = oValue2 ? FilterProvider.getDateInUTCOffset(oValue2) : oValue2;
				}
				if (oModelItem.exclude) {
					aExcludeFilters.push(new Filter(sPath, FilterOperator.NE, oValue1));
				} else {
					aFilters.push(new Filter(sPath, oModelItem.operation, oValue1, oValue2));
				}
			}, this);

			if (aExcludeFilters.length) {
				oExcludeFilters = new Filter(aExcludeFilters, true);
			}
		}

		return {
			filters: aFilters,
			excludeFilters: oExcludeFilters,
			sorters: aSorters
		};
	};

	/**
	 * triggers (hidden) VariantManagementControl to persist personalisation this function is called in case no VariantManagementControl is used
	 *
	 * @private
	 */
	SmartChart.prototype._persistPersonalisation = function() {
		var that = this;
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.getVariantsInfo(function(aVariants) {
				var sPersonalisationVariantKey = null;
				if (aVariants && aVariants.length > 0) {
					sPersonalisationVariantKey = aVariants[0].key;
				}

				var bOverwrite = sPersonalisationVariantKey !== null;

				var oParams = {
					name: "Personalisation",
					global: false,
					overwrite: bOverwrite,
					key: sPersonalisationVariantKey,
					def: true
				};
				that._oVariantManagement.fireSave(oParams);
			});
		}
	};

	/**
	 * Returns the ID of the currently selected variant.
	 *
	 * @public
	 * @returns {string} ID of the currently selected variant
	 */
	SmartChart.prototype.getCurrentVariantId = function() {
		var sKey = "";

		if (this._oVariantManagement) {
			sKey = this._oVariantManagement.getCurrentVariantId();
		}

		return sKey;
	};

	/**
	 * Applies the current variant based on the sVariantId parameter. If an empty string or null or undefined have been passed, the standard variant
	 * will be used. The standard variant will also be used if the passed sVariantId cannot be found. If the flexibility variant, the content for the
	 * standard variant, or the personalizable control cannot be obtained, no changes will be made.
	 *
	 * @public
	 * @param {string} sVariantId ID of the currently selected variant
	 */
	SmartChart.prototype.setCurrentVariantId = function(sVariantId) {
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.setCurrentVariantId(sVariantId);
		} else {
			jQuery.sap.log.error("sap.ui.comp.smartchart.SmartChart.prototype.setCurrentVariantId: VariantManagement does not exist or is a page variant");
		}
	};

	SmartChart.prototype._adjustHeight = function() {
		// only if chart is not in full screen
		if (this._oChart && !this.bFullScreen) {
			var iToolbarHeight = 0, iBreadCrumbsHeight = 0;
			// Only save height when not in full-screen mode
			var iHeight = this.getDomRef() ? this.getDomRef().offsetHeight : 0;

			if (iHeight === 0) {
				return;
			}

			if (this._oToolbar && this._oToolbar.getDomRef()) {
				iToolbarHeight = this._oToolbar.getDomRef().offsetHeight;
			}

			if (this._oDrillBreadcrumbs && this._oDrillBreadcrumbs.getDomRef()) {
				// breadcrumbs are rendered inside a div and have margins
				var oBreadcrumbsNode = this._oDrillBreadcrumbs.getDomRef().parentNode ? this._oDrillBreadcrumbs.getDomRef().parentNode : this._oDrillBreadcrumbs.getDomRef();
				iBreadCrumbsHeight = oBreadcrumbsNode.offsetHeight;
			}

			// store old chart Height
			this._iChartHeight = iHeight - iToolbarHeight - iBreadCrumbsHeight;
			this._oChart.setHeight(this._iChartHeight + "px");
			// update breadcrumbs in order to react on size changes of the window
			// TODO: Evaluate for a more lightweight solution in the future.
			this._updateDrillBreadcrumbs();
			// If overlay is active, it need to be set again because of setHeight on oChart
			if (this._hasOverlay) {
				setTimeout(function() {
					this._showOverlay(true);
				}.bind(this), 0);
			}
		}
	};

	SmartChart.prototype._toggleFullScreen = function(bValue, bForced) {
		if (!this.oFullScreenButton || (bValue === this.bFullScreen && !bForced)) {
			return;
		}

		this.bFullScreen = bValue;
		if (!this._oFullScreenUtil) {
			this._oFullScreenUtil = sap.ui.requireSync("sap/ui/comp/util/FullScreenUtil");
		}
		this._oFullScreenUtil.toggleFullScreen(this, this.bFullScreen, this.oFullScreenButton, this._toggleFullScreen.bind(this, false));

		this._renderFullScreenButton();
		// Fire the fullScreen Event
		this.fireFullScreenToggled({
			fullScreen: bValue
		});

		if (this._oChart) {
			var sHeight = this.bFullScreen ? "100%" : (this._iChartHeight + "px");
			this._oChart.setHeight(sHeight);

			// only process height adjustment when chart is not in full screen mode
			// otherwise the 100% does the adjustment
			this._processResizeHandler(!this.bFullScreen);
		}
	};

	/**
	 * Renders the look and feel of the full screen button
	 */
	SmartChart.prototype._renderFullScreenButton = function() {
		this.oFullScreenButton.setTooltip(this.bFullScreen ? this._oRb.getText("CHART_MINIMIZEBTN_TOOLTIP") : this._oRb.getText("CHART_MAXIMIZEBTN_TOOLTIP"));
		this.oFullScreenButton.setText(this.bFullScreen ? this._oRb.getText("CHART_MINIMIZEBTN_TEXT") : this._oRb.getText("CHART_MAXIMIZEBTN_TEXT"));
		this.oFullScreenButton.setIcon(this.bFullScreen ? "sap-icon://exit-full-screen" : "sap-icon://full-screen");
	};

	/**
	 * Enriches the chart with data point information.
	 *
	 * @param {array} aDataPoints collection of data points and measures
	 * @private
	 */
	SmartChart.prototype._enrichFromDataPoints = function(aDataPoints) {
		var iLen = aDataPoints.length;

		var aColoringMeasures = [];

		var oMeasureValues = {};

		for (var i = 0; i < iLen; i++) {
			this._interpretDataPoint(aDataPoints[i].dataPoint, aDataPoints[i].measure, oMeasureValues, aColoringMeasures);
		}

		// switch the coloring
		if (aColoringMeasures.length > 0) {
			this._oChart.setActiveColoring({
				coloring: sap.chart.ColoringType.Criticality,
				parameters: {
					measure: aColoringMeasures
				}
			});

			this._oChart.setColorings({
				Criticality: {
					MeasureValues: oMeasureValues
				}
			});
		}
	};

	/**
	 * Interprets the data point information to patterns, boundaries and coloring.
	 *
	 * @param {object} oDataPoint UI.DataPoint annotation
	 * @param {object} oMeasure current measure
	 * @param {object} oMeasureValues current criticality measure values to enhance
	 * @param {array} aColoringMeasures array containing all measures for which coloring should be updated
	 * @returns {boolean} <code>true</code> if coloring for the current measure is set
	 * @private
	 */
	SmartChart.prototype._interpretDataPoint = function(oDataPoint, oMeasure, oMeasureValues, aColoringMeasures) {
		this._setSemanticPatterns(oDataPoint, oMeasure);

		if (oMeasure.setBoundaryValues) {
			this._setBoundaryValues(oDataPoint, oMeasure);
		}

		// semantic coloring
		if (oDataPoint.Criticality || oDataPoint.CriticalityCalculation) {
			oMeasureValues[oDataPoint.Value.Path] = this._oChartProvider.provideSemanticColoring(oDataPoint);
			aColoringMeasures.push(oDataPoint.Value.Path);
		}

	};

	/**
	 * Sets the semantic patterns for the UI.DataPoint annotation
	 *
	 * @param {object} oDataPoint UI.DataPoint annotation
	 * @Param {object} oMeasure current measure
	 * @private
	 */
	SmartChart.prototype._setSemanticPatterns = function(oDataPoint, oMeasure) {
		// semantic patterns
		var sReferenceMeasureName = oDataPoint.TargetValue ? oDataPoint.TargetValue.Path : null;
		var sProjectedMeasureName = oDataPoint.ForecastValue ? oDataPoint.ForecastValue.Path : null;

		oMeasure.setSemantics(sap.chart.data.MeasureSemantics.Actual);

		if (sReferenceMeasureName != null) {
			var oReferenceMeasure = this._oChart.getMeasureByName(sReferenceMeasureName);
			if (oReferenceMeasure) {
				oReferenceMeasure.setSemantics(sap.chart.data.MeasureSemantics.Reference);
			} else {
				jQuery.sap.log.error("sap.ui.comp.SmartChart: " + oDataPoint.TargetValue.Path + " is not a valid measure");
			}
		}
		if (sProjectedMeasureName) {
			var oProjectionMeasure = this._oChart.getMeasureByName(sProjectedMeasureName);
			if (oProjectionMeasure) {
				oProjectionMeasure.setSemantics(sap.chart.data.MeasureSemantics.Projected);
			} else {
				jQuery.sap.log.error("sap.ui.comp.SmartChart: " + oDataPoint.ForecastValue.Path + " is not a valid measure");
			}
		}

		oMeasure.setSemanticallyRelatedMeasures({
			referenceValueMeasure: sReferenceMeasureName,
			projectedValueMeasure: sProjectedMeasureName
		});

	};

	/**
	 * Sets the boundary values for the UI.DataPoint annotation.
	 *
	 * @param {object} oDataPoint UI.DataPoint annotation
	 * @Param {object} oMeasure current measure
	 * @private
	 */
	SmartChart.prototype._setBoundaryValues = function(oDataPoint, oMeasure) {
		var oBoundaryValues = {};

		if (oDataPoint.MinimumValue) {
			oBoundaryValues.minimum = oDataPoint.MinimumValue;
		}
		if (oDataPoint.MaximumValue) {
			oBoundaryValues.maximum = oDataPoint.MaximumValue;
		}

		if (oBoundaryValues.minimum || oBoundaryValues.maximum) {
			oMeasure.setBoundaryValues(oBoundaryValues);
		}
	};

	/**
	 * Checks whether the control is initialized.
	 *
	 * @returns {boolean} returns whether the control is already initialized
	 * @protected
	 */
	SmartChart.prototype.isInitialised = function() {
		return !!this.bIsInitialised;
	};

	/**
	 * Cleans up the control.
	 *
	 * @protected
	 */
	SmartChart.prototype.exit = function() {

		this._oRb = null;

		if (this._oSmartFilter) {
			this._oSmartFilter.detachSearch(this._reBindChart, this);
			this._oSmartFilter.detachFilterChange(this._filterChangeEvent, this);
		}

		if (this._oChartProvider && this._oChartProvider.destroy) {
			this._oChartProvider.destroy();
		}
		this._oChartProvider = null;

		if (this._oPersController && this._oPersController.destroy) {
			this._oPersController.destroy();
		}

		if (this._oSegmentedButton) {
			this._oSegmentedButton.removeAllButtons();
			this._oButtonChart1.destroy();
			this._oButtonChart2.destroy();
			this._oButtonChart3.destroy();
			this._oButtonChart4.destroy();
			this._oButtonChart5.destroy();

			this._oButtonChart1 = null;
			this._oButtonChart2 = null;
			this._oButtonChart3 = null;
			this._oButtonChart4 = null;
			this._oButtonChart5 = null;
		}

		this._oPersController = null;
		if (this._oVariantManagement) {

			this._oVariantManagement.detachSave(this._variantSaved, this);
			this._oVariantManagement.detachAfterSave(this._variantAfterSave, this);

			if (!this._oVariantManagement.isPageVariant() && this._oVariantManagement.destroy) {
				this._oVariantManagement.destroy();
			}
		}
		this._oVariantManagement = null;

		this._destroyPopover();

		if (this._oFullScreenUtil) {
			this._oFullScreenUtil.cleanUpFullScreen(this);
			this._oFullScreenUtil = null;
		}

		if (this._oDetailsPopover) {
			this._oDetailsPopover.destroy();
			// This is not part of the popover until we have several semantic objects resolved for
			// a selected data point
			if (this._oRelatedAppsMasterList) {
				this._oRelatedAppsMasterList.destroy();
			}
		}

		this._processResizeHandler(false);

		this._oCurrentVariant = null;
		this._oChartViewMetadata = null;
		this._aAlwaysSelect = null;
		this._aInitialSorters = null;
		this._oSmartFilter = null;
		this._oToolbar = null;
		this._oChartPersonalisationButton = null;
		this._oView = null;
		this._oChart = null;
	};

	/**
	 * Process the attaching of the resize handler to the smart chart
	 *
	 * @param {boolen} bAttach If set to <code>true</code> the resize handler is attached, if set to <code>false</code> if is detached
	 * @private
	 */
	SmartChart.prototype._processResizeHandler = function(bAttach) {
		if (bAttach) {
			this.sResizeListenerId = null;
			if (Device.system.desktop) {
				this.sResizeListenerId = sap.ui.core.ResizeHandler.register(this, this._adjustHeight.bind(this));
			} else {
				Device.orientation.attachHandler(this._adjustHeight, this);
				Device.resize.attachHandler(this._adjustHeight, this);
			}
		} else {
			if (Device.system.desktop && this.sResizeListenerId) {
				sap.ui.core.ResizeHandler.deregister(this.sResizeListenerId);
				this.sResizeListenerId = null;
			} else {
				Device.orientation.detachHandler(this._adjustHeight, this);
				Device.resize.detachHandler(this._adjustHeight, this);
			}
		}
	};

	return SmartChart;

}, /* bExport= */true);
