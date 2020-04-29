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
  winner?: string;
};

export type Unknown<K> = { [k in keyof K]: unknown };

export function isRaffleQueryDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.QueryDocumentSnapshot<RaffleDoc> {
  const asQuiz = doc as FirebaseFirestore.QueryDocumentSnapshot<RaffleDoc>;
  const data = asQuiz.data();

  if (!data) {
    return false;
  }

  const hasPrize = typeof data.prize === "string";
  const hasRequirement = typeof data.requirement === "number";
  const hasDate = data.month instanceof firebase.firestore.Timestamp;

  return hasPrize && hasRequirement && hasDate;
}

export class Raffle extends Model {
  prize: string;
  requirement: number;
  month: Date;
  winner?: string;

  constructor(params: { id: string; prize: string; requirement: number; month: Date; winner?: string }) {
    const { id, prize, requirement, month } = params;

    super(id);
    this.month = month;
    this.requirement = requirement;
    this.prize = prize;

    if ("winner" in params) {
      this.winner = params.winner;
    }
  }

  toDatastore(): RaffleDoc {
    const { prize, requirement, month, winner } = this;
    return {
      prize,
      requirement,
      winner,
      month: firebase.firestore.Timestamp.fromDate(month)
    };
  }

  static fromDatastore(id: string, data: RaffleDoc): Raffle {
    const { prize, month, requirement } = data;

    const r = new Raffle({
      id,
      prize,
      requirement,
      month: month.toDate()
    });

    return r;
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
