import Carcas from "@/components/Carcas/Carcas";
import BatchTitle from "./_components/BatchTitle";
import Table from "@/components/Table/Table";
import Link from "next/link";

export default function Loading() {
  return (
    <div className="flex-1 grid grid-rows-[auto_1fr]">
      <div className="pb-[3.2rem]">
        <div className="flex justify-between items-center mb-4">
          <BatchTitle />
          <Link href="/history" className="btn">
            Back
          </Link>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-[auto_1fr] gap-[5.8rem]">
        <div className="h-full m-auto pt-[4.8rem] pb-[3.2rem]">
          <Carcas isDisabled={true} />
        </div>
        <Table isLoading={true} />
      </div>
    </div>
  );
}
