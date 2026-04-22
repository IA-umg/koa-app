import axios, { AxiosResponse, AxiosRequestConfig, AxiosError } from "axios";
import { API_BASE_URL } from "../env/env";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiResponse<T> {
  data: T | null;
  status: number;
  ok: boolean;
  error?: string;
}

const handleRequest = async <T>(
  request: Promise<AxiosResponse<T>>
): Promise<ApiResponse<T>> => {
  try {
    const response = await request;
    return {
      data: response.data,
      status: response.status,
      ok: true,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<T>;
      return {
        data: axiosError.response?.data ?? null,
        status: axiosError.response?.status ?? 500,
        ok: false,
        error: axiosError.response?.data
          ? JSON.stringify(axiosError.response.data)
          : axiosError.message,
      };
    }

    return {
      data: null,
      status: 500,
      ok: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

const createRequestConfig = (token?: string): AxiosRequestConfig => {
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const get = <T>(url: string, token?: string) =>
  handleRequest<T>(api.get<T>(url, createRequestConfig(token)));

export const post = <T>(url: string, data: unknown, token?: string) =>
  handleRequest<T>(api.post<T>(url, data, createRequestConfig(token)));

export const put = <T>(url: string, data: unknown, token?: string) =>
  handleRequest<T>(api.put<T>(url, data, createRequestConfig(token)));

export const patch = <T>(url: string, data: unknown, token?: string) =>
  handleRequest<T>(api.patch<T>(url, data, createRequestConfig(token)));

export const remove = <T>(url: string, token?: string) =>
  handleRequest<T>(api.delete<T>(url, createRequestConfig(token)));