var bearcat = require("bearcat")
const VIP = require("../../config/gameCfg/VIP.json")
const default_cfg = require("../../config/gameCfg/default_cfg.json")
var playerDao = function() {}
var beginHero = default_cfg["begin_hero"]["value"]
var vipLv = 1
var robotTeam = [[105030,105040,105050,105060,105070,105080],[105090,105070,105060,105040,105050,105030],[105030,105050,105070,105090,105100,105010],[205020,205030,205040,205050,205060,205070],[205040,205050,205060,205070,205080,205090],[205030,205040,205050,205060,205070,205080],[305030,305040,305050,305060,305070,305080],[305020,305030,305050,305060,305090,305080],[305090,305070,305060,305040,305050,305030],[405020,405040,405060,405080,405010,405050],[405030,405040,405050,405060,405070,405080],[405090,405070,405060,405040,405050,405030],[505030,505040,505050,505060,505070,505080],[505020,505040,505060,505080,505010,505050],[505090,505070,505060,505040,505050,505030]]
//创建角色
playerDao.prototype.createPlayer = function(otps,cb) {
	var playerInfo = {
		accId : otps.accId,
		areaId : otps.areaId,
		name : otps.name,
		sex : 1,
		head : beginHero,
		figure : beginHero,
		title : 0,
		frame : 0,
		createTime : Date.now(),
		real_rmb : 0,
		real_day : 0,
		real_week : 0,
		rmb : 0,
		rmb_day : 0,
		week_rmb : 0,
		vip : vipLv,
		vip_exp: VIP[vipLv]["rmb"],
		exp : 0,
		level : 1,
		heroAmount : 100 + VIP[vipLv]["heroAmount"],
		heroLv : 1,
		maxSS : 0,
		dayStr : 0,
		weekStr : 0,
		monthStr : 0,
		officer : 0,
		r_luck : -1,
		freeze : 0,
		last_id : 100,
		gather : 0,
		gmLv : 0
	}
	if(otps.robot)
		playerInfo.level = 56
	var self = this
	self.redisDao.db.hincrby("area:area"+otps.areaId+":areaInfo","playerAmount",1)
	self.redisDao.db.incrby("user:lastid",1,function(err,uid) {
		uid = parseInt(uid)
		playerInfo.uid = uid
		playerInfo.CE = 1000
		self.redisDao.db.hset("acc:user:"+playerInfo.accId+":playerMap",uid,otps.areaId)
		self.redisDao.db.hset("acc:user:"+playerInfo.accId+":areaMap",otps.areaId,uid)
		self.redisDao.db.sadd("area:area"+otps.areaId+":userSet",uid)
		self.redisDao.db.hmset("player:user:"+uid+":playerInfo",playerInfo,function(err,data) {
			if(!err){
				self.redisDao.db.hset("game:nameMap",otps.name,uid)
				if(!otps.robot){
                    self.heroDao.gainHero(otps.areaId,uid,{id : beginHero},function(flag,heroInfo) {
                        self.heroDao.setFightTeam(otps.areaId,uid,[0,heroInfo.hId,0,0,0,0])
                    })
					self.mysqlDao.addDaylyData("userNum",1)
					self.mysqlDao.addRetentionData("userNum",1)
					self.mysqlDao.addLTVData("userNum",1)
					self.redisDao.db.hincrby("game:info","playerNum",1)
				}
				self.cacheDao.saveCache(Object.assign({"messagetype":"create"},playerInfo))
				cb(playerInfo)
			}else{
				cb(false)
			}
		})
	})
}
//设置机器人阵容
playerDao.prototype.setRobotTeam = function(areaId,playerInfo) {
	var team = robotTeam[Math.floor(Math.random() * robotTeam.length)]
	var arr = []
	for(var i = 0;i < team.length;i++){
		arr[i] = this.heroDao.gainHero(areaId,playerInfo.uid,{id : team[i],star:6,lv:145,ad:5,robot:true}).hId
	}
	this.heroDao.setFightTeam(areaId,playerInfo.uid,arr)
}
//获取角色列表
playerDao.prototype.getPlayerList = function(otps,cb) {
	var accId = otps.accId
	this.redisDao.db.hgetall("acc:user:"+accId+":areaMap",function(err,list) {
		cb(true,list || {})
	})
}
//获取所在服务器角色UID
playerDao.prototype.getUidByAreaId = function(otps,cb) {
	var accId = otps.accId
	var areaId = otps.areaId
	this.redisDao.db.hget("acc:user:"+accId+":areaMap",areaId,function(err,uid) {
		if(err || !uid){
			cb(false)
		}else{
			cb(true,Number(uid))
		}
	})
}
//获取角色信息
playerDao.prototype.getPlayerInfo = function(otps,cb) {
	var self = this
	self.redisDao.db.hgetall("player:user:"+otps.uid+":playerInfo",function(err,playerInfo) {
		if(err || !playerInfo){
			cb(false)
		}else{
			for(var i in playerInfo){
				var tmp = Number(playerInfo[i])
				if(tmp == playerInfo[i])
					playerInfo[i] = tmp
			}
			cb(playerInfo)
		}
	})
}
//获取角色所在服务器
playerDao.prototype.getPlayerAreaId = function(uid,cb) {
	var self = this
	self.redisDao.db.hget("player:user:"+uid+":playerInfo","areaId",function(err,areaId) {
		if(err || !areaId){
			cb(false,err)
		}else{
			cb(true,Number(areaId))
		}
	})
}
//设置角色数据
playerDao.prototype.setPlayerInfo = function(otps,cb) {
	var self = this
	self.redisDao.db.hset("player:user:"+otps.uid+":playerInfo",otps.key,otps.value,function(err) {
		if(!err){
			if(cb)
				cb(true)
		}else{
			if(cb)
				cb(false,err)
		}
	})
}
//检查账号是否可创建
playerDao.prototype.checkPlayerInfo = function(otps,cb) {
	var multiList = []
	multiList.push(["hexists","acc:user:"+otps.accId+":areaMap",otps.areaId])
	multiList.push(["hexists","game:nameMap",otps.name])
	this.redisDao.multi(multiList,function(err,list) {
		if(list[0] !== 0){
			cb(false,"已注册账号")
		}else if(list[1] !== 0){
			otps.name = otps.name + (Math.floor(Math.random() * 90000) + 10000)
			cb(true,otps.name)
		}else{
			cb(true,otps.name)
		}
	})
}
module.exports = {
	id : "playerDao",
	func : playerDao,
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "heroDao",
		ref : "heroDao"
	},{
		name : "cacheDao",
		ref : "cacheDao"
	},{
		name : "mysqlDao",
		ref : "mysqlDao"
	}]
}