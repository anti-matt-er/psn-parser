'use strict';

class PSN {
    pregame_notation = '';
    game_notation = '';
    game_start = false;

    big_blind = 0;
    small_blind = 0;
    ante = 0;
    btn_notation = false;
    dealer = false;
    seats = 0;
    max_seats = 0;

    constructor(notation) {
        let raw = PSN.normalise_notation(notation);
        let game_start = raw.indexOf('#P');
        this.pregame_notation = raw.slice(0, game_start);
        this.game_notation = raw.slice(game_start + 1);
        this.extract();
    }

    static normalise_notation(notation) {
        let normalised = PSN.clean_whitespace(notation);
        if (
            normalised.slice(0, 4) !== 'NLH ' ||
            normalised.indexOf('#P') === -1
        ) {
            throw 'Error: Invalid syntax!';
        }
        return normalised.slice(4);
    }

    static clean_whitespace(notation) {
        let clean = notation;
        clean = clean.replace(/\s/g, ' ');
        clean = clean.replace(/\s\s+/g, ' ');
        clean = clean.trimRight();
        return clean;
    }

    static parse_piece(string) {
        let split_at = string.indexOf(' ');
        if (split_at === -1) {
            return false;
        }
        let piece = string.slice(0, split_at);
        let rest = string.slice(split_at + 1);
        return [piece, rest];
    }

    static parse_quotes(string) {
        if (string.indexOf('"') !== 0) {
            return false;
        }
        let string_remainder = string.slice(1);
        let quote_end = false;
        let next_quote = string_remainder.indexOf('"');
        while (!quote_end) {
            if (next_quote < 1) {
                return false;
            }
            if (string_remainder[next_quote - 1] !== '\\') {
                quote_end = true;
            } else {
                next_quote = string_remainder.indexOf('"', next_quote + 1);
            }
        }
        if (
            next_quote < string_remainder.length &&
            string_remainder[next_quote + 1] !== ' '
        ) {
            throw 'Error: Quoted strings must be followed by whitespace!';
        }
        let quoted_string = string_remainder.slice(0, next_quote);
        quoted_string = quoted_string.replace(/\\"/g, '"');
        let rest = string_remainder.slice(next_quote + 1);
        return [quoted_string, rest];
    }

    extract() {
        this.extract_bets();
        this.extract_seats();
        this.extract_info();
    }

    extract_bets() {
        let pieces = PSN.parse_piece(this.pregame_notation);
        let bets = pieces[0].split('|');
        this.pregame_notation = pieces[1];
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
        let pieces = PSN.parse_piece(this.pregame_notation);
        let section = pieces[0];
        this.pregame_notation = pieces[1];
        if (section === 'BTN') {
            this.btn_notation = true;
            pieces = PSN.parse_piece(this.pregame_notation);
            section = pieces[0];
            this.pregame_notation = pieces[1];
        }
        let seats = section.split('/');
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

    extract_info() {
        let pieces = PSN.parse_piece(this.pregame_notation);
        let section = pieces[0];
        let rest = pieces[1];
        let done = false;
        while (!done) {
            switch (section) {
                case 'DATE':
                    pieces = PSN.parse_piece(rest);
                    if (pieces === false) {
                        done = true;
                        break;
                    }
                    let date = new Date(pieces[0]);
                    if (isNaN(date)) {
                        throw 'Error: Invaild DATE format!';
                    }
                    this.date = date;
                    section = pieces[0];
                    rest = pieces[1];
                    break;
                case 'CASH':
                    pieces = PSN.parse_piece(rest);
                    if (pieces === false) {
                        done = true;
                        break;
                    }
                    let currency = pieces[0];
                    if (currency.length !== 3) {
                        throw 'Error: Invalid CASH currency!';
                    }
                    this.tournament = false;
                    this.cash_game = true;
                    this.currency = currency;
                    section = pieces[0];
                    rest = pieces[1];
                    break;
                case 'LVL':
                    pieces = PSN.parse_piece(rest);
                    if (pieces === false) {
                        done = true;
                        break;
                    }
                    let level = parseInt(pieces[0]);
                    if (isNaN(level)) {
                        throw 'Error: Invalid LEVEL!';
                    }
                    this.tournament = true;
                    this.cash_game = false;
                    this.level = level;
                    section = pieces[0];
                    rest = pieces[1];
                    break;
                case 'BUY':
                    pieces = PSN.parse_piece(rest);
                    if (pieces === false) {
                        done = true;
                        break;
                    }
                    let buy_in = pieces[0];
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
                    section = pieces[0];
                    rest = pieces[1];
                    break;
                case 'INFO':
                    pieces = PSN.parse_quotes(rest);
                    if (pieces === false) {
                        done = true;
                        break;
                    }
                    let info = pieces[0];
                    if (info === false) {
                        throw 'Error: Invalid INFO!';
                    }
                    this.info = info;
                    section = pieces[0];
                    rest = pieces[1];
                    break;
            }
            pieces = PSN.parse_quotes(rest);
            if (pieces !== false) {
                section = pieces[0];
                rest = pieces[1];
            } else {
                pieces = PSN.parse_piece(rest);
                if (pieces !== false) {
                    section = pieces[0];
                    rest = pieces[1];
                } else {
                    done = true;
                }
            }
        }
    }
}
exports.PSN = PSN;