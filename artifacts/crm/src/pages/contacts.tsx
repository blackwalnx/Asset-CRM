import React from "react";
import { Link } from "wouter";
import { useListContacts } from "@workspace/api-client-react";
import { useUserRole } from "@/hooks/use-roles";
import { 
  Button, Input, Select, Badge, Card, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Spinner 
} from "@/components/ui";
import { Search, Plus, ExternalLink, AlertTriangle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function Contacts() {
  const { canEdit } = useUserRole();
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  
  const { data, isLoading } = useListContacts({
    query: {
      queryKey: ["/api/contacts", { search, category }] // Trigger re-fetch on filter change
    },
    request: {
      // Re-map params to send to Orval
      // (Using simple state debounce in a real app, keeping simple here)
    }
  });

  const getRelationshipBadge = (level: string) => {
    switch (level) {
      case 'Cold': return <Badge variant="outline" className="text-slate-500">Cold</Badge>;
      case 'Warm': return <Badge variant="warning">Warm</Badge>;
      case 'Hot': return <Badge variant="default" className="bg-orange-500">Hot</Badge>;
      case 'Strategic': return <Badge variant="default" className="bg-indigo-600">Strategic</Badge>;
      default: return <Badge variant="outline">{level}</Badge>;
    }
  };

  const isAging = (dateStr?: string | null) => {
    if (!dateStr) return true;
    const days = (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24);
    return days > 180;
  };

  // Basic client side filtering since we didn't wire the exact query params fully to the hook's params argument above
  const filteredContacts = data?.contacts?.filter(c => {
    if (search && !c.fullName.toLowerCase().includes(search.toLowerCase()) && !c.organization.toLowerCase().includes(search.toLowerCase())) return false;
    if (category && c.category !== category) return false;
    return !c.archived;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Network Contacts</h1>
          <p className="text-muted-foreground mt-1">Manage institutional relationships and details.</p>
        </div>
        {canEdit && (
          <Link href="/contacts/new" className="inline-flex items-center justify-center h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm rounded-lg font-medium transition-all">
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Link>
        )}
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or organization..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Government">Government</option>
            <option value="Diplomat">Diplomat</option>
            <option value="Academic">Academic</option>
            <option value="Civil Society">Civil Society</option>
            <option value="Corporate">Corporate</option>
            <option value="Journalist">Journalist</option>
            <option value="Other">Other</option>
          </Select>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Last Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No contacts found.
                  </TableCell>
                </TableRow>
              )}
              {filteredContacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{contact.contactId}</TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{contact.fullName}</div>
                    <div className="text-xs text-muted-foreground">{contact.designation}</div>
                  </TableCell>
                  <TableCell>{contact.organization}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{contact.category}</Badge>
                  </TableCell>
                  <TableCell>{getRelationshipBadge(contact.relationshipLevel)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{formatDate(contact.lastVerifiedDate)}</span>
                      {isAging(contact.lastVerifiedDate) && (
                        <AlertTriangle className="h-4 w-4 text-red-500" title="Data hasn't been verified in 180+ days" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/contacts/${contact.id}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-zinc-100 text-zinc-600 transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
