"use strict";
var EngExp = (function () {
    function EngExp() {
        this.prefixes = "";
        this.suffixes = "";
        this.flags = "m";
        this.pattern = "";
    }
    EngExp.sanitize = function (s) {
        if (s instanceof EngExp)
            return s;
        else
            return s.replace(/([\].|*?+(){}^$\\:=[])/g, "\\$&");
    };
    EngExp.prototype.asRegExp = function () {
        return new RegExp(this.prefixes + this.pattern + this.suffixes, this.flags);
    };
    EngExp.prototype.match = function (literal) {
        return this.then(literal);
    };
    EngExp.prototype.then = function (pattern) {
        this.pattern += "(?:" + EngExp.sanitize(pattern) + ")";
        return this;
    };
    EngExp.prototype.startOfLine = function () {
        this.prefixes = "^" + this.prefixes;
        return this;
    };
    EngExp.prototype.endOfLine = function () {
        this.suffixes = this.suffixes + "$";
        return this;
    };
    EngExp.prototype.zeroOrMore = function (pattern) {
        if (pattern)
            return this.then(pattern.zeroOrMore());
        else {
            this.pattern = "(?:" + this.pattern + ")*";
            return this;
        }
    };
    EngExp.prototype.oneOrMore = function (pattern) {
        if (pattern)
            return this.then(pattern.oneOrMore());
        else {
            this.pattern = "(?:" + this.pattern + ")+";
            return this;
        }
    };
    EngExp.prototype.optional = function () {
        this.pattern = "(?:" + this.pattern + ")?";
        return this;
    };
    EngExp.prototype.maybe = function (pattern) {
        this.pattern += "(?:" + EngExp.sanitize(pattern) + ")?";
        return this;
    };
    EngExp.prototype.anythingBut = function (characters) {
        this.pattern += "[^" + EngExp.sanitize(characters) + "]*";
        return this;
    };
    EngExp.prototype.digit = function () {
        this.pattern += "\\d";
        return this;
    };
    EngExp.prototype.repeated = function (from, to) {
        this.pattern = "(?:" + this.pattern + "){" + from + "," + to + "}";
        return this;
    };
    EngExp.prototype.multiple = function (pattern, from, to) {
        this.pattern += "(?:" + EngExp.sanitize(pattern) + "){" + from + "," + to + "}";
        return this;
    };
    EngExp.prototype.or = function (pattern) {
        // FILL IN HERE
        return undefined;
    };
    EngExp.prototype.beginCapture = function () {
        // FILL IN HERE
        return undefined;
    };
    EngExp.prototype.endCapture = function () {
        // FILL IN HERE
        return undefined;
    };
    EngExp.prototype.toString = function () {
        return this.asRegExp().source;
    };
    EngExp.prototype.valueOf = function () {
        return this.asRegExp().source;
    };
    return EngExp;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EngExp;
//# sourceMappingURL=engexp.js.map