(function(window, $, undefined){
    var CROSS_SIZE = [5, 2.5];
    var DATA_SCALE = 1 / 3;
    var CELL_SIZE = [DATA_SCALE * 300, DATA_SCALE * 300];

    // 
    // Input Data
    var maxValue = 1000;
    var cells = [
        { x: 0, y: 0, cx: DATA_SCALE * 150, cy: DATA_SCALE * 210, v: 633 },
        { x: 1, y: 0, cx: DATA_SCALE * 100, cy: DATA_SCALE * 200, v: 777 },
        { x: 2, y: 0, cx: DATA_SCALE * 150, cy: DATA_SCALE * 250, v: 330 },

        { x: 0, y: 1, cx: DATA_SCALE * 250, cy: DATA_SCALE * 150, v: 450 },
        { x: 1, y: 1, cx: DATA_SCALE * 200, cy: DATA_SCALE * 275, v: 1000 },
        { x: 2, y: 1, cx: DATA_SCALE * 200, cy: DATA_SCALE * 025, v: 152 }

    ];

    //
    // Gradient Setup
    var gradient = {
        0.0: "rgba(000,000,255,0)",
        0.2: "rgba(000,000,255,1)",
        0.4: "rgba(000,255,255,1)",
        0.6: "rgba(000,255,000,1)",
        0.8: "rgba(255,255,000,1)",
        1.0: "rgba(255,000,000,1)"
    };
    var gradientImage = (function () {
        var canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 256;
        var ctx = canvas.getContext("2d");
        var grad = ctx.createLinearGradient(0, 0, 1, 256);

        for (var x in gradient) {
            grad.addColorStop(x, gradient[x]);
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1, 256);

        return ctx.getImageData(0, 0, 1, 256).data;
    })();

    //
    // Heatmap Colorizer
    function colorize(sourceCtx, destCtx, channel, width, height, alpha) {
        var blurImageData = sourceCtx.getImageData(0, 0, width, height);
        var blurImageDataPlain = blurImageData.data;

        for (var i = 0; i < blurImageDataPlain.length; i += 4) {
            var gray = blurImageDataPlain[i + channel];

            var r = gradientImage[gray * 4 + 0];
            var g = gradientImage[gray * 4 + 1];
            var b = gradientImage[gray * 4 + 2];
            var a = gradientImage[gray * 4 + 3];

            blurImageDataPlain[i] = r;
            blurImageDataPlain[i + 1] = g;
            blurImageDataPlain[i + 2] = b;
            blurImageDataPlain[i + 3] = alpha ? a : 255;
        }
        destCtx.putImageData(blurImageData, 0, 0);
    }

    //
    // Circle Based Heatmap
    (function (cellCanvas, alphaCanvas, blurredCanvas, heatmapCanvas) {

        cellCanvas = document.getElementById(cellCanvas);
        alphaCanvas = document.getElementById(alphaCanvas);
        blurredCanvas = document.getElementById(blurredCanvas);
        heatmapCanvas = document.getElementById(heatmapCanvas);

        var cellCtx = cellCanvas.getContext('2d');
        var alphaCtx = alphaCanvas.getContext('2d');
        var blurCtx = blurredCanvas.getContext('2d');
        var heatCtx = heatmapCanvas.getContext('2d');

        cellCtx.lineCap = 'round';
        cellCtx.font = '14px Arial';
        cellCtx.textAlign = 'center';
        cellCtx.textBaseLine = 'bottom';

        //
        // Fill Cells
        for (var i = 0; i < cells.length; i++) {
            var c = cells[i];
            var start = { x: c.x * CELL_SIZE[0], y: c.y * CELL_SIZE[1] };

            var gray = (255 * (c.v / maxValue)) | 0;
            var r = gradientImage[gray * 4 + 0];
            var g = gradientImage[gray * 4 + 1];
            var b = gradientImage[gray * 4 + 2];
            //var a = gradientImage[gray * 4 + 3];

            // cell - border
            cellCtx.beginPath();
            cellCtx.moveTo(0.5 + start.x, 0.5 + start.y + CELL_SIZE[1]);
            cellCtx.lineTo(0.5 + start.x + CELL_SIZE[0], 0.5 + start.y + CELL_SIZE[1]);
            cellCtx.moveTo(0.5 + start.x + CELL_SIZE[0], 0.5 + start.y);
            cellCtx.lineTo(0.5 + start.x + CELL_SIZE[0], 0.5 + start.y + CELL_SIZE[1]);
            cellCtx.stroke();

            // cell - fill
            cellCtx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            cellCtx.beginPath();
            cellCtx.arc(start.x + c.cx, start.y + c.cy, CELL_SIZE[0] / 2, 0, 2 * Math.PI, false);
            cellCtx.fill();

            // cell - cross
            cellCtx.beginPath();
            cellCtx.moveTo(start.x + c.cx - CROSS_SIZE[0], start.y + c.cy - CROSS_SIZE[1]);
            cellCtx.lineTo(start.x + c.cx + CROSS_SIZE[0], start.y + c.cy + CROSS_SIZE[1]);
            cellCtx.moveTo(start.x + c.cx - CROSS_SIZE[0], start.y + c.cy + CROSS_SIZE[1]);
            cellCtx.lineTo(start.x + c.cx + CROSS_SIZE[0], start.y + c.cy - CROSS_SIZE[1]);
            cellCtx.stroke();

            // cell - value
            cellCtx.fillStyle = '#000';
            cellCtx.fillText(c.v, start.x + c.cx, start.y + c.cy - 5);

            // blurred - alpha circle to be blurred later
            blurCtx.fillStyle = 'rgba( 0,0,0,' + (gray / 255) + ')';
            blurCtx.beginPath();
            blurCtx.arc(start.x + c.cx, start.y + c.cy, CELL_SIZE[0] / 2, 0, 2 * Math.PI, false);
            blurCtx.fill();

            // alpha - circle
            alphaCtx.fillStyle = 'rgba( 0,0,0,' + (gray / 255) + ')';
            alphaCtx.beginPath();
            alphaCtx.arc(start.x + c.cx, start.y + c.cy, CELL_SIZE[0] / 2, 0, 2 * Math.PI, false);
            alphaCtx.fill();
        }

        //
        // Blur Canvas
        stackBlurCanvasRGBA(blurredCanvas.id, 0, 0, blurredCanvas.width, blurredCanvas.height, CELL_SIZE[0] * 0.5);

        //
        // Map Blurred canvas to heatmap
        colorize(blurCtx, heatCtx, 3, blurredCanvas.width, blurredCanvas.height, true);

    })('circleCell', 'circleAlpha', 'circleBlur', 'circleHeat');


    //
    // Heatmap.js
    function heatmapTest(detailedCanvas, grayscaleCanvas, undetailedCanvas, opacity, radius, blurRadius) {

        //
        // Prepare data
        var data = {
            max: maxValue,
            data: []
        };
        for (var i = 0; i < cells.length; i++) {
            var c = cells[i];
            var start = { x: c.x * CELL_SIZE[0], y: c.y * CELL_SIZE[1] };
            data.data.push({ x: start.x + c.cx, y: start.y + c.cy, count: c.v });
        }

        //
        // Detailed Canvas

        var detailedHeatmap = h337.create({
            element: document.getElementById(detailedCanvas),
            gradient: gradient,
            opacity: opacity,
            radius: radius,
            blurRadius: blurRadius,
            debug: true
        });

        var context = detailedHeatmap.get('ctx');
        detailedHeatmap.store.setDataSet(data);
        for (var i = 0; i < cells.length; i++) {
            var c = cells[i];
            var start = { x: c.x * CELL_SIZE[0], y: c.y * CELL_SIZE[1] };
            // border
            context.beginPath();
            context.moveTo(0.5 + start.x, 0.5 + start.y + CELL_SIZE[1]);
            context.lineTo(0.5 + start.x + CELL_SIZE[0], 0.5 + start.y + CELL_SIZE[1]);
            context.moveTo(0.5 + start.x + CELL_SIZE[0], 0.5 + start.y);
            context.lineTo(0.5 + start.x + CELL_SIZE[0], 0.5 + start.y + CELL_SIZE[1]);

            // cross
            context.moveTo(start.x + c.cx - CROSS_SIZE[0], start.y + c.cy - CROSS_SIZE[1]);
            context.lineTo(start.x + c.cx + CROSS_SIZE[0], start.y + c.cy + CROSS_SIZE[1]);
            context.moveTo(start.x + c.cx - CROSS_SIZE[0], start.y + c.cy + CROSS_SIZE[1]);
            context.lineTo(start.x + c.cx + CROSS_SIZE[0], start.y + c.cy - CROSS_SIZE[1]);
            context.stroke();

            // value
            context.fillStyle = '#000';
            context.fillText(c.v, start.x + c.cx, start.y + c.cy - 5);
        }

        var debugCanvas = detailedHeatmap.get('acanvas');
        document.getElementById(grayscaleCanvas).appendChild(debugCanvas);

        var undetailedHeatmap = h337.create({
            element: document.getElementById(undetailedCanvas),
            gradient: gradient,
            opacity: opacity,
            radius: radius,
            blurRadius: blurRadius
        });
        undetailedHeatmap.store.setDataSet(data);
    }
    heatmapTest('heatmapjsDefDetailed', 'heatmapjsDefGray', 'heatmapjsDefUndetailed', 80, CELL_SIZE[0] * 0.5, 15); 
 
 })(window, jQuery);