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
DATE 2021-01-21T18:15:00Z LVL 4 BUY 5.00USD INFO "An example \\"PSN\\" hand"

BTN="TheNuts2832"
SB="the_donkey"
BB="Aceiraptor"
UTG="anti-matt-er"
UTG+1="Und3rd0g"
HJ="nit1989"
CO="bigmoney00"

UTG=HERO

BTN=3210 SB=6B BB=2000 UTG=12B UTG+1=8B199 HJ=9B25 CO=4045

#Preflop
UTG:R3B UTG+1:X HJ:X CO:X BTN:X SB:RA BB:C UTG:CA

#Flop[7♥ 2♥ 5♠]
BB:C UTG:RA BB:X UTG[Q♦ A♥] BB[J♦ A♣]

#Turn[5♦]

#River[4♦]

#Showdown
UTG WIN 3850 UTG[Q♦ A♥]PA+AQ`;
const hand2 = new PSN(hand2_psn);

const heads_up_psn =
`NLH 200 2
1=12B 2=6B
#P 1:R3B 2:RA 1:C
#F[7h2h5s]
#T[5d]
#R[4d]
#S 2 WIN P 2[QdAh]PA+AQ 1[JdAc]PA+AJ`;
const heads_up = new PSN(heads_up_psn);

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

describe('additional info', () => {
    it('should extract all info tags', () => {
        let expected_date = new Date(2021, 0, 21, 18, 15, 0);
        expect(hand2.date.getTime()).toEqual(expected_date.getTime());
        expect(hand2.tournament).toBe(true);
        expect(hand2.level).toEqual(4);
        expect(hand2.currency).toEqual('USD');
        expect(hand2.buy_in).toEqual([5, 0]);
        expect(hand2.info).toEqual('An example "PSN" hand');
    });
});

