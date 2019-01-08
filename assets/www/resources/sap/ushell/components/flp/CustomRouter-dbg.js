sap.ui.define(function() {
	"use strict";

    var CustomRouter = sap.ui.core.routing.Router.extend("sap.ushell.components.flp.CustomRouter", {

        constructor : function() {
            sap.ui.core.routing.Router.apply(this, arguments);
            //this._oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this);
            this.attachRouteMatched(this._onHandleRouteMatched, this);
            //this.attachRoutePatternMatched(this._handleRoutePatternMatched, this);
        },

        navTo : function() {
            if (!this._bIsInitialized) {
                this.initialize();
            }
            sap.ui.core.routing.Router.prototype.navTo.apply(this, arguments);
        },

        destroy : function() {
            sap.ui.core.routing.Router.prototype.destroy.apply(this, arguments);
        },
        _onHandleRouteMatched : function (oEvent) {
            var mParameters = oEvent.getParameters(),
                oTargetControl = sap.ui.getCore().byId(mParameters.config.controlId);
            var result = this.getTarget(mParameters.config.target).display();
            oTargetControl.to(result.oTargetParent);
            setTimeout(function () {
                sap.ui.getCore().getEventBus().publish("launchpad", "launchpadCustomRouterRouteMatched");
            }, 0);
        }
    });


	return CustomRouter;

});
