; Part of this source code comes from "The Atari ST MC68000 Assembly Language Tutorials"
; written by Perihelion ( https://nguillaumin.github.io/perihelion-m68k-tutorials/_of_making_the_mountain_move_to_mohammed.html )

	xdef _start

SPRITE_NUMBER equ 6				; number of sprites to display
SHOW_HBL_METER equ 0				; set to 1 to show HBL meter

	text

_start:						; start of the executable
	clr.l	-(sp)
	move.w	#$20,-(sp)			; Super() go into super mode.
	trap	#1				; call GEMDOS
	addq.l	#6,sp
	move.l	d0,stack_backup 		; backup stack pointer

main:						; start of the program
	move.w	#0,-(sp)			; set low resolution
	move.l	#-1,-(sp)
	move.l	#-1,-(sp)
	move.w	#5,-(sp)			; Setscreen()
	trap	#14				; call XBIOS
	add.l	#12,sp


	; For double buffering, set up two screen buffers
	move.l	#screen_buffer,d0		; put screen_buffer address in d0
	clr.b	d0				; align to 256 bytes
	move.l	d0,screen1			; save screen1 address
	add.l	#32000,d0			; next screen buffer
	move.l	d0,screen2			; save screen2 address

	; display the screen1
	move.b  screen1+1,$ffff8201		; put in high screen address byte
	move.b  screen1+2,$ffff8203		; put in mid screen address byte


	jsr	init_sprite_data		; pre-shift the sprite and mask data

; save the old screen memory address
	move.l $44e,screen_backup

; save the old palette
	move.l	#palette_backup,a0		; put backup address in a0
	movem.l	$ffff8240,d0-d7			; copy all palettes into d0-d7
	movem.l	d0-d7,(a0)			; move data into palette_backup

; copy the palette to the system
	movem.l	background_file+2,d0-d7
	movem.l	d0-d7,$ff8240

; copy the background image to the screen
	move.l	#background_file+34,a0		; pixel part of background
	move.l	screen1,a1			; put screen1 memory in a1
	move.l	screen2,a2			; put screen2 memory in a2
	move.l	#7999,d0			; 8000 longwords to a screen
	.pic_loop:
		move.l	(a0),(a1)+		; move one longword to screen1
		move.l	(a0)+,(a2)+		; move one longword to screen2
	dbf	d0,.pic_loop			; background painted

	; initialize curve positions
	rept SPRITE_NUMBER
	move.l	#curve_file+2*REPTN*30,curve_pos+4*REPTN
	endr

; Macro to get the sprite offset on the screen
; inputs:
;	d3 = last sprite offset
; outputs:
;	a1 = points to sprite position on a screen (screen address offset)
;	d0 = x % 16 position
GET_SPRITE_OFFSET macro	; (\1 -> sprite index 0..SPRITE_NUMBER-1)

	; get the next curve position for sprite \1
	move.l	curve_pos+4*\1,a0		; get curve position
	cmp.w	#-1,(a0)			; check for end of curve
	bne	.curve_continue\@		; if 0, end of curve reached
		move.l	#curve_file,a0		; initialize curve position
	.curve_continue\@:
	move.l	#0,a1
	move.w	(a0)+,a1			; get the screen address offset of the 16pixels cluster
	move.w	(a0)+,d0			; get the pixel number inside the cluster (0-15)
	move.l	a0,curve_pos+4*\1		; set new curve position

	; a1 points to sprite position on a screen (screen address offset)
	; d0 gives x % 16 position

	endm

main_loop:
	; do twice for double buffering (old sprites positions are differents from one screen to another)
	rept 2
SCREEN_NUMBER set REPTN

		move.w	#37,-(sp)		; Vsync()
		trap	#14			; call XBIOS
		addq.l	#2,sp
	
		if SHOW_HBL_METER
			move.w	#$700,$ffff8240	; HBL meter ON
		endif

		rept SPRITE_NUMBER
			move.l	last_sprite_offset+4*REPTN+SCREEN_NUMBER*SPRITE_NUMBER*4,d3
			move.l	#background_file+34,a4
			move.l	screen1,a5
			add.l	d3,a4			; add last sprite offset to background
			add.l	d3,a5			; add last sprite offset to screen memory

			jsr hide_sprite
		endr

		rept SPRITE_NUMBER
			GET_SPRITE_OFFSET REPTN

			move.l	a1,last_sprite_offset+4*REPTN+SCREEN_NUMBER*SPRITE_NUMBER*4	; add sprite offset to last sprite offset
			add.l	screen1,a1			; add screen address in a1

			; a1 points to sprite position on the screen (screen address)
			; d0 gives x % 16 position
			jsr	display_sprite
		endr

		if SHOW_HBL_METER
			move.w	background_file+2,$ffff8240	; HBL meter OFF
		endif

		; display the screen1
		move.b  screen1+1,$ffff8201	; put in high screen address byte
		move.b  screen1+2,$ffff8203	; put in mid screen address byte

		; swap screens
		move.l	screen1,a0
		move.l	screen2,screen1
		move.l	a0,screen2		; and flip them for next time around
		; now we can draw to screen1 again

	endr

	; animate the palette by rotating the palette colors every 2 frames
	move.w	$ffff8240+2,d0
	movem.l	$ffff8240+4,d1-d6
	movem.l	d1-d6,$ffff8240+2
	move.w	d0,$ffff8240+24


	cmp.b	#$39,$fffc02			; space pressed?
	bne	main_loop			; if not, repeat main loop


; Restores the old palette
	move.l 	#palette_backup,a0		; palette pointer in a0
	movem.l	(a0),d0-d7			; copy old palette data into registers
	movem.l	d0-d7,$ffff8240			; restore the palette

; Restores the old screen memory address
	move.b  screen_backup+1,$ffff8201	; put in high screen address byte
	move.b  screen_backup+2,$ffff8203	; put in mid screen address byte


	move.l	stack_backup,-(sp)		; restore stack pointer
	move.w	#$20,-(sp)			; Super() go into user mode.
	trap	#1				; call GEMDOS
	addq.l	#6,sp

; End of the program
	clr.w	-(sp)				; Pterm0()
	trap	#1				; call GEMDOS


; Hides the sprite at the last sprite offset
; inputs:
;	a4 = address of background + last sprite offset
;	a5 = address of screen to hide the sprite + last sprite offset
hide_sprite:
	; restores the background using data from backgrnd.pi1 image
	move.l	#32-1,d7			; sprite is 32 scan lines
	.background_loop:
		rept	6			; sprite is 6*4 bytes width
			move.l	(a4)+,(a5)+	; copy background to screen memory
		endr
		add.l	#136,a4		; next scan line
		add.l	#136,a5		; next scan line
	dbf	d7,.background_loop
	rts


; Displays the sprite at the coordinates
; inputs:
;	a1 = screen memory position
;	d0 = x % 16 position
display_sprite:

	mulu	#768,d0			; multiply position with full sprite width size

	move.l	#mask,a2
	add.l	d0,a2				; add value to mask pointer

	move.l	#sprite,a3
	add.l	d0,a3				; add value to sprite pointer

	move.l	#32-1,d7			; sprite is 32 scan lines
	.sprite_loop:
		rept	6			; sprite is 6*4 bytes width
			; applies the mask to the background
			move.l	(a2)+,d0	; mask data in d0
			move.l	(a1),d1		; background data in d1
			and.l	d0,d1		; and mask and picture data

			; paints the sprite to the screen
			move.l	(a3)+,d0	; sprite data in d0
			or.l	d0,d1		; or sprite and background data
			move.l	d1,(a1)+	; move sprite data to background

		endr
		add.l	#136,a1		; next scan line (160-24=136)
	dbf	d7,.sprite_loop

	rts

; Initializes the pre-shifted sprite and mask data
init_sprite_data:
	; pre-shifting sprite
	move.l	#sprite_file,a0			; original sprite data
	add.l	#34,a0				; skip palette
	move.l	#sprite,a1			; storage of pre-shifted sprite

	move.l	#32-1,d0			; 32 scan lines per sprite
	.first_sprite:
		move.l	(a0)+,(a1)+		; move from original to pre-shifted
		move.l	(a0)+,(a1)+
		move.l	(a0)+,(a1)+
		move.l	(a0)+,(a1)+		; 32 pixels moved
		add.l	#8,a1			; jump over end words
		add.l	#144,a0		; jump to next scan line
	dbf	d0,.first_sprite
	
	; the picture sprite has been copied to first position in pre-shift

	move.l	#sprite,a0			; point to beginning of storage area
	move.l	#sprite,a1			; point to beginning of storage area
	add.l	#768,a1			; point to next sprite position

	andi	#$ef,ccr			; clear the X flag
	move.l	#15-1,d1			; 15 sprite positions left
	.positions_sprite:
		move.l	#32-1,d2		; 32 scan lines per sprite
		.line_sprite:
			move.l	#4-1,d3			; 4 bit planes
			.plane_sprite:
				move.w	(a0),d0		; move one word
				roxr	#1,d0		; pre-shift
				move.w	d0,(a1)		; put it in place

				move.w	8(a0),d0	; move one word
				roxr	#1,d0		; pre-shift
				move.w	d0,8(a1)	; put it in place

				move.w	16(a0),d0	; move one word
				roxr	#1,d0		; pre-shift
				move.w	d0,16(a1)	; put it in place

				add.l	#2,a0		; next bit plane, also clears X flag
				add.l	#2,a1		; next bit plane

			dbf	d3,.plane_sprite

			add.l	#16,a0			; next scan line
			add.l	#16,a1			; next scan line

		dbf     d2,.line_sprite

	dbf     d1,.positions_sprite
	; pre-shift of sprite done, all 16 sprite possitions saved in sprite


	; pre-shifting mask
	move.l	#sprite_file,a0
	add.l	#34+160*32,a0			; skip palette and sprite
	move.l	#mask,a1			; load up mask part

	move.l	#32-1,d0			; 32 scan lines per sprite
	.first_mask:
		move.l	(a0)+,(a1)		; move from original to pre-shifted
		not.l	(a1)+			; invert the mask data
		move.l	(a0)+,(a1)
		not.l	(a1)+			; invert the mask data
		move.l	(a0)+,(a1)
		not.l	(a1)+			; invert the mask data
		move.l	(a0)+,(a1)		;
		not.l	(a1)+			; invert the mask data
		move.l	#$ffffffff,(a1)+	;  fill last two words...
		move.l	#$ffffffff,(a1)+	;  ... with all 1's

		add.l	#144,a0		; jump to next scan line
	dbf	d0,.first_mask
	
	; the picture mask has been copied to first position in pre-shift


	move.l	#mask,a0			; point to beginning of storage area
	move.l	#mask,a1			; point to beginning of storage area
	add.l	#768,a1			; point to next mask position

	move.l	#15-1,d1			; 15 sprite positions left
	.positions_mask:
		move.l	#32-1,d2		; 32 scan lines per sprite
		.line_mask:
			move.l	#4-1,d3			; 4 bit planes
			.plane_mask:
				move.w	(a0),d0			; move one word
				roxr	#1,d0			; pre-shift
				or.w	#%1000000000000000,d0	; make sure most significant bit set
				move.w	d0,(a1)			; put it in place

				move.w	8(a0),d0		; move one word
				roxr	#1,d0			; pre-shift
				move.w	d0,8(a1)		; put it in place

				move.w	16(a0),d0		; move one word
				roxr	#1,d0			; pre-shift
				move.w	d0,16(a1)		; put it in place

				add.l	#2,a0			; next bit plane, clears X flag (bad)
				add.l	#2,a1			; next bit plane

			dbf	d3,.plane_mask

			add.l	#16,a0			; next scan line
			add.l	#16,a1			; next scan line

		dbf	d2,.line_mask

	dbf	d1,.positions_mask
	
	; pre-shift of mask done, all 16 sprite positions saved in mask
	rts


	section data
	even

; last sprite offsets for each sprite and each screen
last_sprite_offset	dcb.l	2*SPRITE_NUMBER,0

sprite_file	incbin	sprite.pi1
background_file	incbin	backgrnd.pi1
curve_file	incbin	curve.bin

	section bss
	even

screen_backup	ds.l    1
palette_backup	ds.l	8
stack_backup	ds.l	1

sprite		ds.l	3072			; 32/2+8*32 bytes 16 positions / 4 for long for the sprite colors
mask		ds.l	3072			; same as above for the sprite mask

		ds.b    256
screen_buffer	ds.b    2*32000
screen1		ds.l    1
screen2		ds.l    1

curve_pos	ds.l	SPRITE_NUMBER

	end