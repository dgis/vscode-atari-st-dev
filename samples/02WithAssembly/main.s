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

	move.l	$70.w,backup_vbl	; backup VBL
	move.l	$120.w,backup_hbl	; backup HBL
	move.w	#0,$ff8240		; black background color


	move.b	$fffa21,backup_b_data	; backup MFP Timer B data
	move.b	$fffa1b,backup_b_ctl	; backup MFP Timer B Control
	move.b	$fffa07,backup_a_enable	; backup MFP Interrupt Enable A
	move.b	$fffa13,backup_a_mask	; backup MFP Interrupt Mask A
	move.b	$fffa09,backup_b_enable	; backup MFP Interrupt Enable B

	; set timers
	and.b	#$ef,$fffa13
	and.b	#$ef,$fffa0f
	and.b	#$ef,$fffa0b
	clr.b	$fffa07
	clr.b	$fffa1b
	clr.b	$fffa09
	or.b	#1,$fffa07
	or.b	#1,$fffa13
	move.b	#1,$fffa21


	move.l	#palette,pointer	; set the palette change pointer for the HBL
	move.l	#.vbl,$70		; set new VBL interrupt
	move.l	#.hbl,$120		; set new HBL interrupt

.loop:
	move.l	#100,d0
.wait	dbra	d0,.wait
	cmpi.b	#$39,$fffc02
	bne	.loop

	move.l	backup_vbl,$70		; restore VBL
	move.l	backup_hbl,$120		; restore HBL

	move.b	backup_b_data,$fffa21	; restore MFP Timer B data
	move.b	backup_b_ctl,$fffa1b	; restore MFP Timer B Control
	move.b	backup_a_enable,$fffa07	; restore MFP Interrupt Enable A
	move.b	backup_a_mask,$fffa13	; restore MFP Interrupt Mask A
	move.b	backup_b_enable,$fffa09	; restore MFP Interrupt Enable B

	move.w	#$777,$ff8240		; restore background color

	move.l	stack_backup,-(sp)	; restore stack pointer
	move.w	#$20,-(sp)		; Super() go into user mode.
	trap	#1			; call GEMDOS
	addq.l	#6,sp

	clr.w	-(sp)			; Pterm0()
	trap	#1			; call GEMDOS


.vbl	move.l	a0,-(sp)
	move.l	pointer,a0
	add.l	#2,a0
	cmp.w	#$ffff,(a0)
	bne	.vbl_next
	move.l	#palette,pointer
.vbl_next
	move.l	(sp)+,a0
	move.b	#8,$fffa1b
	rte

.hbl	move.l	a0,-(sp)
	move.l	pointer,a0
	move.w	(a0)+,$ff8240		; change background color
	move.l	a0,pointer
	cmp.w	#$ffff,(a0)
	beq	.hbl2
.hbl_end
	move.l	(sp)+,a0
	bclr	#0,$fffa0f
	rte
.hbl2
	move.b	#0,$fffa1b
	bra	.hbl_end

	data
palette	incbin	'raster.cnx'

	bss
	even
pointer		ds.l	1
stack_backup	ds.l	1
backup_vbl	ds.l	1
backup_hbl	ds.l	1
backup_b_data	ds.b	1
backup_b_ctl	ds.b	1
backup_a_enable	ds.b	1
backup_a_mask	ds.b	1
backup_b_enable	ds.b	1

	end