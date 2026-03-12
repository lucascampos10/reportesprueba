import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNotifications } from './NotificationContext';
import { supabase } from '../lib/supabase';

export type Priority = 'baja' | 'media' | 'alta';
export type ContactMethod = 'whatsapp' | 'email';
export type OrderStatus = 'pending' | 'in_progress' | 'resolved';

export interface WorkOrder {
    id: string;
    orderNumber: number;   // display number: e.g. 100, 101...
    title: string;
    description: string;
    category: string;
    building: string;
    department: string;
    location: string;
    reporterName: string;
    contactMethod: ContactMethod;
    contactValue: string;
    priority: Priority;
    status: OrderStatus;
    date: string;
    images: string[];
    assignedWorker?: string;
    assignedToId?: string;
    resolvedImages?: string[];
    resolvedDate?: string;
    resolutionNotes?: string;
    signatureUrl?: string;
    receptorName?: string;
    budgetStatus?: string;
    availability?: string;
}

// Helper: show human-friendly order ID like ORD-100
export const formatOrderId = (orderNumber: number) => `ORD-${orderNumber}`;

interface WorkOrderContextType {
    orders: WorkOrder[];
    addOrder: (order: Omit<WorkOrder, 'id' | 'status' | 'date' | 'orderNumber'>) => Promise<void>;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    assignWorker: (orderId: string, workerId: string) => Promise<void>;
    closeOrder: (orderId: string, resolvedImages: string[], resolutionNotes: string, signatureUrl?: string, receptorName?: string) => Promise<void>;
    fetchOrders: () => Promise<void>;
}

const WorkOrderContext = createContext<WorkOrderContextType | undefined>(undefined);

