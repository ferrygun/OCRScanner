/* global jQuery, sap, window, console */

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ushell/renderers/fiori2/search/controls/SearchSelect',
    'sap/ushell/renderers/fiori2/search/controls/SearchInput',
    'sap/ushell/renderers/fiori2/search/controls/SearchButton'
], function() {
    "use strict";

    return sap.ui.core.Control.extend("sap.ushell.renderers.fiori2.search.controls.SearchFieldGroup", {

        metadata: {
            properties: {
                "selectActive": {
                    defaultValue: true,
                    type: "boolean"
                },
                "inputActive": {
                    defaultValue: true,
                    type: "boolean"
                },
                "buttonActive": {
                    defaultValue: true,
                    type: "boolean"
                },
                "cancelButtonActive": {
                    defaultValue: true,
                    type: "boolean"
                }
            },
            aggregations: {
                "_flexBox": {
                    type: "sap.m.FlexBox",
                    multiple: false,
                    visibility: "hidden"
                }
            }
        },


        constructor: function() {
            sap.ui.core.Control.prototype.constructor.apply(this, arguments);
            var that = this;
            that.initSelect();
            that.initInput();
            that.initButton();
            that.initCancelButton();
            that.initFlexBox();
        },

        setCancelButtonActive: function(active) {
            if (active === this.getProperty('cancelButtonActive')) {
                return;
            }
            this.setProperty('cancelButtonActive', active);
            this.initFlexBox();
        },

        initFlexBox: function() {
            if (!this.select) {
                return;
            }
            var items = [];
            if (this.getSelectActive()) {
                this.select.setLayoutData(new sap.m.FlexItemData({
                    growFactor: 0
                }));
                items.push(this.select);
            }
            if (this.getInputActive()) {
                this.input.setLayoutData(new sap.m.FlexItemData({
                    growFactor: 1
                }));
                items.push(this.input);
            }
            if (this.getButtonActive()) {
                this.button.setLayoutData(new sap.m.FlexItemData({
                    growFactor: 0
                }));
                items.push(this.button);
            }
            if (this.getCancelButtonActive()) {
                this.cancelButton.setLayoutData(new sap.m.FlexItemData({
                    growFactor: 0
                }));
                items.push(this.cancelButton);
            }

            var flexBox = this.getAggregation('_flexBox');
            if (!flexBox) {
                flexBox = new sap.m.FlexBox({
                    alignItems: sap.m.FlexAlignItems.Start,
                    items: items
                });
                this.setAggregation('_flexBox', flexBox);
            } else {
                flexBox.removeAllAggregation('items');
                for (var i = 0; i < items.length; ++i) {
                    flexBox.addItem(items[i]);
                }
            }

        },

        initSelect: function() {
            var that = this;
            that.select = new sap.ushell.renderers.fiori2.search.controls.SearchSelect(that.getId() + '-select', {});
            that.select.attachChange(function() {
                if (that.getAggregation("input")) {
                    var input = that.getAggregation("input");
                    input.destroySuggestionRows();
                }
            });
        },

        initInput: function() {
            var that = this;
            that.input = new sap.ushell.renderers.fiori2.search.controls.SearchInput(that.getId() + '-input', {});
        },

        initButton: function() {
            var that = this;

            that.button = new sap.ushell.renderers.fiori2.search.controls.SearchButton(that.getId() + '-button', {
                tooltip: "{i18n>searchbox_tooltip}",
                ariaLabel: "{i18n>searchbox_tooltip}",
                press: function(event) {

                    // searchterm is empty and datasource==all
                    // do not trigger search instead close search field
                    var model = that.button.getModel();
                    if (!model.config.odataProvider && model.config.isLaunchpad()) {
                        if (that.input.getValue() === "" &&
                            model.getDataSource().equals(model.getDefaultDataSource())) {
                            return;
                        }
                    }

                    // trigger search
                    model.invalidateQuery();
                    that.input.destroySuggestionRows();
                    that.input.triggerSearch(event);
                }

            });

        },

        initCancelButton: function() {
            this.cancelButton = new sap.m.Button({
                text: '{i18n>cancelBtn}'
            });
            this.cancelButton.addStyleClass("sapUshellSearchCancelButton");
        },

        setModel: function(model) {
            this.select.setModel(model);
            this.input.setModel(model);
            this.button.setModel(model);
            this.cancelButton.setModel(model);
        },

        renderer: function(oRm, oControl) {
            oRm.write('<div');
            oRm.writeControlData(oControl);
            oRm.addClass("SearchFieldGroup");
            oRm.writeClasses();
            oRm.write('>');
            oRm.renderControl(oControl.getAggregation('_flexBox'));
            oRm.write('</div>');
        }
    });
});
