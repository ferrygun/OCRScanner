/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "./library", "sap/m/Popover", "sap/m/PopoverRenderer", "sap/m/List"],
    function (jQuery, SapUiVtmLibrary, SapMPopover,SapMPopoverRenderer, SapMList) {

        "use strict";

        /**
         * Constructor for a new MessagesPopover.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @class
         * A control that can be used to show messages applied to a tree item.
         * @author SAP SE
         * @version 1.52.0
         * @name sap.ui.vtm.MessagesPopover
         * @extends sap.m.Popover
         */
        var MessagesPopover = sap.m.Popover.extend("sap.ui.vtm.MessagesPopover", /** @lends sap.ui.vtm.MessagesPopover.prototype */ {
            metadata: {
                properties: {
                    /**
                     * The set of {@link sap.ui.core.Message} objects to display.
                     *
                     * Only the following properties of each message will be used:
                     * <ul>
                     * <li><code>level</code></li>
                     * <li><code>text</code></li>
                     * <li><code>icon</code></li>
                     * </ul>
                     */
                    messages: {type: "object[]"},

                    /**
                     * Maximum height of status window.
                     */
                    maxHeight: {type: "sap.ui.core.CSSSize", defaultValue: null}
                }
            },

            init: function () {
                SapMPopover.prototype.init.apply(this);
                this._rb = sap.ui.vtm.getResourceBundle();
                this.setShowHeader(false);
                this.attachAfterOpen(this._onAfterOpen, this);
            },

            renderer: function(oRM, oControl) {
                SapMPopoverRenderer.render.call(this, oRM, oControl);
            },

            onAfterRendering: function() {
                var domRef = this.getDomRef();
                var maxH = parseInt(this.getMaxHeight(), 10);
                if (maxH > 0 && domRef.clientHeight > maxH) {
                    this.setContentHeight(this.getMaxHeight());
                }
            },

            setMessages: function(aMessages) {
                var modelMessages = [];
                aMessages.forEach(function(message) {
                    var modelMessage = {
                        text: message.getText()
                    };
                    var type = message.getLevel();
                    var iconUrl = message.getIcon();
                    switch (type) {
                    case sap.ui.core.MessageType.Error:
                        modelMessage.iconUrl = iconUrl || "sap-icon://error";
                        modelMessage.iconColor = sap.ui.core.IconColor.Negative;
                        modelMessage.iconTooltip = this._rb.getText("MESSAGESTATUS_ERROR");
                        break;
                    case sap.ui.core.MessageType.Warning:
                        modelMessage.iconUrl = iconUrl || "sap-icon://alert";
                        modelMessage.iconColor = sap.ui.core.IconColor.Critical;
                        modelMessage.iconTooltip = this._rb.getText("MESSAGESTATUS_WARNING");
                        break;
                    case sap.ui.core.MessageType.Success:
                        modelMessage.iconUrl = iconUrl || "sap-icon://sys-enter-2";
                        modelMessage.iconColor = sap.ui.core.IconColor.Positive;
                        modelMessage.iconTooltip = this._rb.getText("MESSAGESTATUS_SUCCESS");
                       break;
                    case sap.ui.core.MessageType.Information:
                        modelMessage.iconUrl = iconUrl || "sap-icon://message-information";
                        modelMessage.iconColor = sap.ui.core.IconColor.Neutral;
                        modelMessage.iconUrl = iconUrl || "sap-icon://message-information";
                        modelMessage.iconTooltip = this._rb.getText("MESSAGESTATUS_INFORMATION");
                        break;
                    default:
                        message.color = sap.ui.core.IconColor.Default;
                    }
                    modelMessages.push(modelMessage);
                }.bind(this));

                var model = new sap.ui.model.json.JSONModel();
                var data = {messages: modelMessages};
                model.setData(data);

                var list = new sap.m.List();
                list.setModel(model, "model");
                list.bindItems("model>/messages", new sap.m.CustomListItem({
                        content: [
                            new sap.ui.layout.HorizontalLayout({
                                content: [
                                    new sap.ui.core.Icon({
                                        src: "{model>iconUrl}",
                                        color: "{model>iconColor}",
                                        tooltip: "{model>iconTooltip}"
                                    }).addStyleClass("sapUiVtmTreeStatusItem"),
                                    new sap.m.Text({
                                        text: "{model>text}",
                                        tooltip: "{model>text}",
                                        wrapping: true
                                    }).addStyleClass("sapUiVtmTreeStatusItem")
                                ]
                            })
                        ]
                    })
                );

                this.addContent(list);
                return this;
            },

            _onModelContextChanged: function() {
                this.close();
            },

            _onAfterOpen: function(oEvent) {
                var oControl = oEvent.getParameter("openBy");
                if (oControl) {
                    oControl.attachModelContextChange(this._onModelContextChanged, this);
                    this.attachAfterClose(this._onAfterClose, this);
                }

                this.detachAfterOpen(this._onAfterOpen, this);
            },

            _onAfterClose: function(oEvent) {
                var oControl = oEvent.getParameter("openBy");
                if (oControl) {
                    oControl.detachModelContextChange(this._onModelContextChanged, this);
                    this.detachAfterClose(this._onAfterClose, this);
                }

                setTimeout(function() {
                    this.destroy();
                }.bind(this), 0);
            }
        });

        return MessagesPopover;
    });
