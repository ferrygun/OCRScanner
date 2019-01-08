/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides class sap.ui.base.EventProvider
sap.ui.define(['jquery.sap.global', 'sap/ui/base/EventProvider', 'sap/ui/mdc/experimental/DataObjectMetadata'],
	function(jQuery, EventProvider, DataObjectMetadata) {
	"use strict";

	/**
	 * Base Class for Data Objects that represent defined data in the view model of a Provider.
	 * The Data Object defines properties only and creates access to those via Object set and get functions in the corresponding
	 * class DataObjectMetadata.
	 *
	 * Instances of DataObjects are mainly used within Providers and act as the Metadata description of the providers model.
	 * As they appear to the Provider as normal json objects, model functionality can stay mainly untouched.
	 *
	 * Data Objects are capable to define various layers. Predefined layer "base" is used for the initial default values.
	 * For every property multiple values can be stored. To use layers the layer needs to be added using the addLayer method.
	 * Using setProperty method a property can be set either for the currently active layer or a specified layer by its name.
	 *
	 * With the hideLayer and showLayer methods one can activate and deactivate the layers which will lead to different values to be returned.
	 * This feature can be used if the property values of a DataObject where added by different sources like ODataMetadata, settings of an application,
	 * settings of a key user and even special user settings.
	 *
	 * @see DataObjectMetadata.
	 *
	 */
	var DataObject = EventProvider.extend("sap.ui.mdc.experimental.DataObject", /* @lends sap.ui.base.EventProvider */ {

		constructor : function(mSettings, oProvider) {
			EventProvider.call(this);
			this._aLayers = [];
			this._aLayerImpl = [];
			this._aLayerContext = [];
			this._aInactiveLayers = [];
			this._sActiveLayer = "";
			this._mLayeredProperties = {};
			this._mProperties = null;
			this._mDefaultProperties = {};
			this.addLayer("base");
			this.applySettings(mSettings);
		},
		metadata : {
			properties : {
				/**
				 * The name of the data object. Normally a technical unique name.
				 */
				name : {
					type: "string",
					mandatory: true,
					unique: true,
					defaultValue : ""
				},
				/**
				 * The parent object of this DataObject, normally a Provider
				 */
				parent: {
					type: "any",
					defaultValue : {}
				},
				/**
				 * Special extension property allows access to the Adapter of the provider.
				 * There is no further type checking done in this case.
				 */
				extensions: {
					type: "any",
					defaultValue : {}
				}
			},
			events: {
				change:{}
			}
		}

	}, DataObjectMetadata);

	/**
	 * Returns the Adapter for this Data Object. The adapter is used to to ask for a value of a property. Normally the adapter needs to implement
	 * a method with the name of the property.
	 *
	 * @returns
	 */
	DataObject.prototype.getAdapter = function() {
		return this._oImpl;
	};

	/**
	 * Hides a layer with the given name if it exists. The "base" layer cannot the hidden.
	 * @param sName
	 */
	DataObject.prototype.hideLayer = function(sName) {
		var i = this._aLayers.indexOf(sName);
		if (i > 0) {
			this._aInactiveLayers.push(i);
		} else if (i == 0) {
			jQuery.sap.log.debug("Layer 'base' cannot be hidden");
		}
	};

	/**
	 * Shows a layer with given name if it exists. The "base" layer is always show.
	 * @param sName
	 */
	DataObject.prototype.showLayer = function(sName) {
		var i = this._aLayers.indexOf(sName);
		if (i > 0) {
			this._aInactiveLayers.splice(this._aInactiveLayers.indexOf(i));
		} else if (i == 0) {
			jQuery.sap.log.debug("Layer 'base' is always shown");
		}
	};

	/**
	 * Sets or adds a layer and makes it the active layer.
	 * All further property setters will write their changes into that layer.
	 *
	 * @param sName
	 * @param oImpl
	 * @param oContext
	 */
	DataObject.prototype.setLayer = function(sName, oImpl, oContext) {
		if (!this._mLayeredProperties[sName]) {
			this.addLayer(sName, oImpl, oContext);
		}
		this._sActiveLayer = sName;
	};

	/**
	 * Adds a layer and makes it the default layer
	 * @param sName
	 * @param oImpl
	 * @param oContext
	 */
	DataObject.prototype.addLayer = function(sName, oImpl, oContext) {
		if (this._aLayers.indexOf(sName) > -1 ) {
			jQuery.sap.log.debug("Layer with " + sName + " already exists");
			return;
		}
		this._aLayers.push(sName);
		this._aLayerImpl.push(oImpl);
		this._aLayerContext.push(oContext);

		this._mLayeredProperties[sName] = {};

		this._sActiveLayer = sName;
		this._mProperties = this._mLayeredProperties[this._sActiveLayer];
	};

	/**
	 * Checks whether a value is valid for a given property
	 * TODO: Currently this is always true.
	 * @param oProperty
	 * @param vValue
	 * @returns {Boolean}
	 */
	DataObject.prototype.isValid = function(oProperty, vValue) {
		return true;
	};

	/**
	 * Sets a property to the active or the active layer if it is not given.
	 * If oProperty is of type string it is assumed that the layer is a special "api" layer.
	 * Normally DataOject are not called directly via a setProperty instead each property has a
	 * Object property setter defined that is used normally.
	 * @param oProperty
	 * @param vValue
	 * @param sLayer
	 */
	DataObject.prototype.setProperty = function(oProperty, vValue, sLayer) {
		if (typeof oProperty === "string") {
			this.addLayer("api");
			oProperty = this.getMetadata().getProperty(oProperty);
		}
		if (this.isValid(oProperty, vValue)) {
			if (sLayer) {
				var i = this._aLayers.indexOf(sLayer);
				if (i === -1) {
					return;
				}
				this._mLayeredProperties[this._aLayers[i]][oProperty.name] = vValue;
			} else {
				this._mProperties[oProperty.name] = vValue;
			}
		}
	};
	/**
	 * Returns a property for a specific layer. If restrict layer is set to true lower layers will not be taken into account.
	 *
	 * @param oProperty
	 * @param sLayer
	 * @param bRestrictLayer
	 * @returns
	 */
	DataObject.prototype.getLayeredProperty = function(oProperty, sLayer, bRestrictLayer) {
		var vValue, i;
		if (typeof oProperty === "string") {
			oProperty = this.getMetadata().getProperty(oProperty);
		}
		if (!sLayer) {
			sLayer = this._sActiveLayer;
		}
		i = this._aLayers.indexOf(sLayer) || this._aLayers.length - 1;
		while (vValue === undefined && i > -1) {
			if (this._aInactiveLayers.indexOf(i) > -1) {
				i--;
				continue;
			}
			vValue = this._mLayeredProperties[this._aLayers[i]][oProperty.name];
			this._iActiveContextLayer = i;
			if (vValue === undefined) {
				var oImpl = this._aLayerImpl[i];
				if (oImpl && oImpl[oProperty.name]) {
					vValue = oImpl[oProperty.name].apply(this, [vValue]);
				}
			}
			if (vValue === undefined && i == 0) {
				if (typeof oProperty.defaultValue === "function") {
					vValue =  oProperty.defaultValue.apply(this);
				} else {
					this._mLayeredProperties[this._aLayers[i]][oProperty.name] = vValue = JSON.parse(JSON.stringify(oProperty.defaultValue));
				}
			}
			i--;
			if (bRestrictLayer) {
				break;
			}
		}
		return vValue;
	};
	/**
	 * Returns the value of a property
	 * @param oProperty
	 * @returns
	 */
	DataObject.prototype.getProperty = function(oProperty) {
		return this.getLayeredProperty(oProperty);
	};

	/**
	 * Returns the context of the currently active layer.
	 * @returns
	 */
	DataObject.prototype.getContext = function() {
		return this._aLayerContext[this._iActiveContextLayer];
	};

	/**
	 * Returns all properties of the DataObject.
	 * @returns {___anonymous7556_7557}
	 */
	DataObject.prototype.getProperties = function() {
		var mProperties = this._mProperties;
		var mResult = {};
		for (var n in mProperties) {
			mResult[n] = mProperties[n];
			if (typeof mProperties[n] === "object" && mProperties[n].hasOwnProperty("length")) {
				mResult[n] = [];
				for (var i = 0; i < mProperties[n].length; i++) {
					if (mProperties[n][i] instanceof DataObject) {
						mResult[n][i] = mProperties[n][i].getProperties();
					}
				}
			}
		}
		return mResult;
	};
	/**
	 * Applies the properties defined in mSettings to the DataObject.
	 * @param mSettings
	 * @returns {DataObject}
	 */
	DataObject.prototype.applySettings = function(mSettings) {
		// PERFOPT: don't retrieve (expensive) JSONKeys if no settings are given
		if ( !mSettings || jQuery.isEmptyObject(mSettings) ) {
			return this;
		}

		var oMetadata = this.getMetadata(),
			mValidKeys = oMetadata.getJSONKeys(), // UID names required, they're part of the documented contract of applySettings
			sKey, oValue, oKeyInfo;

		// process all settings
		// process settings
		for (sKey in mSettings) {
			oValue = mSettings[sKey];
			// get info object for the key
			if ( (oKeyInfo = mValidKeys[sKey]) !== undefined ) {
				switch (oKeyInfo._iKind) {
				case 0: // PROPERTY
					this[oKeyInfo.name] = oValue;
					break;
				case 5: // EVENT
					if ( typeof oValue == "function" ) {
						this[oKeyInfo._sMutator](oValue);
					} else {
						this[oKeyInfo._sMutator](oValue[0], oValue[1], oValue[2]);
					}
					break;
				case -1: // SPECIAL_SETTING
					// No assert
				default:
					break;
				}
			} else {
				// there must be no unknown settings
				jQuery.sap.assert(false, "DataObject.apply: encountered unknown setting '" + sKey + "' for class '" + oMetadata.getName() + "' (value:'" + oValue + "')");
			}
		}

		return this;
	};

	/**
	 * Returns a JSON representation that can be used to store the data of this DataObject in the current stage.
	 * A layer name can be given to create the json based on the given layer, ignoring upper layers.
	 * @param sLayer
	 * @returns {___anonymous9164_9165}
	 */
	DataObject.prototype.toJSON = function(sLayer) {
		var sCurrentLayer = this._sActiveLayer,
			mProperties = this.getMetadata().getAllProperties(),
			oResult = {};
		if (sLayer) {
			this._sActiveLayer = sLayer;
		}
		for (var n in mProperties) {
			if (n === "parent") {
				continue;
			}
			oResult[n] = this[n];
		}
		this._sActiveLayer = sCurrentLayer;
		return oResult;
	};

	return DataObject;
});
