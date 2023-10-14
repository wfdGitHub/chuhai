var bearcat = require("bearcat")
var http = require('http')
var https = require('https')
var sdkConfig = require("../../../../config/sysCfg/sdkConfig.json")
var product_code = sdkConfig.product_code
var querystring = require("querystring")
var util = require("../../../../util/util.js")
var async = require("async")
var entryHandler = function(app) {
  this.app = app;
  this.sessionService = this.app.get('sessionService')
  this.areaDeploy = this.app.get('areaDeploy')
  this.connectorManager = this.app.get('connectorManager')
};
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
//SDK登陆
entryHandler.prototype.quickEntry = function(msg, session, next) {
	this.sdkEntry.entry(msg,function(data) {
			next(null,data)
	})
}
//39SDK登陆
// entryHandler.prototype.quickEntry = function(msg, session, next) {
// 		var juhe_token = msg.token
// 		var juhe_userid = msg.uid
// 		var app_id = sdkConfig["app_id"]
// 		var channel_userid = ""
// 		var payment_key = sdkConfig["payment_key"]
// 		var self = this
// 		var sign = util.md5("app_id="+app_id+"&channel_userid="+channel_userid+"&juhe_token="+juhe_token+"&juhe_userid="+juhe_userid+payment_key)
// 		sign = sign.toLocaleUpperCase()
// 		var postData=querystring.stringify({  
// 		    "juhe_token":juhe_token,
// 		    "juhe_userid" : juhe_userid,
// 		    "app_id" : app_id,
// 		    "channel_userid" : channel_userid,
// 		    "sign" : sign
// 		})
// 		var options={
// 		  hostname:'juhesdk.3975ad.com',
// 		  path:'/api/oauth/verify_token',
// 		  method:'POST',
// 		  headers:{
// 		    "Content-Type":"application/x-www-form-urlencoded; charset=utf-8",
// 		    "Content-Length" : postData.length
// 		  }
// 		}
// 	  var req=https.request(options,function(res){
// 	  var _data='';
// 	  res.on('data', function(chunk){
// 	     _data += chunk;
// 	  });
// 	  res.on('end', function(){
// 	  	var data = JSON.parse(_data)
//     	if(data && data.success == true){
//     		var unionid = juhe_userid
//     		var loginToken = util.randomString(8)
//     		self.redisDao.db.hset("loginToken",unionid,loginToken)
//     		next(null,{flag:true,unionid:unionid,token:loginToken})
//     	}else{
//     		next(null,{flag:false,err:"渠道账号验证错误"})
//     	}
// 	   });
// 	  })
// 	  req.on('error', function(e) {
// 	    cb(false,e)
// 	  })
// 	  req.write(postData);
// 	  req.end()
// }
//token登陆
entryHandler.prototype.tokenLogin = function(msg, session, next) {
  if(this.connectorManager.runTime < 3000){
	next(null,{flag : false,err : "服务器准备中"})
	return
  }
  var unionid = msg.unionid
  var token = msg.token
  if(!unionid || !token){
    next(null,{flag : false,err : "参数错误"})
    return
  }
  var self = this
  self.redisDao.db.hget("loginToken",unionid,function(err,data) {
  	if(err || !data || data != token){
  		next(null,{flag : false,err : "token 验证失败"})
  	}else{
		self.accountDao.getAccountInfo(msg,function(flag,userInfo) {
			if(!flag || !userInfo){
				self.accountDao.createAccount(msg,function(flag,data) {
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
  	},{
  		name : "sdkEntry",
  		ref : "sdkEntry"
  	}]
  })
};