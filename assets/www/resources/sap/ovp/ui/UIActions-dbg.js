/*global jQuery, sap, clearTimeout, console, window */
(function() {
	"use strict";

	jQuery.sap.declare("sap.ovp.ui.UIActions");

	sap.ovp.ui.UIActions = function(cfg) {

		if (!cfg || !cfg.rootSelector || !cfg.containerSelector || !cfg.draggableSelector) {
			throw new Error("No configuration object to initialize User Interaction module.");
		}

		/* PRIVATE MEMBERS */
		this.captureStart = null; // {Function} capture start event X and Y position
		this.captureMove = null; // {Function} capture move event X and Y position
		this.captureEnd = null; // {Function} capture end event X and Y position
		this.clickCallback = null; // {Function} Callback function execute after capture `click` event
		this.clickEvent = null; // {String} `click` event
		this.clickHandler = null; // {Function} capture click event and prevent the default behaviour on IOS
		this.clone = null; // {Element} cloned draggable element
		this.cloneClass = null; // {String} clone CSS Class
		this.container = null; // {Element} content container to be scrolled
		this.contextMenuEvent = null; // {String} `contextmenu` event for Windows 8 Chrome
		this.debug = false; // {Boolean} for debug mode
		this.dragMoveCallback = null; // {Function} Callback function executes while drag mode is active
		this.draggable = null; // {Array<Element>|NodeList<Element>} list of draggable elements
		this.placeHolderClass = null; // {String} placeholder CSS Class
		this.draggableSelector = null; // {String} CSS Selector String which specifies the draggable elements
		this.doubleTapCallback = null; // {Function} Callback function execute when double tap
		this.doubleTapDelay = null; // {Number} number of milliseconds to recognize double tap
		this.element = null; // {Element} draggable element
		this.swapTargetElement = null; // {Element} draggable element to swap the current element with
		this.endX = null; // {Number} X coordinate of end event
		this.endY = null; // {Number} Y coordinate of end event
		this.isTouch = null; // {Boolean} does browser supports touch events
		this.lastElement = null; // {Element} last tapped element
		this.lastTapTime = null; // {Number} number of milliseconds elapsed since last touchstart or mousedown
		this.lockMode = null; // {Boolean} if the value is true, preventing change element mode
		this.log = null; // {Function} logs to console in debug mode
		this.mode = null; // {String} current feature mode `normal`, `scroll`, `drag`, `move`
		this.mouseDownEvent = null; // {String} 'mousedown'
		this.mouseMoveEvent = null; // {String} 'mousemove'
		this.mouseUpEvent = null; // {String} 'mouseup'
        this.keyUpEvent = null; // {String} 'keyup' 
		this.moveTolerance = null; // {Number} tolerance in pixels between touchStart/mousedwon and touchMove/mousemove
		this.moveX = null; // {Number} X coordinate of move event
		this.moveY = null; // {Number} Y coordinate of move event
		this.noop = null; // {Function} empty function
		this.preventClickFlag = false; // {Boolean} flag indicates if prevent default click behaviour
		this.preventClickTimeoutId = null; // {Number}  timer ID. Used to clear click preventing
		this.scrollContainer = null; // {Element} the element we would like to transition while drag and scroll
		this.scrollContainerSelector = null; // {String} CSS Selector String which specifies the element we would like to transition while drag and scroll
		this.scrollEvent = null; // {String} `scroll` event
		this.scrollTimer = null; // {Number} number of milliseconds elapsed since the last scroll event
		this.startX = null; // {Number} X coordinate of start event
		this.startY = null; // {Number} Y coordinate of start event
		this.switchModeDelay = null; // {Number} switch mode delay in ms
		this.tapsNumber = null; // {Number} the number of taps. could be 0 / 1 / 2
		this.timer = null; // {Number} timer ID. Used to decide mode
		this.scrollHandler = null; // {Function} scroll event handler
		this.touchCancelEvent = null; // {String} `touchcancel` event
		this.dragStartCallback = null; // {Function} Callback function execute when drag mode is active
		this.dragEndCallback = null; // {Function} Callback function execute after capture `touchend` or `mouseup` event and mode is 'drag' or 'drag-and-scroll'
		this.endCallback = null; // {Function} Callback function execute after capture `touchend` or `mouseup` event
		this.touchEndEvent = null; // {String} `touchend`
		this.touchMoveEvent = null; // {String} `touchmove`
		this.beforeDragCallback = null; // {Function} Callback function execute after capture `touchstart` or `mousedown` event
		this.touchStartEvent = null; // {String} `touchstart`
		this.wrapper = null; // {Element} content container parent
		this.wrapperRect = null; // {Object} wrapper Bounding Rect
		this.scrollEdge = 100; // {Number} edge in pixels top and bottom when scroll is starting

		this.resizeStartCallback = null;
		this.resizeMoveCallback = null; // {Function} Callback function executes while resize mode is active
		this.resizeEndCallback = null;
		this.isResize = null;
        this.isResizeX = null; //Flag to distinguish for X-direction resize
        this.isResizeY = null;  //Flag to distinguish for Y-direction resize
		this.resizeHandleDistance = null;
        this.layoutDetails = null; //Property to check for the layout of the application i.e Fixed Card or Resizable Card Layout

		/**
		 * Initialize state using configuration
		 *
		 * @private
		 */
		this.init = function(cfg) {
			this.startX = -1;
			this.startY = -1;
			this.moveX = -1;
			this.moveY = -1;
			this.endX = -1;
			this.endY = -1;

            //Threshold distance for the card from where it can be resized
			this.resizeHandleDistance = 16;
			this.isResize = false;
            this.isResizeX = false;
            this.isResizeY = false;

			this.noop = function() {};
			this.isTouch = cfg.isTouch ? !!cfg.isTouch : false;
			this.container = document.querySelector(cfg.containerSelector);
			this.scrollContainerSelector = cfg.scrollContainerSelector || cfg.containerSelector;
			this.switchModeDelay = cfg.switchModeDelay || 1500;
			this.moveTolerance = cfg.moveTolerance === 0 ? 0 : cfg.moveTolerance || 1000;
			this.draggableSelector = cfg.draggableSelector;
			this.mode = 'normal';
			this.debug = cfg.debug || false;
			this.root = document.querySelector(cfg.rootSelector);
			this.tapsNumber = 0;
			this.lastTapTime = 0;
			this.log = this.debug ? this.logToConsole : this.noop;
			this.lockMode = false;
			this.placeHolderClass = cfg.placeHolderClass || "";
			this.cloneClass = cfg.cloneClass || "";
			this.wrapper = cfg.wrapperSelector ? document.querySelector(cfg.wrapperSelector) : this.container.parentNode;
			this.clickCallback = typeof cfg.clickCallback === 'function' ? cfg.clickCallback : this.noop;
			this.beforeDragCallback = typeof cfg.beforeDragCallback === 'function' ? cfg.beforeDragCallback : this.noop;
			this.doubleTapCallback = typeof cfg.doubleTapCallback === 'function' ? cfg.doubleTapCallback : this.noop;
			this.dragEndCallback = typeof cfg.dragEndCallback === 'function' ? cfg.dragEndCallback : this.noop;
			this.endCallback = typeof cfg.endCallback === 'function' ? cfg.endCallback : this.noop;
			this.dragStartCallback = typeof cfg.dragStartCallback === 'function' ? cfg.dragStartCallback : this.noop;
			this.dragMoveCallback = typeof cfg.dragMoveCallback === 'function' ? cfg.dragMoveCallback : this.noop;
			this.doubleTapDelay = cfg.doubleTapDelay || 500;
			this.wrapperRect = this.wrapper.getBoundingClientRect();
			this.scrollEvent = 'scroll';
			this.touchStartEvent = 'touchstart';
			this.touchMoveEvent = 'touchmove';
			this.touchEndEvent = 'touchend';
			this.mouseDownEvent = 'mousedown';
			this.mouseMoveEvent = 'mousemove';
			this.mouseUpEvent = 'mouseup';
            this.keyUpEvent = 'keyup';
			this.contextMenuEvent = 'contextmenu';
			this.touchCancelEvent = 'touchcancel';
			this.clickEvent = 'click';
            this.layoutDetails = cfg.layout ? cfg.layout.dashboardLayoutUtil : null;

			this.resizeStartCallback = typeof cfg.resizeStartCallback === 'function' ? cfg.resizeStartCallback : this.noop;
			this.resizeMoveCallback = typeof cfg.resizeMoveCallback === 'function' ? cfg.resizeMoveCallback : this.noop;
			this.resizeEndCallback = typeof cfg.resizeEndCallback === 'function' ? cfg.resizeEndCallback : this.noop;

			if (this.wrapper) {
				jQuery(this.wrapper).css({
					"position": "relative",
					"top": 0,
					"left": 0,
					"right": 0,
					"bottom": 0,
					"-webkit-transform": "translateZ(0)",
					"transform": "translateZ(0)"
				});
			}
		};

		/* PRIVATE METHODS */

		/**
		 * Iterates over array-like object and calls callback function
		 * for each item
		 *
		 * @param {Array|NodeList|Arguments} scope - array-like object
		 * @param {Function} callback - function to be called for each element in scope
		 * @returns {Array|NodeList|Arguments} scope
		 */
		this.forEach = function(scope, callback) {
			/*
			 * NodeList and Arguments don't have forEach,
			 * therefore borrow it from Array.prototype
			 */
			return Array.prototype.forEach.call(scope, callback);
		};

		/**
		 * Returns index of item in array-like object
		 *
		 * @param {Array|NodeList|Arguments} scope - array-like object
		 * @param {*} item - item which index to be found
		 * @returns {Number} index of item in the array-like object
		 */
		this.indexOf = function(scope, item) {
			/*
			 * NodeList and Arguments don't have indexOf,
			 * therefore borrow it from Array.prototype
			 */
			return Array.prototype.indexOf.call(scope, item);
		};

		/**
		 * Cuts item from array-like object and pastes before reference item
		 *
		 * @param {Array|NodeList|Arguments} scope
		 * @param {*} item
		 * @param {*} referenceItem
		 */
		this.insertBefore = function(scope, item, referenceItem) {
			var itemIndex,
				referenceItemIndex,
				splice;

			splice = Array.prototype.splice;
			itemIndex = this.indexOf(scope, item);
			referenceItemIndex = this.indexOf(scope, referenceItem);

			splice.call(
				scope,
				referenceItemIndex - (itemIndex < referenceItemIndex ? 1 : 0),
				0,
				splice.call(scope, itemIndex, 1)[0]
			);
		};

		/**
		 * Log to console
		 *
		 * @private
		 */
		this.logToConsole = function() {
			window.console.log.apply(console, arguments);
		};

		this.getDraggableElement = function(currentElement) {
			var element;

			this.draggable = jQuery(this.draggableSelector, this.container);
			//Since we are listening on the root element,
			//we would like to identify when a draggable element is being touched.
			//The target element of the event is the lowest element in the DOM hierarchy
			//where the user touched the screen.
			//We need to climb in the DOM tree from the target element until we identify the draggable element,
			//or getting out of container scope.
			while (typeof element === 'undefined' && currentElement !== this.root) {
				//Only draggable tiles
				if (this.indexOf(this.draggable, currentElement) >= 0) {
					element = currentElement;
				}
				currentElement = currentElement.parentNode;
			}

			return element;
		};


		/**
		 * Capture X and Y coordinates of touchstart or mousedown event
		 *
		 * @param {Event} evt - touchstart or mousedowm event
		 * @private
		 */
		this.captureStart = function(evt) {
			var eventObj;

			if (evt.type === 'touchstart' && evt.touches.length === 1) {
				eventObj = evt.touches[0];
			} else if (evt.type === 'mousedown') {
				eventObj = evt;
				if (evt.which !== 1) { //Only LEFT click operation is enabled. Otherwise do nothing.
					return;
				}
			}

			if (eventObj) {
				this.element = this.getDraggableElement(eventObj.target);
				this.startX = eventObj.pageX;
				this.startY = eventObj.pageY;
				this.lastMoveX = 0;
				this.lastMoveY = 0;

				//drag&drop or resize?
                if (this.element) {
                    var $elem = jQuery(this.element);
                    var elemLeft = $elem.offset().left;
                    var elemTop = $elem.offset().top;
                    var elemHeight = $elem.height();
                    var elemWidth = $elem.width();
                    //For Resizable card layout then both Drag and resize available while for Fixed card layout only card can be dragged.
                    //check to distinguish between drag and Resize depending upon the layout
                    if (this.layoutDetails) {
                        var rightX = (elemLeft + elemWidth - this.startX) < this.resizeHandleDistance;
                        var bottomY = (elemTop + elemHeight - this.startY) < this.resizeHandleDistance;
                        if (rightX || bottomY) {
                            //Condition to distinguish between resize in X-direction , Y-direction and XY-direction
                            //If the interaction point is right side of card then it's X-direction resize
                            if (rightX && bottomY) {
                                this.isResizeX = false;
                                this.isResizeY = false;
                                //If the interaction point is bottom part of card then it's Y-direction resize
                            } else if (!rightX && bottomY) {
                                this.isResizeX = false;
                                this.isResizeY = true;
                                //If the interaction point is at right side and bottom part of card then it's XY-direction resize
                            } else if (rightX && !bottomY) {
                                this.isResizeX = true;
                                this.isResizeY = false;
                            }
                            this.isResize = true;
                        }
                    } else {
                        var dX = elemLeft + elemWidth - this.startX;
                        var dY = elemTop + elemHeight - this.startY;
                        if (dX < this.resizeHandleDistance && dY < this.resizeHandleDistance) {
                            this.isResize = true;
                        }
                    }
                }

				//Check if it is a doubletap flow or single tap
				if (this.lastTapTime && this.lastElement && this.element && (this.lastElement === this.element) && Math.abs(Date.now() - this.lastTapTime) <
					this.doubleTapDelay) {
					this.lastTapTime = 0;
					this.tapsNumber = 2;
				} else {
					this.lastTapTime = Date.now();
					this.tapsNumber = 1;
					this.lastElement = this.element;
				}

				this.log('captureStart(' + this.startX + ', ' + this.startY + ')');
			}
		};

		/**
		 * Handler for `mousedown` or `touchstart`
		 *
		 * @private
		 */
		this.startHandler = function(evt) {
			this.log('startHandler');
		//	clearTimeout(this.timer);
		//	delete this.timer;
			this.captureStart(evt);
			if (this.element) {
				this.beforeDragCallback(evt, this.element);
				if (this.lockMode === false) {
					if (this.tapsNumber === 2) {
						this.mode = 'double-tap';
						return;
					}
					if (evt.type === "touchstart") {
						this.timer = setTimeout(function() {
							if (this.isResize) {
								this.log("mode switched to resize");
								this.mode = "resize";
								this.resizeStartCallback(evt, this.element);
							} else {
								this.log('mode switched to drag');
								this.mode = 'drag';
								this.createClone();
								this.dragStartCallback(evt, this.element);
							}
						}.bind(this), this.switchModeDelay);
					}
				}
			}
		}.bind(this);

		/**
		 * Capture X and Y coordinates of touchmove or mousemove event
		 *
		 * @param {Event} evt - touchmove or mousemove event
		 * @private
		 */
		this.captureMove = function(evt) {
			var eventObj;

			if (evt.type === 'touchmove' && evt.touches.length === 1) {
				eventObj = evt.touches[0];
			} else if (evt.type === 'mousemove') {
				eventObj = evt;
			}
			if (eventObj) {
				this.moveX = eventObj.pageX;
				this.moveY = eventObj.pageY;

				this.log('captureMove(' + this.moveX + ', ' + this.moveY + ')');
			}
		};

		/**
		 * Handler for `mousemove` or `touchmove`
		 *
		 * @private
		 */
		this.moveHandler = function(evt) {
			this.log('moveHandler');
			this.captureMove(evt);
			switch (this.mode) {
				case 'normal':
					if ((Math.abs(this.startX - this.moveX) > this.moveTolerance || Math.abs(this.startY - this.moveY) > this.moveTolerance)) {
						if (evt.type === "touchmove") {
							this.log('-> normal');
							clearTimeout(this.timer);
							delete this.timer;
						} else if (this.element) { //In desktop start dragging immediately

							if (this.isResize) {
								this.log("mode switched to resize");
								this.mode = "resize";
								// resize  callback ??
							} else {
								this.log('mode switched to drag');
								this.mode = 'drag';
								this.createClone();
							}
						}
					}
					break;
				case 'drag':
					evt.preventDefault();
					this.log('-> drag');
					this.mode = 'drag-and-scroll';
					window.addEventListener(this.mouseUpEvent, this.endHandler, true);
                    // Adding a keyup event to terminate the drag and drop in case of a key is pressed
                    window.addEventListener(this.keyUpEvent, this.endHandler, true);
					this.translateClone();
					this.scrollContainer = document.querySelector(this.scrollContainerSelector);

					if (evt.type === "mousemove") {
						this.dragStartCallback(evt, this.element);
					}
					break;
				case 'drag-and-scroll':
					evt.stopPropagation();
					evt.preventDefault();
					this.log('-> drag-and-scroll');
					this.translateClone();
					this.dragMoveCallback({
						evt: evt,
						clone: this.clone,
						element: this.element,
						draggable: this.draggable,
						moveX: this.moveX,
						moveY: this.moveY
					});
					break;
				case "resize":
					evt.preventDefault();
					this.log('-> resize');
					this.mode = 'resize-and-scroll';
					window.addEventListener(this.mouseUpEvent, this.endHandler, true);
					this.scrollContainer = document.querySelector(this.scrollContainerSelector);

					if (evt.type === "mousemove") {
						this.resizeStartCallback(evt, this.element);
					}
					break;
				case "resize-and-scroll":
					evt.stopPropagation();
					evt.preventDefault();
					this.log('-> resize-and-scroll');
					this.resizeMoveCallback({
						evt: evt,
						element: this.element,
						draggable: this.draggable,
						moveX: this.moveX,
						moveY: this.moveY
					});
					break;
				default:
					break;
			}
		}.bind(this);

		/**
		 * Capture X and Y coordinates of touchend or mouseup event
		 *
		 * @param {Event} evt - touchmove or mouseup event
		 * @private
		 */
		this.captureEnd = function(evt) {
			var eventObj;

			if ((evt.type === 'touchend' || evt.type === 'touchcancel') && (evt.changedTouches.length === 1)) {
				eventObj = evt.changedTouches[0];
			} else if (evt.type === 'mouseup') {
				eventObj = evt;
			}
			if (eventObj) {
				this.endX = eventObj.pageX;
				this.endY = eventObj.pageY;

				this.log('captureEnd(' + this.endX + ', ' + this.endY + ')');
			}
		};

		/**
		 * Handler for `contextmenu` event. Disable right click on Chrome
		 *
		 * @private
		 */
		this.contextMenuHandler = function(evt) {
			if (this.isTouch) {
				evt.preventDefault();
			}

		}.bind(this);

		/**
		 *
		 * @param event
		 */
		this.clickHandler = function(event) {

			if (this.preventClickFlag) {
				this.preventClickFlag = false;
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();
				clearTimeout(this.preventClickTimeoutId);
			}
			this.clickCallback();

		}.bind(this);

		/**
		 * This function solves a bug which causes the tile to be launched after D&D.
		 */
		this.preventClick = function() {
			this.preventClickFlag = true;
			this.preventClickTimeoutId = setTimeout(function() {
				this.preventClickFlag = false;
			}.bind(this), 100);
		};

		/**
		 * Handler for `mouseup` or `touchend`
		 *
		 * @private
		 */
		this.endHandler = function(evt) {
			this.log('endHandler');
            if ((evt.type == this.keyUpEvent && evt.which == jQuery.sap.KeyCodes.ESCAPE) || evt.type == this.mouseUpEvent || evt.type == this.touchEndEvent) {
                this.captureEnd(evt);
                switch (this.mode) {
                    case 'normal':
                        this.log('-> normal');
                        break;
                    case 'drag':
                        this.log('-> drag');
                        this.dragEndCallback(evt, this.element, this.clone);
                        this.preventClick();
                        break;
                    case 'drag-and-scroll':
                        this.log('-> drag-and-scroll');
                        window.removeEventListener(this.mouseUpEvent, this.endHandler, true);
                        this.dragEndCallback(evt, this.element, this.clone);
                        this.preventClick();
                        evt.stopPropagation();
                        evt.preventDefault();
                        break;
                    case 'double-tap':
                        this.log('-> double-tap');
                        this.doubleTapCallback(evt, this.element);
                        break;
                    case "resize":
                        this.log("-> resize");
                        this.isResize = false;
                        this.resizeEndCallback(evt, this.element);
                        this.preventClick();
                        break;
                    case "resize-and-scroll":
                        this.log("-> resize-and-scroll");
                        window.removeEventListener(this.mouseUpEvent, this.endHandler, true);
                        this.isResize = false;
                        this.resizeEndCallback(evt, this.element);
                        this.preventClick();
                        evt.stopPropagation();
                        evt.preventDefault();
                        break;
                    default:
                        break;
                }
                if (this.element) {
                    this.endCallback(evt, this.element);
                }
                clearTimeout(this.timer);
                delete this.timer;
                this.lastMoveX = 0;
                this.lastMoveY = 0;
                this.swapTargetElement = null;
                this.element = null;
                this.mode = 'normal';
            }
		}.bind(this);

		this.defaultDragStartHandler = function(evt) {
			//prevent the Native Drag behavior of the browser
			evt.preventDefault();
		};

		this.scrollHandler = function() {
			clearTimeout(this.scrollTimer);
			this.lockMode = true;
			//release the scroll lock after 100 ms
			this.scrollTimer = setTimeout(function() {
				this.lockMode = false;
			}.bind(this), 500);
		}.bind(this);

		/**
		 * Create clone of draggable element
		 *
		 * @private
		 */
		this.createClone = function() {
			var style,
				rect;
			if (this.clone) {
				this.removeClone(); 
			}
			rect = this.element.getBoundingClientRect();
			this.clone = this.element.cloneNode(true);

			// If the cloned element contains canvas children,
			// we have to clone the rendered content too. Simply
			// cloning a canvas node will create a new canvas element,
			// but it doesn't also transfer the rendered contet.
			var canvasesOld = this.element.querySelectorAll('canvas');
			if (canvasesOld.length) {
				var canvasesNew = this.clone.querySelectorAll('canvas');

				for (var i = 0; i < canvasesOld.length; i++) {
					// Painting the original canvas on the cloned canvas
					canvasesNew[i].getContext('2d').drawImage(canvasesOld[i], 0, 0);
				}
			}

			this.clone.className += (' ' + this.cloneClass);
            if (!this.layoutDetails) {
                this.element.className += (' ' + 'easyScanLayoutItemWrapper-placeHolder');
            } else {
                this.element.className += (' ' + 'dashboardLayoutItemWrapper-placeHolder');
            }
			style = this.clone.style;
			style.position = 'absolute';
			style.display = 'block';
			style.top = (rect.top - this.root.getBoundingClientRect().top) + 'px';
			style.left = (rect.left - this.root.getBoundingClientRect().left) + 'px';
			style.width = rect.width + 'px';
			style.zIndex = '100';
			style.webkitTransition = '-webkit-transform 0ms cubic-bezier(0.33, 0.66, 0.66, 1)';
			style.mozTransition = '-moz-transform 0ms cubic-bezier(0.33, 0.66, 0.66, 1)';
			style.msTransition = '-ms-transform 0ms cubic-bezier(0.33, 0.66, 0.66, 1)';
			style.transition = 'transform 0ms cubic-bezier(0.33, 0.66, 0.66, 1)';
			style.webkitTransform = 'translate3d(0px, 0px, 0px) ';
			style.mozTransform = 'translate3d(0px, 0px, 0px) ';
			style.msTransform = 'translate3d(0px, 0px, 0px) ';
			style.transform = 'translate3d(0px, 0px, 0px) ';
			this.root.appendChild(this.clone);
			this.log('createClone');
		};

		/**
		 * Remove clone of draggable element
		 *
		 * @private
		 */
		this.removeClone = function() {
			if (this.element !== null && typeof (this.element) !== "undefined"){
				this.element.className = this.element.className.split(' ' + this.placeHolderClass).join('');
			}
			
			if (this.clone !== null) {
				this.clone.parentElement.removeChild(this.clone);
				// unset reference to DOM element of the clone, otherwise it will remain DOM fragment
				this.clone = null;
				this.log("removeClone");
			}
		};

		/**
		 * Translate clone of draggable element
		 *
		 * @private
		 */
		this.translateClone = function() {
			var deltaX,
				deltaY;

			deltaX = this.moveX - this.startX;
			deltaY = this.moveY - this.startY;
            if (this.clone && deltaX && deltaY) {
                this.clone.style.webkitTransform = 'translate3d(' + deltaX + 'px, ' + deltaY + 'px, 0px)';
                this.clone.style.mozTransform = 'translate3d(' + deltaX + 'px, ' + deltaY + 'px, 0px)';
                //IE9 contains only 2-D transform
                this.clone.style.msTransform = 'translate(' + deltaX + 'px, ' + deltaY + 'px)';
                this.clone.style.transform = 'translate3d(' + deltaX + 'px, ' + deltaY + 'px, 0px)';
                this.log('translateClone (' + deltaX + ', ' + deltaY + ')');
                //this.clone.style.opacity = '0.5'; // make floater transparent
            }
		};

		/* PUBLIC METHODS */

		/**
		 * Enable feature
		 *
		 * @public
		 */
		this.enable = function() {
			this.log('enable');
			//Touch Events
			this.root.addEventListener(this.touchStartEvent, this.startHandler, false);
			this.root.addEventListener(this.touchMoveEvent, this.moveHandler, true);
			this.root.addEventListener(this.touchEndEvent, this.endHandler, false);
			this.root.addEventListener(this.touchCancelEvent, this.endHandler, false);
			//Mouse Events
			this.root.addEventListener(this.mouseMoveEvent, this.moveHandler, true);
			this.root.addEventListener(this.mouseDownEvent, this.startHandler, false);
			this.root.addEventListener(this.mouseUpEvent, this.endHandler, false);
			//Additional Events
			this.root.addEventListener(this.contextMenuEvent, this.contextMenuHandler, false);
			this.root.addEventListener(this.clickEvent, this.clickHandler, true);
			this.wrapper.addEventListener(this.scrollEvent, this.scrollHandler, false);

			return this;
		};

		/**
		 * Disable feature
		 *
		 * @public
		 */
		this.disable = function() {
			this.log('disable');
			this.root.removeEventListener(this.touchStartEvent, this.startHandler, false);
			this.root.removeEventListener(this.touchMoveEvent, this.moveHandler, true);
			this.root.removeEventListener(this.touchEndEvent, this.endHandler, false);
			this.root.removeEventListener(this.mouseDownEvent, this.startHandler, false);
			this.root.removeEventListener(this.mouseMoveEvent, this.moveHandler, true);
			this.root.removeEventListener(this.mouseUpEvent, this.endHandler, false);
			this.root.removeEventListener(this.contextMenuEvent, this.contextMenuHandler, false);
			this.root.removeEventListener(this.clickEvent, this.clickHandler, true);
			this.root.removeEventListener(this.touchCancelEvent, this.endHandler, false);
			this.wrapper.removeEventListener(this.scrollEvent, this.scrollHandler, false);

			return this;
		};

		/*
		 * Initialize dynamic feature state
		 * and behaviour using configuration
		 */
		this.init(cfg);

		/**
		 * @public
		 * @returns {{x: moveX, y: moveY}}
		 */
		this.getMove = function() {
			return {
				x: this.moveX,
				y: this.moveY
			};
		};
	};
})();