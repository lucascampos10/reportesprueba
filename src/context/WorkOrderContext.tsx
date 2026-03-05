import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useNotifications } from './NotificationContext';

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
    resolvedImages?: string[];
    resolvedDate?: string;
    resolutionNotes?: string;
}

interface WorkOrderContextType {
    orders: WorkOrder[];
    addOrder: (order: Omit<WorkOrder, 'id' | 'status' | 'date'>) => void;
    updateOrderStatus: (id: string, status: OrderStatus) => void;
    assignWorker: (orderId: string, workerId: string) => void;
    closeOrder: (orderId: string, resolvedImages: string[], resolutionNotes: string) => void;
}

const mockOrders: WorkOrder[] = [
    {
        id: 'ORD-001',
        title: 'Humedad en pared principal',
        description: 'La pared presenta una gran mancha de humedad y se está descascarando la pintura. Parece que hay una filtración.',
        category: 'Mantenimiento',
        building: 'Torre Alvear',
        department: 'PB',
        location: 'Lobby Principal',
        reporterName: 'Juan Pérez',
        contactMethod: 'whatsapp',
        contactValue: '+54 9 11 1234-5678',
        status: 'pending',
        date: new Date().toLocaleString(),
        priority: 'alta',
        images: ['https://images.unsplash.com/photo-1518552602711-1372e9ddff27?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']
    },
    {
        id: 'ORD-002',
        title: 'Luminaria rota en pasillo',
        description: 'Tres tubos fluorescentes fundidos en el pasillo. Se necesita reemplazo urgente por seguridad.',
        category: 'Eléctrico',
        building: 'Edificio Libertador',
        department: '3er Piso',
        location: 'Pasillo B',
        reporterName: 'María Gómez',
        contactMethod: 'email',
        contactValue: 'maria@ejemplo.com',
        status: 'pending',
        date: new Date(Date.now() - 86400000).toLocaleString(), // Yesterday
        priority: 'media',
        images: []
    },
    {
        id: 'ORD-003',
        title: 'Mancha de humedad en techo',
        description: 'Goteo constante en el techo del baño común. Se reparó la cañería y se repintó la zona afectada.',
        category: 'Plomería',
        building: 'Complejo Center',
        department: 'Depto 2A',
        location: 'Baño común planta baja',
        reporterName: 'Carlos Ruiz',
        contactMethod: 'whatsapp',
        contactValue: '+54 9 11 5555-1234',
        status: 'resolved',
        date: new Date(Date.now() - 172800000).toLocaleString(),
        priority: 'alta',
        images: ['https://images.unsplash.com/photo-1585128792020-803d29415281?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
        assignedWorker: 'Carlos Rodríguez',
        resolvedImages: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
        resolvedDate: new Date(Date.now() - 86400000).toLocaleString(),
        resolutionNotes: 'Se reparó la cañería con sellador epóxico y se repintó la zona afectada con pintura antihumedad.'
    }
];

const WorkOrderContext = createContext<WorkOrderContextType | undefined>(undefined);

export const WorkOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [orders, setOrders] = useState<WorkOrder[]>(mockOrders);
    const { addNotification } = useNotifications();

    const addOrder = (newOrderData: Omit<WorkOrder, 'id' | 'status' | 'date'>) => {
        const newOrder: WorkOrder = {
            ...newOrderData,
            id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
            status: 'pending',
            date: new Date().toLocaleString(),
        };
        setOrders([newOrder, ...orders]);
        addNotification(
            `Nueva orden ${newOrder.id}: "${newOrder.title}" en ${newOrder.building}`,
            'new_order',
            newOrder.id
        );
    };

    const updateOrderStatus = (id: string, status: OrderStatus) => {
        setOrders(orders.map(order =>
            order.id === id ? { ...order, status } : order
        ));
    };

    const assignWorker = (orderId: string, workerId: string) => {
        setOrders(prev => prev.map(order =>
            order.id === orderId ? { ...order, status: 'in_progress' as OrderStatus, assignedWorker: workerId } : order
        ));
        addNotification(
            `Orden ${orderId} asignada a ${workerId} — estado: En Progreso`,
            'status_change',
            orderId
        );
    };

    const closeOrder = (orderId: string, resolvedImages: string[], resolutionNotes: string) => {
        setOrders(prev => prev.map(order =>
            order.id === orderId
                ? {
                    ...order,
                    status: 'resolved' as OrderStatus,
                    resolvedImages,
                    resolvedDate: new Date().toLocaleString(),
                    resolutionNotes,
                }
                : order
        ));
        addNotification(
            `Orden ${orderId} fue cerrada y marcada como resuelta`,
            'status_change',
            orderId
        );
    };

    return (
        <WorkOrderContext.Provider value={{ orders, addOrder, updateOrderStatus, assignWorker, closeOrder }}>
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
