/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2017 SAP SE. All rights reserved
	
 */

/**
 * Field Control Implementation for <code>SmartField</code> Control. The implementation operates on OData meta data.
 *
 * @name sap.ui.comp.smartfield.FieldControl
 * @author SAP SE
 * @version 1.52.4
 * @private
 * @since 1.28.0
 * @returns {sap.ui.comp.smartfield.FieldControl} the field control class.
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/comp/smartfield/BindingUtil", "sap/ui/model/ParseException"
], function(jQuery, BindingUtil, ParseException) {
	"use strict";

	/**
	 * @private
	 * @constructor
	 * @param {sap.ui.core.Control} oParent the parent control.
	 * @param {sap.ui.comp.smartfield.ODataHelper} oHelper a reference to the oData helper implementation.
	 */
	var FieldControl = function(oParent, oHelper) {
		this._bIsDestroyed = false;
		this._oBinding = new BindingUtil();
		this._oStoredProperties = {};
		this._bVisibleSet = false;
		this._bEditableSet = false;
		this._bMandatorySet = false;
		this._bUomEditableSet = false;
		this._oStoredBindings = {};
		this._oParent = oParent;
		this._oHelper = oHelper;
		this._oAnnotation = oHelper.oAnnotation;
	};

	/**
	 * Calculates the control attributes that can be bound with field-control.
	 *
	 * @param {boolean} bNoMandatory flag indicating whether the mandatory attribute can be returned.
	 * @returns {array} the control attributes that can be bound with field-control.
	 * @public
	 */
	FieldControl.prototype.getBindableAttributes = function(bNoMandatory) {
		var oConfig = this._oParent.data("configdata");

		// in case of table there is no need to bind visible and mandatory properties.
		if (oConfig && (oConfig.configdata && !oConfig.configdata.isUOM || !oConfig.configdata)) {

			if (oConfig.configdata && oConfig.configdata.property && oConfig.configdata.property.property && this._oAnnotation.getFieldControlPath(oConfig.configdata.property.property)) {
				return [
					"editable", "visible"
				];
			} else {
				return [
					"editable"
				];
			}
		}

		if (bNoMandatory) {
			return [
				"editable", "visible"
			];
		}

		return [
			"editable", "visible", "mandatory"
		];
	};

	/**
	 * Returns formatter functions for the given control properties. The formatters use the given control property and its subordinate attributes.
	 * Each formatter consists of two function, one to calculate the binding paths and the formatter function itself.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {array} aBindings the names of the properties to be bound, e.g. "editable", "mandatory" and "visible".
	 * @returns {map} formatter functions for the given control properties.
	 * @public
	 */
	FieldControl.prototype.getControlProperties = function(oMetaData, aBindings) {
		var sMethod, len, sName, oResult = {};

		if (oMetaData && aBindings) {
			len = aBindings.length;

			while (len--) {
				sName = aBindings[len];
				sMethod = "_get" + sName.substring(0, 1).toUpperCase() + sName.substring(1);

				if (this[sMethod]) {
					oResult[sName] = this[sMethod](oMetaData, this._oParent.getBindingInfo(sName));
				}
			}
		}

		return oResult;
	};

	/**
	 * Returns formatter functions for the <code>editable</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @param {object} oBindingInfo the current binding of the property
	 * @param {string} sProperty the property
	 * @returns {object} formatter function for the given control attribute
	 * @private
	 */
	FieldControl.prototype._getEditable = function(oMetaData, oBindingInfo, sProperty) {
		var bParent, iPropertyPos = -1, iEntitySetPos = -1, iBindingPos = -1, that = this, oParts = {
			length: 0
		};

		// if the field is not bound, use the initial value from the parent control.
		if (sProperty === "uomEditable") {
			this._bUomEditableSet = true;
		} else {
			this._bEditableSet = true;
		}
		if (!oBindingInfo) {
			if (sProperty) {
				bParent = this._oParent["get" + sProperty.substring(0, 1).toUpperCase() + sProperty.substring(1)]();
				this._oStoredProperties[sProperty] = bParent;
			} else {
				bParent = this._oParent.getEditable();
				this._oStoredProperties["editable"] = bParent;
			}
			this._oStoredBindings.editable = null;
		} else if (this._oStoredBindings.editable === undefined) {
			this._oStoredBindings.editable = oBindingInfo;
		}

		return {
			path: function() {
				var aPaths = [], sPath, len = 0;

				// no value bound on smart field, but a URL could be there.
				if (!oMetaData.property || !oMetaData.property.property) {
					return [
						""
					];
				}

				// check for field-control on property level and set position.
				sPath = that._oAnnotation.getFieldControlPath(oMetaData.property.property);

				if (sPath) {
					aPaths.push(that._toPath(oMetaData, sPath));
					iPropertyPos = len;
					len++;
				}

				// check for field-control on entity set level and set position.
				// for "sap:updatable-path" no OData V4 annotation is considered,
				// because it is replaced by the instance annotation com.sap.vocabularies.Common.v1.Updatable.
				if (oMetaData.entitySet["sap:updatable-path"]) {
					aPaths.push(oMetaData.entitySet["sap:updatable-path"]);
					iEntitySetPos = len;
					len++;
				}

				// check for binding info and set position.
				if (oBindingInfo) {
					iBindingPos = len;
					that._oBinding.getBindingParts(oBindingInfo, aPaths, oParts);
					len = len + oParts.length;
				}

				if (len > 0) {
					return aPaths;
				}

				return [
					""
				];
			},
			formatter: function(vValue, p1, p2, p3) {
				var aArgs = [], oBindingContext, oObject;

				if (that._bIsDestroyed) {
					return false;
				}

				if (!that._oAnnotation) {
					return false;
				}

				// check the modeled static values.
				oBindingContext = that._oParent.getBindingContext();

				if (!oBindingContext) {
					return vValue;
				}

				if (oBindingContext.getObject && oMetaData && oMetaData.property && oMetaData.property.property) {
					oObject = oBindingContext.getObject();

					if (oObject && oObject.__metadata && oObject.__metadata.created) {
						if (!that._getCreatableStatic(oMetaData)) {
							return false;
						}
					} else if (!that._getUpdatableStatic(oMetaData)) {
						return false;
					}
				}

				// get the values to compare.
				if (iPropertyPos > -1) {
					aArgs.push(arguments[iPropertyPos] !== 1);
				}

				// ignore updatable-path during create
				if (iEntitySetPos > -1 && (!oObject || !oObject.__metadata || !oObject.__metadata.created)) {
					aArgs.push(!!arguments[iEntitySetPos]);
				}

				// check for binding, in case of no binding, use value from parent
				if (iBindingPos > -1) {
					if (oBindingInfo.formatter) {
						aArgs.push(that._execFormatter(oBindingInfo.formatter, arguments, iBindingPos, oParts.length));
					} else {
						aArgs.push(!!arguments[iBindingPos]);
					}
				} else {
					aArgs.push(bParent);
				}

				return that._compare(aArgs, false, true);
			}
		};
	};

	/**
	 * Executes the given formatter.
	 *
	 * @param {function} fFormatter The formatter to be executed
	 * @param {array} aArguments The possible arguments
	 * @param {int} iStart The start position
	 * @param {int} iLength The length
	 * @returns {object} The formatting result
	 * @private
	 */
	FieldControl.prototype._execFormatter = function(fFormatter, aArguments, iStart, iLength) {
		var aArgs = [], i;

		if (iStart > -1 && iLength > -1) {
			for (i = 0; i < iLength; i++) {
				aArgs.push(aArguments[iStart + i]);
			}
		}

		return fFormatter.apply(null, aArgs);
	};

	/**
	 * Returns static value for the <code>enabled</code> property of a control.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @returns {boolean} static value for the <code>enabled</code> property of a control.
	 * @private
	 */
	FieldControl.prototype._getCreatableStatic = function(oMetaData) {
		return (this._oAnnotation.canCreateEntitySet(oMetaData.entitySet) && this._oAnnotation.canCreateProperty(oMetaData.property.property));
	};

	/**
	 * Returns static value for the <code>enabled</code> property of a control.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @returns {boolean} static value for the <code>enabled</code> property of a control.
	 * @private
	 */
	FieldControl.prototype._getUpdatableStatic = function(oMetaData) {
		return (this._oAnnotation.canUpdateEntitySet(oMetaData.entitySet) && this._oAnnotation.canUpdateProperty(oMetaData.property.property));
	};

	/**
	 * Compares the boolean values from field control evaluation. First the values are compared to <code>bPessimist</code>. If this comparison does
	 * not evaluate to <code>true</code>, <code>bDefault</code> is returned.
	 *
	 * @param {array} aArgs values to be compared.
	 * @param {boolean} bPessimist first operand.
	 * @param {boolean} bDefault second operand.
	 * @returns {boolean} comparison result.
	 * @private
	 */
	FieldControl.prototype._compare = function(aArgs, bPessimist, bDefault) {
		var i, len = aArgs.length;

		for (i = 0; i < len; i++) {
			if (aArgs[i] === bPessimist) {
				return bPessimist;
			}
		}

		return bDefault;
	};

	/**
	 * Returns formatter functions for the <code>visible</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {object} oBindingInfo the current binding of the property.
	 * @returns {object} formatter function for the given control attribute.
	 * @private
	 */
	FieldControl.prototype._getVisible = function(oMetaData, oBindingInfo) {
		var bParent, iBindingPos = -1, iPropertyPos = -1, that = this, oParts = {
			length: 0
		};

		// if the field is not bound, use the initial value from the parent control.
		this._bVisibleSet = true;
		if (!oBindingInfo) {
			bParent = this._oParent.getVisible();
			this._oStoredProperties.visible = bParent;
			this._oStoredBindings.visible = null;
		} else if (this._oStoredBindings.visible === undefined) {
			this._oStoredBindings.visible = oBindingInfo;
		}

		return {
			path: function() {
				var aPaths = [], sPath, len = 0;

				// no value bound on smart field, but a URL could be there.
				if (!oMetaData.property || !oMetaData.property.property) {
					return [
						""
					];
				}

				// check for field-control on entity set level and set position.
				sPath = that._oAnnotation.getFieldControlPath(oMetaData.property.property);

				if (sPath) {
					aPaths.push(that._toPath(oMetaData, sPath));
					iPropertyPos = len;
					len++;
				}

				// check for binding info and set position.
				if (oBindingInfo) {
					iBindingPos = len;
					that._oBinding.getBindingParts(oBindingInfo, aPaths, oParts);
					len = len + oParts.length;
				}

				if (len > 0) {
					return aPaths;
				}

				return [
					""
				];
			},
			formatter: function(p1, p2) {
				var aArgs = [];

				if (that._bIsDestroyed) {
					return false;
				}

				if (!that._oAnnotation) {
					return false;
				}

				// check static property.
				if (oMetaData.property && oMetaData.property.property && that._oAnnotation.getVisible(oMetaData.property.property) === "false") {
					return false;
				}

				// check, if field-control is available.
				if (iPropertyPos > -1) {
					aArgs.push(arguments[iPropertyPos] !== 0);
				}

				// check for binding, in case of no binding, use value from parent.
				if (iBindingPos > -1) {
					if (oBindingInfo.formatter) {
						aArgs.push(that._execFormatter(oBindingInfo.formatter, arguments, iBindingPos, oParts.length));
					} else {
						aArgs.push(!!arguments[iBindingPos]);
					}
				} else {
					aArgs.push(bParent);
				}

				return that._compare(aArgs, false, true);
			}
		};
	};

	/**
	 * Returns formatter functions for the <code>mandatory</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {object} oBindingInfo the current binding of the property.
	 * @returns {object} formatter function for the given control attribute.
	 * @private
	 */
	FieldControl.prototype._getMandatory = function(oMetaData, oBindingInfo) {
		var bParent, iBindingPos = -1, iPropertyPos = -1, that = this, oParts = {
			length: 0
		};

		// if the field is not bound, use the initial value from the parent control.
		this._bMandatorySet = true;
		if (!oBindingInfo) {
			bParent = this._oParent.getMandatory();
			this._oStoredProperties.mandatory = bParent;
			this._oStoredBindings.mandatory = null;
		} else if (this._oStoredBindings.mandatory === undefined) {
			this._oStoredBindings.mandatory = oBindingInfo;
		}

		return {
			path: function() {
				var aPaths = [], sPath, len = 0;

				// no value bound on smart field, but a URL could be there.
				if (!oMetaData.property || !oMetaData.property.property) {
					return [
						""
					];
				}

				// check for field-control on entity set level and set position.
				sPath = that._oAnnotation.getFieldControlPath(oMetaData.property.property);

				if (sPath) {
					aPaths.push(that._toPath(oMetaData, sPath));
					iPropertyPos = len;
					len++;
				}

				// check for binding info and set position.
				if (oBindingInfo) {
					iBindingPos = len;
					that._oBinding.getBindingParts(oBindingInfo, aPaths, oParts);
					len = len + oParts.length;
				}

				if (len > 0) {
					return aPaths;
				}

				return [
					""
				];
			},
			formatter: function(p1, p2) {
				var aArgs = [];

				if (that._bIsDestroyed) {
					return true;
				}

				// no field control, so check for null-able or static mandatory.
				// default for null-able is true, so it has to be set to false to make a property mandatory.
				if (oMetaData.property && oMetaData.property.property) {
					if (oMetaData.property.property.nullable === "false" || (that._oAnnotation && that._oAnnotation.isStaticMandatory(oMetaData.property.property))) {
						aArgs.push(true);
					} else if (oMetaData.property.property.nullable) {
						aArgs.push(false);
					}
				}

				// check, if field-control is active.
				if (iPropertyPos > -1) {
					aArgs.push(arguments[iPropertyPos] === 7);
				}

				// check for binding, in case of no binding, use value from parent.
				if (iBindingPos > -1) {
					if (oBindingInfo.formatter) {
						aArgs.push(that._execFormatter(oBindingInfo.formatter, arguments, iBindingPos, oParts.length));
					} else {
						aArgs.push(!!arguments[iBindingPos]);
					}
				} else {
					aArgs.push(bParent);
				}

				return that._compare(aArgs, true, false);
			}
		};
	};

	/**
	 * Constructs a binding path for a formatter from the <code>value</code> attribute of a JSON property.
	 *
	 * @param {object} oMetaData the meta data used to create the control.
	 * @param {object} oMetaData.entitySet the OData entity set definition.
	 * @param {object} oMetaData.property the OData property definition.
	 * @param {string} oMetaData.path the binding path.
	 * @param {string} sPath the given path.
	 * @returns {string} binding path for an attribute.
	 * @private
	 */
	FieldControl.prototype._toPath = function(oMetaData, sPath) {

		// if the original property is a complex path,
		// impossible to have a navigation property in sPath.
		// so we assume this as a prerequisite.
		if (oMetaData.property.complex) {
			return oMetaData.path.replace(oMetaData.property.property.name, sPath);
		}

		// add an optional navigation path from value property of the smart control:
		// should be done for simple and complex properties!
		if (oMetaData.navigationPath) {
			return oMetaData.navigationPath + "/" + sPath;
		}

		return sPath;
	};

	/**
	 * Returns a function to check whether a field is a mandatory field.
	 *
	 * @param {object} oProperty the meta data to execute the check.
	 * @returns {function} the check function, can be <code>null</code>.
	 * @public
	 */
	FieldControl.prototype.getMandatoryCheck = function(oProperty) {
		var fReturn, that = this;

		if (oProperty) {
			switch (oProperty.property.type) {
				case "Edm.DateTimeOffset":
				case "Edm.DateTime":
				case "Edm.Time":
				case "Edm.String":
					fReturn = function(sValue) {
						if (that._oParent && that._oParent.getMandatory() && that._oParent.getClientSideMandatoryCheck() &&
							(!that._oAnnotation || !that._oAnnotation.isStaticMandatory(oProperty.property) || !that._oAnnotation.isNullable(oProperty.property)) && !sValue) {
							throw new ParseException(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("VALUEHELPVALDLG_FIELDMESSAGE"));
						}
					};
					break;
				case "Edm.Decimal":
				case "Edm.Double":
				case "Edm.Float":
				case "Edm.Single":
				case "Edm.Int16":
				case "Edm.Int32":
				case "Edm.Int64":
				case "Edm.Byte":
				case "Edm.SByte":
					fReturn = function(sValue) {
						if (that._oParent && that._oParent.getMandatory() && that._oParent.getClientSideMandatoryCheck() &&
							(!that._oAnnotation || !that._oAnnotation.isStaticMandatory(oProperty.property) || !that._oAnnotation.isNullable(oProperty.property)) &&
							(sValue === null || sValue === undefined || sValue === "")) {
							throw new ParseException(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("VALUEHELPVALDLG_FIELDMESSAGE"));
						}
					};
					break;
				default:
					break;
			}
		}

		return fReturn;
	};

	/**
	 * Returns formatter functions for the <code>uomEditState</code> property of a control. The formatters use the given OData property and its
	 * subordinate attributes.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @returns {object} formatter function for the given control attribute
	 * @public
	 */
	FieldControl.prototype.getUOMEditState = function(oMetaData) {
		var mNumber, mUnit, oUnitMetaData, lenNumber = 0, oBindingInfo;

		// get the formatter for the number.
		oBindingInfo = this._oParent.getBindingInfo("editable");
		mNumber = this._getEditable(oMetaData, oBindingInfo);

		// get the formatter for the unit.
		oUnitMetaData = {
			model: oMetaData.model,
			path: this._oHelper.getUOMPath(oMetaData),
			entitySet: oMetaData.entitySet,
			entityType: oMetaData.entityType,
			property: {
				property: oMetaData.annotations.uom.property,
				complex: oMetaData.property.complex,
				typePath: this._oHelper.getUOMTypePath(oMetaData)
			}
		};
		mUnit = this._getEditable(oUnitMetaData, this._oParent.getBindingInfo("uomEditable"), "uomEditable");

		return {
			path: function() {
				var aNumber = mNumber.path(), aUnit = mUnit.path();

				if (aNumber[0] === "" && aUnit === "") {
					return [
						""
					];
				}

				lenNumber = aNumber.length;

				return aNumber.concat(aUnit);
			},
			formatter: function(v, p1, p2, p3) {
				var aArgs = [], i, bNumber, bUnit, len = arguments.length;

				// execute the formatter for the number
				for (i = 0; i < lenNumber; i++) {
					aArgs.push(arguments[i]);
				}

				bNumber = mNumber.formatter.apply(null, aArgs);

				// prepare the arguments for the unit formatter => simply remove the arguments for the number.
				aArgs = [];

				for (i = 0; i < len; i++) {
					aArgs.push(arguments[i]);
				}

				for (i = 0; i < lenNumber; i++) {
					aArgs.shift();
				}

				// execute the formatter for the unit.
				bUnit = mUnit.formatter.apply(null, aArgs);

				// calculate the result
				if (!bUnit && !bNumber) {
					return 0;
				}

				return 1;
			}
		};
	};

	/**
	 * Checks whether a formatter for the property <code>uomEditState</code> of a control can be returned.
	 *
	 * @param {object} oMetaData the meta data used to create the control
	 * @param {object} oMetaData.entitySet the OData entity set definition
	 * @param {object} oMetaData.property the OData property definition
	 * @param {string} oMetaData.path the binding path
	 * @returns {boolean} <code>uomEditState</code>, if a formatter for the property <code>uomEditState</code> of a control can be returned,
	 *          <code>false</code> otherwise
	 * @public
	 */
	FieldControl.prototype.hasUomEditState = function(oMetaData) {
		var oProposal;

		if (oMetaData && oMetaData.annotations && oMetaData.annotations.uom) {
			oProposal = this._oParent.getControlProposal();

			if (oProposal) {
				if (oProposal.getControlType() === "ObjectNumber") {
					return true;
				}

				if (oProposal.getObjectStatus()) {
					return true;
				}
			}

			return this._oParent.getProposedControl() === "ObjectNumber";
		}

		return false;
	};

	/**
	 * Frees all resources claimed during the life-time of this instance.
	 *
	 * @public
	 */
	FieldControl.prototype.destroy = function() {
		if (this._oBinding) {
			this._oBinding.destroy();
		}

		this._oAnnotation = null;
		this._oBinding = null;

		if (this._oParent && !this._oParent._bInDestroy) {

			// reset properties
			for ( var sProperty in this._oStoredProperties) {
				this._oParent.unbindProperty(sProperty, true);
				if (this._oParent["set" + sProperty.substring(0, 1).toUpperCase() + sProperty.substring(1)]) {
					this._oParent["set" + sProperty.substring(0, 1).toUpperCase() + sProperty.substring(1)](this._oStoredProperties[sProperty]);
				}
			}

			if (this._oStoredProperties) {
				if (!this._oStoredProperties.editable && this._bEditableSet) {
					this._oParent.unbindProperty("editable");
				}
				if (!this._oStoredProperties.visible && this._bVisibleSet) {
					this._oParent.unbindProperty("visible");
				}
				if (!this._oStoredProperties.mandatory && this._bMandatorySet) {
					this._oParent.unbindProperty("mandatory");
				}
				if (!this._oStoredProperties.uomEditable && this._bUomEditableSet) {
					this._oParent.unbindProperty("uomEditable");
				}
			}

			if (this._oStoredBindings) {
				if (this._oStoredBindings.editable) {
					if (this._oParent.isBound("editable")) {
						this._oParent.unbindProperty("editable");
					}
					this._oParent.bindProperty("editable", this._oStoredBindings.editable);
				}
				if (this._oStoredBindings.visible) {
					if (this._oParent.isBound("visible")) {
						this._oParent.unbindProperty("visible");
					}
					this._oParent.bindProperty("visible", this._oStoredBindings.visible);
				}
				if (this._oStoredBindings.mandatory) {
					if (this._oParent.isBound("mandatory")) {
						this._oParent.unbindProperty("mandatory");
					}
					this._oParent.bindProperty("mandatory", this._oStoredBindings.mandatory);
				}
				if (this._oStoredBindings.uomEditable) {
					if (this._oParent.isBound("uomEditable")) {
						this._oParent.unbindProperty("uomEditable");
					}
					this._oParent.bindProperty("uomEditable", this._oStoredBindings.uomEditable);
				}
			}

		}

		this._oStoredProperties = null;
		this._oStoredBindings = null;
		this._oParent = null;
		this._oHelper = null;
		this._bIsDestroyed = true;
		this._bEditableSet = false;
		this._bMandatorySet = false;
		this._bVisibleSet = false;
		this._bUomEditableSet = false;
	};

	return FieldControl;
}, true);
