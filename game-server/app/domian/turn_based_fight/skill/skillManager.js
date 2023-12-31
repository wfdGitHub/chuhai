var attackSkill = require("./attackSkill.js")
var healSkill = require("./healSkill.js")
var fightRecord = require("../fight/fightRecord.js")
var buffManager = require("../buff/buffManager.js")
var model = function() {}
model.init = function(fighting,locator,formula,seeded) {
	this.fighting = fighting
	this.locator = locator
	this.formula = formula
	this.seeded = seeded
	buffManager.init(this.seeded,fighting)
}
var defaultHeal = {}
//创建技能
model.createSkill = function(otps,character) {
	switch(otps.type){
		case "attack":
			return new attackSkill(otps,character)
		case "heal":
			return new healSkill(otps,character)
		default:
			return false
	}
}
//使用技能
model.useSkill = function(skill) {
	var targets = []
	switch(skill.type){
		case "attack":
			targets = this.useAttackSkill(skill)
		break
		case "heal":
			targets = this.useHealSkill(skill)
		break
		default:
			targets = []
	}
	//技能判断燃烧状态附加BUFF
	if(skill.isAnger){
		if(skill.burn_buff_change_skill){
			for(var i = 0;i < targets.length;i++){
				if(targets[i].died ||!targets[i].buffs["burn"]){
					break
				}
				var buffInfo = Object.assign({},skill.burn_buff_change_skill,skill.character.burn_buff_change_skill)
				if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
					buffManager.createBuff(skill.character,targets[i],{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
				}
			}
		}
	}else{
		if(skill.burn_buff_change_normal){
			for(var i = 0;i < targets.length;i++){
				if(targets[i].died ||!targets[i].buffs["burn"]){
					break
				}
				var buffInfo = Object.assign({},skill.burn_buff_change_normal,skill.character.burn_buff_change_normal)
				if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
					buffManager.createBuff(skill.character,targets[i],{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
				}
			}
		}
	}
	//判断buff
	if(skill.buffId){
		var buffTargets = this.locator.getBuffTargets(skill.character,skill.buff_tg,targets)
		let buffRate = skill.buffRate
		let buffArg = skill.buffArg
		//判断技能目标减少
		if(skill.character.less_skill_buffRate){
			let allLenth = this.locator.getTargetsNum(skill.targetType)
			buffRate += ((allLenth - targets.length + 1) / allLenth) * skill.character.less_skill_buffRate
		}
		if(skill.character.less_buff_arg){
			let allLenth = this.locator.getTargetsNum(skill.targetType)
			buffArg = buffArg * (1 + ((allLenth - targets.length + 1) / allLenth) * skill.character.less_buff_arg)
			console.log("buffArg",buffArg)
		}
		for(var i = 0;i < buffTargets.length;i++){
			if(buffTargets[i].died){
				break
			}
			if(this.seeded.random("判断BUFF命中率") < buffRate){
				buffManager.createBuff(skill.character,buffTargets[i],{buffId : skill.buffId,buffArg : buffArg,duration : skill.duration})
			}
		}
	}
	//判断自身生命值恢复
	if(skill.self_heal){
		var recordInfo =  skill.character.onHeal(skill.character,{type : "heal",value : skill.character.getTotalAtt("maxHP") * skill.self_heal},skill)
		recordInfo.type = "self_heal"
		fightRecord.push(recordInfo)
	}

	//攻击纵排目标时降低怒气
	if(skill.character.enemy_vertical_anger && skill.targetType == "enemy_vertical"){
		for(var i = 0;i < targets.length;i++){
			if(targets[i].died){
				break
			}
			targets[i].lessAnger(skill.character.enemy_vertical_anger)
		}
	}
	if(skill.isAnger && !skill.character.died){
		//释放技能后恢复自身怒气
		if(skill.skill_anger_s){
			skill.character.addAnger(skill.skill_anger_s,skill.skillId)
		}
		//释放技能后恢复全体队友怒气
		if(skill.skill_anger_a)
			for(var i = 0;i < skill.character.team.length;i++)
				if(!skill.character.team[i].died)
					skill.character.team[i].addAnger(skill.skill_anger_a)
		//释放技能后回复当前本方阵容站位最靠前的武将怒气
		if(skill.character.skill_anger_first){
			let tmpTargets = this.locator.getTargets(skill.character,"team_min_index")
			for(var i = 0;i < tmpTargets.length;i++){
				tmpTargets[i].addAnger(skill.character.skill_anger_first)
			}
		}
		//释放技能后降低敌方怒气
		if(skill.skill_less_anger){
			for(var i = 0;i < targets.length;i++){
				if(targets[i].died){
					break
				}
				targets[i].lessAnger(skill.skill_less_anger,skill.skillId)
			}
		}
		//释放技能后恢复己方后排怒气
		if(skill.character.skill_anger_back){
			let tmpTargets = this.locator.getTargets(skill.character,"team_horizontal_back")
			for(var i = 0;i < tmpTargets.length;i++){
				tmpTargets[i].addAnger(skill.character.skill_anger_back)
			}
		}
		//释放技能后追加技能
		if(skill.character.skill_later_skill && this.seeded.random("判断追加技能") < skill.character.skill_later_skill.rate){
			let tmpSkillInfo = Object.assign({skillId : skill.skillId,name : skill.name},skill.character.skill_later_skill)
			let tmpSkill = this.createSkill(tmpSkillInfo,skill.character)
			this.useSkill(tmpSkill)
		}
		//释放技能后追加BUFF
		if(skill.character.skill_later_buff){
			let buffTargets = this.locator.getBuffTargets(skill.character,skill.character.skill_later_buff.buff_tg,targets)
			for(var i = 0;i < buffTargets.length;i++){
				if(!buffTargets[i].died){
					var buffInfo = skill.character.skill_later_buff
					if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
						buffManager.createBuff(skill.character,buffTargets[i],{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
					}
				}
			}
		}
	}else if(!skill.character.died){
		//普攻后恢复自身怒气
		if(skill.character.normal_add_anger)
			skill.character.addAnger(skill.character.normal_add_anger,skill.skillId)
		//普攻后降低目标怒气
		if(skill.character.normal_less_anger){
			for(var i = 0;i < targets.length;i++){
				targets[i].lessAnger(skill.character.normal_less_anger,skill.skillId)
			}
		}
		//普攻后追加BUFF
		if(skill.character.normal_later_buff){
			let buffInfo = skill.character.normal_later_buff
			let buffRate = buffInfo.buffRate
			//判断技能目标减少
			if(skill.character.less_normal_buffRate){
				let allLenth = this.locator.getTargetsNum(skill.targetType)
				buffRate += ((allLenth - targets.length + 1) / allLenth) * skill.character.less_normal_buffRate
			}
			for(var i = 0;i < targets.length;i++){
				if(!targets[i].died){
					if(this.seeded.random("判断BUFF命中率") < buffRate){
						buffManager.createBuff(skill.character,targets[i],{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
					}
				}
			}
		}
	}
	if(targets.length == 1){
		//判断单体目标
		if(skill.character.single_less_anger)
			targets[0].lessAnger(skill.character.single_less_anger,skill.skillId)
	}
	//判断死亡
	for(var i = 0;i < targets.length;i++){
		if(targets[i].died){
			//复活判断
			if(targets[i].teamInfo.resurgence_team){
				targets[i].resurgence(targets[i].teamInfo.resurgence_team)
				delete targets[i].teamInfo.resurgence_team
			}
			//死亡释放技能判断
			if(targets[i].died_use_skill){
				this.useSkill(targets[i].angerSkill)
			}
			//直接伤害死亡时对击杀者释放buff
			if(targets[i].died_later_buff){
				if(!skill.character.died){
					var buffInfo = targets[i].died_later_buff
					if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
						buffManager.createBuff(targets[i],skill.character,{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
					}
				}
			}
		}
	}
	//行动后
	if(skill.character.action_anger)
		skill.character.addAnger(skill.character.action_anger)
	if(skill.character.action_buff){
		if(!skill.character.died){
			var buffInfo = skill.character.action_buff
			if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
				buffManager.createBuff(skill.character,skill.character,{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
			}
		}
	}
}
//伤害技能
model.useAttackSkill = function(skill) {
	var recordInfo = skill.getInfo()
	recordInfo.targets = []
	if(this.locator.getTargetsNum(skill.targetType) > 1){
		recordInfo.group = true
	}
	var targets = this.locator.getTargets(skill.character,skill.targetType)
	if(!targets.length){
		fightRecord.push(recordInfo)
		return []
	}
	var addAmp = 0
	//判断怒气增加伤害
	if(skill.character.allAnger && skill.angerAmp){
		addAmp += skill.angerAmp
		delete skill.angerAmp
	}
	//判断技能目标减少
	var lessNum = this.locator.getTargetsNum(skill.targetType) - targets.length
	if(lessNum && skill.isAnger){
		if(skill.character.skill_less_amp)
			addAmp += skill.character.skill_less_amp * lessNum
		if(skill.lessAmp)
			addAmp += skill.lessAmp * lessNum
	}
	if(skill.character.less_clear_invincible){
		let allLenth = this.locator.getTargetsNum(skill.targetType)
		let buffRate = ((allLenth - targets.length + 1) / allLenth) * skill.character.less_clear_invincible
		for(var i = 0;i < targets.length;i++){
			if(!targets[i].died && (targets[i].buffs["invincible"] || targets[i].buffs["invincibleSuck"])){
				if(this.seeded.random("清除无敌盾") < buffRate){
					if(targets[i].buffs["invincible"])
						targets[i].buffs["invincible"].destroy()
					if(targets[i].buffs["invincibleSuck"])
						targets[i].buffs["invincibleSuck"].destroy()
				}
			}
		}
	}
	//判断敌方阵亡伤害加成
	if(skill.character.enemy_died_amp){
		let dieNum = 0
		for(var i = 0;i < skill.character.enemy.length;i++){
			if(!skill.character.enemy[i].isNaN && skill.character.enemy[i].died){
				dieNum++
			}
		}
		if(dieNum)
			addAmp += dieNum * skill.character.enemy_died_amp
	}
	var allDamage = 0
	var kill_num = 0
	var kill_burn_num = 0
	var dead_anger = 0
	var burnDamage = 0
	for(var i = 0;i < targets.length;i++){
		if(skill.character.died && !skill.character.died_use_skill){
			break
		}
		let target = targets[i]
		//计算伤害
		let info = this.formula.calDamage(skill.character, target, skill,addAmp)
		info = target.onHit(skill.character,info,skill)
		if(info.realValue > 0)
			allDamage += info.realValue
		if(targets[i].buffs["burn"])
			burnDamage += info.realValue
		recordInfo.targets.push(info)
		if(info.kill){
			kill_num++
			dead_anger += target.curAnger
			if(targets[i].buffs["burn"])
				kill_burn_num++
		}
	}
	fightRecord.push(recordInfo)
	if(kill_num){
		if(skill.kill_amp || skill.character.kill_amp)
			skill.character.addAtt("amplify",(skill.kill_amp + skill.character.kill_amp) * kill_num)
		if(skill.character.kill_anger)
			skill.character.addAnger(skill.character.kill_anger * kill_num,skill.skillId)
		if(skill.character.kill_crit)
			skill.character.addAtt("crit",skill.character.kill_crit * kill_num)
		if(skill.character.kill_heal){
			let tmpRecord = {type : "other_heal",targets : []}
			tmpRecord.targets.push(skill.character.onHeal(skill.character,{value : skill.character.getTotalAtt("maxHP") * skill.character.kill_heal * kill_num},skill))
			fightRecord.push(tmpRecord)
		}
		if(skill.character.kill_must_crit)
			skill.character.next_must_crit = true
		if(skill.character.kill_rob_anger && skill.isAnger)
			skill.character.addAnger(dead_anger,skill.skillId)
		//击杀后追加技能
		if(skill.character.kill_later_skill && this.seeded.random("判断追加技能") < skill.character.kill_later_skill.rate){
			let tmpSkillInfo = Object.assign({skillId : skill.skillId,name : skill.name},skill.character.kill_later_skill)
			let tmpSkill = this.createSkill(tmpSkillInfo,skill.character)
			this.useSkill(tmpSkill)
		}
		//直接伤害击杀灼烧目标后，回复自身生命值百分比
		if(skill.character.kill_burn_heal && kill_burn_num){
			let tmpRecord = {type : "other_heal",targets : []}
			let value = Math.floor(skill.character.kill_burn_heal * skill.character.attInfo.maxHP)
			let info = skill.character.onHeal(skill.character,{value : value},skill)
			tmpRecord.targets.push(info)
			fightRecord.push(tmpRecord)
		}
	}
	//伤害值转生命判断
	if(allDamage > 0){
		if(skill.turn_rate && skill.turn_tg && !skill.character.died){
			let tmpRecord = {type : "other_heal",targets : []}
			let healValue = Math.round(allDamage * (skill.turn_rate + skill.character.skill_turn_rate)) || 1
			let tmptargets = this.locator.getTargets(skill.character,skill.turn_tg)
			for(var i = 0;i < tmptargets.length;i++){
				let target = tmptargets[i]
				let info = this.formula.calHeal(skill.character,target,healValue,skill)
				info = target.onHeal(skill.character,info,skill)
				tmpRecord.targets.push(info)
			}
			fightRecord.push(tmpRecord)
		}else if(skill.isAnger && skill.character.skill_turn_rate && skill.character.skill_turn_tg && !skill.character.died){
			let tmpRecord = {type : "other_heal",targets : []}
			let healValue = Math.round(allDamage * skill.character.skill_turn_rate) || 1
			let tmptargets = this.locator.getTargets(skill.character,skill.character.skill_turn_tg)
			for(var i = 0;i < tmptargets.length;i++){
				let target = tmptargets[i]
				let info = this.formula.calHeal(skill.character,target,healValue,skill)
				info = target.onHeal(skill.character,info,skill)
				tmpRecord.targets.push(info)
			}
			fightRecord.push(tmpRecord)
		}
		if(burnDamage){
			if(!skill.isAnger && skill.character.normal_burn_turn_heal){
				let tmpRecord = {type : "other_heal",targets : []}
				let info = this.formula.calHeal(skill.character,skill.character,skill.character.normal_burn_turn_heal * burnDamage,skill)
				info = skill.character.onHeal(skill.character,info,skill)
				tmpRecord.targets.push(info)
				fightRecord.push(tmpRecord)
			}
			if(skill.isAnger && skill.character.skill_burn_turn_heal){
				let tmpRecord = {type : "other_heal",targets : []}
				let info = this.formula.calHeal(skill.character,skill.character,skill.character.skill_burn_turn_heal * burnDamage,skill)
				info = skill.character.onHeal(skill.character,info,skill)
				tmpRecord.targets.push(info)
				fightRecord.push(tmpRecord)
			}
		}
	}
	//受伤判断
	for(var i = 0;i < recordInfo.targets.length;i++){
		if(!targets[i].died){
			//受到直接伤害转化成生命
			if(targets[i].hit_turn_rate && targets[i].hit_turn_tg && recordInfo.targets[i].realValue > 0){
				let tmpRecord = {type : "other_heal",targets : []}
				let healValue = Math.round(recordInfo.targets[i].realValue * targets[i].hit_turn_rate) || 1
				let tmptargets = this.locator.getTargets(targets[i],targets[i].hit_turn_tg)
				for(var j = 0;j < tmptargets.length;j++){
					let target = tmptargets[j]
					let info = this.formula.calHeal(skill.character,target,healValue,skill)
					info = target.onHeal(targets[j],info)
					tmpRecord.targets.push(info)
				}
				fightRecord.push(tmpRecord)
			}
			//普通攻击
			if(!skill.isAnger){
				//降低攻击者怒气
				if(targets[i].hit_less_anger){
					skill.character.lessAnger(targets[i].hit_less_anger,skill.skillId)
				}
				//回复自己怒气
				if(targets[i].hit_anger_s){
					targets[i].addAnger(targets[i].hit_anger_s,skill.skillId)
				}
				//受到普攻附加BUFF
				if(targets[i].hit_normal_buff){
					var buffInfo = targets[i].hit_normal_buff
					if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
						buffManager.createBuff(targets[i],skill.character,{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
					}
				}
			}
			//收到伤害附加BUFF
			if(targets[i].hit_buff){
				var buffInfo = targets[i].hit_buff
				if(this.seeded.random("判断BUFF命中率") < buffInfo.buffRate){
					buffManager.createBuff(targets[i],skill.character,{buffId : buffInfo.buffId,buffArg : buffInfo.buffArg,duration : buffInfo.duration})
				}
			}
			//收到直接伤害反弹
			if(targets[i].hit_rebound && recordInfo.targets[i].realValue > 0){
				let hit_rebound_value = targets[i].hit_rebound + targets[i].hit_rebound_add
				let tmpRecord = {type : "other_damage",value : hit_rebound_value * recordInfo.targets[i].realValue}
				tmpRecord = skill.character.onHit(targets[i],tmpRecord)
				fightRecord.push(tmpRecord)
			}
		}
	}
	//判断攻击目标大于三人则增加两点怒气
	if(skill.thr_anger){
		if(targets.length >= 3){
			skill.character.addAnger(2,skill.skillId)
		}
	}
	//追加普通攻击判断(仅怒气技能生效)
	if((skill.isAnger && (skill.add_d_s || skill.character.skill_add_d_s)) || (kill_num && skill.character.kill_add_d_s)){
		if(skill.character.add_d_s_crit){
			skill.character.must_crit = true
			this.useSkill(skill.character.defaultSkill)
			skill.character.must_crit = false
		}else{
			this.useSkill(skill.character.defaultSkill)
		}
	}
	return targets
}
//恢复技能
model.useHealSkill = function(skill) {
	var recordInfo = skill.getInfo()
	recordInfo.targets = []
	if(this.locator.getTargetsNum(skill.targetType) > 1){
		recordInfo.group = true
	}
	var targets = this.locator.getTargets(skill.character,skill.targetType)
	let rate = 1
	if(skill.character.skill_heal_amp && skill.isAnger)
		rate += skill.character.skill_heal_amp
	else if(skill.character.normal_heal_amp && !skill.isAnger){
		rate += skill.character.normal_heal_amp
	}
	var min_hp_friend = null
	var min_hp3_list = null
	if(skill.isAnger){
		if(skill.character.heal_min_hp_rate)
			min_hp_friend = this.locator.getTargets(skill.character,"team_minHp_1")[0]
		if(skill.character.heal_min_hp3_rate){
			min_hp3_list = {}
			let tmpList = this.locator.getTargets(skill.character,"team_minHp_3")
			for(var i = 0;i < tmpList.length;i++){
				min_hp3_list[tmpList[i].id] = true
			}
		}
	}
	for(var i = 0;i < targets.length;i++){
		if(skill.character.died && !skill.character.died_use_skill){
			break
		}
		let target = targets[i]
		let value = 0
		let mul = skill.mul
		if(min_hp3_list && min_hp3_list[target.id])
			mul += skill.character.heal_min_hp3_rate
		if(skill.healType == "atk"){
			value = Math.round(skill.character.getTotalAtt("atk") * mul * rate)
		}else if(healType == "hp"){
			value = Math.round(target.getTotalAtt("maxHP") * mul * rate)
		}else{
			console.error("healType error "+healType)
		}
		if(min_hp_friend && min_hp_friend == target)
			value = Math.round(value * (skill.character.heal_min_hp_rate + 1))
		let info = this.formula.calHeal(skill.character,target,value,skill)
		info = target.onHeal(skill.character,info,skill)
		recordInfo.targets.push(info)
	}
	fightRecord.push(recordInfo)
	return targets
}
module.exports = model