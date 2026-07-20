interface FBInitParams {
  appId: string;
  cookie: boolean;
  xfbml: boolean;
  version: string;
}

interface FBLoginResponse {
  authResponse?: {
    accessToken: string;
    expiresIn: number;
    signedRequest: string;
    userID: string;
  };
  status: string;
}

interface Window {
  FB: {
    init: (params: FBInitParams) => void;
    login: (
      callback: (response: FBLoginResponse) => void,
      options?: {
        scope?: string;
        config_id?: string;
        response_type?: string;
        override_default_response_type?: boolean;
        extras?: Record<string, unknown>;
      },
    ) => void;
  };
  fbAsyncInit: () => void;
}
