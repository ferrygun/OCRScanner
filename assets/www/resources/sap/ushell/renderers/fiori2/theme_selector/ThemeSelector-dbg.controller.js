// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function () {
    "use strict";

    /*global jQuery, sap, setTimeout, clearTimeout */
    /*jslint plusplus: true, nomen: true */
    sap.ui.controller("sap.ushell.renderers.fiori2.theme_selector.ThemeSelector", {
        onInit: function () {
            try {
                this.userInfoService = sap.ushell.Container.getService("UserInfo");
                this.oUser = this.userInfoService.getUser();
            } catch (e) {
                jQuery.sap.log.error("Getting UserInfo service failed.");
                this.oUser = sap.ushell.Container.getUser();
            }


            this.currentThemeId = this.oUser.getTheme();
            this.origThemeId = this.currentThemeId;
            this.aThemeList = null;
            this.isContentLoaded = false;
            this.aSapThemeMap = {
                "base": "sapUshellBaseIconStyle",
                "sap_bluecrystal": "sapUshellBlueCrystalIconStyle",
                "sap_belize_hcb": "sapUshellHCBIconStyle",
                "sap_belize_hcw": "sapUshellHCWIconStyle",
                "sap_belize": "sapUshellBelizeIconStyle",
                "sap_belize_plus": "sapUshellPlusIconStyle"
            };
        },
        getConfigurationModel: function () {
            var oConfModel = new sap.ui.model.json.JSONModel({});
            var animationModeOnModel = this.getView().getModel() ? this.getView().getModel().getProperty("/animationMode") : undefined ;
            this.originalAnimationModeKey = animationModeOnModel ? animationModeOnModel : "full";
            this.currentAnimationModeKey = this.originalAnimationModeKey;

            oConfModel.setData({
                isRTL: sap.ui.getCore().getConfiguration().getRTL(),
                sapUiContentIconColor: sap.ui.core.theming.Parameters.get('sapUiContentIconColor'),
                isContentDensitySwitchEnable: this.isContentDensitySwitchEnable(),
                flexAlignItems: 'Center',
                textAlign: sap.ui.Device.system.phone ? 'Left' : 'Right',
                textDirection: 'Row',
                labelWidth: 'auto',
                isCozyContentMode: this.isCozyContentMode(),



                animationMode: this.currentAnimationModeKey
            });
            return oConfModel;
        },
        _getIsChangeThemePermitted: function () {
            return this.oUser.isSetThemePermitted();
        },
        onAfterRendering: function () {
            var oList = sap.ui.getCore().byId("userPrefThemeSelector--themeList"),
                items = oList.getItems(),
                oIcon,
                sThemeId,
                that = this;

            oList.toggleStyleClass("sapUshellThemeListDisabled", !this.isListActive());
            items.forEach(function (oListItem) {
                sThemeId = oListItem.getCustomData()[0].getValue();
                oIcon = oListItem.getContent()[0].getItems()[0].getItems()[0];
                if (!that.isListActive()) {
                    oListItem.isSelectable = function () {
                        return false;
                    };
                }
                if (sThemeId === that.currentThemeId) {
                    oListItem.setSelected(true);
                    if (!that.isListActive()) {
                        oListItem.toggleStyleClass("sapUshellThemeListItemSelected", true);
                    }
                } else {
                    oListItem.setSelected(false);
                }

                oIcon.addStyleClass(that.aSapThemeMap[sThemeId]);
                oIcon.toggleStyleClass("sapUshellHCBIconStyleOnHCB", sThemeId === that.currentThemeId && sThemeId === "sap_belize_hcb");
                oIcon.toggleStyleClass("sapUshellHCWIconStyleOnHCW", that.currentThemeId !== "sap_belize_hcb" && sThemeId === "sap_belize_hcw");
            });
            var contentDensitySwitch = sap.ui.getCore().byId("userPrefThemeSelector--contentDensitySwitch");
            if (contentDensitySwitch) {
                contentDensitySwitch.setState(this.currentContentDensity === "cozy");
                contentDensitySwitch.setEnabled(this.isContentDensitySwitchEnable());
            }
            //Add role 'list' to avoid screen-readres 'table' anouncment.
            jQuery('.sapUshellAppearanceTable > table').attr('role', 'list');
        },
        getContent: function () {
            var that = this;
            var deferred = jQuery.Deferred();
            var oResourceModel = sap.ushell.resources.getTranslationModel();
            this.getView().setModel(oResourceModel, "i18n");
            this.getView().setModel(this.getConfigurationModel(), "config");

            if (this.isContentDensitySwitchEnable()) {
                this.origContentDensity = this.currentContentDensity;
                if (this.oUser.getContentDensity()) {
                    this.currentContentDensity = this.oUser.getContentDensity();
                } else {
                    this.currentContentDensity = "cozy";
                }
            }
            if (this.isContentLoaded === true) {
                deferred.resolve(this.getView());
            } else {
                var dfdThemeList = this._getThemeList();
                dfdThemeList.done(function (aThemeList) {
                    if (aThemeList.length > 0) {
                        // Sort the array of themes according to theme name
                        aThemeList.sort(function (theme1, theme2) {
                            var theme1Name = theme1.name,
                                theme2Name = theme2.name;
                            if (theme1Name < theme2Name) { //sort string ascending
                                return -1;
                            }
                            if (theme1Name > theme2Name) {
                                return 1;
                            }
                            return 0; //default return value (no sorting)
                        });
                        //set theme selection
                        for (var i = 0; i < aThemeList.length; i++) {
                            if (aThemeList[i].id == that.currentThemeId) {
                                aThemeList[i].isSelected = true;
                            } else {
                                aThemeList[i].isSelected = false;
                            }
                        }
                        that.getView().getModel().setProperty("/options", aThemeList);
                        deferred.resolve(that.getView());
                    } else {
                        deferred.reject();
                    }
                });

                dfdThemeList.fail(function () {
                    deferred.reject();
                });
            }

            return deferred.promise();
        },

        getValue: function () {
            var deferred = jQuery.Deferred();
            var themeListPromise = this._getThemeList();
            var that = this;
            var themeName;

            themeListPromise.done(function (aThemeList) {
                that.aThemeList = aThemeList;
                themeName = that._getThemeNameById(that.currentThemeId);
                deferred.resolve(themeName);
            });

            themeListPromise.fail(function (sErrorMessage) {
                deferred.reject(sErrorMessage);
            });

            return deferred.promise();
        },

        onCancel: function () {
            this.currentThemeId = this.oUser.getTheme();
            if (this.isContentDensitySwitchEnable()) {
                this.currentContentDensity = this.oUser.getContentDensity();
            }
            this.currentAnimationModeKey = this.originalAnimationModeKey;
            var animationModeCombo = sap.ui.getCore().byId("userPrefThemeSelector--animationModeCombo");
            if (animationModeCombo) {
                animationModeCombo.setSelectedKey(this.originalAnimationModeKey);
            }
        },

        onSave: function () {
            var oResultDeferred = jQuery.Deferred(),
                oWhenPromise,
                aPromiseArray = [],
                iTotalPromisesCount = 0,
                iSuccessCount = 0,
                iFailureCount = 0,
                aFailureMsgArr = [],
                that= this,
                saveDoneFunc = function () {
                    iSuccessCount++;
                    oResultDeferred.notify();
                },
                saveDoneAnimationFunc = function () {
                    iSuccessCount++;
                    oResultDeferred.notify();
                    that.getView().getModel().setProperty("/animationMode", that.currentAnimationModeKey);
                    that.originalAnimationModeKey = that.currentAnimationModeKey;
                },
                saveFailFunc = function (err) {
                    aFailureMsgArr.push({
                        entry: "currEntryTitle",
                        message: err
                    });
                    iFailureCount++;
                    oResultDeferred.notify();
                };

            var oThmemePromise = this.onSaveThemes();
            oThmemePromise.done(saveDoneFunc);
            oThmemePromise.fail(saveFailFunc);
            aPromiseArray.push(oThmemePromise);

            if (this.currentAnimationModeKey !== this.originalAnimationModeKey) {
                var oAnimationModePromise = this.writeUserAnimationModeToPersonalization(this.currentAnimationModeKey);
                oAnimationModePromise.done(saveDoneAnimationFunc);
                oAnimationModePromise.fail(saveFailFunc);
                aPromiseArray.push(oAnimationModePromise);
            }
            if (this.isContentDensitySwitchEnable()) {
                var oContentDensityPromise = this.onSaveContentDensity();
                oContentDensityPromise.done(saveDoneFunc);
                oContentDensityPromise.fail(saveFailFunc);
                aPromiseArray.push(oContentDensityPromise);
            }

            oWhenPromise = jQuery.when.apply(null, aPromiseArray);

            oWhenPromise.done(function () {
                oResultDeferred.resolve();
            });

            oResultDeferred.progress(function () {
                if (iFailureCount > 0 && (iFailureCount + iSuccessCount === iTotalPromisesCount)) {
                    oResultDeferred.reject("At least one save action failed");
                }
            });

            return oResultDeferred.promise();
        },
        onSaveThemes: function () {
            var deferred = jQuery.Deferred();
            var oUserPreferencesPromise;

            if (this.oUser.getTheme() != this.currentThemeId && this.isListActive()) {//only if there was a change we would like to save it
                // Apply the selected theme
                if (this.currentThemeId) {
                    this.oUser.setTheme(this.currentThemeId);

                    oUserPreferencesPromise = this.userInfoService.updateUserPreferences(this.oUser);

                    oUserPreferencesPromise.done(function () {
                        this.origThemeId = this.currentThemeId;
                        this.oUser.resetChangedProperties();
                        deferred.resolve();
                    }.bind(this));

                    oUserPreferencesPromise.fail(function (sErrorMessage) {
                        // Apply the previous theme to the user
                        this.oUser.setTheme(this.origThemeId);
                        this.oUser.resetChangedProperties();
                        this.currentThemeId = this.origThemeId;

                        jQuery.sap.log.error(sErrorMessage);
                        deferred.reject(sErrorMessage);
                    }.bind(this));
                } else {
                    deferred.reject("Could not find theme: " + this.currentThemeId);
                }
            } else {
                deferred.resolve();//No theme change, do nothing
            }

            return deferred.promise();
        },

        _getThemeList: function () {
            var deferred = jQuery.Deferred(),
                that = this;

            if (!this.aThemeList) {
                var getThemesPromise = this.userInfoService.getThemeList();

                getThemesPromise.done(function (oData) {
                    that.aThemeList = oData.options;
                    if (that._getIsChangeThemePermitted() == false) {
                        that.aThemeList = [
                            {
                                id: that.currentThemeId,
                                name: that._getThemeNameById(that.currentThemeId)
                            }
                        ];
                    }

                    deferred.resolve(that.aThemeList);
                });

                getThemesPromise.fail(function () {
                    deferred.reject("Failed to load theme list.");
                });
            } else {
                deferred.resolve(this.aThemeList);
            }

            return deferred.promise();
        },

        getCurrentThemeId: function () {
            return this.currentThemeId;
        },

        setCurrentThemeId: function (newThemeId) {
            this.currentThemeId = newThemeId;
        },

        _getThemeNameById: function (themeId) {
            if (this.aThemeList) {
                for (var i = 0; i < this.aThemeList.length; i++) {
                    if (this.aThemeList[i].id == themeId) {
                        return this.aThemeList[i].name;
                    }
                }
            }
            //fallback in case relevant theme not found
            return themeId;
        },
        onSaveContentDensity: function () {
            var deferred = jQuery.Deferred();
            var oUserPreferencesPromise;

            if (this.oUser.getContentDensity() != this.currentContentDensity && this.isContentDensitySwitchEnable()) {//only if there was a change we would like to save it
                // Apply the selected mode
                if (this.currentContentDensity) {
                    this.oUser.setContentDensity(this.currentContentDensity);
                    oUserPreferencesPromise = this.userInfoService.updateUserPreferences(this.oUser);
                    oUserPreferencesPromise.done(function () {
                        this.oUser.resetChangedProperties();
                        this.origContentDensity = this.currentContentDensity;
                        sap.ui.getCore().getEventBus().publish("launchpad", "toggleContentDensity", {contentDensity: this.currentContentDensity});
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

        isCozyContentMode: function () {
            return jQuery("body.sapUiSizeCozy").length ? true : false;

        },

        setCurrentContentDensity: function (e) {
            var newContentDensityId = e.getSource().getState() ? "cozy" : "compact";
            this.currentContentDensity = newContentDensityId;

        },
        setCurrentAnimationMode: function (e) {
            var newAnimationModeKey = e.getSource().getSelectedKey();
            this.currentAnimationModeKey = newAnimationModeKey;

        },
        getIconFormatter: function (themeId) {
            if (this.aSapThemeMap[themeId]) {
                return "";
            } else {
                return "sap-icon://palette";
            }
        },
        onSelectHandler: function (oEvent) {
            var oItem = oEvent.getParameters().listItem;
            this.setCurrentThemeId(oItem.getBindingContext().getProperty("id"));

        },
        isContentDensitySwitchEnable: function () {
            return sap.ui.Device.system.combi && this.getView().getModel().getProperty("/contentDensity") && this.oUser.isSetContentDensityPermitted();
        },
        isListActive: function () {
            return this.getView().getModel().getProperty("/setTheme");
        },
        getUserStatusSetting: function () {
            var personalizer = this._getUserSettingsPersonalizer();
            return personalizer.getPersData();
        },
        writeUserAnimationModeToPersonalization: function (oUserAnimationMode) {
            var oDeferred,
                oPromise;

            try {
                oPromise = this.getPersonalizer().setPersData(oUserAnimationMode);
            } catch (err) {
                jQuery.sap.log.error("Personalization service does not work:");
                jQuery.sap.log.error(err.name + ": " + err.message);
                oDeferred = new jQuery.Deferred();
                oDeferred.reject(err);
                oPromise = oDeferred.promise();
            }
            return oPromise;
        },
        getPersonalizer: function () {
            if (this.oPersonalizer) {
                return this.oPersonalizer;
            }
            var oPersonalizationService = sap.ushell.Container.getService("Personalization");
            var oComponent = sap.ui.core.Component.getOwnerComponentFor(this);
            var oScope = {
                keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed: true
            };

            var oPersId = {
                container: "flp.launchpad.animation.mode",
                item: "animationMode"
            };

            this.oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
            return this.oPersonalizer;
        }
    });


}, /* bExport= */ false);
