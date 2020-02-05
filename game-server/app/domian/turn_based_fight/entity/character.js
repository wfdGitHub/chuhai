var skillManager = require("../skill/skillManager.js")
var fightRecord = require("../fight/fightRecord.js")
var model = function(otps) {
	//=========身份===========//
	this.name = otps.name		//角色名称
	this.id = otps.id 			//角色ID
	this.realm = 0				//国家
	this.career = 0				//角色职业   healer 治疗者
	this.index = 0				//所在位置
	this.camp = ""				//攻方或守方
	this.isNaN = false			//是否空位置
	this.team = []				//所在阵容
	this.enemy = []				//敌对阵容
	this.lv = otps["lv"] || 1		//等级
	this.star = otps["star"] || 1		//星级
	this.ad = otps["ad"] || 0			//阶级
	this.teamInfo = {}
	//=========基础属性=======//
	this.attInfo = {}
	this.attInfo.maxHP = otps["maxHP"] || 0				//最大生命值
	this.attInfo.atk = otps["atk"] || 0					//攻击力
	this.attInfo.phyDef = otps["phyDef"] || 0			//物理防御力
	this.attInfo.magDef = otps["magDef"] || 0			//法术防御力
	this.attInfo.crit = otps["crit"] || 0				//暴击几率
	this.attInfo.critDef = otps["critDef"] || 0			//抗暴几率
	this.attInfo.slay = otps["slay"] || 0				//爆伤加成
	this.attInfo.slayDef = otps["slayDef"] || 0			//爆伤减免
	this.attInfo.hitRate = otps["hitRate"] || 0			//命中率
	this.attInfo.dodgeRate = otps["dodgeRate"] || 0		//闪避率
	this.attInfo.amplify = otps["amplify"] || 0			//伤害加深
	this.attInfo.reduction = otps["reduction"] || 0		//伤害减免
	this.attInfo.healRate = otps["healRate"] || 0		//治疗暴击几率
	this.attInfo.healAdd = otps["healAdd"] || 0			//被治疗加成

	this.attInfo.hp = this.attInfo.maxHP				//当前生命值
	this.needAnger = 4							//技能所需怒气值
	this.curAnger = (otps["curAnger"] || 0) + 2	//当前怒气值
	//=========特殊属性=======//
	this.buffRate								//buff概率   若技能存在buff  以此代替buff本身概率
	this.buffArg								//buff参数   若技能存在buff  以此代替buff本身参数
	this.buffDuration							//buff持续时间   若技能存在buff  以此代替buff本身持续时间
	this.burn_duration = otps.burn_duration || 0 //灼烧持续时间增长
	this.poison_duration = otps.poison_duration || 0 //中毒持续时间增长

	this.less_skill_buffRate = otps.less_skill_buffRate || 0 //技能最高提升buff概率(目标越多效果越低)
	this.less_normal_buffRate = otps.less_normal_buffRate || 0 //普攻最高提升buff概率(目标越多效果越低)
	this.less_buff_arg = otps.less_buff_arg || 0	//提升buff效果(目标越多效果越低)

	this.must_crit = false						//攻击必定暴击
	this.next_must_crit = false					//下回合攻击暴击

	this.heal_min_hp_rate = otps.heal_min_hp_rate || 0 	//对己方血量最少武将治疗加成

	this.kill_anger = otps.kill_anger || 0		//直接伤害击杀目标回复怒气
	this.kill_amp = otps.kill_amp || 0			//直接伤害每击杀一个目标提升伤害
	this.kill_crit = otps.kill_crit || 0		//直接伤害每击杀一个目标提升暴击
	this.kill_add_d_s = otps.kill_add_d_s		//直接伤害击杀目标后追加普通攻击
	this.kill_heal = otps.kill_heal || 0		//直接伤害击杀目标后，恢复自身生命值上限
	this.kill_must_crit = otps.kill_must_crit	//直接伤害击杀目标后，下回合攻击必定暴击

	this.skill_free = otps.skill_free || 0					//释放技能不消耗怒气值概率
	this.skill_attack_amp = otps.skill_attack_amp || 0		//技能伤害加成
	this.skill_heal_amp = otps.skill_heal_amp || 0			//技能治疗量加成
	this.skill_turn_rate = otps.skill_turn_rate || 0		//技能伤害转化成生命值百分比
	this.skill_turn_tg = otps.skill_turn_tg || 0			//技能伤害转化的生命值作用目标
	this.skill_add_d_s = otps.skill_add_d_s					//释放技能后追加普通攻击
	this.skill_anger_s = otps.skill_anger_s || 0			//释放技能后恢复自身怒气
	this.skill_anger_a = otps.skill_anger_a || 0			//释放技能后恢复全体队友怒气
	this.skill_anger_back = otps.skill_anger_back || 0		//释放技能后回复己方后排怒气
	this.skill_anger_first = otps.skill_anger_first || 0	//释放技能后，回复当前本方阵容站位最靠前的武将怒气
	this.skill_less_anger = otps.skill_less_anger || 0		//释放技能后降低目标怒气
	this.skill_less_amp = otps.skill_less_amp || 0			//技能目标每减少一个伤害加成比例
	if(otps.skill_later_skill){
		this.skill_later_skill = JSON.parse(otps.skill_later_skill)	//释放技能后后追加技能
	}
	if(otps.skill_later_buff){
		this.skill_later_buff = JSON.parse(otps.skill_later_buff)	//释放技能后附加buff
	}

	this.hit_turn_rate = otps.hit_turn_rate || 0	//受到直接伤害转化成生命值百分比
	this.hit_turn_tg = otps.hit_turn_tg || 0		//受到直接伤害转化的生命值作用目标
	this.hit_rebound = otps.hit_rebound || 0		//受到直接伤害反弹比例
	this.hit_rebound_add = otps.hit_rebound_add || 0 //反弹增加比例
	this.hit_less_anger = otps.hit_less_anger || 0	//受到普通攻击后，降低攻击自己的武将怒气
	if(otps.hit_buff){
		this.hit_buff = JSON.parse(otps.hit_buff)	//受到伤害给攻击者附加BUFF
	}
	this.normal_heal_amp = otps.normal_heal_amp || 0			//普攻治疗量加成
	this.normal_add_anger = otps.normal_add_anger || 0			//普攻后恢复自身怒气
	this.normal_less_anger = otps.normal_less_anger || 0		//普攻后降低目标怒气
	this.normal_attack_amp = otps.normal_attack_amp || 0		//普攻伤害加成
	this.normal_burn_turn_heal = otps.normal_burn_turn_heal || 0//普攻时，如果目标处于灼烧状态，技能直接伤害的百分比转化为生命治疗自己
	if(otps.normal_later_buff){
		this.normal_later_buff = JSON.parse(otps.normal_later_buff)	//普攻后附加BUFF
	}
	this.add_d_s_crit = otps.add_d_s_crit					//追加普攻必定暴击
	this.action_anger = otps.action_anger || 0				//行动后回复自身怒气
	this.low_hp_amp = otps.low_hp_amp || 0					//战斗中自身生命每降低10%，伤害加成
	this.low_hp_crit = otps.low_hp_crit || 0				//战斗中自身生命每降低10%，暴击加成
	this.enemy_died_amp = otps.enemy_died_amp || 0			//敌方每阵亡一人，伤害加成比例

	this.single_less_anger = otps.single_less_anger || 0 	//攻击单体目标额外降低怒气

	this.resurgence_team = otps.resurgence_team || 0		//复活本方第1位阵亡的武将，并恢复其50%的生命，每场战斗只可触发1次
	this.burn_hit_reduction = otps.burn_hit_reduction || 0	//被灼烧状态敌人攻击伤害减免

	if(otps.burn_att_change)
		this.burn_att_change = JSON.parse(otps.burn_att_change)			//灼烧状态属性修改
	if(otps.burn_buff_change)
		this.burn_buff_change = JSON.parse(otps.burn_buff_change)		//灼烧状态附加BUFF修改
	//todo
	this.first_crit = otps.first_crit			//首回合必定暴击
	if(this.first_crit)
		this.must_crit = true
	if(otps.first_buff)
		this.first_buff = JSON.parse(otps.first_buff)		//首回合附加BUFF
	this.died_use_skill = otps.died_use_skill				//死亡时释放一次技能

	//=========状态=======//
	this.died = this.attInfo.maxHP && this.attInfo.hp ? false : true 	//死亡状态
	this.buffs = {}					//buff列表
	this.dizzy = false				//眩晕
	this.silence = false			//沉默
	this.disarm = false				//麻痹
	this.forbidden = false			//禁疗
	this.poison = false				//中毒
	this.burn = false				//燃烧
	//=========属性加成=======//
	this.self_adds = {}							//自身百分比加成属性
	this.team_adds = {}							//全队百分比加成属性
	this.show_adds = {}							//总百分比加成
	if(otps.self_atk_add)
		this.self_adds["atk"] = otps.self_atk_add
	if(otps.self_maxHP_add)
		this.self_adds["maxHP"] = otps.self_maxHP_add
	if(otps.team_atk_add)
		this.team_adds["atk"] = otps.team_atk_add
	if(otps.team_maxHP_add)
		this.team_adds["maxHP"] = otps.team_maxHP_add
	if(otps.team_amplify_add)
		this.team_adds["amplify"] = otps.team_amplify_add
	if(otps.team_reduction_add)
		this.team_adds["reduction"] = otps.team_reduction_add
	if(otps.team_hitRate_add)
		this.team_adds["hitRate"] = otps.team_hitRate_add
	if(otps.team_dodgeRate_add)
		this.team_adds["dodgeRate"] = otps.team_dodgeRate_add
	if(otps.team_phyDef_add)
		this.team_adds["phyDef"] = otps.team_phyDef_add
	if(otps.team_magDef_add)
		this.team_adds["magDef"] = otps.team_magDef_add
	if(otps.team_slay_add)
		this.team_adds["slay"] = otps.team_slay_add
	if(otps.team_slayDef_add)
		this.team_adds["slayDef"] = otps.team_slayDef_add	
	if(otps.team_crit_add)
		this.team_adds["crit"] = otps.team_crit_add
	if(otps.team_critDef_add)
		this.team_adds["critDef"] = otps.team_critDef_add
	//=======属性加成======//
	if(this.lv > 100){
		var lvdif = this.lv - 100
		if(otps.atk_grow)
			this.attInfo.atk += Math.ceil(otps.atk_grow * lvdif) || 0
		if(otps.maxHP_grow){
			this.attInfo.maxHP += Math.ceil(otps.maxHP_grow * lvdif) || 0
			this.attInfo.hp = this.attInfo.maxHP
		}
		if(otps.phyDef_grow)
			this.attInfo.phyDef += Math.ceil(otps.phyDef_grow * lvdif) || 0
		if(otps.magDef_grow)
			this.attInfo.magDef += Math.ceil(otps.magDef_grow * lvdif) || 0
	}
	//=========技能=======//
	if(otps.defaultSkill){
		this.defaultSkill = skillManager.createSkill(otps.defaultSkill,this)				//普通技能
	}
	if(otps.angerSkill){
		this.angerSkill = skillManager.createSkill(otps.angerSkill,this)		//怒气技能
		this.angerSkill.isAnger = true
		if(this.buffRate)
			this.angerSkill.buffRate = this.buffRate
		if(this.buffArg)
			this.angerSkill.buffArg = this.buffArg
		if(this.buffDuration)
			this.angerSkill.buffDuration = this.buffDuration
	}
}
//百分比属性加成
model.prototype.calAttAdd = function(team_adds) {
	this.show_adds = Object.assign({},this.self_adds)
	for(var i in team_adds){
		if(!this.show_adds[i]){
			this.show_adds[i] = team_adds[i]
		}else{
			this.show_adds[i] += team_adds[i]
		}
	}
	for(var i in this.show_adds){
		switch(i){
			case "atk":
			case "maxHP":
			case "phyDef":
			case "magDef":
				this.attInfo[i] += Math.ceil(this.attInfo[i] * this.show_adds[i])
			break
			default:
				this.attInfo[i] += this.show_adds[i]
		}
	}
	this.attInfo.hp = this.attInfo.maxHP
}

