export type PlanningFields = { departureCity: string; audience: string; budget: string; company: string; transport: string };
/** Keep the existing CRM and deployed enquiry rules compatible; the structured brief is readable in every inbox/export. */
export function enquiryPlanningMessage(values: PlanningFields & { message: string }): string {
  return [
    `Starting from: ${values.departureCity.trim() || "Not specified"}`,
    `Travelling as: ${values.audience || "Not specified"}`,
    `Budget per person: ${values.budget || "Not specified"}`,
    `Transport: ${values.transport || "Please advise"}`,
    ...(values.audience === "corporate" && values.company.trim() ? [`Company: ${values.company.trim()}`] : []),
    "", values.message.trim(),
  ].join("\n");
}
