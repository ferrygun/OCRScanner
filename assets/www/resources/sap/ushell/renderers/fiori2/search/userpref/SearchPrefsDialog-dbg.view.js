/*global jQuery, sap, document */
sap.ui.define([
    "sap/m/MessageBox"
], function() {
    "use strict";

    // search preferences dialog view
    // =======================================================================
    return sap.ui.jsview("sap.ushell.renderers.fiori2.search.userpref.SearchPrefsDialog", {

        createContent: function(oController) {
            var that = this;

            // label for switch button
            var userProfilingLabel = new sap.m.Label({
                text: sap.ushell.resources.i18n.getText("sp.userProfilingField") + ':'
            });

            // switch button for sessionUserActive (switch on/off user profiling)
            var switchButton = new sap.m.Switch({
                state: {
                    path: "/sessionUserActive",
                    mode: sap.ui.model.BindingMode.TwoWay
                },
                enabled: {
                    parts: [{
                        path: '/searchPrefsActive'
                    }, {
                        path: '/personalizationPolicy'
                    }],
                    formatter: function(searchPrefsActive, personalizationPolicy) {
                        var model = that.getModel();
                        if (searchPrefsActive &&
                            personalizationPolicy !== model.personalizationPolicyEnforced &&
                            personalizationPolicy !== model.personalizationPolicyDisabled) {
                            return true;
                        } else {
                            return false;
                        }
                    },
                    mode: sap.ui.model.BindingMode.OneWay
                },
                ariaLabelledBy: userProfilingLabel
                //change: this.switchChangeHandler.bind(this)
            });

            // reset button
            this.resetButton = new sap.m.Button({
                text: sap.ushell.resources.i18n.getText("sp.clearCollectedData"),
                press: this.resetHistory.bind(this),
                visible: {
                    parts: [{
                        path: '/searchPrefsActive'
                    }, {
                        path: '/personalizationPolicy'
                    }],
                    formatter: function(searchPrefsActive, personalizationPolicy) {
                        var model = that.getModel();
                        if (!searchPrefsActive) {
                            return false;
                        }
                        if (personalizationPolicy === model.personalizationPolicyOptIn ||
                            personalizationPolicy === model.personalizationPolicyOptOut) {
                            return true;
                        }
                        return false;
                    },
                    mode: sap.ui.model.BindingMode.OneWay
                }
            });

            // vertical layout with explanation and disclaimer
            var vLayout = new sap.ui.layout.VerticalLayout({
                content: [
                    new sap.m.Text({
                        text: '{/explanationText}',
                        visible: {
                            parts: [{
                                path: '/searchPrefsActive'
                            }, {
                                path: '/personalizationPolicy'
                            }],
                            formatter: function(searchPrefsActive, personalizationPolicy) {
                                var model = that.getModel();
                                if (!searchPrefsActive) {
                                    return false;
                                }
                                if (personalizationPolicy === model.personalizationPolicyEnforced ||
                                    personalizationPolicy === model.personalizationPolicyDisabled) {
                                    return true;
                                }
                                return false;
                            }
                        }
                    }), new sap.m.Text({
                        text: sap.ushell.resources.i18n.getText('sp.disclaimer')
                    })
                ]
            });

            // assemble
            var content = [userProfilingLabel, switchButton, vLayout, this.resetButton];
            return content;
        },

        resetHistory: function() {
            var that = this;
            this.getModel().resetProfile().then(function() {
                that.resetButton.setEnabled(false);
            }, function(response) {
                var errorText = sap.ushell.resources.i18n.getText('sp.resetFailed');
                if (response.statusText && response.statusText.length > 0 && response.statusText !== 'OK') {
                    errorText += '\n' + response.statusText + '\n' + that.formatErrorResponse(response.responseText);
                }
                sap.m.MessageBox.show(errorText, {
                    title: sap.ushell.resources.i18n.getText("sp.resetFailedTitle"),
                    icon: sap.m.MessageBox.Icon.ERROR,
                    actions: [sap.m.MessageBox.Action.OK]
                });
            });
        },

        formatErrorResponse: function(responseText) {
            var parsedResponseText;
            try {
                parsedResponseText = JSON.parse(responseText);
            } catch (e) {
                return responseText;
            }
            if (!parsedResponseText.ErrorDetails) {
                return responseText;
            }
            var result = [];
            for (var i = 0; i < parsedResponseText.ErrorDetails.length; ++i) {
                var errorDetail = parsedResponseText.ErrorDetails[i];
                result.push(errorDetail.Message + ' (' + errorDetail.Code + ')');
            }
            return result.join('\n');
        },

        switchChangeHandler: function(e) {
            // depreceated confirmation when switch off query log
            var oSwitch = e.getSource();
            if (oSwitch.getState()) {
                return;
            }
            var i18n = sap.ushell.resources.i18n;
            var disableText = i18n.getText("sp.disable");
            sap.m.MessageBox.confirm(i18n.getText('sp.disablingUserProfilingMsg'), {
                title: sap.ushell.resources.i18n.getText("sp.disableUserProfiling"),
                icon: sap.m.MessageBox.Icon.QUESTION,
                actions: [disableText, sap.m.MessageBox.Action.CANCEL],
                onClose: function(oAction) {
                    if (oAction == sap.m.MessageBox.Action.CANCEL) {
                        oSwitch.setState(true);
                    }
                }
            });
        },

        openMessageBox: function() {
            // depreceated confirmation when reseting query log
            var that = this;
            var i18n = sap.ushell.resources.i18n;
            var clearText = i18n.getText("sp.clear");
            sap.m.MessageBox.confirm(i18n.getText('sp.profileWillBeReset'), {
                title: sap.ushell.resources.i18n.getText("sp.clearCollectedData"),
                icon: sap.m.MessageBox.Icon.QUESTION,
                actions: [clearText, sap.m.MessageBox.Action.CANCEL],
                onClose: function(oAction) {
                    if (oAction == clearText) {
                        that.getModel().resetProfile();
                    }
                }
            });
        }

    });

});
