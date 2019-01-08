/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */

jQuery.sap.declare("sap.ca.ui.model.type.FileSize");

jQuery.sap.require("sap.ui.model.SimpleType");
jQuery.sap.require("sap.ca.ui.model.format.FileSizeFormat");


/**
 * Constructor for a FileSize type.
 *
 * @class
 * This class represents file size types.
 *
 * @extends sap.ui.model.SimpleType
 *
 * @author SAP SE
 *
 * @constructor
 * @public
 * @param {object} [oFormatOptions] formatting options. Supports the same options as {@link sap.ui.core.format.NumberFormat.getFloatInstance NumberFormat.getFloatInstance}
 * @param {object} [oConstraint]s value constraints.
 * @param {float} [oConstraints.minimum] smallest value allowed for this type
 * @param {float} [oConstraints.maximum] largest value allowed for this type
 * @name sap.ca.ui.model.type.FileSize
 *
 * @deprecated Deprecated API:Since version 1.28. This control has been made available in sap.ui.core. Please use sap.ui.model.type.FileSize instead! This control will not be supported anymore.
 */
sap.ui.model.SimpleType.extend("sap.ca.ui.model.type.FileSize", /** @lends sap.ca.ui.model.type.FileSize */ {

    constructor : function () {
        sap.ui.model.SimpleType.apply(this, arguments);
        this.sName = "FileSize";
    }

});

/**
 * Creates a new subclass of class sap.ca.ui.model.type.FileSize with name <code>sClassName</code>
 * and enriches it with the information contained in <code>oClassInfo</code>.
 *
 * For a detailed description of <code>oClassInfo</code> or <code>FNMetaImpl</code>
 * see {@link sap.ui.base.Object.extend Object.extend}.
 *
 * @param {string} sClassName name of the class to be created
 * @param {object} [oClassInfo] object literal with informations about the class
 * @param {function} [FNMetaImpl] alternative constructor for a metadata object
 * @return {function} the created class / constructor function
 * @public
 * @static
 * @name sap.ca.ui.model.type.FileSize.extend
 * @function
 */

/**
 * @see sap.ui.model.SimpleType.prototype.formatValue
 */
sap.ca.ui.model.type.FileSize.prototype.formatValue = function(fValue, sInternalType) {
    if (fValue === undefined || fValue === null) {
        return null;
    }
    switch(sInternalType) {
        case "string":
            return this.oFormat.format(fValue);
        case "int":
            return Math.floor(fValue);
        case "float":
            return fValue;
        default:
            throw new sap.ui.model.FormatException("Don't know how to format FileSize to " + sInternalType);
    }
};

/**
 * @see sap.ui.model.SimpleType.prototype.parseValue
 */
sap.ca.ui.model.type.FileSize.prototype.parseValue = function(oValue, sInternalType) {
    var iResult;
    switch(sInternalType) {
        case "string":
            iResult = this.oFormat.parse(oValue);
            if (isNaN(iResult)) {
                throw new sap.ui.model.ParseException(oValue + " is not a valid FileSize value");
            }
            return iResult;
        case "int":
        case "float":
            return oValue;
        default:
            throw new sap.ui.model.ParseException("Don't know how to parse FileSize from " + sInternalType);
    }
};

/**
 * @see sap.ui.model.SimpleType.prototype.validateValue
 */
sap.ca.ui.model.type.FileSize.prototype.validateValue = function(iValue) {
    if (this.oConstraints) {
        var aViolatedConstraints = [];
        jQuery.each(this.oConstraints, function(sName, oContent) {
            switch (sName) {
                case "minimum":
                    if (iValue < oContent) {
                        aViolatedConstraints.push("minimum");
                    }
                    break;
                case "maximum":
                    if (iValue > oContent) {
                        aViolatedConstraints.push("maximum");
                    }
            }
        });
        if (aViolatedConstraints.length > 0) {
            throw new sap.ui.model.ValidateException("Validation of type constraints failed", aViolatedConstraints);
        }
    }
};


/**
 * @see sap.ui.model.SimpleType.prototype.setFormatOptions
 */
sap.ca.ui.model.type.FileSize.prototype.setFormatOptions = function(oFormatOptions) {
    this.oFormatOptions = oFormatOptions;
    this._handleLocalizationChange();
};

/**
 * Called by the framework when any localization setting changed
 * @private
 */
sap.ca.ui.model.type.FileSize.prototype._handleLocalizationChange = function() {
    this.oFormat = sap.ca.ui.model.format.FileSizeFormat.getInstance(this.oFormatOptions);
};
