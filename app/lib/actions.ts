'use server'

// Marcar que todas las funciones que se exportan en este archivo son de servidor y no se ejecutan en el cliente

import { z } from 'zod';
import { Invoice } from './definitions'
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const CreateInvoiceSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['paid', 'pending']),
    date: z.string()
})

const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
    id: true,
    date: true
})

export async function createInvoice(formData: FormData) {
    // const rowFormData = {
    //     customerId: formData.get('customerId'),
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    // }

    // const rawFormData = Object.fromEntries(formData.entries());

    const { customerId, amount, status } = CreateInvoiceFormSchema.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    })

    // Transformar para evitar errores de redondeo
    const amountInCents = amount * 100;

    // Creamos la fecha actual 2021-11-23
    const [date] = new Date().toISOString().split('T');

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `

    revalidatePath('/dashboard/invoices');

    redirect('/dashboard/invoices');
}