/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ['jquery.sap.global', "sap/ui/core/Message", "./ArrayUtilities"],
    function(jQuery, SapUiCoreMessage, SapUiVtmArrayUtilities) {

        "use strict";

        /**
         * A set of utility functions for working with tree items for {@link sap.ui.vtm.Tree} controls.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @namespace
         * @name sap.ui.vtm.TreeItemUtilities
         * @public
         * @author SAP SE
         * @version 1.52.0
         */
        var TreeItemUtilities = {};

        /**
         * Applies a mapping function to each tree item in a branch of a tree to create a new tree branch.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.mapBranch
         * @param {object} treeItem The tree item representing the branch to map.
         * @param {function} mapFunc A function that takes a tree item and returns a new tree item.
         * @returns {object} The mapped tree branch.
         */
        TreeItemUtilities.mapBranch = function(treeItem, mapFunc) {
            var mappedTreeItem = mapFunc(treeItem);
            if (treeItem.includedChildren) {
                mappedTreeItem.includedChildren = treeItem.includedChildren.map(function (child) {
                    return TreeItemUtilities.mapBranch(child, mapFunc);
                });
            }
            if (treeItem.excludedChildren) {
                mappedTreeItem.excludedChildren = treeItem.excludedChildren.map(function (child) {
                    return TreeItemUtilities.mapBranch(child, mapFunc);
                });
            }
            return mappedTreeItem;
        };

        /**
         * Applies a mapping function to each tree item in a tree to create a new tree.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.mapTree
         * @param {object[]} rootTreeItems The root tree items of the tree to map.
         * @param {function} mapFunc A function that takes a tree item and returns a new tree item.
         * @returns {object[]} The root tree items of the mapped tree.
         */
        TreeItemUtilities.mapTree = function(rootTreeItems, mapFunc) {
            var mappedRootItems = [];
            rootTreeItems.forEach(function(rootTreeItem) {
                mappedRootItems.push(TreeItemUtilities.mapBranch(rootTreeItem, mapFunc));
            });
            return mappedRootItems;
        };

        var valueCloneFunc = function (item) {
            return Array.isArray(item)
                ? sap.ui.vtm.ArrayUtilities.shallowClone(item)
                : item;
        };

        var mapObjectClone = function(mapObject){
            if (mapObject === null || mapObject === undefined) {
                return mapObject;
            }
            var cloned = {};
            var keys = Object.keys(mapObject);
            keys.forEach(function(key) {
                 cloned[key] = valueCloneFunc(mapObject[key]);
            });
            return cloned;
        };

        /**
         * Returns a cloned copy of the metadata on the passed tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.cloneMetadata
         * @param {object} treeItem The tree item.
         * @returns {object} A cloned copy of the metadata on the passed tree item.
         */
        TreeItemUtilities.cloneMetadata = function(treeItem){
            return mapObjectClone(treeItem.metadata);
        };

        /**
         * Returns a cloned copy of the identifiers on the passed tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.cloneIdentifiers
         * @param {object} treeItem The tree item.
         * @returns {object} A cloned copy of the metadata on the passed tree item.
         */
        TreeItemUtilities.cloneIdentifiers = function(treeItem){
            return mapObjectClone(treeItem.identifiers);
        };

        /**
         * Returns a cloned copy of the appData on the passed tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.cloneAppData
         * @param {object} treeItem The tree item.
         * @returns {object} A cloned copy of the appData on the passed tree item.
         */
        TreeItemUtilities.cloneAppData = function(treeItem){
            return mapObjectClone(treeItem.appData);
        };

        /**
         * Returns whether the tree item has a <code>visibility</code> value.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.hasVisibility
         * @param {object} treeItem The tree item.
         * @returns {boolean} Whether the tree item has a <code>visibility</code> value.
         */
        TreeItemUtilities.hasVisibility = function(treeItem) {
            return treeItem.visibility === true || treeItem.visibility === false;
        };

        /**
         * Gets the application data field descriptors for a given tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getAppDataDescriptors
         * @param {object} treeItem The tree item to get application data field descriptors from.
         * @returns {string[]} The application data field descriptors for the given tree item.
         */
        TreeItemUtilities.getAppDataDescriptors = function (treeItem) {
            if (!treeItem.appData) {
                return [];
            }
            return Object.keys(treeItem.appData);
        };

        /**
         * Gets the application data values associated with a particular descriptor for a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getAppDataValues
         * @param {object} treeItem The tree item to get application data values from.
         * @param {string} descriptor The descriptor describing the application data value(s) to retrieve.
         * @returns {string[]|number[]|boolean[]|object[]} The application data values.
         */
        TreeItemUtilities.getAppDataValues = function (treeItem, descriptor) {
            if (!treeItem.appData) {
                return [];
            }
            return SapUiVtmArrayUtilities.wrap(treeItem.appData[descriptor]);
        };

        /**
         * Set the application data values associated with a particular descriptor for a tree item (replacing any existing values).
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setAppDataValues
         * @param {object} treeItem The tree item to update.
         * @param {string} descriptor The descriptor describing the application data value(s) to update.
         * @param {undefined|string|string[]|number|number[]|boolean|boolean[]|object|object[]} values The application data value or values to apply. A value of undefined clears all values for the descriptor.
         */
        TreeItemUtilities.setAppDataValues = function (treeItem, descriptor, values) {
            var value = SapUiVtmArrayUtilities.unwrap(values);
            if (value === undefined) {
                if (treeItem.appData) {
                    delete treeItem.appData[descriptor];
                }
            } else {
                if (!treeItem.appData) {
                    treeItem.appData = {};
                }
                treeItem.appData[descriptor] = values;
            }
        };

        /**
         * Gets the metadata field descriptors for a given tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getMetadataDescriptors
         * @param {object} treeItem The tree item to get metadata field descriptors from.
         * @returns {string[]} The metadata field descriptors for the given tree item.
         */
        TreeItemUtilities.getMetadataDescriptors = function (treeItem) {
            if (!treeItem.metadata) {
                return [];
            }
            return Object.keys(treeItem.metadata);
        };

        /**
         * Gets the metadata values associated with a particular descriptor for a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getMetadataValues
         * @param {object} treeItem The tree item to metadata values from.
         * @param {string} descriptor The descriptor describing the metadata value(s) to retrieve.
         * @returns {string[]|number[]|boolean[]|object[]} The metadata values.
         */
        TreeItemUtilities.getMetadataValues = function (treeItem, descriptor) {
            if (!treeItem.metadata) {
                return [];
            }
            return SapUiVtmArrayUtilities.wrap(treeItem.metadata[descriptor]);
        };

        /**
         * Set the metadata values associated with a particular descriptor for a tree item (replacing any existing values).
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setMetadataValues
         * @param {object} treeItem The tree item to update.
         * @param {string} descriptor The descriptor describing the metadata value(s) to update.
         * @param {undefined|string|string[]|number|number[]|boolean|boolean[]|object|object[]} values The metadata value or values to apply. A value of undefined clears all values for the descriptor.
         */
        TreeItemUtilities.setMetadataValues = function (treeItem, descriptor, values) {
            var value = SapUiVtmArrayUtilities.unwrap(values);
            if (value === undefined) {
                if (treeItem.metadata) {
                    delete treeItem.metadata[descriptor];
                }
            } else {
                if (!treeItem.metadata) {
                    treeItem.metadata = {};
                }
                treeItem.metadata[descriptor] = values;
            }
        };

        /**
         * Gets the identifier descriptors for a given tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getIdentifierDescriptors
         * @param {object} treeItem The tree item to get identifier descriptors from.
         * @returns {string[]} The identifier descriptors for the given tree item.
         */
        TreeItemUtilities.getIdentifierDescriptors = function (treeItem) {
            if (!treeItem || !treeItem.identifiers) {
                return [];
            }
            return Object.keys(treeItem.identifiers);
        };

        /**
         * Gets the identifier values associated with a particular descriptor for a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getIdentifierValues
         * @param {object} treeItem The tree item to retrieve values from.
         * @param {string} descriptor The descriptor describing the identifier value(s) to retrieve.
         * @returns {string[]} The identifier values.
         */
        TreeItemUtilities.getIdentifierValues = function (treeItem, descriptor) {
            if (!treeItem.identifiers) {
                return [];
            }
            return SapUiVtmArrayUtilities.wrap(treeItem.identifiers[descriptor]);
        };

        /**
         * Set the identifier values associated with a particular descriptor for a tree item (replacing any existing values).
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setIdentifierValues
         * @param {object} treeItem The tree item to update.
         * @param {string} descriptor The descriptor describing the identifier value(s) to update.
         * @param {string|string[]|undefined} values The identifier value or values to apply. A value of undefined clears all values for the descriptor.
         */
        TreeItemUtilities.setIdentifierValues = function (treeItem, descriptor, values) {
            var value = SapUiVtmArrayUtilities.unwrap(values);
            if (value === undefined) {
                if (treeItem.identifiers) {
                    delete treeItem.identifiers[descriptor];
                }
            } else {
                if (!treeItem.identifiers) {
                    treeItem.identifiers = {};
                }
                treeItem.identifiers[descriptor] = values;
            }
        };

        /**
         * Gets the IDs of the scene nodes associated with a tree item as an array of strings.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getSceneNodeIds
         * @param {object} treeItem The tree item.
         * @returns {string[]} The scene node IDs for the tree item.
         */
        TreeItemUtilities.getSceneNodeIds = function(treeItem) {
            if (!treeItem.sceneNodeIds) {
                return [];
            }
            return SapUiVtmArrayUtilities.wrap(treeItem.sceneNodeIds);
        };

        /**
         * Sets the IDs of the scene nodes to associate with a tree item in a memory efficient manner.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setSceneNodeIds
         * @param {object} treeItem The tree item.
         * @param {string|string[]|undefined} sceneNodeIds The scene node IDs for the tree item. A value of undefined clears all values for the descriptor.
         */
        TreeItemUtilities.setSceneNodeIds = function(treeItem, sceneNodeIds) {
            sceneNodeIds = SapUiVtmArrayUtilities.unwrap(sceneNodeIds);
            if (sceneNodeIds === undefined) {
                if (treeItem.sceneNodeIds) {
                    delete treeItem.sceneNodeIds;
                }
            } else {
                treeItem.sceneNodeIds = sceneNodeIds;
            }
         };

        /**
         * Gets the included children of a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getIncludedChildren
         * @param {object} treeItem The tree item.
         * @returns {object[]} The included children of the tree item.
         */
        TreeItemUtilities.getIncludedChildren = function(treeItem) {
            if (!treeItem.includedChildren) {
                return [];
            }
            return treeItem.includedChildren;
        };

        /**
         * Gets the excluded children of a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getExcludedChildren
         * @param {object} treeItem The tree item.
         * @returns {object[]} The excluded children of the tree item.
         */
        TreeItemUtilities.getExcludedChildren = function(treeItem) {
            if (!treeItem.excludedChildren) {
                return [];
            }
            return treeItem.excludedChildren;
        };

        /**
         * Gets the children of a tree item from the <code>includedChildren</code> and/or <code>excludedChildren</code> collections.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getChildren
         * @param {object} treeItem The tree item.
         * @param {sap.ui.vtm.ChildCollectionType?} childCollectionType Specifies which child item collections to get children from.
         * <ul>
         * <li>{@link sap.ui.vtm.ChildCollectionType.None} - An empty array is returned.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Included} - Gets the items in the <code>includedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Excluded} - Gets the items in the <code>excludedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.IncludedAndExcluded} - Gets the items in the <code>includedChildren</code> and <code>excludedChildren</code> collections of the tree item.</li>
         * </ul>
         * The default value is {@link sap.ui.vtm.ChildCollectionType.Included}.
         * @returns {object[]} The children of the tree item of the given type.
         */
        TreeItemUtilities.getChildren = function(treeItem, childCollectionType) {
            switch (childCollectionType) {
            case sap.ui.vtm.ChildCollectionType.None:
                return [];
            case null:
            case undefined:
            case sap.ui.vtm.ChildCollectionType.Included:
                return TreeItemUtilities.getIncludedChildren(treeItem);
            case sap.ui.vtm.ChildCollectionType.Excluded:
                return TreeItemUtilities.getExcludedChildren(treeItem);
            case sap.ui.vtm.ChildCollectionType.IncludedAndExcluded:
                return TreeItemUtilities.getIncludedChildren(treeItem).concat(TreeItemUtilities.getExcludedChildren(treeItem));
            default:
                throw "Unknown sap.ui.vtm.ChildCollectionType value: " + childCollectionType;
            }
        };

        /**
         * Sets the <code>includedChildren</code> collection of a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setIncludedChildren
         * @param {object} treeItem The tree item.
         * @param {object[]} includedChildren The items to set in  the <code>includedChildren</code> collection of the tree item.
         */
        TreeItemUtilities.setIncludedChildren = function(treeItem, includedChildren) {
            includedChildren = sap.ui.vtm.ArrayUtilities.wrap(includedChildren);
            if (includedChildren.length == 0) {
                delete treeItem.includedChildren;
            } else {
                treeItem.includedChildren = includedChildren;
            }
        };

        /**
         * Sets the <code>excludedChildren</code> collection of a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setExcludedChildren
         * @param {object} treeItem The tree item.
         * @param {object[]} excludedChildren The items to set in  the <code>includedChildren</code> collection of the tree item.
         */
        TreeItemUtilities.setExcludedChildren = function(treeItem, excludedChildren) {
            excludedChildren = sap.ui.vtm.ArrayUtilities.wrap(excludedChildren);
            if (excludedChildren.length == 0) {
                delete treeItem.excludedChildren;
            } else {
                treeItem.excludedChildren = excludedChildren;
            }
        };

        /**
         * Sets either the <code>includedChildren</code> or <code>excludedChildren</code> collection of a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setChildren
         * @param {object} treeItem The tree item.
         * @param {object[]} children The items to set in the <code>includedChildren</code> or <code>excludedChildren</code> collection of the tree item.
         * @param {sap.ui.vtm.ChildCollectionType?} childCollectionType Controls which child collection to set on the tree item.
         * <ul>
         * <li>{@link sap.ui.vtm.ChildCollectionType.None} - No action is performed.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Included} - The <code>includedChildren</code> collection of the tree item will be set.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Excluded} - The <code>excludedChildren</code> collection of the tree item will be set.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.IncludedAndExcluded} - Results in an exception being thrown because tree item IDs must be unique in the tree at any given point in time, so a tree item cannot be added to both collections.</li>
         * </ul>
         * The default value is {@link sap.ui.vtm.ChildCollectionType.Included}.
         */
        TreeItemUtilities.setChildren = function(treeItem, children, childCollectionType) {
            switch (childCollectionType) {
            case sap.ui.vtm.ChildCollectionType.None:
                break;
            case null:
            case undefined:
            case sap.ui.vtm.ChildCollectionType.Included:
                TreeItemUtilities.setIncludedChildren(treeItem, children);
                break;
            case sap.ui.vtm.ChildCollectionType.Excluded:
                TreeItemUtilities.setExcludedChildren(treeItem, children);
                break;
            case sap.ui.vtm.ChildCollectionType.IncludedAndExcluded:
                throw "sap.ui.vtm.ChildCollectionType.IncludedAndExcluded cannot be used in sap.ui.vtm.TreeItemUtilities.setChildren";
            default:
                throw "Unknown sap.ui.vtm.ChildCollectionType value: " + childCollectionType;
            }
        };

        /**
         * Gets whether a tree item has included children.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.hasIncludedChildren
         * @param {object} treeItem The tree item.
         * @returns {object[]} The included children of the tree item.
         */
        TreeItemUtilities.hasIncludedChildren = function(treeItem) {
            return treeItem.includedChildren && treeItem.includedChildren.length;
        };

        /**
         * Gets whether a tree item has excluded children.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.hasExcludedChildren
         * @param {object} treeItem The tree item.
         * @returns {object[]} The excluded children of the tree item.
         */
        TreeItemUtilities.hasExcludedChildren = function(treeItem) {
            return treeItem.excludedChildren && treeItem.excludedChildren.length;
        };

        /**
         * Gets whether a tree item has items in the <code>includedChildren</code> and/or <code>excludedChildren</code> collections.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.hasChildren
         * @param {object} treeItem The tree item.
         * @param {sap.ui.vtm.ChildCollectionType?} childCollectionType The child item collections to check.
         * <ul>
         * <li>{@link sap.ui.vtm.ChildCollectionType.None} - Returns <code>false</code>.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Included} - Gets whether there are items in the <code>includedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Excluded} - Gets whether there are items in the <code>excludedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.IncludedAndExcluded} - Gets whether there are items in either the <code>includedChildren</code> collection or the <code>excludedChildren</code> collection of the tree item.</li>
         * </ul>
         * The default value is {@link sap.ui.vtm.ChildCollectionType.Included}.
         * @returns {boolean} Whether the tree item has children of the given type.
         */
        TreeItemUtilities.hasChildren = function(treeItem, childCollectionType) {
            switch (childCollectionType) {
            case sap.ui.vtm.ChildCollectionType.None:
                return false;
            case null:
            case undefined:
            case sap.ui.vtm.ChildCollectionType.Included:
                return TreeItemUtilities.hasIncludedChildren(treeItem);
            case sap.ui.vtm.ChildCollectionType.Excluded:
                return TreeItemUtilities.hasExcludedChildren(treeItem);
            case sap.ui.vtm.ChildCollectionType.IncludedAndExcluded:
                return TreeItemUtilities.hasIncludedChildren(treeItem) || TreeItemUtilities.hasExcludedChildren(treeItem);
            default:
                throw "Unknown sap.ui.vtm.ChildCollectionType value: " + childCollectionType;
            }
        };

        /**
         * Calculates the absolute matrix that should be applied to a tree item given its relative matrix and the absolute matrix of its parent.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.calculateAbsoluteMatrix
         * @param {sap.ui.vtm.Matrix} relativeMatrix The relative matrix of the tree item.
         * @param {sap.ui.vtm.Matrix} parentAbsoluteMatrix The absolute matrix of the parent tree item.
         * @returns {sap.ui.vtm.Matrix} The calculated absolute matrix.
         */
        TreeItemUtilities.calculateAbsoluteMatrix = function (relativeMatrix, parentAbsoluteMatrix) {
            if (!relativeMatrix) {
                return parentAbsoluteMatrix || sap.ui.vtm.MatrixUtilities.createIdentity();
            }
            return parentAbsoluteMatrix
                ? sap.ui.vtm.MatrixUtilities.multiply(relativeMatrix, parentAbsoluteMatrix)
                : relativeMatrix;
        };

        /**
         * Calculates the relative matrix that should be applied to a tree item given its absolute matrix and the absolute matrix of its parent.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.calculateRelativeMatrix
         * @param {sap.ui.vtm.Matrix} absoluteMatrix The absolute matrix of the tree item.
         * @param {sap.ui.vtm.Matrix} parentAbsoluteMatrix The absolute matrix of the parent tree item.
         * @returns {sap.ui.vtm.Matrix} The calculated relative matrix.
         */
        TreeItemUtilities.calculateRelativeMatrix = function (absoluteMatrix, parentAbsoluteMatrix) {
            if (!absoluteMatrix) {
                throw "An absolute matrix value is needed to calculate a relative matrix value";
            }
            return parentAbsoluteMatrix
                ? sap.ui.vtm.MatrixUtilities.multiply(absoluteMatrix, sap.ui.vtm.MatrixUtilities.invert(parentAbsoluteMatrix))
                : absoluteMatrix;
        };

        /**
         * Adds a child tree item to the end of the the <code>includedChildren</code> collection of its parent tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.addIncludedChild
         * @param {object} item The parent tree item.
         * @param {object} childItem The child tree item.
         */
        TreeItemUtilities.addIncludedChild = function (item, childItem) {
            if (item.includedChildren) {
                item.includedChildren.push(childItem);
            } else {
                item.includedChildren = [childItem];
            }
        };

        /**
         * Adds a child tree item to the end of the the <code>excludedChildren</code> collection of its parent tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.addExcludedChild
         * @param {object} item The parent tree item.
         * @param {object} childItem The child tree item.
         */
        TreeItemUtilities.addExcludedChild = function (item, childItem) {
            if (item.excludedChildren) {
                item.excludedChildren.push(childItem);
            } else {
                item.excludedChildren = [childItem];
            }
        };

        /**
         * Adds a child tree item to the end of the the <code>includedChildren</code> or <code>excludedChildren</code> collection of its parent tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.addChild
         * @param {object} item The parent tree item.
         * @param {object} childItem The child tree item.
         * @param {sap.ui.vtm.ChildCollectionType?} childCollectionType Controls which child collection to add the child tree item to.
         * <ul>
         * <li>{@link sap.ui.vtm.ChildCollectionType.None} - No action is performed.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Included} - The child tree item will be added to the <code>includedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Excluded} - The child tree item will be added to the <code>excludedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.IncludedAndExcluded} - Results in an exception being thrown because tree item IDs must be unique in the tree at any given point in time, so a tree item cannot be added to both collections.</li>
         * </ul>
         * The default value is {@link sap.ui.vtm.ChildCollectionType.Included}.
         */
        TreeItemUtilities.addChild = function (item, childItem, childCollectionType) {
            switch (childCollectionType) {
            case sap.ui.vtm.ChildCollectionType.None:
                break;
            case null:
            case undefined:
            case sap.ui.vtm.ChildCollectionType.Included:
                TreeItemUtilities.addIncludedChild(item, childItem);
                break;
            case sap.ui.vtm.ChildCollectionType.Excluded:
                TreeItemUtilities.addExcludedChild(item, childItem);
                break;
            case sap.ui.vtm.ChildCollectionType.IncludedAndExcluded:
                throw "sap.ui.vtm.ChildCollectionType.IncludedAndExcluded cannot be used in sap.ui.vtm.TreeItemUtilities.addChild";
            default:
                throw "Unknown sap.ui.vtm.ChildCollectionType value: " + childCollectionType;
            }
        };

        /**
         * Removes a child tree item from the <code>includedChildren</code> collection of its parent tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.removeIncludedChild
         * @param {object} item The parent tree item.
         * @param {string|object} childItem The child tree item to remove (or its id).
         * @returns {object|undefined} Returns the deleted item or undefined if no item was removed.
         */
        TreeItemUtilities.removeIncludedChild = function (item, childItem) {
            var childItemId = (typeof childItem === 'string')
                ? childItem
                : childItem.id;

            if (item.includedChildren) {
                var index = sap.ui.vtm.ArrayUtilities.findIndex(item.includedChildren, function (child) {
                    return child.id === childItemId;
                });
                if (index !== undefined) {
                    var deletedItem = item.includedChildren[index];
                    item.includedChildren.splice(index, 1);
                    if (item.includedChildren.length == 0) {
                        delete item.includedChildren;
                    }
                    return deletedItem;
                }
            }
            return undefined;
        };

        /**
         * Removes a child tree item from the <code>excludedChildren</code> collection of its parent tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.removeExcludedChild
         * @param {object} item The parent tree item.
         * @param {string|object} childItem The child tree item to remove (or its id).
         * @returns {object|undefined} Returns the deleted item or undefined if no item was removed.
         */
        TreeItemUtilities.removeExcludedChild = function (item, childItem) {
            var childItemId = (typeof childItem === 'string')
                ? childItem
                : childItem.id;

            if (item.excludedChildren) {
                var index = sap.ui.vtm.ArrayUtilities.findIndex(item.excludedChildren, function (child) {
                    return child.id === childItemId;
                });
                if (index !== undefined) {
                    var deletedItem = item.excludedChildren[index];
                    item.excludedChildren.splice(index, 1);
                    if (item.excludedChildren.length == 0) {
                        delete item.excludedChildren;
                    }
                    return deletedItem;
                }
            }
            return undefined;
        };

        /**
         * Removes a child tree item from the <code>includedChildren</code> and/or <code>excludedChildren</code> collection of its parent tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.removeChild
         * @param {object} item The parent tree item.
         * @param {string|object} childItem The child tree item to remove (or its id).
         * @param {sap.ui.vtm.ChildCollectionType?} childCollectionType Controls which child collection to remove the child tree item from.
         * <ul>
         * <li>{@link sap.ui.vtm.ChildCollectionType.None} - No action is performed.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Included} - The child tree item will be removed from the <code>includedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.Excluded} - The child tree item will be removed from the <code>excludedChildren</code> collection of the tree item.</li>
         * <li>{@link sap.ui.vtm.ChildCollectionType.IncludedAndExcluded} - The child tree item will be removed from the <code>includedChildren</code> and <code>excludedChildren</code> collections of the tree item.<br/>
         * Note that duplicate tree item ids are not allowed in the tree, so a given tree item should exist in at most one of these collections at a given point in time.</li>
         * </ul>
         * The default value is {@link sap.ui.vtm.ChildCollectionType.Included}.
         * @returns {object|undefined} Returns the deleted item or undefined if no item was removed.
         */
        TreeItemUtilities.removeChild = function (item, childItem, childCollectionType) {
            switch (childCollectionType) {
            case sap.ui.vtm.ChildCollectionType.None:
                break;
            case null:
            case undefined:
            case sap.ui.vtm.ChildCollectionType.Included:
                return TreeItemUtilities.removeIncludedChild(item, childItem);
            case sap.ui.vtm.ChildCollectionType.Excluded:
                return TreeItemUtilities.removeExcludedChild(item, childItem);
            case sap.ui.vtm.ChildCollectionType.IncludedAndExcluded:
                return TreeItemUtilities.removeIncludedChild(item, childItem) || TreeItemUtilities.removeExcludedChild(item, childItem);
            default:
                throw "Unknown sap.ui.vtm.ChildCollectionType value: " + childCollectionType;
            }
        };

        /**
         * Moves all items from the <code>excludedChildren</code> collection of a tree item (or set of tree items) to the <code>includedChildren</code> collection.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.includeAllChildren
         * @param {object[]|object} treeItems The tree item or items.
         * @param {boolean?} recursive When <code>true</code> the items in the <code>excludedChildren</code> collections of descendants are moved to the <code>includedChildren</code> collection of the descendant tree item.
         * Defaults to <code>false</code>.
         */
        TreeItemUtilities.includeAllChildren = function (treeItems, recursive) {
            treeItems = sap.ui.vtm.ArrayUtilities.wrap(treeItems);
            treeItems.forEach(function(item) {
                var allChildren = TreeItemUtilities.getChildren(item, sap.ui.vtm.ChildCollectionType.IncludedAndExcluded);
                TreeItemUtilities.setIncludedChildren(item, allChildren);
                TreeItemUtilities.setExcludedChildren(item, []);
                if (recursive) {
                    allChildren.forEach(function(childItem) {
                        TreeItemUtilities.includeAllChildren(childItem, true);
                    });
                }
            });
        };

        /**
         * Moves all items from the <code>includedChildren</code> collection of a tree item (or set of tree items) to the <code>excludedChildren</code> collection.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.excludeAllChildren
         * @param {object[]|object} treeItems The tree item or items.
         * @param {boolean?} recursive When <code>true</code> the items in the <code>includedChildren</code> collections of descendants are moved to the <code>excludedChildren</code> collection of the descendant tree item.
         * Defaults to <code>false</code>.
         */
        TreeItemUtilities.excludeAllChildren = function (treeItems, recursive) {
            treeItems = sap.ui.vtm.ArrayUtilities.wrap(treeItems);
            treeItems.forEach(function(item) {
                var allChildren = TreeItemUtilities.getChildren(item, sap.ui.vtm.ChildCollectionType.IncludedAndExcluded);
                TreeItemUtilities.setChildren(item, []);
                TreeItemUtilities.setExcludedChildren(item, allChildren);
                if (recursive) {
                    allChildren.forEach(function(childItem) {
                        TreeItemUtilities.excludeAllChildren(childItem, true);
                    });
                }
            });
        };

        /**
         * Removes a root item from the tree.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.removeRoot
         * @param {object[]} rootItems The existing set of root items.
         * @param {string|object} rootItemToRemove The root tree item to remove (or its id).
         * @returns {object|undefined} Returns the deleted item or undefined if no item was removed.
         */
        TreeItemUtilities.removeRoot = function (rootItems, rootItemToRemove) {
            var rootItemId = (typeof rootItemToRemove === 'string')
                ? rootItemToRemove
                : rootItemToRemove.id;

            var index = sap.ui.vtm.ArrayUtilities.findIndex(rootItems, function (rootItem) {
                return rootItem.id === rootItemId;
            });
            if (index !== undefined) {
                var deletedItem = rootItems[index];
                rootItems.splice(index, 1);
                return deletedItem;
            }
            return undefined;
        };

        /**
         * Adds a root item to the tree.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.addRoot
         * @param {object[]} rootItems The existing set of root items.
         * @param {object} rootItemToAdd The root tree item to remove.
         */
        TreeItemUtilities.addRoot = function (rootItems, rootItemToAdd) {
            rootItems.push(rootItemToAdd);
        };

        /**
         * Validates a tree item and returns a set of error messages.
         * @public
         * @function
         * @param {object} treeItem The tree item.
         * @name sap.ui.vtm.TreeItemUtilities.validateTreeItem
         * @returns {string[]} The set of validation errors for the tree item.
         */
        TreeItemUtilities.validateTreeItem = function (treeItem) {
            var isNullOrUndefined = function (object) {
                return object === null || object === undefined;
            };
            var errors = [];
            if (treeItem) {
                if (isNullOrUndefined(treeItem.id)) {
                    errors.push("id is not specified");
                }
                if (!isNullOrUndefined(treeItem.absoluteMatrix)) {
                    if (!sap.ui.vtm.MatrixUtilities.isValid(treeItem.absoluteMatrix, true)) {
                        errors.push("absoluteMatrix is not valid");
                    }
                }
                if (!isNullOrUndefined(treeItem.relativeMatrix)) {
                    if (!sap.ui.vtm.MatrixUtilities.isValid(treeItem.relativeMatrix, true)) {
                        errors.push("relativeMatrix is not valid");
                    }
                }
            }
            return errors;
        };

        /**
         * Validates a tree and returns a set of error messages.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.validateTree
         * @param {object[]} rootItems The root tree items.
         * @returns {string[]} The set of validation errors for the tree item.
         */
        TreeItemUtilities.validateTree = function(rootItems) {
            var errors = [];
            var processTreeItem = function (treeItem, path) {
                var treeItemErrors = TreeItemUtilities.validateTreeItem(treeItem);
                if (treeItemErrors && treeItemErrors.length !== 0) {
                    var errorString = path + ": " + treeItemErrors.join(", ");
                    errors.push(errorString);
                }
                var i;
                var includedChildren = treeItem.includedChildren;
                if (includedChildren) {
                    for (i = 0; i < includedChildren.length; i++) {
                        processTreeItem(includedChildren[i], path + "/includedChildren/" + i);
                    }
                }
                var excludedChildren = treeItem.excludedChildren;
                if (excludedChildren) {
                    for (i = 0; i < excludedChildren.length; i++) {
                        processTreeItem(excludedChildren[i], path + "/excludedChildren/" + i);
                    }
                }
            };
            for (var j = 0; j < rootItems.length; j++) {
                processTreeItem(rootItems[j], "" + j);
            }
            return errors;
        };

        /**
         * Recursively traverses a tree branch calling a function on each item (including the tree item that is the root of the branch).
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.traverseBranch
         * @param {object} treeItem The root of the branch to apply the function to.
         * @param {function} callback The function to apply to tree items in the branch.<br/>
         *                            The first parameter to the callback function is the current tree item object (at the current point of the traversal.<br/>
         *                            The second parameter to the callback function is the set of ancestors of the current tree item.<br/>
         *                            The second parameter to the callback function will not be populated unless the <code>ancestors</code> parameter of  {@link sap.ui.vtm.TreeItemUtilities.traverseBranch traverseBranch} is provided.<br/>
         *                            The function may return a {@link sap.ui.vtm.ChildCollectionType} value to specify which immediate children of the tree item to traverse.<br/>
         *                            If no such value is returned a default of {@link sap.ui.vtm.ChildCollectionType.Included} is used.
         * @param {object[]} [ancestors] The ancestors of the tree item. If provided this will be used to calculate the set of ancestors of each tree item during traversal (to be passed into the callback function).
         */
        TreeItemUtilities.traverseBranch = function (treeItem, callback, ancestors) {
            if (!treeItem) {
                return;
            }
            var childCollectionType = callback(treeItem, ancestors) || sap.ui.vtm.ChildCollectionType.Included;
            if (ancestors && childCollectionType !== sap.ui.vtm.ChildCollectionType.None) {
                ancestors.push(treeItem);
            }
            if (childCollectionType === sap.ui.vtm.ChildCollectionType.IncludedAndExcluded ||
                childCollectionType === sap.ui.vtm.ChildCollectionType.Included) {
                var includedChildren = treeItem.includedChildren;
                if (includedChildren) {
                    includedChildren.forEach(function(includedChild) {
                        TreeItemUtilities.traverseBranch(includedChild, callback, ancestors);
                    });
                }
            }
            if (childCollectionType === sap.ui.vtm.ChildCollectionType.IncludedAndExcluded ||
                childCollectionType === sap.ui.vtm.ChildCollectionType.Excluded) {
                var excludedChildren = treeItem.excludedChildren;
                if (excludedChildren) {
                    excludedChildren.forEach(function(excludedChild) {
                        TreeItemUtilities.traverseBranch(excludedChild, callback, ancestors);
                    });
                }
            }
            if (ancestors && childCollectionType !== sap.ui.vtm.ChildCollectionType.None) {
                ancestors.pop();
            }
        };

        /**
         * Recursively traverses a tree calling a function on each item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.traverseTree
         * @param {object[]} rootItems The root items of the tree.
         * @param {function} callback The function to apply to tree items in the tree.<br/>
         *                            The first parameter to the callback function is the current tree item object (at the current point of the traversal.<br/>
         *                            The second parameter to the callback function is the set of ancestors of the current tree item.<br/>
         *                            The function may return a {@link sap.ui.vtm.ChildCollectionType} value to specify which immediate children to traverse.
         *                            If no such value is returned a default of {@link sap.ui.vtm.ChildCollectionType.Included} is used.
         */
        TreeItemUtilities.traverseTree = function (rootItems, callback) {
            if (rootItems) {
                rootItems.forEach(function(rootItem) {
                    TreeItemUtilities.traverseBranch(rootItem, callback, []);
                });
            }
        };

        /**
         * Gets the messages stored on a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.getMessages
         * @param {object} treeItem The tree item.
         * @returns {sap.ui.core.Message[]} The tree item messages.
         */
        TreeItemUtilities.getMessages = function(treeItem) {
            if (!treeItem.messages || !treeItem.messages.length) {
                return [];
            }
            var parsedMessages = JSON.parse(treeItem.messages);
            var convertedMessages = parsedMessages.map(function(messageSettings) {
                return new sap.ui.core.Message(messageSettings);
            });
            return convertedMessages;
        };

        /**
         * Sets the messages stored on a tree item.
         * @public
         * @function
         * @name sap.ui.vtm.TreeItemUtilities.setMessages
         * @param {object} treeItem The tree item.
         * @param {sap.ui.core.Message[]} messages The set of messages to apply to the tree item.
         */
        TreeItemUtilities.setMessages = function(treeItem, messages) {
            if (!messages || !messages.length) {
                delete treeItem.messages;
                return;
            }
            var convertedMessages = messages.map(function(message) {
                var convertedMessage = {};
                var level = message.getLevel();
                if (level) {
                    convertedMessage.level = level;
                }
                var text = message.getText();
                if (text) {
                    convertedMessage.text = text;
                }
                var icon = message.getIcon();
                if (icon) {
                    convertedMessage.icon = icon;
                }
                var timestamp = message.getTimestamp();
                if (timestamp) {
                    convertedMessage.timestamp = timestamp;
                }
                var readOnly = message.getReadOnly();
                if (readOnly) {
                    convertedMessage.readOnly = readOnly;
                }
                return convertedMessage;
            });
            treeItem.messages = JSON.stringify(convertedMessages);
        };

        return TreeItemUtilities;
    },
    true);
