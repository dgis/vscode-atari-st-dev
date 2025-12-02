/* Definitions of target machine for GCC for Atari ST TOS/MiNT.
   Copyright (C) 1994-2023 Free Software Foundation, Inc.

This file is part of GCC.

GCC is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 3, or (at your option)
any later version.

GCC is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with GCC; see the file COPYING3.  If not see
<http://www.gnu.org/licenses/>.  */

/* Here are four prefixes that are used by asm_fprintf to
   facilitate customization for alternate assembler syntaxes.
   Machines with no likelihood of an alternate syntax need not
   define these and need not use asm_fprintf.  */

/* The prefix for register names.  Note that REGISTER_NAMES
   is supposed to include this prefix. Also note that this is NOT an
   fprintf format string, it is a literal string */

#undef REGISTER_PREFIX
#define REGISTER_PREFIX "%"

/* The prefix for local (compiler generated) labels.
   These labels will not appear in the symbol table.  */

#undef LOCAL_LABEL_PREFIX
#define LOCAL_LABEL_PREFIX "."

#undef ASM_COMMENT_START
#define ASM_COMMENT_START "|"

/* with fdlibm, most of the c99 functions are available, including sincos */
#undef TARGET_LIBC_HAS_FUNCTION
#define TARGET_LIBC_HAS_FUNCTION bsd_libc_has_function

#undef WCHAR_TYPE
#define WCHAR_TYPE "short unsigned int"

#undef WCHAR_TYPE_SIZE
#define WCHAR_TYPE_SIZE SHORT_TYPE_SIZE

#if HAVE_INITFINI_ARRAY_SUPPORT
#define GCC_HAVE_INITFINI_ARRAY_SUPPORT builtin_define ("__GCC_HAVE_INITFINI_ARRAY_SUPPORT");
#else
#define GCC_HAVE_INITFINI_ARRAY_SUPPORT
#endif

#undef TARGET_OS_CPP_BUILTINS
#define TARGET_OS_CPP_BUILTINS()		\
  do						\
    {						\
      builtin_define ("__MINT__");		\
      GCC_HAVE_INITFINI_ARRAY_SUPPORT \
      /* The GNU C++ standard library requires this.  */ \
      if (c_dialect_cxx ()) \
       builtin_define ("_GNU_SOURCE"); \
      builtin_define_std ("atarist");		\
      builtin_assert ("machine=atari");		\
      builtin_assert ("system=mint");		\
    }						\
  while (0)

/* The following defines are nonstandard
   and are kept only for compatibility
   with older versions of GCC for MiNT.  */

#undef CPP_SPEC
#define CPP_SPEC			\
  "%{m68000|mcpu=68000:-D__M68000__} "		\
  "%{m68020|mcpu=68020:-D__M68020__} "		\
  "%{m68030|mcpu=68030:-D__M68020__} "		\
  "%{m68040|mcpu=68040:-D__M68020__} "		\
  "%{m68060|mcpu=68060:-D__M68020__} "		\
  "%{m68020-40|mcpu=68020-40:-D__M68020__} "		\
  "%{m68020-60|mcpu=68020-60:-D__M68020__} "		\
  "%{!m680*:%{!mc680*:%{!mcpu=680*:-D__M68000__}}} "	\
  "%{mshort:-D__MSHORT__}"

#undef  LIB_SPEC
#define LIB_SPEC	"-lc"

/* The -g option generates stabs debug information.  */
#define DBX_DEBUGGING_INFO 1

/* Do not break .stabs pseudos into continuations.  */
#define DBX_CONTIN_LENGTH 0

/* This is the char to use for continuation (in case we need to turn
   continuation back on).  */
#define DBX_CONTIN_CHAR '?'

/* This is the assembler directive to equate two values.  */
#undef SET_ASM_OP
#define SET_ASM_OP		"\t.set\t"

/* This is how we tell the assembler that a symbol is weak.  */
#undef ASM_WEAKEN_LABEL
#define ASM_WEAKEN_LABEL(FILE,NAME) \
  do { fputs ("\t.weak\t", FILE); assemble_name (FILE, NAME); \
       fputc ('\n', FILE); } while (0)

/* Don't default to pcc-struct-return, because gcc is the only compiler, and
   we want to retain compatibility with older gcc versions.  */
#define DEFAULT_PCC_STRUCT_RETURN 0

/* Finalize the trampoline by flushing the insn cache.  */

#undef FINALIZE_TRAMPOLINE
#define FINALIZE_TRAMPOLINE(TRAMP)					\
  if (TARGET_68020 || TARGET_COLDFIRE) \
    maybe_emit_call_builtin___clear_cache ((TRAMP),			\
					 plus_constant (Pmode,		\
							(TRAMP),	\
							TRAMPOLINE_SIZE))

