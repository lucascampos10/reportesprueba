import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNotifications } from './NotificationContext';
import { supabase } from '../lib/supabase';

export type Priority = 'baja' | 'media' | 'alta';
export type ContactMethod = 'whatsapp' | 'email';
export type OrderStatus = 'pending' | 'in_progress' | 'resolved';

export interface WorkOrder {
    id: string;
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
}

interface WorkOrderContextType {
    orders: WorkOrder[];
    addOrder: (order: Omit<WorkOrder, 'id' | 'status' | 'date'>) => Promise<void>;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    assignWorker: (orderId: string, workerId: string) => Promise<void>;
    closeOrder: (orderId: string, resolvedImages: string[], resolutionNotes: string) => Promise<void>;
    fetchOrders: () => Promise<void>;
}

const WorkOrderContext = createContext<WorkOrderContextType | undefined>(undefined);

export const WorkOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const { addNotification } = useNotifications();

    const fetchOrders = async () => {
        // Only fetch if authenticated
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return; // public page doesn't need to load all orders

        const { data: workOrdersData, error } = await supabase
            .from('work_orders')
            .select(`
                *,
                assigned_profile:profiles!assigned_to(full_name)
            `)
            // The exclamation explicitly uses the foreign key relation
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
        const mappedOrders: WorkOrder[] = data.map((o: any) => ({
            id: o.id,
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
            resolutionNotes: o.resolution_notes || undefined
        }));
        setOrders(mappedOrders);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const addOrder = async (newOrderData: Omit<WorkOrder, 'id' | 'status' | 'date'>) => {
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
            status: 'pending'
        });

        if (error) {
            console.error('Error adding order:', error);
            throw error;
        }

        addNotification(
            `Nueva orden: "${newOrderData.title}" en ${newOrderData.building}`,
            'new_order',
            'new'
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

        addNotification(
            `Orden asignada — estado: En Progreso`,
            'status_change',
            orderId
        );
        fetchOrders();
    };

    const closeOrder = async (orderId: string, resolvedImages: string[], resolutionNotes: string) => {
        const { error } = await supabase.from('work_orders').update({
            status: 'resolved',
            resolution_images: resolvedImages,
            resolution_notes: resolutionNotes,
            resolved_at: new Date().toISOString()
        }).eq('id', orderId);

        if (error) {
            console.error('Error close order:', error);
            throw error;
        }

        addNotification(
            `Orden marcada como resuelta`,
            'status_change',
            orderId
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
