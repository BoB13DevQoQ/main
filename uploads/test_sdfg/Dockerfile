# 기본 이미지로 Ubuntu 사용
FROM ubuntu:20.04

# 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 현재 디렉토리의 모든 파일을 컨테이너의 /app 디렉토리로 복사
COPY . .

# Makefile을 사용하여 빌드
RUN make

# 최종 실행할 명령어 (예: 실행 파일)
CMD ["./example_fuzzer"]
