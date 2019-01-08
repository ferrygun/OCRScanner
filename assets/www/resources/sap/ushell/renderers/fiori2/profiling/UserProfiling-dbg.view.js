/**
 * View for displaying the User Profiling entires such as Usageamalytice ans Personalized Search.
 * The View is launched when the UserProfiling option is chosen in the USerSettings UI.
 * Content is added to this View by adding an entry to the profilingEntries in shell.controller.
 */
sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, document */
    /*jslint plusplus: true, nomen: true */

    sap.ui.jsview("sap.ushell.renderers.fiori2.profiling.UserProfiling", {
        createContent: function (oController) {
            this.profilingContent = new sap.m.VBox().addStyleClass("sapUshellUserSettingDetailContent");
            return this.profilingContent;
        },
        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.profiling.UserProfiling";
        }
    });


}, /* bExport= */ false);