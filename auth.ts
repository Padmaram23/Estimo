import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import pool from "@/lib/db";
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from "next-auth/adapters";

/* ─── minimal PostgreSQL adapter ───────────────────────────── */
function PgAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const { rows } = await pool.query(
        `INSERT INTO users (email, name, image) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image
         RETURNING id, email, name, image`,
        [user.email, user.name ?? null, user.image ?? null]
      );
      return { ...rows[0], emailVerified: null };
    },
    async getUser(id: string) {
      const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
      return rows[0] ? { ...rows[0], emailVerified: null } : null;
    },
    async getUserByEmail(email: string) {
      const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
      return rows[0] ? { ...rows[0], emailVerified: null } : null;
    },
    async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string }) {
      const { rows } = await pool.query(
        `SELECT u.* FROM users u
         JOIN accounts a ON a.user_id = u.id
         WHERE a.provider = $1 AND a.provider_account_id = $2`,
        [provider, providerAccountId]
      );
      return rows[0] ? { ...rows[0], emailVerified: null } : null;
    },
    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      const { rows } = await pool.query(
        `UPDATE users SET name = COALESCE($1, name), image = COALESCE($2, image)
         WHERE id = $3 RETURNING *`,
        [user.name ?? null, user.image ?? null, user.id]
      );
      return { ...rows[0], emailVerified: null };
    },
    async linkAccount(account: AdapterAccount) {
      await pool.query(
        `INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (provider, provider_account_id) DO NOTHING`,
        [account.userId, account.type, account.provider, account.providerAccountId,
         account.refresh_token ?? null, account.access_token ?? null, account.expires_at ?? null,
         account.token_type ?? null, account.scope ?? null, account.id_token ?? null, account.session_state ?? null]
      );
      return account;
    },
    async createSession(session: { sessionToken: string; userId: string; expires: Date }) {
      const { rows } = await pool.query(
        `INSERT INTO sessions (session_token, user_id, expires) VALUES ($1,$2,$3) RETURNING *`,
        [session.sessionToken, session.userId, session.expires]
      );
      return { sessionToken: rows[0].session_token, userId: String(rows[0].user_id), expires: rows[0].expires };
    },
    async getSessionAndUser(sessionToken: string) {
      const { rows } = await pool.query(
        `SELECT s.session_token, s.user_id, s.expires,
                u.id as uid, u.email, u.name, u.image
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.session_token = $1 AND s.expires > NOW()`,
        [sessionToken]
      );
      if (!rows[0]) return null;
      const r = rows[0];
      return {
        session: { sessionToken: r.session_token, userId: String(r.user_id), expires: r.expires },
        user: { id: String(r.uid), email: r.email, name: r.name, image: r.image, emailVerified: null },
      };
    },
    async updateSession(session: Partial<AdapterSession> & { sessionToken: string }) {
      const { rows } = await pool.query(
        `UPDATE sessions SET expires = COALESCE($1, expires) WHERE session_token = $2 RETURNING *`,
        [session.expires ?? null, session.sessionToken]
      );
      if (!rows[0]) return null;
      return { sessionToken: rows[0].session_token, userId: String(rows[0].user_id), expires: rows[0].expires };
    },
    async deleteSession(sessionToken: string) {
      await pool.query(`DELETE FROM sessions WHERE session_token = $1`, [sessionToken]);
    },
    async createVerificationToken(token: VerificationToken) {
      const { rows } = await pool.query(
        `INSERT INTO verification_tokens (identifier, token, expires) VALUES ($1,$2,$3) RETURNING *`,
        [token.identifier, token.token, token.expires]
      );
      return rows[0];
    },
    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const { rows } = await pool.query(
        `DELETE FROM verification_tokens WHERE identifier = $1 AND token = $2 RETURNING *`,
        [identifier, token]
      );
      return rows[0] ?? null;
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PgAdapter(),
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
