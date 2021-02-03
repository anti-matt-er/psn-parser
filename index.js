'use strict';

const isCurrencyCode = require('currency-code-validator');

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
    date = false;
    cash_game = false;
    tournament = false;
    currency = false;
    level = false;
    buy_in = false;
    info = false;

    players = [];
    actions = {
        preflop: [],
        flop: [],
        turn: [],
        river: []
    };
    cards = {
        board: [],
        flop: [],
        turn: [],
        river: []
    }

    pot = 0;

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

    static card_values = {
        rank: [
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' },
            { id: '6' },
            { id: '7' },
            { id: '8' },
            { id: '9' },
            { id: 'T', verbose: '10' },
            { id: 'J', verbose: 'Jack' },
            { id: 'Q', verbose: 'Queen' },
            { id: 'K', verbose: 'King' },
            { id: 'A', verbose: 'Ace' }
        ],
        suit: [
            { id: 'c', symbol: '♣', verbose: 'Clubs' },
            { id: 'd', symbol: '♦', verbose: 'Diamonds' },
            { id: 'h', symbol: '♥', verbose: 'Hearts' },
            { id: 's', symbol: '♠', verbose: 'Spades' },
        ]
    }

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
            seat_info: false,
            cards: {
                flop: false,
                turn: false,
                river: false,
                players: []
            },
            seats: [],
            actions: {
                preflop: [],
                flop: [],
                turn: [],
                river: []
            },
            winners: []
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
                            splitted.winners.push([
                                section,
                                sections[i + 2]
                            ]);
                            i += 2;
                        }
                    }
                    if (!winner) {
                        if (section.indexOf('#') === 0) {
                            if (section.toLowerCase() === '#preflop') {
                                street = 'preflop';
                            }
                            if (section.toLowerCase().indexOf('#flop[') === 0) {
                                street = 'flop';
                                splitted.cards.flop = section;
                            }
                            if (section.toLowerCase().indexOf('#turn[') === 0) {
                                street = 'turn';
                                splitted.cards.turn = section;
                            }
                            if (section.toLowerCase().indexOf('#river[') === 0) {
                                street = 'river';
                                splitted.cards.river = section;
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
                                splitted.cards.flop = section;
                            }
                            if (section.toLowerCase().indexOf('#t[') === 0) {
                                street = 'turn';
                                splitted.cards.turn = section;
                            }
                            if (section.toLowerCase().indexOf('#r[') === 0) {
                                street = 'river';
                                splitted.cards.river = section;
                            }
                            if (section.toLowerCase().indexOf('#e[') === 0) {
                                street = null;
                            }
                            if (section.toLowerCase().indexOf('#s[') === 0) {
                                street = null;
                            }
                        } else {
                            if (
                                section.indexOf('[') !== -1 &&
                                section.indexOf(']') !== -1
                            ) {
                                splitted.cards.players.push(section);
                            } else if (splitted.seat_info === false) {
                                splitted.seat_info = section;
                            }
                        }
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
            identifier => identifier.offset === offset
        ).ids;
        if (this.seats > 2) {
            let negative_offset = offset - this.seats;
            if (negative_offset > -4 && negative_offset < 0) {
                let negative_id = identifiers.find(
                    identifier => identifier.offset === negative_offset
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
        this.extract_cards();
        this.award_winners();
    }

    extract_bets() {
        let bets = this.sections.tags.NLH.split('|');
        for (let bet of bets) {
            if (!/^\d+$/.test(bet)) {
                throw 'Error: bet info should contain at minimum the big blind!';
            }
        }
        if (bets.length > 3) {
            throw 'Error: bet info should contain no more than 3 pieces!';
        }
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
        let seats = this.sections.seat_info;
        if (this.btn_notation) {
            seats = this.sections.tags.BTN;
        } else if (seats === false) {
            throw 'Error: seat info not present!';
        }
        seats = seats.split('/');
        for (let seat of seats) {
            if (!/^\d+$/.test(seat)) {
                throw 'Error: seat info not present!';
            }
        }
        if (this.btn_notation) {
            if (seats.length < 2) {
                throw 'Error: seat info not present!';
            }
            if (seats.length > 3) {
                throw 'Error: seat info should contain no more than 3 pieces when using BTN notation!';
            }
            this.dealer = parseInt(seats[0]);
            this.seats = parseInt(seats[1]);
            if (seats.length === 3) {
                this.max_seats = parseInt(seats[2]);
            } else {
                this.max_seats = this.seats;
            }
        } else {
            if (seats.length < 1) {
                throw 'Error: seat info not present!';
            }
            if (seats.length > 2) {
                throw 'Error: seat info should contain no more than 2 pieces when not using BTN notation!';
            }
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
            switch (tag) {
                case 'DATE':
                    let date = new Date(value);
                    if (isNaN(date)) {
                        throw 'Error: Invalid DATE format (' + value + '), must be a valid ISO 8601 timestamp!';
                    }
                    this.date = date;
                    break;
                case 'CASH':
                    let currency = value;
                    if (!isCurrencyCode(currency, true)) {
                        throw 'Error: Invalid CASH, must be a valid ISO 4217 currency code!';
                    }
                    this.tournament = false;
                    this.cash_game = true;
                    this.currency = currency;
                    break;
                case 'LVL':
                    if (!/^\d+$/.test(value)) {
                        throw 'Error: Invalid LVL!';
                    }
                    let level = parseInt(value);
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
                        if (!isCurrencyCode(this.currency, true)) {
                            throw 'Error: Invalid BUY, currency must be a valid ISO 4217 currency code!';
                        }
                        buy_in = buy_in.slice(0, -3);
                        if (!this.tournament) {
                            this.cash_game = true;
                        }
                    }
                    if (buy_in.indexOf('.') === -1) {
                        throw 'Error: Invalid BUY, amount must include a decimal point!';
                    }
                    buy_in = buy_in.split('.');
                    if (
                        !/^\d+$/.test(buy_in[0]) ||
                        !/^\d+$/.test(buy_in[1])
                    ) {
                        throw 'Error: Invalid BUY, amount must be numeric!';
                    }
                    buy_in = [
                        parseInt(buy_in[0]),
                        parseInt(buy_in[1])
                    ];
                    this.buy_in = buy_in;
                    break;
                case 'INFO':
                    this.info = value;
                    break;
            }
        }
        if (!this.currency) {
            if (this.cash_game) {
                throw 'Error: Invalid BUY, currency must be specified for cash games!';
            }
            if (this.tournament) {
                throw 'Error: Invalid BUY, currency must be specified for tournaments!';
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
                if (/^\d+$/.test(seat)) {
                    seat = parseInt(seat);
                    if (seat > 0 && seat <= this.seats) {
                        seat_valid = true;
                    }
                }
            } else if (!/^\d+$/.test(seat)) {
                seat_valid = true;
            }
            let player = this.get_seat(seat);
            if (player === false) {
                seat_valid = false;
            }
            if (!seat_valid) {
                if (this.btn_notation) {
                    throw 'Error: Invalid seat identifier `' + seat + '`, must be a number between 1 and `seats`';
                } else {
                    throw 'Error: Invalid seat identifier `' + seat + '`, must be a valid position';
                }
            }
            let quoted = this.unquote(value);
            if (value !== quoted) {
                player.name = quoted;
            } else {
                if (value === 'HERO') {
                    player.hero = true;
                } else {
                    let chip_value = this.read_chips(value);
                    if (chip_value === false) {
                        throw 'Error: Seat assignment must be a valid chip value or a name surrounded by double quotes!';
                    }
                    player.stack = chip_value;
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
                    seat_action.amount = 'A';
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
        let preflop_actions = [];
        let players_in_play = [...this.players];
        let players_to_call = players_in_play;
        let bet = this.big_blind;
        let current_bets = {};
        let pot = 0;
        let last_raiser = null;
        for (let player of this.players) {
            if (player === this.get_seat('SB')) {
                current_bets['' + player.seat.offset] = this.small_blind;
                player.chips -= this.small_blind;
                pot += this.small_blind;
            } else if (player === this.get_seat('BB')) {
                current_bets['' + player.seat.offset] = this.big_blind;
                player.chips -= this.big_blind;
                pot += this.big_blind;
            } else {
                current_bets['' + player.seat.offset] = this.ante;
                player.chips -= this.ante;
                pot += this.ante;
            }
        }
        for (let seat of this.sections.actions.preflop) {
            let player = this.get_seat(seat[0]);
            let action = get_action(player, seat[1]);
            preflop_actions.push(action);
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
                let later_actions = preflop_actions;
                if (i > 0) {
                    first_actions = preflop_actions.slice(0, i);
                    later_actions = preflop_actions.slice(i);
                }
                first_actions.push({
                    player: player,
                    action: PSN.action.FOLD
                });
                preflop_actions = first_actions.concat(later_actions);
            }
        }
        const get_actions = (street) => {
            let actions = [];
            for (let seat of this.sections.actions[street]) {
                let player = this.get_seat(seat[0]);
                let action = get_action(player, seat[1]);
                actions.push(action);
            }
            return actions;
        }
        let streets = {
            preflop: preflop_actions,
            flop: get_actions('flop'),
            turn: get_actions('turn'),
            river: get_actions('river')
        };
        for (let street of Object.keys(streets)) {
            let actions = streets[street];
            for (let action of actions) {
                let player = action.player;
                if (action.action === PSN.action.RAISE) {
                    if (players_to_call.includes(player)) {
                        player.chips -= (bet - current_bets[player.seat.offset]);
                        pot += (bet - current_bets[player.seat.offset]);
                    }
                    players_to_call = players_in_play.filter(p => p !== player);
                    let raise_amount = action.amount;
                    if (raise_amount === 'A') {
                        raise_amount = player.chips;
                        players_in_play = players_in_play.filter(p => p !== player);
                    }
                    last_raiser = {
                        player: player,
                        previous_bet: current_bets[player.seat.offset],
                        raise: raise_amount
                    }
                    player.chips -= raise_amount;
                    bet += raise_amount;
                    pot += raise_amount;
                    action.amount = raise_amount;
                    current_bets[player.seat.offset] = bet;
                }
                if (action.action === PSN.action.FOLD) {
                    players_in_play = players_in_play.filter(p => p !== player);
                    if (last_raiser !== null && players_to_call.includes(player)) {
                        players_to_call = players_to_call.filter(p => p !== player);
                        if (players_to_call.length === 0) {
                            last_raiser.player.chips += last_raiser.raise;
                            current_bets[last_raiser.player.seat.offset] = last_raiser.previous_bet;
                            bet -= last_raiser.raise;
                            pot -= last_raiser.raise;
                            last_raiser = null;
                        }
                    }
                }
                if (action.action === 'C') {
                    if (players_to_call.includes(player)) {
                        action.action = PSN.action.CALL;
                    } else {
                        action.action = PSN.action.CHECK;
                    }
                }
                if (action.action === PSN.action.CALL) {
                    players_to_call = players_to_call.filter(p => p !== player);
                    let call_amount = bet - current_bets[player.seat.offset];
                    call_amount = Math.min(call_amount, player.chips);
                    player.chips -= call_amount;
                    current_bets[player.seat.offset] = bet;
                    pot += call_amount;
                    last_raiser = null;
                    action.amount = call_amount;
                }
            }
            bet = 0;
            last_raiser = null;
            for (let seat of Object.keys(current_bets)) {
                current_bets[seat] = 0;
            }
            this.actions[street] = actions;
        }
        this.pot = pot;
    }

    extract_cards() {
        const get_card = (id) => {
            let rank = id.slice(0, 1);
            let suit = id.slice(1);
            let verbose_rank = rank;
            let verbose_suit;
            let rank_lookup = PSN.card_values.rank.find(r => r.id === rank);
            if (typeof rank_lookup === 'undefined') {
                throw 'Error: `' + rank + '` is not a valid rank!';
            }
            if ('verbose' in rank_lookup) {
                verbose_rank = rank_lookup.verbose;
            }
            let suit_lookup = PSN.card_values.suit.find(s => s.id === suit || s.symbol === suit);
            if (typeof suit_lookup === 'undefined') {
                throw 'Error: `' + suit + '` is not a valid suit!';
            }
            suit = suit_lookup.id;
            verbose_suit = suit_lookup.verbose;
            return {
                id: rank + suit,
                rank: rank,
                suit: suit,
                verbose: {
                    name: verbose_rank + ' of ' + verbose_suit,
                    rank: verbose_rank,
                    suit: verbose_suit
                }
            }
        };
        const parse_cards = (string) => {
            let invalid_error = 'Error: `' + string + '` does not contain valid cards!';
            let open = string.indexOf('[');
            let close = string.indexOf(']');
            if (
                open === -1 ||
                close === -1 ||
                open >= close
            ) {
                throw invalid_error;
            }
            let cards_string = string.slice(open + 1, close);
            cards_string = cards_string.replace(/\s/g, '');
            if (cards_string.length % 2 === 1) {
                throw invalid_error;
            }
            let num_cards = Math.trunc(cards_string.length / 2);
            let cards = [];
            for (let i = 0; i < num_cards; i++) {
                let index = i * 2;
                let id = cards_string[index] + cards_string[index + 1];
                cards.push(get_card(id));
            }
            return cards;
        };
        if (this.sections.cards.flop !== false) {
            this.cards.flop = parse_cards(this.sections.cards.flop);
            if (this.cards.flop.length !== 3) {
                throw 'Error: Flop must contain 3 cards!';
            }
        }
        if (this.sections.cards.turn !== false) {
            this.cards.turn = parse_cards(this.sections.cards.turn);
            if (this.cards.turn.length !== 1) {
                throw 'Error: Turn must contain 1 card!';
            }
        }
        if (this.sections.cards.river !== false) {
            this.cards.river = parse_cards(this.sections.cards.river);
            if (this.cards.river.length !== 1) {
                throw 'Error: River must contain 1 card!';
            }
        }
        this.cards.board = this.cards.flop.concat(this.cards.turn).concat(this.cards.river);
        for (let hole of this.sections.cards.players) {
            let cards_start = hole.indexOf('[');
            let seat = hole.slice(0, cards_start);
            let player = this.get_seat(seat);
            if (player === false) {
                throw 'Error: Invalid seat identifier `' + seat + '`';
            }
            let cards = parse_cards(hole);
            if (cards.length !== 2) {
                throw 'Error: Hole cards must contain 2 cards!';
            }
            player.cards = cards;
        }
    }

    award_winners() {
        for (let winner of this.sections.winners) {
            let player = this.get_seat(winner[0]);
            let chips = winner[1];
            if (
                chips === 'P' ||
                chips === 'POT'
            ) {
                chips = this.pot;
            } else {
                chips = this.read_chips(chips);
            }
            player.chips += chips;
        }
    }

    print_hand() {
        for (let street of Object.keys(this.actions)) {
            process.stdout.write('\nStreet: ' + street + '\n\n');
            for (let action of this.actions[street]) {
                let action_name = '';
                for (let a_name of Object.keys(PSN.action)) {
                    if (action.action === PSN.action[a_name]) {
                        action_name = a_name;
                        break;
                    }
                }
                if ('amount' in action) {
                    process.stdout.write(action.player.seat.id[0] + ' ' + action_name + ' ' + action.amount + '\n');
                } else {
                    process.stdout.write(action.player.seat.id[0] + ' ' + action_name + '\n');
                }
            }
        }
    }
}
exports.PSN = PSN;