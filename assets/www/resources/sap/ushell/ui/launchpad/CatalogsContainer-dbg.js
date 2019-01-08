/**
 * @name sap.ushell.ui.launchpad.CatalogsContainer
 *
 * @private
 */

sap.ui.define([
    'sap/ui/core/Control'
], function(Control) {
    "use strict";

    var CatalogsContainer = Control.extend("sap.ushell.ui.launchpad.CatalogsContainer", {
        metadata : {
            properties: {
                categoryFilter: {type: "string", defaultValue: "ALL"},
                categoryAllocateTiles: {type: "int", defaultValue: "0"}
            },
            aggregations: {
                catalogs: {type: "sap.ushell.ui.launchpad.CatalogEntryContainer", multiple: true}
            }
        },
        renderer: {
            render: function (oRm, oControl) {
                var aCatalogs = oControl.getCatalogs();
                if (aCatalogs.length) {
                    oControl.setBusy(false);
                }
                //CatalogsContainer rendering - start.
                oRm.write("<div");
                oRm.addClass("sapUshellCatalogsContainer");
                oRm.writeClasses();
                oRm.writeControlData(oControl);
                oRm.write(">");
                jQuery.each(aCatalogs, function (index, aCatalog) {
                    oRm.renderControl(this);
                });

                //CatalogsContainer rendering - end.
                oRm.write("</div>");
            }
        }
    });

    CatalogsContainer.prototype.setPagingManager = function (oPagingManager) {
        jQuery.sap.measure.start("FLP:DashboardManager.CatalogsRendering", "CatalogsRendering","FLP");
        jQuery.sap.measure.pause("FLP:DashboardManager.CatalogsRendering");

        this.oPagingManager = oPagingManager;
    }

    CatalogsContainer.prototype.setCategoryAllocateTiles = function (nAllocatedUnits) {
        var aItems = this.getCatalogs();

        this.nAllocatedUnits = nAllocatedUnits;

        //now that we have allocation lets render the next bulk.
        //check that we have indexed that catalogs.
        if (!this.indexingMaps) {
            return;
        }

        if (!this.filters) {
            this.filters ={};
        }

        //set search term, make sure that for any newlly added element we set the element visibility according to this search term
        this.filters.pagination = function (entry) {

            var sPath = entry.getPath(),
                oCatlalogEntry, indexEntry,
                aCatalogs = this.getCatalogs();

            indexEntry = this.indexingMaps.onScreenPathIndexMap[sPath];

            //display all allocations for this catalog.
            oCatlalogEntry = aCatalogs[indexEntry.aItemsRefrenceIndex];
            if (indexEntry.isVisible && (oCatlalogEntry.nAllocatedUnits || this.nAllocatedUnits)) {

                oCatlalogEntry.handleElements("appBoxesContainer");
                oCatlalogEntry.handleElements("customTilesContainer");
            } else {
                //If we do not have allocated units for this catalog the its visibility will be false.
                indexEntry.isVisible = false;
            }
        }.bind(this);

        //for each appBoxesContainer check the search term.
        this.indexingMaps = sap.ushell.ui.launchpad.TileContainerUtils.indexOnScreenElements(aItems);
        sap.ushell.ui.launchpad.TileContainerUtils.applyFilterOnAllItems(this.mBindingInfos["catalogs"], this.filters);

        if (this.indexingMaps) {
            sap.ushell.ui.launchpad.TileContainerUtils.showHideTilesAndHeaders(this.indexingMaps, this.getCatalogs());
        }
    };


    CatalogsContainer.prototype.setCategoryFilter = function (sCatalog) {
        var sCatalogKey,
            oIndexedElem,
            oCatalog,
            aItems = this.getCatalogs();

        this.sCatalogTerm = sCatalog;

        //check that we have indexed that catalogs.
        if (!this.indexingMaps) {
            return;
        }

        if (!this.filters) {
            this.filters ={};
        }

        //set search term, make sure that for any newlly added element we set the element visibility according to this search term
        this.filters.catalogEntry = function (entry) {

            var sPath = entry.getPath(),
                bIsSelectedCatalog = entry.getProperty("title") === this.sCatalogTerm,
                indexEntry;

            if (!this.sCatalogTerm) {
                //Do not filter catalogs when Catalogs All is selected.
                return;
            }

            //we need to check if this catalog was fully loadded or event not loaded, and if so to load it.
            indexEntry = this.indexingMaps.onScreenPathIndexMap[sPath];

            //mark the selected catalog as visible.
            if (indexEntry) {
                indexEntry.isVisible = bIsSelectedCatalog;
            }
        }.bind(this);
        //Validate that this catalog is loaded.
        //Did we index catalog with that name?
        for (sCatalogKey in this.indexingMaps.onScreenPathIndexMap) {
            if (this.indexingMaps.onScreenPathIndexMap.hasOwnProperty(sCatalogKey)) {
                oIndexedElem = this.indexingMaps.onScreenPathIndexMap[sCatalogKey];
                oCatalog = aItems[oIndexedElem.aItemsRefrenceIndex];
                if (sCatalog === oCatalog.getBindingContext().getProperty("title")) {
                    //This is the catalog, check if it is full loaded.
                    if (oCatalog.catalogState.appBoxesContainer !== "full" || oCatalog.catalogState.customTilesContainer !== "full") {
                        //if catalog not fully loaded.
                        //allocate units
//                        oIndexedElem.isVisible = true;
                        if (this.oPagingManager) {
                            this.oPagingManager.moveToNextPage();
                            this.nAllocatedUnits = this.oPagingManager._calcElementsPerPage();
                        }

                        //If not add only this catalog first page.
                        if (oCatalog.catalogState.appBoxesContainer !== "full") {
                            oCatalog.handleElements("appBoxesContainer");
                        }
                        if (oCatalog.catalogState.customTilesContainer !== "full") {
                            oCatalog.handleElements("customTilesContainer");
                        }
                    }
                }
            }
        }

        if (this.oPagingManager) {
            this.oPagingManager.moveToNextPage();
            this.nAllocatedUnits = this.oPagingManager._calcElementsPerPage();
        }

        //for each appBoxesContainer check the search term.
        this.indexingMaps = sap.ushell.ui.launchpad.TileContainerUtils.indexOnScreenElements(aItems);
        sap.ushell.ui.launchpad.TileContainerUtils.applyFilterOnAllItems(this.mBindingInfos["catalogs"], this.filters);

        if (this.indexingMaps) {
            sap.ushell.ui.launchpad.TileContainerUtils.showHideTilesAndHeaders(this.indexingMaps, this.getCatalogs());
        }
    };

    CatalogsContainer.prototype.updateAggregation = function (sReason) {
        jQuery.sap.log.debug("Updating TileContainer. Reason: ", sReason);

        try {
            // may fail if filter broadens after non-filter update
            jQuery.sap.measure.resume("FLP:DashboardManager.CatalogsRendering");
            this.filterElements();
            jQuery.sap.measure.pause("FLP:DashboardManager.CatalogsRendering");
        } catch (ex) {
            sap.ui.base.ManagedObject.prototype.updateAggregation.apply(this, arguments);
        }

    };

    CatalogsContainer.prototype.addNewItem = function (elementToDisplay, sName) {
        var oNewCatalog,
            ntileSizeInUnits,
            aItems,
            sPath = elementToDisplay.getPath(),
            isCatalogInPagingation = !!this.nAllocatedUnits;

        oNewCatalog = sap.ushell.ui.launchpad.TileContainerUtils.createNewItem.bind(this)(elementToDisplay, sName);
        oNewCatalog.nAllocatedUnits = this.nAllocatedUnits;

        oNewCatalog.getAllocatedUnits = function () {
            return this.nAllocatedUnits;
        }.bind(this);

        //this function will realoc units, in the case when elements are filtered.
        oNewCatalog.elementFiltered = function (nNumberFilteredElements, sElementType, oCatalog) {
            //according to the sElementType ask the paging manager how much units to substruct.
            ntileSizeInUnits = this.oPagingManager.getSizeofSupportedElementInUnits("tile");
            this.nAllocatedUnits += nNumberFilteredElements * ntileSizeInUnits;

            //we now have allocated elements, we need to process them.
            this.setCategoryAllocateTiles(this.nAllocatedUnits);
        }.bind(this);

        oNewCatalog.newElementCreated = function (sElementType, oCatalog) {
            //according to the sElementType ask the paging manager how much units to substruct.
            this.nAllocatedUnits -= this.oPagingManager.getSizeofSupportedElementInUnits("tile");

            if (this.nAllocatedUnits <= 0) {
                this.nAllocatedUnits = 0;
            }
        }.bind(this);

        sap.ushell.ui.launchpad.TileContainerUtils.addNewItem.bind(this)(oNewCatalog, sName);
        aItems = this.getCatalogs();

        this.indexingMaps.onScreenPathIndexMap[sPath] = {aItemsRefrenceIndex: aItems.length - 1, isVisible: true};

        //this is used by the pagination filter in order to indicate that thouse catalogs are in the pagination.
        this.catalogPagination[sPath] = isCatalogInPagingation;

        //pass the allocated tiles attributes to the CatalogEntryContainer.
        return true;
    };

    CatalogsContainer.prototype.handleFilters = function() {
        if (!this.catalogPagination) {
            this.catalogPagination = {};
        }

        if (!this.catalogsElementsMap) {
            this.catalogsElementsMap = {};
        }

        if (!this.filters) {
            this.filters ={};
        }
    };

    CatalogsContainer.prototype.filterElements = function () {
        var sName = "catalogs",
            oBinding = this.mBindingInfos[sName].binding,
            aBindingContexts = oBinding.getContexts(),
            aItems = this.getCatalogs(),
            indexSearchMissingFilteredElem;

        //index the on screen elements according to the path
        if (!this.indexingMaps) {
            this.indexingMaps = sap.ushell.ui.launchpad.TileContainerUtils.indexOnScreenElements(aItems);
        }

        this.handleFilters();

        //search for the missing filtered elements
        indexSearchMissingFilteredElem = sap.ushell.ui.launchpad.TileContainerUtils.markVisibleOnScreenElements(aBindingContexts, this.indexingMaps, false);


        //validate data is still can be added to the screen object and still the ordering will be ok else call refresh.
        if (!sap.ushell.ui.launchpad.TileContainerUtils.validateOrder(aBindingContexts, aItems, indexSearchMissingFilteredElem )) {
            throw true;
        }

        //add the missing elements and check if there is a need for header.
        sap.ushell.ui.launchpad.TileContainerUtils.createMissingElementsInOnScreenElements(this.indexingMaps, aBindingContexts, indexSearchMissingFilteredElem, this.addNewItem.bind(this), aItems ,this.filters, sName);

        aItems = this.getCatalogs();

        //for each before we show / hide run apply filters.
//        sap.ushell.ui.launchpad.TileContainerUtils.applyFilterOnAllItems(oBindingInfo, this.filters);

        //show/ hide all the tiles ...
        sap.ushell.ui.launchpad.TileContainerUtils.showHideTilesAndHeaders(this.indexingMaps, aItems);
        /*
         // If we're using a desktop device update accessibility attributes.
         if (sap.ui.Device.system.desktop) {
         this.handleScreenReaderAttr();
         }*/
    };

    return CatalogsContainer;
});
