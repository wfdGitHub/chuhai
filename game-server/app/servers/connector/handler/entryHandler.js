var bearcat = require("bearcat")
var http = require('http')
var sdkConfig = require("../../../../config/sysCfg/sdkConfig.json")
var product_code = sdkConfig.product_code
var util = require("../../../../util/util.js")
var entryHandler = function(app) {
  this.app = app;
  this.sessionService = this.app.get('sessionService')
  this.areaDeploy = this.app.get('areaDeploy')
  this.connectorManager = this.app.get('connectorManager')
};
const configs = ["guild_lv","area_trial","mysterious_realm","task_cfg","item","checkpoints","heros","ttttower_realm","ttttower_level"]
var config_datas = []
for(var i = 0;i < configs.length;i++){
  config_datas.push(require("../../../../config/gameCfg/"+configs[i]+".json"))
  if(!config_datas[i]){
  	console.log("config_datas error "+configs[i])
  }
}
//获取配置
entryHandler.prototype.getRandomCfg = function(msg, session, next) {
  var data = config_datas[Math.floor(Math.random() * config_datas.length)]
  console.log("getRandomCfg",data.length)
  next(null,{flag : true,data : data})
}
//登陆账号
entryHandler.prototype.entryAccount = function(msg, session, next) {
	if(!msg.unionid){
		next(null,{flag : false,err : "参数错误"})
		return
	}
	var unionid = msg.unionid
	var loginToken = util.randomString(8)
	this.redisDao.db.hset("loginToken",unionid,loginToken)
	next(null,{flag:true,unionid:unionid,token:loginToken})
}
//quickSDK登陆
entryHandler.prototype.quickEntry = function(msg, session, next) {
	var token = msg.token
	var uid = msg.uid
	var channel_code = msg.channel_code
	var self = this
	var url = sdkConfig["CheckUserInfo"]+"?token="+token+"&product_code="+product_code+"&uid="+uid+"&channel_code="+channel_code
	http.get(url,function(res){
	  	res.on("data",function(data) {
	    	if(data == 1){
	    		var unionid = uid
	    		var loginToken = util.randomString(8)
	    		self.redisDao.db.hset("loginToken",unionid,loginToken)
	    		next(null,{flag:true,unionid:unionid,token:loginToken})
	    	}else{
	    		next(null,{flag:false,err:"渠道账号验证错误"})
	    	}
	  	})
		res.on("error", err => {
			console.log(err.message);
			next(null,{flag:false,err:err})
		});
	})
}
//token登陆
entryHandler.prototype.tokenLogin = function(msg, session, next) {
	console.log("tokenLogin",msg)
  if(this.connectorManager.runTime < 10000){
	next(null,{flag : false,err : "服务器准备中"})
	return
  }
  var unionid = msg.unionid
  var token = msg.token
  if(!unionid || !token){
    next(null,{flag : false,err : "参数错误"})
    return
  }
  console.log(unionid,token)
  var self = this
  self.redisDao.db.hget("loginToken",unionid,function(err,data) {
  	if(err || !data || data != token){
  		console.log("token 验证失败!")
  		next(null,{flag : false,err : "token 验证失败"})
  	}else{
		self.accountDao.getAccountInfo(msg,function(flag,userInfo) {
			console.log("userInfo",userInfo)
			if(!flag || !userInfo){
				self.accountDao.createAccount(msg,function(flag,data) {
					console.log("createAccount",data)
					if(!flag || !data){
						next(null,{flag : false,msg : data})
						return
					}
					entryHandler.entrySuccess.call(self,session,data,unionid,next)
				})
			}else if(userInfo.freeze && userInfo.freeze != 0){
				next(null,{flag : false,msg : "账号已被冻结"})
			}else{
				entryHandler.entrySuccess.call(self,session,userInfo,unionid,next)
			}
		})
  	}
  })
}
//登录成功
entryHandler.entrySuccess = function(session,userInfo,unionid,next) {
	var accId = Number(userInfo.accId)
    session.set("accId",accId)
    session.push("accId")
	session.set("limit",userInfo.limit)
	session.push("limit")
    session.set("unionid",unionid)
    session.push("unionid")
    userInfo.time = Date.now()
	// session.on("closed",onUserLeave.bind(this))
  	next(null, {flag : true,msg : userInfo});
}
var onUserLeave = function(session) {
	if(this.connectorManager.runTime < 10000)
		return
	var uid = session.uid
	if(uid){
		session.unbind(uid)
		var serverId = session.get("serverId")
		if(serverId){
			this.app.rpc.area.areaRemote.userLeave.toServer(serverId,uid,this.app.serverId,null)
		}
		this.app.rpc.chat.chatRemote.userLeave(null,uid,this.app.serverId,null)
	}
}

module.exports = function(app) {
  return bearcat.getBean({
  	id : "entryHandler",
  	func : entryHandler,
	args : [{
		name : "app",
		value : app
	}],
  	props : [{
  		name : "accountDao",
  		ref : "accountDao"
  	},{
  		name : "redisDao",
  		ref : "redisDao"
  	}]
  })
};