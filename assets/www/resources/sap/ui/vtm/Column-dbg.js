/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element", "sap/ui/commons/Label"],
    function (jQuery, SapUiCoreElement, SapUiCommonsLabel) {

        "use strict";

        /**
         * Constructor for a new Column.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.Column
         * @public
         * @class
         * Represents a data column for a {@link sap.ui.vtm.Tree}.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId An optional ID for the {@link sap.ui.vtm.Column}.
         * @param {object?} mSettings An optional object with initial settings for the new {@link sap.ui.vtm.Column} instance.
         * @extends sap.ui.core.Element
         */
        var Column = SapUiCoreElement.extend("sap.ui.vtm.Column", /** @lends sap.ui.vtm.Column.prototype */ {

            metadata: {
                properties:{
                    /**
                     * The type of column.
                     */
                    type: { type: "sap.ui.vtm.ColumnType" },

                    /**
                     * The descriptor is a JSON string identifying the column.
                     *
                     * When the type property has a value of {@link sap.ui.vtm.ColumnType.Metadata} the descriptor property has the following form:
                     * <code>'{"category":"SAP","field":"MATERIAL"}'</code><br>
                     * Such descriptors can be constructed using {@link sap.ui.vtm.DescriptorUtilities.createMetadataDescriptor}.
                     *
                     * When the type property has a value of {@link sap.ui.vtm.ColumnType.Identifier} the descriptor property has the following form:
                     * <code>'{"source":"SAP","type":"VE_COMPONENT"}'</code><br>
                     * Such descriptors can be constructed using {@link sap.ui.vtm.DescriptorUtilities.createIdentifierDescriptor}.
                     *
                     * When the type property has a value of {@link sap.ui.vtm.ColumnType.AppData} the descriptor property has the following form:
                     * <code>'bomId'</code>
                     */
                    descriptor: { type: "string" },

                    /**
                     * A localized string to show in the column header tooltip.
                     * If unspecified, the label value will be used as the column header tooltip.
                     */
                    tooltip: { type: "string", defaultValue : null },

                    /**
                     * The horizontal alignment for the tree column.
                     */
                    hAlign: {type: "sap.ui.core.HorizontalAlign", defaultValue: "Left"},

                    /**
                     * The width of the tree column.
                     */
                    width: {type: "sap.ui.core.CSSSize", defaultValue: "200px"},

                    /**
                     * If set to true, the column can be resized.
                     */
                    resizable: {type: "boolean", defaultValue: true},

                    /**
                     * A textual name for the column.
                     * This is also used in the {@link sap.ui.vtm.ColumnSelectionDialog}, so it should be included whether or not the <code>labelControl</code> property is used.
                     */
                    label: {type: "string" },

                    /**
                     * A {@link sap.ui.core.Control} that is used in the column header.
                     * When specified, this is used in preference to the <code>label</code> property as the column header content.
                     * However the <code>label</code> property should also be specified since it is used in the used in the {@link sap.ui.vtm.ColumnSelectionDialog}.
                     */
                    labelControl : {type : "object"},

                    /**
                     * If defined, this is a function that specifies the formatting of cell content text for this column.<br/>
                     * The function must return a string containing the text to display in the cell (or null) for a given tree item.<br/>
                     * The first parameter to the function (which may not always be defined) is the tree item for the tree table row.
                     */
                    valueFormatter: {type: "any"},

                    /**
                     * If defined, this is a function that specifies the formatting of cell content tooltips for this column (overriding the default behaviour).<br/>
                     * Not used if a custom template is specified.<br/>
                     * The function must return a string containing the text to display in the tooltip (or null) for a given tree item.<br/>
                     * The first parameter to the function (which may not always be defined) is the tree item for the tree table row.
                     */
                    tooltipFormatter: {type: "any"},
                    
                    /**
                     * If defined, overrides the cell template for the column.<br/>
                     * If this is defined, the <code>valueFormatter</code> and <code>tooltipFormatter</code> properties are ignored.
                     */
                    template: {type: "sap.ui.core.Control"}
                }
            },

            constructor: function(sId, mSettings) {
                if (jQuery.type(sId) == "object") {
                    mSettings = sId;
                    sId = mSettings.id;
                }
                SapUiCoreElement.apply(this, [sId, {}]);

                if (mSettings){
                   if (mSettings.type) {
                       this.setType(mSettings.type);
                   }
                   if (mSettings.descriptor) {
                       this.setDescriptor(mSettings.descriptor);
                   }
                   if (mSettings.label) {
                       this.setLabel(mSettings.label);
                   }
                   if (mSettings.labelControl) {
                       this.setLabelControl(mSettings.labelControl);
                   }
                   if (mSettings.tooltip) {
                       this.setTooltip(mSettings.tooltip);
                   }
                   if (mSettings.hAlign) {
                       this.setHAlign(mSettings.hAlign);
                   }
                   if (mSettings.width) {
                       this.setWidth(mSettings.width);
                   }
                   if (mSettings.resizable === true || mSettings.resizable === false) {
                       this.setResizable(mSettings.resizable);
                   }
                   if (mSettings.valueFormatter) {
                       this.setValueFormatter(mSettings.valueFormatter);
                   }
                   if (mSettings.tooltipFormatter) {
                       this.setTooltipFormatter(mSettings.tooltipFormatter);
                   }
                   if (mSettings.template) {
                       this.setTemplate(mSettings.template);
                   }
                }
            }
        });

        return Column;
    });