/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

sap.ui.define([
	'jquery.sap.global',
	"sap/m/Dialog",
    "sap/m/ToolbarSpacer",
    "sap/m/Button",
    'sap/ovp/cards/CommonUtils',
    'sap/ovp/cards/rta/SettingsDialogConstants',
    'sap/ui/Device',
    'sap/m/MessagePopover',
    'sap/m/MessagePopoverItem',
    'sap/m/Link'
], function(jQuery, Dialog, ToolBarSpacer, Button, CommonUtils, SettingsConstants, Device, MessagePopover, MessagePopoverItem, Link) {
	"use strict";
	
	function addCardToView(oComponentContainer, oView){
		var oComponent = oComponentContainer.getComponentInstance(),
			oComponentData = oComponent.getComponentData(),
			oAppComponent = oComponentData.appComponent,
			sCardId = oComponentData.cardId,
			sManifestCardId = sCardId + 'Dialog',
			sModelName = oComponentData.modelName,
			oModel = oAppComponent.getModel(sModelName),
			oCardProperties = oView.getModel().getData(),
			oManifest = {
				cards: {}
			};
		oManifest.cards[sManifestCardId] = {
			model: sModelName,
	        template: oCardProperties.template,
	        settings: oCardProperties
		};
		oView.setModel(oModel, sModelName);
		oView.getController()._oManifest = oManifest;
		CommonUtils.createCardComponent(oView, oManifest, 'dialogCard');
	}

	function getQualifier(sAnnotationPath) {
		if (sAnnotationPath.indexOf('#') !== -1) {
            return sAnnotationPath.split('#')[1];
        } else {
            return "Default";
        }
	}
	
	function getAnnotationLabel(oEntityType, sKey) {
        var sAnnotationQualifier;
		if (sKey.indexOf(",") !== -1) {
    		sKey = sKey.split(",")[0];
        }
        if (sKey.indexOf(".Identification") !== -1) {
        	if (oEntityType[sKey]) {
                var aRecords = sap.ovp.cards.AnnotationHelper.sortCollectionByImportance(oEntityType[sKey]);
                for (var index = 0; index < aRecords.length; index++) {
                    var oItem = aRecords[index];
                    if (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
                        if (oItem && oItem["Label"]) {
                            return oItem["Label"].String;
                        } else {
                            return oItem["SemanticObject"].String + "-" + oItem["Action"].String;
                        }
                    }
                    if (oItem.RecordType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
                        if (oItem && oItem["Label"]) {
                            return oItem["Label"].String;
                        } else {
                            return oItem["Url"].String;
                        }
                    }
                }
            }
            return "No Navigation";
        } else if (sKey.indexOf(".HeaderInfo") !== -1) {
            sAnnotationQualifier = getQualifier(sKey);
            if (oEntityType[sKey] && oEntityType[sKey]["Description"] && oEntityType[sKey]["Description"].Label) {
                return oEntityType[sKey]["Description"].Label.String
            } else {
                return sAnnotationQualifier;
            }
        } else {
            var sLabelQualifier = "";
            sAnnotationQualifier = getQualifier(sKey);
            if (sAnnotationQualifier !== "Default") {
                sLabelQualifier = "#" + sAnnotationQualifier;
            }
            var sLabelName = "com.sap.vocabularies.Common.v1.Label" + sLabelQualifier;
            if (oEntityType[sKey] && oEntityType[sKey][sLabelName]) {
                return oEntityType[sKey][sLabelName].String;
            } else {
                return sAnnotationQualifier;
            }
        }
	}

    function checkIfCardTemplateHasProperty(sTemplate, sType) {
        switch (sType) {
            case "cardPreview":
                return (CommonUtils.supportedCards.indexOf(sTemplate) !== -1);
            case "listType":
            case "listFlavor":
                var aCardTypeForListType = ["sap.ovp.cards.list"];
                return (aCardTypeForListType.indexOf(sTemplate) !== -1);
            case "listFlavorForLinkList":
                var aCardTypeForListFlavorForLinkList = ["sap.ovp.cards.linklist"];
                return (aCardTypeForListFlavorForLinkList.indexOf(sTemplate) !== -1);
            case "isViewSwitchSupportedCard":
            case "kpiHeader":
                var aCardTypeForKPI = ["sap.ovp.cards.list",
                    "sap.ovp.cards.table",
                    "sap.ovp.cards.charts.analytical",
                    "sap.ovp.cards.charts.bubble",
                    "sap.ovp.cards.charts.donut",
                    "sap.ovp.cards.charts.line"];
                return (aCardTypeForKPI.indexOf(sTemplate) !== -1);
            case "chart":
                var aCardTypeForChart = ["sap.ovp.cards.charts.analytical",
                    "sap.ovp.cards.charts.bubble",
                    "sap.ovp.cards.charts.donut",
                    "sap.ovp.cards.charts.line"];
                return (aCardTypeForChart.indexOf(sTemplate) !== -1);
            case "sortOrder":
            case "sortBy":
            case "lineItem":
                var aCardTypeForLineItem = ["sap.ovp.cards.list", "sap.ovp.cards.table"];
                return (aCardTypeForLineItem.indexOf(sTemplate) !== -1);
            default :
                break;
        }
    }

    function getVisibilityOfElement(oCardProperties, sElement, isViewSwitchEnabled, iIndex) {
        var showMainFields = true;
        var showSubFields = true;
        if(isViewSwitchEnabled) {
            if(oCardProperties.mainViewSelected) {
                showSubFields = false;
            } else {
                showMainFields = false;
            }
        }
        switch (sElement) {
            case "cardPreview":
                return checkIfCardTemplateHasProperty(oCardProperties.template, "cardPreview");
            case "title":
                return showMainFields;
            case "dynamicSwitchSubTitle":
                return showMainFields && !!oCardProperties.dynamicSubTitle;
            case "dynamicSwitchStateSubTitle":
                return !!oCardProperties.dynamicSubtitleAnnotationPath;
            case "subTitle":
                if(!oCardProperties.subTitle) {
                    oCardProperties.subTitle = ' ';
                    return false;
                } else {
                    return showMainFields && !oCardProperties.dynamicSubtitleAnnotationPath;
                }
            case "dynamicSubTitle":
                return showSubFields && !!oCardProperties.dynamicSubtitleAnnotationPath;
            case "valueSelectionInfo":
                if(!oCardProperties.valueSelectionInfo) {
                    oCardProperties.valueSelectionInfo = ' ';
                }
                return showMainFields && (checkIfCardTemplateHasProperty(oCardProperties.template, "kpiHeader") && !!oCardProperties.dataPointAnnotationPath);
            case "dataPoint":
                return showSubFields && (checkIfCardTemplateHasProperty(oCardProperties.template, "kpiHeader") && !!oCardProperties.dataPointAnnotationPath);
            case "listType":
            case "listFlavor":
            case "listFlavorForLinkList":
                return showMainFields && checkIfCardTemplateHasProperty(oCardProperties.template, sElement);
            case "sortOrder":
                return showMainFields && (!oCardProperties.staticContent) && checkIfCardTemplateHasProperty(oCardProperties.template, sElement)
                    && !!oCardProperties.sortBy;
            case "sortBy":
                return showMainFields && (!oCardProperties.staticContent) && checkIfCardTemplateHasProperty(oCardProperties.template, sElement);
            case "identification":
                return showSubFields && (!oCardProperties.staticContent);
            case "presentationVariant":
            case "selectionVariant":
                return showSubFields && (!oCardProperties.staticContent) && checkIfCardTemplateHasProperty(oCardProperties.template, "kpiHeader");
            case "kpiHeader":
                return showMainFields && checkIfCardTemplateHasProperty(oCardProperties.template, sElement);
            case "lineItem":
            case "chart":
                return showSubFields && checkIfCardTemplateHasProperty(oCardProperties.template, sElement);
            case "showViewName":
                return isViewSwitchEnabled && showSubFields;
            case "showDefaultView":
                if(isViewSwitchEnabled && showSubFields) {
                    if(oCardProperties.defaultViewSelected != oCardProperties.selectedKey) {
                        return true;
                    }
                }
                return false;
            case "showMore":
            case "removeVisual":
            case "lineItemSubTitle":
            case "lineItemTitle":
            case "staticLink":
            case "links":
                var bFlag = (oCardProperties.template === "sap.ovp.cards.linklist" && !!oCardProperties.staticContent);
                if (sElement === "staticLink") {
                    return (bFlag && !!oCardProperties.staticContent[iIndex].targetUri);
                } else if (sElement === "links") {
                    return (bFlag && !!oCardProperties.staticContent[iIndex].semanticObject);
                } else if (sElement === "removeVisual") {
                    return (bFlag && (!!oCardProperties.staticContent[iIndex].targetUri || !!oCardProperties.staticContent[iIndex].semanticObject));
                } else {
                    return bFlag;
                }
            default :
                break;
        }
    }

    function setVisibilityForFormElements(oCardProperties) {
        // setting Visibility for Form Elements in settingDialog
        var isViewSwitchEnabled = false;
        this.oVisibility.viewSwitchEnabled = false;
        this.oVisibility.showViewSwitch = false;
        if (checkIfCardTemplateHasProperty(oCardProperties.template,'isViewSwitchSupportedCard')) {
            if(oCardProperties.tabs && oCardProperties.tabs.length ) {
                isViewSwitchEnabled = true;
                this.oVisibility.showViewSwitch = true;
            }
            this.oVisibility.viewSwitchEnabled = true;
        }

        this.oVisibility.cardPreview = getVisibilityOfElement(oCardProperties, "cardPreview");
        this.oVisibility.title = getVisibilityOfElement(oCardProperties, "title", isViewSwitchEnabled);
        this.oVisibility.subTitle = getVisibilityOfElement(oCardProperties, "subTitle", isViewSwitchEnabled);
        this.oVisibility.valueSelectionInfo = getVisibilityOfElement(oCardProperties, "valueSelectionInfo", isViewSwitchEnabled);
        this.oVisibility.listType = getVisibilityOfElement(oCardProperties, "listType", isViewSwitchEnabled);
        this.oVisibility.listFlavor = getVisibilityOfElement(oCardProperties, "listFlavor", isViewSwitchEnabled);
        this.oVisibility.listFlavorForLinkList = getVisibilityOfElement(oCardProperties, "listFlavorForLinkList", isViewSwitchEnabled);
        this.oVisibility.sortOrder = getVisibilityOfElement(oCardProperties, "sortOrder", isViewSwitchEnabled);
        this.oVisibility.sortBy = getVisibilityOfElement(oCardProperties, "sortBy",isViewSwitchEnabled);
        if (oCardProperties.template === "sap.ovp.cards.linklist" && !!oCardProperties.staticContent) {
            var aStaticContent = oCardProperties.staticContent,
                oVisibleStaticLink = {},
                oVisibleLinks = {},
                oVisibleRemoveVisual = {},
                oVisibleShowMore = {};
            for (var index = 0; index < aStaticContent.length; index++) {
                var sId = aStaticContent[index].index;
                oVisibleStaticLink[sId] = getVisibilityOfElement(oCardProperties, "staticLink", null, index);
                oVisibleLinks[sId] = getVisibilityOfElement(oCardProperties, "links", null, index);
                oVisibleRemoveVisual[sId] = getVisibilityOfElement(oCardProperties, "removeVisual", null, index);
                oVisibleShowMore[sId] = getVisibilityOfElement(oCardProperties, "showMore", null, index);
            }
            this.oVisibility.staticLink = oVisibleStaticLink;
            this.oVisibility.links = oVisibleLinks;
            this.oVisibility.removeVisual = oVisibleRemoveVisual;
            this.oVisibility.showMore = oVisibleShowMore;
        }
        this.oVisibility.lineItemTitle = getVisibilityOfElement(oCardProperties, "lineItemTitle");
        this.oVisibility.lineItemSubTitle = getVisibilityOfElement(oCardProperties, "lineItemSubTitle");
        this.oVisibility.showViewName = getVisibilityOfElement(oCardProperties, "showViewName", isViewSwitchEnabled);
        this.oVisibility.showDefaultView = getVisibilityOfElement(oCardProperties, "showDefaultView", isViewSwitchEnabled);
        this.aVariantNames.forEach(function (oVariantName) {
            this.oVisibility[oVariantName.sPath] = getVisibilityOfElement(oCardProperties, oVariantName.sPath, isViewSwitchEnabled)
                    && !!oCardProperties[oVariantName.sPath] && !!oCardProperties[oVariantName.sPath].length;
        }.bind(this));
        this.oVisibility.kpiHeader = getVisibilityOfElement(oCardProperties, "kpiHeader", isViewSwitchEnabled)
                                        && !!oCardProperties["dataPoint"] && !!oCardProperties["dataPoint"].length;
        this.oVisibility.dynamicSwitchSubTitle = getVisibilityOfElement(oCardProperties, "dynamicSwitchSubTitle", isViewSwitchEnabled);
        this.oVisibility.dynamicSwitchStateSubTitle = getVisibilityOfElement(oCardProperties, "dynamicSwitchStateSubTitle", isViewSwitchEnabled);
        this.oVisibility.moveToTheTop = false;
        this.oVisibility.moveUp = false;
        this.oVisibility.moveDown = false;
        this.oVisibility.moveToTheBottom = false;
        this.oVisibility.delete = false;
    }

    function _getOvpLibResourceBundle() {
        var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ovp");
        var ovplibResourceBundle = oResourceBundle ? new sap.ui.model.resource.ResourceModel({
            bundleUrl: oResourceBundle.oUrlInfo.url
        }) : null;
        return ovplibResourceBundle;
    }

    function setIndicesToStaticLinkList(oCardPropertiesModel) {
        var aStaticContent = oCardPropertiesModel.getProperty("/staticContent");
        for (var index = 0; index < aStaticContent.length; index++) {
            aStaticContent[index].index = "Index--" + (index + 1);
        }
        oCardPropertiesModel.setProperty("/staticContent", aStaticContent);
    }

    function addManifestSettings(oData) {
        if (oData.lineItem) {
            oData.lineItem.forEach(function (item) {
                if (item.value === oData.annotationPath) {
                    oData.lineItemQualifier = item.name;
                }
            });
        }

        if (oData.tabs && oData.tabs.length && oData.selectedKey) {
            oData.viewName = oData.tabs[oData.selectedKey-1].value;
            oData.isDefaultView = false;
            if (oData.selectedKey === oData.defaultViewSelected) {
                oData.isDefaultView = true;
            }
        }

        var sortOrder = oData.sortOrder;
        oData.sortOrder = 'descending';
        if (sortOrder && sortOrder.toLowerCase() !== 'descending') {
            oData.sortOrder = 'ascending';
        }

        oData.isExtendedList = false;
        if(oData.listType === 'extended') {
            oData.isExtendedList = true;
        }

        oData.isBarList = false;
        if(oData.listFlavor === 'bar') {
            oData.isBarList = true;
        }

        oData.hasKPIHeader = false;
        if(oData.dataPointAnnotationPath) {
            oData.hasKPIHeader = true;
        }
        return oData;
    }
	function addSupportingObjects(oData) {
        /* Adding Supporting Objects for /lineItem, /dataPoint, /identification
          /presentationVariant, /selectionVariant, /chartAnnotation /dynamicSubtitleAnnotation*/
        var oEntityType = oData.entityType;
        this.aVariantNames.forEach(function (oVariantName) {
            var aVariants = [];

            for (var key in oEntityType) {
                if (oEntityType.hasOwnProperty(key) && key.indexOf(oVariantName.sVariant) !== -1) {
                    if (oVariantName.sVariant === ".LineItem") {
                        var variant = {
                            name: getAnnotationLabel(oEntityType, key),
                            value: key,
                            fields: sap.ovp.cards.AnnotationHelper.sortCollectionByImportance(oEntityType[key])
                        };
                        aVariants.push(variant);
                    } else {
                        aVariants.push({name: getAnnotationLabel(oEntityType, key), value: key});
                    }
                }
            }
            if (aVariants.length !== 0) {
                /*If Not a Mandatory Field than add Select Value Option*/
                if (!oVariantName.isMandatoryField) {
                    aVariants.unshift({
                        name: 'Select Value',
                        value: ''
                    });
                }
                oData[oVariantName.sPath] = aVariants;
            }
        });

        /*Adding Supporting Objects for /sortBy Property*/
        if(oData.entityType && oData.entityType.property) {
            oData['modelProperties'] = oData.entityType.property.map(function(property){
                return {
                    name : property.name,
                    value : property.name
                }
            });
            oData['modelProperties'].unshift({
                name: 'Select Value',
                value: ''
            });
        }


        /* Adding View Switch properties */
        if (!!oData.tabs && oData.tabs.length) {
            var hasDataPointAnnotation = false;
            oData.newViewCounter = 0;
            oData.defaultViewSelected = oData.selectedKey;
            oData.isViewResetEnabled = false;
            oData.aViews = [{
                text: 'Main',
                key: 0,
                isLaterAddedView: false,
                isViewResetEnabled: false
            }];

            hasDataPointAnnotation = oData.tabs.some(function (tab) {
                return tab.dataPointAnnotationPath;
            });
            oData.tabs.forEach(function (tab, index) {
                var newText = tab.value;
                if(hasDataPointAnnotation && !tab.dataPointAnnotationPath && tab.dataPoint && tab.dataPoint.length) {
                    tab.dataPointAnnotationPath = tab.dataPoint[0].value;
                }
                if(index+1 === oData.selectedKey) {
                    newText = tab.value + " (default view)";
                }
                oData.aViews.push({
                    text: newText,
                    key: index + 1,
                    initialSelectedKey: index+1,
                    isLaterAddedView: false,
                    isViewResetEnabled: false
                })
            });
        } else if (checkIfCardTemplateHasProperty(oData.template,'isViewSwitchSupportedCard')) {
            oData.newViewCounter = 0;
            oData.aViews =[{
                text: 'click "+" to add a view',
                key: 0,
                initialSelectedKey: 0,
                isLaterAddedView: false,
                isViewResetEnabled: false
            }];
        }
		return oData;
	}

	function getCrossAppNavigationLinks(oModel) {
		var oData = oModel.getData();
	    sap.ushell.Container.getService('CrossApplicationNavigation').getLinks()
	        .done(function (aLinks) {
	            var aAllIntents = [],
	                oLinkToTextMapping = {};
	            for (var i = 0; i < aLinks.length; i++) {
	                aAllIntents.push(aLinks[i].intent);
	                oLinkToTextMapping[aLinks[i].intent] = aLinks[i].text;
	            }
//	            this.oLinkToTextMapping = oLinkToTextMapping;
	            // Checks for the supported Intents for the user
	            sap.ushell.Container.getService('CrossApplicationNavigation').isIntentSupported(aAllIntents)
	                .done(function (oResponse) {
	                    // Setting the model of Dialog Form with Semantic Objects and Actions
	                    var aLinks = [];
	                    for (var key in oResponse) {
	                        if (oResponse.hasOwnProperty(key) && oResponse[key].supported === true && oLinkToTextMapping && oLinkToTextMapping[key]) {
	                            aLinks.push({name: oLinkToTextMapping[key], value: key});
	                        }
	                    }
	                    var cardManifestSettings = oData;
	                    if (aLinks.length !== 0 || aLinks.length !== 0) {
	                        cardManifestSettings['links'] = aLinks;
	                    }
	                    oModel.refresh();
	                })
	               .fail(function (oError) {
	                    jQuery.sap.log.error(oError);
	                });
	        })
	        .fail(function (oError) {
	            jQuery.sap.log.error(oError);
	        });
	}
	
	var oSettingsUtils = {
		
			dialogBox: undefined,
            oSaveButton: undefined,
            oResetButton: undefined,
            oMessagePopOverButton: undefined,
            oMessagePopOver: undefined,
            oAppDescriptor: undefined,
            sApplicationId: "",
            iContentHeightForDialog: 38,
            iContentHeightForDialogWithViewSwitch: 33,
            aVariantNames : SettingsConstants.aVariantNames,
            FORM_ITEM_NAME_FOR_LIST_FLAVOR_IN_LINKLIST: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("OVP_KEYUSER_CAROUSEL"),
            FORM_ITEM_NAME_FOR_LIST_FLAVOR_IN_LIST: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("OVP_KEYUSER_BARLIST"),
            addManifestSettings: addManifestSettings,
            setVisibilityForFormElements: setVisibilityForFormElements,
            getVisibilityOfElement: getVisibilityOfElement,
            oVisibility: SettingsConstants.oVisibility,

			getDialogBox: function(oComponentContainer) {
				return new Promise(function(resolve, reject) {
					if (!this.dialogBox) {
	            		// settings dialog save button
                        // Attached this button to 'this' scope to get it in setting controller and attach save
                        // function to it.
	            		this.oSaveButton = new Button("settingsSaveBtn", {
	            			text: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("save"),
                            type: "Emphasized"
	            		});
	            		// settings dialog close button
	            		var oCancelButton = new Button("settingsCancelBtn", {
	            			text: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("cancelBtn")
	            		});
                        this.oResetButton = new Button("settingsResetBtn", {
                            text: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("resetCardBtn")
                        });
                        // Message PopOver Button
                        this.oMessagePopOverButton = new Button("settingsMessagePopOverBtn", {
                            text: "{/Counter/All}",
                            type: "Emphasized",
                            icon: "sap-icon://message-popup"
                        }).addStyleClass("sapOvpSettingsMessagePopOverBtn");
	            		// settings dialog
	            		this.dialogBox = new Dialog("settingsDialog", {
	            			title: sap.ui.getCore().getLibraryResourceBundle("sap.ovp").getText("settingsDialogTitle"),
	            			buttons: [this.oMessagePopOverButton, this.oSaveButton, oCancelButton, this.oResetButton],
                            // destroy the view on close of dialog (?)
                            // TODO: confirm if we can just destroy the card component, rest of the things can be updated via model data binding
                            afterClose: function(oEvent) {
                                var oSettingsView = this.dialogBox.getContent()[0],
                                    oSettingsLineItemTitle = oSettingsView.byId("sapOvpSettingsLineItemTitle"),
                                    oSettingsLineItemSubTitle = oSettingsView.byId("sapOvpSettingsLineItemSubTitle");
                                if (oSettingsLineItemTitle) {
                                    oSettingsLineItemTitle.destroy();
                                }
                                if (oSettingsLineItemSubTitle) {
                                    oSettingsLineItemSubTitle.destroy();
                                }
                            	this.dialogBox.destroyContent();
                            }.bind(this)
	            		});
	            		this.dialogBox.setBusyIndicatorDelay(0);
	            		oCancelButton.attachPress(function(oEvent) {
	            			this.dialogBox.close();
	            		}.bind(this));
					}

                    // Messages Model
                    var oLink = new Link({
                        text: "Show more information",
                        href: "http://sap.com",
                        target: "_blank"
                    });

                    var oMessageTemplate = new MessagePopoverItem({
                        type: '{type}',
                        title: '{title}',
                        description: '{description}',
                        subtitle: '{subtitle}',
                        counter: '{counter}',
                        fieldName: '{fieldName}',
                        link: oLink
                    });

                    this.oMessagePopOver = new MessagePopover({
                        items: {
                            path: '/Messages',
                            template: oMessageTemplate
                        }
                    });

                    var oMessages = {
                        'Counter': {
                            'All': 0,
                            'Error': 0,
                            'Success': 0,
                            'Warning': 0,
                            'Information': 0
                        },
                        'Messages' : []
                    };

                    var oMessagesModel = new sap.ui.model.json.JSONModel(oMessages);
                    this.oMessagePopOver.setModel(oMessagesModel);
                    this.oMessagePopOverButton.setModel(oMessagesModel);

					// card properties and model
					var oComponentInstance = oComponentContainer.getComponentInstance(),
                        oOriginalCardProperties = oComponentInstance.getRootControl().getModel("ovpCardProperties").getData(),
                        oCardProperties = jQuery.extend(true, {}, oOriginalCardProperties);
                    oCardProperties = addSupportingObjects.call(this, oCardProperties);
                    oCardProperties = this.addManifestSettings(oCardProperties);
					var oCardPropertiesModel = new sap.ui.model.json.JSONModel(oCardProperties),
                        ovplibResourceBundle = _getOvpLibResourceBundle(),
                        componentContainerHeight = oComponentContainer.getDomRef().offsetHeight,
                        oDeviceSystemPropertiesModel = new sap.ui.model.json.JSONModel(Device.system),
                        oComponentData = oComponentInstance.getComponentData(),
                        oMainComponent = oComponentData.mainComponent,
                        oLayout = oMainComponent.getLayout();
                    this.oAppDescriptor = oMainComponent._getCardFromManifest(oComponentData.cardId);
                    this.sApplicationId = oMainComponent._getApplicationId();
                    oDeviceSystemPropertiesModel.setDefaultBindingMode("OneWay");
                    oCardProperties.dialogBoxHeight = componentContainerHeight;
                    oCardProperties.dialogBoxWidth = oLayout.getColumnWidth(oLayout.columnStyle);

                    if (oCardProperties.template === "sap.ovp.cards.linklist") {
                        oCardPropertiesModel.setProperty("/listFlavorName", this.FORM_ITEM_NAME_FOR_LIST_FLAVOR_IN_LINKLIST);
                    } else {
                        oCardPropertiesModel.setProperty("/listFlavorName", this.FORM_ITEM_NAME_FOR_LIST_FLAVOR_IN_LIST);
                    }

                    if (oCardProperties.template === "sap.ovp.cards.linklist" && oCardProperties.staticContent) {
                        var oExtraStaticCardProperties = {};
                        var oExtraStaticCardPropertiesModel = new sap.ui.model.json.JSONModel(oExtraStaticCardProperties);
                        getCrossAppNavigationLinks(oExtraStaticCardPropertiesModel);
                        setIndicesToStaticLinkList(oCardPropertiesModel);
                        oCardPropertiesModel.setProperty("/lineItemId", "linkListItem--1");
                        oCardPropertiesModel.setProperty("/lineItemIdCounter", oCardProperties.staticContent.length);
                    }

                    this.setVisibilityForFormElements(oCardProperties);
                    var oVisibilityModel = new sap.ui.model.json.JSONModel(this.oVisibility);

					// settings view
            		var oSettingsView = new sap.ui.view("settingsView", {
            			viewName: "sap.ovp.cards.rta.SettingsDialog",
            			type: sap.ui.core.mvc.ViewType.XML,
            			preprocessors: {
            				xml: {
    							bindingContexts: {
    								ovpCardProperties: oCardPropertiesModel.createBindingContext("/")
    							},
    							models: {
    								ovpCardProperties: oCardPropertiesModel,
                                    deviceSystemProperties: oDeviceSystemPropertiesModel
    							}
    						}
            			}
            		});
                    if (oCardProperties.template === "sap.ovp.cards.linklist" && oCardProperties.staticContent) {
                        oSettingsView.setModel(oExtraStaticCardPropertiesModel, "staticCardProperties");
                    }
            		oSettingsView.setModel(oCardPropertiesModel);
                    oSettingsView.setModel(ovplibResourceBundle, "ovplibResourceBundle");
                    oSettingsView.setModel(oVisibilityModel, "visibility");
					this.dialogBox.addContent(oSettingsView);
            		oSettingsView.loaded().then(function(oView) {
            			// set the width of the component container for settings card
                        var dialogCard = oView.byId("dialogCard");
                        if (!dialogCard.getVisible()) {
                            dialogCard = oView.byId("dialogCardNoPreview");
                        }
                        dialogCard.setWidth(oCardProperties.dialogBoxWidth + "rem");
            			addCardToView(oComponentContainer, oView);
            			
            			this.dialogBox.open();
            			
            			// set the resolve for this promise to the controller which will resolve it when handling save
            			oView.getController().settingsResolve = resolve;
//            			resolve(this.dialogBox);
            		}.bind(this));
				}.bind(this));	
			}
		
	};
	
	return oSettingsUtils;
},
/* bExport= */true);
