///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['angular', 'lodash', 'jquery', 'd3', 'app/core/core', 'app/core/utils/ticks', './color_scale'], function(exports_1) {
    var angular_1, lodash_1, jquery_1, d3_1, core_1, ticks_1, color_scale_1;
    var module;
    function drawColorLegend(elem, colorScheme, rangeFrom, rangeTo, maxValue, minValue) {
        var legendElem = jquery_1.default(elem).find('svg');
        var legend = d3_1.default.select(legendElem.get(0));
        clearLegend(elem);
        var legendWidth = Math.floor(legendElem.outerWidth()) - 30;
        var legendHeight = legendElem.attr("height");
        var rangeStep = 1;
        if (rangeTo - rangeFrom > legendWidth) {
            rangeStep = Math.floor((rangeTo - rangeFrom) / legendWidth);
        }
        var widthFactor = legendWidth / (rangeTo - rangeFrom);
        var valuesRange = d3_1.default.range(rangeFrom, rangeTo, rangeStep);
        var colorScale = color_scale_1.getColorScale(colorScheme, core_1.contextSrv.user.lightTheme, maxValue, minValue);
        legend.selectAll(".heatmap-color-legend-rect")
            .data(valuesRange)
            .enter().append("rect")
            .attr("x", function (d) { return d * widthFactor; })
            .attr("y", 0)
            .attr("width", rangeStep * widthFactor + 1) // Overlap rectangles to prevent gaps
            .attr("height", legendHeight)
            .attr("stroke-width", 0)
            .attr("fill", function (d) { return colorScale(d); });
        drawLegendValues(elem, colorScale, rangeFrom, rangeTo, maxValue, minValue, legendWidth);
    }
    function drawOpacityLegend(elem, options, rangeFrom, rangeTo, maxValue, minValue) {
        var legendElem = jquery_1.default(elem).find('svg');
        var legend = d3_1.default.select(legendElem.get(0));
        clearLegend(elem);
        var legendWidth = Math.floor(legendElem.outerWidth()) - 30;
        var legendHeight = legendElem.attr("height");
        var rangeStep = 1;
        if (rangeTo - rangeFrom > legendWidth) {
            rangeStep = Math.floor((rangeTo - rangeFrom) / legendWidth);
        }
        var widthFactor = legendWidth / (rangeTo - rangeFrom);
        var valuesRange = d3_1.default.range(rangeFrom, rangeTo, rangeStep);
        var opacityScale = color_scale_1.getOpacityScale(options, maxValue, minValue);
        legend.selectAll(".heatmap-opacity-legend-rect")
            .data(valuesRange)
            .enter().append("rect")
            .attr("x", function (d) { return d * widthFactor; })
            .attr("y", 0)
            .attr("width", rangeStep * widthFactor)
            .attr("height", legendHeight)
            .attr("stroke-width", 0)
            .attr("fill", options.cardColor)
            .style("opacity", function (d) { return opacityScale(d); });
        drawLegendValues(elem, opacityScale, rangeFrom, rangeTo, maxValue, minValue, legendWidth);
    }
    function drawLegendValues(elem, colorScale, rangeFrom, rangeTo, maxValue, minValue, legendWidth) {
        var legendElem = jquery_1.default(elem).find('svg');
        var legend = d3_1.default.select(legendElem.get(0));
        if (legendWidth <= 0 || legendElem.get(0).childNodes.length === 0) {
            return;
        }
        var legendValueScale = d3_1.default.scaleLinear()
            .domain([0, rangeTo])
            .range([0, legendWidth]);
        var ticks = buildLegendTicks(0, rangeTo, maxValue, minValue);
        var xAxis = d3_1.default.axisBottom(legendValueScale)
            .tickValues(ticks)
            .tickSize(2);
        var colorRect = legendElem.find(":first-child");
        var posY = getSvgElemHeight(legendElem) + 2;
        var posX = getSvgElemX(colorRect);
        d3_1.default.select(legendElem.get(0)).append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + posX + "," + posY + ")")
            .call(xAxis);
        legend.select(".axis").select(".domain").remove();
    }
    function drawSimpleColorLegend(elem, colorScale) {
        var legendElem = jquery_1.default(elem).find('svg');
        clearLegend(elem);
        var legendWidth = Math.floor(legendElem.outerWidth());
        var legendHeight = legendElem.attr("height");
        if (legendWidth) {
            var valuesNumber = Math.floor(legendWidth / 2);
            var rangeStep = Math.floor(legendWidth / valuesNumber);
            var valuesRange = d3_1.default.range(0, legendWidth, rangeStep);
            var legend = d3_1.default.select(legendElem.get(0));
            var legendRects = legend.selectAll(".heatmap-color-legend-rect").data(valuesRange);
            legendRects.enter().append("rect")
                .attr("x", function (d) { return d; })
                .attr("y", 0)
                .attr("width", rangeStep + 1) // Overlap rectangles to prevent gaps
                .attr("height", legendHeight)
                .attr("stroke-width", 0)
                .attr("fill", function (d) { return colorScale(d); });
        }
    }
    function drawSimpleOpacityLegend(elem, options) {
        var legendElem = jquery_1.default(elem).find('svg');
        clearLegend(elem);
        var legend = d3_1.default.select(legendElem.get(0));
        var legendWidth = Math.floor(legendElem.outerWidth());
        var legendHeight = legendElem.attr("height");
        if (legendWidth) {
            var legendOpacityScale;
            if (options.colorScale === 'linear') {
                legendOpacityScale = d3_1.default.scaleLinear()
                    .domain([0, legendWidth])
                    .range([0, 1]);
            }
            else if (options.colorScale === 'sqrt') {
                legendOpacityScale = d3_1.default.scalePow().exponent(options.exponent)
                    .domain([0, legendWidth])
                    .range([0, 1]);
            }
            var rangeStep = 10;
            var valuesRange = d3_1.default.range(0, legendWidth, rangeStep);
            var legendRects = legend.selectAll(".heatmap-opacity-legend-rect").data(valuesRange);
            legendRects.enter().append("rect")
                .attr("x", function (d) { return d; })
                .attr("y", 0)
                .attr("width", rangeStep)
                .attr("height", legendHeight)
                .attr("stroke-width", 0)
                .attr("fill", options.cardColor)
                .style("opacity", function (d) { return legendOpacityScale(d); });
        }
    }
    function clearLegend(elem) {
        var legendElem = jquery_1.default(elem).find('svg');
        legendElem.empty();
    }
    function getSvgElemX(elem) {
        var svgElem = elem.get(0);
        if (svgElem && svgElem.x && svgElem.x.baseVal) {
            return svgElem.x.baseVal.value;
        }
        else {
            return 0;
        }
    }
    function getSvgElemHeight(elem) {
        var svgElem = elem.get(0);
        if (svgElem && svgElem.height && svgElem.height.baseVal) {
            return svgElem.height.baseVal.value;
        }
        else {
            return 0;
        }
    }
    function buildLegendTicks(rangeFrom, rangeTo, maxValue, minValue) {
        var range = rangeTo - rangeFrom;
        var tickStepSize = ticks_1.tickStep(rangeFrom, rangeTo, 3);
        var ticksNum = Math.round(range / tickStepSize);
        var ticks = [];
        for (var i = 0; i < ticksNum; i++) {
            var current = tickStepSize * i;
            // Add user-defined min and max if it had been set
            if (isValueCloseTo(minValue, current, tickStepSize)) {
                ticks.push(minValue);
                continue;
            }
            else if (minValue < current) {
                ticks.push(minValue);
            }
            if (isValueCloseTo(maxValue, current, tickStepSize)) {
                ticks.push(maxValue);
                continue;
            }
            else if (maxValue < current) {
                ticks.push(maxValue);
            }
            ticks.push(tickStepSize * i);
        }
        if (!isValueCloseTo(maxValue, rangeTo, tickStepSize)) {
            ticks.push(maxValue);
        }
        ticks.push(rangeTo);
        ticks = lodash_1.default.sortBy(lodash_1.default.uniq(ticks));
        return ticks;
    }
    function isValueCloseTo(val, valueTo, step) {
        var diff = Math.abs(val - valueTo);
        return diff < step * 0.3;
    }
    return {
        setters:[
            function (angular_1_1) {
                angular_1 = angular_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (jquery_1_1) {
                jquery_1 = jquery_1_1;
            },
            function (d3_1_1) {
                d3_1 = d3_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (ticks_1_1) {
                ticks_1 = ticks_1_1;
            },
            function (color_scale_1_1) {
                color_scale_1 = color_scale_1_1;
            }],
        execute: function() {
            module = angular_1.default.module('grafana.directives');
            /**
             * Color legend for heatmap editor.
             */
            module.directive('colorLegend', function () {
                return {
                    restrict: 'E',
                    template: '<div class="heatmap-color-legend"><svg width="16.8rem" height="24px"></svg></div>',
                    link: function (scope, elem, attrs) {
                        var ctrl = scope.ctrl;
                        var panel = scope.ctrl.panel;
                        render();
                        ctrl.events.on('render', function () {
                            render();
                        });
                        function render() {
                            var legendElem = jquery_1.default(elem).find('svg');
                            var legendWidth = Math.floor(legendElem.outerWidth());
                            if (panel.color.mode === 'spectrum') {
                                var colorScheme = lodash_1.default.find(ctrl.colorSchemes, { value: panel.color.colorScheme });
                                var colorScale = color_scale_1.getColorScale(colorScheme, core_1.contextSrv.user.lightTheme, legendWidth);
                                drawSimpleColorLegend(elem, colorScale);
                            }
                            else if (panel.color.mode === 'opacity') {
                                var colorOptions = panel.color;
                                drawSimpleOpacityLegend(elem, colorOptions);
                            }
                        }
                    }
                };
            });
            /**
             * Heatmap legend with scale values.
             */
            module.directive('heatmapLegend', function () {
                return {
                    restrict: 'E',
                    template: '<div class="heatmap-color-legend"><svg width="100px" height="14px"></svg></div>',
                    link: function (scope, elem, attrs) {
                        var ctrl = scope.ctrl;
                        var panel = scope.ctrl.panel;
                        render();
                        ctrl.events.on('render', function () {
                            render();
                        });
                        function render() {
                            clearLegend(elem);
                            if (!lodash_1.default.isEmpty(ctrl.data) && !lodash_1.default.isEmpty(ctrl.data.cards)) {
                                var rangeFrom = 0;
                                var rangeTo = ctrl.data.cardStats.max;
                                var maxValue = panel.color.max || rangeTo;
                                var minValue = panel.color.min || 0;
                                if (panel.color.mode === 'spectrum') {
                                    var colorScheme = lodash_1.default.find(ctrl.colorSchemes, { value: panel.color.colorScheme });
                                    drawColorLegend(elem, colorScheme, rangeFrom, rangeTo, maxValue, minValue);
                                }
                                else if (panel.color.mode === 'opacity') {
                                    var colorOptions = panel.color;
                                    drawOpacityLegend(elem, colorOptions, rangeFrom, rangeTo, maxValue, minValue);
                                }
                            }
                        }
                    }
                };
            });
        }
    }
});
//# sourceMappingURL=color_legend.js.map