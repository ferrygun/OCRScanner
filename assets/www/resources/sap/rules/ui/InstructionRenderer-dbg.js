sap.ui.define([
    "sap/ui/core/Control",
    "sap/ui/core/Item",
    "sap/ui/core/ValueState",
    "sap/m/Select",
    "sap/m/Input",
    "sap/m/Button",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/m/Text",
    "sap/m/DatePicker",
    "sap/ui/model/type/Float",
    "sap/ui/model/type/Date",
    "sap/ui/model/type/Time",
    "sap/ui/model/type/DateTime",
    "sap/ui/core/HTML",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "./Utils",
    "sap/m/DateTimePicker",
    "sap/m/TimePicker",
    "sap/rules/ui/providers/ValueHelpProvider",
    "sap/ui/core/LocaleData"
], function(Control, CoreItem, ValueState, Select, Input, Button, SelectDialog, StandardListItem, Text, DatePicker,
    TypeFloat, TypeDate, TypeTime, TypeDateTime, HTML, JSONModel, Filter, FilterOperator, Utils, DateTimePicker,
    TimePicker, ValueHelpProvider, LocaleData) {
    "use strict";

    return Control.extend("sap.rules.ui.InstructionRenderer", {
        metadata: {
            properties: {
                instructions: {
                    type: "any"
                }
                /**
                 * expose this property to allow indent of controls in each line
                 * following a logical operator
                 * **/
                //useIndent: {type:"boolean", defaultValue: false}
            },
            aggregations: {
                _content: {
                    type: "sap.ui.core.Control",
                    multiple: true,
                    visibility: "hidden"
                }
            },
            events: {
                "change": {}
            },
            publicMethods: [
                "getTokensAndTexts",
                "getExpression"
            ]
        },

        init: function() {
            this.INTERNAL_MODEL = "internal";
            this.TOKEN = "token";
            this.TEXT = "text";
            this.MODEL_INSTRUCTIONS = "/instructions";
            this.LINE_GAP_CLASS = "sapUiSmallMarginTop";
            this.TOKENS_GAP_CLASS = "sapUiTinyMarginEnd";

            // illegal characters handling
            var ILLEGAL_CHARS = "'";
            var OPTIONAL_WRAPPING_CHAR = "'";
            this.VALIDATION_REGEX =
                "^[" + OPTIONAL_WRAPPING_CHAR + "][^" + ILLEGAL_CHARS + "]*[" + OPTIONAL_WRAPPING_CHAR + "]$" +
                "|" +
                "^[^" + ILLEGAL_CHARS + "]*$";

            this.lineBreakIndexes = { // auxiliary rendering data to support 
                start: {}, // lines breaking in indent mode
                end: {}
            };

            //this.oBundle = Utils.resourceBundle.getInstance();

            this._internalModel = new JSONModel({
                instructions: []
            });
            this._internalModel.setSizeLimit(300);

            this.setModel(this._internalModel, this.INTERNAL_MODEL);
        },

        setInstructions: function(aInstructions) {
            this.setProperty("instructions", aInstructions);

            this.destroyAggregation("_content");

            if (!aInstructions || !aInstructions.length) {
                aInstructions = [];
            }

            this.getModel(this.INTERNAL_MODEL).setProperty(this.MODEL_INSTRUCTIONS, aInstructions);
        },

        setUseIndent: function(bUseIndent) {
            this.setProperty("useIndent", bUseIndent, true);
            this.destroyAggregation("_content");
        },

        onBeforeRendering: function() {
            var controls = this.getAggregation("_content");
            if (!controls) {
                var instructions = this._internalModel.getProperty(this.MODEL_INSTRUCTIONS);

                if (!instructions) {
                    return;
                }

                try {
                    var controlsToAdd = this._createControls(instructions);

                    for (var i = 0, len = controlsToAdd.length; i < len; ++i) {
                        this.addAggregation("_content", controlsToAdd[i], true);
                    }
                } catch (message) {
                    //this._showErrorMessage(message);
                    console.error(message);
                }

            }
        },

        renderer: function(oRM, oControl) {
            oRM.write("<div class='sapUiSizeCompact' ");
            oRM.writeControlData(oControl);
            oRM.write(">");

            var controls = oControl.getAggregation("_content");
            if (controls) {
                if (oControl._getIndent()) {
                    oRM.write(oControl._getTableStart());
                }

                for (var i = 0, len = controls.length; i < len; ++i) {

                    var isLineBreakStart = oControl.lineBreakIndexes.start[i];
                    var isLineBreakEnd = oControl.lineBreakIndexes.end[i];

                    if (isLineBreakStart && oControl._getIndent()) {
                        oRM.write(oControl._getLogicalOperatorStart());
                    }

                    oRM.renderControl(controls[i]);

                    if (isLineBreakEnd && oControl._getIndent()) {
                        oRM.write(oControl._getLogicalOperatorEnd());
                    }
                }

                if (oControl._getIndent()) {
                    oRM.write(oControl._getTableEnd());
                }
            }

            oRM.write("</div>");
        },

        /**
         * @returns {array} a list of {token, text}
         * **/
        getTokensAndTexts: function() {
            var tokensAndTexts = [];
            var instructions = this._internalModel.getProperty(this.MODEL_INSTRUCTIONS);

            for (var i = 0, len = instructions.length; i < len; ++i) {
                var instruction = instructions[i];
                var tokensAndText = {
                    text: instruction[this.TEXT],
                    token: instruction[this.TOKEN]
                };
                tokensAndTexts.push(tokensAndText);
            }

            return tokensAndTexts;
        },

        /**
         * @returns {string} a concatenated string of space separated tokens 
         * **/
        getExpression: function() {
            var expression = [];
            var instructions = this._internalModel.getProperty(this.MODEL_INSTRUCTIONS);

            for (var i = 0, len = instructions.length; i < len; ++i) {
                var instruction = instructions[i];
                var token = instruction[this.TOKEN];
                expression.push(token);
            }
            var tokenExpression = instructions[instructions.length - 1].token;
            
            if (!tokenExpression && tokenExpression !== 0) {
                expression.pop(instructions.length - 1);
            }
            return expression.join(" ");
        },

        _onChange: function(oControlEvent) {

            var instructionNum = oControlEvent.getSource().data("instructionNum");

            this.fireEvent("change", {
                instructionNum: instructionNum
            });
        },

        _createControls: function(instructions) {
            this.lineBreakIndexes = {
                start: {},
                end: {}
            };
            var controls = [];
            var createFunctions = [];
            var i, len;
            var instruction;
            var createFunction;
            var nextCreateFunction;

            // step 1: construct a list of the functions to create the controls:
            for (i = 0, len = instructions.length; i < len; ++i) {

                instruction = instructions[i];

                createFunction = this._getCreateFunction(instruction);

                // invalid instruction: render nothing
                if (createFunction === null) {

                    // this replace() workaround is because of incorrect replacement in the case:
                    // string: ...{0}...'{1}'
                    // usage: this.oBundle.getText(<key>, ["val1", "val2"])
                    // result: ...val1...{1}
                    // (parameter with quotes not replaced correctly)
                    var message = " "; //this.oBundle.getText("ERROR_IN_RENDERING_INSTRUCTIONS")
                    //.replace("{0}", i+1);

                    this._showErrorMessage(message);
                    createFunctions = [];
                    break;
                }

                createFunctions.push(createFunction);
            }

            // step 2: run each function in turn to create (one of more) control(s)
            for (i = 0, len = createFunctions.length; i < len; ++i) {
                instruction = instructions[i];
                createFunction = createFunctions[i];
                nextCreateFunction = createFunctions[i + 1];

                var localPath = this.MODEL_INSTRUCTIONS + "/" + i + "/";
                var fullPath = this.INTERNAL_MODEL + ">" + localPath;
                var newContent = createFunction.apply(this, [instruction, nextCreateFunction, localPath, fullPath]);
                var newControls = newContent.controls;

                newContent.controls.forEach(function(control) {
                    control.data({
                        instructionNum: i
                    });

                    if (control.attachChange) { //display text doesn't have attachChange

                        control.attachChange(this._onChange.bind(this));
                    }

                }.bind(this));

                if (newContent.needLineBreak) { // point location of start and end of line break
                    this.lineBreakIndexes.start[controls.length] = true;
                    this.lineBreakIndexes.end[controls.length + newControls.length - 1] = true;
                }

                controls.push.apply(controls, newControls);
            }

            return controls;
        },

        _getCreateFunction: function(instruction) {
            var createFunction = null;
            if (instruction.valueListObject) {
                createFunction = this._createValueListControl;
            } else if (instruction.visible === false) {
                createFunction = this._createHiddenControl;
            } else if (instruction.type && instruction.type === "action") {
                createFunction = this._createAddRepetitiveControl;
            } else if (instruction.tokenType == "ConjunctionOperator" && !instruction.editable) {
                createFunction = this._createNonEditableLogicalOperator;
            } else if (instruction.tokenType == "ConjunctionOperator" && instruction.editable) {
                createFunction = this._createEditableLogicalOperator;
            } else if (instruction.editable === false) {
                createFunction = this._createTextControl;
            } else if (instruction.businessDataType === "Number") {
                createFunction = this._createNumberControl;
            } else if (instruction.businessDataType === "Date") {
                createFunction = this._createDateControl;
            } else if (instruction.businessDataType === "Time") {
                createFunction = this._createTimeControl;
            } else if (instruction.businessDataType === "Timestamp") {
                createFunction = this._createDateTimeControl;
            } else if (instruction.businessDataType === "TimeSpan") {
                createFunction = this._createNumberControl;
            } else if (instruction.businessDataType === "String") {
                createFunction = this._createGeneralInputControl;
            } else if (instruction.businessDataType === "Boolean") {
                createFunction = this._createBooleanSelectionControl;
            } else if (instruction.valueOptions && instruction.valueOptions.type === "Set") {
                createFunction = this._createSelectionControl;
            }

            return createFunction;
        },

        _createHiddenControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            return [];
        },
        _createValueListControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var ctrl = new Input({
                showValueHelp: true,
                valueHelpRequest: function() {
                    if (ctrl.oValueHelpDialogProvider && ctrl.oValueHelpDialogProvider._onInitialise) {
                        ctrl.oValueHelpDialogProvider._onInitialise();
                    }
                },
                value: {
                    path: fullPath + this.TEXT
                },
                change: function(event) {
                    var oParent = event.getSource().getParent();
                    oParent._syncToken(localPath);
                },
                width: "auto"
            });
            var oValueListAnnotation = instruction.valueListAnnotation;
            if (oValueListAnnotation) {
                ctrl.oValueHelpDialogProvider = new ValueHelpProvider({
                    annotation: oValueListAnnotation.primaryValueListAnnotation,
                    additionalAnnotations: oValueListAnnotation.additionalAnnotations,
                    control: ctrl,
                    model: instruction.valueListObject.model,
                    preventInitialDataFetchInValueHelpDialog: false,
                    supportMultiSelect: false,
                    supportRanges: false,
                    takeOverInputValue: false,
                    fieldName: oValueListAnnotation.primaryValueListAnnotation.valueListTitle,
                    title: oValueListAnnotation.primaryValueListAnnotation.valueListTitle,
                    cursorPosition: 0,
                    bReplaceWord: false,
                    businessDataType: "string",
                    bAddSpace: false
                });
                var oPopover = this.getParent().getParent();
                if (oPopover instanceof sap.m.Popover) {
                    ctrl.oValueHelpDialogProvider._popover = oPopover;
                }
            }
            
            
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },
        _createSelectionControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var oParent = this.getParent();
            var ctrl = new Select({
                items: {
                    path: fullPath + "valueOptions/values",
                    template: new CoreItem({
                        key: "{" + this.INTERNAL_MODEL + ">" + this.TOKEN + "}",
                        text: "{" + this.INTERNAL_MODEL + ">" + this.TEXT + "}"
                    })
                },
                forceSelection: false,
                selectedKey: "{" + fullPath + this.TOKEN + "}",
                width: "auto",
                change: function(event) {

                },
                enabled: (oParent.bReadOnly && oParent instanceof sap.rules.ui.DecisionTableCellExpressionBasic) ? false : true
            });
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },

        _createAddRepetitiveControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var ctrlCollection = [];

            var ctrl = new Button({
                text: "",
                press: instruction.callback
            });

            ctrl.setIcon("sap-icon://add");

            ctrlCollection.push(ctrl);

            return {
                controls: ctrlCollection,
                needLineBreak: false
            };
        },

        _createTextControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var ctrlCollection = [];

            var ctrl = new Text({
                text: "{" + fullPath + this.TEXT + "}",
                width: "auto"
            }).addStyleClass("sapUiTinyMarginTop").addStyleClass("sapRULExpressionBasic");

            ctrlCollection.push(ctrl);

            return {
                controls: ctrlCollection,
                needLineBreak: false
            };
        },

        _createNumberControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var valueRange = this._createValueRange(instruction);

            var ctrl = new Input({
                width: "auto",
                type: "Text",
                value: {
                    path: fullPath + this.TOKEN,
                    type: new TypeFloat({
                            minIntegerDigits: 0, // minimal number of non-fraction digits
                            minFractionDigits: 0 // minimal number of fraction digits
                        },
                        valueRange
                    )
                },
                valueStateText: this._getValueStateText(valueRange),
                change: function(event) {

                }
            });
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            this._attachValidationHandlers(ctrl);

            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },

        _createDateControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var valueRange = this._createValueRange(instruction);
            this._removeTextSingleQuote(localPath);

            var ctrl = new DatePicker({
                width: "auto",
                type: "Date",

                value: {
                    path: fullPath + this.TEXT
                },

                valueStateText: this._getValueStateText(valueRange),
                change: function(event) {
                    var oParent = event.getSource().getParent();
                    oParent._syncToken(localPath);
                }
            });

            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            this._attachValidationHandlers(ctrl);
            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },

        _createTimeControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var valueRange = this._createValueRange(instruction);
            this._removeTextSingleQuote(localPath);
            //bug 5312
            var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale(); 
			var oLocaleData = LocaleData.getInstance(oLocale);
			var timeFormat = oLocaleData.getTimePattern('medium');
            
            var ctrl = new TimePicker({
                width: "auto",
                type: "Time",
                value: {
                    path: fullPath + this.TEXT
                },
                valueStateText: this._getValueStateText(valueRange),
                change: function(event) {
                    var oParent = event.getSource().getParent();
                    oParent._syncToken(localPath);
                },
                valueFormat: timeFormat
            });
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            this._attachValidationHandlers(ctrl);
            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },

        _createDateTimeControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var valueRange = this._createValueRange(instruction);
            this._removeTextSingleQuote(localPath);
            //bug 5312
            var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale(); 
			var oLocaleData = LocaleData.getInstance(oLocale);
            var dateFormatted = oLocaleData.getDatePattern('short');
			var timeFormat = oLocaleData.getTimePattern('medium');
            var sValueFormat = dateFormatted + " " + timeFormat;
            var ctrl = new DateTimePicker({
                width: "auto",
                value: {
                    path: fullPath + this.TEXT
                },
                valueStateText: this._getValueStateText(valueRange),
                change: function(event) {
                    var oParent = event.getSource().getParent();
                    oParent._syncToken(localPath);
                },
                valueFormat: sValueFormat
            });
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            this._attachValidationHandlers(ctrl);
            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },

        _createGeneralInputControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            this._removeTextSingleQuote(localPath);
            var ctrl = new Input({
                value: {
                    path: fullPath + this.TEXT,
                    type: new sap.ui.model.type.String(
                            null, {
                                search: this.VALIDATION_REGEX
                            }) // prevent illegal characters
                },
                width: "auto",
                //valueStateText: this.oBundle.getText("VALUE_HAS_ILLEGAL_CHARACTERS"),
                change: function(event) {
                    // bug 5334
                    var oInput = event.getSource();
                    var sValue = oInput.getValue();
                    oInput.setValue(sValue.replace(/\'/g, ""));
                    var oParent = event.getSource().getParent();
                    oParent._syncToken(localPath);
                }
            });
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);
            this._attachValidationHandlers(ctrl);

            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },

        _createBooleanSelectionControl: function(instruction, nextCreateFunction, localPath, fullPath) {
            var ctrl = new sap.m.Select({
                selectedKey: "{" + fullPath + this.TOKEN + "}",
                width: "auto",
                items: [{
                    text: "true",
                    key: "true"
                }, {
                    text: "false",
                    key: "false"
                }],
                forceSelection: false
            });
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            return {
                controls: [ctrl],
                needLineBreak: false
            };
        },

        _createNonEditableLogicalOperator: function(instruction, nextCreateFunction, localPath, fullPath) {
            var lineBreak = this._createLineBreak();
            var controls = [];

            var ctrl = new HTML({
                content: "<B class='sapMText sapUiTinyMarginTop sapUiTinyMarginEnd'>" + instruction[this.TEXT] + "</B>"
            });

            if (!this._getIndent()) {
                controls.push(lineBreak);
            }
            controls.push(ctrl);
            return {
                controls: controls,
                needLineBreak: true
            };
        },

        _createEditableLogicalOperator: function(instruction, nextCreateFunction, localPath, fullPath) {
            var lineBreak = this._createLineBreak();
            var controls = [];

            var ctrl = new Select({
                items: {
                    path: fullPath + "valueOptions/values",
                    template: new CoreItem({
                        key: "{" + this.INTERNAL_MODEL + ">" + this.TOKEN + "}",
                        text: "{" + this.INTERNAL_MODEL + ">" + this.TEXT + "}"
                    })
                },
                selectedKey: "{" + fullPath + this.TOKEN + "}",
                width: "auto",
                change: function(event) {

                }
            });
            ctrl.addStyleClass(this.TOKENS_GAP_CLASS);

            if (!this._getIndent()) {
                controls.push(lineBreak);
            }
            controls.push(ctrl);
            return {
                controls: controls,
                needLineBreak: true
            };
        },

        _createSpace: function() {
            var ctrl = new HTML({
                content: '<span>&nbsp;</span>'
            });
            return ctrl;
        },

        _createLineBreak: function() {
            var ctrl = new HTML({
                content: '<DIV class="' + this.LINE_GAP_CLASS + '"></DIV>'
            });
            return ctrl;
        },

        _getTableStart: function() {
            return '<table><td></td><td style="vertical-align:top;">';
        },

        _getTableEnd: function() {
            return '</td></tr></table>';
        },

        _getLogicalOperatorStart: function() {
            return '<div class="' + this.LINE_GAP_CLASS + '"></td></tr><tr><td style="vertical-align:top;">';
        },

        _getLogicalOperatorEnd: function() {
            return '</td><td style="vertical-align:top;">';
        },

        _getIndent: function() {
            var hasIndent;

            try {
                hasIndent = this.getProperty("useIndent");

            } catch (e) {
                hasIndent = false;
            }

            return hasIndent;
        },

        _createValueRange: function(instruction) {
            var range = null;

            if (instruction.valueOptions && instruction.valueOptions.type === "Range") {
                range = {};
                var rangeValues = instruction.valueOptions;
                if (rangeValues.from) {
                    range.minimum = rangeValues.from;
                }
                if (rangeValues.to) {
                    range.maximum = rangeValues.to;
                }
            }

            return range;
        },

        _getValueStateText: function(valueRange) {

            var text;

            if (!valueRange) {
                return text;
            }

            if (valueRange.minimum !== undefined && valueRange.maximum !== undefined) {

                text = ""; //this.oBundle.getText("VALUE_OUT_OF_RANGE", [valueRange.minimum, valueRange.maximum]);

            } else if (valueRange.minimum !== undefined) {
                text = ""; //this.oBundle.getText("VALUE_BELOW_LIMIT", [valueRange.minimum]);

            } else if (valueRange.maximum !== undefined) {
                text = ""; //this.oBundle.getText("VALUE_ABOVE_LIMIT", [valueRange.maximum]);

            } else {
                text = "";
            }

            return text;
        },

        _attachValidationHandlers: function(ctrl) {
            //var me = this;

            ctrl.attachParseError(function(e) {
                e.getParameter("element").setValueState("Error");
                e.getParameter("element").setValueStateText(e.getParameter("message"));
            });

            ctrl.attachValidationSuccess(function(e) {
                e.getParameter("element").setValueState("None");
            });
        },

        _showErrorMessage: function(message) {
            jQuery.sap.require("sap.m.MessageBox");
            sap.m.MessageBox.alert(message, {
                icon: sap.m.MessageBox.Icon.ERROR //,

                //title: this.oBundle.getText("ERROR")
            });
        },

        _removeTextSingleQuote: function(localPath) {
            var model = this._internalModel;
            var value = model.getProperty(localPath + this.TEXT);

            model.setProperty(localPath + this.TEXT, value.replace(/\'/g, ""));
        },

        _syncToken: function(localPath) {
            var model = this._internalModel,
                addStartQuote = false,
                addEndQuote = false;
            var newValue = model.getProperty(localPath + this.TEXT).toString();

            if (newValue === "'") {
                addStartQuote = true;
            } // add only quote for this special case
            if (newValue.substr(0, "'") !== "'" /*.startsWith("'")*/ ) {
                addStartQuote = true;
            }
            if (newValue.substr(newValue.length - 1, "'") !== "'") /*.endsWith("'"))*/ {
                addEndQuote = true;
            }

            if (addStartQuote) {
                newValue = "'" + newValue;
            }
            if (addEndQuote) {
                newValue = newValue + "'";
            }

            model.setProperty(localPath + this.TOKEN, newValue);
        }
    });
});