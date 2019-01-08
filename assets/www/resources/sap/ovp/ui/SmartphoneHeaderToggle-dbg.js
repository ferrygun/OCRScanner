(function () {
    "use strict";
    /*global jQuery, sap */

    jQuery.sap.declare("sap.ovp.ui.SmartphoneHeaderToggle");

    sap.ovp.ui.SmartphoneHeaderToggle = {
        threshold : 10,
        headerVisible : true,
        startY : undefined,
        app : undefined,
        jqView : undefined,

        startHandler : function(e) {
            if (this.app.getGlobalFilter() && this.app.getGlobalFilter().hasOwnProperty("getVisible") && this.app.getGlobalFilter().getVisible()) {
                return;
            }
            this.startY = e.touches[0].pageY;
        },

        resizeHandler : function() {
            if (!this.headerVisible) {
                this.animateHeader.call(this, this.headerVisible);
            }
        },

        animateHeader : function(setVisible) {
            var jqHeaderVbox = this.jqView.find('.ovpApplication > .sapUiFixFlexFixed > .sapMVBox');
            var jqFlexContainerParent = this.jqView.find('.ovpApplication > .sapUiFixFlexFlexible');
            var jqFlexContainer = jqFlexContainerParent.children();
            var translate;

            if (setVisible) {
                translate = "translateY(0px)";
                jqHeaderVbox.add(jqFlexContainerParent).css({"transform": translate, "-webkit-transform": translate});
                jqFlexContainerParent.one('transitionend', function(e) {
                    if (this.headerVisible) {
                        jqFlexContainer.css({bottom: "0px"});
                    }
                }.bind(this));
            } else {
                var oHeader = this.getView().byId('ovpMain').getHeader();
                //Animate dynamic header only when it is present
                if (oHeader) {
                    var headerHeight = oHeader.$().height();
                    jqFlexContainer.css({bottom: "-" + headerHeight + "px"});
                    translate = "translateY(-" + headerHeight + "px)";
                    jqFlexContainerParent.add(jqHeaderVbox).css({
                        "transform": translate,
                        "-webkit-transform": translate
                    });
                }
            }
        },

        moveHandler : function(e) {
            var moveY = e.touches[0].pageY;
            if (typeof this.startY === "undefined") {
                if (this.app.getGlobalFilter() && this.app.getGlobalFilter().hasOwnProperty("getVisible") && this.app.getGlobalFilter().getVisible()) {
                    return;
                }
                this.startY = moveY;
            }
            if (Math.abs(this.startY - moveY) < this.threshold) {
                return;
            }
            if (this.startY > moveY && this.headerVisible) {
                this.headerVisible = false;
                this.startY = moveY;
                this.animateHeader.call(this, this.headerVisible);
            }
            if (this.startY < moveY && !this.headerVisible) {
                this.headerVisible = true;
                this.startY = moveY;
                this.animateHeader.call(this, this.headerVisible);
            }
        },

        endHandler : function() {
            this.startY = undefined;
            return;
        },

        enable : function(app) {
            this.app = app;
            this.view = this.app.getView();
            this.jqView = this.view.$();

            this.jqView.on('touchstart.headerHiding', this.startHandler.bind(this));
            this.jqView.on('touchmove.headerHiding', this.moveHandler.bind(this));
            this.jqView.on('touchend.headerHiding touchcancel.headerHiding touchleave.headerHiding', this.endHandler.bind(this));
            jQuery(window).on("resize.headerHiding", this.resizeHandler.bind(this));
        },

        disable : function() {
            this.jqView.off('touchstart.headerHiding touchmove.headerHiding touchend.headerHiding touchcancel.headerHiding touchleave.headerHiding');
            jQuery(window).off("resize.headerHiding");
        }
    };

}());