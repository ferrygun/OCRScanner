/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.TileContainer.
sap.ui.define(['sap/ui/core/Control',
               'sap/ushell/library',
               'sap/ushell/override',
               'sap/ushell/ui/launchpad/PlusTile'],
    function (Control, library, override, PlusTile) {
        "use strict";

/**
 * Constructor for a new ui/launchpad/TileContainer.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * A container that arranges Tile controls.
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.TileContainer
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var TileContainer = Control.extend("sap.ushell.ui.launchpad.TileContainer", /** @lends sap.ushell.ui.launchpad.TileContainer.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		scrollType : {type : "string", group : "Misc", defaultValue : 'item'},

		/**
		 * Animation Speed in milliseconds (ms)
		 */
		animationSpeed : {type : "int", group : "Misc", defaultValue : 500},

		/**
		 */
		groupId : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		showHeader : {type : "boolean", group : "Misc", defaultValue : true},

		/**
		 */
		showPlaceholder : {type : "boolean", group : "Misc", defaultValue : true},

		/**
		 */
		defaultGroup : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		isLastGroup : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		headerText : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		headerLevel : {type : "sap.m.HeaderLevel", group : "Misc", defaultValue : sap.m.HeaderLevel.H2},

		/**
		 * Header level (H1-H6) used for headers of tile groups.
		 */
		groupHeaderLevel : {type : "sap.m.HeaderLevel", group : "Misc", defaultValue : sap.m.HeaderLevel.H4},

		/**
		 */
		showGroupHeader : {type : "boolean", group : "Misc", defaultValue : true},

		/**
		 */
		visible : {type : "boolean", group : "Misc", defaultValue : true},

		/**
		 */
		sortable : {type : "boolean", group : "Misc", defaultValue : true},

		/**
		 */
		showNoData : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		noDataText : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		isGroupLocked : {type : "boolean", group : "Misc", defaultValue : null},

        /**
         */
        isGroupSelected : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		editMode : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		showBackground : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		icon : {type : "string", group : "Misc", defaultValue : 'sap-icon://locked'},

		/**
		 */
		showIcon : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		deluminate : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		showMobileActions : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		enableHelp : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		tileActionModeActive : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		ieHtml5DnD : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		showDragIndicator : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		showEmptyLinksArea : {type : "boolean", group : "Misc", defaultValue : false},

        /**
         */
        showEmptyLinksAreaPlaceHolder : {type : "boolean", group : "Misc", defaultValue : false},

        /**
         */
        hidden : {type : "boolean", group : "Misc", defaultValue : false},

        /**
         */
        transformationError : {type : "boolean", group : "Misc", defaultValue : false},

        /**
            supportLinkPersonalization: true if LaunchPageAdapter support link personalization
        */
        supportLinkPersonalization : {type : "boolean", group : "Misc", defaultValue : false}
	},
	aggregations : {

		/**
		 */
		tiles : {type : "sap.ushell.ui.launchpad.Tile", multiple : true, singularName : "tile"},

		/**
		 */
		links : {type : "sap.ui.core.Control", multiple : true, singularName : "link"},

		/**
		 */
		beforeContent : {type : "sap.ui.core.Control", multiple : true, singularName : "beforeContent"},

		/**
		 */
		afterContent : {type : "sap.ui.core.Control", multiple : true, singularName : "afterContent"},

		/**
		 */
		footerContent : {type : "sap.ui.core.Control", multiple : true, singularName : "footerContent"},

		/**
		 */
		headerActions : {type : "sap.ui.core.Control", multiple : true, singularName : "headerAction"}
	},
	events : {

		/**
		 */
		afterRendering : {},

		/**
		 * Event fired when placeholder is clicked
		 */
		add : {},

		/**
		 * Event fired when title is renamed
		 */
		titleChange : {}
	}
}});

