This sample shows simple GEM usage and it contains the resource file "main.rsc".
It can be edited with ORCS from Thorsten Otto ( https://tho-otto.de/downloads.html ).
Be careful, if you edit this file with the Windows version of ORCS, you must to swap the bytes using the following tool (part of ORCS):
> tools\rscconv.exe -s main.rsc

Some useful guides:
* "A Guide to GEM Programming in C using AHCC" written by Peter Lane  ( https://peterlane.codeberg.page/firebee/gem-guide.html and its samples: https://codeberg.org/peterlane/firebee/src/branch/trunk/gemguide/SOURCE )
* "C-manship" written by Clayton Walnum ( https://info-coach.fr/atari/software/_development/cmanship-v1.0.pdf and its samples: https://github.com/pjones1063/AtariST-CManship/tree/master/SRC )

To go beyond simple GEM API, you can leverage advanced GEM libraries:
* Windom ( https://windom.sourceforge.net/ , binaries: https://tho-otto.de/crossmint.php )
* CFLib ( https://github.com/freemint/cflib , binaries: https://tho-otto.de/crossmint.php )
