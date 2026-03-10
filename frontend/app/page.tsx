import { redirect } from "next/navigation";

export default function Home() {
  redirect('app/auth/cadastro/page.tsx');
  return (
    <h1>Página principal do meu site</h1>
    
  );
}
