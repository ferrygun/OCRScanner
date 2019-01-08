/**
 * @name sap.ushell.ui.launchpad.CatalogTileContainer
 *
 * @private
 */
sap.ui.define([
    "sap/ushell/ui/launchpad/TileContainer"
], function(control) {
    "use strict";

    return sap.ushell.ui.launchpad.TileContainer.extend("sap.ushell.ui.launchpad.CatalogTileContainer", {
        updateTiles:  function (sReason) {
            var sName = "tiles";
            if (this.isTreeBinding(sName)) {
                // no idea how to handle -> delegate to parent
                sap.ui.base.ManagedObject.prototype.updateAggregation.apply(this, arguments);
            } else {
                jQuery.sap.log.debug("Updating TileContainer. Reason: ", sReason);
                try {
                    this.filterTiles(); // may fail if filter broadens after non-filter update
                } catch (ex) {
                    this.updateAggregation(sName);
                }
            }
        }
    });
});




