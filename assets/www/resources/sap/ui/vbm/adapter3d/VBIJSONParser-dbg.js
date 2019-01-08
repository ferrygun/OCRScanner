/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2012 SAP AG. All rights reserved
 */

 // Provides class sap.ui.vbm.VBIJSONParser
 sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object", "./VisualObjectFactory", "./Utilities", "./../library"
], function(jQuery, BaseObject, Factory, Utilities, library) {
	"use strict";

	/**
	 * Constructor for VBIJSONParser.
	 *
	 * @param {object[]} voGroups  Visual Object groups to be maintained upon interpretation of VBI JSON
	 * @param {object[]} vos       Visual Objects to be maintained upon interpretation of VBI JSON
	 * @param {object}   resources Resources to be maintained upon interpretation of VBI JSON
	 * @param {object}   actions Actions from VBI Json
	 * @class
	 * Provides a base class for VBIJSONParser.
	 *
	 * @private
	 * @author SAP SE
	 * @version 1.52.4
	 * @alias sap.ui.vbm.VBIJSONParser
	 * @experimental Since 1.52.0 This class is experimental and might be modified or removed in future versions.
	 */
	var VBIJSONParser = BaseObject.extend("sap.ui.vbm.adapter3d.VBIJSONParser", /** @lends sap.ui.vbm.adapter3d.VBIJSONParser.prototype */ {
		metadata: {
			publicMethods: [
				"loadVBIJSON"
			]
		},

		constructor: function(voGroups, vos, resources, actions) {
			this._voGroups = voGroups;
			this._vos = vos;
			this._resources = resources;
			this._actions = actions;
			this._factory = new Factory();

			this._visualObjectTemplateGenerators = {};
		}
	});

	/**
	 * Parses the VBI JSON an updates the states of VoGroups and Vos.
	 *
	 * @param {object} payload The VBI JSON Payload to be processed.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @public
	 */
	VBIJSONParser.prototype.loadVBIJSON = function(payload) {
		// Resources
		if (payload && payload.SAPVB) {
			if (payload.SAPVB.Resources) {
				this._processResources(payload.SAPVB.Resources);
			}

			// DataTypes
			if (payload.SAPVB.DataTypes) {
				this._processDataTypes(payload.SAPVB.DataTypes);
			}

			// VOs
			if (payload.SAPVB.Scenes &&
				payload.SAPVB.Scenes.Set &&
				payload.SAPVB.Scenes.Set.Scene &&
				payload.SAPVB.Scenes.Set.Scene.VO
			) {
				this._processVOs([].concat(payload.SAPVB.Scenes.Set.Scene.VO));
			}

			// Actions
			if (payload.SAPVB.Actions &&
				payload.SAPVB.Actions.Set &&
				payload.SAPVB.Actions.Set.Action
			) {
				this._processActions([].concat(payload.SAPVB.Actions.Set.Action));
			}

			// Data
			if (payload.SAPVB.Data) {
				this._processData(payload.SAPVB.Data);
			}
		}
		return this;
	};

	/**
	 * Processes the resources section of VBI JSON.
	 *
	 * @param {object} resources The resources section of VBI JSON.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._processResources = function(resources) {
		// Delta not supported
		if (resources && resources.Set && resources.Set.Resource) {
			var resourceToFile = function(data, name) {
				return atob(data.split(",")[0]);
			};

			var processResource = function(r) {
				if (jQuery.sap.endsWith(r.name, ".dae")) {
					this._resources.set(r.name, resourceToFile(r.value, r.name));
				} else {
					this._resources.set(r.name, "data:" + r.name.split(".")[1] + ";base64," + r.value);
				}
			};

			[].concat(resources.Set.Resource).forEach(processResource, this);
		}

		return this;
	};

	/**
	 * Processes the data types section of VBI JSON.
	 *
	 * @param {object} dataTypes The DataTypes section of VBI JSON.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._processDataTypes = function(dataTypes) {
		// Delta not supported
		if (dataTypes.Set && dataTypes.Set && dataTypes.Set.N) {
			this._dataTypes = [].concat(dataTypes.Set.N);
		}
		return this;
	};

	var resolveInstanceProperties = function(voDefintion, dataType, aliasMap, data) {
		var instanceProperties = {};
		for (var attribute in voDefintion) {
			// Skip attributes that must not be copied to visual object instances.
			if (!(attribute === "datasource" || attribute === "id" || attribute === "type")) {
				if (jQuery.sap.endsWith(attribute, ".bind")) {
					instanceProperties[attribute.split(".")[0]] = data[aliasMap[voDefintion[attribute].split(".")[1]]];
				} else {
					instanceProperties[attribute] = voDefintion[attribute];
				}
			}
		}
		instanceProperties.id = data[aliasMap[dataType.key]];
		return instanceProperties;
	};

	/**
	 * Processes the Scenes.VOs section of VBI JSON.
	 *
	 * @param {object} vos The Scenes.VOs section of VBI JSON.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._processVOs = function(vos) {
		vos.forEach(function(vo) {
			var dataType = sap.ui.vbm.findInArray(this._dataTypes, function(dt) { return dt.name === vo.datasource; });
			var aliasMap = {};

			if (dataType && dataType.A) {
				[].concat(dataType.A).forEach(function(attribute) {
					aliasMap[attribute.name] = attribute.alias;
				});
			}

			this._voGroups.push(this._factory.createVisualObjectGroup({
				id:         vo.id,
				type:       vo.type,
				datasource: vo.datasource,
				maxSel:     dataType.maxSel,
				minSel:     dataType.minSel
			}));

			this._visualObjectTemplateGenerators[vo.id] = resolveInstanceProperties.bind(undefined, vo, dataType, aliasMap);
		}, this);
		return this;
	};

	/**
	 * Processes the Actions section of VBI JSON.
	 *
	 * @param {object[]} actions The Actions section of VBI JSON.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._processActions = function(actions) {
		actions.forEach(function(a) {
			this._actions.push(a);
		}, this);
		return this;
	};

	/**
	 * Updates the flags of the VO to indicate creation.
	 *
	 * @param {object} vo The VO whose flags need to be updated.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._markAsNew = function(vo) {
		vo.isAdded = true;
		vo.isUpdated = false;
		vo.isDeleted = false;
		return this;
	};

	/**
	 * Updates the flags of the VO to indicate updation.
	 *
	 * @param {object} vo The VO whose flags need to be updated.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._markForChange = function(vo) {
		vo.isAdded = false;
		vo.isUpdated = true;
		vo.isDeleted = false;
		return this;
	};

	/**
	 * Updates the flags of the VO to indicate deletion.
	 *
	 * @param {object} vo The VO whose flags need to be updated.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._markForDeletion = function(vo) {
		vo.isAdded = false;
		vo.isUpdated = false;
		vo.isDeleted = true;
		return this;
	};

	/**
	 * Processes the Data section of VBI JSON.
	 *
	 * @param {object} data The Scenes.VOs section of VBI JSON.
	 * @returns {sap.ui.vbm.VBIJSONParser} <code>this</code> to allow method chaining.
	 * @private
	 */
	VBIJSONParser.prototype._processData = function(data) {
		// Conditions to differentiate full update from full load
		// Data.Set, is an object, does not have attributes other than N (namely name & type)
		// Other wise delta load
		if (data.Set && typeof data.Set === 'object' && !jQuery.isEmptyObject(data.Set)) {
			if (!Array.isArray(data.Set) && !data.Set.name && !data.Set.type) {
				// Full update
				// Remove all the existing visual object instances.
				this._vos.forEach(function(vo) {
					this._markForDeletion(vo);
				}, this);
				// Add the new visual object instances.
				if (data.Set && data.Set.N) {
					[].concat(data.Set.N).forEach(function(n) {
						var voGroup = sap.ui.vbm.findInArray(this._voGroups, function(group) { return group.datasource === n.name; });
						[].concat(n.e).forEach(function(e) {
							var voProperties = this._visualObjectTemplateGenerators[voGroup.id](e);
							var vo = this._factory.createVisualObject(voGroup, voProperties);
							this._markAsNew(vo);
							this._vos.push(vo);
							if (Utilities.toBoolean(vo["VB:s"])) {
								voGroup.selected.push(vo);
							}
						}, this);
					}, this);
				}
			} else {
				// Delta Load
				var hasValidDataObjects = !Array.isArray(data.Set) ? data.Set.N : true;
				if (data.Set && hasValidDataObjects) {
					[].concat(data.Set).forEach(function(set) {
						var voGroup = sap.ui.vbm.findInArray(this._voGroups, function(_group) { return _group.datasource === set.name; });
						[].concat(set.N.E || []).forEach(function(e) {
							var voProperties = this._visualObjectTemplateGenerators[voGroup.id](e);
							var existingVOIndex = sap.ui.vbm.findIndexInArray(this._vos, function(vo) { return vo.id === voProperties.id; });
							if (existingVOIndex >= 0) {
								var existingVO = this._vos[existingVOIndex];
								jQuery.extend(existingVO, voProperties);
								this._markForChange(existingVO);
							} else {
								var newVO = this._factory.createVisualObject(voGroup, voProperties);
								this._markAsNew(newVO);
								this._vos.push(newVO);
							}
						}, this);
					}, this);
				}
			}
		}

		if (data.Remove) {
			[].concat(data.Remove).forEach(function(group) {
				if (group.N && group.N.E) {
					[].concat(group.N.E).forEach(function(e) {
						var existingVO = sap.ui.vbm.findInArray(this._vos, function(vo) { return vo.id === e.K; });
						this._markForDeletion(existingVO);
					}, this);
				}
			}, this);
		}
		return this;
	};

	return VBIJSONParser;
});