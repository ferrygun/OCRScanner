/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

/**
 * Initialization Code and shared classes of library sap.ui.vtm.
 */
sap.ui.define([
        "jquery.sap.global",
        'sap/ui/base/DataType',
        "./ArrayUtilities",
        "./MatrixComponent",
        "./MatrixUtilities",
        "./TreeItemUtilities",
        "./HashUtilities",
        "./DescriptorUtilities",
        "./InternalColumns",
        "./ColumnType",
        "./PredefinedView",
        "./TextColor",
        "./SelectionMode",
        "./InternalColumnDescriptor",
        "./ChildCollectionType",
        "./TreeItemType",
        "./ColumnTemplates",
        "./ViewableLoadStatus"
    ],
    function(
        jQuery,
        SapUiBaseDataType,
        SapUiVtmArrayUtilities,
        SapUiVtmMatrixComponent,
        SapUiVtmMatrixUtilities,
        SapUiVtmTreeItemUtilities,
        SapUiVtmHashUtilities,
        SapUiVtmDescriptorUtilities,
        SapUiVtmInternalColumns,
        SapUiVtmColumnType,
        SapUiVtmPredefinedView,
        SapUiVtmTextColor,
        SapUiVtmSelectionMode,
        SapUiVtmInternalColumnDescriptor,
        SapUiVtmChildCollectionType,
        SapUiVtmTreeItemType,
        SapUiVtmColumnTemplates,
        SapUiVtmViewableLoadStatus) {

        "use strict";

        /**
         * SAPUI5 library with controls to visualize, map and restructure hierarchical business data that maps to 3D objects.
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @namespace
         * @name sap.ui.vtm
         * @author SAP SE
         * @version 1.52.0
         * @public
         */

        /**
         * Namespace for extensions that are provided with the sap.ui.vtm library.
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @namespace
         * @name sap.ui.vtm.extensions
         * @author SAP SE
         * @version 1.52.0
         * @public
         */

        /**
         * Namespace for interfaces that are provided with the sap.ui.vtm library.
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @namespace
         * @name sap.ui.vtm.interfaces
         * @author SAP SE
         * @version 1.52.0
         * @public
         */

        sap.ui.getCore().initLibrary({
            name: "sap.ui.vtm",
            dependencies: [
                "sap.ui.core", "sap.ui.table", "sap.m", "sap.ui.vk"
            ],
            interfaces: [
                "sap.ui.vtm.interfaces.IDisplayStateCalculationExtension",
                "sap.ui.vtm.interfaces.IInitialViewExtension",
                "sap.ui.vtm.interfaces.IDownloadProgressExtension",
                "sap.ui.vtm.interfaces.ILoadProgressExtension",
                "sap.ui.vtm.interfaces.IMessageStatusCalculationExtension",
                "sap.ui.vtm.interfaces.IMessageStatusIconClickExtension",
                "sap.ui.vtm.interfaces.IMessageStatusHeaderIconClickExtension",
                "sap.ui.vtm.interfaces.ISelectionLinkingExtension",
                "sap.ui.vtm.interfaces.ISceneNodeHoverHighlightExtension",
                "sap.ui.vtm.interfaces.ISceneNodeHoverTooltipExtension",
                "sap.ui.vtm.interfaces.IViewLinkingExtension",
                "sap.ui.vtm.interfaces.IViewportSelectionLinkingExtension",
                "sap.ui.vtm.interfaces.IVisibilityIconClickExtension",
                "sap.ui.vtm.interfaces.IVisibilityHeaderIconClickExtension"
            ],
            types: [
                "sap.ui.vtm.Matrix"
            ],
            controls: [
                "sap.ui.vtm.Panel",
                "sap.ui.vtm.Tree",
                "sap.ui.vtm.Text",
                "sap.ui.vtm.Viewport",
                "sap.ui.vtm.MessagesPopover",
                "sap.ui.vtm.Progress",
                "sap.ui.vtm.ProgressDialog",
                "sap.ui.vtm.SelectColumnsDialog"
            ],
            elements: [
                "sap.ui.vtm.Vtm",
                "sap.ui.vtm.Column",
                "sap.ui.vtm.Lookup",
                "sap.ui.vtm.ViewableLoadInfo",
                "sap.ui.vtm.Viewable",
                "sap.ui.vtm.Scene",
                "sap.ui.vtm.SceneNode",
                "sap.ui.vtm.Extension",
                "sap.ui.vtm.DisplayGroup",
                "sap.ui.vtm.TreeCollections",

                // Extensions
                "sap.ui.vtm.extensions.SyncSelectionOnTreeChangeExtension",
                "sap.ui.vtm.extensions.MessageStatusCalculationExtension",
                "sap.ui.vtm.extensions.MessageStatusIconClickExtension",
                "sap.ui.vtm.extensions.ViewportSelectionLinkingExtension",
                "sap.ui.vtm.extensions.SelectionLinkingExtension",
                "sap.ui.vtm.extensions.VisibilityIconClickExtension",
                "sap.ui.vtm.extensions.DisplayStateCalculationExtension",
                "sap.ui.vtm.extensions.SelectionKeepingExtension",
                "sap.ui.vtm.extensions.ViewLinkingExtension",
                "sap.ui.vtm.extensions.InitialViewExtension",
                "sap.ui.vtm.extensions.LoadProgressExtension",
                "sap.ui.vtm.extensions.SceneNodeHoverHighlightExtension",
                "sap.ui.vtm.extensions.SceneNodeHoverTooltipExtension"
            ],
            noLibraryCSS: false,
            version: "1.52.0"
        });

        /**
         * Creates an instance of {@link sap.ui.vtm.Vtm} with a default set of extensions.
         *
         * The {@link sap.ui.vtm.Vtm} constructor can be used to create an instance of {@link sap.ui.vtm.Vtm} with a specific set of extensions.
         * @public
         * @function
         * @name sap.ui.vtm.createVtm
         * @param {string?} sId The id to pass to the {@link sap.ui.vtm.Vtm} constructor.
         * @param {object?} mSettings The settings to pass to the {@link sap.ui.vtm.Vtm} constructor. Any extensions specified in the settings will be replaced with a default set.
         * @returns {sap.ui.vtm.Vtm} The created instance of {@link sap.ui.vtm.Vtm}.
         */
        sap.ui.vtm.createVtm = function(sId, mSettings) {
            return new sap.ui.vtm.Vtm(sId, jQuery.extend(mSettings, {
                addDefaultExtensions: true
            }));
        };

        var resourceBundle;
        
        /**
         * Gets the resource bundle for the sap.ui.vtm library.
         * @private
         * @function
         * @name sap.ui.vtm.getResourceBundle
         * @returns {jQuery.sap.util.ResourceBundle} The resource bundle for the sap.ui.vtm library.
         */
        sap.ui.vtm.getResourceBundle = function() {
            if (!resourceBundle) {
                resourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.vtm.i18n");
            }
            return resourceBundle;
        };

        /**
         * Used to construct a measurement id.
         * @private
         * @function
         * @name sap.ui.vtm.createMeasureId
         * @param {sap.ui.base.ManagedObject|string} object A ManagedObject or a string to use when constructing a measure id string.
         * @param {string} measureName An additional string component to use when constructing a measure id string.
         * @returns {string} The measure id string that was constructed for this measurement.
         */
        sap.ui.vtm.createMeasureId = function(object, measureName) {
            return (typeof object === "string")
                ? object + "#" + measureName
                : object.getMetadata().getName() + "#" + measureName + " " + object.getId();
        };

        /**
         * Used to measure the duration of some operation.
         * @private
         * @function
         * @name sap.ui.vtm.measure
         * @param {sap.ui.base.ManagedObject|string} object A ManagedObject or a string to use when constructing a measure id string.
         * @param {string} measureName An additional string component to use when constructing a measure id string.
         * @param {function} task A function to measure.
         * @returns {string} The measure id string that was constructed for this measurement.
         */
        sap.ui.vtm.measure = function(object, measureName, task) {
            var measureId = sap.ui.vtm.createMeasureId(object, measureName);
            jQuery.sap.measure.start(measureId, "", ["sap.ui.vtm"]);
            try {
                task();
            } finally {
                jQuery.sap.measure.end(measureId);
            }
            return measureId;
        };
        
        /**
         * @classdesc A float[] type representing a transformation matrix in a ISO 10303-42 format (in a 1 dimensional array of 13 numbers).
         *
         * The {@link sap.ui.vtm.MatrixComponent} enumeration enumerates the array indices of the matrix components for this type 
         * @final
         * @namespace
         * @public
         * @experimental Since 1.0.0 This class is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This simple type also will be described in the UI5 (legacy) designtime metamodel
         */
        
        sap.ui.vtm.Matrix = SapUiBaseDataType.createType("sap.ui.vtm.Matrix", {
                isValid: function(value) {
                    return sap.ui.vtm.Matrix.getBaseType().isValid(value) && value.length === 13;
                }
            },
            SapUiBaseDataType.getType("float[]")
        );

        /**
         * Interface for extensions which manage the display state (visibility, opacity, highlight color) of the scene nodes in the VTM viewports.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IDisplayStateCalculationExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which manage the initial view in the VTM viewports after loading an initial set of viewables.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IInitialViewExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which indicate progress while viewables are being downloaded.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IDownloadProgressExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which indicate progress while viewables are being loaded.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.ILoadProgressExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which calculate the icon to show for each tree item in the {@link sap.ui.vtm.InternalColumnDescriptor.MessageStatus} column.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IMessageStatusCalculationExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which provide a behaviour when an icon in the {@link sap.ui.vtm.InternalColumnDescriptor.MessageStatus} column is clicked.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IMessageStatusIconClickExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which provide a behaviour when the icon in the column header for the {@link sap.ui.vtm.InternalColumnDescriptor.MessageStatus} column is clicked.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IMessageStatusHeaderIconClickExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which link the selections in trees across panels.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.ISelectionLinkingExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which highlight the scene node that is being hovered over in a viewport.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.ISceneNodeHoverHighlightExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which show a tooltip for the scene node that is being hovered over in a viewport.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.ISceneNodeHoverTooltipExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which link the views (camera positions) across VTM viewports.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IViewLinkingExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which link the selection state between the tree and the viewport in each VTM panel.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IViewportSelectionLinkingExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which provide a behaviour when an icon in the {@link sap.ui.vtm.InternalColumnDescriptor.Visibility} column is clicked.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IVisibilityIconClickExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */

        /**
         * Interface for extensions which provide a behaviour when the icon in the column header for the {@link sap.ui.vtm.InternalColumnDescriptor.Visibility} column is clicked.
         * @since 1.50
         * @name sap.ui.vtm.interfaces.IVisibilityHeaderIconClickExtension
         * @interface
         * @public
         * @author SAP SE
         * @version 1.52.0
         * @experimental Since 1.50.0 This library is experimental and might be modified or removed in future versions.
         * @ui5-metamodel This interface also will be described in the UI5 (legacy) designtime metamodel
         */
        
        return sap.ui.vtm;
    });
