import { PageHeader } from "@/components/term/Primitives";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader command="cat TERMS.md" title="Terms of Service" />
      <div className="space-y-4 leading-7 text-neutral-300">
        <p>
          This site logs search activity so we can understand what courses and professors people are looking for.
        </p>
        <p>
          Logged data can be requested publicly by emailing{" "}
          <a href="mailto:chat.untgrades@gmail.com" className="term-link underline decoration-neutral-600">
            chat.untgrades@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
