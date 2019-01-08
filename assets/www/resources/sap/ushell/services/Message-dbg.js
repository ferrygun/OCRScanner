// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
], function () {
    "use strict";
    /*global jQuery, sap */

    /**
     * Message service.
     *
     * @name sap.ushell.services.Message
     *
     * @constructor
     * @since 1.16.0
     * @public
     */
     function Message() {

        var fnShellCallBackFunction = null;

        /**
         * Initialisation:
         * This method is to be invoked by the Shell to register the message callback function.
         * The signature of the callback is defined via the show function.
         *
         * @param {function} fnShellCallback
         *      callback for the shell to execute showing the message
         *
         * @methodOf sap.ushell.services.Message#
         * @name init
         * @private
         */
        this.init = function (fnShellCallback) {
            fnShellCallBackFunction = fnShellCallback;

            return this;
        };

        /**
         * Shows a message on the screen.
         *
         * @param {sap.ushell.services.Message.Type} iType
         *      message type
         * @param {string} sMessage
         *      the localized message as plain text
         *
         * @methodOf sap.ushell.services.Message#
         * @name show
         * @private
         */
        this.show = function (iType, sMessage, oParameters) {
            if (!sMessage) {
                jQuery.sap.log.error("Message must not be empty.");
            } else {
                if (fnShellCallBackFunction) {
                    fnShellCallBackFunction(iType, sMessage, oParameters || {});
                } else {
                    jQuery.sap.log.error("MessageService not initialized. [Message: '" + sMessage + "']");
                }
            }
        };

        /**
         * Shows an info message on the screen.
         *
         * @param {string} sMessage
         *      the localized message as plain text
         * @param {int} [iDuration=3000]
         *      display duration in ms (optional)
         *
         * @methodOf sap.ushell.services.Message#
         * @name info
         * @public
         * @alias sap.ushell.services.Message#info
         */
        this.info = function (sMessage, iDuration) {
            this.show(Message.Type.INFO, sMessage, { duration : iDuration || 3000 });
        };

        /**
         * Shows an error message on the screen.
         *
         * @param {string} sMessage
         *      the localized message as plain text
         * @param {string} [sTitle]
         *      the localized title as plain text (optional)
         *
         * @methodOf sap.ushell.services.Message#
         * @name error
         * @public
         * @alias sap.ushell.services.Message#error
         */
        this.error = function (sMessage, sTitle) {
            sMessage = (sTitle !== undefined) ? sTitle + " , " + sMessage : sMessage;
            jQuery.sap.log.error(sMessage);

            this.show(Message.Type.ERROR, sMessage, { title : sTitle });
        };

        /**
         * Shows an confirmation dialog on the screen.
         *
         * The callback is called with the following signature: <code>function(oAction)</code>
         * where oAction is the button that the user has tapped. For example, when the user has pressed the close button, a sap.m.MessageBox.Action.Close is returned.
         *
         * If no actions are provided, OK and Cancel will be shown. In this case oAction is set by one of the following three values:
         * 1. sap.m.MessageBox.Action.OK: OK (confirmed) button is tapped.
         * 2. sap.m.MessageBox.Action.Cancel: Cancel (unconfirmed) button is tapped.
         * 3. null: Confirm dialog is closed by Calling sap.m.InstanceManager.closeAllDialogs()
         *
         * @param {string} sMessage
         *      the localized message as plain text
         * @param {function} fnCallback
         *      callback function
         * @param {string} [sTitle]
         *      the localized title as plain text (optional)
         * @param {sap.m.MessageBox.Action|sap.m.MessageBox.Action[]|string|string[]} [vActions]
         *       Either a single action, or an array of two actions. If no action(s) are given, the single action MessageBox.Action.OK is taken as a default for the parameter. If more than two actions are given, only the first two actions are taken. Custom action string(s) can be provided, and then the translation of custom action string(s) needs to be done by the application.
         *
         * @methodOf sap.ushell.services.Message#
         * @name confirm
         * @public
         * @alias sap.ushell.services.Message#confirm
         */
        this.confirm = function (sMessage, fnCallback, sTitle, vActions) {
            this.show(Message.Type.CONFIRM, sMessage, { title : sTitle, callback : fnCallback, actions : vActions });
        };
    };

    /**
     * @name sap.ushell.services.Message.Type
     * @since 1.16.0
     * @private
     */
    Message.Type = {
        INFO : 0,
        ERROR : 1,
        CONFIRM : 2
    };

    Message.hasNoAdapter = true;
    return Message;

}, true /* bExport */);
