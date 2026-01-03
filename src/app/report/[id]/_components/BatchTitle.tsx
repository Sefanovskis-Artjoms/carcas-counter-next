"use client";

import { useParams } from "next/navigation";

export default function BatchTitle() {
  const params = useParams();

  return (
    <h2 className="text-[2.4rem] font-medium">
      Viewing report for batch {params.id}
    </h2>
  );
}
