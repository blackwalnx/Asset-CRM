import { useAuth } from "@workspace/replit-auth-web";
import { Button, Card, CardContent } from "@/components/ui";
import { Shield } from "lucide-react";
import { Redirect } from "wouter";

export default function Login() {
  const { login, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`} 
          alt="Abstract Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Subtle overlay gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-white/95 backdrop-blur-xl border-white/20 shadow-2xl shadow-black/50">
          <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-black/5">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-10 h-10" />
            </div>
            
            <h1 className="text-2xl font-display font-bold text-zinc-900 tracking-tight mb-2">
              Think Tank CRM
            </h1>
            <p className="text-sm text-zinc-500 mb-8 max-w-xs">
              Secure institutional access. Please authenticate to access policy networks and engagement logs.
            </p>

            <Button 
              onClick={() => login()} 
              size="lg" 
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl shadow-lg shadow-zinc-900/20"
            >
              <Shield className="mr-2 h-5 w-5" />
              Institutional Log In
            </Button>
            
            <div className="mt-8 text-xs text-zinc-400 flex items-center justify-center gap-4">
              <span>Secure Connection</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
              <span>Authorized Personnel Only</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
