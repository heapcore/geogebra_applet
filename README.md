# geogebra_applet

> **WARNING:** This repository may be unstable or non-functional. Use at your own risk.

Simple GeoGebra applet for creating geometry constructions from either GeoGebra commands or basic English natural-language commands.

It uses [this empty worksheet](https://www.geogebra.org/material/simple/id/3146123) as the construction workspace.

## How To Use

1. Open `index.html` in your browser.
2. Wait for the GeoGebra applet to load.
3. Choose input mode:
   - GeoGebra Commands (for example `A=(4,5)`)
   - Natural Language (English only)
4. Enter one or more commands and click `Go!`.

## Features

- GeoGebra command input
- English natural-language parsing
- Command history output via `Show GeoGebra Commands`

## Project Structure

- `index.html` - main page and GeoGebra applet embedding.
- `src/runtime.js` - applet runtime, shared utilities, tokenization helpers, and pattern registry.
- `src/parser.js` - parser matching and command generation logic.
- `src/main.js` - UI event wiring (button handlers, form submit guards).
- `data/style.css` - page styles.

## Examples

See `EXAMPLES.md` for ready-to-run command sets.

## License

See `LICENSE`.
