/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying which tree item child collections an operation should apply to.
         *
         * @enum {string}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.ChildCollectionType = {

            /**
             * The operation should not apply to either the <code>includedChildren</code> or <code>excludedChildren</code> collection of the tree item.
             * @public
             */
            None: "None",

            /**
             * The operation should apply to the <code>includedChildren</code> collection of the tree item only.
             * @public
             */
            Included: "Included",

            /**
             * The operation should apply to the <code>excludedChildren</code> collection of the tree item only.
             * @public
             */
            Excluded: "Excluded",

            /**
             * The operation should apply to the <code>includedChildren</code> and the <code>excludedChildren</code> collection of the tree item.
             * @public
             */
            IncludedAndExcluded: "IncludedAndExcluded"
        };

        return sap.ui.vtm.ChildCollectionType;
    });