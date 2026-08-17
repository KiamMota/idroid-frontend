import ENDPOINTS from "../endpoints.js";
import { HttpClient } from "../http.js";
import { LoginRequest } from "../models/LoginModel.js";

class AuthServiceClass extends HttpClient {
  /**
   * Realiza login
   * @param {string} email
   * @param {string} senha
   * @returns {Promise<{success: boolean, data: string, message: string}>}
   */
  async login(email, senha) {
    const model = new LoginRequest({ email, senha });
    const response = await this.post(ENDPOINTS.AUTH.LOGIN, model);

    // Verifique se o response.data possui a propriedade .token
    if (response.success && response.data) {
      // Se response.data for o LoginResponse do Go, acesse response.data.token
      const token = response.data.token || response.data; 
      this.setToken(token);
    }

    return response;
  }

  /**
   * Faz logout
   */
  logout() {
    this.clearToken();
    // Toast de logout fica a cargo da página (evita duplicata)
  }

  /**
   * Valida senha administrativa (OpenAPI: POST /users/elevate)
   * @param {string} senha
   * @returns {Promise<{success: boolean, data: null, message: string}>}
   */
  async elevate(senha) {
    return this.post(ENDPOINTS.USERS.ELEVATE, { senha });
  }
}

/** Singleton */
export const AuthService = new AuthServiceClass();
export default AuthService;
