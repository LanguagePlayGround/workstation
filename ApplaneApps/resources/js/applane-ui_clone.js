var LESS_THEN = "$lt";
var GREATER_EQ = "$gte";
var FILTER = 'filter';
var DATA_NOT_FOUND = 'No Data Found'; // when data is not found in lookup column, show no data found
appStrapDirectives.directive('appRichTextArea', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div></div>",
        compile:function () {
            return{
                pre:function ($scope, iElement, attrs) {
                    var modelExp = attrs.model;
                    var fieldExp = attrs.field;
                    var toBind = modelExp + "." + fieldExp;
                    var textareaTemplate = '<textarea name="textarea" ng-bind="' + toBind + '"></textarea>' +
                        '<div class="jqte">' +
                        '<div class="jqte_toolbar"  role="toolbar" unselectable></div><div class="jqte_linkform" style="display:none" role="dialog">' +
                        '<div class="jqte_linktypeselect" unselectable>' +
                        '<div class="jqte_linktypeview" unselectable></div><div class="jqte_linktypes" role="menu" unselectable></div>' +
                        '</div><input class="jqte_linkinput" type="text/css" value=""><div class="jqte_linkbutton" unselectable>OK</div> <div style="height:1px;float:none;clear:both"></div>' +
                        '</div>' +

                        '<div class="jqte_editor" ng-bind-html-unsafe ="' + toBind + '"></div>' +
                        '<div class="jqte_source jqte_hiddenField" style="overflow: hidden; padding: 10px 0px;"></div>' +
                        '</div>';
                    $(iElement).append($compile(textareaTemplate)($scope));
                    var textAreaElement = angular.element(iElement).find('textarea');
                    $scope.richTextBoxEditor = function (options) {


                        var varsTitle = [
                            {title:"Text Format"},
                            {title:"Font Size"},
                            {title:"Color"},
                            {title:"Bold", hotkey:"B"},
                            {title:"Italic", hotkey:"I"},
                            {title:"Underline", hotkey:"U"},
                            {title:"Ordered List", hotkey:"."},
                            {title:"Unordered List", hotkey:","},
                            {title:"Subscript", hotkey:"down arrow"},
                            {title:"Superscript", hotkey:"up arrow"},
                            {title:"Outdent", hotkey:"left arrow"},
                            {title:"Indent", hotkey:"right arrow"},
                            {title:"Justify Left"},
                            {title:"Justify Center"},
                            {title:"Justify Right"},
                            {title:"Strike Through", hotkey:"K"},
                            {title:"Add Link", hotkey:"L"},
                            {title:"Remove Link"},
                            {title:"Cleaner Style", hotkey:"Delete"},
                            {title:"Horizontal Rule", hotkey:"H"},
                            {title:"Source"}
                        ];

                        var formats = [
                            ["p", "Normal"],
                            ["h1", "Header 1"],
                            ["h2", "Header 2"],
                            ["h3", "Header 3"],
                            ["h4", "Header 4"],
                            ["h5", "Header 5"],
                            ["h6", "Header 6"],
                            ["pre", "Preformatted"]
                        ];

                        var fsizes = ["10", "12", "16", "18", "20", "24", "28"];

                        var colors = [
                            "0,0,0", "68,68,68", "102,102,102", "153,153,153", "204,204,204", "238,238,238", "243,243,243", "255,255,255",
                            null,
                            "255,0,0", "255,153,0", "255,255,0", "0,255,0", "0,255,255", "0,0,255", "153,0,255", "255,0,255",
                            null,
                            "244,204,204", "252,229,205", "255,242,204", "217,234,211", "208,224,227", "207,226,243", "217,210,233", "234,209,220",
                            "234,153,153", "249,203,156", "255,229,153", "182,215,168", "162,196,201", "159,197,232", "180,167,214", "213,166,189",
                            "224,102,102", "246,178,107", "255,217,102", "147,196,125", "118,165,175", "111,168,220", "142,124,195", "194,123,160",
                            "204,0,0", "230,145,56", "241,194,50", "106,168,79", "69,129,142", "61,133,198", "103,78,167", "166,77,121",
                            "153,0,0", "180,95,6", "191,144,0", "56,118,29", "19,79,92", "11,83,148", "53,28,117", "116,27,71",
                            "102,0,0", "120,63,4", "127,96,0", "39,78,19", "12,52,61", "7,55,99", "32,18,77", "76,17,48"
                        ];

                        var vars = angular.extend({
                            'status':true,
                            'css':"jqte",
                            'title':true,
                            'titletext':varsTitle,
                            'button':"OK",
                            'format':true,
                            'formats':formats,
                            'fsize':true,
                            'fsizes':fsizes,
                            'funit':"px",
                            'color':true,
                            'b':true,
                            'i':true,
                            'u':true,
                            'ol':true,
                            'ul':true,
                            'sub':true,
                            'sup':true,
                            'outdent':true,
                            'indent':true,
                            'left':true,
                            'center':true,
                            'right':true,
                            'strike':true,
                            'link':true,
                            'unlink':true,
                            'remove':true,
                            'rule':true,
                            'source':true,
                            'placeholder':false,
                            'br':true,
                            'p':true,
// events
                            'change':"",
                            'focus':"",
                            'blur':""
                        }, options);

                        $scope.richTextBoxEditorValue = function (value) {
                            textAreaElement.val(value)
                            textAreaElement.closest("." + vars.css).find("." + vars.css + "_editor").html(value);
                        }

                        var thisBrowser = navigator.userAgent.toLowerCase();
                        var buttons = [];

                        function addParams(name, command, key, tag, emphasis) {
                            var thisCssNo = buttons.length + 1;
                            return buttons.push({name:name, cls:thisCssNo, command:command, key:key, tag:tag, emphasis:emphasis});
                        }

                        ;
                        addParams('format', 'formats', '', '', false); // text format button  --> no hotkey
                        addParams('fsize', 'fSize', '', '', false); // font size button --> no hotkey
                        addParams('color', 'colors', '', '', false); // text color button  --> no hotkey
                        addParams('b', 'Bold', 'B', ["b", "strong"], true); // bold --> ctrl + b
                        addParams('i', 'Italic', 'I', ["i", "em"], true); // italic --> ctrl + i
                        addParams('u', 'Underline', 'U', ["u"], true); // underline --> ctrl + u
                        addParams('ol', 'insertorderedlist', '¾', ["ol"], true); // ordered list --> ctrl + .(dot)
                        addParams('ul', 'insertunorderedlist', '¼', ["ul"], true); // unordered list --> ctrl + ,(comma)
                        addParams('sub', 'subscript', '(', ["sub"], true); // sub script --> ctrl + down arrow
                        addParams('sup', 'superscript', '&', ["sup"], true); // super script --> ctrl + up arrow
                        addParams('outdent', 'outdent', '%', ["blockquote"], false); // outdent --> ctrl + left arrow
                        addParams('indent', 'indent', '\'', ["blockquote"], true); // indent --> ctrl + right arrow
                        addParams('left', 'justifyLeft', '', '', false); // justify Left --> no hotkey
                        addParams('center', 'justifyCenter', '', '', false); // justify center --> no hotkey
                        addParams('right', 'justifyRight', '', '', false); // justify right --> no hotkey
                        addParams('strike', 'strikeThrough', 'K', ["strike"], true); // strike through --> ctrl + K
                        addParams('link', 'linkcreator', 'L', ["a"], true); // insertion link  --> ctrl + L
                        addParams('unlink', 'unlink', '', ["a"], false); // remove link --> ctrl + N
                        addParams('remove', 'removeformat', '.', '', false); // remove all styles --> ctrl + delete
                        addParams('rule', 'inserthorizontalrule', 'H', ["hr"], false); // insertion horizontal rule --> ctrl + H
                        addParams('source', 'displaysource', '', '', false); // feature of displaying source
                        return textAreaElement.each(function () {
                            if (!$(this).data("jqte") || $(this).data("jqte") == null || $(this).data("jqte") == "undefined") {
                                $(this).data("jqte", true);
                            } else {
                                $(this).data("jqte", false);
                            }

                            if (!vars.status || !$(this).data("jqte")) {
                                if ($(this).closest("." + vars.css).length > 0) {
                                    var editorValue = $(this).closest("." + vars.css).find("." + vars.css + "_editor").html();
                                    var thisElementAttrs = "";
                                    $($(this)[0].attributes).each(function () {
                                        if (this.nodeName != "style")
                                            thisElementAttrs = thisElementAttrs + " " + this.nodeName + '="' + this.nodeValue + '"';
                                    });
                                    var thisElementTag = $(this).is("[data-origin]") && $(this).attr("data-origin") != "" ? $(this).attr("data-origin") : "textarea";
                                    var createValue = '>' + editorValue;
                                    if (thisElementTag == "input" || thisElementTag == "option") {
                                        editorValue = editorValue.replace(/"/g, '&#34;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                        createValue = 'value="' + editorValue + '">';
                                    }
                                    var thisClone = $(this).clone();
                                    $(this).data("jqte", false).closest("." + vars.css).before(thisClone).remove();
                                    thisClone.replaceWith('<' + thisElementTag + thisElementAttrs + createValue + '</' + thisElementTag + '>');
                                }
                                return;
                            }
                            var thisElement = $(this);
                            var thisElementTag = $(this).prop('tagName').toLowerCase();
                            $(this).attr("data-origin", thisElementTag);
                            var thisElementVal = $(this).is("[value]") || thisElementTag == "textarea" ? $(this).val() : $(this).html();
                            thisElementVal = thisElementVal.replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
                            var jQTE = $(this).next('.' + vars.css);
                            var toolbar = jQTE.find('.' + vars.css + "_toolbar"); // the toolbar variable
                            var linkform = jQTE.find('.' + vars.css + "_linkform"); // the link-form-area in the toolbar variable
                            var editor = jQTE.find('.' + vars.css + "_editor"); // the text-field of jqte editor
                            var emphasize = vars.css + "_tool_depressed"; // highlight style of the toolbar buttons

                            var linktypeselect = linkform.find("." + vars.css + "_linktypeselect"); // the tool of link-type-selector
                            var linkinput = linkform.find("." + vars.css + "_linkinput"); // the input of insertion link
                            var linkbutton = linkform.find("." + vars.css + "_linkbutton"); // the button of insertion link

                            var linktypes = linktypeselect.find("." + vars.css + "_linktypes"); // the select box of link types
                            var linktypeview = linktypeselect.find("." + vars.css + "_linktypeview"); // the link type preview
                            var setdatalink = vars.css + "-setlink"; // the selected text add to mark as "link will be added"

                            var sourceField = jQTE.find("." + vars.css + "_source"); // the source-area variable

                            thisElement.appendTo(sourceField);

                            if (thisElementTag != "textarea") {
                                var thisElementAttrs = "";
                                $(thisElement[0].attributes).each(function () {
                                    if (this.nodeName != "type" && this.nodeName != "value")
                                        thisElementAttrs = thisElementAttrs + " " + this.nodeName + '="' + this.nodeValue + '"';
                                });
                                thisElement.replaceWith('<textarea ' + thisElementAttrs + '>' + thisElementVal + '</textarea>');
                                thisElement = sourceField.find("textarea");
                            }
                            editor.attr("contenteditable", "true");
                            for (var n = 0; n < buttons.length; n++) {
                                if (vars[buttons[n].name]) {
                                    var buttonHotkey = buttons[n].key.length > 0 ? vars.titletext[n].hotkey != null && vars.titletext[n].hotkey != "undefined" && vars.titletext[n].hotkey != "" ? ' (Ctrl+' + vars.titletext[n].hotkey + ')' : '' : '';
                                    var buttonTitle = vars.titletext[n].title != null && vars.titletext[n].title != "undefined" && vars.titletext[n].title != "" ? vars.titletext[n].title + buttonHotkey : '';
                                    toolbar.append('<div class="' + vars.css + '_tool ' + vars.css + '_tool_' + buttons[n].cls + '" role="button" data-tool="' + n + '" unselectable><a class="' + vars.css + '_tool_icon" unselectable></a></div>');
                                    toolbar.find('.' + vars.css + '_tool[data-tool=' + n + ']').data({tag:buttons[n].tag, command:buttons[n].command, emphasis:buttons[n].emphasis, title:buttonTitle});
                                    if (buttons[n].name == "format" && angular.isArray(vars.formats)) {
                                        var toolLabel = vars.formats[0][1].length > 0 && vars.formats[0][1] != "undefined" ? vars.formats[0][1] : "";
                                        toolbar.find("." + vars.css + '_tool_' + buttons[n].cls).find("." + vars.css + "_tool_icon").replaceWith('<a class="' + vars.css + '_tool_label" unselectable><span class="' + vars.css + '_tool_text" unselectable>' + toolLabel + '</span><span class="' + vars.css + '_tool_icon" unselectable></span></a>');
                                        toolbar.find("." + vars.css + '_tool_' + buttons[n].cls)
                                            .append('<div class="' + vars.css + '_formats" unselectable></div>');
                                        for (var f = 0; f < vars.formats.length; f++) {
                                            toolbar.find("." + vars.css + "_formats").append('<a ' + vars.css + '-formatval="' + vars.formats[f][0] + '" class="' + vars.css + '_format' + ' ' + vars.css + '_format_' + f + '" role="menuitem" unselectable>' + vars.formats[f][1] + '</a>');
                                        }
                                        toolbar.find("." + vars.css + "_formats").data("status", false);
                                    } else if (buttons[n].name == "fsize" && angular.isArray(vars.fsizes)) {
                                        toolbar.find("." + vars.css + '_tool_' + buttons[n].cls)
                                            .append('<div class="' + vars.css + '_fontsizes" unselectable></div>');
                                        for (var f = 0; f < vars.fsizes.length; f++) {
                                            toolbar.find("." + vars.css + "_fontsizes").append('<a ' + vars.css + '-styleval="' + vars.fsizes[f] + '" class="' + vars.css + '_fontsize' + '" style="font-size:' + vars.fsizes[f] + vars.funit + '" role="menuitem" unselectable>Abcdefgh...</a>');
                                        }
                                    } else if (buttons[n].name == "color" && angular.isArray(colors)) {
                                        toolbar.find("." + vars.css + '_tool_' + buttons[n].cls)
                                            .append('<div class="' + vars.css + '_cpalette" unselectable></div>');
                                        for (var c = 0; c < colors.length; c++) {
                                            if (colors[c] != null)
                                                toolbar.find("." + vars.css + "_cpalette").append('<a ' + vars.css + '-styleval="' + colors[c] + '" class="' + vars.css + '_color' + '" style="background-color: rgb(' + colors[c] + ')" role="gridcell" unselectable></a>');
                                            else
                                                toolbar.find("." + vars.css + "_cpalette").append('<div class="' + vars.css + "_colorSeperator" + '"></div>');
                                        }
                                    }
                                }
                            }
                            linktypes.data("linktype", "0");

                            if (vars.placeholder && vars.placeholder != "") {
                                jQTE.prepend('<div class="' + vars.css + '_placeholder" unselectable><div class="' + vars.css + '_placeholder_text">' + vars.placeholder + '</div></div>');
                                var placeHolder = jQTE.find("." + vars.css + "_placeholder");
                                placeHolder.click(function () {
                                    editor.focus();
                                });
                            }
                            jQTE.find("[unselectable]").css("user-select", "none").addClass("unselectable").attr("unselectable", "on").on("selectstart mousedown", false);
                            var toolbutton = toolbar.find("." + vars.css + "_tool");
                            var formatbar = toolbar.find("." + vars.css + "_formats");
                            var fsizebar = toolbar.find("." + vars.css + "_fontsizes");
                            var cpalette = toolbar.find("." + vars.css + "_cpalette");

                            function selectionGet() {
                                if (window.getSelection)
                                    return window.getSelection();
                                else if (document.selection && document.selection.createRange && document.selection.type != "None")
                                    return document.selection.createRange();
                            }

                            function selectionSet(addCommand, thirdParam) {
                                var range, sel = selectionGet();
                                if (window.getSelection) {
                                    if (sel.anchorNode && sel.getRangeAt)
                                        range = sel.getRangeAt(0);
                                    if (range) {
                                        sel.removeAllRanges();
                                        sel.addRange(range);
                                    }
                                    document.execCommand(addCommand, false, thirdParam);
                                } else if (document.selection && document.selection.createRange && document.selection.type != "None") {
                                    range = document.selection.createRange();
                                    range.execCommand(addCommand, false, thirdParam);
                                }
                                affectStyleAround(false, false);
                            }

                            function replaceSelection(tTag, tAttr, tVal) {
                                if (editor.not(":focus")) {
                                    editor.focus();
                                }
                                if (window.getSelection) {
                                    var selObj = selectionGet(), selRange, newElement, documentFragment;
                                    if (selObj.anchorNode && selObj.getRangeAt) {
                                        selRange = selObj.getRangeAt(0);
                                        newElement = document.createElement(tTag);
                                        $(newElement).attr(tAttr, tVal);
                                        documentFragment = selRange.extractContents();
                                        newElement.appendChild(documentFragment);
                                        selRange.insertNode(newElement);
                                        selObj.removeAllRanges();
                                        if (tAttr == "style") {
                                            affectStyleAround($(newElement), tVal);
                                        } else {
                                            affectStyleAround($(newElement), false);
                                        }
                                    }
                                } else if (document.selection && document.selection.createRange && document.selection.type != "None") {
                                    var range = document.selection.createRange();
                                    var selectedText = range.htmlText;
                                    var newText = '<' + tTag + ' ' + tAttr + '="' + tVal + '">' + selectedText + '</' + tTag + '>';
                                    document.selection.createRange().pasteHTML(newText);
                                }
                            }

                            var getSelectedNode = function () {
                                var node, selection;
                                if (window.getSelection) {
                                    selection = getSelection();
                                    node = selection.anchorNode;
                                }
                                if (!node && document.selection && document.selection.createRange && document.selection.type != "None") {
                                    selection = document.selection;
                                    var range = selection.getRangeAt ? selection.getRangeAt(0) : selection.createRange();
                                    node = range.commonAncestorContainer ? range.commonAncestorContainer :
                                        range.parentElement ? range.parentElement() : range.item(0);
                                }
                                if (node) {
                                    return (node.nodeName == "#text" ? $(node.parentNode) : $(node));
                                }
                                else
                                    return false;
                            };

                            function affectStyleAround(element, style) {
                                var selectedTag = getSelectedNode(); // the selected node
                                selectedTag = selectedTag ? selectedTag : element;
                                if (selectedTag && style == false) {
                                    if (selectedTag.parent().is("[style]"))
                                        selectedTag.attr("style", selectedTag.parent().attr("style"));
                                    if (selectedTag.is("[style]"))
                                        selectedTag.find("*").attr("style", selectedTag.attr("style"));
                                } else if (element && style && element.is("[style]")) {
                                    var styleKey = style.split(";"); // split the styles
                                    styleKey = styleKey[0].split(":") // get the key of first style feature
                                    if (element.is("[style*=" + styleKey[0] + "]"))
                                        element.find("*").css(styleKey[0], styleKey[1]);
// select to the selected node again
                                    selectText(element);
                                }
                            }

                            function selectText(element) {
                                if (element) {
                                    var element = element[0];
                                    if (document.body.createTextRange) {
                                        var range = document.body.createTextRange();
                                        range.moveToElementText(element);
                                        range.select();
                                    }
                                    else if (window.getSelection) {
                                        var selection = window.getSelection();
                                        var range = document.createRange();
                                        if (element != "undefined" && element != null) {
                                            range.selectNodeContents(element);
                                            selection.removeAllRanges();
                                            selection.addRange(range);
                                            if ($(element).is(":empty")) {
                                                $(element).append("&nbsp;");
                                                selectText($(element));
                                            }
                                        }
                                    }
                                }
                            }

                            function selected2link() {
                                if (!toolbar.data("sourceOpened")) {
                                    var selectedTag = getSelectedNode(); // the selected node
                                    var thisHrefLink = "http://"; // default the input value of the link-form-field
                                    linkAreaSwitch(true);
                                    if (selectedTag) {
                                        var thisTagName = selectedTag.prop('tagName').toLowerCase();
                                        if (thisTagName == "a" && selectedTag.is('[href]')) {
                                            thisHrefLink = selectedTag.attr('href');
                                            selectedTag.attr(setdatalink, "");
                                        } else {
                                            replaceSelection("a", setdatalink, "");
                                        }
                                    } else {
                                        linkinput.val(thisHrefLink).focus();
                                    }

                                    linktypeselect.click(function (e) {
                                        if ($(e.target).hasClass(vars.css + "_linktypetext") || $(e.target).hasClass(vars.css + "_linktypearrow"))
                                            linktypeSwitch(true);
                                    });

                                    linktypes.find("a").click(function () {
                                        var thisLinkType = $(this).attr(vars.css + "-linktype");
                                        linktypes.data("linktype", thisLinkType)
                                        linktypeview.find("." + vars.css + "_linktypetext").html(linktypes.find('a:eq(' + linktypes.data("linktype") + ')').text());
                                        linkInputSet(thisHrefLink);
                                        linktypeSwitch();
                                    });

                                    linkInputSet(thisHrefLink);
//                                    linkinput.focus().val(thisHrefLink).bind("keypress keyup", function (e) {
//                                        if (e.keyCode == 13) {
//                                            linkRecord(jQTE.find("[" + setdatalink + "]"));
//                                            return false;
//                                        }
//                                    });

                                    linkbutton.click(function () {
                                        linkRecord(jQTE.find("[" + setdatalink + "]"));
                                    });
                                } else {
                                    linkAreaSwitch(false);
                                }
                            }

                            function linkRecord(thisSelection) {
                                linkinput.focus();
                                selectText(thisSelection);
                                thisSelection.removeAttr(setdatalink);
                                if (linktypes.data("linktype") != "2") {
                                    selectionSet("createlink", linkinput.val()); // insert link url of link-input to the selected node
                                } else {
                                    selectionSet("insertImage", linkinput.val()); // insert image url of link-input to the selected node
                                    editor.find("img").each(function () {
                                        var emptyPrevLinks = $(this).prev("a");
                                        var emptyNextLinks = $(this).next("a");
                                        if (emptyPrevLinks.length > 0 && emptyPrevLinks.html() == "")
                                            emptyPrevLinks.remove();
                                        else if (emptyNextLinks.length > 0 && emptyNextLinks.html() == "")
                                            emptyNextLinks.remove();
                                    });
                                }
                                linkAreaSwitch();
//                                editor.trigger("change");
                            }

                            function linkAreaSwitch(status) {
                                clearSetElement("[" + setdatalink + "]:not([href])");
                                jQTE.find("[" + setdatalink + "][href]").removeAttr(setdatalink);
                                if (status) {
                                    toolbar.data("linkOpened", true);
                                    linkform.show();
                                } else {
                                    toolbar.data("linkOpened", false);
                                    linkform.hide();
                                }
                                linktypeSwitch();
                            }

                            function linktypeSwitch(status) {
                                if (status) {
                                    linktypes.show();
                                } else {
                                    linktypes.hide();
                                }
                            }

                            function linkInputSet(thisHrefLink) {
                                var currentType = linktypes.data("linktype");
                                if (currentType != "1" && !linkinput.is("[value^=http://]")) {
                                    linkinput.val("http://");
                                } else {
                                    linkinput.val(thisHrefLink);
                                }
                            }

                            function selected2style(styleCommand) {
                                if (!toolbar.data("sourceOpened")) {
                                    if (styleCommand == "fSize") {
                                        styleField = fsizebar;
                                    } else if (styleCommand == "colors") {
                                        styleField = cpalette;
                                    }

                                    styleFieldSwitch(styleField, true);
                                    styleField.find("a").unbind("click").click(function () {
                                        var styleValue = $(this).attr(vars.css + "-styleval"); // the property of style value to be added
                                        if (styleCommand == "fSize") {
                                            styleType = "font-size";
                                            styleValue = styleValue + vars.funit; // combine the value with size unit
                                        } else if (styleCommand == "colors") {
                                            styleType = "color";
                                            styleValue = "rgb(" + styleValue + ")"; // combine color value with rgb
                                        }
                                        var prevStyles = refuseStyle(styleType); // affect styles to child tags (and extract to the new style attributes)
                                        replaceSelection("span", "style", styleType + ":" + styleValue + ";" + prevStyles);
                                        styleFieldSwitch("", false);
                                        $('.' + vars.css + '_title').remove();
                                        editor.trigger("change");
                                    });
                                } else {
                                    styleFieldSwitch(styleField, false);
                                    linkAreaSwitch(false);
                                }
                            }

                            function styleFieldSwitch(styleField, status) {
                                var mainData = "",
                                    allData = [
                                        {"d":"fsizeOpened", "f":fsizebar},
                                        {"d":"cpallOpened", "f":cpalette}
                                    ];
                                if (styleField != "") {
                                    for (var si = 0; si < allData.length; si++) {
                                        if (styleField == allData[si]["f"])
                                            mainData = allData[si];
                                    }
                                }
                                if (status) {
                                    toolbar.data(mainData["d"], true); // stil seçme alaninin açildigini belirten parametre yaz
                                    mainData["f"].slideDown(100); // stil seçme alanini aç
                                    for (var si = 0; si < allData.length; si++) {
                                        if (mainData["d"] != allData[si]["d"]) {
                                            toolbar.data(allData[si]["d"], false);
                                            allData[si]["f"].slideUp(100);
                                        }
                                    }
                                } else {
                                    for (var si = 0; si < allData.length; si++) {
                                        toolbar.data(allData[si]["d"], false);
                                        allData[si]["f"].slideUp(100);
                                    }
                                }
                            }

                            function clearSetElement(elem) {
                                jQTE.find(elem).each(function () {
                                    $(this).before($(this).html()).remove();
                                });
                            }

                            function refuseStyle(refStyle) {
                                var selectedTag = getSelectedNode(); // the selected node
                                if (selectedTag && selectedTag.is("[style]") && selectedTag.css(refStyle) != "") {
                                    var refValue = selectedTag.css(refStyle); // first get key of unwanted style
                                    selectedTag.css(refStyle, ""); // clear unwanted style
                                    var cleanStyle = selectedTag.attr("style"); // cleaned style
                                    selectedTag.css(refStyle, refValue); // add unwanted style to the selected node again
                                    return cleanStyle; // print cleaned style
                                } else {
                                    return "";
                                }
                            }

                            function selected2format() {
                                formatFieldSwitch(true);
                                formatbar.find("a").click(function () {
                                    $("*", this).click(function (e) {
                                        e.preventDefault();
                                        return false;
                                    });
                                    formatLabelView($(this).text());
                                    var formatValue = $(this).attr(vars.css + "-formatval"); // the type of format value
                                    selectionSet("formatBlock", '<' + formatValue + '>');
                                    formatFieldSwitch(false);
                                });
                            }

                            function formatFieldSwitch(status) {
                                var thisStatus = status ? true : false;
                                thisStatus = status && formatbar.data("status") ? true : false;
                                if (thisStatus || !status) {
                                    formatbar.data("status", false).slideUp(200);
                                } else {
                                    formatbar.data("status", true).slideDown(200);
                                }
                            }

                            function formatLabelView(str) {
                                var formatLabel = formatbar.closest("." + vars.css + "_tool").find("." + vars.css + "_tool_label").find("." + vars.css + "_tool_text");
                                if (str.length > 10)
                                    str = str.substr(0, 7) + "...";
// change format label of button
                                formatLabel.html(str);
                            }

                            function extractToText(strings) {
                                var $htmlContent, $htmlPattern, $htmlReplace;
                                $htmlContent = strings.replace(/\n/gim, '').replace(/\r/gim, '').replace(/\t/gim, '');
                                $htmlPattern = [
                                    /\<span(|\s+.*?)><span(|\s+.*?)>(.*?)<\/span><\/span>/gim, // trim nested spans
//                                    /<(\w*[^p])\s*[^\/>]*>\s*<\/\1>/gim, // remove empty or white-spaces tags (ignore paragraphs (<p>) and breaks (<br>))
//                                    [ COMMENT BCZ REMOVE THE <B> TAG -- ASHISH]

//                                    /\<div(|\s+.*?)>(.*?)\<\/div>/gim, // convert div to p
                                    /\<strong(|\s+.*?)>(.*?)\<\/strong>/gim, // convert strong to b
                                    /\<em(|\s+.*?)>(.*?)\<\/em>/gim // convert em to i
                                ];
                                $htmlReplace = [
                                    '<span$2>$3</span>',
//                                    '',   //[ COMMENT BCZ REMOVE THE <B> TAG -- ASHISH]
                                    '<p$1>$2</p>',
                                    '<b$1>$2</b>',
                                    '<i$1>$2</i>'
                                ];
// repeat the cleaning process 5 times
                                for (c = 0; c < 5; c++) {
// create loop as the number of pattern
                                    for (var i = 0; i < $htmlPattern.length; i++) {
                                        var pattern = $htmlPattern[i];
                                        var replaceby = $htmlReplace[i];
                                        $htmlContent = $htmlContent.replace(pattern, replaceby);
                                    }
                                }
// if paragraph is false (<p>), convert <p> to <br>
                                if (!vars.p)
                                    $htmlContent = $htmlContent.replace(/\<p(|\s+.*?)>(.*?)\<\/p>/ig, '<br/>$2');
// if break is false (<br>), convert <br> to <p>
                                if (!vars.br) {
                                    $htmlPattern = [
                                        /\<br>(.*?)/ig,
                                        /\<br\/>(.*?)/ig
                                    ];
                                    $htmlReplace = [
                                        '<p>$1</p>',
                                        '<p>$1</p>'
                                    ];
// create loop as the number of pattern (for breaks)
                                    for (var i = 0; i < $htmlPattern.length; i++) {
                                        $htmlContent = $htmlContent.replace($htmlPattern[i], $htmlReplace[i]);
                                    }
                                }
// if paragraph and break is false (<p> && <br>), convert <p> to <div>
                                if (!vars.p && !vars.br)
                                    $htmlContent = $htmlContent.replace(/\<p>(.*?)\<\/p>/ig, '<div>$1</div>');
                                return $htmlContent;
                            }

// the function of exporting contents of the text field to the source field (to be the standard in all browsers)
                            function postToSource() {
// clear unnecessary tags when editor view empty
                                var sourceStrings = editor.text() == "" && editor.html().length < 12 ? "" : editor.html();
                                var value = extractToText(sourceStrings);
                                thisElement.val(value);
                            }

// the function of exporting contents of the source field to the text field (to be the standard in all browsers)
                            function postToEditor() {
                                editor.html(extractToText(thisElement.val()));
                            }

// the function of getting parent (or super parent) tag name of the selected node
                            function detectElement(tags) {
                                var resultdetect = false, $node = getSelectedNode(), parentsTag;
                                if ($node) {
                                    $.each(tags, function (i, val) {
                                        parentsTag = $node.prop('tagName').toLowerCase();
                                        if (parentsTag == val)
                                            resultdetect = true;
                                        else {
                                            $node.parents().each(function () {
                                                parentsTag = $(this).prop('tagName').toLowerCase();
                                                if (parentsTag == val)
                                                    resultdetect = true;
                                            });
                                        }
                                    });
                                    return resultdetect;
                                }
                                else
                                    return false;
                            }

                            ;
// the function of highlighting the toolbar buttons according to the cursor position in jqte editor
                            function buttonEmphasize(e) {
                                for (var n = 0; n < buttons.length; n++) {
                                    if (vars[buttons[n].name] && buttons[n].emphasis && buttons[n].tag != '')
                                        detectElement(buttons[n].tag) ? toolbar.find('.' + vars.css + '_tool_' + buttons[n].cls).addClass(emphasize) : $('.' + vars.css + '_tool_' + buttons[n].cls).removeClass(emphasize);
                                }
// showing text format
                                if (vars.format && angular.isArray(vars.formats)) {
                                    var isFoundFormat = false;
                                    for (var f = 0; f < vars.formats.length; f++) {
                                        var thisFormat = [];
                                        thisFormat[0] = vars.formats[f][0];
                                        if (vars.formats[f][0].length > 0 && detectElement(thisFormat)) {
                                            formatLabelView(vars.formats[f][1]);
                                            isFoundFormat = true;
                                            break;
                                        }
                                    }
                                    if (!isFoundFormat)
                                        formatLabelView(vars.formats[0][1]);
                                }
// hide all style-fields
                                styleFieldSwitch("", false);
                                formatFieldSwitch(false);
                            }

// the event of click to the toolbar buttons
                            toolbutton
                                .unbind("click")
                                .click(function (e) {
// if source button is clicked
                                    if ($(this).data('command') == 'displaysource' && !toolbar.data("sourceOpened")) {
                                        toolbar.find("." + vars.css + "_tool").addClass(vars.css + "_hiddenField");
                                        $(this).removeClass(vars.css + "_hiddenField");
                                        toolbar.data("sourceOpened", true);
                                        thisElement.css("height", editor.outerHeight());
                                        sourceField.removeClass(vars.css + "_hiddenField");
                                        editor.addClass(vars.css + "_hiddenField");
                                        thisElement.focus();
                                        linkAreaSwitch(false);
                                        styleFieldSwitch("", false);
                                        formatFieldSwitch();
                                        if (vars.placeholder && vars.placeholder != "")
                                            placeHolder.hide();
                                    } else {
                                        if (!toolbar.data("sourceOpened")) {
                                            if ($(this).data('command') == 'linkcreator') {
                                                if (!toolbar.data("linkOpened")) {
                                                    selected2link();
                                                }
                                                else {
                                                    linkAreaSwitch(false);
                                                    formatFieldSwitch(false);
                                                }
                                            } else if ($(this).data('command') == 'formats') {
                                                if ($(this).data('command') == 'formats' && !$(e.target).hasClass(vars.css + "_format"))
                                                    selected2format();
// hide all style-fields
                                                styleFieldSwitch("", false);
                                                if (editor.not(":focus"))
                                                    editor.focus();
                                            } else if ($(this).data('command') == 'fSize' || $(this).data('command') == 'colors') {
                                                if (
                                                    ($(this).data('command') == 'fSize' && !$(e.target).hasClass(vars.css + "_fontsize")) || // the font-size button
                                                        ($(this).data('command') == 'colors' && !$(e.target).hasClass(vars.css + "_color")) // the color button
                                                    )
                                                    selected2style($(this).data('command'));
                                                formatFieldSwitch(false);
                                                if (editor.not(":focus"))
                                                    editor.focus();
                                            } else {
                                                if (editor.not(":focus"))
                                                    editor.focus();
                                                selectionSet($(this).data('command'), null);
                                                styleFieldSwitch("", false);
                                                formatFieldSwitch(false);
                                                linktypeSwitch();
                                                $(this).data('emphasis') == true && !$(this).hasClass(emphasize) ? $(this).addClass(emphasize) : $(this).removeClass(emphasize);
                                                sourceField.addClass(vars.css + "_hiddenField");
                                                editor.removeClass(vars.css + "_hiddenField");
                                            }
                                        } else {
                                            toolbar.data("sourceOpened", false);
                                            toolbar.find("." + vars.css + "_tool").removeClass(vars.css + "_hiddenField");
                                            sourceField.addClass(vars.css + "_hiddenField");
                                            editor.removeClass(vars.css + "_hiddenField");
                                        }
                                        if (vars.placeholder && vars.placeholder != "")
                                            editor.html() != "" ? placeHolder.hide() : placeHolder.show();
                                    }
//                                    editor.trigger("change");
                                })
                                .hover(function (e) {
                                    if (vars.title && $(this).data("title") != "" && ( $(e.target).hasClass(vars.css + "_tool") || $(e.target).hasClass(vars.css + "_tool_icon") )) {
                                        $('.' + vars.css + '_title').remove();
                                        jQTE.append('<div class="' + vars.css + '_title"><div class="' + vars.css + '_titleArrow"><div class="' + vars.css + '_titleArrowIcon"></div></div><div class="' + vars.css + '_titleText">' + $(this).data("title") + '</div></div>');
                                        var thisTitle = $('.' + vars.css + '_title:first');
                                        var thisArrow = thisTitle.find('.' + vars.css + '_titleArrowIcon');
                                        var thisPosition = $(this).position();
                                        var thisAlignX = thisPosition.left + $(this).outerWidth() - (thisTitle.outerWidth() / 2) - ($(this).outerWidth() / 2);
                                        var thisAlignY = (thisPosition.top + $(this).outerHeight() + 5);
                                        thisTitle.delay(400).css({'top':thisAlignY, 'left':thisAlignX}).fadeIn(200);
                                    }
                                }, function () {
                                    $('.' + vars.css + '_title').remove();
                                });
                            var editorChangeTimer = null;
                            editor
                                .bind("keypress keyup keydown drop cut copy paste DOMCharacterDataModified DOMSubtreeModified", function () {   // trigger change method of the text field when the text field modified
                                if (!toolbar.data("sourceOpened"))                                     // export contents of the text to the sources
                                    $(this).trigger("change");
                                linktypeSwitch();                                                 // hide the link-type-field
                                if ($.isFunction(vars.change))                                       // if the change method is added run the change method
                                    vars.change();
                                if (vars.placeholder && vars.placeholder != "")                     // the feature of placeholder
                                    $(this).text() != "" ? placeHolder.hide() : placeHolder.show();
                            })
                                .bind("change", function () {
                                    if (!toolbar.data("sourceOpened")) {
                                        clearTimeout(editorChangeTimer);
                                        editorChangeTimer = setTimeout(postToSource, 0);
                                    }
                                })
                                .keydown(function (e) {
                                    if (e.ctrlKey) {
                                        for (var n = 0; n < buttons.length; n++) {
                                            if (vars[buttons[n].name] && e.keyCode == buttons[n].key.charCodeAt(0)) {
                                                if (buttons[n].command != '' && buttons[n].command != 'linkcreator')
                                                    selectionSet(buttons[n].command, null);
                                                else if (buttons[n].command == 'linkcreator')
                                                    selected2link();
                                                return false;
                                            }
                                        }
                                    }
                                })
                                .bind("mouseup keyup", buttonEmphasize)// method of triggering to the highlight button
                                .focus(function () {                                    // the event of focus to the text field
                                    if ($.isFunction(vars.focus))                       // if the focus method is added run the focus method
                                        vars.focus();
                                    jQTE.addClass(vars.css + "_focused");               // add onfocus class
                                    if (/opera/.test(thisBrowser)) {                    // prevent focus problem on opera
                                        var range = document.createRange();
                                        range.selectNodeContents(editor[0]);
                                        range.collapse(false);
                                        var selection = window.getSelection();
                                        selection.removeAllRanges();
                                        selection.addRange(range);
                                    }
                                })
                                .focusout(function () {
                                    toolbutton.removeClass(emphasize);                      // remove to highlights of all toolbar buttons
                                    styleFieldSwitch("", false);                            // hide all menu-fields
                                    formatFieldSwitch(false);
                                    linktypeSwitch();
                                    if ($.isFunction(vars.blur))                           // if the blur method is added run the blur method
                                        vars.blur();
                                    jQTE.removeClass(vars.css + "_focused");               // remove onfocus class
                                    if (angular.isArray(vars.formats))                    // show default text format
                                        formatLabelView(vars.formats[0][1]);
                                    AppUtil.putDottedValue($scope.row, $scope.colmetadata.expression, thisElement.val());
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                });
                            thisElement// the event of key in the SOURCE FIELD [ TEXTAREA FIELD ]
                                .bind("keydown keyup", function () {
                                setTimeout(postToEditor, 0);                                       // export contents of the source to the text field

                            })
                                .focus(function () {
                                    jQTE.addClass(vars.css + "_focused");                         // add onfocus class
                                })
                                .focusout(function () {
                                    jQTE.removeClass(vars.css + "_focused");                     // remove onfocus class
                                    AppUtil.putDottedValue($scope.row, $scope.colmetadata.expression, thisElement.val());
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                });
                        });
                    };
                    $scope.richTextBoxEditor();
                }
            }
        }
    }
}]);
appStrapDirectives.directive("appTextArea", ["$compile" , function ($compile) {
    return {
        restrict:'E',
        template:"<div class='app-white-backgroud-color'></div>",
        scope:true,
        replace:true,
        compile:function () {
            return{
                post:function ($scope, iElement, attrs) {
                    var modelExp = attrs.model;
                    var fieldExp = attrs.field;
                    var toBind = modelExp + "." + fieldExp;
                    var border = attrs.border;
                    if (border === undefined || border == true || border == 'true') {
                        border = true
                    } else {
                        border = false;
                    }
                    var textareaTemplate = '<textarea style="height:30px;" class="app-auto-resize-teztarea" ng-model="' + toBind + '" ng-class=\'{"app-border":' + border + '}\'></textarea>' +
                        '<div ng-bind="' + toBind + '" class="app-auto-resize-div" style="position:absolute;"></div>';
                    $(iElement).append($compile(textareaTemplate)($scope));
                    AppUtil.rebindFieldExpression($scope, modelExp, fieldExp);
                    var textAreaElement = angular.element(iElement).find('textarea');
                    var $clone = angular.element(iElement).find('div');
                    $clone = $($clone);
                    var textareaHeight = parseInt(textAreaElement.height(), 10);
                    var lineHeight = textAreaElement.css('line-height') ? parseInt(textAreaElement.css('line-height'), 10) : 13;
                    var minheight = lineHeight * 2 > textareaHeight ? lineHeight * 2 : textareaHeight;
                    var maxheight = 500;

                    function updateHeight() {
                        var textareaContent = textAreaElement.val().replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;').replace(/\n/g, '<br/>');
                        setHeightAndOverflow();
                    }

                    function setHeightAndOverflow() {
                        var cloneHeight = $clone.height();
                        var overflow = 'hidden';
                        var height = cloneHeight + lineHeight;
                        if (border) {
                            height += 2; // 2 --> for top and bottom boder width
                        }
                        if (height > maxheight) {
                            height = maxheight;
                            overflow = 'auto';
                        } else if (height < minheight) {
                            height = minheight;
                        }

                        if (textAreaElement.val().trim().length == 0) {
                            iElement.css({height:"30px"});
                            textAreaElement.css({'overflow':overflow, 'height':'30px'});
                            textAreaElement.parent().parent().parent().css({'height':'30px'});
                            textAreaElement.parent().parent().css({'height':'30px'});
                            return;
                        }

                        if (textAreaElement.height() !== height) {
                            textAreaElement.css({'overflow':overflow, 'height':height + 'px'});
                            textAreaElement.parent().parent().parent().css({'height':height + 'px'});
                            textAreaElement.parent().parent().css({'height':height + 'px'});
                        }
                    }

                    textAreaElement.bind('keyup change cut paste', function () {
                        updateHeight();
                    });
                    textAreaElement.bind('blur', function () {
                        setHeightAndOverflow();
                    });
                    var model = AppUtil.getModel($scope, $scope.modelexpression, true);
                    if (model[$scope.fieldexpression]) {
                        textAreaElement.val(model[$scope.fieldexpression]);
                        updateHeight();
                    }
                    if (textAreaElement.val().trim().length == 0) {
                        iElement.css({height:"30px"});
                    }


                    setTimeout(function () {
                        var textAreaWidth = $(iElement).find('textarea').width();
                        if (textAreaWidth) {
                            $clone.width(textAreaWidth - 20);
                        }
                    }, 0);

                }
            }
        }
    }
}]);
appStrapDirectives.directive('appColumnGroup', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div style='margin-bottom: 5px;' ng-class=\"{'app-width-full':view.showas != 'popup','app-padding-five-px app-width app-width-ninety-eigth':view.showas == 'popup'}\" class='app-float-left' >" +
            "<div ng-show = 'columnGroup.showTitle'  " +
            "class='cg-title app-font-weight-bold app-width-auto app-color-blue app-background-grey' " +
            "style='padding:5px;height:21px;font-size:16px;' ng-bind='columnGroup.label' >" +
            "</div>" +
            "<div>" +
            "<app-column-holder ng-repeat='col in columnGroup.columns'></app-column-holder>" +
            "</div>" +
            "</div>",
        compile:function () {
            return  {
                post:function ($scope, iElement) {

                }
            };
        }
    }
}]);
appStrapDirectives.directive("appPanel", ["$compile", "$dataModel", "$timeout", function ($compile, $dataModel, $timeout) {
    return {
        restrict:"E",
        replace:true,
        template:"<div class='app-panel'></div>",
        compile:function () {
            return {
                pre:function ($scope, iElement) {
                    $scope.$watch($scope.view.metadata.dataExpression, function (newValue, oldValue) {
                        if (!newValue || angular.equals(newValue, oldValue)) {
                            return;
                        }
                        //modify date column value
                        var autoIncrementIndex = -1;
                        for (var i = 0; i < $scope.view.metadata.columns.length; i++) {
                            if ($scope.view.metadata.columns[i][UI] == UI_TYPE_DATE) {
                                var exp = $scope.view.metadata.columns[i].expression;
                                var expVal = AppUtil.resolve(newValue, exp);
                                var oldExpVal = oldValue ? AppUtil.resolve(oldValue, exp) : false;
                                if (expVal && !angular.equals(expVal, oldExpVal)) {
                                    AppUtil.putDottedValue(newValue, exp + "__formatteddate", AppUtil.getDate(expVal, "dd/mm/yyyy"));
                                }
                            } else if ($scope.view.metadata.columns[i][UI] == UI_TYPE_SCHEDULE) {
                                var exp = $scope.view.metadata.columns[i].expression;
                                var expVal = AppUtil.resolve(newValue, exp);
                                var oldExpVal = oldValue ? AppUtil.resolve(oldValue, exp) : false;
                                if (expVal && !angular.equals(expVal, oldExpVal)) {
                                    expVal = expVal.duedate;
                                    AppUtil.putDottedValue(newValue, exp + ".duedate__formatteddate", AppUtil.getDate(expVal, "dd/mm/yyyy"));
                                }
                            }
                        }


                        ;
                    }, true)
                },
                post:function ($scope, iElement) {
                    var id = TOOL_BAR_ID + '_' + $scope.view[COMPONENT_ID];
                    var toolBarTemplate = "<div class='app-tool-bar' app-tool-bar id='" + id + "'></div>";
                    var toolBarElement = $compile(toolBarTemplate)($scope);
                    var showAs = $scope.view[SHOW_AS];

                    if ($scope.view.metadata.openPanel) {
                        // do nothing
                    } else if (showAs == 'popup') {
                        $scope.popUpToolBar = toolBarElement;
                    } else if ($scope.view.metadata.embed) {
                        iElement.append(toolBarElement);
                    } else {
                        $('#' + TOOL_BAR_ID).append(toolBarElement);
                        if ($scope.view[PARENT_COMPONENT_ID]) {
                            var parentId = TOOL_BAR_ID + '_' + $scope.view[PARENT_COMPONENT_ID];
                            $('#' + parentId).hide();
                        }
                    }

                    var metadata = $scope.view.metadata;
                    var defaultColumnGroup = {"height":"30px", "labelWidth":"200px", "columnWidth":"200px", "columnPerRow":2, "showTitle":false, "showColumnLabel":true, "label":"Default", "columns":[]};
                    var textareaDefaultColumnGroup = {"height":"auto", "labelWidth":"200px", "columnWidth":(($(window).width() / 2) - 100) + "px", "columnPerRow":1, "showTitle":false, "showColumnLabel":true, "label":"Textarea", "columns":[]};
                    var textDefaultColumnGroup = {"height":"30px", "labelWidth":"200px", "columnWidth":(($(window).width() / 2) - 100) + "px", "columnPerRow":1, "showTitle":false, "showColumnLabel":true, "label":"Text", "columns":[]};
                    var nestedDefaultColumnGroup = {"height":"auto", "labelWidth":"200px", "columnWidth":(($(window).width() / 2) - 25) + "px", "columnPerRow":1, "showTitle":false, "showColumnLabel":false, "label":"Nested", "columns":[]};
                    var richTextArea = {"height":"auto", "labelWidth":"200px", "columnWidth":($(window).width() / 2) + "px", "columnPerRow":1, "showTitle":false, "showColumnLabel":true, "label":"RichText Area", "columns":[]};
                    metadata.columngroups = angular.copy(metadata.columngroupsclone);

                    AppUtil.pushIfNotExists(richTextArea, "columngroups", $scope.view.metadata, "label");
                    AppUtil.pushIfNotExists(defaultColumnGroup, "columngroups", $scope.view.metadata, "label");
                    AppUtil.pushIfNotExists(textareaDefaultColumnGroup, "columngroups", $scope.view.metadata, "label");
                    AppUtil.pushIfNotExists(nestedDefaultColumnGroup, "columngroups", $scope.view.metadata, "label");
                    AppUtil.pushIfNotExists(textDefaultColumnGroup, "columngroups", $scope.view.metadata, "label");
                    var columnGroups = metadata.columngroups;
                    var panelColumns = [];
                    for (var i = 0; i < metadata.columns.length; i++) {
                        var column = metadata.columns[i];
                        if (!column[SHOW_ON_PANEL]) {
                            continue;
                        }
                        if (column.pexpression) {
                            continue;
                        }
                        column = angular.copy(column);
                        column[UI] = (column[UI_PANEL] === undefined || column[UI_PANEL].toString().trim().length == 0) ? column[UI] : column[UI_PANEL];
                        column[VISIBLE_EXPRESSION] = (column[VISIBLE_EXPRESSION_PANEL] === undefined || column[VISIBLE_EXPRESSION_PANEL].toString().trim().length == 0) ? column[VISIBLE_EXPRESSION] : column[VISIBLE_EXPRESSION_PANEL];
                        column[EDITABLE_EXPRESSION] = (column[EDITABLE_EXPRESSION_PANEL] === undefined || column[EDITABLE_EXPRESSION_PANEL].toString().trim().length == 0) ? column[EDITABLE_EXPRESSION] : column[EDITABLE_EXPRESSION_PANEL]
                        panelColumns.push(column);
                    }
                    metadata[SEQUENCE] = (metadata[SEQUENCE_PANEL] === undefined) ? metadata[SEQUENCE] : metadata[SEQUENCE_PANEL];

                    var panelColumns = $scope.getPanelColumnWithSequence(panelColumns, metadata[SEQUENCE]);
                    var data = AppUtil.resolve($scope, $scope.view.metadata.dataExpression);
                    if (data instanceof Array) {
                        if (data.length == 0) {
                            $dataModel.insert($scope[COMPONENT_ID]);
                        }
                        $scope.row = data[0];
                    } else {
                        $scope.row = data;
                    }
                    $dataModel.populateFlexField($scope.view.metadata, $scope.row, panelColumns, false);

                    for (var i = 0; i < panelColumns.length; i++) {
                        var column = panelColumns[i];

                        if (column[UI] == UI_TYPE_AUTO_INCREMENT) {
                            var sereisColumn = angular.copy(column);
                            var compositeColumn = angular.copy(column);

                            sereisColumn.expression = sereisColumn.expression + ".series";
                            if (sereisColumn.seriesautosave) {
                                sereisColumn.ui = UI_TYPE_LOOK_UP;
                                sereisColumn.lookupdisplaycolumns = [
                                    {expression:"series", type:UI_TYPE_STRING}
                                ];
                                sereisColumn.table = {id:"series__baas"};
                            } else {
                                sereisColumn.ui = UI_TYPE_STRING;
                            }

                            sereisColumn.label = sereisColumn.label + " Series";
                            sereisColumn[VISIBLE_EXPRESSION] = "this._insert";
                            compositeColumn.expression = compositeColumn.expression + ".composite";
                            compositeColumn.ui = UI_TYPE_STRING;
                            compositeColumn[VISIBLE_EXPRESSION] = "!this._insert";
                            panelColumns.splice(i, 1);
                            panelColumns.splice(i, 0, sereisColumn);
                            panelColumns.splice(i, 0, compositeColumn);

                        }

                    }


                    var columnGroupsCount = columnGroups ? columnGroups.length : 0;


                    for (var i = 0; i < panelColumns.length; i++) {
                        var column = panelColumns[i];
                        var filterExp = column.expression;
                        if (column.ui == UI_TYPE_COMPOSITE_LOOK_UP) {
                            filterExp += ".type";
                        }
                        if (!($dataModel.isFilterApplied(filterExp, $scope.view.metadata.filterparameters)) && $dataModel.isFilterApplied(filterExp, $scope.view.metadata.filter)) {
                            continue;
                        }


                        var columnType = column[UI];

                        if (!column.columngroup) {
                            if (columnType == UI_TYPE_TEXT) {
                                column.columngroup = "Text";
                            } else if (columnType == UI_TYPE_AUTO_HEIGHT || (column.multiple && (columnType != 'object') && columnType != UI_TYPE_TABLE)) {
                                column.columngroup = "Textarea";
                            } else if (column[UI] == UI_TYPE_TABLE) {
                                column.columngroup = "Nested";
                            } else if (columnType == UI_TYPE_RICHTEXT) {
                                column.columngroup = "RichText Area";
                            } else {
                                column.columngroup = "Default";
                                column.colGroupMaxWidth = "350px";
                            }
                        }

                        AppUtil.populateColumn(column, $scope.view.metadata.type, "row", false, false, $scope, $dataModel);
                        var columnGroupExist = false;
                        for (var j = 0; j < columnGroupsCount; j++) {
                            var columnGroup = columnGroups[j];
                            if (!columnGroup.columnPerRow) {
                                columnGroup.columnPerRow = 1;
                            }
                            if (!columnGroup.height) {
                                columnGroup.height = "30px";
                            }
                            if (!columnGroup.labelWidth) {
                                columnGroup.labelWidth = "200px";
                            }
                            if (!columnGroup.columns) {
                                columnGroup.columns = [];
                            }
                            var label = columnGroup.label;
                            if (column.columngroup && label == column.columngroup) {
                                AppUtil.pushIfNotExists(column, "columns", columnGroup, "expression");
                                columnGroupExist = true;
                                break;
                            }
                        }
                        if (!columnGroupExist) {
                            delete column.columngroup;
                            defaultColumnGroup.columns.push(column);
                        }
                    }
                    for (var k = 0; k < columnGroupsCount; k++) {
                        var columnGroup = columnGroups[k];
                        var columns = columnGroup.columns;
                        if (!columns || columns.length == 0) {
                            columnGroups.splice(k, 1);
                            k -= 1;
                            columnGroupsCount -= 1;
                        }
                    }

                    $dataModel.setCurrentRow($scope[COMPONENT_ID], $scope.row);
                    if (metadata.refreshonload) {
                        $dataModel.refresh($scope.view[COMPONENT_ID]);
                    }
                    var panel = '<div class="app-container">' +
                        '<div class="app-wrapper">' +
                        "<div class='app-overflow-auto' ng-class=\"{'app-wrapper-child':view.showas != 'popup' && !view.metadata.embedPanel}\">" +
                        '<div ng-bind-html-unsafe="popUpToolBar"></div>' + // Tool Bar for panel view
                        '<app-column-group ng-repeat="columnGroup in view.metadata.columngroups"></app-column-group>' +
                        '<app-bar ng-init="actions=view.metadata.footeractions" ></app-bar>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    iElement.append(($compile)(panel)($scope));
                    $timeout(function () {
                        if ($(iElement).find('input[type=text],textarea').length > 0) {
                            $(iElement).find('input[type=text],textarea')[0].focus();
                        }
                        AppUtil.handleToolBarHeight();
                    }, 0)

                }
            }
        }
    }
}]);
appStrapDirectives.directive("appDatepicker", ["$compile" , '$viewStack', function ($compile, $viewStack) {
    return {
        restrict:'E',
        template:"<div class='app-height-full'></div>",
        scope:true,
        replace:true,
        compile:function () {
            return{
                post:function ($scope, iElement, attrs) {
                    if (!attrs.format) {
                        attrs.format = 'dd/mm/yyyy';
                    }
                    if (!attrs.serverformat) {
                        attrs.serverformat = SERVER_DATE_FORMAT;
                    }
                    var showWhenComponent = attrs.schedule;
                    var modelExpression = attrs.model;
                    var fieldExpression = attrs.field;
                    $scope.schedule = false;
                    var toBind = modelExpression + "." + fieldExpression;
                    var placeholder = attrs.placeholder;
                    if (placeholder == false || placeholder == 'false') {
                        placeholder = '';
                    } else if (placeholder === undefined || placeholder == true || placeholder == 'true') {
                        placeholder = fieldExpression;
                    }
                    if (showWhenComponent || showWhenComponent === 'true') {
                        toBind += '.duedate';
//                        if (placeholder === undefined || placeholder == true || placeholder == 'true') {
                        placeholder = 'Start Date';
//                        }
                    }
                    var dateValue = AppUtil.resolve($scope, toBind);
                    toBind += "__formatteddate";
                    if (dateValue) {
                        AppUtil.putDottedValue($scope, toBind, AppUtil.getDate(dateValue, attrs.format));
                    }
                    AppUtil.rebindFieldExpression($scope, modelExpression, fieldExpression);
                    var border = attrs.border;
                    var scheduleClass = 'app-position-absolute'; // default on table
                    if (border === undefined || border == true || border == 'true') {  // means show on panel
                        border = true;
                        scheduleClass = 'app-position-fixed';
                    } else {
                        border = false;    // means show on table
                    }
                    $scope.model = attrs.model;
                    $scope.field = attrs.field;
                    $scope.borderonpopup = attrs.borderonpopup;
                    var dateTemplate = "<div class='app-grid-datepicker-parent app-height-full app-width-full' ng-class=\"{'app-border':" + border + "}\">" +
                        '<input type="text" class="app-grid-date-picker-input" ng-model-onblur ng-model="' + toBind + '" placeholder="' + placeholder + '" >' +
                        '<input type="text" data-toggle="datepicker" class="app-grid-date-picker-calender-image" tabindex="-1" ng-click="schedule = false" ng-class=\'{"app-right-thirty-px":' + showWhenComponent + '}\'/>' +
                        '<input type="text" ng-show="' + showWhenComponent + '" class="app-schedule-image" tabindex="-1" ng-click="schedule = !schedule"/>' +
                        '</div>';
                    if (showWhenComponent || showWhenComponent === 'true') {
                        var scheduleClass = 'app-position-absolute';
                        if ($scope.view.metadata.type == 'panel') {
                            scheduleClass = 'app-position-fixed';
                        }
                        dateTemplate += '<app-schedule class="app-float-left app-width-full ' + scheduleClass + '" ng-show="schedule" style="z-index:25;"></app-schedule>';
                    }
                    dateTemplate += "<div id='{{componentid}}_{{$index}}_" + toBind + "'></div>";
                    $(iElement).append($compile(dateTemplate)($scope));
                    var dateInputElement = angular.element(iElement).find('input');
                    dateInputElement = dateInputElement[0];
                    dateInputElement = $(dateInputElement);
                    var viewMode = 0;
                    if (attrs.viewmode && attrs.viewmode.length > 0) {
                        viewMode = attrs.viewmode;
                    }
                    dateInputElement.datepicker({autoclose:true, format:attrs.format, minViewMode:viewMode});
                    dateInputElement.bind('change', function (e) {
                        var val = dateInputElement.val();
                        var formattedDate = val;
                        var serverDate = val;
                        try {
                            val = Date.parse(val);
                            serverDate = val.getFormattedDate(attrs.serverformat);
                            formattedDate = val.getFormattedDate(attrs.format);
                        } catch (e) {
                            /*ignore exception*/
                        }

                        var model = $scope.modelexpression;
                        var field = $scope.fieldexpression;
                        if (showWhenComponent || showWhenComponent === 'true') {
                            model = model + "." + field;
                            field = "duedate";
                        }
                        var modelTemp = AppUtil.getModel($scope, model, true);
                        modelTemp[field] = serverDate;
                        modelTemp[field + "__formatteddate"] = formattedDate;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                    dateInputElement.on('changeDate', function (e) {
                            var model = $scope.modelexpression;
                            var field = $scope.fieldexpression;
                            if (showWhenComponent || showWhenComponent === 'true') {
                                model = model + "." + field;
                                field = "duedate";
                            }
                            var modelTemp = AppUtil.getModel($scope, model, true);
                            modelTemp[field] = e.date.getFormattedDate(attrs.serverformat);
                            modelTemp[field + "__formatteddate"] = e.date.getFormattedDate(attrs.format);
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    );
                }
            }
        }
    }
}]);
appStrapDirectives.directive('appColumnHolder', [
    '$compile', '$viewStack', '$dataModel',
    function ($compile, $viewStack, $dataModel) {
        return {
            restrict:'E',
            replace:true,
            compile:function () {
                return  {

                    post:function ($scope, iElement) {
                        var visibleExpression = $scope.col[VISIBLE_EXPRESSION];
                        var editableExpression = $scope.col[EDITABLE_EXPRESSION];
                        if (visibleExpression && visibleExpression !== undefined && visibleExpression.toString().length > 0 && visibleExpression.indexOf('this') >= 0) {
                            visibleExpression = visibleExpression.replace(/this./g, "row.");
                        }
                        if (editableExpression && editableExpression !== undefined && editableExpression.toString().length > 0 && editableExpression.indexOf('this') >= 0) {
                            editableExpression = editableExpression.replace(/this./g, "row.");
                        }
                        var template = "<div  ";
                        if (visibleExpression !== undefined && visibleExpression.toString().length > 0) {
                            template += ' ng-show="' + visibleExpression + '" ';
                        }
                        template += '>';

                        var columnType = $scope.col[UI];
                        var colPerRow = $scope.columnGroup.columnPerRow;
                        var height = $scope.columnGroup.height || "30px";
                        var columnWidth = $scope.columnGroup.columnWidth;
                        var hardCoreColumnWidth = false;
                        var showColumnLabel = $scope.columnGroup.showColumnLabel;
                        var columnGroupType = $scope.columnGroup.type;


                        if (columnType == UI_TYPE_TEXT || ($scope.col.multiple && $scope.col[UI] != UI_TYPE_TABLE ) || (columnType == UI_TYPE_STRING && columnType == UI_TYPE_AUTO_HEIGHT && $scope.col.columngroup == 'Textarea')) {
                            colPerRow = 1;
                            height = "auto";
                            columnWidth = (($(window).width() / 2) - 100);
                            $scope.col.colGroupMaxWidth = ($(window).width() / 2) + "px";
                            hardCoreColumnWidth = true;
                        } else if ($scope.col[UI] == UI_TYPE_TABLE) {
                            colPerRow = 1;
                            height = "auto";
                            columnWidth = $(window).width() - 30;
//                            columnWidth = "100%";
                            hardCoreColumnWidth = true;
                            showColumnLabel = false;
                            $scope.col.colGroupMaxWidth = "100%";
                        } else if (columnType == UI_TYPE_RICHTEXT || (columnType == UI_TYPE_STRING && columnType == UI_TYPE_RICHTEXT && $scope.col.columngroup == 'RichText Area')) {
                            colPerRow = 1;
                            height = "auto";
                            columnWidth = ($(window).width() / 2);
                            $scope.col.colGroupMaxWidth = ($(window).width() / 2) + "px";
                            hardCoreColumnWidth = true;
                        } else if (columnType == UI_TYPE_STRING && columnType == UI_TYPE_TEXT && $scope.col.columngroup == 'Text') {
                            colPerRow = 1;
                            height = "30px";
                            columnWidth = ($(window).width() / 2);
                            $scope.col.colGroupMaxWidth = ($(window).width() / 2) + "px";
                            hardCoreColumnWidth = true;
                        } else {
                            $scope.col.colGroupMaxWidth = "350px";
                        }
                        if (columnGroupType && columnGroupType == 'Flow Panel') {
                            if (!$scope.columnGroup.columnWidth) {
                                $scope.columnGroup.columnWidth = 200;
                                columnWidth = 200;
                            } else {
                                columnWidth = $scope.columnGroup.columnWidth;
                            }

                        }

                        if (columnGroupType && columnGroupType == 'Flow Panel') {
                            template += '<div style="width:{{columnGroup.columnWidth}}px;padding:2px 5px;"' + ' class="app-float-left cell-width">' +
                                '<div title="{{col.label}}"  ' +
                                'class="app-font-weight-bold app-overflow-hiiden app-white-space-nowrap app-color-blue app-float-left"  ' +
                                'style="height:20px;width:{{columnGroup.columnWidth}}px;font-size:13px;"' +
                                'ng-class=\'{"app-padding-zero": view.metadata.resized === undefined || view.metadata.resized == false,"app-panel-padding":view.metadata.resized,"app-padding-top-zero-important":view.metadata.embedPanel}\'>' +
                                '{{col.label}}<span ng-show="col.mandatory">*</span>&nbsp;:';
                        } else {
                            template += '<div style="width:{{(100/' + colPerRow + ')-1}}%;padding:2px 0px;"' + ' class="app-float-left cell-width" ng-class=\'{"app-full-width-important":col.ui=="table"}\'>' +
                                '<div title="{{col.label}}" ng-show="' + showColumnLabel + '"  ' +
                                'class="app-font-weight-bold {{alignclass}} app-overflow-hiiden app-white-space-nowrap app-color-blue app-float-left"  ' +
                                'style="height:20px;width:{{columnGroup.labelWidth}};min-width:200px;font-size:13px;padding-left:5px;" ' +
                                'ng-class=\'{"app-width-full-important app-padding-zero": view.metadata.resized === undefined || view.metadata.resized == false,"app-panel-for-pop-up":view.showas == "popup","app-panel-padding":view.metadata.resized,"app-width-full-important app-padding-top-zero-important":view.metadata.embedPanel}\'>' +
                                '{{col.label}}<span ng-show="col.mandatory">*</span>&nbsp;:';
                        }


                        if ($scope.col.defaultexpression !== undefined && $scope.col.defaultexpression.length > 0) {
                            var exp = "row." + $scope.col.expression.replace(/\./g, '_') + "_showLoading";
                            if ($scope.col[UI] == UI_TYPE_TABLE) {
                                $scope.toolBarLoading = ($compile)('<img class="app-tool-bar-loading" src="../images/loading.gif" ng-show="' + exp + '">')($scope);
                            } else {
                                template += '<img style="width:11px;padding-left:5px;" src="../images/loading.gif" ng-show="' + exp + '">';
                            }
                        }
                        template += '</div>';
                        template += '<div style="';

                        if (hardCoreColumnWidth) {
                            template += "width:" + columnWidth + "px;";
                        } else {
                            template += "width:{{columnGroup.columnWidth}}px;";
                        }

                        if (columnGroupType && columnGroupType == 'Flow Panel') {
                            template += ' " class="app-float-left">';
                        } else {
                            template += 'padding-left:5px;max-width:{{col.colGroupMaxWidth}};position:relative;" class="app-float-left" ng-class=\'{"app-width-full-important": view.metadata.resized === undefined || view.metadata.resized == false || view.metadata.embedPanel,"app-panel-for-pop-up":view.showas == "popup","app-padding-zero-important":col.ui=="table"}\'>';
                        }
                        template += "<app-column ng-init='colmetadata=col' class='app-float-left ";
                        if (!$scope.col.noBorder) {
                            template += "app-border-box-shadow";
                        }
                        if (columnGroupType && columnGroupType == 'Flow Panel') {
                            if ($scope.col[UI] == UI_TYPE_RICHTEXT || $scope.col[UI] == UI_TYPE_AUTO_HEIGHT) {
                                height = 'auto';
                            }
                            template += " ' ng-class='isValidColumn(row,col)' style='height:" + height + ";width:100%;min-height:30px;'";
                        } else {
                            template += " ' ng-class='isValidColumn(row,col)' style='height:" + height + ";min-width:200px;width:100%;max-width:100%;min-height:30px;'";
                        }

                        if (editableExpression !== undefined && editableExpression.toString().length > 0) {
                            template += ' ng-show="' + editableExpression + '" ';
                        }
                        template += " ></app-column>";
                        if (editableExpression !== undefined && editableExpression.toString().length > 0) {
                            template += '<div style="min-width:200px;min-height:25px;padding-top:5px;" ng-bind="getColumnValue(row,col,false);" ng-show="!(' + editableExpression + ')" ng-class=\'{"app-height-nineteen": view.showas == "popup","app-text-align-right": col.ui == "currency"}\'></div>';
                        }
                        template += "</div></div></div>";
                        if ($scope.columnGroup.separator && ($scope.$index == ($scope.columnGroup.columns.length - 1))) {
                            template += "<hr class='app-color-black app-float-left app-width-full'>";
                        }
                        iElement.append($compile(template)($scope));
                    },
                    pre:function ($scope) {
                        $scope.resize = function () {
                            if ($scope.view[SHOW_AS] == 'popup' && $scope.col[UI] == UI_TYPE_TABLE) {
                                $scope.nestedViewWidth = ($(window).width() / 2) - 100;
                                $('#innernestedtable_' + $scope[COMPONENT_ID]).width($scope.nestedViewWidth);
                                return;
                            }

                            if ($scope.view.metadata.resized && !$scope.view.metadata.embedPanel) {
                                if ($scope.col[UI] == UI_TYPE_TABLE && $scope.view[SHOW_AS] != 'popup') {
                                    $scope.nestedViewWidth = ($(window).width()) - 30;
                                    $('#innernestedtable_' + $scope[COMPONENT_ID]).width($scope.nestedViewWidth);

                                }
                                var labelWidth = $scope.columnGroup.labelWidth;
                                if (!labelWidth) {
                                    labelWidth = "200px";
                                }
                                if (labelWidth && labelWidth.indexOf('px') >= 0) {
                                    labelWidth = labelWidth.substring(0, (labelWidth.length - 2));
                                    labelWidth = parseInt(labelWidth);
                                }
                                if ($scope.columnGroup.type === undefined) {
                                    if ($scope.columnGroup.columnPerRow == 1) {
                                        $scope.columnGroup.columnWidth = $(window).width() / $scope.columnGroup.columnPerRow;
                                    } else {
                                        var parentWidth = ($(window).width() - 100) / $scope.columnGroup.columnPerRow;
                                        $scope.columnGroup.columnWidth = (parentWidth) - labelWidth;
                                    }
                                }

                                $scope.alignclass = 'app-text-align-right';
                                if ($scope.col[UI] == UI_TYPE_TABLE) {

                                    var view = $viewStack.views[$scope.componentid];
                                    if (view && view[CHILD_COMPONENT_ID]) {
                                        for (var i = 0; i < view[CHILD_COMPONENT_ID].length; i++) {
                                            var childId = view[CHILD_COMPONENT_ID][i];
                                            var scope = $dataModel.getScope(childId);
                                            if (scope) {
                                                if (scope.view.metadata.panelView) {
                                                    var id = $('#nestedTable_' + childId);
                                                    var panelId = $('#' + scope.view.metadata.panelElementId);
                                                    id.css({display:"table-cell"});
                                                    panelId.css({display:"table-cell"});
                                                    scope.nestedViewWidth = ($(window).width() / 2) - 30;
                                                    $('#innernestedtable_' + $scope[COMPONENT_ID]).width(scope.nestedViewWidth);
                                                } else {
                                                    scope.nestedViewWidth = $(window).width() - 30;
                                                    $('#innernestedtable_' + $scope[COMPONENT_ID]).width(scope.nestedViewWidth);
                                                }
                                            }
                                        }
                                    } else {
                                        $scope.nestedViewWidth = ($(window).width()) - 30;
                                        $('#innernestedtable_' + $scope[COMPONENT_ID]).width($scope.nestedViewWidth);
                                    }
                                }
                            } else {
                                $scope.alignclass = 'app-text-align-left';
                                if ($scope.col[UI] == UI_TYPE_TABLE && $scope.view[SHOW_AS] != 'popup') {
                                    $scope.nestedViewWidth = ($(window).width() / 2) - 30;
                                    $('#innernestedtable_' + $scope[COMPONENT_ID]).width($scope.nestedViewWidth);

                                }

                                var view = $viewStack.views[$scope.componentid];
                                if (view && view[CHILD_COMPONENT_ID]) {
                                    for (var i = 0; i < view[CHILD_COMPONENT_ID].length; i++) {
                                        var childId = view[CHILD_COMPONENT_ID][i];
                                        var scope = $dataModel.getScope(childId);
                                        if (scope) {
                                            if (scope.view.metadata.panelView) {
                                                var id = $('#nestedTable_' + childId);
                                                id.css({display:"table-row"});
                                                scope.nestedViewWidth = ($(window).width() / 2) - 30;
                                                $('#innernestedtable_' + $scope[COMPONENT_ID]).width(scope.nestedViewWidth);
                                            } else {
                                                scope.nestedViewWidth = ($(window).width() / 2) - 30;
                                                $('#innernestedtable_' + $scope[COMPONENT_ID]).width(scope.nestedViewWidth);
                                            }
                                        }
                                    }
                                } else {
                                    $scope.nestedViewWidth = $(window).width() - 30;
                                    $('#innernestedtable_' + $scope[COMPONENT_ID]).width($scope.nestedViewWidth);
                                }
                            }
                        }
                        $(window).resize(function () {
                            $scope.resize();
                        });
                        $scope.$watch("view.metadata.resized", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue)) {
                                $scope.resize();
                            }
                        }, true)
                        $scope.resize();
                    }
                };
            }
        };
    }
]);

