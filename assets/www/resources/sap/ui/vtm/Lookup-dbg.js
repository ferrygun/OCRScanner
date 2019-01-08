/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element", "./ArrayUtilities"],
    function (jQuery, SapUiCoreElement, SapUiVtmArrayUtilities) {

        "use strict";

        /**
         * Constructor for a new Lookup.
         * @param {function} equalsFunc A function to compare two values for equality (takes two values as parameters and returns true if they are equal).
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.Lookup
         * @public
         * @class
         * A map that can contain multiple values per key value.
         * This is a utility class that can be used as a data structure for:
         * <ul>
         * <li>Maintaining a lookup containing scene nodes keyed by a particular value in order to determine the scene nodes that should be associated with a particular tree item</li>
         * <li>Maintaining lookups (one for each tree) of tree items keyed by a particular value in order to determine the tree items in one tree that are associated with tree items in another tree</li>
         * </ul>
         * A typical usage would be to use a {@link sap.ui.vtm.Lookup} that is keyed using a hash code constructed from some or all of the information needed to match a particular tree item or scene node.
         * In this scenario the {@link sap.ui.vtm.Lookup} is used to return a set of possible matches which are then filtered to find the actual matches.
         * The usage of the {@link sap.ui.vtm.Lookup} with a suitable key can drastically reduces the number of items that need to be compared when performing a search.
         * This is important when there are large numbers of searches that need to be performed within a large set of items.
         * @author SAP SE
         * @version 1.52.0
         * @extends sap.ui.core.Element
         */
        var Lookup = SapUiCoreElement.extend("sap.ui.vtm.Lookup", /** @lends sap.ui.vtm.Lookup.prototype */ {

            init: function() {
                this.clear();
            },

            /**
             * Adds a value to the set of values stored against a given key.
             * @public
             * @function
             * @param {any} key The key.
             * @param {any} value The value.
             * @returns {sap.ui.vtm.Lookup} <code>this</code> for method chaining.
             */
            addValue: function (key, value) {
                var valuesByKey = this._valuesByKey;
                var values = valuesByKey.get(key);
                if (values) {
                    values.push(value);
                } else {
                    valuesByKey.set(key, [value]);
                }
                return this;
            },

            /**
             * Removes a particular value.
             * @public
             * @function
             * @param {any} key The key.
             * @param {any} value The value.
             * @param {function?} equalsFunc A function to compare two values for equality (takes two values as parameters and returns true if they are equal).
             * @returns {sap.ui.vtm.Lookup} <code>this</code> for method chaining.
             */
            removeValue: function (key, value, equalsFunc) {
                if (!equalsFunc) {
                    equalsFunc = function (value1, value2) { return value1 === value2; };
                }

                var values = this._valuesByKey.get(key);
                if (values) {
                    var index = sap.ui.vtm.ArrayUtilities.findIndex(values, function (val) {
                        return equalsFunc(value, val);
                    });
                    if (index >= 0) {
                        values.splice(index, 1);
                        if (values.length == 0) {
                            this._valuesByKey.delete(key);
                        }
                    }
                }
                return this;
            },

            /**
             * Clears the Lookup.
             * @public
             * @function
             * @returns {sap.ui.vtm.Lookup} <code>this</code> for method chaining.
             */
            clear: function () {
                this._valuesByKey = new Map();
                return this;
            },

            /**
             * Returns whether there are any values stored against the given key.
             * @public
             * @function
             * @param {any} key The key.
             * @returns {boolean} <code>true</code> if there are any values stored against the given key.
             */
            hasValue: function (key) {
                return this._valuesByKey.has(key);
            },

            /**
             * Gets the values stored against a given key.
             * @public
             * @function
             * @param {any} key The key to use to index the Lookup.
             * @returns {any[]} The values (if any) associated with the given key.
             */
            getValues: function (key) {
                var values = this._valuesByKey.get(key);
                if (values) {
                    values = values.slice();
                }
                return values || [];
            },

            /**
             * Loops over the key/value array pairs calling the callback function for each pair.
             * @public
             * @function
             * @param {function} callback The callback function to call for each key/value array pair.
             * The first argument to the callback function is the value array and the second parameter is the key.
             * @returns {sap.ui.vtm.Lookup} <code>this</code> for method chaining.
             */
            forEach: function(callback) {
                this._valuesByKey.forEach(callback);
                return this;
            }
        });

        return Lookup;
    });