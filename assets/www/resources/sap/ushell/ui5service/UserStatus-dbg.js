// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * @fileOverview The UserStatus UI5 service
 *
 * @version 1.52.4
 */

/**
 * @namespace sap.ushell.ui5service.UserStatus
 *
 * @public
 */

(function () {
    "use strict";
    /*global jQuery, sap, setTimeout, clearTimeout, window */
    jQuery.sap.declare("sap.ushell.ui5service.UserStatus");
    jQuery.sap.require("sap.ui.core.service.ServiceFactoryRegistry");
    jQuery.sap.require("sap.ui.core.service.ServiceFactory");
    jQuery.sap.require("sap.ui.base.EventProvider");
    jQuery.sap.require('sap.ushell.ui.launchpad.UserStatusItem');

    var oEventProvider = new sap.ui.base.EventProvider(),
        O_EVENT_NAME = {
            statusChanged: "statusChanged",
            serviceStateChanged: "serviceStateChanged"
        },
        sActiveComponentId;

    /**
     * Returns an instance of the UserStatus. This constructor must only be
     * called internally by the Fiori Launchpad renderer and never by
     * applications.
     *
     * Instead, this service should be consumed by app components as described
     * in the overview section of this class.
     *
     * @name sap.ushell.ui5service.UserStatus
     * @class
     *
     * @classdesc The Unified Shell's UserStatus service.
     *
     * This service allows apps to interact with the Fiori Launchpad UI.
     * The service is injected in the app components by the FLP renderer
     * before the corresponding apps start. To consume the service,
     * app components should declare it in their manifest.json as follows:
     *
     * <pre>
     * {
     *    ...
     *    "sap.ui5": {
     *       "UserStatus": {
     *           "factoryName": "sap.ushell.ui5service.UserStatus"
     *       }
     *    }
     *    ...
     * }
     * </pre>
     *
     * The service can be then consumed within the component as shown in the
     * following example:
     * <pre>
     * // Component.js
     * ...
     * this.getService("UserStatus").then( // promise is returned
     *    function (oService) {
     *       oService.setTitle("Application Title");
     *    },
     *    function (oError) {
     *       jQuery.sap.log.error("Cannot get UserStatus", oError, "my.app.Component");
     *    }
     * );
     * ...
     * </pre>
     *
     * @param {object} oCallerContext
     *   The context in which the service was instantiated. Must have the
     *   format:
     * <pre>
     * {
     *   scopeType: "component",
     *   scopeObject: [a UI5 Component in the sap.ushell package]
     * }
     * </pre>
     *
     * @public
     * @since 1.38.0
     */
    sap.ui.core.service.Service.extend("sap.ushell.ui5service.UserStatus", /** @lends sap.ushell.ui5service.UserStatus# */ {
        init: function () {
            /*
             * Service injection
             */
            var that = this,
                oPublicInterface = this.getInterface();
            sap.ushell.ui5service.UserStatus.prototype.isEnabled = false;
            // Only one component can set/get at a given time. Here we try to
            // avoid that no yet-to-be-destroyed apps call set/get methods by
            // giving priority to the last instantiated component.
            oPublicInterface.init = function () {
                that._amendPublicServiceInstance.call(
                    that,  // always the "private" service
                    this   // public service instance
                );
            };

            sap.ui.core.service.ServiceFactoryRegistry.register(
                "sap.ushell.ui5service.UserStatus",
                new sap.ui.core.service.ServiceFactory(oPublicInterface)
            );

            sap.ushell.ui5service.UserStatus.prototype.AvailableStatus = {
                AVAILABLE: "AVAILABLE",
                AWAY: "AWAY",
                BUSY: "BUSY",
                APPEAR_OFFLINE: "APPEAR_OFFLINE"
            };

        },
        /**
         * Sets the id of the active component, that is, the component allowed
         * to call public methods of this service. This method is mainly here
         * for supportability purposes.
         *
         * @param {string} sId
         *    The id of the active component.
         * @private
         * @since 1.38.0
         */
        _setActiveComponentId: function (sId) {
            sActiveComponentId = sId;
        },
        /**
         * Getter for the id of the active component.  This method is mainly
         * here for supportability purposes.
         *
         * @returns {string}
         *   The id of the component currently active in the Launchpad.
         * @private
         * @since 1.38.0
         */
        _getActiveComponentId: function () {
            return sActiveComponentId;
        },

        /**
         * Getter for the event provider.  This method is mainly
         * here for supportability purposes.
         *
         * @returns {object}
         *   The event provider
         * @private
         * @since 1.38.0
         */
        _getEventProvider: function () {
            return oEventProvider;
        },

        /**
         * Ensures that the given argument is an array of object, having all string values.
         * This method logs an error message in case this is not the case.
         *
         * <pre>
         * IMPORTANT: this method must not rely on its context when called or
         * produce side effects.
         * </pre>
         *
         * @param {variant} vArg
         *   Any value.
         * @param {string} sMethodName
         *   The name of the method that called this function.
         * @returns {boolean}
         *   Whether <code>vArg</code> is a string. Logs an error message
         *   reporting <code>sMethodName</code> in case <code>vArg</code> is
         *   not a string.
         *
         * @private
         * @since 1.38.0
         */
        _ensureArrayOfObjectOfStrings: function (vArg, sMethodName) {
            var bValidates = jQuery.isArray(vArg) && vArg.every(function (oObject) {
                    return jQuery.isPlainObject(oObject)
                        && Object.keys(oObject).length > 0
                        && Object.keys(oObject).every(function (sKey) {
                            return typeof oObject[sKey] === "string";
                        });
                });

            if (!bValidates) {
                jQuery.sap.log.error(
                    "'" + sMethodName + "' was called with invalid parameters",
                    "An array of non-empty objects with string values is expected",
                    "sap.ushell.ui5service.UserStatus"
                );
            }

            return bValidates;
        },

        /**
         * Ensures that the given argument is a function, logging an error
         * message in case it's not.
         *
         * <pre>
         * IMPORTANT: this method must not rely on its context when called or
         * produce side effects.
         * </pre>
         *
         * @param {variant} vArg
         *   Any value.
         * @param {string} sMethodName
         *   The name of the method that called this function.
         * @returns {boolean}
         *   Whether <code>vArg</code> is a function. Logs an error message
         *   reporting <code>sMethodName</code> in case <code>vArg</code> is
         *   not a function.
         *
         * @private
         * @since 1.38.0
         */
        _ensureFunction: function (vArg, sMethodName) {
            var sType = typeof vArg;
            if (sType !== "function") {
                jQuery.sap.log.error(
                    "'" + sMethodName + "' was called with invalid arguments",
                    "the parameter should be a function, got '" + sType + "' instead",
                    "sap.ushell.ui5service.UserStatus"
                );
                return false;
            }
            return true;
        },

        /**
         * Ensures that the given argument is a string, logging an error
         * message in case it's not.
         *
         * <pre>
         * IMPORTANT: this method must not rely on its context when called or
         * produce side effects.
         * </pre>
         *
         * @param {variant} vArg
         *   Any value.
         * @param {string} sMethodName
         *   The name of the method that called this function.
         * @returns {boolean}
         *   Whether <code>vArg</code> is a string. Logs an error message
         *   reporting <code>sMethodName</code> in case <code>vArg</code> is
         *   not a string.
         *
         * @private
         * @since 1.38.0
         */
        _ensureString: function (vArg, sMethodName) {
            var sType = typeof vArg;
            if (sType !== "string") {
                jQuery.sap.log.error(
                    "'" + sMethodName + "' was called with invalid arguments",
                    "the parameter should be a string, got '" + sType + "' instead",
                    "sap.ushell.ui5service.UserStatus"
                );
                return false;
            }
            return true;
        },
        /**
         * Wraps a given public service interface method with a check that
         * determines whether the method can be called. This helps preventing
         * cases in which calling the method would disrupt the functionality of
         * the currently running app.  For example, this check would prevent a
         * still alive app to change the header title while another app is
         * being displayed.
         *
         * @param {object} oPublicServiceInstance
         *  The instance of the public service interface.
         * @param {string} sPublicServiceMethod
         *  The method to be wrapped with the check.
         *
         * @private
         * @since 1.38.0
         */
        _addCallAllowedCheck: function (oPublicServiceInstance, sPublicServiceMethod) {
            var that = this;
            oPublicServiceInstance[sPublicServiceMethod] = function () {
                var oContext = oPublicServiceInstance.getContext(); // undefined -> don't authorize
                if (!oContext || oContext.scopeObject.getId() !== sActiveComponentId) {
                    jQuery.sap.log.warning(
                        "Call to " + sPublicServiceMethod + " is not allowed",
                        "This may be caused by an app component other than the active '" + sActiveComponentId + "' that tries to call the method",
                        "sap.ushell.ui5service.UserStatus"
                    );
                    return undefined; // eslint
                }

                return that[sPublicServiceMethod].apply(oPublicServiceInstance, arguments);
            };
        },
        /**
         * Adjusts the method of the public service instance.
         * Specifically:
         * <ul>
         * <li>Adds safety checks to public methods</li>
         * <li>Register the component that called <code>.getService</code> as
         *     the currently active component.
         * </ul>
         *
         * @param {sap.ui.base.Interface} oPublicServiceInstance
         *    The public service interface.
         *
         * @private
         * @since 1.38.0
         */
        _amendPublicServiceInstance: function (oPublicServiceInstance) {
            var that = this,
                oContext;

            // attempt to register this as the "active component"

            oContext = oPublicServiceInstance.getContext();
            if (typeof oContext === "undefined") {
                // ServiceFactoryRegistry#get static method was used on the
                // service factory to obtain the service. Don't record the
                // currently active component so that future call from an
                // active app succeed. E.g., on view change.
                //
                return;
            }

            // must re-bind all public methods to the public interface
            // instance, as they would be otherwise called in the context of
            // the service instance.
            ["setStatus", "attachStatusChanged", "detachStatusChanged"].forEach(function (sMethodToSetup) {
                that._addCallAllowedCheck(oPublicServiceInstance, sMethodToSetup);
            });

            if (oContext.scopeType === "component") {
                this._setActiveComponentId(oContext.scopeObject.getId());
                return;
            }

            jQuery.sap.log.error(
                "Invalid context for UserStatus interface",
                "The context must be empty or an object like { scopeType: ..., scopeObject: ... }",
                "sap.ushell.ui5service.UserStatus"
            );
        },

        /**
         * Enable the User Status service (online status)
         *
         * If the user has never agreed to share their online status, then the method will show the opt-in screen to the user.
         * If the user already agreed to share their online status, the setStatus method will be called with the default online status that was set by the user.
         * If the user already declined to share their online status, the setStatus method will be called with a null value.
         *
         * @param {variant} bEnable
         *   boolean.
         *
         * @since 1.46
         *
         * @public
         */
        setEnabled: function (bEnable) {
            oEventProvider.fireEvent(O_EVENT_NAME.serviceStateChanged, {
                data: bEnable
            });

            sap.ushell.ui5service.UserStatus.prototype.isEnabled = bEnable;
            this._getUserStatusSetting().then(function (oUserStatusSetting) {
                if (oUserStatusSetting === undefined || oUserStatusSetting.userStatusEnabled === undefined) {
                    this._showLegalPopup();
                } else if (oUserStatusSetting.userStatusEnabled) {
                    this.setStatus(oUserStatusSetting.userStatusDefault);
                } else if (!oUserStatusSetting.userStatusEnabled) {
                    this.setStatus(null);
                }
            }.bind(this));
            return;
        },

        /**
         * Attaches an event handler fnFunction to be called upon the 'serviceStateChanged' event.
         * Event is fired when the setEnabled method is called.
         *
         * @param {function} [fnFunction]
         *  The function to be called when the event occurs.
         * @since 1.46
         *
         * @private
         */
        attachEnabledStatusChanged: function (fnFunction) {
            this._getEventProvider().attachEvent(O_EVENT_NAME.serviceStateChanged, fnFunction);
        },

        /**
         * Detaches an event handler from the 'serviceStateChanged' event.
         *
         * @param  {function} fnFunction
         *     Event handler to be detached.
         *
         * @name detachEnabledStatusChanged
         * @since 1.46
         * @private
         */
        detachEnabledStatusChanged: function (fnFunction) {
            this._getEventProvider().detachEvent(O_EVENT_NAME.serviceStateChanged, fnFunction);
        },

        /**
         * Publish the user status.
         * This method is used to publish the status to other components.
         *
         * The publication of the status by firing the 'statusChanged' event will happen when all the following apply:
         * 1) the User Status service is enabled
         * 2) the status is null or exists in the list of available statuses (sap.ushell.ui5service.UserStatus.prototype.AvailableStatus)
         * 3) the user has agreed to share their online status
         *
         * @param {variant} oNewStatus
         *   sap.ushell.ui5service.UserStatus.prototype.AvailableStatus
         *
         * @since 1.46
         * @public
         */
        setStatus: function (oNewStatus) {
            if (!sap.ushell.ui5service.UserStatus.prototype.isEnabled) {
                throw new Error("Unable to change status because the UserStatus service is disabled.");
            }

            if (!sap.ushell.ui5service.UserStatus.prototype.AvailableStatus[oNewStatus] && oNewStatus !== null) {
                throw new Error("Enter a valid status.");
            }

            this._getUserStatusSetting().then(function (oUserStatusSetting) {
                if ((oNewStatus !== null) &&
                    (oUserStatusSetting === undefined || oUserStatusSetting.userStatusEnabled === undefined || !oUserStatusSetting.userStatusEnabled )) {
                    throw new Error("Unable to change status; user has not explicitly opted-in to share their online status.");
                }
                oEventProvider.fireEvent(O_EVENT_NAME.statusChanged, {
                    data: oNewStatus
                });
                return;
            })
        },


        /**
         * Returns version number in use (e.g. 2 for Fiori 2.0). Will be used
         * for checking whether the Fiori 2.0 header should be used or not.
         *
         * @returns {number}
         *    the version number
         *
         * @since 1.38.0
         * @private
         */
        getUxdVersion: function () {
            // use 1.37.0 to include cases where the snapshot is used
            if ((new jQuery.sap.Version(sap.ui.version).compareTo("1.37.0")) >= 0) {
                return 2;
            }
            return 1;
        },
        /**
         * Attaches an event handler fnFunction to be called upon the 'statusChanged' event.
         * Event is fired when the setStatus method is called.
         *
         * @param {function} [fnFunction]
         *  The function to be called when the event occurs.
         * @since 1.46
         *
         * @public
         */
        attachStatusChanged: function (fnFunction) {
            this._getEventProvider().attachEvent(O_EVENT_NAME.statusChanged, fnFunction);
        },
        /**
         * Detaches an event handler from the 'statusChanged' event.
         *
         * @param  {function} fnFunction
         *     Event handler to be detached.
         *
         * @since 1.46
         * @public
         */
        detachStatusChanged: function (fnFunction) {
            this._getEventProvider().detachEvent(O_EVENT_NAME.statusChanged, fnFunction);
        },
        /**
         * Returns sap.ushell.ui.launchpad.UserStatusItem that by click open popover with dropdown list of all available statuses
         *
         * @returns {sap.ushell.ui.launchpad.UserStatusItem}
         * @param {String} sUserStatus default user status
         * @since 1.46.0
         * @private
         */
        _getOnlineStatusPopOver: function (sUserStatus) {

            var oPopover = new sap.m.Popover({
                placement: sap.m.PlacementType.Bottom,
                showArrow: true,
                showHeader: false,
                content: [
                    new sap.ushell.ui.launchpad.UserStatusItem({
                        status: sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.AVAILABLE,
                        isOpener: false,
                        press: function (oEvent) {
                            oUserStatusButton.setStatus(sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.AVAILABLE);
                            oPopover.close();
                        }
                    }).addStyleClass('sapUserStatusContainer'),
                    new sap.ushell.ui.launchpad.UserStatusItem({
                        status: sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.AWAY,
                        isOpener: false,
                        press: function (oEvent) {
                            oUserStatusButton.setStatus(sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.AWAY);
                            oPopover.close();
                        }
                    }).addStyleClass('sapUserStatusContainer'),
                    new sap.ushell.ui.launchpad.UserStatusItem({
                        status: sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.BUSY,
                        isOpener: false,
                        press: function (oEvent) {
                            oUserStatusButton.setStatus(sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.BUSY);
                            oPopover.close();
                        }
                    }).addStyleClass('sapUserStatusContainer'),
                    new sap.ushell.ui.launchpad.UserStatusItem({
                        status: sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.APPEAR_OFFLINE,
                        isOpener: false,
                        press: function (oEvent) {
                            oUserStatusButton.setStatus(sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.APPEAR_OFFLINE);
                            oPopover.close();
                        }
                    }).addStyleClass('sapUserStatusContainer')
                ]
            });

            var oUserStatusButton = new sap.ushell.ui.launchpad.UserStatusItem({
                tooltip: "{i18n>headerActionsTooltip}",
                enabled: false,
                ariaLabel: sap.ushell.Container.getUser().getFullName(),
                image: sap.ui.core.IconPool.getIconURI("account"),
                status: sUserStatus ? sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM[sUserStatus] : sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM["AVAILABLE"],
                press: function (oEvent) {
                    var oButton = sap.ui.getCore().byId(oEvent.mParameters.id);
                    oPopover.openBy(oButton);
                }.bind(this),
                contentList: oPopover
            }).addStyleClass('sapUserStatusOpener');

            return oUserStatusButton
        },
        /**
         * open a dialog box with legal popup in case its the first time the user use flp
         *          *
         *
         * @since 1.46.0
         * @private
         */
        _showLegalPopup: function () {
            var that = this;
            setTimeout(function () {
                var sTextAlign = sap.ui.getCore().getConfiguration().getRTL() ? 'Left' : 'Right';
                var sEnableLabelWidth = sap.ui.Device.system.phone ? "auto" : "14rem";
                var sStatusLabelWidth = sap.ui.Device.system.phone ? "auto" : "10rem";

                var enableStatusLabel = new sap.m.Label({
                    text: sap.ushell.resources.i18n.getText("enableStatusMessageBoxFld") + ":",
                    width: sEnableLabelWidth,
                    textAlign: sTextAlign
                });
                var enableStatusSwitch = new sap.m.Switch("enableStatusSwitch", {
                    type: sap.m.SwitchType.Default,
                    change: function (oEvent) {
                        signInAsPopOver.setEnabled(oEvent.mParameters.state);
                        jQuery("#" + signInAsPopOver.getId()).attr("tabindex", oEvent.mParameters.state ? 0 : -1);
                    }.bind(this)
                });
                var fboxEnableStatus = new sap.m.FlexBox({
                    alignItems: 'Center',
                    direction: 'Row',
                    items: [
                        enableStatusLabel,
                        enableStatusSwitch
                    ]
                }).addStyleClass('sapUshellUserStatusFlexBox');

                var signInAsLabel = new sap.m.Label({
                    text: sap.ushell.resources.i18n.getText("userStatusMessageBoxDropdownLabelFld") + ":",
                    width: sStatusLabelWidth,
                    textAlign: sTextAlign
                }).addStyleClass("sapUshellUserStatusSignInAsLabel");
                var signInAsPopOver = that._getOnlineStatusPopOver(sap.ushell.ui.launchpad.UserStatusItem.prototype.STATUS_ENUM.AVAILABLE.status);
                jQuery("#" + signInAsPopOver.getId()).attr("tabindex", signInAsPopOver.getEnabled() ? 0 : -1);
                var legalTextLine1 = new sap.m.Text({
                    text: sap.ushell.resources.i18n.getText("userStatusMessageBoxInfoTextLine1")
                }).addStyleClass('sapUshellUserStatusLegalTextLine').addStyleClass('sapUshellUserStatusLegalTextFirstLine');
                var legalTextLine2 = new sap.m.Text({
                    text: sap.ushell.resources.i18n.getText("userStatusMessageBoxInfoTextLine2")
                }).addStyleClass('sapUshellUserStatusLegalTextLine');
                var fboxStatusPopOver = new sap.m.FlexBox({
                    alignItems: 'Center',
                    direction: 'Row',
                    items: [
                        signInAsLabel,
                        signInAsPopOver
                    ]
                }).addStyleClass('sapUshellUserStatusFlexBox');
                var layout = new sap.ui.layout.VerticalLayout('userStatusDialogLayout', {
                    content: [fboxEnableStatus, fboxStatusPopOver, legalTextLine1, legalTextLine2]
                });

                var saveButton = new sap.m.Button('saveButton', {
                    text: sap.ushell.resources.i18n.getText("okBtn"),
                    press: function () {
                        that._writeUserStatusSettingToPersonalization({
                            userStatusEnabled: enableStatusSwitch.getState(),
                            userStatusDefault: enableStatusSwitch.getState() ? signInAsPopOver.getStatus().status : null
                        });
                        that.setStatus(enableStatusSwitch.getState() ? signInAsPopOver.getStatus().status : null);
                        dialog.close();
                    }
                });

                var dialog = new sap.m.Dialog('agreementMessageBox', {
                    title: sap.ushell.resources.i18n.getText("userStatusAgreementMessageBoxTitle"),
                    modal: true,
                    stretch: sap.ui.Device.system.phone,
                    buttons: [saveButton],
                    afterClose: function (e) {
                        that._getUserStatusSetting().then(function (oUserStatusSetting) {
                            if (oUserStatusSetting === undefined || oUserStatusSetting.userStatusEnabled === undefined) {
                                that._writeUserStatusSettingToPersonalization({
                                    userStatusEnabled: false,
                                    userStatusDefault: null
                                });
                                that.setStatus(null);
                            }
                            dialog.destroy();
                        })
                    }
                }).addStyleClass('sapUshellUserStatusDialog');
                dialog.addContent(layout);
                dialog.open();
            }, 100);
        },
        /**
         * @since 1.46.0
         * @private
         */
        _getUserStatusSetting: function () {
            var personalizer = this._getUserSettingsPersonalizer();
            return personalizer.getPersData();
        },
        /**
         * Returns promise for set user status setting for a user on personalization service.
         * @param {object} oUserStatusSetting. in the format of {userStatusEnabled: bEnabled, userStatusDefault: sDefaultStatus}
         * @returns {promise}
         * @since 1.46.0
         * @private
         */
        _writeUserStatusSettingToPersonalization: function (oUserStatusSetting) {
            var oDeferred,
                oPromise;

            try {
                oPromise = this._getUserSettingsPersonalizer().setPersData(oUserStatusSetting);
            } catch (err) {
                jQuery.sap.log.error("Personalization service does not work:");
                jQuery.sap.log.error(err.name + ": " + err.message);
                oDeferred = new jQuery.Deferred();
                oDeferred.reject(err);
                oPromise = oDeferred.promise();
            }
            return oPromise;
        },

        /**
         * If the instance of Personalizer (oUserSettingsPersonalizer) is not yet defined - then create it
         * and return oUserSettingsPersonalizer
         * @since 1.46.0
         * @private
         */
        _getUserSettingsPersonalizer: function () {
            this.oUserPersonalizer = this._createUserPersonalizer();
            return this.oUserPersonalizer;
        },
        /**
         * @since 1.46.0
         * @private
         */
        _createUserPersonalizer: function () {
            var oPersonalizationService = sap.ushell.Container.getService("Personalization"),
                oComponent,
                oScope = {
                    keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                    writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                    clientStorageAllowed: true
                },
                oPersId = {
                    container: "sap.ushell.services.UserStatus",
                    item: "userStatusData"
                },
                oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);

            return oPersonalizer;
        }
    });
}());
