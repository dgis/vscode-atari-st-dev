This sample shows how to compile the program into assembly language and run it.
It uses parts of the excellent sprite example from Perihelion!

The "sprite.pi1" has been created this way:
1) In Inkscape, edit "01 atari-color-background.svg",
2) export to "02 atari-color-background.png".
3) In Gimp, create a 16 colors palette "03 atari-gimp-palette.gpl".
4) In Gimp 2.10:
    * import "02 atari-color-background.png",
    * menu "Image / Mode / Indexed...",
    * dialog "Convert Image to Indexed Colors / Colormap / Use custom palette",
    * choose the previous Atari palette "03 atari-gimp-palette.gpl",
    * "Convert"
    This is "04 atari-color-sprite-16-colors.xcf".
5) "Export Image as PNG", using "automatic pixelformat".
    And because there are only 16 colors, Gimp 2.10 saves it with only 4 bits depth
    with the previous palette with colors in correct order
    (Unfortunetly, it does NOT work anymore with Gimp 3.x that gives 8 bits depth).
    This is "05 atari-color-sprite-16-colors.png".
6) Using XnView MP, use "Batch convert..." to convert to format "PI1 - Degas & Degas Elite",
    This is "06 atari-color-sprite-16-colors-xnview.pi1"=="sprite.pi1".
The image "backgrnd.pi1" follows the same procedure from "07 atari-color-background-16-colors.xcf" to "09 atari-color-background-16-colors-xnview.pi1".

Some useful guides:
* "The Atari ST MC68000 Assembly Language Tutorials" written by Perihelion ( https://nguillaumin.github.io/perihelion-m68k-tutorials/_of_making_the_mountain_move_to_mohammed.html )
