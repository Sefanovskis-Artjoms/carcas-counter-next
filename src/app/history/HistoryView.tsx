"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppBack } from "@/components/InternalNavigationTracker/InternalNavigationTracker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/Spinner/Spinner";
import { getAllHistoryItems } from "@/actions/batch-actions";
import { useQuery } from "@tanstack/react-query";

export default function HistoryView({
  initialData,
}: {
  initialData?: { date: string; batch_number: string }[];
}) {
  const router = useRouter();
  const handleBack = useAppBack();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const wrapperRef = useRef<HTMLDivElement>(null);

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialDateFrom = searchParams.get("dateFrom") || "";
  const initialDateTo = searchParams.get("dateTo") || "";
  const initialBatch = searchParams.get("batch_number") || "";

  const [inputs, setInputs] = useState({
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    batchNumber: initialBatch,
  });

  const [filters, setFilters] = useState({
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    batchNumber: initialBatch,
  });

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(15);

  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await refetch();
    setIsRetrying(false);
  };

  const {
    data: allData = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["historyList"],
    queryFn: async () => {
      const response = await getAllHistoryItems();
      if (!response.success) {
        throw new Error("Failed to fetch history");
      }
      return response.data || [];
    },
    initialData: initialData,
    staleTime: 1000 * 60 * 15,
  });

  const recalcPageSize = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const list = wrapper.querySelector("ul") as HTMLElement;
    if (!list) return;

    const containerHeight = wrapper.clientHeight - 4;

    const cs = getComputedStyle(list);
    const rowGap = parseFloat(cs.rowGap) || 0;

    const colCount =
      (cs.gridTemplateColumns || "").split(" ").filter(Boolean).length || 1;

    let item = list.querySelector("li") as HTMLElement | null;
    let cleanup = false;

    if (!item) {
      item = document.createElement("li");
      item.style.visibility = "hidden";
      item.style.position = "absolute";
      item.className = "w-full h-min";
      item.innerHTML = `<a class="btn inline-block w-full text-center">00/00/0000 | Batch: 000000</a>`;
      list.appendChild(item);
      cleanup = true;
    }

    const itemH = Math.ceil(item.getBoundingClientRect().height);

    if (cleanup && item.parentNode) {
      item.parentNode.removeChild(item);
    }

    if (!itemH || !containerHeight) return;

    const rows = Math.max(
      1,
      Math.floor((containerHeight + rowGap) / (itemH + rowGap))
    );

    const nextPageSize = Math.max(1, rows * colCount);

    setPageSize((prev) => (prev !== nextPageSize ? nextPageSize : prev));
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => recalcPageSize());
    });

    observer.observe(wrapper);
    recalcPageSize();

    return () => observer.disconnect();
  }, [recalcPageSize, isLoading, isError]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.batchNumber) params.set("batch_number", filters.batchNumber);

    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    router.replace(url, { scroll: false });
  }, [filters, currentPage, pathname, router]);

  const filteredItems = useMemo(() => {
    const { dateFrom, dateTo, batchNumber } = filters;

    if (!dateFrom && !dateTo && !batchNumber) {
      return allData;
    }

    const dFrom = dateFrom ? new Date(dateFrom) : null;
    if (dFrom) dFrom.setHours(0, 0, 0, 0);

    const dTo = dateTo ? new Date(dateTo) : null;
    if (dTo) dTo.setHours(0, 0, 0, 0);

    return allData.filter((item) => {
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);

      if (dFrom && itemDate < dFrom) return false;
      if (dTo && itemDate > dTo) return false;
      if (batchNumber && !item.batch_number.includes(batchNumber)) return false;

      return true;
    });
  }, [filters, allData]);

  const maxPageCount = Math.ceil(filteredItems.length / pageSize) || 1;

  const paginatedItems = useMemo(() => {
    const validPage = Math.max(1, Math.min(currentPage, maxPageCount));
    const startIndex = (validPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, currentPage, pageSize, maxPageCount]);

  const paginationNumbers = useMemo(() => {
    const total = maxPageCount;
    const current = currentPage;

    if (total <= 6) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current > total - 2) {
      return [1, "...", total - 2, total - 1, total];
    }
    if (current < 3) {
      return [1, 2, 3, "...", total];
    }

    return [
      1,
      current - 1 === 2 ? null : "...",
      current - 1,
      current,
      current + 1,
      current + 1 === total - 1 ? null : "...",
      total,
    ].filter((val) => val !== null);
  }, [maxPageCount, currentPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(inputs);
    setCurrentPage(1);
  };

  const switchPage = (page: number) => {
    if (page >= 1 && page <= maxPageCount) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex-1 grid grid-rows-[auto_1fr_auto] max-h-screen w-full min-h-0">
      <div className="w-full mx-auto flex justify-between items-start pb-[3.2rem]">
        <form className="flex items-start gap-[1.8rem]" onSubmit={handleSearch}>
          <div className="flex flex-col gap-[1.2rem] w-max">
            <div className="flex gap-[0.9rem] justify-between items-center">
              <label htmlFor="dateFrom">Date from:</label>
              <input
                id="dateFrom"
                type="date"
                className="input ml-[0.2rem]"
                value={inputs.dateFrom}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-[0.9rem] justify-between items-center">
              <label htmlFor="dateTo">Date to:</label>
              <input
                id="dateTo"
                type="date"
                className="input ml-[0.2rem]"
                value={inputs.dateTo}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, dateTo: e.target.value }))
                }
              />
            </div>
          </div>

          <input
            type="text"
            className="input w-68"
            placeholder="Batch number"
            value={inputs.batchNumber}
            onChange={(e) =>
              setInputs((prev) => ({
                ...prev,
                batchNumber: e.target.value,
              }))
            }
          />

          <button type="submit" className="btn btn--color-neutral">
            Search
          </button>

          <button
            type="button"
            className="btn btn--color-neutral"
            onClick={() => {
              setInputs({ dateFrom: "", dateTo: "", batchNumber: "" });
              setFilters({ dateFrom: "", dateTo: "", batchNumber: "" });
            }}
          >
            Reset
          </button>
        </form>

        <button onClick={handleBack} className="btn btn--color-neutral">
          Back
        </button>
      </div>

      <div
        className="relative w-full max-w-500 h-full min-h-0 mx-auto flex justify-start overflow-hidden"
        ref={wrapperRef}
      >
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[1.2rem] z-10 bg-background/90">
            <p className="text-4xl text-red-500 font-medium pb-8">
              Failed to load history data. Please try again later. If this issue
              persists, please contact IT support.
            </p>
            <button
              onClick={handleRetry}
              className="btn btn--highlight disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isRetrying}
            >
              {isRetrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        <ul className="h-full min-h-0 w-min mx-auto list-none grid grid-cols-[repeat(4,max-content)] auto-rows-max justify-items-start gap-x-[1.2rem] gap-y-[1.8rem] max-[68.75em]:grid-cols-[repeat(3,max-content)]">
          {!isLoading &&
            !isError &&
            paginatedItems.map((item) => (
              <li
                key={`${item.batch_number}-${item.date}`}
                className="w-full h-min"
              >
                <Link
                  href={`/report/${item.batch_number}?date=${new Date(
                    item.date
                  ).toLocaleDateString("en-GB")}`}
                  className="btn inline-block w-full text-center"
                >
                  {new Date(item.date).toLocaleDateString("en-GB")} | Batch:{" "}
                  {item.batch_number}
                </Link>
              </li>
            ))}
          {!isLoading && !isError && paginatedItems.length === 0 && (
            <li className="col-span-full text-center p-8">No items found.</li>
          )}
        </ul>

        {isLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Spinner size={60} />
          </div>
        )}
      </div>

      {maxPageCount > 1 && (
        <div className="pt-[1.8rem] w-fit mx-auto mt-auto flex gap-[0.8rem]">
          <button
            className="btn btn--color-neutral"
            onClick={() => switchPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {paginationNumbers.map((pageNum, index) => {
            if (pageNum === "...") {
              return (
                <span key={`ellipsis-${index}`} className="self-end">
                  ...
                </span>
              );
            }

            return (
              <button
                key={pageNum}
                className={`btn ${
                  pageNum === currentPage
                    ? "btn--neutral-darker"
                    : "btn--neutral"
                }`}
                onClick={() => switchPage(pageNum as number)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="btn btn--color-neutral"
            onClick={() => switchPage(currentPage + 1)}
            disabled={currentPage === maxPageCount}
          >
            Next
          </button>

          {maxPageCount >= 6 && (
            <>
              <button
                className="btn btn--color-neutral ml-4"
                onClick={() => {
                  const el = document.getElementById(
                    "goToPageInput"
                  ) as HTMLInputElement;
                  if (el) switchPage(Number(el.value));
                }}
              >
                Go to page:
              </button>
              <input
                id="goToPageInput"
                type="number"
                min="1"
                max={maxPageCount}
                placeholder={`e.g. ${Math.floor(maxPageCount / 2)}`}
                className="w-32 px-[1.2rem] py-[0.4rem] border border-border rounded-(--border-radius-regular)"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  switchPage(Number(e.currentTarget.value || 1));
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
