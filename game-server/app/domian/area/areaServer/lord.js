//主公相关
var lord_lv = require("../../../../config/gameCfg/lord_lv.json")
var main_name = "playerInfo"
var numberAtt = ["accId","createTime","rmb","vip","vip_exp","rmb_day","exp","level","heroAmount","heroLv","maxSS","real_rmb","real_day","real_week","r_luck"]
module.exports = function() {
	var self = this
	//加载主公数据
	this.lordLoad = function(uid,cb) {
		self.playerDao.getPlayerInfo({uid : uid},function(info) {
			if(!info){
				cb("未注册")
			}else if(info.freeze && info.freeze != 0){
				cb("角色已被冻结")
			}else{
				
				for(var i = 0;i < numberAtt.length;i++)
					info[numberAtt[i]] = Number(info[numberAtt[i]]) || 0
				if(!self.players[uid])
					self.onlineNum++
				self.players[uid] = info
				self.checkVipLv(uid)
				cb()
			}
		})
	}
	//移除主公数据
	this.lordUnload = function(uid) {
		delete self.players[uid]
	}
	//改变数据
	this.chageLordData = function(uid,key,value) {
		if(self.players[uid]){
			self.players[uid][key] = value
		}
		self.redisDao.db.hset("player:user:"+uid+":playerInfo",key,value)
	}
	//增加数据
	this.incrbyLordData = function(uid,key,value,cb) {
		if(self.players[uid]){
			self.players[uid][key] += value
		}
		self.redisDao.db.hincrby("player:user:"+uid+":playerInfo",key,value,function(err,data) {
			if(!err && cb)
				cb(data)
		})
	}
	//删除数据
	this.delLordData = function(uid,key) {
		if(self.players[uid]){
			delete self.players[uid][key]
		}
		self.redisDao.db.hdel("player:user:"+uid+":playerInfo",key)
	}
	//改变头像
	this.changeHead = function(uid,id,cb) {
		self.redisDao.db.hget("player:user:"+uid+":heroArchive",id,function(err,data) {
			if(err || !data){
				cb(false,"未获得该英雄")
			}else{
				self.redisDao.db.hset("player:user:"+uid+":playerInfo","head",id,function(flag,data) {
					cb(true)
				})
			}
		})
	}
	//主公获得经验值
	this.addLordExp = function(uid,exp) {
		self.redisDao.db.hincrby("player:user:"+uid+":playerInfo","exp",exp,function(err,value) {
			if(err)
				console.error(err)
			self.updateSprintRank("lv_rank",uid,exp)
			if(self.players[uid]){
				var notify = {
					"type" : "addLordExp",
					"exp" : exp,
					"curExp" : Number(value)
				}
				self.players[uid]["exp"] = notify.curExp
				self.sendToUser(uid,notify)
				self.checkLordUpgrade(uid,Number(value))
			}
		})
	}
	//获取主公等级
	this.getLordLv = function(uid) {
		if(self.players[uid])
			return self.players[uid]["level"]
		else return 1
	}
	//获取最大英雄等级
	this.getLordAtt = function(uid,key) {
		if(self.players[uid])
			return self.players[uid][key]
		else return 0
	}
	//主公升级检查
	this.checkLordUpgrade = function(uid,exp) {
		level = self.players[uid]["level"]
		let upLv = 0
		let needExp = 0
		let count = 0
		let gold = 0
		while(lord_lv[level + upLv + 1] && exp >= lord_lv[level + upLv]["exp"] && count < 200){
			count++
			exp -= lord_lv[level + upLv]["exp"]
			needExp += lord_lv[level + upLv]["exp"]
			gold += lord_lv[level + upLv]["gold"]
			upLv += 1
		}
		if(upLv){
			self.redisDao.db.hincrby("player:user:"+uid+":playerInfo","level",upLv)
			self.redisDao.db.hincrby("player:user:"+uid+":playerInfo","exp",-needExp)
			self.addItem({uid : uid,itemId : 202,value : gold,reason : "等级提升奖励"})
			let notify = {
				"type" : "lordUpgrade",
				"oldLv" : level,
				"upgrade" : upLv,
				"gold" : gold,
				"curExp" : exp
			}
			self.players[uid]["exp"] = exp
			self.players[uid]["level"] += upLv
			self.sendToUser(uid,notify)
			self.taskUpdate(uid,"loadLv",upLv)
			self.checkLimitGiftLv(uid,level,level+upLv)
			self.cacheDao.saveCache({"messagetype":"lordUpgrade",uid:uid,level:level+upLv})
		}
	}
}