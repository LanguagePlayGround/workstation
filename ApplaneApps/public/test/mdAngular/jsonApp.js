var jsonApp = angular.module('jsonApp', []);
jsonApp.controller('jsonCtrl', function ($scope) {
    $scope.title = 'JSON Editor';
});

jsonApp.directive('jsonEditor', ['$compile', function ($compile) {
    return {
        restrict: "A",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElm) {
                    var template = '' +
                        '       <textarea class="json-textarea"></textarea>' +
                        '       <div class="json-gutter"></div>' +
                        '       <div class="json-content">' +
                        '           <div class="json-line-grp">' +
                        '               <div class="json-line"></div>' +
                        '           </div>' +
                        '           <div class="ace_cursor-layer ace_hidden-cursors">' +
                        '               <div class="ace_cursor" ></div>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div class="json-scroller-v"></div>' +
                        '       <div class="json-scroller-h"></div>';
                    iElm.append(($compile)(template)($scope));
                },
                post:function($scope, iElm){
                        var keyvalue, currentLine = 0,  previousLine = 0;
                    var input = $(iElm).find('textarea')[0];
                    var cursor = $(iElm).find('.ace_cursor')[0];
                    var setTextareaOffset = function(e){
                        var that = this;
                        $(input).css({left: e.clientX , top: this.offsetTop, height:'16px', width:'10px'});
                        $(cursor).css({left: e.clientX , top: this.offsetTop, height:'16px', width:'10px'});
                        $(input).focus();
                    };

                    $('.json-line-grp').bind('click', setTextareaOffset);
                    var jsonContent = $(iElm).find('.json-content')[0];
                    var lastJsonGrpChild, json_grp, json_line,json_line_content, secondaryValue
                        ,specialkeyMapping = {
                            'key_219':{index:221, value:'{'},
                            'key_221':{index:219, value:'}'},
                            'key_57':{index:48, value:'('},
                            'key_48':{index:57, value:')'}

                        };

                    $(input).bind('keyup', function(e) {
                        var characterCode = e.keyCode;
                        if ( characterCode === 27 || characterCode === 9 || characterCode === 20 || characterCode === 16 || characterCode === 17 || characterCode === 91 || characterCode === 92 || characterCode === 18 ) {
                            return false;
                        }
                        if (typeof e.shiftKey != "boolean" || typeof characterCode != "number") {
                            return false;
                        }
                        if(e.shiftKey && (characterCode == 219 || characterCode == 57)) {
                            secondaryValue =  specialkeyMapping['key_'+specialkeyMapping['key_'+characterCode].index].value;
                            console.log('secondaryValue -->> '+secondaryValue);
                        }
                        lastJsonGrpChild = jsonContent.children[jsonContent.children.length -2];
                        keyvalue = input.value;
                        input.value = '';
                        json_grp = document.createElement("DIV");
                        json_line = document.createElement("DIV");
                        json_line_content = document.createElement("SPAN");
                        if(secondaryValue) {
                            keyvalue = keyvalue +' '+secondaryValue;
                            secondaryValue = undefined;
                        }
                        var offset = $(cursor).offset();
                        if(characterCode == 8) {
                            json_line = lastJsonGrpChild.children[lastJsonGrpChild.children.length - 1];
                            if(json_line.children && json_line.children.length > 0){
                                json_line_content = json_line.children[json_line.children.length - 1];
                                if(json_line_content.innerHTML == '' || json_line_content.innerHTML == undefined){
                                    $(lastJsonGrpChild).remove();
                                    $(cursor).css({top: (offset.top - 16) +'px'});
                                } else {
                                    $(cursor).css({left: json_line_content.offsetWidth +'px'});
                                    json_line_content.innerHTML = json_line_content.innerHTML.substring(0,json_line_content.innerHTML.length - 1);
                                }
                            } else {
                                 json_line_content.innerHTML = json_line_content.innerHTML.substring(0,json_line_content.innerHTML.length - 1);
                                $(json_line).append(json_line_content);
                            }
                        } else if(characterCode == 13) {
                            offset.top += 16;
                            $(cursor).css({top: offset.top +'px', left:'7px'});
                            $(json_grp).addClass('json-line-grp');
                            $(json_line).addClass('json-line');
                            json_line_content.innerHTML = keyvalue;
                            $(json_grp).append(json_line);
                            $(json_grp).bind('click', setTextareaOffset);
                            $(json_grp).insertAfter(lastJsonGrpChild);
//                            $(jsonContent).append(json_grp);
                        } else {
                            json_line = lastJsonGrpChild.children[lastJsonGrpChild.children.length - 1];
                            if(json_line.children && json_line.children.length > 0){
                                json_line_content = json_line.children[json_line.children.length - 1];
                                json_line_content.innerHTML = json_line_content.innerHTML + keyvalue;
                            } else {
                                json_line_content.innerHTML = keyvalue;
                                $(json_line).append(json_line_content);
                            }
                            $(cursor).css({left: json_line_content.offsetWidth +'px'});
                        }


                    });
                }
            }
        }
    }
}]);