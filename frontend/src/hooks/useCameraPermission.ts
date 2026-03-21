// app/hooks/useCameraPermission.ts
// "use client";

// import { useEffect } from "react";
// import { UserRole } from "@/src/types/user";

// export function useCameraPermission(role: UserRole) {
//   useEffect(() => {
//     if (role !== "colaborador" && role !== "adm") return;

//     // Só pede se ainda não foi concedida
//     navigator.permissions
//       ?.query({ name: "camera" as PermissionName })
//       .then((result) => {
//         if (result.state === "prompt") {
//           // Abre e fecha o stream só para disparar o popup do browser
//           navigator.mediaDevices
//             .getUserMedia({ video: true })
//             .then((stream) => {
//               stream.getTracks().forEach((t) => t.stop());
//             })
//             .catch(() => {
//               // Usuário negou — tudo bem, tratamos no modal
//             });
//         }
//       })
//       .catch(() => {
//         // API permissions não disponível (Firefox) — ignora
//       });
//   }, [role]);
// }

// app/hooks/useCameraPermission.ts
// ✅ Este hook não é mais necessário — a permissão de câmera
//    é solicitada diretamente no ModalQRReader ao abrir.
//
// Mantido apenas como stub vazio para não quebrar imports existentes.

import { UserRole } from "@/src/types/user";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCameraPermission(_role: UserRole) {
  // Intencionalmente vazio.
  // A câmera só pode ser solicitada via gesto do usuário (clique),
  // então pedir permissão automaticamente no carregamento da página
  // é bloqueado pelos browsers mobile e não funciona.
}