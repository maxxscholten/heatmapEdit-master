System.register(['d3'], function(exports_1) {
    var d3_1;
    ///import * as d3ScaleChromatic from 'd3-scale-chromatic';
    function getColorScale(colorScheme, lightTheme, maxValue, minValue) {
        if (minValue === void 0) { minValue = 0; }
        //let colorInterpolator = d3ScaleChromatic[colorScheme.value];
        var colorScaleInverted = colorScheme.invert === 'always' ||
            (colorScheme.invert === 'dark' && !lightTheme);
        var start = colorScaleInverted ? maxValue : minValue;
        var end = colorScaleInverted ? minValue : maxValue;
        ////return d3.scaleSequential(colorInterpolator).domain([start, end]);
        return null;
    }
    exports_1("getColorScale", getColorScale);
    function getOpacityScale(options, maxValue, minValue) {
        if (minValue === void 0) { minValue = 0; }
        var legendOpacityScale;
        if (options.colorScale === 'linear') {
            legendOpacityScale = d3_1.default.scaleLinear()
                .domain([minValue, maxValue])
                .range([0, 1]);
        }
        else if (options.colorScale === 'sqrt') {
            legendOpacityScale = d3_1.default.scalePow().exponent(options.exponent)
                .domain([minValue, maxValue])
                .range([0, 1]);
        }
        return legendOpacityScale;
    }
    exports_1("getOpacityScale", getOpacityScale);
    return {
        setters:[
            function (d3_1_1) {
                d3_1 = d3_1_1;
            }],
        execute: function() {
        }
    }
});
//# sourceMappingURL=color_scale.js.map