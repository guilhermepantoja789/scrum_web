"use client"

import { useState, useEffect } from "react";
import type { TaskType } from "@prisma/client";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
    taskType: TaskType | null;
}

export function TaskTypeFormModal({ isOpen, onClose, onRefresh, taskType }: Props) {
    const { getAuthHeaders } = useAuthContext();
    const { toast } = useToast();
    const [formData, setFormData] = useState({ name: '', icon: '', color: '#3b82f6' });
    const isEditing = !!taskType;

    useEffect(() => {
        if (taskType) {
            setFormData({
                name: taskType.name,
                icon: taskType.icon,
                color: taskType.color
            });
        } else {
            setFormData({ name: '', icon: '', color: '#3b82f6' });
        }
    }, [taskType, isOpen]);

    const handleSubmit = async () => {
        const url = isEditing ? `/api/task-types/${taskType!.id}` : '/api/task-types';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if (response.ok) {
                toast({ title: "Sucesso!", description: `Tipo de tarefa ${isEditing ? 'atualizado' : 'criado'}.` });
                onRefresh();
                onClose();
            } else {
                toast({ title: "Erro", description: result.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Erro de Rede", description: "A operação falhou.", variant: "destructive" });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Tipo de Tarefa' : 'Criar Novo Tipo de Tarefa'}</DialogTitle>
                    <DialogDescription>
                        Defina um nome, ícone (da biblioteca Lucide) e uma cor para identificar este tipo de tarefa.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="icon">Nome do Ícone (Lucide)</Label>
                        <Input id="icon" placeholder="Ex: Bug, Lightbulb, Wrench" value={formData.icon} onChange={(e) => setFormData(f => ({ ...f, icon: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="color">Cor</Label>
                        <div className="flex items-center gap-2">
                            <Input id="color-picker" type="color" value={formData.color} onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))} className="w-12 h-10 p-1" />
                            <Input id="color-text" value={formData.color} onChange={(e) => setFormData(f => ({ ...f, color: e.target.value }))} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSubmit}>Salvar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}