/*
 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
 */
jQuery.sap.declare("sap.ca.ui.utils.BinaryUtil");

sap.ui.base.Object.extend("sap.ca.ui.utils.BinaryUtil", {
	
	constructor: function(sData, iDataLength) {
		
		var data = sData;
		var dataLength = iDataLength;

        this.getByteAt = function(iOffset) {
            return data.charCodeAt(iOffset) & 0xFF;
        };

        this.getBytesAt = function(iOffset, iLength, bBigEndian) {
            var aBytes = [];
            if (bBigEndian === undefined) {
                bBigEndian = true;
            }

            for (var i = 0; i < iLength; i++) {
                if (bBigEndian) {
                    aBytes[i] = data.charCodeAt(iOffset + i) & 0xFF;
                }
                else {
                    aBytes[i] = data.charCodeAt(iOffset + iLength - i -1) & 0xFF;
                }

            };

            return aBytes ;
        };


		this.getLength = function() {
			return dataLength;
		};

        this.getSShortAt = function(iOffset, bBigEndian) {
            var aBytes =  this.getBytesAt(iOffset, 2, bBigEndian);
            var iShort =  (aBytes[0] << 8) + aBytes[1];

            return iShort;
        };

		this.getShortAt = function(iOffset, bBigEndian) {
            var iUShort =  this.getSShortAt(iOffset, bBigEndian);
			if (iUShort < 0) iUShort += 65536;
			return iUShort;
		};

		this.getLongAt = function(iOffset, bBigEndian) {

            var iULong  = this.getSLongAt(iOffset, bBigEndian);
			if (iULong < 0)
				iULong += 4294967296;
			return iULong;
		};
		
		this.getSLongAt = function(iOffset, bBigEndian) {
            var aBytes =  this.getBytesAt(iOffset, 4, bBigEndian);
            var iLong  = (((((aBytes[0] << 8) + aBytes[1]) << 8) + aBytes[2]) << 8) + aBytes[3];
            return iLong;
        };



		this.getStringAt = function(iOffset, iLength) {
			var aStr = [];
			
			var aBytes = this.getBytesAt(iOffset, iLength);
			for (var j=0; j < iLength; j++) {
				aStr[j] = String.fromCharCode(aBytes[j]);
			}
			return aStr.join("");
		};
		

	}
});
