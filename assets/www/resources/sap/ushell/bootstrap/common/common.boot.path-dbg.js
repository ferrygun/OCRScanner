sap.ui.define( [
    "./common.boot.script"
], function ( oBootScriptElement ) {
    "use strict";

    if ( !oBootScriptElement ) {
        throw "No boot script";
    }

    return oBootScriptElement.src.split( "/" ).slice( 0, -4 ).join( "/" );

} );