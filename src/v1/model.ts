// This type represents all valid json.
export type json =
  | string
  | number
  | boolean
  | null
  | json[]
  | { [key in string | number]: json };

export type Json = { [key in string | number]: Json | json } | Json[];

export type DatastoreJson =
  | json
  | FirebaseFirestore.Timestamp
  | { [key in string | number]: FirebaseFirestore.Timestamp | json | Date };

export interface Jsonable {
  toJSON(): json | Json;
}

export abstract class Model implements Jsonable {
  id: string;

  protected constructor(id: string) {
    this.id = id;
  }

  abstract toJSON(): json | Json;
  abstract toDatastore(): DatastoreJson;

  static fromDatastore(_id: string, _json: DatastoreJson): unknown {
    return null;
  }
}
