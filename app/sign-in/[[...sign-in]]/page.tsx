import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <SignIn appearance={{
        elements: {
          form: "shadow-xl rounded-2xl",
          card: "border-none"
        }
      }} />
    </div>
  );
}
