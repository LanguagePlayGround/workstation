var myApp = angular.module('myApp', []);

myApp.controller("lineGraphCtrl", ["$scope", function ($scope) {

    $scope.graphOptions = {
        "data1":"mydata",
        "xaxis":{field:"hour"},
        "yAxis":{"leftYAxisField":"usage.cpu", "showGraphForRightYAxis":true, "rightYAxisField":"usage.RAM"},
//        "height":400,
//        "width":900,
//        "margin":{"left":80, "right":80, "top":80, "bottom":80},
        "showYAxisLabel":{"leftYAxisLabel":true, "leftLabelValue":"CPU%", "rightYAxisLabel":true, "rightLabelValue":"RAM USAGE"},
        "showXAxisLabel":{"startValue":true, "endValue":true, "wholeData":false, "label":true, "labelValue":"Time"}
    };

    $scope.mydata = [
        {"hour":1, "usage":{"RAM":1500, "cpu":3}},
        {"hour":2, "usage":{"RAM":20, "cpu":6}},
        {"hour":3, "usage":{"RAM":1150, "cpu":2}},
        {"hour":4, "usage":{"RAM":60, "cpu":7}},
        {"hour":5, "usage":{"RAM":30, "cpu":5}},
        {"hour":6, "usage":{"RAM":100, "cpu":2}},
        {"hour":7, "usage":{"RAM":90, "cpu":0}},
        {"hour":8, "usage":{"RAM":1070, "cpu":3}},
        {"hour":9, "usage":{"RAM":140, "cpu":8}},
        {"hour":10, "usage":{"RAM":580, "cpu":9}},
        {"hour":11, "usage":{"RAM":180, "cpu":10}},
        {"hour":12, "usage":{"RAM":80, "cpu":9}},
        {"hour":13, "usage":{"RAM":1150, "cpu":30}},
        {"hour":14, "usage":{"RAM":100, "cpu":3}},
        {"hour":15, "usage":{"RAM":10, "cpu":13}},
        {"hour":16, "usage":{"RAM":110, "cpu":1}}
    ];

}]);

myApp.directive("lineGraph", function () {
    return{
        restrict:"A",
        link:function (scope, element, attrs) {

            var xaxisName = scope.graphOptions.xaxis.field;
            var chartData1 = scope.$eval(scope.graphOptions.data1);
            var leftYAxis = scope.graphOptions.yAxis.leftYAxisField;


            var data1 = [];
            scope.getData1 = function () {
                for (var i = 0; i < chartData1.length; i++) {
                    var convertedData1 = [];
                    var xAxisValueData1 = Util.resolveDot(chartData1[i], xaxisName);
                    convertedData1.push(xAxisValueData1);
                    var leftYAxisValue = Util.resolveDot(chartData1[i], leftYAxis)
                    convertedData1.push(leftYAxisValue);
                    data1.push(convertedData1);
                }
            }
            scope.getData1();
            console.log("converted data1 into array of array>>>>" + JSON.stringify(data1));


            // define dimensions of graph
            var viewBoxWidth = element[0].offsetWidth;         //default width
            var viewBoxHeight = element[0].offsetHeight;          //default height
            var margin = {left:80, right:80, bottom:80, top:80};    //setting default margin


            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.top != undefined) {
                margin.top = scope.graphOptions.margin.top;
            }
            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.left != undefined) {
                margin.left = scope.graphOptions.margin.left;
            }
            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.right != undefined) {
                margin.right = scope.graphOptions.margin.right;
            }
            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.bottom != undefined) {
                margin.bottom = scope.graphOptions.margin.bottom;
            }
            if (scope.graphOptions.width != undefined) {
                viewBoxWidth = scope.graphOptions.width;
            }
            if (scope.graphOptions.height != undefined) {
                viewBoxHeight = scope.graphOptions.height;
            }

            var height = viewBoxHeight - margin.top - margin.bottom;
            var width = viewBoxWidth - margin.left - margin.right;


            var min_value_for_x_axis = d3.min(data1, function (d) {
                return d[0];
            });
