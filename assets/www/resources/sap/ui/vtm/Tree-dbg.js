/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
        "jquery.sap.global",
        "sap/ui/core/Control",
        "sap/ui/table/TreeTable",
        "./SelectionMode",
        "./InternalColumnDescriptor",
        "./ArrayUtilities",
        "./MatrixUtilities",
        "./TreeItemUtilities",
        "./Column",
        "./Lookup",
        "./library",
        "./Text",
        "./ColumnType",
        "./InternalColumns",
        "sap/ui/model/json/JSONModel",
        "sap/ui/commons/TextView",
        "sap/ui/core/IconPool",
        "sap/ui/core/Icon",
        "sap/ui/layout/HorizontalLayout",
        "sap/ui/vk/CheckEye"
    ],
    function (
        jQuery,
        SapUiCoreControl,
        SapUiTableTreeTable,
        SapUiVtmSelectionMode,
        SapUiVtmInternalColumnDescriptor,
        SapUiVtmArrayUtilities,
        SapUiVtmMatrixUtilities,
        SapUiVtmTreeItemUtilities,
        SapUiVtmColumn,
        SapUiVtmLookup,
        SapUiVtmLibrary,
        SapUiVtmText,
        SapUiVtmColumnType,
        SapUiVtmInternalColumns,
        SapUiModelJsonJSONModel,
        SapUiCommonsTextView,
        SapUiCoreIconPool,
        SapUiCoreIcon,
        SapUiLayoutHorizontalLayout,
        SapUiVkCheckEye
        ) {

        "use strict";

        /**
         * This class is not intended to be instantiated directly by application code.
         * A {@link sap.ui.vtm.Tree} object is created when a {@link sap.ui.vtm.Panel} object is instantiated.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @class
         * A control that contains a tree and associated data columns and provides helper methods for tree manipulation.
         * <br/>
         * Call {@link #setRootItems} to provide a tree model.<br/>
         * Call {@link #updateCollections} after making changes to the tree hierarchy.<br/>
         * Call {@link #updateModel} after making changes to the tree model (either changes to the the tree hierarchy or changes to properties of tree items).<br/>
         *
         * Items in the tree are plain JavaScript objects that have the following set of properties:
         * <ul>
         * <li><code>id</code> - The unique id for the tree item. This is the only required field in the tree item object.</li>
         * <li><code>name</code> - The tree item name.</li>
         * <li><code>iconUrl</code> - The URL string for the icon to show in the "tree" column.</li>
         * <li><code>iconColor</code> - The color for the icon to show in the "tree" column.</li>
         * <li><code>iconTooltip</code> - A tooltip for the icon to show in the "tree" column.</li>
         * <li><code>absoluteMatrix</code> - An array of 13 numbers in ISO 10303-42 format representing an absolute transformation matrix.</li>
         * <li><code>relativeMatrix</code> - An array of 13 numbers in ISO 10303-42 format representing a relative transformation matrix.</li>
         * <li><code>includedChildren</code> - An array of tree items containing the children of this tree item that can be displayed in the tree.</li>
         * <li><code>excludedChildren</code> - An array of tree items containing the children of this tree item that are not displayed in the tree.</li>
         * <li><code>metadata</code> -  A plain JavaScript object map containing metadata values for the tree item.<br/>
         * Keys are JSON strings that can be parsed using JSON.parse() to get an object with category and field string properties.<br/>
         * Values can be of the following types: <code>string, <code>string[]</code>, <code>number</code>, <code>number[]</code>, <code>boolean</code>, <code>boolean[]</code>, <code>object</code>, <code>object[]</code>.</li>
         * <li><code>identifiers</code> -  A plain JavaScript object map containing VE9 identifier values for the tree item.<br/>
         * Keys are JSON strings that can be parsed using JSON.parse() to get an object with source and type string properties.<br/>
         * Values can be of the following types: string, string[].<br/>
         * Each value string is a JSON string that can be parsed using JSON.parse to get an array of name/value pairs.<br/>
         * The value in each name/value pair is optional.</li>
         * <li><code>appData</code> - A plain JavaScript object map containing application data values for the tree item.<br/>
         * Keys are application defined strings.<br/>
         * Values can be of the following types: <code>string, <code>string[]</code>, <code>number</code>, <code>number[]</code>, <code>boolean</code>, <code>boolean[]</code>, <code>object</code>, <code>object[]</code>.</li>
         * <li><code>textColor</code> - A {@link sap.ui.vtm.TextColor} value that specifies the color of the text for the tree item in the Name data column (defaults to {@link sap.ui.vtm.TextColor.Default}).</li>
         * <li><code>sceneNodeIds</code> - A string or array of strings containing the IDs of scene nodes to associate with this tree item.</li>
         * <li><code>visibility</code> - Used to determine visibility of associated scene nodes and control a visibility icon shown in the {@link sap.ui.vtm.InternalColumnDescriptor.Visibility} column.<br/>
         * When <code>true</code> associated scene nodes should be visible in the viewport (when their visibility is not overridden).<br/>
         * When <code>false</code> associated scene nodes should not be visible in the viewport  (when their visibility is not overridden).<br/>
         * When <code>null</code> or <code>undefined</code> no visibility icon is shown for the tree item and associated scene nodes should not be visible in the viewport (when their visibility is not overridden).</li>
         * <li><code>opacity</code> - A numeric value between 0 and 1 (inclusive) that specifies the opacity to apply to associated scene nodes (when their opacity is not overridden).</li>
         * <li><code>highlightColor</code> - A sap.ui.core.CSSColor that specifies a highlight color to apply to associated scene nodes (when their highlight color is not overridden). The alpha component specifies the blend ratio between the highlight color and the scene node color.</li>
         * <li><code>messages</code> A string that can be parsed using JSON.parse() to produce an array of objects that can be used to construct {@link sap.ui.core.Message} objects.<br/>
         * Refer to the documentation for the <code>mSettings</code> parameter of the {@link sap.ui.core.Message} constructor for valid values.</li>
         * <li><code>messageStatusIconUrl</code> The URL of the icon to display in the message status column. If an extension implementing {@link sap.ui.vtm.interfaces.IMessageStatusCalculationExtension} is being used, only that extension should set values for this field.</li>
         * <li><code>messageStatusIconColor</code> The {@link sap.ui.core.CSSColor} color of the icon to display in the message status column.  If an extension implementing {@link sap.ui.vtm.interfaces.IMessageStatusCalculationExtension} is being used, only that extension should set values for this field.</li>
         * <li><code>messageStatusIconTooltip</code> The tooltip for the icon in the message status column.  If an extension implementing {@link sap.ui.vtm.interfaces.IMessageStatusCalculationExtension} is being used, only that extension should set values for this field.</li>
         * </ul>
         * 
         * The <code>sceneNodeIds</code>, <code>visibility</code>, <code>opacity</code> and <code>highlightColor</code> properties are used by the extension implementing {@link sap.ui.vtm.interfaces.IDisplayStateCalculationExtension} to determine the display state of scene nodes shown in the {@link sap.ui.vtm.Viewport} associated with the {@link sap.ui.vtm.Tree}.
         *  
         * Example:
         * <pre><code>{
         *      id: jQuery.sap.uid(),
         *      name: "Tree item name",
         *      iconUrl: "sap-icon://tree",
         *      iconTooltip: "Group"
         *      absoluteMatrix: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
         *      relativeMatrix: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
         *      includedChildren: [],
         *      metadata:{
         *         '{"category":"SAP","field":"MATERIAL"}': ["mat1", "mat2"]]
         *      },
         *      identifiers: {
         *          '{"source":"SAP","type":"VE_COMPONENT"}': '[{"name":"ID", "value":"_moto_x_asm"},{"name":"version", "value": "00"},{"name": "timestamp", "value":"2016-05-18 03:44:53.93"}]',
         *          '{"source":"SAP","type":"MATERIAL"}': ['[{"name":"ID", "value":"mat1"}]', '[{"name":"ID", "value":"mat2"}]']
         *      },
         *      appData:{
         *          "bomId: "bom1",
         *          "bomItemId: "bomItem1",
         *      },
         *      textColor: sap.ui.vtm.TextColor.Gray,
         *      sceneNodeIds: ["iffffffff01021520", "iffffffff01021528"],
         *      visibility: true,
         *      opacity: 0.3,
         *      highlightColor: "rgba(0,255,0,0.8)"
         *      messages: '[{"level":"Error","text":"some error"},{"level":"Error","text":"Another error"},{"level":"Warning","A warning"}]',
         *      messageStatusIconUrl: "sap-icon://error",
         *      messageStatusIconColor: "red",
         *      messageStatusIconTooltip: "Error"
         *  }</code></pre>
         *  
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string?} sId id for the new {@link sap.ui.vtm.Tree}.
         * @param {object?} mSettings Object with initial property values, aggregated objects etc. for the new {@link sap.ui.vtm.Tree}.
         * @name sap.ui.vtm.Tree
         * @extends sap.ui.core.Control
         */
        var Tree = SapUiCoreControl.extend("sap.ui.vtm.Tree", /** @lends sap.ui.vtm.Tree.prototype */ {
            metadata: {
                properties: {
                    /**
                     * The tree selection mode.
                     */
                    selectionMode: {type: "sap.ui.vtm.SelectionMode", defaultValue : "Single" }
                },
                aggregations: {
                    _treeTable: {
                        type: "sap.ui.table.TreeTable",
                        multiple: false,
                        visibility: "hidden"
                    },
                    /**
                     * A set of controls such as toolbars to show above the tree.
                     */
                    headerControls: {
                        type: "sap.ui.core.Control",
                        multiple: true
                    }
                },
                events: {
                    /**
                     * Raised when a tree item drag is initiated.
                     * To prevent a drag from being initiated call preventDefault() on the event.
                     */
                    dragStart: {
                        parameters: {
                            /**
                             * The tree item that was dragged.
                             */
                            dragItem: { type: "object" },
                            /**
                             * The tree of the tree item that was dragged.
                             */
                            dragTree: { type: "sap.ui.vtm.Tree" }
                        },
                        allowPreventDefault: true
                    },
                    /**
                     * Raised when a tree item is dragged over a tree item or an unpopulated row in a tree.
                     * To allow a drop to occur call preventDefault() on the event.
                     */
                    dragOver: {
                        parameters: {
                            /**
                             * The tree item that was dragged.
                             */
                            dragItem: { type: "object" },
                            /**
                             * The tree of the tree item that was dragged.
                             */
                            dragTree: { type: "sap.ui.vtm.Tree" },
                            /**
                             * The tree item being dragged over or null if the tree item is being dragged over an unpopulated row.
                             */
                            dragOverItem: { type: "object" },
                            /**
                             * The tree being dragged over.
                             */
                            dragOverTree: { type: "sap.ui.vtm.Tree" }
                        },
                        allowPreventDefault: true
                    },
                    /**
                     * Raised when a tree item is dropped on a tree item or an unpopulated row in a tree.
                     * A drop cannot occur unless preventDefault() is called on the sap.ui.base.Event object in the preceding dragOver event.
                     */
                    drop: {
                        parameters: {
                            /**
                             * The tree item that was dragged.
                             */
                            dragItem: { type: "object" },
                            /**
                             * The tree of the tree item that was dragged.
                             */
                            dragTree: { type: "sap.ui.vtm.Tree" },
                            /**
                             * The tree item that the drop occurred on or null if the item was not dropped on a tree item.
                             */
                            dropItem: { type: "object" },
                            /**
                             * The tree that the drop occurred on.
                             */
                            dropTree: { type: "sap.ui.vtm.Tree" }
                        }
                    },
                    /**
                     * Raised when the set of selected tree items for a tree changes.
                     */
                    selectionChanged: {
                        parameters: {
                            /**
                             * The tree items that were added to the selection set for the tree.
                             */
                            addedItems: { type: "object[]" },
                            /**
                             * The tree items that were removed from the selection set for the tree.
                             */
                            removedItems: { type: "object[]" },
                            /**
                             * Indicates that the event was fired due to an explicit user interaction
                             */
                            userInteraction: {type: "boolean" }
                        }
                    },
                    /**
                     * Raised when the icon in the visibility column header is clicked.
                     */
                    visibilityHeaderIconClicked: {
                        parameters: {
                            /**
                             * The new visibility state of the tree item.
                             */
                            visibility: {type:  "boolean" },
                            /**
                             * The visibility header icon control that was clicked.
                             */
                            control: {type: "sap.ui.core.Control"}
                        }
                    },
                    /**
                     * Raised when an icon in the visibility column is clicked.
                     */
                    visibilityIconClicked: {
                        parameters: {
                            /**
                             * The tree item whose visibility icon was clicked.
                             */
                            item: {type: "object"},
                            /**
                             * The new visibility state of the tree item.
                             */
                            visibility: {type:  "boolean" },
                            /**
                             * The visibility icon control that was clicked.
                             */
                            control: {type: "sap.ui.core.Control"}
                        }
                    },
                    /**
                     * Raised when a tree item entry is expanded or collapsed.
                     */
                    expandedChanged: {
                        parameters: {
                            /**
                             * The tree item associated with the row that was expanded or collapsed.
                             */
                            item: {type: "object"},
                            /**
                             * If <code>true</code>, the row was expanded, otherwise it was collapsed.
                             */
                            expanded: {type: "boolean"},
                            /**
                             * Indicates that the event was fired due to the user clicking an expander.
                             */
                            userInteraction: {type: "boolean"}
                        }
                    },
                    /**
                     * Raised before the model is updated.
                     */
                    beforeModelUpdated: {},
                    /**
                     * Raised after the model has been updated.
                     */
                    modelUpdated: {},
                    /**
                     * Raised when a tree item message status icon is clicked.
                     */
                    messageStatusIconClicked: {
                        parameters: {
                            /**
                             * The associated tree item.
                             */
                            items: {type: "object"},
                            
                            /**
                             * The message status icon control that was clicked.
                             */
                            control: {type: "sap.ui.core.Control"}
                        }
                    },
                    /**
                     * Raised when a tree item message status icon is clicked.
                     */
                    messageStatusHeaderIconClicked: {
                        /**
                         * The message status header icon control that was clicked.
                         */
                        control: {type: "sap.ui.core.Control"}
                    },
                    /**
                     * Raised when the tree hierarchy (the set of parent child relationships) changes.
                     */
                    hierarchyChanged: {}
                }
            },

            constructor: function (sId, mSettings) {
                SapUiCoreControl.apply(this, arguments);
                this._rb = sap.ui.vtm.getResourceBundle();
                this._treeCollections = new sap.ui.vtm.TreeCollections();

                var treeTable = new sap.ui.table.TreeTable({
                    enableColumnReordering: true,
                    selectionMode: sap.ui.table.SelectionMode.Single,
                    showNoData: false,
                    visibleRowCountMode: sap.ui.table.VisibleRowCountMode.Auto,
                    minAutoRowCount: 4,
                    selectionBehavior: sap.ui.table.SelectionBehavior.RowOnly
                });

                this.setAggregation("_treeTable", treeTable);
                treeTable.allowTextSelection(false);

                var treeColumn = sap.ui.vtm.InternalColumns.createTreeColumn();
                var visibilityColumn = sap.ui.vtm.InternalColumns.createVisibilityColumn();
                var messageStatusColumn = sap.ui.vtm.InternalColumns.createMessageStatusColumn();

                var visibilityHeaderIcon = visibilityColumn.getLabelControl();
                visibilityHeaderIcon.attachChange(function(event) {
                    var visibility = event.getSource().getChecked();
                    this.fireVisibilityHeaderIconClicked({
                        visibility: visibility,
                        control: visibilityHeaderIcon
                    });
                }.bind(this));

                var messageStatusHeaderIcon = messageStatusColumn.getLabelControl();
                messageStatusHeaderIcon.attachPress(function(event) {
                    this.fireMessageStatusHeaderIconClicked({
                        control: messageStatusHeaderIcon
                    });
                }.bind(this));
                
                messageStatusHeaderIcon.addEventDelegate({
                    onfocusin: function(event) {
                        messageStatusHeaderIcon.getDomRef().blur();
                    }
                }, messageStatusHeaderIcon);

                this._fixedColumns = [
                    treeColumn,
                    visibilityColumn,
                    messageStatusColumn
                ];
                this._setColumns(this._fixedColumns);
                this.setRootItems([]);
                this.updateCollections(false);
                this._updateModel();

                treeTable.attachToggleOpenState(this._handleToggleOpenState.bind(this));

                var tapControl = function(control, event) {
                    if (control.getVisible && !control.getVisible() ||
                        control.getEnabled && !control.getEnabled()) {
                        return false;
                    }
                    if (control.ontap) {
                        control.ontap(event);
                    } else if (control.userToggle) {
                        control.userToggle(event);
                    } else if (control.onclick) {
                        control.onclick(event);
                    }
                    return true;
                };

                var handleSpacePress = function(oEvent) {
                    var focusedInfo = sap.ui.table.TableUtils.getFocusedItemInfo(treeTable);
                    var selectionCheckboxColumnShown = this.getSelectionMode() === sap.ui.vtm.SelectionMode.MultiToggle;
                    var columnIndex = selectionCheckboxColumnShown ? focusedInfo.cellInRow - 1 : focusedInfo.cellInRow;
                    var columns = treeTable.getColumns();
                    var column = columns[columnIndex];
                    if (!column) {
                        return;
                    }
                    var columnDefinition = column.data("definition");
                    var columnType = columnDefinition.getType();
                    var columnDescriptor = columnDefinition.getDescriptor();
                    var isHeaderRow = focusedInfo.row === 0;

                    if (isHeaderRow)  {
                        if (columnType === sap.ui.vtm.ColumnType.Internal && columnDescriptor === sap.ui.vtm.InternalColumnDescriptor.Visibility) {
                            var checkEye = column.getLabel();
                            tapControl(checkEye, oEvent);
                        }
                    } else if (columnType === sap.ui.vtm.ColumnType.Internal) {
                        var control = treeTable.getRows()[focusedInfo.row - 1].getCells()[columnIndex];
                        switch (columnDescriptor) {
                        case sap.ui.vtm.InternalColumnDescriptor.Tree:
                            // Prevent tree expansion behavior when space is pressed when a cell in the tree column has focus
                            sap.ui.table.TableUtils.toggleRowSelection(treeTable, oEvent.target);
                            oEvent.preventDefault();
                            oEvent.stopImmediatePropagation();
                            break;
                        case sap.ui.vtm.InternalColumnDescriptor.Visibility:
                        case sap.ui.vtm.InternalColumnDescriptor.MessageStatus:
                            tapControl(control, oEvent);
                            // Prevent row selection
                            oEvent.preventDefault();
                            oEvent.stopImmediatePropagation();
                            break;
                        default:
                            break;
                        }
                    }
                }.bind(this);

                treeTable.attachBrowserEvent("keyup", function(oEvent) {
                    if (oEvent.which === jQuery.sap.KeyCodes.SPACE) {
                        handleSpacePress(oEvent);
                    }
                });

                treeTable.attachRowSelectionChange(function (event) {
                    var _userInteraction = event.getParameter("userInteraction");
                    var changedRowIndices = event.getParameter("rowIndices");
                    var selectedRowIndices = treeTable.getSelectedIndices();
                    var addedItemIndices = [];
                    var removedItemIndices = [];
                    changedRowIndices.forEach(function(changedRowIndex) {
                        if (selectedRowIndices.indexOf(changedRowIndex) != -1) {
                            addedItemIndices.push(changedRowIndex);
                        } else {
                            removedItemIndices.push(changedRowIndex);
                        }
                    });

                    var selectionChangedParameters = {
                        addedItems: this._getTreeItemsFromRowIndices(addedItemIndices),
                        removedItems: this._getTreeItemsFromRowIndices(removedItemIndices),
                        userInteraction: _userInteraction
                    };

                    sap.ui.vtm.measure(this, "fireSelectionChanged", function() {
                        this.fireSelectionChanged(selectionChangedParameters);
                    }.bind(this));

                    if (_userInteraction) {
                        this.fireEvent("vtmInternalSetTreeSelectionComplete");
                    }
                }.bind(this));
            },

            renderer: function (oRM, oControl) {
                oRM.write("<div");
                oRM.writeControlData(oControl);
                oRM.addClass("sapUiVtmTree");
                oRM.writeStyles();
                oRM.writeClasses();
                oRM.write(">");

                var headerControls = oControl.getHeaderControls();
                headerControls.forEach(function(headerControl) {
                    if (headerControl) {
                        oRM.renderControl(headerControl);
                    }
                });
                var treeTable = oControl._getTreeTable();
                oRM.renderControl(treeTable);
                oRM.write("</div>");
            },

            _raiseExpandedChanged: function(eventParameters) {
                sap.ui.vtm.measure(this, "fireExpandedChanged", function() {
                    this.fireExpandedChanged(eventParameters);
                }.bind(this));
            },

            _handleToggleOpenState: function(oEvent) {
                var context = oEvent.getParameter("rowContext");
                var expanded = oEvent.getParameter("expanded");
                var contextPath = context.getPath();
                var treeItem = this._getItemByContextPath(contextPath);

                this._raiseExpandedChanged({
                    item: treeItem,
                    expanded: expanded,
                    userInteraction: true
                });
            },

            _getAncestor: function(ancestorType) {
                var ancestor = this.getParent();
                while (ancestor && ancestor.getMetadata().getName() !== ancestorType) {
                    ancestor = ancestor.getParent();
                }
                return ancestor;
            },

            /**
             * Gets the panel this tree belongs to.
             * @function
             * @public
             * @return {sap.ui.vtm.Panel} The panel this tree belongs to.
             */
            getPanel: function() {
                if (!this._panel) {
                    this._panel = this._getAncestor("sap.ui.vtm.Panel");
                }
                return this._panel;
            },

            /**
             * Expands or collapses the row associated with a tree item.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object} oTreeItem The tree item.
             * @param {boolean} bExpanded If <code>true</code> the row will be expanded otherwise it will be collapsed.
             * @return {sap.ui.vtm.Tree} A reference to <code>this</code> for method chaining.
             */
            setExpanded: function(oTreeItem, bExpanded) {
                var treeTable = this._getTreeTable();

                var expandOrCollapse = function() {
                    var rowIndex = this._getRowIndexForTreeItem(treeTable, oTreeItem);
                    if (rowIndex !== -1) {
                        var expandedChanged;
                        if (bExpanded) {
                            if (!treeTable.isExpanded(rowIndex)) {
                                expandedChanged = true;
                                treeTable.expand(rowIndex);
                            }
                        } else if (treeTable.isExpanded(rowIndex)) {
                            expandedChanged = true;
                            treeTable.collapse(rowIndex);
                        }
                        if (expandedChanged) {
                            this._raiseExpandedChanged({
                                item: oTreeItem,
                                expanded: bExpanded,
                                userInteraction: false
                            });
                        }
                    }
                }.bind(this);

                if (bExpanded) {
                    this._expandToTreeItem(oTreeItem, false, expandOrCollapse);
                } else {
                    expandOrCollapse();
                }

                return this;
            },

            /**
             * Gets whether the row associated with a tree item is expanded.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object} oTreeItem The tree item.
             * @returns {boolean} Whether the row associated with the specified tree item is expanded.
             */
            getExpanded: function(oTreeItem) {
                var treeTable = this._getTreeTable();
                var rowIndex = this._getRowIndexForTreeItem(treeTable, oTreeItem);
                if (rowIndex !== -1) {
                    return treeTable.isExpanded(rowIndex);
                }
                return false;
            },

            /**
             * Gets the fixed columns for the tree.
             * @public
             * @function
             * @returns {sap.ui.vtm.Column[]} The fixed columns.
             */
            getFixedColumns: function() {
                var columns = [];
                var treeTable = this._getTreeTable();
                var treeTableColumns = treeTable.getColumns();

                for (var i = 0; i < this._fixedColumns.length; i++) {
                    var treeTableColumn = treeTableColumns[i];
                    var column = treeTableColumn.data("definition");
                    column.setWidth(treeTableColumn.getWidth());
                    column.setHAlign(treeTableColumn.getHAlign());
                    columns.push(column);
                }
                return columns;
            },

            /**
             * Sets the fixed columns for the tree.
             * @public
             * @function
             * @param {sap.ui.vtm.Column[]} fixedColumns The fixed columns.
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            setFixedColumns: function (fixedColumns) {
                if (!fixedColumns) { throw "fixedColumns not specified"; }
                this._fixedColumns = fixedColumns;
                var dataColumns = this.getDataColumns();
                var allColumns = this._fixedColumns.concat(dataColumns);
                this._setColumns(allColumns);
                return this;
            },

            /**
             * Gets the set of data columns for the tree.
             * @public
             * @function
             * @returns {sap.ui.vtm.Column[]} The data columns for the tree.
             */
            getDataColumns: function () {
                var columns = [];
                var treeTable = this._getTreeTable();
                var treeTableColumns = treeTable.getColumns();

                for (var i = this._fixedColumns.length; i < treeTableColumns.length; i++) {
                    var treeTableColumn = treeTableColumns[i];
                    var column = treeTableColumn.data("definition");
                    column.setWidth(treeTableColumn.getWidth());
                    column.setHAlign(treeTableColumn.getHAlign());
                    columns.push(column);
                }
                return columns;
            },

            /**
             * Sets the data columns for the tree.
             * @public
             * @function
             * @param {sap.ui.vtm.Column[]} dataColumns The data columns for the tree.
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            setDataColumns: function (dataColumns) {
                if (!dataColumns) { throw "dataColumns not specified"; }
                var allColumns = this._fixedColumns.concat(dataColumns);
                this._setColumns(allColumns);
                return this;
            },

            /**
             * Sets the tree table columns.
             * @private
             * @function
             * @param {sap.ui.vtm.Column[]} allColumns An array containing definitions for both the fixed and non fixed columns.
             */
            _setColumns: function (allColumns) {
                var treeTable = this._getTreeTable();
                treeTable.removeAllColumns();
                allColumns.forEach(function(column) {
                    var tableColumn = this._createColumn(column);
                    treeTable.addColumn(tableColumn);
                }.bind(this));
                treeTable.setFixedColumnCount(this._fixedColumns.length);
            },

            /**
             * Finds tree items corresponding to a set of row indices.
             * @private
             * @function
             * @param {int[]} rowIndices An array of row indices.
             * @returns {object[]} Returns an array of tree items that were found for the specified row indices.
             */
            _getTreeItemsFromRowIndices: function (rowIndices) {
                return rowIndices
                    .map(function (rowIndex) { return this._getItemByRowIndex(rowIndex); }.bind(this))
                    .filter(function (ti) { return !!ti; });
            },

            _getTreeTable: function () {
                return this.getAggregation("_treeTable");
            },

            /**
             * Gets the root tree items.
             * @public
             * @function
             * @returns {object[]} The root tree items.
             */
            getRootItems: function () {
                return this._rootItems;
            },

            /**
             * Sets the root tree items.
             * @public
             * @function
             * @param {object[]} rootItems The root tree items.
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            setRootItems: function (rootItems) {
                this._rootItems = rootItems;
                return this;
            },

            /**
             * Returns whether the tree is empty.
             * @public
             * @function
             * @returns {boolean} Whether the tree is empty.
             */
            isEmpty: function() {
                return this._rootItems.length === 0;
            },

            /**
             * Gets the selected tree items.
             * @public
             * @function
             * @returns {object[]} The selected tree items.
             */
            getSelectedItems: function () {
                var selectedItemIndices = this._getTreeTable().getSelectedIndices();
                return this._getTreeItemsFromRowIndices(selectedItemIndices);
            },

            /**
             * Expands the ancestors of a tree item, optionally scrolls it into view and calls a callback after the expansion.
             * @private
             * @function
             * @param {object} treeItem The tree item.
             * @param {boolean} scrollIntoView Whether to scroll the tree item into view after expanding its ancestors.
             * @param {function} callback A callback to call on completion of the tree expansion.
             */
            _expandToTreeItem: function(treeItem, scrollIntoView, callback) {
                var treeTable = this._getTreeTable();

                // getScrollPosition - When we know the index of the row where we want to scroll,
                // we do some calculations so we position that row in the middle
                // of the table. For example if we want to scroll index 30 into view
                // and the table can fit 12 rows into the view, we will display the rows
                // starting from 24 until 36 so row number 30 is in the middle.
                var getScrollPosition = function(currentRow, rowIndex, rowCapacity) {
                    var position;
                    if ((rowIndex < currentRow) || (rowIndex >= (currentRow + rowCapacity))) {
                        // if the relevant row index is not in the view,
                        // we perform the necessary calculations.
                        position = rowIndex - (rowCapacity / 2);
                    } else {
                        // if the relevant row is already visible,
                        // we don't change anything and we return the current index.
                        position = currentRow;
                    }
                    // We round the index so it's an integer
                    // and we also make sure it's greater than 0 at all times.
                    position = position > 0 ? Math.floor(position) : 0;
                    return position;
                };

                var ancestors = this.getAncestorItems(treeItem.id, false);

                // expandHandler it's called after the tree table expands a row.
                // This is a way of expanding tree items recursively. We start with the
                // "oldest" ancestors and we continue down the tree to the relevant tree item.
                var expandHandler = function(ancestorsProcessorCallback, ancestors, event) {
                    if (event.getParameter("reason") === "expand") {
                        ancestorsProcessorCallback(ancestors);
                    }
                };

                // function.bind creates a new function and we have to keep it to unsubscribe from event later
                var boundExpandHandler = null;

                var startSearchIndex = 0;

                // processAncestors removes the first ancestor from the collection,
                // it gets the row index from the tree table, it expands that row
                // and at the end, it scrolls the relevant row into view.
                var processAncestors = function(ancestors) {
                    var finalActions = function() {
                        treeTable.getBinding("rows").detachChange(boundExpandHandler);

                        var rowIndex = this._getRowIndexForTreeItem(treeTable, treeItem, startSearchIndex);
                        if (rowIndex === -1) {
                            throw "Tree item with id '" + treeItem.id + "' not found in treeTable";
                        }
                        if (scrollIntoView) {
                            var rowCapacity = treeTable.getVisibleRowCount(),
                                currentRow = treeTable.getFirstVisibleRow(),
                                rowToScrollTo = getScrollPosition(currentRow, rowIndex, rowCapacity);

                            if (rowToScrollTo !== currentRow) {
                                treeTable.setFirstVisibleRow(rowToScrollTo);
                            }
                        }
                        if (callback) {
                            callback();
                        }
                    }.bind(this);

                    setTimeout(function() {
                        if (ancestors.length) {
                            while (ancestors.length) {
                                // Loop through the ancestors until we find one that needs to be expanded
                                var ancestor = ancestors.shift();
                                var rowIndex = this._getRowIndexForTreeItem(treeTable, ancestor, startSearchIndex);
                                if (rowIndex === -1) {
                                    throw "Tree item with id '" + ancestor.id + "' not found in treeTable";
                                }
                                startSearchIndex = rowIndex + 1;

                                if (!treeTable.isExpanded(rowIndex)) {
                                    treeTable.expand(rowIndex);

                                    this._raiseExpandedChanged({
                                        item: ancestor,
                                        expanded: true,
                                        userInteraction: false
                                    });
                                    return;

                                } else if (!ancestors.length) {
                                    finalActions();
                                }
                            }
                        } else {
                            finalActions();
                        }
                    }.bind(this), 0);
                }.bind(this);

                // We listen for the change event so we now when the tree.expand() method has finished
                boundExpandHandler = expandHandler.bind(this, processAncestors, ancestors);
                treeTable.getBinding("rows").attachChange(boundExpandHandler);

                // start processing the ancestors:
                // get ancestor => find its index => expand that index => repeat
                processAncestors(ancestors);
            },

            /**
             * Gets a tree table row index for a tree item.
             * @function
             * @private
             * @param {sap.ui.table.TreeTable} treeTable The tree table.
             * @param {object} treeItem The tree item to lookup.
             * @param {int} startIndex The row to start searching from.
             * @returns {int} The row index of the tree item or -1 if there is no row for the tree item in the tree table currently.
             */
            _getRowIndexForTreeItem: function(treeTable, treeItem, startIndex) {
                var rowIndex = -1;
                sap.ui.vtm.measure(this, "_getRowIndexForTreeItem", function() {
                    if (!startIndex) {
                        startIndex = 0;
                    }

                    var indexDataModel = function(dataModel, pathInModel) {
                        pathInModel.forEach(function(position) {
                            dataModel = dataModel[position];
                        });
                        return dataModel;
                    };

                    var treeItems = this.getAllItems();
                    for (var currentIndex = startIndex; currentIndex < treeItems.length; currentIndex++) {
                        var context = treeTable.getContextByIndex(currentIndex);
                        if (context) {
                            var pathInModel = context.getPath().split("/");
                            pathInModel.shift();

                            var dataModel = context.getModel().getData();
                            var currentItem = indexDataModel(dataModel, pathInModel);
                            if (currentItem === treeItem) {
                                rowIndex = currentIndex;
                                break;
                            }
                        }
                    }
                }.bind(this));
                return rowIndex;
            },

            /**
             * Expands all ancestors of specified tree item.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object} treeItem Tree item.
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            expandAncestors: function (treeItem) {
                sap.ui.vtm.measure(this, "expandAncestors", function() {
                    this._expandToTreeItem(treeItem, false, null);
                }.bind(this));
                return this;
            },

            /**
             * Expands all tree items in the tree.
             * @public
             * @function
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            expandAll: function() {
                sap.ui.vtm.measure(this, "expandAll", function() {
                    this._getTreeTable().expandToLevel(1000 * 1000 * 1000);
                }.bind(this));
                return this;
            },


            /**
             * Expands all tree items in the tree.
             * @public
             * @function
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            collapseAll: function() {
                sap.ui.vtm.measure(this, "collapseAll", function() {
                    this._getTreeTable().collapseAll();
                }.bind(this));
                return this;
            },

            /**
             * Expands tree items in the tree from the root down to the given level.
             * @public
             * @function
             * @param {int} iLevel The tree level to expand to.
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            expandToLevel: function(iLevel) {
                sap.ui.vtm.measure(this, "expandToLevel", function() {
                    this._getTreeTable().expandToLevel(iLevel);
                }.bind(this));
                return this;
            },

            /**
             * Brings specified tree item to view, expanding the tree if necessary.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object} treeItem The tree item to scroll into view.
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            scrollIntoView: function (treeItem) {
                sap.ui.vtm.measure(this, "scrollIntoView", function() {
                    this._expandToTreeItem(treeItem, true, null);
                }.bind(this));
                return this;
            },

            /**
             * Sets the selected tree items.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object|object[]} items Tree item(s) to select in the tree.
             * @param {boolean?} scrollToView When set brings selected item into view. Default value is to true.
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            setSelectedItems: function (items, scrollToView) {
                items = sap.ui.vtm.ArrayUtilities.wrap(items);
                if (scrollToView !== true && scrollToView !== false) {
                    scrollToView = true;
                }
                if (this.getSelectionMode() == sap.ui.vtm.SelectionMode.Single && items.length > 1) {
                    items = items.slice(0, 1);
                }
                if (!items.length) {
                    this._getTreeTable().clearSelection();
                    this.fireEvent("vtmInternalSetTreeSelectionComplete");
                    return this;
                }

                var setTreeSelection = function(selectedItems) {
                    var treeTable = this._getTreeTable();
                    for (var i = 0; ; i++) {
                        var treeItem = this._getItemByRowIndex(i);
                        if (!treeItem) {
                            break;
                        }
                        var inSelectedItems = selectedItems.indexOf(treeItem) !== -1;
                        if (inSelectedItems != treeTable.isIndexSelected(i)) {
                            if (inSelectedItems) {
                                treeTable.addSelectionInterval(i, i);
                            } else {
                                treeTable.removeSelectionInterval(i, i);
                            }
                        }
                    }
                    this.fireEvent("vtmInternalSetTreeSelectionComplete");
                }.bind(this);

                var selectTreeItems = function(){
                    setTreeSelection(items);
                };

                for (var idx = 0; idx < items.length; idx++) {
                    var item = items[idx],
                        isLast = idx === items.length - 1,
                        callback = isLast ? selectTreeItems : null;

                    this._expandToTreeItem(item, scrollToView, callback);
                }
                return this;
            },

            /**
             * Validates the tree.
             * If errors are found they are written to the console log and an exception is thrown.
             * @public
             * @function
             * @returns {sap.ui.vtm.Tree} <code>this</code> for method chaining.
             */
            validateTree: function() {
                sap.ui.vtm.measure(this, "validateTree", function() {
                    var errors = sap.ui.vtm.TreeItemUtilities.validateTree(this.getRootItems());
                    if (errors.length !== 0) {
                        errors.forEach(function(error) {
                            var message = "Tree error in " + this.getId() + ": " + error;
                            jQuery.sap.log.error(message, null, "sap.ui.vtm.Tree");
                        });
                        throw "There were errors in the " + this.getId() + " tree. See the console trace for details";
                    }
                }.bind(this));
                return this;
            },

            /**
             * Updates the model.
             * 
             * The application should call this whenever changes are made to the tree model.
             * @public
             * @function
             * @param {boolean?} forceRecreate If <code>true</code>, the tree control model and bindings are recreated.
             * If <code>false</code> and the model and bindings already exist, this call only results in the bindings being refreshed.
             * Rebuilding the model and bindings is much more expensive than refreshing the bindings, so only use a value of <code>true</code> for this parameter
             * when a value of <code>false</code> does not result in the the tree being updated correctly.
             * @fires beforeModelUpdated
             * @fires modelUpdated
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            updateModel: function (forceRecreate) {
                sap.ui.vtm.measure(this, "updateModel", function() {
                    sap.ui.vtm.measure(this, "fireBeforeModelUpdated", function() {
                        this.fireBeforeModelUpdated();
                    }.bind(this));

                    this._updateModel(forceRecreate);

                    sap.ui.vtm.measure(this, "fireModelUpdated", function() {
                        this.fireModelUpdated();
                    }.bind(this));
                }.bind(this));

                return this;
            },

            _updateModel: function (forceRecreate) {
                var treeTable = this._getTreeTable();
                var jsonModel = treeTable.getModel();
                if (!jsonModel || forceRecreate) {
                    jsonModel = new sap.ui.model.json.JSONModel();
                    jsonModel.setSizeLimit(1000000);
                    treeTable.bindRows({
                        path: "/rootItems",
                        key: "id",
                        parameters: {
                            arrayNames: ["includedChildren"],
                            numberOfExpandedLevels: 1
                        }
                    });
                    jsonModel.setData({ rootItems: this.getRootItems() });
                    treeTable.setModel(jsonModel);
                } else {
                    jsonModel.setData({ rootItems: this.getRootItems() });
                    this._updateBindings(true);
                }
            },

            _updateBindings: function() {
                this._getTreeTable().getModel().updateBindings(true);
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
             * @param {boolean?} checkForHierarchyChanges When true a <code>hierarchyChanged</code> event will be raised if the hierarchy has changed since the last time this method was called.
             * This method is called when the tree is empty as part of the {@link sap.ui.vtm.Tree} constructor, so the first time it is called from application code a <code>hierarchyChanged</code> event will be raised if the tree has been populated.
             * The default value for the parameter is <code>true</code>.
             * @fires hierarchyChanged
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            updateCollections: function (checkForHierarchyChanges) {
                sap.ui.vtm.measure(this, "updateCollections", function() {
                    if (this._treeCollections.updateCollections(this.getRootItems(), checkForHierarchyChanges)) {
                        sap.ui.vtm.measure(this, "fireHierarchyChanged", function() {
                            this.fireHierarchyChanged();
                        }.bind(this));
                    }
                }.bind(this));
                return this;
            },

            /**
             * Update the collection used by {@link #getItemsBySceneNodeId}.
             * 
             * This is useful when the only changes to the tree since the last call to {@link #updateCollections} are changes to the <code>sceneNodeIds<code> properties of the tree items.
             * @public
             * @function
             * @returns {sap.ui.vtm.Tree} Returns <code>this</code> for method chaining.
             */
            updateTreeItemsBySceneNodeId: function() {
                sap.ui.vtm.measure(this, "updateTreeItemsBySceneNodeId", function() {
                    this._treeCollections.updateTreeItemsBySceneNodeId(this.getRootItems());
                }.bind(this));
                return this;
            },

            /**
             * Finds a tree item by model context path or returns undefined if it is not found.
             * @private
             * @function
             * @param {string} contextPath The context path to look for.
             * @returns {object|undefined} The tree item matching the specified context path or undefined if no match was found.
             */
            _getItemByContextPath: function (contextPath) {
                return this._getTreeTable().getModel().getProperty(contextPath) || undefined;
            },

            /**
             * Finds a tree item by id or returns undefined if it is not found.</br>
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {string} treeItemId The tree item id to look for.
             * @returns {object|undefined} The tree item matching the specified id or undefined if no match was found.
             */
            getItem: function (treeItemId) {
                return this._treeCollections.getItem(treeItemId);
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
                return this._treeCollections.isIncludedItem(treeItem);
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
                return this._treeCollections.isExcludedItem(treeItem);
            },

            /**
             * Finds the set of tree items that are associated with a particular scene node id.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {string|string[]} sceneNodeIds The scene node ID or IDs to find.
             * @param {sap.ui.vtm.TreeItemType?} treeItemType Indicates the types of tree item to match.
             * Defaults to {@link sap.ui.vtm.TreeItemType.Included}.
             * @returns {object[]} The set of tree items that have a  <code>sceneNodeIds</code> property that contains the specified scene node id.
             */
            getItemsBySceneNodeId: function (sceneNodeIds, treeItemType) {
                return this._treeCollections.getItemsBySceneNodeId(sceneNodeIds, treeItemType);
            },

            /**
             * Finds a parent tree item or returns undefined if it is not found.
             *
             * This method relies on {@link #updateCollections} being called after the tree is populated/changed.
             * @public
             * @function
             * @param {object|string} treeItem The child tree item or child tree item id.
             * @returns {object|undefined} The parent tree item or undefined if no match was found.
             */
            getParentItem: function (treeItem) {
                return this._treeCollections.getParentItem(treeItem);
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
                return this._treeCollections.getDescendantItems(treeItem, treeItemType);
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
                return this._treeCollections.getAncestorItems(treeItem);
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
                return this._treeCollections.getAllItems(treeItemType);
            },

            _modifyDisplayState: function (treeItems, updateFunction, recursive, visualOnly, refresh) {
                treeItems = sap.ui.vtm.ArrayUtilities.wrap(treeItems);
                recursive = recursive == null ? true : recursive;
                refresh = refresh == null ? true : refresh;
                visualOnly = visualOnly == null ? true : visualOnly;

                var updateIfRequired = function (ti) {
                    if (!visualOnly || sap.ui.vtm.TreeItemUtilities.hasVisibility(ti)) {
                        updateFunction(ti);
                    }
                    return sap.ui.vtm.ChildCollectionType.IncludedAndExcluded;
                };

                treeItems.forEach(function(item) {
                    if (recursive) {
                        sap.ui.vtm.TreeItemUtilities.traverseBranch(item, updateIfRequired);
                    } else {
                        updateIfRequired(item);
                    }
                });

                if (refresh) {
                    this.updateModel();
                    this.getPanel().getViewport().refresh();
                }
            },

            _getTreeItemData: function(treeItems, retrievalFunction) {
                if (Array.isArray(treeItems)) {
                    return treeItems.map(retrievalFunction);
                } else {
                    return retrievalFunction(treeItems);
                }
            },

            /**
             * Sets the <code>visibility</code> property of some tree items.
             * @public
             * @function
             * @param {object|object[]} treeItems The tree item or the array of tree items.
             * @param {boolean} visibility The new visibility state of the tree items.
             * @param {boolean?} recursive If <code>true</code> changes are applied recursively to included and excluded descendant tree items. Default value is <code>true</code>.
             * @param {boolean?} visualOnly If <code>true</code> changes are only made to tree items that have a defined <code>visibility</code> property value. Default value is <code>true</code>.
             * @param {boolean?} refresh If <code>true<code>, {@link #updateModel} is called to refresh the tree (so the check eye icons are updated)
             * and {@link sap.ui.vtm.Viewport#refresh} is called on the corresponding {@link sap.ui.vtm.Viewport} to recalculate the display state. Default value is <code>true</code>.
             * @return {sap.ui.vtm.Tree} <code>this</code> to allow method chaining.
             */
            setVisibility: function (treeItems, visibility, recursive, visualOnly, refresh) {
                var updateVisibility = function (ti) {
                    if (visibility == undefined) {
                        delete ti.visibility;
                    } else {
                        ti.visibility = visibility;
                    }
                };
                this._modifyDisplayState(treeItems, updateVisibility, recursive, visualOnly, refresh);
                return this;
            },

            /**
             * Gets the <code>visibility</code> property of a tree item or array of tree items.
             *
             * If a single tree item is passed to the method then a single value is returned.<br/>
             * If an array of tree items is passed to the method then an array is returned.
             * @public
             * @function
             * @param {object|object[]} treeItems The tree item or the array of tree items.
             * @return {boolean|boolean[]} A single value or an array of values where the value is <code>true</code> if the tree item is visible, <code>false</code> otherwise.
             */
            getVisibility: function (treeItems) {
                return this._getTreeItemData(treeItems, function(treeItem) {
                    return treeItem.visibility;
                });
            },

            /**
             * Sets the <code>opacity</code> property of some tree items.
             * @public
             * @function
             * @param {object|object[]} treeItems The tree item or the array of tree items.
             * @param {float} opacity The new opacity value of the tree items (between 0.0 and 1.0 inclusive).
             * @param {boolean?} recursive If <code>true</code> changes are applied recursively to included and excluded descendant tree items. Default value is <code>true</code>.
             * @param {boolean} visualOnly If <code>true</code> changes are only made to tree items that have a defined <code>visibility</code> property value. Default value is <code>true</code>.
             * @param {boolean} refresh If <code>true<code>, {@link #updateModel} is called to refresh the tree (so the check eye icons are updated)
             * and {@link sap.ui.vtm.Viewport#refresh} is called on the corresponding {@link sap.ui.vtm.Viewport} to recalculate the display state. Default value is <code>true</code>.
             * @return {sap.ui.vtm.Tree} <code>this</code> to allow method chaining.
             */
            setOpacity: function (treeItems, opacity, recursive, visualOnly, refresh) {
                var updateOpacity = function (ti) {
                    if (opacity == undefined) {
                        delete ti.opacity;
                    } else {
                        ti.opacity = opacity;
                    }
                };
                this._modifyDisplayState(treeItems, updateOpacity, recursive, visualOnly, refresh);
                return this;
            },

            /**
             * Gets the <code>opacity</code> property of a tree item or array of tree items.
             *
             * If a single tree item is passed to the method then a single value is returned.<br/>
             * If an array of tree items is passed to the method then an array is returned.
             * @public
             * @function
             * @param {object|object[]} treeItems The tree item or the array of tree items.
             * @return {float|float[]} A single value or an array of values representing the opacity values of the tree item(s) passed in.
             */
             getOpacity: function (treeItems) {
                 return this._getTreeItemData(treeItems, function(treeItem) {
                     return treeItem.opacity;
                 });
             },

             /**
              * Sets the <code>highlightColor</code> property of some tree items.
              * @public
              * @function
              * @param {object|object[]} treeItems The tree item or the array of tree items.
              * @param {sap.ui.core.CSSColor} highlightColor The new highlight color value of the tree items.
              * @param {boolean?} recursive If <code>true</code> changes are applied recursively to included and excluded descendant tree items. Default value is <code>true</code>.
              * @param {boolean} visualOnly If <code>true</code> changes are only made to tree items that have a defined <code>visibility</code> property value. Default value is <code>true</code>.
              * @param {boolean} refresh If <code>true<code>, {@link #updateModel} is called to refresh the tree (so the check eye icons are updated)
              * and {@link sap.ui.vtm.Viewport#refresh} is called on the corresponding {@link sap.ui.vtm.Viewport} to recalculate the display state. Default value is <code>true</code>.
              * @return {sap.ui.vtm.Tree} <code>this</code> to allow method chaining.
              */
             setHighlightColor: function (treeItems, highlightColor, recursive, visualOnly, refresh) {
                 var updateHighlightColor = function (ti) {
                     if (highlightColor == null) {
                         delete ti.highlightColor;
                     } else {
                         ti.highlightColor = highlightColor;
                     }
                 };
                 this._modifyDisplayState(treeItems, updateHighlightColor, recursive, visualOnly, refresh);
                 return this;
             },

             /**
              * Gets the <code>highlightColor</code> property of a tree item or array of tree items.
              *
              * If a single tree item is passed to the method then a single value is returned.<br/>
              * If an array of tree items is passed to the method then an array is returned.
              * @public
              * @function
              * @param {object|object[]} treeItems The tree item or the array of tree items.
              * @return {string|string[]} A single value or an array of values representing the highlight color values of the tree item(s) passed in.
              */
              getHighlightColor: function (treeItems) {
                  return this._getTreeItemData(treeItems, function(treeItem) {
                      return treeItem.highlightColor;
                  });
              },

            /**
             * Finds a tree item by index or returns undefined if it is not found.
             * @private
             * @function
             * @param {int} index The row index of the tree item to look for.
             * @returns {object|undefined} The tree item matching the specified row index or undefined if no match was found.
             */
            _getItemByRowIndex: function (index) {
                var treeTable = this._getTreeTable();
                var context = treeTable.getContextByIndex(index);
                var path = context ? context.sPath : "";
                return this._getItemByContextPath(path);
            },

            onAfterRendering: function () {
                var treeTable = this._getTreeTable();
                if (treeTable.setFixedColumnCount() != this._fixedColumns.length) {
                    treeTable.setFixedColumnCount(this._fixedColumns.length);
                }
                this._addDragHandlers();
                this._addMutationObserver();
            },

            setSelectionMode: function(value) {
                if (value === this.getSelectionMode()) {
                    return this;
                }
                var treeTable = this._getTreeTable();
                treeTable.clearSelection();

                var treeTableSelectionMode;
                var selectionBehavior;

                switch (value) {
                case sap.ui.vtm.SelectionMode.Single:
                    treeTableSelectionMode = sap.ui.table.SelectionMode.Single;
                    selectionBehavior = sap.ui.table.SelectionBehavior.RowOnly;
                    break;
                case sap.ui.vtm.SelectionMode.MultiToggle:
                    treeTableSelectionMode = sap.ui.table.SelectionMode.MultiToggle;
                    selectionBehavior = sap.ui.table.SelectionBehavior.Row;
                    break;
                default:
                    throw "Unknown selection mode: '" + value + "'";
                }

                treeTable.setSelectionBehavior(selectionBehavior);
                treeTable.setSelectionMode(treeTableSelectionMode);
                this.setProperty("selectionMode", value);

                return this;
            },

            /**
             * This is used to ensure that the drag handlers and drag and drop related attributes are restored after
             * the HTML generated for the TreeTable is modified.
             * @private
             * @function
             */
            _addMutationObserver: function () {
                var ignoreChanges = false;

                var observer = new MutationObserver(function (mutations) {
                    if (ignoreChanges) {
                        return;
                    }
                    ignoreChanges = true;
                    var addedDragHandlers = false;
                    mutations.forEach(function (mutation) {
                        if (addedDragHandlers) {
                            return;
                        }
                        if (mutation.type === "childList") {
                            this._addDragHandlers();
                            addedDragHandlers = true;
                        }
                    }.bind(this));
                    ignoreChanges = false;
                }.bind(this));

                var observerConfig = {
                    subtree: true,
                    childList: true
                };

                jQuery("#" + this.getId()).each(function (index, rowElement) {
                    observer.observe(rowElement, observerConfig);
                });
            },

            /**
             * This gets a row index for a an HTML tr element belonging to the TreeTable.
             * @private
             * @function
             * @param {HTMLElement} trElement The HTML tr element.
             * @returns {int} The sap.ui.table.TreeTable row index for the HTML tr element.
             */
            _getRowIndexForTableRow: function (trElement) {
                var rowIndexAttr = jQuery(trElement).attr("data-sap-ui-rowindex");
                var iRowIndex = this._getTreeTable().getFirstVisibleRow() + parseInt(rowIndexAttr, 10);
                return iRowIndex;
            },

            /**
             * Adds drag and drop handlers and "draggable" and "droppable" attributes to the relevant HTML elements.
             * @private
             * @function
             */
            _addDragHandlers: function () {
                var id = this.getId();
                var selectorString = "#" + id + " tr.sapUiTableTr";
                 if (jQuery(selectorString).attr("draggable")) {
                    return;
                }
                var vtm = this.getPanel().getVtm();

                var dragStartEventHandler = function (ev) {

                    // we do not use the dataTransfer mechanism, but this is required for drag and drop to work in Firefox.
                    // at the same type IE10 requires type string set to "text"
                    ev.dataTransfer.setData("text", "");

                    var target = ev.currentTarget;
                    var rowIndex = this._getRowIndexForTableRow(target);
                    var treeItem = this._getItemByRowIndex(rowIndex);
                    if (!treeItem) {
                        ev.preventDefault();
                        return;
                    }

                    var selectedItems = this.getSelectedItems();
                    if (selectedItems && selectedItems.length && selectedItems.indexOf(treeItem) < 0) {
                        ev.preventDefault();
                        return;
                    }

                    vtm._dragStartParameters = {
                        dragItem: treeItem,
                        dragTree: this
                    };

                    var allowDefaultAction;

                    sap.ui.vtm.measure(this, "fireDragStart", function() {
                        allowDefaultAction = this.fireDragStart(vtm._dragStartParameters);
                    }.bind(this));

                    if (!allowDefaultAction) {
                        ev.preventDefault();
                    }
                }.bind(this);

                var dragOverEventHandler = function (ev) {
                    var dragStartParameters = vtm._dragStartParameters;
                    if (!dragStartParameters) {
                        return;
                    }
                    var target = ev.currentTarget;
                    var rowIndex = this._getRowIndexForTableRow(target);
                    var dragOverParameters = {
                        dragItem: dragStartParameters.dragItem,
                        dragTree: dragStartParameters.dragTree,
                        dragOverItem: this._getItemByRowIndex(rowIndex),
                        dragOverTree: this
                    };

                    var allowDefaultAction;

                    sap.ui.vtm.measure(this, "fireDragOver", function() {
                        allowDefaultAction = this.fireDragOver(dragOverParameters);
                    }.bind(this));

                    if (!allowDefaultAction) {
                        ev.preventDefault();
                    }
                }.bind(this);

                var dropEventHandler = function (ev) {
                    var dragStartParameters = vtm._dragStartParameters;
                    if (!dragStartParameters) {
                        return;
                    }
                    var target = ev.currentTarget;
                    var rowIndex = this._getRowIndexForTableRow(target);
                    var dropParameters = {
                        dragItem: dragStartParameters.dragItem,
                        dragTree: dragStartParameters.dragTree,
                        dropItem: this._getItemByRowIndex(rowIndex),
                        dropTree: this
                    };
                    vtm._dragStartParameters = null;

                    sap.ui.vtm.measure(this, "fireDrop", function() {
                        this.fireDrop(dropParameters);
                    }.bind(this));
                }.bind(this);

                var addEventHandlers = function (element) {
                    element.addEventListener("dragstart", dragStartEventHandler, false);
                    element.addEventListener("dragover", dragOverEventHandler, false);
                    element.addEventListener("drop", dropEventHandler, false);
                };

                jQuery(selectorString).each(function () {
                    var element = jQuery(this);
                    element.attr("draggable", "true");
                    element.attr("droppable", "true");
                    addEventHandlers(this);
                });
            },

            /**
             * Creates a {@link sap.ui.table.Column} from a column definition and template.
             * @private
             * @function
             * @param {sap.ui.vtm.Column} column The column definition.
             * @return {sap.ui.table.Column} The created {@link sap.ui.table.Column}.
             */
            _createColumn: function (column) {
                var template = column.getTemplate() || this._createColumnTemplate(column);
                var label = column.getLabel();
                var labelControl = column.getLabelControl();
                var settings = {
                    label: labelControl ? labelControl : label,
                    tooltip: column.getTooltip() || label,
                    hAlign: column.getHAlign() || sap.ui.core.HorizontalAlign.Left,
                    width: column.getWidth() || "auto",
                    resizable: column.getResizable(),
                    template: template
                };
                var tableColumn = new sap.ui.table.Column(settings);
                tableColumn.setTemplate(template);
                tableColumn.data("definition", column);
                return tableColumn;
            },

            /**
             * Recursively traverses a tree branch calling a function on each item (including the tree item that is the root of the branch).
             * @public
             * @function
             * @param {object} treeItem The root of the branch to apply the function to.
             * @param {function} callback The function to apply to tree items in the branch.<br/>
             *                            The first parameter to the callback function is the current tree item object (at the current point of the traversal.<br/>
             *                            The second parameter to the callback function is the set of ancestors of the current tree item in the traversal.<br/>
             *                            The function may return a {@link sap.ui.vtm.ChildCollectionType} value to specify which immediate children of the tree item to traverse.<br/>
             *                            If no such value is returned a default of {@link sap.ui.vtm.ChildCollectionType.Included} is used.
             * @return {sap.ui.vtm.Tree} <code>this</code> to allow method chaining.
             */
            traverseBranch: function (treeItem, callback) {
                var ancestors = this.getAncestorItems(treeItem);
                sap.ui.vtm.TreeItemUtilities.traverseBranch(treeItem, callback, ancestors);
                return this;
            },

            /**
             * Recursively traverses the tree calling a function on each item.
             * @public
             * @function
             * @param {function} callback The function to apply to tree items in the tree.<br/>
             *                            The first parameter to the callback function is the current tree item object (at the current point of the traversal.<br/>
             *                            The second parameter to the callback function is the set of ancestors of the current tree item.<br/>
             *                            The function may return a {@link sap.ui.vtm.ChildCollectionType} value to specify which immediate children to traverse.
             *                            If no such value is returned a default of {@link sap.ui.vtm.ChildCollectionType.Included} is used.
             * @return {sap.ui.vtm.Tree} <code>this</code> to allow method chaining.
             */
            traverseTree: function (callback) {
                this.getRootItems().forEach(function(rootItem) {
                    this.traverseBranch(rootItem, callback, []);
                }.bind(this));
                return this;
            },

            /**
             * Removes a root item from the tree.
             * @public
             * @function
             * @param {string|object} rootItemToRemove The root tree item to remove (or its id).
             * @returns {object|undefined} Returns the deleted item or undefined if no item was removed.
             * @return {sap.ui.vtm.Tree} <code>this</code> to allow method chaining.
             */
            removeRoot: function (rootItemToRemove) {
                return sap.ui.vtm.TreeItemUtilities.removeRoot(this._rootItems, rootItemToRemove);
            },

            /**
             * Adds a root item to the tree.
             * @public
             * @function
             * @param {object} rootItemToAdd The root tree item to remove.
             * @return {sap.ui.vtm.Tree} <code>this</code> to allow method chaining.
             */
            addRoot: function (rootItemToAdd) {
                sap.ui.vtm.TreeItemUtilities.addRoot(this._rootItems, rootItemToAdd);
                return this;
            },

            /**
             * Creates a column template from a column definition.
             * @private
             * @function
             * @param {sap.ui.vtm.Column} column The column definition
             * @return {sup.ui.core.Control} The column template.
             */
            _createColumnTemplate: function (column) {
                var ColumnTemplates = sap.ui.vtm.ColumnTemplates;
                var type = column.getType();
                if (!type) { throw "Column type not specified"; }
                switch (type) {
                    case sap.ui.vtm.ColumnType.Internal: {
                        var columnDescriptor = column.getDescriptor();
                        switch (columnDescriptor) {
                            case sap.ui.vtm.InternalColumnDescriptor.TreeItemId:
                                return ColumnTemplates.createTreeItemIdColumnTemplate();
                            case sap.ui.vtm.InternalColumnDescriptor.Tree:
                                return ColumnTemplates.createTreeColumnTemplate();
                            case sap.ui.vtm.InternalColumnDescriptor.MessageStatus:
                                var messageStatusColumnTemplate = ColumnTemplates.createMessageStatusColumnTemplate();
                                messageStatusColumnTemplate.attachPress(function(oEvent) {
                                    var control = oEvent.getSource();
                                    var oContext = control.getBindingContext();
                                    var sPath = oContext.getPath();
                                    var item = this._getItemByContextPath(sPath);
                                    this.fireMessageStatusIconClicked({
                                        item: item,
                                        control: control
                                    });
                                }.bind(this));
                                messageStatusColumnTemplate.addEventDelegate({
                                    onfocusin: function(event) {
                                        var core = sap.ui.getCore();
                                        var focusedControlId = core.getCurrentFocusedControlId();
                                        var focusedControl = core.byId(focusedControlId);
                                        if (focusedControl) {
                                            var domRef = focusedControl.getDomRef();
                                            if (domRef) {
                                                domRef.blur();
                                            }
                                        }
                                    }
                                }, messageStatusColumnTemplate);
                                return messageStatusColumnTemplate;
                            case sap.ui.vtm.InternalColumnDescriptor.AbsoluteMatrix:
                                return ColumnTemplates.createAbsoluteMatrixColumnTemplate();
                            case sap.ui.vtm.InternalColumnDescriptor.RelativeMatrix:
                                return ColumnTemplates.createRelativeMatrixColumnTemplate();
                            case sap.ui.vtm.InternalColumnDescriptor.SceneNodeIds:
                                return ColumnTemplates.createSceneNodeIdsColumnTemplate();
                            case sap.ui.vtm.InternalColumnDescriptor.Visibility:
                                var sceneNodeVisibilityColumnTemplate = ColumnTemplates.createVisibilityColumnTemplate();
                                var handleChange = function(control, visibility) {
                                    var sPath = control.getBindingContext().getPath();
                                    var item = this._getItemByContextPath(sPath);
                                    if (item) {
                                         sap.ui.vtm.measure(this, "fireVisibilityIconClicked", function() {
                                            this.fireVisibilityIconClicked({
                                                item: item,
                                                visibility: visibility,
                                                control: control
                                            });
                                        }.bind(this));
                                    }
                                }.bind(this);
                                sceneNodeVisibilityColumnTemplate.attachChange(function(event) {
                                    var control = event.getSource();
                                    handleChange(control, control.getChecked());
                                });
                                sceneNodeVisibilityColumnTemplate.attachBrowserEvent("click", function(event) {
                                    if (event && event.target) {
                                        var ui5Controls = jQuery(document.getElementById(event.target.id)).control();
                                        var control = sap.ui.vtm.ArrayUtilities.unwrap(ui5Controls);
                                        if (control) {
                                            handleChange(control, !control.getChecked());
                                            // Prevent table row selection
                                            event.stopPropagation(); 
                                            event.preventDefault();
                                        }
                                    }
                                });
                                return sceneNodeVisibilityColumnTemplate;
                            case sap.ui.vtm.InternalColumnDescriptor.Opacity:
                                return ColumnTemplates.createOpacityColumnTemplate();
                            case sap.ui.vtm.InternalColumnDescriptor.HighlightColor:
                                return ColumnTemplates.createHighlightColorColumnTemplate();
                            default:
                                throw "Unknown internal column type: " + columnDescriptor;
                        }
                        break;
                    }
                case sap.ui.vtm.ColumnType.Metadata:
                    return ColumnTemplates.createMetadataColumnTemplate(column);
                case sap.ui.vtm.ColumnType.Identifier:
                    return ColumnTemplates.createIdentifierColumnTemplate(column);
                case sap.ui.vtm.ColumnType.AppData:
                    return ColumnTemplates.createAppDataColumnTemplate(column);
                default:
                    throw "Invalid column type: " + type;
                }
            }
        });

        return Tree;
    });