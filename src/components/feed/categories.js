import { FileText, HelpCircle, Megaphone, MessageSquareText } from 'lucide-react'

export const CATEGORY = {
  general: { Icon: MessageSquareText, chip: 'bg-surface-container text-on-surface-variant', rail: 'bg-outline-variant' },
  question: { Icon: HelpCircle, chip: 'bg-tertiary-fixed text-on-tertiary-fixed', rail: 'bg-amber-500' },
  summary: { Icon: FileText, chip: 'bg-primary-fixed text-on-primary-fixed', rail: 'bg-primary-container' },
  announcement: { Icon: Megaphone, chip: 'bg-secondary-fixed text-on-secondary-fixed', rail: 'bg-secondary' },
}