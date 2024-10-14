import re

def parse_run_blocks(dockerfile_path, output_path):
    # 패턴 정의
    run_patterns = [
        re.compile(r'RUN\s+apt-get install'),
        re.compile(r'RUN\s+apk add'),
        re.compile(r'RUN\s+apk update'),
        re.compile(r'RUN\s+apt update'),
        re.compile(r'RUN\s+apt-get update'),
        re.compile(r'RUN\s+wget'),
        re.compile(r'RUN\s+curl'),
    ]

    # 종료 패턴 정의
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

    # Dockerfile 읽기 (UTF-8 인코딩 지정)
    try:
        with open(dockerfile_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            print(f"Loaded {len(lines)} lines from Dockerfile.")
    except Exception as e:
        print(f"Error reading Dockerfile: {e}")
        return

    # 의존성 블록 저장 리스트
    run_blocks = []

    # 현재 RUN 블록 여부를 확인하기 위한 변수
    in_run_block = False
    current_block = ""

    # 한 줄씩 처리
    for line in lines:
        line = line.strip()
        print(f"Processing line: {line}")

        # 종료 패턴이 나오면 현재 블록 저장 및 종료
        if any(stop_pattern.match(line) for stop_pattern in stop_patterns):
            if in_run_block and current_block:
                run_blocks.append(current_block.strip())
                current_block = ""
                in_run_block = False

        # RUN 패턴이 나오면 블록 시작
        if any(run_pattern.match(line) for run_pattern in run_patterns):
            in_run_block = True
            line = re.sub(r'^RUN\s+', '', line)  # RUN 키워드 제거

        # 현재 RUN 블록에 줄 추가
        if in_run_block:
            current_block += " " + line.strip()

            # 이어지는 줄을 확인하고 처리
            if line.endswith('\\'):
                # 줄바꿈 문자를 제거하고 다음 줄을 계속 추가
                current_block = current_block.rstrip('\\').strip() + ' '
                continue
            else:
                # 블록이 끝나면 현재 블록을 저장
                run_blocks.append(current_block.strip())
                current_block = ""
                in_run_block = False

    # 마지막 블록이 종료 조건에서 추가되지 않았을 경우 추가
    if in_run_block and current_block:
        run_blocks.append(current_block.strip())

    # 파싱된 RUN 블록 로그 출력
    print("Parsed RUN blocks (without RUN keyword):")
    for block in run_blocks:
        print(block)

    # 결과를 파일에 저장
    try:
        with open(output_path, 'w', encoding='utf-8') as output_file:
            for block in run_blocks:
                output_file.write(block + '\n')
        print(f"RUN blocks have been saved to {output_path} (without RUN keyword).")
    except Exception as e:
        print(f"Error writing to output file: {e}")
