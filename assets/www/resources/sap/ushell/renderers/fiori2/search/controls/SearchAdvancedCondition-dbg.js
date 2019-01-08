/* global jQuery, $, sap, window */

sap.ui.define([
    'sap/ui/layout/HorizontalLayout',
    'sap/ushell/renderers/fiori2/search/SearchFacetDialogHelper'
], function(HorizontalLayout, SearchFacetDialogHelper) {
    "use strict";

    return sap.ui.layout.HorizontalLayout.extend('sap.ushell.renderers.fiori2.search.controls.SearchAdvancedCondition', {
        metadata: {
            properties: {
                "type": "",
                "odata2": false
            }
        },
        constructor: function(options) {
            var that = this;

            options = jQuery.extend({}, {
                allowWrapping: true,
                content: that.contentFactory(options)
            }, options);
            sap.ui.layout.HorizontalLayout.prototype.constructor.apply(this, [options]);

            that.addStyleClass('sapUshellSearchFacetDialogDetailPageCondition');
        },

        renderer: 'sap.ui.layout.HorizontalLayoutRenderer',

        contentFactory: function(options) {
            var that = this;
            var oAdvancedCheckBox = new sap.m.CheckBox({
                select: function(oEvent) {
                    if (options.type === "string" || options.type === "text") {
                        SearchFacetDialogHelper.updateCountInfo(oEvent.getSource().getParent().getParent().getParent().getParent().getParent().getParent());
                    } else {
                        SearchFacetDialogHelper.updateCountInfo(oEvent.getSource().getParent().getParent().getParent());
                    }
                }
            }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionCheckBox');
            var oOperatorLabel = sap.ui.getCore().byId("operatorLabel");
            if (!oOperatorLabel) {
                oOperatorLabel = new sap.ui.core.InvisibleText("operatorLabel", {
                    text: sap.ushell.resources.i18n.getText("operator")
                });
            }
            var oInput, oButton, oInputBox, oSelect;
            switch (options.type) {
                case 'date':
                    oInput = new sap.m.DateRangeSelection({
                        width: '86%',
                        change: function(oEvent) {
                            that.onDateRangeSelectionChange(oEvent);
                        }
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionInput');
                    oInput.onAfterRendering = function() {
                        var $this = $(this.getDomRef());
                        $('input', $this).attr('readonly', 'readonly');
                    }
                    break;
                case 'string':
                    oAdvancedCheckBox.setVisible(false);
                    oInputBox = new sap.m.Input({
                        width: '57%',
                        placeholder: sap.ushell.resources.i18n.getText("filterCondition"),
                        liveChange: function(oEvent) {
                            that.onAdvancedInputChange(oEvent);
                        }
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionInput');
                    oSelect = new sap.m.Select({
                        width: '40%',
                        tooltip: sap.ushell.resources.i18n.getText("operator"),
                        items: [
                            new sap.ui.core.Item({
                                text: sap.ushell.resources.i18n.getText("equals"),
                                key: 'eq'
                            }),
                            new sap.ui.core.Item({
                                text: sap.ushell.resources.i18n.getText("beginsWith"),
                                key: 'bw',
                                enabled: !options.odata2
                            }),
                            new sap.ui.core.Item({
                                text: sap.ushell.resources.i18n.getText("endsWith"),
                                key: 'ew',
                                enabled: !options.odata2
                            }),
                            new sap.ui.core.Item({
                                text: sap.ushell.resources.i18n.getText("contains"),
                                key: 'co',
                                enabled: !options.odata2
                            })
                        ]
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionSelect');
                    oSelect.addAriaLabelledBy("operatorLabel");
                    oInput = new sap.ui.layout.HorizontalLayout({
                        allowWrapping: true,
                        content: [oSelect, oInputBox]
                    });
                    oButton = new sap.m.Button({
                        icon: "sap-icon://sys-cancel",
                        type: sap.m.ButtonType.Transparent,
                        tooltip: sap.ushell.resources.i18n.getText("removeButton"),
                        press: function(oEvent) {
                            that.onDeleteButtonPress(oEvent);
                        }
                    });
                    break;
                case 'text':
                    oAdvancedCheckBox.setVisible(false);
                    oInputBox = new sap.m.Input({
                        width: '57%',
                        placeholder: sap.ushell.resources.i18n.getText("filterCondition"),
                        liveChange: function(oEvent) {
                            that.onAdvancedInputChange(oEvent);
                        }
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionInput');
                    oSelect = new sap.m.Select({
                        width: '40%',
                        tooltip: sap.ushell.resources.i18n.getText("operator"),
                        items: [
                            new sap.ui.core.Item({
                                text: sap.ushell.resources.i18n.getText("containsWords"),
                                key: 'co'
                            })
                        ]
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionSelect');
                    oSelect.addAriaLabelledBy("operatorLabel");
                    oInput = new sap.ui.layout.HorizontalLayout({
                        allowWrapping: true,
                        content: [oSelect, oInputBox]
                    });
                    oButton = new sap.m.Button({
                        icon: "sap-icon://sys-cancel",
                        type: sap.m.ButtonType.Transparent,
                        tooltip: sap.ushell.resources.i18n.getText("removeButton"),
                        press: function(oEvent) {
                            that.onDeleteButtonPress(oEvent);
                        }
                    });
                    break;
                case 'number':
                    var oInputBoxLeft = new sap.m.Input({
                        width: '46.5%',
                        placeholder: sap.ushell.resources.i18n.getText("fromPlaceholder"),
                        liveChange: function(oEvent) {
                            that.onAdvancedNumberInputChange(oEvent);
                        }
                        //                        type: sap.m.InputType.Number
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionInput');
                    var oInputBoxRight = new sap.m.Input({
                        width: '46.5%',
                        placeholder: sap.ushell.resources.i18n.getText("toPlaceholder"),
                        liveChange: function(oEvent) {
                            that.onAdvancedNumberInputChange(oEvent);
                        }
                        //                        type: sap.m.InputType.Number
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionInput');
                    var oLabel = new sap.m.Label({
                        text: '...'
                    }).addStyleClass('sapUshellSearchFacetDialogDetailPageConditionLabel');
                    oInput = new sap.ui.layout.HorizontalLayout({
                        allowWrapping: true,
                        content: [oInputBoxLeft, oLabel, oInputBoxRight]
                    });
                    oInput.addEventDelegate({
                        //workaround to set focus at right end position
                        onAfterRendering: function(oEvent) {
                            var length = oEvent.srcControl.getParent().getParent().getContent().length;
                            var index = oEvent.srcControl.getParent().getParent().indexOfAggregation("content", oEvent.srcControl.getParent());
                            if (index === length - 2) {
                                var value = oEvent.srcControl.getContent()[2].getValue();
                                oEvent.srcControl.getContent()[2].setValue();
                                oEvent.srcControl.getContent()[2].setValue(value);
                            }
                        }
                    });
                    break;
                default:
                    break;
            }
            return [oAdvancedCheckBox, oInput, oButton];
        },

        //event: date range selection box changed
        onDateRangeSelectionChange: function(oEvent) {
            var oDateRangeSelection = oEvent.getSource();
            var oAdvancedCondition = oDateRangeSelection.getParent();
            var oAdvancedCheckBox = oAdvancedCondition.getContent()[0];
            if (oDateRangeSelection.getDateValue() && oDateRangeSelection.getSecondDateValue()) {
                oAdvancedCheckBox.setSelected(true);
                SearchFacetDialogHelper.insertNewAdvancedCondition(oAdvancedCondition, "date");
                SearchFacetDialogHelper.updateCountInfo(oAdvancedCondition.getParent().getParent());
            } else {
                oAdvancedCheckBox.setSelected(false);
            }
        },

        //event: advanced string input box changed
        onAdvancedInputChange: function(oEvent) {
            var oInput = oEvent.getSource();
            var oAdvancedCondition = oInput.getParent().getParent();
            var oAdvancedCheckBox = oAdvancedCondition.getContent()[0];
            if (oInput.getValue()) {
                oAdvancedCheckBox.setSelected(true);
                //                that.insertNewAdvancedCondition(oAdvancedCondition, "string");
                SearchFacetDialogHelper.updateCountInfo(oAdvancedCondition.getParent().getParent().getParent().getParent().getParent());
            } else {
                oAdvancedCheckBox.setSelected(false);
            }
        },

        //event: advanced condition delete button pressed
        onDeleteButtonPress: function(oEvent) {
            var oAdvancedCondition = oEvent.getSource().getParent();
            SearchFacetDialogHelper.deleteAdvancedCondition(oAdvancedCondition);
        },

        //event: advanced number input box changed
        onAdvancedNumberInputChange: function(oEvent) {
            var oInput = oEvent.getSource();
            var oAdvancedCondition = oInput.getParent().getParent();
            var oAdvancedCheckBox = oAdvancedCondition.getContent()[0];
            if (oInput.getParent().getContent()[0].getValue() && oInput.getParent().getContent()[2].getValue()) {
                oAdvancedCheckBox.setSelected(true);
                SearchFacetDialogHelper.insertNewAdvancedCondition(oAdvancedCondition, "number");
                SearchFacetDialogHelper.updateCountInfo(oAdvancedCondition.getParent().getParent());
                //                oInput.getParent().getContent()[2].focus();
            } else {
                oAdvancedCheckBox.setSelected(false);
            }
        }
    });
});
