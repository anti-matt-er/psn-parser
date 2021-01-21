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
        expecT(hand1.ante).toEqual(0);
    });

    it('should extract seat information', () => {
        expect(hand1.btn_notation).toBe(true);
        expect(hand1.seats).toEqual(7);
        expect(hand1.max_seats).toEqual(10);
        expect(hand1.dealer).toEqual(3);
    });
});