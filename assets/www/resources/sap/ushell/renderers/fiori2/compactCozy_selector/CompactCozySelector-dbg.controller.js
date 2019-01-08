// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, setTimeout, clearTimeout */
    /*jslint plusplus: true, nomen: true */
    sap.ui.controller("sap.ushell.renderers.fiori2.compactCozy_selector.CompactCozySelector", {

        onInit: function () {
            try {
               this.userInfoService = sap.ushell.Container.getService("UserInfo");
               this.oUser = this.userInfoService.getUser();
            } catch (e) {
                jQuery.sap.log.error("Getting UserInfo service failed.");
                this.oUser = sap.ushell.Container.getUser();
            }
            this.translationBundle = sap.ushell.resources.i18n;
            //TODO modify this to ork with last value
            this.oModel = new sap.ui.model.json.JSONModel({options: [{id: "cozy", name: this.translationBundle.getText("cozy"), isSelected: true}, {id: "compact",name: this.translationBundle.getText("compact"), isSelected: false}]});
            this.getView().setModel(this.oModel);

            this.currentContentDensity = this.oUser.getContentDensity();
            this.origContentDensity = this.currentContentDensity;
            this.isContentLoaded = false;
        },

        getContent: function () {
            //set density selection
            var aOptions = this.oModel.getProperty("/options");
            for (var i = 0; i < aOptions.length; i++) {
                if (aOptions[i].id == this.currentContentDensity) {
                    aOptions[i].isSelected = true;
                } else {
                    aOptions[i].isSelected = false;
                }
            }

            this.oModel.setProperty("/options", aOptions);

            return jQuery.Deferred().resolve(this.getView());
        },

        getValue: function () {
            return jQuery.Deferred().resolve(this._getModeNameById(this.currentContentDensity));
        },

        onCancel: function () {
            this.currentContentDensity = this.oUser.getContentDensity();
        },

        onSave: function () {
            var deferred = jQuery.Deferred();
            var oUserPreferencesPromise;

            if (this.oUser.getContentDensity() != this.currentContentDensity) {//only if there was a change we would like to save it
                // Apply the selected mode
                if (this.currentContentDensity) {
                    this.oUser.setContentDensity(this.currentContentDensity);
                    oUserPreferencesPromise = this.userInfoService.updateUserPreferences(this.oUser);
                    oUserPreferencesPromise.done(function () {
                        this.oUser.resetChangedProperties();
                        this.origContentDensity = this.currentContentDensity;
                        sap.ui.getCore().getEventBus().publish("launchpad","toggleContentDensity", { contentDensity : this.currentContentDensity});
                        deferred.resolve();
                    }.bind(this));

                    oUserPreferencesPromise.fail(function (sErrorMessage) {
                        // Apply the previous display density to the user
                        this.oUser.setContentDensity(this.origContentDensity);
                        this.oUser.resetChangedProperties();
                        this.currentContentDensity = this.origContentDensity;
                        jQuery.sap.log.error(sErrorMessage);

                        deferred.reject(sErrorMessage);
                    }.bind(this));
                } else {
                    deferred.reject("Could not find mode: " + this.currentContentDensity);
                }
            } else {
                deferred.resolve();//No mode change, do nothing
            }

            return deferred.promise();
        },

        getCurrentContentDensity: function () {
            return this.currentContentDensity;
        },

        setCurrentContentDensity: function (newContentDensityId) {
            this.currentContentDensity = newContentDensityId;

        },

        _getModeNameById: function (contentDensityId) {
            var aDensitiesList = this.getModel().getProperty('/options');

            for (var i = 0; i < aDensitiesList.length; i++) {
                if (aDensitiesList[i].id == contentDensityId) {
                    return aDensitiesList[i].name;
                }
            }

            //fallback in case relevant content density not found
            return contentDensityId;
        },

        getModel: function () {
            return this.oModel;
        }
    });


}, /* bExport= */ true);
