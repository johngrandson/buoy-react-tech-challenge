import { LoginApiService } from "./api";
import { LoginRequestData, LoginResponseData } from "./interface";

// Create a type that exposes protected members for testing
type LoginApiServiceWithProtected = LoginApiService & {
  fetchPost: LoginApiService["fetchPost"];
};

describe("LoginApiService", () => {
  let service: LoginApiService;
  let mockFetchPost: jest.Mock;

  beforeEach(() => {
    service = new LoginApiService();
    mockFetchPost = jest.fn();

    // Cast to our test type to access protected methods safely
    const serviceWithProtected = service as LoginApiServiceWithProtected;
    jest
      .spyOn(serviceWithProtected, "fetchPost")
      .mockImplementation(mockFetchPost);

    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("login", () => {
    it("should call fetchPost with correct endpoint and credentials", async () => {
      const loginRequest: LoginRequestData = {
        email: "test@example.com",
        password: "password123",
      };

      const expectedResponse: LoginResponseData = {
        access: "access-token",
        refresh: "refresh-token",
      };

      mockFetchPost.mockResolvedValueOnce(expectedResponse);

      const result = await service.login(loginRequest);

      expect(mockFetchPost).toHaveBeenCalledWith(
        "/login/",
        { method: "POST" },
        loginRequest
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe("getValidToken", () => {
    it("should only refresh token once when called multiple times simultaneously", async () => {
      const expiredTokenTime = 1650000000000;

      // Create an expired token
      const expiredToken: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInN1YiI6IjEyMzQ1Njc4OTAifQ.signature",
        refresh: "refresh-token",
      };

      const newToken: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDAwMDAwMDAsInN1YiI6IjEyMzQ1Njc4OTAifQ.signature",
        refresh: "new-refresh-token",
      };

      // Mock localStorage to return expired token
      jest
        .spyOn(Storage.prototype, "getItem")
        .mockReturnValue(JSON.stringify(expiredToken));
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});

      // Mock current time to be after token expiration
      jest.spyOn(Date, "now").mockReturnValue(expiredTokenTime);

      // Mock refresh endpoint to return new token
      mockFetchPost.mockResolvedValueOnce(newToken);

      // Call getValidToken multiple times simultaneously
      const promises = [
        service.getValidToken(),
        service.getValidToken(),
        service.getValidToken(),
      ];

      const results = await Promise.all(promises);

      // All calls should return the same new token
      expect(results[0]).toEqual(newToken);
      expect(results[1]).toEqual(newToken);
      expect(results[2]).toEqual(newToken);

      // But fetchPost should only be called once
      expect(mockFetchPost).toHaveBeenCalledTimes(1);
      expect(mockFetchPost).toHaveBeenCalledWith(
        "/refresh/",
        { method: "POST" },
        { refresh: "refresh-token" }
      );
    });
  });
});
