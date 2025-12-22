#include <stdio.h>
#include <gem.h>
#include "main.h"

typedef int BOOL;
#define FALSE 0
#define TRUE 1


int application_id;

#define WINDOW_MIN_WIDTH 40
#define WINDOW_MIN_HEIGHT 50

struct window {
	int handle; // window handle

	int cell_h;
	int cell_w;
	int vert_posn;
	int horz_posn;
	int lines_shown;
	int colns_shown;
};
struct window window1 = {
        .handle = -1
    }, window2 = {
        .handle = -1
    };

OBJECT *menu_tree;

void init_gem(void) {
    application_id = appl_init();
    if (application_id >= 0) {
        int r = rsrc_load("MAIN.RSC");
        if (r) {
            rsrc_gaddr(R_TREE, MENU_MAIN, &menu_tree);
            menu_bar(menu_tree, 1);
        }
    }
}

void exit_gem(void) {
    if (window1.handle >= 0) wind_close(window1.handle);
    if (window2.handle >= 0) wind_close(window2.handle);
    menu_bar(menu_tree, 0);
    rsrc_free();
    appl_exit();
}

void open_window(int *handle, char *title) {
    if (*handle < 0) {
        *handle = wind_create(NAME | CLOSER | FULLER | MOVER | INFO | SIZER, 50, 50, 200, 100);
        if (*handle >= 0) {
            wind_set_ptr(*handle, WF_NAME, title);
            wind_open(*handle, 50, 50, 200, 100);
        }
    }
}

BOOL is_window_maximized(short *handle) {
	short curx, cury, curw, curh;
	wind_get (*handle, WF_CURRXYWH, &curx, &cury, &curw, &curh);

    short fullx, fully, fullw, fullh;
	wind_get (*handle, WF_FULLXYWH, &fullx, &fully, &fullw, &fullh);

    return curx != fullx || cury != fully || curw != fullw || curh != fullh ? FALSE : TRUE;
}

void maximize_window(short *handle) {
    if (is_window_maximized(handle)) {
		short oldx, oldy, oldw, oldh;
		short fullx, fully, fullw, fullh;

		wind_get (*handle, WF_PREVXYWH, &oldx, &oldy, &oldw, &oldh);
		wind_get (*handle, WF_FULLXYWH, &fullx, &fully, &fullw, &fullh);
		graf_shrinkbox (oldx, oldy, oldw, oldh, fullx, fully, fullw, fullh);
		wind_set (*handle, WF_CURRXYWH, oldx, oldy, oldw, oldh);

	} else {
		short curx, cury, curw, curh;
		short fullx, fully, fullw, fullh;

		wind_get (*handle, WF_CURRXYWH, &curx, &cury, &curw, &curh);
		wind_get (*handle, WF_FULLXYWH, &fullx, &fully, &fullw, &fullh);
		graf_growbox (curx, cury, curw, curh, fullx, fully, fullw, fullh);
		wind_set (*handle, WF_CURRXYWH, fullx, fully, fullw, fullh);
	}
}

void show_dialog(void) {
    form_alert(1, "[1][Sample Dialog|This is a simple dialog box.][OK]");
}

int main(void) {
    short msg[8];
    int event, done = 0;
    
    init_gem();
    
    if (application_id < 0) {
        printf("Failed to initialize GEM\r\n");
        return 1;
    }

    short mouse_x, mouse_y, mouse_button_state, mouse_click, key_state, key;

    while (!done) {
        event = evnt_multi(
            MU_KEYBD | MU_MESAG, // short Type,
            1, // short Clicks,
            1, // short WhichButton,
            1, // short WhichState,
            0, // short EnterExit1,
            0, // short In1X,
            0, // short In1Y,
            0, // short In1W,
            0, // short In1H,
            0, // short EnterExit2,
            0, // short In2X,
            0, // short In2Y,
            0, // short In2W,
            0, // short In2H,
            msg, // short MessagBuf[],
            0, // unsigned long Interval,
            &mouse_x, // short *OutX,
            &mouse_y, // short *OutY,
            &mouse_button_state, // short *ButtonState,
            &key_state, // short *KeyState,
            &key, // short *Key,
            &mouse_click // short *ReturnCount
        );
        
        if (event & MU_KEYBD) {
            int key_code = key >> 8;
            int key_ascii = key & 0xFF;
            switch (key_ascii) {
                case '1':
                    open_window(&window1.handle, "Window 1");
                    break;
                case '2':
                    open_window(&window2.handle, "Window 2");
                    break;
                case 'd':
                case 'D':
                    show_dialog();
                    break;
                case 'q':
                case 'Q':
                    done = 1;
                    break;
            }
        }
        
        if (event & MU_MESAG) {
            switch (msg[0]) {
                case MN_SELECTED:
                    switch (msg[4]) {
                        case MENU_ABOUT:
                            form_alert(1, "[1][Sample GEM Application|Version 1.0][OK]");
                            break;
                        case MENU_QUIT:
                            done = 1;
                            break;
                        case MENU_WINDOW1:
                            open_window(&window1.handle, "Window 1");
                            break;
                        case MENU_WINDOW2:
                            open_window(&window2.handle, "Window 2");
                            break;
                        case MENU_ALERT:
                            show_dialog();
                            break;
                    }
                    menu_tnormal(menu_tree, msg[3], 1);
                    break;
				case WM_TOPPED:
					wind_set_int(msg[3], WF_TOP, 0);
					break;
				case WM_MOVED:
					wind_set(msg[3], WF_CURRXYWH, msg[4], msg[5], msg[6], msg[7]);
					break;
                case WM_FULLED:
                    maximize_window(&msg[3]);
                    break;
				case WM_SIZED:
                   	wind_set(msg[3], WF_CURRXYWH, msg[4], msg[5], msg[6], msg[7]);
					break;
				case WM_REDRAW:
					break;
                case WM_CLOSED:
                    if (msg[3] == window1.handle) {
                        wind_close(window1.handle);
                        window1.handle = -1;
                    } else if (msg[3] == window2.handle) {
                        wind_close(window2.handle);
                        window2.handle = -1;
                    }
                    break;
            }
        }
    }
    
    exit_gem();

    return 0;
}