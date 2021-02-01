'use strict';

class PSN {
    sections = null;
    game_start = false;

    big_blind = 0;
    small_blind = 0;
    ante = 0;
    btn_notation = false;
    dealer = false;
    seats = 0;
    max_seats = 0;

    players = [];
    actions = {
        preflop: [],
        flop: [],
        turn: [],
        river: []
    };

    static action = {
        FOLD: 0,
        CHECK: 1,
        CALL: 2,
        RAISE: 3
    };

    static seat_identifiers = {
        normal: [
            { offset: 0, ids: ['BTN', 'OTB', 'BU', 'D'] },
            { offset: 1, ids: ['SB', 'S'] },
            { offset: 2, ids: ['BB', 'B'] },
            { offset: 3, ids: ['UTG', 'UG', 'U'] },
            { offset: 4, ids: ['UTG+1', 'UG+1', 'U+1'] },
            { offset: 5, ids: ['UTG+2', 'UG+2', 'U+2'] },
            { offset: 6, ids: ['UTG+3', 'UG+3', 'U+3'] },
            { offset: 7, ids: ['UTG+4', 'UG+4', 'U+4'] },
            { offset: 8, ids: ['UTG+5', 'UG+5', 'U+5'] },
            { offset: 9, ids: ['UTG+6', 'UG+6', 'U+6'] },
            { offset: 10, ids: ['UTG+7', 'UG+7', 'U+7'] },
            { offset: 11, ids: ['UTG+8', 'UG+8', 'U+8'] },
            { offset: -1, ids: ['CO', 'C'] },
            { offset: -2, ids: ['HJ', 'H'] },
            { offset: -3, ids: ['LJ', 'L'] }
        ],
        heads_up: [
            { offset: 0, ids: ['BTN', 'OTB', 'BU', 'D', 'SB', 'S'] },
            { offset: 1, ids: ['BB', 'B'] }
        ]
    };

    constructor(notation) {
        notation = PSN.normalise_notation(notation);
        this.extract(notation);
    }

    static normalise_notation(notation) {
        let normalised = PSN.clean_whitespace(notation);
        if (
            normalised.slice(0, 4) !== 'NLH ' ||
            normalised.indexOf('#P') === -1
        ) {
            throw 'Error: Invalid syntax!';
        }
        return normalised;
    }

    static clean_whitespace(notation) {
        let clean = notation;
        clean = clean.replace(/\s/g, ' ');
        clean = clean.replace(/\s\s+/g, ' ');
        clean = clean.trimRight();
        return clean;
    }

    split_notation(notation) {
        let in_quotes = false;
        let in_brackets = false;
        let escaped = false;
        let sections = [];
        let index = 0;
        let write = true;
        for (let c of notation) {
            write = true;
            if (!in_quotes) {
                if (!escaped && c === '"') {
                    in_quotes = true;
                }
                if (!in_brackets) {
                    if (c === '[') {
                        in_brackets = true;
                    }
                } else {
                    if (c === ']') {
                        in_brackets = false;
                    }
                }
                if (c === ' ' && !in_brackets) {
                    index++;
                    write = false;
                }
            } else {
                if (!escaped && c === '"') {
                    in_quotes = false;
                }
            }
            if (write) {
                if (index >= sections.length) {
                    sections[index] = '';
                }
                sections[index] += c;
            }
            escaped = false;
            if (c === '\\') {
                escaped = true;
            }
        }

        return sections;
    }

