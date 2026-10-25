import { notFound } from "next/navigation";
import OrderFlow from "@/components/yj/order-flow";
export default async function FlowPage({
  params,
}: {
  params: Promise<{ flow: string[] }>;
}) {
  const { flow } = await params;
  if (
    !/^\/(capture(?:\/photos(?:\/\d+)?)?|analyze|restaurant\/(confirm|select)|menu(?:\/(ceci|melanzane|porri|zucca|ossobuco|peposo|rosato)(?:\/ask)?)?|cart|order(?:\/large)?|receipt)$/.test(
      "/" + flow.join("/"),
    )
  )
    notFound();
  return <OrderFlow />;
}
