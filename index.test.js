'use strict';

import { PSN } from './index.js';

const hand1_psn =
`NLH 200 BTN 3/7/10
4=6B 5=10B 6=12B
#P 6:R3B 4:RA 5:C 6:C
#F[7h2h5s] 5:C 6:RA 5:X
#T[5d]
#R[4d]
#S 4 WIN P 4[QdAh]PA+AQ 6[JdAc]PA+AJ`;
const hand1 = new PSN(hand1_psn);

const hand2_psn =
`NLH 0|100|200 7
DATE 2021-01-21T18:15:00Z LVL 4 BUY 5.00USD

BTN="TheNuts2832"
SB="the_donkey"
BB="Aceiraptor"
UTG="anti-matt-er"
UTG+1="Und3rd0g"
MP="nit1989"
CO="bigmoney00"

UTG=HERO

BTN=3210 SB=6B BB=2000 UTG=12B UTG+1=8B199 MP=9B25 CO=4045

#Preflop
UTG:R3B UTG+1:X MP:X CO:X BTN:X SB:RA BB:C UTG:CA

#Flop[7♥ 2♥ 5♠]
BB:C UTG:RA BB:X UTG[Q♦ A♥] BB[J♦ A♣]

#Turn[5♦]

#River[4♦]

#Showdown
UTG WIN 3850 UTG[Q♦ A♥]PA+AQ`;
const hand2 = new PSN(hand2_psn);

describe('whitespace', () => {
    const dirty_text = "This   is\n\n\nsome  file \n\r using  \r multiple  style \r\n line endings \n\r\n \r \n";

    it('should convert all new lines to spaces', () => {
        let cleaned = PSN.clean_whitespace(dirty_text);
        expect(cleaned).not.toContain('\r');
        expect(cleaned).not.toContain('\n');
    });

    it('should strip repeated whitespace', () => {
        expect(PSN.clean_whitespace(dirty_text)).not.toMatch(/\s\s+/);
    });

    it('should remove any whitespace at the end', () => {
        let cleaned = PSN.clean_whitespace(dirty_text);
        let last_char = cleaned.slice(cleaned.length - 1);
        expect(last_char).not.toMatch(/\s/);
    });
});

describe('game info', () => {
    it('should extract bet information', () => {
        expect(hand1.big_blind).toEqual(200);
        expect(hand1.small_blind).toEqual(100);
        expect(hand1.ante).toEqual(0);

        expect(hand2.big_blind).toEqual(200);
        expect(hand2.small_blind).toEqual(100);
        expect(hand2.ante).toEqual(0);
    });

    it('should extract seat information', () => {
        expect(hand1.btn_notation).toBe(true);
        expect(hand1.seats).toEqual(7);
        expect(hand1.max_seats).toEqual(10);
        expect(hand1.dealer).toEqual(3);

        expect(hand2.btn_notation).toBe(false);
        expect(hand2.seats).toEqual(7);
        expect(hand2.max_seats).toEqual(7);
        expect(hand2.dealer).toBe(false);
    });
});