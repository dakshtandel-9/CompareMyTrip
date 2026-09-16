import { BookOpen, Compass, GalleryHorizontalEnd, LayoutDashboard, Mail, MessageSquareText, MessagesSquare, Newspaper, PackageSearch, PanelsTopLeft, Plane, Sparkles, TicketPercent, Users, type LucideIcon } from "lucide-react";

export type AdminNavItem = { href: string; label: string; description: string; icon: LucideIcon; keywords?: string };
export const ADMIN_NAV_GROUPS: { label: string; items: AdminNavItem[] }[] = [
  { label: "Workspace", items: [
    { href: "/admin", label: "Overview", description: "Your priorities and shortcuts in one place.", icon: LayoutDashboard, keywords: "dashboard home" },
  ] },
  { label: "Requests & bookings", items: [
    { href: "/admin/enquiries", label: "Contact enquiries", description: "Reply to questions sent through the contact form.", icon: MessageSquareText, keywords: "inbox messages support" },
    { href: "/admin/package-enquiries", label: "Package quotes", description: "Review requests for a customised package price.", icon: MessagesSquare, keywords: "customized quotation" },
    { href: "/admin/popup-form", label: "Trip planning leads", description: "Follow up with visitors who need help planning a trip.", icon: Sparkles, keywords: "pop-up popup form" },
    { href: "/admin/trips", label: "Bookings & payments", description: "Check payments, confirm bookings and set departure dates.", icon: Plane, keywords: "trips revenue refund reports" },
  ] },
  { label: "Travel catalogue", items: [
    { href: "/admin/packages", label: "Travel packages", description: "Create and edit prices, itineraries, photos and availability.", icon: PackageSearch, keywords: "inventory products draft publish" },
    { href: "/admin/destinations", label: "Destinations", description: "Create destinations, add packages and manage cover photos.", icon: Compass, keywords: "places countries states image create add package" },
    { href: "/admin/coupons", label: "Discount codes", description: "Manage coupon amounts, dates and eligible packages.", icon: TicketPercent, keywords: "coupons offers promotions" },
  ] },
  { label: "Website", items: [
    { href: "/admin/content", label: "Pages & content", description: "Edit website text, sections, reviews and shared settings.", icon: PanelsTopLeft, keywords: "homepage footer coming soon maintenance add-on visa transport contact" },
    { href: "/admin/banners", label: "Page banners", description: "Change the large image and heading at the top of a page.", icon: GalleryHorizontalEnd, keywords: "masthead hero artwork" },
    { href: "/admin/blog", label: "Blog & travel guides", description: "Write, preview and publish articles for travellers.", icon: Newspaper, keywords: "stories posts news" },
  ] },
  { label: "Audience", items: [
    { href: "/admin/users", label: "Customers", description: "Find registered customers and their contact details.", icon: Users, keywords: "users accounts profiles" },
    { href: "/admin/subscribers", label: "Newsletter subscribers", description: "View newsletter sign-ups and export your subscriber list.", icon: Mail, keywords: "emails mailing list csv" },
  ] },
];
export const ADMIN_GUIDE: AdminNavItem = { href: "/admin/guide", label: "How to use admin", description: "Simple instructions for every part of your workspace.", icon: BookOpen, keywords: "help getting started tutorial" };
export const ADMIN_NAV_ITEMS = [...ADMIN_NAV_GROUPS.flatMap((group) => group.items), ADMIN_GUIDE];
export function findAdminPage(pathname: string) {
  return ADMIN_NAV_ITEMS.find((item) => item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));
}
export function searchAdminPages(query: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return ADMIN_NAV_ITEMS.filter((item) => words.every((word) => `${item.label} ${item.description} ${item.keywords ?? ""}`.toLowerCase().includes(word)));
}
