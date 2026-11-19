// Keep cruise references and design targets distinct from measured top speeds.
export function aircraftSpeedLabel(slug: string, speed: number | null): string {
  if (slug === 'phantom-3500') return '≈950 km/h (target reference)';
  if (slug === 'archer-midnight') return '≈241 km/h (target)';
  if (slug === 'electra-el9') return '175 kt cruise (target)';
  if (slug === 'pivotal-helix') return '55 kt cruise';
  return speed == null ? 'Speed not disclosed' : `${speed.toLocaleString()} km/h`;
}

export function aircraftSpecNote(slug: string): string | null {
  switch (slug) {
    case 'archer-midnight':
      return 'Manufacturer design targets, not certified performance. Range: 100 statute miles, approximately 87 NM. Unknown specifications are not ranked.';
    case 'electra-el9':
      return 'EL9 design targets: 175 KTAS cruise, not top speed. The 1,100 NM figure is ferry range; full-payload mission range is 330 NM. These are not EL2 demonstrator specifications.';
    case 'pivotal-helix':
      return 'Published cruise speed is 55 knots, not verified maximum speed. Range is 20 statute miles, approximately 17.4 NM. Operating-height limits are not service ceiling.';
    case 'b-21-raider':
    case 'mq-25-stingray':
      return 'Undisclosed or unverified specifications are intentionally left unknown and are not ranked in comparisons.';
    default:
      return null;
  }
}
