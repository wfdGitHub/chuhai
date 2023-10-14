//主公相关
var lord_lv = require("../../../../config/gameCfg/lord_lv.json")
var officer = require("../../../../config/gameCfg/officer.json")
var uuid = require("uuid")
var main_name = "playerInfo"
var numberAtt = ["accId","createTime","rmb","vip","vip_exp","rmb_day","exp","level","heroAmount","heroLv","maxSS","real_rmb","real_day","real_week","r_luck","ttt_lv","title","frame","officer","last_id","gather","camp_1","camp_2","camp_3","camp_4","camp_5","warehouse","gmLv","dp_limit"]
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
				if(!self.players[uid]){
					self.redisDao.db.hincrby("onlineNums",self.areaId,1)
					self.onlineNum++
				}
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
		if(self.players[uid])
			self.players[uid][key] = value
		self.redisDao.db.hset("player:user:"+uid+":playerInfo",key,value)
	}
	//获得last_id
	this.getLordLastid = function(uid) {
		if(self.players[uid]){
			self.players[uid]["last_id"] += 1
			self.redisDao.db.hincrby("player:user:"+uid+":playerInfo","last_id",1)
			return self.players[uid]["last_id"]
		}else{
			return uuid.v1()
		}
	}
	//增加数据
	this.incrbyLordData = function(uid,key,value,cb) {
		if(self.players[uid]){
			if(!self.players[uid][key])
				self.players[uid][key] = 0
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
	//获取升级所需经验
	this.getLordUpNeedEXP = function(uid) {
		if(self.players[uid]){
			return lord_lv[Math.min(200,lord_lv[self.players[uid]+1]["exp"])]
		}else{
			return 100000
		}
	}
	//主公获得经验值
	this.addLordExp = function(uid,exp) {
		if(self.players[uid]){
			self.players[uid]["exp"] += exp
		}
		self.redisDao.db.hincrby("player:user:"+uid+":playerInfo","exp",exp,function(err,value) {
			if(value < 0){
				value = 0
				self.players[uid]["exp"] = 0
				self.redisDao.db.hset("player:user:"+uid+":playerInfo","exp",0)
			}
			self.updateSprintRank("lv_rank",uid,exp)
			if(self.players[uid]){
				var notify = {
					"type" : "addLordExp",
					"exp" : exp,
					"curExp" : Number(value)
				}
				self.sendToUser(uid,notify)
				self.checkLordUpgrade(uid)
			}
		})
	}
	//获取主公等级
	this.getLordLv = function(uid) {
		if(self.players[uid])
			return self.players[uid]["level"]
		else return 1
	}
	//获取主公属性
	this.getLordAtt = function(uid,key) {
		if(self.players[uid])
			return self.players[uid][key]
		else return 0
	}
	//主公升级检查
	this.checkLordUpgrade = function(uid) {
		level = self.players[uid]["level"]
		exp = self.players[uid]["exp"]
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
			self.players[uid]["exp"] -= needExp
			self.players[uid]["level"] += upLv
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
			self.sendToUser(uid,notify)
			self.taskUpdate(uid,"loadLv",upLv)
			self.checkLimitGiftLv(uid,level,self.players[uid]["level"])
			self.cacheDao.saveCache({"messagetype":"lordUpgrade",uid:uid,level:level+upLv})
		}
	}
	//提升官职
	this.promotionOfficer = function(uid,cb) {
		var officer_lv = self.getLordAtt(uid,"officer")
		if(!officer[officer_lv + 1]){
			cb(false,"已满级")
			return
		}
		officer_lv++
		for(var i = 1;i <= 4;i++){
			if(self.checkTaskExist(uid,officer[officer_lv]["task"+i])){
				cb(false,"任务未完成"+officer[officer_lv]["task"+i])
				return
			}
		}
		self.chageLordData(uid,"officer",officer_lv)
		self.setOfficer(uid,officer_lv)
		var awardList = self.addItemStr(uid,officer[officer_lv]["award"],1,"提升官职"+officer_lv)
		cb(true,{officer : officer_lv,awardList : awardList})
	}
}