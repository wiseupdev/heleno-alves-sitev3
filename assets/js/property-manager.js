/*
 * property-manager.js
 *
 * Conversão JavaScript (sem bundler) do PropertyManager.ts do Bruno.
 * Expõe globalmente window.HAPropertyManager.sendPropertyToWebhook(payload).
 *
 * Fluxo (mantido idêntico ao TS original):
 *  1. Para cada File em payload.foto:
 *     a) POST em /media/presigned para obter { upload_url, final_url }.
 *     b) PUT do arquivo binário em upload_url.
 *     c) POST dos metadados do imóvel + media_url para o webhook
 *        adminWISEUPTECHmedias.
 *  2. Se não houver arquivos, envia apenas os dados (uma única chamada
 *     ao webhook com media_url vazio).
 */
(function () {
  'use strict';

  var API_URL = 'https://services.wiseuptech.com.br/media/presigned';
  var MEDIA_PROCESSING_URL = 'https://webhook.wiseuptech.com.br/webhook/adminWISEUPTECHmedias';
  var DATABASE_NAME = 'helenoalvesbc';
  var TENANT_ID = '1911202511';
  var DATABASE_PLATFORM = 'plataform_one';

  async function uploadFileToMinIO(file) {
    try {
      var presignedResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          database_name: DATABASE_NAME,
          content_type: file.type
        })
      });

      if (!presignedResponse.ok) {
        var errorText = await presignedResponse.text();
        throw new Error('[uploadService] Erro ao obter presigned URL: ' + presignedResponse.status + ' - ' + errorText);
      }

      var presignedData = await presignedResponse.json();
      console.log('[uploadService] 📤 Presigned URL obtida para:', file.name);

      var uploadResponse = await fetch(presignedData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      if (!uploadResponse.ok) {
        throw new Error('[uploadService] Erro ao fazer upload: ' + uploadResponse.status);
      }

      console.log('[uploadService] ✅ Upload concluído:', file.name, '→', presignedData.final_url);
      return presignedData.final_url;
    } catch (error) {
      console.error('[uploadService] ❌ Erro no upload de ' + file.name + ':', error);
      throw error;
    }
  }

  async function sendMediaToBackend(mediaUrl, payload, index, total) {
    try {
      var mediaPayload = {
        titulo: payload.titulo,
        descricao: payload.descricao,
        cidade: payload.cidade,
        bairro: payload.bairro,
        rua: payload.rua,
        cep: payload.cep,
        numero: payload.numero,
        valor: payload.valor,
        negociacao: payload.negociacao,
        tipo: payload.tipo,
        quartos: payload.quartos,
        banheiros: payload.banheiros,
        vagas: payload.vagas,
        metros: payload.metros,
        condominio: payload.condominio,
        valorNegociacao: payload.valorNegociacao,
        valorLocacao: payload.valorLocacao,
        phone: payload.phone,
        email: payload.email,
        message: payload.message,
        area: payload.area,
        quarto: payload.quarto,
        banheiro: payload.banheiro,
        vaga: payload.vaga,
        endereco: payload.endereco,
        finalidade: payload.finalidade,
        event_name: payload.event_name,
        caracteristicas: payload.caracteristicas,
        comodidades: payload.comodidades,
        nome: payload.nome,
        tenant_id: TENANT_ID,
        database_name: DATABASE_NAME,
        media_url: mediaUrl,
        media_index: index,
        total_medias: total,
        database_platform: DATABASE_PLATFORM
      };

      console.log('[uploadService] 📤 Enviando mídia ' + (index + 1) + '/' + total + ' para o backend...');

      var response = await fetch(MEDIA_PROCESSING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaPayload)
      });

      if (!response.ok) {
        var errorText = await response.text();
        throw new Error('Erro ao enviar mídia para o backend: ' + response.status + ' - ' + errorText);
      }

      console.log('[uploadService] ✅ Mídia ' + (index + 1) + '/' + total + ' enviada com sucesso: ' + mediaUrl);
    } catch (error) {
      console.error('[uploadService] ❌ Erro ao enviar mídia ' + (index + 1) + ' para o backend:', error);
      throw error;
    }
  }

  async function sendPropertyToWebhook(payload) {
    try {
      console.log('[uploadService] 📦 Iniciando envio de propriedade...');

      var fotos = Array.isArray(payload && payload.foto) ? payload.foto.filter(Boolean) : [];

      if (fotos.length > 0) {
        console.log('[uploadService] 📁 Total de arquivos para upload:', fotos.length);

        for (var i = 0; i < fotos.length; i++) {
          var file = fotos[i];
          var mediaUrl = await uploadFileToMinIO(file);
          await sendMediaToBackend(mediaUrl, payload, i, fotos.length);
        }

        console.log('[uploadService] ✅ Todos os arquivos foram enviados com sucesso!');
      } else {
        console.log('[uploadService] ℹ️ Nenhum arquivo para enviar, enviando apenas dados...');
        await sendMediaToBackend('', payload, 0, 0);
      }

      console.log('[uploadService] ✅ Propriedade processada com sucesso!');
    } catch (error) {
      console.error('[uploadService] ❌ Erro ao enviar para o webhook:', error);
      throw error;
    }
  }

  window.HAPropertyManager = {
    sendPropertyToWebhook: sendPropertyToWebhook
  };
})();