// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * @fileOverview
 *
 * <p>Enhanced provider of application navigation, and available navigation targets.<p>
 *
 * <p>Defines a service that provides a <code>getLinks()</code> method which complements
 * the one provided by CrossApplicationNavigation service by sorting the
 * resulting list in the order of relevance to the calling application.</p>
 *
 * <p>Note that in order to effectively leverage the enhanced <code>getLinks()</code> method
 * provided by this service, it is pertinent that the API user employs this
 * service's version of <code>toExternal()</code> for cross application navigation (instead)
 * of using the one provided by CrossApplicationNavigation service.</p>
 *
 * @version 1.52.4
 */

/* global sap, jQuery */

( function ( sap, jQuery ) {
    "use strict";

    sap.ui.define(
        [
            "sap/ushell/services/Container",
            "sap/ushell/services/AppConfiguration",
            "sap/ushell/services/Personalization",
            "sap/ushell/services/URLParsing",
            "sap/ushell/services/CrossApplicationNavigation",
            "sap/ushell/services/_SmartNavigation/complements"
        ],
        function ( oContainer, oAppConfiguration, oPersonalizationStore,
            oURLParsing, oCrossAppNav, oPrivate ) {

            oContainer = sap.ushell.Container;

            oURLParsing = oContainer.getService( "URLParsing" );
            oCrossAppNav = oContainer.getService( "CrossApplicationNavigation" );
            oPersonalizationStore = oContainer.getService( "Personalization" );

            function ConstructorForUshellContainer() {
                return new SmartNavigation(
                    oPrivate,
                    oAppConfiguration,
                    oPersonalizationStore,
                    oURLParsing,
                    oCrossAppNav
                );
            }

            ConstructorForUshellContainer.hasNoAdapter = true;
            return ConstructorForUshellContainer;
        }
    );

    sap.ushell.services.SmartNavigation = SmartNavigation;

    /**
     * Constructs an instance of SmartNavigation.
     *
     * <p>
     * The constructed service provides an enhancement on {@link CrossApplicationNavigation#getLinks}
     * and {@link CrossApplicationNavigation#toExternal}. In order for an application
     * to leverage this enhancement, it is pertinent that the application uses
     * {@link SmartNavigation#toExternal} for naviagtion. Hence the caller can
     * subsequently use {@link SmartNavigation#getLinks} with the outcome that
     * it sorts the resulting list in the order of frequency of <i>Attempted</i> navigation
     * from the application to respective links.
     *
     * <p>
     * <i>Attempted</i> in the previous paragraph is emphasized due to the fact
     * that a click on the link will cause an increment of the frequency count,
     * regardless of wether the navigation was successful or not.
     *
     * <p>
     * Note that an instance of this service should be obtained with <code>sap.ushell.services.Container#getService( "SmartNavigation" )</code>
     * @see sap.ushell.services.Container#getService
     *
     * @name sap.ushell.services.SmartNavigation
     * @constructor
     * @public
     * @since 1.44.0
     */
    function SmartNavigation( oPrivate, oAppConfiguration, oPersonalizationStore,
        oURLParsing, oCrossAppNav ) {

        if ( !SmartNavigation.instance ) {
            Object.defineProperty( SmartNavigation, "instance", {
                value: Object.create( null, {
                    /**
                     * Resolves the given semantic object (or action) and business
                     * parameters to a list of links available to the user, sorted
                     * according their relevance to the calling application.
                     *
                     * The relevance of link is defined by the frequency with which
                     * a navigation activity from the calling application to that
                     * link occurs.
                     *
                     * Internally, this method delegates to {@link sap.ushell.services.CrossApplicationNavigation#getLinks}
                     * and then sorts the resulting list accordingly.
                     *
                     * @returns {jQuery.Deferred.promise}
                     *  A promise that resolves with an array of link objects
                     *  sorted according to their relevance to the calling application.
                     *
                     * @see sap.ushell.services.CrossApplicationNavigation#getLinks
                     *
                     * @since 1.44.0
                     * @public
                     * @function
                     * @memberof sap.ushell.services.SmartNavigation#
                     */
                    getLinks: {
                        value: function ( oArgs ) {

                            var aAllLinks = oCrossAppNav.getLinks( oArgs );
                            var oCurrentApplication = oAppConfiguration.getCurrentApplication();
                            var sFromCurrentShellHash = oCurrentApplication.sShellHash;
                            var oAppComponent = oCurrentApplication.componentHandle;

                            if (oCurrentApplication.componentHandle) {
                                oAppComponent = oCurrentApplication.componentHandle.getInstance();
                            }

                            if ( !sFromCurrentShellHash ) {
                                // This may happen because, the application
                                // (the calling component belongs to) probably
                                // has not initialised fully.
                                jQuery.sap.log.warning(
                                    "Call to SmartNavigation#getLinks() simply "
                                    + "delegated to CrossApplicationNavigation#getLinks()"
                                    + " because oAppConfiguration#getCurrentApplication()#sShellHash"
                                    + " evaluates to undefined."
                                );

                                return aAllLinks;
                            }

                            return jQuery
                                .when(
                                    aAllLinks,
                                    oPrivate.getNavigationOccurrences(
                                        sFromCurrentShellHash,
                                        oPersonalizationStore,
                                        oAppComponent,
                                        oURLParsing
                                    )
                                )
                                .then( function ( aLinks, aNavigationOccurrences ) {
                                    if ( aNavigationOccurrences.length === 0 ) {
                                        return aLinks;
                                    }

                                    return oPrivate
                                        .prepareLinksForSorting(
                                        aLinks,
                                        aNavigationOccurrences,
                                        oURLParsing
                                        )
                                        .sort( function ( oLink, oOtherLink ) {
                                            return oOtherLink.clickCount - oLink.clickCount;
                                        } );
                                } );
                        }
                    },
                    /**
                     * Usage of this method in place of {@link sap.ushell.services.CrossApplicationNavigation#toExternal}
                     * drives the smartness of the results returned by {@link sap.ushell.services.SmartNavigation#getLinks}.
                     *
                     * @see sap.ushell.services.CrossApplicationNavigation#toExternal
                     *
                     * @since 1.44.0
                     * @public
                     * @function
                     * @memberof sap.ushell.services.SmartNavigation#
                     */
                    toExternal: {
                        value: function ( oArgs, oComponent ) {
                            var _arguments = arguments;

                            var sDestinationShellHash = oPrivate
                                .getHashFromOArgs( oArgs.target, oURLParsing );

                            var fnToExternal = function () {
                                return oCrossAppNav.toExternal
                                    .apply( oCrossAppNav, _arguments );
                            };

                            var oCurrentApplication = oAppConfiguration.getCurrentApplication();
                            var sFromCurrentShellHash = oCurrentApplication.sShellHash;
                            var oAppComponent = oCurrentApplication.componentHandle;

                            if (oCurrentApplication.componentHandle) {
                                oAppComponent = oCurrentApplication.componentHandle.getInstance();
                            }

                            // If current application has not been instantiated
                            // fully or functions called with invalid target
                            // the tracking will not be triggered. In case of
                            // invalid target it is up to CrossAppNavigation#toExternal
                            // to handle the error.
                            if ( !sFromCurrentShellHash ) {
                                jQuery.sap.log.warning(
                                    "Current shell hash could not be identified. Navigation will not be tracked.",
                                    null,
                                    "sap.ushell.services.SmartNavigation"
                                );

                                return jQuery.when( fnToExternal() );
                            }

                            if ( !sDestinationShellHash ) {
                                jQuery.sap.log.warning(
                                    "Destination hash does not conform with the ushell guidelines. Navigation will not be tracked.",
                                    null,
                                    "sap.ushell.services.SmartNavigation"
                                );

                                return jQuery.when( fnToExternal() );
                            }

                            return oPrivate
                                .recordNavigationOccurrences(
                                    sFromCurrentShellHash,
                                    sDestinationShellHash,
                                    oPersonalizationStore,
                                    oAppComponent,
                                    oURLParsing
                                )
                                .then( fnToExternal );
                        }
                    },
                    /**
                     * Completely delegates to {@link sap.ushell.services.CrossApplicationNavigation#hrefFoExternal},
                     * and either may be used in place of the other with exactly the
                     * same outcome.
                     *
                     * @see sap.ushell.services.CrossApplicationNavigation#hrefForExternal
                     *
                     * @since 1.46.0
                     * @public
                     * @function
                     * @memberof sap.ushell.services.SmartNavigation#
                     */
                    hrefForExternal: {
                        value: function () {
                            var oHrefList = oCrossAppNav.hrefForExternal
                                .apply( oCrossAppNav, arguments );

                            return /* jQuery.when( */ oHrefList /* ) */;
                        }
                    },
                    /**
                     * Completely delegates to {@link sap.ushell.services.CrossApplicationNavigation#getPrimaryIntent},
                     * and either may be used in place of the other with exactly the
                     * same outcome.
                     *
                     * @see sap.ushell.services.CrossApplicationNavigation#getPrimaryIntent
                     *
                     * @since 1.48.0
                     * @public
                     * @function
                     * @memberof sap.ushell.services.SmartNavigation#
                     */
                    getPrimaryIntent: {
                      value: function () {
                          var oPrimaryIntent = oCrossAppNav.getPrimaryIntent
                              .apply( oCrossAppNav, arguments);

                          return /* jQuery.when( */ oPrimaryIntent /* ) */;
                      }
                    },
                    /**
                     * Tracks a navigation to a valid intent if provided via arguments but does not perform the navigation itself.
                     * If no valid intent was provided tracking will be prevented. The intent has to consist of SemanticObject and Action.
                     * It may be passed as complete shellHash (presidence) or as individual parts
                     * Additional parameters will not be part of the tracking and ignored
                     * This Method can be used to track a click if the actual navigation was triggered via clicking a link on the UI.
                     *
                     *
                     * @param {object} oArguments
                     *      The navigation target as object, for example:
                     *
                     * <code>
                     *  {
                     *      target: {
                     *          shellHash: 'SaleOrder-display'
                     *      }
                     *  }
                     * </code>
                     *
                     *  or
                     *
                     * <code>
                     *  {
                     *      target: {
                     *          semanticObject: 'SalesOrder',
                     *          action: 'action'
                     *      }
                     *  }
                     *
                     *  @returns {object} promise
                     *      the new item created for tracking
                     *
                     * </code>
                     * @since 1.46.0
                     * @public
                     * @function
                     * @memberof sap.ushell.services.SmartNavigation#
                     */
                    trackNavigation: {
                        value: function ( oArgs ) {
                            var oTarget = oArgs.target;
                            var oCurrentApplication = oAppConfiguration.getCurrentApplication();
                            var sFromCurrentShellHash = oCurrentApplication.sShellHash;

                            var sDestinationShellHash;

                            if ( !sFromCurrentShellHash ) {
                                // Possibly the application (the calling
                                // component belongs to) has not initialised
                                // fully.
                                jQuery.sap.log.warning(
                                    "Call to SmartNavigation#trackNavigation() simply ignored"
                                    + " because oAppConfiguration#getCurrentApplication()#sShellHash"
                                    + " evaluates to undefined."
                                );

                                return jQuery.when( null );
                            }

                            sDestinationShellHash = oPrivate.getHashFromOArgs( oTarget, oURLParsing );
                            // Check if a valid destination was provided
                            if ( !sDestinationShellHash ) {
                                jQuery.sap.log.warning(
                                    "Navigation not tracked - no valid destination provided",
                                    null,
                                    "sap.ushell.services.SmartNavigation"
                                );

                                return jQuery.when( null );
                            }

                            jQuery.sap.log.debug(
                                "Navigation to " + sDestinationShellHash + " was tracked out of " + sFromCurrentShellHash,
                                null,
                                "sap.ushell.services.SmartNavigation"
                            );

                            return oPrivate.recordNavigationOccurrences(
                                sFromCurrentShellHash,
                                sDestinationShellHash,
                                oPersonalizationStore,
                                oCurrentApplication.componentHandle.getInstance(),
                                oURLParsing
                            );
                        }
                    },
                    // *************************
                    /**
                     * @private
                     */
                    constructor: {
                        value: SmartNavigation
                    }
                } )
            } );
        }

        return SmartNavigation.instance;
    }
} )( sap, jQuery );