/*!
 * @copyright@
 */
sap.ui.define(["./NavError","./SelectionVariant",  "sap/ui/generic/app/library", "sap/ui/base/Object", "sap/ui/model/resource/ResourceModel", "sap/ui/core/UIComponent", "sap/ui/core/routing/HashChanger", "jquery.sap.global"],
	function(Error, SelectionVariant, NavLibrary, BaseObject, ResourceModel, UIComponent, HashChanger, jQuery) {
	"use strict";

	/**
	 * @class
	 * Creates a new NavigationHandler class by providing the required environment.
	 *
	 * <b>Note:</b> This class requires that the UShell Navigation Service API CrossApplicationNavigation is available and initialized.
	 * @extends sap.ui.base.Object
	 * @constructor
	 * @public
	 * @param {object} oController UI5 controller that contains a router and a component; typically the main controller of your application,
	 * for example, a subclass of the sap.ca.scfld.md.controller.BaseFullscreenController if scaffolding is used
	 * @param {string} [sParamHandlingMode=SelVarWins] Mode to be used to handle conflicts when merging URL parameters and the SelectionVariant class, see {@link sap.ui.generic.app.navigation.service.ParamHandlingMode}
	 * @throws An instance of {@link sap.ui.generic.app.navigation.service.NavError} in case of input errors. Valid error codes are:
	 * <table>
	 * <tr><th align="left">Error code</th><th align="left">Description</th></tr>
	 * <tr><td>NavigationHandler.INVALID_INPUT</td><td>Indicates that the input parameter is invalid</td></tr>
	 * </table>
	 * @alias sap.ui.generic.app.navigation.service.NavigationHandler
	 */
	var NavigationHandler = BaseObject.extend("sap.ui.generic.app.navigation.service.NavigationHandler", /** @lends sap.ui.generic.app.navigation.service.NavigationHandler */ {
		metadata : {
			publicMethods : ["navigate","parseNavigation","storeInnerAppState","openSmartLinkPopover","mixAttributesAndSelectionVariant"]
		},

		constructor: function(oController, sParamHandlingMode){

			if (!oController) {
				throw new Error("NavigationHandler.INVALID_INPUT");
			}

			if (oController instanceof UIComponent) {
				this.oRouter = oController.getRouter();
				this.oComponent = oController;

			} else {

				if (typeof oController.getOwnerComponent !== "function") {
					throw new Error("NavigationHandler.INVALID_INPUT");
				}

				this.oRouter = this._getRouter(oController);
				this.oComponent = oController.getOwnerComponent();
			}

			//special handling for SmartTemplates
			if (this.oComponent && this.oComponent.getAppComponent) {
				this.oComponent = this.oComponent.getAppComponent();
			}

			if (typeof this.oRouter === "undefined" || typeof this.oComponent === "undefined" || typeof this.oComponent.getComponentData !== "function" ) {
				throw new Error("NavigationHandler.INVALID_INPUT");
			}

			try {
				this.oCrossAppNavService = this._getAppNavigationService();
			} catch (ex) {
				jQuery.sap.log.error("NavigationHandler: UShell service API for CrossApplicationNavigation is not available.");
			}
			this.IAPP_STATE = "sap-iapp-state";
			this.sDefaultedParamProp = "sap-ushell-defaultedParameterNames";
			this.sSAPSystemProp = "sap-system";

			//list of technical parameters
			this._aTechnicalParamaters = ["hcpApplicationId" ];


			this._oLastSavedInnerAppData = { sAppStateKey: "" , oAppData: {}, iCacheHit: 0, iCacheMiss: 0 };

			/*
			 * There exists a generation of "old" sap-iapp-states which are based on the following
			 * URL schema:
			 *
			 * #SemObj-action&/route/sap-iapp-state=ABC12345678
			 *
			 * The new URL schema is:
			 *
			 * #SemObj-action&/route?sap-iapp-state=ABC12345678
			 *
			 * (mind the difference between / and ? above), i.e. the sap-iapp-state has become a
			 * parameter of the query parameter section in the AppHash string.
			 * Yet, this tool shall be able to deal even with old sap-iapp-states. Therefore, we
			 * use two Regular Expressions (rIAppStateOld and rIAppStateOldAtStart) as defined below
			 * to scan for these old variants.
			 * The new variant is being scanned using rIAppStateNew as Regular Expression search string.
			 *
			 * Compatibility is centrally ensured by the two methods
			 *    _getInnerAppStateKey
			 * and
			 *    _replaceInnerAppStateKey
			 * (see below). Never use these RegExp in a method on your own, as it typically indicates that
			 * you will fall into the compatibility trap!
			 */
			// Warning! Do not use GLOBAL flags here; RegExp in GLOBAL mode store the lastIndex value
			// Therefore, repeated calls to the RegExp will then only start beginning with that stored
			// lastIndex. Thus, multiple calls therefore could yield strange results.
			// Moreover, there shall only be exactly one IAPP_STATE per RegExp in an AppHash.
			// Therefore, GLOBAL search should be superfluous.
			this._rIAppStateOld = new RegExp("/" + this.IAPP_STATE + "=([^/?]+)");
			this._rIAppStateOldAtStart = new RegExp("^" + this.IAPP_STATE + "=([^/?]+)");

			this._rIAppStateNew = new RegExp("[\?&]" + this.IAPP_STATE + "=([^&]+)");
			/*
			 * Regular Expression in words:
			 * Search for something that either stars with ? or &, followed by the term
			 * "sap-iapp-state". That one is followed by an equal sign (=).
			 * The stuff that is after the equal sign forms the first regexp group.
			 * This group consists of at least one (or arbitrary many) characters, as long
			 * as it is not an ampersand sign (&).
			 * Characters after such an ampersand would be ignored and do not belong to the group.
			 * Alternatively, the string also may end.
			 */

			if (sParamHandlingMode === sap.ui.generic.app.navigation.service.ParamHandlingMode.URLParamWins || sParamHandlingMode === sap.ui.generic.app.navigation.service.ParamHandlingMode.InsertInSelOpt) {
				this.sParamHandlingMode = sParamHandlingMode;
			} else {
				this.sParamHandlingMode = sap.ui.generic.app.navigation.service.ParamHandlingMode.SelVarWins; //default
			}
		},

		/**
		 * Retrieves the shell navigation service.
		 * @returns {object} the Navigation service
		 * @private
		 */
		_getAppNavigationService : function() {
			return sap.ushell.Container.getService("CrossApplicationNavigation");
		},


		/**
		 * Retrieves the reference to the router object for navigation for this given Controller
		 * @param {object} oController the reference to the Controller for which the Router instance shall be determined.
		 * @returns {object} the Router for the given Controller
		 * @private
		 */
		_getRouter : function(oController) {
			return UIComponent.getRouterFor(oController);
		},

		/**
		 * Triggers a cross-app navigation after saving the inner and the cross-app states.
		 * Since 1.52.0 the navigation mode based on <code>sap-ushell-next-navmode</code> is taken into account.
		 * If set to <code>explace</code> the inner app state will note be changed.
		 * @param {string} sSemanticObject Name of the semantic object of the target app
		 * @param {string} sActionName Name of the action of the target app
		 * @param {object | string } [vNavigationParameters] Navigation parameters as an object with key/value pairs or as a stringified JSON object
		 * @param {object} [oInnerAppData] Object for storing current state of the app
		 * @param {string} [oInnerAppData.selectionVariant] Stringified JSON object as returned, for example, from getDataSuiteFormat() of the SmartFilterBar control
		 * @param {string} [oInnerAppData.tableVariantId] ID of the SmartTable variant
		 * @param {object} [oInnerAppData.customData] Object that can be used to store arbitrary data
		 * @param {object} [mInnerAppData.presentationVariant] Object containing the current ui state of the app
		 * @param {function} [fnOnError] Callback that is called if an error occurs during navigation <br>
		 * <b>Parameters:</b>
		 * <table>
		 * <tr><td align="center">{object}</td><td><b>oError</b></td><td>Error object (instance of {@link sap.ui.generic.app.navigation.service.NavError}) that describes
		 * which kind of error occurred</td>
		 * <tr><td align="center">{string}</td><td><b>oError.errorCode</b></td><td>Code to identify the error</td>
		 * <tr><td align="center">{string}</td><td><b>oError.type</b></td><td>Severity of the error (info/warning/error)</td>
		 * <tr><td align="center">{array}</td><td><b>oError.params</b></td><td>An array of objects (typically strings) that describe additional value parameters
		 * required for generating the message</td>
		 * </table>
		 * @public
		 * @example
		 * <code>
		 * var oNavigationHandler = new sap.ui.generic.app.navigation.service.NavigationHandler(oController);
		 * var sSemanticObject = "SalesOrder";
		 * var sActionName = "create";
		 *
		 * //simple parameters as Object
		 * var vNavigationParameters = {
		 * 		CompanyCode : "0001",
		 * 		Customer : "C0001"
		 * };
		 *
		 * //or as selection variant
		 * var oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant();
		 * oSelectionVariant.addSelectOption("CompanyCode", "I", "EQ", "0001");
		 * oSelectionVariant.addSelectOption("Customer", "I", "EQ", "C0001");
		 * vNavigationParameters = oSelectionVariant.toJSONString();
		 *
		 * //or directly from SmartFilterBar
		 * vNavigationParameters = oSmartFilterBar.getDataSuiteFormat();
		 *
		 * //app state for back navigation
		 * var oInnerAppData = {
		 * 		selectionVariant : oSmartFilterBar.getDataSuiteFormat(),
		 * 		tableVariantId : oSmartTable.getCurrentVariantId(),
		 * 		customData : oMyCustomData
		 * };
		 *
		 * // callback function in case of errors
		 * var fnOnError = function(oError){
		 * 		var oi18n = oController.getView().getModel("i18n").getResourceBundle();
		 * 		oError.setUIText({oi18n : oi18n, sTextKey : "OUTBOUND_NAV_ERROR"});
		 * 		oError.showMessageBox();
		 * };
		 *
		 * oNavigationHandler.navigate(sSemanticObject, sActionName, vNavigationParameters, oInnerAppData, fnOnError);
		 * </code>
		 */
		navigate : function(sSemanticObject, sActionName, vNavigationParameters, oInnerAppData, fnOnError) {

			var sSelectionVariant, mParameters, oObj = {}, oPresentationVariant = null, oComponentData, oStartupParameters, bExPlace = false;

			oComponentData = this.oComponent.getComponentData();
			/*
			 * There are some race conditions where the oComponentData may not be set,
			 * for example in case the UShell was not initialized properly.
			 * To make sure that we do not dump here with an exception, we
			 * take this special error handling behavior:
			 */
			if (oComponentData) {
				oStartupParameters = oComponentData.startupParameters;
				if (oStartupParameters && oStartupParameters["sap-ushell-next-navmode"] && oStartupParameters["sap-ushell-next-navmode"].length > 0) {
					//bExPlace = (JSON.parse(oStartupParameters["sap-ushell-next-navmode"][0]) === "explace");
					bExPlace = (oStartupParameters["sap-ushell-next-navmode"][0] === "explace");					
				}			
			}

			if (oInnerAppData && oInnerAppData.presentationVariant) {
				oPresentationVariant = oInnerAppData.presentationVariant;
			}

			//for navigation we need URL parameters (legacy navigation) and sap-xapp-state, therefore we need to create the missing one from the passed one
			if (typeof vNavigationParameters === "string") {
				sSelectionVariant = vNavigationParameters;
				mParameters = this._getURLParametersFromSelectionVariant(sSelectionVariant);
			} else if (typeof vNavigationParameters === "object") {
				mParameters = vNavigationParameters;
				var oEnrichedSelVar = this._splitInboundNavigationParameters(new SelectionVariant(), mParameters, []).oNavigationSelVar;
				sSelectionVariant = oEnrichedSelVar.toJSONString();
			} else {
				throw new Error("NavigationHandler.INVALID_INPUT");
			}

			var oNavHandler = this;
			var oNavArguments = {
                     target: {
                         semanticObject: sSemanticObject,
                         action: sActionName
                     },
                     params: mParameters || {}
			};
			var oSupportedPromise = oNavHandler.oCrossAppNavService.isNavigationSupported([oNavArguments], oNavHandler.oComponent);
			oSupportedPromise.done(function(oTargets) {
				if (oTargets[0].supported){
					var oStorePromise;

					if (bExPlace) {
						oStorePromise = oNavHandler._createDummyPromise();
					} else {
						oStorePromise = oNavHandler.storeInnerAppState(oInnerAppData);
					}

					oObj.selectionVariant = sSelectionVariant;
					if (oPresentationVariant) {
						oObj.presentationVariant = oPresentationVariant;
					}					
					var oReturn = oNavHandler._saveAppStateWithImmediateReturn(oObj, fnOnError);
					if (oReturn) {
						jQuery.when(oStorePromise, oReturn.promise).then(function(v1) {
							oNavArguments.appStateKey = oReturn.appStateKey;
							// Remark:
							// The Cross App Service takes care of encoding parameter keys and values. Example:
							// mParams = { "$@%" : "&/=" } results in the URL parameter %2524%2540%2525=%2526%252F%253D
							// Note the double encoding, this is correct.

							// toExternal sets sap-xapp-state in the URL if appStateKey is provided in oNavArguments
							oNavHandler.oCrossAppNavService.toExternal(oNavArguments, oNavHandler.oComponent); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>OUT
						}, function(oError) {
							if (fnOnError) {
								fnOnError(oError);
							}
						});
					} // else : error was already reported


				} else {
					// intent is not supported
					if (fnOnError) {
						var oError = new Error("NavigationHandler.isIntentSupported.notSupported");
						fnOnError(oError);
					}
				}
			});

			if (fnOnError) {
				oSupportedPromise.fail(function(){
					// technical error: could not determine if intent is supported
					var oError = oNavHandler._createTechnicalError("NavigationHandler.isIntentSupported.failed");
					fnOnError(oError);
				});
			}
		},

		/**
		 * Parses the incoming URL and returns a Promise. If this method detects a back navigation, the inner app state is returned
		 * in the resolved Promise. Otherwise startup parameters will be merged into the app state provided by cross app navigation, and a combined
		 * app state will be returned. The conflict resolution can be influenced with sParamHandlingMode defined in the constructor.
		 * @returns {object} A Promise object to monitor when all the actions of the function have been executed. If the execution is successful, the extracted app state,
		 * the startup parameters, and the type of navigation are returned, see also the example above. The app state is an object that contains
		 * the following information:
		 * <ul>
		 * <li><code>oAppData.oSelectionVariant</code>: An instance of {@link sap.ui.generic.app.navigation.service.SelectionVariant} containing only
		 * parameters/select options that are related to navigation</li>
		 * <li><code>oAppData.selectionVariant</code>: The navigation-related selection variant as a JSON-formatted string</li>
		 * <li><code>oAppData.oDefaultedSelectionVariant</code>: An instance of {@link sap.ui.generic.app.navigation.service.SelectionVariant} containing
		 * only the parameters/select options that are set by user default data</li>
		 * <li><code>oAppData.bNavSelVarHasDefaultsOnly</code>: A Boolean flag that indicates whether only defaulted parameters and
		 * no navigation parameters are present (<b>Note:</b> If no navigation parameters are available, bNavSelVarHasDefaultsOnly
		 * is<code>true</code>, even also no defaulted parameters may be available)</li>
		 * </ul>
		 * If the navigation-related selection variant is empty, it is replaced by a copy of the defaulted selection variant.<br>
		 * The navigation type is an enumeration type of type {@link sap.ui.generic.app.navigation.service.NavType} (possible values are initial,
		 * URLParams, xAppState, and iAppState).<br>
		 * <b>Note:</b> If the navigation type is {@link sap.ui.generic.app.navigation.service.NavType.iAppState} oAppData has two additional properties
		 * <ul>
		 * <li><code>oAppData.tableVariantId</code></li>
		 * <li><code>oAppData.customData</code></li>
		 * </ul>
		 * which return the inner app data as stored in {@link #.navigate navigate} or {@link #.storeInnerAppState storeInnerAppState}.
		 * <code>oAppData.oDefaultedSelectionVariant</code> is an empty selection variant and <code>oAppData.bNavSelVarHasDefaultsOnly</code>
		 * is <code>false</code> in this case.<br>
		 * <b>Note:</b> If the navigation type is {@link sap.ui.generic.app.navigation.service.NavType.initial} oAppData is an empty object!<br>
		 * If an error occurs, an error object of type {@link sap.ui.generic.app.navigation.service.NavError}, URL parameters (if available) and the type of
		 * navigation are returned.
		 * @public
		 * @example
		 * <code>
		 * var oNavigationHandler = new sap.ui.generic.app.navigation.service.NavigationHandler(oController);
		 * var oParseNavigationPromise = oNavigationHandler.parseNavigation();
		 *
		 * oParseNavigationPromise.done(function(oAppData, oStartupParameters, sNavType){
		 * 		oSmartFilterBar.setDataSuiteFormat(oAppData.selectionVariant);
		 * 		// oAppData.oSelectionVariant can be used to manipulate the selection variant
		 * 		// oAppData.oDefaultedSelectionVariant contains the parameters which are set by user defaults
		 * 		// oAppData.bNavSelVarHasDefaultsOnly indicates whether only defaulted parameters and no navigation parameters are present
		 * });
		 * oParseNavigationPromise.fail(function(oError, oURLParameters, sNavType){
		 * 		// if e.g. the xapp state could not be loaded, nevertheless there may be URL parameters available
		 * 		//some error handling
		 * });
		 * </code>
		 */
		parseNavigation: function(){

			var sAppHash = HashChanger.getInstance().getHash();
			/* use .getHash() here instead of .getAppHash() to also be able dealing with
			 * environments where only SAPUI5 is loaded and the UShell is not initialized properly.
			 */
			var sIAppState = this._getInnerAppStateKey(sAppHash);

			var oComponentData = this.oComponent.getComponentData();
			/*
			 * There are some race conditions where the oComponentData may not be set,
			 * for example in case the UShell was not initialized properly.
			 * To make sure that we do not dump here with an exception, we
			 * take this special error handling behavior:
			 */
			if (oComponentData === undefined) {
				jQuery.sap.log.warning("The navigation Component's data was not set properly; assuming instead that no parameters are provided.");
				oComponentData = {};
			}

			// Remark:
			// The startup parameters are already decoded. Example:
			// The original URL parameter %2524%2540%2525=%2526%252F%253D results in oStartupParameters = { "$@%" : "&/=" }
			// Note the double encoding in the URL, this is correct. An URL parameter like xyz=%25 causes an "URI malformed" error.
			// If the decoded value should be e.g. "%25", the parameter in the URL needs to be: xyz=%252525
			var oStartupParameters = oComponentData.startupParameters;

			var aDefaultedParameters = [];
			if (oStartupParameters && oStartupParameters[this.sDefaultedParamProp] && oStartupParameters[this.sDefaultedParamProp].length > 0) {
				aDefaultedParameters = JSON.parse(oStartupParameters[this.sDefaultedParamProp][0]);
			}

			var oMyDeferred = jQuery.Deferred();
			var oNavHandler = this;

			if (sIAppState) {
				// inner app state is available in the AppHash (back navigation); extract the parameter value
				this._loadAppState(sIAppState,oMyDeferred);

			} else {

				// no back navigation
				var bIsXappStateNavigation = oComponentData["sap-xapp-state"] !== undefined;
				if (bIsXappStateNavigation) {
					// inner app state was not found in the AppHash, but xapp state => try to read the xapp state
					var oStartupPromise = this.oCrossAppNavService.getStartupAppState(this.oComponent);

					oStartupPromise.done(
						function(oAppState) {
							//get app state from sap-xapp-state,
							//create a copy, not only a reference, because we want to modify the object
							var oAppStateData = oAppState.getData();
							if (oAppStateData){
								try {
									oAppStateData = JSON.parse(JSON.stringify(oAppStateData));
								} catch (x) {
									var oError = oNavHandler._createTechnicalError("NavigationHandler.AppStateData.parseError");
									oMyDeferred.reject(oError, oStartupParameters, sap.ui.generic.app.navigation.service.NavType.xAppState);
									return oMyDeferred.promise();
								}
							}

							if (oAppStateData) {
									var oSelVar = new SelectionVariant(oAppStateData.selectionVariant);

									var oSelVars = oNavHandler._splitInboundNavigationParameters(oSelVar, oStartupParameters, aDefaultedParameters);
									oAppStateData.selectionVariant = oSelVars.oNavigationSelVar.toJSONString();
									oAppStateData.oSelectionVariant = oSelVars.oNavigationSelVar;
									oAppStateData.oDefaultedSelectionVariant = oSelVars.oDefaultedSelVar;
									oAppStateData.bNavSelVarHasDefaultsOnly = oSelVars.bNavSelVarHasDefaultsOnly;
									oMyDeferred.resolve(oAppStateData, oStartupParameters, sap.ui.generic.app.navigation.service.NavType.xAppState);
							} else {
									// sap-xapp-state navigation, but ID has already expired, but URL parameters available
									oError = oNavHandler._createTechnicalError("NavigationHandler.getDataFromAppState.failed");
									oMyDeferred.reject(oError, oStartupParameters || {}, sap.ui.generic.app.navigation.service.NavType.xAppState);
							}
						}
					);
					oStartupPromise.fail(function(){
						var oError = oNavHandler._createTechnicalError("NavigationHandler.getStartupState.failed");
						oMyDeferred.reject(oError, {}, sap.ui.generic.app.navigation.service.NavType.xAppState);
						}
					);

				} else {
					// no sap-xapp-state
					if (oStartupParameters) {
						// standard URL navigation
						var oSelVars = oNavHandler._splitInboundNavigationParameters(new SelectionVariant(), oStartupParameters, aDefaultedParameters);
						if (oSelVars.oNavigationSelVar.isEmpty() && oSelVars.oDefaultedSelVar.isEmpty()){
							// Startup parameters contain only technical parameters (SAP system) which were filtered out.
							// oNavigationSelVar and oDefaultedSelVar are empty.
							// Thus, consider this type of navigation as an initial navigation.
							oMyDeferred.resolve( {}, oStartupParameters, sap.ui.generic.app.navigation.service.NavType.initial);
						} else {
							var oAppStateData = {};
							oAppStateData.selectionVariant = oSelVars.oNavigationSelVar.toJSONString();
							oAppStateData.oSelectionVariant = oSelVars.oNavigationSelVar;
							oAppStateData.oDefaultedSelectionVariant = oSelVars.oDefaultedSelVar;
							oAppStateData.bNavSelVarHasDefaultsOnly = oSelVars.bNavSelVarHasDefaultsOnly;
							oMyDeferred.resolve(oAppStateData, oStartupParameters, sap.ui.generic.app.navigation.service.NavType.URLParams);
						}
					} else {
						// initial navigation
						oMyDeferred.resolve( {}, {}, sap.ui.generic.app.navigation.service.NavType.initial);
					}
				}
			}

			return oMyDeferred.promise();
		},

		/**
		 * Sets the application specific technical parameters. Technical parameters will not be added to the selection variant passed to the application.
		 * As a default the following values are considered as technical parameters:
		 * <ul>
		 * <li><code>sap-system</code></li>
		 * <li><code>sap-ushell-defaultedParameterNames</code></li>
		 * <li><code>"hcpApplicationId"</code></li>
		 * </ul>
		 * @param {array} aTechnicalParameters list of parameter names to be considered as technical parameters. <code>null</code> or <code>undefined</code> may be used to reset the complete list.
		 * @public
		 */
		setTechnicalParameters : function(aTechnicalParameters) {

			if (!aTechnicalParameters) {
				aTechnicalParameters = [];
			}

			if (!jQuery.isArray(aTechnicalParameters)) {
				jQuery.sap.log.error("NavigationHandler: parameter incorrect, array of strings expected");
				throw new Error("NavigationHandler.INVALID_INPUT");
			}

			this._aTechnicalParamaters = aTechnicalParameters;
		},

		/**
		 * Gets the application specific technical parameters. Technical parameters will not be added to the selection variant passed to the application.
		 * As a default the following values are considered as technical parameters:
		 * <ul>
		 * <li><code>sap-system</code></li>
		 * <li><code>sap-ushell-defaultedParameterNames</code></li>
		 * <li><code>"hcpApplicationId"</code></li>
		 * </ul>
		 * @returns {array} Containing the technical parameters.
		 * @public
		 */
		getTechnicalParameters : function() {
			return this._aTechnicalParamaters.concat([]);
		},

		/**
		 * Checks if the passed parameter is considered as technical parameter.
		 * @param {string} sParameterName Name of a request parameter, considered as technical parameter.
		 * @returns {boolean} indicates if the parameter is considered as technical parameter or not.
		 * @private
		 */
		_isTechnicalParameter : function(sParameterName) {

			if (sParameterName) {
				if  (sParameterName.toLowerCase().indexOf("sap-") === 0) {
					return true;
				} else if (this._aTechnicalParamaters.indexOf(sParameterName) >= 0) {
					return true;
				}
			}

			return false;
		},

		/**
		 * Splits the parameters provided during inbound navigation and separates the contextual information
		 * between defaulted parameter values and navigation parameters
		 * @param {object} oSelectionVariant Instance of {@link sap.ui.generic.app.navigation.service.SelectionVariant} containing
		 * navigation data of the app
		 * @param {object} oStartupParameters Object containing startup parameters of the app (derived from the component)
		 * @param {array} aDefaultedParameters Array containing defaulted parameter names
		 *
		 * @returns {object} Object containing two SelectionVariants, one for navigation (oNavigationSelVar) and one for
		 * defaulted startup parameters (oDefaultedSelVar), and a flag (bNavSelVarHasDefaultsOnly) indicating whether all
		 * parameters were defaulted.
		 *
		 * The function is handed two objects containing parameters (names and their corresponding values),
		 * oSelectionVariant and oStartupParameters. A parameter could be stored in just one of these two
		 * objects or in both of them simultaneously. Because of the latter case a parameter could be associated
		 * with conflicting values and it is the job of this function to resolve any such conflict.
		 *
		 * Parameters are assigned to the two returned SelectionVariants, oNavigationSelVar and oDefaultedSelVar, as
		 * follows:
		 *
		 *                    | parameter NOT in  | parameter in
		 *                    | oSelectionVariant | oSelectionVariant
		 * ---------------------------------------|------------------
		 * parameter NOT in   | nothing to do     | Add parameter
		 * oStartupParameters | here              | (see below)
		 * ----------------------------------------------------------
		 * parameter in       | Add parameter     | Conflict resolution
		 * oStartupParameters | (see below)       | (see below)
		 *
		 * Add parameter:
		 *     if parameter in aDefaultedParameters:
		 *         add parameter to oDefaultedSelVar
		 *     else:
		 *         add parameter to oNavigationSelVar
		 *
		 * Conflict resolution:
		 *     if parameter in aDefaultedParameters:
		 *         add parameter value from oSelectionVariant to oNavigationSelVar
		 *         add parameter value from oStartupParameters to oDefaultedSelVar
		 *         Note: This case only occurs in UI5 1.32. In later versions UShell stores any defaulted parameter
		 *         either in oSelectionVariant or oStartupParameters but never simultaneously in both.
		 *     else:
		 *         Choose 1 of the following options based on given handling mode (this.sParamHandlingMode).
		 *              -> add parameter value from oStartupParameters to oNavigationSelVar
		 *|             -> add parameter value from oAppState.selectionVariant to oNavigationSelVar
		 *              -> add both parameter values to navigationSelVar
		 *
		 * If navigationSelVar is still empty at the end of execution, navigationSelVar is replaced by a copy of
		 * oDefaultedSelVar and the flag bNavSelVarHasDefaultsOnly is set to true. The selection variant
		 * oDefaultedSelVar itself is always returned as is.
		 *
		 * @private
		 *
		 */
		_splitInboundNavigationParameters : function(oSelectionVariant, oStartupParameters, aDefaultedParameters) {

			if (!jQuery.isArray(aDefaultedParameters)) {
				throw new Error("NavigationHandler.INVALID_INPUT");
			}

			var sPropName, i;
			// First we do some parsing of the StartUp Parameters.
			var oStartupParametersAdjusted = {};
			for (sPropName in oStartupParameters){
				if (!oStartupParameters.hasOwnProperty(sPropName)) {
					continue;
				}

				//if (sPropName === this.sSAPSystemProp || sPropName === this.sDefaultedParamProp) {
				if (this._isTechnicalParameter(sPropName)) {
					// Do not add the SAP system parameter to the selection variant as it is a technical parameter
					// not relevant for the selection variant.
					// Do not add the startup parameter for default values to the selection variant. The information, which parameters
					// are defaulted, is available in the defaulted selection variant.
					continue;
				}

				// We support parameters as a map with strings and as a map with value arrays
				if (typeof oStartupParameters[sPropName] === "string") {
					oStartupParametersAdjusted[sPropName] = oStartupParameters[sPropName];
				} else if (jQuery.type(oStartupParameters[sPropName]) === "array" && oStartupParameters[sPropName].length === 1) {
					oStartupParametersAdjusted[sPropName] = oStartupParameters[sPropName][0]; //single-valued parameters
				} else if (jQuery.type(oStartupParameters[sPropName]) === "array" && oStartupParameters[sPropName].length > 1) {
					oStartupParametersAdjusted[sPropName] = oStartupParameters[sPropName]; //multi-valued parameters
				} else {
					throw new Error("NavigationHandler.INVALID_INPUT");
				}
			}

			// Construct two selection variants for defaults and navigation to be returned by the function.
			var oDefaultedSelVar = new SelectionVariant();
			var oNavigationSelVar = new SelectionVariant();

			var aSelVarPropNames = oSelectionVariant.getParameterNames().concat(oSelectionVariant.getSelectOptionsPropertyNames());
			for (i = 0; i < aSelVarPropNames.length; i++) {
				sPropName = aSelVarPropNames[i];
				if (sPropName in oStartupParametersAdjusted) {

					// Resolve conflict.
					if (jQuery.inArray(sPropName, aDefaultedParameters) > -1) {
						oNavigationSelVar.massAddSelectOption(sPropName, oSelectionVariant.getValue(sPropName));
						this._addParameterValues(oDefaultedSelVar, sPropName, "I", "EQ", oStartupParametersAdjusted[sPropName]);
					} else {
						switch (this.sParamHandlingMode) {
							case sap.ui.generic.app.navigation.service.ParamHandlingMode.SelVarWins:
								oNavigationSelVar.massAddSelectOption(sPropName, oSelectionVariant.getValue(sPropName));
								break;
							case sap.ui.generic.app.navigation.service.ParamHandlingMode.URLParamWins:
								this._addParameterValues(oNavigationSelVar, sPropName, "I", "EQ", oStartupParametersAdjusted[sPropName]);
								break;
							case sap.ui.generic.app.navigation.service.ParamHandlingMode.InsertInSelOpt:
								oNavigationSelVar.massAddSelectOption(sPropName, oSelectionVariant.getValue(sPropName));
								this._addParameterValues(oNavigationSelVar, sPropName, "I", "EQ", oStartupParametersAdjusted[sPropName]);
								break;
							default:
								throw new Error("NavigationHandler.INVALID_INPUT");
						}
					}
				} else { // parameter only in SelVar
					if (jQuery.inArray(sPropName, aDefaultedParameters) > -1) {
						oDefaultedSelVar.massAddSelectOption(sPropName, oSelectionVariant.getValue(sPropName));
					} else {
						oNavigationSelVar.massAddSelectOption(sPropName, oSelectionVariant.getValue(sPropName));
					}
				}
			}

			for (sPropName in oStartupParametersAdjusted) {
				// The case where the parameter appears twice has already been taken care of above so we skip it here.
				if (jQuery.inArray(sPropName, aSelVarPropNames) > -1) {
					continue;
				}

				if ((jQuery.inArray(sPropName, aDefaultedParameters) > -1)) {
					this._addParameterValues(oDefaultedSelVar, sPropName, "I", "EQ", oStartupParametersAdjusted[sPropName]);
				} else {
					this._addParameterValues(oNavigationSelVar, sPropName, "I", "EQ", oStartupParametersAdjusted[sPropName]);
				}
			}

			// the selection variant used for navigation should be filled with defaults in case that only defaults exist
			var bNavSelVarHasDefaultsOnly = false;
			if (oNavigationSelVar.isEmpty()) {
				bNavSelVarHasDefaultsOnly = true;
				var aPropNames = oDefaultedSelVar.getSelectOptionsPropertyNames();
				for (i = 0; i < aPropNames.length; i++) {
					oNavigationSelVar.massAddSelectOption(aPropNames[i], oDefaultedSelVar.getValue(aPropNames[i]));
				}
			}

			return {
				oNavigationSelVar : oNavigationSelVar,
				oDefaultedSelVar : oDefaultedSelVar,
				bNavSelVarHasDefaultsOnly : bNavSelVarHasDefaultsOnly
			};
		},

		_addParameterValues : function(oSelVariant, sPropName, sSign, sOption, oValues) {
			if (jQuery.isArray(oValues)){
				for (var i = 0; i < oValues.length; i++) {
					oSelVariant.addSelectOption(sPropName, sSign, sOption, oValues[i]);
				}
			} else {
				oSelVariant.addSelectOption(sPropName, sSign, sOption, oValues);
			}
		},


		/**
		 * Changes the URL according to the current sAppStateKey.
		 * As an reaction route change event will be triggered.
		 * @param {string} sAppStateKey the new app state key.
		 * @public
		 **/
		replaceHash:  function(sAppStateKey) {
			var oHashChanger = this.oRouter.oHashChanger ? this.oRouter.oHashChanger : HashChanger.getInstance();
			var sAppHashOld = oHashChanger.getHash();
			/* use .getHash() here instead of .getAppHash() to also be able dealing with
			 * environments where only SAPUI5 is loaded and the UShell is not initialized properly.
			 */
			var sAppHashNew = this._replaceInnerAppStateKey(sAppHashOld, sAppStateKey);
			oHashChanger.replaceHash(sAppHashNew);
		},

		/**
		 * Changes the URL according to the current app state and stores the app state for later retrieval.
		 * @param {object} mInnerAppData Object containing the current state of the app
		 * @param {string} mInnerAppData.selectionVariant Stringified JSON object as returned, for example, from getDataSuiteFormat() of the SmartFilterBar control
		 * @param {string} [mInnerAppData.tableVariantId] ID of the SmartTable variant
		 * @param {object} [mInnerAppData.customData] Object that can be used to store additional app-specific data
		 * @param {object} [mInnerAppData.presentationVariant] Object containing the current ui state of the app
		 * @param {boolean} [bImmediateHashReplace=true] If set to false, the inner app hash will not be replaced until storing is successful;
		 * do not set to false if you cannot react to the resolution of the Promise, for example, when calling the beforeLinkPressed event
		 * @returns {object} A Promise object to monitor when all the actions of the function have been executed; if the execution is successful, the app state key is returned;
		 * if an error occurs, an object of type {@link sap.ui.generic.app.navigation.service.NavError} is returned
		 * @public
		 * @example
		 * <code>
		 * var oNavigationHandler = new sap.ui.generic.app.navigation.service.NavigationHandler(oController);
		 * var mInnerAppData = {
		 * 		selectionVariant : oSmartFilterBar.getDataSuiteFormat(),
		 * 		tableVariantId : oSmartTable.getCurrentVariantId(),
		 * 		customData : oMyCustomData
		 * };
		 *
		 * var oStoreInnerAppStatePromise = oNavigationHandler.storeInnerAppState(mInnerAppData);
		 *
		 * oStoreInnerAppStatePromise.done(function(sAppStateKey){
		 * 	//your inner app state is saved now, sAppStateKey was added to URL
		 * 	//perform actions that must run after save
		 * });
		 *
		 * oStoreInnerAppStatePromise.fail(function(oError){
		 * 		//some error handling
		 * });
		 * </code>
		 */		
		storeInnerAppState: function(mInnerAppData, bImmediateHashReplace){

			if (typeof bImmediateHashReplace !== "boolean") {
				bImmediateHashReplace = true; //default
			}
			var oNavHandler = this;
			var oMyDeferred = jQuery.Deferred();

			var fnReplaceHash = function(sAppStateKey){
				var oHashChanger = oNavHandler.oRouter.oHashChanger ? oNavHandler.oRouter.oHashChanger : HashChanger.getInstance();
				var sAppHashOld = oHashChanger.getHash();
				/* use .getHash() here instead of .getAppHash() to also be able dealing with
				 * environments where only SAPUI5 is loaded and the UShell is not initialized properly.
				 */
				var sAppHashNew = oNavHandler._replaceInnerAppStateKey(sAppHashOld,sAppStateKey);
				oHashChanger.replaceHash(sAppHashNew);
			};

			// in case mInnerAppState is null, do not overwrite the last saved state
			if (mInnerAppData === null) {
				oMyDeferred.resolve("");
				return oMyDeferred.promise();
			}


			//check if we already saved the same data
			var sAppStateKeyCached = this._oLastSavedInnerAppData.sAppStateKey;

			//check if empty and first save
			if ( jQuery.isEmptyObject(mInnerAppData) && !sAppStateKeyCached) {
				oMyDeferred.resolve("");
				return oMyDeferred.promise();
			}

			var bInnerAppDataEqual = (JSON.stringify(mInnerAppData) === JSON.stringify(this._oLastSavedInnerAppData.oAppData));
			if (bInnerAppDataEqual && sAppStateKeyCached) {
				// passed inner app state found in cache
				this._oLastSavedInnerAppData.iCacheHit++;

				//replace inner app hash with cached appStateKey in url (just in case the app has changed the hash in meantime)
				fnReplaceHash(sAppStateKeyCached);
				oMyDeferred.resolve(sAppStateKeyCached);
				return oMyDeferred.promise();
			}

			// passed inner app state not found in cache
			this._oLastSavedInnerAppData.iCacheMiss++;

			var fnOnAfterSave = function(sAppStateKey){

				//replace inner app hash with new appStateKey in url
				if (!bImmediateHashReplace) {
					fnReplaceHash(sAppStateKey);
				}

				//remember last saved state
				oNavHandler._oLastSavedInnerAppData.oAppData = mInnerAppData;
				oNavHandler._oLastSavedInnerAppData.sAppStateKey = sAppStateKey;
				oMyDeferred.resolve(sAppStateKey);
			};

			var fnOnError = function(oError){
				oMyDeferred.reject(oError);
			};

			var sAppStateKey = this._saveAppState(mInnerAppData, fnOnAfterSave, fnOnError);
			/* Note that _sapAppState may return 'undefined' in case that the parsing
			 * has failed. In this case, we should not trigger the replacement of the App Hash
			 * with the generated key, as the container was not written before.
			 * Note as well that the error handling has already happened before by
			 * making the oMyDeferred promise fail (see fnOnError above).
			 */
			if (sAppStateKey !== undefined) {
				//replace inner app hash with new appStateKey in url
				//note: we do not wait for the save to be completed: this asynchronously behaviour is necessary if
				//this method is called e.g. in a onLinkPressed event with no possibility to wait for the promise resolution
				if (bImmediateHashReplace) {
					fnReplaceHash(sAppStateKey);
				}
			}

			return oMyDeferred.promise();
		},


		/**
		 * Changes the URL according to the current app state and stores the app state for later retrieval.
		 *
		 * @param {object} mInnerAppData Object containing the current state of the app
		 * @param {string} mInnerAppData.selectionVariant Stringified JSON object as returned, for example, from getDataSuiteFormat() of the SmartFilterBar control
		 * @param {string} [mInnerAppData.tableVariantId] ID of the SmartTable variant
		 * @param {object} [mInnerAppData.customData] Object that can be used to store additional app-specific data
		 * @param {object} [mInnerAppData.presentationVariant] Object containing the current ui state of the app
		 * @param {boolean} [bImmediateHashReplace=false] If set to false, the inner app hash will not be replaced until storing is successful;
		 * do not set to false if you cannot react to the resolution of the Promise, for example, when calling the beforeLinkPressed event.
		 * <b>Note:</b>If not provided it will be treated as set to false.
		 * <b>Note:</b>If set to true, the calling instance has to ensure that a follow-on call to <code>replaceHash</code> will take place!
		 *
		 * @returns {Object} An object containing the appStateId and a promise object to monitor when all the actions of the function have been executed; Please note that the appStateKey may be undefined or empty.
		 * if an error occurs, an object of type {@link sap.ui.generic.app.navigation.service.NavError} is returned
		 *
		 * @example
		 * <code>
		 * var oNavigationHandler = new sap.ui.generic.app.navigation.service.NavigationHandler(oController);
		 * var mInnerAppData = {
		 * 		selectionVariant : oSmartFilterBar.getDataSuiteFormat(),
		 * 		tableVariantId : oSmartTable.getCurrentVariantId(),
		 * 		customData : oMyCustomData
		 * };
		 *
		 * var oStoreInnerAppState = storeInnerAppStateWithNonDelayedReturn(mInnerAppData);
		 * var sAppStateKey = oStoreInnerAppState.appStateKey;
		 * if (!sAppStateKey) {
		 *    // no appStateKey obtained...
		 * };
		 * var oStoreInnerAppStatePromise = oStoreInnerAppState.promise;
		 *
		 * oStoreInnerAppStatePromise.done(function(sAppStateKey){
		 * 	//your inner app state is saved now, sAppStateKey was added to URL
		 * 	//perform actions that must run after save
		 * });
		 *
		 * oStoreInnerAppStatePromise.fail(function(oError){
		 * 		//some error handling
		 * });
		 * </code>
		 *
		 *  @public
		 */
		storeInnerAppStateWithImmediateReturn: function(mInnerAppData, bImmediateHashReplace){

			if (typeof bImmediateHashReplace !== "boolean") {
				bImmediateHashReplace = false; //default
			}

			var that = this;
			var oAppStatePromise = jQuery.Deferred();


			// in case mInnerAppState is null, do not overwrite the last saved state
			if (mInnerAppData === null) {
				return {
					appStateKey: "",
					promise: oAppStatePromise.resolve("")
				};
			}


			//check if we already saved the same data
			var sAppStateKeyCached = this._oLastSavedInnerAppData.sAppStateKey;

			//check if empty and first save
			if ( jQuery.isEmptyObject(mInnerAppData) && !sAppStateKeyCached) {
				return {
					appStateKey: "",
					promise: oAppStatePromise.resolve("")
				};
			}

			var bInnerAppDataEqual = (JSON.stringify(mInnerAppData) === JSON.stringify(this._oLastSavedInnerAppData.oAppData));
			if (bInnerAppDataEqual && sAppStateKeyCached) {
				// passed inner app state found in cache
				this._oLastSavedInnerAppData.iCacheHit++;

				//replace inner app hash with cached appStateKey in url (just in case the app has changed the hash in meantime)
				if (bImmediateHashReplace) {
					setTimeout(function() {that.replaceHash(sAppStateKeyCached);}, 70);
				}
				//this.replaceHash(sAppStateKeyCached);
				return {
					appStateKey: sAppStateKeyCached,
					promise: oAppStatePromise.resolve(sAppStateKeyCached)
				};
			}

			// passed inner app state not found in cache
			this._oLastSavedInnerAppData.iCacheMiss++;

			var fnOnAfterSave = function(sAppStateKey){

				//replace inner app hash with new appStateKey in url
				if (!bImmediateHashReplace) {
					that.replaceHash(sAppStateKey);
				}

				//remember last saved state
				that._oLastSavedInnerAppData.oAppData = mInnerAppData;
				that._oLastSavedInnerAppData.sAppStateKey = sAppStateKey;
				oAppStatePromise.resolve(sAppStateKey);
			};

			var fnOnError = function(oError){
				oAppStatePromise.reject(oError);
			};

			var sAppStateKey = this._saveAppState(mInnerAppData, fnOnAfterSave, fnOnError);
			/* Note that _sapAppState may return 'undefined' in case that the parsing
			 * has failed. In this case, we should not trigger the replacement of the App Hash
			 * with the generated key, as the container was not written before.
			 * Note as well that the error handling has already happened before by
			 * making the oMyDeferred promise fail (see fnOnError above).
			 */
//			if (sAppStateKey !== undefined) {
//				//replace inner app hash with new appStateKey in url
//				//note: we do not wait for the save to be completed: this asynchronously behaviour is necessary if
//				//this method is called e.g. in a onLinkPressed event with no possibility to wait for the promise resolution
//				if (bImmediateHashReplace) {
//					fnReplaceHash(sAppStateKey);
//				}
//			}

			return {
				appStateKey: sAppStateKey,
				promise: oAppStatePromise.promise()
			};
		},



		/**
		 * Processes navigation-related tasks related to beforePopoverOpens event handling for the SmartLink control and returns a Promise object.
		 * In particular, the following tasks are performed before the SmartLink popover can be opened:
		 * <ul>
		 * 	<li>If <code>mInnerAppData</code> is provided, this inner app state is saved for back navigation at a later time.</li>
		 * 	<li>The table event parameters (semantic attributes) and the selection variant data are combined by calling the
		 * 			method {@link #.mixAttributesAndSelectionVariant mixAttributesAndSelectionVariant}.</li>
		 * 	<li>The combined data is saved as the cross app state to be handed over to the target app, and the corresponding sap-xapp-state key is set in the URL.</li>
		 * 	<li>All single selections ("including equal") of the combined selection data are passed to the SmartLink popover as semantic attributes.</li>
		 * 	<li>The method <code>oTableEventParameters.open()</code> is called. Note that this does not really open the popover, but the SmartLink control proceeds
		 *			with firing the event <code>navigationTargetsObtained</code>.</li>
		 * </ul>
		 * @param {object} oTableEventParameters The parameters made available by the SmartTable control when the SmartLink control has been clicked, an instance of a PopOver object
		 * @param {string} sSelectionVariant Stringified JSON object as returned, for example, from getDataSuiteFormat() of the SmartFilterBar control
		 * @param {object} [mInnerAppData] Object containing the current state of the app. If provided, opening the Popover is deferred until the inner app data is saved in a consistent way.
		 * @param {string} [mInnerAppData.selectionVariant] Stringified JSON object as returned, for example, from getDataSuiteFormat() of the the SmartFilterBar control; if provided, the selection
		 * is merged into the semantic attributes
		 * @param {string} [mInnerAppData.tableVariantId] ID of the SmartTable variant
		 * @param {object} [mInnerAppData.customData] Object that can be used to store additional app-specific data
		 * @param {object} [mInnerAppData.presentationVariant] Object containing the current ui state of the app
		 * @returns {object} A Promise object to monitor when all actions of the function have been executed; if the execution is successful, the modified oTableEventParameters is returned;
		 * if an error occurs, an error object of type {@link sap.ui.generic.app.navigation.service.NavError} is returned
		 * @public
		 * @example
		 * <code>
		 * //event handler for the smart link event "beforePopoverOpens"
		 * 	onBeforePopoverOpens: function(oEvent) {
		 * 		var oTableEventParameters = oEvent.getParameters();
		 *
		 * 		var mInnerAppData = {
		 * 			selectionVariant : oSmartFilterBar.getDataSuiteFormat(),
		 * 			tableVariantId : oSmartTable.getCurrentVariantId(),
		 * 			customData : oMyCustomData
		 * 		};
		 *
		 * 		var oSelectionVariant = new sap.ui.generic.app.navigation.service.SelectionVariant();
		 * 		oSelectionVariant.addSelectOption("CompanyCode", "I", "EQ", "0001");
		 * 		oSelectionVariant.addSelectOption("Customer", "I", "EQ", "C0001");
		 * 		var sSelectionVariant= oSelectionVariant.toJSONString();
		 *
		 * 		var oNavigationHandler = new sap.ui.generic.app.navigation.service.NavigationHandler(oController);
		 * 		var oSmartLinkPromise = oNavigationHandler.processBeforeSmartLinkPopoverOpens(oTableEventParameters, sSelectionVariant, mInnerAppData);
		 *
		 * 		oSmartLinkPromise.done(function(oTableEventParameters){
		 * 			// here you can add coding that should run after all app states are saved and the semantic attributes are set
		 * 		});
		 *
		 * 		oSmartLinkPromise.fail(function(oError){
		 * 		//some error handling
		 * 		});
		 * };
		 * </code>
		 */
		processBeforeSmartLinkPopoverOpens: function(oTableEventParameters, sSelectionVariant, mInnerAppData){
			var oMyDeferred = jQuery.Deferred();
			var mSemanticAttributes = oTableEventParameters.semanticAttributes;
			var oObj = {}, oPresentationVariant = null, oNavHandler = this;

			if (mInnerAppData && mInnerAppData.presentationVariant) {
				oPresentationVariant = mInnerAppData.presentationVariant;
			}

			var fnStoreXappAndCallOpen = function(mSemanticAttributes, sSelectionVariant){

				//mix the semantic attributes (e.g. from the row line) with the selection variant (e.g. from the filter bar)
				sSelectionVariant = sSelectionVariant || "{}";

				var iSuppressionBehavior = sap.ui.generic.app.navigation.service.SuppressionBehavior.raiseErrorOnNull | sap.ui.generic.app.navigation.service.SuppressionBehavior.raiseErrorOnUndefined;
				/* compatiblity: Until SAPUI5 1.28.5 (or even later) the Smart Link in a Smart Table is
				 * filtering all null- and undefined values. Therefore, mSemanticAttributes are already
				 * reduced appropriately -- this does not need to be done by mixAttributesAndSelectionVariant
				 * again. To ensure that we still have the old behaviour (i.e. an Error is raised in case
				 * that behaviour of the Smart Link control has changed), the "old" Suppression Behaviour is
				 * retained.
				 */

				var oMixedSelVar = oNavHandler.mixAttributesAndSelectionVariant(mSemanticAttributes, sSelectionVariant, iSuppressionBehavior);
				sSelectionVariant = oMixedSelVar.toJSONString();

				//enrich the semantic attributes with single selections from the selection variant
				mSemanticAttributes = oNavHandler._getURLParametersFromSelectionVariant(oMixedSelVar);

				var fnOnContainerSave = function(sAppStateKey){
					//set the stored data in popover and call open()
					oTableEventParameters.setSemanticAttributes(mSemanticAttributes);
					oTableEventParameters.setAppStateKey(sAppStateKey);
					oTableEventParameters.open(); //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> Note that "open" does not open the popover, but proceeds
					//                                                               with firing the onNavTargetsObtained event.
					oMyDeferred.resolve(oTableEventParameters);
				};

				var fnOnError = function(oError){
					oMyDeferred.reject(oError);
				};

				//store the sap-xapp-state
				oObj.selectionVariant = sSelectionVariant;
				if (oPresentationVariant) {
					oObj.presentationVariant = oPresentationVariant;
				}
				oNavHandler._saveAppState(oObj, fnOnContainerSave, fnOnError);
			};

			if (mInnerAppData) {

				var oStoreInnerAppStatePromise = this.storeInnerAppState(mInnerAppData, true);

				//if the inner app state was successfully stored, store also the xapp-state
				oStoreInnerAppStatePromise.done(function(){
					fnStoreXappAndCallOpen(mSemanticAttributes, sSelectionVariant);
				});

				oStoreInnerAppStatePromise.fail(function(oError){
					oMyDeferred.reject(oError);
				});

			} else {
				//there is no inner app state to save, just put the parameters into xapp-state
				fnStoreXappAndCallOpen(mSemanticAttributes, sSelectionVariant);
			}

			return oMyDeferred.promise();
		},


		/** Combines the given parameters and selection variant into a new selection variant containing properties from both, with the parameters
		 * overriding existing properties in the selection variant. The new selection variant does not contain any parameters. All parameters are merged into select options.
		 * The output of this function, converted to a JSON string, can be used for the {@link #.navigate NavigationHandler.navigate} method.
		 * @param {object} mSemanticAttributes Object containing key/value pairs
		 * @param {string} sSelectionVariant The selection variant in string format as provided by the SmartFilterBar control
		 * @param {int} [iSuppressionBehavior=sap.ui.generic.app.navigation.service.SuppressionBehavior.standard] Indicates whether semantic attributes with special values
		 *(see {@link sap.ui.generic.app.navigation.service.SuppressionBehavior suppression behavior}) must be suppressed before they are combined with the selection variant;
		 * several {@link sap.ui.generic.app.navigation.service.SuppressionBehavior suppression behaviors} can be combined with the bitwise OR operator (|)
		 * @returns {object} Instance of {@link sap.ui.generic.app.navigation.service.SelectionVariant}
		 * @public
		 * @example
		 * <code>
		 * var mSemanticAttributes = { "Customer" : "C0001" };
		 * var sSelectionVariant = oSmartFilterBar.getDataSuiteFormat();
		 * var oNavigationHandler = new sap.ui.generic.app.navigation.service.NavigationHandler(oController);
		 * var sNavigationSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(mSemanticAttributes, sSelectionVariant).toJSONString();
		 * // Optionally, you can specify one or several suppression behaviors. Several suppression behaviors are combined with the bitwise OR operator, e.g.
		 * // var iSuppressionBehavior = sap.ui.generic.app.navigation.service.SuppressionBehavior.raiseErrorOnNull | sap.ui.generic.app.navigation.service.SuppressionBehavior.raiseErrorOnUndefined;
		 * // var sNavigationSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(mSemanticAttributes, sSelectionVariant, iSuppressionBehavior).toJSONString();
		 *
		 * oNavigationHandler.navigate("SalesOrder", "create", sNavigationSelectionVariant);
		 * </code>
		 */
		mixAttributesAndSelectionVariant: function(mSemanticAttributes, sSelectionVariant, iSuppressionBehavior){

			if (iSuppressionBehavior === undefined) {
				iSuppressionBehavior = sap.ui.generic.app.navigation.service.SuppressionBehavior.standard;
			}
			var oSelectionVariant = new SelectionVariant(sSelectionVariant);
			var oNewSelVariant = new SelectionVariant();

			//add all semantic attributes to the mixed selection variant
			for (var sPropertyName in mSemanticAttributes){
				if (mSemanticAttributes.hasOwnProperty(sPropertyName)) {
					// A value of a semantic attribute may not be a string, but can be e.g. a date.
					// Since the selection variant accepts only a string, we have to convert it in dependence of the type.
					var vSemanticAttributeValue = mSemanticAttributes[sPropertyName];

					if (jQuery.type(vSemanticAttributeValue) === "array" || jQuery.type(vSemanticAttributeValue) === "object") {
						vSemanticAttributeValue = JSON.stringify(vSemanticAttributeValue);
					} else if ( jQuery.type(vSemanticAttributeValue) === "date"){
						// use the same conversion method for dates as the SmartFilterBar: toJSON()
						vSemanticAttributeValue = vSemanticAttributeValue.toJSON();
					} else if ( jQuery.type(vSemanticAttributeValue) === "number" || jQuery.type(vSemanticAttributeValue) === "boolean") {
						vSemanticAttributeValue = vSemanticAttributeValue.toString();
					}

					if (vSemanticAttributeValue === "") {
						if (iSuppressionBehavior & sap.ui.generic.app.navigation.service.SuppressionBehavior.ignoreEmptyString) {
							jQuery.sap.log.info("Semantic attribute " + sPropertyName + " is an empty string and due to the chosen Suppression Behiavour is being ignored.");
							continue;
						}
					}

					if (vSemanticAttributeValue === null) {
						if (iSuppressionBehavior & sap.ui.generic.app.navigation.service.SuppressionBehavior.raiseErrorOnNull) {
							throw new Error("NavigationHandler.INVALID_INPUT");
						} else {
							jQuery.sap.log.warning("Semantic attribute " + sPropertyName + " is null and ignored for mix in to selection variant");
							continue; // ignore!
						}
					}

					if (vSemanticAttributeValue === undefined) {
						if (iSuppressionBehavior & sap.ui.generic.app.navigation.service.SuppressionBehavior.raiseErrorOnUndefined) {
							throw new Error("NavigationHandler.INVALID_INPUT");
						} else {
							jQuery.sap.log.warning("Semantic attribute " + sPropertyName + " is undefined and ignored for mix in to selection variant");
							continue;
						}
					}

					if (jQuery.type(vSemanticAttributeValue) === "string" ) {
						oNewSelVariant.addSelectOption(sPropertyName, "I", "EQ", vSemanticAttributeValue);
					} else {
						throw new Error("NavigationHandler.INVALID_INPUT");
					}

				}
			}

			//add parameters that are not part of the oNewSelVariant yet
			var aParameters = oSelectionVariant.getParameterNames();
			for (var i = 0; i < aParameters.length; i++) {
				if (!oNewSelVariant.getSelectOption(aParameters[i])) {
					oNewSelVariant.addSelectOption(aParameters[i], "I", "EQ", oSelectionVariant.getParameter(aParameters[i]));
				}
			}

			//add selOptions that are not part of the oNewSelVariant yet
			var aSelOptionNames =  oSelectionVariant.getSelectOptionsPropertyNames();
			for (i = 0; i < aSelOptionNames.length; i++) {
				if (!oNewSelVariant.getSelectOption(aSelOptionNames[i])) {
					var aSelectOption = oSelectionVariant.getSelectOption(aSelOptionNames[i]);
					//add every range in the current select option
					for (var j = 0; j < aSelectOption.length; j++) {
						oNewSelVariant.addSelectOption( aSelOptionNames[i], aSelectOption[j].Sign, aSelectOption[j].Option, aSelectOption[j].Low, aSelectOption[j].High);
					}
				}
			}

			return oNewSelVariant;
		},

		_ensureSelectionVariantFormatString : function(vSelectionVariant) {
			/* There are legacy AppStates where the SelectionVariant is being stored
			 * as a string. However, that is not compliant to the specification, which
			 * states that a standard JS object shall be provided.
			 * Internally, however, the selectionVariant is always of type string.
			 *
			 * Situation           Persistency         internal API
			 * ----------------    ------------------  ---------------------
			 * legacy              string              string
			 * new approach        (JSON) object       string
			 *
			 */

			if (vSelectionVariant === undefined) {
				return undefined;
			}

			var vConvertedSelectionVariant = vSelectionVariant;

			if (typeof vSelectionVariant === "object") {
				vConvertedSelectionVariant = JSON.stringify(vSelectionVariant);
			}

			return vConvertedSelectionVariant;
		},

		_saveAppState: function(oAppData, fnOnAfterSave, fnOnError) {

			var oReturn = this._saveAppStateWithImmediateReturn(oAppData, fnOnError);
			if (oReturn) {

					oReturn.promise.done(function() {
						if (fnOnAfterSave) {						
							fnOnAfterSave(oReturn.appStateKey);
						}
					});
		

				if (fnOnError) {
					var oNavHandler = this;
					oReturn.promise.fail(function() {
						var oError = oNavHandler._createTechnicalError("NavigationHandler.AppStateSave.failed");
						fnOnError(oError);
					});
				}
				return oReturn.appStateKey;
			}
			
			return undefined;
		},		

		
		_saveAppStateWithImmediateReturn: function(oAppData, fnOnError){
			
			var oAppState = this.oCrossAppNavService.createEmptyAppState(this.oComponent);
			var sAppStateKey = oAppState.getKey();

			var oAppDataForSave = { selectionVariant: {}, tableVariantId: "", customData: {}};

			if (oAppData.selectionVariant) {

				/*
				 * The specification states that Selection Variants need to be JSON objects.
				 * However, internally, we work with strings for "selectionVariant". Therefore,
				 * in case that this is a string, we need to JSON-parse the data.
				 */
				if (typeof oAppData.selectionVariant === "string") {
					try {
						oAppDataForSave.selectionVariant = JSON.parse(oAppData.selectionVariant);
					} catch (x) {
						var oError = this._createTechnicalError("NavigationHandler.AppStateSave.parseError");
						if (fnOnError) {
							fnOnError(oError);
						}
						return undefined;
					}
				} else {
					oAppDataForSave.selectionVariant = oAppData.selectionVariant;
				}
			}
			if (oAppData.tableVariantId) {
				oAppDataForSave.tableVariantId = oAppData.tableVariantId;
			}
			if (oAppData.customData) {
				oAppDataForSave.customData = oAppData.customData;
			}
			if (oAppData.presentationVariant) {
				oAppDataForSave.presentationVariant = oAppData.presentationVariant;
			}
			

			oAppState.setData(oAppDataForSave);

			var oSavePromise =  oAppState.save();
			
			return {
				appStateKey: sAppStateKey,
				promise: oSavePromise.promise()
			};				
		},
		
		
		_loadAppState: function(sAppStateKey,oDeferred){

			var oAppStatePromise = this.oCrossAppNavService.getAppState(this.oComponent, sAppStateKey);
			var oNavHandler = this;

			oAppStatePromise.done(function(oAppState){
				var oAppData = { selectionVariant: "{}",
				                 oSelectionVariant: new SelectionVariant(),
				                 oDefaultedSelectionVariant: new SelectionVariant(),
				                 bNavSelVarHasDefaultsOnly: false,
				                 tableVariantId: "",
				                 customData: {},
				                 appStateKey: sAppStateKey,
				                 presentationVariant: {}
				                 };
				var oAppDataLoaded = oAppState.getData();

				if (typeof oAppDataLoaded === "undefined") {
					var oError = oNavHandler._createTechnicalError("NavigationHandler.getDataFromAppState.failed");
					oDeferred.reject(oError, {}, sap.ui.generic.app.navigation.service.NavType.iAppState);
				} else {
					if (oAppDataLoaded.selectionVariant) {
						/* In case that we get an object from the stored AppData (=persistency), we need
						 * to stringify the JSON object.
						 */
						oAppData.selectionVariant = oNavHandler._ensureSelectionVariantFormatString(oAppDataLoaded.selectionVariant);
						oAppData.oSelectionVariant = new SelectionVariant(oAppData.selectionVariant);
					}
					if (oAppDataLoaded.tableVariantId) {
						oAppData.tableVariantId = oAppDataLoaded.tableVariantId;
					}
					if (oAppDataLoaded.customData){
						oAppData.customData = oAppDataLoaded.customData;
					}
					if (oAppDataLoaded.presentationVariant){
						oAppData.presentationVariant = oAppDataLoaded.presentationVariant;
					}
				}

				//resolve is called on passed Deferred object to trigger a call of the done method, if implemented
				//the done method will receive the loaded appState and the navigation type as parameters
				oDeferred.resolve(oAppData, {}, sap.ui.generic.app.navigation.service.NavType.iAppState);
			});
			oAppStatePromise.fail(function(){
				var oError = oNavHandler._createTechnicalError("NavigationHandler.getAppState.failed");
				oDeferred.reject(oError, {}, sap.ui.generic.app.navigation.service.NavType.iAppState);
			});
		},

		/**
		 * Retrieves the parameter value of the sap-iapp-state (the internal apps) from the AppHash string.
		 * It automatically takes care about compatibility between the old and the new approach of
		 * the sap-iapp-state. Precedence is that the new approach is favoured against the old approach.
		 * @param {string} sAppHash the AppHash, which may contain a sap-iapp-state parameter (both old and/or new approach)
		 * @return {string} the value of sap-iapp-state (i.e. the name of the container to retrieve the parameters),
		 * or <code>undefined</code> in case that no sap-iapp-state was found in <code>sAppHash</code>.
		 * @private
		 */
		_getInnerAppStateKey : function(sAppHash) {

			// trivial case: no app hash available at all.
			if (!sAppHash) {
				return undefined;
			}

			/* new approach: separated via question mark / part of the query parameter of the AppHash */
			var aMatches = this._rIAppStateNew.exec(sAppHash);

			/* old approach: spearated via slashes / i.e. part of the route itself */
			if (aMatches === null) {
				aMatches = this._rIAppStateOld.exec(sAppHash);
			}

			/* old approach: special case: if there is no deep route/key defined, the sap-iapp-state may be at the beginning
			 * of the string, without any separation with the slashes
			 */
			if (aMatches === null) {
				aMatches = this._rIAppStateOldAtStart.exec(sAppHash);
			}

			if (aMatches === null) {
				// there is no (valid) sap-iapp-state in the App Hash
				return undefined;
			}

			return aMatches[1];
		},


		/**
		 * Replaces (or inserts) a parameter value (an AppStateKey) for the sap-iapp-state into an existing
		 * AppHash string. Other routes/parameters are ignored and returned without modification ("environmental
		 * agnostic" property).
		 * Only the new approach (sap-iapp-state as query parameter in the AppHash) is being issued.
		 * @param {string} sAppHash the AppHash into which the sap-iapp-state parameter shall be made available
		 * @param {string} sAppStateKey the key value of the AppState which shall be stored as parameter value of
		 * the sap-iapp-state property.
		 * @return {string} the modified sAppHash string, such that the sap-iapp-state has been set based on the
		 * new (query option-based) sap-iapp-state. If a sap-iapp-state has been specified before, the key is replaced.
		 * If <code>sAppHash</code> was of the old format (sap-iapp-state as part of the keys/route), the format is
		 * converted to the new format before the result is returned.
		 * @private
		 */
		_replaceInnerAppStateKey: function(sAppHash,sAppStateKey){
			var sNewIAppState = this.IAPP_STATE + "=" + sAppStateKey;

			/*
			 * generate sap-iapp-states with the new way
			 */
			if (!sAppHash) {
				// there's no sAppHash key yet
				return "?" + sNewIAppState;
			}

			var fnAppendToQueryParameter = function(sAppHash) {
				// there is an AppHash available, but it does not contain a sap-iapp-state parameter yet - we need to append one

				// new approach: we need to check, if a set of query parameters is already available
				if (sAppHash.indexOf("?") !== -1) {
					// there are already query parameters available - append it as another parameter
					return sAppHash + "&" + sNewIAppState;
				}
				// there are no a query parameters available yet; create a set with a single parameter
				return sAppHash + "?" + sNewIAppState;
			};

			if (!this._getInnerAppStateKey(sAppHash)) {
				return fnAppendToQueryParameter(sAppHash);
			}
			// There is an AppHash available and there is already an sap-iapp-state in the AppHash

			if (this._rIAppStateNew.test(sAppHash)) {
				// the new approach is being used
				return sAppHash.replace(this._rIAppStateNew, function(sNeedle) {
					return sNeedle.replace(/\=.*/ig, "=" + sAppStateKey);
				});
			}

			// we need to remove the old AppHash entirely and replace it with a new one.

			var fnReplaceOldApproach = function(rOldApproach, sAppHash) {
				sAppHash = sAppHash.replace(rOldApproach, "");
				return fnAppendToQueryParameter(sAppHash);
			};

			if (this._rIAppStateOld.test(sAppHash)) {
				return fnReplaceOldApproach(this._rIAppStateOld, sAppHash);
			}

			if (this._rIAppStateOldAtStart.test(sAppHash)) {
				return fnReplaceOldApproach(this._rIAppStateOldAtStart, sAppHash);
			}

			jQuery.sap.assert(false, "internal inconsistency: Approach of sap-iapp-state not known, but _getInnerAppStateKey returned it");
			return undefined;
		},

		_getURLParametersFromSelectionVariant : function(vSelectionVariant){
			var mURLParameters = {};
			var i = 0;

			if (typeof vSelectionVariant === "string") {
				var oSelectionVariant = new SelectionVariant(vSelectionVariant);
			} else if (typeof vSelectionVariant === "object") {
				oSelectionVariant = vSelectionVariant;
			} else {
				throw new Error("NavigationHandler.INVALID_INPUT");
			}

			//add URLs parameters from SelectionVariant.SelectOptions (if single value)
			var aSelectProperties = oSelectionVariant.getSelectOptionsPropertyNames();
			for (i = 0; i < aSelectProperties.length; i++) {
				var aSelectOptions = oSelectionVariant.getSelectOption(aSelectProperties[i]);
				if (aSelectOptions.length === 1 && aSelectOptions[0].Sign === "I" && aSelectOptions[0].Option === "EQ") {
						mURLParameters[aSelectProperties[i]] = aSelectOptions[0].Low;
				}
			}

			//add parameters from SelectionVariant.Parameters
			var aParameterNames = oSelectionVariant.getParameterNames();
			for (i = 0; i < aParameterNames.length; i++) {
				var sParameterValue = oSelectionVariant.getParameter(aParameterNames[i]);

				mURLParameters[aParameterNames[i]] = sParameterValue;
			}
			return mURLParameters;
		},

		_createTechnicalError: function(sErrorCode){
			return new Error(sErrorCode);
		},
		
		_createDummyPromise: function(){
			var oMyDeferred = jQuery.Deferred();
			oMyDeferred.resolve("");
			return oMyDeferred.promise();			
		}		
	});


	return NavigationHandler;

});