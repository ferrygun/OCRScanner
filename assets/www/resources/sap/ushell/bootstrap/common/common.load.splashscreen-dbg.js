sap.ui.define( [
    "./common.boot.path",
    "./common.boot.script"
], function ( sBootPath, oBootScriptElement ) {
    "use strict";

    return  loadSplashscreen;

    function loadSplashscreen() {

        var sRelAttribute = "apple-touch-startup-image";

        [
            // iPhone splash screens
            {
                href: "320_x_460.png",
                media: "(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 1)"
            },
            {
                href: "640_x_920.png",
                media: "(device-width: 320px) and (device-height: 480px) and (-webkit-device-pixel-ratio: 2)"
            },
            {
                href: "640_x_1096.png",
                media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
            },
            // iPad splash screens
            {
                href: "768_x_1004.png",
                media: "(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 1)"
            },
            {
                href: "1024_x_748.png",
                media: "(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 1)"
            },
            {
                href: "1536_x_2008.png",
                media: "(device-width: 768px) and (device-height: 1024px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)"
            },
            {
                href: "2048_x_1496.png",
                media: "(device-width: 768px) and (device-height: 1024px) and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)"
            }
        ].forEach( function ( oSplashscreenData ) {
            var oLinkElement = document.createElement( "link" );

            oLinkElement.rel = sRelAttribute;
            oLinkElement.href = sBootPath + oSplashscreenData.href;
            oLinkElement.media = oSplashscreenData.media;

            document.head.insertBefore( oLinkElement, oBootScriptElement );
        } );
    }

} );