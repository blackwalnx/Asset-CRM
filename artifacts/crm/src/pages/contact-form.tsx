import React from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateContact, useGetContact, useUpdateContact } from "@workspace/api-client-react";
import { useUserRole } from "@/hooks/use-roles";
import { Button, Input, Select, Textarea, Label, Card, CardContent, CardHeader, CardTitle, Spinner } from "@/components/ui";
import { ArrowLeft, Save } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  designation: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  organization: z.string().min(1, "Organization is required"),
  sector: z.string().min(1, "Sector is required"),
  officialEmail: z.string().email("Invalid email"),
  personalEmail: z.string().email("Invalid email").optional().or(z.literal('')),
  phone: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  relationshipLevel: z.string().optional(),
  sensitivityLevel: z.string().optional(),
  notes: z.string().optional(),
  confidentialNotes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactForm() {
  const [match, params] = useRoute("/contacts/:id/edit");
  const isEdit = match;
  const id = params?.id;
  const [, setLocation] = useLocation();
  const { isAdmin } = useUserRole();

  const { data: contact, isLoading: isLoadingContact } = useGetContact(id || "", { query: { enabled: isEdit } });
  const createMutation = useCreateContact();
  const updateMutation = useUpdateContact();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Government",
      sector: "Public",
      relationshipLevel: "Cold",
      sensitivityLevel: "Public"
    }
  });

  React.useEffect(() => {
    if (isEdit && contact) {
      reset({
        fullName: contact.fullName,
        designation: contact.designation || "",
        category: contact.category,
        organization: contact.organization,
        sector: contact.sector,
        officialEmail: contact.officialEmail,
        personalEmail: contact.personalEmail || "",
        phone: contact.phone || "",
        city: contact.city,
        state: contact.state,
        relationshipLevel: contact.relationshipLevel,
        sensitivityLevel: contact.sensitivityLevel,
        notes: contact.notes || "",
        confidentialNotes: contact.confidentialNotes || "",
      });
    }
  }, [isEdit, contact, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, data });
        setLocation(`/contacts/${id}`);
      } else {
        const newContact = await createMutation.mutateAsync({ data });
        setLocation(`/contacts/${newContact.id}`);
      }
    } catch (err) {
      alert("Failed to save contact");
    }
  };

  if (isEdit && isLoadingContact) return <div className="h-96 flex items-center justify-center"><Spinner /></div>;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <Link href={isEdit ? `/contacts/${id}` : "/contacts"} className="hover:text-foreground flex items-center transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Cancel
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isEdit ? "Edit Contact" : "Add New Contact"}
        </h1>
        <p className="text-muted-foreground mt-1">Enter institutional details accurately.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Full Name *</Label>
              <Input {...register("fullName")} />
              {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <Label>Designation</Label>
              <Input {...register("designation")} />
            </div>
            <div>
              <Label>Organization *</Label>
              <Input {...register("organization")} />
              {errors.organization && <p className="text-sm text-red-500 mt-1">{errors.organization.message}</p>}
            </div>
            <div>
              <Label>Official Email *</Label>
              <Input type="email" {...register("officialEmail")} />
              {errors.officialEmail && <p className="text-sm text-red-500 mt-1">{errors.officialEmail.message}</p>}
            </div>
            <div>
              <Label>Personal Email</Label>
              <Input type="email" {...register("personalEmail")} />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input {...register("phone")} />
            </div>
            <div>
              <Label>City *</Label>
              <Input {...register("city")} />
              {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>}
            </div>
            <div>
              <Label>State/Region *</Label>
              <Input {...register("state")} />
              {errors.state && <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classification</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Category *</Label>
              <Select {...register("category")}>
                <option value="Government">Government</option>
                <option value="Diplomat">Diplomat</option>
                <option value="Academic">Academic</option>
                <option value="Civil Society">Civil Society</option>
                <option value="Corporate">Corporate</option>
                <option value="Journalist">Journalist</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div>
              <Label>Sector *</Label>
              <Select {...register("sector")}>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
                <option value="International">International</option>
                <option value="NGO">NGO</option>
                <option value="Media">Media</option>
                <option value="Academia">Academia</option>
              </Select>
            </div>
            <div>
              <Label>Relationship Level</Label>
              <Select {...register("relationshipLevel")}>
                <option value="Cold">Cold</option>
                <option value="Warm">Warm</option>
                <option value="Hot">Hot</option>
                <option value="Strategic">Strategic</option>
              </Select>
            </div>
            <div>
              <Label>Sensitivity Level</Label>
              <Select {...register("sensitivityLevel")}>
                <option value="Public">Public</option>
                <option value="Internal">Internal</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes & Remarks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Public Notes</Label>
              <Textarea {...register("notes")} className="min-h-[120px]" placeholder="General biographical or situational context..." />
            </div>
            
            {isAdmin && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <Label className="text-red-800 flex items-center gap-2">Confidential Notes (Admin Only)</Label>
                <Textarea {...register("confidentialNotes")} className="min-h-[120px] mt-2 border-red-200 focus-visible:ring-red-500" placeholder="Sensitive strategy or relationship details..." />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href={isEdit ? `/contacts/${id}` : "/contacts"} className="inline-flex items-center justify-center h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm rounded-lg font-medium transition-all">
            Cancel
          </Link>
          <Button type="submit" isLoading={isPending} className="px-8">
            <Save className="mr-2 h-4 w-4" /> Save Record
          </Button>
        </div>
      </form>
    </div>
  );
}
