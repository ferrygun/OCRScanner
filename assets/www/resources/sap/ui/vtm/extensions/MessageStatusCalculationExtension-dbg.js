/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Control", "../Extension"],
    function (jQuery, SapUiCoreControl, SapUiVtmExtension) {

        "use strict";

        /**
         * Enumeration specifying the highest severity message relating to a tree item or its descendants.
         *
         * @enum {string}
         * @private
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         */
        var MessageStatus = {
            /**
             * The tree item has one or more error messages.
             */
            Error: "Error",
            /**
             * One or more descendants of the tree item have one or more error messages.
             */
            ErrorOnDescendant: "ErrorOnDescendant",
            /**
             * The tree item has one or more warning messages.
             */
            Warning: "Warning",
            /**
             * One or more descendants of the tree item have one or more warning messages.
             */
            WarningOnDescendant: "WarningOnDescendant",
            /**
             * The tree item has an information message
             */
            Information: "Information",
            /**
             * The tree item does not have any messages and none of its descendants have an error or warning message.
             */
            None: "None"
        };

        /**
         * Constructor for a new MessageStatusCalculationExtension.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.extensions.MessageStatusCalculationExtension
         * @public
         * @class
         * Adds a behavior that calculates the properties of the message status icons.
         * The behavior:
         * <ul>
         * <li>Allows for error, warning and information messages.</li>
         * <li>Uses red icons for error related indications.</li>
         * <li>Uses yellow icons for warning related indications.</li>
         * <li>Uses grey informational icons for informational indications.</li>
         * <li>Uses solid icons to indicate errors or warnings that apply directly to a tree item.</li>
         * <li>Uses hollow icons to indicate that an error or warning applies to a descendant of a tree item.</li>
         * <li>The highest priority status that applies to a tree item or a descendant tree item is indicated on each tree item.</li>
         * <li>When the highest priority status that applies to a tree item is the same as the highest priority status that applies to any descendant tree, the highest priority message that applies directly to the tree item is indicated.</li>
         * <li>Error messages on descendants are given higher priority than warning or information messages that apply to the tree item itself</li>
         * <li>Warning messages on descendants are given a higher priority than information messages that apply to the tree item</li>
         * <li>Information messages are not cascaded up the tree</li>
         * </ul>
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.m.MessageStatusCalculationExtension} instance.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.m.MessageStatusCalculationExtension} instance.
         * @extends sap.ui.vtm.Extension
         * @implements sap.ui.vtm.interfaces.IMessageStatusCalculationExtension
         */
        var MessageStatusCalculationExtension = SapUiVtmExtension.extend("sap.ui.vtm.extensions.MessageStatusCalculationExtension", /** @lends sap.ui.vtm.extensions.MessageStatusCalculationExtension.prototype */ {
            metadata: {
                interfaces: [
                    "sap.ui.vtm.interfaces.IMessageStatusCalculationExtension"
                ]
            },

            constructor: function(sId, mSettings) {
                SapUiVtmExtension.apply(this, arguments); // Force non-lazy construction
            },

            initialize: function () {
                this._rb = sap.ui.vtm.getResourceBundle();
                this.applyPanelHandler(function(panel) {
                    var tree = panel.getTree();

                    tree.attachBeforeModelUpdated(function (event) {
                        this._handleBeforeModelUpdated(panel);
                    }.bind(this));

                    this._handleBeforeModelUpdated(panel);
                }.bind(this));
            },

            _getMessageStatusPriority: function(messageStatus) {
                switch (messageStatus) {
                case MessageStatus.Error:
                    return 1;
                case MessageStatus.ErrorOnDescendant:
                    return 2;
                case MessageStatus.Warning:
                    return 3;
                case MessageStatus.WarningOnDescendant:
                    return 4;
                case MessageStatus.Information:
                    return 5;
                case MessageStatus.None:
                    return 6;
                default:
                    throw "Unknown message status: '" + messageStatus + "'";
                }
            },

            _makeCascadedMessageStatus: function(messageStatus) {
                switch (messageStatus) {
                case MessageStatus.Error:
                case MessageStatus.ErrorOnDescendant:
                    return MessageStatus.ErrorOnDescendant;
                case MessageStatus.Warning:
                case MessageStatus.WarningOnDescendant:
                    return MessageStatus.WarningOnDescendant;
                case MessageStatus.Information:
                case MessageStatus.None:
                    return MessageStatus.None;
                default:
                    throw "Unknown message status: '" + messageStatus + "'";
                }
            },

            _messageStatusCompareFunction: function(messageTypeA, messageTypeB) {
                return this._getMessageStatusPriority(messageTypeA) - this._getMessageStatusPriority(messageTypeB);
            },

            _calculateHighestPriorityMessageStatus: function(treeItem) {
                var messagesString = treeItem.messages;
                if (messagesString) {
                    var messages = sap.ui.vtm.TreeItemUtilities.getMessages(treeItem);
                    messages.sort(sap.ui.core.Message.compareByType).reverse();
                    return messages[0].getLevel();
                } else {
                    return sap.ui.core.MessageType.None;
                }
            },

            _calculateHighestPriorityChildMessageStatus: function(treeItem) {
                var children = sap.ui.vtm.TreeItemUtilities.getIncludedChildren(treeItem);
                if (children.length) {
                    var childrenWithMessageStatuses = children.filter(function(childItem) {
                        return childItem.messageStatus;
                    });

                    if (childrenWithMessageStatuses.length) {
                        childrenWithMessageStatuses.sort(function(childItemA, childItemB) {
                            return this._getMessageStatusPriority(childItemA.messageStatus) - this._getMessageStatusPriority(childItemB.messageStatus);
                        }.bind(this));
                        return childrenWithMessageStatuses[0].messageStatus;
                    }
                }
                return sap.ui.core.MessageType.None;
            },

            _calculateMessageStatus: function(treeItem) {
                var highestPriorityMessageStatus = this._calculateHighestPriorityMessageStatus(treeItem);
                var highestPriorityChildMessageStatus = this._calculateHighestPriorityChildMessageStatus(treeItem);

                if (this._messageStatusCompareFunction(highestPriorityMessageStatus, highestPriorityChildMessageStatus) > 0) {
                    if (highestPriorityChildMessageStatus === sap.ui.core.MessageType.None) {
                        if (treeItem.messageStatus) {
                            delete treeItem.messageStatus;
                        }
                    } else {
                        treeItem.messageStatus = this._makeCascadedMessageStatus(highestPriorityChildMessageStatus);
                    }
                } else if (highestPriorityMessageStatus === sap.ui.core.MessageType.None) {
                    if (treeItem.messageStatus) {
                        delete treeItem.messageStatus;
                    }
                } else {
                    treeItem.messageStatus = highestPriorityMessageStatus;
                }

                if (highestPriorityChildMessageStatus === sap.ui.core.MessageType.None) {
                    if (treeItem.childMessageStatus) {
                        delete treeItem.childMessageStatus;
                    } else {
                        treeItem.childMessageStatus = highestPriorityChildMessageStatus;
                    }
                }
            },

            _getIconSource: function(messageStatus) {
                switch (messageStatus) {
                case MessageStatus.Error:
                    return "sap-icon://error";
                case MessageStatus.ErrorOnDescendant:
                    return "sap-icon://message-error";
                case MessageStatus.Warning:
                    return "sap-icon://alert";
                case MessageStatus.WarningOnDescendant:
                    return "sap-icon://message-warning";
                case MessageStatus.Information:
                    return "sap-icon://message-information";
                case MessageStatus.None:
                    return null;
                default:
                    throw "Unknown message type: '" + messageStatus + "'";
                }
            },

            _getStatusTooltip: function(messageStatus) {
                switch (messageStatus) {
                case MessageStatus.Error:
                    return this._rb.getText("MESSAGESTATUS_ERROR");
                case MessageStatus.ErrorOnDescendant:
                    return this._rb.getText("MESSAGESTATUS_ERRORONDESCENDANT");
                case MessageStatus.Warning:
                    return this._rb.getText("MESSAGESTATUS_WARNING");
                case MessageStatus.WarningOnDescendant:
                    return this._rb.getText("MESSAGESTATUS_WARNINGONDESCENDANT");
                case MessageStatus.Information:
                    return this._rb.getText("MESSAGESTATUS_INFORMATION");
                case MessageStatus.None:
                    return null;
                default:
                    throw "Unknown message type: '" + messageStatus + "'";
                }
            },
            
            _getMessagesToShowTootip: function(treeItem) {
                if (treeItem.messages) {
                    return this._rb.getText("MESSAGESTATUS_CLICKTOSHOWMESSAGES");
                } else {
                    return this._rb.getText("MESSAGESTATUS_NOMESSAGESONTHISITEM");
                }
            },

            _getIconColor: function(messageStatus) {
                switch (messageStatus) {
                case MessageStatus.Error:
                case MessageStatus.ErrorOnDescendant:
                    return sap.ui.core.IconColor.Negative;
                case MessageStatus.Warning:
                case MessageStatus.WarningOnDescendant:
                    return sap.ui.core.IconColor.Critical;
                case MessageStatus.Information:
                    return sap.ui.core.IconColor.Neutral;
                case MessageStatus.None:
                    return null;
                default:
                    throw "Unknown message type: '" + messageStatus + "'";
                }
            },

            _calculateMessageStatusForTree: function(tree) {
                var callback = this._calculateMessageStatus.bind(this);

                var traverseChildrenFirst = function(treeItem, callbackFunction) {
                    var children = sap.ui.vtm.TreeItemUtilities.getChildren(treeItem);
                    children.forEach(function(child) {
                        traverseChildrenFirst(child, callbackFunction);
                    });

                    if (callbackFunction) {
                        callbackFunction(treeItem);
                    }
                };

                tree.getRootItems().forEach(function(rootItem) {
                    traverseChildrenFirst(rootItem, callback);
                });

                var refreshBindings = false;
                sap.ui.vtm.TreeItemUtilities.traverseTree(tree.getRootItems(), function(treeItem) {
                    if (treeItem.messageStatus) {
                        var messageStatusIconUrl = this._getIconSource(treeItem.messageStatus);
                        if (treeItem.messageStatusIconUrl !== messageStatusIconUrl) {
                            treeItem.messageStatusIconUrl = messageStatusIconUrl;
                            refreshBindings = true;
                        }
                        var messageStatusIconColor = this._getIconColor(treeItem.messageStatus);
                        if (treeItem.messageStatusIconColor !== messageStatusIconColor) {
                            treeItem.messageStatusIconColor = messageStatusIconColor;
                            refreshBindings = true;
                        }
                        var messagesToShowTooltip = this._getMessagesToShowTootip(treeItem);
                        var statusTooltip = this._getStatusTooltip(treeItem.messageStatus);
                        var messageStatusIconTooltip = statusTooltip ? statusTooltip + "\n" + messagesToShowTooltip : messagesToShowTooltip;
                        if (treeItem.messageStatusIconTooltip != messageStatusIconTooltip) {
                            treeItem.messageStatusIconTooltip = messageStatusIconTooltip;
                            refreshBindings = true;
                        }
                    } else if (treeItem.messageStatusIconUrl || treeItem.messageStatusIconColor || treeItem.messageStatusIconTooltip) {
                        delete treeItem.messageStatusIconUrl;
                        delete treeItem.messageStatusIconColor;
                        delete treeItem.messageStatusIconTooltip;
                        refreshBindings = true;
                    }
                    delete treeItem.messageStatus;
                    delete treeItem.childMessageStatus;
                }.bind(this));

                if (refreshBindings) {
                    tree._updateBindings();
                }
            },

            _handleBeforeModelUpdated: function(panel) {
                if (!this.getEnabled()) {
                    return;
                }
                var tree = panel.getTree();
                this._calculateMessageStatusForTree(tree);
            }
        });

        return MessageStatusCalculationExtension;
    });