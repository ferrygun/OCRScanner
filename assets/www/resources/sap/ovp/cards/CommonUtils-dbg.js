(function () {
    "use strict";
    jQuery.sap.declare("sap.ovp.cards.CommonUtils");
    sap.ovp.cards.CommonUtils = {
        app : undefined,
        navigationHandler : undefined,
        supportedCards: ["sap.ovp.cards.list", "sap.ovp.cards.table", "sap.ovp.cards.stack", "sap.ovp.cards.linklist", "sap.ovp.cards.charts.analytical", "sap.ovp.cards.charts.bubble", "sap.ovp.cards.charts.donut", "sap.ovp.cards.charts.line"],

        enable : function(app, oNavHandler) {
            this.app = app;
            this.navigationHandler = oNavHandler;
        },

        getApp : function() {
            return this.app;
        },

        getNavigationHandler : function() {
            return this.navigationHandler;
        },

        createKeyForCB: function (oTabs, oTab) {
            return oTabs.indexOf(oTab) + 1;
        },

        /**
         * Does Error Handling for API
         *
         * @method errorHandlingForAPI
         * @param {String} sMessage - Error Message text
         * @param {Function} reject - reject function of promise
         * @param {Object} [oError] - Error in case of MetaModel loading or Component Creation is failed
         */
        errorHandlingForAPI: function (sMessage, reject, oError) {
            var oErrorObject = {};
            oErrorObject.message = sMessage;
            if (oError) {
                oErrorObject._oError = oError;
                oErrorObject.getActualError = function () {
                    return oErrorObject._oError;
                };
            }
            jQuery.sap.log.error(oErrorObject.message);
            reject(oErrorObject);
        },

        /**
         * Check Whether API is used or not
         *
         * @method checkIfAPIIsUsed
         * @param {Object} oContext - Current Context
         * @returns {boolean} bCheckForAPI - It will be true if API is used else false
         */
        checkIfAPIIsUsed: function (oContext) {
            var bCheckForAPI = false;
            var oOwnerComponent = oContext.getOwnerComponent();
            if (!!oOwnerComponent) {
                var oComponentData = oOwnerComponent.getComponentData();
                if (!!oComponentData && oComponentData.ovpCardsAsApi) {
                    bCheckForAPI = true;
                }
            }
            return bCheckForAPI;
        },

        /**
         * Recreate OVP Cards for View Switch
         * API support for View Switch
         *
         * @method recreateCard
         * @param {Object} oCardProperties - Card's updated properties for view switch
         * @param {Object} oComponentData - Card's Component Data
         */
        recreateCard: function (oCardProperties, oComponentData) {
            var oManifest = oComponentData.manifest;
            var sCardId;
            for (var card in oManifest.cards) {
                sCardId = card;
            }
            var oCard = oManifest.cards[sCardId];
            if (oCard.template === "sap.ovp.cards.charts.analytical") {
                oCard.settings.chartAnnotationPath = oCardProperties.chartAnnotationPath;
                oCard.settings.navigation = oCardProperties.navigation;
            }
            oCard.settings.annotationPath = oCardProperties.annotationPath;
            oCard.settings.dynamicSubtitleAnnotationPath = oCardProperties.dynamicSubtitleAnnotationPath;
            oCard.settings.presentationAnnotationPath = oCardProperties.presentationAnnotationPath;
            oCard.settings.selectionAnnotationPath = oCardProperties.selectionAnnotationPath;
            oCard.settings.selectionPresentationAnnotationPath = oCardProperties.selectionPresentationAnnotationPath;
            oCard.settings.dataPointAnnotationPath = oCardProperties.dataPointAnnotationPath;
            oCard.settings.identificationAnnotationPath = oCardProperties.identificationAnnotationPath;
            // headerAnnotationPath is a property added to the manifest.json for Qualifier support in HeaderInfo annotations.
            oCard.settings.headerAnnotationPath = oCardProperties.headerAnnotationPath;
            oCard.settings.selectedKey = oCardProperties.selectedKey;
            if (oCard) {
                oManifest.cards[sCardId] = oCard;
                sap.ovp.cards.CommonUtils.createCardComponent(oComponentData.parentView, oManifest, oComponentData.containerId);
            }
        },

        /**
         * Creating OVP Cards for External Libraries
         *
         * @method createCardComponent
         * @param {Object} oView - View where the card's component will be set to a Container
         * @param {Object} oManifest - Manifest settings object
         * @param {String} sContainerId - Container's Id where card's component will be set
         * @returns {Promise} - returns a promise on state of card creation
         */
        createCardComponent: function (oView, oManifest, sContainerId) {
            return new Promise(function(resolve, reject) {
            var oCardManifest, cardId, sMessage = "";
            if (!!oManifest) {
                for (var card in oManifest.cards) {
                    oCardManifest = oManifest.cards[card];
                    cardId = card;
                }
                if (!!oCardManifest && !!cardId) {
                    if (!!oCardManifest.template && !!oCardManifest.model && !!oCardManifest.settings) {
                        /*
                         Checking for the supported Cards in the API
                         */
                        if (this.supportedCards.indexOf(oCardManifest.template) !== -1) {
                            if (!!sContainerId && typeof sContainerId === 'string') {
                                if (!!oView) {
                                    var oModel = oView.getModel(oCardManifest.model);
                                    var getMetaModelPromise = oModel.getMetaModel().loaded();
                                    getMetaModelPromise.then(function () {
                                        //alert("MetaModel Loaded");
                                        var oComponentConfig = {
                                            async: true,
                                            name: oCardManifest.template,
                                            componentData: {
                                                model: oModel,
                                                ovpCardsAsApi: true,
                                                parentView: oView,
                                                manifest: oManifest,
                                                containerId: sContainerId,
                                                showDateInRelativeFormat: oManifest.showDateInRelativeFormat,
                                                disableTableCardFlexibility: oManifest.disableTableCardFlexibility,
                                                template: oCardManifest.template,
                                                i18n: null,
                                                cardId: cardId,
                                                settings: oCardManifest.settings,
                                                appComponent: null,
                                                mainComponent: null
                                            }
                                        };
                                        //Component creation will be done asynchronously
                                        sap.ui.component(oComponentConfig).then(function (oComponent) {

                                            var oComponentContainer = oView.byId(sContainerId);
                                            if (!!oComponentContainer) {
                                                var oOldCard = oComponentContainer.getComponentInstance();

                                                //Add the card component to the container
                                                oComponent.setModel(oModel);
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
                                                resolve(true);
                                            } else {
                                                sMessage = "Component Container '" + sContainerId + "' is not present in the current View";
                                                this.errorHandlingForAPI(sMessage, reject);
                                            }

                                        }.bind(this), function (oError) {
                                            sMessage = "Component creation failed";
                                            this.errorHandlingForAPI(sMessage, reject, oError);
                                        }.bind(this));
                                    }.bind(this), function (oError) {
                                        sMessage = "MetaModel was not loaded";
                                        this.errorHandlingForAPI(sMessage, reject, oError);
                                    }.bind(this));
                                } else {
                                    sMessage = "First argument oView is null";
                                    this.errorHandlingForAPI(sMessage, reject);
                                }
                            } else {
                                sMessage = "ContainerId should be of type string and not null";
                                this.errorHandlingForAPI(sMessage, reject);
                            }
                        } else {
                            sMessage = oCardManifest.template + " card type is not supported in the API";
                            this.errorHandlingForAPI(sMessage, reject);
                        }
                    } else {
                        sMessage = "Cards template or model or settings are not defined";
                        this.errorHandlingForAPI(sMessage, reject);
                    }
                } else {
                    sMessage = "Cards manifest entry or cardId is null";
                    this.errorHandlingForAPI(sMessage, reject);
                }
            } else {
                sMessage = "Second argument oManifest is null";
                this.errorHandlingForAPI(sMessage, reject);
            }
          }.bind(this));
        },

        /* Returns column name that contains the unit for the measure */
        getUnitColumn : function (measure, oEntityType) {
          var tempUnit, properties = oEntityType.property;
          for (var i = 0, len = properties.length; i < len; i++) {
            if (properties[i].name == measure) {
                      if (properties[i].hasOwnProperty("Org.OData.Measures.V1.ISOCurrency")) { //as part of supporting V4 annotation
                          return properties[i]["Org.OData.Measures.V1.ISOCurrency"].Path ? properties[i]["Org.OData.Measures.V1.ISOCurrency"].Path : properties[i]["Org.OData.Measures.V1.ISOCurrency"].String;
                      } else if (properties[i].hasOwnProperty("Org.OData.Measures.V1.Unit")) {
                          tempUnit = properties[i]["Org.OData.Measures.V1.Unit"].Path ? properties[i]["Org.OData.Measures.V1.Unit"].Path : properties[i]["Org.OData.Measures.V1.Unit"].String;
                          if (tempUnit && tempUnit != "%") {
                              return tempUnit;
                          } else {
                              return null;
                          }
                      } else if (properties[i].hasOwnProperty("sap:unit")) {
                          return properties[i]["sap:unit"];
                      }
              break;
            }
          }
          return null;
        },

        /*
            Hook function for Header Click
         */
        onHeaderClicked: function () {

        },

        /*
            Hook function for Content Click
         */
        onContentClicked: function (oEvent) {

        },

        /**
         * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
         * design mode class should be set, which influences the size appearance of some controls.
         * @public
         * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
         */
        getContentDensityClass: function () {
            if (this._sContentDensityClass === undefined) {
                // check whether FLP has already set the content density class; do nothing in this case
                if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
                    if (jQuery(document.body).hasClass("sapUiSizeCozy") === true) {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    } else if (jQuery(document.body).hasClass("sapUiSizeCompact") === true) {
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        this._sContentDensityClass = "";
                    }
                } else if (!sap.ui.Device.support.touch) { // apply "compact" mode if touch is not supported
                    this._sContentDensityClass = "sapUiSizeCompact";
                } else {
                    // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                    this._sContentDensityClass = "sapUiSizeCozy";
                }
            }
            return this._sContentDensityClass;
        },

        _setCardpropertyDensityAttribute: function() {
            var sContentDensityClassName = this.getContentDensityClass();
            if (sContentDensityClassName === "sapUiSizeCompact") {
                return "compact";
            } else if (sContentDensityClassName === "sapUiSizeCozy") {
                return "cozy";
            } else if (!sap.ui.Device.support.touch) { // apply "compact" mode if touch is not supported
                return "compact";
            } else {
                // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
                return "cozy";
            }
        },

        //returns the number of pixel for one rem from the current browser font size
        getPixelPerRem: function() {
            // Returns a number
            var fontSize = parseFloat(
                // of the computed font-size, so in px
                getComputedStyle(
                    // for the root <html> element
                    document.documentElement
                )
                    .fontSize
            );
            return fontSize;
        },

        /**
         * Shows the error messages from the body of an HTTP response.
         *
         * @param {object}
         *            oError an object with error information.
         */
        showODataErrorMessages: function (oError) {
            var aMessages = [], mError, mResponseBody, result = "";
            if (oError && oError.responseText) {
                // It's an error coming in via the requestFailed event of the model
                var sResponse = oError.responseText;
                if (sResponse) {
                    try {
                        mResponseBody = JSON.parse(sResponse);
                    } catch (exception) {
                        jQuery.sap.log.error("Failed parsing response as JSON: " + sResponse);
                    }
                    if (mResponseBody && mResponseBody.error) {
                        mError = mResponseBody.error;
                    }
                }
            }
            // Get messages from error
            if (mError && mError.innererror && mError.innererror.errordetails) {
                aMessages = mError.innererror.errordetails;
            }
            if (mError && mError.message && jQuery.isArray(aMessages)) {
                // Add the root message
                aMessages.unshift({
                    message: mError.message.value,
                    severity: "error"
                });
            }
            // Display the messages
            if (aMessages && aMessages.length > 0) {
                // SAP Gateway is overly cautious here and tends to provide you with the same error message multiple times. So let's keep track of the
                // messages that we've added already to avoid duplicates.
                // So here's the craziest thing: The OData framework does not only multiply messages but sometimes, it feels like it should add a dot
                // ('.') to the end of the message if not already available. This can result in the same message being displayed twice, once with a
                // dot and once without. So when we keep track of the messages that we've already added, we'll ignore the dot.
                var mAddedMessages = {};
                jQuery.each(aMessages, function (iIdx, mMessage) {
                    var sMessageText = mMessage.message;
                    if (jQuery.sap.endsWith(sMessageText, ".")) {
                        sMessageText = sMessageText.substr(0, sMessageText.length - 1);
                    }
                    if (!mAddedMessages[sMessageText]) {
                        mAddedMessages[sMessageText] = true;
                        result = result + sMessageText + " ";
                    }
                });
            }
            return result;
        }
    };
}());
