/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
        'jquery.sap.global',
        "./ColumnType",
        "./InternalColumnDescriptor"
    ],
    function(
        jQuery,
        SapUiVtmColumnType,
        SapUiVtmInternalColumnDescriptor) {
        "use strict";

        var getDefaultSettings = function() {
            return {
                type: SapUiVtmColumnType.Internal
            };
        };

        /**
         * A set of utility functions for creating internal tree columns.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @namespace
         * @name sap.ui.vtm.InternalColumns
         * @author SAP SE
         * @version 1.52.0
         */
        var InternalColumns = {};

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.Tree} internal column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createTreeColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.Tree} internal column.
         */
        InternalColumns.createTreeColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.Tree,
                label: rb.getText("COLUMNNAME_TREE"),
                tooltip: rb.getText("COLUMNNAME_TREE"),
                width: "250px"
            });
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.Visibility} internal column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createVisibilityColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.Visibility} internal column.
         */
        InternalColumns.createVisibilityColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var hideAllString = rb.getText("COLUMNTOOLTIP_VISIBILITY_CLICK_TO_HIDE_ALL");
            var showAllString = rb.getText("COLUMNTOOLTIP_VISIBILITY_CLICK_TO_SHOW_ALL");

            var checkEye = new sap.ui.vk.CheckEye({
                checked: true,
                tooltip: hideAllString
            });
            checkEye.attachChange(function(event) {
                var control = event.getSource();
                control.setTooltip(control.getChecked() ? hideAllString : showAllString);
            });
            
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.Visibility,
                labelControl: checkEye,
                hAlign: sap.ui.core.HorizontalAlign.Center,
                width: "2.5em",
                resizable: false
            });
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.MessageStatus} internal column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createMessageStatusColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.MessageStatus} internal column.
         */
        InternalColumns.createMessageStatusColumn = function () {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.MessageStatus,
                labelControl: new sap.ui.core.Icon({
                    src: "sap-icon://message-warning",
                    tooltip: rb.getText("COLUMNTOOLTIP_MESSAGESTATUS"),
                    decorative: false
                }),
                hAlign: sap.ui.core.HorizontalAlign.Center,
                width: "2.5em",
                resizable: false
            });
            settings.labelControl.addStyleClass("sapUiVtmTree_StatusColumn_HeaderIcon");
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.TreeItemId} column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createTreeItemIdColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.TreeItemId} column.
         */
        InternalColumns.createTreeItemIdColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.TreeItemId,
                label: rb.getText("COLUMNNAME_TREEITEMID"),
                tooltip: rb.getText("COLUMNNAME_TREEITEMID")
            });
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.AbsoluteMatrix} column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createAbsoluteMatrixColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.AbsoluteMatrix} column.
         */
        InternalColumns.createAbsoluteMatrixColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.AbsoluteMatrix,
                label: rb.getText("COLUMNNAME_ABSOLUTEMATRIX"),
                tooltip: rb.getText("COLUMNNAME_ABSOLUTEMATRIX")
            });
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.RelativeMatrix} column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createRelativeMatrixColumn
         * @returns {sap.ui.vtm.Column} The  {@link sap.ui.vtm.InternalColumnDescriptor.RelativeMatrix} column.
         */
        InternalColumns.createRelativeMatrixColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.RelativeMatrix,
                label: rb.getText("COLUMNNAME_RELATIVEMATRIX"),
                tooltip: rb.getText("COLUMNNAME_RELATIVEMATRIX")
            });
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.SceneNodeIds} column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createSceneNodeIdsColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.SceneNodeIds} column.
         */
        InternalColumns.createSceneNodeIdsColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.SceneNodeIds,
                label: rb.getText("COLUMNNAME_SCENENODEIDS"),
                tooltip: rb.getText("COLUMNNAME_SCENENODEIDS")
            });
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates an {@link sap.ui.vtm.InternalColumnDescriptor.Opacity} column.
         * @public
         * @function
         * @name sap.ui.vtm.InternalColumns.createOpacityColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.Opacity} column.
         */
        InternalColumns.createOpacityColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.Opacity,
                label: rb.getText("COLUMNNAME_OPACITY"),
                tooltip: rb.getText("COLUMNNAME_OPACITY")
            });
            return new sap.ui.vtm.Column(settings);
        };

        /**
         * Creates a {@link sap.ui.vtm.InternalColumnDescriptor.HighlightColor} column.
         * @private
         * @function
         * @name sap.ui.vtm.InternalColumns.createHighlightColorColumn
         * @returns {sap.ui.vtm.Column} The {@link sap.ui.vtm.InternalColumnDescriptor.HighlightColor} column.
         */
        InternalColumns.createHighlightColorColumn = function() {
            var rb = sap.ui.vtm.getResourceBundle();
            var settings = jQuery.extend(getDefaultSettings(), {
                descriptor: SapUiVtmInternalColumnDescriptor.HighlightColor,
                label: rb.getText("COLUMNNAME_HIGHLIGHTCOLOR"),
                tooltip: rb.getText("COLUMNNAME_HIGHLIGHTCOLOR")
            });
            return new sap.ui.vtm.Column(settings);
        };

        return InternalColumns;
    },
    true);