export const WorkOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const { addNotification } = useNotifications();

    const fetchOrders = async () => {
        // Only fetch if authenticated
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        // 1. Fetch user role and managed buildings
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, managed_buildings')
            .eq('id', sessionData.session.user.id)
            .single();

        let query = supabase
            .from('work_orders')
            .select(`
                *,
                assigned_profile:profiles!assigned_to(full_name),
                budgets(status)
            `);

        // 2. Filter if it's a building admin
        if (profile?.role === 'edificio_admin' && profile.managed_buildings?.length > 0) {
            query = query.in('building', profile.managed_buildings);
        }

        const { data: workOrdersData, error } = await query
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            // Ignore relations error if we haven't set them up perfectly
            if (error.code === 'PGRST200') {
                const { data: rawOrders } = await supabase.from('work_orders').select('*').order('created_at', { ascending: false });
                if (rawOrders) processOrders(rawOrders);
            }
            return;
        }

        if (workOrdersData) {
            processOrders(workOrdersData);
        }
    };

    const processOrders = (data: any[]) => {
        // Assign sequential order numbers starting from 100, oldest first
        const mappedOrders: WorkOrder[] = data.map((o: any, index: number) => ({
            id: o.id,
            orderNumber: 100 + (data.length - 1 - index), // oldest = 100, newest = 100 + n-1
            title: o.title,
            description: o.description,
            category: o.category || '',
            building: o.building || '',
            department: o.department || '',
            location: o.location || '',
            reporterName: o.reporter_name || '',
            contactMethod: o.contact_method as ContactMethod,
            contactValue: o.contact_value || '',
            priority: o.priority as Priority,
            status: o.status as OrderStatus,
            date: new Date(o.created_at).toLocaleString(),
            images: o.images || [],
            assignedWorker: o.assigned_profile?.full_name || o.assigned_to || undefined,
            assignedToId: o.assigned_to,
            resolvedImages: o.resolution_images || [],
            resolvedDate: o.resolved_at ? new Date(o.resolved_at).toLocaleString() : undefined,
            resolutionNotes: o.resolution_notes || '',
            signatureUrl: o.signature_url || undefined,
            receptorName: o.receptor_name || '',
            budgetStatus: o.budget_status || (o.budgets && o.budgets.length > 0 ? o.budgets[0].status : undefined),
            availability: o.availability || '',
        }));
        setOrders(mappedOrders);
    };

    useEffect(() => {
        fetchOrders();

        // ─── Supabase Realtime ─────────────────────────────────────────────
        // Subscribe to any INSERT, UPDATE, or DELETE on work_orders.
        const channel = supabase
            .channel('work_orders_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'work_orders' },
                (_payload) => {
                    fetchOrders();
                }
            )
            .subscribe();

        // Also subscribe to budgets changes so budgetStatus updates in real time
        const budgetsChannel = supabase
            .channel('budgets_orders_sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'budgets' },
                (_payload) => {
                    fetchOrders(); // Re-fetch orders to refresh the joined budgetStatus
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(budgetsChannel);
        };
    }, []);

    const addOrder = async (newOrderData: Omit<WorkOrder, 'id' | 'status' | 'date' | 'orderNumber'>) => {
        const { error } = await supabase.from('work_orders').insert({
            title: newOrderData.title,
            description: newOrderData.description,
            category: newOrderData.category,
            building: newOrderData.building,
            department: newOrderData.department,
            location: newOrderData.location,
            reporter_name: newOrderData.reporterName,
            contact_method: newOrderData.contactMethod,
            contact_value: newOrderData.contactValue,
            priority: newOrderData.priority,
            images: newOrderData.images,
            status: 'pending',
            availability: newOrderData.availability
        });

        if (error) {
            console.error('Error adding order:', error);
            throw error;
        }

        addNotification(
            `Nueva orden: "${newOrderData.title}" en ${newOrderData.building}`,
            'new_order',
            'new',
            'admin'  // Only admins see new order notifications
        );
        fetchOrders(); // Refresh after adding
    };

    const updateOrderStatus = async (id: string, status: OrderStatus) => {
        const { error } = await supabase.from('work_orders').update({ status }).eq('id', id);
        if (error) {
            console.error('Error update order status:', error);
            throw error;
        }
        fetchOrders();
    };

    const assignWorker = async (orderId: string, workerId: string) => {
        const { error } = await supabase.from('work_orders').update({
            status: 'in_progress',
            assigned_to: workerId
        }).eq('id', orderId);

        if (error) {
            console.error('Error assign worker:', error);
            throw error;
        }

        const order = orders.find(o => o.id === orderId);
        const displayId = order ? formatOrderId(order.orderNumber) : orderId;

        addNotification(
            `Orden asignada (${displayId}) — se le asignó un nuevo trabajo`,
            'status_change',
            orderId,
            'operario'  // Only the worker sees assignment notifications
        );
        fetchOrders();
    };

    const closeOrder = async (orderId: string, resolvedImages: string[], resolutionNotes: string, signatureUrl?: string, receptorName?: string) => {
        const { error } = await supabase.from('work_orders').update({
            status: 'resolved',
            resolution_images: resolvedImages,
            resolution_notes: resolutionNotes,
            resolved_at: new Date().toISOString(),
            signature_url: signatureUrl || null,
            receptor_name: receptorName || null,
        }).eq('id', orderId);

        if (error) {
            console.error('Error close order:', error);
            throw error;
        }

        const order = orders.find(o => o.id === orderId);
        addNotification(
            `Orden resuelta: "${order?.title || 'Trabajo finalizado'}" en ${order?.building || 'el edificio'}`,
            'status_change',
            orderId,
            'edificio_admin'
        );
        fetchOrders();
    };

    return (
        <WorkOrderContext.Provider value={{ orders, addOrder, updateOrderStatus, assignWorker, closeOrder, fetchOrders }}>
            {children}
        </WorkOrderContext.Provider>
    );
};

export const useWorkOrders = () => {
    const context = useContext(WorkOrderContext);
    if (context === undefined) {
        throw new Error('useWorkOrders must be used within a WorkOrderProvider');
    }
    return context;
};
