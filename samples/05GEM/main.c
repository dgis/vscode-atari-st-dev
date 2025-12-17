#include <stdio.h>
#include <gem.h>

int ap_id;
int win1_handle = -1, win2_handle = -1;

void init_gem(void) {
    ap_id = appl_init();
}

void exit_gem(void) {
    if (win1_handle >= 0) wind_close(win1_handle);
    if (win2_handle >= 0) wind_close(win2_handle);
    appl_exit();
}

void open_window(int *handle, char *title) {
    if (*handle < 0) {
        *handle = wind_create(NAME | CLOSER | MOVER, 50, 50, 200, 100);
        if (*handle >= 0) {
            wind_set_ptr(*handle, WF_NAME, title);
            wind_open(*handle, 50, 50, 200, 100);
        }
    }
}

void show_dialog(void) {
    form_alert(1, "[1][Sample Dialog|This is a simple dialog box.][OK]");
}

int main(void) {
    short msg[8];
    int event, done = 0;
    
    init_gem();
    
    if (ap_id < 0) {
        printf("Failed to initialize GEM\r\n");
        return 1;
    }
    
    printf("GEM Sample Application Started\r\n");
    printf("Use menu or keyboard shortcuts:\r\n");
    printf("1 - Open Window 1\r\n");
    printf("2 - Open Window 2\r\n");
    printf("D - Show Dialog\r\n");
    printf("Q - Quit\r\n\r\n");
    
    short mouse_x, mouse_y, mouse_button_state, mouse_click, keyState, key;

    while (!done) {
        // event = evnt_multi(MU_KEYBD|MU_MESAG, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        //     msg, 0, 0, 0, 0, 0, 0, 0);
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
            &keyState, // short *KeyState,
            &key, // short *Key,
            &mouse_click // short *ReturnCount
        );
        
        if (event & MU_KEYBD) {
            int keyCode = key >> 8;
            int keyAscii = key & 0xFF;
            switch (keyAscii) {
                case '1':
                    open_window(&win1_handle, "Window 1");
                    break;
                case '2':
                    open_window(&win2_handle, "Window 2");
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
                case WM_CLOSED:
                    if (msg[3] == win1_handle) {
                        wind_close(win1_handle);
                        win1_handle = -1;
                    } else if (msg[3] == win2_handle) {
                        wind_close(win2_handle);
                        win2_handle = -1;
                    }
                    break;
            }
        }
    }
    
    exit_gem();
    printf("GEM Application Terminated\r\n");
    return 0;
}