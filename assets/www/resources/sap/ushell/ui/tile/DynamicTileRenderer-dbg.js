// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global jQuery, sap*/

sap.ui.define([
		'sap/ui/core/Renderer',
		'sap/ui/core/format/NumberFormat',
		'./State',
		'./TileBaseRenderer'
	], function(Renderer, NumberFormat, State, TileBaseRenderer) {
	"use strict";

    /**
     * @name sap.ushell.ui.tile.DynamicTileRenderer.
     * @static
     * @private
     */
    var DynamicTileRenderer = Renderer.extend(TileBaseRenderer);
    var translationBundle = sap.ushell.resources.i18n;

    /**
     * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
     *
     * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
     * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
     */
    DynamicTileRenderer.renderPart = function (oRm, oControl) {
        var numValue = oControl.getNumberValue(),
            numberFactor = oControl.getNumberFactor(),
            displayNumber = numValue.toString();

        //we have to crop numbers to prevent overflow.
        //max characters without icon is 5, with icon 4.
        var maxCharactersInDisplayNumber = oControl.getIcon() ? 4 : 5;
        //check if we need to process the number of digits in case of a decimal value
        var bShouldProcessDigits = this._shouldProcessDigits(displayNumber, oControl);
        if (displayNumber.length > maxCharactersInDisplayNumber || bShouldProcessDigits) {
            var oNormalizedNumberData = this._normalizeNumber(numValue, maxCharactersInDisplayNumber, numberFactor, oControl);
            numberFactor = oNormalizedNumberData.numberFactor;
            displayNumber = oNormalizedNumberData.displayNumber;
        } else if (displayNumber !== "") {
            var oNForm = NumberFormat.getFloatInstance({maxFractionDigits: maxCharactersInDisplayNumber});
            displayNumber = oNForm.format(numValue);
        }
        // write the HTML into the render manager
        oRm.write("<div");
        oRm.addClass("sapUshellDynamicTile");
        oRm.writeClasses();
        oRm.write(">");

        // dynamic data
        oRm.write("<div");
        oRm.addClass("sapUshellDynamicTileData");
        oRm.addClass((oControl.getNumberState() ? "sapUshellDynamicTileData" + oControl.getNumberState() :
        "sapUshellDynamicTileData" + State.Neutral));
        oRm.writeClasses();
        oRm.write(">");

        //sapUshellDynamicTileIndication that includes Arrow and number factor
        oRm.write("<div class='sapUshellDynamicTileIndication'>");

        // state arrow

        if (oControl.getStateArrow()) {
            oRm.write("<div");
            oRm.addClass("sapUshellDynamicTileStateArrow");
            oRm.addClass("sapUshellDynamicTileData" + oControl.getStateArrow());
            oRm.writeClasses();
            oRm.write(">");
            oRm.write("</div>");
        }

        // unit
        oRm.write('<br><div'); //br was added in order to solve the issue of all the combination of presentation options between Number - Arrow - Unit
        oRm.addClass("sapUshellDynamicTileNumberFactor");
        oRm.writeClasses();
        oRm.writeAccessibilityState(oControl, {label : translationBundle.getText("TileUnits_lable") + numberFactor});
        oRm.write('>');
        oRm.writeEscaped(numberFactor);
        oRm.write('</div>');

        // closeing the sapUshellDynamicTileIndication scope
        oRm.write("</div>");
        //}

        oRm.write('<div');
        oRm.addClass("sapUshellDynamicTileNumber");
        oRm.writeClasses();
        if (displayNumber && displayNumber !== "") {
            oRm.writeAccessibilityState(oControl, {
                label : translationBundle.getText("TileValue_lable") + displayNumber
            });
            oRm.write('>');
            oRm.writeEscaped(displayNumber);
        } else {
            // in case numberValue is a String
            oRm.write('>');
            oRm.writeEscaped(oControl.getNumberValue());
        }
        oRm.write('</div>');

        // end of dynamic data
        oRm.write("</div>");

        // span element
        oRm.write("</div>");
    };

    DynamicTileRenderer._normalizeNumber = function (numValue, maxCharactersInDisplayNumber, numberFactor, oControl) {
        var number;
        if (isNaN(numValue)) {
            number = numValue;
        } else {
            var oNForm = NumberFormat.getFloatInstance({maxFractionDigits: oControl.getNumberDigits()});

            if (!numberFactor) {
                if (numValue >= 1000000000) {
                    numberFactor = 'B';
                    numValue /= 1000000000;
                } else if (numValue >= 1000000) {
                    numberFactor = 'M';
                    numValue /= 1000000;
                } else if (numValue >= 1000) {
                    numberFactor = 'K';
                    numValue /= 1000;
                }
            }
            number = oNForm.format(numValue);
        }

        var displayNumber = number;
        //we have to crop numbers to prevent overflow
        var cLastAllowedChar = displayNumber[maxCharactersInDisplayNumber - 1];
        //if last character is '.' or ',', we need to crop it also
        maxCharactersInDisplayNumber -= (cLastAllowedChar === '.' || cLastAllowedChar === ',') ? 1 : 0;
        displayNumber = displayNumber.substring(0, maxCharactersInDisplayNumber);

        return {
            displayNumber: displayNumber,
            numberFactor: numberFactor
        };
    };

    DynamicTileRenderer._shouldProcessDigits = function (sDisplayNumber, oControl) {
        var nDigitsToDisplay = oControl.getNumberDigits(), nNumberOfDigits;
        if (sDisplayNumber.indexOf('.') !== -1) {
            nNumberOfDigits = sDisplayNumber.split(".")[1].length;
            if (nNumberOfDigits > nDigitsToDisplay) {
                return true;
            }
        }
        return false;
    };

    DynamicTileRenderer.getInfoPrefix = function (oControl) {
        return oControl.getNumberUnit();
    };


	return DynamicTileRenderer;

}, /* bExport= */ true);
