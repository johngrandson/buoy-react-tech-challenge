import { LoginApiService } from "./api";
import { LoginRequestData, LoginResponseData } from "./interface";

// Create a type that exposes protected members for testing
type LoginApiServiceWithProtected = LoginApiService & {
  fetchPost: LoginApiService["fetchPost"];
};

const expiredTokenTime = 1650000000000;

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

    it("should handle multiple service instances with independent promise caching", async () => {
      // Create two separate service instances
      const service1 = new LoginApiService();
      const service2 = new LoginApiService();

      // Mock fetchPost for both services
      const mockFetchPost1 = jest.fn();
      const mockFetchPost2 = jest.fn();

      const serviceWithProtected1 = service1 as LoginApiServiceWithProtected;
      const serviceWithProtected2 = service2 as LoginApiServiceWithProtected;

      jest
        .spyOn(serviceWithProtected1, "fetchPost")
        .mockImplementation(mockFetchPost1);
      jest
        .spyOn(serviceWithProtected2, "fetchPost")
        .mockImplementation(mockFetchPost2);

      // Expired token
      const expiredToken: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInN1YiI6InVzZXIxIn0=.signature",
        refresh: "refresh-token",
      };

      // New tokens for each service
      const newToken1: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDAwMDAwMDAsInN1YiI6InVzZXIxIn0=.signature",
        refresh: "service1-new-refresh-token",
      };

      const newToken2: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDAwMDAwMDAsInN1YiI6InVzZXIyIn0=.signature",
        refresh: "service2-new-refresh-token",
      };

      // Mock localStorage to return expired token
      jest
        .spyOn(Storage.prototype, "getItem")
        .mockReturnValue(JSON.stringify(expiredToken));
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
      jest.spyOn(Date, "now").mockReturnValue(expiredTokenTime);

      // Mock refresh responses - each service gets different tokens
      mockFetchPost1.mockResolvedValueOnce(newToken1);
      mockFetchPost2.mockResolvedValueOnce(newToken2);

      // Call getValidToken for both services simultaneously
      const promises = [
        service1.getValidToken(),
        service1.getValidToken(), // Should reuse service1's promise
        service2.getValidToken(),
        service2.getValidToken(), // Should reuse service2's promise
      ];

      const results = await Promise.all(promises);

      // Service1 calls should return service1's new token
      expect(results[0]).toEqual(newToken1);
      expect(results[1]).toEqual(newToken1);

      // Service2 calls should return service2's new token
      expect(results[2]).toEqual(newToken2);
      expect(results[3]).toEqual(newToken2);

      // Each service should only make one refresh call
      expect(mockFetchPost1).toHaveBeenCalledTimes(1);
      expect(mockFetchPost1).toHaveBeenCalledWith(
        "/refresh/",
        { method: "POST" },
        { refresh: "refresh-token" }
      );

      expect(mockFetchPost2).toHaveBeenCalledTimes(1);
      expect(mockFetchPost2).toHaveBeenCalledWith(
        "/refresh/",
        { method: "POST" },
        { refresh: "refresh-token" }
      );
    });
  });
});
