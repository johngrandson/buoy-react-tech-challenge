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

    it('should not make duplicate requests when login is called multiple times simultaneously', async () => {
      const loginRequest: LoginRequestData = {
        email: 'user@example.com',
        password: 'password123'
      };
      
      const expectedResponse: LoginResponseData = {
        access: 'access-token-123',
        refresh: 'refresh-token-123'
      };
      
      // Mock a slow response to ensure concurrent calls
      mockFetchPost.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(expectedResponse), 100)
        )
      );
      
      // Mock localStorage methods
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      
      // Call login multiple times simultaneously
      const promises = [
        service.login(loginRequest),
        service.login(loginRequest),
        service.login(loginRequest)
      ];
      
      const results = await Promise.all(promises);
      
      // All calls should return the same response
      expect(results[0]).toEqual(expectedResponse);
      expect(results[1]).toEqual(expectedResponse);
      expect(results[2]).toEqual(expectedResponse);
      
      // But fetchPost should only be called once
      expect(mockFetchPost).toHaveBeenCalledTimes(1);
      expect(mockFetchPost).toHaveBeenCalledWith(
        '/login/',
        { method: 'POST' },
        loginRequest
      );
      
      // localStorage should only be called once
      expect(Storage.prototype.setItem).toHaveBeenCalledTimes(1);
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'loginData',
        JSON.stringify(expectedResponse)
      );
    });

    it('should handle concurrent login errors correctly and clear promise cache', async () => {
      const loginRequest: LoginRequestData = {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      };
      
      const loginError = new Error('Invalid credentials');
      
      // Mock a slow failing response
      mockFetchPost.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(loginError), 100)
        )
      );
      
      // Call login multiple times simultaneously
      const promises = [
        service.login(loginRequest),
        service.login(loginRequest),
        service.login(loginRequest)
      ];
      
      // All promises should reject with the same error
      await Promise.all(promises.map(promise => 
        expect(promise).rejects.toThrow('Invalid credentials')
      ));
      
      // But fetchPost should only be called once
      expect(mockFetchPost).toHaveBeenCalledTimes(1);
      expect(mockFetchPost).toHaveBeenCalledWith(
        '/login/',
        { method: 'POST' },
        loginRequest
      );
      
      // After error, cache should be cleared and new attempt should work
      const successResponse: LoginResponseData = {
        access: 'new-access-token',
        refresh: 'new-refresh-token'
      };
      
      mockFetchPost.mockResolvedValueOnce(successResponse);
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      
      const retryResult = await service.login({
        email: 'valid@example.com',
        password: 'correctpassword'
      });
      
      expect(retryResult).toEqual(successResponse);
      expect(mockFetchPost).toHaveBeenCalledTimes(2); // First failed, second succeeded
    });

    it('should allow new login after logout without cache interference', async () => {
      // First login
      const firstLoginRequest: LoginRequestData = {
        email: 'user1@example.com',
        password: 'password1'
      };
      
      const firstLoginResponse: LoginResponseData = {
        access: 'first-access-token',
        refresh: 'first-refresh-token'
      };
      
      mockFetchPost.mockResolvedValueOnce(firstLoginResponse);
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
      
      const firstResult = await service.login(firstLoginRequest);
      expect(firstResult).toEqual(firstLoginResponse);
      expect(mockFetchPost).toHaveBeenCalledTimes(1);
      
      // Logout
      service.logout();
      expect(Storage.prototype.removeItem).toHaveBeenCalledWith('loginData');
      
      // Second login with different credentials
      const secondLoginRequest: LoginRequestData = {
        email: 'user2@example.com',
        password: 'password2'
      };
      
      const secondLoginResponse: LoginResponseData = {
        access: 'second-access-token',
        refresh: 'second-refresh-token'
      };
      
      mockFetchPost.mockResolvedValueOnce(secondLoginResponse);
      
      const secondResult = await service.login(secondLoginRequest);
      expect(secondResult).toEqual(secondLoginResponse);
      
      // Should have made 2 separate API calls (no cache interference)
      expect(mockFetchPost).toHaveBeenCalledTimes(2);
      expect(mockFetchPost).toHaveBeenNthCalledWith(1, '/login/', { method: 'POST' }, firstLoginRequest);
      expect(mockFetchPost).toHaveBeenNthCalledWith(2, '/login/', { method: 'POST' }, secondLoginRequest);
    });

    it('should handle rapid sequential login attempts correctly', async () => {
      const loginRequest: LoginRequestData = {
        email: 'rapid@example.com',
        password: 'password123'
      };
      
      const loginResponse: LoginResponseData = {
        access: 'rapid-access-token',
        refresh: 'rapid-refresh-token'
      };
      
      // Mock slower responses (50ms each) to ensure overlap
      mockFetchPost.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(loginResponse), 50)
        )
      );
      
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      
      // Make rapid sequential calls with minimal delay
      const firstCall = service.login(loginRequest);
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms (still within 50ms API call)
      const secondCall = service.login(loginRequest);
      await new Promise(resolve => setTimeout(resolve, 10)); // Wait 10ms (still within API call)
      const thirdCall = service.login(loginRequest);
      
      const results = await Promise.all([firstCall, secondCall, thirdCall]);
      
      // All should return the same response
      expect(results[0]).toEqual(loginResponse);
      expect(results[1]).toEqual(loginResponse);
      expect(results[2]).toEqual(loginResponse);
      
      // Only the first request should have triggered an API call
      // The second and third should have reused the cached promise
      expect(mockFetchPost).toHaveBeenCalledTimes(1);
      expect(mockFetchPost).toHaveBeenCalledWith('/login/', { method: 'POST' }, loginRequest);
      
      // localStorage should only be called once
      expect(Storage.prototype.setItem).toHaveBeenCalledTimes(1);
    });

    it('should not cache login requests with different credentials', async () => {
      const firstLoginRequest: LoginRequestData = {
        email: 'user1@example.com',
        password: 'password1'
      };
      
      const secondLoginRequest: LoginRequestData = {
        email: 'user2@example.com',
        password: 'password2'
      };
      
      const firstLoginResponse: LoginResponseData = {
        access: 'user1-access-token',
        refresh: 'user1-refresh-token'
      };
      
      const secondLoginResponse: LoginResponseData = {
        access: 'user2-access-token',
        refresh: 'user2-refresh-token'
      };
      
      // Mock slow responses to test concurrent behavior
      mockFetchPost
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve(firstLoginResponse), 50)
          )
        )
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve(secondLoginResponse), 50)
          )
        );
      
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
      
      // Make concurrent calls with different credentials
      const firstCall = service.login(firstLoginRequest);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const secondCall = service.login(secondLoginRequest);
      
      const results = await Promise.all([firstCall, secondCall]);
      
      // Should return different responses for different credentials
      expect(results[0]).toEqual(firstLoginResponse);
      expect(results[1]).toEqual(secondLoginResponse);
      
      // Should make separate API calls for different credentials (no caching)
      expect(mockFetchPost).toHaveBeenCalledTimes(2);
      expect(mockFetchPost).toHaveBeenNthCalledWith(1, '/login/', { method: 'POST' }, firstLoginRequest);
      expect(mockFetchPost).toHaveBeenNthCalledWith(2, '/login/', { method: 'POST' }, secondLoginRequest);
      
      // localStorage should be called twice (once for each user)
      expect(Storage.prototype.setItem).toHaveBeenCalledTimes(2);
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
