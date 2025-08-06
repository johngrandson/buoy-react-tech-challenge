import { LoginApiService } from './api';
import { LoginRequestData, LoginResponseData } from './interface';

// Create a type that exposes protected members for testing
type LoginApiServiceWithProtected = LoginApiService & {
  fetchPost: LoginApiService['fetchPost'];
};

describe('LoginApiService', () => {
  let service: LoginApiService;
  let mockFetchPost: jest.Mock;

  beforeEach(() => {
    service = new LoginApiService();
    mockFetchPost = jest.fn();
    
    // Cast to our test type to access protected methods safely
    const serviceWithProtected = service as LoginApiServiceWithProtected;
    jest.spyOn(serviceWithProtected, 'fetchPost').mockImplementation(mockFetchPost);
    
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('should call fetchPost with correct endpoint and credentials', async () => {
      const loginRequest: LoginRequestData = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const expectedResponse: LoginResponseData = {
        access: 'access-token',
        refresh: 'refresh-token'
      };
      
      mockFetchPost.mockResolvedValueOnce(expectedResponse);
      
      const result = await service.login(loginRequest);
      
      expect(mockFetchPost).toHaveBeenCalledWith(
        '/login/',
        { method: 'POST' },
        loginRequest
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});