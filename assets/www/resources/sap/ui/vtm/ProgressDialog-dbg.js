/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "./library", "sap/ui/core/Control", "sap/m/Dialog", "./Progress"],
    function (jQuery, SapUiVtmLibrary, SapUiCoreControl, SapMTDialog, SapUiVtmProgress) {

        "use strict";

        /**
         * Constructor for a new ProgressDialog.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @class
         * A progress control to show viewable download and load progress.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {sap.ui.vtm.Scene} scene The scene that is being used to load viewables.
         * @name sap.ui.vtm.ProgressDialog
         * @extends sap.ui.core.Control
         */
        var ProgressDialog = SapUiCoreControl.extend("sap.ui.vtm.ProgressDialog",  /** @lends sap.ui.vtm.ProgressDialog.prototype */ {
            metadata: {
                properties: {
                    /**
                     * The text to display in the progress dialog.
                     */
                    progressText: {
                        type: "string"
                    },
                    /**
                     * The percentage (0-100) to show in the progress bar (if visible).
                     */
                    percentComplete: {
                        type: "int",
                        defaultValue: 0
                    },
                    /**
                     * Whether the progress bar is visible.
                     */
                    progressBarVisible: {
                        type: "boolean",
                        defaultValue: "true"
                    }
                }
            },

            init: function () {
                this._oProgress = new sap.ui.vtm.Progress();
                this._oDialog = new sap.m.Dialog(this.getId() + '-Dialog', {
                    showHeader: false,
                    content: [this._oProgress],
                    verticalScrolling: false,
                    horizontalScrolling: false
                });
            },

            renderer: function (oRM, oControl) {},

            /**
             * Opens the dialog.
             * @public
             * @method
             * @returns {sap.ui.vtm.ProgressDialog} <code>this</code> for method chaining.
             */
            open: function() {
                return this._oDialog.open();
            },

            /**
             * Returns whether the dialog is open.
             * @public
             * @method
             * @returns {boolean} <code>true</code> when the dialog is open.
             */
            isOpen: function() {
                return this._oDialog.isOpen();
            },

            /**
             * Closes the dialog.
             * @public
             * @method
             * @returns {sap.ui.vtm.ProgressDialog} <code>this</code> for method chaining.
             */
            close: function() {
                return this._oDialog.close();
            },

            setPercentComplete: function(iPercentComplete) {
                this.setProperty("percentComplete", iPercentComplete);
                this._oProgress.getProgressBar().setPercentValue(iPercentComplete);
                sap.ui.getCore().applyChanges();
            },

            setProgressText: function(sProgressText) {
                this.setProperty("progressText", sProgressText);
                this._oProgress.getProgressText().setText(sProgressText);
                sap.ui.getCore().applyChanges();
            },

            setProgressBarVisible: function(bProgressBarVisible) {
                this.setProperty("progressBarVisible", bProgressBarVisible);
                this._oProgress.getProgressBar().setVisible(bProgressBarVisible);
            }
        });

        return ProgressDialog;
    });
