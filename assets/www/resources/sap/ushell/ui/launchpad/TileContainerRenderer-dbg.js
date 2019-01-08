// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/

sap.ui.define(['sap/ushell/resources'],
	function(resources) {
	"use strict";

    /**
     * @class TileContainer renderer.
     * @static
     *
     * @private
     */
    var TileContainerRenderer = {};

    /**
     * Renders the HTML for the given control, using the provided
     * {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager}
     *            oRm the RenderManager that can be used for writing to the render
     *            output buffer
     * @param {sap.ui.core.Control}
     *            oControl an object representation of the control that should be
     *            rendered
     */
    TileContainerRenderer.render = function (oRm, oControl) {
        var aTiles = oControl.getTiles(),
            aHeaderActions = oControl.getHeaderActions(),
            aBeforeContent = oControl.getBeforeContent(),
            aAfterContent = oControl.getAfterContent(),
            aFootItems = oControl.getFooterContent() || [],
            // bHideTileContainer = !oControl.getVisible(),
            bVisibleTileExists = false,
            containerHeight,
            aLinks = oControl.getLinks();

        //WRAPPER start
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass("sapUshellTileContainer");
        oRm.writeClasses();

        oRm.write(">");

        //BEFORE CONTENT start
        if (aBeforeContent.length) {
            oRm.write("<div");
            oRm.addClass("sapUshellTileContainerBeforeContent");
            oRm.addClass("sapContrastPlus ");
            oRm.writeClasses();
            oRm.write(">");
            jQuery.each(aBeforeContent, function () {
                oRm.renderControl(this);
            });
            oRm.write("</div>");
        }
        //BEFORE CONTENT end

        //CONTENT start
        oRm.write("<div");
        oRm.addClass("sapUshellTileContainerContent");
        if (oControl.getIsGroupLocked()) {
            oRm.addClass("sapUshellTileContainerLocked");
        }
        if (oControl.getDefaultGroup()) {
            oRm.addClass("sapUshellTileContainerDefault");
        }
        if (oControl.getShowBackground()) {
            oRm.addClass("sapUshellTileContainerEditMode");
        }
        oRm.writeClasses();
        oRm.writeAttribute("tabindex", "-1");
        oRm.write(">");
        if (oControl.getShowDragIndicator()) {
            oRm.write("<div");
            oRm.addClass("sapUshellCircleBase");
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("<div");
            oRm.addClass("sapUshellCircle");
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("</div>");
            oRm.write("<div");
            oRm.addClass("sapUshellCircle");
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("</div>");
            oRm.write("<div");
            oRm.addClass("sapUshellCircle");
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("</div>");
            oRm.write("<div");
            oRm.addClass("sapUshellCircle");
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("</div>");
            oRm.write("</div>");
        }
        if (oControl.getShowBackground()) {
            oRm.write("<div");
            oRm.addClass("sapUshellGroupBackgroundContainer sapContrastPlus");
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("</div>");
        }
        if (oControl.getShowHeader()) {
            // Title
            oRm.write("<div");
            oRm.addClass("sapUshellTileContainerHeader sapContrastPlus");
            oRm.writeAttribute("id", oControl.getId() + "-groupheader");
            oRm.writeClasses();

            if (oControl.getIeHtml5DnD() && !oControl.getIsGroupLocked() && !oControl.getDefaultGroup() && oControl.getTileActionModeActive()) {
                oRm.writeAttribute("draggable", "true");
            }

            oRm.write(">");
            oRm.write("<div");
            oRm.writeAttribute("id", oControl.getId() + "-title");
            oRm.write(">");
            oRm.write("<");
            oRm.write(oControl.getHeaderLevel().toLowerCase());
            oRm.addClass('sapUshellContainerTitle');
            oRm.writeClasses();

            oRm.writeAttributeEscaped("title", oControl.getHeaderText());
            oRm.writeAttribute("id", oControl.getId() + "-titleText");
            oRm.writeAttribute("data-role", "group");
            var oAccStateObj = {};
            // group is default case (Home group)
            if (oControl.getDefaultGroup()) {
                oAccStateObj.label = resources.i18n.getText("ariaLabelEditModeGroupDefault",  oControl.getHeaderText());
                // locked group case
            } else if (oControl.getIsGroupLocked()) {
                oAccStateObj.label = resources.i18n.getText("ariaLabelEditModeGroupLocked",  oControl.getHeaderText());
            } else {
                // general group case
                oAccStateObj.label = resources.i18n.getText("ariaLabelEditModeGroup",  oControl.getHeaderText());
            }
            oRm.writeAccessibilityState(oControl, oAccStateObj);
            oRm.write(">");
            oRm.writeEscaped(oControl.getHeaderText());
            oRm.write("</");
            oRm.write(oControl.getHeaderLevel().toLowerCase());
            oRm.writeAttribute("id", oControl.getId() + "-groupheader");
            oRm.write(">");
            if (oControl.getShowIcon()) {
                oControl.oIcon.removeStyleClass('sapUshellContainerIconHidden');
            } else {
                oControl.oIcon.addStyleClass('sapUshellContainerIconHidden');
            }
            oRm.renderControl(oControl.oIcon);
            oRm.renderControl(oControl.oEditInputField);
            //Header Actions
            //Header Action Start
            oRm.write("<div");
            oRm.addClass('sapUshellContainerHeaderActions');
            oRm.writeClasses();
            oRm.write(">");

            jQuery.each(aHeaderActions, function () {
                oRm.renderControl(this);
            });
            //Header Action End
            oRm.write("</div>");

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
        jQuery.each(aTiles, function () {
            if (this.getVisible()) {
                bVisibleTileExists = true;
            }
            if (this.getVisible) {
                oRm.renderControl(this);
            }
        });
        // If no tiles in group or default group
        if (oControl.getShowPlaceholder()) {
            oRm.renderControl(oControl.oPlusTile);
        }

        // hook method to render no data
        if (oControl.getShowNoData()) {
            this.renderNoData(oRm, oControl, !aTiles.length || !bVisibleTileExists);
        }

        //SORTABLE end
        oRm.write("</ul>");

        //Links rendering
        var bLineModeContainer = oControl._newLinkContainerEnabled();
        if (aLinks.length > 0 || bLineModeContainer) {
            if (oControl.getShowBackground() && !(oControl.getIsGroupLocked() && aTiles.length === 0)) {
                //Links Separator start.
                oRm.write("<div");
                oRm.addClass('sapUshellTilesContainerSeparator');
                oRm.writeClasses();
                oRm.write(">");
                //Links Separator end.
                oRm.write("</div>");
            }

        oRm.write("<div");
        var containerClassName = bLineModeContainer ? "sapUshellLineModeContainer" : "sapUshellLinksContainer";
        oRm.addClass(containerClassName);
        if (!aLinks.length && bLineModeContainer) {
            oRm.addClass("sapUshellNoLinksAreaPresent");
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("<div")
            oRm.addClass("sapUshellNoLinksAreaPresentText");
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oControl.getNoLinksText());
            oRm.write("</div>")
        } else {
            oRm.writeClasses();
            oRm.write(">");
        }

        if (bLineModeContainer) {
            //Transformation Error
            oRm.write("<div");
            oRm.addClass("sapUshellTransformationError");
            oRm.writeClasses();
            oRm.write(">");

            oRm.write("<div");
            oRm.addClass("sapUshellTransformationErrorInnerWrapper");
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oControl.getTransformationErrorIcon());
            oRm.renderControl(oControl.getTransformationErrorText());
            oRm.write("</div>");

            oRm.write("</div>");
        }

        if (bLineModeContainer) {
            oRm.write("<div class='sapUshellLinksInnerContainer'>");
        }

        aLinks.map(function (link, index, aLinks) {
            if (bLineModeContainer) {
                var tabIndexData = new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "tabindex",
                    value: "-1",
                    writeToDom: true
                });
                link.getCustomData().map(function (customData) {
                    if (customData.getKey() == 'tabindex' && customData.getValue("0")) {
                        tabIndexData = customData;
                    }
                    link.removeCustomData(customData);
                });
                link.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "aria-posinset",
                    value: (index + 1).toString(),
                    writeToDom: true
                }));
                link.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                    key: "aria-setsize",
                    value: aLinks.length.toString(),
                    writeToDom: true
                }));
                link.addCustomData(tabIndexData);
                link.addStyleClass("sapUshellLinkTile");
                if (oControl.getIsGroupLocked()) {
                    link.addStyleClass("sapUshellLockedTile");
                }
            }
            oRm.renderControl(link);
        });

        if (bLineModeContainer) {
            oRm.write("</div>");
        }

        oRm.write("</div>");
        }
        // FOOTER start
        if (aFootItems.length > 0) {
            oRm.write("<footer");
            oRm.addClass('sapUshellTilesContainerFtr');
            oRm.writeClasses();
            oRm.write(">");
            jQuery.each(aFootItems, function () {
                oRm.renderControl(this);
            });
            oRm.write("</footer>");
        }
        // FOOTER end

        //CONTENT end
        oRm.write("</div>");

        //AFTER CONTENT start
        if (aAfterContent.length) {
            oRm.write("<div");
            oRm.addClass("sapUshellTileContainerAfterContent");
            oRm.addClass("sapContrastPlus ");
            oRm.writeClasses();
            oRm.write(">");
            jQuery.each(aAfterContent, function () {
                oRm.renderControl(this);
            });
            oRm.write("</div>");
        }
        //AFTER CONTENT end

        //WRAPPER end
        oRm.write("</div>");
    };

    // Rendering a message in case no Tiles are visible after applying the user filter
    TileContainerRenderer.renderNoData = function (oRm, oControl, displayData) {
        oRm.write("<div id='" + oControl.getId() + "-listNoData' class='sapUshellNoFilteredItems sapUiStrongBackgroundTextColor'>");
        if (displayData) {
            if (oControl.getNoDataText()) {
                oRm.writeEscaped(oControl.getNoDataText());
            } else {
                oRm.writeEscaped(oControl.getNoDataText(resources.i18n.getText("noFilteredItems")));
            }
        } else {
            oRm.writeEscaped("");
        }
        oRm.write("</div>");
    };



	return TileContainerRenderer;

}, /* bExport= */ true);
