/* global jQuery,sap */
// iteration 0 ok

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchConfiguration',
    'sap/ushell/renderers/fiori2/search/SearchHelper'
], function(SearchConfiguration, SearchHelper) {
    "use strict";

    var module = sap.ushell.renderers.fiori2.search.SearchResultListFormatter = function() {
        this.init.apply(this, arguments);
    };

    module.prototype = {
        init: function() {
            this.sina = SearchConfiguration.getInstance().getSina();
        },

        format: function(searchResultSet, terms) {

            return this._doFormat(searchResultSet.getElements(), terms);
        },

        _getImageUrl: function(result) {

            var imageAttr = {
                imageUrl: '',
                name: ''
            };

            // loop at all properties
            for (var prop in result) {

                var attribute = result[prop];

                // check for image
                var isImage = false;
                try {
                    if (attribute.value &&
                        (attribute.$$MetaData$$.presentationUsage.indexOf('Image') >= 0 ||
                            attribute.$$MetaData$$.presentationUsage.indexOf('Thumbnail') >= 0)) {
                        isImage = true;
                    }
                } catch (e) {
                    /* eslint no-empty:0 */
                }
                if (!isImage) {
                    continue;
                }

                // image found -> set return value + return
                imageAttr.imageUrl = attribute.value;
                imageAttr.name = prop;
                return imageAttr;

            }
            return imageAttr;
        },

        _moveWhyFound2ResponseAttr: function(whyfounds, property) {
            var l = whyfounds.length;
            while (l--) {
                if (whyfounds[l].labelRaw === property.labelRaw && property !== undefined) {
                    property.valueWithoutWhyfound = property.value;
                    property.value = whyfounds[l].value;
                    property.whyfound = true;
                    whyfounds.splice(l, 1);
                }
            }
        },

        _appendRemainingWhyfounds2FormattedResultItem: function(whyfounds, aItemAttributes) {
            var l = whyfounds.length;
            while (l--) {
                if (whyfounds[l].labelRaw !== undefined) {
                    var oItemAttribute = {};
                    oItemAttribute.name = whyfounds[l].label;
                    oItemAttribute.value = whyfounds[l].value;
                    oItemAttribute.whyfound = true;
                    aItemAttributes.push(oItemAttribute);
                    whyfounds.splice(l, 1);
                }
            }
        },

        _doFormat: function(results, terms) {
            //sort against displayOrder
            var sortDisplayOrder = function(a, b) {
                return a.displayOrder - b.displayOrder;
            };

            var connectorName, thumbnailLink, titleLink, suvlink;
            var formattedResults = [];
            for (var i = 0; i < results.length; i++) {
                var result = results[i];

                var isDocumentConnector = false;

                //get uri of factsheet
                var uri = '';
                var relatedActions = result.$$RelatedActions$$;
                for (var relatedAction in relatedActions) {
                    if (relatedActions[relatedAction].type === "Navigation" || relatedActions[relatedAction].type === "Link") {
                        uri = encodeURI(relatedActions[relatedAction].uri);
                    }
                }

                //
                var whyfounds = result.$$WhyFound$$ || [];
                var summaryAttrs = [];
                var detailAttrs = [];
                var titleAttrs = [];
                var hiddenAttrs = [];
                var title = '';
                var semanticObjectTypeAttrs = {};
                var keyFields = '';

                for (var prop in result) {
                    if (prop === 'FILE_PROPERTY') {
                        isDocumentConnector = true;
                    }
                    //ignore prop without label and metadata
                    if (!result[prop].label || !result[prop].$$MetaData$$) {
                        continue;
                    }

                    var presentationUsage = result[prop].$$MetaData$$.presentationUsage || [];
                    if (presentationUsage && presentationUsage.length > 0) {
                        if (presentationUsage.indexOf("Title") > -1 && result[prop].value) {
                            this._moveWhyFound2ResponseAttr(whyfounds, result[prop]);
                            title = title + " " + result[prop].value;
                        }

                        if (presentationUsage.indexOf("Text") > -1) {
                            result[prop].longtext = true;
                        }

                        if (presentationUsage.indexOf("Summary") > -1) {
                            summaryAttrs.push({
                                property: prop,
                                displayOrder: result[prop].$$MetaData$$.displayOrder
                            });
                        } else if (presentationUsage.indexOf("Detail") > -1) {
                            detailAttrs.push({
                                property: prop,
                                displayOrder: result[prop].$$MetaData$$.displayOrder
                            });
                        } else if (presentationUsage.indexOf("Title") > -1) {
                            titleAttrs.push({
                                property: prop,
                                displayOrder: result[prop].$$MetaData$$.displayOrder
                            });
                        } else if (presentationUsage.indexOf("Hidden") > -1) {
                            result[prop].hidden = true;
                            hiddenAttrs.push({
                                property: prop,
                                displayOrder: result[prop].$$MetaData$$.displayOrder
                            });
                        }
                    }

                    if (result[prop].$$MetaData$$.isKey === true) {
                        if (keyFields.length > 0) {
                            keyFields += ';';
                        }
                        keyFields = keyFields + prop + '=' + result[prop].valueRaw; //encodeURIComponent(result[prop].valueRaw);
                    }

                    var semanticObjectType = result[prop].$$MetaData$$.semanticObjectType;
                    if (semanticObjectType && semanticObjectType.length > 0) {
                        semanticObjectTypeAttrs[semanticObjectType] = result[prop].valueRaw;
                    }
                }

                //fileloader
                //if (result.$$DataSourceMetaData$$.semanticObjectType === 'fileprocessorurl') {
                if (isDocumentConnector === true) {
                    var sidClient = ';o=sid(' + result.$$DataSourceMetaData$$.systemId + '.' + result.$$DataSourceMetaData$$.client + ')';

                    connectorName = 'UIA000~EPM_FILE_PROC_U_DEMO~';
                    if (result.$$DataSourceMetaData$$.objectName && result.$$DataSourceMetaData$$.objectName.value) {
                        connectorName = result.$$DataSourceMetaData$$.objectName.value;
                    }

                    thumbnailLink = "/sap/opu/odata/SAP/ESH_SEARCH_SRV" + sidClient + "/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='ThumbNail',SelectionParameters='" + keyFields + "')/$value";
                    result.thumbnail = {
                        $$MetaData$$: {
                            accessUsage: [],
                            correspondingSearchAttributeName: "thumbnail",
                            dataType: "String",
                            description: "Thumbnail",
                            displayOrder: 0,
                            isKey: false,
                            isSortable: false,
                            isTitle: false,
                            presentationUsage: ["Thumbnail"]
                        },
                        label: "Thumbnail",
                        labelRaw: "Thumbnail",
                        value: thumbnailLink,
                        valueRaw: thumbnailLink
                    };

                    titleLink = "/sap/opu/odata/SAP/ESH_SEARCH_SRV" + sidClient + "/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='BinaryContent',SelectionParameters='" + keyFields + "')/$value";
                    result.titlelink = {
                        $$MetaData$$: {
                            accessUsage: [],
                            correspondingSearchAttributeName: "titlelink",
                            dataType: "String",
                            description: "Display Original Document",
                            displayOrder: 0,
                            isKey: false,
                            isSortable: false,
                            isTitle: false,
                            presentationUsage: ["Titlelink"]
                        },
                        label: "Display original document",
                        labelRaw: "Display original document",
                        value: titleLink,
                        valueRaw: titleLink
                    };
                    //result.titleUrl = titleLink;
                    uri = titleLink;

                    /*                suvlink = "/sap/opu/odata/SAP/ESH_SEARCH_SRV/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='SUVFile',SelectionParameters='PHIO_ID=" + result.PHIO_ID.valueRaw + "')/$value?sap-client=" + client;
                                    suvlink = '/sap-pdfjs/web/viewer.html?file=' + encodeURIComponent(suvlink);*/
                    suvlink = "/sap/opu/odata/SAP/ESH_SEARCH_SRV" + sidClient + "/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='SUVFile',SelectionParameters='" + keyFields + "')/$value";
                    suvlink = '/sap/bc/ui5_ui5/ui2/ushell/resources/sap/fileviewer/viewer/web/viewer.html?file=' + encodeURIComponent(suvlink);

                    result.suvlink = {
                        $$MetaData$$: {
                            accessUsage: [],
                            correspondingSearchAttributeName: "suvlink",
                            dataType: "String",
                            description: "Show Document",
                            displayOrder: 0,
                            isKey: false,
                            isSortable: false,
                            isTitle: false,
                            presentationUsage: ["Link"]
                        },
                        label: "Show Document",
                        labelRaw: "suvlink",
                        value: suvlink,
                        valueRaw: suvlink
                    };

                    if (result['PHIO_ID_THUMBNAIL'] && result['PHIO_ID_THUMBNAIL'].value) {
                        result.containsThumbnail = true;
                    }
                    if (result['PHIO_ID_SUV'] && result['PHIO_ID_SUV'].value) {
                        result.containsSuvFile = true;
                    }

                }

                summaryAttrs.sort(sortDisplayOrder);
                detailAttrs.sort(sortDisplayOrder);
                titleAttrs.sort(sortDisplayOrder);
                hiddenAttrs.sort(sortDisplayOrder);

                var displayRelevantAttrs = summaryAttrs.concat(detailAttrs);
                //displayRelevantAttrs.push.apply(displayRelevantAttrs, hiddenAttrs);
                var formattedResult = {};
                formattedResult.key = result.key;
                formattedResult.keystatus = result.keystatus;
                formattedResult.semanticObjectTypeAttrs = semanticObjectTypeAttrs;
                var imageAttr = this._getImageUrl(result);
                formattedResult.imageUrl = imageAttr.imageUrl;
                // find proper datasource label in datasource map
                // for example Employee(PH5:002), it is not provided by server
                var dataSourceFoundInMap = this.sina.getDataSourceSyncByBusinessObjectName(result.$$DataSourceMetaData$$.key);
                if (dataSourceFoundInMap) {
                    formattedResult.dataSourceName = dataSourceFoundInMap.label;
                } else {
                    formattedResult.dataSourceName = result.$$DataSourceMetaData$$.label;
                    console.log("This datasource " + result.$$DataSourceMetaData$$.label + result.$$DataSourceMetaData$$.name + " is not found in meta data map.");
                }
                formattedResult.dataSource = result.$$DataSourceMetaData$$;
                formattedResult.uri = uri;
                formattedResult.containsThumbnail = result.containsThumbnail;
                formattedResult.containsSuvFile = result.containsSuvFile;
                formattedResult.semanticObjectType = result.$$DataSourceMetaData$$.semanticObjectType || "";
                formattedResult.$$Name$$ = '';
                formattedResult.systemId = result.$$DataSourceMetaData$$.systemId || "";
                formattedResult.client = result.$$DataSourceMetaData$$.client || "";
                if (result.suvlink && result.suvlink.value) {
                    formattedResult.suvlink = result.suvlink.value;
                }

                formattedResult.isDocumentConnector = isDocumentConnector;



                var propDisplay;
                var oItemAttribute = {};

                var aItemAttributes = [];
                for (var z = 0; z < displayRelevantAttrs.length; z++) {
                    propDisplay = displayRelevantAttrs[z].property;
                    oItemAttribute = {};
                    // image attribute shall not be displayed as a normal key value pair
                    if (propDisplay !== imageAttr.name) {
                        this._moveWhyFound2ResponseAttr(whyfounds, result[propDisplay]);
                        oItemAttribute.name = result[propDisplay].label;
                        oItemAttribute.value = result[propDisplay].value;
                        oItemAttribute.valueWithoutWhyfound = result[propDisplay].valueWithoutWhyfound;
                        oItemAttribute.key = propDisplay;
                        oItemAttribute.isTitle = false; // used in table view
                        oItemAttribute.isSortable = result[propDisplay].$$MetaData$$.isSortable; // used in table view
                        oItemAttribute.attributeIndex = z; // used in table view
                        oItemAttribute.hidden = result[propDisplay].hidden;
                        if (result[propDisplay].whyfound) {
                            oItemAttribute.whyfound = result[propDisplay].whyfound;
                        }
                        if (result[propDisplay].longtext) {
                            oItemAttribute.longtext = result[propDisplay].longtext;
                        }
                        aItemAttributes.push(oItemAttribute);
                    }
                }

                var aTitleAttributes = [];
                for (var y = 0; y < titleAttrs.length; y++) {
                    propDisplay = titleAttrs[y].property;
                    oItemAttribute = {};
                    if (propDisplay !== imageAttr.name) {
                        oItemAttribute.name = result[propDisplay].label;
                        oItemAttribute.value = result[propDisplay].value;
                        oItemAttribute.key = propDisplay;
                        oItemAttribute.isTitle = false; // used in table view
                        oItemAttribute.isSortable = result[propDisplay].$$MetaData$$.isSortable; // used in table view
                        // oItemAttribute.attributeIndex = y; // used in table view
                        aTitleAttributes.push(oItemAttribute);
                    }
                }

                formattedResult.$$Name$$ = title.trim();
                formattedResult.numberofattributes = displayRelevantAttrs.length;
                formattedResult.title = result.title;
                formattedResult.itemattributes = aItemAttributes;
                formattedResult.titleattributes = aTitleAttributes;

                formattedResult.selected = formattedResult.selected || false;
                formattedResult.expanded = formattedResult.expanded || false;

                this._appendRemainingWhyfounds2FormattedResultItem(whyfounds, formattedResult.itemattributes);
                formattedResults.push(formattedResult);
            }

            return formattedResults;
        }
    };

    return module;
});
