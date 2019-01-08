/* global $, jQuery, sap, window */
sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ushell/renderers/fiori2/search/SearchConfiguration',
    'sap/m/Input'
], function(SearchHelper, SearchConfiguration) {
    "use strict";

    //    sap.ushell.Container.getService("Search").getSina(); //ensure that sina is loaded
    var config = SearchConfiguration.getInstance();
    config.getSina();
    var sinaBaseModule = window.sinabase;

    sap.m.Input.extend('sap.ushell.renderers.fiori2.search.controls.SearchInput', {

        constructor: function(sId, oOptions) {
            var that = this;
            oOptions = jQuery.extend({}, {
                width: '100%',
                showValueStateMessage: false,
                showTableSuggestionValueHelp: false,
                enableSuggestionsHighlighting: false,
                showSuggestion: true,
                filterSuggests: false,
                suggestionColumns: [new sap.m.Column({})],
                placeholder: {
                    path: '/searchTermPlaceholder',
                    mode: sap.ui.model.BindingMode.OneWay
                },
                liveChange: this.handleLiveChange.bind(this),
                suggestionItemSelected: this.handleSuggestionItemSelected.bind(this),
                enabled: {
                    parts: [{
                        path: "/initializingObjSearch"
                    }],
                    formatter: function(initializingObjSearch) {
                        return !initializingObjSearch;
                    }
                }
            }, oOptions);

            // ugly hack disable fullscreen input on phone - start
            var phone = sap.ui.Device.system.phone;
            sap.ui.Device.system.phone = false;
            sap.m.Input.prototype.constructor.apply(this, [sId, oOptions]);
            sap.ui.Device.system.phone = phone;
            // ugly hack - end

            this.bindAggregation("suggestionRows", "/suggestions", function(sId, oContext) {
                return that.suggestionItemFactory(sId, oContext);
            });

            //this.attachLiveChange(this.handleLiveChange.bind(this))
            this.addStyleClass('searchInput');

            //disable fullscreen input on phone
            this._bUseDialog = false;
            this._bFullScreen = false;

            this._ariaDescriptionIdNoResults = sId + "-No-Results-Description";
        },

        renderer: 'sap.m.InputRenderer',

        onsapenter: function(event) {
            if (!(this._oSuggestionPopup && this._oSuggestionPopup.isOpen() && this._iPopupListSelectedIndex >= 0)) {
                // check that enter happened in search input box and not on a suggestion item
                // enter on a suggestion is not handled in onsapenter but in handleSuggestionItemSelected
                this.getModel().invalidateQuery();
                this.triggerSearch(event);
            }
            sap.m.Input.prototype.onsapenter.apply(this, arguments);
        },

        triggerSearch: function(oEvent) {
            var that = this;
            SearchHelper.subscribeOnlyOnce('triggerSearch', 'allSearchFinished', function() {
                that.getModel().autoStartApp();
            }, that);
            var searchBoxTerm = that.getValue();
            if (searchBoxTerm.trim() === '') {
                searchBoxTerm = '*';
            }
            that.getModel().setSearchBoxTerm(searchBoxTerm, false);
            that.navigateToSearchApp();
            that.destroySuggestionRows();
            that.getModel().abortSuggestions();
        },

        handleLiveChange: function(oEvent) {
            var suggestTerm = this.getValue();
            var oModel = this.getModel();
            oModel.setSearchBoxTerm(suggestTerm, false);
            if (oModel.getSearchBoxTerm().length > 0) {
                oModel.doSuggestion();
            } else {
                this.destroySuggestionRows();
                oModel.abortSuggestions();
            }
        },

        handleSuggestionItemSelected: function(oEvent) {

            var oModel = this.getModel();
            var searchBoxTerm = oModel.getSearchBoxTerm();
            var suggestion = oEvent.getParameter('selectedRow').getBindingContext().getObject();
            var suggestionTerm = suggestion.labelRaw;
            var dataSource = suggestion.dataSource;
            var targetURL = suggestion.url;
            var type = suggestion.type;

            oModel.eventLogger.logEvent({
                type: oModel.eventLogger.SUGGESTION_SELECT,
                suggestionType: type,
                suggestionTitle: suggestion.title,
                suggestionTerm: '' + suggestionTerm, // suggestionTerm may be datasource object
                searchTerm: searchBoxTerm,
                targetUrl: targetURL,
                dataSourceKey: dataSource.key
            });

            switch (type) {
                case sinaBaseModule.SuggestionType.APPS:
                    // app suggestions -> start app

                    // starting the app by hash change closes the suggestion popup
                    // closing the suggestion popup again triggers the suggestion item selected event
                    // in order to avoid to receive the event twice the suggestions are destroyed
                    this.destroySuggestionRows();
                    oModel.abortSuggestions();

                    if (targetURL[0] === '#') {
                        if (targetURL.indexOf('#Action-search') === 0 && targetURL === decodeURIComponent(SearchHelper.getHashFromUrl())) {
                            // ugly workaround
                            // in case the app suggestion points to the search app with query identical to current query
                            // --> do noting except: restore query term + focus again the first item in the result list
                            oModel.setSearchBoxTerm(oModel.getLastSearchTerm(), false);
                            sap.ui.getCore().getEventBus().publish("allSearchFinished");
                            return;
                        }
                        if (window.hasher) {
                            window.hasher.setHash(targetURL);
                        } else {
                            window.location.href = targetURL;
                        }
                    } else {
                        window.open(targetURL, '_blank');
                        oModel.setSearchBoxTerm('', false);
                        this.setValue('');
                        this.focus();
                    }

                    // close the search field if suggestion is not search app
                    if (targetURL.indexOf('#Action-search') !== 0) {
                        sap.ui.require("sap/ushell/renderers/fiori2/search/SearchShellHelper").setSearchState('COL');
                    }
                    break;
                case sinaBaseModule.SuggestionType.DATASOURCE:
                    // data source suggestions
                    // -> change datasource in dropdown
                    // -> do not start search
                    oModel.setDataSource(dataSource, false);
                    oModel.setSearchBoxTerm('', false);
                    this.setValue('');
                    this.focus();
                    break;
                case sinaBaseModule.SuggestionType.OBJECTDATA:
                    // object data suggestion
                    // -> change search term + change datasource + start search
                    oModel.setDataSource(dataSource, false);
                    oModel.setSearchBoxTerm(suggestionTerm, false);
                    this.navigateToSearchApp();
                    this.setValue(suggestionTerm);
                    break;
                case sinaBaseModule.SuggestionType.HISTORY:
                    // history
                    // -> change search term + change datasource + start search
                    oModel.setDataSource(dataSource, false);
                    oModel.setSearchBoxTerm(suggestionTerm, false);
                    this.navigateToSearchApp();
                    this.setValue(suggestionTerm);
                    break;
                default:
                    break;
            }
        },

        suggestionItemFactory: function(sId, oContext) {

            // static prefix app only for app suggestions
            var that = this;
            var app = new sap.m.Label({
                text: {
                    path: "icon",
                    formatter: function(sValue) {
                        if (sValue) {
                            return "<i>" + sap.ushell.resources.i18n.getText("label_app") + "</i>";
                        }
                        return "";
                    }
                }
            }).addStyleClass('suggestText').addStyleClass('suggestNavItem').addStyleClass('suggestListItemCell');
            app.addEventDelegate({
                onAfterRendering: function() {
                    SearchHelper.boldTagUnescaper(this.getDomRef());
                }
            }, app);

            // suggestion icon (only filled for app suggestions)
            var icon = new sap.ui.core.Icon({
                src: "{icon}"
            }).addStyleClass('suggestIcon').addStyleClass('sapUshellSearchSuggestAppIcon').addStyleClass('suggestListItemCell');

            // create label with suggestions term
            var label = new sap.m.Text({
                text: "{label}",
                layoutData: new sap.m.FlexItemData({
                    shrinkFactor: 1,
                    minWidth: "4rem"
                }),
                wrapping: false
            }).addStyleClass('suggestText').addStyleClass('suggestNavItem').addStyleClass('suggestListItemCell');
            label.addEventDelegate({
                onAfterRendering: function() {
                    SearchHelper.boldTagUnescaper(this.getDomRef());
                }
            }, label);

            // combine app, icon and label into cell

            var cell = new sap.m.CustomListItem({
                type: sap.m.ListType.Active,
                content: new sap.m.FlexBox({
                    items: [app, icon, label]
                })
            });
            var suggestion = oContext.oModel.getProperty(oContext.sPath);
            cell.getText = function() {
                return (typeof suggestion.labelRaw) === 'string' ? suggestion.labelRaw : that.getValue();
            };
            var listItem = new sap.m.ColumnListItem({
                cells: [cell],
                type: "Active"
            });
            if (suggestion.type === sinaBaseModule.SuggestionType.APPS) {
                if (suggestion.title && suggestion.title.indexOf("combinedAppSuggestion") >= 0) {
                    listItem.addStyleClass('searchCombinedAppSuggestion');
                } else {
                    listItem.addStyleClass('searchAppSuggestion');
                }
            }
            if (suggestion.type === sinaBaseModule.SuggestionType.DATASOURCE) {
                listItem.addStyleClass('searchDataSourceSuggestion');
            }
            if (suggestion.type === sinaBaseModule.SuggestionType.OBJECTDATA) {
                listItem.addStyleClass('searchBOSuggestion');
            }
            if (suggestion.type === sinaBaseModule.SuggestionType.HISTORY) {
                listItem.addStyleClass('searchHistorySuggestion');
            }
            listItem.addStyleClass('searchSuggestion');
            listItem.addEventDelegate({
                onAfterRendering: function(e) {
                    var cells = listItem.$().find('.suggestListItemCell');
                    var totalWidth = 0;
                    cells.each(function(index) {
                        totalWidth += $(this).outerWidth(true);
                    });
                    if (totalWidth > listItem.$().find('li').get(0).scrollWidth) { // is truncated
                        listItem.setTooltip($(cells[0]).text() + " " + $(cells[2]).text());
                    }
                }
            });
            return listItem;
        },

        navigateToSearchApp: function() {

            if (SearchHelper.isSearchAppActive()) {
                // app running -> just fire query
                this.getModel()._firePerspectiveQuery();
            } else {
                // app not running -> start via hash
                // change hash:
                // -do not use Searchhelper.hasher here
                // -this is starting the search app from outside
                var sHash = this.getModel().createSearchURL();
                window.location.hash = sHash;
            }

        },

        getAriaDescriptionIdForNoResults: function() {
            return this._ariaDescriptionIdNoResults;
        },

        onAfterRendering: function(oEvent) {
            var $input = $(this.getDomRef()).find("#searchFieldInShell-input-inner");
            $(this.getDomRef()).find('input').attr('autocomplete', 'off');
            $(this.getDomRef()).find('input').attr('autocorrect', 'off');
            // additional hacks to show the "search" button on ios keyboards:
            $(this.getDomRef()).find('input').attr('type', 'search');
            $(this.getDomRef()).find('input').attr('name', 'search');
            var $form = jQuery('<form action="" onsubmit="return false;"></form>');
            $(this.getDomRef()).children('input').parent().append($form);
            $(this.getDomRef()).children('input').detach().appendTo($form);
            // end of iOS hacks
            $input.attr("aria-describedby", $input.attr("aria-describedby") + " " + this._ariaDescriptionIdNoResults);
        },

        onValueRevertedByEscape: function(sValue) {
            // this method is called if ESC was pressed and
            // the value in it was not empty
            if (SearchHelper.isSearchAppActive()) {
                // dont delete the value if search app is active
                return;
            }
            this.setValue(" "); // add space as a marker for following ESC handler
        }


    });

});
