/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.ViewPortContainer.
sap.ui.define([
		'sap/ui/core/Control',
		'sap/ui/core/theming/Parameters',
		'sap/ushell/library',
		'sap/ushell/resources'
	], function(Control, Parameters, library, resources) {
	"use strict";

/**
 * Constructor for a new ui/launchpad/ViewPortContainer.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * ViewPort container
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.ViewPortContainer
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var ViewPortContainer = Control.extend("sap.ushell.ui.launchpad.ViewPortContainer", /** @lends sap.ushell.ui.launchpad.ViewPortContainer.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 */
		height : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '100%'},

		/**
		 */
		width : {type : "sap.ui.core.CSSSize", group : "Dimension", defaultValue : '100%'},

		/**
		 */
		visible : {type : "boolean", group : "Appearance", defaultValue : true},

		/**
		 */
		defaultState : {type : "sap.ushell.ui.launchpad.ViewPortState", group : "Appearance", defaultValue : sap.ushell.ui.launchpad.ViewPortState.Center}
	},
	aggregations : {

		/**
		 */
		leftViewPort : {type : "sap.ui.core.Control", multiple : true, singularName : "leftViewPort"},

		/**
		 */
		centerViewPort : {type : "sap.ui.core.Control", multiple : true, singularName : "centerViewPort"},

		/**
		 */
		rightViewPort : {type : "sap.ui.core.Control", multiple : true, singularName : "rightViewPort"}
	},
	associations : {

		/**
		 */
		initialCenterViewPort : {type : "sap.ui.core.Control", multiple : false},

		/**
		 */
		initialRightViewPort : {type : "sap.ui.core.Control", multiple : false},

		/**
		 */
		initialLeftViewPort : {type : "sap.ui.core.Control", multiple : false}
	},
	events : {

		/**
		 */
		navigate : {},

		/**
		 */
		afterSwitchState : {
			parameters : {

				/**
				 */
				from : {type : "sap.ui.core.Control"},

				/**
				 */
				to : {type : "sap.ui.core.Control"}
			}
		},

		/**
		 */
		afterSwitchStateAnimationFinished : {
			parameters : {

				/**
				 */
				from : {type : "sap.ui.core.Control"},

				/**
				 */
				to : {type : "sap.ui.core.Control"}
			}
		},

		/**
		 */
		afterNavigate : {
			parameters : {

				/**
				 */
				from : {type : "sap.ui.core.Control"},

				/**
				 */
				to : {type : "sap.ui.core.Control"}
			}
		}
	}
}});

