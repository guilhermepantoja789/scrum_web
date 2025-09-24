import { ProjectService } from "@/lib/data/projects" // Importe seu service de projetos
import { ProjectClientPage } from "./ProjectClientPage" // Importe o novo componente cliente

type ProjectDetailsPageProps = {
    params: {
        id: string
    }
}

// Esta agora é uma função assíncrona - um Server Component!
export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {

    const project = await ProjectService.getById(params.id)
    return (
        <ProjectClientPage initialProject={project} />
    )
}