/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ui.core.Popup");

sap.ui.base.EventProvider.extend("sap.ca.ui.Overlay", {
    constructor: function () {
        this._oPopup = new sap.ui.core.Popup();
        this._oPopup.setModal(true);
        this._oPopup.setShadow(false);
        this._oPopup.setAutoClose(false);

        this._oPopup._applyPosition = function (oPostion) {
            sap.ui.core.Popup.prototype._applyPosition.apply(this, arguments);
            var $Ref = this._$();
            $Ref.css({left: "0px", top: "0px", right: "0px", bottom: "0px"});
        };
    }
});

sap.ca.ui.Overlay.prototype.open = function (oContent, bNeedsScroll) {
    if ((bNeedsScroll != null) && (bNeedsScroll == true)) {
        this._oScrollEnablement = new sap.ui.core.delegate.ScrollEnablement(oContent, oContent.getId() + "-wrapper", {horizontal: true, vertical: true});
    }
    this.$content = oContent.$();
    if (this.$content) {
        this.$tempNode = jQuery("<div></div>"); // id='" + this.$content.attr("id")+"-overlay"+ "'
        this.$content.before(this.$tempNode);


        this._$overlay = jQuery("<div id='" + jQuery.sap.uid() + "'></div>");   // The scroll enablement need that the control parent has an id
        this._$overlay.addClass("sapCaUiOverlay");
        this._$overlay.append(this.$content);
        this._oPopup.setContent(this._$overlay);
    }
    else {
        jQuery.sap.log.warn("Overlay: content does not exist or contains more than one child");
    }

    this._oPopup.open(200);

};

sap.ca.ui.Overlay.prototype.close = function () {
    if (this._oScrollEnablement != null) {
        this._oScrollEnablement.destroy();
        this._oScrollEnablement = null;
    }
    this.$tempNode.replaceWith(this.$content);
    this._oPopup.close(200);
    this._$overlay.remove();
};

sap.ca.ui.Overlay.prototype.isOpen = function () {
    return this._oPopup.isOpen();
};