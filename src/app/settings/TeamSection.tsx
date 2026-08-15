import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QueryState } from "@/components/shared/QueryState";
import { useAuth } from "@/app/auth/AuthProvider";
import { useMembership } from "@/app/auth/useMembership";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { useTeamMembers } from "./useTeamMembers";

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  operator: "Operador",
  analyst: "Analista",
  viewer: "Visualizador",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  invited: "Convite pendente",
  suspended: "Suspenso",
};

export function TeamSection() {
  const { user } = useAuth();
  const membership = useMembership();
  const team = useTeamMembers();

  const canInvite = membership.data?.role === "owner" || membership.data?.role === "admin";

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold">Equipe</h2>
          <p className="max-w-[56ch] text-sm text-muted-foreground">
            Quem tem acesso à Keystone e com qual papel.
          </p>
        </div>
        {canInvite && (
          <InviteMemberDialog
            trigger={
              <Button size="sm">
                <UserPlus className="size-4" />
                Convidar
              </Button>
            }
          />
        )}
      </div>

      <div className="p-6">
        <QueryState
          isLoading={team.isLoading}
          isError={team.isError}
          error={team.error}
          isEmpty={team.data?.length === 0}
          onRetry={() => team.refetch()}
          emptyTitle="Nenhum membro"
          emptyDescription="Isto não deveria acontecer — toda organização tem ao menos o owner do bootstrap."
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.data?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.fullName ?? (
                      <span className="italic text-muted-foreground">
                        {member.userId === user?.id ? "Você" : "Sem nome — aguardando primeiro acesso"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABEL[member.role] ?? member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {STATUS_LABEL[member.status] ?? member.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </QueryState>
      </div>
    </div>
  );
}
