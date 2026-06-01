import { useEffect, useState } from "react";
import { useNavigate as useRawNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Sparkles, ArrowRight, Zap, Shield, Users, Mail, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authApi } from "../api/auth";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "@/context/CompanyContext";
import { companiesApi } from "../api/companies";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LandingPage() {
  const navigate = useRawNavigate();
  const queryClient = useQueryClient();
  const { companies, loading: companiesLoading } = useCompany();

  // Dialog & Form States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSocialPending, setIsSocialPending] = useState<"google" | "samsung" | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    const isSignedOut = localStorage.getItem("signed-out") === "true";
    if (isSignedOut) return;

    if (!isLoading && !companiesLoading && session && companies && companies.length > 0) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, isLoading, companies, companiesLoading, navigate]);

  // Sign In / Sign Up Mutations
  const authMutation = useMutation({
    mutationFn: async () => {
      if (authMode === "sign_in") {
        // Step 1: Check if email exists
        const exists = await authApi.checkEmail(email.trim());
        if (!exists) {
          throw new Error("Email address not registered");
        }
        // Step 2: Try signing in
        try {
          await authApi.signInEmail({ email: email.trim(), password });
        } catch (err) {
          throw new Error("Incorrect password. Please try again.");
        }
      } else {
        await authApi.signUpEmail({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }
    },
    onSuccess: async () => {
      setError(null);
      setIsAuthOpen(false);
      // Invalidate and fetch the fresh queries
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
      await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      
      const refreshedSession = await queryClient.fetchQuery({
        queryKey: queryKeys.auth.session,
        queryFn: () => authApi.getSession(),
      });

      if (refreshedSession) {
        try {
          const activeCompanies = await companiesApi.list();
          if (activeCompanies.length === 0) {
            navigate("/onboarding", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } catch {
          navigate("/dashboard", { replace: true });
        }
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Authentication failed");
    },
  });

  const handleSocialAuth = async (provider: "google" | "samsung") => {
    setIsSocialPending(provider);
    setError(null);

    // Setup a listener for the popup message
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "social-auth-success" && event.data?.provider === provider) {
        window.removeEventListener("message", handleMessage);
        
        const socialEmail = event.data.email || `${provider}-user@${provider}.com`;
        const socialName = event.data.name || `${provider === "google" ? "Google" : "Samsung"} User`;
        const mockPassword = "SecurePassword123!";

        // Run the authentication registration/login
        try {
          // Real signup/signin
          try {
            await authApi.signUpEmail({
              name: socialName,
              email: socialEmail,
              password: mockPassword,
            });
          } catch (err) {
            try {
              await authApi.signInEmail({
                email: socialEmail,
                password: mockPassword,
              });
            } catch (signInErr) {
              setError("Social login failed. Please try again.");
              setIsSocialPending(null);
              return;
            }
          }

          // Success flow
          setIsSocialPending(null);
          setIsAuthOpen(false);
          await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
          await queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });

          const refreshedSession = await queryClient.fetchQuery({
            queryKey: queryKeys.auth.session,
            queryFn: () => authApi.getSession(),
          });

          if (refreshedSession) {
            try {
              const activeCompanies = await companiesApi.list();
              if (activeCompanies.length === 0) {
                navigate("/onboarding", { replace: true });
              } else {
                navigate("/dashboard", { replace: true });
              }
            } catch {
              navigate("/dashboard", { replace: true });
            }
          }
        } catch (e) {
          setError("Authentication failed.");
          setIsSocialPending(null);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Open the premium brand popup
    const popup = window.open("", "_blank", "width=500,height=600,left=100,top=100");
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Sign in with ${provider === "google" ? "Google" : "Samsung"}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { background: #1e293b; border: 1px solid #334155; padding: 2.5rem; border-radius: 1rem; width: 320px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); text-align: center; }
              .logo-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
              .logo { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: ${provider === "google" ? "#ffffff" : "#0c4da2"}; padding: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
              .title { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem; }
              .desc { font-size: 0.875rem; color: #94a3b8; margin-bottom: 2rem; }
              .input-container { text-align: left; width: 100%; margin-bottom: 1.5rem; }
              .label { font-size: 0.75rem; font-weight: bold; color: #94a3b8; margin-bottom: 0.5rem; display: block; }
              .input { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #475569; background: #0f172a; color: white; box-sizing: border-box; outline: none; transition: border 0.2s; }
              .input:focus { border-color: ${provider === "google" ? "#ea4335" : "#0c4da2"}; }
              .btn { width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: none; background: ${provider === "google" ? "#ea4335" : "#0c4da2"}; color: white; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 0.875rem; }
              .btn:hover { opacity: 0.95; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="logo-container">
                <div class="logo">
                  ${provider === "google" ? `
                    <svg viewBox="0 0 24 24" width="32" height="32">
                      <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.37 7.56l3.86 3c.95-2.85 3.63-4.52 6.77-4.52z"/>
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.57l3.73 2.89c2.18-2 3.7-4.96 3.7-8.61z"/>
                      <path fill="#FBBC05" d="M5.23 14.44c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.37 6.88C.49 8.64 0 10.62 0 12.72s.49 4.08 1.37 5.84l3.86-3z"/>
                      <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.5 1.18-4.23 1.18-3.14 0-5.82-1.67-6.77-4.52l-3.86 3C3.37 20.32 7.35 23 12 23z"/>
                    </svg>
                  ` : `
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.29 14.29c-.38.38-.89.58-1.42.58-.53 0-1.04-.2-1.42-.58L10 13.88l-2.45 2.45c-.38.38-.89.58-1.42.58-.53 0-1.04-.2-1.42-.58-.79-.79-.79-2.05 0-2.83L7.17 11 4.71 8.54c-.79-.79-.79-2.05 0-2.83.79-.79 2.05-.79 2.83 0L10 8.17l2.45-2.45c.79-.79 2.05-.79 2.83 0 .79.79.79 2.05 0 2.83L12.83 11l2.46 2.46c.79.78.79 2.04 0 2.83z"/>
                    </svg>
                  `}
                </div>
              </div>
              <div class="title">Sign in with ${provider === "google" ? "Google" : "Samsung"}</div>
              <div class="desc">to continue to <strong>Nextstep</strong></div>
              <div class="input-container">
                <span class="label">Email address</span>
                <input type="email" id="email" class="input" placeholder="name@domain.com" value="${provider}-user@gmail.com" required />
              </div>
              <button class="btn" onclick="submit()">Authorize & Continue</button>
            </div>
            <script>
              function submit() {
                const email = document.getElementById("email").value;
                const name = email.split("@")[0].split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                window.opener.postMessage({ 
                  type: "social-auth-success", 
                  provider: "${provider}", 
                  email: email,
                  name: name
                }, "*");
                window.close();
              }
            </script>
          </body>
        </html>
      `);
    } else {
      setIsSocialPending(null);
    }
  };

  const handleOpenAuth = (mode: "sign_in" | "sign_up") => {
    setAuthMode(mode);
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
    setIsAuthOpen(true);
  };

  // Show nothing while checking session to avoid flash
  if (isLoading || companiesLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  // Redirecting to dashboard if registered — render nothing
  if (session && companies && companies.length > 0) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-y-auto">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground" />
          <span className="text-sm font-semibold">Nextstep</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenAuth("sign_in")}
          >
            Sign In
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenAuth("sign_up")}
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-muted text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Control plane for AI-agent companies</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Your AI agents,
            <br />
            fully under control.
          </h1>

          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Nextstep is a control plane for managing AI agent companies —
            track issues, manage budgets, and coordinate agents at scale.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              size="default"
              className="gap-2"
              onClick={() => handleOpenAuth("sign_up")}
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => handleOpenAuth("sign_in")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="border-t border-border px-6 py-16">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="h-5 w-5" />}
            title="Agent Orchestration"
            description="Assign issues to AI agents and track their progress in real time."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Budget Controls"
            description="Set monthly budgets per company with hard-stop auto-pause behaviour."
          />
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Team Access"
            description="Invite team members, manage roles, and control who sees what."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nextstep — AI Agent Control Plane
        </p>
      </footer>

      {/* Stunning Glassmorphic Auth Popup Modal */}
      <Dialog open={isAuthOpen} onOpenChange={setIsAuthOpen}>
        <DialogContent className="sm:max-w-[420px] border border-border/80 bg-background/80 backdrop-blur-xl p-6 shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95 duration-200">
          <DialogHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-center tracking-tight">
              {authMode === "sign_in" ? "Welcome Back" : "Get Started"}
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {authMode === "sign_in"
                ? "Enter your credentials to access your control plane"
                : "Create an operator account to begin hiring agents"}
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={authMode}
            onValueChange={(val) => {
              setAuthMode(val as "sign_in" | "sign_up");
              setError(null);
            }}
            className="w-full mt-4"
          >
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="sign_in" className="rounded-lg text-sm transition-all">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="sign_up" className="rounded-lg text-sm transition-all">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                authMutation.mutate();
              }}
              className="space-y-4 mt-4"
            >
              {error && (
                <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                  {error}
                </div>
              )}

              {authMode === "sign_up" && (
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold">
                    Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/70" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-9 h-10 bg-background/50 border border-border/80 focus:border-primary/80 focus:ring-1 focus:ring-primary/40 rounded-lg transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-9 h-10 bg-background/50 border border-border/80 focus:border-primary/80 focus:ring-1 focus:ring-primary/40 rounded-lg transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-semibold">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 h-10 bg-background/50 border border-border/80 focus:border-primary/80 focus:ring-1 focus:ring-primary/40 rounded-lg transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={authMutation.isPending}
                className="w-full h-10 mt-2 font-medium bg-primary hover:bg-primary/95 text-primary-foreground shadow-md hover:shadow-lg rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {authMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : authMode === "sign_in" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Tabs>

          {/* Social Logins */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/80 px-2 text-muted-foreground font-semibold">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              disabled={isSocialPending !== null}
              onClick={() => handleSocialAuth("google")}
              className="h-10 border border-border/80 bg-background/50 hover:bg-muted/50 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isSocialPending === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.68 1.37 7.56l3.86 3c.95-2.85 3.63-4.52 6.77-4.52z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.57l3.73 2.89c2.18-2 3.7-4.96 3.7-8.61z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.23 14.44c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.37 6.88C.49 8.64 0 10.62 0 12.72s.49 4.08 1.37 5.84l3.86-3z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.73-2.89c-1.1.74-2.5 1.18-4.23 1.18-3.14 0-5.82-1.67-6.77-4.52l-3.86 3C3.37 20.32 7.35 23 12 23z"
                  />
                </svg>
              )}
              <span className="text-xs font-semibold">Google</span>
            </Button>

            {/* Samsung Login Button */}
            <Button
              type="button"
              variant="outline"
              disabled={isSocialPending !== null}
              onClick={() => handleSocialAuth("samsung")}
              className="h-10 border border-border/80 bg-background/50 hover:bg-muted/50 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isSocialPending === "samsung" ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <svg className="h-4 w-4 text-[#0C4DA2] fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.29 14.29c-.38.38-.89.58-1.42.58-.53 0-1.04-.2-1.42-.58L10 13.88l-2.45 2.45c-.38.38-.89.58-1.42.58-.53 0-1.04-.2-1.42-.58-.79-.79-.79-2.05 0-2.83L7.17 11 4.71 8.54c-.79-.79-.79-2.05 0-2.83.79-.79 2.05-.79 2.83 0L10 8.17l2.45-2.45c.79-.79 2.05-.79 2.83 0 .79.79.79 2.05 0 2.83L12.83 11l2.46 2.46c.79.78.79 2.04 0 2.83z" />
                </svg>
              )}
              <span className="text-xs font-semibold">Samsung</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-5 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-center w-9 h-9 rounded-md border border-border bg-muted text-foreground">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
