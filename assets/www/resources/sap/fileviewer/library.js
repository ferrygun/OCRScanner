/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library sap.fileviewer.
 */
sap.ui.define(['jquery.sap.global', 'sap/ui/core/library'],
    function(jQuery, library1) {
        "use strict";


        /**
         * UI5 library: sap.fileviewer.
         *
         * @namespace
         * @name sap.fileviewer
         * @public
         */

        // library dependencies

        // delegate further initialization of this library to the Core
        sap.ui.getCore().initLibrary({
            name: "sap.fileviewer",
            dependencies: ["sap.ui.core"],
            types: [
                // "sap.fileviewer.ExampleType"
            ],
            interfaces: [],
            controls: [
                "sap.fileviewer.FileViewer"
            ],
            elements: [],
            noLibraryCSS: false,
            version: "1.52.2"
        });


        // /**
        //  * Example type.
        //  *
        //  * @enum {string}
        //  * @public
        //  */
        // sap.fileviewer.ExampleType = {
        //
        //     /**
        //      * A value.
        //      * @public
        //      */
        //     Value1: "Value1",
        //
        //     /**
        //      * Another value.
        //      * @public
        //      */
        //     Value2: "Value2"
        //
        // };


        return sap.fileviewer;

    });
