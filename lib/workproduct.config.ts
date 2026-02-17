import type { LucideIcon } from 'lucide-react'
import { Mail, Monitor, Image, FileText, MessageSquare, CalendarCheck } from 'lucide-react'

/** Single product type definition for "create from source" flows */
export interface WorkProductTypeOption {
  id: string
  name: string
  icon: LucideIcon
  description: string
  createPath: (sourceId: string, sourceType: string, companyId?: string | null) => string
  /** If set, this product is only shown when source type is in this list (e.g. training, event, community) */
  allowedSourceTypes?: string[]
}

/** All product types available when creating from a workforce/workstuff source */
export const WORK_PRODUCT_TYPE_OPTIONS: WorkProductTypeOption[] = [
  {
    id: 'email_digest',
    name: 'Email Digest',
    icon: Mail,
    description: 'Create a weekly email digest with this item',
    createPath: (sourceId, sourceType) =>
      `/workforce/enduring/email-digest/new?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'digital_signage',
    name: 'Digital Signage',
    icon: Monitor,
    description: 'Create a digital sign to display this item',
    createPath: (sourceId, sourceType) =>
      `/mywork/digital-signage/new?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'flyer_poster',
    name: 'Flyer / Poster',
    icon: Image,
    description: 'Create a flyer or poster from this item',
    createPath: (sourceId, sourceType) =>
      `/mywork/products/builder/new?type=flyer_poster&sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'senior_leader_email',
    name: 'Senior Leader Email',
    icon: FileText,
    description: 'Create a senior leader email about this item',
    createPath: (sourceId, sourceType) =>
      `/mywork/seniorleader/build?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'comms_plan',
    name: 'Comms Plan',
    icon: MessageSquare,
    description: 'Create a communications plan for this item',
    createPath: (sourceId, sourceType) =>
      `/mywork/products/comms-plan/new?sourceId=${sourceId}&sourceType=${sourceType}`,
  },
  {
    id: 'sharepoint_entry',
    name: 'SharePoint Entry',
    icon: CalendarCheck,
    description: 'Generate a SharePoint Events or NTK entry from this item (Training or Community Event)',
    createPath: (sourceId, sourceType, companyId) =>
      `/mywork/sharepoint-entry/build?sourceId=${sourceId}&sourceType=${sourceType}${companyId ? `&companyId=${companyId}` : ''}`,
    allowedSourceTypes: ['training', 'event', 'community'],
  },
]