appStrapDirectives.directive('appColumn', [
    '$compile',
    function ($compile) {
        return {
            restrict:'E',
            replace:true,
            scope:true,
            compile:function () {
                return  {
                    pre:function ($scope, iElement) {
                    },
                    post:function ($scope, iElement) {
                        var column = $scope.colmetadata;
                        var html = column.editableCellTemplate;
                        var cellElement = $compile(html)($scope);
                        var width = column.width;
                        if (!width) {
                            width = 200;
                        }
                        var height = column.height;
                        if (column[UI] != UI_TYPE_TABLE) {
                            if (height) {
                                $(cellElement).height(height);
                            }
                        }
                        iElement.append(cellElement);
                    }

                };
            }
        };
    }
]);

appStrapDirectives.directive('appColumnFilter', [
    '$compile',
    function ($compile) {
        return {
            restrict:'E',
            replace:true,
            scope:true,
            compile:function () {
                return  {
                    pre:function ($scope, iElement) {
                    },
                    post:function ($scope, iElement) {
                        var column = $scope.colmetadata;
                        var html = column.filterEditCellTemplate;
                        if (column[UI] == UI_TYPE_SCHEDULE || column[UI] == UI_TYPE_DATE || column[UI] == UI_TYPE_COMPOSITE_LOOK_UP) {
                            iElement.width(150);
                        }
                        var cellElement = $compile(html)($scope);
                        iElement.append(cellElement);
                        iElement.height(24);
                    }

                };
            }
        };
    }
]);
appStrapDirectives.directive('appNumber', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-number-container app-height-full app-width-full'></div>",
        compile:function () {
            return  {
                pre:function ($scope, element) {
                },
                post:function ($scope, element, attrs) {
                    var modelExpression = attrs.model;
                    var fieldExpression = attrs.field;
                    var toBind = modelExpression + "." + fieldExpression;
                    var placeholder = attrs.placeholder;
                    if (placeholder == false || placeholder == 'false') {
                        placeholder = '';
                    } else if (placeholder == true || placeholder == "true" || placeholder == undefined) {
                        placeholder = fieldExpression;
                    }
                    var border = attrs.border;
                    if (border === undefined || border == true || border == 'true') {
                        border = true
                    } else {
                        border = false;
                    }

                    var html = "<input type='text' ng-model-onblur ng-model='" + toBind + "' ng-change='operatorValidation()' ng-click='operatorValidation()' placeholder='" + placeholder + "' ng-class=\"{'app-border':" + border + "}\"/>";
                    element.append($compile(html)($scope));
                    $scope.operatorValidation = function (event) {
                        var model = AppUtil.getModel($scope, $scope.modelexpression, true);
                        var val = model[$scope.fieldexpression];
                        if (!(val == "+" || val == "-")) {
                            if (!Number(val)) {
                                model[$scope.fieldexpression] = "";
                            }
                        }
                    }
                    /*-- for preventing the Alphabets and special characters to be printed--*/
                    element.bind("keydown", function (event) {
                            var model = AppUtil.getModel($scope, $scope.modelexpression, true);
                            var val = model[$scope.fieldexpression];
                            var i = event.which;
//65 - A  to  90-Z
                            if ((i >= 65 && i <= 90) || (i >= 186 && i <= 189) || (i == 111) || (i == 106) || (i >= 191 && i <= 192) || (i >= 219 && i <= 222) || (i == 32)) {
                                if (!((event.ctrlKey == true && i == 65) || (event.ctrlKey == true && i == 67) || (event.ctrlKey == true && i == 86) || (event.ctrlKey == true && i == 88))) {
                                    event.preventDefault();
                                }
                            }
                            else {
                                if (i == 110 || i == 190) {
                                    if (val.indexOf(".") != -1) {
                                        event.preventDefault();
                                    }
                                }

                                if (i == 107 || i == 109) {
                                    if (val !== undefined && val.toString().length > 0) {
                                        event.preventDefault();
                                    }
                                }
                            }
                        }
                    )
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appDuration', [
    '$compile',
    function ($compile) {
        return {
            restrict:"E",
            replace:true,
            scope:true,
            template:"<div class='app-height-full'></div>",
            compile:function () {
                return {

                    pre:function ($scope, iElement, attrs) {
                        $scope.ds = ["Hrs", "Minutes"];
                        var modelExpression = attrs.model;
                        var fieldExpression = attrs.field;
                        var model = modelExpression + "." + fieldExpression;
                        var border = attrs.border;
                        var placeholder = attrs.placeholder;
                        if (border === undefined || border == true || border == 'true') {
                            border = true
                        } else {
                            border = false;
                        }
                        var appNumberPlaceholder = false;
                        var appLookUpPlaceholder = false;
                        if (placeholder == false || placeholder == "false") {
                            appNumberPlaceholder = '';
                            appLookUpPlaceholder = '';
                        } else {
                            appNumberPlaceholder = 'Time';
                            appLookUpPlaceholder = 'Unit';
                        }
                        var template = "<div class='app-position-relative app-width-full app-height-full' ng-class=\"{'app-border':" + border + "}\">" +
                            "<app-number model='" + model + "' field='time' " +
                            "class='app-position-absolute app-height-full app-left-zero' style='right:60px;' placeholder='" + appNumberPlaceholder + "' border=false>" +
                            "</app-number>" +
                            "<app-lookup model='" + model + "' field='timeunit' border=false datasource='ds' " +
                            "class='app-left-border app-position-absolute app-height-full app-right-zero' style='width:60px;' placeholder='" + appLookUpPlaceholder + "'>" +
                            "</app-lookup>" +
                            "</div>"
                        $(iElement).append(($compile)(template)($scope));
                    }
                }
            }
        }
    }
]);
appStrapDirectives.directive('appCurrency', [
    '$compile', '$dataModel',
    function ($compile, $dataModel) {
        return {
            restrict:"E",
            replace:true,
            scope:true,
            template:"<div class='app-height-full'></div>",
            compile:function () {
                return {

                    pre:function ($scope, iElement, attrs) {
                        $scope.ds = new $dataModel.getLookupDataSource({"lookupdisplaycolumns":[
                            {expression:"currency"}
                        ], table:"currencies__baas", ask:"baas", "componentid":$scope[COMPONENT_ID]});
                        var modelExpression = attrs.model;
                        var fieldExpression = attrs.field;
                        var model = modelExpression + "." + fieldExpression;
                        var border = attrs.border;
                        if (border === undefined || border == true || border == 'true') {
                            border = true
                        } else {
                            border = false;
                        }
                        var placeholder = attrs.placeholder;
                        var appNumberPlaceholder = false;
                        var appLookUpPlaceHolder = false;
                        if (placeholder == false || placeholder == 'false') {
                            appNumberPlaceholder = '';
                            appLookUpPlaceHolder = '';
                        } else {
                            appNumberPlaceholder = 'Amount';
                            appLookUpPlaceHolder = 'Curr';
                        }

                        var template = "<div class='app-position-relative app-width-full app-height-full' ng-class=\"{'app-border':" + border + "}\">" +
                            "<app-number model='" + model + "' field='amount' " +
                            "class='app-position-absolute app-height-full app-left-zero' style='right:60px;' placeholder='" + appNumberPlaceholder + "' border=false>" +
                            "</app-number>" +
                            "<app-lookup model='" + model + "' field='type' display='currency' border=false datasource='ds' " +
                            "class='app-left-border app-position-absolute app-height-full app-right-zero' style='width:60px;' placeholder='" + appLookUpPlaceHolder + "'>" +
                            "</app-lookup>" +
                            "</div>"
                        $(iElement).append(($compile)(template)($scope));
                    }
                }
            }
        }
    }
]);
appStrapDirectives.directive('appUnit', [
    '$compile', '$dataModel',
    function ($compile, $dataModel) {
        return {
            restrict:"E",
            replace:true,
            scope:true,
            template:"<div class='app-height-full'></div>",
            compile:function () {
                return {
                    pre:function ($scope, iElement, attrs) {
                        $scope.ds = new $dataModel.getLookupDataSource({"lookupdisplaycolumns":[
                            {expression:"unit"}
                        ], table:"unitmeasures__baas", ask:"baas", "componentid":$scope[COMPONENT_ID]});
                        var modelExpression = attrs.model;
                        var fieldExpression = attrs.field;
                        var model = modelExpression + "." + fieldExpression;
                        var border = attrs.border;
                        if (border === undefined || border == true || border == 'true') {
                            border = true
                        } else {
                            border = false;
                        }
                        var placeholder = attrs.placeholder;
                        var appNumberPlaceholder = false;
                        var appLookUpPlaceHolder = false;
                        if (placeholder == false || placeholder == 'false') {
                            appNumberPlaceholder = '';
                            appLookUpPlaceHolder = '';
                        } else {
                            appNumberPlaceholder = 'Quantity';
                            appLookUpPlaceHolder = 'Unit';
                        }
                        var template = "<div class='app-position-relative app-width-full app-height-full' ng-class=\"{'app-border':" + border + "}\">" +
                            "<app-number model='" + model + "' field='quantity' " +
                            "class='app-position-absolute app-height-full app-left-zero' style='right:60px;' placeholder='" + appNumberPlaceholder + "' border=false>" +
                            "</app-number>" +
                            "<app-lookup model='" + model + "' field='unit' display='unit' border=false datasource='ds' " +
                            "class='app-left-border app-position-absolute app-height-full app-right-zero' style='width:60px;' placeholder='" + appLookUpPlaceHolder + "'>" +
                            "</app-lookup>" +
                            "</div>"
                        $(iElement).append(($compile)(template)($scope));
                    }
                }
            }
        }
    }
]);
appStrapDirectives.directive('appConfirmation', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div>" +
            "<div class='app-width-full app-float-left app-header-background-color app-text-align-center app-font-weight-bold' style='line-height: 35px;' ng-bind='confirmationoptions.title'></div>" +
            "<div class='app-float-left app-width-full app-text-align-center' style='padding: 15px 0px;line-height: 20px;' ng-bind-html-unsafe='confirmationoptions.body'>" +
            "</div>" +
            "<div class='app-float-left app-width-full app-text-align-center'>" +
            "<span ng-repeat='option in confirmationoptions.options'>" +
            "<div class='app-button app-button-border app-button-margin app-button-shadow app-button-padding' ng-click='onConfirmClick(option)' ng-bind='option'></div>" +
            "</span>" +
            "</div>" +
            "</div>",
        compile:function () {
            return  {
                post:function ($scope, iElement, attrs) {
                    $scope.onConfirmClick = function (option) {
                        if (attrs.onconfirm) {
                            $scope[attrs.onconfirm](option);
                        }
                    }
                }
            }
        }
    }
}]);
appStrapDirectives.directive('appTime', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return  {
                pre:function ($scope, element) {
                },
                post:function ($scope, element, attrs) {
                    var placeholder = "HH:MM AM";
                    if (attrs.placeholder == "false" || attrs.placeholder == false) {
                        placeholder = '';
                    }
                    var border = attrs.border;
                    if (border === undefined || border == true || border == 'true') {
                        border = true
                    } else {
                        border = false;
                    }
                    $scope.dataSourceTime = ["00:00 AM", "00:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
                        "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM", "6:00 AM",
                        "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM",
                        "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
                        "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM",
                        "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM",
                        "10:30 PM", "11:00 PM", "11:30 PM"];
                    var apptimeTemplate = "<div class='app-float-left app-width-full app-height-full'>" +
                        "<app-lookup border=" + border + " style='float: left;width:100%;height:100%;' " +
                        "datasource='dataSourceTime' model='" + attrs.model + "' field='" + attrs.field +
                        "' placeholder='" + placeholder + "'>" +
                        "</app-lookup></div>";
                    var elem = $compile(apptimeTemplate)($scope);
                    $(element).append(elem);
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appFileUpload', ['$compile', function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return {
                pre:function ($scope, iElement, attrs) {
                    var modelExp = attrs.model;
                    var fieldExp = attrs.field;
                    var multiple = attrs.multiple;
                    if (multiple == "false" || multiple == 'undefined') {
                        multiple = false;
                    } else if (multiple == "true") {
                        multiple = true;
                    }
                    var toBind = modelExp + "." + fieldExp;
                    AppUtil.rebindFieldExpression($scope, modelExp, fieldExp);
                    var model = AppUtil.getModel($scope, $scope.modelexpression, true);
                    var value = model[$scope.fieldexpression];
                    var length = value ? value.length : 0;
                    var zerolengthToBind = "!" + toBind + " || " + toBind + ".length==0";
                    var onelengthToBind = toBind + " && " + toBind + ".length>0";
                    var template = "";
                    var secretKey = "ask=" + $scope.view.ask;
                    if ($scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk) {
                        secretKey += "&osk=" + $scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk;
                    }
                    if (multiple) {
                        template = "<div >" +
                            "<input style='outline: none;'  class='app-float-left app-file-upload-width' type='file' />" +
                            "<div class='app-multiImage-parent' ng-show='" + onelengthToBind + "' ng-repeat='file in " + toBind + "'>" +
                            "<div  class='app-float-left' tabindex='-1'style='padding-right: 2px;' >" +
                            "<a class='app-color-black' target='_blank' ng-href='" + BAAS_SERVER + "/file/download?filekey={{file.key}}&" + secretKey + "'>{{file.name}}</a>" +
                            "</div>" +
                            "<span title='Remove' class=' app-color-black app-none-background app-cursor-pointer app-padding-five-px'ng-click='removeFile($index)'>X</span>" +
                            "</div>" +
                            "</div>";
                    } else {
                        template = "<div>" +
                            "<input ng-show='" + zerolengthToBind + "'  style='outline: none;'  class='app-float-left app-file-upload-width' type='file' />" +
                            "<div ng-show='" + onelengthToBind + "' class='app-multiImage-parent'><div  class='app-float-left' tabindex='-1'style='padding-right: 2px;'>" +
                            "<a target='_blank' class='app-color-black' ng-href='" + BAAS_SERVER + "/file/download?filekey={{" + toBind + "[0].key}}&" + secretKey + "'>{{" + toBind + "[0].name}}</a></div>" +
                            "<span title='Remove' ng-show='" + onelengthToBind + "'   class=' app-color-black app-none-background app-cursor-pointer app-padding-five-px ' ng-click='removeFile(0)'>X</span></div>" +
                            "</div>";
                    }
                    $(iElement).append($compile(template)($scope));
                    $(iElement).bind('change', function () {
                        $scope.$apply(function () {
                            $scope.oFReader = new FileReader();
                            $scope.oFile = angular.element(iElement).find('input')[0].files[0];
                            $scope.oFReader.onload = $scope.loadFile;
                            $scope.oFReader.readAsDataURL($scope.oFile);
                        });
                    });
                    $scope.removeFile = function (index) {
                        var model = AppUtil.getModel($scope, $scope.modelexpression, true);
                        model[$scope.fieldexpression].splice(index, 1);
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.showFile = function (file) {
                        if (multiple) {
                            model[$scope.fieldexpression] = model[$scope.fieldexpression] || [];
                            model[$scope.fieldexpression].push(file[0]);
                        } else {
                            model[$scope.fieldexpression] = file;
                        }
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    };
                    $scope.loadFile = function (evt) {
                        var current_file = {};
                        current_file.name = $scope.oFile.name;
                        current_file.type = $scope.oFile.type;
                        current_file.contents = evt.target.result;
                        current_file.ask = $scope.view.ask;
                        if ($scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk) {
                            current_file.osk = $scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk;
                        }
                        AppUtil.getDataFromService(BAAS_SERVER + '/file/upload', current_file, "POST", "JSON", "Uploading...", function (data) {
                            if (data != null && data != undefined && data.length > 0) {
                                $scope.showFile(data);
                            }
                        });
                    };
                }
            };
        }
    }
}]);
appStrapDirectives.directive('appSchedule', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return  {
                post:function ($scope, iElement) {
                    var model = $scope.model;
                    var field = $scope.field;
                    var frequency = 'frequency';
                    var repeatedOn = 'repeatedon';
                    var time = 'time';
                    var componentModel = model + "." + field;
                    var spanField = "span";
                    $scope.spanOptions = ["None", "Daily", "Weekly", "Monthly", "Yearly", "Hourly", "Half hourly"];
                    $scope.frequency = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
                    var spanValue = componentModel + "." + spanField;
                    $scope.$watch(spanValue, function (newValue, oldValue) {
                        if (!newValue) {
                            return;
                        }
                        if (newValue == 'Weekly') {
                            $scope.options = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
                        } else if (newValue == 'Yearly') {
                            $scope.options = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        } else if (newValue == 'Monthly') {
                            $scope.options = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
                        }
                    }, true);
                    var border = $scope.borderonpopup;
                    if (border === undefined || border == true || border == 'true') {
                        border = true
                    } else {
                        border = false;
                    }
                    var template = "<div style='z-index:1;' class='app-float-left app-white-backgroud-color app-schedule app-padding-five-px app-position-absolute' ng-class=\"{'app-border':" + border + "}\">" +
                        "<div class='app-float-left app-width-full app-padding-top-bottom-five-px'>" +
                        "<app-lookup style='width:200px;height: 30px;'" +
                        "model='" + componentModel + "' field='" + spanField + "' dataSource='spanOptions' border=true placeholder=\'Repeat\'></app-lookup>" +
                        "</div>" +
                        "<div style='width:197px;min-height: 30px;'  class='app-float-left app-width-full app-padding-top-bottom-five-px' ng-show='" + spanValue + " == \"Yearly\" || " + spanValue + " == \"Monthly\" || " + spanValue + " == \"Weekly\"'>" +
                        "<app-lookup model='" + componentModel + "' field='" + repeatedOn + "' dataSource='options' multiple=true placeholder=\'Repeat On\'></app-lookup>" +
                        "</div>" +
                        "<div style='width:200px;height: 30px;' class='app-float-left app-width-full app-padding-top-bottom-five-px' ng-show='" + spanValue + " != \"None\"'>" +
                        "<app-time model='" + componentModel + "' field='" + time + "' ></app-time>" +
                        "</div>" +
                        "<div class='app-float-left app-width-full app-padding-top-bottom-five-px' ng-show='" + spanValue + " == \"Yearly\" || " + spanValue + " == \"Monthly\" || " + spanValue + " == \"Weekly\" || " + spanValue + " == \"Hourly\"|| " + spanValue + " == \"Daily\" || " + spanValue + " == \"Half hourly\"'>" +
                        "<app-datepicker model='" + componentModel + "' field='duedate' placeholder='Start Date' style='height:30px;width:198px;' ></app-datepicker>" +
                        "</div>" +
                        "</div>";
                    $(iElement).append($compile(template)($scope))
                }
            }
        }
    }
}]);
appStrapDirectives.directive("appText", ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-height-full'></div>",
        compile:function () {
            return{
                pre:function ($scope, iElement, attrs) {
                    var model = attrs.model;
                    var field = attrs.field;
                    var toBind = model + "." + field;
                    var fieldValue = AppUtil.resolve($scope, toBind);
                    if (fieldValue && fieldValue instanceof Object) {
                        AppUtil.putDottedValue($scope, toBind, JSON.stringify(fieldValue));
                    }
                    var border = attrs.border;
                    if (border === undefined || border == true || border == 'true') {
                        border = true
                    } else {
                        border = false;
                    }
                    var placeholder = attrs.placeholder;
                    if (placeholder === undefined || placeholder == true || placeholder == 'true') {
                        placeholder = field;
                    } else if (placeholder == false || placeholder == 'false') {
                        placeholder = '';
                    }
                    var template = "<input type='text'  ng-model='" + toBind + "' ng-model-onblur  ng-class=\"{'app-border':" + border + "}\" " +
                        " class='app-border-none app-zero-padding app-zero-margin app-height-full app-width-full'" +
                        "placeholder='" + placeholder + "'/>";
                    $(iElement).append($compile(template)($scope));
                }
            }
        }
    }
}]);
appStrapDirectives.directive("appCheckbox", ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return{
                pre:function ($scope, iElement, attrs) {
                    var model = attrs.model;
                    var field = attrs.field;
                    var toBind = model + "." + field;
                    var template = "<input class='app-height-auto' style='outline: none;' type=\"checkbox\" ng-model='" + toBind + "'/>";
                    $(iElement).append($compile(template)($scope));
                }}
        }
    }
}]);
appStrapDirectives.directive('appMultipleRefrence', ['$timeout', function ($timeout) {
    'use strict';
    return {
        restrict:'E',
        scope:true,
        replace:true,
        template:"<div class='app-multirefrence-parent'>" +
            "<span ng-bind='getValue' class='app-multirefrence-text'></span>" +
            "<input type='text'  tabindex='-1' class='app-cursor-pointer multirefrence-input' title='cancel' ng-click='cancel($event)' />" +
            "</div>",
        compile:function () {
            return{
                pre:function ($scope, iElement) {
                    $scope.cancel = function ($event) {
                        var selectedIndex = ($scope.$index);
                        var model = AppUtil.getModel($scope, $scope.modelexpression, false)
                        if (model) {
                            model.splice(selectedIndex, 1);
                            $event.preventDefault();
                            $event.stopPropagation();
                        }
                    };
                    $scope.getValue = function () {
                        if ($scope.option instanceof Object) {
                            var val = AppUtil.resolve($scope.option, $scope.displayexpression);
                            return val;
                        } else {
                            return $scope.option;
                        }
                    };
                }
            };
        }
    };
}
]);
appStrapDirectives.directive('appDateFilter', ["$compile", '$viewStack' , function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        compile:function () {
            return  {
                post:function ($scope, iElement, attrs) {
                    if (!attrs.format) {
                        attrs.format = 'dd/mm/yyyy';
                    }
                    var model = attrs.model;
                    var field = attrs.field;
                    var editableFilter = attrs.editable;
                    var toBind = model + "." + field;
                    AppUtil.rebindFieldExpression($scope, model, field);
                    var placeholder = attrs.placeholder;
                    if (!placeholder) {
                        placeholder = '';
                    }

                    var leftArrowClass = 'app-date-filter-left-arrow';
                    var rightArrowClass = 'app-date-filter-right-arrow';
                    var width = "width:166px;";
                    if (editableFilter) {
                        width = "width:100px;";
                        leftArrowClass = 'app-date-filter-left-arrow-filter';
                        rightArrowClass = 'app-date-filter-right-arrow-filter';
                    }

                    var template = '<div ng-class=\'{"app-text-box-border":' + (!editableFilter) + '}\' class="input-append date datepicker app-zero-border-radius app-zero-padding app-height-full" style="position: relative;background: none repeat scroll 0 0 #FFFFFF;">' +
                        '<span class="app-vertical-align-middle app-cursor-pointer ' + leftArrowClass + '" ng-click="dateFilterNavigation(false)"></span>' +
                        "<input ng-model-onblur ng-click='showPopUp()'  ng-model='" + toBind + ".label' type='text' class='calender-input date-input' style='height: 100%;left: 21px;padding: 0;position: absolute;right: 26px; " + width + "' placeholder='" + placeholder + "'/>" +
                        '<span class="app-vertical-align-middle app-cursor-pointer ' + rightArrowClass + '" ng-click="dateFilterNavigation(true)"></span>' +
                        '<input type="text"  ng-click="hideDateFilterPopUp()" data-toggle="datepicker" class="app-grid-date-picker-calender-image app-position-absolute" tabindex="-1" style="right: 4px;"/>' +
                        "</div>";
                    $(iElement).append($compile(template)($scope));
                    var dateInputElement = angular.element(iElement).find('input');
                    dateInputElement = dateInputElement[0];
                    dateInputElement = $(dateInputElement);
                    dateInputElement.datepicker({autoclose:true, format:attrs.format});


                    dateInputElement.bind('change', function (e) {
                        var val = dateInputElement.val();
                        if (val) {
                            if (Date.parse(val)) {
                                var currentDate = Date.parse(val);

                                $scope.setSpanValue("date");
                                var firstDay = currentDate.getFormattedDate(attrs.format);
                                var nextDay = $scope.getNextDate(currentDate);
                                $scope.setValueInModel(firstDay, false, false, false, false, firstDay, nextDay);
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            } else {
                                alert("Invalid Type");
                            }
                        }
                    });

                    $scope.setSpanValue = function (spanValue) {
                        var spanExp = field + ".span";
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), spanExp, spanValue);
                    }

                    $scope.getSpanValue = function () {
                        var spanExp = field + ".span";
                        return AppUtil.resolve(AppUtil.resolve($scope, model, true, false), spanExp);
                    }

                    $scope.setLabelValue = function (labelValue) {
                        var labelExp = field + ".label";
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), labelExp, labelValue);
                    }

                    $scope.getLabelValue = function () {
                        var labelExp = field + ".label";
                        return AppUtil.resolve(AppUtil.resolve($scope, model, true, false), labelExp);
                    }


                    $scope.getFilterValue = function () {
                        var filterExp = field + ".filter";
                        return AppUtil.resolve(AppUtil.resolve($scope, model, true, false), filterExp);
                    }

                    $scope.setFilterValue = function (filterValue) {
                        var labelExp = field + ".filter";
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), labelExp, filterValue);
                    }

                    $scope.getGTEValue = function () {
                        var gteExp = field + ".$gte";
                        return AppUtil.resolve(AppUtil.resolve($scope, model, true, false), gteExp);
                    }

                    $scope.setGTEValue = function (gteValue) {
                        var gteExp = field + ".$gte";
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), gteExp, gteValue);
                    }

                    $scope.getLTValue = function () {
                        var ltExp = field + ".$lt";
                        return AppUtil.resolve(AppUtil.resolve($scope, model, true, false), ltExp);
                    }

                    $scope.setLTValue = function (ltValue) {
                        var ltExp = field + ".$lt";
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), ltExp, ltValue);
                    }


                    dateInputElement.on('changeDate', function (e) {
                        var currentDate = new Date(e.date);
                        var firstDay = currentDate.getFormattedDate(attrs.format);
                        var nextDay = $scope.getNextDate(currentDate);
                        $scope.setSpanValue("date");
                        $scope.setValueInModel(firstDay, false, false, false, false, firstDay, nextDay);

                    });

                    dateInputElement.on('keyup', function (e) {
                            var value = dateInputElement.val();
                            if (!value) {
                                AppUtil.removeDottedValue(AppUtil.resolve($scope, model, true, false), field);
                            }
                            if ($scope.dateFilterPopUp) {
                                $scope.hideDateFilterPopUp();
                            }
                        }
                    );
                    $scope.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                    var filterValue = $scope.getFilterValue();

                    if (filterValue == "{_currentweek}") {
                        var currentDate = new Date();
                        var first = currentDate.getDate() - currentDate.getDay();
                        var last = first + 6;
                        var weekFirstDay = new Date(currentDate);
                        weekFirstDay.setDate(first);
                        var weekLastDay = new Date(currentDate);
                        weekLastDay.setDate(last);
                        if(!$scope.getSpanValue()){
                            $scope.setSpanValue("week");
                        }
                        var value = weekFirstDay.getFormattedDate(attrs.format) + " - " + weekLastDay.getFormattedDate(attrs.format);
                        $scope.setLabelValue(value);
                        AppUtil.putDottedValue($scope.view.metadata.appliedfilterparameters, field + ".label", value);
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field + ".label", value);
                    } else if (filterValue == "{_currentmonth}") {
                        var value = $scope.months[new Date().getMonth()] + ', ' + new Date().getFullYear();

                        $scope.setLabelValue(value);
                        AppUtil.putDottedValue($scope.view.metadata.appliedfilterparameters, field + ".label", value);
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field + ".label", value);
                        if(!$scope.getSpanValue()){
                            $scope.setSpanValue("month");
                        }
                    } else if (filterValue == "{_CurrentDate}") {
                        var value = new Date().getFormattedDate(attrs.format);
                        $scope.setLabelValue(value);
                        AppUtil.putDottedValue($scope.view.metadata.appliedfilterparameters, field + ".label", value);
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field + ".label", value);
                        if(!$scope.getSpanValue()){
                            $scope.setSpanValue("date");
                        }
                    } else if (filterValue == "_currentyear") {
                        var value = new Date().getFullYear();
                        $scope.setLabelValue(value);
                        AppUtil.putDottedValue($scope.view.metadata.appliedfilterparameters, field + ".label", value);
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field + ".label", $scope.getLabelValue());
                        if(!$scope.getSpanValue()){
                            $scope.setSpanValue("year");
                        }
                    }


                    $scope.weekFilter = function (current) {
                        $scope.fromtopopup = false;
                        $scope.ndayspopup = false;
                        $scope.currentDatePopup = false;

                        var currentDate = new Date();
                        var first = currentDate.getDate() - currentDate.getDay();
                        var last = first + 6;
                        var weekFirstDay = new Date();
                        weekFirstDay.setDate(first);
                        var weekLastDay = new Date();
                        weekLastDay.setDate(last);
                        var nextWeekObj = new Date(weekLastDay.getFullYear(), weekLastDay.getMonth(), weekLastDay.getDate() + 1);
                        var label = weekFirstDay.getFormattedDate(attrs.format) + ' - ' + weekLastDay.getFormattedDate(attrs.format);
                        dateInputElement.val(label);
                        $scope.setValueInModel(label, false, current, false, false, weekFirstDay.getFormattedDate(attrs.format), nextWeekObj.getFormattedDate(attrs.format));
                        $scope.setSpanValue("week");
                    }

                    $scope.setValueInModel = function (label, currentDate, currentWeek, currentMonth, currentYear, firstDay, lastDay) {
                        var span = $scope.getSpanValue();
                        AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field, {});
                        var firstSplit = firstDay.split("/");
                        if (currentDate || currentWeek || currentYear || currentMonth) {
                            if (currentDate) {
                                $scope.setFilterValue("{_CurrentDate}");
                            } else if (currentWeek) {
                                $scope.setFilterValue("{_currentweek}");
                            } else if (currentYear) {
                                $scope.setFilterValue("{_currentyear}");
                            } else if (currentMonth) {
                                $scope.setFilterValue("{_currentmonth}");
                            }

                            var gteValue = $scope.getGTEValue();
                            var ltValue = $scope.getLTValue();

                            if (gteValue) {
                                AppUtil.removeDottedValue(AppUtil.resolve($scope, model, true, false), field + ".$gte");
                            }
                            if (ltValue) {
                                AppUtil.removeDottedValue(AppUtil.resolve($scope, model, true, false), field + ".$lt");
                            }
                        } else {
                            AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field + ".filter", {});
                            AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field + ".filter.$gte", firstSplit[2] + "-" + firstSplit[1] + "-" + firstSplit[0]);
                            var secondSplit = lastDay.split("/");
                            AppUtil.putDottedValue(AppUtil.resolve($scope, model, true, false), field + ".filter.$lt", secondSplit[2] + "-" + secondSplit[1] + "-" + secondSplit[0]);
                        }
                        $scope.setLabelValue(label);
                        $scope.setSpanValue(span);
                        $scope.hideDateFilterPopUp();
                    }

                    $scope.yearFilter = function (current) {
                        $scope.setSpanValue("year");
                        $scope.fromtopopup = false;
                        $scope.ndayspopup = false;

                        $scope.currentDatePopup = false;
                        var currentDate = new Date();
                        var currentYear = currentDate.getFullYear();
                        dateInputElement.val(currentYear);
                        var firstDay = "01/01/" + currentYear;
                        var lastDay = "01/01/" + (currentYear + 1);
                        $scope.setValueInModel(currentYear, false, false, false, current, firstDay, lastDay)
                    }

                    $scope.monthFilter = function (current) {
                        $scope.setSpanValue("month");
                        $scope.fromtopopup = false;
                        $scope.ndayspopup = false;
                        $scope.currentDatePopup = false;

                        var currentDate = new Date();
                        var currentMonthFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                        var nextMonthFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                        var firstDay = currentMonthFirstDay.getFormattedDate(attrs.format);
                        var lastDay = nextMonthFirstDay.getFormattedDate(attrs.format);
                        var label = $scope.months[currentMonthFirstDay.getMonth()] + ', ' + currentDate.getFullYear();
                        dateInputElement.val(label);
                        $scope.setValueInModel(label, false, false, current, false, firstDay, lastDay)
                    }


                    $scope.dateFilter = function (current) {
                        $scope.fromtopopup = false;
                        $scope.ndayspopup = false;
                        $scope.currentDatePopup = false;

                        var currentDate = new Date();
                        var firstDay = currentDate.getFormattedDate(attrs.format);
                        var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
                        var lastDay = nextDate.getFormattedDate(attrs.format);
                        dateInputElement.val(firstDay);
                        $scope.setSpanValue("date");
                        $scope.setValueInModel(firstDay, current, false, false, false, firstDay, lastDay);
                    }

                    $scope.currentfilter = function () {
                        $scope.currentDatePopup = !$scope.currentDatePopup;
                        $scope.fromtopopup = false;
                        $scope.ndayspopup = false;
                    }

                    $scope.customfilter = function () {
                        $scope.fromtopopup = !$scope.fromtopopup;
                        $scope.ndayspopup = false;
                        $scope.currentDatePopup = false;
                    }

                    $scope.lastndays = function () {
                        $scope.currentDatePopup = false;
                        $scope.ndayspopup = !$scope.ndayspopup;
                        $scope.fromtopopup = false;

                    }

                    $scope.fromtopopup = false;
                    $scope.ndayspopup = false;
                    $scope.currentDatePopup = false;

                    $scope.showPopUp = function () {
                        $scope.currentDatePopup = false;
                        var html = "<ul>" +
                            "<li class='app-position-relative app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='currentfilter();' >Current" +
                            "<ul ng-show='currentDatePopup' class='app-position-absolute app-pop-up-border app-pop-up-box-shadow app-color-black app-top-position-zero ' style='left:100px;'>" +
                            "<li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='dateFilter(true)'>Current Date</li>" +
                            "<li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='weekFilter(true)'>Current Week</li>" +
                            "<li <li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='monthFilter(true)'>Current Month</li>" +
                            "<li <li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='yearFilter(true)'>Current Year</li>" +
                            "</ul>" +
                            "</li>" +
                            "<li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='dateFilter(false)'>Date</li>" +
                            "<li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='monthFilter(false)'>Month</li>" +
                            "<li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='yearFilter(false)'>Year</li>" +
                            "<li class='app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' ng-click='weekFilter(false)'>Week</li>" +
                            "<li ng-click='customfilter()' class='app-position-relative app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' >Custom</li>" +
                            "<li ng-show='fromtopopup' class='app-position-relative ng-binding app-padding-five-px app-zero-padding' >" +
                            '<ul  class="app-pop-up-border app-pop-up-box-shadow app-position-absolute app-light-gray-backgroud-color app-padding-five-px app-cursor-auto" style="top: 0px; width: 270px;z-index:1;">' +
                            '<li>' +
                            "<app-datepicker model='" + toBind + "' field='fromlabel' placeholder='From' class='app-float-left' style='width:100px;margin-right:10px;height:27px;'></app-datepicker>" +
                            "<app-datepicker model='" + toBind + "' field='tolabel' placeholder='To' class='app-float-left' style='width:100px;height:27px;'></app-datepicker>" +
                            '<div class="app-float-left app-cursor-pointer app-color-black" style="margin-left:12px;margin-top:4px;" ng-click="rengeFilter()">Apply</div></li>' +
                            '</ul>' +
                            "<li ng-click='lastndays()' class='app-position-relative app-cursor-pointer app-white-space-nowrap app-row-action app-light-gray-backgroud-color app-padding-five-px' >Last N Days</li>" +
                            "<li ng-show='ndayspopup' class='app-position-relative ng-binding app-padding-five-px app-zero-padding' >" +
                            '<ul  class="app-pop-up-border app-pop-up-box-shadow app-position-absolute app-light-gray-backgroud-color app-padding-five-px app-cursor-auto" style="top: 0px; width: 200px;z-index:1;">' +
                            '<li>' +
                            "<app-text model='" + toBind + "' field='nLastDays' class='app-float-left' style='width:150px; height:24px;' placeholder='Days'></app-text>" +
                            '<div class="app-float-left app-cursor-pointer app-color-black" style="margin-left:12px;margin-top:4px;" ng-click="nLastDaysFilter()">Apply</div></li>' +
                            '</ul>' +
                            "</li>" +
                            "</ul>";
                        var popup = {
                            template:html,
                            scope:$scope.$new(),
                            hideonclick:false,
                            element:dateInputElement,
                            width:100
                        }
                        $scope.dateFilterPopUp = $viewStack.showPopup(popup);
                    }

                    $scope.nLastDaysFilter = function () {
                        $scope.hideDateFilterPopUp();
                        var days = AppUtil.removeDottedValue(AppUtil.resolve($scope, model, true, false), field + ".nLastDays");
                        var dateObj = new Date();
                        var currentDate = new Date();
                        dateObj = new Date(dateObj.setDate(dateObj.getDate() - days));
                        var label = dateObj.getFormattedDate(attrs.format) + ' - ' + currentDate.getFormattedDate(attrs.format);
                        $scope.setValueInModel(label, false, false, false, false, dateObj.getFormattedDate(attrs.format), currentDate.getFormattedDate(attrs.format));
                    }

                    $scope.hideDateFilterPopUp = function () {
                        if ($scope.dateFilterPopUp) {
                            $scope.dateFilterPopUp.hide();
                            $scope.dateFilterPopUp = undefined;
                        }
                    }

                    $scope.rengeFilter = function () {
                        $scope.hideDateFilterPopUp();
                        var fromLabel = AppUtil.removeDottedValue(AppUtil.resolve($scope, model, true, false), field + ".fromlabel");
                        var toLabel = AppUtil.removeDottedValue(AppUtil.resolve($scope, model, true, false), field + ".tolabel");

                        if (!fromLabel || !toLabel) {
                            return;
                        }
                        var firstDay = new Date(fromLabel);
                        var lastDay = new Date(toLabel);
                        if (firstDay && lastDay) {
                            var label = new Date(firstDay).getFormattedDate(attrs.format) + " - " + new Date(lastDay).getFormattedDate(attrs.format);
                            $scope.setValueInModel(label, false, false, false, false, firstDay.getFormattedDate(attrs.format), lastDay.getFormattedDate(attrs.format));
                        }
                    }

                    $scope.getNextDate = function (currentDate) {
                        var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
                        return nextDate.getFormattedDate(attrs.format);
                    }

                    $scope.dateFilterNavigation = function (next) {
                        var filter = $scope.getFilterValue();
                        var spanValue = $scope.getSpanValue();

                        if (spanValue == "week") {
                            var filterLabel = $scope.getLabelValue();
                            var split = filterLabel.split("-");
                            var firstDate = split[0];
                            var firstDateSplit = firstDate.split("/");
                            firstDateSplit = firstDateSplit[2].trim() + "-" + firstDateSplit[1].trim() + "-" + firstDateSplit[0].trim();
                            var currentDate = new Date(firstDateSplit);

                            var firstDay = currentDate.getDate() - currentDate.getDay();
                            if (next) {
                                firstDay += 7;
                            } else {
                                firstDay -= 7;
                            }

                            var weekFirstDay = new Date(currentDate);
                            weekFirstDay.setDate(firstDay);
                            var weekLastDay = new Date(currentDate);
                            weekLastDay.setDate(firstDay + 6);
                            var nextWeekObj = new Date(weekLastDay.getFullYear(), weekLastDay.getMonth(), weekLastDay.getDate() + 1);
                            var label = weekFirstDay.getFormattedDate(attrs.format) + ' - ' + weekLastDay.getFormattedDate(attrs.format);
                            dateInputElement.val(label);
                            $scope.setValueInModel(label, false, false, false, false, weekFirstDay.getFormattedDate(attrs.format), nextWeekObj.getFormattedDate(attrs.format));
                        } else if (spanValue == "date") {
                            var filterLabel = $scope.getLabelValue();
                            var firstDateSplit = filterLabel.split("/");
                            firstDateSplit = firstDateSplit[2].trim() + "-" + firstDateSplit[1].trim() + "-" + firstDateSplit[0].trim();
                            var currentDate = new Date(firstDateSplit);

                            currentDate = next ? new Date(currentDate.setDate(currentDate.getDate() + 1)) : new Date(currentDate.setDate(currentDate.getDate() - 1));
                            dateInputElement.val(currentDate.getFormattedDate(attrs.format));
                            var lastDay = $scope.getNextDate(currentDate);
                            $scope.setValueInModel(currentDate.getFormattedDate(attrs.format), false, false, false, false, currentDate.getFormattedDate(attrs.format), lastDay)
                        } else if (spanValue == "month") {
                            var filterLabel = $scope.getLabelValue();
                            var filterlabelSplit = filterLabel.split(",");
                            var currentMonth = filterlabelSplit[0].trim();
                            var monthIndex = undefined;

                            for (var i = 0; i < $scope.months.length; i++) {
                                if ($scope.months[i] === currentMonth) {
                                    monthIndex = i;
                                    break;
                                }
                            }
                            if (next) {
                                monthIndex += 1;
                            } else {
                                monthIndex -= 1;
                            }

                            var currentMonthFirstDay = new Date(filterlabelSplit[1].trim(), monthIndex, 1);
                            var nextMonthFirstDay = new Date(filterlabelSplit[1].trim(), monthIndex + 1, 1);
                            var firstDay = currentMonthFirstDay.getFormattedDate(attrs.format)
                            var lastDay = nextMonthFirstDay.getFormattedDate(attrs.format);
                            var value = $scope.months[currentMonthFirstDay.getMonth()] + ', ' + currentMonthFirstDay.getFullYear();
                            dateInputElement.val(value);
                            $scope.setValueInModel(value, false, false, false, false, firstDay, lastDay)

                        } else if (spanValue == "year") {
                            var filterLabel = $scope.getLabelValue();
                            var currentDate = new Date();
                            if (next) {
                                currentDate.setFullYear(parseInt(filterLabel) + 1);
                            } else {
                                currentDate.setFullYear(parseInt(filterLabel) - 1);
                            }
                            dateInputElement.val(currentDate.getFullYear());
                            var firstDay = "01/01/" + currentDate.getFullYear();
                            var next = new Date((currentDate.getFullYear() + 1), currentDate.getMonth(), 1);
                            var lastDay = "01/01/" + next.getFullYear();
                            $scope.setValueInModel(currentDate.getFullYear(), false, false, false, false, firstDay, lastDay)
                        }
                    }
                }
            }
        }
    }
}]);
'use strict';
appStrapDirectives.directive('appLookup', ['$compile', '$timeout', '$viewStack', function ($compile, $timeout, $viewStack) {
    'use strict';
    return {
        restrict:'E',
        template:"<div class='app-height-full'></div>",
        scope:true,
        replace:true,
        compile:function () {
            return  {

                post:function ($scope, iElement, attrs) {
                    var optionsDiv = $('#app_popup');
                    if (optionsDiv.length == 0) {
                        $(document.body).append("<div id='app_popup'></div>");
                    }
                    var modelExpression = attrs.model;
                    var fieldExpression = attrs.field;
                    var insert = attrs.insert;
                    var bindType = attrs.bindtype;
                    var ds = attrs.datasource;
                    if (!bindType) {
                        if (ds && $scope[ds] && $scope[ds].length > 0 && (typeof $scope[ds][0] !== 'object')) {
                            bindType = UI_TYPE_STRING;
                        } else if (attrs.display) {
                            bindType = "object";
                        } else if (fieldExpression.indexOf(".") >= 0) {
                            bindType = "object";
                        } else {
                            bindType = UI_TYPE_STRING;
                        }
                    }
                    var multiple = attrs.multiple;
                    var fieldFirstExpression = false;
                    var fieldLastDotExpression = false;
                    var dottIndex = fieldExpression.lastIndexOf(".");
                    if (dottIndex >= 0) {
                        fieldFirstExpression = fieldExpression.substring(0, dottIndex);
                        fieldLastDotExpression = fieldExpression.substring(dottIndex + 1);
                    } else {
                        fieldFirstExpression = fieldExpression;
                    }
                    if (multiple === undefined) {
                        var modelValue = AppUtil.getModel($scope, modelExpression, false);
                        if (!modelValue) {
                            multiple = false;
                        } else {
                            modelValue = AppUtil.getModel(modelValue, fieldFirstExpression, false);
                            if (modelValue) {
                                if (modelValue instanceof Array) {
                                    multiple = true
                                } else {
                                    multiple = false;
                                }
                            }
                        }
                    }
                    if (multiple == "false" || multiple == 'undefined') {
                        multiple = false;
                    } else if (multiple == "true") {
                        multiple = true;
                    }
                    if (insert == "false" || insert == 'undefined') {
                        insert = false;
                    } else if (insert == "true") {
                        insert = true;
                    }
                    var toBind;
                    toBind = modelExpression + "." + fieldFirstExpression;
                    if (multiple) {
                        if (bindType == UI_TYPE_STRING && fieldLastDotExpression) {
                            toBind += "." + fieldLastDotExpression;
                            fieldLastDotExpression = undefined;
                        } else if (bindType == "object" && fieldLastDotExpression && attrs.display) {
                            toBind += "." + fieldLastDotExpression;
                            fieldLastDotExpression = undefined;
                        }
                        modelExpression = toBind;
                    } else {
                        if (fieldLastDotExpression) {
                            modelExpression = toBind;
                            toBind += "." + fieldLastDotExpression;
                        } else {
                            fieldLastDotExpression = fieldFirstExpression;
                        }
                    }
                    $scope.multiple = multiple;
                    $scope.bindtype = bindType;
                    $scope.modelexpression = modelExpression;
                    $scope.fieldexpression = fieldLastDotExpression;
                    if (attrs.display) {
                        $scope.displayexpression = attrs.display;
                        if (!multiple) {
                            toBind += "." + attrs.display;
                        }
                    } else if (fieldLastDotExpression) {
                        $scope.displayexpression = fieldLastDotExpression;
                    }

                    var placeholder = attrs.placeholder;
                    if (!placeholder || placeholder == false || placeholder == 'false' || placeholder.toString().trim().length == 0) {
                        placeholder = '';
                    }

                    var border = attrs.border;
                    if (border === undefined || border == true || border == 'true') {
                        border = true
                    } else {
                        border = false;
                    }
                    var typeEditableExpression = undefined;

                    if ($scope.col && $scope.col.typeEditableExpression !== undefined && $scope.col.typeEditableExpression.toString().length > 0 && $scope.col.typeEditableExpression.indexOf('this') >= 0) {
                        typeEditableExpression = $scope.col.typeEditableExpression.replace(/this./g, "row.");
                    }
                    var showAsLabel = attrs.showaslabel;
                    if (showAsLabel == 'true') {
                        showAsLabel = true
                    } else {
                        showAsLabel = false;
                    }
                    var lookUpTemplate;
                    if (showAsLabel) {
                        lookUpTemplate = "<div class='app-float-left'>" +
                            "<div class='app-float-left'>" +
                            "<input type='text' data-popup-id='app_popup' style='color:#ffffff;width:0px;padding:0px;margin: 0px;border:none;' />" +
                            "<span ng-bind='" + toBind + "' style='padding-left:4px;'></span>" +
                            "</div>";
                        if (attrs.dropdownclass) {
                            lookUpTemplate += "<input type='text' class='app-cursor-pointer app-float-left " + attrs.dropdownclass + "' title='Filter Operator' tabindex='-1'/>";
                        } else {
                            lookUpTemplate += "<input type='text' class='app-cursor-pointer app-float-left drop-down-arrow' tabindex='-1'/>";
                        }
                        lookUpTemplate += "</div>";
                    } else {
                        lookUpTemplate = "<div  class ='app-look-up-container app-look-up-container-background' ng-class=\"{'app-border':" + border + "}\">";
                        if (AppUtil.isTrueOrUndefined(attrs.showdropdown)) {
                            lookUpTemplate += "<div class='app-look-up-text-container'>";
                        } else {
                            lookUpTemplate += "<div class='app-look-up-text-container' style='right:0px;'>";
                        }
                        if (($scope.col && ($scope.col[UI] == UI_TYPE_DURATION || $scope.col[UI] == UI_TYPE_CURRENCY)) && typeEditableExpression !== undefined && typeEditableExpression.toString().length > 0) {
                            lookUpTemplate += "<input  ng-model-remove class='ref-input focus-element' type = 'text' ng-show='(" + typeEditableExpression + ")'  placeholder='" + placeholder + "' ng-model='" + toBind + "' data-popup-id='app_popup' />" +
                                "<input  ng-show='!(" + typeEditableExpression + ")' ng-model-remove class='ref-input focus-element app-white-backgroud-color' type = 'text'   ng-model='" + toBind + "' data-popup-id='app_popup' disabled />";
                        } else {
                            lookUpTemplate += "<input  ng-model-remove class='ref-input focus-element' type = 'text' placeholder='" + placeholder + "' ng-model='" + toBind + "' data-popup-id='app_popup' />";
                        }
                        lookUpTemplate += " </div>";
                        if (insert) {
                            lookUpTemplate += "<input type='text' tabindex='-1' class='app-cursor-pointer app-look-up-insert app-position-absolute app-text-align-center app-font-weight-bold' ng-click='insert()'/>";
                        }
                        if (AppUtil.isTrueOrUndefined(attrs.showdropdown)) {
                            lookUpTemplate += "<input type='text' class='second-input'  tabindex='-1'  class='ref-button app-cursor-pointer' ";
                        }

                        if (($scope.col && ($scope.col[UI] == UI_TYPE_DURATION || $scope.col[UI] == UI_TYPE_CURRENCY)) && typeEditableExpression !== undefined && typeEditableExpression.toString().length > 0) {
                            lookUpTemplate += " ng-show='(" + typeEditableExpression + ")' ";
                        }
                        lookUpTemplate += " /></div>" +
                            "</div>";
                    }
                    var multipleTemplate = "<div style='height: auto;display: table;position: relative;' class='app-width-full app-white-backgroud-color' ng-class=\"{'app-border':" + border + "}\">" +
                        "<div style='position:relative;right:20px;left: 0px;' class='app-white-backgroud-color'>" +
                        "<app-multiple-refrence ng-repeat='option in " + toBind + "'></app-multiple-refrence>";
                    multipleTemplate += '<input   type ="text"placeholder="' + placeholder + '" class="app-float-left app-border-none app-padding-zero"  size="' + fieldFirstExpression.length + '"  data-popup-id="app_popup" style="margin:0px;min-height:29px;"/>';
                    multipleTemplate += "</div>" +
                        "<div style='display:table-cell;width:19px;vertical-align: middle;padding-left: 5px;' class='app-white-backgroud-color'>" +
                        "<input type='text'  class='app-multi-refrence-down-arrow' tabindex='-1' >" +
                        "</div>" +
                        "</div>";
                    $scope.insert = function () {
                        var viewInfo = {viewid:$scope.col.referredView.id, ask:$scope.view.ask, max_rows:0, type:"panel", refreshOnSave:false, aftersavecallback:function (response) {
                            if (response !== undefined) {
                                var insert = response.insert;
                                if (insert !== undefined) {
                                    $scope.updater(insert[0]);
                                }
                            }
                        }};
                        if ($scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk) {
                            viewInfo.osk = $scope.appData.organizations.options[$scope.appData.organizations.selectedIndex].osk;
                        }
                        viewInfo.quickviews = false;
                        viewInfo.insert = false;
                        viewInfo.delete = false;
                        viewInfo.refresh = false;
                        viewInfo.navigation = false;
                        viewInfo.enablequickviewaction = false;
                        viewInfo.enablemetadataaction = false;
                        viewInfo.closeonsave = true;
                        viewInfo.resize = false;
                        viewInfo.popUpTitle = false;
                        viewInfo.toolBarTitle = true;
                        viewInfo.warning = false;
                        viewInfo.showas = 'popup';
//viewInfo[PARENT_COMPONENT_ID] = $scope.componentid;
                        $viewStack.addView(viewInfo, $scope);
                    };
                    if (multiple) {
                        $(iElement).append($compile(multipleTemplate)($scope));
                    } else {
                        $(iElement).append($compile(lookUpTemplate)($scope));
                    }
                    $scope.$menu = $('<ul class="typeahead dropdown-menu"></ul>');
                    $scope.item = '<li><a href="#"></a></li>';
                    $scope.minLength = 1;
                    var inputElements = angular.element(iElement).find('input');
                    var inputElement = inputElements[0];
                    var showAllDivElement = inputElements[inputElements.length - 1];
                    $scope.timeout = null;
                    $scope.$showAllElement = $(showAllDivElement);
                    $scope.$element = $(inputElement)
                    $scope.shown = false
                    $scope.showingLoadingImage = false
                    $scope.lastSelected = null;
                    $scope.select = function () {
                        var selectedIndex = $scope.$menu.find('.active').index();
                        if ($scope.data[selectedIndex] != DATA_NOT_FOUND) {
                            $scope.updater($scope.data[selectedIndex]);
                        }
                        return $scope.hide()
                    };
                    $scope.show = function () {
                        var dataPopupId = $scope.$element.attr("data-popup-id");
                        var dataPopupElement = $("#" + dataPopupId);
                        var offset = $scope.$element.offset();
                        var posY = offset.top - $(window).scrollTop();
                        var posX = offset.left - $(window).scrollLeft();
                        var elemHeight = $scope.$element[0].offsetHeight;
                        var top = offset.top
                        var windowHeight = $(window).height();
                        var topToSet;

                        dataPopupElement.append($scope.$menu);
                        $scope.$menu.show();
                        if ((top + $scope.$menu.height() + $scope.$element.height()) >= windowHeight) {
                            topToSet = top - $scope.$element.height() - $scope.$menu.height();
                        } else {
                            topToSet = (posY + elemHeight);
                        }

                        if (topToSet < 0) {
                            topToSet = top + $scope.$element.height();
                        }

                        dataPopupElement.css({top:topToSet, left:posX, position:"absolute"});
                        $scope.shown = true
                        return this
                    };
                    $scope.hide = function () {
                        $scope.$menu.hide();
                        var dataPopupId = $scope.$element.attr("data-popup-id");
                        var dataPopupElement = $("#" + dataPopupId);
                        $scope.shown = false
                        return this
                    };
                    $scope.highlighter = function (item) {
                        var query = $scope.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
                        return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                            return '<strong>' + match + '</strong>'
                        })
                    };
                    $scope.render = function (items) {
                        $scope.data = items;
                        items = $(items).map(function (i, item) {
                            if (angular.isObject(item)) {
                                if (item.$value) {
                                    item = item.$value;
                                } else {
                                    if ($scope.displayexpression) {
                                        item = AppUtil.resolve(item, $scope.displayexpression);
                                    } else {
                                        item = item[$scope.fieldexpression];
                                    }

                                }

                            }
                            i = $($scope.item);
                            i.find('a').html($scope.highlighter(item))
                            return i[0]
                        })
                        items.first().addClass('active')
                        $scope.$menu.html(items)
                        return this
                    };
                    $scope.next = function (event) {
                        var active = $scope.$menu.find('.active').removeClass('active')
                            , next = active.next()
                        var ulHeight = $scope.$menu.height();
                        var ulTop = $scope.$menu.scrollTop();
                        var activeLiTop = active.position().top;
                        var liHeight = $scope.$menu.find('li').height();
                        if (!next.length) {
                            next = $($scope.$menu.find('li')[0])
                            $scope.$menu.scrollTop(0);
                        } else {
                            if ((activeLiTop + liHeight) > ulHeight) {
                                var setScrollTop = ulTop + liHeight;
                                $scope.$menu.scrollTop(setScrollTop);
                            }
                        }
                        next.addClass('active')
                    };
                    $scope.prev = function (event) {
                        var active = $scope.$menu.find('.active').removeClass('active')
                            , prev = active.prev()
                        var ulHeight = $scope.$menu.height();
                        var ulTop = $scope.$menu.scrollTop();
                        var liHeight = $scope.$menu.find('li').height();
                        if (!prev.length) {
                            prev = $scope.$menu.find('li').last()
                            $scope.$menu.scrollTop($scope.$menu.find('li').last().position().top);
                        } else {
                            var activeLiTop = prev.position().top;
                            if (activeLiTop < 0) {
                                var setScrollTop = ulTop - liHeight;
                                $scope.$menu.scrollTop(setScrollTop);
                            }
                        }
                        prev.addClass('active')
                    };
                    $scope.listen = function () {
                        $scope.$element
                            .on('focus', $scope.focus)
                            .on('blur', $scope.blur)
                            .on('keypress', $scope.keypress)
                            .on('keyup', $scope.keyup)
                            .on('keydown', $scope.keydown)
                        $scope.$menu
                            .on('click', $scope.click)
                            .on('mouseenter', 'li', $scope.mouseenter)
                            .on('mouseleave', 'li', $scope.mouseleave)
                        $scope.$showAllElement
                            .on('click', $scope.showAllElementClick)
                    };
                    $scope.move = function (e) {
                        if (!this.shown) {
                            if (e.keyCode == 40) { //  down key press
                                $scope.lookup(e, true);
                            }
                            return
                        }
                        switch (e.keyCode) {
                            case 9: // tab
                            case 13: // enter
                            case 27: // escape
                                e.preventDefault()
                                break
                            case 38: // up arrow
                                e.preventDefault()
                                $scope.prev()
                                break
                            case 40: // down arrow
                                e.preventDefault()
                                $scope.next()
                                break
                        }
                        e.stopPropagation()
                    };
                    $scope.keydown = function (e) {
                        $scope.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [38, 9, 13, 27])
                        $scope.move(e)
                    };
                    $scope.keypress = function (e) {
                        if ($scope.suppressKeyPressRepeat) return
                        $scope.move(e)
                    };
                    $scope.keyup = function (e) {
                        switch (e.keyCode) {
                            case 40: // down arrow
                            case 38: // up arrow
                            case 16: // shift
                            case 17: // ctrl
                            case 18: // alt
                                break
                            case 9: // tab
                            case 13: // enter
                                if (!$scope.data) {
                                    $scope.updater($scope.$element.val());
                                    return;
                                }

                                if ($scope.data[selectedIndex] == DATA_NOT_FOUND) {
                                    return $scope.hide();
                                }

                                var selectedIndex = $scope.$menu.find('.active').index();
                                var selectedIndexValue = $scope.data[selectedIndex];
                                if (selectedIndexValue instanceof Object && $scope.displayexpression) {
                                    selectedIndexValue = AppUtil.resolve(selectedIndexValue, $scope.displayexpression);
                                }


                                if (selectedIndexValue && selectedIndexValue.toString().toLowerCase().indexOf($scope.$element.val().toString().toLowerCase()) == 0) {
                                    $scope.updater($scope.data[selectedIndex]);
                                } else {
                                    $scope.updater($scope.$element.val());
                                }
                                return $scope.hide();

//                                if (!$scope.shown) return
//                                $scope.select()
                                break
                            case 27: // escape
                                if (!$scope.shown) return
                                $scope.hide()
                                break
                            default:
                                $scope.lookup(e, false)
                        }
                        e.stopPropagation()
                        e.preventDefault()
                    };
                    $scope.focus = function (e) {
                        $scope.focused = true
                    };
                    $scope.blur = function (e) {
                        $timeout(function () {
                            if ($scope.$element.is(":focus")) {
                                return;
                            }
                            if ($scope.showingLoadingImage) {
                                $($scope.$element).next().remove();
                                $scope.showingLoadingImage = false;
                            }

                            $scope.focused = false;
                            var value = $scope.$element.val();
                            $scope.updater(value);
                            if (!$scope.mousedover && $scope.shown) $scope.hide()
                        }, 200);
                    };
                    $scope.click = function (e) {
                        e.stopPropagation()
                        e.preventDefault()
                        $scope.select()
                        $scope.$element.focus()
                    };
                    $scope.mouseenter = function (e) {
                        $scope.mousedover = true
                        $scope.$menu.find('.active').removeClass('active')
                        $(e.currentTarget).addClass('active')
                    };
                    $scope.mouseleave = function (e) {
                        $scope.mousedover = false
                        if (!$scope.focused && $scope.shown) $scope.hide()
                    };
                    $scope.showAllElementClick = function (e) {
                        $scope.$element.focus();
                        $scope.lookup(e, true);
                    };
                    $scope.lookup = function (ev, showAll) {
                        var items;
                        if (showAll) {
                            $scope.query = '';
                        } else {
                            $scope.query = $scope.$element.val();
                        }
                        $scope.source($scope.query, $scope.process);
                    };
                    $scope.source = function (query, callBack) {
                        if ($scope[attrs.datasource] instanceof Array) {
                            var options = $scope[attrs.datasource];
                            var optionsCount = options.length;
                            var optionsToShow = [];
                            if (query && query.length > 0) {
                                for (var i = 0; i < optionsCount; i++) {
                                    var option = options[i];
                                    try {
                                        if (option.toLowerCase().match("^" + query.toLowerCase())) {
                                            optionsToShow.push(option);
                                        }
                                    } catch (e) {
//ignore exception in matching
                                    }
                                }
                            } else {
                                optionsToShow = options;
                            }
                            callBack(optionsToShow);
                            return;
                        }
                        var items;
                        if ($scope.timeout != null) {
                            clearTimeout($scope.timeout);
                            delete $scope.timeout;
                        }
                        $scope.timeout = setTimeout(function () {
                            if (!$scope.showingLoadingImage) {
                                var loadingHtml = '<img src="../images/loading.gif" class="app-input-loading-image">';
                                $(loadingHtml).insertAfter($scope.$element);
                                $scope.showingLoadingImage = true;
                            }

                            $scope[attrs.datasource].getData(query, $scope, function (data) {
                                try {
                                    $timeout.cancel($scope.timeout);
                                    $scope.timeout = null;
                                    $($scope.$element).next().remove();
                                    $scope.showingLoadingImage = false;
                                    if (!$scope.$element.is(":focus")) {
                                        return;
                                    }
                                    if (query == '' || query == $scope.$element.val()) {
                                        var optionData = data.data;
                                        if (optionData.length == 0) {
                                            optionData.push(DATA_NOT_FOUND);
                                        }
                                        callBack(optionData);
                                    }
                                } catch (e) {
                                    alert("Error in getData of lookup>>" + e.message + "\n" + e.stack);
                                    throw e;
                                }
                            });
                        }, 200);
                    };
                    $scope.process = function (items) {
                        if (!items.length) {
                            return $scope.shown ? $scope.hide() : this
                        }
                        return $scope.render(items.slice(0, $scope.items)).show()
                    };
                    $scope.updater = function (value) {
                        var multiple = $scope.multiple;
                        var modelExpression = $scope.modelexpression;
                        var fieldExpression = $scope.fieldexpression;
                        var displayExpression = $scope.displayexpression;

                        var bindType = $scope.bindtype;
                        var confirmType;
                        if (multiple) {
                            confirmType = "array";
                        } else {
                            confirmType = "object";
                        }
                        var lastValue = false;
                        var lastModel = AppUtil.getModel($scope, modelExpression);
                        if (lastModel && fieldExpression) {
                            lastValue = AppUtil.resolve(lastModel, fieldExpression);
                        }

                        if (lastValue) {
                            if ((lastValue instanceof Object) && displayExpression) {
                                lastValue = AppUtil.resolve(lastValue, displayExpression);
                            }
                            var v = value;
                            if ((v instanceof Object) && displayExpression) {
                                v = AppUtil.resolve(v, displayExpression);
                            }
                            if (v == $scope.$element.val() && (v == lastValue || (!lastValue && (!v || v.toString().length == 0)))) {
                                return;
                            }
                        }
                        var model = AppUtil.getModel($scope, modelExpression, true, confirmType);
                        if (multiple) {
                            $scope.$element.val("");
                            if (value === undefined || value.toString().trim().length == 0) {
                                return;
                            }
                            if (bindType == 'object' && !(value instanceof Object)) {
                                var v = {}
                                AppUtil.putDottedValue(v, displayExpression, value);
                                value = v;
                            }
                            model.push(value);
                        } else {
                            var v = value;
                            if ((v instanceof Object) && displayExpression) {
                                v = AppUtil.resolve(v, displayExpression);
                            }
                            $scope.$element.val(v);
                            if (bindType == 'object') {
                                AppUtil.removeDottedValue(model, fieldExpression);
//                                Object.keys(model).forEach(function (k) {
//                                    delete model[k];
//                                })
                                if (value instanceof Object) {
                                    AppUtil.putDottedValue(model, fieldExpression, value);
//                                    Object.keys(value).forEach(function (k) {
//                                        model[k] = value[k];
//                                    })
                                } else {
                                    if (value === undefined || value === null || value.trim().length == 0) {
                                        //do nothing
                                    } else {
                                        var v = {}
                                        AppUtil.putDottedValue(v, displayExpression, value);
                                        AppUtil.putDottedValue(model, fieldExpression, v);
                                    }
                                }
                            } else {
                                AppUtil.putDottedValue(model, fieldExpression, value);
                            }
                        }
                        var onChangeFn = $scope.$element.attr('onselection');
                        if (onChangeFn) {
//                            scope[onChangeFn](updatedValue, scope.column);
                        }
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                        return value;
                    }
                    $scope.listen();
                }

            };
        }

    };
}
]);
appStrapDirectives.directive('appBreadCrumb', ["$compile", "$viewStack", function ($compile, $viewStack) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<div class='app-float-left'>" +
            "<div class='app-float-left' ng-repeat='breadCrumb in view.metadata.breadCrumbInfo'>" +
            "<div class='app-float-left app-font-weight-bold app-color-blue' style='font-size:19px;' ng-show='$index>0'> &#8674; </div>" +
            "<div class='app-float-left app-cursor-pointer app-color-blue' style='font-size:12px;padding:7px;'title='{{breadCrumb.title}}' ng-bind='breadCrumb.label' ng-click='closeViewByBreadCrumb(breadCrumb)'></div>" +
            "</div>",
        compile:function () {
            return {
                pre:function ($scope, iElement) {
                    $scope.closeViewByBreadCrumb = function (info) {
                        if (info && info[COMPONENT_ID]) {
                            $viewStack.closeChildView(info[COMPONENT_ID]);
                        }
                    };
                }
            };
        }
    }
}]);

