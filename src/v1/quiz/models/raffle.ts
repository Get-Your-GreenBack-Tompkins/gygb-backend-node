import { Model } from "../../model";

import Delta from "quill-delta";
import firebase from "firebase-admin";

export function header() {
  const delta = new Delta();

  delta.insert(header, { header: 2 });

  return delta;
}

export type RaffleDoc = {
  prize: string;
  requirement: number;
  month: firebase.firestore.Timestamp;
  winner?: RaffleEntrant;
};

export type RaffleEntrant = { id: string; firstName: string; lastName: string; email: string };

export type Unknown<K> = { [k in keyof K]: unknown };

export function isRaffleDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<RaffleDoc> {
  const asQuiz = doc as FirebaseFirestore.DocumentSnapshot<RaffleDoc>;
  const data = asQuiz.data();

  if (!data) {
    return false;
  }

  const hasPrize = typeof data.prize === "string";
  const hasRequirement = typeof data.requirement === "number";
  const hasDate = data.month instanceof firebase.firestore.Timestamp;

  return hasPrize && hasRequirement && hasDate;
}

export function isRaffleQueryDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.QueryDocumentSnapshot<RaffleDoc> {
  return isRaffleDocument(doc);
}

export type PrizeInfo = {
  prize: string;
  requirement: number;
}

export class Raffle extends Model implements PrizeInfo {
  prize: string;
  requirement: number;
  month: Date;
  winner?: RaffleEntrant;

  constructor(params: {
    id: string;
    prize: string;
    requirement: number;
    month: Date;
    winner?: RaffleEntrant;
  }) {
    const { id, prize, requirement, month } = params;

    super(id);
    this.month = month;
    this.requirement = requirement;
    this.prize = prize;

    if ("winner" in params && typeof params.winner === "object") {
      this.winner = params.winner;
    }
  }

  toDatastore(): RaffleDoc {
    const { prize, requirement, month, winner } = this;
    return winner
      ? {
          prize,
          requirement,
          winner,
          month: firebase.firestore.Timestamp.fromDate(month)
        }
      : {
          prize,
          requirement,
          month: firebase.firestore.Timestamp.fromDate(month)
        };
  }

  static fromDatastore(id: string, data: RaffleDoc): Raffle {
    const { prize, month, requirement, winner } = data;

    const r = new Raffle({
      id,
      prize,
      requirement,
      winner,
      month: month.toDate()
    });

    return r;
  }

  toAuthenticatedJSON() {
    const { id, month, requirement, prize, winner = null } = this;

    return {
      id,
      prize,
      requirement,
      winner,
      month: month.toISOString()
    };
  }

  toJSON() {
    const { id, month, requirement, prize } = this;

    return {
      id,
      prize,
      requirement,
      month: month.toISOString()
    };
  }
}