//            var min_value_for_x_axis = data1[0][0]

            var max_value_for_x_axis = d3.max(data1, function (d) {
                return d[0];
            });
//            var max_value_for_x_axis =data1[data1.length-1][0]


            // X scale will fit all values from data[] within pixels 0-width
            // x scale values will be from minimum value to maximum value of data
            var xScale = d3.scale.linear()
                .domain([d3.min(data1, function (d) {
                return d[0];
            }), d3.max(data1, function (d) {
                return d[0];
            })])
//                .domain([0, data1.length-1])
                .range([0, width]);

            //setting left y scale with values starting from 0 to maximum value of data
            var y1Scale = d3.scale.linear()
                .range([height, 0])
                .domain([0, d3.max(data1, function (d) {
                return d[1];
            })])


            // create a line function that can convert data[] into x and y points
            var line1 = d3.svg.line()
                .x(function (d, i) {
                    // return the X coordinate where we want to plot this datapoint
                    return xScale(d[0]);
                })
                .y(function (d, i) {
                    // return the Y coordinate where we want to plot this datapoint
                    return y1Scale(d[1]);
                })

            // Add an SVG element with the desired dimensions and margin.
            var svg = d3.select(element[0]).append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("svg:g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // create xAxis
            var xAxis = d3.svg.axis().scale(xScale).tickSize(0);
            // Add the x-axis.
            var g = svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")

            var showXAxisWholeData = false;
            if (scope.graphOptions.showXAxisLabel != undefined && scope.graphOptions.showXAxisLabel.wholeData != undefined) {
                showXAxisWholeData = scope.graphOptions.showXAxisLabel.wholeData;
            }
            if (showXAxisWholeData) {
                g.call(xAxis);
            }


            var showStartValueOnLeft = true;
            if (scope.graphOptions.showXAxisLabel != undefined && scope.graphOptions.showXAxisLabel.startValue != undefined) {
                showStartValueOnLeft = scope.graphOptions.showXAxisLabel.startValue;
            }
            if (showStartValueOnLeft) {
                g.append("text")
                    .attr("transform", "rotate(0)")
                    .attr("y", margin.bottom / 2)
                    .attr("class", "x axis")
                    .style("text-anchor", "end")
                    .text(min_value_for_x_axis)
            }

            var showEndValueOnRight = true;
            if (scope.graphOptions.showXAxisLabel != undefined && scope.graphOptions.showXAxisLabel.endValue != undefined) {
                showEndValueOnRight = scope.graphOptions.showXAxisLabel.endValue;
            }
            if (showEndValueOnRight) {
                g.append("text")
                    .attr("transform", "rotate(0)")
                    .attr("y", margin.bottom / 2)
                    .attr("x", width)
                    .attr("class", "x axis")
                    .style("text-anchor", "begin")
                    .text(max_value_for_x_axis)
            }

            var xLabelValue = "";
            var showXAxislabelValue = false;
            if (scope.graphOptions.showXAxisLabel != undefined && scope.graphOptions.showXAxisLabel.label != undefined) {
                showXAxislabelValue = scope.graphOptions.showXAxisLabel.label;
            }
            if (showXAxislabelValue) {
                xLabel = g.append("text")
                    .attr("transform", "rotate(0)")
                    .attr("y", margin.bottom / 2)
                    .attr("x", width / 2)
                    .attr("class", "x axis")
                    .style("text-anchor", "end")
//                    .text("TIME")

                if (scope.graphOptions.showXAxisLabel != undefined && scope.graphOptions.showXAxisLabel.labelValue != undefined) {
                    xLabelValue = scope.graphOptions.showXAxisLabel.labelValue;
                }
                xLabel.text(xLabelValue);
            }

            // create left yAxis
            var leftLabelValue = "";
            var yAxisLeft = d3.svg.axis().scale(y1Scale).ticks(10).orient("left");
            // Add the y-axis to the left
            var leftAxis = svg.append("g")
                .attr("class", "y axis axisLeft")
                .attr("transform", "translate(-5,0)")
                .call(yAxisLeft)
            var showYAxisLeftlabel = false;
            if (scope.graphOptions.showYAxisLabel != undefined && scope.graphOptions.showYAxisLabel.leftYAxisLabel != undefined) {
                showYAxisLeftlabel = scope.graphOptions.showYAxisLabel.leftYAxisLabel;
            }
            if (showYAxisLeftlabel) {
                leftAxisLabel = leftAxis.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -margin.left / 2)
                    .attr("dy", ".41em")
                    .style("text-anchor", "end")
                //                    .text("CPU%");
                if (scope.graphOptions.showYAxisLabel != undefined && scope.graphOptions.showYAxisLabel.leftLabelValue != undefined) {
                    leftLabelValue = scope.graphOptions.showYAxisLabel.leftLabelValue;
                }
                leftAxisLabel.text(leftLabelValue);

            }


            // add lines
            // do this AFTER the axes above so that the line is above the tick-lines
            svg.append("path").attr("d", line1(data1)).attr("fill", "none").attr("class", "data1")
            svg.selectAll(".circle")
                .data(data1)
                .enter()
                .append("g")
                .append("circle")
                .attr("class", "circle")
                .attr("cx", function (d, i) {
                    return xScale(d[0]);
                })
                .attr("cy", function (d, i) {
                    return y1Scale(d[1]);
                })
                .attr("r", 1).append("title")
                .text(function (d) {
                    return  "Value is " + d[1];
//                    return leftLabelValue + "  value is " + d[1] + " at " + xLabelValue + " " + d[0];
                });

            if (scope.graphOptions.yAxis.showGraphForRightYAxis) {

                var chartData2 = scope.$eval(scope.graphOptions.data1);
                var rightYAxis = scope.graphOptions.yAxis.rightYAxisField;
                var data2 = [];
                scope.getData2 = function () {
                    for (var i = 0; i < chartData2.length; i++) {
                        var convertedData2 = [];
                        var xAxisValueData2 = Util.resolveDot(chartData2[i], xaxisName);
                        convertedData2.push(xAxisValueData2);
                        var rightYAxisValue = Util.resolveDot(chartData2[i], rightYAxis)
                        convertedData2.push(rightYAxisValue);
                        data2.push(convertedData2);
                    }
                }
                scope.getData2();
                console.log("converted data2 into array of array>>>>" + JSON.stringify(data2));

                //setting right y scale with values starting from 0 to maximum value of data
                var y2Scale = d3.scale.linear()
                    .range([height, 0])
                    .domain([0, d3.max(data2, function (d) {
                    return d[1];
                })])


                // create a line function that can convert data[] into x and y points
                var line2 = d3.svg.line()
                    .x(function (d, i) {
                        // return the X coordinate where we want to plot this datapoint
                        return xScale(d[0]);
                    })
                    .y(function (d, i) {
                        // return the Y coordinate where we want to plot this datapoint
                        return y2Scale(d[1]);
                    })


                // create right yAxis
                var yAxisRight = d3.svg.axis().scale(y2Scale).ticks(10).orient("right");
                var rightAxis = svg.append("g")
                    .attr("class", "y axis axisRight")
                    .attr("transform", "translate(" + (width + 5) + ",0)")
                    .call(yAxisRight)
                var showYAxisRightlabel = false;
                if (scope.graphOptions.showYAxisLabel != undefined && scope.graphOptions.showYAxisLabel.rightYAxisLabel != undefined) {
                    showYAxisRightlabel = scope.graphOptions.showYAxisLabel.rightYAxisLabel;
                }
                // Add the y-axis to the right
                if (showYAxisRightlabel) {
                    rightAxisLabel = rightAxis.append("text")
                        .attr("transform", "rotate(-90)")
                        .attr("y", margin.right / 2)
                        .attr("dy", ".41em")
                        .style("text-anchor", "end")
                    var rightLabelValue = "";
                    if (scope.graphOptions.showYAxisLabel != undefined && scope.graphOptions.showYAxisLabel.rightLabelValue != undefined) {
                        rightLabelValue = scope.graphOptions.showYAxisLabel.rightLabelValue;
                    }
                    rightAxisLabel.text(rightLabelValue);
                }


                //show line 2
                svg.append("path").attr("d", line2(data2)).attr("fill", "none").attr("class", "data2")
                svg.selectAll(".rect")
                    .data(data2)
                    .enter()
                    .append("g")
                    .append("rect")
                    .attr("class", "rect")
                    .attr("x",
                    function (d, i) {
                        return xScale(d[0]) - 1;
                    }).attr("width", 2).attr("height", 2)
                    .attr("y",
                    function (d, i) {
                        return y2Scale(d[1]) - 1;
                    }).append("title")
                    .text(function (d) {
//                    return rightLabelValue + "  value is " + d[1] + " at " + xLabelValue + " " + d[0];
                        return  "Value is " + d[1];
                    });
            }
        }
    };
});


