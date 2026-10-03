import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-neutral-500">
        <span className="text-term-accent">$</span> cd ./this-page
      </p>
      <p className="mt-1 text-red-400">bash: cd: ./this-page: No such file or directory</p>
      <p className="mt-1 text-neutral-500">exit 404</p>
      <Link href="/" className="term-btn mt-6">back home</Link>
    </div>
  );
}
