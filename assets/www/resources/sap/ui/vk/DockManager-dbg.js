sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control", "./DockContainer", "./DockPane", "./Loco", "sap/ui/core/ResizeHandler"
], function(jQuery, library, Control, DockContainer, DockPane, Loco, ResizeHandler) {
	"use strict";

	var DockManager = Control.extend("sap.ui.vk.DockManager", {
		metadata: {
			library: "sap.ui.vk",
			publicMethods: [
				"getDomElement",
				"addDockPane",
				"removeDockPane",
				"addDockContainer",
				"removeDockContainer",
				"dock",
				"undock",
				"bringToFront",
				"beginGesture",
				"move",
				"endGesture",
				"resize"
			],

			properties: {
				/**
				 * Width of the Viewer control
				 */
				width: {
					type: "sap.ui.core.CSSSize",
					defaultValue: "auto"
				},
				/**
				 * Height of the Viewer control
				 */
				height: {
					type: "sap.ui.core.CSSSize",
					defaultValue: "auto"
				}
			}
		}
	});

	DockManager.prototype.init = function() {
		if (typeof DockManager._counter == "undefined") {
			DockManager._counter = 0;
		}
		this._id = "DockManager_" + DockManager._counter;
		DockManager._counter++;

		var elem = document.createElement("div");
		elem.setAttribute("id", this._id);
		// elem.addClass("sapUiDockManager_elem");
		elem.style.width = "100%";
		elem.style.height = "100%";
		elem.style.overflow = "hidden";
		elem.style.position = "relative";
		elem.style.backgroundColor = "blue";

		this._elem = elem;
		this._root = null;
		this._panes = [];
		this._containers = [];
		this._dockIcons = null;
		this._gesture = false;
		this._oPane = null;
		this._oParent = null;
		this._oDir = null;
		this._oContainer = null;
		this._oResize = null;
		this._oResizeDir = 0;
		this._oIsTab = false;
		this._rendered = false;

		/*
		 * TO DO:
		 * install Loco handlers
		 */
		this._loco = new Loco();
		this._loco.addHandler(this);
	};

	DockManager.prototype.exit = function() {
		this._loco.removeHandler(this._viewportHandler);

		if (this._resizeListenerId) {
			ResizeHandler.deregister(this._resizeListenerId);
			this._resizeListenerId = null;
		}
	};

	DockManager.prototype.isRendered = function() {
		return this._rendered;
	};

	DockManager.prototype.alwaysOnTop = function() {
		this._loco = new Loco();
		this._loco.removeHandler(this);
		this._loco.addHandler(this);
	};

	DockManager.prototype.onBeforeRendering = function() {
		if (this._resizeListenerId) {
			ResizeHandler.deregister(this._resizeListenerId);
			this._resizeListenerId = null;
		}
		this._rendered = false;
	};

	DockManager.prototype.onAfterRendering = function() {
		var domObj = document.getElementById(this.getId());
		domObj.appendChild(this._elem);

		this._resizeListenerId = ResizeHandler.register(this, this._handleResize.bind(this));
		this._handleResize({
			size: {
				width: domObj.clientWidth,
				height: domObj.clientHeight
			}
		});

		this._rendered = true;
		var count = this._panes.length;
		for (var i = 0; i < count; i++) {
			this._panes[i].renderContent();
		}
	};

	DockManager.prototype._handleResize = function(event) {
		this.resize(event.size.width, event.size.height);
	};

	DockManager.prototype._setRect = function(elem, x, y, w, h) {
		elem.style.left = x + "px";
		elem.style.top = y + "px";
		if (w != null) {
			elem.style.width = w + "px";
		}
		if (h != null) {
			elem.style.height = h + "px";
		}
	};

	DockManager.prototype.getDomElement = function() {
		return this._elem;
	};

	DockManager.prototype._getBounding = function(obj, root) {
		var rect = obj.getBoundingClientRect();
		var p = {
			x: rect.left,
			y: rect.top,
			w: obj.offsetWidth,
			h: obj.offsetHeight
		};

		if (root !== undefined) {
			var r = root.getBoundingClientRect();
			p.x -= r.left;
			p.y -= r.top;
		}

		return p;
	};

	DockManager.prototype._isInside = function(bounding, x, y) {
		return (x >= bounding.x && x <= bounding.x + bounding.w && y >= bounding.y && y <= bounding.y + bounding.h);
	};

	DockManager.prototype._createDockIcon = function(id, x, y, hide) {
		var drt = document.createElement("div");
		drt.setAttribute("id", this._id + "_dockIcon_" + id);
		drt.style.position = "absolute";
		this._setRect(drt, x, y, 48, 48);
		drt.style.backgroundColor = "white";
		drt.style.border = "1px solid darkgrey";
		drt.style.opacity = 0.9;
		drt.style.cursor = "default";
		drt.style.zIndex = 100;
		drt.pointerEvents = "none";
		if (hide) {
			drt.style.display = "none";
		}
		this._dockIcons.push(drt);
		this._elem.appendChild(drt);
	};

	DockManager.prototype._showDockIconsAt = function(elem, cntr, hideTab, hideDock) {
		var p = this._getBounding(elem, this._elem);

		if (cntr) {
			var apex = { x: p.x + p.w / 2 - 24, y: p.y + p.h / 2 - 24 };

			if (apex.x < 110) {
				apex.x = 110;
			} else if (apex.x > this._elem.offsetWidth - 158) {
				apex.x = this._elem.offsetWidth - 158;
			}
			if (apex.y < 110) {
				apex.y = 110;
			} else if (apex.y > this._elem.offsetHeight - 158) {
				apex.y = this._elem.offsetHeight - 158;
			}

			this._createDockIcon("center", apex.x, apex.y, hideTab);
			this._createDockIcon("top", apex.x, apex.y - 49, hideDock);
			this._createDockIcon("right", apex.x + 49, apex.y, hideDock);
			this._createDockIcon("bottom", apex.x, apex.y + 49, hideDock);
			this._createDockIcon("left", apex.x - 49, apex.y, hideDock);
		} else {
			this._createDockIcon("root_top", p.x + p.w / 2 - 24, p.y + 8);
			this._createDockIcon("root_right", p.x + p.w - 48 - 8, p.y + p.h / 2 - 24);
			this._createDockIcon("root_bottom", p.x + p.w / 2 - 24, p.y + p.h - 48 - 8);
			this._createDockIcon("root_left", p.x + 8, p.y + p.h / 2 - 24);
		}
	};

	DockManager.prototype._showDockShadow = function(elem, dir) {
		var ds = this._dockShadow;
		if (ds == null) {
			ds = document.createElement("div");
			ds.setAttribute("id", this._id + "_dockShadow");
			ds.style.position = "absolute";
			ds.style.backgroundColor = "blue";
			ds.style.opacity = 0.3;
			ds.style.zIndex = 90;
			ds.style.cursor = "default";
			ds.pointerEvents = "none";
			this._elem.appendChild(ds);
			this._dockShadow = ds;
		}

		var p = elem ? this._getBounding(elem, this._elem) : {};
		var w = (p.w > 480) ? 240 : (p.w / 2);
		var h = (p.h > 320) ? 160 : (p.h / 2);

		switch (dir) {
		case 0: // paged
			this._setRect(ds, p.x, p.y, p.w, p.h);
			break;
		case 1:	// top
			this._setRect(ds, p.x, p.y, p.w, h);
			break;
		case 2:	// right
			this._setRect(ds, p.x + (p.w - w), p.y, w, p.h);
			break;
		case 3:	// bottom
			this._setRect(ds, p.x, p.y + p.h - h, p.w, h);
			break;
		case 4:	// left
			this._setRect(ds, p.x, p.y, w, p.h);
			break;
		default: // hide
			ds.style.visibility = "hidden";
			return;
		}

		ds.style.visibility = "visible";
	};

	DockManager.prototype._showDockIcons = function(show) {
		if (show) {
			if (this._dockIcons == null || this._dockParent != this._dockParentCurr) {
				this._showDockIcons(false);
				this._dockIcons = [];
				this._showDockIconsAt(this._elem);
				if (this._dockParent != null && this._containers.length > 1) {
					this._showDockIconsAt(this._dockParent._elem, true, !this._dockParent._movable, this._dockParent._parent == null);
				}
				this._dockParentCurr = this._dockParent;
			}
		} else if (!show && this._dockIcons != null) {
			for (var i in this._dockIcons) {
				this._elem.removeChild(this._dockIcons[i]);
			}
			this._dockIcons = null;
		}
	};

	DockManager.prototype.addDockPane = function(dp) {
		this._panes.push(dp);
		this._elem.appendChild(dp._elem);
		this._updateZIndex();
	};

	DockManager.prototype.removeDockPane = function(dp) {
		var index = this._panes.indexOf(dp);
		if (index > -1) {
			this._panes.splice(index, 1);
			this._elem.removeChild(dp._elem);
		} else {
			jQuery.sap.log.error("DockManager.removeDockPane failed, element does not exist - " + dp._id);
		}
		this._updateZIndex();
	};

	DockManager.prototype.addDockContainer = function(parent, dc, index) {
		this._containers.push(dc);

		if (parent) {
			if (parent._left != null) {
				var o;
				if (index == 0) {
					o = parent._left;
					dc._elem.style.width = o._elem.offsetWidth + "px";
					dc._elem.style.height = o._elem.offsetHeight + "px";
					parent._elem.removeChild(o._elem);
					if (parent._right) {
						parent._elem.insertBefore(dc._elem, parent._right._elem);
					} else {
						parent._elem.appendChild(dc._elem);
					}
					parent._left = dc;
					o._parent = dc;
					dc._left = o;
					dc._elem.appendChild(o._elem);
				} else if (index == 1) {
					o = parent._right;
					dc._elem.style.width = o._elem.offsetWidth + "px";
					dc._elem.style.height = o._elem.offsetHeight + "px";
					parent._elem.removeChild(o._elem);
					parent._elem.appendChild(dc._elem);
					parent._right = dc;
					o._parent = dc;
					dc._left = o;
					dc._elem.appendChild(o._elem);
				}
				parent.update();
			} else {
				parent.addChild(dc, 0);
			}
		} else {
			this._root = dc;
			this._elem.appendChild(dc._elem);
			dc.resize(this._elem.offsetWidth, this._elem.offsetHeight);
		}
	};

	DockManager.prototype.removeDockContainer = function(dc) {
		var index = this._containers.indexOf(dc);
		if (index > -1) {
			this._containers.splice(index, 1);
		} else {
			jQuery.sap.log.error("DockManager.removeDockContainer failed, element does not exist - " + dc._id);
		}
	};

	DockManager.prototype._dock = function(dp, dc, dir) {
		if (dp._parent != null) {
			this.undock(dp);
		}
		var index = 0;
		if (dir == 2 || dir == 3) {
			index = 1;
		}

		dp._parent = dc;
		if (dp._saveSize) {
			dp._saveSize();
		}
		dc.setOrientation((dir == 1 || dir == 3) ? 0 : 1);
		dc.addChild(dp, index);
	};

	DockManager.prototype.dock = function(dp, parent, dir) {
		if (dp._parent != null) {
			this.undock(dp);
		}

		if (parent == null) {
			var oldroot = this._root;
			this._elem.removeChild(oldroot._elem);
			parent = new DockContainer(this, null);
			this._dock(oldroot, parent, 1);
			this._dock(dp, parent, dir);
		} else if (dir == 0) {
			parent.addTab(dp);
		} else {
			var pp = parent._parent;
			var index = (pp._left == parent) ? 0 : 1;
			var pdc = new DockContainer(this, pp, index);

			this._dock(dp, pdc, dir);
		}
	};

	DockManager.prototype.undock = function(dp, isTab) {
		if (dp._tabParent != null) {
			dp._tabParent.removeTab(dp);
			return;
		} else if (isTab && dp._tabs.length > 0) {
			dp.removeTab(dp);
			return;
		}

		var parent = dp._parent;

		if (parent == null) {
			jQuery.sap.log.error("DockManager::undock: cannot undock a floating DockPane - " + dp._id);
			return;
		}

		if (parent._left && parent._right) {
			var orphan = null;

			if (parent._left == dp) {
				orphan = parent._right;
			} else if (parent._right == dp) {
				orphan = parent._left;
			} else {
				jQuery.sap.log.error("DockManager::undock: internal error, tree mis-match - " + this._id);
			}

			parent.removeChild(1);
			parent.removeChild(0);
			var pp = parent._parent;

			// Orphan DC/DP re-parenting
			if (pp) {
				if (pp._left == parent) {
					pp._elem.removeChild(parent._elem);
					if (pp._right) {
						pp._elem.insertBefore(orphan._elem, pp._right._elem);
					} else {
						pp._elem.appendChild(orphan._elem);
					}
					pp._left = orphan;
					orphan._parent = pp;
				} else if (pp._right == parent) {
					pp._elem.removeChild(parent._elem);
					pp._elem.appendChild(orphan._elem);
					pp._right = orphan;
					orphan._parent = pp;
				}
				pp.update();
			} else if (this._root == parent) {
				this._elem.removeChild(parent._elem);
				this._elem.appendChild(orphan._elem);
				this._root = orphan;
				orphan._parent = null;
				orphan._elem.style.left = 0;
				orphan._elem.style.top = 0;
				orphan.resize(this._elem.offsetWidth, this._elem.offsetHeight);
				orphan.update();
			}

			this.removeDockContainer(parent);

			dp._parent = null;
			this._elem.appendChild(dp._elem);
			dp._restoreSize();
			dp.update();
		}
	};

	DockManager.prototype.bringToFront = function(dp) {
		if (dp._parent == null) {
			var index = this._panes.indexOf(dp);
			if (index > -1) {
				this._panes.splice(index, 1);
				this._panes.push(dp);
				this._updateZIndex();
			}
		}
	};

	DockManager.prototype._updateZIndex = function() {
		var count = this._panes.length;
		for (var i = 0; i < count; i++) {
			this._panes[i]._elem.style.zIndex = 50 + i;
		}
	};

	DockManager.prototype._tabBoxGesture = function(dp, e) {
		// Tab box hit test for tab activation / drag unsnap
		if (dp._tabs.length > 0) {
			var tboxBounding = this._getBounding(dp._tabBox);
			if (this._isInside(tboxBounding, e.x, e.y)) {
				var count = dp._tabs.length + 1;
				var index = Math.floor((e.x - tboxBounding.x) / (dp._elem.offsetWidth - 2) * count);
				if (index > dp._tabs.length) {
					index = dp._tabs.length;
				}
				var tdp = (index == 0) ? dp : dp._tabs[index - 1];
				dp.bringTabToFront(tdp);

				this._oPane = tdp;
				this._snapX = this._ox;
				this._snapY = this._oy;
				this._snapRect = this._getBounding(dp._elem);
				return true;
			}
		}

		return false;
	};

	// --------------------- Gesture handling ---------------------------
	DockManager.prototype.beginGesture = function(event) {
		var e = event; // {n : event.button == 0 ? 1 : 0, x: event.clientX, y: event.clientY};
		if (e.n == 1 && !this._gesture) {
			this._ox = e.x;
			this._oy = e.y;
			this._oIsTab = false;

			if (this._isInside(this._getBounding(this._elem), e.x, e.y)) {
				this._dockParent = null;
				var i,
					dp;
				for (i = this._panes.length - 1; i >= 0; i--) {
					dp = this._panes[i];
					if (dp._parent != null && this._isInside(this._getBounding(dp._elem), e.x, e.y)) {
						this._dockParent = dp;
						break;
					}
				}

				var anyHit = false;

				for (i = this._panes.length - 1; i >= 0; i--) {
					dp = this._panes[i];
					if (dp._parent == null && dp._movable) {
						// Floating pane hit test for bring to front
						var bounding = this._getBounding(dp._elem);
						if (this._isInside(bounding, e.x, e.y)) {
							this.bringToFront(dp);
							// Border hit test for resize start
							var border = { x: bounding.x + 8, y: bounding.y + 8, w: bounding.w - 16, h: bounding.h - 16 };
							if (!this._isInside(border, e.x, e.y)) {
								this._oResize = dp;
								if (e.x <= border.x) {
									if (e.y <= border.y) {
										this._oResizeDir = 5;
									} else if (e.y >= border.y + border.h) {
										this._oResizeDir = 8;
									} else {
										this._oResizeDir = 4;
									}
								} else if (e.x >= border.x + border.w) {
									if (e.y <= border.y) {
										this._oResizeDir = 6;
									} else if (e.y >= border.y + border.h) {
										this._oResizeDir = 7;
									} else {
										this._oResizeDir = 2;
									}
								} else if (e.y <= border.y) {
									this._oResizeDir = 1;
								} else if (e.y >= border.y + border.h) {
									this._oResizeDir = 3;
								} else {
									this._oResizeDir = 0;
								}

								anyHit = true;
								break;
							}

							// Title hit test for drag start
							if (this._isInside(this._getBounding(dp._title), e.x, e.y)) {
								if (this._isInside(this._getBounding(dp._btnClose), e.x, e.y)) {
									anyHit = true;
									dp.close();
								} else {
									anyHit = true;
									this._oPane = dp;
									this._showDockIcons(true);
								}
								break;
							}

							this._oIsTab = this._tabBoxGesture(dp, e);
							if (this._oIsTab) {
								anyHit = true;
							}

							break;
						}
					}
				}

				if (!anyHit) {
					for (i = 0; i < this._containers.length; i++) {
						var dc = this._containers[i];
						// Splitter bar hit test for drag resize
						if (dc._right != null && this._isInside(this._getBounding(dc._splitter), e.x, e.y)) {
							this._oContainer = dc;
							this._oContainer._splitter.style.opacity = 0.3;
							this._snapX = this._ox;
							this._snapY = this._oy;
							anyHit = true;
							break;
						}
					}
				}

				if (!anyHit) {
					for (i = this._panes.length - 1; i >= 0; i--) {
						dp = this._panes[i];
						// Title hit test for drag unsnap
						if (dp._parent != null && dp._movable && this._isInside(this._getBounding(dp._title), e.x, e.y)) {
							if (this._isInside(this._getBounding(dp._btnClose), e.x, e.y)) {
								dp.close();
							} else {
								this._oPane = dp;
								this._snapX = this._ox;
								this._snapY = this._oy;
								this._snapRect = this._getBounding(dp._elem);
							}
							anyHit = true;
							break;
						}

						this._oIsTab = this._tabBoxGesture(dp, e);
						if (this._oIsTab) {
							anyHit = true;
							break;
						}
					}
				}

				event.handled = anyHit;
				this._gesture = anyHit;
			}
		}
	};

	DockManager.prototype.move = function(event) {
		var e = event; // {n : event.button == 0 ? 1 : 0, x: event.clientX, y: event.clientY};
		if (e.n == 1 && this._gesture) {
			var dx = e.x - this._ox;
			var dy = e.y - this._oy;
			this._ox = e.x;
			this._oy = e.y;

			var dp,
				x,
				y;
			// Resize border areas
			if (this._oResize) {
				dp = this._oResize;
				var od = this._oResizeDir;
				x = dp._elem.offsetLeft;
				y = dp._elem.offsetTop;
				var w = dp._elem.offsetWidth;
				var h = dp._elem.offsetHeight;
				var mw = dp.getMinimumWidth();
				var mh = dp.getMinimumHeight();

				switch (od) {
					case 1:
						if (h - dy >= mh) {
							dp._elem.style.top = (y + dy) + "px";
							dp.resize(w, h - dy);
						}
						break;
					case 2:
						if (w + dx >= mw) {
							dp.resize(w + dx, h);
						}
						break;
					case 3:
						if (h + dy >= mh) {
							dp.resize(w, h + dy);
						}
						break;
					case 4:
						if (w - dx >= mw) {
							dp._elem.style.left = (x + dx) + "px";
							dp.resize(w - dx, h);
						}
						break;
					case 5:
						if (w - dx >= mw && h - dy >= mh) {
							dp._elem.style.top = (y + dy) + "px";
							dp._elem.style.left = (x + dx) + "px";
							dp.resize(w - dx, h - dy);
						} else if (w - dx > mw) {
							dp._elem.style.left = (x + dx) + "px";
							dp.resize(w - dx, h);
						} else if (h - dy > mh) {
							dp._elem.style.top = (y + dy) + "px";
							dp.resize(w, h - dy);
						}
						break;
					case 6:
						if (w + dx >= mw && h - dy >= mh) {
							dp._elem.style.top = (y + dy) + "px";
							dp.resize(w + dx, h - dy);
						} else if (w + dx >= mw) {
							dp.resize(w + dx, h);
						} else if (h - dy >= mh) {
							dp._elem.style.top = (y + dy) + "px";
							dp.resize(w, h - dy);
						}
						break;
					case 7:
						if (w + dx >= mw && h + dy >= mh) {
							dp.resize(w + dx, h + dy);
						} else if (w + dx >= mw) {
							dp.resize(w + dx, h);
						} else if (h + dy >= mh) {
							dp.resize(w, h + dy);
						}
						break;
					case 8:
						if (w - dx >= mw && h + dy >= mh) {
							dp._elem.style.left = (x + dx) + "px";
							dp.resize(w - dx, h + dy);
						} else if (w - dx >= mw) {
							dp._elem.style.left = (x + dx) + "px";
							dp.resize(w - dx, h);
						} else if (h + dy >= mh) {
							dp.resize(w, h + dy);
						}
						break;
					default:
						break;
				}
				return;
			}

			// Dock icon parent determination
			this._dockParent = null;

			var i;
			for (i = this._panes.length - 1; i >= 0; i--) {
				dp = this._panes[i];
				if (dp._parent != null && dp != this._oPane && this._isInside(this._getBounding(dp._elem), e.x, e.y)) {
					this._dockParent = dp;
					break;
				}
			}
			if (this._dockIcons != null) {
				this._showDockIcons(true);
			}

			dp = this._oPane;
			if (dp) {
				if (dp._parent == null && dp._tabParent == null && !(this._oIsTab && dp._tabs.length > 0)) {
					// Floating pane move
					x = dp._elem.offsetLeft + dx;
					y = dp._elem.offsetTop + dy;
					dp._elem.style.left = x + "px";
					dp._elem.style.top = y + "px";
				} else if (Math.abs(this._snapX - e.x) > 16 || Math.abs(this._snapY - e.y) > 16) {
					// Undock from container / tab
					var snapBottom = (dp._tabParent != null || this._oIsTab);
					this.undock(dp, this._oIsTab);
					var pmBounding = this._getBounding(this._elem);
					var nx = this._snapRect.x - (this._snapX - e.x) - 16 - pmBounding.x;
					var ny = this._snapRect.y - (this._snapY - e.y) - 16 - pmBounding.y;
					var offx = this._snapRect.x + this._snapRect.w / 2 - e.x;
					dp._elem.style.left = (nx + (this._snapRect.w - dp._elem.offsetWidth) / 2 - offx) + "px";
					if (snapBottom) {
						dp._elem.style.top = (ny + this._snapRect.h - 24) + "px";
					} else {
						dp._elem.style.top = ny + "px";
					}
					this.bringToFront(dp);
					this._showDockIcons(true);
				}
			}

			// Container resize
			var dc = this._oContainer;
			if (dc) {
				x = dc.getSplitterPosition();
				if (dc.getOrientation() == 0) {
					x += dy;
				} else {
					x += dx;
				}
				dc.setSplitterPosition(x);
			}

			// Dock shadow display
			this._oParent = null;
			this._oDir = -1;
			if (this._dockIcons != null) {
				var bselem = null;
				var bsdir = -1;

				for (i = 0; i < this._dockIcons.length; i++) {
					var di = this._dockIcons[i];
					var bound = this._getBounding(di);

					if (this._isInside(bound, e.x, e.y)) {
						if (i < 4) {
							bselem = this._elem;
							bsdir = i + 1;
							this._oParent = null;
							this._oDir = bsdir;
						} else if (i >= 4 && this._dockParent != null) {
							bselem = this._dockParent._elem;
							bsdir = i - 4;
							this._oParent = this._dockParent;
							this._oDir = bsdir;
						}
						break;
					}
				}

				this._showDockShadow(bselem, bsdir);
			} else {
				this._showDockShadow(null, -1);
			}

			event.handled = true;
		}
	};

	DockManager.prototype.endGesture = function(event) {
		// Dock gesture end
		if (this._dockIcons != null && this._oPane != null && this._oDir > -1) {
			this.dock(this._oPane, this._oParent, this._oDir);
			event.handled = true;
		}

		// Container resize end
		if (this._oContainer != null) {
			this._oContainer._splitter.style.opacity = 0;
			event.handled = true;
		}

		var target = this._oResize ? this._oResize : this._oPane;
		if (target) {
			var elem = target._elem;
			if (elem.offsetTop < -8) {
				elem.style.top = "-8px";
			} else if (elem.offsetTop > this._elem.offsetHeight - 8) {
				elem.style.top = (this._elem.offsetHeight - 8) + "px";
			}
			if (elem.offsetLeft + elem.offsetWidth < 32) {
				elem.style.left = (-elem.offsetWidth + 32) + "px";
			} else if (elem.offsetLeft > this._elem.offsetWidth - 32) {
				elem.style.left = (this._elem.offsetWidth - 32) + "px";
			}
			event.handled = true;
		}

		this._oContainer = null;
		this._oPane = null;
		this._oParent = null;
		this._oDir = -1;
		this._showDockIcons(false);
		this._showDockShadow(this._elem, -1);
		this._gesture = false;
		this._oResize = null;
	};

	DockManager.prototype.click = function(event) {

	};

	DockManager.prototype.doubleClick = function(event) {

	};

	DockManager.prototype.contextMenu = function(event) {

	};

	DockManager.prototype.getViewport = function() {
		return this;
	};

	DockManager.prototype.getId = function() {
		return this._id;
	};

	DockManager.prototype.resize = function(w, h) {
		if (this._root) {
			this._root.resize(w, h);
		}
	};

	return DockManager;
}, true);
