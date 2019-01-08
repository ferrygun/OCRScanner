sap.ui.define(["sap/ushell/resources","sap/m/Page", "sap/m/Text", "sap/m/SplitApp", "sap/m/Bar"],
    function(resources, Page, Text, SplitApp, Bar) {
	"use strict";

    /*global jQuery, sap, document, self*/
    /*jslint plusplus: true, nomen: true, vars: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.user_actions.user_preferences.UserSettings", {

        createContent: function (oController) {
            this.aDanglingControls = [];
            this.translationBundle = resources.i18n;
            return this.getMainControl(oController);
        },
        getMainControl: function (oController) {


            this.oMainApp = new SplitApp({
                id: "settingsApp",
                masterPages: oController.createMasterPages(),
                defaultTransitionNameDetail: "show"
            });
            this.splitAppHeaderBar = new Bar({contentMiddle: new Text({text: resources.i18n.getText("userSettings")})});
            var oPage = new Page({
                content: [this.oMainApp],
                customHeader: this.splitAppHeaderBar,
                showHeader: true
            }).addStyleClass('sapUshellSettingsPage');

            this.aDanglingControls.push(oPage);
            //This is a hack suggested as temporal solution in BCP ticket 1680226447
            //We have to set the autofocus property of internal SplitApp navcontainer in order to allow search through the views of the
            //Detail page and also to assure that we set focus on the first element in the view and not the one which appears earlier in case of dynamic content.
            //A feature request will be opened in order to allow this property to be set via official API.
            this.oMainApp._oDetailNav.setAutoFocus(false);
            return oPage;
        },
        getSplitApp: function () {
            return this.oMainApp;
        },
        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.user_actions.user_preferences.UserSettings";
        }

    });


}, /* bExport= */ false);
