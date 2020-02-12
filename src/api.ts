import { ApiError } from "./api/util";

export class GreenBackApi {
  /**
   * A simple function to say hello to everyone except those named "Archibald"
   * @param name the name to say "Hello" to.
   */
  sayHello(name: string): string | ApiError {
    if (name !== "Archibald") {
      return `Hello, ${name}`;
    } else {
      return ApiError.invalidRequest(
        "We do not say hello to those named Archibald"
      );
    }
  }
}
