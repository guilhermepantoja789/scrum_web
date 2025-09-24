import { redirect } from 'next/navigation'

// Este agora é um Server Component, muito mais leve!
export default function KanbanTaskRedirectPage({ params }: { params: { id: string } }) {
    // A função redirect do Next.js faz o redirecionamento no lado do servidor,
    // antes de qualquer HTML ser enviado para o navegador.
    redirect(`/tasks/${params.id}`)

    // Como o redirect acontece no servidor, nenhum conteúdo abaixo dele
    // será renderizado. Não precisamos mais da tela de "Redirecionando...".
}