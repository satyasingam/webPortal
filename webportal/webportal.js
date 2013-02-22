var g_sAppInstallDir = './webportal/';
steal( 
      'can/control'
    , 'can/control/view'
    , 'can/view/ejs'
    , 'can/model'
    , 'can/route'
    , 'can/construct/proxy' 
).then(
      'webportal/application'
    , 'webportal/pagesholder'
    , 'webportal/header'
    , 'webportal/footer'
    , 'webportal/bodycontent'
).then(
     'webportal/model/dataservice.js'
   , 'webportal/model/common.js'
).then(
     'webportal/resources/jquery.validationEngine.js'
).then(
    function(){
        new Webportal.Application($('body'));
    }
) 