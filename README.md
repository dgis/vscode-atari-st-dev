# Atari ST Visual Studio Code Extension


Atari ST Dev is a Visual Studio Code extension for building, running and debugging C, C++ and 68k assembly projects targeting Atari ST/TT/Falcon systems. It integrates a cross-toolchain using GCC/GDB, provides debug-time views for CPU registers, memory and hardware information, and hooks into Hatari's debugger via the `cppdbg` debug adapter.

**Features**
- **Compile & Debug:** Integration with a bundled cross-toolchain (m68k-atari-mintelf) and with the VS Code C++ debug adapter (`cppdbg`) to run and debug Atari executables.
- **CPU Registers View:** A view that displays PC, SR, D0–D7, A0–A7, USP/ISP and the next instruction while a debug session is active.
- **Multiple Memory Views:** Four memory views (`Memory1`..`Memory4`) that let you inspect memory dumps, enter addresses (hex), choose column widths.
- **Hardware Tree View:** A tree view of common Atari vectors and hardware addresses (exception vectors, trap vectors, auto-vectors, VBL/HBL, ...). Values are read and updated while debugging.
- **Show in Memory Context Menu:** Right-click integration in Variable/Watch/Hover/Hardware views and some views to open a memory view at a chosen address.
- **Walkthrough & Samples:** A built-in walkthrough to get started (`atariSTDev.gettingStarted` command) and a command (`atariSTDev.getSamples`) to copy sample projects into the active workspace.
- **Debugger Console Integration:** Use the Debug Console to run custom GDB commands via `-exec <gdb command>` and Hatari debugger commands via `-exec monitor <hatari debugger command>`.

**Quick Start**
1. **Open an empty folder:** Open an empty folder.

2. **Copy samples:** Run the command `atariSTDev.getSamples` (Command Palette). This will copy the sample projects into your workspace and open the sample workspace.

3. **Open Run & Debug:** Press `Ctrl+Shift+D` and select a sample debug configuration (the extension supports `cppdbg` configurations). Start debugging with `F5`. You can debug a mix of C, C++ or 68k assembly files.

4. **Open views while debugging:** Open the `Atari ST: CPU` view (Debug view) to see registers, open `Memory1` to inspect memory, and open `Atari ST: Hardware` to view hardware addresses and values.

5. **Show in memory:** While debugging, right click on a variable or a register address and select 'Show in Memory' to open the Memory View at that address. In one of the memory view, you can select until 4 bytes in the hexa dump and right click and select 'Show in Memory' contextual menu too.

6. **Open Disassembly view:** Open the Disassembly View to see the current disassembly (in GDB format) while debugging. You can right click on the Call Stack view and select 'Open Disassembly View' to open the Disassembly View at that function (This view is a built-in VS Code debug feature).

7. **Open Debug Console:** Open the Debug Console to access the console. While debugging, in the vscode "Debug console", you can run the following commands:
    * for gdb: `> -exec info registers`
    * for hatari debugger: `> -exec monitor disasm`

**Notes**
- **C/C++ extension:** The extension depends on `ms-vscode.cpptools` for the `cppdbg` debug adapter features.
- **Included SDK:** A packaged SDK with Hatari and cross-compilers is included in the extension for the platform Linux, Windows and MacOS.
- **Activate the extension:** Like you can see in the samples, this extension is activated when you add the following setting in the current project. In `.vscode/settings.json` set:
    `{
        "atariSTDev.activate": true
    }`

**Contributed Commands**
- **`atariSTDev.getSamples`**: Copy sample projects into the active workspace and (if present) open the provided workspace file.
- **`atariSTDev.showInMemory1..4`**: Open the corresponding memory view at a provided address.
- **`atariSTDev.refreshMemory1..4`**: Refresh the contents of a memory view (exposed in the view title menu). This can be useful when modifying memory in another way, for example with the GDB or Hatari debugger.

**Views & UI Elements**
- **`Atari ST: CPU`**: Webview showing CPU registers and a small hatari/hardware summary. Visible in the Debug view when `atariSTDev.showDebugViews` context is true and `cppdbg` is used.
- **`Memory1`..`Memory4`**: Webviews for hex/ASCII memory dump exploration. Memory panes can be focused via commands and show content using debug adapter custom requests.
- **`Atari ST: Hardware`**: Tree view listing vectors and hardware addresses with live values while debugging.
- **Walkthrough**: `atariSTDev.gettingStarted` walkthrough to guide copying samples and opening views.

**Configuration Settings**
- **`atariSTDev.activate`**: (boolean, workspace scope) Enable the extension in this workspace. Default is `false` — set to `true` in `.vscode/settings.json` to activate features and views.
- **`atariSTDev.path`**: (string, workspace scope) Path to an Atari toolchain. This settings is automatically set by this extension.

**Debug Console Usage**
- **GDB commands:** In the Debug Console you can run `-exec <gdb command>` to forward commands to GDB, for example:
	`-exec help`
	`-exec info registers`
	`-exec x/5i $pc`
- **Hatari monitor commands:** Use `-exec monitor <hatari command>` to query Hatari's internal debugger, for example:
	`-exec monitor help`
	`-exec monitor info`
	`-exec monitor cpureg`
	`-exec monitor disasm`
	`-exec monitor memdump`

**Known Issues & Limitations**
- **TRAP and Step Over:** If a function contains a `TRAP` instruction, the debugger may be unable to 'step over' it — set a breakpoint after the call and continue instead.
- **Filenames and GEMDOS:** Avoid program filenames that rely on more than 8.3 compatibility; GEMDOS code (in the Hatari emulator) can confuse similar short names.
- **Disassembly syntax:** The Disassembly view (VS Code built-in) may show GDB-style output instead of classic DevPack syntax.
- **Encoding:** Use code page 437 or a font that matches Atari ST characters when viewing Atari source files for best visual fidelity.

**Repository & Support**
- **Repository:** `https://github.com/dgis/vscode-atari-st-dev`
- **Issue tracker:** Use the repository issues to report bugs or feature requests.


**License**
- Licensed under the GNU General Public License v3.0


## TODO
* Improve walkthroughs
* Improve README.md
* Add C/M libs
* Add a GEM sample
* Add a graphic inspector view
* Add profiling


## Greetings


