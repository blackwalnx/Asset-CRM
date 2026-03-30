import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitContact } from "@workspace/api-client-react";
import { Button, Input, Textarea, Label, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { CheckCircle2, ShieldCheck } from "lucide-react";

const submitSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  organization: z.string().min(1, "Organization is required"),
  designation: z.string().optional(),
  officialEmail: z.string().email("Valid email required"),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
});

type SubmitValues = z.infer<typeof submitSchema>;

export default function Submit() {
  const submitMutation = useSubmitContact();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SubmitValues>({
    resolver: zodResolver(submitSchema)
  });

  const onSubmit = async (data: SubmitValues) => {
    try {
      await submitMutation.mutateAsync({ data });
      setIsSuccess(true);
    } catch {
      alert("Submission failed. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center max-w-lg mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-display font-bold text-foreground">Submission Received</h2>
        <p className="text-muted-foreground">Thank you for submitting this contact profile. It will be reviewed by our team and added to the institutional directory.</p>
        <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-8">Submit Another</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Contact Submission Portal</h1>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Use this form to propose new contacts for the institutional directory. All submissions go through a vetting process.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-lg shadow-black/5 border-zinc-200/60 overflow-hidden">
          <div className="h-2 bg-primary w-full" />
          <CardContent className="p-8 space-y-6">
            
            <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg mb-6 border border-blue-100">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p>This is a secure form. Submissions are processed confidentially by the administration team.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Full Name *</Label>
                <Input {...register("fullName")} placeholder="Jane Doe" className="mt-1" />
                {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>}
              </div>
              <div>
                <Label>Official Email *</Label>
                <Input type="email" {...register("officialEmail")} placeholder="jane.doe@organization.org" className="mt-1" />
                {errors.officialEmail && <p className="text-sm text-red-500 mt-1">{errors.officialEmail.message}</p>}
              </div>
              <div>
                <Label>Organization *</Label>
                <Input {...register("organization")} placeholder="Ministry of..." className="mt-1" />
                {errors.organization && <p className="text-sm text-red-500 mt-1">{errors.organization.message}</p>}
              </div>
              <div>
                <Label>Designation / Title</Label>
                <Input {...register("designation")} placeholder="Director General" className="mt-1" />
              </div>
              <div>
                <Label>City</Label>
                <Input {...register("city")} placeholder="London" className="mt-1" />
              </div>
              <div>
                <Label>State / Country</Label>
                <Input {...register("state")} placeholder="UK" className="mt-1" />
              </div>
            </div>

            <div className="pt-4">
              <Label>Context / Why add this contact?</Label>
              <Textarea {...register("notes")} className="mt-1 min-h-[100px]" placeholder="Met at the G7 summit, handles trade policy..." />
            </div>

            <div className="pt-6 border-t flex justify-end">
              <Button type="submit" size="lg" isLoading={submitMutation.isPending} className="w-full sm:w-auto px-10">
                Submit Profile
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