    split_sections(sections) {
        this.btn_notation = (sections[2] === 'BTN');
        const game_req = (i, btn) => {
            if (btn) {
                return i > 3;
            }
            return i > 2;
        };
        let tags = {
            NLH: (i, btn) => {
                return i === 0;
            },
            BTN: (i, btn) => {
                return i === 2; 
            },
            DATE: game_req,
            CASH: game_req,
            LVL: game_req,
            BUY: game_req,
            INFO: game_req
        };
        let splitted = {
            tags: {},
            raw: [],
            seats: [],
            actions: {
                preflop: [],
                flop: [],
                turn: [],
                river: []
            },
            winner: null
        };
        let street = null;
        for (let i = 0; i < sections.length; i++) {
            let section = sections[i];
            if (section in tags) {
                if (!tags[section](i, this.btn_notation)) {
                    throw 'Error: invalid syntax for ' + section + '! Index is ' + i;
                }
                splitted.tags[section] = this.unquote(sections[i + 1]);
                i++;
            } else {
                let parsed = null;
                let delimited = false;
                let quote_pos = section.indexOf('"');
                if (quote_pos === -1) {
                    quote_pos = section.length + 1;
                }
                if (
                    section.indexOf('=') !== -1 &&
                    section.indexOf('=') < quote_pos
                ) {
                    parsed = section.split('=', 2);
                    splitted.seats.push(parsed);
                    delimited = true;
                }
                if (
                    street !== null &&
                    section.indexOf(':') !== -1 &&
                    section.indexOf(':') < quote_pos
                ) {
                    parsed = section.split(':', 2);
                    splitted.actions[street].push(parsed);
                    delimited = true;
                }
                if (!delimited) {
                    let winner = false;
                    if ((i + 1) < sections.length) {
                        let next_section = sections[i + 1];
                        if (next_section === 'WIN') {
                            if (
                                !game_req(i + 1, this.btn_notation) ||
                                (i + 2) >= sections.length
                            ) {
                                throw 'Error: invalid syntax for WIN! Index is ' + (i + 1);
                            }
                            winner = true;
                            splitted.winner = [
                                section,
                                sections[i + 2]
                            ];
                        }
                    }
                    if (!winner) {
                        if (section.indexOf('#') === 0) {
                            if (section.toLowerCase() === '#preflop') {
                                street = 'preflop';
                            }
                            if (section.toLowerCase().indexOf('#flop[') === 0) {
                                street = 'flop';
                            }
                            if (section.toLowerCase().indexOf('#turn[') === 0) {
                                street = 'turn';
                            }
                            if (section.toLowerCase().indexOf('#river[') === 0) {
                                street = 'river';
                            }
                            if (section.toLowerCase().indexOf('#end[') === 0) {
                                street = null;
                            }
                            if (section.toLowerCase().indexOf('#showdown[') === 0) {
                                street = null;
                            }
                            if (section.toLowerCase() === '#p') {
                                street = 'preflop';
                            }
                            if (section.toLowerCase().indexOf('#f[') === 0) {
                                street = 'flop';
                            }
                            if (section.toLowerCase().indexOf('#t[') === 0) {
                                street = 'turn';
                            }
                            if (section.toLowerCase().indexOf('#r[') === 0) {
                                street = 'river';
                            }
                            if (section.toLowerCase().indexOf('#e[') === 0) {
                                street = null;
                            }
                            if (section.toLowerCase().indexOf('#s[') === 0) {
                                street = null;
                            }
                        }
                        splitted.raw.push(this.unquote(section));
                    }
                }
            }
        }

        return splitted;
    }

