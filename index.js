'use strict';

class PSN {
    unparsed_notation = '';
    game_start = false;

    big_blind = 0;
    small_blind = 0;
    ante = 0;
    btn_notation = false;
    dealer = false;
    seats = 0;
    max_seats = 0;

    constructor(notation) {
        this.unparsed_notation = PSN.normalise_notation(notation);
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

    parse_next_piece() {
        let split_at = this.unparsed_notation.indexOf(' ');
        let next_piece = this.unparsed_notation.slice(0, split_at);
        this.unparsed_notation = this.unparsed_notation.slice(split_at + 1);
        this.check_game_start();
        return next_piece;
    }

    parse_next_string() {
        if (this.unparsed_notation.indexOf('"') !== 0) {
            return false;
        }
        let quoted_string = this.unparsed_notation.slice(1);
        let quote_end = false;
        let next_quote = quoted_string.indexOf('"');
        while (!quote_end) {
            if (next_quote < 1) {
                return false;
            }
            if (quoted_string[next_quote - 1] !== '\\') {
                quote_end = true;
            } else {
                next_quote = quoted_string.indexOf('"', next_quote + 1);
            }
        }
        if (
            next_quote < quoted_string.length &&
            quoted_string[next_quote + 1] !== ' '
        ) {
            throw 'Error: Quoted strings must be followed by whitespace!';
        }
        let next_piece = quoted_string.slice(0, next_quote);
        next_piece = next_piece.replace(/\\"/g, '"');
        this.unparsed_notation = quoted_string.slice(next_quote + 1);
        this.check_game_start();
        return next_piece;
    }

    check_game_start() {
        if (this.unparsed_notation.indexOf('#P') === 0) {
            this.game_start = true;
        }
    }

    extract() {
        this.extract_game();
        this.extract_info();
    }

    extract_game() {
        this.extract_bets();
        this.extract_seats();
    }

    extract_bets() {
        let section = this.parse_next_piece();
        let bets = section.split('|');
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
        let section = this.parse_next_piece();
        if (section === 'BTN') {
            this.btn_notation = true;
            section = this.parse_next_piece();
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
        while (!this.game_start) {
            let section = this.parse_next_piece();
            switch (section) {
                case 'DATE':
                    let date = new Date(this.parse_next_piece());
                    if (isNaN(date)) {
                        throw 'Error: Invaild DATE format!';
                    }
                    this.date = date;
                    break;
                case 'CASH':
                    let currency = this.parse_next_piece();
                    if (currency.length !== 3) {
                        throw 'Error: Invalid CASH currency!';
                    }
                    this.tournament = false;
                    this.cash_game = true;
                    this.currency = currency;
                    break;
                case 'LVL':
                    let level = parseInt(this.parse_next_piece());
                    if (isNaN(level)) {
                        throw 'Error: Invalid LEVEL!';
                    }
                    this.tournament = true;
                    this.cash_game = false;
                    this.level = level;
                    break;
                case 'BUY':
                    let buy_in = this.parse_next_piece();
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
                    let info = this.parse_next_string();
                    if (info === false) {
                        throw 'Error: Invalid INFO!';
                    }
                    this.info = info;
                    break;
            }
        }
    }
}
exports.PSN = PSN;