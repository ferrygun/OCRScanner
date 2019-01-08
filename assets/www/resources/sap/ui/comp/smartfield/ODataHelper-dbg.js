/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Utility class to access OData Meta Data.
 *
 * @name sap.ui.comp.smartfield.ODataHelper
 * @author SAP SE
 * @version 1.52.4
 * @private
 * @since 1.28.0
 * @returns {sap.ui.comp.smartfield.ODataHelper} the new instance.
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/comp/odata/MetadataAnalyser", "sap/ui/comp/smartfield/AnnotationHelper"
], function(jQuery, MetadataAnalyser, Annotation) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 * @param {sap.ui.model.odata.ODataModel} oModel the OData model currently used
	 * @param {sap.ui.comp.smartfield.BindingUtil} oUtil a reference to the binding utility
	 * @param {sap.ui.model.odata.ODataMetaModel} oMetaModel the given OData meta model
	 */
	var ODataHelper = function(oModel, oUtil, oMetaModel) {
		if (oModel) {
			this.oMeta = oModel.getMetaModel();
		}

		if (oMetaModel) {
			this.oMeta = oMetaModel;
		}

		this._oModel = oModel;
		this._oUtil = oUtil;
		this.oAnnotation = new Annotation();
	};

	/**
	 * Returns a reference to the meta data analyzer and creates it lazily.
	 *
	 * @param {object} [oModel] The model instance
	 * @returns {sap.ui.comp.odata.MetaDataAnalyser} meta data analyzer
	 * @public
	 */
	ODataHelper.prototype.getAnalyzer = function(oModel) {
		if (!this._oAnalyzer) {
			this._oAnalyzer = new MetadataAnalyser(this._oModel || oModel);
		}

		return this._oAnalyzer;
	};

	/**
	 * Checks whether the current path contains a sequence of navigation properties and corrects the current meta data accordingly. Especially the
	 * optional property <code>navigationPath</code> is added to the meta data.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {sap.ui.core.Control} oControl the control
	 * @public
	 */
	ODataHelper.prototype.checkNavigationProperty = function(oMetaData, oControl) {
		var mPaths, sPath, len, oResult;

		if (oControl && oMetaData) {
			mPaths = this._oUtil.getNavigationProperties(oControl);
			len = mPaths.paths.length;

			while (len--) {
				sPath = mPaths.paths.shift();
				sPath = this._oUtil.correctPath(sPath);

				if (sPath === "" || sPath === oMetaData.entitySet.name) {
					continue;
				}

				oResult = this.getNavigationProperty(oMetaData.entityType, sPath);

				if (oResult.entitySet) {
					oMetaData.entitySet = oResult.entitySet;
					oMetaData.entityType = oResult.entityType;
				}
			}
		}
	};

	/**
	 * Checks whether a path addresses a navigation property and returns the target entity set and entity type, if this is the case.
	 *
	 * @param {object} oEntityType the OData entity type definition
	 * @param {string} sPath the binding path
	 * @returns {object} the target entity set and entity type.
	 * @public
	 */
	ODataHelper.prototype.getNavigationProperty = function(oEntityType, sPath) {
		var oNavi, oTarget, oResult = {};

		oNavi = this._getNamedProperty(sPath, "navigationProperty", oEntityType);

		if (oNavi) {
			oTarget = this.oMeta.getODataAssociationSetEnd(oEntityType, oNavi.name);
			oResult.entitySet = this.oMeta.getODataEntitySet(oTarget.entitySet);
			oResult.entityType = this.oMeta.getODataEntityType(oResult.entitySet.entityType);
		}

		return oResult;
	};

	/**
	 * Checks whether a given paths starts with a navigation property.
	 *
	 * @param {string} sPath the given path.
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @returns {string} the first navigation property, if the given paths starts with a navigation property, <code>null</code> otherwise
	 * @public
	 */
	ODataHelper.prototype.startWithNavigationProperty = function(sPath, oMetaData) {
		var aPath = sPath.split("/"), oProperty;

		if (aPath && aPath.length > 1) {
			oProperty = this._getNamedProperty(aPath.shift(), "navigationProperty", oMetaData.entityType);
		}

		if (oProperty) {
			return oProperty.name;
		}

		return null;
	};

	/**
	 * Calculates the definition of a property of an entity type.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.entityType the OData entity type definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @public
	 */
	ODataHelper.prototype.getProperty = function(oMetaData) {
		var aNavigation = [], len, aProp, oProp, sPart, sPath, oResult = {
			entityType: oMetaData.entityType,
			entitySet: oMetaData.entitySet
		};

		if (oMetaData) {
			aProp = oMetaData.path.split("/");
			len = aProp.length;

			// check for navigation properties.
			if (len > 1) {
				while (oResult.entityType) {
					sPart = aProp[0];
					oResult = this.getNavigationProperty(oResult.entityType, sPart);

					if (oResult.entityType) {
						oMetaData.entityType = oResult.entityType;
						oMetaData.entitySet = oResult.entitySet;
						aNavigation.push(aProp.shift());
						len--;
					}
				}
			}

			// add navigation path
			oMetaData.navigationPath = aNavigation.join("/");

			// property can be complex.
			if (len > 1) {
				oProp = this.oMeta.getODataProperty(oMetaData.entityType, aProp[0]);

				// property name may be invalid: check for existing prop to avoid exceptions
				if (oProp) {
					oMetaData.property = this._getComplex(oProp, aProp, len);
				}

				return;
			}

			// simple property (can be with and without navigation path)
			if (oMetaData.navigationPath) {
				sPath = oMetaData.path.replace(oMetaData.navigationPath + "/", "");
			} else {
				sPath = oMetaData.path;
			}

			oProp = this.oMeta.getODataProperty(oMetaData.entityType, sPath);
			oMetaData.property = {
				property: oProp,
				typePath: oMetaData.path,
				valueListAnnotation: null
			};
		}
	};

	/**
	 * Returns a complex property.
	 *
	 * @param {object} oProperty the object
	 * @param {array} aProp the path to the OData property
	 * @param {int} iLen the length of the path to the OData property
	 * @returns {object} the complex property
	 * @private
	 */
	ODataHelper.prototype._getComplex = function(oProperty, aProp, iLen) {
		var oObject = oProperty, sTypePath, aComplex = [];

		while (iLen--) {
			if (oObject) {
				if (iLen === 0) {
					sTypePath = oObject.name;
					oObject = this._getNamedProperty(aProp[0], "property", oObject);

					return {
						typePath: sTypePath + "/" + aProp[0],
						property: oObject,
						complex: true,
						parents: aComplex
					};
				}

				oObject = this.oMeta.getODataComplexType(oObject.type);

				if (oObject) {
					aComplex.push(oObject);
				}
			}

			aProp.shift();
		}
	};

	/**
	 * Returns a named property.
	 *
	 * @param {string} sName the name
	 * @param {string} sArray the name of the array to scan for the property
	 * @param {object} oProperty the object
	 * @returns {object} the named property, can be <code>null</code>
	 * @private
	 */
	ODataHelper.prototype._getNamedProperty = function(sName, sArray, oProperty) {
		var oResult;

		if (oProperty[sArray]){
			for (var i = 0; i < oProperty[sArray].length; i++ ){
				if (oProperty[sArray][i].name === sName) {
					oResult = oProperty[sArray][i];
					break;
				}
			}
		}

		return oResult;
	};

	/**
	 * Checks whether an OData property has a <code>text</code> annotation and adds it to the available meta data.
	 *
	 * @param {object} oMetaDataIn the meta data used to create the control
	 * @param {object} oMetaDataIn.entitySet the OData entity set definition
	 * @param {object} oMetaDataIn.entityType the OData entity type definition
	 * @param {object} oMetaDataIn.property the OData property definition
	 * @param {string} oMetaDataIn.path the binding path
	 * @returns {object} the OData property representing the text annotation, if no text annotation is encountered, <code>null</code> is returned
	 * @public
	 */
	ODataHelper.prototype.getTextProperty2 = function(oMetaDataIn) {
		var sAnnotation, oMetaData;

		sAnnotation = this.oAnnotation.getText(oMetaDataIn.property.property);

		if (sAnnotation) {
			oMetaData = this._preprocAnnotation(sAnnotation, oMetaDataIn);
			this.getProperty(oMetaData);
			this._postprocAnnotation(oMetaData, oMetaDataIn);
		}

		return oMetaData;
	};

	/**
	 * Checks whether an OData property represents semantically a unit of measure, e.g. a currency, and returns its definition, if the property
	 * represents a unit of measure.
	 *
	 * @param {object} oMetaDataIn the meta data available
	 * @param {object} oMetaDataIn.entitySet the name of the OData entity set
	 * @param {object} oMetaDataIn.entityType the name of the OData entity type
	 * @returns {object} the OData property representing the unit, if no unit of measure is encountered, <code>null</code> is returned
	 * @public
	 */
	ODataHelper.prototype.getUnitOfMeasure2 = function(oMetaDataIn) {
		var sAnnotation, oMetaData;

		sAnnotation = this.oAnnotation.getUnit(oMetaDataIn.property.property);

		if (sAnnotation) {
			oMetaData = this._preprocAnnotation(sAnnotation, oMetaDataIn);
			this.getProperty(oMetaData);
			this._postprocAnnotation(oMetaData, oMetaDataIn);
		}

		return oMetaData;
	};

	/**
	 * Pre-processes an annotation.
	 *
	 * @param {string} sAnnotation the given annotation
	 * @param {object} oMetaDataIn the meta data available
	 * @param {object} oMetaDataIn.entitySet the name of the OData entity set
	 * @param {object} oMetaDataIn.entityType the name of the OData entity type
	 * @returns {object} the meta data representing the annotation
	 * @private
	 */
	ODataHelper.prototype._preprocAnnotation = function(sAnnotation, oMetaDataIn) {
		var sPath, oMetaData;

		// annotation can contain navigation properties: so get the entity type and set
		// additionally the navigation properties are exposed as "navigation path".
		oMetaData = this.traverseNavigationProperties(sAnnotation, oMetaDataIn.entityType);

		// set the entity set, if it is not returned from the traversal.
		if (!oMetaData.navigationPath) {
			oMetaData.entitySet = oMetaDataIn.entitySet;
		}

		// get the path identifying the property: it may contain complex types,
		// but we know the navigation properties.
		if (oMetaDataIn.navigationPath) {
			oMetaData.path = oMetaDataIn.path.replace(oMetaDataIn.navigationPath + "/", "");
		} else {
			oMetaData.path = oMetaDataIn.path;
		}

		if (oMetaData.navigationPath) {
			sPath = sAnnotation.replace(oMetaData.navigationPath + "/", "");
		} else {
			sPath = sAnnotation;
		}

		oMetaData.path = oMetaData.path.replace(oMetaDataIn.property.property.name, sPath);

		// make sure navigation path does not get lost, if after this method get property is invoked.
		if (oMetaData.navigationPath) {
			oMetaData.navigationPathHelp = oMetaData.navigationPath;
		}

		return oMetaData;
	};

	/**
	 * Post-processes an annotation.
	 *
	 * @param {object} oMetaData the new meta data
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaDataIn the meta data available
	 * @param {object} oMetaDataIn.entitySet the name of the OData entity set
	 * @param {object} oMetaDataIn.entityType the name of the OData entity type
	 * @private
	 */
	ODataHelper.prototype._postprocAnnotation = function(oMetaData, oMetaDataIn) {
		var sPath;

		// make sure navigation path does not get lost, if after this method get property is invoked.
		if (oMetaData.navigationPathHelp) {
			oMetaData.navigationPath = oMetaData.navigationPathHelp;
		}

		// now complete the navigation path of the new meta data.
		if (oMetaData.navigationPath) {
			sPath = oMetaData.navigationPath;
		} else {
			sPath = "";
		}

		if (oMetaDataIn.navigationPath) {
			if (sPath) {
				sPath = oMetaDataIn.navigationPath + "/" + sPath;
			} else {
				sPath = oMetaDataIn.navigationPath;
			}
		}

		oMetaData.navigationPath = sPath;

		// now correct the path of the new meta data, if necessary.
		if (oMetaData.navigationPath) {
			oMetaData.path = oMetaData.navigationPath + "/" + oMetaData.path;
		}
	};

	/**
	 * Traverses the navigation properties contained in a path.
	 *
	 * @param {string} sPath the given path
	 * @param {object} oEntityType the given entity type.
	 * @returns {object} the target entity set and entity type of the navigation properties
	 * @public
	 */
	ODataHelper.prototype.traverseNavigationProperties = function(sPath, oEntityType) {
		var oResult = {}, oResult1 = {}, aPath, sPart, len;

		aPath = sPath.split("/");
		len = aPath.length;
		oResult.entityType = oEntityType;
		oResult1.entityType = oEntityType;

		while (len--) {
			sPart = aPath.shift();

			if (sPart === "") {
				continue;
			}

			oResult1 = this.getNavigationProperty(oResult.entityType, sPart);

			if (!oResult1.entitySet) {
				break;
			}

			oResult.entityType = oResult1.entityType;
			oResult.entitySet = oResult1.entitySet;

			if (oResult.navigationPath) {
				oResult.navigationPath = oResult.navigationPath + "/" + sPart;
			} else {
				oResult.navigationPath = sPart;
			}
		}

		return oResult;
	};

	/**
	 * Calculates the value list annotation for the given property.
	 *
	 * @param {object} oMetaData the meta data available
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {object} the value list annotation or <code>null</code>
	 * @public
	 */
	ODataHelper.prototype.getValueListAnnotationPath = function(oMetaData) {
		var sPath, len;

		if (oMetaData.property.complex) {
			len = oMetaData.property.parents.length - 1;
			sPath = oMetaData.property.parents[len].namespace;
			sPath = sPath + "." + oMetaData.property.typePath;
		} else {
			sPath = oMetaData.entitySet.entityType + "/" + oMetaData.property.property.name;
		}

		return sPath;
	};

	/**
	 * Calculates the value list annotation for the given property, if it represents a unit of measure, and adds it to the meta data as
	 * <code>valuelistuom</code> in the annotations.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.getUOMValueListAnnotationPath = function(oMetaData) {
		var sPath;

		if (oMetaData.annotations.uom) {
			sPath = this.getValueListAnnotationPath(oMetaData.annotations.uom);
		}

		if (sPath) {
			oMetaData.annotations.valuelistuom = sPath;
		}
	};

	/**
	 * Calculates a possibly existing text annotation for the unit in a unit of measure field and add it, if it exists.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.getUOMTextAnnotation = function(oMetaData) {
		if (oMetaData && oMetaData.annotations && oMetaData.annotations.uom) {
			oMetaData.annotations.textuom = this.getTextProperty2(oMetaData.annotations.uom);
		}
	};

	/**
	 * Calculates the entity set a value list annotation for the given property points to and adds it to the meta data as
	 * <code>valuelistentityset</code> in the annotations.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.geValueListEntitySet = function(oMetaData) {
		if (oMetaData && oMetaData.annotations && oMetaData.annotations.valuelist) {
			if (oMetaData.annotations.valuelist.primaryValueListAnnotation && oMetaData.annotations.valuelist.primaryValueListAnnotation.valueListEntitySetName) {
				oMetaData.annotations.valuelistentityset = this.oMeta.getODataEntitySet(oMetaData.annotations.valuelist.primaryValueListAnnotation.valueListEntitySetName);
			}
		}
	};

	/*
	 * Gets the metadata property.
	 *
	 * @returns {object} The metadata property
	 * @protected
	 * @since 1.48
	 */
	ODataHelper.prototype.getEdmProperty = function(oMetaData) {
		var oMetadataProperty = oMetaData.property;
		return (oMetadataProperty && oMetadataProperty.property) || null;
	};

	/**
	 * Adds the value list data to the given meta data.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @public
	 */
	ODataHelper.prototype.getValueListData = function(oMetaData) {
		var oMetadataProperty = this.getEdmProperty(oMetaData),
			oAnnotations = oMetaData.annotations;

		if (MetadataAnalyser.isValueList(oMetadataProperty)) {
			oAnnotations.valuelist = this.getValueListAnnotationPath(oMetaData);

			var sValueList = MetadataAnalyser.getValueListMode(oMetadataProperty);

			if (sValueList) {
				oAnnotations.valuelistType = sValueList;
			} else {
				oAnnotations.valuelistType = this.getAnalyzer().getValueListSemantics(oMetadataProperty["com.sap.vocabularies.Common.v1.ValueList"]);
			}
		}
	};

	/**
	 * Calculates the binding path for the <code>text</code> property for the display use case. If a text annotation exists, it is considered,
	 * otherwise the binding path addresses the property.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {string} the binding path
	 * @public
	 */
	ODataHelper.prototype.getEdmDisplayPath = function(oMetaData) {
		if (oMetaData.annotations.text) {
			return oMetaData.annotations.text.path;
		}

		return oMetaData.path;
	};

	/**
	 * Calculates the binding path for the Unit of Measure.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model.
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {string} the binding path for the Unit of Measure text, which can be <code>null</code>
	 * @public
	 */
	ODataHelper.prototype.getUOMPath = function(oMetaData) {
		if (oMetaData && oMetaData.annotations && oMetaData.annotations.uom) {
			return oMetaData.annotations.uom.path;
		}

		return null;
	};

	/**
	 * Calculates the type path for the Unit of Measure.
	 *
	 * @param {object} oMetaData the meta data used to initialize the factory
	 * @param {object} oMetaData.entitySet the name of the OData entity set
	 * @param {object} oMetaData.entityType the name of the OData entity type
	 * @param {object} oMetaData.property the name of the OData property
	 * @param {string} oMetaData.model the name of the model
	 * @param {string} oMetaData.path the path identifying the OData property
	 * @param {object} oMetaData.annotations the current annotations
	 * @returns {string} the binding path for the Unit of Measure text, which can be <code>null</code>
	 * @public
	 */
	ODataHelper.prototype.getUOMTypePath = function(oMetaData) {

		if (oMetaData.property.complex) {
			return oMetaData.property.typePath.replace(oMetaData.property.property.name, oMetaData.annotations.uom.property.name);
		}

		return oMetaData.annotations.uom.property.name;
	};

	/**
	 * Returns an event handler for the change event in unit of measure use cases.
	 *
	 * @param {sap.ui.core.Control} oControl the control which propagates the event
	 * @param {boolean} bUnit flag indicating whether the measure or the unit is affected by the change
	 * @returns {function} handler for the change event in unit of measure use cases.
	 * @public
	 */
	ODataHelper.prototype.getUOMChangeHandler = function(oControl, bUnit) {
		return function(oParam) {
			try {
				oControl.fireChange({
					value: oParam.mParameters.value,
					newValue: oParam.mParameters.value,
					unitChanged: bUnit,
					validated: oParam.mParameters["validated"]
				});
			} catch (ex) {
				jQuery.sap.log.warning(ex);
			}
		};
	};

	/**
	 * Returns an event handler for the selection change event.
	 *
	 * @param {sap.ui.core.Control} oControl the control which propagates the event
	 * @returns {function} handler for the selection change event
	 * @public
	 */
	ODataHelper.prototype.getSelectionChangeHandler = function(oControl) {
		return function(oParam) {
			var sKey = "";

			try {
				var oItem = oParam.getParameter("selectedItem");

				if (oItem) {
					sKey = oItem.getKey();
				}

				oControl.fireChange({
					value: sKey,
					newValue: sKey,
					selectionChange: true
				});
			} catch (ex) {
				jQuery.sap.log.warning(ex);
			}
		};
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	ODataHelper.prototype.destroy = function() {

		if (this._oAnalyzer) {
			this._oAnalyzer.destroy();
		}

		if (this.oAnnotation) {
			this.oAnnotation.destroy();
		}

		this._oUtil = null;
		this.oMeta = null;
		this.oAnalyzer = null;
		this.oAnnotation = null;
	};

	/**
	 * This method is used to scan the meta data annotations for hidden navigation properties and expand them in advance.
	 * This is done in order to be prepared for new fields on the view that may need these annotations.
	 *
	 * @param {object} oMetadataProperty - The meta data for this smart field control
	 * @returns {string} A comma separated list of auto expand properties
	 *
	 * @public
	 * @since 1.48
	 */
	ODataHelper.prototype.getAutoExpandProperties = function(oMetadataProperty) {
		var aNavigationProperties = [],
			aAsPath = [];

		for (var sAnnotation in oMetadataProperty) {
			switch (sAnnotation) {
				case "com.sap.vocabularies.Common.v1.Text":
				case "Org.OData.Measures.V1.Unit":
				case "Org.OData.Measures.V1.ISOCurrency":
				case "com.sap.vocabularies.Common.v1.FieldControl":

					if (oMetadataProperty[sAnnotation].Path) {
						aAsPath = oMetadataProperty[sAnnotation].Path.split("/");
					}

					break;

				// no default
			}

			if (aAsPath.length > 1 && aNavigationProperties.indexOf(aAsPath[0]) < 0) {
				aNavigationProperties.push(aAsPath[0]);
			}
		}

		return aNavigationProperties.join(",");
	};

	/**
	 * Loads the <code>ValueList</code> annotation of the <code>com.sap.vocabularies.Common.v1</code> vocabulary
	 * for the specified property's path.
	 * In addition, if the <code>ValueList</code> annotation cannot be loaded, an error message is logged in the console.
	 *
	 * @param {string} sPath The fully qualified URL path name of the property
	 * @returns {Promise} A <code>Promise</code> that is resolved once the <code>ValueList</code> annotation is
	 * loaded or rejected if the specified property path is incorrect or the <code>ValueList</code> could not be resolved
	 *
	 * @protected
	 * @since 1.52
	 */
	ODataHelper.prototype.loadValueListAnnotation = function(sPath) {
		var oPromise = this.getAnalyzer().getValueListAnnotationLazy(sPath);

		oPromise.catch(function() {
			jQuery.sap.log.error("The value list annotation could not be loaded", undefined, "sap.ui.comp.smartfield.ODataHelper.loadValueListAnnotation");
		});

		return oPromise;
	};

	return ODataHelper;
}, true);
