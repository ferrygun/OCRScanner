/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
        'jquery.sap.global'
    ],
    function(
        jQuery) {
        "use strict";

        /**
         * A set of utility functions for creating the built-in tree column templates.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @private
         * @namespace
         * @name sap.ui.vtm.ColumnTemplates
         * @author SAP SE
         * @version 1.52.0
         */
        var ColumnTemplates = {};

        /**
         * Creates a textual column with a set of formatters for cell values and tooltip values.
         * @private
         * @function
         * @param {string} labelPath The binding path to use for the cell text.
         * @param {function} labelFormatter The formatter to use for the cell text.
         * @param {string} tooltipPath The binding path to use for the tooltip text (if unspecified, <code>labelPath</code> is used).
         * @param {function} tooltipFormatter The formatter to use for the tooltip text (if unspecified, <code>labelFormatter</code> is used).
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createBasicColumnTemplate = function(labelPath, labelFormatter, tooltipPath, tooltipFormatter) {
            if (!tooltipPath) { tooltipPath = labelPath; }
            if (!tooltipFormatter) { tooltipFormatter = labelFormatter; }
            var template = new sap.m.Text({wrapping: false});
            template.bindProperty("text", {path: labelPath, formatter: labelFormatter});
            template.bindProperty("tooltip", {path: tooltipPath, formatter: tooltipFormatter});
            return template;
        };

        /**
         * Creates a column template for the {@link sap.ui.vtm.InternalColumnDescriptors.Tree} internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createTreeColumnTemplate = function () {
            var icon = new sap.ui.core.Icon({
                decorative: false,
                src: "{iconUrl}",
                color: "{iconColor}",
                tooltip: "{iconTooltip}"
            });
            icon.addStyleClass("sapUiVtmTree_TreeColumn_Icon");
            icon.bindProperty("visible", {
                path: "iconUrl",
                formatter: function(iconUrl) { return iconUrl ? true : false; }
            });
            var nameTextView = new sap.ui.vtm.Text({
                wrapping: false,
                text: "{name}",
                tooltip: "{name}",
                textColor: "{textColor}"
            });
            nameTextView.addStyleClass("sapUiVtmTree_TreeColumn_NameText");
            var nameColumnTemplate = new sap.m.HBox({
                items: [icon, nameTextView],
                alignContent: sap.m.FlexAlignContent.Center,
                alignItems: sap.m.FlexAlignItems.Center
            });
            return nameColumnTemplate;
        };

        /**
         * Creates a column template for the {@link sap.ui.vtm.InternalColumnDescriptors.MessageStatus} internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createMessageStatusColumnTemplate = function () {
            var messageStatusIcon = new sap.ui.core.Icon({
                decorative: false,
                useIconTooltip: false,
                src: "{messageStatusIconUrl}",
                color: "{messageStatusIconColor}",
                tooltip: "{messageStatusIconTooltip}"
            });
            return messageStatusIcon;
        };

        /**
         * Creates a column template for the {@link sap.ui.vtm.InternalColumnDescriptors.Visibility} internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createVisibilityColumnTemplate = function () {
            var rb = sap.ui.vtm.getResourceBundle();
            var clickToShowString = rb.getText("COLUMNCELLTOOLTIP_VISIBILITY_CLICK_TO_SHOW");
            var clickToHideString = rb.getText("COLUMNCELLTOOLTIP_VISIBILITY_CLICK_TO_HIDE");

            var checkEye = new sap.ui.vk.CheckEye();
            checkEye.bindProperty("tooltip", {
                path: "",
                formatter: function(treeItem) {
                    if (!treeItem || treeItem.visibility == null) { return null; }
                    return treeItem.visibility ? clickToHideString : clickToShowString;
                }
            });
            checkEye.bindProperty("checked", {
                path: "visibility",
                mode: sap.ui.model.BindingMode.OneWay
            });
            checkEye.bindProperty("visible", {
                path: "",
                formatter: function(treeItem) {
                    if (!treeItem) { return false; }
                    return treeItem.visibility === true || treeItem.visibility === false;
                }
            });
            return checkEye;
        };

        /**
         * Creates a column template for the {@link sap.ui.vtm.InternalColumnDescriptors.TreeItemId} internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createTreeItemIdColumnTemplate = function () {
            return ColumnTemplates.createBasicColumnTemplate("id");
        };

        ColumnTemplates._formatValue = function(value) {
            if (value == undefined || value === null) {
                return null;
            }
            switch (typeof value) {
            case "string":
                return value;
            case "number":
                return value.toLocaleString();
            case "boolean":
                if (!ColumnTemplates._true || !ColumnTemplates._false) {
                    var rb = sap.ui.vtm.getResourceBundle();
                    ColumnTemplates._trueString = rb.getText("BOOLEAN_TRUE");
                    ColumnTemplates._falseString = rb.getText("BOOLEAN_FALSE");
                }
                return value ? ColumnTemplates._trueString : ColumnTemplates._falseString;
            default:
                return JSON.stringify(value);
            }
        };

        /**
         * Creates a default formatter for a metadata column
         * @private
         * @param {string} descriptorString The descriptor that identifies the metadata column.
         * @param {string} valueSeparator The string used to separate metadata values when there are multiple metadata of the given type.
         * @returns {function} The default formatter for the metadata column.
         */
        ColumnTemplates.metadataFormatterFactory = function (descriptorString, valueSeparator) {
            return function (treeItem) {
                if (!treeItem || !treeItem.metadata) { return null; }
                var values = sap.ui.vtm.ArrayUtilities.wrap(treeItem.metadata[descriptorString]);
                var formattedValues = values.map(ColumnTemplates._formatValue);
                return formattedValues.join(valueSeparator);
            };
        };

        /**
         * Creates a column template for an metadata column.
         * @private
         * @function
         * @param {sap.ui.vtm.Column} column The column definition
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createMetadataColumnTemplate = function (column) {
            var labelFormatter = column.getValueFormatter() || ColumnTemplates.metadataFormatterFactory(column.getDescriptor(), ", ");
            var tooltipFormatter = column.getTooltipFormatter() || ColumnTemplates.metadataFormatterFactory(column.getDescriptor(), "\n");
            return ColumnTemplates.createBasicColumnTemplate("", labelFormatter, "", tooltipFormatter);
        };

        /**
         * Creates a default formatter for an identifier column
         * @private
         * @param {string} descriptorString The descriptor that identifies the identifier column.
         * @param {string} valueSeparator The string used to separate identifier values when there are multiple identifiers of the given type.
         * @returns {function} The default formatter for the identifier column.
         */
        ColumnTemplates.identifierFormatterFactory = function (descriptorString, valueSeparator) {
            return function (treeItem) {
                if (!treeItem || !treeItem.identifiers) { return null; }
                var value = treeItem.identifiers[descriptorString];
                return (value instanceof Array) ? value.join(valueSeparator) : value;
            };
        };

        /**
         * Creates a column template for an identifier column.
         * @private
         * @function
         * @param {sap.ui.vtm.Column} column The column definition
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createIdentifierColumnTemplate = function (column) {
            var labelFormatter = column.getValueFormatter() || ColumnTemplates.identifierFormatterFactory(column.getDescriptor(), ", ");
            var tooltipFormatter = column.getTooltipFormatter() || ColumnTemplates.identifierFormatterFactory(column.getDescriptor(), "\n");
            return ColumnTemplates.createBasicColumnTemplate("", labelFormatter, "", tooltipFormatter);
        };

        /**
         * Creates a default formatter for an application data column
         * @private
         * @param {string} descriptorString The descriptor that identifies the application data column.
         * @param {string} valueSeparator The string used to separate values when there are multiple values of the given type.
         * @returns {function} The default formatter for the application data column.
         */
        ColumnTemplates.appDataFormatterFactory = function (descriptorString, valueSeparator) {
            return function (treeItem) {
                if (!treeItem || !treeItem.appData) { return null; }
                var values = sap.ui.vtm.ArrayUtilities.wrap(treeItem.appData[descriptorString]);
                var formattedValues = values.map(ColumnTemplates._formatValue);
                return formattedValues.join(valueSeparator);
            };
        };

        /**
         * Creates a column template for an application data column.
         * @private
         * @function
         * @param {sap.ui.vtm.Column} column The column definition
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createAppDataColumnTemplate = function (column) {
            var labelFormatter = column.getValueFormatter() || ColumnTemplates.appDataFormatterFactory(column.getDescriptor(), ", ");
            var tooltipFormatter = column.getTooltipFormatter() || ColumnTemplates.appDataFormatterFactory(column.getDescriptor(), "\n");
            return ColumnTemplates.createBasicColumnTemplate("", labelFormatter, "", tooltipFormatter);
        };

        /**
         * Creates a formatter function for a matrix column.
         * @private
         * @function
         * @param {string} componentFormatString The format string to construct a string for a component.
         *                 {0} is the component name, {1} is the component value.
         * @param {string} componentSeparator The string to use to separate components of a matrix value.
         * @return {function} Returns a formatter for a matrix column.
         */
        ColumnTemplates.matrixFormatterFactory = function (componentFormatString, componentSeparator) {
            return function (matrix) {
                if (!matrix) { return null; }
                var componentNames = sap.ui.vtm.MatrixUtilities.getMatrixComponentNames();
                var parts = matrix.map(function(component, i) {
                    var componentString = component.toLocaleString();
                    return jQuery.sap.formatMessage(componentFormatString, [componentNames[i], componentString]);
                });
                return parts.join(componentSeparator);
            };
        };

        /**
         * Creates a column template for the "absoluteMatrix" internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createAbsoluteMatrixColumnTemplate = function () {
            return ColumnTemplates.createBasicColumnTemplate(
                "absoluteMatrix",
                ColumnTemplates.matrixFormatterFactory("{1}", " "),
                "absoluteMatrix",
                ColumnTemplates.matrixFormatterFactory("{0}:\t{1}", "\n"));
        };

        /**
         * Creates a column template for the "relativeMatrix" internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createRelativeMatrixColumnTemplate = function () {
            return ColumnTemplates.createBasicColumnTemplate(
                "relativeMatrix",
                ColumnTemplates.matrixFormatterFactory("{1}", " "),
                "relativeMatrix",
                ColumnTemplates.matrixFormatterFactory("{0}:\t{1}", "\n"));
        };

        /**
         * Creates a column template for the {@link sap.ui.vtm.InternalColumnDescriptors.SceneNodeIds} internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createSceneNodeIdsColumnTemplate = function() {
            var formatter = function(treeItem) {
                if (!treeItem) { return null; }
                return sap.ui.vtm.TreeItemUtilities.getSceneNodeIds(treeItem).join(", ");
            };
            return ColumnTemplates.createBasicColumnTemplate("", formatter);
        };

        /**
         * Creates a column template for the {@link sap.ui.vtm.InternalColumnDescriptors.Opacity} internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createOpacityColumnTemplate = function() {
            var formatter = function(treeItem) {
                if (!treeItem || treeItem.opacity === undefined || treeItem.opacity === null) { return null; }
                return "" + treeItem.opacity * 100 + "%";
            };
            return ColumnTemplates.createBasicColumnTemplate("", formatter);
        };

        /**
         * Creates a column template for the {@link sap.ui.vtm.InternalColumnDescriptors.HighlightColor} internal column.
         * @private
         * @function
         * @return {sup.ui.core.Control} The column template.
         */
        ColumnTemplates.createHighlightColorColumnTemplate = function() {
            var formatter = function(treeItem) {
                if (!treeItem || treeItem.highlightColor === undefined || treeItem.sceneHighlightColor === null) { return null; }
                return treeItem.highlightColor;
            };
            return ColumnTemplates.createBasicColumnTemplate("", formatter);
        };

        return ColumnTemplates;
    },
    true);
