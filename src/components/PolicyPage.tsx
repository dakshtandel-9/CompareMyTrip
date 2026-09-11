import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BUSINESS_DETAILS, LEGAL_POLICIES, LEGAL_POLICIES_APPROVED } from "@/lib/legalPolicies";

export default function PolicyPage({ policy }: { policy: keyof typeof LEGAL_POLICIES }) {
  const document = LEGAL_POLICIES[policy];
  return <>
    <Header />
    <main className="bg-cmt-neutral-50 px-4 py-12 font-body text-cmt-neutral-900 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-cmt-lg border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-10">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">{document.title}</h1>
        <p className="mt-3 text-sm text-cmt-neutral-600">CompareMyTrip · comparemytrip.in</p>
        {!LEGAL_POLICIES_APPROVED && <p className="mt-5 rounded-cmt-md bg-amber-50 p-4 text-sm leading-6 text-amber-950">Draft for review. These policies are awaiting verified business details and approval. Live bookings are not available.</p>}
        {document.sections.map(([heading, body]) => <section key={heading} className="mt-8">
          <h2 className="font-display text-xl font-semibold">{heading}</h2>
          <p className="mt-3 text-base leading-7 text-cmt-neutral-700">{body}</p>
        </section>)}
        <section className="mt-8 border-t border-cmt-neutral-200 pt-6">
          <h2 className="font-display text-xl font-semibold">Contact CompareMyTrip</h2>
          {BUSINESS_DETAILS.legalName && <p className="mt-3">{BUSINESS_DETAILS.legalName}</p>}
          {BUSINESS_DETAILS.address && <p className="mt-2 whitespace-pre-line">{BUSINESS_DETAILS.address}</p>}
          {BUSINESS_DETAILS.supportEmail && <p className="mt-2"><a href={`mailto:${BUSINESS_DETAILS.supportEmail}`}>{BUSINESS_DETAILS.supportEmail}</a></p>}
          {BUSINESS_DETAILS.supportPhone && <p className="mt-2">{BUSINESS_DETAILS.supportPhone}</p>}
          <Link className="mt-4 inline-flex min-h-11 items-center font-semibold underline" href="/contact">Contact the travel desk</Link>
        </section>
      </article>
    </main>
    <Footer />
  </>;
}
