//SDK获取数据模块
var async = require("async")
var model = function() {
	var self
	var posts = {}
	var local = {}
	this.init = function (server,serverManager) {
		self = serverManager
		for(var key in posts){
			console.log("注册",key)
			server.post(key,posts[key])
		}
	}
	//获取角色信息
	posts["/x7sy_roleQuery"] = function(req,res) {
		var data = req.body.bizParams
		console.log(data)
		var info = {
			respCode : "SUCCESS",
			role : {},
			guidRoles : []
		}
		if(data.roleId){
			self.redisDao.db.hmget("player:user:"+data.roleId+":playerInfo",["accId","areaId"],function(err,list) {
				self.redisDao.db.hget("acc:user:"+list[0]+":base","unionid",function(err,unionid) {
					self.getx7syRole(list[0],list[1],function(flag,roleData) {
						if(!flag){
							info.respCode = "FAILD"
							info.respMsg = roleData
						}else
							info.role = roleData
						res.send(info)
					})
				})
			})
		}else if(data.guids){
			self.getx7syRoleList(data.guids,data.serverId,function(roles) {
				info.guidRoles = roles
				res.send(info)
			})
		}else{
			res.send(info)
		}
	}
}
//批量获取角色信息
model.prototype.getx7syRoleList = async function(guids,serverId,cb) {
	var self = this
	var list = []
	for(let i = 0;i < guids.length;i++){
		if(serverId){
			list.push({"unionid" : guids[i],"serverId":serverId})
		}else{
			list = await list.concat(self.getx7syServerAwait(guids[i]))
		}
	}
	var roles = []
	for(let i = 0;i < list.length;i++){
		roles[i] = await self.getx7syRoleAwait(list[i].unionid,list[i].serverId)
	}
	cb(roles)
}
//异步获取服务器列表
model.prototype.getx7syServerAwait = function(unionid) {
	var self = this
	return new Promise(function(resolve) {
		self.redisDao.db.hget("acc:accMap:unionid",unionid,function(err,accId) {
			self.redisDao.db.hgetall("acc:user:"+accId+":areaMap",function(err,data) {
				var list = []
				for(var i in data){
					list.push({"unionid" : unionid,"serverId":i})
				}
				resolve(list)
			})
		})
	})
}
//异步获取角色数据
model.prototype.getx7syRoleAwait = function(unionid,serverId) {
	var self = this
	return new Promise(function(resolve) {
		self.getx7syRole(unionid,serverId,function(flag,roleData) {
			resolve(flag,roleData)
		})
	})
}
// Role字段	类型 (长度)	必选	说明
// roleId	String (64)	是	游戏角色ID
// guid	String (64)	是	小7小号ID
// roleName	String (100)	是	角色名称
// serverId	String (64)	是	角色所属区服ID
// serverName	String (64)	是	角色所属区服名称
// roleLevel	String (100)	是	角色等级， 示例：100，无此属性可留空
// roleCE	String (100)	是	角色战力，示例：20000，无此属性可留空
// roleStage	String (100)	是	角色关卡，示例：2-3，无此属性可留空
// roleRechargeAmount	Float (10,2)	是	角色总充值，精度为小数点后2位，无此属性可留空
// roleGuild	String (100)	否	角色所属公会，无此属性可不传
model.prototype.getx7syRole = function(unionid,serverId,cb) {
	var self = this
	var role = {}
	async.waterfall([
		function(next) {
			role.guid = unionid
			self.redisDao.db.hget("acc:accMap:unionid","unionid",function(err,data) {
				if(!data){
					next("账号不存在")
					return
				}
				role.accId = data
				next()
			})
		},
		function(next) {
			//获取角色ID
			self.redisDao.db.hget("acc:user:"+role.accId+":areaMap",serverId,function(err,data) {
				if(!data){
					next("角色不存在")
					return
				}
				role.roleId = data
				next()
			})
		},
		function(next) {
			//获取基础数据
			self.redisDao.db.hgetall("player:user:"+role.roleId+":playerInfo",function(err,userInfo) {
				console.log(userInfo)
				if(err || !userInfo){
					next("角色不存在")
				}else{
					role.roleName = userInfo.name
					role.serverId = userInfo.areaId
					role.serverName = userInfo.areaId+"服"
					role.roleLevel = userInfo.level
					role.roleCE = userInfo.CE
					role.roleRechargeAmount = Number((Number(userInfo.real_rmb)/100).toFixed(2))
					role.roleGuild = userInfo.gname
					next()
				}
			})
		},
		function(next) {
			//获取关卡
			self.redisDao.db.hget("player:user:"+role.roleId+":playerData","boss",function(err,boss) {
				role.roleStage = Number(boss) || 0
				cb(true,role)
			})
		}
	],function(err) {
		cb(false,err)
	})
}
module.exports = {
	id : "sdkQuery",
	func : model,
	scope : "prototype",
	props : [{
		name : "redisDao",
		ref : "redisDao"
	},{
		name : "payDao",
		ref : "payDao"
	}]
}