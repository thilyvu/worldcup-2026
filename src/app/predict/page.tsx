import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/auth";
import { getMatches, getPredictionsForPlayer } from "@/lib/queries";
import { PredictClient } from "@/components/PredictClient";
import type { Pick } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PredictPage() {
  const player = await getCurrentPlayer();
  if (!player) redirect("/login");

  const [allMatches, predMap] = await Promise.all([
    getMatches(),
    getPredictionsForPlayer(player.id),
  ]);

  const predEntries: [string, Pick][] = [...predMap.entries()];

  return <PredictClient allMatches={allMatches} predEntries={predEntries} />;
}
