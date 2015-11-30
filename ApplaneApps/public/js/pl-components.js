/***** move to app-component.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

pl.filter('abs', function () {
    return function (val) {
        if (val < 0) {
            return Math.abs(val);
        } else {
            return val;
        }
    }
});
pl.filter('percentage', function () {
    return function (val) {
        if (angular.isNumber(val)) {
            val = Math.round(val);
        }
        if (val < 0) {
            val = Math.abs(val);
            return val + '%';
        } else if (val >= 0) {
            return val + '%';
        } else {
            return val;
        }
    }
});
pl.filter('zero', function () {
    return function (val, alias) {
        if (!val || val == '') {
            if (alias == 1) {
                return '-';
            } else {
                return 0;
            }
        } else {
            return val;
        }
    }
});

pl.directive('plFileUpload', function () {
    return {
        restrict: "A",
        replace: true,
        scope: true,
        require: 'ngModel',
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs, controller) {
                    iElement.bind('change', function () {
                        $scope.$apply(function () {
                            $scope.oFReader = new FileReader();
                            $scope.oFile = iElement[0].files[0];
                            $scope.oFReader.onload = $scope.uploadFile;
                            $scope.oFReader.readAsDataURL($scope.oFile);

                        });
                    });

                    $scope.uploadFile = function (evt) {
                        var isValidFileExtension = true;
                        var supportedExtensions = $scope.col.supportedExtensions;
                        var userFileExtension = undefined;
                        if ($scope.col.uploadLimit && ($scope.oFile.size > $scope.col.uploadLimit)) {
                            var error = new Error("File Size exceeds current upload limit of : " + $scope.col.uploadLimit + " bytes.");
                            if ($scope.handleClientError) {
                                $scope.handleClientError(error);
                            }
                            throw error;
                        }
                        if (supportedExtensions && supportedExtensions.length > 0) {
                            var fileName = $scope.oFile.name;
                            userFileExtension = fileName.substring(fileName.lastIndexOf("."));
                            var index = supportedExtensions.indexOf(userFileExtension);
                            if (index < 0) {
                                isValidFileExtension = false;
                            }
                        }

                        if (!isValidFileExtension) {
                            var error = new Error(userFileExtension + " is not supported. Supported file extensions are " + JSON.stringify(supportedExtensions));
                            if ($scope.handleClientError) {
                                $scope.handleClientError(error);
                            }
                            throw error;
                        }

                        $scope.loadFile($scope.oFile.name, $scope.oFile.type, evt.target.result).then(
                            function (result) {
                                if (angular.isUndefined(result) || angular.isUndefined(result.response)) {
                                    alert("Result not found !");
                                }

                                if (attrs.multiple) {
                                    var modelValue = controller.$modelValue || [];
                                    modelValue.push(result.response[0]);
                                    controller.$setViewValue(modelValue);
                                } else {
                                    controller.$setViewValue(result.response[0]);
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }).fail(function (err) {
                                if (err) {
                                    if ($scope.handleClientError) {
                                        $scope.handleClientError(err);
                                    }
                                }
                            });
                    }
                }
            };
        }
    }
});

pl.directive('plRemoveValue', function () {
    return {
        restrict: "EAC",
        require: "ngModel",
        compile: function () {
            return {
                post: function ($scope, iElement, attrs, controller) {
                    $scope.remove = function ($index, $event) {
                        try {

                            if (angular.isDefined($index) && angular.isDefined(controller.$modelValue) && angular.isArray(controller.$modelValue)) {
                                controller.$modelValue.splice($index, 1);
                                var modelValue = controller.$modelValue.length == 0 ? undefined : controller.$modelValue;
                                controller.$setViewValue(modelValue);
                            } else {
                                controller.$setViewValue(undefined);
                            }
                            $event.preventDefault();
                            $event.stopPropagation();

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                }
            };
        }
    }
});

pl.directive('ngModelRemove', function () {
    return {
        restrict: 'A',
        priority: 1,
        require: 'ngModel',
        link: function (scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;
            elm.unbind('input').unbind('change');
        }
    };
});

pl.directive('plDateFilter', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs, controller) {
                    var template = "<div class='pl-date-filter-div-parent'>" +
                        "               <div class='app-date-filter-left-arrow-filter' ng-show='showNavigationButtons && !showCustomPopUp && !showNDaysPopUp' ng-click='dateFilterNavigation(false)'></div>" +
//                        "                   <span ng-show='dateWrapper && !showCustomPopUp && !showNDaysPopUp' ng-click='showOptions($event)' class='pl-date-filter-disable'></span>" +
                        "                   <input ng-show='!showCustomPopUp && !showNDaysPopUp' ng-blur='handleBlur()' type='text' placeholder='{{filter.label}}' ng-click='showOptions($event)' class='pl-date-filter-div' ng-class='{\"app-width-auto\":!showNavigationButtons}' ng-model='filter.value' title='{{filter.value}}'/>" +
                        "               <div class='app-date-filter-right-arrow-filter' ng-show='showNavigationButtons && !showCustomPopUp && !showNDaysPopUp' ng-click='dateFilterNavigation(true)'></div>" +
                        "               <input ng-show='!showCustomPopUp && !showNDaysPopUp && !showNDaysPopUp' class='app-grid-date-picker-calender-image app-float-right'  type='text' ng-model='filter.fieldValue' tabindex='-1' data-trigger='focus' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                        "               <pl-custom-filter ng-show='showCustomPopUp && !showNDaysPopUp'></pl-custom-filter>" +
                        "               <pl-n-days-filter ng-show='showNDaysPopUp && !showCustomPopUp'></pl-n-days-filter>" +
                        "           </div>" +
                        "           <div ng-show='filter.pastComparison' class='compare-image app-cursor-pointer  pl-theme-background pl-cross-filter ' title='Past Comparison' ng-class='{\"active\":filter.__pastComparisonEnabled}' ng-click='pastComparisonChange(filter)'/>";
                    iElement.append($compile(template)($scope));
                    if ($scope.filter == undefined) {
                        return;
                    }
                    if ($scope.filter.__span__) {
                        $scope.dateWrapper = true;
                    } else {
                        $scope.dateWrapper = undefined;
                    }
                    if ($scope.filter.label == undefined) {
                        $scope.filter.label = 'date';
                    }

                    $scope.initialFilterValue = $scope.filter.value;
                    $scope.pastComparisonChange = function (filter) {
                        filter.__pastComparisonEnabled = !filter.__pastComparisonEnabled;
                    }
                    $scope.setFilterDate = function (filter, startDate, endDate, setWrapper) {
                        try {
                            if (setWrapper == undefined) {
                                $scope.dateWrapper = true;
                            }
                            if (filter && filter.time) {
                                if (filter.__span__ != 'rangeFilter') {
                                    startDate.setHours(0);
                                    startDate.setMinutes(0);
                                    startDate.setSeconds(0);
                                    endDate.setHours(0);
                                    endDate.setMinutes(0);
                                    endDate.setSeconds(0);
                                }
                            } else {
                                startDate = Util.setDateWithZeroTimezone(startDate);
                                endDate = Util.setDateWithZeroTimezone(endDate);
                            }
                            if (filter && filter.filter) {
                                filter.filter.$gte = startDate;
                                filter.filter.$lt = endDate;
                            }
                            $scope.removeError();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    function getValidDate(value) {
                        var split = value.split("/");
                        if (split && split.length == 3) {
                            var date = new Date(split[2] + "-" + split[1] + "-" + split[0]);
                            if (!isNaN(Date.parse(date))) {
                                return date;
                            }
                        } else {
                            return undefined;
                        }

                    }

                    $scope.erroHandling = function (msg) {
                        try {
                            if ($scope.gridOptions && $scope.gridOptions.warningOptions) {
                                $scope.gridOptions.warningOptions.error = msg;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            } else {
                                alert(msg);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };
                    $scope.removeError = function () {
                        try {
                            if ($scope.gridOptions && $scope.gridOptions.warningOptions && $scope.gridOptions.warningOptions.showWarning) {
                                delete $scope.gridOptions.warningOptions.error;
                                $scope.gridOptions.warningOptions.showWarning = false;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.handleBlur = function () {
                        try {
                            $scope.removeError();
                            var value = $scope.filter.value;
                            if (!value || value.toString().length == 0 || ($scope.initialFilterValue == value)) {
                                return;
                            }

                            var compositeDate = /[0-9 a-z ]-/g.test(value);
                            var firstDate = undefined;
                            var secondDate = undefined;
                            if (compositeDate) {
                                firstDate = value.split("-");
                                if (firstDate && firstDate.length == 2) {
                                    secondDate = getValidDate(firstDate[1].trim().substr(0, 10));
                                    firstDate = getValidDate(firstDate[0].trim().substr(0, 10));
                                    if (secondDate == undefined) {
                                        secondDate = new Date('march');
                                    }
                                    if (!angular.isDefined(secondDate) || !angular.isDefined(firstDate)) {
                                        throw  new BusinessLogicError('Date not parsable. Either select from given options or provide in dd/mm/yyyy format.');
                                    }
                                    if ((secondDate.getDay() - firstDate.getDay()) == 6) {
                                        $scope.filter.__span__ = "week";
                                        $scope.showNavigationButtons = true;
                                    } else {
                                        $scope.filter.__span__ = 'manual';
                                        $scope.showNavigationButtons = false;
                                    }
                                    secondDate = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate() + 1);
                                    $scope.filter.filter = {};
                                    $scope.setFilterDate($scope.filter, firstDate, secondDate, true);
                                    secondDate = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate() - 1);
                                    var label = $filter('date')(firstDate, "dd/MM/yyyy") + " - " + $filter('date')(secondDate, "dd/MM/yyyy");
                                    $scope.filter.value = label;

                                }
                            } else if (/\//g.test(value)) {
                                var date = getValidDate(value);
                                if (date) {
                                    if (angular.isDefined(date)) {
                                        var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                                        $scope.filter.filter = {};
                                        $scope.setFilterDate($scope.filter, date, nextDate, true);
                                        $scope.filter.value = $filter('date')(date, "dd/MM/yyyy");
                                        $scope.filter.__span__ = 'date';
                                        $scope.showNavigationButtons = true;
                                    }
                                }
                            } else if (value) {
                                //code to handle string keywords (today, yesterday, sun, jan , today +1 etc.) for date value
                                var isAprilOrAugust = /a(p|u)/.test(value);
                                if (isAprilOrAugust) {
                                    value = value.replace(/a/g, "/a");
                                }
                                date = Date.parse(value);
                                if (date) {
                                    var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                                    $scope.filter.__span__ = 'date';
                                    $scope.showNavigationButtons = true;
                                    $scope.filter.filter = {};
                                    $scope.setFilterDate($scope.filter, date, nextDate, true);
                                    $scope.filter.value = $filter('date')(date, "dd/MM/yyyy");
                                } else {
                                    throw  new BusinessLogicError('Date not parsable. Either select from given options or provide in dd/mm/yyyy format.');
                                }
                            } else {
                                throw  new BusinessLogicError('Date not parsable. Either select from given options or provide in dd/mm/yyyy format.');
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }

                    }

                    $scope.customFilter = function () {
                        try {
                            $scope.currentDateOptions = undefined;
                            $scope.showCustomPopUp = !$scope.showCustomPopUp;
                            if ($scope.filter.toValue && $scope.filter.fromValue) {
                                $scope.applyCustomFilter();
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.customFilterOptions = function (__filterOptions__, filterOptions) {
                        try {
                            if (filterOptions && filterOptions.length > 0) {
                                var customFilter = undefined;
                                var filterIndex = filterOptions.length - 1;
                                for (var i = 0; i < filterOptions.length; i++) {
                                    if (filterOptions[i].selected) {
                                        filterIndex = i;
                                        break;
                                    }
                                }
                                customFilter = filterOptions[filterIndex];
                                customFilter.selected = true;
                                $scope.filter.filter = {};
                                $scope.showNavigationButtons = true;
                                $scope.filter.__span__ = 'customRange';
                                var startRange = new Date(customFilter.startRange);
                                var endRange = new Date(customFilter.endRange);
                                endRange = new Date(endRange.getFullYear(), endRange.getMonth(), endRange.getDate() + 1)
                                $scope.setFilterDate($scope.filter, startRange, endRange);
                                $scope.filter.value = customFilter.label;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevCustomRange = function (filter, next, customFilter) {
                        try {
                            if (!filter || !customFilter || !customFilter.filterOptions) {
                                return;
                            }
                            var customFilterIndex = undefined;
                            for (var i = 0; i < customFilter.filterOptions.length; i++) {
                                var rangeFilter = customFilter.filterOptions[i];
                                if (rangeFilter.label == customFilter.value) {
                                    customFilterIndex = i;
                                    break;
                                }
                            }

                            if (customFilterIndex == undefined) {
                                return;
                            }
                            if (next && customFilterIndex < customFilter.filterOptions.length - 1) {
                                delete customFilter.filterOptions[customFilterIndex].selected;
                                customFilter.filterOptions[customFilterIndex + 1].selected = true;
                                $scope.customFilterOptions(undefined, customFilter.filterOptions);
                            } else if (!next && customFilterIndex > 0) {
                                delete customFilter.filterOptions[customFilterIndex].selected;
                                customFilter.filterOptions[customFilterIndex - 1].selected = true;
                                $scope.customFilterOptions(undefined, customFilter.filterOptions);
                            }

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.currentDate = function (__currentDate) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            $scope.filter.filter = {};
                            if (__currentDate) {
                                $scope.filter.filter = {$function: "Functions.CurrentDateFilter"};
                                $scope.showNavigationButtons = false;
                            } else {
                                $scope.showNavigationButtons = true;
                                $scope.filter.__span__ = 'date';
                                var currentDate = new Date();
                                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                                var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
                                $scope.setFilterDate($scope.filter, currentDate, nextDate);
                            }
                            $scope.filter.value = $filter('date')(new Date(), "dd/MM/yyyy");
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }


                    $scope.currentWeek = function (_CurrentWeek) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            var currentDate = new Date();
                            var first = currentDate.getDate() - currentDate.getDay();
                            var last = first + 6;
                            var weekFirstDay = new Date(currentDate);
                            weekFirstDay.setDate(first);
                            var weekLastDay = new Date(currentDate);
                            weekLastDay.setDate(last);
                            $scope.filter.filter = {};
                            if (_CurrentWeek) {
                                $scope.showNavigationButtons = false;
                                $scope.filter.filter = {$function: "Functions.CurrentWeekFilter"};
                            } else {
                                $scope.showNavigationButtons = true;
                                var nextDate = new Date(weekLastDay.getFullYear(), weekLastDay.getMonth(), weekLastDay.getDate() + 1);
                                $scope.filter.__span__ = 'week';
                                $scope.setFilterDate($scope.filter, weekFirstDay, nextDate);
                            }
                            var label = $filter('date')(weekFirstDay, "dd/MM/yyyy") + " - " + $filter('date')(weekLastDay, "dd/MM/yyyy");
                            $scope.filter.value = label;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.currentYear = function (__currentYear__) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            $scope.filter.filter = {};
                            if (__currentYear__) {
                                $scope.showNavigationButtons = false;
                                $scope.filter.filter = {$function: "Functions.CurrentYearFilter"};
                            } else {
                                $scope.showNavigationButtons = true;
                                var currentDate = new Date();
                                var firstDay = new Date(currentDate.getFullYear(), 0, 1, 0, 0, 0);
                                var lastDay = new Date(firstDay.getFullYear() + 1, 0, 1, 0, 0, 0);
                                $scope.filter.__span__ = 'year';
                                $scope.setFilterDate($scope.filter, firstDay, lastDay);
                            }
                            $scope.filter.value = $filter('date')(new Date(), "yyyy");
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };

                    $scope.currentMonth = function (__currentMonth__) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            var currentDate = new Date();
                            $scope.filter.filter = {};
                            if (__currentMonth__) {
                                $scope.showNavigationButtons = false;
                                $scope.filter.filter = {$function: "Functions.CurrentMonthFilter"};
                            } else {
                                $scope.showNavigationButtons = true;
                                $scope.filter.__span__ = 'month';
                                var monthFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                var nextMonthFirstDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                                $scope.setFilterDate($scope.filter, monthFirstDay, nextMonthFirstDate);
                            }
                            $scope.filter.value = $filter('date')(currentDate, "MMMM-yyyy");
                            $scope.initialFilterValue = $scope.filter.value;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.currentQuarter = function (__quarter__) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            var currentDate = new Date();
                            $scope.filter.filter = {};
                            $scope.showNavigationButtons = true;
                            $scope.filter.__span__ = 'quarter';
                            var quarterInfo = $scope.getQuarter(currentDate, 0);
                            if (quarterInfo) {
                                $scope.setFilterDate($scope.filter, quarterInfo.quarterFirstDay, quarterInfo.nextQuarterFirstDate);
                                $scope.filter.value = $filter('date')(quarterInfo.quarterFirstDay, "MMMM-yyyy") + " - " + $filter('date')(quarterInfo.nextQuarterFirstDate - 1, "MMMM-yyyy");
                                $scope.initialFilterValue = $scope.filter.value;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }

                    $scope.currentFilter = function () {
                        try {
                            $scope.showCustomPopUp = undefined;
                            $scope.currentDateOptions = [
                                {label: "Current Date", onClick: "currentDate"},
                                {label: "Current Month", onClick: "currentMonth"},
                                {label: "Current Year", onClick: "currentYear"},
                                {label: "Current Week", onClick: "currentWeek"}
                            ];
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.dateFilterOptions = [
                        {label: "Date", onClick: "currentDate"},
                        {label: "Week", onClick: "currentWeek"},
                        {label: "Month", onClick: "currentMonth"},
                        {label: "Quarter", onClick: "currentQuarter"},
                        {label: "Year", onClick: "currentYear"},
                        {label: "Custom", onClick: "customFilter"},
                        {label: "Last N days", onClick: "lastNDays"}
                    ];

                    $scope.populateCustomFilter = function () {
                        try {
                            if ($scope.filter.customFilter && $scope.filter.filterOptions) {
                                $scope.dateFilterOptions.push({label: $scope.filter.customFilter.label, onClick: "customFilterOptions", options: $scope.filter.filterOptions});
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.populateCustomFilter();

                    $scope.dateFilterNavigation = function (next) {
                        try {
                            var fieldValue = $scope.filter;
                            if (!fieldValue) {
                                return;
                            }
                            var filter = fieldValue.filter;
                            if (fieldValue.filter[fieldValue.field]) {
                                filter = fieldValue.filter[fieldValue.field];
                            }
                            var __span__ = fieldValue.__span__;
                            if (__span__ == "customRange") {
                                $scope.getNextPrevCustomRange(filter, next, $scope.filter);
                                return;
                            }
                            if (__span__ == "date") {
                                $scope.getNextPrevDate(filter, next);
                            } else if (__span__ == "month") {
                                $scope.getNextPrevMonth(filter, next);
                            } else if (__span__ == "year") {
                                $scope.getNextPrevYear(filter, next);
                            } else if (__span__ == "week") {
                                $scope.getNextPrevWeek(filter, next);
                            } else if (__span__ == "quarter") {
                                $scope.getNextPrevQuarter(filter, next);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.filter = $scope.filter || {};

                    $scope.getQuarter = function (currentDate, quarterOffset) {
                        try {
                            if (currentDate) {
                                var currentQuarter = (Math.ceil((currentDate.getMonth() + 1) / 3)) + quarterOffset;
                                var quarterFirstDay = new Date(currentDate.getFullYear(), (currentQuarter * 3) - 3, 1);
                                var nextQuarterFirstDate = new Date(currentDate.getFullYear(), (currentQuarter * 3), 1);
                                return {
                                    'quarterFirstDay': quarterFirstDay,
                                    'nextQuarterFirstDate': nextQuarterFirstDate
                                }
                            } else {
                                alert('current quarter value not defined>>>>');
                                return;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevQuarter = function (filter, next) {
                        try {
                            var quarterOffset = 1;
                            if (!next) {
                                quarterOffset = -1;
                            }
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            var quarterInfo = $scope.getQuarter(currentFilter, quarterOffset);
                            if (quarterInfo) {
                                $scope.filter.filter = {};
                                $scope.setFilterDate($scope.filter, quarterInfo.quarterFirstDay, quarterInfo.nextQuarterFirstDate);
                                $scope.filter.value = $filter('date')(quarterInfo.quarterFirstDay, "MMMM-yyyy") + " - " + $filter('date')(quarterInfo.nextQuarterFirstDate - 1, "MMMM-yyyy");
                                $scope.initialFilterValue = $scope.filter.value;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevWeek = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            var first = currentFilter.getDate() - currentFilter.getDay();
                            first = next ? first += 7 : first -= 7;
                            var weekFirstDay = new Date(currentFilter);
                            weekFirstDay.setDate(first);
                            var weekLastDay = new Date(currentFilter);
                            weekLastDay.setDate(first + 6);
                            var nextDate = new Date(weekLastDay.getFullYear(), weekLastDay.getMonth(), weekLastDay.getDate() + 1);
                            $scope.filter.filter = {};
                            $scope.setFilterDate($scope.filter, weekFirstDay, nextDate);
                            $scope.filter.value = $filter('date')(weekFirstDay, "dd/MM/yyyy") + " - " + $filter('date')(weekLastDay, "dd/MM/yyyy");
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                    $scope.getNextPrevYear = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            if (next) {
                                var nextDate = new Date(currentFilter.getFullYear() + 1, currentFilter.getMonth(), currentFilter.getDate());
                                var nextToNextDate = new Date(nextDate.getFullYear() + 1, nextDate.getMonth(), nextDate.getDate());
                                $scope.setFilterDate($scope.filter, nextDate, nextToNextDate);
                                $scope.filter.value = $filter('date')(nextDate, "yyyy");
                            } else {
                                var prevDate = new Date(currentFilter.getFullYear() - 1, currentFilter.getMonth(), currentFilter.getDate());
                                var nextToPrevDate = new Date(prevDate.getFullYear() + 1, prevDate.getMonth(), prevDate.getDate());
                                $scope.setFilterDate($scope.filter, prevDate, nextToPrevDate);
                                $scope.filter.value = $filter('date')(prevDate, "yyyy");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevMonth = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            if (next) {
                                var nextDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth() + 1, currentFilter.getDate());
                                var nextToNextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
                                $scope.setFilterDate($scope.filter, nextDate, nextToNextDate);
                                $scope.filter.value = $filter('date')(nextDate, "MMMM-yyyy");
                            } else {
                                var prevDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth() - 1, currentFilter.getDate());
                                var nextToPrevDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, prevDate.getDate());
                                $scope.setFilterDate($scope.filter, prevDate, nextToPrevDate);
                                $scope.filter.value = $filter('date')(prevDate, "MMMM-yyyy");
                            }
                            $scope.initialFilterValue = $scope.filter.value;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevDate = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            if (next) {
                                var nextDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth(), currentFilter.getDate() + 1);
                                var nextToNextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate() + 1);
                                $scope.setFilterDate($scope.filter, nextDate, nextToNextDate);
                                $scope.filter.value = $filter('date')(nextDate, "dd/MM/yyyy");
                            } else {
                                var prevDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth(), currentFilter.getDate() - 1);
                                var nextToPrevDate = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() + 1);
                                $scope.setFilterDate($scope.filter, prevDate, nextToPrevDate);
                                $scope.filter.value = $filter('date')(prevDate, "dd/MM/yyyy");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.lastNDays = function () {
                        try {
                            $scope.dateWrapper = undefined;
                            $scope.showCustomPopUp = undefined;
                            $scope.currentDateOptions = undefined;
                            $scope.showNDaysPopUp = !$scope.showNDaysPopUp;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.selectDateFilterOptions = function (option) {
                        try {
                            if (option && option.onClick) {
                                $scope[option.onClick](false, option.options);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.selectCurrentFilterOptions = function (option) {
                        try {
                            $scope.dateWrapper = true;
                            if (option && option.onClick) {
                                $scope[option.onClick](true);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.$watch('filter.fieldValue', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            $scope.filter.filter = {};
                            $scope.filter.__span__ = 'date';
                            $scope.showNavigationButtons = true;
                            var nextDate = new Date(newValue.getFullYear(), newValue.getMonth(), newValue.getDate() + 1);
                            $scope.setFilterDate($scope.filter, newValue, nextDate);
                            $scope.filter.value = $filter('date')(newValue, "dd/MM/yyyy");
                        }
                    }, true);


                    var template = "<pl-date-filter-options></pl-date-filter-options>";
                    $scope.showOptions = function ($event) {
                        try {
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                hideOnClick: true,
                                deffered: true,
                                escEnabled: true,
                                html: $compile(template)(popupScope),
                                scope: popupScope,
                                element: $event.target,
                                position: "bottom",
                                addInElement: false
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    var filter = $scope.filter.filter;
                    if (filter == "_CurrentDate") {
                        $scope.currentDate(false);
                    }

                    if (filter == "_CurrentWeek") {
                        $scope.currentWeek(false);
                    }

                    if (filter == "_CurrentMonth") {
                        $scope.currentMonth(false);
                    }

                    if (filter == "_CurrentYear") {
                        $scope.currentYear(false);
                    }

                    if ($scope.filter.__span__ && $scope.filter.__span__ != 'manual') {
                        $scope.showNavigationButtons = true;
                    }
                    if ($scope.filter.filter) {
                        if ($scope.filter.filter[$scope.filter.field] == "$$CurrentDateFilter") {
                            $scope.currentDate();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentWeekFilter") {
                            $scope.currentWeek();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentMonthFilter") {
                            $scope.currentMonth();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentQuarterFilter") {
                            $scope.currentQuarter();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentYearFilter") {
                            $scope.currentYear();
                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plDateFilterOptions', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        template: "<ul class='pl-padding-none' style='min-width: 120px;'>" +
            "       <li class='pl-current-filter' style='display: none;'>Current" +
            "         <ul ng-show='currentDateOptions' class='pl-current-filter-options pl-padding-none'>" +
            "           <li class='pl-current-filter-option' ng-repeat='option in currentDateOptions' ng-click='selectCurrentFilterOptions(option)' ng-bind='option.label'></li>" +
            "         </ul>" +
            "       </li>" +
            "       <li class='pl-current-filter-option' ng-repeat='option in dateFilterOptions' ng-click='selectDateFilterOptions(option)' ng-bind='option.label'></li>" +
            "</ul>",

        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.currentFilter();
                }
            };
        }
    }
}]);

pl.directive('plCustomFilter', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {
                    var template = " <div class='pl-custom-date-filter-div-parent'>" +
                        "                 <input type='text' ng-blur='handleFromKeyUp()' ng-model='filter.fromValue' class='pl-custom-date-filter-div' placeholder='From' />" +
                        "                 <input ng-if='filter.time' style='border:none; width: 60px; border-left:1px solid #CCCCCC; float: left;' placeholder='hh:mm' class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='filter.from' bs-timepicker />" +
                        "                 <input class='app-grid-date-picker-calender-image app-float-left' tabindex='-1' type='text' data-trigger='focus' ng-model='filter.from'  data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                        "            </div>" +
                        "            <div class='pl-custom-date-filter-div-parent'>" +
                        "                 <input type='text' ng-blur='handleToKeyUp()' ng-model='filter.toValue' class='pl-custom-date-filter-div' placeholder='To'/>" +
                        "                 <input ng-if='filter.time' style='border:none; width: 60px; border-left:1px solid #CCCCCC; float: left;' placeholder='hh:mm' class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='filter.to' bs-timepicker />" +
                        "                 <input class='app-grid-date-picker-calender-image app-float-left' tabindex='-1' type='text' data-trigger='focus' ng-model='filter.to'  data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                        "            </div>";

                    iElement.append($compile(template)($scope));
                    function getValidDate(value) {
                        if (!value) {
                            return;
                        }
                        var split = value.split("/");
                        if (split && split.length == 3) {
                            var date = new Date(split[2] + "-" + split[1] + "-" + split[0]);
                            if (!isNaN(Date.parse(date))) {
                                return date;
                            }
                        } else {
                            var isAprilOrAugust = /a(p|u)/.test(value);
                            if (isAprilOrAugust) {
                                value = value.replace(/a/g, "/a");
                            }
                            var date = Date.parse(value);
                            return date;
                        }

                    }

                    $scope.handleFromKeyUp = function () {
                        try {
                            var value = $scope.filter.fromValue;
                            if (!value || value.toString().length == 0) {
                                return;
                            }
                            var filterValue = $scope.filter;
                            if (value) {
                                var date = getValidDate(value);
                                if (angular.isDefined(date)) {
                                    filterValue.from = date;
                                    filterValue.fromValue = $filter('date')(date, "dd/MM/yyyy");
                                    if (filterValue.toValue && filterValue.fromValue) {
                                        $scope.applyCustomFilter();
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                    $scope.handleToKeyUp = function () {
                        try {
                            var value = $scope.filter.toValue;
                            var filterValue = $scope.filter;
                            if (!value || value.toString().length == 0) {
                                return;
                            }
                            if (value) {
                                var date = getValidDate(value);
                                filterValue.to = date;
                                if (angular.isDefined(date)) {
                                    filterValue.toValue = $filter('date')(date, "dd/MM/yyyy");
                                    if (filterValue.toValue && filterValue.fromValue) {
                                        $scope.applyCustomFilter();
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.$watch('filter.from', function (newValue, oldValue) {
                        if (newValue && !angular.equals(newValue, oldValue)) {
                            $scope.filter.fromValue = $filter('date')($scope.filter.from, "dd/MM/yyyy");
                            if ($scope.filter.toValue && $scope.filter.fromValue) {
                                $scope.applyCustomFilter();
                            }
                        }
                    }, true);

                    $scope.$watch('filter.to', function (newValue, oldVlaue) {
                        if (!angular.equals(newValue, oldVlaue)) {
                            $scope.filter.toValue = $filter('date')($scope.filter.to, "dd/MM/yyyy");
                            if ($scope.filter.toValue && $scope.filter.fromValue) {
                                $scope.applyCustomFilter();
                            }
                        }
                    }, true);


                    $scope.applyCustomFilter = function () {
                        try {
                            $scope.showNavigationButtons = undefined;
                            var filterValue = $scope.filter;
                            var from = filterValue.from;
                            var to = filterValue.to;
                            if (filterValue && to && from) {
                                $scope.filter.filter = {};
                                var nextDate = filterValue.time ? to : new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
                                $scope.filter.__span__ = 'rangeFilter';
                                $scope.setFilterDate($scope.filter, from, nextDate);
                                delete $scope.filter.__span__;
                                $scope.filter.value = $filter('date')(from, filterValue.time ? "dd/MM/yyyy hh:mm a" : "dd/MM/yyyy") + " - " + $filter('date')(to, filterValue.time ? "dd/MM/yyyy hh:mm a" : "dd/MM/yyyy");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plNDaysFilter', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {
                    var template = "<input type='text' ng-blur='nLastDaysFilter()' ng-model='filter.lastNDays' placeholder='Days' class='pl-ndays-input'/>";
                    iElement.append($compile(template)($scope));

                    $scope.nLastDaysFilter = function () {
                        try {
                            var filterValue = $scope.filter;
                            if (filterValue.lastNDays > 0) {
                                if (filterValue) {
                                    var days = filterValue.lastNDays;
                                    var currentDate = new Date();
//                            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                                    var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

                                    var dateObj = new Date();
                                    dateObj = new Date(dateObj.setDate(dateObj.getDate() - days));
                                    dateObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
                                    filterValue.filter = {};
                                    $scope.setFilterDate($scope.filter, dateObj, nextDate);
                                    filterValue.value = $filter('date')(dateObj, "dd/MM/yyyy") + " - " + $filter('date')(currentDate, "dd/MM/yyyy");
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plJson', function () {
    return {
        restrict: 'A',
        priority: 1,
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            if (!ngModel) {
                return;
            }

            ngModel.$render = function () {
                try {
                    var value = ngModel.$viewValue;
                    if (value) {
                        element.val(JSON.stringify(value));
                    }
                } catch (e) {
                    if ($scope.handleClientError) {
                        $scope.handleClientError(e);
                    }
                }
            };

            scope.onblur = function () {
                try {
                    var val = element.val();
                    if (val && val.trim().length > 0) {
                        ngModel.$setViewValue(JSON.parse(val.trim()));
                    } else {
                        ngModel.$setViewValue(undefined);
                    }
                } catch (e) {
                    if (scope.handleClientError) {
                        scope.handleClientError(e);
                    }
                }

            };
            element.unbind('input').unbind('change').unbind('keydown');
        }
    };
});

pl.directive('plFts', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var ftsInfo = $scope.$eval(attrs.info);
                    if (!ftsInfo) {
                        return;
                    }
                    var template = "<div  class='app-float-left fts-search'>" +
                        "   <div class='search flex'>" +
                        "   <input type='text' placeholder='Enter Search Text' class='app-float-left pl-search-text' /> " +
                        "   <div class='app-float-left' style='width: 22px;'>" +
                        "       <div class='app-float-left cross-image app-cursor-pointer' ng-show='ftsCross' title='Remove' ng-click='removeFtsSearch()'><i class='icon-remove'></i></div>" +
                        "   </div>   " +
                        "   <div class='app-float-left image app-cursor-pointer' ng-click='search(true)' title='Click here to search.' ></div>" +
                        "   </div>" +
                        "</div>";
                    iElement.append($compile(template)($scope));

                    iElement.find('input.pl-search-text').bind('keydown', function (e) {
                        var val = iElement.find('input.pl-search-text').val();
                        if (!val || angular.isUndefined(val) || val.toString().trim().length == 0) {
                            return;
                        }
                        if (e.keyCode == 13) {
                            $scope.search();
                            iElement.find('input').blur();
                        }
                    });

                    $scope.removeFtsSearch = function () {
                        try {
                            $scope[ftsInfo.onClick](undefined);
                            $scope.ftsCross = false;
                            iElement.find('input.pl-search-text').val('');
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.search = function (bySearch) {
                        try {
                            var responsiveFts = attrs.class;
                            var val = iElement.find('input.pl-search-text').val();
                            if (responsiveFts && bySearch) {
                                var ftsBox = iElement.find('.fts-search');
                                if (!$scope.expanded || $scope.expanded == false) {
                                    ftsBox.css({'width': '180px'});
                                    $scope.expanded = true;
                                    return;
                                } else {
                                    if (val == '') {
                                        ftsBox.css({'width': '30px'});
                                        $scope.expanded = false;
                                    }
                                }
                            }

                            if (!val || angular.isUndefined(val) || val.toString().trim().length == 0) {
                                return;
                            }
                            if (angular.isDefined(val)) {
                                var textToSearch = val.toString().trim();
                                if (textToSearch && textToSearch.length > 0) {
                                    if (ftsInfo.clientSearchInfo) {
                                        ftsInfo.clientSearchInfo.value = val;
                                    } else {
                                        $scope[ftsInfo.onClick](val);
                                        $scope.ftsCross = true;
                                    }
                                    $timeout(function () {
                                        iElement.find('input.pl-search-text').focus();
                                    }, 0)
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            } else {
                                alert("Invalid Search Field");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plAutocomplete', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var model = attrs.model;
                    var options = $scope.$eval(attrs.options);
                    var field = $scope.$eval(attrs.field);
                    var multiple = attrs.multiple;
                    var template = "";
                    var otherdisplayfields = attrs.otherdisplayfields;
                    var displayField = attrs.upsert;
                    var placeholder = attrs.placeholder || '';
                    var title = attrs.title || '';
                    if (multiple) {
                        var style = 'width: 20px;';
                        if (attrs.upsert) {
                            style += ' right:20px;';
                        }
                        var viewUI = attrs.viewui;
                        var displayRenderer = attrs.displayrenderer || "";
                        var editorModelField = attrs.editormodelfield || "";
                        var displayEditor = attrs.displayeditor || "";
                        var schedule = attrs.schedule;

                        template = "<div style='margin-right: 40px;'><div class='app-multiple-values' ng-repeat='value in " + model + "'>" +
                            "           <span class='value' ng-bind='value" + displayRenderer + "'></span>" +
//                            "           <span ng-repeat='otherCol in col.otherDisplayFields' ng-show='value[otherCol]'> | {{value[otherCol]}}</span>" +
                            "           <span pl-remove-value ng-model=" + model + " ng-click='remove($index, $event)' class='cross'><i class='icon-remove'></i></span>" +
                            "       </div></div>" +
                            "       <input ng-class='{\"error\":row.validations." + field.field + "}' style='clear: both;' title='" + title + "' data-container='body' data-upsert='" + displayField + "' data-other-display-fields='" + otherdisplayfields + "' class='form-control' placeholder='" + placeholder + "' ng-model=" + model + " data-multiple='true'  data-animation='am-flip-x' ng-options='" + options + "' bs-typeahead type='text' />" +
                            "       <input class='second-input' ng-class='{\"pl-full-right\":" + multiple + "}' type='text' tabindex='-1' style='" + style + "' >" +
                            "       <img src='../images/loading.gif' class='pl-loading-image' ng-show='loadingImage' />" +
                            "       <span ng-show='col.upsertView' class='pl-upsert' ng-click='handleLookupUpsert(" + attrs.field + ".field)'>&plus;</span>";

                        if (viewUI == 'grid') {
                            template = "<div class='pl-typeahead-wrapper' ng-class='{\"pl-schedule-template\":schedule}'>" +
                                "                           <div class='pl-typeahead-cell'>" +
                                template +
                                "                           </div>" +
                                "                        </div>";

                        } else if (viewUI == 'form') {
                            template = "  <div class='app-float-left app-white-backgroud-color app-width-full app-border left-full form-template pl-auto-multiple'>" +
                                template +
                                "                           </div>";
                        }
                    } else {
                        var validationDisplay = attrs.validationdisplay;
                        if (field.type === "fk") {
                            template = "<input title='" + title + "' ng-class='{\"error\":row.validations." + validationDisplay + "}' data-container='body' data-other-display-fields='" + otherdisplayfields + "' placeholder='" + placeholder + "' class='form-control' data-upsert='" + displayField + "' ng-model=" + model + "  data-animation='am-flip-x' ng-options='" + options + "' bs-typeahead type='text' />"
                        } else {
                            template = "<input title='" + title + "' ng-class='{\"error\":row.validations." + field.field + "}' data-container='body' data-other-display-fields='" + otherdisplayfields + "' placeholder='" + placeholder + "' class='form-control' data-upsert='" + displayField + "' ng-model=" + model + "  data-animation='am-flip-x' ng-options='" + options + "' bs-typeahead type='text' />"
                        }
                        template += "<input class='second-input' ng-class='{\"pl-full-right\":!" + field.upsertView + "}' type='text' tabindex='-1' style='width:20px;' >" +
                            "<img src='../images/loading.gif' class='pl-loading-image' ng-show='loadingImage' />" +
                            "<span ng-show='" + field.upsertView + "' class='pl-upsert' ng-click='handleLookupUpsert(" + attrs.field + ".field)'>&plus;</span>";
                    }


                    iElement.append($compile(template)($scope));
                }
            };
        }
    }
}]);

pl.directive('plDatePicker', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,

        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.model = attrs.model;
                    $scope.field = attrs.field;
                    var placeholder = attrs.placeholder || '';
                    var modelExpression = $scope.model + "." + $scope.field;
                    var schedule = attrs.schedule;
                    var title = attrs.title || '';

                    var template = "<div class='pl-date-picker'>";


                    if (schedule) {
                        var nextRunOnExpression = $scope.model + "." + $scope.field + ".nextDueOn";
                        template += "<pl-date-time class='pl-schedule-parent' bind='" + nextRunOnExpression + "' title='Next Due On' placeholder='Next Due On'></pl-date-time>" +
//                            "<input data-animation='am-flip-x' title='" + title + "' data-container='body' placeholder='" + placeholder + "'  type='text' ng-model='" + nextRunOnExpression + "' bs-datepicker  data-date-format='dd/MM/yyyy' />" +
                            "       <input type='text' class='app-schedule-image app-border-none-important' tabindex='-1' ng-click='showSchedule()'/>" +
                            "       <pl-schedule-drop-down field='" + attrs.field + "' placeholder='" + placeholder + "' ng-show='schedule' class='app-float-left app-width-full' style='z-index:25;'></pl-schedule-drop-down>";

                    } else {
                        template += "<input ng-class='{\"error\":row.validations." + $scope.field + "}' data-animation='am-flip-x' title='" + title + "' data-container='body' placeholder='" + placeholder + "'  type='text' ng-model='" + modelExpression + "' bs-datepicker  data-date-format='dd/MM/yyyy' />" +
                            "        <input class='app-grid-date-picker-calender-image app-float-right pl-right-calender' tabindex='-1' data-container='body' type='text' ng-model='" + modelExpression + "' data-trigger='focus' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />";
//                            "    <input data-container='body' class='pl-datepicker-image'  type='text' ng-model='" + modelExpression + "'  data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker data-date-format='dd/MM/yyyy' />";
                    }


                    template += "</div>";

                    iElement.append($compile(template)($scope));


                },
                post: function ($scope, iElement, attrs) {
                    $scope.showSchedule = function () {
                        try {
                            $scope.schedule = !$scope.schedule;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                }
            };
        }
    }
}]);

pl.directive('plSetDateValue', ['$timeout', '$filter', function ($timeout, $filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attr, controller) {
            $timeout(function () {
                if (controller.$modelValue) {
                    elm.val($filter('date')(controller.$modelValue, "dd/MM/yyyy"));
                }
            }, 0);


            elm.bind("keyup", function ($event) {
//                elm.val($filter('date')(controller.$modelValue, "dd/MM/yyyy"));
                scope.handleKeyDown($event);
            });

            elm.bind('blur', function () {
//                var elementValue = elm.val();
//                var dateRegex = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/;
//                var isDate = dateRegex.test(elementValue);
//                var temp = '';
//                if (!isDate) {
//                    temp = Date.parse(elementValue);
//
//                } else {
//                    temp = Date.parse(elementValue).toString("dd/MM/yyyy");
//                    temp = Date.parse(new Date(temp).toUTCString());
//                }
//
//                if (angular.isString(elementValue) && elementValue.toString().trim().length > 0) {
//                    controller.$setViewValue(temp);
//                }
            });

            scope.handleKeyDown = function ($event) {
                try {
                    if ($event.keyCode == 27) {
                        return;
                    }
                    return;
                    var elementValue = elm.val();
                    if (elementValue && elementValue.toString().trim().length > 0) {
                        scope.setValueInModel(elementValue);
                    }
                } catch (e) {
                    if (scope.handleClientError) {
                        scope.handleClientError(e);
                    }
                }
            }

            scope.$watch(attr.ngModel, function (newValue, oldValue) {
                if (newValue && typeof newValue == 'object') {
                    elm.val($filter('date')(controller.$modelValue, "dd/MM/yyyy"));
                    scope.setValueInModel(newValue);
                }
            });

            scope.setValueInModel = function (value) {
                try {
                    var splitValue = value.toString().split("/");
                    if (splitValue && splitValue.length == 3) {
//                    var dateObj = new Date(splitValue[2] + "-" + splitValue[1] + "-" + splitValue[0]);
//                    if (!isNaN(Date.parse(dateObj))) {
//                        controller.$setViewValue(dateObj);
//                    }
                        var date = Date.parse(elm.val());
                        if (date !== null) {
                            elm.val(date.toString("dd/MM/yyyy"));
                            controller.$setViewValue(date.toString("dd/MM/yyyy hh:mm:ss tt"));
                        }
                    }
                } catch (e) {
                    if (scope.handleClientError) {
                        scope.handleClientError(e);
                    }
                }

            }

        }
    };
}]);

pl.directive('plScheduleDropDown', ["$compile", "$filter", function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        scope: true,
        compile: function () {
            return  {
                pre: function ($scope, iElement, attrs) {
                    var model = $scope.model;
                    var field = attrs.field;
                    var frequency = 'frequency';
                    var time = 'time';
                    var componentModel = model + "." + field;
                    var monthDays = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
                    $scope.spanField = {options: ["None", "Minutely", "Hourly", "Daily", "Weekly", "Monthly", "Yearly"]};
                    $scope.frequency = angular.copy(monthDays);
                    var spanValue = componentModel + ".repeats";
                    $scope.repeatOn = $scope.repeatOn || {};
                    $scope.repeatEvery = {"options": angular.copy(monthDays)};

                    $scope.$watch(spanValue, function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && angular.isDefined(newValue)) {
                            if (newValue == 'Weekly') {
                                $scope.repeatOn.options = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
                            } else if (newValue == 'Yearly') {
                                $scope.repeatOn.options = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            } else if (newValue == 'Monthly') {
                                $scope.repeatOn.options = angular.copy(monthDays);
                            }
                            var repeatOnValue = $scope.$eval(componentModel + ".repeatOn");
                            if (repeatOnValue) {
                                var componentValue = $scope.$eval(componentModel);
                                componentValue.repeatOn = [];
                            }
                        }
                    }, true);


                    var template = "      <div class='pl-schedule-wrapper' >" +
                        "                   <div class='app-padding-top-bottom-five-px' >" +
                        "                       <div id='firstElement' class='app-position-relative app-border'>" +
                        "                            <pl-autocomplete options='\"data as data for data in getLookupData($viewValue,spanField,$fetchAllData)\"' data-title='Repeats' data-placeholder='Repeats' field='spanField' model='" + componentModel + ".repeats'  ></pl-autocomplete>" +
                        "                       </div>" +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " == \"Yearly\" || " + spanValue + " == \"Monthly\" || " + spanValue + " == \"Weekly\"'>" +
                        "                       <div class='app-position-relative app-border'>" +
                        "                           <pl-autocomplete viewui='grid' data-multiple='true' data-title='Repeat On' data-schedule='true' options='\"data as data for data in getLookupData($viewValue,repeatOn,$fetchAllData)\"' data-placeholder='Repeat On' field='repeatOn' model='" + componentModel + ".repeatOn'  ></pl-autocomplete>" +
                        "                       </div>" +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " != \"None\"'>" +
                        "                       <div class='app-position-relative app-border' >" +
                        "                           <pl-autocomplete viewui='grid' options='\"data as data for data in getLookupData($viewValue,repeatEvery,$fetchAllData)\"' data-title='Repeat Every' data-placeholder='Repeat Every' field='repeatEvery' model='" + componentModel + ".repeatEvery'  ></pl-autocomplete>" +
                        "                       </div>" +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " != \"None\"'>" +
                        "                       <pl-date-time bind='" + model + "." + field + ".startsOn' title='Starts On' placeholder='Starts On'></pl-date-time> " +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " != \"None\"'>" +
                        "                       <pl-date-time bind='" + model + "." + field + ".nextDueOn' title='Next Due On' placeholder='Next Due On' ></pl-date-time> " +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px'>" +
                        "                       <span class='app-border pl-apply-button'  ng-click='$parent.showSchedule()' style='color: #383838; padding: 3px 8px;'><i class='icon-ok'></i></span>" +
                        "                   </div>" +
                        "               </div>";

                    $(iElement).append($compile(template)($scope))
                }
            }
        }
    }
}]);

pl.directive('plDateTime', ['$compile', function ($compile) {
    return{
        restrict: "AEC",
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    var bindTo = attrs.bind;
                    var title = attrs.title || '';
                    var placeholder = attrs.placeholder;
                    template = "<div  class='app-position-relative app-border' >" +
                        "      <div class='app-display-table-cell' style='width:65%;border-right: 1px solid #ccc;'>" +
                        "          <input class='form-control' title='" + title + "' placeholder='" + placeholder + "' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='" + bindTo + "' bs-datepicker />" +
                        "      </div>" +
                        "      <div class='app-display-table-cell app-vertical-align-top' style='width:35%;'>" +
                        "          <input class='form-control' placeholder='hh:mm' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='" + bindTo + "' bs-timepicker />" +
                        "      </div>" +
                        " </div>";
                    iElement.append($compile(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plDropDown', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "AE",
        replace: true,
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    $scope.dropdownOptions = $scope.$eval(attrs.plDropDown);
                    if ($scope.dropdownOptions.length > 0) {
                        $scope.selectedIndex = attrs.selectedindex;
                        if ($scope.dropdownOptions[0].label) {
                            var template = "<div ng-click=\"parentRowAction($event)\" title={{dropdownOptions[selectedIndex].label}} class=\"pl-panel-label icon-caret-right-down \"  >" +
                                "           {{dropdownOptions[selectedIndex].label}} " +
                                "</div>";
                            iElement.append($compile(template)($scope));
                        }
                    }
                }
            }
        }
    }
}]);

pl.directive('pageslide', ['$timeout',
    function ($timeout) {
        var defaults = {};

        /* Return directive definition object */

        return {
            restrict: "EA",
            replace: false,
            transclude: false,
            scope: {
                psOpen: "=?"
            },
            link: function ($scope, el, attrs) {
                /* Inspect */
                //console.log($scope);
                //console.log(el);
                //console.log(attrs);

                /* parameters */
                var param = {};
                param.side = attrs.pageslide || 'left';
                param.speed = attrs.psSpeed || '0.5';
                param.size = attrs.psSize || '300px';
                param.className = attrs.psClass || 'ng-pageslide';

                /* DOM manipulation */
                var content = null;
                if (!attrs.href && el.children() && el.children().length) {
                    content = el.children()[0];
                } else {
                    content = (attrs.href) ? document.getElementById(attrs.href.substr(1)) : document.getElementById(attrs.psTarget.substr(1));
                }

                // Check for content
                if (!content)
                    throw new Error('You have to elements inside the <pageslide> or you have not specified a target href');
                var sliderWrapper = document.getElementsByClassName('pl-pageslide-wrapper');
                sliderWrapper[0].className = 'slider-wrapper pl-pageslide-wrapper';
                var slider = document.createElement('div');
                slider.className = param.className;
                /* Style setup */
                sliderWrapper[0].style.transition = 'all ' + param.speed + 's cubic-bezier(0.25, 0.8, 0.25, 1)';
                sliderWrapper[0].style.zIndex = 1000;
                sliderWrapper[0].style.position = 'fixed';
                sliderWrapper[0].style.left = 0;
                sliderWrapper[0].style.top = 0;
                sliderWrapper[0].style.bottom = 0;
                sliderWrapper[0].style.right = 0;
                sliderWrapper[0].style.width = 0;
                sliderWrapper[0].style.background = 'rgba(255, 255, 255, 0.7)';

                slider.style.transition = 'all ' + param.speed + 's cubic-bezier(0.25, 0.8, 0.25, 1)';
                slider.style.zIndex = 1000;
                slider.style.position = 'fixed';
                slider.style.width = "300px";
                slider.style.height = 0;
                slider.style.overflowY = 'auto';
                slider.style.background = 'rgb(75,93,103)';
                slider.style.transform = 'translate3d(-100%,0,0) scale(01)';
                switch (param.side) {
                    case 'right':
                        slider.style.height = attrs.psCustomHeight || '100%';
                        slider.style.top = attrs.psCustomTop || '0px';
                        slider.style.bottom = attrs.psCustomBottom || '0px';
                        slider.style.right = attrs.psCustomRight || '0px';
                        break;
                    case 'left':
                        slider.style.height = attrs.psCustomHeight || '100%';
                        slider.style.top = attrs.psCustomTop || '0px';
                        slider.style.bottom = attrs.psCustomBottom || '0px';
                        slider.style.left = attrs.psCustomLeft || '0px';
                        break;
                    case 'top':
                        slider.style.width = attrs.psCustomWidth || '100%';
                        slider.style.left = attrs.psCustomLeft || '0px';
                        slider.style.top = attrs.psCustomTop || '0px';
                        slider.style.right = attrs.psCustomRight || '0px';
                        break;
                    case 'bottom':
                        slider.style.width = attrs.psCustomWidth || '100%';
                        slider.style.bottom = attrs.psCustomBottom || '0px';
                        slider.style.left = attrs.psCustomLeft || '0px';
                        slider.style.right = attrs.psCustomRight || '0px';
                        break;
                }

                /* Append */
                document.body.appendChild(sliderWrapper[0]);
                sliderWrapper[0].appendChild(slider);
                slider.appendChild(content);

                /* Closed */
                function psClose(slider, param) {
                    if (slider.style.width !== 0 && slider.style.width !== 0) {
                        slider.style.transform = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-webkit-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-moz-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-o-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-ms-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        sliderWrapper[0].style.width = 0;
                        content.style.display = 'none';
                        switch (param.side) {
                            case 'right':
                                slider.style.width = '0px';
                                break;
                            case 'left':
                                slider.style.left = '0px';
                                break;
                            case 'top':
                                slider.style.height = '0px';
                                break;
                            case 'bottom':
                                slider.style.height = '0px';
                                break;
                        }
                    }
                    $scope.psOpen = false;
                }

                /* Open */
                function psOpen(slider, param) {
                    if (slider.style.width !== 0 && slider.style.width !== 0) {
                        slider.style.transform = 'translate3d(0%,0,0) scale(01)';
                        slider.style['-webkit-transform'] = 'translate3d(0,0,0) scale(01)';
                        slider.style['-moz-transform'] = 'translate3d(0,0,0) scale(01)';
                        slider.style['-o-transform'] = 'translate3d(0,0,0) scale(01)';
                        slider.style['-ms-transform'] = 'translate3d(0,0,0) scale(01)';
                        sliderWrapper[0].style.width = 'auto';
                        switch (param.side) {
                            case 'right':
                                slider.style.width = param.size;
                                break;
                            case 'left':
                                slider.style.width = param.size;
                                break;
                            case 'top':
                                slider.style.height = param.size;
                                break;
                            case 'bottom':
                                slider.style.height = param.size;
                                break;
                        }
                        setTimeout(function () {
                            content.style.display = 'block';
                        }, (param.speed * 100));

                    }
                }

                /*
                 * Watchers
                 * */

                $scope.$watch("psOpen", function (value) {
                    if (!!value) {
                        // Open
                        psOpen(slider, param);
                    } else {
                        // Close
                        psClose(slider, param);
                    }
                });

                // close panel on location change
                if (attrs.psAutoClose) {
                    $scope.$on("$locationChangeStart", function () {
                        psClose(slider, param);
                    });
                    $scope.$on("$stateChangeStart", function () {
                        psClose(slider, param);
                    });
                }


                /*
                 * Events
                 * */

                $scope.$on('$destroy', function () {
                    document.body.removeChild(slider);
                });

                var close_handler = (attrs.href) ? document.getElementById(attrs.href.substr(1) + '-close') : null;
                if (el[0].addEventListener) {
                    el[0].addEventListener('click', function (e) {
                        e.preventDefault();
                        psOpen(slider, param);
                    });

                    if (close_handler) {
                        close_handler.addEventListener('click', function (e) {
                            e.preventDefault();
                            psClose(slider, param);
                        });
                    }
                } else {
                    // IE8 Fallback code
                    el[0].attachEvent('onclick', function (e) {
                        e.returnValue = false;
                        psOpen(slider, param);
                    });

                    if (close_handler) {
                        close_handler.attachEvent('onclick', function (e) {
                            e.returnValue = false;
                            psClose(slider, param);
                        });
                    }
                }

            }
        };
    }
]);

