# Building a shell command database

We pull from several sources to populate the command database.

_Note: all commands to be run from this directory, `assets/commands/`._

## From \$PATH (Fedora)

Get all executables from the \$PATH and all built-in bash functions.

    compgen -bc > from-path-fedora.txt

Get all DNF packages (this does not get executable names).

    dnf list all

## JavaScript

A few types of JS code are accepted.

- all [keywords](https://tc39.github.io/ecma262/#sec-keywords)
- some [literals](https://tc39.github.io/ecma262/#sec-ecmascript-language-lexical-grammar-literals)
  - literals to include: `null`, `true`, `false`
- all [properties of the global object](https://tc39.github.io/ecma262/#sec-global-object)
- all objects listed in [chapters 19-26](https://tc39.github.io/ecma262/#sec-fundamental-objects)
  - for example, the subchapters of chapter 19 are "Object Objects", "Function Objects", "Boolean Objects", "Symbol Objects", and "Error Objects", so `object`, `function`, `boolean`, `symbol`, and `error` should be used.
- additional [built-in properties of the global object](https://tc39.github.io/ecma262/#sec-additional-properties-of-the-global-object)
- `async` should be added. it won't appear in the above lists because it is not a proper keyword (it's only a keyword in certain contexts but can still be used as a variable name, etc).
- `window`, `document`, `navigator` I can't find in any spec but should be included

## Git

Get all core git commands from `/usr/lib/git-core/`.
