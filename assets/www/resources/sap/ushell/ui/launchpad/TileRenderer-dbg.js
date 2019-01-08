// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/

sap.ui.define(['sap/ushell/resources'],
	function(resources) {
	"use strict";

    /**
     * @class Tile renderer.
     * @static
     *
     * @private
     */
    var TileRenderer = {};
    // var translationBundle = sap.ushell.resources.i18n;

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
    TileRenderer.render = function (oRm, oControl) {
        var oTileView = null, oModel = oControl.getModel(),
            aContent,
            oPinButton = oControl.getPinButton();

        oPinButton = oPinButton.length ? oPinButton[0] : undefined;
        try {
            oTileView = oControl.getTileViews()[0];
        } catch (ex) {
            jQuery.sap.log.warning("Failed to load tile view: ", ex.message);
            oTileView = new sap.m.Text({ text: "Failed to load. "});
        }
        var oTileContainer = oControl.getParent(),
            oTiles = oTileContainer && oTileContainer.getTiles ? oTileContainer.getTiles() : [],
            oVisibleTiles = oTiles.filter(function (oTile) {
                return oTile.getVisible();
            }),
            iCurrentItemIndex = oVisibleTiles.indexOf(oControl) > -1 ? oVisibleTiles.indexOf(oControl) + 1 : "";

        if (!oTileContainer) {
            return;
        }

        oRm.write("<li");

        // if xRay is enabled
        if (oModel && oModel.getProperty("/enableHelp")) {
            // currently only the Tile (and the Tile's footer) has a data attribute in teh xRay integration
            // (as using this value as a class value instead as done in all of the static elements causes parsing errors in the xRay hotspot definition flow)
            oRm.writeAttribute("data-help-id", oControl.getTileCatalogId());// xRay support
        }
        oRm.writeControlData(oControl);
        oRm.addClass("sapUshellTile");

        //In case of ActionMode we need actual height on tile
        //By this if we check if we are in the edit mode or not
        if(oControl.getTileActionModeActive()){
            oRm.addClass("sapUshellTileWrapper");
        }

        //FeedTile BG should be transparent, since sapUshellTile BG style cannot be changed,
        //We add a special styleClass to FeedTile in order to set its BG to transparent
        if (oTileView && oTileView.getContent && sap.suite && sap.suite.ui && sap.suite.ui.commons && sap.suite.ui.commons.FeedTile) {
            aContent = oTileView.getContent();
            aContent.forEach(function (oItem) {
                if (oItem instanceof sap.suite.ui.commons.FeedTile) {
                    oRm.addClass("sapUshellFeedTileBG");
                }
            });
        }

        if (oControl.getLong()) {
            oRm.addClass("sapUshellLong");
        }
        if (!oControl.getVisible()) {
            oRm.addClass("sapUshellHidden");
        }
        if (oControl.getIsLocked()){
            oRm.addClass("sapUshellLockedTile");
        }
        oRm.writeClasses();
        oRm.writeAccessibilityState(oControl, {role: "option", posinset : iCurrentItemIndex, setsize : oVisibleTiles.length});
        var ariaDescribedBy = oControl.getParent().getId() + "-titleText";
        oRm.writeAttribute("aria-describedby", ariaDescribedBy );
        if (oControl.getIeHtml5DnD()) {
            oRm.writeAttribute("draggable", "true");
        }

        var layoutPosition = oControl.data('layoutPosition');
        if (layoutPosition) {
            var stylePosition = '-webkit-transform:' + layoutPosition.translate3D + ';-ms-transform:' + layoutPosition.translate2D + ';transform:' + layoutPosition.translate3D;
            oRm.writeAttribute("style", stylePosition);
        }

        oRm.write(">");

        //In case of Action Mode we don't need Additional Container
        //By this if we check if we are in the edit mode or not
        if (!oControl.getTileActionModeActive()) {
            oRm.write("<div");
            oRm.addClass("sapUshellTileWrapper");
            oRm.writeClasses();
            oRm.write(">");
        }

        this.renderTileActionMode(oRm, oControl);

        // Tile Content
        oRm.addClass("sapUshellTileInner");
        // action mode is true
        if (oControl.getProperty('tileActionModeActive')) {
            oRm.addClass("sapUshellTileActionBG");
        }


        if (this.renderTileView) {
            this.renderTileView(oRm, oTileView, oPinButton, oControl.getTarget(),oControl.getIsCustomTile());
        }


        // if Tile has the ActionsIcon (overflow icon at its top right corner) - display it
        if (oControl.getShowActionsIcon() && !oControl.getTileActionModeActive()) {
            oRm.renderControl(oControl.actionIcon);
        }

        //In case of Action Mode we don't need Additional Container
        if (!oControl.getTileActionModeActive()) {
            oRm.write("</div>");

            //In here we will add the pin button div
            if (this.renderTileActionsContainer) {
                this.renderTileActionsContainer(oRm, oTileView, oPinButton, oControl.getTarget(), oControl.getIsCustomTile());
            }
        }

        oRm.write("</li>");
    };

    TileRenderer.renderTileActionsContainer = function (oRm, oTileView, oPinButton, sTarget,bIsCustomTile ) {
        //add overlay and pinButton
        if (oPinButton) {
            oPinButton.addStyleClass("sapUshellActionButton");

            oRm.write("<div");
            oRm.addClass("sapUshellTilePinButtonOverlay");

            oRm.writeClasses();

            //For accessability needs: the overlay div will be read as readonly field
            if(oTileView.getHeader) {
                oRm.writeAccessibilityState(oTileView, {role: "toolbar", label: oTileView.getHeader()});
            }

            oRm.write(">");
            oRm.renderControl(oPinButton);
            oRm.write("</div>");
        }
    };

    TileRenderer.renderTileView = function (oRm, oTileView, oPinButton, sTarget,bIsCustomTile ) {
        // if its custom tile - we add it in div
        // it doesn't support in open new tab by right click
        if(bIsCustomTile){
            oRm.write("<div");
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oTileView);
            oRm.write("</div>");
        }else{
            oRm.write("<a");
            oRm.writeClasses();
            if (sTarget) {
                oRm.writeAttributeEscaped("href", sTarget);
            }
            oRm.write(">");
            oRm.renderControl(oTileView);
            oRm.write("</a>");
        }
    };

    TileRenderer.renderTileActionMode = function (oRm, oControl) {
        // if tile is rendered in Edit-Mode (Tile Action mode)
        if (!oControl.getTileActionModeActive()) {
            return;
        }

        // Add the ActioMode cover DIV to the tile
        oRm.write("<div");
        oRm.addClass("sapUshellTileActionLayerDiv");
        oRm.writeClasses();
        oRm.write(">");

        // we display the Delete action icon - only if tile is not part of a locked group
        if (oControl.getTileActionModeActive() && !oControl.getIsLocked()) {
            // render the trash bin action
            // outer div - the click area for the delete action
            oRm.write("<div");
            oRm.addClass("sapUshellTileDeleteClickArea");
            oRm.writeClasses();
            oRm.write(">");
            // 2nd div - to draw the circle around the icon
            oRm.write("<div");
            oRm.addClass("sapUshellTileDeleteIconOuterClass");
            oRm.writeClasses();
            oRm.write(">");
            oRm.renderControl(oControl._initDeleteAction()); // initialize & render the tile's delete action icon
            oRm.write("</div>");// 2nd div - to draw the circle around the icon
            oRm.write("</div>"); // outer div - the click area for the delete action
        }

        // add a div to render the tile's bottom overflow icon
        oRm.write("<div class='sapUshellTileActionDivCenter'></div>");
        oRm.write("<div");
        oRm.addClass("sapUshellTileActionIconDivBottom");
        oRm.writeClasses();
        oRm.write(">");
        oRm.write("<div");
        oRm.addClass("sapUshellTileActionIconDivBottomInnerDiv");
        oRm.writeClasses();
        oRm.write(">");
        oRm.renderControl(oControl.getActionSheetIcon());
        oRm.write("</div>");
        oRm.write("</div>");


        oRm.write("</div>");
    };



	return TileRenderer;

}, /* bExport= */ true);
