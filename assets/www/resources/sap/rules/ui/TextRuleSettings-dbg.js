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
		"sap/m/Column",
		"sap/m/Text",
		"sap/m/CheckBox",
		"sap/m/Input",
		"sap/m/Button",
		"sap/m/ComboBox",
		"sap/rules/ui/ExpressionAdvanced",
		"sap/ui/layout/VerticalLayout",
		"sap/rules/ui/type/Expression"
	],
	function(jQuery, library, Control, SimpleForm, Label, Switch, Select, MessageBox, Table, Column, Text, CheckBox, Input, Button, ComboBox,
		ExpressionAdvanced, VerticalLayout, ExpressionType) {
		"use strict";

		/**
		 * Constructor for a new TextRuleSettings Control. 
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
		 * @alias sap.rules.ui.TextRuleSettings
		 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
		 */
		var oTextRuleSettings = Control.extend("sap.rules.ui.TextRuleSettings", {
			metadata: {
				library: "sap.rules.ui",
				properties: {
					modelName: {
						type: "string",
						defaultValue: ""
					},
					newTextRule: {
						type: "boolean",
						defaultValue: false
					},
					enableElseIf: {
						type: "boolean",
						defaultValue: false
					},
					enableElse: {
						type: "boolean",
						defaultValue: false
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
				}
			}
		});

		//Function Import for refresh before Apply
		sap.rules.ui.TextRuleSettings.prototype._callRefreshResultsFunctionImport = function() {
			var that = this;
			var odataModel = this.getModel("oDataModel");
			var modelData = this.getModel().getData();
			var changesGroupID = {
				groupId: "changes"
			};
			odataModel.setDeferredGroups([changesGroupID.groupId]);
			var submitSuccess = function(response) {
				//create predefinedResults table with the refreshed attributes
				that._createPredefinedTable();
				//reset the status so that the call will not go once again when clicked on apply
				that.getModel().getData().needToRefresh = false;
			};

			var submitError = function(e) {
				sap.m.MessageToast.show(e);
			};

			var callRefreshFunctionImport = function(response) {
				var sRuleId = modelData.RuleId;
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

		//creates a message strip
		sap.rules.ui.TextRuleSettings.prototype._createInfoMessageStrip = function(textstr, elementID) {
			var oMsgStrip = new sap.m.MessageStrip({
				visible: true, // boolean		
				id: elementID,
				text: textstr, // string		
				type: sap.ui.core.MessageType.Information, // sap.ui.core.MessageType	
				showIcon: true, // boolean	
				showCloseButton: true
			}).addStyleClass("sapTextRuleSettingsMessageStrip");
			return oMsgStrip;
		};

		//Creates the formlayout inside the Settings dialog
		sap.rules.ui.TextRuleSettings.prototype._createLayout = function() {
			var that = this;
			if (!this.oForm){
				this._destroyElements();
				this.oForm = new SimpleForm("_formLayout",{
					editable: true,
					layout: "ResponsiveGridLayout",
					maxContainerCols: 1,
					columnsL: 1,
					columnsM: 1,
					labelSpanM: 1,
					content: [
						//Once Else If is implemented
						/*new Label(),

						new sap.ui.layout.HorizontalLayout({
							content: [
								new CheckBox("__elseIfCheckBox", {
									enabled: true,
									selected: "{TextRuleModel>/enableElseIf}",
									select: function(oEvent) {
										var oSource = oEvent.getSource();
										var bSelected = oSource.getSelected();
										var _displayModel = this.getModel();
										var modelData = _displayModel.getData();
										if (modelData.ElseIfStatus != "C") {
											modelData.ElseIfStatus = "U";
										}
										that._internalModel.getData().enableElseIf = bSelected;
									}
								}),

								new Label({
									text: this.oBundle.getText("enableElseIf"),
									design: sap.m.LabelDesign.Bold
								}).setTooltip(this.oBundle.getText("elseIf"))
								.addStyleClass("sapRULTextRuleSettingsCheckBoxLabel")
							]
						}),*/

						new Label(),

						new CheckBox("__elseCheckBox", {
							enabled: true,
							width: "100px",
							text: this.oBundle.getText("enableElse"),
							selected: this.getProperty("enableElse"),
							select: function(oEvent) {
								var oSource = oEvent.getSource();
								var bSelected = oSource.getSelected();
								var _displayModel = this.getModel();
								var modelData = _displayModel.getData();
								if (modelData.ElseStatus != "C") {
									modelData.ElseStatus = "U";
								}
								that.setProperty("enableElse", bSelected);
							}
						}),


						new Label({
							text: this.oBundle.getText("output")
						}).setTooltip(this.oBundle.getText("output")),

						new sap.ui.layout.HorizontalLayout({
							content: [
								new Select("__resultSelect", {

									width: "220px",
									items: {
										path: "settingModel>/results/resultsEnumeration",
										template: new sap.ui.core.Item({
											key: "{settingModel>Id}",
											text: "{settingModel>Name}"
										})
									},
									selectedKey: "{/ResultDataObjectId}",
									change: function(oEvent) {
										var oSelect = oEvent.getSource();
										//Update flag of result DO change
										var _displayModel = this.getModel();
										var modelData = _displayModel.getData();
										if (modelData.ResultDataObjectStatus != "C") {
											modelData.ResultDataObjectId = oSelect.getSelectedKey();
											modelData.ResultDataObjectName = oSelect._getSelectedItemText();
											modelData.ResultDataObjectStatus = "U";
											//If same ResultDataObject selected, no updates to refresh button
											if (modelData.ResultDataObjectId != oSelect.getSelectedKey()) {
												this._updateRefreshFlags(false, false);
											}
										}
										this.getModel("settingModel").setProperty("/resultDataObjectChanged", true);
										
										/*if(this.getModel("TextRuleModel").getProperty("/newTextRule")){
											if(sap.ui.getCore().byId("verticalLayout")){
												sap.ui.getCore().byId("verticalLayout").destroy();
											}
											if(sap.ui.getCore().byId("id_HiddenAccessMessageStrip")){
												sap.ui.getCore().byId("id_HiddenAccessMessageStrip").destroy();
											}
											if(sap.ui.getCore().byId("id_EditableAccessMessageStrip")){
												sap.ui.getCore().byId("id_EditableAccessMessageStrip").destroy();
											}
											if(sap.ui.getCore().byId("idPredefinedTable")){
												sap.ui.getCore().byId("idPredefinedTable").destroy();
											}
											var layout = this._createVerticalLayout();
											this.oForm.addContent(layout);
										}else{*/
											this._createPredefinedTable();
										//}
										

									}.bind(this)
								}),
								this._createRefreshButton()
							]
						}),

						new Label(),

						this._createPredefinedResultsLayout()
					]
				}).addStyleClass("sapTextRuleSettingsForm");
			}
			

			this.oForm.setBusyIndicatorDelay(0);

			return this.oForm;
		};

		//Checks for existence of AccessMode/Expression in backend and decides to render Predefined table accordingly
		sap.rules.ui.TextRuleSettings.prototype._createPredefinedResultsLayout = function() {
			var bRenderPredefinedTable = false;
			var sServiceUrl = this.getModel("oDataModel").sServiceUrl;
			if (sServiceUrl =="/rules-service/rule_srv"){
				bRenderPredefinedTable = true;
			}
			if (bRenderPredefinedTable) {
				var verticalLayout = this._createVerticalLayout();
				return verticalLayout;
			} else {
				return new Label();
			}
		};

		//Creates predefined table in the settings dialog
		sap.rules.ui.TextRuleSettings.prototype._createPredefinedTable = function() {
			if (!this.oPredefinedTable) {
				this.oPredefinedTable = new Table("idPredefinedTable", {
					backgroundDesign: sap.m.BackgroundDesign.Solid,
					showSeparators: sap.m.ListSeparators.All,
					swipeDirection: sap.m.SwipeDirection.Both,
					fixedLayout: true,
					layoutData: new sap.ui.layout.form.GridContainerData({
						halfGrid: false
					}),
					columns: [new Column({
						width: "45%",
						header: new sap.m.Label({
							text: "Text Rule Results",
							design: sap.m.LabelDesign.Bold
						})
					}), new Column({
						width: "25%",
						header: new sap.m.Label({
							text: "Access",
							design: sap.m.LabelDesign.Bold
						})
					}), new Column({
						width: "45%",
						header: new sap.m.Label({
							text: "Value",
							design: sap.m.LabelDesign.Bold
						})
					})]
				});
			}
			var bResultDataObjectChanged = this.getModel("settingModel").getProperty("/resultDataObjectChanged");
			var bResultDataObjectAttributesChanged = this.getModel("settingModel").getProperty("/refreshButtonClicked");
			var _displayModel = this.getModel("oDataModel");
			//For creating table when Result is not changed
			if (!bResultDataObjectChanged && !bResultDataObjectAttributesChanged) {
				this.oPredefinedTable.setModel(_displayModel);
				var bindingPath = [this.getModel().getData().ruleBindingPath, "/TextRule/TextRuleResults"].join("");
				this.oPredefinedTable.bindItems({
					path: bindingPath,
					factory: this._tableFactory.bind(this)
				});
				this.oPredefinedTable.setBusyIndicatorDelay(0);
				return this.oPredefinedTable;
			} else {
				this._updatePredefinedTable(this.getModel().getData());
			}
			return null;
		};

		//Created Refresh button and handles press event
		sap.rules.ui.TextRuleSettings.prototype._createRefreshButton = function() {
			var _calcStatisticsMessage = function() { //returns null if no changes => we'll disable refresh button
				this.getModel("settingModel").setProperty("/refreshButtonEnabled", true, null, true);
				return this.oBundle.getText("textRuleRefreshWarning");			
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
				enabled: "{settingModel>/refreshButtonEnabled}"
			}).setTooltip(this.oBundle.getText("refreshBtn"));
			this.refreshButton = oRefreshButton;
			return oRefreshButton;
		};
		
		sap.rules.ui.TextRuleSettings.prototype._createVerticalLayout = function(){
			var verticalLayout = new sap.ui.layout.VerticalLayout("verticalLayout",{
				content: [
					this._createInfoMessageStrip(this.oBundle.getText("TRPredefinedMessageStripHiddenAccessInfoText"), "id_HiddenAccessMessageStrip"),
					this._createInfoMessageStrip(this.oBundle.getText("TRPredefinedMessageStripEditableAccessInfoText"),
						"id_EditableAccessMessageStrip"),
					this._createPredefinedTable()
				]
			});
			return verticalLayout;
		};
		
		sap.rules.ui.TextRuleSettings.prototype._destroyElements = function(){
			if (sap.ui.getCore().byId("_formLayout")){
				sap.ui.getCore().byId("_formLayout").destroy();
			}
			if (sap.ui.getCore().byId("__elseCheckBox")){
				sap.ui.getCore().byId("__elseCheckBox").destroy();
			}
			if (sap.ui.getCore().byId("__resultSelect")){
				sap.ui.getCore().byId("__resultSelect").destroy();
			}
			if (sap.ui.getCore().byId("id_HiddenAccessMessageStrip")){
				sap.ui.getCore().byId("id_HiddenAccessMessageStrip").destroy();
			}
			if (sap.ui.getCore().byId("id_EditableAccessMessageStrip")){
				sap.ui.getCore().byId("id_EditableAccessMessageStrip").destroy();
			}
			if (sap.ui.getCore().byId("idPredefinedTable")){
				sap.ui.getCore().byId("idPredefinedTable").destroy();
			}			
		}
		

		//Returns the Access Modes
		sap.rules.ui.TextRuleSettings.prototype._getAccessOptions = function() {
			var oAccessOptions = {
				accessEnumration: [{
					key: "editableAccess",
					value: "Editable"
				}, {
					key: "hiddenAccess",
					value: "Hidden"
				}]
			};
			return oAccessOptions;
		};

		//Reads the selected ResultDataObject from Rule
		sap.rules.ui.TextRuleSettings.prototype._getCurrentResult = function() {
			var modelData = this.getModel().getData();
			var oHeaderKey = {
				Id: modelData.RuleId,
				Version: modelData.RuleVersion
			};
			var oDataModel = this.getModel("oDataModel");
			var sPath = oDataModel.createKey("/Rules", oHeaderKey);
			var path = sPath.split("/")[1];
			modelData.ResultDataObjectId = oDataModel.oData[path].ResultDataObjectId;
			modelData.ResultDataObjectName = oDataModel.oData[path].ResultDataObjectName;
			modelData.ResultDataObjectStatus = "A";
		};

		//Refresh Related
		sap.rules.ui.TextRuleSettings.prototype._getMessageByResultUpdates = function(resultUpdates) {
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

		//Returns the expression advanced field
		// eslint-disable-next-line
		sap.rules.ui.TextRuleSettings.prototype._getPredefinedExpressionAdvanced = function(oContext, expressionID, expression, businessDataType) {
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
						var oContext = oSource.getBindingContext();
						var sResultIndex = oContext.getPath().split("/")[1];
						oContext.oModel.oData[sResultIndex].Expression = oSource.getValue();
						this.getModel("settingModel").setProperty("/resultAttributeChanged", true);
						this._updateResultAttributeJSON(oContext, false, null, oSource.getValue());
					}.bind(this)
				});
			},

			//Reads the DataObjects from model for the result dropdown
			sap.rules.ui.TextRuleSettings.prototype._getResultsData = function() {
				var that = this;
				var bnewRule = this.getProperty("newTextRule");
				var oModel = this.getModel("oDataModel");
				var ruleData = this.getModel().getData();
				var oHeaderKey = {
					Id: ruleData.ProjectId,
					Version: ruleData.ProjectVersion
				};
				var headerPath = [oModel.createKey("/Projects", oHeaderKey), "/DataObjects"].join("");
				oModel.read(headerPath, {
					success: function(data) {
						that._readSuccess(data, bnewRule);
					},
					error: function() {
						console.log("Error reading DO"); 
					}
				});
			};

		//Returns the attribute's access mode
		sap.rules.ui.TextRuleSettings.prototype._getSelectedVisibilityStatus = function(sAccess) {
			if (sAccess == "Hidden") {
				return "hiddenAccess";
			} else {
				return "editableAccess";
			}
		};

		//Initialises the settings model for TextRuleSettings
		sap.rules.ui.TextRuleSettings.prototype._initSettingsModel = function(oResultData) {
			var initialData = {};
			initialData.predefinedResults = [];
			initialData.results = oResultData;
			initialData.accessOptions = this._getAccessOptions();
			this._internalModel = new sap.ui.model.json.JSONModel(initialData);
			this.setModel(this._internalModel, "settingModel");
		};

		//SuccessCall for reading DOs from model
		sap.rules.ui.TextRuleSettings.prototype._readSuccess = function(data, bnewRule) {
			if (data) {
				var oResultsData = {
					resultsEnumeration: data.results
				};
				oResultsData.resultsEnumeration.push({Id:"0",Name:""});
				this._initSettingsModel(oResultsData);
				if (bnewRule) {
					this._setDefaultResult();
				} else {
					this._getCurrentResult();
				}
				if (this.needCreateLayout) {
					var layout = this.getAggregation("mainLayout");
					if (layout) {
						layout.destroy();
					}
					layout = this._createLayout();
					this.setAggregation("mainLayout", layout);
					this.needCreateLayout = false;
				}
			}
		};

		//Sets default Result if it is a new rule
		sap.rules.ui.TextRuleSettings.prototype._setDefaultResult = function() {
			var _displayModel = this.getModel();
			var modelData = _displayModel.getData();
			var resultsEnumeration = this._internalModel.getData().results.resultsEnumeration;
			if (resultsEnumeration.length > 0) {
				modelData.ResultDataObjectId = resultsEnumeration[resultsEnumeration.length-1].Id;
				modelData.ResultDataObjectName = resultsEnumeration[resultsEnumeration.length-1].Name;
				modelData.ResultDataObjectStatus = "A";
			}
		};

		//Changes the AccessMode for attribute and value state of corresponding expression advanced
		sap.rules.ui.TextRuleSettings.prototype._setColumnAccessMode = function(oContext, oEvent) {
			var oSelect = oEvent.getSource();
			var expId = "exp" + oEvent.getSource().sId.split("select")[1];
			var expressionAdvanced = sap.ui.getCore().byId(expId);
			var sSelectedMode = oSelect.getSelectedKey();
			var sResultIndex = oContext.getPath().split("/")[1];
			if (sSelectedMode === "hiddenAccess") {
				oContext.oModel.oData[sResultIndex].AccessMode = "Hidden";
				oContext.oModel.oData[sResultIndex].Expression = "";
				expressionAdvanced.setValue("");
				expressionAdvanced.setValueStateText(this.oBundle.getText("defaultValue"));
				this._updateResultAttributeJSON(oContext, false, "Hidden", null);
			} else {
				oContext.oModel.oData[sResultIndex].AccessMode = "Editable";
				this._updateResultAttributeJSON(oContext, false, "Editable", null);
			}
			this.getModel("settingModel").setProperty("/resultAttributeChanged", true);
		};

		//Factory function for creating predefined table on first load
		sap.rules.ui.TextRuleSettings.prototype._tableFactory = function(sId, oContext) {
			var colId = sId.split("-")[1];
			var expressionID = "exp" + colId;
			var displayText = oContext.getProperty("DataObjectAttributeName") ? oContext.getProperty("DataObjectAttributeName") : oContext.getProperty(
				"Name");
			var attributeId = oContext.getProperty("DataObjectAttributeId") ? oContext.getProperty("DataObjectAttributeId") : oContext.getProperty(
				"Id");
			var expression;
			var businessDataType = oContext.getProperty("BusinessDataType");
			var sSelectedKey;
			var oSettingModel = this.getModel("settingModel");
			var aAttributeList = oSettingModel.oData.predefinedResults;
			if (oSettingModel.getProperty("/resultDataObjectChanged")) {
				this._updateResultAttributeJSON(oContext, true, "Editable", "");
				sSelectedKey = "Editable";
				expression = "";
			} else if (oSettingModel.getProperty("/refreshButtonClicked")) {
				var predefinedAttributes = aAttributeList[attributeId];
				sSelectedKey = predefinedAttributes ? predefinedAttributes.AccessMode : "Editable";
				expression = predefinedAttributes ? predefinedAttributes.Expression : "";
				this._updateResultAttributeJSON(oContext, false, sSelectedKey, expression);
			} else {
				expression = oContext.getProperty("Expression");
				sSelectedKey = oContext.getProperty("AccessMode");
				this._updateResultAttributeJSON(oContext, false, sSelectedKey, expression);
			}
			
			var sAccessKey = this._getSelectedVisibilityStatus(sSelectedKey);

			return new sap.m.ColumnListItem({
				visible: true,
				cells: [
					new sap.m.Label({
						visible: true, // boolean
						design: sap.m.LabelDesign.Standard, // sap.m.LabelDesign
						text: displayText,
						textAlign: sap.ui.core.TextAlign.Begin, // sap.ui.core.TextAlign
						textDirection: sap.ui.core.TextDirection.Inherit // sap.ui.core.TextDirection
					}),

					new sap.m.Select({
						width: "65%",
						id: "select" + colId,
						items: {
							path: "settingModel>/accessOptions/accessEnumration",
							template: new sap.ui.core.Item({
								key: "{settingModel>key}",
								text: "{settingModel>value}"
							})
						},
						selectedKey: sAccessKey,
						change: function(oEvent) {
							this._setColumnAccessMode(oContext, oEvent);
						}.bind(this)

					}),

					this._getPredefinedExpressionAdvanced(oContext, expressionID, expression, businessDataType)
				]
			});
		};

		//Reads DataObjectAttributes from the model for the new result DO
		sap.rules.ui.TextRuleSettings.prototype._updatePredefinedTable = function(oResultData) {
			if(this.getModel("settingModel").getProperty("/resultDataObjectChanged")){
				this.getModel("settingModel").oData.predefinedResults = [];
			}
			this.resultDataObjectModel = this.getModel("oDataModel");
			var results = this._internalModel.getData().results.resultsEnumeration;
			var dataObjectVersion;
			for (var i = 0; i < results.length; i++) {
				if (results[i].Id == oResultData.ResultDataObjectId) {
					dataObjectVersion = results[i].Version;
					break;
				}
			}
			var ruleData = this.getModel().getData();
			var oHeaderKey = {
				Id: ruleData.ProjectId,
				Version: ruleData.ProjectVersion
			};
			var sProjectPath = this.resultDataObjectModel.createKey("/Projects", oHeaderKey);

			oHeaderKey = {
				Id: oResultData.ResultDataObjectId,
				Version: dataObjectVersion
			};
			var sdataAttributesPath = [sProjectPath, this.resultDataObjectModel.createKey("/DataObjects", oHeaderKey), "/DataObjectAttributes"].join(
				"");

			this.oPredefinedTable.setModel(this.resultDataObjectModel);
			this.oPredefinedTable.bindItems({
				path: sdataAttributesPath,
				factory: this._tableFactory.bind(this)
			});
			this.oPredefinedTable.setBusyIndicatorDelay(0);
			return this.oPredefinedTable;
		};

		sap.rules.ui.TextRuleSettings.prototype._updateRefreshFlags = function(needRefresh, isEnabled) {
			this.getModel().getData().needToRefresh = needRefresh;
			this.getModel("settingModel").setProperty("/refreshButtonEnabled", isEnabled, null, true);
			/////////////////// Non ABAP Requires Predefined results table. Hence, calling function import before Apply/////////
			this.getModel("settingModel").setProperty("/refreshButtonClicked", true);
			this._callRefreshResultsFunctionImport();

		};

		//Updates the array of DataObjectAttributes with properties when result/AccessMode/Expression is changed
		sap.rules.ui.TextRuleSettings.prototype._updateResultAttributeJSON = function(
			oContext, bResultChanged, sAccessMode, sExpression) {
			var settingModel = this.getModel("settingModel");
			var isRefreshed = settingModel.getProperty("/refreshButtonClicked");
			var sAttributeId = oContext.getProperty("DataObjectAttributeId") ? oContext.getProperty("DataObjectAttributeId") : oContext.getProperty(
				"Id");
			if (settingModel.oData.predefinedResults) {
				if (settingModel.oData.predefinedResults[sAttributeId]) {
					if (bResultChanged) {
						settingModel.oData.predefinedResults[sAttributeId].AccessMode = "Editable";
						settingModel.oData.predefinedResults[sAttributeId].Expression = "";
					}
					if(isRefreshed){
						settingModel.oData.predefinedResults[sAttributeId] = oContext.getObject(oContext.sPath);
						settingModel.oData.predefinedResults[sAttributeId].isAttributeinBackend = true;
					}
					if (sAccessMode) {
						settingModel.oData.predefinedResults[sAttributeId].AccessMode = sAccessMode;
					} 
					if (sExpression || sExpression=="") {
						settingModel.oData.predefinedResults[sAttributeId].Expression = sExpression;
					} 
					
				} else {/* eslint-disable */
					settingModel.oData.predefinedResults[sAttributeId] = oContext.getObject(oContext.sPath);
					if(bResultChanged){						
						settingModel.oData.predefinedResults[sAttributeId].AccessMode = "Editable";
						settingModel.oData.predefinedResults[sAttributeId].Expression = "";
					}					
					if(isRefreshed){
						settingModel.oData.predefinedResults[sAttributeId].isAttributeinBackend = true;
					}						
				}/* eslint-enable */
			}
		};

		//Returns the Buttons for the Settings Dialog
		sap.rules.ui.TextRuleSettings.prototype.getButtons = function(oDialog) {
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
				this._applySettingsModelChangesToOData(oDialog);
				//In case of successfull apply, the oDialog is closed from the success callback
			}, this);

			aButtons.push(oApplyBtn);
			aButtons.push(oCancelButton);

			return aButtons;
		};

		sap.rules.ui.TextRuleSettings.prototype.init = function() {
			this.oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
			this.needCreateLayout = true; //Checks if layout already exists
			this.firstLoad = true; //Checks if dialog has been opened before for the rule
			// this.onsapescape = function(oEvent) {
			// 	oEvent.stopPropagation();
			// };
			this.setBusyIndicatorDelay(0);
		};

		//Execution starts here (after init method)
		sap.rules.ui.TextRuleSettings.prototype.onBeforeRendering = function() {
			if (this.firstLoad) {
				this._getResultsData();
				this.firstLoad = false;
			}
		};

		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//////////////           Closure - this code is relevant only when pressing "apply"             ////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		sap.rules.ui.TextRuleSettings.prototype._applySettingsModelChangesToOData = function(oDialog) {
			var that = this;
			var _displayModel = this.getModel();
			var oDataModel = this.getModel("oDataModel");
			var oSettingsModel = this.getModel("settingModel");
			var oBindingContext = this.getBindingContext("dummy");
			var sRuleId = _displayModel.oData.RuleId;
			var sRuleVersion = _displayModel.oData.RuleVersion;
			var sResultObjectId = _displayModel.oData.ResultDataObjectId;
			var bResultChanged = oSettingsModel.getProperty("/resultDataObjectChanged");
			var bAttributeChanged = oSettingsModel.getProperty("/resultAttributeChanged");
			var bEnableElse = this.getProperty("enableElse");
			//var bEnableElseIf = this.getProperty("enableElseIf"); //For Else If
			//var nSequence = 1; //TODO: Proper implementation along with Else If
			var bInvokePredefinedFI = (_displayModel.oData.ElseStatus == "U" && bEnableElse) ? false : true;
			var changesGroupID = {
				groupId: "changes"
			};
			var isNeedToSubmitChanges = false;
			var isNewTextRule = this.getProperty("newTextRule");
			
			//Success CallBack for model submit changes
			var submitSuccess = function() {
				oDialog.setState(sap.ui.core.ValueState.Success);
				oDialog.close();
			};			
						
			//Deletes the Extra TextRuleResult and TextRuleResultExpressions entries after refresh for deleted attributes
			var _deleteExtraEntries = function(){
				var aAttributeList = oSettingsModel.oData.predefinedResults;
				for(var attribute in aAttributeList){
					if(!aAttributeList[attribute].isAttributeinBackend){
						var oTextRuleResultData = {
							RuleId: aAttributeList[attribute].RuleId,
							RuleVersion: aAttributeList[attribute].RuleVersion,
							Id: aAttributeList[attribute].Id
						};
						
						var sPath = oDataModel.createKey("/TextRuleResults", oTextRuleResultData);
						var oContext = new sap.ui.model.Context(oDataModel, sPath);
						oDataModel.deleteCreatedEntry(oContext);
						
						var aResultExpressions = _displayModel.oData.TextRuleResultExpressions;
						for(var i=0; i < aResultExpressions.length; i++){
							if(aResultExpressions[i].ResultId == aAttributeList[attribute].Id){
								var oTextRuleResultExpression = {
										RuleId: aAttributeList[attribute].RuleId,
										RuleVersion: aAttributeList[attribute].RuleVersion,
										ResultId: aAttributeList[attribute].Id,
										ConditionId: aResultExpressions[i].ConditionId
									};									
									var sPath = oDataModel.createKey("/TextRuleResultExpressions", oTextRuleResultExpression);
									var oContext = new sap.ui.model.Context(oDataModel, sPath);
									oDataModel.deleteCreatedEntry(oContext);
							}
						}
					}
				}				
			};

			//Handles new TextRule creation
			var _createNewRuleODataEntries = function() {
				var mParameters = {};

				if (!oBindingContext.getProperty("TextRule")) {
					//CreateEntry TextRule       
					var oTextRule = {
						RuleId: sRuleId,
						RuleVersion: sRuleVersion
					};
					mParameters.properties = oTextRule;
					oDataModel.createEntry("/TextRules", mParameters);
					
				}	

				//Create TextRuleCondition If
				var oTextRuleConditon = {
					RuleId: sRuleId,
					RuleVersion: sRuleVersion,
					Sequence: 1,
					Type: "If"
				};
				mParameters.properties = oTextRuleConditon;
				oDataModel.createEntry("/TextRuleConditions", mParameters);
				
			};
			
			var _createTextRuleResultExpression = function(newCondition){
				var sConditionId = newCondition.Id;
				var oResults = _displayModel.oData.TextRuleResults;
				var mParameters = {};
				if (!bResultChanged && oResults){
					for (var i = 0; i < oResults.length; i++){
						var oResultExpressionData = {
							RuleId: sRuleId,
							RuleVersion: sRuleVersion,
							ResultId: oResults[i].Id,
							ConditionId: sConditionId,
							Expression: oResults[i].Expression
						};
						mParameters.properties = oResultExpressionData;						
						oDataModel.createEntry("/TextRuleResultExpressions", mParameters);
					}
					mParameters = {};
					mParameters.success = submitSuccess;
					mParameters.groupId = changesGroupID.groupId;
					oDataModel.submitChanges(mParameters);
				}
				if(!bResultChanged && bAttributeChanged){
					_updateModelPredefinedResultAttributes();
					bAttributeChanged = false;
				}				
			};

			//Creates or deletes Else type TextRuleCondition according to user's settings
			var _updateODataEnableElse = function(sequence) {
				var bModelEnableElse = that.getModel("TextRuleModel").oData.enableElse;
				var bInternalEnableElse = that.getProperty("enableElse");
				if (bInternalEnableElse && !bModelEnableElse) {
					var mParameters = {};
					var oTextRuleData = {
						RuleId: sRuleId,
						RuleVersion: sRuleVersion,
						Sequence: sequence,
						Type: "Else"
					};
					mParameters.properties = oTextRuleData;
					mParameters.success = _createTextRuleResultExpression;
					mParameters.error = function(){
						console.log("Error creating TextRuleResultExpressions");
					}
					oDataModel.createEntry("/TextRuleConditions", mParameters);
				} else if(!bInternalEnableElse && bModelEnableElse){
					oDataModel.remove(_displayModel.oData.elseBindingPath, changesGroupID);
				}
			};
			
			//For ElseIF
			/*	var _updateODataEnableElseIf = function(sequence) {
					if (bEnableElseIf) {
						var mParameters = {};
						var oTextRuleData = {
							RuleId: sRuleId,
							RuleVersion: sRuleVersion,
							Sequence: sequence,
							Type: "ElseIf"
						};
						mParameters.properties = oTextRuleData;
						oDataModel.createEntry("/TextRuleConditions", mParameters);
					} else {
						//oDataModel.remove(oSettingsModel.oData.elseBindingpath, changesGroupID); //TODO: passing Id of Condition
					}
				};*/
			
			//Called when Result DO is changed
			var _updateModelResultObject = function() {
				oDataModel.callFunction("/SetRuleResultDataObject", {
					method: "POST",
					groupId: changesGroupID.groupId,
					urlParameters: {
						RuleId: sRuleId,
						ResultDataObjectId: sResultObjectId
					}
				});
			};

			//Called when Result Attributes properties are modified
			var _updateModelPredefinedResultAttributes = function() {
				if (oSettingsModel.oData.predefinedResults) {
					var newResultJsonObjects = oSettingsModel.oData.predefinedResults;
					var attribute;
					for (attribute in newResultJsonObjects) {
						var sAccessMode = newResultJsonObjects[attribute].AccessMode;
						var sExpression = newResultJsonObjects[attribute].Expression ? newResultJsonObjects[attribute].Expression : "";
						oDataModel.callFunction("/SetPredefinedResultAttributes", {
							method: "POST",
							groupId: changesGroupID.groupId,
							urlParameters: {
								RuleId: sRuleId,
								DataObjectAttributeId: attribute,
								AccessMode: sAccessMode,
								Expression: sExpression
							}
						});
					}
				}
			};

			//If attributes of DO differ from existing column results, create or delete columns accordingly
			var _refreshRuleResultDataObject = function() {
				oDataModel.callFunction("/RefreshRuleResultDataObject", {
					method: "POST",
					groupId: changesGroupID.groupId,
					urlParameters: {
						RuleId: sRuleId
					}
				});
			};

			/////////////////////////////////////////////////////// Main Flow ////////////////////////////////////////////////////
			if(oSettingsModel.getProperty("/refreshButtonClicked")){
				_deleteExtraEntries();
			}
			
			if (isNewTextRule) {
				isNeedToSubmitChanges = true;
				_createNewRuleODataEntries();
			}
			/* if (_displayModel.oData.ElseIfStatus == "U") { //When Else if is implemented
							isNeedToSubmitChanges = true;
							_updateODataEnableElseIf(nSequence++);
						}*/
			if (_displayModel.oData.ElseStatus == "U") {
				isNeedToSubmitChanges = true;
				_updateODataEnableElse(2); //Sequence logic to be implemented properly once Else IF is needed
			}						

			//When only Attributes are modified and Result DO is unchanged
			if (!bResultChanged && bAttributeChanged  && bInvokePredefinedFI) {
				isNeedToSubmitChanges = true;
				_updateModelPredefinedResultAttributes();
			} else if (bResultChanged) { //Result DO is changed
				isNeedToSubmitChanges = true;
				_updateModelResultObject();
				_updateModelPredefinedResultAttributes();
			}

			var needToRefresh = oSettingsModel.oData.needToRefresh;
			if (needToRefresh) {
				isNeedToSubmitChanges = true;
				_refreshRuleResultDataObject();
			}
			
			var mParameters = {};
			mParameters.success = submitSuccess;
			mParameters.groupId = changesGroupID.groupId;
			if (isNeedToSubmitChanges) {
				//Save changes to backend
				oDataModel.submitChanges(mParameters);
				return;
			}

			oDialog.setState(sap.ui.core.ValueState.Success);
			oDialog.close();
		};

		return oTextRuleSettings;

	}, /* bExport= */ true);
