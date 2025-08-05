/// <reference types="wxt/client" />

import { Configuration, type ConfigurationParameters } from './runtime';

const getAccessToken = async () => {
  const token = await browser.identity.getAuthToken({ interactive: false });
  return token ?? '';
};

export const getApiConfig = async (): Promise<Configuration> => {
  const accessToken = await getAccessToken();
  const config: ConfigurationParameters = {
    basePath: import.meta.env.WXT_API_BASE_URL || 'http://localhost:8000',
    accessToken,
    // baseOptions: {
    //   headers: {
    //     'X-Requested-With': 'XMLHttpRequest',
    //   },
    // },
  };
  return new Configuration(config);
};
