var NPC = (function (_super) {
    __extends(NPC, _super);
    function NPC(id, name, bitmap, emoji, x, y) {
        var _this = this;
        _super.call(this);
        this._bitmap = new egret.Bitmap;
        this._emoji = new egret.Bitmap;
        this.dialog = new DialogPanel();
        this.npcRule = function () {
            return _this._id;
        };
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
        this._emoji.x = this._bitmap.x;
        this._emoji.y = this._bitmap.y - (this._bitmap.height + this._emoji.height) / 2;
        this._taskList = TaskService.getInstance().getTaskByCustomRole(this.npcRule);
        for (var i = 0; i < this._taskList.length; i++) {
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
        this.dialog.addEventListener(egret.TouchEvent.TOUCH_TAP, function () {
            console.log("onclick");
            for (var i = 0; i < _this._taskList.length; i++) {
                if (_this._taskList[i].fromNpcId == _this._id) {
                    TaskService.getInstance().accept(_this._taskList[i].id);
                }
                else if (_this._taskList[i].toNpcId == _this.id) {
                    TaskService.getInstance().complete(_this._taskList[i].id);
                    TaskService.getInstance().submit(_this._taskList[i].id);
                }
                //this.removeChild(this.dialog); //报错 提供的displayobject必须是调用者的子级 dialog的监听器位置需要修改
                _this.dialog.visible = false;
            }
        }, this);
        this.dialog.touchEnabled = true;
        //console.log("this:"+this.x+","+this.y);
        //console.log("bitmap:"+this._bitmap.x+","+this._bitmap.y);
        //console.log("emoji:"+this._emoji.x+","+this._emoji.y);
    }
    var d = __define,c=NPC,p=c.prototype;
    d(p, "id"
        ,function () {
            return this._id;
        }
    );
    p.onChange = function (task) {
        if (this._taskList.length > 0) {
            for (var i = 0; i < this._taskList.length; i++) {
                if (task == this._taskList[i]) {
                    console.log("accept task fromNpcId:" + task.fromNpcId + " status:" + task.status);
                    console.log("accept task fromNpcId:" + this._id + " status:" + TaskStatus.DURING);
                    if (task.fromNpcId == this._id && task.status == TaskStatus.DURING) {
                        this.changeEmoji(EmojiStatus.EMPTY);
                    }
                    else if (task.toNpcId == this._id && task.status == TaskStatus.DURING) {
                        this.changeEmoji(EmojiStatus.QUESTION);
                    }
                    else if (task.toNpcId == this._id && task.status == TaskStatus.SUBMITTED) {
                        this.changeEmoji(EmojiStatus.EMPTY);
                    }
                }
            }
        }
    };
    p.changeEmoji = function (status) {
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
    };
    p.onClick = function () {
        this.addChild(this.dialog);
    };
    return NPC;
}(egret.DisplayObjectContainer));
egret.registerClass(NPC,'NPC',["Observer"]);
var EmojiStatus;
(function (EmojiStatus) {
    EmojiStatus[EmojiStatus["EMPTY"] = 0] = "EMPTY";
    EmojiStatus[EmojiStatus["QUESTION"] = 1] = "QUESTION";
    EmojiStatus[EmojiStatus["EXCLAMATION"] = 2] = "EXCLAMATION";
})(EmojiStatus || (EmojiStatus = {}));
var NPCManager = (function () {
    function NPCManager() {
    }
    var d = __define,c=NPCManager,p=c.prototype;
    NPCManager.init = function () {
        var data = RES.getRes("gameconfig_json");
        for (var i = 0; i < data.npcs.length; i++) {
            var npc = new NPC(data.npcs[i].id, data.npcs[i].name, data.npcs[i].bitmap, data.npcs[i].emoji, data.npcs[i].x, data.npcs[i].y);
            this.NPCList.push(npc);
        }
    };
    NPCManager.NPCList = [];
    return NPCManager;
}());
egret.registerClass(NPCManager,'NPCManager');
//# sourceMappingURL=NPC.js.map