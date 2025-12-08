#include <stdio.h>
#include <sys/types.h>

void printBanner() {
    const char *banner[] = {
        "  A  TTTTT  A   RRRR  III     SSS  TTTTT",
        " A A   T   A A  R   R  I     S       T  ",
        "A   A  T  A   A RRRR   I      SSS    T  ",
        "AAAAA  T  AAAAA R  R   I         S   T  ",
        "A   A  T  A   A R   R III    SSS     T  "
    };
    int bannerLength = sizeof(banner) / sizeof(banner[0]);

    for (int i = 0; i < bannerLength; i++) {
        printf("%s\r\n", banner[i]);
    }
}

int main(int argc, char *argv[]) {
    printBanner();

    printf("\r\nHello World\r\n\r\n");

    printf("Press [ENTER] to exit\r\n");
    getchar();
}

