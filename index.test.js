'use strict';

import { PSN } from './index.js';

const hand1_psn =
`NLH 200 BTN 3/7/10
4=6B 5=10B 6=12B
#P 6:R3B 4:RA 5:C 6:C
#F[7h2h5s] 5:C 6:RA 5:X
#T[5d]
#R[4d]
#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
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
UTG:R3B UTG+1:X HJ:X CO:X BTN:X SB:RA BB:C UTG:C

#Flop[7♥ 2♥ 5♠]
BB:C UTG:RA BB:X UTG[Q♦ A♥] SB[J♦ A♣]

#Turn[5♦]

#River[4♦]

#Showdown
UTG WIN 3600 UTG[Q♦ A♥]PA+AQ`;
const hand2 = new PSN(hand2_psn);

const heads_up_psn =
`NLH 200 BTN 1/2
1=12B 2=6B
#P 1:R3B 2:RA 1:C
#F[7h2h5s]
#T[5d]
#R[4d]
#S 2 WIN P 2[QdAh]PA+AQ 1[JdAc]PA+AJ`;
const heads_up = new PSN(heads_up_psn);

hand1.print_hand();

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
        expect(hand1.get_seat(1).stack).toBeNull();
        expect(hand1.get_seat(2).stack).toBeNull();
        expect(hand1.get_seat(3).stack).toBeNull();
        expect(hand1.get_seat(4).stack).toEqual(1200);
        expect(hand1.get_seat(5).stack).toEqual(2000);
        expect(hand1.get_seat(6).stack).toEqual(2400);
        expect(hand1.get_seat(7).stack).toBeNull();

        expect(hand2.get_seat('BTN').stack).toEqual(3210);
        expect(hand2.get_seat('SB').stack).toEqual(1200);
        expect(hand2.get_seat('BB').stack).toEqual(2000);
        expect(hand2.get_seat('UTG').stack).toEqual(2400);
        expect(hand2.get_seat('UTG+1').stack).toEqual(1799);
        expect(hand2.get_seat('HJ').stack).toEqual(1825);
        expect(hand2.get_seat('CO').stack).toEqual(4045);
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
        expect(heads_up.actions.preflop).toContainEqual({ player: heads_up.get_seat('BTN'), action: PSN.action.CALL, amount: 400 });
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

describe('post-game chips', () => {
    it('should award and deduct chips depending on the outcome of the hand', () => {
        expect(hand1.get_seat('UTG').chips).toEqual(4800);
        expect(hand1.get_seat('BB').chips).toEqual(800);
        expect(hand1.get_seat('SB').chips).toEqual(0);
        expect(hand2.get_seat('UTG').chips).toEqual(4800);
        expect(hand2.get_seat('BB').chips).toEqual(800);
        expect(hand2.get_seat('SB').chips).toEqual(0);
        expect(heads_up.get_seat('BTN').chips).toEqual(1200);
        expect(heads_up.get_seat('BB').chips).toEqual(2400);
    });
});

describe('cards', () => {
    const flop = [
        {
            id: '7h',
            rank: '7',
            suit: 'h',
            verbose: {
                name: '7 of Hearts',
                rank: '7',
                suit: 'Hearts'
            }
        },
        {
            id: '2h',
            rank: '2',
            suit: 'h',
            verbose: {
                name: '2 of Hearts',
                rank: '2',
                suit: 'Hearts'
            }
        },
        {
            id: '5s',
            rank: '5',
            suit: 's',
            verbose: {
                name: '5 of Spades',
                rank: '5',
                suit: 'Spades'
            }
        }
    ];
    const turn = [{
        id: '5d',
        rank: '5',
        suit: 'd',
        verbose: {
            name: '5 of Diamonds',
            rank: '5',
            suit: 'Diamonds'
        }
    }];
    const river = [{
        id: '4d',
        rank: '4',
        suit: 'd',
        verbose: {
            name: '4 of Diamonds',
            rank: '4',
            suit: 'Diamonds'
        }
    }];
    const board = flop.concat(turn).concat(river);
    const UTG_hole = [
        {
            id: 'Qd',
            rank: 'Q',
            suit: 'd',
            verbose: {
                name: 'Queen of Diamonds',
                rank: 'Queen',
                suit: 'Diamonds'
            }
        },
        {
            id: 'Ah',
            rank: 'A',
            suit: 'h',
            verbose: {
                name: 'Ace of Hearts',
                rank: 'Ace',
                suit: 'Hearts'
            }
        }
    ];
    const SB_hole = [
        {
            id: 'Jd',
            rank: 'J',
            suit: 'd',
            verbose: {
                name: 'Jack of Diamonds',
                rank: 'Jack',
                suit: 'Diamonds'
            }
        },
        {
            id: 'Ac',
            rank: 'A',
            suit: 'c',
            verbose: {
                name: 'Ace of Clubs',
                rank: 'Ace',
                suit: 'Clubs'
            }
        }
    ];

    it('should parse board cards', () => {
        expect(hand1.cards.board).toEqual(board);
        expect(hand1.cards.flop).toEqual(flop);
        expect(hand1.cards.turn).toEqual(turn);
        expect(hand1.cards.river).toEqual(river);
        expect(hand2.cards.board).toEqual(board);
        expect(hand2.cards.flop).toEqual(flop);
        expect(hand2.cards.turn).toEqual(turn);
        expect(hand2.cards.river).toEqual(river);
        expect(heads_up.cards.board).toEqual(board);
        expect(heads_up.cards.flop).toEqual(flop);
        expect(heads_up.cards.turn).toEqual(turn);
        expect(heads_up.cards.river).toEqual(river);
    });

    it('should parse player hole cards', () => {
        expect(hand1.get_seat('UTG').cards).toEqual(UTG_hole);
        expect(hand1.get_seat('SB').cards).toEqual(SB_hole);
        expect(hand2.get_seat('UTG').cards).toEqual(UTG_hole);
        expect(hand2.get_seat('SB').cards).toEqual(SB_hole);
        expect(heads_up.get_seat('BB').cards).toEqual(UTG_hole);
        expect(heads_up.get_seat('BTN').cards).toEqual(SB_hole);
    });
});

