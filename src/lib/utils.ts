import axios, { AxiosBasicCredentials, AxiosResponse } from 'axios';
import * as https from 'https';

const HTTP_TIMEOUT = 500;

axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });

export class Utils {

  static _get<T = any>(
    url: string,
    timeout?: number,
    headers: { [key: string]: string | number } = {},
    auth?: AxiosBasicCredentials,
  ) {
    return Utils._axios<T>(url, 'get', null, timeout, headers, auth);
  }

  static _post<T = any>(
    url: string,
    data?: any,
    timeout?: number,
    headers: { [key: string]: string | number } = {},
    auth?: AxiosBasicCredentials,
  ) {
    return Utils._axios<T>(url, 'post', data, timeout, headers, auth);
  }

  static _axios<T = any>(
    url: string,
    method: 'get' | 'post',
    data?: any,
    timeout: number = HTTP_TIMEOUT,
    headers: { [key: string]: string | number } = {},
    auth?: AxiosBasicCredentials,
  ): Promise<AxiosResponse<T>> {
    return axios({
      method,
      url,
      data,
      timeout,
      headers: {
        'User-Agent': 'node.js',
        ...headers,
      },
      auth,
    });
  }
}

export const sortTokens = (tokenA: string, tokenB: string): [string, string] =>
  [tokenA.toLowerCase(), tokenB.toLowerCase()].sort((a, b) =>
    a > b ? 1 : -1,
  ) as [string, string];
