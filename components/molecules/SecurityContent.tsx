// app/security/SecurityContent.tsx
'use client';

import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import supabaseClient from '@/lib/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

interface SecurityContentProps {
    user: User | null;
    isResettingPassword: boolean;
}

const SecurityContent: React.FC<SecurityContentProps> = ({ user, isResettingPassword: initialIsResettingPassword }) => {
    const [newPassword, setNewPassword] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(initialIsResettingPassword);
    const supabase = supabaseClient();
    const handleResetPasswordRequest = async () => {
        toast({
            title: "Solicitud enviada",
            description: "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.",
        });
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user?.email || '', {
                redirectTo: `${window.location.origin}/home/settings/security`,
            });
            if (error) throw error;
            toast({
                title: "Solicitud enviada",
                description: "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.",
            });
        } catch (error) {
            console.error('Error al solicitar restablecimiento de contraseña:', error);
            toast({
                title: "Error",
                description: "No se pudo enviar la solicitud de restablecimiento de contraseña. Por favor, intenta de nuevo.",
                variant: "destructive",
            });
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            setIsResettingPassword(false);
            setNewPassword('');
            toast({
                title: "Contraseña actualizada",
                description: "Tu contraseña ha sido actualizada exitosamente.",
            });
        } catch (error) {
            console.error('Error al actualizar la contraseña:', error);
            toast({
                title: "Error",
                description: "No se pudo actualizar la contraseña. Por favor, intenta de nuevo.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Seguridad de la Cuenta</CardTitle>
                    <CardDescription>Gestiona la seguridad de tu cuenta aquí</CardDescription>
                </CardHeader>
                <CardContent>
                    {user && (
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold mb-2">Información de la Cuenta</h2>
                            <p>Email: {user.email}</p>
                        </div>
                    )}

                    {isResettingPassword ? (
                        <form onSubmit={handlePasswordUpdate}>
                            <div className="mb-4">
                                <label htmlFor="new-password" className="block mb-2">Nueva Contraseña</label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <Button type="submit">Actualizar Contraseña</Button>
                        </form>
                    ) : (
                        <Button onClick={handleResetPasswordRequest}>Solicitar Cambio de Contraseña</Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SecurityContent;