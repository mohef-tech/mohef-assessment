export interface AccessTokenPayload {
  sub: string;
  role: string;
  exp: number;
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded as AccessTokenPayload;
  } catch {
    return null;
  }
}
