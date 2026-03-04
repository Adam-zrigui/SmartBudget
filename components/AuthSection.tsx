'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';

export default function AuthSection() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="w-8 h-8"></div>; // placeholder
  }

  if (!user) {
    return (
      <Link href="/auth/signin" className="btn btn-ghost btn-sm">
        Sign In
      </Link>
    );
  }

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle avatar p-0">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <img src={user.photoURL || '/avatar.png'} alt="User" loading="lazy" className="object-cover w-full h-full" />
        </div>
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-4">
        <li>
          <Link href="/profile">Profile</Link>
        </li>
        <li>
          <button onClick={() => signOut()} className="w-full text-left">
            Sign Out
          </button>
        </li>
      </ul>
    </div>
  );
}
