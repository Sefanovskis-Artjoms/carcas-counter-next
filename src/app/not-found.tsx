import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="text-text-regular">
        The page or batch you requested does not exist.
      </p>
      <div className="flex gap-4">
        <Link href="/" className="btn btn--highlight">
          Back to home
        </Link>
        <Link href="/history" className="btn btn--color-neutral">
          History
        </Link>
      </div>
    </div>
  );
}
