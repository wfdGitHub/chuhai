var bearcat = require("bearcat")
var async = require("async")
var default_cfg = require("../../../../config/gameCfg/default_cfg.json")
var sdkConfig = require("../../../../config/gameCfg/sdkConfig.json")
var normalHandler = function(app) {
  this.app = app;
	this.areaManager = this.app.get("areaManager")
};
//激活礼包码
normalHandler.prototype.verifyCDKey = function(msg, session, next) {
  var self = this
  var uid = session.uid
  var areaId = session.get("areaId")
  var name = session.get("name")
  var key = msg.key
  if(typeof(key) != "string"){
    next(null,{"err":"参数错误"})
    return
  }
  self.CDKeyDao.verifyCDKey(key,uid,areaId,name,function(flag,str) {
    if(!flag){
      next(null,{flag:false,data:str})
    }else{
      var awardList = self.areaManager.areaMap[areaId].addItemStr(uid,str,1,"礼包码")
      next(null,{flag : true,awardList : awardList})
    }
  })
}
//提升官职
normalHandler.prototype.promotionOfficer = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].promotionOfficer(uid,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//获取背包
normalHandler.prototype.getBagList = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].getBagList(uid,function(data) {
    next(null,{flag : true,data : data || {}})
  })
}
//使用物品
normalHandler.prototype.useItem = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].useItem(uid,msg,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//获取playerData
normalHandler.prototype.getPlayerData = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].getPlayerDataAll(uid,function(data) {
    next(null,{flag : true,data : data})
  })
}
//在线领取挂机奖励
normalHandler.prototype.getOnhookAward = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].getOnhookAward(uid,1,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//快速挂机奖励
normalHandler.prototype.getQuickOnhookAward = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].getQuickOnhookAward(uid,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//角色进阶
normalHandler.prototype.characterAdvanced = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var characterId = msg.characterId
  this.areaManager.areaMap[areaId].characterAdvanced(uid,characterId,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//设置头像
normalHandler.prototype.changeHead = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].changeHead(uid,msg.id,function(flag,data) {
    if(flag){
        session.set("head",msg.id)
        session.push("head",function() {
          next(null,{flag : true,data : data})
        })
      }else{
        next(null,{flag : false,data : data})
      }
  })
}
//增加物品  测试功能
normalHandler.prototype.addItem = function(msg, session, next) {
  var limit = session.get("limit")
  if(limit < 20){
    next(null,{flag : false})
    return
  }
  var uid = session.uid
  var areaId = session.get("areaId")
  var itemId = msg.itemId
  var value = msg.value
  this.areaManager.areaMap[areaId].addItem({uid : uid,itemId : itemId,value : value,reason : "测试功能"},function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//增加物品str  测试功能
normalHandler.prototype.addItemStr = function(msg, session, next) {
  var limit = session.get("limit")
  if(limit < 20){
    next(null,{flag : false})
    return
  }
  var uid = session.uid
  var areaId = session.get("areaId")
  var str = msg.str
  var rate = msg.rate
  var awardList = this.areaManager.areaMap[areaId].addItemStr(uid,str,rate,"测试功能")
  next(null,{flag : true,awardList : awardList})
}
//开启宝箱  测试功能
normalHandler.prototype.openChestStr = function(msg, session, next) {
  var limit = session.get("limit")
  if(limit < 20){
    next(null,{flag : false})
    return
  }
  var uid = session.uid
  var areaId = session.get("areaId")
  var str = msg.str
  var str = this.areaManager.areaMap[areaId].openChestStr(uid,str)
  next(null,{flag : true,str : str})
}
//获取商城数据
normalHandler.prototype.getShopData = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].getShopData(uid,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//购买商城物品
normalHandler.prototype.buyShop = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var shopId = msg.shopId
  var count = msg.count
  this.areaManager.areaMap[areaId].buyShop(uid,shopId,count,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//直接购买物品
normalHandler.prototype.buyItem = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var itemId = msg.itemId
  var count = msg.count
  this.areaManager.areaMap[areaId].buyItem(uid,itemId,count,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
//连入跨服服务器
normalHandler.prototype.loginCross = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  this.areaManager.areaMap[areaId].loginCross(uid,function(flag,crossUid) {
    if(flag){
      session.set("crossUid",crossUid)
      session.push("crossUid",function() {
        next(null,{flag : true})
      })
    }else{
      next(null,{flag : false})
    }
  })
}
//同步指引进度
normalHandler.prototype.syncGuide = function(msg, session, next) {
  var uid = session.uid
  var guideInfo = msg.guideInfo
  this.playerDao.setPlayerInfo({uid : uid,key : "guideInfo",value : guideInfo})
  next()
}
//玩家改名
normalHandler.prototype.changeName = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var oriId = session.get("oriId")
  var name = msg.name
  var guid = msg.guid
  var os = msg.os
  var self = this
  if(name.indexOf(".") != -1){
    next(null,{flag:false,err:"不能包含特殊字符"})
    return
  }
  async.waterfall([
    function(cb) {
      //小七敏感词检测
      if(sdkConfig.sdk_type["value"] == "x7sy"){
        self.sdkQuery.x7syMessageDetect(guid,os,name,function(flag,message,level) {
          if(!flag || level != 1)
            cb("名称含有敏感信息")
          else
            cb()
        })
      }else{
        cb()
      }
    },
    function(cb) {
      self.redisDao.db.hexists("game:nameMap",name,function(err,data) {
        if(data){
          cb("名称已存在")
        }else{
          cb()
        }
      })
    },
    function(cb) {
      self.areaManager.areaMap[areaId].consumeItems(uid,"1000500:1",1,"玩家改名",function(flag,err) {
        if(flag){
          cb()
        }else{
          self.areaManager.areaMap[areaId].consumeItems(uid,default_cfg["changeName"]["value"],1,"改名",function(flag,err) {
            if(flag){
              cb()
            }else{
              cb("元宝不足")
            }
          })
        }
      })
    },
    function() {
      self.redisDao.db.hget("player:user:"+uid+":playerInfo","name",function(err,data) {
        self.redisDao.db.hdel("game:nameMap",data)
        self.redisDao.db.hset("game:nameMap",name,uid)
        self.playerDao.setPlayerInfo({uid : uid,key : "name",value : name})
        session.set("name",name)
        session.push("name",function() {
          next(null,{flag:true})
        })
      })
    }
  ],function(err) {
    next(null,{flag : false,err : err})
  })
}
//初始化名称性别
normalHandler.prototype.initNameAndSex = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var oriId = session.get("oriId")
  var name = msg.name
  var sex = msg.sex
  var guid = msg.guid
  var os = msg.os
  var type = msg.type
  var self = this
  if(!name || (sex !== 1 && sex !== 2)){
    next(null,{flag:false,err:"参数错误"})
    return
  }
  if(sex !== 1)
    sex = 2
  async.waterfall([
    function(cb) {
      //小七敏感词检测
      if(!type && sdkConfig.sdk_type["value"] == "x7sy"){
        self.sdkQuery.x7syMessageDetect(guid,os,name,function(flag,message,level) {
          if(!flag || level != 1)
            cb("名称含有敏感信息")
          else
            cb()
        })
      }else{
        cb()
      }
    },
    function(cb) {
      self.redisDao.db.hexists("game:nameMap",name,function(err,data) {
        if(data){
          cb("名称已存在")
        }else{
          cb()
        }
      })
    },
    function() {
      self.redisDao.db.hget("player:user:"+uid+":playerInfo","name",function(err,data) {
        self.redisDao.db.hdel("game:nameMap",data)
        self.redisDao.db.hset("game:nameMap",name,uid)
        self.playerDao.setPlayerInfo({uid : uid,key : "name",value : name})
        self.playerDao.setPlayerInfo({uid : uid,key : "sex",value : sex})
        session.set("name",name)
        session.push("name",function() {
          next(null,{flag:true})
        })
      })
    }
  ],function(err) {
    next(null,{flag : false,err : err})
  })
}
//选择初始英雄
normalHandler.prototype.chooseFirstHero = function(msg, session, next) {
  var uid = session.uid
  var index = msg.index
  var areaId = session.get("areaId")
  if(!default_cfg["choose_hero"+index]){
    next(null,{flag:false,err:"index error"+index})
    return
  }
  var self = this
  self.redisDao.db.hget("player:user:"+uid+":playerData","choose",function(err,data) {
    if(!data){
      self.redisDao.db.hset("player:user:"+uid+":playerData","choose",1)
      self.redisDao.db.hincrby("game:statistics:chooseHero",default_cfg["choose_hero"+index]["value"],1)
      self.heroDao.gainHero(areaId,uid,{id : default_cfg["choose_hero"+index]["value"]},function(flag,heroInfo) {
        self.heroDao.setFightTeam(areaId,uid,[null,heroInfo.hId,null,null,null,null],function(flag) {
          next(null,{flag:true,heroInfo:heroInfo})
        })
      })
    }else{
      next(null,{flag:false})
    }
  })
}
//开启限时活动
normalHandler.prototype.openNewLimitedTime = function(msg, session, next) {
  var limit = session.get("limit")
  if(limit < 20){
    next(null,{flag : false})
    return
  }
  var uid = session.uid
  var areaId = session.get("areaId")
  var id = msg.id
  var day = msg.day
  this.areaManager.areaMap[areaId].openNewLimitedTime(id,day)
  next(null,{flag:true})
}
//关闭限时活动
normalHandler.prototype.endNewLimitedTime = function(msg, session, next) {
  var limit = session.get("limit")
  if(limit < 20){
    next(null,{flag : false})
    return
  }
  var uid = session.uid
  var areaId = session.get("areaId")
  var id = msg.id
  this.areaManager.areaMap[areaId].endNewLimitedTime(id)
  next(null,{flag:true})
}
//获取限时活动列表
normalHandler.prototype.getLimitedTimeList = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var list = this.areaManager.areaMap[areaId].getLimitedTimeList()
  next(null,{flag:true,list:list})
}
//获取玩家基本信息
normalHandler.prototype.getPlayerBaseInfo = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var target = msg.target
  var self = this
  self.areaManager.areaMap[areaId].getPlayerBaseInfo(target,function(flag,userInfo) {
    if(flag){
    var info = {
      userInfo : userInfo
    }
    self.areaManager.areaMap[areaId].getDefendTeam(target,function(data) {
      info.team = data
      next(null,{flag:true,info:info})
    })
    }else{
      next(null,{flag:false})
    }
  })
}
//GM商城购买
normalHandler.prototype.buyGMShop = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var shopId = msg.shopId
  var count = msg.count
  this.areaManager.areaMap[areaId].buyGMShop(uid,shopId,count,function(flag,data) {
    next(null,{flag : flag,data : data})
  })
}
normalHandler.prototype.testStandardTeam = function(msg, session, next) {
  var uid = session.uid
  var areaId = session.get("areaId")
  var list = msg.list
  var dl = msg.dl
  var lv = msg.lv
  var team = this.areaManager.areaMap[areaId].standardTeam(uid,list,dl,lv)
  next(null,{flag:true,team:team})
}
module.exports = function(app) {
  return bearcat.getBean({
  	id : "normalHandler",
  	func : normalHandler,
  	args : [{
  		name : "app",
  		value : app
  	}],
    props : [{
      name : "playerDao",
      ref : "playerDao"
    },{
      name : "redisDao",
      ref : "redisDao"
    },{
      name : "CDKeyDao",
      ref : "CDKeyDao"
    },{
      name : "sdkQuery",
      ref : "sdkQuery"
    }]
  })
};