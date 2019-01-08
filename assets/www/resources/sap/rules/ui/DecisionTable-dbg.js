/*!   
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	                          
 */

// Provides this._validatecontrol sap.rules.ui.   
sap.ui.define([
	"jquery.sap.global",
	"./library",
	"sap/rules/ui/DecisionTableCell",
	"sap/rules/ui/RuleBase",
	"sap/rules/ui/Utils",
	"sap/ui/table/Table",
	"sap/ui/table/Column",
	"sap/m/Toolbar",
	"sap/m/Popover",
	"sap/m/Menu",
	"sap/m/Dialog",
	"sap/m/MenuButton",
	"sap/m/Button",
	"sap/m/ToolbarSpacer",
	"sap/m/Text",
	"sap/m/Input",
	"sap/m/ObjectIdentifier",
	"sap/m/Link",
	"sap/m/Label",
	"sap/m/BusyIndicator",
	"sap/m/DisplayListItem",
	"sap/m/MenuItem",
	"sap/m/FlexBox",
	"sap/m/MessageStrip",
	"sap/rules/ui/DecisionTableSettingsOld",
	"sap/rules/ui/type/DecisionTableCell"
], function(jQuery, library, DecisionTableCell, RuleBase, Utils, Table, Column, Toolbar,

	Popover, Menu, Dialog, MenuButton, Button, ToolbarSpacer, Text, Input, ObjectIdentifier,
	Link, Label, BusyIndicator, DisplayListItem, MenuItem, FlexBox, MessageStrip, DecisionTableSettingsOld, DecisionTableCellFormatter) {

	"use strict";

	/**
	 * Constructor for a new DecisionTable Control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * Some class description goes here.
	 * @extends  Control
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @private
	 * @alias sap.rules.ui.DecisionTable
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) design time meta model
	 */

	var dataPartName = {
		vocabulary: "vocabulary",
		rule: "rule",
		columns: "columns",
		rows: "rows"
	};

	var visibleRowCount = {
		emptyTable: 3,
		max: 999
	};

	var oDecisionTable = RuleBase.extend("sap.rules.ui.DecisionTable", {
		metadata: {
			properties: {

				enableSettings: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				cellFormat: {
					type: "sap.rules.ui.DecisionTableCellFormat",
					defaultValue: sap.rules.ui.DecisionTableCellFormat.Both
				},

				hitPolicies: {
					type: "sap.rules.ui.RuleHitPolicy[]",
					defaultValue: [sap.rules.ui.RuleHitPolicy.FirstMatch, sap.rules.ui.RuleHitPolicy.AllMatch]
				},

				lineActionBuffer: {
					type: "any",
					defaultValue: {
						rowPath: null,
						operation: null
					}
				},
				decisionTableFormat: {
                    type: "sap.rules.ui.DecisionTableFormat",
                    defaultValue: sap.rules.ui.DecisionTableFormat.CellFormat
                }
			},
			aggregations: {

				"_toolbar": {
					type: "sap.m.Toolbar",
					multiple: false,
					singularName: "_toolbar"
				},

				"_table": {
					type: "sap.ui.core.Control",
					multiple: false,
					singularName: "_table"
				},

				"_errorsText": {
					type: "sap.m.MessageStrip", //"sap.m.Text",
					multiple: false,
					singularName: "_errorsText"
				}
			}
		},

		_addErrorLabel: function() {

			//var oErrorLabel = new sap.m.Text().addStyleClass("sapThemeCriticalText").addStyleClass("sapUiSmallMargin");
			var oErrorLabel = new MessageStrip({
				showCloseButton: true,
				showIcon: true,
				type: sap.ui.core.MessageType.Error,
				visible: false
			}).addStyleClass("sapUiTinyMargin");
			this.setAggregation("_errorsText", oErrorLabel, true);
		},

		init: function() {

			this.multiHeaderFlag = false; //flag for calculate only once header span for multi header in columnFactory function
			this.resetContent = true;

			this._initInternalModel();
			this._initDisplayModel();
			this._initDataBucket();

			this.bindProperty("busy", "dtModel>/busyState");

			this.oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");

			this._addToolBar();
			this._addTable();
			this._addErrorLabel();
			this._decisionTableCellFormatter = new DecisionTableCellFormatter();
			this.setBusyIndicatorDelay(0);
		},

		/** Control's properties getters/setters */

		setEditable: function(value) {

			this.setProperty("editable", value, true);
			this._internalModel.setProperty("/editable", value);
			this._internalModel.setProperty("/sequenceExist", this.isSequenceExistsInOdataMetadata());
			var oTable = this.getAggregation("_table");
			var oToolbar = this.getAggregation("_toolbar");
			if (value === false) {
				oTable.addStyleClass("sapRULDecisionTableEdit");
				oToolbar.removeStyleClass("sapRULDecisionTableToolBar");
			} else {
				oTable.removeStyleClass("sapRULDecisionTableEdit");
				oToolbar.addStyleClass("sapRULDecisionTableToolBar");
			}

			if (value === false) {
				this._clearErrorMessages();
			}
			return this;
		},

		setExpressionLanguage: function(value) {

			this.setAssociation("expressionLanguage", value, true);

			this._decisionTableCellFormatter.setExpressionLanguage(this.getExpressionLanguage());

			var expressionLanguage = (value instanceof Object) ? value : sap.ui.getCore().byId(value);
			if (!expressionLanguage) {
				return this;
			}

			// if table has been built already - refresh it
			var oTable = this.getAggregation("_table");
			if (oTable) {
				var columnBinding = oTable.getBinding("columns");
				if (columnBinding) {
					columnBinding.refresh();
				}
			}

			if (expressionLanguage._isDataExist()) {
				var oEvent = new sap.ui.base.Event("", "", {
					data: true
				});
				this._handleVocabularyDataChanged(oEvent);
			}

			expressionLanguage.attachDataChange(this._handleVocabularyDataChanged.bind(this));

			return this;
		},

		setEnableSettings: function(value) {

			this.setProperty("enableSettings", value, true);
			this._internalModel.setProperty("/enableSettings", value);

			return this;
		},

		setHitPolicies: function(value) {

			this.setProperty("hitPolicies", value, true);
			this._internalModel.setProperty("/hitPolicies", value);

			return this;
		},

		setCellFormat: function(value) {

			this.setProperty("cellFormat", value, true);
			this._internalModel.setProperty("/cellFormat", value);

			return this;
		},

		_initInternalModel: function() {

			var data = {};

			data.editable = this.getEditable();

			data.newTable = true;
			data.sequenceExist = true;
			data.busyState = true;
			data.busyTableState = true;
			data.cellFormat = this.getCellFormat();
			data.hitPolicies = this.getHitPolicies();
			data.enableSettings = this.getEnableSettings();
			data.isAtLeastOneRowSelected = false;
			data.isExactlyOneRowSelected = false;
			data.isSelection = false;
			data.validationStatus = {};
			data.valueState = {};
			data.selectedRow = null;

			this._internalModel = new sap.ui.model.json.JSONModel(data);
			this.setModel(this._internalModel, "dtModel");
		},

		_initDisplayModel: function() {
			this._displayModel = new sap.ui.model.json.JSONModel();
			this.setModel(this._displayModel, "displayModel");

			this._settingsModel = new sap.ui.model.json.JSONModel();
			this.setModel(this._settingsModel, "settingModel");
		},

		_initDataBucket: function() {
			var vocaDataReceived = false;

			var oEL = sap.ui.getCore().byId(this.getExpressionLanguage());
			if (oEL && oEL._isDataExist()) {
				vocaDataReceived = true;
			}

			this.dataBucket = {
				dataReceived: {
					vocabulary: vocaDataReceived,
					rule: false,
					rows: false,
					columns: false
				},
				rows: {},
				columns: {},
				collectRowsMode: "replace" // "append"
			};
		},

		_setDataLoadedPromise: function() {
			if (!this._dataLoaded || this._dataLoaded.state() !== "pending") {
				this._dataLoaded = new jQuery.Deferred();
			}
		},

		_getDataLoadedPromise: function() {

			if (!this._dataLoaded) {
				this._setDataLoadedPromise();
			}

			return this._dataLoaded.promise();
		},

		setBindingContextPath: function(value) {
			var oldValue = this.getBindingContextPath();
			if (value && (oldValue !== value)) {
				this._unbindRule();
				this._unbindRows();
				this._unbindColumns();
				this.setProperty("bindingContextPath", value);
				this.resetContent = true;

				// reset dataBucket now (don't wait for onBeforeRendering), 
				// attemption for preventing possible convertAndFormat with wrong data
				this._initDataBucket();
				var oModel = this.getModel()
				if (!oModel.isMetadataLoadingFailed()) {
					if (oModel.getServiceMetadata()) {
						this._internalModel.setProperty("/sequenceExist", this.isSequenceExistsInOdataMetadata());
					} else {
						oModel.attachMetadataLoaded(function() {
							this._internalModel.setProperty("/sequenceExist", this.isSequenceExistsInOdataMetadata());
						}.bind(this));
					}
				}
			}

			return this;
		},

		setModelName: function(value) {
			this.setProperty("modelName", value);
			this.resetContent = true;

			return this;
		},

		resetControl: function() {

			this._unbindRule();
			this._unbindRows();
			this._unbindColumns();

			this._clearErrorMessages();
			this._initDataBucket();
			this._initDisplayModel();

			this._updateBusyState();

			var oModel = this._getModel();
			var bindingContextPath = this.getBindingContextPath();

			if (!bindingContextPath || !oModel) {
				return;
			}
			var oContext = new sap.ui.model.Context(oModel, bindingContextPath);
			this.setBindingContext(oContext);

			this._bindRule();
			this._bindRows();
			this._bindColumns();
		},

		isSequenceExistsInOdataMetadata: function() {

			var model = this.getModel();
			if (model) {
				var serviceMetadata = model.getServiceMetadata();
				if (serviceMetadata) {
					var aEntities = serviceMetadata.dataServices.schema[0].entityType;
					var entity;
					var aProperties;
					var property;

					for (var i = 0; i < aEntities.length; i++) {
						entity = aEntities[i];

						if (entity.name !== "DecisionTableColumn") {
							continue;
						}

						aProperties = entity.property;

						for (var j = 0; j < aProperties.length; j++) {
							property = aProperties[j];

							if (property.name === "Sequence") {
								return true;
							}
						}
					}
				}
			}
			return false;
		},

		_createNewDecisionTableSettings: function() {

			var oModel = this._getModel();
			var oContext = this.getBindingContext();
			var oDecisionTableSettings = new sap.rules.ui.DecisionTableSettings({
				expressionLanguage: this.getExpressionLanguage(),
				hitPolicies: "{dtModel>/hitPolicies}",
				newDecisionTable: this._internalModel.getProperty("/newTable"),
				cellFormat: "{dtModel>/cellFormat}",
				decisionTableFormat: this.getDecisionTableFormat()
			});
			//Create a copy of the setting model.
			var settingModelDataStr = JSON.stringify(this._settingsModel.getData());
			var settingModelData = JSON.parse(settingModelDataStr);

			var settingModel = new sap.ui.model.json.JSONModel(settingModelData);

			oDecisionTableSettings.setModel(settingModel);

			//Set configuration model
			oDecisionTableSettings.setModel(this._internalModel, "dtModel");

			//Set OdataModel + context  (needed for apply button)
			oDecisionTableSettings.setModel(oModel, "oDataModel");

			oDecisionTableSettings.setBindingContext(oContext, "dummy");

			return oDecisionTableSettings;
		},

		_createOldDecisionTableSettings: function() {

			var oModel = this._getModel();
			var oContext = this.getBindingContext();

			var oDecisionTableSettings = new DecisionTableSettingsOld({
				expressionLanguage: this.getExpressionLanguage(),
				hitPolicies: "{dtModel>/hitPolicies}",
				newDecisionTable: this._internalModel.getProperty("/newTable")
			});

			oDecisionTableSettings.setModel(oModel);
			oDecisionTableSettings.setModel(this._internalModel, "dtModel");

			oDecisionTableSettings.setBindingContext(oContext);

			return oDecisionTableSettings;
		},

		_createDecisionTableSettings: function() {

			var oDecisionTableSettings;

			if (this.isSequenceExistsInOdataMetadata()) {

				oDecisionTableSettings = this._createNewDecisionTableSettings();

			} else {

				oDecisionTableSettings = this._createOldDecisionTableSettings();
			}

			return oDecisionTableSettings;
		},

		_openTableSettings: function() {

			//bug 5230 - after apply we call twice to validateRule - need to clear dataBucket.rows
			this.dataBucket.dataReceived.rows = false;

			var decisionTableSettings = this._createDecisionTableSettings();

			var oDialog = new Dialog({
				contentWidth: "70%",
				title: this.oBundle.getText("tableSettings")
			});

			oDialog.addContent(decisionTableSettings);

			var aButtons = decisionTableSettings.getButtons(oDialog);

			for (var i = 0; i < aButtons.length; i++) {
				oDialog.addButton(aButtons[i]);
			}

			oDialog.attachBeforeClose(function(oData) {

				var dialogState = oDialog.getState();

				oDialog.destroy();

				//User press on "Apply" (and not on "Cancel")
				if (dialogState === sap.ui.core.ValueState.Success) {
					this._initDisplayModel();
					this._refreshBinding();
				}

			}, this);

			oDialog.open();
		},

		_getBindModelName: function() {
			var path = "";
			var modelName = this.getModelName();

			if (modelName) {
				path = modelName + ">";
			}

			return path;
		},

		_getModel: function() {
			var modelName = this.getModelName();
			if (modelName) {
				return this.getModel(modelName);
			}

			return this.getModel();
		},

		columnFactory: function(sId, oContext) {

			if (this.multiHeaderFlag) {
				this.multiHeaderFlag = false;
			}

			var relativePath = this._getBindModelName();
			var columnType = oContext.getProperty("Type"),
				coId = oContext.getProperty("Id"),
				ruleId = oContext.getProperty("RuleId"),
				version = oContext.getProperty("Version");

			var oHeaderKey = {
				RuleId: ruleId,
				Id: coId,
				Version: version
			};
			var headPath = relativePath + oContext.getModel().createKey("/DecisionTableColumnResults", oHeaderKey);

			var column = new Column(sId, {
				width: "auto",
				multiLabels: [
					this._createColIfThenHeader(oContext), // The order of the labels is important!
					this._createColDescriptionHeader(oContext)
				],
				template: this._createCell(oContext) //, headerSpan: columnType === sap.rules.ui.DecisionTableColumn.Condition ? [this.iNumOfCondition, 1] : [this.iNumOfResults, 1]
			});

			column.isConditionOrFirstResultColumn = !this.firstResultColumnBound;

			relativePath = this._getBindModelName();
			this.firstResultColumnBound = oContext.getProperty(relativePath + "Type") === sap.rules.ui.DecisionTableColumn.Result;
			if (columnType === sap.rules.ui.DecisionTableColumn.Result) {

				column.bindProperty("visible", {
					parts: [{
						path: headPath + "/AccessMode"
					}],
					formatter: this._columnVisibility
				});
			}
			return column;
		},

		_columnVisibility: function(accessMode) {
			if (accessMode === "Hidden" || accessMode === "HIDDEN") {
				return false;
			} else {
				return true;
			}
		},

		_createColDescriptionHeader: function(oContext) {

			var relativePath = "displayModel>",
				columnType = oContext.getProperty("Type"),
				coId = oContext.getProperty("Id"),
				ruleId = oContext.getProperty("RuleId"),
				version = oContext.getProperty("Version");

			var headerPath;

			var oHeaderKey = {
				RuleId: ruleId,
				Id: coId,
				Version: version
			};

			var numOfLines = document.getElementsByClassName("sapUiSizeCozy").length > 0 ? 3 : 1;

			var oText = new Text({
				maxLines: numOfLines
			}).addStyleClass("sapRULDecisionTableColumnHeaderLabel");

			//Condition header text
			if (columnType === sap.rules.ui.DecisionTableColumn.Condition) {
				headerPath = relativePath + oContext.getModel().createKey("/DecisionTableColumnConditions", oHeaderKey);
				oText.bindText({
					parts: [{
						path: headerPath + "/Expression"
					}, {
						path: headerPath + "/FixedOperator"
					}],
					formatter: function(sExpression, sFixedOperator) {
						//bug RULES-5278
						return (sExpression || sFixedOperator) ? sExpression + " " + sFixedOperator : "";
					}
				});

				oText.bindProperty("tooltip", {
					parts: [{
						path: headerPath + "/Expression"
					}, {
						path: headerPath + "/FixedOperator"
					}],
					formatter: function(sExpression, sFixedOperator) {
						return sExpression + " " + sFixedOperator;
					}
				});

				//Result header text
			} else if (columnType === sap.rules.ui.DecisionTableColumn.Result) {
				headerPath = relativePath + oContext.getModel().createKey("/DecisionTableColumnResults", oHeaderKey);
				oText.bindText({
					parts: [{
						path: headerPath + "/DataObjectAttributeName"
					}, {
						path: "dtModel>/busyState"
					}],
					formatter: this._getOutputColumnDescription.bind(this)
				});

				oText.bindProperty("tooltip", {
					parts: [{
						path: headerPath + "/DataObjectAttributeName"
					}, {
						path: "dtModel>/busyState"
					}],
					formatter: this._getOutputColumnDescription.bind(this)
				});
			}

			return oText;
		},

		_getOutputColumnDescription: function(oName) {
			var expLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());

			if (expLanguage && expLanguage._isDataExist()) {
				var ResultID = this.getBindingContext().getProperty("ResultDataObjectId");
				var desc = expLanguage.getResultColumnDescription(oName, ResultID);
				return desc;
			} else {
				return oName;
			}
		},

		_createColIfThenHeader: function(oContext) {
			//var model = oContext.getModel();
			var relativePath = this._getBindModelName();
			var oBundle = this.oBundle;

			return new Label({
				text: {
					parts: [{
						path: relativePath + "Type"
					}, {
						path: relativePath + "Sequence"
					}],
					formatter: function(sType, iSequence) {
						if (iSequence === 1) {
							return oBundle.getText("conditionIfColumn");
						} else if (sType === sap.rules.ui.DecisionTableColumn.Result && this.getParent().isConditionOrFirstResultColumn) {
							return oBundle.getText("resultThenColumn");
						} else {
							return "";
						}
					}
				},
				design: "Bold"
			});
		},

		_createCell: function(oContext) {
			var colID = oContext.getProperty("Id");
			var colType = oContext.getProperty("Type");

			return new DecisionTableCell({
				editable: "{dtModel>/editable}",
				expressionLanguage: this.getExpressionLanguage(),
				displayModelName: "displayModel",
				decisionTableCellType: this._decisionTableCellFormatter
					//	type: sap.rules.ui.ExpressionType.BooleanEnhanced
			}).data({
				colId: colID,
				colType: colType,
				table: this.getAggregation("_table")
			});
		},

		_updateTableCell: function(oCell, oRowContext, dtDomElement, rowIndex) {

			//jQuery(oCell.getDomRef()).parent().parent().parent().removeClass("sapRULDecisionTableSCellMarked");
			oCell.removeStyleClass("sapRULDecisionTableSCellMarked");
			var path = "null";
			var that = this;
			
			if (oRowContext) {
				var colId = oCell.data("colId");
				var rowId = oRowContext.getProperty("Id");
				var ruleId = oRowContext.getProperty("RuleId");
				var version = oRowContext.getProperty("Version");

				var headerPath = '';
				var rulePath = '';
				// NOTE: we assume that colId represents also the order of Columns and starts from 1
				var cellBindingPath = "DecisionTableRowCells(RuleId='" + ruleId + "',Version='" + version + "',RowId=" + rowId + ",ColId=" + colId +
					")";
				
				//var bindModelName = oCell.data("bindModelName");

				var cellKeyProperties = {
					RuleId: ruleId,
					Id: colId,
					Version: version
				};

				var ruleKeyProperties  = {
	                    Id: ruleId,
	                    Version: version
	            };
				
				path = "/" +
					cellBindingPath +
					"/Content";
				
				var bufferRowPath = oCell.getParent().getParent().getParent().getLineActionBuffer().rowPath;
				if (bufferRowPath && (bufferRowPath.indexOf(",Id=" + rowId + ")") > 0)) {
					//jQuery(oCell.getDomRef()).parent().parent().parent().addClass("sapRULDecisionTableSCellMarked");
					oCell.addStyleClass("sapRULDecisionTableSCellMarked");
				}

				switch (oCell.data("colType")) {
					case "CONDITION":
						headerPath = "/" + oRowContext.getModel().createKey("DecisionTableColumnConditions", cellKeyProperties);
						rulePath =  "/" + oRowContext.getModel().createKey("Rules", ruleKeyProperties);
						oCell.setHeaderValuePath(headerPath + '/Expression');
						oCell.setFixedOperatorPath(headerPath + '/FixedOperator');
						oCell.setRuleFormatPath(rulePath + '/RuleFormat');
						oCell.setDecisionTableFormat(that.getParent().getDecisionTableFormat());
						oCell.setValueOnlyPath(headerPath + '/ValueOnly');
						break;
					case "RESULT":
						headerPath = "/" + oRowContext.getModel().createKey("DecisionTableColumnResults", cellKeyProperties);
						oCell.setTypePath(headerPath + '/BusinessDataType');
						break;

					default:

						break;
				}

				oCell.setValueStateTextPath("dtModel>/validationStatus/" + "RowId=" + rowId + ",ColId=" + colId);
				oCell.setValueStatePath("dtModel>/valueState/" + "RowId=" + rowId + ",ColId=" + colId);
			}

			oCell.setValuePath(path);

		},

		_bindRule: function() {
			var bindingPath = [this._getBindModelName(), this.getBindingContextPath()].join("");
			this.bindElement({
				path: bindingPath,
				parameters: {
					expand: "DecisionTable"
				}
			});

			this.getElementBinding().attachDataRequested(this._handleRuleDataRequested, this);
			this.getElementBinding().attachDataReceived(this._handleRuleDataReceived, this);

			// force data load (otherwise if data exists there is no data fetch)
			this.getElementBinding().refresh();
		},

		_unbindRule: function() {
			this.unbindElement();
		},

		_bindColumns: function() {
			var oTable = this.getAggregation("_table");
			var bindingPath = [this._getBindModelName(), this.getBindingContextPath(), "/DecisionTable/DecisionTableColumns"].join("");

			oTable.bindColumns({
				path: bindingPath,
				parameters: {
					expand: "Condition,Result"
				},
				factory: this.columnFactory.bind(this)
			});

			oTable.getBinding("columns").attachDataRequested(this._handleColumnsDataRequested, this);
			oTable.getBinding("columns").attachDataReceived(this._handleColumnsDataReceived, this);
		},

		_unbindColumns: function() {
			var oTable = this.getAggregation("_table");
			oTable.unbindColumns();
		},

		_bindRows: function() {
			var oTable = this.getAggregation("_table");
			var bindingPath = [this._getBindModelName(), this.getBindingContextPath(), "/DecisionTable/DecisionTableRows"].join("");
			//var bindingPath = [this._getBindModelName(), "DecisionTable/DecisionTableRows"].join("");
			var oSorter = new sap.ui.model.Sorter("Sequence");

			oTable.bindRows({
				path: bindingPath,
				parameters: {
					expand: "Cells"
				},
				sorter: oSorter
			});

			oTable.getBinding("rows").attachDataRequested(this._handleRowsDataRequested, this);
			oTable.getBinding("rows").attachDataReceived(this._handleRowsDataReceived, this);
		},

		_unbindRows: function() {
			var oTable = this.getAggregation("_table");
			oTable.unbindRows();
		},

		_refreshBinding: function() {
			var oTable = this.getAggregation("_table");

			var ruleBinding = this.getElementBinding();
			if (ruleBinding) {
				ruleBinding.refresh();
			}

			var columnBinding = oTable.getBinding("columns");
			if (columnBinding) {
				columnBinding.refresh();
			}

			var rowBinding = oTable.getBinding("rows");
			if (rowBinding) {
				rowBinding.refresh();
			}
			var oEventBus = sap.ui.getCore().getEventBus();
			oEventBus.publish("sap.ui.rules","refreshDTRuleModel");
		},

		// rule		
		_handleRuleDataRequested: function() {
			this._dataPartRequested(dataPartName.rule);
		},

		_handleRuleDataReceived: function(data) {
			if (data) {
				this._dataPartReceived(dataPartName.rule);
			}
		},

		// cols
		_handleColumnsDataRequested: function(oEvent) {
			this._dataPartRequested(dataPartName.columns);
		},

		_handleColumnsDataReceived: function(oEvent) {
			var data = oEvent.getParameter("data");

			if (!data) {
				return;
			}

			// change newTable flag			
			// set table.noData according to newTable flag			
			var oTable = this.getAggregation("_table");
			if (data.results && data.results.length > 0) {

				this._internalModel.setProperty("/newTable", false);
				oTable.setNoData(null);
				this._setExpressionLanguageVersionOnoData(false);

			} else {

				this._internalModel.setProperty("/newTable", true);
				var blankContent = this._getBlankContent();
				oTable.setNoData(blankContent);
				this._setExpressionLanguageVersionOnoData(true);
			}

			this.dataBucket[dataPartName.columns] = data;

			this._dataPartReceived(dataPartName.columns);

			this._handleHeaderSpan();
		},

		// rows
		_handleRowsDataRequested: function(oEvent) {
			this._dataPartRequested(dataPartName.rows);
		},

		_handleRowsDataReceived: function(oEvent) {

			var data = oEvent.getParameter("data");
			if (data) {
				if (this.dataBucket.collectRowsMode === "replace") {
					this.dataBucket[dataPartName.rows] = data;
					this.dataBucket.collectRowsMode = "append";
				} else {
					// "append"
					var previousData = this.dataBucket[dataPartName.rows];
					var newData = {
						results: (previousData.results) ? previousData.results.concat(data.results) : data.results
					};

					this.dataBucket[dataPartName.rows] = newData;
				}

				this._dataPartReceived(dataPartName.rows);
			}

			this._setTableRows();
		},

		// vocabulary
		_handleVocabularyDataChanged: function(oEvent) {
			var data = oEvent.getParameter("data");
			if (data) {
				this._handleVocabularyDataReceived(data);
			} else {
				this._handleVocabularyDataRequested();
			}
		},

		_handleVocabularyDataRequested: function() {
			this._dataPartRequested(dataPartName.vocabulary);
		},

		_handleVocabularyDataReceived: function(data) {
			if (data) {
				this._dataPartReceived(dataPartName.vocabulary);
			}
		},

		// dataBucket		
		_dataPartRequested: function(partName) {
			this.dataBucket.dataReceived[partName] = false;
			this._setDataLoadedPromise();
			this._updateBusyState();
		},

		_dataPartReceived: function(partName) {
			this.dataBucket.dataReceived[partName] = true;

			if (!this._isAllDataReceived()) {
				return;
			}

			try {
				this._convertAndValidate();
				this.dataBucket.collectRowsMode = "replace";
			} catch (sError) {
				// show message Toast
				window.console.log(sError);
			}
			this._updateBusyState();

			this._dataLoaded.resolve();
		},

		_isAllDataReceived: function() {
			var dataParts = this.dataBucket.dataReceived;
			return dataParts.rule && dataParts.rows && dataParts.columns && dataParts.vocabulary;
		},

		_updateBusyState: function() {
			var dataParts = this.dataBucket.dataReceived;
			var dataReceived = dataParts.rule && dataParts.columns && dataParts.vocabulary;
			var isBusy = !dataReceived;

			this._internalModel.setProperty("/busyState", isBusy);

			var tableIsBusy = !dataParts.rows;
			this._internalModel.setProperty("/busyTableState", tableIsBusy);
		},

		// ---------------------

		_decideSettingsEnablement: function(enableSettings, editable) {
			return enableSettings && editable;
		},

		_decideDeleteRowEnablement: function(newTable, isAtLeastOneRowSelected) {
			return newTable === false && isAtLeastOneRowSelected;
		},

		_decideCopyRowEnablement: function(newTable, isExactlyOneRowSelected) {
			return newTable === false && isExactlyOneRowSelected;
		},

		_decideLineActionVisibility: function(isEditable, isSequenceExist) {
			return isEditable === true && isSequenceExist;
		},

		_decideAddRowEnablement: function(newTable) {
			return !newTable;
		},

		_decidePasteRowEnablement: function(newTable, isExactlyOneRowSelected, isSelection) {
			return newTable === false && isExactlyOneRowSelected && isSelection;
		},

		/*
		 * @private
		 */
		_addToolBar: function() {

			var oToolbar = new Toolbar({
				design: "Transparent",
				enabled: "{dtModel>/editable}"
			});

			var oTitle = new sap.m.Title({
				text: this.oBundle.getText("decisionTable")
			});

			var oAddLink = new MenuButton({
				text: this.oBundle.getText("addRow"),
				visible: "{dtModel>/editable}",
				enabled: {
					parts: [{
						path: "dtModel>/newTable"
					}],
					formatter: this._decideAddRowEnablement
				},
				menu: new Menu({
					items: this._getMenuItems()
				})
			}).setTooltip(this.oBundle.getText("addRow"));

			var oDeleteLink = new Button({
				text: this.oBundle.getText("deleteRow"),
				press: [this._deleteRowWorkaround, this],
				visible: "{dtModel>/editable}",
				type:sap.m.ButtonType.Transparent,
				enabled: {
					parts: [{
						path: "dtModel>/newTable"
					}, {
						path: "dtModel>/isAtLeastOneRowSelected"
					}],
					formatter: this._decideDeleteRowEnablement
				}
			}).setTooltip(this.oBundle.getText("deleteRow"));

			var oCopyLink = new Button({
				text: this.oBundle.getText("copyRow"),
				press: [this._copyRow, this],
				type:sap.m.ButtonType.Transparent,
				visible: {
					parts: [{
						path: "dtModel>/editable"
					}, {
						path: "dtModel>/sequenceExist"
					}],
					formatter: this._decideLineActionVisibility
				},
				enabled: {
					parts: [{
						path: "dtModel>/newTable"
					}, {
						path: "dtModel>/isExactlyOneRowSelected"
					}],
					formatter: this._decideCopyRowEnablement
				}
			}).setTooltip(this.oBundle.getText("copyRow"));

			var oCutLink = new Button({
				text: this.oBundle.getText("cutRow"),
				type:sap.m.ButtonType.Transparent,
				press: [this._cutRow, this],
				visible: {
					parts: [{
						path: "dtModel>/editable"
					}, {
						path: "dtModel>/sequenceExist"
					}],
					formatter: this._decideLineActionVisibility
				},
				enabled: {
					parts: [{
						path: "dtModel>/newTable"
					}, {
						path: "dtModel>/isExactlyOneRowSelected"
					}],
					formatter: this._decideCopyRowEnablement
				}
			}).setTooltip(this.oBundle.getText("cutRow"));

			var oPasteLink = new MenuButton({
				text: this.oBundle.getText("pasteRow"),
				type:sap.m.ButtonType.Transparent,
				visible: {
					parts: [{
						path: "dtModel>/editable"
					}, {
						path: "dtModel>/sequenceExist"
					}],
					formatter: this._decideLineActionVisibility
				},
				enabled: {
					parts: [{
						path: "dtModel>/newTable"
					}, {
						path: "dtModel>/isExactlyOneRowSelected"
					}, {
						path: "dtModel>/isSelection"
					}],
					formatter: this._decidePasteRowEnablement
				},
				menu: new Menu({
					items: this._getPasteMenuItems()
				})
			}).setTooltip(this.oBundle.getText("pasteRow"));

			var oSettingsButton = new Button({
				text: "",
				press: this._openTableSettings.bind(this),
				visible: {
					parts: [{
						path: "dtModel>/enableSettings"
					}, {
						path: "dtModel>/editable"
					}],
					formatter: this._decideSettingsEnablement
				},
				enabled: {
					parts: [{
						path: "dtModel>/enableSettings"
					}, {
						path: "dtModel>/editable"
					}],
					formatter: this._decideSettingsEnablement
				}
			}).setTooltip(this.oBundle.getText("tableSettings"));
			oSettingsButton.setIcon("sap-icon://action-settings");

			// Remove space in order to align DT title to left
			// oToolbar.addContent(new ToolbarSpacer({
			// 	width: "1em"
			// }));

			oToolbar.addContent(oTitle);
			oToolbar.addContent(new ToolbarSpacer({}));
			oToolbar.addContent(oAddLink);
			oToolbar.addContent(new ToolbarSpacer({
				width: "1em"
			}));
			oToolbar.addContent(oDeleteLink);
			oToolbar._delete = oDeleteLink;

			oToolbar.addContent(new ToolbarSpacer({
				width: "1em"
			}));
			oToolbar.addContent(oCopyLink);
			oToolbar.addContent(new ToolbarSpacer({
				width: "1em"
			}));
			oToolbar.addContent(oCutLink);
			oToolbar.addContent(new ToolbarSpacer({
				width: "1em"
			}));
			oToolbar.addContent(oPasteLink);
			oToolbar.addContent(new ToolbarSpacer({
				width: "1em"
			}));

			oToolbar.addContent(oSettingsButton);
			oToolbar.addContent(new ToolbarSpacer({
				width: "1em"
			}));

			this.setAggregation("_toolbar", oToolbar, true);
		},

		_rowAction: function(operation) {
			this._rowActionWorkAround(operation);
		},

		_rowActionWorkAround: function(operation) {

			var selectedRow = this._internalModel.getProperty("/selectedRow");
			this._markSelection(false);
			var buffer = this.getLineActionBuffer();
			this.setLineActionBuffer({
				rowPath: null,
				operation: null
			});
			var oTable = this.getAggregation("_table");

			var sTargetRowSeq = selectedRow + 1;
			if (operation === "insertAfter") {
				sTargetRowSeq++;
			}
			var oModel = this._getModel();
			var sSourceRowId = oModel.getProperty(buffer.rowPath).Id;
			var sRuleId = oModel.getProperty(buffer.rowPath).RuleId;
			var sVersion = oModel.getProperty(buffer.rowPath).Version;
			this._internalModel.setProperty("/busyState", true);
			var isCut = (buffer.operation === "cut");
			if (operation === "paste") {
				this._callCopyRuleRow(sRuleId, sVersion, sSourceRowId, sTargetRowSeq, isCut, true);
			} else {
				this._callCopyRuleRow(sRuleId, sVersion, sSourceRowId, sTargetRowSeq, isCut, false);
			}
			oTable.setSelectedIndex(-1);
			sap.m.MessageToast.show(this.oBundle.getText("pasteSuccess"));
		},

		/**
		 * Copy a row from the buffer after a copy/cut line action using a function import
		 * /sap/opu/odata/SAP/RULE_SRV/CopyRuleRow?RuleId='xxx'&SourceRowId='yyy'&TargetRowSeq='zzz'
		 * @param {string}   [sRuleId] The current rule ID
		 * @param {string}   [sVersion] The current rule version
		 * @param {string}   [sSourceRowId] The copied row stable ID
		 * @param {string}   [sTargetRowSeq] A sequence for paste/insert the row
		 * @param {boolean}   [shouldCut] A flag indicating if we cut or copy
		 * @param {boolean}   [sOverrideInd] A flag indicating if we paste
		 * @private
		 **/

		_callCopyRuleRow: function(sRuleId, sVersion, sSourceRowId, sTargetRowSeq, shouldCut, sOverrideInd) {
			var changesGroupID = {
				groupId: "changes"
			};
			this._getModel().setDeferredGroups([changesGroupID.groupId]);
			var submitSuccess = function(response) {
				var oTable = this.getAggregation("_table");
				oTable.getBinding("rows").refresh();
				this._internalModel.setProperty("/busyState", false);
			}.bind(this);

			var submitError = function(e) {
				sap.m.MessageToast.show(e);
			}.bind(this);

			var callFunctionSuccess = function(response) {
				this._getModel().callFunction("/CopyRuleRow", {
					method: "POST",
					groupId: changesGroupID.groupId,
					urlParameters: {
						RuleId: sRuleId,
						SourceRowId: sSourceRowId,
						TargetRowSeq: sTargetRowSeq,
						DeleteSourceRow: shouldCut,
						OverrideTargetRow: sOverrideInd
					}
				});
				this._getModel().submitChanges({
					groupId: changesGroupID.groupId,
					success: submitSuccess,
					error: submitError
				});
			}.bind(this);

			if (this._getModel().hasPendingChanges()) {
				this._getModel().submitChanges({
					groupId: changesGroupID.groupId,
					success: callFunctionSuccess,
					error: submitError
				});
			} else {
				callFunctionSuccess();
			}
		},

		_addNewRowWorkaround: function(bFirst) {
			var selectedRow = this._internalModel.getProperty("/selectedRow");
			this._addNewRow(selectedRow, bFirst);

		},

		_addNewRow: function(selectedRow, bFirst) {
			var oMenu = this.oMenu;
			if (oMenu) {
				oMenu.close();
			}

			var oModel = this._getModel();

			var columns = this.dataBucket.columns && this.dataBucket.columns.results;

			if (!oModel || !columns) {
				return;
			}

			var oTable = this.getAggregation("_table"),
				oContext = this.getBindingContext(),
				sRuleId = oContext.getProperty("Id"),
				sVersion = oContext.getProperty("Version");

			var oRowData = {
				RuleId: sRuleId,
				Version: sVersion
			};
			selectedRow = selectedRow || 0;
			var rowPath;
			if (bFirst) {
				oRowData.Sequence = 1;
			} else {
				rowPath = oTable.getContextByIndex(selectedRow).getPath();
				oRowData.Sequence = oModel.getProperty(rowPath).Sequence;
				oRowData.Sequence++;
			}
			oRowData.Id = this._calNextRowId();

			// create row
			oModel.createEntry("/DecisionTableRows", {
				properties: oRowData
			});

			oTable.setSelectedIndex(-1);
			this._clearErrorMessages();
			this._saveWorkAround();

		},

		_collectColIdAndExpressionDetails: function(columns) {
			var columnCount = columns.length;
			var resultExpressionArray = [];
			for (var columnIndex = 0; columnIndex < columnCount; columnIndex++) {
				if (columns[columnIndex].Result && columns[columnIndex].Result.Expression) {
					var oResult = {
						'columnID': columns[columnIndex].Result.Id,
						'expressionContent': columns[columnIndex].Result.Expression
					};
					resultExpressionArray.push(oResult);
				}

			}
			return resultExpressionArray;
		},

		_copyRow: function() {
			this._cutCopyRow("copy");
		},

		_cutRow: function() {
			this._cutCopyRow("cut");
		},

		_cutCopyRow: function(operation) {
			var oModel = this._getModel();
			if (!oModel) {
				return;
			}
			var oTable = this.getAggregation("_table");
			var oSelectedRows = [];
			if (oTable) {
				oSelectedRows = oTable.getSelectedIndices();
			}
			if (oSelectedRows.length !== 1) {
				return;
			}
			var rowPath = oTable.getContextByIndex(oSelectedRows[0]).getPath();
			this._markSelection(false);
			this.setLineActionBuffer({
				rowPath: rowPath,
				operation: operation
			});
			this._markSelection(true);
			oTable.setSelectedIndex(-1);
			sap.m.MessageToast.show(this.oBundle.getText(operation + "RowSuccess"));
		},

		_markSelection: function(bMarkSelection) {
			var rowPath = this.getLineActionBuffer().rowPath;
			var oTable = this.getAggregation("_table");
			var oModel = this._getModel();
			if (rowPath) {
				var firstVisibleRow = oTable.getFirstVisibleRow();
				var rowIndex = oModel.getProperty(rowPath).Sequence - 1;
				if ((rowIndex - firstVisibleRow > -1) && (rowIndex - firstVisibleRow < oTable.getVisibleRowCount())) {
					var oRow = oTable.getRows()[rowIndex - firstVisibleRow];
					var oCells = oRow.getCells();
					if (oCells) {
						for (var i = 0; i < oCells.length; i++) {
							if (bMarkSelection) {
								//jQuery(oCells[i].getDomRef()).parent().parent().parent().addClass("sapRULDecisionTableSCellMarked");
								oCells[i].addStyleClass("sapRULDecisionTableSCellMarked");
							} else {
								//jQuery(oCells[i].getDomRef()).parent().parent().parent().removeClass("sapRULDecisionTableSCellMarked");
								oCells[i].removeStyleClass("sapRULDecisionTableSCellMarked");
							}
						}
					}
				}
			}
		},

		_deleteRowWorkaround: function() {
			var oModel = this._getModel();

			if (oModel.hasPendingChanges()) {
				// save all model's changes before row removal
				this._saveWorkAround({
					success: function() {
						this._deleteRow();
					}.bind(this)
				});
			} else {
				this._deleteRow();
			}
		},

		_deleteRow: function() {

			var oModel = this._getModel();
			if (!oModel) {
				return;
			}

			var oTable = this.getAggregation("_table");

			var oSelectedRows = [];

			if (oTable) {
				oSelectedRows = oTable.getSelectedIndices();
			}
			if (oSelectedRows.length === 0) {
				return;
			}

			var rowsLength = oSelectedRows.length;
			for (var i = 0; i < rowsLength; i++) {
				var rowPath = oTable.getContextByIndex(oSelectedRows[i]).getPath();

				// remove row
				oModel.remove(rowPath);
			}

			oTable.setSelectedIndex(-1);
			this._clearErrorMessages();
		},

		_calNextRowId: function() {
			var rows = this.dataBucket.rows.results;
			var maxRowId = 0;

			//Calc max "Id"
			for (var i = 0; i < rows.length; i++) {

				if (rows[i].Id > maxRowId) {
					maxRowId = rows[i].Id;
				}
			}

			var nextId = maxRowId + 1;

			return nextId;

		},

		_setTableRows: function() {
			var oTable = this.getAggregation("_table");
			var oRowBinding = oTable.getBinding("rows");

			var iVisibleRowCount = visibleRowCount.emptyTable;
			if (oRowBinding && oRowBinding.getLength()) {
				iVisibleRowCount = Math.min(oRowBinding.getLength(), visibleRowCount.max);
			}

			var currVisibleRowCount = oTable.getVisibleRowCount();
			if (currVisibleRowCount !== iVisibleRowCount) {
				oTable.setVisibleRowCount(iVisibleRowCount);
			}
			if (this.dataBucket.rows.results.length === 0 || !this.getEditable()) {
				oTable.setSelectionMode(sap.ui.table.SelectionMode.None);
			} else {
				oTable.setSelectionMode(sap.ui.table.SelectionMode.MultiToggle);
			}
		},

		_getMenuItems: function() {
			var oMenuItems = [
				new MenuItem({
					text: this.oBundle.getText("insertFirst"),
					enabled: true,
					press: this._addNewRowWorkaround.bind(this, true)
				}),
				new MenuItem({
					text: this.oBundle.getText("insertAfter"),
					enabled: {
						parts: [{
							path: "dtModel>/newTable"
						}, {
							path: "dtModel>/isExactlyOneRowSelected"
						}],
						formatter: this._decideCopyRowEnablement
					},
					// select: this._addNewRow.bind(this, oSelectedRows[0], false)
					press: this._addNewRowWorkaround.bind(this, false)
				})
			];
			return oMenuItems;
		},

		_getPasteMenuItems: function() {
			var oMenuItems = [
				new MenuItem({
					text: this.oBundle.getText("pasteRowAction"),
					enabled: {
						parts: [{
							path: "dtModel>/newTable"
						}, {
							path: "dtModel>/isExactlyOneRowSelected"
						}],
						formatter: this._decideCopyRowEnablement
					},
					// select: this._addNewRow.bind(this, oSelectedRows[0], true)
					press: this._rowAction.bind(this, "paste")
				}),
				new MenuItem({
					text: this.oBundle.getText("insertBeforeRowAction"),
					enabled: {
						parts: [{
							path: "dtModel>/newTable"
						}, {
							path: "dtModel>/isExactlyOneRowSelected"
						}],
						formatter: this._decideCopyRowEnablement
					},
					// select: this._addNewRow.bind(this, oSelectedRows[0], false)
					press: this._rowAction.bind(this, "insertBefore")
				}),
				new MenuItem({
					text: this.oBundle.getText("insertAfterRowAction"),
					enabled: {
						parts: [{
							path: "dtModel>/newTable"
						}, {
							path: "dtModel>/isExactlyOneRowSelected"
						}],
						formatter: this._decideCopyRowEnablement
					},
					// select: this._addNewRow.bind(this, oSelectedRows[0], false)
					press: this._rowAction.bind(this, "insertAfter")
				})
			];
			return oMenuItems;
		},
		_rowSelectionChange: function() {
			var oTable = this.getAggregation("_table");
			var oSelectedRows = [];
			if (oTable) {
				oSelectedRows = oTable.getSelectedIndices();
			}

			if (oSelectedRows.length > 0) {
				this._internalModel.setProperty("/isAtLeastOneRowSelected", true);
				this._internalModel.setProperty("/selectedRow", oSelectedRows[0]);
			} else {
				this._internalModel.setProperty("/isAtLeastOneRowSelected", false);
			}

			if (oSelectedRows.length == 1) {
				this._internalModel.setProperty("/isExactlyOneRowSelected", true);
			} else {
				this._internalModel.setProperty("/isExactlyOneRowSelected", false);
			}

			if (this.getLineActionBuffer().rowPath) {
				this._internalModel.setProperty("/isSelection", true);
			} else {
				this._internalModel.setProperty("/isSelection", false);
			}

		},
		_getBlankContent: function() {

			var oLabelContent = new Label({
				text: this.oBundle.getText("start")
			});

			var oSpaceTextContent = new Text();

			oSpaceTextContent.setText("\u00a0");

			var oLinkToSettingsFromBlank = new Link({
				enabled: {
					parts: [{
						path: "dtModel>/enableSettings"
					}, {
						path: "dtModel>/editable"
					}],
					formatter: this._decideSettingsEnablement
				},
				text: " " + this.oBundle.getText("settings"),
				press: [this._openTableSettings, this]
			}).addStyleClass("sapRULDecisionTableLink");

			var oFlexBox = new FlexBox({
				justifyContent: "Center",
				items: [oLabelContent, oSpaceTextContent, oLinkToSettingsFromBlank],
				visible: {
					parts: [{
						path: "dtModel>/enableSettings"
					}, {
						path: "dtModel>/editable"
					}],
					formatter: this._decideSettingsEnablement
				}
			}).addStyleClass("sapUiMediumMargin");

			return oFlexBox;
		},

		_decideSelectionMode: function(editable) {

			return editable ? sap.ui.table.SelectionMode.MultiToggle : sap.ui.table.SelectionMode.None;
		},

		_addTable: function() {
			var oTable = new Table({
				visibleRowCount: visibleRowCount.max,
				visibleRowCountMode: sap.ui.table.VisibleRowCountMode.Fixed,
				selectionMode: {
					parts: [{
						path: "dtModel>/editable"
					}],
					formatter: this._decideSelectionMode
				},
				rowSelectionChange: function() {
					this.oParent._rowSelectionChange();
				},
				enableColumnReordering: false,
				busy: "{dtModel>/busyTableState}"
			});
			oTable._updateTableCell = this._updateTableCell;
			oTable.setBusyIndicatorDelay(0);

			this.setAggregation("_table", oTable, true);
		},

		_buildMessagesStructure: function(validateResults, columnErrorsMap, headerErrorArray) {

			var detail;
			var additionalInfo;
			var description;
			var errorKey;

			if (!validateResults.details) {
				return columnErrorsMap;
			}

			for (var w = 0; w < validateResults.details.length; w++) {

				detail = validateResults.details[w];

				if (!detail.messages) {
					continue;
				}

				for (var i = 0; i < detail.messages.length; i++) {

					description = detail.messages[i].description;

					additionalInfo = detail.messages[i].additionalInfo;

					if (additionalInfo.type === "ruleResult") {

						headerErrorArray.push(description);
						errorKey = "genericError";
						columnErrorsMap[errorKey] = headerErrorArray;

					} else if (additionalInfo.type === "column") {
						errorKey = "errorInColumnHeader";
						columnErrorsMap[errorKey] = true;

					} else if (additionalInfo.type === "cell") {
						errorKey = "RowId=" + additionalInfo.rowId + ",ColId=" + additionalInfo.colId;
						columnErrorsMap[errorKey] = description;
					}
				}
			}

			return columnErrorsMap;

		},

		_concatinateHeaderErrors: function(headerErrorsArray) {

			var errorMessage = "";

			for (var i = 0; i < headerErrorsArray.length; i++) {

				errorMessage += "\n" + headerErrorsArray[i];
			}

			return errorMessage;

		},

		_concatinateColumnsHeaderErrors: function(columnErrorsMap) {

			var errorMessage = "";

			for (var column in columnErrorsMap) {
				if (columnErrorsMap.hasOwnProperty(column)) {

					if (columnErrorsMap[column].header) {
						errorMessage += "In Col: " + column + " - " + columnErrorsMap[column].header + "\n";
					}
				}
			}

			return errorMessage;

		},

		_displayHeaderErrorMessages: function(headerErrorsArray, columnErrorsMap) {

			var oText = this.getAggregation("_errorsText");

			this.oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");

			var errorHeaderMessage = this._concatinateHeaderErrors(headerErrorsArray);

			oText.setText(this.oBundle.getText("errorInTableHeader") + errorHeaderMessage); // + "\n" +	errorColumnsHeaderMessage);
			oText.setVisible(true);
		},

		_clearErrorMessages: function() {

			//Clear header message
			var oText = this.getAggregation("_errorsText");
			oText.setText("");
			oText.setVisible(false);

			this._internalModel.setProperty("/validationStatus", {}, null, true);
			this._internalModel.setProperty("/valueState", {}, null, true);
		},

		_displayErrorMessages: function(headerErrorsArray, columnErrorsMap) {
			// I commnted this call in order to remove the header error message, next we'll add here a different errors control
			//this._displayHeaderErrorMessages(headerErrorsArray, columnErrorsMap);
		},

		/**
		 * @private
		 * Gets a rule in deep format (as returned from the parser), and flats the rule to the format of the oDataModel.
		 * e.g. DecisionTableRowCell(RuleId='0050569181751ED683EFEEC6AA2B73C5', Version='000001', RowId='1', ColId='1')
		 * @param {oRule} oRule in deep format
		 * @returns {object} rule in oDataModel flatted format
		 */
		_flatRule: function(oRule) {
			var oModel = this._getModel();
			var oRuleFlat = {};
			var createEntry = function(oData, entryName, properties) {
				var key = oModel.createKey(entryName, properties);
				oData[key] = properties;
			};

			// Flat columns
			oRule.DecisionTable.DecisionTableColumns.results.forEach(function(col, index) {
				if (col.Type === "CONDITION") {
					var condition = col.Condition;
					if (condition.parserResults && condition.parserResults.status === "Success") {
						condition.Expression = condition.parserResults.converted.Expression;
						if (condition.parserResults.converted.FixedOperator || condition.parserResults.converted.FixedOperator === "") {
							condition.FixedOperator = condition.parserResults.converted.FixedOperator;
						} else {
							condition.FixedOperator = condition.FixedOperator;
						}
					} else {
						try {
							condition.Expression = JSON.parse(condition.Expression).text;
						} catch (err) {
							condition.Expression = condition.Expression;
						}
						try {
							condition.FixedOperator = JSON.parse(condition.FixedOperator).text;
						} catch (err) {
							condition.Expression = condition.Expression;
						}
					}
					delete condition.parserResults;
					createEntry(oRuleFlat, "DecisionTableColumnConditions", condition);
				} else if (col.Type === "RESULT") {
					var result = col.Result;
					createEntry(oRuleFlat, "DecisionTableColumnResults", result);
				}
			});

			// Flat cells
			oRule.DecisionTable.DecisionTableRows.results.forEach(function(row) {
				var cellArr = row.Cells;
				cellArr.results.forEach(function(cell) {
					if (cell.parserResults && cell.parserResults.status === "Success") {
						cell.Content = cell.parserResults.converted.Content;
					} else if (cell.parserResults && cell.parserResults.status === "Error") {
						try {
							if (cell.Content === Object) {
								cell.Content = JSON.parse(cell.Content).text;
							} else {
								cell.Content = cell.Content;
							}

						} catch (err) {
							cell.Content = "";
							jQuery.sap.log.error("failed to pars AST cell in ColId " + cell.ColId + " RowId " + cell.RowId +
								" set cell content to empty");
						}
					}
					delete cell.parserResults;
					createEntry(oRuleFlat, "DecisionTableRowCells", cell);
				});
			});

			return oRuleFlat;
		},

		/**
		 * @private
		 * @param {validateResults} validateResults -
		 * @param {ruleData} ruleData - 
		 */
		_processValidationResults: function(validateResults, ruleData) {

			if (validateResults && validateResults.output) {

				if (validateResults.output.status === "Error") {
					var headerErrorsArray = [];
					var columnErrorsMap = this._internalModel.getProperty("/validationStatus");
					var cellValueStateMap = {};
					columnErrorsMap = this._buildMessagesStructure(validateResults, columnErrorsMap, headerErrorsArray);
					for (var cell in columnErrorsMap) {
						if (columnErrorsMap.hasOwnProperty(cell) && (typeof columnErrorsMap[cell] === "string") && columnErrorsMap[cell] !== "null") {
							cellValueStateMap[cell] = sap.ui.core.ValueState.Error;
						}
					}
					this._displayErrorMessages(headerErrorsArray, columnErrorsMap);

					this._internalModel.setProperty("/validationStatus", columnErrorsMap, null, true);
					this._internalModel.setProperty("/valueState", cellValueStateMap, null, true);
				}

				var flatData = this._flatRule(validateResults.output.decisionTableData);

				//validateResults.output.decisionTableData.DecisionTable.DecisionTableRows = null;

				this._settingsModel.setData(validateResults.output.decisionTableData);

				if (this.dataBucket.rows.results) {
					this._settingsModel.rowLength = this.dataBucket.rows.results.length;
				}

				this._displayModel.setData(flatData, true);

			}
		},

		_convertAndValidate: function() {

			var ruleData = this._getRuleData();
			var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
			var validateResults = {};
			if (oExpressionLanguage && ruleData) {
				validateResults = oExpressionLanguage.convertRuleToDisplayValues(ruleData);
				if (validateResults.deferredResult) {
					validateResults.deferredResult.done(this._processValidationResults.bind(this));
				} else {
					this._processValidationResults(validateResults, ruleData);
				}
			}
		},

		_getRuleData: function() {

			var contextPath = this.getBindingContextPath();

			var oModel = this._getModel();

			var ruleData = jQuery.extend({}, true, oModel.getProperty(contextPath, null, true));
			var dtData = ruleData.DecisionTable;
			dtData.DecisionTableColumns = this.dataBucket.columns;
			dtData.DecisionTableRows = this.dataBucket.rows;

			return ruleData;
		},

		onBeforeRendering: function() {

			if (this.resetContent) {
				this.resetControl();
				this.resetContent = false;
			}
		},

		_handleHeaderSpan: function() {

			if (!this.multiHeaderFlag) {
				var i;
				this.multiHeaderFlag = true;
				var aColumns = this.dataBucket.columns.results;
				this.iNumOfCondition = 0;
				this.iNumOfResults = 0;
				for (i = 0; i < aColumns.length; i++) {
					if (aColumns[i].Type === sap.rules.ui.DecisionTableColumn.Condition) {
						this.iNumOfCondition++;
					} else if (aColumns[i].Type === sap.rules.ui.DecisionTableColumn.Result) {
						this.iNumOfResults++;
					}
				}
				var oTable = this.getAggregation('_table');
				aColumns = oTable.getAggregation('columns');

				for (i = 0; i < this.iNumOfCondition; i++) {
					aColumns[i].setHeaderSpan([this.iNumOfCondition, 1]);
				}
				for (; i < aColumns.length; i++) {
					aColumns[i].setHeaderSpan([this.iNumOfResults, 1]);
				}
			}
		},
		// set the ExpressionLanguageVersion for new rule on oData model according to the parser version, for old rule without ExpressionLanguageVersion we set old parser version on type and not on the model.
		_setExpressionLanguageVersionOnoData: function(bNewRule) {
			var oModel = this._getModel();
			var oContext = this.getBindingContext();
			var sVersion = "1.0.0";
			if (bNewRule) {
				var oEL = sap.ui.getCore().byId(this.getExpressionLanguage());
				sVersion = oEL.getExpressionLanguageVersion();
				oModel.setProperty("ExpressionLanguageVersion", sVersion, oContext, true);
			} else {
				sVersion = oModel.getProperty(this.getBindingContextPath() + '/ExpressionLanguageVersion');
				if (!sVersion) {
					sVersion = "1.0.0";
				}
			}
			this._decisionTableCellFormatter.setExpressionLanguageVersion(sVersion);

		},

		exit: function() {
			var oMenu = this.oMenu;
			if (oMenu) {
				oMenu.destroy();
			}
		}
	});

	/**
	 * @private
	 *  @param {map} mParameters? -
	 */
	sap.rules.ui.DecisionTable.prototype._saveWorkAround = function(mParameters) {
		var oModel = this._getModel();
		oModel.submitChanges(mParameters);
	};

	return oDecisionTable;

}, /* bExport= */ true);
