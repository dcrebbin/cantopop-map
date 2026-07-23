"use client";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useReducer, useEffect, useRef } from "react";
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

type ContributorsListState = {
  isMounted: boolean;
  openCategories: Record<ContributorCategoryKey, boolean>;
  scrollParent: HTMLElement | null;
  scrollTop: number;
  clientHeight: number;
  offsetTop: number;
};

type ContributorsListAction =
  | { type: "MOUNT" }
  | { type: "TOGGLE_CATEGORY"; category: ContributorCategoryKey }
  | {
      type: "INIT_SCROLL";
      scrollParent: HTMLElement;
      scrollTop: number;
      clientHeight: number;
    }
  | { type: "SCROLL"; scrollTop: number }
  | { type: "RESIZE"; clientHeight: number }
  | { type: "UPDATE_OFFSET"; offsetTop: number };

const initialContributorsListState: ContributorsListState = {
  isMounted: false,
  openCategories: {
    song: true,
    musicVideo: true,
  },
  scrollParent: null,
  scrollTop: 0,
  clientHeight: 0,
  offsetTop: 0,
};

function contributorsListReducer(
  state: ContributorsListState,
  action: ContributorsListAction,
): ContributorsListState {
  switch (action.type) {
    case "MOUNT":
      return { ...state, isMounted: true };
    case "TOGGLE_CATEGORY":
      return {
        ...state,
        openCategories: {
          ...state.openCategories,
          [action.category]: !state.openCategories[action.category],
        },
      };
    case "INIT_SCROLL":
      return {
        ...state,
        scrollParent: action.scrollParent,
        scrollTop: action.scrollTop,
        clientHeight: action.clientHeight,
      };
    case "SCROLL":
      return { ...state, scrollTop: action.scrollTop };
    case "RESIZE":
      return { ...state, clientHeight: action.clientHeight };
    case "UPDATE_OFFSET":
      return { ...state, offsetTop: action.offsetTop };
    default:
      return state;
  }
}

export default function ContributorsList({
  filteredContributors,
  selectedContributors,
  handleContributorCheckboxChange,
}: ContributorsListProps) {
  const { setSelectedContributor, setMenuOpen } = useUIStore();
  const [state, dispatch] = useReducer(
    contributorsListReducer,
    initialContributorsListState,
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch({ type: "MOUNT" });
  }, []);

  useEffect(() => {
    if (!state.isMounted || !containerRef.current) return;

    let parent = containerRef.current.parentElement;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === "auto" || overflowY === "scroll") {
        break;
      }
      parent = parent.parentElement;
    }

    const target = parent ?? document.documentElement;
    dispatch({
      type: "INIT_SCROLL",
      scrollParent: target,
      scrollTop: target.scrollTop,
      clientHeight: target.clientHeight || window.innerHeight,
    });

    const handleScroll = () => {
      dispatch({ type: "SCROLL", scrollTop: target.scrollTop });
    };

    const handleResize = () => {
      dispatch({
        type: "RESIZE",
        clientHeight: target.clientHeight || window.innerHeight,
      });
    };

    target.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      target.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [state.isMounted]);

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
    dispatch({ type: "TOGGLE_CATEGORY", category });
  }

  const flatItems = useMemo(() => {
    const items: FlatItem[] = [];

    for (const category of CONTRIBUTOR_CATEGORIES) {
      const groupsToShow = groupsByCategory[category.key];
      if (groupsToShow.length === 0) continue;

      const isOpen = state.openCategories[category.key];

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
  }, [groupsByCategory, state.openCategories]);

  useEffect(() => {
    if (!state.isMounted || !containerRef.current || !state.scrollParent) return;

    const updateOffset = () => {
      if (!containerRef.current || !state.scrollParent) return;
      const rect = containerRef.current.getBoundingClientRect();
      const parentRect = state.scrollParent.getBoundingClientRect();
      const parentTop =
        state.scrollParent === document.documentElement ? 0 : parentRect.top;
      dispatch({
        type: "UPDATE_OFFSET",
        offsetTop: rect.top - parentTop + state.scrollParent.scrollTop,
      });
    };

    updateOffset();
    window.addEventListener("resize", updateOffset);
    state.scrollParent.addEventListener("scroll", updateOffset, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", updateOffset);
      state.scrollParent?.removeEventListener("scroll", updateOffset);
    };
  }, [state.isMounted, state.scrollParent, flatItems.length]);

  const ITEM_HEIGHT = 36;
  const OVERSCAN = 15;

  const relativeScrollTop = Math.max(0, state.scrollTop - state.offsetTop);

  const startIndex = Math.max(
    0,
    Math.floor(relativeScrollTop / ITEM_HEIGHT) - OVERSCAN,
  );
  const endIndex = Math.min(
    flatItems.length - 1,
    Math.ceil((relativeScrollTop + state.clientHeight) / ITEM_HEIGHT) +
      OVERSCAN,
  );

  const visibleItems = useMemo(() => {
    return flatItems.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [flatItems, startIndex, endIndex]);

  const totalHeight = flatItems.length * ITEM_HEIGHT;

  if (!state.isMounted) {
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
