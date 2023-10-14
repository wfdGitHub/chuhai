//战力
const async = require("async")
const book_list = require("../../../../config/gameCfg/book_list.json")
const book_lv = require("../../../../config/gameCfg/book_lv.json")
const book_star = require("../../../../config/gameCfg/book_star.json")
const book_slot = require("../../../../config/gameCfg/book_slot.json")
const default_cfg = require("../../../../config/gameCfg/default_cfg.json")
const main_name = "CE"
var bookMap = {}
for(var i in book_list){
	book_list[i].id = i
	bookMap[book_list[i]["type"]] = book_list[i]
}
module.exports = function() {
	var self = this
	var userTeams = {}
	var usersCes = {}
	var userTeamMaps = {}
	var readyFightMaps = {}
	//加载角色阵容数据
	this.CELoad = function(uid,cb) {
		self.heroDao.getFightTeam(uid,function(flag,data) {
			if(flag && data){
				userTeams[uid] = data
				userTeamMaps[uid] = {}
				for(var i = 0;i < data.length;i++){
					if(data[i])
						userTeamMaps[uid][data[i].hId] = i
				}
				self.updateCE(uid)
			}
			if(cb)
				cb(flag)
		})
	}
	//移除角色阵容数据
	this.CEUnload = function(uid) {
		delete userTeams[uid]
		delete usersCes[uid]
		delete userTeamMaps[uid]
	}
	//获得英雄属性
	this.getHeroInfo = function(uid,hId) {
		if(userTeams[uid] && userTeamMaps[uid] && userTeamMaps[uid][hId]){
			return userTeamMaps[uid][hId]
		}
	}
	//修改英雄属性
	this.incrbyCEInfo = function(uid,hId,name,value) {
		if(userTeams[uid] && userTeamMaps[uid] && userTeamMaps[uid][hId] !== undefined){
			var index = userTeamMaps[uid][hId]
			var oldValue = userTeams[uid][index][name]
			if(!userTeams[uid][index][name])
				userTeams[uid][index][name] = 0
			userTeams[uid][index][name] += value
			this.incrbyCE(uid,name,oldValue,userTeams[uid][index][name])
		}
	}
	//设置英雄属性
	this.setCEInfo = function(uid,hId,name,value) {
		if(userTeams[uid] && userTeamMaps[uid] && userTeamMaps[uid][hId] !== undefined){
			var index = userTeamMaps[uid][hId]
			var oldValue = userTeams[uid][index][name]
			userTeams[uid][index][name] = value
			this.incrbyCE(uid,name,oldValue,userTeams[uid][index][name])
		}
	}
	//删除英雄属性
	this.delCEInfo = function(uid,hId,name) {
		if(userTeams[uid] && userTeamMaps[uid] && userTeamMaps[uid][hId] !== undefined){
			var index = userTeamMaps[uid][hId]
			var oldValue = userTeams[uid][index][name]
			delete userTeams[uid][index][name]
			this.incrbyCE(uid,name,oldValue,userTeams[uid][index][name])
		}
	}
	//改变战力
	this.incrbyCE = function(uid,name,oldValue,newValue) {
		var ce = self.fightContorl.calcCEDiff(name,oldValue,newValue)
		if(usersCes[uid] && ce){
			var oldCE = usersCes[uid]
			usersCes[uid] += ce
			let notify = {
				type : "updateCE",
				oldCE : oldCE,
				newCE : usersCes[uid]
			}
			self.sendToUser(uid,notify)
			self.taskUpdate(uid,"totalCe",usersCes[uid])
			self.addZset("ce_rank",uid,usersCes[uid])
			self.playerDao.setPlayerInfo({uid:uid,key:"CE",value:usersCes[uid]})
		}
	}
	//更新战力
	this.updateCE = function(uid) {
		if(userTeams[uid]){
			let oldCE = usersCes[uid]
			let newCE = self.fightContorl.getTeamCE(userTeams[uid])
			usersCes[uid] = newCE
			if(!oldCE || oldCE != newCE){
				let notify = {
					type : "updateCE",
					oldCE : oldCE,
					newCE : newCE
				}
				self.sendToUser(uid,notify)
				self.taskUpdate(uid,"totalCe",newCE)
				self.addZset("ce_rank",uid,newCE)
				self.playerDao.setPlayerInfo({uid:uid,key:"CE",value:newCE})
			}
		}
	}
	//获取战力
	this.getCE = function(uid) {
		return usersCes[uid] || 1
	}
	//获取阵容
	this.getUserTeam = function(uid) {
		return JSON.parse(JSON.stringify(userTeams[uid]))
	}
	//获取上阵英雄数量
	this.getTeamNum = function(uid) {
		var count = 0
		if(userTeamMaps[uid])
			for(var i in userTeamMaps[uid])
				count++
		return count
	}
	//获取天书数据
	this.getBookData = function(uid,cb) {
		this.getObjAll(uid,"book",function(data) {
			if(!data)
				data = {}
			for(var i in data){
				data[i] = Number(data[i])
			}
			cb(true,data)
		})
	}
	//获取上阵天书
	this.getFightBook = function(uid,cb) {
		self.getObjAll(uid,"book_fight",function(data) {
			cb(true,data)
		})
	}
	//升级技能属性
	this.incrbyGuildCareerSkill = function(uid,career) {
		self.incrbyObj(uid,"guild","skill_"+career,1)
		if(userTeams[uid] && userTeams[uid][6] && userTeams[uid][6]["g"+career] !== undefined){
			userTeams[uid][6]["g"+career] ++
			this.updateCE(uid)
		}
	}
	//设置天书属性
	this.setBookInfo = function(uid,bookType,name,value) {
		self.setObj(uid,"book",bookType+"_"+name,value)
		if(userTeams[uid] && userTeams[uid][6] && userTeams[uid][6][bookType]){
			userTeams[uid][6][bookType][name] = value
			this.updateCE(uid)
		}
	}
	//更改称号
	this.setTitle = function(uid,title) {
		if(userTeams[uid] && userTeams[uid][6]){
			userTeams[uid][6]["title"] = title
			this.updateCE(uid)
		}
	}
	//更改官职
	this.setOfficer = function(uid,officer) {
		if(userTeams[uid] && userTeams[uid][6]){
			userTeams[uid][6]["officer"] = officer
			this.updateCE(uid)
		}
	}
	//更新图鉴值
	this.setGather = function(uid,gather) {
		if(userTeams[uid] && userTeams[uid][6]){
			userTeams[uid][6]["gather"] = gather
			this.updateCE(uid)
		}
	}
	//更新阵营加成
	this.setCampAtt = function(uid,camp,value) {
		if(userTeams[uid] && userTeams[uid][6]){
			userTeams[uid][6]["camp_"+camp] = value
			this.updateCE(uid)
		}
	}
	//激活天书
	this.activateBook = function(uid,bookType,cb) {
		if(!bookMap[bookType]){
			cb(false,"天书不存在")
			return
		}
		self.getObj(uid,"book",bookType+"_lv",function(data) {
			if(data){
				cb(false,"已激活")
			}else{
				self.consumeItems(uid,bookMap[bookType].id+":"+10,1,"激活天书"+bookType,function(flag,err) {
					if(!flag){
						cb(false,err)
					}else{
						self.setBookInfo(uid,bookType,"lv",1)
						self.setBookInfo(uid,bookType,"star",0)
						cb(true)
					}
				})
			}
		})
	}
	//升级天书
	this.upgradeBookLv = function(uid,bookType,cb) {
		self.getHMObj(uid,"book",[bookType+"_lv",bookType+"_star"],function(list) {
			var lv = list[0]
			var star = list[1]
			if(!lv){
				cb(false,"未激活")
				return
			}
			lv = Number(lv)
			if(!book_lv[lv] || !book_lv[lv]["pc"]){
				cb(false,"不可升级")
				return
			}
			if(lv >= book_star[star]["maxLv"]){
				cb(false,"等级上限")
				return
			}
			self.consumeItems(uid,book_lv[lv]["pc"],1,"升级天书"+bookType,function(flag,err) {
				if(!flag){
					cb(false,err)
				}else{
					lv += 1
					self.setBookInfo(uid,bookType,"lv",lv)
					cb(true,lv)
				}
			})
		})
	}
	//升星天书
	this.upgradeBookStar = function(uid,bookType,cb) {
		self.getObj(uid,"book",bookType+"_star",function(star) {
			if(star == undefined){
				cb(false,"未激活")
				return
			}
			star = Number(star)
			if(!book_star[star] || !book_star[star]["item"]){
				cb(false,"不可升星")
				return
			}
			var str = bookMap[bookType]["id"]+":"+book_star[star]["bookChip"]+"&"+"1000400:"+book_star[star]["item"]
			self.consumeItems(uid,str,1,"升星天书"+bookType,function(flag,err) {
				if(!flag){
					cb(false,err)
				}else{
					star += 1
					self.setBookInfo(uid,bookType,"star",star)
					cb(true,star)
				}
			})
		})
	}
	//重生天书
	this.resetBook = function(uid,bookType,cb) {
		self.getObj(uid,"book",bookType+"_lv",function(lv) {
			if(!lv){
				cb(false,"未激活")
				return
			}
			lv = Number(lv)
			if(lv == 1){
				cb(false,"1级天书不可重生")
				return
			}
			self.consumeItems(uid,default_cfg["default_pc_2"]["value"],1,"重生天书"+bookType,function(flag,err) {
				if(!flag){
					cb(false,err)
				}else{
					var awardList = self.addItemStr(uid,book_lv[lv]["pr"],1,"重生天书"+bookType)
					self.setBookInfo(uid,bookType,"lv",1)
					cb(true,awardList)
				}
			})
		})
	}
	//设置上阵天书
	this.setBookFight = function(uid,list,cb) {
		if(!Array.isArray(list)){
			cb(false,"参数错误")
			return
		}
		var length = list.length
		if(length == 0){
			self.delObjAll(uid,"book_fight",function() {
				self.CELoad(uid)
			})
			cb(true)
		}else{
			var map = {}
			for(var i = 0;i < list.length;i++){
				if(list[i]){
					if(map[list[i]]){
						cb(false,"天书重复")
						return
					}
					map[list[i]] = true
				}
			}
			if(!book_slot[length] || self.getLordLv(uid) < book_slot[length]["lv"]){
				cb(false,"开启等级不足")
				return
			}
			self.getObjAll(uid,"book",function(data) {
				var obj = {}
				for(var i = 0;i < list.length;i++){
					if(list[i] && !data[list[i]+"_lv"]){
						cb(false,list[i]+"未激活")
						return
					}
					obj[i] = list[i]
				}
				self.setHMObj(uid,"book_fight",obj,function() {
					self.CELoad(uid)
				})
				cb(true)
			})
		}
	}
	//预备战斗
	this.readyFight = function(uid,type,cb) {
		if(typeof type !== "string")
			type = "default"
		if(!readyFightMaps[type])
			readyFightMaps[type] = {}
		var team = this.getUserTeam(uid)
		if(team){
			readyFightMaps[type][uid] = {team : team,seededNum : Date.now(),type:type}
			cb(true,readyFightMaps[type][uid])
		}else{
			cb(false,"无战斗数据")
		}
	}
	//获取玩家上阵配置(出战阵容)
	this.getFightInfo = function(uid,type) {
		if(!readyFightMaps[type] || !readyFightMaps[type][uid])
			return false
		var fightInfo = readyFightMaps[type][uid]
		delete readyFightMaps[type][uid]
		return fightInfo
	}
}