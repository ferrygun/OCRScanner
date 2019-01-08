/*
 * Copyright (C) 2009-2015 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ca.scfld.md.app.CommonHeaderFooterHelper");

/**
 * @class This class shall be used as the base class for the master view controllers in
 *     master-detail scenarios.
 * @name sap.ca.scfld.md.controller.ScfldMasterController
 * @constructor
 * @extends sap.ui.core.mvc.Controller
 * @public
 */
sap.ui.core.mvc.Controller.extend("sap.ca.scfld.md.controller.ScfldMasterController", {
	/**
	 * Clear selection of master list, if needed.
	 * If the list is in MultiSelect mode and the function keepMultiSelection of the configuration
	 * returns true, then the selection is not cleared.
	 * @private
	 */
	_clearSelection : function () {
		var oList = this.getList(),
			bKeepSelection = this._oApplicationImplementation.oConfiguration.keepMultiSelection();
		if (oList && (oList.getMode() !== sap.m.ListMode.MultiSelect || !bKeepSelection)) {
			oList.removeSelections(true);
		}
	},

	_onMasterListChanged : function (oEvent) {
		this._oApplicationImplementation.onMasterChanged(this);
		this.selectItemMatchingTheLastNavigation();
		var oList = this.getList();
		if (oList && oList.getMode() === "MultiSelect" && this._oApplicationImplementation.bManualMasterRefresh === true) {
			oList.removeSelections(true);
		}
		//when filtering and search are used together it can happen that the search activated the emptyList. If subsequently
		//the filtering is removed the emptyList needs to be replaced by the original master list. The search can't do that because
		//commenHeaderFooter handler is not involved in filtering
	if (oList && oList.hasStyleClass("hiddenList") && oList.getBinding("items").getLength() > 0) {
		this.getList().removeStyleClass("hiddenList");
		this._emptyList.addStyleClass("hiddenList");
		}
	},

	_handleItemPress : function (oEvent) {
		this.setListItem(oEvent.getSource());
	},
	_handleSelect : function (oEvent) {
		this.setListItem(oEvent.getParameter("listItem"));
		if (!sap.ui.Device.system.phone) {
			// note: this only applies when device is in
			// portrait mode
			this._oApplicationImplementation.oSplitContainer.hideMaster();
		}
	},
	_onMasterListLoaded : function (oEvent) {
		this.onDataLoaded();
		this._oApplicationImplementation.onMasterRefreshed(this);
		oEvent.oSource.detachChange(this._onMasterListLoaded, this);
		this._bListLoaded = true;
		this.fireEvent("_onMasterListLoaded");
	},
	constructor : function () {
		sap.ui.core.mvc.Controller.apply(this, arguments);

		this._bListLoaded = false;
		var iRequestCount = 0;
		var oConnectionManager = null;
		// Make sure that our init-coding is executed even if the App overrides onInit() and does not call
		// onInit() of the super class.
		var fMyOnInit = jQuery.proxy(function () {
			// get routing object for navigation
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			this._oApplicationImplementation = sap.ca.scfld.md.app.Application.getImpl();
			this.oApplicationFacade = this._oApplicationImplementation.oConfiguration.oApplicationFacade;

			oConnectionManager = this._oApplicationImplementation.getConnectionManager();
			iRequestCount = oConnectionManager.iRequestCount;

			// needed for set item from bookmark navigation
			this.oRouter.attachRoutePatternMatched(function (oEvent) {
				this._sDetailContextPath = undefined;

				if (this.isDetailRoute(oEvent)) {
					this._onDetailMatched(oEvent);
				}
				if (this.isMasterRoute(oEvent)) {
					this._onMasterMatched(oEvent);
				}
			}, this);

			this._iRequestCount = 0;
			var oModel = oConnectionManager.getModel(this.sModelName);
			// if the model could not be created still create header and footer bar, but then return
			if (!oModel) {
				jQuery.sap.log.error("ScfldMasterController", "Initialization stopped, as no model is available");
				return;
			}
			oModel.attachRequestSent(null, function () {
				this._iRequestCount ++;
			}, this);

			oModel.attachRequestCompleted(null, function () {
				this._iRequestCount --;
				//some requests are sent before we attach us, we are only interested when
				//there is no queue after initializing the controller
				if (this._iRequestCount < 0) {
					this._iRequestCount = 0;
				}
				if (this._iRequestCount === 0) {
					this.fireEvent("_allListModelUpdatesCompleted");
				}
			}, this);

			this._oApplicationImplementation.setModels(this);

			this._emptyList = new sap.m.List();
			this._emptyList.addStyleClass("hiddenList");
			this.getPage().addContent(this._emptyList);
			var fMyOnExit = jQuery.proxy(function () {
				if (this._emptyList) {
					var oPage = this.getPage();
					if (oPage) {
						oPage.removeContent(this._emptyList);
					}
					this._emptyList.destroy();
					if (this._oControlStore && this._oControlStore.oMasterSearchField) {
						this._oControlStore.oMasterSearchField.destroy();
						delete this._oControlStore.oMasterSearchField;
					}
				}
			}, this);

			this._oApplicationImplementation.registerExitModule(fMyOnExit);

		}, this);

		var fAppOnInit = jQuery.proxy(this.onInit, this);
		this.onInit = jQuery.proxy(function () {
			fMyOnInit();
			fAppOnInit();
			var oList = this.getList();
			if (oList) {
				var oBinding = oList.getBinding("items");
				this._oApplicationImplementation.setMasterListBinding(this, oBinding);
			}
			// when no request was sent, header and footer will be displayed immediately
			if (iRequestCount == oConnectionManager.iRequestCount) {
				var bAllDisabled = !!oConnectionManager.sErrorInStartMessage;
				this._oApplicationImplementation.oMHFHelper.defineMasterHeaderFooter(this, bAllDisabled);
				if (bAllDisabled) {
					this._bListLoaded = true;
					if (this._oApplicationImplementation.bIsPhone) {
					  var oList = this.getList();
					  if (oList) {
						  oList.setNoDataText(oConnectionManager.sErrorInStartMessage);
					  }
					} else {
						this.showEmptyView(this._oApplicationImplementation.oConfiguration.getDetailTitleKey(), undefined, oConnectionManager.sErrorInStartMessage);
					}
/*					  this.getView().addEventDelegate({
						  onBeforeShow : jQuery.proxy(function () {
					    this.showEmptyView(this._oApplicationImplementation.oConfiguration.getDetailTitleKey(), undefined, oConnectionManager.sErrorInStartMessage);
					  }, this)});
				  } */
			  }
			}
		}, this);
	},

	onInit : function () {
		// do not add any coding here. Just needed in case the App calls onInit() of the super class
	},

	/**
	 * Gets the <code>sap.m.Page</code> instance for the master-detail scenario. Override this
	 * function if you have not used the standard way to include the page in the view.
	 * @returns {sap.m.Page}
	 *    The page instance.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getPage
	 * @function
	 */
	getPage : function () {
		return sap.ca.scfld.md.app.CommonHeaderFooterHelper.getPageFromController(this);
	},

	/**
	 * Returns the list control of the master list.
	 * @returns {sap.m.List}
	 *    The list instance of the master view.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getList
	 * @function
	 */
	getList : function () {
		return this.byId("list");
	},

	/**
	 * Sets the list item and navigates to the corresponding hash.
	 * Maybe overridden.
	 *
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#setListItem
	 * @function
	 */
	setListItem : function (oItem) {
		this._clearSelection();
		oItem.setSelected(true);
		this._navToListItem(oItem);
	},

	/**
	 * Indicates whether the given route information is a detail route.
	 * May be overwritten.
	 *
	 * @param {object} oEvent
	 *     The route matched event object.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#isDetailRoute
	 * @function
	 */
	isDetailRoute : function (oEvent) {
		var sName = oEvent.getParameter("name");
		return sName === this.getDetailRouteName();
	},

	/**
	 * Gets the name of the detail route.
	 * Needs to be overwritten if the name of the route leading to the detail view differs from the
	 * default which is "detail".
	 * @returns {string}
	 *     The name of the detail route.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getDetailRouteName
	 * @function
	 */
	getDetailRouteName : function () {
		return "detail";
	},

	/**
	 * Indicates whether the given route information is a master route.
	 * May be overwritten.
	 * @param {object} oEvent
	 *     The route matched event object.
	 * @returns {boolean}
	 *     Returns <code>true</code> if the route of the route matched event is a master route.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#isMasterRoute
	 * @function
	 */
	isMasterRoute : function (oEvent) {
		var sName = oEvent.getParameter("name");
		return sName === this.getMasterRouteName();
	},

	/**
	 * Gets the name of the master route.
	 * Needs to be overwritten if the name of the route leading to the master view differs from
	 * the default which is "master".
	 * @return {string}
	 *     The name of the route leading to the master view.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getMasterRouteName
	 * @function
	 */
	getMasterRouteName : function () {
		return "master";
	},

	/**
	 * Gets executed when the hash matches the pattern of the master route.
	 * @private
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#_onMasterMatched
	 * @function
	 */
	_onMasterMatched : function (oEvent) {
		//Do nothing on the phone, just show the list
		if (sap.ui.Device.system.phone) {
			return;
		}

		//Handle desktop

		//Wait for the list to load - then select the first item
		if (!this._bListLoaded) {
			this.attachEventOnce("_onMasterListLoaded", function () {
				this.selectFirstItem();
			}, this);
		} else {
			this.selectFirstItem();
		}
	},

	/**
	 * Gets executed when the hash matches the pattern of the detail route.
	 * @private
	 */
	_onDetailMatched : function (oEvent) {
		var sContextPath = this._sDetailContextPath = this.getBindingContextPathFor(oEvent.getParameter("arguments"));
		//List is still getting refreshed
		if (this._iRequestCount > 0) {
			this.attachEventOnce("_allListModelUpdatesCompleted", function () {
				this._handleDetailMatched(sContextPath);
			}, this);
			return;
		}

		//Wait for the list to load - then select the corresponding item
		if (!this._bListLoaded) {
			this.attachEventOnce("_onMasterListLoaded", function () {
				this._handleDetailMatched(sContextPath);
			}, this);
		} else {
			this._handleDetailMatched(sContextPath);
		}
	},

	/**
	 * Checks if the item exists in the list, if it does not it will show the empty view.
	 *@private
	 */
	_handleDetailMatched : function (sContextPath) {
		//no context path was given, an app might not have implemented this. Return before errors happen.
		if (sContextPath === undefined) {
			return;
		}

		var oItem = this.findItemByContextPath(sContextPath);

		//Item was not found
		if (!oItem) {
			//In the desktop case with backend search, the app can try to load more entries, if not the empty view will show up
			if (!sap.ui.Device.system.phone && this.isBackendSearch()) {
				this.applyFilterFromContext(sContextPath);
				return;
			}

			//we show the empty screen as default
			this.noItemFoundForContext(sContextPath);
			return;
		}

		//Clear the list selection in the desktop case.
		if (!sap.ui.Device.system.phone && oItem) {
			this._clearSelection();
			oItem.setSelected(true);
		}
	},

	/**
	 * Selects the last item that was hit by the detail route.
	 * @protected
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#selectItemMatchingTheLastNavigation
	 * @function
	 */
	selectItemMatchingTheLastNavigation : function () {
		var oList = this.getList();
		if (oList.getMode() === "MultiSelect") {
			return;
		}

		if (this._sDetailContextPath === undefined) {
			return;
		}

		var oItem = oList.getSelectedItem();
		var oContext = oItem && oItem.getBindingContext(this.sModelName);

		//If this item is already selected, don't iterate over the whole list again
		if (oContext && oContext.getPath() === this._sDetailContextPath) {
			return;
		}

		oItem = this.findItemByContextPath(this._sDetailContextPath);
		this._clearSelection();
		if (oItem) {
			oItem.setSelected(true);
		}
	},

	/**
	 * Reacts on the case when an item was not found in the list after navigating. The default
	 * implementation shows the empty view.<br>
	 * May be overwritten by the application.
	 * @param {string} sContextPath
	 *    The binding context path.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#noItemFoundForContext
	 * @function
	 */
	noItemFoundForContext : function (sContextPath) {
		if (this._oApplicationImplementation.bIsPhone) {
			var oSplitContainer = this.getSplitContainer();
			oSplitContainer.to(this.getView(), "show");
		} else {
		  this.showEmptyView(null, null, this._oApplicationImplementation.oConnectionManager.sErrorInStartMessage);
		}
	},

	/**
	 * Finds an item by the given context path.
	 * @param {string} sContextPath
	 *    The binding context path.
	 * @returns {sap.m.ListItemBase}
	 *    A list item or <code>null</code> if for given path no item was found.
	 * @protected
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#findItemByContextPath
	 * @function
	 */
	findItemByContextPath : function (sContextPath) {
		var oBindingContext;
		var oList = this.getList();
		var aItems = oList.getItems();

		var result = jQuery.grep(aItems, function (oItem) {
			oBindingContext = oItem.getBindingContext(this.sModelName);

			if (oItem instanceof sap.m.GroupHeaderListItem) {
				return false;
			}

			if (oBindingContext && (oBindingContext.getPath() !== sContextPath)) {
				return false;
			}

			return true;
		});

		return result[0] || null;
	},


	/**
	 * Creates a Binding path from the arguments of the detail route that matches a list item.
	 * May be overwritten by the application.
	 *
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getBindingContextPathFor
	 * @function
	 */
	getBindingContextPathFor : function (oArguments) {
		if (oArguments.contextPath === undefined) {
			jQuery.sap.log.warning("The context path was undefined. If you are using a route without it please overwrite the function getBindingContextPathFor in your master controller.");
			return undefined;
		}

		return "/" + oArguments.contextPath;
	},

	/**
	 * Selects and navigates to the first item of the List.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#selectFirstItem
	 * @function
	 */
	selectFirstItem : function () {
		var oList = this.getList();
		var aItems = oList.getItems();
		var oListItem;

		if (aItems.length < 1) {
			return;
		}
		oListItem = this._oApplicationImplementation.getFirstListItem(this);

		if (oListItem) {
			this.setListItem(oListItem);
		}
	},

	/**
	 * Navigates to a list item and adds a history on the phone. In desktop it is not history
	 * relevant
	 * @private
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#_navToListItem
	 * @function
	 */
	_navToListItem : function (oListItem) {
		this.oRouter.navTo(this.getDetailRouteName(),
				this.getDetailNavigationParameters(oListItem),
				!sap.ui.Device.system.phone);
	},

	/**
	 * Creates the parameters necessary for injecting the values into the detail route of the
	 * application. May be overwritten.
	 * @param {sap.m.ListItemBase} oListItem
	 * @returns {object}
	 *     Returns an object with a property <code>contextPath</code> which contains the binding
	 *     context path for the given list item.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getDetailNavigationParameters
	 * @function
	 */
	getDetailNavigationParameters : function (oListItem) {
		return {
			contextPath : oListItem.getBindingContext(this.sModelName).getPath().substr(1)
		};
	},

	/**
	 * Gets the content for the header and footer of the master view.
	 *
	 * <b>This function is meant to be overridden by the application</b>. It shall return an object
	 * describing the Master page header and footer content. Return <code>null</code> if you want
	 * to define Master page header and footer on your own (default behavior). Otherwise return an
	 * object with properties determining the Master page header and footer.
	 *
	 * <b>Supported properties for buttons defined below:</b>
	 * There are several predefined buttons which you can use on the footer bar or in the header.
	 * If you provide properties below you can overwrite the default values of the predefined
	 * buttons. These properties are also needed for custom-defined buttons. In general, every
	 * button can have the following properties:</p>
	 * <ul>
	 *     <li>{function} <b>onBtnPressed</b><br>
	 *     Callback function of the specific button, that is called if the button is pressed.</li>
	 *     <li>{boolean} <b>bDisabled</b><br>
	 *     An <i>optional</i> property to set the button initially disabled/enabled.</li>
	 *     <li>{string} <b>sI18nBtnTxt</b><br>
	 *     If the button doesn't have a fix predefined text, you can provide the key of the i18n
	 *     text which is used as the text of the button.</li>
	 *     <li>{string} <b>sId</b><br>
	 *     An <i>optional</i> property to set an ID for the specific button. This ID is meant to be
	 *     used in the call of the <code>setBtnEnabled</code> or <code>setBtnText</code> function.
	 *     If you configure your application to use stable IDs
	 *     (see {@link sap.ca.scfld.md.ConfigurationBase#isUsingStableIds}) this ID is used to
	 *     generate a stable ID. Ensure that <code>sId</code> is a valid SAPUI5 ID.</li>
	 *     <li>{string} <b>sTooltip</b><br>
	 *     Optional tooltip for the button. Ensure that the text is localized.
	 * </ul>
	 * The following properties are supported:<br>
	 * <b>Master page header part:</b>
	 * <ul>
	 * <li>{function} <b>onBack</b>
	 * If the application need to overwrite the default <code>history.back</code> behavior of the
	 * master view, the application needs to provide a function that the framework can call.
	 * If you want to suppress the back button in the master page, you can set the
	 * <code>onBack</code> property with value <code>null</code>.</li>
	 * <li>{function (sTempSearchValue, fRefreshCompleted)} <b>onRefresh</b><br>
	 * If the application might want to prevent a refresh of the master list (e.g. because
	 * there are unsaved changes) or if the list is not bound to an OData model but to a JSON model
	 * and the application must do the refresh itself the application might define this callback
	 * function. The <code>onRefresh</code> handler will get the current value of the search field
	 * as first parameter and the framework callback function as second parameter and it has to
	 * return:
	 *     <ul><li><i>&gt;0</i>: which means framework proceeds as usual</li>
	 *     <li><i>0</i>: which means framework shall abort the refresh</li>
	 *     <li><i>&lt;0</i>: which means the application will perform the refresh itself and calls
	 *     the given <code>fRefreshCompleted</code> function when refresh is finished</li></ul>
	 * <li>In the upper right corner of the master list you have the edit button which allows to
	 * toggle between single and multi-select. You can choose one of the following properties:
	 *    <ul>
	 *    <li>{function} <b>onEditPress</b><br>
	 *    You can provide this callback function if you just want to get notified if the edit
	 *    button is pressed.</li>
	 *    <li>{object} <b>oEditBtn</b><br>
	 *    Alternatively you can provide some meta information for the edit button. Only
	 *    <code>sId</code>, <code>bDisabled</code> and <code>onBtnPressed</code> are supported.
	 *    </li>
	 *    </ul>
	 * </li>
	 * <li>{string} <b>sMasterTitleId</b><br>
	 * An ID for the master title. This property is supported only if application is configured to
	 * use stable IDs (see {@link sap.ca.scfld.md.ConfigurationBase#isUsingStableIds}). The
	 * resulting control ID is relative to the enclosing view ID.
	 * Ensure that <code>sMasterTitleId</code> is a valid SAPUI5 ID.</li>
	 * <li>{string} <b>sI18NMasterTitle</b><br>
	 * The i18n-key for the title of the master page in the i18n-properties file of the
	 * application. Note that the corresponding text should possess a placeholder for the number of
	 * displayed items (e.g. <i>Purchase Orders ({0})</i>)</li>
	 * <li>{string} <b>sI18NSearchFieldPlaceholder</b><br>
	 * The i18n-key for the placeholder text to be displayed in the search field. Note that this
	 * property should only be used if you want to display a more specific text then default
	 * (<i>Search</i>). E.g. <i>"Search for Purchase Order ..."</i>. Normally, this will only be
	 * sensible, if backend search is enabled or the application defines a very specific frontend
	 * search.</li>
	 * </ul>
	 * <b>Master page footer part:</b>
	 * <ul>
	 * <li>{array} <b>aAdditionalSettingButtons</b><br>
	 * Array of button definitions which can be added to the technical settings menu (e.g. About,
	 * Login Details and Logout). Every button should have the above listed meta information.</li>
	 * <li>If you want to get the predefined add button, you can choose one of the following
	 * properties:
	 *    <ul>
	 *    <li>{function} <b>onAddPress</b><br>
	 *    You can provide this callback function if you just want to get notified if the <i>add</i>
	 *    button is pressed</li>
	 *    <li>{object} <b>oAddOptions</b><br>
	 *    You can provide meta information for the add button as described above.
	 *    <code>oAddOptions.sI18nBtnTxt</code> cannot be set. The add button does not have a text.
	 *    </li>
	 *    </ul>
	 * </li>
	 * <li>{object} <b>oFilterOptions</b><br>
	 * If you want to get the predefined filter button, you can choose one of the following options
	 * besides the default button properties <code>oFilterOptions.bDisabled</code>,
	 * <code>oFilterOptions.sId</code> and <code>oFilterOptions.sTooltip</code> as described above:
	 *     <ul>
	 *     <li>{function} <b>oFilterOptions.onFilterPressed</b><br>
	 *     Provide the callback function if you only want to get notified if the filter button is
	 *     pressed.</li>
	 *     <li>In case of your filter criterion/item can be represented by simple text with key,
	 *     you can provide the following settings:<br>
	 *         <ul><li>
	 *         {array} <b>oFilterOptions.aFilterItems</b><br>
	 *         An array including the possible filter items with the following properties:
	 *             <ul><li>{string}<b>oFilterOptions.aFilterItems[i].text</b><br>
	 *             The text to be shown to the user.</li>
	 *             <li>{string} <b>oFilterOptions.aFilterItems[i].key</b><br>
	 *             The unique filter key value.</li></ul></li>
	 *        <li>{string} <b>oFilterOptions.sSelectedItemKey</b><br>
	 *        The key value of the default/current selected filter item.</li>
	 *        <li>{function (sKey)} <b>oFilterOptions.onFilterSelected</b><br>
	 *        The callback function for the application, if a filter item is selected. The filter
	 *        key will be passed as as parameter.</li>
	 *        </ul>
	 *     </li></ul>
	 * </li>
	 * <li>{object} <b>oGroupOptions</b><br>
	 * If you want to get the predefined group button, you can choose one of the following options
	 * besides the default button properties <code>oGroupOptions.bDisabled</code>,
	 * <code>oGroupOptions.sId</code> and <code>oGroupOptions.sTooltip</code> as described above:
	 *     <ul>
	 *     <li>{function} <b>oGroupOptions.onGroupPressed</b><br>
	 *     Provide the callback function if you only want to get notified if the group button is
	 *     pressed.</li>
	 *     <li>In case of your group criterion/item can be represented by simple text with key,
	 *     you can provide the following settings:<br>
	 *         <ul><li>
	 *         {array} <b>oGroupOptions.aGroupItems</b><br>
	 *         An array including the possible group items with the following properties:
	 *             <ul><li>{string} <b>oGroupOptions.aGroupItems[i].text</b><br>
	 *             The text to be shown to the user.</li>
	 *             <li>{string}<b>oGroupOptions.aGroupItems[i].key</b><br>
	 *             The unique group key value.</li></ul></li>
	 *        <li>{string} <b>oGroupOptions.sSelectedItemKey</b><br>
	 *        The key value of the default/current selected group item.</li>
	 *        <li>{function (sKey)} <b>oGroupOptions.onGroupSelected</b><br>
	 *        The callback function for the application, if a group item is selected. The group key
	 *        will be passed as as parameter.</li>
	 *        </ul>
	 *     </li></ul>
	 * </li>
	 * <li>{object} <b>oSortOptions</b><br>
	 * If you want to get the predefined sort button, you can choose one of the following options
	 * besides the default button properties <code>oSortOptions.bDisabled</code>,
	 * <code>oSortOptions.sId</code> and <code>oSortOptions.sTooltip</code> as described above:
	 *     <ul>
	 *     <li>{function} <b>oSortOptions.onSortPressed</b><br>
	 *     Provide the callback function if you only want to get notified if the sort button is
	 *     pressed.</li>
	 *     <li>In case of your sort criterion/item can be represented by simple text with key,
	 *     you can provide the following settings:<br>
	 *         <ul><li>
	 *         {array} <b>oSortOptions.aSortItems</b><br>
	 *         An array including the possible sort items with the following properties:
	 *             <ul><li>{string}<b>oSortOptions.aSortItems[i].text</b><br>
	 *             The text to be shown to the user.</li>
	 *             <li>{string} <b>oSortOptions.aSortItems[i].key</b><br>
	 *             The unique sort key value.</li></ul></li>
	 *        <li>{string} <b>oSortOptions.sSelectedItemKey</b><br>
	 *        The key value of the default/current selected sort item.</li>
	 *        <li>{function (sKey)} <b>oSortOptions.onSortSelected</b><br>
	 *        The callback function for the application, if a sort item is selected. The sort key
	 *        will be passed as as parameter.</li>
	 *        </ul>
	 *     </li></ul>
	 * </li>
	 * <li>{array} <b>buttonList</b><br>
	 * A list of buttons which can be defined additionally to the predefined buttons. Each button
	 * needs meta information as described above.</li>
	 * </ul>
	 * @public
	 * @returns {object}
	 *    Returns <code>null</code> or the configuration object for master header and footer
	 *    content as described above.
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getHeaderFooterOptions
	 * @function
	 */
	getHeaderFooterOptions : function () {
		return null;
	},

	/**
	 * Enables/disables the header/footer button based on the given ID.
	 * @param {string} sId
	 *     The ID of the button to be enabled/disabled.
	 * @param {boolean} bEnabled
	 *     The indicator whether the button has to be enabled.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#setBtnEnabled
	 * @function
	 */
	setBtnEnabled : function (sId, bEnabled) {
		if (this._oControlStore.oButtonListHelper) {
			this._oControlStore.oButtonListHelper.setBtnEnabled(sId, bEnabled);
		}
	},

	/**
	 * Updates the header/footer button text based on the given ID.
	 * @param {string} sId
	 *     The ID of the button to be updated.
	 * @param {string} sText
	 *     The new text for the button to be updated.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#setBtnText
	 * @function
	 */
	setBtnText : function (sId, sText) {
		if (this._oControlStore.oButtonListHelper) {
			this._oControlStore.oButtonListHelper.setBtnText(sId, sText);
		}
	},

	/**
	 * Triggers a re-computation to adjust the master footer bar.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#refreshHeaderFooterForEditToggle
	 * @function
	 */
	refreshHeaderFooterForEditToggle : function () {
		this._oApplicationImplementation.oMHFHelper.defineMasterHeaderFooterInner(this);
	},

	/**
	 * A hook for the application to be notified if the master list data has been loaded.
	 * The default implementation does nothing.
	 * Can be overwritten by the application.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#onDataLoaded
	 * @function
	 */
	onDataLoaded : function () {
	},

	/**
	 * Displays the empty detail view with header and info text.
	 * @param {string} sViewTitle
	 *    The application's language model key of the empty detail view's title.
	 * @param {string} sLanguageKey
	 *    Scaffolding's language model key for the empty page text.
	 * @param {string} [sInfoText=undefined]
	 *    Instead of passing <code>sLanguageKey</code>, the text can directly be passed.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#showEmptyView
	 * @function
	 */
	showEmptyView : function (sViewTitle, sLanguageKey, sInfoText) {
		this._clearSelection();

		var oView = this.oRouter.getView(this.getNoDataViewName(), sap.ui.core.mvc.ViewType.XML);
		var oSplitContainer = this.getSplitContainer();

		oSplitContainer.addDetailPage(oView);

		if (!sViewTitle) {
			sViewTitle = this._oApplicationImplementation.oConfiguration.getDetailTitleKey();
		}

		if (!sInfoText) {
			if (!sLanguageKey) {
				sLanguageKey = this._oApplicationImplementation.oConfiguration.getDefaultEmptyMessageKey();
			}
		}
		var oController = oView.getController();
		if (oController.setTitleAndMessage) {
			oController.setTitleAndMessage(sViewTitle, sLanguageKey, sInfoText);
			var oEventData = { };
		} else {
			var oEventData = {
				viewTitle : sViewTitle,
				languageKey : sLanguageKey,
				infoText : sInfoText
			};
		}
		oView.getController().setTitleAndMessage(sViewTitle, sLanguageKey, sInfoText);
		oSplitContainer.to(oView.getId(), "show", oEventData);
		return this;
	},

	/**
	 * Returns the split container, that contains the master view.
	 * @returns {sap.m.SplitContainer}
	 *     Returns the split container instance, that contains the master view.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getSplitContainer
	 * @function
	 */
	getSplitContainer : function () {
		return this._oApplicationImplementation.oSplitContainer;
//		return this.getView().getParent().getParent();
	},

	/**
	 * Gets the name of the empty view.
	 * @returns {string}
	 *     The name of the empty view. Default is "sap.ca.scfld.md.view.empty".
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#getNoDataViewName
	 * @function
	 */
	getNoDataViewName : function () {
		return "sap.ca.scfld.md.view.empty";
	},

	/**
	 * Navigates to the empty view.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#navToEmptyView
	 * @function
	 */
	navToEmptyView : function () {
		this.showEmptyView();
	},

	/**
	 * Applies the current value of the search field to the master list.
	 * Can be overwritten to define a application specific frontend search. Note that in most cases
	 * it is more sensible to override {@link applySearchPatternToListItem}.
	 *
	 * @param {string} sFilterPattern
	 *     The content of the search field.
	 * @return {number}
	 *     The number of list items still visible.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#applySearchPattern
	 * @function
	 */
	applySearchPattern : function (sFilterPattern) {
		sFilterPattern = sFilterPattern.toLowerCase();
		var aListItems = this.getList().getItems();
		var bVisibility;

		var iCount = 0;
		var oGroupItem = null;
		var iCountInGroup = 0;
		for (var i = 0; i < aListItems.length; i++) {
			if (aListItems[i] instanceof sap.m.GroupHeaderListItem) {
				if (oGroupItem) {
					if (iCountInGroup == 0) {
						oGroupItem.setVisible(false);
					} else {
						oGroupItem.setVisible(true);
						oGroupItem.setCount(iCountInGroup);
					}
				}
				oGroupItem = aListItems[i];
				iCountInGroup = 0;
			} else {
				bVisibility = this.applySearchPatternToListItem(aListItems[i], sFilterPattern);
				aListItems[i].setVisible(bVisibility);
				if (bVisibility) {
					iCount++;
					iCountInGroup++;
				}
			}
		}
		//last group check, fix for CSS 0120061532 0003589854 2013
		if (oGroupItem) {
			if (iCountInGroup == 0) {
				oGroupItem.setVisible(false);
			} else {
				oGroupItem.setVisible(true);
				oGroupItem.setCount(iCountInGroup);
			}
		}
		//if search term is set to empty, take the binding length instead of the current visible items due to paging case.
		if (!sFilterPattern) {
			if (this._oMasterListBinding) {
				iCount = this._oMasterListBinding.getLength();
			}
		}
		return iCount;
	},

	/**
	 * This function needs to be overridden in case backend search is active (see
	 * {@link isBackendSearch}). It should modify the list binding such that it reflects the filter
	 * entered in the search field. Sample coding:<br>
	 * <code>
	 * var oFilter = new sap.ui.model.Filter("MyField", sap.ui.model.FilterOperator.EQ, sFilterPattern),
	 *     aFilters = [oFilter];<br>
	 * oBinding.filter(aFilters);
	 * </code>
	 *
	 * @param {string} sFilterPattern
	 *     The content of the search field.
	 * @param {object} oBinding
	 *     The context binding of the list items to be modified.
	 *
	 * List binding needs to be updated with filter parameter -> this will trigger a new oData get
	 * automatically.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#applyBackendSearchPattern
	 * @function
	 */
	applyBackendSearchPattern : function (sFilterPattern, oBinding) {

	},

	/**
	 * Applies filter from given context.
	 * When navigating to the application via bookmark, the bookmarked item might not be part of
	 * the initially loaded list items (usually the case for scenarios where more items exist in
	 * the backend than shown at once in the list). The assumption in this case is that the
	 * backend search is active in order to be able to retrieve further list items. If the check
	 * on the initial list against the navigation context value gives no result, this function is
	 * being called. This function needs to be overridden by the application if this scenario
	 * applies; the application has then to take care about retrieving the correct item via
	 * backend search.
	 * @param {string} sContext
	 *     Contains the hash provided via bookmark navigation or deeplink navigation.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#applyFilterFromContext
	 * @function
	 */
	applyFilterFromContext : function (sContext) {
		this.showEmptyView();
	},

	/**
	 * Applies given search pattern to given list item.
	 * Override this function when defining a custom frontend search. This function will be called
	 * for each list item and decides whether it fulfills the search criteria.
	 *
	 * @param {object} oItem
	 *    The item to be tested.
	 * @param {string} sFilterPattern
	 *    The filter pattern.
	 * @returns {boolean}
	 *    Returns <code>true</code> if the item matches to the current filter pattern.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#applySearchPatternToListItem
	 * @function
	 */
	applySearchPatternToListItem : function (oItem, sFilterPattern) {
		if (sFilterPattern == "") {
			return true;
		}
		var oIteshellata = oItem.getBindingContext(this.sModelName).getProperty();
		for (var sKey in oIteshellata) {
			var sValue = oIteshellata[sKey];
			// if (sValue instanceof Date) {
			// //just for the filter take each number as string
			// sValue = sValue.getDate() + "." +
			// sValue.getMonth() + "." + sValue.getFullYear();
			// }
			if (typeof sValue == "string") {
				if (sValue.toLowerCase().indexOf(sFilterPattern) != -1) {
					return true;
				}
			}
		}
		// if nothing found in unformatted data, check UI
		// elements
		if ((oItem.getIntro() && oItem.getIntro().toLowerCase().indexOf(sFilterPattern) != -1)
				|| (oItem.getTitle() && oItem.getTitle().toLowerCase().indexOf(sFilterPattern) != -1)
				|| (oItem.getNumber() && oItem.getNumber().toLowerCase().indexOf(sFilterPattern) != -1)
				|| (oItem.getNumberUnit() && oItem.getNumberUnit().toLowerCase().indexOf(sFilterPattern) != -1)
				|| (oItem.getFirstStatus() && oItem.getFirstStatus().getText().toLowerCase().indexOf(sFilterPattern) != -1)
				|| (oItem.getSecondStatus() && oItem.getSecondStatus().getText().toLowerCase()
						.indexOf(sFilterPattern) != -1)) {
			return true;
		}
		// last source is attribute array
		var aAttributes = oItem.getAttributes();
		for (var j = 0; j < aAttributes.length; j++) {
			if (aAttributes[j].getText().toLowerCase().indexOf(sFilterPattern) != -1) {
				return true;
			}
		}
		return false;
	},
	/**
	 * @private
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#_applyClientSideSearch
	 * @function
	 */
	_applyClientSideSearch : function () {
		var sFilterPattern = this._oControlStore.oMasterSearchField.getValue();
		var iCount = this.applySearchPattern(sFilterPattern);
		this._oApplicationImplementation.oMHFHelper.setMasterTitle(this, iCount);
		this.evaluateClientSearchResult(iCount, this.getList(), this._emptyList);
	},

	/**
	 * This function is called when a client side search was done. If the search returns 0 hits
	 * an empty list is shown on the master page displaying the "noDataText" of the master List.
	 * If the search returns one or more hits the function makes sure that the master list is
	 * visible and the empty list is hidden.
	 * @param {int} iSearchHitCount
	 *     The number of elements found by the search.
	 * @param {object} oMasterList
	 *     The master list.
	 * @param {object} oEmptyList
	 *     The empty list to be displayed instead of the master list if the search returns no
	 *     results.
	 * @param {string} sNoDataText
	 *     If this parameter is provided it will be used as the "noDataText" during the search.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#evaluateClientSearchResult
	 * @function
	 */
	evaluateClientSearchResult: function (iSearchHitCount, oMasterList, oEmptyList, sNoDataText) {
		var noHitsTxt = sNoDataText;
		if (iSearchHitCount === 0) {
			if (noHitsTxt === null || noHitsTxt === undefined) {
				noHitsTxt = oMasterList.getNoDataText();
			}
			oEmptyList.setNoDataText(noHitsTxt);
			if (!oMasterList.hasStyleClass("hiddenList")) {
				oMasterList.addStyleClass("hiddenList");
			}
			oEmptyList.removeStyleClass("hiddenList");
		} else {
			oMasterList.removeStyleClass("hiddenList");
			if (!oEmptyList.hasStyleClass("hiddenList")) {
				oEmptyList.addStyleClass("hiddenList");
			}

		}
	},

	/**
	 * Determines whether search is triggered with each change of the search field content (or
	 * only when the user explicitly starts the search). Default implementation triggers search
	 * immediately, exactly when backend search is disabled (see {@link isBackendSearch}.
	 * Override this function if you want 'live' search on backend or explicit search on frontend.
	 * @returns {boolean}
	 *    Returns <code>true</code> if live search is used.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#isLiveSearch
	 * @function
	 */
	isLiveSearch : function () {
		return !this.isBackendSearch();
	},

	/**
	 * Determines whether search (triggered by search field) is performed on backend or frontend.
	 * @returns {boolean}
	 *    Returns <code>true</code> if backend search is used. Default is <code>false</code>.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#isBackendSearch
	 * @function
	 */
	isBackendSearch : function () {
		return false;
	},

	/**
	 * Whenever you bind a master list dynamically you have to call this function.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#registerMasterListBind
	 * @function
	 */
	registerMasterListBind : function () {
		var oList = this.getList();
		var oBinding = oList.getBinding("items");
		var oConnectionManager = this._oApplicationImplementation.getConnectionManager();
		var iRequestCount = oConnectionManager.iRequestCount;
		this._oApplicationImplementation.setMasterListBinding(this, oBinding);
		// when no request was sent, header and footer will be displayed immediately
		if (iRequestCount == oConnectionManager.iRequestCount) {
			this._oApplicationImplementation.oMHFHelper.defineMasterHeaderFooter(this);
		}
	},

	/**
	 * Whenever you bind a master list dynamically you have to call this function.
	 * @param {string} sModelName
	 *     The name of the model that is bound dynamically. This must be the same name as defined
	 *     in configuration.js.
	 * @public
	 * @name sap.ca.scfld.md.controller.ScfldMasterController#registerMasterListBinding
	 * @function
	 */
	registerMasterListBinding : function (sModelName) {
		this.sModelName = sModelName;
		this.registerMasterListBind();
	}

});
