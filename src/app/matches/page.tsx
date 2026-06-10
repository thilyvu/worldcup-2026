import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { getMatches, getAllPredictions, getPlayers } from "@/lib/queries";
import { MatchesClient } from "@/components/MatchesClient";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const [allMatches, preds, players] = await Promise.all([
    getMatches(),
    getAllPredictions(),
    getPlayers(),
  ]);

  return (
    <MatchesClient
      allMatches={allMatches}
      preds={preds}
      players={players}
      myId={player.id}
    />
  );
}
