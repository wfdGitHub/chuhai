//SDK获取数据模块
var async = require("async")
var model = function() {
	var self = this
	var posts = {}
	var local = {}
	this.init = function (server,serverManager) {
		this.serverManager = serverManager
		for(var key in posts){
			console.log("注册",key)
			server.post(key,posts[key])
		}
	}

	// Response字段	类型	必选	说明
	// bizResp	String	是	响应参数，值为每个接口对应响应参数的JSON字符串
	// apiMethod	String	是	接口名称
	// respTime	String	是	响应时间，格式使用ISO8601规范，示例：2023-03-09T14:41:19+0800
	// appkey	String	是	游戏appkey
	// gameType	String	是	游戏端类型，网游为client H5游戏为 h5
	// signature	String	是	响应签名（签名方式参见下文）
	// osType	String	否	系统类型，ios或android
	//获取角色信息
	posts["/x7sy_roleQuery"] = function(req,res) {
		var body = req.body
		var data = JSON.parse(body.bizParams)
		console.log(body)
		var info = {
			bizResp : {
				respCode : "SUCCESS",
				respMsg : "SUCCESS",
				role : {},
				guidRoles : []
			},
			apiMethod : body.apiMethod,
			respTime : body.reqTime,
			appkey : body.appkey,
			gameType : body.gameType,
			signature : body.signature,
			osType : body.osType
		}
		console.log("开始获取角色数据")
		if(data.roleId){
			console.log("roleId存在",data.roleId)
			self.redisDao.db.hmget("player:user:"+data.roleId+":playerInfo",["accId","areaId"],function(err,list) {
				console.log("111",list)
				self.redisDao.db.hget("acc:user:"+list[0]+":base","unionid",function(err,unionid) {
					console.log("222",unionid)
					self.getx7syRole(list[0],list[1],function(flag,roleData) {
						console.log("333",roleData)
						if(!flag){
							info.bizResp.respCode = "FAILD"
							info.bizResp.respMsg = roleData
						}else{
							info.bizResp.role = roleData
						}
						res.send(info)
					})
				})
			})
		}else if(data.guids){
			console.log("guids",data.guids)
			self.getx7syRoleList(data.guids,data.serverId,function(roles) {
				console.log("roles",roles)
				info.bizResp.guidRoles = roles
				res.send(info)
			})
		}else{
			console.log("参数错误")
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