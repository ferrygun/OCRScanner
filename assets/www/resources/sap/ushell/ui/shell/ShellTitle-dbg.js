/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap */
/**
 * Provides control sap.ushell.ui.shell.ShellTitle
 *
 * This control is responsible to display the Shell Header Title.
 * This control could be rendered in two different states:
 * 1. Title only: only the title will be rendered inside the Shell Header
 * 2. Title with popover button: A button will be placed in the Shell Header Title area.
 *    When the user clicks on the button, a popover will raise and render the innerControl as its content.
 *
 *    innerControl: the content of the popover. Will be destroyed by the ShellTitle control.
 */
sap.ui.define(['jquery.sap.global', 'sap/m/Button', 'sap/ui/core/IconPool', 'sap/ushell/library'],
    function (jQuery, Button, IconPool) {
        "use strict";

        var ShellTitle = Button.extend("sap.ushell.ui.shell.ShellTitle",
            {
                metadata: {
                    properties: {
                        text: {type : "string", group : "Misc", defaultValue : null},
                        icon: {type : "sap.ui.core.URI", group : "Appearance", defaultValue : null}
                    },
                    events: {
                        press: {}
                    }
                },

                renderer: {
                    render:  function(oRm, oControl) {
                        var oInnerControl = oControl.getInnerControl();
                        var sTitle = oControl.getText();
                        if (!sTitle) {
                            return;
                        }
                        if (oInnerControl) {
                            oRm.write("<a tabindex='0' href='javascript:void(0);'");
                            oRm.addClass("sapUshellShellHeadAction sapUshellHideIconOnDesktop");
                            oRm.writeClasses();
                            if (oControl.getTooltip()) {
                                oRm.writeAttributeEscaped("title", oControl.getTooltip());
                            }
                            oRm.writeControlData(oControl);
                            oRm.write("><span class='sapUshellShellHeadActionImg sapUshellShellTitleHeadActionImg'>");
                            var oIcon = IconPool.createControlByURI(oControl.getIcon());
                            oRm.renderControl(oIcon);
                            oRm.write("</span>");
                            oRm.write("<span class='sapUshellShellHeadActionName sapUshellHeadTitle'");
                            oRm.writeAttributeEscaped("title", oControl.getText());
                            oRm.write(">");
                            oRm.writeEscaped(oControl.getText());
                            oRm.write("</span><span class='sapUshellShellHeadActionExp'></span></a>");
                        } else {
                            oRm.write('<span id="shell-header-hdr-shell-title" class="sapUshellHeadTitle">');
                            oRm.writeEscaped(oControl.getText());
                            oRm.write("</span>");
                        }
                    }
                }
            });

        ShellTitle.prototype.init = function () {
            //call the parent sap.m.Button init method
            if (Button.prototype.init) {
                Button.prototype.init.apply(this, arguments);
            }
            this.innerControl = null;
            this.oPopover = null;
        };

        ShellTitle.prototype.getInnerControl = function () {
            return this.innerControl;
        };

        ShellTitle.prototype.setInnerControl = function (oInnercontrol) {
            this.innerControl = oInnercontrol;
        };

        ShellTitle.prototype.onclick = function (oEvent) {
            if (!this.oPopover) {
                this.oPopover = new sap.m.Popover("shellTitlePopover", {
                    showHeader: false,
                    content: this.getInnerControl(),
                    placement: sap.m.PlacementType.VerticalPreferedBottom
                });
            }
            this.oPopover.openBy(this);
            this.firePress();
        };

        ShellTitle.prototype.exit = function () {
            if (this.oPopover) {
                this.innerControl.destroy();
                this.oPopover.destroy();
            }
        };

        ShellTitle.prototype.onsapspace = ShellTitle.prototype.onclick;

        return ShellTitle;

    }, true);
