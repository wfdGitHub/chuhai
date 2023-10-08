//数据库查询
const http = require("http")
const uuid = require("uuid")
const os = require('os');
const querystring = require("querystring")
const item_cfg = require("../game-server/config/gameCfg/item.json")
const pay_cfg = require("../game-server/config/gameCfg/pay_cfg.json")
const recharge_cfg = require("../game-server/config/gameCfg/recharge.json")
const hufu_quality = require("../game-server/config/gameCfg/hufu_quality.json")
const hufu_skill = require("../game-server/config/gameCfg/hufu_skill.json")
const heros = require("../game-server/config/gameCfg/heros.json")
const lv_cfg = require("../game-server/config/gameCfg/lv_cfg.json")
const star_base = require("../game-server/config/gameCfg/star_base.json")
const stringRandom = require('string-random');
const dataClean = require("./model/dataClean.js")
const sqlClean = require("./model/sqlClean.js")
var model = function() {
	var self = this
	var posts = {}
	var local = {}
	var items = {}
	this.init = function (server,mysqlDao,redisDao) {
		self.mysqlDao = mysqlDao
		self.redisDao = redisDao
		self.server = server
		dataClean.init(server,mysqlDao,redisDao)
		sqlClean.init(server,mysqlDao,redisDao)
		for(var key in posts){
			server.post(key,posts[key])
		}
        for(var i in item_cfg){
			items[i] = item_cfg[i]["name"]
        }
	}
	//获取直充表
	posts["/getRechargeCfg"] = function(req,res) {
		res.send(recharge_cfg)
	}
	//获取系统数据
	posts["/getOSData"] = function(req,res) {
		var info = {}
		info.freemem = os.freemem()
		info.totalmem = os.totalmem()
		info.cpus = os.cpus()
		info.uptime = os.uptime()
		res.send(info)
	}
	//数据库清档
	posts["/sqlClean"] = function(req,res) {
		sqlClean.dataClean(function(flag,data) {
			if(flag){
				res.send("SUCCESS")
			}else{
				res.send(data)
			}
		})
	}
	//获取玩家英雄列表
	posts["/getUserHeros"] = function(req,res) {
		var uid = req.body.uid
		self.redisDao.db.hgetall("player:user:"+uid+":heroMap",function(err,data) {
			if(err || !data){
				res.send({})
				return
			}
			var multiList = []
			var hIds = []
			for(var hId in data){
				hIds.push(hId)
				multiList.push(["hgetall","player:user:"+uid+":heros:"+hId])
			}
			self.redisDao.multi(multiList,function(err,list) {
				var hash = {}
				for(var i = 0;i < list.length;i++){
					for(var j in list[i]){
						var tmp = Number(list[i][j])
						if(tmp == list[i][j])
							list[i][j] = tmp
					}
					list[i].hId = hIds[i]
					hash[list[i].hId] = list[i]
				}
				res.send(hash)
				return
			})
		})
	}
	//获取玩家道具背包
	posts["/getUserBag"] = function(req,res) {
		var uid = req.body.uid
		self.redisDao.db.hgetall("player:user:"+uid+":bag",function(err,data) {
			res.send(data)
		})
	}
	//获取玩家个人信息
	posts["/getUserInfo"] = function(req,res) {
		var uid = req.body.uid
		self.redisDao.db.hgetall("player:user:"+uid+":playerInfo",function(err,data) {
			res.send(data)
		})
	}
	//获取全服邮件
	posts["/getAreaMailList"] = function(req,res) {
		local.post("127.0.0.1",5081,"/getAreaMailList",{},function(data) {
			res.send(data)
		})
	}
	//发放全服邮件
	posts["/setAreaMailList"] = function(req,res) {
		local.post("127.0.0.1",5081,"/setAreaMailList",req.body,function(data) {
			res.send(data)
		})
	}
	//删除全服邮件
	posts["/delAreaMailList"] = function(req,res) {
		local.post("127.0.0.1",5081,"/delAreaMailList",req.body,function(data) {
			res.send(data)
		})
	}
	//获取开服计划表
	posts["/getOpenPlan"] = function(req,res) {
		local.post("127.0.0.1",5081,"/getOpenPlan",{},function(data) {
			res.send(data)
		})
	}
	//添加开服计划
	posts["/setOpenPlan"] = function(req,res) {
		var data = req.body
		local.post("127.0.0.1",5081,"/setOpenPlan",{time:data.time},function(data) {
			res.send(data)
		})
	}
	//删除开服计划
	posts["/delOpenPlan"] = function(req,res) {
		var data = req.body
		local.post("127.0.0.1",5081,"/delOpenPlan",{time:data.time},function(data) {
			res.send(data)
		})
	}
	//获取合服计划表
	posts["/getMergePlan"] = function(req,res) {
		var data = req.body
		local.post("127.0.0.1",5081,"/getMergePlan",{},function(data) {
			res.send(data)
		})
	}
	//添加合服计划
	posts["/setMergePlan"] = function(req,res) {
		var data = req.body
		local.post("127.0.0.1",5081,"/setMergePlan",{time:data.time,areaList:data.areaList},function(data) {
			res.send(data)
		})
	}
	//删除合服计划
	posts["/delMergePlan"] = function(req,res) {
		var data = req.body
		local.post("127.0.0.1",5081,"/delMergePlan",{time:data.time},function(data) {
			res.send(data)
		})
	}
    //获取物品表
    posts["/get_items"] = function(req,res) {
        res.send(item_cfg)
    }
    //获取支付表
    posts["/get_pay_cfg"] = function(req,res) {
        res.send(pay_cfg)
    }
    //模拟充值
    posts["/rechargeToUser"] = function(req,res) {
		local.post("127.0.0.1",5081,"/rechargeToUser",req.body,function(data) {
			res.send(data)
		})
    }
    //增加跨服机器人
    posts["/createRobotAccount"] = function(req,res) {
		local.post("127.0.0.1",5081,"/createRobotAccount",{},function(data) {
			res.send(data)
		})
    }
    //获取服务器内玩家列表
    posts["/getAreaPlayers"] = function(req,res) {
		local.post("127.0.0.1",5081,"/getAreaPlayers",req.body,function(data) {
			res.send(data)
		})
    }
    //获取充值列表
    posts["/getRechargeToUserList"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("admin:recharge",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("admin:recharge",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
    }
	//清聊天记录
	posts["/clearChatRecord"] = function(req,res) {
		var url = "http://127.0.0.1:5081/clearChatRecord"
		http.get(url,function(res){})
		res.send("SUCCESS")
	}
	//封号
	posts["/freezeAcc"] = function(req,res) {
		var data = req.body
		var url = "http://127.0.0.1:5081/freezeAcc?uid="+data.uid+"&value="+data.value
		http.get(url,function(res){})
		res.send("SUCCESS")
	}
	//获取返利道具
	posts["/getRebateItem"] = function(req,res) {
		self.redisDao.db.hgetall("rebate_item_map",function(err,data) {
			res.send(data)
		})
	}
	//设置返利道具
	posts["/setRebateItem"] = function(req,res) {
		var data = req.body
		var info = {
			"rmb" : data.rmb,
			"title" : data.title,
			"text" : data.text,
			"award" : data.award,
			"beginTime" : data.beginTime,
			"endTime" : data.endTime
		}
		self.redisDao.db.hset("rebate_item_map",data.id,JSON.stringify(info),function(err) {
			var url = "http://127.0.0.1:5081/updateRebate"
			http.get(url,function(res){})
			res.send("SUCCESS")
		})
	}
	//删除返利道具
	posts["/delRebateItem"] = function(req,res) {
		var data = req.body
		self.redisDao.db.hdel("rebate_item_map",data.id,function(err) {
			var url = "http://127.0.0.1:5081/updateRebate"
			http.get(url,function(res){})
			res.send("SUCCESS")
		})
	}
	//获取返利元宝
	posts["/getRebateGold"] = function(req,res) {
		self.redisDao.db.hgetall("rebate_gold_map",function(err,data) {
			res.send(data)
		})
	}
	//设置返利元宝
	posts["/setRebateGold"] = function(req,res) {
		var data = req.body
		var info = {
			"title" : data.title,
			"text" : data.text,
			"rate" : data.rate,
			"beginTime" : data.beginTime,
			"endTime" : data.endTime
		}
		self.redisDao.db.hset("rebate_gold_map",data.id,JSON.stringify(info),function(err) {
			var url = "http://127.0.0.1:5081/updateRebate"
			http.get(url,function(res){})
			res.send("SUCCESS")
		})
	}
	//删除返利元宝
	posts["/delRebateGold"] = function(req,res) {
		var data = req.body
		self.redisDao.db.hdel("rebate_gold_map",data.id,function(err) {
			var url = "http://127.0.0.1:5081/updateRebate"
			http.get(url,function(res){})
			res.send("SUCCESS")
		})
	}
	//获取返利现金券
	posts["/getRebateRMB"] = function(req,res) {
		self.redisDao.db.hgetall("rebate_rmb_map",function(err,data) {
			res.send(data)
		})
	}
	//设置返利现金券
	posts["/setRebateRMB"] = function(req,res) {
		var data = req.body
		var info = {
			"title" : data.title,
			"text" : data.text,
			"rate" : data.rate,
			"beginTime" : data.beginTime,
			"endTime" : data.endTime
		}
		self.redisDao.db.hset("rebate_rmb_map",data.id,JSON.stringify(info),function(err) {
			var url = "http://127.0.0.1:5081/updateRebate"
			http.get(url,function(res){})
			res.send("SUCCESS")
		})
	}
	//删除返利现金券
	posts["/delRebateRMB"] = function(req,res) {
		var data = req.body
		self.redisDao.db.hdel("rebate_rmb_map",data.id,function(err) {
			var url = "http://127.0.0.1:5081/updateRebate"
			http.get(url,function(res){})
			res.send("SUCCESS")
		})
	}
	//设置服务器名称
	posts["/setAreaName"] = function(req,res) {
		var data = req.body
		self.redisDao.db.hset("area:areaName",data.areaId,data.name,function(err) {
			self.redisDao.db.hset("area:area"+data.areaId+":areaInfo","areaName",data.name)
			var url = "http://127.0.0.1:5081/updateAreaName"
			http.get(url,function(res){})
			res.send("SUCCESS")
		})
	}
	//清除战斗校验错误数据
	posts["/verify_clear"] = function(req,res) {
		self.redisDao.db.del("verify_faild",function(err,data) {
			res.send("SUCCESS")
		})
	}
	//获取战斗校验错误日志
	posts["/verify_faild"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("verify_faild",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("verify_faild",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//清除游戏建议数据
	posts["/advise_clear"] = function(req,res) {
		self.redisDao.db.del("submitAdvise",function(err,data) {
			res.send("SUCCESS")
		})
	}
	//获取游戏建议数据
	posts["/submitAdvise"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("submitAdvise",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("submitAdvise",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//清除报错堆栈
	posts["/clear_client_error"] = function(req,res) {
		self.redisDao.db.del("client:logs",function(err,data) {
			res.send("SUCCESS")
		})
	}
	//获取报错堆栈
	posts["/get_client_error"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("client:logs",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("client:logs",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//清除报错堆栈
	posts["/clear_server_error"] = function(req,res) {
		self.redisDao.db.del("server:logs",function(err,data) {
			res.send("SUCCESS")
		})
	}
	//获取报错堆栈
	posts["/get_server_error"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("server:logs",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("server:logs",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//清除错误订单
	posts["/clear_pay_faild_order"] = function(req,res) {
		self.redisDao.db.del("pay_faild_order",function(err,data) {
			res.send("SUCCESS")
		})
	}
	//获取错误订单
	posts["/get_pay_faild_order"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("pay_faild_order",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("pay_faild_order",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//清除异常发言
	posts["/clear_banSendMsg"] = function(req,res) {
		self.redisDao.db.del("client:banSendMsg",function(err,data) {
			res.send("SUCCESS")
		})
	}
	//获取异常发言
	posts["/get_banSendMsg"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("client:banSendMsg",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("client:banSendMsg",-(pageCurrent-1)*pageSize,-(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//发放护符
	posts["/send_hufu"] = function(req,res) {
		var data = req.body
		var uid = data.uid
		var lv = data.lv
		var s1 = data.s1
		var s2 = data.s2
		if(!uid){
			res.send(false)
		}else{
			local.sendHufu(uid,lv,s1,s2,function(flag,err) {
				res.send({flag:flag,err:err})
			})
		}
	}
	//获取护符记录
	posts["/get_hufuLog"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("game:sendHufu",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("game:sendHufu",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//发放英雄
	posts["/send_hero"] = function(req,res) {
		var data = req.body
		var uid = data.uid
		var otps = data.otps
		if(!uid){
			res.send(false)
		}else{
			local.sendHero(uid,otps,function(flag,err) {
				res.send({flag:flag,err:err})
			})
		}
	}
	//获取英雄记录
	posts["/get_heroLog"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var info = {}
		self.redisDao.db.llen("game:sendHero",function(err,total) {
			info.total = total
			self.redisDao.db.lrange("game:sendHero",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
				info.list = data
				res.send(info)
			})
		})
	}
	//获取总数据
	posts["/game_info"] = function(req,res) {
		var data = req.body
		var info = {}
		self.redisDao.db.hgetall("game:info",function(err,data) {
			info.list = data
			res.send(data)
		})
	}
	//获取服务器列表
	posts["/areaInfos"] = function(req,res) {
		console.log("areaInfos!!!",req.body)
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
	posts["/onlineNums"] = function(req,res) {
		self.redisDao.db.hgetall("onlineNums",function(err,data) {
			res.send(data)
		})
	}
	//获取服务器名称
	posts["/areaNames"] = function(req,res) {
		var data = req.body
		self.redisDao.db.hgetall("area,areaName",function(err,data) {
			res.send(data || {})
		})
	}
	//获取玩家列表
	posts["/user_list"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var key = data.key || "uid"
		var desc = data.desc
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
		var info = local.getSQL("user_list",arr,pageSize,pageCurrent,key,desc)
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
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var key = data.key || "id"
		var desc = data.desc
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
		if(data.beginTime)
			arr.push({key : "pay_time",value : data.beginTime,type:"more"})
		if(data.endTime)
			arr.push({key : "pay_time",value : data.endTime,type:"less"})

		var info = local.getSQL("game_order",arr,pageSize,pageCurrent,key,desc)
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			if(!pageSize || !pageCurrent){
				if(info.total >= 10000){
					res.send({"err" : "数据过长"})
					return
				}
			}
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
		if(data.beginTime)
			arr.push({key : "time",value : data.beginTime,type:"more"})
		if(data.endTime)
			arr.push({key : "time",value : data.endTime,type:"less"})
		var info = local.getSQL("item_log",arr,pageSize,pageCurrent,"id")
		var sql1 = info.sql1
		var sql2 = info.sql2
		var args1 = info.args1
		var args2 = info.args2
		var info = {}
		self.mysqlDao.db.query(sql1,args1,function(err,total) {
			info.total = JSON.parse(JSON.stringify(total))[0]["count(*)"]
			if(!pageSize || !pageCurrent){
				if(info.total >= 10000){
					res.send({"err" : "数据过长"})
					return
				}
			}
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
	//获取单日记录
	posts["/daily_table"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		var info = local.getSQL("daily_table",arr,pageSize,pageCurrent,"id")
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
	//获取留存记录
	posts["/retention_table"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		var info = local.getSQL("retention_table",arr,pageSize,pageCurrent,"id")
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
	//获取LTV记录
	posts["/LTV_table"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		var info = local.getSQL("LTV_table",arr,pageSize,pageCurrent,"id")
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
	//获取跨服数据
	posts["/cross_grading"] = function(req,res) {
		self.redisDao.db.zrevrange(["cross:grading:realRank",0,-1,"WITHSCORES"],function(err,list) {
			var uids = []
			var areaIds = []
			var scores = []
			for(var i = 0;i < list.length;i+=2){
				var strList = list[i].split("|")
				var areaId = Number(strList[0])
				var uid = Number(strList[1])
				if(uid > 10000){
					uids.push(uid)
					areaIds.push(areaId)
					scores.push(list[i+1])
				}
			}
			var info = {
				uids : uids,
				areaIds : areaIds,
				scores : scores
			}
			local.getPlayerBaseByUids(uids,function(userInfos) {
				info.userInfos = userInfos
				res.send(info)
			})
		})
	}
	//获取远古战场数据
	posts["/ancient_rank"] = function(req,res) {
		self.redisDao.db.zrevrange(["cross:ancient:realRank",0,-1,"WITHSCORES"],function(err,list) {
			var uids = []
			var areaIds = []
			var scores = []
			for(var i = 0;i < list.length;i+=2){
				var strList = list[i].split("|")
				var areaId = Number(strList[0])
				var uid = Number(strList[1])
				if(uid > 10000){
					uids.push(uid)
					areaIds.push(areaId)
					scores.push(list[i+1])
				}
			}
			var info = {
				uids : uids,
				areaIds : areaIds,
				scores : scores
			}
			local.getPlayerBaseByUids(uids,function(userInfos) {
				info.userInfos = userInfos
				res.send(info)
			})
		})
	}
	//获取同盟列表
	posts["/guild_info"] = function(req,res) {
		var info = {}
		var arr = []
		self.redisDao.db.hgetall("guild:guildNameMap",function(err,data) {
			for(var i in data){
				arr.push(["hgetall","guild:guildInfo:"+data[i]])
			}
			self.redisDao.multi(arr,function(err,data) {
				arr = []
				info.guildInfo = data
				for(var i = 0;i < data.length;i++){
					arr.push(["hgetall","player:user:"+data[i]["lead"]+":playerInfo"])
				}
				self.redisDao.multi(arr,function(err,data) {
					info.userInfo = data
					res.send(info)
				})
			})
		})
	}
	//获取跨服数据
	posts["/cross_peak"] = function(req,res) {
		self.redisDao.db.zrevrange(["cross:grading:realRank",0,-1,"WITHSCORES"],function(err,list) {
			var uids = []
			var areaIds = []
			var scores = []
			for(var i = 0;i < list.length;i+=2){
				var strList = list[i].split("|")
				var areaId = Number(strList[0])
				var uid = Number(strList[1])
				uids.push(uid)
				areaIds.push(areaId)
				scores.push(list[i+1])
			}
			var info = {
				uids : uids,
				areaIds : areaIds,
				scores : scores
			}
			local.getPlayerBaseByUids(uids,function(userInfos) {
				info.userInfos = userInfos
				res.send(info)
			})
		})
	}
	//获取无双争霸赛数据
	posts["/beherrscherInfo"] = function(req,res) {
		var info = {}
		self.redisDao.db.lrange("area:list",0,-1,function(err,list) {
			if(list){
				info.areaList = list
				var multiList = []
				for(var i = 0;i < list.length;i++){
					multiList.push(["hgetall","area:area"+list[i]+":beherrscher"])
				}
				self.redisDao.multi(multiList,function(err,list) {
					info.beherrscherList = list
					var uids = []
					for(var i = 0;i < list.length;i++){
						if(list[i]){
							uids.push(list[i]["seat_1"])
							uids.push(list[i]["seat_2"])
							uids.push(list[i]["seat_3"])
						}
					}
					local.getPlayerBaseByUids(uids,function(userInfos) {
						info.userInfos = userInfos
						res.send(info)
					})
				})
			}else{
				res.send(info)
			}
		})
	}
	//获取阵营战1数据
	posts["/muye_rank0"] = function(req,res) {
		self.redisDao.db.zrevrange(["cross:muye:rank:camp0",0,-1,"WITHSCORES"],function(err,list) {
			var uids = []
			var areaIds = []
			var scores = []
			for(var i = 0;i < list.length;i+=2){
				var strList = list[i].split("|")
				var areaId = Number(strList[0])
				var uid = Number(strList[1])
				uids.push(uid)
				areaIds.push(areaId)
				scores.push(list[i+1])
			}
			var info = {
				uids : uids,
				areaIds : areaIds,
				scores : scores
			}
			local.getPlayerBaseByUids(uids,function(userInfos) {
				info.userInfos = userInfos
				res.send(info)
			})
		})
	}
	//获取阵营战2数据
	posts["/muye_rank1"] = function(req,res) {
		self.redisDao.db.zrevrange(["cross:muye:rank:camp1",0,-1,"WITHSCORES"],function(err,list) {
			var uids = []
			var areaIds = []
			var scores = []
			for(var i = 0;i < list.length;i+=2){
				var strList = list[i].split("|")
				var areaId = Number(strList[0])
				var uid = Number(strList[1])
				uids.push(uid)
				areaIds.push(areaId)
				scores.push(list[i+1])
			}
			var info = {
				uids : uids,
				areaIds : areaIds,
				scores : scores
			}
			local.getPlayerBaseByUids(uids,function(userInfos) {
				info.userInfos = userInfos
				res.send(info)
			})
		})
	}
	//获取攻城战数据
	posts["/guild_city"] = function(req,res) {
		var info = {}
		self.redisDao.db.lrange("area:list",0,-1,function(err,list) {
			if(list){
				info.areaList = list
				var multiList = []
				for(var i = 0;i < list.length;i++){
					for(var j = 1;j <= 9;j++)
						multiList.push(["get","area:area"+list[i]+":guild_city:baseInfo:"+j])
				}

				self.redisDao.multi(multiList,function(err,list) {
					info.guild_citys = list
					res.send(info)
				})
			}
		})
	}
	//获取宗族pk数据
	posts["/guild_pk"] = function(req,res) {
		var info = {}
		self.redisDao.db.hgetall("guild_pk:historyTable",function(err,list) {
			var multiList = []
			for(var i in list){
				multiList.push(["get","guild_pk:baseInfo:"+i])
			}
			self.redisDao.multi(multiList,function(err,data) {
				res.send(data)
			})
		})
	}
	//获取玩家数据
	posts["/getPlayerInfo"] = function(req,res) {
		var data = req.body
		var uid = data.uid
		if(!uid){
			res.send(false)
		}else{
			local.getPlayerBaseByUids([uid],function(userInfos) {
				if(userInfos && userInfos[0])
					res.send(userInfos[0])
				else
					res.send(false)
			})
		}
	}
	//发送邮件
	posts["/send_mail"] = function(req,res) {
		var data = req.body
		var uid = data.uid
		var title = data.title
		var text = data.text
		var atts = data.atts
		if(!uid){
			res.send(false)
		}else{
			local.sendMail(uid,title,text,atts,function(err,data) {
				res.send(err)
			})
		}
	}
	//获取公告
	posts["/getNotify"] = function(req,res) {
		var data = req.body
		self.redisDao.db.get("game:notify",function(err,data) {
			res.send({flag:true,data:data})
		})
	}
	//设置公告
	posts["/setNotify"] = function(req,res) {
		var data = req.body
		self.redisDao.db.set("game:notify",data.notify,function(err) {
			self.server.changeNotify(data.notify)
			res.send({flag:true})
		})
	}
	//获取CDKEY类型列表
	posts["/getCDType"] = function(req,res) {
		var data = req.body
		var pageSize = data.pageSize
		var pageCurrent = data.pageCurrent
		var arr = []
		var info = local.getSQL("CDType",arr,pageSize,pageCurrent,"c_time")
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
					res.send({flag:false,data:err})
					return
				}
				info.list = JSON.parse(JSON.stringify(list))
				res.send({flag:true,data:info})
			})
		})
	}
	//创建礼包码类型
	posts["/createCDType"] = function(req,res) {
		var data = req.body
		var type = data.type
		var award = data.award
		var des = data.des
		var once = data.once
		var sql = "select * from CDType where type = ?"
		var args = [type];
		self.mysqlDao.db.query(sql,args, function(err,data) {
			if (err) {
				res.send({flag:false,data:err})
				return
			}
			if(data && data.length){
				sql = 'update CDType SET award=?,once=?,des=? where type=?'
				args = [award,once,des,type];
				self.mysqlDao.db.query(sql,args, function(err) {
					if (err) {
						// console.error('pauseCDType! ' + err.stack);
						res.send({flag:false,data:err})
					}else{
						res.send({flag:true})
					}
				})
			}else{
				sql = 'insert into CDType SET ?'
				var info = {
					type : type,
					award : award,
					valid : 1,
					c_time : Date.now(),
					once : once || 0,
					des : des
				}
				self.mysqlDao.db.query(sql,info, function(err) {
					if (err) {
						// console.error('createCDType! ' + err.stack);
						res.send({flag:false,data:err})
					}else{
						res.send({flag:true})
					}
				})
			}
		})
	}
	//禁用礼包码类型
	posts["/pauseCDType"] = function(req,res) {
		var data = req.body
		var type = data.type
		var sql = 'update CDType SET valid=0 where type=?'
		var args = [type];
		self.mysqlDao.db.query(sql,args, function(err) {
			if (err) {
				// console.error('pauseCDType! ' + err.stack);
				res.send({flag:false,data:err})
			}else{
				res.send({flag:true})
			}
		})
	}
	//恢复礼包码类型
	posts["/resumeCDType"] = function(req,res) {
		var data = req.body
		var type = data.type
		var sql = 'update CDType SET valid=1 where type=?'
		var args = [type];
		self.mysqlDao.db.query(sql,args, function(err) {
			if (err) {
				// console.error('pauseCDType! ' + err.stack);
				res.send({flag:false,data:err})
			}else{
				res.send({flag:true})
			}
		})
	}
	//生成礼包码
	posts["/createCDKey"] = function(req,res) {
		var data = req.body
		var key = data.key
		var type = data.type
		var num = data.num
		var expires = data.expires
		console.time("createCDKey")
		var curTime = Date.now()
		var list = []
		var cdkeyList = []
		if(key && typeof(key) === "string"){
			list.push([key,type,curTime,expires,9999999])
			cdkeyList.push(key)
		}else{
			for(let i = 0;i < num;i++){
				var cdkey = stringRandom(18)
				list.push([cdkey,type,curTime,expires,1])
				cdkeyList.push(cdkey)
			}
		}
		var sql = "INSERT INTO CDKey(cdkey,type,c_time,expires,maxCount) VALUES ?"
		self.mysqlDao.db.query(sql,[list], function(err) {
			if (err) {
				// console.error('createCDKey! ' + err.stack);
				res.send({flag:false,data:err})
			}else{
				sql = 'update CDType SET total=total+? where type = ?'
				self.mysqlDao.db.query(sql,[num,type],function(){})
				res.send({flag:true,cdkeyList:cdkeyList})
				console.timeEnd("createCDKey")
			}
		})
	}
	//获取礼包码数据
	posts["/getCDKeyInfo"] = function(req,res) {
		var data = req.body
		var key = data.key
		var sql = "select * from CDKey where cdkey = ?"
		var args = [key];
		self.mysqlDao.db.query(sql,args, function(err,info) {
			if(err){
				res.send({flag:false,data:err})
			}else{
				if(info.length){
					res.send({flag:true,data:JSON.parse(JSON.stringify(info[0]))})
				}else{
					res.send({flag:false,data:"礼包码不存在"})
				}
			}
		})
	}
	//清理无效账号
	posts["/cleanPlayer"] = function(req,res) {
		dataClean.checkPlayer()
		res.send({flag:true})
	}
	//清理数据库记录
	posts["/cleanSql"] = function(req,res) {
		dataClean.cleanMysqlLog()
		res.send({flag:true})
	}
	local.getPlayerBaseByUids = function(uids,cb) {
		if(!uids.length){
			cb([])
			return
		}
		var multiList = []
		for(var i = 0;i < uids.length;i++){
			multiList.push(["hmget","player:user:"+uids[i]+":playerInfo",["name","head","level","vip","offline","CE","figure","title","frame"]])
		}
		self.redisDao.multi(multiList,function(err,list) {
			var userInfos = []
			for(var i = 0;i < uids.length;i++){
				let info = {}
				if(uids[i] < 10000){
					info = null
				}else{
					info = {
						uid : uids[i],
						name : list[i][0],
						head : list[i][1],
						level : list[i][2],
						vip : list[i][3],
						offline : list[i][4],
						ce : list[i][5],
						figure : list[i][6],
						title : list[i][7],
						frame : list[i][8],
					}
				}
				userInfos.push(info)
			}
			cb(userInfos)
		})
	}
	local.getSQL = function(tableName,arr,pageSize,pageCurrent,key,desc) {
		var sql1 = "select count(*) from "+tableName
		var sql2 = "select * from "+tableName	
		var args1 = []
		var args2 = []
		if(!desc)
			desc = "desc"
		for(var i = 0;i < arr.length;i++){
			var sign = "="
			switch(arr[i]["type"]){
				case "more":
					sign = ">"
				break
				case "less":
					sign = "<"
				break
				default:
					sign = "="
			}
			if(i == 0){
				sql1 += " where "+arr[i]["key"]+" "+sign+" ?"
				sql2 += " where "+arr[i]["key"]+" "+sign+" ?"
			}else{
				sql1 += " and "+arr[i]["key"]+" "+sign+" ?"
				sql2 += " and "+arr[i]["key"]+" "+sign+" ?"
			}
			args1.push(arr[i]["value"])
			args2.push(arr[i]["value"])
		}
		sql2 += " order by "+key
		if(desc)
			sql2 += " "+desc
		if(pageSize && pageCurrent){
			sql2 += " LIMIT ?,"+pageSize
			args2.push((pageCurrent-1)*pageSize)
		}
		return {sql1:sql1,sql2:sql2,args1:args1,args2:args2}
	}
	//发送邮件
	local.sendMail = function(uid,title,text,atts,cb) {
		var mailInfo = {
			title : title,
			text : text,
			id : uuid.v1(),
			time : Date.now()
		}
		if(atts){
			var strList = atts.split("&")
			for(var i = 0;i < strList.length;i++){
				var m_list = strList[i].split(":")
				var itemId = Number(m_list[0])
				var value = Math.floor(m_list[1])
				if(itemId == 202 || !item_cfg[itemId] || value != m_list[1] || value < 1){
					cb("奖励错误 "+itemId+ "   "+value)
					return
				}
			}
			mailInfo.atts = atts
		}
		local.adminSendMail(uid,mailInfo)
		mailInfo = JSON.stringify(mailInfo)
		self.redisDao.db.rpush("player:user:"+uid+":mail",mailInfo,function(err,data) {
			cb(err)
		})
	}
	//邮件日志
	local.adminSendMail = function(uid,info) {
		var sql1 = 'insert into mail_log SET ?'
		var info1 = {
			admin : "0001",
			uid : uid,
			areaId : info.areaId,
			title : info.title,
			text : info.text,
			atts : info.atts,
			time : Date.now()
		}
		self.mysqlDao.db.query(sql1,info1, function(err, res) {
			if (err) {
				console.error('adminSendMail! ' + err.stack);
			}
		})
	}
	//发送护符
	local.sendHufu = function(uid,lv,s1,s2,cb) {
		var id = uuid.v1()
		var info = {}
		if(!hufu_quality[lv]){
			cb(false,"护符等级错误")
			return
		}
		if((!s1 && !s2) || (s1 == s2)){
			cb(false,"护符技能错误")
			return
		}
		info.lv = lv
		if(s1)
			info.s1 = s1
		if(s2)
			info.s2 = s2
		self.redisDao.db.hget("player:user:"+uid+":playerInfo","name",function(err,data) {
			if(err || !data){
				cb(false,"用户不存在")
				return
			}else{
				self.redisDao.db.hset("player:user:"+uid+":hufu",id,JSON.stringify(info))
				self.redisDao.db.rpush("game:sendHufu",JSON.stringify({uid:uid,info:info,time:Date.now(),name:data}))
				cb(true)
			}
		})
	}
	//发送英雄
	local.sendHero = function(uid,otps,cb) {
		var hId = uuid.v1()
		var id = otps.id
		var ad = Number(otps.ad) || 0
		var lv = Number(otps.lv) || 1
		var star = Number(otps.star) || 5
		if(!heros[id]){
			cb(false,"英雄ID错误 "+id)
			return
		}
		if(!lv_cfg[lv]){
			cb(false,"英雄等级错误 "+lv)
			return
		}
		if(!star_base[star]){
			cb(false,"英雄星级错误 "+star)
			return
		}
		var heroInfo = {id : id,ad : ad,lv : lv,star : star}
		self.redisDao.db.hget("player:user:"+uid+":playerInfo","name",function(err,data) {
			if(err || !data){
				cb(false,"用户不存在")
				return
			}else{
				self.redisDao.db.hset("player:user:"+uid+":heroMap",hId,Date.now())
				self.redisDao.db.hmset("player:user:"+uid+":heros:"+hId,heroInfo)
				heroInfo.hId = hId
				self.redisDao.db.rpush("game:sendHero",JSON.stringify({uid:uid,info:heroInfo,time:Date.now(),name:data}))
				self.redisDao.db.hget("player:user:"+uid+":heroArchive",id,function(err,data) {
					data = Number(data) || 0
					if(star > data){
						self.redisDao.db.hset("player:user:"+uid+":heroArchive",id,star)
					}
				})
				cb(true)
			}
		})
	}
	//post请求
	local.post = function(hostname,port,path,args,callback) {
		var postData=querystring.stringify(args)
		var options={
		  hostname:hostname,
		  port:port,
		  path:path,
		  method:'POST',
		  headers:{
		    "Content-Type":"application/x-www-form-urlencoded; charset=utf-8",
		    "Content-Length" : postData.length
		  }
		}
		var req=http.request(options,function(res){
		var _data='';
		res.on('data', function(chunk){
		   _data += chunk;
		});
		res.on('end', function(){
			callback(_data)
		 });
		})
		req.on('error', function(e) {
		  console.error(e)
		})
		req.write(postData);
		req.end()
	}
}
module.exports = new model()