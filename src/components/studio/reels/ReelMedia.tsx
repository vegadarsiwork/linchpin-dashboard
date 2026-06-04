'use client'

import { forwardRef } from 'react'

type ReelMediaProps = {
  src: string
  controls?: boolean
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  className?: string
  iframeClassName?: string
}

function isBunnyEmbed(src: string): boolean {
  return src.includes('iframe.mediadelivery.net/embed/')
}

export const ReelMedia = forwardRef<HTMLVideoElement, ReelMediaProps>(
  function ReelMedia(
    {
      src,
      controls = false,
      autoPlay = false,
      muted = false,
      loop = false,
      preload = 'metadata',
      className,
      iframeClassName,
    },
    ref
  ) {
    if (isBunnyEmbed(src)) {
      return (
        <iframe
          src={src}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className={iframeClassName ?? className}
        />
      )
    }

    return (
      <video
        ref={ref}
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        loop={loop}
        preload={preload}
        className={className}
      />
    )
  }
)
