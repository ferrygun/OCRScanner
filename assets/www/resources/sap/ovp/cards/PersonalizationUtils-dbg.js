/*!
 * Copyright (c) 2009-2014 SAP SE, All Rights Reserved
 */

sap.ui.define([
    'jquery.sap.global',
], function(jQuery) {
    "use strict";
    
    function applyViewSwitchChange(oChange, aCards) {
        aCards.every(function (oCard) {
            if (oCard.id === oChange.cardId) {
                oCard.selectedKey = oChange.selectedKey;
                return false;
            }
            return true;
        });
        return aCards;
    }
    
    function applyVisibilityChange(oChange, aCards) {
        aCards.every(function (oCard) {
            if (oCard.id === oChange.cardId) {
                oCard.visibility = oChange.visibility;
                return false;
            }
            return true;
        });
        return aCards;
    }
    
    function applyPositionChange(oChange, aCards) {
        var aInvisibleCards = [];
        var aVisibleCards, oTempCard;
        
        // filter out visible cards for swapping
        aVisibleCards = aCards.filter(function (oCard) {
            return oCard.visibility;
        });
        // store invisible cards with positions for later merge
        aCards.forEach(function (oCard, iIndex) {
            if (!oCard.visibility) {
                aInvisibleCards.push({
                    card: oCard,
                    index: iIndex
                });
            }
        });
        if (!aVisibleCards[oChange.oldPosition] || !aVisibleCards[oChange.position]) {
            // This means there has been some migration issue and this change must not be applied,
            // So simply return aCards as is. User should be advised to do a Manage Cards --> Restore
            // to avoid future inconsistency.
            return aCards;
        }
        // swap cards
        oTempCard = aVisibleCards[oChange.oldPosition];
        aVisibleCards[oChange.oldPosition] = aVisibleCards[oChange.position];
        aVisibleCards[oChange.position] = oTempCard;
        // merge invisible cards back to original positions
        aInvisibleCards.forEach(function (oInvisibleCard) {
            aVisibleCards.splice(oInvisibleCard.index, 0, oInvisibleCard.card);
        });
        aCards = aVisibleCards;
        
        return aCards;
    }
    
    function applyDragOrResizeChange(oChange, aCards) {
        aCards.every(function (oCard) {
            if (oCard.id === oChange.cardId) {
                Object.keys(oChange.dashboardLayout).forEach(function (sKey) {
                    if (!oCard.dashboardLayout[sKey]) {
                        oCard.dashboardLayout[sKey] = {};
                    }
                    if (oChange.dashboardLayout[sKey].rowSpan) {
                        oCard.dashboardLayout[sKey].rowSpan = oChange.dashboardLayout[sKey].rowSpan;
                    }
                    if (oChange.dashboardLayout[sKey].colSpan) {
                        oCard.dashboardLayout[sKey].colSpan = oChange.dashboardLayout[sKey].colSpan;
                    }
                    if (oChange.dashboardLayout[sKey].maxColSpan) {
                        oCard.dashboardLayout[sKey].maxColSpan = oChange.dashboardLayout[sKey].maxColSpan;
                    }
                    if (oChange.dashboardLayout[sKey].noOfItems) {
                        oCard.dashboardLayout[sKey].noOfItems = oChange.dashboardLayout[sKey].noOfItems;
                    }
                    if (oChange.dashboardLayout[sKey].hasOwnProperty('autoSpan')) {
                        oCard.dashboardLayout[sKey].autoSpan = oChange.dashboardLayout[sKey].autoSpan;
                    }
                    if (oChange.dashboardLayout[sKey].row) {
                        oCard.dashboardLayout[sKey].row = oChange.dashboardLayout[sKey].row;
                    }
                    if (oChange.dashboardLayout[sKey].column) {
                        oCard.dashboardLayout[sKey].col = oChange.dashboardLayout[sKey].column;
                    }
                    if (oChange.dashboardLayout[sKey].hasOwnProperty('showOnlyHeader')) {
                        oCard.dashboardLayout[sKey].showOnlyHeader = oChange.dashboardLayout[sKey].showOnlyHeader;
                    }
                });
                return false;
            }
            return true;
        });
        return aCards;
    }
    
    function mergeChanges(aCards, aDeltaChanges) {
        if (!Array.isArray(aDeltaChanges) || !aCards) {
            return aCards;
        }
        
        var aMergedCards = [];
        aCards.forEach(function(oCard) {
            var oMergedCard = {};
            Object.keys(oCard).forEach(function (sKey) {
                oMergedCard[sKey] = oCard[sKey];
            }.bind(this));
            aMergedCards.push(oMergedCard);
        });
        
        aDeltaChanges.forEach(function (oChange) {
            switch (oChange.getChangeType()) {
            case "viewSwitch":
                aMergedCards = applyViewSwitchChange(oChange.getContent(), aMergedCards);
                break;
            case "visibility":
                aMergedCards = applyVisibilityChange(oChange.getContent(), aMergedCards);
                break;
            case "position":
                aMergedCards = applyPositionChange(oChange.getContent(), aMergedCards);
                break;
            case "dragOrResize":
                aMergedCards = applyDragOrResizeChange(oChange.getContent(), aMergedCards);
                break;
            default:
                break;
            }
            
            // TODO: Error handling, if any(?)
//            if (!aMergedCards) {
//                jQuery.sap.log.info('OVP Personalization: ' + "Could not apply change of " + oChange.getChangeType() + " to card: " + oChange.getContent()['cardId']);
//            }
        });
        
        return aMergedCards;
    }
    
    function addMissingCardsFromManifest(aManifestCards, aDeltaCards) {
        var aMissingCards = aManifestCards.filter(function (oManifestCard) {
            var bHit = false;
            aDeltaCards.forEach(function (oDeltaCard) {
                if (oManifestCard.id === oDeltaCard.id) {
                    bHit = true;
                    return;
                }
            });
            return !bHit;
        });
        return aDeltaCards.concat(aMissingCards);
    }
    
    var oPersonalizationUtils = {
        mergeChanges: mergeChanges,
        addMissingCardsFromManifest: addMissingCardsFromManifest
    };
    
    return oPersonalizationUtils;
},
/* bExport= */true);