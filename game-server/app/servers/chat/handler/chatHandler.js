var bearcat = require("bearcat")
var chatHandler = function(app) {
	this.app = app
	this.chat = this.app.get("chat")
}
//加入聊天室
chatHandler.prototype.joinChatRoom = function(msg, session, next) {
	var uid = session.uid
	var sid = session.frontendId
	var roomName = msg.roomName
	if(!roomName || typeof("roomName") !== "string" || roomName.length > 10){
		console.log(typeof("roomName"),roomName.length)
		next(null,{flag : false,err : "roomName error "+roomName})
		return
	}
	this.chat.joinChatRoom(uid,sid,roomName,function(flag,msg){
		next(null,{flag : flag,msg : msg})
	})
}
//离开聊天室
chatHandler.prototype.leaveChatRoom = function(msg, session, next) {
	var uid = session.uid
	var sid = session.frontendId
	var roomName = msg.roomName
	if(!roomName || typeof("roomName") !== "string" || roomName.length > 10){
		next(null,{flag : false,err : "roomName error "+roomName})
		return
	}
	this.chat.leaveChatRoom(uid,sid,roomName,function(flag,msg){
		next(null,{flag : flag,msg : msg})
	})
}
//发送聊天消息
chatHandler.prototype.say = function(msg, session, next) {
	var roomName = msg.roomName
	if(!roomName || typeof("roomName") !== "string" || roomName.length > 10){
		next(null,{flag : false,err : "roomName error "+roomName})
		return
	}
	var uid = session.uid
	var areaId = session.get("oriId")
	var gname = msg.gname
	var type = msg.type
	var arg = msg.arg
	var text = msg.text
	var guid = msg.guid
	var os = msg.os
	// if(text.indexOf("分享战报fightId") != 0 && text.indexOf("分享阵容teamId") != 0 && session.get("real_rmb") < 3000){
	// 	console.error("say real_rmb error "+session.uid+"  "+session.get("real_rmb"))
	// 	next(null,{flag : false})
	// 	return
	// }
	var name = session.get("name")
	var head = session.get("head")
	var title = session.get("title")
	var frame = session.get("frame")
	var talker = {
		uid : uid,
		name : name,
		head : head,
		title : title,
		frame : frame,
		areaId : areaId
	}
	this.chat.say(talker,gname,roomName,type,arg,text,guid,os)
	this.cacheDao.saveChat({messagetype:"chat",uid:uid,nickname:name,type:type,arg:arg,text:text,roomName:roomName})
	this.mysqlDao.addChatRecord(uid,name,text,roomName)
	next(null)
}
module.exports = function(app) {
	return bearcat.getBean({
		id : "chatHandler",
		func : chatHandler,
		args : [{
			name : "app",
			value : app
		}],
		props : [{
			name : "mysqlDao",
			ref : "mysqlDao"
		},{
			name : "cacheDao",
			ref : "cacheDao"
		}]
	})
}