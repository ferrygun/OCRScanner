/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define(
    ["jquery.sap.global", "sap/ui/core/Element", "sap/ui/vk/dvl/GraphicsCore", "sap/ui/vk/Scene", "sap/ui/vk/NodeHierarchy", "./ViewableLoadInfo", "./SceneNode", "./ArrayUtilities"],
    function (jQuery, SapUiCoreElement, SapUiVkGraphicsCore, SapUiVkScene, SapUiVkNodeHierarchy, SapUiVtmViewableLoadInfo, SapUiVtmSceneNode, SapUiVtmArrayUtilities) {

        "use strict";

        /**
         * This class is not intended to be directly instantiated by application code.
         * A {@link sap.ui.vtm.Scene} object is created when a {@link sap.ui.vtm.Vtm} object is created.
         * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
         * @public
         * @class
         * Allows access to scene nodes in the scene.
         * A single {@link sap.ui.vtm.Scene} is shared by the {@link sap.ui.vtm.Viewport} objects in all the {@link sap.ui.vtm.Panel} objects associated with a {@link sap.ui.vtm.Vtm} instance.
         * Visibility, selection, highlighting and opacity can be controlled for each scene node separately in each {@link sap.ui.vtm.Viewport}.
         * @author SAP SE
         * @version 1.52.0
         * @name sap.ui.vtm.Scene
         * @extends sap.ui.core.Element
         */
        var Scene = SapUiCoreElement.extend("sap.ui.vtm.Scene", /** @lends sap.ui.vtm.Scene.prototype */ {

            metadata: {
                events: {
                    /**
                     * Raised to indicate download progress of a viewable while viewables are being downloaded
                     */
                    downloadProgress: {
                        parameters: {
                            /**
                             * The viewable that is being downloaded.
                             */
                            viewable: { type: "sap.ui.vtm.Viewable" },

                            /**
                             * The number of bytes that have been downloaded.
                             */
                            downloadedBytes: { type: "int" },

                            /**
                             * The total number of bytes that need to be downloaded.
                             */
                            totalBytes: { type: "int" }
                        }
                    },

                    /**
                     * Raised when starting a download of a set of viewables.
                     */
                    downloadStarted: {
                        parameters: {
                            /**
                             * A set of {@link sap.ui.vtm.ViewableLoadInfo} objects that describe the status
                             * of each {@link sap.ui.vtm.Viewable} passed to the {@link #loadViewablesAsync} call.
                             */
                            viewableLoadInfos: { type: "sap.ui.vtm.ViewableLoadInfo[]" }
                        }
                    },

                    /**
                     * Raised when viewables have been downloaded (successfully or unsuccessfully) as a result of a call to {@link #loadViewablesAsync}.
                     * 
                     * If no viewables have been successfully downloaded, none of the viewables will be loaded, so no subsequent
                     * {@link sap.ui.vtm.Scene.loadStarted}, {@link sap.ui.vtm.Scene.loadProgress} or {@link sap.ui.vtm.Scene.loadCompleted} will occur
                     *  as a result of the call to {@link #loadViewablesAsync} that resulted in the {@link sap.ui.vtm.Scene.downloadCompleted} event being raised.
                     */
                    downloadCompleted: {
                        parameters: {
                            /**
                             * A set of {@link sap.ui.vtm.ViewableLoadInfo} objects that describe the status
                             * of each {@link sap.ui.vtm.Viewable} passed to the {@link #loadViewablesAsync} call.
                             */
                            viewableLoadInfos: { type: "sap.ui.vtm.ViewableLoadInfo[]" },

                            /**
                             * The set of viewables that were downloaded successfully in the call to {@link #loadViewablesAsync} that resulted in this event being raised.
                             */
                            downloadedViewables: { type: "sap.ui.vtm.Viewable[]" }
                        }
                    },

                    /**
                     * Raised when starting to load a set of viewables.
                     */
                    loadStarted: {
                        parameters: {
                            /**
                             * A set of {@link sap.ui.vtm.ViewableLoadInfo} objects that describe the status
                             * of each {@link sap.ui.vtm.Viewable} passed to the {@link #loadViewablesAsync} call.
                             */
                            viewableLoadInfos: { type: "sap.ui.vtm.ViewableLoadInfo[]" }
                        }
                    },
                    
                    /**
                     * Raised to provide progress information for a viewable that is being loaded.
                     */
                    loadProgress: {
                        /**
                         * The viewable that is being loaded.
                         */
                        viewable: { type: "sap.ui.vtm.Viewable" },
                        
                        /**
                         * The estimated load percentage for the viewable that is being loaded.
                         */
                        percentage: { type: "float"}
                    },

                    /**
                     * Raised when all viewables specified in a call to {@link #loadViewablesAsync} have either loaded or failed to load.
                     */
                    loadCompleted: {
                        parameters: {
                            /**
                             * Indicates whether the scene was built/updated successfully.
                             * It is possible that this can be <code>false</code> when all the content resources apparently loaded successfully.
                             */
                            succeeeded: { type: "boolean" },

                            /**
                             * A set of {@link sap.ui.vtm.ViewableLoadInfo} objects that describe the status
                             * of each {@link sap.ui.vtm.Viewable} passed to the {@link #loadViewablesAsync} call.
                             */
                            viewableLoadInfos: { type: "sap.ui.vtm.ViewableLoadInfo[]" },

                            /**
                             * The set of viewables that were loaded successfully in the call to {@link #loadViewablesAsync} that resulted in this event being raised.
                             */
                            loadedViewables: { type: "sap.ui.vtm.Viewable[]" }
                        }
                    },

                    /**
                     * Raised when the scene hierarchy has been modified.
                     */
                    hierarchyChanged: {}
                }
            },

            init: function () {
                var vkGraphicsCore = new SapUiVkGraphicsCore({}, {
                    antialias: true,
                    alpha: true,
                    premultipliedAlpha: false
                });
                this._viewablesBySource = new Map();
                this._viewableLoadInfosByViewable = new Map();
                this._vkGraphicsCore = vkGraphicsCore;
                this._rootContentResource = new sap.ui.vk.ContentResource({
                    localMatrix: sap.ui.vtm.MatrixUtilities.toVkMatrix(sap.ui.vtm.MatrixUtilities.createIdentity())
                });

                vkGraphicsCore.attachEvent("sceneLoadingProgress", function(event) {
                    var source = event.getParameter("sourceName"),
                        percentage = event.getParameter("percentage") * 100,
                        viewable = this._viewablesBySource.get(source);

                    this.fireLoadProgress({
                        viewable: viewable,
                        percentage: percentage
                    });
                }.bind(this));
            },

            destroy: function() {
                if (this._vkGraphicsCore !== null) {
                    this._vkGraphicsCore.destroy();
                    this._vkGraphicsCore = null;
                }
                SapUiCoreElement.prototype.destroy.apply(this);
            },

            _raiseHierarchyChanged: function() {
                sap.ui.vtm.measure(this, "fireHierarchyChanged", function() {
                    this.fireHierarchyChanged();
                }.bind(this));
            },
            
            _getViewableLoadInfos: function(viewables) {
                var viewableLoadInfos = [];
                viewables.forEach(function(viewable) {
                    var viewableLoadInfo = this._viewableLoadInfosByViewable.get(viewable);
                    viewableLoadInfos.push(viewableLoadInfo);
                }.bind(this));
                return viewableLoadInfos;
            },

            _raiseDownloadStarted: function(viewables) {
                sap.ui.vtm.measure(this, "fireDownloadStarted", function() {
                    var viewableLoadInfos = this._getViewableLoadInfos(viewables);
                    this.fireDownloadStarted({
                        viewableLoadInfos: viewableLoadInfos
                    });
                }.bind(this));
            },

            _raiseDownloadCompleted: function(viewables) {
                sap.ui.vtm.measure(this, "fireDownloadCompleted", function() {
                    var viewableLoadInfos = this._getViewableLoadInfos(viewables);
                    var downloadedViewables = viewableLoadInfos.filter(function(viewableLoadInfo) {
                        return viewableLoadInfo.getStatus() === sap.ui.vtm.ViewableLoadStatus.Downloaded;
                    }).map(function(viewableLoadInfo) {
                        return viewableLoadInfo.getViewable();
                    });
                    this.fireDownloadCompleted({
                        viewableLoadInfos: viewableLoadInfos,
                        downloadedViewables: downloadedViewables
                    });
                }.bind(this));
            },

            _raiseLoadStarted: function(viewables) {
                sap.ui.vtm.measure(this, "fireLoadStarted", function() {
                    var viewableLoadInfos = this._getViewableLoadInfos(viewables);
                    this.fireLoadStarted({
                        viewableLoadInfos: viewableLoadInfos
                    });
                }.bind(this));
            },

            _raiseLoadCompleted: function(succeeded, viewables) {
                sap.ui.vtm.measure(this, "fireLoadCompleted", function() {
                    var viewableLoadInfos = this._getViewableLoadInfos(viewables);
                    var loadedViewables = viewableLoadInfos.filter(function(viewableLoadInfo) {
                        return viewableLoadInfo.getStatus() === sap.ui.vtm.ViewableLoadStatus.Loaded;
                    }).map(function(viewableLoadInfo) {
                        return viewableLoadInfo.getViewable();
                    });
                    this.fireLoadCompleted({
                        succeeded: succeeded,
                        viewableLoadInfos: viewableLoadInfos,
                        loadedViewables: loadedViewables
                    });
                }.bind(this));
            },

            /**
             * Gets the IDs of the the root scene nodes.
             * @public
             * @function
             * @returns {string[]} The root scene node IDs.
             */
            getRootIds: function () {
                if (this._vkNodeHierarchy) {
                    var rootIds = this._vkNodeHierarchy.getChildren();
                    this.addCachedIds(rootIds);
                    return rootIds;
                }
                return [];
            },

            /**
             * Gets the scene node with the specified id.
             * @private
             * @function
             * @param {string} sceneNodeId The scene node id to search for.
             * @returns {sap.ui.vtm.SceneNode} Returns scene node with the specified id.
             */
            _getSceneNode: function (sceneNodeId) {
                if (!this._vkNodeHierarchy) {
                    throw "Scene hierarchy is empty";
                }
                var sceneNode = new sap.ui.vtm.SceneNode({
                    sceneNodeId: sceneNodeId,
                    scene: this
                });
                return sceneNode;
            },

            _getNodeHierarchy: function() {
                return this._vkNodeHierarchy;
            },

            _traverseBranch: function (sceneNodeId, callback, sceneNode, ancestorIds) {
                sceneNode.setSceneNodeId(sceneNodeId);
                if (callback(sceneNode, ancestorIds) === false) {
                    return;
                }
                ancestorIds.push(sceneNodeId);
                if (!sceneNode.getClosed()) {
                    var childIds = this.getChildIds(sceneNodeId);
                    childIds.forEach(function(childId) {
                        this._traverseBranch(childId, callback, sceneNode, ancestorIds);
                    }.bind(this));
                }
                ancestorIds.pop();
            },

            /**
             * Recursively traverses a scene tree branch calling a function on each scene node.
             *
             * Does not traverse the descendants of closed nodes.
             * @function
             * @public
             * @param {string} sceneNodeId The ID of the scene node that represents the root of the branch to traverse.
             * @param {function} callback The function to apply to the traversed scene nodes.<br/>
             *                            The first parameter to the callback function is of type {@link sap.ui.vtm.SceneNode}.<br/>
             *                            The second parameter to the callback function is an array of IDs of ancestors of the scene node being processed.<br/>
             *                            When the function returns <code>false</code>, the descendants of the scene node passed as the parameter are not traversed.
             * @returns {sap.ui.vtm.Scene} <code>this</code for method chaining.
             */
            traverseBranch: function (sceneNodeId, callback) {
                if (!sceneNodeId) {
                    throw "sceneNodeId not defined";
                }
                if (!callback) {
                    throw "callback not defined";
                }
                sap.ui.vtm.measure(this, "traverseBranch (" + sceneNodeId + ")", function() {
                    var sceneNode = this._getSceneNode(sceneNodeId);
                    var ancestorIds = this.getAncestorIds(sceneNodeId);
                    this._traverseBranch(sceneNodeId, callback, sceneNode, ancestorIds);
                    sceneNode._destroy();
                }.bind(this));
                return this;
            },

            /**
             * Recursively traverses the scene tree calling a function on each scene node.
             * @function
             * @public
             * @param {function} callback The function to apply to the traversed scene nodes.
             *                            The first parameter to the callback function is of type {@link sap.ui.vtm.SceneNode}.<br/>
             *                            The second parameter to the callback function is an array of IDs of ancestors of the scene node being processed.<br/>
             *                            When the function returns <code>false</code>, the descendants of the scene node passed as the parameter are not traversed.
             * @returns {sap.ui.vtm.Scene} <code>this</code for method chaining.
             */
            traverseTree: function (callback) {
                if (!callback) {
                    throw "callback not defined";
                }
                if (!this._vkNodeHierarchy) {
                    return this;
                }
                sap.ui.vtm.measure(this, "traverseTree", function() {
                    var rootIds = this.getRootIds();
                    var sceneNode = this._getSceneNode(null);
                    rootIds.forEach(function(sceneNodeId) {
                        this._traverseBranch(sceneNodeId, callback, sceneNode, []);
                    }.bind(this));
                    sceneNode._destroy();
                }.bind(this));
                return this;
            },

            /**
             * Traverses a set of scene nodes specified by scene node ID, calling a function on each scene node.
             * @function
             * @public
             * @param {string|string[]} sceneNodeIds The IDs of the scene nodes to traverse.
             * @param {function} callback The function to apply to the traversed scene nodes.<br/>
             *                            The function takes two parameters.<br/>
             *                            The first parameter to the function is of type {@link sap.ui.vtm.SceneNode}.
             *                            The second parameter to the function is the zero based index of the current scene node in the traversal.
             *                            Traversal stops if the function returns <code>false</code>.
             * @returns {sap.ui.vtm.Scene} <code>this</code for method chaining.
             */
            traverseNodes: function (sceneNodeIds, callback) {
                if (!sceneNodeIds) {
                    throw "sceneNodeIds not defined";
                }
                if (!callback) {
                    throw "callback not defined";
                }
                if (!Array.isArray(sceneNodeIds)) {
                    sceneNodeIds = [sceneNodeIds];
                }
                sap.ui.vtm.measure(this, "traverseNodes (" + sceneNodeIds.join(",") + ")", function() {
                    var sceneNode = this._getSceneNode(null);
                    for (var i = 0; i < sceneNodeIds.length; i++) {
                        sceneNode.setSceneNodeId(sceneNodeIds[i]);
                        if (callback(sceneNode, i) === false) {
                            break;
                        }
                    }
                    sceneNode._destroy();
                }.bind(this));
                return this;
            },

            _handleLoadContentResourcesAsyncCompleted: function(failedItems, viewables) {
                viewables.forEach(function(viewable) {
                    var source = viewable.getSource();
                    var failedItem = sap.ui.vtm.ArrayUtilities.find(failedItems, function (failedItem) {
                        return failedItem.source === source;
                    });
                    var viewableLoadInfo = this._viewableLoadInfosByViewable.get(viewable);
                    if (failedItem) {
                        viewableLoadInfo.setStatus(sap.ui.vtm.ViewableLoadStatus.DownloadFailed);
                        viewableLoadInfo.setErrorCode(failedItem.status);
                        viewableLoadInfo.setErrorText(failedItem.statusText);
                    } else {
                        viewableLoadInfo.setStatus(sap.ui.vtm.ViewableLoadStatus.Downloaded);
                    }
                }.bind(this));

                this._raiseDownloadCompleted(viewables);

                if (this.getDownloadedViewables().length != 0) {
                    this._raiseLoadStarted(viewables);

                    setTimeout(function() {
                        var updateLoadedViewableRootNodeIds = function() {
                            viewables.forEach(function(viewable) {
                                var viewableLoadInfo = this._viewableLoadInfosByViewable.get(viewable);
                                var status = viewableLoadInfo.getStatus();
                                if (status === sap.ui.vtm.ViewableLoadStatus.Loaded && !viewable.getRootNodeIds()) {
                                    var nodeProxy = viewable._getContentResource().getNodeProxy();
                                    if (nodeProxy) {
                                        var nodeId = nodeProxy.getNodeId();
                                        this.addCachedIds(nodeId);
                                        var rootNodeIds = this.getChildIds(nodeId);
                                        viewable.setRootNodeIds(rootNodeIds);
                                    }
                                }
                            }.bind(this));
                        }.bind(this);

                        var handleLoadedSource = function(source) {
                            var viewable = sap.ui.vtm.ArrayUtilities.find(viewables, function(viewable) {
                                return viewable.getSource() === source;
                            });
                            if (viewable) {
                                var viewableLoadInfo = this._viewableLoadInfosByViewable.get(viewable);
                                viewableLoadInfo.setStatus(sap.ui.vtm.ViewableLoadStatus.Loaded);
                            }
                        }.bind(this);

                        var handleFailedSource = function(source) {
                            var viewable = sap.ui.vtm.ArrayUtilities.find(viewables, function(viewable) {
                                return viewable.getSource() === source;
                            });
                            if (viewable) {
                                var viewableLoadInfo = this._viewableLoadInfosByViewable.get(viewable);
                                viewableLoadInfo.setStatus(sap.ui.vtm.ViewableLoadStatus.LoadFailed);
                            }
                        }.bind(this);

                        var sceneLoadedHandler = function(event) {
                            var source = event.getParameter("source");
                            var sceneId = event.getParameter("sceneId");
                            if (sceneId) {
                                handleLoadedSource(source);
                            } else {
                                handleFailedSource(source);
                            }
                        };

                        this._vkGraphicsCore.attachSceneLoadingFinished(sceneLoadedHandler);

                        var downloadedViewables = viewables.filter(function(viewable) {
                            var viewableLoadInfo = this._viewableLoadInfosByViewable.get(viewable);
                            switch (viewableLoadInfo.getStatus()) {
                            case sap.ui.vtm.ViewableLoadStatus.Downloading:
                            case sap.ui.vtm.ViewableLoadStatus.DownloadFailed:
                                return false;
                            default:
                                return true;
                            }
                        }.bind(this));

                        downloadedViewables.forEach(function(downloadedViewable) {
                            var contentResource = downloadedViewable._getContentResource();
                            if (this._rootContentResource.getContentResources().indexOf(contentResource) < 0) {
                                this._rootContentResource.addContentResource(contentResource);
                            }
                        }.bind(this));

                        if (!this._sceneCreated) {
                            var buildingSceneTreeMeasureId = sap.ui.vtm.createMeasureId(this, "Building scene tree");
                            jQuery.sap.measure.start(buildingSceneTreeMeasureId, "", ["sap.ui.vtm"]);

                            this._vkGraphicsCore.buildSceneTreeAsync([this._rootContentResource]).then(function(data) {
                                jQuery.sap.measure.end(buildingSceneTreeMeasureId);
                                this._vkGraphicsCore.detachSceneLoadingFinished(sceneLoadedHandler);
                                // this._vkGraphicsCore.detachEvent("sceneFailed", sceneFailedHandler);
                                this._vkScene = data.scene;
                                this._vkNodeHierarchy = this._vkScene.getDefaultNodeHierarchy();
                                var rootIds = this.getRootIds();
                                this.addCachedIds(rootIds);
                                updateLoadedViewableRootNodeIds();
                                this._sceneCreated = true;
                                this.fireEvent("sceneCreated");
                                this._raiseHierarchyChanged();
                                this._raiseLoadCompleted(true, viewables);
                            }.bind(this))
                            .catch(function(result) {
                                jQuery.sap.measure.end(buildingSceneTreeMeasureId);
                                this._vkGraphicsCore.detachSceneLoadingFinished(sceneLoadedHandler);
                                // this._vkGraphicsCore.detachEvent("sceneFailed", sceneFailedHandler);
                                this._raiseLoadCompleted(false, viewables);
                            }.bind(this)); 
                            
                        } else {
                            var updatingSceneTreeMeasureId = sap.ui.vtm.createMeasureId(this, "Updating scene tree");
                            jQuery.sap.measure.start(updatingSceneTreeMeasureId, "", ["sap.ui.vtm"]);

                            this._vkGraphicsCore.updateSceneTreeAsync(this._vkScene, [this._rootContentResource])
                            .then(function(data) {
                                jQuery.sap.measure.end(updatingSceneTreeMeasureId);
                                this._vkGraphicsCore.detachSceneLoadingFinished(sceneLoadedHandler);
                                // this._vkGraphicsCore.detachEvent("sceneFailed", sceneFailedHandler);
                                updateLoadedViewableRootNodeIds();
                                this._raiseHierarchyChanged();
                                this._raiseLoadCompleted(true, viewables);
                            }.bind(this))
                            .catch(function(result) {
                                jQuery.sap.measure.end(updatingSceneTreeMeasureId);
                                this._vkGraphicsCore.detachSceneLoadingFinished(sceneLoadedHandler);
                                // this._vkGraphicsCore.detachEvent("sceneFailed", sceneFailedHandler);
                                if (result.contentResourcesWithEncryptedVds3) {
                                    result.contentResourcesWithEncryptedVds3.forEach(function(contentResource) {
                                        var source = contentResource.getSource();
                                        handleFailedSource(source);
                                    });
                                }
                                if (result.contentResourcesWithMissingPasswords) {
                                    result.contentResourcesWithMissingPasswords.forEach(function(contentResource) {
                                        var source = contentResource.getSource();
                                        handleFailedSource(source);
                                    });
                                }
                                this._raiseLoadCompleted(false, viewables);
                            }.bind(this));
                        }
                    }.bind(this), 50);
                 }
            },

            _handleLoadContentResourcesAsyncProgress: function (progressEvent, viewables) {
                var source = progressEvent.getParameter("source");
                var downloadedBytes = progressEvent.getParameter("loaded");
                var totalBytes = progressEvent.getParameter("total");
                var viewable = sap.ui.vtm.ArrayUtilities.find(viewables, function (viewable) {
                    return source ===  viewable.getSourceString();
                });
                sap.ui.vtm.measure(this, "fireDownloadProgress", function() {
                    this.fireDownloadProgress({
                        viewable: viewable,
                        downloadedBytes: downloadedBytes,
                        totalBytes: totalBytes
                    });
                }.bind(this));
            },

            /**
             * Load a set of viewables asynchronously.
             * Progress is indicated by the <code>progress</code> event and completion is indicated by the <code>loadComplete</code> event.
             * @function
             * @public
             * @param {sap.ui.vtm.Viewable|sap.ui.vtm.Viewable[]} viewables The set of viewables to load.
             * @fires loadCompleted
             * @fires downloadProgress
             * @returns {sap.ui.vtm.Scene} <code>this</code> for method chaining.
             */
            loadViewablesAsync: function (viewables) {
                if (!viewables) {
                    throw "viewables not specified";
                }
                viewables = sap.ui.vtm.ArrayUtilities.wrap(viewables);
                if (!viewables.length) {
                    throw "viewables is empty";
                }

                viewables.forEach(function(viewable) {
                    var sourceString = viewable.getSourceString();
                    if (!this._viewablesBySource.has(sourceString)) {
                        this._viewablesBySource.set(sourceString, viewable);
                    }
                    var viewableLoadInfo = new sap.ui.vtm.ViewableLoadInfo({
                        viewable: viewable,
                        status: sap.ui.vtm.ViewableLoadStatus.Downloading
                    });
                    this._viewableLoadInfosByViewable.set(viewable, viewableLoadInfo);
                }.bind(this));

                this._raiseDownloadStarted(viewables);

                setTimeout(function() {
                    var sourceNames = viewables.map(function(viewable) {
                        return viewable.getSourceString();
                    });
                    var contentResources = viewables.map(function (viewable) {
                        return viewable._getContentResource();
                    });
                    var downloadingMeasureId = sap.ui.vtm.createMeasureId(this, "Downloading " + sourceNames.join(", "));
                    jQuery.sap.measure.start(downloadingMeasureId, "", ["sap.ui.vtm"]);
                    this._vkGraphicsCore.loadContentResourcesAsync(
                        contentResources,
                        function(failedItems) {
                            jQuery.sap.measure.end(downloadingMeasureId);
                            failedItems = failedItems = failedItems || [];
                            this._handleLoadContentResourcesAsyncCompleted(failedItems, viewables);
                        }.bind(this),
                        function(progressEvent) {
                            this._handleLoadContentResourcesAsyncProgress(progressEvent, viewables);
                        }.bind(this));
                }.bind(this), 50);

                return this;
            },

            /**
             * Gets the set of downloaded viewables.
             * @public
             * @function
             * @returns {sap.ui.vtm.Viewable[]} The set of downloaded viewables.
             */
            getDownloadedViewables: function () {
                var downloadedViewables = [];
                this._viewableLoadInfosByViewable.forEach(function(viewableLoadInfo, viewable) {
                    switch (viewableLoadInfo.getStatus()) {
                    case sap.ui.vtm.ViewableLoadStatus.Downloading:
                    case sap.ui.vtm.ViewableLoadStatus.DownloadFailed:
                        break;
                    default:
                        downloadedViewables.push(viewable);
                        break;
                    }
                });
                return downloadedViewables;
            },

            /**
             * Gets the set of loaded viewables.
             * @public
             * @function
             * @returns {sap.ui.vtm.Viewable[]} The set of loaded viewables.
             */
            getLoadedViewables: function () {
                var loadedViewables = [];
                this._viewableLoadInfosByViewable.forEach(function(viewableLoadInfo, viewable) {
                    if (viewableLoadInfo.getStatus() === sap.ui.vtm.ViewableLoadStatus.Loaded) {
                        loadedViewables.push(viewable);
                    }
                });
                return loadedViewables;
            },

            /**
             * Gets the set of {@link sap.ui.vtm.ViewableLoadInfo} objects that describe the status of each {@link sap.ui.vtm.Viewable} that has been passed to a
             * {@link #loadViewablesAsyc} call made on this {@link sap.ui.vtm.Scene} instance.
             * @public
             * @function
             * @returns {sap.ui.vtm.ViewableLoadInfo[]} The set of {@link sap.ui.vtm.ViewableLoadInfo} objects that describe the status of each {@link sap.ui.vtm.Viewable} that has been passed to a
             * {@link #loadViewablesAsyc} call made on this {@link sap.ui.vtm.Scene} instance.
             */
            getViewableLoadInfos: function() {
                var viewableLoadInfos;
                this._viewableLoadInfosByViewable.forEach(function(viewableLoadInfo, viewable) {
                    viewableLoadInfos.push(viewableLoadInfo);
                });
                return viewableLoadInfos;
            },

            /**
             * Gets the scene node IDs of the ancestors of the specified scene node.
             * The root scene node is the first item in the array and the parent is the last.
             * @function
             * @public
             * @param {string} sceneNodeId The scene node to find the ancestors of.
             * @returns {string[]} The scene node IDs of the ancestors of the scene node.
             */
            getAncestorIds: function (sceneNodeId) {
                if (this._vkNodeHierarchy) {
                    var ancestorIds = this._vkNodeHierarchy.getAncestors(sceneNodeId);
                    this.addCachedIds(ancestorIds);
                    return ancestorIds;
                }
                return [];
            },

            /**
             * Gets the scene node ID of the parent node of the specified scene node or null if the specified scene node is a root scene node.
             * @function
             * @public
             * @param {string} sceneNodeId The scene node to find the parent of.
             * @returns {string|null} The scene node ID of the parent scene node of the specified scene node or null if the specified scene node is a root scene node.
             */
            getParentId: function(sceneNodeId) {
                var ancestors = this.getAncestorIds(sceneNodeId);
                if (ancestors && ancestors.length) {
                    return ancestors[ancestors.length - 1];
                }
                return null;
            },

            /**
             * Gets the scene node IDs of the children of the specified scene node.
             * @function
             * @public
             * @param {string} sceneNodeId The scene node to find the children of.
             * @returns {string[]} The scene node IDs of the children of the specified scene node.
             */
            getChildIds: function(sceneNodeId) {
                if (this._vkNodeHierarchy) {
                    var childIds = this._vkNodeHierarchy.getChildren(sceneNodeId, true);
                    this.addCachedIds(childIds);
                    return childIds;
                }
                return [];
            },

            /**
             * Gets the scene node IDs of the descendants of the specified scene node.
             * @function
             * @public
             * @param {string} sceneNodeId The scene node to find the descendants of.
             * @returns {string[]} The scene node IDs of the descendants of the specified scene node.
             */
            getDescendantIds: function(sceneNodeId) {
                var descendantIds = [];
                sap.ui.vtm.measure(this, "getDescendantIds (" + sceneNodeId + ")", function() {
                    var enumerateDescendantIds = function(sceneNodeId) {
                        var childIds = this.getChildIds(sceneNodeId);
                        childIds.forEach(function(childId) {
                            descendantIds.push(childId);
                            enumerateDescendantIds(childId);
                        });
                    }.bind(this);
                    enumerateDescendantIds(sceneNodeId);
                }.bind(this));
                this.addCachedIds(descendantIds);
                return descendantIds;
            },

            /**
             * Gets the scene node IDs of all the scene nodes in the scene.
             * @function
             * @public
             * @returns {string[]} The scene node IDs of all the scene nodes in the scene.
             */
            getAllIds: function() {
                var rootIds = this.getRootIds();
                var allIds = [];
                rootIds.forEach(function(rootId) {
                    allIds.push(rootId);
                    var descendantIds = this.getDescendantIds(rootId);
                    allIds = allIds.concat(descendantIds);
                }.bind(this));
                this.setCachedIds(allIds);
                return allIds;
            },

            /**
             * Gets set of all scene node IDs in the scene that have been discovered via scene traversal performed by the application.
             * 
             * Accurate population of this value requires application support (whereas {@link #getAllIds} always returns the exact set of all scene nodes in the scene).
             * 
             * Scene node IDs are added to this set as they are discovered through methods the application calls:
             * <ul>
             * <li>{@link #getAllIds}</li>
             * <li>{@link #getRootIds}</li>
             * <li>{@link #getParentIds}</li>
             * <li>{@link #getAncestorIds}</li>
             * <li>{@link #getChildIds}</li>
             * <li>{@link #getDescendantIds}</li>
             * </ul>
             * 
             * The methods above are also used by the following methods:
             * <ul>
             * <li>{@link #traverseTree}</li>
             * <li>{@link #traverseBranch}</li>
             * </ul>
             * 
             * All of the scene nodes that have been traversed by these traversal methods will be included in the cached set.
             * If during a call to {@link #traverseTree} or {@link #traverseBranch} the application stops traversal of a particular branch of the scene tree
             * by returning <code>false</code> in the callback for a particular scene node, the application can call {@link #getDescendantIds} for that scene node
             * to ensure that all the scene node IDs for the descendants of that scene node are included in the set of cached IDs.
             * 
             * Scene nodes are also added/removed from the to the cached set as required when the following methods are called:
             * <li>{@link #createNode}</li>
             * <li>{@link #cloneNode}</li>
             * <li>{@link #deleteNode}</li>
             * </ul>
             * 
             * If this method is called before any scene traversal has occurred, it populates the set of cached scene node IDs using {@link #getAllIds}.
             * @function
             * @public
             * @returns {string[]} The set of all scene node IDs in the scene that have been discovered via scene traversal performed by the application.
             */
            getCachedIds: function() {
                if (!this._cachedIds || !this._cachedIds.length) {
                    this._cachedIds = this.getAllIds();
                }
                return this._cachedIds;
            },

            /**
             * Sets or clears the cached copy of all the scene node IDs in the scene used by {@link #getCachedIds}.
             * @function
             * @private
             * @param {string[]|null} sceneNodeIds If non-null specifies the set of all scene node IDs in the scene, otherwise clears the cached value.
             * @returns {sap.ui.vtm.Scene} <code>this</code> for method chaining.
             */
            setCachedIds: function(sceneNodeIds) {
                this._cachedIds = sceneNodeIds;
                return this;
            },

            /**
             * Adds a set of scene node IDs to the set of IDs returned by {@link #getCachedIds}.
             * @function
             * @private
             * @param {string[]|string} sceneNodeIds Specifies the scene node ID or set of scene node IDs in the scene to add to the set of IDs returned by {@link #getCachedIds}.
             * @returns {sap.ui.vtm.Scene} <code>this</code> for method chaining.
             */
            addCachedIds: function(sceneNodeIds) {
                if (!this._cachedIds) {
                    this._cachedIds = [];
                }
                sceneNodeIds = sap.ui.vtm.ArrayUtilities.wrap(sceneNodeIds);
                sceneNodeIds.forEach(function(sceneNodeId) {
                    if (this._cachedIds.indexOf(sceneNodeId) === -1) {
                        this._cachedIds.push(sceneNodeId);
                    }
                }.bind(this));
                return this;
            },

            /**
             * Adds a set of scene node IDs to the set of IDs returned by {@link #getCachedIds}.
             * @function
             * @private
             * @param {string[]|string} sceneNodeIds Specifies the scene node ID or set of scene node IDs to add to the set of IDs returned by {@link #getCachedIds}.
             * @returns {sap.ui.vtm.Scene} <code>this</code> for method chaining.
             */
            removeCachedIds: function(sceneNodeIds) {
                if (this._cachedIds) {
                    sceneNodeIds = sap.ui.vtm.ArrayUtilities.wrap(sceneNodeIds);
                    this._cachedIds = this._cachedIds.filter(function(cachedId) {
                        return sceneNodeIds.indexOf(cachedId) === -1;
                    });
                }
                return this;
            },

            /**
             * Creates a scene node.
             * @function
             * @public
             * @param {string} parentNodeId       The ID of the node that will be the parent of the created node.
             *                                    If <code>null</code> the newly created node is a top level node.
             * @param {string} insertBeforeNodeId The created node is added before this specified node.
             *                                    If <code>null</code> the newly created node is added at the end of the parent's list of nodes.
             * @param {string} name               The name of the new node.
             * @returns {string} The scene node ID of the created node.
             */
            createNode: function(parentNodeId, insertBeforeNodeId, name) {
                var createdSceneNodeId = this._vkNodeHierarchy.createNode(parentNodeId, name, insertBeforeNodeId);
                this.addCachedIds(createdSceneNodeId);
                this._raiseHierarchyChanged();
                return createdSceneNodeId;
            },

            /**
             * Clones a scene node.
             * @function
             * @public
             * @param {string} nodeIdToClone      The ID of the node to clone.
             * @param {string} parentNodeId       The ID of the node that will be the parent of the created node.
             *                                    If <code>null</code> the newly created node is a top level node.
             * @param {string} insertBeforeNodeId The created node is added before this specified node.
             *                                    If <code>null</code> the newly created node is added at the end of the parent's list of nodes.
             * @param {string} name               The name of the new node.
             * @param {boolean?} recursive         If <code>true</code>, the descendants of the scene node will also be cloned. Defaults to <code>true</code>.
             * @returns {string} The scene node ID of the created node.
             */
            cloneNode: function(nodeIdToClone, parentNodeId, insertBeforeNodeId, name, recursive) {
                var createdSceneNodeId = this._vkNodeHierarchy.createNodeCopy(nodeIdToClone, parentNodeId, name, insertBeforeNodeId);
                recursive = recursive === undefined || recursive === null ? true : recursive;
                this.addCachedIds(createdSceneNodeId);
                if (!recursive) {
                    var childIds = this.getChildIds(createdSceneNodeId);
                    childIds.forEach(function(childId) {
                        this.deleteNode(childId);
                    }.bind(this));
                } else {
                    this.addCachedIds(this.getDescendantIds(createdSceneNodeId));
                }
                this._raiseHierarchyChanged();
                return createdSceneNodeId;
            },

            /**
             * Deletes a node from the scene.
             * @function
             * @public
             * @param {string} nodeId The ID of the node to delete.
             * @returns {sap.ui.vtm.Scene} <code>this</code> for method chaining.
             */
            deleteNode: function(nodeId) {
                this.removeCachedIds(nodeId);
                this.removeCachedIds(this.getDescendantIds(nodeId));
                this._vkNodeHierarchy.removeNode(nodeId);
                this._raiseHierarchyChanged();
                return this;
            },

            /**
             * Gets the {@link sap.ui.vtm.Vtm} instance that owns this scene.
             * @public
             * @function
             * @returns {sap.ui.vtm.Vtm} The {@link sap.ui.vtm.Vtm} instance that owns this scene.
             */
            getVtm: function() {
                return this.getParent();
            }
        });

        return Scene;
    });