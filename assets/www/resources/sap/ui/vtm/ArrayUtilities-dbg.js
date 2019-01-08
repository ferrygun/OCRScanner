/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ['jquery.sap.global'],
    function(jQuery) {

        "use strict";

        /**
         * A set of utility functions for working with arrays.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @namespace
         * @name  sap.ui.vtm.ArrayUtilities
         * @public
         * @author SAP SE
         * @version 1.52.0
         */
        var ArrayUtilities = {};

        /**
         * Returns whether a group of arrays have a non empty set intersection.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.haveIntersection
         * @param {Array} arrayOfArrays An array of arrays to check for the existence of a set intersection.
         * @param {function?} equalityFunction A function that returns a Boolean value to compare values within arrays. When not specified, strict equality (<code>===</code>) is used to compare values.
         * @return {boolean} Whether the arrays have a non empty set intersection.
         */
        ArrayUtilities.haveIntersection = function(arrayOfArrays, equalityFunction) {
            switch (arrayOfArrays.length) {
            case 0:
            case 1:
                throw "At least two arrays expected when finding intersection";
            default:
                var arrays = arrayOfArrays.slice();
                arrays.sort(function(a, b) { return a.length - b.length; });
                var smallestArray = arrays[0];
                var item;
                var itemsAreEqual = function(element) {
                    return equalityFunction(element, item);
                };
                for (var j = 0; j < smallestArray.length; j++) {
                    item = smallestArray[j];
                    var itemInAllArrays = true;
                    for (var k = 1; k < arrays.length; k++) {
                        var itemFound =  equalityFunction ? arrays[k].some(itemsAreEqual) : arrays[k].indexOf(item) !== -1;
                        if (!itemFound) {
                            itemInAllArrays = false;
                            break;
                        }
                    }
                    if (itemInAllArrays) {
                        return true;
                    }
                }
                return false;
            }
        };

        /**
         * Returns the set intersection of a group of arrays.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.intersect
         * @param {Array} arrayOfArrays An array of arrays to to find the set intersection of.
         * @param {function?} equalityFunction A function that returns a Boolean value to compare values within arrays. When not specified, strict equality (<code>===</code>) is used to compare values.
         * @return {Array} The set intersection of the arrays.
         */
        ArrayUtilities.intersect = function(arrayOfArrays, equalityFunction) {
            switch (arrayOfArrays.length) {
            case 0:
            case 1:
                throw "At least two arrays expected when finding intersection";
            default:
                var arrays = arrayOfArrays.slice();
                arrays.sort(function(a, b) { return a.length - b.length; });
                var intersection = [];
                var smallestArray = arrays[0];
                var item;
                var itemsAreEqual = function(element) {
                    return equalityFunction(element, item);
                };
                for (var j = 0; j < smallestArray.length; j++) {
                    item = smallestArray[j];
                    var itemInAllArrays = true;
                    for (var k = 1; k < arrays.length; k++) {
                        var itemFound =  equalityFunction ? arrays[k].some(itemsAreEqual) : arrays[k].indexOf(item) !== -1;
                        if (!itemFound) {
                            itemInAllArrays = false;
                            break;
                        }
                    }
                    if (itemInAllArrays) {
                        if (intersection.indexOf(item) === -1) {
                            intersection.push(item);
                        }
                    }
                }
                return intersection;
            }
        };

        /**
         * Returns the set union (as an array) of a group of arrays.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.union
         * @param {Array} arrayOfArrays An array of arrays to find the set union of.
         * @param {function?} equalityFunction A function that returns a Boolean value to compare values within arrays. When not specified, strict equality (<code>===</code>) is used to compare values.
         * @return {Array} The set union of the arrays.
         */
        ArrayUtilities.union = function(arrayOfArrays, equalityFunction) {
            var union = [];
            var item;
            var itemsAreEqual = function(element) {
                return equalityFunction(element, item);
            };
            for (var j = 0; j < arrayOfArrays.length; j++) {
                var array = arrayOfArrays[j];
                for (var i = 0; i < array.length; i++) {
                    item = array[i];
                    var itemFound = equalityFunction ? union.some(itemsAreEqual) : union.indexOf(item) !== -1;
                    if (!itemFound) {
                        union.push(item);
                    }
                }
            }
            return union;
        };

        /**
         * Converts an array to an ES6 Set.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.toSet
         * @param {Array} array The array to convert to a Set.
         * @return {Set} The Set containing the same set of unique items as the array.
         */
        ArrayUtilities.toSet = function(array) {
            var set = new Set();
            array.forEach(function(item) {
                set.add(item);
            });
            return set;
        };

        /**
         * Converts an ES6 Set to an array.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.fromSet
         * @param {Set} set The Set to convert to an array.
         * @return {Array} The array containing the same set of unique items as the Set.
         */
        ArrayUtilities.fromSet = function(set) {
            var array = [];
            set.forEach(function(item) {
                array.push(item);
            });
            return array;
        };

        /**
         * Converts from an array-like object (an object that supports indexing and has a length) to an array.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.fromArrayLike
         * @param {object} arrayLike The array-like object to convert to an array.
         * @return {Array} The array containing the same values as the array-like object.
         */
        ArrayUtilities.fromArrayLike = function(arrayLike) {
            var array = [];
            for (var i = 0; i < arrayLike.length; i++) {
                array.push(arrayLike[i]);
            }
            return array;
        };

        /**
         * Wraps an item in an array if it is not already an array.
         *
         * <ul>
         * <li>If the parameter is an array, the parameter is returned.</li>
         * <li>If the parameter is <code>undefined</code> an empty array is returned.</li>
         * <li>Otherwise a single element array containing the parameter value is returned.</li>
         * </ul>
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.wrap
         * @param {any} item The item to wrap as an array if it is not already an array.
         * @return {Array} The parameter if it is an array, otherwise returns a single element array containing the parameter value
         */
        ArrayUtilities.wrap = function(item) {
            if (item === undefined) {
                return [];
            } else if (Array.isArray(item)) {
                return item;
            }
            return [item];
        };

        /**
         * The inverse of {@link sap.ui.vtm.ArrayUtilities.wrap}.
         *
         * <ul>
         * <li>If the parameter is not an array, the parameter is returned.</li>
         * <li>If the parameter is an array of length 0, <code>undefined</code> is returned.</li>
         * <li>If the parameter is an array of length 1, the first element of the array is returned.</li>
         * <li>Otherwise if the parameter is an array of length > 1, the parameter is returned (as an array).</li>
         * </ul>
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.unwrap
         * @param {any} item The item to unwrap.
         * @return {any|Array|undefined} The unwrapped value.
         */
        ArrayUtilities.unwrap = function(item) {
            if (Array.isArray(item)) {
                if (item.length == 0) {
                    return undefined;
                } else if (item.length == 1) {
                    return item[0];
                } else {
                    return item;
                }
            } else {
                return item;
            }
        };

        /**
         * Returns <code>true</code> if a group of arrays are equal.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.areEqual
         * @param {Array} arrayOfArrays The array of arrays to compare.
         * @param {function?} equalityFunc A function that takes two parameters and returns a boolean value indicating whether the parameter values are equal.
         * @returns {boolean} <code>true</code> if the all the arrays are equal.
         */
        ArrayUtilities.areEqual = function(arrayOfArrays, equalityFunc) {
            if (!equalityFunc) {
                equalityFunc = function(item1, item2) { return item1 === item2; };
            }
            var firstArray = arrayOfArrays[0];
            var remainingArrays = arrayOfArrays.slice(1);
            var length = firstArray.length;
            var allSameLength = remainingArrays.every(function(array) {
                return length === array.length;
            });
            if (!allSameLength) {
                return false;
            }
            return remainingArrays.every(function(array){
                return array.every(function(item, index) {
                    return equalityFunc(item, firstArray[index]);
                });
            }); 
        };

        /**
         * Creates a copy of an array in which the items are copied by reference rather than being cloned.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.shallowClone
         * @param {Array} array The array to clone.
         * @returns {Array} The cloned array
         */
        ArrayUtilities.shallowClone = function (array) {
            return array.slice(0);
        };

        /**
         * Creates a copy of an array in which the items are cloned.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.deepClone
         * @param {Array} array The array to clone.
         * @param {function} itemCloneFunc A function used to clone an item of the array.
         * The function has an argument that takes an item of the type stored in the array and returns an item of the same type.
         * @returns {Array} The cloned array
         */
        ArrayUtilities.deepClone = function (array, itemCloneFunc) {
            if (!itemCloneFunc) {
                return undefined;
            }

            return array.map(
                function (item) { return itemCloneFunc(item); });
        };

        /**
         * Returns the first item in an array that matches the supplied predicate or returns undefined if no match is found.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.find
         * @param {Array} array The array to search.
         * @param {function} predicate A function that takes a value of the type stored in the array and returns a boolean value (true if the item is a match.
         * @returns {any|undefined} The matching item or undefined if no match was found.
         */
        ArrayUtilities.find = function (array, predicate) {
            for (var i = 0; i < array.length; i++) {
                var item = array[i];
                if (predicate(item)) {
                    return item;
                }
            }
            return undefined;
        };

        /**
         * Returns the index of the first item in an array that matches the supplied predicate or returns -1 if no match is found.
         * @public
         * @function
         * @name sap.ui.vtm.ArrayUtilities.findIndex
         * @param {Array} array The array to search.
         * @param {function} predicate A function that takes a value of the type stored in the array and returns a boolean value (true if the item is a match.
         * @returns {number} The index of the matching item or -1 if no match was found.
         */
        ArrayUtilities.findIndex = function (array, predicate) {
            for (var i = 0; i < array.length; i++) {
                if (predicate(array[i])) {
                    return i;
                }
            }
            return -1;
        };

        /**
         * Flattens an array of arrays down to an array.
         * @public
         * @static
         * @function
         * @name sap.ui.vtm.ArrayUtilities.flatten
         * @param {Array} arrayOfArrays An array of arrays.
         * @returns {Array} A flattened array.
         */
        ArrayUtilities.flatten = function (arrayOfArrays) {
            return [].concat.apply([], arrayOfArrays);
        };

        return ArrayUtilities;
    },
    true);
