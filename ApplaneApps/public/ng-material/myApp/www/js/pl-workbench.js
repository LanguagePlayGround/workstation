/***** move to app-workbench.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('starter.controllers', ['ngMaterial', 'ngMessages']) : pl;

pl.directive('plWorkbench', ["$compile", '$timeout', function ($compile, $timeout) {
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return {

                pre: function ($scope, iElement, attrs) {
                    function getToken() {
                        var urlParams;
                        var match,
                            pl = /\+/g, // Regex for replacing addition symbol with a space
                            search = /([^&=]+)=?([^&]*)/g,
                            decode = function (s) {
                                return decodeURIComponent(s.replace(pl, " "));
                            },
                            query = window.location.search.substring(1);
                        urlParams = {};
                        while (match = search.exec(query))
                            urlParams[decode(match[1])] = decode(match[2]);

                        return urlParams;
                    }

                    var workbenchOptions = $scope.$eval(attrs.plWorkbench);
                    $scope.crmThemes = getToken();
                    $scope.toggleAppMenu = function ($event, menu, menus) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        menu.open = !menu.open;
                        if (menu && menu.menus && menu._id) {
                            if (menu.isApplication) {
                                menu.uiMenus = menu.uiMenus || menu.menus;                                              // uiMenus will be used to bind with the current active application's menus
                            }
                            $timeout(function () {
                                for (var i = 0; i < menus.length; i++) {
                                    if (menus[i]._id == menu._id) {
                                        $("#" + menu._id).slideToggle('fast');
                                    } else {
                                        menus[i].open = false;
                                        $("#" + menus[i]._id).slideUp('fast');
                                    }
                                }
                            }, 10)

                        } else {
                            $scope.workbenchOptions.enableSliderMenu = undefined;
                            $scope.onApplicationMenuClick(menu);
                            $scope.removeSlideMenu(0);                                                                  //to remove the slide menu without waiting for transition completion.
                        }

                    }

                    $scope.$watch('workbenchOptions.enableSliderMenu', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && newValue == undefined) {
                            $scope.removeSlideMenu(300);                                                                //to wait for 300ms to complete the transition effect on slid menu.
                        }
                    });
                    $scope.removeSlideMenu = function (time) {
                        for (var i = 0; i < $scope.workbenchOptions.applications.length; i++) {
                            var app = $scope.workbenchOptions.applications[i];
                            if (app._id == $scope.workbenchOptions.selectedApplication) {
                                continue;
                            }
                            if (app.uiMenus) {
                                app.uiMenus = undefined;
                            }
                        }
                        var sliderWrapper = document.getElementsByClassName('pl-pageslide-wrapper');
                        $timeout(function () {
                            angular.element(sliderWrapper).html('');
                        }, time);

                    }
                    $scope.toggleSideMenu = function ($event) {
                        var slidingArea = document.getElementById('slideMenu');
                        var html = '<pl-slide-menu></pl-slide-menu>';
                        angular.element(slidingArea).html(($compile)(html)($scope));
                        setTimeout(function () {
                            $scope.workbenchOptions.enableSliderMenu = true;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }, 0);

                    }
                    $scope.handleConfirmationActions = function (option) {
                        $scope.workbenchOptions.confirmMessageOptions.callback({"option": option.label});
                        delete $scope.workbenchOptions.confirmMessageOptions.callback;
                    }
                    var userDB = ApplaneDB.connection("userdb");
                    var token = userDB.token;

                    var template = "" +
                        "<section class='app-position-absolute app-top-position-zero app-left-position-zero app-right-position-zero app-bottom-position-zero' ng-class='{\"" + $scope.crmThemes.theme + "\":crmThemes.theme}'>" +
                        "       <header>" +
                        "        <div class='app-position-absolute app-top-position-zero app-left-position-zero app-right-position-zero applane-header'>" +
                        "          <div class='app-header'>" +
//                        "           <div class='applane-logo'></div>" +
                        "           <a class='white-menu' ng-click='toggleSideMenu($event)'><em></em><em></em><em></em></a>" +
                        "               <div class='bread-crumb'>" +
                        "                   <span class='pl-top-app-menu app-position-relative' style='margin-top: 15px;' ng-repeat='breabcrumbInfo in workbenchOptions.selectedMenuInfo'>" +
                        "                       <pl-breadcrumb-menu breadcrumb='breabcrumbInfo'></pl-breadcrumb-menu>" +
                        "                   </span>" +
                        "               </div>" +
                        '               <div id="slideMenu">' +
                        '           </div>' +
                        "           <article>" +
                        "               <div ng-show='workbenchOptions.developmentRight'  pl-menu-group = 'workbenchOptions.applicationSettingGroup' class=' pl-applications-setting' ></div>" +
                        "           </article>" +
                        "           <article class='usermenu slh'>" +
                        "               <div ng-if='!workbenchOptions.userIcon' class='app-float-left'><img class='app-menu-user defaultUser' /> </div>" +
                        "               <div ng-if='workbenchOptions.userIcon' class='app-float-left'><img class='app-menu-user' ng-src='/rest/file/download?token=" + token + "&filekey={{workbenchOptions.userIcon.key}}' /></div>" +
                        "               <div pl-menu-group='workbenchOptions.userMenuGroup'></div>" +
                        "               </article>" +
                        "           <article ng-show='workbenchOptions.showGoolgeIcon'><div class='usermenu google' ng-click='googlePlusLogin()' title='To Activate Your Goolge Email Tracking and Calender Setting'><i class='icon-google-plus-sign'></i></div></article>" +
                        "           <article ng-show='workbenchOptions.orgName'><div class='usermenu slh app-position-relative' ><span ng-bind='workbenchOptions.orgName'></span><span class='pipe-seperator'>|</span></div></article>" +
                        "           <article  ng-show='workbenchOptions.showRenderTime'>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalRenderTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.gridRenderTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalServerTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalResponseTime'></div>" +
//                        "               <div class='usermenu slh' ng-bind='workbenchOptions.totalJSTime'></div>" +
                        "           </article>" +
                        "           <article><div ng-show='workbenchOptions.processGroup.showProcess' class='usermenu' pl-menu-group='workbenchOptions.processGroup'></div></article>" +
                        "        <div class='top-search'></div>" +
                        "       </div>" +
                        "    </div>" +
                        "   </header>     " +
                        "   <article>" +
                        "        <div id='view' class='app-position-absolute' style='top:48px;left:0px;right:0px;bottom: 0px;'>" +
                        "            <div pl-view ng-repeat='view in workbenchOptions.views' ng-controller='ViewCtrl' class='app-position-absolute pl-view app-overflow-hiiden app-white-backgroud-color' ng-class='view.viewOptions.viewClass' ng-style='view.viewOptions.style'></div>" +
                        "        </div>" +
                        "   </article>" +
                        "</section>" +

                        "<aside>" +
                        "<div class='app-position-absolute pl-popup-background' ng-style='workbenchOptions.popupViewsStyle' style='top:0px;bottom:0px;right:0px;left:0px;visibility: hidden'>" +
                        "   <div class='popupwrapper app-overflow-auto app-pop-up-view app-mediumn-font' pl-view ng-repeat='view in workbenchOptions.popupViews' ng-class='view.viewOptions.viewClass' ng-controller='ViewCtrl' ng-style='view.viewOptions.popupStyle'></div> " +
                        "</div>" +
                        "</aside>" +

                        "<aside>" +
                        "    <div class='app-busy-message-container-false' ng-show='workbenchOptions.shortMessageOptions.msg' >" +
                        "       <div class='app-busy-message'>" +
                        "           <div ><span ng-bind='workbenchOptions.shortMessageOptions.msg'></span>" +
                        "           </div>" +
                        "       </div>" +
                        "   </div>" +
                        "</aside>" +
                        "<aside>" +
                        "   <div class='app-busy-message-container-true' ng-show='workbenchOptions.busyMessageOptions.msg'>" +
                        "      <div class='app-busy-message' ng-bind='workbenchOptions.busyMessageOptions.msg'></div>" +
                        "   </div>" +
                        "</aside>" +
                        "<aside>" +
                        "   <div class='app-busy-message-container-true' ng-show='workbenchOptions.confirmMessageOptions.title'>" +
                        "      <div class='app-pop-up-view confirm-popup'>" +
                        "           <div class='app-padding-ten-px app-color-white jqte_format_4' style='background: #ff8500;' ng-if='workbenchOptions.confirmMessageOptions.title'>" +
                        "               <span ng-bind='workbenchOptions.confirmMessageOptions.title'></span>" +
                        "               <span ng-click='workbenchOptions.confirmMessageOptions.title = undefined;' class='app-float-right'><i  class='icon-remove'></i></span>" +
                        "           </div>" +
                        "           <div class='app-padding-ten-px app-color-black' style='width: 75%;' ng-bind='workbenchOptions.confirmMessageOptions.message'></div>" +
                        "           <div class='app-padding-ten-px app-busy-message-container-true ' style='top:auto;' ng-if='workbenchOptions.confirmMessageOptions.options'>" +
                        "                <div ng-repeat='option in workbenchOptions.confirmMessageOptions.options' ng-class='option.class' style='min-width: 60px;' ng-click='handleConfirmationActions(option)' ng-bind='option.label'>" +
                        "                </div>" +
                        "           </div>" +
                        "       </div>" +
                        "    </div>" +
                        "</aside>" +

                        "<aside>" +
                        "   <div class='pl-warning-body'  ng-show='workbenchOptions.warningOptions.showWarning==true && workbenchOptions.warningOptions && workbenchOptions.warningOptions.warnings && workbenchOptions.warningOptions.warnings.length>0'>" +
                        "       <div class='pl-warning-title' ng-bind='workbenchOptions.warningOptions.title'></div>" +
                        "       <div ng-click='workbenchOptions.warningOptions.showWarning = false' class='pl-warning-close icon-remove'></div>" +
                        "       <div ng-click='reportIssue(workbenchOptions.warningOptions.error)' class='pl-report-issue'>Report</div>" +
                        "       <div ng-click='workbenchOptions.warningOptions.confirmFunction()' class='pl-report-issue' ng-show='workbenchOptions.warningOptions.promptUserWarning' >Proceed To Save</div>" +
                        "       <div class='pl-warning-content'>" +
                        "           <ul class='app-padding-verticle-five-px'> " +
                        "                 <li ng-repeat='warning in workbenchOptions.warningOptions.warnings'>" +
                        "                      <span ng-bind-html='warning'></span>" +
                        "                      <span class='pl-stack-detail' ng-click='workbenchOptions.warningOptions.showWarningStack=true' ng-show='workbenchOptions.warningOptions.showStack'>Detail</span>" +
                        "                      <span class='pl-display-block' ng-bind='workbenchOptions.warningOptions.showStack' ng-show='workbenchOptions.warningOptions.showWarningStack'></span>" +
                        "                 </li>" +
                        "           </ul> " +
                        "       </div>" +
                        "   </div>" +
                        "</aside>" +
                        "<aside>" +
                        "   <div class='pl-popup-background' ng-show='workbenchOptions.alertMessageOptions && (workbenchOptions.alertMessageOptions.message || workbenchOptions.alertMessageOptions.html)'>" +
                        "       <div class='pl-popup-alert-body'  ng-show='workbenchOptions.alertMessageOptions && (workbenchOptions.alertMessageOptions.message || workbenchOptions.alertMessageOptions.html)'>" +
                        "           <div class='pl-warning-title' ng-bind='workbenchOptions.alertMessageOptions.title'></div>" +
                        "           <div ng-click='workbenchOptions.alertMessageOptions.message = null;workbenchOptions.alertMessageOptions.html = null;workbenchOptions.alertMessageOptions.detailMessage=null;workbenchOptions.alertMessageOptions.showDetailMessage=false;' class='pl-warning-close icon-remove'></div>" +
                        "           <div class='pl-popup-alert-content' >" +
                        "               <div class='pl-user-select' alert-message-html ng-show='workbenchOptions.alertMessageOptions.html'></div>" +
                        "               <div class='pl-user-select' ng-bind='workbenchOptions.alertMessageOptions.message' ng-show='workbenchOptions.alertMessageOptions.message'></div>" +
                        "               <div class='pl-user-select' ng-bind='workbenchOptions.alertMessageOptions.detailMessage' ng-show='workbenchOptions.alertMessageOptions.showDetailMessage'></div>" +
                        "               <div class='pl-footer-warning-body'>" +
                        "                   <div ng-show='workbenchOptions.alertMessageOptions.detailMessage' >" +
                        "                       <div ng-hide='workbenchOptions.alertMessageOptions.showDetailMessage' ng-click='workbenchOptions.alertMessageOptions.showDetailMessage = true' ><a href='' class='detail_link'>Show the details of this error</a></div>" +
                        "                       <div ng-show='workbenchOptions.alertMessageOptions.showDetailMessage' ng-click='workbenchOptions.alertMessageOptions.showDetailMessage = false' ><a href='' class='detail_link'>Hide the details of this error</a></div>" +
                        "                       <button ng-click='reloadWindow()' class='pl-detail'>Reload View</button>" +
                        "                   </div>" +
                        "                       <div ng-click='reportIssue()' ><a href='' style='clear:left;' class='detail_link'>Report issue</a></div>" +
                        "                   <div ng-show='!workbenchOptions.alertMessageOptions.doNotShowButton' class='app-text-align-right' ng-click='workbenchOptions.alertMessageOptions.message = null;workbenchOptions.alertMessageOptions.html = null;workbenchOptions.alertMessageOptions.detailMessage=null;workbenchOptions.alertMessageOptions.showDetailMessage=false;' >" +
                        "                       <button  class='pl-ok'>ok</button>" +
                        "                   </div>" +
                        "               </div>" +
                        "        </div>" +
                        "   </div>" +
                        "</aside>" +

                        "<aside>" +
                        "   <pl-confirmation-msg></pl-confirmation-msg>" +
                        "</aside>";
                    iElement.append($compile(template)($scope));
                },
                post: function ($scope, iElement) {

                }
            };
        }
    }
}]);

pl.directive('alertMessageHtml', ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.$watch("workbenchOptions.alertMessageOptions.html", function (newValue, oldValue) {
                        iElement.html("");
                        if (newValue) {
                            iElement.append(($compile)(newValue)($scope));
                        }
                    });

                }
            }
        }
    }
}]);

pl.directive('plBreadcrumbMenu', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var template = "<span class='pl-breadcrumb-menu app-cursor-pointer' >" +
                        "               <span ng-bind='breabcrumbInfo.menu.label'></span>" +
                        "               <span class='app-position-absolute pl-breadcrumb-menu-list'>" +
                        "                   <ul>" +
                        "                       <li ng-repeat='breadcrumbMenu in breabcrumbInfo.parentMenu' ng-bind='breadcrumbMenu.label' ng-click='breadCrumbMenuClick(breadcrumbMenu)' ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[breadcrumbMenu._id] == true}' ng-show='breadcrumbMenu.isVisible'></li>" +
                        "                   </ul>" +
                        "               </span>" +
                        "           </span>" +
                        "           <span class='icon-chevron-right small' ng-show='$index < workbenchOptions.selectedMenuInfo.length - 1'></span>";
                    iElement.append(($compile)(template)($scope));
                    $scope.breadCrumbMenuClick = function (menu) {
                        if (menu.menus && menu.menus.length > 0) {
                            $scope.breadCrumbMenuClick(menu.menus[0]);
                        } else {
                            $scope.onApplicationMenuClick(menu);
                        }
                    }
                }
            }
        }
    }
}]);

pl.directive('plApplications', ['$compile', function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        template: '',
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    $scope.$watch("workbenchOptions.applications", function () {
                        timeout();
                    })

                    $scope.setMenuPlacement = function () {
                        var appOffsetX = iElement.offset().left + iElement.width();
                        var wrapperElm = iElement.find('ul.pl-second-menu');
                        var lastElm = iElement.find('ul.pl-second-menu').find('li.first').last();
                        if (lastElm.offset()) {
                            var rightPos = lastElm.offset().left + lastElm.width();
                            if (rightPos < appOffsetX) {
                                if (wrapperElm.find('li').length <= 1) {
                                    wrapperElm.css({'padding-left': appOffsetX + 'px'});
                                } else {
                                    wrapperElm.css({'padding-left': appOffsetX - rightPos + 50 + 'px'});
                                }
                            }
                        }
                    }

                    function timeout() {
                        var offset = iElement.offset();
                        var elementWidth = iElement.width();
                        var windowWidth = $(window).width();
                        if (offset && (windowWidth > 600) && ((offset.left + elementWidth) > (windowWidth - 300))) {
                            var index = $scope.$index;
                            var menusToPush = [];
                            var otherMenu = undefined;
                            while (index < $scope.workbenchOptions.applications.length) {
                                if ($scope.workbenchOptions.applications[index].others) {
                                    otherMenu = $scope.workbenchOptions.applications[index];
                                    break;
                                }
                                menusToPush.push($scope.workbenchOptions.applications[index]);
                                $scope.workbenchOptions.applications.splice(index, 1);
                            }
                            if (!otherMenu && menusToPush.length > 0) {
                                otherMenu = {label: "Others", others: true, menus: menusToPush, _id: '__others'};
                                $scope.workbenchOptions.applications.push(otherMenu);
                            } else {
                                for (var j = menusToPush.length - 1; j >= 0; j--) {
                                    otherMenu.menus.splice(0, 0, menusToPush[j]);
                                }
                            }

                        }

                    }
                }
            }
        }
    }
}]);

pl.directive('plMenuGroup', ["$compile", '$timeout', function ($compile, $timeout) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        template: "<div class='pl-menus-group-parent app-float-left '>" +
            "       <div ng-if='!menuGroupOptions.showMenus' class='app-float-left'  ng-class=\'{\"selectedmenu\":menuGroupOptions.selectedMenuInfo && ($index == menuGroupOptions.selectedMenuInfo[menuGroupOptions.level-1])}\'>" +
            "           <div ng-if='menuGroupOptions[menuGroupOptions.displayField] && !menuGroupOptions.onHover' ng-class='menuGroupOptions.menuClass' class='app-float-left'" +
            "             >" +
            "              <span class='app-float-left pl-shared flex-box' ng-if='!menuGroupOptions.showOptions' ng-click='onSelectedMenuGroupClick($event)'><span>{{menuGroupOptions[menuGroupOptions.displayField]}}</span> <i class='pl-shared app-padding-left-five-px icon-caret-right-down'></i></span>" +
            "              <span class='app-float-left flex-box' ng-click='onSelectedMenuGroupClick($event)' ng-if='menuGroupOptions.showOptions'>{{menuGroupOptions[menuGroupOptions.displayField]}} </span>" +
            "           </div>" +
            "           <div class='app-float-left pl-dropdown icon' ng-class='menuGroupOptions.iconClass'  ng-if='menuGroupOptions.isDropdown' title='{{menuGroupOptions.title}}' ng-click='onSelectedMenuGroupClick($event)'></div>" +
            "       </div>" +
            "       <div ng-if='menuGroupOptions.image' ng-click='onSelectedMenuGroupClick($event)' class=\"app-action-collection\"  >" +
            "           <img ng-src='{{menuGroupOptions.src}}' ng-class='menuGroupOptions.imgClass' />" +
            "       </div>" +
            "       <div ng-if='menuGroupOptions.class' ng-click='onSelectedMenuGroupClick($event)' class=\"app-action-collection\" ng-class='menuGroupOptions.class' ng-style='menuGroupOptions.style' title='{{menuGroupOptions.title || \"\"}}'>&nbsp;</div>" +
            "       <div ng-if='menuGroupOptions.action' ng-class='menuGroupOptions.actionClass'>" +
            "           <span class='app-float-left' ng-click='onSelectedMenuGroupClick($event)' ng-class='menuGroupOptions.actionInnerClass'>...</span>" +
            "       </div>" +
            "</div>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.menuGroupOptions = $scope.$eval(attrs.plMenuGroup);
                    $scope.$watch("menuGroupOptions.menuChanged", function (newMenu, oldMenu) {
                        if (!angular.equals(newMenu, oldMenu)) {
                            if ($scope.menuGroupOptions.label && (angular.isUndefined($scope.menuGroupOptions.updateLabel) || $scope.menuGroupOptions.updateLabel)) {
                                $scope.updateLabel($scope.menuGroupOptions.selectedMenu);
                            }
                            var menu = $scope.menuGroupOptions.menus[$scope.menuGroupOptions.selectedMenu];
                            if (menu.onClick !== undefined) {
                                $scope[menu.onClick](menu);
                            } else if ($scope.menuGroupOptions && $scope.menuGroupOptions.onClick) {
                                $scope[$scope.menuGroupOptions.onClick](menu);
                            }
                        }
                    });

                    $scope.updateLabel = function (index) {
                        var menu = $scope.menuGroupOptions.menus[index];
                        $scope.menuGroupOptions.label = menu[$scope.menuGroupOptions.displayField];
                    }
                    if ($scope.menuGroupOptions && $scope.menuGroupOptions.selectedMenu) {
                        $scope.updateLabel($scope.menuGroupOptions.selectedMenu);
                    }
                },
                post: function ($scope, iElement) {
                    $scope.onSelectedMenuGroupClick = function ($event) {
                        var template = undefined;
                        if ($scope.menuGroupOptions.menus && $scope.menuGroupOptions.menus.length > 0) {
                            $event.preventDefault();
                            $event.stopPropagation();
                            var isSubMenu = false;
                            template = "<div ";
                            if ($scope.menuGroupOptions.position == 'bottom') {
                                var popupWidth = $(window).width();
                                isSubMenu = true;
                                template += " style='width:" + popupWidth + "px" + "; background-color:rgba(248, 176, 97, 0.94); box-shadow: 0 1px 3px rgba(0,0,0,0.25), inset 0 -1px 0 rgba(0,0,0,0.1), 0 4px 0 #FF8500;' class='";
                            }
                            else {
                                template += " class='pl-overflow-y-scroll";
                            }

                            template += " app-white-space-nowrap app-light-gray-backgroud-color app-small-popup'>" +
                                "<div ng-repeat='menu in menuGroupOptions.menus' ng-class='{\"pl-sub-menu\":" + isSubMenu + "}' pl-menu-group-menu class='pl-menu-group-label app-menu-label pl-line-height app-float-left' >" + "</div>" +
                                "</div>";
                        } else if ($scope.menuGroupOptions.template) {
                            template = $scope.menuGroupOptions.template;
                        }
                        if (angular.isUndefined(template)) {
                            return;
                        }

                        var popupScope = $scope.$new();
                        var p = new Popup({
                            autoHide: true,
                            hideOnClick: $scope.menuGroupOptions.hideOnClick !== undefined ? $scope.menuGroupOptions.hideOnClick : true,
                            deffered: true,
                            escEnabled: true,
                            html: $compile(template)(popupScope),
                            scope: popupScope,
                            element: $event.target,
                            position: $scope.menuGroupOptions.position || "bottom",
                            addInElement: false
                        });
                        p.showPopup();
                    };

                }
            }
        }
    }
}]);

pl.directive('plMenuGroupMenu', ["$compile", "$timeout", function ($compile, $timeout) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                post: function ($scope, iElement) {

                    var menu = $scope.menu;
                    var template = '';
                    if (menu + "." + $scope.menuGroupOptions.displayField) {
                        template += '<div ng-class=\'{"selectedmenu":$index == menuGroupOptions.selectedMenuInfo[menuGroupOptions.level]}\'>' +
                            '           <div ng-if="!menu.href" class="app-pop-up-menu-label" ng-bind="menu[menuGroupOptions.displayField]" ng-class="menuGroupOptions.menuClass" ng-click="onMenuGroupOptionClick($index, $event)"></div>' +
                            '           <div ng-if="menu.href"  >' +
                            '               <a class="pl-action-link" href="{{menu.href}}" ng-bind="menu[menuGroupOptions.displayField]" download></a>' + // download property doesn't supported on safari
                            '           </div>' +
                            '        </div>';

                    }
                    iElement.append($compile(template)($scope));

                    $scope.onMenuGroupOptionClick = function ($index, $event) {
                        $scope.menuGroupOptions.selectedMenu = $index;
//                        if ($scope.menuGroupOptions.menus[$index].onClick) {
//                            $scope[$scope.menuGroupOptions.menus[$index].onClick]()
//                            return;
//                        } else if ($scope.menuGroupOptions.onClick) {
//                            $scope[$scope.menuGroupOptions.onClick]($scope.menu)
//                        } else {
                        $scope.menuGroupOptions.menuChanged = !$scope.menuGroupOptions.menuChanged;
//                        }
                    }
                }
            }
        }
    }
}]);

pl.directive('plConfirmationMsg', ["$compile", function ($compile) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement) {
                    var template = "<div class='app-position-absolute' ng-show='workbenchOptions.confirmationOptions' style='top:0px;bottom:0px;right:0px;left:0px;'>" +
                        "               <div class='popupwrapper app-overflow-auto app-pop-up-view'>" +
                        "                   <div class='app-width-full app-float-left app-header-background-color app-text-align-center app-font-weight-bold' style='line-height: 35px;' ng-bind='workbenchOptions.confirmationOptions.title'></div>" +
                        "                       <div class='app-float-left app-width-full app-text-align-center' style='padding: 15px 0px;line-height: 20px;' ng-bind-html='workbenchOptions.confirmationOptions.description'></div>" +
                        "                       <div class='app-float-left app-width-full app-text-align-center app-margin-bottom-five-px'>" +
                        "                               <div ng-repeat='option in workbenchOptions.confirmationOptions.options' class='app-button app-button-border app-button-margin app-button-shadow app-button-padding' ng-click='onConfirmClick(option)' ng-bind='option.label'></div>" +
                        "                       </div>" +
                        "                   </div> " +
                        "               </div>";

                    iElement.append($compile(template)($scope));

                },
                pre: function ($scope, iElement) {

                    $scope.onConfirmClick = function (option) {
                        var confirmationOptions = $scope.workbenchOptions.confirmationOptions;
                        if (option.onClick !== undefined) {
                            option.onClick(option);
                        } else if (confirmationOptions.onClick) {
                            confirmationOptions.onClick(option);
                        }
                        $scope.workbenchOptions.confirmationOptions = undefined;
                    }
                }
            }
        }
    }
}]);

pl.directive('plChangePassword', ['$compile', function () {
    return{
        restrict: 'EAC',
        replace: true,
        template: '   <div class="ng-scope" style="position: fixed;height: 100%;width: 100%;background: rgba(17, 17, 17, 0.39); ">' +
            '      <div class="app-pop-up-view  " style="background: url(\'../images/panel_bg.png\'); ">' +
            '          <div>' +
            '          </div>' +
            '              <div class=" " style="min-width: 500px;min-height: 220px; border: 1px solid #ccc;">' +
            '                 <div class="app-background-grey app-text-align-right">' +
            '                   <span class="">' +
            '                       <span class="btn-blue" ng-click="changePassword()" style="float:none;none;padding: 5px;"><label>Change Password</label></span>' +
            '                   </span>' +
            '                   <span class="">' +
            '                       <span class="btn-blue" ng-click="cancel()" style="float:none;none;padding: 5px;"><label>Cancel</label></span>' +
            '                   </span>' +
            '                 </div>' +
            '               <div class="top app-padding-ten-px">' +
            '                   <div  style="display: flex; margin-bottom: 5px;">' +
            '                      <span class="pl-form-label">' +
            '                          <label >Old Password </label>' +
            '                      </span>' +
            '                      <span class="form-template">' +
            '                          <input class="form-control" type="password" ng-model="oldPassword" />' +
            '                      </span>' +
            '                   </div>' +
            '                   <div  style="display: flex; margin-bottom: 5px;">' +
            '                       <span class="pl-form-label">' +
            '                          <label>New Password </label>' +
            '                       </span>' +
            '                       <span class="form-template">' +
            '                           <input class="form-control" type="password" ng-model="newPassword" >' +
            '                       </span>' +
            '                   </div>' +
            '                  <div  style="display: flex; margin-bottom: 5px;">' +
            '                       <span class="pl-form-label">' +
            '                           <label>Confirm Password </label>' +
            '                       </span>' +
            '                       <span class="form-template">' +
            '                           <input class="form-control" type="password" ng-model="confirmPassword"  >' +
            '                       </span>' +
            '                   </div>' +
            '                   <div>' +
            '                   </div>' +
            '               </div>' +
            '              </div>' +
            '          </div>' +
            '      </div>',
        compile: function () {
            return{
                post: function ($scope, iElement) {
                    $scope.cancel = function () {
                        $('#popup-changePass').remove();
                    }

                    $scope.changePassword = function () {
                        var param = {};
                        param.oldPassword = $scope.oldPassword;
                        param.newPassword = $scope.newPassword;
                        param.confirmPassword = $scope.confirmPassword;
                        if ($scope.workbenchOptions.busyMessageOptions) {
                            $scope.workbenchOptions.busyMessageOptions.msg = 'Loading..';
                        }
                        return ApplaneDB.connection("userdb").invokeFunction("User.resetPassword", [
                            param
                        ]).then(
                            function (response) {
                                console.log('result ' + response);
                                if ($scope.workbenchOptions.busyMessageOptions) {
                                    delete  $scope.workbenchOptions.busyMessageOptions.msg;
                                }
                                $('#popup-changePass').remove();
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }).fail(function (err) {
                                if ($scope.workbenchOptions.busyMessageOptions) {
                                    delete   $scope.workbenchOptions.busyMessageOptions.msg;
                                }
                                $scope.workbenchOptions.warningOptions.error = err;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            })

                    }

                }
            }
        }
    }
}]);
