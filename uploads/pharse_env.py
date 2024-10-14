import re

def parse_env_blocks(dockerfile_path, output_path):
    # 패턴 정의 (띄어쓰기 포함된 형태를 모두 처리)
    env_patterns = [
        re.compile(r'ENV\s+')
    ]
    
    # 종료 패턴 정의
    stop_patterns = [
        re.compile(r'RUN\s'),
        re.compile(r'COPY\s'),
        re.compile(r'WORKDIR\s'),
        re.compile(r'CMD\s'),
        re.compile(r'ENTRYPOINT\s'),
        re.compile(r'ADD\s'),
        re.compile(r'ARG\s'),
        re.compile(r'LABEL\s'),
        re.compile(r'EXPOSE\s')
    ]

    # Dockerfile 읽기
    try:
        with open(dockerfile_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            print(f"Loaded {len(lines)} lines from Dockerfile.")
    except Exception as e:
        print(f"Error reading Dockerfile: {e}")
        return

    # 환경변수 블록 저장 리스트
    env_blocks = []

    # 현재 ENV 블록 여부를 확인하기 위한 변수
    in_env_block = False
    current_block = ""

    # 한 줄씩 처리
    for line in lines:
        line = line.strip()
        print(f"Processing line: {line}")

        # 종료 패턴이 나오면 현재 블록 저장 및 종료
        if any(stop_pattern.match(line) for stop_pattern in stop_patterns):
            if in_env_block and current_block:
                env_blocks.append(current_block.strip())
                current_block = ""
                in_env_block = False

        # ENV 패턴이 나오면 블록 시작
        if any(env_pattern.match(line) for env_pattern in env_patterns):
            in_env_block = True
            line = re.sub(r'^ENV\s+', '', line)  # ENV 키워드 제거

        # 현재 ENV 블록에 줄 추가
        if in_env_block:
            current_block += " " + line.strip()

    # 마지막 블록이 종료 조건에서 추가되지 않았을 경우 추가
    if in_env_block and current_block:
        env_blocks.append(current_block.strip())

    # 파싱된 ENV 블록 로그 출력
    print("Parsed ENV blocks (without ENV keyword):")
    for block in env_blocks:
        print(block)

    # CFLAGS, CXXFLAGS를 찾아서 앞에 $CFLAGS, $CXXFLAGS 추가하고 CC, CXX 삭제
    modified_env_blocks = []
    for block in env_blocks:
        # CFLAGS를 찾고 기존 값에 추가 (따옴표 여부와 관계없이)
        block = re.sub(r'CFLAGS\s*=\s*["\']?([^"\']*)["\']?', r'CFLAGS="$CFLAGS \1"', block)
        # CXXFLAGS를 찾고 기존 값에 추가 (따옴표 여부와 관계없이)
        block = re.sub(r'CXXFLAGS\s*=\s*["\']?([^"\']*)["\']?', r'CXXFLAGS="$CXXFLAGS \1"', block)
        # CC와 CXX를 삭제
        block = re.sub(r'CC\s*=\s*[^ ]+|CXX\s*=\s*[^ ]+', '', block).strip()

        modified_env_blocks.append(block)

    # 수정된 ENV 블록 출력
    print("Modified ENV blocks:")
    for block in modified_env_blocks:
        print(block)

    # 결과를 파일에 저장
    try:
        with open(output_path, 'w', encoding='utf-8') as output_file:
            for block in modified_env_blocks:
                output_file.write(block + " CXX=$CXX" +'\n')
        print(f"Modified ENV blocks have been saved to {output_path} (with updated CFLAGS and CXXFLAGS, and removed CC/CXX).")
    except Exception as e:
        print(f"Error writing to output file: {e}")

