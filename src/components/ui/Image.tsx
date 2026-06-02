import NextImage, { type ImageProps as NextImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type Props = NextImageProps & { className?: string };

export function Image({ className, alt, ...rest }: Props) {
  return <NextImage className={cn(className)} alt={alt} {...rest} />;
}
