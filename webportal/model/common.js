steal( function(){
    can.Model('Webportal.Model.Common',{
		getUserInfo : function(params,successcallback,errorcallback){
            var serviceObj = {};
            serviceObj.fixture = true;
            serviceObj.serviceName = 'sample';
            serviceObj.type = "get";
            serviceObj.dataType = 'json';
            serviceObj.success = successcallback;
            serviceObj.error = errorcallback;
            Webportal.Model.Dataservice.prototype.sendrequest(serviceObj, successcallback , errorcallback);
        }
    })
});