import type { ReactNode } from 'react';
import type { Fiber, Inventory, PhysicalColor, SourceRef, Verification } from '../domain/types';
import { colorLabel, commercialRoles, fiberLabel, verificationLabels } from '../domain/network';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="page-header">
    <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="page-title">{title}</h1>{description && <p className="page-description">{description}</p>}</div>
    {action && <div>{action}</div>}
  </header>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'warning' | 'success' | 'danger' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function VerificationBadge({ value }: { value: Verification }) {
  const tone = value === 'field_verified' ? 'success' : value === 'conflicting' ? 'danger' : value === 'needs_verification' ? 'warning' : 'neutral';
  return <Badge tone={tone}>{verificationLabels[value]}</Badge>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><strong>{title}</strong><p>{description}</p></div>;
}

export function FiberIdentity({ fiber, compact = false }: { fiber: Fiber; compact?: boolean }) {
  const label = colorLabel(fiber.physicalColor);
  const hasDocumentedColor = fiber.physicalColor.basis === 'documented' && !!fiber.physicalColor.hex;
  return <span className={`fiber-identity${compact ? ' fiber-identity-compact' : ''}`}>
    <span className={`fiber-swatch${hasDocumentedColor ? '' : ' is-unknown'}`} style={hasDocumentedColor ? { backgroundColor: fiber.physicalColor.hex! } : undefined} aria-hidden="true" />
    <span>{fiberLabel(fiber.number)}{!compact && <small>{label}</small>}</span>
  </span>;
}

export function PhysicalColorIdentity({ color }: { color: PhysicalColor | null | undefined }) {
  const documented = color?.basis === 'documented' && !!color.hex;
  return <span className="physical-color-identity">
    <span className={`fiber-swatch${documented ? '' : ' is-unknown'}`} style={documented ? { backgroundColor: color.hex! } : undefined} aria-hidden="true" />
    <span>{colorLabel(color)}</span>
  </span>;
}

export function CommercialRoles({ data, cableId, fiberNumber }: { data: Inventory; cableId: string; fiberNumber?: number }) {
  const roles = commercialRoles(data, cableId, fiberNumber);
  return <div className="roles-grid">{roles.map((role) => <div className="role-card" key={role.label}>
    <div className="field-label">{role.label}</div><strong>{role.value}</strong>{role.note && <p className="muted">{role.note}</p>}
  </div>)}</div>;
}

export function Evidence({ source }: { source: SourceRef }) {
  return <details className="evidence"><summary>წყაროს ჩანაწერი</summary>
    <dl className="facts-grid">
      <div className="fact"><dt>ფაილი</dt><dd>{source.file}</dd></div>
      <div className="fact"><dt>გვერდი</dt><dd>{source.page}</dd></div>
      {source.pageId && <div className="fact"><dt>გვერდის ID</dt><dd>{source.pageId}</dd></div>}
      {source.part && <div className="fact"><dt>პაკეტის ნაწილი</dt><dd><code>{source.part}</code></dd></div>}
      <div className="fact"><dt>ფიგურები</dt><dd>{source.shapeIds.length ? source.shapeIds.join(', ') : 'მითითებული არ არის'}</dd></div>
      {source.rawValue && <div className="fact"><dt>ნედლი მნიშვნელობა</dt><dd>{source.rawValue}</dd></div>}
      {source.note && <div className="fact"><dt>შენიშვნა</dt><dd>{source.note}</dd></div>}
    </dl>
  </details>;
}
