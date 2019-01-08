/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2017 SAP SE. All rights reserved
 */

// Provides class sap.ui.experimental.DataObjectMetadata
sap.ui.define(['jquery.sap.global', 'sap/ui/base/DataType', 'sap/ui/base/Metadata'],
	function(jQuery, DataType, Metadata) {
	"use strict";

	/**
	 * Creates a new metadata object that describes a subclass of DataObject.
	 *
	 * @author SAP SE
	 * @version 1.52.4
	 * @since 1.46.0
	 * @alias sap.ui.experimental.DataObjectMetadata
	 * @experimental
	 * @private
	 */
	var DataObjectMetadata = function(sClassName, oClassInfo) {

		// call super constructor
		Metadata.apply(this, arguments);

	};

	// chain the prototypes
	DataObjectMetadata.prototype = Object.create(Metadata.prototype);

	var hasOwnProperty = Object.prototype.hasOwnProperty;

	function capitalize(sName) {
		return sName.charAt(0).toUpperCase() + sName.slice(1);
	}

//	var rPlural = /(children|ies|ves|oes|ses|ches|shes|xes|s)$/i;
//	var mSingular = {'children' : -3, 'ies' : 'y', 'ves' : 'f', 'oes' : -2, 'ses' : -2, 'ches' : -2, 'shes' : -2, 'xes' : -2, 's' : -1 };

//	function guessSingularName(sName) {
//		return sName.replace(rPlural, function($,sPlural) {
//			var vRepl = mSingular[sPlural.toLowerCase()];
//			return typeof vRepl === "string" ? vRepl : sPlural.slice(0,vRepl);
//		});
//	}

	function deprecation(fn, name) {
		return function() {
			jQuery.sap.log.warning("Usage of deprecated feature: " + name);
			return fn.apply(this, arguments);
		};
	}

//	function remainder(obj, info) {
//		var result = null;
//
//		for (var n in info) {
//			if ( hasOwnProperty.call(info, n) && typeof obj[n] === 'undefined' ) {
//				result = result || {};
//				result[n] = info[n];
//			}
//		}
//
//		return result;
//	}
	var Kind = {
		SPECIAL_SETTING : -1, PROPERTY : 0, EVENT : 5
	};

	// ---- SpecialSetting --------------------------------------------------------------------

	/**
	 * SpecialSetting info object
	 * @private
	 * @since 1.27.1
	 */
	function SpecialSetting(oClass, name, info) {
		info = typeof info !== 'object' ? { type: info } : info;
		this.name = name;
		this.type = info.type || 'any';
		this.visibility = info.visibility || 'public';
		this._oParent = oClass;
		this._sUID = "special:" + name;
		this._iKind = Kind.SPECIAL_SETTING;
	}

	// ---- Property --------------------------------------------------------------------------

	/**
	 * Property info object
	 * @private
	 * @since 1.27.1
	 */
	function Property(oClass, name, info) {
		info = typeof info !== 'object' ? { type: info } : info;
		this.name = name;
		this.type = info.type || 'string';
		this.group = info.group || 'Misc';
		this.defaultValue = info.defaultValue !== null ? info.defaultValue : null;
		this.sGetter = "get" + this.name.substring(0,1).toUpperCase() + this.name.substring(1);
		this.mandatory = !!info.mandatory;
		this.visibility = 'private';
		this._oParent = oClass;
		this._sUID = name;
		this._iKind = Kind.PROPERTY;
		this._oType = null;
	}

	/**
	 * @private
	 */
	Property.prototype.generate = function(add) {
		var that = this;
		add(
			that.name,
			function() {
				return this.getProperty(that);
			},
			function (value) {
				return this.setProperty(that, value);
			}
		);
	};

	Property.prototype.getType = function() {
		return this._oType || (this._oType = DataType.getType(this.type));
	};


	// ---- Event -----------------------------------------------------------------------------

	/**
	 * Event info object
	 * @private
	 * @since 1.27.1
	 */
	function Event(oClass, name, info) {
		this.name = name;
		this.allowPreventDefault = info.allowPreventDefault || false;
		this.deprecated = info.deprecated || false;
		this.visibility = 'public';
		this.allowPreventDefault = !!info.allowPreventDefault;
		this.enableEventBubbling = !!info.enableEventBubbling;
		this._oParent = oClass;
		this._sUID = 'event:' + name;
		this._iKind = Kind.EVENT;
		var N = capitalize(name);
		this._sMutator = 'attach' + N;
		this._sDetachMutator = 'detach' + N;
		this._sTrigger = 'fire' + N;
	}

	/**
	 * @private
	 */
	Event.prototype.generate = function(add) {
		var that = this,
			n = that.name,
			allowPreventDefault = that.allowPreventDefault,
			enableEventBubbling = that.enableEventBubbling;

		add(that._sMutator, function(d,f,o) { this.attachEvent(n,d,f,o); return this; }, that);
		add(that._sDetachMutator, function(f,o) { this.detachEvent(n,f,o); return this; });
		add(that._sTrigger, function(p) { return this.fireEvent(n,p, allowPreventDefault, enableEventBubbling); });
	};

	Event.prototype.attach = function(instance,data,fn,listener) {
		return instance[this._sMutator](data,fn,listener);
	};

	Event.prototype.detach = function(instance,fn,listener) {
		return instance[this._sDetachMutator](fn,listener);
	};

	Event.prototype.fire = function(instance,params, allowPreventDefault, enableEventBubbling) {
		return instance[this._sTrigger](params, allowPreventDefault, enableEventBubbling);
	};

	// ----------------------------------------------------------------------------------------

	DataObjectMetadata.prototype.metaFactorySpecialSetting = SpecialSetting;
	DataObjectMetadata.prototype.metaFactoryProperty = Property;
	DataObjectMetadata.prototype.metaFactoryEvent = Event;

	/**
	 * @private
	 */
	DataObjectMetadata.prototype.applySettings = function(oClassInfo) {

		var that = this,
			oStaticInfo = oClassInfo.metadata;

		Metadata.prototype.applySettings.call(this, oClassInfo);

		function normalize(mInfoMap, FNClass) {
			var mResult = {},
				sName;

			if ( mInfoMap ) {
				for (sName in mInfoMap) {
					if ( hasOwnProperty.call(mInfoMap, sName) ) {
						mResult[sName] = new FNClass(that, sName, mInfoMap[sName]);
					}
				}
			}

			return mResult;
		}

		var rLibName = /([a-z][^.]*(?:\.[a-z][^.]*)*)\./;

		function defaultLibName(sName) {
			var m = rLibName.exec(sName);
			return (m && m[1]) || "";
		}

		// init basic metadata from static infos and fallback to defaults
		this._sLibraryName = oStaticInfo.library || defaultLibName(this.getName());
		this._mSpecialSettings = normalize(oStaticInfo.specialSettings, this.metaFactorySpecialSetting);
		this._mProperties = normalize(oStaticInfo.properties, this.metaFactoryProperty);
		this._mEvents = normalize(oStaticInfo.events, this.metaFactoryEvent);

		if ( oClassInfo.metadata.__version > 1.0 ) {
			this.generateAccessors();
		}

	};

	/**
	 * @private
	 */
	DataObjectMetadata.prototype.afterApplySettings = function() {

		Metadata.prototype.afterApplySettings.call(this);

		// if there is a parent class, produce the flattened "all" views for the element specific metadata
		// PERFOPT: this could be done lazily
		var oParent = this.getParent();
		if ( oParent && oParent instanceof DataObjectMetadata ) {
			this._mAllEvents = jQuery.extend({}, oParent._mAllEvents, this._mEvents);
			this._mAllProperties = jQuery.extend({}, oParent._mAllProperties, this._mProperties);
			this._mAllSpecialSettings = jQuery.extend({}, oParent._mAllSpecialSettings, this._mSpecialSettings);
		} else {
			this._mAllEvents = this._mEvents;
			this._mAllProperties = this._mProperties;
			this._mAllSpecialSettings = this._mSpecialSettings;
		}
	};

	DataObjectMetadata.Kind = Kind;

	/**
	 * Returns the name of the library that contains the described UIElement.
	 * @return {string} the name of the library
	 * @public
	 */
	DataObjectMetadata.prototype.getLibraryName = function() {
		return this._sLibraryName;
	};

	// ---- properties ------------------------------------------------------------------------

	/**
	 * Declares an additional property for the described class.
	 *
	 * Any property declaration via this method must happen before the described class
	 * is subclassed, or the added property will not be visible in the subclass.
	 *
	 * Typically used to enrich UIElement classes in an aspect oriented manner.
	 * @param {string} sName name of the property to add
	 * @param {object} oInfo metadata for the property
	 * @public
	 * @see sap.ui.core.EnabledPropagator
	 */
	DataObjectMetadata.prototype.addProperty = function(sName, oInfo) {
		var oProp = this._mProperties[sName] = new Property(this, sName, oInfo);
		if (!this._mAllProperties[sName]) {// ensure extended AllProperties meta-data is also enriched
			this._mAllProperties[sName] = oProp;
		}
		// TODO notify listeners (subclasses) about change
	};

	/**
	 * Checks the existence of the given property by its name
	 * @param {string} sName name of the property
	 * @return {boolean} true, if the property exists
	 * @public
	 */
	DataObjectMetadata.prototype.hasProperty = function(sName) {
		return !!this._mAllProperties[sName];
	};

	/**
	 * Returns an info object for the named public property of the described class,
	 * no matter whether the property was defined by the class itself or by one of its
	 * ancestor classes.
	 *
	 * If neither the described class nor its ancestor classes define a property with the
	 * given name, <code>undefined</code> is returned.
	 *
	 * @param {string} sName name of the property
	 * @returns {Object} An info object describing the property or <code>undefined</code>
	 * @public
	 * @since 1.27.0
	 * @experimental Type, structure and behavior of the returned info object is not documented
	 *   and therefore not part of the API. See the {@link #constructor Notes about Info objects}
	 *   in the constructor documentation of this class.
	 */
	DataObjectMetadata.prototype.getProperty = function(sName) {
		var oProp = this._mAllProperties[sName];
		// typeof is used as a fast (but weak) substitute for hasOwnProperty
		return typeof oProp === 'object' ? oProp : undefined;
	};

	/**
	 * Returns a map of info objects for the public properties of the described class.
	 * Properties declared by ancestor classes are not included.
	 *
	 * The returned map keys the property info objects by their name.
	 *
	 * @return {map} Map of property info objects keyed by the property names
	 * @public
	 * @experimental Type, structure and behavior of the returned info objects is not documented
	 *   and therefore not part of the API. See the {@link #constructor Notes about Info objects}
	 *   in the constructor documentation of this class.
	 */
	DataObjectMetadata.prototype.getProperties = function() {
		return this._mProperties;
	};

	/**
	 * Returns a map of info objects for all public properties of the described class,
	 * including public properties from the ancestor classes.
	 *
	 * The returned map keys the property info objects by their name.
	 *
	 * @return {map} Map of property info objects keyed by the property names
	 * @public
	 * @experimental Type, structure and behavior of the returned info objects is not documented
	 *   and therefore not part of the API. See the {@link #constructor Notes about Info objects}
	 *   in the constructor documentation of this class.
	 */
	DataObjectMetadata.prototype.getAllProperties = function() {
		return this._mAllProperties;
	};

	/**
	 * Returns an info object for a public setting with the given name that either is
	 * a managed property or a managed aggregation of cardinality 0..1 and with at least
	 * one simple alternative type. The setting can be defined by the class itself or
	 * by one of its ancestor classes.
	 *
	 * If neither the described class nor its ancestor classes define a suitable setting
	 * with the given name, <code>undefined</code> is returned.
	 *
	 * @param {string} sName name of the property like setting
	 * @returns {Object} An info object describing the property or aggregation or <code>undefined</code>
	 * @public
	 * @since 1.27.0
	 * @experimental Type, structure and behavior of the returned info object is not documented
	 *   and therefore not part of the API. See the {@link #constructor Notes about Info objects}
	 *   in the constructor documentation of this class.
	 */
	DataObjectMetadata.prototype.getPropertyLikeSetting = function(sName) {
		// typeof is used as a fast (but weak) substitute for hasOwnProperty
		var oProp = this._mAllProperties[sName];
		if ( typeof oProp === 'object' ) {
			return oProp;
		}
		oProp = this._mAllAggregations[sName];
		// typeof is used as a fast (but weak) substitute for hasOwnProperty
		return ( typeof oProp === 'object' && oProp.altTypes && oProp.altTypes.length > 0 ) ? oProp : undefined;
	};

	// ---- events ----------------------------------------------------------------------------

	/**
	 * Checks the existence of the given event by its name
	 *
	 * @param {string} sName name of the event
	 * @return {boolean} true, if the event exists
	 * @public
	 */
	DataObjectMetadata.prototype.hasEvent = function(sName) {
		return !!this._mAllEvents[sName];
	};

	/**
	 * Returns an info object for the named public event of the described class,
	 * no matter whether the event was defined by the class itself or by one of its
	 * ancestor classes.
	 *
	 * If neither the described class nor its ancestor classes define an event with the
	 * given name, <code>undefined</code> is returned.
	 *
	 * @param {string} sName name of the event
	 * @returns {Object} An info object describing the event or <code>undefined</code>
	 * @public
	 * @since 1.27.0
	 * @experimental Type, structure and behavior of the returned info object is not documented
	 *   and therefore not part of the API. See the {@link #constructor Notes about Info objects}
	 *   in the constructor documentation of this class.
	 */
	DataObjectMetadata.prototype.getEvent = function(sName) {
		var oEvent = this._mAllEvents[sName];
		// typeof is used as a fast (but weak) substitute for hasOwnProperty
		return typeof oEvent === 'object' ? oEvent : undefined;
	};

	/**
	 * Returns a map of info objects for the public events of the described class.
	 * Events declared by ancestor classes are not included.
	 *
	 * The returned map keys the event info objects by their name.
	 *
	 * @return {map} Map of event info objects keyed by event names
	 * @public
	 * @experimental Type, structure and behavior of the returned info objects is not documented
	 *   and therefore not part of the API. See the {@link #constructor Notes about Info objects}
	 *   in the constructor documentation of this class.
	 */
	DataObjectMetadata.prototype.getEvents = function() {
		return this._mEvents;
	};

	/**
	 * Returns a map of info objects for all public events of the described class,
	 * including public events form the ancestor classes.
	 *
	 * The returned map keys the event info objects by their name.
	 *
	 * @return {map} Map of event info objects keyed by event names
	 * @public
	 * @experimental Type, structure and behavior of the returned info objects is not documented
	 *   and therefore not part of the API. See the {@link #constructor Notes about Info objects}
	 *   in the constructor documentation of this class.
	 */
	DataObjectMetadata.prototype.getAllEvents = function() {
		return this._mAllEvents;
	};

	// ---- special settings ------------------------------------------------------------------


	/**
	 * Adds a new special setting.
	 * Special settings are settings that are accepted in the mSettings
	 * object at construction time or in an {@link sap.ui.experimental.DataObject.applySettings}
	 * call but that are neither properties, aggregations, associations nor events.
	 *
	 * @param {string} sName name of the setting
	 * @param {object} oInfo metadata for the setting
	 * @private
	 * @experimental since 1.35.0
	 */
	DataObjectMetadata.prototype.addSpecialSetting = function (sName, oInfo) {
		var oSS = new SpecialSetting(this, sName, oInfo);
		this._mSpecialSettings[sName] = oSS;
		if (!this._mAllSpecialSettings[sName]) {
			this._mAllSpecialSettings[sName] = oSS;
		}
	};

	/**
	 * Checks the existence of the given special setting.
	 * Special settings are settings that are accepted in the mSettings
	 * object at construction time or in an {@link sap.ui.experimental.DataObject.applySettings}
	 * call but that are neither properties, aggregations, associations nor events.
	 *
	 * @param {string} sName name of the settings
	 * @return {boolean} true, if the special setting exists
	 * @private
	 * @experimental Since 1.27.0
	 */
	DataObjectMetadata.prototype.hasSpecialSetting = function (sName) {
		return !!this._mAllSpecialSettings[sName];
	};

	// ----------------------------------------------------------------------------------------

	/**
	 * Returns a map of default values for all properties declared by the
	 * described class and its ancestors, keyed by the property name.
	 *
	 * @return {map} Map of default values keyed by property names
	 * @public
	 */
	DataObjectMetadata.prototype.getPropertyDefaults = function() {

		var mDefaults = this._mDefaults,
			oType;
		if ( mDefaults ) {
			return mDefaults;
		}

		if ( this.getParent() instanceof DataObjectMetadata ) {
			mDefaults = jQuery.sap.newObject(this.getParent().getPropertyDefaults());
		} else {
			mDefaults = {};
		}

		for (var s in this._mProperties) {
			if ( this._mProperties[s].defaultValue !== null ) {
				mDefaults[s] = this._mProperties[s].defaultValue;
			} else {
				oType = DataType.getType(this._mProperties[s].type);
				if (oType instanceof DataType) {
					mDefaults[s] = oType.getDefaultValue();
				}
			}
		}
		this._mDefaults = mDefaults;
		return mDefaults;
	};

	DataObjectMetadata.prototype.createPropertyBag = function() {
		if ( !this._fnPropertyBagFactory ) {
			this._fnPropertyBagFactory = jQuery.sap.factory(this.getPropertyDefaults());
		}
		return new (this._fnPropertyBagFactory)();
	};

	/**
	 * Returns a map with all settings of the described class..
	 * Mainly used for the {@link sap.ui.experimental.DataObject#applySettings} method.
	 *
	 * @see sap.ui.experimental.DataObject#applySettings
	 * @private
	 */
	DataObjectMetadata.prototype.getJSONKeys = function() {

		if ( this._mJSONKeys ) {
			return this._mJSONKeys;
		}

		var mAllSettings = {},
			mJSONKeys = {};

		function addKeys(m) {
			var sName, oInfo, oPrevInfo;
			for (sName in m) {
				oInfo = m[sName];
				oPrevInfo = mAllSettings[sName];
				if ( !oPrevInfo || oInfo._iKind < oPrevInfo._iKind ) {
					mAllSettings[sName] = mJSONKeys[sName] = oInfo;
				}
				mJSONKeys[oInfo._sUID] = oInfo;
			}
		}

		addKeys(this._mAllSpecialSettings);
		addKeys(this.getAllProperties());
		addKeys(this.getAllEvents());

		this._mJSONKeys = mJSONKeys;
		this._mAllSettings = mAllSettings;
		return this._mJSONKeys;
	};

	/**
	 * @private
	 */
	DataObjectMetadata.prototype.getAllSettings = function() {
		if ( !this._mAllSettings ) {
			this.getJSONKeys();
		}
		return this._mAllSettings;
	};


	DataObjectMetadata.prototype.generateAccessors = function() {

		var proto = this.getClass().prototype,
			prefix = this.getName() + ".",
			methods = this._aPublicMethods,
			n;

		function add(name, getter, setter) {
			if (!proto.hasOwnProperty(name) ) {
				Object.defineProperty(proto, name, {
					get : getter,
					set : setter
				});
			}
		}
		function addEvent(name, fn, info) {
			if ( !proto[name] ) {
				proto[name] = (info && info.deprecated) ? deprecation(fn, prefix + info.name) : fn;
			}
			methods.push(name);
		}

		for (n in this._mProperties) {
			this._mProperties[n].generate(add);
		}
		for (n in this._mEvents) {
			this._mEvents[n].generate(addEvent);
		}
	};

	return DataObjectMetadata;

}, /* bExport= */ true);
