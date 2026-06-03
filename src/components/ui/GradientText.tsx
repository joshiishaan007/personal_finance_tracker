import { cn } from '@/lib/utils';

interface Props {
  children: React.ReactNode;
  className?: string;
  as?: 'span' | 'div';
}

// Aurora gradient text for hero numbers / wordmarks. Element tier — the one place
// the raw tag + gradient clip live.
export function GradientText({ children, className, as: Tag = 'span' }: Props) {
  return <Tag className={cn('text-gradient font-display font-bold', className)}>{children}</Tag>;
}
