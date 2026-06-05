import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { getCurrentUser } from '@/lib/auth'
import { query, queryOne } from '@/lib/db'
import type { Influencer, MediaAsset } from '@/lib/types'

const f = createUploadthing()

async function requireUploader() {
  const me = await getCurrentUser()
  if (!me) throw new UploadThingError('Unauthorized')
  return me
}

type UploadedFile = {
  key: string
  name: string
  size: number
  type: string
  ufsUrl: string
}

async function createMediaAsset(args: {
  file: UploadedFile
  userId: string
  orgId?: string | null
  influencerId?: string | null
  assetKind: string
  metadata?: Record<string, unknown>
}) {
  return queryOne<MediaAsset>(
    `insert into media_assets (
      org_id, influencer_id, owner_user_id, created_by, bucket, object_key,
      filename, content_type, size_bytes, asset_kind, access_scope, status,
      provider, provider_file_key, url, metadata, uploaded_at
    ) values (
      $1, $2, $3, $3, 'uploadthing', $4,
      $5, $6, $7, $8, 'private', 'uploaded',
      'uploadthing', $4, $9, $10, now()
    )
    returning *`,
    [
      args.orgId ?? null,
      args.influencerId ?? null,
      args.userId,
      args.file.key,
      args.file.name,
      args.file.type || 'application/octet-stream',
      args.file.size || 0,
      args.assetKind,
      args.file.ufsUrl,
      args.metadata ?? {},
    ]
  )
}

export const ourFileRouter = {
  avatarUploader: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const me = await requireUploader()
      if (me.user.role !== 'influencer' && me.user.role !== 'superadmin') {
        throw new UploadThingError('Forbidden')
      }
      const influencer = me.user.role === 'influencer'
        ? await queryOne<Influencer>('select id from influencers where user_id = $1', [me.user.id])
        : null
      return { userId: me.user.id, role: me.user.role, influencerId: influencer?.id ?? null }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const uploaded = file as UploadedFile
      const asset = await createMediaAsset({
        file: uploaded,
        userId: metadata.userId,
        influencerId: metadata.influencerId,
        assetKind: 'portfolio',
        metadata: { purpose: 'avatar' },
      })
      return {
        url: uploaded.ufsUrl,
        mediaAssetId: asset?.id ?? null,
      }
    }),

  coverUploader: f({
    image: {
      maxFileSize: '8MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const me = await requireUploader()
      if (me.user.role !== 'influencer' && me.user.role !== 'superadmin') {
        throw new UploadThingError('Forbidden')
      }
      const influencer = me.user.role === 'influencer'
        ? await queryOne<Influencer>('select id from influencers where user_id = $1', [me.user.id])
        : null
      return { userId: me.user.id, role: me.user.role, influencerId: influencer?.id ?? null }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const uploaded = file as UploadedFile
      const asset = await createMediaAsset({
        file: uploaded,
        userId: metadata.userId,
        influencerId: metadata.influencerId,
        assetKind: 'portfolio',
        metadata: { purpose: 'cover_photo' },
      })
      return {
        url: uploaded.ufsUrl,
        mediaAssetId: asset?.id ?? null,
      }
    }),

  trialReelPreview: f({
    image: {
      maxFileSize: '32MB',
      maxFileCount: 1,
    },
    video: {
      maxFileSize: '64MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const me = await requireUploader()
      if (me.user.role !== 'influencer') throw new UploadThingError('Forbidden')
      const influencer = await queryOne<Influencer>(
        'select * from influencers where user_id = $1',
        [me.user.id]
      )
      if (!influencer) throw new UploadThingError('Influencer profile not found')
      return { userId: me.user.id, influencerId: influencer.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const uploaded = file as UploadedFile
      const asset = await createMediaAsset({
        file: uploaded,
        userId: metadata.userId,
        influencerId: metadata.influencerId,
        assetKind: 'influencer_reel',
        metadata: { purpose: 'trial_reel_preview' },
      })
      await query(
        `update influencers
            set updated_at = now()
          where id = $1`,
        [metadata.influencerId]
      )
      return {
        url: uploaded.ufsUrl,
        mediaAssetId: asset?.id ?? null,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
