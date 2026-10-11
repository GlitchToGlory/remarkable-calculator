// Run with: node tests/test.js
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/../src/qml/calc.js", "utf8").replace(/^\.pragma library.*$/m, "");
const C = new Function(src + "; return { evaluate, format, press, initialState, view };")();
let failed = 0;
function eq(a, b, name) { if (a !== b) { failed++; console.log("FAIL", name, "got", a, "expected", b); } }
const run = (keys) => { let s = C.initialState(); for (const k of keys.split(" ")) s = C.press(s, k); return s; };

eq(C.evaluate("2+3×4"), 14, "precedence");
eq(C.evaluate("(2+3)×4"), 20, "parens");
eq(C.evaluate("2^3^2"), 512, "right-assoc power");
eq(C.evaluate("50%"), 0.5, "percent");
eq(C.evaluate("−5+2"), -3, "unary minus");
eq(C.format(0.1 + 0.2), "0.3", "float rounding");
eq(run("1 2 + 3 =").result, "15", "keypad add");
eq(run("1 ÷ 0 =").error, "Cannot divide by zero", "div zero");
eq(run("( 1 + 2 =").result, "3", "auto-close paren");
eq(run("5 + =").error, "Incomplete expression", "trailing op");
eq(run("2 × 3 = + 4 =").result, "10", "continue from result");
eq(run("1 . 5 . 2").expr, "1.52", "single decimal point");
eq(run("+ 5").expr, "5", "leading plus ignored");
eq(run("5 + × 3").expr, "5×3", "operator replace");
console.log(failed ? failed + " test(s) failed" : "All tests passed");
process.exit(failed ? 1 : 0);
