import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Receipt {
    id: string;
    budgetId?: string;
    receiptNumber: number;
    clientName: string;
    amountWritten: string;
    concept: string;
    totalAmount: number;
    signatureUrl: string;
    createdAt: string;
}

interface ReceiptContextType {
    receipts: Receipt[];
    isLoading: boolean;
    addReceipt: (receipt: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt'>) => Promise<Receipt | null>;
    refreshReceipts: () => Promise<void>;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export const ReceiptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReceipts = async () => {
        try {
            setIsLoading(true);
            let { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                await new Promise(r => setTimeout(r, 400));
                const { data } = await supabase.auth.getSession();
                session = data.session;
            }
            if (!session) return;

            const { data, error } = await supabase
                .from('receipts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReceipts((data || []).map((r: any) => ({
                id: r.id,
                budgetId: r.budget_id,
                receiptNumber: r.receipt_number,
                clientName: r.client_name,
                amountWritten: r.amount_written,
                concept: r.concept,
                totalAmount: r.total_amount,
                signatureUrl: r.signature_url,
                createdAt: r.created_at,
            })));
        } catch (error) {
            console.error('Error fetching receipts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();

        // Listen for auth changes to re-fetch receipts (e.g., after login)
        const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                fetchReceipts();
            }
        });

        const channel = supabase
            .channel('receipts_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, () => {
                fetchReceipts();
            })
            .subscribe();

        return () => {
            authListener.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, []);

    const addReceipt = async (receiptData: Omit<Receipt, 'id' | 'receiptNumber' | 'createdAt'>) => {
        try {
            const { data, error } = await supabase
                .from('receipts')
                .insert([{
                    budget_id: receiptData.budgetId,
                    client_name: receiptData.clientName,
                    amount_written: receiptData.amountWritten,
                    concept: receiptData.concept,
                    total_amount: receiptData.totalAmount,
                    signature_url: receiptData.signatureUrl
                }])
                .select()
                .single();

            if (error) throw error;
            const mapped = {
                id: data.id,
                budgetId: data.budget_id,
                receiptNumber: data.receipt_number,
                clientName: data.client_name,
                amountWritten: data.amount_written,
                concept: data.concept,
                totalAmount: data.total_amount,
                signatureUrl: data.signature_url,
                createdAt: data.created_at,
            };
            setReceipts(prev => [mapped, ...prev]);
            return mapped;
        } catch (error) {
            console.error('Error creating receipt:', error);
            throw error;
        }
    };

    return (
        <ReceiptContext.Provider value={{ receipts, isLoading, addReceipt, refreshReceipts: fetchReceipts }}>
            {children}
        </ReceiptContext.Provider>
    );
};

export const useReceipts = () => {
    const context = useContext(ReceiptContext);
    if (context === undefined) {
        throw new Error('useReceipts must be used within a ReceiptProvider');
    }
    return context;
};

export const formatReceiptId = (num: number) => {
    return `REC-${num.toString().padStart(6, '0')}`;
};
