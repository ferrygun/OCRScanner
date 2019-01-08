/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying the type(s) of tree item to match during tree traversal.
         *
         * @enum {string}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.TreeItemType = {

            /**
             * A tree item that can be shown in the tree.
             * A tree item is an included tree item when it is a root tree item or is included in the <code>includedChildren</code> collection of its parent.
             * @public
             */
            Included: "Included",

            /**
             * A tree item that is in the object hierarchy of the tree model, but cannot be shown in the tree.
             * A tree item is an excluded tree item when any ancestor of the tree item is included in the <code>excludedChildren</code> collection of its parent.
             * @public
             */
            Excluded: "Excluded",

            /**
             * Matches either included or excluded tree items.
             * @public
             */
            IncludedOrExcluded: "IncludedOrExcluded"
        };

        return sap.ui.vtm.TreeItemType;
    });