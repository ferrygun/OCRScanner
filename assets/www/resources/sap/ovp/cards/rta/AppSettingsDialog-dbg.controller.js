sap.ui.define([
    'sap/ui/core/mvc/Controller',
    'sap/ovp/cards/AppSettingsUtils',
], function(Controller, AppSettingsUtils) {
    'use strict';

    return Controller.extend('sap.ovp.cards.rta.AppSettingsDialog', {
        onInit : function() {
            AppSettingsUtils.oResetButton.attachPress(this.onResetButton,this);
        },
        onAfterRendering : function() {
            this.setEnablePropertyForResetAndSaveButton(false);
            this._ovpManifestSettings = this.getView().getModel().getData();
            this._originalOVPManifestSettings = jQuery.extend(true, {}, this._ovpManifestSettings);
        },
        onResetButton : function() {
            this.setEnablePropertyForResetAndSaveButton(false);
            this._ovpManifestSettings = jQuery.extend(true, {} ,this._originalOVPManifestSettings);
            var ovpManifestSettingsModel = new sap.ui.model.json.JSONModel(this._ovpManifestSettings);
            this.getView().setModel(ovpManifestSettingsModel);
            this.getView().getModel().refresh();
        },
        onChange: function() {
            this.setEnablePropertyForResetAndSaveButton(true);
        },
        setEnablePropertyForResetAndSaveButton : function (bEnabled) {
            AppSettingsUtils.oResetButton.setEnabled(bEnabled);
            AppSettingsUtils.oSaveButton.setEnabled(bEnabled);
        }
    });
});