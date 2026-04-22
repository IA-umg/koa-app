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
import { useRouter } from "next/navigation";

const validationSchema = Yup.object({
  nombre: Yup.string()
    .min(2, "Mínimo 2 caracteres")
    .required("El nombre es requerido"),
  email: Yup.string()
    .email("Correo inválido")
    .required("El correo es requerido"),
  password: Yup.string()
    .min(8, "Mínimo 8 caracteres")
    .required("La contraseña es requerida"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Las contraseñas no coinciden")
    .required("Confirma tu contraseña"),
});

export interface RegisterResponse {
  ok: boolean;
  usuario: { id: number; nombre: string; email: string; creadoEn: string };
  token: string;
  tokenType: string;
}

interface RegisterScreen {
  nombre: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function FormRegister() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterScreen): Promise<RegisterResponse> => {
      const { confirmPassword, ...payload } = data;
      const response = await post<RegisterResponse>("/api/auth/registro", payload);

      if (!response.ok) {
        throw new Error(response.error || "Error al registrarse");
      }

      if (!response.data) {
        throw new Error("No se recibieron datos");
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log("Registro exitoso:", data);
      router.push("/");
    },
    onError: (error) => {
      console.error("Error:", error);
    },
  });

  const formik = useFormik({
    initialValues: {
      nombre: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await registerMutation.mutateAsync(values);
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
          <h1 className="text-2xl font-bold text-foreground">Crear cuenta</h1>
          <p className="text-blue-50 text-sm mt-1">
            Regístrate para continuar
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-5 w-full">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              type="text"
              placeholder="Tu nombre"
              className="w-full"
              {...formik.getFieldProps("nombre")}
            />
            {formik.touched.nombre && formik.errors.nombre && (
              <p className="text-xs text-red-400">{formik.errors.nombre}</p>
            )}
          </div>

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
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-xs text-red-400">{formik.errors.password}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <div className="relative w-full">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full pr-10"
                {...formik.getFieldProps("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-xs text-red-400">{formik.errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={formik.isSubmitting}
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
                Registrando...
              </>
            ) : (
              "Crear cuenta"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <a
            href="/login"
            className="font-medium transition-colors"
            style={{ color: "#3E7063" }}
          >
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}