/*global jQuery, sap*/
/**
 * @name sap.ushell.ui.launchpad.TileContainer
 *
 * @private
 */

    TileContainer.prototype.init = function () {
        this.bIsFirstTitleChange = true;

        this._sDefaultValue = sap.ushell.resources.i18n.getText("new_group_name");
        this._sOldTitle = "";

        this.oNoLinksText = new sap.m.Text({
            text: sap.ushell.resources.i18n.getText("emptyLinkContainerInEditMode")
        }).addStyleClass("sapUshellNoLinksAreaPresentTextInner");

        this.oTransformationErrorText = new sap.m.Text({
            text: sap.ushell.resources.i18n.getText("transformationErrorText")
        }).addStyleClass("sapUshellTransformationErrorText");

        this.oTransformationErrorIcon = new sap.ui.core.Icon({
            src: "sap-icon://message-error"
        }).addStyleClass("sapUshellTransformationErrorIcon");

        this.oIcon = new sap.ui.core.Icon({src: this.getIcon()});
        this.oIcon.addStyleClass('sapUshellContainerIcon');

        this.oPlusTile = new PlusTile({
            groupId : this.getGroupId(),
            press : [ this.fireAdd, this ]
        });
        this.oPlusTile.setParent(this);

        if(sap.ushell.Container != undefined){
            if(sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported()) {
                TileContainer.prototype.isLinkPersonalizationOveride();
            };
        }
    };

    TileContainer.prototype.exit = function () {
        if (this.oPlusTile) {
            this.oPlusTile.destroy();
        }
    };
    TileContainer.prototype.onAfterRendering = function () {
        var that = this,
            jqTileContainer;

        if (this.getEnableHelp()) {
            this.oPlusTile.addStyleClass("help-id-plusTile");//xRay help ID
        }

        this.setTransformationError(false);

        this.handleNoItemsToDisplayMessage();
        var bEnableRenameLockedGroup = this.getModel() && this.getModel().getProperty("/enableRenameLockedGroup") || false;
        jQuery("#" + this.getId() + "-title").find(this.getHeaderLevel()).click(function () {
            var bEditMode = bEnableRenameLockedGroup || !that.getIsGroupLocked() && !that.getDefaultGroup() && that.getTileActionModeActive();
            that.setEditMode(bEditMode);
        });
        // detecting it is an IE browser with touch screen
        // if ((document.documentMode) && (navigator.maxTouchPoints  || navigator.msMaxTouchPoints)) {
        //     jqTileContainer = jQuery(this.getDomRef());
        //     // cancel context menu and touch square in IE10 and above
        //     jqTileContainer.on("MSHoldVisual contextmenu", ".sapUshellTile", function (e) {
        //         e.preventDefault();
        //     });
        // }
        this.fireAfterRendering();

        // If we're using a desktop device update accessibility attributes.
        if (sap.ui.Device.system.desktop) {
            this.handleScreenReaderAttr();
        }
    };

    TileContainer.prototype.getTransformationErrorText = function () {
        return this.oTransformationErrorText;
    },

    TileContainer.prototype.getTransformationErrorIcon = function () {
        return this.oTransformationErrorIcon;
    },

    TileContainer.prototype.getNoLinksText = function() {
        return this.oNoLinksText;
    };

    TileContainer.prototype.setTransformationError = function (bTransformationError) {
        this.setProperty('transformationError', bTransformationError, true);  // suppress rerendering

        if (bTransformationError) {
            this.$().find(".sapUshellTransformationError").show();
        } else {
            this.$().find(".sapUshellTransformationError").hide();
        }
        this.$().find(".sapUshellNoLinksAreaPresent").toggleClass("sapUshellNoLinksAreaPresentError", bTransformationError);
        return this;
    };

    // Improve handling of aggregation updates
    TileContainer.prototype.updateAggregation = override.updateAggregation;
    TileContainer.prototype.updateTiles = function (sReason) {
        var sName = "tiles";
        if (this.isTreeBinding(sName)) {
            // no idea how to handle -> delegate to parent
            sap.ui.base.ManagedObject.prototype.updateAggregation.apply(this, arguments);
        } else {
            jQuery.sap.log.debug("Updating TileContainer. Reason: ", sReason);
            switch (sReason) {
            case "filter":
                try {
                    this.filterTiles(); // may fail if filter broadens after non-filter update
                } catch (ex) {
                    this.updateAggregation(sName);
                }
                break;
            default:
                this.updateAggregation(sName);
            }
        }
    };

    TileContainer.prototype.handleNoItemsToDisplayMessage = function () {
        var tilesBinding = this.getBinding('tiles'),
            isVisibleTiles = tilesBinding && tilesBinding.getContexts().length;
        if (isVisibleTiles) {
            this.$().find(".sapUshellNoFilteredItems").hide();
        } else {
            if (this.getShowNoData()) {
                if (this.getNoDataText()) {
                    this.setNoDataText(this.getNoDataText());
                } else {
                    this.setNoDataText(sap.ushell.resources.i18n.getText("noFilteredItems"));
                }
                this.$().find(".sapUshellNoFilteredItems").show();
            }
        }
    };

    TileContainer.prototype.createMissingElementsInOnScreenElements = function (indexingMaps, elementsToDisplay, indexSearchMissingFilteredElem, bGrouped, aSorters, oBindingInfo, fnaddNewItem, fnAddTileGroup) {
        var path,
            oNewGroup = null,
            sGroup = null,
            j = indexSearchMissingFilteredElem,
            bShowGroupHeader = this.getShowGroupHeader(),
            elementsToDisplayLength = elementsToDisplay.length,
            oGroupHeader;

        for (j = indexSearchMissingFilteredElem; j < elementsToDisplayLength; j++) {
            path = elementsToDisplay[j].getPath();
            //is aBindingContexts[j] not displayed
            if (!indexingMaps.onScreenPathIndexMap[path]) {
                //entry does not exist and should be displayed.
                if (bGrouped && aSorters.length > 0) {
                    oNewGroup = aSorters[0].fnGroup(elementsToDisplay[j]);
                    if (typeof oNewGroup === "string") {
                        oNewGroup = {
                            key: oNewGroup
                        };
                    }
                    if (sGroup === null && j > 0) {
                        sGroup = aSorters[0].fnGroup(elementsToDisplay[j - 1]);
                    }

                    //delete the sGroup logic, check only if not in indexingMaps.onScreenHeaders[oNewGroup.key].
                    if (oNewGroup.key !== sGroup) {
                        if (oBindingInfo.groupHeaderFactory) {
                            oGroupHeader = oBindingInfo.groupHeaderFactory(oNewGroup);
                        }

                        if (!indexingMaps.onScreenHeaders[oNewGroup.key]) {
                            fnAddTileGroup(oNewGroup, oGroupHeader);
                            indexingMaps.onScreenHeaders[oNewGroup.key] = {aItemsRefrenceIndex: this.getTiles().length - 1, isVisible: bShowGroupHeader};
                        }
                        sGroup = oNewGroup.key;
                    }
                }
                fnaddNewItem(elementsToDisplay[j]);
                indexingMaps.onScreenPathIndexMap[path] = {aItemsRefrenceIndex: this.getTiles().length - 1, isVisible: true};
            } else {
                //order problem needs to refresh.
                throw true;
            }
        }
    };

    TileContainer.prototype._newLinkContainerEnabled = function () {
        return this.getSupportLinkPersonalization();
    };

    TileContainer.prototype.addNewItem = function (elementToDisplay) {
        var sName = "tiles",
            oAggregationInfo = this.getMetadata().getJSONKeys()[sName],
            oBindingInfo = this.mBindingInfos[sName],
            fnFactory = oBindingInfo.factory,
            addNewItem = jQuery.proxy(function (oContext) {
                var sId = this.getId() + "-" + jQuery.sap.uid(),
                    oClone = fnFactory(sId, oContext);
                oClone.setBindingContext(oContext, oBindingInfo.model);
                this[oAggregationInfo._sMutator](oClone);
            }, this);

        addNewItem(elementToDisplay);
    };

    TileContainer.prototype.markVisibleOnScreenElements = function (elementsToDisplay, indexingMaps) {
        var indexSearchMissingFilteredElem = 0,
            path,
            elementsToDisplayLength = elementsToDisplay.length;

        for (indexSearchMissingFilteredElem = 0; indexSearchMissingFilteredElem < elementsToDisplayLength; indexSearchMissingFilteredElem++) {
            path = elementsToDisplay[indexSearchMissingFilteredElem].getPath();
            //is aBindingContexts[j] not displayed
            if (indexingMaps.onScreenPathIndexMap[path]) {
                //entry exists and should be display.
                indexingMaps.onScreenPathIndexMap[path].isVisible = true;
            } else {
                return indexSearchMissingFilteredElem;
            }
        }

        return indexSearchMissingFilteredElem;
    };

    TileContainer.prototype.indexOnScreenElements = function (onScreenItems) {
        var path,
            indexOnScreen,
            indexingMaps = {onScreenHeaders: {}, onScreenPathIndexMap: {}},
            onScreenItemsLength = onScreenItems.length,
            curOnScreenItem;

        for (indexOnScreen = 0; indexOnScreen < onScreenItemsLength; indexOnScreen++) {
            curOnScreenItem = onScreenItems[indexOnScreen];
            if (curOnScreenItem.getHeaderText) {
                //it is a header
                indexingMaps.onScreenHeaders[curOnScreenItem.getHeaderText()] = {aItemsRefrenceIndex: indexOnScreen, isVisible: false};
            } else if (curOnScreenItem.getBindingContext()) {
                //it is a tile
                path = curOnScreenItem.getBindingContext().getPath();
                indexingMaps.onScreenPathIndexMap[path] = {aItemsRefrenceIndex: indexOnScreen, isVisible: false};
            }
        }

        return indexingMaps;
    };

    TileContainer.prototype.showHideTilesAndHeaders = function (indexingMaps, onScreenItems) {
        var scrPathKey,
            sName = "tiles",
            bShowGroupHeader = this.getShowGroupHeader(),
            oBinding = this.mBindingInfos[sName].binding,
            groupHeader,
            realItem,
            entry;

        for (scrPathKey in indexingMaps.onScreenPathIndexMap) {
            if (indexingMaps.onScreenPathIndexMap.hasOwnProperty(scrPathKey)) {
                entry = indexingMaps.onScreenPathIndexMap[scrPathKey];
                realItem = onScreenItems[entry.aItemsRefrenceIndex];
                realItem.setVisible(entry.isVisible);

                //set the corresponding header to be displayed.
                if (entry.isVisible) {
                    groupHeader = oBinding.aSorters[0].fnGroup(realItem.getBindingContext());
                    indexingMaps.onScreenHeaders[groupHeader].isVisible = bShowGroupHeader;
                }
            }
        }

        //show headers...
        for (scrPathKey in indexingMaps.onScreenHeaders) {
            if (indexingMaps.onScreenHeaders.hasOwnProperty(scrPathKey)) {
                entry = indexingMaps.onScreenHeaders[scrPathKey];
                onScreenItems[entry.aItemsRefrenceIndex].setVisible(entry.isVisible);
            }
        }
    };

    TileContainer.prototype.filterTiles = function () {
        var sName = "tiles",
            oBindingInfo = this.mBindingInfos[sName],
            oBinding = this.mBindingInfos[sName].binding,
            aBindingContexts = oBinding.getContexts(),
            aItems = this.getTiles(),
            indexSearchMissingFilteredElem,
            indexingMaps,
            lastDomPath,
            firstFltrPath,
            spLastOnScreen,
            spFirstOnFilter,
            indexFirstOnFilter,
            indexLastOnScreen;

        //index the on screen elements according to the path
        indexingMaps = this.indexOnScreenElements(aItems);

        //search for the missing filtered elements
        indexSearchMissingFilteredElem = this.markVisibleOnScreenElements(aBindingContexts, indexingMaps);

        //validate data is still can be added to the screen object and still the ordering will be ok else call refresh.
        if (aBindingContexts[indexSearchMissingFilteredElem] && this.getTiles().length > 0) {
            lastDomPath = this.getTiles()[this.getTiles().length - 1].getBindingContext().getPath();
            firstFltrPath = aBindingContexts[indexSearchMissingFilteredElem].getPath();
            spLastOnScreen = lastDomPath.split('/');
            spFirstOnFilter = firstFltrPath.split('/');
            indexLastOnScreen = spLastOnScreen[spLastOnScreen.length - 1];
            indexFirstOnFilter = spFirstOnFilter[spFirstOnFilter.length - 1];
            if (parseInt(indexLastOnScreen, 10) > parseInt(indexFirstOnFilter, 10)) {
                throw true;
            }
        }

        //add the missing elements and check if there is a need for header.
        this.createMissingElementsInOnScreenElements(indexingMaps, aBindingContexts, indexSearchMissingFilteredElem, oBinding.isGrouped(), oBinding.aSorters, oBindingInfo, this.addNewItem.bind(this), this.addTileGroup.bind(this));

        aItems = this.getTiles();

        //show/ hide all the tiles ...
        this.showHideTilesAndHeaders(indexingMaps, aItems);
        this.handleNoItemsToDisplayMessage();

        // If we're using a desktop device update accessibility attributes.
        if (sap.ui.Device.system.desktop) {
            this.handleScreenReaderAttr();
        }
    };

    TileContainer.prototype.addTileGroup = function (oGroup, oHeader) {
        this.addAggregation("tiles", oHeader || new sap.ushell.ui.launchpad.HeaderTile({
            headerText: oGroup.text || oGroup.key,
            headerLevel : oGroup.headerLevel || this.getGroupHeaderLevel(),
            visible : this.getShowGroupHeader()
        }));
    };

    // Override setters
    TileContainer.prototype.setNoDataText = function (oNoDataText) {
        this.setProperty("noDataText", oNoDataText, true); // suppress rerendering
        if (this.getShowNoData()) {
            this.$().find(".sapUshellNoFilteredItems").text(oNoDataText);
        }
        return this;
    };

    TileContainer.prototype.setGroupId = function (v) {
        this.setProperty("groupId", v, true);        // set property, but suppress rerendering
        if (this.oPlusTile) {
            this.oPlusTile.setGroupId(v);
        }
        return this;
    };

    TileContainer.prototype.setHeaderText = function (sHeaderText) {
        this.setProperty("headerText", sHeaderText, true);        // set property, but suppress rerendering
        this.$().find(".sapUshellContainerTitle").text(sHeaderText);
        return this;
    };

    TileContainer.prototype.setShowGroupHeader = function (bVisible) {
        this.setProperty("showGroupHeader", bVisible, true);  // suppress rerendering
        this.$().find(".sapUshellTileContainerHeader").toggleClass("sapUshellGroupHeaderHidden",!bVisible);
        return this;
    };

    TileContainer.prototype.setVisible = function (bVisible) {
        this.setProperty("visible", bVisible, true);  // suppress rerendering
        this.toggleStyleClass("sapUshellHidden", !bVisible);
        return this;
    };

    TileContainer.prototype.setShowMobileActions = function (bShowMobileActions) {
        var bSupressRerendering = true;

        if (this.oHeaderButton) {
            this.oHeaderButton.setVisible(bShowMobileActions);
        } else if (bShowMobileActions) {
            bSupressRerendering = false;
        }
        this.setProperty('showMobileActions', bShowMobileActions, bSupressRerendering);
    };

    TileContainer.prototype.setShowIcon = function (bShowIcon) {
        this.setProperty('showIcon', bShowIcon, true);  // suppress rerendering
        jQuery('#' + this.getId()).find('.' + 'sapUshellContainerIcon').toggleClass('sapUshellContainerIconHidden', !bShowIcon);
    };

    TileContainer.prototype.setDeluminate = function (bDeluminate) {
        this.setProperty('deluminate', bDeluminate, true);  // suppress rerendering
        this.toggleStyleClass('sapUshellDisableLockedGroupDuringDrag', bDeluminate);
        return this;
    };

    sap.ushell.ui.launchpad.TileContainer.prototype.setHidden = function (bHidden) {
        this.setProperty("hidden", !!bHidden, true);
        this.toggleStyleClass("sapUshellTileContainerEditModeHidden", !!bHidden);
        return this;
    };

    TileContainer.prototype.groupHasTiles = function () {
        var sPath = '',
            tiles = this.getTiles(),
            links = [];
        if (this.getBindingContext()) {
            sPath = this.getBindingContext().sPath;
            tiles = this.getModel().getProperty(sPath).tiles;
        }
        return sap.ushell.utils.groupHasVisibleTiles(tiles, links);
    };

    TileContainer.prototype.handleScreenReaderAttr = function () {
        // Get Catalog items from DOM.
        var containerDOM = this.getInnerContainersDomRefs();
        var aContainerElements = containerDOM[0].children;
        if (!aContainerElements || aContainerElements.length == 0 || !aContainerElements[0].classList.contains("sapUshellHeaderTile")) {
            return;
        }

        var oCurrentCatalogHeader;
        var iCurrentGroupSize;
        var aCurrentCatalogTiles = [];

        // Foreach catalog item (tile or header)
        for (var i = 0; i < aContainerElements.length; i++) {
            // If the element is filtered out, it exists in the DOM yet hidden,
            // So we want to ignore it on count.
            if (aContainerElements[i].classList.contains("sapUshellHidden")) {
                continue;
            }

            // If the current element is a tile group header
            if (aContainerElements[i].classList.contains("sapUshellHeaderTile")) {
                // Apply header accessibility attributes.
                oCurrentCatalogHeader = aContainerElements[i];
                jQuery(oCurrentCatalogHeader).attr("role", "heading");
                jQuery(oCurrentCatalogHeader).attr("aria-level", "3");

                // Start a new group count.
                iCurrentGroupSize = 0;
                aCurrentCatalogTiles = [];
            } else if (aContainerElements[i].tagName == "LI") {
                // If the current element is a tile
                // Increase tile count, insert element position and save in group.
                iCurrentGroupSize++;
                jQuery(aContainerElements[i]).attr("aria-posinset", iCurrentGroupSize);
                aCurrentCatalogTiles.push(aContainerElements[i]);

                // If there is no next element, or the next element is not a tile,
                // Then we arrived at the end of the group.
                var oNextElement = aContainerElements[i+1];
                if (!oNextElement || oNextElement.tagName != "LI") {
                    // Update tile group size for all tiles.
                    for (var j = 0; j < aCurrentCatalogTiles.length; j++) {
                        jQuery(aCurrentCatalogTiles[j]).attr("aria-setsize", aCurrentCatalogTiles.length);
                    }
                }
            }
        }
    };

    TileContainer.prototype.getInnerContainerDomRef = function () {
        var containerDOM = this.getDomRef(),
            innnerContainer;
        if (!containerDOM) {
            return null;
        }
        innnerContainer = jQuery(containerDOM).find('.sapUshellTilesContainer-sortable');
        return innnerContainer[0];
    };
    TileContainer.prototype.getInnerContainersDomRefs= function () {
        var containerDOM = this.getDomRef(),
            innnerContainer,
            linksContainer;
        if (!containerDOM) {
            return null;
        }
        innnerContainer = jQuery(containerDOM).find('.sapUshellTilesContainer-sortable');
        linksContainer = jQuery(containerDOM).find('.sapUshellLineModeContainer');
        return [innnerContainer[0], linksContainer[0]];
    };
    TileContainer.prototype.setEditMode = function (bValue) {
        if (bValue) {
            this.addStyleClass('sapUshellEditing');
            this._startEdit();
        } else {
            this.setProperty('editMode', bValue, false);
            this.removeStyleClass('sapUshellEditing');
        }
    };


