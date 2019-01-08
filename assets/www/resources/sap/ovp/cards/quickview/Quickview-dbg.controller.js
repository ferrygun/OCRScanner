(function () {
    "use strict";
    /*global sap, jQuery */

    jQuery.sap.require( "sap.ovp.cards.AnnotationHelper" );
    sap.ui.controller( "sap.ovp.cards.quickview.Quickview" , {
        onInit: function () {
            this.bCustomActionFlag = true;
        },

        //In the quickview card header, if either one of the texts is not present, the colon is removed
        onBeforeRendering: function(){
            var oHeaders = this.byId('ovpQuickviewCardHeader');
            if (oHeaders){
                var sText = oHeaders.getText();
                var sSub = sText.substring(0);
                if (sText[0] === ':'){
                    sSub = sText.substring(2);
                } else if (sText[sText.length - 2] === ':'){
                    sSub = sText.substring(0, sText.length - 2);
                }
                oHeaders.setText(sSub);
                var oCustomData = oHeaders.getCustomData();
                if (oCustomData){
                    for (var i = 0; i < oCustomData.length; ++i){
                        if (oCustomData[i].getProperty('key') === 'aria-label'){
                            oCustomData[i].setValue(sSub);
                        }   	
                    }
	            }
	        }
        },
        onAfterRendering: function(){
            jQuery( ".sapMQuickViewPage" ).attr( 'tabindex','0' );
            /**
             * The shotFirstActionInFooter flag is set in manifest.json. This is to avoid redundant navigation from Stack and Quickview cards.
             * If true, the first action in the footer of Quickview cards will be visible.
             * By default, it is false.
             */
            var oCardPropertiesModel = this.getCardPropertiesModel();
            var bShowFirstActionInFooter = oCardPropertiesModel.getProperty("/showFirstActionInFooter") ? oCardPropertiesModel.getProperty("/showFirstActionInFooter") : false;
            var oFooter = this.byId("ovpActionFooter");
            if ( !bShowFirstActionInFooter ) {
                if (oFooter) {
                    var aFooterBtns = oFooter.getContent();
                    if (aFooterBtns && aFooterBtns.length) {
                        for (var i = 0; i < aFooterBtns.length; i++) {
                            if (aFooterBtns[i] instanceof sap.m.Button) {
                                aFooterBtns[i].setVisible(false);
                                break;
                            }
                        }
                    }
                }
            }
            /*
                This is for Custom Actions
             */
            if (!!this.bCustomActionFlag) {
                var aCustomActions = oCardPropertiesModel.getProperty("/customActions");
                if (!!oFooter && !!aCustomActions && !!aCustomActions.length) {
                    for (var j = 0; j < aCustomActions.length; j++) {
                        var text = aCustomActions[j].text;
                        var oMainComponent = null;
                        if (this.getOwnerComponent() && this.getOwnerComponent().getComponentData()) {
                            oMainComponent = this.getOwnerComponent().getComponentData().mainComponent;
                        }
                        if (!!oMainComponent && !!text && !!aCustomActions[j].press) {
                            var press = oMainComponent.onCustomActionPress(aCustomActions[j].press);
                            if (typeof press === "function") {
                                var button = new sap.m.Button({
                                    text: text,
                                    press: press.bind(this),
                                    type: "Transparent"
                                });
                                var bFirstActionFlag = oCardPropertiesModel.getProperty("/showFirstActionInFooter");
                                var iShift = (bFirstActionFlag) ? 0 : 1;
                                var iPosition = aCustomActions[j].position + iShift;
                                var iLength = oFooter.getContent().length;
                                if (iPosition < (1 + iShift) && iPosition > (iLength - 1)) {
                                    oFooter.addContent(button);
                                } else {
                                    oFooter.insertContent(button, iPosition);
                                }
                            }
                        }
                    }
                }
                this.bCustomActionFlag = false;
            }
        }

    });
})();
