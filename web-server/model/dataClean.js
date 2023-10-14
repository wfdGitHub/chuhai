//数据清理
const cleanDatas = ["ST","ace_lotto","activity","areaMail","area_challenge","arena","arenaRecord","arg_gift","bag","banner","bazaar","cdkey","ctask","dailyfb","drum","endless","exercise_pass","festival","frame_list","friend_list","gather","guild","heroArchive","horse","hufu","liveness","manorRecord","month_shop","task","title_list","tour","ttt","war_horn","week_shop","week_target","zhanfa","zhulu","zhuluTeam","mysterious","pit","limit_gift","mail","privilege","recharge_fast"]
const CLEAN_TIME = 172800000
const SQL_TIME = 1209600000
var model = function(){}
//初始化
model.prototype.init = function (server,mysqlDao,redisDao) {
	this.mysqlDao = mysqlDao
	this.redisDao = redisDao
	this.server = server
}
//检查全部账号
model.prototype.checkPlayer = function() {
	var self = this
	self.redisDao.db.get("user:lastid",function(err,num) {
		var max = Number(num)
		self.checkNext(101201,max,0)
	})
}
model.prototype.checkNext = function(uid,max,total) {
	var self = this
	if(uid >= max){
		console.log("检查结束，总计清理"+total+"个账号")
		return
	}
	self.redisDao.db.hmget("player:user:"+uid+":playerInfo",["real_rmb","offline","clean","level"],function(err,list) {
		var real_rmb = Number(list[0]) || 0
		var offline = Number(list[1]) || 0
		var lv = Number(list[3]) || 0
		if(!list[2] && (real_rmb <= 1000) && lv < 40 && (offline < Date.now() - CLEAN_TIME)){
			self.cleanPlayer(uid)
			total++
		}
		uid++
		self.checkNext(uid,max,total)
	})
}
//清理个人数据
model.prototype.cleanPlayer = function(uid) {
	var self = this
	//清除基础数据
	for(var i = 0;i < cleanDatas.length;i++)
		self.redisDao.db.del("player:user:"+uid+":"+cleanDatas[i])
	//清除多余英雄
	self.redisDao.db.get("player:user:"+uid+":fightTeam",function(err,team) {
		team = team ? JSON.parse(team) : []
		var map = {}
		for(var i = 0;i < team.length;i++){
			if(team[i])
				map[team[i]] = true
		}
		self.redisDao.db.hgetall("player:user:"+uid+":heroMap",function(err,heroMap) {
			if(!heroMap)
				heroMap = {}
			for(var i in heroMap){
				if(!map[i]){
					self.redisDao.db.hdel("player:user:"+uid+":heroMap",i)
					self.redisDao.db.del("player:user:"+uid+":heros:"+i)
				}
			}
		})
	})
	//解除绑定关系
	self.redisDao.db.hgetall("player:user:"+uid+":playerInfo",function(err,userInfo) {
		if(userInfo && userInfo.accId){
			self.redisDao.db.hdel("acc:user:"+userInfo.accId+":areaMap",userInfo.areaId)
			self.redisDao.db.hdel("acc:user:"+userInfo.accId+":playerMap",uid)
			self.redisDao.db.hset("player:user:"+uid+":playerInfo","clean",true)
		}
	})
}
//清理数据库日志
model.prototype.cleanMysqlLog = function(uid) {
	this.cleanMysqlItemLog()
	this.cleanMysqlLoginLog()
}
model.prototype.cleanMysqlItemLog = function(uid) {
	var self = this
	var time = Date.now() - SQL_TIME
	var sql = "DELETE FROM item_log WHERE time < ?"
	var args = [time]
	self.mysqlDao.db.query(sql,args,function(err,data) {
		console.log("cleanMysqlItemLog",err,data)
	})
}
model.prototype.cleanMysqlLoginLog = function(uid) {
	var self = this
	var time = Date.now() - SQL_TIME
	var sql = "DELETE FROM login_log WHERE loginTime < ?"
	var args = [time]
	self.mysqlDao.db.query(sql,args,function(err,data) {
		console.log("cleanMysqlLoginLog",err,data)
	})
}
module.exports = new model()