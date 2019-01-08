/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/library', 'sap/ui/base/ManagedObject', 'sap/ui/comp/personalization/Util', './Util', './Factory', 'sap/ui/comp/personalization/Controller'
], function(jQuery, CompLibrary, ManagedObject, PersonalizationUtil, Util, Factory, Controller) {
	"use strict";

	/**
	 * Handler for communication with layered repository (LRep).
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class Communicates with the layered repository (LRep) and reacts on flexibility changes.
	 * @constructor
	 * @public
	 * @since 1.46.0
	 * @alias sap.ui.comp.navpopover.FlexHandler
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FlexHandler = ManagedObject.extend("sap.ui.comp.navpopover.FlexHandler", /** @lends sap.ui.comp.navpopover.FlexHandler */
	{
		constructor: function(sId, mSettings) {
			ManagedObject.apply(this, arguments);
		},
		metadata: {
			properties: {
				/**
				 * Initial state of all available actions. After the initial state has been set it cannot be changed again.
				 */
				initialSnapshot: {
					type: "object",
					defaultValue: null
				},
				/**
				 * Changes made only for USER layer.
				 */
				snapshotOfUserLayer: {
					type: "object",
					defaultValue: null
				},
				/**
				 * Changes made for all layers except USER layer.
				 */
				snapshotOfLayersWithoutUser: {
					type: "object",
					defaultValue: null
				}
			}
		}
	});

	FlexHandler.prototype.applySettings = function(mSettings) {
		// Note: we have to initialize the properties 'snapshotOfUserLayer', 'snapshotOfLayersWithoutUser' and 'initialSnapshot' with an empty object
		// {} because the value of these properties still remains when new instance of FlexHandler is be created (reference of objects in
		// JavaScript).
		this.setInitialSnapshot({});
		this.setSnapshotOfUserLayer({});
		this.setSnapshotOfLayersWithoutUser({});

		ManagedObject.prototype.applySettings.apply(this, arguments);
	};

	FlexHandler.prototype.init = function() {
		if (JSON.parse(jQuery.sap.getUriParameters().get("sap-ui-smartlink"))) {
			Factory.getService("FlexConnector").activateApplyChangeStatistics();
		}
	};

	/**
	 *
	 * @param {object} oLinkData
	 * @param {string} sLayer
	 * @private
	 */
	FlexHandler.prototype.updateAvailableActionOfSnapshot = function(oLinkData, sLayer) {
		if (!oLinkData || !sLayer) {
			return;
		}
		var oSnapshot;
		switch (sLayer) {
			case "USER":
				// Update only 'USER' snapshot
				oSnapshot = this.getSnapshotOfUserLayer();
				oSnapshot[oLinkData.getKey()] = {
					key: oLinkData.getKey(),
					visible: oLinkData.getVisible()
				};
				this.setSnapshotOfUserLayer(oSnapshot);
				break;
			default:
				// Update all other snapshot
				oSnapshot = this.getSnapshotOfLayersWithoutUser();
				oSnapshot[oLinkData.getKey()] = {
					key: oLinkData.getKey(),
					visible: oLinkData.getVisible()
				};
				this.setSnapshotOfLayersWithoutUser(oSnapshot);
		}
	};

	/**
	 * @private
	 */
	FlexHandler.prototype.discardAvailableActionsOfSnapshot = function(sLayer) {
		if (sLayer !== "USER") {
			return;
		}
		this.setSnapshotOfUserLayer({});
	};

	/**
	 * Current snapshot of available actions.
	 *
	 * @private
	 */
	FlexHandler.prototype.determineSnapshotOfAvailableActions = function() {
		var oSnapshotOrigin = FlexHandler._getUnion(this.getInitialSnapshot(), this.getSnapshotOfLayersWithoutUser());
		return FlexHandler._getUnion(oSnapshotOrigin, this.getSnapshotOfUserLayer());
	};

	/**
	 * Difference between initial snapshot and current snapshot.
	 *
	 * @private
	 */
	FlexHandler.prototype.determineSnapshotOfChangedAvailableActions = function() {
		var oSnapshotTotal = this.determineSnapshotOfAvailableActions();
		return FlexHandler._getUnionCondensed(this.getInitialSnapshot(), oSnapshotTotal);
	};

	/**
	 * @private
	 */
	FlexHandler.prototype.openSelectionDialog = function(oSelectorControl, bForbidNavigation, bShowReset, fCallbackAfterClose, bIsEndUser, sStyleClass) {
		var that = this;
		var oSnapshotKeyUserOld = jQuery.extend(true, {}, this.getSnapshotOfLayersWithoutUser());
		var oSnapshotUserOld = jQuery.extend(true, {}, this.getSnapshotOfUserLayer());
		var oSnapshotOrigin;
		var oSnapshotTotalOld;
		var oSelectionItems;

		if (bIsEndUser) {
			oSnapshotOrigin = FlexHandler._getUnion(this.getInitialSnapshot(), oSnapshotKeyUserOld);
			oSnapshotTotalOld = FlexHandler._getUnion(oSnapshotOrigin, oSnapshotUserOld);
			oSelectionItems = FlexHandler._convertSnapshotToSelectionItems(oSnapshotUserOld);
		} else {
			oSnapshotOrigin = this.getInitialSnapshot();
			oSnapshotTotalOld = FlexHandler._getUnion(oSnapshotOrigin, oSnapshotKeyUserOld);
			oSelectionItems = FlexHandler._convertSnapshotToSelectionItems(oSnapshotKeyUserOld);
		}

		return new Promise(function(resolve) {
			// due to performance reason - keep oController as member variable for the use-case that after OK (in Selection Dialog) the
			// Selection Dialog is opened again
			var bDialogConfirmedReset = false;
			var oController = new Controller({
				table: PersonalizationUtil.createSelectionWrapper(Util.getStorableAvailableActions(FlexHandler._convertSnapshotToObjectArray(oSnapshotOrigin)), bForbidNavigation),
				dialogConfirmedReset: function() {
					bDialogConfirmedReset = true;
				},
				setting: {
					selection: {
						visible: true,
						payload: {
							callbackSaveChanges: function(aSelectionItems) {
								var oSnapshotBase = bDialogConfirmedReset ? oSnapshotOrigin : oSnapshotTotalOld;
								var oSnapshotTotalNew = FlexHandler._getUnion(oSnapshotTotalOld, aSelectionItems ? FlexHandler.convertArrayToSnapshot("columnKey", aSelectionItems) : {});
								var aChanges = FlexHandler._convertSnapshotToChangeFormat(FlexHandler._getUnionCondensed(oSnapshotBase, oSnapshotTotalNew));

								if (fCallbackAfterClose) {
									fCallbackAfterClose(aChanges);
									return Promise.resolve(true);
								}
								if (bDialogConfirmedReset) {
									return that._discardChanges(oSelectorControl, bIsEndUser).then(function(bDiscarded) {
										if (!bDiscarded) {
											that._revertChanges(oSelectorControl, oSnapshotKeyUserOld, oSnapshotUserOld);
											return false;
										}
										return that._saveChanges(oSelectorControl, aChanges);
									}).then(function(bSaved) {
										if (!bSaved) {
											that._revertChanges(oSelectorControl, oSnapshotKeyUserOld, oSnapshotUserOld);
											return false;
										}
										return true;
									});
								}
								return that._saveChanges(oSelectorControl, aChanges).then(function(bSaved) {
									if (!bSaved) {
										that._revertChanges(oSelectorControl, oSnapshotKeyUserOld, oSnapshotUserOld);
										return false;
									}
									return true;
								});
							}
						}
					}
				},
				resetToInitialTableState: true,
				dialogAfterClose: function() {
					return resolve();
				}
			});

			// As variant we now set the changes of 'USER' layer
			oController.setPersonalizationData({
				selection: {
					selectionItems: oSelectionItems
				}
			});

			oController.openDialog({
				contentWidth: "25rem",
				contentHeight: "35rem",
				styleClass: "" + sStyleClass,
				showReset: bShowReset,
				selection: {
					visible: true
				}
			});
		});
	};

	/**
	 * @private
	 */
	FlexHandler.prototype._discardChanges = function(oSelectorControl, bIsEndUser) {
		return Factory.getService("FlexConnector").discardChangesForControl(oSelectorControl, bIsEndUser).then(function() {
			return true;
		})['catch'](function(oError) {
			jQuery.sap.log.error("Changes could not be discarded in LRep: " + oError.status);
			return false;
		});
	};

	/**
	 *
	 * @param {sap.ui.comp.navpopover.NavigationContainer} oSelectorControl
	 * @param {object[]} aChanges - Format: {key: {string}, visible: {boolean}}
	 * @private
	 */
	FlexHandler.prototype._saveChanges = function(oSelectorControl, aChanges) {
		var aMAddedLinks = aChanges.filter(function(oMLink) {
			return oMLink.visible === true;
		});
		var aMRemovedLinks = aChanges.filter(function(oMLink) {
			return oMLink.visible === false;
		});

		return Factory.getService("FlexConnector").createAndSaveChangesForControl(aMAddedLinks, aMRemovedLinks, oSelectorControl).then(function() {
			return true;
		})['catch'](function(oError) {
			jQuery.sap.log.error("Changes could not be saved in LRep: " + oError.status);
			return false;
		});
	};

	/**
	 * @private
	 */
	FlexHandler.prototype._revertChanges = function(oSelectorControl, oSnapshotOfLayersWithoutUser, oSnapshotOfUserLayer) {
		this.setSnapshotOfLayersWithoutUser(oSnapshotOfLayersWithoutUser);
		this.setSnapshotOfUserLayer(oSnapshotOfUserLayer);
		oSelectorControl._syncAvailableActions();
	};

	/**
	 * Updates only the existing items of <code>oSnapshotBase</code> from <code>oSnapshotDelta</code>.
	 *
	 * @param {object} oSnapshotBase Object of format:
	 *
	 * <pre>
	 * {
	 * 	key, text, visible, href, target, description
	 * }
	 * </pre>
	 *
	 * @param {object} oSnapshotDelta Object of format:
	 *
	 * <pre>
	 * {
	 * 	key, text, visible, href, target, description
	 * }
	 * </pre>
	 *
	 * @private
	 */
	FlexHandler._getUnion = function(oSnapshotBase, oSnapshotDelta) {
		var oSnapshotBaseCopy = jQuery.extend(true, {}, oSnapshotBase);
		if (oSnapshotDelta) {
			for ( var sKey in oSnapshotBaseCopy) {
				if (oSnapshotDelta[sKey] && oSnapshotDelta[sKey].visible !== undefined) {
					oSnapshotBaseCopy[sKey].visible = oSnapshotDelta[sKey].visible;
				}
			}
		}
		return oSnapshotBaseCopy;
	};

	/**
	 * Similar to <code>_getUnion</code> method where equal items are not taken into account.
	 *
	 * @param {object} oSnapshotBase Object of format:
	 *
	 * <pre>
	 * {
	 * 	key, text, visible, href, target, description
	 * }
	 * </pre>
	 *
	 * @param {object} oSnapshotDelta Object of format:
	 *
	 * <pre>
	 * {
	 * 	key, text, visible, href, target, description
	 * }
	 * </pre>
	 *
	 * @private
	 */
	FlexHandler._getUnionCondensed = function(oSnapshotBase, oSnapshotDelta) {
		var oSnapshotBaseCondensed = FlexHandler._condense(oSnapshotBase, oSnapshotDelta);
		var oSnapshotDeltaCondensed = FlexHandler._condense(oSnapshotDelta, oSnapshotBase);
		return FlexHandler._getUnion(oSnapshotBaseCondensed, oSnapshotDeltaCondensed);
	};

	/**
	 * The result does not contain equal items.
	 *
	 * @private
	 */
	FlexHandler._condense = function(oSnapshotBase, oSnapshotDelta) {
		var oSnapshotBaseCondensed = {};
		for ( var sKey in oSnapshotBase) {
			if (!PersonalizationUtil.semanticEqual(oSnapshotBase[sKey], oSnapshotDelta[sKey])) {
				oSnapshotBaseCondensed[sKey] = oSnapshotBase[sKey];
			}
		}
		return oSnapshotBaseCondensed;
	};

	/**
	 * @private
	 */
	FlexHandler._convertSnapshotToChangeFormat = function(oSnapshot) {
		var aMLinks = FlexHandler._convertSnapshotToObjectArray(oSnapshot);
		return aMLinks.map(function(oMLink) {
			return {
				key: oMLink.key,
				visible: oMLink.visible
			};
		});
	};

	/**
	 * @private
	 */
	FlexHandler._convertSnapshotToSelectionItems = function(oSnapshot) {
		return FlexHandler._convertSnapshotToObjectArray(oSnapshot).map(function(oMLink) {
			return {
				columnKey: oMLink.key,
				visible: oMLink.visible
			};
		});
	};

	/**
	 * @private
	 */
	FlexHandler._convertSnapshotToObjectArray = function(oSnapshot) {
		return Object.keys(oSnapshot).map(function(sKey) {
			return oSnapshot[sKey];
		});
	};

	/**
	 * @private
	 */
	FlexHandler.convertArrayToSnapshot = function(sKey, aItems) {
		var oSnapshot = {};
		aItems.forEach(function(oItem) {
			if (oItem[sKey] === undefined) {
				return;
			}
			oSnapshot[oItem[sKey]] = oItem;
		});
		return oSnapshot;
	};

	/* eslint-enable strict */
	return FlexHandler;
},
/* bExport= */true);
