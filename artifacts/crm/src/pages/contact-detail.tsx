import React from "react";
import { Link, useRoute, useLocation } from "wouter";
import { useGetContact, useListInteractions, useArchiveContact } from "@workspace/api-client-react";
import { useUserRole } from "@/hooks/use-roles";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Spinner } from "@/components/ui";
import { Edit, Trash2, ArrowLeft, Mail, Phone, MapPin, Building, Briefcase, ShieldAlert, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ContactDetail() {
  const [, params] = useRoute("/contacts/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const { isAdmin, canEdit } = useUserRole();

  const { data: contact, isLoading } = useGetContact(id, { query: { enabled: !!id } });
  const { data: interactionsData } = useListInteractions({ contact_id: id } as any); // Simplification for demo
  const archiveMutation = useArchiveContact();

  const handleArchive = async () => {
    if (window.confirm("Are you sure you want to archive this contact?")) {
      await archiveMutation.mutateAsync({ id });
      setLocation("/contacts");
    }
  };

  if (isLoading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>;
  if (!contact) return <div className="text-center py-12">Contact not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href="/contacts" className="hover:text-foreground flex items-center transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Directory
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-xl font-bold font-display ring-1 ring-primary/20">
            {contact.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{contact.fullName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="font-mono text-xs">{contact.contactId}</Badge>
              <Badge variant="secondary">{contact.relationshipLevel}</Badge>
              {contact.archived && <Badge variant="destructive">Archived</Badge>}
            </div>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex items-center gap-3">
            <Link href={`/contacts/${id}/edit`} className="inline-flex items-center justify-center h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm rounded-lg font-medium transition-all">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Link>
            <Button variant="outline" onClick={handleArchive} disabled={archiveMutation.isPending} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Organization</p>
                <p className="text-foreground font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-zinc-400" />
                  {contact.organization}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Designation</p>
                <p className="text-foreground">{contact.designation || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Sector</p>
                <p className="text-foreground">{contact.sector}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Category</p>
                <p className="text-foreground">{contact.category}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Official Email</p>
                <a href={`mailto:${contact.officialEmail}`} className="text-blue-600 hover:underline">{contact.officialEmail}</a>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Personal Email</p>
                {contact.personalEmail ? (
                  <a href={`mailto:${contact.personalEmail}`} className="text-blue-600 hover:underline">{contact.personalEmail}</a>
                ) : "—"}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Phone</p>
                <p className="text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  {contact.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Location</p>
                <p className="text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  {contact.city}, {contact.state}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Public Notes</p>
                <p className="text-foreground whitespace-pre-wrap text-sm bg-zinc-50 p-4 rounded-lg border border-zinc-100">{contact.notes || "No notes available."}</p>
              </div>
              
              {isAdmin && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Confidential Notes
                  </p>
                  <p className="text-zinc-800 whitespace-pre-wrap text-sm bg-red-50/50 p-4 rounded-lg border border-red-100">
                    {contact.confidentialNotes || "No confidential notes."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Policy Domains</p>
                <div className="flex flex-wrap gap-2">
                  {contact.policyDomains?.map(domain => (
                    <Badge key={domain} variant="secondary" className="bg-indigo-50 text-indigo-700">{domain}</Badge>
                  )) || "—"}
                </div>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sensitivity Level</p>
                <p className="font-medium">{contact.sensitivityLevel}</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Verified</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-zinc-400" />
                  {formatDate(contact.lastVerifiedDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Engagement Score</p>
                <div className="w-full bg-zinc-100 rounded-full h-2.5 mt-2">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${Math.min(contact.engagementScore || 0, 100)}%` }}></div>
                </div>
                <p className="text-xs mt-1 text-right">{contact.engagementScore || 0}/100</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Interactions History */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Interaction History</h2>
        </div>
        <Card>
          <div className="divide-y divide-border">
            {(!interactionsData?.interactions || interactionsData.interactions.length === 0) ? (
              <div className="p-8 text-center text-muted-foreground">No interactions recorded.</div>
            ) : (
              interactionsData.interactions.map(interaction => (
                <div key={interaction.id} className="p-4 hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Badge variant="secondary" className="mb-2">{interaction.engagementType}</Badge>
                      <h4 className="font-medium text-foreground">{interaction.outcome}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{formatDate(interaction.date)}</p>
                      <p className="text-xs text-zinc-400 mt-1">by {interaction.createdBy || 'Unknown'}</p>
                    </div>
                  </div>
                  {interaction.notes && <p className="text-sm text-zinc-600 mt-2">{interaction.notes}</p>}
                  {interaction.followUpRequired && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 text-xs rounded-md font-medium border border-orange-100">
                      Follow up due: {formatDate(interaction.followUpDate)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
