import { LoginService, LoginRequestData, LoginResponseData } from "./interface";

const ONE_MINUTE_IN_SECONDS = 60;

export class LoginApiService extends LoginService {
  // Stores the refresh promise to prevent concurrent refresh requests
  private refreshPromise: Promise<LoginResponseData | null> | null = null;
  // Stores the login promise to prevent concurrent login requests
  private loginPromise: Promise<LoginResponseData> | null = null;
  // Stores the current credentials key to ensure safe caching
  private currentCredentialsKey: string | null = null;

  /**
   * Authenticates a user with email and password
   * Prevents concurrent requests using promise caching with credential-based keys
   * @param payload - The login credentials
   * @returns The authentication tokens (access and refresh)
   */
  public async login(payload: LoginRequestData): Promise<LoginResponseData> {
    // Create a unique key based on credentials for safe caching
    const credentialsKey = `${payload.email}:${payload.password}`;

    // If a login request with the same credentials is already in progress, return the same promise
    if (this.loginPromise && this.currentCredentialsKey === credentialsKey) {
      return this.loginPromise;
    }

    // Clear any existing promise for different credentials
    this.loginPromise = null;
    this.currentCredentialsKey = credentialsKey;

    // Create and store the login promise
    this.loginPromise = this.doLogin(payload);

    try {
      // Wait for the login to complete
      const result = await this.loginPromise;
      return result;
    } finally {
      // Clear the promise after completion (success or failure)
      this.loginPromise = null;
      this.currentCredentialsKey = null;
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
        // If a refresh is already in progress, return the same promise
        if (this.refreshPromise) {
          return this.refreshPromise;
        }

        // Create and store the refresh promise
        this.refreshPromise = this.doRefresh(token.refresh);

        try {
          // Wait for the refresh to complete
          const result = await this.refreshPromise;
          return result;
        } finally {
          // Clear the promise after completion (success or failure)
          this.refreshPromise = null;
        }
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
