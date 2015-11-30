var app = angular.module('myApp', ['directives']);

app.controller('appController', function ($scope) {

});

var appDirectives = angular.module('directives', []);


appDirectives.directive('test', function () {
    return {
        restrict:'A',
        require:'?ngModel',
        compile:function () {
            return {
                pre:function (scope, element, attrs, ngModel) {
                    console.log("ngmodel >> " + JSON.stringify(ngModel));
                    element.on('blur keyup change', function () {
                        scope.$apply(read);
                    });

                    function read() {
                        if (element.val() == 1) {
                            ngModel.$setViewValue(1);
                        } else {
                            ngModel.$setViewValue(0);
                        }
                        console.log("ngmodel >> " + JSON.stringify(ngModel));
                    }
                }
            }
        }
    };
});
