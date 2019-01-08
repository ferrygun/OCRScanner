/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
        "jquery.sap.global",
        "./library",
        "./ColumnType",
        "sap/ui/core/Control",
        "sap/m/TableSelectDialog",
        "./Progress",
        "./InternalColumns"
    ],
    function(
        jQuery,
        SapUiVtmLibrary,
        SapUiVtmColumnType,
        SapUiCoreControl,
        SapMTableSelectDialog,
        SapUiVtmProgress,
        SapUiVtmInternalColumns) {

        "use strict";

        /**
         * Constructor for a new SelectColumnsDialog.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @class
         * A dialog used to select the columns to display in a {@link sap.ui.vtm.Tree}.
         * @author SAP SE
         * @version 1.52.0
         * @name sap.ui.vtm.SelectColumnsDialog
         * @extends sap.ui.core.Control
         */
        var SelectColumnsDialog = SapUiCoreControl.extend("sap.ui.vtm.SelectColumnsDialog",  /** @lends sap.ui.vtm.SelectColumnsDialog.prototype */ {
            metadata: {
                properties: {
                    /**
                     * The {@link sap.ui.vtm.Tree} that column selection is being performed for.
                     */
                    tree: {
                        type: "object"
                    },

                    /**
                     * The set of columns that should be shown in the dialog that may be selected for display.
                     */
                    selectableColumns: {
                        type: "sap.ui.vtm.Column[]"
                    }
                }
            },

            init: function () {
                this._oDialog = this._createDialog();
            },

            renderer: function (oRM, oControl) {},

            _createDialog: function() {
                var rb = sap.ui.vtm.getResourceBundle();

                var selectColumnsDialog = new sap.m.TableSelectDialog(this.getId() + '-Dialog', {
                    multiSelect: true,
                    columns: [
                        new sap.m.Column({ visible: false }),
                        new sap.m.Column({ visible: false }),
                        new sap.m.Column({ header: new sap.m.Label({ text: rb.getText("COLUMNNAME_NAME") }) })
                    ],
                    noDataText: rb.getText("SELECTCOLUMNSDIALOG_NOCOLUMNSAVAILABLE")
                });

                var itemTemplate = new sap.m.ColumnListItem({
                    type: "Active",
                    unread: false,
                    cells: [
                        new sap.m.Label({ text: "{mProperties/type}" }),
                        new sap.m.Label({ text: "{mProperties/descriptor}" }),
                        new sap.m.Label({ text: "{mProperties/label}" })
                    ]
                });

                selectColumnsDialog.bindItems({
                    path: "/items",
                    template: itemTemplate
                });

                return selectColumnsDialog;
            },

            /**
             * Opens the dialog.
             * The dialog applies the updated set of columns to the tree if confirmed.
             * @public
             * @method
             * @returns {sap.ui.vtm.SelectColumnsDialog} <code>this</code> for method chaining.
             */
            open: function() {
                var tree = this.getTree();
                if (!tree) {
                    throw "The tree property has not been set";
                }

                var selectableColumns = this.getSelectableColumns();
                if (!selectableColumns) {
                    throw "The selectableColumns property has not been set";
                }
                selectableColumns = selectableColumns.slice();

                var selectColumnsDialog = this._oDialog;
                var rb = sap.ui.vtm.getResourceBundle();

                var debugMode = jQuery.sap.debug();
                if (debugMode) {
                    var existingInternalColumnIds = selectableColumns
                        .filter(function(column) { return column.type === sap.ui.vtm.ColumnType.Internal; })
                        .map(function(column) { return column.id; });

                    var internalDataColumns = [
                        sap.ui.vtm.InternalColumns.createTreeItemIdColumn(),
                        sap.ui.vtm.InternalColumns.createAbsoluteMatrixColumn(),
                        sap.ui.vtm.InternalColumns.createRelativeMatrixColumn(),
                        sap.ui.vtm.InternalColumns.createSceneNodeIdsColumn(),
                        sap.ui.vtm.InternalColumns.createOpacityColumn(),
                        sap.ui.vtm.InternalColumns.createHighlightColorColumn()
                    ];

                    internalDataColumns.forEach(function(column) {
                        if (existingInternalColumnIds.indexOf(column.id) == -1) {
                            selectableColumns.push(column);
                        }
                    });
                }

                var columnNameSortFunc = function(columnA, columnB) {
                    return columnA.getLabel().localeCompare(columnB.getLabel());
                };
                selectableColumns.sort(columnNameSortFunc);

                var createDescriptor = function(columnType, columnDescriptor) {
                    return JSON.stringify({
                        type: columnType,
                        descriptor: columnDescriptor
                    });
                };

                var selectableColumnsByDescriptor = new Map();
                selectableColumns.forEach(function(column){
                    var descriptor = createDescriptor(column.getType(), column.getDescriptor());
                    selectableColumnsByDescriptor.set(descriptor, column);
                });

                var handleSearch = function (event) {
                    var searchString = event.getParameter("value");
                    var itemsBinding = event.getParameter("itemsBinding");
                    if (searchString !== undefined && searchString.length > 0) {
                        var filters = [
                            new sap.ui.model.Filter("mProperties/label", sap.ui.model.FilterOperator.Contains, searchString)
                        ];
                        itemsBinding.filter(new sap.ui.model.Filter(filters, false), "Application");
                    } else {
                        itemsBinding.filter([]);
                    }
                };

                var handleModelContextChange = function (event) {
                    var existingDescriptors = tree.getDataColumns().map(function(column) {
                        return createDescriptor(column.getType(), column.getDescriptor());
                    });
                    var items = selectColumnsDialog.getItems();
                    items.forEach(function(item) {
                        var cells = item.getCells();
                        var descriptorString = createDescriptor(cells[0].getText(), cells[1].getText());
                        var selected = existingDescriptors.indexOf(descriptorString) != -1;
                        item.setSelected(selected);
                    });
                };

                var handleConfirm, handleCancel;

                var attachEvents = function(tree) {
                    selectColumnsDialog.attachConfirm(tree, handleConfirm);
                    selectColumnsDialog.attachCancel(tree, handleCancel);
                    selectColumnsDialog.attachSearch(tree, handleSearch);
                    selectColumnsDialog.attachModelContextChange(tree, handleModelContextChange);
                };

                var detachEvents = function () {
                    selectColumnsDialog.detachConfirm(handleConfirm);
                    selectColumnsDialog.detachCancel(handleCancel);
                    selectColumnsDialog.detachSearch(handleSearch);
                    selectColumnsDialog.detachModelContextChange(handleModelContextChange);
                };

                handleConfirm = function (event) {
                    detachEvents();

                    var selectedItems = event.getParameter("selectedItems");
                    var existingDescriptors = tree.getDataColumns().map(function(column) {
                        return createDescriptor(column.getType(), column.getDescriptor());
                    });
                    var selectedDescriptors = selectedItems.map(function(selectedItem) {
                        var cells = selectedItem.getCells();
                        return createDescriptor(cells[0].getText(), cells[1].getText());
                    });
                    var addedDescriptors = selectedDescriptors.filter(function(selectedDescriptor) {
                        return existingDescriptors.indexOf(selectedDescriptor) === -1;
                    });
                    var remainingDescriptors = existingDescriptors.filter(function(existingDescriptor) {
                        return selectedDescriptors.indexOf(existingDescriptor) !== -1;
                    });
                    var remainingColumns = remainingDescriptors.map(function(descriptor) {
                        return selectableColumnsByDescriptor.get(descriptor);
                    });
                    var addedColumns = addedDescriptors.map(function(descriptor) {
                        return selectableColumnsByDescriptor.get(descriptor);
                    });
                    addedColumns.sort(columnNameSortFunc);
                    var columns = remainingColumns.concat(addedColumns);
                    tree.setDataColumns(columns);
                 };

                 handleCancel  = function (event) {
                     detachEvents();
                 };

                 var treeTitle = tree.getPanel().getTitle();
                 var title = rb.getText("SELECTCOLUMNSDIALOG_SELECT_0_COLUMNS", [treeTitle]);

                 selectColumnsDialog.setTitle(title);

                 attachEvents(tree);

                 var columnModel = new sap.ui.model.json.JSONModel();
                 columnModel.setData({ items: selectableColumns });

                 selectColumnsDialog.setModel(columnModel);
                 selectColumnsDialog.open();
                 return this;
            }
        });

        return SelectColumnsDialog;
    });
