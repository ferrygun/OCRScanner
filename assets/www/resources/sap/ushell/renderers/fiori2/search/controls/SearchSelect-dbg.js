/* global jQuery, sap, window */
sap.ui.define([
    'sap/m/Select'
], function() {
    "use strict";

    return sap.m.Select.extend('sap.ushell.renderers.fiori2.search.controls.SearchSelect', {

        constructor: function(sId, options) {
            options = jQuery.extend({}, {
                visible: "{/businessObjSearchEnabled}",
                autoAdjustWidth: true,
                items: {
                    path: "/dataSources",
                    template: new sap.ui.core.Item({
                        key: "{key}",
                        text: "{labelPlural}"
                    })
                },
                selectedKey: {
                    path: '/uiFilter/dataSource/key',
                    mode: sap.ui.model.BindingMode.OneWay
                },
                change: function(event) {
                    var item = this.getSelectedItem();
                    var context = item.getBindingContext();
                    var dataSource = context.getObject();
                    this.getModel().setDataSource(dataSource, false);
                    this.getModel().abortSuggestions();
                },
                enabled: {
                    parts: [{
                        path: "/initializingObjSearch"
                    }],
                    formatter: function(initializingObjSearch) {
                        return !initializingObjSearch;
                    }
                }
            }, options);
            sap.m.Select.prototype.constructor.apply(this, [sId, options]);
            this.addStyleClass('searchSelect');
        },

        renderer: 'sap.m.SelectRenderer',

        setDisplayMode: function(mode) {
            switch (mode) {
                case 'icon':
                    this.setType(sap.m.SelectType.IconOnly);
                    this.setIcon('sap-icon://slim-arrow-down');
                    break;
                case 'default':
                    this.setType(sap.m.SelectType.Default);
                    break;
                default:
                    break;
            }
        }
    });
});
