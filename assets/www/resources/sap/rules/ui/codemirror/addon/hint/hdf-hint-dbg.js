//This module use the following structures:
//cached the following object:  {input: "..." , data : {listCompletion: resultWithCompletion, from:2, to:5}}
//where input is the key, result and resultWithCompletion are arrays
//the output of hints will be the following object: {list: result, from:2, to:5}

(function() {
	"use strict";
	var Pos = CodeMirror.Pos;

	function getHints(cm, options) {
		options.completeSingle = false;
		var cursor = cm.getCursor();
		var objData = null;
		var numOfSuggestions = 0;
		var start = 0;
		var filteredCache = [];

		var input = cm.getRange({
			line: 0,
			ch: 0
		}, cursor);
		if (cm.options.headerValue) {
			var prefix = cm.options.headerValue + " ";
			if (cm.options.fixedOperator) {
				prefix = prefix + cm.options.fixedOperator + " ";
			}
			input = prefix + input;
		}
		var data = {};

		function _stringStartsWith(lStr, sStr) {
			return lStr.slice(0, sStr.length) === sStr;
		}

		function filterOutStructuredCond (incomingData){

			var filterData = {};

			filterData.suggs = [];

			for(var i = 0; i < incomingData.suggs.length; i++){

				if (incomingData.suggs[i].info){

					if (incomingData.suggs[i].info.category){

						if (incomingData.suggs[i].info.category === "structuredCond"){

							continue;
						}
					}
				}

				filterData.suggs.push(incomingData.suggs[i]);
			}

			return filterData;
		}

		function fetchCurrentCache(newCacheKeyCandidate) {
			var cacheHitsNumber = 0;
			if (cm.currentHintData &&
				newCacheKeyCandidate.length >= cm.currentHintData.key.length) {
				filteredCache = cm.currentHintData.data.listCompletion.filter(function(entry) {
					if (_stringStartsWith((cm.currentHintData.key + entry.completion), newCacheKeyCandidate) === true) {
						var x = newCacheKeyCandidate.substring(cm.currentHintData.key.length, newCacheKeyCandidate.length).length;
						entry.completion = entry.completion.substring(x, entry.completion.length);
						if (entry.completion.length === 0) {
							return false;
						}
						return true;
					}
					return false;
				});
				cacheHitsNumber = filteredCache.length;
				data.listCompletion = filteredCache;
			} else {
				cacheHitsNumber = 0;
			}
			return cacheHitsNumber;
		}

		function _processCacheForCM(filteredCache, newCacheKeyCandidate) {
			var firstSuggestion = filteredCache[0];
			var x = newCacheKeyCandidate + firstSuggestion.completion;
			var expressionLinesArray = x.split("\n");
			x = expressionLinesArray[cursor.line];

			//For alias cases the uppercase does matter - we will start searching for the orginal text
			//	start = x.substring(0, x.toLowerCase().lastIndexOf(firstSuggestion.text.toLowerCase())).length;

			//For data objects user can enter a mix of upper lower letters - we are normalizing the text in order to 
			//find the correct place in the text
			if (start === 0) {
				if(firstSuggestion.tokenType === "valueList"){
					start = x.substring(0, x.toLowerCase().lastIndexOf("")).length;
				} else {
					start = x.substring(0, x.toLowerCase().lastIndexOf(firstSuggestion.text.toLowerCase())).length;
				}
			}

			data.from = CodeMirror.Pos(cursor.line, start);
			data.to = CodeMirror.Pos(cursor.line, newCacheKeyCandidate.length);

			cm.currentHintData = {
				key: newCacheKeyCandidate,
				data: data
			};
			if (cm.options.stillNeedShowHint) {
				return {
					//			list	:	data.listCompletion.map(function(entry){ return entry.test;});,
					list: filteredCache,
					from: data.from,
					to: data.to
				};
			}
		}

		//Cache suggestions results - 
		//Currently our system work only with one saved result set - meaning that 
		//in case the user is entering the following: 'pla' a call to the service is being made,
		//An entry in the client cache is being made with key 'pla'.
		//The cache will be override only for the following:
		//
		//1. user will choose (or enter) 'player.' - the period ('.') mark will cause a refill of the cache
		//2. user will delete his input (or will delete the 'a' - 'pl') - the previous cache key ('pla') is not included
		//   in the current key ('pl') and therefore a call to the backend service will be initated

		//input = input.trim();
		//var cacheKey = input.substring(input.lastIndexOf(' ') + 1, input.length);
		//var mInput = cacheKey.substring(cacheKey.lastIndexOf('.') + 1, cacheKey.length);
		//cacheKey = cacheKey.substring(0, cacheKey.indexOf('.') === -1 ? cacheKey.length : (cacheKey.lastIndexOf('.') + 1));
		var newCacheKeyCandidate = input;

		//var cacheKey = input.substring(0,input.lastIndexOf('.')+1);

		//Use the cache when all the following items are positive:
		//1. Cache exists 
		//2. Current cached input is substring of the input
		//3. Last char is not dot (.) - in this case we would like to initiate 
		//   a new roundtrip as our dataobjects are hierarchical meaning a new context starts after the dot mark

		//Check if current cached data can resolve the request or fetch new data from backend
		numOfSuggestions = fetchCurrentCache(newCacheKeyCandidate);
		var incomingdata = {};
		if (cm.options.relDelegate) {
			incomingdata = cm.options.relDelegate.getSuggestions(
				input,
				cm.options.returnType,
				cm.options.collection);
			//the below was used for value list only:
			//	incomingdata = cm.options.relDelegate.setVocabularyEnums(incomingdata);

			if (cm.options.filterOutStructuredCond){
				incomingdata = filterOutStructuredCond(incomingdata);
			}
			if (typeof(objData) !== "object") {
				objData = JSON.parse(incomingdata);
			} else {
				objData = incomingdata;
			}
			if (objData.suggs instanceof Array) {
				//objData.suggs.forEach(function(entry){ result.push({text: entry.text, completion: entry.completion});})
				numOfSuggestions = objData.suggs.length;
				filteredCache = data.listCompletion = objData.suggs;
			}

			/*function(JSONHttpRequest, textStatus, errorThrown) {
				sap.m.MessageBox.alert("Error: Could not get suggestions\n" + errorThrown);
			},*/
		}

		if (filteredCache.length > 0) {
			return _processCacheForCM(filteredCache, newCacheKeyCandidate);
		} else {
			return null;
		}

	}

	CodeMirror.hdfHint = getHints; // deprecated
	CodeMirror.registerHelper("hint", "hdf", getHints);
})();