import React from "react";
import { useListUsers, useUpdateUserRole } from "@workspace/api-client-react";
import { Button, Card, Badge, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Spinner } from "@/components/ui";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Admin() {
  const { data, isLoading } = useListUsers();
  const updateRoleMutation = useUpdateUserRole();

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateRoleMutation.mutateAsync({ id, data: { role } });
    } catch {
      alert("Failed to update user role");
    }
  };

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Control access levels and permissions for the CRM.</p>
        </div>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-3 py-1.5 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Highly Restricted Area
        </Badge>
      </div>

      <Card>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-48 text-right">Role Assignment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{user.id}</div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant="success" className="bg-green-100 text-green-800">{user.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select 
                      defaultValue={user.role} 
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updateRoleMutation.isPending}
                      className="w-full sm:w-40 text-left bg-zinc-50 border-zinc-200 h-9"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="contributor">Contributor</option>
                      <option value="associate">Associate</option>
                      <option value="fellow">Fellow</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl mt-8 flex items-start gap-4">
        <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-blue-900">Role Capabilities</h4>
          <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc pl-4">
            <li><strong>Super Admin / Admin:</strong> Full access including confidential notes and user management.</li>
            <li><strong>Fellow / Associate:</strong> View, create, and edit directory and interactions. No confidential access.</li>
            <li><strong>Contributor:</strong> Can only access the contact submission form.</li>
            <li><strong>Viewer:</strong> Read-only access to standard fields.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
