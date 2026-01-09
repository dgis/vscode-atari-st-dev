#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <math.h>

extern void demoASM();
unsigned short palette[60000];
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

#define BAND_NUMBER 6
#define BAND_HEIGHT 16

// Create color gradient from 0 to 7 and back to 0.
void generate_colored_band(unsigned short *color, char color_count, BOOL red, BOOL green, BOOL blue) {
    float period = 180.f / (float)(color_count - 1);
    for (char i = 0; i < color_count; i++) {
        unsigned short amplitude = 7.f * SINQ((float)i * period);
        unsigned short r = red ? amplitude : 0;
        unsigned short g = green ? amplitude : 0;
        unsigned short b = blue ? amplitude : 0;
        color[i] = (r << 8) | (g << 4) | b;
    }
}

BOOL generate_raster() {
    long unsigned int palette_size = sizeof(palette) / sizeof(unsigned short);

    short band_number = BAND_NUMBER;
    short band_height = BAND_HEIGHT;

    unsigned short band_x[BAND_NUMBER], band_y[BAND_NUMBER], band_y_sorted[BAND_NUMBER], band_color_sorted[BAND_NUMBER];
    unsigned short band_color[BAND_NUMBER][BAND_HEIGHT];

    generate_colored_band(band_color[0], band_height, TRUE, FALSE, FALSE);
    generate_colored_band(band_color[1], band_height, TRUE, TRUE, FALSE);
    generate_colored_band(band_color[2], band_height, FALSE, TRUE, FALSE);
    generate_colored_band(band_color[3], band_height, FALSE, TRUE, TRUE);
    generate_colored_band(band_color[4], band_height, FALSE, FALSE, TRUE);
    generate_colored_band(band_color[5], band_height, TRUE, FALSE, TRUE);

    unsigned short palette_frame[400];
    long unsigned int color_index = 0;
    float elipse_width = 50;
    float elipse_height = 70;
    float elipse_center_x = 100;
    float elipse_center_y = 100;
    float band_angle_step = 180.f / 16.f;
    short frame_angle_step = 2;
    for (short frame_angle = 0; frame_angle < 360; frame_angle += frame_angle_step) {
        memset(palette_frame, 0, sizeof(palette_frame));

        // This places bands points around the ellipse, spaced band_angle_step degrees apart.
        for (short band_i = 0; band_i < band_number; band_i++) {
            band_x[band_i] = (unsigned short)(elipse_center_x + COSQ(frame_angle - (float)band_i * band_angle_step) * elipse_width);
            band_y[band_i] = (unsigned short)(elipse_center_y - SINQ(frame_angle - (float)band_i * band_angle_step) * elipse_height);
            band_color_sorted[band_i] = band_i;
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
                    band_color_sorted[band_number - 1 - band_b] = band_a;
                    band_x[band_a] = 0;
                    band_b++;
                }
            }
        } while (band_b != band_number);

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
                palette_frame[band_y] = band_color[band_color_sorted[band_i]][band_y - band_start];
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

