import { LoginService, LoginRequestData, LoginResponseData } from "./interface";

const ONE_MINUTE_IN_SECONDS = 60;

export class LoginApiService extends LoginService {
  // Singleton instance to ensure consistent promise caching across the application
  private static instance: LoginApiService | null = null;

  // Promise cache to prevent concurrent duplicate requests
  private requestCache: Map<string, Promise<any>> = new Map();

  /**
   * Gets the singleton instance of LoginApiService
   * This ensures promise caching works consistently across all API calls
   */
  public static getInstance(): LoginApiService {
    if (!LoginApiService.instance) {
      LoginApiService.instance = new LoginApiService();
    }
    return LoginApiService.instance;
  }

  /**
   * Resets the singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    LoginApiService.instance = null;
  }

  /**
   * Authenticates a user with email and password
   * Prevents concurrent requests using promise caching with credential-based keys
   * @param payload - The login credentials
   * @returns The authentication tokens (access and refresh)
   */
  public async login(payload: LoginRequestData): Promise<LoginResponseData> {
    // Create cache key based on credentials to prevent duplicate requests
    const cacheKey = this.createCacheKey("login", payload);

    // Check if request is already in progress
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey);
    }

    // Create and cache the request promise
    const requestPromise = this.doLogin(payload);
    this.requestCache.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up cache after completion
      this.requestCache.delete(cacheKey);
    }
  }

  /**
   * Performs the actual login operation
   * @param payload - The login credentials
   * @returns The authentication tokens
   */
  private async doLogin(payload: LoginRequestData): Promise<LoginResponseData> {
    const response: LoginResponseData = await this.fetchPost(
      "/login/",
      { method: "POST" },
      payload
    );

    this.storeInLocalStorage(response);

    return response;
  }

  /**
   * Logs out the user by clearing stored tokens
   */
  public logout(): void {
    this.removeFromLocalStorage();
  }

  /**
   * Retrieves the current stored token without validation
   * @returns The stored token or null if not found
   */
  public async getCurrentToken(): Promise<LoginResponseData | null> {
    return this.retrieveFromLocalStorage();
  }

  /**
   * Gets a valid token, refreshing if necessary
   * Prevents concurrent refresh requests using promise caching
   * @returns A valid token or null if unable to obtain one
   */
  public async getValidToken(): Promise<LoginResponseData | null> {
    const token = await this.getCurrentToken();
    if (!token || !token.access || !token.refresh) {
      this.logout();
      return null;
    }

    try {
      const parsedToken = this.parseJwt(token?.access);
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime >= parsedToken.exp - ONE_MINUTE_IN_SECONDS) {
        // Create cache key for refresh request
        const cacheKey = this.createCacheKey("refresh", { refreshToken: token.refresh });

        // Check if refresh is already in progress
        if (this.requestCache.has(cacheKey)) {
          return this.requestCache.get(cacheKey);
        }

        // Create the refresh promise and cache it
        const requestPromise = this.doRefresh(token.refresh);
        this.requestCache.set(cacheKey, requestPromise);

        // Don't auto-cleanup - let natural cache invalidation handle it
        // The cache will be cleared when a new token is needed or on logout
        return requestPromise;
      }
      return token;
    } catch (e) {
      console.log(e);
      this.logout();
      return null;
    }
  }

  /**
   * Performs the token refresh operation
   * @param refreshToken - The refresh token to use
   * @returns The new token or null if refresh fails
   */
  private async doRefresh(refreshToken: string): Promise<LoginResponseData | null> {
    try {
      const response: LoginResponseData = await this.fetchPost(
        "/refresh/",
        { method: "POST" },
        { refresh: refreshToken }
      );
      this.storeInLocalStorage(response);
      return response;
    } catch (error) {
      // If refresh fails, logout and return null
      this.logout();
      return null;
    }
  }

  private createCacheKey(method: string, params?: any): string {
    return `${method}:${JSON.stringify(params || {})}`;
  }

  private loginDataKey = "loginData";

  private storeInLocalStorage = (payload: LoginResponseData) => {
    localStorage.setItem(this.loginDataKey, JSON.stringify(payload));
  };

  private retrieveFromLocalStorage = (): LoginResponseData | null => {
    try {
      const serializedLoginData = localStorage.getItem(this.loginDataKey);
      if (!serializedLoginData) {
        throw new Error("Not logged in");
      }
      return JSON.parse(serializedLoginData);
    } catch {
      return null;
    }
  };

  private removeFromLocalStorage = (): void => {
    localStorage.removeItem(this.loginDataKey);
  };

  // https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
  private parseJwt(token: string) {
    var base64Url = token.split(".")[1];
    var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    var jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  }
}
