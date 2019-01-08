/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.SceneTree.
sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control", "sap/ui/table/TreeTable", "sap/ui/table/Column", "sap/ui/model/json/JSONModel",
	"sap/m/Title", "./CheckEye", "./ContentConnector", "./ViewStateManager"
], function(jQuery, library, Control, TreeTable, Column, JSONModel,
		Title, CheckEye, ContentConnector, ViewStateManager) {
	"use strict";

	/**
	 * Constructor for a new SceneTree.
	 *
	 * @param {string} [sId] id for the new control, generated automatically if no id is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class Provides a hierarchical view of all the nodes in a given scene in table format.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.52.8
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.SceneTree
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 * @experimental Since 1.32.0 This class is experimental and might be modified or removed in future versions.
	 */
	var SceneTree = Control.extend("sap.ui.vk.SceneTree", /** @lends sap.ui.vk.SceneTree.prototype */ {
		metadata: {
			library: "sap.ui.vk",
			aggregations: {
				_tree: {
					type: "sap.ui.table.TreeTable",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * An association to the <code>ContentConnector</code> instance that manages content resources.
				 */
				contentConnector: {
					type: "sap.ui.vk.ContentConnector",
					multiple: false
				},

				/**
				 * An association to the <code>ViewStateManager</code> instance.
				 */
				viewStateManager: {
					type: "sap.ui.vk.ViewStateManager",
					multiple: false
				}
			}
		}
	});

	var getCheckEyeTooltip = function(isVisible, sceneTree) {
		return sap.ui.vk.getResourceBundle().getText(isVisible ? "SCENETREE_VISIBILITYSTATEVISIBLE" : "SCENETREE_VISIBILITYSTATEHIDDEN");
	};

	SceneTree.prototype._createNodeForSceneTree = function(nodeName, nodeRef, viewStateManager) {
		var nodeVisibility = viewStateManager.getVisibilityState(nodeRef);
		return {
			name: nodeName,
			id: nodeRef,
			visible: nodeVisibility,
			checkEyeTooltip: getCheckEyeTooltip(nodeVisibility, this)
		};
	};

	// This methods is kept here for backward compatibility.
	SceneTree.prototype.setScene = function(scene, viewStateManager) {
		this.setViewStateManager(viewStateManager);
		this._setScene(scene);
	};

	SceneTree.prototype._setScene = function(scene) {
		this._scene = scene;
		this.refresh();
	};

	SceneTree.prototype.init = function() {
		if (Control.prototype.init) {
			Control.prototype.init.apply(this);
		}

		var _title = new Title({
			text: sap.ui.vk.getResourceBundle().getText("SCENETREE_TITLE"),
			tooltip: sap.ui.vk.getResourceBundle().getText("SCENETREE_TITLE")
		});

		_title.onAfterRendering = function() {
			var $this = this.$();
			$this.addClass("sapUiVkTitle");
		};

		this._visibilityColumnHeader = new CheckEye({
			checked: true,
			tooltip: getCheckEyeTooltip(true, this),
			change: function(event) {
				var isVisible = event.getParameters("checked").checked;
				this.setTooltip(getCheckEyeTooltip(isVisible, this));
				this._toggleVisibilityForAllChildren(this._model.getData(), isVisible);
			}.bind(this)
		});

		this._tree = new TreeTable({
			title: _title,
			columnHeaderHeight: 32,
			columns: [
				new Column({
					label: sap.ui.vk.getResourceBundle().getText("SCENETREE_NAME"),
					tooltip: sap.ui.vk.getResourceBundle().getText("SCENETREE_NAME"),
					template: new sap.m.Text({
						text: "{name}",
						maxLines: 1,
						tooltip: "{name}"
					}),
					resizable: false
				}),
				new Column({
					label: this._visibilityColumnHeader,
					template: new CheckEye({
						checked: "{visible}",
						tooltip: "{checkEyeTooltip}"
					}),
					width: "2.7em",
					resizable: false,
					hAlign: "Center"
				})
			],
			selectionMode: "MultiToggle",
			selectionBehavior: "RowSelector",
			visibleRowCountMode: "Fixed",
			expandFirstLevel: false,
			collapseRecursive: true,
			rowHeight: 32
		});

		this.setAggregation("_tree", this._tree, true);

		this._model = new JSONModel();
		this._tree.setModel(this._model);
		this._tree.bindRows({
			path: "/"
		});
		this._tree.attachRowSelectionChange(this._nodeSelection.bind(this));
		this._tree.getBinding("rows").attachChange(this._dataChange.bind(this));

		this._scene = null;

		this._syncing = false;
		this._selected = {};
		this._toggled = {};
		this._vsmSelected = {};

		this._forwardTimer = 0;
		this._reverseTimer = 0;

		this._vSyncing = false;
		this._lastChangeIsExpand = false;
		this._forwardVTimer = 0;
		this._reverseVTimer = 0;
		this._scrollTimer = 0;
		this._totalNodes = null;
	};

	SceneTree.prototype.onBeforeRendering = function() {
		this._tree.setVisible(true);
	};

	SceneTree.prototype._pathToNode = function(path, data, toReplace) {
		path = path.substr(1);
		if (data == undefined) {
			data = this._model.getData();
		}

		var node = data;
		var prev = node;
		var level = "";

		while (path.length > 0) {
			var pos = path.indexOf("/");

			if (pos >= 0) {
				level = path.substr(0, pos);
				path = path.substr(pos + 1);
			} else {
				level = path;
				path = "";
			}

			prev = node;
			node = prev[level];
		}

		if (toReplace != undefined) {
			prev[level] = toReplace;
		}

		return node;
	};

	SceneTree.prototype._indexToNodeRef = function(index) {
		var context = this._tree.getContextByIndex(index);
		if (context) {
			var node = this._pathToNode(context.sPath, context.oModel.oData);
			return node.id;
		} else {
			return null;
		}
	};

	SceneTree.prototype._deselectHidden = function() {
		var vsm = this._vsmSelected;
		var vs = this._viewStateManager;
		var desel = [];
		var undodesel = {};

		for (var i = 0; ; i++) {
			var ref = this._indexToNodeRef(i);
			if (ref == null) {
				break;
			}

			if (vsm.hasOwnProperty(ref)) {
				undodesel[ref] = true;
			}
		}

		for (var key in vsm) {
			if (vsm.hasOwnProperty(key) && vsm[key] == true && !undodesel.hasOwnProperty(key) && key != "") {
				desel.push(key);
				vsm[key] = false;
			}
		}

		if (desel.length > 0) {
			this._syncing = true;
			vs.setSelectionState(desel, false, false);
			this._syncing = false;
		}
	};

	SceneTree.prototype._nodeSelection = function(event) {
		if (this._tree.getBinding("rows")._aSelectedContexts != undefined) {
			// If we hit this, it means TreeTable is trying to restore selection, ignore it.
			return;
		}
		if (!this._syncing) {
			if (this._forwardTimer > 0) {
				clearTimeout(this._forwardTimer);
			}

			var param = event.mParameters;
			var indices = param.rowIndices;
			var curr = this._tree.getSelectedIndices();

			if (indices.length >= 1 && curr.length == 1) {
				if (indices.indexOf(curr[0]) != -1) {
					this._deselectHidden();
				}
			}

			for (var i = 0; i < indices.length; i++) {
				var id = indices[i];

				if (this._toggled.hasOwnProperty(id)) {
					this._toggled[id] = !this._toggled[id];
				} else {
					this._toggled[id] = true;
				}

				if (!this._selected.hasOwnProperty(id)) {
					this._selected[id] = false;
				}
			}

			this._forwardTimer = setTimeout(this._resyncSelectionForward.bind(this, indices), 100);
		}
	};

	SceneTree.prototype._handleSelectionChanged = function(event) {
		if (!this._syncing) {
			if (this._reverseTimer > 0) {
				clearTimeout(this._reverseTimer);
			}

			var sel = event.mParameters.selected;
			var desel = event.mParameters.unselected;

			for (var i = 0; i < desel.length; i++) {
				if (this._vsmSelected[desel[i]] != undefined) {
					delete this._vsmSelected[desel[i]];
				}
			}
			for (var j = 0; j < sel.length; j++) {
				this._vsmSelected[sel[j]] = true;
			}

			if (sel.length == 1) {
				this._expandToNode(sel[0], this._resyncSelectionReverse.bind(this));
			} else {
				this._reverseTimer = setTimeout(this._resyncSelectionReverse.bind(this), 100, true);
			}
		}
	};

	SceneTree.prototype._resyncSelectionForward = function(targetedNodesIndexes) {
		this._forwardTimer = 0;
		if (this._syncing) {
			return false;
		}

		this._syncing = true;
		// this for loop goes through the list of nodes which ar marked as selected,
		// finds the row that was just clicked and it applies selection to it
		// via the ViewStateManager method "setSelection"
		for (var i in this._selected) {
			if (this._selected.hasOwnProperty(i)) {
				var ref = this._indexToNodeRef(parseInt(i, 10));
				if (ref == null || ref == "") {
					continue;
				}

				var isSelected = this._selected[i]; // tree.isIndexSelected(i);

				if (this._toggled[i]) {
					isSelected = !isSelected;
				}

				// We check if the current element from "this._selected" array is the clicked row,
				// so we can set the selection/deselection on it.
				if (targetedNodesIndexes.indexOf(parseInt(i, 10)) !== -1) {
					this._viewStateManager.setSelectionState(ref, isSelected, false);

					// Sometimes, a clicked row is part of a parent which is selected which causes all its children
					// to be selected. If we deselect a particular child, we have to make sure we also deselect its parent.
					if (!isSelected) {
						var nodeHierarchy = this._viewStateManager.getNodeHierarchy();
						var ancestors = nodeHierarchy.getAncestors(ref);
						// the immediate parent of a node is the last element in the ancestors array
						var parentNodeRef = ancestors[ancestors.length - 1];
						// We check if the parnet is in the list of currently selected rows.
						if (this._viewStateManager.getSelectionState(parentNodeRef)) {
							this._viewStateManager.setSelectionState(parentNodeRef, false);
							// We update "this._selected" and "his._vsmSelected"
							var selectedIndices = this._tree.getSelectedIndices();
							for (var j = 0, length = selectedIndices.length; j < length; j++) {
								var index = selectedIndices[j];
								if (parentNodeRef === this._indexToNodeRef(index)) {
									this._selected[index] = false;
									this._tree.removeSelectionInterval(index, index);
									break;
								}
							}
							this._vsmSelected[parentNodeRef] = false;
						}
					}
				}
				this._selected[i] = isSelected;
				this._vsmSelected[ref] = isSelected;
			}
		}

		this._toggled = {};

		this._syncing = false;
	};

	SceneTree.prototype._resyncSelectionReverse = function(bScrollToSelection) {
		this._reverseTimer = 0;
		if (this._syncing) {
			return;
		}

		this._syncing = true;
		// Slow: Tree table de-selects everything after node expand or collapse, so have to resync the selection state.
		var vs = this._viewStateManager;
		var tree = this._tree;
		var selCount = 0;
		this._selected = {};

		for (var i = 0; ; i++) {
			var ref = this._indexToNodeRef(i);
			if (ref == null || ref == "") {
				break;
			}

			var sel = vs.getSelectionState(ref);

			if (sel) {
				this._selected[i] = true;
				selCount++;
			}

			if (sel != tree.isIndexSelected(i)) {
				if (sel) {
					tree.addSelectionInterval(i, i);
				} else {
					tree.removeSelectionInterval(i, i);
				}
			}
		}

		this._syncing = false;
	};

	SceneTree.prototype._expandToNode = function(nodeRef, callback) {

		var totalNodes = this._totalNodes;

		// we pass tree structure and an array of positions and it returns the resulting tree component
		// For example: if we pas [0, 2, 3, 2], it returns dataModel[0][2][3][2]
		var getFormattedDataModel = function(dataModel, pathInModel) {
			pathInModel.forEach(function(position) {
				dataModel = dataModel[position];
			});
			return dataModel;
		};

		// getScrollPosition - When we know the index of the row where we want to scroll,
		// we do some calculations so we position that row in the middle
		// of the table. For example if we want to scroll index 30 into view
		// and the table can fit 12 rows into the view, we will display the rows
		// starting from 24 until 36 so row number 30 is in the middle.
		var getScrollPosition = function(currentRow, rowIndex, rowCapacity) {
			var position;
			if ((rowIndex < currentRow) || (rowIndex >= (currentRow + rowCapacity))) {
				// if the relevant row index is not in the view,
				// we perform the necessary calculations.
				position = rowIndex - (rowCapacity / 2);
			} else {
				// if the relevant row is already visible,
				// we don't change anything and we return the current index.
				position = currentRow;
			}
			// We round the index so it's an integer
			// and we also make sure it's greater than 0 at all times.
			position = position > 0 ? Math.floor(position) : 0;
			return position;
		};

		// This is the method that performs the actual scrolling
		var scrollNodeIntoView = function(tree, rowIndex) {
			var rowCapacity = tree.getVisibleRowCount(),
				currentRow = tree.getFirstVisibleRow(),
				rowToScrollTo = getScrollPosition(currentRow, rowIndex, rowCapacity);
			if (rowToScrollTo !== currentRow) {
				tree.setFirstVisibleRow(rowToScrollTo);
			}
		};

		// This method takes a tree table and a node reference as parameters and
		// it returns the row index for the node with that id.
		var getIndexFromNodeRef = function(treeTable, nodeRef) {

			var rowIndex = null,
				context;

			// we iterate over all row indexes
			for (var currentIndex = 0; currentIndex < totalNodes; currentIndex++) {
				context = treeTable.getContextByIndex(currentIndex);
				if (context) {
					var pathInModel = context.getPath().split("/");
					pathInModel.shift();
					var dataModel = context.getModel().getData();

					if (getFormattedDataModel(dataModel, pathInModel).id === nodeRef) {
						// when we find the node reference that we need, we save the index
						// and break out of the while loop
						rowIndex = currentIndex;
						break;
					}
				}
			}
			return rowIndex;
		};

		var nodeHierarchy = this._scene.getDefaultNodeHierarchy(),
			ancestors = nodeHierarchy.getAncestors(nodeRef);

		// expandHandler it's called after the tree table expands a row.
		// This is a way of expanding nodes recursively. We start with the
		// "oldest" ancestors and we continue down the tree to the relevant node.
		var expandHandler = function(ancestorsProcessorCallback, tree, ancestors, event) {
			if (event.getParameter("reason") === "expand") {
				ancestorsProcessorCallback(tree, ancestors);
			}
		};

		var expandHandlerProxy; // forward declaration.

		// processAncestors removes the first ancestor from the collection,
		// it gets the row index from the tree table, it expands that row
		// and at the end, it scrolls the relevant row into view.
		var processAncestors = function(tree, ancestors) {
			setTimeout(function() {
				if (ancestors.length) {
					// retrieve the first ancestor from the collection and remove it
					var ancestorRef = ancestors.shift();
					var rowIndex = getIndexFromNodeRef(tree, ancestorRef);
					if (rowIndex !== null) {
						tree.expand(rowIndex);
					}
				} else {
					// after we expand the last node, we scroll the selected element into view
					var scrollIndex = getIndexFromNodeRef(tree, nodeRef);
					if (scrollIndex !== null) {
						scrollNodeIntoView(tree, scrollIndex);
						tree.getBinding("rows").detachChange(expandHandlerProxy);
						callback();
					}
				}
			}, 70);
		};

		expandHandlerProxy = expandHandler.bind(this, processAncestors, this._tree, ancestors);

		// We listen for the change event so we know when the tree.expand() method has finished
		this._tree.getBinding("rows").attachChange(expandHandlerProxy);

		// start processing the ancestors:
		// get ancestor => find its index => expand that index => repeat
		processAncestors(this._tree, ancestors);

	};

	SceneTree.prototype._dataChange = function(event) {
		if (this._viewStateManager == null || this._scene == null || this._vSyncing) {
			return;
		}

		if (this._lastChangeIsExpand) {
			this._lastChangeIsExpand = false;
			return;
		}

		if (this._forwardVTimer > 0) {
			clearTimeout(this._forwardVTimer);
		}

		this._forwardVTimer = setTimeout(this._resyncVisibilityForward.bind(this), 100);
	};

	SceneTree.prototype._resyncVisibilityForward = function() {
		if (!this._vSyncing) {
			this._vSyncing = true;
			this._forwardVTimer = 0;
			this._setNodeVisibilityRecursive(this._model.getData(), this._viewStateManager);
			this._vSyncing = false;
		}
	};

	SceneTree.prototype._enumerateChildrenIntoArray = function(nodeRef, list) {
		var nodeInfo = this._scene.getDefaultNodeHierarchy();
		nodeInfo.enumerateChildren(nodeRef, function(pnode) {
			var ref = pnode.getNodeRef();
			list.push(ref);
			if (pnode.getHasChildren()) {
				this._enumerateChildrenIntoArray(ref, list);
			}
		});
	};

	SceneTree.prototype._setNodeVisibilityRecursive = function(node, viewStateManager) {
		if (node.id != null && viewStateManager.getVisibilityState(node.id) != node.visible) {
			// setVisbility state with a "true" value as third parameter
			// will change the visibility of a node and its children recursively.
			viewStateManager.setVisibilityState(node.id, node.visible, true);

			if (node[0] !== undefined || node.hasOwnProperty("children")) {
				if (this._reverseVTimer > 0) {
					clearTimeout(this._reverseVTimer);
				}
				this._reverseVTimer = setTimeout(this._resyncVisibilityReverse.bind(this), 100);
			}
		} else {
			var children = node.hasOwnProperty("children") ? node.children : node;
			for (var i = 0; children[i] != null; i++) {
				this._setNodeVisibilityRecursive(children[i], viewStateManager);
			}
		}
	};

	SceneTree.prototype._toggleVisibilityForAllChildren = function(node, isVisible) {
		var children = node.hasOwnProperty("children") ? node.children : node;
		for (var i = 0; children[i] != null; i++) {
			this._viewStateManager.setVisibilityState(children[i].id, isVisible, true);
		}
	};

	SceneTree.prototype._handleVisibilityChanged = function(event) {
		if (!this._vSyncing) {
			if (this._reverseVTimer > 0) {
				clearTimeout(this._reverseVTimer);
			}
			this._reverseVTimer = setTimeout(this._resyncVisibilityReverse.bind(this), 100);
		}
	};

	SceneTree.prototype._resyncVisibilityReverse = function() {
		if (!this._vSyncing) {
			this._vSyncing = true;
			this._forwardVTimer = 0;
			this._getNodeVisibilityRecursive(this._model.getData(), this._viewStateManager);
			this._tree.getModel().refresh(true);
			this._vSyncing = false;
		}
	};

	SceneTree.prototype._getNodeVisibilityRecursive = function(node, vsm) {
		if (node.id != null) {
			node.visible = vsm.getVisibilityState(node.id);
			// Updating the tooltip for each node
			node.checkEyeTooltip = getCheckEyeTooltip(node.visible, this);
		}

		var children = node.hasOwnProperty("children") ? node.children : node;
		for (var i = 0; children[i] != null; i++) {
			this._getNodeVisibilityRecursive(children[i], vsm);
		}
	};

	SceneTree.prototype.updateHeight = function(height) {
		this._tree.setVisibleRowCount(Math.floor(height / this._tree.getRowHeight()) - 2);
	};

	SceneTree.prototype.refresh = function() {
		if (this._scene == null || !this._viewStateManager || !this._viewStateManager.getNodeHierarchy()) {
			this._model.setData([]);
			return;
		}

		var nodeHierarchy = this._scene.getDefaultNodeHierarchy();

		// building the tree model which is going to be passed to the TreeTable control.
		var tree = [];
		this._totalNodes = 0;
		var getChildrenRecursively = function(tree, nodeRefs) {
			nodeRefs.forEach(function(nodeRef, index) {
				var node = nodeHierarchy.createNodeProxy(nodeRef);
				var treeNode = this._createNodeForSceneTree(node.getName(), node.getNodeRef(), this._viewStateManager);
				tree[index] = treeNode;
				nodeHierarchy.destroyNodeProxy(node);
				this._totalNodes++;
				treeNode.children = [];
				getChildrenRecursively.bind(this)(treeNode.children, nodeHierarchy.getChildren(nodeRef));
			}.bind(this));
		};
		getChildrenRecursively.bind(this)(tree, nodeHierarchy.getChildren());

		// set the object that we've just built as data model for the TreeTable control
		this._model.setData(tree);
		this._tree.setModel(this._model);
		this._tree.bindRows({
			path: "/",
			parameters: {
				arrayNames: [ "children" ]
			}
		});
		this._tree.getBinding("rows").attachChange(this._dataChange.bind(this));
		this._visibilityColumnHeader.setChecked(true);
		this._visibilityColumnHeader.setTooltip(getCheckEyeTooltip(true, this));
	};

	////////////////////////////////////////////////////////////////////////
	// Content connector and view state manager handling begins.

	SceneTree.prototype._onBeforeClearContentConnector =
	SceneTree.prototype._onBeforeClearViewStateManager = function() {
		this._setScene(null);
	};

	SceneTree.prototype._onAfterUpdateContentConnector =
	SceneTree.prototype._onAfterUpdateViewStateManager = function() {
		if (this._contentConnector) {
			this._setContent(this._contentConnector.getContent());
		}
	};

	// Content connector and view state manager handling ends.
	////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////
	// Scene handling begins.
	SceneTree.prototype._setContent = function(content) {
		var scene = null;
		if (content) {
			scene = content.scene;
		}
		this._setScene(scene);
	};

	SceneTree.prototype._handleContentReplaced = function(event) {
		this._setContent(event.getParameter("newContent"));
	};

	SceneTree.prototype._handleNodeHierarchyReplaced = function(event) {
		this._setScene(this._scene);
	};

	SceneTree.prototype._handleContentChangesFinished = function(event) {
		this.refresh();
	};

	// Scene handling ends.
	////////////////////////////////////////////////////////////////////////

	// This mixin adds and maintains private property _contentConnector.
	ContentConnector.injectMethodsIntoClass(SceneTree);

	// This mixin adds and maintains private property _viewStateManager.
	ViewStateManager.injectMethodsIntoClass(SceneTree);

	return SceneTree;

}, /* bExport= */ true);
