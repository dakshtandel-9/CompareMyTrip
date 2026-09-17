import type { PackageEditorArea } from './PackageDetailEditor';
import type { PackagePageSections } from '@/lib/packageDetailSections';

const placements: Record<string, PackageEditorArea> = {
  overview: 'overview', highlights: 'highlights', transfers: 'practical', carry: 'practical',
  guidelines: 'practical', practical: 'practical', faq: 'faq', extras: 'extras',
};
const sections: Record<string, PackageEditorArea> = {
  'package-about': 'overview', 'package-highlights': 'highlights', 'package-itinerary': 'itinerary',
  'package-stays': 'stays', 'package-transfers': 'practical', 'package-locations': 'locations',
  'package-inclusions': 'coverage', 'package-exclusions': 'coverage', 'package-policy': 'policy',
  'package-reviews': 'reviews', 'package-gallery': 'images', 'booking-options': 'booking',
};
/** Authored placement wins over the section's appearance or title. */
export function packageVisualSectionArea(id: string, page: PackagePageSections): PackageEditorArea | undefined {
  if (id.startsWith('package-section-')) {
    const custom = page.sections.find(section => `package-section-${section.id}` === id);
    return custom ? placements[custom.placement ?? 'extras'] ?? 'extras' : undefined;
  }
  return sections[id];
}
