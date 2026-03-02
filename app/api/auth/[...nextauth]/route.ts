import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

// wrap the default handler to silence sporadic JSON.parse errors seen only on
// Vercel when a form-encoded payload (redirect=false&...) is mistakenly
// parsed as JSON by an internal step.  The error does not affect functionality
// but floods logs.
const nextAuthHandler = NextAuth(authOptions);

const handler = async (req: Request, res: Response) => {
  try {
    return await nextAuthHandler(req, res);
  } catch (err: any) {
    // swallow only the specific parse error we're seeing
    if (err instanceof SyntaxError && /redirect=f/.test(err.message)) {
      console.warn('Ignored JSON parse error in NextAuth:', err.message);
      // return a generic response so callers aren't left hanging
      return new Response(null, { status: 200 });
    }
    throw err;
  }
};

export { handler as GET, handler as POST };
