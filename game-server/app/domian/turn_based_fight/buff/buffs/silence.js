//沉默
var buffBasic = require("../buffBasic.js")
var model = function(releaser,character,otps) {
	var buff = new buffBasic(releaser,character,otps)
	// console.log("角色"+buff.character.id+"被沉默!!!!!!")
	buff.clear = function() {
		// console.log(buff.character.id+"沉默结束")
	}
	return buff
}
module.exports = model