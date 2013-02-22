(function($) {

    var methods = {

        init: function(options) {
            var form = this;
            if (!form.data('jqv') || form.data('jqv') == null ) {
                methods._saveOptions(form, options);

                // bind all formError elements to close on click
                $(".formError").live("click", function() {
                    $(this).fadeOut(150, function() {

                        // remove prompt once invisible
                        $(this).remove();
                    });
                });				
            }
        },
       
        attach: function(userOptions) {
            var form = this;
            var options;

            if(userOptions)
                options = methods._saveOptions(form, userOptions);
            else
                options = form.data('jqv');
            if (!options.binded) {
					if (options.bindMethod == "bind"){

                        form.find("[class*=validate]:not([type=checkbox])").bind(options.validationEventTrigger, methods._onFieldEvent);
                        form.find("[class*=validate][type=checkbox]").bind("click", methods._onFieldEvent);
                        form.bind("submit", methods._onSubmitEvent);
					} else if (options.bindMethod == "live") {
                        form.find("[class*=validate]:not([type=checkbox])").live(options.validationEventTrigger, methods._onFieldEvent);
                        form.find("[class*=validate][type=checkbox]").live("click", methods._onFieldEvent);

                        
                        form.live("submit", methods._onSubmitEvent);
					}

                options.binded = true;
            }

        },
        
        detach: function() {
            var form = this;
            var options = form.data('jqv');
            if (options.binded) {

               
                form.find("[class*=validate]").not("[type=checkbox]").unbind(options.validationEventTrigger, methods._onFieldEvent);
                form.find("[class*=validate][type=checkbox]").unbind("click", methods._onFieldEvent);
                
                form.unbind("submit", methods.onAjaxFormComplete);
                
               
                
                form.find("[class*=validate]").not("[type=checkbox]").die(options.validationEventTrigger, methods._onFieldEvent);
                form.find("[class*=validate][type=checkbox]").die("click", methods._onFieldEvent);
              
                form.die("submit", methods.onAjaxFormComplete);
                
                form.removeData('jqv');
            }
        },
        
        validate: function() {
            return methods._validateFields(this);
        },
       
        validateField: function(el) {
            var options = $(this).data('jqv');
            return methods._validateField($(el), options);
        },
        
        validateform: function() {
            return methods._onSubmitEvent.call(this);
        },
		
        showPrompt: function(promptText, type, promptPosition, showArrow) {

            var form = this.closest('form');
            var options = form.data('jqv');
          
			if(!options) options = methods._saveOptions(this, options);
            if(promptPosition)
                options.promptPosition=promptPosition;
            options.showArrow = showArrow==true;

            methods._showPrompt(this, promptText, type, false, options);
        },
        
        hidePrompt: function() {
        		var promptClass =  "."+ methods._getClassName($(this).attr("id")) + "formError";
            $(promptClass).fadeTo("fast", 0.3, function() {
                $(this).remove();
            });
        },
       
        hide: function() {
        	if($(this).is("form")){
        		 var closingtag = "parentForm"+$(this).attr('id');
        	}else{
        		
        		var closingtag = $(this).attr('id') +"formError";
        	}
            $('.'+closingtag).fadeTo("fast", 0.3, function() {
                $(this).remove();
            });
        },
       
        hideAll: function() {
            $('.formError').fadeTo("fast", 0.3, function() {
                $(this).remove();
            });
        },
        
        hideFaster: function() {
            $('.formError').remove();            
        },
        
        _onFieldEvent: function() {
            var field = $(this);
            var form = field.closest('form');
            var options = form.data('jqv');
            // validate the current field
            methods._validateField(field, options);
        },
        _onSubmitEvent: function() {
            var form = $(this);
 			var options = form.data('jqv');
   
			 var r=methods._validateFields(form, true);
		
            if (r && options.ajaxFormValidation) {
                methods._validateFormWithAjax(form, options);
                return false;
            }

            if(options.onValidationComplete) {
                options.onValidationComplete(form, r);
                return false;
            }
            return r;
        },

        _checkAjaxStatus: function(options) {
            var status = true;
            $.each(options.ajaxValidCache, function(key, value) {
                if (!value) {
                    status = false;
                    return false;
                }
            });
            return status;
        },
      
        _validateFields: function(form, skipAjaxValidation) {
            var options = form.data('jqv');

           var errorFound = false;
			
			form.trigger("jqv.form.validating");
            var moreThanOnce = true;
            form.find('[class*=validate]').not(':hidden').each( function() {
                var field = $(this);
				if(moreThanOnce){
					errorFound |= methods._validateField(field, options, skipAjaxValidation);
					if(errorFound && (options.multiplePrompts == false))
						moreThanOnce = false;
				}
            });

			form.trigger("jqv.form.result", [errorFound]);
			
            if (errorFound) {
				
                if (options.scroll) {

                    
                    var destination = Number.MAX_VALUE;

                    var lst = $(".formError:not('.greenPopup')");
                    for (var i = 0; i < lst.length; i++) {
                        var d = $(lst[i]).offset().top;
                        if (d < destination)
                            destination = d;
                    }

                    if (!options.isOverflown)
                        $("html:not(:animated),body:not(:animated)").animate({
                            scrollTop: destination
                        }, 1100);
                    else {
                        var overflowDIV = $(options.overflownDIV);
                        var scrollContainerScroll = overflowDIV.scrollTop();
                        var scrollContainerPos = -parseInt(overflowDIV.offset().top);

                        destination += scrollContainerScroll + scrollContainerPos - 5;
                        var scrollContainer = $(options.overflownDIV + ":not(:animated)");

                        scrollContainer.animate({
                            scrollTop: destination
                        }, 1100);
                    }
                }
                return false;
            }
            return true;
        },
        
        _validateFormWithAjax: function(form, options) {

            var data = form.serialize();
			var url = (options.ajaxFormValidationURL) ? options.ajaxFormValidationURL : form.attr("action");
            $.ajax({
                type: "GET",
                url: url,
                cache: false,
                dataType: "json",
                data: data,
                form: form,
                methods: methods,
                options: options,
                beforeSend: function() {
                    return options.onBeforeAjaxFormValidation(form, options);
                },
                error: function(data, transport) {
                    methods._ajaxError(data, transport);
                },
                success: function(json) {

                    if (json !== true) {

                       
                        var errorInForm=false;
                        for (var i = 0; i < json.length; i++) {
                            var value = json[i];
						
                            var errorFieldId = value[0];
                            var errorField = $($("#" + errorFieldId)[0]);
							
                             if (errorField.length == 1) {
								
                                var msg = value[2];
								  if (value[1] == true) {

                                    if (msg == ""  || !msg){
                                       
                                        methods._closePrompt(errorField);
                                    } else {
                                        
                                        if (options.allrules[msg]) {
                                            var txt = options.allrules[msg].alertTextOk;
                                            if (txt)
                                                msg = txt;
                                        }
                                        methods._showPrompt(errorField, msg, "pass", false, options, true);
                                    }

                                } else {
                                    errorInForm|=true;
                                    if (options.allrules[msg]) {
                                        var txt = options.allrules[msg].alertText;
                                        if (txt)
                                            msg = txt;
                                    }
                                    methods._showPrompt(errorField, msg, "", false, options, true);
                                }
                            }
                        }
                        options.onAjaxFormComplete(!errorInForm, form, json, options);
                    } else
                        options.onAjaxFormComplete(true, form, "", options);
                }
            });

        },
        _validateField: function(field, options, skipAjaxValidation) {
			
            if (!field.attr("id"))
                $.error("jQueryValidate: an ID attribute is required for this field: " + field.attr("name") + " class:" +
                field.attr("class"));

            var rulesParsing = field.attr('class');
            var getRules = /validate\[(.*)\]/.exec(rulesParsing);
            if (!getRules)
                return false;
            var str = getRules[1];
            var rules = str.split(/\[|,|\]/);

            
            var isAjaxValidator = false;
            var fieldName = field.attr("name");
            var promptText = "";
			var required = false;
            options.isError = false;
            options.showArrow = true;
            optional = false;

            for (var i = 0; i < rules.length; i++) {

                var errorMsg = undefined;
                switch (rules[i]) {

                    case "optional":
                        optional = true;
                        break;
                    case "required":
                        required = true;
                        //errorMsg = methods._required(field, rules, i, options);
                        break;
                    case "custom":
                        errorMsg = methods._customRegex(field, rules, i, options);
                        break;
                    case "ajax":
                       if(!skipAjaxValidation){
							methods._ajax(field, rules, i, options);
	                        isAjaxValidator = true;
						}
                        break;
                    case "minSize":
                        errorMsg = methods._minSize(field, rules, i, options);
                        break;
                    case "maxSize":
                        errorMsg = methods._maxSize(field, rules, i, options);
                        break;
                    case "min":
                        errorMsg = methods._min(field, rules, i, options);
                        break;
                    case "max":
                        errorMsg = methods._max(field, rules, i, options);
                        break;
                    case "past":
                        errorMsg = methods._past(field, rules, i, options);
                        break;
                    case "future":
                        errorMsg = methods._future(field, rules, i, options);
                        break;
                    case "maxCheckbox":
                        errorMsg = methods._maxCheckbox(field, rules, i, options);
                        field = $($("input[name='" + fieldName + "']"));
                        break;
                    case "minCheckbox":
                        errorMsg = methods._minCheckbox(field, rules, i, options);
                        field = $($("input[name='" + fieldName + "']"));
                        break;
                    case "equals":
                        errorMsg = methods._equals(field, rules, i, options);
                        break;
                    case "notequals":
                        errorMsg = methods._notequals(field, rules, i, options);
                        break;
                    case "funcCall":
                        errorMsg = methods._funcCall(field, rules, i, options);
                        break;
                        
                    case "minCheckboxClass":
                    	 var fieldClass = field.attr("customClass");
                        errorMsg = methods._minCheckbox(field, rules, i, options);
                        field = $($("input[class='" + fieldClass + "']"));
                        break;
                    default:
                   
                }
                if (errorMsg !== undefined) {
                    promptText += errorMsg + "<br/>";
                    options.isError = true;
					break;
					
                }

            }
            if(!required){
            	if(field.val() == "") options.isError = false;
            }
            var fieldType = field.attr("type");

            if ((fieldType == "radio" || fieldType == "checkbox") && $("input[name='" + fieldName + "']").size() > 1) {
                field = $($("input[name='" + fieldName + "'][type!=hidden]:first"));
                options.showArrow = false;
            }

            if (options.isError){
				
                methods._showPrompt(field, promptText, "", false, options);
            }else{
				if (!isAjaxValidator) methods._closePrompt(field);
			}
			field.closest('form').trigger("jqv.field.error", [field, options.isError, promptText]);
            return options.isError;
        },
       
        _required: function(field, rules, i, options) {
            switch (field.attr("type")) {
                case "text":
                case "password":
                case "textarea":
                case "file":
                default:
                    if (!$.trim(field.val()))
                        return options.allrules[rules[i]].alertText;
                    break;
                case "radio":
                case "checkbox":
                    var name = field.attr("name");
                    if ($("input[name='" + name + "']:checked").size() == 0) {

                        if ($("input[name='" + name + "']").size() == 1)
                            return options.allrules[rules[i]].alertTextCheckboxe;
                        else
                            return options.allrules[rules[i]].alertTextCheckboxMultiple;
                    }
                    break;
                case "select-one":
                alert('select')
                     if (!$.trim(field.val()))
                        return options.allrules[rules[i]].alertText;
                    break;
                case "select-multiple":
                    if (!field.find("option:selected").val())
                        return options.allrules[rules[i]].alertText;
                    break;
            }
        },
        
        _customRegex: function(field, rules, i, options) {
            var customRule = rules[i + 1];
			var rule = options.allrules[customRule];
			if(!rule) {
				alert("jqv:custom rule not found "+customRule);
				return;
			}
			
			var ex=rule.regex;
			if(!ex) {
				alert("jqv:custom regex not found "+customRule);
				return;
			}
            var pattern = new RegExp(ex);

            if (!pattern.test(field.attr('value')))
                return options.allrules[customRule].alertText;
        },
       
        _funcCall: function(field, rules, i, options) {
            var functionName = rules[i + 1];

            var fn = window[functionName];
            if (typeof(fn) == 'function')
                fn(field, rules, i, options);
            
            return methods[functionName](field, rules, i, options); 
        },
       
        _equals: function(field, rules, i, options) {
            var equalsField = rules[i + 1];

            if (field.attr('value') != $("#" + equalsField).attr('value'))
                return options.allrules.equals.alertText;
        },

        _notequals: function(field, rules, i, options) {
            var equalsField = rules[i + 1];

            if (field.attr('value') == $("#" + equalsField).attr('value'))
                return options.allrules.notequals.alertText;
        },
       
        _maxSize: function(field, rules, i, options) {
            var max = rules[i + 1];
            var len = field.attr('value').length;

            if (len > max) {
                var rule = options.allrules.maxSize;
                return rule.alertText + max + rule.alertText2;
            }
        },
        
        _minSize: function(field, rules, i, options) {
            var min = rules[i + 1];
            var len = field.attr('value').length;

            if (len < min) {
                var rule = options.allrules.minSize;
                return rule.alertText + min + rule.alertText2;
            }
        },
       
        _min: function(field, rules, i, options) {
            var min = parseFloat(rules[i + 1]);
            var len = parseFloat(field.attr('value'));

            if (len < min) {
                var rule = options.allrules.min;
                if (rule.alertText2) return rule.alertText + min + rule.alertText2;
                return rule.alertText + min;
            }
        },
       
        _max: function(field, rules, i, options) {
            var max = parseFloat(rules[i + 1]);
            var len = parseFloat(field.attr('value'));

            if (len >max ) {
                var rule = options.allrules.max;
                if (rule.alertText2) return rule.alertText + max + rule.alertText2;
                 return rule.alertText + max;
            }
        },
        
        _past: function(field, rules, i, options) {

            var p=rules[i + 1];
            var pdate = (p.toLowerCase() == "now")? new Date():methods._parseDate(p);
            var vdate = methods._parseDate(methods._reformatDate(field.attr('value')));
            if (vdate > pdate ) {
                var rule = options.allrules.past;
                if (rule.alertText2) return rule.alertText + methods._dateToString(pdate) + rule.alertText2;
                return rule.alertText + methods._dateToString(pdate);
            }
        },
       
        _future: function(field, rules, i, options) {

            var p=rules[i + 1];
            var pdate = (p.toLowerCase() == "now")? new Date():methods._parseDate(p);
            var vdate = methods._parseDate(field.attr('value'));

            if (vdate < pdate ) {
                var rule = options.allrules.future;
                if (rule.alertText2) return rule.alertText + methods._dateToString(pdate) + rule.alertText2;
                return rule.alertText + methods._dateToString(pdate);
            }
        },
        
        _maxCheckbox: function(field, rules, i, options) {

            var nbCheck = rules[i + 1];
            var groupname = field.attr("name");
            var groupSize = $("input[name='" + groupname + "']:checked").size();
            if (groupSize > nbCheck) {
                options.showArrow = false;
                return options.allrules.maxCheckbox.alertText;
            }
        },
        
        _minCheckbox: function(field, rules, i, options) {

            var nbCheck = rules[i + 1];
            var groupname = field.attr("name");
            var groupSize = $("input[name='" + groupname + "']:checked").size();
            if (groupSize < nbCheck) {
                options.showArrow = false;
                return options.allrules.minCheckbox.alertText + " " + nbCheck + " " +
                options.allrules.minCheckbox.alertText2;
            }
        },
        _ajax: function(field, rules, i, options) {
			
			
            var errorSelector = rules[i + 1];
            var rule = options.allrules[errorSelector];
            var extraData = rule.extraData;

            if (!extraData)
                extraData = "";

            if (!options.isError) {
                $.ajax({
                    type: "GET",
                    url: rule.url,
                    cache: false,
                    dataType: "json",
                    data: "fieldId=" + field.attr("id") + "&fieldValue=" + field.attr("value") + "&extraData=" + extraData,
                    field: field,
                    rule: rule,
                    methods: methods,
                    options: options,
                    beforeSend: function() {
                        var loadingText = rule.alertTextLoad;
                        if (loadingText)
                            methods._showPrompt(field, loadingText, "load", true, options);
                    },
                    error: function(data, transport) {
                        methods._ajaxError(data, transport);
                    },
                    success: function(json) {
						
                        
                        var errorFieldId = json[0];
                        var errorField = $($("#" + errorFieldId)[0]);
                        if (errorField.length == 1) {
                            var status = json[1];
                            if (!status) {
                                options.ajaxValidCache[errorFieldId] = false;
                                options.isError = true;
                                var promptText = rule.alertText;
                                methods._showPrompt(errorField, promptText, "", true, options);
                            } else {
                                if (options.ajaxValidCache[errorFieldId] !== undefined)
                                    options.ajaxValidCache[errorFieldId] = true;

                               var alertTextOk = rule.alertTextOk;
                                if (alertTextOk)
                                    methods._showPrompt(errorField, alertTextOk, "pass", true, options);
                                else
                                    methods._closePrompt(errorField);
                            }
                        }
                    }
                });
            }
        },
       
        _ajaxError: function(data, transport) {
            if(data.status == 0 && transport == null)
                alert("The page is not served from a server! ajax call failed");
            else if(typeof console != "undefined")
                console.log("Ajax error: " + data.status + " " + transport);
        },
        
        _dateToString: function(date) {

            return date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate();
        },
       
        _parseDate: function(d) {

            var dateParts = d.split("-");
            if(dateParts!==d)
                dateParts = d.split("/");
            return new Date(dateParts[0], (dateParts[1] - 1) ,dateParts[2]);
        },
		
        _reformatDate: function(d) {
            var dateParts = d.split("-");
            if(dateParts!==d)
                dateParts = d.split("/");
            return dateParts[2]+"/"+dateParts[1]+"/"+dateParts[0];
        },
       
        _showPrompt: function(field, promptText, type, ajaxed, options, ajaxform) {
            var prompt = methods._getPrompt(field);
			
			if(ajaxform) prompt = false;
            if (prompt)
                methods._updatePrompt(field, prompt, promptText, type, ajaxed, options);
            else
                methods._buildPrompt(field, promptText, type, ajaxed, options);
        },
       
        _buildPrompt: function(field, promptText, type, ajaxed, options) {

            var prompt = $('<div>');
            prompt.addClass(methods._getClassName(field.attr("id")) + "formError");
            if(field.is(":input")) prompt.addClass("parentForm"+methods._getClassName(field.parents('form').attr("id")));
            prompt.addClass("formError");

            switch (type) {
                case "pass":
                    prompt.addClass("greenPopup");
                    break;
                case "load":
                    prompt.addClass("blackPopup");
            }
            if (ajaxed)
                prompt.addClass("ajaxed");

            var promptContent = $('<div>').addClass("formErrorContent").html(promptText).appendTo(prompt);
            if (options.showArrow) {
                var arrow = $('<div>').addClass("formErrorArrow");

                switch (options.promptPosition) {
                    case "bottomLeft":
                    case "bottomRight":
                        prompt.find(".formErrorContent").before(arrow);
                        arrow.addClass("formErrorArrowBottom").html('<div class="line1"><!-- --></div><div class="line2"><!-- --></div><div class="line3"><!-- --></div><div class="line4"><!-- --></div><div class="line5"><!-- --></div><div class="line6"><!-- --></div><div class="line7"><!-- --></div><div class="line8"><!-- --></div><div class="line9"><!-- --></div><div class="line10"><!-- --></div>');
                        break;
                    case "topLeft":
                    case "topRight":
                        arrow.html('<div class="line10"><!-- --></div><div class="line9"><!-- --></div><div class="line8"><!-- --></div><div class="line7"><!-- --></div><div class="line6"><!-- --></div><div class="line5"><!-- --></div><div class="line4"><!-- --></div><div class="line3"><!-- --></div><div class="line2"><!-- --></div><div class="line1"><!-- --></div>');
                        prompt.append(arrow);
                        break;
                }
            }

            if (options.isOverflown)
            	field.before(prompt);
            else{
              $(field).parent().append(prompt);
			}
            var pos = methods._calculatePosition(field, prompt, options);
            prompt.css({
                "top": pos.callerTopPosition,
                "left": pos.callerleftPosition,
                "marginTop": pos.marginTopSize,
                "opacity": 0,
				"padding": "0px"
            });

            return prompt.animate({
                "opacity": 0.87
            });

        },
       
        _updatePrompt: function(field, prompt, promptText, type, ajaxed, options) {
			
            if (prompt) {
                if (type == "pass")
                    prompt.addClass("greenPopup");
                else
                    prompt.removeClass("greenPopup");

                if (type == "load")
                    prompt.addClass("blackPopup");
                else
                    prompt.removeClass("blackPopup");

                if (ajaxed)
                    prompt.addClass("ajaxed");
                else
                    prompt.removeClass("ajaxed");

                prompt.find(".formErrorContent").html(promptText);

                var pos = methods._calculatePosition(field, prompt, options);
                prompt.animate({
                    "top": pos.callerTopPosition,
                    "marginTop": pos.marginTopSize
                });
            }
        },
       
        _closePrompt: function(field) {

            var prompt = methods._getPrompt(field);
            if (prompt)
                prompt.fadeTo("fast", 0, function() {
                    prompt.remove();
                });
        },
        closePrompt: function(field) {
            return methods._closePrompt(field);
        },
       
        _getPrompt: function(field) {

            var className = "." + methods._getClassName(field.attr("id")) + "formError";
            var match = $(className)[0];
            if (match)
                return $(match);
        },
       
        _calculatePosition: function(field, promptElmt, options) {
			
            var promptTopPosition, promptleftPosition, marginTopSize, fieldMarginTop, fieldMarginBottom;
            var fieldWidth = field.width();
            var fieldHeight = field.height();
			
            var promptHeight = promptElmt.height();
            var promptWidth = promptElmt.width();
            var overflow = options.isOverflown;
            if (overflow) {
                promptTopPosition = promptleftPosition = 0;
                marginTopSize = -promptHeight;
            } else { 
                var position = field.position();
                promptTopPosition = position.top;
                promptleftPosition = position.left;
                marginTopSize = 0;
            }
            switch (options.promptPosition) {

                default:
                case "topRight":
                    if (overflow){
                        promptleftPosition += fieldWidth - 30;
					}
                    else { 
						fieldMarginTop = field.css('margin-top')
						fieldMarginTop = parseInt((fieldMarginTop.split('px'))[0]);
					
                        promptleftPosition += fieldWidth - 30;
                        promptTopPosition += - promptHeight;
						if(fieldMarginTop > 0)
							promptTopPosition = promptTopPosition + fieldMarginTop;
                    }
                    break;
                case "topLeft":
						fieldMarginTop = field.css('margin-top')
						fieldMarginTop = parseInt((fieldMarginTop.split('px'))[0]);
						
						promptTopPosition += - promptHeight;
						if(fieldMarginTop > 0)
							promptTopPosition = promptTopPosition + fieldMarginTop;
                    break;
                case "centerRight":
                    promptleftPosition += 13;
                    break;
                case "bottomLeft":
					fieldMarginBottom = field.css('margin-bottom')
					fieldMarginBottom = parseInt((fieldMarginBottom.split('px'))[0]);
					
                    promptTopPosition = promptTopPosition + field.height() + fieldMarginBottom + 2;
                    break;
                case "bottomRight":
                    promptleftPosition += fieldWidth - 30;
                    fieldMarginBottom = field.css('margin-bottom');
					fieldMarginBottom = parseInt((fieldMarginBottom.split('px'))[0]);
					
                    promptTopPosition = promptTopPosition + field.height() + fieldMarginBottom + 2;
            }			
            return {
                "callerTopPosition": promptTopPosition + "px",
                "callerleftPosition": promptleftPosition + "px",
                "marginTopSize": marginTopSize + "px"
            };
        },
        
        _saveOptions: function(form, options) {

             if ($.validationEngineLanguage)
                var allRules = $.validationEngineLanguage.allRules;
            else
                $.error("jQuery.validationEngine rules are not loaded, plz add localization files to the page");

            var userOptions = $.extend({

                validationEventTrigger: "blur",
                scroll: true,
                promptPosition: "topRight",
                bindMethod:"bind",
				inlineAjax: false,

                ajaxFormValidation: false,

               ajaxFormValidationURL: false,
                onAjaxFormComplete: $.noop,
                onBeforeAjaxFormValidation: $.noop,
                onValidationComplete: false,

                isOverflown: false,
                overflownDIV: "",

                allrules: allRules,
                binded: false,
                showArrow: true,
        
                isError: false,
               
                ajaxValidCache: {},
				multiplePrompts: true

            }, options);

            form.data('jqv', userOptions);
            return userOptions;
        },
            /**
         * Author: SuryaPavan
         * custom function for giving individual alert messages when the field is empty
         */
        inputRequired: function(field, rules, i, options){
            if($.trim(field.val()) == ''){
                var messageObjKey = rules[i+3] || 'alertText';
                return (options.allrules[rules[i+2]][messageObjKey]);
            }
        },
        _getClassName: function(className) {
        	return className.replace(":","_").replace(".","_");
        }
    };

    $.fn.validationEngine = function(method) {

        var form = $(this);
		  if(!form[0]) return false;  // stop here if the form does not exist
		  
        if (typeof(method) == 'string' && method.charAt(0) != '_' && methods[method]) {

            if(method != "showPrompt" && method != "hidePrompt" && method != "hide" && method != "hideAll") 
            	methods.init.apply(form);
             
            return methods[method].apply(form, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method == 'object' || !method) {
            methods.init.apply(form, arguments);
            return methods.attach.apply(form);
        } else {
            $.error('Method ' + method + ' does not exist in jQuery.validationEngine');
        }
    };
})(jQuery);


(function($){
    $.fn.validationEngineLanguage = function(){
    };
    $.validationEngineLanguage = {
        newLang: function(){
            $.validationEngineLanguage.allRules = {
                "required": { 
                    "regex": "none",
                    "alertText": "* This field is required",
                    "alertTextCheckboxMultiple": "* Please select an option",
                    "alertTextCheckboxe": "* This checkbox is required"
                },
                "minSize": {
                    "regex": "none",
                    "alertText": "* Minimum ",
                    "alertText2": " characters allowed"
                },
                "maxSize": {
                    "regex": "none",
                    "alertText": "* Maximum ",
                    "alertText2": " characters allowed"
                },
                "min": {
                    "regex": "none",
                    "alertText": "* Minimum value is "
                },
                "max": {
                    "regex": "none",
                    "alertText": "* Maximum value is "
                },
                "past": {
                    "regex": "none",
                    "alertText": "* Date should be prior to "
                },
                "future": {
                    "regex": "none",
                    "alertText": "* Date past "
                },	
                "maxCheckbox": {
                    "regex": "none",
                    "alertText": "* Checks allowed Exceeded"
                },
                "minCheckbox": {
                    "regex": "none",
                    "alertText": "* Please select ",
                    "alertText2": " options"
                },
                "equals": {
                    "regex": "none",
                    "alertText": "* Fields do not match"
                },
                "notequals": {
                    "regex": "none",
                    "alertText": "* New password should not be same as old password"
                },
                "phone": {
                    // credit: jquery.h5validate.js / orefalo
                    "regex": /^([\+][0-9]{1,3}[ \.\-])?([\(]{1}[0-9]{2,6}[\)])?([0-9 \.\-\/]{3,20})((x|ext|extension)[ ]?[0-9]{1,4})?$/,

                    "alertText": "* Invalid Phone number"
                },
				"mobile": {
                    "regex": /^[7-9]{1}[0-9-\s\+\(\)]*$/,
                    //"regex": /^([0-9]){10}$/,
                    "alertText": "* Invalid Mobile number, Enter 10 digits starts with 7 or 8 or 9."
                },
                "email": {
                    // Simplified, was not working in the Iphone browser
                    "regex": /^([A-Za-z0-9_\-\.\'\+])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,6})$/,
                    "alertText": "* Invalid email address"
                },
                "integer": {
                    "regex": /^[\-\+]?\d+$/,
                    "alertText": "* Not a valid integer"
                },
                "number": {
                    // Number, including positive, negative, and floating decimal. credit: orefalo
                    "regex": /^[\-\+]?(([0-9]+)([\.,]([0-9]+))?|([\.,]([0-9]+))?)$/,
                    "alertText": "* Invalid floating decimal number"
                },
				"date": {
                    "regex": /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/,
                    "alertText": "* Invalid date, must be in DD/MM/YYYY format"
                },
                "ipv4": {
                    "regex": /^((([01]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))[.]){3}(([0-1]?[0-9]{1,2})|(2[0-4][0-9])|(25[0-5]))$/,
                    "alertText": "* Invalid IP address"
                },
                "url": {
                    "regex": /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
                    "alertText": "* Invalid URL"
                },
                "onlyNumberSp": {
                    "regex": /^[0-9\ ]+$/,
                    "alertText": "* Numbers only"
                },
                "onlyLetterSp": {
                    "regex": /^[a-zA-Z\ \']+$/,
                    "alertText": "* Letters only"
                },
                "onlyLetterNumber": {
                    "regex": /^[0-9a-zA-Z]+$/,
                    "alertText": "* No special characters allowed"
                },
                
                "ajaxUserCall": {
                    "url": "ajaxValidateFieldUser",
                    // you may want to pass extra data on the ajax call
                    "extraData": "name=eric",
                    "alertText": "* This user is already taken",
                    "alertTextLoad": "* Validating, please wait"
                },
				"ajaxUserCallPhp": {
                    "url": "phpajax/ajaxValidateFieldUser.php",
                    // you may want to pass extra data on the ajax call
                    "extraData": "name=eric",
                   
                    "alertTextOk": "* This username is available",
                    "alertText": "* This user is already taken",
                    "alertTextLoad": "* Validating, please wait"
                },
                "ajaxNameCall": {
                    // remote json service location
                    "url": "ajaxValidateFieldName",
                    // error
                    "alertText": "* This name is already taken",
                   
                    "alertTextOk": "* This name is available",
                    // speaks by itself
                    "alertTextLoad": "* Validating, please wait"
                },
				 "ajaxNameCallPhp": {
	                    // remote json service location
	                    "url": "phpajax/ajaxValidateFieldName.php",
	                    // error
	                    "alertText": "* This name is already taken",
	                    // speaks by itself
	                    "alertTextLoad": "* Validating, please wait"
	                },
                "validate2fields": {
                    "alertText": "* Please input HELLO"
                }
                , "nameValidation" : {
                    "regex" : /^[a-zA-Z\ \']+$/,
                    "alertText": "* Please enter the name"
                }
                , "selectbox" : {
                    "regex" : 'none',
                    "alertText": "* Please selet one"
                }
            };
            
        }
    };
    $.validationEngineLanguage.newLang();
})(jQuery);