myApp.controller('barGraphCtrl', ['$scope', function ($scope) {


    $scope.graphOptions = {"data":"mydata", "xaxis":{field:"names1"}, "yaxis":{field:"fee.amount", "scale":true}};

    $scope.mydata = [
        {"names1":"applane1", "fee":{"currency":"INR", "amount":100}},
        {"names1":"applane2", "fee":{"currency":"INR", "amount":150}},
        {"names1":"applane3", "fee":{"currency":"INR", "amount":-50}},
        {"names1":"applane4", "fee":{"currency":"INR", "amount":0}}
    ]

}
])

myApp.controller('pieChartCtrl', ['$scope', function ($scope) {
    $scope.mydata = [
        {"names1":"applane1", "fee":{"currency":"INR", "amount":110}},
        {"names1":"applane1", "fee":{"currency":"INR", "amount":110}},
        {"names1":"applane3", "fee":{"currency":"INR", "amount":220}},
        {"names1":"applane4", "fee":{"currency":"INR", "amount":120}},
        {"names1":"applane5", "fee":{"currency":"INR", "amount":210}},
        {"names1":"applane6", "fee":{"currency":"INR", "amount":290}}


    ]

    $scope.graphOptions = {"data":"mydata", "textOnPie":"names1", "legend":true, "showPercentageValue":true, "arcValue":"fee.amount", "showData":{"insidePie":true, "outsidePie":false}}
//    $scope.graphOptions={"data":"mydata","textOnPie":"names1","arcValue":"fee.amount"}
}
])

