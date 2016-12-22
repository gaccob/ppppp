(function(){ "use strict";

var IO = require('socket.io-client');

var Package = require("../package.json");

var CDispatcher = require("../modules/cdispatcher");
var World = require("../modules/world");
var Util = require("../modules/util");

var MainView = require("../view/mainView");
var TopView = require("../view/topView");
var PropAddView = require("../view/propAddView");
var StartView = require("../view/startView");

function CWorld()
{
    World.call(this, true);

    // stage
    this.stage = new PIXI.Container();

    // async load view
    this.mainView = new MainView(this);
    this.startView = new StartView(this);
    this.topView = new TopView(this);
    this.propAddView = new PropAddView(this);

    this.dieSprites = [];

    this.dispatcher = new CDispatcher(this);

    this.inited = false;

    // lock-step
    this.step = 0;

    // self
    this.connid = null;
}

CWorld.prototype = Object.create(World.prototype);
CWorld.prototype.constructor = CWorld;

CWorld.prototype.getSelf = function()
{
    return this.connid ?  this.players[this.connid] : null;
};

CWorld.prototype.updateView = function()
{
    if (this.startView) {
        this.startView.update();
    }
    if (this.topView) {
        this.topView.update();
    }
    if (this.propAddView) {
        this.propAddView.update();
    }
    if (this.mainView) {
        this.mainView.update();
    }
};

CWorld.prototype.updateDieAnimations = function()
{
    var cfg = Package.app.dieAnimation;
    for (var i in this.dieSprites) {
        var sprite = this.dieSprites[i];
        if (sprite.alpha > cfg.alphaStart) {
            sprite.alpha = cfg.alphaStart;
        } else {
            sprite.alpha -= cfg.alphaDecrease;
        }
        sprite.scale.x += cfg.scaleIncrease;
        sprite.scale.y += cfg.scaleIncrease;
        if (sprite.alpha < cfg.alphaEnd) {
            if (sprite.parent) {
                sprite.parent.removeChild(sprite);
            }
            this.dieSprites.splice(i, 1);
        }
    }
};

CWorld.prototype.updateFrameLogic = function()
{
    World.prototype.updateFrameLogic.call(this);
    this.updateDieAnimations();
};

CWorld.prototype.init = function()
{
    Util.logDebug("world init");

    this.socket = IO("ws://" + Package.app.domain + ":" + Package.app.port);

    this.socket.on('connect', function() {
        Util.logDebug('connected to the server!');
    });

    var world = this;
    this.socket.on('pkg', function(data) {
        world.dispatcher.onMessage(data);
    });

    this.socket.on('disconnect', function() {
        Util.logDebug('client disconnected!');
    });

    this.inited = true;
};

CWorld.prototype.finish = function()
{
    this.socket.disconnect();
    Util.logDebug("world finish");
};

CWorld.prototype.update = function()
{
    // lock-step execute
    if (this.started === true && this.step > 0) {
        -- this.step;
        this.updateFrameLogic();
    }

    // view
    this.updateView();
};

CWorld.prototype.onStartNameInput = function(name)
{
    if (this.inited === false) {
        this.init();
        this.synchronizer.syncStartReq(name);
    } else {
        this.synchronizer.syncReborn(name);
    }
};

module.exports = CWorld;

})();

