FROM ubuntu:22.04

WORKDIR /usr/src/app

# 필수 패키지 설치
RUN apt-get update && apt-get install -y build-essential

# main.c와 다른 파일을 복사
COPY . .

# main.c 컴파일
RUN gcc -o test_target_code test_target_code.c

# 실행 명령
CMD ["./test_target_code"]
