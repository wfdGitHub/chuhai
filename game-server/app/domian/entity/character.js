var bearcat = require("bearcat")
var character = function(otps) {
	this.name = otps.name || "noname"	//名称
	this.level = otps.level || 1		//等级
	this.maxHP = otps.maxHP || 100		//最大血量
	this.hp = this.maxHP				//当前血量
	this.atk = otps.atk	|| 10			//攻击力
	this.def = otps.def	|| 0			//防御力
	this.atkSpeed = otps.atkSpeed || 1  //攻速 每几秒攻击一次
	this.crit = otps.crit || 0		  	//暴击值
	this.critDef = otps.critDef || 0	//抗暴值
	this.hitRate = 0					//命中率
	this.dodgeRate = 0					//闪避率
	this.fightSkills = {}				//技能列表
	this.buffs = {}						//buff列表
	this.defaultSkill = false 			//默认攻击
	this.target = false					//当前目标
	this.died = false 					//死亡标记
	this.frozen = false					//冰冻标识  冰冻时技能CD停止
	this.dizzy = false					//眩晕标识  眩晕时不能行动
}
character.prototype.setArg = function(enemyTeam,fighting) {
	this.enemyTeam = enemyTeam
	this.fighting = fighting
}
//添加技能列表
character.prototype.addFightSkill = function(skill) {
	this.fightSkills[skill.skillId] = skill
}
//设置默认攻击技能
character.prototype.setDefaultSkill = function(skill) {
    if(skill){
    	skill.defaultSkill = true
    	this.fightSkills[skill.skillId] = skill
        this.defaultSkill = skill
    }
}
//使用技能
character.prototype.useSkill = function(skillId) {
	if(this.fightSkills[skillId]){
		this.fightSkills[skillId].use()
	}else{
		new Error("技能不存在 : "+skillId)
	}
}
//被攻击
character.prototype.hit = function(attacker, damageInfo) {
  	this.reduceHp(damageInfo.damage);
	console.log(attacker.name + " 使用 "+damageInfo.skill.name+" 攻击 "+this.name,"-"+damageInfo.damage," 剩余血量 : ",this.hp)
}
//生命值减少
character.prototype.reduceHp = function(damageValue) {
  this.hp -= damageValue;
  if (this.hp <= 0) {
    this.died = true;
    this.afterDied(this.name + " is died");
  }
}
character.prototype.afterDied = function() {
	console.log(this.name +"已死亡")
}
//获取总攻击值
character.prototype.getTotalAttack = function() {
	return this.atk
}
//获取总防御值
character.prototype.getTotalDefence = function() {
	return this.def
}
character.prototype.update = function(stepper) {
	for(var i in this.buffs){
		this.buffs[i].update(stepper)
	}
	if(!this.frozen){
		for(var skillId in this.fightSkills){
			this.fightSkills[skillId].updateTime(stepper)
		}
	}
	if(!this.dizzy && !this.frozen){
		if(this.defaultSkill && this.defaultSkill.state){
			this.defaultSkill.use()
		}
	}
}
character.prototype.addBuff = function(otps) {
	var buffId = otps.buffId
	if(this.buffs[buffId]){
		this.buffs[buffId].overlay(otps)
		console.log("刷新buff",this.buffs[buffId].name)
	}else{
		var buff = this.buffFactory.getBuff(this,otps)
		if(buff){
			buff.init()
			this.buffs[buffId] = buff
			console.log("新buff",buff.name)
		}else{
			console.log("buff 不存在")
		}
	}
}
character.prototype.removeBuff = function(buffId) {
	console.log("removeBuff ",buffId)
	if(this.buffs[buffId]){
		delete this.buffs[buffId]
	}
	console.log("removeBuff ",this.buffs)
}
module.exports = {
	id : "character",
	func : character,
	args : [{
		name : "otps",
		type : "Object" 
	}],
	props : [{
		name : "buffFactory",
		ref : "buffFactory" 
	}],
	lazy : true,
	scope : "prototype"
}