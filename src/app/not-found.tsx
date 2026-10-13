import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-sm text-slate-500">The page you are looking for does not exist.</p>
      <Link href="/" className="inline-block text-sm font-medium text-slate-900 underline">
        Back to dashboard
      </Link>
    </div>
  );
}