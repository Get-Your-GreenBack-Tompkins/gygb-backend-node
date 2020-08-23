import * as Status from "http-status-codes";

import { ApiError } from "./util";

describe("Internal API Error", () => {
  const internalError = () => {
    throw ApiError.internalError("Internal Error");
  };

  it("has internal error code", () => {
    expect(internalError).toThrow(
      expect.objectContaining({ status: Status.INTERNAL_SERVER_ERROR })
    );
  });

  it("has status code 500", () => {
    expect(internalError).toThrow(expect.objectContaining({ status: 500 }));
  });

  it("has correct message", () => {
    expect(internalError).toThrow("Internal Error");
  });
});

describe("Not Found API Error", () => {
  const notFound = () => {
    throw ApiError.notFound("Not Found");
  };

  it("has not found code", () => {
    expect(notFound).toThrow(
      expect.objectContaining({ status: Status.NOT_FOUND })
    );
  });

  it("has status code 404", () => {
    expect(notFound).toThrow(expect.objectContaining({ status: 404 }));
  });

  it("has correct message", () => {
    expect(notFound).toThrow("Not Found");
  });
});

describe("Invalid Request API Error", () => {
  const invalidRequest = () => {
    throw ApiError.invalidRequest("Invalid Request");
  };

  it("has bad request code", () => {
    expect(invalidRequest).toThrow(
      expect.objectContaining({ status: Status.BAD_REQUEST })
    );
  });

  it("has status code 400", () => {
    expect(invalidRequest).toThrow(expect.objectContaining({ status: 400 }));
  });

  it("has correct message", () => {
    expect(invalidRequest).toThrow("Invalid Request");
  });
});

describe("Custom API Error", () => {
    const custom = () => {
      throw new ApiError("Bad Gateway", Status.BAD_GATEWAY);
    };
  
    it("has correct code", () => {
      expect(custom).toThrow(
        expect.objectContaining({ status: Status.BAD_GATEWAY })
      );
    });
  
    it("has correct message", () => {
      expect(custom).toThrow("Bad Gateway");
    });
  });
