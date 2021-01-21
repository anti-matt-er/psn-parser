'use strict';

class PSN {
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
        if (normalised.slice(0, 4) !== 'NLH ') {
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
        return next_piece;
    }

    extract() {
        this.extract_game();
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
}
exports.PSN = PSN;