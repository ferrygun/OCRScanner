/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides this._validatecontrol sap.rules.ui.
sap.ui.define(["jquery.sap.global",
    "./library",
    "sap/m/Label",
    "sap/rules/ui/RuleBase",
    "sap/m/Panel",
    "sap/ui/core/Title",
    "sap/ui/layout/form/Form",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/Text",
    "sap/m/Button", "sap/ui/layout/Grid",
    "sap/ui/layout/form/FormContainer",
    "sap/ui/layout/form/FormElement",
    "sap/rules/ui/ExpressionAdvanced",
    "sap/m/Link",
    "sap/m/FlexBox",
    "sap/m/Dialog",
    "sap/rules/ui/TextRuleSettings"
], function (jQuery, library, Label, RuleBase, Panel, Title, Form, Toolbar, ToolbarSpacer, Text, Button, Grid, FormContainer, FormElement,
             ExpressionAdvanced, Link, FlexBox, Dialog, TextRuleSettings) {
    "use strict";

    /**
     * Constructor for a new TextRule Control.
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
     * @alias sap.rules.ui.TextRule
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) design time meta model
     */

    var dataPartName = {
        vocabulary: "vocabulary",
        rule: "rule",
        verticalLayout: "verticalLayout"
    };

    var TextRule = RuleBase.extend("sap.rules.ui.TextRule", {
        metadata: {
            properties: {
                enableSettings: {
                    type: "boolean",
                    group: "Misc",
                    defaultValue: false
                }
            },
            aggregations: {
                "_toolbar": {
                    type: "sap.m.Toolbar",
                    multiple: false,
                    singularName: "_toolbar"
                },
                "_verticalLayout": {
                    type: "sap.ui.core.Control",
                    multiple: false,
                    visibility: "visible",
                    singularName: "_verticalLayout"
                }
            }
        },

        /*
         * @private
         */
        _addToolBar: function () {
            var oToolbar = new Toolbar({
                design: "Transparent",
                enabled: "{TextRuleModel>/editable}"
            });

            var oTitle = new sap.m.Title({
                text: this.oBundle.getText("textRule")
            });

            var oSettingsButton = new Button({
                text: "",
                press: this._openTextRuleSettings.bind(this),
                visible: {
                    parts: [{
                        path: "TextRuleModel>/enableSettings"
                    }, {
                        path: "TextRuleModel>/editable"
                    }],
                    formatter: this._decideSettingsEnablement
                },
                enabled: {
                    parts: [{
                        path: "TextRuleModel>/enableSettings"
                    }, {
                        path: "TextRuleModel>/editable"
                    }],
                    formatter: this._decideSettingsEnablement
                }
            }).setTooltip(this.oBundle.getText("settings"));
            oSettingsButton.setIcon("sap-icon://action-settings");

            oToolbar.addContent(oTitle);
            oToolbar.addContent(new ToolbarSpacer({}));
            oToolbar.addContent(oSettingsButton);
            oToolbar.addContent(new ToolbarSpacer({
                width: "1em"
            }));
            this.setAggregation("_toolbar", oToolbar, true);
        },

        _addTextRuleControl: function () {
            this.verticalLayout = new sap.ui.layout.VerticalLayout({
                width: "100%",
                busy: "{TextRuleModel>/busyVerticalLayoutState}"
            });
            this.setAggregation("_verticalLayout", this.verticalLayout, true);
        },

        _bindRule: function () {
            var bindingPath = [this._getBindModelName(), this.getBindingContextPath()].join("");
            this.bindElement({
                path: bindingPath,
                parameters: {
                    expand: "TextRule"
                }
            });
            this.getElementBinding().attachDataRequested(this._handleRuleDataRequested, this);
            this.getElementBinding().attachDataReceived(this._handleRuleDataReceived, this);

            // force data load (otherwise if data exists there is no data fetch)
            this.getElementBinding().refresh();
        },

        _bindVerticalLayout: function () {
            var oVerticalLayout = this.getAggregation("_verticalLayout");
            var bindingPath = [this._getBindModelName(), this.getBindingContextPath(), "/TextRule/TextRuleConditions"].join("");

            oVerticalLayout.bindAggregation("content", {
                path: bindingPath,
                parameters: {
                    expand: "TextRuleResultExpressions"
                },
                //	sorter: oSorter,
                factory: this._verticalLayoutFactory.bind(this)
            });
            oVerticalLayout.getBinding("content").attachDataRequested(this._handleVerticalLayoutDataRequested, this);
            oVerticalLayout.getBinding("content").attachDataReceived(this._handleVerticalLayoutDataReceived, this);
        },

        _createFormLayout: function (sId, oContext, title) {
            var panel = new Panel({
                expandable: true,
                expanded: true,
                headerText: title,
                content: new Form(sId, {
                    editable: true,
                    layout: new sap.ui.layout.form.ResponsiveGridLayout({
                        labelSpanXL: 2,
                        labelSpanL: 2,
                        labelSpanM: 2,
                        labelSpanS: 12,
                        adjustLabelSpan: false,
                        emptySpanXL: 4,
                        emptySpanL: 4,
                        emptySpanM: 4,
                        emptySpanS: 4,
                        columnsL: 1,
                        columnsM: 1
                    }),
                    formContainers: [
                        // If form container
                        this._createIfBlockFormContainer(oContext, title),
                        // Then form container
                        this._createThenFormContainer(oContext, this.oBundle.getText("then"))
                    ]
                })
            });
            return panel;
        },

        _createElseFormLayout: function (sId, oContext, title) {
            var panel = new Panel({
                expandable: true,
                expanded: true,
                headerText: title,
                content: new Form(sId, {
                    editable: true,
                    layout: new sap.ui.layout.form.ResponsiveGridLayout({
                        labelSpanXL: 2,
                        labelSpanL: 2,
                        labelSpanM: 2,
                        labelSpanS: 12,
                        adjustLabelSpan: false,
                        emptySpanXL: 4,
                        emptySpanL: 4,
                        emptySpanM: 4,
                        emptySpanS: 4,
                        columnsL: 1,
                        columnsM: 1
                    }),
                    formContainers: [
                        this._createElseFormContainer(oContext, title)
                    ]
                })
            });
            return panel;
        },

        _createIfBlockFormContainer: function (oContext, title) {
            var expression = oContext.getProperty("Expression");
            var formContainer = new FormContainer({
                //title: title,
                formElements: [
                    new FormElement({
                        label: new Label({
                            text: ""
                        }), // Empty label is needed
                        fields: [this._getExpressionAdvancedText(oContext, expression)]
                        //layoutData: new sap.ui.layout.ResponsiveFlowLayoutData({linebreak: true, margin: false})
                    })
                ]
            });
            return formContainer;
        },

        _createThenFormContainer: function (oContext, title) {
            var formContainer = new FormContainer({
                //title: title,
                toolbar: new Toolbar({
                    content: [new ToolbarSpacer({
                        width: "2em"
                    }), new Label({
                        text: title
                    }).addStyleClass("sapTextRuleFontSize")]
                })
            });

            var bindingPath = [this.getBindingContextPath(), "/TextRule", oContext.getPath(), "/TextRuleResultExpressions"].join("");

            formContainer.bindAggregation("formElements", {
                path: bindingPath,
                factory: this._formElementsFactory.bind(this)
            });

           /* //Hiding the FormContainer if all the Result Attributes are 'Hidden'
            var oFormElements = formContainer.getFormElements();
            var bVisible = false;
            for (var i = 0; i < oFormElements.length; i++) {
                if (oFormElements[i].getVisible()) {
                    bVisible = true;
                    break;
                }
            }
            formContainer.setVisible(bVisible);*/
            return formContainer;
        },

        _createElseFormContainer: function (oContext, title) {
            this._settingsModel.oData.elseBindingPath = oContext.getPath();
            var formContainer = new FormContainer({
                //title: title
            });

            var bindingPath = [this.getBindingContextPath(), "/TextRule", oContext.getPath(), "/TextRuleResultExpressions"].join("");

            formContainer.bindAggregation("formElements", {
                path: bindingPath,
                factory: this._formElementsFactory.bind(this)
            });

            //Hiding the FormContainer if all the Result Attributes are 'Hidden'
            /*var oFormElements = formContainer.getFormElements();
            var bVisible = false;
            for (var i = 0; i < oFormElements.length; i++) {
                if (oFormElements[i].getVisible()) {
                    bVisible = true;
                    break;
                }
            }
            formContainer.setVisible(bVisible);*/
            return formContainer;
        },

        _createTextRuleSettings: function () {
            var oModel = this._getModel();
            var oContext = this.getBindingContext();
            if (this._internalModel.getProperty("/newTextRule")) {
                this._internalModel.setProperty("/enableElse", false);
            }
            var oTextRuleSettings = new TextRuleSettings({
                expressionLanguage: this.getExpressionLanguage(),
                enableElse: this._internalModel.getProperty("/enableElse"),
                //enableElseIf: "{TextRuleModel>/enableElseIf}",
                newTextRule: this._internalModel.getProperty("/newTextRule")
            });
            //Create a copy of the setting model.
            var settingModelDataStr = JSON.stringify(this._settingsModel.getData());
            var settingModelData = JSON.parse(settingModelDataStr);
            var settingModel = new sap.ui.model.json.JSONModel(settingModelData);
            oTextRuleSettings.setModel(settingModel);

            //Set configuration model
            oTextRuleSettings.setModel(this._internalModel, "TextRuleModel");

            //Set OdataModel + context  (needed for apply button)
            oTextRuleSettings.setModel(oModel, "oDataModel");
            oTextRuleSettings.setBindingContext(oContext, "dummy");

            return oTextRuleSettings;
        },

        _dataPartReceived: function (partName) {
            this.dataReceived[partName] = true;
            if (!this._isAllDataReceived()) {
                return;
            }
            this._updateBusyState();
            this._dataLoaded.resolve();
        },

        _dataPartRequested: function (partName) {
            this.dataReceived[partName] = false;
            this._setDataLoadedPromise();
            this._updateBusyState();
        },

        _decideSettingsEnablement: function (enableSettings, editable) {
            return enableSettings && editable;
        },

        _formElementsFactory: function (sId, oContext) {
            var resultId = oContext.getProperty("ResultId"),
                ruleId = oContext.getProperty("RuleId"),
                version = oContext.getProperty("RuleVersion"),
                path,
                sAccessMode,
                bVisible = true;

            var oHeaderKey = {
                RuleId: ruleId,
                Id: resultId,
                RuleVersion: version
            };

            var expression = oContext.getProperty("Expression");

            var headerPath = oContext.getModel().createKey("/TextRuleResults", oHeaderKey);
            path = headerPath.split("/")[1];
            this.getModel("settingModel").oData.TextRuleResults.push(oContext.getModel().oData[path]);
			path = oContext.sPath.split("/")[1];
            this.getModel("settingModel").oData.TextRuleResultExpressions.push(oContext.getModel().oData[path]);

            var businessDataType = {
                parts: [{
                    path: headerPath + "/BusinessDataType"
                }],
                formatter: function (BusinessDataType) {
                    return BusinessDataType;
                }
            };

            var sDataObjectAttributeName = {
                parts: [{
                    path: headerPath + "/DataObjectAttributeName"
                }],
                formatter: function (DataObjectAttributeName) {
                    return DataObjectAttributeName;
                }
            };

            sAccessMode = {
                parts: [{
                    path: headerPath + "/AccessMode"
                }],
                formatter: function (AccessMode) {
                    return AccessMode;
                }
            };

            if (sAccessMode == "Editable") {
                bVisible = true;
            } else if (sAccessMode == "Hidden") {
                bVisible = false;
            }

            var formElement = new FormElement({
                visible: bVisible,
                label: new Label({
                    text: sDataObjectAttributeName,
                    tooltip: sDataObjectAttributeName
                }),
                //layoutData: new sap.ui.layout.form.GridElementData({hCells: "2"})
                fields: [this._getExpressionAdvancedText(oContext, expression, businessDataType)]
                //layoutData: new sap.ui.layout.ResponsiveFlowLayoutData({linebreak: true, margin: false})
            });
            return formElement;
        },

        _getModel: function () {
            var modelName = this.getModelName();
            if (modelName) {
                return this.getModel(modelName);
            }
            return this.getModel();
        },

        _getBindModelName: function () {
            var path = "";
            var modelName = this.getModelName();
            if (modelName) {
                path = modelName + ">";
            }
            return path;
        },

        _getDataLoadedPromise: function () {
            if (!this._dataLoaded) {
                this._setDataLoadedPromise();
            }
            return this._dataLoaded.promise();
        },

        _getBlankContent: function () {
            var oLabelContent = new Label({
                text: this.oBundle.getText("startTextRule")
            });
            var oSpaceTextContent = new Text();

            oSpaceTextContent.setText("\u00a0");

            var oLinkToSettingsFromBlank = new Link({
                enabled: {
                    parts: [{
                        path: "TextRuleModel>/enableSettings"
                    }, {
                        path: "TextRuleModel>/editable"
                    }],
                    formatter: this._decideSettingsEnablement
                },
                text: " " + this.oBundle.getText("settings"),
                press: [this._openTextRuleSettings, this]
            }).addStyleClass("sapTextRuleLink");

            var oFlexBox = new FlexBox({
                justifyContent: "Center",
                items: [oLabelContent, oSpaceTextContent, oLinkToSettingsFromBlank],
                visible: {
                    parts: [{
                        path: "TextRuleModel>/enableSettings"
                    }, {
                        path: "TextRuleModel>/editable"
                    }],
                    formatter: this._decideSettingsEnablement
                }
            }).addStyleClass("sapUiMediumMargin");
            return oFlexBox;
        },

        _getExpressionAdvancedText: function (oContext, expression, businessDataType) {
            var that = this;
            var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
            var sType = businessDataType ? businessDataType : sap.rules.ui.ExpressionType.NonComparison;

            var oResult = that._getConvertedExpression(expression, false, oContext);
            var displayExpression = that._getExpressionFromParseResults(expression, oResult);

            return new ExpressionAdvanced({
                expressionLanguage: oExpressionLanguage,
                placeholder: this.oBundle.getText("expressionPlaceHolder"),
                validateOnLoad: true,
                type: sType,
                value: displayExpression,
                editable: "{TextRuleModel>/editable}",
                change: function (oEvent) {
                    var oSource = oEvent.getSource();
                    var oContext = oSource.getBindingContext();
                    var sPath = oContext.getPath()
                    var oResult = that._getConvertedExpression(oSource.getValue(), true, oContext);
                    // Transform to DT model and use
                    var expressionConverted = that._getExpressionFromParseResults(oSource.getValue(), oResult);
                    that._updateModelExpression(sPath, oContext, expressionConverted);
                }.bind(this)
            });
        },

        _updateModelExpression: function (sPath, oContext, expressionConverted) {
            oContext.getModel().setProperty(sPath + "/Expression", expressionConverted, oContext, true);
        },

        //TODO : Remove after Ast Implementation
        _getConvertedExpression: function (expression, isCodeText, oContext) {
            var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
            var oRuleData = this._formRuleData(oContext, expression);
            var oResult;
            if (isCodeText) {
                // Convert to code Text
                oResult = oExpressionLanguage.convertRuleToCodeValues(oRuleData);
            } else {
                // Convert to display Text
                oResult = oExpressionLanguage.convertRuleToDisplayValues(oRuleData);
            }
            return oResult;
        },

        // Add Decision table specific data for converting the data to code to display and viceVersa.
        _formRuleData: function (oContext, expression) {
            var bindingContext = this.getBindingContextPath();
            var rulePath = bindingContext.split("/")[2];
            var oRuleId = oContext.getProperty("RuleId");
            var oVersion = oContext.getProperty("Version");

            var oRuleData = jQuery.extend({}, this.getModel().oData);

            oRuleData = oRuleData[rulePath];

            if(!oRuleData){
                   oRuleData = {}; 
            }
            // Add dummy tags
            if (!oRuleData.DecisionTable) {
                oRuleData.DecisionTable = {};
            }

            oRuleData.Type = "DT";

            oRuleData.DecisionTable.metadata = {};
            // HardCoding values to DT because rule body validator and tags expects these tags
            oRuleData.DecisionTable.RuleID = oRuleId;
            oRuleData.DecisionTable.version = oVersion;
            oRuleData.DecisionTable.HitPolicy = "FM";

            // Add dummy tags
            oRuleData.DecisionTable.DecisionTableColumns = {};
            oRuleData.DecisionTable.DecisionTableColumns.results = [];
            oRuleData.DecisionTable.DecisionTableColumns.results.push({
                "metadata": {},
                "RuleId": oRuleId,
                "Id": 1,
                "Version": oVersion,
                "Sequence": 1,
                "Type": "CONDITION",
                "Condition": {
                    "metadata": {},
                    "RuleId": oRuleId,
                    "Id": 1,
                    "Version": oVersion,
                    "Expression": expression,
                    "Description": null,
                    "ValueOnly": false,
                    "FixedOperator": null
                },
                "Result": null
            });

            oRuleData.DecisionTable.DecisionTableRows = {};
            oRuleData.DecisionTable.DecisionTableRows.results = [];


            oRuleData.DecisionTable.DecisionTableColumnsCondition = {};
            oRuleData.DecisionTable.DecisionTableColumnsCondition.results = [];

            oRuleData.DecisionTable.DecisionTableColumnsResult = {};
            oRuleData.DecisionTable.DecisionTableColumnsResult.results = [];

            return oRuleData;
        },

        _getExpressionFromParseResults: function (expression, oResult) {
            if (oResult.output.decisionTableData.DecisionTable.DecisionTableColumns.results[0].Condition.parserResults.converted) {
                return oResult.output.decisionTableData.DecisionTable.DecisionTableColumns.results[0].Condition.parserResults.converted.Expression;
            } else {
                return expression;
            }
        },


        // rule
        _handleRuleDataRequested: function () {
            this._dataPartRequested(dataPartName.rule);
        },

        _handleRuleDataReceived: function (data) {
            if (data) {
                this._dataPartReceived(dataPartName.rule);
            }
        },

        _handleVerticalLayoutDataReceived: function (oEvent) {
            var data = oEvent.getParameter("data");
            if (!data) {
                return;
            }
            var oVerticalLayout = this.getAggregation("_verticalLayout");
            if (data.results && data.results.length == 0) {
                var blankContent = this._getBlankContent();
                oVerticalLayout.addContent(blankContent);
                this._internalModel.setProperty("/newTextRule", true);
            } else {
                this._internalModel.setProperty("/newTextRule", false);
            }
            this._dataPartReceived(dataPartName.verticalLayout);
        },

        // VerticalLayout
        _handleVerticalLayoutDataRequested: function (oEvent) {
            this._dataPartRequested(dataPartName.verticalLayout);
        },

        // vocabulary
        _handleVocabularyDataChanged: function (oEvent) {
            var data = oEvent.getParameter("data");
            if (data) {
                this._handleVocabularyDataReceived(data);
            } else {
                this._handleVocabularyDataRequested();
            }
        },

        _handleVocabularyDataRequested: function () {
            this._dataPartRequested(dataPartName.vocabulary);
        },

        _handleVocabularyDataReceived: function (data) {
            if (data) {
                this._dataPartReceived(dataPartName.vocabulary);
            }
        },

        _initDataReceieved: function () {
            var vocaDataReceived = false;
            var oEL = sap.ui.getCore().byId(this.getExpressionLanguage());
            if (oEL && oEL._isDataExist()) {
                vocaDataReceived = true;
            }
            this.dataReceived = {
                vocabulary: vocaDataReceived,
                rule: false,
                verticalLayout: false
            };
        },

        _initInternalModel: function () {
            var data = {};
            data.editable = this.getEditable();
            data.newTextRule = true;
            data.busyState = true;
            data.enableSettings = true;
            data.busyVerticalLayoutState = true;
            data.enableElse = false;
            this._internalModel = new sap.ui.model.json.JSONModel(data);
            this.setModel(this._internalModel, "TextRuleModel");
        },

        _initDisplayModel: function () {
            this._settingsModel = new sap.ui.model.json.JSONModel();
            this.setModel(this._settingsModel, "settingModel");
        },

        _isAllDataReceived: function () {
            var dataParts = this.dataReceived;
            return dataParts.rule && dataParts.verticalLayout && dataParts.vocabulary;
        },

        _openTextRuleSettings: function () {
            var textRuleSettings = this._createTextRuleSettings();
            var oDialog = new Dialog({
                contentWidth: "70%",
                title: this.oBundle.getText("textRuleSettings")
            });
            oDialog.addContent(textRuleSettings);
            var aButtons = textRuleSettings.getButtons(oDialog);
            for (var i = 0; i < aButtons.length; i++) {
                oDialog.addButton(aButtons[i]);
            }
            oDialog.attachBeforeClose(function (oData) {
                var dialogState = oDialog.getState();
                if (dialogState === sap.ui.core.ValueState.Success) {
                    this._initDisplayModel();
                    this._readTextRuleResults(true);
                }
                oDialog.destroy();
            }, this);
            oDialog.open();
        },

        _readTextRuleResults: function (isResetNeeded) {
            var that = this;
            var sPath = this.getBindingContextPath();
            var headerPath = [sPath, "/TextRule/TextRuleResults"].join("");
            var oModel = this._getModel();
            if (sPath && oModel) {
                oModel.read(headerPath, {
                    success: function (data) {
                        that.getModel("settingModel").oData.TextRuleResults = [];
						that.getModel("settingModel").oData.TextRuleResultExpressions = [];
                        if (isResetNeeded) {
                            var oEventBus = sap.ui.getCore().getEventBus();
                            oEventBus.publish("sap.ui.rules","refreshTextRuleModel");
                            that._resetControl();
                        }
                    },
                    error: function () {
                        console.log("Error reading TextRuleResults"); //TODO: Proper error message
                    }
                });
            }
        },

        _resetControl: function () {
            this._unbindRule();
            this._unbindVerticalLayout();
            this._initDataReceieved();
            this._updateBusyState();
			this._internalModel.setProperty("/enableElse", false);

            var oModel = this._getModel();
            var bindingContextPath = this.getBindingContextPath();
            if (!bindingContextPath || !oModel) {
                return;
            }
            var sString = bindingContextPath.split("'");
            this._settingsModel.oData.ProjectId = sString[1];
            this._settingsModel.oData.ProjectVersion = sString[3];
            this._settingsModel.oData.RuleId = sString[5];
            this._settingsModel.oData.RuleVersion = sString[7];
            this._settingsModel.oData.ruleBindingPath = bindingContextPath;
            this._settingsModel.oData.TextRuleResults = [];
			this._settingsModel.oData.TextRuleResultExpressions = [];

            var oContext = new sap.ui.model.Context(oModel, bindingContextPath);
            this.setBindingContext(oContext);

            this._bindRule();
            this._bindVerticalLayout();
        },

        _setDataLoadedPromise: function () {
            if (!this._dataLoaded || this._dataLoaded.state() !== "pending") {
                this._dataLoaded = new jQuery.Deferred();
            }
        },

        _updateBusyState: function () {
            var dataParts = this.dataReceived;
            var dataReceived = dataParts.rule && dataParts.verticalLayout && dataParts.vocabulary;
            var isBusy = !dataReceived;

            this._internalModel.setProperty("/busyState", isBusy);

            var VerticalLayoutIsBusy = !dataParts.verticalLayout; //change to formContainer
            this._internalModel.setProperty("/busyVerticalLayoutState", VerticalLayoutIsBusy);
        },

        _unbindRule: function () {
            this.unbindElement();
        },

        _unbindVerticalLayout: function () {
            var oVerticalLayout = this.getAggregation("_verticalLayout");
            oVerticalLayout.unbindAggregation("content");
        },

        _verticalLayoutFactory: function (sId, oContext) {
            var type = oContext.getProperty("Type");
            var title;
            switch (type) {
                case this.typeIf:
                    title = this.oBundle.getText("if");
                    return this._createFormLayout(sId, oContext, title);
                case this.typeElseIf:
                    title = this.oBundle.getText("elseIf");
                    this._internalModel.setProperty("/enableElseIf", true);
                    return this._createFormLayout(sId, oContext, title);
                case this.typeElse:
                    title = this.oBundle.getText("else");
                    this._internalModel.setProperty("/enableElse", true);
                    return this._createElseFormLayout(sId, oContext, title);
                default:
                    //ToDo:Proper message
                    break;
            }
            return null;
        },

        init: function () {
            this.oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
            this.typeIf = this.oBundle.getText("typeIf");
            this.typeElseIf = this.oBundle.getText("typeElseIf");
            this.typeElse = this.oBundle.getText("typeElse");
            this.resetContent = true;
            this._initInternalModel();
            this._initDataReceieved();
            this._initDisplayModel();
            this._addToolBar();
            this._addTextRuleControl();
        },

        onBeforeRendering: function () {
            this._readTextRuleResults(false);
            if (this.resetContent) {
                this._resetControl();
                this.resetContent = false;
            }
        },

        /** Control's properties getters/setters */

        setEnableSettings: function (value) {
            //value = true;
            this.setProperty("enableSettings", value, true);
            this._internalModel.setProperty("/enableSettings", value);
            return this;
        },

        setModelName: function (value) {
            this.setProperty("modelName", value);
            this.resetContent = true;
            return this;
        },

        setExpressionLanguage: function (value) {
            this.setAssociation("expressionLanguage", value, true);
            var expressionLanguage = (value instanceof Object) ? value : sap.ui.getCore().byId(value);
            if (!expressionLanguage) {
                return this;
            }
            // if panel has been built already - refresh it
            var oVerticalLayout = this.getAggregation("_verticalLayout");
            if (oVerticalLayout) {
                var contentBinding = oVerticalLayout.getBinding("content");
                if (contentBinding) {
                    contentBinding.refresh();
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

        setEditable: function (value) {
            this.setProperty("editable", value, true);
            this._internalModel.setProperty("/editable", value);
            return this;
        },

        setBindingContextPath: function (value) {
            var oldValue = this.getBindingContextPath();
            if (value && (oldValue !== value)) {
                this._unbindRule();
                this._unbindVerticalLayout();
                this._initDataReceieved();
                this.setProperty("bindingContextPath", value);
                this.resetContent = true;
            }
            return this;
        }

    });

    return TextRule;

}, /* bExport= */ true);
