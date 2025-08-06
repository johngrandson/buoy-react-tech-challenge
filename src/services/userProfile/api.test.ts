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
      const promises = [
        service.getMyUser(),
        service.getMyUser(),
        service.getMyUser(),
      ];

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
});
