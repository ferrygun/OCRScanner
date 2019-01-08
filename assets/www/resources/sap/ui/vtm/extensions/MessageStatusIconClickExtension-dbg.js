/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Constructor for a new MessageStatusIconClickExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.MessageStatusIconClickExtension
         * @public
         * @class
         * Adds a behavior that shows a {@link sap.ui.vtm.MessagesPopover} when a message status icon is clicked.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.m.MessageStatusIconClickExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.m.MessageStatusIconClickExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.IMessageStatusIconClickExtension
         */
        var MessageStatusIconClickExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.MessageStatusIconClickExtension", /** @lends sap.ui.vtm.extensions.MessageStatusIconClickExtension.prototype */ {
            metadata: {
                interfaces: [
                    "sap.ui.vtm.interfaces.IMessageStatusIconClickExtension"
                ]
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            initialize: function () {
                this.applyPanelHandler(function(panel) {
                    var tree = panel.getTree();
                    var messagesPopover;

                    tree.attachMessageStatusIconClicked(function (event) {
                        if (!this.getEnabled()) {
                            return;
                        }
                        if (messagesPopover && messagesPopover.isOpen()) {
                            messagesPopover.close();
                        }
                        var item = event.getParameter("item");
                        var source = event.getParameter("control");
                        var messages = sap.ui.vtm.TreeItemUtilities.getMessages(item);
                        if (messages.length) {
                            messages.sort(sap.ui.core.Message.compareByType).reverse();
                            messagesPopover = new sap.ui.vtm.MessagesPopover({messages: messages, maxHeight: "300px"});
                            messagesPopover.openBy(source);
                        }
                    }.bind(this));
                }.bind(this));
            }
        });

        return MessageStatusIconClickExtension;
    });