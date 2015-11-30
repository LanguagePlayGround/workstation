(function () {
    'use strict';
    angular
        .module('autocompleteDemo', ['ngMaterial'])
        .controller('DemoCtrl', function($scope, $timeout, $q, $log) {
            $scope.row = {city:"hissar"};
            var self = this;
            self.tmname = 'naveen';
            // list of `state` value/display objects
            self.states        = loadAll();
//            self.selectedItem  = $scope.row;
            self.searchText    = "Hissar";
            self.querySearch   = querySearch;
            self.simulateQuery = false;
            self.isDisabled    = false;
            self.selectedItemChange = selectedItemChange;
            self.searchTextChange   = searchTextChange;
            // ******************************
            // Internal methods
            // ******************************
            /**
             * Search for states... use $timeout to simulate
             * remote dataservice call.
             */
            function querySearch (query, fetchAll) {
                var results = query ? self.states.filter( createFilterFor(query) ) : [],
                    deferred;
                console.log('querySearch called '+JSON.stringify(results));
                if (self.simulateQuery) {
                    deferred = $q.defer();
                    $timeout(function () { deferred.resolve( results ); }, Math.random() * 1000, false);
                    return deferred.promise;
                } else {
                    return results;
                }
            }
            function searchTextChange(text) {

                $log.info('Text changed to ' + text);
            }
            function selectedItemChange(item) {
                $log.info('in selected item self.searchText' + self.searchText);
                $log.info('Item changed to ' + JSON.stringify(item));
            }
            /**
             * Build `states` list of key/value pairs
             */
            function loadAll() {
                var allStates = 'Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware,\
              Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana,\
              Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana,\
              Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina,\
              North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina,\
              South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia,\
              Wisconsin, Wyoming';
                return allStates.split(/, +/g).map( function (state) {
                    return {
                        value: state.toLowerCase(),
                        display: state,
                        id:state
                    };
                });
            }
            /**
             * Create filter function for a query string
             */
            function createFilterFor(query) {
                var lowercaseQuery = angular.lowercase(query);
                if(lowercaseQuery == 'z'){
                    lowercaseQuery = '';
                }
                return function filterFn(state) {
                    return (state.value.indexOf(lowercaseQuery) === 0);
                };
            }
        })
        .controller('gridListDemoCtrl', function($scope) {
            this.tiles = buildGridModel({
                icon : "avatar:svg-",
                title: "Svg-",
                background: ""
            });
            function buildGridModel(tileTmpl){
                var it, results = [ ];
                for (var j=0; j<14; j++) {
                    it = angular.extend({},tileTmpl);
                    it.icon  = it.icon + (j+1);
                    it.title = it.title + (j+1);
                    it.span  = { row : 1, col : 1 };
                    switch(j+1) {
                        case 1:
                            it.background = "red";
                            it.span.row = 2;
                            it.span.col = 3;
                            break;
                        case 2: it.background = "green";     it.span.col = 1;    break;
                        case 3: it.background = "darkBlue";      break;
                        case 4:
                            it.background = "blue";
                            it.span.col = 2;
                            break;
                        case 5:
                            it.background = "white";
                            it.span.row = 2;
                            it.span.col = 2;
                            break;
                        case 6: it.background = "pink";          break;
                        case 7: it.background = "darkBlue";      break;
                        case 8: it.background = "purple";        break;
                        case 9: it.background = "deepBlue";      break;
                        case 10: it.background = "lightPurple";  break;
                        case 11: it.background = "yellow";       break;
                        case 12: it.background = "lightPurple";       break;
                        case 13: it.background = "deepBlue";       break;
                        case 14: it.background = "yellow";       break;
                    }
                    results.push(it);
                }
                return results;
            }
        })
        .config( function( $mdIconProvider ){
            $mdIconProvider.iconSet("avatar", './icons/avatar-icons.svg', 128);
        });

})();