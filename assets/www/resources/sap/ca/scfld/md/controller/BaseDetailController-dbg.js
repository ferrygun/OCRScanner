/*
 * Copyright (C) 2009-2015 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.require("sap.ui.core.mvc.Controller");
jQuery.sap.require("sap.ca.scfld.md.app.CommonHeaderFooterHelper");
/**
 * @class This class shall be used as the base class for the detail view controllers in
 *     master-detail scenarios.
 * @name sap.ca.scfld.md.controller.BaseDetailController
 * @extends sap.ui.core.mvc.Controller
 * @public
 */
sap.ui.core.mvc.Controller.extend("sap.ca.scfld.md.controller.BaseDetailController", {

	constructor : function () {
		this.oApplicationImplementation = sap.ca.scfld.md.app.Application.getImpl();
		// Make sure that our init-coding is executed even if the App overrides onInit() and does not call
		// onInit() of the super class.
		var fMyOnInit = jQuery.proxy(function () {

			// get routing object for navigation
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			this.oApplicationFacade = sap.ca.scfld.md.app.Application.getImpl().oConfiguration.oApplicationFacade;

			this.oConnectionManager = sap.ca.scfld.md.app.Application.getImpl().getConnectionManager();


			this.oApplicationImplementation.setModels(this);

			// for compatibility reasons. This only affects cases where the App defines the header itself and relies
			// on this piece of code that was entered by mistake
			if (sap.ui.Device.system.phone){
			  var oPage = this.getPage();
			  oPage.setShowNavButton(true);
			  oPage.attachNavButtonPress(this._navBack);
			}

			var oPage = this.getView().getContent()[0];
			oPage.setShowNavButton(sap.ui.Device.system.phone);
			oPage.attachNavButtonPress(this._navBack);

			// --------------------------
			var fMyOnBeforeShow = jQuery.proxy(function (evt) {
				this.oApplicationImplementation.defineDetailHeaderFooter(this);
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

	onInit : function() {
		// do not add any coding here. Just needed in case the App calls onInit() of the super class
	},

	/*
	 * override this method if you have not used the standard way to include the page in the view
	 */
	getPage : function() {
		return sap.ca.scfld.md.app.CommonHeaderFooterHelper.getPageFromController(this);
	},

	/**
	 * Obsolete: Use {@link #setHeaderFooterOptions} in order to explicitly set the header and
	 * footer when they need to be changed.
	 */
	getHeaderFooterOptions : function() {
		return null;
	},

	/**
	 * Sets the detail's page header and footer content.
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
	 * <b>Detail page header part:</b>
	 * <ul>
	 *     <li>{string} <b>oOptions.sI18NDetailTitle</b><br>
	 *     You can provide the i18n-key for the title in the i18n-properties file of the
	 *     application.
	 *     </li>
	 *     <li>{string} <b>oOptions.sDetailTitle</b><br>
	 *     You can also set the title text directly.<br>
	 *     If both are not provided, the i18n-key <code>DETAIL_TITLE</code> will be taken.</li>
	 *     <li>{string} <b>oOptions.sDetailTitleId</b><br>
	 *     An ID for the detail title. This property is supported only if application is configured
	 *     to use stable IDs (see {@link sap.ca.scfld.md.ConfigurationBase#isUsingStableIds}). The
	 *     resulting control ID is relative to the enclosing view ID.
	 *     Ensure that <code>sDetailTitleId</code> is a valid SAPUI5 ID.</li>
	 *     <li>{function} <b>oOptions.onBack</b>
	 *     If the application need to overwrite the default <code>history.back</code> behavior of
	 *     the detail view, the application needs to provide a function that the framework can call.
	 *     If you want to suppress the back button in the detail page, you can set the
	 *     <code>onBack</code> property with value <code>null</code>.
	 *     Framework also hides the back button if the application is not running on a phone or
	 *     if <code>{@link #isMainScreen}()</code> returns <code>true</code></li>
	 *     <li>{object} <b>oOptions.oUpDownOptions</b><br>
	 *     In order to get the up-down buttons in the right upper header, provide the following
	 *     properties:</li>
	 *     <ul>
	 *         <li>{number} <b>oOptions.oUpDownOptions.iPosition</b><br>
	 *         The (0-based) index of the item currently displayed.</li>
	 *         <li>{number} <b>oOptions.oUpDownOptions.iCount</b><br>
	 *         The total number of items.</li>
	 *         <li>{function (iNewIndex)} <b>oOptions.oUpDownOptions.fSetPosition</b><br>
	 *         Callback function that is called when a new item should be displayed. The (0-based)
	 *         index of the new item is passed to this method.</li>
	 *         <li>{string} <b>oOptions.oUpDownOptions.sI18NDetailTitle</b><br>
	 *         Key in your i18n-file which maps to a text with two placeholders (e.g.
	 *         'Order {0} of {1}') that is used as title on desktop and tablet ('Item {0} of {1}'
	 *         is taken as default)</li>
	 *         <li>{string} <b>oOptions.oUpDownOptions.sI18NPhoneTitle</b><br>
	 *         Key in your i18n-file which maps to a text with two placeholders (e.g.
	 *         ' Limit: {0} of {1}') that is used as title on phone ('{0} of {1}' is taken as
	 *         default).</li>
	 *     </ul>
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
	 *    </ul></li>
	 * </ul>
	 * <b>Detail page footer part:</b><br>
	 * <ul>
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
	 *     property <code>url</code> can be left out, because it is set by the scaffolding.
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
	 * @name sap.ca.scfld.md.controller.BaseDetailController#setHeaderFooterOptions
	 * @function
	 */
	setHeaderFooterOptions : function(oOptions) {
		this.oApplicationImplementation.oDHFHelper.setHeaderFooter(this, oOptions);
	},

	/**
	 * Enables/disables the header/footer button based on the given ID.
	 * @param {string} sId
	 *     The ID of the button to be enabled/disabled.
	 * @param {boolean} bEnabled
	 *     The indicator whether the button has to be enabled.
	 * @public
	 * @name sap.ca.scfld.md.controller.BaseDetailController#setBtnEnabled
	 * @function
	 */
	setBtnEnabled : function(sId, bEnabled) {
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
	 * @name sap.ca.scfld.md.controller.BaseDetailController#setBtnText
	 * @function
	 */
	setBtnText : function(sId, sText) {
		if (this._oControlStore.oButtonListHelper) {
			this._oControlStore.oButtonListHelper.setBtnText(sId, sText);
		}
	},

	/**
	 * Gets a reference to the header button on the top right (left in RTL mode) or
	 * <code>null</code> if no header button is defined.
	 *
	 * @returns {object}
	 *     The reference to the header button or <code>null</code>.
	 * @public
	 * @name sap.ca.scfld.md.controller.BaseDetailController#getHeaderBtn
	 * @function
	 */
	getHeaderBtn : function() {
		if (this._oControlStore.oHeaderBtn) {
			return this._oControlStore.oHeaderBtn;
		} else {
			return null;
		}
	},
	/**
	 * Override this method in order to describe whether this view is the main detail (S3) screen
	 * or a screen on deeper hierarchy level.
	 * Note: This method must only return true or false.
	 * The default implementation also returns other values for compatibility reasons.
	 * @returns {boolean}
	 *     Returns <code>true</code> if the application is on the main detail screen.
	 * @public
	 * @name sap.ca.scfld.md.controller.BaseDetailController#isMainScreen
	 * @function
	 */
	isMainScreen : function() {
		if (this._oControlStore.oBackButton) {
			return false;
		}
		// for compatibility reasons in order to distinguish from overridden cases
		return "X";
	},

	_navBack : function() {
		window.history.back();
	}
});
