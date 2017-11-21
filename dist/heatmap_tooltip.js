///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['d3', 'jquery', 'lodash', 'app/core/utils/kbn', './heatmap_data_converter'], function(exports_1) {
    var d3_1, jquery_1, lodash_1, kbn_1, heatmap_data_converter_1;
    var TOOLTIP_PADDING_X, TOOLTIP_PADDING_Y, HISTOGRAM_WIDTH, HISTOGRAM_HEIGHT, HeatmapTooltip;
    return {
        setters:[
            function (d3_1_1) {
                d3_1 = d3_1_1;
            },
            function (jquery_1_1) {
                jquery_1 = jquery_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (kbn_1_1) {
                kbn_1 = kbn_1_1;
            },
            function (heatmap_data_converter_1_1) {
                heatmap_data_converter_1 = heatmap_data_converter_1_1;
            }],
        execute: function() {
            TOOLTIP_PADDING_X = 30;
            TOOLTIP_PADDING_Y = 5;
            HISTOGRAM_WIDTH = 160;
            HISTOGRAM_HEIGHT = 40;
            HeatmapTooltip = (function () {
                function HeatmapTooltip(elem, scope) {
                    this.scope = scope;
                    this.dashboard = scope.ctrl.dashboard;
                    this.panelCtrl = scope.ctrl;
                    this.panel = scope.ctrl.panel;
                    this.heatmapPanel = elem;
                    this.mouseOverBucket = false;
                    this.originalFillColor = null;
                    elem.on("mouseover", this.onMouseOver.bind(this));
                    elem.on("mouseleave", this.onMouseLeave.bind(this));
                }
                HeatmapTooltip.prototype.onMouseOver = function (e) {
                    if (!this.panel.tooltip.show || !this.scope.ctrl.data || lodash_1.default.isEmpty(this.scope.ctrl.data.buckets)) {
                        return;
                    }
                    if (!this.tooltip) {
                        this.add();
                        this.move(e);
                    }
                };
                HeatmapTooltip.prototype.onMouseLeave = function () {
                    this.destroy();
                };
                HeatmapTooltip.prototype.onMouseMove = function (e) {
                    if (!this.panel.tooltip.show) {
                        return;
                    }
                    this.move(e);
                };
                HeatmapTooltip.prototype.add = function () {
                    this.tooltip = d3_1.default.select("body")
                        .append("div")
                        .attr("class", "heatmap-tooltip graph-tooltip grafana-tooltip");
                };
                HeatmapTooltip.prototype.destroy = function () {
                    if (this.tooltip) {
                        this.tooltip.remove();
                    }
                    this.tooltip = null;
                };
                HeatmapTooltip.prototype.show = function (pos, data) {
                    if (!this.panel.tooltip.show || !data) {
                        return;
                    }
                    // shared tooltip mode
                    if (pos.panelRelY) {
                        return;
                    }
                    var _a = this.getBucketIndexes(pos, data), xBucketIndex = _a.xBucketIndex, yBucketIndex = _a.yBucketIndex;
                    if (!data.buckets[xBucketIndex] || !this.tooltip) {
                        this.destroy();
                        return;
                    }
                    var boundBottom, boundTop, valuesNumber;
                    var xData = data.buckets[xBucketIndex];
                    // Search in special 'zero' bucket also
                    var yData = lodash_1.default.find(xData.buckets, function (bucket, bucketIndex) {
                        return bucket.bounds.bottom === yBucketIndex || bucketIndex === yBucketIndex.toString();
                    });
                    var tooltipTimeFormat = 'YYYY-MM-DD HH:mm:ss';
                    var time = this.dashboard.formatDate(xData.x, tooltipTimeFormat);
                    // Decimals override. Code from panel/graph/graph.ts
                    var valueFormatter;
                    if (lodash_1.default.isNumber(this.panel.tooltipDecimals)) {
                        valueFormatter = this.valueFormatter(this.panel.tooltipDecimals, null);
                    }
                    else {
                        // auto decimals
                        // legend and tooltip gets one more decimal precision
                        // than graph legend ticks
                        var decimals = (this.panelCtrl.decimals || -1) + 1;
                        valueFormatter = this.valueFormatter(decimals, this.panelCtrl.scaledDecimals + 2);
                    }
                    var tooltipHtml = "<div class=\"graph-tooltip-time\">" + time + "</div>\n      <div class=\"heatmap-histogram\"></div>";
                    if (yData) {
                        if (yData.bounds) {
                            // Display 0 if bucket is a special 'zero' bucket
                            var bottom = yData.y ? yData.bounds.bottom : 0;
                            boundBottom = valueFormatter(bottom);
                            boundTop = valueFormatter(yData.bounds.top);
                            valuesNumber = yData.count;
                            tooltipHtml += "<div>\n          bucket: <b>" + boundBottom + " - " + boundTop + "</b> <br>\n          count: <b>" + valuesNumber + "</b> <br>\n        </div>";
                        }
                        else {
                            // currently no bounds for pre bucketed data
                            tooltipHtml += "<div>count: <b>" + yData.count + "</b><br></div>";
                        }
                    }
                    else {
                        if (!this.panel.tooltip.showHistogram) {
                            this.destroy();
                            return;
                        }
                        boundBottom = yBucketIndex;
                        boundTop = '';
                        valuesNumber = 0;
                    }
                    this.tooltip.html(tooltipHtml);
                    if (this.panel.tooltip.showHistogram) {
                        this.addHistogram(xData);
                    }
                    this.move(pos);
                };
                HeatmapTooltip.prototype.getBucketIndexes = function (pos, data) {
                    var xBucketIndex = this.getXBucketIndex(pos.offsetX, data);
                    var yBucketIndex = this.getYBucketIndex(pos.offsetY, data);
                    return { xBucketIndex: xBucketIndex, yBucketIndex: yBucketIndex };
                };
                HeatmapTooltip.prototype.getXBucketIndex = function (offsetX, data) {
                    var x = this.scope.xScale.invert(offsetX - this.scope.yAxisWidth).valueOf();
                    var xBucketIndex = heatmap_data_converter_1.getValueBucketBound(x, data.xBucketSize, 1);
                    return xBucketIndex;
                };
                HeatmapTooltip.prototype.getYBucketIndex = function (offsetY, data) {
                    var y = this.scope.yScale.invert(offsetY - this.scope.chartTop);
                    var yBucketIndex = heatmap_data_converter_1.getValueBucketBound(y, data.yBucketSize, this.panel.yAxis.logBase);
                    return yBucketIndex;
                };
                HeatmapTooltip.prototype.getSharedTooltipPos = function (pos) {
                    // get pageX from position on x axis and pageY from relative position in original panel
                    pos.pageX = this.heatmapPanel.offset().left + this.scope.xScale(pos.x);
                    pos.pageY = this.heatmapPanel.offset().top + this.scope.chartHeight * pos.panelRelY;
                    return pos;
                };
                HeatmapTooltip.prototype.addHistogram = function (data) {
                    var xBucket = this.scope.ctrl.data.buckets[data.x];
                    var yBucketSize = this.scope.ctrl.data.yBucketSize;
                    var _a = this.scope.ctrl.data.yAxis, min = _a.min, max = _a.max, ticks = _a.ticks;
                    var histogramData = lodash_1.default.map(xBucket.buckets, function (bucket) {
                        var count = bucket.count !== undefined ? bucket.count : bucket.values.length;
                        return [bucket.bounds.bottom, count];
                    });
                    histogramData = lodash_1.default.filter(histogramData, function (d) {
                        return d[0] >= min && d[0] <= max;
                    });
                    var scale = this.scope.yScale.copy();
                    var histXScale = scale
                        .domain([min, max])
                        .range([0, HISTOGRAM_WIDTH]);
                    var barWidth;
                    if (this.panel.yAxis.logBase === 1) {
                        barWidth = Math.floor(HISTOGRAM_WIDTH / (max - min) * yBucketSize * 0.9);
                    }
                    else {
                        var barNumberFactor = yBucketSize ? yBucketSize : 1;
                        barWidth = Math.floor(HISTOGRAM_WIDTH / ticks / barNumberFactor * 0.9);
                    }
                    barWidth = Math.max(barWidth, 1);
                    // Normalize histogram Y axis
                    var histogramDomain = lodash_1.default.reduce(lodash_1.default.map(histogramData, function (d) { return d[1]; }), function (sum, val) { return sum + val; }, 0);
                    var histYScale = d3_1.default.scaleLinear()
                        .domain([0, histogramDomain])
                        .range([0, HISTOGRAM_HEIGHT]);
                    var histogram = this.tooltip.select(".heatmap-histogram")
                        .append("svg")
                        .attr("width", HISTOGRAM_WIDTH)
                        .attr("height", HISTOGRAM_HEIGHT);
                    histogram.selectAll(".bar").data(histogramData)
                        .enter().append("rect")
                        .attr("x", function (d) {
                        return histXScale(d[0]);
                    })
                        .attr("width", barWidth)
                        .attr("y", function (d) {
                        return HISTOGRAM_HEIGHT - histYScale(d[1]);
                    })
                        .attr("height", function (d) {
                        return histYScale(d[1]);
                    });
                };
                HeatmapTooltip.prototype.move = function (pos) {
                    if (!this.tooltip) {
                        return;
                    }
                    var elem = jquery_1.default(this.tooltip.node())[0];
                    var tooltipWidth = elem.clientWidth;
                    var tooltipHeight = elem.clientHeight;
                    var left = pos.pageX + TOOLTIP_PADDING_X;
                    var top = pos.pageY + TOOLTIP_PADDING_Y;
                    if (pos.pageX + tooltipWidth + 40 > window.innerWidth) {
                        left = pos.pageX - tooltipWidth - TOOLTIP_PADDING_X;
                    }
                    if (pos.pageY - window.pageYOffset + tooltipHeight + 20 > window.innerHeight) {
                        top = pos.pageY - tooltipHeight - TOOLTIP_PADDING_Y;
                    }
                    return this.tooltip
                        .style("left", left + "px")
                        .style("top", top + "px");
                };
                HeatmapTooltip.prototype.valueFormatter = function (decimals, scaledDecimals) {
                    if (scaledDecimals === void 0) { scaledDecimals = null; }
                    var format = this.panel.yAxis.format;
                    return function (value) {
                        return kbn_1.default.valueFormats[format](value, decimals, scaledDecimals);
                    };
                };
                return HeatmapTooltip;
            })();
            exports_1("HeatmapTooltip", HeatmapTooltip);
        }
    }
});
//# sourceMappingURL=heatmap_tooltip.js.map