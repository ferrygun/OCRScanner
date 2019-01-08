/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
// define a root UIComponent which exposes the main view
jQuery.sap.declare("sap.ca.scfld.md.ComponentBase");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ca.scfld.md.ConfigurationBase");
jQuery.sap.require("sap.ui.core.routing.Router");
jQuery.sap.require("sap.ui.core.routing.History");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
/**
 * @class This is the base class for the Component.js class of Fiori apps. IT provides a simplified routing interface for inner app navigation
 * @name sap.ca.scfld.md.ComponentBase
 * @extends sap.ui.core.UIComponent
 * @public
 */
sap.ui.core.UIComponent.extend("sap.ca.scfld.md.ComponentBase", {
	constructor : function (sId, mSettings) {
		this._aQueue = [];
		this._bRouterCloseDialogs = true;

		// merge base Init and app init
		var fBaseInit = jQuery.proxy(function () {
			sap.ui.core.UIComponent.prototype.init.apply(this, arguments); // calls createContent (among others)

			//this guy handles the navigation
			// this._bRouterCloseDialogs might have been set in the init of the application
			this._routeMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter(), this._bRouterCloseDialogs);
		}, this);

		var fAppInit = jQuery.proxy(this.init, this);
		this.init = function () {
			fBaseInit();
			fAppInit();

			var oRouter = this.getRouter();
			oRouter.initialize();
		};

		// merge base Exit and app exit
		var fBaseExit = jQuery.proxy(function () {
			this._routeMatchedHandler.destroy();
		}, this);
		var fAppExit = jQuery.proxy(this.exit, this);
		this.exit = function () {
			fAppExit();
			fBaseExit();
		};
		sap.ui.core.UIComponent.prototype.constructor.apply(this, arguments);
	},
	/**
	* not yet documented
	* @public
	* @name sap.ca.scfld.md.ComponentBase#init
	* @function
	*/
	init : function () {

	},
	/**
	* not yet documented
	* @public
	* @name sap.ca.scfld.md.ComponentBase#exit
	* @function
	*/
	exit : function () {

	},
	/**
	* This method defines if open dialogs shall automatically be closed by the inner app navigation.
	* @param {boolean} bCloseDialogs "true" dialogs are automatically closed, "false" dialogs stay open
	* @public
	* @name sap.ca.scfld.md.ComponentBase#setRouterSetCloseDialogs
	* @function
	*/
	setRouterSetCloseDialogs: function (bCloseDialogs) {
		this._bRouterCloseDialogs = bCloseDialogs;
		if (this._routeMatchedHandler) {
			this._routeMatchedHandler.setCloseDialogs(bCloseDialogs);
		}
	}
});
/**
* Creates the metadata Object of the app
* @param {string} sAppType identifies the used template. Valid values are "MD" for Master/Detail and "FS" for full screen. This parameter is set automatically by the template and should not be changed manually
* @param {object} oAppMeta a metadata object containing information about the app used by the shell and the Fiori scaffolding framework.
* <p>The Object consists of the following attributes (additional attributes can be added):</p>
* <ul>
*   <li> <b>name</b> {string} Name of the application. Set automatically during the generation of the application</li>
*   <li> <b>version</b> {string} Version of the applicationSet automatically during the generation of the application</li>
*   <li> <b>library</b> Not sure... contains the artefact id. Set automatically during the generation of the application</li>
*   <li> <b>includes</b> {list} Not sure... is a list</li>
*   <li> <b>dependencies</b> {oject} JSON object containing two attributes:
*     <ul>
*      <li><b>libs</b> {list} not sure... list of libraries pre filled during creation of the app</li>
*      <li><b>components</b> {list} not sure... list of? usually empty </li>
*     </ul>
*   </li>
*   <li> <b>config</b> {object} not sure... probably obsolete don't use anymore</li>
*   <li> <b>viewPath</b> {string} Location of the views. Used by the inner app navigation to automatically create views. Set automatically during the generation of the application</li>

*   <li> <b>fullScreenPageRoutes</b> {object} -optional- This object contains one attribute for each route that leads to a full screen view. The structure
*    of such an attribute is as follows:
*     <ul>
*       <li><b>&lt;nameOfRoute></b> {object} The attribute name is the same as the name of the route it describes</li>
*       <ul>
*         <li><b>pattern</b> {string} URL pattern used to recognize the route</li>
*         <li><b>view</b> {string} Name of the view to which this route leads</li>
*       </ul>
*     </ul>
*   <li> <b>masterPageRoutes</b> {object} -optional- This object contains one attribute for each route that leads to a master view in a master/detail scenario. Please note that currently scaffolding only supports one master view per app
*     As a default a route named "master" is created leading to a view "S2". This route is defined internally by the scaffolding. If the master view is named differently the route "master" can be redefined here with a different target view. In case also the route name differs the application additionally has to redefine method getMasterRouteName of the master controller accordingly.
*     masterPageRoutes is structured the same as fullScreenPageRoutes.
*   </li>
*   <li> <b>detailPageRoutes</b> {object} -optional- This object contains one attribute for each route that leads to a detail view in a master/detail scenario. detailPageRoutes is structured the same as fullScreenPageRoutes.
*     As a default a route named "detail" is created leading to a view "S3". This is the route that the scaffolding uses to navigate to the detail view whenever an item of the master list is clicked or tapped. This route is defined internally by the scaffolding with the following values:
*     "detail" : {
*     "pattern" : "detail/{contextPath}",
*     "view" : "S3",
*     }
*     If the application uses a different view name the route "detail" can be redefined here with a different target view. In case also the route name or/and the pattern differ the application additionally has to redefine the methods getDetailRouteName, getBindingContextPathFor, getDetailNavigationParameters of the master controller accordingly (see API description of ScfldMAsterController.js)
*     masterPageRoutes is structured the same as fullScreenPageRoutes.
*   </li>
* <ul>
* @public
* @name sap.ca.scfld.md.ComponentBase#createMetaData
* @function
*/
sap.ca.scfld.md.ComponentBase.createMetaData = function (sAppType, oAppMeta) {
	var setRouteDefaults = function(oDefaults, oRoutes) {
		for ( var sRouteName in oRoutes) {
			if (!oRoutes[sRouteName].targetControl && oDefaults.targetControl) {
				oRoutes[sRouteName].targetControl = oDefaults.targetControl;
			}

			if (!oRoutes[sRouteName].targetAggregation && oDefaults.targetAggregation) {
				oRoutes[sRouteName].targetAggregation = oDefaults.targetAggregation;
			}

			if (!oRoutes[sRouteName].viewPath && oDefaults.viewPath) {
				oRoutes[sRouteName].viewPath = oDefaults.viewPath;
			}

			if (!oRoutes[sRouteName].viewLevel && oDefaults.viewLevel) {
				oRoutes[sRouteName].viewLevel = oDefaults.viewLevel;
			}
		}
		return oRoutes;
	};

	var oMeta = {};

	// build header data
	for ( var sPropName in oAppMeta) {
		if (sPropName !== "viewPath" && sPropName !== "masterPageRoutes" && sPropName !== "detailPageRoutes"
				&& sPropName !== "fullScreenPageRoutes") {
			oMeta[sPropName] = oAppMeta[sPropName];
		}
	}

	if (sAppType === "MD") {
		oMeta.routing = {
			"config" : {
				"viewType" : "XML",
				"viewPath" : oAppMeta.viewPath,
				"targetAggregation" : "detailPages",
				"viewLevel" : undefined, // the masterDetailRoute and the fioriContentRoute should rely on the browser
				// history direction
				"clearTarget" : false
			},
			"routes" : {
				"masterDetail" : {
					"view" : "MainSplitContainer",
					"name" : "masterDetail",
					"viewPath" : "sap.ca.scfld.md.view",
					"targetControl" : "fioriContent", // This is the control in which the new view will be placed
					"targetAggregation" : "pages", // This is the aggregation in which the new view will be placed
					"subroutes" : {
						"master" : { // master is the name of the route
							"pattern" : "", // will be the url and from has to be provided in the data
							"view" : "S2",
							"targetControl" : "MainSplitContainer",
							"targetAggregation" : "masterPages",
							"viewLevel" : 0,
							"subroutes" : {
								"detail" : {
									"pattern" : "detail/{contextPath}",
									"view" : "S3",
									"viewLevel" : 1
								},
								"noData" : {
									"pattern" : "noData/{viewTitle}/{languageKey}",
									"viewPath" : "sap.ca.scfld.md.view",
									"view" : "empty",
									"viewLevel" : 1
								}
							}
						}
					}
				},
				"fullScreen" : {
					"view" : "App",
					"viewPath" : "sap.ca.scfld.md.view",
					"targetControl" : "fioriContent", // This is the control in which the new view will be placed
					"targetAggregation" : "pages", // This is the aggregation in which the new view will be placed
					"subroutes" : {}
				}
			}
		};
	} else {
		oMeta.routing = {
			"config" : {
				"viewType" : "XML",
				"viewPath" : oAppMeta.viewPath,
				"targetAggregation" : "pages",
				"viewLevel" : undefined, // the masterDetailRoute and the fioriContentRoute should rely on the browser
				// history direction
				"clearTarget" : false
			},
			"routes" : {
				"fullScreen" : {
					"view" : "App",
					"viewPath" : "sap.ca.scfld.md.view",
					"targetControl" : "fioriContent", // This is the control in which the new view will be placed
					"targetAggregation" : "pages", // This is the aggregation in which the new view will be placed
					"subroutes" : {
						"noData" : {
							"pattern" : "noData/{viewTitle}/{languageKey}",
							"viewPath" : "sap.ca.scfld.md.view",
							"view" : "empty",
							"viewLevel" : 2
						}
					}
				}
			}
		};
	}
	var oDetailRoutes;
	var oMasterRoutes;
	var oFullScreenRoutes;
	try {
		oDetailRoutes = oMeta.routing.routes.masterDetail.subroutes.master.subroutes;
	} catch (e) {
	}
	try {
		oMasterRoutes = oMeta.routing.routes.masterDetail.subroutes;
	} /* We only support one master*/ catch (e) {
	}
	try {
		oFullScreenRoutes = oMeta.routing.routes.fullScreen.subroutes;
	} catch (e) {
	}

	if (oDetailRoutes) {
		jQuery.extend(true, oDetailRoutes, oAppMeta.detailPageRoutes);
	}
	if (oMasterRoutes) {
		jQuery.extend(true, oMasterRoutes, oAppMeta.masterPageRoutes);
	}
	if (oFullScreenRoutes) {
		jQuery.extend(true, oFullScreenRoutes, oAppMeta.fullScreenPageRoutes);
	}

	setRouteDefaults({
		targetControl : "MainSplitContainer",
		targetAggregation : "masterPages",
		viewPath : oAppMeta.viewPath,
		viewLevel : 0
	}, oMasterRoutes);
	setRouteDefaults({
		// targetControl : "MainSplitContainer",
		targetAggregation : "detailPages",
		viewPath : oAppMeta.viewPath,
		viewLevel : 1
	}, oDetailRoutes);
	setRouteDefaults({
		targetControl : "app",
		targetAggregation : "pages",
		viewPath : oAppMeta.viewPath,
		viewLevel : 2
	}, oFullScreenRoutes);

	// insert the style class needed for the master list to work instead of trying to load a css file
	// only do this if the style tag does not exist
	if (jQuery('#scfld-hiddenList-class').length === 0) {
		var inlineStyle = jQuery('<style id="scfld-hiddenList-class" type="text/css">.hiddenList{display:none;}</style>');
		document.getElementsByTagName('head')[0].appendChild(inlineStyle[0]);
	}


	return oMeta;

};