/* Clear the instruction cache from `beg' to `end'.  This makes an
   inline system call to Ssystem(S_FLUSHCACHE).  The arguments are as
   follows:

	Ssystem(S_FLUSHCACHE, addr, len)

   addr	  - the start address for the flush
   len    - the number of bytes to flush

   The kernel will push the instruction cache
	    */

#define CLEAR_INSN_CACHE(BEG, END)					\
{									\
  register unsigned long _beg __asm ("%d0") = (unsigned long) (BEG);	\
  unsigned long _end = (unsigned long) (END);				\
  register unsigned long _len __asm ("%d1") = (_end - _beg);	\
  __asm __volatile							\
    ("move%.l %1,-(%%sp)\n\t"	/* len */			\
     "move%.l %0,-(%%sp)\n\t"	/* beg */			\
     "move%.w #22,-(%%sp)\n\t"	/* S_FLUSHCACHE */			\
     "move%.w #340,-(%%sp)\n\t"	/* system call nr */			\
     "trap #1\n\t"								\
     "lea 12(%%sp),%%sp" /* correct stack */ \
     : /* no outputs */							\
     : "r" (_beg), "r" (_len)						\
     : "%d2", "%a0", "%a1", "%a2", "cc", "memory");						\
}

/* By default, the vtable entries are void pointers, the so the alignment
   is the same as pointer alignment.  The value of this macro specifies
   the alignment of the vtable entry in bits.  It should be defined only
   when special alignment is necessary.

   MiNT: The default value of 32 is too much and unsupported by a.out-mintprg.
*/
#define TARGET_VTABLE_ENTRY_ALIGN 16

/* If we have a definition of INCOMING_RETURN_ADDR_RTX, assume that
   the rest of the DWARF 2 frame unwind support is also provided.
   
   All configurations that don't use elf must be explicit about not using
   dwarf unwind information.

   MiNT: DWARF 2 frame unwind is not supported by a.out-mint.
*/
#undef DWARF2_UNWIND_INFO
/* If configured with --disable-sjlj-exceptions, use DWARF2
   else default to SJLJ.  */
#if defined(USING_ELFOS_H) && defined (CONFIG_SJLJ_EXCEPTIONS) && !CONFIG_SJLJ_EXCEPTIONS
/* The logic of this #if must be kept synchronised with the logic
   for selecting the tmake_eh_file fragment in libgcc/config.host.  */
#define DWARF2_UNWIND_INFO 1
#else
#define DWARF2_UNWIND_INFO 0
#endif

#if DWARF2_UNWIND_INFO
/* the default of DW_EH_PE_absptr creates relocations at odd addresses, which we cannot handle */
#undef ASM_PREFERRED_EH_DATA_FORMAT
#define ASM_PREFERRED_EH_DATA_FORMAT(CODE, GLOBAL)			   \
  (flag_pic								   \
   && !((TARGET_ID_SHARED_LIBRARY || TARGET_SEP_DATA)			   \
	&& ((GLOBAL) || (CODE)))					   \
   ? ((GLOBAL) ? DW_EH_PE_indirect : 0) | DW_EH_PE_pcrel | DW_EH_PE_sdata4 \
   : DW_EH_PE_aligned)

/* Define how the m68k registers should be numbered for Dwarf output.
   The numbering provided here should be compatible with the native
   SVR4 debugger in the m68k/SVR4 reference port, where d0-d7
   are 0-7, a0-a7 are 8-15, and fp0-fp7 are 16-23.  */

#undef DEBUGGER_REGNO
#define DEBUGGER_REGNO(REGNO) (REGNO)
#endif

/* config/m68k.md has an explicit reference to the program counter,
   prefix this by the register prefix.  */

#undef ASM_OUTPUT_CASE_LABEL
#define ASM_RETURN_CASE_JUMP				\
  do {							\
    if (TARGET_COLDFIRE)				\
      {							\
	if (ADDRESS_REG_P (operands[0]))		\
	  return "jmp %%pc@(2,%0:l)";			\
	else if (TARGET_LONG_JUMP_TABLE_OFFSETS)	\
	  return "jmp %%pc@(2,%0:l)";			\
	else						\
	  return "ext%.l %0\n\tjmp %%pc@(2,%0:l)";	\
      }							\
    else if (TARGET_LONG_JUMP_TABLE_OFFSETS)		\
      return "jmp %%pc@(2,%0:l)";			\
    else						\
      return "jmp %%pc@(2,%0:w)";			\
  } while (0)

/* As offset 2 is hardcoded in the jmp instruction above,
   the ADDR_VEC must immediately follow the jmp instruction.
   https://gcc.gnu.org/bugzilla/show_bug.cgi?id=112413  */

#undef ADDR_VEC_ALIGN
#define ADDR_VEC_ALIGN(ADDR_VEC) 0

