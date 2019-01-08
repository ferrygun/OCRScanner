/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */
sap.ui.define(["jquery.sap.global", "./FieldSelectorModelConverter"],
	function(jQuery, ModelConverter) {
	"use strict";


	/**
	 * Constructs a utility class to analyse the OData metadata document ($metadata), to resolve SAP-Annotations
	 *
	 * @constructor
	 * @public
	 * @author Niels Hebling
	 */
	var FieldSelectorController = function() {
		this._oModelConverter = null;
		this._oFields = {};
		this._aIgnoredFields = [];
	};

	/**
	 * Initialize the controller by providing a reference to the OData model and optionally a special entity set and/or a list of fields which should be ignored.
	 * @param {sap.ui.model.odata.ODataModel} oODataModel - OData model
	 * @param {string|array} [vEntityTypes] - Entity type name(s) separated by comma-character or array. If empty all available EntityTypes will be taken into account.
	 * @param {Array} [aIgnoredFields] - List of fields which should be ignored
	 * @param {Object.<bindingPath:string, fieldListElement:Object>} [mBindingPathToFieldListElement] - Map absolute odata binding paths to the field list elements
	 * @param {Object.<id:string, fieldListElement:Object>} [mIdToFieldListElement] - Map field list element ids to the field list elements
	 */
	FieldSelectorController.prototype.init = function(oODataModel, vEntityTypes, aIgnoredFields, mBindingPathToFieldListElement, mIdToFieldListElement){

		if (!oODataModel) {
			jQuery.sap.log.error("oModel has to be set otherwise nothing will be displayed");
		}

		this._oModelConverter = new ModelConverter(oODataModel);
		if (!vEntityTypes){
			vEntityTypes = this._oModelConverter.getAllEntityTypeNames();
		}

		if (!aIgnoredFields){
			aIgnoredFields = [];
		}

		var oConvertedModel = this._oModelConverter.getConvertedModel(vEntityTypes, aIgnoredFields);
		if (mBindingPathToFieldListElement && mIdToFieldListElement) {
			var aFieldsNotBoundToODataService = this._updateFieldLabelsAndDetermineFieldsNotBoundToODataService(oConvertedModel, mBindingPathToFieldListElement, mIdToFieldListElement);
			this._addFieldsNotBoundToODataService(oConvertedModel, aFieldsNotBoundToODataService);
		}
		this._sortFields(oConvertedModel);
	};

	/**
	 * Check each label of the field selector if it is in synch with the corresponding label of the field list.
	 * If a label of the field selector is not in synch, then set it to the label of the field list.
	 * @param {Object} oConvertedModel Model of the OData service converted into a simple list
	 * @param {Object.<bindingPath:string, fieldListElement:Object>} [mBindingPathToFieldListElement] - Map absolute odata binding paths to the field list elements
	 * @param {Object.<id:string, fieldListElement:Object>} [mIdToFieldListElement] - Map field list element ids to the field list elements
	 */
	FieldSelectorController.prototype._updateFieldLabelsAndDetermineFieldsNotBoundToODataService = function(oConvertedModel, mBindingPathToFieldListElement, mIdToFieldListElement) {
		var that = this;
		jQuery.each(oConvertedModel, function(key, aDataServiceFields) {
			jQuery.each(aDataServiceFields, function(index, oDataServiceField) {
				if (oDataServiceField.entityName && oDataServiceField.name) {
					if (key !== oDataServiceField.entityName) { // complex type case
						var oMetaDataAnalyzer = that.getMetaDataAnalyzer();
						var sPropertyNameOfCmplxField = oMetaDataAnalyzer._getNameOfPropertyUsingComplexType(key, oDataServiceField.entityName);
						if (sPropertyNameOfCmplxField){
							var oFieldListElement = mBindingPathToFieldListElement[key + "/" + sPropertyNameOfCmplxField + "/" + oDataServiceField.name];
							if (oFieldListElement) {
								oFieldListElement.isBoundToODataService = true;
								var sFieldListLabel = oFieldListElement.label;
								if (sFieldListLabel && (sFieldListLabel !== oDataServiceField.fieldLabel)) {
									oDataServiceField.fieldLabel = sFieldListLabel;
								}
								if (mIdToFieldListElement) {
									// reduce mIdToFieldListElement by removing all mBindingPathToFieldListElement[x].id, where x is a valid odata service binding path
									delete mIdToFieldListElement[oFieldListElement.id];
								}
							}
						} else {
							jQuery.sap.log.error("FieldSelector: Property of complex type " + oDataServiceField.name + " not found on entityType " + key);
						}
					} else { // non complex type case
						var oFieldListElement = mBindingPathToFieldListElement[oDataServiceField.entityName + '/' + oDataServiceField.name];
						if (oFieldListElement) {
							oFieldListElement.isBoundToODataService = true;
							var sFieldListLabel = oFieldListElement.label;
							if (sFieldListLabel && (sFieldListLabel !== oDataServiceField.fieldLabel)) {
								oDataServiceField.fieldLabel = sFieldListLabel;
							}
							if (mIdToFieldListElement) {
								// reduce mIdToFieldListElement by removing all mBindingPathToFieldListElement[x].id, where x is a valid odata service binding path
								delete mIdToFieldListElement[oFieldListElement.id];
							}
						}
					}
				}
			});
		});

		this._removeFieldsFromList(mIdToFieldListElement, mBindingPathToFieldListElement, this._oModelConverter.invisibleFields);

		var aFieldsNotBoundToODataService = [];
		jQuery.each(mIdToFieldListElement, function(key, oFieldListElement) {
			aFieldsNotBoundToODataService.push(oFieldListElement);
		});

		return aFieldsNotBoundToODataService;
	};

	FieldSelectorController.prototype._removeFieldsFromList = function (mFieldsList, mBindingPathToFieldListElement, mFieldsToRemove) {
		var that = this;

		if (!mFieldsList || !mFieldsToRemove) {
			return;
		}

		jQuery.each(mFieldsToRemove, function(key, oFields) {
			jQuery.each(oFields, function(index, oField) {
				if (oField.entityName && oField.name) {
					if (key !== oField.entityName) { // complex type case
						var oMetaDataAnalyzer = that.getMetaDataAnalyzer();
						var sPropertyNameOfCmplxField = oMetaDataAnalyzer._getNameOfPropertyUsingComplexType(key, oField.entityName);
						if (sPropertyNameOfCmplxField) {
							var oFieldListElement = mBindingPathToFieldListElement[key + "/" + sPropertyNameOfCmplxField + "/" + oField.name];
							if (oFieldListElement) {
								delete mFieldsList[oField.id];
							}
						} else {
							jQuery.sap.log.error("FieldSelector: Property of complex type " + oField.name + " not found on entityType " + key);
						}
					} else { // non complex type case
						var oFieldListElement = mBindingPathToFieldListElement[oField.entityName + '/' + oField.name];
						if (oFieldListElement) {
							delete mFieldsList[oField.id];
						}
					}
				}
			});
		});
	};

	FieldSelectorController.prototype._addFieldsNotBoundToODataService = function(oConvertedModel, aFieldsNotBoundToODataService) {
		var fnEntityTypePushConvertelModelElementToConvertedModel = function(oConvertedModelElement, oEntityType) {
			if (!oConvertedModel[oEntityType.key]) {
				oConvertedModel[oEntityType.key] = [];
			}
			oConvertedModel[oEntityType.key].push(oConvertedModelElement);
		};

		var fnAddFieldsToConvertedModel = function(oFieldListElement){
			oFieldListElement.isBoundToODataService = false;
			// id property is used in the converted model for identifying fields, which are not bound to odata service
			// fieldLabel property stores the label of the field, which is not bound to odata service
			var oConvertedModelElement = { id: oFieldListElement.id, fieldLabel: oFieldListElement.label };
			var aEntityTypes = this._oModelConverter.getEntityTypes();
			aEntityTypes.forEach(fnEntityTypePushConvertelModelElementToConvertedModel.bind(null, oConvertedModelElement));
		};

		aFieldsNotBoundToODataService.forEach(fnAddFieldsToConvertedModel.bind(this));
	};

	/**
	 * Sort all fields from the converted model into a map of fields arranged by entity sets.
	 * @param {Object} oConvertedModel Model of the OData service converted into a simple list.
	 */
	FieldSelectorController.prototype._sortFields = function(oConvertedModel){
		var that = this;
		jQuery.each(oConvertedModel, function(key, value) {
			that._oFields[key] = value;
			that.sortFieldsForEntity.call(that, key);
		});
	};

	/**
	 * Sort all fields of an entity.
	 * @param {string} sEntityName name of the entity.
	 */
	FieldSelectorController.prototype.sortFieldsForEntity = function(sEntityName){
		this._oFields[sEntityName] = this._oFields[sEntityName].sort(function(a, b) {
			if (a.fieldLabel > b.fieldLabel) {
				return 1;
			}
			if (a.fieldLabel < b.fieldLabel) {
				return -1;
			}
			// a must be equal to b
			return 0;
		});
	};

	/**
	 * Get all fields of the service sorted by entity set. The fields itself are sorted by the alphabet.
	 * @returns {Object} Returns all fields of the service ordered by entity set
	 * @example {
	 * 				"entitySet_1":{
	 * 					"Field_D",
	 * 					"Field_E"
	 * 				},
	 * 				"entitySet_2":{
	 * 					"Field_A",
	 * 					"Field_B"
	 * 				}
	 * 			}
	 */
	FieldSelectorController.prototype.getFields = function(){
		return this._oFields;
	};

	/**
	 * Get all entity types of the OData service
	 * @returns {Array} Returns the list of entity types of the OData service
	 */
	FieldSelectorController.prototype.getEntityTypes = function(){
		return this._oModelConverter.getEntityTypes();
	};

	/**
	 * Get the metadata analyzer
	 * @returns {Object} Returns a reference to the metadata analyzer of the current service
	 */
	FieldSelectorController.prototype.getMetaDataAnalyzer = function(){
		return this._oModelConverter.getMetaDataAnalyzer();
	};

	/**
	 * Get maximum number of rows in all entitysets returned in the table data.
	 * @returns {Number} Returns the maximum number of rows available in the largest EntitySet.
	 */
	FieldSelectorController.prototype.getMaxEntitySetSize = function(){
		var maxCount = 0;
		if (this._oFields){
			jQuery.each(this._oFields, function(key, value){
				if (value && value.length){
					if (value.length > maxCount){
						maxCount = value.length;
					}
				}
			});
		}
		return maxCount;
	};

	/**
	 * Destroy the current instance
	 */
	FieldSelectorController.prototype.destroy = function(){
		if (this._oModelConverter){
			this._oModelConverter.destroy();
		}
		this._oModelConverter = null;
		this._oFields = null;

	};

	return FieldSelectorController;
}, /* bExport= */ true);
