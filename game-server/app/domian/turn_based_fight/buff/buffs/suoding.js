//锁定BUFF
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	// console.log("角色"+buff.character.id+"被锁定!!!!!!")
	buff.debuff = true
	buff.name = "锁定"
    buff.refreshType = "after"
	return buff
}
module.exports = model