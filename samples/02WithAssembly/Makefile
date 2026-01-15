
ifdef OS
	WINDOWS = 1
endif

# Compiler and flags
CC = m68k-atari-mintelf-gcc
LDFLAGS = -nostdlib -g

ASM=vasmm68k_mot
ASMFLAGS=-Felf -m68000 -no-opt -dwarf=3 -quiet -x


# Target executable
TARGET = main.prg

# Source files
SRCS = main.s

# Object files
OBJS = main.o

# Default target
all: $(TARGET)

# Linking the target
$(TARGET): $(OBJS)
	$(info Linking $(TARGET))
	$(CC) $^ $(LDFLAGS) -o $@

# Compile Assembly source files into object files
# %.o: %.s
main.o: main.s sprite.pi1 backgrnd.pi1 curve.bin
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