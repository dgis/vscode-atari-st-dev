#include <stdio.h>

extern void demoASM();

int main(int argc, char *argv[]) {

    printf("Press [ENTER] to start\r\n");
    getchar();

    demoASM();

    printf("\r\nHello World\r\n\r\n");

    printf("Press [ENTER] to exit\r\n");
    getchar();
}