myApp.directive('pieChart', [ function ($scope) {

    return {
        link:function (scope, element, attrs) {

            var pieData = scope.$eval(scope.graphOptions.data);
            var textOnPie = scope.graphOptions.textOnPie;
            var arcValue = scope.graphOptions.arcValue;


            var data = [];
            scope.getData = function () {
                for (var i = 0; i < pieData.length; i++) {
                    var convertedData = [];
                    var pieText = Util.resolveDot(pieData[i], textOnPie);
                    convertedData.push(pieText);
                    var pieArcValue = Util.resolveDot(pieData[i], arcValue)
                    convertedData.push(pieArcValue);
                    data.push(convertedData);
                }
            }
            scope.getData();
            console.log("converted data into array of array>>>>" + JSON.stringify(data))

//            console.log(element.parent()[0])
            var width = element[0].offsetWidth,
                height = element[0].offsetHeight

            if (scope.graphOptions.width != undefined) {
                width = scope.graphOptions.width;
            }
            if (scope.graphOptions.height != undefined) {
                height = scope.graphOptions.height;
            }

            var radius = (Math.min(width, height) / 2) - 20;
//            var radius = (Math.min(width, height) / 2);
            var radiusForOutsideText = radius + 10
            var color = d3.scale.category20();

            var arc = d3.svg.arc()
                .outerRadius(radius)
                .innerRadius(0);

            // create a function to compute the pie slice angles
            var pie = d3.layout.pie()
                .sort(null)// if we do not set sort to null, then the pie data will be in descending order of value
                .value(function (d) {
                    return d[1];
                });

            var svg = d3.select(element[0]).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            // Draw the pie slices.
            var g = svg.selectAll(".arc")
                .data(pie(data))
                .enter().append("g")
                .attr("class", "arc");

            g.append("path")
                .attr("d", arc)
                .style("fill", function (d, i) {
                    return color(i);
                });


            //getting sum of data values
            var valueSum = d3.sum(data.map(function (v) {
                return v[1];
            }))

            //showing text inside pie
            var showTextInsidePie = undefined;
            if (scope.graphOptions.showData == undefined || scope.graphOptions.showData.insidePie == undefined) {
                showTextInsidePie = true;  //By default, inside text is shown
            } else {
                showTextInsidePie = scope.graphOptions.showData.insidePie;
            }
            if (showTextInsidePie) {

                var text = g.append("text")
                    .attr("transform", function (d) {
                        return "translate(" + arc.centroid(d) + ")";
                    })
                    .style("text-anchor", "middle")

                var showPercentageValue = undefined
                if (scope.graphOptions.showPercentageValue !== undefined) {
                    showPercentageValue = scope.graphOptions.showPercentageValue
                } else {
                    showPercentageValue = true          //by default percentage value is shown
                }
                if (showPercentageValue) {
                    text.text(function (d, i) {
                        return ((data[i][1] / valueSum) * 100).toFixed(2) + " %";
                    });
                } else {
                    text.text(function (d, i) {
                        return (data[i][1]);
                    });
                }
            }


//            showing text outside pie
            var showTextOutsidePie = undefined;
            if (scope.graphOptions.showData == undefined || scope.graphOptions.showData.outsidePie == undefined) {
                showTextOutsidePie = false;              //By default, outside text is not shown
            } else {
                showTextOutsidePie = scope.graphOptions.showData.outsidePie;
            }
            if (showTextOutsidePie) {
                g.append("text")
                    .attr("transform", function (d) {
                        var c = arc.centroid(d),
                            x = c[0],
                            y = c[1],
                        // pythagorean theorem for hypotenuse
                            h = Math.sqrt(x * x + y * y);
                        return "translate(" + (x / h * radiusForOutsideText) + ',' +
                            (y / h * radiusForOutsideText) + ")";
                    })
                    .attr("text-anchor", function (d) {
                        // are we past the center?
                        return (d.endAngle + d.startAngle) / 2 > Math.PI ?
                            "end" : "start";
                    })
                    .text(function (d, i) {
                        return data[i][0];
                    });
            }


            //to show the legend
            var showLegend = undefined;
            if (scope.graphOptions.legend == undefined) {
                showLegend = true;              //By default, outside text is shown
            } else {
                showLegend = scope.graphOptions.legend;
            }
            console.log(showLegend)

            function legend() {
                // create table for legend.
                var legend = d3.select(element[0]).append("table").attr('class', 'legend');

                // create one row per segment.
                var tr = legend.append("tbody").selectAll("tr").data(data).enter().append("tr");

                // create the first column for each segment.
                tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
                    .attr("width", '16').attr("height", '16')
                    .attr("fill", function (d, i) {
                        return color(i);
                    });

                // create the second column for each segment.
                tr.append("td").text(function (d, i) {
                    return data[i][0];
                });

                // create the third column for each segment.
                tr.append("td")
                    .text(function (d, i) {
                        return data[i][1]
                    });

            }

            if (showLegend) {
                legend();
            }

        }
    }
}]);


