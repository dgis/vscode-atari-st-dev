# Change Log

All notable changes to the "Atari ST Dev" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.1.2] - 2026-03-14

- Fix Thorsten typo and following Thorsten hints, simplify binutils (for gdb) build in the README.md .
- Rebuild m68k-atari-mintelf-gdb without the ncurses library by removing the uneeded "-tui" option for this extension.


## [0.1.1] - 2026-02-26

- Remove common "sys-root" symlinks between win32, darwin and linux because VSCE does not support directory symlinks (only file symlinks).
- Adjust paths containing spaces when launching the debugging (on Linux and MacOS, not yet working on Windows because of Cygwin GDB).


## [0.1.0] - 2026-02-24

- Initial release
