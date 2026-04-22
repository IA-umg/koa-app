"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { post } from "@/service/methods/methods";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";


const validationSchema = Yup.object({
  email: Yup.string()
    .email("Correo inválido")
    .required("El correo es requerido"),
  password: Yup.string()
    .min(8, "Mínimo 8 caracteres")
    .required("La contraseña es requerida"),
});

export interface LoginResponse {
  ok: boolean;
  usuario: { id: number; nombre: string; email: string; creadoEn: string };
  token: string;
  tokenType: string;
}

interface LoginScreen{
    email:string;
    password: string
}

export default function FormLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

    const loginMutation = useMutation({
    mutationFn: async (data: LoginScreen): Promise<LoginResponse> => {
        const response = await post<LoginResponse>("/api/auth/login", data);

        if (!response.ok) {
        throw new Error(response.error || "Error al iniciar sesión");
        }

        if (!response.data) {
        throw new Error("No se recibieron datos");
        }

        return response.data;
    },
    onSuccess: (data) => {
      setAuth(data)
      router.push("/chat")
      console.log("Login exitoso:", data);
    },
    onError: (error) => {
        console.error("Error:", error);
    },
    });

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
        try {
            await loginMutation.mutateAsync(values);
        } finally {
            setSubmitting(false);
        }
        },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-black p-8 shadow-2xl overflow-hidden"
        style={{ boxShadow: "0 0 40px 0 #223D36" }}
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Bienvenido</h1>
          <p className="text-blue-50 text-sm mt-1">
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-5 w-full">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              className="w-full"
              {...formik.getFieldProps("email")}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-xs text-red-400">{formik.errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative w-full">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pr-10"
                {...formik.getFieldProps("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-xs text-red-400">{formik.errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={formik.isSubmitting}
            onClick={() => {
                console.log("click directo");
                console.log("errors:", formik.errors);
                console.log("values:", formik.values);
                formik.handleSubmit();
            }}
            className="w-full mt-2 font-semibold"
            style={{
              backgroundColor: "#3FAB88",
              color: "oklch(0.08 0.01 260)",
              borderRadius: 5,
            }}
          >
            {formik.isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          ¿No tienes cuenta?{" "}
          <a
            href="/register"
            className="font-medium transition-colors"
            style={{ color: "#3E7063" }}
            >
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}