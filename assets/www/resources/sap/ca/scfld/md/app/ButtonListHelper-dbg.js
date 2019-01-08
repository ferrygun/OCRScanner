/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.scfld.md.app.ButtonListHelper");
jQuery.sap.require("sap.ca.ui.dialog.Dialog");
jQuery.sap.require("sap.ca.scfld.md.app.BarOverflow");
jQuery.sap.require("sap.ca.scfld.md.app.BarOverflowLayoutData");
jQuery.sap.require("sap.m.ButtonType");

(function () {
	var DEBUG = jQuery.sap.log.isLoggable(jQuery.sap.log.Level.DEBUG),
		CLASSNAME = "sap.ca.scfld.md.app.ButtonListHelper";

	/**
	 * Iterate over the array of controls (this.aButtons) and search the given button/select.
	 * @param {array} aControlObjects
	 *    Array of control objects as defined internally in ButtonListHelper.
	 * @param {sap.ui.core.Control} oControl
	 *    Control which is searched within given control objects array.
	 * @returns {oObject}
	 *    the internal representation of the control as stored in aButtons array of
	 *    ButtonListHelper.
	 */
	function findControlObject(aControlObjects, oControl) {
		var i, oObject;
		for (i = aControlObjects.length - 1; i >= 0; i -= 1) {
			oObject = aControlObjects[i];
			if (oObject.oButton === oControl || oObject.oSelect === oControl) {
				return oObject;
			}
		}
		return null;
	}

	/**
	 * Searches in the given control array if it contains an element matching the given control
	 * info.
	 *
	 * @param {object} aControls
	 *   An array of controls in which the element is searched.
	 * @param {object} oControlInfo
	 *   The control info of the element to search for
	 * @returns {sap.ui.core.Control}
	 *   The matching control out of the given list
	 */
	function findMatchingElement(aControls, oControlInfo) {
		var oControl, i, max,
			sId = oControlInfo.id,
			bIsButton,
			sText,
			sTooltip;

		for (i = 0, max = aControls.length; i < max; i++) {
			oControl = aControls[i];
			if (sId === oControl.getId()) {
				return oControl;
			}
			// icon does not change when moving between footer and overflow
			if (oControlInfo.icon === oControl.getIcon()) {
				bIsButton = oControl.getMetadata().getName() === "sap.m.Button";
				sTooltip = oControl.getTooltip() || oControl._sTooltip
					|| (bIsButton ? oControl.getText() : undefined);
				sText = bIsButton
					? oControl.getText() || oControl._sTextInActionSheet
					: oControlInfo.text; // selects do not have any text
				if (oControlInfo.tooltip === sTooltip && oControlInfo.text === sText) {
					return oControl;
				}
			}
		}
	}

	/**
	 * Find the element with a given ID in the given controls array and return information about
	 * the area, position and the control itself.
	 *
	 * @param {string} sFocusedId
	 *   The control ID of the focused element which needs to be searched in the given controls
	 *   array
	 * @param {sap.ui.core.Control[]} aControls
	 *   An array of controls in which to search the element with the given ID
	 * @param {string} sArea
	 *   The name of the area
	 * @returns {object}
	 *   An object containing information about the focused element or undefined if no element is
	 *   found.
	 *   The resulting object has following structure { area : string, pos : number, controlInfo :
	 *   { icon : string, id : string, tooltip : string, text : string } }
	 */
	function getFocusInfoForId(sFocusedId, aControls, sArea) {
		var oControl, i, bIsButton, max;

		for (i = 0, max = aControls.length; i < max; i++) {
			oControl = aControls[i];
			if (oControl.getId() === sFocusedId) {
				bIsButton = oControl.getMetadata().getName() === "sap.m.Button";
				return {
					area : sArea,
					pos : i,
					controlInfo : {
						icon : oControl.getIcon(),
						id : oControl.getId(),
						text : (bIsButton ? oControl.getText() : "")
							|| oControl._sTextInActionSheet,
						tooltip : oControl.getTooltip() || oControl._sTooltip
							|| (bIsButton ? oControl.getText() : "")
					}
				};
			}
		}
	}

	/**
	 * Search the overflow button in given control array.
	 *
	 * @param {sap.ui.core.Control[]} aControls
	 *    The entries are of type sap.ui.core.Control
	 * @returns {number}
	 *    the index of the overflow button within the array of given controls or undefined if not
	 *    found.
	 *
	 */
	function getIndexOfOverflow(aControls) {
		var i, oButton, oLayoutData;
		for (i = aControls.length - 1; i >= 0; i -= 1) {
			oButton = aControls[i];
			oLayoutData = oButton.getLayoutData();
			if (oLayoutData instanceof sap.ca.scfld.md.app.BarOverflowLayoutData
					&& oLayoutData.getOverflowButton()) {
				return i;
			}
		}
	}

	/**
	 * Find next visible control in given controls array starting with given position.
	 * If there are no visible elements after given position search backwards.
	 *
	 * @param {sap.ui.core.Control[]} aControls
	 *    The list of controls; must not be undefined
	 * @param {number} iStart
	 *    The start index
	 * @returns {sap.ui.core.Control}
	 *    The closest visible control or undefined if no control found
	 */
	function getNextVisibleElement(aControls, iStart) {
		var i = iStart, iMax = aControls.length, oResult;
		while (i < iMax) {
			oResult = aControls[i];
			if (oResult.getVisible()) {
				return oResult;
			}
			i++;
		}
		// no element found search backwards
		i = iStart - 1;
		while (i >= 0) {
			oResult = aControls[i];
			if (oResult.getVisible()) {
				return oResult;
			}
			i--;
		}
		return undefined;
	}

	/**
	 * Get text from resource bundle or from given button meta data.
	 *
	 * @param {object} oBtnMeta
	 *   Button metadata; oBtnMeta.sI18nBtnTxt or oBtnMeta.sBtnTxt are used to determine the text.
	 */
	function getText(oBtnMeta, oApplicationImplementation) {
		var sText;
		if (oBtnMeta.sI18nBtnTxt) {
			var oBundle = oApplicationImplementation.AppI18nModel.getResourceBundle();
			sText = oBundle.getText(oBtnMeta.sI18nBtnTxt);
		} else {
			sText = oBtnMeta.sBtnTxt;
		}
		return sText;
	}

	/**
	 * After resize controls need to be moved from bar to overflow or back.
	 * @param {sap.ui.core.Control[]} aControls
	 *    The entries are of type sap.ui.core.Control
	 *    If array is undefined all controls from overflow will be added to the bar again.
	 *    If array contains entries these entries will be moved from bar to overflow.
	 */
	function resized(aControls) {
		var oBar = this.oBar,
			bAddedToActionSheet = false,
			oActionSheet = this.oOverflowList.oActionSheet,
			aButtons, i, oControlObject, iIndexOfOverflow, oControl;

		if (aControls === undefined) {
			// move all to bar
			aButtons = oActionSheet.getButtons();
			iIndexOfOverflow = getIndexOfOverflow(this.oBar.getContentRight());
			for (i = 0; i < aButtons.length; i += 1) {
				oControlObject = findControlObject(this.aButtons, aButtons[i]);
				if (oControlObject.oSelect) {
					oControl = oControlObject.oSelect;
					oControl.setVisible(true);
					if (oControlObject.oButton) {
						oControlObject.oButton.setVisible(false);
					}
					// remove button
					oActionSheet.removeButton(aButtons[i]);
				} else {
					oControl = oControlObject.oButton;
					// adjust representation text, tooltip and style might be different
					if (oControl._sTextInBar !== undefined) {
						oControl.setText(oControl._sTextInBar);
					}
					if (oControl._sTypeInBar !== undefined) {
						oControl.setType(oControl._sTypeInBar);
					}
					if (oControl._sTooltip !== undefined) {
						oControl.setTooltip(oControl._sTooltip);
					}
				}
				oBar.insertContentRight(oControl,iIndexOfOverflow);
				iIndexOfOverflow++;
			}
			// finally make overflow button invisible
			oBar.getContentRight()[iIndexOfOverflow].setVisible(false);

			//TODO: remove me when UI5 fixes a bug that popup does not clear the domref if it was opened once and then is closed
			if (oActionSheet.isOpen()) {
				oActionSheet.attachEventOnce("afterClose", function () {
					oActionSheet.$().remove();
				});
			} else {
				oActionSheet.$().remove();
			}

		} else {
			// move given controls to overflow
			aControls.forEach(function (oControl) {
				oControlObject = findControlObject(this.aButtons, oControl);
				if (!oControlObject) {
					jQuery.sap.log.error("Unsupported control - " + oControl.toString());
				}
				if (oControlObject.oSelect) {
					// remove the select control from the bar
					oBar.removeContentRight(oControlObject.oSelect);
				}
				if (oControlObject.oButton) {
					oControl = oControlObject.oButton;
					// adjust representation text, tooltip and style might be different
					if (oControl._sTextInActionSheet !== undefined) {
						oControl.setText(oControl._sTextInActionSheet);
						if (oControl._sTextInActionSheet === oControl._sTooltip) {
							oControl.setTooltip("");
						}
					}
					if (oControl._sTypeInActionSheet !== undefined) {
						oControl.setType(oControl._sTypeInActionSheet);
					}
					oControl.setVisible(true);
					if (oControlObject.oSelect) {
						oControlObject.oSelect.setVisible(false);
					}
					oActionSheet.addButton(oControl);
					bAddedToActionSheet = true;
				} else {
					jQuery.sap.log.error("No button representation for control - "
						+ oControl.toString());
				}
			}, this);
			// if at least one element has been added to action sheet make overflow button visible
			if (bAddedToActionSheet) {
				oBar.getContentRight()[getIndexOfOverflow(this.oBar.getContentRight())]
					.setVisible(true);
			}
		}

	}

sap.ui.base.Object.extend("sap.ca.scfld.md.app.ButtonListHelper", {

	constructor : function (oApplicationImplementation, iMode, bAllDisabled, bAutomaticOverflow,
			sOverflowId) {
		this.oApplicationImplementation = oApplicationImplementation;
		this.bAutomaticOverflow = bAutomaticOverflow;
		this.sOverflowId = sOverflowId;
		this.oOverflowButton = undefined; // create button lazy
		this.iMode = iMode;
		if (this.iMode == 20) {
			this.oBar = new sap.m.Bar();
		} else if (this.iMode >= 10) {
			this.oActionSheet = new sap.m.ActionSheet();
			this.oActionSheet.setPlacement(sap.m.PlacementType.Top);
			this.oActionSheet.setShowCancelButton(true);
		}
		this.aButtons = [];
		this.bAllDisabled = bAllDisabled;
		this.startBuild();
		if (this.iMode == 25) {
			this.sDirection = "Left";
		} else {
			this.sDirection = "Right";
		}
		this.mSelections = {};
	},

	addButtonListHelper : function (oButtonListHelper) {
		if (this.oChild) {
			this.oChild.addButtonListHelper(oButtonListHelper);
		} else {
			this.oChild = oButtonListHelper;
			oButtonListHelper.bAllDisabled = this.bAllDisabled;
			delete oButtonListHelper.oModifications;
		}
	},

	/**
	 * Find the control fitting to the given focus information.
	 *
	 * @param {object} oFocusInfo
	 *   The information about the last focused element which has following structure
	 *   { area : string, pos : number, controlInfo :
	 *   { icon : string, id : string, tooltip : string, text : string } }
	 * @returns {sap.ui.core.Control} The control which best matches the given focus information;
	 *   might be undefined if no element could be found. If last focused element has been removed
	 *   take the closest control if possible.
	 */
	findFocusedElement : function (oFocusInfo) {
		var aControls, oElementToFocus;

		if (!oFocusInfo) { // no focus -> noting to do
			return undefined;
		}

		if (oFocusInfo.area === "left") {
			aControls = this.oBar && this.oBar.getContentLeft() || [];
			oElementToFocus = findMatchingElement(aControls, oFocusInfo.controlInfo);
		} else if (oFocusInfo.area === "right") {
			aControls = this.oBar && this.oBar.getContentRight() || [];
			oElementToFocus = findMatchingElement(aControls, oFocusInfo.controlInfo);
		} else if (oFocusInfo.area === "overflow") {
			// first search in right, if button has been moved to the footer
			aControls = this.oBar && this.oBar.getContentRight() || [];
			oElementToFocus = findMatchingElement(aControls, oFocusInfo.controlInfo);
			if (!oElementToFocus && this.oOverflowList && this.oOverflowList.oActionSheet) {
				// try overflow area
				oElementToFocus = findMatchingElement(
					this.oOverflowList.oActionSheet.getButtons() || [],
					oFocusInfo.controlInfo);
			}
		}
		if (oElementToFocus) {
			return oElementToFocus;
		}
		// element not found -> select the element next to the "lost" element
		if (aControls.length > 0) {
			oElementToFocus = getNextVisibleElement(aControls,
				Math.min(oFocusInfo.pos, aControls.length - 1));
			if (oElementToFocus) {
				return oElementToFocus;
			}
		}
		// there is no element left in the current are; select nearest element in the other area
		if (oFocusInfo.area === "left") {
			aControls = this.oBar && this.oBar.getContentRight() || [];
			return getNextVisibleElement(aControls, 0);
		} else {
			aControls = this.oBar && this.oBar.getContentLeft() || [];
			return  getNextVisibleElement(aControls, Math.max(0, aControls.length - 1));
		}
	},

	/**
	 * If focused element is part of this button list return information about the area, the
	 * position and some control attributes of the focused element.
	 *
	 * @param {object} [oShareSheet]
	 *   An optional 'sap.m.ActionSheet' in which the focused element is also searched
	 * @returns {object}
	 *   An object containing information about the focused element or undefined if no element is
	 *   found.
	 *   The resulting object has following structure { area : string, pos : number, controlInfo :
	 *   { icon : string, id : string, tooltip : string, text : string } }
	 */
	getFocusInfo : function (oShareSheet) {
		var oBar = this.oBar,
			sFocusedId = sap.ui.getCore().getCurrentFocusedControlId(),
			oFocusInfo;

		if (this._focusInfo) {
			oFocusInfo = this._focusInfo;
			this._focusInfo = undefined;
			return oFocusInfo;
		}

		if (!sFocusedId) {
			return undefined; // no focused element
		}

		if (this.oOverflowList) {
			oFocusInfo = this.oOverflowList.getFocusInfo();
			if (oFocusInfo) {
				oFocusInfo.area = "overflow"; // overwrite area
				return oFocusInfo;
			}
		}

		return oBar && getFocusInfoForId(sFocusedId, oBar.getContentLeft() || [], "left")
			|| oBar && getFocusInfoForId(sFocusedId, oBar.getContentRight() || [], "right")
			|| oShareSheet && getFocusInfoForId(sFocusedId, oShareSheet.getButtons() || [], "share")
			|| this.oActionSheet && getFocusInfoForId(sFocusedId, this.oActionSheet.getButtons() || [], "action")
			|| this.oClient && this.oClient.getFocusInfo();
	},

	startBuild : function (bKeepModifications) {
		this.mButtons = {};
		this.aCallBacks = [];
		this.oPositions = {
			iActive : 0,
			iControlPosition : 0
		};
		this.bHasOverflow = false;
		if (this.oChild) {
			this.oChild.startBuild(true);
		}
		if (this.oOverflowList) {
			this.oOverflowList.startBuild(true);
		}
		if (!bKeepModifications) {
		  this.oModifications = {
			  mChangedEnablements : {},
			  mChangedTexts : {}
		  };
		}
		// cleanup also bar, action sheet, bar overflow and overflow list
		this.aButtons = [];
		if (this.oActionSheet) {
			this.oActionSheet.destroyButtons();
		}
		if (this.oBar) {
			this.oBar.destroyContentRight();
			this.oBar.destroyContentLeft();
		}
		if (this.oBarOverflow) {
			this.oBarOverflow.destroy();
			delete this.oBarOverflow;
		}
		if (this.oOverflowList) {
			this.oOverflowList.destroy();
			delete this.oOverflowList;
		}
	},

	endBuild : function () {
		var sId;

		for (var i = this.oPositions.iActive; i < this.aButtons.length; i++) {
			var oControl = this.aButtons[i];
			if (oControl.oButton) {
				oControl.oButton.setVisible(false);
			}
			if (oControl.oSelect) {
				oControl.oSelect.setVisible(false);
			}
		}
		if (this.oChild) {
			this.oChild.endBuild();
		}
		if (this.oOverflowList) {
			this.oOverflowList.endBuild();
		}
		this.bIsOverflowReplaced = false;
		if (this.oModifications) {
			for (sId in this.oModifications.mChangedEnablements) {
				this.setBtnEnabled(sId, this.oModifications.mChangedEnablements[sId], true);
			}
			for (sId in this.oModifications.mChangedTexts) {
				this.setBtnText(sId, this.oModifications.mChangedTexts[sId], true);
			}
		}
		if (this.oBarOverflow) {
			// ensure that BarOverflow gets invalidated
			this.oBarOverflow.buttonTextChanged();
		}
	},

	destroy : function () {
		for (var i = 0; i < this.aButtons.length; i++) {
			var oControlObject = this.aButtons[i];
			if (oControlObject.oButton) {
				oControlObject.oButton.destroy(true);
			}
			if (oControlObject.oSelect) {
				oControlObject.oSelect.destroy(true);
			}
		}
		if (this.oBar) {
			this.oBar.destroy();
			delete this.oBar;
		}
		if (this.oActionSheet) {
			this.oActionSheet.destroy();
			delete this.oActionSheet;
		}
		if (this.oChild) {
			this.oChild.destroy();
			delete this.oChild;
		}
		if (this.oBarOverflow) {
			this.oBarOverflow.destroy();
			delete this.oBarOverflow;
		}
		if (this.oOverflowList) {
			this.oOverflowList.destroy();
			delete this.oOverflowList;
		}
	},

	/**
	 * Create an overflow button and add it to the bar. If automatic overflow is set a
	 * sap.ca.scfld.md.app.BarOverflow is registered.
	 * @return {sap.m.ActionSheet}
	 *   the action sheet in which the overflow content needs to be put in
	 */
	addOverflowButton: function () {
		var oActionSheet,
			oOverflow,
			that = this;
		if (!this.oOverflowList) {
			this.oOverflowList = new sap.ca.scfld.md.app.ButtonListHelper(this.oApplicationImplementation, 10);
			this.oOverflowList.bAllDisabled = this.bAllDisabled;
			this.oOverflowList.oBarList = this;
		}
		this.iOverflowPosition = this.oPositions.iActive;
		oOverflow = this.ensureButton(sap.ca.scfld.md.app.ButtonListHelper.getOverflowMeta(this), "b");
		this.oOverflowButton = oOverflow;
		// store button information also at oOverflowList
		this.oOverflowList.oOverflowButton = oOverflow;

		oOverflow.setEnabled(true);
		oOverflow.setLayoutData(new sap.ca.scfld.md.app.BarOverflowLayoutData({
			moveToOverflow: false,
			stayInOverflow: false,
			overflowButton: true
		}));

		oActionSheet = this.oOverflowList.oActionSheet;

		if (this.bAutomaticOverflow  && !this.oBarOverflow) {
			// If there is automatic overflow, the BarOverflow is able to move buttons to the
			// overflow if the bar would get too wide otherwise. However initially all buttons
			// will be rendered directly to the bar and the overflow button is unnecessary.
			// Moving will occur during rendering. To avoid flickering we make it invisible
			// initially. It will be made visible in BarOverflow._moveControlsToOverflow.
			oOverflow.setVisible(false);
			this.oBarOverflow = new sap.ca.scfld.md.app.BarOverflow(
				this.oBar,
				oActionSheet,
				resized.bind(that)
			);
		}

		return oActionSheet;
	},

	ensureButton : function (oBtnMeta, sType, iMaxCountBeforeOverflow) {
		var oControl;
		if (iMaxCountBeforeOverflow && this.oPositions.iActive >= iMaxCountBeforeOverflow) {
			if (!this.bHasOverflow) {
				this.addOverflowButton();
				this.bHasOverflow = true;
			}
			return this.oOverflowList.ensureButton(oBtnMeta, sType);
		}
		var iButtonsCount = this.oPositions.iActive;
		if (iButtonsCount == this.aButtons.length) {
			this.aButtons.push({});
		}

		oControl = this.ensureControlAtPosition(oBtnMeta, sType, iButtonsCount, this.oPositions);
		if (this.bAutomaticOverflow) {
			oControl.setLayoutData(new sap.ca.scfld.md.app.BarOverflowLayoutData());
			// if iMaxCountBeforeOverflow is not defined button must not go to overflow
			if (!iMaxCountBeforeOverflow) {
				oControl.getLayoutData().setMoveToOverflow(false);
			}
		}
		return oControl;
	},

	setBtnEnabled : function (sId, bEnabled, bNoStorage) {
		if (this.bAllDisabled) {
			return;
		}
		var oButton = this.mButtons[sId],
			oControlObject;
		if (oButton) {
			oButton.setEnabled(bEnabled);
			if (oButton.getMetadata().getName() === "sap.m.Select") {
				// select control adjust text of button representation only
				oControlObject = findControlObject(this.aButtons, oButton);
				oButton = oControlObject.oButton;
				// set enabled state of button replacement also
				if (oButton) {
					oButton.setEnabled(bEnabled);
				}
			}
		} else {
			if (this.oChild) {
				this.oChild.setBtnEnabled(sId, bEnabled, true);
			}
			if (this.oOverflowList) {
				this.oOverflowList.setBtnEnabled(sId, bEnabled, true);
			}
		}
		if (!bNoStorage) {
			this.oModifications.mChangedEnablements[sId] = bEnabled;
		}
	},

	ensureControlAtPosition : function (oBtnMeta, sType, iButtonsCount, oPositions) {
		var oControlObject = this.aButtons[iButtonsCount], sText, sTextInActionSheet,
			iControlPosition, oRet;
		if (sType == "b" || this.iMode < 20) { // selects are only possible in bars
			if (oControlObject.oSelect) {
				oPositions.iControlPosition = this.oBar["indexOfContent" + this.sDirection](oControlObject.oSelect);
				oControlObject.oSelect.setVisible(false);
			}
			if (oControlObject.oButton) {
				oControlObject.oButton.setVisible(true);
				if (this.oBar) {
					iControlPosition = this.oBar["indexOfContent" + this.sDirection](oControlObject.oButton);
					if (iControlPosition > oPositions.iControlPosition) {
						oPositions.iControlPosition = iControlPosition;
					}
				}
			} else {
				oControlObject.oButton = new sap.m.Button({id: oBtnMeta.sControlId});
				oControlObject.oButton.attachPress(jQuery.proxy(function (oEvent) {
					if (this.aCallBacks[iButtonsCount]) {
						this.aCallBacks[iButtonsCount](oEvent);
					}
				}, this));
				oPositions.iControlPosition++;
				if (this.iMode >= 20) {
					this.oBar["insertContent" + this.sDirection](oControlObject.oButton, oPositions.iControlPosition);
				} else if (this.iMode >= 10) {
					this.oActionSheet.addButton(oControlObject.oButton);
				} else if (this.iMode == 5) {
					this.oBar.insertContentLeft(oControlObject.oButton, oPositions.iControlPosition);
				}
			}
			sText = getText(oBtnMeta, this.oApplicationImplementation);
			sTextInActionSheet = sText;
			if (!(this.iMode < 20 || !oBtnMeta.sIcon)) {
				oControlObject.oButton._sTooltip = oBtnMeta.sTooltip || sText;
				oControlObject.oButton.setTooltip(oControlObject.oButton._sTooltip);
				sText = "";
			} else if (oBtnMeta.sTooltip && oBtnMeta.sTooltip !== sText) {
				oControlObject.oButton._sTooltip = oBtnMeta.sTooltip;
				oControlObject.oButton.setTooltip(oControlObject.oButton._sTooltip);
			}
			oControlObject.oButton._sTextInActionSheet = sTextInActionSheet;
			oControlObject.oButton._sTextInBar = sText;
			if (sText != oControlObject.oButton.getText()) {
				oControlObject.oButton.setText(sText);
			}
			oControlObject.oButton._sTypeInActionSheet = sap.m.ButtonType.Default;

			if (this.iMode == 20) { // styles are only used in bars
				if (oControlObject.oButton.getType() != oBtnMeta.style) {
					oControlObject.oButton.setType(oBtnMeta.style);
					oControlObject.oButton._sTypeInBar = oBtnMeta.style;
				}
			}
			if (sType == "b") {
				this.aCallBacks[iButtonsCount] = oBtnMeta.onBtnPressed;
			} else {
				this.aCallBacks[iButtonsCount] = this.getSelectReplacement(oBtnMeta);
			}
			oRet = oControlObject.oButton;
		} else { // select
			if (oControlObject.oButton) {
				oPositions.iControlPosition = this.oBar["indexOfContent" + this.sDirection](oControlObject.oButton);
				oControlObject.oButton.setVisible(false);
			}
			if (oControlObject.oSelect) {
				oControlObject.oSelect.setVisible(true);
				iControlPosition = this.oBar["indexOfContent" + this.sDirection](oControlObject.oSelect);
				if (iControlPosition > oPositions.iControlPosition) {
					oPositions.iControlPosition = iControlPosition;
				}

				var sCurrentSelectedKey = oControlObject.oSelect.getSelectedKey();
				oControlObject.oSelect.destroyItems();
				oControlObject.oSelect.setSelectedKey(sCurrentSelectedKey);

			} else {
				oControlObject.oSelect = new sap.m.Select({id: oBtnMeta.sControlId
					? oBtnMeta.sControlId + "_SELECT" : undefined});
				oControlObject.oSelect.setType(sap.m.SelectType.IconOnly);
				oControlObject.oSelect.setAutoAdjustWidth(true);
				oControlObject.oSelect.setTooltip(oBtnMeta.sTooltip);
				oPositions.iControlPosition++;
				this.oBar["insertContent" + this.sDirection](oControlObject.oSelect, oPositions.iControlPosition);
				oControlObject.oSelect.attachChange(jQuery.proxy(function (oEvent) {
					var sKey = oEvent.getSource().getSelectedKey();
					if (this.aCallBacks[iButtonsCount]) {
						this.aCallBacks[iButtonsCount](sKey);
					}
				}, this));
				// if responsive bar is used create also a button for that select
				if (this.bAutomaticOverflow && !oControlObject.oButton) {
					oControlObject.oButton = new sap.m.Button();
					oControlObject.oButton.setText(
						getText(oBtnMeta, this.oApplicationImplementation)
					);
					if (oBtnMeta.sIcon) {
						oControlObject.oButton.setIcon(oBtnMeta.sIcon);
					}
					oControlObject.oButton.attachPress(jQuery.proxy(function (oEvent) {
						var fnSelect = this.getSelectReplacement(oBtnMeta);
						if (fnSelect) {
							fnSelect(oEvent);
						}
					}, this));
					oControlObject.oButton.setEnabled(!oBtnMeta.bDisabled && !this.bAllDisabled);
				}
			}

			if (oBtnMeta.sSelectedItemKey) {
				oControlObject.oSelect.setSelectedItem(oBtnMeta.sSelectedItemKey);
			}

			for ( var i = 0; i < oBtnMeta.aItems.length; i++) {
				var oSettings = oBtnMeta.aItems[i], oItem;
				if (!oSettings.id && oBtnMeta.sControlId) {
					// use stable IDs
					oSettings.id = oControlObject.oSelect.getId() + "_" + i;
				}
				oItem = new sap.ui.core.Item(oSettings);
				oControlObject.oSelect.addItem(oItem);
			}

			if (oBtnMeta.sSelectedItemKey) {
				oControlObject.oSelect.setSelectedKey(oBtnMeta.sSelectedItemKey);
			}

			this.aCallBacks[iButtonsCount] = oBtnMeta.onChange;
			oRet = oControlObject.oSelect;
		}
		if (oBtnMeta.sIcon != oRet.getIcon()) {
			oRet.setIcon(oBtnMeta.sIcon);
		}
		if (oBtnMeta.sId) {
			this.mButtons[oBtnMeta.sId] = oRet;
		}
		oRet.setEnabled(!oBtnMeta.bDisabled && !this.bAllDisabled);
		oPositions.iActive++;
		return oRet;
	},

	/*
	 * getSelectReplacement: function(oBtnMeta){ return jQuery.proxy(function(oEvent){ var iButtonsCount =
	 * this.oBarList.iOverflowPosition; oPositions = { iActive : 0, iControlPosition :
	 * this.oBarList.oBar.indexOfContentRight(this.oBarList.aButtons[iButtonsCount].oButton), }; var oSelectMeta = {}
	 * jQuery.extend(oSelectMeta, oBtnMeta); var oBarList = this.oBarList; oSelectMeta.onChange = function(oKey){
	 * oBarList.revertOverflowReplacement(); oBtnMeta.onChange(oKey); };
	 * this.oBarList.ensureControlAtPosition(oSelectMeta, "s", iButtonsCount, oPositions); //
	 * this.oBarList.aButtons[iButtonsCount].oSelect.getPopup().open(); this.oBarList.bIsOverflowReplaced = true; },
	 * this); },
	 */

	getSelectReplacement : function (oBtnMeta) {
		var sSelectedItemKey = oBtnMeta.sSelectedItemKey,
			that = this;

		return function (oEvent) {
			var aItems = [];
			var iSelection = 0;
			for ( var i = 0; i < oBtnMeta.aItems.length; i++) {
				aItems.push({
					itemContent : oBtnMeta.aItems[i].text
				});
				if (oBtnMeta.aItems[i].key == sSelectedItemKey) {
					iSelection = i;
				}
			}
			sSelectedItemKey = oBtnMeta.aItems[iSelection].key;
			sap.ca.ui.dialog.selectItem.open({
				title : oEvent.getSource().getText(),
				items : aItems,
				defaultIndex : iSelection
			}, function (oResult) {
				var aControls = that.oActionSheet && that.oActionSheet.getButtons() || [],
					oFocusInfo,
					aSourceButton = findMatchingElement(aControls, {
						icon: oBtnMeta.sIcon,
						text: oBtnMeta.sBtnTxt,
						tooltip : oBtnMeta.sTooltip
					});
				if (DEBUG) {
					jQuery.sap.log.debug("Closed item selection for " + oBtnMeta.sBtnTxt,
						CLASSNAME);
				}
				// select replacement can happen only if a select control is rendered in an
				// overflow area; after closing the dialog the button which opened the dialog is
				// not visible any more --> focus the overflow button instead
				if (that.oOverflowButton) {
					if (aSourceButton && that.oBarList) {
						// store focus information for the button which opened the dialog at the
						// parent bar
						oFocusInfo = getFocusInfoForId(aSourceButton.getId(), aControls, "overflow");
						if (oFocusInfo) {
							oFocusInfo.pos = 1000;
							that.oBarList._focusInfo = oFocusInfo;
							if (DEBUG) {
								jQuery.sap.log.debug("Save focus information",
									JSON.stringify(oFocusInfo), CLASSNAME);
							}
						}
					}
					// if footer does not get modified by the application, set the focus to the
					// overflow button
					that.oOverflowButton.focus();
				}
				if (oResult.selectedIndex >= 0) {
					var sSelectedItemKeyNew = oBtnMeta.aItems[oResult.selectedIndex].key;
					if (sSelectedItemKeyNew != sSelectedItemKey) {
						sSelectedItemKey = sSelectedItemKeyNew;
						oBtnMeta.sSelectedItemKey = sSelectedItemKey;
					  oBtnMeta.onChange(sSelectedItemKey);
					}
				}
			});
		};
	},

	revertOverflowReplacement : function () {
		if (this.bIsOverflowReplaced) {
			this.ensureControlAtPosition(sap.ca.scfld.md.app.ButtonListHelper.getOverflowMeta(this), "b",
					this.iOverflowPosition, {});
			this.bIsOverflowReplaced = false;
		}
	},

	setBtnText : function (sId, sText, bNoStorage) {
		var oButton = this.mButtons[sId],
			oControlObject;
		if (oButton) {
			if (oButton.getMetadata().getName() === "sap.m.Select") {
				// if text is set, tooltip of select needs to be set
				oButton.setTooltip(sText);
				oButton._sTooltip = sText;
				// select control adjust text of button representation only
				oControlObject = findControlObject(this.aButtons, oButton);
				oButton = oControlObject.oButton;
			}
			if (oButton) {
				oButton.setText(sText);
				// if text is set, no tooltip is needed
				oButton.setTooltip("");
				oButton._sTooltip = "";
				if (oButton._sTextInBar) {
					oButton._sTextInBar = sText;
				}
				if (oButton._sTextInActionSheet) {
					oButton._sTextInActionSheet = sText;
				}
				if (this.oBarOverflow) {
					this.oBarOverflow.buttonTextChanged();
				}
			}
		} else {
			if (this.oChild) {
				this.oChild.setBtnText(sId, sText, true);
			}
			if (this.oOverflowList) {
				this.oOverflowList.setBtnText(sId, sText, true);
			}
		}
		if (!bNoStorage) {
			this.oModifications.mChangedTexts[sId] = sText;
		}
	},

	/**
	 * Helper to retrieve current selection for given generic button type.
	 * @param {string} sType
	 *     The type name of the generic button (e.g. "filter")
	 * @param {string} sDefaultKey
	 *     The key that should be used if there is no selection available
	 * @return {string}
	 *     The currently stored selected key for given generic button type
	 * @private
	 */
	_getCurrentSelection: function (sType, sDefaultKey) {
		if (!this.mSelections[sType]) {
			this.mSelections[sType] = sDefaultKey;
		}
		return this.mSelections[sType];
	},

	/**
	 * Update the selected key for given generic button type.
	 * @param {string} sType
	 *     The type name of the generic button (e.g. "filter")
	 * @param {string} sCurrentKey
	 *     The current selected key value for given generic button type
	 * @private
	 */
	_updateCurrentSelection: function (sType, sCurrentKey) {
		this.mSelections[sType] = sCurrentKey;
	}
});

sap.ca.scfld.md.app.ButtonListHelper.getOverflowMeta = function (oOwner) {
	return {
		sIcon : "sap-icon://overflow",
		sControlId : oOwner.sOverflowId,
		sTooltip: oOwner.oApplicationImplementation.UilibI18nModel.getResourceBundle().getText("MORE"),
		onBtnPressed : function (evt) {
			oOwner.oOverflowList.oActionSheet.openBy(evt.getSource());
		}
	};
};
})();
