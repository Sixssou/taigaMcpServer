import axios, { AxiosInstance } from 'axios';
import type { TaigaConfig, AuthResponse } from '../types/index.js';
import { ERROR_MESSAGES } from '../constants.js';

/**
 * Taiga Authentication Manager
 * Handles authentication and token management for Taiga API
 */
export class TaigaAuth {
  private apiUrl: string;
  private authToken: string | null = null;
  private tokenExpiration: number | null = null;
  private username?: string;
  private password?: string;

  constructor(config: TaigaConfig) {
    this.apiUrl = config.apiUrl;
    this.username = config.username;
    this.password = config.password;

    if (config.authToken) {
      this.authToken = config.authToken;
      // Set token expiration to 24 hours from now
      this.tokenExpiration = Date.now() + 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Authenticate with Taiga API and get an auth token
   * @param username - Taiga username or email
   * @param password - Taiga password
   * @returns Auth token
   */
  async authenticate(username?: string, password?: string): Promise<string> {
    const user = username || this.username;
    const pass = password || this.password;

    if (!user || !pass) {
      throw new Error('Username and password are required for authentication');
    }

    try {
      const response = await axios.post<AuthResponse>(`${this.apiUrl}/auth`, {
        type: 'normal',
        username: user,
        password: pass,
      });

      this.authToken = response.data.auth_token;
      // Set token expiration to 24 hours from now
      this.tokenExpiration = Date.now() + 24 * 60 * 60 * 1000;

      // Store credentials for auto-refresh
      this.username = user;
      this.password = pass;

      return this.authToken;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error(ERROR_MESSAGES.AUTHENTICATION_FAILED);
    }
  }

  /**
   * Get the current auth token, refreshing if necessary
   * @returns Auth token
   */
  async getAuthToken(): Promise<string> {
    // If token doesn't exist or is expired, authenticate again
    if (!this.authToken || (this.tokenExpiration && Date.now() > this.tokenExpiration)) {
      await this.authenticate();
    }

    if (!this.authToken) {
      throw new Error(ERROR_MESSAGES.AUTHENTICATION_FAILED);
    }

    return this.authToken;
  }

  /**
   * Create an axios instance with auth headers
   * @returns Axios instance with auth headers
   */
  async createAuthenticatedClient(): Promise<AxiosInstance> {
    const token = await this.getAuthToken();

    return axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if user is authenticated
   * @returns Whether user has valid authentication
   */
  isAuthenticated(): boolean {
    return !!(this.authToken && this.tokenExpiration && Date.now() < this.tokenExpiration);
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.authToken = null;
    this.tokenExpiration = null;
  }

  /**
   * Set credentials for authentication
   */
  setCredentials(username: string, password: string): void {
    this.username = username;
    this.password = password;
  }
}