//行动开始前刷新
model.prototype.before = function() {
	//伤害BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].damageType == "dot")
			this.buffs[i].update()
}
//行动结束后刷新
model.prototype.after = function() {
	//状态BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].damageType != "dot")
			this.buffs[i].update()
}
//受到伤害
model.prototype.onHit = function(attacker,info,source) {
	info.id = this.id
	info.value = Math.floor(info.value) || 1
	if(this.died){
		console.error("不能攻击已死亡的角色",this.name)
		info.realValue = 0
		return info
	}
	if(this.buffs["invincibleSuper"] || this.buffs["invincible"]){
		info.invincible = true
		info.realValue = 0
		return info
	}
	if(info.miss){
		info.realValue = 0
	}else{
		info.realValue = this.lessHP(info.value)
		info.curValue = this.attInfo.hp
		info.maxHP = this.attInfo.maxHP
		if(this.died){
			info.kill = true
			attacker.kill(this)
		}
	}
	return info
}
//受到治疗
model.prototype.onHeal = function(attacker,info,source) {
	info.id = this.id
	info.value = Math.floor(info.value) || 1
	if(this.forbidden){
		info.value = 0
		info.realValue = 0
	}else{
		info.value = Math.floor(info.value * (1 + this.attInfo.healAdd / 10000))
		info.realValue = this.addHP(info.value)
	}
	info.curValue = this.attInfo.hp
	info.maxHP = this.attInfo.maxHP
	return info
}
//永久增加属性
model.prototype.addAtt = function(name,value) {
	if(this.attInfo[name] != undefined){
		this.attInfo[name] += value
		fightRecord.push({type : "addAtt",name : name,value : value,id : this.id})
	}
}
//角色死亡
model.prototype.onDie = function() {
	// console.log(this.name+"死亡")
	this.attInfo.hp = 0
	this.died = true
}
//击杀目标
model.prototype.kill = function(target) {
    // console.log(this.name+"击杀"+target.name)
}
//复活
model.prototype.resurgence = function(rate) {
	this.attInfo.hp = Math.floor(rate * this.attInfo.maxHP) || 1
	this.died = false
	fightRecord.push({type : "resurgence",curValue : this.attInfo.hp,maxHP : this.attInfo.maxHP,id : this.id})
}
//恢复血量
model.prototype.addHP = function(value) {
	var realValue = value
	if((this.attInfo.hp + value) > this.attInfo.maxHP){
		realValue = this.attInfo.maxHP - this.attInfo.hp
		this.attInfo.hp = this.attInfo.maxHP
	}else{
		this.attInfo.hp += value
	}
	// console.log(this.name + "addHP" , value,realValue,"curHP : ",this.attInfo.hp+"/"+this.attInfo.maxHP)
	return realValue
}
//扣除血量
model.prototype.lessHP = function(value) {
	var realValue = value
	if((this.attInfo.hp - value) <= 0){
		realValue = this.attInfo.hp
		this.onDie()
	}else{
		this.attInfo.hp -= value
	}
	return realValue
}
//恢复怒气
model.prototype.addAnger = function(value,skillId) {
	value = Math.floor(value) || 1
	this.curAnger += value
	fightRecord.push({type : "addAnger",realValue : value,curAnger : this.curAnger,needAnger : this.needAnger,id : this.id,skillId : skillId})
	return value
}
//减少怒气
model.prototype.lessAnger = function(value,skillId) {
	value = Math.floor(value) || 1
	var realValue = value
	if((this.curAnger - value) < 0){
		realValue = this.curAnger
		this.curAnger = 0
	}else{
		this.curAnger -= value
	}
	if(realValue)
		fightRecord.push({type : "lessAnger",realValue : realValue,curAnger : this.curAnger,needAnger : this.needAnger,id : this.id,skillId : skillId})
	return realValue
}
//获取属性
model.prototype.getTotalAtt = function(name) {
	var value = this.attInfo[name] || 0
	if(this.buffs[name]){
		value += this.buffs[name].getValue()
	}
	return value
}
//获取信息
model.prototype.getInfo = function() {
	var info = {}
	info.id = this.id
	info.name = this.name
	info.nation = this.nation
	info.definition = this.definition
	info.index = this.index
	info.lv = this.lv
	info.maxHP = this.attInfo.maxHP
	info.hp = this.attInfo.hp
	info.atk = this.attInfo.atk
	info.phyDef = this.attInfo.phyDef
	info.magDef = this.attInfo.mthis.attInfoagDef
	info.crit = this.attInfo.crit
	info.critDef = this.attInfo.critDef
	info.slay = this.attInfo.slay
	info.slayDef = this.attInfo.slayDef
	info.hitRate = this.attInfo.hitRate
	info.dodgeRate = this.attInfo.dodgeRate
	info.amplify = this.attInfo.amplify
	info.reduction = this.attInfo.reduction
	info.healRate = this.attInfo.healRate
	info.healAdd = this.attInfo.healAdd
	info.needAnger = this.needAnger
	info.curAnger = this.curAnger
	return info
}
//获取战斗力  comat effectiveness
model.prototype.getCE = function() {
	var ce = 0
	ce += this.attInfo.atk
	ce += this.attInfo.maxHP / 6
	ce += this.attInfo.phyDef / 3
	ce += this.attInfo.magDef / 3
	ce += this.attInfo.crit * 10000
	ce += this.attInfo.critDef * 10000
	ce += this.attInfo.slayDef * 10000
	ce += this.attInfo.hitRate * 10000
	ce += this.attInfo.dodgeRate * 10000
	ce += this.attInfo.amplify * 10000
	ce += this.attInfo.reduction * 10000
	ce += this.attInfo.healRate * 10000
	ce += this.attInfo.healAdd * 10000
	ce = Math.floor(ce)
	return ce
}
model.prototype.getSimpleInfo = function() {
	var info = {}
	info.id = this.id
	info.name = this.name
	info.atk = this.attInfo.atk
	info.hp = this.attInfo.hp
	info.curAnger = this.curAnger
	info.needAnger = this.needAnger
	return info
}
model.prototype.addBuff = function(releaser,buff) {
	if(this.buffs[buff.buffId]){
		this.buffs[buff.buffId].overlay(releaser,buff)
	}else{
		this.buffs[buff.buffId] = buff
	}
}
model.prototype.removeBuff = function(buffId) {
    if(this.buffs[buffId]){
        delete this.buffs[buffId]
    }
}
module.exports = model