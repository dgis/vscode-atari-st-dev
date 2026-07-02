# Change Log

All notable changes to the "Atari ST Dev" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.2.1] - 2026-07-02

- Regenerate installation package from a non Windows environment to keep the executable permissions.


## [0.2.0] - 2026-04-29

- Allow to save the bitmap from the graphic inspector view.
- Adjust samples configurations.
- Rebuild GDB with Mingw64 for Windows to resolve path space issues during debugging.


## [0.1.2] - 2026-03-14

- Fix Thorsten typo and following Thorsten hints, simplify binutils (for gdb) build in the README.md .
- Rebuild m68k-atari-mintelf-gdb without the ncurses library by removing the uneeded "-tui" option for this extension.


## [0.1.1] - 2026-02-26

- Remove common "sys-root" symlinks between win32, darwin and linux because VSCE does not support directory symlinks (only file symlinks).
- Adjust paths containing spaces when launching the debugging (on Linux and MacOS, not yet working on Windows because of Cygwin GDB).


## [0.1.0] - 2026-02-24

- Initial release
