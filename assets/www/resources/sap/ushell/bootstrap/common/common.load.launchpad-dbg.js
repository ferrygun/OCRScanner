sap.ui.define( [
    "./common.boot.path"
], function ( sBootPath ) {
    "use strict";

    return loadLaunchpadContent;

    function loadLaunchpadContent() {
        var oContent = window.sap.ushell.Container.createRenderer();

        fnConfigureCDMSiteURL();

        window.jQuery.sap.setIcons( {
            "phone": sBootPath + "/sap/ushell/themes/base/img/launchicons/57_iPhone_Desktop_Launch.png",
            "phone@2": sBootPath + "/sap/ushell/themes/base/img/launchicons/114_iPhone-Retina_Web_Clip.png",
            "tablet": sBootPath + "/sap/ushell/themes/base/img/launchicons/72_iPad_Desktop_Launch.png",
            "tablet@2": sBootPath + "/sap/ushell/themes/base/img/launchicons/144_iPad_Retina_Web_Clip.png",
            "favicon": sBootPath + "/sap/ushell/themes/base/img/launchpad_favicon.ico",
            "precomposed": true
        } );

        // TODO: Declare dependency.
        window.jQuery.sap.require( "sap.ushell.iconfonts" );
        window.jQuery.sap.require( "sap.ushell.services.AppConfiguration" );

        window.sap.ushell.iconfonts.registerFiori2IconFont();

        window.jQuery( "#canvas" ).empty();
        oContent.placeAt( "canvas" );
    }

    function fnConfigureCDMSiteURL() {
        // TODO: Declare dependency.
        var sSiteURL = window.jQuery.sap.getUriParameters().get( "sap-ushell-cdm-site-url" );
        var oAdapterConfig = window.jQuery.sap.getObject( "sap-ushell-config.services.CommonDataModel.adapter.config", 0 );

        if ( sSiteURL ) {
            oAdapterConfig.cdmSiteUrl = sSiteURL;
        }
    }

} );