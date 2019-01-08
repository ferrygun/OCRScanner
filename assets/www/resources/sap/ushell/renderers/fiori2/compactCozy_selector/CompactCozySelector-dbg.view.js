// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(['sap/ushell/resources','sap/ushell/services/Container'],
	function(resources, Container) {
	"use strict";

    /*global jQuery, sap, document, self */
    /*jslint plusplus: true, nomen: true, vars: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.compactCozy_selector.CompactCozySelector", {

        createContent: function (oController) {
            var oCompactCozyListItem = this._getCompactCozyListItemTemplate();
            this.translationBundle = resources.i18n;
            this.oList = new sap.m.List('compactCozySelectorList', {
                includeItemInSelection: true,
                mode: "SingleSelectLeft",
                items: {
                    path: "/options",
                    template: oCompactCozyListItem
                }
            });

            this.info = new sap.m.Text({text:this.translationBundle.getText("displayDensityInfo")}).addStyleClass("sapUiSmallMargin");

            return [this.oList, this.info];
        },

        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.compactCozy_selector.CompactCozySelector";
        },

        _getCompactCozyListItemTemplate : function () {
            var that = this;
            var onSelectHandler = function (e) {
                var item = e.srcControl;
                that.oController.setCurrentContentDensity(item.getBindingContext().getProperty("id"));
            };
            var item = new sap.m.StandardListItem({
                title: "{name}",
                selected: "{isSelected}"
            });
            item.addEventDelegate({
                onclick: onSelectHandler
            });
            return item;
        }

    });



}, /* bExport= */ true);
