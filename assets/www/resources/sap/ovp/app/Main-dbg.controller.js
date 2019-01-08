- /* global hasher */
sap.ui.define(["sap/ui/core/mvc/Controller", "sap/ui/model/odata/ODataUtils", "sap/ovp/cards/generic/Component", "sap/ui/generic/app/navigation/service/NavigationHandler",
        "sap/m/MessageBox", "sap/ovp/cards/CommonUtils", "sap/ovp/cards/PersonalizationUtils", "sap/ushell/ui/footerbar/AddBookmarkButton", "sap/m/BusyDialog", "sap/ui/model/resource/ResourceModel",
        "sap/ui/model/Filter", "sap/ui/comp/smartvariants/SmartVariantManagement", "sap/ui/comp/smartvariants/PersonalizableInfo",
        "sap/ui/generic/app/navigation/service/SelectionVariant", "sap/ui/comp/state/UIState", "sap/m/ColumnListItem", "sap/m/Text", "sap/m/Switch", "sap/m/Table",
        "sap/m/Column", "sap/m/Button", "sap/m/Dialog", "sap/ui/model/json/JSONModel"],

    function (Controller, ODataUtils, Component, NavigationHandler, MessageBox, CommonUtils, PersonalizationUtils, AddBookmarkButton, BusyDialog, ResourceModel, Filter, SmartVariantManagement,
              PersonalizableInfo, SelectionVariant, UIState, ColumnListItem, Text, Switch, Table, Column, Button, Dialog, JSONModel) {

        "use strict";
        return Controller.extend("sap.ovp.app.Main", {

            // Extensions (Implemented in Extension Controller)
            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

            //Store custom data in oCustomData
            getCustomAppStateDataExtension: function (oCustomData) {
            },
            //Appstate will return the same oCustomData
            restoreCustomAppStateDataExtension: function (oCustomData) {
            },
            //Returns Filter object to be used in filtering
            getCustomFilters: function () {
            },
            //Returns Custom Action function
            onCustomActionPress: function(sCustomAction) {
            },
            //Returns Custom Parameters
            onCustomParams: function(sCustomParams) {
            },

            oRefreshTimer: null, // timer instance for auto refresh
            nRefreshInterval: 0, // auto refresh interval that is being set in the manifest
            filterItemInFocus : null,

            // Delta Changes
            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

            /**
             * Called by applyChange in flexibility.js of layout controls
             * dashboard or easyScan
             *
             * It is called for every change
             * So it will be called multiple times
             * The latest call will have the latest change
             *
             * Across all of main controller, making the incoming delta changes available
             */
            storeIncomingDeltaChanges: function(aCardsInfo) {
                this.deltaCardsInfo = aCardsInfo ? aCardsInfo : [];
            },
            
            appendIncomingDeltaChange: function (oChange) {
                this.deltaChanges.push(oChange);
            },

            // Standard Methods
            //^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
            onInit: function () {

                // This flag is set if user has delta changes available.
                this.bDeltaChangesEnabled = false;
                // Array to store incoming delta changes
                this.deltaChanges = [];
                this.oCardsModels = {};
                this.aFilters = [];
                /*For storing Batch Requests send status*/
                this.errorHandlingObject = {
                    atLeastOneRequestSuccess : false,
                    errorLoadingTimeout : {}
                };
                this.sPreviousEntityType = "";
                this.sCurrentEntityType = "";
                this.oLoadedComponents = {};
                this.bGlobalFilterLoaded = false;
                this.bGoButtonPressed = false;
                jQuery.sap.measure.start("ovp:GlobalFilter", "Main Controller init -> Global Filter loaded", "ovp");
                jQuery.sap.measure.start("ovp:Personalization", "Main Controller init -> Personalization loaded", "ovp");
                this.isInitialLoading = true;
                var oUIModel = this.getUIModel();
                this.oValueHelpMap = oUIModel && oUIModel.getProperty("/ValueHelpEntityMap");
                this.oNavigationHandler = this.oNavigationHandler || new NavigationHandler(this);
                // check if no delta changes and need of migration from variant->delta
                this._initFlexibilityPersonalization();
                
                this.getLayout().addStyleClass("ovpLayoutElement");
                /* Appstate*/
                this.oState = {};
                this.oState.oSmartFilterbar = this.byId("ovpGlobalFilter");
                /* Appstate */
                this._initGlobalFilter();
                // Set model for tile
                this._createModelForTile();
                sap.ovp.cards.CommonUtils.enable(this, this.oNavigationHandler);
            },

            performRecreationOfCard: function (oCard) {
                this.createLoadingCard(oCard);
                oCard.settings.baseUrl = this._getBaseUrl();
                this._clearStoredEntities(); //Clear previously temporarily stored entity types
                this._initCardModel(oCard.model);
                this._loadCardComponent(oCard.template);
                this._createModelViewMap(oCard);
                //this.createCard(oCard);
                jQuery.when(this.createCard(oCard)).then(function () {
                    if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                        var oDashboardUtil = this.getLayout().getDashboardLayoutUtil();
                        if (oDashboardUtil) {
                            var oDashBoardLayoutModel = oDashboardUtil.getDashboardLayoutModel();
                            var oDashboardCard = oDashBoardLayoutModel.getCardById(oCard.id);
                            oDashboardCard.dashboardLayout.autoSpan = false;
                            oDashboardUtil._sizeCard(oDashboardCard);
                            oDashBoardLayoutModel.extractCurrentLayoutVariant();
                        }
                    }
                }.bind(this));
            },

            recreateCard: function (sCardProperties) {
                var oCard = this._getCardFromManifest(sCardProperties.cardId);
                if (oCard.template == "sap.ovp.cards.charts.analytical") {
                    oCard.settings.chartAnnotationPath = sCardProperties.chartAnnotationPath;
                    oCard.settings.navigation = sCardProperties.navigation;
                }
                oCard.settings.annotationPath = sCardProperties.annotationPath;
                oCard.settings.dynamicSubtitleAnnotationPath = sCardProperties.dynamicSubtitleAnnotationPath;
                oCard.settings.presentationAnnotationPath = sCardProperties.presentationAnnotationPath;
                oCard.settings.selectionAnnotationPath = sCardProperties.selectionAnnotationPath;
                oCard.settings.selectionPresentationAnnotationPath = sCardProperties.selectionPresentationAnnotationPath;
                oCard.settings.dataPointAnnotationPath = sCardProperties.dataPointAnnotationPath;
                oCard.settings.identificationAnnotationPath = sCardProperties.identificationAnnotationPath;
                // headerAnnotationPath is a property added to the manifest.json for Qualifier support in HeaderInfo annotations.
                oCard.settings.headerAnnotationPath = sCardProperties.headerAnnotationPath;
                var sOldKey = oCard.settings.selectedKey;
                oCard.settings.selectedKey = sCardProperties.selectedKey;
                if (oCard) {
                    this.performRecreationOfCard(oCard);
                }
                var oChange = {
                        changeType: "viewSwitch",
                        content: {
                            cardId: sCardProperties.cardId,
                            selectedKey: sCardProperties.selectedKey,
                            oldKey: sOldKey
                        },
                        isUserDependent: true
                };
                this.savePersonalization(oChange);

            },

            recreateRTAClonedCard: function (oCardProperties) {
                var oCard = this._getCardFromManifest(oCardProperties.cardId);
                if (oCard) {
                    oCard.settings = oCardProperties.settings;
                    this.performRecreationOfCard(oCard);
                }
            },

            //clarify with UI5 Core: why can view models not be accessed in onInit?
            onBeforeRendering: function () {
            },

            onAfterRendering: function () {
                this.oModelViewMap = {};
                this.oAppStatePromise = null;
                // checking the refresh interval from the manifest and setting it in the global variable
                if (this.getView().getModel("ui").getProperty("/refreshIntervalInMinutes")) {
                    this.nRefreshInterval = this.getView().getModel("ui").getProperty("/refreshIntervalInMinutes");
                    /*
                     * if the refresh interval is less than 1 : setting it to 1
                     * else setting it as described in the manifest
                     * converting the minutes to milliseconds
                     */
                    this.nRefreshInterval = (this.nRefreshInterval <= 1 ? 1 : this.nRefreshInterval) * 60000;
                }

                /*To Hide the error page on the loading of application*/
                if (this.getView() && this.getView().byId('ovpErrorPage')) {
                    jQuery(this.getView().byId('ovpErrorPage').getDomRef()).hide();
                }
                //make sure we will not initialize more then ones
                if (this.initialized) {
                    return;
                }
                this.initialized = true;

                this.oFlexibilityPersonalizationPromise.then(function () {
                    jQuery.sap.measure.end("ovp:Personalization");
                    this.persistencyVariantLoaded = true;
                    var oCard;
                    var cardsIntentWithIndex = [], cardsIntent = [];
                    this.aManifestOrderedCards = this._getCardArrayAsVariantFormat(this.getLayout().getContent());
                    /**
                     * Order flow - 
                     * 1. We fetch personalization in oVariant
                     * 2. Remove unauthorized cards from manifest-ordered cards
                     * 3. Merge personalization and get ordered cards
                     * 4. Remove unauthorized cards from ordered cards (only in case of full array delta change)
                     * 5. Organize cards
                     */
                    //Check For Authorization
                    for (var counter = 0; counter < this.aManifestOrderedCards.length; counter++) {
                        oCard = this._getCardFromManifest(this.aManifestOrderedCards[counter].id);
                        if (oCard && oCard.settings && oCard.settings.requireAppAuthorization) {
                            cardsIntentWithIndex.push({
                                id: oCard.id,
                                cardIntent: oCard.settings.requireAppAuthorization
                            });
                            cardsIntent.push(oCard.settings.requireAppAuthorization);
                        }
                    }

                    if (cardsIntent.length > 0) {
                        this._checkForAuthorization(cardsIntentWithIndex, cardsIntent);
                    } else {
                        //Merge LREP data
                        this.aOrderedCards = this._mergeLREPContent(this.aManifestOrderedCards);
                        this.organizeCards(this.aOrderedCards);
                    }
                }.bind(this), function (err) {
                    jQuery.sap.log.error("Could not load information from LREP Persistency");
                    jQuery.sap.log.error(err);
                });
                if (sap.ui.Device.system.phone) {
                    jQuery.sap.require("sap.ovp.ui.SmartphoneHeaderToggle");
                    sap.ovp.ui.SmartphoneHeaderToggle.enable(this);
                }

                setTimeout(function () {
                    if (!this.persistencyVariantLoaded) {
                        this.busyDialog = new BusyDialog({
                            text: this._getLibraryResourceBundle().getText("loading_dialog_text")
                        });
                        this.busyDialog.open();
                        this.busyDialog.addStyleClass('sapOVPBusyDialog');
                    }
                }.bind(this), 500);
            },

            organizeCards: function (aOrderedCards) {

                var oCard;
                var aVisibleCards = [];
                this._updateLayoutWithOrderedCards();
                this._updateDashboardLayoutCards(aOrderedCards);
                if (this.isDragAndDropEnabled()) {
                    this._initShowHideCardsButton();
                }

                this._clearStoredEntities(); //Clear previously temporarily stored entity types

                for (var i = 0; i < this.aOrderedCards.length; i++) {
                    if (this.aOrderedCards[i].visibility) {
                        oCard = this._getCardFromManifest(this.aOrderedCards[i].id);
                        if (oCard) {
                            aVisibleCards.push(oCard);
                        }
                    }
                }

                for (var i = 0; i < aVisibleCards.length; i++) {
                    this._initCardModel(aVisibleCards[i].model);
                    this._loadCardComponent(aVisibleCards[i].template); 	//Load Card template files
                    this._createModelViewMap(aVisibleCards[i]);
                }

                jQuery.sap.measure.start("ovp:CreateLoadingCards", "Create Loading cards", "ovp");
                // First create the loading card
                for (var i = 0; i < aVisibleCards.length; i++) {
                    this.createLoadingCard(aVisibleCards[i]);
                }
                jQuery.sap.measure.end("ovp:CreateLoadingCards");

                // In order to add the below css class after second
                // layout rendering which caused by
                // this._updateLayoutWithOrderedCards()
                setTimeout(function () {
                    this.getLayout().addStyleClass(
                        "ovpLayoutElementShow");
                }.bind(this), 0);

                // Second load each card component and create the
                // card
                // We would like to wait for the loading cards
                // invocation
                setTimeout(
                    function () {
                        jQuery.sap.measure.start(
                            "ovp:CreateCards",
                            "Create cards loop", "ovp");
                        for (var i = 0, j = 0; j < aVisibleCards.length; i++, j++) {
                            // i --> index for ordered cards
                            // j --> index for visible cards

                            // If some cards are not visible, they will be missing in visible cards, but in same order
                            // This causes issue while setting selectedKey as the correct cards are not matched
                            // Hence, keep moving ahead by skipping through invisible cards in ordered cards until match is found
                            while (aVisibleCards[j].id !== aOrderedCards[i].id) {
                                i++;
                            }

                            oCard = aVisibleCards[j];

                            if (!oCard.settings.title) {
                                jQuery.sap.log
                                    .error("title is mandatory for card ID : "
                                    + oCard.id);
                            }
                            if (oCard.settings.tabs) {
                                var iIndex = 0;
                                if (this.aOrderedCards[i].selectedKey) {
                                    iIndex = this.aOrderedCards[i].selectedKey - 1;
                                }
                                this.initializeTabbedCard(
                                    oCard, iIndex);
                            }

                            oCard.settings.baseUrl = this._getBaseUrl();
                            //this._initCardModel(oCard.model);			//Loading shifted before for better performance
                            //this._loadCardComponent(oCard.template);	//Loading shifted before for better performance
                            this.createCard(oCard);
                        }
                        jQuery.sap.measure
                            .end("ovp:CreateCards");
                    }.bind(this), 10);

                if (this.busyDialog) {
                    this.busyDialog.close();
                }
            },

            /* Function to create a model vs view map
             *  @param object
             *  @private
             * */
            _createModelViewMap: function (oCard) {
                //Create model vs view map
                //Each model object contains view id as its property
                if (!oCard || !oCard.settings || !oCard.model) {
                    return;
                }
                //For cards with static content, model map is not required
                if (!oCard.settings.entitySet || oCard.settings.entitySet === "") {
                    return;
                }
                var sModelName = oCard.model;
                if (!this.oModelViewMap[sModelName]) {
                    this.oModelViewMap[sModelName] = {};
                }
                this.oModelViewMap[sModelName][oCard.id] = true;
            },

            initializeTabbedCard: function (oCard, iIndex) {
                if (oCard.template == "sap.ovp.cards.charts.analytical") {
                    oCard.settings.chartAnnotationPath = oCard.settings.tabs[iIndex].chartAnnotationPath;
                    oCard.settings.navigation = oCard.settings.tabs[iIndex].navigation;
                }
                oCard.settings.annotationPath = oCard.settings.tabs[iIndex].annotationPath;
                oCard.settings.dynamicSubtitleAnnotationPath = oCard.settings.tabs[iIndex].dynamicSubtitleAnnotationPath;
                oCard.settings.presentationAnnotationPath = oCard.settings.tabs[iIndex].presentationAnnotationPath;
                oCard.settings.selectionAnnotationPath = oCard.settings.tabs[iIndex].selectionAnnotationPath;
                oCard.settings.selectionPresentationAnnotationPath = oCard.settings.tabs[iIndex].selectionPresentationAnnotationPath;
                oCard.settings.dataPointAnnotationPath = oCard.settings.tabs[iIndex].dataPointAnnotationPath;
                oCard.settings.identificationAnnotationPath = oCard.settings.tabs[iIndex].identificationAnnotationPath;
                oCard.settings.params = oCard.settings.tabs[iIndex].params;
                oCard.settings.selectedKey = iIndex + 1;
            },

            _getLibraryResourceBundle: function () {
                if (!this.oLibraryResourceBundle) {
                    this.oLibraryResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ovp");
                }
                return this.oLibraryResourceBundle;
            },

            _getOvplibResourceBundle: function () {
                if (!this.ovplibResourceBundle) {
                    var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ovp");
                    this.ovplibResourceBundle = oResourceBundle ? new ResourceModel({
                        bundleUrl: oResourceBundle.oUrlInfo.url
                    }) : null;
                }
                return this.ovplibResourceBundle;
            },

            _getCardsModel: function () {
                if (!this.oCards) {
                    var oUIModel = this.getUIModel();
                    this.oCards = oUIModel.getProperty("/cards");
                }
                return this.oCards;
            },

            _getBaseUrl: function () {
                var oUIModel = this.getUIModel();
                if (!this.sBaseUrl) {
                    this.sBaseUrl = oUIModel.getProperty("/baseUrl");
                }
                return this.sBaseUrl;
            },

            _getApplicationId: function () {
                var oUIModel = this.getUIModel();
                return oUIModel.getProperty("/applicationId");
            },

            _getCardFromManifest: function (sCardId) {
                var aCards = this._getCardsModel();
                for (var i = 0; i < aCards.length; i++) {
                    if (aCards[i].id === sCardId) {
                        return aCards[i];
                    }
                }

                return null;
            },

            _getCardArrayAsVariantFormat: function (aComponentContainerArray) {
                var aCards = [];

                for (var i = 0; i < aComponentContainerArray.length; i++) {
                    var sId = this._getCardId(aComponentContainerArray[i].getId());
                    aCards.push({
                        id: sId,
                        visibility: aComponentContainerArray[i].getVisible()
                    });
                    var iSelectedKey;
                    if (this.getView() && this.getView().byId) {
                        if (this.getView().byId(sId).getComponentInstance()) {
                            iSelectedKey = this.getView().byId(sId).getComponentInstance().getComponentData().settings.selectedKey;
                        }
                    }

                    if (iSelectedKey) {
                        aCards[aCards.length - 1].selectedKey = iSelectedKey;
                    }

                }
                return aCards;
            },

            // We have all the cards so we check with isIntentSupported
            // if the user has the app within it’s roles and only display the card in this case.
            _checkForAuthorization: function (cardsIntentWithIndex, cardsIntent) {
                var that = this;
                var unsupportedCards = [];
                var oNavigationHandler = sap.ovp.cards.CommonUtils.getNavigationHandler();
                if (oNavigationHandler && oNavigationHandler.oCrossAppNavService) {
                    oNavigationHandler.oCrossAppNavService.isIntentSupported(cardsIntent).done(function (oResponse) {
                        for (var i = 0; i < cardsIntentWithIndex.length; i++) {
                            if (oResponse[cardsIntentWithIndex[i].cardIntent].supported === false) {
                                unsupportedCards.push(cardsIntentWithIndex[i].id);
                                for (var j = 0; j < that.aManifestOrderedCards.length; j++) {
                                    if (cardsIntentWithIndex[i].id === that.aManifestOrderedCards[j].id) {
                                        that.aManifestOrderedCards.splice(j, 1);
                                        break;
                                    }
                                }
                            }
                        }
                        //Merge LREP data
                        that.aOrderedCards = that._mergeLREPContent(that.aManifestOrderedCards);
                        
                        // loop through the unsupported cards list and remove the card from the manifest ordered cards list
                        for (var k = 0; k < unsupportedCards.length; k++) {
                            for (var l = 0; l < that.aOrderedCards.length; l++) {
                                if (that.aOrderedCards[l].id == unsupportedCards[k]) {
                                    that.aOrderedCards.splice(l, 1);
                                    if (that.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                                        //If the card is not authorised remove from aCards of resizable layout
                                        that.getLayout().dashboardLayoutUtil.aCards.filter(function (item, index) {
                                            if (item.id === unsupportedCards[k]) {
                                                that.getLayout().dashboardLayoutUtil.aCards.splice(index, 1);
                                            }
                                        });
                                        //If the card is not authorised remove from the variant of resizable layout
                                        that.getLayout().dashboardLayoutUtil.dashboardLayoutModel.oLayoutVars.filter(function (item, index) {
                                            if (item.id === unsupportedCards[k]) {
                                                that.getLayout().dashboardLayoutUtil.dashboardLayoutModel.oLayoutVars.splice(index, 1);
                                            }
                                        });
                                    }
                                    break;
                                }
                            }
                        }
                        that.organizeCards(that.aOrderedCards);

                    }).fail(function () {
                        jQuery.sap.log.error("Could not get authorization from isIntentSupported");
                        //Merge LREP data
                        that.aOrderedCards = that._mergeLREPContent(that.aOrderedCards);
                        that.organizeCards(that.aOrderedCards);
                    });
                }
            },

            /**
             * _mergeLREPContent is called once in first onAfterRendering
             */
            _mergeLREPContent: function (aLayoutCardsArray) {
                var aCards = [];
                var oUiModel = this.getUIModel();
                var bDeltaArrayPresent = false;
                // if user has a full array of cards available as delta change, should be used instead
                if (this.bDeltaChangesEnabled && Array.isArray(this.deltaCardsInfo) && this.deltaCardsInfo.length > 0) {
                    // add cards to full array delta at the end which are missing from manifest cards
                    aLayoutCardsArray = PersonalizationUtils.addMissingCardsFromManifest(aLayoutCardsArray, this.deltaCardsInfo);
                    bDeltaArrayPresent = true;
                }
                // for dashboard/resizable, we do some extra things
                if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                    if (!bDeltaArrayPresent) {
                        aLayoutCardsArray = this.getLayout().getLayoutDataJSON();
                    }
                    aCards = PersonalizationUtils.mergeChanges(aLayoutCardsArray, this.deltaChanges);
                    this._bDashboardLayoutLrepActive = true;
                    //update dashboardLayoutModel layout
                    this.getLayout().getDashboardLayoutModel().setLayoutVars(aCards);
                } else {
                    aCards = PersonalizationUtils.mergeChanges(aLayoutCardsArray, this.deltaChanges);
                }
                return aCards ? aCards : [];
            },

            _updateLayoutWithOrderedCards: function () {
                var oLayout = this.getLayout();
                var aOrderedCards = this.aOrderedCards;
                oLayout.removeAllContent();
                var aCardsManifest, matchFound = false;
                if (this.getView().getModel("ui") && this.getView().getModel("ui").getProperty("/cards")) {
                    aCardsManifest = this.getView().getModel("ui").getProperty("/cards");
                    // Maybe this check could create issues once the RTA is enabled and Key User can Add and Remove cards
                    //if (aCardsManifest.length !== aOrderedCards.length) {
                    for (var i = 0; i < aCardsManifest.length; i++) {
                        matchFound = false;
                        for (var j = 0; j < aOrderedCards.length; j++) {
                            if (aCardsManifest[i].id == aOrderedCards[j].id) {
                                matchFound = true;
                                break;
                            }
                        }
                        /**In case there are cards in manifest but not displayed on UI due to missing authorization or other reasons then
                         their instance needs to be destroyed else they are recreated with same id's causing duplicate id issue.
                         Here we find such ComponentContainers which are present in manifest but not in displayed cards **/
                        if (!matchFound && this.getView().byId(aCardsManifest[i].id)) {
                            this.getView().byId(aCardsManifest[i].id).destroy();
                        }
                    }
                }

                for (var i = 0; i < aOrderedCards.length; i++) {
                    var oComponentContainer = this.getView().byId(aOrderedCards[i].id);
                    /**
                     * Check if component container exists first before setting visibility.
                     * If manifest cards have been changed after end users have saved personalization, it is possible there are extra cards
                     * in ordererd cards but less cards in manifest. In this case, component container is destroyed already above for mismatched cards.
                     */
                    if (oComponentContainer) {
                        oComponentContainer.setVisible(aOrderedCards[i].visibility);
                        oLayout.addContent(oComponentContainer);
                    }
                }
            },

            _updateDashboardLayoutCards: function (aCards) {
                if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                    if (this.getLayout().getDashboardLayoutUtil()) {
                        this.getLayout().getDashboardLayoutUtil().updateCardVisibility(aCards);
                    }
                }
            },

            _resetDashboardLayout: function () {
                if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                    if (this.getLayout().getDashboardLayoutUtil()) {
                        this.getLayout().getDashboardLayoutUtil().resetToManifest();
                    }
                    this.getLayout().rerender();
                }
            },

            //Method to extract variants of the card for the resizable layout
            _getCardArrayAsVariantFormatDashboard: function () {
                var aCards = [];
                var oLayout = this.getLayout();
                var aCardsArray = oLayout.dashboardLayoutUtil.aCards;
                oLayout.dashboardLayoutUtil.dashboardLayoutModel._sortCardsByRow(aCardsArray);
                aCardsArray.forEach(function (element) {
                    aCards.push({
                        id: element.id,
                        visibility: element.dashboardLayout.visible
                    });
                });
                return aCards;
            },

            verifyGlobalFilterLoaded: function () {
                //Call search method of SFB. The SFB search method takes care to throw error
                //when validation fails. Else it triggers the search event from SFB.
                //Do a manual validation of mandatory fields and accordingly send true to resolve
                //the global filter loaded promise. If false is returned, then promise not resolved.
                var oGlobalFilter = this.getGlobalFilter();
                if (oGlobalFilter.search()) {
                    if (oGlobalFilter.validateMandatoryFields()) {
                        return true;
                    } 
                  }
                this.getView().byId("ovpMain").setHeaderExpanded(true);
                return false;
            },

            /**
             * Register to the filterChange event of the filter bar in order to mark that
             * one or more of the filters were changed
             */
            onGlobalFilterChange: function () {
                this.filterChanged = true;

                /* Appstate will be created only on filter search triger, so the
                below piece of code is now commented
                var oGlobalFilter = this.getGlobalFilter();
                if (oGlobalFilter && !oGlobalFilter.isDialogOpen()) {
                    this._storeCurrentAppStateAndAdjustURL();
                }*/
            },

            /**
             * Register to the search event of the filter bar in order to refresh all models
             * with the changes in the filter bar (if there are changes) when "go" is clicked
             */
            onGlobalFilterSearch: function () {

                //If GO button is pressed even without changing filter, then also trigger a search
                if (this.filterChanged || this.bGoButtonPressed) {
                    var oGlobalFilter = this.getGlobalFilter();
                    if (oGlobalFilter && !oGlobalFilter.isDialogOpen()) {
                        this._storeCurrentAppStateAndAdjustURL();
                    }
                    this._clearStoredEntities(); //Clear previously temporarily stored entity types

                    // find the list of all the controls in the smart filter bar
                    var items = [];
                    if (this.oGlobalFilter['_aFields'].length > 0) {
                      items = this.oGlobalFilter["_aFields"];
                    } else {
                      var itemList = this.oGlobalFilter['_aFilterBarViewMetadata'];
                      for (var i = 0; i < itemList.length; i++) {
                        var itemGroup = itemList[i];
                        for (var j = 0; j < itemGroup.fields.length; j++) {
                          items.push(itemGroup.fields[j]);
                        }
                      }
                    }

                    // store the reference to the last focus element inside the smart filter bar
                    for (var i = 0; i < items.length; i++) {
                      if (items[i].control) {
                        var control = document.getElementById(items[i].control.sId);
                        if (jQuery(control).hasClass('sapMFocus')) {
                          this.filterItemInFocus = items[i].control;
                          break;
                        }
                      }
                    }

                    var sBatchGroupId = "ovp-" + new Date().getTime();
                    for (var modelKey in this.oCardsModels) {
                        if (this.oCardsModels.hasOwnProperty(modelKey)) {
                            try {
                            this.oCardsModels[modelKey].refresh(false, false, sBatchGroupId);
                            } catch (err) {
                                jQuery.sap.log.warning(err);
                        }
                    }
                    }
                    this.filterChanged = false;
                    this.bGoButtonPressed = false;
                    this._clearStoredEntities(); //Clear previously temporarily stored entity types
                }
            },

            _clearStoredEntities: function () {

                if (this.sPreviousEntityType) {
                    this.sPreviousEntityType = "";
                }
                if (this.sCurrentEntityType) {
                    this.sCurrentEntityType = "";
                }
            },

            _processFilters: function () {

                this.aFilters = [];

                //Get filters from smart filter bar
                var oGlobalFilter = this.getGlobalFilter();

                //If Global filters not present, then skip processing
                if (!oGlobalFilter) {
                    return;
                }

                //Get filter data from smart filter bar
                var aFilters = oGlobalFilter.getFilters();

                //Start of Custom Filter Handling
                var oCustomFilter = this.getCustomFilters(); //Get filters from extension object
                if (oCustomFilter && (oCustomFilter instanceof sap.ui.model.Filter)) {

                    /* Remove the restriction that only SFB custom fields can come as value
                    of getCustomFilters
                    var aCustomFields = this.getVisibleCustomFields();

                    //Check which filters are valid respective to custom fields
                    //Mapping check not required, so send other fields as null
                    oCustomFilter = this._checkRelevantFiltersRecursive(aCustomFields, oCustomFilter, null, null, null, null);
                    */

                    if (oCustomFilter) {
                        var aCombinedFilters = [];

                        if (aFilters && aFilters.length > 0) {
                            aCombinedFilters.push(new Filter([aFilters[0], oCustomFilter], true));
                        } else {
                            aCombinedFilters.push(oCustomFilter);
                        }

                        if (aCombinedFilters.length > 0) {
                            aFilters = aCombinedFilters;
                        }
                    }
                }
                //End of Custom Filter Handling

                this.aFilters = aFilters;

            },

            _initGlobalFilter: function () {
                var oGlobalFilter = this.getGlobalFilter();
                if (!oGlobalFilter) {

                    //When application does not have any global filter, then this flag should not
                    //stop any normal processing that wait for global filter to be loaded
                    this.bGlobalFilterLoaded = true;

                    this._parseNavigationVariant();
                    jQuery.sap.measure.end("ovp:GlobalFilter");
                    return;
                }
                //When filter dialog is closed, take all filters, create appstate and update url
                oGlobalFilter.attachFiltersDialogClosed(this._storeCurrentAppStateAndAdjustURL.bind(this));

                var oVariantManagement = oGlobalFilter.getVariantManagement();
                if (oVariantManagement) {
                    //Attach a function which will be triggered after variant is saved
                    oVariantManagement.attachAfterSave(function(oEvent) {
                        //Update the url appstate with new saved variant
                        this._storeCurrentAppStateAndAdjustURL();
                    }.bind(this));
                }
                this.oGlobalFilterLoadedPromise = new Promise(function (resolve, reject) {

                    //After global filter is initialized (fully initialized)
                    oGlobalFilter.attachInitialized(function () {
                        //Parse navigation variant from the URL (if exists)
                        this._parseNavigationVariant();

                        if (this.oParseNavigationPromise) {
                            this.oParseNavigationPromise.done(function (oAppData, oURLParameters, sNavType) {
                                if (oAppData) {
                                    this._setNavigationVariantToGlobalFilter(oAppData, oURLParameters, sNavType);

                                    //Setting the navigation variants trigger filter change event, we do not want the
                                    //flag to be updated unless a user explicitly changes a filter
                                    this.filterChanged = false;
                                }
                            }.bind(this));
                            this.oParseNavigationPromise.fail(function () {
                                jQuery.sap.log.error("Could not parse navigation variant from URL");
                            });
                            this.oParseNavigationPromise.always(function () {
                                if (oGlobalFilter && this.verifyGlobalFilterLoaded()) {
                                    resolve();
                                }
                            }.bind(this));
                        } else {
                            if (oGlobalFilter && this.verifyGlobalFilterLoaded()) {
                                resolve();
                            }
                        }
                    }, this);

                    oGlobalFilter.attachSearch(function () {
                        //If user pressed GO, it means that the required field varification
                        //was allredy done by the globalFilter, therefore we can resolve the promise.
                        //This is needed in case some required field was empty and therefore the promise
                        //object was not resolved in the initial flow, we have to do it now after user
                        //set the filter

                        if (!this.bGlobalFilterLoaded) {
                            resolve();
                            this.bGlobalFilterLoaded = true;
                            if (!oGlobalFilter.isDialogOpen()) {
                                this._storeCurrentAppStateAndAdjustURL();
                            }

                            //At this point, search need not be triggered as cards are not created
                            //because oGlobalFilterLoadedPromise is not resolved
                            return;
                        }
                        this.onGlobalFilterSearch();

                    }, this);
                    oGlobalFilter.attachFilterChange(this.onGlobalFilterChange, this);

                    //Currently private property is used
                    //TODO: Ask SFB to provide a way in search event that it is triggered from GO button
                    oGlobalFilter._oSearchButton && oGlobalFilter._oSearchButton.attachPress(function() {
                        this.bGoButtonPressed = true;
                    }.bind(this));
                }.bind(this));

                this.oGlobalFilterLoadedPromise.then(function (oVariant) {
                    this.bGlobalFilterLoaded = true;
                    jQuery.sap.measure.end("ovp:GlobalFilter");
                }.bind(this));
            },

            /* Function to display a popover providing the following options on clicking of Action button in Smart Filter Bar:
             * 1. Send as Email (Share the whole page)
             * 2. Create Tile on FLP
             */
            onShareButtonPress: function (oEvent) {
                var oLibraryResourceBundle = this._getLibraryResourceBundle();
                var oUIModel = this.getUIModel();
                var sTitle = oUIModel && oUIModel.getProperty("/title");
                if (!this._oShareActionButton) {
                   this._oShareActionButton = sap.ui.xmlfragment(
                      "sap.ovp.app.SharePage", {
                         shareEmailPressed: function () {
                            //Trigger email when 'Send Email' is clicked
                             sap.m.URLHelper.triggerEmail(null, oLibraryResourceBundle.getText("Email_Subject", [sTitle]), document.URL);
                         }.bind(this)
                      });
                   this.getView().addDependent(this._oShareActionButton);
                }
                this._oShareActionButton.openBy(oEvent.getSource());
             },
             
            /* Function to set tile information
             *  @private
             * */
             _createModelForTile: function() {
                 var oUIModel = this.getUIModel();
                 var sHash, sTitle = oUIModel && oUIModel.getProperty("/title");
                 var oTileInfo = {
                         tileTitle: sTitle,            //Set the title of the tile
                         tileCustomURL: function () {  //Set the URL that the tile should point to
                                 sHash = hasher.getHash();
                                 return sHash ? ("#"  +  sHash) : window.location.href;
                             }
                 }
                 if (oUIModel) {
                     //Bind the information of the tile to the model
                     oUIModel.setProperty("/tileInfo", oTileInfo);  
                }
            },

            _loadCardComponent: function (sComponentName) {
                if (!this.oLoadedComponents[sComponentName]) {
                    jQuery.sap.measure.start("ovp:CardComponentLoad:" + sComponentName, "Card Component load", "ovp");
                    this.oLoadedComponents[sComponentName] = sap.ui.component.load({
                        name: sComponentName,
                        url: jQuery.sap.getModulePath(sComponentName),
                        async: true
                    });
                    this.oLoadedComponents[sComponentName].then(function () {
                        jQuery.sap.measure.end("ovp:CardComponentLoad:" + sComponentName);
                    });
                }
            },

            _initCardModel: function (sCardModel) {
                var sendRelevantFiltersAsParameters = false;
                if (this.oCardsModels[sCardModel] || !sCardModel) {
                    return;
                }
                this.oCardsModels[sCardModel] = this.getView().getModel(sCardModel);
                if (!this.oCardsModels[sCardModel].bUseBatch) {
                    this.oCardsModels[sCardModel].setUseBatch(false);
                } else {
                    this.oCardsModels[sCardModel].setUseBatch(true);
                }
                if (this.getGlobalFilter()) {
                    sendRelevantFiltersAsParameters = true;
                }
                this._overrideCardModelRead(this.oCardsModels[sCardModel], sendRelevantFiltersAsParameters);
            },

            toggleFilterBar: function toggleFilterBar() {
                var oGlobalFilter = this.getGlobalFilter();

                function toOpenState(jqGlobalFilter, jqGlobalFilterWrapper, height) {
                    jqGlobalFilterWrapper.height(height);
                    jqGlobalFilter.css('top', 0);
                }

                function toCloseState(jqGlobalFilter, jqGlobalFilterWrapper, height) {
                    jqGlobalFilterWrapper.height(0);
                    jqGlobalFilter.css("top", "-" + height + "px");
                }

                var isVisible = oGlobalFilter.getVisible();

                if ((sap.ui.Device.system.phone) || (sap.ui.Device.system.tablet)) {
                    oGlobalFilter.setVisible(!isVisible);
                    return;
                }
                if (toggleFilterBar.animationInProcess) {
                    return;
                }
                toggleFilterBar.animationInProcess = true;

                if (isVisible) {
                    var jqGlobalFilter = jQuery(oGlobalFilter.getDomRef());
                    var jqGlobalFilterWrapper = jQuery(this.getView().byId("ovpGlobalFilterWrapper").getDomRef());
                    var height = jqGlobalFilterWrapper.height();
                    toOpenState(jqGlobalFilter, jqGlobalFilterWrapper, height);
                    jqGlobalFilterWrapper.height(); //make browser render css change
                    jqGlobalFilterWrapper.one('transitionend', function (e) {
                        oGlobalFilter.setVisible(false); //set filterbar invisible in case shell wants to reRender it
                        toggleFilterBar.animationInProcess = false;
                    });
                    toCloseState(jqGlobalFilter, jqGlobalFilterWrapper, height);
                } else {
                    oGlobalFilter.setVisible(true);
                    setTimeout(function () { //we need this to wait for globalFilter renderer
                        var jqGlobalFilter = jQuery(oGlobalFilter.getDomRef());
                        var jqGlobalFilterWrapper = jQuery(this.getView().byId("ovpGlobalFilterWrapper").getDomRef());
                        var height = jqGlobalFilter.outerHeight();
                        toCloseState(jqGlobalFilter, jqGlobalFilterWrapper, height);
                        jqGlobalFilterWrapper.height(); //make browser render css change
                        jqGlobalFilterWrapper.one('transitionend', function (e) {
                            jqGlobalFilterWrapper.css("height", "auto");
                            toggleFilterBar.animationInProcess = false;
                        });
                        toOpenState(jqGlobalFilter, jqGlobalFilterWrapper, height);
                    }.bind(this));
                }
            },

            /**
             * This function checks for custom fields in the filter bar that are
             * currently visible to user
             * @returns {object}
             * @public
             */
            getVisibleCustomFields: function () {

                var oGlobalFilter = this.getGlobalFilter();

                var aFilterItems = oGlobalFilter.getAllFilterItems(true);
                var iLen, oItem, aVisibleFields = [];

                if (aFilterItems) {
                    iLen = aFilterItems.length;
                    //loop through all the visible filter items and get their names
                    while (iLen--) {
                        oItem = aFilterItems[iLen];
                        if (oItem && oItem.getVisibleInFilterBar()) {
                            aVisibleFields.push(oItem.getName());
                        }
                    }
                }

                var iGroupCount, iFieldCount, aFields, aFilterBarViewMetadata = oGlobalFilter.getFilterBarViewMetadata();
                var aCustomFields = [];

                //aFilterBarViewMetadata contains a set of arrays, each array pointing to a group
                //of fields

                if (aFilterBarViewMetadata) {

                    iGroupCount = aFilterBarViewMetadata.length;

                    //loop through the groups
                    while (iGroupCount--) {

                        aFields = aFilterBarViewMetadata[iGroupCount].fields;
                        if (aFields) {

                            iFieldCount = aFields.length;

                            //loop through the fields
                            while (iFieldCount--) {

                                //If custom control property is defined and field is visible in filter bar, then add this field
                                if (aFields[iFieldCount].isCustomFilterField && aVisibleFields.indexOf(aFields[iFieldCount].fieldName) > -1) {
                                    aCustomFields.push({
                                        name: aFields[iFieldCount].fieldName
                                    });
                                }
                            }
                        }
                    }
                }

                return aCustomFields;
            },

            /* Function to Show error page or Hide error Page based on the parameter
            *  show : true then show the Error Page
            *  show : false Hide the Error Page
            *  @param boolean
            *  @private
            * */
            _showErrorPage: function (show) {
                if (this.getView() && this.getView().byId && this.getView().byId('ovpErrorPage')) {
                    var ovpErrorPage = jQuery(this.getView().byId('ovpErrorPage').getDomRef());
                    var ovpMainPage = jQuery(this.getView().byId('ovpMain').getDomRef());
                    if (show) {
                        ovpErrorPage.show();
                        ovpMainPage.hide();
                        return;
                    }
                    ovpErrorPage.hide();
                    ovpMainPage.show();
                }
            },

            /**
             * This function is serving two Purpose
             * 1. If sendRelevantFiltersInUrl is true : Then Overriding the read function of the oDataModel with a function
             *    that will first find the relevant filters from the filter bar and then will call the original
             *    read function with the relevant filters as parameters.
             * 2. Providing Additional functionality to capture success and failure callback to show error page if non of
             *    the requests gets successful.
             * @param oModel
             * @param boolean
             * @private
             */
            _overrideCardModelRead: function (oModel, sendRelevantFiltersAsParameters) {
                var fOrigRead = oModel.read;
                var that = this;
                oModel.read = function () {
                    if (sendRelevantFiltersAsParameters) {
                        //Process the filters from smart filter bar
                        that._processFilters();

                        var oGlobalFilter = that.getGlobalFilter();

                        if (!that.aFilters) {	//For initial load case
                            that.aFilters = [];
                        }

                        var bCheckEntity = false;

                        var oParameters = arguments[1];
                        if (!oParameters) {
                            oParameters = {};
                            Array.prototype.push.call(arguments, oParameters);
                        }
                        var oEntityType = that._getEntityTypeFromPath(oModel, arguments[0], oParameters.context, false);

                        that.sCurrentEntityType = oEntityType.entityType;

                        //If previous call and current call are for same entity, then need not do the
                        //same calculation again
                        if (that.sPreviousEntityType !== that.sCurrentEntityType) {
                            that.sPreviousEntityType = that.sCurrentEntityType;
                            bCheckEntity = true;
                        }

                        if (!that.aRelevantFilters) {	//For initial load case
                            that.aRelevantFilters = [];
                            bCheckEntity = true;
                        }

                        //If recalculation is required
                        //Case when a new entityset is encountered or on initial load
                        if (bCheckEntity) {

                            that.aRelevantFilters = [];

                            var bValueHelpEntity = false;
                            if (that.oValueHelpMap) {
                                if (that.oValueHelpMap.indexOf(oEntityType.entityType) != -1) {
                                    bValueHelpEntity = true;
                                }
                            }
                            if (oEntityType && !bValueHelpEntity) {
                                that.aRelevantFilters = that._getEntityRelevantFilters(oEntityType, that.aFilters,
                                                            oModel, oGlobalFilter.getModel());
                            }

                        }

                        if (that.aRelevantFilters && that.aRelevantFilters.length > 0) {
                            var foundIndex = -1;
                            var aUrlParams = oParameters.urlParameters;
                            if (aUrlParams) {
                                for (var index = 0; index < aUrlParams.length; index++) {
                                    // We use here lastIndexOf instead of startsWith because it doesn't work on safari (ios devices)
                                    if ((aUrlParams[index]).lastIndexOf("$filter=", 0) === 0) {
                                        foundIndex = index;
                                        break;
                                    }
                                }
                            }
                            if (foundIndex >= 0) {
                                aUrlParams[foundIndex] =
                                    aUrlParams[foundIndex] + "%20and%20" +
                                    sap.ui.model.odata.ODataUtils.createFilterParams(that.aRelevantFilters, oModel.oMetadata, oEntityType).substr(8);
                            } else {
                                oParameters.filters = that.aRelevantFilters;
                            }

                        }

                        //Process parameters
                        if (oGlobalFilter && oGlobalFilter.getConsiderAnalyticalParameters()) {

                            var sGlobalAnalyticalPath = oGlobalFilter.getAnalyticBindingPath();
                            var iIndexOf, sOldEntityPath, sNewEntityPath;

                            if (sGlobalAnalyticalPath && sGlobalAnalyticalPath.length > 0) {

                                //For entity mapped to global filter
                                if (oEntityType.name === oGlobalFilter.getEntityType()) {

                                    //arguments[0] contains entity path where parameter values need to be updated
                                    sOldEntityPath = arguments[0];
                                    iIndexOf = arguments[0].indexOf('$');
                                    if (iIndexOf > 0) {
                                        sOldEntityPath = arguments[0].substring(0, iIndexOf - 1);
                                    }
                                    sNewEntityPath = sGlobalAnalyticalPath;

                                    //Update entity path
                                    if (sOldEntityPath !== sNewEntityPath) {
                                        arguments[0] = arguments[0].replace(sOldEntityPath, sNewEntityPath);
                                    }

                                } else { //For entities, not mapped to global filter

                                    //From the entity parameter path, extract the parameters and their values
                                    var aEntityParams = that._getParametersFromEntityPath(arguments[0]);
                                    var aGlobalParams = that._getParametersFromEntityPath(sGlobalAnalyticalPath);
                                    var sMappedParameter, sRegEx, sMatch;

                                    //If current entity has params
                                    if (aEntityParams && aEntityParams.length > 0) {

                                        var oParameterEntity = that._getEntityTypeFromPath(oModel, arguments[0], oParameters.context, true);

                                        //Loop around the global filter parameters
                                        for (var i = 0; i < aGlobalParams.length; i++) {

                                            //Get the corresponding parameter of entity that matches global parameter
                                            sMappedParameter = that._getPropertyMapping(aEntityParams, aGlobalParams[i].name,
                                                                    oParameterEntity.name, oGlobalFilter.getEntityType(), oModel, oGlobalFilter.getModel());

                                            if (sMappedParameter) {

                                                //Expression can be of form "..P1=V1,.." or "..P1=V1)"
                                                //.* denotes any data
                                                //? if for non-greedy shortest search
                                                sRegEx = sMappedParameter + "=.*?,|" + sMappedParameter + "=.*?\\)";

                                                //slice(0,-1) is used to truncate the last character which is ',' or ')'
                                                sMatch = arguments[0].match(new RegExp(sRegEx));

                                                if (sMatch && sMatch.length > 0) {

                                                    sOldEntityPath = sMatch[0].slice(0, -1);
                                                    sNewEntityPath = sMappedParameter + "=" + aGlobalParams[i].sValue;

                                                    //Update entity path
                                                    if (sOldEntityPath !== sNewEntityPath) {
                                                        arguments[0] = arguments[0].replace(sOldEntityPath, sNewEntityPath);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    /*Storing old function in variable*/
                    var fOrigSuccess = arguments[1].success;
                    /*Appending success function with our custom code*/
                    /*Using IIFE to pass the context of function and the this(that) to the below function*/
                    arguments[1].success = (function (func, that) {
                        return function () {
                            /*Setting the variable to true if it was set to false*/
                            if (!that.errorHandlingObject.atLeastOneRequestSuccess) {
                                that.errorHandlingObject.atLeastOneRequestSuccess = true;
                                /*To Hide error page*/
                                that._showErrorPage(false);
                            }

                            // restoring the focus for the element that was in the focus when global filter was triggered
                            if (that.filterItemInFocus != null) {
                                that.filterItemInFocus.focus();
                                that.filterItemInFocus = null;
                            }

                            /*
                             * checking:
                             * if refresh interval is available and refresh timer is set
                             * resetting the timer and creating a new one with the refresh interval
                             * mentioned in the manifest
                             */

                            if (that.nRefreshInterval !== 0) {
                                if (that.oRefreshTimer !== null) {
                                    clearTimeout(that.oRefreshTimer);
                                }
                                that.attachRefreshInterval(that.nRefreshInterval);
                            }
                            return func.apply(this, arguments);
                        };
                    })(fOrigSuccess, that);

                    /*Storing old function in variable*/
                    var fOrigError = arguments[1].error;
                    /*Appending success function with our custom code*/
                    /*Using IIFE to pass the context of function and the this(that) to the below function*/
                    arguments[1].error = (function (func, that) {
                        return function () {
                            if (!that.errorHandlingObject.atLeastOneRequestSuccess) {
                                /*Clear earlier timeouts*/
                                clearTimeout(that.errorHandlingObject.errorLoadingTimeout);
                                /*Setting timeout as 9 sec after this request get failed,To find if all requests got failed*/
                                that.errorHandlingObject.errorLoadingTimeout = setTimeout(function () {
                                    if (!that.errorHandlingObject.atLeastOneRequestSuccess) {
                                        that._showErrorPage(true);
                                    }
                                }, 9000);
                            }
                            return func.apply(this, arguments);
                        };
                    })(fOrigError,that);
                    fOrigRead.apply(oModel, arguments);
                };
            },

            attachRefreshInterval : function(nRefreshInterval) {
                this.oRefreshTimer = setTimeout(function() {
                    for (var modelKey in this.oCardsModels) {
                        //console.log("refreshing : " + modelKey);
                        this.oCardsModels[modelKey].refresh(false, false);
                    }
                }.bind(this), nRefreshInterval);
            },

            /**
             * This is a temporary function used to retrieve the EntityType from a given path to an entity.
             * This function is required due to fact that the function _getEntityTypeByPath of the ODataMetadata is not public.
             * @param oModel
             * @param sPath
             * @param oContext
             * @returns {object}
             * @private
             */
            _getEntityTypeFromPath: function (oModel, sPath, oContext, bIsParameter) {
                //TODO need to request UI5 to have this a public API!!!!
                var sNormPath = sap.ui.model.odata.v2.ODataModel.prototype._normalizePath.apply(oModel, [sPath, oContext]);

                //For parameter entities,remove all parameters and then extract the actual
                //parameter entity name. If not done, then it will fetch result entity type
                if (bIsParameter) {
                    sNormPath = sPath.replace(/^\/|\/$/g, "").split("/")[0];
                    if (sNormPath.indexOf("(") != -1) {
                        sNormPath = sNormPath.substring(0,sNormPath.indexOf("("));
                    }
                }

                var oEntityType = sap.ui.model.odata.ODataMetadata.prototype._getEntityTypeByPath.apply(oModel.oMetadata, [sNormPath]);
                return oEntityType;
            },

            /**
             * This function takes a set of entity properties and tries to find a
             * match or a mapped property by comparing to a provided property name
             * @param aEntityProperties
             * @param sTargetProperty
             * @param sEntityname
             * @param sTargetEntityname
             * @param oEntityModel
             * @param oTargetModel
             * @returns {string}
             * @private
             */
            _getPropertyMapping: function (aEntityProperties, sTargetProperty, sEntityname, sTargetEntityname, oEntityModel, oTargetModel) {

                var i, sMappedProperty;

                //Check if entity property found with same name
                for (i = 0; i < aEntityProperties.length; i++) {
                    if (aEntityProperties[i].name === sTargetProperty) {
                        sMappedProperty = aEntityProperties[i].name;
                        return sMappedProperty;
                    }

                    //If direct match not found then check for fuzzy logic using "P_"
                    if ((("P_" + aEntityProperties[i].name) === sTargetProperty) ||
                        (aEntityProperties[i].name === ("P_" + sTargetProperty))){
                        sMappedProperty = aEntityProperties[i].name;
                        return sMappedProperty;
                    }

                }

                //sEntityname, sTargetEntityname and oModel are optional, if not passed annotation mapping will not be considered
                if (!sEntityname || !sTargetEntityname || !oEntityModel || !oTargetModel) {
                    return;
                }

                //If direct property not found, then check for mapped property

                var oEntity = oEntityModel.oMetadata._getEntityTypeByName(sEntityname);
                var oTargetEntity = oTargetModel.oMetadata._getEntityTypeByName(sTargetEntityname);

                if (!oEntity || !oTargetEntity) {
                    return;
                }

                var s_semantic_object = "com.sap.vocabularies.Common.v1.SemanticObject";
                var s_semantic_map = "com.sap.vocabularies.Common.v1.SemanticObjectMapping";

                var oEntityModelAnnotations = oEntityModel.oAnnotations.getAnnotationsData();
                if (!oEntityModelAnnotations || !oEntityModelAnnotations.propertyAnnotations) {
                    return;
                }
                var oEntityPropAnnotations = oEntityModelAnnotations.propertyAnnotations[oEntity.namespace + "." + oEntity.name];

                var oTargetModelAnnotations = oTargetModel.oAnnotations.getAnnotationsData();
                if (!oTargetModelAnnotations || !oTargetModelAnnotations.propertyAnnotations) {
                    return;
                }
                var oTargetPropAnnotations = oTargetModelAnnotations.propertyAnnotations[oTargetEntity.namespace + "." + oTargetEntity.name]; //Global filter entity annotations
                var oTargetPropAnnotation = oTargetPropAnnotations && oTargetPropAnnotations[sTargetProperty];

                //If annotations present for sTargetProperty, then only search entity annotations for a mapping
                if (!oTargetPropAnnotation || !oTargetPropAnnotation[s_semantic_object]) {
                    return;
                }

                var sPropertyKey, oEntityPropAnnotation, aMappedAnnotation, iMapCount, sLocalProperty;

                //Loop through annotations for each property in entity
                for (sPropertyKey in oEntityPropAnnotations) {

                      oEntityPropAnnotation = oEntityPropAnnotations[sPropertyKey];

                      //If entity current property and filter property annotations contain same semantic object
                      if (oEntityPropAnnotation[s_semantic_object] &&
                            oEntityPropAnnotation[s_semantic_object].String === oTargetPropAnnotation[s_semantic_object].String) {

                            aMappedAnnotation = oEntityPropAnnotation[s_semantic_map];

                            //If mapping not present
                            if (!aMappedAnnotation) {
                                  continue; //go to next loop
                            }

                            iMapCount = aMappedAnnotation.length;
                            sLocalProperty = "";

                            //Check all mappings for a match
                            while (iMapCount--) {
                                  if (aMappedAnnotation[iMapCount].SemanticObjectProperty.String === sTargetProperty) {
                                        sLocalProperty = aMappedAnnotation[iMapCount].LocalProperty.PropertyPath;
                                        break; //Match found
                                  }
                            }

                            //Local property found for entity
                            //Verify if property is present in entity before returning
                            if (sLocalProperty !== "") {
                                  for (i = 0; i < aEntityProperties.length; i++) {
                                        if (aEntityProperties[i].name === sLocalProperty) {
                                              sMappedProperty = aEntityProperties[i].name;
                                              return sMappedProperty;
                                        }
                                  }
                            }
                      }
                }

                return sMappedProperty;

            },

            /**
             * This function takes an entity path as input and breaks it into
             * parameters and values
             * @param sEntityPath
             * @returns {array}
             * @private
             */
            _getParametersFromEntityPath: function (sEntityPath) {

                //Remove any section like sorters,filters after ? sign
                //Check if some pattern present like "(parameterdata)" with atleast one = sign
                //Atleast one = sign means the parameter is of format P1 = V1
                //'('and ')' are used with escape characters.
                //'.*' means any data
                sEntityPath = sEntityPath.split("?")[0];
                var aMatch = sEntityPath.match(/\(.*=.*\)/);
                var aEntityParams = [];

                //If a matching substring is not found, then null is returned by match function
                if (!aMatch) {
                    return aEntityParams;
                }

                //Match returns an array, so take the first match from array
                //Replace start and end bracket using slice()
                //Remove any leading or lagging spaces
                //Split string whenever a '=' or a ',' is encountered
                //'=' separates params from values, and ',' separates two params
                var aParamsAndValues = aMatch[0].slice(1, -1).trim().split(/\=|\,/);

                //In aParamsAndValues, odd places contain param names and even places contain values
                for (var i = 0; i < aParamsAndValues.length; i = i + 2) {
                    aEntityParams.push({
                        name: aParamsAndValues[i],
                        sValue: aParamsAndValues[i + 1]  //This value is URI encoded as we take it from URI path
                    });
                }
                return aEntityParams;
            },

            /**
             * This function recursively checks the nested filters and returns the relevant filters
             * that match any of the entity properties.
             * @param aEntityProperties
             * @param oFilterDetails
             * @param sEntityname
             * @param sTargetEntityname
             * @param oEntityModel
             * @param oTargetModel
             * @returns {object}
             * @private
             */
            _checkRelevantFiltersRecursive: function (aEntityProperties, oFilterDetails, sEntityname, sTargetEntityname, oEntityModel, oTargetModel) {

                if (!oFilterDetails._bMultiFilter) {	//End point of recursion (base case)

                    oFilterDetails.sPath = oFilterDetails.sPath.split('/').pop();

                    //Get the mapping property. This would return the same property name in case a match is found
                    //or else a property that is mapped in annotations. If nothing is found, then it returns null
                    var sMappedProperty = this._getPropertyMapping(aEntityProperties, oFilterDetails.sPath, sEntityname
                                                , sTargetEntityname, oEntityModel, oTargetModel);
                    if (sMappedProperty) {
                        oFilterDetails.sPath = sMappedProperty;
                        return oFilterDetails;
                    }

                } else {

                    //For multifilter cases, there are deep structures
                    var aDeepFilters = oFilterDetails.aFilters;
                    var oSelectedFilter, aSelectedFilters = [];

                    if (aDeepFilters) {

                        for (var i = 0; i < aDeepFilters.length; i++) {

                            //Get the relevant filter object for each internal filter
                            oSelectedFilter = this._checkRelevantFiltersRecursive(aEntityProperties, aDeepFilters[i], sEntityname
                                                , sTargetEntityname, oEntityModel, oTargetModel);
                            if (oSelectedFilter) {
                                aSelectedFilters.push(oSelectedFilter);
                            }
                        }
                        if (aSelectedFilters.length > 0) {
                            return (new Filter(aSelectedFilters, oFilterDetails.bAnd));
                        }
                    }
                }
            },

            /**
             * This function goes over the provided list of filters and checks which filter appears as a field
             * in the EntityType provided. The fields that appears in both lists  (filters and EntityType fields)
             * will be returned in an array.
             * @param oEntityType
             * @param aFilters
             * @param oEntityModel
             * @param oFilterModel
             * @returns {array}
             * @private
             */
            _getEntityRelevantFilters: function (oEntityType, aFilters, oEntityModel, oFilterModel) {

                var oReturnFilterWrap = [];

                if (aFilters.length > 0 && oEntityType) {
                    var oReturnFilter = this._checkRelevantFiltersRecursive(oEntityType.property, aFilters[0],
                                                oEntityType.name, this.getGlobalFilter().getEntityType(), oEntityModel, oFilterModel);

                    //Wrap the return filter in an array
                    if (oReturnFilter) {
                        oReturnFilterWrap.push(oReturnFilter);
                    }
                }
                return oReturnFilterWrap;
            },

            /*
             Check derived Card Component is implemented with respect to the below restrictions:

             Custom card must be instance of sap.ovp.cards.generic.Component. In other words, custom card must extend sap.ovp.cards.generic.Component.
             If sap.ovp.cards.generic.Card view is replaced by another custom View it means the custom card is not valid.
             [If the extended Component has customization (under the component metadata) and the sap.ovp.cards.generic.Card is replaced by another view (using sap.ui.viewReplacements)]
             If the extended Component overrides the createContent function of the base sap.ovp.cards.generic.Component class, the custom card is not valid.
             If the extended Component overrides the getPreprocessors function of the base sap.ovp.cards.generic.Component class, the custom card is not valid.

             */
            _checkIsCardValid: function (sCardTemplate) {
                var sComponentClassName = sCardTemplate + ".Component";
                var oComponentMetadata, oCustomizations;

                jQuery.sap.require(sComponentClassName);

                var oComponentClass = jQuery.sap.getObject(sComponentClassName);

                if (!oComponentClass) {
                    return false;
                }

                if ((oComponentClass !== sap.ovp.cards.generic.Component) && !(oComponentClass.prototype instanceof sap.ovp.cards.generic.Component)) {
                    return false;
                }

                if ((oComponentMetadata = oComponentClass.getMetadata()) && (oCustomizations = oComponentMetadata.getCustomizing())) {
                    //if OVP Card view was replaced
                    if (oCustomizations["sap.ui.viewReplacements"] && oCustomizations["sap.ui.viewReplacements"]["sap.ovp.cards.generic.Card"]) {
                        return false;
                    }
                }

                if (oComponentClass.prototype.createContent != sap.ovp.cards.generic.Component.prototype.createContent) {
                    return false;
                }

                if (oComponentClass.prototype.getPreprocessors != sap.ovp.cards.generic.Component.prototype.getPreprocessors) {
                    return false;
                }

                return true;
            },

            _createCardComponent: function (oView, oModel, card) {
                /**
                 * Tenperory change so that we can see the loading cards.
                 * Disabling creation of the original cards.
                 */
                //if (card.template && card.template !== "sap.ovp.cards.loading") {
                //    return;
                //}
                var sId = "ovp:CreateCard-" + card.template + ":" + card.id;
                jQuery.sap.measure.start(sId, "Create Card", "ovp");
                var oi18nModel = oView.getModel("@i18n");
                if (card.template && this._checkIsCardValid(card.template)) {
                    var oComponentConfig = {
                        async: true,
                        name: card.template,
                        componentData: {
                            model: oModel,
                            modelName: card.model,
                            i18n: oi18nModel,
                            cardId: card.id,
                            settings: card.settings,
                            appComponent: this.getOwnerComponent(),
                            mainComponent: this
                        }
                    };
                    var oGlobalFilter = this.getGlobalFilter();

                    if (oGlobalFilter) {
                        oComponentConfig.componentData.globalFilter = {
                            getUiState: oGlobalFilter.getUiState.bind(oGlobalFilter)
                        };
                    }

                    //Component creation will be done asynchronously
                    var oThatView = oView;
                    sap.ui.component(oComponentConfig).then(function (oComponent) {

                        var oComponentContainer = oThatView.byId(oComponent.getComponentData().cardId);
                        oComponentContainer.setPropagateModel(true);
                        var oOldCard = oComponentContainer.getComponentInstance();

                        //Add the card component to the container
                        oComponentContainer.setComponent(oComponent);

                        //Destroy any old card
                        if (oOldCard) {
                            //currently the old component is not destroyed when setting a different component
                            //so we need to do that in timeout to make sure that it will not be destroyed
                            //too early, before real card will be rendered on the screen.
                            setTimeout(function () {
                                oOldCard.destroy();
                            }, 0);
                        }

                    });
                } else {
                    // TODO: define the proper behavior indicating a card loading failure
                    jQuery.sap.log.error("Could not create Card from '" + card.template + "' template. Card is not valid.");
                }
                jQuery.sap.measure.end(sId);
            },

            createLoadingCard: function (card) {
                /*
                 * we have to make sure metadata and filter are loaded before we create the card
                 * so we first create loading card and once all promises will be resulved
                 * we will create the real card and replace the loading card
                 */
                var loadingCard = jQuery.extend(true, {}, card, {
                    template: "sap.ovp.cards.loading"
                });
                this._createCardComponent(this.getView(), undefined, loadingCard);
            },

            createCard: function (card) {
                var oView = this.getView();
                var oModel = oView.getModel(card.model);

                ///*
                // * we have to make sure metadata and filter are loaded before we create the card
                // * so we first create loading card and once all promises will be resulved
                // * we will create the real card and replace the loading card
                // */

                Promise.all([
                    oModel.getMetaModel().loaded(),
                    this.oGlobalFilterLoadedPromise,
                    this.oLoadedComponents[card.template]
                ]).then(
                    function () {
                        this._createCardComponent(oView, oModel, card);
                    }.bind(this),
                    function (reason) {
                        jQuery.sap.log.error("Can't load card with id:'" + card.id + "' and type:'" + card.template + "', reason:" + reason);
                    }
                );
            },

            /**
             * The function gets an UI5 generated id and returns the element original Id
             *
             * @param {string} generatedId - the UI5 generated id
             * @param {string} elementId - the element original  id
             */
            _getCardId: function (generatedId) {
                var appIdString = this.getView().getId() + "--";
                if (generatedId.indexOf(appIdString) != -1) {
                    var start = generatedId.indexOf(appIdString) + appIdString.length;
                    return generatedId.substr(start);
                }
                return generatedId;
            },

            _initFlexibilityPersonalization: function () {
                this.oFlexibilityPersonalizationPromise = new Promise(function(resolve, reject) {
                    var oLayout = this.getLayout();
                    var oFlexControllerFactory = sap.ui.fl.FlexControllerFactory;
                    this.oFlexController = oFlexControllerFactory.createForControl(oLayout);
                    // ensure getting the changes and only then proceed forward
                    this.oFlexController.getComponentChanges().then(function(aChanges) {
                        if (aChanges.length > 0) {
                            this.bDeltaChangesEnabled = true;
                        }
                        resolve();
                    }.bind(this), function(oError) {
                        // No Lrep
                        // We resolve even in error scenario as the changes will be fetched from Vaiant
                        // TODO: Check from UX for error handling if message is to be shown on UI.
                        resolve();
                    }.bind(this));
                }.bind(this));
            },

            _initSmartVariantManagement: function () {
                if (!this.bDeltaChangesEnabled) {
                    var oPersistencyControl = this._createPersistencyControlForSmartVariantManagement();
                    var oOVPVariantInfo = new PersonalizableInfo({
                        type: "OVPVariant",
                        keyName: "persistencyKey",
                        control: oPersistencyControl
                    });

                    this.oPersistencyVariantPromise = new Promise(function (resolve, reject) {
                        this.smartVariandManagement = new SmartVariantManagement({
                            personalizableControls: oOVPVariantInfo,
                            initialise: function (oEvent) {
                                var aKeys = oEvent.getParameters().variantKeys;
                                if (aKeys.length) { //the user has already a variant
                                    resolve(this.smartVariandManagement.getVariantContent(oPersistencyControl, aKeys[0]));
                                } else { //the user do not have have any variant
                                    resolve(null);
                                }
                            }.bind(this)
                        });
                        this.smartVariandManagement.initialise();
                    }.bind(this));
                } else {
                    this.oPersistencyVariantPromise = Promise.resolve();
                }
            },

            layoutChanged: function (oEvent) {
                // remove duplicate card entries, reduce number of changes, one change per affected card
                var aChanges = oEvent.getParameter("positionChanges");
                var aChangesForSave = [], aCheckedChanges = [];
                var oChange, sCardId;
                if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                    var iColCount = this.getLayout().dashboardLayoutUtil.dashboardLayoutModel.iColCount;
                    if (aChanges) {
                        for (var i = aChanges.length - 1; i >= 0; i--) {
                            oChange = aChanges[i];
                            sCardId = oChange.content.cardId;
                            if (oChange.content.dashboardLayout.oldRow && oChange.content.dashboardLayout.oldRow === oChange.content.dashboardLayout.row) {
                                continue;
                            }
                            if (aCheckedChanges[sCardId]) {
                                if (oChange.content.dashboardLayout.oldRow) {
                                    aCheckedChanges[sCardId].content.dashboardLayout.oldRow = oChange.content.dashboardLayout.oldRow;
                                }
                                continue;
                            }
                            aCheckedChanges[sCardId] = oChange;
                        }
                        Object.keys(aCheckedChanges).forEach(function (sKey) {
                            var oChange = aCheckedChanges[sKey];
                            if (oChange.content.dashboardLayout.oldRow && oChange.content.dashboardLayout.oldRow === oChange.content.dashboardLayout.row) {
                                return;
                            }
                            aChangesForSave.push(aCheckedChanges[sKey]);
                        });
                        // move the values to column level
                        aChangesForSave.forEach(function (oChange) {
                            var oTemp = oChange.content.dashboardLayout;
                            oChange.content.dashboardLayout = {};
                            oChange.content.dashboardLayout["C" + iColCount] = oTemp;
                        });
                    }
                } else {
                    // to maintain the restore/reset functionality in Manage Cards scenario, update the aOrderedCards
                    // TODO: enable/disable to restore/reset button can be improved with a flag updated on personalization save.
                    var aContent = this.getLayout().getContent();
                    this.aOrderedCards = this._getCardArrayAsVariantFormat(aContent);
                    aChangesForSave = aChanges;
                }
                this.savePersonalization(aChangesForSave);
            },

            /**
             * As of 1708,
             * the personalization will use savePersonalization.
             */
            saveVariant: function (oEvent) {
                var that = this;
                this.smartVariandManagement.getVariantsInfo(function (aVariants) {
                    var oPersonalisationVariantKey = null;
                    if (aVariants && aVariants.length > 0) {
                        oPersonalisationVariantKey = aVariants[0].key;
                    }
                    var bOverwrite = oPersonalisationVariantKey !== null;

                    var oParams = {
                        name: "Personalisation",
                        global: false,
                        overwrite: bOverwrite,
                        key: oPersonalisationVariantKey,
                        def: true
                    };
                    that.smartVariandManagement.fireSave(oParams);
                });
            },

            /**
             * delta changes
             *
             * Personalization is saved as flexibility delta changes from 1708
             * Includes - positioning, resizing, view switches and visibility
             */
            savePersonalization: function (oChange) {
                var oLayout = this.getLayout();
                if (oLayout) {
                    if (oChange) {
                        if (!Array.isArray(oChange)) {
                            this.oFlexController.createAndApplyChange(oChange, oLayout);
                        } else {
                            oChange.forEach(function(oOneChange) {
                                this.oFlexController.createAndApplyChange(oOneChange, oLayout);
                            }.bind(this));
                        }
                        this.oFlexController.saveAll();
                        return;
                    }
                    var aCardsInfo, sChangeType;
                    if (oLayout.getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                        aCardsInfo = {
                            cards: oLayout.getLayoutDataJSON()
                        };
                        sChangeType = "manageCardsForDashboardLayout";
                    } else {
                        aCardsInfo = this._getCardArrayAsVariantFormat(oLayout.getContent());
                        sChangeType = "manageCardsForEasyScanLayout";
                    }
                    /**
                     * This currently saves the complete array of cards as one change.
                     * In order to align with key user, we need to save at least visibility as individual card changes.
                     */
                    this.oFlexController.createAndApplyChange({
                        changeType: sChangeType,
                        content: aCardsInfo,
                        isUserDependent: true
                    }, oLayout);
                    this.oFlexController.saveAll();
                }
            },
            /**
             * end
             */

            getLayout: function () {
                return this.getView() ? this.getView().byId("ovpLayout") : null;
            },

            _createPersistencyControlForSmartVariantManagement: function () {
                var that = this;
                sap.ui.core.Control.extend("sap.ovp.app.PersistencyControl", {
                    metadata: {
                        properties: {
                            persistencyKey: {
                                type: "string",
                                group: "Misc",
                                defaultValue: null
                            }
                        }
                    }
                });
                var oPersistencyControl = new sap.ovp.app.PersistencyControl({
                    persistencyKey: "ovpVariant"
                });

                /**
                 * Interface function for SmartVariantManagment control, returns the current used variant data
                 *
                 * @public
                 * @returns {json} The currently set variant
                 */
                oPersistencyControl.fetchVariant = function () {
                    //in the initial loading the variant is not saved
                    if (that.isInitialLoading) {
                        that.isInitialLoading = false;
                        return {};
                    }
                    var oLayout = this.getLayout();
                    if (!oLayout) {
                        jQuery.sap.log.error("Could not save persistency variant - 'ovpLayout' does not exists");
                        return;
                    }

                    if (this.getLayout().getMetadata().getName() === "sap.ovp.ui.DashboardLayout") {
                        var oVariants = this.getLayout().getLayoutDataJSON();
                        return {
                            cards: oVariants
                        };
                    } else {
                        var aLayoutContent = oLayout.getContent();
                        var aContentForSave = this._getCardArrayAsVariantFormat(aLayoutContent);
                        this.oOrderedCards = aContentForSave;
                        return {
                            cards: aContentForSave
                        };
                    }
                }.bind(this);

                return oPersistencyControl;

            },

            _initShowHideCardsButton: function () {
              // code changes based on the inputs from the FLP team - incident #1770148144
              var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
              manageCardsButton = {
                controlType : "sap.ushell.ui.launchpad.ActionItem",
                bCurrentState : false,
                oControlProperties : {
                  icon: "sap-icon://dimension",
                  text: this._getLibraryResourceBundle().getText("hideCardsBtn_title"),
                  tooltip: this._getLibraryResourceBundle().getText("hideCardsBtn_tooltip"),
                  press: this._onCardMenuButtonPress.bind(this)
                },
                bIsVisible: true,
                aStates: ["app"]
              };
              oRenderer.addUserAction(manageCardsButton);
            },

            _onCardMenuButtonPress: function () {
                var oModel,
                    sLayoutName = this.getLayout().getMetadata().getName();
                
                // maintain array of changes to be saved as delta changes on OK
                this.visibilityChanges = [];

                function getCardIndexInArray(aCardsArr, cardId) {
                    for (var i = 0; i < aCardsArr.length; i++) {
                        if (aCardsArr[i].id == cardId) {
                            return i;
                        }
                    }
                    return -1;
                }

                function createOrDestroyCards(aOldContent, aNewContent, bResetInDashboardLayout) {
                    var oldIndex = -1;
                    for (var i = 0; i < aNewContent.length; i++) {
                        //In case the card position has been changed, we need to get the card index in the old array.
                        //Otherwise, the new and the old position are the same
                        if (aOldContent[i].id == aNewContent[i].id) {
                            oldIndex = i;
                        } else {
                            oldIndex = getCardIndexInArray(aOldContent, aNewContent[i].id);
                        }
                        var oOldComponentContainer = this.getView().byId(aNewContent[i].id);
                        var oOldCard = oOldComponentContainer.getComponentInstance();
                        if (bResetInDashboardLayout) {
                            if (oOldCard) {
                                oOldCard.destroy();
                            }
                        }

                        if (aNewContent[i].visibility != aOldContent[oldIndex].visibility || bResetInDashboardLayout) {
                            if (aNewContent[i].visibility === true) {
                                var oCard = this._getCardFromManifest(aNewContent[i].id);
                                if (oCard) {
                                    this.createLoadingCard(oCard);
                                    oCard.settings.baseUrl = this._getBaseUrl();
                                    this._clearStoredEntities(); //Clear previously temporarily stored entity types
                                    this._initCardModel(oCard.model);
                                    this._loadCardComponent(oCard.template);
                                    this._createModelViewMap(oCard);
                                    if (oCard.settings.tabs) {
                                        var iIndex = 0;
                                        if (this.aOrderedCards[i].selectedKey) {
                                            iIndex = this.aOrderedCards[i].selectedKey - 1;
                                        }
                                        this.initializeTabbedCard(
                                            oCard, iIndex);
                                    }
                                    this.createCard(oCard);
                                }
                            } else {
                                if (oOldCard) {
                                    oOldCard.destroy();
                                }
                            }
                        }
                    }
                }

                function cardTitleFormatter(id) {
                    var oCard = this._getCardFromManifest(id);
                    if (oCard) {
                        var cardSettings = oCard.settings;
                        if (cardSettings.title) {
                            return cardSettings.title;
                        } else if (cardSettings.category) {
                            return (cardSettings.category);
                        } else if (cardSettings.subTitle) {
                            return cardSettings.subTitle;
                        }
                        return id;
                    }
                    else {
                        console.log("Card id "+ id +" is not available in the manifest");
                        return "";
                    }
                }

                var oCardsTableTemplate = new ColumnListItem({
                    cells: [
                        new Text({
                            text: {
                                path: "id",
                                formatter: cardTitleFormatter.bind(this)
                            }
                        }),
                        new Switch({
                            state: "{visibility}",
                            customTextOff: " ",
                            customTextOn: " ",
                            change: function (event) {
                                var parent = event.oSource.getParent();
                                parent.toggleStyleClass('sapOVPHideCardsTableItem');
                                parent.getCells()[0].toggleStyleClass('sapOVPHideCardsDisabledCell');
                                var oCard = event.getSource().getBindingContext().getObject();
                                var iIsCardChangedAgain = this.visibilityChanges.findIndex(function (oChange, iIndex, arr) {
                                    return oChange.content.cardId === oCard.id;
                                });
                                if (iIsCardChangedAgain > -1) {
                                    this.visibilityChanges.splice(iIsCardChangedAgain, 1);
                                } else {
                                    this.visibilityChanges.push({
                                        changeType: "visibility",
                                        content: {
                                            cardId: oCard.id,
                                            visibility: event.getParameter("state")
                                        },
                                        isUserDependent: true
                                    });
                                }
                            }.bind(this),
                            tooltip: this._getLibraryResourceBundle().getText("hideCards_switchTooltip")
                        })
                    ]
                });

                var oCardsTable = new Table("sapOVPHideCardsTable", {
                    backgroundDesign: sap.m.BackgroundDesign.Transparent,
                    showSeparators: sap.m.ListSeparators.Inner,
                    columns: [
                        new Column({
                            vAlign: "Middle"
                        }),
                        new Column({
                            hAlign: sap.ui.core.TextAlign.Right,
                            vAlign: "Middle",
                            width: "4.94rem"
                        })
                    ]
                });
                oCardsTable.addStyleClass('sapOVPHideCardsTable');
                oCardsTable.bindItems({
                    path: "/cards",
                    template: oCardsTableTemplate
                });

                var oOrigOnAfterRendering = oCardsTable.onAfterRendering;
                oCardsTable.onAfterRendering = function (event) {
                    oOrigOnAfterRendering.apply(oCardsTable, arguments);

                    var items = event.srcControl.mAggregations.items;
                    if (items) {
                        for (var i = 0; i < items.length; i++) {
                            if (!items[i].getCells()[1].getState()) {
                                items[i].addStyleClass('sapOVPHideCardsTableItem');
                                items[i].getCells()[0].addStyleClass('sapOVPHideCardsDisabledCell');
                            }
                        }
                    }
                    setTimeout(function () {
                        jQuery('.sapMListTblRow').first().focus();
                    }, 200);
                };

                var oSaveButton = new Button("manageCardsokBtn", {
                    text: this._getLibraryResourceBundle().getText("okBtn"),
                    press: function () {
                        var aDialogCards = this.oDialog.getModel().getProperty('/cards');
                        createOrDestroyCards.apply(this, [this.aOrderedCards, aDialogCards, false]);
                        this.aOrderedCards = aDialogCards;
                        this._updateDashboardLayoutCards(this.aOrderedCards);
                        this._updateLayoutWithOrderedCards();
                        this.savePersonalization(this.visibilityChanges);
                        this.oDialog.close();
                    }.bind(this)
                });

                var oCancelButton = new Button("manageCardsCancelBtn", {
                    text: this._getLibraryResourceBundle().getText("cancelBtn"),
                    press: function () {
                        this.oDialog.close();
                    }.bind(this)
                });

                var oResetButton = new Button("manageCardsResetBtn", {
                    text: this._getLibraryResourceBundle().getText("resetBtn"),
                    enabled: ((sLayoutName === "sap.ovp.ui.DashboardLayout") ? true : this.isValidForReset()),
                    press: function () {
                        sap.m.MessageBox.show(this._getLibraryResourceBundle().getText("reset_cards_confirmation_msg"), {
                            id: "resetCardsConfirmation",
                            icon: sap.m.MessageBox.Icon.QUESTION,
                            title: this._getLibraryResourceBundle().getText("reset_cards_confirmation_title"),
                            actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                            onClose: function (oAction) {
                                if (oAction === sap.m.MessageBox.Action.OK) {
                                    createOrDestroyCards.apply(this, [this.aOrderedCards, this.aManifestOrderedCards, (sLayoutName === "sap.ovp.ui.DashboardLayout") ? true : false]);
                                    this.aOrderedCards = this.aManifestOrderedCards;
                                    this._resetDashboardLayout();
                                    this._updateDashboardLayoutCards(this.aOrderedCards);
                                    this._updateLayoutWithOrderedCards();
                                    // All USER layer personalization will be discarded.
                                    // TODO: handle promise reject case for discarding changes
                                    this.oFlexController.discardChangesForId(this.getLayout().getId(), true);
                                    this.oDialog.close();
                                }
                            }.bind(this)
                        });
                    }.bind(this)
                });

                this.oDialog = new Dialog({
                    title: this._getLibraryResourceBundle().getText("hideCardsBtn_title"),
                    contentWidth: "29.6rem",
                    contentHeight: "50%",
                    stretch: sap.ui.Device.system.phone,
                    content: oCardsTable,
                    buttons: [oSaveButton, oCancelButton, oResetButton],
                    afterClose: function () {
                        this.visibilityChanges = [];
                        this.oDialog.destroy();
                    }.bind(this)
                }).addStyleClass("sapOVPCardsVisibilityDialog");
                var oDialogCardsModel;
                if (sLayoutName === "sap.ovp.ui.DashboardLayout") {
                    oDialogCardsModel = jQuery.extend(true, [], this._getCardArrayAsVariantFormatDashboard());
                } else {
                    oDialogCardsModel = jQuery.extend(true, [], this.aOrderedCards);
                }

                oModel = new JSONModel({
                    cards: oDialogCardsModel
                });
                this.oDialog.setModel(oModel);

                this.oDialog.open();
            },

            isValidForReset : function () {
                for (var i = 0; i < this.aManifestOrderedCards.length; i++) {
                    if (this.aManifestOrderedCards[i].id !== this.aOrderedCards[i].id || this.aManifestOrderedCards[i].visibility !== this.aOrderedCards[i].visibility) {
                        return true;
                    }
                }
                return false;
            },

            isDragAndDropEnabled: function () {
                return !sap.ui.Device.system.phone;
            },

            getGlobalFilter: function () {
                if (!this.oGlobalFilter) {
                    this.oGlobalFilter = this.getView().byId("ovpGlobalFilter");
                }
                return this.oGlobalFilter;
            },

            getUIModel: function () {
                if (!this.oUIModel) {
                    var oOwnerComponent = this.getOwnerComponent();
                    this.oUIModel = oOwnerComponent && oOwnerComponent.getModel("ui");
                }
                return this.oUIModel;
            },

            _parseNavigationVariant: function () {
                this.oParseNavigationPromise = this.oNavigationHandler.parseNavigation();
            },

            /*
             Applies the filters when returning/navigating to OVP from an external application or
             when the filters are passed as URL parameters
             */
            _setNavigationVariantToGlobalFilter: function (oAppData, oURLParameters, sNavType) {

                var oGlobalFilter = this.getGlobalFilter();

                if (!oGlobalFilter) {
                    return;
                }

                //Based on navigation type, process the parameters
                switch (sNavType) {

                    //iAppState triggered on back navigation
                    case "iAppState":
                        //Non Custom data handling
                        if (oAppData.selectionVariant) {

                            var oCurrentVariant, oSelectionVariant, aSelectionVariantProperties, bMarkDirty = false;
                            var oUnsavedData, oSavedData, oUnsavedDataCustom, oSavedDataCustom;
                            var oUiState, oSavedUiState, oUnsavedUiState;

                            //Clear the global filter variant
                            oGlobalFilter.clearVariantSelection();

                            //Set the original variant by reading from application data, when the variant
                            //is set, the corresponding filters and models and data suite for that variant
                            //are automatically set
                            oCurrentVariant = JSON.parse(oAppData.selectionVariant);
                            oGlobalFilter.setCurrentVariantId(oCurrentVariant.SelectionVariantID);

                            //Get the data suite for the original variant, this was saved data of variant
                            oSavedUiState = oGlobalFilter.getUiState({
                                allFilters: false
                            });
                            oSavedData = oSavedUiState && JSON.stringify(oSavedUiState.getSelectionVariant());	//SAVED

                            //Get the custom data for the original variant, this was saved data of variant
                            oSavedDataCustom = oGlobalFilter.getFilterData()._CUSTOM;	//SAVED CUSTOM

                            oSavedDataCustom = ((typeof oSavedDataCustom == 'undefined') ? {} : oSavedDataCustom);

                            //Set the data suite again from app data so as to apply any unsaved changes
                            //to the variant
                            oUiState = new UIState({
                                selectionVariant: oAppData.oSelectionVariant.toJSONObject()
                            });
                            oGlobalFilter.setUiState(oUiState, {
                                replace: true,
                                strictMode: false
                            });

                            //Get the selection properties from the app data to be put in the filter bar
                            oSelectionVariant = new SelectionVariant(oAppData.selectionVariant);
                            aSelectionVariantProperties = oSelectionVariant.getParameterNames().concat(oSelectionVariant.getSelectOptionsPropertyNames());
                            for (var i = 0; i < aSelectionVariantProperties.length; i++) {
                                oGlobalFilter.addFieldToAdvancedArea(aSelectionVariantProperties[i]);
                            }

                            // getting unsaved data after additional filters have been added in the above loop
                            oUnsavedUiState = oGlobalFilter.getUiState({
                                allFilters: false
                            });
                            oUnsavedData = oUnsavedUiState && JSON.stringify(oUnsavedUiState.getSelectionVariant());	//UNSAVED

                            //Compare saved and unsaved data and mark the filter dirty accordingly
                            if (oSavedData !== oUnsavedData) {
                                bMarkDirty = true;
                            }

                            //Custom Data Handling
                            if (oAppData.customData && Object.keys(oAppData.customData).length > 0) {

                                var oUnsavedDataCustom = oAppData.customData;	//UNSAVED CUSTOM
                                this.restoreCustomAppStateDataExtension(oUnsavedDataCustom);

                                //Compare saved and unsaved for custom filters and mark the filter dirty accordingly
                                if (JSON.stringify(oSavedDataCustom) !== JSON.stringify(oUnsavedDataCustom)) {
                                    bMarkDirty = true;
                                }

                            }

                            oGlobalFilter.getSmartVariant().currentVariantSetModified(bMarkDirty);

                            //Though there are several public methods to update filter count, but to avoid any
                            //unnecessary processing, we are doing it directly
                            oGlobalFilter._updateToolbarText();
                        }
                        break; //from switch case

                    case "xAppState":
                    case "URLParams":

                        //oAppData.oSelectionVariant contains the navigation selection variant
                        //oAppData.selectionVariant is just the string of oAppData.oSelectionVariant
                        //oAppData.oDefaultedSelectionVariant contains default selection variant, that comes
                        //from FLP user settings

                        /****** START OF RULES (how variants will be applied) ****************************************
                         *
                         *  1.  If there is a navigation variant present (oAppData.bNavSelVarHasDefaultsOnly = FALSE),
                         *      then clear the global filter completely (including variant selection) ignoring all other
                         *      incoming variants and defaults                         *
                         *  2.  If (oAppData.bNavSelVarHasDefaultsOnly = TRUE), this means oAppData will contains only
                         *      FLP user settings defaults, then following rules apply:
                         *
                         *      a. Global Filter initialized with user default variant, then ignore all others
                         *      b. Global Filter initialized with standard variant, then Load oAppData.oDefaultedSelectionVariant
                         *
                         * For case 2->b, Global Filter initialized with standard variant can contain default values
                         * coming from metadata, in that case merge those already present default values with
                         * oAppData.oDefaultedSelectionVariant
                         *
                         * Display Currency parameter will get special attention : If after RULE 2a is
                         * executed and display currency parameter in filter bar remains empty, then populate display
                         * currency by first looking into oAppData.oDefaultedSelectionVariant and if not found, then
                         * from default metadata values
                         *
                         ******* END OF RULES ************************************************************************/

                        var oUiState, aSelVarProperties = [];

                        var oNavigationVariant = new SelectionVariant(oAppData.oSelectionVariant.toJSONObject());
                        var oDefaultVariant = new SelectionVariant(oAppData.oDefaultedSelectionVariant.toJSONObject());

                        //RULE 1 (Check table comment above)
                        if (!oAppData.bNavSelVarHasDefaultsOnly && !oNavigationVariant.isEmpty()) {
                            oUiState = new UIState({
                                selectionVariant: oNavigationVariant.toJSONObject()
                            });
                            //Reset existing filter bar completely
                            oGlobalFilter.clearVariantSelection();
                            oGlobalFilter.clear();
                            oGlobalFilter.setUiState(oUiState, {
                                replace: true,
                                strictMode: false
                            });
                            aSelVarProperties = aSelVarProperties.concat(oNavigationVariant.getParameterNames()
                                .concat(oNavigationVariant.getSelectOptionsPropertyNames()));
                        }

                        //RULE 2 (Check table comment above)
                        if (oAppData.bNavSelVarHasDefaultsOnly && !oDefaultVariant.isEmpty() && oGlobalFilter.getCurrentVariantId() === "") {
                            oUiState = new UIState({
                                selectionVariant: oDefaultVariant.toJSONObject()
                            });
                            //replace false means do not reset existing filter bar
                            oGlobalFilter.setUiState(oUiState, {
                                replace: false,
                                strictMode: false
                            });
                            aSelVarProperties = aSelVarProperties.concat(oDefaultVariant.getParameterNames()
                                .concat(oDefaultVariant.getSelectOptionsPropertyNames()));
                        }

                        var iLength;
                        if (aSelVarProperties && aSelVarProperties.length > 0) {
                            //Add field to visible filter bar
                            iLength = aSelVarProperties.length;
                            while (iLength--) {
                                oGlobalFilter.addFieldToAdvancedArea(aSelVarProperties[iLength]);
                            }
                        }
                        //Set DisplayCurrency Parameter if left empty for user variant (after RULE 2a)
                        if (oGlobalFilter.getCurrentVariantId() !== "") {
                            this._setDisplayCurrency(oDefaultVariant);
                        }
                        break; //from switch case
                }
            },

            /**
             * This function checks if DisplayCurrency parameter is left empty
             * If yes, it tries to set it first from user default settings then
             * from metadata defaults
             * @param oDefaultVariant
             * @private
             */
            _setDisplayCurrency: function (oDefaultVariant) {

                var oGlobalFilter = this.getGlobalFilter();
                if (!oGlobalFilter) {
                    return;
                }
                //Check if any analytical parameter present with name DisplayCurrency
                var iLength, oDisplayCurrency;
                var aParameters = oGlobalFilter.getAnalyticalParameters();
                if (aParameters && aParameters.length > 0) {
                    iLength = aParameters.length;
                    while (iLength--) {
                        if ((aParameters[iLength].name === "P_DisplayCurrency") || (aParameters[iLength].name === "DisplayCurrency")) {
                            oDisplayCurrency = aParameters[iLength];
                            break;
                        }
                    }
                }
                //There is no parameter for DisplayCurrency in filter bar
                if (!oDisplayCurrency) {
                    return;
                }
                //If DisplayCurrency present and already filled with value, then do nothing
                //oDisplayCurrency.fieldName looks like $Parameter.P_DisplayCurrency
                var aFilters = oGlobalFilter.getFilters([oDisplayCurrency.fieldName]);
                var sDefaultValue = aFilters && aFilters[0] && aFilters[0].oValue1;
                if (sDefaultValue && sDefaultValue !== " ") {
                    return;
                }
                //Read user settings defaults and try to populate DisplayCurrency Parameter
                //oDefaultVariant can contain the parameter value in SelectOption section as well, this
                //implementation is from navigation handler
                var sNameWithoutPrefix, sNameWithPrefix;
                if (oDisplayCurrency.name.indexOf("P_") === 0) {
                    sNameWithPrefix = oDisplayCurrency.name;
                    sNameWithoutPrefix = oDisplayCurrency.name.substr(2); // remove P_ prefix
                } else {
                    sNameWithPrefix = "P_" + oDisplayCurrency.name;
                    sNameWithoutPrefix = oDisplayCurrency.name;
                }
                if (oDefaultVariant && !oDefaultVariant.isEmpty()) {
                    var oSelectOption;
                    sDefaultValue = oDefaultVariant.getParameter(sNameWithoutPrefix);
                    if (!sDefaultValue || sDefaultValue === " ") {
                        sDefaultValue = oDefaultVariant.getParameter(sNameWithPrefix);
                    }
                    if (!sDefaultValue || sDefaultValue === " ") {
                        oSelectOption = oDefaultVariant.getSelectOption(sNameWithoutPrefix);
                        sDefaultValue = oSelectOption && oSelectOption[0] && oSelectOption[0].Low;
                    }
                    if (!sDefaultValue || sDefaultValue === " ") {
                        oSelectOption = oDefaultVariant.getSelectOption(sNameWithPrefix);
                        sDefaultValue = oSelectOption && oSelectOption[0] && oSelectOption[0].Low;
                    }
                }
                if (!sDefaultValue || sDefaultValue === " ") {
                    sDefaultValue = oDisplayCurrency.defaultPropertyValue; //metadata default
                }
                if (!sDefaultValue || sDefaultValue === " ") {
                    return; //not found at last
                }

                var oSelectionVariant = new SelectionVariant();
                oSelectionVariant.addParameter(oDisplayCurrency.name, sDefaultValue);
                var oUiState = new UIState({
                    selectionVariant: oSelectionVariant.toJSONObject()
                });
                //replace false means do not reset existing filter bar
                //There always be a match found for parameter in filter bar so this will be applied to parameter only
                oGlobalFilter.setUiState(oUiState, {
                    replace: false,
                    strictMode: false
                });
            },

            /**
             * This function takes a variant and modifies the parameters
             * using the new name
             * @param oVariant
             * @param sOldName
             * @param sNewName
             * @returns {object}
             * @private
             */
            _enhanceVariant: function (oVariant, sOldName, sNewName) {

                var oParameter = oVariant.getParameter(sOldName);
                var oSelectOption = oVariant.getSelectOption(sOldName);

                //If parameter is found in variant, then rename it to new name
                //Else check if a select option is found, then rename it and
                //then move from select-option section to parameter section

                if (oParameter) {
                    oVariant.renameParameter(sOldName, sNewName);

                } else if (oSelectOption) {

                    var sValue = oSelectOption[0] && oSelectOption[0].Low;
                    if (sValue && sValue !== "") {
                        sValue += ""; //Convert any type to string
                        oVariant.addParameter(sNewName, sValue);
                        oVariant.removeSelectOption(sOldName);
                    }
                }

                //Return is not required since objects are passed by reference but
                //here object is returned to support method chaining
                return oVariant;
            },

            /**
             * Event handler before variant is saved
             */
            onBeforeSFBVariantSave: function () {

                var oCustomData = {};

                this.getCustomAppStateDataExtension(oCustomData);

                //Before variant is saved, store the custom filter data
                this.getGlobalFilter().setFilterData({
                    _CUSTOM: oCustomData
                });
            },

            /**
             * Event handler after variant is loaded
             */
            onAfterSFBVariantLoad: function () {

                var oData = this.getGlobalFilter().getFilterData();

                if (oData._CUSTOM && Object.keys(oData._CUSTOM).length > 0) {
                    this.restoreCustomAppStateDataExtension(oData._CUSTOM);
                }
            },

            /**
             * Event handler to change the snapped header text when the filters change
             * @param oEvent
             */
            onAssignedFiltersChanged: function (oEvent) {
                if (oEvent.getSource() && this.getView().byId("ovpFilterText")) {
                    this.getView().byId("ovpFilterText").setText(oEvent.getSource().retrieveFiltersWithValuesAsText());
                }
            },

            /**
             * Gets current app state
             * @returns {object}
             * @private
             */
            _getCurrentAppState: function () {

                var oGlobalFilter = this.getGlobalFilter();
                var oUiState = oGlobalFilter.getUiState({
                    allFilters: false
                });
                var oSelectionVariant = oUiState && oUiState.getSelectionVariant();

                //Do not store dirty variants, reset them
                if (oGlobalFilter.getSmartVariant().currentVariantGetModified()) {
                    oSelectionVariant.SelectionVariantID = "";
                }
                var sSelectionVariant = oSelectionVariant && JSON.stringify(oSelectionVariant);

                //Get data from standard filters
                var oNavigableSelectionVariant = new SelectionVariant(sSelectionVariant);
                //Get data from custom filters
                var oCustomData = {};
                this.getCustomAppStateDataExtension(oCustomData);

                return {
                    selectionVariant: oNavigableSelectionVariant.toJSONString(),
                    customData: oCustomData
                };
            },

            /**
             * Create an app state key using app state data and update url with iAppstate
             * @private
             */
            _storeCurrentAppStateAndAdjustURL: function (oEvent) {

                //Initially this.oAppStatePromise is not set, it is set only when a new promise is created
                //on global filter search, however, as soon as the promise is resolved/rejected, this.oAppStatePromise
                //is nullified
                //So, if this.oAppStatePromise exists means that the previous promise is still pending. In
                //such case, reject the previous promise as we will create a new one for new global filter
                //search

                if (oEvent && !oEvent.oSource._bDirtyViaDialog) {
                    return;
                }

                if (!this.bGlobalFilterLoaded) {
                    return;
                }

                if (this.oAppStatePromise) {
                    //Parameter "skip" to denote that rejection as part of process and not
                    //because of actual error
                    this.rejectPreviousPromise && this.rejectPreviousPromise("skip");
                }

                this.oAppStatePromise = new Promise(function (resolve, reject) {
                    this.rejectPreviousPromise = reject;
                    var oAppInnerData = this._getCurrentAppState();
                    var oCurrentAppState = this.oNavigationHandler.storeInnerAppStateWithImmediateReturn(oAppInnerData);

                    //oCurrentAppState contains a promise object that resolves when appstate is created successfully
                    oCurrentAppState.promise.then(function (sAppStateKey) {
                        resolve(sAppStateKey);
                    }, function (sError) {
                        reject(sError.getErrorCode());
                    });
                }.bind(this));

                //Success handler for this.oAppStatePromise
                var fnFulfilled = function (sAppStateKey) {
                    this.oAppStatePromise = null; //Nullified so that we can find out later that this is not pending
                    if (sAppStateKey && sAppStateKey.length > 0) {
                        this.oNavigationHandler.replaceHash(sAppStateKey);
                        return;
                    }
                    throw "AppState key is empty";
                }

                //Failure handler for this.oAppStatePromise
                var fnRejected = function (sError) {
                    this.oAppStatePromise = null;
                    if (sError === "skip") {
                        throw sError; //"skip" means not actual error
                    }
                    throw ("Something went wrong while storing AppState - " + sError);
                }

                //this.oAppStatePromise.then itself returns a promise, any return from fnFulfilled or fnRejected
                //is propagated accordingly
                //catch is used just to process promise failure (promise success is not required)
                this.oAppStatePromise
                    .then(fnFulfilled.bind(this), fnRejected.bind(this))
                    //catch statement may be triggered even if there is failure in fnFulfilled
                    .catch(function (sError) {
                        if (sError === "skip") {
                            return; //"skip" means not actual error
                        }
                        jQuery.sap.log.error(sError);
                    });
            }
        });
    }
);
