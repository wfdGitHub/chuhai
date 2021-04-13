//战斗模块
var seeded = require("./seeded.js")
var locator = require("./locator.js")
var formula = require("./formula.js")
var skillManager = require("../skill/skillManager.js")
var character = require("../entity/character.js")
var fightRecord = require("./fightRecord.js")
var buffManager = require("../buff/buffManager.js")
var fightRecord = require("../fight/fightRecord.js")
var fightBegin = ["angerLessBook"]		//战斗开始前
var roundBegin = ["banishBook"]		//回合开始前
var oddRoundEndBook = ["singleAtk","angerAddBook","angerLessBook","reductionBuff"] //奇数回合结束后释放
var evenRoundEndBook = ["backDamage","frontDamage"] //偶数回合结束后释放
var roundEndBook = ["singleHeal","seckill"]	//回合结束后释放
var maxRound = 20				//最大回合
var teamLength = 6				//阵容人数
var model = function(atkTeam,defTeam,atkBooks,defBooks,otps) {
    fightRecord.init()
    this.atkTeamInfo = {}
    this.defTeamInfo = {}
	this.seededNum = otps.seededNum || (new Date()).getTime()
    this.seeded = new seeded(this.seededNum)
    this.locator = new locator(this.seeded)
    this.formula = new formula(this.seeded,otps)
    skillManager.init(this,this.locator,this.formula,this.seeded)
	this.isFight = true				//战斗中标识
	this.round = 0					//当前回合
	this.maxRound = otps.maxRound || maxRound		//最大回合
	this.atkTeam = atkTeam			//攻方阵容  长度为6的角色数组  位置无人则为NULL
	this.defTeam = defTeam			//守方阵容
	this.atkBooks = atkBooks		//攻方天书
	this.defBooks = defBooks		//守方天书
	this.allTeam = 					//双方阵容
	[{
		team : atkTeam,
		index : 0
	},{
		team : defTeam,
		index : 0
	}]
	this.teamIndex = 0				//当前行动阵容
	this.character = false 			//当前行动角色
	this.next_character = false		//插入行动角色
	this.diedList = []				//死亡列表
	this.load(atkTeam,defTeam,otps)
}
//初始配置
model.prototype.load = function(atkTeam,defTeam,otps) {
	var id = 0
	var atkTeamAdds = Object.assign({},otps.atkTeamAdds)
	var defTeamAdds = Object.assign({},otps.defTeamAdds)
	this.atkTeamInfo["realms"] = {"1":0,"2":0,"3":0,"4":0}
	this.defTeamInfo["realms"] = {"1":0,"2":0,"3":0,"4":0}
	for(var i = 0;i < teamLength;i++){
		if(!atkTeam[i]){
			atkTeam[i] = new character({})
			atkTeam[i].isNaN = true
		}else{
			this.atkTeamInfo["realms"][atkTeam[i].realm]++
		}
		atkTeam[i].init(this)
		if(atkTeam[i].resurgence_team){
			this.atkTeamInfo["resurgence_team"] = atkTeam[i].resurgence_team
			if(atkTeam[i]["resurgence_realmRate"]){
				this.atkTeamInfo["resurgence_realmRate"] = atkTeam[i]["resurgence_realmRate"]
				this.atkTeamInfo["resurgence_realmId"] = atkTeam[i]["realm"]
			}
		}
		atkTeam[i].index = i
		atkTeam[i].team = atkTeam
		atkTeam[i].enemy = defTeam
		atkTeam[i].heroId = atkTeam[i].id
		atkTeam[i].id = id++
		if(atkTeam[i].team_adds){
			for(var j in atkTeam[i].team_adds){
				if(!atkTeamAdds[j]){
					atkTeamAdds[j] = atkTeam[i].team_adds[j]
				}else{
					atkTeamAdds[j] += atkTeam[i].team_adds[j]
				}
			}
		}
	}
	for(var i = 0;i < teamLength;i++){
		if(!defTeam[i]){
			defTeam[i] = new character({})
			defTeam[i].isNaN = true
		}else{
			this.defTeamInfo["realms"][defTeam[i].realm]++
		}
		defTeam[i].init(this)
		if(defTeam[i].resurgence_team){
			this.defTeamInfo["resurgence_team"] = defTeam[i].resurgence_team
			if(defTeam[i]["resurgence_realmRate"]){
				this.defTeamInfo["resurgence_realmRate"] = defTeam[i]["resurgence_realmRate"]
				this.defTeamInfo["resurgence_realmId"] = defTeam[i]["realm"]
			}
		}
		defTeam[i].index = i
		defTeam[i].team = defTeam
		defTeam[i].enemy = atkTeam
		defTeam[i].heroId = defTeam[i].id
		defTeam[i].id = id++
		if(defTeam[i].team_adds){
			for(var j in defTeam[i].team_adds){
				if(!defTeamAdds[j]){
					defTeamAdds[j] = defTeam[i].team_adds[j]
				}else{
					defTeamAdds[j] += defTeam[i].team_adds[j]
				}
			}
		}
	}
	this.atkTeamInfo["realms_survival"] = this.atkTeamInfo["realms"]
	this.defTeamInfo["realms_survival"] = this.defTeamInfo["realms"]
	//属性加成
	for(var i = 0;i < teamLength;i++){
		atkTeam[i].calAttAdd(atkTeamAdds)
		atkTeam[i].teamInfo = this.atkTeamInfo
		defTeam[i].calAttAdd(defTeamAdds)
		defTeam[i].teamInfo = this.defTeamInfo
	}
	//天书初始化
	for(var i in this.atkBooks){
		this.atkBooks[i].init(this.atkTeam,this.defTeam,this.locator,this.seeded)
	}
	for(var i in this.defBooks){
		this.defBooks[i].init(this.defTeam,this.atkTeam,this.locator,this.seeded)
	}
}
//战斗开始
model.prototype.fightBegin = function() {
	var info = {type : "fightBegin",atkTeam : [],defTeam : [],seededNum : this.seededNum,maxRound : this.maxRound}
	for(var i = 0;i < teamLength;i++){
		this.atkTeam[i].begin()
		info.atkTeam.push(this.atkTeam[i].getSimpleInfo())
		this.defTeam[i].begin()
		info.defTeam.push(this.defTeam[i].getSimpleInfo())
	}
	fightRecord.push(info)
	//初始buff
	for(var i = 0;i < teamLength;i++){
		if(!this.atkTeam[i].died){
			if(this.atkTeam[i].first_buff_list.length){
				for(var j = 0;j < this.atkTeam[i].first_buff_list.length;j++){
					buffManager.createBuff(this.atkTeam[i],this.atkTeam[i],this.atkTeam[i].first_buff_list[j])
				}
			}
		}
		if(!this.defTeam[i].died){
			if(this.defTeam[i].first_buff_list.length){
				for(var j = 0;j < this.defTeam[i].first_buff_list.length;j++){
					buffManager.createBuff(this.defTeam[i],this.defTeam[i],this.defTeam[i].first_buff_list[j])
				}
			}
		}
	}
	for(var i = 0; i <= fightBegin.length;i++){
		if(this.atkBooks[fightBegin[i]])
			this.atkBooks[fightBegin[i]].before()
		if(this.defBooks[fightBegin[i]])
			this.defBooks[fightBegin[i]].before()
	}
	this.nextRound()
}
//开始新轮次
model.prototype.nextRound = function() {
	if(this.round >= this.maxRound){
		//达到最大轮次，战斗结束
		this.fightOver(false,true)
		return
	}
	this.round++
	// console.log("第 "+this.round+" 轮开始")
	this.allTeam[0].index = 0
	this.allTeam[1].index = 0
	this.teamIndex = 0
	fightRecord.push({type : "nextRound",round : this.round})
	for(var i = 0; i <= roundBegin.length;i++){
		if(this.atkBooks[roundBegin[i]])
			this.bookAction(this.atkBooks[roundBegin[i]])
		if(this.defBooks[roundBegin[i]])
			this.bookAction(this.defBooks[roundBegin[i]])
	}
	this.run()
}
//整体回合结束
model.prototype.endRound = function() {
	for(var i = 0;i < 6;i++){
		if(this.atkTeam[i].round_anger_rate && this.atkTeam[i].curAnger < 4){
			if(this.seeded.random("回合结束怒气") < this.atkTeam[i].round_anger_rate)
			this.atkTeam[i].addAnger(4 - this.atkTeam[i].curAnger)
		}
		if(this.defTeam[i].round_anger_rate && this.defTeam[i].curAnger < 4){
			if(this.seeded.random("回合结束怒气") < this.defTeam[i].round_anger_rate)
			this.defTeam[i].addAnger(4 - this.defTeam[i].curAnger)
		}
	}
	if(this.round % 2 == 1){
		for(var i = 0; i <= oddRoundEndBook.length;i++){
			if(this.atkBooks[oddRoundEndBook[i]])
				this.bookAction(this.atkBooks[oddRoundEndBook[i]])
			if(this.defBooks[oddRoundEndBook[i]])
				this.bookAction(this.defBooks[oddRoundEndBook[i]])
		}
	}else{
		for(var i = 0; i <= evenRoundEndBook.length;i++){
			if(this.atkBooks[evenRoundEndBook[i]])
				this.bookAction(this.atkBooks[evenRoundEndBook[i]])
			if(this.defBooks[evenRoundEndBook[i]])
				this.bookAction(this.defBooks[evenRoundEndBook[i]])
		}
	}
	for(var i = 0; i <= roundEndBook.length;i++){
		if(this.atkBooks[roundEndBook[i]])
			this.bookAction(this.atkBooks[roundEndBook[i]])
		if(this.defBooks[roundEndBook[i]])
			this.bookAction(this.defBooks[roundEndBook[i]])
	}
	if(!this.checkOver())
		this.nextRound()
}
//轮到下一个角色行动
model.prototype.run = function() {
	if(!this.isFight){
		return
	}
	if(this.allTeam[0].index == this.allTeam[0].team.length && this.allTeam[1].index == this.allTeam[1].team.length){
		for(var i = 0;i < 6;i++){
			if(this.atkTeam[i])
				this.atkTeam[i].roundOver()
			if(this.defTeam[i])
				this.defTeam[i].roundOver()
		}
		this.endRound()
		return
	}
	while(this.allTeam[this.teamIndex].index < 6){
		this.character = this.allTeam[this.teamIndex].team[this.allTeam[this.teamIndex].index]
		this.allTeam[this.teamIndex].index++
		if(this.character.died || this.character.buffs["banish"]){
			this.character = false
		}else{
			break
		}
	}
	this.teamIndex = (this.teamIndex + 1) % 2
	if(!this.character){
		//查询不到角色，换阵营
		this.run()
	}else{
		this.before()
	}
}
//回合前结算
model.prototype.before = function() {
	fightRecord.push({type : "characterAction",id : this.character.id})
	this.character.before()
	this.action()
}
//开始行动释放技能
model.prototype.action = function() {
	var skill = false
	var needValue = 0
	if(!this.character.died && !this.character.dizzy){
		if(!this.character.silence && this.character.angerSkill && this.character.curAnger >= this.character.needAnger){
			skill = this.character.angerSkill
			needValue = this.character.needAnger
			if(this.character.allAnger){
				skill.angerAmp = (this.character.curAnger - 4) * 0.15
				needValue = this.character.curAnger
			}
			if(this.character.skill_free && this.seeded.random("不消耗怒气判断") < this.character.skill_free){
				needValue = 0
			}
			if(needValue){
				this.character.lessAnger(needValue,needValue>4?false:true,true)
			}
		}else{
			if(!this.character.disarm){
				skill = this.character.defaultSkill
				this.character.addAnger(2,true)
			}
		}
	}
	if(skill){
		skillManager.useSkill(skill)
		//行动后
		if(this.character.action_anger)
			this.character.addAnger(this.character.action_anger)
		if(this.character.action_buff){
			if(!this.character.died){
				var buffInfo = this.character.action_buff
				if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
					buffManager.createBuff(this.character,this.character,{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
				}
			}
		}
		if(this.character.action_buff_s){
			if(!this.character.died){
				var buffInfo = this.character.action_buff_s
				if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
					buffManager.createBuff(this.character,this.character,{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
				}
			}
		}
		if(this.character.record_anger_rate && this.seeded.random("判断BUFF命中率") < this.character.record_anger_rate){
			needValue = Math.floor(needValue/2)
			if(needValue){
				this.character.addAnger(Math.min(needValue,4))
			}
		}
		if(this.character.action_anger_s && this.seeded.random("行动后怒气") < this.character.action_anger_s){
			this.character.addAnger(1)
		}
		if(this.character.action_heal){
			var recordInfo =  this.character.onHeal(this.character,{type : "heal",maxRate : this.character.action_heal})
			recordInfo.type = "self_heal"
			fightRecord.push(recordInfo)
		}
	}
	else{
		fightRecord.push({type : "freeze",id : this.character.id})
	}
	this.after()
}
//行动后结算
model.prototype.after = function() {
	this.character.after()
	if(this.character.next_must_crit)
		this.character.must_crit = true
	else
		this.character.must_crit = false
	this.character.next_must_crit = false
	this.character = false
	this.diedListCheck()
	//检测战斗是否结束
	if(!this.checkOver()){
		if(this.next_character && !this.next_character.died){
			fightRecord.push({type : "extraAtion",id : this.next_character.id})
			this.character = this.next_character
			this.next_character = false
			this.before()
		}else{
			this.run()
		}
	}
}
model.prototype.checkOver = function() {
	var flag = true
	for(var i = 0;i < this.atkTeam.length;i++){
		if(!this.atkTeam[i].died){
			flag = false
			break
		}
	}
	if(flag){
		this.fightOver(false)
		return true
	}
	flag = true
	for(var i = 0;i < this.defTeam.length;i++){
		if(!this.defTeam[i].died){
			flag = false
			break
		}
	}
	if(flag){
		this.fightOver(true)
		return true
	}
	return false
}
model.prototype.bookAction = function(book) {
	if(!this.isFight){
		return
	}
	book.action()
	this.diedListCheck()
	//检测战斗是否结束
	this.checkOver()
}
model.prototype.diedListCheck = function() {
	for(var i = 0;i < this.diedList.length;i++){
		if(this.diedList[i]["died_buff_s"]){
			var buffTargets = this.locator.getBuffTargets(this.diedList[i],this.diedList[i].died_buff_s.buff_tg)
			for(var j = 0;j < buffTargets.length;j++){
				if(this.seeded.random("判断BUFF命中率") < this.diedList[i].died_buff_s.buffRate){
					buffManager.createBuff(this.diedList[i],buffTargets[j],{buffId : this.diedList[i].died_buff_s.buffId,buffArg : this.diedList[i].died_buff_s.buffArg,duration : this.diedList[i].died_buff_s.duration})
				}
			}
		}
		if(this.diedList[i].died_use_skill){
			var flag = false
			for(var j = 0;j < this.diedList[i].team.length;j++){
				if(!this.diedList[i].team[j].died){
					flag = true
					break
				}
			}
			if(flag)
				skillManager.useSkill(this.diedList[i].angerSkill)
		}
		if(this.diedList[i].died_team_buff){
			var buffInfo = this.diedList[i].died_team_buff
			if(this.seeded.random("死亡全队BUFF") < buffInfo.buffRate){
				for(var j = 0;j < this.diedList[i].team.length;j++){
					if(!this.diedList[i].team[j].died){
						buffManager.createBuff(this.diedList[i],this.diedList[i].team[j],buffInfo)
					}
				}
			}
		}
		//复活判断
		if(this.diedList[i].resurgence_self && this.seeded.random("复活判断") < this.diedList[i].resurgence_self){
			this.diedList[i].resurgence(1)
		}else if(this.diedList[i].teamInfo.resurgence_team){
			var rate = this.diedList[i].teamInfo.resurgence_team
			if(this.diedList[i].teamInfo.resurgence_realmRate && this.diedList[i].teamInfo.resurgence_realmId == this.diedList[i].realm){
				rate = rate * this.diedList[i].teamInfo.resurgence_realmRate
			}
			this.diedList[i].resurgence(rate)
			delete this.diedList[i].teamInfo.resurgence_team
		}else{
			this.diedList[i].teamInfo["realms_survival"][this.diedList[i]["realm"]]--
		}
		this.diedList[i].diedClear()
	}
	this.diedList = []
}
//战斗结束
model.prototype.fightOver = function(winFlag,roundEnd) {
	// console.log("战斗结束")
	this.isFight = false
	var info = {type : "fightOver",winFlag : winFlag,atkTeam:[],defTeam:[],round : this.round,roundEnd : roundEnd||false,atkDamage:0,defDamage:0}
	for(var i = 0;i < teamLength;i++){
		if(!this.atkTeam[i].isNaN){
			info.atkDamage += this.atkTeam[i].totalDamage
			info.atkTeam.push(this.atkTeam[i].getSimpleInfo())
		}
		else {
			info.atkTeam.push(null)
		}
		if(!this.defTeam[i].isNaN){
			info.defDamage += this.defTeam[i].totalDamage
			info.defTeam.push(this.defTeam[i].getSimpleInfo())
		}
		else{
			info.defTeam.push(null)
		}
	}
	for(var i in this.atkBooks){
		info.atkDamage += this.atkBooks[i].totalDamage
	}
	for(var i in this.defBooks){
		info.defDamage += this.defBooks[i].totalDamage
	}
	fightRecord.push(info)
	fightRecord.explain()
}
module.exports = model