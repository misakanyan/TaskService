interface SceneObserver{
    onChange(task:Task);
}

class SceneService{

    private observerList: SceneObserver[] = [];
    public taskList: Task[] = [];
    public monsterList:Monster[] = [];
    private static instance;

    public static getInstance() {
        if (SceneService.instance == null) {
            SceneService.instance = new SceneService;
        }
        return SceneService.instance;
    }

    init(){
        this.monsterList.push(new Monster("monster_jpg"));
        this.taskList.push(TaskService.getInstance().taskList[1]); //临时往里面塞一个任务触发用
        for(var i:number = 0;i<this.monsterList.length;i++){
            this.observerList.push(this.monsterList[i]);
        }
        this.observerList.push(new KillMonsterTaskCondition());
    }

    wakeUpMonster(id:string){
        for(var i:number = 0;i<this.monsterList.length;i++){
            if(this.monsterList[i].id == id){
                this.monsterList[i].onAwake();
            }
        }
    }

    killMonster(id:string){
        for(var i:number = 0;i<this.monsterList.length;i++){
            if(this.monsterList[i].id == id){
                this.monsterList[i].onSleep();
            }
        }
    }

    addObserver(o: Observer) {
        this.observerList.push(o);
    }

    notify(task: Task) {
        for (var i: number = 0; i < SceneService.getInstance().observerList.length; i++) {
            this.observerList[i].onChange(task);
        }
    }

    accept(id:string){
        this.notify(this.taskList[0]);  //这个是临时的任务
    }

    submit(id:string){

    }

}

class Monster extends egret.DisplayObjectContainer implements SceneObserver{

    private _image:egret.Bitmap = new egret.Bitmap;
    private _id:string;

    constructor(image:string){
        super();
        this._id = "0";
        this._image.texture = RES.getRes(image);
        this.x = 200;
        this.y = 350;
        this._image.touchEnabled = true;
        //this.addChild(this._image);
        this.addEventListener(egret.TouchEvent.TOUCH_TAP,this.onClick,this);
    }

    public get id(){
        return this._id;
    }

    private onClick(){
        SceneService.getInstance().accept(this._id);
    }

    onAwake(){
        this.addChild(this._image);
    }

    onSleep(){
        this.removeChild(this._image);
    }

    onChange(task:Task){

    }

}