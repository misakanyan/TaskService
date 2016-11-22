var SceneService = (function () {
    function SceneService() {
        this.observerList = [];
        this.taskList = [];
        this.monsterList = [];
    }
    var d = __define,c=SceneService,p=c.prototype;
    SceneService.getInstance = function () {
        if (SceneService.instance == null) {
            SceneService.instance = new SceneService;
        }
        return SceneService.instance;
    };
    p.init = function () {
        var data = RES.getRes("gameconfig_json");
        for (var i = 0; i < data.monsters.length; i++) {
            this.monsterList.push(new Monster(data.monsters[i].image, data.monsters[i].id, data.monsters[i].linkTaskId));
            var task = TaskService.getInstance().taskList[data.monsters[i].linkTaskId];
            this.taskList.push(task);
        }
        //this.monsterList.push(new Monster("monster_jpg","0","1"));
        //this.taskList.push(TaskService.getInstance().taskList[1]); //临时往里面塞一个任务触发用
        for (var i = 0; i < this.monsterList.length; i++) {
            this.observerList.push(this.monsterList[i]);
        }
        this.observerList.push(new KillMonsterTaskCondition());
    };
    p.wakeUpMonster = function (id) {
        for (var i = 0; i < this.monsterList.length; i++) {
            if (this.monsterList[i].id == id) {
                this.monsterList[i].onAwake();
            }
        }
    };
    p.killMonster = function (id) {
        //console.log(id);
        for (var i = 0; i < this.monsterList.length; i++) {
            if (this.monsterList[i].id == id) {
                this.monsterList[i].onSleep();
            }
        }
    };
    p.addObserver = function (o) {
        this.observerList.push(o);
    };
    p.notify = function (task) {
        for (var i = 0; i < SceneService.getInstance().observerList.length; i++) {
            this.observerList[i].onChange(task);
        }
    };
    p.accept = function (id) {
        //console.log("accept monster:"+id);
        for (var i = 0; i < this.taskList.length; i++) {
            if (this.taskList[i].id == id) {
                console.log("accept success");
                var task = this.taskList[i];
                this.notify(task);
                break;
            }
        }
        //this.notify(this.taskList[0]);  //这个是临时的任务
    };
    p.submit = function (id) {
    };
    return SceneService;
}());
egret.registerClass(SceneService,'SceneService');
var Monster = (function (_super) {
    __extends(Monster, _super);
    function Monster(image, id, taskId) {
        _super.call(this);
        this._image = new egret.Bitmap;
        this._id = id;
        this._linkTaskId = taskId;
        this._image.texture = RES.getRes(image);
        this.x = 200;
        this.y = 350;
        this._image.touchEnabled = true;
        //this.addChild(this._image);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClick, this);
    }
    var d = __define,c=Monster,p=c.prototype;
    d(p, "id"
        ,function () {
            return this._id;
        }
    );
    d(p, "linkTaskId"
        ,function () {
            return this._linkTaskId;
        }
    );
    p.onClick = function () {
        SceneService.getInstance().accept(this._linkTaskId);
    };
    p.onAwake = function () {
        this.addChild(this._image);
    };
    p.onSleep = function () {
        this.removeChild(this._image);
    };
    p.onChange = function (task) {
    };
    return Monster;
}(egret.DisplayObjectContainer));
egret.registerClass(Monster,'Monster',["SceneObserver"]);
//# sourceMappingURL=Scene.js.map