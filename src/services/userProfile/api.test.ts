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
    service = new UserProfileApiService();
    mockGet = jest.fn();

    // Cast to our test type to access protected methods safely
    const serviceWithProtected = service as UserProfileApiServiceWithProtected;
    jest.spyOn(serviceWithProtected, "get").mockImplementation(mockGet);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getMyUser", () => {
    it("should call get with correct endpoint", async () => {
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

    it("should only make one request when called multiple times simultaneously", async () => {
      const userData: UserProfileData = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      };

      mockGet.mockResolvedValueOnce(userData);

      // Call getMyUser multiple times simultaneously
      const promises = [service.getMyUser(), service.getMyUser(), service.getMyUser()];

      const results = await Promise.all(promises);

      // All calls should return the same user data
      expect(results[0]).toEqual(userData);
      expect(results[1]).toEqual(userData);
      expect(results[2]).toEqual(userData);

      // But get should only be called once
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith("/users/me/");
    });
  });

  it("should handle multiple service instances with independent promise caching", async () => {
    // Create two separate service instances
    const service1 = new UserProfileApiService();
    const service2 = new UserProfileApiService();

    // Mock get for both services
    const mockGet1 = jest.fn();
    const mockGet2 = jest.fn();

    const serviceWithProtected1 = service1 as UserProfileApiServiceWithProtected;
    const serviceWithProtected2 = service2 as UserProfileApiServiceWithProtected;

    jest.spyOn(serviceWithProtected1, "get").mockImplementation(mockGet1);
    jest.spyOn(serviceWithProtected2, "get").mockImplementation(mockGet2);

    // Different user data for each service
    const userData1: UserProfileData = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    };

    const userData2: UserProfileData = {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
    };

    // Mock responses
    mockGet1.mockResolvedValueOnce(userData1);
    mockGet2.mockResolvedValueOnce(userData2);

    // Call getMyUser for both services simultaneously
    const promises = [
      service1.getMyUser(),
      service1.getMyUser(), // Should reuse service1's promise
      service2.getMyUser(),
      service2.getMyUser(), // Should reuse service2's promise
    ];

    const results = await Promise.all(promises);

    // Service1 calls should return service1's user data
    expect(results[0]).toEqual(userData1);
    expect(results[1]).toEqual(userData1);

    // Service2 calls should return service2's user data
    expect(results[2]).toEqual(userData2);
    expect(results[3]).toEqual(userData2);

    // Each service should only make one get call
    expect(mockGet1).toHaveBeenCalledTimes(1);
    expect(mockGet1).toHaveBeenCalledWith("/users/me/");

    expect(mockGet2).toHaveBeenCalledTimes(1);
    expect(mockGet2).toHaveBeenCalledWith("/users/me/");
  });

  it("should handle errors properly and clear promise cache", async () => {
    const error = new Error("Network error");
    mockGet.mockRejectedValueOnce(error);

    // First call should fail
    await expect(service.getMyUser()).rejects.toThrow("Network error");

    // Second call should make a new request (promise cache cleared after error)
    const userData: UserProfileData = { id: 1, name: "John Doe" };
    mockGet.mockResolvedValueOnce(userData);

    const result = await service.getMyUser();

    expect(result).toEqual(userData);
    expect(mockGet).toHaveBeenCalledTimes(2); // One failed, one successful
  });
});
