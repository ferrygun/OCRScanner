/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

// -------------------------------------------------------------------------------
// Generates the view metadata required for a field using SAP-Annotations metadata
// -------------------------------------------------------------------------------
sap.ui.define([
	'jquery.sap.global', 'sap/m/CheckBox', 'sap/m/ComboBox', 'sap/m/DatePicker', 'sap/m/TimePicker', 'sap/m/HBox', 'sap/m/Input', 'sap/m/Text', 'sap/m/ObjectIdentifier', 'sap/m/ObjectStatus', 'sap/m/Image', 'sap/m/Link', 'sap/m/VBox', 'sap/ui/comp/navpopover/SmartLink', 'sap/ui/comp/odata/MetadataAnalyser', 'sap/ui/comp/smartfield/ODataHelper', 'sap/ui/comp/smartfield/SmartField', 'sap/ui/comp/odata/ODataType', 'sap/ui/comp/odata/CriticalityMetadata', 'sap/ui/comp/util/FormatUtil', 'sap/ui/core/Control', 'sap/ui/comp/navpopover/SemanticObjectController'
], function(jQuery, CheckBox, ComboBox, DatePicker, TimePicker, HBox, Input, Text, ObjectIdentifier, ObjectStatus, Image, Link, VBox, SmartLink, MetadataAnalyser, ODataHelper, SmartField, ODataType, CriticalityMetadata, FormatUtil, Control, SemanticObjectController) {
	"use strict";

	var SmartToggle;

	/**
	 * Constructs a class to generate the view/data model metadata for the controls - that can be used in table/forms etc.
	 * 
	 * @constructor
	 * @experimental This module is only for internal/experimental use!
	 * @public
	 * @param {object} mPropertyBag - PropertyBag having members model, entitySet
	 * @author SAP SE
	 */
	var ControlProvider = function(mPropertyBag) {
		if (mPropertyBag) {
			this._oParentODataModel = mPropertyBag.model;
			this._oMetadataAnalyser = mPropertyBag.metadataAnalyser;
			this._aODataFieldMetadata = mPropertyBag.fieldsMetadata;
			this._oLineItemAnnotation = mPropertyBag.lineItemAnnotation;
			this._oSemanticKeyAnnotation = mPropertyBag.semanticKeyAnnotation;
			this._smartTableId = mPropertyBag.smartTableId;
			this._isAnalyticalTable = mPropertyBag.isAnalyticalTable;
			this._isMobileTable = mPropertyBag.isMobileTable;
			this._oDateFormatSettings = mPropertyBag.dateFormatSettings;
			this._bEnableDescriptions = mPropertyBag.enableDescriptions;
			this._oCurrencyFormatSettings = mPropertyBag.currencyFormatSettings;
			this._oDefaultDropDownDisplayBehaviour = mPropertyBag.defaultDropDownDisplayBehaviour || "descriptionAndId";
			this.useSmartField = mPropertyBag.useSmartField === "true";
			this.useSmartToggle = mPropertyBag.useSmartToggle === "true";
			this._sEntitySet = mPropertyBag.entitySet;
			this._oSemanticKeyAdditionalControl = mPropertyBag._semanticKeyAdditionalControl;
			this._oSemanticObjectController = mPropertyBag.semanticObjectController;
		}

		if (!this._oMetadataAnalyser && this._oParentODataModel) {
			this._oMetadataAnalyser = new MetadataAnalyser(this._oParentODataModel);
			this._intialiseMetadata();
		}

		this._mSmartField = {};
		this._oHelper = new ODataHelper(this._oMetadataAnalyser.oModel);

		this._aValueListProvider = [];
		this._aValueHelpProvider = [];
		this._aLinkHandlers = [];
	};

	/**
	 * Initialises the necessary metadata
	 * 
	 * @private
	 */
	ControlProvider.prototype._intialiseMetadata = function() {
		if (!this._aODataFieldMetadata) {
			this._aODataFieldMetadata = this._oMetadataAnalyser.getFieldsByEntitySetName(this.sEntity);
		}
	};

	/**
	 * Get the field metadata
	 * 
	 * @param {object} oFieldODataMetadata - OData metadata for the field
	 * @param {boolean} isEditable - specifies if the control shall be editable
	 * @returns {Object} the field view metadata object
	 * @public
	 */
	ControlProvider.prototype.getFieldViewMetadata = function(oFieldODataMetadata, isEditable) {
		var oFieldViewMetadata = this._createFieldMetadata(oFieldODataMetadata);
		// Create and set the template
		this._createFieldTemplate(oFieldViewMetadata, isEditable);
		return oFieldViewMetadata;
	};

	/**
	 * Creates and extends the field view with a template for the UI content
	 * 
	 * @param {object} oViewField - the view field metadata
	 * @param {boolean} isEditable - specifies if the control shall be editable
	 * @private
	 */
	ControlProvider.prototype._createFieldTemplate = function(oViewField, isEditable) {
		// Create SmartField template - if useSmartField is set
		if (this.useSmartField) {
			oViewField.template = new SmartField({
				value: {
					path: oViewField.name
				},
				entitySet: this._sEntitySet,
				contextEditable: {
					path: "sm4rtM0d3l>/editable",
					mode: "OneWay"
				},
				controlContext: this._isMobileTable ? "responsiveTable" : "table",
				wrapping: this._isMobileTable
			});

			if (ODataType.isNumeric(oViewField.type) || ODataType.isDateOrTime(oViewField.type)) {
				oViewField.template.setTextAlign("Right");
				oViewField.template.setWidth("100%");
			}
			this._completeSmartField(oViewField);

			oViewField.template._setPendingEditState(isEditable);
		}
		// Check if SmartToggle is set - if so, create both display and edit controls (use SmartField for edit if useSmartField is set)
		if (this.useSmartToggle) {
			oViewField.template = new SmartToggle({
				editable: {
					path: "sm4rtM0d3l>/editable",
					mode: "OneWay"
				},
				edit: this.useSmartField ? oViewField.template : this._createEditableTemplate(oViewField),
				display: this._createDisplayOnlyTemplate(oViewField)
			});
		} else if (!this.useSmartField) {
			// create controls as before
			oViewField.template = isEditable ? this._createEditableTemplate(oViewField) : this._createDisplayOnlyTemplate(oViewField);
		}
	};

	/**
	 * Completes the Smart Field template, adds especially meta data.
	 * 
	 * @param {object} oViewField The current meta data
	 * @private
	 */
	ControlProvider.prototype._completeSmartField = function(oViewField) {
		var oData = {
			annotations: {},
			path: oViewField.name
		};

		if (!this._mSmartField.entitySetObject) {
			this._mSmartField.entitySetObject = this._oHelper.oMeta.getODataEntitySet(this._sEntitySet);
			this._mSmartField.entityType = this._oHelper.oMeta.getODataEntityType(this._mSmartField.entitySetObject.entityType);
		}

		oData.modelObject = this._oParentODataModel;
		oData.entitySetObject = this._mSmartField.entitySetObject;
		// ODataHelper expects entitySet and not entitySetObject!
		oData.entitySet = this._mSmartField.entitySetObject;
		oData.entityType = this._mSmartField.entityType;
		this._oHelper.getProperty(oData);

		oViewField.fieldControlProperty = this._oHelper.oAnnotation.getFieldControlPath(oData.property.property);
		if (oViewField.fieldControlProperty && oViewField.parentPropertyName) {
			oViewField.fieldControlProperty = oViewField.parentPropertyName + "/" + oViewField.fieldControlProperty;
		}

		oData.annotations.uom = this._oHelper.getUnitOfMeasure2(oData);
		oData.annotations.text = this._oHelper.getTextProperty2(oData);
		oData.annotations.lineitem = this._oLineItemAnnotation;
		oData.annotations.semantic = MetadataAnalyser.getSemanticObjectsFromProperty(oData.property.property);
		this._oHelper.getUOMTextAnnotation(oData);
		if (oData.property.property["sap:value-list"] || oData.property.property["com.sap.vocabularies.Common.v1.ValueList"]) {
			oData.annotations.valuelist = this._oHelper.getValueListAnnotationPath(oData);
			if (oData.property.property["sap:value-list"]) {
				oData.annotations.valuelistType = oData.property.property["sap:value-list"];
			} else {
				oData.annotations.valuelistType = this._oMetadataAnalyser.getValueListSemantics(oData.property.property["com.sap.vocabularies.Common.v1.ValueList"]);
			}
		}
		this._oHelper.getUOMValueListAnnotationPath(oData);
		delete oData.entitySet;
		oViewField.template.data("configdata", {
			"configdata": oData
		});

		oViewField.template.data("dateFormatSettings", this._oDateFormatSettings);
		oViewField.template.data("currencyFormatSettings", this._oCurrencyFormatSettings);
		oViewField.template.data("defaultDropDownDisplayBehaviour", this._oDefaultDropDownDisplayBehaviour);

		if (oData.annotations.uom || ODataType.isNumeric(oViewField.type) || ODataType.isDateOrTime(oViewField.type)) {
			var sAlign = oViewField.template.getTextAlign();

			if (sAlign === "Initial") {
				sAlign = "Right";
			}
			oViewField.align = sAlign;
		}
	};

	/**
	 * Creates and extends the field view with a template for editable UI content
	 * 
	 * @param {object} oViewField - the view field
	 * @param {boolean} bBlockSmartLinkCreation - if true, no SmartLink is created independent of the semanitcObject notation
	 * @returns {sap.ui.core.Control} the template control
	 * @private
	 */
	ControlProvider.prototype._createEditableTemplate = function(oViewField, bBlockSmartLinkCreation) {
		var oTemplate = null, oFormatOptions, oConstraints, oType;
		if (oViewField.type === "Edm.DateTime" || oViewField.type === "Edm.DateTimeOffset") {
			// Create DatePicker for Date display fields
			if (oViewField.displayFormat === "Date") {
				oFormatOptions = this._oDateFormatSettings;
				oConstraints = {
					displayFormat: "Date"
				};
				oTemplate = new DatePicker({
					dateValue: {
						path: oViewField.name
					}
				});
			}
		} else if (oViewField.type === "Edm.Boolean") {
			oTemplate = new CheckBox({
				selected: {
					path: oViewField.name
				}
			});
		} else if (oViewField.type === "Edm.Decimal") {
			oConstraints = {
				precision: oViewField.precision,
				scale: oViewField.scale
			};
		} else if (oViewField.type === "Edm.String") {
			oConstraints = {
				isDigitSequence: oViewField.isDigitSequence
			};
		}

		oType = ODataType.getType(oViewField.type, oFormatOptions, oConstraints);

		// semantic link
		if (oViewField.semanticObjects && (!bBlockSmartLinkCreation)) {
			oTemplate = this._createSmartLinkFieldTemplate(oViewField, oType, function() {
				return this._createEditableTemplate(oViewField, true);
			}.bind(this));
		}

		// TODO: ComboBox handling!

		// Default ==> sap.m.Input
		if (!oTemplate) {
			if (oViewField.type === "Edm.Time") {
				oTemplate = new TimePicker({
					value: {
						path: oViewField.name,
						type: oType
					}
				});
			} else {
				oTemplate = new Input({
					value: {
						path: oViewField.name,
						type: oType
					}
				});

				if (oViewField.unit) {
					oTemplate.bindProperty("description", {
						path: oViewField.unit
					});
					oTemplate.setTextAlign("Right");
					oTemplate.setTextDirection("LTR");
					oTemplate.setFieldWidth("80%");
				} else if (this._bEnableDescriptions && oViewField.description) {
					oTemplate.bindProperty("description", {
						path: oViewField.description
					});
				} else if (ODataType.isNumeric(oViewField.type) || ODataType.isDateOrTime(oViewField.type)) {
					oTemplate.setTextAlign("Right");
					oTemplate.setTextDirection("LTR");
				}

				if (oViewField.hasValueListAnnotation) {
					this._associateValueHelpAndSuggest(oTemplate, oViewField);
				}
			}
		}
		return oTemplate;
	};

	/**
	 * Associates the control with a ValueHelp Dialog and suggest using the details retrieved from the metadata (annotation)
	 * 
	 * @param {object} oControl - The control
	 * @param {object} oFieldViewMetadata - The metadata merged from OData metadata and additional control configuration
	 * @private
	 */
	ControlProvider.prototype._associateValueHelpAndSuggest = function(oControl, oFieldViewMetadata) {
		// F4 Help with selection list
		oControl.setShowValueHelp(true);
		this._aValueHelpProvider.push(new sap.ui.comp.providers.ValueHelpProvider({
			loadAnnotation: true,
			fullyQualifiedFieldName: oFieldViewMetadata.fullName,
			metadataAnalyser: this._oMetadataAnalyser,
			control: oControl,
			model: this._oParentODataModel,
			preventInitialDataFetchInValueHelpDialog: true,
			dateFormatSettings: this._oDateFormatSettings,
			takeOverInputValue: false,
			fieldName: oFieldViewMetadata.fieldName,
			type: oFieldViewMetadata.type,
			maxLength: oFieldViewMetadata.maxLength,
			displayFormat: oFieldViewMetadata.displayFormat,
			displayBehaviour: oFieldViewMetadata.displayBehaviour,
			title: oFieldViewMetadata.label
		}));

		oControl.setShowSuggestion(true);
		oControl.setFilterSuggests(false);
		this._aValueListProvider.push(new sap.ui.comp.providers.ValueListProvider({
			loadAnnotation: true,
			fullyQualifiedFieldName: oFieldViewMetadata.fullName,
			metadataAnalyser: this._oMetadataAnalyser,
			control: oControl,
			model: this._oParentODataModel,
			dateFormatSettings: this._oDateFormatSettings,
			typeAheadEnabled: true,
			aggregation: "suggestionRows",
			displayFormat: oFieldViewMetadata.displayFormat,
			displayBehaviour: oFieldViewMetadata.displayBehaviour
		}));
	};

	/**
	 * Creates and extends the field view with a template for display only UI content
	 * 
	 * @param {object} oViewField - the view field
	 * @param {boolean} bBlockSmartLinkCreation - if true, no SmartLink is created independent of the semanitcObject notation
	 * @returns {sap.ui.core.Control} the template control
	 * @private
	 */
	ControlProvider.prototype._createDisplayOnlyTemplate = function(oViewField, bBlockSmartLinkCreation) {
		var oTemplate = null, oType = null, oFormatOptions, oConstraints, sAlign, oBindingInfo;

		// Create Date type for Date display fields
		if (oViewField.displayFormat === "Date") {
			oFormatOptions = this._oDateFormatSettings;
			oConstraints = {
				displayFormat: "Date"
			};
		} else if (oViewField.type === "Edm.Decimal") {
			oConstraints = {
				precision: oViewField.precision,
				scale: oViewField.scale
			};
		} else if (oViewField.type === "Edm.String") {
			oConstraints = {
				isDigitSequence: oViewField.isDigitSequence
			};
		}

		oType = ODataType.getType(oViewField.type, oFormatOptions, oConstraints);

		if (ODataType.isNumeric(oViewField.type) || ODataType.isDateOrTime(oViewField.type)) {
			sAlign = "Right";
		}

		// Only relevant for ResponsiveTable use case
		if (this._isMobileTable) {
			if (oViewField.isImageURL) {
				oTemplate = new Image({
					src: {
						path: oViewField.name
					},
					width: "3em",
					height: "3em"
				});
			} else if (this._oLineItemAnnotation && this._oLineItemAnnotation.urlInfo && this._oLineItemAnnotation.urlInfo[oViewField.name]) {
				oTemplate = this._createLink(oViewField, oType, this._oLineItemAnnotation.urlInfo[oViewField.name]);
			} else if (this._oLineItemAnnotation && this._oLineItemAnnotation.criticality && this._oLineItemAnnotation.criticality[oViewField.name]) {
				oTemplate = this._createObjectStatusTemplate(oViewField, oType, this._oLineItemAnnotation.criticality[oViewField.name]);
			} else if (this._oSemanticKeyAnnotation && this._oSemanticKeyAnnotation.semanticKeyFields && this._oSemanticKeyAnnotation.semanticKeyFields.indexOf(oViewField.name) > -1) {
				oTemplate = this._createObjectIdentifierTemplate(oViewField, oType, this._oSemanticKeyAnnotation.semanticKeyFields.indexOf(oViewField.name) === 0);
			}
		}
		if (!oTemplate) {
			if (oViewField.semanticObjects && (!bBlockSmartLinkCreation)) {
				oTemplate = this._createSmartLinkFieldTemplate(oViewField, oType, function() {
					return this._createDisplayOnlyTemplate(oViewField, true);
				}.bind(this));
			} else if (oViewField.unit) {
				oTemplate = this._createMeasureFieldTemplate(oViewField, oType);
			} else {
				oBindingInfo = this._getDefaultBindingInfo(oViewField, oType);
				oTemplate = new Text({
					wrapping: this._isMobileTable,
					textAlign: sAlign,
					text: oBindingInfo
				});
			}
		}
		oViewField.align = sAlign;
		return oTemplate;
	};

	/**
	 * Returns the default binding info object
	 * 
	 * @param {object} oViewField - the view field
	 * @param {object} oType - the odata binding data type
	 * @private
	 * @returns {Object} the default binding info that considers description
	 */
	ControlProvider.prototype._getDefaultBindingInfo = function(oViewField, oType) {
		var oBindingInfo = {
			path: oViewField.name,
			type: oType
		};
		if (this._bEnableDescriptions && oViewField.description) {
			oBindingInfo = {
				parts: [
					{
						path: oViewField.name,
						type: oType
					}, {
						path: oViewField.description
					}
				],
				formatter: function(sId, sDescription) {
					return FormatUtil.getFormattedExpressionFromDisplayBehaviour(oViewField.displayBehaviour, sId, sDescription);
				}
			};
		}
		return oBindingInfo;
	};

	/**
	 * Creates and extends the field view with a template for Link
	 * 
	 * @param {object} oViewField - the view field
	 * @param {object} oType - the odata binding data type
	 * @param {Object} oLinkInfo - contains Apply part of the DataFieldWithUrl annotation
	 * @private
	 * @returns {Object} the template
	 */
	ControlProvider.prototype._createLink = function(oViewField, oType, oLinkInfo) {
		var mHrefInfo = null;
		// add link properties to view field so that this can be added to additionalProperties for $select
		oViewField.linkProperties = oLinkInfo.parameters || oLinkInfo.urlPath;
		// create link binding info - if needed
		if (oLinkInfo.urlPath) {
			mHrefInfo = {
				path: oLinkInfo.urlPath
			};
		} else if (oLinkInfo.urlTarget) {
			mHrefInfo = oLinkInfo.urlTarget;
		}

		// Create link from link info
		return new Link({
			text: this._getDefaultBindingInfo(oViewField, oType),
			wrapping: this._isMobileTable,
			href: mHrefInfo
		});
	};
	/**
	 * Creates and extends the field view with a template for ObjectIdentifier
	 * 
	 * @param {object} oViewField - the view field
	 * @param {object} oType - the odata binding data type
	 * @param {boolean} bFirstKeyField - specifies whether this is the first Key field (optional)
	 * @private
	 * @returns {Object} the template
	 */
	ControlProvider.prototype._createObjectIdentifierTemplate = function(oViewField, oType, bFirstKeyField) {
		var oObjectIdentifier, sTitle, sText, oText, oTitle, oLinkHandler;
		var bTitleActive;
		var that = this;
		if (oViewField.semanticObjects) {
			SemanticObjectController.getDistinctSemanticObjects().then(function(oSemanticObjects) {
				bTitleActive = SemanticObjectController.hasDistinctSemanticObject(oViewField.semanticObjects.defaultSemanticObject, oSemanticObjects);
				if (bTitleActive) {
					jQuery.sap.require("sap.ui.comp.navpopover.NavigationPopoverHandler");
					oLinkHandler = new sap.ui.comp.navpopover.NavigationPopoverHandler({
						semanticObject: oViewField.semanticObjects.defaultSemanticObject,
						additionalSemanticObjects: oViewField.semanticObjects.additionalSemanticObjects,
						semanticObjectLabel: oViewField.label,
						fieldName: oViewField.name,
						semanticObjectController: that._oSemanticObjectController,
						navigationTargetsObtained: function(oEvent) {
							var oObjectIdentifier = sap.ui.getCore().byId(oEvent.getSource().getControl());
							var oMainNavigation = oEvent.getParameters().mainNavigation;
							// 'mainNavigation' might be undefined
							if (oMainNavigation) {
								oMainNavigation.setDescription(oObjectIdentifier.getText());
							}
							oEvent.getParameters().show(oObjectIdentifier.getTitle(), oMainNavigation, undefined, undefined);
						}
					});
					that._aLinkHandlers.push(oLinkHandler);
				}
			});
		}
		// Show title and text based on TextArrangement or displayBehaviour
		if (oViewField.description) {
			switch (oViewField.displayBehaviour) {
				case "descriptionAndId":
					sTitle = oViewField.description;
					sText = oViewField.name;
					oText = oType;
					break;
				case "idAndDescription":
					sTitle = oViewField.name;
					sText = oViewField.description;
					oTitle = oType;
					break;
				case "idOnly":
					sTitle = oViewField.name;
					oText = oType;
					break;
				default:
					sTitle = oViewField.description;
					break;

			}
		} else {
			// fallback to idOnly when there is no description field (Text annotation)
			sTitle = oViewField.name;
			oTitle = oType;
		}
		oObjectIdentifier = new ObjectIdentifier({
			title: sTitle ? {
				path: sTitle,
				type: oTitle
			} : undefined,
			text: sText ? {
				path: sText,
				type: oText
			} : undefined,
			titleActive: oViewField.semanticObjects ? {
				path: "$sapuicompcontrolprovider_distinctSO>/distinctSemanticObjects/" + oViewField.semanticObjects.defaultSemanticObject,
				formatter: function(oValue) {
					return !!oValue;
				}
			} : false,
			titlePress: function(oEvent) {
				if (bTitleActive && oLinkHandler) {
					oLinkHandler.setControl(oEvent.getSource());
					oLinkHandler.openPopover(oEvent.getParameter("domRef"));
				}
			}
		});
		oObjectIdentifier.attachEvent("ObjectIdentifier.designtime", function(oEvent) {
			if (oLinkHandler) {
				oLinkHandler.setControl(oEvent.getSource());
				oEvent.getParameters().registerNavigationPopoverHandler(oLinkHandler);
			}
		});
		oObjectIdentifier.setModel(SemanticObjectController.getJSONModel(), "$sapuicompcontrolprovider_distinctSO");
		if (this._oSemanticKeyAdditionalControl && bFirstKeyField) {
			this._bSemanticKeyAdditionalControlUsed = true;
			return new VBox({
				renderType: "Bare",
				items: [
					oObjectIdentifier, this._oSemanticKeyAdditionalControl
				]
			}).addStyleClass("sapMTableContentMargin");
		}
		return oObjectIdentifier;
	};

	/**
	 * Creates and extends the field view with a template for ObjectStatus
	 * 
	 * @param {object} oViewField - the view field
	 * @param {object} oType - the odata binding data type
	 * @param {object} oCriticalityInfo - the criticality metadata
	 * @private
	 * @returns {Object} the template
	 */
	ControlProvider.prototype._createObjectStatusTemplate = function(oViewField, oType, oCriticalityInfo) {
		var oStateBinding, oStateIconBinding, bShowIcon, oBindingInfo;
		bShowIcon = CriticalityMetadata.getShowCriticalityIcon(oCriticalityInfo.criticalityRepresentationType);
		// add criticality path to view field so that this can be added to additionalProperties for $select
		if (oCriticalityInfo.path) {
			oViewField.criticality = oCriticalityInfo.path;
			oStateBinding = {
				path: oCriticalityInfo.path,
				formatter: CriticalityMetadata.getCriticalityState
			};
			if (oCriticalityInfo.criticalityRepresentationPath) {
				oViewField.criticalityRepresentation = oCriticalityInfo.criticalityRepresentationPath;
				oStateIconBinding = {
					parts: [
						{
							path: oCriticalityInfo.path
						}, {
							path: oCriticalityInfo.criticalityRepresentationPath
						}
					],
					formatter: function(sCriticality, sCriticalityRepresentationType) {
						return CriticalityMetadata.getShowCriticalityIcon(sCriticalityRepresentationType) ? CriticalityMetadata.getCriticalityIcon(sCriticality) : undefined;
					}
				};
			} else if (bShowIcon) {
				oStateIconBinding = {
					path: oCriticalityInfo.path,
					formatter: CriticalityMetadata.getCriticalityIcon
				};
			}
		} else {
			oStateBinding = CriticalityMetadata.getCriticalityState(oCriticalityInfo.criticalityType);
			if (oCriticalityInfo.criticalityRepresentationPath) {
				oViewField.criticalityRepresentation = oCriticalityInfo.criticalityRepresentationPath;
				oStateIconBinding = {
					path: oCriticalityInfo.criticalityRepresentationPath,
					formatter: function(sCriticalityRepresentationType) {
						return CriticalityMetadata.getShowCriticalityIcon(sCriticalityRepresentationType) ? CriticalityMetadata.getCriticalityIcon(oCriticalityInfo.criticalityType) : undefined;
					}
				};
			} else if (bShowIcon) {
				oStateIconBinding = CriticalityMetadata.getCriticalityIcon(oCriticalityInfo.criticalityType);
			}
		}
		if (oViewField.unit) {
			oBindingInfo = {
				parts: [
					{
						path: oViewField.name,
						type: oType
					}, {
						path: oViewField.unit
					}
				],
				formatter: oViewField.isCurrencyField ? FormatUtil.getInlineAmountFormatter() : FormatUtil.getInlineMeasureUnitFormatter(),
				useRawValues: oViewField.isCurrencyField
			};
		} else if (oViewField.description) {
			oBindingInfo = {
				path: oViewField.description
			};
		} else {
			oBindingInfo = {
				path: oViewField.name,
				type: oType
			};
		}
		return new ObjectStatus({
			text: oBindingInfo,
			state: oStateBinding,
			icon: oStateIconBinding
		});
	};

	/**
	 * Creates and extends the field view with a template for currency (display only) content
	 * 
	 * @param {object} oViewField - the view field
	 * @param {object} oType - the binding data type
	 * @param {function} fCreateControl - callback function which creates the control which would have been created instead of the SmartLink
	 * @returns {Object} the template
	 * @private
	 */
	ControlProvider.prototype._createSmartLinkFieldTemplate = function(oViewField, oType, fCreateControl) {
		// semantic link
		var oBindingInfo = oViewField.unit ? {
			parts: [
				{
					path: oViewField.name,
					type: oType
				}, {
					path: oViewField.unit
				}
			],
			formatter: oViewField.isCurrencyField ? FormatUtil.getAmountCurrencyFormatter() : FormatUtil.getMeasureUnitFormatter(),
			useRawValues: true
		} : this._getDefaultBindingInfo(oViewField, oType);
		var oTemplate = new SmartLink({
			semanticObject: oViewField.semanticObjects.defaultSemanticObject,
			additionalSemanticObjects: oViewField.semanticObjects.additionalSemanticObjects,
			semanticObjectLabel: oViewField.label,
			fieldName: oViewField.name,
			text: oBindingInfo,
			uom: oViewField.unit ? {
				path: oViewField.unit
			} : undefined,
			wrapping: this._isMobileTable,
			semanticObjectController: this._oSemanticObjectController,
			navigationTargetsObtained: function(oEvent) {
				var oBinding = this.getBinding("text");
				if (!jQuery.isArray(oBinding.getValue()) || oViewField.unit) {
					oEvent.getParameters().show();
					return;
				}
				var aValues = oBinding.getValue();
				var oTexts = FormatUtil.getTextsFromDisplayBehaviour(oViewField.displayBehaviour, aValues[0], aValues[1]);
				var oMainNavigation = oEvent.getParameters().mainNavigation;
				// 'mainNavigation' might be undefined
				if (oMainNavigation) {
					oMainNavigation.setDescription(oTexts.secondText);
				}
				oEvent.getParameters().show(oTexts.firstText, oMainNavigation, undefined, undefined);
			}
		});

		oTemplate.setCreateControlCallback(fCreateControl);

		return oTemplate;
	};

	/**
	 * Creates and extends the field view with a template for currency (display only) content
	 * 
	 * @param {object} oViewField - the view field
	 * @param {object} oType - the odata binding data type
	 * @private
	 * @returns {Object} the template
	 */
	ControlProvider.prototype._createMeasureFieldTemplate = function(oViewField, oType) {
		var oTemplate, oAnalyticalMultiUnitLink, oAnalyticalMultiUnitCurrency, oValueText, oUnitText, bEnableCurrencySymbol = false;

		bEnableCurrencySymbol = !!(oViewField.isCurrencyField && this._oCurrencyFormatSettings && this._oCurrencyFormatSettings.showCurrencySymbol);

		oValueText = new Text({
			layoutData: new sap.m.FlexItemData({
				growFactor: 1,
				baseSize: "0%"
			}),
			textDirection: "LTR",
			wrapping: false,
			textAlign: "End",
			text: {
				parts: [
					{
						path: oViewField.name,
						type: oType
					}, {
						path: oViewField.unit
					}
				],
				formatter: oViewField.isCurrencyField ? FormatUtil.getAmountCurrencyFormatter() : FormatUtil.getMeasureUnitFormatter(),
				useRawValues: oViewField.isCurrencyField
			}
		});
		oUnitText = new Text({
			layoutData: new sap.m.FlexItemData({
				shrinkFactor: 0
			}),
			textDirection: "LTR",
			wrapping: false,
			textAlign: "Begin",
			width: "2.5em",
			text: {
				path: oViewField.unit,
				formatter: bEnableCurrencySymbol ? FormatUtil.getCurrencySymbolFormatter() : undefined
			}
		});

		// Create measure format using HBox --> we need to 2 controls to properly align the value and unit part
		oTemplate = new HBox({
			renderType: "Bare",
			justifyContent: "End",
			items: [
				oValueText, oUnitText
			]
		});

		oTemplate.addStyleClass("sapUiCompDirectionLTR");

		if (oViewField.isCurrencyField && this._isAnalyticalTable) {
			if (!this._oMultiCurrencyUtil) {
				jQuery.sap.require("sap.ui.comp.util.MultiCurrencyUtil");
				this._oMultiCurrencyUtil = sap.ui.comp.util.MultiCurrencyUtil;
			}
			oAnalyticalMultiUnitLink = new Link({
				text: sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTTABLE_MULTI_LINK_TEXT") || "Show Details",
				visible: {
					path: oViewField.unit,
					formatter: this._oMultiCurrencyUtil.isMultiCurrency
				},
				press: function(oEvt) {
					this._oMultiCurrencyUtil.openMultiCurrencyPopover(oEvt, {
						currency: oViewField.name,
						unit: oViewField.unit,
						additionalParent: this.useSmartToggle,
						smartTableId: this._smartTableId,
						template: oAnalyticalMultiUnitCurrency
					});
				}.bind(this)
			});
			oAnalyticalMultiUnitCurrency = oTemplate;
			oAnalyticalMultiUnitCurrency.bindProperty("visible", {
				path: oViewField.unit,
				formatter: function(sCurrency) {
					return !this._oMultiCurrencyUtil.isMultiCurrency(sCurrency);
				}.bind(this)
			});
			oTemplate = new VBox({
				renderType: "Bare",
				items: [
					oAnalyticalMultiUnitLink, oAnalyticalMultiUnitCurrency
				]
			});
		}

		return oTemplate;
	};

	/**
	 * Calculates and sets additional flags and attributes for a field
	 * 
	 * @param {object} oFieldODataMetadata - OData metadata for the field
	 * @returns {object} the field view metadata
	 * @private
	 */
	ControlProvider.prototype._createFieldMetadata = function(oFieldODataMetadata) {
		var oFieldViewMetadata = jQuery.extend({}, oFieldODataMetadata);

		oFieldViewMetadata.label = oFieldODataMetadata.fieldLabel || oFieldODataMetadata.name;
		oFieldViewMetadata.quickInfo = oFieldODataMetadata.quickInfo || oFieldViewMetadata.label;
		oFieldViewMetadata.displayBehaviour = oFieldViewMetadata.displayBehaviour || this._oDefaultDropDownDisplayBehaviour;
		oFieldViewMetadata.filterType = this._getFilterType(oFieldODataMetadata);
		this._updateValueListMetadata(oFieldViewMetadata);
		this._setAnnotationMetadata(oFieldViewMetadata);
		return oFieldViewMetadata;
	};

	/**
	 * Update the metadata for ValueList annotation
	 * 
	 * @param {Object} oFieldViewMetadata - view metadata for the field
	 * @private
	 */
	ControlProvider.prototype._updateValueListMetadata = function(oFieldViewMetadata) {
		// First check for "sap:value-list" annotation
		oFieldViewMetadata.hasValueListAnnotation = oFieldViewMetadata["sap:value-list"] !== undefined;
		if (oFieldViewMetadata.hasValueListAnnotation) {
			oFieldViewMetadata.hasFixedValues = oFieldViewMetadata["sap:value-list"] === "fixed-values";
		} else if (oFieldViewMetadata["com.sap.vocabularies.Common.v1.ValueList"]) {
			// Then check for "com.sap.vocabularies.Common.v1.ValueList", and retrieve the semantics
			oFieldViewMetadata.hasValueListAnnotation = true;
			oFieldViewMetadata.hasFixedValues = this._oMetadataAnalyser.getValueListSemantics(oFieldViewMetadata["com.sap.vocabularies.Common.v1.ValueList"]) === "fixed-values";
		}
	};

	/**
	 * Set any annotation(s) metadata on the control
	 * 
	 * @param {Object} oFieldViewMetadata - the field view metadata
	 * @private
	 */
	ControlProvider.prototype._setAnnotationMetadata = function(oFieldViewMetadata) {
		if (oFieldViewMetadata && oFieldViewMetadata.fullName) {
			oFieldViewMetadata.semanticObjects = this._oMetadataAnalyser.getSemanticObjectsFromAnnotation(oFieldViewMetadata.fullName);
		}
	};
	/**
	 * Returns the filterType of the field based on metadata, else undefined
	 * 
	 * @param {object} oField - OData metadata for the field
	 * @returns {string} the filter type for the field
	 * @private
	 */
	ControlProvider.prototype._getFilterType = function(oField) {
		if (ODataType.isNumeric(oField.type)) {
			return "numeric";
		} else if (oField.type === "Edm.DateTime" && oField.displayFormat === "Date") {
			return "date";
		} else if (oField.type === "Edm.String") {
			return "string";
		} else if (oField.type === "Edm.Boolean") {
			return "boolean";
		} else if (oField.type === "Edm.Time") {
			return "time";
		}
		return undefined;
	};

	/**
	 * Destroys the object
	 * 
	 * @public
	 */
	ControlProvider.prototype.destroy = function() {
		var fDestroy = function(aArray) {
			var i;
			if (aArray) {
				i = aArray.length;
				while (i--) {
					aArray[i].destroy();
				}
			}
		};

		if (this._oMetadataAnalyser && this._oMetadataAnalyser.destroy) {
			this._oMetadataAnalyser.destroy();
		}
		this._oMetadataAnalyser = null;

		if (!this._bSemanticKeyAdditionalControlUsed && this._oSemanticKeyAdditionalControl && this._oSemanticKeyAdditionalControl.destroy) {
			this._oSemanticKeyAdditionalControl.destroy();
		}

		fDestroy(this._aValueHelpProvider);
		this._aValueHelpProvider = null;

		fDestroy(this._aValueListProvider);
		this._aValueListProvider = null;

		fDestroy(this._aLinkHandlers);
		this._aLinkHandlers = null;

		if (this._oHelper) {
			this._oHelper.destroy();
		}

		this._oHelper = null;
		this._mSmartField = null;
		this._aODataFieldMetadata = null;
		this._oDateFormatSettings = null;
		this._oCurrencyFormatSettings = null;
		this._oDefaultDropDownDisplayBehaviour = null;
		this._oLineItemAnnotation = null;
		this._oSemanticKeyAnnotation = null;
		this._oParentODataModel = null;
		this.bIsDestroyed = true;
	};

	SmartToggle = Control.extend("sap.ui.comp.SmartToggle", {
		metadata: {
			library: "sap.ui.comp",
			properties: {
				editable: {
					type: "boolean",
					defaultValue: false
				}
			},
			aggregations: {
				edit: {
					type: "sap.ui.core.Control",
					multiple: false
				},
				display: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			},
			associations: {
				ariaLabelledBy: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "ariaLabelledBy"
				}
			}
		},
		renderer: function(rm, oControl) {
			rm.write("<span ");
			rm.writeControlData(oControl);
			rm.addClass("sapUiCompSmartToggle");
			rm.writeClasses();
			rm.write(">");
			rm.renderControl(oControl.getEditable() ? oControl.getEdit() : oControl.getDisplay());
			rm.write("</span>");
		}
	});

	/**
	 * @see sap.ui.core.Element#getFocusDomRef
	 * @protected
	 * @return {Element} Returns the DOM Element that should get the focus
	 */
	SmartToggle.prototype.getFocusDomRef = function() {
		// get and return the accessibility info of the control that is rendered currently
		var oControl = this.getEditable() ? this.getEdit() : this.getDisplay();
		if (oControl) {
			return oControl.getFocusDomRef();
		}
		return Control.prototype.getFocusDomRef.call(this);
	};

	/**
	 * @see sap.ui.core.Control#getAccessibilityInfo
	 * @protected
	 * @returns {Object} Accessibility Info
	 */
	SmartToggle.prototype.getAccessibilityInfo = function() {
		// get and return the accessibility info of the control that is rendered currently
		var oControl = this.getEditable() ? this.getEdit() : this.getDisplay();
		if (oControl && oControl.getAccessibilityInfo) {
			return oControl.getAccessibilityInfo();
		}

		return null;
	};

	/**
	 * @see sap.ui.base.ManagedObject#addAssociation
	 * @protected
	 * @returns {Object} Forwards the association of the inner control to the <code>SmartToggle</code> control for adding association.
	 */
	SmartToggle.prototype.addAssociation = function(sAssociationName, sId, bSuppressInvalidate) {
		if (sAssociationName === "ariaLabelledBy") {
			// get both, edit and display controls
			var oEditControl = this.getEdit(), oDisplayControl = this.getDisplay();
			// forward the ariaLabelledBy association of the inner control to the SmartToggle control
			oEditControl && oEditControl.addAssociation(sAssociationName, sId, bSuppressInvalidate);
			oDisplayControl && oDisplayControl.addAssociation(sAssociationName, sId, bSuppressInvalidate);
		}
		return Control.prototype.addAssociation.apply(this, arguments);
	};

	/**
	 * @see sap.ui.base.ManagedObject#removeAssociation
	 * @protected
	 * @returns {Object} Forwards the association of the inner control to the <code>SmartToggle</code> control for removing the specified
	 *          association.
	 */
	SmartToggle.prototype.removeAssociation = function(sAssociationName, vObject, bSuppressInvalidate) {
		if (sAssociationName === "ariaLabelledBy") {
			// get both, edit and display controls
			var oEditControl = this.getEdit(), oDisplayControl = this.getDisplay();
			// forward the ariaLabelledBy association of the inner control to the SmartToggle control
			oEditControl && oEditControl.removeAssociation(sAssociationName, vObject, bSuppressInvalidate);
			oDisplayControl && oDisplayControl.removeAssociation(sAssociationName, vObject, bSuppressInvalidate);
		}
		return Control.prototype.removeAssociation.apply(this, arguments);
	};

	/**
	 * @see sap.ui.base.ManagedObject#removeAllAssociation
	 * @protected
	 * @returns {Object} Forwards the association of the inner control to the <code>SmartToggle</code> control for removing all association.
	 */
	SmartToggle.prototype.removeAllAssociation = function(sAssociationName, bSuppressInvalidate) {
		if (sAssociationName === "ariaLabelledBy") {
			// get both, edit and display controls
			var oEditControl = this.getEdit(), oDisplayControl = this.getDisplay();
			// forward the ariaLabelledBy association of the inner control to the SmartToggle control
			oEditControl && oEditControl.removeAllAssociation(sAssociationName, bSuppressInvalidate);
			oDisplayControl && oDisplayControl.removeAllAssociation(sAssociationName, bSuppressInvalidate);
		}
		return Control.prototype.removeAllAssociation.apply(this, arguments);
	};

	return ControlProvider;

}, /* bExport= */true);
