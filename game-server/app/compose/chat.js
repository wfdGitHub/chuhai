//聊天服务器组件
var sdkConfig = require("../../config/gameCfg/sdkConfig.json")
var chat = function() {
	this.name = "chat"
	this.rooms = {}				//聊天室群组
	this.userMap = {}			//玩家所在聊天室
	this.records = {}			//聊天记录
}
//初始化
chat.prototype.init = function(app) {
	this.app = app
	this.channelService = this.app.get('channelService')
}
//清空聊天数据
chat.prototype.clearChatRecord = function() {
	for(var roomName in this.records)
		this.records[roomName] = []
}
//发送聊天消息
chat.prototype.say = function(talker,gname,roomName,type,arg,text,guid,os) {
	var self = this
	if(sdkConfig.sdk_type["value"] == "x7sy"){
		self.sdkQuery.x7syMessageDetect(guid,os,text,function(flag,message,level) {
			if(flag)
				self.finishSay(talker,gname,roomName,type,arg,message)
		})
	}else{
		self.finishSay(talker,gname,roomName,type,arg,text)
	}
}
chat.prototype.finishSay = function(talker,gname,roomName,type,arg,text) {
	if(this.rooms[roomName] && this.rooms[roomName].getMember(talker.uid)){
		var notify = {
			roomName : roomName,
			talker : talker,
			gname : gname,
			type : type,
			arg : arg,
			text : text,
			time : Date.now()
		}
		this.rooms[roomName].pushMessage("onChat",notify)
		this.records[roomName].push(notify)
		if(this.records[roomName].length > 20){
			this.records[roomName].shift()
		}
	}
}
//玩家加入聊天室
chat.prototype.joinChatRoom = function(uid,sid,roomName,cb) {
	// console.log("joinChatRoom",uid,sid,roomName)
	if(this.userMap[uid] && this.userMap[uid][roomName]){
		cb(false,"已加入聊天室")
		return
	}
	if(!this.rooms[roomName]){
		this.rooms[roomName] = this.channelService.createChannel(roomName)
		this.records[roomName] = []
	}
	this.rooms[roomName].add(uid,sid)
	if(!this.userMap[uid]){
		this.userMap[uid] = {}
	}
	this.userMap[uid][roomName] = sid
	if(cb)
		cb(true,this.records[roomName])
}
//玩家离开聊天室
chat.prototype.leaveChatRoom = function(uid,sid,roomName,cb) {
	// console.log("退出聊天室",roomName)
	if(this.userMap[uid] && this.userMap[uid][roomName] && this.rooms[roomName]){
		this.rooms[roomName].leave(uid,sid)
		delete this.userMap[uid][roomName]
		if(cb)
			cb(true)
	}else{
		if(cb)
			cb(false,"未加入聊天室")
	}
}

//玩家离线
chat.prototype.userLeave = function(uid,sid) {
	if(this.userMap[uid]){
		for(var roomName in this.userMap[uid]){
			if(this.userMap[uid][roomName] === sid){
				this.leaveChatRoom(uid,sid,roomName)
			}
		}
	}
}

module.exports = {
	id : "chat",
	func : chat,
	props : [{
		name : "sdkQuery",
		ref : "sdkQuery"
	}]
}