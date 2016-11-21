var NpcTalkTaskCondition = (function () {
    function NpcTalkTaskCondition() {
    }
    var d = __define,c=NpcTalkTaskCondition,p=c.prototype;
    NpcTalkTaskCondition.getInstance = function () {
        if (NpcTalkTaskCondition.instance == null) {
            NpcTalkTaskCondition.instance = new NpcTalkTaskCondition;
        }
        return NpcTalkTaskCondition.instance;
    };
    p.onAccept = function (task) {
        task.current++;
        NPCManager.getInstance().changeDialog();
        task.checkStatus();
    };
    p.onSubmit = function () {
    };
    return NpcTalkTaskCondition;
}());
egret.registerClass(NpcTalkTaskCondition,'NpcTalkTaskCondition',["TaskCondition"]);
var KillMonsterTaskCondition = (function () {
    function KillMonsterTaskCondition() {
    }
    var d = __define,c=KillMonsterTaskCondition,p=c.prototype;
    KillMonsterTaskCondition.getInstance = function () {
        if (KillMonsterTaskCondition.instance == null) {
            KillMonsterTaskCondition.instance = new KillMonsterTaskCondition;
        }
        return KillMonsterTaskCondition.instance;
    };
    p.onAccept = function (task) {
        task.current++;
        task.killMonsterCheckStatus();
    };
    p.onSubmit = function () {
    };
    p.onChange = function (task) {
        this.onAccept(task);
    };
    return KillMonsterTaskCondition;
}());
egret.registerClass(KillMonsterTaskCondition,'KillMonsterTaskCondition',["TaskCondition","SceneObserver"]);
var Task = (function () {
    function Task(id, name, status, desc, fromNpcId, toNpcId, condition, current, total) {
        this.current = 0;
        this.total = -1;
        this._id = id;
        this._name = name;
        this._status = status;
        this._desc = desc;
        this.fromNpcId = fromNpcId;
        this.toNpcId = toNpcId;
        this.condition = condition;
        this.current = current;
        this.total = total;
    }
    var d = __define,c=Task,p=c.prototype;
    d(p, "id"
        ,function () {
            return this._id;
        }
    );
    d(p, "name"
        ,function () {
            return this._name;
        }
    );
    d(p, "status"
        ,function () {
            return this._status;
        }
        ,function (status) {
            this._status = status;
        }
    );
    d(p, "desc"
        ,function () {
            return this._desc;
        }
    );
    p.onAccept = function () {
        this.condition.onAccept(this);
    };
    p.checkStatus = function () {
        //if(this.current > this.total){
        //    console.warn();
        //}
        //console.log("current: " + this.current);
        if (this._status == TaskStatus.DURING &&
            this.current >= this.total + 1) {
            this._status = TaskStatus.CAN_SUBMIT;
            //console.log(this._status);
            TaskService.getInstance().submit(this._id);
            TaskService.getInstance().enforceAccept("1"); //临时代码 用于启动下一个任务
            SceneService.getInstance().wakeUpMonster("0"); //临时代码 用于唤醒怪物
            NPCManager.getInstance().closeDialog();
            console.log("submitted");
        }
    };
    p.killMonsterCheckStatus = function () {
        if (this._status == TaskStatus.DURING &&
            this.current >= this.total + 1) {
            this._status = TaskStatus.CAN_SUBMIT;
            //console.log(this._status);
            TaskService.getInstance().submit(this._id);
            SceneService.getInstance().killMonster("0"); //临时代码 用于清除怪物
            console.log("submitted");
        }
    };
    return Task;
}());
egret.registerClass(Task,'Task',["TaskConditionContext"]);
var TaskService = (function () {
    function TaskService() {
        this.observerList = [];
        this.taskList = [];
    }
    var d = __define,c=TaskService,p=c.prototype;
    TaskService.getInstance = function () {
        if (TaskService.instance == null) {
            TaskService.instance = new TaskService;
        }
        return TaskService.instance;
    };
    p.init = function () {
        this.initTask();
        this.initObserver();
    };
    p.initTask = function () {
        var data = RES.getRes("gameconfig_json");
        for (var i = 0; i < data.tasks.length; i++) {
            var taskType = data.tasks[i].type == "dialog" ? NpcTalkTaskCondition.getInstance() : KillMonsterTaskCondition.getInstance();
            var task = new Task(data.tasks[i].id, data.tasks[i].name, data.tasks[i].status, data.tasks[i].desc, data.tasks[i].fromNpcId, data.tasks[i].toNpcId, taskType, 
            //NpcTalkTaskCondition.getInstance(),
            data.tasks[i].current, data.tasks[i].total);
            this.taskList.push(task);
        }
    };
    p.initObserver = function () {
        NPCManager.getInstance().init();
        for (var i = 0; i < NPCManager.getInstance().NPCList.length; i++) {
            this.observerList.push(NPCManager.getInstance().NPCList[i]);
        }
    };
    p.addObserver = function (o) {
        this.observerList.push(o);
    };
    p.notify = function (task) {
        for (var i = 0; i < TaskService.getInstance().observerList.length; i++) {
            this.observerList[i].onChange(task);
        }
    };
    p.enforceAccept = function (id) {
        var task = this.taskList[id];
        if (task.status == TaskStatus.UNACCEPTABLE) {
            task.status = TaskStatus.DURING;
            task.onAccept();
            console.log('enforce accept:' + id);
            console.log("enforce accept status: " + this.taskList[id]._status);
        }
        this.notify(task);
    };
    p.accept = function (id) {
        if (!id) {
            return ErrorCode.MISSING_TASK;
        }
        //console.log(this.taskList[id]);
        var task = this.taskList[id];
        if (!task) {
            return ErrorCode.MISSING_TASK;
        }
        //console.log(task.status);
        //console.log(TaskStatus.DURING);
        if (task.status == TaskStatus.ACCEPTABLE) {
            task.status = TaskStatus.DURING;
            task.onAccept();
            console.log('accept:' + id);
            console.log("accept status: " + this.taskList[id]._status);
        }
        this.notify(task);
    };
    p.complete = function (id) {
        if (!id) {
            return ErrorCode.MISSING_TASK;
        }
        var task = this.taskList[id];
        if (!task) {
            return ErrorCode.MISSING_TASK;
        }
        if (task.status == TaskStatus.DURING) {
            task.status = TaskStatus.CAN_SUBMIT;
            console.log('complete:' + id);
        }
        this.notify(task);
    };
    p.submit = function (id) {
        if (!id) {
            return ErrorCode.MISSING_TASK;
        }
        var task = this.taskList[id];
        if (!task) {
            return ErrorCode.MISSING_TASK;
        }
        //console.log('submit task:' + id);
        if (task.status == TaskStatus.CAN_SUBMIT) {
            task.status = TaskStatus.SUBMITTED;
            console.log('submit:' + id);
            console.log("submit status: " + this.taskList[id]._status);
        }
        this.notify(task);
    };
    p.getTaskByCustomRole = function (rule) {
        var task = [];
        var npcId = rule();
        for (var i = 0; i < this.taskList.length; i++) {
            if (this.taskList[i].fromNpcId == npcId || this.taskList[i].toNpcId == npcId) {
                task.push(this.taskList[i]);
            }
        }
        return task;
    };
    return TaskService;
}());
egret.registerClass(TaskService,'TaskService');
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["SUCCESS"] = 0] = "SUCCESS";
    ErrorCode[ErrorCode["MISSING_TASK"] = 1] = "MISSING_TASK";
})(ErrorCode || (ErrorCode = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["UNACCEPTABLE"] = 0] = "UNACCEPTABLE";
    TaskStatus[TaskStatus["ACCEPTABLE"] = 1] = "ACCEPTABLE";
    TaskStatus[TaskStatus["DURING"] = 2] = "DURING";
    TaskStatus[TaskStatus["CAN_SUBMIT"] = 3] = "CAN_SUBMIT";
    TaskStatus[TaskStatus["SUBMITTED"] = 4] = "SUBMITTED";
})(TaskStatus || (TaskStatus = {}));
var TaskTextElement = (function (_super) {
    __extends(TaskTextElement, _super);
    function TaskTextElement(id, name, status, desc) {
        _super.call(this);
        this.taskNameText = new egret.TextField;
        this.taskStatusText = new egret.TextField;
        this.taskDescText = new egret.TextField;
        this._taskid = id;
        this.taskNameText.text = "任务 : " + name;
        this.taskNameText.size = 14;
        this.taskNameText.fontFamily = "微软雅黑";
        this.taskNameText.textColor = 0xffff00;
        this.taskNameText.textAlign = egret.HorizontalAlign.LEFT;
        this.taskNameText.type = egret.TextFieldType.DYNAMIC;
        this.taskNameText.x = 10;
        this.taskNameText.y = 10;
        this.taskNameText.width = 180;
        this.taskNameText.height = 20;
        this.taskNameText.lineSpacing = 6;
        this.taskNameText.multiline = true;
        this.taskDescText.text = desc;
        this.taskDescText.size = 14;
        this.taskDescText.fontFamily = "微软雅黑";
        this.taskDescText.textAlign = egret.HorizontalAlign.LEFT;
        this.taskDescText.type = egret.TextFieldType.DYNAMIC;
        this.taskDescText.x = 10;
        this.taskDescText.y = 30;
        this.taskDescText.width = 180;
        this.taskDescText.height = 40;
        this.taskDescText.lineSpacing = 6;
        this.taskDescText.multiline = true;
        this.taskStatusText.text = "当前状态 : " + ChineseTaskStatus[status];
        this.taskStatusText.size = 14;
        this.taskStatusText.fontFamily = "微软雅黑";
        this.taskStatusText.textAlign = egret.HorizontalAlign.LEFT;
        this.taskStatusText.type = egret.TextFieldType.DYNAMIC;
        this.taskStatusText.x = 10;
        this.taskStatusText.y = 70;
        this.taskStatusText.width = 180;
        this.taskStatusText.height = 40;
        this.taskStatusText.lineSpacing = 6;
        this.taskStatusText.multiline = true;
        this.addChild(this.taskNameText);
        this.addChild(this.taskDescText);
        this.addChild(this.taskStatusText);
    }
    var d = __define,c=TaskTextElement,p=c.prototype;
    p.changeText = function (task) {
        this.taskNameText.text = "任务 : " + task.name;
        this.taskStatusText.text = "当前状态 : " + ChineseTaskStatus[task.status];
        this.taskDescText.text = task.desc;
        //console.log("panel taskinfo change success");
    };
    d(p, "taskId"
        ,function () {
            return this._taskid;
        }
    );
    return TaskTextElement;
}(egret.DisplayObjectContainer));
egret.registerClass(TaskTextElement,'TaskTextElement');
var TaskPanel = (function (_super) {
    __extends(TaskPanel, _super);
    function TaskPanel() {
        _super.call(this);
        this.taskTextList = [];
        this.bg = new egret.Bitmap;
        this.bgShape = new egret.Shape;
        this.bgShape.x = 0;
        this.bgShape.y = 0;
        this.bgShape.graphics.clear();
        this.bgShape.graphics.beginFill(0x000000, .5);
        this.bgShape.graphics.drawRect(0, 0, 200, 200);
        this.bgShape.graphics.endFill();
        this.addChild(this.bgShape);
        for (var i = 0; i < TaskService.getInstance().taskList.length; i++) {
            var taskText = new TaskTextElement(TaskService.getInstance().taskList[i].id, TaskService.getInstance().taskList[i].name, TaskService.getInstance().taskList[i].status, TaskService.getInstance().taskList[i].desc);
            this.taskTextList.push(taskText);
            this.taskTextList[i].y = i * 100;
            this.addChild(taskText);
        }
    }
    var d = __define,c=TaskPanel,p=c.prototype;
    p.onChange = function (task) {
        for (var i = 0; i < this.taskTextList.length; i++) {
            if (task.id == this.taskTextList[i].taskId) {
                this.taskTextList[i].changeText(task);
            }
        }
    };
    return TaskPanel;
}(egret.DisplayObjectContainer));
egret.registerClass(TaskPanel,'TaskPanel',["Observer"]);
var DialogPanel = (function (_super) {
    __extends(DialogPanel, _super);
    function DialogPanel() {
        _super.call(this);
        this.charaName = new egret.TextField;
        this.desc = new egret.TextField;
        this.bg = new egret.Bitmap;
        this.dialogue = [];
        this.dialogueCount = 0;
        this.dialogueTotal = 0;
        this.tachie_left = new egret.Bitmap;
        this.tachie_right = new egret.Bitmap;
        //button: egret.Shape = new egret.Shape;
        this.currentTaskId = "-1";
        /*this.button.x = 250;
        this.button.y = 250;
        this.button.graphics.clear();
        this.button.graphics.beginFill(0x000000, 1.0);
        this.button.graphics.drawRect(0, 0, 50, 30);
        this.button.graphics.endFill();  */
        this.bg.texture = RES.getRes("dialog_png");
        this.bg.x = 0;
        this.bg.y = 0;
        //this.tachie_left.texture = RES.getRes("npc_1_tachie_png");
        this.tachie_left.x = 0;
        this.tachie_left.y = 0;
        //this.tachie_left.width = 200;
        //this.tachie_left.height = 250;
        this.tachie_right.texture = RES.getRes("npc_0_tachie_png");
        this.tachie_right.x = 0;
        this.tachie_right.y = 0;
        //this.addChild(this.tachie_right);
        //this.tachie_right.width = 200;
        //this.tachie_right.height = 250;
        this.desc.text = "确定";
        this.desc.size = 16;
        this.desc.fontFamily = "微软雅黑";
        this.desc.x = 75;
        this.desc.y = 420;
        this.desc.width = 300;
        this.desc.height = 50;
        this.desc.textAlign = egret.HorizontalAlign.LEFT;
        this.desc.type = egret.TextFieldType.DYNAMIC;
        this.desc.lineSpacing = 6;
        this.desc.multiline = true;
        this.charaName.text = "Lizbeth";
        this.charaName.size = 18;
        this.charaName.fontFamily = "微软雅黑";
        this.charaName.anchorOffsetX = this.charaName.width / 2;
        this.charaName.anchorOffsetY = this.charaName.height / 2;
        this.charaName.x = 128;
        this.charaName.y = 394;
        this.anchorOffsetX = this.width / 2;
        this.anchorOffsetY = this.height / 2;
        //this.x = 250;
        //this.y = 250;
        //console.log("Dialog Panel button x: "+this.button.x+"y: "+this.button.y);
        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClick, this);
    }
    var d = __define,c=DialogPanel,p=c.prototype;
    p.onAwake = function (taskId) {
        this.currentTaskId = taskId;
        var data = RES.getRes("dialogue_json");
        for (var i = 0; i < data.dialogue.length; i++) {
            if (data.dialogue[i].taskId == taskId) {
                this.dialogue.push(data.dialogue[i]);
                this.dialogueTotal++;
            }
        }
        this.onChange();
        this.addChild(this.tachie_left);
        this.addChild(this.tachie_right);
        this.addChild(this.bg);
        this.addChild(this.desc);
        this.addChild(this.charaName);
        //console.log("DialogPanel onAwake by task: "+ taskId);
    };
    p.onChange = function () {
        if (this.dialogueTotal == 0) {
        }
        else if (this.dialogueCount < this.dialogueTotal) {
            this.charaName.text = this.dialogue[this.dialogueCount].actorName;
            this.desc.text = this.dialogue[this.dialogueCount].content;
            if (this.dialogue[this.dialogueCount].side == "left") {
                this.tachie_left.texture = RES.getRes(this.dialogue[this.dialogueCount].tachie);
                this.tachie_right.texture = null;
            }
            else if (this.dialogue[this.dialogueCount].side == "right") {
                this.tachie_right.texture = RES.getRes(this.dialogue[this.dialogueCount].tachie);
                this.tachie_left.texture = null;
            }
            this.dialogueCount++;
        }
    };
    p.onSleep = function () {
        this.removeChild(this.bg);
        this.removeChild(this.desc);
        this.removeChild(this.charaName);
        this.removeChild(this.tachie_left);
        this.removeChild(this.tachie_right);
        this.dialogue = [];
        this.dialogueCount = 0;
        this.dialogueTotal = 0;
    };
    p.onClick = function () {
        //console.log("onclick");
        if (this.currentTaskId == "-1") {
            console.log("no task on dialogPanel");
        }
        else {
            var task = TaskService.getInstance().taskList[this.currentTaskId];
            task.onAccept();
        }
    };
    return DialogPanel;
}(egret.DisplayObjectContainer));
egret.registerClass(DialogPanel,'DialogPanel');
var ChineseTaskStatus = {
    0: "不可接受",
    1: "可接受",
    2: "进行中",
    3: "可提交",
    4: "已提交"
};
//# sourceMappingURL=Task.js.map