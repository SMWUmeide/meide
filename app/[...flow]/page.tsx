import { notFound } from "next/navigation";
import OrderFlow from "@/components/yj/order-flow";
import { isFlowPath } from "@/lib/yj/routes";
export default async function FlowPage({
  params,
}: {
  params: Promise<{ flow: string[] }>;
}) {
  const { flow } = await params;
  if (!isFlowPath("/" + flow.join("/"))) notFound();
  return <OrderFlow />;
}
