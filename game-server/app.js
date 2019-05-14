var pomelo = require('pomelo');
var bearcat = require("bearcat")
var contextPath = require.resolve('./context.json');
var app = pomelo.createApp();
/**
 * Init app for client.
 */
app.set('name', 'onlineGame');
// app configuration
bearcat.createApp([contextPath])
bearcat.start(function() {
  app.configure('production|development',function() {
    //消息串行化
    app.filter(pomelo.filters.serial());
    //检测到node.js中事件循环的请求等待队列过长，超过一个阀值时，就会触发toobusy
    app.before(pomelo.filters.toobusy());
    //处理超时进行警告，默认三秒
    app.filter(pomelo.filters.timeout());
  })
  app.configure('production|development', 'connector', function(){
    app.set('connectorConfig',
      {
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 20,
        disconnectOnTimeout : true,
        useDict : true,
        useProtobuf : true
      });

  });
  app.configure('production|development', 'gate', function(){
    app.set('connectorConfig',
      {
        connector : pomelo.connectors.hybridconnector,
        heartbeat : 20,
        disconnectOnTimeout: true,
        useDict : true,
        useProtobuf : true,
        // ssl: {
        //   type: 'wss',
        //   key: fs.readFileSync('./keys/server.key'),
        //   cert: fs.readFileSync('./keys/server.crt'),
        // }
      });
  });
  app.configure('production|development', 'area', function(){
    var areaManager = bearcat.getBean("areaManager")
    areaManager.init(app)
    app.set("areaManager",areaManager)
  });
	app.start()
})