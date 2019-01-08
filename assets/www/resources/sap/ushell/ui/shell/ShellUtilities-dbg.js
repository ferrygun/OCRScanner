/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap*/
/**
 * Initialization Code and shared classes of library sap.ushell.ui.shell
 */
sap.ui.define(['jquery.sap.global', 'sap/ushell/library'],
    function (jQuery) {

        "use strict";

        sap.ui.base.Object.extend("sap.ushell.ui.shell.shell_ContentRenderer", {
            constructor : function (oControl, sContentContainerId, oContent, fAfterRenderCallback) {
                sap.ui.base.Object.apply(this);
                this._id = sContentContainerId;
                this._cntnt = oContent;
                this._ctrl = oControl;
                this._rm = sap.ui.getCore().createRenderManager();
                this._cb = fAfterRenderCallback || function () {};
            },

            destroy : function () {
                this._rm.destroy();
                delete this._rm;
                delete this._id;
                delete this._cntnt;
                delete this._cb;
                delete this._ctrl;
                if (this._rerenderTimer) {
                    jQuery.sap.clearDelayedCall(this._rerenderTimer);
                    delete this._rerenderTimer;
                }
                sap.ui.base.Object.prototype.destroy.apply(this, arguments);
            },

            render : function () {
                if (!this._rm) {
                    return;
                }

                if (this._rerenderTimer) {
                    jQuery.sap.clearDelayedCall(this._rerenderTimer);
                }

                this._rerenderTimer = jQuery.sap.delayedCall(0, this, function () {
                    var $content = jQuery.sap.byId(this._id);
                    var doRender = $content.length > 0;

                    if (doRender) {
                        if (typeof (this._cntnt) === "string") {
                            var aContent = this._ctrl.getAggregation(this._cntnt, []);
                            for (var i = 0; i < aContent.length; i++) {
                                this._rm.renderControl(aContent[i]);
                            }
                        } else {
                            this._cntnt(this._rm);
                        }
                        this._rm.flush($content[0]);
                    }

                    this._cb(doRender);
                });
            }
        });


        sap.ushell.ui.shell.shell_iNumberOfOpenedShellOverlays = 0;

	//return sap.ushell.ui.shell;

}, /* bExport= */ false);
