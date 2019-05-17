var bearcat = require("bearcat")
var character = function(otps) {
	console.log("otps",otps)
	this.name = otps.name || "noname"	//名称
	this.level = otps.level || 1		//等级
	this.maxHP = otps.maxHP || 100		//最大血量
	this.hp = this.maxHP				//当前血量
	this.atk = otps.atk	|| 10			//攻击力
	this.def = otps.def	|| 0			//防御力
	this.atkSpeed = otps.atkSpeed || 1  //攻速 每几秒攻击一次
	this.relSpeed = otps.relSpeed || 1  //出手速度,越大出手越快
	this.crit = otps.crit || 0		  	//暴击值
	this.critDef = otps.critDef || 0	//抗暴值
	this.hitRate = 0					//命中率
	this.dodgeRate = 0					//闪避率
	this.fightSkills = {} 				//技能列表
	this.curSkill = 1 					//默认攻击
	this.target = false					//当前目标
	this.died = false 					//死亡标记
}
character.prototype.setEnemyTeam = function(enemyTeam) {
	this.enemyTeam = enemyTeam
}
//添加技能列表
character.prototype.addFightSkill = function(skill) {
	this.fightSkills[skill.skillId] = skill
}
//攻击
character.prototype.useSkill = function(skillId) {
	var result = this.fightSkills[skillId].use()
	console.log(this.name + " 攻击 ",result)
}
//被攻击
character.prototype.hit = function(attacker, damageInfo) {
  	this.reduceHp(damageInfo.damage);
	console.log(this.name + " 被攻击 ","-"+damageInfo.damage,"当前血量 : ",this.hp)
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
module.exports = {
	id : "character",
	func : character,
	args : [{
		name : "otps",
		type : "Object" 
	}],
	lazy : true,
	scope : "prototype"
}