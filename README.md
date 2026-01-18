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
- **Debug and watch a variable in hexadecimal** While debugging, to see a variable in hexadecimal instead of decimal, just add the suffix ",h" to the variable name in the watch view. For example, to watch the variable name "myVariable" in hexa, rename your variable to "myVariable,h". There is the same for binary ",b" and octal ",o". To watch a variable address, just put "&" before the variable name like "&my_variable".

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


# TODO
* Improve README.md
* Improve samples.
* Add address suggestion list with symbols.
* Replace string bufer in ArrayBuffer.
* Assembly symbols addresses cannot be seen.
* Add profiling


# Greetings

This Visual Code extension is a puzzle whose pieces mostly come from:
* Hatari HRDB (http://clarets.org/steve/projects/hrdb.html https://github.com/tattlemuss/hatari),
* Hatari (https://www.hatari-emu.org/ https://framagit.org/hatari/hatari),
* Thorsen Otto (https://tho-otto.de/crossmint.php),
* Vincent Riviere (http://vincent.riviere.free.fr/soft/m68k-atari-mintelf/),
* Freemint project (https://freemint.github.io/),
* Vasm (http://sun.hasenbraten.de/vasm/),
* and others...



# SDK

This extension comes with a "/sdk" folder that contains what I named an Atari ST SDK.

This SDK allows to build and debug an Atari ST program with Visual Studio Code and a modified Hatari emulator.
It uses only the Mint ELF version because the debug info contains in an ELF binary is well supported by GDB.

## The propose directory tree
```
├── darwin
│   ├── bin
│   │   └── vasmm68k_mot
│   ├── hatari
│   │   ├── db.ini
│   │   ├── etos512us.img
│   │   ├── Hatari.app
│   └── opt
│       └── cross-mint
│           ├── bin
│           │   ├── m68k-atari-mintelf-gcc
│           │   ├── m68k-atari-mintelf-gdb
│           │   └── ...
│           ├── m68k-atari-mintelf
│           │   ├── sys-root
│           │   └── ...
│           └── ...
├── linux
│   ├── bin
│   │   └── vasmm68k_mot
│   ├── hatari
│   │   ├── db.ini
│   │   ├── etos512us.img
│   │   ├── hatari
│   └── opt
│       └── cross-mint
│           ├── bin
│           │   ├── m68k-atari-mintelf-gcc
│           │   ├── m68k-atari-mintelf-gdb
│           │   └── ...
│           ├── m68k-atari-mintelf
│           │   ├── sys-root
│           │   └── ...
│           └── ...
└── win32
    ├── bin
    │   ├── make.exe
    │   └── vasmm68k_mot.exe
    ├── hatari
    │   ├── db.ini
    │   ├── etos512us.img
    │   ├── hatari.exe
    └── opt
        └── cross-mint
            ├── bin
            │   ├── m68k-atari-mintelf-gcc.exe
            │   ├── m68k-atari-mintelf-gdb.exe
            │   └── ...
            ├── usr
            │   └── m68k-atari-mintelf
            │       ├── sys-root
            │       └── ...
            └── ...
```

"m68k-atari-mintelf/sys-root/usr/*" contains folders "include/" and "lib/" for MiNTLib (libc), fdlibm (libm) and GEMlib (libgem) coming from https://tho-otto.de/crossmint.php .


## Build this SDK

To build this SDK, we need binutils, GCC, GDB and a special Hatari emulator version which accepts to be debugged from GDB.

### To obtain binutils, GCC and GDB

From https://tho-otto.de/crossmint.php :
```
wget https://tho-otto.de/download/mint/binutils-2.45-mintelf-20250812-bin-cygwin64.tar.xz
wget https://tho-otto.de/download/mint/binutils-2.45-mintelf-20250812-bin-linux64.tar.xz
wget https://tho-otto.de/download/mint/binutils-2.45-mintelf-20250812-bin-macos.tar.xz

wget https://tho-otto.de/download/mint/gcc-15.2.0-mintelf-20250810-bin-cygwin64.tar.xz
wget https://tho-otto.de/download/mint/gcc-15.2.0-mintelf-20250810-bin-linux64.tar.xz
wget https://tho-otto.de/download/mint/gcc-15.2.0-mintelf-20250810-bin-macos.tar.xz

wget https://tho-otto.de/download/mint/gdb-17.0-mintelf-20250812-bin-cygwin64.tar.xz
wget https://tho-otto.de/download/mint/gdb-17.0-mintelf-20250812-bin-linux64.tar.xz
```
(This package does not have a dynamic library; therefore, it must be compiled under Ubuntu. Similarly, for macOS, no binary package is available; it must also be recompiled).
```
tar -xf binutils-2.45-mintelf-20250812-bin-cygwin64.tar.xz -C $ATARIST_SDK/tools/win32
tar -xf gcc-15.2.0-mintelf-20250810-bin-cygwin64.tar.xz -C $ATARIST_SDK/tools/win32
tar -xf gdb-17.0-mintelf-20250812-bin-cygwin64.tar.xz -C $ATARIST_SDK/tools/win32

tar -xf binutils-2.45-mintelf-20250812-bin-linux64.tar.xz -C $ATARIST_SDK/tools/linux
tar -xf gcc-15.2.0-mintelf-20250810-bin-linux64.tar.xz -C $ATARIST_SDK/tools/linux
```
Need to build GDB or if it works for you: `tar -xf gdb-17.0-mintelf-20250812-bin-linux64.tar.xz -C $ATARIST_SDK/tools/linux`
```
tar -xf binutils-2.45-mintelf-20250812-bin-macos.tar.xz -C $ATARIST_SDK/tools/darwin
tar -xf gcc-15.2.0-mintelf-20250810-bin-macos.tar.xz -C $ATARIST_SDK/tools/darwin
```
Need to build GDB for macOS.

For Windows, we also need to copy the Cygwin DLLs that the processes require.

### To build HATARI
To build Hatari with HRDB and GDB (Server) support.

#### on Linux and Windows with Mingw64
```
git clone https://github.com/dgis/hatari.git
cd hatari
mkdir -p Release
cd Release/
cmake ..
cmake --build . -j$(getconf _NPROCESSORS_ONLN)
```
The built Hatari binary is "./Release/src/hatari".
```
strip Release/src/hatari
cp Release/src/hatari $ATARIST_SDK/tools/linux/hatari/hatari
```

(
To build the Debug version:
```
mkdir -p Debug
cd Debug/
cmake -DCMAKE_BUILD_TYPE=Debug ..
cmake --build . -j$(getconf _NPROCESSORS_ONLN)
```
)

#### on macOS

Install homebrew, and clone the source code:
```
brew install wget cmake
git clone https://github.com/dgis/hatari.git
cd hatari
```

and then, launch the following script:
```
#!/bin/bash

# This script build Hatari for x86_64 and arm64 on MacOS.
# Run this script in the Hatari repository. It builds both architectures in the same binary.

# Install prerequisites:
# 	brew install wget cmake


# Stop script on error
set -e

# Unset HOMEBREW_PREFIX to prevent CMake from overriding architecture settings
unset HOMEBREW_PREFIX

# Cleanup
rm -fr ./dl_cache ./build ./hatari-snapshot ./hatari-snapshot.zip

# Prepare dependencies
SDLVERSION=2.26.5
PNGVERSION=1.6.48
if [ ! -d dl_cache ]; then mkdir dl_cache ; fi

# Download and install precompiled SDL2 Framework
if [ ! -d ~/Library/Frameworks/SDL2.framework ]; then
    wget -O dl_cache/SDL2-$SDLVERSION.dmg https://github.com/libsdl-org/SDL/releases/download/release-$SDLVERSION/SDL2-$SDLVERSION.dmg ;
    hdiutil attach dl_cache/SDL2-$SDLVERSION.dmg
    cp -a /Volumes/SDL2/SDL2.framework ~/Library/Frameworks/
    hdiutil detach /Volumes/SDL2
fi

# Download, compile and install libpng Framework
if [ ! -d ~/Library/Frameworks/png.framework ]; then
    wget -O dl_cache/libpng-$PNGVERSION.tar.xz "http://prdownloads.sourceforge.net/libpng/libpng-$PNGVERSION.tar.xz?download" ;
    tar -xJf dl_cache/libpng-$PNGVERSION.tar.xz ;
    cd libpng-$PNGVERSION ;
    cmake -DPNG_FRAMEWORK=ON -DPNG_HARDWARE_OPTIMIZATIONS=OFF \
        -DCMAKE_OSX_DEPLOYMENT_TARGET:STRING="10.13" \
        -DCMAKE_OSX_ARCHITECTURES:STRING="arm64;x86_64" . ;
    cmake --build . --verbose --config Release -j$(sysctl -n hw.ncpu) ;
    codesign --force -s - png.framework ;
    cd .. ;
    mv libpng-$PNGVERSION/png.framework dl_cache/ ;
    rm -rf libpng-$PNGVERSION ;
    cp -a dl_cache/png.framework ~/Library/Frameworks/
fi

# Download and install precompiled portmidi Framework
if [ ! -d ~/Library/Frameworks/portmidi.framework ]; then
    cd dl_cache ;
    wget "https://hatari.tuxfamily.org/ci/portmidi.framework.zip" ;
    unzip portmidi.framework.zip ;
    mv license.txt portmidi-license.txt ;
    cd .. ;
    cp -a dl_cache/portmidi.framework ~/Library/Frameworks/
fi

# Download and install precompiled capsimage Framework
if [ ! -d ~/Library/Frameworks/CAPSImage.framework ]; then
    cd dl_cache ;
    wget "https://hatari.tuxfamily.org/ci/capsimage_5.1_macos-x86_64-arm64_selfsigned.zip" ;
    unzip capsimage_5.1_macos-x86_64-arm64_selfsigned.zip ;
    cd capsimage_5.1_macos-x86_64-arm64 ;
    mv LICENCE.txt DONATIONS.txt README.txt HISTORY.txt CAPSImage.framework ;
    cd ../.. ;
    cp -r dl_cache/capsimage_5.1_macos-x86_64-arm64/CAPSImage.framework ~/Library/Frameworks/
fi

# Build Hatari
mkdir build
cd build

cmake -DCMAKE_OSX_DEPLOYMENT_TARGET:STRING="10.13" \
    -DCMAKE_OSX_ARCHITECTURES:STRING="arm64;x86_64" ..
cmake --build . --verbose --config Release -j$(sysctl -n hw.ncpu) -t Hatari
cp -a ~/Library/Frameworks/portmidi.framework src/hatari.app/Contents/Frameworks/
cp -a ~/Library/Frameworks/CAPSImage.framework src/hatari.app/Contents/Frameworks/
codesign --force -s - --entitlements ../src/gui-osx/hatari.app.xcent src/Hatari.app
cd ..
mkdir hatari-snapshot
echo $(git rev-parse HEAD) > hatari-snapshot/version.txt
date >> hatari-snapshot/version.txt
cp -a build/src/Hatari.app hatari-snapshot/
cp -a doc gpl.txt readme.txt hatari-snapshot/
zip -r hatari-snapshot.zip hatari-snapshot
```


### To build GDB:
To build GDB with m68k-atari-mintelf support

#### On Linux

```
sudo apt install wget git gcc libgmp-dev libmpfr-dev texinfo
```

From https://tho-otto.de/crossmint.php:
```
wget https://tho-otto.de/download/mint/binutils-2.45-mint-20250812.tar.xz
tar -xf binutils-2.45-mint-20250812.tar.xz

git clone https://sourceware.org/git/binutils-gdb.git
cd binutils-gdb
git checkout binutils-2_45-branch
git apply --3way ../patches/binutils/binutils-2.45-mint-20250812.patch
git apply ../patches/binutils/binutils-m68k-segmentalign.patch
```


In the file: "include/libcwrap.h", you need to comment out the following line of code:
`SYMVER(__fdelt_chk, GLIBC_DONT_USE_THIS_VERSION_2.15)`
in:
`// SYMVER(__fdelt_chk, GLIBC_DONT_USE_THIS_VERSION_2.15)`

Then:
```
./configure --host=x86_64-pc-linux-gnu --target=m68k-atari-mintelf \
    --enable-targets=x86_64-pc-linux-gnu,m68k-atari-mint \
    --with-auto-load-dir=$debugdir:$datadir/auto-load \
    --with-auto-load-safe-path=$debugdir:$datadir/auto-load \
    --without-expat \
    --with-gdb-datadir=/usr/share/gdb \
    --with-jit-reader-dir=/usr/lib/gdb \
    --without-libunwind-ia64 \
    --without-lzma \
    --without-babeltrace \
    --without-intel-pt \
    --without-xxhash \
    --without-python \
    --without-python-libdir \
    --without-debuginfod \
    --with-curses \
    --without-guile \
    --without-amd-dbgapi \
    --disable-source-highlight \
    --disable-threading \
    --enable-tui \
    --without-system-readline \
    --with-separate-debug-dir=/usr/lib/debug \
    --with-sysroot=/usr/m68k-atari-mintelf/sys-root \
    --disable-werror
make -j$(getconf _NPROCESSORS_ONLN)

strip gdb/gdb
cp gdb/gdb $ATARIST_SDK/tools/linux/opt/cross-mint/bin/m68k-atari-mintelf-gdb
cp gdb/gdb-add-index $ATARIST_SDK/tools/linux/opt/cross-mint/bin/m68k-atari-mintelf-gdb-add-index
```

#### On MacOS:

To build an universal fat binary, we need to build gdb for arm64 and for x86_64,
and then merge both as a single binary.

You need Homebrew for arm64 and for x86_64!
On an Apple silicon macOS (must be adapted on an Intel macOS):

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/opt/homebrew/bin/brew shellenv)"
brew install wget cmake gmp mpfr libmpc texinfo

arch -x86_64 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
eval "$(/usr/local/homebrew/bin/brew shellenv)"
brew install gmp mpfr

eval "$(/opt/homebrew/bin/brew shellenv)"
```


From https://tho-otto.de/crossmint.php:
```
wget https://tho-otto.de/download/mint/binutils-2.45-mint-20250812.tar.xz
tar -xf binutils-2.45-mint-20250812.tar.xz

git clone https://sourceware.org/git/binutils-gdb.git
cd binutils-gdb
git checkout binutils-2_45-branch
git apply --3way ../patches/binutils/binutils-2.45-mint-20250812.patch
git apply ../patches/binutils/binutils-m68k-segmentalign.patch
```


And then, in the script (after), uncomment:
```
export MACOSX_DEPLOYMENT_TARGET=11
ARCHS="-arch arm64"
HOSTBUILD="aarch64-apple-darwin"
HOMEBREWDIR=/opt/homebrew
```
and launch the script to build for arm64. Keep a copy of the built 'gdb' binary.

And then, in the same script (after), uncomment:
```
export MACOSX_DEPLOYMENT_TARGET=10.6
ARCHS="-arch x86_64"
HOSTBUILD="x86_64-apple-darwin"
HOMEBREWDIR=/usr/local/homebrew
```
and launch the script to build for intel. Keep a copy of the built 'gdb' binary.

Here the full script:
```
#!/bin/sh

# This script build gdb (gdb/gdb).
# Run this script in the binutils-gdb repository.

# Multi arch with Homebrew on M1+ (https://codetinkering.com/switch-homebrew-arm-x86/)
# In ARM64:
# 	/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# 	eval "$(/opt/homebrew/bin/brew shellenv)"
# 	brew install wget cmake gmp mpfr libmpc texinfo
# For x86_64:
# 	arch -x86_64 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# 	eval "$(/usr/local/homebrew/bin/brew shellenv)"
# 	brew install gmp mpfr


# Uncomment the following to build for arm64:
# export MACOSX_DEPLOYMENT_TARGET=11
# # ARCHS="-arch arm64"
# HOSTBUILD="aarch64-apple-darwin"
# HOMEBREWDIR=/opt/homebrew

# Uncomment the following to build for x86_64:
export MACOSX_DEPLOYMENT_TARGET=10.6
ARCHS="-arch x86_64"
HOSTBUILD="x86_64-apple-darwin"
HOMEBREWDIR=/usr/local/homebrew


# And then, build the universal binary 
# lipo -create gdb-arm64 -create gdb-x86_64 -output m68k-atari-mintelf-gdb

# Verify architectures and dependencies:
# otool -L gdb/gdb
# lipo -info gdb/gdb
# objdump -a gdb/gdb
# file gdb/gdb




# Stop script on error
set -e

PACKAGENAME=binutils
VERSION=-2.45
VERSIONPATCH=-20250812
REVISION="GNU Binutils for MiNT ELF ${VERSIONPATCH#-}"

configure_build() {
    cd $1
    ./configure \
        MAKEINFO="echo texinfo 7.0" \
        --host=$HOSTBUILD \
        --target=m68k-atari-mintelf \
        --enable-targets=$HOSTBUILD,m68k-atari-mint \
        --with-pkgversion="$REVISION" \
        --with-gdb-datadir=/usr/share/gdb \
        --with-jit-reader-dir=/usr/lib/gdb \
        --without-expat \
        --without-libunwind-ia64 \
        --without-lzma \
        --without-babeltrace \
        --without-intel-pt \
        --without-xxhash \
        --without-python \
        --without-python-libdir \
        --without-debuginfod \
        --with-curses \
        --without-guile \
        --without-amd-dbgapi \
        --disable-source-highlight \
        --disable-threading \
        --enable-tui \
        --enable-static \
        --without-system-readline \
        --with-separate-debug-dir=/usr/lib/debug \
        --with-sysroot=/usr/m68k-atari-mintelf/sys-root \
        --disable-werror \
        --enable-lto \
        --enable-plugins \
        CFLAGS="-O2 ${ARCHS}" \
        CXXFLAGS="-O2 ${ARCHS}" \
        LDFLAGS="-s ${ARCHS}" \
        --with-gmp="$HOMEBREWDIR" \
        GMPINC=-I$HOMEBREWDIR/include \
        GMPLIBS="$HOMEBREWDIR/lib/libgmp.a $HOMEBREWDIR/lib/libmpfr.a"
    make -j$(sysctl -n hw.ncpu)
    cd ..
}

configure_build gnulib
configure_build libbacktrace
configure_build libdecnumber
configure_build gdbsupport
configure_build libiberty
configure_build libsframe
configure_build opcodes
configure_build bfd
configure_build sim
configure_build libctf
configure_build readline
configure_build gdb
```

And then, you can generate the universal binary with:
```
lipo -create gdb-arm64 -create gdb-x86_64 -output m68k-atari-mintelf-gdb
```


