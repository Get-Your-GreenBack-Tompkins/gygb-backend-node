import { secureRandomNumber } from "./random";
describe("Secure Random Number Generator", () => {
  it("generates a number", () => {
    expect(secureRandomNumber(0, 100).then(v => typeof v)).resolves.toEqual(
      "number"
    );
  });
});
