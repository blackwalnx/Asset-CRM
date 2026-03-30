import React from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Spinner, Badge } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { FileSearch } from "lucide-react";

export default function AuditLog() {
  const { data, isLoading } = useListAuditLogs({ limit: 100 });
  const logs = data?.logs || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">Immutable record of system modifications and access.</p>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileSearch className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    No audit records found.
                  </TableCell>
                </TableRow>
              )}
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{formatDateTime(log.timestamp)}</TableCell>
                  <TableCell className="font-medium">{log.userEmail || "System"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-zinc-100">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{log.entityType}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">{log.entityId || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
