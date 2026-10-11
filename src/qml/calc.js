.pragma library
// Calculator logic shared by the reMarkable QML app and the web demo.
// No eval(): expressions are parsed with a small recursive-descent parser.

var OPS = "+−×÷^";

// Keypad layout: rows of {k: key id, s: column span}
var LAYOUT = [
    [{k:"C",s:1},{k:"(",s:1},{k:")",s:1},{k:"DEL",s:1}],
    [{k:"7",s:1},{k:"8",s:1},{k:"9",s:1},{k:"÷",s:1}],
    [{k:"4",s:1},{k:"5",s:1},{k:"6",s:1},{k:"×",s:1}],
    [{k:"1",s:1},{k:"2",s:1},{k:"3",s:1},{k:"−",s:1}],
    [{k:"0",s:1},{k:".",s:1},{k:"%",s:1},{k:"+",s:1}],
    [{k:"^",s:1},{k:"=",s:3}]
];

function isAccent(k) { return "+−×÷^=".indexOf(k) >= 0; }

function tokenize(src) {
    var tokens = [], i = 0;
    while (i < src.length) {
        var c = src.charAt(i);
        if (c === " ") { i++; continue; }
        if ((c >= "0" && c <= "9") || c === ".") {
            var j = i, dots = 0;
            while (j < src.length && ((src.charAt(j) >= "0" && src.charAt(j) <= "9") || src.charAt(j) === ".")) {
                if (src.charAt(j) === ".") dots++;
                j++;
            }
            if (dots > 1) throw new Error("Bad number");
            tokens.push({ t: "num", v: parseFloat(src.slice(i, j)) });
            i = j;
            continue;
        }
        if ("+-*/()%^".indexOf(c) >= 0) { tokens.push({ t: c }); i++; continue; }
        throw new Error("Unexpected " + c);
    }
    return tokens;
}

function evaluate(src) {
    var s = String(src).replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
    var tokens = tokenize(s), pos = 0;
    function peek() { return pos < tokens.length ? tokens[pos].t : null; }
    function next() { return tokens[pos++]; }

    function expr() {
        var v = term();
        while (peek() === "+" || peek() === "-") {
            var op = next().t, r = term();
            v = (op === "+") ? v + r : v - r;
        }
        return v;
    }
    function term() {
        var v = unary();
        while (peek() === "*" || peek() === "/") {
            var op = next().t, r = unary();
            if (op === "/" && r === 0) throw new Error("Cannot divide by zero");
            v = (op === "*") ? v * r : v / r;
        }
        return v;
    }
    function unary() {
        if (peek() === "-") { next(); return -unary(); }
        if (peek() === "+") { next(); return unary(); }
        return power();
    }
    function power() {
        var base = postfix();
        if (peek() === "^") { next(); return Math.pow(base, unary()); }
        return base;
    }
    function postfix() {
        var v = primary();
        while (peek() === "%") { next(); v = v / 100; }
        return v;
    }
    function primary() {
        var t = tokens[pos];
        if (!t) throw new Error("Incomplete expression");
        if (t.t === "num") { pos++; return t.v; }
        if (t.t === "(") {
            pos++;
            var v = expr();
            if (peek() !== ")") throw new Error("Missing )");
            pos++;
            return v;
        }
        throw new Error("Unexpected " + t.t);
    }

    if (tokens.length === 0) return 0;
    var result = expr();
    if (pos < tokens.length) throw new Error("Unexpected " + tokens[pos].t);
    if (!isFinite(result)) throw new Error("Math error");
    return result;
}

function format(n) {
    if (n === 0) return "0";
    return String(parseFloat(n.toPrecision(12)));
}

// ---- keypad state machine -------------------------------------------------

function initialState() { return { expr: "", result: "", error: "", done: false }; }

function isDigit(c) { return c >= "0" && c <= "9"; }
function count(s, ch) { return s.split(ch).length - 1; }

function press(st, key) {
    if (key === "C") return initialState();
    var expr = st.expr;
    var isOp = OPS.indexOf(key) >= 0;

    if (st.done) {
        if (key === "=") return st;
        if (isOp || key === "%") {
            expr = (st.result.indexOf("e") >= 0) ? "" : st.result.replace("-", "−");
        } else if (key === "DEL") {
            return initialState();
        } else {
            expr = "";
        }
    }

    var out = { expr: expr, result: "", error: "", done: false };
    var lc = expr.length ? expr.charAt(expr.length - 1) : "";
    var afterValue = isDigit(lc) || lc === ")" || lc === "%";

    if (key === "DEL") { out.expr = expr.slice(0, -1); return out; }

    if (isDigit(key)) {
        if (lc === ")" || lc === "%") return out;
        out.expr = expr + key;
        return out;
    }
    if (key === ".") {
        if (lc === ")" || lc === "%") return out;
        var seg = expr.match(/[0-9.]*$/)[0];
        if (seg.indexOf(".") >= 0) return out;
        out.expr = expr + (seg === "" ? "0." : ".");
        return out;
    }
    if (isOp) {
        if (expr === "" || lc === "(") {
            if (key === "−") out.expr = expr + key;
            return out;
        }
        if (OPS.indexOf(lc) >= 0) {
            if (expr.length === 1) return out;
            out.expr = expr.slice(0, -1) + key;
            return out;
        }
        out.expr = expr + key;
        return out;
    }
    if (key === "%") { if (afterValue) out.expr = expr + key; return out; }
    if (key === "(") { if (!afterValue) out.expr = expr + key; return out; }
    if (key === ")") {
        if (afterValue && count(expr, "(") > count(expr, ")")) out.expr = expr + key;
        return out;
    }
    if (key === "=") {
        if (expr === "") return out;
        var open = count(expr, "(") - count(expr, ")");
        var full = expr;
        for (var i = 0; i < open; i++) full += ")";
        try {
            out.result = format(evaluate(full));
            out.done = true;
        } catch (e) {
            out.error = e.message;
        }
        return out;
    }
    return out;
}

function view(st) {
    if (st.error) return { top: st.expr, main: st.error };
    if (st.done) return { top: st.expr + " =", main: st.result };
    return { top: "", main: st.expr === "" ? "0" : st.expr };
}
