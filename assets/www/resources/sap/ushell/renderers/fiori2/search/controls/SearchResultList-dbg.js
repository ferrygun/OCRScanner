/* global $, jQuery, sap, window */


sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper'
], function(SearchHelper) {
    "use strict";

    return sap.m.List.extend('sap.ushell.renderers.fiori2.search.controls.SearchResultList', {

        init: function() {
            this.addStyleClass("searchResultList");
        },

        renderer: 'sap.m.ListRenderer',

        onAfterRendering: function() {
            var that = this;

            // First let the original sap.m.List do its work
            sap.m.List.prototype.onAfterRendering.apply(that, arguments);

            var model = sap.ushell.renderers.fiori2.search.getModelSingleton();
            var multiSelectionEnabled = model.getProperty("/multiSelectionEnabled");
            if (multiSelectionEnabled) {
                //searchResultList.addClass("sapUshellSearchResultList-ShowMultiSelection");
                that.enableSelectionMode(false);
            }

            that._prepareResizeHandler();

            that.collectListItemsForNavigation();
        },

        collectListItemsForNavigation: function() {
            var that = this;

            var aMyListItems = that.getItems();

            if (aMyListItems.length === 0) {
                return;
            }

            var doCollectListItemsForNavigationCallback = function() {
                that._doCollectListItemsForNavigation();
            };

            // We need to be aware of any re-rendering happening inside the app tile
            // container. Thus let's listen for any re-rendering going on inside.
            for (var i = 0; i < aMyListItems.length; i++) {
                var oMyItem = aMyListItems[i];
                if (oMyItem.hasStyleClass("sapUshellSearchResultListItemApps")) {
                    var oContent = oMyItem.getContent();
                    if (oContent.length > 0) { // && oContent[0].hasStyleClass("sapUshellSearchTileContainer")) {
                        oContent[0].addEventDelegate({
                            onAfterRendering: doCollectListItemsForNavigationCallback
                        });
                    }
                }
            }

            that._doCollectListItemsForNavigation();
        },

        _doCollectListItemsForNavigation: function() {
            var that = this;

            var i, j;

            var oFocusRef = that.getDomRef();
            if (!oFocusRef) {
                return;
            }

            var oItemNavigation = that.getItemNavigation();
            if (!oItemNavigation) {
                that._startItemNavigation();
                oItemNavigation = that.getItemNavigation();
            }

            if (!oItemNavigation) {
                return; // apparently this is a Tap-Device, e.g. an iPad
            }

            that._bItemNavigationInvalidated = false;

            // fix the item navigation to our needs:

            //Collect the dom references of the items
            var aRows = oFocusRef.getElementsByTagName("li");
            var aDomRefs = [];
            var aTileDomRefs = [];
            for (i = 0; i < aRows.length; i++) {
                var oRow = aRows[i];
                if ($(oRow).hasClass("sapUshellSearchResultListItemApps")) { // Handle Tiles (including the ShowMore-Tile)

                    var aTiles = oRow.getElementsByClassName("sapUshellSearchTileWrapper");
                    for (j = 0; j < aTiles.length; j++) {
                        var domRef = SearchHelper.getFocusableTileDomRef(aTiles[j]);
                        if (!domRef || $(domRef).is(":hidden")) {
                            continue;
                        }
                        aDomRefs.push(domRef);
                        aTileDomRefs.push(domRef);
                    }

                    $(oRow).removeAttr("tabindex");
                    $(oRow).removeAttr("role");
                    $(oRow).attr("aria-hidden", "true");

                } else if ($(oRow).hasClass("sapUshellSearchResultListFooter")) { // Handle ShowMore-Button

                    var aShowMoreLink = oRow.getElementsByClassName("sapUshellResultListMoreFooter");
                    for (j = 0; j < aShowMoreLink.length; j++) {
                        aDomRefs.push(aShowMoreLink[j]);
                        aTileDomRefs.push(aShowMoreLink[j]);
                    }

                } else if ($(oRow).hasClass("sapUshellSearchResultListItem")) { // Normal List Items
                    aDomRefs.push(oRow);
                    aTileDomRefs.push(oRow);
                }
            }

            //set the root dom node that surrounds the items
            //oItemNavigation.setRootDomRef(oFocusRef.children.item(0));
            if (aDomRefs.length > 0) {
                var $closestUL = $(aDomRefs[0]).closest("ul");
                var rootDomRef = $closestUL.length > 0 ? $closestUL[0] : aDomRefs[0].parentElement;
                oItemNavigation.setRootDomRef(rootDomRef);
            }

            //set the array of dom nodes representing the items.
            oItemNavigation.setItemDomRefs(aDomRefs);

            //turn of the cycling
            oItemNavigation.setCycling(false);

            oItemNavigation.setPageSize(10);

            if (aTileDomRefs.length > 0) {
                var ariaOwnsString = $(aTileDomRefs[0]).attr("id");
                for (i = 1; i < aTileDomRefs.length; i++) {
                    ariaOwnsString += " " + $(aTileDomRefs[i]).attr("id");
                }

                $(that.getDomRef()).children("[role='listbox']").attr("aria-owns", ariaOwnsString);
            }
        },


        _prepareResizeHandler: function() {
            var that = this;

            var resizeThresholds = [768, 1151];
            var windowWidthIndex = function() {
                var windowWidth = window.innerWidth;

                if (windowWidth < resizeThresholds[0]) {
                    return 0;
                }

                for (var i = 0; i < resizeThresholds.length - 1; i++) {
                    if (windowWidth >= resizeThresholds[i] && windowWidth < resizeThresholds[i + 1]) {
                        return i + 1;
                    }
                }

                return resizeThresholds.length;
            };

            var lastWindowWidthIndex = windowWidthIndex();

            var resizeHandler = function(event) {
                var currentWindowWidthIndex = windowWidthIndex();

                if (currentWindowWidthIndex != lastWindowWidthIndex) {
                    lastWindowWidthIndex = currentWindowWidthIndex;

                    var aMyListItems = that.getItems();
                    for (var i = 0; i < aMyListItems.length; i++) {
                        var oMyItem = aMyListItems[i];

                        if (oMyItem.getContent() && oMyItem.getContent().length > 0 && oMyItem.getContent()[0].showOrHideExpandButton) {
                            oMyItem.getContent()[0].showOrHideExpandButton();
                        }
                    }
                }
            };

            $(window).on("resize", resizeHandler);
        },



        enableSelectionMode: function(animated) {
            var that = this;

            /* eslint new-cap:0 */
            var deferredReturn = jQuery.Deferred();

            animated = animated === undefined ? true : animated;

            var searchResultList = $(that.getDomRef());
            if (!animated) {
                searchResultList.addClass("sapUshellSearchResultList-ShowMultiSelection");
                deferredReturn.resolve();
                return deferredReturn.promise();
            }

            var animationDuration = 200;

            //             var searchResultListItems = searchResultList.find(".sapUshellSearchResultListItem");
            var checkBoxExpandContainers = searchResultList.find(".sapUshellSearchResultListItem-CheckboxExpandContainer");
            var attributesContainers = searchResultList.find(".sapUshellSearchResultListItem-Attributes");
            var currentAttributesPadding = parseFloat(attributesContainers.css("padding-left"));
            var checkBoxContainer = checkBoxExpandContainers.find(".sapUshellSearchResultListItem-CheckboxContainer");
            var checkBoxWidth = checkBoxContainer.width();

            if (!searchResultList.hasClass("sapUshellSearchResultList-ShowMultiSelection")) {
                checkBoxExpandContainers.css("width", "0");
                checkBoxExpandContainers.css("opacity", "0");
                attributesContainers.css("padding-left", currentAttributesPadding);

                searchResultList.addClass("sapUshellSearchResultList-ShowMultiSelection");

                var newPadding = currentAttributesPadding + checkBoxWidth;

                var animation01 = checkBoxExpandContainers.animate({
                        "width": checkBoxWidth,
                        "opacity": 1
                    },
                    animationDuration,
                    function() {
                        $(this).css("width", "");
                        $(this).css("opacity", "");
                    });
                var animation02 = attributesContainers.animate({
                        "padding-left": newPadding
                    },
                    animationDuration,
                    function() {
                        $(this).css("padding-left", "");
                    });
                jQuery.when(animation01, animation02).done(function() {
                    deferredReturn.resolve();
                });
            } else {
                deferredReturn.resolve();
            }
            return deferredReturn.promise();
        },


        disableSelectionMode: function(animated) {
            var that = this;

            /* eslint new-cap:0 */
            var deferredReturn = jQuery.Deferred();

            animated = animated === undefined ? true : animated;

            var searchResultList = $(that.getDomRef());

            if (!animated) {
                searchResultList.removeClass("sapUshellSearchResultList-ShowMultiSelection");
                deferredReturn.resolve();
                return deferredReturn.promise();
            }

            var animationDuration = 200;

            //             var searchResultListItems = searchResultList.find(".sapUshellSearchResultListItem");
            var checkBoxExpandContainers = searchResultList.find(".sapUshellSearchResultListItem-CheckboxExpandContainer");
            var attributesContainers = searchResultList.find(".sapUshellSearchResultListItem-Attributes");
            var currentAttributesPadding = parseFloat(attributesContainers.css("padding-left"));
            var checkBoxContainer = checkBoxExpandContainers.find(".sapUshellSearchResultListItem-CheckboxContainer");
            var checkBoxWidth = checkBoxContainer.width();

            if (searchResultList.hasClass("sapUshellSearchResultList-ShowMultiSelection")) {
                var newPadding = currentAttributesPadding - checkBoxWidth;

                var animation01 = checkBoxExpandContainers.animate({
                        "width": 0,
                        "opacity": 0
                    },
                    animationDuration
                ).promise();
                var animation02 = attributesContainers.animate({
                        "padding-left": newPadding
                    },
                    animationDuration
                ).promise();
                jQuery.when(animation01, animation02).done(function() {
                    searchResultList.removeClass("sapUshellSearchResultList-ShowMultiSelection");
                    checkBoxExpandContainers.css("width", "");
                    checkBoxExpandContainers.css("opacity", "");
                    attributesContainers.css("padding-left", "");
                    deferredReturn.resolve();
                });
            } else {
                deferredReturn.resolve();
            }

            return deferredReturn.promise();
        }


        // Since oItemNavigation is created by the parent (sap.m.List), it should
        // also be destroyed by the parent.
        //         destroy: function() {
        //             if (this.oItemNavigation) {
        //                 this.removeDelegate(this.oItemNavigation);
        //                 this.oItemNavigation.destroy();
        //             }
        //         }
    });

});