/**
 * @name sap.ushell.ui.launchpad.ViewPortContainer
 *
 * @private
 */

    /*global jQuery, sap, window*/
    ViewPortContainer.prototype.init = function () {
        this.bShiftCenterTransition = true;
        this.bShiftCenterTransitionEnabled = false;
        this.sCurrentState = "Center";
        var oConfiguration = sap.ui.getCore().getConfiguration();
        this.bIsRTL = !jQuery.isEmptyObject(oConfiguration) && oConfiguration.getRTL ? oConfiguration.getRTL() : false;

        this._oViewPortsNavigationHistory = {
            leftViewPort: {
                visitedControls: [],
                indexOfCurrentlyDisplayedControl: null
            },
            centerViewPort: {
                visitedControls: [],
                indexOfCurrentlyDisplayedControl: null
            },
            rightViewPort: {
                visitedControls: [],
                indexOfCurrentlyDisplayedControl: null
            }
        };

        this._states = {
            Left: {
                translateX: '',
                visibleViewPortsData: [
                    {
                        viewPortId: 'leftViewPort',
                        className: "leftClass",
                        isActive: true
                    }
                ]
            },
            Center: {
                translateX: '',
                visibleViewPortsData: [
                    {
                        viewPortId: 'centerViewPort',
                        className: "centerClass",
                        isActive: true
                    }
                ]
            },
            Right: {
                translateX: '',
                visibleViewPortsData: [
                    {
                        viewPortId: 'rightViewPort',
                        className: "rightClass",
                        isActive: true
                    }
                ]
            },
            LeftCenter: {
                translateX: '',
                visibleViewPortsData: [
                    {
                        viewPortId: 'leftViewPort',
                        className: "front",
                        isActive: true
                    },
                    {
                        viewPortId: 'centerViewPort',
                        className: "backLeft",
                        isActive: false
                    }
                ]
            },
            CenterLeft: {
                translateX: '',
                visibleViewPortsData: [
                    {
                        viewPortId: 'centerViewPort',
                        className: "frontLeft",
                        isActive: true
                    },
                    {
                        viewPortId: 'leftViewPort',
                        className: "back",
                        isActive: false
                    }
                ]
            },
            RightCenter: {
                translateX: '',
                visibleViewPortsData: [
                    {
                        viewPortId: 'rightViewPort',
                        className: "front",
                        isActive: true
                    },
                    {
                        viewPortId: 'centerViewPort',
                        className: "backRight",
                        isActive: false
                    }
                ]
            },
            CenterRight: {
                translateX: '',
                visibleViewPortsData: [
                    {
                        viewPortId: 'centerViewPort',
                        className: "frontRight",
                        isActive: true
                    },
                    {
                        viewPortId: 'rightViewPort',
                        className: "back",
                        isActive: false
                    }
                ]
            }
        };

        sap.ui.Device.media.attachHandler(this._handleSizeChange.bind(this), null, sap.ui.Device.media.RANGESETS.SAP_STANDARD);
        sap.ui.Device.orientation.attachHandler(this._handleSizeChange, this);

        jQuery(window).bind("resize", function () {
            this._handleSizeChange();
        }.bind(this));
    };

    ViewPortContainer.prototype.removeCenterViewPort = function (oControl, bSuppressInvalidate) {
        this.removeAggregation('centerViewPort', oControl, bSuppressInvalidate);
        //Update viewPort Navigation History after removing navigation.
        this._popFromViewPortNavigationHistory('centerViewPort', oControl);
    };

    ViewPortContainer.prototype.setApplicationFullWidth = function (bFullWidth) {
        var jqApplicationContainer = jQuery("#" + this._sCurrentControlId);

        jqApplicationContainer.toggleClass("sapUShellApplicationContainerLimitedWidth", !bFullWidth);
    };

    ViewPortContainer.prototype._popFromViewPortNavigationHistory = function (sViewPortId, oControlToPop) {
        var oNavHistory = this._oViewPortsNavigationHistory[sViewPortId],
            aVisitedControls = oNavHistory ? oNavHistory.visitedControls : [],
            iIndexOfRemovedControl = aVisitedControls.indexOf(oControlToPop);

        if (aVisitedControls.length > 0) {
            oNavHistory.visitedControls = aVisitedControls.slice(iIndexOfRemovedControl + 1, oNavHistory.visitedControls.length);
            oNavHistory.indexOfCurrentlyDisplayedControl = oNavHistory.visitedControls.length - 1;
        }
    };

    ViewPortContainer.prototype.addCenterViewPort = function (oControl) {
        //Performance Debug
        jQuery.sap.measure.start("FLP:ViewPortContainer.addCenterViewPort", "addCenterViewPort","FLP");

        var bIsInCenterViewPort = this._isInCenterViewPort(oControl);

        oControl.toggleStyleClass("hidden", true);
        oControl.addStyleClass("sapUshellViewPortItemSlideFrom");
        if (!bIsInCenterViewPort) {
            this.addAggregation('centerViewPort', oControl, true);
        }
        if (this.domRef && !bIsInCenterViewPort) {
            this.getRenderer().renderViewPortPart(oControl, this.domRef, 'centerViewPort');
        }
        jQuery.sap.measure.end("FLP:ViewPortContainer.addCenterViewPort");
    };

    ViewPortContainer.prototype.addLeftViewPort = function (oControl) {
        oControl.toggleStyleClass("hidden", true);
        if (this.domRef) {
            this.getRenderer().renderViewPortPart(oControl, this.domRef, 'leftViewPort');
        }
        this.addAggregation('leftViewPort', oControl, true);
    };

    ViewPortContainer.prototype.addRightViewPort = function (oControl) {
        oControl.toggleStyleClass("hidden", true);
        if (this.domRef) {
            this.getRenderer().renderViewPortPart(oControl, this.domRef, 'rightViewPort');
        }
        this.addAggregation('rightViewPort', oControl, true);
    };

    ViewPortContainer.prototype.setInitialCenterViewPort = function (oControl) {
        var sCurrentlyDisplayedControlId = this._getCurrentlyDispalyedControl('centerViewPort'),
            bIsInCenterViewPort = this._isInCenterViewPort(oControl);

        oControl.addStyleClass("sapUshellViewPortItemSlideFrom");
        //Avoid re-rendering the viewport part if the viewport container itself hasn't been rendered
        //or the target control has beed already added previously (the control is already rendered in such case)
        if (this.domRef && !bIsInCenterViewPort) {
            this.getRenderer().renderViewPortPart(oControl, this.domRef, 'centerViewPort');
        }
        this._setCurrentlyDisplayedControl('centerViewPort', oControl);
        if (!bIsInCenterViewPort) {
            this.addAggregation('centerViewPort', oControl, true);
        }
       this.setAssociation('initialCenterViewPort', oControl, true);
        if (sCurrentlyDisplayedControlId && sCurrentlyDisplayedControlId !== oControl.getId()) {
            this.fireAfterNavigate({
                fromId: sCurrentlyDisplayedControlId,
                from: sap.ui.getCore().byId(sCurrentlyDisplayedControlId),
                to: sap.ui.getCore().byId(oControl),
                toId: oControl.getId()
            });
        }
    };

    ViewPortContainer.prototype._isInViewPort = function (sViewPortId, oControl) {
        var aViewPortControls = this.getAggregation(sViewPortId),
            bIsInViewPort = aViewPortControls ? aViewPortControls.indexOf(oControl) > -1 : false;

        return bIsInViewPort;
    };

    ViewPortContainer.prototype._isInCenterViewPort = function (oControl) {
        return this._isInViewPort('centerViewPort', oControl);
    };

    ViewPortContainer.prototype.getCurrentCenterPage = function () {
        return this._getCurrentlyDispalyedControl('centerViewPort');
    };


    ViewPortContainer.prototype.navTo = function (viewPortId, controlId, transitionName, data, oTransitionParameters) {
        //Performance Debug
        jQuery.sap.measure.start("FLP:ShellController.navTo", "navTo","FLP");

        var sCurrentlyDisplayedControlId = this._getCurrentlyDispalyedControl(viewPortId),
            aViewPortControls = this.getAggregation(viewPortId),
            bTargetControlFound = aViewPortControls.some(function (oControl, index) {
                if (oControl.getId() === controlId) {
                    return true;
                }
            });

        if (!bTargetControlFound) {
            jQuery.sap.log.error("ViewPort Container Error: Couldn't find target control");
        } else if (!sCurrentlyDisplayedControlId || sCurrentlyDisplayedControlId !== controlId) {
            var oTargetControl = sap.ui.getCore().byId(controlId);

            oTargetControl.toggleStyleClass("hidden", false);
            var fnOnTransitionFinished = function () {
                this.fireAfterNavigate({
                    toId: controlId,
                    to: controlId ? sap.ui.getCore().byId(controlId) : null,
                    fromId: sCurrentlyDisplayedControlId,
                    from: sCurrentlyDisplayedControlId ? sap.ui.getCore().byId(sCurrentlyDisplayedControlId) : null
                });
            }.bind(this);
            this._setCurrentlyDisplayedControl(viewPortId, oTargetControl, transitionName, fnOnTransitionFinished);
        }
        jQuery.sap.measure.end("FLP:ShellController.navTo");
    };

    ViewPortContainer.prototype._getCurrentlyDispalyedControl = function (sViewPortId) {
        var oNavHistory = this._oViewPortsNavigationHistory[sViewPortId];

        return oNavHistory.visitedControls[oNavHistory.indexOfCurrentlyDisplayedControl];
    };

    ViewPortContainer.prototype._setCurrentlyDisplayedControl = function (sViewPortId, oControl, transitionName, fnOnTransitionFinished) {
        //this function is called only from setInitialCenterViewPort & navTo
        //Performance Debug
        jQuery.sap.measure.start("FLP:ViewPortContainer._setCurrentlyDisplayedControl", "_setCurrentlyDisplayedControl","FLP");

        var oNavHistory = this._oViewPortsNavigationHistory[sViewPortId],
            aVisitedControls = oNavHistory.visitedControls,
            sCurrentlyDisplayedControlId = this._getCurrentlyDispalyedControl(sViewPortId),
            oCurrentlyDisplayedControl = sCurrentlyDisplayedControlId ? sap.ui.getCore().byId(sCurrentlyDisplayedControlId) : null,
            sTransitionName = (sViewPortId === 'centerViewPort' && transitionName) ? transitionName : 'show';

        aVisitedControls.push(oControl.getId());
        oNavHistory.indexOfCurrentlyDisplayedControl = jQuery.isNumeric(oNavHistory.indexOfCurrentlyDisplayedControl) ? oNavHistory.indexOfCurrentlyDisplayedControl + 1 : 0;
        this._handleViewPortTransition(sViewPortId, sTransitionName, oControl, oCurrentlyDisplayedControl, fnOnTransitionFinished);

        this._sCurrentControlId = oControl.getId();
        // this._updateTranslateXvalues();
        jQuery.sap.measure.end("FLP:ViewPortContainer._setCurrentlyDisplayedControl");
    };


    ViewPortContainer.prototype._handleViewPortTransition = function (sViewPortId, sTransitionName, oTargetControl, oCurrentlyDisplayedControl, fnOnTransitionFinished) {
        if (sViewPortId !== 'centerViewPort') {
            return;
        }
        oTargetControl.toggleStyleClass("hidden", false);
        if (oCurrentlyDisplayedControl) {
            oCurrentlyDisplayedControl.toggleStyleClass("hidden");
        }
        if (fnOnTransitionFinished) {
            fnOnTransitionFinished();
        }
    };

    ViewPortContainer.prototype.switchState = function (sStateName) {
        var fnAnimationCB = function () {
            //not sure why this function is needed
            var aggrLst,
                toAggrNames = [],
                fromAggrNames = [],
                aggrIndex,
                // aViewPortsDataBeforeSwitch = this._states[this.sCurrentState].visibleViewPortsData,
                // aViewPortsDataAfterSwitch = this._states[sStateName].visibleViewPortsData,
                // jqViewPortContainer = jQuery(this.domRef),
                that = this;

                for (aggrIndex = 0; aggrIndex < that._states[that.sCurrentState].visibleViewPortsData.length; aggrIndex++) {
                    fromAggrNames.push(that._states[that.sCurrentState].visibleViewPortsData[aggrIndex].viewPortId);
                }

                for (aggrIndex = 0; aggrIndex < that._states[sStateName].visibleViewPortsData.length; aggrIndex++) {
                    toAggrNames.push(that._states[sStateName].visibleViewPortsData[aggrIndex].viewPortId);
                }

                var ind = 0, aggrNamesInd;

                for (aggrNamesInd = 0; aggrNamesInd < fromAggrNames.length; aggrNamesInd++) {
                    aggrLst = that.getAggregation(fromAggrNames[aggrNamesInd]);
                    if (aggrLst) {
                        for (ind = 0; ind < aggrLst.length; ind++) {
                            if (aggrLst[ind].onViewStateHide) {
                                aggrLst[ind].onViewStateHide();
                            }
                        }
                    }
                }
                for (aggrNamesInd = 0; aggrNamesInd < toAggrNames.length; aggrNamesInd++) {
                    aggrLst = that.getAggregation(toAggrNames[aggrNamesInd]);

                    if (aggrLst) {
                        for (ind = 0; ind < aggrLst.length; ind++) {
                            if (aggrLst[ind].onViewStateShow) {
                                aggrLst[ind].onViewStateShow();
                            }
                        }
                    }

                }

                // aViewPortsDataAfterSwitch.forEach(function (item) {
                //     jqViewPortContainer.find('#' + item.viewPortId).addClass(item.className);
                // });
                // jQuery('#' + aViewPortsDataBeforeSwitch[0].viewPortId).removeClass("active");

            }.bind(this);


        //performance measurement start animation flow
        jQuery.sap.measure.start("FLP:switchState", "start animiation flow", "FLP1");
        switch (sStateName) {
            case "LeftCenter":
                this.meAreaShow(sStateName);
                break;
            case "Center":
                this.centerAreaShow(sStateName, fnAnimationCB);
                break;
            case "RightCenter":
                this.notificationAreaShow(sStateName);
                break;
            default:
        }

        var fnSwitchLeftToCenter = function (e) {
            //left part consist of content and padding, padding is needed to see central part through it.
            //so we need to determine if click was on left container or on empty padding space
            var contentWidth = parseInt(window.getComputedStyle(e.currentTarget).width, 10);
            if (e.pageX > contentWidth) {
                this.switchState('Center');
            }
        }.bind(this);

        var jqLeftWrapper = jQuery(this.domRef).find('.sapUshellViewPortLeft');
        if(sStateName !== 'Center')
            jqLeftWrapper.on('click', fnSwitchLeftToCenter);
        else
            jqLeftWrapper.off('click', fnSwitchLeftToCenter);

        this._handleSizeChange();
    };

    ViewPortContainer.prototype.notificationAreaShow = function (sState) {
        this._areaShow(sState, this._animateNotificationAreaShow.bind(this), this._animateMinimalNotificationAreaShow.bind(this), true);
    };
    ViewPortContainer.prototype._notificationAreaClose = function (sState) {
        this._areaShow(sState, this._animateNotificationAreaClose.bind(this), this._animateMinimalNotificationAreaClose.bind(this), false);
    };
    ViewPortContainer.prototype.meAreaShow = function (sState) {
        this._areaShow(sState, this._animateMeAreaShow.bind(this), this._animateMinimalMeAreaShow.bind(this), true);
    };
    ViewPortContainer.prototype._meAreaClose = function (sState) {
        this._areaShow(sState, this._animateMeAreaClose.bind(this), this._animateMinimalMeAreaClose.bind(this), false);
    };
    ViewPortContainer.prototype.centerAreaShow = function (sState, fnAnimationCB) {
        if (this.sCurrentState === "LeftCenter") {
            this._meAreaClose(sState);
        } else if(this.sCurrentState === "RightCenter") {
            this._notificationAreaClose(sState);
        } else {
            this._fireTransitionEnd(sState);
            if(fnAnimationCB){
                //not sure why this function is needed
                fnAnimationCB();
            };
        }
    };

    jQuery.sap.measure.end("FLP:switchState");

    ViewPortContainer.prototype._animateNotificationAreaShow = function (sState) {
        var viewPorts = this._getViewPorts(),
            transitionEndCB = function (event) {
                this._fireTransitionEnd(sState);
                this.setEnableResizeHandler(true);//currently not implemented
                //we change the duration because on screen resize the animation will be triggered
                this.switchKeyframeAnimationDuration("0ms", [viewPorts.centerViewPort, viewPorts.rightViewPort]);
                viewPorts.centerViewPort.removeEventListener("animationend", transitionEndCB);
                viewPorts.centerViewPort.addEventListener('click', this.switchState.bind(this, "Center"));
                //when transitioning between left view port to right view port directly
                if (viewPorts.leftViewPort.classList.contains("sapUshellMeAreaShow"))
                {
                    viewPorts.leftViewPort.classList.remove("sapUshellMeAreaShow");
                    viewPorts.leftViewPort.classList.remove("sapUshellMeAreaClose");
                    viewPorts.leftViewPort.classList.add("sapUshellShellHidden");
                }
            }.bind(this);

            this.toggleMeAreaScrollBar(false);
            this.switchKeyframeAnimationDuration("480ms", [viewPorts.centerViewPort, viewPorts.rightViewPort, viewPorts.leftViewPort]);
            viewPorts.centerViewPort.classList.add("sapUshellDisableScroll");
            this.setEnableResizeHandler(false);//currently not implemented
            viewPorts.centerViewPort.addEventListener("animationend", transitionEndCB, false);
            viewPorts.rightViewPort.classList.remove("sapUshellShellHidden");


            setTimeout(function() {
                if (viewPorts.leftViewPort.classList.contains("sapUshellMeAreaShow")) {
                    viewPorts.leftViewPort.classList.add("sapUshellMeAreaClose");
                    viewPorts.centerViewPort.classList.add("sapUshellCenterLeft");
                    viewPorts.centerViewPort.classList.remove("sapUshellCenterRight");
                    viewPorts.rightViewPort.classList.remove("sapUshellNotificationAreaClose");
                } else {
                    viewPorts.centerViewPort.classList.add("sapUshellSmallLeft");
                }
                viewPorts.rightViewPort.classList.add("sapUshellNotificationAreaShow");

            }, 0);
    };
    ViewPortContainer.prototype._removeAllAnimationClasses = function () {
        var viewPorts = this._getViewPorts(),
            classArray = ["sapUshellDisableScroll", "sapUshellMeAreaShow", "sapUshellMeAreaClose", "sapUshellSmallRight", "sapUshellSmallRightToLargeCenter", "sapUshellNotificationAreaClose", "sapUshellNotificationAreaShow", "sapUshellCenterRight", "sapUshellCenterLeft", "sapUshellSmallLeft", "sapUshellSmallLeftToLargeCenter"];

        for (var key in viewPorts) {
          if (viewPorts.hasOwnProperty(key)) {
              classArray.forEach(function (className) {
                 viewPorts[key].classList.remove(className);
              });
          }
        }

    };
    ViewPortContainer.prototype._animateNotificationAreaClose = function (sState) {
        var viewPorts = this._getViewPorts(),
            transitionEndCB = function(event) {
                this._fireTransitionEnd();
                this.setEnableResizeHandler(true);//currently not implemented
                this._removeAllAnimationClasses();
                viewPorts.rightViewPort.classList.add("sapUshellShellHidden");
                viewPorts.centerViewPort.removeEventListener("animationend", transitionEndCB);
                viewPorts.centerViewPort.removeEventListener('click', this.switchState.bind(this, "Center"));
            }.bind(this);
          this.switchKeyframeAnimationDuration("480ms", [viewPorts.centerViewPort, viewPorts.rightViewPort]);
          this.setEnableResizeHandler(false);//currently not implemented
          viewPorts.centerViewPort.addEventListener("animationend", transitionEndCB, false);

          setTimeout(function() {
              viewPorts.centerViewPort.classList.remove("sapUshellCenterLeft");
              viewPorts.centerViewPort.classList.remove("sapUshellCenterRight");
              viewPorts.rightViewPort.classList.add("sapUshellNotificationAreaClose");
              viewPorts.centerViewPort.classList.add("sapUshellSmallLeftToLargeCenter");
          }, 0);
    };

    ViewPortContainer.prototype._leftViewPortOnClickHandler = function (oEvent) {
        var aElements = document.elementsFromPoint(oEvent.x, oEvent.y);
        aElements.every(function (el) {
            if (el.classList.contains("sapUshellViewPortCenter")) {
                this.switchState("Center");
                return false;
            }
            return true;
        }.bind(this));
    };
    ViewPortContainer.prototype._animateMeAreaShow = function (sState) {
            var viewPorts = this._getViewPorts(),
                transitionEndCB = function (event) {
                    this._fireTransitionEnd(sState);
                    this.setEnableResizeHandler(true);
                    this.toggleMeAreaScrollBar(true);
                    //we change the duration because on screen resize the animation will be triggered
                    this.switchKeyframeAnimationDuration("0ms", [viewPorts.centerViewPort, viewPorts.leftViewPort]);
                    viewPorts.centerViewPort.classList.add("sapUshellDisableScroll");
                    viewPorts.centerViewPort.removeEventListener("animationend", transitionEndCB);
                    viewPorts.centerViewPort.addEventListener('click', this.switchState.bind(this, "Center"));
                    //when transitioning between right view port to left view port directly
                    if (viewPorts.rightViewPort.classList.contains("sapUshellNotificationAreaShow"))
                    {
                        viewPorts.rightViewPort.classList.remove("sapUshellNotificationAreaShow");
                        viewPorts.rightViewPort.classList.remove("sapUshellNotificationAreaClose");
                        viewPorts.rightViewPort.classList.add("sapUshellShellHidden");
                    }
                }.bind(this);

            this.switchKeyframeAnimationDuration("480ms", [viewPorts.centerViewPort, viewPorts.rightViewPort, viewPorts.rightViewPort]);
            this.setEnableResizeHandler(false);

            var meArea = sap.ui.getCore().byId("meArea");
            if(meArea){
                meArea.onViewStateShow();
            }

            viewPorts.centerViewPort.addEventListener("animationend", transitionEndCB, false);
            viewPorts.leftViewPort.classList.remove("sapUshellShellHidden");

            setTimeout(function() {
                if (viewPorts.rightViewPort.classList.contains("sapUshellNotificationAreaShow")) {
                    viewPorts.rightViewPort.classList.add("sapUshellNotificationAreaClose");
                    viewPorts.centerViewPort.classList.add("sapUshellCenterRight");
                    viewPorts.centerViewPort.classList.remove("sapUshellCenterLeft");
                    viewPorts.leftViewPort.classList.remove("sapUshellMeAreaClose");
                } else {
                    viewPorts.centerViewPort.classList.add("sapUshellSmallRight");
                }
                viewPorts.leftViewPort.classList.add("sapUshellMeAreaShow");
            }, 0);
    };

    ViewPortContainer.prototype._animateMeAreaClose = function (sState) {
        var viewPorts = this._getViewPorts(),
            transitionEndCB = function(event) {
                this._fireTransitionEnd();
                this.setEnableResizeHandler(true);//currently not implemented
                this._removeAllAnimationClasses();
                viewPorts.centerViewPort.removeEventListener('click', this.switchState.bind(this, "Center"));
                viewPorts.leftViewPort.classList.add("sapUshellShellHidden");
                viewPorts.centerViewPort.removeEventListener("animationend", transitionEndCB);
            }.bind(this);
        this.switchKeyframeAnimationDuration("480ms", [viewPorts.centerViewPort, viewPorts.leftViewPort]);
        this.toggleMeAreaScrollBar(false);
        this.setEnableResizeHandler(false);//currently not implemented
        viewPorts.centerViewPort.addEventListener("animationend", transitionEndCB, false);
        setTimeout(function() {
            viewPorts.centerViewPort.classList.remove("sapUshellCenterLeft");
            viewPorts.centerViewPort.classList.remove("sapUshellCenterRight");
            viewPorts.leftViewPort.classList.add("sapUshellMeAreaClose");
            viewPorts.centerViewPort.classList.add("sapUshellSmallRightToLargeCenter");
        }, 0);
    };
    ViewPortContainer.prototype.toggleMeAreaScrollBar = function (bShow) {
        document.getElementById('leftViewPort').classList.toggle("sapUshellMeAreaScrollable", bShow);
    };
    ViewPortContainer.prototype.switchKeyframeAnimationDuration = function (sDuration, aDomElements) {
        aDomElements.forEach(function (item) {
            item.style.animationDuration = sDuration;
        });
    };
    ViewPortContainer.prototype.setEnableResizeHandler = function (bEnable) {
        /** todo: in order to improve the view port animation we need to increase it's fps.
        *   Currently sap.ui.core.ResizeHandler.checkSizes listen to event that is fired every ~100ms.
        *   This function has impacty on the animation performance. The idia in this function is to stop checkSizes functionality
        * while the animationPlayState is "running"
        */
    };
    ViewPortContainer.prototype._animateMinimalNotificationAreaShow = function (sState) {
        var viewPorts = this._getViewPorts(),
            transitionEndCB = function (event) {
                this._fireTransitionEnd(sState);
                this.setEnableResizeHandler(true);
                this.toggleMeAreaScrollBar(true);
                viewPorts.viewPortContainer.removeEventListener("transitionend", transitionEndCB);
            }.bind(this);

        this.setEnableResizeHandler(false);
        viewPorts.viewPortContainer.addEventListener("transitionend", transitionEndCB, false);
        viewPorts.rightViewPort.classList.remove("sapUshellShellHidden");
        setTimeout(function() {
            viewPorts.viewPortContainer.classList.add("sapUshellMinimalNotificationAreaShow");
            viewPorts.viewPortContainer.classList.remove("sapUshellMinimalMeAreaShow");
        }, 0);
    };
    ViewPortContainer.prototype._animateMinimalNotificationAreaClose = function (sState) {
        var viewPorts = this._getViewPorts(),
            transitionEndCB = function (event) {
                this._fireTransitionEnd(sState);
                this.setEnableResizeHandler(true);
                viewPorts.rightViewPort.classList.add("sapUshellShellHidden");
                viewPorts.viewPortContainer.removeEventListener("transitionend", transitionEndCB);
                viewPorts.viewPortContainer.classList.remove("sapUshellMinimalNotificationAreaClose");
            }.bind(this);

        this.toggleMeAreaScrollBar(false);
        this.setEnableResizeHandler(false);
        viewPorts.viewPortContainer.addEventListener("transitionend", transitionEndCB, false);

        setTimeout(function() {
            viewPorts.viewPortContainer.classList.add("sapUshellMinimalNotificationAreaClose");
            viewPorts.viewPortContainer.classList.remove("sapUshellMinimalNotificationAreaShow");
        }, 0);
    };
    ViewPortContainer.prototype._animateMinimalMeAreaShow = function (sState) {
        var viewPorts = this._getViewPorts(),
            transitionEndCB = function (event) {
                this._fireTransitionEnd(sState);
                this.setEnableResizeHandler(true);
                this.toggleMeAreaScrollBar(true);
                viewPorts.viewPortContainer.removeEventListener("transitionend", transitionEndCB);
            }.bind(this);

        this.setEnableResizeHandler(false);
        viewPorts.viewPortContainer.addEventListener("transitionend", transitionEndCB, false);
        viewPorts.leftViewPort.classList.remove("sapUshellShellHidden");

        setTimeout(function() {
            viewPorts.viewPortContainer.classList.add("sapUshellMinimalMeAreaShow");
            viewPorts.viewPortContainer.classList.remove("sapUshellMinimalNotificationAreaShow");
        }, 0);
    };
    ViewPortContainer.prototype._animateMinimalMeAreaClose = function (sState) {
        var viewPorts = this._getViewPorts(),
            transitionEndCB = function (event) {
                this._fireTransitionEnd(sState);
                this.setEnableResizeHandler(true);
                viewPorts.leftViewPort.classList.add("sapUshellShellHidden");
                viewPorts.viewPortContainer.classList.remove("sapUshellMinimalMeAreaClose");
                viewPorts.viewPortContainer.removeEventListener("transitionend", transitionEndCB);
            }.bind(this);

        this.toggleMeAreaScrollBar(false);
        this.setEnableResizeHandler(false);
        viewPorts.viewPortContainer.addEventListener("transitionend", transitionEndCB, false);
        setTimeout(function() {
            viewPorts.viewPortContainer.classList.add("sapUshellMinimalMeAreaClose");
            viewPorts.viewPortContainer.classList.remove("sapUshellMinimalMeAreaShow");
        }, 0);
    };
    ViewPortContainer.prototype._areaShow = function (sState, fnFullCB, fnMinimalCB, bShow) {
        this.setCurrentState(sState);
        if (this._getAnimationMode() === 'full') {
                fnFullCB(sState);
            }else {
            fnMinimalCB(bShow);
        }
    };

    ViewPortContainer.prototype._handleSizeChange = function () {
        var activeViewPort = this.getCurrentState(),
            viewPortData = this._states[activeViewPort].visibleViewPortsData;

        if (viewPortData[0].viewPortId === "leftViewPort") {
            if (this.bIsRTL) {
                var paddingLeft = window.innerWidth - jQuery("#leftViewPort").width();
                jQuery("#leftViewPort").css("padding-left", paddingLeft);
                jQuery("#viewPortCursorPointerArea").css("width", paddingLeft);
                jQuery("#viewPortCursorPointerArea").css("left", "0");
            } else {
                var paddingRight = window.innerWidth - jQuery("#leftViewPort").width();
                jQuery("#leftViewPort").css("padding-right", paddingRight);
                jQuery("#viewPortCursorPointerArea").css("width", paddingRight);
                jQuery("#viewPortCursorPointerArea").css("right", "0");
            }
        }
    };

    ViewPortContainer.prototype._getAnimationMode = function () {
        var oModel = this.getModel(),
            sAnimationMode;
        if (oModel) {
            sAnimationMode = oModel.getProperty('/animationMode');
        }

        return sAnimationMode || 'full';
    };

    ViewPortContainer.prototype._fireTransitionEnd = function (sState) {
        // fire event to notify animations had been finished
        if(!sState){
            sState = this.sCurrentState;
        }
        this.fireAfterSwitchStateAnimationFinished({
            to: sState,
            from: this.sCurrentState
        });
    };

    ViewPortContainer.prototype._getViewPorts = function () {
        var el =  document.getElementById('viewPortContainer');
        if (el) {
            return {
                viewPortContainer: el,
                leftViewPort: document.getElementById('leftViewPort'),
                centerViewPort: document.getElementById('centerViewPort-wrapper'),
                rightViewPort: document.getElementById('rightViewPort')
            }
        }
    };

    ViewPortContainer.prototype.setCurrentState = function (sStateName) {
        var sFromState = this.sCurrentState;
        this.sCurrentState = sStateName;
        this.fireAfterSwitchState({
            to: sStateName,
            from: sFromState
        });
    };

    ViewPortContainer.prototype.getCurrentState = function () {
        return this.sCurrentState;
    };

    ViewPortContainer.prototype.getViewPortControl = function (sViewPortId, sDesiredControlId) {
        var aViewPortControls = this.getAggregation(sViewPortId),
            index;

        if (aViewPortControls) {
            for (index = 0; index < aViewPortControls.length; index++) {
                if (aViewPortControls[index] && (aViewPortControls[index].getId() === sDesiredControlId)) {
                    return aViewPortControls[index];
                }
            }
        }

        return null;
    };

    ViewPortContainer.prototype.getViewPort = function (pageId) {
        var aPages = this.getCenterViewPort(),
            index;

        for (index = 0; index < aPages.length; index++) {
            if (aPages[index] && (aPages[index].getId() === pageId)) {
                return aPages[index];
            }
        }

        return null;
    };

    /**
     * Determines whether the center view port will need to be moved in order to compensate for smaller dashboard.
     * For example: If NotificationsPreview is enabled. In this case the dashboard is smaller in width,
     * hence, when it is being scaled, it also needs to be shifted in order to "compensate" for the area of the notifications preview
     */
    ViewPortContainer.prototype.shiftCenterTransitionEnabled = function (bEnabled) {
        this.bShiftCenterTransitionEnabled = bEnabled;
    };

    /**
     * When notifications preview area exists at the right side of the dashboard:
     * When the viewPort switches to rightCenter state - there should be wider movement of the (scaled) center to the right
     * in order to cover the notifications preview area
     */
    ViewPortContainer.prototype.shiftCenterTransition = function (bShift) {
        this.bShiftCenterTransition = bShift;
    };


    ViewPortContainer.prototype.onAfterRendering = function () {
       this.domRef = this.getDomRef();
       this._handleSizeChange();
    };

    ViewPortContainer.transitions = ViewPortContainer.transitions || {};


	return ViewPortContainer;

});
