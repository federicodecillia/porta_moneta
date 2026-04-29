import { getAllMembers, getAllMembersLedger, getAllMembersWithBalances } from "@/lib/db/queries";
import { Card, CardHeader } from "@/components/ui/card";
import { CassaInlineList, TopupForm } from "./cassa-forms";

export async function TabCassa() {
  const [allMembers, membersWithBalances, ledgerByMember] = await Promise.all([
    getAllMembers(),
    getAllMembersWithBalances(),
    getAllMembersLedger(),
  ]);

  const topupMembers = allMembers
    .filter((m) => m.active)
    .map((m) => ({ memberId: m.memberId, fullName: m.fullName }));

  return (
    <div className="space-y-4">
      <TopupForm members={topupMembers} />

      <Card>
        <CardHeader>
          <h3 className="text-[13px] font-bold text-pm-near-black">
            Saldi soci ({membersWithBalances.length})
          </h3>
        </CardHeader>
        <CassaInlineList members={membersWithBalances} ledgerByMember={ledgerByMember} />
      </Card>
    </div>
  );
}
