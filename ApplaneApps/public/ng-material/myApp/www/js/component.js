var pl = (pl === undefined) ? angular.module('starter.controllers', ['ngMaterial', 'ngMessages']) : pl;

pl.directive('plQview', ['$compile', function ($compile) {
    return {
        restrict: 'E',
        replace: true,
        compile: function () {
            return {
                post: function ($scope, iElement, attrs) {
                    $scope.view = $scope.workbenchOptions.currentView;
                    var template = '<pl-view></pl-view>';
                    iElement.append($compile(template)($scope));

                }
            }
        }
    }
}]);

pl.directive('plChildview', ['$compile', function($compile){
    return{
        restrict:'E',
        replace:true,
        compile:function(){
            return{
                post:function($scope, iElement){
                    $scope.view =  $scope.workbenchOptions.currentView;
                    delete $scope.workbenchOptions.currentView;
                    iElement.append($compile('<pl-view></pl-view>')($scope));
                }
            }
        }
    }
}])

pl.directive('tmGrid', ['$compile', function ($compile) {
    return{
        restrict: 'EAC',
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, elm) {

                },
                post: function ($scope, elm) {
                    $scope.toggleActions = function (index) {
                        for (var i = 0; i < $scope.gridOptions.data.length; i++) {
                            if (index == i) {
                                $scope.gridOptions.data[index].showActions = !$scope.gridOptions.data[index].showActions;
                            } else {
                                $scope.gridOptions.data[i].showActions = false;
                            }
                        }
                    }

                    var template = '<div ng-repeat="row in gridOptions.data" >' +
                        '           <div class="item item-right-avatar" ng-class="{\'item-avatar\':row.userImage}" ng-click="toggleActions($index)">' +
                        '           <img ng-src="row.userImage" ng-if="row.userImage" ng-click="#/app/detail/:{{$index}}"  />' +
                        $scope.gridOptions.responsiveColTemplate +
                        '           <span></span>' +
                        '           </div>' +
                        '           <div class="action-container" ng-class="{\'activated\':row.showActions}">' +
                        '               <a style="flex: 1;" ng-repeat="action in gridOptions.actions" ng-bind="action.label"></a>' +
                        '           </div>' +
                        '           </div>';
//                    var template = '<ion-list show-delete="shouldShowDelete" show-reorder="shouldShowReorder" ccan-swipe="listCanSwipe">'+
//                        '<ion-item ng-repeat="row in gridOptions.data" ng-class="{\'item-thumbnail-left\':row.userImage}"  class="">'+
//                        '    <img ng-if="row.userImage" ng-src="{{row.userImage}}" /> '+
//                                $scope.gridOptions.responsiveColTemplate+
//                        '       <ion-option-button class="button-positive"'+
//                        '        ng-click="share(row)">'+
//                        '        Share'+
//                        '        </ion-option-button>'+
//                        '        <ion-option-button class="button-info"'+
//                        '        ng-click="edit(row)">'+
//                        '        Edit'+
//                       '         </ion-option-button>'+
//                        '        <ion-delete-button class="ion-minus-circled"'+
//                        '        ng-click="row.splice($index, 1)">'+
//                        '        </ion-delete-button>'+
//                        '        <ion-reorder-button class="ion-navicon"'+
//                        '        on-reorder="reorderItem(row, $fromIndex, $toIndex)">'+
//                        '        </ion-reorder-button>'+
//
//                        '    </ion-item>'+
//                        '</ion-list>'+
                    console.log(template);
                    elm.append($compile(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('tmList', ['$compile', function ($compile) {
    return{
        restrict: 'AE',
        replace: true,
        compile: function () {
            return{
                pre: function () {

                },
                post: function ($scope, elm, atts) {
                    var template = '<ion-view title="Menus">' +
                        '    <ion-nav-buttons side="left">' +
                        '    <div class="bar-header">' +
                        '        <button menu-toggle="left" class="button button-icon icon ion-navicon"></button>' +
                        '        <div class="h1 title"></div>' +
                        '    </div>' +

                        '    </ion-nav-buttons>' +
                        '<ion-content class="has-header">' +
                        '    <ion-refresher pulling-text="Pull to refresh..." on-refresh="doRefresh()">' +
                        '    </ion-refresher>' +
                        '    <ion-list>' +
                        '        <ion-item nav-clear menu-close ng-repeat="menu in workbenchOptions.menus" class="item item-icon-left" ng-click="">' +
                        '{{menu.label}}' +
                        '        </ion-item>' +
                        '    </ion-list>' +
                        '</ion-content>' +
                        '<div class="list" style="position: absolute; right: 10px; bottom: 10px;">' +
                        '    <md-button ng-click="createNewTask()" class="md-fab md-primary">+</md-button>' +
                        '    </div>' +
                        '</ion-view>';
                    elm.append($compile(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('tmActionList', ['$compile', function ($compile) {
    return{
        restrict: 'E',
        replace: true,
        link: function ($scope, elm) {
            var tamplate = '<div class="action-strip" style="display: flex;height: 0;-webkit-transform-origin: left top;transition: all cubic-bezier(0.25, 0.8, 0.25, 1) 0.25s;overflow: hidden">' +
                '               <span style="flex: 1;" ng-repeat="action in gridOptions.actions" ng-bind="action.label"></span>' +
                '           </div>';
            elm.append($compile(tamplate)($scope));
            elm.bind('click', function () {
                elm.css({'height': '40px'})
            });
        }
    }
}]);

pl.directive('fmEmoticon', ['$compile', function ($compile) {
    return{
        restrict: 'EAC',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    if (attrs.emoticon == 5) {
                        iElement.addClass('exc');
                    } else if (attrs.emoticon == 4) {
                        iElement.addClass('gd');
                    } else if (attrs.emoticon == 3) {
                        iElement.addClass('okk');
                    } else if (attrs.emoticon == 2) {
                        iElement.addClass('bad');
                    } else if (attrs.emoticon == 1) {
                        iElement.addClass('worts');
                    }
                }
            }
        }
    }
}]);

pl.directive('fmMoment', ['$compile', '$timeout', function ($compile, $timeout) {
    return{
        restrict: 'EAC',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    $timeout(function () {
                        var bindTo = attrs.bind;
                        var filterFormat = 'dd MMM';
                        if (!$scope[attrs.parentScope]) {
                            return;
                        }
                        if ($scope[attrs.parentScope][attrs.bind]) {
                            var currentDate = new Date();
                            if (currentDate.getDate() == new Date($scope[attrs.parentScope][attrs.bind]).getDate()) {
                                filterFormat = 'shortTime';
                            }
                        }
                        var template = '<span ng-bind="' + attrs.parentScope + '.' + attrs.bind + ' | date: \'' + filterFormat + '\'"></span>';
                        iElement.append(($compile)(template)($scope));
                    }, 100)

                }
            }
        }
    }
}]);

pl.directive('slideable', function () {
    return {
        restrict: 'C',
        compile: function (element, attr) {
            // wrap tag
            var contents = element.html();
            element.html('<div class="slideable_content" style="margin:0 !important; padding:0 !important" >' + contents + '</div>');

            return function postLink(scope, element, attrs) {
                // default properties
                attrs.duration = (!attrs.duration) ? '0.2s' : attrs.duration;
                attrs.easing = (!attrs.easing) ? 'ease-in-out' : attrs.easing;
                element.css({
                    'overflow': 'hidden',
                    'height': '0px',
                    'transitionProperty': 'height',
                    'transitionDuration': attrs.duration,
                    'transitionTimingFunction': attrs.easing
                });
            };
        }
    };
})

pl.directive('slideToggle', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var target = document.querySelector(attrs.slideToggle);
            attrs.expanded = false;
            element.bind('click', function () {
                var target = document.querySelector(attrs.slideToggle);
                var content = target.querySelector('.slideable_content');
                if (!attrs.expanded) {
                    content.style.border = '1px solid rgba(0,0,0,0)';
                    var y = content.clientHeight;
                    content.style.border = 0;
                    target.style.height = y + 'px';
                } else {
                    target.style.height = '0px';
                }
                attrs.expanded = !attrs.expanded;
            });
        }
    }
});

pl.directive('fmLoading', ['$compile', function ($compile) {
    return{
        restrict: "E",
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    var template = '<div ng-show="processed" class="show-ionicon">' +
                        '               <div class="inner-show">' +
                        '                  <i class="ion-loading-c"></i>' +
                        '               </div>' +
                        '           </div>';
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('customInput', ['$compile', function ($compile) {
    return {
        restrict: "E",
        replace: true,
        scope: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var template = '<md-input-container ng-class="mdContainerClass" class="md-default-theme ">' +
                        '               <label ng-bind="column.field" style="order: 1;">' +
                        '               </label>' +
                        '               <input type="text" ng-class="inputClass" ng-Focus="inputGetFocused()" ng-Blur="inputGetBlurred()" ng-model="formOptions.data[column.field]" class="md-input ">' +
                        '               </input>' +
                        '           </md-input-container>';
                    iElement.append(($compile)(template)($scope));

                    $scope.mdContainerClass = "md-input-focused md-input-has-value";
                    $scope.inputGetFocused = function () {
                        $scope.mdContainerClass = "md-input-focused md-input-has-value";
                        $scope.inputClass = "borderBottomColor";

                    }
                    $scope.inputGetBlurred = function () {
                        $scope.inputClass = "";
                        if ($scope.formOptions !== undefined && $scope.formOptions.data !== undefined && $scope.column !== undefined && $scope.column.field !== undefined) {
                            if ($scope.formOptions.data[$scope.column.field] == '') {
                                $scope.mdContainerClass = "";
                            }
                        }
                    }
                }
            }
        }
    }
}]);
