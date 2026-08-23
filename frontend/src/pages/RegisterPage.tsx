import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api/core/client";
import { Card } from "@/components/ui/card";
import { FieldMessage } from "@/components/ui/field-message";
import { registerSchema, type RegisterDTO } from "@/dto/login.dto";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterDTO>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", username: "", password: "" },
  });

  async function onSubmit(data: RegisterDTO) {
    setError(null);
    try {
      await registerUser(data.email, data.username, data.password);
      navigate("/blotter", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="w-screen h-screen flex">
      <Card className="p-4 w-125 h-fit m-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">Create an account</h1>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register("email")}
            />
            <FieldMessage error={errors.email?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              {...register("username")}
            />
            <FieldMessage
              error={errors.username?.message}
              hint="At least 5 characters."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            <FieldMessage
              error={errors.password?.message}
              hint="At least 8 characters."
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}
