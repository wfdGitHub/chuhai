var bearcat = require("bearcat")
var playerDao = function() {}
var beginHero = 204010
//创建角色
playerDao.prototype.createPlayer = function(otps,cb) {
	var playerInfo = {
		accId : otps.accId,
		areaId : otps.areaId,
		name : otps.name,
		head : beginHero,
		createTime : Date.now(),
		rmb : 0,
		vip : 0,
		rmb_day : 0,
		exp : 0,
		level : 1,
		heroAmount : 100,
		heroLv : 1,
		dayStr : 0
	}
	var self = this
	self.redisDao.db.incrby("user:lastid",1,function(err,uid) {
		uid = parseInt(uid)
		playerInfo.uid = uid
		self.redisDao.db.hset("acc:user:"+playerInfo.accId+":playerMap",uid,otps.areaId)
		self.redisDao.db.hset("acc:user:"+playerInfo.accId+":areaMap",otps.areaId,uid)
		self.redisDao.db.hmset("player:user:"+uid+":playerInfo",playerInfo,function(err,data) {
			if(!err){
				self.redisDao.db.hset("area:area"+otps.areaId+":nameMap",otps.name,uid)
				self.heroDao.gainHero(otps.areaId,uid,{id : beginHero},function(flag,heroInfo) {
					self.heroDao.setFightTeam(otps.areaId,uid,[null,heroInfo.hId,null,null,null,null])
				})
				cb(playerInfo)
			}else{
				cb(false)
			}
		})
	})
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
			cb(true,uid)
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
	multiList.push(["hexists","area:area"+otps.areaId+":nameMap",otps.name])
	this.redisDao.multi(multiList,function(err,list) {
		if(list[0] !== 0){
			cb(false,"已注册账号")
		}else if(list[1] !== 0){
			cb(false,"名字已存在")
		}else{
			cb(true)
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
	}]
}