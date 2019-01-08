(function () {
    "use strict";
    jQuery.sap.declare("sap.ovp.cards.LoadingUtils");
    sap.ovp.cards.LoadingUtils = {
        bAnimationStarted : false,
        aCanvas : [],
        bPageAndCardLoading : false,
        bAnimationStop : false,
        startAnimation: function() {

            var windowWidth = jQuery(window).width();

            var oWave = {
                speed: (0.02 * windowWidth), // Speed of the wave
                currentPosition: 0.01,
                width: 0.2,
                backgroundColor: "#f5f5f0",
                waveColor: "#e6e6e6"
            };

            var updateWavePosition = function () {
                oWave.currentPosition += oWave.speed;
                if (oWave.currentPosition > windowWidth) {
                    oWave.currentPosition = 0.01;
                }
            };

            var renderingWaveOnCanvas = function (canvas) {
                var aParents = jQuery(canvas).parentsUntil(".sapUiComponentContainer");
                if (aParents.length === 0) {
                    return;
                }
                var oParent = aParents[aParents.length - 1].parentNode.parentNode;
                if (!oParent || oParent.offsetLeft == undefined) {
                    return;
                }
                var canvasX = oParent.offsetLeft;
                var canvasWidth = canvas.offsetWidth;
                var oContext = canvas.getContext("2d");
                var oGradient = oContext.createLinearGradient(0,0,canvas.width,0);
                oGradient.addColorStop(0,oWave.backgroundColor);
                if (oWave.currentPosition > canvasX && oWave.currentPosition < (canvasX + canvasWidth)) {
                    var waveX = (oWave.currentPosition - canvasX) / canvasWidth;
                    oGradient.addColorStop(Math.max(waveX - oWave.width, 0.01), oWave.backgroundColor);
                    oGradient.addColorStop(waveX, oWave.waveColor);
                    oGradient.addColorStop(Math.min(waveX + oWave.width, 0.99), oWave.backgroundColor);
                }
                oGradient.addColorStop(1, oWave.backgroundColor);

                oContext.fillStyle = oGradient;
                oContext.fillRect(0, 0, canvas.width, canvas.height);
            };

            var animateLoadingCards = function () {
                if (!sap.ovp.cards.LoadingUtils.bAnimationStop) {
                    updateWavePosition();
                    var aCanvases = sap.ovp.cards.LoadingUtils.aCanvas;
                    for (var i = 0; i < aCanvases.length; i++) {
                        renderingWaveOnCanvas(aCanvases[i]);
                    }

                    // Request to do this again ASAP
                    requestAnimationFrame(animateLoadingCards);
                }
            };

            var w = window,
                requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

            animateLoadingCards();
        }
    };
}());