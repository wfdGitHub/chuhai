var characterFun = require("./character.js")
var attackSkill = require("../fight/attackSkill.js")
var mob = function(otps) {
  characterFun.call(this,otps)
  this.characterType = "mob"
  //注册事件
  //增加普攻技能
  var skill =  new attackSkill({skillId : 0},this)
  this.setDefaultSkill(skill)
  if(otps.specialSkills){
    var self = this
    otps.specialSkills.forEach(function(skillId) {
      var specialSkill =  new attackSkill({skillId : skillId},self)
      self.addFightSkill(specialSkill)
    })
  }
}
mob.prototype = characterFun.prototype
module.exports = mob