#!/bin/bash

source ../common.sh

PROJECT_NAME=target_project
STALIB_NAME=libtarget.a
DYNLIB_NAME=libtarget.so

function download() {
    if [[ ! -z "${DOCKER_CONTAINER:-}" ]]; then
            apt-get update && apt-get install -y  build-essential  g++  make  && rm -rf /var/lib/apt/lists/* 
    fi
}

function build_lib() {
    LIB_STORE_DIR=$SRC/target_project
    cd $SRC/target_project

    echo "Starting compilation..."
    make clean
    make CXX=$CXX CC=$CC CXXFLAGS="$CXXFLAGS -fPIC"
}

function build_oss_fuzz() {
    # 소스 디렉토리로 이동
    cd $SRC/target_project || { echo "Source directory not found: $SRC/target_project"; return 1; }

    # 퍼저 파일 찾기 및 빌드
    for f in $(find $SRC -name '*example_fuzzer.*'); do
        extension="${f##*.}"
        base_name=$(basename -s .$extension $f)

        case $extension in
            cpp | cc)
                $CXX $CXXFLAGS -std=c++11 -I. $f -o $OUT/$base_name $LIB_FUZZING_ENGINE ./libtarget.a
                ;;
            c)
                $CC $CFLAGS -I. $f -c -o /tmp/$base_name.o
                $CXX $CXXFLAGS -o $OUT/$base_name /tmp/$base_name.o $LIB_FUZZING_ENGINE ./libtarget.a
                rm -f /tmp/$base_name.o
                ;;
            *)
                echo "Unsupported file type: $f"
                continue
                ;;
        esac

        # 시드 파일 생성 및 링크
        zip $OUT/seed_corpus.zip *.*
        ln -sf $OUT/seed_corpus.zip $OUT/${base_name}_seed_corpus.zip
    done
}

function copy_include() {
    echo "Copying include files..."
    cd ${LIB_BUILD}
    mkdir -p include
    cp $SRC/target_project/*.h include/
}

function build_corpus() {
    echo "Building corpus..."
    cd $SRC/target_project
    zip $OUT/seed_corpus.zip *.*
    unzip -o -d $LIB_BUILD/corpus $OUT/seed_corpus.zip
    cp $OUT/seed_corpus.zip $LIB_BUILD/corpus/seed_corpus.zip
}

function build_dict() {
    echo "Creating dictionary..."
    echo "write=w" >> ${LIB_BUILD}/fuzzer.dict
}

build_all
