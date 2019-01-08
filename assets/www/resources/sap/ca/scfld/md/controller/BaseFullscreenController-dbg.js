/*
 * Copyright (C) 2009-2015 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ca.scfld.md.app.FullScreenHeaderFooterHelper");
jQuery.sap.require("sap.ca.scfld.md.app.CommonHeaderFooterHelper");

jQuery.sap.require("sap.ca.scfld.md.app.Application");

/**
 * @class This class shall be used as the base class for the fullscreen view controllers in
 *     fullscreen scenarios.
 * @name sap.ca.scfld.md.controller.BaseFullscreenController
 * @extends sap.ui.core.mvc.Controller
 * @public
 */
sap.ui.core.mvc.Controller.extend("sap.ca.scfld.md.controller.BaseFullscreenController", {

	constructor : function () {
		this.oApplicationImplementation = sap.ca.scfld.md.app.Application.getImpl();
		// Make sure that our init-coding is executed even if the App overrides onInit() and does not call
		// onInit() of the super class.
		var fMyOnInit = jQuery.proxy(function () {

			// get routing object for navigation
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			this.oApplicationFacade = this.oApplicationImplementation.oConfiguration.oApplicationFacade;

			this.oConnectionManager = this.oApplicationImplementation.getConnectionManager();

			this.oApplicationImplementation.setModels(this);

			this.oApplicationImplementation.defineFullscreenHeaderFooter(this);

			// --------------------------
			var fMyOnBeforeShow = jQuery.proxy(function (evt) {

			}, this);

			// register for onBeforeShow
			if (typeof this.onBeforeShow === "function") {
				var fAppOnBeforeShow = jQuery.proxy(this.onBeforeShow, this);
				this.onBeforeShow = function (evt) {
					fAppOnBeforeShow(evt);
					fMyOnBeforeShow(evt);
				};
			} else {
				this.getView().addEventDelegate({
					onBeforeShow : jQuery.proxy(function (evt) {
						fMyOnBeforeShow();
					}, this)
				});
			}
			// -------------------------------------
		}, this);

		var fAppOnInit = jQuery.proxy(this.onInit, this);
		this.onInit = function () {
			fMyOnInit();
			fAppOnInit();
		};
	},

	onInit : function () {
		// do not add any coding here. Just needed in case the App calls onInit() of the super class
	},

	/*
	 * override this method if you have not used the standard way to include the page in the view
	 */
	getPage : function () {
		return sap.ca.scfld.md.app.CommonHeaderFooterHelper.getPageFromController(this);
	},

	/**
	 * Obsolete: Use {@link #setHeaderFooterOptions} in order to explicitly set the header and
	 * footer when they need to be changed.
	 */
	getHeaderFooterOptions : function () {
		return null;
	},

	/**
	 * Sets the fullscreen's page header and footer content.
	 * @param {object} oOptions
	 *     An object containing meta information about the content of the header and the footer
	 *     of the detail page.<br>
	 * <b>Supported properties for buttons defined below:</b><br>
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
	 *     <li>{string} <b>sIcon</b><br>
	 *     URL of an icon for the button (usually something like <i>"sap-icon://world"</i>).
	 *     <li>{string} <b>sId</b><br>
	 *     An <i>optional</i> property to set an ID for the specific button. This ID is meant to be
	 *     used in the call of the <code>setBtnEnabled</code> or <code>setBtnText</code> method.
	 *     If you configure your application to use stable IDs
	 *     (see {@link sap.ca.scfld.md.ConfigurationBase#isUsingStableIds}) this ID is used to
	 *     generate a stable ID. Ensure that <code>sId</code> is a valid SAPUI5 ID.</li>
	 *     <li>{string} <b>sTooltip</b><br>
	 *     Optional tooltip for the button. Ensure that the text is localized.
	 * </ul>
	 * The following properties are supported:<br>
	 * <b>Fullscreen page header part:</b>
	 * <ul>
	 *     <li>{string} <b>oOptions.sI18NFullscreenTitle</b><br>
	 *     You can provide the i18n-key for the title in the i18n-properties file of the
	 *     application.
	 *     </li>
	 *     <li>{string} <b>oOptions.sFullscreenTitle</b><br>
	 *     You can also set the title text directly.<br>
	 *     If both are not provided, the i18n-key <code>FULLSCREEN_TITLE</code> will be taken.</li>
	 *     <li>{string} <b>oOptions.sFullscreenTitleId</b><br>
	 *     An ID for the fullscreen title. This property is supported only if application is
	 *     configured to use stable IDs (see
	 *     {@link sap.ca.scfld.md.ConfigurationBase#isUsingStableIds}). The resulting control ID is
	 *     relative to the enclosing view ID.
	 *     Ensure that <code>sFullscreenTitleId</code> is a valid SAPUI5 ID.</li>
	 *     <li>{function} <b>oOptions.onBack</b>
	 *     If the application need to overwrite the default <code>history.back</code> behavior of
	 *     the detail view, the application needs to provide a function that the framework can call.
	 *     If you want to suppress the back button in the detail page, you can set the
	 *     <code>onBack</code> property with value <code>null</code>.</li>
	 *     <li>{function} <b>onFacetFilter</b>
	 *     Callback function, if you need a FacetFilter button on the header.</li>
	 *     <li>{object} <b>oOptions.oHeaderBtnSettings</b><br>
	 *     The definition object for the header button. Only one header button can be defined and
	 *     it will be displayed on the right (left in RTL mode) hand side of the header bar.
	 *     The following settings can be made for the header button:
	 *     <ul>
	 *         <li>{string} <b>oOptions.oHeaderBtnSettings.sIcon</b><br>
	 *         An <i>optional</i> icon that is added to the button.</li>
	 *         <li>{function} <b>oOptions.oHeaderBtnSettings.onBtnPressed</b><br>
	 *         The handler function for the buttons's press event.</li>
	 *         <li>{string} <b>oOptions.oHeaderBtnSettings.sText</b><br>
	 *         An <i>optional</i> static text that is displayed on the button.</li>
	 *         <li>{object} <b>oOptions.oHeaderBtnSettings.oTextBinding</b><br>
	 *         <i>optional</i> if <i>sText</i> is not given the <i>oTextBinding</i> object can be
	 *         used to bind the button's text to a entity in the model using element binding.<br>
	 *         The following settings need to be made:
	 *         <ul>
	 *             <li>{string} <b>oOptions.oHeaderBtnSettings.oTextBinding.elementPath</b><br>
	 *             Path to the element of the model that is used as the binding context.</li>
	 *             <li>{string} <b>oOptions.oHeaderBtnSettings.oTextBinding.property</b><br>
	 *             Name of the property containing the text to be displayed.</li>
	 *             <li>{object} <b>oOptions.oHeaderBtnSettings.oTextBinding.parameters</b><br>
	 *             <i>optional</i> map of additional parameters for the binding (e.g."select" - for
	 *             a full description of possible values check the binding documentation).</li>
	 *         </ul></li>
	 *         <li>{string} <b>oOptions.oHeaderBtnSettings.i18nTxt</b><br>
	 *         <i>optional</i> if <i>sText</i> and <i>oTextBinding</i> are not given <i>i18nTxt</i>
	 *         can be used to fill the button's text from the i18n files. Additionally a different
	 *         text can be defined for phones (see <i>i18nPhoneTxt</i>).</li>
	 *         <li>{string} <b>oOptions.oHeaderBtnSettings.i18nPhoneTxt</b><br>
	 *         <i>optional</i> if <i>sText</i> and <i>oTextBinding</i> are not given
	 *         <i>i18nPhoneTxt</i> can be used to fill the button's text from the i18n files if the
	 *         used device is a phone.</li>
	 *     </ul></li>
	 * </ul>
	 * <b>Fullscreen footer part:</b><br>
	 * <ul>
	 *     <li>{array} <b>oOptions.aAdditionalSettingButtons</b><br>
	 *     Array of button definitions which can be added to the technical settings menu (e.g.
	 *     About, Login Details and Logout). Every button should have the above listed meta
	 *     information.</li>
	 *     <li>{object} <b>oOptions.oFilterOptions</b><br>
	 *     If you want to get the predefined filter button, you can choose one of the following
	 *     options besides the default button properties
	 *     <code>oOptions.oFilterOptions.bDisabled</code>, <code>oOptions.oFilterOptions.sId</code>
	 *     and <code>oOptions.oFilterOptions.sTooltip</code> as described above:
	 *         <ul>
	 *         <li>{function} <b>oOptions.oFilterOptions.onFilterPressed</b><br>
	 *         Provide the callback function if you only want to get notified if the filter button
	 *         is pressed.</li>
	 *         <li>In case of your filter criterion/item can be represented by simple text with key,
	 *         you can provide the following settings:<br>
	 *             <ul><li>
	 *             {array} <b>oOptions.oFilterOptions.aFilterItems</b><br>
	 *             An array including the possible filter items with the following properties:
	 *                 <ul><li>{string}<b>oOptions.oFilterOptions.aFilterItems[i].text</b><br>
	 *                 The text to be shown to the user.</li>
	 *                 <li>{string} <b>oOptions.oFilterOptions.aFilterItems[i].key</b><br>
	 *                 The unique filter key value.</li></ul></li>
	 *            <li>{string} <b>oFilterOptions.sSelectedItemKey</b><br>
	 *            The key value of the default/current selected filter item.</li>
	 *            <li>{function (sKey)} <b>oFilterOptions.onFilterSelected</b><br>
	 *            The callback function for the application, if a filter item is selected. The
	 *            filter key will be passed as as parameter.</li>
	 *            </ul>
	 *         </li></ul>
	 *     </li>
	 *     <li>{object} <b>oOptions.oGroupOptions</b><br>
	 *     If you want to get the predefined group button, you can choose one of the following
	 *     options besides the default button properties
	 *     <code>oOptions.oGroupOptions.bDisabled</code>, <code>oOptions.oGroupOptions.sId</code>
	 *     and <code>oOptions.oGroupOptions.sTooltip</code> as described above:
	 *         <ul>
	 *         <li>{function} <b>oOptions.oGroupOptions.onGroupPressed</b><br>
	 *         Provide the callback function if you only want to get notified if the group button is
	 *         pressed.</li>
	 *         <li>In case of your group criterion/item can be represented by simple text with key,
	 *         you can provide the following settings:<br>
	 *             <ul><li>
	 *             {array} <b>oOptions.oGroupOptions.aGroupItems</b><br>
	 *             An array including the possible group items with the following properties:
	 *                 <ul><li>{string} <b>oOptions.oGroupOptions.aGroupItems[i].text</b><br>
	 *                 The text to be shown to the user.</li>
	 *                 <li>{string}<b>oOptions.oGroupOptions.aGroupItems[i].key</b><br>
	 *             The unique group key value.</li></ul></li>
	 *            <li>{string} <b>oOptions.oGroupOptions.sSelectedItemKey</b><br>
	 *            The key value of the default/current selected group item.</li>
	 *            <li>{function (sKey)} <b>oOptions.oGroupOptions.onGroupSelected</b><br>
	 *            The callback function for the application, if a group item is selected. The group
	 *            key will be passed as as parameter.</li>
	 *            </ul>
	 *         </li></ul>
	 *     </li>
	 *     <li>{object} <b>oSortOptions</b><br>
	 *     If you want to get the predefined sort button, you can choose one of the following
	 *     options besides the default button properties <code>oSortOptions.bDisabled</code>,
	 *     <code>oSortOptions.sId</code> and <code>oSortOptions.sTooltip</code> as described above:
	 *         <ul>
	 *         <li>{function} <b>oSortOptions.onSortPressed</b><br>
	 *         Provide the callback function if you only want to get notified if the sort button is
	 *         pressed.</li>
	 *         <li>In case of your sort criterion/item can be represented by simple text with key,
	 *         you can provide the following settings:<br>
	 *             <ul><li>
	 *             {array} <b>oSortOptions.aSortItems</b><br>
	 *             An array including the possible sort items with the following properties:
	 *                 <ul><li>{string}<b>oSortOptions.aSortItems[i].text</b><br>
	 *                 The text to be shown to the user.</li>
	 *                 <li>{string} <b>oSortOptions.aSortItems[i].key</b><br>
	 *                 The unique sort key value.</li></ul></li>
	 *            <li>{string} <b>oSortOptions.sSelectedItemKey</b><br>
	 *            The key value of the default/current selected sort item.</li>
	 *            <li>{function (sKey)} <b>oSortOptions.onSortSelected</b><br>
	 *            The callback function for the application, if a sort item is selected. The sort
	 *            key will be passed as as parameter.</li>
	 *            </ul>
	 *         </li></ul>
	 *     </li>
	 *     <li>{object} <b>oOptions.oEditBtn</b><br>
	 *     The button for default/recommended action of the view - usually this would be the edit
	 *     button but also other usages are possible.</li>
	 *     <li>{object} <b>oOptions.oPositiveAction</b><br>
	 *     Can be used as the positive button e.g. for "Approve" action in an approval scenario.
	 *     </li>
	 *     <li>{object} <b>oOptions.oNegativeAction</b><br>
	 *     Can be used as the negative button e.g. for "Reject" action in an approval scenario.
	 *     </li>
	 *     <li>{array} <b>oOptions.buttonList</b><br>
	 *     A list of buttons which can be defined additionally to the predefined buttons. Each
	 *     button needs meta information as described above.</li>
	 *     <li>{object} <b>oOptions.oAddBookmarkSettings</b><br>
	 *     Describes the settings for the "Add Bookmark"-button, which should have the same
	 *     parameters provided for "sap.ushell.services.Bookmark" with the exception that the
	 *     property <code>url</code> can be left out, because it is set by scaffolding.
	 *     The bookmark button will be displayed only on the main screen (see {@link #isMainScreen}
	 *     ). Even if there are no settings provided it is displayed. If you don't want to suppress
	 *     that button you have to set <b>oOptions.bSuppressBookmarkButton</b>.</li>
	 *     <li>{boolean} <b>oOptions.bSuppressBookmarkButton</b><br>
	 *     Suppresses the "Add Bookmark"-button from the 'Share' menu if this property is set to
	 *     <code>true</code>.</li>
	 *     <li>{object} <b>oOptions.oEmailSettings</b><br>
	 *     Settings for the Email functionality. Take care that the framework creates a link for
	 *     the e-mail which contains the information below and that some browsers have a length
	 *     restriction for URLs.
	 *        <ul>
	 *            <li>{string} <b>oOptions.oEmailSettings.sSubject</b><br>
	 *            The subject for the e-mail.</li>
	 *            <li>{string} <b>oOptions.oEmailSettings.sRecepient</b><br>
	 *            The e-mail addresses of the recipient as a string.</li>
	 *            <li>{function} <b>oOptions.oEmailSettings.fGetMailBody</b><br>
	 *            A callback function that is called to get the e-mail body text.</li>
	 *        </ul></li>
	 *     <li>{object} <b>oOptions.oJamOptions</b><br>
	 *     The configuration for the "Share in SAP Jam" and the "Discuss in SAP Jam" button.</li>
	 *     <ul>
	 *         <li>You can pass the share settings once or you can provide a callback function that
	 *         is called whenever the "Share" button is pressed.
	 *         <ul>
	 *             <li>{object} <b>oOptions.oJamOptions.oShareSettings</b><br>
	 *             The settings for the "Share in SAP Jam" button, for further allowed settings
	 *             check "sap.collaboration.components.fiori.sharing.Component.setSettings"
	 *             function.</li>
	 *             <li>{function} <b>oOptions.oJamOptions.fGetShareSettings</b><br>
	 *             The callback function for getting the "Share in SAP Jam" button settings. For
	 *             further allowed settings check
	 *             "sap.collaboration.components.fiori.sharing.Component.setSettings" function.
	 *             </li>
	 *         </ul></li>
	 *         <li>You can pass the discuss settings once or you can provide a callback function
	 *         that is called whenever the "Share" button is pressed.
	 *         <ul>
	 *             <li>{object} <b>oOptions.oJamOptions.oDiscussSettings</b><br>
	 *             The settings for the "Discuss in SAP Jam" button, for further allowed settings
	 *             check "sap.collaboration.components.fiori.feed.Component.setSettings"
	 *             function.</li>
	 *             <li>{function} <b>oOptions.oJamOptions.fGetDiscussSettings</b><br>
	 *             The callback function for getting the "Discuss in SAP Jam" button settings. For
	 *             further allowed settings check
	 *             "sap.collaboration.components.fiori.feed.Component.setSettings" function.
	 *             </li>
	 *         </ul></li>
	 *     </ul>
	 *     <li>{array} <b>oOptions.additionalShareButtonList</b><br>
	 *     Contains information about additional buttons in the share menu. Each button needs meta
	 *     information as described above.</li>
	 * </ul>
	 * @public
	 * @name sap.ca.scfld.md.controller.BaseFullscreenController#setHeaderFooterOptions
	 * @function
	 */
	setHeaderFooterOptions : function (oOptions) {
		if (!this._oFullScreenHeaderFooterHelper) {
			this._oFullScreenHeaderFooterHelper = new sap.ca.scfld.md.app.FullScreenHeaderFooterHelper(this.oApplicationImplementation);
		}
		this._oFullScreenHeaderFooterHelper.setHeaderFooter(this, oOptions);
	},

	/**
	 * Enables/disables the header/footer button based on the given ID.
	 * @param {string} sId
	 *     The ID of the button to be enabled/disabled.
	 * @param {boolean} bEnabled
	 *     The indicator whether the button has to be enabled.
	 * @public
	 * @name sap.ca.scfld.md.controller.BaseFullscreenController#setBtnEnabled
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
	 * @name sap.ca.scfld.md.controller.BaseFullscreenController#setBtnText
	 * @function
	 */
	setBtnText : function (sId, sText) {
		if (this._oControlStore.oButtonListHelper) {
			this._oControlStore.oButtonListHelper.setBtnText(sId, sText);
		}
	},

	/**
	 * Refreshes the model
	 */
	_refresh : function (channelId, eventId, data) {

		if (data && data.context) {

			// set context of selected master object
			this.getView().setBindingContext(data.context);

			// scroll to top of page
			// this.getView().byId("page").scrollTo(0);
		}
	},

	_navBack : function () {
		window.history.back();
	},

	/**
	 * Indicates whether this view is the main fullscreen view or a screen on deeper hierarchy
	 * level.
	 * If application supports deeper hierarchy and it should overwrite this function.
	 * Note: This method must only return true or false.
	 * The default implementation also returns other values for compatibility reasons.
	 * @returns {boolean}
	 *     Returns <code>true</code> if the application is on the main fullscreen view.
	 * @public
	 * @name sap.ca.scfld.md.controller.BaseFullscreenController#isMainScreen
	 * @function
	 */
	isMainScreen : function () {
		return true;
	},

	/**
	 * Gets a reference to the header button on the top right (left in RTL mode) or
	 * <code>null</code> if no header button is defined.
	 *
	 * @returns {object}
	 *     The reference to the header button or <code>null</code>.
	 * @public
	 * @name sap.ca.scfld.md.controller.BaseFullscreenController#getHeaderBtn
	 * @function
	 */
	getHeaderBtn : function () {
		if (this._oControlStore.oHeaderBtn) {
			return this._oControlStore.oHeaderBtn;
		}
		return null;
	}
});
