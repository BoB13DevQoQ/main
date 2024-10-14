# Compiler and flags
CXX = clang++
CXXFLAGS += -fPIC
LDFLAGS = -shared

# Object files
OBJ_FILES = mbr.o

# Static and shared library names
STATIC_LIB = libtarget.a
SHARED_LIB = libtarget.so

# Executable name
EXECUTABLE = mbr_test

# Default target
all: $(EXECUTABLE) $(STATIC_LIB) $(SHARED_LIB)

# Compile the executable
$(EXECUTABLE): $(OBJ_FILES) example_fuzzer.cpp
   $(CXX) $(OBJ_FILES) example_fuzzer.cpp -o $(EXECUTABLE) $(CXXFLAGS) -fsanitize=fuzzer

# Create static library
$(STATIC_LIB): $(OBJ_FILES)
   ar rcs $@ $^

# Create shared library
$(SHARED_LIB): $(OBJ_FILES)
   $(CXX) $(LDFLAGS) -o $@ $^

# Compile object files
mbr.o: mbr.c mbr.h
   $(CXX) $(CXXFLAGS) -c mbr.c -o mbr.o

# Clean up
clean:
   rm -f $(EXECUTABLE) $(OBJ_FILES) $(STATIC_LIB) $(SHARED_LIB)

.PHONY: all clean 

# 정적 라이브러리 생성
libtarget.a: mbr.o
	ar rcs $@ $^
	ranlib $@

# 동적 라이브러리 생성
libtarget.so: mbr.o
	$(CXX) -shared -o $@ $^
