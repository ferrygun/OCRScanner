/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2016 SAP SE. All rights reserved
	
 */

// Provides control sap.rules.ui.
sap.ui.define([
    "jquery.sap.global",
    "./library",
    "sap/ui/core/Control",
    "sap/m/Select",
    "sap/ui/core/Item",
    "sap/rules/ui/DecisionTable",
    "sap/rules/ui/DecisionTableConfiguration",
    "sap/rules/ui/TextRuleConfiguration",
    "sap/rules/ui/RuleType",
    "sap/rules/ui/RuleFormat",
    "sap/rules/ui/TextRule"
], function (jQuery, library, Control, Select, Item, DecisionTable, DecisionTableConfiguration, TextRuleConfiguration , RuleType, RuleFormat ,TextRule) {
    "use strict";

    /**
     * Constructor for a new RuleBuilder control.
     *
     * @param {string} [sId] ID for the new control, generated automatically if no ID is given.
     * @param {object} [mSettings] Initial settings for the new control.
     *
     * @class
     * The <code>sap.rules.ui.RuleBuilder</code> control allows business users to create rules using a business language.
     * @extends  Control
     *
     * @author SAP SE
     * @version 1.52.8
     *
     * @constructor
     * @public
     * @alias sap.rules.ui.RuleBuilder
     * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
     *
     */
    var oRuleBuilder = Control.extend("sap.rules.ui.RuleBuilder", {
        metadata: {
            library: "sap.rules.ui",
            properties: {
                /**
                 * Available types that can be created using the <code>sap.rules.ui.RuleBuilder</code> control.
                 * If empty, all rule types will be available for selection.
                 * If only one type exists, the Rule Builder will open it automatically.
                 */
                types: {
                    type: "sap.rules.ui.RuleType[]",
                    defaultValue: [sap.rules.ui.RuleType.DecisionTable, sap.rules.ui.RuleType.TextRule ]
                },
                /**
                 * Name of the rule's ODataModel (optional).
                 * The ODataModel object belongs to the application and should be set by the application.
                 * Example:
                 * <pre class="javascript">
                 *     var oModel = new sap.ui.model.v2.oDataModel();
                 *     var ruleBuilder = new RuleBuilder({
				 *          modelName: "rulesModel"
				 *     });
                 *     ruleBuilder.setModel(oModel, "rulesModel")
                 * </pre>
                 */
                // modelName: {
                // 	type: "string",
                // 	group: "Misc",
                // },
                /**
                 * Path to a Rule object in the model data, which is used for the definition of relative context bindings inside the RuleBuilder control (mandatory).
                 * Example: "/Rules(Id='0050569181751ED683EFEEC6AA2B73C5',Version='000001')"
                 */
                bindingContextPath: {
                    type: "string",
                    group: "Misc"
                },
                /**
                 * Indicates whether or not the controls of the RuleBuilder are editable.
                 */
                editable: {
                    type: "boolean",
                    defaultValue: true
                }
            },
            aggregations: {
                /**
                 * Provides a combo box from which the user selects the rule type for the new rule. Only relevant if <b>types</b> contains more than one value.
                 * @private
                 */
                _ruleTypeSelector: {
                    type: "sap.m.ComboBox",
                    multiple: false,
                    singularName: "_ruleTypeSelector",
                    visibility: "hidden"
                },
                /**
                 * Rule created by the Rule Builder.
                 * @private
                 */
                _rule: {
                    type: "sap.rules.ui.RuleBase",
                    multiple: false,
                    singularName: "_rule",
                    visibility: "hidden"
                },
                /**
                 * Configuration for rule of type 'decision table'.
                 */
                decisionTableConfiguration: {
                    type: "sap.rules.ui.DecisionTableConfiguration",
                    multiple: false,
                    singularName: "decisionTableConfiguration"
                },
                /**
                 * Configuration for rule of type 'Text Rule'.
                 */
                textRuleConfiguration: {
                    type: "sap.rules.ui.TextRuleConfiguration",
                    multiple: false,
                    singularName: "textRuleConfiguration"
                }
                
            },
            /**
             * Association to the expression language element.
             */
            associations: {
                "expressionLanguage": {
                    type: "sap.rules.ui.services.ExpressionLanguage",
                    multiple: false,
                    singularName: "expressionLanguage"
                }
            },

            events: {
                // "controlReady": {},
                // "ruleBodyChange": {},
                // "ruleBodyLiveChange": {},
                // "displayModeSelected": {}
            }
        },

        init: function () {
            this.oBundle = sap.ui.getCore().getLibraryResourceBundle("sap.rules.ui.i18n");
            this.needCreateDisplayedControl = true;

            this.needRebind = true;

            this._internalModel = this._initInternalModel();
            this.setModel(this._internalModel, "ruleBuilderInternalModel");
        },

        validate: function () {
            var oRule = this.getAggregation("_rule");
            if (oRule) {
                oRule.validate();
            }
        },

        _initInternalModel: function () {
            var data = {
                types: this.getTypes(),
                //modelName: this.getModelName(),
                bindingContextPath: this.getBindingContextPath(),
                editable: this.getEditable(),
                decisionTableConfiguration: {},
                textRuleConfiguration: {}
            };
            var oModel = new sap.ui.model.json.JSONModel();
            oModel.setData(data);
            return oModel;
        },

        _getModel: function () {
            // var modelName = this.getModelName();
            // if (modelName) {
            //     return this.getModel(modelName);
            // }
            return this.getModel();
        },

        _setBindingContext: function () {
            var bindingContextPath = this.getBindingContextPath();
            var model = this._getModel();

            var oContext = new sap.ui.model.Context(model, bindingContextPath);
            this.setBindingContext(oContext);
        },

        _createRuleset: function () {
            return null;
        },

        _createTextRule: function () {        	
            // get DT configuration object, or create it if it doesn't exists
            var oTextRuleConfiguration = this.getTextRuleConfiguration();
            if (!oTextRuleConfiguration) {
                oTextRuleConfiguration = new sap.rules.ui.TextRuleConfiguration();
                this.setTextRuleConfiguration(oTextRuleConfiguration);
            }
            ;
            
            var oTextRule = new sap.rules.ui.TextRule({
                bindingContextPath: {path: "ruleBuilderInternalModel>/bindingContextPath"},
                modelName: {path: "ruleBuilderInternalModel>/modelName"},
                editable: {path: "ruleBuilderInternalModel>/editable"},
                enableSettings: {path: "ruleBuilderInternalModel>/textRuleConfiguration/enableSettings"},
                expressionLanguage: this.getExpressionLanguage()
            });
            return oTextRule;
        },

        _createDecisionTable: function () {
            // get DT configuration object, or create it if it doesn't exists
            var oDecisionTableConfiguration = this.getDecisionTableConfiguration();
            if (!oDecisionTableConfiguration) {
                oDecisionTableConfiguration = new sap.rules.ui.DecisionTableConfiguration();
                this.setDecisionTableConfiguration(oDecisionTableConfiguration);
            }
            ;
            // create DT
            var oDT = new sap.rules.ui.DecisionTable({
                bindingContextPath: {path: "ruleBuilderInternalModel>/bindingContextPath"},
                modelName: {path: "ruleBuilderInternalModel>/modelName"},
                editable: {path: "ruleBuilderInternalModel>/editable"},
                cellFormat: {path: "ruleBuilderInternalModel>/decisionTableConfiguration/cellFormat"},
                enableSettings: {path: "ruleBuilderInternalModel>/decisionTableConfiguration/enableSettings"},
                hitPolicies: {path: "ruleBuilderInternalModel>/decisionTableConfiguration/hitPolicies"},
                decisionTableFormat: {path: "ruleBuilderInternalModel>/decisionTableConfiguration/decisionTableFormat"},
                expressionLanguage: this.getExpressionLanguage()
                
            });
            return oDT;
        },

        _createDisplayedControl: function (sDisplayedControlType) {
            var oDisplayedControl;
            switch (sDisplayedControlType) {
                case sap.rules.ui.RuleType.DecisionTable:
                    oDisplayedControl = this._createDecisionTable();
                    break;
                case "sap.rules.ui.RuleType.Ruleset":
                    oDisplayedControl = this._createRuleset();
                    break;
                case sap.rules.ui.RuleType.TextRule:
                    oDisplayedControl = this._createTextRule();
                    break;
                default:
                    break;
            }
            ;
            this.setAggregation("_rule", oDisplayedControl, true);
        },

        _createRuleTypeSelector: function () {
            /*eslint consistent-this: ["error", "me"]*/
            var me = this;

            this.oBundle.getText('decisionTable');

            var oRuleTypesModel = new sap.ui.model.json.JSONModel({
                items: [{
                    key: sap.rules.ui.RuleType.DecisionTable,
                    text: this.oBundle.getText('decisionTable')
                }]
            });

            var oRuleTypeSelector = new sap.m.ComboBox({
                width: "25%",
                items: {
                    path: 'ruleTypes>/items',
                    template: new sap.ui.core.Item({
                        text: "{ruleTypes>text}",
                        key: "{ruleTypes>key}"
                    })
                },
                change: function (oEvent) {
                    var sRuleType = oEvent.getSource().getSelectedKey();
                    me._createDisplayedControl.call(me, sRuleType);
                }
            }).setModel(oRuleTypesModel, "ruleTypes");

            this.setAggregation("_ruleTypeSelector", oRuleTypeSelector, true);
        },

        // _getRuleType: function () {
        // 	var sRuleType;
        // 	var model = this.getModel();
        // 	if (model) {
        // 		var data = model.getData();
        // 		sRuleType = data.type;
        // 	}
        // 	if (!sRuleType) {
        // 		var aRuleType = this.getTypes();
        // 		if (aRuleTypes.length === 1) {
        // 			sRuleType = aRuleTypes[0];
        // 		}
        // 	}
        // 	return sRuleType;
        // },


        // setTypes: function(aTypes) {
        //     //filter unique values
        //     var aUniqueTypes = aTypes.filter( function onlyUnique(value, index, self) { 
        //         return self.indexOf(value) === index;
        //     });
        //     this.setProperty("types", aUniqueTypes);
        //     return this;
        // },

        setEditable: function (value) {
            this._internalModel.setProperty("/editable", value);
            return this.setProperty("editable", value, true);
        },
        setBindingContextPath: function (value) {
            this.needRebind = true;
            this._internalModel.setProperty("/bindingContextPath", value);
            return this.setProperty("bindingContextPath", value);
        },
        setModelName: function (value) {
            this.needRebind = true;
            this._internalModel.setProperty("/modelName", value);
            return this.setProperty("modelName", value);
        },
        
        _setTextRuleConfigurationProperty: function (propertyName, value) {
            var sPath = "/textRuleConfiguration/" + propertyName;
            this._internalModel.setProperty(sPath, value);
        },

        setTextRuleConfiguration: function (oTextRuleConfiguration) {
            oTextRuleConfiguration.attachChange(function (oEvent) {
                this.getParent()._setTextRuleConfigurationProperty.call(this.getParent(), oEvent.getParameter("name"), oEvent.getParameter("value"))
            });

            this._setTextRuleConfigurationProperty("enableSettings", oTextRuleConfiguration.getEnableSettings());

            return this.setAggregation("textRuleConfiguration", oTextRuleConfiguration, true)
        },

        _setDecisionTableConfigurationProperty: function (propertyName, value) {
            var sPath = "/decisionTableConfiguration/" + propertyName;
            this._internalModel.setProperty(sPath, value);
        },

        setDecisionTableConfiguration: function (oDecisionTableConfiguration) {
            oDecisionTableConfiguration.attachChange(function (oEvent) {
                this.getParent()._setDecisionTableConfigurationProperty.call(this.getParent(), oEvent.getParameter("name"), oEvent.getParameter("value"))
            });

            this._setDecisionTableConfigurationProperty("enableSettings", oDecisionTableConfiguration.getEnableSettings());
            this._setDecisionTableConfigurationProperty("hitPolicies", oDecisionTableConfiguration.getHitPolicies());
            this._setDecisionTableConfigurationProperty("cellFormat", oDecisionTableConfiguration.getCellFormat());
            this._setDecisionTableConfigurationProperty("decisionTableFormat", oDecisionTableConfiguration.getDecisionTableFormat());

            return this.setAggregation("decisionTableConfiguration", oDecisionTableConfiguration, true)
        },

        setExpressionLanguage: function (oExpressionLanguage) {
            var oRule = this.getAggregation("_rule");
            if (oRule) {
                oRule.setExpressionLanguage(oExpressionLanguage);
            }
            return this.setAssociation("expressionLanguage", oExpressionLanguage, true);
        },

        onBeforeRendering: function () {
            if (this.needRebind) {
                //this._setBindingContext();

                if (this.needCreateDisplayedControl) {

                    var oRuleTypes = this.getTypes();
                    // if (oRuleTypes.length > 1) {
                    //     this._createRuleTypeSelector();
                    // } else 
                    if (oRuleTypes.length === 1) {
                        this._createDisplayedControl(oRuleTypes[0]);
                        this.needCreateDisplayedControl = false;
                    }
                }
                this.needRebind = false;
            }
        }

    });

    return oRuleBuilder;

}, /* bExport= */ true);