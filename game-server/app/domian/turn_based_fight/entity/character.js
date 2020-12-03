var skillManager = require("../skill/skillManager.js")
var fightRecord = require("../fight/fightRecord.js")
var buffManager = require("../buff/buffManager.js")
var model = function(otps) {
	//=========身份===========//
	this.name = otps.name		//角色名称
	this.id = otps.id 			//角色ID
	this.heroId = otps.heroId
	this.realm = otps.realm		//国家
	this.career = otps.career	//角色职业   healer 治疗者
	this.index = 0				//所在位置
	this.isNaN = false			//是否空位置
	this.team = []				//所在阵容
	this.enemy = []				//敌对阵容
	this.lv = otps["lv"] || 1		//等级
	this.star = otps["star"] || 1		//星级
	this.ad = otps["ad"] || 0			//阶级
	this.teamInfo = {}
	this.bookAtts = otps.bookAtts
	this.isBoss = otps.boss || false	//是否是BOSS
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
	this.surplus_health = otps.surplus_health			//剩余生命值比例

	this.needAnger = otps["needAnger"] || 4				//技能所需怒气值
	this.curAnger = (otps["curAnger"] || 0) + 2	//当前怒气值
	this.allAnger = otps["allAnger"] || false   //技能消耗所有怒气
	this.totalDamage = 0						//累计伤害
	this.totalHeal = 0							//累计治疗
	//=========觉醒效果=======//
	this.banLessAnger = otps.banLessAnger || false  //免疫减怒
	this.overDamageToMaxHp = otps.overDamageToMaxHp || 0 //溢出伤害对血量最高的敌方目标造成伤害比例
	this.invincibleAnger = otps.invincibleAnger || 0 //无敌盾增加怒气
	this.invincibleHeal = otps.invincibleHeal || 0 //无敌盾同阵营消失时恢复生命上限比例
	this.unpoison_heal = otps.unpoison_heal || 0   //同阵营解除中毒与治疗加成比例
	this.skill_must_hit = otps.skill_must_hit || false //技能必定命中
	this.realm_extra_buff_minHp = otps.realm_extra_buff_minHp || 0 //额外对敌方血量最少目标释放BUFF概率（每个同阵营英雄加成）
	//=========宝石效果=======//
	this.kill_clear_buff = otps.kill_clear_buff || 0 //直接伤害击杀目标后，概率清除己方武将身上该目标死亡前释放的所有异常效果（灼烧、中毒、眩晕、沉默、麻痹）
	this.control_amp = otps.control_amp || 0 //攻击正在被控制（眩晕、沉默、麻痹）的目标时，增加伤害比例
	this.reduction_over = otps.reduction_over || 0 //受到武将直接伤害时，如果该伤害超过自身生命上限的40%，减免此次伤害的比例
	if(otps.died_buff_s)
		this.died_buff_s = JSON.parse(otps.died_buff_s) || false //死亡时释放BUFF
	if(otps.before_buff_s)
		this.before_buff_s = JSON.parse(otps.before_buff_s) || false //战斗前对自身释放BUFF
	if(otps.action_buff_s)
		this.action_buff_s = JSON.parse(otps.action_buff_s) || false //行动后对自身释放BUFF
	this.record_anger_rate = otps.record_anger_rate || 0 //释放技能后，概率获得本次技能消耗的50%的怒气，最多不超过4点
	this.round_anger_rate = otps.round_anger_rate || 0 //整体回合结束时，如果自身怒气低于4点，将怒气回复至4点的概率
	this.action_anger_s = otps.action_anger_s || 0 //自身行动后，回复自身1点怒气概率
	this.before_clear_debuff = otps.before_clear_debuff || 0 //自身回合开始前，移除自身所有的异常效果（灼烧、中毒、眩晕、沉默、麻痹、禁疗、心魔）的概率
	this.oneblood_rate = otps.oneblood_rate || 0 //受到致命伤害时保留一滴血概率
	this.target_anger_amp = otps.target_anger_amp || 0 //敌人超过4点怒气的部分，每点怒气提供伤害加成
	//=========元神效果=======//
	this.forbidden_shield = otps.forbidden_shield || 0 //治疗时，若目标处于禁疗状态，转化为护盾比例
	this.dizzy_clear_anger = otps.dizzy_clear_anger  //眩晕概率减半 眩晕时清空目标所有怒气
	//=========特殊属性=======//
	this.buffRate = otps.buffRate || 0			//buff概率   若技能存在buff  以此代替buff本身概率
	this.buffArg = otps.buffArg || 0			//buff参数   若技能存在buff  以此代替buff本身参数
	this.buffDuration = otps.buffDuration || 0	//buff持续时间   若技能存在buff  以此代替buff本身持续时间
	this.burn_duration = otps.burn_duration || 0 //灼烧持续时间增长
	this.poison_duration = otps.poison_duration || 0 //中毒持续时间增长
	this.poison_change_hp = otps.poison_change_hp || 0 //造成的中毒伤害转化为血量治疗自己。

	this.less_skill_buffRate = otps.less_skill_buffRate || 0 //技能最高提升buff概率(目标越多效果越低)
	this.less_normal_buffRate = otps.less_normal_buffRate || 0 //普攻最高提升buff概率(目标越多效果越低)
	this.less_buff_arg = otps.less_buff_arg || 0	//提升buff效果(目标越多效果越低)
	this.less_clear_invincible = otps.less_clear_invincible || 0 //清除敌方武将无敌概率（目标越多效果越低）

	this.control_buff_lowrate = otps.control_buff_lowrate || 0 //被控制概率降低（麻痹、沉默、眩晕）
	this.damage_buff_lowrate = otps.damage_buff_lowrate || 0 //降低受到的灼烧、中毒概率
	this.damage_buff_lowArg = otps.damage_buff_lowArg || 0 //降低受到的灼烧、中毒伤害

	this.enemy_vertical_anger = otps.enemy_vertical_anger || 0	//攻击纵排目标时降低敌人怒气


	this.must_crit = false						//攻击必定暴击
	this.next_must_crit = false					//下回合攻击暴击

	this.heal_min_hp_rate = otps.heal_min_hp_rate || 0 	//对己方血量最少武将治疗加成
	this.heal_min_hp3_rate = otps.heal_min_hp3_rate || 0 	//对己方血量最少3个武将治疗加成

	this.kill_anger = otps.kill_anger || 0		//直接伤害击杀目标回复怒气
	this.kill_amp = otps.kill_amp || 0			//直接伤害每击杀一个目标提升伤害
	this.kill_crit = otps.kill_crit || 0		//直接伤害每击杀一个目标提升暴击
	this.kill_add_d_s = otps.kill_add_d_s		//直接伤害击杀目标后追加普通攻击
	this.kill_heal = otps.kill_heal || 0		//直接伤害击杀目标后，恢复自身生命值上限
	this.kill_must_crit = otps.kill_must_crit	//直接伤害击杀目标后，下回合攻击必定暴击
	this.kill_rob_anger = otps.kill_rob_anger 	//技能直接击杀敌方目标时，获得目标剩余的所有怒气
	this.kill_burn_heal = otps.kill_burn_heal || 0 //直接伤害击杀灼烧目标后，回复自身生命值百分比
	if(otps.kill_later_skill){
		this.kill_later_skill = JSON.parse(otps.kill_later_skill)	//直接伤害击杀后追加技能
	}

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
	this.skill_burn_turn_heal = otps.skill_burn_turn_heal || 0//如果目标处于灼烧状态，技能直接伤害的百分比转化为生命治疗自己
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
	this.hit_anger_s = otps.hit_anger_s || 0 		//受到普通攻击后，回复自己的怒气
	if(otps.hit_buff){
		this.hit_buff = JSON.parse(otps.hit_buff)	//受到伤害给攻击者附加BUFF
	}
	if(otps.hit_normal_buff){
		this.hit_normal_buff = JSON.parse(otps.hit_normal_buff)	//受到伤害给攻击者附加BUFF
	}
	this.normal_crit = otps.normal_crit || false 				//普攻必定暴击(含治疗)	
	this.normal_heal_amp = otps.normal_heal_amp || 0			//普攻治疗量加成
	this.normal_add_anger = otps.normal_add_anger || 0			//普攻后恢复自身怒气
	this.normal_less_anger = otps.normal_less_anger || 0		//普攻后降低目标怒气
	this.normal_attack_amp = otps.normal_attack_amp || 0		//普攻伤害加成
	this.normal_burn_turn_heal = otps.normal_burn_turn_heal || 0//如果目标处于灼烧状态，普攻直接伤害的百分比转化为生命治疗自己
	if(otps.normal_later_buff){
		this.normal_later_buff = JSON.parse(otps.normal_later_buff)	//普攻后附加BUFF
	}
	this.add_d_s_crit = otps.add_d_s_crit						//追加普攻必定暴击
	this.add_default_amp = otps.add_default_amp || 0			//追加普攻伤害加成
	this.add_default_maxHp = otps.add_default_maxHp || 0		//追加普攻生命上限伤害
	this.add_skill_amp = otps.add_skill_amp || 0 				//追加技能伤害加成

	this.action_anger = otps.action_anger || 0				//行动后回复自身怒气
	if(otps.action_buff){
		this.action_buff = JSON.parse(otps.action_buff)		//行动后追加buff
	}

	this.low_hp_amp = otps.low_hp_amp || 0					//战斗中自身生命每降低10%，伤害加成
	this.low_hp_crit = otps.low_hp_crit || 0				//战斗中自身生命每降低10%，暴击加成
	this.low_hp_heal = otps.low_hp_heal || 0				//目标血量每减少10%，对其造成的的治疗量加成
	this.enemy_died_amp = otps.enemy_died_amp || 0			//敌方每阵亡一人，伤害加成比例

	this.single_less_anger = otps.single_less_anger || 0 	//攻击单体目标额外降低怒气

	this.resurgence_team = otps.resurgence_team || 0		//复活本方第1位阵亡的武将，并恢复其50%的生命，每场战斗只可触发1次
	this.burn_hit_reduction = otps.burn_hit_reduction || 0	//被灼烧状态敌人攻击伤害减免

	if(otps.burn_att_change_skill)
		this.burn_att_change_skill = JSON.parse(otps.burn_att_change_skill)			//灼烧状态属性修改
	if(otps.burn_buff_change_skill)
		this.burn_buff_change_skill = JSON.parse(otps.burn_buff_change_skill)		//灼烧状态附加BUFF修改
	if(otps.burn_att_change_normal)
		this.burn_att_change_normal = JSON.parse(otps.burn_att_change_normal)			//灼烧状态属性修改
	if(otps.burn_buff_change_normal)
		this.burn_buff_change_normal = JSON.parse(otps.burn_buff_change_normal)		//灼烧状态附加BUFF修改
	this.burn_not_invincible = otps.burn_not_invincible   		//被灼烧的武将无法获得无敌和无敌吸血盾效果
	this.poison_add_forbidden = otps.poison_add_forbidden 		//中毒buff附加禁疗
	this.banAnger_add_forbidden = otps.banAnger_add_forbidden 	//禁怒buff附加禁疗

	this.first_nocontrol = otps.first_nocontrol //首回合免疫眩晕、沉默、麻痹效果
	this.first_crit = otps.first_crit			//首回合必定暴击
	if(this.first_crit)
		this.must_crit = true
	if(otps.first_buff)
		this.first_buff = JSON.parse(otps.first_buff)		//首回合附加BUFF
	this.died_use_skill = otps.died_use_skill				//死亡时释放一次技能
	if(otps.died_later_buff)
		this.died_later_buff = JSON.parse(otps.died_later_buff)	//直接伤害死亡时对击杀者释放buff
	this.maxHP_damage = otps.maxHP_damage || 0					//技能附加最大生命值真实伤害
	this.maxHP_rate = otps.maxHP_rate							//进入战斗时最大生命加成倍数
	this.maxHP_loss = otps.maxHP_loss							//每回合生命流失率
	this.damage_save = otps.damage_save							//释放技能时,上回合受到的所有伤害将100%额外追加伤害
	this.damage_save_value = 0									//累积伤害值 
	this.heal_unControl = otps.heal_unControl					//释放技能时，解除目标被控制状态
	this.heal_addAnger = otps.heal_addAnger  					//释放技能时，增加目标怒气值
	this.dispel_intensify = otps.dispel_intensify				//释放技能时，驱散目标身上所有增益效果(增伤、减伤、持续恢复)
	//=========状态=======//
	this.died = this.attInfo.maxHP && this.attInfo.hp ? false : true 	//死亡状态
	this.buffs = {}					//buff列表
	this.dizzy = false				//眩晕
	this.silence = false			//沉默
	this.disarm = false				//麻痹
	this.forbidden = false			//禁疗
	this.poison = false				//中毒
	this.burn = false				//燃烧
	this.banAnger = false			//禁怒							
	//=========属性加成=======//
	this.self_adds = {}							//自身百分比加成属性
	this.team_adds = {}							//全队百分比加成属性
	this.show_adds = {}							//总百分比加成
	if(otps.self_atk_add)
		this.self_adds["atk"] = otps.self_atk_add
	if(otps.self_maxHP_add)
		this.self_adds["maxHP"] = otps.self_maxHP_add
	if(otps.self_phyDef_add)
		this.self_adds["phyDef"] = otps.self_phyDef_add
	if(otps.self_magDef_add)
		this.self_adds["magDef"] = otps.self_magDef_add
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
			this.angerSkill.duration = this.buffDuration
	}
	this.target_minHP = otps.target_minHP		//单体输出武将的所有攻击优先攻击敌方当前血量最低的武将
	if(this.target_minHP){
		this.defaultSkill.targetType = "enemy_minHP"
		this.angerSkill.targetType = "enemy_minHP"
		if(this.kill_later_skill && this.kill_later_skill.targetType == "enemy_1"){
			this.kill_later_skill.targetType = "enemy_minHP"
		}
	}
}
model.prototype.init = function(fighting) {
	this.fighting = fighting
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
			case "curAnger":
				this.curAnger += this.show_adds[i]
			break
			default:
				this.attInfo[i] += this.show_adds[i]
		}
	}
	for(var i in this.bookAtts){
		this.attInfo[i] += this.bookAtts[i]
	}
	this.attInfo.hp = this.attInfo.maxHP
}
//战斗开始
model.prototype.begin = function() {
	if(this.maxHP_rate){
		this.attInfo.maxHP = Math.floor(this.attInfo.maxHP * this.maxHP_rate)
		this.attInfo.hp = this.attInfo.maxHP
	}
	if(this.isBoss){
		this.attInfo.hp = 999999999
	}
	if(this.surplus_health === 0){
		this.attInfo.hp = 0
		this.died = true
	}else if(this.surplus_health)
		this.attInfo.hp = Math.ceil(this.attInfo.hp * this.surplus_health)
}
//行动开始前刷新
model.prototype.before = function() {
	if(this.before_clear_debuff && this.fighting.seeded.random("判断BUFF命中率") < this.before_clear_debuff){
		for(var i in this.buffs)
			if(this.buffs[i].debuff)
				this.buffs[i].destroy("clear")
	}
	//伤害BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].refreshType == "before")
			this.buffs[i].update()
	//伤害BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].refreshType == "before_2")
			this.buffs[i].update()
}
//行动结束后刷新
model.prototype.after = function() {
	//状态BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].refreshType == "after")
			this.buffs[i].update()
	if(this.maxHP_loss > 0){
		this.onHPLoss()
	}
	this.damage_save_value = 0
}
//回合结束后刷新
model.prototype.roundOver = function() {
	//状态BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].refreshType == "roundOver")
			this.buffs[i].update()
}
//移除控制状态
model.prototype.removeControlBuff = function() {
	//状态BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].control)
			this.buffs[i].destroy("clear")
}
//驱散增益状态
model.prototype.removeIntensifyBuff = function() {
	//状态BUFF刷新
	for(var i in this.buffs)
		if(this.buffs[i].intensify)
			this.buffs[i].destroy("dispel")
}
//清除指定角色buff
model.prototype.clearReleaserBuff = function(releaser) {
	for(var i in this.buffs)
		if(this.buffs[i].debuff &&this.buffs[i].releaser == releaser)
			this.buffs[i].destroy("clear")
}
//受到伤害
model.prototype.onHit = function(attacker,info,source) {
	info.id = this.id
	info.value = Math.floor(info.value) || 1
	// if(this.died){
	// 	info.realValue = 0
	// 	return info
	// }
	//免疫
	if(this.buffs["invincibleSuper"] || this.buffs["invincible"]){
		info.invincible = true
		info.realValue = 0
		return info
	}
	//无敌吸血盾
	if(this.buffs["invincibleSuck"]){
		let healInfo = this.onHeal(this.buffs["invincibleSuck"].releaser,info,source)
		info.value = -info.value
		info.realValue = -healInfo.realValue
		info.curValue = this.attInfo.hp
		info.maxHP = this.attInfo.maxHP
		return info
	}
	if(info.miss){
		info.realValue = 0
	}else{
		if(this.buffs["shield"]){
			info.value = this.buffs["shield"].offset(info.value)
			info.shield = true
		}
		info.realValue = this.lessHP(info)
		info.curValue = this.attInfo.hp
		info.maxHP = this.attInfo.maxHP
		if(this.damage_save)
			this.damage_save_value += info.realValue
		if(attacker && info.realValue > 0)
			attacker.totalDamage += info.realValue
		if(this.died){
			info.overflow = info.value - info.realValue
			info.kill = true
			attacker.kill(this)
		}
	}
	// console.log(attacker.name + " 攻击 "+ this.name, info.value,"curHP : ",this.attInfo.hp+"/"+this.attInfo.maxHP)
	return info
}
//生命流失
model.prototype.onHPLoss = function() {
	var info = {type : "other_damage",id:this.id,"loss":true}
	info.value = Math.floor(this.maxHP_loss * this.attInfo.maxHP * this.fighting.round)
	if(info.value >= this.attInfo.hp){
		info.value = this.attInfo.hp - 1
	}
	info.realValue = this.lessHP(info)
	info.curValue = this.attInfo.hp
	info.maxHP = this.attInfo.maxHP
	fightRecord.push(info)
}
//受到治疗
model.prototype.onHeal = function(releaser,info,source) {
	info.id = this.id
	info.value = Math.floor(info.value) || 1
	if(this.forbidden){
		info.value = 0
		info.realValue = 0
	}else{
		info.value = Math.floor(info.value * (1 + this.attInfo.healAdd / 10000))
		info.realValue = this.addHP(info.value)
	}
	if(releaser && info.realValue > 0)
		releaser.totalHeal += info.realValue
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
	this.fighting.diedList.push(this)
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
	if(!this.isBoss && (this.attInfo.hp + value) > this.attInfo.maxHP){
		realValue = this.attInfo.maxHP - this.attInfo.hp
		this.attInfo.hp = this.attInfo.maxHP
	}else{
		this.attInfo.hp += value
	}
	// console.log(this.name + "被治疗" , value,realValue,"curHP : ",this.attInfo.hp+"/"+this.attInfo.maxHP)
	return realValue
}
//扣除血量
model.prototype.lessHP = function(info) {
	if(this.died){
		return 0
	}
	info.realValue = info.value
	if((this.attInfo.hp - info.value) <= 0){
		if(this.oneblood_rate && this.fighting.seeded.random("判断BUFF命中率") < this.oneblood_rate){
			info.realValue = this.attInfo.hp - 1
			this.attInfo.hp = 1
			info.oneblood = true
		}else{
			info.realValue = this.attInfo.hp
			this.onDie()
		}
	}else{
		this.attInfo.hp -= info.value
	}
	return info.realValue
}
//恢复怒气
model.prototype.addAnger = function(value,hide) {
	if(this.banAnger){
		value = 0
		fightRecord.push({type : "addAnger",realValue : value,curAnger : this.curAnger,needAnger : this.needAnger,id : this.id,hide : hide,banAnger : true})
	}else{
		value = Math.floor(value) || 1
		this.curAnger += value
		fightRecord.push({type : "addAnger",realValue : value,curAnger : this.curAnger,needAnger : this.needAnger,id : this.id,hide : hide})
	}
	return value
}
//减少怒气
model.prototype.lessAnger = function(value,hide,use) {
	if(!use && this.banLessAnger){
		return 0
	}
	value = Math.floor(value) || 1
	var realValue = value
	if((this.curAnger - value) < 0){
		realValue = this.curAnger
		this.curAnger = 0
	}else{
		this.curAnger -= value
	}
	if(realValue)
		fightRecord.push({type : "lessAnger",realValue : realValue,curAnger : this.curAnger,needAnger : this.needAnger,id : this.id,hide : hide})
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
	info.lv = this.lv
	info.star = this.star
	info.ad = this.ad
	info.name = this.name
	info.realm = this.realm
	info.atk = this.attInfo.atk
	info.maxHP = this.attInfo.maxHP
	info.hp = this.attInfo.hp
	info.curAnger = this.curAnger
	info.needAnger = this.needAnger
	info.totalDamage = this.totalDamage
	info.totalHeal = this.totalHeal
	info.heroId = this.heroId
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