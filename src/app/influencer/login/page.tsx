import { redirect } from 'next/navigation'

export default function InfluencerLoginPage() {
  redirect('/dashboard/login?redirect=/influencer/dashboard')
}
