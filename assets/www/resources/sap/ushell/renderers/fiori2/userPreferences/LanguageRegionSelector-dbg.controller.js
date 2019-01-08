// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, setTimeout, clearTimeout */
    /*jslint plusplus: true, nomen: true */
    sap.ui.controller("sap.ushell.renderers.fiori2.userPreferences.LanguageRegionSelector", {

        onInit: function () {
            try {
                this.userInfoService = sap.ushell.Container.getService("UserInfo");
                this.oUser = this.userInfoService.getUser();
            } catch (e) {
                jQuery.sap.log.error("Getting UserInfo service failed.");
                this.oUser = sap.ushell.Container.getUser();
            }
            this.bIsSetLanguage = sap.ushell.Container.getRenderer('fiori2').getModelConfiguration().enableSetLanguage;
            this.isLanguageChanged = false;
            this.isLanguagePersonalized = this.oUser.isLanguagePersonalized();
            this.sLanguage = this._getFormatedLanguage(this.oUser.getLanguage());
            this.aLanguageList = null;
            var oView = this.getView();
            var oModel = new sap.ui.model.json.JSONModel();
            var modelData = {
                languageList: [{text: this.sLanguage, key: this.sLanguage}],
                selectedLanguage: this.sLanguage
            };
            var oLocale = sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale();
            var oLocaleData = sap.ui.core.LocaleData.getInstance(oLocale);
            var sDatePattern = oLocaleData.getDatePattern("medium"),
                sTimePattern = oLocaleData.getTimePattern("medium"),
                sTimeFormat = (sTimePattern.indexOf("H") === -1) ? "12h" : "24h" ;

            modelData.datePatternList = [{text: sDatePattern, key: sDatePattern}];
            modelData.timeFormat = sTimeFormat;
            modelData.selectedDatePattern = sDatePattern;
            var hourButtons = this.oView.hourFormatSegmentedButton.getButtons();
            var selectedButton = (sTimeFormat==="12h") ? hourButtons[0] : hourButtons[1];
            this.oView.hourFormatSegmentedButton.setSelectedButton(selectedButton);
            oModel.setData(modelData);
            this.oView.setModel(oModel);
        },

        getContent: function () { 
            var oDfd = jQuery.Deferred();
            var that = this;
            // if feature - show drop down with all languages.
            // if feature isn't disable - show read only text with current user language
            // if platform didn't implement this feature - enableSetLanguage == undefined - act like disable
            if(this.bIsSetLanguage){
                jQuery.sap.measure.start("FLP:LanguageRegionSelector.getContent", "getContent","FLP");
                var dfdLanguageList = this._getLanguagesList();
                dfdLanguageList.done(function (aLanguageList){
                    // check the response isn't empty   
                    if(aLanguageList){
                        if(aLanguageList.length > 1){
                            if(!that.isLanguagePersonalized){
                                that.getView().getModel().setProperty("/selectedLanguage","default");
                            }else{
                                that.getView().getModel().setProperty("/selectedLanguage",that.oUser.getLanguage());
                            }
                            // by default of UI5 the size is limit to 100 , there can be more then that in our case
                            // so we adjust it to the platform support.
                            that.getView().getModel().setSizeLimit(aLanguageList.length);
                            that.getView().getModel().setProperty("/languageList",aLanguageList);
                            that.oView.inputLanguage.setVisible(false);
                            that.oView.selectLanguage.setVisible(true);
                            that.oView.helpingText.setVisible(true);
                            that.oView.helpingTextLabel.setVisible(true);
                        }
                    }
                    jQuery.sap.measure.end("FLP:LanguageRegionSelector.getContent");
                    oDfd.resolve(that.getView());
                });
                // in case of failure - - show read only text with current user language
                dfdLanguageList.fail(function (sErrorMessage) {
                    jQuery.sap.log.error(sErrorMessage);
                    oDfd.resolve(that.getView());
                });
            }else{
                oDfd.resolve(that.getView());
            }
            return oDfd.promise();
        },

        getValue: function () {
            var oDfd = jQuery.Deferred();
            var sSelectedLanguage = this.getView().getModel().getProperty("/selectedLanguage");
            var sUserLanguage = this.oUser.getLanguage();
            // if the language is default - we want to present the local instead of "DEFAULT"
            if(sSelectedLanguage == "default"){
                oDfd.resolve(this._getFormatedLanguage(sUserLanguage) +" | "+ sap.ushell.resources.i18n.getText("timeFormatFld")+ ": "+ this.getView().getModel().getProperty("/timeFormat"));
            }else{
                oDfd.resolve(this._getFormatedLanguage(sSelectedLanguage) +" | "+ sap.ushell.resources.i18n.getText("timeFormatFld")+ ": "+ this.getView().getModel().getProperty("/timeFormat"));
            }

            return oDfd.promise();
        },

        onCancel: function () {
            var oDfd = jQuery.Deferred();
            if(this.bIsSetLanguage){
                this.isLanguageChanged = false;
                var sSelectedLanguage = this.getView().getModel().getProperty("/selectedLanguage");
                //only if there was a change
                if(!this.isLanguagePersonalized || this.oUser.getLanguage() != sSelectedLanguage){
                    this._handleSelectChange(this.oUser.getLanguage(), "Cancel");
                    oDfd.resolve();
                }else{
                    oDfd.resolve();
                }
            }else{
                oDfd.resolve();
            }

            return oDfd.promise();
        },

        onSave: function () {
            var oDfd = jQuery.Deferred();
            var oUserPreferencesPromise;
            var sOriginLanguage;
            var sSelectedLanguage = this.getView().getModel().getProperty("/selectedLanguage");
                //only if there was a change
                if(this.isLanguageChanged){
                    if(sSelectedLanguage){
                        sOriginLanguage = this.oUser.getLanguage();
                        this.oUser.setLanguage(sSelectedLanguage);
                        oUserPreferencesPromise = this.userInfoService.updateUserPreferences(this.oUser)
                        .done(function () {
                            oDfd.resolve();
                            window.location.reload(); //refresh the page to apply changes.
                        }.bind(this))
                            // in case of failure - return to the original language
                        .fail(function (sErrorMessage) {
                                this.oUser.setLanguage(sOriginLanguage);
                                this._handleSelectChange(sOriginLanguage,"Cancel");
                                jQuery.sap.log.error(sErrorMessage);
                                oDfd.reject(sErrorMessage);
                            }.bind(this));
                    }
                }else{
                    oDfd.resolve();
                }
            return oDfd.promise();
        },

        _getFormatedLanguage: function (sLanguage) {
            //In case the language value is with region - for example 'en-us', the value would be 'EN (us)'. Otherwise, the value will be 'EN'.
            if (sLanguage && sLanguage.indexOf('-') > -1) {
                sLanguage = sLanguage.replace('-', ' (').concat(')').toUpperCase();
            } else if (sLanguage) {
                sLanguage = sLanguage.toUpperCase();
            }
            return sLanguage;
        },

        /**
         *  This method call handle the change in the selection language
         *  It call in two cases:
         *  Save - the language should be saved on model
         *  Cancel - the original selection(language) should be retrieve.
         * @param sLanguage
         * @param sMode - can be "Save" or "Cancel"
         * @private
         */
        _handleSelectChange : function(sLanguage, sMode){
            var oLocale = new sap.ui.core.Locale(sLanguage);
            var oLocaleData = sap.ui.core.LocaleData.getInstance(oLocale);
            var sDatePattern = oLocaleData.getDatePattern("medium"),
                sTimePattern = oLocaleData.getTimePattern("medium"),
                sTimeFormat = (sTimePattern.indexOf("H") === -1) ? "12h" : "24h" ;
            this.isLanguageChanged = true;
            if(sMode == "Cancel"){
                // if the user language isn't personalzied - need to reurtn browser language
                if(!this.isLanguagePersonalized){
                    this.getView().selectLanguage.setSelectedKey("default");
                }else{
                    this.getView().selectLanguage.setSelectedKey(sLanguage);
                }
                this.isLanguageChanged = false;
            }
            this.getView().comboDate.setValue(sDatePattern);
            var hourButtons = this.getView().hourFormatSegmentedButton.getButtons();
            var selectedButton = (sTimeFormat==="12h") ? hourButtons[0] : hourButtons[1];
            this.getView().hourFormatSegmentedButton.setSelectedButton(selectedButton);

        },

        /**
         * Returns the language list from the platforms , triggered userInfoService API for it.
         * @returns {*}
         * @private
         */
        _getLanguagesList: function () {
            var that = this;
            var oResultDeferred = jQuery.Deferred();
            // get the list only we haven't get it until now
            if (this.aLanguageList == null) {
                    jQuery.sap.measure.start("FLP:LanguageRegionSelector._getLanguagesList", "_getLanguagesList","FLP");
                    var getLanguagePromise = this.userInfoService.getLanguageList();
                    getLanguagePromise.done(function (oData) {
                        jQuery.sap.measure.end("FLP:LanguageRegionSelector._getLanguagesList");
                        oResultDeferred.resolve(oData);
                    });
                    getLanguagePromise.fail(function () {
                        oResultDeferred.reject("Failed to load language list.");
                    });
            } else {
                oResultDeferred.resolve(this.aLanguageList);
            }
            return oResultDeferred.promise();
        },
    });


}, /* bExport= */ false);
