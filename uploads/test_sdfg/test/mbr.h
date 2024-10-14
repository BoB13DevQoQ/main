#ifndef MBR_H
#define MBR_H

#include <stdint.h>
#include <stdio.h>

// 파티션 테이블 구조체 정의
typedef struct P_table {
    uint8_t Status;              // 활성 상태 (0x80이면 활성 파티션)
    uint8_t Start_CHS[3];        // 시작 CHS 주소
    uint8_t Partition_Type;      // 파티션 타입 (0x07: NTFS, 0x0B/0x0C: FAT32, 0x05: EBR)
    uint8_t End_CHS[3];          // 종료 CHS 주소
    uint32_t LBA_Address;        // LBA 시작 주소
    uint32_t Size;               // 파티션 크기 (섹터 수)
} PARTITION;

#ifdef __cplusplus
extern "C" {
#endif

// 파티션 정보를 출력하는 함수 선언
void print_partition(PARTITION* info, uint32_t base_lba);

// EBR(Extended Boot Record)를 처리하는 함수 선언
void process_ebr(FILE* fp, uint32_t base_lba, uint32_t ebr_lba);
const char* partition_type_to_string(uint8_t type);
double partition_size_in_gb(uint32_t size_in_sectors);
void print_boot_code(const uint8_t* mbr);
void check_active_partition(PARTITION* partition);
void list_ebr_chain(FILE* fp, uint32_t base_lba, uint32_t ebr_lba);

#ifdef __cplusplus
}
#endif

#endif // MBR_H