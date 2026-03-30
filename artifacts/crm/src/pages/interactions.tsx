import React from "react";
import { useListInteractions } from "@workspace/api-client-react";
import { Button, Card, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Spinner } from "@/components/ui";
import { Plus, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Interactions() {
  const { data, isLoading } = useListInteractions({});

  const interactions = data?.interactions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Interaction Log</h1>
          <p className="text-muted-foreground mt-1">Chronological record of all institutional engagements.</p>
        </div>
        <Button className="shrink-0" disabled title="Use Contact detail page to log interactions currently">
          <Plus className="mr-2 h-4 w-4" /> Log Engagement
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Follow Up</TableHead>
                <TableHead>Logged By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No interactions logged yet.
                  </TableCell>
                </TableRow>
              )}
              {interactions.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{formatDate(log.date)}</TableCell>
                  <TableCell className="font-medium text-primary">{log.contactName || log.contactId}</TableCell>
                  <TableCell><Badge variant="secondary">{log.engagementType}</Badge></TableCell>
                  <TableCell className="max-w-xs truncate" title={log.outcome}>{log.outcome}</TableCell>
                  <TableCell>{log.policyDomain}</TableCell>
                  <TableCell>
                    {log.followUpRequired ? (
                      <div className="flex items-center gap-1.5 text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-md w-max border border-orange-100">
                        <Clock className="h-3 w-3" /> Due: {formatDate(log.followUpDate)}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> None
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.createdBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
