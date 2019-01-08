/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */
/*global jQuery, sap */
sap.ui.define(['jquery.sap.global', 'sap/ushell/library', 'sap/ui/Device', './ToolAreaItem'],
    function (jQuery, library, Device, ToolAreaItem) {
        "use strict";

        var ToolArea = sap.ui.core.Control.extend("sap.ushell.ui.shell.ToolArea", {

            metadata: {
                properties: {
                    size: {type: "sap.ui.core.CSSSize",group : "Appearance", defaultValue : '56px'},
                    textVisible: {type: "boolean", group : "Appearance", defaultValue : true }
                },
                aggregations: {
                    toolAreaItems : {type : "sap.ushell.ui.shell.ToolAreaItem", multiple : true}
                }
            },
            renderer: {
                render: function (rm, oToolArea) {
                    if (!oToolArea.getToolAreaItems().length) {
                        return;
                    } else {

                        var id = oToolArea.getId();
                        rm.write("<div");
                        rm.writeControlData(oToolArea);
                        rm.writeAttribute("class", "sapUshellToolArea");
                        rm.write(">");
                        rm.write("<div id='", id, "-cntnt' class='sapUshellToolAreaContainer'>");
                        this.renderToolAreaItems(rm, oToolArea);
                        rm.write("</div>");
                    }
                },

                renderToolAreaItems: function (rm, oToolArea) {

                    var aItems = oToolArea.getToolAreaItems(),
                        i;
                    for (i = 0; i < aItems.length; i++) {
                        rm.write("<div");
                        rm.addClass("sapUshellToolAreaContent");
                        if (aItems[i].getSelected()) {
                            rm.addClass("sapUshellToolAreaItemSelected");
                        }
                        rm.writeClasses();
                        rm.write(">");
                        rm.renderControl(aItems[i]);
                        rm.write("</div>");
                        rm.write("<div class='sapUshellToolAreaContentSeparator'></div>");
                    }
                }
            }

        });
        ToolArea.prototype.init = function () {
            Device.media.attachHandler(this._setSize , this);
            Device.resize.attachHandler(this._setSize , this);
        };

        ToolArea.prototype.addToolAreaItem = function (oToolAreaItem) {
            var bSuppressInvalidation = !!this.getToolAreaItems.length;
          if (!this.getVisible()) {
              this.setVisible(true);
          }
            this.addAggregation("toolAreaItems", oToolAreaItem, bSuppressInvalidation);

            if (this.getDomRef()) {

                    var rm = sap.ui.getCore().createRenderManager();
                    rm.renderControl(oToolAreaItem);
                    rm.flush(this.getDomRef());
                    rm.destroy();

            }
        };

        ToolArea.prototype.removeToolAreaItem = function (item) {
            var aToolAreaItem = this.getToolAreaItems(),
                oToolAreaItem = typeof item === 'object' ? item : aToolAreaItem[item];
            this.removeAggregation("toolAreaItems", oToolAreaItem);
            if (this.getToolAreaItems().length < 1) {
                this.setVisible(false);
            }
        };

        ToolArea.prototype.onBeforeRendering = function () {
            var aItems = this.getToolAreaItems(),
                i;
            this._bRenderText = aItems.length;
            for (i = 0; i < aItems.length; i++) {
                if (!aItems[i].getText()) {
                    this._bRenderText = false;
                }
            }
        };

        ToolArea.prototype._setSize = function () {
            var iSize = jQuery(".sapUshellToolArea").width() / 16;
            if (!this._bRenderText) {
                this.setProperty("textVisible", false, true);
                iSize = jQuery(".sapUshellToolAreaItm").height() / 16;
                this.$().toggleClass("sapUshellToolAreaTextHidden", true);
            }

            this.setProperty("size", iSize + "rem", true);
        };

        ToolArea.prototype.onAfterRendering = function () {
            if (this.getToolAreaItems().length) {
                this.setVisible(true);
                this._setSize();
            }

        };

        return ToolArea;

    }, /* bExport= */ true);
