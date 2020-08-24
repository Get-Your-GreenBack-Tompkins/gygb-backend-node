import { Model } from "../../model";

export type SessionDoc = {
  email: string;
  downloaded: boolean;
  startTime: Date;
  endTime: Date;
};

export function isSessionDocument(
  doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>
): doc is FirebaseFirestore.DocumentSnapshot<SessionDoc> {
  const data = doc.data();

  const hasEmail = "email" in data && typeof data.email === "string";
  const hasDownloaded =
    "downloaded" in data && typeof data.downloaded === "boolean";
  const hasStart = "startTime" in data;
  const hasEnd = "endTime" in data;

  return hasEmail && hasDownloaded && hasStart && hasEnd;
}

export class Session extends Model {
  email: string;
  downloaded: boolean;
  startTime: Date;
  endTime: Date;

  constructor(id: string) {
    super(id);
  }

  toJSON() {
    const { id, email, downloaded, startTime, endTime } = this;

    return {
      id,
      email,
      downloaded,
      startTime: startTime.toJSON(),
      endTime: endTime.toJSON()
    };
  }

  toDatastore() {
    const { email, downloaded, startTime, endTime } = this;

    return {
      email,
      downloaded,
      startTime,
      endTime
    };
  }

  static fromDatastore(id: string, doc: SessionDoc) {
    const session = new Session(id);

    session.email = doc.email;
    session.downloaded = doc.downloaded;
    session.startTime = doc.startTime;
    session.endTime = doc.endTime;

    return session;
  }
}
