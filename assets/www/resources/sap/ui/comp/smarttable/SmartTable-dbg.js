/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smarttable.SmartTable.
sap.ui.define([
	'jquery.sap.global', 'sap/m/VBoxRenderer', 'sap/m/Column', 'sap/m/Label', 'sap/m/MessageBox', 'sap/m/Table', 'sap/m/Text', 'sap/m/Title', 'sap/m/OverflowToolbar', 'sap/m/ToolbarDesign', 'sap/m/OverflowToolbarButton', 'sap/m/ToolbarSeparator', 'sap/m/VBox', 'sap/ui/comp/library', 'sap/ui/comp/providers/TableProvider', 'sap/ui/comp/smartfilterbar/FilterProvider', 'sap/ui/comp/smartvariants/SmartVariantManagement', 'sap/ui/model/FilterOperator', 'sap/ui/model/json/JSONModel', 'sap/ui/table/AnalyticalColumn', 'sap/ui/table/AnalyticalTable', 'sap/ui/table/Column', 'sap/ui/table/Table', 'sap/ui/table/TreeTable', 'sap/ui/comp/personalization/Util', 'sap/ui/comp/util/FormatUtil', 'sap/ui/comp/odata/ODataModelUtil', 'sap/ui/comp/odata/ODataType', 'sap/ui/comp/state/UIState'
], function(jQuery, VBoxRenderer, Column1, Label, MessageBox, ResponsiveTable, Text, Title, OverflowToolbar, ToolbarDesign, OverflowToolbarButton, ToolbarSeparator, VBox, library, TableProvider, FilterProvider, SmartVariantManagement, FilterOperator, JSONModel, AnalyticalColumn, AnalyticalTable, Column, Table, TreeTable, PersonalizationUtil, FormatUtil, ODataModelUtil, ODataType, UIState) {
	"use strict";

	/**
	 * Constructor for a new smarttable/SmartTable.
	 * 
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartTable control creates a table based on OData metadata and the configuration specified. The entitySet attribute must be
	 *        specified to use the control. This attribute is used to fetch fields from OData metadata, from which columns will be generated; it can
	 *        also be used to fetch the actual table data.<br>
	 *        Based on the tableType property, this control will render a standard, analytical, tree, or responsive table.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most of the attributes/properties are not dynamic and cannot be changed once the control has been initialized.
	 * @extends sap.m.VBox
	 * @author SAP SE
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smarttable.SmartTable
	 * @see {@link topic:bed8274140d04fc0b9bcb2db42d8bac2 Smart Table}
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartTable = VBox.extend("sap.ui.comp.smarttable.SmartTable", /** @lends sap.ui.comp.smarttable.SmartTable.prototype */
	{
		metadata: {

			library: "sap.ui.comp",

			designTime: true,

			properties: {

				/**
				 * The entity set name from which to fetch data and generate the columns. Note that this is not a dynamic UI5 property
				 * 
				 * @since 1.26.0
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * ID of the corresponding SmartFilter control; When specified, the SmartTable searches for the SmartFilter (also in the closest
				 * parent View) and attaches to the relevant events of the SmartFilter; to fetch data, show overlay etc.
				 * 
				 * @since 1.26.0
				 */
				smartFilterId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that must be ignored in the OData metadata by the SmartTable control.<br>
				 * <i>Note:</i><br>
				 * No validation is done. Please ensure that you do not add spaces or special characters.
				 * 
				 * @since 1.26.0
				 */
				ignoredFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that must be shown initially in the SmartTable as visible columns and in the order specified.<br>
				 * This property is mainly meant to be used when no LineItem annotation exists.<br>
				 * If you have fields in the XMLView they are always shown first; then, the columns are added based on the LineItem annotation and
				 * finally based on this property.<br>
				 * <i>Note:</i><br>
				 * If both this property and the LineItem annotation exist, the order of fields cannot be guaranteed to be as mentioned here.<br>
				 * No validation is done. Please ensure that you do not add spaces or special characters.
				 * 
				 * @since 1.32.0
				 */
				initiallyVisibleFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that must be always requested from the backend<br>
				 * This property is mainly meant to be used when there is no PresentationVariant annotation.<br>
				 * If both this property and the PresentationVariant annotation exist, the select request sent to the backend would be a combination
				 * of both.<br>
				 * <i>Note:</i><br>
				 * This property has no effect when AnalyticalTable is used.<br>
				 * No validation is done. Please ensure that you do not add spaces or special characters.
				 * 
				 * @since 1.32.0
				 */
				requestAtLeastFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * CSV of fields that is not shown in the personalization dialog.<br>
				 * <i>Note:</i><br>
				 * No validation is done. Please ensure that you do not add spaces or special characters.
				 * 
				 * @since 1.32.0
				 */
				ignoreFromPersonalisation: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the type of table to be created in the SmartTable control.<br>
				 * <i>Note:</i><br>
				 * If you add a table to the content of the SmartTable in the view, this property has no effect.
				 * 
				 * @since 1.26.0
				 */
				tableType: {
					type: "sap.ui.comp.smarttable.TableType",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The useVariantManagement attribute can be set to true or false depending on whether you want to use variants. As a prerequisite you
				 * need to specify the persistencyKey property.
				 * 
				 * @since 1.26.0
				 */
				useVariantManagement: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The showVariantManagement attribute can be set to true or false for controlling the visibility of VariantManagement button.
				 * 
				 * @since 1.38.0
				 */
				showVariantManagement: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Can be set to true or false depending on whether you want to export data to a spreadsheet application, for example Microsoft Excel.<br>
				 * <i>Note:</i><br>
				 * Any $expand parameters are removed when sending the request to generate the spreadsheet. (only valid when <code>exportType</code>
				 * is <code>sap.ui.comp.smarttable.ExportType.GW</code>)
				 * 
				 * @since 1.26.0
				 */
				useExportToExcel: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies the type of export to be used in the <code>SmartTable</code> control.
				 * 
				 * @since 1.50.0
				 */
				exportType: {
					type: "sap.ui.comp.smarttable.ExportType",
					group: "Misc",
					defaultValue: "UI5Client"
				},

				/**
				 * The useTablePersonalisation attribute can be set to true or false depending on whether you want to define personalized table
				 * settings. If you want to persist the table personalization, you need to specify the persistencyKey property.
				 * 
				 * @since 1.26.0
				 */
				useTablePersonalisation: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * The showTablePersonalisation attribute can be set to true or false for controlling the visibility of the TablePersonalisation
				 * button.
				 * 
				 * @since 1.38.0
				 */
				showTablePersonalisation: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * If set to <code>true</code> (default), the number of rows is shown along with the header text.<br>
				 * If set to <code>false</code>, the number of rows will not be shown on the user interface.<br>
				 * <i>Note:</i><br>
				 * To avoid sending dedicated OData requests in order to improve your application's performance, you must configure the binding of the
				 * table as required.
				 * 
				 * @since 1.26.0
				 */
				showRowCount: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Specifies header text that is shown in table
				 * 
				 * @since 1.26.0
				 */
				header: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * A style class which is defined for the toolbar of the table.
				 * 
				 * @since 1.26.0
				 */
				toolbarStyleClass: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Can be used to override the filter behavior. If set to true (default), instead of the filter input box a button is rendered. When
				 * pressing this button, the SmartTable control opens the filter panel directly in the table personalization dialog.
				 * 
				 * @deprecated Since 1.40.0. After personalization dialog has been introduced in SmartTable the property
				 *             <code>enableCustomFilter</code> does not make sense. When setting the property to <code>false</code>, the entered
				 *             custom filter value will not be shown in personalization dialog and will also not be persisted in variant management.
				 *             The custom filter will also be overwritten when rebindTable is called on the SmartTable.
				 * @since 1.26.0
				 */
				enableCustomFilter: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Key used to access personalization data.
				 * 
				 * @since 1.26.0
				 */
				persistencyKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to true, the standard toolbar and custom toolbar will be merged into one toolbar. The combined toolbar will have a solid
				 * style.
				 * 
				 * @since 1.26.0
				 * @deprecated Since 1.29. This property has no effect
				 */
				useOnlyOneSolidToolbar: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Retrieves or sets the current variant.
				 * 
				 * @since 1.28.0
				 */
				currentVariantId: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * This attribute can be used to specify if the controls created by the SmartTable control are editable. (The automatic toggle of
				 * controls works only for the SmartField/SmartToggle scenario)
				 * 
				 * @since 1.28.0
				 */
				editable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * When set to true, this enables automatic binding of the table using the tableBindingPath (if it exists) or entitySet property. This
				 * happens just after the <code>initialise</code> event has been fired.
				 * 
				 * @since 1.28.0
				 */
				enableAutoBinding: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * This attribute can be used to specify the path that is used during the binding of the table. If not specified, the entitySet
				 * attribute is used instead. (used only if binding is established internally/automatically - See enableAutoBinding)
				 * 
				 * @since 1.28.0
				 */
				tableBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies whether the editable property can be toggled via a button on the toolbar. (The automatic toggle of controls works only
				 * for the SmartField/SmartToggle scenario)
				 * 
				 * @since 1.28.0
				 */
				editTogglable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * The demandPopin attribute can be set to true or false depending on whether you want to display columns as popins on the responsive
				 * table
				 * 
				 * @since 1.30.0
				 */
				demandPopin: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Controls the visibility of the FullScreen button.
				 * 
				 * @since 1.38
				 */
				showFullScreenButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
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
				 * A toolbar that can be added by the user to define their own custom buttons, icons, etc. If this is specified, the SmartTable
				 * control does not create an additional toolbar, but makes use of this one.
				 * 
				 * @since 1.26.0
				 */
				customToolbar: {
					type: "sap.m.Toolbar",
					multiple: false
				},

				/**
				 * The Semantic Object Controller allows the user to specify and overwrite functionality for semantic object navigation.
				 * 
				 * @since 1.28.0
				 */
				semanticObjectController: {
					type: "sap.ui.comp.navpopover.SemanticObjectController",
					multiple: false
				},

				/**
				 * The value for the noData aggregation can be either a string value or a control instance.<br>
				 * The control is shown, in case there is no data for the Table available. In case of a string value this will simply replace the no
				 * data text.<br>
				 * Currently the Responsive Table only supports string values.
				 * 
				 * @since 1.32.0
				 */
				noData: {
					type: "sap.ui.core.Control",
					altTypes: [
						"string"
					],
					multiple: false
				},
				/**
				 * Allows users to specify an additional control that will be added to a VBox for the first semantic key field.<br>
				 * <i>Note:</i><br>
				 * This property is not meant for public use.
				 * 
				 * @since 1.38.0
				 */
				semanticKeyAdditionalControl: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			events: {

				/**
				 * This event is fired once the control has been initialized.
				 * 
				 * @since 1.26.0
				 */
				initialise: {},

				/**
				 * This event is fired just before the binding is being done.
				 * 
				 * @name sap.ui.comp.smarttable.SmartTable#beforeRebindTable
				 * @event
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {object} oControlEvent.getParameters.bindingParams The bindingParams object contains filters, sorters and other binding
				 *        related information for the table.
				 * @param {boolean} oControlEvent.getParameters.bindingParams.preventTableBind If set to <code>true</code> by the listener, binding
				 *        is prevented
				 * @param {sap.ui.model.Filter[]} oControlEvent.getParameters.bindingParams.filters The combined filter array containing a set of
				 *        sap.ui.model.Filter instances of the SmartTable and SmartFilter controls; can be modified by users to influence filtering
				 * @param {sap.ui.model.Sorter[]} oControlEvent.getParameters.bindingParams.sorter An array containing a set of sap.ui.model.Sorter
				 *        instances of the SmartTable control (personalization); can be modified by users to influence sorting
				 * @since 1.26.0
				 * @public
				 */
				beforeRebindTable: {},

				/**
				 * This event is fired when display/edit button is clicked.
				 * 
				 * @since 1.28.0
				 */
				editToggled: {},

				/**
				 * This event is fired when data is requested after binding. The event is fired if the binding for the table is done by the SmartTable
				 * itself.
				 * 
				 * @since 1.52.0
				 */
				dataRequested: {},

				/**
				 * This event is fired when data is received after binding. The event is fired if the binding for the table is done by the SmartTable
				 * itself.
				 * 
				 * @since 1.28.0
				 */
				dataReceived: {},

				/**
				 * This event is fired after variant management in the SmartTable has been initialized.
				 * 
				 * @since 1.28.0
				 */
				afterVariantInitialise: {},

				/**
				 * This event is fired after a variant has been saved. This event can be used to retrieve the ID of the saved variant.
				 * 
				 * @since 1.28.0
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
				 * 
				 * @since 1.28.0
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
				 * This event is fired just before the overlay is being shown.
				 * 
				 * @name sap.ui.comp.smarttable.SmartTable#showOverlay
				 * @event
				 * @param {sap.ui.base.Event} oControlEvent
				 * @param {sap.ui.base.EventProvider} oControlEvent.getSource
				 * @param {object} oControlEvent.getParameters
				 * @param {object} oControlEvent.getParameters.overlay The overlay object contains information related to the table's overlay
				 * @param {boolean} oControlEvent.getParameters.overlay.show If set to <code>false</code> by the listener, overlay is not shown
				 * @since 1.32.0
				 * @public
				 */
				showOverlay: {},

				/**
				 * This event is fired when an editable field, created internally by the SmartTable control, is changed.
				 * 
				 * @since 1.34.0
				 */
				fieldChange: {},

				/**
				 * This event is fired right after the full screen mode of the SmartTable control has been changed.
				 * 
				 * @since 1.46
				 */
				fullScreenToggled: {
					parameters: {
						/**
						 * If <code>true</code>, control is in full screen mode
						 */
						fullScreen: {
							type: "boolean"
						}
					}
				},
				/**
				 * This event is fired just before export is triggered.
				 * 
				 * @since 1.50
				 * @public
				 */
				beforeExport: {
					parameters: {
						/**
						 * Contains workbook.columns, dataSource and other export-related information
						 */
						exportSettings: {
							type: "object"
						}
					}
				}
			}
		},
		renderer: VBoxRenderer.render,
		constructor: function() {
			VBox.apply(this, arguments);
			this._aExistingColumns = [];
			this._aAlwaysSelect = [];
			this._oTemplate = null;
			this._createToolbar();
			// Check and parse the p13nDialog settings custom data
			this._oP13nDialogSettings = this.data("p13nDialogSettings");
			if (typeof this._oP13nDialogSettings === "string") {
				try {
					this._oP13nDialogSettings = JSON.parse(this._oP13nDialogSettings);
				} catch (e) {
					this._oP13nDialogSettings = null;
					// Invalid JSON!
				}
			}
			this._bIsFilterPanelEnabled = (this._oP13nDialogSettings && this._oP13nDialogSettings.filter) ? this._oP13nDialogSettings.filter.visible !== false : true;
			this._createTable();
		}
	});

	// **
	// * This file defines behaviour for the control,
	// */
	SmartTable.prototype.init = function() {
		sap.m.FlexBox.prototype.init.call(this);
		this.addStyleClass("sapUiCompSmartTable");
		this.setFitContainer(true);
		this._aColumnKeys = [];
		this._mLazyColumnMap = {};
	};

	SmartTable.prototype._getVariantManagementControl = function(oSmartVariantId) {
		var oSmartVariantControl = null;
		if (oSmartVariantId) {
			if (typeof oSmartVariantId === 'string') {
				oSmartVariantControl = sap.ui.getCore().byId(oSmartVariantId);
			} else {
				oSmartVariantControl = oSmartVariantId;
			}

			if (oSmartVariantControl) {
				if (!(oSmartVariantControl instanceof SmartVariantManagement)) {
					jQuery.sap.log.error("Control with the id=" + oSmartVariantId.getId ? oSmartVariantId.getId() : oSmartVariantId + " not of expected type");
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
	SmartTable.prototype._createVariantManagementControl = function() {

		// Do not create variant management when it is not needed!
		if (this._oVariantManagement || (!this.getUseVariantManagement() && !this.getUseTablePersonalisation()) || !this.getPersistencyKey()) {
			return;
		}

		// always create VariantManagementControl, in case it is not used, it will take care of persisting the personalisation
		// without visualization

		var oPersInfo = new sap.ui.comp.smartvariants.PersonalizableInfo({
			type: "table",
			keyName: "persistencyKey",
			dataSource: "TODO"
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
			this._oVariantManagement.addPersonalizableControl(oPersInfo);

			// Current variant could have been set already (before initialise) by the SmartVariant, in case of GLO/Industry specific variant
			// handling
			this._oVariantManagement.attachSave(this._variantSaved, this);
			this._oVariantManagement.attachAfterSave(this._variantAfterSave, this);

			this._oVariantManagement.initialise(this._variantInitialised, this);
		}

	};

	SmartTable.prototype._variantInitialised = function() {
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

	SmartTable.prototype._variantSaved = function() {
		if (this._oPersController) {
			this._oPersController.setPersonalizationData(this._oCurrentVariant);
		}
	};

	SmartTable.prototype._variantAfterSave = function() {
		this.fireAfterVariantSave({
			currentVariantId: this.getCurrentVariantId()
		});
	};

	SmartTable.prototype.setUseExportToExcel = function(bUseExportToExcel) {
		if (bUseExportToExcel === this.getUseExportToExcel()) {
			return;
		}
		this.setProperty("useExportToExcel", bUseExportToExcel, true);
		if (this.bIsInitialised && this._oToolbar) {
			this._createToolbarContent();
		}
	};

	SmartTable.prototype.setExportType = function(sExportType) {
		if (sExportType === this.getExportType()) {
			return;
		}
		this.setProperty("exportType", sExportType, true);
		if (this.bIsInitialised && this._oToolbar) {
			this._createToolbarContent();
		}
	};

	SmartTable.prototype.setUseTablePersonalisation = function(bUseTablePersonalisation) {
		this.setProperty("useTablePersonalisation", bUseTablePersonalisation, true);
	};

	SmartTable.prototype.setShowTablePersonalisation = function(bShowTablePersonalisation) {
		this.setProperty("showTablePersonalisation", bShowTablePersonalisation, true);
		if (this._oTablePersonalisationButton) {
			this._oTablePersonalisationButton.setVisible(bShowTablePersonalisation);
		}
	};

	SmartTable.prototype.setUseVariantManagement = function(bUseVariantManagement) {
		this.setProperty("useVariantManagement", bUseVariantManagement, true);
		if (this._oPersController) {
			this._oPersController.setResetToInitialTableState(!bUseVariantManagement);
		}
	};

	SmartTable.prototype.setShowVariantManagement = function(bShowVariantManagement) {
		this.setProperty("showVariantManagement", bShowVariantManagement, true);
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.setVisible(bShowVariantManagement);
			// Hide ToolbarSeparator if VariantManagement button is hidden.
			if (this._oSeparator) {
				this._oSeparator.setVisible(bShowVariantManagement);
			}
		}
	};

	SmartTable.prototype.setToolbarStyleClass = function(sStyleClass) {
		this.setProperty("toolbarStyleClass", sStyleClass, true);
	};

	SmartTable.prototype.setCustomToolbar = function(oCustomToolbar) {
		if (this._oCustomToolbar) {
			this.removeItem(this._oCustomToolbar);
		}

		this._oCustomToolbar = oCustomToolbar;
	};

	SmartTable.prototype.getCustomToolbar = function() {
		return this._oCustomToolbar;
	};

	SmartTable.prototype.setHeader = function(sText) {
		var sOldText = this.getProperty("header"), bPreventUpdateContent;
		this.setProperty("header", sText, true);
		if (this.bIsInitialised && this._oToolbar) {
			// Update Toolbar content to show/hide separator only if text changes from empty to some value -or- from some value to empty
			// else there could be a re-render triggered on the inner table!
			bPreventUpdateContent = (!sOldText === !sText);
			if (!bPreventUpdateContent) {
				this._createToolbarContent();
			} else {
				this._refreshHeaderText();
			}
		}
	};

	SmartTable.prototype.setShowRowCount = function(bShow) {
		this.setProperty("showRowCount", bShow, true);
		this._refreshHeaderText();
	};

	SmartTable.prototype.setShowFullScreenButton = function(bShowFullScreenButton) {
		this.setProperty("showFullScreenButton", bShowFullScreenButton, true);
		if (this._oFullScreenButton) {
			this._oFullScreenButton.setVisible(bShowFullScreenButton);
		}
	};

	SmartTable.prototype.setEditTogglable = function(bEditTogglable) {
		this.setProperty("editTogglable", bEditTogglable, true);
		if (this._oEditButton) {
			this._oEditButton.setVisible(bEditTogglable);
		}
	};

	SmartTable.prototype.setEditable = function(bEdit) {
		this.setProperty("editable", bEdit, true);
		// Update local EditModel's property
		if (this._oEditModel) {
			this._oEditModel.setProperty("/editable", bEdit);
		}
		if (this._oEditButton) {
			this._oEditButton.setIcon(bEdit ? "sap-icon://display" : "sap-icon://edit");
		}
		// update keyboard handling for sap.m.Table
		if (this._isMobileTable && this._oTable.setKeyboardMode) {
			this._oTable.setKeyboardMode(bEdit ? "Edit" : "Navigation");
		}
	};

	SmartTable.prototype.setDemandPopin = function(bDemandPopin) {
		var bOldValue = this.getDemandPopin();
		if (bOldValue === bDemandPopin) {
			return;
		}

		this.setProperty("demandPopin", bDemandPopin, true);

		if (this.bIsInitialised) {
			if (bDemandPopin) {
				this._updateColumnsPopinFeature();
			} else {
				this._deactivateColumnsPopinFeature();
			}
		}
	};

	/**
	 * sets the header text
	 * 
	 * @private
	 */
	SmartTable.prototype._refreshHeaderText = function() {
		if (!this._headerText) {
			return;
		}

		var sText = this.getHeader();
		this._headerText.setVisible(!!sText);
		if (this.getShowRowCount()) {
			var iRowCount = parseInt(this._getRowCount(true), 10);
			jQuery.sap.require("sap.ui.core.format.NumberFormat");
			var sValue = sap.ui.core.format.NumberFormat.getFloatInstance().format(iRowCount);

			sText += " (" + sValue + ")";
		}

		this._headerText.setText(sText);
	};

	/**
	 * creates the fullscreen button and adds it into toolbar
	 */
	SmartTable.prototype._addFullScreenButton = function() {
		// always remove content first
		if (this._oFullScreenButton) {
			this._oToolbar.removeContent(this._oFullScreenButton);
		}
		if (this.getShowFullScreenButton()) {
			if (!this._oFullScreenButton) {
				this._oFullScreenButton = new OverflowToolbarButton(this.getId() + "-btnFullScreen", {
					press: function() {
						this._toggleFullScreen(!this.bFullScreen);
					}.bind(this)
				});
			}
			this._renderFullScreenButton();
			this._oToolbar.addContent(this._oFullScreenButton);
		}
	};
	/**
	 * creates the toolbar
	 * 
	 * @private
	 */
	SmartTable.prototype._createToolbar = function() {
		var oCustomToolbar = null;
		if (!this._oToolbar) {
			oCustomToolbar = this.getCustomToolbar();
			if (oCustomToolbar) {
				this._oToolbar = oCustomToolbar;
			} else {
				this._oToolbar = new OverflowToolbar({
					design: sap.m.ToolbarDesign.Transparent
				});
				this._oToolbar.addStyleClass("sapUiCompSmartTableToolbar");
				if (this.getToolbarStyleClass()) {
					this._oToolbar.addStyleClass(this.getToolbarStyleClass());
				}
			}
			this._oToolbar.setLayoutData(new sap.m.FlexItemData({
				shrinkFactor: 0
			}));
		}
	};
	/**
	 * Toggles between fullscreen and normal view mode
	 * 
	 * @param {boolean} bValue - the new value of FullScreen
	 * @param {boolean} bForced - whether setting FullScreen is forced
	 * @private
	 */
	SmartTable.prototype._toggleFullScreen = function(bValue, bForced) {
		if (!this._oFullScreenButton || (bValue === this.bFullScreen && !bForced)) {
			return;
		}

		this.bFullScreen = bValue;

		if (!this._oFullScreenUtil) {
			this._oFullScreenUtil = sap.ui.requireSync("sap/ui/comp/util/FullScreenUtil");
		}
		this._oFullScreenUtil.toggleFullScreen(this, this.bFullScreen, this._oFullScreenButton, this._toggleFullScreen.bind(this, false));

		this._renderFullScreenButton();
		// Fire the fullScreen Event
		this.fireFullScreenToggled({
			fullScreen: bValue
		});
	};

	/**
	 * Renders the look and feel of the full screen button
	 */
	SmartTable.prototype._renderFullScreenButton = function() {
		var resourceB = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp"), sText;

		sText = this.bFullScreen ? resourceB.getText("CHART_MINIMIZEBTN_TOOLTIP") : resourceB.getText("CHART_MAXIMIZEBTN_TOOLTIP");
		this._oFullScreenButton.setTooltip(sText);
		this._oFullScreenButton.setText(sText);
		this._oFullScreenButton.setIcon(this.bFullScreen ? "sap-icon://exit-full-screen" : "sap-icon://full-screen");
	};

	/**
	 * creates the toolbar content
	 * 
	 * @private
	 */
	SmartTable.prototype._createToolbarContent = function() {
		if (!this._oToolbar) {
			this._createToolbar();
		}
		// insert the items in the custom toolbar in reverse order => insert always at position 0
		this._addVariantManagementToToolbar();
		this._addSeparatorToToolbar();
		this._addHeaderToToolbar();

		// add spacer to toolbar
		this._addSpacerToToolbar();

		// First show Display/Edit icon, then Personalisation and finally Excel Export
		this._addEditTogglableToToolbar();
		this._addTablePersonalisationToToolbar();
		this._addExportToExcelToToolbar();
		this._addFullScreenButton();

		this._bToolbarInsertedIntoItems = true;
		this.insertItem(this._oToolbar, 0);
	};

	/**
	 * Adds the button to change between edit and read only mode
	 * 
	 * @private
	 */
	SmartTable.prototype._addEditTogglableToToolbar = function() {
		var sButtonLabel;
		// always remove content first
		if (this._oEditButton) {
			this._oToolbar.removeContent(this._oEditButton);
		}
		if (this.getEditTogglable()) {
			if (!this._oEditButton) {
				sButtonLabel = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("TABLE_EDITTOGGLE_TOOLTIP");
				this._oEditButton = new sap.m.OverflowToolbarButton(this.getId() + "-btnEditToggle", {
					icon: this.getEditable() ? "sap-icon://display" : "sap-icon://edit",
					text: sButtonLabel,
					tooltip: sButtonLabel,
					press: function() {
						var bEditable = this.getEditable();
						// toggle property editable and set it on the smart table
						bEditable = !bEditable;
						this.setEditable(bEditable, true);
						// notify any listeners
						this.fireEditToggled({
							editable: bEditable
						});
					}.bind(this)
				});
			}
			this._oToolbar.addContent(this._oEditButton);
		}
	};

	/**
	 * adds the header line to the toolbar
	 * 
	 * @private
	 */
	SmartTable.prototype._addHeaderToToolbar = function() {
		// always remove content first
		if (this._headerText) {
			this._oToolbar.removeContent(this._headerText);
		}

		if (!this._headerText) {
			this._headerText = new Title(this.getId() + "-header");
			this._headerText.addStyleClass("sapMH4Style");
			this._headerText.addStyleClass("sapUiCompSmartTableHeader");
		}

		this._refreshHeaderText();
		this._oToolbar.insertContent(this._headerText, 0);
	};

	/**
	 * adds a separator between header and variantmanagement to the toolbar
	 * 
	 * @private
	 */
	SmartTable.prototype._addSeparatorToToolbar = function() {
		// always remove content first
		if (this._oSeparator) {
			this._oToolbar.removeContent(this._oSeparator);
		}
		if (this.getHeader() && this.getUseVariantManagement() && this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			if (!this._oSeparator) {
				this._oSeparator = new ToolbarSeparator(this.getId() + "-toolbarSeperator");
				// Hide ToolbarSeparator if VariantManagement button is hidden
				if (!this.getShowVariantManagement()) {
					this._oSeparator.setVisible(false);
				}
			}
			this._oToolbar.insertContent(this._oSeparator, 0);
			// Also set the height to 3rem (via css) when no height is explicitly specified
			if (!this._oToolbar.getHeight()) {
				this._oToolbar.addStyleClass("sapUiCompSmartTableToolbarHeight");
			}
		}
	};

	/**
	 * adds the VarientManagement to the toolbar
	 * 
	 * @private
	 */
	SmartTable.prototype._addVariantManagementToToolbar = function() {
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			// always remove content first
			this._oToolbar.removeContent(this._oVariantManagement);
			if (this.getUseVariantManagement()) {
				this._oToolbar.insertContent(this._oVariantManagement, 0);
				if (!this._oVariantManagement.isPageVariant()) {
					this._oVariantManagement.setVisible(this.getShowVariantManagement());
				}
			}
		}
	};

	/**
	 * adds a spacer to the toolbar
	 * 
	 * @private
	 */
	SmartTable.prototype._addSpacerToToolbar = function() {
		var bFoundSpacer = false, aItems = this._oToolbar.getContent(), i, iLength;
		if (aItems) {
			iLength = aItems.length;
			i = 0;
			for (i; i < iLength; i++) {
				if (aItems[i] instanceof sap.m.ToolbarSpacer) {
					bFoundSpacer = true;
					break;
				}
			}
		}

		if (!bFoundSpacer) {
			this._oToolbar.addContent(new sap.m.ToolbarSpacer(this.getId() + "-toolbarSpacer"));
		}
	};

	/**
	 * adds the Table Personalisation button to the toolbar
	 * 
	 * @private
	 */
	SmartTable.prototype._addTablePersonalisationToToolbar = function() {
		var sButtonLabel;
		// always remove content first
		if (this._oTablePersonalisationButton) {
			this._oToolbar.removeContent(this._oTablePersonalisationButton);
		}
		if (this.getUseTablePersonalisation()) {
			if (!this._oTablePersonalisationButton) {
				sButtonLabel = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("TABLE_PERSOBTN_TOOLTIP");
				this._oTablePersonalisationButton = new sap.m.OverflowToolbarButton(this.getId() + "-btnPersonalisation", {
					icon: "sap-icon://action-settings",
					text: sButtonLabel,
					tooltip: sButtonLabel,
					press: function(oEvent) {
						this._oPersController.openDialog();
					}.bind(this)
				});
				this._oTablePersonalisationButton.setVisible(this.getShowTablePersonalisation());
			}
			this._oToolbar.addContent(this._oTablePersonalisationButton);
		}
	};

	/**
	 * adds the Export to Excel button to the toolbar
	 * 
	 * @private
	 */
	SmartTable.prototype._addExportToExcelToToolbar = function() {
		// always remove content first
		if (this._oUseExportToExcel) {
			this._oToolbar.removeContent(this._oUseExportToExcel);
		}
		if (this.getUseExportToExcel() && (this._bTableSupportsExcelExport || this.getExportType() === "UI5Client")) {
			var sButtonLabel;
			if (!this._oUseExportToExcel) {
				sButtonLabel = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("TABLE_EXPORT_TEXT");
				this._oUseExportToExcel = new sap.m.OverflowToolbarButton(this.getId() + "-btnExcelExport", {
					icon: "sap-icon://excel-attachment",
					text: sButtonLabel,
					tooltip: sButtonLabel,
					press: function(oEvent) {
						if (this.getExportType() === "UI5Client") {
							this._triggerUI5ClientExport();
							return;
						}
						var fDownloadXls = function() {
							var oRowBinding = this._getRowBinding();
							var sUrl = oRowBinding.getDownloadUrl("xlsx");
							sUrl = this._removeExpandParameter(sUrl);
							// check for length of URL -> URLs longer than 2048 chars aren't supported in some browsers (e.g. Internet Explorer)
							if (sUrl && sUrl.length > 2048 && sap.ui.Device.browser.msie) {
								// thrown info to user!
								MessageBox.error(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("DOWNLOAD_TOO_COMPLEX_TEXT"));
								return;
							}
							var mExportSettings = {
								url: sUrl
							};
							// Fire event to enable export url manipulation
							this.fireBeforeExport({
								exportSettings: mExportSettings
							});
							window.open(mExportSettings.url);
						}.bind(this);

						var iRowCount = this._getRowCount(true);

						if (iRowCount > 10000) {
							MessageBox.confirm(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("DOWNLOAD_CONFIRMATION_TEXT", iRowCount), {
								actions: [
									MessageBox.Action.YES, MessageBox.Action.NO
								],
								onClose: function(oAction) {
									if (oAction === MessageBox.Action.YES) {
										fDownloadXls();
									}
								}
							});
						} else {
							fDownloadXls();
						}
					}.bind(this)
				});
				this._setExcelExportEnableState();
			}
			this._oToolbar.addContent(this._oUseExportToExcel);
		}
	};

	/**
	 * Triggers export via "sap.ui.export"/"Document Export Services" export functionality
	 * 
	 * @private
	 */
	SmartTable.prototype._triggerUI5ClientExport = function() {
		var oExportLibLoadPromise = sap.ui.getCore().loadLibrary("sap.ui.export", true);
		oExportLibLoadPromise.then(function() {
			var aColumns = this._oTable.getColumns(), i, iLen = aColumns.length, oColumn, oColumnData, oLabel, sPath, sTemplate, nWidth, sType, oType, aSheetColumns = [];
			if (this._isMobileTable && aColumns.length) {
				aColumns = aColumns.sort(function(oCol1, oCol2) {
					return oCol1.getOrder() - oCol2.getOrder();
				});
			}
			for (i = 0; i < iLen; i++) {
				sPath = null;
				sTemplate = null;
				oColumn = aColumns[i];
				if (oColumn.getVisible()) {
					if (oColumn.getLeadingProperty) {
						sPath = oColumn.getLeadingProperty();
					}
					oColumnData = oColumn.data("p13nData");
					if (oColumnData) {
						if (!sPath) {
							sPath = oColumnData["leadingProperty"];
						}
					}
					if (Array.isArray(sPath)) {
						sPath = sPath[0];
					}
					if (sPath) {
						if (oColumn.getLabel) {
							oLabel = oColumn.getLabel();
						} else if (oColumn.getHeader) {
							oLabel = oColumn.getHeader();
						}
						nWidth = oColumn.getWidth().toLowerCase() || oColumnData.width || "";
						if (nWidth.indexOf("em") > 0) {
							nWidth = Math.round(parseFloat(nWidth));
						} else if (nWidth.indexOf("px") > 0) {
							nWidth = Math.round(parseInt(nWidth, 10) / 16);
						}
						sType = oColumnData.type === "numeric" ? "number" : oColumnData.type;
						oType = null;
						if (oColumnData.isCurrency) {
							sType = "currency";
						} else if (!this._isAnalyticalTable && oColumnData.description) {
							sTemplate = FormatUtil.getFormattedExpressionFromDisplayBehaviour(oColumnData.displayBehaviour, "{0}", "{1}");
						} else if (oColumnData.isDigitSequence) {
							sType = "number";
						} else if (sType != "date" && ODataType.isDateOrTime(oColumnData.edmType)) {
							// set type as expected by excel for OData specific Date/Time fields
							sType = ODataType.getDefaultValueTypeName(oColumnData.edmType);
							if (sType === "DateTimeOffset") {
								sType = "DateTime";
							}
						} else if (sType === "boolean") {
							oType = ODataType.getType(oColumnData.edmType);
						}
						aSheetColumns.push({
							columnId: oColumn.getId(),
							property: sTemplate ? [
								sPath, oColumnData.description
							] : sPath,
							type: sType,
							label: (oLabel && oLabel.getText) ? oLabel.getText() : sPath,
							width: nWidth,
							textAlign: oColumn.getHAlign(),
							template: sTemplate,
							trueValue: (sType === "boolean" && oType) ? oType.formatValue(true, "string") : undefined,
							falseValue: (sType === "boolean" && oType) ? oType.formatValue(false, "string") : undefined,
							unitProperty: (sType === "currency" || sType === "number") ? oColumnData.unit : undefined,
							displayUnit: sType === "currency",
							precision: oColumnData.precision,
							scale: oColumnData.scale
						});
					}
				}
			}
			var oRowBinding = this._getRowBinding();
			var oModel = this.getModel();
			var sFileName = this.getHeader();
			var iCount = !this._isTreeTable ? this._getRowCount(true) : undefined;
			var mExportSettings = {
				workbook: {
					columns: aSheetColumns
				},
				dataSource: {
					type: "odata",
					dataUrl: oRowBinding.getDownloadUrl && oRowBinding.getDownloadUrl("json"),
					serviceUrl: oModel.sServiceUrl,
					headers: oModel.getHeaders(),
					count: iCount,
					useBatch: oModel.bUseBatch
				},
				fileName: sFileName
			};
			// Event to enable user modification of excel settings
			this.fireBeforeExport({
				exportSettings: mExportSettings
			});
			sap.ui.require([
				"sap/ui/export/Spreadsheet"
			], function(Spreadsheet) {
				new Spreadsheet(mExportSettings).build();
			});
		}.bind(this));
	};

	/**
	 * removes the given Url's expand parameter
	 * 
	 * @param {string} sUrl the original url
	 * @private
	 * @returns {string} the resolved url string
	 */
	SmartTable.prototype._removeExpandParameter = function(sUrl) {
		var sFinalUrl = sUrl.replace(new RegExp("([\\?&]\\$expand=[^&]+)(&?)"), function(result, match1, match2) {
			return match2 ? match1.substring(0, 1) : "";
		});
		return sFinalUrl;
	};

	/**
	 * gets table's row count
	 * 
	 * @param {Boolean} bConsiderTotal whether to consider total
	 * @private
	 * @returns {int} the row count
	 */
	SmartTable.prototype._getRowCount = function(bConsiderTotal) {
		var oRowBinding = this._getRowBinding();

		if (!oRowBinding) {
			return 0;
		}

		var iRowCount = 0;
		if (bConsiderTotal && oRowBinding.getTotalSize) {
			iRowCount = oRowBinding.getTotalSize();
		} else {
			iRowCount = oRowBinding.getLength();
		}

		if (iRowCount < 0 || iRowCount === "0") {
			iRowCount = 0;
		}

		return iRowCount;
	};

	/**
	 * disables the export to excel button if no data is present, otherwise enables it
	 * 
	 * @private
	 */
	SmartTable.prototype._setExcelExportEnableState = function() {
		if (this._oUseExportToExcel) {
			var iRowCount = this._getRowCount();
			this._oUseExportToExcel.setEnabled(iRowCount > 0);
		}
	};

	/**
	 * creates the personalization controller if not yet done
	 * 
	 * @private
	 */
	SmartTable.prototype._createPersonalizationController = function() {
		if (this._oPersController || !this.getUseTablePersonalisation()) {
			return;
		}

		var oSettings = this._oP13nDialogSettings;

		oSettings = this._setIgnoreFromPersonalisationToSettings(oSettings);

		jQuery.sap.require("sap.ui.comp.personalization.Controller");
		this._oPersController = new sap.ui.comp.personalization.Controller({
			table: this._oTable,
			columnKeys: this._aColumnKeys,
			setting: oSettings,
			resetToInitialTableState: !this.getUseVariantManagement(),
			beforePotentialTableChange: this._beforePersonalisationModelDataChange.bind(this),
			afterPotentialTableChange: this._afterPersonalisationModelDataChange.bind(this),
			afterP13nModelDataChange: this._personalisationModelDataChange.bind(this),
			requestColumns: this._personalisationRequestColumns.bind(this)
		});
	};

	/**
	 * adds the ignoreFromPersonalisation fields to the given setting
	 * 
	 * @param {object} oSettings the former settings object
	 * @private
	 * @returns {object} the changed settings object
	 */
	SmartTable.prototype._setIgnoreFromPersonalisationToSettings = function(oSettings) {
		var aIgnoreFields = PersonalizationUtil.createArrayFromString(this.getIgnoreFromPersonalisation());
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

			fSetArray("filter");
			fSetArray("sort");
			fSetArray("group");
			fSetArray("columns");
		}
		return oSettings;
	};

	/**
	 * returns the row/items binding of the currently used internal table
	 * 
	 * @private
	 * @returns {sap.ui.model.Binding} the row/items binding
	 */
	SmartTable.prototype._getRowBinding = function() {
		if (this._oTable) {
			return this._oTable.getBinding(this._sAggregation);
		}
	};

	/**
	 * The entity set name from OData metadata, with which the table should be bound to
	 * 
	 * @param {string} sEntitySetName The entity set
	 * @public
	 */
	SmartTable.prototype.setEntitySet = function(sEntitySetName) {
		this.setProperty("entitySet", sEntitySetName);
		this._initialiseMetadata();
	};

	/**
	 * It could happen that the entity type information is set already in the view, but there is no model attached yet. This method is called once the
	 * model is set on the parent and can be used to initialise the metadata, from the model, and finally create the table controls.
	 * 
	 * @private
	 */
	SmartTable.prototype.propagateProperties = function() {
		VBox.prototype.propagateProperties.apply(this, arguments);
		this._initialiseMetadata();
	};
	/**
	 * Initialises the OData metadata necessary to create the table
	 * 
	 * @private
	 */
	SmartTable.prototype._initialiseMetadata = function() {
		if (!this.bIsInitialised) {
			ODataModelUtil.handleModelInit(this, this._onMetadataInitialised);
		}
	};

	/**
	 * Called once the necessary Model metadata is available
	 * 
	 * @private
	 */
	SmartTable.prototype._onMetadataInitialised = function() {
		this._bMetaModelLoadAttached = false;
		if (!this.bIsInitialised) {
			this._createTableProvider();
			if (this._oTableProvider) {
				this._aTableViewMetadata = this._oTableProvider.getTableViewMetadata();
				if (this._aTableViewMetadata) {
					if (!this._isMobileTable && this.getDemandPopin()) {
						this.setDemandPopin(false);
						jQuery.sap.log.error("use SmartTable property 'demandPopin' only  with responsive table, property has been set to false");
					}

					// Indicates the control is initialised and can be used in the initialise event/otherwise!
					this.bIsInitialised = true;
					this._bTableSupportsExcelExport = this._oTableProvider.getSupportsExcelExport();
					this._listenToSmartFilter();
					this._createVariantManagementControl(); // creates VariantMngmntCtrl if useVariantManagement OR useTablePersonalisation is true.
					// Control is only added to toolbar if useVariantManagement is set otherwise it acts as
					// hidden persistance helper
					this._createToolbarContent();
					this._aAlwaysSelect = this._oTableProvider.getRequestAtLeastFields();
					this._createContent();
					this._createPersonalizationController();
					// Create a local JSONModel to handle editable switch
					this._oEditModel = new JSONModel({
						editable: this.getEditable()
					});
					// Set the local model on the SmartTable
					this.setModel(this._oEditModel, "sm4rtM0d3l");

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
	SmartTable.prototype._checkAndTriggerBinding = function() {
		if (!this._bAutoBindingTriggered) {
			this._bAutoBindingTriggered = true;
			if (this.getEnableAutoBinding()) {
				if (this._oSmartFilter) {
					this._oSmartFilter.search();
				} else {
					this._reBindTable();
				}
			}
		}
	};

	/**
	 * Creates an instance of the table provider
	 * 
	 * @private
	 */
	SmartTable.prototype._createTableProvider = function() {
		var oModel, sEntitySetName, sIgnoredFields;
		sEntitySetName = this.getEntitySet();
		sIgnoredFields = this.getIgnoredFields();
		oModel = this.getModel();

		if (oModel && sEntitySetName) {
			if (this._aExistingColumns.length) {
				if (sIgnoredFields) {
					sIgnoredFields += "," + this._aExistingColumns.toString();
				} else {
					sIgnoredFields = this._aExistingColumns.toString();
				}
			}
			this._oTableProvider = new TableProvider({
				entitySet: sEntitySetName,
				ignoredFields: sIgnoredFields,
				initiallyVisibleFields: this.getInitiallyVisibleFields(),
				isEditableTable: this.getEditable(),
				smartTableId: this.getId(),
				isAnalyticalTable: !!this._isAnalyticalTable,
				isMobileTable: !!this._isMobileTable,
				dateFormatSettings: this.data("dateFormatSettings"),
				currencyFormatSettings: this.data("currencyFormatSettings"),
				defaultDropDownDisplayBehaviour: this.data("defaultDropDownDisplayBehaviour"),
				useSmartField: this.data("useSmartField"),
				useSmartToggle: this.data("useSmartToggle"),
				skipAnnotationParse: this.data("skipAnnotationParse"),
				lineItemQualifier: this.data("lineItemQualifier"),
				presentationVariantQualifier: this.data("presentationVariantQualifier"),
				enableInResultForLineItem: this.data("enableInResultForLineItem"),
				_semanticKeyAdditionalControl: this.getAggregation("semanticKeyAdditionalControl"),
				model: oModel,
				semanticObjectController: this.getSemanticObjectController()
			});
		}
	};

	/**
	 * Listen to changes on the corresponding SmartFilter (if any)
	 * 
	 * @private
	 */
	SmartTable.prototype._listenToSmartFilter = function() {
		var sSmartFilterId = null;
		// Register for SmartFilter Search
		sSmartFilterId = this.getSmartFilterId();

		this._oSmartFilter = this._findControl(sSmartFilterId);

		if (this._oSmartFilter) {
			this._oSmartFilter.attachSearch(this._reBindTable, this);
			this._oSmartFilter.attachFilterChange(this._filterChangeEvent, this);

			// Set initial empty text only if a valid SmartFilter is found
			this._setNoDataText(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTTABLE_NO_DATA"));
		} else {
			// Set initial empty text for the case when no SmartFilter is attached to SmartTable
			this._setNoDataText(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTTABLE_NO_DATA_WITHOUT_FILTERBAR"));
		}
	};

	SmartTable.prototype._filterChangeEvent = function() {
		if (this._isTableBound() && this._oSmartFilter && !this._oSmartFilter.getLiveMode() && !this._oSmartFilter.isDialogOpen()) {
			this._showOverlay(true);
		}
	};

	/**
	 * sets the ShowOverlay property on the inner table, fires the ShowOverlay event
	 * 
	 * @param {boolean} bShow true to display the overlay, otherwise false
	 * @private
	 */
	SmartTable.prototype._showOverlay = function(bShow) {
		if (bShow) {
			var oOverlay = {
				show: true
			};
			this.fireShowOverlay({
				overlay: oOverlay
			});
			bShow = oOverlay.show;
		}

		this._oTable.setShowOverlay(bShow);
	};

	/**
	 * searches for a certain control by its ID
	 * 
	 * @param {string} sId the control's ID
	 * @returns {sap.ui.core.Control} The control found by the given Id
	 * @private
	 */
	SmartTable.prototype._findControl = function(sId) {
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
	SmartTable.prototype._getView = function() {
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
	 * This can be used to trigger binding on the table used in the SmartTable
	 * 
	 * @param {boolean} bForceRebind - force bind call to be triggered on the inner table
	 * @protected
	 */
	SmartTable.prototype.rebindTable = function(bForceRebind) {
		this._reBindTable(null, bForceRebind);
	};

	/**
	 * Re-binds the table
	 * 
	 * @param {object} mEventParams - the event parameters
	 * @param {boolean} bForceRebind - force bind call to be triggered on the table
	 * @private
	 */
	SmartTable.prototype._reBindTable = function(mEventParams, bForceRebind) {
		var oTableBinding, sTableBindingPath, mTablePersonalisationData, i, iLen, aSmartFilters, aProcessedFilters = [], aFilters, oExcludeFilters, aAlwaysSelect, aSelect, mSelectExpand, aExpand, aSorters, mParameters = {}, mBindingParams = {
			preventTableBind: false
		};

		mTablePersonalisationData = this._getTablePersonalisationData() || {};
		aFilters = mTablePersonalisationData.filters;
		oExcludeFilters = mTablePersonalisationData.excludeFilters;
		aSorters = mTablePersonalisationData.sorters;

		// Get Filters and parameters from SmartFilter
		if (this._oSmartFilter) {
			aSmartFilters = this._oSmartFilter.getFilters();
			mParameters = this._oSmartFilter.getParameters() || {};
		}

		// If filters from SmartFilter exist --> process them first with SmartTable exclude filters
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
		// Combine the resulting processed filters with SmartTable include filters
		if (aFilters) {
			aFilters = aProcessedFilters.concat(aFilters);
		} else {
			aFilters = aProcessedFilters;
		}
		aAlwaysSelect = this._getRequestAtLeastFields();
		mSelectExpand = this._getVisibleColumnPaths();
		aSelect = mSelectExpand["select"];
		// handle fields that shall always be selected
		if (!aSelect || !aSelect.length) {
			aSelect = aAlwaysSelect;
		} else {
			iLen = aAlwaysSelect.length;
			for (i = 0; i < iLen; i++) {
				if (aSelect.indexOf(aAlwaysSelect[i]) < 0) {
					aSelect.push(aAlwaysSelect[i]);
				}
			}
		}
		if (this._sSelectForGroup && aSelect.indexOf(this._sSelectForGroup) < 0) {
			aSelect.push(this._sSelectForGroup);
		}
		if (aSelect.length) {
			mParameters["select"] = aSelect.toString();

			// Expand handling for navigationProperties
			aExpand = mSelectExpand["expand"];
			if (aExpand.length) {
				mParameters["expand"] = aExpand.join(",");
			}
		}

		// Enable batch requests (used by AnalyticalTable)
		mParameters["useBatchRequests"] = true;

		if (!aSorters) {
			aSorters = [];
		}

		mBindingParams.filters = aFilters;
		mBindingParams.sorter = aSorters;
		mBindingParams.parameters = mParameters;
		mBindingParams.length = undefined;
		mBindingParams.startIndex = undefined;
		// fire event to enable user modification of certain binding options (Ex: Filters)
		this.fireBeforeRebindTable({
			bindingParams: mBindingParams
		});

		if (!mBindingParams.preventTableBind) {
			aSorters = mBindingParams.sorter;
			aFilters = mBindingParams.filters;
			mParameters = mBindingParams.parameters;
			aSelect = mBindingParams.parameters["select"];
			if (!aSelect || !aSelect.length) {
				MessageBox.error(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTTABLE_NO_COLS"), {
					styleClass: (this.$() && this.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact" : ""
				});
				return;
			}
			sTableBindingPath = this.getTableBindingPath() || ("/" + this.getEntitySet());

			// Reset Suppress refresh
			if (this._oTable.resumeUpdateAnalyticalInfo) {
				// resumeUpdateAnalyticalInfo forces binding change if not explicitly set to false
				this._oTable.resumeUpdateAnalyticalInfo(true, false);
			}
			this._bDataLoadPending = true;
			this._bIgnoreChange = false; // if a 2nd request is sent while the 1st one is in progress the dataReceived event may not be fired!
			// Check if table has to be forcefully bound again!
			if (this._bForceTableUpdate) {
				bForceRebind = true;
				// Reset force update
				this._bForceTableUpdate = false;
			}
			// Only check if binding exists, if table is not being forcefully rebound
			if (!bForceRebind) {
				oTableBinding = this._oTable.getBinding(this._sAggregation);
				if (oTableBinding && oTableBinding.mParameters) {
					// Check if binding needs to be redone!
					// Evaluate to true if:
					// binding parameters change -or- custom binding parameters change -or- if length, startIndex or tableBindingPath change!
					bForceRebind = !(jQuery.sap.equal(mParameters, oTableBinding.mParameters, true) && jQuery.sap.equal(mParameters.custom, oTableBinding.mParameters.custom) && !mBindingParams.length && !mBindingParams.startIndex && sTableBindingPath === oTableBinding.getPath());
				}
			}
			// Update No data text (once), just before triggering the binding!
			if (!this._bNoDataUpdated) {
				this._bNoDataUpdated = true;
				this._setNoDataText();
			}

			// do the binding if no binding is already present or if it is being forced!
			if (!oTableBinding || !this._bIsTableBound || bForceRebind) {
				this._oTable.bindRows({
					path: sTableBindingPath,
					filters: aFilters,
					sorter: aSorters,
					parameters: mParameters,
					length: mBindingParams.length,
					startIndex: mBindingParams.startIndex,
					template: this._oTemplate,
					events: {
						dataRequested: function(oEvt) {
							// AnalyticalBinding fires dataRequested too often/early
							if (oEvt && oEvt.getParameter && oEvt.getParameter("__simulateAsyncAnalyticalBinding")) {
								return;
							}
							this._bIgnoreChange = true;
							// notify any listeners about dataRequested
							this.fireDataRequested(oEvt.getParameters());
						}.bind(this),
						dataReceived: function(mEventParams) {
							// AnalyticalBinding fires dataReceived too often/early
							if (mEventParams && mEventParams.getParameter && mEventParams.getParameter("__simulateAsyncAnalyticalBinding")) {
								return;
							}
							this._bIgnoreChange = false;
							this._onDataLoadComplete(mEventParams, true);
							// notify any listeners about dataReceived
							this.fireDataReceived(mEventParams);
						}.bind(this),
						change: function(mEventParams) {
							if (this._bIgnoreChange) {
								return;
							}
							var sReason, bForceUpdate = false;
							sReason = (mEventParams && mEventParams.getParameter) ? mEventParams.getParameter("reason") : undefined;
							// Force update state if reason for binding change is "context" or "filter" -or- not defined
							if (!sReason || sReason === "filter" || sReason === "context") {
								bForceUpdate = true;
							}
							if (sReason === "change" || bForceUpdate) {
								this._onDataLoadComplete(mEventParams, bForceUpdate);
							}
						}.bind(this)
					}
				});
				// Flag to indicate if table was bound (data fetch triggered) at least once
				this._bIsTableBound = true;
			} else {
				oTableBinding.sort(aSorters);
				oTableBinding.filter(aFilters, "Application");
			}
			this._showOverlay(false);
		}
	};

	/**
	 * Called once data is loaded in the binding (i.e. either backend fetch or once change event is fired)
	 * 
	 * @param {object} mEventParams - the event parameters
	 * @param {boolean} bForceUpdate - force update
	 * @private
	 */
	SmartTable.prototype._onDataLoadComplete = function(mEventParams, bForceUpdate) {
		if (this._bDataLoadPending || bForceUpdate) {
			this._bDataLoadPending = false;
			this.updateTableHeaderState();
		}
	};

	/**
	 * Returns true if the inner UI5 table was bound at least once by the SmartTable -or- if binding was done by the app.
	 * 
	 * @returns {Boolean} whether the inner UI5 table is bound
	 * @private
	 */
	SmartTable.prototype._isTableBound = function() {
		if (this._bIsTableBound) {
			return true;
		}
		if (this._oTable) {
			return this._oTable.isBound(this._sAggregation);
		}
		return false;
	};

	SmartTable.prototype.setNoData = function(oNoData) {
		// overwrite the original aggregation setter, otherwise parent relationship will be destroyed when a control is set to the inner table's
		// noData aggregation
		this._oNoData = oNoData;
	};

	SmartTable.prototype.getNoData = function() {
		return this._oNoData;
	};

	/**
	 * Sets the no data text to the internal table
	 * 
	 * @param {string} sOverwriteText - optional text to set on the table
	 * @private
	 */
	SmartTable.prototype._setNoDataText = function(sOverwriteText) {
		var fSetFunction = this._oTable.setNoData;
		if (!fSetFunction) {
			fSetFunction = this._oTable.setNoDataText;
		}

		if (!fSetFunction) {
			return;
		}

		var oNoData = sOverwriteText;
		if (!oNoData) {
			oNoData = this.getNoData();
		}

		if (!oNoData) {
			oNoData = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTTABLE_NO_RESULTS");
		}

		fSetFunction.call(this._oTable, oNoData, true);
	};

	/**
	 * This can be called once data is received to update table header (count) and toolbar buttons(e.g. Excel Export) enabled state
	 * 
	 * @public
	 */
	SmartTable.prototype.updateTableHeaderState = function() {
		this._refreshHeaderText();
		this._setExcelExportEnableState();
	};

	/**
	 * Creates the content based on the metadata/configuration
	 * 
	 * @private
	 */
	SmartTable.prototype._createContent = function() {
		var i, iLen = 0, oField, aIndexedColumns, oColumn, aRemainingColumnKeys = [];

		// Sync the current table columns with the _aColumnKeys array
		if (this._aExistingColumns && this._aExistingColumns.length) {
			this._aColumnKeys = [].concat(this._aExistingColumns.reverse());
		}

		aIndexedColumns = this._parseIndexedColumns();

		iLen = this._aTableViewMetadata.length;
		for (i = 0; i < iLen; i++) {
			oField = this._aTableViewMetadata[i];
			// Fill only inititally visible columns coming from metadata
			if (oField.isInitiallyVisible) {
				this._aColumnKeys.push(oField.name);
			} else {
				aRemainingColumnKeys.push(oField.name);
			}

			// Store the non-relevant columns in a map
			if (!(oField.isInitiallyVisible || oField.inResult)) {
				this._mLazyColumnMap[oField.name] = oField;
			} else {
				oColumn = this._createColumnForField(oField);
				// Add the column to the table
				this._oTable.addColumn(oColumn);
			}
		}

		this._insertIndexedColumns(aIndexedColumns);

		// Fill remaining columns from metadata into the column keys array
		this._aColumnKeys = this._aColumnKeys.concat(aRemainingColumnKeys);

		this._updateColumnsPopinFeature();

		this._storeInitialColumnSettings();
	};

	/**
	 * Creates the column from the field metadata and returns it
	 * 
	 * @param {object} oField - the field metadata from which we create the columns
	 * @returns {object} the created column
	 * @private
	 */
	SmartTable.prototype._createColumnForField = function(oField) {
		var oColumn, sId;
		// Replace invalid chars in name (e.g: "/") with "_"
		sId = this.getId() + "-" + oField.name.replace(/[^A-Za-z0-9_.:-]+/g, "_");
		oColumn = this._createColumn(oField, sId);
		// Mark field as created
		oField.isColumnCreated = true;
		// Set the persoData - relevant for personalisation
		oColumn.data("p13nData", {
			columnKey: oField.name,
			leadingProperty: oField.name, // used to fetch data, by adding this to $select param of OData request
			additionalProperty: oField.additionalProperty, // additional data to fetch in $select
			navigationProperty: oField.navigationProperty, // navigationProperty that has to be expanded in $expand
			sortProperty: oField.sortable ? oField.name : undefined,
			filterProperty: oField.filterable ? oField.name : undefined,
			fullName: oField.hasValueListAnnotation ? oField.fullName : null,
			type: oField.filterType,
			maxLength: oField.maxLength,
			precision: oField.precision,
			scale: oField.scale,
			align: oField.align,
			edmType: oField.type,
			displayBehaviour: oField.displayBehaviour,
			description: oField.description,
			isDigitSequence: oField.isDigitSequence,
			isCurrency: oField.isCurrencyField,
			unit: oField.unit,
			width: oField.width,
			aggregationRole: oField.aggregationRole
		});

		if (oField.filterable && oColumn.setFilterProperty) {
			oColumn.setFilterProperty(oField.name);
		}

		if (oField.sortable && oColumn.setSortProperty) {
			oColumn.setSortProperty(oField.name);
		}

		this._registerContentTemplateEvents(oField.template);

		return oColumn;
	};

	/**
	 * searches for columns which contains a columnIndex custom data property. Removes those columns from the table and returns them
	 * 
	 * @returns {array} the found columns together with their index
	 * @private
	 */
	SmartTable.prototype._parseIndexedColumns = function() {
		var i, iLength, oColumn, aIndexedColumns, oCustomData, sIndex, sColumnKey, iIndex, oTemplateCell;
		var aColumns = this._oTable.getColumns();
		var aCells = null;
		if (this._oTemplate && this._oTemplate.getCells) {
			aCells = this._oTemplate.getCells();
		}

		if (!aColumns) {
			return null;
		}

		aIndexedColumns = [];
		iLength = aColumns.length;

		for (i = 0; i < iLength; i++) {
			oColumn = aColumns[i];
			oCustomData = oColumn.data("p13nData");
			sIndex = null;
			sColumnKey = null;
			if (oCustomData) {
				sIndex = oCustomData.columnIndex;
				sColumnKey = oCustomData.columnKey;
			}
			iIndex = -1;
			if (sIndex !== null && sIndex !== undefined) {
				iIndex = parseInt(sIndex, 10);
			}
			if (!isNaN(iIndex) && iIndex > -1) {
				if (aCells) {
					oTemplateCell = aCells[i];
					this._oTemplate.removeCell(oTemplateCell);
				} else {
					oTemplateCell = null;
				}
				// Keep in sync with table - remove the columns from existing column array
				this._aColumnKeys.splice(i - aIndexedColumns.length, 1);

				aIndexedColumns.push({
					index: iIndex,
					columnKey: sColumnKey,
					column: oColumn,
					template: oTemplateCell
				});

				this._oTable.removeColumn(oColumn);
			}
		}

		aIndexedColumns.sort(function(col1, col2) {
			return col1.index - col2.index;
		});

		return aIndexedColumns;
	};

	/**
	 * inserts columns containing an index back to the table
	 * 
	 * @param {Array} aIndexedColumns - an array containing objects with index and columns
	 * @private
	 */
	SmartTable.prototype._insertIndexedColumns = function(aIndexedColumns) {
		var i, iLength, oColumn;

		if (!aIndexedColumns) {
			return;
		}

		iLength = aIndexedColumns.length;
		for (i = 0; i < iLength; i++) {
			oColumn = aIndexedColumns[i];
			// Keep in sync with table - add column at the specified location
			this._aColumnKeys.splice(oColumn.index, 0, oColumn.columnKey);
			// we keep also invisible columns in order not to loose information on the index within the table
			this._oTable.insertColumn(oColumn.column, oColumn.index);
			if (oColumn.template) {
				this._oTemplate.insertCell(oColumn.template, oColumn.index);
			}
		}
	};

	/**
	 * on sap.m.Table, this function activates the popin feature for the visible columns
	 * 
	 * @private
	 */
	SmartTable.prototype._updateColumnsPopinFeature = function() {
		if (!this._isMobileTable || !this.getDemandPopin()) { // popin only available on mobile table
			return;
		}

		var aColumns = this._oTable.getColumns();
		if (!aColumns) {
			return;
		}

		// get only visible columns
		aColumns = aColumns.filter(function(col) {
			return col.getVisible();
		});

		// sort columns according to their order property
		aColumns.sort(function(col1, col2) {
			return col1.getOrder() - col2.getOrder();
		});

		var oColumn, iLength = aColumns.length;

		for (var i = 0; i < iLength; i++) {
			oColumn = aColumns[i];
			if (i < 2) { // ensure always two columns
				oColumn.setDemandPopin(false);
				oColumn.setMinScreenWidth("1px");
			} else {
				oColumn.setDemandPopin(true);
				if (oColumn.getPopinDisplay() != "WithoutHeader") {
					oColumn.setPopinDisplay(sap.m.PopinDisplay.Inline);
				}
				oColumn.setMinScreenWidth((i + 1) * 10 + "rem");
			}
		}
	};

	/**
	 * stores the initial column settings
	 * 
	 * @private
	 */
	SmartTable.prototype._storeInitialColumnSettings = function() {
		this._aInitialSorters = [];
		PersonalizationUtil.createSort2Json(this._oTable, this._aInitialSorters, PersonalizationUtil.createArrayFromString(this.getIgnoreFromPersonalisation()));
	};

	/**
	 * on sap.m.Table, this function deactivates the popin feature for all columns
	 * 
	 * @private
	 */
	SmartTable.prototype._deactivateColumnsPopinFeature = function() {
		if (!this._isMobileTable) { // popin only available on mobile table
			return;
		}

		var aColumns = this._oTable.getColumns();
		if (!aColumns) {
			return;
		}

		var oColumn, iLength = aColumns.length;

		for (var i = 0; i < iLength; i++) {
			oColumn = aColumns[i];
			oColumn.setDemandPopin(false);
			oColumn.setMinScreenWidth("1px");
		}
	};

	/**
	 * registers events on the template controls which are exposed by the SmartTable
	 * 
	 * @param {sap.ui.core.Control} oTemplateControl - the control on which to register the events
	 * @private
	 */
	SmartTable.prototype._registerContentTemplateEvents = function(oTemplateControl) {
		if (oTemplateControl && oTemplateControl.attachChange) {
			oTemplateControl.attachChange(function(oEventParams) {
				this.fireFieldChange({
					changeEvent: oEventParams
				});
			}.bind(this));
		}
	};

	/**
	 * stores a list of initially created columns (if any)
	 * 
	 * @private
	 */
	SmartTable.prototype._updateInitialColumns = function() {
		var aColumns = this._oTable.getColumns(), iLen = aColumns ? aColumns.length : 0, oColumn, oColumnData, sColumnKey;
		while (iLen--) {
			sColumnKey = null;
			oColumn = aColumns[iLen];
			// Retrieve path from the property
			if (oColumn) {
				oColumnData = oColumn.data("p13nData");
				if (typeof oColumnData === "string") {
					try {
						oColumnData = JSON.parse(oColumnData);
					} catch (e) {
						// Invalid JSON
					}
					// Set back the object for faster access later
					if (oColumnData) {
						oColumn.data("p13nData", oColumnData);
					}
				}
				if (oColumnData) {
					sColumnKey = oColumnData["columnKey"];
				}
				if (sColumnKey) {
					this._aExistingColumns.push(sColumnKey);
				}
			}
		}
	};

	/**
	 * gets the array of visible column path that is used to create the select query
	 * 
	 * @private
	 * @returns {object} Map containing array of column paths to be selected and expanded
	 */
	SmartTable.prototype._getVisibleColumnPaths = function() {
		var mResult = {}, aSelect = [], aExpand = [], aColumns = this._oTable.getColumns(), i, iLen = aColumns ? aColumns.length : 0, oColumn, oColumnData, sPath, sAdditionalPath, sExpandPath;

		var fExtractAndInsertPathToArray = function(sPath, aArray) {
			var iPathLen, aPath;
			if (sPath) {
				aPath = sPath.split(",");
				iPathLen = aPath.length;
				// extract and add the additional paths if they don't already exist
				while (iPathLen--) {
					sPath = aPath[iPathLen];
					if (sPath && aArray.indexOf(sPath) < 0) {
						aArray.push(sPath);
					}
				}
			}
		};

		for (i = 0; i < iLen; i++) {
			oColumn = aColumns[i];
			sPath = null;
			if (oColumn.getVisible()) {
				if (oColumn.getLeadingProperty) {
					sPath = oColumn.getLeadingProperty();
				}

				oColumnData = oColumn.data("p13nData");
				if (oColumnData) {
					if (!sPath) {
						sPath = oColumnData["leadingProperty"];
					}
					sAdditionalPath = oColumnData["additionalProperty"];
					sExpandPath = oColumnData["navigationProperty"];
				}

				if (sPath && aSelect.indexOf(sPath) < 0) {
					aSelect.push(sPath);
				}
				// Check if additionalPath contains an array of fields
				fExtractAndInsertPathToArray(sAdditionalPath, aSelect);

				// Check if additionalPath contains an array of fields
				fExtractAndInsertPathToArray(sExpandPath, aExpand);
			}
		}
		mResult["select"] = aSelect;
		mResult["expand"] = aExpand;
		return mResult;
	};

	/**
	 * Creates a table based on the configuration, if necessary. This also prepares the methods to be used based on the table type.
	 * 
	 * @private
	 */
	SmartTable.prototype._createTable = function() {
		var aContent = this.getItems(), iLen = aContent ? aContent.length : 0, oTable, sId;
		this._sAggregation = "rows";
		// Check if a Table already exists in the content (Ex: from view.xml)
		while (iLen--) {
			oTable = aContent[iLen];
			if (oTable instanceof Table || oTable instanceof ResponsiveTable) {
				break;
			}
			oTable = null;
		}

		// If a Table exists determine its type else create one based on the tableType property!
		if (oTable) {
			this._oTable = oTable;
			if (oTable instanceof AnalyticalTable) {
				this._isAnalyticalTable = true;
			} else if (oTable instanceof ResponsiveTable) {
				this._isMobileTable = true;
				// get the item template from the view
				this._oTemplate = (oTable.getItems() && oTable.getItems().length > 0) ? oTable.getItems()[0] : new sap.m.ColumnListItem();
				oTable.removeAllItems();
			} else if (oTable instanceof TreeTable) {
				this._isTreeTable = true;
			}
			// If a table already exists --> get the list of columns to ignore
			this._updateInitialColumns();
		} else {
			sId = this.getId() + "-ui5table";
			// Create table based on tableType
			if (this.getTableType() === "AnalyticalTable") {
				this._isAnalyticalTable = true;
				this._oTable = new AnalyticalTable(sId, {
					enableCustomFilter: true
				});
			} else if (this.getTableType() === "ResponsiveTable") {
				this._isMobileTable = true;
				this._oTable = new ResponsiveTable(sId, {
					growing: true
				});
				this._oTemplate = new sap.m.ColumnListItem();
			} else if (this.getTableType() === "TreeTable") {
				this._isTreeTable = true;
				this._oTable = new TreeTable(sId, {
					selectionMode: sap.ui.table.SelectionMode.MultiToggle
				});
			} else {
				this._oTable = new Table(sId, {
					selectionMode: sap.ui.table.SelectionMode.MultiToggle
				});
			}

			if (this._oTable.setVisibleRowCountMode) {
				this._oTable.setVisibleRowCountMode(sap.ui.table.VisibleRowCountMode.Auto);
			}

			this.insertItem(this._oTable, 2);
		}
		if (!this._oTable.getLayoutData()) {
			// Checking if Table is of type sap.m.Table and visibleRowCountMode is not set to Auto
			// Then baseSize is set to auto. This check is to ensure corrent rendering of SmartTable in IE and Safari
			if (this._oTable instanceof sap.m.Table || (this._oTable.getVisibleRowCountMode && this._oTable.getVisibleRowCountMode() !== sap.ui.table.VisibleRowCountMode.Auto)) {
				this._oTable.setLayoutData(new sap.m.FlexItemData({
					growFactor: 1,
					baseSize: "auto"
				}));
			} else {
				// baseSize="0%" for tables that are not of type sap.m.Table
				this._oTable.setLayoutData(new sap.m.FlexItemData({
					growFactor: 1,
					baseSize: "0%"
				}));
			}
		}
		// Set ariaLabelledBy on the inner UI5 table
		if (this._oTable.addAriaLabelledBy) {
			this._oTable.addAriaLabelledBy(this.getId() + "-header");
		}
		this._oTable.addStyleClass("sapUiCompSmartTableInnerTable");

		this._oTable.setEnableBusyIndicator(true);
		this._oTable.setBusyIndicatorDelay(100);

		if (this._oTable.setEnableCustomFilter) {
			this._oTable.setEnableCustomFilter(this.getEnableCustomFilter());
		}

		// Always disable Column Visiblilty menu item
		if (this._oTable.setShowColumnVisibilityMenu) {
			this._oTable.setShowColumnVisibilityMenu(false);
		}

		if (this._oTable.getEnableCustomFilter && this._oTable.getEnableCustomFilter() && this._bIsFilterPanelEnabled) {
			// disable the cell filter if custom filter is enabled
			if (this._oTable.setEnableCellFilter) {
				this._oTable.setEnableCellFilter(false);
			}
			if (this._oTable.attachCustomFilter) {
				this._oTable.attachCustomFilter(this._showTableFilterDialog.bind(this));
			}
		}

		// Replace the prototype methods to suit the table being used!
		if (this._isAnalyticalTable) {
			this._createColumn = this._createAnalyticalColumn;
		} else if (this._isMobileTable) {
			this._sAggregation = "items";
			this._createColumn = this._createMobileColumn;
			// map bindItems to bindRows for Mobile Table to enable reuse of rebind mechanism
			this._oTable.bindRows = this._oTable.bindItems;
		}

		if (!this._isMobileTable) {
			this._oTable.attachEvent("_rowsUpdated", function() {
				this._setExcelExportEnableState();
			}, this);
		}
		// Always enable the better scroll behaviour - so that scroll/data request only happens once scrollbar is released
		if (this._oTable._setLargeDataScrolling) {
			this._oTable._setLargeDataScrolling(true);
		}
	};

	/**
	 * returns the internally used table object
	 * 
	 * @public
	 * @returns {object} the table
	 */
	SmartTable.prototype.getTable = function() {
		return this._oTable;
	};

	/**
	 * Shows the filter dialog via the Personalisation controller
	 * 
	 * @param {object} oEvent The event parameters
	 * @private
	 */
	SmartTable.prototype._showTableFilterDialog = function(oEvent) {
		if (this._oPersController) {
			this._oPersController.openDialog({
				filter: {
					visible: true,
					payload: {
						column: oEvent.getParameter("column")
					}
				}
			});
		}
	};

	/**
	 * Creates and returns a Column that can be added to the table, based on the metadata provided by the TableProvider
	 * 
	 * @param {object} oField The column's metadata
	 * @param {string} sId The id to be set on the column
	 * @private
	 * @returns {object} the column that is created
	 */
	SmartTable.prototype._createColumn = function(oField, sId) {
		var oColumn;
		oColumn = new Column(sId, {
			autoResizable: true,
			hAlign: oField.align,
			width: oField.width,
			visible: oField.isInitiallyVisible,
			label: new Label(sId + "-header", {
				textAlign: oField.align,
				text: oField.label
			}),
			sorted: oField.sorted,
			sortOrder: oField.sortOrder,
			tooltip: oField.quickInfo,
			showSortMenuEntry: oField.sortable,
			showFilterMenuEntry: oField.filterable && this._bIsFilterPanelEnabled,
			name: oField.fieldName,
			template: oField.template
		});
		return oColumn;
	};

	/**
	 * Creates and returns an AnalyticalColumn that can be added to the AnalyticalTable, based on the metadata provided by the TableProvider
	 * 
	 * @param {object} oField The column's metadata
	 * @param {string} sId The id to be set on the column
	 * @private
	 * @returns {object} the column that is created
	 */
	SmartTable.prototype._createAnalyticalColumn = function(oField, sId) {
		var oColumn;
		// Add a special style class to make currency fields bold in sum/total row
		if (oField.isCurrencyField && oField.template.addStyleClass) {
			oField.template.addStyleClass("sapUiCompCurrencyBold");
		}
		oColumn = new AnalyticalColumn(sId, {
			autoResizable: true,
			hAlign: oField.align,
			width: oField.width,
			visible: oField.isInitiallyVisible,
			inResult: oField.inResult,
			label: new Label(sId + "-header", {
				textAlign: oField.align,
				text: oField.label
			}),
			tooltip: oField.quickInfo,
			sorted: oField.sorted,
			sortOrder: oField.sortOrder,
			grouped: oField.grouped,
			showIfGrouped: oField.grouped,
			showSortMenuEntry: oField.sortable,
			showFilterMenuEntry: oField.filterable && this._bIsFilterPanelEnabled,
			summed: oField.summed,
			leadingProperty: oField.name,
			template: oField.template
		});
		return oColumn;
	};

	/**
	 * Creates and returns a MobileColumn that can be added to the mobile table, based on the metadata provided by the TableProvider
	 * 
	 * @param {object} oField The column's metadata
	 * @param {string} sId The id to be set on the column
	 * @private
	 * @returns {object} the column that is created
	 */
	SmartTable.prototype._createMobileColumn = function(oField, sId) {
		var oColumn;
		oColumn = new Column1(sId, {
			hAlign: oField.align,
			visible: oField.isInitiallyVisible,
			header: new Text(sId + "-header", {
				textAlign: oField.align,
				text: oField.label,
				tooltip: oField.quickInfo
			}),
			tooltip: oField.quickInfo,
			width: oField.isImageURL ? "3em" : undefined
		});

		if (this._oTemplate) {
			this._oTemplate.addCell(oField.template);
		}
		return oColumn;
	};

	/**
	 * Interface function for SmartVariantManagement control, returns the current used variant data
	 * 
	 * @public
	 * @returns {object} The currently set variant
	 */
	SmartTable.prototype.fetchVariant = function() {
		if (this._oCurrentVariant === "STANDARD" || this._oCurrentVariant === null) {
			return {};
		}

		return this._oCurrentVariant;
	};

	/**
	 * Interface function for SmartVariantManagement control, sets the current variant. <b>Note:</b> If an application default variant exists, then
	 * all other variants are extended from this application default variant.
	 * 
	 * @param {object} oVariantJSON The variants json
	 * @param {string} sContext Describes the context in which the apply was executed
	 * @public
	 */
	SmartTable.prototype.applyVariant = function(oVariantJSON, sContext) {

		this._oCurrentVariant = oVariantJSON;
		if (this._oCurrentVariant === "STANDARD") {
			this._oCurrentVariant = null;
		}

		PersonalizationUtil.recoverPersonalisationDateData(this._oCurrentVariant, this._oTable);

		// Set instance flag to indicate that we are currently in the process of applying the changes
		this._bApplyingVariant = true;
		// Suppress refresh to prevent backend roundtrips
		if (this._oTable._setSuppressRefresh) {
			this._oTable._setSuppressRefresh(true);
		}

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
	 * Interface function for SmartVariantManagement control. It indicates, that the variant management is fully initialized.
	 * 
	 * @internal
	 */
	SmartTable.prototype.variantsInitialized = function() {
		this._bVariantInitialised = true;
		this._checkAndTriggerBinding();
	};

	/**
	 * Returns the current UI state of the <code>SmartTable</code> control.<br>
	 * <b>Note:</b><br>
	 * The following limitations apply:
	 * <ul>
	 * <li>Visualizations can only be used to modify the visibility and order of columns, the template or importance of the column cannot be changed</li>
	 * <li>MaxItems is not supported</li>
	 * <li>RequestAtLeast contains values that are combined from both the <code>SmartTable</code> control property and PresentationVariant
	 * annotation, but when it is updated it only affects the internal array. The property in the <code>SmartTable</code> stays the same as before</li>
	 * <li>Changes to RequestAtLeast alone will not lead to a new data request</li>
	 * <li>RequestAtLeast is not supported in <code>AnalyticalTable</code> scenario</li>
	 * <li>Any other limitations, like the ones mentioned in {@link sap.ui.comp.state.UIState}, also apply</li>
	 * </ul>
	 * 
	 * @returns {sap.ui.comp.state.UIState} Current UI state
	 * @public
	 * @since 1.52
	 */
	SmartTable.prototype.getUiState = function() {
		var oUIStateP13n = this._oPersController ? this._oPersController.getDataSuiteFormatSnapshot() : null;
		return new UIState({
			presentationVariant: {
				SortOrder: oUIStateP13n ? oUIStateP13n.SortOrder : [],
				GroupBy: oUIStateP13n ? oUIStateP13n.GroupBy : [],
				Total: oUIStateP13n ? oUIStateP13n.Total : [],
				RequestAtLeast: this._getRequestAtLeastFields(),
				Visualizations: oUIStateP13n ? oUIStateP13n.Visualizations : []
			},
			selectionVariant: {
				SelectOptions: oUIStateP13n ? oUIStateP13n.SelectOptions : []
			},
			variantName: this.getCurrentVariantId()
		});
	};

	/**
	 * Replaces the current UI state of the <code>SmartTable</code> control with the data represented in {@link sap.ui.comp.state.UIState}.<br>
	 * <b>Note:</b><br>
	 * The following limitations apply:
	 * <ul>
	 * <li>Visualizations can only be used to modify the visibility and order of columns, the template or importance of the column cannot be changed</li>
	 * <li>MaxItems is not supported</li>
	 * <li>RequestAtLeast contains values that are combined from both the <code>SmartTable</code> control property and PresentationVariant
	 * annotation, but when it is updated it only affects the internal array. The property in the <code>SmartTable</code> stays the same as before</li>
	 * <li>Changes to RequestAtLeast alone will not lead to a new data request</li>
	 * <li>RequestAtLeast is not supported in <code>AnalyticalTable</code> scenario</li>
	 * <li>Any other limitations, like the ones mentioned in {@link sap.ui.comp.state.UIState}, also apply</li>
	 * </ul>
	 * 
	 * @param {sap.ui.comp.state.UIState} oUIState the new representation of UI state
	 * @public
	 * @since 1.52
	 */
	SmartTable.prototype.setUiState = function(oUIState) {
		var aRequestAtLeast, oPersistentDataVariant;
		if (!oUIState.getPresentationVariant() || !oUIState.getPresentationVariant().Visualizations.some(function(oVisualization) {
			return oVisualization.Type === "LineItem";
		})) {
			jQuery.sap.log.error("sap.ui.comp.smarttable.SmartTable.prototype.setUiState: 'Visualizations' array should contain at least one 'LineItem' entry");
			return;
		}

		aRequestAtLeast = oUIState.getPresentationVariant().RequestAtLeast ? [].concat(oUIState.getPresentationVariant().RequestAtLeast) : [];

		if (!jQuery.sap.equal(aRequestAtLeast, this._getRequestAtLeastFields())) {
			this._aAlwaysSelect = aRequestAtLeast;
		}

		if (this._oPersController) {
			oPersistentDataVariant = (this._oVariantManagement && oUIState.getVariantName()) ? this._oVariantManagement.getVariantContent(this, oUIState.getVariantName()) : {};
			this._oPersController.setDataSuiteFormatSnapshot(jQuery.extend(true, {}, oUIState.getPresentationVariant(), oUIState.getSelectionVariant()), oPersistentDataVariant);
		}
	};

	/**
	 * Returns an Array containing the RequestAtLeast fields that includes both "requestAtLeast" property and back-end annotation fields
	 * 
	 * @private
	 * @returns {Array} an Array containing the RequestAtLeast fields
	 */
	SmartTable.prototype._getRequestAtLeastFields = function() {
		var sRequestAtLeastFields = this.getRequestAtLeastFields();
		var aAlwaysSelect = sRequestAtLeastFields ? sRequestAtLeastFields.split(",") : [];
		return aAlwaysSelect.concat(this._aAlwaysSelect);
	};

	/**
	 * Event handler fired when a column is requested by Personalisation/VariantManagement
	 * 
	 * @param {object} oEvent The event parameter
	 */
	SmartTable.prototype._personalisationRequestColumns = function(oEvent) {
		var aColumnKeys = oEvent.getParameter("columnKeys"), sColumnKey, i, iLength, oField, oColumn, oColumnKey2ColumnMap = {};

		iLength = aColumnKeys.length;
		for (i = 0; i < iLength; i++) {
			sColumnKey = aColumnKeys[i];
			oField = this._mLazyColumnMap[sColumnKey];
			if (oField) {
				oColumn = this._createColumnForField(oField);
				if (this._isMobileTable) {
					// Add the column to the table
					this._oTable.addColumn(oColumn);
				}
				oColumnKey2ColumnMap[oField.name] = oColumn;
			}
		}

		this._oPersController.addColumns(oColumnKey2ColumnMap);
	};

	/**
	 * eventhandler fired before personalisation changes are applied to the table
	 * 
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartTable.prototype._beforePersonalisationModelDataChange = function(oEvent) {
		// Suppress refresh to prevent backend roundtrips
		if (this._oTable.suspendUpdateAnalyticalInfo) {
			this._oTable.suspendUpdateAnalyticalInfo();
		}
	};

	/**
	 * eventhandler fired after personalisation changes are potentially applied to the table. Event will be fired before the event
	 * "afterP13nModelDataChange"
	 * 
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartTable.prototype._afterPersonalisationModelDataChange = function(oEvent) {
		this._updateColumnsPopinFeature();
	};

	/**
	 * eventhandler for personalisation changed
	 * 
	 * @param {object} oEvent The event arguments
	 * @private
	 */
	SmartTable.prototype._personalisationModelDataChange = function(oEvent) {
		this._oCurrentVariant = oEvent.getParameter("persistentData");
		var oChangeInfo = oEvent.getParameter("changeType");
		var changeStatus = this._getChangeStatus(oChangeInfo);

		if (changeStatus === sap.ui.comp.personalization.ChangeType.Unchanged) {
			return;
		}

		if (!this._bApplyingVariant) {
			if (!this.getUseVariantManagement()) {
				this._persistPersonalisation();
			} else if (this._oVariantManagement) {
				this._oVariantManagement.currentVariantSetModified(true);
			}
		}

		if (changeStatus === sap.ui.comp.personalization.ChangeType.ModelChanged && this._isTableBound()) {
			if (oChangeInfo && oChangeInfo.columns === sap.ui.comp.personalization.ChangeType.ModelChanged) {
				this._bForceTableUpdate = true;
			}
			// if table was bound already -and:
			// If a SmartFilter is associated with SmartTable - trigger search on the SmartFilter
			if (this._oSmartFilter) {
				this._oSmartFilter.search();
			} else {
				// Rebind Table only if data was set on it once or no smartFilter is attached!
				this._reBindTable(null);
			}
		}
	};

	/**
	 * returns the current filter and sorting options from the table personalisation/variants
	 * 
	 * @private
	 * @param {object} oChangeInfo The change info given by the personalization controller
	 * @returns {sap.ui.comp.personalization.ChangeType} the merged change status
	 */
	SmartTable.prototype._getChangeStatus = function(oChangeInfo) {
		if (!oChangeInfo) {
			// change info not provided return ModelChanged to indicate that we need to update everything internally
			return sap.ui.comp.personalization.ChangeType.ModelChanged;
		}

		if (oChangeInfo.sort === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeInfo.filter === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeInfo.columns === sap.ui.comp.personalization.ChangeType.ModelChanged || oChangeInfo.group === sap.ui.comp.personalization.ChangeType.ModelChanged) {
			// model has changed and was not applied to table
			return sap.ui.comp.personalization.ChangeType.ModelChanged;
		}

		if (oChangeInfo.sort === sap.ui.comp.personalization.ChangeType.TableChanged || oChangeInfo.filter === sap.ui.comp.personalization.ChangeType.TableChanged || oChangeInfo.columns === sap.ui.comp.personalization.ChangeType.TableChanged || oChangeInfo.group === sap.ui.comp.personalization.ChangeType.TableChanged) {
			// change was already applied to table
			return sap.ui.comp.personalization.ChangeType.TableChanged;
		}

		return sap.ui.comp.personalization.ChangeType.Unchanged;
	};

	/**
	 * returns the current filter and sorting options from the table personalisation/variants
	 * 
	 * @private
	 * @returns {object} current variant's filter and sorting options
	 */
	SmartTable.prototype._getTablePersonalisationData = function() {
		if (!this._oCurrentVariant) {
			return null;
		}

		var aSorters = [], aFilters = [], aExcludeFilters = [], oExcludeFilters, oGroupItem, oGroupSorter, aSortData, oColumn, oColumnData, sGroupPath, sPath, sColumnsText = "", bIsTimeField;
		// Clear the fields that are part of $select due to grouping (sap.m.Table)
		this._sSelectForGroup = null;
		// group handling
		if (this._isMobileTable && this._oCurrentVariant.group && this._oCurrentVariant.group.groupItems) {
			oGroupItem = this._oCurrentVariant.group.groupItems[0];
			oColumn = this._getColumnByKey(oGroupItem.columnKey);
			if (oColumn) {
				sColumnsText = oColumn.getHeader().getText();
			}
			sPath = this._getPathFromColumnKeyAndProperty(oGroupItem.columnKey, "sortProperty");
			// Path can be null if the variant data is invalid/contains only invalid information
			if (sPath) {
				// Initialise the GroupPath to a new variable as it is being used in the formatter function
				sGroupPath = sPath;
				oGroupSorter = new sap.ui.model.Sorter(sGroupPath, oGroupItem.operation === "GroupDescending", function(oContext) {
					var sKey = oContext.getProperty(sGroupPath);
					return {
						key: sKey,
						text: sColumnsText ? sColumnsText + " : " + sKey : sKey
					};
				});
				// Set the group field to select path so that it can be added to $select
				this._sSelectForGroup = sGroupPath;
				aSorters.push(oGroupSorter);
			}
		}

		// sort handling
		if (this._oCurrentVariant.sort) {
			aSortData = this._oCurrentVariant.sort.sortItems;
		} else {
			aSortData = this._aInitialSorters;
		}

		if (aSortData) {
			aSortData.forEach(function(oModelItem) {
				var bDescending = oModelItem.operation === "Descending";
				sPath = this._getPathFromColumnKeyAndProperty(oModelItem.columnKey, "sortProperty");
				// Path can be null if the variant data is invalid/contains only invalid information
				if (sPath) {
					if (oGroupSorter && oGroupSorter.sPath === sPath) {
						oGroupSorter.bDescending = bDescending;
					} else {
						aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
					}
				}
			}, this);
		}

		// Filter Handling
		if (this._oCurrentVariant.filter) {
			this._oCurrentVariant.filter.filterItems.forEach(function(oModelItem) {
				var oValue1 = oModelItem.value1, oValue2 = oModelItem.value2;
				// Filter path has be re-calculated below
				sPath = null;
				bIsTimeField = false;
				oColumn = this._getColumnByKey(oModelItem.columnKey);
				if (oColumn) {
					if (oColumn.getFilterProperty) {
						sPath = oColumn.getFilterProperty();
					}
					oColumnData = oColumn.data("p13nData");
					if (oColumnData) {
						bIsTimeField = oColumnData.type === "time";
						if (!sPath) {
							sPath = oColumnData["filterProperty"];
						}
					}
				}
				// Path can be null if the variant data is invalid/contains only invalid information
				if (sPath) {
					if (bIsTimeField) {
						if (oValue1 instanceof Date) {
							oValue1 = FormatUtil.getEdmTimeFromDate(oValue1);
						}
						if (oValue2 instanceof Date) {
							oValue2 = FormatUtil.getEdmTimeFromDate(oValue2);
						}
					} else if (oValue1 instanceof Date && this._oTableProvider && this._oTableProvider.getIsUTCDateHandlingEnabled()) {
						oValue1 = FilterProvider.getDateInUTCOffset(oValue1);
						oValue2 = oValue2 ? FilterProvider.getDateInUTCOffset(oValue2) : oValue2;
					}
					if (oModelItem.exclude) {
						aExcludeFilters.push(new sap.ui.model.Filter(sPath, FilterOperator.NE, oValue1));
					} else {
						aFilters.push(new sap.ui.model.Filter(sPath, oModelItem.operation, oValue1, oValue2));
					}
				}
			}, this);

			if (aExcludeFilters.length) {
				oExcludeFilters = new sap.ui.model.Filter(aExcludeFilters, true);
			}
		}

		return {
			filters: aFilters,
			excludeFilters: oExcludeFilters,
			sorters: aSorters
		};
	};

	/**
	 * Returns the column for the given column key
	 * 
	 * @param {string} sColumnKey - the column key for the required column
	 * @returns {object} The found column or null
	 * @private
	 */
	SmartTable.prototype._getColumnByKey = function(sColumnKey) {
		var aColumns, oColumn, iLength, i, oCustomData;
		if (this._oTable) {
			aColumns = this._oTable.getColumns();
			iLength = aColumns.length;
			for (i = 0; i < iLength; i++) {
				oColumn = aColumns[i];
				oCustomData = oColumn.data("p13nData");
				if (oCustomData && oCustomData.columnKey === sColumnKey) {
					return oColumn;
				}
			}
		}

		return null;
	};

	/**
	 * Retrieves the path for the specified property and column key from the array of table columns
	 * 
	 * @param {string} sColumnKey - the column key specified on the table
	 * @param {string} sProperty - the property path that needs to be retrieved from the column
	 * @returns {string} The path that can be used by sorters, filters etc.
	 * @private
	 */
	SmartTable.prototype._getPathFromColumnKeyAndProperty = function(sColumnKey, sProperty) {
		var sPath = null, oColumn, oColumnData;
		oColumn = this._getColumnByKey(sColumnKey);

		// Retrieve path from the property
		if (oColumn) {
			if (sProperty == "sortProperty" && oColumn.getSortProperty) {
				sPath = oColumn.getSortProperty();
			} else if (sProperty == "filterProperty" && oColumn.getFilterProperty) {
				sPath = oColumn.getFilterProperty();
			} else if (sProperty == "leadingProperty" && oColumn.getLeadingProperty) {
				sPath = oColumn.getLeadingProperty();
			}

			if (!sPath) {
				oColumnData = oColumn.data("p13nData");
				if (oColumnData) {
					sPath = oColumnData[sProperty];
				}
			}
		}

		return sPath;
	};

	/**
	 * triggers (hidden) VariantManagementControl to persist personalisation this function is called in case no VariantManagementControl is used
	 * 
	 * @private
	 */
	SmartTable.prototype._persistPersonalisation = function() {
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.getVariantsInfo(function(aVariants) {
				var bOverwrite, sPersonalisationVariantKey = null;
				if (aVariants && aVariants.length > 0) {
					sPersonalisationVariantKey = aVariants[0].key;
				}
				bOverwrite = sPersonalisationVariantKey !== null;
				this._oVariantManagement.fireSave({
					name: "Personalisation",
					global: false,
					overwrite: bOverwrite,
					key: sPersonalisationVariantKey,
					def: true
				});
			}.bind(this));
		}
	};

	/**
	 * returns the id of the currently selected variant.
	 * 
	 * @public
	 * @returns {string} id of the currently selected variant
	 */
	SmartTable.prototype.getCurrentVariantId = function() {
		return this._oVariantManagement ? this._oVariantManagement.getCurrentVariantId() : "";
	};

	/**
	 * Set the current variant according to the sVariantId. In case an empty string or null or undefined was passed the STANDARD will be set. STANDARD
	 * will also be set, in case the passed sVariantId could not be found. In case neither a flexibility variant, nor the content for the standard
	 * variant could not be obtained, nor the personalisable control obtained nothing will be executed/changed
	 * 
	 * @public
	 * @param {string} sVariantId id of the currently selected variant
	 */
	SmartTable.prototype.setCurrentVariantId = function(sVariantId) {
		if (this._oVariantManagement && !this._oVariantManagement.isPageVariant()) {
			this._oVariantManagement.setCurrentVariantId(sVariantId);
		} else {
			jQuery.sap.log.error("sap.ui.comp.smarttable.SmartTable.prototype.setCurrentVariantId: VariantManagement does not exist, or is a page variant");
		}
	};

	/**
	 * Checks whether the control is initialised
	 * 
	 * @returns {boolean} returns whether control is already initialised
	 * @protected
	 */
	SmartTable.prototype.isInitialised = function() {
		return !!this.bIsInitialised;
	};

	SmartTable.prototype._aAvailablePanels = [
		"Columns", "Sort", "Filter", "Group"
	];

	/**
	 * Opens the desired panel of the personalization dialog.<br>
	 * <i>Note:</i> Calling this for panels that are globally hidden (E.g. manually by the application, or due to unavailability of functionality)
	 * leads to an empty dialog being shown.
	 * 
	 * @param {string} sPanel The desired panel; the value is either "Columns", "Sort", "Filter" or "Group"
	 * @public
	 * @since 1.48.0
	 */
	SmartTable.prototype.openPersonalisationDialog = function(sPanel) {
		if (!sPanel || this._aAvailablePanels.indexOf(sPanel) < 0) {
			jQuery.sap.log.warning("sap.ui.comp.smarttable.SmartTable.prototype.openPersonalisationDialog: " + sPanel + " is not a valid panel!");
			return;
		}
		if (this._oPersController) {
			var oPanel = {};
			oPanel[sPanel.toLowerCase()] = {
				visible: true
			};
			this._oPersController.openDialog(oPanel);
		}
	};

	/**
	 * Cleans up the control
	 * 
	 * @protected
	 */
	SmartTable.prototype.exit = function() {
		var i, oField;
		// Cleanup smartFilter events as it can be used again stand-alone without being destroyed!
		if (this._oSmartFilter) {
			this._oSmartFilter.detachSearch(this._reBindTable, this);
			this._oSmartFilter.detachFilterChange(this._filterChangeEvent, this);
			this._oSmartFilter = null;
		}
		if (this._oTableProvider && this._oTableProvider.destroy) {
			this._oTableProvider.destroy();
		}
		this._oTableProvider = null;
		if (this._oPersController && this._oPersController.destroy) {
			this._oPersController.destroy();
		}
		this._oPersController = null;
		if (this._oVariantManagement) {
			this._oVariantManagement.detachSave(this._variantSaved, this);
			this._oVariantManagement.detachAfterSave(this._variantAfterSave, this);
			if (!this._oVariantManagement.isPageVariant() && this._oVariantManagement.destroy) {
				this._oVariantManagement.destroy();
			}
		}
		if (this._oFullScreenUtil) {
			this._oFullScreenUtil.cleanUpFullScreen(this);
			this._oFullScreenUtil = null;
		}
		if (this._oEditModel) {
			this._oEditModel.destroy();
		}

		if (this._oNoData && this._oNoData.destroy) {
			this._oNoData.destroy();
		}
		this.oNoData = null;

		// Destroy template controls for fields that have not been added as columns
		if (this._aTableViewMetadata) {
			i = this._aTableViewMetadata.length;
			while (i--) {
				oField = this._aTableViewMetadata[i];
				if (oField && !oField.isColumnCreated && oField.template) {
					oField.template.destroy();
				}
			}
		}
		this._aTableViewMetadata = null;

		this._oEditModel = null;
		this._oVariantManagement = null;
		this._oCurrentVariant = null;
		this._aExistingColumns = null;
		this._mLazyColumnMap = null;
		this._aColumnKeys = null;
		this._aAlwaysSelect = null;
		this._oCustomToolbar = null;
		// Destroy the toolbar if it is not already inserted into items; else it will automatically be destroyed
		if (this._oToolbar && !this._bToolbarInsertedIntoItems) {
			this._oToolbar.destroy();
		}
		this._oToolbar = null;
		if (this._oUseExportToExcel && !this.getUseExportToExcel()) {
			this._oUseExportToExcel.destroy();
		}
		this._oUseExportToExcel = null;
		this._oTablePersonalisationButton = null;
		this._oP13nDialogSettings = null;
		// Destroy the template always as templateShareable=true (default =1)!
		if (this._oTemplate) {
			this._oTemplate.destroy();
		}
		this._oTemplate = null;
		this._oView = null;
		this._oTable = null;
	};

	return SmartTable;

}, /* bExport= */true);
