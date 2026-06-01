import { ReviewClient } from "./ReviewClient"

interface PageProps {
  params: Promise<{ dealId: string }>
}

export default async function Page({ params }: PageProps) {
  const { dealId } = await params
  return <ReviewClient dealId={dealId} />
}
