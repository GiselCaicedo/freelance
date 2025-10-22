import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function verifyToken<T = any>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    console.log('Payload', payload);
    return payload as T;
  } catch {
    return null;
  }
}
