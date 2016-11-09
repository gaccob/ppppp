(function(){ "use strict";

var Package = require("../package.json");
var Util = require("../modules/util");

function SDispatcher(world)
{
    this.world = world;
}

SDispatcher.prototype = {
    constructor: SDispatcher,
};

SDispatcher.prototype.onConnected = function(client)
{
    Util.logDebug("add connection:" + client.id);
};

SDispatcher.prototype.onDisconnected = function(client)
{
    Util.logDebug("remove connection:" + client.id);
    var commander = new this.world.proto.SyncCommander();
    commander.cmd = this.world.proto.CommanderType.CT_QUIT;
    commander.connid = client.id;
    this.world.commander.push(this.world.frame + 1, commander);
};

SDispatcher.prototype.onStart = function(client, pkg)
{
    var err = this.world.proto.ErrCode;
    var sync = this.world.synchronizer;
    if (this.world.players[client.id]) {
        Util.logError("player[" + client.id + "] already existed");
        return sync.syncStartRes(client, err.EC_EXISTED, client.id);
    }
    if (this.world.playerCount > Package.app.maxOnline) {
        Util.logError("world full player count=" + this.world.playerCount);
        return sync.syncStartRes(client, err.EC_FULL, client.id);
    }
    sync.syncStartRes(client, err.SUCCESS, client.id);

    // TODO: join frame
};

SDispatcher.prototype.onCommanders = function(client, pkg)
{
    for (var i in pkg.syncCommands) {
        var commander = pkg.syncCommands[i];
        commander.connid = client.id;
        this.world.commander.push(this.world.frame + 1, commander);
    }
};

SDispatcher.prototype.onMessage = function(client, buffer)
{
    var pkg = this.world.proto.Pkg.decode(buffer);
    Util.logTrace("recv pkg cmd=" + pkg.cmd);
    var cmd = this.world.proto.SyncCmd;
    switch (pkg.cmd) {
        case cmd.SYNC_START_REQ:
            this.onStart(client, pkg);
            break;
        case cmd.SYNC_COMMANDERS:
            this.onCommanders(client, pkg);
            break;
        default:
            Util.logError("invalid cmd=" + pkg.cmd);
            break;
    }
};

module.exports = SDispatcher;

})();
