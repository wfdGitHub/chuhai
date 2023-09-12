//数据库查询
var sdkConfig = require("../../../config/sysCfg/sdkConfig.json")
var pay_cfg = require("../../../config/gameCfg/pay_cfg.json")
var util = require("../../../util/util.js")
var Md5_Key = sdkConfig["Md5_Key"]
const uuid = require("uuid")
var model = function() {
	var self
	var posts = {}
	var local = {}
	this.init = function (server,serverManager) {
		self = serverManager
		for(var key in posts){
			console.log("注册",key)
			server.post(key,posts[key])
		}
	}
	//获取服务器列表
	posts["/areaInfos"] = function(req,res) {
		var data = req.body
		self.redisDao.db.get("area:lastid",function(err,lastid) {
			var multiList = []
			for(var i = 1;i <= lastid;i++){
				multiList.push(["hgetall","area:area"+i+":areaInfo"])
			}
			self.redisDao.multi(multiList,function(err,list) {
				res.send(list)
			})
		})
	}
	//获取玩家列表
	posts["/user_list"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		if(data.uid)
			arr.push({key : "uid",value : data.uid})
		if(data.userName)
			arr.push({key : "userName",value : data.userName})
		if(data.accId)
			arr.push({key : "accId",value : data.accId})
		if(data.gname)
			arr.push({key : "gname",value : data.gname})
		if(data.area)
			arr.push({key : "area",value : data.area})
		var info = local.getSQL("user_list",arr,pageSize,pageCurrent,"uid")
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			self.mysqlDao.db.query(sql2,args2, function(err, list) {
				if (err) {
					// console.log('getCDTypeList! ' + err.stack);
					return
				}
				info.list = JSON.parse(JSON.stringify(list))
				res.send(info)
			})
		})
	}
	//获取订单记录
	posts["/game_order"] = function(req,res) {
		console.log("game_order")
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		if(data.uid)
			arr.push({key : "uid",value : data.uid})
		if(data.accId)
			arr.push({key : "accId",value : data.accId})
		if(data.areaId)
			arr.push({key : "areaId",value : data.areaId})
		if(data.userName)
			arr.push({key : "userName",value : data.userName})
		if(data.pay_id)
			arr.push({key : "pay_id",value : data.pay_id})
		if(data.game_order)
			arr.push({key : "game_order",value : data.game_order})
		if(data.order_no)
			arr.push({key : "order_no",value : data.order_no})
		if(data.status)
			arr.push({key : "status",value : data.status})
		var info = local.getSQL("game_order",arr,pageSize,pageCurrent,"id")
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			self.mysqlDao.db.query(sql2,args2, function(err, list) {
				if (err) {
					// console.log('getCDTypeList! ' + err.stack);
					return
				}
				info.list = JSON.parse(JSON.stringify(list))
				res.send(info)
			})
		})
	}
	//获取聊天记录
	posts["/getChat"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		if(data.uid)
			arr.push({key : "uid",value : data.uid})
		if(data.room)
			arr.push({key : "roomName",value : data.room})
		var info = local.getSQL("chat_record",arr,pageSize,pageCurrent,"id")
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			self.mysqlDao.db.query(sql2,args2, function(err, list) {
				if (err) {
					// console.log('getCDTypeList! ' + err.stack);
					return
				}
				info.list = JSON.parse(JSON.stringify(list))
				res.send(info)
			})
		})
	}
	//获取邮件日志
	posts["/mail_log"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		if(data.uid)
			arr.push({key : "uid",value : data.uid})
		if(data.admin)
			arr.push({key : "admin",value : data.admin})
		if(data.areaId)
			arr.push({key : "areaId",value : data.areaId})
		var info = local.getSQL("mail_log",arr,pageSize,pageCurrent,"id")
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			self.mysqlDao.db.query(sql2,args2, function(err, list) {
				if (err) {
					// console.log('getCDTypeList! ' + err.stack);
					return
				}
				info.list = JSON.parse(JSON.stringify(list))
				res.send(info)
			})
		})
	}
	//获取登陆日志
	posts["/login_log"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		if(data.uid)
			arr.push({key : "uid",value : data.uid})
		if(data.accId)
			arr.push({key : "accId",value : data.accId})
		if(data.userName)
			arr.push({key : "userName",value : data.userName})
		var info = local.getSQL("login_log",arr,pageSize,pageCurrent,"id")
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			self.mysqlDao.db.query(sql2,args2, function(err, list) {
				if (err) {
					// console.log('getCDTypeList! ' + err.stack);
					return
				}
				info.list = JSON.parse(JSON.stringify(list))
				res.send(info)
			})
		})
	}
	//获取道具日志
	posts["/item_log"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		if(data.uid)
			arr.push({key : "uid",value : data.uid})
		if(data.itemId)
			arr.push({key : "itemId",value : data.itemId})
		if(data.reason)
			arr.push({key : "reason",value : data.reason})
		if(data.type)
			arr.push({key : "type",value : data.type})
		var info = local.getSQL("item_log",arr,pageSize,pageCurrent,"id")
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			self.mysqlDao.db.query(sql2,args2, function(err, list) {
				if (err) {
					// console.log('getCDTypeList! ' + err.stack);
					return
				}
				info.list = JSON.parse(JSON.stringify(list))
				res.send(info)
			})
		})
	}
	//获取角色列表
	posts["/getRoleList"] = function(req,res) {
		var data = req.body
		var account_id = data.account_id
		if(!account_id){
			res.send({
				"error_code" : 1,
				"message" : "account_id : "+account_id
			})
		}else{
			self.accountDao.getRoleList(account_id,function(flag,data) {
				var info = {
					"error_code" : 0,
					"message" : "Thành công",
					"data" : data
				}
				res.send(info)
			})
		}
	}
	//使用激活码
	posts["/giftcode"] = function(req,res) {
		var data = req.body
		var app_key = data.app_key
		var account_id = data.account_id
		var uid = data.role_id
		var areaId = data.area_id
		var key = data.giftcode
		var app_key = data.app_key
		if(!sdkConfig.app_keys[app_key]){
			res.send({
				"error_code" : 1,
				"message" : "app_key 错误"
			})
			return
		}
		var v_sign = util.md5(data.app_key+data.account_id+data.role_id+data.area_id+data.giftcode+sdkConfig.app_keys[app_key]["secret_key"])
		if(v_sign != data.signature){
			res.send({
				"error_code" : 1,
				"message" : "签名验证失败"
			})
			return
		}
		//检查signature
		self.playerDao.getPlayerInfo({uid:uid},function(playerInfo) {
			if(!playerInfo || !playerInfo.areaId || !playerInfo.name){
				res.send({
					"error_code" : 1,
					"message" : "Thành công"
				})
				return
			}
			if(playerInfo.areaId != areaId){
				res.send({
					"error_code" : 1,
					"message" : "Thành công"
				})
				return
			}
			self.CDKeyDao.verifyCDKey(key,uid,areaId,playerInfo.name,function(flag,str) {
				if(!flag){
					res.send({
						"error_code" : 1,
						"message" : str
					})
				}else{
					var serverId = self.areaDeploy.getServer(areaId)
					self.app.rpc.area.areaRemote.sendMail.toServer(serverId,uid,areaId,"Mã gói","Bạn đã lấy được mã gói thành công!",str,null)
					res.send({
						"error_code" : 0,
						"message" : "Thành công"
					})
				}
			})
		})
	}
	//添加开服计划
	posts["/setOpenPlan"] = function(req,res) {
		var data = req.body
		var time = Number(data.time)
		self.setOpenPlan(time,function(flag,err) {
			res.send({flag:flag,err:err})
		})
	}
	//获取开服计划表
	posts["/getOpenPlan"] = function(req,res) {
		var data = req.body
		self.getOpenPlan(function(flag,data) {
			res.send({flag:flag,data:data})
		})
	}
	//删除开服计划
	posts["/delOpenPlan"] = function(req,res) {
		var data = req.body
		var time = data.time
		self.delOpenPlan(time,function(flag,err) {
			res.send({flag:flag,err:err})
		})
	}
	//添加合服计划
	posts["/setMergePlan"] = function(req,res) {
		var data = req.body
		var time = Number(data.time)
		var areaList = data.areaList
		self.setMergePlan(areaList,time,function(flag,err) {
			res.send({flag:flag,err:err})
		})
	}
	//获取合服计划表
	posts["/getMergePlan"] = function(req,res) {
		var data = req.body
		self.getMergePlan(function(flag,data,areaLock) {
			res.send({flag:flag,data:data,areaLock:areaLock})
		})
	}
	//删除合服计划
	posts["/delMergePlan"] = function(req,res) {
		var data = req.body
		var time = data.time
		self.delMergePlan(time,function(flag,err) {
			res.send({flag:flag,err:err})
		})
	}
	//获取全服邮件
	posts["/getAreaMailList"] = function(req,res) {
		self.redisDao.db.hgetall("allAreaMail",function(err,data) {
			res.send({flag:true,data:data})
		})
	}
	//发放全服邮件
	posts["/setAreaMailList"] = function(req,res) {
		var data = req.body
		data.beginTime = Number(data.beginTime)
		data.endTime = Number(data.endTime)
		data.areaMap = JSON.parse(data.areaMap)
		if(!data.areaMap || typeof(data.title) != "string" || typeof(data.text) != "string" || typeof(data.atts) != "string" || !Number.isInteger(data.beginTime) || !Number.isInteger(data.endTime)){
			res.send({flag:false,err:"参数错误"})
			return
		}
		var id = data.id ? data.id : uuid.v1()
		var mailInfo = {
			areaMap : data.areaMap,
			title : data.title,
			text : data.text,
			atts : data.atts,
			beginTime : data.beginTime,
			endTime : data.endTime
		}
		self.redisDao.db.hset("allAreaMail",id,JSON.stringify(mailInfo),function(err) {
			var serverIds = self.app.getServersByType('area')
		    for(var i = 0;i < serverIds.length;i++){
		        self.app.rpc.area.areaRemote.updateAreaMail.toServer(serverIds[i]["id"],function(flag,data) {})
		    }
		})
		res.send({flag:true})
	}
	//删除全服邮件
	posts["/delAreaMailList"] = function(req,res) {
		var data = req.body
		if(!data.id){
			res.send({flag:false,err:"参数错误"})
			return
		}
		self.redisDao.db.hdel("allAreaMail",data.id,function(err) {
			var serverIds = self.app.getServersByType('area')
		    for(var i = 0;i < serverIds.length;i++){
		        self.app.rpc.area.areaRemote.updateAreaMail.toServer(serverIds[i]["id"],function(flag,data) {})
		    }
		})
		res.send({flag:true})
	}
	//模拟充值
	posts["/rechargeToUser"] = function(req,res) {
		var uid = req.body.uid
		var pay_id = req.body.pay_id
		if(!pay_cfg[pay_id]){
			res.send({flag:false,err:"参数错误"})
			return
		}
		self.playerDao.getPlayerAreaId(uid,function(flag,data) {
			if(flag){
				var areaId = self.areaDeploy.getFinalServer(data)
				var serverId = self.areaDeploy.getServer(areaId)
				if(serverId){
					self.app.rpc.area.areaRemote.real_recharge.toServer(serverId,areaId,uid,Math.floor(Number(pay_cfg[pay_id]["rmb"])),function(){})
					self.app.rpc.area.areaRemote.finish_recharge.toServer(serverId,areaId,uid,pay_id,function(flag,data) {
						self.redisDao.db.rpush("admin:recharge",JSON.stringify({uid:uid,payInfo:pay_cfg[pay_id]}))
						res.send({flag:true})
					})
				}else{
					res.send({flag:false,err:"参数错误"})
				}
			}else{
				res.send({flag:false,err:"参数错误"})
			}
		})
	}
	//增加跨服机器人
	posts["/createRobotAccount"] = function(req,res) {
		self.accountDao.createRobotAccount(function(flag,err) {
			res.send({flag:flag,err:err})
		})
	}
	//获取服务器内玩家信息
	posts["/getAreaPlayers"] = function(req,res) {
		var areaId = req.body.areaId
		var serverId = self.areaDeploy.getServer(areaId)
	    if(!serverId){
	        next(null,{flag : false,err : "服务器不存在"})
	        return
	    }
	    self.app.rpc.area.areaRemote.getAreaPlayers.toServer(serverId,areaId,function(flag,list) {
	    	res.send({flag:flag,list:list})
		})
	}
	//登陆
	posts["/playerLogin"] = function(req,res) {
		var unionid = req.body.unionid
		self.app.rpc.connector.connectorRemote.playerLogin.toServer("connector-server-1",unionid,function(flag,data) {
			res.send({flag:flag,data:data})
		})
	}
	//离开
	posts["/playerLeave"] = function(req,res) {
		var accId = req.body.accId
		var uid = req.body.uid
		var name = req.body.name
		var ip = local.getClientIp(req)
		console.log("ip",ip)
		self.app.rpc.connector.connectorRemote.playerLeave.toServer("connector-server-1",accId,uid,name,ip,function(flag,data) {
			res.send({flag:flag,data:data})
		})
	}
	//挑战主线
	posts["/checkpointsSuccess"] = function(req,res) {
		console.log(req.body)
		var uid = req.body.uid
		var level = req.body.level
		var serverId = self.areaDeploy.getServer(1)
		self.app.rpc.area.areaRemote.checkpointsSuccess.toServer(serverId,uid,level,function(flag,data) {
			res.send("SUCCESS")
		})
	}
	//获得随机奖励
	posts["/gainRandChest"] = function(req,res) {
		var uid = req.body.uid
		var serverId = self.areaDeploy.getServer(1)
		self.app.rpc.area.areaRemote.gainRandChest.toServer(serverId,uid,function(flag,data) {
			res.send("SUCCESS")
		})
	}
	//主公等级提升
	posts["/lordLvUp"] = function(req,res) {
		var uid = req.body.uid
		var serverId = self.areaDeploy.getServer(1)
		self.app.rpc.area.areaRemote.lordLvUp.toServer(serverId,uid,function(flag,data) {
			res.send("SUCCESS")
		})
	}
	//领取快速挂机奖励
	posts["/getQuickOnhookAward"] = function(req,res) {
		var uid = req.body.uid
		var serverId = self.areaDeploy.getServer(1)
		self.app.rpc.area.areaRemote.getQuickOnhookAward.toServer(serverId,uid,function(flag,data) {
			res.send("SUCCESS")
		})
	}
	local.getSQL = function(tableName,arr,pageSize,pageCurrent,key) {
		var sql1 = "select count(*) from "+tableName
		var sql2 = "select * from "+tableName	
		var args1 = []
		var args2 = []
		for(var i = 0;i < arr.length;i++){
			if(i == 0){
				sql1 += " where "+arr[i]["key"]+" = ?"
				sql2 += " where "+arr[i]["key"]+" = ?"
			}else{
				sql1 += " and "+arr[i]["key"]+" = ?"
				sql2 += " and "+arr[i]["key"]+" = ?"
			}
			args1.push(arr[i]["value"])
			args2.push(arr[i]["value"])
		}
		sql2 += " order by "+key+" desc LIMIT ?,"+pageSize
		args2.push((pageCurrent-1)*pageSize)
		return {sql1:sql1,sql2:sql2,args1:args1,args2:args2}
	}
	local.getRoleList = function(account_id,cb) {
			self.accountDao.getRoleList(account_id,function(flag,data) {
				cb(data)
			})
	}
	//获取IP
	local.getClientIp = function(req) {
	    var ipAddress;
	    var forwardedIpsStr = req.headers['X-Forwarded-For'];//判断是否有反向代理头信息
	    if (forwardedIpsStr) {//如果有，则将头信息中第一个地址拿出，该地址就是真实的客户端IP；
	        var forwardedIps = forwardedIpsStr.split(',');
	        ipAddress = forwardedIps[0];
	    }
	    if (!ipAddress) {//如果没有直接获取IP；
	        ipAddress = req.connection.remoteAddress;
	    }
	    return ipAddress;
	}
}
module.exports = new model()