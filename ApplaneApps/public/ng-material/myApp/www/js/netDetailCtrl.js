pl.controller('networkDetailCtrl', function ($scope, $compile, $location, $http, $ionicPopup) {
    $scope.fimbre.metaData.selecetdNetwork_id = $scope.fimbre.metaData.selecetdNetwork_id || $location.search().id;
    $scope.fimbre.metaData.actionType = $scope.fimbre.metaData.actionType || $location.search().type;
    $scope.fimbre.metaData.networkName = $scope.fimbre.metaData.networkName || $location.search().networkName;
    $scope.updateSuggestion = function (oldSuggestion, newSuggestion) {
        if (oldSuggestion && newSuggestion) {
            oldSuggestion.totalLikes = newSuggestion.totalLikes;
            oldSuggestion.totalComments = newSuggestion.totalComments;
            oldSuggestion.totalSuggestions = newSuggestion.totalSuggestions;
            oldSuggestion.userLike = newSuggestion.userLike;
            oldSuggestion.lastActivity = newSuggestion.lastActivity;
            oldSuggestion.lastActivityOn = newSuggestion.lastActivityOn;
            oldSuggestion.lastActivityBy = newSuggestion.lastActivityBy;
            oldSuggestion.lastActivityType = newSuggestion.lastActivityType;

        }
    }
    $scope.moreSuggestionsCanBeLoaded = function () {
        var dataInfo = undefined;
        if ($scope.fimbre.networkRowAction.dataInfo && $scope.fimbre.networkRowAction.dataInfo[$scope.fimbre.networkType]) {
            dataInfo = $scope.fimbre.networkRowAction.dataInfo[$scope.fimbre.networkType];
        }

        if (dataInfo && dataInfo.hasNext && dataInfo.skip) {
            return true;
        } else {
            return false;
        }
    }
    $scope.loadMoreSuggestion = function () {
        alert("Load more suggestion called");
        var dataInfo = undefined;
        if ($scope.fimbre.networkRowAction.dataInfo && $scope.fimbre.networkRowAction.dataInfo[$scope.fimbre.networkType]) {
            dataInfo = $scope.fimbre.networkRowAction.dataInfo[$scope.fimbre.networkType];
        }

        console.log("loadMoreSuggestion called............" + JSON.stringify(dataInfo));

        if (dataInfo && dataInfo.hasNext && dataInfo.skip) {
            $scope.getNetworkSuggestions({skip:dataInfo.skip})
        } else {
            return;
        }
    }

    $scope.getNetworkSuggestions = function (options) {
        var invokeFunction = undefined;
        $scope.fimbre.networkRowAction = {};
        $scope.fimbre.networkType = '';
        if ($scope.fimbre.metaData.actionType == 'Suggestions') {
            $scope.fimbre.networkRowAction = {networkSuggestions:{}};
            invokeFunction = 'Suggestion.getSuggestions';
            $scope.fimbre.networkType = 'networkSuggestions';
        } else if ($scope.fimbre.metaData.actionType == 'Members') {
            invokeFunction = 'Network.getNetworkMembers';
            $scope.fimbre.networkRowAction = {networkMembers:{}};
            $scope.fimbre.networkType = 'networkMembers';
        } else {
            $scope.handleError(false, "$scope.getNetworkSuggestions", "Not supported type in getNetworkSuggestions[" + $scope.fimbre.metaData.actionType + "]");
            return;
        }
        var params = {"function":invokeFunction, token:localStorage.token, "parameters":JSON.stringify([
            {"networkid":$scope.fimbre.metaData.selecetdNetwork_id}
        ])};
        if (options && options.skip) {
            params.skip = options.skip;
        }
        $http({method:"POST", url:SERVER + INVOKE_SERVICE_URL, params:params})
            .success(
            function (result) {
                if (result) {
                    $scope.fimbre.networkRowAction.dataInfo = $scope.fimbre.networkRowAction.dataInfo || {};
                    $scope.fimbre.networkRowAction.dataInfo[$scope.fimbre.networkType] = result.response.dataInfo;
                    $scope.fimbre.networkRowAction[$scope.fimbre.networkType] = result.response.result;

                }
            }).error(function (err) {
                $scope.handleError(err);
            });

    }

    $scope.getNetworkSuggestions();

    $scope.showMemberType = function () {
        var parentPopup = $ionicPopup.show({
            template:'<div class="">' +
                '               <div class="item" ng-click="searchByEmail()">Add By email</div>' +
                '               <div class="item" ng-click="searchByGgggle()">Add from contact</div>' +
                '               </div>' +
                '           </div>',
            title:'Add Members',
            scope:$scope,
            popupView:false,
            buttons:[
                {
                    text:'<b>Cancel</b>',
                    type:'button-balanced'
                }
            ]
        });
        $scope.hideParentPopup = function () {
            parentPopup.close(); //close the popup after 3 seconds for some reason
        }
    }

    $scope.addedTmpMembres = [];
    $scope.addMemberByEmail = function () {
        $scope.addedTmpMembres.push(angular.copy($scope.typedEmail));
        $scope.typedEmail = undefined;
    }
    $scope.dummyData = [1, 3, 4, 5, 6, 7, 8, 9, 10];


    $scope.searchByEmail = function () {
        $scope.hideParentPopup();
        $location.path("/app/addMemberByEmailId/?id=" + $scope.fimbre.metaData.selecetdNetwork_id + "&type=" + $scope.fimbre.metaData.actionType + "$networkName=" + $scope.fimbre.metaData.networkName);
    }

    $scope.searchByGgggle = function () {
        $scope.hideParentPopup();
        $location.path("/app/addMemberByContact/?id=" + $scope.fimbre.metaData.selecetdNetwork_id + "&type=" + $scope.fimbre.metaData.actionType + "$networkName=" + $scope.fimbre.metaData.networkName);
    }


    $scope.likeSuggestion = function (suggestion) {
        var fn = "";
        if (suggestion.userLike) {
            fn = "Suggestion.unlikeSuggestion";
        } else {
            fn = "Suggestion.likeSuggestion";
        }
        var params = {"function":fn, token:localStorage.token, "parameters":JSON.stringify([
            {"networkid":$scope.fimbre.metaData.selecetdNetwork_id, 'suggestionid':suggestion.suggestionid._id, suggestionDetail:true}
        ])};
        $http({method:"POST", url:SERVER + INVOKE_SERVICE_URL, params:params})
            .success(
            function (data) {
                $scope.updateSuggestion(suggestion, data.response.suggestionDetail)
            }).error(function (err) {
                $scope.handleError('Error in like suggestion >>>> ' + JSON.stringify(err));
            });
    }

    $scope.suggestionNewComment = function (commentData) {
        commentData.hideCommentPopup();
        if (!commentData.suggestionId || !commentData.newComment) {
            return;
        }
        var params = {"function":'Suggestion.addComment', token:localStorage.token, "parameters":JSON.stringify([
            {"networkid":$scope.fimbre.metaData.selecetdNetwork_id, 'suggestionid':commentData.suggestionId, 'comment':commentData.newComment, suggestionDetail:true}
        ])};
        $http({method:"POST", url:SERVER + INVOKE_SERVICE_URL, params:params})
            .success(
            function (data) {
                if (data) {
                    $scope.updateSuggestion(commentData.oldSuggestion, data.response.suggestionDetail);

                }
            }).error(function (err) {
                $scope.handleError('Error in comment suggestion >>>> ' + JSON.stringify(err));
            });
    }


    $scope.getComments = function (suggestionId) {
        var params = {"function":'Suggestion.getComments', token:localStorage.token, "parameters":JSON.stringify([
            {"networkid":$scope.fimbre.metaData.selecetdNetwork_id, 'suggestionid':suggestionId}
        ])};
        $http({method:"POST", url:SERVER + INVOKE_SERVICE_URL, params:params})
            .success(
            function (data) {
                if (data) {
                    $scope.commentData.comments = data.response.result;
                }
            }).error(function (err) {
                $scope.handleError('Error in getting comment>>>> ' + JSON.stringify(err));
            });
    }
    $scope.showCommentPopup = function (suggestion) {
        $scope.commentData = {'suggestionId':suggestion.suggestionid._id, oldSuggestion:suggestion};
        var myPopup = $ionicPopup.show({
            template:'<div class="list">' +
                '               <div class="item item-input">' +
                '                        <input type="text" ng-model="commentData.newComment" placeholder="Write a comment.." />' +
                '               </div>' +
                '           </div>',
            title:'Comment',
            scope:$scope,
            popupView:false,
            footer:'               <div class="list">' +
                '                   <button ng-click="suggestionNewComment(commentData)" class="item button button-full button-balanced popup-footer">' +
                '                       <a >Add</a>' +
                '                   </button>' +
                '               </div>'
        });
        $scope.hidePopup = function () {
            myPopup.close(); //close the popup after 3 seconds for some reason
        }

        $scope.commentData.hideCommentPopup = $scope.hidePopup;
    }

    $scope.suggestFeedback = function (feedback, emoticon) {
        for (i = 1; i < 6; i++) {
            $scope.suggestData.selectedOkk = false;
            $scope.suggestData.selectedBad = false;
            $scope.suggestData.selectedExc = false;
            $scope.suggestData.selectedGd = false;
            $scope.suggestData.selectedWorst = false;
        }
        $scope.suggestData['selected' + emoticon] = true;
        $scope.suggestData.emoticon = feedback;
    }

    $scope.suggestNewSuggestion = function (suggestData) {
        if (!suggestData.suggestionId || !suggestData.suggest) {
            return;
        }
        suggestData.hideSuggestPopup();
        var params = {"function":'Suggestion.addNetworkSuggestions', token:localStorage.token, "parameters":JSON.stringify([
            {"networkid":$scope.fimbre.metaData.selecetdNetwork_id, 'suggestionid':suggestData.suggestionId, suggestion:suggestData.suggest, 'emoticon':suggestData.emoticon, suggestionDetail:true}
        ])};
        $http({method:"POST", url:SERVER + INVOKE_SERVICE_URL, params:params})
            .success(
            function (data) {
                if (data) {
                    $scope.updateSuggestion(suggestData.oldSuggestion, data.response.suggestionDetail);
                }
            }).error(function (err) {
                $scope.handleError('Error while suggest>>>> ' + JSON.stringify(err));
            });
    }

    $scope.showSuggestPopup = function (suggestion) {
        $scope.suggestData = {'suggestionId':suggestion.suggestionid._id, oldSuggestion:suggestion}
        var myPopup = $ionicPopup.show({
            template:'<div class="list">' +
                '               <div class="item item-input">' +
                '                        <input type="text" ng-model="suggestData.suggest" placeholder="What\'s Yours Suggestion?" />' +
                '               </div>' +
                '               <div class="item item-input " style="text-align: center" >' +
                '                   <a ng-click="suggestFeedback(5, \'Exc\')" ng-class="{\'selected\':suggestData.selectedExc}" class="emoticon exc"></a>' +
                '                   <a ng-click="suggestFeedback(4, \'Gd\')" ng-class="{\'selected\':suggestData.selectedGd}" class="emoticon gd"></a>' +
                '                   <a ng-click="suggestFeedback(3, \'Okk\')" ng-class="{\'selected\':suggestData.selectedOkk}" class="emoticon okk"></a>' +
                '                   <a ng-click="suggestFeedback(2, \'Bad\')" ng-class="{\'selected\':suggestData.selectedBad}" class="emoticon bad"></a>' +
                '                   <a ng-click="suggestFeedback(1, \'Worst\')" ng-class="{\'selected\':suggestData.selectedWorst}" class="emoticon worts"></a>' +
                '               </div>' +
                '           </div>',
            title:'Suggest',
            scope:$scope,
            popupView:false,
            footer:'               <div class="list">' +
                '                   <button ng-click="suggestNewSuggestion(suggestData)" class="item button button-full button-balanced popup-footer">' +
                '                       <a >Suggest</a>' +
                '                   </button>' +
                '               </div>'
        });
        $scope.hidePopup = function () {
            myPopup.close(); //close the popup after 3 seconds for some reason
        }

        $scope.suggestData.hideSuggestPopup = $scope.hidePopup;
    }

});