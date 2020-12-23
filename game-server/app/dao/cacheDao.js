var daoConfig = require("../../config/daoConfig.json")
var redis = require("redis")
var RDS_PORT = daoConfig.cache.port
var RDS_HOST = daoConfig.cache.host
var RDS_PWD = daoConfig.cache.pwd
var RDS_OPTS = {auth_pass : RDS_PWD}
var publish = "jianwan"
var publish_normal = "message_"+publish+"_normal"
var publish_chat = "message_"+publish+"_chat"
var publish_item = "message_"+publish+"_item"
var cacheDao = function() {
}
var local = {}
cacheDao.prototype.init = function(cb) {
	console.log("cacheDao init")
	// this.db = redis.createClient(RDS_PORT,RDS_HOST,RDS_OPTS)
	// var self = this
	// self.db.on("ready",function(res) {
	// 	self.db.select("15",function(err) {
	// 	})
	// })
	cb()
}
cacheDao.prototype.saveCache = function(info) {
	console.log("saveCache",info)
	switch(info.messagetype){
		case "create":
			local.create(this,info)
		break
		case "login":
			local.login(this,info)
		break
		case "leave":
			local.leave(this,info)
		break
		case "checkpoints":
			local.checkpoints(this,info)
		break
		case "joinGuild":
			local.joinGuild(this,info)
		break
		case "leaveGuild":
			local.leaveGuild(this,info)
		break
		case "finishGameOrder":
			local.finishGameOrder(this,info)
		break
	}
	// return
	// info.time = Date.now()
	// this.db.rpush(publish_normal,JSON.stringify(info))
}
cacheDao.prototype.saveChat = function(info) {
	return
	info.time = Date.now()
	this.db.rpush(publish_chat,JSON.stringify(info))
}
cacheDao.prototype.saveItemChange = function(info) {
	return
	info.time = Date.now()
	this.db.rpush(publish_item,JSON.stringify(info))
}
local.create = function(self,info) {
	var sql = 'insert into user_list SET ?'
	var info = {
		uid : info.uid,
		userName : info.name,
		accId : info.accId,
		area : info.areaId,
		totalRmb : 0,
		lateRmb : 0,
		lv : info.level,
		vip : info.vip,
		ce : info.CE,
		cpLv : 0,
		playTime : 0,
		create : info.createTime
	}
	self.mysqlDao.db.query(sql,info, function(err, res) {
		if (err) {
			console.error('create! ' + err.stack);
		}
	})
}
local.login = function(self,info) {
	var curTime = Date.now()
	var sql = 'update user_list SET lv=?,vip=?,lateLogin=?,ce=? where uid=?'
	var args = [info.level,info.vip,curTime,info.CE,info.uid];
	self.mysqlDao.db.query(sql,args, function(err, res) {
		if (err) {
			console.error('login! ' + err.stack);
		}
	})
}
local.leave = function(self,info) {
	var sql = 'update user_list SET playTime=playTime+? where uid=?'
	var args = [info.time,info.uid];
	self.mysqlDao.db.query(sql,args, function(err, res) {
		if (err) {
			console.error('login! ' + err.stack);
		}
	})
	var sql2 = 'insert into login_log SET ?'
	var info2 = {
		uid : info.uid,
		accId : info.accId,
		userName : info.name,
		loginTime : info.beginTime,
		playTime : info.time
	}
	self.mysqlDao.db.query(sql2,info2, function(err, res) {
		if (err) {
			console.error('login! ' + err.stack);
		}
	})
}
local.checkpoints = function(self,info) {
	var sql = 'update user_list SET cpLv=? where uid=?'
	var args = [info.level,info.uid];
	self.mysqlDao.db.query(sql,args, function(err, res) {
		if (err) {
			console.error('login! ' + err.stack);
		}
	})
}
local.joinGuild = function(self,info) {
	var sql = 'update user_list SET gname=? where uid=?'
	var args = [info.gname,info.uid];
	self.mysqlDao.db.query(sql,args, function(err, res) {
		if (err) {
			console.error('login! ' + err.stack);
		}
	})
}
local.leaveGuild = function(self,info) {
	var sql = 'update user_list SET gname=? where uid=?'
	var args = ["",info.uid];
	self.mysqlDao.db.query(sql,args, function(err, res) {
		if (err) {
			console.error('login! ' + err.stack);
		}
	})
}
local.finishGameOrder = function(self,info) {
	info.amount = Number(info.amount) || 0
	var sql = 'update user_list SET totalRmb=totalRmb+? and lateRmb = ? where uid=?'
	var args = [info.amount,info.amount,info.uid];
	self.mysqlDao.db.query(sql,args, function(err, res) {
		if (err) {
			console.error('login! ' + err.stack);
		}
	})
	self.redisDao.db.hincrby("area:area"+info.areaId+":areaInfo","day_play_count",1)
	self.redisDao.db.hincrby("area:area"+info.areaId+":areaInfo","all_play_count",1)
	self.redisDao.db.hincrby("area:area"+info.areaId+":areaInfo","day_play_amount",info.amoun)
	self.redisDao.db.hincrby("area:area"+info.areaId+":areaInfo","all_play_amount",info.amoun)
}
module.exports = {
	id : "cacheDao",
	func : cacheDao,
	init : "init",
	async : true,
	order : 0,
	props : [{
		name : "mysqlDao",
		ref : "mysqlDao"
	}]
}