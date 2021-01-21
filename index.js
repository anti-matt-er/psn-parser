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
        this.notation = PSN.normalise_notation(notation);
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

    extract() {
        this.extract_game();
    }

    extract_game() {
        this.extract_bets();
        //this.extract_seats();
    }

    extract_bets() {
        let notation_pieces = this.notation.split(' ', 4);
        let bets = notation_pieces[0].split('|');
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
}
exports.PSN = PSN;