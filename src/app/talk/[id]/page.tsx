import Talk from "@/components/Talk";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Talk id={id} />;
}
