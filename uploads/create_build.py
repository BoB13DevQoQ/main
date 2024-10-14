import os

from . import pharse_gcc

from . import pharse_env

from . import pharse_dependency

def create_build(dependencies_file, environment_file, compile_cmd_file, build_sh_path):
    with open(build_sh_path, 'w', encoding='utf-8') as build_sh:
        # 기본 헤더 작성
        build_sh.write("#!/bin/bash\n\n")
        build_sh.write("source ../common.sh\n\n")
        build_sh.write("PROJECT_NAME=target_project\n")
        build_sh.write("STALIB_NAME=libtarget.a\n")
        build_sh.write("DYNLIB_NAME=libtarget.so\n\n")

        # 의존성 설치 로직
        build_sh.write("function download() {\n")
        build_sh.write("    if [[ ! -z \"${DOCKER_CONTAINER:-}\" ]]; then\n")

        # dependencies.txt 파일에서 의존성 읽기
        with open(dependencies_file, 'r', encoding='utf-8') as dep_file:
            dependencies = dep_file.readlines()
            for dep in dependencies:
                build_sh.write(f"            {dep.strip()} \n")
        
        build_sh.write("    fi\n")
        build_sh.write("}\n\n")

        # build_lib 함수: 환경 변수 설정 및 컴파일 명령어 포함
        build_sh.write("function build_lib() {\n")
        build_sh.write("    LIB_STORE_DIR=$SRC/target_project\n")
        build_sh.write("    cd $SRC/target_project\n")

        # 환경 변수 설정 로직
        with open(environment_file, 'r', encoding='utf-8') as env_file:
            environment_vars = env_file.readlines()
            for env_var in environment_vars:
                build_sh.write(f"    export {env_var.strip()}\n")
        
        build_sh.write("\n")

        # 컴파일 명령어 로직
        build_sh.write("    echo \"Starting compilation...\"\n")
        with open(compile_cmd_file, 'r', encoding='utf-8') as cmd_file:
            compile_cmds = cmd_file.readlines()
            for cmd in compile_cmds:
                build_sh.write(f"    {cmd.strip()}\n")

        build_sh.write("}\n\n")

        # build_oss_fuzz 함수: 퍼저 빌드 자동화 로직
        build_sh.write("function build_oss_fuzz() {\n")
        build_sh.write("    # 소스 디렉토리로 이동\n")
        build_sh.write("    cd $SRC/target_project || { echo \"Source directory not found: $SRC/target_project\"; return 1; }\n")
        build_sh.write("\n")
        build_sh.write("    # 퍼저 파일 찾기 및 빌드\n")
        build_sh.write("    for f in $(find $SRC -name '*example_fuzzer.*'); do\n")
        build_sh.write("        extension=\"${f##*.}\"\n")
        build_sh.write("        base_name=$(basename -s .$extension $f)\n")
        build_sh.write("\n")
        build_sh.write("        case $extension in\n")
        build_sh.write("            cpp | cc)\n")
        build_sh.write("                $CXX $CXXFLAGS -std=c++11 -I. $f -o $OUT/$base_name $LIB_FUZZING_ENGINE ./libtarget.a\n")
        build_sh.write("                ;;\n")
        build_sh.write("            c)\n")
        build_sh.write("                $CC $CFLAGS -I. $f -c -o /tmp/$base_name.o\n")
        build_sh.write("                $CXX $CXXFLAGS -o $OUT/$base_name /tmp/$base_name.o $LIB_FUZZING_ENGINE ./libtarget.a\n")
        build_sh.write("                rm -f /tmp/$base_name.o\n")
        build_sh.write("                ;;\n")
        build_sh.write("            *)\n")
        build_sh.write("                echo \"Unsupported file type: $f\"\n")
        build_sh.write("                continue\n")
        build_sh.write("                ;;\n")
        build_sh.write("        esac\n")
        build_sh.write("\n")
        build_sh.write("        # 시드 파일 생성 및 링크\n")
        build_sh.write("        zip $OUT/seed_corpus.zip *.*\n")
        build_sh.write("        ln -sf $OUT/seed_corpus.zip $OUT/${base_name}_seed_corpus.zip\n")
        build_sh.write("    done\n")
        build_sh.write("}\n\n")

        # copy_include 로직
        build_sh.write("function copy_include() {\n")
        build_sh.write("    echo \"Copying include files...\"\n")
        build_sh.write("    cd ${LIB_BUILD}\n")
        build_sh.write("    mkdir -p include\n")
        build_sh.write("    cp $SRC/target_project/*.h include/\n")
        build_sh.write("}\n\n")

        # build_corpus 로직
        build_sh.write("function build_corpus() {\n")
        build_sh.write("    echo \"Building corpus...\"\n")
        build_sh.write("    cd $SRC/target_project\n")
        build_sh.write("    zip $OUT/seed_corpus.zip *.*\n")
        build_sh.write("    unzip -o -d $LIB_BUILD/corpus $OUT/seed_corpus.zip\n")
        build_sh.write("    cp $OUT/seed_corpus.zip $LIB_BUILD/corpus/seed_corpus.zip\n")
        build_sh.write("}\n\n")

        # build_dict 로직
        build_sh.write("function build_dict() {\n")
        build_sh.write("    echo \"Creating dictionary...\"\n")
        build_sh.write("    echo \"write=w\" >> ${LIB_BUILD}/fuzzer.dict\n")
        build_sh.write("}\n\n")

        build_sh.write("build_all\n")

# 의존성 파일 경로 및 생성할 build.sh 경로 설정
def create_congfigure(build_conf_path):
    with open(build_conf_path, 'w', encoding='utf-8') as build_conf:
        build_conf.write("project_name: target_project\n")
        build_conf.write("static_lib_name: libtarget.a\n")
        build_conf.write("dyn_lib_name: libtarget.so\n")
        build_conf.write("ban:\n")

def create_buildsh_conf(output_dependencies_file, output_compile_cmd_path, output_env_path, dockerfile_path, makefile_path, output_build_sh_path, output_build_conf_path):
    # 1. CXX, make, gcc 등의 컴파일 옵션 파싱
    pharse_gcc.parse_compile_blocks(dockerfile_path, output_compile_cmd_path)

    pharse_gcc.check_makefile(output_compile_cmd_path, makefile_path)

    pharse_gcc.insert_make_clean(output_compile_cmd_path)

    print("컴파일 옵션 파싱 완료")

    # 2. 환경 변수 파싱
    pharse_env.parse_env_blocks(dockerfile_path, output_env_path)

    print("환경 변수 파싱 완료")

    # 3. dockerfile 의존성 파싱
    pharse_dependency.parse_run_blocks(dockerfile_path, output_dependencies_file)
    
    print("dockerfile 의존성 파싱 완료")

    # 4. build.sh, cnofig.yaml
    create_build(output_dependencies_file, output_env_path, output_compile_cmd_path, output_build_sh_path)
    create_congfigure(output_build_conf_path)

    print("build.sh, config.yaml 생성 완료")
