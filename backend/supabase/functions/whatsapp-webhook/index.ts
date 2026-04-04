import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EvolutionWebhookEvent {
  event: string;
  instance: string;
  data: Record<string, unknown>;
  date_time: string;
  sender: string;
  server_url: string;
  apikey: string;
}

interface MessageData {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName?: string;
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: { url?: string; caption?: string };
    documentMessage?: { url?: string; fileName?: string };
    audioMessage?: { url?: string };
    videoMessage?: { url?: string; caption?: string };
  };
  messageType?: string;
  messageTimestamp?: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const event: EvolutionWebhookEvent = await req.json();
    console.log(`[Webhook] Evento recebido: ${event.event} da instância: ${event.instance}`);

    // Só processa mensagens recebidas
    if (event.event !== "messages.upsert") {
      return new Response(
        JSON.stringify({ success: true, message: "Evento ignorado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messageData = event.data as unknown as MessageData;

    // Ignora mensagens enviadas por nós
    if (!messageData?.key || messageData.key.fromMe) {
      return new Response(
        JSON.stringify({ success: true, message: "Mensagem enviada ignorada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ignora grupos e broadcasts
    const remoteJid = messageData.key.remoteJid;
    if (remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
      return new Response(
        JSON.stringify({ success: true, message: "Grupo/broadcast ignorado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrai telefone do remoteJid (5511999998888@s.whatsapp.net)
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@c.us", "");
    const pushName = messageData.pushName || "Sem nome";

    // Extrai conteúdo da mensagem
    const message = messageData.message;
    let content: string | null = null;
    let contentType = "text";

    if (message?.conversation) {
      content = message.conversation;
    } else if (message?.extendedTextMessage?.text) {
      content = message.extendedTextMessage.text;
    } else if (message?.imageMessage) {
      content = message.imageMessage.caption || null;
      contentType = "image";
    } else if (message?.videoMessage) {
      content = message.videoMessage.caption || null;
      contentType = "video";
    } else if (message?.audioMessage) {
      contentType = "audio";
    } else if (message?.documentMessage) {
      contentType = "document";
    }

    // Busca workspace da instância WhatsApp
    const { data: instance } = await supabase
      .from("whatsapp_instances")
      .select("id, workspace_id")
      .eq("instance_name", event.instance)
      .single();

    if (!instance) {
      console.error(`[Webhook] Instância não encontrada: ${event.instance}`);
      throw new Error("Instância não encontrada");
    }

    const workspaceId = instance.workspace_id;
    console.log(`[Webhook] Workspace da instância: ${workspaceId}`);

    // Busca lead existente pelo telefone no workspace correto
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("phone", phone)
      .single();

    let leadId: string;

    if (existingLead) {
      // Lead já existe - apenas usa o ID
      leadId = existingLead.id;
      console.log(`[Webhook] Lead existente encontrado: ${leadId}`);
    } else {
      // Busca primeiro estágio do kanban do workspace
      const { data: firstStage } = await supabase
        .from("kanban_stages")
        .select("id")
        .eq("workspace_id", workspaceId)
        .order("position", { ascending: true })
        .limit(1)
        .single();

      if (!firstStage) {
        console.error(`[Webhook] Nenhum estágio encontrado para workspace: ${workspaceId}`);
        throw new Error("Nenhum estágio de kanban configurado");
      }

      // Lead não existe - cria novo no primeiro estágio
      const { data: newLead, error: createError } = await supabase
        .from("leads")
        .insert({
          workspace_id: workspaceId,
          stage_id: firstStage.id,
          name: pushName,
          phone: phone,
          source: "whatsapp",
          last_contact_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createError || !newLead) {
        console.error("[Webhook] Erro ao criar lead:", createError);
        throw new Error("Falha ao criar lead");
      }

      leadId = newLead.id;
      console.log(`[Webhook] Novo lead criado: ${leadId} - ${pushName} (${phone})`);

      // Registra no histórico
      await supabase.from("lead_history").insert({
        lead_id: leadId,
        action: "lead_created",
        metadata: { source: "whatsapp_webhook", phone, pushName },
      });
    }

    // Registra a mensagem
    await supabase.from("messages").insert({
      lead_id: leadId,
      instance_id: instance?.id || null,
      direction: "inbound",
      content_type: contentType,
      content: content,
      whatsapp_message_id: messageData.key.id,
      status: "delivered",
      sent_at: new Date().toISOString(),
    });

    // Atualiza last_contact_at do lead
    await supabase
      .from("leads")
      .update({
        last_contact_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", leadId);

    // Registra mensagem recebida no histórico
    await supabase.from("lead_history").insert({
      lead_id: leadId,
      action: "message_received",
      metadata: {
        preview: content?.substring(0, 100) || "Mídia recebida",
        content_type: contentType,
      },
    });

    console.log(`[Webhook] Mensagem processada com sucesso para lead: ${leadId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        lead_id: leadId,
        is_new_lead: !existingLead 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Webhook] Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
