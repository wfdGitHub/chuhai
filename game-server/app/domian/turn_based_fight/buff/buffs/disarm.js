//麻痹
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	// console.log("角色"+buff.character.id+"被麻痹!!!!!!")
	buff.debuff = true
	buff.name = "麻痹"
	buff.refreshType = "after"
	buff.character.disarm = true
	buff.clear = function() {
		// console.log(buff.character.id+"麻痹结束")
		buff.character.disarm = false
	}
	return buff
}
module.exports = model