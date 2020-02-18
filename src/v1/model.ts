// This type represents all valid json.
export type json =
  | string
  | number
  | boolean
  | null
  | json[]
  | { [key in string | number]: json };

export type Json =
  | { toJSON(): Json | json }
  | { [key in string | number]: Json | json }
  | Json[];

export abstract class Model {
  abstract toJSON(): json | Json;
  abstract toDatastore(): json;

  static fromDatastore(id: string, json: json): unknown {
    return null;
  }
}
