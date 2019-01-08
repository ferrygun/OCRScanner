/**
 * @name sap.ushell.ui.launchpad.CatalogContainer
 *
 * @private
 */

sap.ui.define([
    'sap/ui/core/Control'
], function(Control) {
    "use strict";

    var CatalogEntryContainer = Control.extend("sap.ushell.ui.launchpad.CatalogEntryContainer", {
        metadata : {
            properties: {
                header: {type: "string", group: "Appearance", defaultValue: null},
                catalogSearchTerm: {type: "string", group: "Appearance", defaultValue: null},
                catalogTagSelector: {type: "object", group: "Appearance", defaultValue: null}
            },
            aggregations: {
                appBoxesContainer: {type: "sap.ushell.ui.appfinder.AppBox", multiple: true},
                customTilesContainer: {type: "sap.ushell.ui.launchpad.Tile", multiple: true}
            }
        },
        renderer: {
            render: function (oRm, oControl) {

                var aTiles = oControl.getCustomTilesContainer(),
                    aAppBoxes = oControl.getAppBoxesContainer(),
                    sHeaders,
                    containerHeight;

                //WRAPPER start
                oRm.write("<div");
                oRm.writeControlData(oControl);
                oRm.addClass("sapUshellTileContainer sapUshellCatalogTileContainer");
                oRm.writeClasses();
                oRm.write(">");
                //CONTENT start
                oRm.write("<div");
                oRm.addClass("sapUshellTileContainerContent");
                oRm.writeClasses();
                oRm.writeAttribute("tabindex", "-1");
                oRm.write(">");
                if (oControl.getHeader()) {
                    var aResults = oControl.getNumberResults();
                    sHeaders = sap.ushell.resources.i18n.getText(oControl.getHeader(), [aResults.nAppboxes + aResults.nCustom]);

                    // Title
                    oRm.write("<div");
                    oRm.addClass("sapUshellTileContainerHeader sapUshellCatalogTileContainerHeader");
                    oRm.writeAttribute("id", oControl.getId() + "-groupheader");
                    oRm.writeClasses();
                    oRm.write(">");
                    oRm.write("<div");
                    oRm.writeAttribute("id", oControl.getId() + "-title");
                    oRm.addClass("sapUshellCatalogTileContainerHeaderInner");
                    oRm.writeClasses();
                    oRm.write(">");
                    oRm.write("<");
                    oRm.write('h2');//TODO: fix this!!!
                    oRm.addClass("sapUshellContainerTitle sapUshellCatalogContainerTitle");
                    oRm.writeClasses();
                    oRm.writeAttributeEscaped("title", sHeaders);
                    //TODO: Evaluate oAccStateObj later.
                    /*                    var oAccStateObj = {};
                     oAccStateObj.role = "group";
                     // group is default case (Home group)
                     if (oControl.getDefaultGroup()) {
                     oAccStateObj.label = sap.ushell.resources.i18n.getText("ariaLabelEditModeGroupDefault",  oControl.getHeaderText());
                     // locked group case
                     } else if (oControl.getIsGroupLocked()) {
                     oAccStateObj.label = sap.ushell.resources.i18n.getText("ariaLabelEditModeGroupLocked",  oControl.getHeaderText());
                     } else {
                     // general group case
                     oAccStateObj.label = sap.ushell.resources.i18n.getText("ariaLabelEditModeGroup",  oControl.getHeaderText());
                     }
                     oRm.writeAccessibilityState(oControl, oAccStateObj);*/
                    oRm.write(">");
                    oRm.writeEscaped(sHeaders);
                    oRm.write("</");
                    oRm.write('h2');//TODO: fix this!!!
                    oRm.writeAttribute("id", oControl.getId() + "-groupheader");
                    oRm.write(">");
                    oRm.write("</div>");
                    // Title END
                    oRm.write("</div>");
                }
                //SORTABLE start
                oRm.write("<ul");
                containerHeight = oControl.data('containerHeight');
                if (containerHeight) {
                    oRm.writeAttribute("style", 'height:' + containerHeight);
                }
                oRm.addClass('sapUshellTilesContainer-sortable');
                oRm.addClass('sapUshellInner');
                oRm.writeClasses();
                oRm.writeAccessibilityState(oControl, {role: "listbox"});
                oRm.write(">");

                // Tiles rendering, and checking if there is at lest one visible Tile
                jQuery.each(/*aTiles*/aAppBoxes, function () {
                    if (this.getVisible()) {
                        //bVisibleTileExists = true;
                    }
                    if (this.getVisible) {
                        oRm.renderControl(this);
                    }
                });
                //SORTABLE end
                oRm.write("</ul>");

                //////////////////////////////////////////////
                ////////////// Custom Tiles Start ////////////

                //SORTABLE start
                oRm.write("<ul");
                containerHeight = oControl.data('containerHeight');
                if (containerHeight) {
                    oRm.writeAttribute("style", 'height:' + containerHeight);
                }
                oRm.addClass('sapUshellTilesContainer-sortable');
                oRm.addClass('sapUshellInner');
                oRm.writeClasses();
                oRm.writeAccessibilityState(oControl, {role: "listbox"});
                oRm.write(">");

                // Tiles rendering, and checking if there is at lest one visible Tile
                jQuery.each(aTiles, function () {
                    if (this.getVisible()) {
                        //bVisibleTileExists = true;
                    }
                    if (this.getVisible) {
                        oRm.renderControl(this);
                    }
                });
                //SORTABLE end
                oRm.write("</ul>");
                //CONTENT end
                oRm.write("</div>");
                //WRAPPER end
                oRm.write("</div>");
            }
        }
    });

    CatalogEntryContainer.prototype.setCatalogTagSelector = function (aTagsList) {
    };

    CatalogEntryContainer.prototype.setAfterHandleElements = function (fnCallback) {
        this.onAfterHandleElements = fnCallback;
    };

    CatalogEntryContainer.prototype.onAfterUpdate = function (fnCallback) {
        this.fnCallback = fnCallback;
    };

    CatalogEntryContainer.prototype.setCatalogSearchTerm = function (sSearchTerm) {

    };

    //sap.ushell.ui.launchpad.TileContainer.prototype.overrideUpdateAggregation = sap.ushell.override.updateAggregation;
    CatalogEntryContainer.prototype.updateAggregation = function (sReason) {
        jQuery.sap.log.debug("Updating CatalogEntryContainer. Reason: ", sReason);

        try {
            // may fail if filter broadens after non-filter update
            this.handleElements(sReason);
        } catch (ex) {
            sap.ui.base.ManagedObject.prototype.updateAggregation.apply(this, arguments);
        }

    };

    CatalogEntryContainer.prototype.addNewItem = function (elementToDisplay, sName) {
        var oNewCatalog,
            aItems,
            sPath = elementToDisplay.getPath();

        //in case catalogStatus is full. and newItem added, it means that the user alreay see this catalog fully, and most likly can see the next catalog.
        //in that can ignore the allocation and add the data to that catalog, this in to next page, this is data that is already displaied.
        if (this.catalogState[sName] != "full") {
            if (this.getAllocatedUnits) {
                if (!this.getAllocatedUnits()) {
                    //this state indicates that this catalog is rendered parially due to units allocations, we will need to complite the loading once we have more allocations.
                    this.catalogState[sName] = "partial";
                    return false;
                }
            }
        }

        //TODO do not forget Move it to the controller of the catalog as a callback.
        //This code should be in the controller of the view, TODO make a callback from the controller, very like the calculater
        //This code bind between the view and the tile, It is here to improve performance.
        if (sName === "customTilesContainer") {
            var newView = sap.ushell.Container.getService("LaunchPage").getCatalogTileView(elementToDisplay.getProperty("src"));
            elementToDisplay.getProperty("content")[0] = newView;
        }

        oNewCatalog = sap.ushell.ui.launchpad.TileContainerUtils.createNewItem.bind(this)(elementToDisplay, sName);
        sap.ushell.ui.launchpad.TileContainerUtils.addNewItem.bind(this)(oNewCatalog, sName);

        aItems = (sName === "appBoxesContainer")? this.getAppBoxesContainer() : this.getCustomTilesContainer(),
            this.indexingMaps[sName].onScreenPathIndexMap[sPath] = {aItemsRefrenceIndex: aItems.length - 1, isVisible: true};

        if (this.newElementCreated) {
            this.newElementCreated(sName, this);
        }

        return true;
    };

    CatalogEntryContainer.prototype.getNumberResults = function (sReason) {
        return {
            nAppboxes: this.nNumberOfVisibileElements["appBoxesContainer"],
            nCustom: this.nNumberOfVisibileElements["customTilesContainer"]
        };
    };

    CatalogEntryContainer.prototype.handleElements = function (sReason) {
        var sName = sReason,
            oBinding = this.mBindingInfos[sName].binding,
            aBindingContexts = oBinding.getContexts(),
            aItems,
            oShowHideReturnObject,
            oTtitleElement,
            indexSearchMissingFilteredElem;

        if (!this.catalogState) {
            this.catalogState = {};
        }

        if (!this.catalogState[sReason]) {
            this.catalogState[sReason] = "start";
        }

        if (!this.indexingMaps) {
            this.indexingMaps ={};
        }

        if (!this.nNumberOfVisibileElements) {
            this.nNumberOfVisibileElements = [];
        }
        if (!this.nNumberOfVisibileElements["customTilesContainer"]) {
            this.nNumberOfVisibileElements["customTilesContainer"] = 0;
        }

        if (!this.nNumberOfVisibileElements["appBoxesContainer"]) {
            this.nNumberOfVisibileElements["appBoxesContainer"] = 0;
        }

        if (!this.filters) {
            this.filters = {};
        }

        aItems = (sName === "appBoxesContainer")? this.getAppBoxesContainer() : this.getCustomTilesContainer();

        //index the on screen elements according to the path
        this.indexingMaps[sName] = sap.ushell.ui.launchpad.TileContainerUtils.indexOnScreenElements(aItems, false);

        //search for the missing filtered elements
        indexSearchMissingFilteredElem = sap.ushell.ui.launchpad.TileContainerUtils.markVisibleOnScreenElements(aBindingContexts, this.indexingMaps[sName], true);

        //validate data is still can be added to the screen object and still the ordering will be ok else call refresh.
        /*        if (!sap.ushell.ui.launchpad.TileContainerUtils.validateOrder(aBindingContexts, aItems, indexSearchMissingFilteredElem )) {
         throw true;
         }*/

        //add the missing elements and check if there is a need for header.
        if (sap.ushell.ui.launchpad.TileContainerUtils.createMissingElementsInOnScreenElements(this.indexingMaps[sName], aBindingContexts, indexSearchMissingFilteredElem, this.addNewItem.bind(this), aItems ,this.filters[sName], sName)) {
            //this state indicates that we rendered all the available tiles for this catalog.
            if (this.getAllocatedUnits && this.getAllocatedUnits()) {
                this.catalogState[sReason] = "full";
            }
        }

        aItems = (sName === "appBoxesContainer")? this.getAppBoxesContainer() : this.getCustomTilesContainer();

        //show/ hide all the tiles ...
        oShowHideReturnObject = sap.ushell.ui.launchpad.TileContainerUtils.showHideTilesAndHeaders(this.indexingMaps[sName], aItems);
        this.nNumberOfVisibileElements[sName] = oShowHideReturnObject.nCountVisibElelemnts;

        if (this.fnCallback) {
            this.fnCallback(this);
        }

        //Update counter.
        oTtitleElement = jQuery("#" + this.getId() + "-title h2");
        oTtitleElement.html(sap.ushell.resources.i18n.getText(this.getHeader(), [this.nNumberOfVisibileElements["appBoxesContainer"] + this.nNumberOfVisibileElements["customTilesContainer"]]));

        if (this.onAfterHandleElements) {
            this.onAfterHandleElements(this);
        }
        /*
         // If we're using a desktop device update accessibility attributes.
         if (sap.ui.Device.system.desktop) {
         this.handleScreenReaderAttr();
         }*/
    };

    return CatalogEntryContainer;
});