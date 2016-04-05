///<reference path="../typings/main.d.ts"/>
"use strict";
var chai_1 = require("chai");
var engexp_1 = require("../src/engexp");
describe("EngExp", function () {
    it("should parse a basic URL", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("http")
            .maybe("s")
            .then("://")
            .maybe("www.")
            .anythingBut(" ")
            .endOfLine()
            .asRegExp();
        chai_1.expect(e.test("https://www.google.com/maps")).to.be.true;
    });
    it("should parse a disjunctive date pattern", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .digit().repeated(1, 2)
            .then("/")
            .then(new engexp_1.default().digit().repeated(1, 2))
            .then("/")
            .then(new engexp_1.default().digit().repeated(2, 4))
            .or(new engexp_1.default()
            .digit().repeated(1, 2)
            .then(" ")
            .then(new engexp_1.default().match("Jan").or("Feb").or("Mar").or("Apr").or("May").or("Jun")
            .or("Jul").or("Aug").or("Sep").or("Oct").or("Nov").or("Dec"))
            .then(" ")
            .then(new engexp_1.default().digit().repeated(2, 4)))
            .endOfLine()
            .asRegExp();
        chai_1.expect(e.test("12/25/2015")).to.be.true;
        chai_1.expect(e.test("25 Dec 2015")).to.be.true;
    });
    it("should capture nested groups", function () {
        var e = new engexp_1.default()
            .startOfLine()
            .then("http")
            .maybe("s")
            .then("://")
            .maybe("www.")
            .beginCapture()
            .beginCapture()
            .anythingBut("/")
            .endCapture()
            .anythingBut(" ")
            .endCapture()
            .endOfLine()
            .asRegExp();
        var result = e.exec("https://www.google.com/maps");
        chai_1.expect(result[1]).to.be.equal("google.com/maps");
        chai_1.expect(result[2]).to.be.equal("google.com");
    });
});
//# sourceMappingURL=engexp.js.map