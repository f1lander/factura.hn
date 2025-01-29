import { SearchIcon } from "lucide-react";

interface Props {
  searchText: string;
  searchPlaceholder?: string;
  onFilterTextBoxChanged: (event: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
  className?: string;
}

export const SearchBoxComponent: React.FC<Props> = ({
  searchText,
  searchPlaceholder,
  onFilterTextBoxChanged,
  children,
  className,
}) => {
  return (
    <div className={className || "relative w-1/3"}>
      <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-900" />
      <input
        type="text"
        value={searchText}
        placeholder={searchPlaceholder ? searchPlaceholder : "Buscar..."}
        onInput={onFilterTextBoxChanged}
        className="h-9 w-full rounded-md border px-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
      />
      {children}
    </div>
  );
};