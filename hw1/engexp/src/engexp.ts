export default class EngExp {
    private prefixes: string = "";
    private suffixes: string = "";
    private flags: string = "m";
    private pattern: string = "";

    private static sanitize(s: string | EngExp): string | EngExp {
        if (s instanceof EngExp)
            return s;
        else
            return s.replace(/([\].|*?+(){}^$\\:=[])/g, "\\$&");
    }

    asRegExp(): RegExp {
        return new RegExp(this.prefixes + this.pattern + this.suffixes, this.flags);
    }

    match(literal: string): EngExp {
        return this.then(literal);
    }

    then(pattern: string | EngExp): EngExp {
        this.pattern += `(?:${EngExp.sanitize(pattern)})`;
        return this;
    }

    startOfLine(): EngExp {
        this.prefixes = "^" + this.prefixes;
        return this;
    }

    endOfLine(): EngExp {
        this.suffixes = this.suffixes + "$";
        return this;
    }

    zeroOrMore(pattern?: EngExp): EngExp {
        if (pattern)
            return this.then(pattern.zeroOrMore());
        else {
            this.pattern = `(?:${this.pattern})*`;
            return this;
        }
    }

    oneOrMore(pattern?: EngExp): EngExp {
        if (pattern)
            return this.then(pattern.oneOrMore());
        else {
            this.pattern = `(?:${this.pattern})+`;
            return this;
        }
    }

    optional(): EngExp {
        this.pattern = `(?:${this.pattern})?`;
        return this;
    }

    maybe(pattern: string | EngExp): EngExp {
        this.pattern += `(?:${EngExp.sanitize(pattern)})?`;
        return this;
    }

    anythingBut(characters: string): EngExp {
        this.pattern += `[^${EngExp.sanitize(characters)}]*`;
        return this;
    }

    digit(): EngExp {
        this.pattern += "\\d";
        return this;
    }

    repeated(from: number, to?: number): EngExp {
        this.pattern = `(?:${this.pattern}){${from},${to}}`;
        return this;
    }

    multiple(pattern: string | EngExp, from: number, to?: number) {
        this.pattern += `(?:${EngExp.sanitize(pattern)}){${from},${to}}`;
        return this;
    }

    or(pattern: string | EngExp): EngExp {
        // FILL IN HERE
        return undefined;
    }

    beginCapture(): EngExp {
        // FILL IN HERE
        return undefined;
    }

    endCapture(): EngExp {
        // FILL IN HERE
        return undefined;
    }

    toString(): string {
        return this.asRegExp().source;
    }

    valueOf(): string {
        return this.asRegExp().source;
    }
}
