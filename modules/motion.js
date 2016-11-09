(function(){ "use strict";

var Victor = require("victor");
var Util = require("../modules/util");

var epsilon = 1e-6;

function Motion(owner, cfg, angle)
{
    this.owner = owner;
    this.cfg = cfg;
    this.moveAngle = 0; // 0-360, degree
    this.iv = new Victor(cfg.ivInit * Math.cos(angle),
        cfg.ivInit * Math.sin(angle));
    this.ev = new Victor(0, 0);
    this.rv = cfg.rv;
}

Motion.prototype = {
    constructor: Motion,
};

Motion.prototype.toString = function()
{
    return "unit[" + this.owner.id + "] "
        + "move angle={" + this.moveAngle
        + "iv={" + this.iv.x + "," + this.iv.y + "} "
        + "ev={" + this.ev.x + "," + this.ev.y + "} "
        + "v=" + this.v;
};

Motion.prototype.randomMoveAngle = function()
{
    // TODO:
};

Motion.prototype.reverseIvX = function()
{
    this.iv.x = -this.iv.x;
};

Motion.prototype.reverseIvY = function()
{
    this.iv.y = -this.iv.y;
};

Motion.prototype.addRecoil = function(recoil, angle)
{
    this.ev.x -= recoil * Math.cos(angle);
    this.ev.y -= recoil * Math.sin(angle);
};

Motion.prototype.update = function(deltaMS)
{
    var angle, dec, ilen, elen;

    // internal velocity decrese
    ilen = this.iv.length();
    if (ilen > this.cfg.ivMin) {
        dec = this.cfg.ivDec * deltaMS / 1000;
        ilen = ilen > dec ? (ilen - dec) : 0;
        ilen = ilen < this.cfg.ivMin ? this.cfg.ivMin : ilen;
        this.iv.norm().multiply(new Victor(ilen, ilen));
    }

    // internal velocity increse
    if (this.moveDir.length() > epsilon) {
        angle = this.moveDir.angle();
        this.iv.x += this.cfg.ivAcc * Math.cos(angle) * deltaMS / 1000;
        this.iv.y += this.cfg.ivAcc * Math.sin(angle) * deltaMS / 1000;
        ilen = this.iv.length();
        if (ilen > this.cfg.ivMax) {
            ilen = this.cfg.ivMax;
            this.iv.norm().multiply(new Victor(ilen, ilen));
        }
    }

    // eternal velocity decrese
    elen = this.ev.length();
    if (elen > epsilon) {
        dec = this.cfg.evDec * deltaMS / 1000;
        elen = elen > dec ? (elen - dec) : 0;
        elen = elen > this.cfg.evMax ? this.cfg.evMax : elen;
        this.ev.norm().multiply(new Victor(elen, elen));
    }

    // update position
    this.owner.x += (this.iv.x + this.ev.x) * deltaMS / 1000;
    this.owner.y += (this.iv.y + this.ev.y) * deltaMS / 1000;
    Util.clampPosition(this.owner, 0, this.owner.world.w, 0, this.owner.world.h);

    if (this.rv !== null && Math.abs(this.rv) > epsilon) {
        this.owner.rotation += this.rv * deltaMS / 1000;
    }
};

Object.defineProperties(Motion.prototype, {
    vx: {
        get: function() { return this.iv.x + this.ev.x; }
    },
    vy: {
        get: function() { return this.iv.y + this.ev.y; }
    },
    v: {
        get: function() { return Math.sqrt(this.vx * this.vx + this.vy * this.vy); }
    },
});

module.exports = Motion;

})();
