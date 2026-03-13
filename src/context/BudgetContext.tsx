import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useNotifications } from './NotificationContext';

export const formatBudgetId = (n: number) => `PRES-${String(n).padStart(3, '0')}`;

export type BudgetStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado';

export interface BudgetItem {
    description: string;
    qty: number;
    unit_price: number;
}

export interface Budget {
    id: string;
    orderId?: string;
    budgetNumber: number;
    building: string;
    clientName: string;
    items: BudgetItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: BudgetStatus;
    validUntil: string;
    notes: string;
    createdAt: string;
}

interface BudgetContextType {
    budgets: Budget[];
    addBudget: (b: Omit<Budget, 'id' | 'budgetNumber' | 'createdAt'>) => Promise<void>;
    updateBudgetStatus: (id: string, status: BudgetStatus) => Promise<void>;
    updateBudget: (id: string, b: Partial<Omit<Budget, 'id' | 'budgetNumber' | 'createdAt'>>) => Promise<void>;
    fetchBudgets: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const { addNotification } = useNotifications();

    const fetchBudgets = async () => {
        let { data: { session } } = await supabase.auth.getSession();
        
        // Retry logic for initial reload recovery
        if (!session) {
            await new Promise(r => setTimeout(r, 400));
            const { data } = await supabase.auth.getSession();
            session = data.session;
        }

        if (!session) return;

        // 1. Fetch user role and managed buildings
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, managed_buildings')
            .eq('id', session.user.id)
            .single();

        let query = supabase
            .from('budgets')
            .select('*');

        // 2. Filter if it's a building admin
        if (profile?.role === 'edificio_admin' && profile.managed_buildings?.length > 0) {
            query = query.in('building', profile.managed_buildings);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false });

        if (error) { console.error('Error fetching budgets:', error); return; }

        if (data) {
            setBudgets(data.map((b: any) => ({
                id: b.id,
                orderId: b.order_id,
                budgetNumber: b.budget_number,
                building: b.building || '',
                clientName: b.client_name || '',
                items: b.items || [],
                subtotal: b.subtotal || 0,
                tax: b.tax || 0,
                total: b.total || 0,
                status: b.status as BudgetStatus,
                validUntil: b.valid_until || '',
                notes: b.notes || '',
                createdAt: b.created_at,
            })));
        }
    };

    useEffect(() => {
        fetchBudgets();

        // Listen for auth changes to re-fetch budgets (e.g., after login)
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                fetchBudgets();
            }
        });

        const channel = supabase
            .channel('budgets_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => {
                fetchBudgets();
            })
            .subscribe();

        return () => {
            authListener.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, []);

    const addBudget = async (b: Omit<Budget, 'id' | 'budgetNumber' | 'createdAt'>) => {
        const { error } = await supabase.from('budgets').insert({
            order_id: b.orderId || null,
            building: b.building,
            client_name: b.clientName,
            items: b.items,
            subtotal: b.subtotal,
            tax: b.tax,
            total: b.total,
            status: b.status,
            valid_until: b.validUntil || null,
            notes: b.notes,
        });
        if (error) { console.error('Error adding budget:', error); throw error; }

        // Sync budget_status on the linked work_order
        if (b.orderId) {
            await supabase.from('work_orders').update({ budget_status: b.status }).eq('id', b.orderId);
        }

        fetchBudgets();
    };

    const updateBudgetStatus = async (id: string, status: BudgetStatus) => {
        const { error } = await supabase.from('budgets').update({ status }).eq('id', id);
        if (error) { console.error('Error updating budget status:', error); throw error; }
        
        const budget = budgets.find(b => b.id === id);
        if (budget) {
            // Sync budget_status on the linked work_order
            if (budget.orderId) {
                await supabase.from('work_orders').update({ budget_status: status }).eq('id', budget.orderId);
            }

            if (status === 'enviado') {
                addNotification(
                    `Presupuesto enviado: ${formatBudgetId(budget.budgetNumber)} para ${budget.building}. Asociado a su solicitud de mantenimiento.`,
                    'budget_update',
                    budget.orderId || undefined, // Link to the WorkOrder if possible
                    'edificio_admin'
                );
            } else if (status === 'aprobado') {
                addNotification(
                    `¡Presupuesto aprobado! ${formatBudgetId(budget.budgetNumber)} - ${budget.building}. Ya puede asignar un técnico.`,
                    'budget_update',
                    budget.orderId || undefined,
                    'admin'
                );
            }
        }

        fetchBudgets();
    };

    const updateBudget = async (id: string, b: Partial<Omit<Budget, 'id' | 'budgetNumber' | 'createdAt'>>) => {
        const updateData: any = {};
        if (b.orderId !== undefined) updateData.order_id = b.orderId || null;
        if (b.building !== undefined) updateData.building = b.building;
        if (b.clientName !== undefined) updateData.client_name = b.clientName;
        if (b.items !== undefined) updateData.items = b.items;
        if (b.subtotal !== undefined) updateData.subtotal = b.subtotal;
        if (b.tax !== undefined) updateData.tax = b.tax;
        if (b.total !== undefined) updateData.total = b.total;
        if (b.status !== undefined) updateData.status = b.status;
        if (b.validUntil !== undefined) updateData.valid_until = b.validUntil || null;
        if (b.notes !== undefined) updateData.notes = b.notes;

        const { error } = await supabase.from('budgets').update(updateData).eq('id', id);
        if (error) { console.error('Error updating budget:', error); throw error; }
        fetchBudgets();
    };

    return (
        <BudgetContext.Provider value={{ budgets, addBudget, updateBudgetStatus, updateBudget, fetchBudgets }}>
            {children}
        </BudgetContext.Provider>
    );
};

export const useBudgets = () => {
    const ctx = useContext(BudgetContext);
    if (!ctx) throw new Error('useBudgets must be used within BudgetProvider');
    return ctx;
};