describe('validation', () => {
    it('should reject outright invalid hands', () => {
        const invalid_start = `200 BTN 3/7/10\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_start)
        }).toThrow('Invalid syntax');
        const no_preflop = `NLH 200 BTN 3/7/10\n` +
        `4=6B 5=10B 6=12B\n` +
        `6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(no_preflop)
        }).toThrow('Invalid syntax');
    });

    it('should expect big blind at minimum for bet info', () => {
        const invalid_bet = `NLH BTN 3/7/10\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_bet)
        }).toThrow('big blind');
    });

    it('should reject more than 3 bet info pieces', () => {
        const invalid_bet = `NLH 10|20|40|80 BTN 3/7/10\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_bet)
        }).toThrow('no more than 3');
    });

    it('should expect number of seats at minimum for seat info', () => {
        const invalid_seats = `NLH 200\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_seats)
        }).toThrow('seat info not present');
    });

    it('should reject more than 2 seat info pieces when not using BTN notation', () => {
        const invalid_seats = `NLH 200 7/10/100\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_seats)
        }).toThrow('no more than 2');
    });

    it('should expect BTN notation to contain sufficient seat info', () => {
        const invalid_btn = `NLH 200 BTN 3\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_btn)
        }).toThrow('seat info not present');
    });

    it('should reject more than 3 seat info pieces when using BTN notation', () => {
        const invalid_btn = `NLH 200 BTN 3/7/10/100\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_btn)
        }).toThrow('no more than 3');
    });

    it('should reject invalid dates', () => {
        const invalid_date = `NLH 200 BTN 3/7/10\n` +
        `DATE notadate\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_date)
        }).toThrow('Invalid DATE');
    });

    it('should reject invalid currencies', () => {
        const invalid_cash = `NLH 200 BTN 3/7/10\n` +
        `CASH quids\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_cash)
        }).toThrow('Invalid CASH');
    });

    it('should reject invalid tournament levels', () => {
        const invalid_level = `NLH 200 BTN 3/7/10\n` +
        `LVL first\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_level)
        }).toThrow('Invalid LVL');
    });

    it('should reject invalid buy-in values', () => {
        const invalid_buy = `NLH 200 BTN 3/7/10\n` +
        `BUY 50QUID\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_buy)
        }).toThrow('Invalid BUY, currency');
        const no_decimal = `NLH 200 BTN 3/7/10\n` +
        `CASH GBP BUY 50\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(no_decimal)
        }).toThrow('Invalid BUY, amount');
        const tournament_no_currency = `NLH 200 BTN 3/7/10\n` +
        `LVL 1 BUY 5.00\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(tournament_no_currency)
        }).toThrow('Invalid BUY, currency');
        const cash_no_currency = `NLH 200 BTN 3/7/10\n` +
        `BUY 5.00\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(cash_no_currency)
        }).toThrow('Invalid BUY, currency');
        const invalid_currency = `NLH 200 BTN 3/7/10\n` +
        `BUY 5.00LOL\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_currency)
        }).toThrow('Invalid BUY, currency');
    });

    it('should reject invalid seat identifiers', () => {
        const invalid_pos_seats_num = `NLH 200 7/10\n` +
        `4=6B 5=10B 6=12B\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_pos_seats_num)
        }).toThrow('must be a valid position');
        const invalid_btn_seats_pos = `NLH 200 BTN 3/7/10\n` +
        `SB=6B BB=10B UTG=12B\n` +
        `#P UTG:R3B SB:RA BB:C UTG:C\n` +
        `#F[7h2h5s] BB:C UTG:RA BB:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S UTG WIN P UTG[QdAh]PA+AQ SB[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_btn_seats_pos)
        }).toThrow('must be a number');
        const invalid_position = `NLH 200 7/10\n` +
        `SB=6B BB=10B MP=12B\n` +
        `#P MP:R3B SB:RA BB:C MP:C\n` +
        `#F[7h2h5s] BB:C MP:RA BB:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S MP WIN P MP[QdAh]PA+AQ SB[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_position)
        }).toThrow('must be a valid position');
        const seat_out_of_range = `NLH 200 BTN 3/7/10\n` +
        `8=6B 5=10B 6=12B\n` +
        `#P 6:R3B 8:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 8[JdAc]PA+AJ`;
        expect(() => {
            new PSN(seat_out_of_range)
        }).toThrow('must be a number');
    });

    it('should reject assigning invalid information to seats', () => {
        const invalid_chips = `NLH 200 BTN 3/7/10\n` +
        `4=9A9 5=Fiddlesticks 6=UWOTM8\n` +
        `#P 6:R3B 4:RA 5:C 6:C\n` +
        `#F[7h2h5s] 5:C 6:RA 5:X\n` +
        `#T[5d]\n` +
        `#R[4d]\n` +
        `#S 6 WIN P 6[QdAh]PA+AQ 4[JdAc]PA+AJ`;
        expect(() => {
            new PSN(invalid_chips)
        }).toThrow('must be a valid chip value or a name surrounded by double quotes');
    });
});