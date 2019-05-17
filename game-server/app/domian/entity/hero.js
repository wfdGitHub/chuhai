var bearcat = require("bearcat")
var hero = function(otps) {
	this.heroId = otps.id			//ID
	var character = bearcat.getFunction('character');
  	character.call(this,otps);
  	//增加普攻技能
  	var skill = bearcat.getBean("attackSkill",{skillId : 1001,mul : 1,fixed : 0,skillCD : this.atkSpeed,targetType : 1},this)
  	this.addFightSkill(skill)
}
module.exports = {
	id : "hero",
	func : hero,
	parent : "character",
	args : [{
		name : "otps",
		type : "Object"
	}],
	lazy : true,
	scope : "prototype"
}