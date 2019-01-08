/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides class sap.ui.vk.threejs.NodesTransitionHelper
sap.ui.define([
	"jquery.sap.global", "sap/ui/core/Element"
], function(jQuery, Element) {
	"use strict";


	/**
	 * Constructor for a new NodesMovingDisplay tool.
	 *
	 * @class
	 * Specifies a resource to load.

	 * @param {string} [sId] ID of the new content resource. <code>sId</code>is generated automatically if no non-empty ID is given.
	 *                       Note: this can be omitted, regardless of whether <code>mSettings</code> will be provided or not.
	 * @param {object} [mSettings] An optional map/JSON object with initial property values, aggregated objects etc. for the new tool instance.
	 * @param {object} [oScope] scope An object for resolving string-based type and formatter references in bindings.
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.tools.PanTool
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var NodesTransitionHelper = Element.extend("sap.ui.vk.threejs.NodesTransitionHelper", /** @lends sap.ui.vk.threejs.NodesTransitionHelper.prototype */ {
		metadata: {
			properties: {
			},
			publicMethods: [
				"setViewport",
				"setNodeForDisplay",
				"setDisappearingNode",
				"setAppearingNode",
				"clear",
				"startDisplay",
				"displayNodesMoving"
			],
			events: {
                /**
				 * This event will be fired when display occurs.
				 */
				displaying: {
				},
				displayed: {
				}
			}
		}
	});

	NodesTransitionHelper.prototype.init = function() {
		this._viewport = null;

		// The keys in this map are node references.
		// The values in this map are structure containing old and new local matrices
		this._nodeLocalmMatrixMap = new Map();

		// The keys in this map are node references.
		// The values in this map are structure containing old matrix, new local matrices, and visibility
		this._nodeLocalMatrixMapForVisibility = new Map();

		this._timeIntervalForDisplay = 500; // millisecond, time interval for displaying nodes moving from old positions to new positions
		this._startTimeForDisplay = 0;
	};

	NodesTransitionHelper.prototype.destroy = function() {
		this._viewport = null;
		this._nodeLocalmMatrixMap = null;
		this._nodeLocalMatrixMapForVisibility = new Map();
	};

	NodesTransitionHelper.prototype.setViewport = function(viewport) {
		this._viewport = viewport;
	};

	NodesTransitionHelper.prototype.setNodeForDisplay = function(node) {
		this._nodeLocalmMatrixMap.set(node, { oldMatrix: node.getLocalMatrix(), newMatrix: null });
	};

	NodesTransitionHelper.prototype.setDisappearingNode = function(node, viewStateManager) {
		var om = node.getLocalMatrix();
		var nm = [ om[0] * 0.0001, om[1], om[2], om[3], om[4] * 0.0001, om[5], om[6], om[7], om[8] * 0.0001, om[9], om[10], om[11] ];
		this._nodeLocalMatrixMapForVisibility.set(node, { oldMatrix: om,
												newMatrix: nm,
												visible: false });
		var nodeRef = node.getNodeRef();
		nodeRef.visible = true;
	};

	NodesTransitionHelper.prototype.setAppearingNode = function(node) {
		var om = node.getLocalMatrix();
		var nm = [ om[0] * 0.0001, om[1], om[2], om[3], om[4] * 0.0001, om[5], om[6], om[7], om[8] * 0.0001, om[9], om[10], om[11] ];
		this._nodeLocalMatrixMapForVisibility.set(node, { oldMatrix: nm,
												newMatrix: om,
												visible: true });
	};

	NodesTransitionHelper.prototype._interpolateNodePositionForVisibility = function(node, data, interpolateCoeff){
		this._interpolateNodePosition(node, data.oldMatrix, data.newMatrix, interpolateCoeff);

		if (interpolateCoeff >= 1){
			var nodeRef = node.getNodeRef();
			nodeRef.visible = data.visible;
			if (!nodeRef.visible) {
				node.setLocalMatrix(data.oldMatrix);
			}
		}
	};

	NodesTransitionHelper.prototype._interpolateNodePosition = function(node, oldMatrix, newMatrix, interpolateCoeff) {
		var oldTHREEMatrix = new THREE.Matrix4().fromArray(sap.ui.vk.TransformationMatrix.convertTo4x4(oldMatrix));
		var oldPosition = new THREE.Vector3();
		var oldQuaternion = new THREE.Quaternion();
		var oldScale = new THREE.Vector3();
		oldTHREEMatrix.decompose(oldPosition, oldQuaternion, oldScale);

		var newTHREEMatrix = new THREE.Matrix4().fromArray(sap.ui.vk.TransformationMatrix.convertTo4x4(newMatrix));
		var newPosition = new THREE.Vector3();
		var newQuaternion = new THREE.Quaternion();
		var newScale = new THREE.Vector3();
		newTHREEMatrix.decompose(newPosition, newQuaternion, newScale);

		var position = new THREE.Vector3().lerpVectors(oldPosition, newPosition, interpolateCoeff);
		var quaternion = new THREE.Quaternion().copy(oldQuaternion).slerp(newQuaternion, interpolateCoeff);
		var scale = new THREE.Vector3().lerpVectors(oldScale, newScale, interpolateCoeff);

		var threeMatrix = new THREE.Matrix4().compose(position, quaternion, scale);
		node.setLocalMatrix(sap.ui.vk.TransformationMatrix.convertTo4x3(threeMatrix.elements));
	};

	NodesTransitionHelper.prototype.startDisplay = function(timeInterval) {
		if (this._nodeLocalmMatrixMap.size === 0){
			return;
		}

		this._timeIntervalForDisplay = timeInterval !== undefined ? timeInterval : 500;
		this._startTimeForDisplay = Date.now();

		this._nodeLocalmMatrixMap.forEach(function(matrices, node){ matrices.newMatrix = node.getLocalMatrix();});
		this.fireDisplaying();
	};

	NodesTransitionHelper.prototype.displayNodesMoving = function() {

		if (this._startTimeForDisplay === 0 || this._nodeLocalmMatrixMap === null || this._nodeLocalmMatrixMap.size === 0) {
			return;
		}

		var interpolateCoeff = Math.min((Date.now() - this._startTimeForDisplay) / this._timeIntervalForDisplay, 1);
		interpolateCoeff = 1 - Math.pow(1 - interpolateCoeff, 3);

		this._nodeLocalmMatrixMap.forEach(function(matrices, node){
			if (node && matrices.oldMatrix && matrices.newMatrix) {
				this._interpolateNodePosition(node, matrices.oldMatrix, matrices.newMatrix, interpolateCoeff);
			}
		}.bind(this));

		this._nodeLocalMatrixMapForVisibility.forEach(function(data, node){
			if (node && data) {
				this._interpolateNodePositionForVisibility(node, data, interpolateCoeff);
			}
		}.bind(this));

		if (interpolateCoeff === 1) {
			this.clear();
			this.fireDisplayed();
		}

		this._viewport._updateBoundingBoxesTransformation();
		this._viewport.setShouldRenderFrame();
	};

	NodesTransitionHelper.prototype.clear = function(){
		this._nodeLocalmMatrixMap.clear();
		this._nodeLocalMatrixMapForVisibility.clear();
		this._startTimeForDisplay = 0;
	};

	return NodesTransitionHelper;
});
