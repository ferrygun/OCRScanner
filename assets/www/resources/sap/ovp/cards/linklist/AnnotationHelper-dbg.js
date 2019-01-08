// Copyright (c) 2009-2014 SAP SE, All Rights Reserved
/**
 * @fileOverview This file contains miscellaneous utility functions.
 */

(function () {
    "use strict";
    /*global dispatchEvent, document, jQuery, localStorage, sap */

    // ensure that sap.ushell exists
    jQuery.sap.declare("sap.ovp.cards.linklist.AnnotationHelper");

    sap.ovp.cards.linklist.AnnotationHelper = {};

    /*
     * return the sorters that need to be applyed on an aggregation
     * @param ovpCardProperties - card properties model which might contains sort configurations
     * @returns {Array} of model sorters
     */
    function getSorters(ovpCardProperties) {
        var aSorters = [];
        var oSorter, bDescending;

        //get the configured sorter if exist and append them to the sorters array
        var sPropertyPath = ovpCardProperties.getProperty("/sortBy");
        if (sPropertyPath) {
            // If sorting is enabled by card configuration
            var sSortOrder = ovpCardProperties.getProperty("/sortOrder");
            if (sSortOrder && sSortOrder.toLowerCase() !== "descending") {
                bDescending = false;
            } else {
                bDescending = true;
            }
            oSorter = {
                path: sPropertyPath,
                descending: bDescending
            };
            aSorters.push(oSorter);
        }
        // returning Sorter
        return aSorters;
    }

    /*
     * return the filters that need to be applyed on an aggregation
     * @param ovpCardProperties - card properties model which might contains filters configurations
     * @param oSelectionVariant - optional selection variant annotation with SelectOptions configuration
     * @returns {Array} of model filters
     */
    function getFilters(ovpCardProperties, oSelectionVariant) {
        var aFilters = [];
        //get the configured filters if exist and append them to the filter array
        var aConfigFilters = ovpCardProperties.getProperty("/filters");
        if (aConfigFilters) {
            aFilters = aFilters.concat(aConfigFilters);
        }

        //get the filters from the selection variant annotations if exists
        var aSelectOptions = oSelectionVariant && oSelectionVariant.SelectOptions;
        var oSelectOption, sPropertyPath, oRange;
        if (aSelectOptions) {
            for (var i = 0; i < aSelectOptions.length; i++) {
                oSelectOption = aSelectOptions[i];
                sPropertyPath = oSelectOption.PropertyName.PropertyPath;
                //a select option might contains more then one filter in the Ranges array
                for (var j = 0; j < oSelectOption.Ranges.length; j++) {
                    oRange = oSelectOption.Ranges[j];
                    if (oRange.Sign.EnumMember) {
                        //create the filter. the Low value is mandatory
                        var oFilter = {
                            path: sPropertyPath,
                            operator: oRange.Option.EnumMember.split("/")[1],
                            value1: sap.ovp.cards.AnnotationHelper.getPrimitiveValue(oRange.Low),
                            value2: sap.ovp.cards.AnnotationHelper.getPrimitiveValue(oRange.High),
                            sign: oRange.Sign.EnumMember === "com.sap.vocabularies.UI.v1.SelectionRangeSignType/I" ? "I" : "E"
                        };
                        // exclude sign is supported only with EQ operator
                        if (oFilter.sign === "E" && oFilter.operator !== sap.ui.model.FilterOperator.EQ) {
                            jQuery.sap.log.error("Exclude sign is supported only with EQ operator");
                            continue;
                        }
                        // aFilters will be used later in the flow to create filter object. (sap.ui.model.Filter),
                        // that does not support sign property, so the sign property will be ignored later in the flow.

                        // This getFilters will also be called during navigation to create selection variant.
                        // for selection variant sign property is supported but NE operator is not supported
                        // This case will be handled by the calling function in card.controller
                        if (oFilter.sign === "E" && oFilter.operator === sap.ui.model.FilterOperator.EQ) {
                            oFilter.operator = sap.ui.model.FilterOperator.NE;
                            oFilter.sign = "I";
                        }

                        //append the filter to the filters array
                        aFilters.push(oFilter);
                    }
                }
            }
        }
        // returning Filter
        return aFilters;
    }

    /*
     * This formatter method parses the items aggregation path in the Model.
     * @param iContext
     * @param itemsPath
     * @returns items aggregation path in the Model
     */
    sap.ovp.cards.linklist.AnnotationHelper.formatItems = function (iContext, oEntitySet, oHeaderAnnotation) {
        var oModel = iContext.getSetting("ovpCardProperties");
        var oMetaModel = oModel.getProperty("/metaModel");
        var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
        var sEntitySetPath = "/" + oEntitySet.name;
        var oSelectionVariant = oEntityType[oModel.getProperty("/selectionAnnotationPath")];
        var iItemsLength;
        var layout = oModel.getProperty("/layoutDetail");
        if (layout === 'resizable') {
            var oCardLayout = oModel.getProperty("/cardLayout");
            if (oCardLayout) {
                // Item Length dependent on Card listFlavor
                if (oModel.getProperty("/listFlavor") === "standard") {
                    var typeOfLinklist = "";
                    for (var item in oHeaderAnnotation) {
                        typeOfLinklist += item;
                    }

                    var iRowHeight = oModel.getProperty("/cardLayout/iRowHeigthPx");
                    if (iRowHeight === undefined) {
                        iRowHeight = 16;
                    }
                    var iItemHeight;
                    if (oModel.getProperty("/densityStyle") === "cozy") {
                        //Cozy mode
                        iItemHeight = 72;
                        if ((typeOfLinklist.indexOf("Description") === -1) && ((typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("ImageUrl") > 0 ) || (typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("TypeImageUrl") > 0))) {
                            //one line with image or icon
                            iItemHeight = 56;
                        } else if ((typeOfLinklist.indexOf("Description") === -1) && typeOfLinklist.indexOf("Title") > 0) {
                            iItemHeight = 48;
                        }
                    } else {
                        //Compact Mode
                        iItemHeight = 60;
                        if ((typeOfLinklist.indexOf("Description") === -1) && ((typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("ImageUrl") > 0 ) || (typeOfLinklist.indexOf("Title") > 0 && typeOfLinklist.indexOf("TypeImageUrl") > 0))) {
                            //one line with image or icon
                            iItemHeight = 48;
                        } else if ((typeOfLinklist.indexOf("Description") === -1) && typeOfLinklist.indexOf("Title") > 0) {
                            iItemHeight = 40;
                        }
                    }
                    //If there is no default span is not given in the manifest and the card is loaded for the first time then
                    // we need to calculate rowSpan i.e no of items(Default is 6) * item height + header height + 2 * card top/bottom padding
                    //and set it in noOfItems property as rowSpan property is overridden in onAfterRendering()
                    // Else we have to calculate no of items we can show in the card
                    if (!oModel.getProperty("/defaultSpan") && oModel.getProperty("/cardLayout/autoSpan")) {
                        iItemsLength = oModel.getProperty("/cardLayout/noOfItems");
                        var rowSpan = Math.ceil((iItemsLength * iItemHeight + oModel.getProperty("/cardLayout/headerHeight") + 2 * oModel.getProperty("/cardLayout/iCardBorderPx") ) / iRowHeight);
                        oModel.setProperty("/cardLayout/noOfItems", rowSpan);
                    } else {
                        var dividend = Math.floor(((oCardLayout.rowSpan * iRowHeight) - oModel.getProperty("/cardLayout/headerHeight") + 2 * oModel.getProperty("/cardLayout/iCardBorderPx")));
                        iItemsLength = Math.floor(dividend / iItemHeight) * oCardLayout.colSpan;
                    }
                } else if (oModel.getProperty("/listFlavor") === "grid") {
                    iItemsLength = oCardLayout.rowSpan * oCardLayout.colSpan * 2;
                }
            }
        } else {
            iItemsLength = 6;
        }
        //check if entity set needs parameters
        // if selection-annotations path is supplied - we need to resolve it in order to resolve the full entity-set path
        if (oSelectionVariant) {
            if (oSelectionVariant && oSelectionVariant.Parameters) {
                // in case we have UI.SelectionVariant annotation defined on the entityType including Parameters - we need to resolve the entity-set path to include it
                sEntitySetPath = sap.ovp.cards.linklist.AnnotationHelper.resolveParameterizedEntitySet(iContext.getSetting("dataModel"), oEntitySet,
                    oSelectionVariant);
            }
        }

        var result = "{path: '" + sEntitySetPath + "', length: " + iItemsLength;

        //apply sorters information
        var aSorters = getSorters(oModel);
        if (aSorters.length > 0) {
            result = result + ", sorter:" + JSON.stringify(aSorters);
        }
        //apply filters information
        var aFilters = getFilters(oModel, oSelectionVariant);
        if (aFilters.length > 0) {
            result = result + ", filters:" + JSON.stringify(aFilters);
        }
        result = result + "}";

        // returning the parsed path for the Card's items-aggregation binding
        return result;
    };

    /*
     * This formatter method parses the items Url and extend it with the "baseUrl" if required
     * @param iContext
     * @param sUrl
     * @returns sUrl
     */
    sap.ovp.cards.linklist.AnnotationHelper.formatUrl = function (iContext, sUrl) {
        // We use here lastIndexOf instead of startsWith because it doesn't work on safari (ios devices)
        var sBaseUrl = iContext.getModel().getProperty("/baseUrl");
        return sap.ovp.cards.linklist.AnnotationHelper.formUrl(sBaseUrl, sUrl);
    };

    /* This formatter check whether is ImageUri is true or not
     *
     * @returns true or false
     */
    sap.ovp.cards.linklist.AnnotationHelper.isImageUrl = function (oInterface, oDataField) {
        var bIsImageUrl = true;
        var sOdataPath = sap.ui.model.odata.AnnotationHelper.format(oInterface, oDataField);
        if (sOdataPath.toLowerCase().indexOf("icon") > 0) {
            bIsImageUrl = false;
        }
        return bIsImageUrl;
    };

    /* This formatter check whether is ImageUri is true or not
     *
     * @returns true or false
     */
    sap.ovp.cards.linklist.AnnotationHelper.isImageUrlStaticData = function (oDataField) {
        var bIsImageUrl = true;
        if (!oDataField) {
            return null;
        } else if (oDataField.toLowerCase().indexOf("icon") > 0) {
            bIsImageUrl = false;
        }
        return bIsImageUrl;
    };
    /* This formatter make string to path
     * @returns Icon Path
     */
    sap.ovp.cards.linklist.AnnotationHelper.getIconPath = function (oTypeImageUrl) {
        var sIconPath;
        if (oTypeImageUrl.hasOwnProperty("Path")) {
            sIconPath = "{" + oTypeImageUrl.Path + "}";
        } else {
            sIconPath = oTypeImageUrl.String;
        }
        return sIconPath;
    };

    /* This formatter make string to path
     * @returns Path like {<string>}
     */
    sap.ovp.cards.linklist.AnnotationHelper.formatString = function (sObject) {
        var sPath = "{" + sObject.String + "}";
        return sPath;
    };

    /*
     * @param oAnnotation
     * @returns 0 for false - there are no actions for this context
     *          1 for true - there are actions for this context
     *          does not return actual boolean - so we won't need to parse the result in the xml
     */
    sap.ovp.cards.linklist.AnnotationHelper.linkedAction = function (oAnnotation) {
        if (oAnnotation) {
            return 1;
        }
        return 0;
    };

    sap.ovp.cards.linklist.AnnotationHelper.formUrl = function (sBaseUrl, sUrl) {
        if (!sUrl) {
            return undefined;
        } else if (sUrl.lastIndexOf(sBaseUrl, 0) === 0 || sUrl.indexOf("://") > 0) {
            return sUrl;
        } else if (sUrl.lastIndexOf("/", 0) === 0) {
            return sBaseUrl + sUrl;
        } else {
            return sBaseUrl + "/" + sUrl;
        }
    };

    sap.ovp.cards.linklist.AnnotationHelper.isVisible = function (sId, oShowMore, oValues) {
        var bFlag = (typeof oValues === "object") ? oValues[sId] : ((typeof oValues === "boolean") ? oValues : true);
        return !oShowMore[sId] && bFlag;
    };

    sap.ovp.cards.linklist.AnnotationHelper.getApplicationName = function (aLinks, semanticObject, action) {
        var sName = "";
        if (aLinks) {
            if (semanticObject && action) {
                sName = "#" + semanticObject + "-" + action;
                for (var i = 0; i < aLinks.length; i++) {
                    if (aLinks[i].value === sName) {
                        return aLinks[i].name;
                    }
                }
                sName = "";
            } else {
                return aLinks[0].name;
            }
        }
        return sName;
    };

    sap.ovp.cards.linklist.AnnotationHelper.getImageUrl = function (oCardProperties, sImageUrl) {
        return sap.ovp.cards.linklist.AnnotationHelper.formUrl(oCardProperties.baseUrl, sImageUrl);
    };

    sap.ovp.cards.linklist.AnnotationHelper.staticContentWithLength = function (sPath) {
        var sPathWithLength = "{" + sPath + ", length:3}";
        return sPathWithLength;
    };

    sap.ovp.cards.linklist.AnnotationHelper.contentRowIndex = function (oRow) {
        return this.getModel("contentRow").aBindings[0].getContext().getPath().replace("/staticContent/", "");
    };

    //*** Requires IContext ***//
    sap.ovp.cards.linklist.AnnotationHelper.isImageUrl.requiresIContext = true;
    sap.ovp.cards.linklist.AnnotationHelper.formatItems.requiresIContext = true;
    sap.ovp.cards.linklist.AnnotationHelper.formatUrl.requiresIContext = true;
}());