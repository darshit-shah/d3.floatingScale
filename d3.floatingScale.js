d3.svg.floatingScale = function () {
    "use strict";
    var that = this;
    var scaleValues = [{ y: 0, value: 0 }, { y: 1, value: 1}];
    var tickValues = [];
    var scale = d3.scale.linear();
    var axis = d3.svg.axis().scale(scale).ticks(0);
    var duration = 250;
    var delay = 500;
    var updateChart = null;
    var chart = null;
    var min = +Infinity;
    var max = -Infinity;
    var tickFormat = null;
    var lineWidth = 3;
    var height = 100;
    var width = 100;

    function floatingScale(value) {
        if (!isFinite(value)) {
            throw "floatingScale() only accepts a number";
        }
        return scale(value);
    }

    function updateScale(delay, duration) {
        if (chart == undefined)
            return null;

        var scaleLines = [].concat(scaleValues);
        if (scaleLines.length === 2) {
            scaleLines.pop();
            scaleLines.shift();
        }

        var xy = ((axis.orient() == 'left' || axis.orient() == 'right') ? 'y' : 'x');
        var floatingLines = chart.selectAll(".axis.floating").data(scaleLines);

        floatingLines.enter().append("line")
            .attr("class", "axis floating " + xy)
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke-dasharray", "5,5")
            .attr("index", function (d, i) { return i })
            .style("cursor", "pointer")
            .style("stroke-width", lineWidth + "px")
            .call(drag)//drag magic - built in d3 behavior: https://github.com/mbostock/d3/wiki/Drag-Behavior#wiki-drag;
            ;
        floatingLines.exit().remove();

        chart.selectAll(".axis.floating")
                .transition()
                .delay(delay)
                .duration(duration)
                .attr(xy + "1", function (d) {
                    return floatingScale(d.value);
                })
                .attr(xy + "2", function (d) {
                    return floatingScale(d.value);
                });

        var floatingCircle = chart.selectAll(".axis.floatingCircle").data(scaleLines);
        floatingCircle.enter().append("circle")
                            .attr("class", xy + " axis floatingCircle")
                            .attr("c" + xy, (xy == 'x' ? height : width) + 20)
                            .attr("r", 20)
                            .style("stroke", "red")
                            .style("stroke-width", "3")
                            .style("fill", "transparent")
                            .attr("index", function (d, i) { return i })
                            .style("cursor", "pointer")
                            .call(drag) //drag magic - built in d3 behavior: https://github.com/mbostock/d3/wiki/Drag-Behavior#wiki-drag;
                            ;
        floatingCircle.exit().remove();

        chart.selectAll(".axis.floatingCircle")
                        .transition()
                        .delay(delay)
                        .duration(duration)
                        .attr("c" + xy, function (d) { return floatingScale(d.value) })
                        ;

        var floatingLabel = chart.selectAll(".axis.floatingLabel").data(scaleLines);
        floatingLabel.enter().append("text")
                .attr("class", xy + " axis floatingLabel")
                .attr(xy, (xy == 'x' ? height : width) + 20)
                .attr("index", function (d, i) { return i })
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("cursor", "pointer")
                .call(drag) //drag magic - built in d3 behavior: https://github.com/mbostock/d3/wiki/Drag-Behavior#wiki-drag;
                ;
        floatingLabel.exit().remove();

        chart.selectAll(".axis.floatingLabel")
            .transition()
            .delay(delay)
            .duration(duration)
            .attr(xy, function (d) { return floatingScale(d.value) })
            .text(function (d) {
                if (tickFormat == undefined)
                    return parseInt(d.value * 10) / 10;
                if (typeof tickFormat == "string")
                    return d3.format(tickFormat)(d.value);
                else if (typeof tickFormat == "function")
                    return tickFormat(d.value);
                else
                    return d.value;
            });

        return floatingScale;
    }

    function dragmove(dragged) {
        var index = parseInt(d3.select(dragged).attr("index"));
        var pos = ((axis.orient() == 'left' || axis.orient() == 'right') ? d3.event.dy : d3.event.dx);
        var prev = ((axis.orient() == 'left' || axis.orient() == 'right') ? -1 : 1);
        var next = ((axis.orient() == 'left' || axis.orient() == 'right') ? 1 : -1);
        //console.log(0, index, scaleValues.length - 1, scaleValues[index].y, pos, (scaleValues[index + prev].y - 10), (scaleValues[index + next].y + 10))
        if (index > 0 && index < (scaleValues.length - 1) && scaleValues[index].y + pos <= (scaleValues[index + prev].y - 10) && scaleValues[index].y + pos >= (scaleValues[index + next].y + 10)) {
            scaleValues[index].y += pos;
            updateLocalChart(0, 0);
        }
    }

    function dragstart(dragged) {
        var index = parseInt(d3.select(dragged).attr("index"));
        d3.selectAll(".floating[index='" + index + "']").style("stroke-width", (lineWidth * 2) + 'px');
    }

    function dragend(dragged) {
        var index = parseInt(d3.select(dragged).attr("index"));
        d3.selectAll(".floating[index='" + index + "']").style("stroke-width", lineWidth + 'px');
    }

    function updateLocalChart(delay, duration) {
        scale.domain(scaleValues.map(function (d) { return d.value })).range(scaleValues.map(function (d) { return d.y }));
        axis.tickValues(floatingScale.tickValues());
        if (updateChart != undefined)
            updateChart(delay, duration);
        updateScale(delay, duration);
    }

    floatingScale.scale = function (a) {
        if (a != undefined) {
            scale = a;
            return floatingScale;
        }
        else
            return scale;
    }

    floatingScale.axis = function (a) {
        if (a != undefined) {
            axis = a;
            return floatingScale;
        }
        else
            return axis;
    }

    floatingScale.height = function (a) {
        if (a != undefined) {
            height = a;
            return floatingScale;
        }
        else
            return height;
    }

    floatingScale.width = function (a) {
        if (a != undefined) {
            width = a;
            return floatingScale;
        }
        else
            return width;
    }

    floatingScale.ticks = function () {

        if (arguments == undefined) {
            return tickValues.length;
        }
        arguments[0] = parseFloat(arguments[0]);
        if (isFinite(arguments[0]) && arguments[0] > 0) {
            if (arguments[1] != undefined) {
                tickFormat = arguments[1]
                if (typeof tickFormat == 'string')
                    axis.tickFormat(d3.format(arguments[1]));
                else if (typeof tickFormat == 'function')
                    axis.tickFormat(arguments[1]);
                else
                    tickFormat = arguments[1];
            }
            axis.ticks.apply(this, arguments);
            var scaleValue = (((axis.orient() == 'left' || axis.orient() == 'right') ? height : width) - 0) / arguments[0];
            tickValues = [];
            for (var i = 0; i < arguments[0] + 1; i++) {
                tickValues.push(0 + (scaleValue * i))
            }
        }
        updateLocalChart(delay, duration);
        return floatingScale;
    }

    floatingScale.tickValues = function (values) {
        if (values == undefined) {
            var values = [];
            for (var i = 0; i < tickValues.length; i++) {
                values[i] = scale.invert(tickValues[i]);
            }
            return values;
        }
        else {
            tickValues = values;
        }
        return floatingScale;
    }

    floatingScale.addFloatingScaleLine = function (value) {
        if (!isFinite(value)) {
            throw "addFloatingScaleLine() only accepts a number";
        }
        if (value <= scaleValues[0].value) {
            return { status: false, code: 100, message: "value should be between range:[" + min + " ," + max + "]" };
        }
        else if (value >= scaleValues[scaleValues.length - 1].value) {
            return { status: false, code: 100, message: "value should be between range:[" + min + " ," + max + "]" };
        }
        for (var i = 1; i < scaleValues.length; i++) {
            if (scaleValues[i].value === value) {
                return { status: false, code: 101, message: "already added" };
                return;
            }
            else if (scaleValues[i].value > value) {
                var index = i;
                var newY1 = floatingScale(value);
                var newY2 = (scaleValues[index].y + scaleValues[index - 1].y) / 2;
                scaleValues.splice(index, 0, { value: value, y: newY1 });
                updateLocalChart(0, 0);
                scaleValues[index].y = newY2;
                updateLocalChart(delay, duration);
                break;
            }
        }
    }

    floatingScale.removeFloatingScaleLine = function (value) {
        if (!isFinite(value)) {
            throw "addFloatingScaleLine() only accepts a number";
        }
        if (value <= scaleValues[0].value) {
            return { status: false, code: 100, message: "value should be between range:[" + min + " ," + max + "]" };
        }
        else if (value >= scaleValues[scaleValues.length - 1].value) {
            return { status: false, code: 100, message: "value should be between range:[" + min + " ," + max + "]" };
        }
        for (var i = 1; i < scaleValues.length; i++) {
            if (scaleValues[i].value === value) {
                //                return { status: false, code: 101, message: "already added" };
                //                return;
                var index = i;
                scaleValues.splice(index, 1);
                updateLocalChart(delay, duration);
            }
        }
    }

    floatingScale.invert = function (value) {
        if (!isFinite(value)) {
            throw "invert() only accepts a number";
        }
        return scale.invert(value);
    }

    floatingScale.range = function (values) {
        if (values == undefined) {
            return scale.range();
        }
        if (values.length !== 2) {
            throw "range() only accepts array of two";
        }
        scale.range(values);
        scaleValues[0].y = values[0];
        scaleValues[scaleValues.length - 1].y = values[1];
        return floatingScale;
    }
    floatingScale.domain = function (values) {
        if (values == undefined) {
            return scale.domain();
        }
        if (values.length !== 2) {
            throw "range() only accepts array of two";
        }
        scale.domain(values);
        scaleValues[0].value = values[0];
        scaleValues[scaleValues.length - 1].value = values[1];
        while (scaleValues.length > 2) {
            scaleValues.splice(1, 1);
        }

        // console.log(scaleValues, values);
        axis.tickValues(floatingScale.tickValues());
        updateLocalChart(delay, duration);
        return floatingScale;
    }
    floatingScale.duration = function (d) {
        if (!isFinite(d)) {
            throw "duration() only accepts a number";
        }
        duration = d;
        return floatingScale;
    }

    floatingScale.delay = function (d) {
        if (!isFinite(d)) {
            throw "delay() only accepts a number";
        }
        delay = d;
        return floatingScale;
    }

    floatingScale.chart = function (c) {
        if (typeof c !== 'object') {
            throw "chart() only accepts an abject";
        }
        chart = c;
        //        d3.select(chart)
        //        .on("touchstart", nozoom)
        //        .on("touchmove", nozoom);
        return floatingScale;
    }

    floatingScale.updateChart = function (cb) {
        if (typeof cb !== 'function') {
            throw "updateChart() only accepts a function";
        }
        updateChart = cb;
        return floatingScale;
    }

    var drag = d3.behavior.drag()
            .origin(Object)
            .on("drag", function () {
                dragmove(this);
            })
            .on("dragstart", function () { dragstart(this); })
            .on("dragend", function () { dragend(this); });

    //    function nozoom() {
    //        d3.event.preventDefault();
    //    }
    return floatingScale;
};
