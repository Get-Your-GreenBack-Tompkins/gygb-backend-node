import Delta from "quill-delta";

export function header() {
  const delta = new Delta();

  delta.insert(header, { header: 2 });

  return delta;
}

export type AdminId = string;
export type AdminDoc = {
  email: string;
  uid: string;
};

export function isAdminQueryDocument(
  doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.QueryDocumentSnapshot<AdminDoc> {
  const asQuiz = doc as FirebaseFirestore.QueryDocumentSnapshot<AdminDoc>;
  const data = asQuiz.data();

  if (!data) {
    return false;
  }

  return typeof data.email === "string" && typeof data.uid === "string";
}

export class Admin {
  id: string;
  email: string;
  uid: string;

  constructor(params: { id: string; email: string; uid: string }) {
    const { id, email, uid } = params;

    this.id = id;
    this.email = email;
    this.uid = uid;
  }

  toDatastore(): AdminDoc {
    return {
      email: this.email,
      uid: this.uid
    };
  }

  static fromDatastore(id: AdminId, data: AdminDoc): Admin {
    const { email, uid } = data;

    const a = new Admin({
      id,
      email,
      uid
    });

    return a;
  }

  toJSON() {
    const { id, email, uid } = this;

    return {
      id,
      email,
      uid
    };
  }
}
