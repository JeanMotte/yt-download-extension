import { getToken } from '../../utils/auth';
import { Configuration, type ConfigurationParameters } from './runtime';

export const getApiConfig = async (): Promise<Configuration> => {
  // Get OUR application's JWT from storage
  const appToken = await getToken(); 

  const config: ConfigurationParameters = {
    basePath: import.meta.env.WXT_API_BASE_URL || 'http://localhost:8000',
    // The accessToken for the API client is our own JWT, not the Google one.
    accessToken: appToken || undefined,
  };
  return new Configuration(config);
};