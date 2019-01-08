jQuery.sap.declare("sap.rules.ui.parser.businessLanguage.lib.constantsBase");

/************************************************************************
 ******************************* Constants ******************************
 ************************************************************************/

sap.rules.ui.parser.businessLanguage.lib.constantsBase = sap.rules.ui.parser.businessLanguage.lib.constantsBase|| {}; 
sap.rules.ui.parser.businessLanguage.lib.constantsBase.lib = (
	function() {
		var consts = {
			defineEnum: function(definition) {
				var k = null;
				var j;
				var e = new consts.Enum();
				for (k in definition) {
					if (definition.hasOwnProperty(k)) {
						j = definition[k];
						e[k] = j;
						e.addEnum(j);
					}
				}
				return e;
			},
			Enum: function() {
				this.v_enums = [];
				this.v_lookups = {};
			}
		};


		consts.Enum.prototype.getEnum = function() {
			return this.v_enums;
		};
		consts.Enum.prototype.forEach = function(callback) {
			var length = this.v_enums.length;
			var i;
			for (i = 0; i < length; ++i) {
				callback(this.v_enums[i]);
			}
		};
		consts.Enum.prototype.addEnum = function(e) {
			this.v_enums.push(e);
		};


		consts.Enum.prototype.getByName = function(name) {
			return this[name];
		};

		consts.Enum.prototype.getByValue = function(field, value) {
			if (value === "") {
				return null;
			}

			var lookup = this.v_lookups[field];
			if (lookup !== undefined && lookup[value] !== undefined) {
				return lookup[value];
			} else {
				this.v_lookups[field] = (lookup = {});
				var k = null;
				for (k = this.v_enums.length - 1; k >= 0; --k) {
					var m = this.v_enums[k];
					var j = m[field];
					var low_val = value.toLowerCase();
					lookup[j] = m;
					j = j.toLowerCase();

					if (low_val.indexOf(j) !== -1) {
						return m;
					}
				}
			}
			return null;
		};
		consts.Enum.prototype.getStringByField = function(field) {
			var lookup = this.v_lookups[field];
			var str = "";
			this.v_lookups[field] = (lookup = {});
			var k = null;
			for (k = this.v_enums.length - 1; k >= 0; --k) {
				var m = this.v_enums[k];
				var j = m[field];
				lookup[j] = m;
				str += j;
				str += " ";
			}
			return str;
		};
		consts.SIMPLE_SELECTION_VALUE_TYPE = (function() {
			return new consts.defineEnum({
				COLLECTION: {
					string: 'Collection',
					value: 'Collection'
				},
				STRING: {
					string: 'String',
					value: 'String'
				},
				UNICODE: {
					string: 'UnicodeString',
					value: 'String'
				},
				INTEGER: {
					string: 'Number',
					value: 'Number'
				},
				TIME: {
					string: 'Time',
					value: 'Time'
				},
				TIMESTAMP: {
					string: 'Timestamp',
					value: 'Timestamp'
				},
				DATE: {
					string: 'Date',
					value: 'Date'
				},
				BOOLEAN: {
					string: 'Boolean',
					value: 'Boolean'
				},
				UUID: {
					string: 'Uuid',
					value: 'String'
				},
				TIMESPAN: {
					string: 'TimeSpan',
					value: 'TimeSpan'
				},
				DECIMAL: {
					string: 'Decimal',
					value: 'Number'
				},
				BIGNUMBER: {
					string: 'BigNumber',
					value: 'Number'
				},
				STRING_COLLECTION: {
					string: 'StringCollection',
					value: 'String'
				},
				UNICODE_COLLECTION: {
					string: 'UnicodeStringCollection',
					value: 'String'
				},
				INTEGER_COLLECTION: {
					string: 'NumberCollection',
					value: 'Number'
				},
				TIME_COLLECTION: {
					string: 'TimeCollection',
					value: 'Time'
				},
				TIMESTAMP_COLLECTION: {
					string: 'TimestampCollection',
					value: 'Timestamp'
				},
				DATE_COLLECTION: {
					string: 'DateCollection',
					value: 'Date'
				},
				BOOLEAN_COLLECTION: {
					string: 'BooleanCollection',
					value: 'Boolean'
				},
				UUID_COLLECTION: {
					string: 'UuidCollection',
					value: 'String'
				},
				TIMESPAN_COLLECTION: {
					string: 'TimeSpanCollection',
					value: 'TimeSpan'
				},
				DECIMAL_COLLECTION: {
					string: 'DecimalCollection',
					value: 'Number'
				},
				BIGNUMBER_COLLECTION: {
					string: 'BigNumberCollection',
					value: 'Number'
				},
				NULL: {
					string: 'Null',
					value: 'Null'
				}
			});
		}());
		return consts;
	}());