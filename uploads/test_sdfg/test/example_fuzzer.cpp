#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "mbr.h"

// Fuzzer entry point
extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    // 최소한 MBR 크기(512바이트)보다 작은 입력은 처리하지 않습니다.
    if (size < 512) return 0;

    // 입력 데이터를 FILE*로 변환 (fmemopen을 통해 메모리에서 파일처럼 읽기)
    FILE *in_file = fmemopen((void *)data, size, "rb");
    if (!in_file) return 0;

    // MBR 데이터 읽기
    uint8_t mbr[512];
    if (fread(mbr, 1, 512, in_file) != 512) {
        fclose(in_file);
        return 0;
    }

    // 부트 코드 출력 (fuzzing의 목적에 맞게 이 부분은 생략 가능)
    print_boot_code(mbr);

    // 파티션 테이블을 확인하여 각 파티션 정보 출력
    PARTITION* partitions = (PARTITION*)(mbr + 446);
    for (int i = 0; i < 4; ++i) {
        // 파티션 활성 여부를 확인 (액티브 파티션 여부 체크)
        check_active_partition(&partitions[i]);

        if (partitions[i].Partition_Type == 0x05 || partitions[i].Partition_Type == 0x0F) {
            // 확장 파티션 (EBR) 처리
            process_ebr(in_file, partitions[i].LBA_Address, partitions[i].LBA_Address);
        } else {
            // 기본 파티션인 경우 파티션 정보 출력
            print_partition(&partitions[i], 0);
        }
    }

    // EBR 체인 확인 (리스트 업 추가)
    for (int i = 0; i < 4; ++i) {
        if (partitions[i].Partition_Type == 0x05 || partitions[i].Partition_Type == 0x0F) {
            list_ebr_chain(in_file, partitions[i].LBA_Address, partitions[i].LBA_Address);
        }
    }

    // 파일 핸들 닫기
    fclose(in_file);

    // 정상 실행 종료
    return 0;
}