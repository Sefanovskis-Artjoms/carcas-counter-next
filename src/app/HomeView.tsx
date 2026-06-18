"use client";

import Link from "next/link";
import Carcas from "@/components/Carcas/Carcas";
import Table from "@/components/Table/Table";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBatchData, updateCounterAction } from "@/actions/batch-actions";
import SelectBatchPopup from "@/app/_components/SelectBatchPopup/SelectBatchPopup";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { CARCAS_PART_SELECT_OPTIONS } from "@/data/zone-display-names";
import {
  CarcasEntry,
  ActionResponse,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/types/interfaces";

// MARK: Types

type MutationContext = {
  previousData: CarcasEntry[] | undefined;
};

export default function HomeView() {
  // MARK: Hooks & refs

  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const inputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  // MARK: URL params

  const selectedBatchNumber = searchParams.get("batch");

  // MARK: State

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isIncreaseMode, setIsIncreaseMode] = useState(true);
  const [isClickAmountChanging, setIsClickAmountChanging] = useState(false);
  const [selectedPart, setSelectedPart] = useState<"fq" | "hq">("fq");
  const [updateAmount, setUpdateAmount] = useState(1);
  const [highlightZone, setHighlightZone] = useState<number | null>(null);
  const [isCarcasVisible, setIsCarcasVisible] = useState(true);

  // MARK: Derived values

  const showCarcasPanel = !selectedBatchNumber || isCarcasVisible;

  // MARK: Data fetching

  const {
    data: batchData = [],
    isLoading: isBatchLoading,
    isError: isBatchError,
  } = useQuery<CarcasEntry[]>({
    queryKey: ["batchData", selectedBatchNumber],
    queryFn: async () => {
      const response = await getBatchData(selectedBatchNumber!);
      if (!response.success) {
        throw new Error(response.error || "Failed to fetch batch data");
      }
      return response.data || [];
    },
    enabled: !!selectedBatchNumber,
    staleTime: 1000 * 60,
  });

  // MARK: Mutations

  const { mutate: handleValueUpdate } = useMutation<
    ActionResponse<CarcasEntry>,
    Error,
    { id: number; counter_name: string; increment: boolean; amount: number },
    MutationContext
  >({
    mutationFn: ({ id, counter_name, increment, amount }) =>
      updateCounterAction(id, counter_name, increment, amount),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ["batchData", selectedBatchNumber],
      });

      const previousData = queryClient.getQueryData<CarcasEntry[]>([
        "batchData",
        selectedBatchNumber,
      ]);

      queryClient.setQueryData<CarcasEntry[]>(
        ["batchData", selectedBatchNumber],
        (oldData) => {
          if (!oldData) return [];
          return oldData.map((row) => {
            if (row.id === variables.id) {
              const currentValue =
                row[variables.counter_name as keyof CarcasEntry] || 0;
              if (typeof currentValue !== "number") return row;

              const newCount = variables.increment
                ? currentValue + variables.amount
                : Math.max(0, currentValue - variables.amount);
              return {
                ...row,
                [variables.counter_name]: newCount,
              };
            }
            return row;
          });
        },
      );

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["batchData", selectedBatchNumber],
          context.previousData,
        );
      }
      toast.error(
        "Failed to update, unexpected server error occured. If this error persists, please contact support.",
      );
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["batchData", selectedBatchNumber],
      });

      if (data?.success && socketRef.current && selectedBatchNumber) {
        socketRef.current.emit("update_data", {
          batchId: selectedBatchNumber,
        });
      }
    },
  });

  // MARK: Effects

  useEffect(() => {
    document.title = selectedBatchNumber
      ? `Inspecting ${selectedBatchNumber}`
      : "Carcas Counter";
  }, [selectedBatchNumber]);

  useEffect(() => {
    if (!selectedBatchNumber) {
      socketRef.current?.disconnect();
      return;
    }

    socketRef.current = io();
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("join_batch", selectedBatchNumber);
    });

    socket.on("refresh_table", () => {
      queryClient.invalidateQueries({
        queryKey: ["batchData", selectedBatchNumber],
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedBatchNumber, queryClient]);

  // MARK: Event handlers

  const handleBatchSelect = (batchNumber: string) => {
    router.replace(`/?batch=${batchNumber}`);
    setIsPopupOpen(false);
  };

  const onSetNewAmount = (newAmount: string) => {
    if (!newAmount) return;
    const value = Number(newAmount);
    if (isNaN(value) || value < 1 || !Number.isInteger(value)) return;
    setUpdateAmount(value);
    setIsClickAmountChanging(false);
  };

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      onSetNewAmount(inputRef.current.value);
      inputRef.current.value = "";
      inputRef.current.blur();
    }
  };

  const handleZoneClick = (zoneNumber: number) => {
    // NOTE: setHighlightZone(null) is called to allow registering repeated clicks on the same zone
    // and it is wrapped with a set timeout of 20ms because react can batch state updates
    // and 20ms was chosen because it is next round number after one frame update which happens every ~16ms
    setHighlightZone(zoneNumber);
    setTimeout(() => {
      setHighlightZone(null);
    }, 20);
  };

  // MARK: HTML

  return (
    <div className="flex-1 grid grid-rows-[auto_1fr] max-h-screen w-full min-h-0">
      {/* MARK: Toolbar */}
      <div className="flex items-center gap-[0.8rem] pb-[1.8rem]">
        {isIncreaseMode ? (
          <button
            onClick={() => setIsIncreaseMode(false)}
            className="btn btn--secondary"
            disabled={!selectedBatchNumber}
          >
            Go to decrease mode
          </button>
        ) : (
          <button
            onClick={() => setIsIncreaseMode(true)}
            className="btn btn--primary"
          >
            Go to increase mode
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setIsPopupOpen(!isPopupOpen)}
            className={`btn ${!selectedBatchNumber ? "btn--highlight" : ""}`}
          >
            Select Batch
          </button>
          {isPopupOpen && (
            <SelectBatchPopup
              onClose={() => setIsPopupOpen(false)}
              onSelectBatch={handleBatchSelect}
            />
          )}
        </div>

        {selectedBatchNumber && (
          <>
            <span className="pl-4 text-4xl font-medium">
              Selected batch: {selectedBatchNumber}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCarcasVisible((visible) => {
                  if (visible) setIsClickAmountChanging(false);
                  return !visible;
                });
              }}
              className="btn btn--color-neutral"
            >
              {isCarcasVisible ? "Hide Carcas" : "Show Carcas"}
            </button>
          </>
        )}

        <Link href="/history" className="btn btn--color-neutral ml-auto">
          View History
        </Link>
      </div>
      {/* MARK: Main content */}
      <div className="flex gap-7 flex-1 min-h-0">
        {showCarcasPanel && (
          <div className="flex flex-col gap-4 w-60 shrink-0 min-h-0">
            {/* MARK: Carcas sidebar */}
            {/* MARK: Part selector (FQ / HQ) */}
            <div className="w-fit ml-auto mr-auto flex gap-4">
              {CARCAS_PART_SELECT_OPTIONS.map(({ value, label, title }) => (
                <button
                  key={value}
                  type="button"
                  title={title}
                  onClick={() => setSelectedPart(value)}
                  className={`btn ${
                    selectedPart === value && selectedBatchNumber
                      ? "btn--primary-light"
                      : "btn--neutral"
                  }`}
                  disabled={!selectedBatchNumber}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* MARK: Carcas diagram */}
            <div className="flex-1 flex items-center justify-center py-4 min-h-0 min-w-0 self-stretch">
              <div className="w-full h-full min-h-0 min-w-0">
                <Carcas
                  selectedCarcasPart={selectedPart}
                  onZoneClick={handleZoneClick}
                  isDisabled={!selectedBatchNumber}
                />
              </div>
            </div>

            {/* MARK: Click amount controls */}
            <div className="w-60 mx-auto flex flex-col gap-4.5">
              {isClickAmountChanging ? (
                <form className="flex flex-col gap-4.5" onSubmit={handleAmountSubmit}>
                  <input
                    ref={inputRef}
                    className="py-2 px-4 border border-border rounded-[0.3rem]"
                    placeholder="Amount"
                    type="number"
                    enterKeyHint="done"
                  />
                  <button type="submit" className="btn btn--approve w-full">
                    Set new amount
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsClickAmountChanging(false);
                      if (inputRef.current) {
                        inputRef.current.value = "";
                      }
                    }}
                    className="btn btn--reject w-full"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsClickAmountChanging(true)}
                  className="btn btn--color-neutral"
                  disabled={!selectedBatchNumber}
                >
                  Change click amount
                </button>
              )}
            </div>
          </div>
        )}

        {/* MARK: Data table */}
        <div className="flex-1 min-w-0">
          <Table
            data={batchData}
            isLoading={isBatchLoading}
            selectedCarcasPart={selectedPart}
            isReadOnly={false}
            increaseMode={isIncreaseMode}
            updateAmount={updateAmount}
            highlightRow={highlightZone}
            onValueUpdate={handleValueUpdate}
            isDisabled={!selectedBatchNumber || isBatchError}
            centeredMessage={
              isBatchError
                ? "Error: Failed to load data"
                : !selectedBatchNumber
                  ? "No Batch Selected"
                  : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
