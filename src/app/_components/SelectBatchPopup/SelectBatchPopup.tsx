"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./SelectBatchPopup.module.scss";
import Spinner from "@/components/Spinner/Spinner";
import {
  getTodaysBatches,
  searchBatches,
  createNewBatch,
} from "@/actions/batch-actions";

// MARK: Types

interface PopupProps {
  onClose: () => void;
  onSelectBatch: (batchNumber: string) => void;
}

// MARK: Constants

const MAX_SEARCH_RESULTS = 12;

export default function SelectBatchPopup({
  onClose,
  onSelectBatch,
}: PopupProps) {
  // MARK: Refs

  const popupRef = useRef<HTMLDivElement>(null);

  // MARK: State

  const [inputValue, setInputValue] = useState("");
  const [todayBatches, setTodayBatches] = useState<{ batch_number: string }[]>(
    [],
  );
  const [searchResults, setSearchResults] = useState<
    { batch_number: string }[]
  >([]);

  const [isTodayLoading, setIsTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState("");
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  const [previousSearchQuery, setPreviousSearchQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // MARK: Effects

  useEffect(() => {
    const fetchToday = async () => {
      setIsTodayLoading(true);
      setTodayError("");
      const response = await getTodaysBatches();
      if (response.success && response.data) {
        setTodayBatches(response.data);
      } else {
        setTodayError(
          "An error occurred while fetching today's batches. Please try again later. If the error persists, please contact IT support.",
        );
      }
      setIsTodayLoading(false);
    };
    fetchToday();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // MARK: Event handlers

  const handleSearch = async () => {
    const query = inputValue.trim();
    if (!query || query === previousSearchQuery) return;

    if (!/^\d+$/.test(query)) {
      setIsError(true);
      setSearchMessage("Please enter a number to search");
      return;
    }

    setIsError(false);
    setSearchMessage("");
    setIsSearchLoading(true);
    setSearchResults([]);

    const response = await searchBatches(query);

    if (!response.success) {
      setIsError(true);
      setSearchMessage(
        response.error ||
          "An error occurred while searching batches. Please try again later. If the error persists, please contact IT support.",
      );
      setIsSearchLoading(false);
      return;
    }
    const results = response.data || [];
    setPreviousSearchQuery(query);
    setSearchResults(results);
    setIsSearchLoading(false);

    if (results.length === 0) {
      setSearchMessage("No results found");
    } else if (results.length === 1) {
      setSearchMessage("Showing 1 result");
    } else if (results.length <= MAX_SEARCH_RESULTS) {
      setSearchMessage(`Showing ${results.length} results`);
    } else {
      setSearchMessage(
        `Showing first ${MAX_SEARCH_RESULTS} of ${results.length} results`,
      );
    }
  };

  const handleCreate = async () => {
    const query = inputValue.trim();
    if (!query) return;

    if (!/^\d{6}$/.test(query)) {
      setIsError(true);
      setSearchMessage("Valid batch number is a 6-digit number");
      return;
    }

    setIsError(false);
    setSearchMessage("");
    setIsSearchLoading(true);

    const searchResponse = await searchBatches(query);

    if (!searchResponse.success) {
      setIsError(true);
      setSearchMessage(
        "An error occurred while verifying the batch number. Please try again later. If the error persists, please contact IT support.",
      );
      setIsSearchLoading(false);
      return;
    }

    const existing = searchResponse.data || [];
    const exactMatch = existing.find((b) => b.batch_number === query);

    if (exactMatch) {
      setIsError(true);
      setSearchMessage("Batch number already exists");
      setSearchResults(existing);
      setIsSearchLoading(false);
      return;
    }

    const result = await createNewBatch(query);

    if (!result.success) {
      setIsError(true);
      setSearchMessage(
        "An error occurred while creating a new batch. Please try again later. If the error persists, please contact IT support.",
      );
      setIsSearchLoading(false);
      return;
    }

    setSearchMessage("Batch created successfully");
    setSearchResults([{ batch_number: query }]);
    setIsSearchLoading(false);

    const newTodayResponse = await getTodaysBatches();
    if (newTodayResponse.success && newTodayResponse.data) {
      setTodayBatches(newTodayResponse.data);
    }
  };

  // MARK: Derived values

  const displayedResults = searchResults.slice(0, MAX_SEARCH_RESULTS);

  // MARK: HTML

  return (
    <div className={styles.popup} ref={popupRef}>
      {/* MARK: Header */}
      <div className="flex justify-between items-center pl-4 border-b border-border bg-gray-200">
        <span className="text-2xl">Select or create batch</span>
        <button
          onClick={onClose}
          className="btn bg-primary! px-6! py-2! text-5xl! font-extralight! rounded-none! border-0! border-l!"
        >
          X
        </button>
      </div>

      <div className="p-4.5">
        {/* MARK: Search & create form */}
        <div className="flex gap-3 pb-4">
          <input
            id="batchInput"
            type="text"
            className="input p-2 w-68"
            placeholder="Batch number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button onClick={handleSearch} className="btn btn--color-neutral">
            Search
          </button>
          <button onClick={handleCreate} className="btn btn--color-neutral">
            Create new batch
          </button>
        </div>

        {/* MARK: Search results */}
        {!isSearchLoading ? (
          <>
            {searchMessage && (
              <p className={`${isError ? "text-red-600" : ""} pb-4 pl-2`}>
                {searchMessage}
              </p>
            )}
            {displayedResults.length > 0 && (
              <ul className="flex flex-wrap gap-4 p-0 m-0 list-none">
                {displayedResults.map((batch) => (
                  <li key={batch.batch_number}>
                    <button
                      onClick={() => onSelectBatch(batch.batch_number)}
                      className="btn btn--color-primary w-40"
                    >
                      {batch.batch_number}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="pl-8 pt-4">
            <Spinner size={40} />
          </div>
        )}

        {/* MARK: Today's batches */}
        <p className="font-semibold py-4">Today&apos;s batches:</p>

        {todayError ? (
          <p className="text-red-600 pl-2">{todayError}</p>
        ) : !isTodayLoading ? (
          <ul className="flex flex-wrap gap-4 p-0 m-0 list-none">
            {todayBatches.length > 0 ? (
              todayBatches.map((batch) => (
                <li key={batch.batch_number}>
                  <button
                    onClick={() => onSelectBatch(batch.batch_number)}
                    className="btn btn--color-primary w-40"
                  >
                    {batch.batch_number}
                  </button>
                </li>
              ))
            ) : (
              <li className="pl-2">No batches found today</li>
            )}
          </ul>
        ) : (
          <div className="pl-8">
            <Spinner size={30} />
          </div>
        )}
      </div>
    </div>
  );
}
