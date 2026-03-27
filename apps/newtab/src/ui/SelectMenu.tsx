import { Listbox, Transition } from "@headlessui/react";
import type { ReactNode } from "react";
import { Fragment, useMemo, useRef, useState } from "react";

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  group?: string;
  icon?: ReactNode;
};

type Props<T extends string> = {
  value: T;
  options: Array<SelectOption<T>>;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  buttonClassName?: string;
  menuClassName?: string;
  label?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  showSelectedIcon?: boolean;
};

export function SelectMenu<T extends string>({
  value,
  options,
  onChange,
  size = "md",
  buttonClassName = "",
  menuClassName = "",
  label,
  searchable = false,
  searchPlaceholder = "搜尋",
  showSelectedIcon = true,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const sizeClass = size === "sm" ? "h-9 text-xs" : "py-2 text-xs";

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) {
      return options;
    }
    const lowered = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(lowered));
  }, [options, query, searchable]);

  const groupedOptions = useMemo(() => {
    const map = new Map<string, Array<SelectOption<T>>>();
    filteredOptions.forEach((option) => {
      const group = option.group ?? "";
      const list = map.get(group) ?? [];
      list.push(option);
      map.set(group, list);
    });
    return Array.from(map.entries());
  }, [filteredOptions]);

  return (
    <Listbox value={value} onChange={onChange}>
      {() => (
        <div className="relative">
          {label ? <div className="mb-1 text-zinc-500">{label}</div> : null}
          <Listbox.Button
            className={`flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 ${sizeClass} text-left text-zinc-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 ${buttonClassName}`}
          >
            <span className="flex min-w-0 items-center gap-2">
              {showSelectedIcon && selected?.icon ? (
                <span className="flex h-4 w-4 items-center justify-center text-zinc-500">
                  {selected.icon}
                </span>
              ) : null}
              <span className="truncate">{selected?.label ?? ""}</span>
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 text-zinc-400"
            >
              <path d="M6 9l6 6l6 -6"></path>
            </svg>
          </Listbox.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
            afterEnter={() => {
              if (searchable) {
                inputRef.current?.focus();
              }
            }}
          >
            <Listbox.Options
              className={`absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white py-2 text-xs text-zinc-700 shadow-xl scrollbar-hide ${menuClassName}`}
            >
              {searchable ? (
                <div className="px-3 pb-2">
                  <input
                    ref={inputRef}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
                    placeholder={searchPlaceholder}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              ) : null}
              {groupedOptions.map(([group, items]) => (
                <div key={group || "default"} className="pb-1">
                  {group ? (
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-zinc-400">
                      {group}
                    </div>
                  ) : null}
                  {items.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option.value}
                      className={({ active }) =>
                        `flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 ${
                          active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700"
                        }`
                      }
                    >
                      {({ selected: isSelected }) => (
                        <>
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-700">
                            {isSelected ? "✓" : ""}
                          </span>
                          {option.icon ? (
                            <span className="flex h-4 w-4 items-center justify-center text-zinc-500">
                              {option.icon}
                            </span>
                          ) : null}
                          <span className="truncate">{option.label}</span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </div>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  );
}
