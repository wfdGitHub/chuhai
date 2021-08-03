//数据库查询
var http = require("http")
var uuid = require("uuid")
var item_cfg = require("../game-server/config/gameCfg/item.json")
var model = function() {
	var self = this
	var posts = {}
	var local = {}
	this.init = function (server,mysqlDao,redisDao) {
		self.mysqlDao = mysqlDao
		self.redisDao = redisDao
		for(var key in posts){
			server.post(key,posts[key])
		}
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
		console.log("freezeAcc",data)
		var url = "http://127.0.0.1:5081/freezeAcc?uid="+data.uid+"&value="+data.value
		http.get(url,function(res){})
		res.send("SUCCESS")
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
			self.redisDao.db.lrange("client:banSendMsg",(pageCurrent-1)*pageSize,(pageCurrent)*pageSize,function(err,data) {
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
		if(data.beginTime)
			arr.push({key : "pay_time",value : data.beginTime,type:"more"})
		if(data.endTime)
			arr.push({key : "pay_time",value : data.endTime,type:"less"})
		var info = local.getSQL("game_order",arr,pageSize,pageCurrent,"id")
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
		console.log("getPlayerInfo",uid)
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
	//批量获取玩家基本数据
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
	local.getSQL = function(tableName,arr,pageSize,pageCurrent,key) {
		var sql1 = "select count(*) from "+tableName
		var sql2 = "select * from "+tableName	
		var args1 = []
		var args2 = []
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
		if(pageSize && pageCurrent){
			sql2 += " desc LIMIT ?,"+pageSize
			args2.push((pageCurrent-1)*pageSize)
		}
		// console.log("getSQL sql1",sql1,"sql2",sql2,args1,args2)
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
				if(itemId == 202 || !item_cfg[itemId] || value != m_list[1]){
					cb("奖励错误 "+itemId+ "   "+value)
					return
				}
			}
			mailInfo.atts = atts
		}
		local.adminSendMail(mailInfo)
		mailInfo = JSON.stringify(mailInfo)
		self.redisDao.db.rpush("player:user:"+uid+":mail",mailInfo,function(err,data) {
			console.log(err,data)
			cb(err)
		})
	}
	//邮件日志
	local.adminSendMail = function(info) {
		var sql1 = 'insert into mail_log SET ?'
		var info1 = {
			admin : "0001",
			uid : info.uid,
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
}
module.exports = new model()