/**
 *  This updateLinks override is handling for Personalization Links  only and not for sap.m.link.
 *
 *  When convert tile is called - we need to update the tiles and links aggregation.
 *  There is a problem with updating links aggregation since its entities are not bound to any properties in the model and aggregation is populated by factory function.
 *  When override.updateAggregation is called, the GenericTile properties are not updated with new binding context simply because it does not have any bindings,
 *  but the number of links in the model is reflected in the control. That causes only the last link to be removed in the UI while links are not updated with their new context.
 *
 */

        TileContainer.prototype.isLinkPersonalizationOveride = function() {
            TileContainer.prototype.updateLinks = function (sReason) {
                var oGroupsBox = this.getParent(),
                    bTabsMode = oGroupsBox && oGroupsBox.getDisplayMode && oGroupsBox.getDisplayMode() === 'tabs';

                if (bTabsMode && !this.getTileActionModeActive()) {
                    //updateAggregation causes all aggregations of the tile containers to be destroyed by calling "destroy" of each
                    //entry and not by "destroyAll" method of the control. Since links are not controlled by GLP, we cannot allow to destroy them.
                    //In order to prevent destruction of all links, we remove all links from all tile containers except for the selected one.
                    oGroupsBox.removeLinksFromUnselectedGroups();
                }
                this.removeAllLinks();
                sap.ui.base.ManagedObject.prototype.updateAggregation.call(this, "links");
            };

            TileContainer.prototype.destroyLinks = function (sReason) {
                console.log("*************link is destroyed" + sReason);
            };
    };


    TileContainer.prototype.setShowEmptyLinksArea = function (bValue) {
        this.setProperty('showEmptyLinksArea', bValue, true);
        this.toggleStyleClass("sapUshellLinksAreaHidden", !bValue);
    };

        TileContainer.prototype.setShowEmptyLinksAreaPlaceHolder = function (bValue) {
            this.setProperty('showEmptyLinksArea', bValue, true);
            this.toggleStyleClass("sapUshellTileContainerEditMode", bValue);
            this.toggleStyleClass("sapUshellTileContainerTabsModeEmptyLinksArea", bValue);
            this.toggleStyleClass("sapUshellEmptyLinksAreaPlaceHolder", !bValue);
        };

    TileContainer.prototype._startEdit = function () {
        var that = this;

        // create Input for header text editing if not exists
        if (this.getModel() && !this.getModel().getProperty("/editTitle")) {
            this.getModel().setProperty("/editTitle", true, false);
        }
        if (!this.oEditInputField) {
            sap.ui.require(['sap/m/Input'],
                function (Input) {
                    that.setProperty('editMode', true, false);
                    that.oEditInputField = new Input({
                        placeholder: that._sDefaultValue,
                        value: that.getHeaderText()
                    }).addStyleClass('sapUshellTileContainerTitleInput');

                    that.oEditInputField.addEventDelegate({

                        // after rendering - if edit had been invoked on this input field - focus the title & select the text
                        // that was done before in a setTimeout of 100 millis and not after the actual rendering, which resulted in - when the system
                        // is very heavy (bad connectivity/many content) the text was not selected.
                        onAfterRendering: function () {

                            /*
                             We do it within the set time out as -
                             there might be a situation where, adding the new group at the end of the screen, causes
                             a scroll which removes the text-selection
                             Thus we use setTimeOut to ensure the input had been rendered to ensure any auto scroll is done before
                             we select the text and focus the input
                             */

                            setTimeout(function () {
                                // as on after rendering might be called several times, we reselect the text in case input is visible
                                // that can only be in case the new group title is edited
                                var oEditDomRef = that.oEditInputField.getDomRef();
                                if (oEditDomRef) {
                                    if (jQuery('#' + oEditDomRef.id + ":visible").length > 0) {

                                        setTimeout(function () {
                                            jQuery(oEditDomRef).find('input').focus();
                                            that.oEditInputField.selectText(0, that.oEditInputField.getValue().length);
                                        }.bind(that), 100);

                                        var windowHeight = jQuery(window).height(),
                                            jsGroup = that.getDomRef(),
                                            groupOffsetHeight = jsGroup.offsetHeight,
                                            groupTop = jsGroup.getBoundingClientRect().top,
                                            groupsOffset = jsGroup.offsetTop;
                                        ;

                                        if (groupOffsetHeight + groupTop > windowHeight) {
                                            jQuery('.sapUshellDashboardView section').stop().animate({scrollTop: groupsOffset}, 0);
                                        }
                                    }
                                }
                            }.bind(that), 100);
                        }.bind(that),
                        onfocusout: function (oEvent) {
                            // var oTileContainerTitle = oEvent.srcControl,
                            //     jqGroupTitle = jQuery(oTileContainerTitle.getDomRef()).prev();
                            that._stopEdit();
                            jQuery.proxy(that.setEditMode, that, false)();
                        },
                        onsapenter: function (oEvent) {
                            that._stopEdit();
                            jQuery.proxy(that.setEditMode, that, false)();
                            setTimeout(function () {
                                var oTileContainerTitle = oEvent.srcControl,
                                    jqGroupTitle = jQuery(oTileContainerTitle.getDomRef()).prev();

                                jqGroupTitle.focus();
                            }, 0);
                        }
                    });
                    that.oEditInputField.setValue(that.getHeaderText());
                });
        } else {
            this.oEditInputField.setValue(this.getHeaderText());
            that.setProperty('editMode', true, false);
        }


        // setting a flag that edit (for the tile container input) had been started
        //this.startedEdit = true;
        this._sOldTitle = this._sDefaultValue;

        //Text Selection & focus on input field
        if (sap.ui.Device.system.phone) {
            var that = this;
            setTimeout(function () {
                    var oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.publish("launchpad", "scrollToGroup", {
                        group: that,
                        groupChanged: false,
                        focus: false
                    });
            }, 100);
        }
    };

    TileContainer.prototype._stopEdit = function () {

        var sCurrentTitle = this.getHeaderText();
        var sNewTitle = this.oEditInputField.getValue(),
            bHasChanged;
        sNewTitle = sNewTitle.substring(0, 256).trim() || this._sDefaultValue;
        bHasChanged = sNewTitle !== sCurrentTitle;
        if (this.bIsFirstTitleChange && sNewTitle === this.oEditInputField.getPlaceholder()) {
            bHasChanged = true;
        }
        this.bIsFirstTitleChange = false;
        if (this.getModel() && this.getModel().getProperty("/editTitle")) {
            this.getModel().setProperty("/editTitle", false, false);
        }

        if (!this._sOldTitle) {

            this._sOldTitle = sCurrentTitle;
            this.setHeaderText(sCurrentTitle);

        } else if (bHasChanged) {
            this.fireTitleChange({
                newTitle: sNewTitle
            });
            this.setHeaderText(sNewTitle);
        }
    };


    TileContainer.prototype.exit = function () {
        if (this.oHeaderButton) {
            this.oHeaderButton.destroy();
        }
        if (this.oActionSheet) {
            this.oActionSheet.destroy();
        }
        //Call the parent sap.m.Button exit method
        if (Control.prototype.exit) {
            Control.prototype.exit.apply(this, arguments);
        }
    };



	return TileContainer;

});
