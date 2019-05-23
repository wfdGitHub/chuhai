var bearcat = require("bearcat")
var contextPath = require.resolve('./context.json');
bearcat.createApp([contextPath])
bearcat.start(function() {})
var atkTeamInfo = [{
    name : "战士",    //名称
    spriteType : "hero1",  //类型
    maxHP : 1000, //最大血量
    atk : 12,        //攻击力
    def : 2,        //防御力
    dodgeRate : 0,  //闪避
    atkSpeed : 2, //攻速 每几秒攻击一次
    specialSkills : [2] //技能列表
},{
    name : "游侠",    //名称
    spriteType : "hero2",  //类型
    maxHP : 600,    //最大血量
    atk : 10,        //攻击力
    def : 0,        //防御力
    dodgeRate : 0,  //闪避
    atkSpeed : 1.2, //攻速 每几秒攻击一次
    specialSkills : [3] //技能列表
},{
    name : "法师",    //名称
    spriteType : "hero3",  //类型
    maxHP : 500, //最大血量
    atk : 30,        //攻击力
    def : 0,        //防御力
    dodgeRate : 0,  //闪避
    atkSpeed : 3, //攻速 每几秒攻击一次
    specialSkills : [4] //技能列表
}]
var defTeamInfo = [{
    name : "BOSS",  //名称
    spriteType : "mob1",  //类型
    maxHP : 1000,   //最大血量
    atk : 80,       //攻击力
    def : 1,        //防御力
    atkSpeed : 2.5  //攻速 每几秒攻击一次
}]
var fightContorl = bearcat.getBean("fightContorl")
fightContorl.fighting(atkTeamInfo,defTeamInfo)