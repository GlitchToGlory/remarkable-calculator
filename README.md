# reMarkable Calculator

A standalone calculator app for the **reMarkable Paper Pure**, built as an [AppLoad](https://github.com/asivery/rm-appload) (xovi) QML app. High-contrast, animation-free UI designed for e-ink. This should work on other reMarkable tablets, but has not been tested on all models.

**[Live web demo](https://GlitchToGlory.github.io/remarkable-calculator/)** (same calculation logic as the tablet app)

**[Calculator running on a reMarkable Paper Pure](docs/photo.jpg)**

## Features
- `+ − × ÷ ^`, parentheses, percent, decimals, unary minus
- Proper operator precedence, via a hand-written recursive-descent parser (no `eval`)
- Division-by-zero and syntax errors handled gracefully
- Logic lives in one file (`src/qml/calc.js`) shared by the tablet app and the web demo, with unit tests

## Install on the tablet
Requires developer mode with xovi + AppLoad already installed.

1. Download `calculator.zip` from the Releases page and unzip it (or build it, see below).
2. With the tablet connected by USB (password: Settings → Help → About → Copyrights and licences):
   ```sh
   scp -O -r calculator root@10.11.99.1:/home/root/xovi/exthome/appload/
   ```
3. In AppLoad, tap **Reload**. "Calculator" appears in the launcher.

## Build from source (macOS)
```sh
brew install qt node
./build.sh
```
This runs the tests, compiles the QML into `resources.rcc`, and produces `dist/calculator/` and `dist/calculator.zip`.

## Layout
```
src/qml/main.qml     UI
src/qml/calc.js      parser + keypad state machine (shared with the web demo)
src/resources.qrc    Qt resource manifest
package/             manifest.json + icon.png for AppLoad
docs/                GitHub Pages demo
tests/test.js        node tests/test.js
```

## Notes
- Percent is simple: `50%` = 0.5.
- Not affiliated with reMarkable AS.

## License
MIT
