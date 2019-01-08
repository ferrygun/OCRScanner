sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";
    var oView;

    return Controller.extend("GPS.GPS.controller.GPS", {

        oView: null,

        onInit: function() {
            oView = this.getView();
        },

        onPhotoDataSuccess: function(imageData) {
            var myImage = oView.byId("myImage");
            myImage.setSrc("data:image/jpeg;base64," + imageData);

            mltext.getText(onSuccess, onFail, {
                imgType: 4,
                imgSrc: imageData
            });
            // for imgType Use 0,1,2,3 or 4
            function onSuccess(recognizedText) {
                //var element = document.getElementById('pp');
                //element.innerHTML=recognizedText.blocks.blocktext;
                //Use above two lines to show recognizedText in html
                console.log(recognizedText);
                alert(recognizedText.blocks.blocktext);
            }

            function onFail(message) {
                alert('Failed because: ' + message);
            }
        },

        onPhotoURISuccess: function(imageURI) {
            var myImage = oView.byId("myImage");
            myImage.setSrc(imageURI);

            mltext.getText(onSuccess, onFail, {
                imgType: 0,
                imgSrc: imageURI
            });
            // for imgType Use 0,1,2,3 or 4
            function onSuccess(recognizedText) {
                //var element = document.getElementById('pp');
                //element.innerHTML=recognizedText.blocks.blocktext;
                //Use above two lines to show recognizedText in html
                console.log(recognizedText);
                alert(recognizedText.blocks.blocktext);
            }

            function onFail(message) {
                alert('Failed because: ' + message);
            }
        },

        onFail: function(message) {
            console.log("Failed because: " + message);
        },

        getPhoto: function() {
            var oNav = navigator.camera;
            oNav.getPicture(this.onPhotoURISuccess, this.onFail, {
                quality: 100,
                destinationType: oNav.DestinationType.FILE_URI,
                sourceType: oNav.PictureSourceType.PHOTOLIBRARY
            });

        },

        capturePhoto: function() {
            var oNav = navigator.camera;
            oNav.getPicture(this.onPhotoDataSuccess, this.onFail, {
                quality: 100,
                destinationType: oNav.DestinationType.DATA_URL
            });
        }
    });
});