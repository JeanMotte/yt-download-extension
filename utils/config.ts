import { Configuration, ConfigurationParameters, HTTPHeaders } from "../src/api/runtime";
import { getToken } from "./auth";
import { getYoutubeCookiesForYtdlp } from "./cookies";

export const getAuthenticatedHeaders = async (tokenOverride?: string): Promise<HTTPHeaders> => {
  const token = tokenOverride ?? await getToken(); // Use override if provided
  if (!token) {
    throw new Error("Authentication token not found.");
  }

  // Get and Base64-encode the user's YouTube cookies.
  const youtubeCookies = await getYoutubeCookiesForYtdlp();
  const encodedCookies = btoa(youtubeCookies);

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    // This is the custom header your FastAPI backend expects.
    'X-Youtube-Cookies': encodedCookies,
  };
};

export const getApiConfig = async (isAuthenticated: boolean = true, tokenOverride?: string): Promise<Configuration> => {
  const configParams: ConfigurationParameters = {
    basePath: import.meta.env.WXT_API_BASE_URL || 'http://localhost:8000',
  };

  if (isAuthenticated) {
    // Pass the tokenOverride to the headers function
    configParams.headers = await getAuthenticatedHeaders(tokenOverride);
  }
  
  return new Configuration(configParams);
};

export const baseUrl = import.meta.env.WXT_API_BASE_URL || 'http://localhost:8000';