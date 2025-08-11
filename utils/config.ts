import { Configuration, ConfigurationParameters } from "../src/api/runtime";
import { getToken } from "./auth";

export const getApiConfig = async (tokenOverride?: string): Promise<Configuration> => {
  // Use the provided token if it exists, otherwise try to get it from storage.
  const appToken = tokenOverride ?? await getToken();

  const configParams: ConfigurationParameters = {
    basePath: import.meta.env.WXT_API_BASE_URL || 'http://localhost:8000',
    accessToken: appToken || undefined,
  };
  return new Configuration(configParams);
};