/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.variants.VariantManagement.
sap.ui.define([
	'jquery.sap.global', 'sap/ui/Device', 'sap/ui/model/json/JSONModel', 'sap/m/VBox', 'sap/m/SearchField', 'sap/m/RadioButton', 'sap/ui/core/TextAlign', 'sap/m/ScreenSize', 'sap/m/PopinDisplay', 'sap/m/Column', 'sap/m/Text', 'sap/m/Bar', 'sap/m/Table', 'sap/m/Page', 'sap/m/PlacementType', 'sap/m/ButtonType', 'sap/m/OverflowToolbar', 'sap/m/OverflowToolbarLayoutData', 'sap/m/Toolbar', 'sap/m/ToolbarSpacer', 'sap/m/Button', 'sap/m/CheckBox', 'sap/m/Dialog', 'sap/m/Input', 'sap/m/Title', 'sap/m/Label', 'sap/m/ResponsivePopover', 'sap/m/SelectList', 'sap/m/ObjectIdentifier', 'sap/ui/comp/library', './EditableVariantItem', './VariantItem', 'sap/ui/core/InvisibleText', 'sap/ui/core/Control', 'sap/ui/core/Icon', 'sap/ui/core/Item', 'sap/ui/core/ValueState', 'sap/ui/core/VerticalAlign', 'sap/ui/layout/HorizontalLayout', 'sap/ui/layout/Grid'
], function(jQuery, Device, JSONModel, VBox, SearchField, RadioButton, TextAlign, ScreenSize, PopinDisplay, Column, Text, Bar, Table, Page, PlacementType, ButtonType, OverflowToolbar, OverflowToolbarLayoutData, Toolbar, ToolbarSpacer, Button, CheckBox, Dialog, Input, Title, Label, ResponsivePopover, SelectList, ObjectIdentifier, library, EditableVariantItem, VariantItem, InvisibleText, Control, Icon, Item, ValueState, VerticalAlign, HorizontalLayout, Grid) {
	"use strict";

	/**
	 * Constructor for a new VariantManagement.
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The VariantManagement control can be used to manage variants, such as filter bar variants or table variants.
	 * @extends sap.ui.core.Control
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.variants.VariantManagement
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var VariantManagement = Control.extend("sap.ui.comp.variants.VariantManagement", /** @lends sap.ui.comp.variants.VariantManagement.prototype */
	{
		metadata: {
			library: "sap.ui.comp",
			designTime: true,
			properties: {

				/**
				 * Enables the setting of the initially selected variant.
				 * @since 1.22.0
				 */
				initialSelectionKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Can be set to true or false depending on whether you want to enable or disable the control.
				 * @since 1.22.0
				 */
				enabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Provides a string value to set the default variant. Used for the save dialog. Has no effect on the selected variant.
				 * @since 1.22.0
				 */
				defaultVariantKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * The key of the currently selected item. Returns null if the default item list is selected.
				 * @since 1.24.0
				 */
				selectionKey: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Indicates that a Create Tile is visible in the Create dialog.
				 * @since 1.26.0
				 */
				showCreateTile: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that Execute on Selection is visible in the Save Variant and the Manage Variants dialogs.
				 * @since 1.26.0
				 */
				showExecuteOnSelection: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that Share is visible in the Save Variant and the Manage Variants dialogs. Share allows you to share variants with other
				 * users.
				 * @since 1.26.0
				 */
				showShare: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that set as default is visible in the Save Variant and the Manage Variants dialogs.
				 * @since 1.44.0
				 */
				showSetAsDefault: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				/**
				 * Enables the lifecycle support. If set to true, the VariantManagement control handles the transport information for shared variants.
				 * @since 1.26.0
				 */
				lifecycleSupport: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Overwrites the default Standard variant title.
				 * @since 1.28.0
				 */
				standardItemText: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to<code>true</code>, the scenario is an industry-specific solution. This flag is only used internally in the app variant
				 * scenarios.
				 * @since 1.32.0
				 */
				industrySolutionMode: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that the 'Favorites' feature is used. Only variants marked as favorites will be displayed in the variant list.
				 * @since 1.50.0
				 */
				useFavorites: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Indicates that the control is in error state. If set to <code>true</code> error message will be displayed whenever the variant is
				 * opened.
				 * @since 1.52.0
				 */
				inErrorState: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				}

			},
			defaultAggregation: "items",
			aggregations: {

				/**
				 * Items displayed by the <code>VariantManagement</code> control.
				 * @since 1.22.0
				 * @deprecated Since version 1.26.0. Replaced by association <code>variantItems</code>
				 */
				items: {
					type: "sap.ui.core.Item",
					multiple: true,
					singularName: "item",
					deprecated: true
				},

				/**
				 * Variant items displayed by the <code>VariantManagement</code> control.
				 * @since 1.26.0
				 */
				variantItems: {
					type: "sap.ui.comp.variants.VariantItem",
					multiple: true,
					singularName: "variantItem"
				}
			},
			events: {

				/**
				 * This event is fired when the Save Variant dialog is closed with OK for a variant.
				 * @since 1.22.0
				 */
				save: {
					parameters: {
						/**
						 * The variant title
						 */
						name: {
							type: "string"
						},

						/**
						 * Indicates if an existing variant is overwritten or if a new variant is created
						 */
						overwrite: {
							type: "boolean"
						},

						/**
						 * The variant key
						 */
						key: {
							type: "string"
						},

						/**
						 * The Execute on Selection indicator
						 */
						exe: {
							type: "boolean"
						},

						/**
						 * The default variant indicator
						 */
						def: {
							type: "boolean"
						},

						/**
						 * The shared variant indicator
						 */
						global: {
							type: "boolean"
						},

						/**
						 * The package name
						 */
						lifecyclePackage: {
							type: "string"
						},

						/**
						 * The transport ID
						 */
						lifecycleTransportId: {
							type: "string"
						}
					}
				},

				/**
				 * This event is fired when users apply changes to variants in the Manage Variants dialog.
				 * @since 1.22.0
				 */
				manage: {
					parameters: {
						/**
						 * List of changed variant keys
						 */
						renamed: {
							type: "string[]"
						},

						/**
						 * List of deleted variant keys
						 */
						deleted: {
							type: "string[]"
						},

						/**
						 * List of variant keys and the associated Execute on Selection indicator
						 */
						exe: {
							type: "object[]"
						},

						/**
						 * The default variant key
						 */
						def: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event is fired when a new variant is selected.
				 * @since 1.22.0
				 */
				select: {
					parameters: {
						/**
						 * The variant key
						 */
						key: {
							type: "string"
						}
					}
				}
			}
		},
		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
		 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
		 */
		renderer: function(oRm, oControl) {
			oRm.write("<div ");
			oRm.writeControlData(oControl);
			oRm.addClass("sapUiCompVarMngmt");
			oRm.writeClasses();

			var mAccProps = {
				"labelledby": {
					value: oControl.oVariantInvisbletext.getId(),
					append: true
				}
			};

			oRm.writeAccessibilityState(oControl, mAccProps);

			var sTooltip = oControl.oResourceBundle.getText("VARIANT_MANAGEMENT_TRIGGER_TT");
			oRm.write(" title='" + sTooltip + "'");

			// oRm.write(" tabindex='0'>");
			oRm.write(">");
			oRm.renderControl(oControl.oVariantLayout);
			oRm.write("</div>");
		}
	});

	VariantManagement.STANDARD_NAME = sap.ui.comp.STANDARD_VARIANT_NAME;
	VariantManagement.MAX_NAME_LEN = 100;

	VariantManagement.FAV_COLUMN = 0;
	VariantManagement.NAME_COLUMN = 1;
	VariantManagement.SHARE_COLUMN = 2;
	VariantManagement.DEF_COLUMN = 3;
	VariantManagement.EXEC_COLUMN = 4;
	VariantManagement.AUTHOR_COLUMN = 5;

	/**
	 * Constructs and initializes the VariantManagement control.
	 */
	VariantManagement.prototype.init = function() {
		var that = this;

		this.STANDARDVARIANTKEY = "*standard*";
		this.setStandardVariantKey(this.STANDARDVARIANTKEY);
		this.aRemovedVariants = [];
		this.aRenamedVariants = [];
		this.aRemovedVariantTransports = [];
		this.aExeVariants = [];
		this.oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");
		this.lastSelectedVariantKey = this._sStandardVariantKey;
		this.bVariantItemMode = false;
		this.oSelectedItem = null;
		this.sNewDefaultKey = "";
		this.bManagementTableInitialized = false;
		this.sTransport = null;
		this.sPackage = null;
		this.aEvents = [];
		this.bEventRunning = false;
		this.oVariantSelectionPage = null;
		this.bManualVariantKey = false;
		this.bFireSelect = false;
		this.bExecuteOnSelectForStandardViaXML = false;
		this.bExecuteOnSelectForStandardByUser = null;
		this.bSupportExecuteOnSelectOnSandardVariant = false;
		this._bInnerControlsCreated = false;

		this._isVendorLayer = false;

		this.oModel = new JSONModel({
			enabled: false,
			selectedVariant: ""
		});
		this.setModel(this.oModel, "save_enablement");

		this.oVariantInvisbletext = new InvisibleText({
			text: {
				parts: [
					{
						path: 'save_enablement>/selectedVariant'
					}, {
						path: 'save_enablement>/enabled'
					}
				],
				formatter: function(sText, bValue) {
					if (bValue) {
						sText = that.oResourceBundle.getText("VARIANT_MANAGEMENT_SEL_VARIANT_MOD", [
							sText
						]);
					} else {
						sText = that.oResourceBundle.getText("VARIANT_MANAGEMENT_SEL_VARIANT", [
							sText
						]);
					}

					return sText;
				}
			}
		});

		this.oVariantText = new Title(this.getId() + "-text", {
			text: "{save_enablement>/selectedVariant}"
		});

		this._setStandardText();
		this.oVariantText.addStyleClass("sapUICompVarMngmtClickable");
		this.oVariantText.addStyleClass("sapUICompVarMngmtTitle");
		this.oVariantText.addStyleClass("sapMTitleStyleH4");

		if (Device.system.phone) {
			this.oVariantText.addStyleClass("sapUICompVarMngmtTextPhoneMaxWidth");
		} else {
			this.oVariantText.addStyleClass("sapUICompVarMngmtTextMaxWidth");
		}

		this.oVariantModifiedText = new Title(this.getId() + "-modified", {
			visible: "{save_enablement>/enabled}"
		});
		this.oVariantModifiedText.setText("*");
		this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtClickable");
		this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtModified");
		this.oVariantModifiedText.addStyleClass("sapMTitleStyleH4");

		this.oVariantPopoverTrigger = new Button(this.getId() + "-trigger", {
			icon: "sap-icon://slim-arrow-down",
			type: ButtonType.Transparent
		});

		this.oVariantPopoverTrigger.addAriaLabelledBy(this.oVariantInvisbletext);
		this.oVariantPopoverTrigger.addStyleClass("sapUICompVarMngmtTriggerBtn");
		this.oVariantPopoverTrigger.addStyleClass("sapMTitleStyleH4");

		this.oVariantLayout = new HorizontalLayout({
			content: [
				this.oVariantText, this.oVariantModifiedText, this.oVariantPopoverTrigger, this.oVariantInvisbletext
			]
		});
		this.oVariantLayout.addStyleClass("sapUICompVarMngmtLayout");

		this.addDependent(this.oVariantLayout);
	};

	VariantManagement.prototype._columnVisibilityManagementTable = function(nIdx, bFlag) {

		if (!this.bManagementTableInitialized) {
			return;
		}

		if (this.oManagementTable) {
			var aColumns = this.oManagementTable.getColumns();
			if (aColumns && aColumns.length >= nIdx) {
				aColumns[nIdx].setVisible(bFlag);
			}
		}
	};

	VariantManagement.prototype.setUseFavorites = function(bFlag) {
		this.setProperty("useFavorites", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.FAV_COLUMN, bFlag);
	};

	VariantManagement.prototype.setShowShare = function(bFlag) {
		this.setProperty("showShare", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.SHARE_COLUMN, bFlag);
	};

	VariantManagement.prototype.setShowSetAsDefault = function(bFlag) {
		this.setProperty("showSetAsDefault", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.DEF_COLUMN, bFlag);
	};

	VariantManagement.prototype.setShowExecuteOnSelection = function(bFlag) {
		this.setProperty("showExecuteOnSelection", bFlag);

		this._columnVisibilityManagementTable(VariantManagement.EXEC_COLUMN, bFlag);
	};

	VariantManagement.prototype.setStandardItemText = function(sName) {
		this.setProperty("standardItemText", sName);

		var oItem = this._getSelectedItem();
		if (!oItem || (oItem.getKey() === this.getStandardVariantKey())) {
			this.oModel.setProperty("/selectedVariant", sName);
		}

	};

	VariantManagement.prototype._triggerSave = function() {
		var oEvent = this._createEvent("variantSaveAs", this._handleVariantSaveAs);
		this._addEvent(oEvent);
	};

	VariantManagement.prototype._checkNameValidity = function(oInputField, sValue, oManagementTable) {
		var bInError = false;
		if (oManagementTable && this._getVariantNamesAndKeys) {

			var mMap = this._getVariantNamesAndKeys();
			var aItems = oManagementTable.getItems();
			aItems.forEach(function(oItem) {
				var oInput = oItem.getCells()[VariantManagement.NAME_COLUMN];
				var sKey = oItem.getKey();
				if (oInput.getValue && mMap.hasOwnProperty(oInput.getValue()) && (mMap[oInput.getValue()] !== sKey)) {
					oInput.setValueState(ValueState.Error);
					oInput.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_DUPLICATE"));
					bInError = true;
				}
			}.bind(this));
		}

		return bInError;
	};

	VariantManagement.prototype._checkVariantNameConstraints = function(oInputField, oSaveButton, oManagementTable) {
		var bErrorUniqueName = false;

		if (!oInputField) {
			return;
		}

		var sValue = oInputField.getValue().trim();

		if (!this._checkIsDuplicate(oInputField, sValue, this.oManagementTable)) {
			if (sValue === "") {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_EMPTY"));
			} else if (sValue.indexOf('{') > -1) {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_NOT_ALLOWED_CHAR", [
					"{"
				]));
			} else if (sValue.length > VariantManagement.MAX_NAME_LEN) {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_MAX_LEN", [
					VariantManagement.MAX_NAME_LEN
				]));
			} else {
				oInputField.setValueState(ValueState.None);
				oInputField.setValueStateText(null);
			}
		}

		if (oSaveButton) {

			if (oInputField.getValueState() !== ValueState.Error) {
				this._checkIsDuplicate(oInputField, sValue, oManagementTable);
			}

			if (oManagementTable && this._getVariantNamesAndKeys) {
				bErrorUniqueName = this._checkNameValidity(oInputField, sValue, oManagementTable);
			}

			if (bErrorUniqueName || (oInputField.getValueState() === ValueState.Error) || this._anyInErrorState(oManagementTable)) {
				oSaveButton.setEnabled(false);
			} else {
				oSaveButton.setEnabled(true);
			}
		}
	};

	VariantManagement.prototype._anyInErrorState = function(oManagementTable, oInputField) {
		var oItems, oInput, i;

		if (oManagementTable) { //
			oItems = oManagementTable.getItems();
			if (oItems) {
				for (i = 0; i < oItems.length; i++) {
					oInput = oItems[i].getCells()[VariantManagement.NAME_COLUMN];

					if (oInputField && (oInputField === oInput)) {
						continue;
					}

					if (oInput && oInput.getValueState && (oInput.getValueState() === ValueState.Error)) {
						if (this._checkIsDuplicate(oInput, oInput.getValue(), oManagementTable)) {
							return true;
						}
					}
				}
			}
		}

		return false;
	};

	VariantManagement.prototype._checkIsDuplicate = function(oInputField, sValue, oManagementTable) {

		var bFlag = this._isDuplicate(oInputField, sValue, oManagementTable);

		if (bFlag) {
			oInputField.setValueState(ValueState.Error);
			oInputField.setValueStateText(this.oResourceBundle.getText(sValue ? "VARIANT_MANAGEMENT_ERROR_DUPLICATE" : "VARIANT_MANAGEMENT_ERROR_EMPTY"));
		} else {
			oInputField.setValueState(ValueState.None);
			oInputField.setValueStateText(null);
		}

		return bFlag;
	};

	VariantManagement.prototype._isDuplicate = function(oInputField, sValue, oManagementTable) {
		if (oManagementTable) {
			return this._isDuplicateManaged(oInputField, sValue, oManagementTable);
		} else {
			return this._isDuplicateSaveAs(sValue);
		}
	};

	VariantManagement.prototype._isDuplicateManaged = function(oInputField, sValue, oManagementTable) {
		var oItems, oInput, i;

		if (oManagementTable) { //
			oItems = oManagementTable.getItems();
			if (oItems && (oItems.length > 0)) {
				for (i = 0; i < oItems.length; i++) {
					oInput = oItems[i].getCells()[VariantManagement.NAME_COLUMN];

					if (oInput === oInputField) {
						continue;
					}

					if (oInput) {
						if (oInput.getValue && (sValue === oInput.getValue().trim())) {
							return true;
						} else if (oInput.getText && (sValue === oInput.getText().trim())) {
							return true;
						} else if (oInput.getTitle && (sValue === oInput.getTitle().trim())) {
							return true;
						}
					}
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (this._isIndustrySolutionModeAndVendorLayer() && this.bManualVariantKey) {
					return false;
				}
				/* eslint-enable no-lonely-if */
			}
		}

		return false;
	};

	VariantManagement.prototype._isDuplicateSaveAs = function(sValue) {
		var sTrimName = sValue.trim();
		if (!sTrimName) {
			return true;
		}

		var sText = this._determineStandardVariantName();
		if (sText === sTrimName) {
			if (this._isIndustrySolutionModeAndVendorLayer() && this.bManualVariantKey) {
				return false;
			}
			return true;
		}

		var oItems = this._getItems();
		for (var iCount = 0; iCount < oItems.length; iCount++) {
			sText = oItems[iCount].getText().trim();
			if (sText === sTrimName) {
				return true;
			}
		}

		return false;
	};

	VariantManagement.prototype._createSaveDialog = function() {
		var that = this;

		// this.oSaveSave.setEnabled(false);

		var sValue = this.oInputName ? this.oInputName.getValue() : "";
		this.oSaveSave.setEnabled(!this._isDuplicate(this.oInputName, sValue));

		if (!this.oSaveDialog) {

			this.oSaveDialog = new Dialog(this.getId() + "-savedialog", {
				title: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVEDIALOG"),
				beginButton: this.oSaveSave,
				endButton: new Button(this.getId() + "-variantcancel", {
					text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_CANCEL"),
					press: function() {
						that._bSaveCanceled = true;
						that.oSaveDialog.close();
					}
				}),
				content: [
					this.oLabelName, this.oInputName, this.oLabelKey, this.oInputKey, this.oSaveDialogOptionsGrid
				],
				stretch: Device.system.phone
			});
			this.oSaveDialog.setParent(this);
			this.oSaveDialog.addStyleClass("sapUiPopupWithPadding");
			this.oSaveDialog.addStyleClass("sapUiCompVarMngmtSaveDialog");
		}
	};

	VariantManagement.prototype._createManagementDialog = function() {
		var that = this;

		if (!this.oManagementDialog) {
			this.oManagementDialog = new Dialog(this.getId() + "-managementdialog", {
				beginButton: this.oManagementSave,
				endButton: new Button(this.getId() + "-managementcancel", {
					text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_CANCEL"),
					press: function() {
						that.aRemovedVariants = [];
						that.oManagementDialog.close();
					}
				}),
				content: [
					this.oManagementTable
				],
				stretch: Device.system.phone,
				afterClose: function() {
					if (that.bFireSelect == true) {
						that.bFireSelect = false;
						setTimeout(function() {
							that._fireSelectAsync();
						}, 0);
					}
				}
			});
			this.oManagementDialog.setParent(this);

			this.oManagementDialog.setTitle(this.oResourceBundle.getText("VARIANT_MANAGEMENT_MANAGEDIALOG"));
			var oSubHeader = new Bar();
			this.oManageDialogSearchField = new SearchField();

			this.oManageDialogSearchField.attachLiveChange(function(oEvent) {
				this._triggerSearchInManageDialog(oEvent);
			}.bind(this));

			oSubHeader.addContentRight(this.oManageDialogSearchField);
			this.oManagementDialog.setSubHeader(oSubHeader);

		}
	};

	VariantManagement.prototype._handleArrowUpDown = function(oList, oSearch) {

		var sItemId = null;
		var that = this;

		oList.attachBrowserEvent("keydown", function(e) {
			if (e.which === 38) { // UP
				if (that.oVariantSelectionPage.getShowSubHeader()) {
					sItemId = document.activeElement.id;
				}
			}
		});

		oList.attachBrowserEvent("keyup", function(e) {
			if (e.which === 38) { // UP
				if (sItemId && (sItemId === document.activeElement.id)) {
					var aItems = oList.getItems();
					if (aItems && aItems.length > 0) {
						var oItem = sap.ui.getCore().byId(sItemId);
						if (oItem === aItems[0]) {
							oSearch.focus();
						}
					}
				}

				sItemId = null;
			}
		});

		oSearch.attachBrowserEvent("keyup", function(e) {
			if (e.which === 40) { // DOWN
				var aItems = oList.getItems();
				if (aItems && aItems.length > 0) {
					aItems[0].focus();
				}
			}
		});
	};

	VariantManagement.prototype._triggerSearch = function(oEvent) {

		if (!oEvent) {
			return;
		}

		var parameters = oEvent.getParameters();
		if (!parameters) {
			return;
		}

		this._restoreCompleteList();

		var sValue = parameters.newValue ? parameters.newValue : "";

		this._triggerSearchByValue(sValue.toLowerCase());
	};

	VariantManagement.prototype._triggerSearchByValue = function(sValue) {
		var sText, sKey, oVariantListItem;

		this.oSelectedVariantItemKey = null;

		oVariantListItem = this.oVariantList.getItemByKey(this.getStandardVariantKey());
		if (oVariantListItem && (oVariantListItem.getText().toLowerCase().indexOf(sValue) < 0)) {

			if (this.getSelectionKey() === sKey) {
				this.oSelectedVariantItemKey = sKey;
			}
			this.oVariantList.removeItem(oVariantListItem);

			oVariantListItem.destroy();
		}

		var oItems = this._getItems();
		for (var iCount = 0; iCount < oItems.length; iCount++) {
			sText = oItems[iCount].getText();

			if (sText.toLowerCase().indexOf(sValue) < 0) {
				sKey = oItems[iCount].getKey();
				oVariantListItem = this.oVariantList.getItemByKey(sKey);
				if (oVariantListItem) {

					if (this.getSelectionKey() === sKey) {
						this.oSelectedVariantItemKey = sKey;
					}
					this.oVariantList.removeItem(oVariantListItem);

					oVariantListItem.destroy();
				}
			}
		}
	};

	VariantManagement.prototype._triggerSearchInManageDialog = function(oEvent) {
		var sValue, bNoMatch, sColumnValue = "", oCell, aCells;

		if (!oEvent) {
			return;
		}

		var parameters = oEvent.getParameters();
		if (!parameters) {
			return;
		}

		sValue = parameters.newValue ? parameters.newValue.toLowerCase() : "";

		if (this.oManagementTable) {
			var aVariants = this.oManagementTable.getItems();
			aVariants.forEach(function(oRow) {
				bNoMatch = true;
				sColumnValue = "";
				aCells = oRow.getCells();
				if (aCells && aCells[VariantManagement.NAME_COLUMN]) {

					oCell = aCells[VariantManagement.NAME_COLUMN];
					if (oCell.getTitle) {
						sColumnValue = oCell.getTitle();
					} else if (oCell.getValue) {
						sColumnValue = oCell.getValue();
					}

					if (sColumnValue.toLowerCase().indexOf(sValue) >= 0) {
						bNoMatch = false;
					}
				}

				if (bNoMatch && aCells && aCells[VariantManagement.AUTHOR_COLUMN]) {
					oCell = aCells[VariantManagement.AUTHOR_COLUMN];
					if (oCell.getText) {
						sColumnValue = oCell.getText();
						if (sColumnValue.toLowerCase().indexOf(sValue) >= 0) {
							bNoMatch = false;
						}
					}
				}

				oRow.setVisible(!bNoMatch);

			});

		}

	};

	VariantManagement.prototype._considerItem = function(bIgnoreFavorites, oItem) {

		if (this.getUseFavorites() && !bIgnoreFavorites) {

			if (this._isIndustrySolutionModeAndVendorLayer()) {
				return true;
			}

			if (oItem.getFavorite && oItem.getFavorite()) {
				return true;
			}

// if (this.oSelectedVariantItemKey) {
// if (this.oSelectedVariantItemKey === oItem.getKey()) {
// return true;
// }
// } else {
// /* eslint-disable no-lonely-if */
// if (this.getSelectionKey() === oItem.getKey() || this.getSelectionKey() === null) {
// return true;
// /* eslint-enable no-lonely-if */
// }
// }

			return false;

		}

		return true;
	};

	VariantManagement.prototype._restoreCompleteList = function(bIgnoreFavorites) {
		var iCount, oItem, oItems, oVariantListItem;

		this.oVariantList.destroyItems();

		oVariantListItem = this.oVariantList.getItemByKey(this.getStandardVariantKey());
		if (!oVariantListItem) {
			oVariantListItem = this._createStandardVariantListItem();
			if (oVariantListItem) {
				if (this._considerItem(bIgnoreFavorites, oVariantListItem)) {
					this.oVariantList.insertItem(oVariantListItem, 0);
				} else {
					oVariantListItem.destroy();
				}
			}
		}

		if (oVariantListItem) {
			if (this.oSelectedVariantItemKey) {
				if (this.oSelectedVariantItemKey === oVariantListItem.getKey()) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					this.oSelectedVariantItemKey = null;
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (this.getSelectionKey() == oVariantListItem.getKey() || this.getSelectionKey() === null) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					/* eslint-enable no-lonely-if */
				}
			}
		}

		oItems = this._getItems();
		oItems.sort(this._compareItems);
		for (iCount = 0; iCount < oItems.length; iCount++) {
			oItem = oItems[iCount];

			if (!this._considerItem(bIgnoreFavorites, oItem)) {
				continue;
			}

			if (oItem.getKey() === this.getStandardVariantKey()) {
				continue;
			}

			oVariantListItem = this.oVariantList.getItemByKey(oItem.getKey());
			if (!oVariantListItem) {
				oVariantListItem = this._createVariantListItem(oItem, iCount);
				this.oVariantList.addItem(oVariantListItem);
			}

			if (this.oSelectedVariantItemKey) {
				if (this.oSelectedVariantItemKey === oVariantListItem.getKey()) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					this.oSelectedVariantItemKey = null;
				}
			} else {
				/* eslint-disable no-lonely-if */
				if (this.getSelectionKey() == oVariantListItem.getKey()) {
					this.oVariantList.setSelectedItem(oVariantListItem);
					/* eslint-enable no-lonely-if */
				}
			}

		}
	};

	VariantManagement.prototype._determineStandardVariantName = function() {

		var sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD");

		if (this.bVariantItemMode === false) {
			sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT");
		}

		if (this.getStandardVariantKey() === this.STANDARDVARIANTKEY) {
			if (this.getStandardItemText() !== null && this.getStandardItemText() != "") {
				sText = this.getStandardItemText();
			}
		}

		return sText;

	};

	VariantManagement.prototype._createStandardVariantListItem = function() {
		var oItem, oVariantListItem = null;

		var sText = this._determineStandardVariantName();

		if ((this.bVariantItemMode === true) || (this.bVariantItemMode === false && (this.getSelectionKey() === this.getStandardVariantKey() || this.getSelectionKey() === null))) {

			oVariantListItem = new VariantItem(this.oVariantPopoverTrigger.getId() + "-item-standard", {
				key: this.getStandardVariantKey(),
				// text: sText, // issue with curly brackets
				readOnly: true, // !this.getIndustrySolutionMode(),
				executeOnSelection: this.getExecuteOnSelectForStandardVariant()
			});
			oVariantListItem.setText(sText);

			if (this._isIndustrySolutionModeAndVendorLayer() && this.bVariantItemMode) {
				oVariantListItem.setGlobal(true);
				oVariantListItem.setReadOnly(false); // in vendor layer a change should be possible
			}

			if (this.getStandardVariantKey() !== this.STANDARDVARIANTKEY) {
				oItem = this.getItemByKey(this.getStandardVariantKey());
				if (oItem) {
					this._setVariantListItemProperties(oItem, oVariantListItem);
					// oVariantListItem.setReadOnly(true);
				}
			} else {
				oVariantListItem.setAuthor("SAP");

				oVariantListItem.setFavorite(this.getStandardFavorite());
			}
		}

		return oVariantListItem;
	};

	VariantManagement.prototype._createVariantListItem = function(oItem, iCount) {
		var oVariantListItem = new VariantItem(this.oVariantPopoverTrigger.getId() + "-item-" + iCount, {
			key: oItem.getKey(),
			text: oItem.getText()
		// leads to issues if curly brackets are added
		});

		// oVariantListItem.setText(oItem.getText());

		this._setVariantListItemProperties(oItem, oVariantListItem);

		return oVariantListItem;
	};

	VariantManagement.prototype._setVariantListItemProperties = function(oItem, oVariantListItem) {
		if (oItem.getReadOnly) {
			oVariantListItem.setReadOnly(oItem.getReadOnly());
		}
		if (oItem.getExecuteOnSelection) {
			oVariantListItem.setExecuteOnSelection(oItem.getExecuteOnSelection());
		}
		if (oItem.getGlobal) {
			oVariantListItem.setGlobal(oItem.getGlobal());
		}
		if (oItem.getLifecyclePackage) {
			oVariantListItem.setLifecyclePackage(oItem.getLifecyclePackage());
		}
		if (oItem.getLifecycleTransportId) {
			oVariantListItem.setLifecycleTransportId(oItem.getLifecycleTransportId());
		}
		if (oItem.getNamespace) {
			oVariantListItem.setNamespace(oItem.getNamespace());
		}
		if (oItem.getAccessOptions) {
			oVariantListItem.setAccessOptions(oItem.getAccessOptions());
		}
		if (oItem.getLabelReadOnly) {
			oVariantListItem.setLabelReadOnly(oItem.getLabelReadOnly());
		}
		if (oItem.getAuthor) {
			oVariantListItem.setAuthor(oItem.getAuthor());
		}
		if (oItem.getFavorite) {
			oVariantListItem.setFavorite(oItem.getFavorite());
		}
	};

	// exit destroy all controls created in init
	VariantManagement.prototype.exit = function() {

		if (this.oSearchField) {
			this.oSearchField.destroy();
			this.oSearchField = undefined;
		}
		if (this.oManageDialogSearchField) {
			this.oManageDialogSearchField.destroy();
			this.oManageDialogSearchField = undefined;
		}

		if (this.oVariantManage) {
			this.oVariantManage.destroy();
			this.oVariantManage = undefined;
		}
		if (this.oVariantSave) {
			this.oVariantSave.destroy();
			this.oVariantSave = undefined;
		}
		if (this.oVariantList) {
			this.oVariantList.destroy();
			this.oVariantList = undefined;
		}
		if (this.oInputName) {
			this.oInputName.destroy();
			this.oInputName = undefined;
		}
		if (this.oLabelName) {
			this.oLabelName.destroy();
			this.oLabelName = undefined;
		}
		if (this.oDefault) {
			this.oDefault.destroy();
			this.oDefault = undefined;
		}
		if (this.oSaveSave) {
			this.oSaveSave.destroy();
			this.oSaveSave = undefined;
		}
		if (this.oSaveDialog) {
			this.oSaveDialog.destroy();
			this.oSaveDialog = undefined;
		}
		if (this.oManagementTable) {
			this.oManagementTable.destroy();
			this.oManagementTable = undefined;
		}
		if (this.oManagementSave) {
			this.oManagementSave.destroy();
			this.oManagementSave = undefined;
		}
		if (this.oManagementDialog) {
			this.oManagementDialog.destroy();
			this.oManagementDialog = undefined;
		}
		if (this.oVariantText) {
			this.oVariantText.destroy();
			this.oVariantText = undefined;
		}
		if (this.oVariantPopoverTrigger) {
			this.oVariantPopoverTrigger.destroy();
			this.oVariantPopoverTrigger = undefined;
		}
		if (this.oVariantLayout) {
			this.oVariantLayout.destroy();
			this.oVariantLayout = undefined;
		}
		if (this.oVariantPopOver) {
			this.oVariantPopOver.destroy();
			this.oVariantPopOver = undefined;
		}
		if (this.oVariantSaveAs) {
			this.oVariantSaveAs.destroy();
			this.oVariantSaveAs = undefined;
		}
		if (this.oShare) {
			this.oShare.destroy();
			this.oShare = undefined;
		}
		if (this.oExecuteOnSelect) {
			this.oExecuteOnSelect.destroy();
			this.oExecuteOnSelect = undefined;
		}
		if (this.oCreateTile) {
			this.oCreateTile.destroy();
			this.oCreateTile = undefined;
		}
		if (this.oSaveDialogOptionsGrid) {
			this.oSaveDialogOptionsGrid.destroy();
			this.oSaveDialogOptionsGrid = undefined;
		}
		if (this.oVariantSelectionPage) {
			this.oVariantSelectionPage.destroy();
			this.oVariantSelectionPage = undefined;
		}
		if (this.oErrorVariantPopOver) {
			this.oErrorVariantPopOver.destroy();
			this.oErrorVariantPopOver = undefined;
		}

		if (this.oInputKey) {
			this.oInputKey.destroy();
			this.oInputKey = undefined;
		}
		if (this.oLabelKey) {
			this.oLabelKey.destroy();
			this.oLabelKey = undefined;
		}

		if (this.oModel) {
			this.oModel.destroy();
			this.oModel = undefined;
		}
	};

	VariantManagement.prototype.addItem = function(oItem) {
		oItem = this.validateAggregation("items", oItem, true);
		this.bVariantItemMode = false;
		this.addAggregation("items", oItem, false);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oItem, _sKey);
		this._setStandardText();
		return this;
	};

	VariantManagement.prototype.insertItem = function(oItem, iIndex) {
		var _iIndex = iIndex;
		oItem = this.validateAggregation("items", oItem, true);
		this.bVariantItemMode = false;
		this.insertAggregation("items", oItem, _iIndex);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oItem, _sKey);
		this._setStandardText();
		return this;
	};

	VariantManagement.prototype.removeItem = function(oItem) {
		oItem = this.removeAggregation("items", oItem);
		return oItem;
	};

	VariantManagement.prototype.removeAllItems = function() {
		var ret = this.removeAllAggregation("items");
		this._setSelectedItem(null);
		return ret;
	};

	VariantManagement.prototype.destroyItems = function() {
		this.destroyAggregation("items");
		this._setSelectedItem(null);
		return this;
	};

	VariantManagement.prototype._getItems = function() {
		if (this.bVariantItemMode) {
			return this.getVariantItems();
		} else {
			return this.getItems();
		}
	};

	VariantManagement.prototype._removeItem = function(oItem) {
		if (this.bVariantItemMode) {
			return this.removeVariantItem(oItem);
		} else {
			return this.removeItem(oItem);
		}
	};

	VariantManagement.prototype.getItemByKey = function(sKey) {
		var oItems = this._getItems();
		for (var iCount = 0; iCount < oItems.length; iCount++) {
			if (sKey == oItems[iCount].getKey()) {
				return oItems[iCount];
			}
		}
		return null;
	};

	VariantManagement.prototype.addVariantItem = function(oVariantItem) {
		oVariantItem = this.validateAggregation("variantItems", oVariantItem, true);
		this.bVariantItemMode = true;
		this.addAggregation("variantItems", oVariantItem, false);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oVariantItem, _sKey);
		this._setStandardText();
		return this;
	};

	VariantManagement.prototype.insertVariantItem = function(oVariantItem, iIndex) {
		var _iIndex = iIndex;
		oVariantItem = this.validateAggregation("variantItems", oVariantItem, true);
		this.bVariantItemMode = true;
		this.insertAggregation("variantItems", oVariantItem, _iIndex);
		var _sKey = this.getInitialSelectionKey();
		this._setSelection(oVariantItem, _sKey);
		this._setStandardText();
		return this;
	};

	VariantManagement.prototype._setSelectedItem = function(oItem) {
		this.oSelectedItem = oItem;
		// when standard variant comes from SmartVariant Management texts from other languages overrule the translation of "Standard"
		if (oItem != null && oItem.getKey() != this.getStandardVariantKey()) {
			this._setVariantText(oItem.getText());
		} else {
			this._setStandardText();
		}
	};

	VariantManagement.prototype._getSelectedItem = function() {
		return this.oSelectedItem;
	};

	VariantManagement.prototype.setInitialSelectionKey = function(sKey) {
		this.setProperty("initialSelectionKey", sKey, true); // do not re-render !
		this._setSelectionByKey(sKey);
		return this;
	};

	VariantManagement.prototype.setEnabled = function(bEnabled) {
		this.setProperty("enabled", bEnabled, false);

		if (!bEnabled) {
			this.oVariantText.removeStyleClass("sapUICompVarMngmtClickable");
			this.oVariantModifiedText.removeStyleClass("sapUICompVarMngmtClickable");
			this.oVariantText.addStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtDisabled");

			// this.oVariantLayout.removeStyleClass("sapUICompVarMngmtLayout");
		} else {
			this.oVariantText.removeStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantModifiedText.removeStyleClass("sapUICompVarMngmtDisabled");
			this.oVariantText.addStyleClass("sapUICompVarMngmtClickable");
			this.oVariantModifiedText.addStyleClass("sapUICompVarMngmtClickable");

			// this.oVariantLayout.addStyleClass("sapUICompVarMngmtLayout");
		}
		return this;
	};

	VariantManagement.prototype.getFocusDomRef = function() {
		if (this.oVariantPopoverTrigger && this.getEnabled()) {
			return this.oVariantPopoverTrigger.getFocusDomRef();
		}

		// return sap.ui.core.Element.prototype.getFocusDomRef.apply(this, []);
	};

	/**
	 * The string given as "sKey" will be used to set the initial selected item of the <code>VariantManagement</code>. If an item exists with the
	 * matching key the item will be marked as selected If the key is set before any items are added the <code>VariantManagement</code> will try to
	 * set the selection when the items are added in "addItem" or "insterItem".
	 * @param {sap.ui.core.Item} oItem the Item to be compared
	 * @param {string} sKey the string used to be compared with the item's key attribute
	 */
	VariantManagement.prototype._setSelection = function(oItem, sKey) {
		if (oItem.getKey() === sKey) {
			this._setSelectedItem(oItem);
			this.fireSelect({
				key: sKey
			});
		}
	};

	VariantManagement.prototype.addStyleClass = function(sStyleClass) {
		if (Control.prototype.addStyleClass) {
			Control.prototype.addStyleClass.apply(this, arguments);
		}
		if (this.oVariantPopOver) {
			this.oVariantPopOver.addStyleClass(sStyleClass);
		}
		if (this.oSaveDialog) {
			this.oSaveDialog.addStyleClass(sStyleClass);
		}
		if (this.oManagementDialog) {
			this.oManagementDialog.addStyleClass(sStyleClass);
		}
	};

	VariantManagement.prototype.removeStyleClass = function(sStyleClass) {
		if (Control.prototype.addStyleClass) {
			Control.prototype.removeStyleClass.apply(this, arguments);
		}
		if (this.oVariantPopOver) {
			this.oVariantPopOver.removeStyleClass(sStyleClass);
		}
		if (this.oSaveDialog) {
			this.oSaveDialog.removeStyleClass(sStyleClass);
		}
		if (this.oManagementDialog) {
			this.oManagementDialog.removeStyleClass(sStyleClass);
		}
	};

	/**
	 * Removes the current variant selection and resets to default value.
	 * @public
	 * @since 1.22.0
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	VariantManagement.prototype.clearVariantSelection = function() {
		this.setInitialSelectionKey(this.getStandardVariantKey());
		this._setSelectedItem(null);
	};

	/**
	 * If the oControl has the ".sapUiSizeCompact" class it will be also set on the oDialog
	 * @param {sap.ui.core.Control} oControl the control to be checked for compact
	 * @param {sap.ui.core.Control} oDialog the dialog/popover to receive the compact style class
	 */
	VariantManagement.prototype._setDialogCompactStyle = function(oControl, oDialog) {
		if (this._checkDialogCompactStyle(oControl)) {
			oDialog.addStyleClass("sapUiSizeCompact");
		} else {
			oDialog.removeStyleClass("sapUiSizeCompact");
		}
	};

	/**
	 * If the oControl has the ".sapUiSizeCompact" the function will return true
	 * @param {sap.ui.core.Control} oControl the control to be checked for compact
	 * @returns {boolean} result
	 */
	VariantManagement.prototype._checkDialogCompactStyle = function(oControl) {
		if (oControl.$().closest(".sapUiSizeCompact").length > 0) {
			return true;
		} else {
			return false;
		}
	};

	VariantManagement.prototype.getSelectionKey = function() {
		var sKey = null;
		var oItem = this._getSelectedItem();
		if (oItem !== null) {
			sKey = oItem.getKey();
		} else if (this.bVariantItemMode) {
			sKey = this.getStandardVariantKey();
		} else {
			sKey = null;
		}
		return sKey;
	};

	VariantManagement.prototype._setSelectionByKey = function(sKey) {
		var oItems = this._getItems();
		var bFound = false;
		if (oItems.length > 0) {
			for (var iI = 0; iI < oItems.length; iI++) {
				if (oItems[iI].getKey() === sKey) {
					this._setSelectedItem(oItems[iI]);
					bFound = true;
					break;
				}
			}
		}
		if (!bFound) {
			this._setSelectedItem(null);
		}
	};

	VariantManagement.prototype.replaceKey = function(sOldKey, sNewKey) {
		var oItems = this._getItems();
		if (oItems.length > 0) {
			for (var iI = 0; iI < oItems.length; iI++) {
				if (oItems[iI].getKey() === sOldKey) {
					oItems[iI].setKey(sNewKey);
					if (this.getDefaultVariantKey() == sOldKey) {
						this.setDefaultVariantKey(sNewKey);
					}
					if (this._getSelectedItem() === oItems[iI]) {
						this._setSelectedItem(null);
					}
					break;
				}
			}
		}
	};

	VariantManagement.prototype._assignUser = function(sKey, sUser) {
		var oItems = this._getItems();
		if (oItems.length > 0) {
			for (var iI = 0; iI < oItems.length; iI++) {
				if (oItems[iI].getKey() === sKey) {
					if (oItems[iI].setAuthor && oItems[iI].getAuthor && !oItems[iI].getAuthor()) {
						oItems[iI].setAuthor(sUser);
					}
					break;
				}
			}
		}
	};

	/**
	 * Sets the dirty flag of the current variant.
	 * @public
	 * @param {boolean} bFlag The value indicating the dirty state of the current variant
	 */
	VariantManagement.prototype.currentVariantSetModified = function(bFlag) {
		this.oModel.setProperty("/enabled", bFlag);
	};

	/**
	 * Gets the dirty flag of the current variant.
	 * @public
	 * @returns {boolean} The dirty state of the current variant
	 */
	VariantManagement.prototype.currentVariantGetModified = function() {
		return this.oModel.getProperty("/enabled");
	};

	VariantManagement.prototype._delayedControlCreation = function() {
		var that = this;

		if (this._bInnerControlsCreated) {
			return;
		}

		this._bInnerControlsCreated = true;

		this.oVariantManage = new Button(this.getId() + "-manage", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_MANAGE"),
			enabled: true, // FIORITECHP1-3572
			press: function() {
				that._openVariantManagementDialog();
			},
			layoutData: new OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.High
			})
		});

		this.oVariantSave = new Button(this.getId() + "-mainsave", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVE"),
			press: function() {
				var oEvent = that._createEvent("variantSavePressed", that._variantSavePressed);
				that._addEvent(oEvent);
			},
			enabled: false,
			layoutData: new OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.Low
			})
		});
		this.oVariantSave.setModel(this.oModel);

		this.oVariantSaveAs = new Button(this.getId() + "-saveas", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SAVEAS"),
			press: function() {
				that._openSaveAsDialog();
			},
			layoutData: new OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.Low
			})
		});

		this.oVariantList = new SelectList(this.getId() + "-list", {
			itemPress: function(event) {
				var sSelectionKey = null;
				if (event && event.getParameters()) {
					var oItemPressed = event.getParameters().item;
					if (oItemPressed) {
						sSelectionKey = oItemPressed.getKey();
// if (!this.getSelectedItem() || sSelectionKey !== this.getSelectedItem().getKey()) {
// bNewSelection = true;
// }
					}
				}
				if (sSelectionKey) {
					that.lastSelectedVariantKey = sSelectionKey;
					that._setSelectionByKey(sSelectionKey);
					that.oVariantPopOver.close();
// that.bDirty = false;
					that.oModel.setProperty("/enabled", false);
					that.bFireSelect = true;
				}
			}
		});
		this.oVariantList.setNoDataText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_NODATA"));

		this.oSearchField = new SearchField();
		this.oSearchField.attachLiveChange(function(oEvent) {
			that._triggerSearch(oEvent);
		});

		this._handleArrowUpDown(this.oVariantList, this.oSearchField);

		this.oVariantSelectionPage = new Page(this.getId() + "selpage", {
			subHeader: new Toolbar({
				content: [
					this.oSearchField
				]
			}),
			content: [
				this.oVariantList
			],
			footer: new OverflowToolbar({
				content: [
					new ToolbarSpacer(this.getId() + "-spacer"), this.oVariantSave, this.oVariantSaveAs, this.oVariantManage
				]
			}),
			showSubHeader: false,
			showNavButton: false,
			showHeader: false
		});
		this.oVariantPopOver = new ResponsivePopover(this.getId() + "-popover", {
			title: this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTS"),
			contentWidth: "400px",
			placement: PlacementType.Bottom,
			content: [
				this.oVariantSelectionPage
			],
			afterOpen: function() {
				that.bPopoverOpen = true;
				that._markSharedVariants();
			},
			afterClose: function() {
				if (that.bPopoverOpen) {
					setTimeout(function() {
						if (that.bFireSelect == true) {
							that.bFireSelect = false;
							that._fireSelectAsync();
						}
						that.bPopoverOpen = false;
					}, 200);
				}
			},
			contentHeight: "300px"
		});

		this.oVariantPopOver.setParent(this);

		this.oVariantPopOver.addStyleClass("sapUICompVarMngmtPopover");

		/* save new dialog */
		this.oInputName = new Input(this.getId() + "-name", {
			liveChange: function(oEvent) {
				that._checkVariantNameConstraints(this, that.oSaveSave);
			}
		});
		this.oLabelName = new Label(this.getId() + "-namelabel", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_NAME"),
			required: true
		});
		this.oLabelName.setLabelFor(this.oInputName);

		this.oDefault = new CheckBox(this.getId() + "-default", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SETASDEFAULT"),
			enabled: true,
			visible: true,
			width: "100%"
		});

		this.oExecuteOnSelect = new CheckBox(this.getId() + "-execute", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_EXECUTEONSELECT"),
			enabled: true,
			visible: false,
			width: "100%"
		});

		this.oCreateTile = new CheckBox(this.getId() + "-tile", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_CREATETILE"),
			enabled: true,
			visible: false,
			width: "100%"
		});

		this.oShare = new CheckBox(this.getId() + "-share", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_SHARE"),
			enabled: true,
			visible: false,
			select: function(oControlEvent) {
				var oEvent = that._createEvent("inputfieldChange", that._handleShareSelected);
				oEvent.args.push(oControlEvent);
				that._addEvent(oEvent);
			},
			width: "100%"
		});

		this.oInputKey = new Input(this.getId() + "-key", {
			liveChange: function(oEvent) {
				that._checkVariantNameConstraints(this);
			}
		});

		this.oLabelKey = new Label(this.getId() + "-keylabel", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_KEY"),
			required: true
		});
		this.oLabelKey.setLabelFor(this.oInputKey);

		this.oSaveSave = new Button(this.getId() + "-variantsave", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_OK"),
			press: function() {
				that._bSaveCanceled = false;
				that._triggerSave();
			},
			enabled: true
		});
		this.oSaveDialogOptionsGrid = new Grid({
			defaultSpan: "L12 M12 S12"
		});

		this.oManagementTable = new Table(this.getId() + "-managementTable");

		this.oManagementSave = new Button(this.getId() + "-managementsave", {
			text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_OK"),
			enabled: true,
			press: function() {
				var oEvent = that._createEvent("managementSave", that._handleManageSavePressed);
				that._addEvent(oEvent);
			}
		});

	};

	VariantManagement.prototype._openInErrorState = function() {
		var that = this, oVBox;

		if (!this.oErrorVariantPopOver) {

			oVBox = new VBox({
				fitContainer: true,
				alignItems: sap.m.FlexAlignItems.Center,
				items: [
					new Icon({
						size: "4rem",
						color: "lightgray",
						src: "sap-icon://message-error"
					}), new Title({
						titleStyle: sap.ui.core.TitleLevel.H2,
						text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_TEXT1")
					}), new sap.m.Text({
						textAlign: sap.ui.core.TextAlign.Center,
						text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_TEXT2")
					})
				]
			});

			oVBox.addStyleClass("sapUICompVarMngmtErrorPopover");

			this.oErrorVariantPopOver = new ResponsivePopover(this.getId() + "-errorpopover", {
				title: this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTS"),
				contentWidth: "400px",
				placement: PlacementType.Bottom,
				content: [
					new Page(this.getId() + "-errorselpage", {
						showSubHeader: false,
						showNavButton: false,
						showHeader: false,
						content: [
							oVBox
						]
					})
				],
				afterOpen: function() {
					that.bPopoverOpen = true;
				},
				afterClose: function() {
					if (that.bPopoverOpen) {
						setTimeout(function() {
							that.bPopoverOpen = false;
						}, 200);
					}
				},
				contentHeight: "300px"
			});

			this.oErrorVariantPopOver.attachBrowserEvent("keyup", function(e) {
				if (e.which === 32) { // UP
					this.oErrorVariantPopOver.close();
				}
			}.bind(this));
		}

		if (this.bPopoverOpen) {
			return;
		}

		this.oErrorVariantPopOver.openBy(this.oVariantLayout);
	};

	VariantManagement.prototype._openVariantSelection = function() {

		var oItems = null, oSelectedItem;

		if (this.getInErrorState()) {
			this._openInErrorState();
			return;
		}

		this._delayedControlCreation();

		if (this.bPopoverOpen) {
			return;
		}

		this.oVariantSave.setEnabled(false);
		if (this.bVariantItemMode === false && this.getSelectionKey() !== null) {
			this.oVariantSave.setEnabled(true);
		}

		oItems = this._getItems();
		if (oItems.length < 9) {
			this.oVariantSelectionPage.setShowSubHeader(false);
		} else {
			this.oVariantSelectionPage.setShowSubHeader(true);
			this.oSearchField.setValue("");
		}

		this._restoreCompleteList();

		if (this.currentVariantGetModified()) {
			oSelectedItem = this.oVariantList.getItemByKey(this.getSelectionKey());
			if (oSelectedItem) {
				if (!oSelectedItem.getReadOnly() || (this._isIndustrySolutionModeAndVendorLayer() && (this.getStandardVariantKey() === oSelectedItem.getKey()))) {
					this.oVariantSave.setEnabled(true);
				}
			}
		}

		this.oVariantSaveAs.setEnabled(true);
// if (this._isIndustrySolutionModeAndVendorLayer() && (this.getStandardVariantKey() === this.getSelectionKey()) && (this.getStandardVariantKey() ===
// this.STANDARDVARIANTKEY)) {
// this.oVariantSaveAs.setEnabled(false);
// }

		if (this._isIndustrySolutionModeAndVendorLayer() && this.bManualVariantKey && (this.getStandardVariantKey() === this.STANDARDVARIANTKEY)) {
			this.oVariantSave.setEnabled(false);
			this.oVariantSaveAs.setEnabled(true);
		}

		this._setDialogCompactStyle(this, this.oVariantPopOver);

		oSelectedItem = this.oVariantList.getSelectedItem();
		if (oSelectedItem) {
			this.oVariantPopOver.setInitialFocus(oSelectedItem.getId());
		}

		this.oVariantPopOver.openBy(this.oVariantLayout);
	};

	VariantManagement.prototype.handleOpenCloseVariantPopover = function() {
		if (!this.bPopoverOpen) {
			this._openVariantSelection();
		} else if (this.oVariantPopOver && this.oVariantPopOver.isOpen()) {
			this.oVariantPopOver.close();
		} else if (this.getInErrorState() && this.oErrorVariantPopOver && this.oErrorVariantPopOver.isOpen()) {
			this.oErrorVariantPopOver.close();
		}
	};

	VariantManagement.prototype.onclick = function(oEvent) {
		if (this.getEnabled()) {
			if (this.oVariantPopoverTrigger && !this.bPopoverOpen) {
				this.oVariantPopoverTrigger.focus();
			}
			this.handleOpenCloseVariantPopover();
		}
	};

	VariantManagement.prototype.onkeydown = function(oEvent) {
		if (oEvent.which === jQuery.sap.KeyCodes.F4 || oEvent.which === jQuery.sap.KeyCodes.SPACE || oEvent.altKey === true && oEvent.which === jQuery.sap.KeyCodes.ARROW_UP || oEvent.altKey === true && oEvent.which === jQuery.sap.KeyCodes.ARROW_DOWN) {
			if (this.getEnabled()) {
				this._openVariantSelection();
			}
		}
	};

	VariantManagement.prototype._initalizeManagementTableColumns = function() {
		if (this.bManagementTableInitialized) {
			return;
		}

		var oAddColumn = new Column({
			width: "3rem",
			visible: this.getUseFavorites() && !this._isIndustrySolutionModeAndVendorLayer()
		});

		this.oManagementTable.addColumn(oAddColumn);

		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_NAME")
			}),
			width: "14rem"
		}));

		// if (this.getShowShare()) {
		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_VARIANTTYPE")
			}),
			width: "8rem",
			demandPopin: true,
			popinDisplay: PopinDisplay.Inline,
			minScreenWidth: ScreenSize.Tablet,
			visible: this.getShowShare()
		}));
		// }

		// if (this.getShowSetAsDefault()) {
		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT")
			}),
			width: "4rem",
			demandPopin: true,
			popinDisplay: PopinDisplay.Inline,
			minScreenWidth: ScreenSize.Tablet,
			visible: this.getShowSetAsDefault()
		}));
		// }
		// if (this.getShowExecuteOnSelection()) {
		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_EXECUTEONSELECT")
			}),
			width: "5rem",
			hAlign: TextAlign.Center,
			demandPopin: true,
			popinDisplay: PopinDisplay.Inline,
			minScreenWidth: "800px",
			visible: this.getShowExecuteOnSelection()
		}));
		// }
		this.oManagementTable.addColumn(new Column({
			header: new Text({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_AUTHOR")
			}),
			width: "8rem",
			demandPopin: true,
			popinDisplay: PopinDisplay.Inline,
			minScreenWidth: "900px"
		}));
		this.oManagementTable.addColumn(new Column({
			width: "2rem",
			hAlign: TextAlign.Center
		}));
		this.bManagementTableInitialized = true;
	};

	VariantManagement.prototype._initalizeSaveAsDialog = function() {
		this.oSaveDialogOptionsGrid.removeAllContent();

		this.oDefault.setVisible(this.getShowSetAsDefault());
		this.oShare.setVisible(this.getShowShare());
		this.oExecuteOnSelect.setVisible(this.getShowExecuteOnSelection());
		this.oCreateTile.setVisible(this.getShowCreateTile());

		if (this.getShowSetAsDefault()) {
			this.oSaveDialogOptionsGrid.addContent(this.oDefault);
		}
		if (this.getShowShare()) {
			this.oSaveDialogOptionsGrid.addContent(this.oShare);
		}
		if (this.getShowExecuteOnSelection()) {
			this.oSaveDialogOptionsGrid.addContent(this.oExecuteOnSelect);
		}
		if (this.getShowCreateTile()) {
			this.oSaveDialogOptionsGrid.addContent(this.oCreateTile);
		}
	};

	VariantManagement.prototype.onAfterRendering = function() {

		this.oVariantText.$().off("mouseover").on("mouseover", function() {
			this.oVariantPopoverTrigger.addStyleClass("sapUICompVarMngmtTriggerBtnHover");
		}.bind(this));
		this.oVariantText.$().off("mouseout").on("mouseout", function() {
			this.oVariantPopoverTrigger.removeStyleClass("sapUICompVarMngmtTriggerBtnHover");
		}.bind(this));
	};

	VariantManagement.prototype.onBeforeRendering = function() {
		var fGetMax = function(aContent) {
			var len, maxLength = 0;
			for (var i = 0; i < aContent.length; i++) {
				len = aContent[i].$().width();
				if (len > maxLength) {
					maxLength = len;
				}
			}

			return maxLength;
		};

		if (this.oSaveDialogOptionsGrid && this.oSaveDialog && this.oSaveDialog.getVisible()) {
			var aContent = this.oSaveDialogOptionsGrid.getContent();
			if (aContent && aContent.length > 0) {
				var widthGrid = this.oSaveDialogOptionsGrid.$().width();

				var widthLabel = fGetMax(aContent);

				var widthPaddingLeft = 32;
				var widthCB = 12;
				if (!this._checkDialogCompactStyle(this.oSaveDialog)) {
					widthPaddingLeft = 48;
					widthCB = 18;
				}

				if ((widthPaddingLeft + widthLabel + widthCB) > widthGrid / 2) {
					this.oSaveDialogOptionsGrid.setDefaultSpan("L12 M12 S12");
				}

			}
		}
	};

	VariantManagement.prototype._markSharedVariants = function() {

		var oVariantListItem, oItem, oItems = this._getItems();

		for (var i = 0; i < oItems.length; i++) {
			oItem = oItems[i];

			if (oItem.getGlobal && oItem.getGlobal()) {
				oVariantListItem = this.oVariantList.getItemByKey(oItem.getKey());
				if (oVariantListItem) {
					var oItemElement = oVariantListItem.$();
					if (oItemElement) {
						oItemElement.addClass("sapUiCompVarMngmtSharedVariant");
					}
				}
			}
		}
	};

	VariantManagement.prototype._variantSavePressed = function() {
		var oItem = this._getSelectedItem();

		if (!oItem) {
			if (this.getStandardVariantKey() === this.STANDARDVARIANTKEY) {

				oItem = new VariantItem({
					// text: this._determineStandardVariantName(), // issues with curly brackets
					key: this.STANDARDVARIANTKEY,
					global: this._isIndustrySolutionModeAndVendorLayer()
				});

				oItem.setText(this._determineStandardVariantName());
			} else {
				oItem = this.getItemByKey(this.getStandardVariantKey());
			}
		}

		var bDefault = false;
		if (this.getDefaultVariantKey() === oItem.getKey()) {
			bDefault = true;
		}

		if (oItem.getLifecyclePackage && oItem.getGlobal() == true) {
			var that = this;
			var fOkay = function(sPackage, sTransport) {
				that.oVariantPopOver.close();
				that.sPackage = sPackage;
				that.sTransport = sTransport;
				that.fireSave({
					name: oItem.getText(),
					overwrite: true,
					key: oItem.getKey(),
					def: bDefault,
					global: (that._isIndustrySolutionModeAndVendorLayer() && (that.getStandardVariantKey() === that.getStandardVariantKey())),
					lifecyclePackage: that.sPackage,
					lifecycleTransportId: that.sTransport
				});
				oItem.setLifecycleTransportId(that.sTransport);
				// that.bDirty = false;
				that.oModel.setProperty("/enabled", false);
				that._eventDone();
			};
			var fError = function(oResult) {
				that.sTransport = null;
				that.sPackage = null;
				that._cancelAllEvents();
			};
			this._assignTransport(oItem, fOkay, fError, this.oVariantText);
		} else {
			this.oVariantPopOver.close();
			this.fireSave({
				name: oItem.getText(),
				overwrite: true,
				key: oItem.getKey(),
				def: bDefault
			});
			this.oModel.setProperty("/enabled", false);
			this._eventDone();
		}
	};

	VariantManagement.prototype._assignTransport = function(oVariant, fOkay, fError, oControl) {
		var oObject = {
			type: "variant",
			name: "",
			namespace: ""
		};
		oObject["package"] = "";
		if (oVariant !== null) {
			oObject["package"] = oVariant.getLifecyclePackage();
			oObject["name"] = oVariant.getKey();
			oObject["namespace"] = oVariant.getNamespace();
		}
		var _fOkay = function(oResult) {
			var sPackage;
			var sTransport;
			sTransport = oResult.getParameters().selectedTransport;
			sPackage = oResult.getParameters().selectedPackage;
			fOkay(sPackage, sTransport);
		};
		var _fError = function(oResult) {
			fError(oResult);
		};
		if (this.getLifecycleSupport()) {
			var sTransport = null;
			if (oVariant) {
				sTransport = oVariant.getLifecycleTransportId();
			}
			if (sTransport != null && sTransport.trim().length > 0) {
				fOkay(oObject["package"], sTransport);
			} else {
				var oTransports = this._getTransportSelection(); // new TransportSelection();
				oTransports.selectTransport(oObject, _fOkay, _fError, this._checkDialogCompactStyle(oControl), oControl);
			}
		} else {
			fOkay(oObject["package"], "");
		}
	};

	VariantManagement.prototype._getTransportSelection = function() {
		if (this.getTransportSelection) {
			return this.getTransportSelection();
		} else {
			return this._getFlTransportSelection();
		}
	};

	VariantManagement.prototype._getFlTransportSelection = function() {
		if (!sap.ui.fl) {
			sap.ui.getCore().loadLibrary('sap.ui.fl');
		}
		jQuery.sap.require("sap.ui.fl.transport.TransportSelection");

		return new sap.ui.fl.transport.TransportSelection();
	};

	VariantManagement.prototype.getDefaultVariantKey = function() {
		var sValue = this.getProperty("defaultVariantKey");
		if (sValue === "") {
			if (this.bVariantItemMode) {
				sValue = this.getStandardVariantKey();
			}
		}
		return sValue;
	};

	VariantManagement.prototype._compareItems = function(first, second) {
		var sFirst = first.getText();
		var sSecond = second.getText();
		var sFirstU = sFirst.toUpperCase();
		var sSecondU = sSecond.toUpperCase();
		if (sFirstU == sSecondU) {
			if (sFirst == sSecond) {
				return 0;
			}
			if (sFirst < sSecond) {
				return -1;
			}
			if (sFirst > sSecond) {
				return 1;
			}
		}
		if (sFirstU < sSecondU) {
			return -1;
		}
		if (sFirstU > sSecondU) {
			return 1;
		}
	};

	VariantManagement.prototype._accessOptionsText = function(sOptions) {
		var sMessage = null;
		switch (sOptions) {
			case "R":
				sMessage = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LAYER");
				break;
			case "RD":
				sMessage = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LANGUAGE");
				break;
			default:
				sMessage = null;
		}
		return sMessage;
	};

	VariantManagement.prototype._openSaveAsDialog = function() {
		this._initalizeSaveAsDialog();
		if (this._getSelectedItem()) {
			this.oInputName.setValue(this._getSelectedItem().getText());
		} else {
			this.oInputName.setValue("");
		}
		this.oInputName.setEnabled(true);
		this.oInputName.setValueState(ValueState.None);
		this.oInputName.setValueStateText(null);
		this.oDefault.setSelected(false);
		this.oShare.setSelected(false);
		this.oCreateTile.setSelected(false);
		this.oExecuteOnSelect.setSelected(false);

		// set variant name to Standard
		if (this._isIndustrySolutionModeAndVendorLayer() /* && this.bManualVariantKey */) {
			this.oInputName.setValue(this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD"));
			// this.oInputName.setEnabled(false);
		}

		this._createSaveDialog();
		this._setDialogCompactStyle(this, this.oSaveDialog);
		this.oVariantPopOver.close();
		this.sTransport = null;
		this.sPackage = null;
		if (this.bManualVariantKey) {
			this.oInputKey.setVisible(true);
			this.oInputKey.setEnabled(true);
			this.oInputKey.setValueState(ValueState.None);
			this.oInputKey.setValueStateText(null);
			this.oLabelKey.setVisible(true);
		} else {
			this.oInputKey.setVisible(false);
			this.oLabelKey.setVisible(false);
		}

		this.oSaveDialog.open();
	};

	VariantManagement.prototype._checkManageItemNameChange = function(oManageItem) {
		var sText = "";
		var oInputField = null;
		var that = this;
		oInputField = oManageItem.getCells()[VariantManagement.NAME_COLUMN];

		sText = oInputField.getValue();
		sText = sText.trim();
		var oEditableVariantItem = oManageItem;
		var sKey = oEditableVariantItem.getKey();

		this._checkVariantNameConstraints(oInputField, this.oManagementSave, this.oManagementTable);

		if (oInputField.getValueState() === ValueState.Error) {
			// this.oManagementSave.setEnabled(false);
			this._eventDone();
			return;
		}

		if (this.oVariantList.getItemByKey(sKey).getText().trim() === sText) {
			this._eventDone();
			return;
		}

		if (oEditableVariantItem.getGlobal()) {
			var fOkay = function(sPackage, sTransport) {
				oEditableVariantItem.setLifecyclePackage(sPackage);
				oEditableVariantItem.setLifecycleTransportId(sTransport);
				that._eventDone();
			};

			var fError = function(oResult) {
				var oItem = that.oVariantList.getItemByKey(sKey); // ???
				oInputField.setValue(oItem.getText());
				that._cancelAllEvents();
			};

			this._createManagementDialog();
			this._assignTransport(oEditableVariantItem, fOkay, fError, this.oManagementDialog);
		} else {
			this._eventDone();
		}
	};

	VariantManagement.prototype._handleManageSavePressed = function() {
		var oNewItems = this.oManagementTable.getItems();
		var oItem, oControl;
		var fireSelect = false;
		var sName = "";
		var oOriginalItem = null;
		var iD = 0;
		var aFavoriteChanges = [];

		for (var iG = 0; iG < oNewItems.length; iG++) {
			oItem = this.oVariantList.getItemByKey(oNewItems[iG].getKey());
			oControl = oNewItems[iG].getCells()[VariantManagement.NAME_COLUMN];
			if (oControl && oControl.getValue) {
				sName = oControl.getValue();
			} else if (oControl && oControl.getTitle) {
				sName = oControl.getTitle();
			}

			sName = sName.trim();
			if (oItem.getText() !== sName) {
				this.aRenamedVariants.push({
					key: oItem.getKey(),
					name: sName
				});
				oOriginalItem = this.getItemByKey(oNewItems[iG].getKey());
				oOriginalItem.setText(sName);
				if (oOriginalItem.setLifecyclePackage) {
					oOriginalItem.setLifecyclePackage(oNewItems[iG].getLifecyclePackage());
					oOriginalItem.setLifecycleTransportId(oNewItems[iG].getLifecycleTransportId());
				}

				if (this.lastSelectedVariantKey === oItem.getKey()) {
					this._setVariantText(sName);
					// BCP 1670301513
// this.bDirty = false;
// this.oVariantModifiedText.setVisible(false);
// this.oModel.setProperty("/enabled", false);
				}
			}

			if (this.getUseFavorites() && !this._isIndustrySolutionModeAndVendorLayer()) {
				var sKey = oNewItems[iG].getKey();
				if (this._mFavoriteChanges && this._mFavoriteChanges[sKey] !== undefined) {
					var bNewSelected = this._mFavoriteChanges[sKey];

					if (sKey === this.STANDARDVARIANTKEY) {
						if (this.getStandardFavorite() !== bNewSelected) {
							aFavoriteChanges.push({
								key: sKey,
								visible: bNewSelected
							});
							this.setStandardFavorite(bNewSelected);
						}
					} else {
						oOriginalItem = this.getItemByKey(oNewItems[iG].getKey());
						if (oOriginalItem && oItem.getFavorite && (oItem.getFavorite() !== bNewSelected)) {
							aFavoriteChanges.push({
								key: sKey,
								visible: bNewSelected
							});
							oOriginalItem.setFavorite(bNewSelected);
						}
					}

				}
			}

			if (this.getShowExecuteOnSelection() && oItem.getExecuteOnSelection && oItem.getExecuteOnSelection() != oNewItems[iG].getCells()[VariantManagement.EXEC_COLUMN].getSelected()) {
				// execute on selection changed
				var bFlag = oNewItems[iG].getCells()[VariantManagement.EXEC_COLUMN].getSelected();
				var oItemTmp = this.getItemByKey(oNewItems[iG].getKey());

				if (!oItemTmp && (this.getSupportExecuteOnSelectOnSandardVariant() & (oNewItems[iG].getKey() === this.getStandardVariantKey()/* this.STANDARDVARIANTKEY */))) {
					oItemTmp = new VariantItem();
				}

				if (oItemTmp && oItemTmp.setExecuteOnSelection) {
					oItemTmp.setExecuteOnSelection(bFlag);

					if (this.getSupportExecuteOnSelectOnSandardVariant() & (oNewItems[iG].getKey() === this.getStandardVariantKey())) {
						this._executeOnSelectForStandardVariantByUser(bFlag);
					}
					this.aExeVariants.push({
						key: oItem.getKey(),
						exe: bFlag
					});
					if (oItemTmp.setLifecyclePackage) {
						oItemTmp.setLifecyclePackage(oNewItems[iG].getLifecyclePackage());
						oItemTmp.setLifecycleTransportId(oNewItems[iG].getLifecycleTransportId());
					}
				}
			}
		}

		if (this.oManagementDialog) {
			this.oManagementDialog.close();
		}
		if (this.bVariantItemMode === false) {
			if (this.getDefaultVariantKey() != this.sNewDefaultKey) {
				var oItemTmpDef = null;
				if (this.sNewDefaultKey == this.getStandardVariantKey()) {
					oItemTmpDef = this.getItemByKey(this.getDefaultVariantKey());
					this.fireSave({
						name: oItemTmpDef.getText(),
						overwrite: true,
						key: oItemTmpDef.getKey(),
						def: false
					});
				} else {
					oItemTmpDef = this.getItemByKey(this.sNewDefaultKey);
					this.fireSave({
						name: oItemTmpDef.getText(),
						overwrite: true,
						key: oItemTmpDef.getKey(),
						def: true
					});
				}
			}
		}

		if (this.sNewDefaultKey != this.getDefaultVariantKey()) {
			this.setDefaultVariantKey(this.sNewDefaultKey);
		}

		for (iD = 0; iD < this.aRemovedVariants.length; iD++) {
			oItem = this.getItemByKey(this.aRemovedVariants[iD]);
			for (var iE = 0; iE < this.aRemovedVariantTransports.length; iE++) {
				if (this.aRemovedVariants[iD] === this.aRemovedVariantTransports[iE].key) {
					var oManageItem = this.aRemovedVariantTransports[iE];
					if (oItem.setLifecyclePackage) {
						oItem.setLifecycleTransportId(oManageItem.transport);
					}
					break;
				}
			}
		}

		this.fireManage({
			renamed: this.aRenamedVariants,
			deleted: this.aRemovedVariants,
			exe: this.aExeVariants,
			def: this.getDefaultVariantKey(),
			fav: aFavoriteChanges
		});

		for (iD = 0; iD < this.aRemovedVariants.length; iD++) {
			oItem = this.getItemByKey(this.aRemovedVariants[iD]);
			if (oItem) {
				this._removeItem(oItem);
				oItem.destroy();
			}
			if (this.lastSelectedVariantKey === this.aRemovedVariants[iD]) {
				fireSelect = true;
				this._setSelectedItem(null);
				this.oModel.setProperty("/enabled", false);
			}
		}
// if (!fireSelect) {
//
// if (this._mFavoriteChanges && (this._mFavoriteChanges[this.lastSelectedVariantKey] !== undefined) &&
// !this._mFavoriteChanges[this.lastSelectedVariantKey]) {
// fireSelect = true;
// this._setSelectedItem(null);
// this.oModel.setProperty("/enabled", false);
// }
// }

		if (fireSelect) {
			this.bFireSelect = true;
		}
		this._eventDone();
	};

	// new event processor handling
	VariantManagement.prototype._createEvent = function(sName, fCallback) {
		var oEvent = {
			name: sName,
			fFunc: fCallback,
			args: []
		};
		return oEvent;
	};

	VariantManagement.prototype._handleNextEvent = function() {
		if (this.aEvents.length > 0) {
			if (!this.bEventRunning) {
				this.bEventRunning = true;
				var nextEvent = this.aEvents.pop();
				nextEvent.fFunc.apply(this, nextEvent.args);
			}
			// else {
			// if(bShow)
			// // console.log("Event still running");
			// }
			// } else {
			// // console.log("No Events to process");
		}
	};

	VariantManagement.prototype._addEvent = function(oEvent) {
		this.aEvents.push(oEvent);
		this._handleNextEvent();
	};

	VariantManagement.prototype._cancelAllEvents = function() {
		this.aEvents = [];
		this.bEventRunning = false;
	};

	VariantManagement.prototype._eventDone = function() {
		this.bEventRunning = false;
		this._handleNextEvent();
	};

	VariantManagement.prototype._handleManageExecuteOnSelectionChanged = function(oCheckBox) {
		var that = this;
		var oManageItem = oCheckBox.getParent();
		if (oManageItem.getGlobal()) {
			var fOkay = function(sPackage, sTransport) {
				oManageItem.setLifecyclePackage(sPackage);
				oManageItem.setLifecycleTransportId(sTransport);
				that._eventDone();
			};
			var fError = function(oResult) {
				oCheckBox.setSelected(!oCheckBox.getSelected());
				that._cancelAllEvents();
			};

			this._createManagementDialog();
			this._assignTransport(oManageItem, fOkay, fError, this.oManagementDialog);
		} else {
			this._eventDone();
		}
	};

	VariantManagement.prototype._handleManageDeletePressed = function(oButton) {
		var that = this, oStandardItem;

		var fgetStandardEntry = function() {
			var oStandardItem = null, aItems = that.oManagementTable.getItems();
			aItems.some(function(oEntry) {
				if (oEntry.getKey() === that.getStandardVariantKey()) {
					oStandardItem = oEntry;
					return true;
				}
			});

			return oStandardItem;
		};

		if (!this._anyInErrorState(this.oManagementTable, oButton.getParent().getCells()[VariantManagement.NAME_COLUMN])) {
			this.oManagementSave.setEnabled(true);
		}

		oStandardItem = fgetStandardEntry();

		var oItem = oButton.getParent();
		if (oItem.getGlobal()) {

			var fOkay = function(sPackage, sTransport) {
				var sKey = oItem.getKey();
				that.aRemovedVariants.push(sKey);
				that.oManagementTable.removeItem(oItem);
				if (that.getShowSetAsDefault()) {
					if ((oItem.getKey() === that.sNewDefaultKey)) {
						if (oStandardItem) {
							oStandardItem.getCells()[VariantManagement.DEF_COLUMN].setSelected(true);
							oStandardItem.getCells()[VariantManagement.DEF_COLUMN].fireSelect({
								selected: true
							});
						} else {
							that.setStandardVariantKey(that.STANDARDVARIANTKEY);
						}
						that.sNewDefaultKey = that.getStandardVariantKey();
					}
				}
				oItem.destroy();
				var oTransportAssignment = {
					key: sKey,
					transport: sTransport
				};
				that.aRemovedVariantTransports.push(oTransportAssignment);
				that._eventDone();
			};
			var fError = function(oResult) {
				that._cancelAllEvents();
			};

			this._createManagementDialog();
			this._assignTransport(oItem, fOkay, fError, this.oManagementDialog);
		} else {
			this.aRemovedVariants.push(oItem.getKey());
			this.oManagementTable.removeItem(oItem);
			if (this.getShowSetAsDefault()) {
				if (oItem.getKey() === this.sNewDefaultKey) {
					if (oStandardItem) {
						oStandardItem.getCells()[VariantManagement.DEF_COLUMN].setSelected(true);
						oStandardItem.getCells()[VariantManagement.DEF_COLUMN].fireSelect({
							selected: true
						});
					}
					this.sNewDefaultKey = this.getStandardVariantKey();
				}
			}
			oItem.destroy();
			this._eventDone();
		}

		var oCancelButton = sap.ui.getCore().byId(this.getId() + "-managementcancel");
		if (oCancelButton) {
			oCancelButton.focus();
		}
	};

	VariantManagement.prototype._handleShareSelected = function(oControlEvent) {
		var that = this;

		if (oControlEvent.getParameters().selected) {
			var fOkay = function(sPackage, sTransport) {
				that.sTransport = sTransport;
				that.sPackage = sPackage;
				that._eventDone();
			};
			var fError = function(oResult) {
				that.oShare.setSelected(false);
				that.sTransport = null;
				that.sPackage = null;
				that._cancelAllEvents();
			};

			this._createSaveDialog();
			this._assignTransport(null, fOkay, fError, this.oSaveDialog);
		} else {
			this.sTransport = null;
			this.sPackage = null;
			this._eventDone();
		}
	};

	VariantManagement.prototype._handleVariantSaveAs = function() {
		var sKey = "SV" + new Date().getTime();
		var sName = this.oInputName.getValue();
		var sManualKey = this.oInputKey.getValue();
		var sTransport = "";
		var sPackage = "";
		var bExecuteOnSelect = false;
		var bCreateTile = false;
		var oItem = null;
		sName = sName.trim();
		if (sName == "") {
			this.oInputName.setValueState(ValueState.Error);
			this.oInputName.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_EMPTY"));
			this._cancelAllEvents();
			return;
		}
		sManualKey = sManualKey.trim();
		if (this.bManualVariantKey && sManualKey == "") {
			this.oInputKey.setValueState(ValueState.Error);
			this.oInputKey.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_EMPTY"));
			this._cancelAllEvents();
			return;
		}
		if (this.bManualVariantKey) {
			sKey = sManualKey;
		}

		if (this.oSaveDialog) {
			this.oSaveDialog.close();
		}
		if (this.oExecuteOnSelect !== null) {
			bExecuteOnSelect = this.oExecuteOnSelect.getSelected();
		}
		if (this.oCreateTile !== null) {
			bCreateTile = this.oCreateTile.getSelected();
		}
		if (this.bVariantItemMode) {
			oItem = new VariantItem({
				key: sKey,
				// text: sName, issue with curly brackets
				readOnly: false,
				executeOnSelection: bExecuteOnSelect,
				global: this.oShare.getSelected(),
				lifecycleTransportId: this.sTransport,
				lifecyclePackage: this.sPackage
			});
			oItem.setText(sName);
			this.addVariantItem(oItem);
			this._setSelectedItem(oItem);
		} else {
			oItem = new Item({
				key: sKey
			// , text: sName // issues with curly brackets
			});
			oItem.setText(sName);

			this.addItem(oItem);
			this._setSelectedItem(oItem);
		}
		if (this.oDefault.getSelected()) {
			this.setDefaultVariantKey(sKey);
		}
		if (this.oShare.getSelected()) {
			sPackage = this.sPackage;
			sTransport = this.sTransport;
		}
		this.fireSave({
			name: sName,
			overwrite: false,
			def: this.oDefault.getSelected(),
			key: sKey,
			exe: this.oExecuteOnSelect.getSelected(),
			tile: bCreateTile,
			global: this.oShare.getSelected(),
			lifecyclePackage: sPackage,
			lifecycleTransportId: sTransport
		});
		this.oModel.setProperty("/enabled", false);
		this._eventDone();
	};

	/**
	 * Defines the internal mode. The VariantManagement is able to support two different modes:<br>
	 * 1. the mode with standard entry displayed as 'Default' and<br>
	 * 2. the mode with standard entry displayed as 'Standard'.<br>
	 * The 'Default* display is the initial mode.<br>
	 * <code>Note:</code> this method has to be executed, before any items are assigned to the VariantManagement control!
	 * @public
	 * @since 1.48.0
	 * @param {boolean} bFlag defines the behavior: <code>true</code> new mode, otherwize 'old' mode.
	 */
	VariantManagement.prototype.setBackwardCompatibility = function(bFlag) {
		this._setBackwardCompatibility(bFlag);
	};

	VariantManagement.prototype._setBackwardCompatibility = function(bFlag) {
		if (this.getItems().length === 0 && this.getVariantItems().length === 0) {
			this.bVariantItemMode = !bFlag;
		}
		this._setStandardText();
	};

	VariantManagement.prototype._setStandardText = function() {
		var sKey = this.getSelectionKey();
		if (sKey === null || sKey === this.getStandardVariantKey()) {
			if (this.bVariantItemMode == false) {
				this._setVariantText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT"));
			} else {
				this._setVariantText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD"));
			}
			if (this.getStandardItemText() !== null && this.getStandardItemText() != "") {
				this._setVariantText(this.getStandardItemText());
			}
		}
	};

	VariantManagement.prototype._setVariantText = function(sText) {

		var oModel, oBInfo = this.extractBindingInfo(sText), sValue = sText;

		if ((typeof oBInfo === "object") && oBInfo.model && oBInfo.path) {
			oModel = this.getModel(oBInfo.model);
			if (oModel) {
				sValue = oModel.getProperty(oBInfo.path);
			}
		}

		this.oModel.setProperty("/selectedVariant", sValue);
	};

	VariantManagement.prototype._getVariantText = function(sText) {
		return this.oModel.getProperty("/selectedVariant");
	};

	VariantManagement.prototype._updateVariantInvisibletext = function(sText, bValue) {
		if (bValue) {
			sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_MODIFIED", [
				sText
			]);
		}

		return sText;
	};

	VariantManagement.prototype._setFavoriteIcon = function(oIcon, bFlagged) {
		oIcon.setSrc(bFlagged ? "sap-icon://favorite" : "sap-icon://unfavorite");
		oIcon.setTooltip(this.oResourceBundle.getText(bFlagged ? "VARIANT_MANAGEMENT_FAV_DEL_TOOLTIP" : "VARIANT_MANAGEMENT_FAV_ADD_TOOLTIP"));
	};

	VariantManagement.prototype._isFavoriteSelected = function(oIcon) {
		return oIcon.getSrc() === "sap-icon://unfavorite";
	};

	VariantManagement.prototype._openVariantManagementDialog = function() {
		var oItem;
		var oItems = null;
		var iItemNo = 0;
		var oManageItem;
		var oNameCell;
		var oTypeCell;
		var oDefaultCell;
		var oExecuteCell;
		var oDeleteCell;
		var sTypeText;
		var sTooltip;
		var fLiveChange, fChange, fSelectRB, fSelectCB, fSelectFav, fPress;

		var that = this;

		this._mFavoriteChanges = {};

		this.oManagementSave.setEnabled(true);

		this.oManagementTable.destroyItems();

		fLiveChange = function(oControlEvent) {
			that._checkVariantNameConstraints(this, that.oManagementSave, that.oManagementTable);
		};

		fChange = function(oControlEvent) {
			var oEvent = that._createEvent("inputfieldChange", that._checkManageItemNameChange);
			oEvent.args.push(this.getParent());
			that._addEvent(oEvent);
		};

		fSelectFav = function(oControlEvent) {
			var bSelected = that._isFavoriteSelected(oControlEvent.oSource), oItem = this.getParent();
			if (oItem && (that.sNewDefaultKey !== oItem.getKey())) {
				that._mFavoriteChanges[oItem.getKey()] = bSelected;
				that._setFavoriteIcon(oControlEvent.oSource, bSelected);
			}
		};

		fSelectRB = function(oControlEvent) {
			var bSelected = (oControlEvent.getParameters().selected === true), oItem = this.getParent();
			if (oItem) {

				if (bSelected) {
					that.sNewDefaultKey = oItem.getKey();
					that._mFavoriteChanges[oItem.getKey()] = bSelected;
				} else {
					if (oItem.getFavorite && that._mFavoriteChanges.hasOwnProperty(oItem.getKey()) && that._mFavoriteChanges[oItem.getKey()] !== oItem.getFavorite()) {
						delete that._mFavoriteChanges[oItem.getKey()];
					}
				}

				var oFavCtrl = oItem.getCells()[VariantManagement.FAV_COLUMN];
				if (oFavCtrl && oItem.getFavorite) {
					if (bSelected) {
						that._setFavoriteIcon(oFavCtrl, true);

					} else {
						if (that._mFavoriteChanges[oItem.getKey()] !== undefined) {
							that._setFavoriteIcon(oFavCtrl, that._mFavoriteChanges[oItem.getKey()]);
						} else {
							that._setFavoriteIcon(oFavCtrl, oItem.getFavorite() === true);
						}
					}

					// oFavCtrl.setEditable(!bSelected);
				}
			}
		};

		fSelectCB = function(oControlEvent) {
			var oEvent = that._createEvent("executeOnSelectionChange", that._handleManageExecuteOnSelectionChanged);
			oEvent.args.push(this);
			that._addEvent(oEvent);
		};

		fPress = function(oControlEvent) {
			var oEvent = that._createEvent("manageDeletePressed", that._handleManageDeletePressed);
			oEvent.args.push(this);

			that._addEvent(oEvent);
		};

		if (this.oManageDialogSearchField) {
			this.oManageDialogSearchField.setValue("");
		}

		this._initalizeManagementTableColumns();
		this.sNewDefaultKey = this.getDefaultVariantKey();

		this._restoreCompleteList(true);

		if (this.oVariantList.getItems()[0].getKey() !== this.getStandardVariantKey() && this.bVariantItemMode == false) {
			oItem = new VariantItem(this.oVariantManage.getId() + "-item-standard", {
				key: this.getStandardVariantKey(),
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT"),
				readOnly: true,
				executeOnSelection: false
			});
			this.oVariantList.insertItem(oItem, 0);
		}

		if (this.getUseFavorites()) {

			oItem = this.oVariantList.getItemByKey(this.getStandardVariantKey());
			if (oItem) {
				this.oVariantList.removeItem(oItem);
			}
		}

		oItems = this.oVariantList.getItems();

		if (this.getUseFavorites()) {
			oItems.sort(this._compareItems);
			if (oItem) {
				this.oVariantList.insertItem(oItem);
				oItems.splice(0, 0, oItem);
			}
		}
		for (var iH = 0; iH < oItems.length; iH++) {
			if (oItems[iH].getReadOnly() || oItems[iH].getLabelReadOnly()) {
				var sOptions = oItems[iH].getAccessOptions();
				sTooltip = this._accessOptionsText(sOptions);
			} else {
				sTooltip = null;
			}
			if (oItems[iH].getReadOnly()) {
				sTooltip = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LAYER");
			} else if (oItems[iH].getLabelReadOnly() === true) {
				sTooltip = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LANGUAGE");
			}

			if (oItems[iH].getKey() === this.getStandardVariantKey()) {
				sTooltip = null;
			}
			oManageItem = new EditableVariantItem(this.oVariantManage.getId() + "-edit-" + iItemNo, {
				key: oItems[iH].getKey(),
				global: oItems[iH].getGlobal(),
				lifecyclePackage: oItems[iH].getLifecyclePackage(),
				lifecycleTransportId: oItems[iH].getLifecycleTransportId(),
				namespace: oItems[iH].getNamespace(),
				labelReadOnly: oItems[iH].getLabelReadOnly(),
				author: oItems[iH].getAuthor(),
				favorite: oItems[iH].getFavorite(),
				vAlign: VerticalAlign.Middle
			});

			// Favorites column
			oNameCell = new Icon(this.oVariantManage.getId() + "-fav-" + iItemNo, {
				press: fSelectFav
			});
			oNameCell.addStyleClass("sapUICompVarMngmtFavColor");
			if (oItems[iH].getFavorite) {
				this._setFavoriteIcon(oNameCell, oItems[iH].getFavorite());
			}
			oManageItem.addCell(oNameCell);

			// name column
			if (oItems[iH].getKey() === this.getStandardVariantKey() || oItems[iH].getReadOnly() === true || oItems[iH].getLabelReadOnly() === true) {
				oNameCell = new ObjectIdentifier(this.oVariantManage.getId() + "-text-" + iItemNo, {
				// title: oItems[iH].getText() // issue with curly brackets
				});
				oNameCell.setTitle(oItems[iH].getText());

				if (sTooltip) {
					oNameCell.setTooltip(sTooltip);
				}
			} else {
				oNameCell = new Input(this.oVariantManage.getId() + "-input-" + iItemNo, {
					liveChange: fLiveChange,
					change: fChange
				});

				oNameCell.setValue(oItems[iH].getText());
			}
			oManageItem.addCell(oNameCell);

			// if (this.getShowShare()) {
			if (oItems[iH].getGlobal()) {
				sTypeText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_SHARED");
			} else {
				sTypeText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_PRIVATE");
			}
			oTypeCell = new Text(this.oVariantManage.getId() + "-type-" + iItemNo, {
				text: sTypeText,
				wrapping: false
			});
			oTypeCell.addStyleClass("sapUICompVarMngmtType");
			oManageItem.addCell(oTypeCell);
			// }

			// if (this.getShowSetAsDefault()) {
			oDefaultCell = new RadioButton(this.oVariantManage.getId() + "-def-" + iItemNo, {
				groupName: this.oVariantManage.getId(),
				select: fSelectRB
			});

			if (this.sNewDefaultKey === oItems[iH].getKey() || oItems[iH].getKey() === this.getStandardVariantKey() && this.sNewDefaultKey === "") {
				oDefaultCell.setSelected(true);

				if (oItems[iH].getFavorite) {
					this._setFavoriteIcon(oManageItem.getCells()[0], true);
					// oManageItem.getCells()[0].setEditable(false);
				}

			}
			oManageItem.addCell(oDefaultCell);
			// }

			// if (this.getShowExecuteOnSelection()) {
			oExecuteCell = new CheckBox(this.oVariantManage.getId() + "-exe-" + iItemNo, {
				selected: false,
				enabled: false,
				select: fSelectCB
			});
			if (oItems[iH].getExecuteOnSelection) {
				if ((oItems[iH].getKey() === this.getStandardVariantKey() && this.getSupportExecuteOnSelectOnSandardVariant())) {
					oExecuteCell.setEnabled(true);
				} else {
					oExecuteCell.setEnabled(!oItems[iH].getReadOnly());
				}
				oExecuteCell.setSelected(oItems[iH].getExecuteOnSelection());
				if (sTooltip) {
					oExecuteCell.setTooltip(sTooltip);
				}
			}
			oManageItem.addCell(oExecuteCell);
			// }

			oTypeCell = new Text(this.oVariantManage.getId() + "-author-" + iItemNo, {
				text: oItems[iH].getAuthor(),
				textAlign: "Begin"
			});
			oManageItem.addCell(oTypeCell);

			oDeleteCell = new Button(this.oVariantManage.getId() + "-del-" + iItemNo, {
				icon: "sap-icon://sys-cancel",
				enabled: true,
				type: ButtonType.Transparent,
				press: fPress,
				tooltip: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DELETE")
			});

			this._assignColumnInfoForDeleteButton(oDeleteCell);

			if (oItems[iH].getReadOnly && oItems[iH].getReadOnly()) {
				oDeleteCell.setEnabled(false);

				// FIORITECHP1-3560
				oDeleteCell.setVisible(false);
			}
			oManageItem.addCell(oDeleteCell);

			this.oManagementTable.addItem(oManageItem);
			iItemNo++;
		}

		this.aRemovedVariants = [];
		this.aRemovedVariantTransports = [];
		this.aRenamedVariants = [];

		this.aExeVariants = [];

		this._createManagementDialog();
		this._setDialogCompactStyle(this, this.oManagementDialog);
		oItem = this.oVariantList.getSelectedItem();
		if (oItem) {
			this.lastSelectedVariantKey = oItem.getKey();
		}
		this.oVariantPopOver.close();
		this.oManagementDialog.open();
	};

	VariantManagement.prototype._assignColumnInfoForDeleteButton = function(oDeleteButton) {
		if (!this._oInvisibleDeleteColumnName) {
			this._oInvisibleDeleteColumnName = new InvisibleText({
				text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_ACTION_COLUMN")
			});

			this._createManagementDialog();
			this.oManagementDialog.addContent(this._oInvisibleDeleteColumnName);

		}

		if (this._oInvisibleDeleteColumnName) {
			oDeleteButton.addAriaLabelledBy(this._oInvisibleDeleteColumnName);
		}
	};

	VariantManagement.prototype._enableManualVariantKey = function(bEnable) {
		this.bManualVariantKey = bEnable;
	};

	VariantManagement.prototype._fireSelectAsync = function(sKey) {
		var slKey;
		if (sKey === undefined || sKey === null) {
			var oItem = this._getSelectedItem();
			if (oItem === null) {
				slKey = this.getStandardVariantKey();
			} else {
				slKey = oItem.getKey();
			}
		}
		this.fireSelect({
			key: slKey
		});
	};

	VariantManagement.prototype.setSupportExecuteOnSelectOnSandardVariant = function(bFlag) {
		this.bSupportExecuteOnSelectOnSandardVariant = bFlag;
	};
	VariantManagement.prototype.getSupportExecuteOnSelectOnSandardVariant = function() {
		return this.bSupportExecuteOnSelectOnSandardVariant;
	};

	VariantManagement.prototype._executeOnSelectForStandardVariantByXML = function(bSelect) {
		this.bExecuteOnSelectForStandardViaXML = bSelect;
	};

	VariantManagement.prototype._executeOnSelectForStandardVariantByUser = function(bSelect) {
		this.bExecuteOnSelectForStandardByUser = bSelect;
	};

	VariantManagement.prototype.getExecuteOnSelectForStandardVariant = function() {

		if (this.getSupportExecuteOnSelectOnSandardVariant()) {
			if (this.bExecuteOnSelectForStandardByUser !== null) {
				return this.bExecuteOnSelectForStandardByUser;
			}
		}

		return this.bExecuteOnSelectForStandardViaXML;
	};

	VariantManagement.prototype.getStandardVariantKey = function() {
		return this._sStandardVariantKey;
	};

	VariantManagement.prototype.setStandardVariantKey = function(sStandardVariantKey) {
		this._sStandardVariantKey = sStandardVariantKey;
	};

	VariantManagement.prototype._setVendorLayer = function(bVendorLayer) {
		this._isVendorLayer = bVendorLayer;
	};

	VariantManagement.prototype.setStandardFavorite = function(bFavorite) {
		this._isFavorite = bFavorite;
	};
	VariantManagement.prototype.getStandardFavorite = function() {
		return this._isFavorite;
	};

	VariantManagement.prototype._isIndustrySolutionModeAndVendorLayer = function() {
		if (this.getIndustrySolutionMode() && this._isVendorLayer) {
			return true;
		}

		return false;
	};

	return VariantManagement;

}, /* bExport= */true);
