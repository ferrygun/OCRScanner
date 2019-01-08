(function () {
    "use strict";
    /*global sap, jQuery */
    jQuery.sap.require("sap.ovp.cards.CommonUtils");

    sap.ui.controller("sap.ovp.cards.list.List", {
        counter: 0,
        arrayLength: 0,
        minMaxModel: {},
        onInit: function () {
            this.counter = 0;
            this.minMaxModel = new sap.ui.model.json.JSONModel();
            this.minMaxModel.setData({
                minValue: 0,
                maxValue: 0
            });
            this.getView().setModel(this.minMaxModel, "minMaxModel");
        },

        onAfterRendering: function () {

            var isImageCard = this.getCardPropertiesModel().getProperty("/imageSupported");
            var densityStyle = this.getCardPropertiesModel().getProperty("/densityStyle");
            if (isImageCard) {

                var imageList = this.byId('ovpList');

                /**
                 * This function does some CSS changes after the card is rendered
                 */
                imageList.attachUpdateFinished(
                    function () {
                        var iL = this.byId('ovpList');
                        var items = iL.getItems();
                        var isIcon = false;
                        var cls = iL.getDomRef().getAttribute("class");

                        if (densityStyle === "cozy") {
                            cls = cls + " sapOvpListImageCozy";
                        } else {
                            cls = cls + " sapOvpListImageCompact";
                        }

                        iL.getDomRef().setAttribute("class", cls);

                        /**
                         * Looping through all elements in the displayed list to find out
                         * if it is icon or image type card,
                         * the size of the icon/image varies accordingly
                         */
                        items.forEach(
                            function (item) {
                                if (item.getIcon().indexOf("icon") != -1) {
                                    isIcon = true;
                                }
                            }
                        );

                        items.forEach(
                            function (item) {

                                var listItemRef = item.getDomRef();
                                var imgIcon;
                                if ( listItemRef && listItemRef.children[0] && listItemRef.children[0].children[0] ) {
                                   imgIcon = listItemRef.children[0].children[0];
                                }
                                var itemDescription = item.getDescription();
                                var icon = item.getIcon();
                                var tIcon = isIcon;
                                var title = item.getTitle();

                                var initials = title.split(' ').map(function (str) {
                                    return str ? str[0].toUpperCase() : "";
                                }).join('').substring(0, 2);

                                /**
                                 * Condition for card in which images and icons are present
                                 * we are checking if any list item is an image to set
                                 * appropriate CSS
                                 */
                                if (icon != "" && icon.indexOf("icon") == -1) {
                                    isIcon = false;
                                }

                                if(isIcon && listItemRef.children[0]) {
                                    jQuery(listItemRef.children[0]).addClass("sapOvpIconListItem");

                                } else if(listItemRef.children[0]) {
                                    jQuery(listItemRef.children[0]).addClass("sapOvpImageListItem");
                                }

                                if (imgIcon && densityStyle === "cozy" && isIcon === false) {
                                    if (imgIcon) {
                                        var cls = imgIcon.getAttribute("class");
                                        cls = cls + " sapOvpImageCozy";
                                        imgIcon.setAttribute("class", cls);
                                    }
                                }

                                var itemStyle = "";
                                if (isIcon === true && itemDescription === "") {
                                    itemStyle = densityStyle === "compact" ? "sapOvpListWithIconNoDescCompact" : "sapOvpListWithIconNoDescCozy";
                                } else if (isIcon === false && itemDescription === "") {
                                    itemStyle = densityStyle === "compact" ? "sapOvpListWithImageNoDescCompact" : "sapOvpListWithImageNoDescCozy";
                                } else {
                                    itemStyle = densityStyle === "compact" ? "sapOvpListWithImageIconCompact" : "sapOvpListWithImageIconCozy";
                                }

                                item.addStyleClass(itemStyle);

                                if (listItemRef && listItemRef.children[0] && icon === "" && listItemRef.children[0].id !== "ovpIconImagePlaceHolder") {
                                    var placeHolder = document.createElement('div');
                                    placeHolder.innerHTML = initials;
                                    placeHolder.setAttribute("id", "ovpIconImagePlaceHolder");
                                    placeHolder.className = isIcon === true ? "sapOvpIconPlaceHolder" : "sapOvpImagePlaceHolder";
                                    if (isIcon === false && densityStyle === "cozy") {
                                        placeHolder.className = placeHolder.className + " sapOvpImageCozy";
                                    }
                                    listItemRef.insertBefore(placeHolder, listItemRef.children[0]);
                                }
                                isIcon = tIcon;

                            }
                        );
                    }.bind(this));
            }
            var oCompData = this.getOwnerComponent().getComponentData();
            if (this.getCardPropertiesModel().getProperty("/layoutDetail") === "resizable") {
                var oDashboardLayoutUtil = this.getDashboardLayoutUtil();
                var oCard = oDashboardLayoutUtil.dashboardLayoutModel.getCardById(oCompData.cardId);
                var iHeaderHeight = this.getHeaderHeight();
                var sCardId = oDashboardLayoutUtil.getCardDomId(oCompData.cardId);
                var element = document.getElementById(sCardId);
                if (!oCard.dashboardLayout.autoSpan) {
                    element.getElementsByClassName('sapOvpWrapper')[0].style.height =
                        (oCard.dashboardLayout.rowSpan * oDashboardLayoutUtil.ROW_HEIGHT_PX) - (iHeaderHeight + 2 * oDashboardLayoutUtil.CARD_BORDER_PX) + "px";
                }
                if (oCard.dashboardLayout.showOnlyHeader) {
                    element.classList.add("sapOvpMinHeightContainer");
                }
            }
        },

        
        onListItemPress: function (oEvent) {
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

        /**
         * This function loops through context values and gets
         * the Max & Min Value for the card in 'this'
         * context(ie different for different cards)
         * Requirement: In case of global filters applied context changes and Max and Min should also change
         * Drawback : Max and Min are calculated for each list Items again considering all items in context.
         * */
        _getMinMaxObjectFromContext: function (noOfItems) {
            this.counter++;
            var oEntityType = this.getEntityType(),
                sAnnotationPath = this.getCardPropertiesModel().getProperty("/annotationPath"),
                aRecords = oEntityType[sAnnotationPath],
                context = this.getMetaModel().createBindingContext(oEntityType.$path + "/" + sAnnotationPath),
                minMaxObject = {
                    minValue: 0,
                    maxValue: 0
                };

            //Case 1:  In case of percentage
            if (sap.ovp.cards.AnnotationHelper.isFirstDataPointPercentageUnit(context, aRecords)) {
                minMaxObject.minValue = 0;
                minMaxObject.maxValue = 100;
                return minMaxObject;
            }

            //Case 2: Otherwise
            var dataPointValue = sap.ovp.cards.AnnotationHelper.getFirstDataPointValue(context, aRecords),
                barList = this.getView().byId("ovpList"),
                listItems = barList.getBinding("items"),
                oModel = this.getModel(),
                itemsContextsArray = listItems.getCurrentContexts();
            for (var i = 0; noOfItems ? i < noOfItems : i < itemsContextsArray.length; i++) {
                /*To get original value by going through relative paths in case of slash*/
                var originalValue = oModel.getOriginalProperty(dataPointValue,itemsContextsArray[i]),
                    currentItemValue = parseFloat(originalValue, 10);
                if (currentItemValue < minMaxObject.minValue) {
                    minMaxObject.minValue = currentItemValue;
                } else if (currentItemValue > minMaxObject.maxValue){
                    minMaxObject.maxValue = currentItemValue;
                }
            }
            return minMaxObject;
        },

        /**
         *  this function
         *  1.updates both min and max values in 'this' context
         *  and
         *  2.then updates the model attached to that particular card
         *  3.then refreshes the model to affect the changes
         *  */
        _updateMinMaxModel: function ( noOfItems) {
            var minMaxObject = this._getMinMaxObjectFromContext(noOfItems);
            this.minMaxModel.setData({
                minValue: minMaxObject.minValue,
                maxValue: minMaxObject.maxValue
            });
            this.minMaxModel.refresh();
            return minMaxObject;
        },

        /**
         * this function call update method and return the value.
         * */
        returnBarChartValue: function (value) {
            var minMaxObject = this._updateMinMaxModel();
            var iValue = parseFloat(value, 10);
            // In case of values are not between (-1,1) show value as is
            if (iValue !== 0) {
                return iValue;
                // If max Value is Zero,Min Value very less and Values is zero then show minimal value in negative
            } else if (minMaxObject.maxValue == 0 && minMaxObject.minValue < -10) {
                return -0.1;
                // If min Value is Zero,Max Value very large and Values is zero then show minimal value in positive
            } else if (minMaxObject.minValue == 0 && minMaxObject.maxValue > 10) {
                return 0.1;
            }
            //If both Max is equal to zero and min is equal to zero ,Show value as it is.
            return iValue;

        },

        /**
         * Gets the card items binding object for the count footer
         */
        getCardItemsBinding: function () {
            var list = this.getView().byId("ovpList");
            return list.getBinding("items");
        },

        /**
         * Gets the card items binding info
         */
        getCardItemBindingInfo: function () {
            var oList = this.getView().byId("ovpList");
            return oList.getBindingInfo("items");
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
                    iAvailableSpace = newCardLayout.rowSpan * newCardLayout.iRowHeightPx - iHeightWithoutContainer;
                    iNoOfItems = Math.abs(Math.floor(iAvailableSpace / cardSizeProperties.itemHeight));
                    $card.style.height = newCardLayout.rowSpan * newCardLayout.iRowHeightPx + 'px';
                }
                oOvpContent.style.height = (newCardLayout.rowSpan * newCardLayout.iRowHeightPx) - ( iHeaderHeight + 2 * newCardLayout.iCardBorderPx) + "px";
                if (iNoOfItems !== oBindingInfo.length) {
                    oBindingInfo.length = iNoOfItems;
                    newCardLayout.noOfItems = oBindingInfo.length;
                    this._updateMinMaxModel(oBindingInfo.length);
                    this.getCardItemsBinding().refresh();
                }
            } catch (error) {
                jQuery.sap.log.warning("OVP resize: " + oCompData.cardId + " catch " + error.toString());
            }
        }
    });
})();
