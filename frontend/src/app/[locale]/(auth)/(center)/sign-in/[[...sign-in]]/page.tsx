'use client';
import { login } from "@/services/conexion";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  // async function checkBackend() {
  //   try {
  //     const data = await testConnection();
  //     console.log("Conectado al Backend:", data);
  //   } catch (error) {
  //     console.error("Error al conectar con el Backend:", error);
  //   }
  // }

  // useEffect(() => {
  //   checkBackend();
  // }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await login(formData);
      console.log("Respuesta del backend:", res);

      if (res.success) {
        alert("Inicio de sesión exitoso");
        router.push("/es/");
      } else {
        alert("Error en el login: " + res.message);
      }
    } catch (error) {
      console.error("Error en login:", error);
      alert("Error al conectar con el servidor");
    }
  };



  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Página de Sign In</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <label htmlFor="identifier">Usuario</label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          className="border px-2 py-1 rounded"
          value={formData.identifier}
          onChange={handleChange}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          className="border px-2 py-1 rounded"
          value={formData.password}
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4 hover:bg-blue-700"
        >
          Iniciar Sesión
        </button>
      </form>

     
    </div>
  );
}
