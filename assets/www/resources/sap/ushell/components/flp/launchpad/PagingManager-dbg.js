// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define(["sap/ui/base/EventProvider"], function(EventProvider) {
	"use strict";

    /*global jQuery, sap, document, setTimeout, window */
    /*jslint plusplus: true, nomen: true, bitwise: true */

    var PagingManager = EventProvider.extend("sap.ushell.components.flp.launchpad.PagingManager", {
        metadata : {
            publicMethods : ["setElementClass", "setContainerSize", "getNumberOfAllocatedElements", "moveToNextPage", "getTileHeight"]
        },
        constructor : function (sId, mSettings) {
            //make this class only available once
//            if (sap.ushell.components.flp.launchpad.getPagingManager && sap.ushell.components.flp.launchpad.getPagingManager()) {
//                return sap.ushell.components.flp.launchpad.getPagingManager();
//            }
            sap.ushell.components.flp.launchpad.getPagingManager = jQuery.sap.getter(this.getInterface());
            this.currentPageIndex = 0;
            this.containerHeight = mSettings.containerHeight || 0;
            this.containerWidth = mSettings.containerWidth || 0;
            this.supportedElements = mSettings.supportedElements || "";
            this.tileHeight = 0;
        },
        getTileHeight : function () {
            return this.tileHeight;
        },
        setElementClass : function (sClassName) {
            this.supportedElements = sClassName;
        },

        setContainerSize : function (nHeight, nWidth) {
            var totalNumberAllocatedTiles = this.getNumberOfAllocatedElements();
            this.containerHeight = nHeight;
            this.containerWidth = nWidth;
            this._changePageSize(totalNumberAllocatedTiles);
        },

        getNumberOfAllocatedElements : function () {
            return this._calcElementsPerPage() * this.currentPageIndex;
        },

        _changePageSize: function (totlaNumberAllocateedTiles) {
            this.currentPageIndex = Math.ceil(totlaNumberAllocateedTiles / this._calcElementsPerPage());
        },

        moveToNextPage : function () {
            this.currentPageIndex++;
        },

        getSizeofSupportedElementInUnits : function (tileType) {
            return this.supportedElements[tileType].sizeInBaseUnits;
        },

        _calcElementMatrix: function (className) {
            var oElement = jQuery("<div>").addClass(className);
            jQuery('body').append(oElement);
            var elementHeight = oElement.height();
            var elementWidth = oElement.width();

            if (elementHeight < 20 || elementWidth < 40) {
                elementWidth = 40;
                elementHeight = 20;
            }

            oElement.remove();

            return {width: elementWidth, height: elementHeight};
        },

        _calcElementsPerPage : function () {
            var supportedElementKey, baseUnitSize, supportedElement, matrix, supportedElement, mat, elementsPerColumn, elementsPerRow;

            for (supportedElementKey in this.supportedElements) {
                supportedElement = this.supportedElements[supportedElementKey];
                matrix = this._calcElementMatrix(supportedElement.className);
                supportedElement.matrix = matrix;
                if (baseUnitSize) {
                    baseUnitSize.width = baseUnitSize.width > matrix.width ? matrix.width : baseUnitSize.width;
                    baseUnitSize.height = baseUnitSize.height > matrix.height ? matrix.height : baseUnitSize.height;
                } else {
                    baseUnitSize = {width: matrix.width, height: matrix.height};
                }
            }

            //calculate sizeofSupportedelEmentInUnits
            for (supportedElementKey in this.supportedElements) {
                supportedElement = this.supportedElements[supportedElementKey];
                mat = supportedElement.matrix;
                supportedElement.sizeInBaseUnits = Math.round(mat.width / baseUnitSize.width * mat.height / baseUnitSize.height);
            }

            //calc number of units can feet in a page.
            elementsPerColumn =  Math.round(this.containerWidth / baseUnitSize.width);
            elementsPerRow =  Math.round(this.containerHeight / baseUnitSize.height);


            if (!elementsPerRow || !elementsPerColumn || elementsPerColumn === Infinity || elementsPerRow === Infinity || elementsPerColumn === 0 || elementsPerRow === 0) {
                return 10;
            }
            return elementsPerRow * elementsPerColumn;
        }
    });


	return PagingManager;

});
