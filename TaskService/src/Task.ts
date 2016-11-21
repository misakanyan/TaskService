interface TaskCondition {
    onAccept(task: Task);
    onSubmit();
}

interface TaskConditionContext {
    current: number;
    checkStatus();
    killMonsterCheckStatus();
}

class NpcTalkTaskCondition implements TaskCondition {

    private static instance;

    public static getInstance() {
        if (NpcTalkTaskCondition.instance == null) {
            NpcTalkTaskCondition.instance = new NpcTalkTaskCondition;
        }
        return NpcTalkTaskCondition.instance;
    }

    onAccept(task: TaskConditionContext) {
        task.current++;
        NPCManager.getInstance().changeDialog();
        task.checkStatus();
    }


    onSubmit() {

    }
}

class KillMonsterTaskCondition implements TaskCondition, SceneObserver {
    private static instance;

    public static getInstance() {
        if (KillMonsterTaskCondition.instance == null) {
            KillMonsterTaskCondition.instance = new KillMonsterTaskCondition;
        }
        return KillMonsterTaskCondition.instance;
    }

    onAccept(task: TaskConditionContext) {
        task.current++;
        task.killMonsterCheckStatus();
    }


    onSubmit() {

    }

    onChange(task: Task) {
        this.onAccept(task);
    }
}


class Task implements TaskConditionContext {

    private _id: string;
    private _name: string;
    private _status: TaskStatus;
    private _desc: string;
    public fromNpcId: string;
    public toNpcId: string;

    public current: number = 0;
    public total: number = -1;

    public condition: TaskCondition;


    constructor(id: string,
        name: string,
        status: TaskStatus,
        desc: string,
        fromNpcId: string,
        toNpcId: string,
        condition: TaskCondition,
        current: number,
        total: number
    ) {
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

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public get status(): TaskStatus {
        return this._status;
    }

    public set status(status: TaskStatus) {
        this._status = status;
    }

    public get desc(): string {
        return this._desc;
    }

    public onAccept() {
        this.condition.onAccept(this);
    }

    public checkStatus() {
        //if(this.current > this.total){
        //    console.warn();
        //}
        //console.log("current: " + this.current);
        if (this._status == TaskStatus.DURING &&
            this.current >= this.total + 1) {  //不加1对话的最后一句会被吞掉
            this._status = TaskStatus.CAN_SUBMIT;
            //console.log(this._status);
            TaskService.getInstance().submit(this._id);
            TaskService.getInstance().enforceAccept("1"); //临时代码 用于启动下一个任务
            SceneService.getInstance().wakeUpMonster("0") //临时代码 用于唤醒怪物
            NPCManager.getInstance().closeDialog();
            console.log("submitted");
        }
    }

    public killMonsterCheckStatus() {
        if (this._status == TaskStatus.DURING &&
            this.current >= this.total + 1) {  //不加1对话的最后一句会被吞掉
            this._status = TaskStatus.CAN_SUBMIT;
            //console.log(this._status);
            TaskService.getInstance().submit(this._id);
            SceneService.getInstance().killMonster("0");//临时代码 用于清除怪物
            console.log("submitted");
        }
    }

}

class TaskService {

    private observerList: Observer[] = [];
    public taskList: Task[] = [];
    private static instance;

    public static getInstance() {
        if (TaskService.instance == null) {
            TaskService.instance = new TaskService;
        }
        return TaskService.instance;
    }

    init() {
        this.initTask();
        this.initObserver();
    }

    private initTask() {
        var data = RES.getRes("gameconfig_json");
        for (var i = 0; i < data.tasks.length; i++) {
            var taskType = data.tasks[i].type == "dialog" ? NpcTalkTaskCondition.getInstance() : KillMonsterTaskCondition.getInstance();
            var task: Task = new Task(data.tasks[i].id,
                data.tasks[i].name,
                data.tasks[i].status,
                data.tasks[i].desc,
                data.tasks[i].fromNpcId,
                data.tasks[i].toNpcId,
                taskType,
                //NpcTalkTaskCondition.getInstance(),
                data.tasks[i].current,
                data.tasks[i].total
            );
            this.taskList.push(task);
        }
    }

    private initObserver() {

        NPCManager.getInstance().init();
        for (var i: number = 0; i < NPCManager.getInstance().NPCList.length; i++) {
            this.observerList.push(NPCManager.getInstance().NPCList[i]);
        }

    }

    addObserver(o: Observer) {
        this.observerList.push(o);
    }

    notify(task: Task) {
        for (var i: number = 0; i < TaskService.getInstance().observerList.length; i++) {
            this.observerList[i].onChange(task);
        }
    }

    enforceAccept(id: string) {
        let task = this.taskList[id];
        if (task.status == TaskStatus.UNACCEPTABLE) {
            task.status = TaskStatus.DURING;
            task.onAccept();
            console.log('enforce accept:' + id);
            console.log("enforce accept status: " + this.taskList[id]._status);
        }
        this.notify(task);
    }

    accept(id: string) {
        if (!id) {
            return ErrorCode.MISSING_TASK;
        }
        //console.log(this.taskList[id]);
        let task = this.taskList[id];
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

    }

