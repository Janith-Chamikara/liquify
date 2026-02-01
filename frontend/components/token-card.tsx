import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Token } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

type Props = {
  token: Token;
  onClick: () => void;
};

export function TokenCard({ token, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer p-3 hover:shadow-md transition flex   gap-3 items-center"
    >
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={token.imageUrl} />
        <AvatarFallback>{token.symbol[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate">{token.name}</p>
          <span className="text-xs text-muted-foreground">${token.symbol}</span>
        </div>

        <div className="text-xs text-muted-foreground flex gap-3 mt-0.5">
          <span>Supply: {formatNumber(token.supply)}</span>
          {token.isListed && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Listed
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
