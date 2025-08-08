import { browser } from 'wxt/browser';

const TOKEN_KEY = 'app_jwt_token';

export const saveToken = async (token: string): Promise<void> => {
  await browser.storage.local.set({ [TOKEN_KEY]: token });
};

export const getToken = async (): Promise<string | null> => {
  const result = await browser.storage.local.get(TOKEN_KEY);
  return result[TOKEN_KEY] || null;
};

export const removeToken = async (): Promise<void> => {
  await browser.storage.local.remove(TOKEN_KEY);
};