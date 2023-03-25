//BUFF作用基类
var model = function(fighting,character,buffId,attKey,max_count) {
	this.fighting = fighting
	this.buffId = buffId
	this.list = []
	this.character = character
	this.max_count = max_count || 1 	//最大层数
	this.init()
}
//BUFF初始化
model.prototype.init = function() {}
//新增一层BUFF
model.prototype.addBuff = function(attacker,buff) {
	if(!buff)
		return
	if(this.list.length < this.max_count){
		this.list.push({attacker:attacker,buff : buff,duration : buff.duration})
		this.buffOtps(attacker,this.list[this.list.length - 1])
		this.fighting.fightRecord.push({type : "buffAdd",id : this.character.id,bId : this.buffId,num:this.list.length})
	}
}
//移除一层BUFF
model.prototype.delBuff = function() {
	this.list.shift()
	if(this.list.length <= 0)
		this.destroy()
}
//BUFF每回合更新
model.prototype.update = function() {
	this.domain()
	var num = this.list.length
	for(var i = 0;i < this.list.length;i++){
		this.list[i].duration--
		if(this.list[i].duration <= 0){
			this.list.splice(i,1)
			i--
		}
	}
	if(this.list.length <= 0){
		this.destroy()
	}else if(num != this.list.length){
		this.fighting.fightRecord.push({type : "buffNum",id : this.character.id,bId : this.buffId,num:this.list.length})
	}
}
//BUFF消失
model.prototype.destroy = function() {
	this.fighting.fightRecord.push({type : "buffDel",id : this.character.id,bId : this.buffId})
	this.character.removeBuff(this.buffId)
	this.bufflLater()
}
//=========================BUFF效果
//新增BUFF后参数处理
model.prototype.buffOtps = function(attacker,buff) {}
//BUFF功能实现
model.prototype.domain = function() {}
//buff结算后
model.prototype.bufflLater = function() {}
//获取加成属性
model.prototype.getAttInfo = function(name) { return 0}
module.exports = model