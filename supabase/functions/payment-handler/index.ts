import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ""
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    const atenasApiKey = Deno.env.get('ATENAS_API_KEY') ?? ""
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { pathname } = new URL(req.url)

    // --- ROTA DE CRIAÇÃO DE PIX (Frontend chama aqui) ---
    if (pathname.endsWith('/create-pix')) {
      const { submissionId, amount, description } = await req.json()

      const response = await fetch('https://atenaspay.com.br/api/pix/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': atenasApiKey
        },
        body: JSON.stringify({
          amount: amount,
          description: description || `Canais18 - Destaque de Grupo`,
          external_id: submissionId,
          webhook_url: `${supabaseUrl}/functions/v1/payment-handler/webhook`,
          expiration: 3600 // 1 hora
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        return new Response(JSON.stringify({ error: data.message || 'Erro na AtenasPay' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Salva o ID da transação no nosso banco para referência
      await supabase
        .from('group_submissions')
        .update({ 
          payment_id: data.transaction.id,
          payment_status: 'pending'
        })
        .eq('id', submissionId)

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- ROTA DE WEBHOOK (AtenasPay chama aqui) ---
    if (pathname.endsWith('/webhook')) {
      const body = await req.json()
      const { external_id, status, transaction_id } = body

      if (status === 'paid') {
        // 1. Busca a submissão
        const { data: submission } = await supabase
          .from('group_submissions')
          .select('*')
          .eq('id', external_id)
          .single()

        if (submission) {
          // 2. Aprova o grupo e define como premium se for o caso
          const updateData: any = { 
            status: 'approved',
            payment_status: 'paid'
          }

          if (submission.payment_type === 'premium') {
            updateData.is_premium = true
            updateData.featured = true
            // Define data de expiração do destaque (7 dias)
            const expiryDate = new Date()
            expiryDate.setDate(expiryDate.getDate() + 7)
            updateData.premium_until = expiryDate.toISOString()
          }

          await supabase
            .from('group_submissions')
            .update(updateData)
            .eq('id', external_id)

          // 3. Se já tiver link do telegram, cria/atualiza na tabela principal de grupos
          if (submission.telegram_link) {
            // Lógica para inserir na tabela 'groups' ou marcar como visível
            // (Isso depende de como seu sistema processa aprovações)
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
