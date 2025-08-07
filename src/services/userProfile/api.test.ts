import { UserProfileApiService } from "./api";
import { UserProfileData } from "./interface";

// Create a type that exposes protected members for testing
type UserProfileApiServiceWithProtected = UserProfileApiService & {
  get: UserProfileApiService["get"];
};

describe("UserProfileApiService", () => {
  let service: UserProfileApiService;
  let mockGet: jest.Mock;

  beforeEach(() => {
    // Reset singleton before each test
    UserProfileApiService.resetInstance();
    service = UserProfileApiService.getInstance();
    mockGet = jest.fn();

    // Cast to our test type to access protected methods safely
    const serviceWithProtected = service as UserProfileApiServiceWithProtected;
    jest.spyOn(serviceWithProtected, "get").mockImplementation(mockGet);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up singleton after each test
    UserProfileApiService.resetInstance();
  });

  describe("getMyUser", () => {
    it("should fetch current user profile", async () => {
      const expectedUserData: UserProfileData = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        first_name: "John",
        last_name: "Doe",
      };

      mockGet.mockResolvedValueOnce(expectedUserData);

      const result = await service.getMyUser();

      expect(mockGet).toHaveBeenCalledWith("/users/me/");
      expect(result).toEqual(expectedUserData);
    });

    it("should prevent duplicate /me requests on dashboard refresh", async () => {
      // Real scenario: Dashboard refreshes and multiple components need user data
      const userData: UserProfileData = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
      };

      // Mock realistic API delay
      mockGet.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(userData), 100))
      );

      // Simulate React StrictMode + multiple components needing user data
      const promises = [
        service.getMyUser(), // Header component
        service.getMyUser(), // Profile dropdown
        service.getMyUser(), // Dashboard welcome message
        service.getMyUser(), // User settings check
      ];

      const results = await Promise.all(promises);

      // All should get the same user data
      results.forEach(result => {
        expect(result).toEqual(userData);
      });

      // CRITICAL: Only ONE actual API call despite multiple component calls
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith("/users/me/");
    });

    it("should cache user data to prevent unnecessary API calls", async () => {
      // Real scenario: User navigates between pages, components remount
      const userData: UserProfileData = {
        id: 1,
        name: "Cached User",
        email: "cached@example.com",
      };

      mockGet.mockResolvedValueOnce(userData);

      // First page load
      const firstResult = await service.getMyUser();
      expect(firstResult).toEqual(userData);
      expect(mockGet).toHaveBeenCalledTimes(1);

      // User navigates to another page, component remounts
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second page load - should use cached data
      const secondResult = await service.getMyUser();
      expect(secondResult).toEqual(userData);

      // Still only 1 API call - cache prevents redundant requests
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    it("should handle API errors gracefully", async () => {
      const error = new Error("Unauthorized");
      mockGet.mockRejectedValueOnce(error);

      await expect(service.getMyUser()).rejects.toThrow("Unauthorized");
      expect(mockGet).toHaveBeenCalledTimes(1);
    });
  });
});
