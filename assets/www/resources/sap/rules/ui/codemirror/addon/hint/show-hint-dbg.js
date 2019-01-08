(function() {
	"use strict";

	var HINT_ELEMENT_CLASS = "sapMLIB sapMLIBHoverable CodeMirror-hint";
	var ACTIVE_HINT_ELEMENT_CLASS = "sapMLIB sapMLIBHoverable sapMLIBSelected CodeMirror-hint-active";
	var SELECT_VALUE_FROM_LIST = 'Select value from list...';
	var ANY_OF =  'any of the following conditions is true:';
	var ALL_OF =  'all of the following conditions are true:';
    var ADD_CONDITION = "<add line>";
    var NEW_STRUCT_COMPLITION = "\n\u2022  \n;";
    var NEW_STRUCT_LINE_COMPLITION = "\u2022  ";
    var ENTER_AND_NEW_STRUCT_LINE_COMPLITION = "\n" + NEW_STRUCT_LINE_COMPLITION;
    var STRING_HINT = "<'string'>";
    var NUMBER_HINT = "<number>";
    var DATE_HINT = "<'dd/mm/yyyy'>";
    var TIME_HINT = "<'hh:mi:ss'>";
    var TIMESTAMP_HINT = "<'dd/mm/yyyy hh:mi:ss'>";
	var TOKEN_TYPE_CONSTANT = "constant";
	var DATE_TYPE = "Date";
	var TIME_TYPE = "Time";
	var TIMESTAMP_TYPE = "Timestamp";
	var NUMBER_TYPE = "Number";
	var VALUE_HELP_TOKEN_TYPE = "valueList";

	
	CodeMirror.handleEnter = function(cm, getHints, options) {
    	var completion = CodeMirror.initComplition(cm, getHints, options);
    	if(completion){
            
			var data = completion.getHints(cm, completion.options);
			if(!data){
				return;
			}
			
			// get index of the ADD_CONDITION item:
			var indexes = jQuery.map(data.list, function(obj, index){ 
				if(obj.text === ADD_CONDITION) {
					return index;
				} 
			});

			if(indexes.length > 0){
				completion.pick(data, indexes[0], "enter");
			}
			completion.close();
    	}
	};
	
	CodeMirror.handleColon = function(cm, getHints, options) {
    	var completion = CodeMirror.initComplition(cm, getHints, options);
    	if(completion){
            
			var data = completion.getHints(cm, completion.options);
			if(data){
				var index = data.list.indexOf(ADD_CONDITION); 
				if(index> 0){
					data.list[index] = NEW_STRUCT_COMPLITION;
					completion.pick(data, index);

				}
			}
    	}
	};
	
	CodeMirror.closeAutoComplete = function(cm, getHints, options) {
		var complete = cm.state.completionActive;
		complete && complete.close();
	};

	CodeMirror.showHint = function(cm, getHints, options) {

    	var completion = CodeMirror.initComplition(cm, getHints, options);
    	if(completion){
    		CodeMirror.signal(cm, "startCompletion", cm);
    		if (completion.options.async)
    			getHints(cm, function(hints) {
    				completion.showHints(hints);
    			}, completion.options);
    		else
    			return completion.showHints(completion.getHints(cm, completion.options));
    	}

	};
	CodeMirror.initComplition = function(cm, getHints, options) {
		// We want a single cursor position.
		if (cm.somethingSelected()) return;
		if (getHints == null) {
			if (options && options.async) return;
			else getHints = CodeMirror.hint.auto;
		}

		if (cm.state.completionActive) cm.state.completionActive.close();
		if (cm.state.completionActive && cm.state.completionActive.widget !== null) return;
		var completion = cm.state.completionActive = new Completion(cm, getHints, options || {});
		return completion;
	};
	function Completion(cm, getHints, options) {
		this.cm = cm;
		this.getHints = getHints;
		this.options = this.buildOptions(options);
		this.widget = this.onClose = null;
	}

	Completion.prototype = {
		setNewCursorPosition: function(completion,cm){
			var newPositon= cm.getCursor();
		if (completion === ANY_OF + NEW_STRUCT_COMPLITION || completion ===  NEW_STRUCT_COMPLITION || completion ===  ALL_OF + NEW_STRUCT_COMPLITION  ){
				
				newPositon.line --;
				newPositon.ch += cm.getOption("indentUnit") + 2;
				cm.setCursor( newPositon);

		}
		if (completion === NEW_STRUCT_LINE_COMPLITION || completion === ENTER_AND_NEW_STRUCT_LINE_COMPLITION){
				newPositon.ch += cm.getOption("indentUnit") + 2;
				cm.setCursor( newPositon);

		}
		if (completion === "''"){
			newPositon.ch -=  1;
			cm.setCursor( newPositon);

	}
			
		},	
	    handleSimpleTypesPick:function(completion, selectedItem){
	    	switch (completion) {
			case STRING_HINT:
				completion = "''";
				break;
			case NUMBER_HINT:
				completion = "0";
				break;	
			case DATE_HINT:
				completion = "'dd/mm/yyyy'";
				break;	
			case TIME_HINT:
				completion = "'hh:mi:ss'";
				break;	
			case TIMESTAMP_HINT:
				completion = "'dd/mm/yyyy hh:mi:ss'";
				break;	
			default:
				if( (completion.charAt(0) === "<") &&
					(completion.charAt(completion.length - 1) === ">") &&
					(selectedItem.tokenType === TOKEN_TYPE_CONSTANT) &&
					( 	(selectedItem.info.type === DATE_TYPE) ||
						(selectedItem.info.type === TIME_TYPE) ||
						(selectedItem.info.type === TIMESTAMP_TYPE) ||
						(selectedItem.info.type === NUMBER_TYPE))){
					
					completion = completion.substring(1, completion.length - 1);
					
				}
				break;
			}
	    	
	    	return completion;

	    },		
		close: function() {
			if (!this.active()) return;
			this.cm.state.completionActive = null;

			if (this.widget) this.widget.close();
			if (this.onClose) this.onClose();
			CodeMirror.signal(this.cm, "endCompletion", this.cm);
		},

		active: function() {
			return this.cm.state.completionActive == this;
		},

		/**
		 * Happens when the user selects from the hints list.
		 * There are several relevant parts to consider:
		 * - The part already typed by the user (could be none): might be in the wrong case and needs replacement
		 * - The completion part: might include a preceding SPACE if the hint is attached to the previous term
		 * 
		 * in the selected item there are:
		 * - text: the full text of the selected element
		 * - completion: the missing (untyped) part
		 * 
		 * examples (| represents the cursor, hints appear in the below rows. assume 1st hint is selected):
		 *  1. typed part is in wrong case. text: 'LastName of the Customer', completion: 'of the Customer'
		 *  lastname |
		 *  ===========================================
		 *  LastName of the Customer                   
		 *  LastName of the Customer of a PurchaseOrder
		 *  ===========================================
		 *  
		 *  2. completion part will include space. text: 'id of the player', completion: ' id of the player':
		 *  age of the player = 26 and|
		 *                             ==================
		 *                             id of the player  
		 *                             name of the player
		 *                             ==================
		 * **/
		pick: function(data, i,keyPressed) 
		{
			var newPositon = null;
			var selectedItem = data.list[i];
			var fullText = selectedItem.text;         // e.g. 'name of the player'
			var completion = selectedItem.completion; // e.g. 'me of the player', ' name of the player'
			var result = fullText;
			var bValueHelp = data.list[i].tokenType === VALUE_HELP_TOKEN_TYPE;
			
			if (!bValueHelp)
			{
				result = this.handleSimpleTypesPick(fullText, selectedItem);
				
				
				if (result !== fullText) {
					completion = completion.replace(fullText, result);
					fullText = fullText.replace(fullText, result);
				}
				
				if (result === ANY_OF || result === ALL_OF){
					result = result + NEW_STRUCT_COMPLITION;
				}
				if (fullText.trim() === ADD_CONDITION){
					if(keyPressed === "enter"){
						result = NEW_STRUCT_LINE_COMPLITION;
					}
					else{
						result = ENTER_AND_NEW_STRUCT_LINE_COMPLITION;
					}
				}
				 
				if (selectedItem.hint) { // what is the scenario?
					selectedItem.hint(this.cm, data, selectedItem);
				}
				else {
					var delta = fullText.length - completion.length;
					
					if (delta > 0) { // fullText: 'name of the player' 
						             // completion: 'me of the player'
						             // the already typed part might contain incorrect case
					    var fromCh = this.cm.getCursor().ch - delta;            
						var from = {line: this.cm.getCursor().line, ch: fromCh};
						this.cm.replaceRange(result, from, this.cm.getCursor());
					}
					else {           // fullText: 'name of the player'
						             // completion: ' name of the player'
						var resultCompletion = result.replace(fullText, completion);
						this.cm.replaceRange(resultCompletion, this.cm.getCursor());
					}
				}
				
				CodeMirror.signal(data, "pick", result);
			}
			else
			{
				CodeMirror.signal(this.cm, "onValueListSelect");
			}
			
			this.setNewCursorPosition(result,this.cm);
			this.close();
		},

		showHints: function(data) {
			if (!data || !data.list.length || !this.active()) return this.close();

			if (this.options.completeSingle != false && data.list.length == 1)
				this.pick(data, 0);
			else
				this.showWidget(data);
		},

		showWidget: function(data) {
			this.widget = new Widget(this, data);
			CodeMirror.signal(this.cm, "shown");

			var debounce = 0,
				completion = this,
				finished;
			var closeOn = this.options.closeCharacters || /[\s()\[\]{};:>,]/;
			var startPos = this.cm.getCursor(),
				startLen = this.cm.getLine(startPos.line).length;

			var requestAnimationFrame = window.requestAnimationFrame || function(fn) {
				return setTimeout(fn, 1000 / 60);
			};
			var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

			function done() {
				if (finished) return;
				finished = true;
				completion.close();
				completion.cm.off("cursorActivity", activity);
				if (data) CodeMirror.signal(this.cm, "close");
			}

			function update() {
				if (finished) return;
				CodeMirror.signal(data, "update");
				// Since autocomplete command is triggered for every keystroke, the update functionaliy is redundant - only needed when the user "turn off"
				// The automatic auto complete
				if (completion.options.async)
					completion.getHints(completion.cm, finishUpdate, completion.options);
				else
					finishUpdate(completion.getHints(completion.cm, completion.options));


			}

			function finishUpdate(data_) {
				data = data_;
				if (finished) return;
				if (!data || !data.list.length) return done();
				completion.widget = new Widget(completion, data);
			}

			function clearDebounce() {
				if (debounce) {
					cancelAnimationFrame(debounce);
					debounce = 0;
				}
			}

			function activity() {
				clearDebounce();
				var pos = completion.cm.getCursor(),
					line = completion.cm.getLine(pos.line);
				if (pos.line != startPos.line || line.length - pos.ch != startLen - startPos.ch ||
					pos.ch < startPos.ch || completion.cm.somethingSelected() ||
					(pos.ch && closeOn.test(line.charAt(pos.ch - 1)))) {
					completion.close();
				} else {
					debounce = requestAnimationFrame(update);
					if (completion.widget) completion.widget.close();
				}
			}
			this.cm.on("cursorActivity", activity);
			this.onClose = done;
		},
		buildOptions: function(options) {
			var editor = this.cm.options.hintOptions;
			var out = {};
			for (var prop in defaultOptions) out[prop] = defaultOptions[prop];
			if (editor)
				for (var prop in editor)
					if (editor[prop] !== undefined) out[prop] = editor[prop];
			if (options)
				for (var prop in options)
					if (options[prop] !== undefined) out[prop] = options[prop];
			return out;
		}
	};

	function getText(completion) {
		if (typeof completion == "string") return completion;
		else return completion.text;
	}

	function buildKeyMap(options, handle) {
		var baseMap = {
			Up: function() {
				handle.moveFocus(-1);
			},
			Down: function() {
				handle.moveFocus(1);
			},
			PageUp: function() {
				handle.moveFocus(-handle.menuSize() + 1, true);
			},
			PageDown: function() {
				handle.moveFocus(handle.menuSize() - 1, true);
			},
			Home: function() {
				handle.setFocus(0);
			},
			End: function() {
				handle.setFocus(handle.length - 1);
			},
			Enter: handle.pick,
			// Tab: handle.pick,
			Esc: handle.close
		};
		var ourMap = options.customKeys ? {} : baseMap;

		function addBinding(key, val) {
			var bound;
			if (typeof val != "string")
				bound = function(cm) {
					return val(cm, handle);
				};
			// This mechanism is deprecated
			else if (baseMap.hasOwnProperty(val))
				bound = baseMap[val];
			else
				bound = val;
			ourMap[key] = bound;
		}
		if (options.customKeys)
			for (var key in options.customKeys)
				if (options.customKeys.hasOwnProperty(key))
					addBinding(key, options.customKeys[key]);
		if (options.extraKeys)
			for (var key in options.extraKeys)
				if (options.extraKeys.hasOwnProperty(key))
					addBinding(key, options.extraKeys[key]);
		return ourMap;
	}

	function getHintElement(hintsElement, el) {
		while (el && el != hintsElement) {
			if (el.nodeName.toUpperCase() === "LI" && el.parentNode == hintsElement) return el;
			el = el.parentNode;
		}
	}

	function Widget(completion, data) {
		this.completion = completion;
		this.data = data;
		var widget = this,
			cm = completion.cm,
			options = completion.options;

		var hints = this.hints = document.createElement("ul");
		hints.className = "CodeMirror-hints";
		this.selectedHint = options.getDefaultSelection ? options.getDefaultSelection(cm, options, data) : 0;

		var completions = data.list;
		for (var i = 0; i < completions.length; ++i) {
			var elt = hints.appendChild(document.createElement("li")),
				cur = completions[i];
			var className = HINT_ELEMENT_CLASS + (i != this.selectedHint ? "" : " " + ACTIVE_HINT_ELEMENT_CLASS);
			if (cur.className != null) className = cur.className + " " + className;
			elt.className = className;
			if (cur.render) cur.render(elt, data, cur);
			else elt.appendChild(document.createTextNode(cur.displayText || getText(cur)));
			elt.hintId = i;
		}

		var pos = cm.cursorCoords(options.alignWithWord !== false ? data.from : null);
		var left = pos.left,
			top = pos.bottom,
			below = true;
		hints.style.left = left + "px";
		hints.style.top = top + "px";
		// If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
		var winW = window.innerWidth || Math.max(document.body.offsetWidth, document.documentElement.offsetWidth);
		var winH = window.innerHeight || Math.max(document.body.offsetHeight, document.documentElement.offsetHeight);
		(options.container || document.body).appendChild(hints);
		var box = hints.getBoundingClientRect();
		var overlapX = box.right - winW,
			overlapY = box.bottom - winH;
		if (overlapX > 0) {
			if (box.right - box.left > winW) {
				hints.style.width = (winW - 5) + "px";
				overlapX -= (box.right - box.left) - winW;
			}
			hints.style.left = (left = pos.left - overlapX) + "px";
		}
		if (overlapY > 0) {
			var height = box.bottom - box.top;
			if (box.top - (pos.bottom - pos.top) - height > 0) {
				overlapY = height + (pos.bottom - pos.top);
				below = false;
			} else if (height > winH) {
				hints.style.height = (winH - 5) + "px";
				overlapY -= height - winH;
			}
			hints.style.top = (top = pos.bottom - overlapY) + "px";
		}

		cm.addKeyMap(this.keyMap = buildKeyMap(options, {
			moveFocus: function(n, avoidWrap) {
				widget.changeActive(widget.selectedHint + n, avoidWrap);
			},
			setFocus: function(n) {
				widget.changeActive(n);
			},
			menuSize: function() {
				return widget.screenAmount();
			},
			length: completions.length,
			close: function() {
				completion.close();
			},
			pick: function() {
				widget.pick();
			}
		}));

		if (options.closeOnUnfocus !== false) {
			var closingOnBlur;
			cm.on("blur", this.onBlur = function() {
				closingOnBlur = setTimeout(function() {
					completion.close();
				}, 100);
			});
			cm.on("focus", this.onFocus = function() {
				clearTimeout(closingOnBlur);
			});
		}

		var startScroll = cm.getScrollInfo();
		cm.on("scroll", this.onScroll = function() {
			var curScroll = cm.getScrollInfo(),
				editor = cm.getWrapperElement().getBoundingClientRect();
			var newTop = top + startScroll.top - curScroll.top;
			var point = newTop - (window.pageYOffset || (document.documentElement || document.body).scrollTop);
			if (!below) point += hints.offsetHeight;
			if (point <= editor.top || point >= editor.bottom) return completion.close();
			hints.style.top = newTop + "px";
			hints.style.left = (left + startScroll.left - curScroll.left) + "px";
		});

		CodeMirror.on(hints, "click", function(e) {
			var t = getHintElement(hints, e.target || e.srcElement);
			if (t && t.hintId != null) {
				widget.changeActive(t.hintId);
				widget.pick();
			}
		});

		/* CodeMirror.on(hints, "dblclick", function(e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) {widget.changeActive(t.hintId); widget.pick();}
    });

    CodeMirror.on(hints, "click", function(e) {
      var t = getHintElement(hints, e.target || e.srcElement);
      if (t && t.hintId != null) {
        widget.changeActive(t.hintId);
        if (options.completeOnSingleClick) widget.pick();
      }
    });
*/
		CodeMirror.on(hints, "mousedown", function() {
			cm.options.shouldValidate = false;
			setTimeout(function() {
				cm.focus();
			}, 20);
		});

		CodeMirror.signal(data, "select", completions[0], hints.firstChild);
		return true;
	}

	Widget.prototype = {
		close: function() {
			if (this.completion.widget != this) return;
			this.completion.widget = null;
			this.hints.parentNode.removeChild(this.hints);
			this.completion.cm.removeKeyMap(this.keyMap);

			var cm = this.completion.cm;
			if (this.completion.options.closeOnUnfocus !== false) {
				cm.off("blur", this.onBlur);
				cm.off("focus", this.onFocus);
			}
			cm.off("scroll", this.onScroll);
		},

		pick: function() {
			this.completion.pick(this.data, this.selectedHint);
		},

		changeActive: function(i, avoidWrap) {
			if (i >= this.data.list.length)
				i = avoidWrap ? this.data.list.length - 1 : 0;
			else if (i < 0)
				i = avoidWrap ? 0 : this.data.list.length - 1;
			if (this.selectedHint == i) return;
			var node = this.hints.childNodes[this.selectedHint];
			node.className = node.className.replace(" " + ACTIVE_HINT_ELEMENT_CLASS, "");
			node = this.hints.childNodes[this.selectedHint = i];
			node.className += " " + ACTIVE_HINT_ELEMENT_CLASS;
			if (node.offsetTop < this.hints.scrollTop)
				this.hints.scrollTop = node.offsetTop - 3;
			else if (node.offsetTop + node.offsetHeight > this.hints.scrollTop + this.hints.clientHeight)
				this.hints.scrollTop = node.offsetTop + node.offsetHeight - this.hints.clientHeight + 3;
			CodeMirror.signal(this.data, "select", this.data.list[this.selectedHint], node);
		},

		screenAmount: function() {
			return Math.floor(this.hints.clientHeight / this.hints.firstChild.offsetHeight) || 1;
		}
	};

	CodeMirror.registerHelper("hint", "auto", function(cm, options) {
		var helpers = cm.getHelpers(cm.getCursor(), "hint");
		if (helpers.length) {
			for (var i = 0; i < helpers.length; i++) {
				var cur = helpers[i](cm, options);
				if (cur && cur.list.length) return cur;
			}
		} else {
			var words = cm.getHelper(cm.getCursor(), "hintWords");
			if (words) return CodeMirror.hint.fromList(cm, {
				words: words
			});
		}
	});

	CodeMirror.registerHelper("hint", "fromList", function(cm, options) {
		var cur = cm.getCursor(),
			token = cm.getTokenAt(cur);
		var found = [];
		for (var i = 0; i < options.words.length; i++) {
			var word = options.words[i];
			if (word.slice(0, token.string.length) == token.string)
				found.push(word);
		}

		if (found.length) return {
			list: found,
			from: CodeMirror.Pos(cur.line, token.start),
			to: CodeMirror.Pos(cur.line, token.end)
		};
	});
	var defaultOptions = {
		hint: CodeMirror.hint.auto,
		completeSingle: false,
		alignWithWord: true,
		closeCharacters: /[\s()\[\]{};:>,]/,
		closeOnUnfocus: true,
		completeOnSingleClick: false,
		container: null,
		customKeys: null,
		extraKeys: null
	};
	CodeMirror.commands.autocomplete = CodeMirror.showHint;
	CodeMirror.commands.enterAutocomplete = CodeMirror.handleEnter;
	CodeMirror.commands.colonAutocomplete = CodeMirror.handleColon;
	CodeMirror.commands.closeAutoComplete = CodeMirror.closeAutoComplete;

})();