#include <stdio.h>
#include <stdarg.h>
#include <string.h>
#include <math.h>

extern void demoASM();
unsigned short palette[20000];
float precalculate_sin[360];

void init_precalculate_sin(void) {
    for (int i = 0; i < 360; ++i) {
        precalculate_sin[i] = sinf(i * 3.14159265358979323846f / 180.0f);
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

#define MIN(a, b) ((a) < (b) ? (a) : (b))
#define MAX(a, b) ((a) > (b) ? (a) : (b))

void generate_raster() {
    unsigned short color[15];
    for (char i = 0; i <= 7; i++) {
        color[i] = i;
    }
    char j = 8;
    for (char i = 6; i >= 0; i--) {
        color[j] = i;
        j++;
    }

    unsigned short x[5], y[5], tab[4], interm[400], cx[5], cy[5];
    short ct = 0;
    short step = 360 / 100;
    for (short angle = 0; angle < 360; angle += step) {
        memset(interm, 0, sizeof(interm));

        x[0] = COSQ(angle) * 90 + 320;
        y[0] = SINQ(angle) * 60 + 65;
        x[1] = COSQ(angle - 180 / 16) * 90 + 320;
        y[1] = SINQ(angle - 180 / 16) * 60 + 65;
        x[2] = COSQ(angle - 180 / 8) * 90 + 320;
        y[2] = SINQ(angle - 180 / 8) * 60 + 65;
        x[3] = COSQ(angle - (3 * 180 / 16)) * 90 + 320;
        y[3] = SINQ(angle - (3 * 180 / 16)) * 60 + 65;
        x[4] = COSQ(angle - 180 / 4) * 90 + 320;
        y[4] = SINQ(angle - 180 / 4) * 60 + 65;
        short y_min = MIN(5, MIN(y[0], MIN(y[1], MIN(y[2], MIN(y[3], y[4])))));
        short y_max = MAX(5, MAX(y[0], MAX(y[1], MAX(y[2], MAX(y[3], y[4])))));
        short lang = y_max - y_min + 15;
        short b = 0;
        do {
            for (char a = 0; a <= 4; a++) {
                if (x[a] >=x[0] && x[a] >=x[1] && x[a] >=x[2] && x[a] >=x[3] && x[a] >=x[4] && b != 5) {
                    cx[4 - b] = x[a];
                    cy[4 - b] = y[a];
                    x[a] = 0;
                    b++;
                }
            }
        } while(b != 5);
        short a = cy[4] - y_min;
        for (short b = a; b <= a + 14; b++) {
            interm[b] = color[b - a];
        }
        a = cy[3] - y_min;
        for (short b = a; b <= a + 14; b++) {
            interm[b] = color[b - a];
        }
        a = cy[2] - y_min;
        for (short b = a; b <= a + 14; b++) {
            interm[b] = color[b - a];
        }
        a = cy[1] - y_min;
        for (short b = a; b <= a + 14; b++) {
            interm[b] = color[b - a];
        }
        a = cy[0] - y_min;
        for (short b = a; b <= a + 14; b++) {
            interm[b] = color[b - a];
        }
        for (short i = 0; i <= y_min; i++) {
            palette[ct] = 0;
            ct++;
        }
        for (a = 0; a <= lang-1; a++) {
            palette[ct] = interm[a];
            ct++;
        }
        palette[ct] = 0;
        ct++;
        palette[ct] = -1;
        ct++;
    }
    palette[ct] = -1;
    ct++;
}


int main(int argc, char *argv[]) {

    printf("\r\n\r\nPrecalculate sinus...\r\n");
    init_precalculate_sin();

    printf("\r\n\r\nGenerating animation...\r\n");
    generate_raster();

    demoASM();

    printf("Press [ENTER] to exit\r\n");
    getchar();
}

