steal( function(){
	can.Model('Webportal.Model.Dataservice',
	{ 
		/*loads base url*/
		baseURL : "/sampleProject/service/",
		/*loads fixtures url*/
		fixturesURL : {
			sample : "fixtures/sample.json.get"
		} 
		/*loads service url fragments*/
		,serviceURLFragment : {
		}
		/*sends request using Ajax*/
		,sendrequest: function(serviceObj,successcallback,errorcallback){
			var serviceURLFragmentObj = this.serviceURLFragment[serviceObj.serviceName || ""] || {};
			var sAdditionalParams = serviceObj.additionalParams|| null;
			var aDataExtras = [];
			aDataExtras.push("apiMethodType=" + (serviceObj.type || "get"));
			if(sAdditionalParams)
				aDataExtras.push(sAdditionalParams);

			//var jsonRequest = JSON.stringify(serviceObj.params || {});
			var ajaxObj = {};
			ajaxObj.url = this.baseURL + (serviceURLFragmentObj || "");
			ajaxObj.type = serviceObj.type || "post";
			ajaxObj.content = "application/json";
			ajaxObj.dataType = serviceObj.dataType || "json";
			ajaxObj.data = serviceObj.params;
			ajaxObj.success = this.proxy("processResponse",successcallback);
			ajaxObj.error = errorcallback;
			ajaxObj.cache = false;
			if (serviceObj.fixture) {
				ajaxObj.url = g_sAppInstallDir + this.fixturesURL[serviceObj.serviceName];
			}
			$.ajax(ajaxObj);
		}
		/*processes data from the response object*/
		,processResponse : function(successcallback,serverResponse,status,xhr){
			var statusObj = {};
			if(serverResponse) {
				if(serverResponse.error){
					var statusObj = {};
					statusObj.success = false;
					statusObj.errorCode = serverResponse.error.code;
					statusObj.errorMessage = serverResponse.error.message;
					successcallback.call(this, 'fail', serverResponse);
				}else{
					successcallback.call(this, status, serverResponse);
				}
			}else if( xhr.status >= 200 && xhr.status < 300 && (xhr.statusText == 'success' || xhr.statusText == 'OK') ){
				// ie, checking for the status in 200(success) series and statusText is 'success'
				successcallback.call(this, 'success', serverResponse);
			}else{
				var errorObj = {};
				errorObj.errorCode = "-1";
				errorObj.errorMessage = "Unknown Server Error!";
				successcallback.call(this, 'fail', errorObj);
			}
		}
	});
});