import { Fragment } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LEGAL_POLICIES_APPROVED } from "@/lib/legalPolicies";
import { LEGAL_DOCUMENTS } from "@/lib/legalDocuments";

/* Renders the document's own line breaks, and its **bold** spans as <strong>. */
function Rich({ text }: { text: string }) {
  return text.split("\n").map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 && <br />}
      {line.split(/\*\*(.+?)\*\*/).map((part, index) => (index % 2 ? <strong key={index} className="font-semibold text-cmt-neutral-900">{part}</strong> : part))}
    </Fragment>
  ));
}

export default function PolicyPage({ policy }: { policy: keyof typeof LEGAL_DOCUMENTS }) {
  const document = LEGAL_DOCUMENTS[policy];
  return <>
    <Header />
    <main className="cmt-policy bg-cmt-neutral-50 px-4 py-12 font-body text-cmt-neutral-900 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-cmt-lg border border-cmt-neutral-200 bg-white p-6 shadow-cmt-sm sm:p-10">
        {document.eyebrow && <p className="text-sm font-semibold tracking-wide text-cmt-neutral-600">{document.eyebrow}</p>}
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{document.title}</h1>
        {document.subtitle && <p className="mt-2 font-display text-xl font-semibold text-cmt-neutral-700">{document.subtitle}</p>}
        {!LEGAL_POLICIES_APPROVED && <p className="mt-5 rounded-cmt-md bg-amber-50 p-4 text-sm leading-6 text-amber-950">Draft for review. These policies are awaiting verified business details and approval. Live bookings are not available.</p>}
        <div className="mt-6 text-base leading-7 text-cmt-neutral-700">
          {document.blocks.map((block, index) => {
            switch (block.t) {
              case "h":
                if (block.level === 2) return <h2 key={index} className="mt-10 font-display text-xl font-semibold text-cmt-neutral-900">{block.text}</h2>;
                if (block.level === 3) return <h3 key={index} className="mt-6 font-display text-lg font-semibold text-cmt-neutral-900">{block.text}</h3>;
                return <h4 key={index} className="mt-5 font-semibold text-cmt-neutral-900">{block.text}</h4>;
              case "p":
                return <p key={index} className="mt-3"><Rich text={block.text} /></p>;
              case "ul":
              case "ol": {
                const List = block.t;
                return <List key={index} className={`mt-3 space-y-1 pl-6 ${block.t === "ol" ? "list-decimal" : "list-disc"}`}>
                  {block.items.map((item, itemIndex) => <li key={itemIndex}><Rich text={item} /></li>)}
                </List>;
              }
              case "table": {
                const [head, ...rows] = block.rows;
                return <div key={index} className="mt-4 overflow-x-auto rounded-cmt-md border border-cmt-neutral-200">
                  <table className="w-full border-collapse text-left text-sm leading-6">
                    <thead className="bg-cmt-neutral-50 text-cmt-neutral-900">
                      <tr>{head.map((cell, cellIndex) => <th key={cellIndex} scope="col" className="border-b border-cmt-neutral-200 px-3 py-2 font-semibold">{cell}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-cmt-neutral-200 first:border-t-0">
                        {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-2 align-top">{cell}</td>)}
                      </tr>)}
                    </tbody>
                  </table>
                </div>;
              }
            }
          })}
        </div>
      </article>
    </main>
    <Footer />
  </>;
}