appStrapDirectives.directive('appFtsSearch', ['$compile' , function ($compile) {
    return {
        restrict:'E',
        replace:true,
        scope:true,
        compile:function () {
            return {
                post:function ($scope, iElement) {
                    $scope.ftsDataSource = [];
                    for (var i = 0; i < $scope.view.metadata.columns.length; i++) {
                        var column = $scope.view.metadata.columns[i];
                        if (column && column.label) {
                            $scope.ftsDataSource.push(column.label + ":");
                        }
                    }

                    var template = "<div class='app-float-right app-border fts-search'>" +
                        "<app-lookup class='app-float-left' style='width:170px;' showdropdown=false border=false datasource='ftsDataSource' model='view.metadata' field='ftsfilter' placeholder='Search'></app-lookup>" +
                        "<div class='app-float-left cross-image app-cursor-pointer' ng-show='ftsCross' title='Remove' ng-click='removeFtsSearch()'>X</div>" +
                        "<div class='app-float-left image'><img src='images/search.png' class='app-float-left app-cursor-pointer' title='Click here to search.' ng-click='ftsSearch()'></div>" +
                        "</div>";
                    iElement.append(($compile)(template)($scope));

                    iElement.find('input').bind('keydown', function (e) {
                        if (e.keyCode == 13) {
                            $scope.ftsSearch();
                        }
                    });

                    iElement.find('input').bind('keyup', function () {
                        var elementValue = iElement.find('input').val();
                        if (!elementValue || elementValue.length == 0) {
                            $scope.ftsCross = false;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    });

                    $scope.ftsSearch = function () {
                        var elementValue = iElement.find('input').val();
                        var optionsDiv = $('#app_popup ul');
                        if (optionsDiv.is(':visible')) {
                            return;
                        }
                        if ($scope.lastFtsFilter != elementValue) {
                            if (elementValue.length > 0 && elementValue.indexOf(":") > 0) {
                                $scope.ftsCross = true;
                                var splitValue = elementValue.split(":");
                                var secondSplitValue = splitValue[1];
                                if (secondSplitValue.length == 0) {
                                    AppUtil.showShortMessage("Please provide value.");
                                    return;
                                }
                            }
                            $scope.lastFtsFilter = elementValue;
                            $scope.view.metadata.ftsfilter = elementValue;
                            if ($scope.view.metadata.datastate) {
                                $scope.view.metadata.datastate.querycursor = 0;
                            }

                            $scope.refresh();
                        }
                    }
                    $scope.removeFtsSearch = function () {
                        if ($scope.view.metadata.ftsfilter) {
                            delete $scope.view.metadata.ftsfilter;
                        }
                        if ($scope.lastFtsFilter) {
                            delete $scope.lastFtsFilter;
                        }
                        $scope.ftsCross = false;
                        $scope.refresh();
                    }
                }
            };
        }
    }
}]);


appStrapDirectives.directive('appCompositeLookUp', [
    '$compile',
    function ($compile) {
        return {
            restrict:"E",
            replace:true,
            scope:true,
            template:"<div class='app-height-full'></div>",
            compile:function () {
                return {

                    pre:function ($scope, iElement, attrs) {
                        var modelExpression = attrs.model;
                        var fieldExpression = attrs.field;
                        var model = modelExpression + "." + fieldExpression;

                        var firstDs = $scope[attrs.first];
                        if (firstDs && firstDs.length > 0) {
                            $scope.firstDs = [];
                            for (var i = 0; i < firstDs.length; i++) {
                                $scope.firstDs.push(firstDs[i].label);

                            }
                        }
                        $scope.secondDs = $scope[attrs.second];

                        var border = attrs.border;
                        var placeholder = attrs.placeholder;
                        if (border === undefined || border == true || border == 'true') {
                            border = true
                        } else {
                            border = false;
                        }
                        var first = false;
                        var second = false;
                        if (!placeholder || placeholder == false || placeholder == 'false' || placeholder.toString().trim().length == 0) {
                            first = '';
                            second = '';
                        } else {
                            first = 'Source';
                            second = 'Value';
                        }


                        var template = "<div class='app-position-relative app-width-full app-height-full' ng-class=\"{'app-border':" + border + "}\">" +

                            "<app-lookup model='" + model + "' field='type' border=false datasource='firstDs' " +
                            "class='app-position-absolute app-height-full app-right-zero' style='width:50%;left:0px;' placeholder='" + first + "'>" +
                            "</app-lookup>" +

                            "<app-lookup model='" + model + "' field='value' border=false datasource='secondDs' " +
                            "class='app-position-absolute app-height-full app-right-zero' style='width:50%;right:0px;' placeholder='" + second + "' display='__value'>" +
                            "</app-lookup>" +

                            "</div>"
                        $(iElement).append(($compile)(template)($scope));
                    }
                }
            }
        }
    }
]);


appStrapDirectives.directive('appHtmlView', [
    '$compile',
    function ($compile) {
        return {
            restrict:"E",
            replace:true,
            scope:true,
            template:"<div ng-bind-html-unsafe='view.data.__html' class='app-position-absolute app-overflow-auto' style='top:5px;bottom:5px;left:0px;right:0px;'></div>",
            compile:function () {
                return {
                    post:function ($scope) {
                        var id = TOOL_BAR_ID + '_' + $scope.view[COMPONENT_ID];
                        var toolBarTemplate = "<div class='app-tool-bar' app-tool-bar id='" + id + "'></div>";
                        $('#' + TOOL_BAR_ID).append($compile(toolBarTemplate)($scope));
                    }
                }
            }
        }
    }
]);