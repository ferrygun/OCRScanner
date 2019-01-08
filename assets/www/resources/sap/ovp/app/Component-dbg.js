(function() {
	"use strict";
	/*global sap, jQuery*/

	/**
	 * @fileOverview Application component to display information on entities from the GWSAMPLE_BASIC
	 *   OData service.
	 * @version 1.52.4
	 */
	jQuery.sap.declare("sap.ovp.app.Component");
	jQuery.sap.require("sap.ui.model.odata.AnnotationHelper");
	
	// We need to require RuntimeAuthoring in the very beginning to be able to personalize.
    // Without RuntimeAuthoring at this point or maybe a little later but not too late, for instance, in Main controller,
    // the change handler will not be called by sap.ui.fl
    jQuery.sap.require('sap.ui.rta.RuntimeAuthoring');

	sap.ui.core.UIComponent.extend("sap.ovp.app.Component", {
		// use inline declaration instead of component.json to save 1 round trip
		metadata: {
			routing: {
				config: {
					routerClass: sap.ui.core.routing.Router
				},
				targets: {},
				routes: []
			},

			properties: {
				"cardContainerFragment": {
					"type": "string",
					"defaultValue": "sap.ovp.app.CardContainer"
				},
				"dashboardLayoutUtil": {
					"type": "sap.ovp.ui.DashboardLayoutUtil"
				}
			},

			version: "1.52.4",

			library: "sap.ovp.app",

			dependencies: {
				libs: [],
				components: []
			},
			config: {
				fullWidth: true,
				hideLightBackground: true
			}
		},

		_addModelsMeasurements: function() {
			var oModels = this.oModels;
			var oModel, sModel;
			for (sModel in oModels) {
				oModel = this.getModel(sModel);
				if (oModel.getMetaModel()) {
					this._addModelMeasurements(oModel, sModel);
				}
			}
		},

		_addModelMeasurements: function(oModel, sModel) {
			var sId = "ovp:ModelLoading-" + sModel;
			var sIdBatch = "ovp:ModelBatchCall-" + sModel + ":";
			jQuery.sap.measure.start(sId, "Component createContent -> MetaData loaded", "ovp");
            var getMetaModelPromise = oModel.getMetaModel().loaded();
            getMetaModelPromise.then(function() {
                jQuery.sap.measure.end(sId);
            });
			oModel.attachBatchRequestSent(function(oEvent) {
				jQuery.sap.measure.start(sIdBatch + oEvent.getParameter("ID"), "BatchRequestSent -> BatchRequestCompleted", "ovp");
			});
			oModel.attachBatchRequestCompleted(function(oEvent) {
				jQuery.sap.measure.end(sIdBatch + oEvent.getParameter("ID"));
			});
		},

		/**
		 * get the merged sap.ovp section from all component hierarchy
		 * @returns merged sap.ovp section from manifes files
		 */
		getOvpConfig: function() {
			var oOvpConfig;
			var aExtendArgs = [];
			var oManifest = this.getMetadata();
			//loop over the manifest hierarchy till we reach the current generic component
			while (oManifest && oManifest.getComponentName() !== "sap.ovp.app") {
				oOvpConfig = oManifest.getManifestEntry("sap.ovp");
				if (oOvpConfig) {
					//as the last object is the dominant one we use unshift and not push
					aExtendArgs.unshift(oOvpConfig);
				}
				oManifest = oManifest.getParent();
			}
			//add an empty object for the merged config as we don't whant to change the actual manifest objects
			aExtendArgs.unshift({});
			//add deep flag so the merge would be recurcive
			aExtendArgs.unshift(true);
			oOvpConfig = jQuery.extend.apply(jQuery, aExtendArgs);
			return oOvpConfig;
		},

		createXMLView: function(ovpConfig) {
			jQuery.sap.measure.start("ovp:AppCreateContent", "OVP app Component createContent", "ovp");
			this._addModelsMeasurements();

            if (this.getRouter()) {
			this.getRouter().initialize();
            }
			var appConfig = this.getMetadata().getManifestEntry("sap.app");
			var uiConfig = this.getMetadata().getManifestEntry("sap.ui");
			var sIcon = jQuery.sap.getObject("icons.icon", undefined, uiConfig);

			var sComponentName = this.getMetadata().getComponentName();
			ovpConfig.baseUrl = jQuery.sap.getModulePath(sComponentName);
            if (ovpConfig.smartVariantRequired === undefined || ovpConfig.smartVariantRequired === null) {
                ovpConfig.smartVariantRequired = true;
            }
            if (ovpConfig.enableLiveFilter === undefined || ovpConfig.enableLiveFilter === null) {
                ovpConfig.enableLiveFilter = true;
            }
            if (ovpConfig.showDateInRelativeFormat === undefined || ovpConfig.showDateInRelativeFormat === null) {
                ovpConfig.showDateInRelativeFormat = true;
            }
            if (ovpConfig.useDateRangeType || ovpConfig.useDateRangeType === undefined || ovpConfig.useDateRangeType === null) {
                ovpConfig.useDateRangeType = false;
            }
            
            var uiModel = new sap.ui.model.json.JSONModel(ovpConfig);

            uiModel.setProperty("/applicationId", jQuery.sap.getObject("id", undefined, appConfig));
			uiModel.setProperty("/title", jQuery.sap.getObject("title", undefined, appConfig));
			uiModel.setProperty("/description", jQuery.sap.getObject("description", undefined, appConfig));

			if (sIcon) {
				if (sIcon.indexOf("sap-icon") < 0 && sIcon.charAt(0) !== '/') {
					sIcon = ovpConfig.baseUrl + "/" + sIcon;
				}
				uiModel.setProperty("/icon", sIcon);
			}

			//convert cards object into sorted array
			var oCards = ovpConfig.cards;
			var aCards = [];
			var oCard;
			for (var cardKey in oCards) {
				if (oCards.hasOwnProperty(cardKey) && oCards[cardKey]) {
					oCard = oCards[cardKey];
					oCard.id = cardKey;
					aCards.push(oCard);
				}
			}

			aCards.sort(function(card1, card2) {
				if (card1.id < card2.id) {
					return -1;
				} else if (card1.id > card2.id) {
					return 1;
				} else {
					return 0;
				}
			});

			uiModel.setProperty("/cards", aCards);
            if (this.inResizableTestMode() === true) {
                ovpConfig.containerLayout = "resizable";
            }

			// Layout switch: read 'containerLayout' property from manifest
			if (ovpConfig.containerLayout && ovpConfig.containerLayout === "resizable") {
                jQuery.sap.require("sap.ovp.ui.DashboardLayoutUtil");
				uiModel.setProperty("/cardContainerFragment", "sap.ovp.app.DashboardCardContainer");
                //Read all the property "/resizableLayout" from the manifest and set it to "/dashboardLayout" property
                uiModel.setProperty("/dashboardLayout",ovpConfig.resizableLayout);
				var oDblUtil = new sap.ovp.ui.DashboardLayoutUtil(uiModel);
				this.setDashboardLayoutUtil(oDblUtil);
			} else {
				// default + compatibility --> EasyScanLayout
				uiModel.setProperty("/cardContainerFragment", this.getCardContainerFragment());
			}

            //Remove any namespace from global filter entity name, the namespace will be added as and
            //when required
            if (ovpConfig.globalFilterEntityType && ovpConfig.globalFilterEntityType.length > 0) {
                ovpConfig.globalFilterEntityType = ovpConfig.globalFilterEntityType.split('.').pop();
            }

            var oValueHelpEntityMap = this.createMapForValueHelpEntity(ovpConfig);
            uiModel.setProperty("/ValueHelpEntityMap", oValueHelpEntityMap);
            this.setModel(uiModel, "ui");
            var oFilterModel = this.getModel(ovpConfig.globalFilterModel);
            this.setModel(oFilterModel);
            /* What: Using Resource Bundle to get strings to display on error page. */
            var ovplibResourceBundle = this._getOvpLibResourceBundle();
            this.setModel(ovplibResourceBundle, "ovplibResourceBundle");
            var oEntityType = oFilterModel.getMetaModel().getODataEntityType(oFilterModel.getMetaModel().getODataEntityContainer().namespace +
                "." + ovpConfig.globalFilterEntityType, true);
            /**
             * power user
             * temp
             */
            var oView = sap.ui.view("mainView", {
                height: "100%",
                preprocessors: {
                    xml: {
                        bindingContexts: {
                            ui: uiModel.createBindingContext("/"),
                            meta: oFilterModel.getMetaModel().createBindingContext(oEntityType)
                        },
                        models: {
                            ui: uiModel,
                            meta: oFilterModel.getMetaModel()
                        }
                    }
                },
				type: sap.ui.core.mvc.ViewType.XML,
				viewName: "sap.ovp.app.Main"
			});
            /**
             * end
             */

			jQuery.sap.measure.end("ovp:AppCreateContent");

			return oView;
		},

        _showErrorPage: function() {
            /* About: this function
             *  When: If error occurs and getMetaModel.loaded() promise gets rejected
             *  How: Loads Error Page into the Root Container and sets Aggregation
             */
            var oView = sap.ui.view({
                height: "100%",
                type: sap.ui.core.mvc.ViewType.XML,
                viewName: "sap.ovp.app.Error"
            });
            /* What: Using Resource Bundle to get strings to display on error page. */
            var ovplibResourceBundle = this._getOvpLibResourceBundle();
            oView.setModel(ovplibResourceBundle, "ovplibResourceBundle");
            this.setAggregation("rootControl", oView);
            this.oContainer.invalidate();
        },

        _checkForAuthorizationForLineItems: function () {
            return new Promise(function (resolve, reject) {
                var aAllIntents = [],
                    oCardsWithStaticContent = [];
                var oOvpConfig = this.getOvpConfig();
                var oCards = oOvpConfig["cards"];
                for (var sCard in oCards) {
                    if (oCards.hasOwnProperty(sCard) && oCards[sCard]) {
                        var card = oCards[sCard];
                        var oSettings = card.settings;
                        if (card.template === "sap.ovp.cards.linklist" && oSettings.listFlavor === "standard" && oSettings.staticContent) {
                            var aStaticContent = oSettings.staticContent;
                            for (var i = 0; i < aStaticContent.length; i++) {
                                if (aStaticContent[i].semanticObject || aStaticContent[i].action) {
                                    var sIntent = "#" + aStaticContent[i].semanticObject + "-" + aStaticContent[i].action;
                                    if (oCardsWithStaticContent.indexOf(sCard) === -1) {
                                        oCardsWithStaticContent.push(sCard);
                                    }
                                    if (aAllIntents.indexOf(sIntent) === -1) {
                                        aAllIntents.push(sIntent);
                                    }
                                }
                            }
                        }
                    }
                }

                this._oCardsWithStaticContent = oCardsWithStaticContent;

                // Checks for the supported Intents for the user
                sap.ushell.Container.getService('CrossApplicationNavigation').isIntentSupported(aAllIntents)
                    .done(function (oResponse) {
                        var oOvpConfig = this.getOvpConfig();
                        for (var key in oResponse) {
                            if (oResponse.hasOwnProperty(key) && oResponse[key].supported === false) {
                                for (var i = 0; i < this._oCardsWithStaticContent.length; i++) {
                                    var aStaticContent = oOvpConfig["cards"][this._oCardsWithStaticContent[i]].settings.staticContent;
                                    for (var j = aStaticContent.length - 1; j >= 0; j--) {
                                        var sIntent = "#" + aStaticContent[j].semanticObject + "-" + aStaticContent[j].action;
                                        if (key === sIntent) {
                                            aStaticContent.splice(j, 1);
                                        }
                                    }
                                    oOvpConfig["cards"][this._oCardsWithStaticContent[i]].settings.staticContent = aStaticContent;
                                }
                            }
                        }

                        delete this._oCardsWithStaticContent;

                        resolve(oOvpConfig);
                    }.bind(this))
                    .fail(function (oError) {
                        jQuery.sap.log.error(oError);
                    });
            }.bind(this));
        },

		setContainer: function() {
			var ovpConfig = this.getOvpConfig();
			var oFilterModel = this.getModel(ovpConfig.globalFilterModel);
			// call overwritten setContainer (sets this.oContainer)
			sap.ui.core.UIComponent.prototype.setContainer.apply(this, arguments);

			if (oFilterModel && !this.getAggregation("rootControl")) {
                Promise.all([
                    oFilterModel.getMetaModel().loaded(),
                    this._checkForAuthorizationForLineItems(ovpConfig)
                ]).then(function(aResponse) {
                    this.oOvpConfig = aResponse[1];
					// Do the templating once the metamodel is loaded
					this.runAsOwner(function() {
						var oView = this.createXMLView(this.oOvpConfig);
						this.setAggregation("rootControl", oView);
						this.oContainer.invalidate();
					}.bind(this));
				}.bind(this));
                oFilterModel.attachMetadataFailed(function () {
                    /*To show error page if metadata Model doesn't get loaded*/
                    this._showErrorPage();
                }.bind(this));
			}
		},
        _getOvpLibResourceBundle: function () {
            var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ovp");
            var ovplibResourceBundle = oResourceBundle ? new sap.ui.model.resource.ResourceModel({
                bundleUrl: oResourceBundle.oUrlInfo.url
            }) : null;
            return ovplibResourceBundle;
        },

        createMapForEntityContainer: function (oEntityContainer) {
            var oEntitySetMap = {};
            var oEntitySets = oEntityContainer.entitySet;
            for (var i = 0; i < oEntitySets.length; i++) {
                oEntitySetMap[oEntitySets[i].name] = oEntitySets[i].entityType;
            }
            return oEntitySetMap;

        },

        createMapForValueHelpEntity: function (oOvpConfig) {
            var oFilterModel = this.getModel(oOvpConfig.globalFilterModel);
            var oValueHelpEntityMap = [];
            var oFilterEntityType = oFilterModel.getMetaModel().getODataEntityType(oFilterModel.getMetaModel().getODataEntityContainer().namespace +
                "." + oOvpConfig.globalFilterEntityType);
            if (!oFilterEntityType) {
                return oValueHelpEntityMap;
            }
            var oEntityCollection = [];
            oEntityCollection.push(oFilterEntityType);
            var counter = 0;
            var bNavigationProperty = false;
            var oEntitySetMap = this.createMapForEntityContainer(oFilterModel.getMetaModel().getODataEntityContainer());
            if (oFilterEntityType.navigationProperty) {
                bNavigationProperty = true;
            }
            while (oEntityCollection.length != 0) {
                var oEntityType = oEntityCollection.shift();
                for (var i = 0; i < oEntityType.property.length; i++) {
                    var oProp = oEntityType.property[i];
                    if (oProp["com.sap.vocabularies.Common.v1.ValueList"]) {
                        oValueHelpEntityMap.push(oEntitySetMap[oProp["com.sap.vocabularies.Common.v1.ValueList"].CollectionPath.String]);
                    }
                }
                if (!bNavigationProperty || !(oFilterEntityType.navigationProperty[counter])) {
                    break;
                }
                //get association
                var sAssociationEntity = oFilterModel.getMetaModel().getODataAssociationEnd(oFilterEntityType, oFilterEntityType.navigationProperty[counter].name).type;
                var oNavigationEntityType = oFilterModel.getMetaModel().getODataEntityType(sAssociationEntity);
                oEntityCollection.push(oNavigationEntityType);
                counter++;
            }
            return oValueHelpEntityMap;
        },

        //Changes to test the Resizable layout in running applications
        inResizableTestMode: function () {
            // get the URL parameter from the parent frame
            return this._getQueryParamUpToTop('resizableTest') == 'true';
        },

        _getQueryParamUpToTop: function (name) {
            var win = window;
            var val = this.getQueryParam(win.location.search, name);
            if (val != null) {
                return val;
            }
            if (win == win.parent) {
                return null;
            }
            win = win.parent;
            return null;
        },

        getQueryParam: function (query, name) {
            var val = null;
            if (!query) {
                return val;
            }
            if (query.indexOf('?') != -1) {
                query = query.substring(query.indexOf('?'));
            }
            if (query.length > 1 && query.indexOf(name) != -1) {
                query = query.substring(1); // remove '?'
                var params = query.split('&');
                for (var i = 0; i < params.length; i++) {
                    var nameVal = params[i].split('=');
                    if (nameVal[0] == name) {
                        val = nameVal[1];
                        break;
                    }
                }
            }
            return val;
        }
	});
}());