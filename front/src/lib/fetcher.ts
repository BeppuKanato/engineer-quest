export type ApiErrorResponse = {
  message: string;
  code: string;
};

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.code = code;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type FetcherOptions = Omit<RequestInit, "headers"> & {
  token?: string;
  headers?: HeadersInit;
};

const getApiBaseUrl = (): string => {
//   const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const baseUrl = "http://localhost:8080/api";
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
    }

    return baseUrl;
};

const parseErrorResponse = async (
  response: Response
): Promise<ApiErrorResponse> => {
  const fallbackError: ApiErrorResponse = {
    message: "API request failed",
    code: "UNKNOWN_ERROR",
  };

  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;

    return {
      message: body.message ?? fallbackError.message,
      code: body.code ?? fallbackError.code,
    };
  } catch {
    return fallbackError;
  }
};

export const fetcher = async <T>(
  path: string,
  options: FetcherOptions = {}
): Promise<T> => {
    const baseUrl = getApiBaseUrl();
    console.log(`${baseUrl}${path}`)
    const { token, headers, ...requestOptions } = options;

    const response = await fetch(`${baseUrl}${path}`, {
        ...requestOptions,
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
        },
        cache: "no-store",
    });

    if (!response.ok) {
        const errorBody = await parseErrorResponse(response);

        throw new ApiError(response.status, errorBody.code, errorBody.message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
};