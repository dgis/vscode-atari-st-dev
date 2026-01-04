This sample demonstrate how to call an assembly function from C.
In C, the function generate_raster() builds the palette array containing per-scanline color values and frame delimiters.
Then, the assembly routine demoASM() reads this table at runtime to produce animated raster (scanline) effects.

Some useful guides:
* "The Atari ST MC68000 Assembly Language Tutorials" written by Perihelion ( https://nguillaumin.github.io/perihelion-m68k-tutorials/_of_revealing_the_unseen_and_expanding_our_consciousness_without_the_use_of_illegal_drugs.html )
* "Atari ST : coopération C et Assembleur" by fxrobin ( https://www.fxjavadevblog.fr/m68k-atari-st-assembly-and-c/ )
* "How to use VASM m68k assembly code within GCC C/C++ programs" by buserror ( https://bus-error.nokturnal.pl/article1-How-to-use-VASM-m68k-assembly-code-within-GCC-C-C-programs )