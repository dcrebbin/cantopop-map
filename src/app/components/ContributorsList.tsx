import { CONTRIBUTOR_ROLE_GROUPS } from "../common/locations";

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
  return (
    <div className="flex w-full flex-col gap-2 pr-2 text-white">
      {CONTRIBUTOR_ROLE_GROUPS.map((group) => {
        const namesToShow = group.names.filter((n) =>
          filteredContributors.includes(n),
        );
        if (namesToShow.length === 0) return null;
        return (
          <div
            key={`${group.category}-${group.roleKey}`}
            className="flex w-full flex-col gap-1"
          >
            <hr className="my-1 opacity-30" />
            <div className="text-base font-semibold">{group.title}</div>
            {namesToShow.map((contributor) => (
              <div
                key={`${group.category}-${group.roleKey}-${contributor}`}
                className="flex w-full flex-row items-center justify-between gap-2 pr-2"
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-2 text-left hover:underline"
                  onClick={() => handleContributorCheckboxChange(contributor)}
                >
                  <span className="truncate text-sm">{contributor}</span>
                  <input
                    type="checkbox"
                    aria-label={contributor}
                    className="h-4 w-4 cursor-pointer rounded-full border-none p-2"
                    checked={selectedContributors.includes(contributor)}
                    readOnly
                  />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
