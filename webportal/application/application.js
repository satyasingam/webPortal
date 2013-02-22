steal('can/control', function() {
	can.Control('Webportal.Application', {}
		, {
		init : function() {
			Webportal.Model.Common.prototype.getUserInfo({},this.proxy('getUserInfoSuccess'), this.proxy('serverError'));
		}
		, getUserInfoSuccess : function(status, userObj) {			
			new Webportal.Pagesholder(this.element.find('#pagesHolder'), {userObj:userObj});
		}
		, serverError : function(status, errorObj) {
			alert('Server Busy, Please try after some time...');
		}
	})
});