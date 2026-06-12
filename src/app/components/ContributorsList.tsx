"use client";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  CONTRIBUTOR_ROLE_GROUPS,
  type ContributorRoleGroup,
} from "../common/locations";
import { useUIStore } from "../_state/ui.store";

const CONTRIBUTOR_CATEGORIES = [
  { key: "song", title: "Song" },
  { key: "musicVideo", title: "Music Video" },
] as const;

function updateContributorModalUrl(contributor: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete("title");
  url.searchParams.delete("view-credits");
  url.searchParams.set("selected-contributor", contributor);
  url.searchParams.set("view-portfolio", "true");
  window.history.replaceState({}, "", url.toString());
}

type ContributorCategoryKey = (typeof CONTRIBUTOR_CATEGORIES)[number]["key"];
type ContributorRoleGroupWithMatches = ContributorRoleGroup & {
  namesToShow: string[];
};

type FlatItem =
  | {
      type: "category";
      key: ContributorCategoryKey;
      title: string;
      open: boolean;
    }
  | {
      type: "group";
      categoryKey: ContributorCategoryKey;
      roleKey: string;
      title: string;
    }
  | {
      type: "contributor";
      categoryKey: ContributorCategoryKey;
      roleKey: string;
      name: string;
    };

interface ContributorsListProps {
  filteredContributors: string[];
  selectedContributors: string[];
  handleContributorCheckboxChange: (contributor: string) => void;
}

export default function ContributorsList({
  filteredContributors,
  selectedContributors,
  handleContributorCheckboxChange,
}: ContributorsListProps) {
  const { setSelectedContributor, setMenuOpen } = useUIStore();
  const [isMounted, setIsMounted] = useState(false);
  const [openCategories, setOpenCategories] = useState<
    Record<ContributorCategoryKey, boolean>
  >({
    song: true,
    musicVideo: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(0);
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !containerRef.current) return;

    let parent = containerRef.current.parentElement;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        break;
      }
      parent = parent.parentElement;
    }

    const target = parent ?? document.documentElement;
    setScrollParent(target);

    setScrollTop(target.scrollTop);
    setClientHeight(target.clientHeight || window.innerHeight);

    const handleScroll = () => {
      setScrollTop(target.scrollTop);
    };

    const handleResize = () => {
      setClientHeight(target.clientHeight || window.innerHeight);
    };

    target.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      target.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMounted]);

  const groupsByCategory = useMemo(() => {
    const filteredContributorsSet = new Set(filteredContributors);

    return CONTRIBUTOR_CATEGORIES.reduce(
      (acc, category) => {
        acc[category.key] = CONTRIBUTOR_ROLE_GROUPS.reduce<
          ContributorRoleGroupWithMatches[]
        >((groups, group) => {
          if (group.category !== category.key) return groups;

          const namesToShow = group.names.filter((name) =>
            filteredContributorsSet.has(name),
          );
          if (namesToShow.length === 0) return groups;

          groups.push({ ...group, namesToShow });
          return groups;
        }, []);
        return acc;
      },
      { song: [], musicVideo: [] } as Record<
        ContributorCategoryKey,
        ContributorRoleGroupWithMatches[]
      >,
    );
  }, [filteredContributors]);

  function toggleCategory(category: ContributorCategoryKey) {
    setOpenCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];

    for (const category of CONTRIBUTOR_CATEGORIES) {
      const groupsToShow = groupsByCategory[category.key];
      if (groupsToShow.length === 0) continue;

      const isOpen = openCategories[category.key];

      items.push({
        type: "category",
        key: category.key,
        title: category.title,
        open: isOpen,
      });

      if (isOpen) {
        for (const group of groupsToShow) {
          items.push({
            type: "group",
            categoryKey: category.key,
            roleKey: group.roleKey,
            title: group.title,
          });

          for (const contributor of group.namesToShow) {
            items.push({
              type: "contributor",
              categoryKey: category.key,
              roleKey: group.roleKey,
              name: contributor,
            });
          }
        }
      }
    }

    return items;
  }, [groupsByCategory, openCategories]);

  useEffect(() => {
    if (!isMounted || !containerRef.current || !scrollParent) return;

    const updateOffset = () => {
      if (!containerRef.current || !scrollParent) return;
      const rect = containerRef.current.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      const parentTop =
        scrollParent === document.documentElement ? 0 : parentRect.top;
      setOffsetTop(rect.top - parentTop + scrollParent.scrollTop);
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);
    scrollParent.addEventListener("scroll", updateOffset, { passive: true });

    return () => {
      window.removeEventListener("resize", updateOffset);
      scrollParent.removeEventListener("scroll", updateOffset);
    };
  }, [isMounted, scrollParent, flatItems.length]);

  const ITEM_HEIGHT = 36;
  const OVERSCAN = 15;

  const relativeScrollTop = Math.max(0, scrollTop - offsetTop);

  const startIndex = Math.max(
    0,
    Math.floor(relativeScrollTop / ITEM_HEIGHT) - OVERSCAN,
  );
  const endIndex = Math.min(
    flatItems.length - 1,
    Math.ceil((relativeScrollTop + clientHeight) / ITEM_HEIGHT) + OVERSCAN,
  );

  const visibleItems = useMemo(() => {
    return flatItems.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [flatItems, startIndex, endIndex]);

  const totalHeight = flatItems.length * ITEM_HEIGHT;

  if (!isMounted) {
    return (
      <div className="flex w-full items-center justify-center py-4 text-white">
        <div className="animate-pulse">Loading contributors…</div>
      </div>
    );
  }

  if (flatItems.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-white/70">
        No contributors found.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full text-white"
      style={{ height: `${totalHeight}px` }}
    >
      {visibleItems.map(({ item, index }) => {
        const top = index * ITEM_HEIGHT;
        return (
          <div
            key={
              item.type === "category"
                ? `cat-${item.key}`
                : item.type === "group"
                  ? `grp-${item.categoryKey}-${item.roleKey}`
                  : `item-${item.categoryKey}-${item.roleKey}-${item.name}`
            }
            className="absolute left-0 right-0"
            style={{
              top: `${top}px`,
              height: `${ITEM_HEIGHT}px`,
            }}
          >
            {item.type === "category" && (
              <div className="flex h-9 w-full items-center justify-between px-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left text-base font-semibold"
                  aria-expanded={item.open}
                  onClick={() => toggleCategory(item.key)}
                >
                  <span>{item.title}</span>
                  <ChevronDownIcon
                    className={`h-5 w-5 transition-transform ${
                      item.open ? "" : "rotate-180"
                    }`}
                  />
                </button>
              </div>
            )}

            {item.type === "group" && (
              <div className="flex h-9 w-full flex-col justify-center px-2">
                <hr className="opacity-30" />
                <div className="mt-0.5 text-sm font-semibold">{item.title}</div>
              </div>
            )}

            {item.type === "contributor" && (
              <div className="flex h-9 w-full flex-row items-center justify-between gap-2 px-2">
                <button
                  type="button"
                  className="flex items-center text-sm"
                  onClick={() => {
                    updateContributorModalUrl(item.name);
                    setSelectedContributor(item.name);
                    setMenuOpen(false);
                  }}
                >
                  <UserCircleIcon className="size-6" />
                </button>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-2 text-left hover:underline"
                  onClick={() => handleContributorCheckboxChange(item.name)}
                >
                  <span className="truncate text-sm">{item.name}</span>
                  <input
                    type="checkbox"
                    aria-label={item.name}
                    className="size-4 cursor-pointer rounded-full border-none p-2"
                    checked={selectedContributors.includes(item.name)}
                    readOnly
                  />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