describe('players', () => {
    it('should extract player stacks', () => {
        expect(hand1.get_seat(1).chips).toBeNull();
        expect(hand1.get_seat(2).chips).toBeNull();
        expect(hand1.get_seat(3).chips).toBeNull();
        expect(hand1.get_seat(4).chips).toEqual(1200);
        expect(hand1.get_seat(5).chips).toEqual(2000);
        expect(hand1.get_seat(6).chips).toEqual(2400);
        expect(hand1.get_seat(7).chips).toBeNull();

        expect(hand2.get_seat('BTN').chips).toEqual(3210);
        expect(hand2.get_seat('SB').chips).toEqual(1200);
        expect(hand2.get_seat('BB').chips).toEqual(2000);
        expect(hand2.get_seat('UTG').chips).toEqual(2400);
        expect(hand2.get_seat('UTG+1').chips).toEqual(1799);
        expect(hand2.get_seat('HJ').chips).toEqual(1825);
        expect(hand2.get_seat('CO').chips).toEqual(4045);
    });

    it('should extract player names', () => {
        expect(hand1.get_seat(1).name).toBeNull();
        expect(hand1.get_seat(2).name).toBeNull();
        expect(hand1.get_seat(3).name).toBeNull();
        expect(hand1.get_seat(4).name).toBeNull();
        expect(hand1.get_seat(5).name).toBeNull();
        expect(hand1.get_seat(6).name).toBeNull();
        expect(hand1.get_seat(7).name).toBeNull();

        expect(hand2.get_seat('BTN').name).toEqual('TheNuts2832');
        expect(hand2.get_seat('SB').name).toEqual('the_donkey');
        expect(hand2.get_seat('BB').name).toEqual('Aceiraptor');
        expect(hand2.get_seat('UTG').name).toEqual('anti-matt-er');
        expect(hand2.get_seat('UTG+1').name).toEqual('Und3rd0g');
        expect(hand2.get_seat('HJ').name).toEqual('nit1989');
        expect(hand2.get_seat('CO').name).toEqual('bigmoney00');
    });

    it('should understand various seat identities', () => {
        expect(hand1.get_seat(0)).toEqual(false);
        expect(hand1.get_seat(-1)).toEqual(false);

        expect(hand1.get_seat(1)).toEqual(hand1.get_seat('HJ'));
        expect(hand1.get_seat(2)).toEqual(hand1.get_seat('CO'));
        expect(hand1.get_seat(3)).toEqual(hand1.get_seat('BTN'));
        expect(hand1.get_seat(4)).toEqual(hand1.get_seat('SB'));
        expect(hand1.get_seat(5)).toEqual(hand1.get_seat('BB'));
        expect(hand1.get_seat(6)).toEqual(hand1.get_seat('UTG'));
        expect(hand1.get_seat(7)).toEqual(hand1.get_seat('UTG+1'));

        expect(hand1.get_seat('BTN')).toEqual(hand1.get_seat('OTB'));
        expect(hand1.get_seat('BTN')).toEqual(hand1.get_seat('BU'));
        expect(hand1.get_seat('BTN')).toEqual(hand1.get_seat('D'));
        expect(hand1.get_seat('SB')).toEqual(hand1.get_seat('S'));
        expect(hand1.get_seat('BB')).toEqual(hand1.get_seat('B'));
        expect(hand1.get_seat('UTG')).toEqual(hand1.get_seat('UG'));
        expect(hand1.get_seat('UTG')).toEqual(hand1.get_seat('U'));
        expect(hand1.get_seat('UTG+1')).toEqual(hand1.get_seat('UG+1'));
        expect(hand1.get_seat('UTG+1')).toEqual(hand1.get_seat('U+1'));
        expect(hand1.get_seat('CO')).toEqual(hand1.get_seat('C'));
        expect(hand1.get_seat('CO')).toEqual(hand1.get_seat('UTG+3'));
        expect(hand1.get_seat('HJ')).toEqual(hand1.get_seat('H'));
        expect(hand1.get_seat('HJ')).toEqual(hand1.get_seat('UTG+2'));
        expect(hand1.get_seat('LJ')).toEqual(hand1.get_seat('L'));
        expect(hand1.get_seat('LJ')).toEqual(hand1.get_seat('UTG+1'));
        
        expect(hand1.get_offset(-2)).toEqual(hand1.get_seat('HJ'));
        expect(hand1.get_offset(-1)).toEqual(hand1.get_seat('CO'));
        expect(hand1.get_offset(0)).toEqual(hand1.get_seat('BTN'));
        expect(hand1.get_offset(1)).toEqual(hand1.get_seat('SB'));
        expect(hand1.get_offset(2)).toEqual(hand1.get_seat('BB'));

        expect(hand2.get_seat(0)).toEqual(false);
        expect(hand2.get_seat(-1)).toEqual(false);

        expect(hand2.get_seat(1)).toEqual(hand2.get_seat('BTN'));
        expect(hand2.get_seat(2)).toEqual(hand2.get_seat('SB'));
        expect(hand2.get_seat(3)).toEqual(hand2.get_seat('BB'));
        expect(hand2.get_seat(4)).toEqual(hand2.get_seat('UTG'));
        expect(hand2.get_seat(5)).toEqual(hand2.get_seat('UTG+1'));
        expect(hand2.get_seat(6)).toEqual(hand2.get_seat('HJ'));
        expect(hand2.get_seat(7)).toEqual(hand2.get_seat('CO'));

        expect(hand2.get_seat('BTN')).toEqual(hand2.get_seat('OTB'));
        expect(hand2.get_seat('BTN')).toEqual(hand2.get_seat('BU'));
        expect(hand2.get_seat('BTN')).toEqual(hand2.get_seat('D'));
        expect(hand2.get_seat('SB')).toEqual(hand2.get_seat('S'));
        expect(hand2.get_seat('BB')).toEqual(hand2.get_seat('B'));
        expect(hand2.get_seat('UTG')).toEqual(hand2.get_seat('UG'));
        expect(hand2.get_seat('UTG')).toEqual(hand2.get_seat('U'));
        expect(hand2.get_seat('UTG+1')).toEqual(hand2.get_seat('UG+1'));
        expect(hand2.get_seat('UTG+1')).toEqual(hand2.get_seat('U+1'));
        expect(hand2.get_seat('CO')).toEqual(hand2.get_seat('C'));
        expect(hand2.get_seat('CO')).toEqual(hand2.get_seat('UTG+3'));
        expect(hand2.get_seat('HJ')).toEqual(hand2.get_seat('H'));
        expect(hand2.get_seat('HJ')).toEqual(hand2.get_seat('UTG+2'));
        expect(hand2.get_seat('LJ')).toEqual(hand2.get_seat('L'));
        expect(hand2.get_seat('LJ')).toEqual(hand2.get_seat('UTG+1'));

        expect(hand2.get_offset(-2)).toEqual(hand2.get_seat('HJ'));
        expect(hand2.get_offset(-1)).toEqual(hand2.get_seat('CO'));
        expect(hand2.get_offset(0)).toEqual(hand2.get_seat('BTN'));
        expect(hand2.get_offset(1)).toEqual(hand2.get_seat('SB'));
        expect(hand2.get_offset(2)).toEqual(hand2.get_seat('BB'));
    });

    it('should understand heads-up seat identities', () => {
        expect(heads_up.get_seat(0)).toEqual(false);
        expect(heads_up.get_seat(-1)).toEqual(false);
        expect(heads_up.get_seat(1)).toEqual(heads_up.get_seat('BTN'));
        expect(heads_up.get_seat(2)).toEqual(heads_up.get_seat('BB'));
        expect(heads_up.get_seat('BTN')).toEqual(heads_up.get_seat('SB'));
        expect(heads_up.get_offset(-1)).toEqual(heads_up.get_seat('BB'));
        expect(heads_up.get_offset(0)).toEqual(heads_up.get_seat('BTN'));
        expect(heads_up.get_offset(1)).toEqual(heads_up.get_seat('BB'));
    });
});

