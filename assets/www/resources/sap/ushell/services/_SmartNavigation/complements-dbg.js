// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * @fileOverview To enable true encapsulation, private functions used by
 * SmartNavigation service are defined here.
 *
 * This allows for their testability without sacrificing design quality.
 */

( function ( sap ) {
    "use strict";

    var oInstance = null;

    var mConstantInterfaces = {
        STATISTIC_COLLECTION_WINDOW_DAYS: 90,
        PERS_CONTAINER_KEY_PREFIX: "ushell.smartnav.",
        ONE_DAY_IN_MILLISECOND: 24 * 60 * 60 * 1000
    };

    var oHashCodeCache = Object.create( null, { "": { value: 0 | 0 } });

    sap.ui.define( [ ], function () {
        if ( !oInstance ) {
            oInstance = Object.create( null, {
                getHashCode: {
                    value: getHashCode,
                    configurable: true
                },
                getBaseHashPart: {
                    value: getBaseHashPart,
                    configurable: true
                },
                getHashFromOArgs: {
                    value: getHashFromOArgs,
                    configurable: true
                },
                getPersContainerKey: {
                    value: getPersContainerKey,
                    configurable: true
                },
                getNavigationOccurrences: {
                    value: getNavigationOccurrences,
                    configurable: true
                },
                prepareLinksForSorting: {
                    value: prepareLinksForSorting,
                    configurable: true
                },
                mapClickCountsIntoLinkItems: {
                    value: mapClickCountsIntoLinkItems,
                    configurable: true
                },
                recordNavigationOccurrences: {
                    value: recordNavigationOccurrences,
                    configurable: true
                },
                updateHistoryEntryWithCurrentUsage: {
                    value: updateHistoryEntryWithCurrentUsage,
                    configurable: true
                }
            } );

            Object.keys( mConstantInterfaces ).forEach( function ( sName ) {
                Object.defineProperty( oInstance, sName, {
                    value: mConstantInterfaces[ sName ]
                } );
            } );
        }

        return oInstance;
    } );

    /**
     * Calculates a hash code for the given input. The hash code returned is
     * always the same for a set of inputs where their equivalent string
     * representation determined by `"" + vAny` are equal.
     *
     * For object inputs, this method is guaranteed to execute with a meaningful
     * outcome provided that the input passed has an appropriately implemented
     * `toString` method.
     *
     * @param {object|string|number|undefined} vAny Value for which hash code should be calculated.
     *
     * @returns {number} Hash code of the input value.
     */
    function getHashCode( vAny ) {
        var sAny = vAny + "";

        return oHashCodeCache[ sAny ] || ( function ( iAnyLength ) {
            var iHash = 0 | 0;

            while ( iAnyLength-- ) {
                iHash = ( iHash << 5 ) - iHash + ( sAny.charCodeAt( iAnyLength ) | 0 );
                iHash |= 0;
            }

            oHashCodeCache[ sAny ] = iHash;

            return iHash;
        })( sAny.length );
    }

    function getBaseHashPart( oURLParsing, sIntent ) {
        var oTarget = oURLParsing.parseShellHash( sIntent );

        if ( oTarget && oTarget.semanticObject && oTarget.action ) {
            return oTarget.semanticObject + "-" + oTarget.action;
        }

        throw "Invalid intent `" + sIntent + "`";
    }

    /**
     * Returns a valid hash if needed parts are provided or undefined if not.
     *
     * @param {object} oArgs `oArgs` as in {@link sap.ushell.services.CrossApplicationNavigation#toExternal}
     * @param {object} oURLParsing URL parsing service.
     */
    function getHashFromOArgs( oArgs, oURLParsing ) {
        if ( !oArgs ) {
            return null;
        }

        if ( oArgs.shellHash && oURLParsing.parseShellHash( oArgs.shellHash ) ) {
            return getBaseHashPart( oURLParsing, oArgs.shellHash );
        }

        if ( oArgs.semanticObject && oArgs.action ) {
            return oArgs.semanticObject + "-" + oArgs.action;
        }

        return null;
    }

    function getPersContainerKey( sShellHash ) {
        return mConstantInterfaces.PERS_CONTAINER_KEY_PREFIX + getHashCode( sShellHash );
    }

    function getNavigationOccurrences( sFromCurrentShellHash, oPersonalizationStore, oComponent, oURLParsing ) {

        var sPersContainerKey = getPersContainerKey( sFromCurrentShellHash );

        return oPersonalizationStore.getContainer(
            sPersContainerKey,
            {
                keyCategory: oPersonalizationStore.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationStore.constants.writeFrequency.HIGH,
                clientStorageAllowed: true
            },
            oComponent
        ).then( function ( oStore ) {
            return oStore.getItemKeys()
                .map( function ( sSemanticObject ) {
                    var oSemanticObjectHistoryEntry = oStore.getItemValue( sSemanticObject );

                    return Object.keys( oSemanticObjectHistoryEntry.actions )
                        .map( function ( sAction ) {
                            var oAction = oSemanticObjectHistoryEntry.actions[ sAction ];
                            return {
                                intent: sSemanticObject + "-" + sAction,
                                clickCount: oAction.dailyFrequency.reduce(
                                    function ( aggregate, iPastNthDayUsageCount ) {
                                        return aggregate + iPastNthDayUsageCount;
                                    },
                                    0
                                )
                            };
                        });
                })
                .reduce( function ( aEveryIntent, aSOSpecificIntentSet ) {
                    Array.prototype.push.apply( aEveryIntent, aSOSpecificIntentSet );

                    return aEveryIntent;
                }, [] );
        });
    }

    /*
     * This function ultimately mutates individual items in the aLinks list, by
     * adding the `clickCount` attribute to the items.
     */
    function prepareLinksForSorting( aLinks, aNavigationOccurrences, oURLParsing ) {

        return mapClickCountsIntoLinkItems(
            aLinks,
            aNavigationOccurrences,
            oURLParsing
        );
    }

    /*
     * This function effectively mutates individual items in the aLinks list, by
     * adding the `clickCount` attribute to the items.
     */
    function mapClickCountsIntoLinkItems( aLinks, aNavigationOccurrences, oURLParsing ) {

        var mNavigationOccurrences = Object.create( null );

        aNavigationOccurrences.forEach( function ( oNavigationOccurrence ) {
            mNavigationOccurrences[ oNavigationOccurrence.intent ] = oNavigationOccurrence;
        });

        aLinks.forEach( function ( oLink ) {
            var sBaseHashPart = getBaseHashPart( oURLParsing, oLink.intent );
            var oLinkNavigationOccurrence = mNavigationOccurrences[ sBaseHashPart ];

            oLink.clickCount = oLinkNavigationOccurrence
                ? oLinkNavigationOccurrence.clickCount
                : 0;
        });

        return aLinks;
    }

    function recordNavigationOccurrences( sFromCurrentShellHash,
        sToDestinationShellHash, oPersonalizationStore, oComponent, oURLParsing ) {

        var oTargetDestination = oURLParsing.parseShellHash( sToDestinationShellHash );
        var sPersContainerKey = getPersContainerKey( sFromCurrentShellHash );
        var sSemanticObject = oTargetDestination.semanticObject;
        var oStore;

        return oPersonalizationStore
            .getContainer(
                sPersContainerKey,
                {
                    keyCategory: oPersonalizationStore.constants.keyCategory.FIXED_KEY,
                    writeFrequency: oPersonalizationStore.constants.writeFrequency.HIGH,
                    clientStorageAllowed: true
                },
                oComponent
            )
            .then( function ( oContainer ) {
                oStore = oContainer;
                return oStore.getItemValue( sSemanticObject );
            })
            .then( function ( oSemanticObjectHistoryEntry ) {
                var oActionHistoryEntry;
                var sAction = oTargetDestination.action;

                if ( !oSemanticObjectHistoryEntry ) {
                    oSemanticObjectHistoryEntry = new SemanticObjectHistoryEntry();
                }

                oActionHistoryEntry = oSemanticObjectHistoryEntry.actions[ sAction ];
                if ( !oActionHistoryEntry ) {
                    oActionHistoryEntry = new ActionHistoryEntry();
                    oSemanticObjectHistoryEntry.actions[ sAction ] = oActionHistoryEntry;
                }

                updateHistoryEntryWithCurrentUsage( oSemanticObjectHistoryEntry );
                updateHistoryEntryWithCurrentUsage( oActionHistoryEntry );

                return oSemanticObjectHistoryEntry;
            })
            .then( function ( oUsageHistory ) {
                oStore.setItemValue( sSemanticObject, oUsageHistory );

                return oStore.save();
            });
    }

    function updateHistoryEntryWithCurrentUsage( oHistoryEntry ) {
        var iNow;

        var iTimePassedSinceLastVisit;
        var iDaysPassedSinceLastVisit;

        iNow = Date.now();
        iTimePassedSinceLastVisit = iNow - oHistoryEntry.latestVisit;
        iDaysPassedSinceLastVisit = Math.floor(
            iTimePassedSinceLastVisit / mConstantInterfaces.ONE_DAY_IN_MILLISECOND
        );

        // Account for dormant days between previous and latest usages.
        while ( iDaysPassedSinceLastVisit-- ) {
            oHistoryEntry.dailyFrequency.unshift( 0 );

            if ( oHistoryEntry.dailyFrequency.length > mConstantInterfaces.STATISTIC_COLLECTION_WINDOW_DAYS ) {
                oHistoryEntry.dailyFrequency.pop();
            }
        }

        ++oHistoryEntry.dailyFrequency[ 0 ];

        oHistoryEntry.latestVisit = iNow;

        return oHistoryEntry;
    }

    function SemanticObjectHistoryEntry() {
        return {
            actions: {},
            // This is at least equal to the greatest `latestVisit` of its
            // constituent actions.
            latestVisit: Date.now(),
            // Used like a queue, such that latest record is applied at index 0.
            // The sum of the entries should equal the sum of all constituent actions.
            // i.e. Record of usage 'x' days ago will be at index 'x'.
            dailyFrequency: [ 0 ]
        };
    }

    function ActionHistoryEntry() {
        return {
            latestVisit: Date.now(),
            // Used like a queue, such that latest record is applied at index 0.
            // i.e. Record of usage 'x' days ago will be at index 'x'.
            dailyFrequency: [ 0 ]
        };
    }
})( sap );