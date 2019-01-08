/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([],
    function () {
        "use strict";

        /**
         * Enumeration specifying descriptors for {@link sap.ui.vtm.Column} objects of type {@link sap.ui.vtm.ColumnType.Internal}.
         *
         * @enum {string}
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This type is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
         */
        sap.ui.vtm.InternalColumnDescriptor = {

            /**
             * The column that contains the tree item name and the tree type icon.
             * This must always be the first column.
             * @public
             */
            Tree: "Tree",

            /**
             * The column that is used to provide an indication of the messages that apply to the tree item and its descendants.
             * @public
             */
            MessageStatus: "MessageStatus",

            /**
             * The column that is used to indicate and control visibility of the scene nodes associated with the tree item.
             * @public
             */
            Visibility: "Visibility",

            /**
             * A column containing the <code>id</code> field of the tree item.
             * @public
             */
            TreeItemId: "TreeItemId",

            /**
             * A column showing the <code>absoluteMatrix</code> field of the tree item.
             * @public
             */
            AbsoluteMatrix: "AbsoluteMatrix",

            /**
             * A column showing the <code>relativeMatrix</code> field of the tree item.
             * @public
             */
            RelativeMatrix: "RelativeMatrix",

            /**
             * A column showing the <code>sceneNodeIds</code> field of the tree item.
             * @public
             */
            SceneNodeIds: "SceneNodeIds",

            /**
             * A column showing the <code>opacity</code> field of the tree item.
             * @public
             */
            Opacity: "Opacity",

            /**
             * A column showing the <code>highlightColor</code> field of the tree item.
             * @public
             */
            HighlightColor: "HighlightColor"
        };

        return sap.ui.vtm.InternalColumnDescriptor;
    });