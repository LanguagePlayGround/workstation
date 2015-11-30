/***** move to app-component.js to generate minified version for before commit*******/
(function (window, document, undefined) {
    'use strict';

    angular.module('ngCookies', ['ng']).
        factory('$cookies', ['$rootScope', '$browser', function ($rootScope, $browser) {
            var cookies = {},
                lastCookies = {},
                lastBrowserCookies,
                runEval = false,
                copy = angular.copy,
                isUndefined = angular.isUndefined;

            //creates a poller fn that copies all cookies from the $browser to service & inits the service
            $browser.addPollFn(function() {
                var currentCookies = $browser.cookies();
                if (lastBrowserCookies != currentCookies) { //relies on browser.cookies() impl
                    lastBrowserCookies = currentCookies;
                    copy(currentCookies, lastCookies);
                    copy(currentCookies, cookies);
                    if (runEval) $rootScope.$apply();
                }
            })();

            runEval = true;

            //at the end of each eval, push cookies
            //TODO: this should happen before the "delayed" watches fire, because if some cookies are not
            //      strings or browser refuses to store some cookies, we update the model in the push fn.
            $rootScope.$watch(push);

            return cookies;


            /**
             * Pushes all the cookies from the service to the browser and verifies if all cookies were
             * stored.
             */
            function push() {
                var name,
                    value,
                    browserCookies,
                    updated;

                //delete any cookies deleted in $cookies
                for (name in lastCookies) {
                    if (isUndefined(cookies[name])) {
                        $browser.cookies(name, undefined);
                    }
                }

                //update all cookies updated in $cookies
                for(name in cookies) {
                    value = cookies[name];
                    if (!angular.isString(value)) {
                        value = '' + value;
                        cookies[name] = value;
                    }
                    if (value !== lastCookies[name]) {
                        $browser.cookies(name, value);
                        updated = true;
                    }
                }

                //verify what was actually stored
                if (updated){
                    updated = false;
                    browserCookies = $browser.cookies();

                    for (name in cookies) {
                        if (cookies[name] !== browserCookies[name]) {
                            //delete or reset all cookies that the browser dropped from $cookies
                            if (isUndefined(browserCookies[name])) {
                                delete cookies[name];
                            } else {
                                cookies[name] = browserCookies[name];
                            }
                            updated = true;
                        }
                    }
                }
            }
        }]).
        factory('$cookieStore', ['$cookies', function($cookies) {

            return {
                /**
                 * @ngdoc method
                 * @name $cookieStore#get
                 *
                 * @description
                 * Returns the value of given cookie key
                 *
                 * @param {string} key Id to use for lookup.
                 * @returns {Object} Deserialized cookie value.
                 */
                get: function(key) {
                    var value = $cookies[key];
                    return value ? angular.fromJson(value) : value;
                },

                /**
                 * @ngdoc method
                 * @name $cookieStore#put
                 *
                 * @description
                 * Sets a value for given cookie key
                 *
                 * @param {string} key Id for the `value`.
                 * @param {Object} value Value to be stored.
                 */
                put: function(key, value) {
                    $cookies[key] = angular.toJson(value);
                },

                /**
                 * @ngdoc method
                 * @name $cookieStore#remove
                 *
                 * @description
                 * Remove given cookie
                 *
                 * @param {string} key Id of the key-value pair to delete.
                 */
                remove: function(key) {
                    delete $cookies[key];
                }
            };

        }]);

    angular.module('mgcrea.ngStrap', [
        'mgcrea.ngStrap.datepicker',
        'mgcrea.ngStrap.timepicker',
        'mgcrea.ngStrap.tooltip',
        'mgcrea.ngStrap.typeahead'
    ]);

    angular.module('mgcrea.ngStrap.datepicker', ['mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.tooltip'])

        .provider('$datepicker', function () {

            var defaults = this.defaults = {
                animation:'am-fade',
                prefixClass:'datepicker',
                placement:'bottom-left',
                template:'datepicker/datepicker.tpl.html',
                trigger:'downkey', // downKey trigger is for show the calender template with nav-down key
                container:false,
                keyboard:true,
                html:false,
                delay:0,
                // lang: $locale.id,
                useNative:false,
                dateType:'date',
                dateFormat:'shortDate',
                modelDateFormat:null,
                dayFormat:'dd',
                strictFormat:false,
                autoclose:true,
                minDate:-Infinity,
                maxDate:+Infinity,
                startView:0,
                minView:0,
                startWeek:0,
                daysOfWeekDisabled:'',
                iconLeft:'glyphicon glyphicon-chevron-left',
                iconRight:'glyphicon glyphicon-chevron-right'
            };

            this.$get = ["$window", "$document", "$rootScope", "$sce", "$locale", "dateFilter", "datepickerViews", "$tooltip", function ($window, $document, $rootScope, $sce, $locale, dateFilter, datepickerViews, $tooltip) {

                var bodyEl = angular.element($window.document.body);
                var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
                var isTouch = ('createTouch' in $window.document) && isNative;
                if (!defaults.lang) defaults.lang = $locale.id;

                function DatepickerFactory(element, controller, config) {

                    var $datepicker = $tooltip(element, angular.extend({}, defaults, config));
                    var parentScope = config.scope;
                    var options = $datepicker.$options;
                    var scope = $datepicker.$scope;
                    if (options.startView) options.startView -= options.minView;

                    // View vars

                    var pickerViews = datepickerViews($datepicker);
                    $datepicker.$views = pickerViews.views;
                    var viewDate = pickerViews.viewDate;
                    scope.$mode = options.startView;
                    scope.$iconLeft = options.iconLeft;
                    scope.$iconRight = options.iconRight;
                    var $picker = $datepicker.$views[scope.$mode];

                    // Scope methods

                    scope.$select = function (date, $event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        $datepicker.select(date);

                    };
                    scope.$selectPane = function (value, $event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        $datepicker.$selectPane(value);
                    };
                    scope.$toggleMode = function ($event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        $datepicker.setMode((scope.$mode + 1) % $datepicker.$views.length);
                    };
                    // Public methods
                    $datepicker.update = function (date) {
                        // console.warn('$datepicker.update() newValue=%o', date);
                        if (angular.isDate(date) && !isNaN(date.getTime())) {
                            $datepicker.$date = date;
                            $picker.update.call($picker, date);
                        }
                        // Build only if pristine
                        $datepicker.$build(true);
                    };

                    $datepicker.updateDisabledDates = function (dateRanges) {
                        options.disabledDateRanges = dateRanges;
                        for (var i = 0, l = scope.rows.length; i < l; i++) {
                            angular.forEach(scope.rows[i], $datepicker.$setDisabledEl);
                        }
                    };

                    $datepicker.select = function (date, keep) {
                        // console.warn('$datepicker.select', date, scope.$mode);
                        if (!angular.isDate(controller.$dateValue)) controller.$dateValue = new Date(date);
                        if (!scope.$mode || keep) {
                            controller.$setViewValue(angular.copy(date));
                            controller.$render();
                            if (options.autoclose && !keep) {
                                $datepicker.hide(false);      // set false to keep focus alive on element
                            }
                        } else {
                            angular.extend(viewDate, {year:date.getFullYear(), month:date.getMonth(), date:date.getDate()});
                            $datepicker.setMode(scope.$mode - 1);
                            $datepicker.$build();
                        }
                        if (!scope.$$phase) {     // need to apply if change form panel view
                            scope.$apply();
                        }
                    };

                    $datepicker.setCustomDate = function (date) {
                        // function to handle manual entered date value
                        if (!date && controller.$viewValue) {
                            // code to handle string keywords (today, yesterday, sun, jan, today+1, etc.) for date value
                            var elmValue = controller.$viewValue;
                            //start: in datejs we found issue in april and august months, so we manualy prepend / before month name : Naveen Singh 21/11/2014 .
                            var isAprilOrAugust = /a(p|u)/.test(elmValue);
                            if (isAprilOrAugust) {
                                elmValue = elmValue.replace(/a/g, "/a");
                            }
                            // end :
                            date = Date.parse(elmValue);
                            $datepicker.select(date);
                            return;
                        }
                        if (typeof date != "object") {
                            return;
                        }
                        date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                        controller.$setViewValue(date);
                    }
                    $datepicker.setMode = function (mode) {
                        // console.warn('$datepicker.setMode', mode);
                        scope.$mode = mode;
                        $picker = $datepicker.$views[scope.$mode];
                        $datepicker.$build();
                    };

                    // Protected methods

                    $datepicker.$build = function (pristine) {
                        // console.warn('$datepicker.$build() viewDate=%o', viewDate);
                        if (pristine === true && $picker.built) return;
                        if (pristine === false && !$picker.built) return;
                        $picker.build.call($picker);
                    };

                    $datepicker.$updateSelected = function () {
                        for (var i = 0, l = scope.rows.length; i < l; i++) {
                            angular.forEach(scope.rows[i], updateSelected);
                        }
                    };

                    $datepicker.$isSelected = function (date) {
                        return $picker.isSelected(date);
                    };

                    $datepicker.$setDisabledEl = function (el) {
                        el.disabled = $picker.isDisabled(el.date);
                    };

                    $datepicker.$selectPane = function (value) {
                        var steps = $picker.steps;
                        var targetDate = new Date(Date.UTC(viewDate.year + ((steps.year || 0) * value), viewDate.month + ((steps.month || 0) * value), viewDate.date + ((steps.day || 0) * value)));
                        angular.extend(viewDate, {year:targetDate.getUTCFullYear(), month:targetDate.getUTCMonth(), date:targetDate.getUTCDate()});
                        $datepicker.$build();
                    };

                    $datepicker.$onMouseDown = function (evt) {
                        // Prevent blur on mousedown on .dropdown-menu
                        evt.preventDefault();
                        evt.stopPropagation();
                        // Emulate click for mobile devices
                        if (isTouch) {
                            var targetEl = angular.element(evt.target);
                            if (targetEl[0].nodeName.toLowerCase() !== 'button') {
                                targetEl = targetEl.parent();
                            }
                            targetEl.triggerHandler('click');
                        }
                    };
                    $datepicker.$onKeyDown = function (evt) {
                        if (!/(13|37|38|39|40|27)/.test(evt.keyCode) || evt.shiftKey || evt.altKey) {
                            return;
                        }
                        evt.preventDefault();
                        evt.stopPropagation();
                        if (evt.keyCode == 27) {
                            $datepicker.hide();
                            return;
                        }

                        // comment below code as we handle enter key event in $picker.onKeyDown , Naveen Singh 19/11/2014
//                        if (evt.keyCode === 13) {
//                            if (controller.$dateValue) {
//                                $datepicker.select(new Date(controller.$dateValue));
//                            } else {
//                                $datepicker.select(new Date());
//                            }
//                            if (!scope.$mode) {
//                                return $datepicker.hide(true);
//                            } else {
//                                return scope.$apply(function () {
//                                    $datepicker.setMode(scope.$mode - 1);
//                                });
//                            }
//                        }

                        // Navigate with keyboard
                        $picker.onKeyDown(evt);
                        parentScope.$digest();
                    };

                    // Private

                    function updateSelected(el) {
                        el.selected = $datepicker.$isSelected(el.date);
                    }

                    function focusElement() {
                        element[0].focus();
                    }

                    // Overrides

                    var _init = $datepicker.init;
                    $datepicker.init = function () {
                        if (isNative && options.useNative) {
                            element.prop('type', 'date');
                            element.css('-webkit-appearance', 'textfield');
                            return;
                        } else if (isTouch) {
                            element.prop('type', 'text');
                            element.attr('readonly', 'true');
                            element.on('click', focusElement);
                        }
                        _init();
                    };
                    var _destroy = $datepicker.destroy;
                    $datepicker.destroy = function () {
                        if (isNative && options.useNative) {
                            element.off('click', focusElement);
                        }
                        _destroy();
                    };
                    var _show = $datepicker.show;
                    $datepicker.show = function () {

                        var prevElement = element.prev();
//                        prevElement.focus();                           // uncomment this to set focus on previous element on which calender icon is bind,  Naveen Singh : 20/11/2014
                        prevElement.bind('keydown', function (evt) {
                            if (evt.keyCode == 27) {
                                $datepicker.hide();
                            }
                        });

                        _show();

                        setTimeout(function () {
                            if (!$datepicker.$element) {
                                return;
                            }
                            $datepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
                            if (options.keyboard) {
                                element.on('keydown', $datepicker.$onKeyDown);
                            }
                        });
                    };
                    var _hide = $datepicker.hide;
                    $datepicker.hide = function (blur) {
                        if (!$datepicker.$element) {
                            return;
                        }
                        $datepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
                        if (options.keyboard) {
                            element.off('keydown', $datepicker.$onKeyDown);
                        }
                        _hide(blur);
                    };
                    return $datepicker;
                }

                DatepickerFactory.defaults = defaults;
                return DatepickerFactory;

            }];

        })

        .directive('bsDatepicker', ["$window", "$parse", "$q", "$locale", "dateFilter", "$datepicker", "$dateParser", "$timeout", function ($window, $parse, $q, $locale, dateFilter, $datepicker, $dateParser, $timeout) {

            var defaults = $datepicker.defaults;
            var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
            var isNumeric = function (n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            };

            return {
                restrict:'EAC',
                require:'ngModel',
                link:function postLink(scope, element, attr, controller) {

                    // Directive options
                    var options = {scope:scope, controller:controller};
                    angular.forEach(['placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'template', 'autoclose', 'dateType', 'dateFormat', 'modelDateFormat', 'dayFormat', 'strictFormat', 'startWeek', 'startDate', 'useNative', 'lang', 'startView', 'minView', 'iconLeft', 'iconRight', 'daysOfWeekDisabled'], function (key) {
                        if (angular.isDefined(attr[key])) options[key] = attr[key];
                    });

                    // Visibility binding support
                    attr.bsShow && scope.$watch(attr.bsShow, function (newValue, oldValue) {
                        if (!datepicker || !angular.isDefined(newValue)) return;
                        if (angular.isString(newValue)) newValue = !!newValue.match(',?(datepicker),?');
                        newValue === true ? datepicker.show() : datepicker.hide();
                    });

                    // Initialize datepicker
                    var datepicker = $datepicker(element, controller, options);
                    var prevElement = element.prev();
                    prevElement.bind('blur', function (evt) {
                        datepicker.hide();
                    });

                    element.bind('blur', function (evt) {
                        datepicker.setCustomDate(controller.$modelValue);
                        datepicker.hide();
                    });
                    options = datepicker.$options;
                    // Set expected iOS format
                    if (isNative && options.useNative) options.dateFormat = 'yyyy-MM-dd';

                    // Observe attributes for changes
                    angular.forEach(['minDate', 'maxDate'], function (key) {
                        // console.warn('attr.$observe(%s)', key, attr[key]);
                        angular.isDefined(attr[key]) && attr.$observe(key, function (newValue) {
                            // console.warn('attr.$observe(%s)=%o', key, newValue);
                            if (newValue === 'today') {
                                var today = new Date();
                                datepicker.$options[key] = +new Date(today.getFullYear(), today.getMonth(), today.getDate() + (key === 'maxDate' ? 1 : 0), 0, 0, 0, (key === 'minDate' ? 0 : -1));
                            } else if (angular.isString(newValue) && newValue.match(/^".+"$/)) { // Support {{ dateObj }}
                                datepicker.$options[key] = +new Date(newValue.substr(1, newValue.length - 2));
                            } else if (isNumeric(newValue)) {
                                datepicker.$options[key] = +new Date(parseInt(newValue, 10));
                            } else if (angular.isString(newValue) && 0 === newValue.length) { // Reset date
                                datepicker.$options[key] = key === 'maxDate' ? +Infinity : -Infinity;
                            } else {
                                datepicker.$options[key] = +new Date(newValue);
                            }
                            // Build only if dirty
                            !isNaN(datepicker.$options[key]) && datepicker.$build(false);
                        });
                    });

                    // Watch model for changes
                    scope.$watch(attr.ngModel, function (newValue, oldValue) {
                        datepicker.update(controller.$dateValue);
                    }, true);

                    // Normalize undefined/null/empty array,
                    // so that we don't treat changing from undefined->null as a change.
                    function normalizeDateRanges(ranges) {
                        if (!ranges || !ranges.length) return null;
                        return ranges;
                    }

                    if (angular.isDefined(attr.disabledDates)) {
                        scope.$watch(attr.disabledDates, function (disabledRanges, previousValue) {
                            disabledRanges = normalizeDateRanges(disabledRanges);
                            previousValue = normalizeDateRanges(previousValue);

                            if (disabledRanges !== previousValue) {
                                datepicker.updateDisabledDates(disabledRanges);
                            }
                        });
                    }

                    var dateParser = $dateParser({format:options.dateFormat, lang:options.lang, strict:options.strictFormat});

                    // viewValue -> $parsers -> modelValue
                    controller.$parsers.unshift(function (viewValue) {
                        // console.warn('$parser("%s"): viewValue=%o', element.attr('ng-model'), viewValue);
                        // Null values should correctly reset the model value & validity
                        if (!viewValue) {
                            controller.$setValidity('date', true);
                            return;
                        }
                        var parsedDate = dateParser.parse(viewValue, controller.$dateValue);
                        if (!parsedDate || isNaN(parsedDate.getTime())) {
                            controller.$setValidity('date', false);
                            return;
                        } else {
                            var isMinValid = isNaN(datepicker.$options.minDate) || parsedDate.getTime() >= datepicker.$options.minDate;
                            var isMaxValid = isNaN(datepicker.$options.maxDate) || parsedDate.getTime() <= datepicker.$options.maxDate;
                            var isValid = isMinValid && isMaxValid;
                            controller.$setValidity('date', isValid);
                            controller.$setValidity('min', isMinValid);
                            controller.$setValidity('max', isMaxValid);
                            // Only update the model when we have a valid date
                            if (isValid) controller.$dateValue = parsedDate;
                        }
                        if (options.dateType === 'string') {
                            return dateFilter(parsedDate, options.modelDateFormat || options.dateFormat);
                        } else if (options.dateType === 'number') {
                            return controller.$dateValue.getTime();
                        } else if (options.dateType === 'iso') {
                            return controller.$dateValue.toISOString();
                        } else {
                            return new Date(controller.$dateValue);
                        }
                    });

                    // modelValue -> $formatters -> viewValue
                    controller.$formatters.push(function (modelValue) {
                        // console.warn('$formatter("%s"): modelValue=%o (%o)', element.attr('ng-model'), modelValue, typeof modelValue);
                        var date;
                        if (angular.isUndefined(modelValue) || modelValue === null) {
                            date = NaN;
                        } else if (angular.isDate(modelValue)) {
                            date = modelValue;
                        } else if (options.dateType === 'string') {
                            date = dateParser.parse(modelValue, null, options.modelDateFormat);
                        } else {
                            date = new Date(modelValue);
                        }
                        // Setup default value?
                        // if(isNaN(date.getTime())) {
                        //   var today = new Date();
                        //   date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
                        // }
                        controller.$dateValue = date;
                        return controller.$dateValue;
                    });

                    // viewValue -> element
                    controller.$render = function () {
                        // console.warn('$render("%s"): viewValue=%o', element.attr('ng-model'), controller.$viewValue);
                        element.val(!controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : dateFilter(controller.$dateValue, options.dateFormat));
                    };

                    // Garbage collection
                    scope.$on('$destroy', function () {
                        if (datepicker) datepicker.destroy();
                        options = null;
                        datepicker = null;
                    });

                }
            };

        }])

        .provider('datepickerViews', function () {

            var defaults = this.defaults = {
                dayFormat:'dd',
                daySplit:7
            };

            // Split array into smaller arrays
            function split(arr, size) {
                var arrays = [];
                while (arr.length > 0) {
                    arrays.push(arr.splice(0, size));
                }
                return arrays;
            }

            // Modulus operator
            function mod(n, m) {
                return ((n % m) + m) % m;
            }

            this.$get = ["$locale", "$sce", "dateFilter", function ($locale, $sce, dateFilter) {

                return function (picker) {

                    var scope = picker.$scope;
                    var options = picker.$options;

                    var weekDaysMin = $locale.DATETIME_FORMATS.SHORTDAY;
                    var weekDaysLabels = weekDaysMin.slice(options.startWeek).concat(weekDaysMin.slice(0, options.startWeek));
                    var weekDaysLabelsHtml = $sce.trustAsHtml('<th class="dow text-center">' + weekDaysLabels.join('</th><th class="dow text-center">') + '</th>');

                    var startDate = picker.$date || (options.startDate ? new Date(options.startDate) : new Date());
                    var viewDate = {year:startDate.getFullYear(), month:startDate.getMonth(), date:startDate.getDate()};
                    var timezoneOffset = startDate.getTimezoneOffset() * 6e4;

                    var views = [
                        {
                            format:options.dayFormat,
                            split:7,
                            steps:{ month:1 },
                            update:function (date, force) {
                                if (!this.built || force || date.getFullYear() !== viewDate.year || date.getMonth() !== viewDate.month) {
                                    angular.extend(viewDate, {year:picker.$date.getFullYear(), month:picker.$date.getMonth(), date:picker.$date.getDate()});
                                    picker.$build();
                                } else if (date.getDate() !== viewDate.date) {
                                    viewDate.date = picker.$date.getDate();
                                    picker.$updateSelected();
                                }
                            },
                            build:function () {
                                var firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1), firstDayOfMonthOffset = firstDayOfMonth.getTimezoneOffset();
                                var firstDate = new Date(+firstDayOfMonth - mod(firstDayOfMonth.getDay() - options.startWeek, 7) * 864e5), firstDateOffset = firstDate.getTimezoneOffset();
                                var today = new Date().toDateString();
                                // Handle daylight time switch
                                if (firstDateOffset !== firstDayOfMonthOffset) firstDate = new Date(+firstDate + (firstDateOffset - firstDayOfMonthOffset) * 60e3);
                                var days = [], day;
                                var today1 = new Date()
                                for (var i = 0; i < 42; i++) { // < 7 * 6
                                    day = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + i);
                                    days.push({date:day, isToday:day.toDateString() === today, label:dateFilter(day, this.format), selected:(picker.$date && this.isSelected(day)) || ((!picker.$date) && (day.getDate() == today1.getDate()) && (day.getMonth() == today1.getMonth())), muted:day.getMonth() !== viewDate.month, disabled:this.isDisabled(day)});
                                }
                                scope.title = dateFilter(firstDayOfMonth, 'MMMM yyyy');
                                scope.showLabels = true;
                                scope.labels = weekDaysLabelsHtml;
                                scope.rows = split(days, this.split);
                                this.built = true;
                            },
                            isSelected:function (date) {
                                return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth() && date.getDate() === picker.$date.getDate();
                            },
                            isDisabled:function (date) {
                                var time = date.getTime();

                                // Disabled because of min/max date.
                                if (time < options.minDate || time > options.maxDate) return true;

                                // Disabled due to being a disabled day of the week
                                if (options.daysOfWeekDisabled.indexOf(date.getDay()) !== -1) return true;

                                // Disabled because of disabled date range.
                                if (options.disabledDateRanges) {
                                    for (var i = 0; i < options.disabledDateRanges.length; i++) {
                                        if (time >= options.disabledDateRanges[i].start) {
                                            if (time <= options.disabledDateRanges[i].end) return true;

                                            // The disabledDateRanges is expected to be sorted, so if time >= start,
                                            // we know it's not disabled.
                                            return false;
                                        }
                                    }
                                }

                                return false;
                            },
                            onKeyDown:function (evt) {
                                if (!(picker.$date)) {
                                    picker.$date = new Date();
                                }
                                var actualTime = picker.$date.getTime();
                                var newDate;

                                if (evt.keyCode === 37) newDate = new Date(actualTime - 1 * 864e5);
                                else if (evt.keyCode === 38) newDate = new Date(actualTime - 7 * 864e5);
                                else if (evt.keyCode === 39) newDate = new Date(actualTime + 1 * 864e5);
                                else if (evt.keyCode === 40) newDate = new Date(actualTime + 7 * 864e5);
                                else if (evt.keyCode === 13) {
                                    // start: 19/11/2014 :  Naveen Singh
                                    // code to select with date value with enter key
                                    newDate = picker.$date;
                                    if (!this.isDisabled(newDate)){
                                        newDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0);
                                        picker.select(newDate, false);
                                    }
                                    return;
                                }
                                picker.$date = newDate;
                                // code to set {selected = true} for current date
                                for (var i = 0, l = scope.rows.length; i < l; i++) {
                                    angular.forEach(scope.rows[i], function (dt) {
                                        if (dt.selected) {
                                            dt.selected = false;
                                        }
                                        if ((dt.date.getDate() == newDate.getDate()) && (dt.date.getMonth() == newDate.getMonth())) {
                                            dt.selected = true;
                                            picker.$build();
                                        }
                                    });
                                }
                                picker.update.call(picker, newDate);
                                // end : Naveen Singh.
                            }
                        },
                        {
                            name:'month',
                            format:'MMM',
                            split:4,
                            steps:{ year:1 },
                            update:function (date, force) {
                                if (!this.built || date.getFullYear() !== viewDate.year) {
                                    angular.extend(viewDate, {year:picker.$date.getFullYear(), month:picker.$date.getMonth(), date:picker.$date.getDate()});
                                    picker.$build();
                                } else if (date.getMonth() !== viewDate.month) {
                                    angular.extend(viewDate, {month:picker.$date.getMonth(), date:picker.$date.getDate()});
                                    picker.$updateSelected();
                                }
                            },
                            build:function () {
                                var firstMonth = new Date(viewDate.year, 0, 1);
                                var months = [], month;
                                for (var i = 0; i < 12; i++) {
                                    month = new Date(viewDate.year, i, 1);
                                    months.push({date:month, label:dateFilter(month, this.format), selected:picker.$isSelected(month), disabled:this.isDisabled(month)});
                                }
                                scope.title = dateFilter(month, 'yyyy');
                                scope.showLabels = false;
                                scope.rows = split(months, this.split);
                                this.built = true;
                            },
                            isSelected:function (date) {
                                return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth();
                            },
                            isDisabled:function (date) {
                                var lastDate = +new Date(date.getFullYear(), date.getMonth() + 1, 0);
                                return lastDate < options.minDate || date.getTime() > options.maxDate;
                            },
                            onKeyDown:function (evt) {
                                var actualMonth = picker.$date.getMonth();
                                var newDate = new Date(picker.$date);

                                if (evt.keyCode === 37) newDate.setMonth(actualMonth - 1);
                                else if (evt.keyCode === 38) newDate.setMonth(actualMonth - 4);
                                else if (evt.keyCode === 39) newDate.setMonth(actualMonth + 1);
                                else if (evt.keyCode === 40) newDate.setMonth(actualMonth + 4);

                                if (!this.isDisabled(newDate)) picker.select(newDate, true);
                            }
                        },
                        {
                            name:'year',
                            format:'yyyy',
                            split:4,
                            steps:{ year:12 },
                            update:function (date, force) {
                                if (!this.built || force || parseInt(date.getFullYear() / 20, 10) !== parseInt(viewDate.year / 20, 10)) {
                                    angular.extend(viewDate, {year:picker.$date.getFullYear(), month:picker.$date.getMonth(), date:picker.$date.getDate()});
                                    picker.$build();
                                } else if (date.getFullYear() !== viewDate.year) {
                                    angular.extend(viewDate, {year:picker.$date.getFullYear(), month:picker.$date.getMonth(), date:picker.$date.getDate()});
                                    picker.$updateSelected();
                                }
                            },
                            build:function () {
                                var firstYear = viewDate.year - viewDate.year % (this.split * 3);
                                var years = [], year;
                                for (var i = 0; i < 12; i++) {
                                    year = new Date(firstYear + i, 0, 1);
                                    years.push({date:year, label:dateFilter(year, this.format), selected:picker.$isSelected(year), disabled:this.isDisabled(year)});
                                }
                                scope.title = years[0].label + '-' + years[years.length - 1].label;
                                scope.showLabels = false;
                                scope.rows = split(years, this.split);
                                this.built = true;
                            },
                            isSelected:function (date) {
                                return picker.$date && date.getFullYear() === picker.$date.getFullYear();
                            },
                            isDisabled:function (date) {
                                var lastDate = +new Date(date.getFullYear() + 1, 0, 0);
                                return lastDate < options.minDate || date.getTime() > options.maxDate;
                            },
                            onKeyDown:function (evt) {
                                var actualYear = picker.$date.getFullYear(),
                                    newDate = new Date(picker.$date);

                                if (evt.keyCode === 37) newDate.setYear(actualYear - 1);
                                else if (evt.keyCode === 38) newDate.setYear(actualYear - 4);
                                else if (evt.keyCode === 39) newDate.setYear(actualYear + 1);
                                else if (evt.keyCode === 40) newDate.setYear(actualYear + 4);

                                if (!this.isDisabled(newDate)) picker.select(newDate, true);
                            }
                        }
                    ];

                    return {
                        views:options.minView ? Array.prototype.slice.call(views, options.minView) : views,
                        viewDate:viewDate
                    };

                };

            }];

        });

    angular.module('mgcrea.ngStrap.helpers.dateParser', []).provider('$dateParser', [
        '$localeProvider',
        function ($localeProvider) {
            var proto = Date.prototype;

            function isNumeric(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            var defaults = this.defaults = {
                format:'shortDate',
                strict:false
            };
            this.$get = [
                '$locale',
                function ($locale) {
                    var DateParserFactory = function (config) {
                        var options = angular.extend({}, defaults, config);
                        var $dateParser = {};
                        var regExpMap = {
                            'sss':'[0-9]{3}',
                            'ss':'[0-5][0-9]',
                            's':options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
                            'mm':'[0-5][0-9]',
                            'm':options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
                            'HH':'[01][0-9]|2[0-3]',
                            'H':options.strict ? '1?[0-9]|2[0-3]' : '[01]?[0-9]|2[0-3]',
                            'hh':'[0][1-9]|[1][012]',
                            'h':options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
                            'a':'AM|PM',
                            'EEEE':$locale.DATETIME_FORMATS.DAY.join('|'),
                            'EEE':$locale.DATETIME_FORMATS.SHORTDAY.join('|'),
                            'dd':'0[1-9]|[12][0-9]|3[01]',
                            'd':options.strict ? '[1-9]|[1-2][0-9]|3[01]' : '0?[1-9]|[1-2][0-9]|3[01]',
                            'MMMM':$locale.DATETIME_FORMATS.MONTH.join('|'),
                            'MMM':$locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
                            'MM':'0[1-9]|1[012]',
                            'M':options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
                            'yyyy':'[1]{1}[0-9]{3}|[2]{1}[0-9]{3}',
                            'yy':'[0-9]{2}',
                            'y':options.strict ? '-?(0|[1-9][0-9]{0,3})' : '-?0*[0-9]{1,4}'
                        };
                        var setFnMap = {
                            'sss':proto.setMilliseconds,
                            'ss':proto.setSeconds,
                            's':proto.setSeconds,
                            'mm':proto.setMinutes,
                            'm':proto.setMinutes,
                            'HH':proto.setHours,
                            'H':proto.setHours,
                            'hh':proto.setHours,
                            'h':proto.setHours,
                            'dd':proto.setDate,
                            'd':proto.setDate,
                            'a':function (value) {
                                var hours = this.getHours();
                                return this.setHours(value.match(/pm/i) ? hours + 12 : hours);
                            },
                            'MMMM':function (value) {
                                return this.setMonth($locale.DATETIME_FORMATS.MONTH.indexOf(value));
                            },
                            'MMM':function (value) {
                                return this.setMonth($locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value));
                            },
                            'MM':function (value) {
                                return this.setMonth(1 * value - 1);
                            },
                            'M':function (value) {
                                return this.setMonth(1 * value - 1);
                            },
                            'yyyy':proto.setFullYear,
                            'yy':function (value) {
                                return this.setFullYear(2000 + 1 * value);
                            },
                            'y':proto.setFullYear
                        };
                        var regex, setMap;
                        $dateParser.init = function () {
                            $dateParser.$format = $locale.DATETIME_FORMATS[options.format] || options.format;
                            regex = regExpForFormat($dateParser.$format);
                            setMap = setMapForFormat($dateParser.$format);
                        };
                        $dateParser.isValid = function (date) {
                            if (angular.isDate(date))
                                return !isNaN(date.getTime());
                            return regex.test(date);
                        };
                        $dateParser.parse = function (value, baseDate) {
                            if (angular.isDate(value))
                                return value;
                            var matches = regex.exec(value);
                            if (!matches)
                                return false;
                            var date = baseDate || new Date(0);
                            for (var i = 0; i < matches.length - 1; i++) {
                                setMap[i] && setMap[i].call(date, matches[i + 1]);
                            }
                            return date;
                        };
                        // Private functions
                        function setMapForFormat(format) {
                            var keys = Object.keys(setFnMap), i;
                            var map = [], sortedMap = [];
                            // Map to setFn
                            var clonedFormat = format;
                            for (i = 0; i < keys.length; i++) {
                                if (format.split(keys[i]).length > 1) {
                                    var index = clonedFormat.search(keys[i]);
                                    format = format.split(keys[i]).join('');
                                    if (setFnMap[keys[i]])
                                        map[index] = setFnMap[keys[i]];
                                }
                            }
                            // Sort result map
                            angular.forEach(map, function (v) {
                                sortedMap.push(v);
                            });
                            return sortedMap;
                        }

                        function escapeReservedSymbols(text) {
                            return text.replace(/\//g, '[\\/]').replace('/-/g', '[-]').replace(/\./g, '[.]').replace(/\\s/g, '[\\s]');
                        }

                        function regExpForFormat(format) {
                            var keys = Object.keys(regExpMap), i;
                            var re = format;
                            // Abstract replaces to avoid collisions
                            for (i = 0; i < keys.length; i++) {
                                re = re.split(keys[i]).join('${' + i + '}');
                            }
                            // Replace abstracted values
                            for (i = 0; i < keys.length; i++) {
                                re = re.split('${' + i + '}').join('(' + regExpMap[keys[i]] + ')');
                            }
                            format = escapeReservedSymbols(format);
                            return new RegExp('^' + re + '$', ['i']);
                        }

                        $dateParser.init();
                        return $dateParser;
                    };
                    return DateParserFactory;
                }
            ];
        }
    ]);

    angular.module('mgcrea.ngStrap.helpers.dimensions', []).factory('dimensions', [
        '$document',
        '$window',
        function ($document, $window) {
            var jqLite = angular.element;
            var fn = {};
            /**
             * Test the element nodeName
             * @param element
             * @param name
             */
            var nodeName = fn.nodeName = function (element, name) {
                return element.nodeName && element.nodeName.toLowerCase() === name.toLowerCase();
            };
            /**
             * Returns the element computed style
             * @param element
             * @param prop
             * @param extra
             */
            fn.css = function (element, prop, extra) {
                var value;
                if (element.currentStyle) {
                    //IE
                    value = element.currentStyle[prop];
                } else if (window.getComputedStyle) {
                    value = window.getComputedStyle(element)[prop];
                } else {
                    value = element.style[prop];
                }
                return extra === true ? parseFloat(value) || 0 : value;
            };
            /**
             * Provides read-only equivalent of jQuery's offset function:
             * @required-by bootstrap-tooltip, bootstrap-affix
             * @url http://api.jquery.com/offset/
             * @param element
             */
            fn.offset = function (element) {
                var boxRect = element.getBoundingClientRect();
                var docElement = element.ownerDocument;
                return {
                    width:element.offsetWidth,
                    height:element.offsetHeight,
                    top:boxRect.top + (window.pageYOffset || docElement.documentElement.scrollTop) - (docElement.documentElement.clientTop || 0),
                    left:boxRect.left + (window.pageXOffset || docElement.documentElement.scrollLeft) - (docElement.documentElement.clientLeft || 0)
                };
            };
            /**
             * Provides read-only equivalent of jQuery's position function
             * @required-by bootstrap-tooltip, bootstrap-affix
             * @url http://api.jquery.com/offset/
             * @param element
             */
            fn.position = function (element) {
                var offsetParentRect = {
                    top:0,
                    left:0
                }, offsetParentElement, offset;
                // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
                if (fn.css(element, 'position') === 'fixed') {
                    // We assume that getBoundingClientRect is available when computed position is fixed
                    offset = element.getBoundingClientRect();
                } else {
                    // Get *real* offsetParentElement
                    offsetParentElement = offsetParent(element);
                    offset = fn.offset(element);
                    // Get correct offsets
                    offset = fn.offset(element);
                    if (!nodeName(offsetParentElement, 'html')) {
                        offsetParentRect = fn.offset(offsetParentElement);
                    }
                    // Add offsetParent borders
                    offsetParentRect.top += fn.css(offsetParentElement, 'borderTopWidth', true);
                    offsetParentRect.left += fn.css(offsetParentElement, 'borderLeftWidth', true);
                }
                // Subtract parent offsets and element margins
                return {
                    width:element.offsetWidth,
                    height:element.offsetHeight,
                    top:offset.top - offsetParentRect.top - fn.css(element, 'marginTop', true),
                    left:offset.left - offsetParentRect.left - fn.css(element, 'marginLeft', true)
                };
            };
            /**
             * Returns the closest, non-statically positioned offsetParent of a given element
             * @required-by fn.position
             * @param element
             */
            var offsetParent = function offsetParentElement(element) {
                var docElement = element.ownerDocument;
                var offsetParent = element.offsetParent || docElement;
                if (nodeName(offsetParent, '#document'))
                    return docElement.documentElement;
                while (offsetParent && !nodeName(offsetParent, 'html') && fn.css(offsetParent, 'position') === 'static') {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent || docElement.documentElement;
            };
            /**
             * Provides equivalent of jQuery's height function
             * @required-by bootstrap-affix
             * @url http://api.jquery.com/height/
             * @param element
             * @param outer
             */
            fn.height = function (element, outer) {
                var value = element.offsetHeight;
                if (outer) {
                    value += fn.css(element, 'marginTop', true) + fn.css(element, 'marginBottom', true);
                } else {
                    value -= fn.css(element, 'paddingTop', true) + fn.css(element, 'paddingBottom', true) + fn.css(element, 'borderTopWidth', true) + fn.css(element, 'borderBottomWidth', true);
                }
                return value;
            };
            /**
             * Provides equivalent of jQuery's height function
             * @required-by bootstrap-affix
             * @url http://api.jquery.com/width/
             * @param element
             * @param outer
             */
            fn.width = function (element, outer) {
                var value = element.offsetWidth;
                if (outer) {
                    value += fn.css(element, 'marginLeft', true) + fn.css(element, 'marginRight', true);
                } else {
                    value -= fn.css(element, 'paddingLeft', true) + fn.css(element, 'paddingRight', true) + fn.css(element, 'borderLeftWidth', true) + fn.css(element, 'borderRightWidth', true);
                }
                return value;
            };
            return fn;
        }
    ]);

    angular.module('mgcrea.ngStrap.helpers.parseOptions', []).provider('$parseOptions', function () {
        var defaults = this.defaults = { regexp:/^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/ };
        this.$get = [
            '$parse',
            '$q',
            function ($parse, $q) {
                function ParseOptionsFactory(attr, config) {
                    var $parseOptions = {};
                    // Common vars
                    var options = angular.extend({}, defaults, config);
                    $parseOptions.$values = [];
                    // Private vars
                    var match, displayFn, valueName, keyName, groupByFn, valueFn, valuesFn;
                    $parseOptions.init = function () {
                        $parseOptions.$match = match = attr.match(options.regexp);
                        displayFn = $parse(match[2] || match[1]), valueName = match[4] || match[6], keyName = match[5], groupByFn = $parse(match[3] || '');
                        valueFn = $parse(match[2] ? match[1] : valueName);
                        valuesFn = $parse(match[7]);
                    };
                    $parseOptions.valuesFn = function (scope, controller) {
                        return $q.when(valuesFn(scope, controller)).then(function (values) {
                            $parseOptions.$values = values ? parseValues(values) : {};
                            return $parseOptions.$values;
                        });
                    };
                    $parseOptions.valuesFnApplane = function (scope, controller, typeaheadOptions) {
                        return $q.when(valuesFn(scope, controller)).then(function (values) {
                            if (values === undefined) {
                                return;
                            }
                            $parseOptions.$values = values ? parseValues(values, typeaheadOptions) : {};
                            return $parseOptions.$values;
                        });
                    };
                    $parseOptions.getParseValue = function (value, typeaheadOptions, skipTypeahead) {
                        var values = [];
                        values.push(value);
                        $parseOptions.$values = values ? parseValues(values, typeaheadOptions, skipTypeahead) : {};
                        return $parseOptions.$values;
                    };
                    // Private functions
                    function parseValues(values, typeaheadOptions, skipTypeahead) {
                        return values.map(function (match, index) {
                            var locals = {}, label, value;
                            locals[valueName] = match;
                            label = displayFn(locals);
                            if (!skipTypeahead && typeaheadOptions && typeaheadOptions.otherDisplayFields && typeaheadOptions.otherDisplayFields != "undefined") {
                                var otherSupportiveValue = typeaheadOptions.otherDisplayFields.split(',');
                                for (var i = 0; i < otherSupportiveValue.length; i++) {
                                    var bindingField = otherSupportiveValue[i].split('.');
                                    var bindedvalue = locals[valueName];
                                    for (var j = 0; j < bindingField.length; j++) {
                                        var obj = bindingField[j];
                                        if (angular.isDefined(bindedvalue[bindingField[j]])) {
                                            bindedvalue = bindedvalue[bindingField[j]];
                                        } else {
                                            bindedvalue = undefined;
                                        }
                                    }
                                    if (angular.isDefined(bindedvalue) && angular.isDefined(label)) {
                                        label += ' | ' + bindedvalue;
                                    }
                                }
                            }
                            value = valueFn(locals) || index;
                            return {
                                label:label,
                                value:value
                            };
                        });
                    }

                    $parseOptions.init();
                    return $parseOptions;
                }

                return ParseOptionsFactory;
            }
        ];
    });

    angular.version.minor < 3 && angular.version.dot < 14 && angular.module('ng').factory('$$rAF', [
        '$window',
        '$timeout',
        function ($window, $timeout) {
            var requestAnimationFrame = $window.requestAnimationFrame || $window.webkitRequestAnimationFrame || $window.mozRequestAnimationFrame;
            var cancelAnimationFrame = $window.cancelAnimationFrame || $window.webkitCancelAnimationFrame || $window.mozCancelAnimationFrame || $window.webkitCancelRequestAnimationFrame;
            var rafSupported = !!requestAnimationFrame;
            var raf = rafSupported ? function (fn) {
                var id = requestAnimationFrame(fn);
                return function () {
                    cancelAnimationFrame(id);
                };
            } : function (fn) {
                var timer = $timeout(fn, 16.66, false);
                // 1000 / 60 = 16.666
                return function () {
                    $timeout.cancel(timer);
                };
            };
            raf.supported = rafSupported;
            return raf;
        }
    ]);

    angular.module('mgcrea.ngStrap.timepicker', [
        'mgcrea.ngStrap.helpers.dateParser',
        'mgcrea.ngStrap.tooltip'
    ]).provider('$timepicker',
        function () {
            var defaults = this.defaults = {
                animation:'am-fade',
                prefixClass:'timepicker',
                placement:'bottom-left',
                template:'timepicker/timepicker.tpl.html',
                trigger:'focus',
                container:false,
                keyboard:true,
                html:false,
                delay:0,
                useNative:true,
                timeType:'date',
                timeFormat:'shortTime',
                autoclose:false,
                minTime:-Infinity,
                maxTime:+Infinity,
                length:5,
                hourStep:1,
                minuteStep:5
            };
            this.$get = [
                '$window',
                '$document',
                '$rootScope',
                '$sce',
                '$locale',
                'dateFilter',
                '$tooltip',
                function ($window, $document, $rootScope, $sce, $locale, dateFilter, $tooltip) {
                    var bodyEl = angular.element($window.document.body);
                    var isTouch = 'createTouch' in $window.document;
                    var isNative = /(ip(a|o)d|iphone|android)/gi.test($window.navigator.userAgent);
                    if (!defaults.lang)
                        defaults.lang = $locale.id;
                    function timepickerFactory(element, controller, config) {
                        var $timepicker = $tooltip(element, angular.extend({}, defaults, config));
                        var parentScope = config.scope;
                        var options = $timepicker.$options;
                        var scope = $timepicker.$scope;
                        // View vars
                        var selectedIndex = 0;
                        var startDate = controller.$dateValue || new Date();
                        var viewDate = {
                            hour:startDate.getHours(),
                            meridian:startDate.getHours() < 12,
                            minute:startDate.getMinutes(),
                            second:startDate.getSeconds(),
                            millisecond:startDate.getMilliseconds()
                        };
                        var format = $locale.DATETIME_FORMATS[options.timeFormat] || options.timeFormat;
                        var formats = /(h+)[:]?(m+)[ ]?(a?)/i.exec(format).slice(1);
                        // Scope methods
                        scope.$select = function (date, index, $event) {
                            $event.stopPropagation();
                            $event.preventDefault();
                            $timepicker.select(date, index);
                        };
                        scope.$moveIndex = function (value, index, $event) {
                            $event.stopPropagation();
                            $event.preventDefault();
                            $timepicker.$moveIndex(value, index);
                        };
                        scope.$switchMeridian = function ($event, date) {
                            $event.stopPropagation();
                            $event.preventDefault();
                            $timepicker.switchMeridian(date);
                        };
                        // Public methods
                        $timepicker.update = function (date) {
                            // console.warn('$timepicker.update() newValue=%o', date);
                            if (angular.isDate(date) && !isNaN(date.getTime())) {
                                $timepicker.$date = date;
                                angular.extend(viewDate, {
                                    hour:date.getHours(),
                                    minute:date.getMinutes(),
                                    second:date.getSeconds(),
                                    millisecond:date.getMilliseconds()
                                });
                                $timepicker.$build();
                            } else if (!$timepicker.$isBuilt) {
                                $timepicker.$build();
                            }
                        };
                        $timepicker.select = function (date, index, keep) {
                            // console.warn('$timepicker.select', date, scope.$mode);
                            if (!controller.$dateValue || isNaN(controller.$dateValue.getTime()))
                                controller.$dateValue = new Date(1970, 0, 1);
                            if (!angular.isDate(date))
                                date = new Date(date);
                            if (index === 0)
                                controller.$dateValue.setHours(date.getHours());
                            else if (index === 1)
                                controller.$dateValue.setMinutes(date.getMinutes());
                            controller.$setViewValue(controller.$dateValue);
                            controller.$render();
                            if (options.autoclose && !keep) {
                                $timepicker.hide(true);
                            }
                        };
                        $timepicker.switchMeridian = function (date) {
                            var hours = (date || controller.$dateValue).getHours();
                            controller.$dateValue.setHours(hours < 12 ? hours + 12 : hours - 12);
                            controller.$render();
                            // to change date value by clicking AM, PM buttons
                            controller.$setViewValue(controller.$dateValue);
                        };
                        // Protected methods
                        $timepicker.$build = function () {
                            // console.warn('$timepicker.$build() viewDate=%o', viewDate);
                            var i, midIndex = scope.midIndex = parseInt(options.length / 2, 10);
                            var hours = [], hour;
                            for (i = 0; i < options.length; i++) {
                                hour = new Date(1970, 0, 1, viewDate.hour - (midIndex - i) * options.hourStep);
                                hours.push({
                                    date:hour,
                                    label:dateFilter(hour, formats[0]),
                                    selected:$timepicker.$date && $timepicker.$isSelected(hour, 0),
                                    disabled:$timepicker.$isDisabled(hour, 0)
                                });
                            }
                            var minutes = [], minute;
                            for (i = 0; i < options.length; i++) {
                                minute = new Date(1970, 0, 1, 0, viewDate.minute - (midIndex - i) * options.minuteStep);
                                minutes.push({
                                    date:minute,
                                    label:dateFilter(minute, formats[1]),
                                    selected:$timepicker.$date && $timepicker.$isSelected(minute, 1),
                                    disabled:$timepicker.$isDisabled(minute, 1)
                                });
                            }
                            var rows = [];
                            for (i = 0; i < options.length; i++) {
                                rows.push([
                                    hours[i],
                                    minutes[i]
                                ]);
                            }
                            scope.rows = rows;
                            scope.showAM = !!formats[2];
                            scope.isAM = ($timepicker.$date || hours[midIndex].date).getHours() < 12;
                            $timepicker.$isBuilt = true;
                        };
                        $timepicker.$isSelected = function (date, index) {
                            if (!$timepicker.$date)
                                return false;
                            else if (index === 0) {
                                return date.getHours() === $timepicker.$date.getHours();
                            } else if (index === 1) {
                                return date.getMinutes() === $timepicker.$date.getMinutes();
                            }
                        };
                        $timepicker.$isDisabled = function (date, index) {
                            var selectedTime;
                            if (index === 0) {
                                selectedTime = date.getTime() + viewDate.minute * 60000;
                            } else if (index === 1) {
                                selectedTime = date.getTime() + viewDate.hour * 3600000;
                            }
                            return selectedTime < options.minTime || selectedTime > options.maxTime;
                        };
                        $timepicker.$moveIndex = function (value, index) {
                            var targetDate;
                            if (index === 0) {
                                targetDate = new Date(1970, 0, 1, viewDate.hour + value * options.length, viewDate.minute);
                                angular.extend(viewDate, { hour:targetDate.getHours() });
                            } else if (index === 1) {
                                targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute + value * options.length * options.minuteStep);
                                angular.extend(viewDate, { minute:targetDate.getMinutes() });
                            }
                            $timepicker.$build();
                        };
                        $timepicker.$onMouseDown = function (evt) {
                            // Prevent blur on mousedown on .dropdown-menu
                            if (evt.target.nodeName.toLowerCase() !== 'input')
                                evt.preventDefault();
                            evt.stopPropagation();
                            // Emulate click for mobile devices
                            if (isTouch) {
                                var targetEl = angular.element(evt.target);
                                if (targetEl[0].nodeName.toLowerCase() !== 'button') {
                                    targetEl = targetEl.parent();
                                }
                                targetEl.triggerHandler('click');
                            }
                        };
                        $timepicker.$onKeyDown = function (evt) {
                            if (!/(38|37|39|40|13)/.test(evt.keyCode) || evt.shiftKey || evt.altKey)
                                return;
                            evt.preventDefault();
                            evt.stopPropagation();
                            // Close on enter
                            if (evt.keyCode === 13)
                                return $timepicker.hide(true);
                            // Navigate with keyboard
                            var newDate = new Date($timepicker.$date);
                            var hours = newDate.getHours(), hoursLength = dateFilter(newDate, 'h').length;
                            var minutes = newDate.getMinutes(), minutesLength = dateFilter(newDate, 'mm').length;
                            var lateralMove = /(37|39)/.test(evt.keyCode);
                            var count = 2 + !!formats[2] * 1;
                            // Navigate indexes (left, right)
                            if (lateralMove) {
                                if (evt.keyCode === 37)
                                    selectedIndex = selectedIndex < 1 ? count - 1 : selectedIndex - 1;
                                else if (evt.keyCode === 39)
                                    selectedIndex = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
                            }
                            // Update values (up, down)
                            if (selectedIndex === 0) {
                                if (lateralMove)
                                    return createSelection(0, hoursLength);
                                if (evt.keyCode === 38)
                                    newDate.setHours(hours - options.hourStep);
                                else if (evt.keyCode === 40)
                                    newDate.setHours(hours + options.hourStep);
                            } else if (selectedIndex === 1) {
                                if (lateralMove)
                                    return createSelection(hoursLength + 1, hoursLength + 1 + minutesLength);
                                if (evt.keyCode === 38)
                                    newDate.setMinutes(minutes - options.minuteStep);
                                else if (evt.keyCode === 40)
                                    newDate.setMinutes(minutes + options.minuteStep);
                            } else if (selectedIndex === 2) {
                                if (lateralMove)
                                    return createSelection(hoursLength + 1 + minutesLength + 1, hoursLength + 1 + minutesLength + 3);
                                $timepicker.switchMeridian();
                            }
                            $timepicker.select(newDate, selectedIndex, true);
                            parentScope.$digest();
                        };
                        // Private
                        function createSelection(start, end) {
                            if (element[0].createTextRange) {
                                var selRange = element[0].createTextRange();
                                selRange.collapse(true);
                                selRange.moveStart('character', start);
                                selRange.moveEnd('character', end);
                                selRange.select();
                            } else if (element[0].setSelectionRange) {
                                element[0].setSelectionRange(start, end);
                            } else if (angular.isUndefined(element[0].selectionStart)) {
                                element[0].selectionStart = start;
                                element[0].selectionEnd = end;
                            }
                        }

                        function focusElement() {
                            element[0].focus();
                        }

                        // Overrides
                        var _init = $timepicker.init;
                        $timepicker.init = function () {
                            if (isNative && options.useNative) {
                                element.prop('type', 'time');
                                element.css('-webkit-appearance', 'textfield');
                                return;
                            } else if (isTouch) {
                                element.prop('type', 'text');
                                element.attr('readonly', 'true');
                                element.on('click', focusElement);
                            }
                            _init();
                        };
                        var _destroy = $timepicker.destroy;
                        $timepicker.destroy = function () {
                            if (isNative && options.useNative) {
                                element.off('click', focusElement);
                            }
                            _destroy();
                        };
                        var _show = $timepicker.show;
                        $timepicker.show = function () {
                            _show();
                            setTimeout(function () {
                                $timepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
                                if (options.keyboard) {
                                    element.on('keydown', $timepicker.$onKeyDown);
                                }
                            });
                        };
                        var _hide = $timepicker.hide;
                        $timepicker.hide = function (blur) {
                            $timepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
                            if (options.keyboard) {
                                element.off('keydown', $timepicker.$onKeyDown);
                            }
                            _hide(blur);
                        };
                        return $timepicker;
                    }

                    timepickerFactory.defaults = defaults;
                    return timepickerFactory;
                }
            ];
        }).directive('bsTimepicker', [
            '$window',
            '$parse',
            '$q',
            '$locale',
            'dateFilter',
            '$timepicker',
            '$dateParser',
            '$timeout',
            function ($window, $parse, $q, $locale, dateFilter, $timepicker, $dateParser, $timeout) {
                var defaults = $timepicker.defaults;
                var isNative = /(ip(a|o)d|iphone|android)/gi.test($window.navigator.userAgent);
                var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
                return {
                    restrict:'EAC',
                    require:'ngModel',
                    link:function postLink(scope, element, attr, controller) {
                        // Directive options
                        var options = {
                            scope:scope,
                            controller:controller
                        };
                        angular.forEach([
                            'placement',
                            'container',
                            'delay',
                            'trigger',
                            'keyboard',
                            'html',
                            'animation',
                            'template',
                            'autoclose',
                            'timeType',
                            'timeFormat',
                            'useNative',
                            'hourStep',
                            'minuteStep'
                        ], function (key) {
                            if (angular.isDefined(attr[key]))
                                options[key] = attr[key];
                        });
                        // Initialize timepicker
                        if (isNative && (options.useNative || defaults.useNative))
                            options.timeFormat = 'HH:mm';
                        var timepicker = $timepicker(element, controller, options);
                        options = timepicker.$options;
                        // Initialize parser
                        var dateParser = $dateParser({
                            format:options.timeFormat,
                            lang:options.lang
                        });
                        // Observe attributes for changes
                        angular.forEach([
                            'minTime',
                            'maxTime'
                        ], function (key) {
                            // console.warn('attr.$observe(%s)', key, attr[key]);
                            angular.isDefined(attr[key]) && attr.$observe(key, function (newValue) {
                                if (newValue === 'now') {
                                    timepicker.$options[key] = new Date().setFullYear(1970, 0, 1);
                                } else if (angular.isString(newValue) && newValue.match(/^".+"$/)) {
                                    timepicker.$options[key] = +new Date(newValue.substr(1, newValue.length - 2));
                                } else {
                                    timepicker.$options[key] = dateParser.parse(newValue);
                                }
                                !isNaN(timepicker.$options[key]) && timepicker.$build();
                            });
                        });
                        // Watch model for changes
                        scope.$watch(attr.ngModel, function (newValue, oldValue) {
                            // console.warn('scope.$watch(%s)', attr.ngModel, newValue, oldValue, controller.$dateValue);
                            timepicker.update(controller.$dateValue);
                        }, true);
                        // viewValue -> $parsers -> modelValue
                        controller.$parsers.unshift(function (viewValue) {
                            // console.warn('$parser("%s"): viewValue=%o', element.attr('ng-model'), viewValue);
                            // Null values should correctly reset the model value & validity
                            if (!viewValue) {
                                controller.$setValidity('date', true);
                                return;
                            }
                            var parsedTime = dateParser.parse(viewValue, controller.$dateValue);
                            if (!parsedTime || isNaN(parsedTime.getTime())) {
                                controller.$setValidity('date', false);
                            } else {
                                var isValid = parsedTime.getTime() >= options.minTime && parsedTime.getTime() <= options.maxTime;
                                controller.$setValidity('date', isValid);
                                // Only update the model when we have a valid date
                                if (isValid)
                                    controller.$dateValue = parsedTime;
                            }
                            if (options.timeType === 'string') {
                                return dateFilter(viewValue, options.timeFormat);
                            } else if (options.timeType === 'number') {
                                return controller.$dateValue.getTime();
                            } else if (options.timeType === 'iso') {
                                return controller.$dateValue.toISOString();
                            } else {
                                return new Date(controller.$dateValue);
                            }
                        });
                        // modelValue -> $formatters -> viewValue
                        controller.$formatters.push(function (modelValue) {
                            // console.warn('$formatter("%s"): modelValue=%o (%o)', element.attr('ng-model'), modelValue, typeof modelValue);
                            var date;
                            if (angular.isUndefined(modelValue) || modelValue === null) {
                                date = NaN;
                            } else if (angular.isDate(modelValue)) {
                                date = modelValue;
                            } else if (options.timeType === 'string') {
                                date = dateParser.parse(modelValue);
                            } else {
                                date = new Date(modelValue);
                            }
                            // Setup default value?
                            // if(isNaN(date.getTime())) date = new Date(new Date().setMinutes(0) + 36e5);
                            controller.$dateValue = date;
                            return controller.$dateValue;
                        });
                        // viewValue -> element
                        controller.$render = function () {
//                        console.warn('$render("%s"): viewValue=%o', element.attr('ng-model'), controller.$viewValue);
                            element.val(!controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : dateFilter(controller.$dateValue, options.timeFormat));
                        };
                        // Garbage collection
                        scope.$on('$destroy', function () {
                            timepicker.destroy();
                            options = null;
                            timepicker = null;
                        });
                    }
                };
            }
        ]);

    angular.module('mgcrea.ngStrap.tooltip', [
        'ngAnimate',
        'mgcrea.ngStrap.helpers.dimensions'
    ]).provider('$tooltip',
        function () {
            var defaults = this.defaults = {
                animation:'am-fade',
                prefixClass:'tooltip',
                prefixEvent:'tooltip',
                container:false,
                placement:'top',
                template:'tooltip/tooltip.tpl.html',
                contentTemplate:false,
                trigger:'hover focus',
                keyboard:false,
                html:false,
                show:false,
                title:'',
                type:'',
                delay:0
            };
            this.$get = [
                '$window',
                '$rootScope',
                '$compile',
                '$q',
                '$templateCache',
                '$http',
                '$animate',
                '$timeout',
                'dimensions',
                '$$rAF',
                function ($window, $rootScope, $compile, $q, $templateCache, $http, $animate, $timeout, dimensions, $$rAF) {
                    var trim = String.prototype.trim;
                    var isTouch = 'createTouch' in $window.document;
                    var htmlReplaceRegExp = /ng-bind="/gi;

                    function TooltipFactory(element, config) {
                        var $tooltip = {};
                        // Common vars
                        var options = $tooltip.$options = angular.extend({}, defaults, config);
                        $tooltip.$promise = fetchTemplate(options.template);
                        var scope = $tooltip.$scope = options.scope && options.scope.$new() || $rootScope.$new();
                        if (options.delay && angular.isString(options.delay)) {
                            options.delay = parseFloat(options.delay);
                        }
                        // Support scope as string options
                        if (options.title) {
                            $tooltip.$scope.title = options.title;
                        }
                        // Provide scope helpers
                        scope.$hide = function () {
                            scope.$$postDigest(function () {
                                $tooltip.hide();
                            });
                        };
                        scope.$show = function () {
                            scope.$$postDigest(function () {
                                $tooltip.show();
                            });
                        };
                        scope.$toggle = function () {
                            scope.$$postDigest(function () {
                                $tooltip.toggle();
                            });
                        };
                        $tooltip.$isShown = scope.$isShown = false;
                        // Private vars
                        var timeout, hoverState;
                        // Support contentTemplate option
                        if (options.contentTemplate) {
                            $tooltip.$promise = $tooltip.$promise.then(function (template) {
                                var templateEl = angular.element(template);
                                return fetchTemplate(options.contentTemplate).then(function (contentTemplate) {
                                    var contentEl = findElement('[ng-bind="content"]', templateEl[0]);
                                    if (!contentEl.length)
                                        contentEl = findElement('[ng-bind="title"]', templateEl[0]);
                                    contentEl.removeAttr('ng-bind').html(contentTemplate);
                                    return templateEl[0].outerHTML;
                                });
                            });
                        }
                        // Fetch, compile then initialize tooltip
                        var tipLinker, tipElement, tipTemplate, tipContainer;
                        $tooltip.$promise.then(function (template) {
                            if (angular.isObject(template))
                                template = template.data;
                            if (options.html)
                                template = template.replace(htmlReplaceRegExp, 'ng-bind-html="');
                            template = trim.apply(template);
                            tipTemplate = template;
                            tipLinker = $compile(template);
                            $tooltip.init();
                        });
                        $tooltip.init = function () {
                            // Options: delay
                            if (options.delay && angular.isNumber(options.delay)) {
                                options.delay = {
                                    show:options.delay,
                                    hide:options.delay
                                };
                            }
                            // Replace trigger on touch devices ?
                            // if(isTouch && options.trigger === defaults.trigger) {
                            //   options.trigger.replace(/hover/g, 'click');
                            // }
                            // Options : container
                            if (options.container === 'self') {
                                tipContainer = element;
                            } else if (options.container) {
                                tipContainer = findElement(options.container);
                            }
                            // Options: trigger
                            var triggers = options.trigger.split(' ');
                            angular.forEach(triggers, function (trigger) {
                                if (trigger === 'click') {
                                    element.on('click', $tooltip.toggle);
                                } else if (trigger == 'default') {
                                    element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enterDefaut);
                                    element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
                                    trigger !== 'hover' && element.on(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
                                } else if (trigger == 'downkey') {                  // custom trigger to handle nav-down key
                                    element.on('keydown', $tooltip.onDownKey);
                                } else if (trigger !== 'manual') {
                                    element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
                                    element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
                                    trigger !== 'hover' && element.on(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
                                }
                            });
                            // Options: show
                            if (options.show) {
                                scope.$$postDigest(function () {
                                    options.trigger === 'focus' ? element[0].focus() : $tooltip.show();
                                });
                            }
                        };
                        $tooltip.destroy = function () {
                            // Unbind events
                            var triggers = options.trigger.split(' ');
                            for (var i = triggers.length; i--;) {
                                var trigger = triggers[i];
                                if (trigger === 'click') {
                                    element.off('click', $tooltip.toggle);
                                } else if (trigger !== 'manual') {
                                    element.off(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
                                    element.off(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
                                    trigger !== 'hover' && element.off(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
                                }
                            }
                            // Remove element
                            if (tipElement) {
                                tipElement.remove();
                                tipElement = null;
                            }
                            // Destroy scope
                            scope.$destroy();
                        };
                        $tooltip.enter = function () {
                            clearTimeout(timeout);
                            hoverState = 'in';
                            // Naveen Singh start 12-05-2014  : to hide the selected tooltip option
                            if (!options.delay || !options.delay.show) {          // to hide the selected tooltip option
                                return $tooltip.show();
                            }
                            timeout = setTimeout(function () {
                                if (hoverState === 'in')
                                    $tooltip.show();
                            }, options.delay.show);
                            // Naveen Singh End
                        };

                        // enterDefaut function is created due to focus
                        $tooltip.enterDefaut = function () {
                            clearTimeout(timeout);
                            hoverState = 'in';
                            // Naveen Singh start 12-05-2014  : to hide the selected tooltip option
//                            if (!options.delay || !options.delay.show) {          // to hide the selected tooltip option
//                                return $tooltip.show();
//                            }
//                            timeout = setTimeout(function () {
//                                if (hoverState === 'in')
//                                    $tooltip.show();
//                            }, options.delay.show);
                            // Naveen Singh End
                        };
                        $tooltip.show = function () {
                            scope.$emit(options.prefixEvent + '.show.before', $tooltip);
                            var parent = options.container ? tipContainer : null;
                            var after = options.container ? null : element;
                            // Hide any existing tipElement
                            if (tipElement)
                                tipElement.remove();
                            // Fetch a cloned element linked from template
                            tipElement = $tooltip.$element = tipLinker(scope, function (clonedElement, scope) {
                            });
                            // Set the initial positioning.
                            tipElement.css({
                                top:'0px',
                                left:'0px',
                                display:'block'
                            }).addClass(options.placement);
                            // Options: animation
                            if (options.animation)
                                tipElement.addClass(options.animation);
                            // Options: type
                            if (options.type)
                                tipElement.addClass(options.prefixClass + '-' + options.type);
                            $animate.enter(tipElement, parent, after, function () {
                                scope.$emit(options.prefixEvent + '.show', $tooltip);
                            });
                            $tooltip.$isShown = scope.$isShown = true;
                            scope.$$phase || scope.$root.$$phase || scope.$digest();
                            $$rAF($tooltip.$applyPlacement);
                            // var a = bodyEl.offsetWidth + 1; ?
                            // Bind events
                            if (options.keyboard) {
                                if (options.trigger !== 'focus') {
                                    $tooltip.focus();
                                    tipElement.on('keyup', $tooltip.$onKeyUp);
                                } else {
                                    element.on('keyup', $tooltip.$onFocusKeyUp);
                                }
                            }
                        };
                        $tooltip.leave = function () {
                            clearTimeout(timeout);
                            hoverState = 'out';
                            if (!options.delay || !options.delay.hide) {
                                return $tooltip.hide();
                            }
                            timeout = setTimeout(function () {
                                if (hoverState === 'out') {
                                    $tooltip.hide();
                                }
                            }, options.delay.hide);
                        };
                        $tooltip.hide = function (blur) {
                            if (!$tooltip.$isShown)
                                return;
                            scope.$emit(options.prefixEvent + '.hide.before', $tooltip);
                            $animate.leave(tipElement, function () {
                                scope.$emit(options.prefixEvent + '.hide', $tooltip);
                            });
                            $tooltip.$isShown = scope.$isShown = false;
                            scope.$$phase || scope.$root.$$phase || scope.$digest();
                            // Unbind events
                            if (options.keyboard && tipElement !== null) {
                                tipElement.off('keyup', $tooltip.$onKeyUp);
                            }
                            // Allow to blur the input when hidden, like when pressing enter key
                            if (blur && options.trigger === 'focus') {
                                return element[0].blur();
                            }
                        };
                        $tooltip.toggle = function () {
                            $tooltip.$isShown ? $tooltip.leave() : $tooltip.enter();
                        };
                        $tooltip.onDownKey = function (evt) {
                            //function to handle nav-down key
                            if (evt.keyCode == 40 && !$tooltip.$isShown) {
                                $tooltip.enter();
                            }
                        };
                        $tooltip.focus = function () {
                            tipElement[0].focus();
                        };
                        // Protected methods
                        $tooltip.$applyPlacement = function () {
                            if (!tipElement)
                                return;
                            // Get the position of the tooltip element.
                            var elementPosition = getPosition();
                            // Get the height and width of the tooltip so we can center it.
                            var tipWidth = tipElement.prop('offsetWidth'), tipHeight = tipElement.prop('offsetHeight');
                            // Get the tooltip's top and left coordinates to center it with this directive.
                            var tipPosition = getCalculatedOffset(options.placement, elementPosition, tipWidth, tipHeight);
                            // Now set the calculated positioning.
                            tipPosition.top += 'px';
                            tipPosition.left += 'px';
                            tipPosition.maxWidth = '80%';
                            tipElement.css(tipPosition);
                        };
                        $tooltip.$onKeyUp = function (evt) {
                            evt.which === 27 && $tooltip.hide();
                        };
                        $tooltip.$onFocusKeyUp = function (evt) {
//                            evt.which === 27 && element[0].blur();   // we dont required blur on ESC key, we keep remain focus on current control
                        };
                        $tooltip.$onFocusElementMouseDown = function (evt) {
                            var triggers = options.trigger.split(' ');
                            if (triggers != "default") {
                                //To focus cursor in between text value in case of "default" trigger, we don't kill events
                                evt.preventDefault();
                                evt.stopPropagation();
                            }
//                            Some browsers do not auto-focus buttons (eg. Safari)
                            $tooltip.$isShown ? element[0].blur() : element[0].focus();
                        };
                        // Private methods
                        function getPosition() {
                            if (options.container === 'body') {
                                return dimensions.offset(element[0]);
                            } else {
                                return dimensions.position(element[0]);
                            }
                        }

                        function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
                            var offset;
                            var windowWidth = $(window).width();
                            var isDatePicker = element.context.attributes["bs-datepicker"];
                            var split = placement.split('-');
                            switch (split[0]) {
                                case 'right':
                                    offset = {
                                        top:position.top + position.height / 2 - actualHeight / 2,
                                        left:position.left + position.width
                                    };
                                    break;
                                case 'bottom':
                                    /* ashish start --> to show the drop don properly, if space is avalilable then menus show on bottom else show on top */
                                    var windowHeight = $(window).height();
                                    var posY = position.top - $(window).scrollTop();
                                    var topToSet = 0;
                                    if ((position.top + actualHeight + position.height) >= windowHeight) {
                                        topToSet = position.top - position.height - actualHeight + 15;
                                    } else {
                                        topToSet = (posY + position.height);
                                    }

                                    if (topToSet < 0) {
                                        topToSet = position.top + position.height;
                                    }
                                    /* ashish end */
                                    if (position.left + actualWidth >= windowWidth) {
                                        position.left = windowWidth - actualWidth;
                                    }

                                    if (angular.isDefined(isDatePicker)) {
                                        if ((windowHeight - position.top) < actualHeight) {
                                            topToSet = position.top - actualHeight;
                                        }
                                    }

                                    offset = {
//                                        top:position.top + position.height,
                                        top:topToSet,
                                        left:position.left + position.width / 2 - actualWidth / 2
                                    };
                                    break;
                                case 'left':
                                    offset = {
                                        top:position.top + position.height / 2 - actualHeight / 2,
                                        left:position.left - actualWidth
                                    };
                                    break;
                                default:
                                    offset = {
                                        top:position.top - actualHeight,
                                        left:position.left + position.width / 2 - actualWidth / 2
                                    };
                                    break;
                            }
                            if (!split[1]) {
                                return offset;
                            }
                            // Add support for corners @todo css
                            if (split[0] === 'top' || split[0] === 'bottom') {
                                switch (split[1]) {
                                    case 'left':
                                        offset.left = position.left;
                                        break;
                                    case 'right':
                                        offset.left = position.left + position.width - actualWidth;
                                }
                            } else if (split[0] === 'left' || split[0] === 'right') {
                                switch (split[1]) {
                                    case 'top':
                                        offset.top = position.top - actualHeight;
                                        break;
                                    case 'bottom':
                                        offset.top = position.top + position.height;
                                }
                            }
                            return offset;
                        }

                        return $tooltip;
                    }

                    // Helper functions
                    function findElement(query, element) {
                        return angular.element((element || document).querySelectorAll(query));
                    }

                    function fetchTemplate(template) {
                        return $q.when($templateCache.get(template) || $http.get(template)).then(function (res) {
                            if (angular.isObject(res)) {
                                $templateCache.put(template, res.data);
                                return res.data;
                            }
                            return res;
                        });
                    }

                    return TooltipFactory;
                }
            ];
        }).directive('bsTooltip', [
            '$window',
            '$location',
            '$sce',
            '$tooltip',
            '$$rAF',
            function ($window, $location, $sce, $tooltip, $$rAF) {
                return {
                    restrict:'EAC',
                    scope:true,
                    link:function postLink(scope, element, attr, transclusion) {
                        // Directive options
                        var options = { scope:scope };
                        angular.forEach([
                            'template',
                            'contentTemplate',
                            'placement',
                            'container',
                            'delay',
                            'trigger',
                            'keyboard',
                            'html',
                            'animation',
                            'type'
                        ], function (key) {
                            if (angular.isDefined(attr[key]))
                                options[key] = attr[key];
                        });
                        // Observe scope attributes for change
                        angular.forEach(['title'], function (key) {
                            attr[key] && attr.$observe(key, function (newValue, oldValue) {
                                scope[key] = $sce.trustAsHtml(newValue);
                                angular.isDefined(oldValue) && $$rAF(function () {
                                    tooltip && tooltip.$applyPlacement();
                                });
                            });
                        });
                        // Support scope as an object
                        attr.bsTooltip && scope.$watch(attr.bsTooltip, function (newValue, oldValue) {
                            if (angular.isObject(newValue)) {
                                angular.extend(scope, newValue);
                            } else {
                                scope.title = newValue;
                            }
                            angular.isDefined(oldValue) && $$rAF(function () {
                                tooltip && tooltip.$applyPlacement();
                            });
                        }, true);
                        // Initialize popover
                        var tooltip = $tooltip(element, options);
                        // Garbage collection
                        scope.$on('$destroy', function () {
                            tooltip.destroy();
                            options = null;
                            tooltip = null;
                        });
                    }
                };
            }
        ]);

    angular.module('mgcrea.ngStrap.typeahead', [
        'mgcrea.ngStrap.tooltip',
        'mgcrea.ngStrap.helpers.parseOptions'
    ]).provider('$typeahead',
        function () {
            var defaults = this.defaults = {
                animation:'am-fade',
                prefixClass:'typeahead',
                placement:'bottom-left',
                template:'typeahead/typeahead.tpl.html',
                trigger:'default',
                container:false,
                keyboard:true,
                html:false,
                delay:0,
                minLength:0,
                filter:'filter',
                limit:6,
                multiple:false,
                upsert:false,
                otherDisplayFields:undefined
            };
            this.$get = [
                '$window',
                '$rootScope',
                '$tooltip',
                function ($window, $rootScope, $tooltip) {
                    var bodyEl = angular.element($window.document.body);

                    function TypeaheadFactory(element, config) {
                        var $typeahead = {};
                        // Common vars
                        var options = angular.extend({}, defaults, config);
                        var controller = options.controller;
                        $typeahead = $tooltip(element, options);
                        var parentScope = config.scope;
                        var scope = $typeahead.$scope;
                        scope.$matches = [];
                        scope.$activeIndex = 0;
                        scope.$activate = function (index) {
                            scope.$$postDigest(function () {
                                $typeahead.activate(index);
                            });
                        };
                        scope.$select = function (index, evt) {
                            scope.$$postDigest(function () {
                                $typeahead.select(index);
                            });
                        };
                        scope.$isVisible = function () {
                            return $typeahead.$isVisible();
                        };
                        // Public methods


                        /*Naveen start -->  on every key down we need to show options if options is not visible*/
                        $typeahead.$typeheadOptionsVisibility = false;
                        /*Naveen ends*/


                        $typeahead.update = function (matches) {
                            scope.$matches = matches;
                            if (scope.$activeIndex >= matches.length) {
                                scope.$activeIndex = 0;
                            }
                        };
                        $typeahead.activate = function (index) {
                            scope.$activeIndex = index;
                        };
                        $typeahead.select = function (index) {
                            var value = scope.$matches[index].value;
                            if (value == "No Data Found") {
                                $typeahead.hide();
                                return;
                            }
                            if (controller) {
                                if (options.multiple) {
                                    controller.$modelValue = controller.$modelValue || [];
                                    for (var i = 0; i < controller.$modelValue.length; i++) {
                                        var obj = controller.$modelValue[i];
                                        if (controller.$modelValue[i] == value) {
                                            alert('Error: Duplicate value is not allowed in multiple >>>>>>>');
                                            $typeahead.hide();
                                            return undefined;
                                        }

                                    }
                                    controller.$modelValue.push(value);
                                    controller.$setViewValue(controller.$modelValue.map(function (index) {
                                        return index;
                                    }));
                                    element.val('');
                                    /* ashish end*/
                                } else {
                                    controller.$setViewValue(value);
                                    scope.$activeIndex = 0;
                                }
                                if (!scope.$$phase) {
                                    scope.$apply();
                                }
                                /* ashish end for multiple value select*/
                                controller.$render();
                                if (parentScope)
                                    parentScope.$digest();
                            }
                            if (options.trigger === 'default') {
                                /*Naveen Start --> we remove blur event bcz due to this we lost focus issue and hide will be called for hide the pop up*/
                                $typeahead.hide();
//                                element[0].blur();
                                /*Naveen end*/
                            } else if ($typeahead.$isShown)
                                $typeahead.hide();

                            // Emit event
                            scope.$emit('$typeahead.select', value, index);
                        };
                        // Protected methods
                        $typeahead.$isVisible = function () {
                            if (!options.minLength || !controller) {
                                return !!scope.$matches.length;
                            }
                            // minLength support
                            return scope.$matches.length && angular.isString(controller.$viewValue) && controller.$viewValue.length >= options.minLength;
                        };
                        $typeahead.$getIndex = function (value) {
                            var l = scope.$matches.length, i = l;
                            if (!l)
                                return;
                            for (i = l; i--;) {
                                if (scope.$matches[i].value === value)
                                    break;
                            }
                            if (i < 0)
                                return;
                            return i;
                        };
                        $typeahead.$onMouseDown = function (evt) {
                            // Prevent blur on mousedown
                            evt.preventDefault();
                            evt.stopPropagation();
                        };
                        $typeahead.$onKeyDown = function (evt) {
                            /* ashish start --> show the drop down properly if space is avalibale show on bottom else on top*/
                            if ($typeahead.$element) {
                                setTimeout(function () {
                                    $typeahead.$applyPlacement();
                                }, 100)
                            }
                            /* ashish end */
                            if (!/(38|40|13|27)/.test(evt.keyCode))
                                return;

                            evt.preventDefault();
                            evt.stopPropagation();
                            // Select with enter
                            if (evt.keyCode === 27) {
                                return $typeahead.hide();
                            }
                            if (evt.keyCode === 13 && scope.$matches.length) {
                                return $typeahead.select(scope.$activeIndex);
                            }
                            // Navigate with keyboard
                            if (evt.keyCode === 38) {
                                /* Ashish start for scrolling the scroll bar */
                                var liElement = $typeahead.$element.find('li');
                                var active = angular.element(liElement[scope.$activeIndex])
                                    , prev = active.prev()

                                var ulHeight = $typeahead.$element.height();
                                var ulTop = $typeahead.$element.scrollTop();
                                var activeLiTop = angular.element(active).position().top;
                                var liHeight = $typeahead.$element.find('li').height();


                                if (!prev.length && liElement && liElement.length > 0) {
                                    $typeahead.$element.scrollTop(angular.element($typeahead.$element.find('li').last()).position().top);
                                    scope.$activeIndex = liElement.length;
                                } else {
                                    activeLiTop = prev.position().top;
                                    if (activeLiTop < 0) {
                                        var setScrollTop = ulTop - liHeight;
                                        $typeahead.$element.scrollTop(setScrollTop);
                                    }
                                }
                                /* Ashish end for scrolling the scroll bar */
                                scope.$activeIndex--;
                            } else if (evt.keyCode === 40) {
                                /* Ashish start for scrolling the scroll bar */
                                var liElement = $typeahead.$element.find('li');
                                var active = angular.element(liElement[scope.$activeIndex])
                                    , next = active.next()
                                var ulHeight = $typeahead.$element.height();
                                var ulTop = $typeahead.$element.scrollTop();
                                var activeLiTop = angular.element(active).position().top;
                                var liHeight = $typeahead.$element.find('li').height();
                                if (!next.length) {

                                    $typeahead.$element.scrollTop(0);
                                    scope.$activeIndex = -1;
                                } else {
                                    if ((activeLiTop + liHeight) > ulHeight) {
                                        var setScrollTop = ulTop + liHeight;
                                        $typeahead.$element.scrollTop(setScrollTop);
                                    }
                                }
                                /* Ashish end for scrolling the scroll bar */
                                scope.$activeIndex++;
                            } else if (angular.isUndefined(scope.$activeIndex))
                                scope.$activeIndex = 0;
                            scope.$digest();
                        };
                        // Overrides
                        var show = $typeahead.show;
                        $typeahead.show = function () {
                            scope.$activeIndex = 0;
                            show();
                            $typeahead.$typeheadOptionsVisibility = true;
                            setTimeout(function () {
                                $typeahead.$element.on('mousedown', $typeahead.$onMouseDown);
                                if (options.keyboard) {
                                    element.on('keydown', $typeahead.$onKeyDown);
                                }
                            });
                        };
                        var hide = $typeahead.hide;
                        $typeahead.hide = function () {
                            if (!$typeahead.$element) return;
                            $typeahead.$element.off('mousedown', $typeahead.$onMouseDown);
                            if (options.keyboard) {
                                element.off('keydown', $typeahead.$onKeyDown);
                            }
                            hide();
                            $typeahead.$typeheadOptionsVisibility = false;
                        };
                        return $typeahead;
                    }

                    TypeaheadFactory.defaults = defaults;
                    return TypeaheadFactory;
                }
            ];
        }).directive('bsTypeahead', [
            '$window',
            '$parse',
            '$q',
            '$typeahead',
            '$parseOptions',
            '$http',
            function ($window, $parse, $q, $typeahead, $parseOptions, $http) {
                var defaults = $typeahead.defaults;
                return {
                    restrict:'EAC',
                    require:'ngModel',
                    link:function postLink(scope, element, attr, controller) {
                        // Directive options
                        var options = {
                            scope:scope,
                            controller:controller
                        };
                        angular.forEach([
                            'placement',
                            'container',
                            'delay',
                            'trigger',
                            'keyboard',
                            'html',
                            'animation',
                            'template',
                            'filter',
                            'limit',
                            'minLength',
                            'multiple',
                            'upsert',
                            'otherDisplayFields'
                        ], function (key) {
                            if (angular.isDefined(attr[key]))
                                options[key] = attr[key];
                        });

                        // Build proper ngOptions
                        var filter = options.filter || defaults.filter;

//                    var limit = options.limit || defaults.limit;
                        var ngOptions = attr.ngOptions;
                        if (filter)
                            ngOptions += ' | ' + filter + ':$viewValue';
//                    if (limit)
//                        ngOptions += ' | limitTo:' + limit;
                        var parsedOptions = $parseOptions(ngOptions);
                        // Initialize typeahead
                        /*rohit Start*/
                        element.unbind("input").unbind("keydown").unbind("change");
                        /*rohit end*/
                        var typeahead = $typeahead(element, options);
                        // if(!dump) var dump = console.error.bind(console);
                        // Watch model for changes
                        /*rohit Start*/
                        element.bind("keyup", function (evt) {
                            if (evt.keyCode == 13 || evt.keyCode == 37 || evt.keyCode == 38 || evt.keyCode == 39 || evt.keyCode == 27 | evt.keyCode == 9 || evt.keyCode == 16) {
                                return; // 9 and 16 required to keep the options hide during tab-traversing
                            }
                            if (evt.keyCode == 40 && typeahead.$typeheadOptionsVisibility) {
                                return
                            }
                            handleChange(element.val());
                            if (!typeahead.$typeheadOptionsVisibility) {
                                typeahead.show();
                            }
                        });


                        /* ashish start */
//                    $aplly --> value not changed on grid when value select from form
                        element.bind("blur", function () {
                            if (controller.$modelValue === controller.$viewValue) {
                                //do nothing
                            } else {
                                //value are not same, we need to change model value
                                if (!options.multiple && (controller.$viewValue === undefined || controller.$viewValue === "")) {
                                    controller.$setViewValue(undefined);
                                } else if (angular.isDefined(options.upsert) && options.upsert !== "undefined") {
                                    var displayField = options.upsert;
                                    var elementValue = undefined;
                                    if (options.upsert == "") {
                                        elementValue = element.val();
                                    } else {
                                        elementValue = {};
                                        if (options.otherDisplayFields && options.otherDisplayFields != "undefined") {
                                            var otherValues = element.val().split('|');
                                            var otherFields = options.otherDisplayFields.split(',');
                                            for (var i = 0; i < otherValues.length; i++) {
                                                var otherDisplayField = otherValues[i].trim();
                                                if (i == 0) {
                                                    elementValue[displayField] = otherDisplayField;
                                                    continue;
                                                }
                                                if (otherFields[i - 1]) {
                                                    elementValue[otherFields[i - 1]] = otherDisplayField;
                                                }
                                            }
                                        } else {
                                            elementValue[displayField] = element.val();
                                        }
                                    }
                                    if (options.multiple) {
                                        if (options.multiple) {
                                            controller.$modelValue = controller.$modelValue || [];
                                            for (var i = 0; i < controller.$modelValue.length; i++) {
                                                var obj = controller.$modelValue[i];
                                                if (controller.$modelValue[i] == elementValue) {
                                                    alert('Error: Duplicate value is not allowed in multiple >>>>>>>');
                                                    $typeahead.hide();
                                                    return undefined;
                                                }

                                            }
                                            controller.$modelValue.push(elementValue);
                                            controller.$setViewValue(controller.$modelValue.map(function (index) {
                                                return index;
                                            }));
                                            element.val('');
                                            /* ashish end*/
                                        }
                                    } else {
                                        controller.$setViewValue(elementValue);
                                    }

                                } else if (options.multiple && angular.isDefined(controller.$modelValue)) {
                                    element.val("");
                                } else {
                                    for (var key in controller.$modelValue) {
                                        if (controller.$modelValue[key] == controller.$viewValue) {
                                            return;
                                        }
                                    }
                                    element.val("");
                                    controller.$setViewValue(undefined);
                                }


                            }
//                        if (ngOptions) {
//                            var matches = typeahead.$scope.$matches;
//                            var splitValue = ngOptions.split(" ");
//                            var elementValue = element.val();
//
////                            if (matches && matches.length > 0) {
////                                for (var i = 0; i < matches.length; i++) {
////                                    var match = matches[i];
////                                    if (match.label == elementValue) {
////                                        if (!scope.$$phase) {
////                                            scope.$apply();
////                                        }
////                                        return;
////                                    }
////                                }
////                            }
//
//                            if (splitValue && splitValue.length > 0) {
//                                if (elementValue.toString().trim().length == 0) {
//                                    if (!options.multiple) {
//                                        controller.$setViewValue(undefined);
//
//                                    }
////                                    return;
//                                }
//
//
//
////                                var firstValue = splitValue[0];
////                                var secondValue = splitValue[2];
////                                if (angular.isDefined(firstValue) && angular.isDefined(secondValue)) {
////                                    if (angular.equals(firstValue, secondValue)) { // case of string
////                                        setValueInModelOnBlur(elementValue);
////                                    } else { // case of object
////                                        var dotIndex = secondValue.indexOf('.');
////                                        if (dotIndex >= 0) {
////                                            var displayField = secondValue.substring(dotIndex + 1);
////                                            var obj = {};
////                                            obj[displayField] = elementValue;
////                                            setValueInModelOnBlur(obj);
////                                        }
////                                    }
////                                }
//                            }
//                        }


                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                        /* ashish end*/

                        var nextElement = element.next();
                        nextElement.bind('mousedown', function (event) {
                            controller.$fetchAllData = true;
                            handleChange(element.val());
                            typeahead.show();                          // to show the all available options
                            controller.$fetchAllData = false;
                            scope.$activeIndex = 0;
                            setTimeout(function () {
                                typeahead.$applyPlacement();
                            }, 0)
                            element.focus();                           // to set focus on input element
                            event.preventDefault();
                            event.stopPropagation();
                        });

                        function setValueInModelOnBlur(value) {
                            if (options.multiple) {
                                controller.$modelValue = controller.$modelValue || [];
                                controller.$modelValue.push(value);
                                controller.$setViewValue(controller.$modelValue.map(function (index) {
                                    return index;
                                }));
                            } else {
                                controller.$setViewValue(value);
                            }

                        }


                        function handleChange(newValue) {
//                        scope.$modelValue = newValue;
                            controller.$viewValue = newValue;
                            //Set model value on the scope to custom templates can use it.
                            scope.loadingImage = true;

                            parsedOptions.valuesFnApplane(scope, controller, options).then(function (values) {

//                            if (values.length > limit)
//                                values = values.slice(0, limit);
                                // if(matches.length === 1 && matches[0].value === newValue) return;
                                if (values && values.length == 0) {
                                    values.push({label:"No Data Found", value:"No Data Found"});
                                }
                                if (values) {
                                    scope.loadingImage = false; //loading messge should remove only when data comes, if undefined comes,then we will not remove
                                    typeahead.update(values);
                                }
                                // Queue a new rendering that will leverage collection loading
//                            controller.$render();    // TODO: need to comment due to value get updated during typing
                                //Naveen SIngh Start: to populate tooltip after data comes form server
                                if (typeahead.$element) {
                                    setTimeout(function () {
                                        typeahead.$applyPlacement();
                                    }, 0)
                                }

                            });
                            if (!scope.$$phase) {
                                scope.$apply();
                            }

                        }

                        scope.$watch(attr.ngModel, function (newValue, oldValue) {
//                        handleChange(element.val());
                        });
                        /*rohit end*/
                        // Model rendering in view
                        controller.$render = function () {
                            // console.warn('$render', element.attr('ng-model'), 'controller.$modelValue', typeof controller.$modelValue, controller.$modelValue, 'controller.$viewValue', typeof controller.$viewValue, controller.$viewValue);
                            controller.$viewValue = controller.$modelValue;
                            if (options && !options.multiple) {
                                if (controller.$isEmpty(controller.$viewValue))
                                    return element.val('');
//                            var index = typeahead.$getIndex(controller.$modelValue);    // to remove the input value with backspace we need to pass input value instead of $modelValue
                                var inputElementValue = element[0].value;
//                            var index = typeahead.$getIndex(inputElementValue);
//                            var selected = angular.isDefined(index) ? typeahead.$scope.$matches[index].label : controller.$viewValue;
                                var selected = controller.$viewValue;
                                if (angular.isDefined(selected) && angular.isObject(selected)) {
                                    selected = getSelectedValue(selected);
                                }
                                if (angular.isDefined(selected) && selected !== null) {
                                    element.val(selected.replace(/<(?:.|\n)*?>/gm, '').trim());
                                }

                            }

                        };


                        /* for handle display expression [ashish start] */
                        function getSelectedValue(value) {
                            var selectedValue = parsedOptions.getParseValue(value, options, true);
                            if (selectedValue && selectedValue.length > 0) {
                                value = selectedValue[0].label;
                            }
                            return value;
                        }

                        /* [ashish end] */

                        // Garbage collection
                        scope.$on('$destroy', function () {
                            typeahead.destroy();
                            options = null;
                            typeahead = null;
                        });
                    }
                };
            }
        ]);

// tpl section:- it contains html for above modules
    angular.module('mgcrea.ngStrap.datepicker').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('datepicker/datepicker.tpl.html', '<div class="dropdown-menu datepicker" ng-class="\'datepicker-mode-\' + $mode" style="max-width: 320px"><table style="table-layout: fixed; height: 100%; width: 100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$selectPane(-1, $event)"><i class="icon-chevron-left"></i></button></th><th colspan="{{ rows[0].length - 2 }}"><button tabindex="-1" type="button" class="btn btn-default btn-block text-strong" ng-click="$toggleMode($event)"><strong style="text-transform: capitalize" ng-bind="title"></strong></button></th><th><button tabindex="-1" type="button" class="btn btn-default pull-right" ng-click="$selectPane(+1, $event)"><i class="icon-chevron-right"></i></button></th></tr><tr ng-show="labels" ng-bind-html="labels"></tr></thead><tbody><tr ng-repeat="(i, row) in rows" height="{{ 100 / rows.length }}%"><td class="text-center" ng-repeat="(j, el) in row"><button tabindex="-1" type="button" class="btn btn-default" style="width: 100%" ng-class="{\'btn-primary\': el.selected}" ng-click="$select(el.date,$event)" ng-disabled="el.disabled"><span ng-class="{\'text-muted\': el.muted}" ng-bind="el.label"></span></button></td></tr></tbody></table></div>');
        }
    ]);

    angular.module('mgcrea.ngStrap.timepicker').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('timepicker/timepicker.tpl.html', '<div class="dropdown-menu timepicker" style="min-width: 0px;width: auto; padding: 10px;"><table height="100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(-1, 0, $event)">  <i class="icon-chevron-up"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(-1, 1, $event)"><i class="icon-chevron-up"></i></button></th></tr></thead><tbody><tr ng-repeat="(i, row) in rows"><td class="text-center"><button tabindex="-1" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[0].selected}" ng-click="$select(row[0].date, 0, $event)" ng-disabled="row[0].disabled"><span ng-class="{\'text-muted\': row[0].muted}" ng-bind="row[0].label"></span></button></td><td><span ng-bind="i == midIndex ? \':\' : \' \'"></span></td><td class="text-center"><button tabindex="-1" ng-if="row[1].date" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[1].selected}" ng-click="$select(row[1].date, 1, $event)" ng-disabled="row[1].disabled"><span ng-class="{\'text-muted\': row[1].muted}" ng-bind="row[1].label"></span></button></td><td ng-if="showAM">&nbsp;</td><td ng-if="showAM"><button tabindex="-1" ng-show="i == midIndex - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !!isAM}" class="btn btn-default" ng-click="$switchMeridian($event)" ng-disabled="el.disabled">AM</button> <button tabindex="-1" ng-show="i == midIndex + 1 - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !isAM}" class="btn btn-default" ng-click="$switchMeridian($event)" ng-disabled="el.disabled">PM</button></td></tr></tbody><tfoot><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(1, 0, $event)"><i class="icon-chevron-down"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(1, 1,$event)"><i class="icon-chevron-down"></i></button></th></tr></tfoot></table></div>');
        }
    ]);

    angular.module('mgcrea.ngStrap.tooltip').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('tooltip/tooltip.tpl.html', '<div class="tooltip in" ng-show="title"><div class="tooltip-arrow"></div><div class="tooltip-inner" ng-bind="title"></div></div>');
        }
    ]);

    angular.module('mgcrea.ngStrap.typeahead').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('typeahead/typeahead.tpl.html',
                    '   <ul tabindex="-1" style="max-height:150px;overflow: auto;" class="typeahead dropdown-menu" ng-show="$isVisible()" role="select">' +
                    '      <li role="presentation" ng-repeat="match in $matches" ng-class="{active: $index == $activeIndex}">' +
                    '         <a role="menuitem" tabindex="-1" ng-click="$select($index, $event)" title="{{match.label}}" class="pl-tooltip-options" ng-bind-html="match.label"></a>' +
                    '      </li>' +
                    '   </ul>');
        }
    ]);

})(window, document);