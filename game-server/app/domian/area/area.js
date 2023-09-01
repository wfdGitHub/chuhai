//服务器sh_svip3_2
var bearcat = require("bearcat")
var fightContorlFun = require("../turn_based_fight/fight/fightContorl.js")
const async = require("async")
const standard_dl = require("../../../config/gameCfg/standard_dl.json")
const heros = require("../../../config/gameCfg/heros.json")
const standard_ce_cfg = require("../../../config/gameCfg/standard_ce.json")
const stone_lv = require("../../../config/gameCfg/stone_lv.json")
const default_cfg = require("../../../config/gameCfg/default_cfg.json")
const login_mail_title = default_cfg["login_mail_title"]["value"]
const login_mail_text = default_cfg["login_mail_text"]["value"]
const login_mail_atts = default_cfg["login_mail_atts"]["value"]
const areaServers = ["recharge","activity","weekTarget","tour","zhulu","bazzar","combatEffectiveness","arena","bag","dao","checkpoints","mail","ttttower","lord","daily_fb","task","seek_treasure","aceLotto","limit_gift","area_challenge","topicRecruit","mysterious","area_boss","sprint_rank","share","rebate","stone","festival","guild","guild_fb","guild_treasure","guild_city","guild_pk","limited_time","hufu","show","friend","beherrscher","exercise","endless","extremity","zhanfa"]
const oneDayTime = 86400000
var util = require("../../../util/util.js")
var standard_ce = {}
var standard_team_ce = {}
var timers = {}
for(var i in standard_ce_cfg){
	standard_ce[i] = {
		"lv" : standard_ce_cfg[i]["lv"],
		"ad" : standard_ce_cfg[i]["ad"],
		"star" : standard_ce_cfg[i]["star"],
		"artifact" : standard_ce_cfg[i]["artifact"]
	}
	standard_team_ce[i] = {}
	for(var j = 1;j <= 4;j++){
		standard_ce[i]["e"+j] = standard_ce_cfg[i]["equip"]
		standard_ce[i]["s"+j] = stone_lv[standard_ce_cfg[i]["stone_lv"]]["s"+j]
		standard_team_ce[i]["g"+j] = standard_ce_cfg[i]["guild"]
	}
	standard_team_ce[i]["officer"] = standard_ce_cfg[i]["officer"]
}
var area = function(otps,app) {
	this.areaId = otps.areaId
	this.areaName = otps.areaName
	this.newArea = otps.oldArea?false:true
	this.openTime = Number(otps.openTime)
	this.areaDay = util.getTimeDifference(this.openTime,Date.now())
	this.app = app
	this.channelService = this.app.get('channelService')
	this.players = {}
	this.connectorMap = {}
	this.oriIds = {}
	this.onlineNum = 0
	this.fightInfos = {}
	this.fightContorl = fightContorlFun
	this.dayStr = ""
	this.crossUids = {}
	this.timer = 0
	this.runTime = 0
	for(var i = 0;i < areaServers.length;i++){
		var fun = require("./areaServer/"+areaServers[i]+".js")
		fun.call(this)
	}
}
//服务器初始化
area.prototype.init = function() {
	console.log("area init",this.areaId)
	var self = this
	this.redisDao.db.hgetall("area:area"+this.areaId+":robots",function(err,robots) {
		self.robots = {}
		for(let i in robots){
			self.robots[i] = JSON.parse(robots[i])
		}
	})
	// this.worldBossCheck()
	this.initAreaMail()
	this.initSprintRank()
	this.initGuild()
	this.initLimitedTime()
	this.initBeherrscher()
	this.rebateInit()
	this.timer = setInterval(this.update.bind(this),1000)
}
//服务器关闭
area.prototype.destory = function() {
	console.log("area destory",this.areaId)
	clearInterval(this.timer)
	// this.worldBossDestory()
	for(var i in timers)
		clearTimeout(i)
	this.removeAllUser()
}
//update
area.prototype.update = function() {
	this.runTime += 1000
	var curDayStr = (new Date()).toDateString()
	if(this.dayStr !== curDayStr){
		this.dayUpdate(curDayStr)
	}
}
//每日定时器
area.prototype.dayUpdate = function(curDayStr) {
	// console.log("服务器每日刷新")
	var self = this
	this.dayStr = curDayStr
	this.weekDay = (new Date).getDay()
	this.weekStr = util.getWeek()
	this.monthStr = util.getMonth()
	this.areaDay = util.getTimeDifference(this.openTime,Date.now())
	console.log("areaDay",this.areaDay)
	this.rechargeDayUpdate()
	this.festivalDayUpdate()
	this.aceLottoDayUpdate()
	this.topicRecruitDayUpdate()
	this.areaBossDayUpdate()
	this.shareDayUpdate()
	this.guildDayUpdate()
	this.guildTreasureDayUpdate()
	this.guildCityDayUpdate()
	this.dayUpdateBeherrscher()
	this.exerciseDayUpdate()
	this.extremityInit()
	this.rebateInit()
	this.getAreaObj("areaInfo","dayStr",function(data) {
		if(data !== self.dayStr){
			self.setAreaObj("areaInfo","dayStr",self.dayStr)
			self.firstDayUpdate()
		}
	})
}
//每日首次定时器
area.prototype.firstDayUpdate = function() {
	console.log("服务器每日首次刷新")
	this.guildFirstUpdate()
	this.guildTreasureFirstUpdate()
	this.dayUpdateLimitedTime()
	this.extremityDayUpdate()
	this.delAreaObj("areaInfo","day_create")
	this.delAreaObj("areaInfo","day_login")
	this.delAreaObj("areaInfo","day_play_count")
	this.delAreaObj("areaInfo","day_play_amount")
	this.delAreaObjAll("friend_gift")
}
//玩家注册
area.prototype.register = function(otps,cb) {
	if(this.runTime < 10000){
		cb(false,"服务器正忙，请稍后重试")
		return
	}
	var self = this
	console.log("register1",otps)
	self.playerDao.checkPlayerInfo(otps,function(flag,data) {
		if(!flag){
			cb(flag,data)
		}else{
			otps.name = data
			self.playerDao.createPlayer(otps,function(playerInfo) {
				console.log("register2",playerInfo)
				if(!playerInfo){
					cb(false,playerInfo)
					return
				}
				self.taskInit(playerInfo.uid)
				self.setPlayerData(playerInfo.uid,"onhookLastTime",Date.now())
                if(login_mail_title)
                    self.sendMail(playerInfo.uid,login_mail_title,login_mail_text,login_mail_atts)
				//TODO test
				self.incrbyAreaObj("areaInfo","day_create",1)
				self.redisDao.db.hset("player:user:"+playerInfo.uid+":bag",1000500,1)
				self.redisDao.db.hset("player:user:"+playerInfo.uid+":bag",1000080,1)
				cb(true,playerInfo)
			})
		}
	})
}
//玩家加入
area.prototype.userLogin = function(uid,oriId,cid,cb) {
	if(this.runTime < 10000){
		cb(false,"服务器正忙，请稍后重试")
		return
	}
	var self = this
	async.waterfall([
		function(next) {
			self.lordLoad(uid,next)
		},
		function(next) {
			self.checkpointsLoad(uid,next)
		},
		function(next) {
			self.taskLoad(uid,next)
		},
		function(next) {
			self.CELoad(uid,function(flag) {
				if(flag){
					self.players[uid]["CE"] = self.getCE(uid)
					next()
				}else{
					cb(false,"获取战力出错")
				}
			})
		},
		function(next) {
			self.checkAreaMailAll(uid)
			self.zhuluLoad(uid,next)
		},
		function() {
			self.connectorMap[uid] = cid
			self.oriIds[uid] = oriId
			self.players[uid]["areaId"] = self.areaId
			self.players[uid]["areaDay"] = self.areaDay
			self.players[uid]["userDay"] = util.getTimeDifference(self.players[uid].createTime,Date.now())
			if(self.players[uid].dayStr != self.dayStr)
				self.dayFirstLogin(uid)
			if(self.players[uid].weekStr != self.weekStr)
				self.weekFirstLogin(uid)
			if(self.players[uid].monthStr != self.monthStr)
				self.monthFirstLogin(uid)
			cb(true,self.players[uid])
		}
	],function(err) {
		delete self.players[uid]
		cb(false,err)
	})
}
//玩家当天首次登录
area.prototype.dayFirstLogin = function(uid) {
	// console.log(uid+" 今日首次登陆")
	this.chageLordData(uid,"dayStr",this.dayStr)
	this.chageLordData(uid,"tour_pri_count",0)
	this.setPlayerData(uid,"quick",0)
	this.rebateDayUpdate(uid)
	this.TTTdayUpdate(uid)
	this.arenadayUpdate(uid)
	this.dailyfbUpdate(uid)
	this.dayTaskRefresh(uid)
	this.bazaarDayRefresh(uid)
	this.shopRefresh(uid)
	this.activityUpdate(uid)
	this.STDayRefresh(uid)
	this.mysteriousDayUpdate(uid)
	this.festivalUserDayUpdate(uid)
	this.guildRefresh(uid)
	this.TopicRecruitRefresh(uid)
	this.exerciseUserUpdate(uid)
	this.extremityUserUpdate(uid)
	this.userRechargeDayUpdate(uid)
	this.incrbyAreaObj("areaInfo","day_login",1)
	this.playerDao.setPlayerInfo({uid:uid,key:"pay_state",value:0})
	this.mysqlDao.addDaylyData("activeNum",1)
	this.mysqlDao.updateRetention(uid,this.players[uid]["createTime"])
	this.taskUpdate(uid,"login",1)
}
//玩家每周首次登陆
area.prototype.weekFirstLogin = function(uid) {
	// console.log(uid+" 本周首次登陆")
	this.chageLordData(uid,"weekStr",this.weekStr)
	this.chageLordData(uid,"week_rmb",0)
	this.chageLordData(uid,"real_week",0)
	this.activityWeekUpdate(uid)
	this.weekTaskRefresh(uid)
	this.userRechargeWeekUpdate(uid)
}
//玩家每月首次登陆
area.prototype.monthFirstLogin  = function(uid) {
	// console.log(uid+" 本月首次登陆")
	this.chageLordData(uid,"monthStr",this.monthStr)
	this.monthTaskRefresh(uid)
	this.userRechargeMonthUpdate(uid)
}
//玩家退出
area.prototype.userLeave = function(uid) {
	if(this.players[uid]){
		delete this.connectorMap[uid]
		delete this.oriIds[uid]
		this.onlineNum--
		this.redisDao.db.hincrby("onlineNums",this.areaId,-1)
		this.taskUnload(uid)
		this.CEUnload(uid)
		this.lordUnload(uid)
		this.checkpointsUnload(uid)
		this.zhuluUnload(uid)
		this.playerDao.setPlayerInfo({uid:uid,key:"offline",value:Date.now()})
	}
	if(this.crossUids[uid]){
		this.app.rpc.cross.crossRemote.userLeave(null,this.crossUids[uid],null)
	}
}
//发送消息给玩家
area.prototype.sendToUser = function(uid,notify) {
	this.channelService.pushMessageByUids('onMessage', notify, [{
      uid: uid,
      sid: this.connectorMap[uid]
    }])
}
//发送给服务器内全部玩家
area.prototype.sendAllUser = function(notify) {
	for(var uid in this.connectorMap){
		this.channelService.pushMessageByUids('onMessage', notify, [{
	      uid: uid,
	      sid: this.connectorMap[uid]
	    }])
	}
}
//移除服务器所有玩家
area.prototype.removeAllUser = function(){
	for(var uid in this.connectorMap){
		this.app.rpc.connector.connectorRemote.kickUser.toServer(this.connectorMap[uid],uid,null)
	}
}
//获取服务器信息
area.prototype.getAreaServerInfo = function(){
	var info = {
		areaId : this.areaId,
		name : this.areaName,
		onlineNum : this.onlineNum
	}
	return info
}
//获取服务器内玩家信息
area.prototype.getAreaPlayers = function(){
	return this.players
}
//预备战斗
area.prototype.readyFight = function(uid,cb) {
	let team = this.getUserTeam(uid)
	if(team){
		this.fightInfos[uid] = {team : team,seededNum : Date.now()}
		cb(true,this.fightInfos[uid])
	}else{
		cb(false,"无战斗数据")
	}
}
//获取玩家防御阵容配置(被攻击阵容)
area.prototype.getDefendTeam = function(uid,cb) {
	var self = this
	self.heroDao.getFightTeam(uid,function(flag,data) {
		if(flag){
			cb(data)
		}else{
			cb(false)
		}
	})
}
//获取玩家上阵配置(出战阵容)
area.prototype.getFightInfo = function(uid) {
	if(this.fightInfos[uid]){
		var fightInfo = this.fightInfos[uid]
		delete this.fightInfos[uid]
		return fightInfo
	}else{
		return false
	}
}
//战斗记录
area.prototype.recordFight = function(atkTeam,defTeam,seededNum,readList) {
	var obj = {
		atkTeam : JSON.stringify(atkTeam) || "null",
		defTeam : JSON.stringify(defTeam) || "null",
		seededNum : seededNum || "null",
		readList : JSON.stringify(readList) || "null"
	}
	 this.redisDao.db.hmset("test:fight",obj)
}
//连入跨服服务器
area.prototype.loginCross = function(uid,cb) {
	if(!this.players[uid]){
		cb(false,"没有该玩家数据")
		return
	}
	var self = this
    self.app.rpc.cross.crossRemote.userLogin(null,uid,self.areaId,self.oriIds[uid],self.app.serverId,self.connectorMap[uid],self.players[uid],function(flag,crossUid) {
    	if(flag){
    		self.crossUids[uid] = crossUid
    	}
		cb(flag,crossUid)
	})
}
area.prototype.getSimpleUser = function(uid) {
	if(uid < 10000 || !this.players[uid]){
		return false
	}
	var info = {
		uid : uid,
		name : this.players[uid]["name"],
		head : this.players[uid]["head"],
		level : this.players[uid]["level"]
	}
	return info
}
area.prototype.getBaseUser = function(uid) {
	if(uid < 10000 || !this.players[uid]){
		return false
	}
	var info = {
		uid : uid,
		name : this.players[uid]["name"],
		head : this.players[uid]["head"],
		level : this.players[uid]["level"],
		figure : this.players[uid]["figure"],
		title : this.players[uid]["title"],
		frame : this.players[uid]["frame"],
		ce : this.getCE(uid)
	}
	return info
}
//基准战力阵容
area.prototype.standardTeam = function(uid,list,dl,lv) {
	team = list.concat()
	if(!lv)
		lv = this.getLordLv(uid)
	let standardInfo = standard_ce[lv]
	let dlInfo = standard_dl[dl]
	let info = Object.assign({},standardInfo)
	if(dlInfo.lv){
		info.lv += dlInfo.lv
		delete dlInfo.lv
	}
	info = Object.assign(info,dlInfo)
	for(var i = 0;i < team.length;i++){
		if(team[i]){
			team[i] = Object.assign({id : team[i]},info)
			if(team[i].star < heros[team[i]["id"]]["min_star"])
				team[i].star = heros[team[i]["id"]]["min_star"]
		}
	}
	team[6] = Object.assign({},standard_team_ce[lv])
	return team
}
//获取玩家单项数据
area.prototype.getPlayerKeyByUid = function(uid,key,cb) {
	var self = this
	self.redisDao.db.hget("player:user:"+uid+":playerInfo",key,function(err,data) {
		if(!err && data)
			cb(data)
		else
			cb(false)
	})
}
//获取玩家基础数据
area.prototype.getPlayerBaseInfo = function(uid,cb) {
	var self = this
	self.redisDao.db.hmget("player:user:"+uid+":playerInfo",["name","head","gname","level","figure","title","frame","officer"],function(err,data) {
		cb(true,data)
	})
}
//批量获取玩家简易数据
area.prototype.getPlayerInfoByUids = function(uids,cb) {
	var self = this
	if(!uids.length){
		cb([])
		return
	}
	var multiList = []
	for(var i = 0;i < uids.length;i++){
		multiList.push(["hmget","player:user:"+uids[i]+":playerInfo",["name","head","gname","figure","title","frame","officer"]])
	}
	self.redisDao.multi(multiList,function(err,list) {
		var userInfos = []
		for(var i = 0;i < uids.length;i++){
			let info = {}
			if(uids[i] < 10000){
				info = self.robots[uids[i]]
			}else{
				info = {
					uid : uids[i],
					name : list[i][0],
					head : list[i][1],
					gname : list[i][2],
					figure : list[i][3],
					title : list[i][4],
					frame : list[i][5],
					officer : list[i][6]
				}
			}
			userInfos.push(info)
		}
		cb(userInfos)
	})
}
//批量获取玩家基本数据
area.prototype.getPlayerBaseByUids = function(uids,cb) {
	if(!uids.length){
		cb([])
		return
	}
	var self = this
	var multiList = []
	for(var i = 0;i < uids.length;i++){
		multiList.push(["hmget","player:user:"+uids[i]+":playerInfo",["name","head","level","vip","offline","CE","figure","title","frame","officer"]])
	}
	self.redisDao.multi(multiList,function(err,list) {
		var userInfos = []
		for(var i = 0;i < uids.length;i++){
			let info = {}
			if(uids[i] < 10000){
				info = self.robots[uids[i]]
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
					officer : list[i][9],
				}
			}
			userInfos.push(info)
		}
		cb(userInfos)
	})
}
//批量获取好友信息
area.prototype.getFriendByUids = function(uid,uids,cb) {
	if(!uids.length){
		cb([])
		return
	}
	var self = this
	var userInfos = []
	async.waterfall([
		function(next) {
			var multiList = []
			for(var i = 0;i < uids.length;i++){
				multiList.push(["hmget","player:user:"+uids[i]+":playerInfo",["name","head","level","vip","offline","CE","figure","title","frame","officer"]])
			}
			self.redisDao.multi(multiList,function(err,list) {
				for(var i = 0;i < uids.length;i++){
					let info = {}
					if(uids[i] < 10000){
						info = self.robots[uids[i]]
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
							officer : list[i][9],
						}
					}
					userInfos.push(info)
				}
				next()
			})
		},
		function(next) {
			//获取赠送记录
			var arr = []
			for(var i = 0;i < uids.length;i++)
				arr.push(uids[i]+"_"+uid)
			self.getAreaHMObj("friend_gift",arr,function(data) {
				for(var i = 0;i < data.length;i++){
					userInfos[i].send = data[i]
				}
				next()
			})
		},
		function(next) {
			//获取被赠送记录
			var arr = []
			for(var i = 0;i < uids.length;i++)
				arr.push(uid+"_"+uids[i])
			self.getAreaHMObj("friend_gift",arr,function(data) {
				for(var i = 0;i < data.length;i++){
					userInfos[i].gain = data[i]
				}
				cb(userInfos)
			})
		}
	],function(err) {
		console.error(err)
		cb([])
	})
}
//战斗校验错误
area.prototype.verifyFaild = function(uid,verify1,verify2) {
	console.log("verifyFaild",uid)
	this.redisDao.db.rpush("verify_faild",JSON.stringify({uid:uid,client:verify1,server:verify2}))
}
//定时器
area.prototype.setTimeout = function(fun,dt) {
	var timer = setTimeout(function() {
		delete timers[timer]
		fun()
	},dt)
	timers[timer] = 1
}
module.exports = {
	id : "area",
	func : area,
	scope : "prototype",
	init : "init",
	args : [{
		name : "otps",
		type : "Object"
	},{
		name : "app",
		type : "Object"
	}],
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "playerDao",
		ref : "playerDao"
	},{
		name : "heroDao",
		ref : "heroDao"
	},{
		name : "payDao",
		ref : "payDao"
	},{
		name : "cacheDao",
		ref : "cacheDao"
	},{
		name : "mysqlDao",
		ref : "mysqlDao"
	}]
}