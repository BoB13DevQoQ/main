import re
import os

def parse_compile_blocks(dockerfile_path, output_path):
    """
    Dockerfile에서 컴파일 블록을 추출하고 compilecmd.txt 파일로 저장.
    .a 및 .so 파일을 libtarget.a 및 libtarget.so로 대체.
    """
    compile_patterns = [
        re.compile(r'RUN\s+\$CXX\s+'),
        re.compile(r'RUN\s+g\+\+\s+'),
        re.compile(r'RUN\s+gcc\s+'),
        re.compile(r'RUN\s+ar\s+rcs'),
        re.compile(r'RUN\s+make'),  
    ]

    stop_patterns = [
        re.compile(r'RUN\s'),
        re.compile(r'COPY\s'),
        re.compile(r'WORKDIR\s'),
        re.compile(r'CMD\s'),
        re.compile(r'ENTRYPOINT\s'),
        re.compile(r'ADD\s'),
        re.compile(r'ENV\s'),
        re.compile(r'ARG\s'),
        re.compile(r'LABEL\s'),
        re.compile(r'EXPOSE\s')
    ]

    try:
        with open(dockerfile_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            print(f"Loaded {len(lines)} lines from Dockerfile.")
    except Exception as e:
        print(f"Error reading Dockerfile: {e}")
        return

    compile_blocks = []
    in_compile_block = False
    current_block = ""

    for line in lines:
        line = line.strip()

        # 주석 제거
        line = re.sub(r'#.*', '', line).strip()

        # 빈 줄은 무시
        if not line:
            continue

        print(f"Processing line: {line}")

        # 종료 패턴이 나오면 현재 블록 저장 및 종료
        if any(stop_pattern.match(line) for stop_pattern in stop_patterns):
            if in_compile_block and current_block:
                # 모든 .a 및 .so 파일을 libtarget.a 및 libtarget.so로 대체
                current_block = re.sub(r'\b\w+\.a\b', 'libtarget.a', current_block)
                current_block = re.sub(r'\b\w+\.so\b', 'libtarget.so', current_block)
                compile_blocks.append(current_block.strip())
                current_block = ""
                in_compile_block = False

        # 컴파일 패턴이 나오면 블록 시작
        if any(compile_pattern.match(line) for compile_pattern in compile_patterns):
            in_compile_block = True

            # 'RUN' 키워드를 제거하되, 'RUN make'는 제거하지 않음
            if not line.startswith('RUN make'):
                line = re.sub(r'^RUN\s+', '', line)  # RUN 키워드 제거

        # 현재 컴파일 블록에 줄 추가
        if in_compile_block:
            current_block += " " + line.strip()

    # 마지막 블록이 종료 조건에서 추가되지 않았을 경우 추가
    if in_compile_block and current_block:
        current_block = re.sub(r'\b\w+\.a\b', 'libtarget.a', current_block)
        current_block = re.sub(r'\b\w+\.so\b', 'libtarget.so', current_block)
        compile_blocks.append(current_block.strip())

    # .a 또는 .so 파일이 있는지 여부 확인
    has_a_or_so = any('.a' in block or '.so' in block for block in compile_blocks)

    # .a 또는 .so 파일이 없는 경우 처리
    if not has_a_or_so:
        # 모든 .o 파일 찾기
        object_files = set()
        for block in compile_blocks:
            object_files.update(re.findall(r'\b(\S+\.o)\b', block))

        if object_files:
            object_files_list = ' '.join(object_files)
            # 정적 라이브러리와 동적 라이브러리 생성 명령어 추가
            static_lib_command = f"ar rcs libtarget.a {object_files_list}"  # 정적 라이브러리 생성
            dynamic_lib_command = f"$CXX -shared -o libtarget.so {object_files_list}"  # 동적 라이브러리 생성

            compile_blocks.append(static_lib_command)
            compile_blocks.append(dynamic_lib_command)

    print("Parsed Compile blocks (with replacements):")
    for block in compile_blocks:
        print(block)

    # 결과를 파일에 저장
    try:
        with open(output_path, 'w', encoding='utf-8') as output_file:
            for block in compile_blocks:
                output_file.write(block + '\n')
        print(f"Compile blocks have been saved to {output_path}.")
    except Exception as e:
        print(f"Error writing to output file: {e}")
        
def extract_object_files_from_makefile(makefile_path):
    """
    Makefile에서 .o 파일을 추출하는 함수.
    """
    object_files = set()
    try:
        with open(makefile_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        for line in lines:
            object_files.update(re.findall(r'\b(\S+\.o)\b', line))

        if not object_files:
            print("No object files found in Makefile.")
        else:
            print(f"Extracted object files: {', '.join(object_files)}")

    except Exception as e:
        print(f"Error reading Makefile: {e}")

    return object_files

def update_makefile_with_libs(makefile_path):
    """
    Makefile에서 추출한 .o, .a, .so 파일들로 정적/동적 라이브러리 규칙을 추가하고
    .a 및 .so 파일을 libtarget.a 및 libtarget.so로 변환하는 함수.
    """
    try:
        object_files = extract_object_files_from_makefile(makefile_path)
        static_lib_files = set()
        shared_lib_files = set()

        with open(makefile_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        # Makefile에서 .a 및 .so 파일을 찾고 libtarget.a 및 libtarget.so로 변환
        for line in lines:
            static_lib_files.update(re.findall(r'\b(\S+\.a)\b', line))
            shared_lib_files.update(re.findall(r'\b(\S+\.so)\b', line))

        # Makefile의 모든 .a, .so 파일을 libtarget.a, libtarget.so로 변경
        new_lines = []
        for line in lines:
            line = re.sub(r'\b\w+\.a\b', 'libtarget.a', line)
            line = re.sub(r'\b\w+\.so\b', 'libtarget.so', line)
            new_lines.append(line)

        # object files와 .a/.so 파일들이 있는지 확인
        if not object_files and not static_lib_files and not shared_lib_files:
            print("No .o, .a, or .so files found in Makefile.")
            return

        # libtarget 규칙 추가
        object_files_list = ' '.join(object_files)

        with open(makefile_path, 'w', encoding='utf-8') as file:
            file.writelines(new_lines)

            if not any(re.match(r'\s*libtarget\.(a|so)\s*:', line) for line in new_lines):
                new_rules = [
                    f"\n# 정적 라이브러리 생성\n",
                    f"libtarget.a: {object_files_list}\n",
                    f"\tar rcs $@ $^\n",
                    f"\tranlib $@\n",
                    f"\n# 동적 라이브러리 생성\n",
                    f"libtarget.so: {object_files_list}\n",
                    f"\t$(CXX) -shared -o $@ $^\n"
                ]
                file.writelines(new_rules)

        print(f"Makefile has been updated with static and dynamic library rules for: {object_files_list}")

    except Exception as e:
        print(f"Error updating Makefile: {e}")

def add_lib_commands_to_compilecmd(compilecmd_path, object_files):
    """
    compilecmd.txt에 libtarget.a와 libtarget.so 생성 명령어를 추가하는 함수.
    """
    try:
        with open(compilecmd_path, 'a', encoding='utf-8') as file:
            object_files_list = ' '.join(object_files)
            static_lib_command = f"ar rcs libtarget.a {object_files_list}  # Create the static library\n"
            dynamic_lib_command = f"$CXX -shared -o libtarget.so {object_files_list}  # Create the shared library\n"
            file.write(static_lib_command)
            file.write(dynamic_lib_command)
        print(f"libtarget.a and libtarget.so commands have been added to {compilecmd_path}.")
    except Exception as e:
        print(f"Error writing to compilecmd.txt: {e}")

def check_for_make_command_in_compile_cmd(compilecmd_path):
    """
    compilecmd.txt에서 RUN make가 있는지 확인하는 함수.
    """
    try:
        with open(compilecmd_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        for line in lines:
            if re.search(r'\bmake\b', line):  # make만 검색
                return True

    except Exception as e:
        print(f"Error reading compilecmd.txt: {e}")

    return False


def remove_run_from_make(compilecmd_path):
    """
    compilecmd.txt에서 'RUN make'를 'make'로 수정하는 함수.
    """
    try:
        with open(compilecmd_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        # 'RUN make'를 'make'로 수정
        modified_lines = [re.sub(r'^RUN\s+make', 'make', line) for line in lines]

        # 변경된 내용을 다시 파일에 저장
        with open(compilecmd_path, 'w', encoding='utf-8') as file:
            file.writelines(modified_lines)

        print(f"'RUN make' has been replaced with 'make' in {compilecmd_path}.")

    except Exception as e:
        print(f"Error modifying compilecmd.txt: {e}")


def append_flags_from_makefile_to_compilecmd(makefile_path, compilecmd_path):
    """
    Makefile에서 CXXFLAGS 또는 CFLAGS에 대한 추가 명령어를 찾아 compilecmd.txt에 반영.
    """
    try:
        with open(makefile_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        cxxflags_additions = None
        cflags_additions = None
        LDFLAGS_additions = None

        # Makefile에서 CXXFLAGS, CFLAGS, LDFLAGS 추가 명령어 찾기
        for line in lines:
            if re.match(r'CXXFLAGS\s*\+?=\s*(.*)', line):
                # Use re.findall and access the first match (which is the contents after +=)
                cxxflags_additions = re.findall(r'CXXFLAGS\s*\+?=\s*(.*)', line)[0].strip()
            elif re.match(r'CFLAGS\s*\+=\s*?(.*)', line):
                cflags_additions = re.findall(r'CFLAGS\s*\+=\s*(.*)', line)[0].strip()
            elif re.match(r'LDFLAGS\s*=\s*(.*)', line):
                LDFLAGS_additions = re.findall(r'LDFLAGS\s*=\s*(.*)', line)[0].strip()

        # compilecmd.txt에 플래그 추가
        if cxxflags_additions or cflags_additions or LDFLAGS_additions:
            with open(compilecmd_path, 'r+', encoding='utf-8') as file:
                existing_lines = file.readlines()

                # make 명령어가 이미 있는지 확인하고 플래그를 같은 줄에 추가
                for i, line in enumerate(existing_lines):
                    if 'make' in line:

                        line=line.strip()+f' CXX=$CXX CC=$CC '
                        if cxxflags_additions:
                            line = line.strip() + f' CXXFLAGS="$CXXFLAGS {cxxflags_additions}"'
                        if cflags_additions:
                            line = line.strip() + f' CFLAGS="$CFLAGS {cflags_additions}"'
                        existing_lines[i] = line
                        break
                else:
                    # make 명령어가 없으면 새로 추가
                    flags_line = "make"
                    flags_line=flags_line.strip()+f' CXX=$CXX CC=$CC '
                    if cxxflags_additions:
                        flags_line += f' CXXFLAGS="$CXXFLAGS {cxxflags_additions}"'
                    if cflags_additions:
                        flags_line += f' CFLAGS="$CFLAGS {cflags_additions}"'
                    file.write(f"{flags_line}")

                # 파일 다시 쓰기
                file.seek(0)
                file.writelines(existing_lines)

            print(f"Makefile flags (CXXFLAGS, CFLAGS, LDFLAGS) added to {compilecmd_path}.")

    except Exception as e:
        print(f"Error appending flags from Makefile to compilecmd.txt: {e}")

def insert_make_clean(filename):
    # 파일 읽기
    with open(filename, 'r') as file:
        lines = file.readlines()
    
    # 새로운 라인을 저장할 리스트
    new_lines = []

    # make 명령어가 있는지 확인하고 그 위에 make clean을 추가
    for i, line in enumerate(lines):
        if 'make' in line:
            new_lines.append('make clean\n')  # make clean 추가
        new_lines.append(line)  # 원래 라인 추가
    
    # 파일 다시 쓰기
    with open(filename, 'w') as file:
        file.writelines(new_lines)

def check_makefile(output_compile_cmd_path, makefile_path):
    # 2. compilecmd.txt에서 RUN make 명령어가 있는지 확인
    if check_for_make_command_in_compile_cmd(output_compile_cmd_path):
        print("RUN make found, updating Makefile...")
        update_makefile_with_libs(makefile_path)

        # Makefile 업데이트 후 compilecmd.txt의 'RUN make'를 'make'로 수정
        remove_run_from_make(output_compile_cmd_path)

        # Makefile에서 추가된 CXXFLAGS, CFLAGS, LDFLAGS 찾기
        append_flags_from_makefile_to_compilecmd(makefile_path, output_compile_cmd_path)
    else:
        print("RUN make not found, checking for .o files in compilecmd.txt...")

        try:
            with open(output_compile_cmd_path, 'r', encoding='utf-8') as file:
                compile_cmds = file.readlines()
        except Exception as e:
            print(f"Error reading compilecmd.txt: {e}")
            compile_cmds = []

        object_files = set()
        for cmd in compile_cmds:
            object_files.update(re.findall(r'\b(\S+\.o)\b', cmd))

        # .a 및 .so 파일이 없는지 확인하고, 없는 경우에만 추가
        if object_files and not any('.a' in cmd or '.so' in cmd for cmd in compile_cmds):
            add_lib_commands_to_compilecmd(output_compile_cmd_path, object_files)
        else:
            print("No need to add library commands or no object files found.")