/* we must define this to prevent alignment of the table,
   otherwise the relative offset from ASM_RETURN_CASE_JUMP might not match */
#undef ASM_OUTPUT_BEFORE_CASE_LABEL
#define ASM_OUTPUT_BEFORE_CASE_LABEL(FILE,PREFIX,NUM,TABLE)

/* If defined, a C expression whose value is a string containing the
   assembler operation to identify the following data as uninitialized global
   data.  */

#ifdef USING_ELFOS_H
#define BSS_SECTION_ASM_OP "\t.section\t.bss"

#define TARGET_HAVE_NAMED_SECTIONS true

/* Currently, JUMP_TABLES_IN_TEXT_SECTION must be defined in order to
   keep switch tables in the text section.  */
   
#define JUMP_TABLES_IN_TEXT_SECTION 1

#define EH_TABLES_CAN_BE_READ_ONLY 1

/* avoid pulling in the tm_clone support which we don't need */
#define USE_TM_CLONE_REGISTRY 0

#undef INIT_SECTION_ASM_OP
#undef FINI_SECTION_ASM_OP

/* This is how to output an assembler line that says to advance the
   location counter to a multiple of 2**LOG bytes.  */

#undef ASM_OUTPUT_ALIGN
#define ASM_OUTPUT_ALIGN(FILE,LOG)				\
do {								\
  if ((LOG) > 0)						\
    fprintf ((FILE), "%s%u\n", ALIGN_ASM_OP, 1 << (LOG));	\
} while (0)

#undef  STARTFILE_SPEC
#define STARTFILE_SPEC	"%{pg|p|profile:gcrt0.o%s;:crt0.o%s} crtbegin.o%s"
 
#undef  ENDFILE_SPEC
#define ENDFILE_SPEC "crtend.o%s"

/* In order for bitfields to work on a 68000, or with -mnobitfield, we must
   define either PCC_BITFIELD_TYPE_MATTERS or STRUCTURE_SIZE_BOUNDARY.
   Defining STRUCTURE_SIZE_BOUNDARY results in structure packing problems,
   so we define PCC_BITFIELD_TYPE_MATTERS.  */
#define PCC_BITFIELD_TYPE_MATTERS 1

#else
/* We can only do STABS.  */
#undef PREFERRED_DEBUGGING_TYPE
#define PREFERRED_DEBUGGING_TYPE DBX_DEBUG

#define BSS_SECTION_ASM_OP "\t.bss"

#define TARGET_HAVE_NAMED_SECTIONS false

#undef  STARTFILE_SPEC
#define STARTFILE_SPEC	"%{pg|p|profile:gcrt0.o%s;:crt0.o%s}"
 
#undef  ENDFILE_SPEC
#define ENDFILE_SPEC ""

/* Every structure or union's size must be a multiple of 2 bytes.  */
#define STRUCTURE_SIZE_BOUNDARY 16

#endif

/* A C statement (sans semicolon) to output to the stdio stream
   FILE the assembler definition of uninitialized global DECL named
   NAME whose size is SIZE bytes and alignment is ALIGN bytes.
   Try to use asm_output_aligned_bss to implement this macro.  */

#define ASM_OUTPUT_ALIGNED_BSS(FILE, DECL, NAME, SIZE, ALIGN) \
  asm_output_aligned_bss (FILE, DECL, NAME, SIZE, ALIGN)

/* Disable -fpic and -fPIC since bsr.l _label@PLTPC
   is unsupported by the assembler.  */

#undef  SUBTARGET_OVERRIDE_OPTIONS
#define SUBTARGET_OVERRIDE_OPTIONS					\
do {									\
  if (flag_pic && !TARGET_PCREL)					\
      error ("%<-f%s%> is not supported on this target",			\
	       (flag_pic > 1) ? "PIC" : "pic");				\
} while (0)


/* Workaround for GCC bug #35067 about multiple thunks.  */

#undef MAKE_DECL_ONE_ONLY
#define MAKE_DECL_ONE_ONLY(DECL) (DECL_WEAK (DECL) = 1)

/* Avoid requiring -static with -fmudflap like in config/bfin/uclinux.h */
#define MFWRAP_SPEC " %{fmudflap|fmudflapth: \
 --wrap=malloc --wrap=free --wrap=calloc --wrap=realloc\
 --wrap=mmap --wrap=munmap --wrap=alloca\
 %{fmudflapth: --wrap=pthread_create\
}} %{fmudflap|fmudflapth: --wrap=main}"

/* Install the __sync libcalls.  */
#undef TARGET_INIT_LIBFUNCS
#define TARGET_INIT_LIBFUNCS  m68k_init_libfuncs

#define STACK_CHECK_ATARI
#define STACK_CHECK_BUILTIN 1
int m68k_emit_stack_check(void);
