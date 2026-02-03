#include <stdio.h>
#include <math.h>

int main(int argc, char *argv[]) {
    printf("\r\nGenerating curve...\r\n\r\n");

    #define NUMBER_OF_ANGLES 512
    struct point {
        unsigned short offset; // Screen address offset of the 16pixels cluster
        unsigned short pixel; // pixel number inside the cluster (0-15)
    } curve[NUMBER_OF_ANGLES + 1];

    float angle_step = (2.f * 3.14159265f) / (float)NUMBER_OF_ANGLES;

    unsigned short sprite_width = 32;
    unsigned short sprite_height = 32;
    unsigned short sprite_offset_x = sprite_width / 2;
    unsigned short sprite_offset_y = sprite_height / 2;

    float scale_x = (320 - sprite_width) / 4;
    float scale_y = (200 - sprite_height) / 4;

    for (short i = 0; i < NUMBER_OF_ANGLES; i++) {
        float angle = (float)i * angle_step;
        unsigned short x = sprite_offset_x + (unsigned short)(scale_x * (2.f + sinf(angle) + sinf(2.f * angle)));
        unsigned short y = sprite_offset_y + (unsigned short)(scale_y * (2.f + sinf(3.f * angle) + sinf(angle)));
        curve[i].offset = 160 * y + (x / 16) * 8;
        curve[i].pixel = x % 16;
    }
    curve[NUMBER_OF_ANGLES].offset = -1;
    curve[NUMBER_OF_ANGLES].pixel = -1;

    // Save curve to binary file
    FILE *file = fopen("curve.bin", "wb");
    if (file != NULL) {
        fwrite(curve, sizeof(curve), 1, file);
        fclose(file);
        printf("Curve saved to curve.bin\r\n");
    } else {
        printf("Error: Could not save curve.bin\r\n");
    }

    printf("Press [ENTER] to exit\r\n");
    getchar();
}

