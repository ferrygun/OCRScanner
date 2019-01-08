sap.ui.define( [
    "./common.constants"
], function ( oConstants ) {
    "use strict";

    var sStoredSapUiDebugValue;
    var bDebugSources = /[\?&]sap-ui-debug=(true|x|X)(&|$)/.test( window.location.search );

    if ( !bDebugSources ) {
        try {
            sStoredSapUiDebugValue = window.localStorage.getItem( oConstants.uiDebugKey );
            bDebugSources = !!sStoredSapUiDebugValue && /^(true|x|X)$/.test( sStoredSapUiDebugValue );
        } catch ( e ) {
        }
    }

    return  bDebugSources;

} );