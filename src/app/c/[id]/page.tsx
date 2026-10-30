import Workspace from "@/components/workspace/Workspace";

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ step?: string }> }) {
  const [{ id }, { step }] = await Promise.all([params, searchParams]);
  return <Workspace id={id} initialStep={step} />;
}
