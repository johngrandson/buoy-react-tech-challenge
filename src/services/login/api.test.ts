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
    // Reset singleton before each test
    LoginApiService.resetInstance();
    service = LoginApiService.getInstance();
    mockFetchPost = jest.fn();

    // Cast to our test type to access protected methods safely
    const serviceWithProtected = service as LoginApiServiceWithProtected;
    jest.spyOn(serviceWithProtected, "fetchPost").mockImplementation(mockFetchPost);

    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up singleton after each test
    LoginApiService.resetInstance();
  });

  describe("login", () => {
    it("should authenticate user and store tokens", async () => {
      const loginRequest: LoginRequestData = {
        email: "test@example.com",
        password: "password123",
      };

      const expectedResponse: LoginResponseData = {
        access: "access-token",
        refresh: "refresh-token",
      };

      mockFetchPost.mockResolvedValueOnce(expectedResponse);
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});

      const result = await service.login(loginRequest);

      expect(mockFetchPost).toHaveBeenCalledWith("/login/", { method: "POST" }, loginRequest);
      expect(result).toEqual(expectedResponse);
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        "loginData",
        JSON.stringify(expectedResponse)
      );
    });

    it("should prevent duplicate login requests when user double-clicks", async () => {
      // Real scenario: User double-clicks login button
      const loginRequest: LoginRequestData = {
        email: "user@example.com",
        password: "password123",
      };

      const expectedResponse: LoginResponseData = {
        access: "access-token-123",
        refresh: "refresh-token-123",
      };

      // Mock realistic network delay
      mockFetchPost.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(expectedResponse), 100))
      );
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});

      // Simulate double-click or multiple form submissions
      const promises = [
        service.login(loginRequest),
        service.login(loginRequest),
        service.login(loginRequest),
      ];

      const results = await Promise.all(promises);

      // All should get same response
      results.forEach(result => {
        expect(result).toEqual(expectedResponse);
      });

      // CRITICAL: Only ONE API call despite multiple clicks
      expect(mockFetchPost).toHaveBeenCalledTimes(1);
      expect(Storage.prototype.setItem).toHaveBeenCalledTimes(1);
    });
  });

  describe("getValidToken", () => {
    it("should prevent duplicate refresh requests on dashboard refresh", async () => {
      // Real scenario: Dashboard refreshes and multiple components need valid token
      const expiredToken: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsInN1YiI6InVzZXIxMjMifQ.signature",
        refresh: "refresh-token",
      };

      const newToken: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDAwMDAwMDAsInN1YiI6InVzZXIxMjMifQ.signature",
        refresh: "new-refresh-token",
      };

      // Setup expired token in storage
      jest.spyOn(Storage.prototype, "getItem").mockReturnValue(JSON.stringify(expiredToken));
      jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
      jest.spyOn(Date, "now").mockReturnValue(expiredTokenTime);

      // Mock realistic network delay
      mockFetchPost.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(newToken), 100))
      );

      // Simulate multiple components requesting valid token on dashboard mount
      const promises = [
        service.getValidToken(), // Dashboard component
        service.getValidToken(), // Header component
        service.getValidToken(), // Profile widget
        service.getValidToken(), // API interceptor
      ];

      const results = await Promise.all(promises);

      // All should get the same refreshed token
      results.forEach(result => {
        expect(result).toEqual(newToken);
      });

      // CRITICAL: Only ONE refresh request despite multiple component calls
      expect(mockFetchPost).toHaveBeenCalledTimes(1);
      expect(mockFetchPost).toHaveBeenCalledWith(
        "/refresh/",
        { method: "POST" },
        { refresh: "refresh-token" }
      );
    });

    it("should return current token if not expired", async () => {
      // Real scenario: Token is still valid, no refresh needed
      const validToken: LoginResponseData = {
        access:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDAwMDAwMDAsInN1YiI6InVzZXIxMjMifQ.signature",
        refresh: "refresh-token",
      };

      jest.spyOn(Storage.prototype, "getItem").mockReturnValue(JSON.stringify(validToken));
      jest.spyOn(Date, "now").mockReturnValue(expiredTokenTime);

      const result = await service.getValidToken();

      expect(result).toEqual(validToken);
      // No refresh needed
      expect(mockFetchPost).not.toHaveBeenCalled();
    });

    it("should logout if no refresh token available", async () => {
      // Real scenario: User data corrupted or missing
      jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
      const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");

      const result = await service.getValidToken();

      expect(result).toBeNull();
      expect(removeItemSpy).toHaveBeenCalledWith("loginData");
      expect(mockFetchPost).not.toHaveBeenCalled();
    });
  });
});
