import dynamic from "next/dynamic"

const TaskFormModal = dynamic(() => import("./TaskFormModalInner"), { ssr: false })

export { TaskFormModal }
export default TaskFormModal