pl.directive('plPageslideWrapper', ['$compile', function ($compile) {
    return{
        restrict: 'C',
        link: function ($scope, iElement, attrs) {
            document.body.onkeydown = function (evt) {
                if (evt.keyCode == 27) {
                    $scope.workbenchOptions.enableSliderMenu = undefined;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            };
            iElement.bind('click', function (evt) {
                $scope.workbenchOptions.enableSliderMenu = undefined;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });
            $scope.$on('$destroy', function ($event) {
                iElement.unbind('click');
            });
        }
    }
}]);

pl.directive('plToggle', ['$compile', function ($compiple) {
    return{
        restrict: 'A',
        replace: true,
        link: function ($scope, iElement, attrs) {
            iElement.bind('click', function ($event) {
                var isimageToggle = iElement.hasClass('expand')
                if (isimageToggle) {
                    iElement.removeClass('expand');
                } else {
                    iElement.addClass('expand')
                }
            });
        }
    }
}]);

pl.directive('plSlideMenu', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    if ($scope.workbenchOptions.applications && $scope.workbenchOptions.selectedMenu && $scope.workbenchOptions.applications.length > 0) {
                        for (var i = 0; i < $scope.workbenchOptions.applications.length; i++) {
                            var obj = $scope.workbenchOptions.applications[i];
                            if ($scope.workbenchOptions.selectedMenu[$scope.workbenchOptions.applications[i]._id] == true) {
                                $scope.workbenchOptions.applications[i].open = true;
                            } else {
                                $scope.workbenchOptions.applications[i].open = false;
                            }

                        }
                    }
                },
                post: function ($scope, iElement) {
                    var template = '<div id="slideMenu"><pageslide ps-class="pl-pageslide" ps-open="workbenchOptions.enableSliderMenu" >' +
                        '           <div>' +
                        '               <div class="app-header"><img src="../images/applanelogo.png" /></div>' +
                        '           <nav>' +
                        "                <ul class='app-padding-zero-important silde-menu'>" +
                        "                    <li ng-repeat='application in workbenchOptions.applications' style='background-color: rgb(75,93,103)' class='app-position-relative' >" +
                        "                        <a ng-show='application.isVisible' ng-click='toggleAppMenu($event, application, workbenchOptions.applications, true)' ng-class='{\"pl-menu-text\":application.menus}' class='flex app-cursor-pointer menu-strip'>" +
                        "                             <span ng-bind='application.label' class='flex-1'></span>" +
                        "                         </a>" +
                        "                         <span class='app-position-absolute app-color-white' ng-click='toggleAppMenu($event, application, workbenchOptions.applications, true)' style='top:12px; left:10px;font-size:14px;' ><i ng-class='{\"icon-minus\":application.open, \"icon-plus\":!application.open }' class='no-hover app-cursor-pointer' ></i></span>" +
                        "                         <span class='app-position-absolute' style='top:8px; right:10px;'><i ng-class='{\"icon-chevron-down\":application.open, \"icon-chevron-left\":!application.open}' style='color: #fff; font-size: 7px;'></i></span>" +
                        "                         <ul id='{{application._id}}' ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[application._id] != true}' >" +
                        "                             <li ng-repeat='menu in application.uiMenus' style='background-color: rgb(63,80,88);' class='app-position-relative'>" +
                        "                                 <a ng-show='menu.isVisible' ng-click='toggleAppMenu($event, menu, application.menus);' ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu._id] == true && !menu.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                    <span ng-bind='menu.label' class='filler-width flex-1'></span>" +
                        "                                 </a>" +
                        "                                <span class='app-position-absolute' style='top:8px; left:10px;'><i ng-class='menu.icon' style='color: #fff;'></i></span>" +
                        "                                 <span class='app-position-absolute' ng-show='menu.menus' style='top:8px; right:10px;'><i ng-class='{\"icon-chevron-down\":menu.open, \"icon-chevron-left\":!menu.open}' style='color: #fff; font-size: 7px;'></i></span>" +
                        "                                 <div ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[menu._id] != true}' id='{{menu._id}}'>" +
                        "                                       <ul class='pl-nested-menu'>" +
                        "                                         <li ng-repeat='menu_level_1 in menu.menus' class='app-position-relative' >" +
                        "                                             <a ng-click='toggleAppMenu($event, menu_level_1, menu.menus);' title={{menu_level_1.label}} ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu_level_1._id] == true && !menu_level_1.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                                   <span ng-bind='menu_level_1.label' class='filler-width flex-1'></span>" +
                        "                                             </a>" +
                        "                                             <span class='app-position-absolute' ng-show='menu_level_1.menus' style='top:8px; right:10px;'><i ng-class='{\"icon-chevron-down\":menu_level_1.open, \"icon-chevron-left\":!menu_level_1.open}' style='color: #fff; font-size: 7px;'></i></span>" +
                        "                                               <div id='{{menu_level_1._id}}' ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[menu_level_1._id] != true}' ng-if='menu_level_1.menus'>" +
                        "                                                   <ul class='pl-nested-menu'>" +
                        "                                                       <li ng-repeat='menu_level_2 in menu_level_1.menus' class='app-position-relative' >" +
                        "                                                           <a ng-click='toggleAppMenu($event, menu_level_2, menu_level_1.menus);' title={{menu_level_2.label}} ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu_level_2._id] == true && !menu_level_2.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                                               <span ng-bind='menu_level_2.label' class='flex-1' ng-class='{\"app-menu-bold-font\":menu_level_2.menus}'></span>" +
                        "                                                           </a>" +
                        "                                                            <div id='{{menu_level_2._id}}'  ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[menu_level_2._id] != true}' ng-if='menu_level_2.menus'>" +
                        "                                                                <ul ng-mouseover='setChildMenuPosition()' ng-mouseout='resetChildMenuPosition()' class='pl-nested-menu'>" +
                        "                                                                    <li ng-repeat='menu_level_3 in menu_level_2.menus' class='app-position-relative' >" +
                        "                                                                        <a title={{menu_level_3.label}} ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu_level_3._id] == true && !menu_level_3.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                                                            <span ng-bind='menu_level_3.label' class='flex-1' ng-class='{\"app-menu-bold-font\":menu_level_3.menus}'></span>" +
                        "                                                                        </a>" +
                        "                                                                    </li>" +
                        "                                                                </ul>" +
                        "                                                            </div>" +
                        "                                                       </li>" +
                        "                                                   </ul>" +
                        "                                               </div>" +
                        "                                           </li>" +
                        "                                       </ul>" +
                        "                             </li>" +
                        "                         </ul>" +
                        "                    </li>" +
                        "                </ul>" +
                        '           </nav>' +
                        '       </div>' +
                        '   </pageslide>' +
                        '</div>';
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plToolBar', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        scope: false,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var html = "";
                    if ($scope.toolBarOptions.top) {
                        html += "<div class='pl-top-toolbar' pl-tool-bar-row='top'></div>";
                    }
                    if ($scope.toolBarOptions.bottom && ($scope.toolBarOptions.bottom.left.length > 0 || $scope.toolBarOptions.bottom.center.length > 0 || $scope.toolBarOptions.bottom.right.length > 0 )) {
                        html += "<div class='pl-bottom-toolbar' ng-show='toolBarOptions.bottom.left.length > 0 || toolBarOptions.bottom.center.length > 0  || (toolBarOptions.bottom.right.length > 0 && gridOptions.sharedOptions.saveCustomizationEnable!= undefined) || gridOptions.sharedOptions.saveCustomizationEnable || toolBarOptions.bottom.right.length > 1'  pl-tool-bar-row='bottom'></div>";
                    }
                    iElement.append($compile(html)($scope));
                }
            }
        }
    };
}
]);

