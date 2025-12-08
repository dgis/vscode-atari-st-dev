
ifdef OS
	WINDOWS = 1
endif

# Compiler and flags
CC = m68k-atari-mintelf-gcc
CFLAGS = -I../libcmini-elf/include -std=c99 -g
LDFLAGS = ../libcmini-elf/lib/crt0.o -nostdlib -L../libcmini-elf/lib -lcmini -lgcc

# Target executable
TARGET = main.prg

# Source files
SRCS = main.c

# Object files
OBJS = $(SRCS:.c=.o)

# Default target
all: $(TARGET)

# Linking the target
$(TARGET): $(OBJS)
	$(info Linking $(TARGET))
	$(CC) $^ $(LDFLAGS) -o $@

# Compile source files into object files
%.o: %.c
	$(info Compiling $<)
	$(CC) $(CFLAGS) -c $< -o $@

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