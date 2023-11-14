//日常副本
const daily_fb_base = require("../../../../config/gameCfg/daily_fb_base.json")
const daily_fb_type = require("../../../../config/gameCfg/daily_fb_type.json")
const VIP = require("../../../../config/gameCfg/VIP.json")
var async = require("async")
var main_name = "dailyfb"
module.exports = function() {
	var self = this
	let dailiInfo = {}
	for(let type in daily_fb_type){
		dailiInfo[type+"_lv"] = 0
		dailiInfo[type+"_free"] = 0
		dailiInfo[type+"_buy"] = 0
	}
	//获取日常副本数据
	this.getDailyfbInfo = function(uid,cb) {
		self.getObjAll(uid,main_name,function(obj) {
			for(var i in obj){
				obj[i] = Number(obj[i])
			}
			cb(Object.assign({},dailiInfo,obj))
		})
	}
	//日常副本每日更新
	this.dailyfbUpdate = function(uid) {
		for(let type in daily_fb_type){
			self.setObj(uid,main_name,type+"_free",0)
			self.setObj(uid,main_name,type+"_buy",0)
		}
	}
	//挑战日常副本
	this.challengeDailyfb = function(uid,fbId,verify,cb) {
		if(!daily_fb_base[fbId]){
			cb(false,"副本不存在")
			return
		}
		var type = daily_fb_base[fbId]["type"]
		var lv = 0
		var free = 0
		var buy = 0
		var isFight = false
		if(!daily_fb_type[type]){
			cb(false,"副本类型错误"+type)
			return
		}
		async.waterfall([
			function(next) {
				//获取数据
				self.getDailyfbInfo(uid,function(info) {
					next(null,info)
				})
			},
			function(info,next) {
				lv = info[type+"_lv"]
				free = info[type+"_free"]
				buy = info[type+"_buy"]
				if(daily_fb_base[fbId]["lv"] > lv + 1){
					next("请先挑战上一难度")
					return
				}
				if(lv >= daily_fb_base[fbId]["lv"]){
					//扫荡
					next()
				}else{
					//挑战
					isFight = true
				    var fightInfo = self.getFightInfo(uid)
				    if(!fightInfo){
				    	next("未准备")
				    	return
				    }
				    //todo 判断战力
				   	var atkTeam = fightInfo.team
				   	var allCE = self.getCE(uid)
				   	if(allCE < daily_fb_base[fbId]["ce"]){
				   		next("战力不足")
				   		return
				   	}
				   	var seededNum = fightInfo.seededNum
				   	var defTeam = JSON.parse(daily_fb_base[fbId]["npcteam"])
				   	var winFlag = self.fightContorl.beginFight(atkTeam,defTeam,{seededNum : seededNum})
				   	next()
				}
			},
			function(next) {
				//扣除次数
				if(free < daily_fb_type[type]["free_count"]){
					//免费
					self.incrbyObj(uid,main_name,type+"_free",1)
					next()
				}else{
					//购买次数
					if(buy < daily_fb_type[type]["buy_count"] + VIP[self.players[uid]["vip"]]["fb"]){
						self.consumeItems(uid,daily_fb_type[type]["buy_pc"],1,"日常副本",function(flag,err) {
							if(flag){
								self.incrbyObj(uid,main_name,type+"_buy",1)
								next()
							}
							else
								next(err)
						})
					}else{
						next("购买次数不足")
					}
				}
			},
			function(next) {
				//通关并获取奖励
				if(isFight)
					self.setObj(uid,main_name,type+"_lv",daily_fb_base[fbId]["lv"])
				self.taskUpdate(uid,"fb",1)
				self.taskUpdate(uid,"fb_hard",1,daily_fb_base[fbId]["lv"])
				let award = daily_fb_base[fbId]["award"]
				var rate = 1
				if(self.checkLimitedTime("fuben"))
					rate = 2
				var awardList = self.addItemStr(uid,award,rate,"日常副本"+fbId)
				cb(true,awardList)
			}
		],function(err) {
			cb(false,err)
		})	
	}
}