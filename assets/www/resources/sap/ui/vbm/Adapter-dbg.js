/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

// Provides class sap.ui.vbm.Adapter
sap.ui.define([
	'sap/ui/core/Element', './library'
], function(Element, library) {
	"use strict";

	var log = jQuery.sap.log;

	/**
	 * Constructor for a new GeoMap Adapter.
	 *
	 * @class
	 * Provides the ability to load VBI JSON into {@link sap.ui.vbm.GeoMap sap.ui.vbm.GeoMap} control.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new object
	 * @author SAP SE
	 * @version 1.52.4
	 * @extends sap.ui.core.Element
	 * @constructor
	 * @public
	 * @alias sap.ui.vbm.Adapter
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.48.0 This class is experimental and might be modified or removed in future versions.
	 */
	var Adapter = Element.extend("sap.ui.vbm.Adapter", /** @lends sap.ui.vbm.Adapter.prototype */ {
		metadata: {

			library: "sap.ui.vbm",

			publicMethods: [
				"load"
			],

			associations: {
				/**
				 * The GeoMap control associated with the Adapter. The adapter would invoke methods and subscribe to events
				 * on this GeoMap instance
				 *
				 **/
				map: {
					type: "sap.ui.vbm.GeoMap"
				}
			},

			events: {
				/**
				 * The event is raised when a when the Adapter receives an event from GeoMap control. It is intended to unify the various
				 * GeoMap events as provided by VBI.
				 */
				submit: {
					parameters: {
						data: {
							type: "string"
						}
					}
				}
			}
		}
	});

	Adapter.prototype.init = function() {
		this._eventHandlers = [];

		//initialize section
		this._mapConfiguration = {};
		this._clusterVOs = [];

		//Dictionary for Data Attributes
		this._dataTypes = {};
		this._data = {};

		this._groupedActions = {};

		this._clickHandler = this._genericClickHandler;
		this._handler = this._genericGeomapHandler;

		this._idKeyMap = {};

		//Properties in VBI JSON that need special handling
		this._propsAnomalies = new Map();
		this._propsAnomalies.set("pos", "position");
		this._propsAnomalies.set("posarray", "position");
		this._propsAnomalies.set("dragdata", "dragData");

		// Allowed Route properties
		this._routeProperties = [
			"color",
			"colorBorder",
			"directionIndicator",
			"dotcolor",
			"dotwidth",
			"dragdata",
			"end",
			"hotDeltaColor",
			"labelBgColor",
			"labelPos",
			"labelText",
			"lineDash",
			"linewidth",
			"posarray",
			"selectColor",
			"start",
			"tooltip"];

			// Allowed Spot properties
		this._spotProperties = [
			"alignment",
			"contentOffset",
			"dragdata",
			"fxdir",
			"fxsize",
			"hotDeltaColor",
			"icon",
			"image",
			"labelBgColor",
			"labelPos",
			"labelText",
			"pos",
			"selectColor",
			"tooltip",
			"semanticType"];
	};

	Adapter.prototype.exit = function() {
		this._detachHandlers();
	};

	Adapter.prototype.setMap = function(map) {
		var oldMap = this._map() || null;
		var newMap = sap.ui.getCore().byId(map instanceof sap.ui.vbm.GeoMap ? map.getId() : map);

		if ((oldMap != newMap) && (oldMap != null)) {
			this._detachHandlers();
			this.init();
		}
		this.setAssociation("map", map, true);


		if (newMap != null) {
			var oModel = new sap.ui.model.json.JSONModel();
			newMap.setModel(oModel);
		}
	};

	/**
	 * Intrernal helper function to get map object out of map association

	 * @returns {sap.ui.vbm.GeoMap} The instance of Geomap
	 * @private
	 */
	Adapter.prototype._map = function() {
		return sap.ui.getCore().byId(this.getMap());
	};

	/**
	 * Attaches the specified event handler to the specified event with the provided listener.
	 * Mainly used for custom events - FCODE_SELECT & DETAILS_FCODE_SELECT
	 *
	 *
	 * @param {string} eventName The name of the event on 'this' to which the handler needs to be attached. <br/>
	 * @param {function} handler The handler needs to be attached. <br/>
	 * @param {object} listener The listener - would turn out to be value of 'this' inside the event handler. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._attachHandler = function(eventName, handler, listener) {
		if ((eventName in this.mEventRegistry) && (this.mEventRegistry[eventName].length > 0)) {
			return this;
		} else {
			if (!listener._eventHandlers.some(function(eh) { return eh === handler; })) {
				listener._eventHandlers.push(handler);
			}
			this.attachEvent(eventName, handler, listener);
			return this;
		}
	};

	/**
	 * Detaches the adapter's event handlers from the instance of GeoMap instance associated with GeoMap
	 *
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._detachHandlers = function() {
		var that = this;
		var detachHandlers = function(sEventId) {
			if (this.hasListeners(sEventId)) {
				var aEventListeners = this.mEventRegistry[sEventId];

				for (var i = 0, iL = aEventListeners.length; i < iL; i++) {
					var index = that._eventHandlers.indexOf(aEventListeners[i].fFunction);
					if (index !== -1 ) {
						this.detachEvent(sEventId, aEventListeners[i].fFunction, aEventListeners[i].oListener);
					}
				}
			}
		};

		var geoMap = this._map();
		if (geoMap != null) {
			var oMapEvents = geoMap.mEventRegistry;

			for (var aEvent in oMapEvents) {
				if (oMapEvents.hasOwnProperty(aEvent)) {
					detachHandlers.call(geoMap, aEvent);
				}
			}

			var detachVoHandlers = function(oVo) {
				var oVoEvents = oVo.mEventRegistry;

				for (var aVoEvent in oVoEvents) {
					if (oVoEvents.hasOwnProperty(aVoEvent)) {
						detachHandlers.call(oVo, aVoEvent);
					}
				}
			};

			geoMap.getVos().forEach(detachVoHandlers);
		}

		return this;
	};

	/**
	 * Parses and process sections of the VBI JSON and loads them into JSON Model bound to the GeoMap
	 *
	 * @param {string | object} data VBI JSON to be loaded into the GeoMap control. <br/>
	 * @returns {Promise} A Promise object that is resolved when the VBI JSON is processed.
	 * @public
	 */
	Adapter.prototype.load = function(data) {
		var obj = null;

		if (typeof data === 'string') {
			try {
				obj = JSON.parse(data);
			} catch (ex) {
				log.debug("sap.ui.vbm.Adapter: attempt to load invalid JSON string.");
				return this;
			}
		} else if (typeof data === 'object') {
			obj = data;
		}

		if (!obj) {
			log.debug("sap.ui.vbm.Adapter: nothing to load.");
			return this;
		}
		if (!obj.SAPVB) {
			log.debug("sap.ui.vbm.Adapter:invalid object supplied for load.");
			return this;
		}
		if (obj.SAPVB.Config) {
			this._processConfiguration(obj.SAPVB.Config);
		}
		if (obj.SAPVB.Resources) {
			this._processResources(obj.SAPVB.Resources);
		}
		if (obj.SAPVB.DataTypes) {
			this._processDataTypes(obj.SAPVB.DataTypes);
		}
		//this has to be processed before scene to mark cluster VOs which must not be created
		if (obj.SAPVB.Clustering) {
			this._processClusters(obj.SAPVB.Clustering);
		}

		return (obj.SAPVB.MapProviders ? this._processMapProviders(obj.SAPVB.MapProviders)
			: Promise.resolve()).then(function() {
				if (obj.SAPVB.MapLayerStacks) {
					this._processMapLayerStacks(obj.SAPVB.MapLayerStacks);
				}

				if (obj.SAPVB.Scenes) {
					this._processScenes(obj.SAPVB.Scenes);
				}

				if (obj.SAPVB.Data) {
					this._processData(obj.SAPVB.Data);
				}

				if (obj.SAPVB.Actions) {
					this._processActions(obj.SAPVB.Actions);
				}

				if (obj.SAPVB.Automation && obj.SAPVB.Automation.Call) {
					this._processAutomation(obj.SAPVB.Automation, obj.SAPVB.Menus);
				}

				if (obj.SAPVB.Windows) {
					this._processDetailWindows(obj);
				}
			}.bind(this));
	};

	/**
	 * Processes the Configuration section of the VBI JSON
	 *
	 * @param {object} configuration Configuration section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processConfiguration = function(configuration) {
		return this;
	};

	/**
	 * Processes the Resources section of the VBI JSON. Delta load is not supported for resources.
	 *
	 * @param {object} resources Resources section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processResources = function(resources) {
		if (resources.Set) {
			var geoMap = this._map();
			geoMap.destroyResources();

			[].concat(resources.Set.Resource).forEach(function(res) {
				geoMap.addResource(new sap.ui.vbm.Resource({"name": res.name, "value": res.value}));
			}, this);
		}

		//Delta load of resources isn't supported from back-end - Need not check resources.Remove

		return this;
	};

	/**
	 * Processes the DataTypes section of the VBI JSON. Delta load is supported for this section but VBI back-end does not
	 * provide an option for it.
	 *
	 * @param {object} dataTypes DataTypes section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processDataTypes = function(dataTypes) {
		if (dataTypes.Set) {
			// Delta - The below check is an assumption - There is now way this can be true since none of the
			// simple transformations on the backend support delta on Data types yet.
			if (dataTypes.Set.name && dataTypes.Set.type && (dataTypes.Set.type === "N")) {
				[].concat(dataTypes.Set.N).foreach(function(dt) {
					this._dataTypes.forEach(function(_dt) {
						if (_dt.name == dt.name) {
							_dt = dt;
						}
					});
				});
			} else {
				// This is Replace all Data types
				this._dataTypes = [].concat(dataTypes.Set.N);
			}
		}
		return this;
	};

	/**
	 * Processes the Data section of the VBI JSON. Delta load is supported for this section.
	 *
	 * @param {object} data Data section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processData = function(data) {
		/*
		 * Helper function to perform a lookup of the DataTypes and fetch the name of the attribute from its alias and data type name
		 *
		 * */
		var findAttribute = function(a, name) {
			var oEntry = sap.ui.vbm.findInArray(this._dataTypes, function(_dt) { return _dt.name == name; });

			if ((oEntry == null) || !(oEntry.A)) {
				return undefined;
			} else {
				var oAttr = sap.ui.vbm.findInArray(oEntry.A, function(_a) { return _a.alias == a; });
				if (oAttr != null) {
					return oAttr.name;
				} else {
					return undefined;
				}
			}
		};

		var set = function(n) {
			if (n.name && n.E) {
				this._data[n.name] = [].concat(n.E).map(function(e) {
					var d = {};
					for (var a in e) {
						if ((a !== "xmlns:VB") &&
							(a !== "n.name") &&
							e.hasOwnProperty(a)) {
							if (a === "VB:c") {
								d["changeable"] = e[a];
							} else if (a === "VB:s") {
								d["select"] = e[a];
							} else {
								var sAttr = findAttribute.call(this, a, n.name);
								if ((sAttr != null) && (sAttr !== "")) {
									d[sAttr] = e[a];
								} else {
									d[a] = e[a];
								}
							}
						}
					}

					return d;
				}, this);
			}
		};

		var update = function(e) {
			var d = {};
			for (var a in e) {
				if ((a !== "xmlns:VB") &&
					(a !== "n.name") &&
					e.hasOwnProperty(a)) {
					if (a === "VB:c") {
						d["changeable"] = e[a];
					} else if (a === "VB:s") {
						d["select"] = e[a];
					} else {
						var sAttr = findAttribute.call(this, a, e["n.name"]);
						if ((sAttr != null) && (sAttr !== "")) {
							d[sAttr] = e[a];
						} else {
							d[a] = e[a];
						}
					}
				}
			}

			//If the aggregation doesn't exist, initialize it to an empty array.
			if (!this._data[e["n.name"]]) {
				this._data[e["n.name"]] = [];
			}

			if (this._data[e["n.name"]].some(function(_d) {return _d.Key == e.K;})) {
				// The instance (Spot) already exists - modify it
				var index = sap.ui.vbm.findIndexInArray(this._data[e["n.name"]], function(_d) { return _d.Key === e.K; });
				if (index !== -1) {
					this._data[e["n.name"]][index] = d;
				}
			} else {
				// The instance (Spot) doesn't exist - push it
				this._data[e["n.name"]].push(d);
			}
		};

		if (data.Remove) {
			[].concat(data.Remove).filter(function(r) {
				return (r.N && r.N.E);
			}).forEach(function(r) {
				[].concat(r.N.E).forEach(function(e) {
					var index = sap.ui.vbm.findIndexInArray(this._data[r.name], function(_d) { return _d.Key === e.K; });

					if (index !== -1) {
						this._data[r.name].splice(index, 1);
					}
				}, this);
			}, this);
		}

		/*
		 * The key to differentiating delta load from full update is the structure of
		 * data.Set. See simple transformation VBI_DYN_DATA_TRANSFER
		 *
		 * --> Delta Load
		 * "Data" : {
		 * 	"Set": [
		 * 		{ "name": "Spots", "type": "N", ....},
		 *      { "name": "Links", "type": "N", ....},
		 * 	]
		 * }
		 *
		 * --> Full Update
		 *	"Data": {
	  	 *		"Set": {
		 *			"N": [
		 *				{ "name": "Spots", ... },
		 *				{ "name": "Links", ... },
		 *			]
		 *		}
		 *	}
		 *
		 *  Conditions to differentiate full update from full load
		 *  	Data.Set, is an object, does not have has attributes other than N (namely name & type)
		 *  	Other wise delta load
		 * */

		if (data.Set && (typeof data.Set === 'object') && !(jQuery.isEmptyObject(data.Set))) {
			if (!Array.isArray(data.Set) && !(data.Set.name) && !(data.Set.type)) {
				//Full Update - Replace complete Data Section
				this._data = {};
				if (data.Set.N !== null) {
					[].concat(data.Set.N).forEach(set, this);
				}

			} else {
				//Delta Update
				[].concat(data.Set)
					.filter(function(s) { return (s.name) && (s.type); })
					.map(function(s) { return [].concat(s.N); })
					.reduce(function(oAn, oBn) { return oAn.concat(oBn); })
					.map(function(n) {
						var e = [].concat(n.E);
						return e.map(function(_e) {
							_e["n.name"] = n.name;
							return _e;
						});
					})
					.reduce(function(oAe, oBe) { return oAe.concat(oBe); })
					.forEach(update, this);
			}
		}

		this._map().getModel().setData(this._data, false);
		return this;
	};

	/**
	 * Processes the MapProviders section of the VBI JSON. Delta load is supported for this section.
	 *
	 * @param {object} providers MapProviders section of VBI JSON transformed into map provider structure for GeoMap. <br/>
	 * @returns {Promise} A Promise object that is resolved when the MapProviders in VBI JSON is processed.
	 * @private
	 */
	Adapter.prototype._processMapProviders = function(providers) {
		if (providers.Set && providers.Set.MapProvider) { //support only for "set" verb
			var mapProviders = [].concat(providers.Set.MapProvider).map(function(provider) {
				return {
					name 		: provider.name,
					tileX		: provider.tileX,
					tileY		: provider.tileY,
					minLOD		: provider.minLOD,
					maxLOD		: provider.maxLOD,
					copyright	: provider.copyright,
					Source 		: provider.Source ? [].concat(provider.Source).map(function(source) {
						return {
							id	: source.id,
							url	: source.url
						};
					}) : provider.Source
				};
			});

			var googleSniffer = function(source) {
				// var sRegex = /:\/\/(.[^/]+)/;
				// var sHostname = sUrl.match(sRegex)[1];
				// return jQuery.sap.endsWith(sHostname, "googleapis.com");
				return source && source.url && source.url.indexOf("google") !== -1;
			};

			var aGoogleTileApiSources = mapProviders
				.map(function(oProvider) { return [].concat(oProvider.Source); })
				.reduce(function(a, b) { return a.concat(b); })
				.filter(googleSniffer);

			if (aGoogleTileApiSources.length > 0) {
				var apiKeys = [];
				var oGoogleTileApiSourcesByApiKey = aGoogleTileApiSources.reduce(function(g, a) {
					var apiKey = a.url.split("key=")[1];
					g[apiKey] = g[apiKey] || [];
					if (sap.ui.vbm.findIndexInArray(apiKeys, function(k) { return k === apiKey; } ) === -1) {
						apiKeys.push(apiKey);
					}
					g[apiKey].push(a);
					return g;
				}, {});

				var getSessionResponse = function(apiKey) {
					return new Promise(function(resolve, reject) {
						var xmlHttp = new XMLHttpRequest();
						xmlHttp.open("POST", 'https://www.googleapis.com/tile/v1/createSession?key=' + apiKey, true); // true for asynchronous
						xmlHttp.setRequestHeader("Content-Type", "application/json");

						xmlHttp.onreadystatechange = function() {
							if (xmlHttp.readyState == 4) {
								if (xmlHttp.status == 200) {
									resolve(JSON.parse(xmlHttp.responseText));
								} else {
									reject(new Error(xmlHttp.statusText));
								}
							}
						};

						var parameters = {
							"mapType": "terrain",
							"language": "en-NZ",
							"region": "nz",
							"layerTypes": [ "layerRoadmap" ],
							"overlay":  false,
							"scale": "scaleFactor1x"
						};
						xmlHttp.send(JSON.stringify(parameters));

					}).then(function(response) {
						// Expected URL from backend
						// https://www.googleapis.com/tile/v1/tiles/{Z}/{X}/{Y}?key=YOUR_API_KEY
						if (response && response.session) {
							oGoogleTileApiSourcesByApiKey[apiKey].forEach(function(source) {
								source.url = source.url + "&session=" + response.session;
							});
						}
					}, function(statusText) {
						log.debug(statusText);
					});
				};

				return Promise.all(apiKeys.map(getSessionResponse)).then(function() {
					this._mapConfiguration.MapProvider = mapProviders;
					this._updateMapconfiguration();
				}.bind(this));
			} else {
				this._mapConfiguration.MapProvider = mapProviders;
				this._updateMapconfiguration();
				return Promise.resolve();
			}
		}
		return this;
	};

	/**
	 * Processes the MapLayerStacks section of the VBI JSON. Delta load is supported for this section.
	 *
	 * @param {object} stacks MapLayerStacks section of VBI JSON transformed into map layer stacks structure for GeoMap. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processMapLayerStacks = function(stacks) {
		if (stacks.Set && stacks.Set.MapLayerStack) { //support only for "set" verb
			this._mapConfiguration.MapLayerStacks = [].concat(stacks.Set.MapLayerStack).map(function(stack) {
				return {
					name		: stack.name,
					MapLayer 	: stack.MapLayer ? [].concat(stack.MapLayer).map(function(layer) {
						return {
							name			: layer.name,
							refMapProvider	: layer.refMapProvider,
							opacity			: layer.opacity,
							colBkgnd		: layer.colBkgnd
						};
					}) : stack.MapLayer
				};
			});
			this._updateMapconfiguration();
		}
		return this;
	};

	/**
	 * Sets the GeoMap's Map configuration to the transformed MapLayerStacks and MapProviders from VBI JSON.
	 *
	 * @param {object} mapLayerStacks MapLayerStacks section of VBI JSON transformed into map layer stacks structure for GeoMap. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._updateMapconfiguration = function() {
		if (this._mapConfiguration.MapProvider && this._mapConfiguration.MapLayerStacks) {
			this._map().setMapConfiguration(this._mapConfiguration);
		}
		return this;
	};

	/**
	 * Processes the VOs array from VBI JSON VBI JSON.
	 *
	 * @param {object[]} oScenes Scenes section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processScenes = function(oScenes) {
		//Process VOs only if scene is SceneGeo
		if (oScenes.Set && oScenes.Set.SceneGeo) {
			var oMap = this._map();

			if (oScenes.Set.SceneGeo.refMapLayerStack) {
				oMap.setRefMapLayerStack(oScenes.Set.SceneGeo.refMapLayerStack);
			}

			var vos = oScenes.Set.SceneGeo.VO;
			oMap.destroyVos();

			if (!vos) {
				return this;
			}

			vos.forEach(function(definition) {
				// skip cluster VOs as we're converting from Spots (VO) based clustering to container based clustering on a fly and do not need cluster VOs at all
				// see _processCluster() for details
				if (this._clusterVOs.indexOf(definition.id) !== -1) {
					return;
				}
				var voTemplate, voAggregation, boundProperties = [], settings = {};

				function processProperties(allowedAttributes, propsAnomalies) {
					for (var attribute in definition) {
						var pos = attribute.indexOf('.bind');
						var property = pos !== -1 ? attribute.substring(0, pos) : attribute;

						if (allowedAttributes.indexOf(property) !== -1) {
							property = propsAnomalies.get(property) || property;
							var value = definition[attribute];

							if (pos !== -1) {
								value = definition[attribute].substring(definition[attribute].indexOf('.') + 1);
								boundProperties.push(value);
							}
							settings[property] = pos !== -1 ? "{" + value + "}" : value;
						}
					}
				}
				// This function doesn't support data binding for Drag'N'Drop related subnodes
				// as it will require to change loading for data types and data sections from list like approach to full tree approach
				function processDragAndDrop() {
					if (definition.DragSource && voAggregation.getMetadata().hasAggregation("dragSource")) {
						[].concat(definition.DragSource.DragItem).forEach(function(item) {
							voAggregation.addDragSource(new sap.ui.vbm.DragSource({
								type: item.type
							}));
						});
					}
					if (definition.DropTarget && voAggregation.getMetadata().hasAggregation("dropTarget")) {
						[].concat(definition.DropTarget.DropItem).forEach(function(item) {
							voAggregation.addDropTarget(new sap.ui.vbm.DropTarget({
								type: item.type
							}));
						});
					}
				}

				switch (definition.type) {
					case "{00100000-2012-0004-B001-64592B8DB964}": // Spot
						processProperties(this._spotProperties, this._propsAnomalies);
						voTemplate = new sap.ui.vbm.Spot(settings);
						voAggregation = new sap.ui.vbm.Spots(definition.id);
						processDragAndDrop();
						break;
					case "{00100000-2012-0004-B001-C46BD7336A1A}": // Route
						processProperties(this._routeProperties, this._propsAnomalies);
						voTemplate = new sap.ui.vbm.Route(settings);
						voAggregation = new sap.ui.vbm.Routes(definition.id);
						processDragAndDrop();
						break;
					case "{00100000-2012-0004-B001-F311DE491C77}": // Area
					case "{00100000-2013-0004-B001-7EB3CCC039C4}": // Circle
					case "{00100000-2013-0004-B001-686F01B57873}": // Geo Circle
					case "{00100000-2012-0004-B001-BFED458C3076}": // Box
					case "{00100000-2012-0004-B001-383477EA1DEB}": // Pie Chart
					case "ExtLink": // GUID???
					case "ExtArea": // GUID???
					default:
						log.debug("unsupported VO type: " + definition.type);
						return;
				}

				var index = sap.ui.vbm.findIndexInArray(this._dataTypes, function(_d) { return _d.name === definition.datasource; });

				if (index !== -1) {
					var dataType = this._dataTypes[index];
					/*
					* REF-1
					* The back-end eventing is based on the Key attribute for each VO from the Data section.
					* However, GeoMap does not consider these values. This becomes a problem when converting a GeoMap event into
					* Adapter's submit event - the key corresponding to the VO (ex. Spot) which is the object of the event (clicked) needs to embedded into
					* the event payload to enable backend to continue with it's event pipeline.
					*
					* Hence, the below binds this key to an addition attribute stored on the model bound to the VOAggregation so that the same can be retrieved.
					* */
					voTemplate.bindProperty("key", { path: dataType.key });
					boundProperties.push(dataType.key);

					// custom properties handling
					var customProperties = [];

					dataType.A.forEach(function(attribute) {
						if (boundProperties.indexOf(attribute.name) === -1) {
							customProperties.push(attribute.name);
							var data = new sap.ui.core.CustomData({
								key: attribute.name,
								value: "{" + attribute.name + "}"
							});
							voTemplate.addCustomData(data);
						}
					});

					if (customProperties.length) {
						voAggregation.setCustomProperties(customProperties);
					}
					voAggregation.bindAggregation("items", {
						path: "/" + definition.datasource + "",
						template: voTemplate
					});
				} else {
					voAggregation.addItem(voTemplate);
				}
				oMap.addVo(voAggregation);
			}.bind(this));
		}
		return this;
	};

	/**
	 * Processes the VOs array from VBI JSON.
	 *
	 * @param {object} actions Actions section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processActions = function(actions) {
		var attach = function(obj) {
			return function(ga) {
				switch (ga.refEvent) {
					case "Click":
						if (!this._eventHandlers.some(function(eh) { return eh === this._handler; }, this)) {
							this._eventHandlers.push(this._handler);
						}
						obj.attachClick(this._handler, this);
						break;
					case "ContextMenu":
						if (!this._eventHandlers.some(function(eh) { return eh === this._handler; }, this)) {
							this._eventHandlers.push(this._handler);
						}
						obj.attachContextMenu(this._handler, this);
						break;
					case "DoubleClick":
						if (!this._eventHandlers.some(function(eh) { return eh === this._clickHandler; }, this)) {
							this._eventHandlers.push(this._clickHandler);
						}
						obj.attachClick(this._clickHandler, this);
						break;
					case "Drop":
						if (!this._eventHandlers.some(function(eh) { return eh === this._handler; }, this)) {
							this._eventHandlers.push(this._handler);
						}
						obj.attachDrop(this._handler, this);
						break;
					default:
						break;
				}
			};
		};
		//var matchingVo = function(t) { return function(v) { return v.getId() == t; }; };
		if ((actions.Set != null) &&
			(actions.Set.Action != null)) {

			var vos = this._map().getVos();
			var voTypes = vos.map(function(v) { return v.getTemplateObject().type; });

			this._groupedActions = [].concat(actions.Set.Action)
									.reduce(function(g, a) {
										var group = a.refVO;
										if (!a.refVO) {
											group = "General";
										}
										g[group] = g[group] || [];
										g[group].push(a);
										return g;
									}, {});

			var keyPressFinder = function(t) { return t.refEvent === "KeyPress"; };
			var clickFinder = function(a) { return a.refEvent === "Click"; };
			var doubleClickFinder = function(a) { return a.refEvent === "DoubleClick"; };
			var clickSkipper = function(a) { return a.refEvent !== "Click"; };
			var type;

			for (var group in this._groupedActions) {
				switch (group) {
					case "Spot":
						type = "{00100000-2012-0004-B001-64592B8DB964}";
						break;
					case "Link":
						type = "{00100000-2012-0004-B001-C46BD7336A1A}";
						break;
					case "Map":
						type = group;
						break;
					default:
						type = "";
						break;
				}
				var obj = type === "Map" ? this._map() : vos[voTypes.indexOf(type)];

				if (obj) {
					var groupedActions = this._groupedActions[group];

					if (groupedActions.some(doubleClickFinder)) {
						if (groupedActions.some(clickFinder)) {
							groupedActions.filter(clickSkipper).forEach(attach(obj), this);
						} else {
							groupedActions.forEach(attach(obj), this);
						}
					} else {
						groupedActions.forEach(attach(obj), this);
					}
				}

				if (group === "General") {
					var keyPressAction = sap.ui.vbm.findInArray(this._groupedActions[group], keyPressFinder);
					if (keyPressAction != null) {
						this._setupKeyboardEvents(keyPressAction);
					}
				}
			}
		}
		return this;
	};

	/**
	 * Processes the KeyPress Action from VBI JSON.
	 *
	 * @param {object} action KeyPress Action from Action section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._setupKeyboardEvents = function(action) {
		var that = this;
		var geoMap = this._map();
		geoMap.setAllowKeyEventRepeat(false);
		geoMap.setKeyEventDelay(250);

		var handler = function(event) {
			var param = event.mParameters;
			if (param.key == "Shift" || param.code == 16 ||
				param.key == "Control" || param.code == 17 ||
				param.key == "Alt" || param.code == 18 ||
				param.key == "Meta" || param.code == 91) {
				return that;
			}
			var data = {
				"version": "2.0",
				"xmlns:VB": "VB",
				"Action": {
					"name": action.name,
					"Params": {
						"Param": [
							{
								"name": "code",
								"#": param.code
							},
							{
								"name": "shift",
								"#": param.shift
							},
							{
								"name": "ctrl",
								"#": param.ctrl
							},
							{
								"name": "alt",
								"#": param.alt
							},
							{
								"name": "meta",
								"#": param.meta
							}
						]
					}
				}
			};
			that.fireSubmit({data: JSON.stringify(data)});
		};

		if (!this._eventHandlers.some(function(eh) { return eh === handler; }, this)) {
			this._eventHandlers.push(handler);
		}
		this._map().attachKeyDown(handler);
		return this;
	};

	/**
	 * Processes the Automation section from VBI JSON.
	 *
	 * @param {object} automation Automation section of VBI JSON. <br/>
	 * @param {object} menus Menus section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processAutomation = function(automation, menus) {

		var call = {};

		//If ContextMenu Automation, then the instance ID needs to be patched from VBI (Ex: Spot.NEC1sJ/qHta0xL4LqkzyXg==) to Geo JSON Unique Id
		//Else while returning the FCODE selected event, in OnGeomapSubmit, it wouldn't be able to find an instance for the event.

		// This won't work since the action of the event from VBI would be what's specified in the Menus section of VBI JSON and there is no way
		// that event can be subscribed to.

		if (automation.Call.handler === "CONTEXTMENUHANDLER") {
			var that = this;

			//Fetch the VO with matching Key
			var oVos = this._map().getVos()
				.map(function(oVoAggregation) { return oVoAggregation.getItems(); })
				.reduce(function(oVoA, oVoB) { return oVoA.concat(oVoB); });

			var index = sap.ui.vbm.findIndexInArray(oVos, function(v) { return v.getKey() === automation.Call.instance.split('.')[1]; });
			if (index !== -1) {
				var oVo = oVos[index];

				if (oVo) {
					automation.Call.instance = oVo.getUniqueId();

					if (menus.Set.Menu) {
						[].concat(menus.Set.Menu).forEach(function(oMenu) {
							that._attachHandler.call(
									oVo,
									oMenu.action,
									function(oEvent) {
										var oEventData = oEvent.mParameters.data;
										oEventData.Action.instance = oEventData.Action.object + '.' + oEvent.oSource.getKey();

										this.fireSubmit({
											data: JSON.stringify(oEventData)
										});
									},
									that);
						});
					}
				}
			}
		}

		call["Automation"] = automation;
		call["Menus"] = menus;

		var oLoad = {};
		oLoad["SAPVB"] = call;

		this._map().load(oLoad);
		return this;
	};

	/**
	 * Processes the Clustering section of the VBI JSON
	 *
	 * @param {object} clusters Clustering section of VBI JSON. <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processClusters = function(clusters) {
		this._clusterVOs = []; //always clear list of cluser VOs

		if (clusters.Set) {
			var map = this._map();
			map.destroyClusters();

			[].concat(clusters.Set.Cluster).forEach(function(item) {
				//mark cluster VOs, to avoid creating them later in scene processing
				this._clusterVOs.push(item.VO);
				var cluster = null;
				//convert cluster definition
				switch (item.type) {
					case "distance":
						cluster = new sap.ui.vbm.ClusterDistance(item.id);
						if (item.distance) {
							cluster.setDistance(parseFloat(item.distance));
						}
						break;
					case "grid":
						cluster = new sap.ui.vbm.ClusterGrid(item.id);
						if (item.limit) {
							cluster.setLimit(parseInt(item.limit, 10));
						}
						if (item.limitOnSum) {
							cluster.setLimitTotal(parseInt(item.limitOnSum, 10));
						}
						if (item.order) {
							cluster.setOrderIndex(parseInt(item.order, 10));
						}
						if (item.areabordersize) {
							cluster.setCellSpacing(-parseInt(item.areabordersize, 10));
						}
						if (item.distanceX && item.distanceY) {
							cluster.setGridSize(item.distanceX + ";" + item.distanceY);
						}
						if (item.offsetX && item.offsetY) {
							cluster.setOffset(item.offsetX + ";" + item.offsetY);
						}
						break;
					case "tree":
						cluster = new sap.ui.vbm.ClusterTree(item.id, {});
						break;
					default:
						log.debug("sap.ui.vbm.Adapter: unsupported clustering type \"" + item.type + "\"" );
						break;
				}
				if (cluster) {
					//process common properties
					if (item.rule) {
						cluster.setRule(item.rule);
					}
					cluster.setTextSettings({
						textcolor: item.textcolor,
						textfont: item.textfont,
						textfontsize: item.textfontsize,
						textoffset: item.textoffset,
						textoffsetY: item.textoffsetY
					});
					cluster.setVizTemplate(new sap.ui.vbm.Cluster()); //must be container based cluster
					map.addCluster(cluster);
				}
			}, this);
		}
		return this;
	};

	/**
	 * Processes the Windows section of the VBI JSON
	 *
	 * @param {object} obj oSAPVB VBI JSON in entirety since processing detail window needs multiple sections <br/>
	 * @returns {sap.ui.vbm.Adapter} <code>this</code> to allow method chaining.
	 * @private
	 */
	Adapter.prototype._processDetailWindows = function(obj) {
		//No transformation needed for removal - pass it along to VBI as is.

		var oGeoMap = this._map();
		var that = this;

		/*Only delta supported for Windows - Set*/
		if (obj.SAPVB.Windows.Set.name) {

			var findPredicate =  function(prop, name) {
				return function(d) {
					return d[prop] === name;
				};
			};

			var aWindows = [].concat(obj.SAPVB.Windows.Set).map(function(wnd) {

				var oModelData = oGeoMap.getModel().getData();

				var oWindow = wnd;

				for (var sAttribute in wnd.Window) {
					if (wnd.Window.hasOwnProperty(sAttribute)) {
						if (jQuery.sap.endsWith(sAttribute, ".bind")) {
							//Only known bound attribute is pos - known to have a value like Spots.+hY+jTn2HueNpLoqrc5IAg==.GeoPosition
							if (jQuery.sap.startsWith(sAttribute, "pos")) {
								var aParameters = wnd.Window[sAttribute].split(".");
								if (aParameters[0] in oModelData) {
									var index = sap.ui.vbm.findIndexInArray(oModelData[aParameters[0]], findPredicate("Key", aParameters[1]));

									if (index !== -1) {
										var oData = oModelData[aParameters[0]][index];

										if (aParameters[2] in oData) {
											delete oWindow.Window[sAttribute];
											oWindow.Window[sAttribute.split(".")[0]] = oData[aParameters[2]];
										}
									}
								}
							}
						}
					}
				}
				return oWindow;
			}, this);

			obj.SAPVB.Windows.Set = aWindows;

			//Dereference VOs
			if (obj.SAPVB.Scenes && obj.SAPVB.Scenes.Set && obj.SAPVB.Scenes.Set.name && obj.SAPVB.Scenes.Set.Scene && obj.SAPVB.Scenes.Set.Scene.VO) {

				var aVOs = [].concat(obj.SAPVB.Scenes.Set.Scene.VO).map(function(v) {
					var oVO = v;

					var dereferenceBoundAttributes = function(oVO, sAttribute, aParameters) {
						return function(s) {
							if (s.name && s.type) {
								var oDataList = s[s.type];
								if (oDataList.name === s.name) {
									var oDataType = sap.ui.vbm.findInArray([].concat(this._dataTypes), findPredicate("name", oDataList.name));
									var sAlias = sap.ui.vbm.findInArray([].concat(sap.ui.vbm.findInArray([].concat(oDataType.N), findPredicate("name", aParameters[2])).A),
											findPredicate("name", aParameters[4])).alias;

									var oData = [].concat(oDataList.E)[aParameters[1]];
									var oSubData = [].concat(sap.ui.vbm.findInArray([].concat(oData.N), findPredicate("name", aParameters[2])).E)[aParameters[3]];

									oVO[sAttribute.split(".")[0]] = oSubData[sAlias];
									delete oVO[sAttribute];
								}
							}
						};
					};


					for (var sAttribute in v) {
						if (v.hasOwnProperty(sAttribute)) {
							if (jQuery.sap.endsWith(sAttribute, ".bind")) {
								//Only known bound attribute is text - has values like DetailData.0.Column.1.Text
								var aParameters = v[sAttribute].split(".");

								if (obj.SAPVB.Data && obj.SAPVB.Data.Set) {
									//Only Delta supported for Detail Window
									[].concat(obj.SAPVB.Data.Set).forEach(dereferenceBoundAttributes(oVO, sAttribute, aParameters), this);
								}
							}
						}
					}

					//Process relevant actions
					if (obj.SAPVB.Actions && obj.SAPVB.Actions.Set) {
						[].concat(obj.SAPVB.Actions.Set).filter(function(a) { return a.Action.refVO === oVO.id; }).forEach(function(fa) {
							that._attachHandler.call(oGeoMap, fa.Action.name, that._handler, that);
						});
					}

					return oVO;
				}, this);

				//delete obj.SAPVB["Actions"];
				obj.SAPVB.Scenes.Set.Scene.VO = aVOs;
			}
			oGeoMap.load(obj);
		}
		return this;
	};

	/**
	 * Generic Geomap event handler that relays the event to the consuming application
	 * This addresses all events.
	 * @param {object} event VBI JSON payload containing the event details. <br/>
	 * @private
	 */
	Adapter.prototype._genericGeomapHandler = function(event) {
		var oParameters = event.getParameters();
		var oEventData = oParameters.data ? oParameters.data : oParameters;
		if (oEventData.Action && oEventData.Action.object) {
			// Whatever back-end refers to as Links, they are referred to as Routes by Geomap
			if (oEventData.Action.object === "Route") {
				oEventData.Action.object = "Link";
			}
			var oAction = sap.ui.vbm.findInArray(this._groupedActions[oEventData.Action.object], function(a) { return a.refEvent.toLowerCase() === oEventData.Action.name.toLowerCase(); });
			if (oAction) {
				if (oEventData.Action.instance) {
					oEventData.Action.instance = oEventData.Action.instance.split(".")[0] + "." + oParameters.instance.getKey();
					oEventData.Action.name = oAction.name;
				}

				var idKeyMapGenerator = function() {
					this._map().getVos()
						.map(function(a) { return a.getItems(); })
						.reduce(function(a, b) { return a.concat(b); })
						.forEach(function(i) {
							this._idKeyMap[i.getUniqueId()] = i.getKey();
						}, this);
				}.bind(this);
				// need to process params prior sending event data to backend
				// this is because Key attributes from backend are not propogated from UI5 level down to VBI
				// i.e key attribute is not used in getDataElement() function, but UI5 Id used instead
				// need to iterate over all params in evend data and replace all UI5 Ids to corresponded Key attibutes
				var params = [];
				if (oEventData.Action.Params) {
					oEventData.Action.Params.Param.forEach(function(item) {
						if (item.name === "strSource") {
							params.push(item);
						}
					});

					if (params.length) {
						if (jQuery.isEmptyObject(this._idKeyMap)) { // The map was never aggregated - do it the first time
							idKeyMapGenerator();
						} else if (params.some(function(item) { return !this._idKeyMap.hasOwnProperty(item["#"].split(".")[1]); }, this)) {
							idKeyMapGenerator(); // check if it is outdated -> and update if neccessary
						}

						params.forEach(function(item) {
							var parts = item["#"].split(".");
							item["#"] = parts[0] + "." + this._idKeyMap[parts[1]]; // replace UI5 Id with Key attribute
						}, this);
					}
				}
				// same applies to Data section of the event, all UI5 IDs must be replaced with corresponded Key attributes
				if ((oEventData.Data) && (oEventData.Data.Merge) && (oEventData.Data.Merge.N)) {

					var uniqueIds = oEventData.Data.Merge.N.map(function(n) { return n.E; })
										.reduce(function(a, b) { return a.concat(b); })
										.map(function(e) { return e.K; });

					if (jQuery.isEmptyObject(this._idKeyMap)) { // The map was never aggregated - do it the first time
						idKeyMapGenerator();
					}
					if (uniqueIds.some(function(u) { return !this._idKeyMap.hasOwnProperty(u); }, this)) {
						//The map could be outdated - needs to be regenerated.
						idKeyMapGenerator();
					}
					//At this point, every Unique Id must have a corresponding Key in the map. Replace it in the event payload.
					var idKeyReplacer = function(e) { e.K = this._idKeyMap[e.K]; };
					[].concat(oEventData.Data.Merge.N).map(function(n) { return n.E; })
						.reduce(function(a, b) { return a.concat(b); })
						.forEach(idKeyReplacer, this);
				}

				this.fireSubmit({
					data: JSON.stringify(oEventData)
				});
			}
		}
		this.timeout = undefined;
	};

	/**
	 * Generic click event handler that relays the click/double click event to the consuming application
	 * When click is received, it waits for 500 ms for another click to assert whether this is double click
	 *
	 * @param {object} event VBI JSON payload containing the event details. <br/>
	 * @private
	 */
	Adapter.prototype._genericClickHandler = function(event) {
		if (this.timeout) {
			event.getParameters().data.Action.name = "doubleclick";
			clearTimeout(this.timeout);
			this._genericGeomapHandler.call(this, event);
		} else {
			// This needs to be done since by the time callback (event handler) is executed, the object is reclaimed.
			this.oEvent = jQuery.extend(true, {}, event);
			this.timeout = setTimeout(this._genericGeomapHandler.bind(this, this.oEvent), 500);
		}
	};

	return Adapter;
});