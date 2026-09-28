import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EnquiryForm from "@/app/contact/EnquiryForm";
import SupportPhones from "@/components/SupportPhones";
import { createPageMetadata } from "@/lib/seo";
export const metadata = createPageMetadata({ title: "Corporate & Group Trips from Bengaluru", description: "Request a tailored quote for a Bengaluru team outing, college trip or friends' getaway. Share your dates, group size, budget and transport requirements.", path: "/corporate-group-trips" });
export default function CorporateTrips() {
  return <><Header /><main>
    <section className="bg-cmt-secondary-900 px-5 py-16 text-white sm:py-24"><div className="mx-auto max-w-7xl"><p className="font-semibold text-cmt-primary-400">Bengaluru teams, friends & college groups</p><h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold sm:text-5xl">A trip that works for your whole group.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">Tell us what you have in mind: a team outing, an outdoor adventure or a longer holiday. Our travel desk will check options against your dates, budget and group requirements.</p><a href="#group-enquiry" className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-cmt-primary-500 px-6 font-semibold text-cmt-neutral-900">Get a group quote</a></div></section>
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-12 md:grid-cols-3">{[
      ["Team outings", "Share your preferred travel time, activity level and any meeting or team-activity requirements. We will confirm what is available in your quote."],
      ["Friends & college groups", "Tell us your exact group size, room-sharing preferences and budget. Ask about private transport or joining a scheduled group."],
      ["A clear proposal", "Review the proposed itinerary, vehicle, stay, meals, total price and cancellation terms before agreeing to the trip. Capacity and special arrangements need confirmation."],
    ].map(([title, body]) => <article key={title} className="rounded-2xl border border-cmt-neutral-200 p-6"><h2 className="font-display text-2xl font-semibold">{title}</h2><p className="mt-3 leading-7 text-cmt-neutral-600">{body}</p></article>)}</section>
    <section id="group-enquiry" className="bg-cmt-neutral-50 px-5 py-12"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[2fr_1fr]"><div className="rounded-2xl border border-cmt-neutral-200 bg-white p-6 sm:p-8"><h2 className="font-display text-3xl font-semibold">Plan your group trip</h2><p className="mb-7 mt-3 text-cmt-neutral-600">Share the basics. We will check suitable options with you.</p><EnquiryForm initialAudience="corporate" /></div><aside><h2 className="font-display text-2xl font-semibold">What to include</h2><ul className="mt-5 list-disc space-y-3 pl-5 leading-7 text-cmt-neutral-600"><li>Dates and flexibility</li><li>Exact group size and departure city</li><li>Budget per person and preferred duration</li><li>Pickup, transport and accommodation needs</li><li>Dietary, accessibility or invoice requirements</li></ul><div className="mt-8"><SupportPhones /></div></aside></div></section>
  </main><Footer /></>;
}
