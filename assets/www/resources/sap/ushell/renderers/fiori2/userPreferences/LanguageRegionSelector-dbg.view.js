// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, document, self */
    /*jslint plusplus: true, nomen: true, vars: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.userPreferences.LanguageRegionSelector", {
        createContent: function (oController) {
            var itemTemplate = new sap.ui.core.Item({
                text: "{text}",
                key: "{key}"
            });
            var i18n = sap.ushell.resources.i18n;
            var sFlexDirection = sap.ui.Device.system.phone ? 'Column' : 'Row';
            var sFlexAlignItems = sap.ui.Device.system.phone ? 'Stretch' : 'Center';
            var sTextAlign = sap.ui.Device.system.phone ? 'Left' : 'Right';
            var sLabelWidth = sap.ui.Device.system.phone ? "auto" : "12rem";
            var sLabelSelectLanguageWidth = sap.ui.Device.system.phone ? "auto" : "16rem";
            var sComboBoxWidth = sap.ui.Device.system.phone ? "100%" : undefined;

            var languageLabel = new sap.m.Label('languageSelectionLabel', {
                text: {
                    path: "/selectedLanguage",
                    formatter: function (sSelectedLanguage) {
                        sSelectedLanguage = oController._getFormatedLanguage(sSelectedLanguage);
                        //If the language value has region - for example 'en(us)', the label should be 'Language and Region'. Otherwise, it should be 'Language'.
                        return i18n.getText(sSelectedLanguage.indexOf('(') > -1 ? "languageAndRegionTit" : "languageRegionFld") + ':';
                    }
                },
                width: sLabelWidth,
                textAlign: sTextAlign
            });

           this.selectLanguage =  new sap.m.Select('languageSelectionSelect', {
                visible: false,
                width: sLabelSelectLanguageWidth,
                items: {
                    path: "/languageList",
                    template: itemTemplate
                },
                selectedKey: "{/selectedLanguage}",
                editable: true,
                   change: function (e) {
                      var sSelectedLanguage = e.getParameters().selectedItem.getKey();
                      oController._handleSelectChange(sSelectedLanguage);
                   }
            }).addAriaLabelledBy(languageLabel);

            this.inputLanguage =  new sap.m.Input('languageSelectionInput', {
                    visible: true,
                    value: "{/selectedLanguage}",
                    editable: false
                }).addAriaLabelledBy(languageLabel);


            var fboxLanguage = new sap.m.FlexBox({
                alignItems: sFlexAlignItems,
                direction: sFlexDirection,
                items: [
                    languageLabel,
                    this.selectLanguage,
                    this.inputLanguage
                ]
            });

            this.helpingTextLabel = new sap.m.Label({
                visible: false,
                text:"",
                width: sLabelWidth,
                textAlign: sTextAlign
            });

            this.helpingText = new sap.m.Text({
                visible: false,
                text: i18n.getText("LanguageAndRegionHelpingText"),
                width: sLabelSelectLanguageWidth,
                textAlign: "Begin"
            }).addStyleClass("sapUshellFlpSettingsLanguageRegionDescription");

            var fboxHelpingText = new sap.m.FlexBox({
                alignItems: sFlexAlignItems,
                direction: sFlexDirection,
                items: [
                    this.helpingTextLabel,
                    this.helpingText
                ]
            });

            var dateLabel = new sap.m.Label({
                text: i18n.getText("dateFormatFld") + ":",
                width: sLabelWidth,
                textAlign: sTextAlign
            });

            this.comboDate = new sap.m.ComboBox('dateFormatCombo',{
                width: sComboBoxWidth,
                items: {
                    path: "/datePatternList",
                    template: itemTemplate
                },
                selectedKey: "{/selectedDatePattern}",
                editable: false
            }).addAriaLabelledBy(dateLabel);

            var fboxDate = new sap.m.FlexBox({
                alignItems: sFlexAlignItems,
                direction: sFlexDirection,
                items: [
                    dateLabel,
                    this.comboDate
                ]
            });

            this.hourFormatSegmentedButton = new sap.m.SegmentedButton('hoursSegmentedButton',{
                enabled: false,
                width: "10rem",
                buttons: [
                    new sap.m.Button({
                        text: i18n.getText("btn12h")
                    }),
                    new sap.m.Button({
                        text: i18n.getText("btn24h")
                    })
                ]
            });

            var fboxTime = new sap.m.FlexBox({
                alignItems: sFlexAlignItems,
                direction: sFlexDirection,
                items: [
                    new sap.m.Label({
                        text: i18n.getText("timeFormatFld") + ":",
                        width: sLabelWidth,
                        textAlign: sTextAlign
                    }),
                    this.hourFormatSegmentedButton
                ]
            });

            fboxTime.addStyleClass("sapUshellFlpSettingsLanguageRegionHourFormatFBox");
            var vbox = new sap.m.VBox({
                items: [fboxLanguage, fboxHelpingText, fboxDate, fboxTime]
            });
            vbox.addStyleClass("sapUiSmallMargin");

            return vbox;
        },

        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.userPreferences.LanguageRegionSelector";
        }
    });



}, /* bExport= */ false);
