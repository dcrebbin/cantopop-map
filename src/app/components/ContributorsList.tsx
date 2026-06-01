import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import {
  CONTRIBUTOR_ROLE_GROUPS,
  type ContributorRoleGroup,
} from "../common/locations";
import { useUIStore } from "../_state/ui.store";

const CONTRIBUTOR_CATEGORIES = [
  { key: "song", title: "Song" },
  { key: "musicVideo", title: "Music Video" },
] as const;
const MAX_SEARCH_CONTRIBUTORS_TO_RENDER = 150;

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
  const [openCategories, setOpenCategories] = useState<
    Record<ContributorCategoryKey, boolean>
  >({
    song: true,
    musicVideo: true,
  });
  const groupsByCategory = useMemo(() => {
    const contributorsToRender =
      filteredContributors.length > MAX_SEARCH_CONTRIBUTORS_TO_RENDER
        ? filteredContributors.slice(0, MAX_SEARCH_CONTRIBUTORS_TO_RENDER)
        : filteredContributors;
    const filteredContributorsSet = new Set(contributorsToRender);

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
  const hiddenContributorCount =
    filteredContributors.length > MAX_SEARCH_CONTRIBUTORS_TO_RENDER
      ? filteredContributors.length - MAX_SEARCH_CONTRIBUTORS_TO_RENDER
      : 0;

  function toggleCategory(category: ContributorCategoryKey) {
    setOpenCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  return (
    <div className="flex w-full flex-col gap-2 pr-2 text-white">
      {hiddenContributorCount > 0 && (
        <p className="rounded-md bg-black/30 p-2 text-sm">
          Showing the first {MAX_SEARCH_CONTRIBUTORS_TO_RENDER} contributors.
          Keep typing to narrow {hiddenContributorCount} more matches.
        </p>
      )}
      {CONTRIBUTOR_CATEGORIES.map((category) => {
        const groupsToShow = groupsByCategory[category.key];
        if (groupsToShow.length === 0) return null;

        return (
          <div
            key={category.key}
            className="flex w-full flex-col gap-2 rounded-md p-2"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 text-left text-base font-semibold"
              aria-expanded={openCategories[category.key]}
              onClick={() => toggleCategory(category.key)}
            >
              <span>{category.title}</span>
              <ChevronDownIcon
                className={`h-5 w-5 transition-transform ${
                  openCategories[category.key] ? "" : "rotate-180"
                }`}
              />
            </button>
            {openCategories[category.key] &&
              groupsToShow.map((group) => (
                <div
                  key={`${group.category}-${group.roleKey}`}
                  className="flex w-full flex-col gap-1"
                >
                  <hr className="my-1 opacity-30" />
                  <div className="text-sm font-semibold">{group.title}</div>
                  {group.namesToShow.map((contributor) => (
                    <div
                      key={`${group.category}-${group.roleKey}-${contributor}`}
                      className="flex w-full flex-row items-center justify-between gap-2 pr-2"
                    >
                      <button
                        type="button"
                        className="text-sm"
                        onClick={() => {
                          updateContributorModalUrl(contributor);
                          setSelectedContributor(contributor);
                          setMenuOpen(false);
                        }}
                      >
                        <UserCircleIcon className="size-6" />
                      </button>
                      <button
                        type="button"
                        className="flex w-full cursor-pointer items-center justify-between gap-2 text-left hover:underline"
                        onClick={() =>
                          handleContributorCheckboxChange(contributor)
                        }
                      >
                        <span className="truncate text-sm">{contributor}</span>
                        <input
                          type="checkbox"
                          aria-label={contributor}
                          className="size-4 cursor-pointer rounded-full border-none p-2"
                          checked={selectedContributors.includes(contributor)}
                          readOnly
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
