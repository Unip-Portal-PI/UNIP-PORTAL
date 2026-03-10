import { redirect } from "next/navigation";

export default function Home() {
  redirect('/auth/cadastro');
  return (
    <h1>Página principal do meu site</h1>
    
  );
}
