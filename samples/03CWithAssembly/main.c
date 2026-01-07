#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <math.h>

extern void demoASM();
unsigned short palette[100000];
float precalculate_sin[360];

float degreeToRadian = 3.14159265358979323846f / 180.0f;

void precalculate() {
    for (int i = 0; i < 360; ++i) {
        precalculate_sin[i] = sinf(i * degreeToRadian);
    }
}

float COSQ(short angle) {
    int idx = angle % 360;
    if (idx < 0) idx += 360;
    return precalculate_sin[(idx + 90) % 360];
}

float SINQ(short angle) {
    int idx = angle % 360;
    if (idx < 0) idx += 360;
    return precalculate_sin[idx];
}

#define BOOL unsigned char
#define TRUE 1
#define FALSE 0

#define MAX_BAND 32
#define MAX_COLOR 50

BOOL generate_raster() {
    long unsigned int palette_size = sizeof(palette) / sizeof(unsigned short);

    short band_number = 32; // < MAX_BAND
    short band_height = 15; // < MAX_COLOR

    // Create color gradient from 0 to 7 and back to 0.
    // unsigned short color[15];
    // for (char i = 0; i <= 7; i++) {
    //     color[i] = i;
    // }
    // char j = 8;
    // for (char i = 6; i >= 0; i--) {
    //     color[j] = i;
    //     j++;
    // }
    unsigned short color[MAX_COLOR] = {
        0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0 // 15
        // 0, 1, 2, 3, 4, 5, 6, 6, 7, 7, 7, 6, 6, 5, 4, 3, 2, 1, 0, 0 // 20
    };

    unsigned short band_x[MAX_BAND], band_y[MAX_BAND], band_y_sorted[MAX_BAND];
    unsigned short palette_frame[400];
    long unsigned int color_index = 0;
    float elipse_width = 50;
    float elipse_height = 70;
    float elipse_center_x = 100;
    float elipse_center_y = 100;
    float band_angle_step = 180.f / 16.f;
    short frame_angle_step = 1;
    for (short frame_angle = 0; frame_angle < 360; frame_angle += frame_angle_step) {
        memset(palette_frame, 0, sizeof(palette_frame));

        // This places bands points around the ellipse, spaced band_angle_step degrees apart.
        for (short band_i = 0; band_i < band_number; band_i++) {
            band_x[band_i] = (unsigned short)(COSQ(frame_angle - (float)band_i * band_angle_step) * elipse_width  + elipse_center_x);
            band_y[band_i] = (unsigned short)(SINQ(frame_angle - (float)band_i * band_angle_step) * elipse_height + elipse_center_y);
        }

        // Sort band_y points following band_x value and put sorted result in band_y_sorted.
        short band_b = 0;
        do {
            for (char band_a = 0; band_a < band_number; band_a++) {
                unsigned short band_x_value = band_x[band_a];
                BOOL band_x_is_max = TRUE;
                for (char band_c = 0; band_c < band_number; band_c++) {
                    if (band_x_value < band_x[band_c]) {
                        band_x_is_max = FALSE;
                        break;
                    }
                }
                if (band_x_is_max && band_b != band_number) {
                    band_y_sorted[band_number - 1 - band_b] = band_y[band_a];
                    band_x[band_a] = 0;
                    band_b++;
                }
            }
        } while(band_b != band_number);

        // Calculate min and max Y values for this frame.
        short y_min = 32000;
        short y_max = 0;
        for (char band_i = 0; band_i < band_number; band_i++) {
            if (band_y[band_i] < y_min) y_min = band_y[band_i];
            if (band_y[band_i] > y_max) y_max = band_y[band_i];
        }

        // Fill in the palette_frame for this frame, band by band.
        for (char band_i = band_number - 1; band_i >= 0; band_i--) {
            short band_start = band_y_sorted[band_i] - y_min;
            for (short band_y = band_start; band_y < band_start + band_height; band_y++) {
                palette_frame[band_y] = color[band_y - band_start];
            }
        }
        
        // Leading blank lines: for 0 to y_min the palette is set to background/no change.
        for (short i = 0; i <= y_min; i++) {
            palette[color_index] = 0;
            color_index++;
        }

        // Copy the calculated palette for this frame.
        short all_bands_height = y_max - y_min + band_height;
        for (short i = 0; i < all_bands_height; i++) {
            palette[color_index] = palette_frame[i];
            color_index++;
        }

        palette[color_index] = 0;
        color_index++;

        // Stop the HBL. Nothing more to draw for this frame/VBL.
        palette[color_index] = -1;
        color_index++;
    }
    palette[color_index] = -1;
    color_index++;

    if (color_index < palette_size) {
        printf("Generated palette with %d entries (out of %d max)\r\n", color_index, palette_size);
        return TRUE;
    } else {
        printf("Generated palette with %d entries,\r\nexceeded maximum size of %d entries!\r\n", color_index, palette_size);
        return FALSE;
    }
}


int main(int argc, char *argv[]) {

    printf("\r\n\r\nPrecalculate sinus...\r\n");
    precalculate();

    printf("\r\n\r\nGenerating animation...\r\n");
    if (generate_raster())
        demoASM();
    else {
        printf("Press [ENTER] to exit\r\n");
        getchar();
    }
}

