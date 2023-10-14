//SDK获取数据模块
const async = require("async")
const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const util = require("../../../util/util.js")
const http = require('http')
const https = require('https')
const querystring = require("querystring")
var priKey = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCimZ5iIRKMjqVVAJU5Xkqg2ozLh4pg6z3VwXa8RMnqLirZ+n3gssJRCVVX0vOEefLJGH997h6GV9Gv97URHFAqoHrQP43nz6t0foizzTndYCJONoKFH1q8qnbdkVx2FzlMUUJOwPTRtZUw9RTEHPHAV+39mERtd6mLoB7HfcvW9/IdaSO3hmh90giaP598Sc6cKflVByZ22EgfqFJl2fU1cP4Ol/dnwiTSNqYGRABT05iLJHt2zeLn6d0hIw+QskzRUaep7G3+fhZGHyBQ93q3fziY6CtlOC59LSfr/Sn497M1Qjcq537qr98Y+Vp/usJeQE9UEE8WHK/yPJJfQdbpAgMBAAECggEAVBKWACsVijOfbOoWPklw0Obv8bStaht4J3QWzpXKyRkB8x8/wtTrADeRNw3N9+uOC0htc1GR2ujBdPjhWG2JTeEYX2DdIMUR4/Qg/sbYaoxwcHxi1C44HmENgNbONgkgCUPiwxGmBGCdOWkfSZ+lqExOs9btWqSKt7Uc9Q0oPoe0fGELCwfN9BrB5dJW9hU9Rx+o32PfdAG4xpnwh9J++ssTulrVUuhU6ZGEcR6aVdqXkR/89EicZm5vmACXt92A76zB30ptQz05RooSLG2Fc8g6oMnKAQZbTUQMXze02aIm37eXO8i1d/awoP1Fqqg6T+aqe04j04DXcbfpRPlGeQKBgQDpKNDStPkOCzDft6R8vQ9sIWzluimZwlwv2p4G/GDZJ4irSVjVSxtQ9w8kpSyGYMx66D/y5kNKcpmmpZkhlxF2RYNWv1gcu8ABXogQl+9gMvN/qqjEdYZISNPa/VelN4SSJL9+sy3fa/Rgcf6AtAUQxWg/afu4FZEHykIuUoOxCwKBgQCyh0/HuYGqjxcmT+vcG2EZmol2bZtdHG3bEubLOZVX2RG4KNBaWfQVbpbkdmNgG9D/etseoUVX9o21TutIOHl4yGmRx+5ZxRaejcjEKA721ZxPO2x7mZVPQ3p0FiCGPcsQAcKgY0wpE7ITuZC3f2w5XrH/nIiq37FFtrEprNa4WwKBgCz6zcZIWV+nMweFovrZcjc2/44V6t6ZyzUEJMZOO9TItqnsnXGQarWk48v6/WrzE5+GXIfcehDLqO6oNbFwNlMtt9etVC8+3RymgvNIjEpvqd/wKVy1G3Gocw5lH1plKnMTGco0gN4AMoXEmAd2Mx/4JVNOe9wYdQEeuMO88WDfAoGAIRsYf0f2NKOuPkuJyFpHalEO9qgirGSONpbNt5fpCs5VC9p9sJOHwMWuM5WEnhjqa8Xjhk2Pp10wMBP/a3gVhoFbmk4B9CGpLSPLvBxVkg5QmxzA5Da5ymYP+iD0TRB+bGx3I/jl8aQWXLQHkw+NCSJ3TZhAe7dZjzzuo3TKqIsCgYEA1CzXGF5Ia+glJ84y/JEsTb3hpBG+dND11O2NexE6T6Ftw4a+6BDW2Sg/bN6OyC1myDNGYOAS4PAKbRwCgwpwgCTWViGkO8LHFpUdUduVVHjNTLVDbosfC+RExLtOG3WZ0u09opSsZfsagm9A2V+Ctd3RVNUUoIeiYU/ru2nz0GE="
var pubKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAopmeYiESjI6lVQCVOV5KoNqMy4eKYOs91cF2vETJ6i4q2fp94LLCUQlVV9LzhHnyyRh/fe4ehlfRr/e1ERxQKqB60D+N58+rdH6Is8053WAiTjaChR9avKp23ZFcdhc5TFFCTsD00bWVMPUUxBzxwFft/ZhEbXepi6Aex33L1vfyHWkjt4ZofdIImj+ffEnOnCn5VQcmdthIH6hSZdn1NXD+Dpf3Z8Ik0jamBkQAU9OYiyR7ds3i5+ndISMPkLJM0VGnqext/n4WRh8gUPd6t384mOgrZTgufS0n6/0p+PezNUI3Kud+6q/fGPlaf7rCXkBPVBBPFhyv8jySX0HW6QIDAQAB"
var key = new NodeRSA(priKey,'pkcs8-private')
var model = function() {
	var self = this
	var posts = {}
	var local = {}
	this.init = function (server,serverManager) {
		this.serverManager = serverManager
		for(var key in posts){
			console.log("注册",key)
			server.post(key,posts[key])
		}
	}

	// Response字段	类型	必选	说明
	// bizResp	String	是	响应参数，值为每个接口对应响应参数的JSON字符串
	// apiMethod	String	是	接口名称
	// respTime	String	是	响应时间，格式使用ISO8601规范，示例：2023-03-09T14:41:19+0800
	// appkey	String	是	游戏appkey
	// gameType	String	是	游戏端类型，网游为client H5游戏为 h5
	// signature	String	是	响应签名（签名方式参见下文）
	// osType	String	否	系统类型，ios或android
	//获取角色信息
	posts["/x7sy_roleQuery"] = function(req,res) {
		var body = req.body
		var data = JSON.parse(body.bizParams)
		var info = {
			bizResp : {
				respCode : "SUCCESS",
				respMsg : "SUCCESS",
				role : {},
				guidRoles : []
			},
			apiMethod : body.apiMethod,
			respTime : body.reqTime,
			appkey : this.sdkPay.sdkConfig["AppKey"]["value"],
			gameType : body.gameType,
			signature : body.signature,
			osType : body.osType
		}
		if(data.roleId){
			self.redisDao.db.hmget("player:user:"+data.roleId+":playerInfo",["accId","areaId"],function(err,list) {
				self.redisDao.db.hget("acc:user:"+list[0]+":base","unionid",function(err,unionid) {
					self.getx7syRole(unionid,list[1],function(flag,roleData) {
						if(!flag){
							info.bizResp.respCode = "FAILD"
							info.bizResp.respMsg = roleData
						}else{
							info.bizResp.role = roleData
						}
						self.x7syhashSign(info)
						res.send(info)
					})
				})
			})
		}else if(data.guids){
			self.getx7syRoleList(data.guids,data.serverId,function(roles) {
				info.bizResp.guidRoles = roles
				self.x7syhashSign(info)
				res.send(info)
			})
		}else{
			self.x7syhashSign(info)
			res.send(info)
		}
	}
}
//小七敏感词屏蔽  test https://api.x7sy.com/x7DetectionHelper/gateway
model.prototype.x7syMessageDetect = function(guid,os,message,cb) {
	var self = this
	var bizParams = {"guid":guid,"detectionMessage":message}
	self.x7syRequest(bizParams,"x7Detection.messageDetect",function(data) {
		var bizResp = JSON.parse(data.bizResp)
		var detectResult = bizResp.detectResult
		if(bizResp.respCode != "SUCCESS"){
			cb(false)
			return
		}
		if(detectResult.level != 1){
			if(detectResult.sensitiveWords.length)
				for(var i = 0;i < detectResult.sensitiveWords.length;i++)
					message = message.replaceAll(detectResult.sensitiveWords[i],"*")
			self.x7syMessageDetectReport(detectResult.detectionLogId,3)
		}
		cb(true,message,detectResult.level)
	})
}
//小七敏感词上报
model.prototype.x7syMessageDetectReport = function(detectionLogId,operateType) {
	this.x7syRequest({detectionLogId:detectionLogId,operateType:operateType},"x7Detection.messageDetectReport",function(data) {})
}
//小七接口
model.prototype.x7syRequest = function(bizParams,apiMethod,cb) {
	var options={
	  hostname:'api.x7sy.com',
	  port:443,
	  path:'/x7Detection/gateway',
	  method:'POST',
	  headers:{
	    "Content-Type":"application/x-www-form-urlencoded",
	  }
	}
	var info = {
		bizParams : bizParams,
		apiMethod : apiMethod,
		reqTime : new Date().toISOString(),
		appkey : this.sdkPay.sdkConfig["AppKey"]["value"],
		gameType : "client",
		osType : "android"
	}
	this.x7syRequestSign(info)
	var req=https.request(options,function(res){
	var _data='';
	res.on('data', function(chunk){
	   _data += chunk;
	});
	res.on('end', function(){
		_data = JSON.parse(_data)
		cb(_data)
	 });
	})
	req.on('error', function(e) {
	})
	info = querystring.stringify(info)
	req.write(info);
	req.end()
}
model.prototype.getTimeStamp = function() {
    var parts = isostr.match(/d+/g);
    return new Date(parts[0]+'-'+parts[1]+'-'+parts[2]+' '+parts[3]+':'+parts[4]+':'+parts[5]).getTime();
}
//小七回调签名 POST + 空格 + $apiMethod + @ + $appkey + # + $gameType + . + $respTime + \n\n + $bizResp
model.prototype.x7syhashSign = function(info) {
	info.bizResp = JSON.stringify(info.bizResp)
	var appkey = this.sdkPay.sdkConfig["appkey"]
	var payload = "POST "+info.apiMethod+"@"+appkey+"#"+info.gameType+"."+info.respTime+"\n\n"+info.bizResp
    info.signature = key.sign(Buffer.from(payload),"base64").toString("base64")
}
//小七请求签名
model.prototype.x7syRequestSign = function(info) {
	info.bizParams = JSON.stringify(info.bizParams)
	var appkey = this.sdkPay.sdkConfig["AppKey"]["value"]
	var payload = "POST "+info.apiMethod+"@"+appkey+"#"+info.gameType+"."+info.reqTime+"\n\n"+info.bizParams
    info.signature = key.sign(Buffer.from(payload),"base64").toString("base64")
}
//批量获取角色信息
model.prototype.getx7syRoleList = async function(guids,serverId,cb) {
	var self = this
	var list = []
	for(let i = 0;i < guids.length;i++){
		if(serverId){
			list.push({"unionid" : guids[i],"serverId":serverId})
		}else{
			var gList = await self.getx7syServerAwait(guids[i])
			list = list.concat(gList)
		}
	}
	var roles = []
	for(let i = 0;i < list.length;i++){
		role = await self.getx7syRoleAwait(list[i].unionid,list[i].serverId)
		if(role)
			roles.push(role)
	}
	cb(roles)
}
//异步获取服务器列表
model.prototype.getx7syServerAwait = function(unionid) {
	var self = this
	return new Promise(function(resolve) {
		self.redisDao.db.hget("acc:accMap:unionid",unionid,function(err,accId) {
			self.redisDao.db.hgetall("acc:user:"+accId+":areaMap",function(err,data) {
				var list = []
				for(var i in data){
					list.push({"unionid" : unionid,"serverId":i})
				}
				resolve(list)
			})
		})
	})
}
//异步获取角色数据
model.prototype.getx7syRoleAwait = function(unionid,serverId) {
	var self = this
	return new Promise(function(resolve) {
		self.getx7syRole(unionid,serverId,function(flag,roleData) {
			resolve(roleData)
		})
	})
}
// Role字段	类型 (长度)	必选	说明
// roleId	String (64)	是	游戏角色ID
// guid	String (64)	是	小7小号ID
// roleName	String (100)	是	角色名称
// serverId	String (64)	是	角色所属区服ID
// serverName	String (64)	是	角色所属区服名称
// roleLevel	String (100)	是	角色等级， 示例：100，无此属性可留空
// roleCE	String (100)	是	角色战力，示例：20000，无此属性可留空
// roleStage	String (100)	是	角色关卡，示例：2-3，无此属性可留空
// roleRechargeAmount	Float (10,2)	是	角色总充值，精度为小数点后2位，无此属性可留空
// roleGuild	String (100)	否	角色所属公会，无此属性可不传
model.prototype.getx7syRole = function(unionid,serverId,cb) {
	var self = this
	var role = {}
	async.waterfall([
		function(next) {
			role.guid = unionid
			self.redisDao.db.hget("acc:accMap:unionid",unionid,function(err,data) {
				if(!data){
					next("账号不存在")
					return
				}
				role.accId = data
				next()
			})
		},
		function(next) {
			//获取角色ID
			self.redisDao.db.hget("acc:user:"+role.accId+":areaMap",serverId,function(err,data) {
				if(!data){
					next("角色不存在")
					return
				}
				role.roleId = data
				next()
			})
		},
		function(next) {
			//获取基础数据
			self.redisDao.db.hgetall("player:user:"+role.roleId+":playerInfo",function(err,userInfo) {
				if(err || !userInfo){
					next("角色不存在")
				}else{
					role.roleName = userInfo.name
					role.serverId = userInfo.areaId
					role.serverName = userInfo.areaId+"服"
					role.roleLevel = userInfo.level
					role.roleCE = userInfo.CE
					role.roleRechargeAmount = Number((Number(userInfo.real_rmb)/100).toFixed(2))
					role.roleGuild = userInfo.gname
					next()
				}
			})
		},
		function(next) {
			//获取关卡
			self.redisDao.db.hget("player:user:"+role.roleId+":playerData","boss",function(err,boss) {
				role.roleStage = boss || "0"
				cb(true,role)
			})
		}
	],function(err) {
		cb(false)
	})
}
module.exports = {
	id : "sdkQuery",
	func : model,
	scope : "prototype",
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "payDao",
		ref : "payDao"
	},{
		name : "sdkPay",
		ref : "sdkPay"
	}]
}