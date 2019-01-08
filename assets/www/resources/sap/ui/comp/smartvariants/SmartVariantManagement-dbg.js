/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smartvariants.SmartVariantManagement.
// To avoid loading the fl lib in every case it is only "lazy"-loaded on lib level and loaded explicitly here:
sap.ui.getCore().loadLibrary('sap.ui.fl');

sap.ui.define([
	'jquery.sap.global', 'sap/ui/comp/library', './PersonalizableInfo', 'sap/ui/comp/variants/VariantItem', 'sap/ui/comp/variants/VariantManagement', 'sap/ui/fl/Change', 'sap/ui/fl/Persistence', 'sap/ui/fl/Utils', 'sap/ui/fl/transport/TransportSelection'
], function(jQuery, library, PersonalizableInfo, VariantItem, VariantManagement, Change, Persistence, FlexUtils, TransportSelection) {
	"use strict";

	/**
	 * Constructor for a new SmartVariantManagement.<br>
	 * The call sequence is as follows:<br>
	 * A control for which personalization is used has to be registered first via the <code>personalizableControls</code> association. Then it has
	 * to call the <code>initialise</code> method with the arguments <code>fCallback</code> function which will be called once the personalization
	 * data has been retrieved and <code>oPersoControl</code>, the control itself.<BR>
	 * <b>Note:</b> the function callback has to be defined in the personalizable control.<BR>
	 * The old behavior, where the control has to register to the <code>initialise</code> event, before the <code>initialise</code> method call,
	 * should not be used any longer and is not supported at all for the page variant scenarios.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SmartVariantManagement control is a specialization of the {@link sap.ui.comp.variants.VariantManagement VariantManagement} control
	 *        and communicates with the layer that offers SAPUI5 flexibility services to manage the variants.<br>
	 *        For more information about SAPUI5 flexibility, refer to the Developer Guide.
	 * @extends sap.ui.comp.variants.VariantManagement
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartvariants.SmartVariantManagement
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartVariantManagement = VariantManagement.extend("sap.ui.comp.smartvariants.SmartVariantManagement", /** @lends sap.ui.comp.smartvariants.SmartVariantManagement.prototype */
	{
		metadata: {

			library: "sap.ui.comp",
			designTime: true,
			properties: {
				/**
				 * Key used to access personalization data.
				 */
				persistencyKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				}
			},
			aggregations: {

				/**
				 * All controls that rely on variant handling have to be added to this aggregation.
				 */
				personalizableControls: {
					type: "sap.ui.comp.smartvariants.PersonalizableInfo",
					multiple: true,
					singularName: "personalizableControl"
				}
			},
			events: {

				/**
				 * This event is fired when the SmartVariantManagement control is initialized.
				 * @deprecated Since version 1.38.0. Replaced by providing the personalizable control and the callback via the <code>initialise</code>-method.
				 */
				initialise: {},

				/**
				 * This event is fired after a variant has been saved.
				 */
				afterSave: {
					parameters: {
						/**
						 * If the property <code>showCreateTile</code> is set, the Create Tile checkbox is shown and its value is passed to this
						 * event parameter.<br>
						 * If the property <code>showCreateTile</code> is not set, this event parameter is skipped.
						 */
						tile: {
							type: "boolean"
						}
					}
				}
			}
		},

		renderer: function(oRm, oControl) {
			VariantManagement.getMetadata().getRenderer().render(oRm, oControl);
		}
	});

	SmartVariantManagement.prototype.init = function() {
		VariantManagement.prototype.init.apply(this); // Call base class

		this._bIsInitialized = false;

		this._oStandardVariant = null;
		this._oControlPersistence = null;
		// this._oControlComponent = null;
		this._oControlPromise = null;
		this._oPersoControl = null;
		this._sAppStandardVariantKey = null;

		this._oSelectionVariantHandler = {};

		this._oAppStdContent = null;

		this._aPersonalizableControls = [];

		if (this.setLifecycleSupport) {
			this.setLifecycleSupport(true);
		}
		this._setBackwardCompatibility(false);

		this.setSupportExecuteOnSelectOnSandardVariant(true);
	};

	SmartVariantManagement.prototype.applySettings = function(mSettings) {

		if (!mSettings || !mSettings.hasOwnProperty("useFavorites")) {
			this.setUseFavorites(true);
		}

		VariantManagement.prototype.applySettings.apply(this, arguments);
	};

	SmartVariantManagement.prototype._createControlWrapper = function(oCurrentControlInfo) {
		var oControlInfo = null;
		var oControl = sap.ui.getCore().byId(oCurrentControlInfo.getControl());
		if (oControl) {
			/* eslint-disable new-cap */
			oControlInfo = {
				control: oControl,
				type: oCurrentControlInfo.getType(),
				dataSource: oCurrentControlInfo.getDataSource(),
				keyName: oCurrentControlInfo.getKeyName(),
				loaded: jQuery.Deferred()
			};
			/* eslint-enable new-cap */
		}

		return oControlInfo;
	};

	SmartVariantManagement.prototype._getControlWrapper = function(oControl) {
		var aCurrentControls = this._getAllPersonalizableControls();
		if (aCurrentControls && aCurrentControls.length) {
			for (var i = 0; i < aCurrentControls.length; i++) {
				if (aCurrentControls[i].control === oControl) {
					return aCurrentControls[i];
				}
			}
		}

		return null;
	};

	/**
	 * Registers all controls interested and relying on variant handling.
	 * @public
	 * @param {sap.ui.comp.smartvariants.PersonalizableInfo} oCurrentControlInfo Wrapper for the personalizable control
	 * @returns {sap.ui.comp.smartvariants.SmartVariantManagement} Current instance
	 */
	SmartVariantManagement.prototype.addPersonalizableControl = function(oCurrentControlInfo) {
		var oControlWrapper, oControl = null, sControlId = oCurrentControlInfo.getControl();

		oControl = sap.ui.getCore().byId(sControlId);
		if (!oControl) {
			jQuery.sap.log.error("couldn't obtain the control with the id=" + sControlId);
			return this;
		}

		this.addAggregation("personalizableControls", oCurrentControlInfo, true);

		oControlWrapper = this._createControlWrapper(oCurrentControlInfo);
		if (oControlWrapper) {
			this._aPersonalizableControls.push(oControlWrapper);
		}

		if (this.isPageVariant()) {
			return this;
		}

		this._setPersControler(oControl);

		return this;
	};

	/**
	 * Registers all controls interested and relying on variant handling.
	 * @private
	 * @returns {sap.ui.fl.transport.TransportSelection} TransportSelection dialog.
	 */
	SmartVariantManagement.prototype.getTransportSelection = function() {
		return new TransportSelection();
	};

	SmartVariantManagement.prototype._setPersControler = function(oControl) {
		if (!this._oPersoControl && FlexUtils.getComponentClassName(oControl)) { // clone
			this._oPersoControl = oControl;
			this._addPersistenceController(oControl);
		}
	};

	SmartVariantManagement.prototype.setPersistencyKey = function(sKey) {
		this.setProperty("persistencyKey", sKey);

		this._setPersControler(this);
		// this._addPersistenceController(this);
		return this;
	};

	SmartVariantManagement.prototype._addPersistenceController = function(oControl) {
		if (oControl) {
			this._oControlPersistence = new Persistence(oControl, "persistencyKey");

			// this._oControlComponent = FlexUtils.getComponentClassName(oControl);

			this._handleGetChanges(oControl);
		}
	};

	/**
	 * Determines if the <code>SmartVariantManagement</code> instance is a page variant.
	 * @public
	 * @return {boolean} <code>true</code> if it is a page variant, otherwise <code>false</code>
	 */
	SmartVariantManagement.prototype.isPageVariant = function() {
		if (this.getPersistencyKey()) {
			return true;
		}

		return false;
	};

	SmartVariantManagement.prototype._handleGetChanges = function(oControl) {
		var that = this;

		if (oControl && this._oControlPersistence) {

			this._oControlPromise = {};
			this._oControlPromise = new Promise(function(resolve, reject) {
				that._oControlPersistence.getChanges().then(function(mVariants) {
					resolve(mVariants);
				}, function(args) {
					reject(args);
				});

			});
		}
	};

	/**
	 * Retrieves the variant content.
	 * @public
	 * @param {sap.ui.core.Control} oControl Current personalizable control
	 * @param {string} sKey The variant key
	 * @returns {object} JSON Representing the content of the variant
	 */
	SmartVariantManagement.prototype.getVariantContent = function(oControl, sKey) {
		var sPersKey, oContent = this._getChangeContent(sKey);

		if (oContent && this.isPageVariant()) {
			sPersKey = this._getControlPersKey(oControl);
			if (sPersKey) {
				// oContent = oContent[sPersKey];
				oContent = this._retrieveContent(oContent, sPersKey);
			}
		}

		return oContent;
	};

	SmartVariantManagement.prototype._getChangeContent = function(sKey) {
		var oContent = null;

		if (sKey === this.STANDARDVARIANTKEY) {
			oContent = this.getStandardVariant();
		} else {
			oContent = this._getChange(sKey);
			if (oContent) {
				oContent = oContent.getContent();
				if (oContent) {
					oContent = jQuery.extend(true, {}, oContent);
				}
			}
		}

		return oContent;
	};

	/**
	 * Retrieves the variant with the requested ID.
	 * @private
	 * @param {string} sId the variant key
	 * @returns {sap.ui.fl.Change} object representing the variant
	 */
	SmartVariantManagement.prototype._getChange = function(sId) {

		var oChange = null;

		if (this._oControlPersistence) {
			oChange = this._oControlPersistence.getChange(sId);
		}

		return oChange;
	};

	/**
	 * Returns all registered providers.
	 * @private
	 * @returns {array} a list of all registered controls
	 */
	SmartVariantManagement.prototype._getAllPersonalizableControls = function() {

		return this._aPersonalizableControls;
	};

	/**
	 * Removes all registered personalizable controls.
	 * @public
	 */
	SmartVariantManagement.prototype.removeAllPersonalizableControls = function() {

		this.removeAllAggregation("personalizableControls");
		this._aPersonalizableControls = [];
	};

	/**
	 * Removes a registered personalizable control.
	 * @public
	 * @param {sap.ui.comp.smartvariants.PersonalizableInfo} oCurrentControlInfo wrapper for the personalizable control
	 * @returns {object} removed wrapper for the personalizable control
	 */
	SmartVariantManagement.prototype.removePersonalizableControl = function(oCurrentControlInfo) {

		var oPersonalizableInfo = this.removeAggregation("personalizableControls", oCurrentControlInfo);

		if (oPersonalizableInfo) {

			this._aPersonalizableControls.some(function(oPerso, index) {
				if (oPerso.control.getId() === oPersonalizableInfo.getControl()) {
					this._aPersonalizableControls.splice(index, 1);
					return true;
				}

				return false;
			}.bind(this));
		}

		return oPersonalizableInfo;
	};

	/**
	 * Removes a registered personalizable control.
	 * @public
	 * @param {sap.ui.control} oControl the personalizable control
	 */
	SmartVariantManagement.prototype.removePersonalizableControlById = function(oControl) {

		var aPersonalizableControls = this.getAggregation("personalizableControls");

		if (aPersonalizableControls) {

			aPersonalizableControls.some(function(oPerso, index) {
				if (oPerso.getControl() === oControl.getId()) {
					this.removePersonalizableControl(oPerso);
					return true;
				}

				return false;
			}.bind(this));

		}
	};

	/**
	 * Creates entries into the variant management control, based on the list of variants.
	 * @private
	 * @param {map} mVariants list of variants, as determined by the flex layer
	 * @returns {array} containing all variant keys
	 */
	SmartVariantManagement.prototype._createVariantEntries = function(mVariants) {

		var n = null;
		var sVariantKey, sStandardVariantKey = null;
		var oVariant, oVariantItem;
		var aVariantKeys = [];
		var aFavoriteChanges = [];

		this.removeAllVariantItems();

		if (mVariants) {
			for (n in mVariants) {
				if (n) {
					oVariant = mVariants[n];
					if (oVariant.isVariant()) {

						oVariantItem = new VariantItem({
							key: oVariant.getId(),
							// text: oVariant.getText("variantName"), // issue with curly brackets
							global: !oVariant.isUserDependent(),
							executeOnSelection: this._getExecuteOnSelection(oVariant),
							lifecycleTransportId: oVariant.getRequest(),
							lifecyclePackage: oVariant.getPackage(),
							namespace: oVariant.getNamespace(),
							readOnly: this._isReadOnly(oVariant),
							labelReadOnly: oVariant.isLabelReadOnly(),
							author: this._getLRepUser(oVariant)
						});
						oVariantItem.setText(oVariant.getText("variantName"));

						if (this._hasStoredStandardVariant(oVariant)) {
							sStandardVariantKey = oVariant.getId();
						}

						this.addVariantItem(oVariantItem);

						aVariantKeys.push(oVariant.getId());
					} else {
						/* eslint-disable no-lonely-if */
						if ((oVariant.getChangeType() === sap.ui.comp.smartvariants.ChangeHandlerType.addFavorite) || (oVariant.getChangeType() === sap.ui.comp.smartvariants.ChangeHandlerType.removeFavorite)) {
							aFavoriteChanges.push(oVariant);
						}
						/* eslint-enable no-lonely-if */
					}
				}
			}
		}

		if (this._oPersoControl) {
			sVariantKey = this._getDefaultVariantKey();
			if (sVariantKey) {
				this.setInitialSelectionKey(sVariantKey); // set the current selected variant
			}

			var bFlag = this._isApplicationVariant(this._oPersoControl);
			if (bFlag) {
				this.setIndustrySolutionMode(bFlag);

				bFlag = FlexUtils.isVendorLayer();
				this._setVendorLayer(bFlag);
			}

			if (this.getIndustrySolutionMode()) {
// if (oCurrentControlInfo.standardvariantkey !== undefined) {
// delete oCurrentControlInfo.standardvariantkey;
// }

				if (sStandardVariantKey) {
					// oCurrentControlInfo.standardvariantkey = sStandardVariantKey;

					this._sAppStandardVariantKey = sStandardVariantKey;

					this.setStandardVariantKey(sStandardVariantKey);
				}
			}

			if (this._oControlPersistence && this._oControlPersistence.isVariantDownport()) {
				this._enableManualVariantKey(true);
			}
		}

		// favorites handling
		this._aFavoriteChanges = aFavoriteChanges;
		this.applyDefaultFavorites(aVariantKeys);

		return aVariantKeys;
	};

	/**
	 * Applies the favorites.
	 * @protected
	 * @param {array} aVariantKeys Contains the added variant keys
	 * @param {boolean} bSelectionVariants Defines if this is the SelectionVariant scenario
	 */
	SmartVariantManagement.prototype.applyDefaultFavorites = function(aVariantKeys, bSelectionVariants) {
		if (this._aFavoriteChanges && (this._aFavoriteChanges.length > 0)) {
			this._applyFavorites(this._aFavoriteChanges);
		} else {
			/* eslint-disable no-lonely-if */
			if (!bSelectionVariants) {
				this._applyDefaultFavorites(aVariantKeys);
			} else {
				this._applyDefaultFavoritesForSelectionVariants(aVariantKeys);
			}
			/* eslint-enable no-lonely-if */
		}
	};

	SmartVariantManagement.prototype._applyDefaultFavoritesForSelectionVariants = function(aVariantKeys) {

		aVariantKeys.forEach(function(sVariantKey) {
			var oVariantItem = this.getItemByKey(sVariantKey);
			if (oVariantItem) {
				this._setFavorite(sVariantKey);
			}

		}.bind(this));

	};

	SmartVariantManagement.prototype._applyDefaultFavorites = function(aVariantKeys) {

		if (!this._sAppStandardVariantKey) {
			this.setStandardFavorite(true);
			this._setFavorite(this.STANDARDVARIANTKEY);
		}

		aVariantKeys.forEach(function(sVariantKey) {
			var oChange = this._getChange(sVariantKey);
			var oVariantItem = this.getItemByKey(sVariantKey);
			if (oChange && oVariantItem) {
				if (!this._isReadOnly(oChange)) {
					this._setFavorite(sVariantKey);
				} else if (oChange.getLayer() === "VENDOR") {
					this._setFavorite(sVariantKey);
				}
			}

		}.bind(this));

	};

	SmartVariantManagement.prototype._applyFavorites = function(aFavoriteChanges) {

		aFavoriteChanges.forEach(function(oChange) {
			var oVariantItem, oContent = oChange.getContent();
			if (oContent && oContent.key) {
				if (oContent.key === this.STANDARDVARIANTKEY) {
					this.setStandardFavorite(oContent.visible);
				} else {
					oVariantItem = this.getItemByKey(oContent.key);
					if (oVariantItem) {
						oVariantItem.setFavorite(oContent.visible);
					}
				}
			}
		}.bind(this));
	};

	/**
	 * @param {object[]} aChanges - Format: {key: {string}, visible: {boolean}}
	 * @private
	 */
	SmartVariantManagement.prototype._addFavorites = function(aChanges) {
		var aAddedFavorites = aChanges.filter(function(oFavorite) {
			return oFavorite.visible === true;
		});
		var aRemovedFavorites = aChanges.filter(function(oFavorite) {
			return oFavorite.visible === false;
		});

		this._createFavoriteTypeChanges(aAddedFavorites, aRemovedFavorites);
	};

	/**
	 * Creates changes for the variant favorites handling.
	 * @param {array} aAddedFavorites containing added favorites
	 * @param {array} aRemovedFavorites containing removed favorites
	 * @private
	 */
	SmartVariantManagement.prototype._createFavoriteTypeChanges = function(aAddedFavorites, aRemovedFavorites) {
		if (!aAddedFavorites.length && !aRemovedFavorites.length) {
			return;
		}

		this._createFavoriteChanges(aAddedFavorites, sap.ui.comp.smartvariants.ChangeHandlerType.addFavorite);
		this._createFavoriteChanges(aRemovedFavorites, sap.ui.comp.smartvariants.ChangeHandlerType.removeFavorite);
	};

	/**
	 * Creates flexibility changes in the USER layer.
	 * @param {array} aFavorites Array of objects of format {key: {string}, visible: {boolean}}
	 * @param {string} sChangeType Registered type of ChangeHandler in sap.ui.comp.library.js
	 * @private
	 */
	SmartVariantManagement.prototype._createFavoriteChanges = function(aFavorites, sChangeType) {
		var oObj = this._oControlPersistence;
		if (!oObj || !aFavorites.length) {
			return;
		}
		if (!sChangeType) {
			throw new Error("sChangeType should be filled");
		}

		aFavorites.forEach(function(oFavorite) {
			oObj.addChange({
				type: sChangeType,
				content: oFavorite,
				isUserDependent: true
			});
		});
	};

	SmartVariantManagement.prototype._isReadOnly = function(oChange) {

		var bReadOnly = oChange.isReadOnly();

		if (bReadOnly) {
			var oUser = this._getUser();
			if (oUser) {
				return !(oUser.getId() === oChange.getOwnerId()); // an owner of a change is allowed to edit it
			}
		}

		return bReadOnly;
	};

	SmartVariantManagement.prototype._getUser = function() {
		var oUser = null;

		if (sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser) {
			oUser = sap.ushell.Container.getUser();
		}

		return oUser;
	};

	/**
	 * Retrieves the list of known variants via access to
	 * @private
	 * @param {Function} fCallBack will be called once the promise is full filled
	 */
	SmartVariantManagement.prototype.getVariantsInfo = function(fCallBack) {

		if (!fCallBack) {
			jQuery.sap.log.error("'getVariantsInfo' failed. Expecting callBack not passed.");
			return;
		}

		var n = null;
		var oVariant;
		var aVariants = [];
		var that = this;

		try {

			if (this._oControlPersistence) {

				this._oControlPersistence.getChanges().then(function(mVariants) {
					if (mVariants) {
						for (n in mVariants) {
							if (n) {
								oVariant = mVariants[n];
								if (oVariant.isVariant()) {
									aVariants.push({
										key: oVariant.getId(),
										text: oVariant.getText("variantName")
									});
								}
							}
						}
					}

					fCallBack(aVariants);
				}, function(args) {
					var sError = "'getChanges' failed:";
					if (args && args[0] && args[0].messages && args[0].messages[0]) {
						sError += (' ' + args[0].messages[0]);
					}
					that._setErrorValueState(that.oResourceBundle.getText("VARIANT_MANAGEMENT_READ_FAILED"), sError);

					fCallBack(aVariants);
				});
			}

		} catch (ex) {
			this._setErrorValueState(this.oResourceBundle.getText("VARIANT_MANAGEMENT_READ_FAILED"), "'getChanges' throws an exception");
		}
	};

	/**
	 * Retrieves the current variant ID. For a standard variant, an empty string is returned.
	 * @public
	 * @since 1.28.1
	 * @returns {string} Current variant ID
	 */
	SmartVariantManagement.prototype.getCurrentVariantId = function() {
		var sKey = this._getCurrentVariantId();
		if (sKey === this.STANDARDVARIANTKEY) {
			sKey = "";
		}

		return sKey;
	};

	SmartVariantManagement.prototype._getCurrentVariantId = function() {
		var sKey = this.getSelectionKey();

		return sKey;
	};

	/**
	 * Sets the current variant ID.
	 * @public
	 * @since 1.28.1
	 * @param {string} sVariantId ID of the variant
	 * @param {boolean} bDoNotApplyVariant If set to <code>true</code>, the <code>applyVariant</code> method is not executed yet. Relevant during
	 *        navigation, when called before the initialise event has been executed
	 */
	VariantManagement.prototype.setCurrentVariantId = function(sVariantId, bDoNotApplyVariant) {
		var sId = this._determineVariantId(sVariantId);

		if (this._oPersoControl) {

			if (!this._oStandardVariant) {

				this._setSelectionByKey(sId); // set the current selected variant

			} else {
				this._applyCurrentVariantId(sId, bDoNotApplyVariant);
			}
		}
	};

	SmartVariantManagement.prototype._applyCurrentVariantId = function(sVariantId, bDoNotApplyVariant) {
		var oContent;

		if (this._oPersoControl) {
			oContent = this._getChangeContent(sVariantId);

			if (oContent) {
				this._setSelectionByKey(sVariantId); // set the current selected variant
				if (!bDoNotApplyVariant) {

					if (this.isPageVariant()) {
						this._applyVariants(oContent, "SET_VM_ID");
					} else {
						this._applyVariant(this._oPersoControl, oContent, "SET_VM_ID");
					}
				}
			}
		}
	};

	SmartVariantManagement.prototype._determineVariantId = function(sVariantId) {
		var sId = sVariantId;
		if (!sId) {
			sId = this.getStandardVariantKey();
		} else {

			/* eslint-disable no-lonely-if */
			if (!this.getItemByKey(sId)) {
				sId = this.getStandardVariantKey();
			}
			/* eslint-enable no-lonely-if */
		}

		return sId;
	};

	/**
	 * Initializes the SAPUI5 layer with the flexibility services by retrieving the list of variants. Once the initialization has been completed, the
	 * control for personalization is informed via the initialise event.
	 * @public
	 * @param {function} fCallback Function will be called whenever the data for the personalizable control is received
	 * @param {sap.ui.core.Control} oPersoControl Current control that can be personalized
	 */
	SmartVariantManagement.prototype.initialise = function(fCallback, oPersoControl) {
		var oCurrentControlWrapper = null, oDefaultContent, that = this, sKey, bFlag, parameter = {
			variantKeys: []
		};

		try {

			if (oPersoControl && fCallback) {
				oCurrentControlWrapper = this._getControlWrapper(oPersoControl);
				if (!oCurrentControlWrapper) {
					jQuery.sap.log.error("initialise on an unknown control.");
					return;
				}

				if (oCurrentControlWrapper.bInitialized) {
					jQuery.sap.log.error("initialise on " + oPersoControl.getId() + " already executed");
					return;
				}

				oCurrentControlWrapper.fInitCallback = fCallback;

			} else if (!this.isPageVariant()) {
				oCurrentControlWrapper = this._getControlWrapper(this._oPersoControl);
			}

			if (this._oControlPromise && this._oPersoControl && oCurrentControlWrapper) {

				this._oControlPromise.then(function(mVariants) {

					if (that._bIsBeingDestroyed) {
						return;
					}

					if (!that._bIsInitialized) {
						that._bIsInitialized = true;

						parameter.variantKeys = that._createVariantEntries(mVariants);

						bFlag = that._getExecuteOnSelectOnStandardVariant();
						if (bFlag !== null) {
							that._executeOnSelectForStandardVariantByUser(bFlag);
						}

						sKey = that._getDefaultVariantKey();
						if (sKey) {
							oDefaultContent = that._getChangeContent(sKey);
							if (oDefaultContent) {
								that.setDefaultVariantKey(sKey); // set the default variant
								that.setInitialSelectionKey(sKey); // set the current selected variant
							}
						}

						if (that._sAppStandardVariantKey) {
							that._oAppStdContent = that._getChangeContent(that._sAppStandardVariantKey);
						}

					}
					that._initialize(parameter, oCurrentControlWrapper);

				}, function(args) {
					var sError = "'getChanges' failed:";
					if (args && args.message) {
						sError += (' ' + args.messages);
					}

					that._errorHandling(sError, fCallback, oPersoControl);
				});

			} else {
				this._errorHandling("'initialise' no personalizable component available", fCallback, oPersoControl);
			}

		} catch (ex) {
			this._errorHandling("'getChanges' throws an exception", fCallback, oPersoControl);
		}
	};

	SmartVariantManagement.prototype._errorHandling = function(sErrorText, fCallback, oPersoControl) {
		var parameter = {
			variantKeys: []
		};

		this._setErrorValueState(this.oResourceBundle.getText("VARIANT_MANAGEMENT_READ_FAILED"), sErrorText);

		if (fCallback && oPersoControl) {
			fCallback.call(oPersoControl);
		} else {
			this.fireEvent("initialise", parameter);
		}

		if (oPersoControl.variantsInitialized) {
			oPersoControl.variantsInitialized();
		}
	};

	SmartVariantManagement.prototype._initialize = function(parameter, oCurrentControlWrapper) {

		var sKey, oContent = null, bIsPageVariant = this.isPageVariant();

		if (this._oAppStdContent) {
			if ((oCurrentControlWrapper.type === "table") || (oCurrentControlWrapper.type === "chart")) {
				if (bIsPageVariant) {
					this._applyControlVariant(oCurrentControlWrapper.control, this._oAppStdContent, "STANDARD", true);
				} else {
					this._applyVariant(oCurrentControlWrapper.control, this._oAppStdContent, "STANDARD", true);
				}
			}
		}

		if (oCurrentControlWrapper.fInitCallback) {
			oCurrentControlWrapper.fInitCallback.call(oCurrentControlWrapper.control);
			delete oCurrentControlWrapper.fInitCallback;
			oCurrentControlWrapper.bInitialized = true;
		} else {
			this.fireEvent("initialise", parameter);
		}
		oCurrentControlWrapper.loaded.resolve();

		sKey = this.getSelectionKey();
		if (sKey && (sKey !== this.getStandardVariantKey())) {
			oContent = this._getChangeContent(sKey);
		} else if (this._oAppStdContent) {
			oContent = this._oAppStdContent;

			if ((oCurrentControlWrapper.type === "table") || (oCurrentControlWrapper.type === "chart")) {
				// chart and table are already applied with with STANDARD context
				oContent = null;
			}
		}

		if (this._sAppStandardVariantKey) {
			this._updateStandardVariant(oCurrentControlWrapper, this._oAppStdContent);
		} else {
			this._setStandardVariant(oCurrentControlWrapper);
		}

		if (oContent) {

			if (bIsPageVariant) {
				this._applyControlVariant(oCurrentControlWrapper.control, oContent, "INIT", true);
			} else {
				this._applyVariant(oCurrentControlWrapper.control, oContent, "INIT", true);
			}
		}

		if (oCurrentControlWrapper.control.variantsInitialized) {
			oCurrentControlWrapper.control.variantsInitialized();
		}

		if ((this._getCurrentVariantId() === this.getStandardVariantKey()) && this.getExecuteOnSelectForStandardVariant()) {
			if (oCurrentControlWrapper.control.search) {
				oCurrentControlWrapper.control.search();
			}
		}

	};

	SmartVariantManagement.prototype.setInitialState = function() {

		var sKey = this._getDefaultVariantKey() || this.getStandardVariantKey();
		if (sKey) {

			this.setInitialSelectionKey(sKey);

			this._triggerSelectVariant(sKey, "INIT_STATE");

		}

	};

	SmartVariantManagement.prototype._updateVariant = function(oVariantInfo) {

		if (this._isIndustrySolutionModeAndVendorLayer() || (oVariantInfo.key !== this.getStandardVariantKey())) {

			if (oVariantInfo) {
				var oChange = this._getChange(oVariantInfo.key);
				if (oChange) {
					try {

						if ((oVariantInfo.lifecycleTransportId !== null) && (oVariantInfo.lifecycleTransportId !== undefined)) {
							oChange.setRequest(oVariantInfo.lifecycleTransportId);
						}

						var oContent = this._fetchContent();
						if (oContent) {

							var oItem = this.getItemByKey(oVariantInfo.key);
							if (oItem) {
								oContent.executeOnSelection = oItem.getExecuteOnSelection();
							}

							if (oContent.standardvariant !== undefined) {
								delete oContent.standardvariant;
							}

							if (this._isIndustrySolutionModeAndVendorLayer() && (oVariantInfo.key === this.getStandardVariantKey())) {
								oContent.standardvariant = true;
							}

							oChange.setContent(oContent);
						}

					} catch (ex) {
						jQuery.sap.log.error("'_updateVariant' throws an exception");
					}
				}
			}
		}
	};

	SmartVariantManagement.prototype._createChangeHeader = function() {

		if (this.isPageVariant()) {
			return {
				type: "page",
				dataService: "n/a"
			};
		}

		var aCurrentControls = this._getAllPersonalizableControls();
		if (aCurrentControls && aCurrentControls.length > 0) {
			return {
				type: aCurrentControls[0].type,
				dataService: aCurrentControls[0].dataSource
			};
		}

	};

	SmartVariantManagement.prototype._newVariant = function(oVariantInfo) {

		var sId, oContent, oChange, bIsStandardVariant = false;

		if (oVariantInfo && this._oControlPersistence) {

			var oTypeDataSource = this._createChangeHeader();

			var bUserDependent = !oVariantInfo.global;

			var sPackage = "";
			if ((oVariantInfo.lifecyclePackage !== null) && (oVariantInfo.lifecyclePackage !== undefined)) {
				sPackage = oVariantInfo.lifecyclePackage;
			}

			var sTransportId = "";
			if ((oVariantInfo.lifecycleTransportId !== null) && (oVariantInfo.lifecycleTransportId !== undefined)) {
				sTransportId = oVariantInfo.lifecycleTransportId;
			}

			sId = this._isVariantDownport() ? oVariantInfo.key : null;
			// if (this._isIndustrySolutionModeAndVendorLayer() && ((this.getStandardVariantKey() === this.STANDARDVARIANTKEY) &&
			// this._isVariantDownport())) {
			if (this._isIndustrySolutionModeAndVendorLayer() && (this.getStandardVariantKey() === this.STANDARDVARIANTKEY)) {
				if ((sTransportId || sPackage) && (oVariantInfo.name === this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD"))) {
					this.setStandardVariantKey(sId);
					bIsStandardVariant = true;
				}
			}
			oContent = this._fetchContent();
			if (oContent) {
				if (oVariantInfo.exe) {
					oContent.executeOnSelection = oVariantInfo.exe;
				}
				if (oVariantInfo.tile) {
					oContent.tile = oVariantInfo.tile;
				}

				if (oContent.standardvariant !== undefined) {
					delete oContent.standardvariant;
				}
				// if (this._isIndustrySolutionModeAndVendorLayer() && ((oVariantInfo.key === this.STANDARDVARIANTKEY) || this._isVariantDownport()))
				// {
				if (bIsStandardVariant) {
					oContent.standardvariant = true;
				}
			}

			var mParams = {
				type: oTypeDataSource.type,
				ODataService: oTypeDataSource.dataSource,
				texts: {
					variantName: oVariantInfo.name
				},
				content: oContent,
				isVariant: true,
				packageName: sPackage,
				isUserDependent: bUserDependent,
				id: sId
			};

			sId = this._oControlPersistence.addChange(mParams);
			this.replaceKey(oVariantInfo.key, sId);
			this.setInitialSelectionKey(sId);

			// if (this.getIndustrySolutionMode() && oVariantInfo.key === this.STANDARDVARIANTKEY) {
			if (this._isIndustrySolutionModeAndVendorLayer() && ((oVariantInfo.key === this.STANDARDVARIANTKEY) || this._isVariantDownport())) {
				this.setStandardVariantKey(sId);
			}

			oChange = this._getChange(sId);
			if (oChange) {
				oChange.setRequest(sTransportId);

				var oItem = this.getItemByKey(sId);
				if (oItem) {
					oItem.setNamespace(oChange.getNamespace());
				}
			}

			if (oVariantInfo.def === true) {
				this._setDefaultVariantKey(sId);
			}

			// new variants are always created with favorite flag set
			this._setFavorite(sId);

		}
	};

	SmartVariantManagement.prototype._setFavorite = function(sId) {
		var oItem = this.getItemByKey(sId);
		if (oItem) {
			oItem.setFavorite(true);
		}

		this._addFavorites([
			{
				key: sId,
				visible: true
			}
		]);
	};

	SmartVariantManagement.prototype._fetchContent = function() {

		var oCurrentControlInfo, sPersKey, oContent, oControlContent = {};

		var aCurrentControls = this._getAllPersonalizableControls();

		for (var i = 0; i < aCurrentControls.length; i++) {

			oCurrentControlInfo = aCurrentControls[i];

			if (oCurrentControlInfo && oCurrentControlInfo.control && oCurrentControlInfo.control.fetchVariant) {

				oContent = oCurrentControlInfo.control.fetchVariant();
				if (oContent) {

// sContent = JSON.stringify(oContent);
// oContent = JSON.parse(sContent);

					if (oContent) {
						oContent = jQuery.extend(true, {}, oContent);
					}

					if (this.isPageVariant()) {

						sPersKey = this._getControlPersKey(oCurrentControlInfo);
						if (sPersKey) {
							// oControlContent[sPersKey] = oContent;
							oControlContent = this._assignContent(oControlContent, oContent, sPersKey);
						} else {
							jQuery.sap.log.error("no persistancy key retrieved");
						}

					} else {
						oControlContent = oContent;
						break;
					}
				}

			}
		}

		return oControlContent;

	};

	SmartVariantManagement.prototype._getControlPersKey = function(oCurrentControlInfo) {
		var sPersKey = null;

		if (oCurrentControlInfo.keyName) {
			if (oCurrentControlInfo.keyName === "id") {
				sPersKey = oCurrentControlInfo.control.getId();
			} else {
				sPersKey = oCurrentControlInfo.control.getProperty(oCurrentControlInfo.keyName);
			}
		} else {
			var oControlWrapper = this._getControlWrapper(oCurrentControlInfo);
			if (oControlWrapper && oControlWrapper.keyName) {
				if (oControlWrapper.keyName === "id") {
					sPersKey = oControlWrapper.control.getId();
				} else {
					sPersKey = oControlWrapper.control.getProperty(oControlWrapper.keyName);
				}
			}
		}

		return sPersKey;
	};

	SmartVariantManagement.prototype._newVariantContent = function(oCurrentControlInfo) {

		var oControlContent = null, oContent, sContent, sPersKey;

		if (oCurrentControlInfo && oCurrentControlInfo.control && oCurrentControlInfo.control.fetchVariant) {

			oContent = oCurrentControlInfo.control.fetchVariant();
			if (oContent) {

				sContent = JSON.stringify(oContent);
				oContent = JSON.parse(sContent);

				if (this.isPageVariant()) {

					sPersKey = this._getControlPersKey(oCurrentControlInfo);
					if (sPersKey) {
						oControlContent = {};
						// oControlContent[sPersKey] = oContent;
						oControlContent = this._assignContent(oControlContent, oContent, sPersKey);
					} else {
						jQuery.sap.log.error("no persistancy key retrieved");
					}

				} else {
					oControlContent = oContent;
				}
			}
		}

		return oControlContent;
	};

	SmartVariantManagement.prototype._appendLifecycleInformation = function(oVariant, sId) {

		var sTransportId;

		var oItem = this.getItemByKey(sId);

		if (oItem) {
			sTransportId = oItem.getLifecycleTransportId();
			if (sTransportId === null || sTransportId === undefined) {
				sTransportId = "";
			}

			if (oVariant) {
				oVariant.setRequest(sTransportId);
			}
		}

	};

	SmartVariantManagement.prototype._renameVariant = function(oVariantInfo) {

		if (oVariantInfo.key !== this.getStandardVariantKey()) {
			if (oVariantInfo) {
				var oChange = this._getChange(oVariantInfo.key);
				if (oChange) {
					oChange.setText("variantName", oVariantInfo.name);
					this._appendLifecycleInformation(oChange, oVariantInfo.key);
				}
			}
		}
	};

	SmartVariantManagement.prototype._deleteVariants = function(aVariantInfo) {
		var i;
		if (aVariantInfo && aVariantInfo.length) {

			var sVariantKey = this._getDefaultVariantKey();

			for (i = 0; i < aVariantInfo.length; i++) {

				// delete on standard variant only possible in vendor layer
				if (aVariantInfo[i] === this.getStandardVariantKey()) {

					if (!this._isIndustrySolutionModeAndVendorLayer()) {
						continue;
					} else {
						// reset to STANDARD
						this.setStandardVariantKey(this.STANDARDVARIANTKEY);
					}
				}

				var oChange = this._getChange(aVariantInfo[i]);
				if (oChange) {
					oChange.markForDeletion();
					if (sVariantKey && sVariantKey === aVariantInfo[i]) {
						this._setDefaultVariantKey("");
					}

					this._appendLifecycleInformation(oChange, aVariantInfo[i]);
				}
			}
		}
	};

	SmartVariantManagement.prototype._getDefaultVariantKey = function() {

		var sDefaultVariantKey = "";
		if (this._oControlPersistence) {
			sDefaultVariantKey = this._oControlPersistence.getDefaultVariantIdSync();
		}

		return sDefaultVariantKey;
	};

	SmartVariantManagement.prototype._setDefaultVariantKey = function(sVariantKey) {

		if (this._oControlPersistence) {
			this._oControlPersistence.setDefaultVariantIdSync(sVariantKey);
		}
	};

	SmartVariantManagement.prototype._getExecuteOnSelectOnStandardVariant = function() {

		var bExecuteOnSelect = null;
		if (this._oControlPersistence) {
			bExecuteOnSelect = this._oControlPersistence.getExecuteOnSelectSync();
		}

		return bExecuteOnSelect;
	};

	SmartVariantManagement.prototype._setExecuteOnSelectOnStandardVariant = function(bFlag) {

		if (this._oControlPersistence) {
			this._oControlPersistence.setExecuteOnSelectSync(bFlag);
		}
	};

	SmartVariantManagement.prototype._isVariantDownport = function() {

		var bDownport = false;
		if (this._oControlPersistence) {
			bDownport = this._oControlPersistence.isVariantDownport();
		}

		return bDownport;
	};

	SmartVariantManagement.prototype._getExecuteOnSelection = function(oVariant) {

		var oContent;

		if (oVariant) {
			oContent = oVariant.getContent();
			if (oContent && (oContent.executeOnSelection !== undefined)) {
				return oContent.executeOnSelection;
			}
		}

		return false;
	};

	SmartVariantManagement.prototype._hasStoredStandardVariant = function(oVariant) {

		var oContent;

		if (oVariant) {
			oContent = oVariant.getContent();
			if (oContent && oContent.standardvariant) {
				return oContent.standardvariant;
			}
		}

		return false;
	};

	SmartVariantManagement.prototype._isComponentTemplate = function(oControl) {

		var bIsTemplate = false;

		var oComponent = FlexUtils.getComponentForControl(oControl);

		// special case for SmartTemplating to reach the real appComponent
		if (oComponent && oComponent.getAppComponent) {
			oComponent = oComponent.getAppComponent();

			if (oComponent) {
				bIsTemplate = true;
			}

		}

		return bIsTemplate;

	};

	SmartVariantManagement.prototype._isApplicationVariant = function(oControl) {
		if (FlexUtils.isApplicationVariant(oControl)) {
			return true;
		}

		if (this._isComponentTemplate(oControl)) {
			return true;
		}

		return false;
	};

	SmartVariantManagement.prototype._setExecuteOnSelections = function(aVariantInfo) {

		var i;
		if (aVariantInfo && aVariantInfo.length) {

			for (i = 0; i < aVariantInfo.length; i++) {

				if (aVariantInfo[i].key === this.STANDARDVARIANTKEY) {
					this._setExecuteOnSelectOnStandardVariant(aVariantInfo[i].exe);
					continue;
				}

				var oChange = this._getChange(aVariantInfo[i].key);
				if (oChange) {
					var oJson = oChange.getContent();
					if (oJson) {
						oJson.executeOnSelection = aVariantInfo[i].exe;
						oChange.setContent(oJson);
					}

					this._appendLifecycleInformation(oChange, aVariantInfo[i].key);
				}
			}
		}
	};

	/**
	 * Save all variants.
	 * @private
	 * @param {boolean} bNewVariant indicates, if the save was triggered after new variant creation
	 * @param {boolean} bIgnoreVariantHandling indicates, if the save was triggered after new variant creation
	 */
	SmartVariantManagement.prototype._save = function(bNewVariant, bIgnoreVariantHandling) {

		var that = this;

		if (this._oControlPersistence) {
			try {
				this._oControlPersistence.saveAll().then(function() {

					if (!bIgnoreVariantHandling) {

						if (bNewVariant) {
							that._updateUser();
						}
						that.fireEvent("afterSave");
					}

				}, function(args) {
					var sError = "'_save' failed:";
					if (args && args.message) {
						sError += (' ' + args.messages);
					}
					that._setErrorValueState(that.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE_FAILED"), sError);
				});
			} catch (ex) {
				this._setErrorValueState(this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE_FAILED"), "'_save' throws an exception");
			}
		}
	};

	SmartVariantManagement.prototype._updateUser = function() {
		var sId = this.getInitialSelectionKey();
		var sUserName = this._getLRepUser(this._getChange(sId));
		if (sUserName) {
			this._assignUser(sId, sUserName);
		}
	};

	SmartVariantManagement.prototype._getLRepUser = function(oChange) {
		var sUserName = null;
		if (oChange && oChange.getDefinition() && oChange.getDefinition().support) {
			sUserName = oChange.getDefinition().support.user ? oChange.getDefinition().support.user : "";
		}

		return sUserName;
	};

	/**
	 * Eventhandler for the save event of the <code>SmartVariantManagement</code> control.
	 * @param {object} oVariantInfo Describes the variant to be saved
	 */
	SmartVariantManagement.prototype.fireSave = function(oVariantInfo) {

		var bSave = false, bNewVariant = true;
		var oEvent = {};

		if (oVariantInfo) {

			if (oVariantInfo.hasOwnProperty("tile")) {
				oEvent.tile = oVariantInfo.tile;
			}

			if (oVariantInfo.overwrite) {
				if (this._isIndustrySolutionModeAndVendorLayer() || (oVariantInfo.key !== this.getStandardVariantKey())) { // Prohibit save on
					// standard variant

					this.fireEvent("save", oEvent);

					if (oVariantInfo.key === this.STANDARDVARIANTKEY) {
						this._newVariant(oVariantInfo);
					} else {
						this._updateVariant(oVariantInfo);
						bNewVariant = false;
					}

					bSave = true;
				}
			} else {

				this.fireEvent("save", oEvent);
				this._newVariant(oVariantInfo);
				bSave = true;
			}

			if (bSave) {
				this._save(bNewVariant);
			}
		}
	};

	/**
	 * Eventhandler for the manage event of the <code>SmartVariantManagement</code> control. Raises the base class event for spacial handlings like
	 * save tile.
	 * @param {object} oVariantInfo Describes the variants that will be deleted/renamed
	 */
	SmartVariantManagement.prototype.fireManage = function(oVariantInfo) {

		var i;

		if (oVariantInfo) {

			if (oVariantInfo.renamed) {

				for (i = 0; i < oVariantInfo.renamed.length; i++) {
					this._renameVariant(oVariantInfo.renamed[i]);
				}
			}

			if (oVariantInfo.deleted) {
				this._deleteVariants(oVariantInfo.deleted);
			}

			if (oVariantInfo.exe) {
				this._setExecuteOnSelections(oVariantInfo.exe);
			}

			if (oVariantInfo.def) {

				var sDefaultVariantKey = this._getDefaultVariantKey();
				if (sDefaultVariantKey !== oVariantInfo.def) {
					this._setDefaultVariantKey(oVariantInfo.def);
				}
			}

			if (oVariantInfo.fav && (oVariantInfo.fav.length > 0)) {
				this._addFavorites(oVariantInfo.fav);
			}

			if ((oVariantInfo.deleted && oVariantInfo.deleted.length > 0) || (oVariantInfo.renamed && oVariantInfo.renamed.length > 0) || (oVariantInfo.exe && oVariantInfo.exe.length > 0) || oVariantInfo.def) {
				this._save();
			} else if (oVariantInfo.fav && (oVariantInfo.fav.length > 0)) {
				this._save(false, true);
			}

			this.fireEvent("manage", oVariantInfo);
		}

	};

	/**
	 * Eventhandler for the select event of the <code>SmartVariantManagement</code> control.
	 * @param {object} oVariantInfo Describes the selected variant
	 * @param {strinf} sContext context
	 */
	SmartVariantManagement.prototype.fireSelect = function(oVariantInfo, sContext) {

		if (this._oPersoControl && oVariantInfo && oVariantInfo.key) {
			this._triggerSelectVariant(oVariantInfo.key, sContext);

			this.fireEvent("select", oVariantInfo);
		}
	};

	SmartVariantManagement.prototype._selectVariant = function(sVariantKey, sContext) {
		this.fireSelect({
			key: sVariantKey
		}, sContext);
	};

	SmartVariantManagement.prototype._checkForSelectionHandler = function(sVariantKey) {

		var oHandler = null, aHandler = Object.keys(this._oSelectionVariantHandler);

		if (aHandler.length > -1) {

			aHandler.some(function(oKey) {
				if (sVariantKey.indexOf(oKey) === 0) {
					oHandler = this._oSelectionVariantHandler[oKey];
					return true;
				}

				return false;
			}.bind(this));

		}

		return oHandler;
	};

	SmartVariantManagement.prototype._triggerSelectVariant = function(sVariantKey, sContext) {

		var oContent, oHandler = this._checkForSelectionHandler(sVariantKey);

		if (oHandler) {
			oContent = this._triggerSpecialSelectVariant(sVariantKey, sContext, oHandler);
		} else {
			oContent = this._triggerGeneralSelectVariant(sVariantKey, sContext);
		}

		if (oContent) {
			if (this.isPageVariant()) {
				this._applyVariants(oContent, sContext);
			} else {
				this._applyVariant(this._oPersoControl, oContent, sContext);
			}
		}
	};

	SmartVariantManagement.prototype._triggerSpecialSelectVariant = function(sVariantKey, sContext, oHandler) {

		return oHandler.callback.call(oHandler.handler, sVariantKey, sContext);

	};

	SmartVariantManagement.prototype._triggerGeneralSelectVariant = function(sVariantKey, sContext) {

		var oContent = this._getChangeContent(sVariantKey);
		if (oContent) {
			var sContent = JSON.stringify(oContent);
			oContent = JSON.parse(sContent);

			if ((sVariantKey === this.STANDARDVARIANTKEY) && this.getExecuteOnSelectForStandardVariant()) {
				oContent.executeOnSelection = this.getExecuteOnSelectForStandardVariant();
			}
		}

		return oContent;
	};

	SmartVariantManagement.prototype._applyControlWrapperVariants = function(oControlWrapper, oContent, sContext) {
		var that = this;
		if (oControlWrapper) {
			oControlWrapper.loaded.then(function() {
				that._applyControlVariant(oControlWrapper.control, oContent, sContext);
			});
		}
	};

	SmartVariantManagement.prototype._applyVariants = function(oContent, sContext) {

		var i, aCurrentControls = this._getAllPersonalizableControls();

		for (i = 0; i < aCurrentControls.length; i++) {
			if (aCurrentControls[i] && aCurrentControls[i].control && aCurrentControls[i].loaded) {
				this._applyControlWrapperVariants(aCurrentControls[i], oContent, sContext);
			}
		}
	};

	/**
	 * Retrieves the standard variant from the ui - control.
	 * @private
	 * @param {sap.ui.comp.smartvariants.PersonalizableInfo} oCurrentControlInfo information about the control to be personalized
	 */
	SmartVariantManagement.prototype._setStandardVariant = function(oCurrentControlInfo) {

		var oCurrentControl = oCurrentControlInfo.control;

		if (oCurrentControl) {

			if (oCurrentControl.fireBeforeVariantSave) {
				oCurrentControl.fireBeforeVariantSave(VariantManagement.STANDARD_NAME); // to obtain the CUSTOM_DATA
			}

			this._assignStandardVariant(oCurrentControlInfo);
		}
	};

	SmartVariantManagement.prototype._retrieveContent = function(oContent, sPersKey) {

		var oRetContent = oContent;

		if (this.isPageVariant() && oContent) {
			oRetContent = oContent[sPersKey];
			if (!oRetContent && (sPersKey === this.getPersistencyKey()) && this._aPersonalizableControls && this._aPersonalizableControls.length === 1) {
				oRetContent = oContent;
			}
		}

		return oRetContent;
	};

	SmartVariantManagement.prototype._assignContent = function(oTargetContent, oContent, sPersKey) {

		if (this.isPageVariant()) {
			if (!((sPersKey === this.getPersistencyKey()) && this._aPersonalizableControls && this._aPersonalizableControls.length === 1)) {
				oTargetContent[sPersKey] = oContent;
			} else {
				oTargetContent = oContent;
			}
		} else {
			oTargetContent = oContent;
		}

		return oTargetContent;
	};

	SmartVariantManagement.prototype._updateStandardVariant = function(oCurrentControlInfo, oContent) {

		if (oCurrentControlInfo.control) {
			var oControlContent = oContent;
			if (this.isPageVariant()) {
				var sPersKey = this._getControlPersKey(oCurrentControlInfo);
				if (sPersKey) {
					// oControlContent = oContent[sPersKey];
					oControlContent = this._retrieveContent(oContent, sPersKey);
				}
			}

			this._assignStandardVariantForControl(oCurrentControlInfo, oControlContent);
		}
	};

	SmartVariantManagement.prototype._assignStandardVariant = function(oCurrentControlInfo) {

		var oStandardVariant = null;

		if (oCurrentControlInfo.control) {

			if (oCurrentControlInfo.control.fetchVariant) {
				oStandardVariant = oCurrentControlInfo.control.fetchVariant();
			}

			this._assignStandardVariantForControl(oCurrentControlInfo, oStandardVariant);
		}
	};

	SmartVariantManagement.prototype._assignStandardVariantForControl = function(oCurrentControlInfo, oStandardVariant) {

		var oControlContent = oStandardVariant;

		if (oCurrentControlInfo) {
			if (this.isPageVariant()) {
				var sPersKey = this._getControlPersKey(oCurrentControlInfo.control);
				if (sPersKey) {
					if (!this._oStandardVariant) {
						this._oStandardVariant = {};
					}
					this._oStandardVariant = this._assignContent(this._oStandardVariant, oControlContent, sPersKey);
				}
			} else {

				this._oStandardVariant = oControlContent;
			}
		}

	};

	/**
	 * Returns the standard variant.
	 * @public
	 * @param {sap.ui.core.Control} oCurrentControl Current personalizable control
	 * @returns {Object} The standard variant.
	 */
	SmartVariantManagement.prototype.getStandardVariant = function(oCurrentControl) {
		var sPersKey, oControlInfo, oContent = null;

		if (this._oStandardVariant) {

			if (!oCurrentControl) {
				oContent = this._oStandardVariant;
			} else {
				/* eslint-disable no-lonely-if */
				if (this.isPageVariant()) {
					oControlInfo = this._getControlWrapper(oCurrentControl);
					if (oControlInfo) {
						sPersKey = this._getControlPersKey(oCurrentControl);
						if (sPersKey) {
							// oContent = this._oStandardVariant[sPersKey];
							oContent = this._retrieveContent(this._oStandardVariant, sPersKey);
						}
					}
				} else {
					if ((oCurrentControl === this._oPersoControl)) {
						oContent = this._oStandardVariant;
					}
				}
				/* eslint-enable no-lonely-if */
			}
		}

		return oContent;
	};

	/**
	 * Appliance of the the standard variant.
	 * @private
	 * @param {sap.ui.core.Control} oCurrentControl Personalizable Control
	 * @param {object} oContent JSON object
	 * @param {string} sContext Describes in what context the apply was executed. The context will be forwarded, via the event
	 *        <code>afterVariantLoad</code> to the application.
	 * @param {boolean} bInitial indicates if this apply is called during the initialization phase.
	 */
	SmartVariantManagement.prototype._applyVariant = function(oCurrentControl, oContent, sContext, bInitial) {

		if (oCurrentControl && oCurrentControl.applyVariant) {

			oCurrentControl.applyVariant(oContent, sContext, bInitial);
		}
	};

	SmartVariantManagement.prototype._applyControlVariant = function(oControl, oContent, sContext, bInitial) {
		var oControlContent, sPersKey;

		sPersKey = this._getControlPersKey(oControl);
		if (sPersKey) {
			// oControlContent = oContent[sPersKey];
			oControlContent = this._retrieveContent(oContent, sPersKey);

			if (oControlContent) {

				// if (oContent.executeOnSelection && oControl.type === "filterBar") {
				oControlContent.executeOnSelection = oContent.executeOnSelection;
				// }

				this._applyVariant(oControl, oControlContent, sContext, bInitial);
			}
		}

	};

	/**
	 * Registers for a givven key prefix a select variant handler. For a givven key prefix only one handler is possible.
	 * @private
	 * @param {sap.ui.core.Control} oHandler receives the selectEvent
	 * @param {string} sKeyPrefix handler identifier
	 */
	SmartVariantManagement.prototype.registerSelectionVariantHandler = function(oHandler, sKeyPrefix) {
		this._oSelectionVariantHandler[sKeyPrefix] = oHandler;
	};

	/**
	 * Unregisters a select variant handler.
	 * @private
	 * @param {sap.ui.core.Control} oHandler receives the selectEvent
	 * @param {string} sKeyPrefix handler identifier
	 */
	SmartVariantManagement.prototype.unregisterSelectionVariantHandler = function(oHandler) {

		var sEntryToBeDeleted = null;

		if (!this._oSelectionVariantHandler) {
			return;
		}

		if (typeof oHandler === 'string') {
			sEntryToBeDeleted = oHandler;
		} else {

			Object.keys(this._oSelectionVariantHandler).some(function(oKey) {
				if (this._oSelectionVariantHandler[oKey].handler === oHandler) {
					sEntryToBeDeleted = oKey;
					return true;
				}
				return false;
			}.bind(this));
		}

		if (sEntryToBeDeleted) {
			delete this._oSelectionVariantHandler[sEntryToBeDeleted];
		}

	};

	/**
	 * Sets an error state on the variant management control.
	 * @private
	 * @param {string} sText describing the error reason
	 * @param {string} sLogText describing the error reason for logging
	 */
	SmartVariantManagement.prototype._setErrorValueState = function(sText, sLogText) {
		this.setInErrorState(true);

		if (sLogText) {
			jQuery.sap.log.error(sLogText);
		}
	};

	SmartVariantManagement.prototype.exit = function() {
		VariantManagement.prototype.exit.apply(this, arguments);

		this._aPersonalizableControls = null;

		this._oControlPersistence = null;
		// this._oControlComponent = null;
		this._oControlPromise = null;
		this._oPersoControl = null;

		this._oAppStdContent = null;
		this._sAppStandardVariantKey = null;

		this._oSelectionVariantHandler = null;

		this._aFavoriteChanges = null;
	};

	return SmartVariantManagement;

}, /* bExport= */true);
