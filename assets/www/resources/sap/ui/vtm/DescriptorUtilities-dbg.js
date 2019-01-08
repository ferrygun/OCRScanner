/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ['jquery.sap.global'],
    function(jQuery) {

        "use strict";

        /**
         * A set of utility functions for working with metadata and identifier descriptors.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @namespace
         * @name  sap.ui.vtm.DescriptorUtilities
         * @public
         * @author SAP SE
         * @version 1.52.0
         */
        var DescriptorUtilities = {};

        /**
         * Creates a descriptor for a metadata field.
         * @public
         * @function
         * @name sap.ui.vtm.DescriptorUtilities.createMetadataDescriptor
         * @param {string} category The category name.
         * @param {string} field The field name.
         * @returns {string} The descriptor representing the metadata field.
         */
        DescriptorUtilities.createMetadataDescriptor = function(category, field) {
            return JSON.stringify({
                category: category,
                field: field
            });
        };

        /**
         * Creates a descriptor for an identifier.
         * @public
         * @function
         * @name sap.ui.vtm.DescriptorUtilities.createIdentifierDescriptor
         * @param {string} source The identifier source.
         * @param {string} type The identifier type.
         * @returns {string} The descriptor representing the identifier.
         */
        DescriptorUtilities.createIdentifierDescriptor = function(source, type) {
            return JSON.stringify({
                source: source,
                type: type
            });
        };

        return DescriptorUtilities;
    },
    true);