describe('actions', () => {
    it('should parse player actions', () => {
        expect(hand1.actions.preflop).toContainEqual({ player: hand1.get_seat('UTG'), action: PSN.action.RAISE, amount: 600 });
        expect(hand1.actions.flop).toContainEqual({ player: hand1.get_seat('BB'), action: PSN.action.FOLD });

        expect(hand2.actions.preflop).toContainEqual({ player: hand2.get_seat('UTG'), action: PSN.action.RAISE, amount: 600 });
        expect(hand2.actions.flop).toContainEqual({ player: hand2.get_seat('BB'), action: PSN.action.FOLD });

        expect(heads_up.actions.preflop).toContainEqual({ player: heads_up.get_seat('BTN'), action: PSN.action.RAISE, amount: 600 });
        expect(heads_up.actions.preflop).toContainEqual({ player: heads_up.get_seat('BTN'), action: PSN.action.CALL });
    });

    it('should assume players not present in preflop have folded', () => {
        expect(hand1.actions.preflop).toContainEqual({ player: hand1.get_seat('UTG+1'), action: PSN.action.FOLD });
        expect(hand1.actions.preflop).toContainEqual({ player: hand1.get_seat('HJ'), action: PSN.action.FOLD });
        expect(hand1.actions.preflop).toContainEqual({ player: hand1.get_seat('CO'), action: PSN.action.FOLD });
        expect(hand1.actions.preflop).toContainEqual({ player: hand1.get_seat('BTN'), action: PSN.action.FOLD });
    });

    it('should parse equal amount of actions for identical hands', () => {
        expect(hand1.actions.preflop.length).toEqual(hand2.actions.preflop.length);
        expect(hand1.actions.flop.length).toEqual(hand2.actions.flop.length);
        expect(hand1.actions.turn.length).toEqual(hand2.actions.turn.length);
        expect(hand1.actions.river.length).toEqual(hand2.actions.river.length);
    });

    it('should order assumed actions correctly', () => {
        for (let i = 0; i < hand1.actions.preflop.length; i++) {
            let hand1_action = hand1.actions.preflop[i];
            let hand2_action = hand2.actions.preflop[i];
            expect(hand1_action.player.seat.id).toEqual(hand2_action.player.seat.id);
            expect(hand1_action.action).toEqual(hand2_action.action);
        }
    });
});