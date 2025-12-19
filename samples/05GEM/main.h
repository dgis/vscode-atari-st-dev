/*
 * resource set indices for main
 *
 * created by ORCS 2.18
 */

/*
 * Number of Strings:        15
 * Number of Bitblks:        0
 * Number of Iconblks:       0
 * Number of Color Iconblks: 0
 * Number of Color Icons:    0
 * Number of Tedinfos:       0
 * Number of Free Strings:   0
 * Number of Free Images:    0
 * Number of Objects:        22
 * Number of Trees:          1
 * Number of Userblks:       0
 * Number of Images:         0
 * Total file size:          778
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
#define NUM_STRINGS 15
#define NUM_FRSTR 0
#define NUM_UD 0
#define NUM_IMAGES 0
#define NUM_BB 0
#define NUM_FRIMG 0
#define NUM_IB 0
#define NUM_CIB 0
#define NUM_TI 0
#define NUM_OBS 22
#define NUM_TREE 1
#endif



#define SAMPLE                             0 /* menu */




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
