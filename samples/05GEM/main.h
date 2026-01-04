/*
 * resource set indices for main
 *
 * created by ORCS 2.18
 */

/*
 * Number of Strings:        28
 * Number of Bitblks:        0
 * Number of Iconblks:       1
 * Number of Color Iconblks: 0
 * Number of Color Icons:    0
 * Number of Tedinfos:       2
 * Number of Free Strings:   0
 * Number of Free Images:    0
 * Number of Objects:        33
 * Number of Trees:          2
 * Number of Userblks:       0
 * Number of Images:         2
 * Total file size:          1548
 */

#undef RSC_NAME
#ifndef __ALCYON__
#define RSC_NAME "main"
#endif
#undef RSC_ID
#ifdef main
#define RSC_ID main
#else
#define RSC_ID 0
#endif

#ifndef RSC_STATIC_FILE
# define RSC_STATIC_FILE 0
#endif
#if !RSC_STATIC_FILE
#define NUM_STRINGS 28
#define NUM_FRSTR 0
#define NUM_UD 0
#define NUM_IMAGES 2
#define NUM_BB 0
#define NUM_FRIMG 0
#define NUM_IB 1
#define NUM_CIB 0
#define NUM_TI 2
#define NUM_OBS 33
#define NUM_TREE 2
#endif



#define MENU_MAIN                          0 /* menu */
#define MENU_ABOUT                         8 /* STRING in tree MENU_MAIN */
#define MENU_QUIT                         17 /* STRING in tree MENU_MAIN */
#define MENU_WINDOW1                      19 /* STRING in tree MENU_MAIN */
#define MENU_WINDOW2                      20 /* STRING in tree MENU_MAIN */
#define MENU_DIALOG                       21 /* STRING in tree MENU_MAIN */

#define DIALOG_MAIN                        1 /* form/dialog */
#define DIALOG_BUTTON_OK                   1 /* BUTTON in tree DIALOG_MAIN */
#define DIALOG_BUTTON_CANCEL               2 /* BUTTON in tree DIALOG_MAIN */
#define DIALOG_STRING_TITLE                3 /* STRING in tree DIALOG_MAIN */
#define DIALOG_ICON                        4 /* ICON in tree DIALOG_MAIN */
#define DIALOG_BOX_1                       5 /* BOX in tree DIALOG_MAIN */
#define DIALOG_STRING_RADIO_BUTTONS        6 /* STRING in tree DIALOG_MAIN */
#define DIALOG_RADIO_BUTTON_1              7 /* BUTTON in tree DIALOG_MAIN */
#define DIALOG_RADIO_BUTTON_2              8 /* BUTTON in tree DIALOG_MAIN */
#define DIALOG_EDIT_NAME                   9 /* FTEXT in tree DIALOG_MAIN */
#define DIALOG_EDIT_NUMBER                10 /* FTEXT in tree DIALOG_MAIN */




#ifdef __STDC__
#ifndef _WORD
#  ifdef WORD
#    define _WORD WORD
#  else
#    define _WORD short
#  endif
#endif
extern _WORD main_rsc_load(_WORD wchar, _WORD hchar);
extern _WORD main_rsc_gaddr(_WORD type, _WORD idx, void *gaddr);
extern _WORD main_rsc_free(void);
#endif