    unquote(string) {
        if (
            string.indexOf('"') === 0 &&
            string.lastIndexOf('"') === string.length - 1
        ) {
            string = string.replace(/\\"/g, '"');
            string = string.slice(1, -1);
        }
        return string;
    }

    generate_player(seat_number) {
        let identifiers = PSN.seat_identifiers.normal;
        if (this.seats === 2) {
            identifiers = PSN.seat_identifiers.heads_up;
        }
        let offset = seat_number - 1;
        if (this.btn_notation) {
            offset -= (this.dealer - 1);
        }
        if (offset < 0) {
            offset += this.seats;
        }
        let id = identifiers.find(
            identifier =>  identifier.offset === offset
        ).ids;
        if (this.seats > 2) {
            let negative_offset = offset - this.seats;
            if (negative_offset > -4 && negative_offset < 0) {
                let negative_id = identifiers.find(
                    identifier =>  identifier.offset === negative_offset
                ).ids;
                id = negative_id.concat(id);
            }
        }
        let new_player = {
            seat: {
                offset: offset,
                number: seat_number,
                id: id
            },
            name: null,
            stack: null,
            chips: null,
            hero: false
        };
        this.players.push(new_player);
        return new_player;
    }

    read_chips(chips) {
        if (!/\d/.test(chips)) {
            return false;
        }
        let amount = 0;
        let blind_pos = chips.indexOf('B');
        if (blind_pos === -1) {
            if (!/^\d+$/.test(chips)) {
                return false;
            }
            amount = parseInt(chips);
        } else if (blind_pos === 0) {
            return false;
        } else {
            if (blind_pos === chips.length - 1) {
                chips = chips.slice(0, -1);
                if (!/^\d+$/.test(chips)) {
                    return false;
                }
                amount = parseInt(chips) * this.big_blind;
            } else {
                chips = chips.split('B');
                if (!/^\d+$/.test(chips[0])) {
                    return false;
                }
                if (!/^\d+$/.test(chips[1])) {
                    return false;
                }
                amount = parseInt(chips[0]) * this.big_blind;
                amount += parseInt(chips[1]);
            }
        }

        return amount;
    }

    get_seat(seat) {
        let player = false;
        if (/^\d+$/.test(seat)) {
            seat = parseInt(seat);
        }
        if (typeof seat === 'number') {
            player = this.players.find(player => player.seat.number === seat);
        } else {
            player = this.players.find(player => player.seat.id.includes(seat));
        }
        if (player === undefined) {
            return false;
        }
        return player;
    }

    get_offset(offset) {
        if (typeof offset !== 'number') {
            throw 'Error: Offset must be an integer!';
        }
        offset = ((offset + 1) % this.seats) - 1;
        if (offset < 0) {
            offset = this.seats + offset;
        }
        let player = this.players.find(player => player.seat.offset === offset);
        if (player === undefined) {
            return false;
        }
        return player;
    }

    extract(notation) {
        let sections = this.split_notation(notation);
        this.sections = this.split_sections(sections);
        this.extract_bets();
        this.extract_seats();
        this.extract_tags();
        this.extract_players();
        this.extract_actions();
    }

    extract_bets() {
        let bets = this.sections.tags.NLH.split('|');
        if (bets.length === 3) {
            this.ante = parseInt(bets[0]);
            this.small_blind = parseInt(bets[1]);
            this.big_blind = parseInt(bets[2]);
        }
        if (bets.length === 2) {
            this.ante = 0;
            this.small_blind = parseInt(bets[0]);
            this.big_blind = parseInt(bets[1]);
        }
        if (bets.length === 1) {
            this.ante = 0;
            this.big_blind = parseInt(bets[0]);
            this.small_blind = parseInt(Math.ceil(this.big_blind / 2));
        }
    }

    extract_seats() {
        let seats = this.sections.raw[0];
        if (this.btn_notation) {
            seats = this.sections.tags.BTN;
        }
        seats = seats.split('/');
        if (this.btn_notation) {
            this.dealer = parseInt(seats[0]);
            this.seats = parseInt(seats[1]);
            if (seats.length === 3) {
                this.max_seats = parseInt(seats[2]);
            } else {
                this.max_seats = this.seats;
            }
        } else {
            this.dealer = false;
            this.seats = parseInt(seats[0]);
            if (seats.length === 2) {
                this.max_seats = parseInt(seats[1]);
            } else {
                this.max_seats = this.seats;
            }
        }
    }

    extract_tags() {
        let tags = Object.keys(this.sections.tags);
        for (let tag of tags) {
            let value = this.sections.tags[tag];
            switch(tag) {
                case 'DATE':
                    let date = new Date(value);
                    if (isNaN(date)) {
                        throw 'Error: Invaild DATE format (' + value + ')!';
                    }
                    this.date = date;
                    break;
                case 'CASH':
                    let currency = value;
                    if (currency.length !== 3) {
                        throw 'Error: Invalid CASH currency!';
                    }
                    this.tournament = false;
                    this.cash_game = true;
                    this.currency = currency;
                    break;
                case 'LVL':
                    let level = parseInt(value);
                    if (isNaN(level)) {
                        throw 'Error: Invalid LEVEL!';
                    }
                    this.tournament = true;
                    this.cash_game = false;
                    this.level = level;
                    break;
                case 'BUY':
                    let buy_in = value;
                    if (
                        buy_in.length > 3 &&
                        /[^a-z]/i.test(buy_in)
                    ) {
                        this.currency = buy_in.slice(-3);
                        buy_in = buy_in.slice(0, -3);
                    }
                    if (buy_in.indexOf('.') === -1) {
                        throw 'Error: Invalid BUY!';
                    }
                    buy_in = buy_in.split('.');
                    buy_in = [
                        parseInt(buy_in[0]),
                        parseInt(buy_in[1])
                    ];
                    if (
                        isNaN(buy_in[0]) ||
                        isNaN(buy_in[1])
                    ) {
                        throw 'Error: Invalid BUY!';
                    }
                    this.buy_in = buy_in;
                    break;
                case 'INFO':
                    this.info = value;
                    break;
            }
        }
    }

    extract_players() {
        for (let i = 1; i <= this.seats; i++) {
            this.generate_player(i);
        }
        for (let seat_value of this.sections.seats) {
            let seat = seat_value[0];
            let value = seat_value[1];
            let seat_valid = false;
            if (this.btn_notation) {
                seat = parseInt(seat);
                if (!isNaN(seat)) {
                    seat_valid = true;
                }
            } else {
                seat_valid = true;
            }
            if (!seat_valid) {
                throw 'Error: Invlaid seat identifier `' + seat + '`';
            }
            let player = this.get_seat(seat);
            let quoted = this.unquote(value);
            if (value !== quoted) {
                player.name = quoted;
            } else {
                if (value === 'HERO') {
                    player.hero = true;
                } else {
                    player.stack = this.read_chips(value);
                    player.chips = player.stack;
                }
            }
        }
    }

    extract_actions() {
        const get_action = (player, notation) => {
            let action_notation = notation.slice(0, 1);
            let action = null;
            switch (action_notation) {
                case 'C':
                    action = 'C';
                    break;
                case 'K':
                    action = PSN.action.CHECK;
                    break;
                case 'L':
                    action = PSN.action.CALL;
                    break;
                case 'R':
                    action = PSN.action.RAISE;
                    break;
                case 'X':
                    action = PSN.action.FOLD;
                    break;
            }
            let seat_action = {
                player: player,
                action: action
            };
            if (notation.length > 1) {
                let amount = notation.slice(1);
                if (amount.indexOf('A') === 0) {
                    amount = -1; // temporary
                } else {
                    amount = this.read_chips(amount);
                    if (amount !== false) {
                        seat_action.amount = amount;
                    }
                }
            }
            return seat_action;
        }
        let seats_represented = [];
        let players_in_play = [...this.players];
        let players_to_call = [];
        for (let seat of this.sections.actions.preflop) {
            let player = this.get_seat(seat[0]);
            let action = get_action(player, seat[1]);
            this.actions.preflop.push(action);
            if (action.action === PSN.action.FOLD) {
                players_in_play = players_in_play.filter(p => p !== player);
            }
            seats_represented.push(player);
        }
        let first_seat_index = this.players.findIndex(p => p === this.get_seat('UTG'));
        if (this.seats === 2) {
            first_seat_index = this.players.findIndex(p => p === this.get_seat('SB'));
        }
        for (let i = 0; i < this.seats; i++) {
            let seat_index = (i + first_seat_index) % this.seats;
            let player = this.players[seat_index];
            if (!seats_represented.includes(player)) {
                let first_actions = [];
                let later_actions = this.actions.preflop;
                if (i > 0) {
                    first_actions = this.actions.preflop.slice(0, i);
                    later_actions = this.actions.preflop.slice(i);
                }
                first_actions.push({
                    player: player,
                    action: PSN.action.FOLD
                });
                this.actions.preflop = first_actions.concat(later_actions);
                players_in_play = players_in_play.filter(p => p !== player);
            }
        }
        for (let action of this.actions.preflop) {
            let player = action.player;
            if (action.action === PSN.action.RAISE) {
                players_to_call = players_in_play.filter(p => p !== player);
            }
            if (action.action === 'C') {
                if (players_to_call.includes(player)) {
                    action.action = PSN.action.CALL;
                    players_to_call = players_to_call.filter(p => p !== player);
                } else {
                    action.action = PSN.action.CHECK;
                }
            }
        }
        for (let seat of this.sections.actions.flop) {
            let player = this.get_seat(seat[0]);
            let action = get_action(player, seat[1]);
            this.actions.flop.push(action);
            if (action.action === PSN.action.RAISE) {
                players_to_call = players_in_play.filter(p => p !== player);
            }
            if (action.action === PSN.action.FOLD) {
                players_in_play = players_in_play.filter(p => p !== player);
            }
            if (action.action === 'C') {
                if (players_to_call.includes(action.player)) {
                    action.action = PSN.action.CALL;
                    players_to_call = players_to_call.filter(p => p !== player);
                } else {
                    action.action = PSN.action.CHECK;
                }
            }
        }
        for (let seat of this.sections.actions.turn) {
            let player = this.get_seat(seat[0]);
            let action = get_action(player, seat[1], players_to_call.includes(player));
            this.actions.turn.push(action);
            if (action.action === PSN.action.RAISE) {
                players_to_call = players_in_play.filter(p => p !== player);
            }
            if (action.action === PSN.action.FOLD) {
                players_in_play = players_in_play.filter(p => p !== player);
            }
            if (action.action === 'C') {
                if (players_to_call.includes(action.player)) {
                    action.action = PSN.action.CALL;
                    players_to_call = players_to_call.filter(p => p !== player);
                } else {
                    action.action = PSN.action.CHECK;
                }
            }
        }
        for (let seat of this.sections.actions.river) {
            let player = this.get_seat(seat[0]);
            let action = get_action(player, seat[1], players_to_call.includes(player));
            this.actions.river.push(action);
            if (action.action === PSN.action.RAISE) {
                players_to_call = players_in_play.filter(p => p !== player);
            }
            if (action.action === PSN.action.FOLD) {
                players_in_play = players_in_play.filter(p => p !== player);
            }
            if (action.action === 'C') {
                if (players_to_call.includes(action.player)) {
                    action.action = PSN.action.CALL;
                    players_to_call = players_to_call.filter(p => p !== player);
                } else {
                    action.action = PSN.action.CHECK;
                }
            }
        }
    }
}
exports.PSN = PSN;