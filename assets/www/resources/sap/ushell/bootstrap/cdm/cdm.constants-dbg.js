sap.ui.define( [
    "../common/common.util"
], function ( oCommonBootUtil ) {
    "use strict";

    return oCommonBootUtil.deepFreeze( {
        // default ushell config object with all local adapters configured which
        // are not available for CDM, yet
        defaultConfig: {
            "defaultRenderer": "fiori2",
            "renderers": {
                "fiori2": {
                    "componentData": {
                        "config": {
                            "enableHideGroups": true,
                            "enablePersonalization": true,
                            "enableTagFiltering": false,
                            "enableSearch": false,
                            "enableTilesOpacity": false,
                            "enableSetTheme": true,
                            "enableAccessibility": true,
                            "enableHelp": false,
                            "enableUserDefaultParameters": true,
                            "preloadLibrariesForRootIntent": false,
                            "applications": {
                                "Shell-home": {
                                    "enableActionModeMenuButton": true,
                                    "enableActionModeFloatingButton": true,
                                    "enableEasyAccess": false,
                                    "enableTileActionsIcon": false,
                                    "enableHideGroups": false,
                                    "enableLockedGroupsCompactLayout": false,
                                    "enableTilesOpacity": false
                                }
                            },
                            "rootIntent": "Shell-home"
                        }
                    }
                }
            },
            "services": {
                "Personalization": {
                    "adapter": {
                        "module": "sap.ushell.adapters.local.PersonalizationAdapter"
                    }
                },
                "AppState": {
                    "adapter": {
                        "module": "sap.ushell.adapters.local.AppStateAdapter"
                    }
                },
                "NavTargetResolution": {
                    "config": {
                        "runStandaloneAppFolderWhitelist": { },
                        "allowTestUrlComponentConfig": false,
                        "enableClientSideTargetResolution": true
                    },
                    "adapter": {
                        "module": "sap.ushell.adapters.local.NavTargetResolutionAdapter"
                    }
                },
                "SupportTicket": {
                    "config": {
                        "enabled": false
                    },
                    "adapter": {
                        "module": "sap.ushell.adapters.local.SupportTicketAdapter"
                    }
                },
                "EndUserFeedback": {
                    "adapter": {
                        "config": {
                            "enabled": false
                        },
                        "module": "sap.ushell.adapters.local.EndUserFeedbackAdapter"
                    }
                },
                "UserInfo": {
                    "adapter": {
                        "module": "sap.ushell.adapters.local.UserInfoAdapter",
                        "config": {
                            "themes": [
                                { "id": "sap_belize_plus", "name": "SAP Belize Plus" },
                                { "id": "sap_belize", "name": "SAP Belize" },
                                { "id": "sap_belize_hcb", "name": "SAP Belize HCB" },
                                { "id": "sap_belize_hcw", "name": "SAP Belize HCW" }
                            ]
                        }
                    }
                },
                "UserDefaultParameterPersistence": {
                    "adapter": {
                        "module": "sap.ushell.adapters.local.UserDefaultParameterPersistenceAdapter"
                    }
                }
            }
        }
    } );
} );