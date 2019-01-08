/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides control sap.viz.ui5.controls.VizRangeSlider.
sap.ui.define([
'sap/viz/library',
'sap/m/RangeSlider'
	], 
	function(library,
	RangeSlider) {
	"use strict";

	var VizRangeSlider = RangeSlider.extend("sap.viz.ui5.controls.VizRangeSlider", {
        metadata: {
            library: "sap.viz",
            properties: {
               left: {type: "string", group: "Data", defaultValue: "0px"},
               top:  {type: "string", group: "Data", defaultValue: "0px"},
               height:{type: "string", group: "Data", defaultValue: "0px"},
               showPercentageLabel: {type : "boolean", group : "Appearance", defaultValue:"true"},
               showStartEndLabel: {type : "boolean", group : "Appearance", defaultValue:"true"}
            }
        } });

    VizRangeSlider.prototype._recalculateRange = function(){
		RangeSlider.prototype._recalculateRange.apply(this, arguments);
		var lDom = this.getDomRef("leftMock");
		var rDom = this.getDomRef("rightMock");
		var bDom = this.getDomRef("label");
		var aRange = this.getRange();
		var minVal = Math.min(aRange[0], aRange[1]);
		var maxVal = Math.max(aRange[0], aRange[1]);
		
        lDom.style.right = (this.getMax() - minVal ) / (this.getMax() - this.getMin()) * 100 + "%";
		rDom.style.left = (maxVal -  this.getMin()) / (this.getMax() - this.getMin()) * 100 + "%";
		bDom.style.left = (maxVal + minVal) / (this.getMax() - this.getMin()) * 50 + "%";
		bDom.innerHTML = ((maxVal - minVal) / (this.getMax() - this.getMin()) * 100).toFixed(0) + "%";
		return this;
	};

    VizRangeSlider.prototype._ontouchmove = function (fInitialPointerPosition, aInitialRange, aHandles, handleWidth, oEvent) {
        var fOffset, bRangesEquality, bRangeInBoudaries, bRangeOnBoudaries,
            iPageX = oEvent.targetTouches ? oEvent.targetTouches[0].pageX : oEvent.pageX,
            fMax = this.getMax(),
            fMin = this.getMin(),
            aRange = [],
            aRangeTemp = [];

        // note: prevent native document scrolling
        oEvent.preventDefault();
        // mark the event for components that needs to know if the event was handled
        oEvent.setMarked();

        // suppress the emulated mouse event from touch interfaces
        if (oEvent.isMarked("delayedMouseEvent") || !this.getEnabled() ||

            // detect which mouse button caused the event and only process the standard click
            // (this is usually the left button, oEvent.button === 0 for standard click)
            // note: if the current event is a touch event oEvent.button property will be not defined
            oEvent.button) {

            return;
        }

        //calculation of the new range based on the mouse position
        fOffset = this._calculateHandlePosition(iPageX, handleWidth) - fInitialPointerPosition;
        for (var i = 0; i < aInitialRange.length; i++) {
            aRange[i] = aInitialRange[i] + fOffset;
        }

        aRangeTemp = this._getNormalizedRange(this.getRange(), aInitialRange, aHandles);
        //check if the current range is equal to the new one
        bRangesEquality = aRange.every(function (fValue, iIndex) {return fValue === aRangeTemp[iIndex];});
        bRangeInBoudaries = aRange.every(function (fValue) {return (fValue >= fMin && fValue <= fMax );});
        bRangeOnBoudaries = aRangeTemp.indexOf(fMin) > -1 || aRangeTemp.indexOf(fMax) > -1;
        if (!bRangesEquality) {
            //check the need to update the handle depending of number of the selected handles and the handles position
            
            if ((aHandles.length === 1) || bRangeInBoudaries || !bRangeOnBoudaries) {
                if (aHandles.length === 1) {
                    this._positionCheck(aHandles, fOffset, aInitialRange);
                } else{
                    aHandles.map(function (oHandle) {this._updateHandle(oHandle, aInitialRange[this._getIndexOfHandle(oHandle)] + fOffset);}, this);
                }
            }
            this._adjustTooltipsContainer();
            aRangeTemp = this._getNormalizedRange(this.getRange(), aInitialRange, aHandles);
        }
        this.setRange(aRangeTemp);
    };

    // check relative positions of handles to prevent overlapping
    VizRangeSlider.prototype._positionCheck = function (aHandles, fOffset, aInitialRange) {
        var iIndex = this._getIndexOfHandle(aHandles[0]);
        var aRange = this.getRange();
        var aPosition = aInitialRange[iIndex] + fOffset;
        var temp = [];
        for (var i = 0; i < aRange.length; i++) {
            temp[i] = aRange[i];
        }
        temp[iIndex] = aPosition;
        if (temp[0] >= temp[1] - 1) {
            aPosition = aRange[1 - iIndex] + ((iIndex === 1)?1:-1);
        }
        this._updateHandle(aHandles[0], aPosition);
    };

    VizRangeSlider.prototype.ontouchstart = function (oEvent) {
            var oTouch = oEvent.targetTouches[0],
                CSS_CLASS = this.getRenderer().CSS_CLASS,
                sEventNamespace = "." + CSS_CLASS,
                fValue, aHandles, aRange, iHandleIndex, fHandlesDistance, oFocusItem;

            if (!this.getEnabled()) {
                return;
            }

            // mark the event for components that needs to know if the event was handled
            oEvent.setMarked();
            // Should be prevent as in Safari while dragging the handle everything else gets selection.
            // As part of the RangeSlider, Inputs in the tooltips should be excluded
            if (oEvent.target.className.indexOf("sapMInput") === -1) {
                oEvent.preventDefault();
            }

            // we need to recalculate the styles since something may have changed
            // the screen size between touches.
            this._recalculateStyles();

            if (["number", "text"].indexOf(oEvent.target.type) > -1) {
                return;
            }

            fValue = this._calculateHandlePosition(oTouch.pageX);
            aRange = this.getRange();
            aHandles = [this._mHandleTooltip.start.handle, this._mHandleTooltip.end.handle];
            iHandleIndex = this._getIndexOfHandle(oEvent.target);
            fHandlesDistance = aHandles.reduce(function (fAccumulation, oHandle) {
                return Math.abs(fAccumulation - oHandle.offsetLeft);
            }, 0);
            /*
            // if the click is outside the range or distance between handles is below the threshold - update the closest slider handle
            if (fValue < Math.min.apply(Math, aRange) || fValue > Math.max.apply(Math, aRange)) {
                aHandles = [this.getClosestHandleDomRef(oTouch)];
                this._updateHandle(aHandles[0], fValue);
                // _updateHandle would update the range and the check for change event fire would fail in _ontouchend
                this._fireChangeAndLiveChange({range: this.getRange()});
            } else if (iHandleIndex !== -1) { // Determine if the press event is on certain handle
                aHandles = [this.getDomRef(iHandleIndex === 0 ? "handle1" : "handle2")];
            }
            */
            var handleWidth = 0;
            if (iHandleIndex !== -1) { // Determine if the press event is on certain handle
                aHandles = [this.getDomRef(iHandleIndex === 0 ? "handle1" : "handle2")];
                handleWidth = fValue - aRange[iHandleIndex];
            } else if (fValue < Math.min.apply(Math, aRange) || fValue > Math.max.apply(Math, aRange)) {
                aHandles = [fValue < Math.min.apply(Math, aRange)?this._mHandleTooltip.start.handle:this._mHandleTooltip.end.handle];
                this._updateHandle(aHandles[0], fValue);
                // _updateHandle would update the range and the check for change event fire would fail in _ontouchend
                this._fireChangeAndLiveChange({range: this.getRange()});
            }
            // registers event listeners
            jQuery(document)
                .on("touchend" + sEventNamespace + " touchcancel" + sEventNamespace + " mouseup" + sEventNamespace,
                    this._ontouchend.bind(this, aHandles))
                .on("touchmove" + sEventNamespace + (oEvent.originalEvent.type !== "touchstart" ? " mousemove" + sEventNamespace : ""),
                    this._ontouchmove.bind(this, fValue, this.getRange(), aHandles, handleWidth));

            // adds pressed state
            aHandles.map(function (oHandle) {
                if (oHandle.className.indexOf(CSS_CLASS + "HandlePressed") === -1) {
                    oHandle.className += " " + CSS_CLASS + "HandlePressed";
                }
            });

            oFocusItem = aHandles.length === 1 ? aHandles[0] : this.getDomRef("progress");
            jQuery.sap.delayedCall(0, oFocusItem, "focus");
        };

        VizRangeSlider.prototype.setParentFrame = function(vizFrame) {
            this._parentFrame = vizFrame;
        };
        VizRangeSlider.prototype._adjustRangeValue = function (fValue, fHandleWidth) {
            var fMax = this.getMax(),
                fMin = this.getMin(),
                fStep = this.getStep(),
                handleWidth = fHandleWidth || 0,
                fModStepVal;

            if (this._bInitialRangeChecks) {
                return fValue;
            }

            fModStepVal = Math.abs((fValue - fMin) % fStep);
            if (fModStepVal !== 0 /* division with remainder */) {
                // snap the new value to the nearest step
                fValue = fModStepVal * 2 >= fStep ? fValue + fStep - fModStepVal : fValue - fModStepVal;
            }
            var minOffset = handleWidth < 0 ? handleWidth : 0;
            var maxOffset = handleWidth > 0 ? handleWidth : 0;
            if (fValue < fMin + minOffset) {
                fValue = fMin + minOffset;
            } else if (fValue > fMax + maxOffset) {
                fValue = fMax + maxOffset;
            }

            return fValue;
        };       
        VizRangeSlider.prototype._calculateHandlePosition = function (fValue, fHandleWidth) {
            var fMax = this.getMax(),
                fMin = this.getMin(),
                handleWidth = fHandleWidth || 0,
                fNewValue;

            fNewValue = ((fValue - this._fSliderPaddingLeft - this._fSliderOffsetLeft) / this._fSliderWidth) * (fMax - fMin) + fMin;

            // RTL mirror
            if (this._bRTL) {
                fNewValue = this._convertValueToRtlMode(fNewValue);
            }
            return this._adjustRangeValue(fNewValue, handleWidth);
        };

        /* ----------------------------------------------------------- */
        /* Keyboard handling                                           */
        /* ----------------------------------------------------------- */


        /**
         * Moves handle / entire slider by specified offset
         *
         * @param {float} fOffset Default value: 1. Increase or decrease value by provided offset
         * @param {HTMLElement} oHandle DOM reference to the handle
         * @private
         */
        VizRangeSlider.prototype._updateSliderValues = function (fOffset, oHandle) {
            var aRange = this.getRange(),
                fMax = this.getMax(),
                fMin = this.getMin(),
                fRangeMax = Math.max.apply(null, aRange),
                fRangeMin = Math.min.apply(null, aRange),
                iIndex = this._getIndexOfHandle(oHandle),
                iOffsetSign = fOffset < 0 ? -1 : 1,
                aHandles = iIndex > -1 ? [oHandle] : [this._mHandleTooltip.start.handle, this._mHandleTooltip.end.handle];

            // If this is a single handle, both values should be equal
            if (aHandles.length === 1) {
                // Check and prevent overlapping and position switching between handles
                if ((fRangeMax - fRangeMin <= 1) && ((iIndex === 1 && iOffsetSign === -1)||(iIndex === 0 && iOffsetSign === 1))) {
                    return ;
                }
                fRangeMin = fRangeMax = aRange[iIndex];
            }
            // Check the boundaries and recalculate the offset if exceeding
            if (fRangeMax + fOffset > fMax) {
                fOffset = iOffsetSign * (Math.abs(fMax) - Math.abs(fRangeMax));
            } else if (fRangeMin + fOffset < fMin) {
                fOffset = iOffsetSign * (Math.abs(fRangeMin) - Math.abs(fMin));
            }
            aHandles.map(function (oCurHandle) {
                this._updateHandle(oCurHandle, aRange[this._getIndexOfHandle(oCurHandle)] + fOffset);
            }, this);
        };

        //Defines object which contains constants used by the control.
        VizRangeSlider.CHARACTER_WIDTH_PX = 12;
        /**
         * Updates the handle's tooltip value
         * @param {Object} oTooltip The tooltip object.
         * @param {float} fNewValue The new value
         * @private
         */
        VizRangeSlider.prototype._updateTooltipContent = function (oTooltip, fNewValue) {
     
            var range = this.getRange();
            var max = Math.max(range[0], range[1]);
            var min = Math.min(range[0], range[1]);
            max = (max>this.getMax())?this.getMax():max;
            min = (min<this.getMin())?this.getMin():min;
            var start = this._mHandleTooltip.start.tooltip;
            var position = (oTooltip === start)?"start":"end";
            if(min === max) {
                if(min === 0) {max++;}
                if(min === 100) {min--;}
            }
            var content = this._parentFrame._getDataRange(min, max).displayValues[position];
            //set content
            oTooltip.text(content);
            // calculate and reset width
            var leftDom = this.getDomRef('LeftTooltip');
            var rightDom = this.getDomRef('RightTooltip');
            var newLength = Math.max(leftDom.innerHTML.length, rightDom.innerHTML.length);
            newLength = newLength * VizRangeSlider.CHARACTER_WIDTH_PX;
            this._iLongestRangeTextWidth = newLength;
            //left and right have the same width
            leftDom.style.width = this._iLongestRangeTextWidth+"px";
            rightDom.style.width = this._iLongestRangeTextWidth+"px";
            //recalculate tooltip min
            this._recalculateStyles();
            this.$("TooltipsContainer").css("min-width", (this._fTooltipHalfWidthPercent * 4) + "%");
        };
        VizRangeSlider.prototype._adjustTooltipsContainer = function () {
            var iCorrection,
                oTooltipsContainer = this.getDomRef("TooltipsContainer"),
                sAdjustPropertyStart = this._bRTL ? "right" : "left",
                sAdjustPropertyEnd = this._bRTL ? "left" : "right",
                aRange = this.getRange(),
                fStartPct = this._getPercentOfValue(aRange[0] > aRange[1] ? aRange[1] : aRange[0]),
                fEndPct = this._getPercentOfValue(aRange[0] > aRange[1] ? aRange[0] : aRange[1]),
                fTooltipMinPosition =  this._fHandleWidthPercent / 2,
                floatWidth = (fEndPct - fStartPct)/2 > this._fTooltipHalfWidthPercent?
                this._fTooltipHalfWidthPercent:(fEndPct - fStartPct)/2,
                fTooltipMaxPosition =  Math.floor(100 - 2 * this._fTooltipHalfWidthPercent - floatWidth + this._fHandleWidthPercent),
                fCalculatedStartPosition = parseFloat(oTooltipsContainer.style[sAdjustPropertyStart]),
                fCalculatedEndPosition = parseFloat(oTooltipsContainer.style[sAdjustPropertyEnd]);

            //Start Tooltip
            if (fStartPct - this._fTooltipHalfWidthPercent <= fTooltipMinPosition) {
                //below the min tooltip position
                fCalculatedStartPosition = -1 * this._fHandleWidthPercent;
            } else if (fStartPct >= fTooltipMaxPosition) {
                //above the max tooltip position
                fCalculatedStartPosition = 100 - 4 * this._fTooltipHalfWidthPercent + this._fHandleWidthPercent;
            //the tooltip position is between min and max tooltip position
            } else if ((fEndPct - fStartPct > this._fTooltipHalfWidthPercent * 2) && (fStartPct > -1 * this._fTooltipHalfWidthPercent)) {
                //the both tooltips are not adjoined
                fCalculatedStartPosition = fStartPct - this._fTooltipHalfWidthPercent;
            } else {
                //the both tooltips are adjoined
                iCorrection = fStartPct - this._fTooltipHalfWidthPercent - (this._fTooltipHalfWidthPercent * 2 - (fEndPct - fStartPct)) / 2;
                if (iCorrection <= -1 * this._fHandleWidthPercent) {
                    fCalculatedStartPosition = -1 * this._fHandleWidthPercent;
                } else {
                    fCalculatedStartPosition = iCorrection;
                }
            }

            //End Tooltip
            if (fEndPct >= (100 - fTooltipMinPosition) || (100 - fEndPct - this._fTooltipHalfWidthPercent) < -this._fHandleWidthPercent) {
                fCalculatedEndPosition = -1 * this._fHandleWidthPercent;
            } else {
                fCalculatedEndPosition = 100 - fEndPct - this._fTooltipHalfWidthPercent;
            }

            oTooltipsContainer.style[sAdjustPropertyStart] = fCalculatedStartPosition + "%";
            oTooltipsContainer.style[sAdjustPropertyEnd] = fCalculatedEndPosition + "%";

            this._swapTooltips(aRange);
        };

        // Add hover class to progress when rangeslider is focused
        VizRangeSlider.prototype.onfocusin = function(oEvent) {
            RangeSlider.prototype.onfocusin.apply(this, arguments);
            this.$("progress").addClass("hover");
        };

        VizRangeSlider.prototype.onfocusout = function(oEvent) {
            RangeSlider.prototype.onfocusout.apply(this, arguments);
            this.$("progress").removeClass("hover");            
        };

	return VizRangeSlider;

}, true);
