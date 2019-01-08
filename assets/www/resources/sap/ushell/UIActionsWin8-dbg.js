/*global jQuery*/
sap.ui.define(function() {
	"use strict";

    function noop() {}

    var UIActionsWin8 = function () {
    };
    UIActionsWin8.prototype = {
        init: function (cfg) {
            this.cfg = cfg;
            this.type = this.cfg.type;
            this.wrapper = jQuery(cfg.wrapperSelector).get(0);
            this.container = jQuery(cfg.containerSelector).get(0);
            this.dragAndScrollCallback = cfg.dragAndScrollCallback || noop;
            this.dragAndScrollDuration = 100;
            this.dragCallback = cfg.dragCallback || noop;
            this.draggableSelector = cfg.draggableSelector;
            this.endCallback = typeof cfg.endCallback === 'function' ? cfg.endCallback : noop;
            this.onBeforeCreateClone = cfg.onBeforeCreateClone || noop;
            this.placeHolderClass = cfg.placeHolderClass || "";
            this.cloneClass = cfg.cloneClass || "";
            this.$root = jQuery(cfg.rootSelector);
            this.startCallback = typeof cfg.startCallback === 'function' ? cfg.startCallback : noop;
            this.onDragStartUIHandler = typeof cfg.onDragStartUIHandler === 'function' ? cfg.onDragStartUIHandler : noop;
            this.onDragEndUIHandler = typeof cfg.onDragEndUIHandler === 'function' ? cfg.onDragEndUIHandler : noop;
            this._publishAsync = typeof cfg._publishAsync === 'function' ? cfg._publishAsync : noop;
        },
        enable: function () {
            if (this.enabled) {
                return this;
            }
            this.enabled = true;
            this.$root.
                on('dragstart', this.draggableSelector, this, this.dragStartHandler).
                on('dragend', this.draggableSelector, this, this.dragEndHandler);
            return this;
        },
        disable: function disable() {
            this.enabled = false;
            this.$root.
                off('dragstart', this.draggableSelector).
                off('dragend', this.draggableSelector);
            return this;
        },
        dragLeaveHandler: function (e) {
            var containerTransform = window.getComputedStyle(e.data.container).transform;
            e.data.container.style.transform = containerTransform;
            e.data.container.style.transition = '';

            var transformY;
            var transformParamsArr = containerTransform.split(",");
            if (containerTransform.substr(0, 8) == "matrix3d") {
                transformY = parseInt(transformParamsArr[13], 10);
            } else if (containerTransform.substr(0, 6) == "matrix") {
                transformY = parseInt(transformParamsArr[5], 10);
            }
            if (isNaN(transformY)) {
                return;
            }
            e.data.container.style.transform = "none";
            e.data.wrapper.scrollTop += ~transformY + 1;

        },
        dragEnterScrollHandler: function dragEnterScrollHandler(evt) {
            if (evt.target == evt.data.$bottomScroller.get(0)) {
                evt.data.startScroll("down");
            }
            if (evt.target == evt.data.$topScroller.get(0)) {
                evt.data.startScroll("up");
            }
        },
        startScroll: function(direction) {
            var leftToScroll;
            if (direction == "up") {
                leftToScroll = this.wrapper.scrollTop;
                if (leftToScroll <= 0) {
                    return;
                }

            } else {
                leftToScroll = this.wrapper.scrollHeight - this.wrapper.offsetHeight - this.wrapper.scrollTop;
                if (leftToScroll <= 0) {
                    return;
                }
            }
            var scrollTime = leftToScroll * 3;
            var translateY = (direction == "up") ? leftToScroll : ~leftToScroll + 1;
            this.container.style.transition = 'transform ' + scrollTime + 'ms linear';
            this.container.style.transform = 'translate(0px, ' + translateY + 'px) scale(1) translateZ(0px)';
        },
        initScrollRegions: function () {
            this.$topScroller = jQuery("<div class='UiActionsTopScroller' style='position:absolute; top: 0; height: 70px; left:0; right:0;'></div>");
            this.$bottomScroller = jQuery("<div class='UiActionsBottomScroller' style='position:absolute; bottom: 0; height: 70px; left:0; right:0;'></div>");
            jQuery(document.body).append(this.$topScroller).append(this.$bottomScroller);
            this.$topScroller.add(this.$bottomScroller).on('dragenter', this, this.dragEnterScrollHandler).on('dragleave', this, this.dragLeaveHandler);
        },
        removeScrollRegions: function () {
            jQuery('.UiActionsTopScroller, .UiActionsBottomScroller').remove();
        }
    };


    function GroupsDragAndDrop (cfg) {
        this.init(cfg);
    }
    GroupsDragAndDrop.prototype = new UIActionsWin8();
    jQuery.extend(GroupsDragAndDrop.prototype, {
        dragOverTimeout: null,
        dragStartHandler: function (evt) {
            var _that = evt.data;

            if (sap.ui.Device.system.phone) {
                _that.$root.find(".sapUshellTilesContainer-sortable").addClass("sapUshellTileContainerRemoveContent");
                _that.$root.find(".sapUshellTileContainerBeforeContent").addClass("sapUshellTileContainerRemoveContent");
                _that.$root.find(".sapUshellContainerHeaderActions").addClass("sapUshellTileContainerHidden");
            } else {
                _that.$root.find(".sapUshellTileContainerBeforeContent").addClass("sapUshellTileContainerHidden");
            }

            _that.$originalElement = jQuery(evt.target).closest(".sapUshellDashboardGroupsContainerItem");
            _that.originalIndex = _that.$originalElement.index();
            _that.$element = _that.$originalElement.clone().css("display", "none").addClass('sapUshellDashboardGroupsContainerItem-placeholder');
            _that.$element.insertAfter(_that.$originalElement);
            _that.$originalElement.addClass("sapUshellDashboardGroupsContainerItem-orignal");
            _that.$root.find('.sapUshellTileContainerAfterContent').last().addClass("sapUshellTileContainerRemoveContent");

            _that.initScrollRegions();

            setTimeout(function () {
                _that.$originalElement.css("display", "none");
                _that.$element.css("display", "block");
            }, 0);
            _that.$root.on('dragover', ".sapUshellDashboardGroupsContainerItem:not(.sapUshellDisableDragAndDrop)", _that, _that.dragOverHandler);
        },
        dragEndHandler: function (evt) {
            var _that = evt.data;
            _that.removeScrollRegions();
            _that.$root.off('dragover', ".sapUshellDashboardGroupsContainerItem:not(.sapUshellDisableDragAndDrop)");

            _that.$root.find(".sapUshellTilesContainer-sortable").removeClass("sapUshellTileContainerRemoveContent");
            _that.$root.find(".sapUshellTileContainerBeforeContent").removeClass("sapUshellTileContainerRemoveContent");
            _that.$root.find(".sapUshellContainerHeaderActions").removeClass("sapUshellTileContainerHidden");
            _that.$root.find(".sapUshellTileContainerBeforeContent").removeClass("sapUshellTileContainerHidden");


            _that.$element.replaceWith(_that.$originalElement);
            var nNewIndex = _that.$originalElement.index();
            _that.$originalElement.css('display', 'block').removeClass("sapUshellDashboardGroupsContainerItem-orignal");
            var oBus = sap.ui.getCore().getEventBus(),
                firstChildId = _that.$originalElement.children().eq(0).attr("id"),
                oGroup = sap.ui.getCore().byId(firstChildId),
                oDashboardGroups = sap.ui.getCore().byId("dashboardGroups"),
                oData = {group : oGroup, groupChanged : false, focus : false};

            oDashboardGroups.removeAggregation('groups', oGroup, true);
            oDashboardGroups.insertAggregation('groups', oGroup, nNewIndex, true);

            _that._publishAsync("launchpad", "moveGroup", {
                fromIndex  : _that.originalIndex,
                toIndex    : nNewIndex
            });

            window.setTimeout(jQuery.proxy(oBus.publish, oBus, "launchpad", "scrollToGroup", oData), 1);

        },
        dragOverHandler: function dragOverHandler(evt) {
            if (evt.data.dragOverTimeout) {
                return;
            }
            evt.data.dragOverTimeout = setTimeout(function () {
                evt.data.dragOverTimeout = null;
                var overElement = evt.currentTarget;
                if (evt.data.$element.get(0) === overElement) {
                    return;
                }
                var overAboveMiddle = evt.data.isOverAboveMiddle(overElement, evt.originalEvent.pageY);
                if (overElement === evt.data.overElement && overAboveMiddle === evt.data.overAboveMiddle) {
                    return;
                }
                evt.data.overElement = overElement;
                evt.data.overAboveMiddle = overAboveMiddle;
                evt.data.movePlaceholder(evt.data.$element, overElement, overAboveMiddle);
            },50);
        },
        isOverAboveMiddle: function (element, posY) {
            var movedElementPositionAboveMiddle = true;
            var rect = element.getBoundingClientRect();
            if (rect.top + rect.height / 2 < posY){
                movedElementPositionAboveMiddle = false;
            }
            return movedElementPositionAboveMiddle;
        },
        movePlaceholder: function (placeholder, element, insertBefore) {
            if (insertBefore) {
                jQuery(placeholder).insertBefore(jQuery(element));
            } else {
                jQuery(placeholder).insertAfter(jQuery(element));
            }
        }
    });

    function TilesDragAndDrop (cfg) {
        this.init(cfg);
    }
    TilesDragAndDrop.prototype = new UIActionsWin8();
    jQuery.extend(TilesDragAndDrop.prototype, {
        dragOverTimeout: null,
        dragStartHandler: function dragStartHandler(evt) {
            var _that = evt.data;

             if (!evt.target.id) {
               evt.target = jQuery(evt.target).closest(".sapUshellTile")[0];
             }
            _that.element = evt.target;

            _that.$root.
                 on('dragenter', _that.draggableSelector + ", .sapUshellTileContainer", _that, _that.dragEnterTileHandler);

            var id = evt.target.getAttribute("id");

            _that.oTile = sap.ui.getCore().byId(id);

            _that.oTile.addStyleClass(_that.cloneClass);

            if (_that.oTile.getParent().getIsGroupLocked() && _that.oTile.getParent().getDefaultGroup()) {
                _that.onDragStartUIHandler();
                evt.preventDefault();
                var mouseUpHandler = function mouseUpHandler() {
                    _that.onDragEndUIHandler();
                    document.removeEventListener("mouseup", mouseUpHandler);
                };
                document.addEventListener("mouseup", mouseUpHandler);
                return false;
            }

            _that.initScrollRegions();


            var $cloned = jQuery(evt.target).clone();
            $cloned.addClass(_that.placeHolderClass).css('z-index', "-1");
            var cloned = $cloned.get(0);
            _that.$cloned = $cloned;
            jQuery(evt.target).after($cloned);
            _that.getDomRefOriginal = _that.oTile.getDomRef;
            _that.oTile.getDomRef = function () {
                return cloned;
            };

            _that.startCallback(evt, _that.element);
            _that.onDragStartUIHandler();
            _that.dragCallback(evt, _that.element);
            setTimeout(function () {
                // add class with delay, otherwise it affects clone as well
                jQuery(evt.target).css("visibility", "hidden");
            }, 0);
        },
        dragEndHandler: function dragEndHandler(evt) {
            var _that = evt.data;
            _that.$root.off('dragenter', _that.draggableSelector + ", .sapUshellTileContainer", _that.dragEnterTileHandler);

            _that.removeScrollRegions();
            _that.oTile.getDomRef = _that.getDomRefOriginal;

            _that.oTile.removeStyleClass(_that.cloneClass);

            jQuery(_that.element).css('visibility', 'visible');
            _that.$cloned.remove();

            _that.endCallback(evt, _that.element);
            _that.onDragEndUIHandler();
            _that.element = null;
        },
        dragEnterTileHandler: function dragEnterTileHandler(evt){
            evt.preventDefault();
            if(this.tileDragEnterTimeout) {
              window.clearTimeout(this.tileDragEnterTimeout);
            }
            this.tileDragEnterTimeout = setTimeout(function () {
                evt.data.dragOverTimeout = null;
                evt.data.overElement = this;
                evt.data.dragAndScrollCallback({
                    moveX: evt.originalEvent.pageX,
                    moveY: evt.originalEvent.pageY
                });
            }, 50);
        }
    });

    function LinksDragAndDrop (cfg) {
        this.init(cfg);
    }
    LinksDragAndDrop.prototype = new UIActionsWin8();
    jQuery.extend(LinksDragAndDrop.prototype, {
        dragOverTimeout: null,
        dragStartHandler: function dragStartHandler(evt) {
            var _that = evt.data;
             if (!evt.target.id) {
               evt.target = jQuery(evt.target).closest(".sapUshellLinkTile")[0];
             }
            _that.element = evt.target;
            
            _that.onBeforeCreateClone(evt, _that.element);

            _that.$root.
                on('dragenter', ".sapUshellTileContainer",_that, _that.dragEnterLinkHandler);
            var id = evt.target.getAttribute("id");

            _that.oTile = sap.ui.getCore().byId(id);

            if (_that.oTile.getParent().getIsGroupLocked() && _that.oTile.getParent().getDefaultGroup()) {
                evt.preventDefault();
                _that.onDragStartUIHandler();
                var mouseUpHandler = function mouseUpHandler() {
                    _that.onDragEndUIHandler();
                    document.removeEventListener("mouseup", mouseUpHandler);
                };
                document.addEventListener("mouseup", mouseUpHandler);
                return false;
            }
            jQuery(evt.target).addClass(_that.placeHolderClass);
            _that.initScrollRegions();
            _that.startCallback(evt, _that.element);
            _that.onDragStartUIHandler();
            _that.dragCallback(evt, _that.element);
        },
        dragEndHandler: function dragEndHandler(evt) {
            var _that = evt.data;
            _that.$root.off('dragenter', ".sapUshellTileContainer", _that.dragEnterLinkHandler);

            _that.removeScrollRegions();

            jQuery(_that.element).css('visibility', 'visible');

            _that.endCallback(evt, _that.element);
            _that.onDragEndUIHandler();
            _that.element = null;
        },
        dragEnterLinkHandler: function dragEnterLinkHandler(evt) {
            evt.preventDefault();
            if(this.linkDragEnterTimeout) {
              window.clearTimeout(this.linkDragEnterTimeout);
            }
            this.linkDragEnterTimeout = setTimeout(function () {
                evt.data.dragOverTimeout = null;
                evt.data.overElement = this;
                evt.data.dragAndScrollCallback({
                    moveX: evt.originalEvent.pageX,
                    moveY: evt.originalEvent.pageY
                });
            }, 10);
        }
    });

    var UIActionsWin8Factory = {
        getInstance: function (cfg) {
            switch (cfg.type) {
              case "groups":
                return new GroupsDragAndDrop(cfg);
              case "links":
                return new LinksDragAndDrop(cfg);
              default://tiles
                return new TilesDragAndDrop(cfg);
            }
        }
    };



    // Export
    return UIActionsWin8Factory;

}, /* bExport= */ true);
