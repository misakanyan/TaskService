class NPC extends egret.DisplayObjectContainer implements Observer {

    private _id: string;
    private _name: string;
    private _bitmap: egret.Bitmap = new egret.Bitmap;
    private _emoji: egret.Bitmap = new egret.Bitmap;
    private _taskList: Task[];

    private dialog: DialogPanel = new DialogPanel();

    constructor(id: string, name: string, bitmap: string, emoji: EmojiStatus, x: number, y: number) {
        super();
        this._id = id;
        this._name = name;
        this._bitmap.texture = RES.getRes(bitmap);
        this.changeEmoji(emoji);
        this.x = x;
        this.y = y;
        this._bitmap.x = 0;
        this._bitmap.y = 0;
        this._bitmap.anchorOffsetX = this._bitmap.width / 2;
        this._bitmap.anchorOffsetY = this._bitmap.height / 2;
        this._emoji.anchorOffsetX = this._emoji.width / 2;
        this._emoji.anchorOffsetY = this._emoji.height / 2;
        this._emoji.x = this._bitmap.x
        this._emoji.y = this._bitmap.y - (this._bitmap.height + this._emoji.height) / 2;

        this._taskList = TaskService.getInstance().getTaskByCustomRole(this.npcRule);
        for (var i: number = 0; i < this._taskList.length; i++) {
            if (this._taskList[i].fromNpcId == this._id) {
                this.changeEmoji(EmojiStatus.EXCLAMATION);
                break;
            }
        }
        this.addChild(this._bitmap);
        this.addChild(this._emoji);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClick, this);
        this.touchEnabled = true;

        this.dialog.anchorOffsetX = this.dialog.width / 2;
        this.dialog.anchorOffsetY = this.dialog.height / 2;
        this.dialog.x = -(this._bitmap.width) / 2;
        this.dialog.y = 50;
        this.dialog.addEventListener(egret.TouchEvent.TOUCH_TAP, () => {
            console.log("onclick");
            for (var i: number = 0; i < this._taskList.length; i++) {
                if (this._taskList[i].fromNpcId == this._id) {
                    TaskService.getInstance().accept(this._taskList[i].id);
                } else if (this._taskList[i].toNpcId == this.id) {
                    TaskService.getInstance().complete(this._taskList[i].id);
                    TaskService.getInstance().submit(this._taskList[i].id);
                }
                //this.removeChild(this.dialog); //报错 提供的displayobject必须是调用者的子级 dialog的监听器位置需要修改
                this.dialog.visible = false;
            }
        }, this);
        this.dialog.touchEnabled = true;


        //console.log("this:"+this.x+","+this.y);
        //console.log("bitmap:"+this._bitmap.x+","+this._bitmap.y);
        //console.log("emoji:"+this._emoji.x+","+this._emoji.y);



    }

    public get id(): string {
        return this._id;
    }


    onChange(task: Task) {
        if (this._taskList.length > 0) {
            for (var i: number = 0; i < this._taskList.length; i++) {
                if (task == this._taskList[i]) {
                    console.log("accept task fromNpcId:" + task.fromNpcId + " status:" + task.status);
                    console.log("accept task fromNpcId:" + this._id + " status:" + TaskStatus.DURING);
                    if (task.fromNpcId == this._id && task.status == TaskStatus.DURING) {
                        this.changeEmoji(EmojiStatus.EMPTY);
                        //console.log("取消叹号");
                    } else if (task.toNpcId == this._id && task.status == TaskStatus.DURING) {
                        this.changeEmoji(EmojiStatus.QUESTION);
                    } else if (task.toNpcId == this._id && task.status == TaskStatus.SUBMITTED) {
                        this.changeEmoji(EmojiStatus.EMPTY);
                    }
                }
            }
        }
    }

    private changeEmoji(status: EmojiStatus): void {
        switch (status) {
            case EmojiStatus.EMPTY:
                this._emoji.texture = RES.getRes("empty_png");
                break;
            case EmojiStatus.QUESTION:
                this._emoji.texture = RES.getRes("question_jpg");
                break;
            case EmojiStatus.EXCLAMATION:
                this._emoji.texture = RES.getRes("exclamation_jpg");
                break;
            default:
                break;
        }
    }

    private onClick() {
        this.addChild(this.dialog);
    }

    private npcRule = ()=>{
        return this._id;
    }

}

enum EmojiStatus {

    EMPTY,
    QUESTION,
    EXCLAMATION

}

class NPCManager {

    static NPCList: NPC[] = [];

    static init() {
        var data = RES.getRes("gameconfig_json");
        for (var i: number = 0; i < data.npcs.length; i++) {
            var npc = new NPC(data.npcs[i].id, data.npcs[i].name, data.npcs[i].bitmap, data.npcs[i].emoji, data.npcs[i].x, data.npcs[i].y);
            this.NPCList.push(npc);
            //console.log("init npc");
        }
    }

    /*static setTouchEvent(e:egret.TouchEvent){
        var data = e.currentTarget;
        switch (data.id) {
            case "npc_0":
                TaskService.accept("0");
                break;
            case "npc_1":
                TaskService.complete("0");
                TaskService.submit("0");
                break;
            default:
                break;
        }
    }
    */

}