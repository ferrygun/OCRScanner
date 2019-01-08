// This is a helper module in order to prevent a cyclic module dependency
// between SearchModel and SearchShellHelper.
// As soon as our build does not complain about the cycle any longer, we can
// remove this module and the injection methods in SearchModel and
// SearchShellHelper.
// This module is initially required and therefore loaded in
// ushell-lib/src/main/js/sap/ushell/renderers/fiori2/Shell.view.js

sap.ui.define([
    './SearchModel',
    './SearchShellHelper'
], function(SearchModel, SearchShellHelper) {
    "use strict";

    SearchModel.injectSearchShellHelper(SearchShellHelper);
    SearchShellHelper.injectSearchModel(SearchModel);

    return {
        SearchModel: SearchModel,
        SearchShellHelper: SearchShellHelper
    };
});

// In general a cyclic module dependency should work fine with late dependency
// resolution, as demonstrated in the following expample:

/*
// module yin
sap.ui.define([‘yang’], function([yang], {

    console.log(yang); // will be undefined

return {
    goSteps: function( steps ) {
        yang = sap.ui.require(“yang”); // “late” dependency resolution will return the real module value of yang
        if ( steps > 0 ) {
            yang.goSteps( steps - 1 );
        } else {
            console.log(“you reached your goal”);
        }
    }
};
});

// module yang
sap.ui.define([‘yin’], function(yin), {

    console.log(yin); // will be undefined

    return {
        goSteps: function ( steps ) {
            yin = sap.ui.require(“yin”); // “late” dependency resolution will return the real module value of yin
            if ( steps > 0 ) {
                yin.goSteps( steps - 1 );
            } else {
                console.log(“you reached your goal”);
            }
        }
    };
});

// usage via yin
sap.ui.require([yin], function(yin) {
    yin.goSteps ( 100 );
});

// usage via yang
sap.ui.require([yang], function(yang) {
    yang.goSteps( 100 );
});
*/
