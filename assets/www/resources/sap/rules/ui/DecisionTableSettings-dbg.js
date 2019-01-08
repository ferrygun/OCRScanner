/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.
sap.ui.define([
		"jquery.sap.global",
		"sap/rules/ui/library",
		"sap/ui/core/Control",
		"sap/ui/layout/form/SimpleForm",
		"sap/m/Label",
		"sap/m/Switch",
		"sap/m/Select",
		"sap/m/MessageBox",
		"sap/m/Table",
		"sap/m/Text",
		"sap/m/CheckBox",
		"sap/m/Input",
		"sap/m/Button",
		"sap/rules/ui/ExpressionAdvanced",
		"sap/ui/layout/VerticalLayout",
		"sap/rules/ui/type/Expression"
	],
	function(jQuery, library, Control, SimpleForm, Label, Switch, Select, MessageBox, Table, Text, CheckBox, Input, Button,
		ExpressionAdvanced, VerticalLayout, ExpressionType) {
		"use strict";

		/**
		 * Constructor for a new DecisionTableSettings Control. 
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
		 * @alias sap.rules.ui.DecisionTableSettings
		 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
		 */
		var oDecisionTableSettings = Control.extend("sap.rules.ui.DecisionTableSettings", {
			metadata: {
				library: "sap.rules.ui",
				properties: {
					cellFormat: {
						type: "sap.rules.ui.DecisionTableCellFormat",
						defaultValue: sap.rules.ui.DecisionTableCellFormat.Both
					},
					hitPolicies: {
						type: "sap.rules.ui.RuleHitPolicy[]",
						defaultValue: [sap.rules.ui.RuleHitPolicy.FirstMatch, sap.rules.ui.RuleHitPolicy.AllMatch]
					},
					modelName: {
						type: "string",
						defaultValue: ""
					},
					newDecisionTable: {
						type: "boolean",
						defaultValue: false
					},
					decisionTableFormat:{
	                     type: "sap.rules.ui.DecisionTableFormat",
	                     defaultValue: sap.rules.ui.DecisionTableFormat.CellFormat
					}
				},
				aggregations: {
					mainLayout: {
						type: "sap.ui.layout.form.SimpleForm",
						multiple: false
					}
				},
				defaultAggregation: "mainLayout",
				associations: {
					expressionLanguage: {
						type: "sap.rules.ui.services.ExpressionLanguage",
						multiple: false,
						singularName: "expressionLanguage"
					}
				},
				events: {},
				publicMethods: []
			}
		});

		sap.rules.ui.DecisionTableSettings.prototype.init = function() {

			this.oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
			this.editableModeText = "Editable";
			this.hiddenModeText = "Hidden";
			this.needCreateLayout = true;
			this.firstLoad = true;
			this.resultCounter = 0;
			this.enableAccessValue = false;

			this.onsapescape = function(oEvent) {
				//	oEvent.preventDefault();
				oEvent.stopPropagation();
			};
			this._decisionTableHeaderSettingFormatter = new ExpressionType();
			this.setBusyIndicatorDelay(0);

			//destroy UI elements if already existed
			this._destroyElement("idColAccessTable");
			this._destroyElement("id_HiddenAccessMessageStrip");
			this._destroyElement("id_EditableAccessMessageStrip");

		};

		sap.rules.ui.DecisionTableSettings.prototype._destroyElement = function(element) {
			var elementToDestroy = sap.ui.getCore().byId(element);
			if (elementToDestroy) {
				if (element === "idColAccessTable") {
                   elementToDestroy.destroyColumns();
				}
				elementToDestroy.destroy();
			}
		};

		sap.rules.ui.DecisionTableSettings.prototype.onBeforeRendering = function() {

			this.mNextColumnId = this._calcNextColumnId();

			if (this.firstLoad) {
				this._initSettingsModel();

				if (this.getProperty("newDecisionTable") === true) {

					this.mNextColumnId = 1;
					this._prepareNewRule();
				}

				this.firstLoad = false;
			}

			if (this.needCreateLayout) {
				var layout = this.getAggregation("mainLayout");
				if (layout) {
					layout.destroy();
				}

				layout = this._createLayout();
				this.setAggregation("mainLayout", layout, true);
				this.needCreateLayout = false;

				this.conditionsTable.getBinding("items").attachDataRequested(function() {
					this.setBusy(true);
				}.bind(this));

				this.conditionsTable.getBinding("items").attachDataReceived(function() {
					this.setBusy(false);

				}.bind(this));
			}
		};

		sap.rules.ui.DecisionTableSettings.prototype._setDefaultResult = function() {
			var _displayModel = this.getModel();
			var modelData = _displayModel.getData();
			var resultsEnumration = this._internalModel.getData().results.resultsEnumration;
			// if results enum contains only 2 options (1. empty 2. result), set the result as the default rule result
			if (resultsEnumration.length === 2) {
				modelData.ResultDataObjectId = resultsEnumration[1].id;
				modelData.ResultDataObjectName = resultsEnumration[1].name;
				modelData.ResultDataObjectStatus = "C";
			}
		};

		sap.rules.ui.DecisionTableSettings.prototype._createDefaultColumn = function() {

			var _displayModel = this.getModel();
			var modelData = _displayModel.getData();

			//Create DecisionTable with default condition column
			modelData.DecisionTable.DecisionTableColumns.results.push({
				Condition: {
					Expression: "",
					FixedOperator: "",
					Id: this.mNextColumnId++,
					RuleId: modelData.Id,
					Version: modelData.Version,
					ValueOnly: this._getCellFormat()
				},
				Id: 1,
				Sequence: 1,
				Type: sap.rules.ui.DecisionTableColumn.Condition,
				Status: "C"
			});
		};

		sap.rules.ui.DecisionTableSettings.prototype._updateDecisionTableHeader = function() {

			var _displayModel = this.getModel();
			var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
			var sExpressionLanguageVersion = oExpressionLanguage.getExpressionLanguageVersion();

			var modelData = _displayModel.getData();

			//Fullfill decisiontable header data
			modelData.Type = sap.rules.ui.RuleType.DecisionTable;
			//modelData.RuleFormat = sap.rules.ui.RuleFormat.Advanced;
			modelData.ExpressionLanguageVersion = sExpressionLanguageVersion;
		};

		sap.rules.ui.DecisionTableSettings.prototype._prepareNewRule = function() {

			this._updateDecisionTableHeader();

			this._createDefaultColumn();

			this._setDefaultResult();
		};

		sap.rules.ui.DecisionTableSettings.prototype._createTable = function() {

			this.conditionsTable = new Table({
					backgroundDesign: sap.m.BackgroundDesign.Solid,
					showSeparators: sap.m.ListSeparators.None,
					fixedLayout: true,
					layoutData: new sap.ui.layout.form.GridContainerData({
						halfGrid: false
					}),
					columns: [
						new sap.m.Column({
							width: "50%",
							header: new sap.m.Label({
								text: this.oBundle.getText("colOfDecisionTable"),
								design: sap.m.LabelDesign.Bold
							}).setTooltip(this.oBundle.getText("colOfDecisionTable"))
						}),

						new sap.m.Column({
							width: "25%",
							header: new sap.m.Label({
								text: this.oBundle.getText("fixedOperator"),
								design: sap.m.LabelDesign.Bold
							}).setTooltip(this.oBundle.getText("fixedOperator"))
						}),

						/*new sap.m.Column({
							width: "30%",
							//visible: this.getCellFormat() == sap.rules.ui.DecisionTableCellFormat.Both || this.getCellFormat() == sap.rules.ui.DecisionTableCellFormat.Guided,
							header: new sap.m.Label({
								text: this.oBundle.getText("inputMode"),
								design: sap.m.LabelDesign.Bold
							}).setTooltip(this.oBundle.getText("inputMode"))
						}),*/ // input mode choice will be removed from decision table settings

						new sap.m.Column({
							width: "20%"
						})
					]
				}).data("hrf-id", "columnsTable", true);

			var _displayModel = this.getModel();

			this.conditionsTable.setModel(_displayModel);

			this.conditionsTable.bindItems({
				path: "/DecisionTable/DecisionTableColumns/results",
				factory: this._tableColumnsFactory.bind(this)
			});

			this.conditionsTable.setBusyIndicatorDelay(0);

			return this.conditionsTable;
		};

		sap.rules.ui.DecisionTableSettings.prototype._ruleResultColumns = function() {
			var currentColumns = this.getModel().oData.DecisionTable.DecisionTableColumns.results;

			function isResult(currentColumn) {
				return currentColumn.Result != null;
			}
			return currentColumns.filter(isResult);
		};

		sap.rules.ui.DecisionTableSettings.prototype._getResultsUpdates = function(resultColumnsOld, resultColumnsNew) {
			var addedColumns = [],
				removedColumns = [],
				changedColumns = [];
			var i = 0,
				j = 0;
			for (i = 0; i < resultColumnsOld.length; i++) {
				var columnExist = false;
				for (j = 0; j < resultColumnsNew.length; j++) {
					//Uriel: I compare to name instead of ID until team2 bug fix, then I'll use the commented condition.
					//if (resultColumnsNew[j].id === resultColumnsOld[i].Result.DataObjectAttributeId){
					if (resultColumnsNew[j].name === resultColumnsOld[i].Result.DataObjectAttributeName) {
						columnExist = true;
						if ((resultColumnsNew[j].businessDataType != resultColumnsOld[i].Result.BusinessDataType) ||
							(resultColumnsNew[j].name != resultColumnsOld[i].Result.DataObjectAttributeName)) {
							changedColumns.push(resultColumnsOld[i].Result.DataObjectAttributeName);
						}
					}
				}
				if (!columnExist) {
					removedColumns.push(resultColumnsOld[i].Result.DataObjectAttributeName);
				}
				columnExist = false;
			}

			for (j = 0; j < resultColumnsNew.length; j++) {
				var currentVocabularyColumnFoundInRule = false;
				for (i = 0; i < resultColumnsOld.length; i++) {
					//Uriel: I compare to name instead of ID until team2 bug fix, then I'll use the commented condition.
					//if (resultColumnsNew[j].id === resultColumnsOld[i].Result.DataObjectAttributeId){
					if (resultColumnsNew[j].name === resultColumnsOld[i].Result.DataObjectAttributeName) {
						currentVocabularyColumnFoundInRule = true;
					}
				}
				if (!currentVocabularyColumnFoundInRule) {
					addedColumns.push(resultColumnsNew[j].name);
				}
				currentVocabularyColumnFoundInRule = false;
			}
			return {
				addedColumns: addedColumns,
				changedColumns: changedColumns,
				removedColumns: removedColumns
			};
		};

		sap.rules.ui.DecisionTableSettings.prototype._updateRefreshFlags = function(needRefresh, isEnabled) {
			this.getModel().getData().needToRefresh = needRefresh;
			this.getModel("settingsModel").setProperty("/refreshButtonEnabled", isEnabled, null, true);
			/////////////////// Non ABAP Requires Predefined results table. Hence, calling function import before Apply/////////
			this.getModel("settingsModel").setProperty("/refreshButtonClicked", true);
			this._callRefreshResultsFunctionImport();

		};

		sap.rules.ui.DecisionTableSettings.prototype._callRefreshResultsFunctionImport = function() {
			var that = this;
			var odataModel = this.getModel("oDataModel");
			var modelData = this.getModel().getData();
			var changesGroupID = {
				groupId: "changes"
			};
			odataModel.setDeferredGroups([changesGroupID.groupId]);
			var submitSuccess = function(response) {
				var sServiceURL = odataModel.sServiceUrl;
				var needToRenderPredefinedResultsTable = false;

				if (sServiceURL === "/rules-service/rule_srv") {
					needToRenderPredefinedResultsTable = true;
				}

				if (needToRenderPredefinedResultsTable) {
					//create predefinedResults table with the refreshed attributes
					that._createPredefinedResultsTable();
				}

				//reset the status so that the call will not go once again when clicked on apply
				that.getModel().getData().needToRefresh = false;

			};

			var submitError = function(e) {
				sap.m.MessageToast.show(e);
			};

			var callRefreshFunctionImport = function(response) {
				var sRuleId = modelData.Id;
				odataModel.callFunction("/RefreshRuleResultDataObject", {
					method: "POST",
					groupId: changesGroupID.groupId,
					urlParameters: {
						RuleId: sRuleId
					}
				});
				odataModel.submitChanges({
					groupId: changesGroupID.groupId,
					success: submitSuccess,
					error: submitError
				});
			};

			if (modelData.needToRefresh) {
				callRefreshFunctionImport();
			}
		};

		sap.rules.ui.DecisionTableSettings.prototype._getMessageByResultUpdates = function(resultUpdates) {
			var messageRefreshWillDelete = this.oBundle.getText("refreshingWillDeleteMsg");
			var messageAreyouSure = this.oBundle.getText("refreshAreyouSureMsg");
			var countChanges = resultUpdates.addedColumns.length + resultUpdates.changedColumns.length + resultUpdates.removedColumns.length;
			if (countChanges != 0) {
				var quoted = function(str) {
					return "'" + str + "'";
				};
				var addedColumnsString = (resultUpdates.addedColumns.length == 0) ? "" : this.oBundle.getText("columnsWereAdded", resultUpdates.addedColumns
					.map(quoted).toString());
				var changedColumnsString = (resultUpdates.changedColumns.length == 0) ? "" : this.oBundle.getText("columnsWereChanged", resultUpdates
					.changedColumns.map(quoted).toString());
				var removedColumnsString = (resultUpdates.removedColumns.length == 0) ? "" : this.oBundle.getText("columnsWereRemoved", resultUpdates
					.removedColumns.map(quoted).toString());
				var dialogStatisticsMessage = addedColumnsString + changedColumnsString + removedColumnsString + ((resultUpdates.removedColumns.length ==
					0) ? "" : messageRefreshWillDelete) + messageAreyouSure;
				this.getModel("settingsModel").setProperty("/refreshButtonEnabled", true, null, true);
				return dialogStatisticsMessage;
			} else {
				this.getModel("settingsModel").setProperty("/refreshButtonEnabled", false, null, true);
			}
			return null;
		};

		sap.rules.ui.DecisionTableSettings.prototype._createRefreshButton = function() {

			var _calcStatisticsMessage = function() { //returns null if no changes => we'll disable refresh button
				var results = this.getModel("settingsModel").oData.results.resultsEnumration;
				var currentResultID = this.getModel().oData.ResultDataObjectId;
				var resultColumnsNew = [];
				var currentResultIDFound = false;
				// TODO: Currently results[i].columns is empty - need to fix this
				if (currentResultID) {
					for (var i = 0; i < results.length; i++) {
						if (results[i].id === currentResultID) {
							if (results[i].columns) {
								resultColumnsNew = results[i].columns;
								currentResultIDFound = true;
								break;
							} else { // this section is applicable for Cloud Service
								this.getModel("settingsModel").setProperty("/refreshButtonEnabled", true, null, true);
								currentResultIDFound = true;
								var messageRefreshWillDelete = this.oBundle.getText("refreshingWillDeleteMsg");
								var messageAreyouSure = this.oBundle.getText("refreshAreyouSureMsg");
								return messageRefreshWillDelete + messageAreyouSure;
							}

						}
					}

					if (!currentResultIDFound) {
						resultColumnsNew = null;
					}
					if (resultColumnsNew && resultColumnsNew.length > 0) {
						var resultColumnsOld = this._ruleResultColumns();
						var resultUpdates = this._getResultsUpdates(resultColumnsOld, resultColumnsNew);
						return this._getMessageByResultUpdates(resultUpdates);
					}
				}
				this.getModel("settingsModel").setProperty("/refreshButtonEnabled", false, null, true);
				return null;
			}.bind(this);

			var _handleRefreshConfirmed = function() {
				this._updateRefreshFlags(true, false);
			}.bind(this);

			var calculatedStatisticsMessage = _calcStatisticsMessage();
			var _handleRefreshPress = function() {
				var dialogStatisticsMessage = calculatedStatisticsMessage;
				MessageBox.warning(
					dialogStatisticsMessage, {
						title: this.oBundle.getText("refeshResultWarningTitle"),
						actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
						onClose: function(oAction) {
							if (oAction === sap.m.MessageBox.Action.OK) {
								_handleRefreshConfirmed();
							}
						}
					});
			}.bind(this);

			var oRefreshButton = new Button({
				layoutData: new sap.ui.layout.ResponsiveFlowLayoutData({
					weight: 1
				}),
				icon: sap.ui.core.IconPool.getIconURI("synchronize"),
				width: "3rem",
				type: sap.m.ButtonType.Transparent,
				text: "",
				press: _handleRefreshPress,
				visible: true,
				enabled: "{settingsModel>/refreshButtonEnabled}"
			}).setTooltip(this.oBundle.getText("refreshBtn"));

			this.refreshButton = oRefreshButton;
			return oRefreshButton;
		};

		sap.rules.ui.DecisionTableSettings.prototype._createResultInput = function() {
			// var sPreviousValue = null;
			// var sPreviousLiveValue = null;

			this.oResultInput = new Input({
				width: "220px",
				//enabled: "{settingsModel>/results/enabled}",
				valueHelpOnly: true,
				showValueHelp: true,
				selectedKey: "{/ResultDataObjectId}",
				value: "{/ResultDataObjectName}",
				suggestionItems: {
					path: "settingsModel>/results/resultsEnumration",
					//sorter: { path: 'name' },		
					template: new sap.ui.core.Item({
						key: "{settingsModel>id}",
						text: "{settingsModel>name}"
					})
				},
				valueHelpRequest: function(oEvent) {

					var oInputSource = oEvent.getSource();
					var _displayModel = this.getModel();
					var modelData = _displayModel.getData();

					var _handleValueHelpOpen = function() {

						var _handleSearch = function _handleSearch(evt) {
							var sValue = evt.getParameter("value");
							var oFilter = new sap.ui.model.Filter(
								"name",
								sap.ui.model.FilterOperator.Contains, sValue
							);
							evt.getSource().getBinding("items").filter([oFilter]);
						};

						this.oSelectDialog = new sap.m.SelectDialog({
							title: this.oBundle.getText("chooseResultDialogTitle"),
							styleClass: "sapUiPopupWithPadding",
							rememberSelections: true,
							items: {
								path: "settingsModel>/results/resultsEnumration",
								//sorter: { path: 'name' },
								template: new sap.m.StandardListItem({
									title: "{settingsModel>name}",
									description: "{settingsModel>description}"
								})
							},
							search: _handleSearch,
							liveChange: _handleSearch,
							confirm: function(evt) {
								var oSelectedItem = evt.getParameter("selectedItem");
								var oSelectedContexts = evt.getParameter("selectedContexts");

								if (oSelectedItem) {
									var newResultObjID = oSelectedContexts[0].getProperty().id;
									oInputSource.setSelectedKey(newResultObjID);

									var settingsModelWithDataObjectInfo = this.getModel("settingsModel");
									settingsModelWithDataObjectInfo.setProperty("/resultDataObjectChanged", true);
									settingsModelWithDataObjectInfo.setProperty("/newResultDataObjectID", newResultObjID);
									//reset the predefined results json if the data object changes
									settingsModelWithDataObjectInfo.oData.predefinedResults = [];

									this._createPredefinedResultsLayout();

									//Update flag of result change
									if (!modelData.ResultDataObjectStatus) {
										modelData.ResultDataObjectStatus = "U";
										//If same ResultDataObject selected, no updates to refresh button
										if (modelData.ResultDataObjectId != oSelectedItem.getInfo()) {
											this._updateRefreshFlags(false, false);
										}
									}
								}
								evt.getSource().getBinding("items").filter([]);
								if (this.oSelectDialog && this.oSelectDialog._oDialog) {
									this.oSelectDialog._oDialog.destroy();
									this.oSelectDialog = null;
								}

							}.bind(this),
							cancel: function(evt) {
								if (this.oSelectDialog && this.oSelectDialog._oDialog) {
									this.oSelectDialog._oDialog.destroy();
									this.oSelectDialog = null;
								}
								this.oSelectDialog = null;
							}.bind(this)
						});
						this.oSelectDialog.setModel(this.oResultInput.getModel("settingsModel"), "settingsModel");
						this.oSelectDialog.open();

					}.bind(this);

					function _openChangeResultWarningMessage() {
						MessageBox.warning(
							this.oBundle.getText("changeResultWarningMsg"), {
								title: this.oBundle.getText("changeResultWarningTitle"),
								actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
								onClose: function(oAction) {
									if (oAction === sap.m.MessageBox.Action.OK) {
										_handleValueHelpOpen();
									}
								}
							}
						);
					}

					// check when to raise warning message popup before opening VH popup
					if (modelData.ResultDataObjectStatus) {
						_handleValueHelpOpen();
					} else if (this.getProperty("newDecisionTable")) {
						modelData.ResultDataObjectStatus = "C";
						_handleValueHelpOpen();
					} else {
						_openChangeResultWarningMessage.call(this);
					}

				}.bind(this)
			});

			return this.oResultInput;
		};

		sap.rules.ui.DecisionTableSettings.prototype._createLayout = function() {
			var oForm = new SimpleForm({
				editable: true,
				layout: "ResponsiveGridLayout",
				maxContainerCols: 1,
				columnsL: 1,
				columnsM: 1,
				labelSpanM: 1,
				content: [

					new Label({
						text: this.oBundle.getText("hitPolicy")
					}).setTooltip(this.oBundle.getText("hitPolicy")),
					new Select({
						width: "220px",
						enabled: "{settingsModel>/hitPolicy/enabled}",
						items: {
							path: "settingsModel>/hitPolicy/hitPolicyEnumration",
							template: new sap.ui.core.Item({
								key: "{settingsModel>key}",
								text: "{settingsModel>text}"
							})
						},
						selectedKey: "{/DecisionTable/HitPolicy}",
						change: function(oEvent) {

							//Update flag of hitPolicy change
							var _displayModel = this.getModel();
							var modelData = _displayModel.getData();
							if (modelData.DecisionTable.HitPolicyStatus != "C") {

								modelData.DecisionTable.HitPolicyStatus = "U";
							}

						}.bind(this)
					}),

					new Label(),
                    new sap.ui.layout.HorizontalLayout({
                    }),
					
					new Label({
						text: this.oBundle.getText("conditionsTableLabelText")
					}).setTooltip(this.oBundle.getText("conditionsTableLabelTooltip")),
					this._createTable(),
					
					new Label(),
                    new sap.ui.layout.HorizontalLayout({
                    }),
                    
					new Label({
						text: this.oBundle.getText("output")
					}).setTooltip(this.oBundle.getText("output")),
					new sap.ui.layout.HorizontalLayout({
						content: [
							this._createResultInput(),
							this._createRefreshButton()
						]
					}),
					new Label(),
					this._createPredefinedResultsLayout()

				]
			}).addStyleClass("sapRULTDecisionTableSettingsForm");

			return oForm;
		};

		//********************************* Predefined Values related functions *****************************

		//creates layout for predefined values
		sap.rules.ui.DecisionTableSettings.prototype._createPredefinedResultsLayout = function() {
			var needToRenderPredefinedResultsTable = false;
			//if ABAP backend is used, we do not show the predefined results table
			if (!needToRenderPredefinedResultsTable) {
				var odataModel = this.getModel("oDataModel");
				var sServiceURL = odataModel.sServiceUrl;
				if (sServiceURL === "/rules-service/rule_srv") {
					needToRenderPredefinedResultsTable = true;
				}
			}
			if (needToRenderPredefinedResultsTable) {
				var verticalLayout = new sap.ui.layout.VerticalLayout({
					content: [
						this._createInfoMessageStrip(this.oBundle.getText("PredefinedMessageStripHiddenAccessInfoText"), "id_HiddenAccessMessageStrip"),

						this._createInfoMessageStrip(this.oBundle.getText("PredefinedMessageStripEditableAccessInfoText"),
							"id_EditableAccessMessageStrip"),

						this._createPredefinedResultsTable()

					]
				});
				return verticalLayout;
			} else {
				return new Label();
			}

		};

		//creates a message strip
		sap.rules.ui.DecisionTableSettings.prototype._createInfoMessageStrip = function(textstr, elementID) {

			var omsgStrip = sap.ui.getCore().byId(elementID);
			if (!omsgStrip) {
				omsgStrip = new sap.m.MessageStrip({

					visible: true, // boolean		
					id: elementID,
					text: textstr, // string		
					type: sap.ui.core.MessageType.Information, // sap.ui.core.MessageType		

					showIcon: true, // boolean	
					showCloseButton: true

				}).addStyleClass("sapRULTDecisionTableSettingsMessageStrip");

			}
			return omsgStrip;

		};

		//creates table for predefined values with access options
		sap.rules.ui.DecisionTableSettings.prototype._createPredefinedResultsTable = function() {
			//if the table does not exist, create the table
			if (!this.oColAccessTable) {
				this.oColAccessTable = new sap.m.Table("idColAccessTable", {
					backgroundDesign: sap.m.BackgroundDesign.Solid,
					showSeparators: sap.m.ListSeparators.All,
					swipeDirection: sap.m.SwipeDirection.Both,
					fixedLayout: true,
					layoutData: new sap.ui.layout.form.GridContainerData({
						halfGrid: false
					}),
					columns: [new sap.m.Column({
						width: "45%",
						header: new sap.m.Label({
							text: this.oBundle.getText("PredefinedResultColumnHeaderText"),
							design: sap.m.LabelDesign.Bold
						})
					}), new sap.m.Column({
						width: "30%",
						header: new sap.m.Label({
							text: this.oBundle.getText("PredefinedAccessColumnHeaderText"),
							design: sap.m.LabelDesign.Bold
						})
					}), new sap.m.Column({
						width: "45%",
						header: new sap.m.Label({
							text: this.oBundle.getText("PredefinedValuesColumnHeaderText"),
							design: sap.m.LabelDesign.Bold
						})
					})]
				});
			}
			//bind model and factory function to the created table
			var bResultDataObjectChanged = this.getModel("settingsModel").getProperty("/resultDataObjectChanged");
			var bResultDataObjectAttributesChanged = this.getModel("settingsModel").getProperty("/refreshButtonClicked");
			var _displayModel = this.getModel();
			var resultObjId = "";

			if (!bResultDataObjectChanged && !bResultDataObjectAttributesChanged) {
				this.oColAccessTable.setModel(_displayModel);

				this.oColAccessTable.bindItems({
					path: "/DecisionTable/DecisionTableColumns/results",
					factory: this._predefinedResultsFactory.bind(this)
				});
				this.oColAccessTable.setBusyIndicatorDelay(0);
				return this.oColAccessTable;

			} else {
				if (bResultDataObjectAttributesChanged) {
					resultObjId = _displayModel.getData().ResultDataObjectId;
				}
				if (bResultDataObjectChanged) {
					resultObjId = this.getModel("settingsModel").getProperty("/newResultDataObjectID");
				}
				this._getLatestResultDataObjects(resultObjId);
			}
			return null;
		};

		sap.rules.ui.DecisionTableSettings.prototype._updateResultAttributeJSON = function(oContext, sRequestType, sAccessMode, sExpression) {
			var settingModel = this.getModel("settingsModel");
			//this setting will call /setPredefinedResults function import
			settingModel.updateResultColCells = true;
			var sAttributeId = "";
			var sPath = oContext.getPath();
			var sAttributeIdPath = "";

			// regular scenario of displaying predefined results - read from odata and build json
			if (sRequestType === "displayPredefinedResults") {
				sAttributeIdPath = sPath + "/Result/DataObjectAttributeId";
				var sAttributeAccessModePath = sPath + "/Result/AccessMode";
				var sAttributeExpressionPath = sPath + "/Result/Expression";

				sAttributeId = oContext.getObject(sAttributeIdPath) ? oContext.getObject(sAttributeIdPath) : "";
				sExpression = oContext.getObject(sAttributeExpressionPath) ? oContext.getObject(sAttributeExpressionPath) : "";
				sAccessMode = oContext.getObject(sAttributeAccessModePath) ? oContext.getObject(sAttributeAccessModePath) : this.editableModeText;
				//if the attribute exists set the properties else create an entry in the json
				if (settingModel.oData.predefinedResults[sAttributeId]) {
					settingModel.oData.predefinedResults[sAttributeId].AccessMode = sAccessMode;
					settingModel.oData.predefinedResults[sAttributeId].Expression = sExpression;
				} else {
					settingModel.oData.predefinedResults[sAttributeId] = {};
					settingModel.oData.predefinedResults[sAttributeId].AccessMode = sAccessMode;
					settingModel.oData.predefinedResults[sAttributeId].Expression = sExpression;
				}

			}

			//if either expression or access mode is changed/updated
			if (sRequestType === "updatePredefinedResults") {
				sAttributeIdPath = sPath + "/Result/DataObjectAttributeId";
				sAttributeId = oContext.getObject(sAttributeIdPath) ? oContext.getObject(sAttributeIdPath) : oContext.getObject(oContext.sPath).Id;
				//if the attribute exists set the properties
				if (settingModel.oData.predefinedResults[sAttributeId]) {
					if (sAccessMode) {
						settingModel.oData.predefinedResults[sAttributeId].AccessMode = sAccessMode;
					}
					if (sExpression || sAccessMode === this.hiddenModeText) {
						if (sAccessMode === this.hiddenModeText) {
							sExpression = "";
						}
						settingModel.oData.predefinedResults[sAttributeId].Expression = sExpression;
					}
					if (sExpression === "" && settingModel.oData.predefinedResults[sAttributeId].AccessMode === this.editableModeText) {
						settingModel.oData.predefinedResults[sAttributeId].Expression = sExpression;
					}
				}

			}

			//refresh scenario: read from existing attribute information and update json
			if (sRequestType === "refreshAttributes") {
				var attributeFound = false;
				sAttributeId = oContext.getProperty("DataObjectAttributeId") ? oContext.getProperty("DataObjectAttributeId") : oContext.getProperty(
					"Id");
				if (settingModel.oData.predefinedResults) {
					var aPredefinedResults = settingModel.oData.predefinedResults;
					for (var entry in aPredefinedResults) {
						if (sAttributeId === entry) {
							//this will be required to find which attribute exists in the local json but deleted in the backend
							settingModel.oData.predefinedResults[sAttributeId].AttributeInBackend = true;
							attributeFound = true;
							break;
						}

					}
					if (!attributeFound) {
						//new attribute found, we have to create a new entry in the json
						settingModel.oData.predefinedResults[sAttributeId] = {};
						settingModel.oData.predefinedResults[sAttributeId].Expression = "";
						settingModel.oData.predefinedResults[sAttributeId].AccessMode = this.editableModeText;
						//this will be required to find which attribute exists in the local json but deleted in the backend
						settingModel.oData.predefinedResults[sAttributeId].AttributeInBackend = true;
					}

				}
			}

			//result data object changed: reset the predefined results, set Access mode editable and expression null
			if (sRequestType === "dataObjectChanged") {
				sAttributeId = oContext.getProperty("DataObjectAttributeId") ? oContext.getProperty("DataObjectAttributeId") : oContext.getProperty(
					"Id");
				settingModel.oData.predefinedResults[sAttributeId] = {};
				settingModel.oData.predefinedResults[sAttributeId].AccessMode = this.editableModeText;
				settingModel.oData.predefinedResults[sAttributeId].Expression = "";

			}
		};

		sap.rules.ui.DecisionTableSettings.prototype._getLatestResultDataObjects = function(newResultDataObjectId) {
			var that = this;
			var oModel = that.getModel().getData();
			var sProjectId = oModel.ProjectId;
			var sVersion = oModel.Version;
			var odataModel = that.getModel("oDataModel");
			var settingsModel = that.getModel("settingsModel");
			var sdataAttributesPath = "/Projects(Id='" + sProjectId + "',Version='" + sVersion + "')/DataObjects(Id='" + newResultDataObjectId +
				"',Version='" + sVersion + "')/DataObjectAttributes";

			odataModel.read(sdataAttributesPath, {
				success: function(resultDataObjects) {
					settingsModel.updateResultColCells = true;
					that.oColAccessTable.setModel(odataModel);
					that.oColAccessTable.bindItems({
						path: sdataAttributesPath,
						factory: that._predefinedResultsFactory.bind(that)
					});

				},
				error: function(err) {
					MessageBox.error(
						that.oBundle.getText("ResultDataObjectsReadError"), {
							title: that.oBundle.getText("ResultDataObjectsMessageBoxText"),
							actions: [sap.m.MessageBox.Action.OK]

						}
					);
				}
			});
			that.oColAccessTable.setBusyIndicatorDelay(0);
			return that.oColAccessTable;
		};

		// Factory function to display and control access options column
		sap.rules.ui.DecisionTableSettings.prototype._predefinedResultsFactory = function(sId, oContext) {
			//basic display of predefinedResults reads from oContext
			//colid is used only element. On refresh we wont get the Sequence, hence we use the name here
			var colId = oContext.getProperty("Sequence") ? oContext.getProperty("Sequence") : oContext.getObject(oContext.sPath).Name;
			var expressionID = "exp" + colId;
			var type = oContext.getProperty("Type");
			var resultColCount = 0;

			//variables for display of predefined results table when result data object changes or when refresh is clicked
			var _oSettingsModel = this.getModel("settingsModel");
			var dataObjectChanged = _oSettingsModel.getProperty("/resultDataObjectChanged");
			var refreshClicked = _oSettingsModel.getProperty("/refreshButtonClicked");
			var businessDataType;

			var displayText = "";
			var sSelectedKey = "";
			var sSelectedAccessMode = "";
			var expression = "";

			// basic load of predefined results table
			if (!dataObjectChanged && !refreshClicked) {
				var resultEnumeration = oContext.getProperty("/DecisionTable/DecisionTableColumns/results");
				resultColCount = resultEnumeration.length;
				type = resultEnumeration[this.resultCounter].Type;
				// load the predefined results table only for results
				if (type === "RESULT" && resultColCount > 0 && this.resultCounter < resultColCount) {
					displayText = resultEnumeration[this.resultCounter].Result.DataObjectAttributeName;
					businessDataType = resultEnumeration[this.resultCounter].Result.BusinessDataType;

					//get the text saved in the backend and set the corresponding key for the dropdown
					sSelectedAccessMode = resultEnumeration[this.resultCounter].Result.AccessMode ? resultEnumeration[this.resultCounter].Result.AccessMode :
						"";
					if (sSelectedAccessMode === this.editableModeText || sSelectedAccessMode === null) {
						sSelectedKey = "editableAccess";
					} else {
						sSelectedKey = "hiddenAccess";
					}

					expression = resultEnumeration[this.resultCounter].Result.Expression ? resultEnumeration[this.resultCounter].Result.Expression : "";
					this._updateResultAttributeJSON(oContext, "displayPredefinedResults", sSelectedKey, expression);
					this.resultCounter++;
				} else {
					this.resultCounter++;
					return new sap.m.ColumnListItem({
						visible: false
					});
				}
			}

			//if data object changes , update the attribute json with access mode as editable and expression as blank
			if (_oSettingsModel.getProperty("/resultDataObjectChanged")) {
				this._updateResultAttributeJSON(oContext, "dataObjectChanged", this.editableModeText, "");
				businessDataType = oContext.getObject(oContext.sPath).BusinessDataType;
				displayText = oContext.getObject(oContext.sPath).Name;
				sSelectedKey = "editableAccess";
				expression = "";
			}

			//if refresh is clicked, read the new set of attributes,get the expression and access mode from the predefined results table
			if (_oSettingsModel.getProperty("/refreshButtonClicked")) {
				displayText = oContext.getObject(oContext.sPath).Name;
				businessDataType = oContext.getObject(oContext.sPath).BusinessDataType;
				var dataObjectAttributeId = oContext.getObject(oContext.sPath).Id;
				var predefinedAttributes = _oSettingsModel.oData.predefinedResults[dataObjectAttributeId];
				var existingAccessMode = "";
				var existingExpression = "";
				if (predefinedAttributes) {
					existingAccessMode = predefinedAttributes.AccessMode;
					existingExpression = predefinedAttributes.Expression;
				}

				if (existingAccessMode === this.editableModeText || existingAccessMode === "") {
					existingAccessMode = "editableAccess";
				} else {
					existingAccessMode = "hiddenAccess";
				}

				sSelectedKey = existingAccessMode ? existingAccessMode : "editableAccess";
				expression = existingExpression ? existingExpression : "";
				this._updateResultAttributeJSON(oContext, "refreshAttributes", sSelectedKey, expression);
			}

			return new sap.m.ColumnListItem({
				visible: true,
				vAlign: sap.ui.core.VerticalAlign.Middle,
				cells: [

					new sap.m.Label({

						visible: true,
						design: sap.m.LabelDesign.Standard,
						text: displayText,
						textAlign: sap.ui.core.TextAlign.Begin,
						textDirection: sap.ui.core.TextDirection.Inherit
					}),

					new sap.m.Select({
						width: "65%",
						id: "select" + colId,
						items: {
							path: "settingsModel>/accessOptions/cellFormatEnumration",
							template: new sap.ui.core.Item({
								key: "{settingsModel>key}",
								text: "{settingsModel>value}"
							})
						},
						selectedKey: sSelectedKey,
						enabled: true,
						change: function(oEvent) {
							this._setColumnAccessMode(oContext, oEvent);
						}.bind(this)

					}),

					this._getPredefinedExpressionAdvanced(oContext, expressionID, expression, businessDataType)

				]
			});

		};

		/*function to find if an attribute is deleted and then remove the attribute from JSON and OdatModel       
        we will also have to ensure that the sequence is maintained after deletion*/
		sap.rules.ui.DecisionTableSettings.prototype._findAndRemoveDeletedAttributeFromOModel = function() {
			var _oSettingsModel = this.getModel("settingsModel");
			var jsonArrayWithExistingValues = _oSettingsModel.oData.predefinedResults;

			for (var entry in jsonArrayWithExistingValues) {
				var predefinedResultsArray = _oSettingsModel.oData.predefinedResults;
				var tempPredefinedResultsArray = [];
				var deletedAttributeID = "";
				if (!jsonArrayWithExistingValues[entry].AttributeInBackend) {
					//remove the entry from the json 
					deletedAttributeID = entry;
					for (var attr in predefinedResultsArray) {
						if (attr === deletedAttributeID) {
							continue;
						} else {
							tempPredefinedResultsArray[attr] = {};
							tempPredefinedResultsArray[attr].AccessMode = predefinedResultsArray[attr].AccessMode;
							tempPredefinedResultsArray[attr].Expression = predefinedResultsArray[attr].Expression;
						}

					}
					_oSettingsModel.oData.predefinedResults = tempPredefinedResultsArray;
				}

				//get the sequence of the column and remove it from the omodel      
				var odataModel = this.getModel();
				var columns = odataModel.oData.DecisionTable.DecisionTableColumns.results;
				for (var col = 0; col < columns.length; col++) {
					//check only in case of the result columns      
					if (columns[col].Result && columns[col].Result.DataObjectAttributeId === deletedAttributeID) {
						this.sequenceOfAttributeDeleted = columns[col].Sequence;
						this._removeColumnFromJsonModel(this.sequenceOfAttributeDeleted, "C");
					}
				}

			}

		};

		//code to load the expression advanced column and handle selection changes
		sap.rules.ui.DecisionTableSettings.prototype._getPredefinedExpressionAdvanced = function(oContext, expressionID, expression,
			businessDataType) {
			var sAttributeId = "";

			if (oContext.getObject(oContext.sPath).Result && !sAttributeId) {
				sAttributeId = oContext.getObject(oContext.sPath).Result.DataObjectAttributeId;
			}
			if (oContext.getObject(oContext.sPath).Id && !sAttributeId) {
				sAttributeId = oContext.getObject(oContext.sPath).Id;
			}
			if (sAttributeId) {
				expression = this.getModel("settingsModel").oData.predefinedResults[sAttributeId].Expression;
			}
			var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
			var sbusinessDataType = businessDataType ? businessDataType : sap.rules.ui.ExpressionType.NonComparison;

			return new ExpressionAdvanced({
				expressionLanguage: oExpressionLanguage,
				placeholder: this.oBundle.getText("expressionPlaceHolder"),
				validateOnLoad: true,
				id: expressionID,
				type: sbusinessDataType,
				value: expression,
				editable: true,
				change: function(oEvent) {
					var oSource = oEvent.getSource();
					var sResultIndex = oContext.getPath().split("/")[1];
					oContext.oModel.oData[sResultIndex].Expression = oSource.getValue();
					var sExpression = oContext.oModel.oData[sResultIndex].Expression;
					var sAccessMode = oContext.oModel.oData[sResultIndex].AccessMode;
					this.getModel("settingsModel").setProperty("/resultAttributeChanged", true);
					this._updateResultAttributeJSON(oContext, "updatePredefinedResults", sAccessMode, sExpression);
				}.bind(this)
			});
		};

		// if the user chooses the result col to be hidden, enable expression advanced or read from the existing Odata entry
		// if the user chooses the result col to be editable, diable expression advanced and make it available in decision table
		sap.rules.ui.DecisionTableSettings.prototype._setColumnAccessMode = function(oContext, oEvent) {
			this.enableAccessValue = !this.enableAccessValue;
			var cell = oEvent.oSource.sId.split("select")[1];
			var updateCellID = "exp" + cell;
			var element = sap.ui.getCore().byId(updateCellID);
			//var resultEntryNumber = oContext.getProperty("Sequence");
			//resultEntryNumber = resultEntryNumber - 1;

			var oSelect = oEvent.getSource();
			var SelectedMode = oSelect.getSelectedKey();
			if (SelectedMode === "hiddenAccess") {

				element.enabled = true;
				element.setEditable(true);
				element.oTextArea.setValue("");
				element.setValueStateText(this.oBundle.getText("PredefinedResultsValueStateText"));
				element.removeStyleClass("sapRULExpressionAdvancedResultTable");
				this._updateResultAttributeJSON(oContext, "updatePredefinedResults", this.hiddenModeText, "");
				element._setEditorStyle();

			} else {

				element.enabled = true;
				element.setEditable(true);
				element.addStyleClass("sapRULExpressionAdvancedResultTable");
				this._updateResultAttributeJSON(oContext, "updatePredefinedResults", this.editableModeText, "");
				element._setEditorStyle();
			}

		};

		//Read the existing visibility status from Odata
		sap.rules.ui.DecisionTableSettings.prototype._getSelectedVisibilityStatus = function(sAccess) {
			if (sAccess === this.hiddenModeText) {
				return "hiddenAccess";
			} else {
				return "editableAccess";
			}
		};

		//structure definition for the visibility of columns. This will be a part of the settings model
		sap.rules.ui.DecisionTableSettings.prototype._getCellFormatAcccessOptions = function() {
			var sCellFormat = this.getProperty("cellFormat");
			var oCellFormatData = {
				CellFormat: sCellFormat,
				cellFormatEnumration: [{
					key: "editableAccess",
					value: this.editableModeText
				}, {
					key: "hiddenAccess",
					value: this.hiddenModeText
				}]
			};
			return oCellFormatData;
		};

		//***************************** Predefined Values functions end here *****************************

		sap.rules.ui.DecisionTableSettings.prototype._getColumnInputMode = function(bValueOnly) {
			if (!bValueOnly) {
				return this.oBundle.getText("advancedMode");
			}
			return (this.oBundle.getText("valueOnly"));
		};

		sap.rules.ui.DecisionTableSettings.prototype._setExpressionRelevantOperators = function(displayExpression, colId, bValueOnly) {
			var oFixedOperatorData = this._getFixedOperatorDataForExpression(displayExpression, bValueOnly);
			this._internalModel.setProperty("/tableData/" + colId, oFixedOperatorData, false);
			this._updateRemoveRowEnabled();
		};

		sap.rules.ui.DecisionTableSettings.prototype.setExpressionLanguage = function(oExpressionLanguage) {
			this.setAssociation("expressionLanguage", oExpressionLanguage, true);
			this._decisionTableHeaderSettingFormatter.setExpressionLanguage(oExpressionLanguage);
		};

		sap.rules.ui.DecisionTableSettings.prototype._changeColumnInputMode = function(oContext, oEvent) {
			var oSelect = oEvent.getSource();
			this._openWarningDialog(oSelect, oContext);
		};

		sap.rules.ui.DecisionTableSettings.prototype._changeInputMode = function(bShouldChangeMode, oSelect, oContext) {
			if (!bShouldChangeMode) {
				oSelect.setSelectedKey(this.oBundle.getText("valueOnly"));
				return;
			}
			oSelect.setEnabled(false);
			this.getModel().setProperty(oContext.sPath + "/Condition/ValueOnly", false);
			this._changeColumnStatusToUpdate(oContext);
		};

		sap.rules.ui.DecisionTableSettings.prototype._changeColumnStatusToUpdate = function(oContext) {

			var model = oContext.getModel();

			//Update column status to "update". But only in case it's not a new column
			var status = oContext.getProperty("Status");

			if (!status || status != "C") {
				model.setProperty(oContext.getPath() + "/Status", "U");
			}
		};

		sap.rules.ui.DecisionTableSettings.prototype._getInputModeEnabled = function(sCellFormat, bValueOnly) {

			if (sCellFormat !== sap.rules.ui.DecisionTableCellFormat.Both || bValueOnly === false) {
				return false;
			}
			return true;
		};

		sap.rules.ui.DecisionTableSettings.prototype._getExpressionAdvanceColumn = function(oBindingContext) {

			var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());

			return new ExpressionAdvanced({
				expressionLanguage: oExpressionLanguage,
				placeholder: this.oBundle.getText("expressionPlaceHolder"),
				validateOnLoad: true,
				type: sap.rules.ui.ExpressionType.NonComparison,
				value: {
					path: "Condition/Expression",
					events: {
						change: function(oEvent) {
							var oSource = oEvent.getSource();
							var oContext = oSource.getContext();
							var colId = oContext.getProperty("Id");
							var bValueOnly = oContext.getProperty("Condition/ValueOnly");

							//Set only relevant operators in the drop-down (relevant to the expression)
							this._setExpressionRelevantOperators(oSource.getValue(), colId, bValueOnly);
						}.bind(this)
					}
				},
				enabled: true,
				change: function(oEvent) {
					var oSource = oEvent.getSource();
					var oContext = oSource.getBindingContext();
					var colId = oContext.getProperty("Id");
					var model = oContext.getModel();
					var bValueOnly = oContext.getProperty("Condition/ValueOnly");

					//Set only relevant operators in the drop-down (relevant to the expression)
					this._setExpressionRelevantOperators(oSource.getValue(), colId, bValueOnly);

					//Mark column as "Updated"
					this._changeColumnStatusToUpdate(oContext);

					// clear previous fixed operator if expression is empty
					var expression = oContext.getProperty("Condition/Expression");
					if (!expression) {
						model.setProperty(oContext.getPath() + "/Condition/FixedOperator", "");
					}
				}.bind(this)
			});
		};

		sap.rules.ui.DecisionTableSettings.prototype._removeColumnFromJsonModel = function(sequence, status) {

			var displayModel = this.getModel();
			var modelData = displayModel.getData();
			var aColumns = modelData.DecisionTable.DecisionTableColumns.results;

			//Add coulmn to deleted coulmn's array. But only in case it's not new
			if (!status || status != "C") {

				//If deleted array doesn't exists, create it
				if (!modelData.DecisionTable.DecisionTableColumns.deleted) {

					modelData.DecisionTable.DecisionTableColumns.deleted = [];
				}

				modelData.DecisionTable.DecisionTableColumns.deleted.push(aColumns[sequence - 1]);
			}

			//remove the column from column array
			aColumns.splice(sequence - 1, 1);

			//Decrease by 1 the 'sequence' of all the next lines 
			for (var i = sequence - 1; i < aColumns.length; i++) {
				aColumns[i].Sequence--;

				//Mark column as updated only in case this isn't a new column (status "C")
				if (aColumns[i].Status && aColumns[i].Status === "C") {
					continue;
				}

				aColumns[i].Status = "U";
			}

			//displayModel.setData(modelData);
			this._setDisplayModelData(modelData);
		};

		sap.rules.ui.DecisionTableSettings.prototype._setDisplayModelData = function(modelData) {
			this.resultCounter = 0;
			var displayModel = this.getModel();
			displayModel.setData(modelData);

		};

		sap.rules.ui.DecisionTableSettings.prototype._getCellFormat = function() {
		    //Handling the valueOnly when the DecisionTableFormat is set to RuleFormat
			var sCellFormat = this.getProperty("cellFormat");
			var sdecisionTableFormat = this.getProperty("decisionTableFormat");
			if(sdecisionTableFormat === sap.rules.ui.DecisionTableFormat.RuleFormat){
			    return (this.getModel().getData().RuleFormat === sap.rules.ui.RuleFormat.Basic) ? true : false;
			}
			return (sCellFormat !== sap.rules.ui.DecisionTableCellFormat.Text) ? true : false;
		};

		sap.rules.ui.DecisionTableSettings.prototype._addColumnToJsonModel = function(sequence) {

			var displayModel = this.getModel();
			var modelData = displayModel.getData();
			var aColumns = displayModel.oData.DecisionTable.DecisionTableColumns.results;

			//Create new column instance
			var oColumnData = {
				Condition: {
					Expression: "",
					FixedOperator: "",
					Id: this.mNextColumnId,
					RuleId: modelData.Id,
					ValueOnly: this._getCellFormat(),
					Version: modelData.Version
				},
				Id: this.mNextColumnId,
				RuleId: modelData.Id,
				Sequence: sequence + 1,
				Type: sap.rules.ui.DecisionTableColumn.Condition,
				Version: modelData.Version,
				Status: "C"
			};

			this.mNextColumnId++;

			//Add new instance to column's array
			aColumns.splice(sequence, 0, oColumnData);

			//Increase by 1 the 'sequence' of all next lines 
			for (var i = sequence + 1; i < aColumns.length; i++) {
				aColumns[i].Sequence = i + 1;

				//Mark column as updated only in case this isn't a new column (status "C")
				if (aColumns[i].Status && aColumns[i].Status === "C") {
					continue;
				}

				aColumns[i].Status = "U";
			}

			//displayModel.setData(modelData);
			this._setDisplayModelData(modelData);
		};

		sap.rules.ui.DecisionTableSettings.prototype._tableColumnsFactory = function(sId, oContext) {
			var colId = oContext.getProperty("Id");
			var sequence = oContext.getProperty("Sequence");
			var status = oContext.getProperty("Status");
			var type = oContext.getProperty("Type");

			return new sap.m.ColumnListItem({
				visible: type === sap.rules.ui.DecisionTableColumn.Condition,
				cells: [

					// gets the expression col
					this._getExpressionAdvanceColumn(oContext),
					// gets the vocab col
					new sap.m.Select({
						width: "100%",
						items: {
							path: "settingsModel>/tableData/" + colId + "/fixOperatorEnumration",
							template: new sap.ui.core.Item({
								key: "{settingsModel>key}",
								text: "{settingsModel>value}"
							})
						},
						selectedKey: "{Condition/FixedOperator}",
						enabled: "{settingsModel>/tableData/" + colId + "/fixOperatorEnabled}",
						change: function(oEvent) {

							//Mark column as "Updated"
							this._changeColumnStatusToUpdate(oContext);
						}.bind(this)
					}),

					// text or guided selection- this will not be supported
					/*new sap.m.Select({
						width: "100%",
						items: {
							path: "settingsModel>/cellFormat/cellFormatEnumration",
							template: new sap.ui.core.Item({
								key: "{settingsModel>key}",
								text: "{settingsModel>value}"
							})
						},
						selectedKey: {
							parts: [{
								path: "Condition/ValueOnly"
							}],
							formatter: this._getColumnInputMode.bind(this)
						},
						enabled: {
							parts: [{
								path: "settingsModel>/cellFormat/CellFormat"
							}, {
								path: "Condition/ValueOnly"
							}],
							formatter: this._getInputModeEnabled
						},
						change: function(oEvent) {
							this._changeColumnInputMode(oContext, oEvent);
						}.bind(this)

					}),*/
					new sap.ui.layout.HorizontalLayout({
						content: [
							new sap.m.Button({
								type: sap.m.ButtonType.Transparent,
								icon: sap.ui.core.IconPool.getIconURI("sys-cancel"),
								visible: "{settingsModel>/removeRowEnabled}",
								press: function(oEvent) {

									//Clear tableData since the columns will be build again
									this._internalModel.setProperty("/tableData", {}, true);

									//Remove coulmn from JSON model
									this._removeColumnFromJsonModel(sequence, status);

								}.bind(this)
							}).setTooltip(this.oBundle.getText("removeColumn")),
							new sap.m.Button({
								type: sap.m.ButtonType.Transparent,
								icon: sap.ui.core.IconPool.getIconURI("add"),
								press: function(oEvent) {

									//Add coulmn from JSON model
									this._addColumnToJsonModel(sequence);

								}.bind(this)
							}).setTooltip(this.oBundle.getText("addColumn"))
						],
						height: "1em"
					})
				]
			});
		};

		sap.rules.ui.DecisionTableSettings.prototype._openWarningDialog = function(oSelect, oContext) {
			var dialog = new sap.m.Dialog({
				title: this.oBundle.getText("changeInputModeDialogTitle"),
				width: "70%",
				type: 'Message',
				state: 'Warning',
				content: new Text({
					text: this.oBundle.getText("changeInputModeDialogDescription")
				}),
				beginButton: new Button({
					text: this.oBundle.getText("okBtn"),
					press: function() {
						dialog.close();
						dialog.destroy();
						this._changeInputMode(true, oSelect, oContext);
					}.bind(this)
				}),
				endButton: new Button({
					text: this.oBundle.getText("cancelBtn"),
					press: function() {
						dialog.close();
						dialog.destroy();
						this._changeInputMode(false, oSelect, oContext);
					}.bind(this)
				}),
				afterClose: function() {
					dialog.close();
					dialog.destroy();
				}
			});

			dialog.open();
		};

		sap.rules.ui.DecisionTableSettings.prototype._getBindModelName = function() {
			var path = "";
			var modelName = this.getModelName();

			if (modelName) {
				path = modelName + ">";
			}

			return path;
		};

		sap.rules.ui.DecisionTableSettings.prototype._getResultsData = function() {
			var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
			var oResultsEnumration = [{
				id: "NO_RESULT",
				name: ""
			}];
			oResultsEnumration = oResultsEnumration.concat(oExpressionLanguage.getResults());
			var oResultsData = {
				resultsEnumration: oResultsEnumration
			};
			return oResultsData;
		};

		sap.rules.ui.DecisionTableSettings.prototype._initSettingsModel = function() {
			var initialData = {};

			initialData.hitPolicy = this._getHitPoliciesData();
			initialData.tableData = {};
			initialData.removeRowEnabled = false;
			initialData.cellFormat = this._getCellFormatData();
			initialData.accessOptions = this._getCellFormatAcccessOptions();
			initialData.updateAllRows = false;
			initialData.predefinedResults = [];

			initialData.results = this._getResultsData();

			this._internalModel = new sap.ui.model.json.JSONModel(initialData);
			this.setModel(this._internalModel, "settingsModel");
		};

		sap.rules.ui.DecisionTableSettings.prototype._calcNextColumnId = function() {

			var displayModel = this.getModel();
			var modelData = displayModel.getData();
			var aColumns = modelData.DecisionTable.DecisionTableColumns.results;
			var maxColId = 0;

			//Calc max "Id"
			for (var i = 0; i < aColumns.length; i++) {

				if (aColumns[i].Id > maxColId) {
					maxColId = aColumns[i].Id;
				}
			}

			var nextId = maxColId + 1;

			return nextId;
		};

		sap.rules.ui.DecisionTableSettings.prototype._getHitPoliciesData = function() {
			var hitPolicy = this.getProperty("hitPolicies");
			var length = hitPolicy.length;
			var oHitPolicyData = {
				hitPolicyEnumration: []
			};

			for (var i = 0; i < length; i++) {
				oHitPolicyData.hitPolicyEnumration.push({
					key: hitPolicy[i],
					text: this.oBundle.getText(hitPolicy[i])
				});
			}

			oHitPolicyData.enabled = length > 1 ? true : false;

			return oHitPolicyData;
		};

		sap.rules.ui.DecisionTableSettings.prototype._getCellFormatData = function() {
			var sCellFormat = this.getProperty("cellFormat");
			var oCellFormatData = {
				CellFormat: sCellFormat,
				cellFormatEnumration: [{
					key: this.oBundle.getText("advancedMode"),
					value: this.oBundle.getText("advancedMode")
				}, {
					key: this.oBundle.getText("valueOnly"),
					value: this.oBundle.getText("valueOnly")
				}]
			};
			return oCellFormatData;
		};

		sap.rules.ui.DecisionTableSettings.prototype._getFixedOperatorDataForExpression = function(sExpression, bValueOnly) {
			var fixOperatorEnabled = sExpression ? true : false;
			var fixedOperatorData = {
				fixOperatorEnumration: [{
					key: "",
					value: "None"
				}],
				fixOperatorEnabled: fixOperatorEnabled
			};

			if (fixOperatorEnabled) {
				var oSuggestions = [];
				var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
				var oFilter;
				if (!bValueOnly) {
					oFilter = [{
						tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
						tokenCategory: sap.rules.ui.ExpressionCategory.comparisonOp
					}, {
						tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
						tokenCategory: sap.rules.ui.ExpressionCategory.comparisonBetweenOp
					}, {
						tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
						tokenCategory: sap.rules.ui.ExpressionCategory.comparisonExistOp
					}];
				} else {
					oFilter = [{
						tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
						tokenCategory: sap.rules.ui.ExpressionCategory.comparisonOp
					}, {
						tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
						tokenCategory: sap.rules.ui.ExpressionCategory.comparisonBetweenOp
					}];
				}

				oSuggestions = oExpressionLanguage.getSuggestionsByCategories(sExpression, oFilter);
				for (var i = 0; i < oSuggestions.length; i++) {
					fixedOperatorData.fixOperatorEnumration.push({
						key: oSuggestions[i].text,
						value: oSuggestions[i].text
					});
				}
			}
			return fixedOperatorData;
		};

		sap.rules.ui.DecisionTableSettings.prototype._updateRemoveRowEnabled = function() {
			var columns = this.conditionsTable.getAggregation("items");
			var visibleCounter = 0;

			for (var i = 0; i < columns.length; i++) {

				if (columns[i].getVisible() === true) {
					visibleCounter++;
				}
			}

			var enabled = visibleCounter > 1;
			this._internalModel.setProperty("/removeRowEnabled", enabled, null, true);
		};

		sap.rules.ui.DecisionTableSettings.prototype.getButtons = function(oDialog) {

			var aButtons = [];

			//Create cancel button
			var oCancelButton = new Button({
				text: this.oBundle.getText("cancelBtn")
			}).setTooltip(this.oBundle.getText("cancelBtn"));

			oCancelButton.attachPress(function() {

				oDialog.close();

			}, this);

			//Create apply button
			var oApplyBtn = new Button({
				text: this.oBundle.getText("applyChangesBtn")
			}).setTooltip(this.oBundle.getText("applyChangesBtn"));

			oApplyBtn.attachPress(function() {

				this.multiHeaderFlag = false; //flag for calculate only once header span for multi header in columnFactory function
				//In case of successfull apply, the oDialog is closed from the success callback
				this._applySettingsModelChangesToOData(oDialog);

			}, this);

			aButtons.push(oApplyBtn);
			aButtons.push(oCancelButton);

			return aButtons;
		};

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//////////////           Closure - this code is relevant only when pressing "apply"             ////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		sap.rules.ui.DecisionTableSettings.prototype._applySettingsModelChangesToOData = function(oDialog) {

			var _oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
			var nextColumnId = this.mNextColumnId;
			var _settingsModel = this.getModel();
			var odataModel = this.getModel("oDataModel");
			var oSettingsModel = this.getModel("settingsModel");
			var oBindingContext = this.getBindingContext("dummy");
			var sRuleId = oBindingContext.getProperty("Id");
			var sVersion = oBindingContext.getProperty("Version");
			var sHitPolicy = _settingsModel.oData.DecisionTable.HitPolicy;
			var changesGroupID = {
				groupId: "changes"
			};
			var isNeedToSubmitChanges = false;
			if (oSettingsModel.getProperty("/refreshButtonClicked")) {
				this._findAndRemoveDeletedAttributeFromOModel();
			}

			//////////////////////////////// _updateODataHitPolicy /////////////////////////////////////////////
			var _updateODataHitPolicy = function() {

				var mParameters = {};
				mParameters.groupId = changesGroupID.groupId;

				var oDecisionTableData = {
					RuleId: sRuleId,
					Version: sVersion,
					HitPolicy: sHitPolicy
				};

				var path = "/DecisionTables(Version='" + sVersion + "',RuleId='" + sRuleId + "')";
				odataModel.update(path, oDecisionTableData, mParameters);
			};

			////////////////////////////////////// _createFirstRow /////////////////////////////////////////////////
			var _createFirstRow = function(sColumnsNumber) {

				var mParameters = {};

				var oRowData = {
					RuleId: sRuleId,
					Version: sVersion,
					Sequence: 1,
					Id: 1
				};

				mParameters.properties = oRowData;

				odataModel.createEntry("/DecisionTableRows", mParameters);
			};

			////////////////////////////////////////// _updateModelResultObject ////////////////////////////////////////////////
			var _updateModelResultObject = function(sResultObjectID) {

				odataModel.callFunction("/SetRuleResultDataObject", {
					method: "POST",
					//groupId:"DecisionTableColumnConditions",//When we'll use groupID, we'll use this line
					groupId: changesGroupID.groupId,
					urlParameters: {
						RuleId: sRuleId,
						ResultDataObjectId: (sResultObjectID !== "NO_RESULT") ? sResultObjectID : ""
					}
				});
			};
			//////////////////////////////////_updateModelPredefinedResultAttributes////////////////////////////////////////////
			var _updateModelPredefinedResultAttributes = function(sResultObjectID) {
				var newResultJsonObjects = oSettingsModel.oData.predefinedResults;
				if (newResultJsonObjects) {
					var attribute;
					for (attribute in newResultJsonObjects) {
						if (attribute.AttributeId != null || attribute.AttributeId != "") {
							odataModel.callFunction("/SetPredefinedResultAttributes", {
								method: "POST",
								//groupId:"DecisionTableColumnConditions",//When we'll use groupID, we'll use this line
								groupId: changesGroupID.groupId,
								urlParameters: {
									RuleId: sRuleId,
									DataObjectAttributeId: attribute,
									AccessMode: newResultJsonObjects[attribute].AccessMode,
									Expression: newResultJsonObjects[attribute].Expression
								}
							});
						}
					}
				}
				if (!newResultJsonObjects) {
					//There is nothing to submit if the JSON has no change
					isNeedToSubmitChanges = false;
				}

			};

			//If attributes of DO differ from existing column results, create or delete columns accordingly
			var _refreshRuleResultDataObject = function() {

				odataModel.callFunction("/RefreshRuleResultDataObject", {
					method: "POST",
					//groupId:"DecisionTableColumnConditions",//When we'll use groupID, we'll use this line
					groupId: changesGroupID.groupId,
					urlParameters: {
						RuleId: sRuleId
					}
				});
			};

			//////////////////////////////// _createNewTableODataEntries /////////////////////////////////////////////
			var _createNewTableODataEntries = function(sColumnsNumber, oDTContext) {

				var mParameters = {};
				//var modelDecisionTable = odataModel.oData["DecisionTables(Version='" + sVersion + "',RuleId='" + sRuleId + "')"];

				if (!oDTContext.getProperty("DecisionTable")) {

					//CreateEntry DecisionTable       
					var oDecisionTableData = {
						RuleId: sRuleId,
						Version: sVersion,
						HitPolicy: sHitPolicy
					};

					mParameters.properties = oDecisionTableData;
					odataModel.createEntry("/DecisionTables", mParameters);

				} else {
					_updateODataHitPolicy();
				}

				//Create a default row
				_createFirstRow();
			};

			////////////////////////////////////////// _createModelConditionEntry /////////////////////////////////////////////
			var _createModelConditionEntry = function(mConditionColumnData, mSequence) {

				var mParameters = {};

				var oColumnData = {
					RuleId: mConditionColumnData.RuleId,
					Version: mConditionColumnData.Version,
					Id: mConditionColumnData.Id,
					Type: sap.rules.ui.DecisionTableColumn.Condition,
					Sequence: mSequence
				};

				mParameters.properties = oColumnData;
				odataModel.createEntry("/DecisionTableColumns", mParameters);
				mParameters.properties = mConditionColumnData;
				odataModel.createEntry("/DecisionTableColumnConditions", mParameters);
			};

			////////////////////////////////////////// _removeModelConditionEntry /////////////////////////////////////////////
			var _removeModelConditionEntry = function(sConditionID) {

				var columnPath = "/DecisionTableColumns(RuleId='" + sRuleId + "',Version='" + sVersion + "',Id=" + sConditionID + ")";

				odataModel.remove(columnPath, changesGroupID);
			};

			///////////////////////////////////////////// _updateODataModelColumns /////////////////////////////////////////////////
			var _updateODataModelColumns = function(aSettingsModelColumns, isResultChanged) {

				var propertyPathColumn = "/DecisionTableColumns(RuleId='" + sRuleId + "',Version='" + sVersion + "',Id=ID_PROPERTY)";
				var propertyPathConditions = "/DecisionTableColumnConditions(Version='" + sVersion + "',RuleId='" + sRuleId + "',Id=ID_PROPERTY)";
				var propertyPathResults = "/DecisionTableColumnResults(Version='" + sVersion + "',RuleId='" + sRuleId + "',Id=ID_PROPERTY)";
				var settingsModelColumn;
				var Id = "";
				var currentPropertyPath = "";
				var updatedConditionOdata = {};

				//Update each new/updated columns from settingsModel into oDataModel
				for (var i = 0; i < aSettingsModelColumns.length; i++) {

					settingsModelColumn = aSettingsModelColumns[i];

					if (settingsModelColumn.Status) {

						var newExpression;
						var newFixOperator;

						if (settingsModelColumn.Condition) {
							//if expression was convertend (in case of a wrong expression it wouldn't be converted)
							newExpression = (settingsModelColumn.Condition.parserResults.converted && settingsModelColumn.Condition.parserResults.converted.Expression) ?
								settingsModelColumn.Condition.parserResults.converted.Expression :
								settingsModelColumn.Condition.Expression;
							newFixOperator = (settingsModelColumn.Condition.parserResults.converted && settingsModelColumn.Condition.parserResults.converted.FixedOperator) ?
								settingsModelColumn.Condition.parserResults.converted.FixedOperator :
								settingsModelColumn.Condition.FixedOperator;
						}

						isNeedToSubmitChanges = true;

						if (settingsModelColumn.Result && settingsModelColumn.Status === "U") {
							Id = settingsModelColumn.Id;
							currentPropertyPath = propertyPathResults.replace("ID_PROPERTY", Id);
							updatedConditionOdata = {
								Id: Id,
								Expression: settingsModelColumn.Result.Expression,
								AccessMode: settingsModelColumn.Result.AccessMode
							};

							odataModel.update(currentPropertyPath, updatedConditionOdata, changesGroupID);

						}

						if (settingsModelColumn.Status === "U") {

							// Update Sequence, for either condition or result which was not changed
							if (!(settingsModelColumn.Result && isResultChanged)) {
								Id = settingsModelColumn.Id;
								var resultSequence = {
									Sequence: settingsModelColumn.Sequence
								};
								var currentSequencePath = propertyPathColumn.replace("ID_PROPERTY", Id);
								odataModel.update(currentSequencePath, resultSequence, changesGroupID);
							}

							if (settingsModelColumn.Condition) {
								currentPropertyPath = propertyPathConditions.replace("ID_PROPERTY", Id);
								var newValueOnly = settingsModelColumn.Condition.ValueOnly;
								updatedConditionOdata = {
									Id: Id,
									Expression: newExpression,
									FixedOperator: newFixOperator,
									ValueOnly: newValueOnly
								};

								odataModel.update(currentPropertyPath, updatedConditionOdata, changesGroupID);
							}

						} else if (settingsModelColumn.Status === "C") {

							var newCondition = settingsModelColumn.Condition;
							newCondition.Expression = newExpression;
							newCondition.FixedOperator = newFixOperator;
							delete newCondition.parserResults;
							_createModelConditionEntry(newCondition, settingsModelColumn.Sequence);
						}
					}
				}
			};

			///////////////////////////////////////////// _deleteODataModelColumns /////////////////////////////////////////////////
			var _deleteODataModelColumns = function(aSettingsModelDeletedColumns) {

				//if there no deleted columns retrun
				if (!aSettingsModelDeletedColumns) {
					return;
				}

				isNeedToSubmitChanges = true;

				for (var i = 0; i < aSettingsModelDeletedColumns.length; i++) {
					var currentCondition = aSettingsModelDeletedColumns[i];
					_removeModelConditionEntry(currentCondition.Id);
				}
			};

			//////////////////////////////////////////////////// submitSuccess /////////////////////////////////////////////////
			var submitSuccess = function(batchRequestResponse) {
				var messageBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
				var foundErrorInBatch = false;
				var batchResponseArray = batchRequestResponse.__batchResponses["0"].__changeResponses;
				for (var responseEntry in batchResponseArray) {
					if (batchResponseArray[responseEntry].message) {
						var errorMessage = batchResponseArray[responseEntry].response.body;
						MessageBox.error(
							errorMessage, {
								title: messageBundle.getText("RequestFailedText"),
								actions: [sap.m.MessageBox.Action.OK]

							}
						);
						oDialog.setState(sap.ui.core.ValueState.Error);
						foundErrorInBatch = true;

					}
				}
				if (!foundErrorInBatch || !isNeedToSubmitChanges) {
					oDialog.setState(sap.ui.core.ValueState.Success);
					oDialog.close();
				}

			};

			//////////////////////////////////// _createResultDataObjectColumns /////////////////////////////////////////////////
			var _createResultDataObjectColumns = function(nextSequence) {

				var mParameters = {};
				mParameters.groupId = changesGroupID.groupId;
				var modelData = _settingsModel.getData();
				var resultName = modelData.ResultDataObjectName;
				var resultInfo = _oExpressionLanguage.getResultInfo(resultName);
				var resultParams = resultInfo ? resultInfo.requiredParams : [];
				var resultLength = resultParams.length;

				for (var i = 0; i < resultLength; i++) {

					var oColumnData = {
						RuleId: sRuleId,
						Version: sVersion,
						Id: nextColumnId,
						Type: sap.rules.ui.DecisionTableColumn.Result,
						Sequence: nextSequence
					};

					mParameters.properties = oColumnData;
					odataModel.createEntry("/DecisionTableColumns", mParameters);

					var oResultColumnData = {
						RuleId: sRuleId,
						Version: sVersion,
						Id: nextColumnId,
						DataObjectAttributeName: resultParams[i].name,
						DataObjectAttributeId: resultParams[i].paramId,
						BusinessDataType: resultParams[i].businessDataType
					};

					nextColumnId++;
					nextSequence++;

					mParameters.properties = oResultColumnData;
					odataModel.createEntry("/DecisionTableColumnResults", mParameters);
				}
			};

			/////////////////////////////////////////////////////// Main Flow ////////////////////////////////////////////////////

			//Convert _settingsModel (in display values) to _settingsModel (in code values)
			var _settingsCodeModel = _oExpressionLanguage.convertRuleToCodeValues(_settingsModel.oData);
			var aSettingsModelColumns = _settingsCodeModel.output.decisionTableData.DecisionTable.DecisionTableColumns.results;

			//All requests belonging to the group are then stored in a request queue. The deferred batch group must then be submitted manually by means of the submitChanges() method.
			odataModel.setDeferredGroups([changesGroupID.groupId]);

			var isResultChanged = _settingsModel.oData.ResultDataObjectStatus && (this.oResultInput.getSelectedKey() != "")? true : false;
			var isResultAttributeChanged = _settingsModel.oData.needToRefresh ? true : false;
			var isResultAttributeParameterChanged = oSettingsModel.updateResultColCells ? true : false;
            
            //Update oDataModel with all delete columns
			_deleteODataModelColumns(_settingsModel.oData.DecisionTable.DecisionTableColumns.deleted);
			
			//Update oDataModel with all new/updated columns
			_updateODataModelColumns(aSettingsModelColumns, isResultChanged);

			var isNewTable = this.getProperty("newDecisionTable");

			if (isNewTable) {
				isNeedToSubmitChanges = true;
				_createNewTableODataEntries(aSettingsModelColumns.length, oBindingContext);

			} else if (_settingsModel.oData.DecisionTable.HitPolicyStatus === "U") {
				isNeedToSubmitChanges = true;
				_updateODataHitPolicy(sRuleId, sVersion, sHitPolicy, changesGroupID);
			}

			if (isResultChanged || isResultAttributeChanged) {
				isNeedToSubmitChanges = true;
				_updateModelResultObject(_settingsModel.oData.ResultDataObjectId);
				_updateModelPredefinedResultAttributes(_settingsModel.oData.ResultDataObjectId);
			}

			if (isResultAttributeParameterChanged) {
				isNeedToSubmitChanges = true;
				_updateModelPredefinedResultAttributes(_settingsModel.oData.ResultDataObjectId);
			}

			var needToRefresh = _settingsModel.oData.needToRefresh;
			if (needToRefresh) {
				isNeedToSubmitChanges = true;
				_refreshRuleResultDataObject();
			}

			if (isNewTable) {
				_createResultDataObjectColumns(aSettingsModelColumns.length + 1);
			}

			var mParameters = {};
			mParameters.success = submitSuccess;
			mParameters.groupId = changesGroupID.groupId;

			if (isNeedToSubmitChanges) {

				//Save changes to backend
				odataModel.submitChanges(mParameters);

				//We'll close the dialog on the submitSuccess callback
				return;
			} else {
				oDialog.setState(sap.ui.core.ValueState.Success);
				oDialog.close();
			}

		};

		return oDecisionTableSettings;

	}, /* bExport= */ true);