pl.directive('plToolBarRow', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        scope: true,
        compile: function () {
            return {
                post: function ($scope, iElement, attrs) {
                    if (attrs.plToolBarRow == "top") {
                        $scope.toolbarRowOptions = $scope.toolBarOptions.top;
                    } else if (attrs.plToolBarRow == "bottom") {
                        $scope.toolbarRowOptions = $scope.toolBarOptions.bottom;
                    } else {
                        alert("Not supported plToolBarRow>>>>[" + attrs.plToolBarRow + "]");
                    }

                    var html = "";
                    html += "<pl-left-tool-bar></pl-left-tool-bar>";
                    html += "<pl-center-tool-bar class='pl-top-middle-tollbar' ng-if='toolbarRowOptions.center'></pl-center-tool-bar>";
                    html += "<pl-right-tool-bar></pl-right-tool-bar>";
                    iElement.append($compile(html)($scope));
                }
            }
        }
    };
}
]);

pl.directive('plToolBarHeader', [ "$compile", function ($compile) {
    return {
        restrict: 'E',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    if ($scope.toolBarOptions.header) {
                        $scope.toolbarHeaders = $scope.toolBarOptions.header.left;
                        $scope.toolbarCenterHeaders = $scope.toolBarOptions.header.center;
                        $scope.toolbarRightHeadersActions = $scope.toolBarOptions.header.right;
                    }
                    var template = '<div class="flex" style="min-height: 48px;">' +
                        '       <div class="app-float-left header-l-bar app-overflow-hiiden" ng-class="toolbarHeaders.lHeaderClass" >' +
                        "           <div>" +
                        "               <ul ng-if='toolbarHeaders.menus' style='padding-left: 0px; ' id='toolBarHeader'>" +
                        "                   <li ng-repeat='qMenu in toolbarHeaders.menus' ng-hide='qMenu.hide' ng-class='{\"qview-selecetd\":toolbarHeaders.selectedMenu == $index || (qMenu.mores && toolbarHeaders.selectedMenu >= toolbarHeaders.breakingIndex-1)}'>" +
                        "                       <span class='app-cursor-pointer' ng-click='qViewHeaderClick(qMenu, $event)' ng-bind='qMenu.label'></span> " +
                        "                   </li>" +
                        "               </ul>" +
                        "           </div>" +
                        '       </div>' +
                        '       <div class="app-bar-basic flex-1 header-r-bar">' +
                        '           <div pl-button ng-repeat="action in toolbarCenterHeaders" title="{{action.title}}" class="app-float-left"></div>' +
                        '     </div>' +
                        '       <div class="app-float-right header-r-bar" ng-class="toolbarHeaders.rHeaderClass">' +
                        '           <div pl-button ng-repeat="action in toolbarRightHeadersActions" ng-class="action.class" title="{{action.title}}" class="app-float-left"></div>' +
                        '       </div>' +
                        '    </div>';
                    iElement.append(($compile)(template)($scope));

                },
                post: function ($scope) {
                    $scope.qViewHeaderClick = function (qMenu, $event) {
                        try {
                            if (qMenu.onClick) {
                                $scope[qMenu.onClick](qMenu, $event);
                            } else {
                                $scope.onQuickViewSelection(qMenu);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.qViewHeaderPopup = function (qMenu, $event) {
                        try {
                            var html = "<div class='pl-overflow-y-scroll app-max-height-two-hundred'>" +
                                "           <div ng-repeat='moreMenu in toolbarHeaders.menus' class='app-white-space-nowrap app-cursor-pointer' ng-if='!(!moreMenu.hide || moreMenu._id ==\"__more\")'>" +
                                "               <div  ng-click='onQuickViewSelection(moreMenu)' ng-class='{\"pl-selected-menu\":toolbarHeaders.selectedMenu == $index}' class='app-row-action pl-popup-label'>{{moreMenu.label}}" +
                                "               </div>" +
                                "           </div>" +
                                "       </div>";
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(html)(popupScope),
                                scope: popupScope,
                                element: $event.target,
                                event: $event
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                }
            }
        }
    };
}]);

pl.directive('plLeftToolBar', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="app-bar-basic">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.left" title="{{action.title}}" class="app-float-left"></div>' +
            '     </div>'
    };
});

pl.directive('plRightToolBar', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="app-float-right flex r-bar">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.right" title="{{action.title}}" class="app-float-left app-white-space-nowrap flex-box"></div>' +
            '     </div>'
    };
});

pl.directive('plCenterToolBar', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="app-float-left">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.center" title="{{action.title}}" class="app-float-left pl-middle-toolbar"></div>' +
            '     </div>'
    };
});

pl.directive('plButton', [
    '$compile', function ($compile) {
        return {
            restrict: 'A',
            scope: false,
            compile: function () {
                return {
                    pre: function ($scope, iElement) {
                        var template = $scope.action.template;
                        if (!template) {
                            template = "<div ";
                            if ($scope.action.onClick) {
                                template += " ng-click='" + $scope.action.onClick + "'";
                            }
                            if ($scope.action.actionClass) {
                                template += " ng-class = 'action.actionClass'";
                            }
                            if ($scope.action.showLabel) {
                                template += " ng-bind='action.label'";
                            }
                            template += " ></div>";
                        }
                        iElement.append($compile(template)($scope));

                    }

                }
            }
        };
    }]);
