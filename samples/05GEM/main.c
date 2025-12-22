#include <stdio.h>
#include <gem.h>
#include "main.h"

typedef int BOOL;
#define FALSE 0
#define TRUE 1

struct window {
	short handle; // window handle
};
struct window window1 = {
		.handle = -1
	}, window2 = {
		.handle = -1
	};

OBJECT *menu_tree;

void open_window(short *handle, char *title, char *info) {
	if (*handle < 0) {
		short desktop_x, desktop_y, desktop_w, desktop_h;
		wind_get(DESK, WF_WORKXYWH, &desktop_x, &desktop_y, &desktop_w, &desktop_h);
		*handle = wind_create(NAME | CLOSER | FULLER | MOVER | INFO | SIZER, desktop_x, desktop_y, desktop_w, desktop_h);
		if (*handle >= 0) {
			wind_set_ptr(*handle, WF_NAME, title);
			wind_set_ptr(*handle, WF_INFO, info);
			wind_open(*handle, 50, 50, 200, 100);
		}
	}
}

BOOL is_window_maximized(short handle) {
	short current_x, current_y, current_w, current_h;
	wind_get(handle, WF_CURRXYWH, &current_x, &current_y, &current_w, &current_h);

	short fullscreen_x, fullscreen_y, fullscreen_w, fullscreen_h;
	wind_get(handle, WF_FULLXYWH, &fullscreen_x, &fullscreen_y, &fullscreen_w, &fullscreen_h);

	return current_x != fullscreen_x || current_y != fullscreen_y || current_w != fullscreen_w || current_h != fullscreen_h ? FALSE : TRUE;
}

void maximize_window(short handle) {
	if (is_window_maximized(handle)) {
		short previous_x, previous_y, previous_w, previous_h;
		wind_get(handle, WF_PREVXYWH, &previous_x, &previous_y, &previous_w, &previous_h);

		short fullscreen_x, fullscreen_y, fullscreen_w, fullscreen_h;
		wind_get(handle, WF_FULLXYWH, &fullscreen_x, &fullscreen_y, &fullscreen_w, &fullscreen_h);

		graf_shrinkbox(previous_x, previous_y, previous_w, previous_h, fullscreen_x, fullscreen_y, fullscreen_w, fullscreen_h);
		wind_set(handle, WF_CURRXYWH, previous_x, previous_y, previous_w, previous_h);
	} else {
		short current_x, current_y, current_w, current_h;
		short fullscreen_x, fullscreen_y, fullscreen_w, fullscreen_h;

		wind_get(handle, WF_CURRXYWH, &current_x, &current_y, &current_w, &current_h);
		wind_get(handle, WF_FULLXYWH, &fullscreen_x, &fullscreen_y, &fullscreen_w, &fullscreen_h);
		graf_growbox(current_x, current_y, current_w, current_h, fullscreen_x, fullscreen_y, fullscreen_w, fullscreen_h);
		wind_set(handle, WF_CURRXYWH, fullscreen_x, fullscreen_y, fullscreen_w, fullscreen_h);
	}
}

void show_dialog(void) {
	form_alert(1, "[1][Sample Dialog|This is a simple dialog box.][OK]");
}

int main(void) {
	short msg[8];
	short event, done = 0;
	
	short application_id = appl_init();
	if (application_id >= 0) {
		if (rsrc_load("MAIN.RSC")) {
			rsrc_gaddr(R_TREE, MENU_MAIN, &menu_tree);
			menu_bar(menu_tree, 1);
		} else {
			printf("Failed to load MAIN.RSC\r\n");
			return 1;
		}
	} else {
		printf("Failed to initialize GEM\r\n");
		return 1;
	}

	graf_mouse(ARROW, 0L);

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
					open_window(&window1.handle, "Window 1", "Open from the keyboard");
					break;
				case '2':
					open_window(&window2.handle, "Window 2", "Open from the keyboard");
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
							open_window(&window1.handle, "Window 1", "Open from the menu");
							break;
						case MENU_WINDOW2:
							open_window(&window2.handle, "Window 2", "Open from the menu");
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
				case WM_SIZED:
					wind_set(msg[3], WF_CURRXYWH, msg[4], msg[5], msg[6], msg[7]);
					break;
				case WM_FULLED:
					maximize_window(msg[3]);
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
	
	if (window1.handle >= 0)
		wind_close(window1.handle);
	if (window2.handle >= 0)
		wind_close(window2.handle);
	menu_bar(menu_tree, 0);
	rsrc_free();
	appl_exit();

	return 0;
}