import { Token } from "@/lib/types";
import { TokenCard } from "./token-card";
import { Loading } from "./loading";

type Props = {
  tokens: Token[];
  isLoading: boolean;
  onSelect: (token: Token) => void;
};

export function TokenGrid({ tokens, isLoading, onSelect }: Props) {
  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokens.map((token) => (
        <TokenCard
          key={token.id}
          token={token}
          onClick={() => onSelect(token)}
        />
      ))}
    </div>
  );
}
