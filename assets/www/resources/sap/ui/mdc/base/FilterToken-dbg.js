sap.ui.define(['jquery.sap.global', 'sap/ui/base/ManagedObject', 'sap/m/Token', 'sap/m/Tokenizer'],
	function(jQuery, ManagedObject, Token, Tokenizer) {
		"use strict";

		/**
		 * Constructor for a new FilterToken.
		 * A FilterToken is used in a FilterField to visualize a condition.
		 *
		 * @param {string} [sId] id for the new control, generated automatically if no id is given
		 * @param {object} [mSettings] initial settings for the new control
		 *
		 * @class
		 *
		 * @extends sap.m.Token
		 *
		 * @author SAP SE
		 * @version 1.52.4
		 *
		 * @constructor
		 * @alias sap.ui.mdc.base.FilterToken
		 * @author SAP SE
		 * @version 1.52.4
		 * @since 1.48.0
		 *
		 * @private
		 */
		var FilterToken = Token.extend("sap.ui.mdc.base.FilterToken", /** @lends sap.ui.mdc.base.FilterToken.prototype */ {
			metadata: {
				library: "sap.ui.mdc",
				properties: {

					/**
					 * Indicates that the token text can be edited by the user.
					 */
					changeable: {
						type: "boolean",
						defaultValue: false
					}
				},
				events: {
					/**
					 * This event is fired if a token changed.
					 */
					tokenChanged: {
						parameters: {
							text: {
								type: "string"
							}
						}
					}
				}
			}
		});
		//initialize some state
		FilterToken.prototype.init = function() {
			Token.prototype.init.apply(this);
			this.bAllowTextSelection = true;
			this._bEditing = false; //becomes true if the user starts editing the token text
		};

		FilterToken.prototype.setParent = function(oParent) {
			if (oParent instanceof Tokenizer) {
				oParent.bAllowTextSelection = true;
			}
			ManagedObject.prototype.setParent.apply(this, arguments);
		};

		/**
		 * Sets the text of the filter token to the given value
		 * @param {string} sValue the new text of the token
		 * @return {sap.ui.base.ManagedObject} <code>this</code> to allow method chaining
		 * @public
		 */
		FilterToken.prototype.setText = function(sValue) {
			Token.prototype.setText.call(this, sValue, true);
			this.getDomRef() && (this.getDomRef().firstChild.innerText = this.getText());
			return this;
		};

		// activates the input field within the filter token.
		FilterToken.prototype._activateInput = function() {
			if (!this._bEditing) {
				var oInput = this.getDomRef().firstChild;
				oInput.tabIndex = "0";
				oInput.focus();
				oInput.setAttribute("contenteditable", "true");
				this._bEditing = true;
				this.$().addClass("sapMTokenEditing");
			}
		};

		// deactivates the input field within the filter token.
		FilterToken.prototype._deactivateInput = function() {
			this.getDomRef().firstChild.tabIndex = "-1";
			this.focus();
			var oInput = this.getDomRef().firstChild;
			var sText = oInput.innerText;
			if (sText !== this.getText()) {
				var sOldText = this.getText();
				this.setText(this.getDomRef().firstChild.innerText);
				this.fireTokenChanged({
					text: this.getText(),
					oldText: sOldText
				});
			}
			this._bEditing = false;
			oInput.removeAttribute("contenteditable");
			this.$().removeClass("sapMTokenEditing");
		};

		/**
		 * Function is called when token is pressed to select/deselect token.
		 *
		 * @param {jQuery.Event} oEvent
		 *
		 * @private
		 */
		FilterToken.prototype._onTokenPress = function(oEvent) {
			var bSelected = this.getSelected(),
				bCtrlKey = oEvent.ctrlKey || oEvent.metaKey,
				bShiftKey = oEvent.shiftKey;
			Token.prototype._onTokenPress.apply(this, arguments);
			if (bSelected && this.getChangeable() && !bCtrlKey && !bShiftKey) {
				this._activateInput();
			}
		};

		/**
		 * Event handler called when control is loosing the focus, removes selection from token
		 *
		 * @param {jQuery.Event} oEvent
		 * @private
		 */
		FilterToken.prototype.onsapfocusleave = function(oEvent) {
			if (this._bEditing) {
				this._deactivateInput();
			} else {
				this._callBaseEventHandler(oEvent, "onsapfocusleave");
			}
		};

		/**
		 * Event handler called when user presses the return/enter key
		 *
		 * @param {jQuery.Event} oEvent
		 * @private
		 */
		FilterToken.prototype.onsapenter = function(oEvent) {
			if (this._bEditing) {
				this._deactivateInput();
			} else {
				this._callBaseEventHandler(oEvent, "onsapfocusleave");
			}
		};

		/**
		 * Event handler called when the entered a text in the input
		 *
		 * @param {jQuery.Event} oEvent
		 * @private
		 */
		FilterToken.prototype.oninput = function(oEvent) {
			if (this._bEditing || oEvent.target === this.getDomRef().firstChild) {
				oEvent.stopImmediatePropagation();
			} else {
				this._callBaseEventHandler(oEvent, "oninput");
			}
		};

		/**
		 * Event handler called when key down happend on the
		 *
		 * @param {jQuery.Event} oEvent
		 * @private
		 */
		FilterToken.prototype.onkeydown = function(oEvent) {
			if (this._bEditing || oEvent.target === this.getDomRef().firstChild) {
				oEvent.stopImmediatePropagation();
				if (oEvent.keyCode === jQuery.sap.KeyCodes.F2) {
					this._deactivateInput();
				}
			} else {
				if (this.getChangeable() && oEvent.keyCode === jQuery.sap.KeyCodes.F2) {
					this._activateInput();
				}
				this._callBaseEventHandler(oEvent, "onkeydown");
			}
		};

		FilterToken.prototype.onsapspace = function(oEvent) {
			if (this._bEditing || oEvent.target === this.getDomRef().firstChild) {
				oEvent.stopImmediatePropagation();
			} else {
				this._callBaseEventHandler(oEvent, "onsapspace");
			}
		};

		FilterToken.prototype.onsapescape = function(oEvent) {
			if (this._bEditing || oEvent.target === this.getDomRef().firstChild) {
				this._deactivateInput();
				oEvent.stopImmediatePropagation();
			} else {
				this._callBaseEventHandler(oEvent, "onsapescape");
			}
		};

		FilterToken.prototype.onkeyup = function(oEvent) {
			if (this._bEditing || oEvent.target === this.getDomRef().firstChild) {
				oEvent.stopImmediatePropagation();
			} else {
				this._callBaseEventHandler(oEvent, "onkeyup");
			}
		};

		FilterToken.prototype._callBaseEventHandler = function(oEvent, sName) {
			var oParent = this.getMetadata().getParent();
			if (oParent) {
				oParent = oParent.getClass();
				if (oParent.prototype[sName]) {
					oParent.prototype[sName].apply(this, [oEvent]);
				}
			}
		};

		return FilterToken;
	}, true);