myApp.directive('barGraph', [ function ($scope) {

    return{

        link:function (scope, element) {

            var data = scope.$eval(scope.graphOptions.data);
            var xaxis = scope.graphOptions.xaxis.field
            var yaxis = scope.graphOptions.yaxis.field


            var finalData = [];
            scope.getData = function () {
                for (var i = 0; i < data.length; i++) {
                    var coordinate = [];
                    var xAxisValue = Util.resolveDot(data[i], xaxis);
                    coordinate.push(xAxisValue);
                    var yAxisValue = Util.resolveDot(data[i], yaxis)
                    coordinate.push(yAxisValue);
                    finalData.push(coordinate);
                }
            }

            scope.getData();
            console.log("newData" + JSON.stringify(finalData))


            var margin = {top:30, right:30, bottom:30, left:30}
            var viewBoxWidth = element[0].offsetWidth
            var viewBoxHeight = element[0].offsetHeight

            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.top != undefined) {
                margin.top = scope.graphOptions.margin.top;
            }
            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.left != undefined) {
                margin.left = scope.graphOptions.margin.left;
            }
            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.right != undefined) {
                margin.right = scope.graphOptions.margin.right;
            }
            if (scope.graphOptions.margin != undefined && scope.graphOptions.margin.bottom != undefined) {
                margin.bottom = scope.graphOptions.margin.bottom;
            }
            if (scope.graphOptions.width != undefined) {
                viewBoxWidth = scope.graphOptions.width;
            }
            if (scope.graphOptions.height != undefined) {
                viewBoxHeight = scope.graphOptions.height;
            }
            if (scope.graphOptions.yaxis.scale != undefined && !scope.graphOptions.yaxis.scale) {
                margin.left = 0;
            }


            var width = viewBoxWidth - margin.left - margin.right,
                height = viewBoxHeight - margin.top - margin.bottom;


            var x = d3.scale.ordinal()
                .rangeRoundBands([0, width], .2)
                .domain(finalData.map(function (d) {
                return d[0];

            }));
            ;

            var xAxis = d3.svg.axis()
                .scale(x)

            var y0 = Math.max(Math.abs(d3.min(finalData, function (d) {
                return d[1];
            })), Math.abs(d3.max(finalData, function (d) {
                return d[1];
            })));

            var y = d3.scale.linear()
                .range([height, 0])
                .domain([0, d3.max(finalData, function (d) {
                return d[1];
            })]);

            var negativeDataCount = 0;
            for (var i = 0; i < finalData.length; i++) {
                if (finalData[i][1] < 0) {
                    y.domain([-y0, y0])
                    negativeDataCount += 1
//                    break;
                }
                if (negativeDataCount == finalData.length) {
                    y.domain([-y0, 0])
                }
            }


            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");


            var svg = d3.select(element[0]).append("svg")
                .attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight)
                .attr("preserveAspectRatio", "xMidYMid meet")
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            var bars = svg.selectAll(".bar")
                .data(finalData)
                .enter().append("g")
                .attr("class", "bar")

            bars.append("rect")
                .attr("class", function (d, i) {
                    return d[1] < 0 ? "bar negative" : "bar positive";
                })
                .attr("x", function (d) {
                    return x(d[0]);
                })
                .attr("width", x.rangeBand())
                .attr("y", function (d) {
                    return y(Math.max(0, d[1]));
                })
                .attr("height", function (d) {
                    return Math.abs(y(d[1]) - y(0));
                })


            bars.append("text").text(function (d) {
                return d[1]
            })
                .attr("x", function (d) {
                    return x(d[0]) + x.rangeBand() / 2;
                })
                .attr("y", function (d) {
                    return d[1] < 0 ? y(d[1]) + 25 : y(d[1]) - 5
                })
                .attr("text-anchor", "middle")
            ;


            if (scope.graphOptions.yaxis.scale === undefined || scope.graphOptions.yaxis.scale) {
                svg.append("g")
                    .attr("class", "y axis")
                    .call(yAxis)
            }


//
//            bars.append("g")
//                .attr("class", "x axis")
//                .attr("transform", "translate(0," + height + ")")
//                .call(xAxis);
            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + y(0) + ")")
                .call(xAxis);


//            svg.append("g")
//                .attr("class", "x axis")
//                .attr("transform", "translate(0," + height + ")")
//                .call(xAxis);


        }

    };

}
])