(function () {
    "use strict";
    /*global sap, jQuery */
    jQuery.sap.require("sap.ovp.cards.CommonUtils");

    sap.ui.controller("sap.ovp.cards.table.Table", {

        onInit: function () {
        },

        onColumnListItemPress: function (oEvent) {
            /*
             On Content click of OVP Cards used as an API in other Applications
             */
            if (sap.ovp.cards.CommonUtils.checkIfAPIIsUsed(this)) {
                sap.ovp.cards.CommonUtils.onContentClicked(oEvent);
            } else {
                var aNavigationFields = this.getEntityNavigationEntries(oEvent.getSource().getBindingContext(), this.getCardPropertiesModel().getProperty("/annotationPath"));
                this.doNavigation(oEvent.getSource().getBindingContext(), aNavigationFields[0]);
            }
        },

        //function to open quick view popover to show contact information
        onContactDetailsLinkPress: function(oEvent){
            var oPopover;
            oPopover = oEvent.getSource().getParent().getAggregation("items")[0];
            oPopover.bindElement(oEvent.getSource().getBindingContext().getPath());
            oPopover.openBy(oEvent.getSource());
        },

        /**
         * Gets the card items binding object for the count footer
         */
        getCardItemsBinding: function() {
            var table = this.getView().byId("ovpTable");
            return table.getBinding("items");
        },

        onAfterRendering: function () {
            var oCompData = this.getOwnerComponent().getComponentData();
            var oCardPropertiesModel = this.getCardPropertiesModel();
            if (oCardPropertiesModel.getProperty("/layoutDetail") === "resizable") {
                var oDashboardLayoutUtil = this.getDashboardLayoutUtil();
                var oCard = oDashboardLayoutUtil.dashboardLayoutModel.getCardById(oCompData.cardId);
                var iHeaderHeight = this.getHeaderHeight();
                var sCardId = oDashboardLayoutUtil.getCardDomId(oCompData.cardId);
                var element = document.getElementById(sCardId);
                if (!oCard.dashboardLayout.autoSpan) {
                    element.getElementsByClassName('sapOvpWrapper')[0].style.height =
                        ((oCard.dashboardLayout.rowSpan * oDashboardLayoutUtil.ROW_HEIGHT_PX) + 1 - (iHeaderHeight + 2 * oDashboardLayoutUtil.CARD_BORDER_PX)) + "px"
                }
                if (oCard.dashboardLayout.showOnlyHeader) {
                    element.classList.add("sapOvpMinHeightContainer");
                }
                //For resizable card layout show the no of columns based upon colspan
                this.addColumnInTable(jQuery(element), {
                    colSpan: oCard.dashboardLayout.colSpan
                });
            } else {
                var oTable = this.getView().byId("ovpTable");
                var aAggregation = oTable.getAggregation("columns");
                //For fixed card layout show only 3 columns
                for (var iCount = 0; iCount < 3; iCount++) {
                    if (aAggregation[iCount]) {
                        aAggregation[iCount].setStyleClass("sapTableColumnShow").setVisible(true);
                    }
                }
            }
        },

        /**
         * Gets the card items binding info
         */
        getCardItemBindingInfo: function () {
            var oList = this.getView().byId("ovpTable");
            return oList.getBindingInfo("items");
        },

        /**
         * Handles no of columns to be shown in table when view-switch happens
         *
         * @method addColumnInTable
         * @param {String} sCardId - Card Id
         * @param {Object} oCardResizeData- card resize properties
         */
        addColumnInTable: function ($card, oCardResizeData) {
            if (oCardResizeData.colSpan >= 1) {
                if (jQuery($card).find("tr").length != 0) {
                    var table = sap.ui.getCore().byId(jQuery($card).find(".sapMList").attr("id"));
                    var aggregation = table.getAggregation("columns");
                    var iColSpan = oCardResizeData.colSpan;
                    // No of columns to be shown calculated based upon colspan
                    var iIndicator = iColSpan + 1;
                    for (var i = 0; i < 6; i++) {
                        if (aggregation[i]) {
                            if (i <= iIndicator) {
                                //Show any particular column
                                aggregation[i].setStyleClass("sapTableColumnShow").setVisible(true);
                            } else {
                                //hide any particular column
                                aggregation[i].setStyleClass("sapTableColumnHide").setVisible(false);
                            }
                        }
                    }
                }
            }
        },

        /**
         * Method called upon card resize
         *
         * @method resizeCard
         * @param {Object} newCardLayout- resize data of the card
         * @return {Object} cardSizeProperties - card properties
         */
        resizeCard: function (newCardLayout, cardSizeProperties) {
            var iNoOfItems, iAvailableSpace, iHeightWithoutContainer, iAvailableSpace;
            try {
                var oCompData = this.getOwnerComponent().getComponentData(),
                    $card = document.getElementById(this.getDashboardLayoutUtil().getCardDomId(oCompData.cardId)),
                    oBindingInfo = this.getCardItemBindingInfo(),
                    iHeaderHeight = this.getHeaderHeight(),
                    oOvpContent = this.getView().byId('ovpCardContentContainer').getDomRef();
                if (newCardLayout.showOnlyHeader) {
                    oOvpContent.classList.add('sapOvpContentHidden');
                    iNoOfItems = 0;
                } else {
                    oOvpContent.classList.remove('sapOvpContentHidden');
                    iHeightWithoutContainer = iHeaderHeight + cardSizeProperties.dropDownHeight + 2 * newCardLayout.iCardBorderPx;
                    iAvailableSpace = (newCardLayout.rowSpan * newCardLayout.iRowHeightPx) - iHeightWithoutContainer - cardSizeProperties.itemHeight;
                    iNoOfItems = Math.abs(Math.floor(iAvailableSpace / cardSizeProperties.itemHeight));
                    $card.style.height = newCardLayout.rowSpan * newCardLayout.iRowHeightPx + 'px';
                }
                oOvpContent.style.height = (newCardLayout.rowSpan * newCardLayout.iRowHeightPx) - ( iHeaderHeight + 2 * newCardLayout.iCardBorderPx) + "px";
                this.addColumnInTable(this.getView().$(), newCardLayout);
                if (iNoOfItems !== oBindingInfo.length) {
                    oBindingInfo.length = iNoOfItems;
                    newCardLayout.noOfItems = oBindingInfo.length;
                    this.getCardItemsBinding().refresh();
                }
            } catch (error) {
                jQuery.sap.log.warning("OVP resize: " + oCompData.cardId + " catch " + error.toString());
            }
        }
    });
})();
