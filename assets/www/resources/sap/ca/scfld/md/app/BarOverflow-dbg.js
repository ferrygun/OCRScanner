/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
sap.ui.define(['sap/ui/base/Object', "./BarOverflowLayoutData", "sap/ui/core/ResizeHandler"],
	function(fnUi5Object, fnBarOverflowLayoutData, fnResizeHandler) {
		"use strict";

		var BarOverflow = fnUi5Object.extend("sap.ca.scfld.md.app.BarOverflow", {

			constructor : function(oBar, oActionSheet, fnResized) {

				//Call base
				fnUi5Object.apply(this, arguments);

				//Init privates
				this._oBar = oBar;
				this._oActionSheet = oActionSheet;
				this._previousBarWidth = 0;
				this._bActionSheetGotCleared = false;
				this._bInitialized = false;
				this._fnResized = fnResized;

				//Event delegate to attach to the bar's rendering cycle
				this._oEventDelegate = {
					onAfterRendering : this._attachResize,
					onBeforeRendering : this._detachResize
				};

				//If the bar is already rendered, handle an initial sizechange
				if (oBar.getDomRef()) {
					this._handleSizeChange();
				}

				//attach to bar's rendering cycle
				oBar.addEventDelegate(this._oEventDelegate, this);

			},

			/**
			 * @internal Invalidates the BarOverflow, since the size of one of its contents has changed
			 */
			buttonTextChanged : function () {
				if (this._iTimeout) {
					return;
				}

				var that = this;

				this._iTimeout = setTimeout(function () {
					that._handleSizeChange(true);
					that._iTimeout = null;
				}, 0);
			},

			/**
			 * @private detaches the BarOverflow from the resize handler
			 */
			_detachResize : function () {
				if (this._sResizeListenerId === undefined) {
					return;
				}

				fnResizeHandler.deregister(this._sResizeListenerId);
				this._sResizeListenerId = undefined;
			},

			/**
			 * @private attaches the BarOverflow to the resize handler, using the bar's dom reference
			 */
			_attachResize : function () {
				// Bar is not rendered - no resize will take place
				if (!this._oBar.getDomRef()) {
					return;
				}

				// Already attached
				if (this._sResizeListenerId !== undefined) {
					return;
				}

				// handle the size change since this gets called after a rendering
				this._handleSizeChange();

				// attach to the resize handler to be informed about changes of the bar width
				this._sResizeListenerId = fnResizeHandler.register(this._oBar.getDomRef(), jQuery.proxy(this._handleSizeChange, this));
			},

			/**
			 * @private used to remember the positions of the content to keep the order of the buttons after moving them between action sheet and bar
			 */
			_initialize : function () {
				var aBarContent = this._oBar.getContentRight();
				this._bInitialized = true;

				this._oControlOrder = {};

				//First add all the buttons in the bar
				aBarContent.forEach(function (oControl, iIndex) {
					this._oControlOrder[oControl.sId] = {
						index : iIndex
					};
				}, this);

				//Then the buttons of the action sheet
				this._oActionSheet.getButtons().forEach(function (oControl, iIndex) {

					this._oControlOrder[oControl.sId] = {
						index : iIndex + aBarContent.length
					};

				}, this);
			},

			/**
			 * @private moves the content of the action sheet to the bar, and sorts the content afterwards
			 */
			_clearActionSheet : function () {
				this._bActionSheetGotCleared = true;
				if (this._fnResized) {
					this._fnResized();
				}
			},

			/**
			 * @private Calculate the width of the left area of the footer bar.
			 * @return {int}
			 *   The width of the left footer bar
			 */
			_calculateLeftWidth: function () {
				// TODO this accesses internal data of the Bar control
				var $LeftBar = this._oBar._$LeftBar,
					iWidth = 0,
					sLeftBarWidth;
				if ($LeftBar) {
					sLeftBarWidth = $LeftBar.css("width");
					$LeftBar.css({width: "", visibility: "hidden"});
					iWidth = $LeftBar.outerWidth(true);
					$LeftBar.css({width: sLeftBarWidth, visibility: ""});
				}
				return iWidth;
			},

			/**
			 * @private should be called after a rerendering/sizechange of the bar, will be called multiple times, because
			 * multiple rerenderings will be triggered by this function.
			 * Here is a rerendering cycle:
			 *
			 * 1 - render Bar (triggered by application or initial one)
			 * 2 - if action sheet has content - move all controls from the action sheet to the bar
			 * 3 - render Bar (only if step 2 applied)
			 * 4 - move all the controls that do not fit to the action sheet
			 * 5 - render Bar (only if step 4 moved something)
			 *
			 */
			_handleSizeChange : function (bContentChanged) {
				var iBarWidth = this._oBar.$().width() - this._calculateLeftWidth();

				//record the buttons index if it has not been done yet
				if (!this._bInitialized) {
					this._initialize();
				}

				// check if the bar's width is still the same and no text changed
				if (this._previousBarWidth === iBarWidth && !bContentChanged
						&& !this._bActionSheetGotCleared){
					//if the action sheet did not get cleared, we can stop processing here
					//since nothing changed
					return;
				}
				// there is actually a change of the bar or its content - clear the action sheet
				this._bActionSheetGotCleared = false;

				// If there is content in the action sheet, clear it
				if (this._oActionSheet.getButtons().length) {
					this._clearActionSheet();

					// We need to restore the original state - all buttons to the bar.
					// while doing this, bar will get invalidated so it will hit this function again.
					// we can not immediately continue moving buttons from A to B
					return;
				}

				// Remember the bar width, since we will move controls to the overflow now
				this._previousBarWidth = iBarWidth;

				// nothing to do if the bar is empty
				if (!this._oBar.getContentRight().length) {
					return;
				}

				// move the controls over to the action sheet
				this._moveControlsToOverflow(iBarWidth);
			},

			/**
			 * @private loops through the controls of the bar, retrieves their width and then calculates the resulting overflow in px.
			 * keeps track of layoutData and the width of the buttons.
			 */
			_calculateOverflowData : function (iBarWidth) {

				var iBarContentWidth = 0,
					oOverflowButtonInfo = null,
					aButtonInfos = [];

				this._oBar.getContentRight().forEach(function (oControl) {
					var bIsOverflowButton = false,
						//include the margins for the calculation, since the bar will add margins
						iWidthIncludingMargin = oControl.$().outerWidth(true),
						oButtonInfo = {
							stayInOverflow : false,
							isOverflowButton : bIsOverflowButton,
							moveToOverflow : true,
							control : oControl,
							width : iWidthIncludingMargin
						};

					//remember the layout data
					var oLayoutData = oControl.getLayoutData();
					if (oLayoutData instanceof fnBarOverflowLayoutData) {
						bIsOverflowButton = oLayoutData.getOverflowButton();
						oButtonInfo.stayInOverflow = oLayoutData.getStayInOverflow();
						oButtonInfo.isOverflowButton = bIsOverflowButton;

						if (!bIsOverflowButton) {
							oButtonInfo.moveToOverflow = oLayoutData.getMoveToOverflow();
						} else {
							// TODO avoid hard coded width (if button is hidden it does not have
							// a width)
							if (!iWidthIncludingMargin) {
								iWidthIncludingMargin = 48;
								oButtonInfo.width = iWidthIncludingMargin;
							}
							oOverflowButtonInfo = oButtonInfo;
							oButtonInfo.moveToOverflow = false;
						}
					}

					var sControlName = oControl.getMetadata().getName();

					if (sControlName !== "sap.m.Button" && sControlName !== "sap.m.Select") {
						//Only move buttons and selects to the overflow
						oButtonInfo.moveToOverflow = false;
					}

					//needed to move the buttons to the action sheet later
					aButtonInfos.push(oButtonInfo);

					//add the width of the control to the total width
					iBarContentWidth += iWidthIncludingMargin;

				}, this);

				//calculate the overflow
				var iOverflowInPx = iBarContentWidth - iBarWidth;

				return {
					buttonInfos : aButtonInfos,
					overflowInPx : iOverflowInPx,
					overflowButtonInfo : oOverflowButtonInfo
				};
			},

			/**
			 * @private moves the controls that do not fit to the bar to the actionsheet.
			 * It starts with the leftmost item and will take the layout data into account.
			 */
			_moveControlsToOverflow : function (iBarWidth) {

				var oOverflowData = this._calculateOverflowData(iBarWidth),
					aButtonInfos = oOverflowData.buttonInfos,
					iOverflowInPx = oOverflowData.overflowInPx,
					bHasButtonInActionSheet = false,
					oOverflowButtonInfo = oOverflowData.overflowButtonInfo,
					aStayInOverflowButtons = [],
					aButtonsToMove = [];

				// Move all the buttons that are forced to the overflow first.
				aButtonInfos = aButtonInfos.filter(function (oButtonInfo) {

					if (!oButtonInfo.stayInOverflow) {
						return true;
					}

					bHasButtonInActionSheet = true;
					iOverflowInPx -= oButtonInfo.width;
					aStayInOverflowButtons.push(oButtonInfo.control);

					return false;
				}, this);

				if (oOverflowButtonInfo) {
					if (!bHasButtonInActionSheet &&
							(iOverflowInPx - oOverflowButtonInfo.width <= 0)) {
						iOverflowInPx -= oOverflowButtonInfo.width;
					}

				}

				// Rightmost button should disappear first
				aButtonInfos.reverse();

				aButtonInfos.some(function (oButtonInfo) {
					// If there is no overflow there is no need to move a control
					var bHasNoOverflow = iOverflowInPx <= 0;

					if (bHasNoOverflow) {
						// will stop iterating after overflow got eliminated
						return bHasNoOverflow;
					}

					// here we are sure, the bar is overflowing or the control should stay in the overflow. - move it to the action sheet and reduce the overflow by the controls width
					if (oButtonInfo.moveToOverflow) {
						iOverflowInPx -= oButtonInfo.width;
						aButtonsToMove.push(oButtonInfo.control);
					}
				});

				// In the action sheet we need the original order again
				aButtonsToMove.reverse();

				// The buttons with stay in overflow come last
				aButtonsToMove = aButtonsToMove.concat(aStayInOverflowButtons);

				if (aButtonsToMove.length > 0) {
					if (this._fnResized) {
						this._fnResized(aButtonsToMove);
					}
				} else {
					// if there are no buttons to move to overflow close the action sheet if it
					// is open
					if (this._oActionSheet.isOpen()) {
						this._oActionSheet.close();
					}
				}
			},

			/**
			 * @public
			 * cleans up the events of the controls BarOverflow registered to.
			 */
			destroy : function () {

				// if bar overflow gets destroyed close action sheet if it is open
				if (this._oActionSheet.isOpen()) {
					this._oActionSheet.close();
				}

				//Call base
				fnUi5Object.apply(this, arguments);

				this._oBar.removeEventDelegate(this._oEventDelegate, this);
				this._detachResize();
			}
		});


		return BarOverflow;

}, /* bExport= */ true);
