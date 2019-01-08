/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element"],
    function (jQuery, SapUiCoreElement) {

        "use strict";

        /**
         * Constructor for a new DisplayGroup.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @name sap.ui.vtm.DisplayGroup
         * @public
         * @class
         * This class is used to represent display states for a set of scene nodes.
         * The same display state need not be used for all of the scene nodes in the set.
         * @author SAP SE
         * @version 1.52.0
         * @constructor
         * @param {string] sId An optional ID for the {@link sap.ui.vtm.DisplayGroup}.
         * @param {object} [mSettings] An optional object with initial settings for the new {@link sap.ui.vtm.DisplayGroup} instance.
         * @extends sap.ui.core.Element
         */
        var DisplayGroup = SapUiCoreElement.extend("sap.ui.vtm.DisplayGroup", /** @lends sap.ui.vtm.DisplayGroup.prototype */ {
            metadata: {
                properties: {

                    /**
                     * A plain object map that uses scene node id as the key and a display state object as the value.
                     * The display state is a plain JavaScript object that can contain the following properties:
                     * <ul>
                     * <li>visibility - If defined, this boolean value specifies the scene node visibility</li>
                     * <li>opacity - If defined, this numeric value between 0 and 100 inclusive defines the scene node opacity.<br/>
                     * </li>
                     * <li>highlightColor - If defined, this string value defines the scene node highlight color.</li>
                     * If an empty string (<code>""</code>) is used, the highlight color is cleared, otherwise the value is expected to be a {@link sap.ui.core.CSSColor}.</li>
                     * <li>recursive - If <code>true</code> this display state will be applied to the scene node and its descendants.</li>
                     * </ul>
                     * For example:
                     * <code><pre>
                     * {
                     *   visibility: true,
                     *   opacity: 100,
                     *   highlightColor: "red",
                     *   recursive: false
                     * }</pre></code>
                     * Display state objects can be reused multiple times in the map to reduce memory usage.
                     */
                    displayStatesBySceneNodeId: {
                        type: "object",
                        defaultValue: {}
                    }
                }
            }
        });

        return DisplayGroup;
    },
    true);