    complete(id: string) {
        if (!id) {
            return ErrorCode.MISSING_TASK;
        }

        let task = this.taskList[id];
        if (!task) {
            return ErrorCode.MISSING_TASK;
        }
        if (task.status == TaskStatus.DURING) {
            task.status = TaskStatus.CAN_SUBMIT;
            console.log('complete:' + id);

        }
        this.notify(task);
    }

    submit(id: string) {
        if (!id) {
            return ErrorCode.MISSING_TASK;
        }

        let task = this.taskList[id];
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
    }

    getTaskByCustomRole(rule: Function): Task[] {
        var task: Task[] = [];
        var npcId = rule();
        for (var i: number = 0; i < this.taskList.length; i++) {
            if (this.taskList[i].fromNpcId == npcId || this.taskList[i].toNpcId == npcId) {
                task.push(this.taskList[i]);
            }
        }
        return task;
    }
}

enum ErrorCode {

    SUCCESS,
    MISSING_TASK

}

enum TaskStatus {

    UNACCEPTABLE,
    ACCEPTABLE,
    DURING,
    CAN_SUBMIT,
    SUBMITTED

}

interface Observer {

    onChange(task: Task);

}

interface Strategy {

    selector: Function;

}

class TaskTextElement extends egret.DisplayObjectContainer {

    private _taskid: string;
    taskNameText: egret.TextField = new egret.TextField;
    taskStatusText: egret.TextField = new egret.TextField;
    taskDescText: egret.TextField = new egret.TextField;

    constructor(id: string, name: string, status: TaskStatus, desc: string) {
        super();
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

    changeText(task: Task) {
        this.taskNameText.text = "任务 : " + task.name;
        this.taskStatusText.text = "当前状态 : " + ChineseTaskStatus[task.status];
        this.taskDescText.text = task.desc;
        //console.log("panel taskinfo change success");
    }

    public get taskId(): string {
        return this._taskid;
    }


}

class TaskPanel extends egret.DisplayObjectContainer implements Observer {

    private taskTextList: TaskTextElement[] = [];
    private bg: egret.Bitmap = new egret.Bitmap;
    private bgShape: egret.Shape = new egret.Shape;

    constructor() {
        super();
        this.bgShape.x = 0;
        this.bgShape.y = 0;
        this.bgShape.graphics.clear();
        this.bgShape.graphics.beginFill(0x000000, .5);
        this.bgShape.graphics.drawRect(0, 0, 200, 200);
        this.bgShape.graphics.endFill();
        this.addChild(this.bgShape);
        for (var i: number = 0; i < TaskService.getInstance().taskList.length; i++) {
            var taskText = new TaskTextElement(TaskService.getInstance().taskList[i].id, TaskService.getInstance().taskList[i].name, TaskService.getInstance().taskList[i].status, TaskService.getInstance().taskList[i].desc);
            this.taskTextList.push(taskText);
            this.taskTextList[i].y = i * 100;
            this.addChild(taskText);
        }
    }

    onChange(task: Task) {
        for (var i: number = 0; i < this.taskTextList.length; i++) {
            if (task.id == this.taskTextList[i].taskId) {
                this.taskTextList[i].changeText(task);
            }
        }
    }

}

class DialogPanel extends egret.DisplayObjectContainer {

    charaName: egret.TextField = new egret.TextField;
    desc: egret.TextField = new egret.TextField;
    bg: egret.Bitmap = new egret.Bitmap;
    dialogue: any[] = [];
    dialogueCount: number = 0;
    dialogueTotal: number = 0;
    tachie_left: egret.Bitmap = new egret.Bitmap;
    tachie_right: egret.Bitmap = new egret.Bitmap;
    //button: egret.Shape = new egret.Shape;
    private currentTaskId: string = "-1";



    constructor() {
        super();

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

    onAwake(taskId) {
        this.currentTaskId = taskId;
        var data = RES.getRes("dialogue_json");
        for (var i: number = 0; i < data.dialogue.length; i++) {
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
    }

    onChange() {
        if (this.dialogueTotal == 0) {
            //console.log("未传入dialogueTotal参数");
        } else if (this.dialogueCount < this.dialogueTotal) {
            this.charaName.text = this.dialogue[this.dialogueCount].actorName;
            this.desc.text = this.dialogue[this.dialogueCount].content;
            if (this.dialogue[this.dialogueCount].side == "left") {
                this.tachie_left.texture = RES.getRes(this.dialogue[this.dialogueCount].tachie);
                this.tachie_right.texture = null;
            } else if (this.dialogue[this.dialogueCount].side == "right") {
                this.tachie_right.texture = RES.getRes(this.dialogue[this.dialogueCount].tachie);
                this.tachie_left.texture = null;
            }
            this.dialogueCount++;
        }
    }

    onSleep() {
        this.removeChild(this.bg);
        this.removeChild(this.desc);
        this.removeChild(this.charaName);
        this.removeChild(this.tachie_left);
        this.removeChild(this.tachie_right);
        this.dialogue = [];
        this.dialogueCount = 0;
        this.dialogueTotal = 0;
    }

    private onClick() {
        //console.log("onclick");
        if (this.currentTaskId == "-1") {
            console.log("no task on dialogPanel");
        } else {
            let task = TaskService.getInstance().taskList[this.currentTaskId];
            task.onAccept();
        }
    }
}

var ChineseTaskStatus = {
    0: "不可接受",
    1: "可接受",
    2: "进行中",
    3: "可提交",
    4: "已提交"
}


