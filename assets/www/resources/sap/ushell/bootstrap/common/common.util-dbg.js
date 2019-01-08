sap.ui.define( [ ], function () {
    "use strict";

    return Object.create( null, {
        deepFreeze: { value: deepFreeze }
    } );

    /**
     * The method will fail if the given object has a cyclic reference.
     *
     * @param {Object} o Object to deep freeze; it should not contain a cyclic reference anywhere in its tree.
     * @returns {Object} The given object which is no longer mutable.
     */
    function deepFreeze( o ) {
        Object.keys( o )
            .filter( function ( sProperty ) {
                return typeof o[sProperty] === "object";
            } )
            .forEach( function ( sProperty ) {
                o[sProperty] = deepFreeze( o[sProperty] );
            } );

        return Object.freeze( o );
    }
} );