sap.ui.define([
	"jquery.sap.global", "./library", "sap/ui/core/Control"
], function(jQuery, library, Control) {
	"use strict";

	var DockContainer = Control.extend("sap.ui.vk.DockContainer", {
		metadata: {
			library: "sap.ui.vk",
			publicMethods: [
				"getMinimumWidth",
				"getMinimumHeight",
				"setOrientation",
				"getOrientation",
				"removeChild",
				"addChild",
				"resize",
				"getSplitterPosition",
				"setSplitterPosition",
				"update"
			],

			properties: {
			},

			events: {
				dock: {
					parameters: {
						pane: {
							type: "object"
						}
					}
				},

			undock: {
					parameters: {
						pane: {
							type: "object"
						}
					}
				}
			}
		},

		constructor: function(dm, parent, index) {
			if (typeof DockContainer._counter == "undefined") {
				DockContainer._counter = 0;
			}
			this._id = "DockContainer_" + DockContainer._counter;
			DockContainer._counter++;

			var x = 0, y = 0, w = dm._elem.offsetWidth, h = dm._elem.offsetHeight;

			if (parent) {
				w = parent._elem.offsetWidth;
				h = parent._elem.offsetHeight;
			}

			var elem = document.createElement("div");
			elem.setAttribute("id", this._id);
			elem.style.position = "absolute";
			elem.style.left = x + "px";
			elem.style.top = y + "px";
			elem.style.width = w + "px";
			elem.style.height = h + "px";
			elem.style.backgroundColor = "blue";
			elem.style.zIndex = 30;

			var splitter = document.createElement("div");
			splitter.setAttribute("id", this._id + "_splitter");
			splitter.style.position = "absolute";
			splitter.style.opacity = 0;
			splitter.style.backgroundColor = "blue";
			splitter.style.zIndex = 60;
			splitter.style.visibility = "hidden";

			this._elem = elem;
			this._splitter = splitter;
			this._manager = dm;
			this._parent = parent;
			this._left = null;
			this._right = null;
			this._dir = 0;	// 0: Vertical, 1: Horizontal

			this._elem.appendChild(this._splitter);

			dm.addDockContainer(parent, this, index);
		}
	});

	DockContainer.prototype._setRect = function(elem, x, y, w, h) {
		elem.style.left = x + "px";
		elem.style.top = y + "px";
		if (w != null) {
			elem.style.width = w + "px";
		}
		if (h != null) {
			elem.style.height = h + "px";
		}
	};

	DockContainer.prototype.getMinimumWidth = function() {
		var w = 0;
		if (this._left != null) {
			w = this._left.getMinimumWidth();
		}
		if (this._right != null) {
			var w2 = this._right.getMinimumWidth();
			if (this._dir == 0) {
				if (w > w2) {
					w = w2;
				}
			} else {
				w += w2;
			}
		}
		return w;
	};

	DockContainer.prototype.getMinimumHeight = function() {
		var h = 0;
		if (this._left != null) {
			h = this._left.getMinimumHeight();
		}
		if (this._right != null) {
			var h2 = this._right.getMinimumHeight();
			if (this._dir == 1) {
				if (h > h2) {
					h = h2;
				}
			} else {
				h += h2;
			}
		}
		return h;
	};

	DockContainer.prototype.setOrientation = function(dir) {
		this._dir = dir;
		this.update();
	};

	DockContainer.prototype.getOrientation = function() {
		return this._dir;
	};

	DockContainer.prototype.removeChild = function(index) {
		if (index == 1 && this._right != null) {
			this._elem.removeChild(this._right._elem);
			this._right = null;
		} else if (index == 0) {
			if (this._right != null) {
				this._elem.removeChild(this._left._elem);
				this._left = this._right;
				this._right = null;
			} else {
				this._elem.removeChild(this._left._elem);
				this._right = null;
			}
		}
		this.update();
	};

	DockContainer.prototype.addChild = function(ch, index) {
		if (this._left == null) {
			index = 0;
		}

		if (index == 0) {
			if (this._left != null) {
				this._right = this._left;
			}
			this._left = ch;
		} else if (index == 1) {
			this._right = ch;
		} else {
			// jQuery.sap.log.error("DockContainer::addChild: invalid index - " + index);
			return;
		}

		ch._parent = this;
		ch.update();
		this._elem.appendChild(ch._elem);
		this.update();
	};

	DockContainer.prototype.resize = function(w, h, spp) {
		this._elem.style.width = w + "px";
		this._elem.style.height = h + "px";

		if (this._left != null && this._right != null) {
			/*
			 * TO DO:
			 * fix naive resize algorithm
			 */
			var oleft,
				oright,
				mleft,
				mright,
				nleft,
				nright;

			if (this._dir == 0) {
				oleft = this._left._elem.offsetHeight;
				oright = this._right._elem.offsetHeight;
				mleft = this._left.getMinimumHeight();
				mright = this._right.getMinimumHeight();
				nleft = (spp != null) ? spp : h * oleft / (oleft + oright);
				if (nleft < mleft) {
					nleft = mleft;
				}
				nright = h - nleft;
				if (nright < mright) {
					nright = mright;
					nleft = h - nright;
				}

				this._left.resize(w, nleft);
				this._right.resize(w, nright);
				this._setRect(this._left._elem, 0, 0);
				this._setRect(this._right._elem, 0, nleft);
				this._setRect(this._splitter, 0, nleft - 6, w, 12);
				this._splitter.style.cursor = "ns-resize";
			} else {
				oleft = this._left._elem.offsetWidth;
				oright = this._right._elem.offsetWidth;
				mleft = this._left.getMinimumWidth();
				mright = this._right.getMinimumWidth();
				nleft = (spp != null) ? spp : w * oleft / (oleft + oright);
				if (nleft < mleft) {
					nleft = mleft;
				}
				nright = w - nleft;
				if (nright < mright) {
					nright = mright;
					nleft = w - nright;
				}

				this._left.resize(nleft, h);
				this._right.resize(nright, h);
				this._setRect(this._left._elem, 0, 0);
				this._setRect(this._right._elem, nleft, 0);
				this._setRect(this._splitter, nleft - 6, 0, 12, w);
				this._splitter.style.cursor = "ew-resize";
			}

			this._splitter.style.visibility = "visible";
		} else if (this._left != null) {
			this._left.resize(w, h);
			this._left._elem.style.left = 0;
			this._left._elem.style.top = 0;
			this._splitter.style.visibility = "hidden";
		} else {
			this._splitter.style.visibility = "hidden";
		}
	};

	DockContainer.prototype.getSplitterPosition = function() {
		return (this._dir == 0) ? this._splitter.offsetTop + 6 : this._splitter.offsetLeft + 6;
	};

	DockContainer.prototype.setSplitterPosition = function(p) {
		this.resize(this._elem.offsetWidth, this._elem.offsetHeight, p);
	};

	DockContainer.prototype.update = function() {
		this.resize(this._elem.offsetWidth, this._elem.offsetHeight);
	};

	return DockContainer;
}, true);
