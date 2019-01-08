/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides object sap.ui.vk.ContentConnector.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/ManagedObjectObserver", "sap/ui/core/Element", "./Messages", "./Core"
], function(jQuery, ManagedObjectObserver, Element, Messages, VkCore) {
	"use strict";

	var log = jQuery.sap.log;

	/**
	 * Constructor for a new ContentConnector.
	 *
	 * @class
	 * Provides an object that owns content resources, tracks their changes and loads and destroys the content built
	 * from the content resources.
	 *
	 * @param {string} [sId] ID for the new ContentConnector object. Generated automatically if no ID is given.
	 * @param {object} [mSettings] Initial settings for the new ContentConnector object.
	 * @public
	 * @author SAP SE
	 * @version 1.52.8
	 * @extends sap.ui.core.Element
	 * @alias sap.ui.vk.ContentConnector
	 * @experimental Since 1.50.0 This class is experimental and might be modified or removed in future versions.
	 */
	var ContentConnector = Element.extend("sap.ui.vk.ContentConnector", /** @lends sap.ui.vk.ContentConnector.prototype */ {
		metadata: {
			library: "sap.ui.vk",

			publicMethods: [
				"getContent",
				"getContentManager"
			],

			aggregations: {
				/**
				 * Content resources to load and display.
				 */
				contentResources: {
					type: "sap.ui.vk.ContentResource",
					bindable: "bindable"
				},

				/**
				 * View state managers.
				 */
				viewStateManagers: {
					type: "sap.ui.vk.ViewStateManager"
				},

				/**
				 * Content managers.
				 * @private
				 */
				contentManagers: {
					type: "sap.ui.vk.ContentManager",
					visibility: "hidden"
				}
			},

			defaultAggregation: "contentResources",

			events: {
				/**
				 * This event will be fired when content resource changes are about to be processed.
				 */
				contentChangesStarted: {
					parameters: {
					}
				},

				/**
				 * This event will be fired when any content resource or the contentResources aggregation has been changed and processed.
				 */
				contentChangesFinished: {
					parameters: {
						/**
						 * The content created or updated.
						 *
						 * The content can be of type HTMLImageElement, sap.ui.vk.Scene etc.
						 */
						content: {
							type: "any"
						},

						/**
						 * The failure reason if any.<br>
						 * An single element or an array of elements with the following structure:
						 * <ul>
						 *   <li>error - An object with details of the error.
						 *   <li>contentResource - A {@link sap.ui.vk.ContentResource sap.ui.vk.ContentResource} object when it is possible to
						 *       match the Error object to a {@link sap.ui.vk.ContentResource sap.ui.vk.ContentResource} object.
						 * </ul>
						 */
						failureReason: {
							type: "any"
						}
					}
				},

				/**
				 * This event will be fired to report the progress of content changes.
				 */
				contentChangesProgress: {
					parameters: {
						/**
						 * The name of the loading phase. It can be e.g. 'downloading', 'building the scene' etc.
						 * It might be null if reporting this parameter does not make sense.
						 */
						phase: {
							type: "string"
						},

						/**
						 * The overall percentage of the loading process.
						 */
						percentage: {
							type: "float"
						},

						/**
						 * The content resource currently being loaded. It might be null if reporting this parameter does not make sense.
						 */
						source: {
							type: "any"
						}
					}
				},

				/**
				 * This event will be fired when the current content is completely rebuilt or destroyed
				 * as a result of changes in content resources.
				 */
				contentReplaced: {
					parameters: {
						/**
						 * New content.
						 *
						 * The content can be of type HTMLImageElement, sap.ui.vk.Scene etc.
						 */
						newContent: {
							type: "any"
						},

						/**
						 * Old content.
						 *
						 * The content can be of type HTMLImageElement, sap.ui.vk.Scene etc.
						 */
						oldContent: {
							type: "any"
						}
					}
				},

				/**
				 * This event will be fired when the current content is about to be destroyed.
				 */
				contentDestroying: {
					parameters: {
						/**
						 * The content to be destroyed.
						 *
						 * The content can be of type HTMLImageElement, sap.ui.vk.Scene etc.
						 */
						content: {
							type: "any"
						},

						/**
						 * Returns a <code>function(prevent: boolean)</code> with one boolean parameter.
						 * To prevent garbage collection after the content is destroyed call this function
						 * passing <code>true</code> as a parameter.
						 */
						preventGarbageCollection: {
							type: "function"
						}
					}
				}
			}
		}
	});

	sap.ui.vk.getCore().registerClass(ContentConnector);

	var basePrototype = ContentConnector.getMetadata().getParent().getClass().prototype;

	ContentConnector.prototype.isTreeBinding = function(name) {
		return name === "contentResources";
	};

	ContentConnector.prototype.init = function() {
		if (basePrototype.init) {
			basePrototype.init.call(this);
		}

		this._inLoading = false;                            // Set to true when the content is being loaded. The flag is used to prevent
		                                                    // attempts to load additional content during the loading process.
		this._delayContentResourcesUpdate = false;          // Set to true if there was a request to update content resources when
		                                                    // the previous update has not finished yet.
		this._scheduleContentResourcesUpdateTimerId = null; // The timer used to schedule content resources updates.
		this._content = null;                               // The current content.
		this._contentManager = null;                        // The current content manager.

		this._selfObserver = new ManagedObjectObserver(this._observeChanges.bind(this));
		this._selfObserver.observe(this, { aggregations: [ "contentResources", "viewStateManagers" ] });
	};

	ContentConnector.prototype.exit = function() {
		this._selfObserver.disconnect();
		this._selfObserver = null;

		// Cancel the delayed call if any.
		if (this._scheduleContentResourcesUpdateTimerId) {
			jQuery.sap.clearDelayedCall(this._scheduleContentResourcesUpdateTimerId);
			this._scheduleContentResourcesUpdateTimerId = null;
		}

		// Do not schedule new updates when the previous one finishes.
		this._delayContentResourcesUpdate = false;

		this._setContent(null, null);
		// Content managers in the contentManagers aggregation will be destroyed automatically.

		if (basePrototype.exit) {
			basePrototype.exit.call(this);
		}
	};

	ContentConnector.prototype._observeChanges = function(change) {
		if (change.name === "contentResources") {
			this._scheduleContentResourcesUpdate();
		} else if (change.name === "viewStateManagers") {
			if (change.mutation === "insert") {
				change.child.setContentConnector(this);
			} else if (change.mutation === "remove") {
				change.child.setContentConnector(null);
			}
		}
	};

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: handle content resources

	ContentConnector.prototype.invalidate = function(origin) {
		if (sap.ui.vk.ContentResource && origin instanceof sap.ui.vk.ContentResource) {
			this._scheduleContentResourcesUpdate();
			return;
		}
		basePrototype.invalidate.apply(this, arguments);
	};

	/*
	 * Schedules an update of the content resource hierarchy.
	 *
	 * @returns {sap.ui.vk.ContentConnector} <code>this</code> to allow method chaining.
	 * @private
	 */
	ContentConnector.prototype._scheduleContentResourcesUpdate = function() {
		if (this._inLoading) {
			// Postpone content update until the current process has finished.
			this._delayContentResourcesUpdate = true;
			return this;
		}

		if (!this._scheduleContentResourcesUpdateTimerId) {
			this._scheduleContentResourcesUpdateTimerId = jQuery.sap.delayedCall(0, this, function() {
				// The delayed call is invoked once. Reset the ID to indicate that there is no pending delayed call.
				this._scheduleContentResourcesUpdateTimerId = null;

				var contentResources = this.getContentResources();

				if (contentResources.length > 0) {
					this._collectContentResourceSourceTypeInformation(contentResources).then(function(info) {
						if (info.dimensions.length > 1) {
							jQuery.sap.delayedCall(0, this, function() {
								this.fireContentChangesStarted();
								this._setContent(null, null);
								this.fireContentChangesFinished({
									content: null,
									failureReason: {
										errorMessage: sap.ui.vk.getResourceBundle().getText(Messages.VIT17.cause)
									}
								});
								log.error(sap.ui.vk.getResourceBundle().getText(Messages.VIT17.summary), Messages.VIT17.code, "sap.ui.vk.ContentConnector");
							});
						} else if (info.contentManagerClassNames.length > 1) {
							jQuery.sap.delayedCall(0, this, function() {
								this.fireContentChangesStarted();
								this._setContent(null, null);
								this.fireContentChangesFinished({
									content: null,
									failureReason: {
										errorMessage: sap.ui.vk.getResourceBundle().getText(Messages.VIT35.cause)
									}
								});
								log.error(sap.ui.vk.getResourceBundle().getText(Messages.VIT35.summary), Messages.VIT35.code, "sap.ui.vk.ContentConnector");
							});
						} else if (info.contentManagerClassNames.length === 0) {
							jQuery.sap.delayedCall(0, this, function() {
								this.fireContentChangesStarted();
								this._setContent(null, null);
								// Unsupported file format throws error VIEWER_UNKNOWN_CONTENT_RESOURCE_TYPE_CAUSE = VIT36.
								this.fireContentChangesFinished({
									content: null,
									failureReason: {
										errorMessage: sap.ui.vk.getResourceBundle().getText(Messages.VIT36.cause)
									}
								});
								log.error(sap.ui.vk.getResourceBundle().getText(Messages.VIT36.summary), Messages.VIT36.code, "sap.ui.vk.ContentConnector");
							});
						} else if (info.contentManagerClassNames.length === 1) {
							var contentManager = this._getContentManagerByClassName(info.contentManagerClassNames[0]);
							if (contentManager !== this._contentManager) {
								this._setContent(null, null);
							}
							contentManager.loadContent(this._content, contentResources);
						}
					}.bind(this));
				} else {
					jQuery.sap.delayedCall(0, this, function() {
						this.fireContentChangesStarted();
						this._setContent(null, null);
						this.fireContentChangesFinished({
							content: null
						});
					});
				}
			});
		}
		return this;
	};

	// END: handle content resources
	////////////////////////////////////////////////////////////////////////////

	////////////////////////////////////////////////////////////////////////////
	// BEGIN: handle content loading

	ContentConnector.prototype._handleContentChangesStarted = function(event) {
		this._inLoading = true;
		this.fireContentChangesStarted();
	};

	ContentConnector.prototype._handleContentChangesFinished = function(event) {
		var content = event.getParameter("content");
		this._setContent(content, event.getSource());
		this.fireContentChangesFinished({
			content: content,
			failureReason: event.getParameter("failureReason")
		});
		this._inLoading = false;
		if (this._delayContentResourcesUpdate) {
			this._delayContentResourcesUpdate = false;
			this._scheduleContentResourcesUpdate();
		}
	};

	ContentConnector.prototype._handleContentChangesProgress = function(event) {
		this.fireContentChangesProgress({
			phase: event.getParameter("phase"),
			source: event.getParameter("source"),
			percentage: event.getParameter("percentage")
		});
	};

	// END: handle content loading
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Gets or creates a content manager object based on its class name.
	 * @param {string} className The name of the content manager class.
	 * @returns {sap.ui.vk.ContentManager} The content manager object that implements the {@link sap.ui.vk.ContentManager sap.ui.vk.ContentManager} interface.
	 * @private
	 * @since 1.50.0
	 */
	ContentConnector.prototype._getContentManagerByClassName = function(className) {
		var contentManager,
		    contentManagers = this.getAggregation("contentManagers", []);
		// Find an existing content manager.
		for (var i = 0, count = contentManagers.length; i < count; ++i) {
			contentManager = contentManagers[i];
			if (contentManager.getMetadata().getName() === className) {
				return contentManager;
			}
		}
		// Create a new content manager.
		jQuery.sap.require(className);
		contentManager = new (jQuery.sap.getObject(className));
		this.addAggregation("contentManagers", contentManager);
		contentManager.attachContentChangesStarted(this._handleContentChangesStarted, this);
		contentManager.attachContentChangesFinished(this._handleContentChangesFinished, this);
		contentManager.attachContentChangesProgress(this._handleContentChangesProgress, this);
		return contentManager;
	};

	/**
	 * Gets the content currently loaded.
	 *
	 * @returns {any} The content loaded. It can be HTMLImageElement, sap.ui.vk.Scene etc.
	 * @public
	 * @since 1.50.0
	 */
	ContentConnector.prototype.getContent = function() {
		return this._content;
	};

	/**
	 * Gets the content connector used to load the current content.
	 *
	 * @returns {sap.ui.vk.ContentManager} The content connector used to load the current content.
	 * @public
	 * @since 1.50.0
	 */
	ContentConnector.prototype.getContentManager = function() {
		return this._contentManager;
	};

	/**
	 * Sets the new content.
	 *
	 * @param {any}                          newContent        The new content. It can be HTMLImageElement, sap.ui.vk.Scene etc.
	 * @param {sap.ui.vk.ContentManagerBase} newContentManager The content manager to handle the new content.
	 * @returns {sap.ui.vk.ContentConnector} <code>this</code> to allow method chaining.
	 * @private
	 */
	ContentConnector.prototype._setContent = function(newContent, newContentManager) {
		var oldContent = this._content,
		    oldContentManager = this._contentManager;

		if (oldContent !== newContent) {
			this._content = newContent;
			this._contentManager = newContentManager;

			this.fireContentReplaced({
				oldContent: oldContent,
				newContent: newContent
			});

			if (oldContent) {
				var preventGC = false;
				// Should it be called before contentReplaced?
				this.fireContentDestroying({
					content: oldContent,
					preventGarbageCollection: function(value) {
						preventGC = value;
					}
				});
				oldContentManager.destroyContent(oldContent);
				if (!preventGC) {
					oldContentManager.collectGarbage();
				}
			}
		}

		return this;
	};

	var resolvers = [
		{
			pattern: /(^threejs[:.])|(^(threejs|stream)$)/,
			dimension: 3,
			contentManagerClassName: "sap.ui.vk.threejs.ContentManager"
		},
		{
			pattern: /^vdsl?$/,
			dimension: 3,
			contentManagerClassName: "sap.ui.vk.dvl.ContentManager"
		},
		{
			pattern: /^(png|jpg|gif|bmp|tiff?|svg)$/,
			dimension: 2,
			contentManagerClassName: "sap.ui.vk.ImageContentManager"
		},
		{
			pattern: "cgm",
			dimension: 2,
			contentManagerClassName: "sap.ui.vk.dvl.ContentManager"
		}
	];

	/**
	 * Gets content manager class name, dimension and settings associated with the content resource.
	 *
	 * @param {sap.ui.vk.ContentResource} contentResource The content resource to test.
	 * @returns {Promise} {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise Promise} that
	 *     resolves with a value with the following structure:
	 *     <pre>
	 *         dimension:           int
	 *         contentManagerClass: string,
	 *         settings:            object
	 *     </pre>
	 * @private
	 */
	var resolveContentManager = function(contentResource) {
		return new Promise(function(resolve, reject) {
			var entries = resolvers.slice();
			var test = function(index) {
				if (index >= entries.length) {
					reject();
					return;
				}
				var resolver = entries[index];
				(function() {

					var sourceType = contentResource.getSourceType();
					if (sourceType) {
						sourceType = sourceType.toLowerCase();
					}

					if (typeof resolver === "function") {
						return resolver(contentResource);
					} else if (typeof resolver.pattern === "string") {
						var patternLowerCase = resolver.pattern.toLowerCase();
						if (patternLowerCase === sourceType) {
							return Promise.resolve(resolver);
						}
					} else if (resolver.pattern instanceof RegExp) {

						if (resolver.pattern.test(sourceType)) {
							return Promise.resolve(resolver);
						}
					}
					// Skip to the next resolver.
					return Promise.reject();
				})().then(
					function(value) { // onFulfilled
						resolve({
							dimension: value.dimension,
							contentManagerClassName: value.contentManagerClassName,
							settings: value.settings
						});
					},
					function() {      // onRejected
						test(index + 1);
					}
				);
			};
			test(0);
		});
	};

	/**
	 * Adds a new content manager resolver.
	 *
	 * The last added resolver will be executed the first.
	 *
	 * Content manager resolver analyzes the content resource definition and returns the type of the content manager to use for loading
	 * the content resource.
	 *
	 * The simplest resolver tests the content resource source type. The test can be either a string comparison or a regular expression.
	 *
	 * A more sofisticated resolver is a function that can use the full content resource definition to find a proper content manager dynamically,
	 * e.g. the resolver can use the 'HEAD' HTTP request to get the 'Content-Type' header to find out the type of the content resource.
	 *
	 * @example <caption>Add a new content manager resolver based on string comparison of the sourceType property of the content resource.</caption>
	 * <pre>
	 *     sap.ui.vk.ContentConnector.addContentManagerResolver({
	 *         pattern: "vds",
	 *         dimension: 3,
	 *         contentManagerClassName: "sap.ui.vk.dvl.ContentManager"
	 *     });
	 * </pre>
	 *
	 * @example <caption>Add a new content manager resolver based on regular expression test of the sourceType property of the content resource.</caption>
	 * <pre>
	 *     sap.ui.vk.ContentConnector.addContentManagerResolver({
	 *         pattern: /^(png|jpg|gif|bmp|tiff?|svg)$/,
	 *         dimension: 2,
	 *         contentManagerClassName: "sap.ui.vk.ImageContentManager"
	 *     });
	 * </pre>
	 *
	 * @example <caption>Add a new content manager resolver that makes a 'HEAD' HTTP request and checks the Content-Type header.</caption>
	 * <pre>
	 *     var loadCollada = function(parentNode, contentResource) {
	 *         return new Promise(function(resolve, reject) {
	 *             sap.ui.require(["sap/ui/vk/threejs/thirdparty/ColladaLoader"], function(ColladaLoader) {
	 *                 new THREE.ColladaLoader().load(contentResource.getSource(),
	 *                     function(collada) { // onload
	 *                         parentNode.add(collada.scene);
	 *                         resolve({
	 *                             node: parentNode,
	 *                             contentResource: contentResource
	 *                         });
	 *                     },
	 *                     null,   // onprogress
	 *                     reject  // onfail
	 *                 );
	 *             });
	 *         });
	 *     };
	 *
	 *     var resolveContentManager = function(contentResource) {
	 *         if (sap.ui.core.URI.isValid(contentResource.getSource())) {
	 *             return new Promise(function(resolve, reject) {
	 *                 var xhr = new XMLHttpRequest();
	 *                 xhr.onerror = function(event) {
	 *                     reject();
	 *                 };
	 *                 xhr.onload = function(event) {
	 *                     if (xhr.status === 200 && xhr.getResponseHeader("Content-Type") === "model/vnd.collada+xml") {
	 *                         resolve({
	 *                             dimension: 3,
	 *                             contentManagerClassName: "sap.ui.vk.threejs.ContentManager",
	 *                             settings: {
	 *                                 loader: loadCollada
	 *                             }
	 *                         });
	 *                     } else {
	 *                         reject();
	 *                     }
	 *                 };
	 *                 xhr.open("HEAD", contentResource.getSource(), true);
	 *                 xhr.send(null);
	 *             });
	 *         } else {
	 *             return Promise.reject();
	 *         }
	 *     };
	 *
	 *     sap.ui.vk.ContentConnector.addContentManagerResolver(resolveContentManager);
	 * </pre>
	 *
	 * @example <caption>Add a new content manager resolver to load content resources with three.js objects.</caption>
	 * <pre>
	 *     var loadThreeJSObject = function(parentNode, contentResource) {
	 *         parentNode.add(contentResource.getSource());
	 *         return Promise.resolve({
	 *             node: parentNode,
	 *             contentResource: contentResource
	 *         });
	 *     };
	 *
	 *     var resolveThreeJSContentResource = function(contentResource) {
	 *         if (contentResource.getSource() instanceof THREE.Object3D) {
	 *             return Promise.resolve({
	 *                 dimension: 3,
	 *                 contentManagerClassName: "sap.ui.vk.threejs.ContentManager",
	 *                 settings: {
	 *                     loader: loadThreeJSObject
	 *                 }
	 *             });
	 *         } else {
	 *             return Promise.reject();
	 *         }
	 *     };
	 *
	 *     ContentConnector.addContentManagerResolver(resolveThreeJSContentResource);
	 *
	 *     var torusGeometry = new THREE.TorusGeometry(10, 3, 16, 100);
	 *     var torus = new THREE.Object3D()
	 *         .add(new THREE.LineSegments(
	 *             torusGeometry,
	 *             new THREE.LineBasicMaterial({
	 *                 color: 0xffffff,
	 *                 transparent: true,
	 *                 opacity: 0.5
	 *             })
	 *         ))
	 *         .add(new THREE.Mesh(
	 *             torusGeometry,
	 *             new THREE.MeshPhongMaterial({
	 *                 color: 0x156289,
	 *                 emissive: 0x072534,
	 *                 side: THREE.DoubleSide,
	 *                 shading: THREE.FlatShading
	 *             })
	 *         ));
	 *
	 *     contentConnector.addContentResource(
	 *         new ContentResource({
	 *             source: torus,
	 *             sourceId: "abc",
	 *             name: "Torus"
	 *         })
	 *     );
	 * </pre>
	 *
	 * @param {function|object} resolver Object that defines how to find out the content manager class name.<br>
	 *     If <code>resolver</code> is a function then this function takes one parameter of type {@link sap.ui.vk.ContentResource sap.ui.vk.ContentResource}
	 *     and returns a {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise Promise} that resolves with
	 *     an object with the following properties:
	 *     <ul>
	 *       <li><code>dimension</code> - int - Dimension of the model. E.g. 2 or 3.</li>
	 *       <li><code>contentManagerClassName</code> - string - Name of content manager class to use for loading the content resource.</li>
	 *       <li><code>settings</code> - object - Optional settings specific to the content manager.<br>
	 *           See {@link sap.ui.vk.threejs.ContentManager sap.ui.vk.threejs.ContentManager}.</li>
	 *     </ul>
	 *     If <code>resolver</code> is an object then it has the following properties.
	 * @param {string|RegExp} [resolver.pattern] The pattern the {@link sap.ui.vk.ContentResource#getSourceType sourceType} property
	 *     of the content resource is compared with.
	 * @param {int} [resolver.dimension] Dimension of models of this source type. E.g. 2 or 3.<br/>
	 * @param {string} [resolver.contentManagerClassName] Name of the content manager class to use for loading content resources of this type.
	 *     E.g. sap.ui.vk.dvl.ContentManager, sap.ui.vk.threejs.ContentManager, sap.ui.vk.ImageContentManager.
	 * @param {object} [resolver.settings] Optional settings specific to the content manager class.
	 * @returns {function} The {@link sap.ui.vk.ContentConnector sap.ui.vk.ContentConnector} class to allow method chaining.
	 * @public
	 * @static
	 * @since 1.50.0
	 */
	ContentConnector.addContentManagerResolver = function(resolver) {
		if (typeof resolver === "function") {
			resolvers.unshift(resolver);
		} else {
			resolvers.unshift({
				pattern: resolver.pattern,
				dimension: resolver.dimension,
				contentManagerClassName: resolver.contentManagerClassName,
				settings: resolver.settings
			});
		}
		return this;
	};

	/**
	 * Removes all content manager resolvers.
	 *
	 * @returns {function} The {@link sap.ui.vk.ContentConnector sap.ui.vk.ContentConnector} class to allow method chaining.
	 * @public
	 * @static
	 * @since 1.50.0
	 */
	ContentConnector.removeAllContentManagerResolvers = function() {
		resolvers = [];
		return this;
	};

	/**
	 * Removes a content manager resolver.
	 *
	 * If there are more than one content manager resolver matching the <code>resolver</code> the last added is removed.
	 *
	 * @param {function|string|RegExp} resolver Object that defines how to find out the content manager class name.
	 * @returns {boolean} <code>true</code> if a matching resolver is found and removed, <code>false</code> otherwise.
	 * @public
	 * @static
	 * @since 1.50.0
	 */
	ContentConnector.removeContentManagerResolver = function(resolver) {
		var isFunction = typeof resolver === "function",
		    isString = typeof resolver === "string",
		    isRegExp = resolver instanceof RegExp;
		for (var i = 0, count = resolvers.length; i < count; ++i) {
			if (isFunction || isString) {
				if (resolvers[i] === resolver) {
					resolvers.splice(i, 1);
					return true;
				}
			} else if (isRegExp) {
				if (typeof resolvers[i] === "object" && resolvers[i].pattern instanceof RegExp && resolvers[i].pattern.source === resolver.source) {
					resolvers.splice(i, 1);
					return true;
				}
			}

		}
		return false;
	};

	/**
	 * Collects information about content resource types.
	 *
	 * Content resources can be 2D and 3D models. Depending of content type different rendering technologies
	 * should be used, e.g. DVL, ThreeJS or native browser capabilities, e.g. for raster 2D files.
	 *
	 * This method has a side effect - it assigns content manager resolvers to the content resources.
	 *
	 * @param {sap.ui.vk.ContentResource[]} contentResources The array of content resources.
	 * @returns {Promise} Promise that resolves with a value with the following format:
	 * <pre>
	 *   {
	 *     noSourceTypes: boolean,                 // true if some of the content resources have no source types.
	 *     unknownSourceTypes: boolean,            // true if some of the content resources have unknown source types.
	 *     dimensions: [int, ...],                 // a list of distinct dimensions of the content resources.
	 *     contentManagerClassNames: [string, ...] // a list of distinct content manager class names.
	 *   }
	 * </pre>
	 * @private
	 * @since 1.50.0
	 */
	ContentConnector.prototype._collectContentResourceSourceTypeInformation = function(contentResources) {
		var noSourceTypes = false,
		    unknownSourceTypes = false,
		    dimensions = {},
		    contentManagerClassNames = {},
		    flatList = [];

		contentResources.forEach(function flatten(contentResource) {
			flatList.push(contentResource);
			contentResource.getContentResources().forEach(flatten);
		});

		return Promise.all(
				flatList.map(
					function(contentResource) {
						return resolveContentManager(contentResource)
							.then(
								function(resolver) { // onFulfilled
									dimensions[resolver.dimension] = true;
									contentManagerClassNames[resolver.contentManagerClassName] = true;
									return resolver;
								},
								function() { // onRejected
									if (contentResource.getSourceType()) {
										unknownSourceTypes = true;
									} else {
										noSourceTypes = true;
									}
									return false;
								}
							);
					}
				)
			)
			.then(function(results) {
				for (var i = 0, count = flatList.length; i < count; ++i) {
					if (results[i]) {
						// Assign the resolver to the content resource.
						// It might be used by those content managers that support additional settings.
						flatList[i]._contentManagerResolver = results[i];
					}
				}
				return {
					noSourceTypes: noSourceTypes,
					unknownSourceTypes: unknownSourceTypes,
					dimensions: Object.getOwnPropertyNames(dimensions).sort(),
					contentManagerClassNames: Object.getOwnPropertyNames(contentManagerClassNames)
				};
			});
	};

	var fullClassName = ContentConnector.getMetadata().getName();

	var mixin = {
		init: function() {
			this._contentConnector = null;
			sap.ui.vk.getCore()
				.attachEvent(fullClassName + "-created", this._handleContentConnectorCreated, this)
				.attachEvent(fullClassName + "-destroying", this._handleContentConnectorDestroying, this);
		},

		exit: function() {
			this.setContentConnector(null);
			sap.ui.vk.getCore()
				.detachEvent(fullClassName + "-destroying", this._handleContentConnectorDestroying, this)
				.detachEvent(fullClassName + "-created", this._handleContentConnectorCreated, this);
		},

		setContentConnector: function(contentConnector) {
			this.setAssociation("contentConnector", contentConnector, true);
			this._updateContentConnector();
			return this;
		},

		_updateContentConnector: function() {
			var newContentConnectorId = this.getContentConnector(),
			    // sap.ui.getCore() returns 'undefined' if cannot find an element,
			    // getContentConnector() returns 'null' if there is no connector.
			    newContentConnector = newContentConnectorId && sap.ui.getCore().byId(newContentConnectorId) || null;

			if (this._contentConnector !== newContentConnector) {
				this._clearContentConnector();
				if (newContentConnector) {
					if (this._handleContentChangesStarted) {
						newContentConnector.attachContentChangesStarted(this._handleContentChangesStarted, this);
					}
					if (this._handleContentChangesFinished) {
						newContentConnector.attachContentChangesFinished(this._handleContentChangesFinished, this);
					}
					if (this._handleContentChangesProgress) {
						newContentConnector.attachContentChangesProgress(this._handleContentChangesProgress, this);
					}
					if (this._handleContentReplaced) {
						newContentConnector.attachContentReplaced(this._handleContentReplaced, this);
					}
					if (this._handleContentDestroying) {
						newContentConnector.attachContentDestroying(this._handleContentDestroying, this);
					}
					this._contentConnector = newContentConnector;
					if (this._onAfterUpdateContentConnector) {
						this._onAfterUpdateContentConnector();
					}
				}
			}
			return this;
		},

		_clearContentConnector: function() {
			if (this._contentConnector) {
				if (this._onBeforeClearContentConnector) {
					this._onBeforeClearContentConnector();
				}
				if (this._handleContentDestroying) {
					this._contentConnector.detachContentDestroying(this._handleContentDestroying, this);
				}
				if (this._handleContentReplaced) {
					this._contentConnector.detachContentReplaced(this._handleContentReplaced, this);
				}
				if (this._handleContentChangesProgress) {
					this._contentConnector.detachContentChangesProgress(this._handleContentChangesProgress, this);
				}
				if (this._handleContentChangesFinished) {
					this._contentConnector.detachContentChangesFinished(this._handleContentChangesFinished, this);
				}
				if (this._handleContentChangesStarted) {
					this._contentConnector.detachContentChangesStarted(this._handleContentChangesStarted, this);
				}
				this._contentConnector = null;
			}
			return this;
		},

		_handleContentConnectorCreated: function(event) {
			if (this.getContentConnector() === event.getParameter("object").getId()) {
				this._updateContentConnector();
			}
		},

		_handleContentConnectorDestroying: function(event) {
			if (this.getContentConnector() === event.getParameter("object").getId()) {
				this._clearContentConnector();
			}
		}
	};

	ContentConnector.injectMethodsIntoClass = function(classObject) {
		var prototype = classObject.prototype,
		    init = prototype.init,
		    exit = prototype.exit;

		prototype.init = function() {
			if (init) {
				init.call(this);
			}
			mixin.init.call(this);
		};

		prototype.exit = function() {
			mixin.exit.call(this);
			if (exit) {
				exit.call(this);
			}
		};

		prototype.setContentConnector = mixin.setContentConnector;
		prototype._updateContentConnector = mixin._updateContentConnector;
		prototype._clearContentConnector = mixin._clearContentConnector;
		prototype._handleContentConnectorCreated = mixin._handleContentConnectorCreated;
		prototype._handleContentConnectorDestroying = mixin._handleContentConnectorDestroying;
	};

	return ContentConnector;
});
