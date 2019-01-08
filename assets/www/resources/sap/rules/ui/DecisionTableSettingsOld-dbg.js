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
        "sap/m/Table",
        "sap/m/Text",
        "sap/m/CheckBox",
        "sap/m/Input",
        "sap/m/Button",
        "sap/rules/ui/ExpressionAdvanced",
        "sap/ui/layout/VerticalLayout",
        "sap/rules/ui/type/Expression"
    ],
    function(jQuery, library, Control, SimpleForm, Label, Switch, Select, Table, Text, CheckBox, Input, Button, ExpressionAdvanced, VerticalLayout, ExpressionType) {
        "use strict";

        /**
         * Constructor for a new DecisionTableSettingsOld Control.
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
         * @alias sap.rules.ui.DecisionTableSettingsOld
         * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
         */
        var oDecisionTableSettingsOld = Control.extend("sap.rules.ui.DecisionTableSettingsOld", {
            metadata: {
                library: "sap.rules.ui",
                properties: {
                    // ruleFormat: {
                    //     type: "string",
                    //     defaultValue: sap.rules.ui.RuleFormat.Advanced
                    // },
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
                    }
                },
                aggregations: {
                    mainLayout:{
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

        sap.rules.ui.DecisionTableSettingsOld.prototype.init = function() {

            this.oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
            this.needCreateLayout = true;
            this.firstLoad = true;

            this.onsapescape = function(oEvent) {
                //	oEvent.preventDefault();
                oEvent.stopPropagation();
            };
            this._decisionTableHeaderSettingFormatter = new ExpressionType();
            this.setBusyIndicatorDelay(0);
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype.onBeforeRendering = function() {

            if (this.firstLoad) {
                this._initSettingsModel();

                if (this.getProperty("newDecisionTable") === true) {
                    this._prepareNewRuleWorkaround();
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

        // sap.rules.ui.DecisionTableSettingsOld.prototype.exit = function() {

        // };

        /**
         * Create DecisionTable structure for new rule
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._prepareNewRule = function() {

            var oModel = this._getModel();
            var oContext = this.getBindingContext();

            // rule's data
            var ruleFormat = sap.rules.ui.RuleFormat.Advanced; // TODO: take from configuration         
            oModel.setProperty("Type", sap.rules.ui.RuleType.DecisionTable, oContext, true);
            oModel.setProperty("RuleFormat", ruleFormat, oContext, true);
            var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
            var sExpressionLanguageVersion = oExpressionLanguage.getExpressionLanguageVersion();
            oModel.setProperty("ExpressionLanguageVersion", sExpressionLanguageVersion, oContext, true);

            // NOTE: "oData" and "params" objects are changed during execution by _createXYZ functions
            var oData = {
                ruleId:	oContext.getProperty("Id"),
                version: oContext.getProperty("Version")
            };

            var params = {
                //groupId: sap.rules.ui.ChangeId.DecisionTableColumns
            };

            // create DecisionTable
            this._createDecisionTable(oData, params);

            // create Condition Column
            oData.colId = 1;
            oData.expression = "";
            this._createCondition(oData, params);

            // create Result Parameters Columns
            oData.colId = 2;
            var addedColumns = this._createResult(oData, params);

            // create Decision Table Row
            oData.rowId = 1;
            oData.columnsNumber = 1 + addedColumns;
            this._createRow(oData, params);
        };

        /**
         * Add Decision Table to Rule if doesn't exist.
         * @param {object} oData - data for new DecisionTable
         * @param {string} oData.ruleId - rule's Id
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._createDecisionTable = function(oData, mParameters) {
            var oModel = this._getModel();
            var oContext = this.getBindingContext();

            var hitPolicy = this.getHitPolicies()[0];

            // if "DecisionTable" exists - update HitPolicy, otherwise create new DT entry
            if (oContext.getProperty("DecisionTable")) {
                oModel.setProperty("DecisionTable/HitPolicy", hitPolicy, oContext, true);
            } else {
                var oDecisionTableData = {
                    RuleId: oData.ruleId,
                    Version: oData.version,
                    HitPolicy: hitPolicy
                };

                mParameters = mParameters ? mParameters : {};
                mParameters.properties = oDecisionTableData;
                oModel.createEntry("/DecisionTables", mParameters);
            }
        };

        /**
         * Add new Row to Decision Table
         * @param {object} oData - data for new row
         * @param {string} oData.ruleId - rule's Id
         * @param {string} oData.rowId - row's Id
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._createRow = function(oData, mParameters) {

            mParameters = mParameters ? mParameters : {};

            var oModel = this._getModel();
            var oRowData = {
                RuleId: oData.ruleId,
                Version: oData.version,
                Id: oData.rowId
            };

            mParameters.properties = oRowData;
            oModel.createEntry("/DecisionTableRows", mParameters);

            this._createCellsForNewRow(oData, mParameters);
        };

        /**
         * Add new condition to Decision Table
         * @param {object} oData - data for new column
         * @param {string} oData.ruleId - rule's Id
         * @param {int} oData.colId - column Id for new column
         * @param {string} oData.expression - expression part for new column
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._createCondition = function(oData, mParameters) {

            mParameters = mParameters ? mParameters : {};

            var oModel = this._getModel();

            var oColumnData = {
                RuleId: oData.ruleId,
                Version: oData.version,
                Id: oData.colId,
                Type: sap.rules.ui.DecisionTableColumn.Condition
            };

            mParameters.properties = oColumnData;
            oModel.createEntry("/DecisionTableColumns", mParameters);

            var oConditionColumnData = {
                RuleId: oData.ruleId,
                Version: oData.version,
                Id: oData.colId,
                Expression: oData.expression,
                ValueOnly: false, // TODO: take from configuration
                FixedOperator: "",
                Description: ""
            };

            mParameters.properties = oConditionColumnData;
            oModel.createEntry("/DecisionTableColumnConditions", mParameters);
        };

        /**
         * Add cells to existing rows for new Column
         * @param {object} oData - data for new column
         * @param {string} oData.ruleId - rule's Id
         * @param {int} oData.colId - column Id for new column
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._createCellsForNewColumn = function(oData, mParameters) {

            mParameters = mParameters ? mParameters : {};

            var oModel = this._getModel();
            var oContext = this.getBindingContext();
            var rowKeys = oModel.getProperty("DecisionTable/DecisionTableRows", oContext);

            for (var i = 0; i < rowKeys.length; i++) {

                var rowId = oModel.getProperty("/" + rowKeys[i]).Id;

                var oCellData = {
                    RuleId: oData.ruleId,
                    Version: oData.version,
                    RowId: rowId,
                    ColId: oData.colId,
                    Content: ""
                };

                mParameters.properties = oCellData;
                oModel.createEntry("/DecisionTableRowCells", mParameters);
            }
        };

        /**
         * Add cells for existing columns for new Row
         * @param {object} oData - data for new column
         * @param {string} oData.ruleId - rule's Id
         * @param {int} oData.rowId - row Id of new row
         * @param {int} oData.columnsNumber - number of columns in DecisionTable
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._createCellsForNewRow = function(oData, mParameters) {

            mParameters = mParameters ? mParameters : {};

            var oModel = this._getModel();

            for (var colId = 1; colId <= oData.columnsNumber; colId++) {
                var oCellData = {
                    RuleId: oData.ruleId,
                    Version: oData.version,
                    RowId: oData.rowId,
                    ColId: colId,
                    Content: ""
                };

                mParameters.properties = oCellData;
                oModel.createEntry("/DecisionTableRowCells", mParameters);
            }
        };

        /**
         * Add new Result columns to Decision Table
         * @param {object} oData - data for new column
         * @param {string} oData.ruleId - rule's Id
         * @param {int} oData.colId - column Id for new column
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @returns {int} number of added columns
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._createResult = function(oData, mParameters) {

            var oContext = this.getBindingContext();

            // TODO: use ResultDataObjectId instead
            var resultName = oContext.getProperty("ResultDataObjectName");
            var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
            var resultInfo = oExpressionLanguage.getResultInfo(resultName);
            var resultParams = resultInfo ? resultInfo.requiredParams : [];
            var resultLength = resultParams.length;

            var colId = oData.colId;
            for (var i = 0; i < resultLength; i++) {
                oData.colId = colId + i;
                oData.resultParameterData = resultParams[i];
                this._createResultParameter(oData, mParameters);
            }

            return resultLength;
        };

        /**
         * Add new Result Parameter column to Decision Table
         * @param {object} oData - data for new column
         * @param {string} oData.ruleId - rule's Id
         * @param {int} oData.colId - column Id for new column
         * @param {object} oData.resultParameterData - data for result parameter column
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._createResultParameter = function(oData, mParameters) {

            mParameters = mParameters ? mParameters : {};

            var oModel = this._getModel();

            var oColumnData = {
                RuleId: oData.ruleId,
                Version: oData.version,
                Id: oData.colId,
                Type: sap.rules.ui.DecisionTableColumn.Result
            };

            mParameters.properties = oColumnData;
            oModel.createEntry("/DecisionTableColumns", mParameters);

            var oResultColumnData = {
                RuleId: oData.ruleId,
                Version: oData.version,
                Id: oData.colId,
                DataObjectAttributeName: oData.resultParameterData.name,
                // DataObjectAttributeId: oData.resultParameterData.id,
                DataObjectAttributeId: oData.resultParameterData.paramId,
                BusinessDataType: oData.resultParameterData.businessDataType
            };

            mParameters.properties = oResultColumnData;
            oModel.createEntry("/DecisionTableColumnResults", mParameters);

            //this._createCellsForNewColumn(ruleId, iColId, sChangeId);
        };

        /**
         * Remove column
         * @param {object} oColumnContext - context of column to remove
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._removeColumn = function(oColumnContext, mParameters) {
            var oModel = this._getModel();

            var columnPath = oColumnContext.getPath();
            oModel.remove(columnPath, mParameters);

            //var colId = oColumnContext.getProperty("Id");
            // this._removeCellsForColumn(colId, sChangeId);

            // remove fixedOperator data for deleted row (internal model)
            //var tableData = this._internalModel.setProperty("/tableData", {}, true);
            //delete tableData[colId];
            //this._updateRemoveRowEnabled();

            this._internalModel.setProperty("/tableData", {}, true);
        };

        /**
         * Remove cells from existing rows for deleted Column
         * @param {object} oData - data for new column
         * @param {string} oData.ruleId - rule's Id
         * @param {int} oData.colId - column Id for new column
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @param {string} mParameters.groupId? - groupId for changes on oDataModel
         * @param {function} mParameters.success? - success handler
         * @param {function} mParameters.error? - error handler
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._removeCellsForColumn = function(oData, mParameters) {
            var oModel = this._getModel();
            var oContext = this.getBindingContext();
            var rowKeys = oModel.getProperty("DecisionTable/DecisionTableRows", oContext);

            var columnIndex = oData.colId - 1;
            for (var i = 0; i < rowKeys.length; i++) {

                var rowCells = oModel.getProperty("/" + rowKeys[i] + "/Cells");
                var cellPath = "/" + rowCells[columnIndex];

                oModel.remove(cellPath, mParameters);
            }
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._createTable = function() {

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
                    // new sap.m.Column({
                    // 	width: "25%",
                    // 	header: new sap.m.Label({
                    // 		text: this.oBundle.getText("displayName")
                    // 	}).setTooltip(this.oBundle.getText("displayName"))
                    // }),
                    new sap.m.Column({
                        width: "30%",
                        header: new sap.m.Label({
                            text: this.oBundle.getText("fixedOperator"),
                            design: sap.m.LabelDesign.Bold
                        }).setTooltip(this.oBundle.getText("fixedOperator"))
                    }),
                    // new sap.m.Column({
                    // 	width: "15%",
                    // 	header: new sap.m.Label({
                    // 		text: this.oBundle.getText("valueOnly"),
                    // 		design: sap.m.LabelDesign.Bold
                    // 	}).setTooltip(this.oBundle.getText("valueOnly"))
                    // }),
                    new sap.m.Column({
                        width: "20%"
                    })
                ]
            }).data("hrf-id", "columnsTable", true);


            this.conditionsTable.bindItems({
                path: "DecisionTable/DecisionTableColumnsCondition",
                factory: this._tableColumnsFactory.bind(this),
                parameters: {
                    expand: "Condition"
                }
            });

            this.conditionsTable.setBusyIndicatorDelay(0);

            return this.conditionsTable;
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._createLayout = function() {
            var oForm = new SimpleForm({
                editable: true,
                layout: "ResponsiveGridLayout",
                maxContainerCols: 1,
                columnsL: 1,
                columnsM: 1,
                labelSpanM: 1,
                content: [
                    // new Label({
                    // 	text: this.oBundle.getText("advancedMode")
                    // }).setTooltip(this.oBundle.getText("advancedMode")),
                    // new CheckBox({
                    // 	selected: {
                    // 		path: "RuleFormat",
                    // 		formatter: Formatter.ruleFormatAsBoolean
                    // 	},
                    // 	enabled: "{maModel>/advancedMode/enabled}",
                    // 	visible: "{settingsModel>/advancedMode/visible}",
                    // 	select: this._setAdvancedMode.bind(this)
                    // }),

                    new Label({
                        text: this.oBundle.getText("hitPolicy")
                    }).setTooltip(this.oBundle.getText("hitPolicy")),
                    new Select({
                        width: "25%",
                        enabled: "{settingsModel>/hitPolicy/enabled}",
                        items: {
                            path: "settingsModel>/hitPolicy/hitPolicyEnumration",
                            template: new sap.ui.core.Item({
                                key: "{settingsModel>key}",
                                text: "{settingsModel>text}"
                            })
                        },
                        selectedKey: "{DecisionTable/HitPolicy}"
                    }),

                    new Label(),
                    this._createTable(),

                    new Label({
                        text: this.oBundle.getText("ouput")
                    }).setTooltip(this.oBundle.getText("ouput")),
                    new Text({
                        width: "25%",
                        text: "{ResultDataObjectName}"
                    })
                ]
            });

            return oForm;
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._setFixedOperatorOnExpressionChange = function(displayExpression, colId) {
            var oFixedOperatorData = this._getFixedOperatorDataForExpression(displayExpression);
            this._internalModel.setProperty("/tableData/" + colId, oFixedOperatorData, true);
            this._updateRemoveRowEnabled();
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype.setExpressionLanguage = function (oExpressionLanguage){
            this.setAssociation("expressionLanguage", oExpressionLanguage, true);
            this._decisionTableHeaderSettingFormatter.setExpressionLanguage(oExpressionLanguage);
        };
        sap.rules.ui.DecisionTableSettingsOld.prototype._getColumnControlObject = function(oBindingContext) {
            var mode = this._internalModel.getProperty("/advancedMode/current");
            if (mode === sap.rules.ui.RuleFormat.Advanced) {
                var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());

                return new ExpressionAdvanced({
                    expressionLanguage: oExpressionLanguage,
                    placeholder: this.oBundle.getText("expressionPlaceHolder"),
                    validateOnLoad: true,
                    type : sap.rules.ui.ExpressionType.NonComparison,
                    value: {
                        path: "Condition/Expression",
                        type: this._decisionTableHeaderSettingFormatter,
                        events: {
                            change: function(oEvent) {
                                var oSource = oEvent.getSource();
                                var oContext = oSource.getContext();
                                var colId = oContext.getProperty("Id");
                                
                                //Workaround to fix RULES-4723
							      var result = oExpressionLanguage.convertDecisionTableExpressionToDisplayValue(oSource.getValue(), "", "", sap.rules.ui.ExpressionType.All);
							      var value;
							      if (result.output.status === "Success" && result.output.converted) {
									value = result.output.converted.header;
								  } else {
									value = oSource.getValue(); 
								  } 
								  
							      this._setFixedOperatorOnExpressionChange(value, colId);
                            }.bind(this)
                        }
                    },
                    enabled: true,
                    change: function(oEvent) {
                        var oSource = oEvent.getSource();
                        var oContext = oSource.getBindingContext();
                        var colId = oContext.getProperty("Id");
                        this._setFixedOperatorOnExpressionChange(oSource.getValue(), colId);

                        // clear previous fixed operator if expression is empty
                        var expression = oContext.getProperty("Condition/Expression");
                        if (!expression) {
                            var model = oContext.getModel();
                            model.setProperty(oContext.getPath() + "/Condition/FixedOperator", "");
                        }
                    }.bind(this)
                });
            } else {
                return new Select({
                    width: "100%",
                    items: {
                        path: "",
                        template: new sap.ui.core.Item({
                            key: "",
                            text: ""
                        })
                    },
                    selectedKey: "{Condition/Expression}",
                    enabled: true,
                    change: function(oControlEvent) {

                    }
                });
            }
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._tableColumnsFactory = function(sId, oContext) {
            var ruleId = oContext.getProperty("RuleId");
            var version = oContext.getProperty("Version");
            var colId = oContext.getProperty("Id");

            return new sap.m.ColumnListItem({
                cells: [
                    this._getColumnControlObject(oContext),
                    // new sap.m.Input({
                    // 	value: "{Condition/Description}",
                    // 	placeholder: this.oBundle.getText("displayNamePlaceHolder")
                    // }),
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
                        enabled: "{settingsModel>/tableData/" + colId + "/fixOperatorEnabled}"
                    }),
                    // new sap.m.Switch({
                    // 	state: "{Condition/ValueOnly}",
                    // 	enabled: false
                    // }),
                    new sap.ui.layout.HorizontalLayout({
                        content: [
                            new sap.m.Button({
                                type: sap.m.ButtonType.Transparent,
                                icon: sap.ui.core.IconPool.getIconURI("sys-cancel"),
                                visible: "{settingsModel>/removeRowEnabled}",
                                press: function(oEvent) {
                                    var oColumnContext = oEvent.getSource().getBindingContext();
                                    var params = {
                                        //groupId: sap.rules.ui.ChangeId.DecisionTableColumns
                                    };
                                    this._removeColumnWorkaround(oColumnContext, params);
                                }.bind(this)
                            }).setTooltip(this.oBundle.getText("removeColumn")),
                            new sap.m.Button({
                                type: sap.m.ButtonType.Transparent,
                                icon: sap.ui.core.IconPool.getIconURI("add"),
                                press: function(oEvent) {
                                    var oData = {
                                        ruleId:	ruleId,
                                        version: version,
                                        colId: colId + 1,
                                        expression: ""
                                    };
                                    var params = {
                                        //groupId: sap.rules.ui.ChangeId.DecisionTableColumns
                                    };
                                    this._addConditionWorkaround(oData, params);
                                }.bind(this)
                            }).setTooltip(this.oBundle.getText("addColumn"))
                        ],
                        height: "1em"
                    })
                ]
            });
        };

        /**
         * Create DecisionTable structure for new rule
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._prepareNewRuleWorkaround = function() {
            this._prepareNewRule();
            this._saveWorkaround();
        };

        /**
         * Add new condition to Decision Table
         * @param {object} oData - data for new column
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._addConditionWorkaround = function(oData, mParameters) {

            this._createCondition(oData, mParameters);
            this._saveWorkaround();
        };

        /**
         * Remove column
         * @param {object} oColumnContext - context of column to remove
         * @param {map} mParameters? - Optional parameter map containing any of the following properties:
         * @private
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._removeColumnWorkaround = function(oColumnContext, mParameters) {
            var oModel = this._getModel();

            if (oModel.hasPendingChanges()) {
                // save all model's changes before row removal
                this._saveWorkaround({
                    success: function() {
                        this._removeColumn(oColumnContext, mParameters);
                    }.bind(this)
                });
            } else {
                this._removeColumn(oColumnContext, mParameters);
            }
        };

        /**
         * @private
         *  @param {map} mParameters? - Optional parameter map containing any of the following properties:
         */
        sap.rules.ui.DecisionTableSettingsOld.prototype._saveWorkaround = function(mParameters) {
            var oModel = this._getModel();
            oModel.submitChanges(mParameters);
        };


        sap.rules.ui.DecisionTableSettingsOld.prototype._getModel = function() {
            var modelName = this.getModelName();
            if (modelName) {
                return this.getModel(modelName);
            }
            return this.getModel();
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._getBindModelName = function() {
            var path = "";
            var modelName = this.getModelName();

            if (modelName) {
                path = modelName + ">";
            }

            return path;
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._initSettingsModel = function() {
            var initialData = {};

            initialData.advancedMode = this._getAdvancedModeData();
            initialData.hitPolicy = this._getHitPoliciesData();
            initialData.tableData = {};
            initialData.removeRowEnabled = false;

            this._internalModel = new sap.ui.model.json.JSONModel(initialData);
            this.setModel(this._internalModel, "settingsModel");
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._getAdvancedModeData = function() {
            var mode;
            var advancedModeData = {};

            // Check rule's Format from rule's data - it is stronger then configuration property
            var oContext = this.getBindingContext();
            var ruleFormat = oContext.getProperty("RuleFormat");

            if (ruleFormat === sap.rules.ui.RuleFormat.Advanced) {
                mode = sap.rules.ui.RuleFormat.Advanced;
            } else {
                mode = sap.rules.ui.RuleFormat.Advanced; // TODO: should be: this.getRuleFormat();
            }

            switch (mode) {
                case sap.rules.ui.RuleFormat.All:
                    advancedModeData = {
                        current: sap.rules.ui.RuleFormat.Basic,
                        enabled: true,
                        visible: true
                    };
                    break;

                case sap.rules.ui.RuleFormat.Basic:
                    advancedModeData = {
                        current: sap.rules.ui.RuleFormat.Basic,
                        enabled: false,
                        visible: false
                    };
                    break;

                case sap.rules.ui.RuleFormat.Advanced:
                    advancedModeData = {
                        current: sap.rules.ui.RuleFormat.Advanced,
                        enabled: false,
                        visible: true
                    };

                    break;

                default:
            }
            return advancedModeData;
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._getHitPoliciesData = function() {
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

        sap.rules.ui.DecisionTableSettingsOld.prototype._getFixedOperatorDataForExpression = function(sExpression) {
            var fixOperatorEnabled = sExpression ? true : false;
            var fixedOperatiorData = {
                fixOperatorEnumration: [{
                    key: "",
                    value: this.oBundle.getText("fixOperatorDefaultValue")
                }],
                fixOperatorEnabled: fixOperatorEnabled
            };

            if (fixOperatorEnabled) {
                var oSuggestions = [];
                var oExpressionLanguage = sap.ui.getCore().byId(this.getExpressionLanguage());
                var oFilter = [{
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.comparisonOp
                }, {
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.comparisonBetweenOp
                }, {
                    tokenType: sap.rules.ui.ExpressionTokenType.reservedWord,
                    tokenCategory: sap.rules.ui.ExpressionCategory.comparisonExistOp
                }];
                oSuggestions = oExpressionLanguage.getSuggestionsByCategories(sExpression, oFilter);
                for (var i = 0; i < oSuggestions.length; i++) {
                    fixedOperatiorData.fixOperatorEnumration.push({
                        key: oSuggestions[i].text,
                        value: oSuggestions[i].text
                    });
                }
            }
            return fixedOperatiorData;
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._setAdvancedMode = function(oControlEvent) {
            var bAdvancedModeStatus = oControlEvent.getParameter("selected");
            var ruleFormat = bAdvancedModeStatus ? sap.rules.ui.RuleFormat.Advanced : sap.rules.ui.RuleFormat.Basic;

            var oRuleModel = this._getModel();
            var oContextPath = this.getBindingContext().getPath();
            oRuleModel.setProperty(oContextPath + "/RuleFormat", ruleFormat);

            this.needCreateLayout = true;
            this.invalidate();
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype._updateRemoveRowEnabled = function() {
            var tableData = this._internalModel.getProperty("/tableData");
            var len = Object.keys(tableData).length;
            var enabled = len > 1;
            this._internalModel.setProperty("/removeRowEnabled", enabled, null, true);
        };

        sap.rules.ui.DecisionTableSettingsOld.prototype.getButtons = function(oDialog) {
            
            var aButtons = [];

            //Add apply button
            var oApplyButton = new Button({
                text: this.oBundle.getText("applyChangesBtn")
            }).setTooltip(this.oBundle.getText("applyChangesBtn"));

            oApplyButton.attachPress(function() {

                //flag for calculate only once header span for multi header in columnFactory function
                this.multiHeaderFlag = false;

                // Workaround: we submit changes, because if we change a cell and then open this dialog and close it,
                // the cell display value will not be the same as the cell value when in-focus
                this.getModel().submitChanges();
                
                //For attachBeforeClose in decisionTable file
                oDialog.setState(sap.ui.core.ValueState.Success);

                oDialog.close();
                
            }, this);

            aButtons.push(oApplyButton);
            
            return aButtons;
        };

        return oDecisionTableSettingsOld;

    }, /* bExport= */ true);