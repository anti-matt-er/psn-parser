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
                if (c === ' ') {
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
        let game_req = (i, btn) => {
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
            '=': [],
            ':': [],
            winner: null
        };
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
                    splitted['='].push(parsed);
                    delimited = true;
                }
                if (
                    section.indexOf(':') !== -1 &&
                    section.indexOf(':') < quote_pos
                ) {
                    parsed = section.split(':', 2);
                    splitted[':'].push(parsed);
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

    generate_player(seat) {
        let new_player = {
            seat: seat,
            name: null,
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
        let player = this.players.find(player => player.seat === seat);
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
        if (this.btn_notation) {
            for (let i = 1; i <= this.seats; i++) {
                this.generate_player(i);
            }
        }
        for (let seat_value of this.sections['=']) {
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
            let player = this.players.find(player => player.seat === seat);
            if (player === undefined) {
                player = this.generate_player(seat);
            }
            let quoted = this.unquote(value);
            if (value !== quoted) {
                player.name = quoted;
            } else {
                if (value === 'HERO') {
                    player.hero = true;
                } else {
                    player.chips = this.read_chips(value);
                }
            }
        }
    }
}
exports.PSN = PSN;