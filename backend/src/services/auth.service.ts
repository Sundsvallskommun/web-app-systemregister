import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { JWT_ACCESS_TTL, JWT_REFRESH_TTL, JWT_SECRET } from '@config';
import { HttpException } from '@/exceptions/HttpException';
import { JwtPayload, User, UserRole } from '@/interfaces/user.interface';

interface SeedUser {
  id: string;
  username: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
}

// Seed-data — i prod ska detta lyftas till api-service eller en delad user-tabell.
// Lösenord: Admin123! / Editor123! / Viewer123!
const SEED_USERS: SeedUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'admin',
    email: 'admin@sundsvall.se',
    name: 'Admin',
    passwordHash: bcrypt.hashSync('Admin123!', 10),
    role: 'admin',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    username: 'editor',
    email: 'editor@sundsvall.se',
    name: 'Editor',
    passwordHash: bcrypt.hashSync('Editor123!', 10),
    role: 'editor',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    username: 'viewer',
    email: 'viewer@sundsvall.se',
    name: 'Viewer',
    passwordHash: bcrypt.hashSync('Viewer123!', 10),
    role: 'viewer',
  },
];

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
  expiresIn: number;
  user: User;
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResult> {
    const seed = SEED_USERS.find(u => u.username === username);
    if (!seed) throw new HttpException(401, 'Felaktigt användarnamn eller lösenord');

    const ok = await bcrypt.compare(password, seed.passwordHash);
    if (!ok) throw new HttpException(401, 'Felaktigt användarnamn eller lösenord');

    return this.issueTokens(seed);
  }

  refresh(refreshToken: string): LoginResult {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, JWT_SECRET as string) as JwtPayload;
    } catch {
      throw new HttpException(401, 'Refresh token är ogiltig');
    }
    const seed = SEED_USERS.find(u => u.id === payload.sub);
    if (!seed) throw new HttpException(401, 'Användaren finns inte');
    return this.issueTokens(seed);
  }

  private issueTokens(seed: SeedUser): LoginResult {
    const accessTtl = Number(JWT_ACCESS_TTL ?? 3600);
    const refreshTtl = Number(JWT_REFRESH_TTL ?? 604800);

    const payload: JwtPayload = { sub: seed.id, username: seed.username, role: seed.role };
    const accessOpts: SignOptions = { expiresIn: accessTtl };
    const refreshOpts: SignOptions = { expiresIn: refreshTtl };

    const accessToken = jwt.sign(payload, JWT_SECRET as string, accessOpts);
    const refreshToken = jwt.sign(payload, JWT_SECRET as string, refreshOpts);

    return {
      accessToken,
      refreshToken,
      role: seed.role,
      expiresIn: accessTtl,
      user: { id: seed.id, username: seed.username, email: seed.email, name: seed.name, role: seed.role },
    };
  }
}

export const authService = new AuthService();
export default AuthService;
