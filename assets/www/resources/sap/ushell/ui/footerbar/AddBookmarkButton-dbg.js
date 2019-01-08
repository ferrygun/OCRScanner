/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.footerbar.AddBookmarkButton.
sap.ui.define([
    'sap/m/Button',
    'sap/m/Dialog',
    'sap/m/Input',
    'sap/m/Label',
    'sap/ui/layout/form/SimpleForm',
    'sap/ushell/library',
    'sap/ushell/resources'
], function (Button, Dialog, Input, Label, SimpleForm, library, resources) {
    "use strict";

   /**
    * Constructor for a new ui/footerbar/AddBookmarkButton.
    *
    * @param {string} [sId] id for the new control, generated automatically if no id is given 
    * @param {object} [mSettings] initial settings for the new control
    *
    * @class
    * A button to be displayed in the application footer. Clicking the button opens a dialog box allowing the user to save the app state, so that the app can be launched in this state directly from the launchpad.
    * @extends sap.m.Button
    *
    * @constructor
    * @public
    * @name sap.ushell.ui.footerbar.AddBookmarkButton
    * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
    */
    var AddBookmarkButton = Button.extend("sap.ushell.ui.footerbar.AddBookmarkButton", /** @lends sap.ushell.ui.footerbar.AddBookmarkButton.prototype */ { metadata : {

            library : "sap.ushell",
            properties : {

                /**
                 * A callback function to be called prior to the press handler upon clicking the button.
                 */
                beforePressHandler : {type : "any", group : "Misc", defaultValue : null},

                /**
                 * A callback function to be called after the press handler called upon clicking the button.
                 */
                afterPressHandler : {type : "any", group : "Misc", defaultValue : null},

                /**
                 * Title to be displayed on the tile.
                 */
                title : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * Subtitle to be displayed below the tile title.
                 */
                subtitle : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * Text to be displayed at the bottom of the tile.
                 */
                info : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * Icon to be desplied in the Tile.
                 */
                tileIcon : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * For dynamic tile, the unit to be displayed below the number, for example, USD.
                 */
                numberUnit : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * The keywords based on which the future tile should be indexed and filtered.
                 */
                keywords : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * A customized target URL for the tile.
                 */
                customUrl : {type : "any", group : "Misc", defaultValue : null},

                /**
                 * URL of an OData service from which data should be read.
                 */
                serviceUrl : {type : "any", group : "Misc", defaultValue : null},

                /**
                 * Number of seconds after which dynamic content is read from the data source and the display is refreshed.
                 */
                serviceRefreshInterval : {type : "string", group : "Misc", defaultValue : null},

                /**
                 * Defines whether to display the group selection control within the Save as Tile dialog box.
                 */
                showGroupSelection : {type : "boolean", group : "Misc", defaultValue : true},

                /**
                 * Deprecated – an object containing application information properties.
                 */
                appData : {type : "object", group : "Misc", defaultValue : null}
            }
        }
            });

    /*global sap, jQuery, window, location */

    AddBookmarkButton.prototype.init = function () {

        this.setIcon('sap-icon://add-favorite');
        this.setText(resources.i18n.getText("addToHomePageBtn"));
        this.setEnabled();  // disables button if shell not initialized
        this.oModel = new sap.ui.model.json.JSONModel({
            showGroupSelection: true,
            title : '',
            subtitle: '',
            numberValue : '',
            info: '',
            icon: '',
            numberUnit: '',
            keywords: ''
        });

        var that = this;

        this.attachPress(function () {
            if (that.getBeforePressHandler()) {
                that.getBeforePressHandler()();
            }

            that.showAddBookmarkDialog(function () {
                if (that.getAfterPressHandler()) {
                    that.getAfterPressHandler()();
                }
            });
        });
        //call the parent sap.m.Button init method
        if (Button.prototype.init) {
            Button.prototype.init.apply(this, arguments);
        }
    };

    AddBookmarkButton.prototype.exit = function () {
        if (this.oDialog) {
            this.oDialog.destroy();
        }
        if (this.oModel) {
            this.oModel.destroy();
        }
        //call the parent sap.m.Button exit method
        if (Button.prototype.exit) {
            Button.prototype.exit.apply(this, arguments);
        }
    };

    AddBookmarkButton.prototype.setBookmarkTileView = function (oView) {
        this.bookmarkTileView = oView;
    };
    AddBookmarkButton.prototype.getBookmarkTileView = function () {
        return this.bookmarkTileView;
    };

    AddBookmarkButton.prototype.showAddBookmarkDialog = function (cb) {
        this.oResourceBundle = resources.i18n;
        this.appData = this.getAppData() || {};
        var that = this,
            bIsAppDataEmpty,
            bookmarkTileView;
        this.cb = cb;

        bIsAppDataEmpty = jQuery.isEmptyObject(this.appData);
        bookmarkTileView = sap.ui.view({
            type: sap.ui.core.mvc.ViewType.JS,
            viewName: "sap.ushell.ui.footerbar.SaveAsTile",
            viewData: {
                appData: this.appData,
                serviceUrl: bIsAppDataEmpty ? this.getServiceUrl() : this.appData.serviceUrl,
                customUrl: bIsAppDataEmpty ? this.getCustomUrl() : this.appData.customUrl,
                numberUnit: bIsAppDataEmpty ? this.getNumberUnit() : this.appData.numberUnit,
                serviceRefreshInterval: bIsAppDataEmpty ? this.getServiceRefreshInterval() : this.appData.serviceRefreshInterval,
                keywords: bIsAppDataEmpty ? this.getKeywords() : this.appData.keywords
            }
        });
        if (jQuery.isEmptyObject(this.appData)) {
            bookmarkTileView.setModel(this.oModel);
        }
        that.setBookmarkTileView(bookmarkTileView);

        this.oSimpleForm = new SimpleForm({
            id: 'bookmarkFormId',
            layout: sap.ui.layout.form.SimpleFormLayout.GridLayout,
            content: [bookmarkTileView]
        }).addStyleClass("sapUshellAddBookmarkForm");

        that._openDialog(this.oSimpleForm);

        //on every change in the input verify if there is a text in the input - if so enable ok, otherwise disable
        bookmarkTileView.getTitleInput().attachLiveChange(function () {
            this.setValueState(sap.ui.core.ValueState.NONE);
        });
    };

    AddBookmarkButton.prototype._openDialog = function (oContent) {
        var okButton = new Button('bookmarkOkBtn', {
                text: this.oResourceBundle.getText('okBtn'),
                press: this._handleOkButtonPress.bind(this)
            }),
            cancelButton = new Button('bookmarkCancelBtn', {
                text: this.oResourceBundle.getText('cancelBtn'),
                press: function () {
                    this.oDialog.close();
                    this._restoreDialogEditableValuesToDefault();
                    this.cb();
                }.bind(this)
            });
        this.oDialog = new Dialog({
            id: 'bookmarkDialog',
            title: this.oResourceBundle.getText('addToHomePageBtn'),
            contentWidth: '25rem',
            content: oContent,
            beginButton : okButton,
            endButton: cancelButton,
            stretch: sap.ui.Device.system.phone,
            horizontalScrolling: false,
            afterClose : function () {
                this.oDialog.destroy();
                delete (this.oDialog);
            }.bind(this)
        });
        this.oDialog.open();
        return this.oDialog;
    };

    AddBookmarkButton.prototype.setTitle = function (sTitle) {
        this.setProperty("title", sTitle, true);
        this.oModel.setProperty("/title", sTitle);
    };
    AddBookmarkButton.prototype.setSubtitle = function (sSubtitle) {
        this.setProperty("subtitle", sSubtitle, true);
        this.oModel.setProperty("/subtitle", sSubtitle);
    };
    AddBookmarkButton.prototype.setInfo = function (sInfo) {
        this.setProperty("info", sInfo, true);
        this.oModel.setProperty("/info", sInfo);
    };
    AddBookmarkButton.prototype.setTileIcon = function (sIcon) {
        this.setProperty("tileIcon", sIcon, true);
        this.oModel.setProperty("/icon", sIcon);
    };


    AddBookmarkButton.prototype.setShowGroupSelection = function (bShowGroupSelection) {
        this.setProperty("showGroupSelection", bShowGroupSelection, true);
        this.oModel.setProperty("/showGroupSelection", bShowGroupSelection);
    };

    AddBookmarkButton.prototype.setNumberUnit = function (sNumberUnit) {
        this.setProperty("numberUnit", sNumberUnit, true);
        this.oModel.setProperty("/numberUnit", sNumberUnit);
    };
    AddBookmarkButton.prototype.setKeywords = function (sKeywords) {
        this.setProperty("keywords", sKeywords, true);
        this.oModel.setProperty("/keywords", sKeywords);
    };

    AddBookmarkButton.prototype._restoreDialogEditableValuesToDefault = function () {
        if (this.oModel) {
            this.oModel.setProperty('/title', this.getTitle());
            this.oModel.setProperty('/subtitle', this.getSubtitle());
            this.oModel.setProperty('/info', this.getInfo());
        }
    };

    AddBookmarkButton.prototype._handleOkButtonPress = function () {
        var oTitle,
            oResultPromise,
            oResourceBundle,
            bookmarkTileView = this.getBookmarkTileView(),
            oData = bookmarkTileView.getBookmarkTileData(),
            tileGroup = oData.group ? oData.group.object : "";

        // validate that the mandatory Title field was provided
        if (!oData.title) {
            oTitle = sap.ui.getCore().byId("bookmarkTitleInput");
            if (oTitle) {
                oTitle.setValueState(sap.ui.core.ValueState.Error);
                oTitle.setValueStateText(resources.i18n.getText("bookmarkTitleInputError"));
                return;
            }
        }

        //remove the group object before sending the data to the service
        delete oData.group;

        oResultPromise = sap.ushell.Container.getService("Bookmark").addBookmark(oData, tileGroup);
        oResourceBundle = resources.i18n;
        oResultPromise.done(function () {
            jQuery.proxy(this._restoreDialogEditableValuesToDefault(), this);
            //the tile is added to our model in "_addBookmarkToModel" here we just show the
            //success toast.
            if (sap.ushell.Container) {
                sap.ushell.Container.getService('Message').info(oResourceBundle.getText('tile_created_msg'));
            }
        }.bind(this));
        oResultPromise.fail(function (sMsg) {
            jQuery.sap.log.error(
                "Failed to add bookmark",
                sMsg,
                "sap.ushell.ui.footerbar.AddBookmarkButton"
            );
            if (sap.ushell.Container) {
                sap.ushell.Container.getService('Message').error(oResourceBundle.getText('fail_to_add_tile_msg'));
            }
        });

        this.oDialog.close();
        this.cb();
    };

    AddBookmarkButton.prototype.setEnabled = function (bEnabled) {
        var sState = "",
            bPersonalization = true,
            oShellConfiguration;
        if (sap.ushell.renderers && sap.ushell.renderers.fiori2) {
            oShellConfiguration = sap.ushell.renderers.fiori2.RendererExtensions.getConfiguration();
            if (oShellConfiguration.appState) {
                sState = oShellConfiguration.appState;
            }
            if (oShellConfiguration.enablePersonalization !== undefined) {
                bPersonalization = oShellConfiguration.enablePersonalization;
            }
        }
        if (sState === 'headerless' || sState === 'standalone' || sState === 'embedded' || sState === 'merged' || !bPersonalization) {
            bEnabled = false;
        }
        if (!sap.ushell.Container) {
            if (this.getEnabled()) {
                jQuery.sap.log.warning(
                    "Disabling 'Save as Tile' button: unified shell container not initialized",
                    null,
                    "sap.ushell.ui.footerbar.AddBookmarkButton"
                );
            }
            bEnabled = false;
        }
        Button.prototype.setEnabled.call(this, bEnabled);
        if (!bEnabled) {
            this.addStyleClass("sapUshellAddBookmarkButton");
        }
    };

    return AddBookmarkButton;

});
