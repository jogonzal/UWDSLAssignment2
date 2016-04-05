///<reference path="../typings/main.d.ts"/>

import {expect} from "chai";
import EngExp from "../src/engexp";

describe("EngExp", () => {
    it("should parse a basic URL", () => {
        let e = new EngExp()
            .startOfLine()
            .then("http")
            .maybe("s")
            .then("://")
            .maybe("www.")
            .anythingBut(" ")
            .endOfLine()
            .asRegExp();
        expect(e.test("https://www.google.com/maps")).to.be.true;
    });

    it("should parse a disjunctive date pattern", () => {
        let e = new EngExp()
            .startOfLine()
            .digit().repeated(1, 2)
            .then("/")
            .then(new EngExp().digit().repeated(1, 2))
            .then("/")
            .then(new EngExp().digit().repeated(2, 4))
            .or(
                new EngExp()
                    .digit().repeated(1, 2)
                    .then(" ")
                    .then(
                        new EngExp().match("Jan").or("Feb").or("Mar").or("Apr").or("May").or("Jun")
                            .or("Jul").or("Aug").or("Sep").or("Oct").or("Nov").or("Dec")
                    )
                    .then(" ")
                    .then(new EngExp().digit().repeated(2, 4))
            )
            .endOfLine()
            .asRegExp();
        expect(e.test("12/25/2015")).to.be.true;
        expect(e.test("25 Dec 2015")).to.be.true;
    });

    it("should capture nested groups", () => {
        let e = new EngExp()
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
        let result = e.exec("https://www.google.com/maps");
        expect(result[1]).to.be.equal("google.com/maps");
        expect(result[2]).to.be.equal("google.com");
    });
});
