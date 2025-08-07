import { User, UsersResponse, UsersParams } from "./interface";

class UsersApiService {
  private baseURL = "https://dummyjson.com";

  protected async fetchGet<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  public async getAll(params?: UsersParams): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.skip) {
      searchParams.append('skip', params.skip.toString());
    }
    if (params?.q) {
      searchParams.append('q', params.q);
    }
    if (params?.select) {
      searchParams.append('select', params.select);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/users?${queryString}` : '/users';
    
    return this.fetchGet<UsersResponse>(endpoint);
  }

  public async getById(id: number): Promise<User> {
    return this.fetchGet<User>(`/users/${id}`);
  }

  public async search(query: string, params?: Omit<UsersParams, 'q'>): Promise<UsersResponse> {
    const searchParams = new URLSearchParams({ q: query });
    
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.skip) {
      searchParams.append('skip', params.skip.toString());
    }
    if (params?.select) {
      searchParams.append('select', params.select);
    }

    return this.fetchGet<UsersResponse>(`/users/search?${searchParams.toString()}`);
  }
}

const usersApiService = new UsersApiService();
export default usersApiService;