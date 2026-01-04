
ifdef OS
	WINDOWS = 1
endif

# Compiler and flags
CC = m68k-atari-mintelf-gcc

CFLAGS = -std=c99 -g
LDFLAGS = -lgem -lm

# CFLAGS = -mshort -std=c99 -g
# LDFLAGS = -mshort -lgem -lm

# CFLAGS = -I../libcmini-elf/include -std=c99 -g
# LDFLAGS = ../libcmini-elf/lib/crt0.o -nostdlib -L../libcmini-elf/lib -lcmini -lgcc -lgem -lm

# CFLAGS = -mshort -I../libcmini-elf/include -std=c99 -g
# LDFLAGS = -mshort ../libcmini-elf/lib/mshort/crt0.o -nostdlib -L../libcmini-elf/lib/mshort -lcmini -lgcc -lgem -lm

ASM=vasmm68k_mot
ASMFLAGS=-Felf -m68000 -no-opt -dwarf=3 -quiet -x


# Target executable
TARGET = main.prg

# Source files
SRCS = main.c asm.s

# Object files
OBJS = main.o asm.o

# Default target
all: $(TARGET)

# Linking the target
$(TARGET): $(OBJS)
	$(info Linking $(TARGET))
	$(CC) $^ $(LDFLAGS) -o $@

# Compile C source files into object files
%.o: %.c
	$(info Compiling C $<)
	$(CC) $(CFLAGS) -c $< -o $@

# Compile Assembly source files into object files
%.o: %.s
	$(info Compiling Assembly $<)
	$(ASM) $(ASMFLAGS) $< -o $@

# Clean up build files
clean:
	$(info Cleaning...)
ifdef WINDOWS
	@del /q $(OBJS)
else
	rm -f $(OBJS)
endif

# Phony targets
.PHONY: all clean