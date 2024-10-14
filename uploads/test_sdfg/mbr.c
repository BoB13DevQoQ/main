#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include "mbr.h"

// 1. 파티션 유형을 텍스트로 변환하는 함수
const char* partition_type_to_string(uint8_t type) {
    switch (type) {
        case 0x07:
            return "NTFS";
        case 0x0B:
        case 0x0C:
            return "FAT32";
        case 0x05:
        case 0x0F:
            return "Extended";
        case 0x83:
            return "Linux";
        default:
            return "Unknown";
    }
}

// 2. 파티션 크기를 GB로 변환하는 함수 (섹터 크기가 512바이트라고 가정)
double partition_size_in_gb(uint32_t size_in_sectors) {
    const uint32_t sector_size = 512; // 섹터 크기 (바이트)
    return (size_in_sectors * sector_size) / (1024.0 * 1024 * 1024); // GB로 변환
}

// 3. MBR에서 부트 코드 부분을 출력하는 함수 (바이트 디스플레이)
void print_boot_code(const uint8_t* mbr) {
    printf("Boot code:\n");
    for (int i = 0; i < 440; i++) {
        printf("%02x ", mbr[i]);
        if ((i + 1) % 16 == 0) printf("\n");
    }
    printf("\n");
}

// 4. 파티션 활성 여부를 확인하는 함수
void check_active_partition(PARTITION* partition) {
    if (partition->Status == 0x80) {
        printf("Active partition found at LBA: %u\n", partition->LBA_Address);
    } else {
        printf("Inactive partition at LBA: %u\n", partition->LBA_Address);
    }
}

// 5. 확장 파티션의 순서를 표시하는 함수
void list_ebr_chain(FILE* fp, uint32_t base_lba, uint32_t ebr_lba) {
    uint8_t ebr[512];
    int ebr_count = 0;

    while (ebr_lba != 0) {
        fseek(fp, ebr_lba * 512, SEEK_SET);
        if (fread(ebr, 1, 512, fp) != 512) {
            perror("Failed to read EBR");
            return;
        }

        PARTITION* ebr_partitions = (PARTITION*)(ebr + 446);
        printf("EBR %d: LBA %u, Size %u\n", ++ebr_count, ebr_lba, ebr_partitions->Size);

        // 다음 EBR 파티션 확인
        if (ebr_partitions[1].Partition_Type != 0x00) {
            ebr_lba = base_lba + ebr_partitions[1].LBA_Address;
        } else {
            ebr_lba = 0; // EBR 체인의 끝
        }
    }
}

void print_partition(PARTITION* info, uint32_t base_lba) {
    uint32_t abs_lba = base_lba + info->LBA_Address;
    if (info->Partition_Type == 0x07) {
        printf("NTFS %u %u\n", abs_lba, info->Size);
    }
    else if (info->Partition_Type == 0x0B || info->Partition_Type == 0x0C) {
        printf("FAT32 %u %u\n", abs_lba, info->Size);
    }
    else if (info->Partition_Type == 0x05) {
        printf("EBR %u %u \n", abs_lba, info->Size);
    }
}

void process_ebr(FILE* fp, uint32_t base_lba, uint32_t ebr_lba) {
    uint8_t ebr[512];
    fseek(fp, ebr_lba * 512, SEEK_SET);
    if (fread(ebr, 1, 512, fp) != 512) {
        perror("Failed to read EBR");
        return;
    }

    PARTITION* ebr_partitions = (PARTITION*)(ebr + 446);
    print_partition(ebr_partitions, ebr_lba);

    if (ebr_partitions[1].Partition_Type != 0x00) {
        process_ebr(fp, base_lba, base_lba + ebr_partitions[1].LBA_Address);
    }
}

/*int main(int argc, char* argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <image file>\n", argv[0]);
        return 1;
    }

    FILE* fp = fopen(argv[1], "rb");
    if (!fp) {
        perror("Failed to open file");
        return 1;
    }

    // MBR 데이터 읽기
    uint8_t mbr[512];
    if (fread(mbr, 1, 512, fp) != 512) {
        perror("Failed to read MBR");
        fclose(fp);
        return 1;
    }

    // 1. 부트 코드 출력
    print_boot_code(mbr);

    // 2. 파티션 정보 처리
    PARTITION* partitions = (PARTITION*)(mbr + 446);
    for (int i = 0; i < 4; ++i) {
        printf("Partition %d:\n", i + 1);

        // 3. 파티션 활성 여부 확인
        check_active_partition(&partitions[i]);

        // 4. 파티션 유형에 따른 처리
        if (partitions[i].Partition_Type == 0x05 || partitions[i].Partition_Type == 0x0F) {
            printf("Extended partition found. Listing EBR chain:\n");
            list_ebr_chain(fp, partitions[i].LBA_Address, partitions[i].LBA_Address);
        } else {
            print_partition(&partitions[i], 0);
        }
    }

    fclose(fp);
    return 0;
}*/