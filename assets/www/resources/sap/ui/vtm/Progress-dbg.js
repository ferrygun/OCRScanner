/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "sap/m/Text", "sap/m/ProgressIndicator"],
    function (jQuery, SapUiCoreControl, SapMText, SapMProgressIndicator) {

        "use strict";

        /**
         * Constructor for a new Progress.
         * @private
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @class
         * A progress control to show download and load progress.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.Progress} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.Progress} instance.
         * @name sap.ui.vtm.Progress
         * @extends sap.ui.core.Control
         */
        var Progress = SapUiCoreControl.extend("sap.ui.vtm.Progress",  /** @lends sap.ui.vtm.Progress.prototype */ {
            metadata: {
                aggregations: {
                    progressText: {
                        type: "sap.m.Title",
                        multiple: false
                    },
                    progressBar: {
                        type: "sap.m.ProgressIndicator",
                        multiple: false
                    }
                }
            },

            init: function () {
                var progressBar = new sap.m.ProgressIndicator({
                    width: "100%"
                });
                progressBar.addStyleClass("sapUiVtmProgress_progressBar");
                this.setProgressBar(progressBar);

                var progressText = new sap.m.Title({
                    width: "100%",
                    titleStyle: sap.ui.core.TitleLevel.H3,
                    textAlign: sap.ui.core.TextAlign.Center
                });
                progressText.addStyleClass("sapUiVtmProgress_progressText");
                this.setProgressText(progressText);

                this.addStyleClass("sapUiVtmProgress");
            },

            renderer: function (oRM, oControl) {
                oRM.write("<div");
                oRM.writeControlData(oControl);
                oRM.addStyle("height", "inherit");
                oRM.writeStyles();
                oRM.writeClasses();
                oRM.write(">");
                oRM.renderControl(oControl.getProgressText());
                oRM.renderControl(oControl.getProgressBar());
                oRM.write("</div>");
            }
        });

        return Progress;
    });
