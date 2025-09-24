"use client"

import { useState, useEffect, useCallback } from "react";
import type { TaskType } from "@prisma/client";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { TaskTypeFormModal } from "./components/TaskTypeFormModal";

export default function TaskTypesPage() {
    const { getAuthHeaders } = useAuthContext();
    const { toast } = useToast();
    const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<TaskType | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/task-types', { headers: getAuthHeaders() });
            const result = await response.json();
            if (result.success) {
                setTaskTypes(result.data);
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "Não foi possível buscar os dados.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [getAuthHeaders, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (taskType?: TaskType) => {
        setEditingType(taskType || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingType(null);
        setIsModalOpen(false);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Tipos de Tarefa</h1>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Novo Tipo
                    </Button>
                </div>

                <DataTable
                    columns={columns({ onEdit: handleOpenModal, onRefresh: fetchData })}
                    data={taskTypes}
                    isLoading={isLoading}
                />
            </div>

            <TaskTypeFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                taskType={editingType}
                onRefresh={fetchData}
            />
        </DashboardLayout>
    );
}