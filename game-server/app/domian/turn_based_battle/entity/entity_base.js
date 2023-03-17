//战斗角色基类
var model = function(fighting,otps,talentList) {
	this.died = false  					//死亡状态
	if(!otps || !otps.id){
		this.isNaN = true
		this.died = true
	}
	this.otps = otps || {}
	this.fighting = fighting
	this.index = -1
	this.heroId = Number(this.otps.id) || 0
	this.id = 0
	this.talentList = talentList || []
	this.attInit()
}
//属性初始化
model.prototype.attInit = function() {
	//基础战斗属性
	this.index = -1 					//战斗位置
	this.belong = "" 					//所属阵营
	this.isAction = false 				//回合行动过标识
	this.onAction = false  				//回合行动中标识
	this.sex = 1 						//性别 1男 2女
	//基础属性
	this.curAnger = 50 					//初始怒气
	this.maxAnger = 100 				//最大怒气
	this.needAnger = 100  				//释放技能所需怒气
	//一级属性
	this.attInfo = {}
	this.attInfo.main_dr = 0 			//体质  影响伤免、最大生命值
	this.attInfo.main_mag = 0 			//内力  影响内功伤害、内功减免
	this.attInfo.main_phy = 0 			//筋骨  影响外功伤害、外功减免
	this.attInfo.main_hit = 0 			//身法  影响出手速度、命中、闪避
	this.attInfo.main_slay = 0 			//悟性  影响暴击伤害、格挡、破格
	//二级属性
	this.attInfo.HP = 0 				//当前生命值
	this.attInfo.maxHP = 0 				//最大生命值
	this.attInfo.atk = 0 				//攻击力
	this.attInfo.armor = 0 				//护甲
	this.attInfo.speed = 0 				//速度
	//三级属性
	this.attInfo.hit = 0 				//命中率
	this.attInfo.hitDef = 0 			//闪避率
	this.attInfo.block = 0 				//格挡率
	this.attInfo.blockDef = 0 			//破格率
	this.attInfo.crit = 0 				//暴击率
	this.attInfo.critDef = 0 			//抗暴率
	this.attInfo.slay = 0 				//暴伤加成
	this.attInfo.slayDef = 0 			//暴伤减免
	//四级属性
	this.attInfo.control = 0 			//控制率
	this.attInfo.controlDef = 0 		//免控率
	this.attInfo.amp = 0 				//伤害加成
	this.attInfo.ampDef = 0 			//伤害减免
	this.attInfo.angerAmp = 0 			//技攻增伤
	this.attInfo.angerDef = 0 			//技攻减伤
	this.attInfo.healAmp = 0 			//治疗加成
	this.attInfo.healAdd = 0 			//受疗加成
	this.attInfo.phyAmp = 0 			//外功增伤
	this.attInfo.phyDef = 0 			//外功减伤
	this.attInfo.magAmp = 0 			//内功增伤
	this.attInfo.magDef = 0 			//内功减伤
	this.attInfo.poisonAmp = 0 			//中毒增伤
	this.attInfo.poisonDef = 0 			//中毒减伤

	this.attInfo["main_dr"] = Math.floor(Math.random() * 100)
	this.attInfo["main_mag"] = Math.floor(Math.random() * 100)
	this.attInfo["main_phy"] = Math.floor(Math.random() * 100)
	this.attInfo["main_hit"] = Math.floor(Math.random() * 100)
	this.attInfo["main_slay"] = Math.floor(Math.random() * 100)
	this.attInfo.maxHP = Math.floor(10000) + 10000
	this.attInfo.hp = this.attInfo.maxHP
	this.attInfo.atk = Math.floor(1000) + 1000
	this.attInfo.armor = Math.floor(500) + 500
}
//战斗初始化
model.prototype.init = function() {
}
//个人回合开始
model.prototype.before = function() {
	this.isAction = true
	this.onAction = true
}
//个人回合结束
model.prototype.after = function() {
	this.onAction = false
}
//整体回合开始
model.prototype.roundBegin = function() {
	this.isAction = false
}
//获得怒气
model.prototype.addAnger = function(value,show) {}
//减少怒气
model.prototype.lessAnger = function(value,show) {}
//整体回合结束
model.prototype.roundOver = function() {}
//获得怒气
model.prototype.addAnger = function(value,show) {}
//减少怒气
model.prototype.lessAnger = function(value,show) {}
//获取属性
model.prototype.getTotalAtt = function(name) {
	var value = this.attInfo[name] || 0
	return value
}
//收到攻击
model.prototype.onHit = function(attacker,info) {}
//受到治疗
model.prototype.onHeal = function(attacker,info) {}
//角色死亡
model.prototype.onDie = function() {}
//恢复血量
model.prototype.addHP = function() {}
//扣除血量
model.prototype.lessHP = function() {}
//复活
model.prototype.resurgence = function(attacker,info) {}
//============================状态触发
//触发击杀
model.prototype.onKill = function() {}
//触发闪避
model.prototype.onDodge = function() {}
//触发格挡
model.prototype.onBlock = function() {}
//触发暴击
model.prototype.onCrit = function() {}

//获取战斗数据
model.prototype.getCombatData = function() {}
module.exports = model