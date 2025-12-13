# Atari ST Visual Studio Code Extension

This extension allows to compile and debug C/C++/Assembly programs for Atari ST/TT/Falcon using GCC/GDB and a modify version of the Hatari emulator.

## Features





## Requirements





## Extension Settings

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

* While debugging, if a function contain a TRAP instruction, the debugger is unable to 'step over'. You must set a breakpoint after the function and continue execution until it is reached.
* Be careful not to name the program with more than 8.3 characters, because the GEMDOS code of the Hatari emulator could misinterpret it ("MAINPROG1.PRG" and "MAINPROG2.PRG" can be confused)!
* The disassembly view uses Intel syntax instead of DevPack syntax.
* Use code page 437 to view the Atari source file, as it closely matches the Atari ST's ASCII characters.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release

---


## TODO
* Improve walkthroughs
* Improve README.md
* Add C/M libs
* Add a GEM sample
* Add a graphic inspector webview
* Add profiling


## Greetings


**Enjoy!**
