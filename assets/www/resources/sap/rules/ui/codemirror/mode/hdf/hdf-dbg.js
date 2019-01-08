CodeMirror
		.defineMode(
				"hdf",
				function(config, parserConfig)
				{
					"use strict";

					var Tokens = {
						Vocabulary: "vocabulary",
						Whitespace: "whitespace",
						Reservedword: "reservedword",
						ValueHelp: "valueList",
						Constant: "constant",
						PublicAlias: "alias",
						PrivateAlias: "privateAlias",
						Unknown: "unknown"
					};
					var client = parserConfig.client || {},
					atoms = parserConfig.atoms || {
						"false" : true,
						"true" : true,
						"null" : true
					}, 
					relDelegate = config.relDelegate || {}, 
					expressionEditor = config.expressionEditor || {}, 
					operatorChars = parserConfig.operatorChars || /^[<>!=]/, 
					support = parserConfig.support
							|| {}, 
					hooks = parserConfig.hooks || {}, 
					dateSQL = parserConfig.dateSQL || {
						"date" : true,
						"time" : true,
						"timestamp" : true
					};
					function arrayContainsValue(inArray, inValue)
					{
						if (inArray){
							for (var i = inArray.length - 1; i >= 0; i--) {
								if(inArray[i] === inValue)
									return true;
							};
						}
						return false;
					};
					function getTokenCSS(tokenMetadata)
					{
						
						
						var token =  tokenMetadata.tokenType;
						switch(token)
						{
							case Tokens.Unknown:
							{
								return null;
							}
							case Tokens.Vocabulary:
							case ".":
							{
								return "variable";
							}
							case Tokens.ValueHelp:
							{
								var valueHelpId = tokenMetadata.info.id || '';
								return "valuehelp " + "valuehelpid-" + valueHelpId;
							}
							case Tokens.Reservedword:
							{
								if  (tokenMetadata.token == "or" || tokenMetadata.token == "and"){
									return "logical";
								}
									return "builtin";
								
							}
							case Tokens.Constant:
							{
								return "number";
								
							}
							case Tokens.PublicAlias:
							case Tokens.PrivateAlias:
							{
								return "link";	
							}
							default:
								return null;
								break;
					    	 
						}
					};
					/************
					* @param: word token string.
					* @param: stream code mirror expression steam object
					* @param : toekns: token array contain token object.  
					*********** */
					function getTokenType(word,stream,tokens)
					{
						if ((tokens) && (tokens instanceof Array) && (tokens.length>0))
						{
							for (var i=0;i<tokens.length;i++)
							{
								var tokenMetadata = tokens[i];
								
								if ((tokenMetadata.start <= stream.start  ) 
										&& (tokenMetadata.token.indexOf(word) >-1) && ( stream.pos <=  tokenMetadata.end ))
								{
									return tokenMetadata;
								}
							}
							
						}
						
					};

					function tokenBase(stream, state)
					{
                        var me = this;
						if (stream.eatWhile(/[^\s,*+\-%<>!;=\(\)]/))
						{
							//Word is case sensitive
							var word = stream.current();
							// http://dev.mysql.com/doc/refman/5.5/en/date-and-time-literals.html
							// Get expression  tokens
							var tokens = expressionEditor.getExpressionTokens();
							// get token type per expression specific work/token
							var token = getTokenType(word,stream,tokens);
							if ((word) && (token) && (token!==Tokens.Unknown)) 
							{
							     return getTokenCSS(token,word);
							}
						    else
							{
						    	return getCharTokenCSS(stream, state);
							}	
						}
						else
						{
							return getCharTokenCSS(stream, state);
						}
					};
					
					function getCharTokenCSS(stream, state)
					{
						var ch = stream.next() || stream.current();	
						// call hooks from the mime type
						if(operatorChars.test(ch))
						{
							return "operator";
						}
						if (hooks[ch])
						{
							var result = hooks[ch](stream, state);
							if (result !== false)
								return result;
						}

						if (support.hexNumber == true
								&& ((ch == "0" && stream.match(/^[xX][0-9a-fA-F]+/)) || (ch == "x" || ch == "X")
										&& stream.match(/^'[0-9a-fA-F]+'/)))
						{
							return "number";
						}
						else if (support.binaryNumber == true
								&& (((ch == "b" || ch == "B") && stream.match(/^'[01]+'/)) || (ch == "0" && stream
										.match(/^b[01]+/))))
						{
							return "number";
						}
						else if ((ch) && (ch.charCodeAt(0) > 47 && ch.charCodeAt(0) < 58))
						{
							// numbers
							// ref:
							// http://dev.mysql.com/doc/refman/5.5/en/number-literals.html
							stream.match(/^[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/);
							support.decimallessFloat == true && stream.eat('.');
							return "number";
						}
						else if (ch == "?" && (stream.eatSpace() || stream.eol() || stream.eat(";")))
						{
							// placeholders
							return "variable-3";
						}
						else if (ch == "'" || (ch == '"' && support.doubleQuote))
						{
							// strings
							// ref:
							// http://dev.mysql.com/doc/refman/5.5/en/string-literals.html
							state.tokenize = tokenLiteral(ch);
							return state.tokenize(stream, state);
						}
						else if ((((support.nCharCast == true && (ch == "n" || ch == "N")) || (support.charsetCast == true
								&& ch == "_" && stream.match(/[a-z][a-z0-9]*/i))) && (stream.peek() == "'" || stream
								.peek() == '"')))
						{
							// charset casting: _utf8'str', N'str', n'str'
							// ref:
							// http://dev.mysql.com/doc/refman/5.5/en/string-literals.html
							return "keyword";
						}
						else if (/^[\(\),\;\[\]]/.test(ch))
						{
							// no highlightning
							return "builtin";
						}
						else if (support.commentSlashSlash && ch == "/" && stream.eat("/"))
						{
							// 1-line comment
							stream.skipToEnd();
							return "comment";
						}
						else if ((support.commentHash && ch == "#")
								|| (ch == "-" && stream.eat("-") && (!support.commentSpaceRequired || stream.eat(" "))))
						{
							// 1-line comments
							// ref: https://kb.askmonty.org/en/comment-syntax/
							stream.skipToEnd();
							return "comment";
						}
						else if (ch == "/" && stream.eat("*"))
						{
							// multi-line comments
							// ref: https://kb.askmonty.org/en/comment-syntax/
							state.tokenize = tokenComment;
							return state.tokenize(stream, state);
						}
						else if (ch == ".")
						{
							// .1 for 0.1
							if (support.zerolessFloat == true && stream.match(/^(?:\d+(?:e[+-]?\d+)?)/i))
							{
								return "number";
							}
							// .table_name (ODBC)
							// // ref:
							// http://dev.mysql.com/doc/refman/5.6/en/identifier-qualifiers.html
							if (support.ODBCdotTable == true && stream.match(/^[a-zA-Z_]+/))
							{
								return "variable-2";
							}
						}
						else if (operatorChars.test(ch))
						{
							// operators
							stream.eatWhile(operatorChars);
							return null;
						}
						else if (ch == '{'
								&& (stream.match(/^( )*(d|D|t|T|ts|TS)( )*'[^']*'( )*}/) || stream
										.match(/^( )*(d|D|t|T|ts|TS)( )*"[^"]*"( )*}/)))
						{
							// dates (weird ODBC syntax)
							// ref:
							// http://dev.mysql.com/doc/refman/5.5/en/date-and-time-literals.html
							return "number";
						}
					};
					
					// 'string', with char specified in quote escaped by '\'
					function tokenLiteral(quote)
					{
						return function(stream, state)
						{
							var escaped = false, ch;
							while ((ch = stream.next()) != null)
							{
								if (ch == quote && !escaped)
								{
									state.tokenize = tokenBase;
									break;
								}
								escaped = !escaped && ch == "\\";
							}
							return "string";
						};
					}
					function tokenComment(stream, state)
					{
						while (true)
						{
							if (stream.skipTo("*"))
							{
								stream.next();
								if (stream.eat("/"))
								{
									state.tokenize = tokenBase;
									break;
								}
							}
							else
							{
								stream.skipToEnd();
								break;
							}
						}
						return "comment";
					}

					function pushContext(stream, state, type)
					{
						state.context = {
							prev : state.context,
							indent : stream.indentation(),
							col : stream.column(),
							type : type
						};
					}

					function popContext(state)
					{
						state.indent = state.context.indent;
						state.context = state.context.prev;
					}

					return {
						startState : function()
						{
							return {
								tokenize : tokenBase,
								context : null
							};
						},

						token : function(stream, state)
						{
							if (stream.sol())
							{
								if (state.context && state.context.align == null)
									state.context.align = false;
							}
							if (stream.eatSpace())
								return null;

							var style = state.tokenize(stream, state);
							if (style == "comment")
								return style;

							if (state.context && state.context.align == null)
								state.context.align = true;

							var tok = stream.current();
							if (tok == "true:")
								pushContext(stream, state, "true:");
							else if (tok == ";")
								pushContext(stream, state, ";");
							else if (state.context && state.context.type == tok)
								popContext(state);
							return style;
						},

						indent : function(state, textAfter)
						{
							var cx = state.context;
							if (!cx)
								return 0;
							if(cx.type == "true:"){
								return cx.indent + config.indentUnit;
							}
							if(cx.type == ";"){
								return cx.indent - config.indentUnit;
							}
	
						},

						blockCommentStart : "/*",
						blockCommentEnd : "*/",
						lineComment : support.commentSlashSlash ? "//" : support.commentHash ? "#" : null
					};
				});

(function()
{
	"use strict";

	// `identifier`
	function hookIdentifier(stream)
	{
		// MySQL/MariaDB identifiers
		// ref:
		// http://dev.mysql.com/doc/refman/5.6/en/identifier-qualifiers.html
		var ch;
		while ((ch = stream.next()) != null)
		{
			if (ch == "`" && !stream.eat("`"))
				return "variable-2";
		}
		return null;
	}

	// variable token
	function hookVar(stream)
	{
		// variables
		// @@prefix.varName @varName
		// varName can be quoted with ` or ' or "
		// ref: http://dev.mysql.com/doc/refman/5.5/en/user-variables.html
		if (stream.eat("@"))
		{
			stream.match(/^session\./);
			stream.match(/^local\./);
			stream.match(/^global\./);
		}

		if (stream.eat("'"))
		{
			stream.match(/^.*'/);
			return "variable-2";
		}
		else if (stream.eat('"'))
		{
			stream.match(/^.*"/);
			return "variable-2";
		}
		else if (stream.eat("`"))
		{
			stream.match(/^.*`/);
			return "variable-2";
		}
		else if (stream.match(/^[0-9a-zA-Z$\.\_]+/))
		{
			return "variable-2";
		}
		return null;
	}
	;

	// short client keyword token
	function hookClient(stream)
	{
		// \N means NULL
		// ref: http://dev.mysql.com/doc/refman/5.5/en/null-values.html
		if (stream.eat("N"))
		{
			return "atom";
		}
		// \g, etc
		// ref: http://dev.mysql.com/doc/refman/5.5/en/mysql-commands.html
		return stream.match(/^[a-zA-Z.#!?]/) ? "variable-2" : null;
	}

	// these keywords are used by all SQL dialects (however, a mode can still
	// overwrite it)
	var hdfKeywords = "";

	// turn a space-separated list into an array
	function set(str)
	{
		var obj = {}, words = str.split(" ");
		for ( var i = 0; i < words.length; ++i)
			obj[words[i]] = true;
		return obj;
	}	
	// A generic SQL Mode. It's not a standard, it just try to support what is
	// generally supported
	CodeMirror
			.defineMIME(
					"text/hdf",
					{
						name : "hdf",
						keywords : [],
						builtin : ["all", "and", "avg", "of", "concatenate", "contains", "count", "countd", "current", "number", "next", "distinct", "day", "days", "does", "contain", "equal", "equals", "exists", "end","ends", "in", "filter", "by", "first", "greater", "than", "group", "by", "average","hour", "hours", "in", "is", "after", "before", "between", "equal", "equal", "or", "of", "less", "than", "like", "not", "one", "last", "max", "maximum", "min", "minimum", "minute","minutes", "month", "not", "null", "per", "second", "seconds", "start","starts", "sum", "the", "to", "today", "tomorrow", "week","weeks", "where", "with", "year", "years","yesterday"],						
						atoms : ["false","true", "null", "unknown"],
						operatorChars : /^[*+\-%<>!=]/,
						dateSQL : set(""),
						support : set("")
					});

}());

/*
 * How Properties of Mime Types are used by SQL Mode
 * =================================================
 * 
 * keywords: A list of keywords you want to be highlighted. functions: A list of
 * function names you want to be highlighted. builtin: A list of builtin types
 * you want to be highlighted (if you want types to be of class "builtin"
 * instead of "keyword"). operatorChars: All characters that must be handled as
 * operators. client: Commands parsed and executed by the client (not the
 * server). support: A list of supported syntaxes which are not common, but are
 * supported by more than 1 DBMS. ODBCdotTable: .tableName zerolessFloat: .1
 * doubleQuote nCharCast: N'string' charsetCast: _utf8'string' commentHash: use #
 * char for comments commentSlashSlash: use // for comments
 * commentSpaceRequired: require a space after -- for comments atoms: Keywords
 * that must be highlighted as atoms,. Some DBMS's support more atoms than
 * others: UNKNOWN, INFINITY, UNDERFLOW, NaN... dateSQL: Used for date/time SQL
 * standard syntax, because not all DBMS's support same temporal types.
 */