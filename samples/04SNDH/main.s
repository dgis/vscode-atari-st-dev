	xdef _start

	text

_start:					; start of the executable
main:					; start of the program
	clr.l	-(sp)
	move.w	#$20,-(sp)		; Super() go into super mode.
	trap	#1			; call GEMDOS
	addq.l	#6,sp
	move.l	d0,stack_backup 	; backup stack pointer

	move.l	$70.w,backup_vbl	; backup VBL

	moveq	#1,d0
	jsr	music_sndh_file		; init SNDH file
	move.l	#.vbl,$70		; set new VBL interrupt

.loop:
	move.l	#100,d0
.wait:	dbra	d0,.wait
	cmpi.b	#$39,$fffc02
	bne	.loop
	
	move.l	backup_vbl,$70		; restore VBL
	jsr	music_sndh_file+4	; exit SNDH file


	move.l	stack_backup,-(sp)	; restore stack pointer
	move.w	#$20,-(sp)		; Super() go into user mode.
	trap	#1			; call GEMDOS
	addq.l	#6,sp

	clr.w	-(sp)			; Pterm0()
	trap	#1			; call GEMDOS

.vbl:
	jsr	music_sndh_file+8	; play SNDH file
	rte

	data
	even
music_sndh_file:
	incbin	'union.snd'		; madmax rocks

	bss
	even
stack_backup	ds.l	1
backup_vbl	ds.l	1

	end