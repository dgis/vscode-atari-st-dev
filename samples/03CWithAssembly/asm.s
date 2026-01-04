	xdef demoASM				; Export the demoASM label to C.
	xref palette				; Import the palette label from C.

	text

demoASM:
	clr.l	-(sp)
	move.w	#$20,-(sp)			; Super() go into super mode.
	trap	#1				; Call GEMDOS.
	addq.l	#6,sp
	move.l	d0,stack_backup 		; Backup stack pointer.

	move.w	#0,-(sp)			; Set low resolution.
	move.l	#-1,-(sp)
	move.l	#-1,-(sp)
	move.w	#5,-(sp)			; Setscreen().
	trap	#14				; Call XBIOS.
	add.l	#12,sp

	move.w	#0,$ffff8240			; Set black background color.

	; Backup interrupts.
	move.l	$70.w,backup_vbl		; Backup VBL.
	move.l	$120.w,backup_hbl		; Backup HBL.
	move.b	$fffffa07,backup_a_enable	; Backup MFP Interrupt A Enable.
	move.b	$fffffa13,backup_a_mask		; Backup MFP Interrupt A Mask.
	move.b	$fffffa15,backup_b_mask		; Backup MFP Interrupt B Mask.
	move.b	$fffffa1b,backup_b_ctl		; Backup MFP Timer B Control.
	move.b	$fffffa21,backup_b_data		; Backup MFP Timer B Data.

	; Configure Timer B (HBL), explained in "The Atari ST MC68000 Assembly Language Tutorials" written by Perihelion.
	clr.b	$fffffa1b			; Disable timer b.
	bset	#0,$fffffa07			; Turn on timer b in MFP Interrupt A Enable.
	bset	#0,$fffffa13			; Turn on timer b in MFP Interrupt A Mask.
	move.b	#1,$fffffa21			; Number of counts, #1 for every scan line.
	move.b	#8,$fffffa1b			; Set timer b to event count mode (#8).

	move.l	#palette,current_color		; Set the palette change current color pointer for the HBL.
	move.l	#.vbl,$70			; Set new VBL interrupt.
	move.l	#.hbl,$120			; Set new HBL interrupt.

.loop:
	move.l	#100,d0
.wait	dbra	d0,.wait
	cmpi.b	#$1c,$fffffc02			; Check for ESC key press.
	bne	.loop

	; Restore interrupts.
	move.b	backup_b_data,$fffffa21		; Restore MFP Timer B Data.
	move.b	backup_b_ctl,$fffffa1b		; Restore MFP Timer B Control.
	move.b	backup_b_mask,$fffffa15		; Restore MFP Interrupt B Mask.
	move.b	backup_a_mask,$fffffa13		; Restore MFP Interrupt A Mask.
	move.b	backup_a_enable,$fffffa07	; Restore MFP Interrupt A Enable.
	move.l	backup_hbl,$120			; Restore HBL.
	move.l	backup_vbl,$70			; Restore VBL.

	move.w	#$777,$ffff8240			; Restore background color.

	move.l	stack_backup,-(sp)		; Restore stack pointer.
	move.w	#$20,-(sp)			; Super() go into user mode.
	trap	#1				; Call GEMDOS.
	addq.l	#6,sp

	rts


.vbl	move.l	a0,-(sp)
	move.l	current_color,a0
	add.l	#2,a0
	cmp.w	#$ffff,(a0)			; This is the end of the palette?
	bne	.vbl_next
	move.l	#palette,current_color		; Restart from the beginning of the palette.
.vbl_next
	move.l	(sp)+,a0
	move.b	#8,$fffffa1b			; Enable timer B for HBLs.
	rte

.hbl	move.l	a0,-(sp)			; Backup a0.
	move.l	current_color,a0
	move.w	(a0)+,$ffff8240			; Change background color and advance color pointer.
	move.l	a0,current_color
	cmp.w	#$ffff,(a0)			; Is this the end of the palette?
	beq	.hbl_palette_end
.hbl_end
	move.l	(sp)+,a0			; Restore a0.
	bclr	#0,$fffffa0f			; HBL interrupt is done.
	rte
.hbl_palette_end
	clr.b	$fffffa1b			; Disable timer B for the remainder of the VBL.
	bra	.hbl_end			; Go back to end of HBL.

	bss
	even
current_color	ds.l	1
stack_backup	ds.l	1
backup_vbl	ds.l	1
backup_hbl	ds.l	1
backup_a_enable	ds.b	1
backup_a_mask	ds.b	1
backup_b_mask	ds.b	1
backup_b_ctl	ds.b	1
backup_b_data	ds.b	1

	end