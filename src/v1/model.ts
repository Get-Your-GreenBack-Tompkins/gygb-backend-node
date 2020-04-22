// This type represents all valid json.
export type json = string | number | boolean | null | json[] | { [key in string | number]: json };

export type Json = { toJSON(): Json | json } | { [key in string | number]: Json | json } | Json[];

export type DatastoreJson =
  | json
  | FirebaseFirestore.Timestamp
  | { [key in string | number]: FirebaseFirestore.Timestamp | json };

export abstract class Model {
  id: string;

  protected constructor(id: string) {
    this.id = id;
  }

  abstract toJSON(): json | Json;
  abstract toDatastore(): DatastoreJson;

  static fromDatastore(id: string, json: DatastoreJson): unknown {
    return null;
  }
}
