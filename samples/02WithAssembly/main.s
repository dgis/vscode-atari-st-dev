	xdef _start

	text

_start:					; start of the executable
	clr.l	-(sp)
	move.w	#$20,-(sp)		; Super() go into super mode.
	trap	#1			; call GEMDOS
	addq.l	#6,sp
	move.l	d0,stack_backup 	; backup stack pointer

main:					; start of the program
	move.w	#0,-(sp)		; set low resolution
	move.l	#-1,-(sp)
	move.l	#-1,-(sp)
	move.w	#5,-(sp)		; Setscreen
	trap	#14			; call XBIOS
	add.l	#12,sp



; Most of the following source code comes from "The Atari ST MC68000 Assembly Language Tutorials"
; written by Perihelion ( https://nguillaumin.github.io/perihelion-m68k-tutorials/_of_making_the_mountain_move_to_mohammed.html )


	jsr	init_sprite_data	; pre-shift the sprite and mask data

; save the old palette
	move.l	#palette_backup,a0	; put backup address in a0
	movem.l	$ffff8240,d0-d7		; copy all palettes into d0-d7
	movem.l	d0-d7,(a0)		; move data into palette_backup

; copy the palette to the screen
	movem.l	backgrnd+2,d0-d7
	movem.l	d0-d7,$ff8240

; copy the background image to the screen
	move.l	#backgrnd+34,a0		; pixel part of background
	move.l	$44e,a1			; put screen memory in a1
	move.l	#7999,d0		; 8000 longwords to a screen
.pic_loop:
	move.l	(a0)+,(a1)+		; move one longword to screen
	dbf	d0,.pic_loop		; background painted


	; jsr	save_background		; something in restore buffer

	move.l	#curve,curve_pos	; initialize curve position

	move.l	$70,vbl_backup		; backup $70
	move.l	#vbl,$70                ; put in main routine

	move.w	#7,-(sp)
	trap	#1
	addq.l	#2,a7			; wait keypress

	move.l	vbl_backup,$70		; restore old $70

; restores the old palette
	move.l 	#palette_backup,a0	; palette pointer in a0
	movem.l	(a0),d0-d7		; copy old palette data into registers
	movem.l	d0-d7,$ffff8240		; restore the palette

	move.l	stack_backup,-(sp)	; restore stack pointer
	move.w	#$20,-(sp)		; Super() go into user mode.
	trap	#1			; call GEMDOS
	addq.l	#6,sp

; End of the program
	clr.w	-(sp)			; Pterm0()
	trap	#1			; call GEMDOS


vbl:
	move.w	#$700,$ffff8240
	movem.l d0-d7/a0-a6,-(sp)	; backup registers

	jsr	move_sprite
	jsr	display_sprite

	movem.l	(sp)+,d0-d7/a0-a6	; restore registers
	move.w	backgrnd+2,$ffff8240
	rte

move_sprite:
; moves the sprite coordinates
	move.l	curve_pos,a0		; get curve position
	cmp.w	#-1,(a0)		; check for end of curve
	bne	.curve_continue		; if 0, end of curve reached
	move.l	#curve,a0		; initialize curve position
.curve_continue:
	move.w	(a0)+,x_coord		; get x movement
	move.w	(a0)+,y_coord		; get y movement
	move.l	a0,curve_pos		; set new curve position

	rts

display_sprite:
	move.l	last_sprite_offset,d3
	move.l	#backgrnd+34,a4
	move.l	$44e,a5
	add.l	d3,a4			; add last sprite offset to background
	add.l	d3,a5			; add last sprite offset to screen memory

	; restores the background using data from backgrnd image
	move.l	#32-1,d7		; sprite is 32 scan lines
.background_loop:
	rept	6			; sprite is 6*4 bytes width
	move.l	(a4)+,(a5)+		; copy background to screen memory
	endr
	add.l	#136,a4		; next scan line
	add.l	#136,a5		; next scan line
	dbf	d7,.background_loop

	jsr	get_coordinates
	; a1 points to sprite position on the screen
	; d0 gives x % 16 position

	mulu	#768,d0		; multiply position with full sprite width size

	move.l	#mask,a2
	add.l	d0,a2			; add value to mask pointer

	move.l	#sprite,a3
	add.l	d0,a3			; add value to sprite pointer

	move.l	#32-1,d7		; sprite is 32 scan lines
.sprite_loop:
	rept	6			; sprite is 6*4 bytes width
	; applies the mask to the background
	move.l	(a2)+,d0		; mask data in d0
	move.l	(a1),d1			; background data in d1
	and.l	d0,d1			; and mask and picture data

	; paints the sprite to the screen
	move.l	(a3)+,d0		; sprite data in d0
	or.l	d0,d1			; or sprite and background data
	move.l	d1,(a1)+		; move sprite data to background

	endr
	add.l	#136,a1		; next scan line
	dbf	d7,.sprite_loop

	rts

get_coordinates
; makes a1 point to correct place on screen
; sprite position in d0.w
	move.l	$44e,a1			; screen memory in a1
	
	clr.l	d2			; clear sprite offset

	move.w	y_coord,d0		; put y coordinate in d0
	mulu	#160,d0		; 160 bytes to a scan line
	add.l	d0,d2			; add to sprite offset
	move.w	x_coord,d0		; put x coordinate in d0
	divu.w	#16,d0			; number of clusters in low, bit in high
	clr.l	d1			; clear d1
	move.w	d0,d1			; move cluster part to d1
	mulu.w	#8,d1			; 8 bytes to a cluster
	add.l	d1,d2			; add cluster part to sprite offset
	move.l	d2,last_sprite_offset	; add sprite offset to last sprite offset
	add.l	d2,a1			; add sprite offset to screen memory pointer

	clr.w	d0			; clear out the cluster value
	swap	d0			; bit to alter in low part of d0

	rts

init_sprite_data:
; pre-shifting sprite
	move.l	#spr_dat,a0		; original sprite data
	add.l	#34,a0			; skip palette
	move.l	#sprite,a1		; storage of pre-shifted sprite

	move.l	#32-1,d0		; 32 scan lines per sprite
.first_sprite:
	move.l	(a0)+,(a1)+		; move from original to pre-shifted
	move.l	(a0)+,(a1)+
	move.l	(a0)+,(a1)+
	move.l	(a0)+,(a1)+		; 32 pixels moved
	add.l	#8,a1			; jump over end words
	add.l	#144,a0		; jump to next scan line
	dbf	d0,.first_sprite
	
	; the picture sprite has been copied to first position in pre-shift

	move.l	#sprite,a0		; point to beginning of storage area
	move.l	#sprite,a1		; point to beginning of storage area
	add.l	#768,a1		; point to next sprite position

	move.l	#15-1,d1		; 15 sprite positions left
.positions_sprite:
	move.l	#32-1,d2		; 32 scan lines per sprite
.line_sprite:
	move.l	#4-1,d3			; 4 bit planes
.plane_sprite:
	move.w	(a0),d0			; move one word
	roxr	#1,d0			; pre-shift
	move.w	d0,(a1)			; put it in place

	move.w	8(a0),d0		; move one word
	roxr	#1,d0			; pre-shift
	move.w	d0,8(a1)		; put it in place

	move.w	16(a0),d0		; move one word
	roxr	#1,d0			; pre-shift
	move.w	d0,16(a1)		; put it in place

	add.l	#2,a0			; next bit plane, also clears X flag
	add.l	#2,a1			; next bit plane

	dbf	d3,.plane_sprite

	add.l	#16,a0			; next scan line
	add.l	#16,a1			; next scan line

	dbf     d2,.line_sprite

	dbf     d1,.positions_sprite
	
	; pre-shift of sprite done, all 16 sprite possitions saved in sprite


; pre-shifting mask
	move.l	#spr_dat,a0
	add.l	#34+160*32,a0		; skip palette and sprite
	move.l	#mask,a1		; load up mask part

	move.l	#32-1,d0		; 32 scan lines per sprite
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


	move.l	#mask,a0		; point to beginning of storage area
	move.l	#mask,a1		; point to beginning of storage area
	add.l	#768,a1		; point to next mask position

	move.l	#15-1,d1		; 15 sprite positions left
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
	
	; pre-shift of mask done, all 16 sprite possitions saved in mask
	rts

		section data
x_coord		dc.w	0
y_coord		dc.w	0
last_sprite_offset	dc.l	0


spr_dat		incbin	sprite.pi1
backgrnd	incbin	backgrnd.pi1
curve		incbin	curve.bin

		section bss
palette_backup	ds.l	8
stack_backup	ds.l	1
vbl_backup	ds.l	1

sprite		ds.l	3072		; 32/2+8*32 bytes 16 positions / 4 for long
mask		ds.l	3072		; same as above
bgsave		ds.l	192		; 32/2+8*32 bytes / 4 for long


curve_pos	ds.l	0
		end