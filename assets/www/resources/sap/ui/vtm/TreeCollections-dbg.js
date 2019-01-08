/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
        "jquery.sap.global",
        "sap/ui/core/Element",
        "./ArrayUtilities"
    ],
    function (
        jQuery,
        SapUiCoreElement,
        SapUiVtmArrayUtilities) {

        "use strict";

        /**
         * Constructor for a new TreeCollections object.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @private
         * @class
         * Manages various collections for a {@link sap.ui.vtm.Tree} control instance.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.TreeCollections}.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.Tree}.
         * @name sap.ui.vtm.TreeCollections
         * @extends sap.ui.core.Element
         */
        var TreeCollections = SapUiCoreElement.extend("sap.ui.vtm.TreeCollections", /** @lends sap.ui.vtm.TreeCollections.prototype */ {

            /**
             * Returns a tree item id given a value that may be a tree item or a tree item id.
             * @function
             * @public
             * @param {object|string} treeItemOrId  A value that may be a tree item or a tree item id.
             * @return {object} The tree item.
             */
            getTreeItem: function(treeItemOrId) {
                if (!treeItemOrId) {
                    return null;
                }
                if (typeof treeItemOrId === "string") {
                    var treeItem = this._treeItemsById.get(treeItemOrId);
                    if (!treeItem) {
                        throw treeItemOrId + " was not found in tree with tree id " + this.getId();
                    }
                    return treeItem;
                }
                return treeItemOrId;
            },
            
            /**
             * Returns a tree item id given a value that may be a tree item or a tree item id.
             * @function
             * @public
             * @param {object|string} treeItemOrId  A value that may be a tree item or a tree item id.
             * @return {string} The tree item id.
             */
            getTreeItemId: function(treeItemOrId) {
                if (!treeItemOrId) {
                    return null;
                }
                return typeof treeItemOrId === "string" ?  treeItemOrId : treeItemOrId.id;
            },

            /**
             * Updates collections used to find tree items by various criteria.<br/>
             * This method should be called whenever the tree has been populated, when the tree structure has changed or when any of the following fields have been modified for a tree item in the tree:
             * <ul>
             * <li>id</li>
             * <li>sceneNodeIds <b>*</b></li>
             * <li>includedChildren</li>
             * <li>excludedChildren</li>
             * </ul>
             * <br/>
             * Correct usage of this method is required by the following methods:
             * <ul>
             * <li>{@link #getItem}</li>
             * <li>{@link #getParentItem}</li>
             * <li>{@link #getDescendantItems}</li>
             * <li>{@link #getAncestorItems}</li>
             * <li>{@link #getItemsBySceneNodeId} <b>*</b></li>
             * <li>{@link #setExpanded}</li>
             * <li>{@link #getExpanded}</li>
             * <li>{@link #expandAncestors}</li>
             * <li>{@link #scrollIntoView}</li>
             * <li>{@link #setSelectedItems}</li>
             * <li>{@link #isIncludedItem}</li>
             * <li>{@link #isExcludedItem}</li>
             * <li>{@link #traverseBranch}</li>
             * </ul>
             * <br/>
             * <b>*</b> When the only changes to the tree since the last call to {@link #updateCollections} are changes to the <code>sceneNodeIds<code> 
             * properties of the tree items, {@link #updateTreeItemsBySceneNodeId} can be used instead of {@link #updateCollections}.
             * @function
             * @public
             * @param {object[]} rootItems The root items of the tree.
             * @param {boolean?} checkForHierarchyChanges When true a <code>hierarchyChanged</code> event will be raised if the hierarchy has changed since the last time this method was called.
             * This method is called when the tree is empty as part of the {@link sap.ui.vtm.Tree} constructor, so the first time it is called from application code a <code>hierarchyChanged</code> event will be raised if the tree has been populated.
             * The default value for the parameter is <code>true</code>.
             * @fires hierarchyChanged
             * @returns {boolean} Returns whether a hierarchy change was detected.
             */
            updateCollections: function (rootItems, checkForHierarchyChanges) {
                checkForHierarchyChanges = checkForHierarchyChanges !== false;
                var oldParentIdsById = this._parentIdsById;
                var oldIncludedTreeItems = this._includedTreeItems;
                var oldExcludedTreeItems = this._excludedTreeItems;
                this._treeItemsById = new Map();
                this._parentIdsById = new Map();
                this._treeItemsBySceneNodeId = new sap.ui.vtm.Lookup();
                this._includedTreeItems = [];
                this._excludedTreeItems = [];
                var parentIdsById = this._parentIdsById;
                var hierarchyChanged = false;

                var updateCollectionsForItem = function (item, parent, excluded) {
                    var id = item.id;
                    if (!id) {
                        throw "id is not set for tree item with name " + item.name;
                    }
                    if (this._treeItemsById.has(id)) {
                        throw id + " is not unique in the tree";
                    }
                    var index;
                    if (excluded) {
                        this._excludedTreeItems.push(item);
                        if (checkForHierarchyChanges && oldExcludedTreeItems && !hierarchyChanged) {
                            index = this._excludedTreeItems.length - 1;
                            if (index >= oldExcludedTreeItems.length  || oldExcludedTreeItems[index] != item) {
                                hierarchyChanged = true;
                            }
                        }
                    } else {
                        this._includedTreeItems.push(item);
                        if (checkForHierarchyChanges && oldIncludedTreeItems && !hierarchyChanged) {
                            index = this._includedTreeItems.length - 1;
                            if (index >= oldIncludedTreeItems.length  || oldIncludedTreeItems[index] != item) {
                                hierarchyChanged = true;
                            }
                        }
                    }
                    this._treeItemsById.set(id, item);
                    if (parent) {
                        if (!parent.id) {
                            throw "id is not set for tree item with name " + parent.name;
                        }
                        parentIdsById.set(id, parent.id);
                        if (checkForHierarchyChanges && oldParentIdsById && !hierarchyChanged) {
                            if (oldParentIdsById.get(id) !== parent.id) {
                                hierarchyChanged = true;
                            }
                        }
                    } else if (checkForHierarchyChanges && oldParentIdsById && !hierarchyChanged) {
                        if (oldParentIdsById.get(id)) {
                            hierarchyChanged = true;
                        }
                    }
                    if (item.includedChildren) {
                        item.includedChildren.forEach(function(child) {
                            updateCollectionsForItem(child, item, excluded);
                        });
                    }
                    if (item.excludedChildren) {
                        item.excludedChildren.forEach(function(child) {
                            updateCollectionsForItem(child, item, true);
                        });
                    }
                    if (item.sceneNodeIds) {
                        sap.ui.vtm.TreeItemUtilities.getSceneNodeIds(item).forEach(function(sceneNodeId) {
                            this._treeItemsBySceneNodeId.addValue(sceneNodeId, item);
                        }.bind(this));
                    }
                }.bind(this);

                rootItems.forEach(function(rootItem) {
                    updateCollectionsForItem(rootItem, null);
                });

                if (checkForHierarchyChanges && !hierarchyChanged) {
                    if (oldIncludedTreeItems && oldIncludedTreeItems.length !== this._includedTreeItems.length) {
                        hierarchyChanged = true;
                    }
                    if (oldExcludedTreeItems && oldExcludedTreeItems.length !== this._excludedTreeItems.length) {
                        hierarchyChanged = true;
                    }
                }

                return checkForHierarchyChanges && hierarchyChanged;
            },

            /**
             * Update just the collection used by {@link #getItemsBySceneNodeId}.
             * 
             * This is useful when the only changes to the tree since the last call to {@link #updateCollections} are changes to the <code>sceneNodeIds<code> properties of the tree items.
             * @public
             * @function
             * @param {string[]} rootItems The root items of the {@link sap.ui.vtm.Tree}.
             */
            updateTreeItemsBySceneNodeId: function(rootItems) {
                this._treeItemsBySceneNodeId = new sap.ui.vtm.Lookup();
                sap.ui.vtm.TreeItemUtilities.traverseTree(rootItems, function(treeItem) {
                    sap.ui.vtm.TreeItemUtilities.getSceneNodeIds(treeItem).forEach(function(sceneNodeId) {
                        this._treeItemsBySceneNodeId.addValue(sceneNodeId, treeItem);
                    }.bind(this));
                    return sap.ui.vtm.ChildCollectionType.IncludedAndExcluded;
                }.bind(this));
            },

            /**
             * Finds a tree item by id or returns undefined if it is not found.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {string} treeItemId The tree item id to look for.
             * @returns {object|undefined} The tree item matching the specified id or undefined if no match was found.
             */
            getItem: function (treeItemId) {
                return this._treeItemsById.get(treeItemId);
            },

            /**
             * Returns whether a tree item object is an included tree item in the tree model of this {@link sap.ui.vtm.Tree}.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object|string} treeItem The tree item or tree item id to check.
             * @return {boolean} Whether a tree item object is an included tree item in this tree.
             */
            isIncludedItem: function(treeItem) {
                treeItem = this.getTreeItem(treeItem);
                return this._includedTreeItems.indexOf(treeItem) !== -1;
            },
            
            /**
             * Returns whether a tree item object is an excluded tree item in the tree model of this {@link sap.ui.vtm.Tree}.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object|string} treeItem The tree item or tree item id to check.
             * @return {boolean} Whether a tree item object is an included tree item in this tree.
             */
            isExcludedItem: function(treeItem) {
                treeItem = this.getTreeItem(treeItem);
                return this._excludedTreeItems.indexOf(treeItem) !== -1;
            },

            /**
             * Finds the set of tree items that are associated with a particular scene node id.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * When the only changes to the tree since the last call to {@link #updateCollections} are changes to the  <code>sceneNodeIds<code> properties of the tree items, it is possible to use {@link #updateTreeItemsBySceneNodeId} instead of {@link #updateCollections}.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds The scene node ID or IDs to find.
             * @param {sap.ui.vtm.TreeItemType?} treeItemType Indicates the types of tree item to match.
             * Defaults to {@link sap.ui.vtm.TreeItemType.Included}.
             * @returns {object[]} The set of tree items that have a <code>sceneNodeIds</code> property that contains the specified scene node id.
             */
            getItemsBySceneNodeId: function (sceneNodeIds, treeItemType) {
                sceneNodeIds = sap.ui.vtm.ArrayUtilities.wrap(sceneNodeIds);
                if (!sceneNodeIds.length) {
                    return [];
                }
                treeItemType = treeItemType || sap.ui.vtm.TreeItemType.Included;
                
                var treeItemMatchesType = function(treeItem, treeItemType) {
                    switch (treeItemType) {
                    case sap.ui.vtm.TreeItemType.IncludedOrExcluded:
                        return true;
                    case sap.ui.vtm.TreeItemType.Included:
                        return this.isIncludedItem(treeItem);
                    case sap.ui.vtm.TreeItemType.Excluded:
                        return this.isExcludedItem(treeItem);
                    default:
                        throw "Unexpected sap.ui.vtm.TreeItemType value " + treeItemType;
                    }
                }.bind(this);
                
                var treeItemsToReturn = [];
                sceneNodeIds.forEach(function(sceneNodeId) {
                    var treeItems = this._treeItemsBySceneNodeId.getValues(sceneNodeId);
                    treeItems.forEach(function(treeItem) {
                        if (treeItemsToReturn.indexOf(treeItem) === -1 && treeItemMatchesType(treeItem, treeItemType)) {
                            treeItemsToReturn.push(treeItem);
                        }
                    });
                }.bind(this));
                return treeItemsToReturn;
            },

            /**
             * Finds a parent tree item by child id or returns undefined if it is not found.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object|string} treeItem The child tree item or tree item id.
             * @returns {object|undefined} The parent tree item or undefined if no match was found.
             */
            getParentItem: function (treeItem) {
                var treeItemId = this.getTreeItemId(treeItem);
                var parentId = this._parentIdsById.get(treeItemId);
                if (!parentId) {
                    return undefined;
                }
                return this._treeItemsById.get(parentId);
            },

            /**
             * Gets the descendants of a tree item.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object|string} treeItem The tree item or id of the tree item to get the descendants of.
             * @param {sap.ui.vtm.TreeItemType?} treeItemType Indicates the types of tree item to match.
             * Defaults to {@link sap.ui.vtm.TreeItemType.Included}.
             * @returns {object[]|undefined} The descendants of the tree item or undefined if the tree item is not found.
             */
            getDescendantItems: function (treeItem, treeItemType) {
                treeItem = this.getTreeItem(treeItem);
                treeItemType = treeItemType || sap.ui.vtm.TreeItemType.Included;
                var descendantItems = [];
                switch (treeItemType) {
                case sap.ui.vtm.TreeItemType.IncludedOrExcluded:
                    sap.ui.vtm.TreeItemUtilities.traverseBranch(treeItem, function (ti) {
                        if (ti !== treeItem) {
                            descendantItems.push(ti);
                        }
                        return sap.ui.vtm.ChildCollectionType.IncludedAndExcluded;
                    });
                    break;
                case sap.ui.vtm.TreeItemType.Included:
                    sap.ui.vtm.TreeItemUtilities.traverseBranch(treeItem, function (ti) {
                        if (ti === treeItem) {
                            return this.isIncludedItem(ti)
                                ? sap.ui.vtm.ChildCollectionType.Included
                                : sap.ui.vtm.ChildCollectionType.None;
                        } else {
                            descendantItems.push(ti);
                            return sap.ui.vtm.ChildCollectionType.Included;
                        }
                    }.bind(this));
                    break;
                case sap.ui.vtm.TreeItemType.Excluded:
                    sap.ui.vtm.TreeItemUtilities.traverseBranch(treeItem, function (ti) {
                        if (ti === treeItem) {
                            return sap.ui.vtm.ChildCollectionType.IncludedAndExcluded;
                        } else {
                            if (this.isExcludedItem(ti)) {
                                descendantItems.push(ti);
                            }
                            return sap.ui.vtm.ChildCollectionType.IncludedAndExcluded;
                        }
                    }.bind(this));
                    break;
                default:
                    throw "Unexpected sap.ui.vtm.TreeItemType value " + treeItemType;
                }
                return descendantItems;
            },

            /**
             * Finds all ancestors of a tree item.
             *
             * An empty array will be returned for root items.<br/>
             * Otherwise an array of ancestor tree items will be returned.<br/>
             * The array will be ordered such that:
             * <ul>
             * <li>The root item will be first element in the array.</li>
             * <li>The parent item will be last element in the array.</li>
             * </ul>
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object|string} treeItem The tree item or id of the tree item to get the ancestors of.
             * @returns {object[]} The ancestors of the tree item.
             */
            getAncestorItems: function (treeItem) {
                treeItem = this.getTreeItem(treeItem);
                var ancestors = [];
                var ancestor = this.getParentItem(treeItem.id);
                while (ancestor) {
                    ancestors.push(ancestor);
                    ancestor = this.getParentItem(ancestor.id);
                }
                return ancestors.reverse();
            },

            /**
             * Finds all tree items in the tree of a given type.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {sap.ui.vtm.TreeItemType?} treeItemType Indicates the types of tree item to match.
             * Defaults to {@link sap.ui.vtm.TreeItemType.Included}.
             * @returns {object[]} All the tree items in the tree.
             */
            getAllItems: function (treeItemType) {
                treeItemType = treeItemType || sap.ui.vtm.TreeItemType.Included;
                switch (treeItemType) {
                case sap.ui.vtm.TreeItemType.IncludedOrExcluded:
                    return this._includedTreeItems.concat(this._excludedTreeItems);
                case sap.ui.vtm.TreeItemType.Included:
                    return this._includedTreeItems.slice();
                case sap.ui.vtm.TreeItemType.Excluded:
                    return this._excludedTreeItems.slice();
                default:
                    throw "Unexpected sap.ui.vtm.TreeItemType value " + treeItemType;
                }
            }
        });

        return TreeCollections;
    });